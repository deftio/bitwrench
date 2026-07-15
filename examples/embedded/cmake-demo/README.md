# bwserve C Demo (Desktop)

A desktop program that demonstrates the bwserve protocol macros without any
hardware. Runs a POSIX socket HTTP server on your development machine, serving
a live dashboard that simulates sensor readings.

No microcontroller, no WiFi, no flash filesystem -- just `cmake`, a C compiler,
and a browser.

## What This Is

This is a fully functional bwserve application that:

- Serves a self-contained HTML dashboard from a C string literal
- Pushes simulated sensor data over SSE every 2 seconds
- Accepts POST commands (LED on/off, reset uptime)
- Demonstrates every bwserve.h macro in working context
- Supports multiple simultaneous browser connections

Use it to understand the bwserve protocol before deploying to real hardware,
or as a starting point for porting bwserve to a new platform.

## Prerequisites

- CMake 3.10+
- C99 compiler (gcc, clang, or MSVC)
- POSIX threads support (Linux, macOS, WSL)
- A web browser

## Build and Run

```bash
cd examples/embedded/cmake-demo
mkdir build && cd build
cmake ..
make
./bwserve_demo
```

Open `http://localhost:8080` in your browser.

The server prints connection events to the terminal. Press Ctrl+C to stop.

## Architecture

```
main.c
  |
  |-- HTTP server (POSIX sockets, port 8080)
  |     GET /              -> bootstrap HTML (inline string)
  |     GET /events        -> SSE stream (bwserve protocol)
  |     POST /api/command  -> command handler
  |
  |-- Sensor thread (simulated, updates every 2s)
  |     Generates random temperature, humidity, pressure, light
  |     Broadcasts batch updates to all SSE clients
  |
  +-- Uses bitwrench.h + bwserve.h
        BW_PATCH(), BW_BATCH(), bw_batch_t
        BW_SSE_FRAME(), BW_SSE_HEADERS
        BW_HTTP_OK_JSON(), BW_HTTP_404()
```

---

## Code Walkthrough

The entire application is in `main.c`. It includes two header-only files from
the `embedded_c/` directory:

```c
#include "bitwrench.h"   // BW_BUF_SIZE, bw_format_bytes, bw_escape_string
#include "bwserve.h"     // All protocol macros + batch builder + HTTP helpers
```

### Sensor State

Simulated sensor data lives in a struct:

```c
typedef struct {
    float temperature;     // Drifts around 22 C
    float humidity;        // Drifts around 55%
    float pressure;        // Drifts around 1013 hPa
    int   light;           // 0-1023
    int   led_on;          // Toggle state
    unsigned long uptime_s;
} sensor_state_t;
```

A background thread updates these values every 2 seconds with small random
perturbations, then broadcasts patches to all connected browsers.

### Building Patches with `BW_PATCH`

The `broadcast_sensor_update()` function uses the batch builder pattern:

```c
void broadcast_sensor_update(void) {
    bw_batch_t batch;
    bw_batch_begin(&batch);       // Initialize the batch

    char m[BW_BUF_SIZE];
    char str[32];

    // Temperature patch
    snprintf(str, sizeof(str), "%.1f C", g_sensors.temperature);
    BW_PATCH(m, "val-temp", str);
    bw_batch_add(&batch, m);     // Add to batch

    // Humidity patch
    snprintf(str, sizeof(str), "%.1f%%", g_sensors.humidity);
    BW_PATCH(m, "val-humidity", str);
    bw_batch_add(&batch, m);

    // ... more patches for pressure, light, uptime, LED ...

    // Serialize and broadcast
    char out[BW_BUF_SIZE * 4];
    bw_batch_end(out, sizeof(out), &batch);  // Produces the batch JSON
    sse_broadcast(out);
}
```

The `BW_PATCH(m, "val-temp", "22.3 C")` macro produces:
```
r{'v':1,'type':'patch','ref':'val-temp','text':'22.3 C'}
```

The batch builder collects these, strips the `r` prefix from each, and wraps
them in a single batch message:
```
r{'v':1,'type':'batch','ops':[{'v':1,'type':'patch','ref':'val-temp','text':'22.3 C'},{'v':1,...}]}
```

### SSE Broadcasting

The server tracks connected SSE clients (file descriptors) and broadcasts
using the `BW_SSE_FRAME` macro:

