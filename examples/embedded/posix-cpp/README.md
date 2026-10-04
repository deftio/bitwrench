# Driving a web UI from C++

A ~400-line C++ program that serves a live, styled, interactive web UI. No
Node, no npm, no bundler, no framework, no CDN, no internet. One source file,
one compiler, one browser.

It is also the ESP32 example with the transport swapped: the bundle in flash,
the protocol frames, the client registry and the post-back parsing are the same
code from the same headers, and only `main()` and the `serve_*()` functions know
about sockets. That is the reason to run it here — work the app out on a machine
with a debugger, then move it to a board.

**What it walks through is one full cycle:** the server builds the UI, the
browser renders it, the user acts, the server hears about it, and the server
updates exactly what changed. Every step below shows the bytes that actually go
over the wire.

## Run it

```sh
cmake -B build && cmake --build build
./build/bwserve_cpp            # or: ./build/bwserve_cpp 9000
```

Open <http://localhost:8080>. Live readings, a text field, a dropdown and two
buttons — all of it built in C++. Open a second tab or your phone: both stay in
sync, because the device is the source of truth.

Without CMake:

```sh
c++ -std=c++11 -I ../../../embedded_c -o bwserve_cpp main.cpp     # macOS/Linux
cl /std:c++14 /I ..\..\..\embedded_c main.cpp ws2_32.lib          # MSVC
```

It needs `embedded_c/bitwrench_embedded.h` (the gzipped bundle as a flash
array). If CMake says it is missing: `npm run build && npm run build:generated`.

---

## 1. The browser loads bitwrench — from the device

```
GET /bitwrench.js  ->  200, Content-Encoding: gzip, 46 KB
```

Straight out of the flash array in `bitwrench_embedded.h`. No CDN, no
filesystem, works on an air-gapped network. The browser decompresses; the
device never holds the uncompressed bundle.

```cpp
send_all(fd, (const char *)bitwrench_js_gz, bitwrench_js_gz_len);
```

On an ESP32 this is the same array with `server.send_P()`.

## 2. The page says almost nothing

All of `GET /`:

```html
<script src="/bitwrench.js"></script>
...
<div id="app"></div>
<script>
  bw.loadStyles({ primary: '#0b7285', mode: 'auto' });
  bw.actions.enable();        // bw_act_* events post back to the server
  bw.connect('/bw/events');   // the server mounts and patches from here
  bw.sub('bw:message', function(m) { bw.patch('status', m.text); });
</script>
```

No markup, no CSS, no event handlers, no `document.*`. The theme — including
dark mode — comes from `loadStyles`, so the C++ side never picks a colour and
changing the look is one line of JS with no firmware change.

## 3. The server mounts the whole UI

The browser opens the SSE stream, and the first frame is the entire page:

```
GET /bw/events  ->  text/event-stream

data: r{'v':1,'type':'mount','ref':'#app','taco':{'t':'div','a':{'class':
'bw_bccl_container bw_py_4'},'c':[{'t':'h1','a':{'class':'bw_mb_1','id':
'title'},'c':'Bench unit 1 -- C++ on this machine'},{'t':'p',...
```

That is a component description, not HTML and not code. It is built with three
functions:

```cpp
bw::taco("div", "bw_text_muted", label)      // a leaf: content is text
bw::nest("div", "bw_bccl_card", children)    // a branch: content is nodes
bw::array({ a, b })                          // a child list
```

```cpp
static std::string stat_card(const char *id, const char *label, const char *value) {
    return bw::nest("div", "bw_col_6 bw_col_md_3",
        bw::nest("div", "bw_bccl_card bw_p_3", bw::array({
            bw::taco("div", "bw_text_muted bw_text_sm", label),
            bw::taco_attr("div", std::string("'class':'bw_text_2xl','id':'") + id + "'", value)
        })));
}
```

Note the `id`. The device names, once, the things it will later want to change.
That is what makes step 4 cheap.

Because the server mounts on every connection, a reconnecting browser or a
second phone gets current state rather than a blank screen. There is no
hydration problem to solve.

## 4. The server pushes updates — naming what changed

Once per interval, three readings in one frame:

```
data: r{'v':1,'type':'batch','ops':[{'v':1,'type':'patch','ref':'temp','text':
'22.2 C'},{'v':1,'type':'patch','ref':'humidity','text':'55 %'},{'v':1,'type':
'patch','ref':'uptime','text':'1s'}]}
```

```cpp
broadcast(bwserve::batch({
    bwserve::patch("temp", temp),
    bwserve::patch("humidity", hum),
    bwserve::patch("uptime", up)
}));
```

~160 bytes for three live values. No diffing, on either side — the code knows
which ids it touched, so it says so. One frame, one reflow, not three round
trips.

## 5. The user acts — and the value comes back

