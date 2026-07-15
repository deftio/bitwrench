# Pico W / Pico 2W Dashboard Tutorial

Build a bitwrench web dashboard served from a Raspberry Pi Pico W or Pico 2W.
The Pico runs a web server that streams sensor data to the browser over SSE.

Works with both Pico W (RP2040) and Pico 2W (RP2350) -- same pinout, same code.

**Freenove Breakout Board (FNK0081):** If you have the Freenove Breakout Board,
just plug the Pico in. Every GPIO has a buffer-isolated LED on the board.
GPIO output toggles and PWM duty changes are visible on the LEDs -- no wiring needed.

## What You'll Build

- Onboard temperature sensor reading
- 3 ADC channels (GP26-GP28) with voltage display
- 4 PWM outputs (GP0-GP3) with duty cycle controls
- 8 digital output toggles (GP8-GP15)
- 4 digital input pins (GP4-GP7)
- Onboard LED toggle, WiFi RSSI, memory, uptime

```
 +--------+          HTTP / SSE           +---------+
 | Pico W | <---------------------------> | Browser |
 |        |  1. Serve dashboard.html      |         |
 |        |  2. Serve bitwrench.js        |         |
 |        |  3. SSE: push sensor JSON     |         |
 |        |  4. POST: receive commands    |         |
 +--------+                               +---------+
   ADC, PWM,                                bitwrench
   GPIO, Temp                               renders UI
```

---

## How Bitwrench Works

If you're new to bitwrench, here's a quick overview. For the full primer, see
the [basic example tutorial](../embedded-basic/README.md).

### TACO Format

Bitwrench describes UI elements as JavaScript objects called TACO:

```javascript
// Simple element
{ t: 'p', c: 'Hello World' }

// With attributes
{ t: 'div', a: { class: 'card', id: 'status' }, c: 'Online' }

// Nested children
{ t: 'div', c: [
    { t: 'h2', c: 'Dashboard' },
    { t: 'p',  c: 'All systems nominal' }
]}
```

When you call `bw.DOM('#app', taco)`, bitwrench converts this tree into real DOM
elements and mounts them. No HTML strings, no innerHTML.

### Style Pipeline

Three steps to a themed UI:

```javascript
bw.loadStyles({ primary: '#e11d48', secondary: '#0ea5e9' }); // Generate theme CSS
var css = bw.css({ 'body': { background: '#0f172a' } });      // Custom CSS from JS object
bw.injectCSS(css);                                             // Insert <style> tag
```

### Architecture: SSE + REST

This example uses a slightly different pattern than the basic example:

- **SSE (Server-Sent Events):** The server pushes a full sensor payload every
  2 seconds as a named `sensors` event. The browser re-renders the entire UI on
  each update.
- **REST POST:** Button clicks send POST requests to `/api/led`, `/api/pwm/<ch>`,
  or `/api/gpio/<pin>` with JSON bodies.

This is a poll-and-render model: the server pushes complete state, and the
browser rebuilds the UI from scratch each time. This is simpler than the patch
model used in the basic example, at the cost of slightly more bandwidth.

---

## Dashboard Code Walkthrough

The `dashboard.html` file renders a comprehensive GPIO/sensor dashboard using
BCCL components.

### Theme and Styling

```javascript
bw.loadStyles({ primary: '#e11d48', secondary: '#0ea5e9', spacing: 'compact', radius: 'sm' });
bw.injectCSS(bw.css({
    'body': { background: '#0f172a', color: '#e2e8f0', margin: '0' }
}));
```

### SSE Connection

The browser connects to `/events` and listens for `sensors` events:

```javascript
function connectSSE() {
    var es = new EventSource('/events');

    es.addEventListener('sensors', function(e) {
        var payload = JSON.parse(e.data);
        // Merge entire payload into state
        for (var key in payload) {
            if (payload.hasOwnProperty(key)) state[key] = payload[key];
        }
        if (!connected) {
            connected = true;
            addLog(state.board + ' (' + state.chip + ') connected');
        }
        render();  // Full re-render on each update
    });

    es.onerror = function() {
        connected = false;
        render();
    };
}
```

