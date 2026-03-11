# bitwrench embedded Rust

Rust crate for building bwserve-compatible servers on embedded systems.
`no_std` compatible for bare-metal targets. Zero dependencies.

## Install

### Add to your project

```toml
# Cargo.toml
[dependencies]
bwserve = { path = "path/to/embedded_rust" }
```

### For bare-metal / no_std

Disable the default `std` feature:

```toml
[dependencies]
bwserve = { path = "path/to/embedded_rust", default-features = false }
```

### Run the tests

```bash
cd embedded_rust
cargo test
```

## Write Your First Program

This example builds a temperature dashboard that sends SSE updates.
It uses the `std` feature (runs on Linux/macOS for testing, or on
ESP32 with `esp-idf-svc`).

```rust
use std::io::Write;
use std::net::TcpListener;
use std::thread;
use std::time::Duration;

use bwserve::{taco, taco_cls, patch, replace, batch, sse_frame, SSE_HEADERS};

fn main() {
    let listener = TcpListener::bind("0.0.0.0:8080").unwrap();
    println!("bwserve Rust demo on http://localhost:8080");

    for stream in listener.incoming() {
        let mut stream = stream.unwrap();
        let mut buf = [0u8; 2048];
        let n = stream.read(&mut buf).unwrap_or(0);
        let req = String::from_utf8_lossy(&buf[..n]);

        if req.starts_with("GET / ") {
            // Serve bootstrap HTML
            let html = include_str!("bootstrap.html"); // or use a const string
            let resp = format!(
                "HTTP/1.1 200 OK\r\nContent-Type: text/html\r\n\
                 Content-Length: {}\r\nConnection: close\r\n\r\n{}",
                html.len(), html
            );
            let _ = stream.write_all(resp.as_bytes());

        } else if req.starts_with("GET /events") {
            // SSE stream
            let _ = stream.write_all(SSE_HEADERS.as_bytes());

            // Send initial UI
            let ui = replace("#app", &taco_cls("div", "dashboard", "Loading..."));
            let _ = stream.write_all(sse_frame(&ui).as_bytes());

            // Push sensor updates every 2 seconds
            thread::spawn(move || {
                let mut temp = 22.0_f64;
                loop {
                    thread::sleep(Duration::from_secs(2));
                    temp += (rand::random::<f64>() - 0.5) * 0.5;

                    let update = batch(&[
                        patch("val-temp", &format!("{:.1} C", temp)),
                        patch("val-status", "Online"),
                    ]);

                    if stream.write_all(sse_frame(&update).as_bytes()).is_err() {
                        break; // Client disconnected
                    }
                }
            });
        }
    }
}
```

### no_std version (fixed-size buffers)

For bare-metal targets without a heap allocator:

```rust
#![no_std]

use bwserve::{FixedBuf, patch_buf, sse_frame_buf};

fn send_temperature_update(temp: f32, writer: &mut impl core::fmt::Write) {
    // Build patch message into a stack buffer
    let mut msg = FixedBuf::<256>::new();
    let mut temp_str = FixedBuf::<32>::new();
    let _ = core::write!(temp_str, "{:.1} C", temp);
    patch_buf(&mut msg, "val-temp", temp_str.as_str());

    // Wrap as SSE frame
    let mut frame = FixedBuf::<512>::new();
    sse_frame_buf(&mut frame, msg.as_str());

    // Write to your transport (UART, socket, etc.)
    let _ = writer.write_str(frame.as_str());
}
```

## How It Works

All functions produce r-prefixed relaxed JSON:

```
r{'type':'patch','target':'temp','content':'23.5 C'}
```

The browser's `bw.clientParse()` normalizes this to strict JSON. The `r`
prefix is outbound only (device to browser). The browser sends strict JSON
back via POST.

## API Reference

### TACO Builders

| Function | Description |
|----------|-------------|
| `taco(tag, content)` | `r{'t':'tag','c':'content'}` |
| `taco_cls(tag, cls, content)` | With class attribute |
| `taco_id_buf(buf, tag, id, content)` | With id attribute (buffer version) |
| `taco_buf(buf, tag, content)` | Stack buffer version of `taco()` |

### Protocol Messages

| Function | Description |
|----------|-------------|
| `patch(target, content)` | Update element text |
| `patch_num(target, value)` | Update with f64 value |
| `replace(target, taco)` | Replace element content |
| `append(target, taco)` | Append child element |
| `remove(target)` | Remove element |
| `batch(ops)` | Send multiple ops atomically |
| `message(level, text)` | Browser notification |

### SSE Helpers

| Function / Constant | Description |
|---------------------|-------------|
| `sse_frame(data)` | Wrap as `data: ...\n\n` |
| `SSE_HEADERS` | HTTP response headers for SSE |
| `SSE_KEEPALIVE` | Keep-alive comment `:keepalive\n\n` |

### Buffer Types

| Type | Description |
|------|-------------|
| `FixedBuf<N>` | Stack-allocated buffer, implements `core::fmt::Write` |

Every `_buf` function has a corresponding `String`-returning version
when the `std` feature is enabled.
