# Tutorial: ESP32 IoT Dashboard with Bitwrench

This tutorial builds a live sensor dashboard served by an ESP32. The device
holds the bitwrench bundle in flash, serves a page that is four lines long,
and then owns everything on it: it mounts the UI over Server-Sent Events,
patches the values as they change, and receives button presses back. No
filesystem partition, no CDN, no internet.

## What you'll build

- An ESP32 that answers four HTTP routes and nothing else
- Temperature and humidity from a DHT22, pushed every two seconds
- An LED you can switch from the page, with the page showing the real state
- A page that renders nothing until the device tells it what to show

## Architecture

```
ESP32                                      Browser
  |                                           |
  |  GET /                                    |
  |  <-- a 4-line page                        |
  |  GET /bitwrench.js                        |
  |  <-- the bundle, gzipped, from flash      |
  |                                           |
  |  GET /bw/events (SSE)                     |
  |  <-- mount: the whole dashboard           |
  |  <-- patch, patch, patch (every 2 s)      |
  |                                           |
  |  POST /bw/events                          |
  |  {"action":"led-on"} -->                  |
  |  <-- patch: the LED state                 |
```

The ESP32 never writes HTML. It composes TACO objects as strings with the
macros in `bitwrench.h`, wraps them in protocol frames with `bwserve.h`, and
the browser renders them. A click is a CSS class on the button
(`bw_act_led-on`); the client posts the action name back and the device
decides what changes.

## Prerequisites

- ESP32 DevKit (any variant with WiFi)
- DHT22 temperature and humidity sensor on GPIO 4
- Arduino IDE or PlatformIO
- Arduino libraries: `ESPAsyncWebServer`, `AsyncTCP`, `DHT sensor library`
- Three headers from this repository's `embedded_c/` directory

## Step 1: Set up the project

Copy the headers into the sketch folder:

```
my_project/
  my_project.ino
  bitwrench.h               <- TACO macros
  bwserve.h                 <- protocol frames, action parsing, client registry
  bitwrench_embedded.h      <- the gzipped bundle as a PROGMEM array
```

With PlatformIO, put the three files in `lib/bitwrench/` instead. Nothing
needs linking; everything is header-only.

`bitwrench_embedded.h` is generated from the bundle that ships with each
release. It costs 47 KB of flash and holds the full build, every component
included. If you will not use the `make*()` component factories, swap in
`bitwrench_embedded_lean.h` at 30 KB. Each header carries
`BITWRENCH_EMBEDDED_VERSION`, so a stale copy is easy to spot:

```c
Serial.println(BITWRENCH_EMBEDDED_VERSION);
```

## Step 2: Write the Arduino sketch

