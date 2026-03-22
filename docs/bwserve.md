# bwserve — Server-Driven UI for Bitwrench

## What is bwserve?

bwserve is a server-side library that lets you build interactive web UIs entirely from Node.js. Your application state lives on the server, and the server pushes rendering commands to the browser over SSE (Server-Sent Events). User interactions are sent back as actions via HTTP POST.

This is the same pattern as Streamlit (Python), Phoenix LiveView (Elixir), and htmx — but bwserve sends TACO objects (bitwrench's {t, a, c, o} format), not HTML strings. The browser already has bitwrench loaded (~40KB), so it renders TACO natively with no build step.

**Key characteristics:**
- Zero runtime dependencies — only Node.js stdlib (`http`, `fs`, `path`)
- Auto-generates the client page (loads bitwrench, opens SSE, wires actions)
- Same protocol works for Node.js servers and ESP32/Arduino embedded devices
- 9 protocol message types covering DOM operations and remote execution

## Architecture

```
  Browser                            Node.js Server
┌──────────────────┐               ┌──────────────────────┐
│ bitwrench.js     │               │ bwserve              │
│                  │   GET /       │                      │
│  bwclient.js     ├──────────────>  app.page('/', fn)    │
│  (opens SSE)     │               │                      │
│                  │<──SSE──────── │ DOM operations:      │
│  bw.apply()      │  {type,node}  │  client.render()     │
│  -> bw.DOM()     │               │  client.patch()      │
│  -> bw.patch()   │               │  client.append()     │
│                  │               │  client.remove()     │
│                  │               │  client.batch()      │
│                  │               │                      │
│                  │               │ Execution:           │
│                  │               │  client.register()   │
│                  │               │  client.call()       │
│                  │               │  client.exec()       │
│                  │               │                      │
│  data-bw-action  │               │                      │
│  conn.sendAction │──POST───────> │ client.on(action,fn) │
│                  │  {action,data}│                      │
└──────────────────┘               └──────────────────────┘
```

**Flow:**
1. Browser requests page → server returns auto-generated HTML shell
2. Shell loads bitwrench from `/bw/lib/bitwrench.umd.js` and opens SSE
3. SSE triggers page handler → server sends TACO rendering commands
4. Browser applies each message via `bw.apply()` → DOM updates
5. User clicks → `data-bw-action` triggers POST → server handler runs
6. Server sends more messages → browser updates. Loop continues.

## Quick Start

```javascript
// server.js
import bwserve from 'bitwrench/bwserve';

var app = bwserve.create({ port: 7902 });
var count = 0;

app.page('/', function(client) {
  // 1. Render the initial UI as a TACO tree
  client.render('#app', {
    t: 'div', a: { style: 'padding:24px' }, c: [
      { t: 'h1', c: 'Counter' },
      { t: 'p', c: [
        'Count: ',
        { t: 'span', a: { id: 'count', style: 'font-weight:bold' }, c: '0' }
      ]},
      { t: 'button', a: { 'data-bw-action': 'increment', class: 'bw-btn bw-btn-primary' }, c: '+1' },
      { t: 'button', a: { 'data-bw-action': 'reset', class: 'bw-btn bw-btn-outline-secondary' }, c: 'Reset' }
    ]
  });

  // 2. Handle user actions
  client.on('increment', function() {
    count++;
    client.patch('count', String(count));
  });

  client.on('reset', function() {
    count = 0;
    client.patch('count', '0');
  });
});

app.listen(function() {
  console.log('bwserve running on http://localhost:7902');
});
```

Save as `server.js`, run `node server.js`, open `http://localhost:7902`.

## Protocol Messages

bwserve uses 9 message types, organized in two categories:

### DOM Operations (5 types)

These modify the browser's DOM tree:

| Type | Purpose | Server Method | Client Action |
|------|---------|---------------|---------------|
| `replace` | Replace element content | `client.render(target, taco)` | `bw.DOM(target, node)` |
| `patch` | Update text/attributes | `client.patch(id, content, attr?)` | `bw.patch(target, content, attr)` |
| `append` | Add child element | `client.append(target, taco)` | `target.appendChild(bw.createDOM(node))` |
| `remove` | Remove element | `client.remove(target)` | `bw.cleanup(el); el.remove()` |
| `batch` | Multiple operations | `client.batch(ops)` | Execute each op in sequence |

### Execution Operations (3 types)

These invoke functions or execute code on the client:

| Type | Purpose | Server Method | Client Action |
|------|---------|---------------|---------------|
| `register` | Send named function | `client.register(name, body)` | Store in `bw._clientFunctions` |
| `call` | Invoke function by name | `client.call(name, ...args)` | Call registered or built-in function |
| `exec` | Run arbitrary JS | `client.exec(code)` | `new Function(code)()` (needs opt-in) |

### Additional

| Type | Purpose | Server Method | Client Action |
|------|---------|---------------|---------------|
| `message` | Component dispatch | `client.message(target, action, data)` | `bw.message(target, action, data)` |

### Message Schemas

```json
// --- DOM Operations ---

// replace — full subtree replacement
{ "type": "replace", "target": "#app", "node": {"t":"div","c":"Hello"} }

// patch — lightweight text/attribute update
{ "type": "patch", "target": "counter", "content": "42" }
{ "type": "patch", "target": "status", "content": "active", "attr": {"class": "done"} }

// append — add a child
{ "type": "append", "target": "#list", "node": {"t":"li","c":"New item"} }

// remove — delete from DOM
{ "type": "remove", "target": "#old-item" }

// batch — multi-update
{ "type": "batch", "ops": [
    { "type": "patch", "target": "a", "content": "1" },
    { "type": "patch", "target": "b", "content": "2" }
]}

// --- Execution Operations ---

// register — send a named function to the client
{ "type": "register", "name": "autoScroll", "body": "function(sel) { var el = document.querySelector(sel); if (el) el.scrollTop = el.scrollHeight; }" }

// call — invoke a registered or built-in function
{ "type": "call", "name": "autoScroll", "args": ["#chat"] }
{ "type": "call", "name": "focus", "args": ["#search-input"] }
{ "type": "call", "name": "download", "args": ["report.csv", "id,name\n1,Alice", "text/csv"] }

// exec — execute arbitrary JS (requires allowExec on client)
{ "type": "exec", "code": "document.title = 'Updated'" }
```

### Target Resolution

All DOM operation targets are resolved using:

| Pattern | Resolution | Example |
|---------|-----------|---------|
| `#selector` | CSS selector via `querySelector` | `#app`, `#counter` |
| `.selector` | CSS class selector | `.bw-card` |
| `bare-string` | `getElementById`, then `bw._el()` fallback | `counter` |

**Best practice:** Use simple `id` attributes for patchable elements:
```javascript
// Server sends render with id:
client.render('#app', { t: 'span', a: { id: 'count' }, c: '0' });

// Later, server patches by id:
client.patch('count', '42');
```

### Actions (Client → Server)

User interactions flow from client to server via HTTP POST:

```
POST /bw/return/action/:clientId
Content-Type: application/json

{ "action": "increment", "data": { "inputValue": "hello" } }
```

**Wiring actions** — add `data-bw-action` to any element:

```javascript
// Server sends this TACO:
{ t: 'button', a: { 'data-bw-action': 'save', class: 'bw-btn' }, c: 'Save' }

// When clicked, client auto-POSTs:
{ action: 'save', data: {} }

// Server handles it:
client.on('save', function(data) {
  client.patch('status', 'Saved!');
});
```

If a text `<input>` is near the clicked button, its value is automatically included as `inputValue` and the input is cleared.

## Server API Reference

### `bwserve.create(opts)`

Create a bwserve application.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `port` | number | 7902 | Listen port |
| `title` | string | `'bwserve'` | HTML `<title>` |
| `static` | string | null | Static file directory |
| `theme` | string/object | null | Theme preset name or config |
| `injectBitwrench` | boolean | true | Auto-inject bitwrench UMD + CSS |
| `allowExec` | boolean | false | Enable `exec` messages on client (see warning below) |
| `allowScreenshot` | boolean | false | Enable `client.screenshot()` capability |
| `keepAliveInterval` | number | 15000 | SSE keep-alive interval in ms |

> **Start without `allowExec`.** The `register/call` pattern (Tier 1 + Tier 2) handles 95% of use cases — send named functions once, invoke them by name with safe argument passing. Only enable `allowExec: true` if you genuinely need to evaluate arbitrary code strings on the client. When in doubt, leave it off.

### `app.page(path, handler)`

Register a page handler. The `handler` function is called with a `BwServeClient` when a browser connects via SSE.

```javascript
app.page('/', function(client) {
  client.render('#app', { t: 'div', c: 'Hello' });
});

app.page('/dashboard', function(client) {
  // different page, different handler
});
```

### `app.listen(callback?)` / `app.close()`

Start and stop the server. Both return Promises.

```javascript
await app.listen(function() { console.log('Ready'); });
await app.close();
```

### `app.clientCount`

Number of active SSE connections (read-only property).

### `app.broadcast(msg)`

Send a protocol message to all connected clients. Useful for dashboards, notifications, and multi-user apps. Returns the number of clients the message was sent to.

```javascript
// Broadcast a patch to all browsers:
app.broadcast({ type: 'patch', target: 'status', content: 'System OK' });

// Target a specific client by setting clientId:
app.broadcast({ type: 'patch', target: 'msg', content: 'Hello', clientId: 'c1' });

// Broadcast a batch update:
app.broadcast({
  type: 'batch', ops: [
    { type: 'patch', target: 'users', content: '342' },
    { type: 'patch', target: 'orders', content: '28' }
  ]
});
```

### BwServeClient Methods

#### DOM Operations

| Method | Protocol Type | Description |
|--------|--------------|-------------|
| `client.render(target, taco)` | `replace` | Replace target contents with TACO tree |
| `client.patch(id, content, attr?)` | `patch` | Update text or attribute of element |
| `client.append(target, taco)` | `append` | Add TACO as child of target |
| `client.remove(target)` | `remove` | Remove element from DOM |
| `client.batch(ops)` | `batch` | Send multiple operations atomically |
| `client.message(target, action, data)` | `message` | Dispatch to el.bw[action] |

#### Execution Operations

| Method | Protocol Type | Description |
|--------|--------------|-------------|
| `client.register(name, body)` | `register` | Send named function to client for later call() |
| `client.call(name, ...args)` | `call` | Invoke registered or built-in function |
| `client.exec(code)` | `exec` | Execute arbitrary JS (requires client allowExec) |

#### Connection Management

| Method | Description |
|--------|-------------|
| `client.on(action, handler)` | Register handler for client actions |
| `client.close()` | Disconnect this client |

## Screenshots

The server can capture what the client is displaying as a PNG or JPEG image. This uses html2canvas on the client side (lazy-loaded on first call, vendored at ~194 KB).

### `client.screenshot(selector?, options?)`

Capture a screenshot of the client page or a specific element. Returns a Promise.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `selector` | string | `'body'` | CSS selector of element to capture |
| `format` | string | `'png'` | `'png'` or `'jpeg'` |
| `quality` | number | 0.85 | JPEG quality 0–1 (ignored for PNG) |
| `maxWidth` | number | null | Resize if wider (preserves aspect ratio) |
| `maxHeight` | number | null | Resize if taller (preserves aspect ratio) |
| `scale` | number | 1 | Device pixel ratio override |
| `timeout` | number | 10000 | Reject after ms |

**Returns:** `Promise<{ data: Buffer, width: number, height: number, format: string }>`

### Setup

Screenshot is **disabled by default**. Enable via the server option:

```javascript
var app = bwserve.create({ port: 7902, allowScreenshot: true });
```

### Examples

```javascript
// Full page screenshot
var img = await client.screenshot();
require('fs').writeFileSync('page.png', img.data);

// Element screenshot with resize
var img = await client.screenshot('#dashboard', {
  format: 'jpeg',
  quality: 0.8,
  maxWidth: 512
});

// LLM visual feedback loop
client.render('#app', myCard);
var img = await client.screenshot('#app', { maxWidth: 800 });
var feedback = await visionModel.evaluate(img.data);
// refine TACO based on feedback...
```

### How it works

1. Server calls `client.screenshot(selector, options)` — returns a Promise
2. On first call, a capture function is registered on the client via the `register` protocol
3. The capture function is invoked via `call` with the selector and options
4. Client lazy-loads html2canvas (vendored, served from `/bw/lib/vendor/html2canvas.min.js`)
5. html2canvas renders the DOM element to a `<canvas>`
6. Client POSTs the base64 image data back to `/bw/return/screenshot/:clientId`
7. Server converts the data URL to a Buffer and resolves the Promise

### Security

- **Opt-in only:** `allowScreenshot: true` must be set in server options
- **DOM-level capture:** html2canvas reads the DOM — it cannot see other tabs, OS windows, or anything outside the page
- **No external requests:** html2canvas is vendored locally, not loaded from a CDN

## Server-to-Client Execution

Beyond DOM operations, the server can invoke functions and execute code on the client. This is organized in three tiers:

### Tier 1: `client.register(name, body)`

Send a named function to the client. The function body is a string that gets compiled once and cached. Use for reusable client-side behavior.

```javascript
// Register an auto-scroll function on connect
client.register('autoScroll',
  'function(sel) { var el = document.querySelector(sel); if (el) el.scrollTop = el.scrollHeight; }');

// Register a formatter
client.register('formatCurrency',
  'function(id, val) { var el = document.getElementById(id); if (el) el.textContent = "$" + Number(val).toFixed(2); }');
```

### Tier 2: `client.call(name, ...args)`

Invoke a previously registered function or a built-in function by name. This is the workhorse for non-DOM operations — safe, lightweight, no code transfer.

```javascript
// Call registered functions
client.call('autoScroll', '#chat');
client.call('formatCurrency', 'total', 42.5);

// Call built-in functions (always available, no registration needed)
client.call('focus', '#search-input');
client.call('scrollTo', '#bottom');
client.call('download', 'report.csv', csvContent, 'text/csv');
client.call('clipboard', 'Copied text');
client.call('redirect', '/dashboard');
client.call('log', 'Debug: user count =', users.length);
```

**Built-in functions:**

| Name | Args | Description |
|------|------|-------------|
| `scrollTo` | `selector` | Scroll element to bottom |
| `focus` | `selector` | Focus an input element |
| `download` | `filename, content, mimeType?` | Trigger a file download |
| `clipboard` | `text` | Copy text to clipboard |
| `redirect` | `url` | Navigate to a URL |
| `log` | `...args` | console.log from the server |

### Tier 3: `client.exec(code)`

Execute arbitrary JavaScript on the client. **Requires opt-in:** the server must be created with `allowExec: true` and/or the client connection with `{ allowExec: true }`. Without this flag, exec messages are silently rejected.

> **You probably don't need this.** If you're reaching for `exec`, consider whether `register` + `call` would work instead. `register` sends the function once; `call` invokes it by name with arguments. This covers scroll, focus, download, format, animate — essentially any reusable client-side behavior. `exec` is for truly one-off operations where registering a function would be wasteful.

```javascript
// Server side
client.exec("document.title = 'Updated at ' + new Date().toLocaleTimeString()");
client.exec("window.scrollTo(0, 0)");
```

**Security:** Prefer `call()` over `exec()` whenever possible. `call()` passes data as arguments (safe from injection), while `exec()` evaluates a code string. Never interpolate user input into `exec()` code strings.

### When to Use Each Tier

| Need | Use | Why |
|------|-----|-----|
| Update the DOM | replace/patch/append/remove | Declarative, inspectable, safe |
| Simple button click | `data-bw-action` | Zero code, just an attribute |
| Scroll after append | `call("scrollTo", sel)` | Built-in, no registration |
| Trigger file download | `call("download", ...)` | Built-in, safe |
| Reusable client logic | `register` + `call` | **Default choice.** Send once, invoke many times |
| Quick one-off operation | `exec` | Last resort. No registration overhead but requires `allowExec` |
| Production security | `call` (never `exec`) | Arguments can't inject code |

> **Rule of thumb:** Start with `data-bw-action` + DOM operations. When you need client-side behavior, use `register` + `call`. Only reach for `exec` if you have a genuine one-off need and understand the security implications.

## Client API Reference

### Connection (bwclient.js)

SSE connection management has moved to `bwclient.js`, which is auto-generated by the bwserve shell. The shell handles opening the EventSource, reconnection, and action dispatch. You do not need to call a connection function directly.

### `bw.apply(msg)`

Apply a single protocol message to the DOM. Called automatically by the shell connection, but also usable standalone for testing or custom transports. Handles all 9 message types.

```javascript
// DOM operations
bw.apply({ type: 'replace', target: '#app', node: { t: 'div', c: 'Hi' } });
bw.apply({ type: 'patch', target: 'counter', content: '42' });
bw.apply({ type: 'append', target: '#list', node: { t: 'li', c: 'New' } });
bw.apply({ type: 'remove', target: '#old' });
bw.apply({ type: 'batch', ops: [msg1, msg2] });

// Execution operations
bw.apply({ type: 'register', name: 'myFn', body: 'function() { ... }' });
bw.apply({ type: 'call', name: 'myFn', args: [] });
bw.apply({ type: 'exec', code: 'alert(1)' });  // needs allowExec
```

Returns `true` if the message was applied successfully, `false` otherwise.

### `bw.parseJSONFlex(str)`

Parse both strict JSON and r-prefix relaxed JSON. This is a state-machine parser that converts single-quoted strings to double-quoted, strips trailing commas, and handles escape sequences (`\'`, `\\`, `\n`, `\t`). Falls back to `JSON.parse()` for strict JSON (no r-prefix).

```javascript
// Strict JSON — passes through to JSON.parse():
bw.parseJSONFlex('{"type":"patch","target":"t","content":"42"}');

// r-prefix relaxed JSON (from ESP32 / C macros):
bw.parseJSONFlex("r{'type':'patch','target':'t','content':'42'}");

// Handles apostrophes in values:
bw.parseJSONFlex("r{'content':'Barry\\'s Room'}");
// → { content: "Barry's Room" }
```

The shell connection calls `bw.parseJSONFlex()` on every incoming SSE message automatically. You only need to call it directly if you're building a custom transport or testing.

## Transport

bwserve supports multiple transports:

- **SSE (default)**: Uses browser-native `EventSource`. Auto-reconnects. Best for most apps.
- **HTTP Polling**: `setInterval` + `fetch`. Works on any HTTP server including ESP32/Arduino.
- **WebSocket** (planned): Bidirectional. For high-frequency updates.

### HTTP Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `GET /` (or registered path) | GET | Serve auto-generated page shell HTML |
| `GET /bw/events/:clientId` | GET | SSE event stream |
| `POST /bw/return/action/:clientId` | POST | User action dispatch |
| `GET /bw/lib/bitwrench.umd.js` | GET | Serve bitwrench client JS |
| `GET /bw/lib/bitwrench.css` | GET | Serve bitwrench CSS |
| `POST /bw/return/screenshot/:clientId` | POST | Screenshot POST-back from client |
| `GET /bw/lib/vendor/:filename` | GET | Serve vendored libraries (allowlisted) |

### SSE Frame Format

Each protocol message is sent as a single SSE data frame:
```
data: {"type":"replace","target":"#app","node":{"t":"div","c":"Hello"}}

```

Keep-alive comments are sent every 15 seconds:
```
:keepalive

```

### Embedded Device (Polling) Transport

For ESP32, Arduino, and other constrained devices. The device serves compact JSON; the browser does all rendering.

```javascript
// Browser side: poll the device and apply messages
setInterval(function() {
  fetch('/bw/ui').then(function(r) { return r.text(); }).then(function(str) {
    bw.apply(bw.parseJSONFlex(str));
  });
}, 1000);
```

The device responds to `GET /bw/ui` with protocol messages using relaxed JSON (single quotes for C++ ergonomics). `bw.parseJSONFlex()` converts the relaxed format to strict JSON.

## Relaxed JSON (r-prefix format)

For embedded C/C++ systems, composing JSON with double-quoted strings is painful — every quote needs escaping (`\"`). bwserve supports **r-prefix relaxed JSON**: single-quoted strings with an `r` prefix character.

```
// Standard JSON in C (painful):
"{\"type\":\"patch\",\"target\":\"temp\",\"content\":\"23.5\"}"

// r-prefix relaxed JSON (natural):
"r{'type':'patch','target':'temp','content':'23.5'}"
```

The `r` prefix tells the parser to convert single quotes to double quotes before parsing. The browser's `bw.parseJSONFlex()` handles this automatically.

### Escaping Rule

Since single quotes delimit strings in r-prefix format, apostrophes in values must be escaped with `\'`:

```c
// Static text with apostrophe:
BW_PATCH(msg, "room", "Barry\\'s Room");

// Dynamic user text — use BW_PATCH_SAFE (auto-escapes):
char user_text[] = "it's 23.5 C";
BW_PATCH_SAFE(msg, sizeof(msg), "status", user_text);
```

This is still a huge win over standard JSON in C, where every quote needs `\"`.

**Direction:** r-prefix is outbound only (device to browser). The browser always sends strict JSON back via `fetch()`.

## bwcli serve — Pipe Server

`bwcli serve` turns **any language** into a bwserve backend. It opens two ports: a **web port** (browsers connect here) and an **input port** (your app sends protocol messages here via HTTP POST). Alternatively, use `--stdin` to pipe messages from stdin.

```
  Your App (any language)          bwcli serve         Browser(s)
┌───────────────────────┐    ┌───────────────┐    ┌─────────────┐
│  curl / Python / C    │    │  web: :8080   │<──>│  EventSource│
│  POST to :9000        │───>│  input: :9000 │    │  bw.client..│
│  or pipe to stdin     │    │  --stdin      │    │             │
└───────────────────────┘    └───────────────┘    └─────────────┘
```

### Usage

```bash
# Start the pipe server (dual port)
bwcli serve --port 8080 --input-port 9000

# Open browser automatically
bwcli serve --open

# Stdin mode (pipe messages from any command)
python sensor.py | bwcli serve --stdin --port 8080

# With verbose logging
bwcli serve -v
```

### Sending messages

```bash
# Patch a value via curl:
curl -X POST http://localhost:9000 \
  -H "Content-Type: application/json" \
  -d '{"type":"patch","target":"temp","content":"23.5 C"}'

# r-prefix relaxed JSON is also accepted:
curl -X POST http://localhost:9000 -d "r{'type':'patch','target':'temp','content':'23.5'}"
```

### From Python

```python
import requests, time, random

while True:
    temp = 20 + random.random() * 10
    requests.post("http://localhost:9000", json={
        "type": "patch",
        "target": "temp",
        "content": f"{temp:.1f} C"
    })
    time.sleep(2)
```

Both the input port and stdin mode accept strict JSON and r-prefix relaxed JSON. All messages are broadcast to every connected browser.

## Complete Examples

### Counter (render + patch + actions)

```javascript
import bwserve from 'bitwrench/bwserve';

var app = bwserve.create({ port: 7902 });
var count = 0;

app.page('/', function(client) {
  client.render('#app', {
    t: 'div', c: [
      { t: 'h2', c: 'Counter' },
      { t: 'span', a: { id: 'count' }, c: '0' },
      { t: 'button', a: { 'data-bw-action': 'inc' }, c: '+1' }
    ]
  });

  client.on('inc', function() {
    client.patch('count', String(++count));
  });
});

app.listen();
```

### Todo List (append + remove)

```javascript
app.page('/', function(client) {
  var nextId = 1;

  client.render('#app', {
    t: 'div', c: [
      { t: 'input', a: { type: 'text', id: 'inp' } },
      { t: 'button', a: { 'data-bw-action': 'add' }, c: 'Add' },
      { t: 'ul', a: { id: 'list' } }
    ]
  });

  client.on('add', function(data) {
    var id = 'item-' + nextId++;
    client.append('#list', {
      t: 'li', a: { id: id }, c: [
        data.inputValue || 'item',
        { t: 'button', a: { 'data-bw-action': 'del', 'data-bw-id': id }, c: 'x' }
      ]
    });
  });

  client.on('del', function(data) {
    if (data.bwId) client.remove('#' + data.bwId);
  });
});
```

### Dashboard (batch + register/call)

```javascript
app.page('/', function(client) {
  client.render('#app', {
    t: 'div', c: [
      { t: 'span', a: { id: 'users' }, c: '0' },
      { t: 'span', a: { id: 'orders' }, c: '0' },
      { t: 'span', a: { id: 'revenue' }, c: '$0' },
      { t: 'div', a: { id: 'log' } }
    ]
  });

  // Register a format function on the client
  client.register('formatNum',
    'function(id, val) { var el = document.getElementById(id); if (el) el.textContent = Number(val).toLocaleString(); }');

  // Update every second
  setInterval(function() {
    var users = Math.floor(Math.random() * 500);
    var orders = Math.floor(Math.random() * 50);
    client.batch([
      { type: 'call', name: 'formatNum', args: ['users', users] },
      { type: 'call', name: 'formatNum', args: ['orders', orders] },
      { type: 'patch', target: 'revenue', content: '$' + Math.floor(Math.random() * 10000) }
    ]);
  }, 1000);
});
```

### Chat with Auto-scroll (append + register + call)

```javascript
app.page('/', function(client) {
  client.render('#app', {
    t: 'div', c: [
      { t: 'div', a: { id: 'chat', style: 'max-height:400px;overflow-y:auto' } },
      { t: 'div', a: { style: 'display:flex;gap:8px' }, c: [
        { t: 'input', a: { type: 'text', id: 'msg-input' } },
        { t: 'button', a: { 'data-bw-action': 'send' }, c: 'Send' }
      ]}
    ]
  });

  // Register auto-scroll for reuse after each message
  client.register('scrollChat',
    'function() { var el = document.getElementById("chat"); if (el) el.scrollTop = el.scrollHeight; }');

  client.on('send', function(data) {
    if (!data.inputValue) return;

    // Append the message, then scroll to bottom
    client.append('#chat', {
      t: 'div', a: { style: 'padding:4px' }, c: data.inputValue
    });
    client.call('scrollChat');

    // Focus back on the input
    client.call('focus', '#msg-input');
  });
});
```

### File Download (call built-in)

```javascript
client.on('export', function(data) {
  var csv = 'id,name,score\n';
  records.forEach(function(r) {
    csv += r.id + ',' + r.name + ',' + r.score + '\n';
  });
  client.call('download', 'export.csv', csv, 'text/csv');
});
```

## Target Use Cases

- **Streamlit-style apps**: Data dashboards, ML experiment UIs, admin panels — server computes, browser displays
- **Embedded device dashboards**: ESP32/Raspberry Pi serves a web UI using lightweight polling
- **Agent-driven UI**: An AI agent pushes UI updates and uses `client.screenshot()` for visual feedback
- **Prototyping**: Server-side Node.js logic with zero frontend build step
- **Internal tools**: Quick admin panels without frontend framework overhead

## Attach Mode — Remote Debugging REPL

`bwcli attach` provides a built-in terminal-based debugger for any bitwrench page. It is bitwrench's answer to Playwright/Chrome DevTools — a REPL inspector that speaks the bwserve protocol.

### Quick Start

```bash
# Start the attach server
bwcli attach

# In the browser — add the drop-in script:
# <script src="http://localhost:7902/bw/attach.js"></script>
# Or paste in devtools console:
# var s=document.createElement('script');s.src='http://localhost:7902/bw/attach.js';document.head.appendChild(s);
```

Once connected, you get a REPL:

```
bw> document.title
"My Page"

bw> bw.$('.bw-card').length
3

bw> /tree #app 2
div#app
  div.main-panel
    h1#title

bw> /listen button click
Listening for click on button
[event] click on button → BUTTON#save-btn "Save"

bw> /screenshot body page.png
Saved: page.png (1440x900, 245832 bytes)
```

### How It Works

1. `bwcli attach` starts a bwserve instance (default port 7902)
2. The page loads `/bw/attach.js` which injects bitwrench (if not already loaded) and connects via SSE
3. You type JS expressions or slash commands in the terminal
4. The server sends protocol messages; the client evaluates and POSTs results back
5. Event listeners (via `/listen`) stream DOM events back to the terminal in real time

### REPL Commands

| Command | Description |
|---------|-------------|
| `<expression>` | Evaluate JS in the browser (e.g., `document.title`) |
| `/tree [sel] [depth]` | DOM tree summary (default: body, depth 3) |
| `/screenshot [sel] [file]` | Capture element to PNG (requires `--allow-screenshot`) |
| `/mount <sel> <comp> [json]` | Mount a BCCL component |
| `/render <sel> <taco-json>` | Render TACO at selector |
| `/patch <id> <content>` | Update element text by ID |
| `/listen <sel> <event>` | Watch for DOM events |
| `/unlisten <sel> <event>` | Stop watching events |
| `/exec <code>` | Execute JS (fire-and-forget) |
| `/clients` | List connected clients |
| `/help`, `/quit` | Help / exit |

### Security

Attach mode has `allowExec: true` always on — it's a debugging tool. The server binds to `localhost` by default. **Never expose to the public internet.**

For the full attach guide, see [bwcli attach documentation](bw-attach.md).

## Related

- [Protocol Reference Page](../pages/12-bwserve-protocol.html) — Interactive protocol reference with all 9 message types
- [Sandbox](../pages/14-bwserve-sandbox.html) — Try bwserve protocol in the browser (no server needed)
- [Screenshot Example](../examples/client-server/screenshot-server.js) — Runnable screenshot demo
- [Design Document](../dev/bw-client-server.md) — Protocol design decisions and architecture
- [CLI](cli.md) — The `bwcli` command for file conversion and pipe server
- [Attach Mode](bw-attach.md) — Full remote debugging REPL documentation
- [Embedded Tutorial](tutorial-embedded.md) — ESP32 IoT dashboard with C macros and r-prefix JSON
