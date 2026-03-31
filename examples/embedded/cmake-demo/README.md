# bwserve C Demo — cmake example

A POSIX socket server that speaks the bwserve protocol. Compiles and runs on Linux/macOS without any embedded hardware.

This demonstrates the exact same wire protocol that would run on an ESP32. The only difference is the transport layer (POSIX sockets vs ESPAsyncWebServer).

## Build & Run

```bash
mkdir build && cd build
cmake ..
make
./bwserve_demo
```

Then open http://localhost:8080 in your browser.

## What It Does

- Serves a self-contained HTML dashboard on `GET /`
- Pushes simulated sensor data via SSE on `GET /events`
- Accepts LED and reset commands via `POST /api/command`
- Uses `bitwrench.h` and `bwserve.h` macros for all protocol messages
- Supports multiple simultaneous browser connections
- Batch updates (all sensor values sent atomically)

## Architecture

```
main.c
  |
  |-- HTTP server (POSIX sockets, port 8080)
  |     GET /          → bootstrap HTML
  |     GET /events    → SSE stream (bwserve protocol)
  |     POST /api/command  → command handler
  |
  |-- Sensor thread (simulated, updates every 2s)
  |     Generates random temperature, humidity, etc.
  |     Broadcasts batch updates to all SSE clients
  |
  +-- Uses bitwrench.h + bwserve.h
        BW_PATCH(), BW_BATCH(), bw_batch_t
        BW_SSE_FRAME(), BW_SSE_HEADERS
```

## Porting to ESP32

Copy the protocol logic (the `broadcast_sensor_update()` function pattern) to your ESP32 sketch. Replace:
- POSIX `socket()`/`accept()`/`write()` → `ESPAsyncWebServer` + `AsyncEventSource`
- `pthread` sensor thread → `loop()` with `millis()` timing
- `strstr()` command parsing → `ArduinoJson`

The `bitwrench.h` and `bwserve.h` macros work identically on both platforms.

## Demo Scope Notes

- This demo focuses on wire-protocol flow, not hardened command security.
- Command parsing in `main.c` is intentionally simple for readability.
- Authentication/authorization is intentionally out of scope and should be
  added in production deployments.

## Requirements

- CMake 3.10+
- C99 compiler (gcc, clang)
- POSIX threads (pthreads)
