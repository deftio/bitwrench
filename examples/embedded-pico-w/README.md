# Pico W / Pico 2W Dashboard Tutorial

Build a bitwrench web dashboard served from a Raspberry Pi Pico W or Pico 2W.
The Pico runs a web server that streams sensor data to the browser over SSE.

Works with both Pico W (RP2040) and Pico 2W (RP2350) -- same pinout, same code.

**Freenove Breakout Board (FNK0081):** If you have the Freenove Breakout Board,
just plug the Pico in. Every GPIO has a buffer-isolated LED on the board.
GPIO output toggles and PWM duty changes are visible on the LEDs -- no wiring needed.

## What you will build

- Onboard temperature sensor reading
- 3 ADC channels (GP26-GP28) with voltage display
- 4 PWM outputs (GP0-GP3) with duty cycle controls
- 8 digital output toggles (GP8-GP15)
- 4 digital input pins (GP4-GP7)
- Onboard LED toggle, WiFi RSSI, memory, uptime

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

# Gzip saves flash space (~40KB vs ~130KB)
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

## Pin assignments

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

## API endpoints

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

## Troubleshooting

**Board not recognized:** Hold BOOTSEL while plugging USB. Try a different cable.

**WiFi fails:** Check SSID/password. Pico only supports 2.4 GHz.

**Dashboard shows "Connecting...":** The Pico has limited RAM. Keep concurrent
browser connections to 1-3.

**mpremote: "no device found":** Close Thonny/PuTTY -- only one program can
access the serial port.

**Freenove LEDs flicker:** Normal for unconnected (floating) pins. Set as
output with HIGH or LOW to stop.
