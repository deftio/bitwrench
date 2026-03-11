# bwserve CLI + Embedded Design Doc

**Status**: Design
**Target**: v2.1.0
**Author**: Discussion between Manu Chatterjee and Claude, March 2026

---

## Overview

The bwserve protocol (replace/patch/append/remove/batch over SSE) is already
implemented as a Node.js library (`bitwrench/bwserve`). This document designs
two additional layers:

1. **`bwserve` CLI** — a standalone command that turns any language into a
   browser UI by accepting protocol messages on an input port or stdin.
2. **Embedded helpers** — relaxed JSON (`r`-prefix), C header macros, and
   bootstrap shell generation for ESP32 and similar microcontrollers.

The key insight: **the protocol is the product**. The Node.js library, the CLI
tool, and the ESP32 C++ code are all just different ways to produce the same
JSON messages on the wire. The browser client (`bw.clientConnect()` +
`bw.clientApply()`) doesn't know or care which one is talking.

---

## Architecture

```
bwserve protocol (JSON over SSE + POST)
    |
    |--- Node.js library     import { create } from 'bitwrench/bwserve'
    |    (programmatic)      client.render(), client.patch(), client.on()
    |
    |--- bwserve CLI         $ bwserve --listen 9000 --port 8080
    |    (pipe server)       Any process POSTs JSON --> browsers see UI
    |                        Also: $ sensor-loop | bwserve --stdin
    |
    |--- ESP32 / embedded    C++ string literals sent via ESPAsyncWebServer
    |    (direct protocol)   r{'type':'patch','target':'temp','content':'23.5'}
    |
    +--- Browser client      bw.clientConnect('/events')
         (all three above)   bw.clientApply(msg) handles all message types
```

---

## 1. Naming

### Decision: `bwcli` with subcommands (single bin entry)

```json
{
  "bin": {
    "bwcli": "./bin/bwcli.js"
  }
}
```

- **`bwcli`** — the bitwrench command-line tool (distinct from `bitwrench.js` the library).
  `bwcli input.md -o output.html` (file conversion)
  `bwcli serve --listen 9000 --port 8080 ./static` (streaming pipe server)
  `bwcli build ./site -o ./dist` (static site generation, future)
  `bwcli dev ./site` (dev server with live reload, future)

`npm install -g bitwrench` installs the `bwcli` command.

No `bwserve` alias — `bwcli serve` is the canonical form.

### Library import

Keep `import { create } from 'bitwrench/bwserve'`. The import path already
implies "library" — nobody confuses `bwcli` (command) with
`import { create } from 'bitwrench/bwserve'` (module). No rename needed.

### Name collision check

- Bitwarden uses `bw` (not `bwserve`). Their `bw serve` is two words.
- `bwserve` is not a standard unix utility.
- We are not publishing a separate npm package — it's a `bin` entry in the
  `bitwrench` package. No npm name collision possible.

---

## 2. bwserve CLI — Pipe Server

### Usage

```
bwserve v2.0.17 — Pipe server for browser UI

Usage:
  bwserve [options] [dir]

Arguments:
  dir                        Directory to serve static files from (default: .)

Options:
  -p, --port <number>        Browser-facing web port (default: 8080)
  -l, --listen <number>      Input port for protocol messages (default: 9000)
      --stdin                Read protocol messages from stdin (newline-delimited JSON)
  -t, --theme <name>         Theme preset or hex colors ("#pri,#sec")
      --title <string>       Page title (default: "bwserve")
      --open                 Open browser on start
  -v, --verbose              Log messages to stderr
  -h, --help                 Print this help

Examples:
  bwserve                                  Serve . on :8080, listen on :9000
  bwserve --port 3000 --listen 4000        Custom ports
  bwserve --stdin                          Read from pipe instead of input port
  bwserve ./public --theme ocean           Serve ./public with ocean theme
  sensor-reader | bwserve --stdin          Pipe sensor data to browser
  curl -X POST :9000 -d '{"type":"replace","target":"#app","node":{"t":"h1","c":"Hi"}}'
```

### Architecture