Unlike the basic example's patch model, this receives the entire sensor state
as one JSON object and re-renders the full page.

### REST Controls

Button clicks send POST requests and update local state from the response:

```javascript
function postApi(path, body) {
    return fetch(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    }).then(function(r) { return r.json(); });
}

function toggleLed() {
    postApi('/api/led', {}).then(function(data) {
        state.led = data.led;
        addLog('Onboard LED ' + (state.led ? 'ON' : 'OFF'));
        render();
    });
}

function setPwm(ch, val) {
    postApi('/api/pwm/' + ch, { duty: val }).then(function(data) {
        state.pwm[data.channel] = data.duty;
        addLog('PWM' + data.channel + ' set to ' + data.duty + '%');
        render();
    });
}

function toggleGpio(pin) {
    postApi('/api/gpio/' + pin, {}).then(function(data) {
        state.gpioOut[data.pin - 8] = data.state;
        addLog('GP' + data.pin + ' ' + (data.state ? 'HIGH' : 'LOW'));
        render();
    });
}
```

### BCCL Components Used

The `render()` function builds the page from BCCL components:

**System stat cards:**

```javascript
bw.makeStatCard({
    value: state.onboardTemp.toFixed(1) + '\u00B0C',
    label: state.chip + ' Temp',
    variant: state.onboardTemp > 50 ? 'danger' : 'primary'
})
```

**LED control card:**

```javascript
bw.makeCard({
    title: 'Onboard LED (CYW43)',
    content: [
        bw.makeBadge({ text: state.led ? 'ON' : 'OFF',
                       variant: state.led ? 'success' : 'secondary', pill: true }),
        bw.makeButton({ text: state.led ? 'Turn Off' : 'Turn On',
                        onclick: toggleLed })
    ]
})
```

**ADC voltage cards (built from array):**

```javascript
var adcCards = state.adc.map(function(v, i) {
    var pct = Math.round((v / 3.3) * 100);
    return bw.makeCol({ size: { xs: 12, md: 4 }, content:
        bw.makeCard({
            title: 'ADC' + i + ' (GP' + (26 + i) + ')',
            content: [
                { t: 'div', c: v.toFixed(3) + ' V' },
                bw.makeProgress({ value: pct, label: pct + '%' })
            ]
        })
    });
});
```

**PWM duty cycle controls:**

```javascript
state.pwm.map(function(duty, ch) {
    return bw.makeCard({
        title: 'PWM' + ch + ' (GP' + ch + ')',
        content: [
            bw.makeProgress({ value: duty, label: duty + '%', variant: 'info' }),
            bw.makeButtonGroup({ children: [
                bw.makeButton({ text: '0%',   onclick: function() { setPwm(ch, 0); } }),
                bw.makeButton({ text: '25%',  onclick: function() { setPwm(ch, 25); } }),
                bw.makeButton({ text: '50%',  onclick: function() { setPwm(ch, 50); } }),
                bw.makeButton({ text: '100%', onclick: function() { setPwm(ch, 100); } })
            ]})
        ]
    });
})
```

**Digital output toggles (GP8-GP15):**

```javascript
state.gpioOut.map(function(v, i) {
    var pin = 8 + i;
    return bw.makeCard({
        content: [
            bw.makeBadge({ text: v ? 'HIGH' : 'LOW',
                           variant: v ? 'success' : 'secondary' }),
            bw.makeButton({
                text: v ? 'Set LOW' : 'Set HIGH',
                onclick: (function(p) { return function() { toggleGpio(p); }; })(pin)
            })
        ]
    });
})
```

**Digital input table:**

```javascript
bw.makeTable({
    data: state.digitalIn.map(function(v, i) {
        return { Pin: 'GP' + (4 + i), State: v ? 'HIGH' : 'LOW', Logic: v ? '1' : '0' };
    }),
    columns: [
        { key: 'Pin', label: 'Pin' },
        { key: 'State', label: 'State', render: function(val) {
            return bw.makeBadge({ text: val, variant: val === 'HIGH' ? 'success' : 'secondary' });
        }},
        { key: 'Logic', label: 'Logic Level' }
    ],
    striped: true
})
```

