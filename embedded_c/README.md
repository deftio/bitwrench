# bitwrench embedded C/C++

C/C++ headers for building bwserve-compatible servers on embedded systems (ESP32, STM32, etc).

## Files

| File | Description |
|------|-------------|
| `bitwrench.h` | TACO format helpers — macros for composing UI node JSON strings |
| `bwserve.h` | bwserve protocol — replace, patch, append, remove, batch, SSE frame helpers |

## Install

### Arduino IDE

Copy both header files into your sketch folder:

```
my_project/
  my_project.ino
  bitwrench.h
  bwserve.h
```

### PlatformIO

Copy headers into a library folder:

```
lib/
  bitwrench/
    bitwrench.h
    bwserve.h
```

### CMake / esp-idf

Add the `embedded_c/` directory to your include path:
 ``
```cmake
target_include_directories(my_app PRIVATE path/to/embedded_c)
```

No linking required — both files are header-only.

### Desktop (Linux / macOS)

See `examples/embedded/cmake-demo/` for a full working example:

```bash
cd examples/embedded/cmake-demo
mkdir build && cd build
cmake .. && make
./bwserve_demo
# Open http://localhost:8080
```

## Write Your First Program

This example creates an ESP32 web server that displays a counter and lets
the browser increment it by clicking a button.

```c
#include <WiFi.h>
#include <ESPAsyncWebServer.h>
#include "bitwrench.h"
#include "bwserve.h"

const char* SSID = "YOUR_WIFI";
const char* PASS = "YOUR_PASS";

AsyncWebServer server(80);
AsyncEventSource events("/events");
int count = 0;

void setup() {
  Serial.begin(115200);

  // 1. Connect to WiFi
  WiFi.begin(SSID, PASS);
  while (WiFi.status() != WL_CONNECTED) delay(500);
  Serial.println(WiFi.localIP());

  // 2. Serve the bootstrap HTML page
  server.on("/", HTTP_GET, [](AsyncWebServerRequest* req) {
    req->send(200, "text/html", BW_BOOTSTRAP_HTML);
  });

  // 3. When a browser connects via SSE, send the initial UI
  events.onConnect([](AsyncEventSourceClient* client) {
    // Build a TACO node: <div id="counter">0</div>
    char taco[256];
    BW_TACO_ID(taco, "div", "counter", "0");

    // Build a button: <button data-bw-action="increment">+1</button>
    char btn[256];
    BW_TACO_ATTR(btn, "button",
      "'data-bw-action':'increment','class':'bw-btn'", "+1");

    // Build array of both nodes
    char content[512];
    snprintf(content, sizeof(content), "[%s,%s]", taco, btn);

    // Send replace message to put content in #app
    char msg[600];
    snprintf(msg, sizeof(msg),
      "r{'type':'replace','target':'#app','node':{'t':'div','c':%s}}",
      content);

    char frame[700];
    BW_SSE_FRAME(frame, msg);
    client->send(frame, NULL, millis());
  });

  // 4. Handle button clicks from the browser
  server.on("/api/command", HTTP_POST,
    [](AsyncWebServerRequest* req) {},
    NULL,
    [](AsyncWebServerRequest* req, uint8_t* data, size_t len, size_t, size_t) {
      if (strstr((char*)data, "increment")) {
        count++;
        char msg[256];
        char val[16];
        snprintf(val, sizeof(val), "%d", count);
        BW_PATCH(msg, "counter", val);

        char frame[300];
        BW_SSE_FRAME(frame, msg);
        events.send(frame, NULL, millis());
      }
      req->send(200, "application/json", "{\"ok\":true}");
    }
  );

  server.addHandler(&events);
  server.begin();
}

void loop() {
  // Nothing needed — ESPAsyncWebServer handles requests in background
}
```

**What happens:**
1. ESP32 serves `BW_BOOTSTRAP_HTML` — a tiny page that loads bitwrench and connects to `/events`
2. On SSE connect, the server sends a `replace` message with a counter div and button
3. When the user clicks "+1", the browser POSTs an action to `/api/command`
4. The server increments the count and sends a `patch` message to update the display

## Relaxed JSON (r-prefix)

All macros produce r-prefixed relaxed JSON so you avoid escaping double quotes:

```c
// Without r-prefix (painful):
const char* msg = "{\"type\":\"patch\",\"target\":\"temp\",\"content\":\"23.5\"}";

// With r-prefix (readable):
BW_PATCH(buf, "temp", "23.5");
// → r{'type':'patch','target':'temp','content':'23.5'}
```

The browser's `bw.parseJSONFlex()` normalizes to strict JSON before processing.
r-prefix is outbound only (device to browser). The browser always sends strict JSON back.

## Batch Updates

Send multiple updates atomically:

```c
bw_batch_t batch;
bw_batch_begin(&batch);

char m1[256], m2[256];
BW_PATCH(m1, "temp", "23.5 C");
BW_PATCH(m2, "humidity", "67%");
bw_batch_add(&batch, m1);
bw_batch_add(&batch, m2);

char out[2048];
bw_batch_end(out, sizeof(out), &batch);
```

## C++ API

When compiled as C++, you get a cleaner namespace-based API:

```cpp
#include "bwserve.h"

auto node = bw::taco("h1", "Hello");
auto msg  = bwserve::replace("#app", node);
auto frame = bwserve::sse_frame(msg);

auto update = bwserve::batch({
    bwserve::patch("temp", "23.5"),
    bwserve::patch("humidity", "67%")
});
```

## Reference

### TACO Macros (bitwrench.h)

| Macro | Output |
|-------|--------|
| `BW_TACO(buf, tag, text)` | `r{'t':'tag','c':'text'}` |
| `BW_TACO_CLS(buf, tag, cls, text)` | `r{'t':'tag','a':{'class':'cls'},'c':'text'}` |
| `BW_TACO_ID(buf, tag, id, text)` | `r{'t':'tag','a':{'id':'id'},'c':'text'}` |
| `BW_TACO_ATTR(buf, tag, attrs, text)` | `r{'t':'tag','a':{attrs},'c':'text'}` |
| `BW_TACO_NUM(buf, tag, value)` | `r{'t':'tag','c':'23.5'}` |

### Protocol Macros (bwserve.h)

| Macro | Description |
|-------|-------------|
| `BW_REPLACE(buf, target, taco)` | Replace target content with TACO node |
| `BW_PATCH(buf, target, content)` | Update target's text content |
| `BW_PATCH_NUM(buf, target, value)` | Patch with a numeric value |
| `BW_PATCH_ATTR(buf, target, content, attrs)` | Patch text + attributes |
| `BW_APPEND(buf, target, taco)` | Append child to target |
| `BW_REMOVE(buf, target)` | Remove target from DOM |
| `BW_BATCH(buf, ops)` | Wrap ops in a batch |
| `BW_MESSAGE(buf, level, text)` | Send a notification |
| `BW_SSE_FRAME(buf, data)` | Wrap as SSE `data:` frame |
| `BW_SSE_HEADERS` | HTTP headers for SSE response |
| `BW_BOOTSTRAP_HTML` | Minimal page that loads bitwrench + connects to SSE |