```
External process(es)            bwserve CLI               Browser(s)
                           +-----------------+
  HTTP POST :9000 -------->|  Input server   |
    or                     |  (parse JSON,   |
  stdin (--stdin) -------->|   validate msg) |
                           +--------+--------+
                                    |
                                    v
                           +--------+--------+
                           |  Message router  |
                           |  (broadcast to   |
                           |   all clients)   |
                           +--------+--------+
                                    |
                           +--------+--------+
                           |  Web server     |------> SSE :8080/events/:id
                           |  :8080          |------> Static files from dir/
                           |                 |------> Bootstrap shell (GET /)
                           |                 |<------ POST :8080/action/:id
                           +-----------------+
```

### Behavior

**Web port (:8080)**:
- `GET /` — serves bootstrap HTML shell (bitwrench + clientConnect)
- `GET /events/:clientId` — SSE stream, pushes protocol messages
- `POST /action/:clientId` — receives actions from browser buttons
- `GET /*` — static files from the specified directory
- `GET /__bw/bitwrench.umd.min.js` — serves bitwrench from dist/
- `GET /__bw/bitwrench.css` — serves CSS from dist/

**Input port (:9000)**:
- `POST /` — accepts JSON body, broadcasts to all connected browsers
- Body must be a valid bwserve protocol message (or r-prefixed relaxed JSON)
- Returns `200 {"ok":true,"clients":N}` on success
- Returns `400 {"error":"..."}` on parse failure

**stdin mode (--stdin)**:
- Reads newline-delimited JSON from stdin
- Each line is one protocol message (or r-prefixed relaxed JSON)
- Broadcasts to all connected browsers
- When stdin closes, server stays running (browsers remain connected)

### Multi-client broadcasting

All connected browser tabs receive all messages. This covers the primary
use case (dashboards, monitoring, demos). There is no session routing in
the CLI — that's a library-level feature for programmatic apps.

If an input message has a `clientId` field, it's sent only to that client.
Otherwise, broadcast.

### Implementation

The CLI is a thin wrapper around the bwserve library:

```javascript
// bin/bwserve.js (simplified)
import { create } from '../src/bwserve/index.js';
import { createServer } from 'http';

const app = create({ port: webport, static: dir, theme, title });

// Register a "passthrough" page handler — just keeps clients alive
app.page('/', (client) => {
  // Client is now connected, will receive broadcasts
});

// Input HTTP server on separate port
const inputServer = createServer((req, res) => {
  // Parse JSON body, call app.broadcast(msg) to all clients
});
inputServer.listen(listenPort);

// Or stdin mode
if (useStdin) {
  process.stdin.on('data', (chunk) => {
    // Split by newlines, parse each, broadcast
  });
}

app.listen();
```

The library needs one addition: `app.broadcast(msg)` — sends a protocol
message to all connected clients regardless of which page they're on.

### Static file serving

The CLI always serves static files from the specified directory (or `.`).
This is critical because the app being served will typically need images,
CSS, fonts, and other assets alongside the dynamic content.

Request routing priority:
1. `/__bw/*` — bitwrench library assets (highest priority)
2. `/events/:id`, `/action/:id` — bwserve protocol endpoints
3. `/` — bootstrap shell (if no index.html in static dir)
4. `/*` — static files from directory

If the directory contains an `index.html`, it is served instead of the
auto-generated bootstrap shell. This lets developers provide custom pages
that use `bw.clientConnect()` with their own layout.

---

## 3. Relaxed JSON — `r` Prefix

### Problem

C/C++ string literals use double quotes. JSON uses double quotes. Writing
JSON in C requires escaping every quote:

```cpp
// Standard JSON in C — painful
const char* msg = "{\"type\":\"patch\",\"target\":\"temp\",\"content\":\"23.5\"}";

// Relaxed JSON with r-prefix — readable
const char* msg = "r{'type':'patch','target':'temp','content':'23.5'}";
```

### Design

The `r` prefix is inspired by Python's raw string decorator (`r"..."`). It
tells the parser: "this string uses relaxed JSON rules, normalize before
parsing."

**Direction**: Outbound only (server → browser). The ESP32 composes these
string literals to send to the browser. The browser always sends strict
JSON back to the ESP32 (via `fetch()` / `POST`), and ArduinoJson or
similar handles parsing on the device side.

