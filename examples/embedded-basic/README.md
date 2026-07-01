# Embedded Basic Dashboard Tutorial

Build a bitwrench-powered web dashboard served from a microcontroller. No external
peripherals needed -- the board serves a beautiful UI showing its own system stats.

## What You'll Build

A live dashboard running entirely on a microcontroller that shows:

- NeoPixel color picker (ESP32-S3) or LED toggle (Pico 2W)
- On-chip temperature
- Battery / VSYS voltage
- WiFi signal strength (RSSI)
- Free heap / PSRAM
- Uptime counter
- Board info (chip, flash size, MAC address)
- Event log

```
 +--------+          HTTP / SSE           +---------+
 | ESP32  | <---------------------------> | Browser |
 | or     |  1. Serve dashboard.html      |         |
 | Pico   |  2. Serve bitwrench.js        |         |
 |        |  3. SSE: push JSON patches    |         |
 |        |  4. POST: receive commands    |         |
 +--------+                               +---------+
   Sensors                                  bitwrench
   (on-chip)                                renders UI
```

## Boards

| Board | Chip | LED | Sketch |
|-------|------|-----|--------|
| [Unexpected Maker ESP32-S3 Pro](https://unexpectedmaker.com/esp32s3pro) | ESP32-S3 | NeoPixel (GPIO 40) | `esp32s3-pro/esp32s3_basic.ino` |
| [Raspberry Pi Pico 2W](https://www.raspberrypi.com/products/raspberry-pi-pico-2/) | RP2350 | Onboard LED (CYW43) | `pico2w/pico2w_basic.ino` |

Both boards use the same `dashboard.html` served from flash.

---

## How Bitwrench Embedded Works

The device runs an HTTP server and serves two static files from flash: a small
HTML page (`dashboard.html`, ~6 KB) and the bitwrench library (`bitwrench.umd.min.js.gz`,
~40 KB). When a browser loads the page, bitwrench renders the entire UI from
JavaScript objects -- the device never generates HTML.

Once the page is loaded, the browser opens a persistent SSE (Server-Sent Events)
connection to the device. Every 2 seconds the device reads its sensors, formats
the values as small JSON messages, and pushes them over SSE. The browser parses
each message and updates the specific DOM element by its `ref` ID.

User interactions (like picking a NeoPixel color) go the other direction: the
browser POSTs a JSON command to `/api/command`, the device parses it and acts.
The entire data flow is ~200 bytes of JSON per push -- no HTML, no templates,
no page reloads.

---

## TACO Format Primer

Bitwrench represents UI elements as plain JavaScript objects called **TACO**
(Tag-Attributes-Content-Options). Instead of writing HTML strings, you describe
elements as data:

**1. Simple element:**

```javascript
{ t: 'p', c: 'Hello World' }
// renders: <p>Hello World</p>
```

**2. With attributes:**

```javascript
{ t: 'div', a: { class: 'card', id: 'status' }, c: 'Online' }
// renders: <div class="card" id="status">Online</div>
```

**3. Nested children:**

```javascript
{ t: 'div', a: { class: 'header' }, c: [
    { t: 'h2', c: 'Dashboard' },
    { t: 'p',  c: 'System status overview' }
]}
// renders: <div class="header"><h2>Dashboard</h2><p>System status overview</p></div>
```

The fields are:
- **`t`** -- tag name (`'div'`, `'p'`, `'button'`, etc.)
- **`a`** -- attributes object (`{ class, id, style, onclick, ... }`)
- **`c`** -- content (a string, a nested TACO, or an array of TACOs)
- **`o`** -- options (lifecycle hooks, state, handles -- advanced usage)

When you call `bw.DOM('#app', taco)`, bitwrench converts the TACO tree into
real DOM elements and mounts them into `#app`.

---

## BCCL Components

Bitwrench includes pre-built component functions (BCCL -- Bitwrench Common
Component Library) that return TACO objects. The dashboard uses these extensively:

| Function | What it creates |
|----------|----------------|
| `bw.makeContainer()` | Page wrapper with max-width and padding |
| `bw.makeRow()` | Flexbox row for responsive columns |
| `bw.makeCol({ size })` | Responsive column (`xs`, `sm`, `md`, `lg` breakpoints) |
| `bw.makeCard({ title, content })` | Card with optional title and body |
| `bw.makeStatCard({ value, label })` | Compact stat display card |
| `bw.makeButton({ text, onclick })` | Styled button |
| `bw.makeTable({ data, columns })` | Table with optional sorting |
| `bw.makeSection({ title, content })` | Collapsible section |
| `bw.makeAlert({ text, variant })` | Alert banner (success, warning, danger) |
| `bw.makeListGroup({ items })` | Vertical list of items |
| `bw.makeBadge({ text, variant })` | Inline label badge |

Each function returns a TACO object, so you can nest them freely:

```javascript
bw.makeRow({ children: [
    bw.makeCol({ size: { xs: 12, md: 6 }, content:
        bw.makeCard({ title: 'Sensors', content: [
            bw.makeStatCard({ value: '23.5 C', label: 'Temperature' })
        ]})
    })
]})
```

---

## Style Pipeline

Bitwrench generates CSS from JavaScript -- no CSS files to manage. The pipeline
has three steps:

**Step 1: Load a theme from seed colors**

```javascript
bw.loadStyles({ primary: '#10b981', secondary: '#6366f1' });
```

This generates a complete CSS framework (buttons, cards, grids, typography) from
just two seed colors and injects it into the document.

**Step 2: Generate custom CSS from a JS object**

```javascript
var cssString = bw.css({
    'body': { background: '#0f172a', color: '#e2e8f0' },
    '.color-btn': { width: '36px', height: '36px', 'border-radius': '50%' }
});
```

**Step 3: Inject the CSS string**

```javascript
bw.injectCSS(cssString);
```

The dashboard combines all three:

```javascript
// Theme from seed colors
bw.loadStyles({ primary: '#10b981', secondary: '#6366f1', spacing: 'compact', radius: 'sm' });

// Custom overrides for dark embedded theme
bw.injectCSS(bw.css({
    'body': { background: '#0f172a', color: '#e2e8f0', 'font-family': 'system-ui, sans-serif' },
    '.dash-header': { 'text-align': 'center', 'margin-bottom': '1.5rem' },
    '.color-btn': { width: '36px', height: '36px', 'border-radius': '50%', border: 'none', cursor: 'pointer' },
    '.color-btn.active': { 'box-shadow': '0 0 0 3px #38bdf8' }
}));
```

---

## Dashboard Code Walkthrough

The file `dashboard.html` is a single HTML page that bitwrench turns into a
live dashboard. Here's how it works section by section.

### Loading Bitwrench

```html
<script src="/bitwrench.umd.min.js"></script>
```

The device serves this from flash (LittleFS). The `.gz` version is served with
`Content-Encoding: gzip` to save bandwidth.

### State Object

All sensor values live in a single state object:

```javascript
var state = {
    connected: false,
    board: '--', chip: '--', flash: '--', mac: '--', firmware: '--',
    temp: '--', voltage: '--', rssi: '--',
    heap: '--', psram: '--', uptime: '--',
    ledColor: '#000000', hasNeopixel: false
};
```

When SSE messages arrive, they update fields in this object. The `render()`
function reads from `state` to build the UI.

### SSE Connection

The browser opens a persistent connection to `/events`:

```javascript
function connectSSE() {
    var es = new EventSource('/events');

    es.onmessage = function(e) {
        var raw = e.data;
        // bwserve messages use r-prefix with single quotes
        if (raw.charAt(0) === 'r') raw = raw.slice(1).replace(/'/g, '"');
        try { var msg = JSON.parse(raw); } catch(x) { return; }

        if (msg.type === 'batch') {
            msg.ops.forEach(applyOp);
        } else {
            applyOp(msg);
        }
    };

    es.onopen = function() {
        state.connected = true;
        render();
    };
}
```

Messages from the device arrive as r-prefix relaxed JSON (single quotes instead
of double quotes). The handler normalizes them to standard JSON, then dispatches
each operation to `applyOp()`.

### The `applyOp()` Function

This is the core of the live-update system. Each message has a `ref` (element ID)
and `text` (new value). The function maps refs to state fields and updates the DOM:

```javascript
function applyOp(op) {
    if (op.type === 'patch' && op.ref && op.text != null) {
        var map = {
            'val-temp': 'temp',      'val-voltage': 'voltage',
            'val-rssi': 'rssi',      'val-heap': 'heap',
            'val-psram': 'psram',    'val-uptime': 'uptime',
            'val-board': 'board',    'val-chip': 'chip',
            'val-flash': 'flash',    'val-mac': 'mac',
            'val-firmware': 'firmware'
        };
        if (map[op.ref]) state[map[op.ref]] = op.text;

        // Direct DOM update for live values
        bw.el(op.ref, function(el) { el.textContent = op.text; });
    }
}
```

This means the device only needs to send `{ type: 'patch', ref: 'val-temp', text: '24.3 C' }`
and the temperature display updates instantly -- no full page re-render.

### The `render()` Function

Builds the complete TACO tree using BCCL components and mounts it to `#app`:

```javascript
function render() {
    var page = bw.makeContainer({ children: [
        // Header
        { t: 'div', a: { class: 'dash-header' }, c: [
            { t: 'h1', c: 'Embedded Dashboard' },
            bw.makeAlert({
                text: state.connected ? 'Connected to ' + state.board : 'Connecting...',
                variant: state.connected ? 'success' : 'warning'
            })
        ]},

        // NeoPixel controls (ESP32-S3 only)
        state.hasNeopixel ? bw.makeCard({ title: 'NeoPixel', content: colorBtns }) : null,

        // Stat cards row
        bw.makeRow({ children: [
            makeStatCard('Temperature', 'val-temp'),
            makeStatCard('Voltage',     'val-voltage'),
            makeStatCard('WiFi RSSI',   'val-rssi'),
            makeStatCard('Free Heap',   'val-heap'),
            makeStatCard('PSRAM',       'val-psram'),
            makeStatCard('Uptime',      'val-uptime')
        ]}),

        // Board info table
        bw.makeTable({ data: [
            { Property: 'Board',    Value: state.board },
            { Property: 'Chip',     Value: state.chip },
            { Property: 'Flash',    Value: state.flash },
            { Property: 'MAC',      Value: state.mac },
            { Property: 'Firmware', Value: state.firmware }
        ]}),

        // Event log
        bw.makeListGroup({ items: logEntries })
    ]});

    bw.DOM('#app', page);
}
```

The `render()` function is called once on page load and again whenever the
connection state changes. Individual sensor values update via `applyOp()` without
triggering a full re-render.

### Stat Cards

Each stat card is a responsive column containing a card with a label and a
live-updating value:

```javascript
function makeStatCard(label, id) {
    return bw.makeCol({ size: { xs: 6, md: 4, lg: 3 }, content:
        bw.makeCard({ className: 'bw_mb_2', content: [
            { t: 'div', a: { style: 'font-size:0.75rem;color:#94a3b8;text-transform:uppercase' }, c: label },
            { t: 'div', a: { id: id, style: 'font-size:1.3rem;font-weight:700;color:#38bdf8' },
              c: state[{ 'val-temp':'temp', 'val-voltage':'voltage', 'val-rssi':'rssi',
                         'val-heap':'heap', 'val-psram':'psram', 'val-uptime':'uptime' }[id]] || '--' }
        ]})
    });
}
```

The `id` attribute on the value `<div>` matches the `ref` in SSE patch messages,
so `applyOp()` can update it directly via `bw.el()`.

### NeoPixel Color Buttons

Eight preset colors, each a circular button that calls `setColor()`:

```javascript
var neopixelColors = [
    { name: 'Red',    hex: '#ff0000' },
    { name: 'Green',  hex: '#00ff00' },
    { name: 'Blue',   hex: '#0000ff' },
    { name: 'Cyan',   hex: '#00ffff' },
    { name: 'Purple', hex: '#8b00ff' },
    { name: 'Warm',   hex: '#ff8c00' },
    { name: 'White',  hex: '#ffffff' },
    { name: 'Off',    hex: '#000000' }
];

function setColor(hex) {
    state.ledColor = hex;
    sendCmd('set_color', { color: hex });
    render();
}

function sendCmd(cmd, data) {
    fetch('/api/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.assign({ cmd: cmd }, data || {}))
    });
}
```

---

## Sketch Code Walkthrough (ESP32-S3 Pro)

The Arduino sketch (`esp32s3-pro/esp32s3_basic.ino`) runs on the device. It
handles WiFi, file serving, SSE streaming, and commands.

### Includes -- Header-Only, No Compilation

```cpp
#include <WiFi.h>
#include <ESPAsyncWebServer.h>
#include <LittleFS.h>
#include <Adafruit_NeoPixel.h>
#include "bitwrench.h"   // bw_format_bytes(), BW_BUF_SIZE
#include "bwserve.h"     // BW_PATCH, bw_batch_*, BW_SSE_FRAME
```

`bitwrench.h` and `bwserve.h` are header-only C files -- just copy them into your
sketch folder. No library installation, no compilation step.

### Server Setup

```cpp
AsyncWebServer server(80);
AsyncEventSource events("/events");

void setup() {
    // ... WiFi + LittleFS init ...

    // Serve static files from flash
    server.serveStatic("/", LittleFS, "/").setDefaultFile("dashboard.html");

    // SSE endpoint
    events.onConnect([](AsyncEventSourceClient* client) {
        initialInfoSent = false;  // Send board info to new client
    });
    server.addHandler(&events);

    // Command endpoint
    server.on("/api/command", HTTP_POST, [](AsyncWebServerRequest* req) {},
        NULL, handleCommand);

    server.begin();
}
```

### Sending Sensor Data with `BW_PATCH`

The `BW_PATCH` macro builds a bwserve protocol message. Multiple patches are
batched into a single SSE frame:

```cpp
void sendSensorData() {
    bw_batch_t batch;
    bw_batch_begin(&batch);
    char m[BW_BUF_SIZE];

    // Temperature
    char tempStr[16];
    snprintf(tempStr, sizeof(tempStr), "%.1f C", temperatureRead());
    BW_PATCH(m, "val-temp", tempStr);
    bw_batch_add(&batch, m);

    // WiFi RSSI
    char rssiStr[16];
    snprintf(rssiStr, sizeof(rssiStr), "%d dBm", WiFi.RSSI());
    BW_PATCH(m, "val-rssi", rssiStr);
    bw_batch_add(&batch, m);

    // Free heap
    char heapStr[32];
    bw_format_bytes(heapStr, sizeof(heapStr), ESP.getFreeHeap());
    BW_PATCH(m, "val-heap", heapStr);
    bw_batch_add(&batch, m);

    // ... voltage, PSRAM, uptime patches ...

    // Send all patches as one SSE frame
    char out[BW_BUF_SIZE * 4];
    bw_batch_end(out, sizeof(out), &batch);
    events.send(out, NULL, millis());
}
```

The `BW_PATCH(m, "val-temp", "23.5 C")` macro produces:
```
r{'v':1,'type':'patch','ref':'val-temp','text':'23.5 C'}
```

The batch builder collects these, strips the `r` prefix from each, and wraps
them in a single batch message.

### Board Info (Sent Once)

Static board info is sent once when a browser connects:

```cpp
void sendBoardInfo() {
    bw_batch_t batch;
    bw_batch_begin(&batch);
    char m[BW_BUF_SIZE];

    BW_PATCH(m, "val-board", "ESP32-S3 Pro");
    bw_batch_add(&batch, m);

    BW_PATCH(m, "val-chip", chipStr);   // "ESP32-S3 rev5 (2 cores)"
    bw_batch_add(&batch, m);

    BW_PATCH(m, "val-flash", flashStr); // "16 MB"
    bw_batch_add(&batch, m);

    BW_PATCH(m, "val-mac", macStr);     // "AA:BB:CC:DD:EE:FF"
    bw_batch_add(&batch, m);

    BW_PATCH(m, "val-neopixel", "1");   // Tell dashboard to show NeoPixel controls
    bw_batch_add(&batch, m);

    char out[BW_BUF_SIZE * 4];
    bw_batch_end(out, sizeof(out), &batch);
    events.send(out, NULL, millis());
}
```

### Command Handler

Parses the JSON POST body and acts on commands:

```cpp
void handleCommand(AsyncWebServerRequest* req, uint8_t* data, size_t len,
                   size_t index, size_t total) {
    char body[256];
    memcpy(body, data, len < 255 ? len : 255);
    body[len < 255 ? len : 255] = '\0';

    if (strstr(body, "set_color")) {
        // Extract "#ff0000" from {"cmd":"set_color","color":"#ff0000"}
        const char* hexStart = strchr(strstr(body, "color"), '#');
        if (hexStart) {
            uint32_t color = parseHexColor(hexStart);
            pixel.setPixelColor(0, color);
            pixel.show();
        }
    } else if (strstr(body, "toggle_led")) {
        currentColor = currentColor == 0 ? pixel.Color(255,255,255) : 0;
        pixel.setPixelColor(0, currentColor);
        pixel.show();
    }

    req->send(200, "application/json", "{\"ok\":true}");
}
```

### The Main Loop

```cpp
void loop() {
    unsigned long now = millis();

    // Send board info once after first browser connects
    if (!initialInfoSent && events.count() > 0) {
        sendBoardInfo();
        initialInfoSent = true;
    }

    // Push sensor data every 2 seconds
    if (now - lastPush >= SSE_INTERVAL_MS) {
        lastPush = now;
        if (events.count() > 0) {
            sendSensorData();
        }
    }
}
```

---

## Pico 2W Differences

The Pico 2W sketch (`pico2w/pico2w_basic.ino`) uses the same dashboard but
differs in the server layer:

| Aspect | ESP32-S3 Pro | Pico 2W |
|--------|-------------|---------|
| Web server | `ESPAsyncWebServer` (async) | `WebServer` (synchronous) |
| SSE | `AsyncEventSource` built-in | Manual client tracking (`WiFiClient[]`) |
| LED | NeoPixel (`Adafruit_NeoPixel`) | Onboard LED (`digitalWrite`) |
| Temperature | `temperatureRead()` | `analogReadTemp()` |
| Heap | `ESP.getFreeHeap()` | `rp2040.getFreeHeap()` |
| PSRAM | `ESP.getFreePsram()` | N/A |
| Loop | No `handleClient()` needed | Must call `server.handleClient()` |

The Pico sketch manually manages SSE clients:

```cpp
#define MAX_SSE_CLIENTS 4
WiFiClient sseClients[MAX_SSE_CLIENTS];

void sseBroadcast(const char* data) {
    char frame[BW_BUF_SIZE * 2];
    BW_SSE_FRAME(frame, data);
    for (int i = 0; i < sseClientCount; i++) {
        if (sseClients[i].connected())
            sseClients[i].write(frame, strlen(frame));
    }
}
```

Board info reports `"val-neopixel": "0"`, so the dashboard hides the NeoPixel
color picker and shows a simple LED toggle button instead.

---

## Python Variants

The same dashboard works with CircuitPython and MicroPython servers:

| File | Language | Board | Notes |
|------|----------|-------|-------|
| `esp32s3-pro/basic_circuitpython.py` | CircuitPython | ESP32-S3 Pro | Uses `adafruit_httpserver` + `SSEResponse` |
| `pico2w/basic_micropython.py` | MicroPython | Pico 2W | Raw socket HTTP server, no libraries |

Both use a `bwserve` Python module with `bwserve.patch()` and `bwserve.batch()`:

```python
# CircuitPython example
msg = bwserve.batch(
    bwserve.patch("val-temp", f"{microcontroller.cpu.temperature:.1f} C"),
    bwserve.patch("val-voltage", "USB"),
    bwserve.patch("val-rssi", f"{wifi.radio.ap_info.rssi} dBm"),
    bwserve.patch("val-heap", f"{gc.mem_free() // 1024} KB"),
    bwserve.patch("val-uptime", f"{h}h {m}m {s}s"),
)
broadcast(msg)
```

The MicroPython version on Pico 2W reads the on-die temperature sensor directly:

```python
def read_temp():
    raw = temp_sensor.read_u16()
    voltage = raw * 3.3 / 65535
    return 27 - (voltage - 0.706) / 0.001721  # RP2350 datasheet formula
```

---

## BOM

### ESP32-S3 Pro

| Item | Notes |
|------|-------|
| Unexpected Maker ESP32-S3 Pro | Any ESP32-S3 with NeoPixel works |
| USB-C cable | Power + programming |

### Pico 2W

| Item | Notes |
|------|-------|
| Raspberry Pi Pico 2W | RP2350, WiFi built-in |
| Micro-USB cable | Power + programming |

---

## Setup

### 1. Install board support

**ESP32-S3 Pro (Arduino IDE):**
- File > Preferences > Additional Board URLs: `https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json`
- Tools > Board > Board Manager > search "esp32" > install
- Select board: "ESP32S3 Dev Module" or "Unexpected Maker ESP32-S3"

**Pico 2W (Arduino IDE):**
- File > Preferences > Additional Board URLs: `https://github.com/earlephilhower/arduino-pico/releases/download/global/package_rp2040_index.json`
- Tools > Board > Board Manager > search "pico" > install "Raspberry Pi Pico/RP2040/RP2350"
- Select board: "Raspberry Pi Pico 2W"

### 2. Install libraries

**ESP32-S3 Pro:**
- `ESPAsyncWebServer` (me-no-dev)
- `AsyncTCP` (me-no-dev)
- `Adafruit NeoPixel`

**Pico 2W:**
- No additional libraries needed (WebServer and LittleFS built into arduino-pico)

### 3. Prepare flash filesystem

Create a `data/` folder next to your `.ino` file with these files:

```
data/
  dashboard.html             <- copy from this directory
  bitwrench.umd.min.js.gz   <- gzip -k dist/bitwrench.umd.min.js
```

Copy `bitwrench.h` and `bwserve.h` from `embedded_c/` into your sketch folder.

### 4. Upload filesystem

**ESP32-S3 Pro:**
- Install the "ESP32 LittleFS Upload" plugin for Arduino IDE
- Tools > ESP32 Sketch Data Upload

**Pico 2W:**
- Install the "RP2040 LittleFS Upload" plugin
- Tools > Pico LittleFS Data Upload

### 5. Upload sketch

- Edit `WIFI_SSID` and `WIFI_PASS` in the sketch
- Upload via Arduino IDE
- Open Serial Monitor (115200 baud) to see the IP address
- Navigate to `http://<ip-address>/` in your browser

---

## Flash Usage

| File | Size |
|------|------|
| `dashboard.html` | ~6 KB |
| `bitwrench.umd.min.js.gz` | ~40 KB |
| **Total** | **~46 KB** |

ESP32-S3 Pro has 16 MB flash. Pico 2W has 4 MB. Plenty of room.

---

## Customization Guide

### Adding a New Sensor

1. **Pick a ref ID** (e.g., `val-light`).

2. **Add the patch in the sketch** (inside `sendSensorData()`):
   ```cpp
   char lightStr[16];
   snprintf(lightStr, sizeof(lightStr), "%d lux", analogRead(LIGHT_PIN));
   BW_PATCH(m, "val-light", lightStr);
   bw_batch_add(&batch, m);
   ```

3. **Add a stat card in the dashboard** (inside `render()`):
   ```javascript
   makeStatCard('Light', 'val-light')
   ```

That's it. The SSE patch will find the element by its `id` and update the text.

### Adding a New Control

1. **Add a button in the dashboard** `render()` function:
   ```javascript
   bw.makeButton({
       text: 'Buzz',
       variant: 'warning',
       onclick: function() { sendCmd('buzz', { duration: 500 }); }
   })
   ```

2. **Handle the command in the sketch**:
   ```cpp
   if (strstr(body, "buzz")) {
       int duration = 500; // parse from JSON if needed
       tone(BUZZER_PIN, 1000, duration);
   }
   ```

### Changing the Theme

Modify the seed colors in `dashboard.html`:

```javascript
bw.loadStyles({ primary: '#e11d48', secondary: '#0ea5e9' });  // rose + sky
```

This regenerates the entire CSS framework with your new palette.

### Changing the Layout

The layout is just a TACO tree in `render()`. Rearrange the components, change
column sizes, add sections:

```javascript
// Change stat cards from 4-column to 3-column layout
makeStatCard('Temperature', 'val-temp')
// Change size from { xs: 6, md: 4, lg: 3 } to { xs: 12, md: 4 }
```

---

## Troubleshooting

**WiFi won't connect:** Check that your SSID and password are correct. Both
boards only support 2.4 GHz WiFi networks.

**Blank dashboard (white page):** Make sure `bitwrench.umd.min.js.gz` was
uploaded to the flash filesystem. Check the browser console for 404 errors.

**SSE not connecting ("Connecting..." stays):** Open the browser console and
check for errors. Make sure `events("/events")` is registered in the sketch.
Try accessing `http://<ip>/events` directly -- you should see a streaming response.

**LittleFS upload fails:** For ESP32, make sure the LittleFS upload plugin
matches your Arduino IDE version. For Pico, try disconnecting and reconnecting
while holding BOOTSEL, then re-upload.

**NeoPixel doesn't light up:** Check that `NEOPIXEL_PIN` matches your board.
The Unexpected Maker ESP32-S3 Pro uses GPIO 40. Other boards may differ.

**Serial monitor shows no IP:** The board may be failing to connect to WiFi.
Double-check credentials and ensure you're using a 2.4 GHz network.