```c
void sse_broadcast(const char* data) {
    char frame[BW_BUF_SIZE * 2];
    BW_SSE_FRAME(frame, data);   // Wraps as "data: {...}\n\n"
    size_t len = strlen(frame);

    for (int i = 0; i < g_sse_count; ) {
        ssize_t written = write(g_sse_clients[i], frame, len);
        if (written <= 0) {
            // Client disconnected -- remove from list
            close(g_sse_clients[i]);
            g_sse_clients[i] = g_sse_clients[--g_sse_count];
        } else {
            i++;
        }
    }
}
```

### HTTP Request Routing

The server uses bwserve HTTP helper macros for responses:

```c
// GET / -- serve the dashboard HTML
if (strcmp(method, "GET") == 0 && strcmp(path, "/") == 0) {
    char resp[32768];
    BW_HTTP_OK_HTML(resp, BOOTSTRAP_HTML);
    write(client_fd, resp, strlen(resp));
    close(client_fd);
    return;
}

// GET /events -- SSE stream
if (strcmp(method, "GET") == 0 && strcmp(path, "/events") == 0) {
    const char* headers = BW_SSE_HEADERS;
    write(client_fd, headers, strlen(headers));
    sse_add_client(client_fd);
    broadcast_sensor_update();  // Send current state immediately
    return;  // Don't close -- kept alive for SSE
}

// POST /api/command -- handle commands
if (strcmp(method, "POST") == 0 && strcmp(path, "/api/command") == 0) {
    // ... parse JSON, handle led_on/led_off/reset_uptime ...
    char resp[512];
    BW_HTTP_OK_JSON(resp, "{\"ok\":true}");
    write(client_fd, resp, strlen(resp));
    close(client_fd);
    return;
}

// 404
char resp[256];
BW_HTTP_404(resp);
write(client_fd, resp, strlen(resp));
close(client_fd);
```

### Inline Dashboard HTML

The dashboard is embedded as a C string literal. It contains inline CSS and
minimal JavaScript that directly parses bwserve messages:

```javascript
// Inline JS inside the C string
var es = new EventSource('/events');
es.onmessage = function(e) {
    var raw = e.data;
    if (raw.charAt(0) === 'r') {       // r-prefix = relaxed JSON
        raw = raw.slice(1);
        raw = raw.replace(/'/g, '"');   // Single quotes -> double quotes
    }
    try { var msg = JSON.parse(raw); } catch(x) { return; }
    if (msg.type === 'batch') {
        msg.ops.forEach(applyOp);       // Process each op in the batch
    } else {
        applyOp(msg);
    }
};

function applyOp(op) {
    if (op.type === 'patch') {
        var el = document.getElementById(op.ref);
        if (el && op.text != null) el.textContent = op.text;
    }
}

function sendCmd(cmd) {
    fetch('/api/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cmd: cmd })
    });
}
```

This is a minimal approach -- no bitwrench.js is loaded. The JavaScript directly
parses bwserve messages and updates DOM elements by ID. For real projects, you'd
serve bitwrench.js from flash and use TACO/BCCL components for a richer UI.

The HTML creates sensor cards with `id` attributes matching the `ref` values
used in `BW_PATCH`:

```html
<div class="card"><h3>Temperature</h3><div class="val" id="val-temp">--</div></div>
<div class="card"><h3>Humidity</h3><div class="val" id="val-humidity">--</div></div>
```

---

## bwserve.h Macro Reference

### Protocol Messages

| Macro | Signature | Output | Description |
|-------|-----------|--------|-------------|
| `BW_PATCH` | `(buf, ref, text)` | `r{'v':1,'type':'patch','ref':'REF','text':'TEXT'}` | Update element text content |
| `BW_PATCH_NUM` | `(buf, ref, value)` | `r{...,'text':'23.5'}` | Patch with numeric value (formatted as `%g`) |
| `BW_PATCH_SAFE` | `(buf, size, ref, text)` | Same as PATCH with escaped quotes | Patch with user-provided text |
| `BW_PATCH_ATTR` | `(buf, ref, text, attrs)` | `...,'attrs':{'class':'ok'}}` | Patch text and attributes |
| `BW_MOUNT` | `(buf, ref, taco)` | `r{...,'type':'mount','taco':{...}}` | Replace element children with TACO |
| `BW_APPEND` | `(buf, ref, taco)` | `r{...,'type':'append','taco':{...}}` | Append TACO as child |
| `BW_REMOVE` | `(buf, ref)` | `r{...,'type':'remove','ref':'REF'}` | Remove element from DOM |
| `BW_MESSAGE` | `(buf, level, text)` | `r{...,'type':'message','level':'info',...}` | Send notification/toast |
| `BW_BATCH` | `(buf, ops)` | `r{...,'type':'batch','ops':[...]}` | Wrap multiple ops in batch |