**Wire format**:
```
data: {"type":"patch","target":"temp","content":"23.5"}     ← strict JSON
data: r{'type':'patch','target':'temp','content':'23.5'}    ← relaxed JSON
```

Both arrive on the same SSE stream. The browser detects and handles each.

### Relaxed JSON rules (when r-prefixed)

1. **Single-quoted strings**: `'value'` → `"value"`
2. **Trailing commas**: `{'a':1,}` → `{"a":1}`
3. Standard JSON is also valid relaxed JSON (the `r` prefix is harmless
   if the content is already strict)

**Escaping rule**: Since single quotes delimit strings, apostrophes in
values must be escaped with `\'`:
```
r{'content':'Barry\'s room'}  →  {"content":"Barry's room"}
r{'text':'don\'t panic'}      →  {"text":"don't panic"}
```

This is still a massive win over standard JSON in C:
```c
// Standard JSON: 14+ escape sequences per message
"{\"type\":\"patch\",\"target\":\"status\",\"content\":\"Barry's room\"}"

// Relaxed JSON: only escape the apostrophe
"r{'type':'patch','target':'status','content':'Barry\\'s room'}"
```

For dynamic user text, use `bw_escape_string()` (C) or equivalent before
inserting into a message. The `BW_PATCH_SAFE` macro does this automatically.

**Not supported** (keep it simple):
- Unquoted keys (`{type:'replace'}`) — defer unless requested
- Comments (`// ...` or `/* ... */`) — not needed for wire protocol

### Implementation — `bw.clientParse()`

A proper state machine parser, not a naive regex replace. The parser walks
the string character by character, tracking whether it's inside a
single-quoted string, a double-quoted string, or structural JSON. This
correctly handles:

- Single-quoted strings with escaped characters: `'it\'s ok'`
- Double-quoted strings (passed through unchanged)
- Mixed quoting in the same message
- Trailing commas before `}` and `]`
- Nested objects and arrays

```javascript
bw.clientParse = function(str) {
  str = str.trim();
  if (str.charAt(0) !== 'r') return JSON.parse(str);
  str = str.slice(1);

  // State machine: walk chars, convert single-quoted strings to double-quoted
  var out = [];
  var i = 0;
  var len = str.length;

  while (i < len) {
    var ch = str[i];

    if (ch === "'") {
      // Single-quoted string → emit as double-quoted
      out.push('"');
      i++;
      while (i < len) {
        var c = str[i];
        if (c === '\\' && i + 1 < len) {
          // Escaped char — pass through (convert \' to just ')
          var next = str[i + 1];
          if (next === "'") {
            out.push("'");     // \' in input → ' in output (inside double-quoted string)
          } else {
            out.push('\\');
            out.push(next);
          }
          i += 2;
        } else if (c === '"') {
          // Literal double quote inside single-quoted string — escape it
          out.push('\\"');
          i++;
        } else if (c === "'") {
          // End of single-quoted string
          break;
        } else {
          out.push(c);
          i++;
        }
      }
      out.push('"');
      i++; // skip closing '

    } else if (ch === '"') {
      // Double-quoted string — pass through verbatim
      out.push(ch);
      i++;
      while (i < len) {
        var c2 = str[i];
        if (c2 === '\\' && i + 1 < len) {
          out.push(c2);
          out.push(str[i + 1]);
          i += 2;
        } else {
          out.push(c2);
          i++;
          if (c2 === '"') break;
        }
      }

    } else if (ch === ',') {
      // Trailing comma check: skip comma if next non-whitespace is } or ]
      var j = i + 1;
      while (j < len && (str[j] === ' ' || str[j] === '\t' || str[j] === '\n' || str[j] === '\r')) j++;
      if (j < len && (str[j] === '}' || str[j] === ']')) {
        i++; // skip trailing comma
      } else {
        out.push(ch);
        i++;
      }

    } else {
      out.push(ch);
      i++;
    }
  }

  return JSON.parse(out.join(''));
};
```

~60 lines. Runs client-side in the browser. Zero overhead for strict JSON
(the `r` check is a single charAt comparison — fast path).

