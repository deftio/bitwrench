# Embedded IoT Examples

Bitwrench-powered dashboards for embedded devices. The device sends JSON data
over SSE -- the browser renders everything using bitwrench. The device never
generates HTML.

## Examples

### ESP32 / Microcontroller

| Example | Platform | Language | Level | Server Code |
|---------|----------|----------|-------|-------------|
| [ESP32 Dashboard](esp32-dashboard.html) | ESP32 DevKit | Arduino C++ | Beginner | [sketch.ino](sketch.ino) |
| [Pico W / Pico 2W Tutorial](../embedded-pico-w/) | Pico W / Pico 2W | MicroPython, CircuitPython, C++ | Intermediate | [server.py](../embedded-pico-w/server.py), [server_circuitpython.py](../embedded-pico-w/server_circuitpython.py), [server.ino](../embedded-pico-w/server.ino) |
| [NFC Tag Scanner](../esp32-adafruitST25DV16/static/) | QT Py ESP32 + ST25DV16 | CircuitPython | Advanced | [code.py](../esp32-adafruitST25DV16/code.py) |
| [CMake Demo](cmake-demo/) | Linux/macOS | C | Beginner | [main.c](cmake-demo/main.c) |

### Raspberry Pi

| Example | Platform | Language | Level | Server Code |
|---------|----------|----------|-------|-------------|
| [RPi System Monitor](../embedded-rpi/) | Raspberry Pi 3/4/5 | Node.js + Python | Intermediate | [server.js](../embedded-rpi/server.js), [server.py](../embedded-rpi/server.py) |

## Demo Scope

These examples focus on protocol flow, rendering, and device integration.
Authentication/authorization is intentionally out of scope and should be
added in production firmware/server deployments.

## Protocol

The protocol is the same across all platforms:

```
Device                          Browser
  |                                |
  |  GET /                         |
  |  <-- index.html                |
  |  GET /bitwrench.umd.min.js    |
  |  <-- JS                        |
  |                                |
  |  GET /events (SSE)             |
  |  <-- {"temperature":23.5,...}  |   (every 2s)
  |  <-- {"temperature":23.7,...}  |
  |                                |
  |  POST /api/command             |
  |  {"cmd":"led","val":"on"}      |
  |  --> 200 {"ok":true}           |
```

## Cross-Language Support

| Platform | Language | Example |
|----------|----------|---------|
| ESP32 (Arduino) | C/C++ | sketch.ino + cmake-demo/ |
| ESP32 (CircuitPython) | Python | esp32-adafruitST25DV16/code.py |
| Raspberry Pi Pico W | MicroPython | embedded-pico-w/server.py |
| Raspberry Pi Pico W | CircuitPython | embedded-pico-w/server_circuitpython.py |
| Raspberry Pi Pico W | Arduino C++ | embedded-pico-w/server.ino |
| Raspberry Pi (Linux) | Python | embedded-rpi/server.py |
| Raspberry Pi (Linux) | Node.js | embedded-rpi/server.js (bwserve) |
| Any language | CLI pipe | bwcli serve --stdin |

All produce the same wire protocol -- the browser doesn't know which backend
is talking.

## Development (No Hardware)

Each example directory has an `index.html` tutorial page that works in any
browser (no hardware needed). The `dashboard.html` files connect to real
device endpoints and require the actual hardware to be running.

## Production (ESP32 Hardware)

### Requirements

- ESP32 DevKit (any variant)
- DHT22 sensor on GPIO 4
- LDR (light sensor) on GPIO 34
- Arduino IDE or PlatformIO

### Upload Steps

1. **Prepare SPIFFS data folder** (`data/`):
   ```
   data/
     index.html                  <- esp32-dashboard.html
     bitwrench.umd.min.js.gz    <- gzip -k dist/bitwrench.umd.min.js
   ```

2. **Edit sketch.ino**: Set `WIFI_SSID` and `WIFI_PASSWORD`.

3. **Upload SPIFFS**: Arduino IDE -> Tools -> ESP32 Sketch Data Upload.

4. **Upload Sketch**: Arduino IDE -> Upload.

5. **Connect**: Open Serial Monitor (115200 baud), note the IP address.

## Memory Budget

| Item | On-disk (SPIFFS) |
|------|-----------------|
| index.html | ~5 KB |
| bitwrench.umd.min.js.gz | ~40 KB |
| **Total SPIFFS** | **~45 KB** |
| ESP32 SPIFFS partition | 1.5 MB |
| Free heap (runtime) | ~240 KB |

## Structure

```
embedded/
  index.html              <- landing page (links to all examples)
  esp32-dashboard.html    <- ESP32 IoT dashboard (real device only)
  sketch.ino              <- Arduino sketch for ESP32
  cmake-demo/             <- C bwserve server (Linux/macOS)
  data/                   <- SPIFFS data for ESP32 upload
  README.md               <- this file

embedded-pico-w/          <- Pico W/2W tutorial + 3 server implementations
embedded-rpi/             <- RPi system monitor + server.js + server.py
esp32-adafruitST25DV16/  <- NFC tag scanner (CircuitPython)
```
