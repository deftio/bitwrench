# bwserve C demo (desktop)

A C99 program that serves a live bitwrench dashboard over POSIX sockets. No
microcontroller, no WiFi, no flash filesystem -- just `cmake`, a C compiler and
a browser.

It is the ESP32 sketch with the transport swapped, so the protocol logic here
moves to firmware unchanged. Use it to get an app right on a machine with a
debugger before you flash anything.

**Writing C++?** [`../posix-cpp/`](../posix-cpp/) is the same app with
`std::string` helpers -- no fixed buffers, no truncation, and a fuller
walkthrough in its README. Start there unless your toolchain is C only.

## Build and run

```sh
mkdir build && cd build
cmake .. && make
./bwserve_demo
# open http://localhost:8080
```

Needs `embedded_c/bitwrench_embedded.h` (the gzipped bundle as a flash array).
If it is missing:

```sh
npm run build && npm run build:generated
```

Prerequisites: CMake 3.10+, a C99 compiler, POSIX threads (Linux, macOS, WSL).

## What it does

| Route | Purpose |
|-------|---------|
| `GET /bitwrench.js` | The gzipped bundle straight out of the flash array, `Content-Encoding: gzip`. ~46 KB, no filesystem, works air-gapped. |
| `GET /` | A bootstrap page with no markup, no CSS and no DOM code. |
| `GET /events` | SSE. Mounts the whole UI on connect, then patches readings every 2 s. |
| `POST /bw/events` | What `bw.actions` sends when a `bw_act_*` element is clicked. |

Open it in two tabs: both stay in sync, because the device is the source of
truth and every connection is mounted from current state.

## The page

All of it:

```html
<script src="/bitwrench.js"></script>
...
<div id="app"></div>
<script>
  bw.loadStyles({ primary: '#2b8a3e', mode: 'auto' });
  bw.actions.enable();     // bw_act_* clicks post back to this server
  bw.connect('/events');   // the server mounts and patches from here
</script>
```

The UI is built in C and arrives over SSE. Nothing here reaches for the DOM.

## Composing a UI in C

`BW_TACO_*` makes a leaf -- its content is quoted text. `BW_NEST*` holds other
nodes, which is how a whole screen goes out in one message:

```c
char lab[256], val[256];
char kids[1024];
char card[2048];      /* larger than kids -- see the two rules below */
BW_TACO_CLS(lab, "div", "bw_text_muted bw_text_sm", "Temperature");
BW_TACO_ID(val, "div", "val-temp", "22.4 C");
BW_ARRAY_START(kids);
BW_ARRAY_ITEM(kids, lab);
BW_ARRAY_ITEM(kids, val);
BW_ARRAY_END(kids);
BW_NEST_CLS(card, "div", "bw_bccl_card bw_p_3", kids);
```

Two rules:

- **Each level needs its own buffer.** `BW_NEST(x, "div", x)` is `snprintf()`
  into the buffer it is reading from: undefined behaviour. The C++ helpers have
  no such trap.
- **Each level must be larger than the one below it.** Nesting grows the
  string, so a same-sized destination can truncate. Build with `-Wall -Werror`
  and gcc tells you via `-Wformat-truncation` -- which is why this demo's
  buffers escalate (`BW_BUF_SIZE`, `* 2`, `* 4`, ... up to the whole page).
  Clang does not implement that warning, so **a demo that compiles on macOS
  can still fail on gcc**: build both before you trust it.

Classes like `bw_bccl_card`, `bw_row` and `bw_col_md_4` are styled by the
`bw.loadStyles()` call on the page, so changing the theme is one line of JS
and no firmware change.

## Updates: name what changed

Readings go out as one batch, not five messages:

```c
bw_batch_t batch;
bw_batch_begin(&batch);
BW_PATCH(msg, "val-temp", temp);      bw_batch_add(&batch, msg);
BW_PATCH(msg, "val-humidity", hum);   bw_batch_add(&batch, msg);
bw_batch_end(out, sizeof(out), &batch);
broadcast(out);                        /* one frame, one reflow */
```

No diffing on either side. The code knows which ids it touched, so it says so.
The ids come from the `BW_TACO_ID()` calls that built the cards.

## Clicks

A button carries `bw_act_led_toggle`. `bw.actions.enable()` turns the click
into a POST, and the device reads it with no JSON parser:

```c
bw_action_t act;
if (bw_parse_action(body, &act)) {
    if (strcmp(act.action, "led_toggle") == 0) { ... }
}
```

`bw_action_field(&act, "pin", buf, sizeof buf)` reads one field when the action
carries values.

## Many browsers

`bw_clients_t` is the fixed-size registry from `bwserve.h` -- no allocation,
and a socket that has gone away is dropped during the fan-out:

```c
bw_clients_init(&g_clients);                        /* once, at startup */
bw_clients_add(&g_clients, fd);                     /* on GET /events   */
bw_clients_each(&g_clients, push_frame, frame, NULL);  /* broadcast     */
```

Raise `BW_MAX_CLIENTS` (default 4; this demo uses 8) before including the
headers. The mutex in this file is ours, because the demo pushes from a second
thread -- a single-threaded firmware loop does not need one.

## Porting to ESP32

Replace `main()`, `handle_request()` and the `serve_*`/`write_all` helpers with
your HTTP stack. Everything else compiles unchanged:

```c
server.on("/bitwrench.js", HTTP_GET, []() {
    server.sendHeader("Content-Encoding", "gzip");
    server.send_P(200, "application/javascript",
                  (const char *)bitwrench_js_gz, bitwrench_js_gz_len);
});
```

See [`../esp32_dashboard/`](../esp32_dashboard/) and
[`../../../embedded_c/README.md`](../../../embedded_c/README.md) for the full
header reference.

## Scope notes

- Binds `127.0.0.1`. Change `INADDR_LOOPBACK` to `INADDR_ANY` to reach it from
  a phone, and note that this is a demo server: no auth, no TLS, fixed-size
  request buffer, one request per connection. Do not expose it.
- Authentication and authorization are deliberately out of scope here and
  belong in production firmware.
- `test/bitwrench_test_embedded_c.js` compiles the headers and the C++ demo
  with `-Wall -Wextra -Werror` and drives them over a real socket.
