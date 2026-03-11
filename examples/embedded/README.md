# Embedded IoT Dashboard (ESP32)

A real-time sensor dashboard served by an ESP32 microcontroller, rendered by bitwrench in the browser.

## What This Shows

- **Minimal payload**: The ESP32 serves a ~5KB HTML file + bitwrench assets. No server-side HTML generation.
- **JSON-only protocol**: The device sends sensor readings as JSON. bitwrench renders gauges, cards, and charts.
- **SSE streaming**: Real-time updates pushed from ESP32 to browser via Server-Sent Events.
- **Command API**: Buttons send POST requests to `/api/command` for LED control and restart.
- **Works without hardware**: The `index.html` includes a mock data source for development.

## Development (No Hardware)

Open `index.html` in a browser. The page uses mock sensor data that simulates an ESP32.

For local bitwrench (without CDN):
```html
<script src="../../dist/bitwrench.umd.js"></script>
<link rel="stylesheet" href="../../dist/bitwrench.css">
```

## Production (ESP32 Hardware)

### Requirements

- ESP32 DevKit (any variant)
- DHT22 sensor on GPIO 4
- LDR (light sensor) on GPIO 34
- Arduino IDE or PlatformIO

### Arduino Libraries

Install via Library Manager:
- `ESPAsyncWebServer`
- `AsyncTCP`
- `DHT sensor library`
- `ArduinoJson`

### Upload Steps

1. **Prepare SPIFFS data folder** (`data/`):
   ```
   data/
     index.html              ← this example's index.html
     bitwrench.umd.min.js    ← from dist/
     bitwrench.css           ← from dist/
   ```

   Edit `index.html` to use local paths:
   ```html
   <script src="/bitwrench.umd.min.js"></script>
   <link rel="stylesheet" href="/bitwrench.css">
   ```

2. **Edit `sketch.ino`**: Set `WIFI_SSID` and `WIFI_PASSWORD`.

3. **Upload SPIFFS**: Arduino IDE → Tools → ESP32 Sketch Data Upload.

4. **Upload Sketch**: Arduino IDE → Upload.

5. **Connect**: Open Serial Monitor (115200 baud), note the IP address, navigate to it.

## Protocol

```
ESP32                           Browser
  |                                |
  |  GET /                         |
  |  <-- index.html (SPIFFS)       |
  |  GET /bitwrench.umd.min.js    |
  |  <-- JS (SPIFFS)               |
  |                                |
  |  GET /events (SSE)             |
  |  <-- {"temperature":23.5,...}  |   (every 2s)
  |  <-- {"temperature":23.7,...}  |
  |                                |
  |  POST /api/command             |
  |  {"cmd":"led","val":"on"}      |
  |  --> 200 {"ok":true}           |
```

## Memory Budget

| Item | Size |
|------|------|
| HTML page | ~5 KB |
| bitwrench.umd.min.js | ~95 KB |
| bitwrench.css | ~12 KB |
| **Total SPIFFS** | **~112 KB** |
| ESP32 SPIFFS partition | 1.5 MB |
| Free heap (runtime) | ~240 KB |

## Structure

```
embedded/
  index.html    ← dashboard page with mock data (~150 lines of JS)
  sketch.ino    ← Arduino sketch for ESP32
  README.md     ← this file
```