This is the half most examples skip. A control carries a `bw_act_*` class and
nothing else:

```cpp
bw::taco_attr("input",
    "'class':'bw_bccl_form_control bw_act_set_label','name':'label','value':'...'", "")
```

`bw.actions.enable()` on the page turns an event on that element into a POST.
For an input or a select it includes the current value:

```
POST /bw/events
{"v":1,"type":"event","action":"set_label","value":"Barry's <b>rig</b>","name":"label"}
```

No `onclick`, no form submit, no handler shipped from the device, and no code
on the wire in either direction. The device reads it with no JSON parser:

```cpp
bw_action_t act;
if (bw_parse_action(body, &act)) {
    if (std::strcmp(act.action, "set_label") == 0) {
        char value[33];
        bw_action_field(&act, "value", value, sizeof value);
        ...
    }
}
```

`bw_action_field()` handles both post-back shapes — a top-level `value` like
this one, and a nested `data` object — so firmware needs one code path.

## 6. The server decides, then patches

```
data: r{'v':1,'type':'patch','ref':'title','text':'Barry\'s <b>rig</b> -- C++ on this machine'}
```

```cpp
broadcast(bwserve::patch("title", bw::escape(title_text().c_str()).c_str()));
```

**`bw::escape()` is not optional here**, and this demo deliberately types an
apostrophe to prove it. Single quotes delimit strings in the relaxed format, so
an unescaped `'` ends the string early and makes the whole frame unparseable —
and `bw.connect()` would drop it without a word. Escaping on the way *out* is
the device's job.

Escaping on the way *in* to the DOM is bitwrench's: content is escaped by
default, so the typed `<b>` renders as the characters `<b>`, not as markup.
Both halves are tested.

When two things change together, say so in one op rather than re-mounting:

```cpp
broadcast(bwserve::batch({
    bwserve::patch_attr("led", led_text(), "'class':'" + led_class() + "'"),
    bwserve::patch("led_btn", led_btn_text())
}));
```

A click costs two patches. The page is never rebuilt.

## 7. The device can also just say something

```
data: r{'v':1,'type':'message','level':'info','text':'pushing every 5s'}
```

```cpp
broadcast(bwserve::message("info", note));
```

bitwrench publishes this on the `bw:message` topic and does **not** render it —
where a notification belongs and how long it lives is the page's decision. The
page's one line from step 2 is what puts it on screen:

```js
bw.sub('bw:message', function(m) { bw.patch('status', m.text); });
```

Swap that for `bw.makeToast` if you'd rather have a toast.

---

## Several browsers

`bw_clients_t` is a fixed-size registry — no allocation, and a socket that has
gone away is dropped during the fan-out:

```cpp
bw_clients_init(&g_clients);                          // once, at startup
bw_clients_add(&g_clients, fd);                       // on GET /bw/events
bw_clients_each(&g_clients, push, frame.c_str(), 0);  // broadcast
```

Raise `BW_MAX_CLIENTS` (default 4; this demo uses 8) before including the
headers.

## Moving it to a board

Replace `main()` and the `serve_*()` functions with your HTTP stack. Everything
above the transport compiles unchanged:

```cpp
server.on("/bitwrench.js", HTTP_GET, [](AsyncWebServerRequest *req) {
    auto *r = req->beginResponse_P(200, "application/javascript",
                                   bitwrench_js_gz, bitwrench_js_gz_len);
    r->addHeader("Content-Encoding", "gzip");
    req->send(r);
});
```

See [`../esp32_dashboard/`](../esp32_dashboard/) for the Arduino version,
[`../cmake-demo/`](../cmake-demo/) for this same app in C99, and
[`../../../embedded_c/README.md`](../../../embedded_c/README.md) for the header
reference.

## Notes and limits

- **One thread.** `select()` with a one-second timeout: accept when a browser
  knocks, tick when it does not. An ESP32 does the same with
  `server.handleClient()` plus a `millis()` check. No request pipelining, and
  no `Keep-Alive` on the non-SSE routes.
- **Loopback only.** It binds `127.0.0.1`. Change `INADDR_LOOPBACK` to
  `INADDR_ANY` to reach it from your phone, and know what you are doing: this
  is a demo HTTP server with no auth, no TLS and a fixed-size request buffer.
  Do not put it on a network you do not trust.
- **C++ composes without limits; the C macros do not.** `bw::nest()` and
  `bwserve::mount()` build with `std::string`. The C equivalents write into a
  caller-supplied buffer, cap a node at `BW_TACO_BUF_SIZE`, and must not build
  a node into the buffer they are reading from.
- Covered by `test/bitwrench_test_embedded_c.js`, which compiles this file with
  `-Wall -Wextra -Werror`, runs it, drives all of the above over a real socket,
  and renders every frame it pushes into a DOM to check the result.