```cpp
#include <WiFi.h>
#include <ESPAsyncWebServer.h>
#include <DHT.h>
#include "bitwrench.h"
#include "bwserve.h"
#include "bitwrench_embedded.h"

const char* SSID = "YOUR_WIFI";
const char* PASS = "YOUR_PASSWORD";

#define DHT_PIN  4
#define LED_PIN  2

AsyncWebServer server(80);
AsyncEventSource events("/bw/events");
DHT dht(DHT_PIN, DHT22);
bool ledOn = false;

/* The page owns no UI. It loads the bundle, styles itself from one seed
   colour, enables the click path, and connects. bw.actions.enable() is
   required: bw.connect() alone gives a live stream and dead buttons. */
static const char PAGE[] =
  "<!DOCTYPE html><html><head><meta charset=\"utf-8\">"
  "<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">"
  "<script src=\"/bitwrench.js\"></script></head>"
  "<body><div id=\"app\"></div><script>"
  "bw.loadStyles({ primary: '#0b7285', mode: 'auto' });"
  "bw.actions.enable();"
  "bw.connect('/bw/events');"
  "</script></body></html>";

/* One card with a label and a value. The id is the patch handle. */
static void card(char* out, size_t out_size, const char* label,
                 const char* id, const char* initial) {
  char l[BW_TACO_BUF_SIZE], v[BW_TACO_BUF_SIZE], kids[BW_BUF_SIZE];
  BW_TACO_CLS(l, "div", "bw_text_muted", label);
  BW_TACO_ID(v, "div", id, initial);
  BW_ARRAY_START(kids);
  BW_ARRAY_ITEM(kids, l);
  BW_ARRAY_ITEM(kids, v);
  BW_ARRAY_END(kids);
  (void)out_size;
  BW_NEST_CLS(out, "div", "bw_bccl_card bw_p_3", kids);
}

/* The whole dashboard, sent once per connection. */
static void sendDashboard(AsyncEventSourceClient* client) {
  char temp[BW_BUF_SIZE * 2], hum[BW_BUF_SIZE * 2], up[BW_BUF_SIZE * 2];
  char led[BW_TACO_BUF_SIZE], on[BW_TACO_BUF_SIZE], off[BW_TACO_BUF_SIZE];
  char cards[BW_BUF_SIZE * 6], grid[BW_BUF_SIZE * 7];
  char controls[BW_BUF_SIZE], panel[BW_BUF_SIZE * 2];
  char kids[BW_BUF_SIZE * 9], root[BW_BUF_SIZE * 10], msg[BW_BUF_SIZE * 11];

  card(temp, sizeof temp, "Temperature", "val-temp", "--");
  card(hum,  sizeof hum,  "Humidity",    "val-humidity", "--");
  card(up,   sizeof up,   "Uptime",      "val-uptime", "--");

  BW_ARRAY_START(cards);
  BW_ARRAY_ITEM(cards, temp);
  BW_ARRAY_ITEM(cards, hum);
  BW_ARRAY_ITEM(cards, up);
  BW_ARRAY_END(cards);
  BW_NEST_CLS(grid, "div", "bw_d_flex bw_flex_wrap bw_gap_3", cards);

  /* The buttons. The bw_act_* class is the entire event wiring: no onclick,
     no handler crosses the wire. */
  BW_TACO_ID(led, "span", "led-state", ledOn ? "LED is on" : "LED is off");
  BW_TACO_ATTR(on,  "button",
      "'class':'bw_bccl_btn bw_primary bw_act_led-on'", "LED On");
  BW_TACO_ATTR(off, "button",
      "'class':'bw_bccl_btn bw_act_led-off'", "LED Off");
  BW_ARRAY_START(controls);
  BW_ARRAY_ITEM(controls, led);
  BW_ARRAY_ITEM(controls, on);
  BW_ARRAY_ITEM(controls, off);
  BW_ARRAY_END(controls);
  BW_NEST_CLS(panel, "div", "bw_d_flex bw_gap_2 bw_mt_3", controls);

  BW_ARRAY_START(kids);
  BW_ARRAY_ITEM(kids, grid);
  BW_ARRAY_ITEM(kids, panel);
  BW_ARRAY_END(kids);
  BW_NEST_CLS(root, "div", "bw_bccl_container bw_p_3", kids);

  BW_MOUNT(msg, "#app", root);
  client->send(msg);
}

void setup() {
  Serial.begin(115200);
  pinMode(LED_PIN, OUTPUT);
  dht.begin();

  WiFi.begin(SSID, PASS);
  while (WiFi.status() != WL_CONNECTED) delay(500);
  Serial.print("IP: ");
  Serial.println(WiFi.localIP());

  /* 1. the bundle, straight out of flash */
  server.on("/bitwrench.js", HTTP_GET, [](AsyncWebServerRequest* req) {
    auto* r = req->beginResponse_P(200, "application/javascript",
                                   bitwrench_js_gz, bitwrench_js_gz_len);
    r->addHeader("Content-Encoding", "gzip");
    r->addHeader("Cache-Control", "max-age=31536000, immutable");
    req->send(r);
  });

  /* 2. the page */
  server.on("/", HTTP_GET, [](AsyncWebServerRequest* req) {
    req->send(200, "text/html", PAGE);
  });

  /* 3. on connect, mount the whole UI; from then on, patch what changed */
  events.onConnect([](AsyncEventSourceClient* client) {
    sendDashboard(client);
  });
  server.addHandler(&events);

  /* 4. a bw_act_* click posts to the same URL as the stream */
  server.on("/bw/events", HTTP_POST, [](AsyncWebServerRequest* req) {},
    NULL,
    [](AsyncWebServerRequest* req, uint8_t* data, size_t len, size_t, size_t) {
      /* Copy into our own NUL-terminated buffer; data[len] is not ours. */
      char body[BW_BUF_SIZE], msg[BW_BUF_SIZE];
      size_t n = len < sizeof body - 1 ? len : sizeof body - 1;
      memcpy(body, data, n);
      body[n] = '\0';

      bw_action_t act;
      if (bw_parse_action(body, &act)) {
        if (strcmp(act.action, "led-on") == 0)  ledOn = true;
        if (strcmp(act.action, "led-off") == 0) ledOn = false;
        digitalWrite(LED_PIN, ledOn ? HIGH : LOW);
        BW_PATCH(msg, "led-state", ledOn ? "LED is on" : "LED is off");
        events.send(msg, NULL, millis());
      }
      req->send(204);
    });

  server.begin();
}

void loop() {
  static unsigned long lastSend = 0;
  if (millis() - lastSend < 2000) return;
  lastSend = millis();

  float temp = dht.readTemperature();
  float hum  = dht.readHumidity();

  /* Three patches, one frame. */
  bw_batch_t batch;
  bw_batch_begin(&batch);

  char m1[BW_BUF_SIZE], m2[BW_BUF_SIZE], m3[BW_BUF_SIZE];
  char ts[16], hs[16], us[16];

  snprintf(ts, sizeof ts, "%.1f C", isnan(temp) ? 0.0 : temp);
  BW_PATCH(m1, "val-temp", ts);
  bw_batch_add(&batch, m1);

  snprintf(hs, sizeof hs, "%.1f%%", isnan(hum) ? 0.0 : hum);
  BW_PATCH(m2, "val-humidity", hs);
  bw_batch_add(&batch, m2);

  snprintf(us, sizeof us, "%lus", millis() / 1000);
  BW_PATCH(m3, "val-uptime", us);
  bw_batch_add(&batch, m3);

  char out[BW_BUF_SIZE * 2];
  bw_batch_end(out, sizeof out, &batch);
  events.send(out, NULL, millis());
}
```