### Batch Builder (C Functions)

| Function | Signature | Description |
|----------|-----------|-------------|
| `bw_batch_begin` | `(bw_batch_t* b)` | Initialize a batch |
| `bw_batch_add` | `(bw_batch_t* b, const char* msg)` | Add a message (auto-strips `r` prefix) |
| `bw_batch_end` | `(char* buf, size_t size, const bw_batch_t* b)` | Serialize to batch JSON string |

### SSE and HTTP Helpers

| Macro | Description |
|-------|-------------|
| `BW_SSE_FRAME(buf, data)` | Wrap data as SSE frame: `data: ...\n\n` |
| `BW_SSE_HEADERS` | HTTP response headers for SSE endpoint |
| `BW_SSE_KEEPALIVE` | SSE keep-alive comment `:keepalive\n\n` |
| `BW_HTTP_RESPONSE(buf, status, type, body)` | Build complete HTTP response |
| `BW_HTTP_OK_JSON(buf, body)` | 200 OK with `application/json` content type |
| `BW_HTTP_OK_HTML(buf, body)` | 200 OK with `text/html` content type |
| `BW_HTTP_404(buf)` | 404 Not Found response |
| `BW_BOOTSTRAP_HTML` | Minimal HTML shell that loads bitwrench.js |

### C++ Wrappers (namespace `bwserve`)

If compiling as C++, you get `std::string`-returning functions:

```cpp
auto msg = bwserve::batch({
    bwserve::patch("val-temp", "23.5 C"),
    bwserve::patch("val-humidity", "55%")
});
auto frame = bwserve::sse_frame(msg);
```

---

## CMakeLists.txt

```cmake
cmake_minimum_required(VERSION 3.10)
project(bwserve_demo C)

set(CMAKE_C_STANDARD 99)
set(CMAKE_C_STANDARD_REQUIRED ON)

set(BW_INCLUDE_DIR "${CMAKE_CURRENT_SOURCE_DIR}/../../../embedded_c")

add_executable(bwserve_demo main.c)
target_include_directories(bwserve_demo PRIVATE ${BW_INCLUDE_DIR})

find_package(Threads REQUIRED)
target_link_libraries(bwserve_demo Threads::Threads)
```

The `BW_INCLUDE_DIR` points to `embedded_c/` in the bitwrench repo root, where
`bitwrench.h` and `bwserve.h` live.

---

## Using This as a Starting Point

To port bwserve to a new platform (e.g., a different microcontroller, an RTOS,
or a desktop application):

1. **Copy the headers:** `bitwrench.h` and `bwserve.h` into your project
2. **Add an HTTP server:** Any server that can serve static files and handle
   SSE connections works
3. **Use the macros:** `BW_PATCH` for text updates, `bw_batch_*` for batching,
   `BW_SSE_FRAME` for SSE framing
4. **Serve the dashboard:** Either embed the HTML as a string (like this demo)
   or serve `dashboard.html` + `bitwrench.umd.min.js` from a filesystem

The only platform-specific code is the HTTP server and the actual sensor reads.
The bwserve protocol layer (macros and batch builder) is pure C99 with no
platform dependencies.

## Porting to ESP32

Copy the protocol logic (the `broadcast_sensor_update()` function pattern) to
your ESP32 sketch. Replace:

- POSIX `socket()`/`accept()`/`write()` with `ESPAsyncWebServer` + `AsyncEventSource`
- `pthread` sensor thread with `loop()` + `millis()` timing
- `strstr()` command parsing with `ArduinoJson` (optional)

The `bitwrench.h` and `bwserve.h` macros work identically on both platforms.

## Demo Scope Notes

- This demo focuses on wire-protocol flow, not hardened command security.
- Command parsing in `main.c` is intentionally simple for readability.
- Authentication/authorization is intentionally out of scope and should be
  added in production deployments.
