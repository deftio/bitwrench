# Tutorial: ESP32 IoT Dashboard with Bitwrench

This tutorial builds a real-time sensor dashboard served by an ESP32 microcontroller. The device sends data — bitwrench renders the UI in the browser.

## What you'll build

- ESP32 serves a bitwrench-powered web page over WiFi
- Temperature and humidity readings pushed via SSE every 2 seconds
- LED control button sends commands back to the device
- Total HTML payload: ~5KB (excluding bitwrench library)

## Architecture

```
ESP32                                 Browser
  |                                      |
  |  GET /                               |
  |  <── index.html (from SPIFFS)        |
  |  GET /bitwrench.umd.min.js           |
  |  <── JS (from SPIFFS)                |
  |                                      |
  |  GET /events (SSE)                   |
  |  <── sensor JSON every 2s            |
  |                                      |
  |  POST /api/command                   |
  |  {cmd: 'led', val: 'on'}  ──>       |
  |  <── {ok: true}                      |
```

The ESP32 never generates HTML. It only sends JSON data. The browser renders everything.

## Prerequisites

- ESP32 DevKit (any variant)
- DHT22 temperature/humidity sensor (GPIO 4)
- Arduino IDE or PlatformIO
- Arduino libraries: `ESPAsyncWebServer`, `AsyncTCP`, `DHT sensor library`, `ArduinoJson`

## Step 1: Set up the project

### With bitwrench C headers (recommended)

Copy the embedded C headers into your project:

```
my_project/
  my_project.ino
  bitwrench.h      ← from embedded_c/
  bwserve.h        ← from embedded_c/
  data/
    index.html     ← the dashboard page
    bitwrench.umd.min.js  ← from dist/
```

### With PlatformIO

```
lib/
  bitwrench/
    bitwrench.h
    bwserve.h
data/
  index.html
  bitwrench.umd.min.js
```

## Step 2: Write the Arduino sketch

```cpp
#include <WiFi.h>
#include <ESPAsyncWebServer.h>
#include <SPIFFS.h>
#include <DHT.h>
#include "bitwrench.h"
#include "bwserve.h"

const char* SSID = "YOUR_WIFI";
const char* PASS = "YOUR_PASSWORD";

#define DHT_PIN  4
#define LED_PIN  2

AsyncWebServer server(80);
AsyncEventSource events("/events");
DHT dht(DHT_PIN, DHT22);

void setup() {
  Serial.begin(115200);
  pinMode(LED_PIN, OUTPUT);
  dht.begin();

  // Mount flash filesystem
  SPIFFS.begin(true);

  // Connect WiFi
  WiFi.begin(SSID, PASS);
  while (WiFi.status() != WL_CONNECTED) delay(500);
  Serial.print("IP: ");
  Serial.println(WiFi.localIP());

  // Serve static files from SPIFFS
  server.serveStatic("/", SPIFFS, "/").setDefaultFile("index.html");

  // SSE endpoint
  events.onConnect([](AsyncEventSourceClient* client) {
    Serial.println("Browser connected");
  });
  server.addHandler(&events);

  // Command endpoint
  server.on("/api/command", HTTP_POST,
    [](AsyncWebServerRequest* req) {},
    NULL,
    [](AsyncWebServerRequest* req, uint8_t* data, size_t len, size_t, size_t) {
      if (strstr((char*)data, "\"led_on\"")) {
        digitalWrite(LED_PIN, HIGH);
      } else if (strstr((char*)data, "\"led_off\"")) {
        digitalWrite(LED_PIN, LOW);
      }
      req->send(200, "application/json", "{\"ok\":true}");
    }
  );

  server.begin();
}

void loop() {
  static unsigned long lastSend = 0;
  if (millis() - lastSend < 2000) return;
  lastSend = millis();

  // Read sensors
  float temp = dht.readTemperature();
  float hum  = dht.readHumidity();

  // Send batch update using bwserve macros
  bw_batch_t batch;
  bw_batch_begin(&batch);

  char m1[256], m2[256], m3[256];
  char ts[16], hs[16], us[16];

  snprintf(ts, sizeof(ts), "%.1f C", isnan(temp) ? 0.0 : temp);
  BW_PATCH(m1, "val-temp", ts);
  bw_batch_add(&batch, m1);

  snprintf(hs, sizeof(hs), "%.1f%%", isnan(hum) ? 0.0 : hum);
  BW_PATCH(m2, "val-humidity", hs);
  bw_batch_add(&batch, m2);

  snprintf(us, sizeof(us), "%lus", millis() / 1000);
  BW_PATCH(m3, "val-uptime", us);
  bw_batch_add(&batch, m3);

  char out[1024];
  bw_batch_end(out, sizeof(out), &batch);
  events.send(out, NULL, millis());
}
```

The `BW_PATCH` and `bw_batch_*` macros from `bwserve.h` compose the protocol messages. They use the r-prefix relaxed JSON format, so no double-quote escaping needed.

## Step 3: Write the dashboard HTML