**Handles correctly**:
```
r{'content':'it\'s hot'}        → {"content":"it's hot"}         ✓
r{'msg':'say "hello"'}          → {"msg":"say \"hello\""}        ✓
r{'a':1,'b':[2,3,],}           → {"a":1,"b":[2,3]}             ✓
r{"already":"valid json"}       → {"already":"valid json"}       ✓
```

### Integration with `bw.clientConnect()`

```javascript
// In the SSE message handler:
es.onmessage = function(e) {
  var msg = bw.clientParse(e.data);  // handles both strict and r-prefixed
  bw.clientApply(msg);
};
```

This replaces the current `JSON.parse()` call in the SSE handler. Since
`bw.clientParse()` falls through to `JSON.parse()` for non-r-prefixed
strings, there is no behavior change for existing code.

---

## 4. Embedded Helpers

### 4a. Bootstrap shell for ESP32

The `bitwrench` CLI can generate a C header file with the bootstrap HTML:

```bash
bitwrench shell --standalone > bwserve_shell.h
bitwrench shell --cdn > bwserve_shell.h
```

Output:
```cpp
// bwserve_shell.h — auto-generated by bitwrench CLI
// bitwrench v2.0.17
#ifndef BWSERVE_SHELL_H
#define BWSERVE_SHELL_H

const char BWSERVE_SHELL[] PROGMEM = R"rawhtml(
<!DOCTYPE html>
<html><head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<script src="/bitwrench.umd.min.js"></script>
<link rel="stylesheet" href="/bitwrench.css">
</head><body>
<div id="app"></div>
<script>
bw.loadDefaultStyles();
bw.clientConnect('/events', { actionUrl: '/action' });
</script>
</body></html>
)rawhtml";

#endif
```

With `--standalone`, the bitwrench UMD source is inlined into the HTML
(for devices that serve a single file). With `--cdn`, it references an
external URL.

### 4b. Protocol macros — `bwserve.h`

A tiny C header (~50 lines) with string-builder macros for protocol messages:

```cpp
// bwserve.h — protocol message helpers for C/C++ (ESP32, Arduino, etc.)
// Zero dependencies. Just string formatting.

#ifndef BWSERVE_H
#define BWSERVE_H

// --- Protocol messages (relaxed JSON, r-prefixed) ---

// Replace: swap the content of target with a TACO node
// Usage: char buf[256]; BW_REPLACE(buf, "#app", "{'t':'h1','c':'Hello'}");
#define BW_REPLACE(buf, target, taco) \
  snprintf(buf, sizeof(buf), "r{'type':'replace','target':'%s','node':%s}", target, taco)

// Patch: update text content of an element by ID
// Usage: char buf[128]; BW_PATCH(buf, "temperature", "23.5°C");
#define BW_PATCH(buf, target, content) \
  snprintf(buf, sizeof(buf), "r{'type':'patch','target':'%s','content':'%s'}", target, content)

// Patch with numeric value (no quotes around content)
#define BW_PATCH_NUM(buf, target, value) \
  snprintf(buf, sizeof(buf), "r{'type':'patch','target':'%s','content':'%g'}", target, (double)(value))

// Append: add a child TACO node to target
#define BW_APPEND(buf, target, taco) \
  snprintf(buf, sizeof(buf), "r{'type':'append','target':'%s','node':%s}", target, taco)

// Remove: remove target element from DOM
#define BW_REMOVE(buf, target) \
  snprintf(buf, sizeof(buf), "r{'type':'remove','target':'%s'}", target)

// --- TACO node helpers ---

// Simple text element: {'t':'tag','c':'text'}
#define BW_TACO(buf, tag, text) \
  snprintf(buf, sizeof(buf), "{'t':'%s','c':'%s'}", tag, text)

// Element with class: {'t':'tag','a':{'class':'cls'},'c':'text'}
#define BW_TACO_CLS(buf, tag, cls, text) \
  snprintf(buf, sizeof(buf), "{'t':'%s','a':{'class':'%s'},'c':'%s'}", tag, cls, text)

// Element with ID: {'t':'tag','a':{'id':'id'},'c':'text'}
#define BW_TACO_ID(buf, tag, id, text) \
  snprintf(buf, sizeof(buf), "{'t':'%s','a':{'id':'%s'},'c':'%s'}", tag, id, text)

#endif // BWSERVE_H
```