Three things to notice.

**The page is the same for every project.** Load, style, enable actions,
connect. Everything the reader sees arrives over the stream, so a change to
the dashboard is a change to C, not to HTML.

**Each nesting level gets its own buffer, larger than the one below.** The
`BW_TACO_*` macros make leaves; `BW_NEST*` and `BW_ARRAY_*` hold other nodes
and strip the children's `r` prefix for you. Building a node into the buffer
it reads from is undefined behaviour, which is why `sendDashboard` declares
so many.

**The button's class is the whole event.** `bw_act_led-on` makes the browser
post `{"action":"led-on"}` to the stream URL. `bw_parse_action()` reads the
name out of the body without a JSON library, and the device answers with a
patch so every connected browser shows the real LED state, including the one
that did not click.

## Step 3: Upload and test

1. Edit `SSID` and `PASS`.
2. Upload the sketch. There is no data folder to upload.
3. Open the Serial Monitor and note the IP address.
4. Open `http://<ip-address>/` in a browser. A second browser on a phone
   shows the same dashboard and the same LED state.

## Try without hardware first

`examples/embedded/posix-cpp/` is this program with `main()` and the HTTP
handlers written for POSIX sockets. The test suite compiles it, runs it and
drives it over a real socket on every run, so its frames are the frames that
ship:

```bash
cd examples/embedded/posix-cpp
cmake -B build && cmake --build build
./build/bwserve_cpp
# Open http://localhost:8080
```

`examples/embedded/cmake-demo/` is the same application in C99. The ESP32
sketch above is that logic with ESPAsyncWebServer calls substituted; it is
not built in CI because the Arduino toolchain is not part of the test matrix.

## Memory budget

| Item | Size |
|------|------|
| The page | under 1 KB |
| `bitwrench_embedded.h` in flash | 47 KB (gzipped bundle, streamed, never copied to RAM) |
| `bitwrench_embedded_lean.h` instead | 30 KB |
| Send buffers (stack, per call) | `BW_BUF_SIZE` 512 B plus `BW_TACO_BUF_SIZE` 256 B |
| SSE frame per batch update | about 200 bytes |
| Free heap at runtime | about 240 KB on a 4 MB ESP32 |

Nothing is decompressed on the device. The browser receives
`Content-Encoding: gzip` and does that work itself.

## The r-prefix relaxed JSON

The C macros produce strings like:

```
r{'v':1,'type':'patch','ref':'val-temp','text':'23.5 C'}
```

The `r` prefix tells `bw.connect()` to convert single quotes to double quotes
before parsing. This avoids escaping double quotes in C string literals.

Since single quotes delimit strings, apostrophes in values need escaping:

```c
/* Static text with an apostrophe: escape in the literal. */
BW_PATCH(msg, "room", "Barry\\'s Room");

/* Dynamic text: BW_PATCH_SAFE escapes for you. */
char user_text[] = "it's 23.5 C";
BW_PATCH_SAFE(msg, sizeof(msg), "status", user_text);
```

The prefix is outbound only. The browser always posts strict JSON back, and
`bw_parse_action()` accepts either form.

## If you already have a filesystem

Projects built on SPIFFS or LittleFS can keep serving the bundle as a file.
Copy `dist/bitwrench.umd.min.js.gz` into the data folder and let
`serveStatic` deliver it under the uncompressed name; ESPAsyncWebServer adds
the gzip header itself. Everything else in this tutorial stays the same: the
page still calls `bw.actions.enable()` and `bw.connect('/bw/events')`, and
the sketch still mounts and patches over the stream. Opening an `EventSource`
by hand and stripping the `r` prefix yourself, as older versions of this
tutorial did, is what `bw.connect()` now does for you.

## Other languages

The same protocol works from any language. The CircuitPython series in
`examples/circuitpython/` builds the same idea up one step at a time, from a
single element to a device pushing live updates.

| Platform | Language | Library |
|----------|----------|---------|
| ESP32, RP2040, STM32 (Arduino, ESP-IDF) | C/C++ | `embedded_c/bwserve.h` |
| ESP32 (Rust) | Rust | `embedded_rust/` |
| ESP32, Pico, Raspberry Pi (MicroPython, CPython) | Python | `embedded_python/bwserve.py` |
| Adafruit boards (CircuitPython) | Python | `examples/circuitpython/` |
| Node.js | JavaScript | `import bwserve from 'bitwrench/bwserve'` |

## Next steps

- [embedded_c/ README](../embedded_c/README.md) -- the macro reference, the
  C++ API, and more than one browser at once
- [bwserve Reference](bwserve.md) -- the full protocol
- [examples/embedded/](../examples/embedded/) -- the desktop demos and the
  ESP32 dashboard that sends data for the browser to compose
- [Tutorial: bwserve](tutorial-bwserve.md) -- the same pattern in Node.js