---

## Server Code Walkthrough

All three server implementations serve the same dashboard and expose the same
REST API + SSE endpoints. They differ only in language and framework.

### MicroPython (`server.py`)

Uses microdot for HTTP routing and SSE. Pin arrays define the hardware mapping:

```python
# Pin definitions as arrays
adc_channels = [ADC(26), ADC(27), ADC(28)]       # 3 ADC inputs
digital_inputs = [Pin(4, Pin.IN, Pin.PULL_DOWN),  # 4 digital inputs
                  Pin(5, Pin.IN, Pin.PULL_DOWN),
                  Pin(6, Pin.IN, Pin.PULL_DOWN),
                  Pin(7, Pin.IN, Pin.PULL_DOWN)]
pwm_channels = [PWM(Pin(i)) for i in range(4)]    # 4 PWM outputs
gpio_outputs = [Pin(8+i, Pin.OUT) for i in range(8)]  # 8 digital outputs
```

Sensor payload assembled as a dict and pushed via SSE:

```python
@app.route("/events")
@with_sse
def sse_events(request, sse):
    while True:
        payload = build_sensor_payload(wlan, boot_time)
        sse.send(json.dumps(payload), event="sensors")
        time.sleep(2)
```

POST endpoints modify hardware state:

```python
@app.post("/api/pwm/<ch>")
def api_pwm(request, ch):
    ch = int(ch)
    duty_pct = max(0, min(100, int(request.json["duty"])))
    pwm_channels[ch].duty_u16(int(duty_pct * 65535 / 100))
    return {"ok": True, "channel": ch, "duty": duty_pct}
```

### CircuitPython (`server_circuitpython.py`)

Same pin array pattern but uses CircuitPython's `digitalio`, `analogio`, and
`pwmio` modules:

```python
adc_channels = [analogio.AnalogIn(pin) for pin in [board.GP26, board.GP27, board.GP28]]
pwm_channels = [pwmio.PWMOut(pin, frequency=1000, duty_cycle=0) for pin in [board.GP0, board.GP1, board.GP2, board.GP3]]
```

Uses `adafruit_httpserver` with `SSEResponse` for streaming.

### Arduino C++ (`server.ino`)

Uses `WebServer` from the arduino-pico core. Dynamic route registration:

```cpp
const int PWM_PINS[] = {0, 1, 2, 3};
const int DOUT_PINS[] = {8, 9, 10, 11, 12, 13, 14, 15};

// Register routes dynamically in setup()
for (int i = 0; i < PWM_COUNT; i++) {
    String path = "/api/pwm/" + String(i);
    server.on(path.c_str(), HTTP_POST, handleApiPwm);
}
```

SSE push every 2 seconds from `loop()`:

```cpp
void loop() {
    server.handleClient();
    if (millis() - lastSSEPush >= SSE_INTERVAL_MS) {
        lastSSEPush = millis();
        String payload = buildSensorJSON();
        String sseData = "event: sensors\ndata: " + payload + "\n\n";
        for (int i = 0; i < sseClientCount; i++) {
            if (sseClients[i].connected()) sseClients[i].print(sseData);
        }
    }
}
```

---

## Prerequisites

### Hardware

- Raspberry Pi Pico W or Pico 2W
- USB cable (micro-USB for Pico W, USB-C for Pico 2W)
- WiFi network (2.4 GHz)
- *Optional:* Freenove Breakout Board for Raspberry Pi Pico (FNK0081)

### Software

- Python 3.x on your computer
- `pip install mpremote` (for MicroPython/CircuitPython) or Arduino IDE (for C++)

### Server implementations

| File | Language | Framework |
|------|----------|-----------|
| [server.py](server.py) | MicroPython | microdot + SSE |
| [server_circuitpython.py](server_circuitpython.py) | CircuitPython | adafruit_httpserver |
| [server.ino](server.ino) | Arduino C++ | arduino-pico WiFi + WebServer |