Create `data/index.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ESP32 Dashboard</title>
  <script src="/bitwrench.umd.min.js"></script>
  <style>
    body { font-family: system-ui, sans-serif; background: #0f172a; color: #e2e8f0; margin: 0; padding: 1rem; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 0.75rem; max-width: 600px; margin: 1rem auto; }
    .card { background: #1e293b; border-radius: 8px; padding: 1rem; text-align: center; }
    .card h3 { margin: 0 0 0.5rem; font-size: 0.8rem; color: #94a3b8; text-transform: uppercase; }
    .card .val { font-size: 1.5rem; font-weight: 700; color: #38bdf8; }
    h1 { text-align: center; color: #10b981; }
    button { background: #334155; color: #e2e8f0; border: 1px solid #475569; border-radius: 6px; padding: 0.5rem 1.5rem; cursor: pointer; margin: 0.25rem; }
  </style>
</head>
<body>
  <h1>ESP32 Dashboard</h1>
  <div class="grid">
    <div class="card"><h3>Temperature</h3><div class="val" id="val-temp">--</div></div>
    <div class="card"><h3>Humidity</h3><div class="val" id="val-humidity">--</div></div>
    <div class="card"><h3>Uptime</h3><div class="val" id="val-uptime">--</div></div>
  </div>
  <div style="text-align: center; margin-top: 1rem;">
    <button onclick="sendCmd('led_on')">LED On</button>
    <button onclick="sendCmd('led_off')">LED Off</button>
  </div>

  <script>
    // Connect to SSE stream
    var es = new EventSource('/events');
    es.onmessage = function(e) {
      var raw = e.data;
      // Handle r-prefix relaxed JSON from ESP32
      if (raw.charAt(0) === 'r') raw = raw.slice(1).replace(/'/g, '"');
      try { var msg = JSON.parse(raw); } catch(x) { return; }

      if (msg.type === 'batch') {
        msg.ops.forEach(applyOp);
      } else {
        applyOp(msg);
      }
    };

    function applyOp(op) {
      if (op.type === 'patch') {
        var el = document.getElementById(op.target);
        if (el) el.textContent = op.content;
      }
    }

    function sendCmd(cmd) {
      fetch('/api/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cmd: cmd })
      });
    }
  </script>
</body>
</html>
```

This page is ~2KB. With bitwrench.umd.min.js (~95KB), the total SPIFFS usage is ~97KB out of 1.5MB available.

## Step 4: Upload and test

1. Edit `SSID` and `PASS` in the sketch
2. Upload the `data/` folder to SPIFFS (Arduino IDE: Tools > ESP32 Sketch Data Upload)
3. Upload the sketch
4. Open Serial Monitor — note the IP address
5. Navigate to `http://<ip-address>/` in your browser

## Try without hardware first

The `examples/embedded/cmake-demo/` directory contains a POSIX version that compiles on Linux/macOS:

```bash
cd examples/embedded/cmake-demo
mkdir build && cd build
cmake .. && make
./bwserve_demo
# Open http://localhost:8080
```

Same protocol, same macros, simulated sensors. Copy the pattern to your real sketch.

## Memory budget

| Item | Size |
|------|------|
| Dashboard HTML | ~2 KB |
| bitwrench.umd.min.js | ~95 KB |
| **Total SPIFFS** | **~97 KB** |
| ESP32 SPIFFS partition | 1.5 MB |
| Free heap (runtime) | ~240 KB |
| SSE frame per update | ~200 bytes |

## The r-prefix relaxed JSON

The C macros produce strings like:
```
r{'type':'patch','target':'val-temp','content':'23.5 C'}
```

The `r` prefix tells the browser parser to convert single quotes to double quotes before `JSON.parse()`. This avoids escaping double quotes in C string literals — a major ergonomic win.

**Escaping rule**: Since single quotes delimit strings, apostrophes in values need escaping with `\'`:

```c
// Static text with apostrophe — escape in the literal:
BW_PATCH(msg, "room", "Barry\\'s Room");

// Dynamic user text — use BW_PATCH_SAFE (auto-escapes):
char user_text[] = "it's 23.5 C";
BW_PATCH_SAFE(msg, sizeof(msg), "status", user_text);
```

This is still far better than standard JSON in C, where every quote needs `\"`.

Direction: r-prefix is outbound only (ESP32 to browser). The browser always sends strict JSON back via `fetch()`.

## Other languages

The same protocol works from any language:

| Platform | Language | Library |
|----------|----------|---------|
| ESP32 (Arduino) | C/C++ | `embedded_c/bwserve.h` |
| ESP32 (esp-idf) | Rust | `embedded_rust/` |
| ESP32/RPi (MicroPython) | Python | `embedded_python/bwserve.py` |
| Adafruit boards | CircuitPython | `embedded_python/bwserve.py` |
| Node.js | JavaScript | `import bwserve from 'bitwrench/bwserve'` |

## Next steps

- [bwserve Reference](bwserve.md) — full protocol documentation
- [embedded_c/ README](../embedded_c/README.md) — C/C++ macro reference
- [examples/embedded/](../examples/embedded/) — complete example with mock data
- [Tutorial: bwserve](tutorial-bwserve.md) — same pattern in Node.js