Ships in `embedded/bwserve.h` in the npm package. ESP32 developers copy
it into their project.

### 4c. ESP32 usage example

```cpp
#include "bwserve.h"

// In the SSE send loop:
char buf[512];
char taco[256];

// Build a TACO node
BW_TACO_ID(taco, "span", "temp", "23.5°C");

// Send as a replace message
BW_REPLACE(buf, "#sensor-temp", taco);
events.send(buf, NULL, millis());

// Or patch just the value
BW_PATCH(buf, "temp", "24.1°C");
events.send(buf, NULL, millis());

// Patch with a number
BW_PATCH_NUM(buf, "counter", loopCount);
events.send(buf, NULL, millis());
```

---

## 5. `bw.clientConnect()` Updates

The current `bw.clientConnect()` uses bwserve endpoint conventions
(`/__bw/events/:id`, `/__bw/action/:id`). For ESP32 and the CLI pipe
server, the endpoints are configurable:

```javascript
// Current (bwserve library)
bw.clientConnect();  // defaults to /__bw/events/:id

// ESP32 (custom endpoints)
bw.clientConnect('/events', { actionUrl: '/action' });

// Any URL
bw.clientConnect('http://192.168.1.42/events', { actionUrl: '/api/command' });
```

The SSE message handler should use `bw.clientParse()` instead of
`JSON.parse()` to support `r`-prefixed relaxed JSON transparently.

---

## 6. Documentation Updates Required

### `docs/bwserve.md`
- Add CLI pipe server usage + examples
- Add embedded/ESP32 section with `bwserve.h` usage
- Add relaxed JSON `r`-prefix documentation
- Architecture diagram showing all three tiers

### `pages/12-bwserve-protocol.html`
- Add "Relaxed JSON" section to protocol spec
- Add "Embedded / ESP32" section with C++ examples
- Add "CLI Pipe Server" section with curl / shell examples

### `src/cli/serve.js` (becomes `bin/bwserve.js`)
- Complete help text with all options and examples
- Examples section showing curl, pipe, and Python usage

### `docs/tutorial-bwserve.md` (new)
- Getting started: pipe server in 5 minutes
- Python example: data visualization
- Shell example: system monitoring
- ESP32 example: sensor dashboard

### `docs/tutorial-embedded.md` (new)
- Arduino setup with bwserve.h
- Bootstrap shell generation
- Sensor dashboard walkthrough
- Memory budget planning

---

## 7. File Changes Summary

| File | Action | Lines |
|------|--------|-------|
| `bin/bwserve.js` | Create | ~10 (shebang + import) |
| `src/cli/serve.js` | Rewrite | ~150 (pipe server implementation) |
| `src/bwserve/index.js` | Edit | ~20 (add app.broadcast()) |
| `src/bitwrench.js` | Edit | ~70 (add bw.clientParse() state machine, update clientConnect) |
| `embedded/bwserve.h` | Create | ~50 (C header macros) |
| `package.json` | Edit | ~5 (add bwserve bin entry) |
| `docs/bwserve.md` | Edit | ~100 (CLI + embedded sections) |
| `pages/12-bwserve-protocol.html` | Edit | ~80 (relaxed JSON + embedded sections) |
| `test/bitwrench_test_bwserve.js` | Edit | ~40 (clientParse tests) |

---

## 8. Implementation Order

1. `bw.clientParse()` — relaxed JSON parser (~15 lines)
2. Update `bw.clientConnect()` to use clientParse
3. `app.broadcast(msg)` addition to bwserve library
4. `bin/bwserve.js` + rewrite `src/cli/serve.js` — pipe server
5. `embedded/bwserve.h` — C header macros
6. `bitwrench shell` subcommand — generate bootstrap C header
7. Tests for all new code
8. Documentation updates (docs, pages, tutorials)

---

## 9. Future Work (Not in This Release)

- `--script myapp.js` — load page handlers from a JS file
- `--watch` — file watching + live reload for static dir
- WebSocket transport option (input port or browser)
- Session routing (input messages target specific clients)
- Unquoted keys in relaxed JSON (`{type:'replace'}`)