All three serve the same `dashboard.html` and expose the same REST API + SSE endpoints.

---

## Option A: MicroPython (recommended)

### Step 1: Install MicroPython

Download the MicroPython firmware (.uf2) from [micropython.org/download](https://micropython.org/download/):
- **Pico W:** search for "Pico W"
- **Pico 2W:** search for "Pico 2W"

Flash it:
1. Hold **BOOTSEL** while plugging the USB cable into your computer
2. A drive called `RPI-RP2` appears
3. Drag the `.uf2` file onto the `RPI-RP2` drive
4. The board reboots with MicroPython installed

### Step 2: Install microdot

```bash
pip install mpremote

mpremote mip install github:miguelgrinberg/microdot/src/microdot.py
mpremote mip install github:miguelgrinberg/microdot/src/microdot/sse.py
```

### Step 3: Configure WiFi

Edit `server.py` and set your WiFi credentials:

```python
WIFI_SSID = "YOUR_SSID"
WIFI_PASSWORD = "YOUR_PASSWORD"
```

### Step 4: Upload files

```bash
mpremote mkdir :www
mpremote mkdir :www/dist

mpremote cp dashboard.html :www/index.html

# Gzip saves flash space (~45KB vs ~165KB)
gzip -k ../../dist/bitwrench.umd.min.js
mpremote cp ../../dist/bitwrench.umd.min.js.gz :www/dist/bitwrench.umd.min.js.gz

# Upload server as main.py (auto-runs on boot)
mpremote cp server.py :main.py
```

### Step 5: Connect and test

Reset the board (unplug/replug USB). Check serial output for the IP address:

```bash
mpremote connect auto
```

Open your browser to the IP address shown (e.g., `http://192.168.1.42/`).

## Option B: CircuitPython

### Step 1: Install CircuitPython

Download the CircuitPython firmware (.uf2) from [circuitpython.org/downloads](https://circuitpython.org/downloads):
- Search for "Pico W" or "Pico 2W"

Flash it the same way as MicroPython (hold BOOTSEL, drag .uf2).

### Step 2: Install libraries

Download the [Adafruit CircuitPython Bundle](https://circuitpython.org/libraries).
Copy these to the Pico's `/lib/` folder:
- `adafruit_httpserver/` (directory)

### Step 3: Configure WiFi

Create `settings.toml` on the Pico:

```toml
CIRCUITPY_WIFI_SSID = "YOUR_SSID"
CIRCUITPY_WIFI_PASSWORD = "YOUR_PASSWORD"
```

### Step 4: Upload files

Copy to the Pico's CIRCUITPY drive:
- `server_circuitpython.py` as `code.py`
- `dashboard.html` into `www/index.html`
- `bitwrench.umd.min.js.gz` into `www/dist/` (gzip -k dist/bitwrench.umd.min.js)

### Step 5: Connect and test

The board auto-runs code.py on boot. Check the serial console for the IP address.

## Option C: Arduino C++

### Step 1: Install Arduino IDE + Pico board support

1. Install [Arduino IDE](https://www.arduino.cc/en/software)
2. Add the Pico board manager URL in Preferences > Additional Board Manager URLs:
   `https://github.com/earlephilhower/arduino-pico/releases/download/global/package_rp2040_index.json`
3. Install "Raspberry Pi Pico/RP2040/RP2350" from Board Manager
4. Select your board: Tools > Board > "Raspberry Pi Pico W" or "Raspberry Pi Pico 2W"

### Step 2: Upload SPIFFS data

The dashboard HTML and bitwrench JS are served from the Pico's LittleFS filesystem.
Prepare the `data/` directory:

```
data/
  index.html                  <- copy of dashboard.html
  dist/
    bitwrench.umd.min.js.gz  <- gzip -k dist/bitwrench.umd.min.js
```

Upload with: Tools > "Pico LittleFS Data Upload"

### Step 3: Configure WiFi

Edit `server.ino` and set your WiFi credentials:

```cpp
const char* WIFI_SSID = "YOUR_SSID";
const char* WIFI_PASSWORD = "YOUR_PASSWORD";
```

### Step 4: Upload and test

Upload the sketch via Arduino IDE (Sketch > Upload).
Open Serial Monitor (115200 baud) to see the IP address.

---

## Pin Assignments

| Pin(s) | Function | Notes |
|--------|----------|-------|
| GP0-GP3 | PWM outputs | 4 channels, 1 kHz, 16-bit duty cycle |
| GP4-GP7 | Digital inputs | Internal pull-down resistors |
| GP8-GP15 | Digital outputs | Togglable from dashboard |
| GP26 (ADC0) | Analog input | 12-bit, 0-3.3V range |
| GP27 (ADC1) | Analog input | 12-bit, 0-3.3V range |
| GP28 (ADC2) | Analog input | 12-bit, 0-3.3V range |
| ADC4 | Temperature sensor | Internal -- no external pin |
| CYW43 LED | Onboard LED | Controlled via WiFi chip driver |

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Serve dashboard HTML |
| GET | `/dist/<path>` | Serve static assets (bitwrench JS) |
| GET | `/api/sensors` | JSON snapshot of all sensor readings |
| GET | `/events` | SSE stream (pushes every 2 seconds) |
| POST | `/api/led` | Toggle onboard LED: `{ "state": 0|1 }` |
| POST | `/api/pwm/<ch>` | Set PWM duty: `{ "duty": 0-100 }` |
| POST | `/api/gpio/<pin>` | Toggle GPIO: `{ "state": 0|1 }` |

## Pico W vs Pico 2W

| | Pico W | Pico 2W |
|--|--------|---------|
| Chip | RP2040 | RP2350 |
| CPU | Dual Cortex-M0+ @ 133 MHz | Dual Cortex-M33 @ 150 MHz |
| SRAM | 264 KB | 520 KB |
| Flash | 2 MB | 4 MB |
| WiFi | CYW43439 (2.4 GHz) | CYW43439 (2.4 GHz) |
| USB | Micro-USB | USB-C |
| Price | ~$6 | ~$7 |

Both boards use the same code. The server auto-detects the board type at startup.

---

## Customization Guide

### Adding a Sensor to an Existing Section

To add a fourth ADC channel or an external I2C sensor, extend the sensor
payload and add a card:

**Server side** (MicroPython example):

```python
# Add to build_sensor_payload():
payload["externalTemp"] = read_external_sensor()
```

**Dashboard side:**

```javascript
// Add in render() alongside existing stat cards:
bw.makeStatCard({
    value: state.externalTemp.toFixed(1) + '\u00B0C',
    label: 'External Temp',
    variant: 'info'
})
```

### Adding a New Card Section

Create a section with a title and content:

```javascript
bw.makeSection({
    title: 'My Custom Section',
    content: [
        bw.makeRow({ children: [
            bw.makeCol({ size: { xs: 6 }, content:
                bw.makeCard({ title: 'Sensor A', content: [
                    { t: 'div', c: state.sensorA + ' units' }
                ]})
            }),
            bw.makeCol({ size: { xs: 6 }, content:
                bw.makeCard({ title: 'Sensor B', content: [
                    { t: 'div', c: state.sensorB + ' units' }
                ]})
            })
        ]})
    ]
})
```

### Changing the Color Theme

Modify the seed colors:

```javascript
bw.loadStyles({ primary: '#10b981', secondary: '#6366f1' });  // emerald + indigo
```

This regenerates the entire CSS framework with your new palette.

---

## Troubleshooting

**Board not recognized:** Hold BOOTSEL while plugging USB. Try a different cable.

**WiFi fails:** Check SSID/password. Pico only supports 2.4 GHz.

**Dashboard shows "Connecting...":** The Pico has limited RAM. Keep concurrent
browser connections to 1-3.

**mpremote: "no device found":** Close Thonny/PuTTY -- only one program can
access the serial port.

**Freenove LEDs flicker:** Normal for unconnected (floating) pins. Set as
output with HIGH or LOW to stop.
