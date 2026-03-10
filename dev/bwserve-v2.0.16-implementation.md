# bitwrench v2.0.16+ — Client-Server & Static Site Implementation Design

**Date**: 2026-03-10
**Status**: Design document for implementation review
**Covers**: bwserve (server-driven UI), client protocol, static site generation
**Prerequisites**: `dev/bw-client-server.md` (protocol design), `dev/bw-stream-agent-protocol-draft-2026-03-06.md` (stream protocol), `dev/bw-cli-design.md` (CLI phases)

---

## Purpose

This document validates the bitwrench grammar and developer ergonomics against
ten concrete use cases before we write production code. Each use case
exercises a different part of the surface area. If the API feels
wrong on paper, it'll feel worse in production.

The ten use cases span the full spectrum — from build-time static generation
to multi-user e-commerce:

| # | Use Case | Mode | Key Features |
|---|----------|------|-------------|
| 1 | Polling dashboard | HTTP poll (runtime) | `replace`, `patch`, relaxed JSON |
| 2 | Multi-user chat | SSE + POST (runtime) | `append`, `remove`, `replace`, broadcast, shared state |
| 3 | LLM streaming chat | SSE + POST (runtime) | `append`, `patch` (token streaming), `replace`, markdown in TACO |
| 4 | Streamlit-style dynamic UI | SSE + POST (runtime) | `replace`, `batch`, declarative events, server-computed layout |
| 5 | Static site generation | Build-time | `bw.html()`, TACO layouts, quikdown, themes, nav generation |
| 6 | LLM-generated UI | SSE + POST (runtime) | LLM emits TACO directly, structured UI from AI, incremental mutations |
| 7 | Database-backed CRUD app | SSE + POST (runtime) | Auth, forms, `sendForm`, sessions, Supabase/SQLite/PocketBase |
| 8 | Client-side routed SPA | Client JS (no bwserve) | `hashchange`/`popstate`, `bw.DOM()`, vanilla JS router, no server |
| 9 | Server-side routed app | SSE + POST (runtime) | `app.page()` multi-path, server pushes views, URL sync |
| 10 | E-commerce storefront | SSE + POST (runtime) | Cart state, product catalog, checkout flow, multi-user, roles |

---

## Architecture Overview

```
  Browser                            Node.js Server
 ┌──────────────────┐               ┌──────────────────────┐
 │ bitwrench.js     │               │ bwserve              │
 │                  │   GET /       │                      │
 │  bw.clientConnect├──────────────>│  app.page('/', fn)   │
 │  (opens SSE)     │               │                      │
 │                  │<──SSE────────│  client.render()     │
 │  bw.clientApply()│  {type,node} │  client.patch()      │
 │  -> bw.DOM()     │               │  client.append()     │
 │  -> bw.patch()   │               │  client.remove()     │
 │                  │               │  client.batch()      │
 │  o.events map    │               │  client.message()    │
 │  data-bw-action  │──POST───────>│                      │
 │  conn.sendAction │  {action,data}│  client.on(action,fn)│
 └──────────────────┘               └──────────────────────┘
```

### Two-layer architecture

**Layer 1 — bitwrench.js (client, browser)**
Lives in the existing `src/bitwrench.js`. Adds ~150 lines:
- `bw.clientConnect(url, opts)` — establish connection, return conn object
- `bw.clientApply(msg)` — dispatch protocol message to DOM
- `bw.clientParse(str)` — relaxed JSON parser (for embedded devices)
- Declarative `o.events` wiring in `bw.createDOM()`

**Layer 2 — bwserve (server, Node.js)**
Lives in `src/bwserve/`. Separate npm import (`bitwrench/bwserve`).
- `bwserve.create(opts)` — create app
- `app.page(path, handler)` — register page
- `client.render/patch/append/remove/batch/message` — push UI updates
- Shell page generation with auto-injected bitwrench

These layers are independently testable. Client-side can be tested with
fake SSE (mock EventSource). Server-side can be tested by inspecting
`client._sent` array (already in the stub).

---

## Client-Side API Design

### `bw.clientConnect(url, opts)`

```javascript
var conn = bw.clientConnect('/bw/events', {
  transport: 'sse',           // 'sse' (default) | 'poll' | 'ws'
  interval: 1000,             // poll interval (ms), ignored for SSE/WS
  target: '#content',         // default target for replace messages
  actionUrl: '/bw/action',    // POST endpoint for user actions
  relaxedJson: false,         // parse single-quoted JSON (embedded devices)
  reconnect: true,            // auto-reconnect on disconnect (default true)
  onStatus: function(s) {}    // 'connecting' | 'connected' | 'disconnected'
});

// Connection object API:
conn.sendAction(action, data);   // POST { action, data } to actionUrl
conn.on('open', handler);        // connection established
conn.on('message', handler);     // raw message received (before apply)
conn.on('error', handler);       // connection error
conn.on('close', handler);       // connection closed
conn.close();                    // disconnect
```

**Design rationale:**
- `target` is a default — individual messages can override with their own `target` field
- `actionUrl` separate from event URL because POST and SSE may route differently
- `onStatus` callback for UI indicators ("Connecting...", "Connected", "Reconnecting...")
- SSE uses native `EventSource` (auto-reconnect built-in, no library needed)
- Poll uses `setInterval` + `fetch` (works on any HTTP server, including ESP32)

### `bw.clientApply(msg)`

```javascript
// Dispatches a single protocol message to the DOM.
// Called automatically by clientConnect, but also usable standalone.

bw.clientApply({ type: 'replace', target: '#app', node: { t: 'div', c: 'Hello' } });
bw.clientApply({ type: 'append', target: '#chat', node: { t: 'p', c: 'New message' } });
bw.clientApply({ type: 'patch', target: 'counter', content: '42' });
bw.clientApply({ type: 'remove', target: '#old-item' });
bw.clientApply({ type: 'batch', ops: [ msg1, msg2, msg3 ] });
bw.clientApply({ type: 'message', target: 'my-comp', action: 'refresh', data: {} });
```

**Target resolution order:**
1. If target starts with `#` or `.` — use as CSS selector: `document.querySelector(target)`
2. If target matches a `bw.uuid()` pattern — look up in UUID registry
3. If target matches a ComponentHandle `userTag` — dispatch via `bw.message()`
4. Fallback: `document.getElementById(target)`

### Declarative Events (`o.events`)

Functions can't serialize over SSE. The `o.events` map describes interactions
declaratively. `bw.createDOM()` interprets this map and wires real DOM listeners.

```javascript
// Server sends this TACO (JSON-safe):
{
  t: 'button',
  a: { class: 'bw-btn bw-btn-primary' },
  c: 'Save',
  o: {
    events: {
      click: { action: 'save' }
    }
  }
}

// bw.createDOM() wires: el.addEventListener('click', function() {
//   conn.sendAction('save', {});
// });
```

**Event descriptor fields:**

| Field | Type | Description |
|-------|------|-------------|
| `action` | string | Action name sent to server |
| `sendValue` | boolean | Include `el.value` in data |
| `sendForm` | string | CSS selector of form — include all form values |
| `debounce` | number | Debounce ms (useful for search-as-you-type) |
| `throttle` | number | Throttle ms |
| `filter` | string | Key filter for keydown/keyup (e.g., `'Enter'`) |
| `prevent` | boolean | Call `event.preventDefault()` |
| `data` | object | Static data merged into action payload |

**Examples of common patterns:**

```javascript
// Button click — simplest case
o: { events: { click: { action: 'increment' } } }

// Search input with debounce — sends value after 300ms idle
o: { events: { input: { action: 'search', sendValue: true, debounce: 300 } } }

// Form submit — collects all form values
o: { events: { submit: { action: 'submit-form', sendForm: '#my-form', prevent: true } } }

// Enter key on input
o: { events: { keydown: { action: 'send', sendValue: true, filter: 'Enter' } } }

// Range slider — throttled to avoid flooding server
o: { events: { input: { action: 'set-brightness', sendValue: true, throttle: 100 } } }
```

**`data-bw-action` shorthand:**

For the common case of a button that sends a click action:

```javascript
// These are equivalent:
{ t: 'button', a: { 'data-bw-action': 'save' }, c: 'Save' }
{ t: 'button', c: 'Save', o: { events: { click: { action: 'save' } } } }
```

The shell page auto-wires `data-bw-action` via delegated event listener on document.
`o.events` is the general mechanism; `data-bw-action` is sugar for the 80% case.

---

## Server-Side API Design

### `bwserve.create(opts)`

```javascript
import bwserve from 'bitwrench/bwserve';

var app = bwserve.create({
  port: 7902,               // default port
  title: 'My App',          // <title> tag
  theme: 'ocean',           // optional: generateTheme preset name or config
  static: './public',       // optional: serve static files from this dir
  injectBitwrench: true,    // auto-inject bitwrench UMD + default styles
  shell: null               // optional: custom shell HTML template
});
```

### `app.page(path, handler)`

```javascript
app.page('/', function(client) {
  // client is a BwServeClient representing one SSE connection.
  // This handler fires once when the browser connects.
  // All rendering happens through the client object.

  client.render('#app', { t: 'div', c: 'Hello world' });
});
```

### `app.onAction(action, handler)`

Global action handler (fires for ANY client that sends this action):

```javascript
app.onAction('increment', function(data, client) {
  count++;
  client.patch('counter', String(count));
});
```

### `app.onInterval(ms, handler)`

Periodic broadcast to all connected clients:

```javascript
app.onInterval(1000, function(clients) {
  clients.patch('clock', new Date().toLocaleTimeString());
});
```

`clients` is a broadcast handle — calling `.patch()`, `.render()`, etc. on it
sends to ALL connected clients.

### `app.broadcast`

Access the broadcast handle at any time:

```javascript
app.broadcast.append('#notifications', {
  t: 'div', a: { class: 'bw-alert bw-alert-info' },
  c: 'Server restarting in 5 minutes'
});
```

### `app.listen(callback)` / `app.close()`

```javascript
app.listen(function() {
  console.log('bwserve running on http://localhost:' + app.port);
});

// Graceful shutdown
app.close();
```

### BwServeClient API

Each connected browser tab gets a `BwServeClient` instance:

```javascript
// Push UI updates
client.render(target, taco);            // replace subtree
client.patch(id, content, attr);        // update text/attributes
client.append(target, taco);            // add child
client.remove(target);                  // remove element
client.batch(ops);                      // multiple operations atomically
client.message(target, action, data);   // dispatch to ComponentHandle

// Convenience
client.patchAll({ id1: val1, id2: val2 });  // batch patch sugar

// Per-client action handlers (override global)
client.on('action-name', function(data) { ... });

// Client metadata
client.id;                              // unique connection ID
client.close();                         // disconnect this client
```

---

## Use Case 1: Polling Dashboard

**Scenario**: A metrics page that polls a REST API every 2 seconds and updates
dashboard cards with current values. No SSE needed — just fetch + render.

**This validates**: `bw.clientConnect` with `transport: 'poll'`, `replace` and
`patch` message types, polling interval, and the basic client-side flow without
any server-side bwserve dependency.

### Architecture

```
Browser                     Any HTTP Server (Node, Python, Go, ESP32)
┌──────────────┐            ┌──────────────────┐
│ bitwrench.js │            │ GET /api/metrics  │
│              │──poll 2s──>│ returns JSON:     │
│ clientConnect│            │ { type:'replace', │
│ clientApply  │<───────────│   node: {...} }   │
│ -> bw.DOM()  │            │                   │
└──────────────┘            └──────────────────┘
```

The server is not a bwserve app — it's any HTTP endpoint that returns protocol
messages. This is the simplest bwserve integration: zero server-side library needed.

### Client Code (browser)

```html
<!DOCTYPE html>
<html>
<head>
  <title>Metrics Dashboard</title>
  <script src="https://cdn.jsdelivr.net/npm/bitwrench@2/dist/bitwrench.umd.min.js"></script>
</head>
<body>
  <div id="app">Loading...</div>
  <script>
    bw.loadDefaultStyles();

    // Connect using polling transport.
    // Every 2 seconds: GET /api/metrics -> parse response -> apply to DOM.
    var conn = bw.clientConnect('/api/metrics', {
      transport: 'poll',
      interval: 2000,
      target: '#app'
    });

    // Optional: show connection status
    conn.on('error', function() {
      bw.DOM('#status', { t: 'span', a: { class: 'bw-text-danger' }, c: 'Offline' });
    });
  </script>
</body>
</html>
```

### Server Code (Node.js — plain HTTP, no bwserve)

```javascript
// serve-metrics.js — simple HTTP endpoint returning protocol messages.
// This shows that any language/framework can be a bwserve "server".

var http = require('http');

function getMetrics() {
  return {
    cpu: (Math.random() * 100).toFixed(1),
    memory: (Math.random() * 16).toFixed(1),
    requests: Math.floor(Math.random() * 10000),
    uptime: process.uptime().toFixed(0)
  };
}

http.createServer(function(req, res) {
  if (req.url === '/api/metrics') {
    var m = getMetrics();

    // Return a bwserve protocol message.
    // The client's bw.clientApply() knows how to handle this.
    var msg = {
      type: 'replace',
      target: '#app',
      node: {
        t: 'div', a: { class: 'bw-container' }, c: [
          { t: 'h1', c: 'System Metrics' },
          { t: 'div', a: { class: 'bw-row' }, c: [
            { t: 'div', a: { class: 'bw-col' }, c: [
              { t: 'div', a: { class: 'bw-card' }, c: [
                { t: 'div', a: { class: 'bw-card-body' }, c: [
                  { t: 'h5', c: 'CPU' },
                  { t: 'p', a: { id: 'cpu', style: 'font-size:2rem' }, c: m.cpu + '%' }
                ]}
              ]}
            ]},
            { t: 'div', a: { class: 'bw-col' }, c: [
              { t: 'div', a: { class: 'bw-card' }, c: [
                { t: 'div', a: { class: 'bw-card-body' }, c: [
                  { t: 'h5', c: 'Memory' },
                  { t: 'p', a: { id: 'mem', style: 'font-size:2rem' }, c: m.memory + ' GB' }
                ]}
              ]}
            ]}
          ]}
        ]
      }
    };

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(msg));
    return;
  }

  // Serve the static HTML page
  // ... (serve the HTML above)
}).listen(3000);
```

### Optimization: patch instead of replace

The above replaces the entire DOM tree every 2 seconds. For smoother updates,
the server can send patches after the first full render:

```javascript
// First request: full replace (build the DOM structure)
// Subsequent requests: patch only changed values

var firstRender = {};   // track per client

// If we switch to SSE, we can do this:
// client.render('#app', fullTree);          // first time
// client.patchAll({ cpu: '45.2%', mem: '8.3 GB' });  // subsequent
//
// With polling, we can return different message types:
if (!firstRender[clientId]) {
  firstRender[clientId] = true;
  return { type: 'replace', target: '#app', node: fullTree };
} else {
  return { type: 'batch', ops: [
    { type: 'patch', target: 'cpu', content: m.cpu + '%' },
    { type: 'patch', target: 'mem', content: m.memory + ' GB' }
  ]};
}
```

### Ergonomics Assessment

**What works well:**
- Zero server library needed — any HTTP endpoint works
- Client setup is 3 lines (connect, interval, target)
- Protocol messages are self-describing JSON
- Works with ESP32 (add `relaxedJson: true` for single-quoted JSON)

**Friction points identified:**
- Full `replace` every poll is wasteful. Need easy path to `patch`.
- Client has no way to know if this is first render or update (server tracks state).
- No client-side diffing — if server sends `replace`, entire subtree is rebuilt.

**Decision**: For polling, the server is responsible for deciding replace vs patch.
This is fine because polling is inherently server-controlled. The client is just
a renderer. This matches the Streamlit mental model.

---

## Use Case 2: Multi-User Chat with Shared State

**Scenario**: A chat room where multiple browser tabs share state. Messages from
any user appear in all connected browsers. Users can send, edit, and delete messages.

**This validates**: SSE broadcast, per-client vs broadcast operations, `append`
for new messages, `replace` for edits, `remove` for deletes, `sendValue` for
input collection, and multi-client state management.

### Architecture

```
Browser A ──SSE──┐              ┌──────────────┐
                  ├──────────>  │ Node.js      │
Browser B ──SSE──┤  POST action │ bwserve app  │
                  ├──────────>  │              │
Browser C ──SSE──┘              │ shared state │
                  <────SSE──── │ (messages[]) │
  all browsers    broadcast     └──────────────┘
```

### Server Code

```javascript
// examples/serve-chat.js
import bwserve from 'bitwrench/bwserve';

var app = bwserve.create({
  port: 7902,
  title: 'Chat Room',
  theme: 'ocean'
});

// Shared state — all clients see the same messages
var messages = [];
var nextId = 1;
var userNames = {};   // clientId -> username

// Helper: build a message TACO node
function msgNode(msg) {
  return {
    t: 'div',
    a: {
      id: msg.id,
      class: 'bw-card',
      style: 'margin-bottom:8px'
    },
    c: [
      { t: 'div', a: { class: 'bw-card-body' }, c: [
        { t: 'strong', c: msg.user + ': ' },
        { t: 'span', a: { id: msg.id + '-text' }, c: msg.text },
        { t: 'small', a: {
          style: 'float:right;opacity:0.5'
        }, c: msg.time + (msg.edited ? ' (edited)' : '') }
      ]}
    ]
  };
}

// Initial page: chat container + input form
app.page('/', function(client) {
  // Prompt for username
  client.render('#app', {
    t: 'div', a: { class: 'bw-container', style: 'max-width:600px;margin:0 auto' }, c: [
      { t: 'h2', c: 'Chat Room' },
      { t: 'div', a: { id: 'status', class: 'bw-text-muted' }, c: '' },

      // Chat message container — messages appended here
      { t: 'div', a: {
        id: 'chat',
        style: 'height:400px;overflow-y:auto;border:1px solid #ddd;padding:8px;border-radius:4px'
      }, c: '' },

      // Input area
      { t: 'div', a: { style: 'display:flex;gap:8px;margin-top:8px' }, c: [
        { t: 'input', a: {
          id: 'msg-input',
          type: 'text',
          class: 'bw-form-control',
          placeholder: 'Type a message...',
          style: 'flex:1'
        }, o: {
          events: {
            keydown: {
              action: 'send-message',
              sendValue: true,
              filter: 'Enter'
            }
          }
        }},
        { t: 'button', a: { class: 'bw-btn bw-btn-primary' }, c: 'Send',
          o: {
            events: {
              click: {
                action: 'send-message',
                sendForm: '#msg-input'   // collect sibling input value
              }
            }
          }
        }
      ]}
    ]
  });

  // Send existing messages to newly connected client
  messages.forEach(function(m) {
    client.append('#chat', msgNode(m));
  });

  // Assign username
  var name = 'User-' + client.id.slice(0, 4);
  userNames[client.id] = name;

  // Update all clients with user count
  app.broadcast.patch('status', Object.keys(userNames).length + ' users online');
});

// Handle new messages — broadcast to ALL clients
app.onAction('send-message', function(data, client) {
  var text = (data.value || '').trim();
  if (!text) return;

  var msg = {
    id: 'msg-' + (nextId++),
    user: userNames[client.id] || 'anon',
    text: text,
    time: new Date().toLocaleTimeString(),
    edited: false
  };
  messages.push(msg);

  // Broadcast to ALL connected clients (including sender)
  app.broadcast.append('#chat', msgNode(msg));

  // Clear the sender's input
  client.patch('msg-input', '', { value: '' });
});

// Handle message edits — broadcast the replacement
app.onAction('edit-message', function(data, client) {
  var msg = messages.find(function(m) { return m.id === data.id; });
  if (!msg) return;

  msg.text = data.text;
  msg.edited = true;

  // Replace just that message for ALL clients
  app.broadcast.render('#' + msg.id, msgNode(msg));
});

// Handle message deletes — broadcast the removal
app.onAction('delete-message', function(data, client) {
  messages = messages.filter(function(m) { return m.id !== data.id; });
  app.broadcast.remove('#' + data.id);
});

// Clean up when a client disconnects
app.onDisconnect(function(client) {
  delete userNames[client.id];
  app.broadcast.patch('status', Object.keys(userNames).length + ' users online');
});

app.listen();
```

### Protocol Message Trace

Here's what goes over the wire for a typical chat interaction:

```
=== Browser A connects ===
SSE <- { type: 'replace', target: '#app', node: { t:'div', c:[...chat UI...] } }
SSE <- { type: 'patch', target: 'status', content: '1 users online' }

=== Browser B connects ===
(B gets same replace + existing messages via append)
SSE -> all: { type: 'patch', target: 'status', content: '2 users online' }

=== User A types "hello" and presses Enter ===
POST -> { action: 'send-message', data: { value: 'hello' } }
SSE -> all: { type: 'append', target: '#chat', node: { t:'div', id:'msg-1', ... } }
SSE -> A only: { type: 'patch', target: 'msg-input', content: '', attr: { value: '' } }

=== User B types "hi!" ===
POST -> { action: 'send-message', data: { value: 'hi!' } }
SSE -> all: { type: 'append', target: '#chat', node: { t:'div', id:'msg-2', ... } }

=== User A edits their message ===
POST -> { action: 'edit-message', data: { id: 'msg-1', text: 'hello everyone' } }
SSE -> all: { type: 'replace', target: '#msg-1', node: { ...updated... } }

=== User A deletes their message ===
POST -> { action: 'delete-message', data: { id: 'msg-1' } }
SSE -> all: { type: 'remove', target: '#msg-1' }

=== Browser B disconnects ===
SSE -> all: { type: 'patch', target: 'status', content: '1 users online' }
```

### Ergonomics Assessment

**What works well:**
- `app.broadcast` vs `client` makes single-client vs all-client intent clear
- `append` for messages is natural — chat is inherently append-only
- `sendValue: true` + `filter: 'Enter'` captures the common "type + Enter" pattern cleanly
- Server-side message store + replay on connect gives correct state for late joiners
- `app.onDisconnect()` handles cleanup naturally

**Friction points identified:**
- **Input clearing**: `client.patch('msg-input', '', { value: '' })` feels clunky.
  Should we add `client.clear('msg-input')` sugar? Or let the client auto-clear
  inputs after `sendAction`? **Decision**: Auto-clear is too magic. The explicit
  patch is verbose but predictable. Could add `client.clearInput(id)` as sugar.
- **sendForm vs sendValue**: For the chat input, we want just one input's value.
  `sendValue: true` on the input's keydown event sends `data.value`. But the
  button click needs to collect a sibling input's value, which is different.
  **Decision**: `sendForm` takes a selector and collects `{name: value}` from
  all inputs within. For single inputs, `sendValue: true` on the input event is simpler.
- **Scroll position**: After `append`, should the chat auto-scroll to bottom?
  **Decision**: Yes, `bw.clientApply` for `append` should scroll if the container
  was already at the bottom (user was reading latest). If user scrolled up to read
  history, don't scroll. This is the standard chat UX. Implement as:
  ```javascript
  var wasAtBottom = (container.scrollHeight - container.scrollTop - container.clientHeight) < 50;
  container.appendChild(bw.createDOM(node));
  if (wasAtBottom) container.scrollTop = container.scrollHeight;
  ```

**New API needed:**
- `app.onDisconnect(handler)` — fires when a client's SSE connection closes
- Auto-scroll behavior in `bw.clientApply` for `append` operations

---

## Use Case 3: LLM Streaming Chat

**Scenario**: A chat interface where user messages are sent to an LLM (via
OpenRouter, Ollama, or LM Studio). The LLM response streams token-by-token.
Supports markdown rendering in responses.

**This validates**: Streaming `patch` updates (token-by-token append to a growing
string), markdown-to-TACO conversion, typing indicators, abort/cancel, and the
ergonomics of building AI chat UIs.

### Architecture

```
Browser              bwserve              LLM API
┌──────────┐        ┌──────────┐        ┌──────────────┐
│ chat UI  │──POST─>│ on('send')│──HTTP─>│ OpenRouter   │
│          │        │          │<stream─│ /completions │
│          │<──SSE──│ patch()  │  tokens│              │
│          │        │ (per tok)│        │              │
└──────────┘        └──────────┘        └──────────────┘
```

### Server Code

```javascript
// examples/serve-llm-chat.js
import bwserve from 'bitwrench/bwserve';

var app = bwserve.create({
  port: 7902,
  title: 'LLM Chat',
  theme: 'slate'
});

// Per-client conversation history
var conversations = {};

// LLM provider config — works with OpenRouter, Ollama, LM Studio
var LLM_URL = process.env.LLM_URL || 'http://localhost:11434/v1/chat/completions';
var LLM_MODEL = process.env.LLM_MODEL || 'llama3';
var LLM_KEY = process.env.LLM_API_KEY || '';

// Helper: stream LLM completion, calling onToken for each token
async function streamCompletion(messages, onToken, onDone, onError) {
  try {
    var resp = await fetch(LLM_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': LLM_KEY ? 'Bearer ' + LLM_KEY : undefined
      },
      body: JSON.stringify({
        model: LLM_MODEL,
        messages: messages,
        stream: true
      })
    });

    var reader = resp.body.getReader();
    var decoder = new TextDecoder();
    var buffer = '';

    while (true) {
      var chunk = await reader.read();
      if (chunk.done) break;

      buffer += decoder.decode(chunk.value, { stream: true });
      var lines = buffer.split('\n');
      buffer = lines.pop();   // keep incomplete line

      for (var i = 0; i < lines.length; i++) {
        var line = lines[i].trim();
        if (!line.startsWith('data: ')) continue;
        var data = line.slice(6);
        if (data === '[DONE]') continue;

        try {
          var parsed = JSON.parse(data);
          var token = parsed.choices[0].delta.content;
          if (token) onToken(token);
        } catch (e) { /* skip malformed chunks */ }
      }
    }

    onDone();
  } catch (e) {
    onError(e);
  }
}

// Build the chat UI
app.page('/', function(client) {
  conversations[client.id] = [];

  client.render('#app', {
    t: 'div', a: { class: 'bw-container', style: 'max-width:700px;margin:0 auto' }, c: [
      { t: 'h2', c: 'LLM Chat' },
      { t: 'div', a: { id: 'model-info', class: 'bw-text-muted' },
        c: 'Model: ' + LLM_MODEL },

      // Chat messages
      { t: 'div', a: {
        id: 'chat',
        style: 'height:500px;overflow-y:auto;padding:12px'
      }, c: '' },

      // Input area
      { t: 'div', a: { style: 'display:flex;gap:8px;margin-top:8px' }, c: [
        { t: 'textarea', a: {
          id: 'user-input',
          class: 'bw-form-control',
          placeholder: 'Ask anything...',
          rows: '2',
          style: 'flex:1;resize:none'
        }, o: {
          events: {
            keydown: {
              action: 'send',
              sendValue: true,
              filter: 'Enter',
              prevent: true     // prevent newline on Enter
            }
          }
        }},
        { t: 'button', a: {
          id: 'send-btn',
          class: 'bw-btn bw-btn-primary'
        }, c: 'Send', o: {
          events: { click: { action: 'send', sendForm: '#user-input' } }
        }},
        { t: 'button', a: {
          id: 'stop-btn',
          class: 'bw-btn bw-btn-danger',
          style: 'display:none'
        }, c: 'Stop', o: {
          events: { click: { action: 'stop' } }
        }}
      ]}
    ]
  });
});

// Handle send message
app.onAction('send', function(data, client) {
  var text = (data.value || '').trim();
  if (!text) return;

  var history = conversations[client.id];
  if (!history) return;

  // Add user message to history
  history.push({ role: 'user', content: text });
  var userMsgId = 'msg-' + Date.now() + '-user';

  // Display user message
  client.append('#chat', {
    t: 'div', a: { id: userMsgId, class: 'bw-card', style: 'margin-bottom:8px;background:#e3f2fd' },
    c: { t: 'div', a: { class: 'bw-card-body' }, c: [
      { t: 'strong', c: 'You: ' },
      { t: 'span', c: text }
    ]}
  });

  // Clear input, show stop button, disable send
  client.batch([
    { type: 'patch', target: 'user-input', content: '', attr: { value: '', disabled: 'true' } },
    { type: 'patch', target: 'send-btn', attr: { disabled: 'true' } },
    { type: 'patch', target: 'stop-btn', attr: { style: '' } }   // show stop button
  ]);

  // Create assistant message container with typing indicator
  var assistMsgId = 'msg-' + Date.now() + '-assist';
  var assistTextId = assistMsgId + '-text';

  client.append('#chat', {
    t: 'div', a: { id: assistMsgId, class: 'bw-card', style: 'margin-bottom:8px' },
    c: { t: 'div', a: { class: 'bw-card-body' }, c: [
      { t: 'strong', c: 'Assistant: ' },
      { t: 'div', a: { id: assistTextId }, c: '...' }
    ]}
  });

  // Stream LLM response
  var fullResponse = '';
  var aborted = false;

  // Store abort flag on client for the stop button
  client._activeStream = {
    abort: function() { aborted = true; }
  };

  streamCompletion(
    history,

    // onToken — called for each streamed token
    function(token) {
      if (aborted) return;
      fullResponse += token;

      // PATCH the assistant message with accumulated text.
      // For markdown rendering, we convert on each patch.
      // bw.clientApply on the client side uses bw.DOM() for replace,
      // which handles the TACO tree correctly.
      client.render('#' + assistTextId, markdownToTaco(fullResponse));
    },

    // onDone
    function() {
      // Save to history
      history.push({ role: 'assistant', content: fullResponse });

      // Re-enable input
      client.batch([
        { type: 'patch', target: 'user-input', attr: { disabled: null } },
        { type: 'patch', target: 'send-btn', attr: { disabled: null } },
        { type: 'patch', target: 'stop-btn', attr: { style: 'display:none' } }
      ]);
      client._activeStream = null;
    },

    // onError
    function(err) {
      client.patch(assistTextId, 'Error: ' + err.message);
      client.batch([
        { type: 'patch', target: 'user-input', attr: { disabled: null } },
        { type: 'patch', target: 'send-btn', attr: { disabled: null } },
        { type: 'patch', target: 'stop-btn', attr: { style: 'display:none' } }
      ]);
      client._activeStream = null;
    }
  );
});

// Handle stop button
app.onAction('stop', function(data, client) {
  if (client._activeStream) {
    client._activeStream.abort();
  }
});

// Clean up on disconnect
app.onDisconnect(function(client) {
  delete conversations[client.id];
});

// Helper: convert markdown string to TACO.
// Uses bitwrench's vendored quikdown parser.
function markdownToTaco(md) {
  // Option A: Parse markdown server-side, send as TACO tree
  // This requires importing quikdown on the server:
  //   import { quikdown } from 'bitwrench/vendor/quikdown';
  //   var html = quikdown(md);
  //   return { t: 'div', c: bw.raw(html) };
  //
  // Option B: Send raw markdown, let client render it
  // This requires bitwrench client to have markdown support.
  //
  // For now, use Option A — server-side rendering.
  // The TACO wraps pre-rendered HTML in a bw.raw() sentinel.
  return { t: 'div', a: { class: 'bw-prose' }, c: md };
  // TODO: integrate quikdown for proper markdown rendering
}

app.listen();
```

### Protocol Message Trace — LLM Streaming

```
=== User sends "What is TACO format?" ===
POST -> { action: 'send', data: { value: 'What is TACO format?' } }

SSE <- { type: 'append', target: '#chat', node: { ...user message card... } }
SSE <- { type: 'batch', ops: [
          { type: 'patch', target: 'user-input', content: '', attr: { value: '', disabled: 'true' } },
          { type: 'patch', target: 'send-btn', attr: { disabled: 'true' } },
          { type: 'patch', target: 'stop-btn', attr: { style: '' } }
        ]}
SSE <- { type: 'append', target: '#chat', node: { ...assistant card with "..."... } }

=== LLM tokens stream in ===
SSE <- { type: 'replace', target: '#msg-...-text', node: { t:'div', c:'TACO' } }
SSE <- { type: 'replace', target: '#msg-...-text', node: { t:'div', c:'TACO stands' } }
SSE <- { type: 'replace', target: '#msg-...-text', node: { t:'div', c:'TACO stands for' } }
SSE <- { type: 'replace', target: '#msg-...-text', node: { t:'div', c:'TACO stands for Tag,' } }
...  (one replace per token, ~50-100ms apart)

=== LLM stream complete ===
SSE <- { type: 'batch', ops: [
          { type: 'patch', target: 'user-input', attr: { disabled: null } },
          { type: 'patch', target: 'send-btn', attr: { disabled: null } },
          { type: 'patch', target: 'stop-btn', attr: { style: 'display:none' } }
        ]}
```

### Ergonomics Assessment

**What works well:**
- Token streaming maps to repeated `replace` on the text container — clean
- `batch` for UI state changes (disable input, show stop, etc.) is atomic
- Abort/stop is simple — set a flag, check it in the token callback
- Conversation history is per-client, stored server-side — no client state needed
- LLM provider is just a URL — works with OpenRouter, Ollama, LM Studio

**Friction points identified:**
- **Token-by-token replace is chatty**: Each token sends a full `replace` with the
  accumulated text. At 30 tokens/sec, that's 30 SSE messages/sec. Each message
  includes the full text so far (not just the delta).
  **Decision**: Accept this for now. SSE is lightweight (text protocol), and the
  full text is usually < 4KB. If profiling shows issues, add a `patch-append`
  message type that appends text to an element's textContent without replacing.
  Alternative: buffer tokens server-side and flush every 100ms (5-10 messages/sec).

- **Markdown rendering**: Converting markdown to TACO on every token is expensive.
  **Decision**: Two strategies:
  1. **Simple**: Send plain text during streaming, replace with rendered markdown
     on completion. The typing effect uses `{ t: 'div', c: fullText }` (plain text),
     and the final message uses `client.render('#id', markdownToTaco(fullText))`.
  2. **Rich**: Send rendered markdown on every token. Use quikdown (fast, < 1ms for
     typical messages). Only re-render every 100ms, not every token.
  Start with strategy 1. Upgrade to 2 if users want live markdown preview.

- **Removing disabled attribute**: `{ disabled: null }` to remove is non-obvious.
  **Decision**: This is a standard pattern (null = remove attribute). Document it.
  Alternative: `{ disabled: false }` could also work — `bw.clientApply` interprets
  `false` as "remove attribute" for boolean HTML attributes.

**New concepts needed:**
- **Token buffering**: Optional server-side buffer that flushes patches every N ms
  instead of per-token. Add to BwServeClient:
  ```javascript
  client.startBuffer(flushMs);   // start batching, flush every N ms
  client.stopBuffer();           // flush remaining, stop batching
  ```
  This is a performance optimization, not a protocol change. The messages are identical.

---

## Use Case 4: Streamlit-Style Dynamic UI

**Scenario**: A data analysis app where the server generates the entire UI based
on server-side state. User interactions (dropdowns, sliders, buttons) trigger
server-side recomputation that rebuilds affected UI sections.

**This validates**: Full server-driven rendering, declarative events for form
controls (select, range, checkbox), `replace` for section rebuilds, `batch` for
multi-section updates, and the ergonomics of the "server thinks, client renders"
model.

### Architecture

```
Browser                        bwserve
┌──────────────────┐          ┌───────────────────────┐
│                  │          │ Server State           │
│  [Select: AAPL] │──POST──> │   dataset = 'AAPL'     │
│  [Range: 30]    │          │   window = 30           │
│                  │          │                         │
│  ┌─────────────┐│          │ recompute():            │
│  │ Summary Card ││<──SSE── │   query data            │
│  │ Chart        ││          │   build summary TACO   │
│  │ Data Table   ││          │   build chart TACO     │
│  └─────────────┘│          │   build table TACO     │
└──────────────────┘          │   batch replace all 3  │
                              └───────────────────────┘
```

### Server Code

```javascript
// examples/serve-dashboard.js
// A Streamlit-style data analysis dashboard.
import bwserve from 'bitwrench/bwserve';

var app = bwserve.create({
  port: 7902,
  title: 'Stock Dashboard',
  theme: 'ocean'
});

// Simulated data source
function getStockData(symbol, days) {
  var data = [];
  var price = symbol === 'AAPL' ? 185 : symbol === 'GOOG' ? 175 : 420;
  for (var i = 0; i < days; i++) {
    price += (Math.random() - 0.48) * 5;
    data.push({
      date: new Date(Date.now() - (days - i) * 86400000).toISOString().slice(0, 10),
      price: Math.max(0, price).toFixed(2),
      volume: Math.floor(Math.random() * 10000000)
    });
  }
  return data;
}

function computeSummary(data) {
  var prices = data.map(function(d) { return parseFloat(d.price); });
  var latest = prices[prices.length - 1];
  var first = prices[0];
  var change = ((latest - first) / first * 100).toFixed(1);
  var high = Math.max.apply(null, prices).toFixed(2);
  var low = Math.min.apply(null, prices).toFixed(2);
  return { latest: latest.toFixed(2), change: change, high: high, low: low };
}

// Build the full page UI from current state
function buildPage(state) {
  var data = getStockData(state.symbol, state.days);
  var summary = computeSummary(data);
  var changeColor = parseFloat(summary.change) >= 0 ? '#27ae60' : '#e74c3c';
  var changeSign = parseFloat(summary.change) >= 0 ? '+' : '';

  return {
    t: 'div', a: { class: 'bw-container' }, c: [

      { t: 'h1', c: 'Stock Dashboard' },

      // Controls bar
      { t: 'div', a: {
        id: 'controls',
        class: 'bw-card',
        style: 'margin-bottom:16px'
      }, c: [
        { t: 'div', a: { class: 'bw-card-body' }, c: [
          { t: 'div', a: { style: 'display:flex;gap:16px;align-items:center;flex-wrap:wrap' }, c: [

            // Stock selector
            { t: 'div', c: [
              { t: 'label', a: { class: 'bw-form-label' }, c: 'Symbol' },
              { t: 'select', a: {
                id: 'symbol-select',
                class: 'bw-form-control',
                value: state.symbol
              }, c: [
                { t: 'option', a: { value: 'AAPL' }, c: 'AAPL — Apple' },
                { t: 'option', a: { value: 'GOOG' }, c: 'GOOG — Alphabet' },
                { t: 'option', a: { value: 'TSLA' }, c: 'TSLA — Tesla' }
              ], o: {
                events: {
                  change: { action: 'set-symbol', sendValue: true }
                }
              }}
            ]},

            // Days range slider
            { t: 'div', c: [
              { t: 'label', a: { class: 'bw-form-label' },
                c: 'Window: ' + state.days + ' days' },
              { t: 'input', a: {
                id: 'days-range',
                type: 'range',
                class: 'bw-form-control',
                min: '7', max: '365', value: String(state.days)
              }, o: {
                events: {
                  input: {
                    action: 'set-days',
                    sendValue: true,
                    throttle: 200    // don't flood during drag
                  }
                }
              }}
            ]},

            // Refresh button
            { t: 'button', a: {
              class: 'bw-btn bw-btn-primary'
            }, c: 'Refresh', o: {
              events: { click: { action: 'refresh' } }
            }}
          ]}
        ]}
      ]},

      // Summary cards row
      { t: 'div', a: { id: 'summary', class: 'bw-row', style: 'margin-bottom:16px' }, c: [
        statCard('Latest', '$' + summary.latest, ''),
        statCard('Change', changeSign + summary.change + '%', changeColor),
        statCard('High', '$' + summary.high, '#27ae60'),
        statCard('Low', '$' + summary.low, '#e74c3c')
      ]},

      // Data table
      { t: 'div', a: { id: 'table-section' }, c: [
        { t: 'h3', c: state.symbol + ' — Last ' + Math.min(data.length, 10) + ' Days' },
        buildTable(data.slice(-10).reverse())
      ]}
    ]
  };
}

function statCard(label, value, color) {
  return {
    t: 'div', a: { class: 'bw-col' }, c: [
      { t: 'div', a: { class: 'bw-card' }, c: [
        { t: 'div', a: { class: 'bw-card-body', style: 'text-align:center' }, c: [
          { t: 'div', a: { class: 'bw-text-muted' }, c: label },
          { t: 'div', a: {
            style: 'font-size:1.8rem;font-weight:700;' + (color ? 'color:' + color : '')
          }, c: value }
        ]}
      ]}
    ]
  };
}

function buildTable(data) {
  return {
    t: 'table', a: { class: 'bw-table' }, c: [
      { t: 'thead', c: { t: 'tr', c: [
        { t: 'th', c: 'Date' },
        { t: 'th', c: 'Price' },
        { t: 'th', c: 'Volume' }
      ]}},
      { t: 'tbody', c: data.map(function(row) {
        return { t: 'tr', c: [
          { t: 'td', c: row.date },
          { t: 'td', c: '$' + row.price },
          { t: 'td', c: row.volume.toLocaleString() }
        ]};
      })}
    ]
  };
}

// Per-client state
var clientState = {};

app.page('/', function(client) {
  var state = { symbol: 'AAPL', days: 30 };
  clientState[client.id] = state;

  // Send full page
  client.render('#app', buildPage(state));
});

// Handle control changes — RECOMPUTE and REPLACE affected sections
app.onAction('set-symbol', function(data, client) {
  var state = clientState[client.id];
  if (!state) return;
  state.symbol = data.value;

  // Rebuild the data sections (not the controls — they stay)
  recomputeAndPush(client, state);
});

app.onAction('set-days', function(data, client) {
  var state = clientState[client.id];
  if (!state) return;
  state.days = parseInt(data.value, 10) || 30;

  recomputeAndPush(client, state);
});

app.onAction('refresh', function(data, client) {
  var state = clientState[client.id];
  if (!state) return;

  recomputeAndPush(client, state);
});

function recomputeAndPush(client, state) {
  // Recompute server-side
  var pageTree = buildPage(state);

  // Strategy: replace just the changed sections, not the whole page.
  // This preserves scroll position and control focus.
  //
  // The page TACO has known ids: #summary, #table-section.
  // Extract those subtrees and replace individually.
  //
  // Alternative: replace #app with the full page.
  // Simpler code, but resets control state (selected dropdown, slider position).

  var page = buildPage(state);
  var summaryNode = page.c[2];      // summary row
  var tableNode = page.c[3];        // table section

  client.batch([
    { type: 'replace', target: '#summary', node: summaryNode },
    { type: 'replace', target: '#table-section', node: tableNode }
  ]);
}

app.onDisconnect(function(client) {
  delete clientState[client.id];
});

app.listen();
```

### Protocol Message Trace — Streamlit Pattern

```
=== Initial page load ===
SSE <- { type: 'replace', target: '#app', node: { ...full page... } }

=== User selects GOOG from dropdown ===
POST -> { action: 'set-symbol', data: { value: 'GOOG' } }
  (server recomputes data for GOOG, 30 days)
SSE <- { type: 'batch', ops: [
          { type: 'replace', target: '#summary', node: { ...new stat cards... } },
          { type: 'replace', target: '#table-section', node: { ...new table... } }
        ]}

=== User drags slider to 90 days (throttled to 200ms) ===
POST -> { action: 'set-days', data: { value: '90' } }
  (server recomputes)
SSE <- { type: 'batch', ops: [
          { type: 'replace', target: '#summary', node: { ...recalculated... } },
          { type: 'replace', target: '#table-section', node: { ...90 day table... } }
        ]}

=== User clicks Refresh ===
POST -> { action: 'refresh', data: {} }
SSE <- { type: 'batch', ops: [ ...same as above with fresh random data... ]}
```

### Ergonomics Assessment

**What works well:**
- The Streamlit mental model maps directly: server state → compute → push UI
- Controls stay in place because we `replace` only data sections, not controls
- `sendValue: true` + `throttle: 200` on the range slider prevents flooding
- `batch` makes multi-section updates atomic (no flash of partial state)
- Per-client state is just a plain JS object — no framework magic

**Friction points identified:**
- **Extracting subtrees from buildPage()**: The `recomputeAndPush` function
  hard-codes `page.c[2]` and `page.c[3]` to extract summary and table nodes.
  This is fragile. **Decision**: Two approaches:
  1. Build sections as separate functions: `buildSummary(state)`, `buildTable(state)`.
     Server calls `client.render('#summary', buildSummary(state))` directly.
     This is cleaner and what Streamlit actually does.
  2. Give buildPage() a mode: `buildPage(state, { sectionsOnly: true })` returns
     an object `{ summary: taco, table: taco }` instead of the full page.
  Go with approach 1 — separate builder functions. The full `buildPage()` is only
  used for initial render. Section rebuilds use granular builders.

- **Select element: preserving selected value**: When we replace #summary and
  #table-section, the controls (select, range) are NOT touched, so their DOM state
  (selected option, slider position) is preserved. But if we replaced the full
  #app, controls would reset. **Decision**: This is correct behavior. Document
  the pattern: replace data sections, not control sections.

- **Computed labels**: The days slider label shows "Window: 30 days". When the user
  drags to 90, the server needs to update this label too. But the label is inside
  the controls section which we're NOT replacing.
  **Decision**: Use `patch` for the label:
  ```javascript
  // Give the label an id
  { t: 'label', a: { id: 'days-label', class: 'bw-form-label' },
    c: 'Window: ' + state.days + ' days' }

  // In recomputeAndPush, also patch the label:
  client.patch('days-label', 'Window: ' + state.days + ' days');
  ```
  This is the right granularity: `replace` for structural changes, `patch` for text updates.

**Key insight**: The Streamlit pattern has two kinds of updates:
1. **Structural**: Replace entire sections (table with new data, chart with new series)
2. **Cosmetic**: Patch text values (label, stat number, status text)

Using `replace` for structural and `patch` for cosmetic gives the best UX (no flicker,
preserved scroll/focus) with the simplest code.

---

## Use Case 5: Static Site Generation (Hugo/Jekyll Pattern)

**Scenario**: A documentation site, blog, or project website built from a directory
of markdown, HTML, and JSON files. Everything happens at build time — no runtime
server, no SSE, no client-server protocol. Output is plain HTML files that can be
deployed to GitHub Pages, Netlify, S3, or any static host.

**This validates**: The build-time pipeline (`bw.html()` for rendering, `bw.css()`
for styles, quikdown for markdown, `bw.generateTheme()` for theming), TACO layouts
as JS functions, navigation generation from directory structure, and the unique
"static but optionally alive" bridge to bwserve.

### Why this belongs in this document

Static site generation isn't bwserve — it's build-time, not runtime. But it shares
the same TACO rendering pipeline, the same theme system, and the same component
library. More importantly, it defines the **left edge of the spectrum**:

```
Static site gen          Client-side SPA          Server-driven (bwserve)
 bitwrench build          bw.DOM() + bw.component()   bwserve.create()
 ───────────────────────────────────────────────────────────────────────>
 build-time               browser runtime              server runtime
 files in → files out     user events → re-render       SSE push → render
 zero JS possible         38KB bitwrench                38KB + bwserve
```

A bitwrench static site can optionally "wake up" — add `bw.clientConnect()` to a
generated page and it becomes server-driven without rewriting the layout. This is
a capability neither Hugo nor Jekyll can offer.

### Architecture

```
Source directory                bitwrench build               Output directory
┌──────────────┐              ┌──────────────────┐           ┌──────────────┐
│ index.md     │              │                  │           │ index.html   │
│ about.md     │──scan────>   │ 1. read files    │──write──> │ about.html   │
│ api/         │              │ 2. quikdown(md)  │           │ api/         │
│  index.md    │              │ 3. wrap in layout│           │  index.html  │
│  ref.md      │              │ 4. bw.html(taco) │           │  ref.html    │
│ images/      │              │ 5. copy assets   │           │ images/      │
│  logo.png    │──copy────>   │ 6. generate nav  │           │  logo.png    │
│ _layout.js   │              │ 7. apply theme   │           │ style.css    │
│ bw.config.json│             └──────────────────┘           └──────────────┘
└──────────────┘
```

### Developer Experience

```bash
# Convert a single markdown file (already works — CLI Phase 1)
bitwrench README.md -o index.html --theme ocean

# Build a full site from a directory (CLI Phase 2)
bitwrench build docs/ -o site/ --theme forest --nav

# Dev server with live reload (CLI Phase 3)
bitwrench dev docs/ --port 8080 --open
```

### The Layout: JS Function, Not a Template Language

This is the key differentiator vs Hugo/Jekyll. Your layout is a plain JS function
that returns TACO. No Liquid, no Go templates, no Handlebars, no Jinja.

```javascript
// _layout.js — site layout as a JS function returning TACO
//
// Receives: content (TACO from the converted page), meta (page metadata)
// Returns: complete page TACO that bw.html() renders to HTML

export default function layout(content, meta) {
  return {
    t: 'html', a: { lang: 'en' }, c: [
      { t: 'head', c: [
        { t: 'meta', a: { charset: 'UTF-8' } },
        { t: 'meta', a: { name: 'viewport', content: 'width=device-width, initial-scale=1' } },
        { t: 'title', c: meta.title + ' — My Project' },
        meta.css   // injected by build pipeline: <link> or <style> depending on mode
      ]},
      { t: 'body', c: [

        // Site header — shared across all pages
        { t: 'header', a: { class: 'bw-navbar' }, c: [
          { t: 'div', a: { class: 'bw-container' }, c: [
            { t: 'a', a: { href: '/', class: 'bw-navbar-brand' }, c: 'My Project' },
            meta.nav     // auto-generated navigation from directory structure
          ]}
        ]},

        // Page content
        { t: 'main', a: { class: 'bw-container', style: 'padding:2rem 0' }, c: [
          { t: 'h1', c: meta.title },
          { t: 'div', a: { class: 'bw-prose' }, c: content }
        ]},

        // Footer
        { t: 'footer', a: { class: 'bw-container', style: 'padding:2rem 0;opacity:0.6' }, c: [
          { t: 'p', c: 'Built with bitwrench. Last updated: ' + meta.buildDate }
        ]},

        // Optional: inject bitwrench for interactive features
        meta.scripts
      ]}
    ]
  };
}
```

**Why this matters**: A Hugo layout for the same structure requires learning Go
template syntax (`{{ .Title }}`, `{{ range .Pages }}`, `{{ partial "header" }}`)
plus Hugo's content model (front matter, sections, archetypes). A Jekyll layout
requires Liquid (`{{ page.title }}`, `{% for page in site.pages %}`,
`{% include header.html %}`).

With bitwrench, it's just JavaScript. `Array.map()` replaces `{{ range }}`.
Ternary expressions replace `{{ if }}`. Imports replace `{{ partial }}`.
You already know the language — no template DSL to learn.

### Site Configuration

```json
// bitwrench.config.json — optional, CLI flags override
{
  "title": "My Project",
  "description": "Documentation for My Project",
  "theme": "ocean",
  "nav": true,
  "standalone": false,
  "highlight": true,
  "baseUrl": "/my-project/",
  "ignore": ["drafts/**", "*.tmp", "node_modules/**"]
}
```

### Navigation Generation

When `--nav` is set, the build pipeline scans the directory structure and generates
a navigation TACO. Page titles come from the first `#` heading or the filename.

```javascript
// Auto-generated nav for the example directory above:
var nav = {
  t: 'ul', a: { class: 'bw-nav' }, c: [
    { t: 'li', c: { t: 'a', a: { href: '/index.html' }, c: 'Home' } },
    { t: 'li', c: { t: 'a', a: { href: '/about.html' }, c: 'About' } },
    { t: 'li', c: [
      { t: 'a', a: { href: '/api/index.html' }, c: 'API' },
      { t: 'ul', c: [
        { t: 'li', c: { t: 'a', a: { href: '/api/ref.html' }, c: 'Reference' } }
      ]}
    ]}
  ]
};
```

The nav TACO is passed into the layout function as `meta.nav`. The layout decides
where to place it (sidebar, topbar, hamburger menu — it's just a TACO, render it
however you want).

### Build Pipeline (per file)

```
1. Read source file
2. Detect type:
   .md   → quikdown(source) → HTML string → { t: 'div', c: bw.raw(html) }
   .html → parse front matter → { t: 'div', c: bw.raw(htmlBody) }
   .json → JSON.parse → already TACO
3. Extract metadata (title from first heading, front matter)
4. Pass content + metadata to layout function → full page TACO
5. Inject theme CSS (bw.generateTheme if --theme, else bw.loadDefaultStyles)
6. Inject bitwrench (--standalone: inline UMD, --cdn: CDN link, --no-bw: nothing)
7. Render: bw.html(pageTaco) → HTML string
8. Write to output directory (preserving subdirectory structure)
```

### Example: Building the bitwrench docs site

```bash
# Build the bitwrench documentation from docs/ to site/
bitwrench build docs/ -o site/ --theme ocean --nav --cdn

# Result:
#   site/
#   ├── index.html          (from docs/README.md)
#   ├── taco-format.html    (from docs/taco-format.md)
#   ├── state-management.html
#   ├── component-library.html
#   ├── theming.html
#   ├── cli.html
#   ├── bwserve.html
#   └── llm-bitwrench-guide.html
```

### The "Wake Up" Bridge: Static → Server-Driven

A static site can become server-driven by adding `bw.clientConnect()`. The page
loads instantly (static HTML), then connects to a backend for live updates:

```javascript
// _layout.js — static site with optional live connection
export default function layout(content, meta) {
  return {
    t: 'html', c: [
      // ... head, body with static content ...
      { t: 'main', a: { id: 'content', class: 'bw-container' }, c: content },

      // If bitwrench is injected, try to connect for live updates.
      // If the server is not running, this is a no-op — the page works statically.
      meta.scripts,
      { t: 'script', c: bw.raw([
        'if (typeof bw !== "undefined") {',
        '  var conn = bw.clientConnect("/bw/events", {',
        '    transport: "sse",',
        '    reconnect: true',
        '  });',
        '  conn.on("error", function() {',
        '    // Server not available — static mode, that is fine',
        '  });',
        '}'
      ].join('\n')) }
    ]
  };
}
```

**The bridge pattern:**
1. `bitwrench build docs/ -o site/` → static HTML, works without any server
2. Deploy to GitHub Pages → fully static, fast, cacheable
3. Later: add a bwserve backend → same pages now receive live updates via SSE
4. Pages that don't connect to a backend keep working statically

This is the unique capability. Hugo produces dead HTML — it can never become
interactive without a separate frontend framework. bitwrench's output is already
wired to "wake up" if a server appears.

### Comparison with Hugo / Jekyll / Astro

| | bitwrench build | Hugo | Jekyll | Astro |
|-|-----------------|------|--------|-------|
| **Language** | JavaScript | Go | Ruby | JavaScript |
| **Layout** | JS function → TACO | Go templates | Liquid templates | Astro/JSX components |
| **Markdown** | quikdown (vendored, 0 deps) | goldmark | kramdown | remark |
| **Themes** | `bw.generateTheme()` — 3 colors → full CSS | Theme dirs + TOML | Theme gems | CSS/Tailwind |
| **Dependencies** | 0 runtime | 0 (single binary) | Ruby + gems | Node + many |
| **Components** | 50+ BCCL (makeCard, makeTable, etc.) | Hugo shortcodes | Liquid includes | Astro components |
| **Interactive output** | Yes (bitwrench injected) | No | No | Yes (islands) |
| **Server bridge** | Yes (clientConnect → bwserve) | No | No | No (SSR is separate) |
| **Build speed** | Moderate (Node.js) | Fast (Go) | Slow (Ruby) | Moderate (Node.js) |
| **Learning curve** | Know JS? You're done | Go templates, Hugo model | Liquid, Jekyll model | Astro syntax, islands |
| **Maturity** | New | 10+ years | 10+ years | 3 years |

**bitwrench's honest advantages:**
- No template language to learn — layouts are JS functions
- Generated pages can be interactive without a framework switch
- Same component library in static pages and server-driven apps
- `generateTheme()` produces a complete design system from 3 colors
- Standalone mode embeds everything — works offline, on USB, air-gapped

**Where Hugo/Jekyll are ahead:**
- Hugo is much faster for large sites (thousands of pages)
- Massive community, hundreds of themes, tutorials everywhere
- Mature content model (taxonomies, archetypes, i18n, etc.)
- Battle-tested in production at scale

**Where Astro is interesting:**
- Astro's "islands" pattern (partial hydration) is similar to bitwrench's
  "wake up" bridge, but Astro requires React/Vue/Svelte islands. Bitwrench
  uses its own component model end-to-end.

### Ergonomics Assessment

**What works well:**
- `bitwrench build docs/ -o site/ --theme ocean` is one command, zero config
- Layouts are JS functions — no new syntax, full expressiveness
- Theme generation from seed colors eliminates CSS authoring for most sites
- The `--standalone` flag produces truly self-contained HTML (USB-deployable)
- Navigation auto-generated from directory structure

**Friction points identified:**
- **Front matter**: Hugo/Jekyll use YAML front matter (`---\ntitle: Foo\n---`).
  bitwrench currently supports JSON front matter only. YAML requires a parser
  (breaks zero-dep rule) or a lightweight vendored one.
  **Decision**: JSON front matter for v2.0.16. Consider vendoring a tiny YAML
  parser later if demand warrants it. JSON works fine:
  ```markdown
  <!--{ "title": "About", "order": 2 }-->

  # About This Project
  ...
  ```

- **No content model**: Hugo has sections, archetypes, taxonomies. bitwrench has
  directories and files. For simple docs sites, this is fine. For blogs with
  tags, categories, and pagination, you need to write the logic yourself.
  **Decision**: Don't try to compete with Hugo's content model. bitwrench
  layouts are JS functions — users can implement any content model they need.
  Provide cookbook examples for common patterns (blog with tags, API docs, etc.).

- **Build speed**: Node.js is slower than Go. For 50-page doc sites, no one will
  notice. For 5000-page sites, it matters.
  **Decision**: Not a concern for v2.0.16 target audience (small-to-medium sites).
  If needed later, the pipeline is parallelizable (per-file rendering is independent).

- **Dev server live reload**: The design doc says "simple polling" for reload
  detection. Should we use SSE instead? The irony of a bwserve project using
  polling for its own dev tool...
  **Decision**: Use SSE — we're building it anyway. The `bitwrench dev` server
  injects a tiny SSE listener that triggers `location.reload()` on rebuild.
  Dogfooding our own protocol.

**New CLI subcommands needed for Phase 2:**
- `bitwrench build <dir>` — full site generation
- `bitwrench dev <dir>` — build + watch + serve
- `bitwrench init [dir]` — scaffold a new site (bitwrench.config.json + _layout.js + index.md)

---

## Use Case 6: LLM-Generated Dynamic UI

**Scenario**: An LLM (via OpenRouter, Ollama, or any API) doesn't just chat — it
builds and maintains a live UI. The user describes what they want ("show me a
sales dashboard"), the LLM emits TACO objects that render as real styled components,
and then incrementally updates them as the conversation continues.

**This validates**: TACO as an LLM output format (token efficiency, no compilation
barrier), incremental UI mutations from AI (not just full re-renders), the
bwserve protocol as an AI-to-UI bridge, and the "structured UI from unstructured
intent" pattern.

### Why this is different from Use Case 3

Use Case 3 (LLM chat) is a conventional chat interface — user sends text, LLM
streams text back, tokens are patched into a message bubble. The LLM's output is
*content* displayed inside a fixed UI.

Use Case 6 inverts this: the LLM's output IS the UI. The LLM generates cards,
tables, forms, charts — real TACO components — not text inside a chat bubble.
The conversation steers the UI, and the UI is the primary artifact.

Think: "Streamlit where the developer is an LLM."

### Architecture

```
Browser              bwserve              LLM API
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│              │    │              │    │              │
│  [chat input]│──> │ user prompt  │──> │ system prompt│
│              │    │ + context    │    │ "emit TACO   │
│  ┌──────────┐│    │              │    │  messages"   │
│  │ LLM-built││<── │ parse TACO   │<── │              │
│  │ dashboard ││    │ from response│    │ {"type":     │
│  │ (cards,   ││    │ clientApply()│    │  "replace",  │
│  │  tables,  ││    │              │    │  "node":{t,c}│
│  │  forms)   ││    │              │    │ }            │
│  └──────────┘│    └──────────────┘    └──────────────┘
└──────────────┘
```

### The Fundamental Insight: TACO Eliminates the Compilation Barrier

When an LLM generates React code, the output requires Babel, webpack/Vite, a
package.json, import resolution, and a dev server to become a running UI. There's
a compilation barrier between "LLM output" and "user sees something."

TACO eliminates this entirely:

```
LLM output → JSON.parse() → bw.clientApply() → live UI
```

No compilation. No build step. No import resolution. The LLM's output IS the
component specification. Feed it to the renderer and it works.

This also makes TACO **far more token-efficient** than generating framework code:

| Format | Tokens for a card with table | Compilable? |
|--------|------------------------------|-------------|
| React JSX | ~800 (imports, function, JSX, export) | Needs Babel |
| Vue SFC | ~700 (template, script, style blocks) | Needs Vite |
| Raw HTML | ~500 (verbose tags, inline styles) | Yes but unstyled |
| TACO JSON | ~300 (compact, inherits BCCL styles) | Yes, instantly |

At LLM API prices per-token, TACO cuts the cost roughly in half vs React while
producing styled, themed output that works immediately.

### System Prompt Design

The key to LLM-generated UI is the system prompt. It teaches the LLM to emit
bwserve protocol messages instead of prose:

```javascript
var SYSTEM_PROMPT = [
  'You are a UI builder. When the user asks for a UI, you respond with',
  'bwserve protocol messages that render bitwrench components.',
  '',
  'Message format (one per line, JSON):',
  '  {"type":"replace","target":"#app","node":{"t":"div","c":"Hello"}}',
  '  {"type":"append","target":"#list","node":{"t":"li","c":"Item"}}',
  '  {"type":"patch","target":"counter","content":"42"}',
  '  {"type":"remove","target":"#old-item"}',
  '',
  'Available BCCL components (use their CSS classes):',
  '  bw-card, bw-card-body, bw-card-header — cards with title/body',
  '  bw-table, bw-table-striped — data tables',
  '  bw-btn, bw-btn-primary/secondary/danger — buttons',
  '  bw-alert, bw-alert-info/success/warning/danger — alerts',
  '  bw-form-control, bw-form-label — form inputs',
  '  bw-row, bw-col — grid layout',
  '  bw-container — centered content wrapper',
  '  bw-badge — small labels',
  '  bw-progress — progress bars',
  '  bw-nav, bw-navbar — navigation',
  '',
  'Rules:',
  '  1. Every interactive element needs a unique id attribute',
  '  2. Buttons use o.events: {"click":{"action":"action-name"}}',
  '  3. Inputs use o.events: {"input":{"action":"update","sendValue":true}}',
  '  4. Use "replace" #app for full page changes',
  '  5. Use "patch" for updating values without rebuilding structure',
  '  6. Use "append" for adding items to lists',
  '  7. Respond ONLY with protocol messages, no prose',
  '  8. Each message on its own line',
  '',
  'When the user says "show me a dashboard", emit replace messages.',
  'When the user says "add a chart", emit append messages.',
  'When the user says "update the title", emit patch messages.',
  'When the user says "remove the sidebar", emit remove messages.'
].join('\n');
```

### Server Code

```javascript
// examples/serve-llm-ui.js
// LLM-generated dynamic UI — the AI builds and maintains the interface.
import bwserve from 'bitwrench/bwserve';

var app = bwserve.create({
  port: 7902,
  title: 'AI UI Builder',
  theme: 'slate'
});

var LLM_URL = process.env.LLM_URL || 'http://localhost:11434/v1/chat/completions';
var LLM_MODEL = process.env.LLM_MODEL || 'llama3';
var LLM_KEY = process.env.LLM_API_KEY || '';

// Per-client: conversation history + current UI state description
var sessions = {};

app.page('/', function(client) {
  sessions[client.id] = {
    history: [{ role: 'system', content: SYSTEM_PROMPT }],
    uiState: 'empty'
  };

  // Initial UI: split layout with chat pane + UI canvas
  client.render('#app', {
    t: 'div', a: { class: 'bw-container', style: 'display:flex;gap:16px;height:100vh;padding:16px 0' }, c: [

      // Left: chat pane (user talks to LLM here)
      { t: 'div', a: { style: 'width:350px;display:flex;flex-direction:column' }, c: [
        { t: 'h3', c: 'AI UI Builder' },
        { t: 'div', a: {
          id: 'chat',
          style: 'flex:1;overflow-y:auto;border:1px solid #ddd;border-radius:4px;padding:8px'
        }, c: { t: 'p', a: { class: 'bw-text-muted' },
          c: 'Describe the UI you want. Example: "Build me a sales dashboard with revenue by region."' }
        },
        { t: 'div', a: { style: 'display:flex;gap:8px;margin-top:8px' }, c: [
          { t: 'input', a: {
            id: 'prompt-input',
            type: 'text',
            class: 'bw-form-control',
            placeholder: 'Describe your UI...',
            style: 'flex:1'
          }, o: { events: {
            keydown: { action: 'prompt', sendValue: true, filter: 'Enter' }
          }}},
          { t: 'button', a: { class: 'bw-btn bw-btn-primary' }, c: 'Build',
            o: { events: { click: { action: 'prompt', sendForm: '#prompt-input' } } }
          }
        ]}
      ]},

      // Right: UI canvas (LLM-generated content renders here)
      { t: 'div', a: {
        id: 'canvas',
        style: 'flex:1;border:1px solid #ddd;border-radius:4px;padding:16px;overflow-y:auto'
      }, c: { t: 'div', a: {
        id: 'ui-root',
        class: 'bw-text-muted',
        style: 'text-align:center;padding-top:40%'
      }, c: 'Your UI will appear here' }}
    ]
  });
});

app.onAction('prompt', function(data, client) {
  var text = (data.value || '').trim();
  if (!text) return;
  var session = sessions[client.id];
  if (!session) return;

  // Show user message in chat
  client.append('#chat', {
    t: 'div', a: { style: 'margin:8px 0;padding:8px;background:#e3f2fd;border-radius:4px' },
    c: text
  });

  // Clear input
  client.patch('prompt-input', '', { value: '' });

  // Add to conversation history
  session.history.push({ role: 'user', content: text });

  // Call LLM — stream response, parse protocol messages line-by-line
  streamLLM(session.history, function(line) {
    // Each line from the LLM should be a protocol message
    try {
      var msg = JSON.parse(line.trim());
      if (msg.type && (msg.target || msg.ops)) {
        // Remap #app to #ui-root so LLM output goes to the canvas
        if (msg.target === '#app') msg.target = '#ui-root';
        // Send directly to client — the LLM IS the server logic
        client._send(msg);
      }
    } catch (e) {
      // Not valid JSON — show as text in chat (LLM responded with prose)
      if (line.trim()) {
        client.append('#chat', {
          t: 'div', a: {
            style: 'margin:8px 0;padding:8px;background:#f5f5f5;border-radius:4px'
          }, c: line.trim()
        });
      }
    }
  }, function(fullResponse) {
    session.history.push({ role: 'assistant', content: fullResponse });
  });
});

// When LLM-generated buttons are clicked, feed the action back to the LLM
// as context so it can update the UI in response
app.onAction('*', function(data, client) {
  // Wildcard handler — any action not explicitly handled goes to the LLM
  var session = sessions[client.id];
  if (!session) return;

  var actionDesc = 'User clicked: action="' + data.action + '"';
  if (data.value) actionDesc += ', value="' + data.value + '"';

  session.history.push({ role: 'user', content: actionDesc });

  streamLLM(session.history, function(line) {
    try {
      var msg = JSON.parse(line.trim());
      if (msg.type) {
        if (msg.target === '#app') msg.target = '#ui-root';
        client._send(msg);
      }
    } catch (e) { /* skip non-JSON lines */ }
  }, function(fullResponse) {
    session.history.push({ role: 'assistant', content: fullResponse });
  });
});

async function streamLLM(messages, onLine, onDone) {
  var resp = await fetch(LLM_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': LLM_KEY ? 'Bearer ' + LLM_KEY : undefined
    },
    body: JSON.stringify({ model: LLM_MODEL, messages: messages, stream: true })
  });

  var reader = resp.body.getReader();
  var decoder = new TextDecoder();
  var buffer = '';
  var fullResponse = '';

  while (true) {
    var chunk = await reader.read();
    if (chunk.done) break;
    buffer += decoder.decode(chunk.value, { stream: true });
    var lines = buffer.split('\n');
    buffer = lines.pop();

    for (var i = 0; i < lines.length; i++) {
      var line = lines[i].trim();
      if (!line.startsWith('data: ')) continue;
      var d = line.slice(6);
      if (d === '[DONE]') continue;
      try {
        var parsed = JSON.parse(d);
        var token = parsed.choices[0].delta.content;
        if (token) {
          fullResponse += token;
          // Check for complete JSON lines in the accumulated response
          var responseLines = fullResponse.split('\n');
          for (var j = 0; j < responseLines.length - 1; j++) {
            if (responseLines[j].trim()) onLine(responseLines[j]);
          }
          fullResponse = responseLines[responseLines.length - 1];
        }
      } catch (e) { /* skip */ }
    }
  }
  // Flush remaining
  if (fullResponse.trim()) onLine(fullResponse);
  onDone(fullResponse);
}

app.onDisconnect(function(client) { delete sessions[client.id]; });
app.listen();
```

### Protocol Message Trace — LLM Builds a Dashboard

```
=== User: "Build me a sales dashboard with revenue by region" ===
POST -> { action: 'prompt', data: { value: 'Build me a sales dashboard...' } }

LLM emits (streamed, parsed line by line):
SSE <- {"type":"replace","target":"#ui-root","node":
         {"t":"div","a":{"class":"bw-container"},"c":[
           {"t":"h1","c":"Sales Dashboard"},
           {"t":"div","a":{"class":"bw-row"},"c":[
             {"t":"div","a":{"class":"bw-col"},"c":[
               {"t":"div","a":{"class":"bw-card"},"c":[
                 {"t":"div","a":{"class":"bw-card-body","style":"text-align:center"},"c":[
                   {"t":"div","a":{"class":"bw-text-muted"},"c":"North"},
                   {"t":"div","a":{"id":"rev-north","style":"font-size:2rem;font-weight:700"},"c":"$142K"}
                 ]}]}]},
             {"t":"div","a":{"class":"bw-col"},"c":[
               ...similar for South, East, West...
             ]}
           ]},
           {"t":"table","a":{"id":"detail-table","class":"bw-table bw-table-striped"},"c":[
             ...table rows...
           ]},
           {"t":"button","a":{"class":"bw-btn bw-btn-primary"},
            "c":"Refresh","o":{"events":{"click":{"action":"refresh-data"}}}}
         ]}}

=== User: "Make the North region card red, it's underperforming" ===
POST -> { action: 'prompt', data: { value: 'Make the North region card red...' } }

LLM emits a targeted patch (NOT a full rebuild):
SSE <- {"type":"patch","target":"rev-north","attr":{"style":"font-size:2rem;font-weight:700;color:#e74c3c"}}

=== User clicks the "Refresh" button (LLM-generated) ===
POST -> { action: 'refresh-data', data: {} }
(wildcard handler feeds this back to the LLM as context)

LLM emits value patches:
SSE <- {"type":"patch","target":"rev-north","content":"$138K"}
SSE <- {"type":"patch","target":"rev-south","content":"$165K"}
SSE <- {"type":"patch","target":"rev-east","content":"$92K"}
SSE <- {"type":"patch","target":"rev-west","content":"$201K"}

=== User: "Add a pie chart section below the table" ===
LLM emits an append:
SSE <- {"type":"append","target":"#ui-root","node":
         {"t":"div","a":{"id":"chart-section"},"c":[
           {"t":"h3","c":"Revenue Distribution"},
           {"t":"canvas","a":{"id":"pie-chart","width":"400","height":"300"}},
           {"t":"script","c":"/* D3/Chart.js initialization code */"}
         ]}}
```

### Why This Matters Strategically

**1. Token efficiency = cost advantage.** LLM APIs charge per token. TACO is
~2x more compact than React JSX for the same UI. At scale (thousands of LLM
UI generations per day), this is real money.

**2. No build barrier = instant feedback.** The user says "build me a dashboard"
and sees it in < 2 seconds. With React, the LLM output needs compilation before
anything renders. With TACO, the output IS the UI.

**3. Incremental mutations = intelligent updates.** The LLM doesn't regenerate
the whole page when you say "make that card red." It emits a targeted `patch`.
This is the protocol doing real work — the LLM reasons about what changed and
sends the minimal mutation. Streamlit can't do this (always re-runs everything).

**4. Cross-language portability.** The LLM generates JSON, not JavaScript. The
same TACO output works whether the server is Node.js, Python, Go, or Rust. The
protocol is the interface — the LLM doesn't care what language parses its output.

**5. The component catalog constrains the LLM.** By listing BCCL classes in
the system prompt, we give the LLM a finite vocabulary of tested, styled
components. It can't generate broken HTML or unstyled divs — everything maps to
a real component with real CSS. This is safer than letting an LLM generate
arbitrary React code.

### Ergonomics Assessment

**What works well:**
- LLM output is directly renderable — no compilation, parsing, or transformation
- TACO JSON is a natural LLM output format (structured, predictable)
- Incremental mutations (patch, append, remove) give the LLM surgical precision
- The wildcard action handler (`app.onAction('*')`) lets LLM-generated buttons
  feed back into the LLM without writing handlers for each one
- Split-pane layout (chat + canvas) gives clear separation of instruction and output

**Friction points identified:**
- **LLM reliability**: LLMs sometimes emit malformed JSON or mix prose with JSON.
  **Decision**: The parser handles this gracefully — non-JSON lines go to the chat
  pane as prose, valid JSON goes to the canvas. The UI degrades to a chat if the
  LLM can't produce valid TACO.

- **System prompt size**: The component catalog in the system prompt adds ~500
  tokens of context per request. For expensive models this adds up.
  **Decision**: Start with a minimal catalog (card, table, button, alert, form,
  row/col). Expand based on what LLMs actually use well. Consider a
  `bitwrench/llm-prompt` export that provides the system prompt fragment.

- **Streaming JSON parsing**: The LLM streams tokens, so we get partial JSON
  lines. Need to buffer until we have a complete line.
  **Decision**: Already handled — accumulate tokens, split on newlines, parse
  complete lines. Incomplete lines stay in the buffer.

- **Security**: The LLM generates TACO that's rendered as DOM. Could it inject
  `<script>` tags or `javascript:` URLs?
  **Decision**: `bw.clientApply()` uses `bw.createDOM()` which uses `bw.html()`
  which escapes content by default. `<script>` in content becomes text, not
  executable code. The `o.events` map is declarative (JSON), not executable JS.
  TACO's structure is inherently safer than raw HTML generation.

- **State tracking**: The LLM needs to know what IDs exist in the current UI
  to emit correct `patch` and `remove` messages. The conversation history helps
  but isn't guaranteed to be accurate.
  **Decision**: Optionally prepend a DOM snapshot summary to each LLM request:
  "Current UI elements: #rev-north (card, '$142K'), #detail-table (table, 5 rows),
  #chart-section (div)." This keeps the LLM grounded without sending the full
  TACO tree.

---

## Use Case 7: Database-Backed CRUD App (Supabase / SQLite / PocketBase)

**Scenario**: A web app with user registration, login, and CRUD operations
against a real database. Users register, log in, see their data, create/edit/
delete records, and log out. This is the most common real-world web app pattern
and the one most likely to expose grammar gaps.

**This validates**: `sendForm` data collection (registration and login forms),
session/auth state management across SSE reconnections, CRUD mapping to
protocol messages, error feedback (invalid login, validation failures),
multi-view navigation (login → dashboard → detail), and the overall ergonomics
of building a "real" app with bwserve.

### Why this use case matters for grammar design

Use Cases 1-6 are all single-purpose: a dashboard, a chat, an LLM canvas.
Real apps combine many patterns: forms that validate, auth that persists,
lists that paginate, detail views that load on demand. This use case is the
**grammar stress test** — if the protocol feels awkward here, it's wrong.

Key grammar pressure points:
1. **`sendForm`**: Registration form collects name, email, password. Login form
   collects email, password. Does `sendForm` handle password fields? Checkboxes
   for "remember me"? Is the data shape clear enough for the server handler?
2. **Auth state**: After login, every subsequent SSE reconnect must re-authenticate.
   How does the client pass a session token? Cookie? URL param on SSE reconnect?
3. **Navigation**: Login → dashboard → item detail → back. How does the server
   push a full view replacement vs. a partial update?
4. **Validation errors**: Server rejects a form submission. How does it tell
   the client *which* field failed and *what* the error message is?
5. **Optimistic vs. server-confirmed**: Delete a record — does the UI remove it
   immediately (optimistic) or wait for server confirmation?

### Architecture

```
Browser              bwserve              Database
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│              │    │              │    │              │
│  [login form]│──> │ validate     │──> │ Supabase     │
│  sendForm    │    │ credentials  │    │ — or —       │
│              │    │              │    │ SQLite       │
│  [dashboard] │<── │ query data   │<── │ — or —       │
│  cards, table│    │ render UI    │    │ PocketBase   │
│              │    │              │    │              │
│  [edit form] │──> │ update row   │──> │              │
│  sendForm    │    │ re-render    │    │              │
└──────────────┘    └──────────────┘    └──────────────┘
```

The database choice is intentionally abstract. bwserve doesn't know or care
which database is behind the server handlers. The three variants show the same
app with different storage backends:

| Backend | Why include it | Complexity |
|---------|---------------|------------|
| **Supabase** | Cloud-hosted Postgres, built-in auth, REST API. Shows bwserve + BaaS. | Lowest (Supabase handles auth) |
| **SQLite** | Zero-dependency, file-based. Shows bwserve as a self-contained app. Ideal for embedded/IoT. | Medium (must implement auth) |
| **PocketBase** | Single-binary backend with real-time subscriptions. Shows bwserve + external real-time source. | Medium (PocketBase handles auth, bwserve handles UI) |

### Server Code (SQLite variant — self-contained)

```javascript
import bwserve from 'bitwrench/bwserve';
import Database from 'better-sqlite3';

var db = new Database('app.db');

// Schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    password_hash TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    body TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);

var app = bwserve.create({ port: 7902, theme: 'ocean' });

// Session store (in-memory for simplicity; production uses signed cookies)
var sessions = new Map();  // sessionToken -> { userId, email, name }

// ---- Views ----

function renderLoginPage(client) {
  client.render('#app', {
    t: 'div', a: { class: 'bw-container', style: 'max-width: 400px; margin: 4rem auto' }, c: [
      { t: 'h1', c: 'Login' },
      { t: 'div', a: { id: 'login-error' } },
      { t: 'form', a: { id: 'login-form' }, c: [
        { t: 'div', a: { class: 'bw-form-group' }, c: [
          { t: 'label', c: 'Email' },
          { t: 'input', a: { type: 'email', name: 'email', required: true, class: 'bw-input' } }
        ]},
        { t: 'div', a: { class: 'bw-form-group' }, c: [
          { t: 'label', c: 'Password' },
          { t: 'input', a: { type: 'password', name: 'password', required: true, class: 'bw-input' } }
        ]},
        { t: 'div', a: { class: 'bw-form-group' }, c: [
          { t: 'label', c: [
            { t: 'input', a: { type: 'checkbox', name: 'remember' } },
            ' Remember me'
          ]}
        ]},
        { t: 'button', a: { type: 'submit', class: 'bw-btn bw-btn-primary' }, c: 'Sign In',
          o: { events: { click: { action: 'login', sendForm: '#login-form', prevent: true } } }
        }
      ]},
      { t: 'p', c: [
        'No account? ',
        { t: 'a', a: { href: '#' }, c: 'Register',
          o: { events: { click: { action: 'show-register', prevent: true } } }
        }
      ]}
    ]
  });
}

function renderRegisterPage(client) {
  client.render('#app', {
    t: 'div', a: { class: 'bw-container', style: 'max-width: 400px; margin: 4rem auto' }, c: [
      { t: 'h1', c: 'Register' },
      { t: 'div', a: { id: 'register-error' } },
      { t: 'form', a: { id: 'register-form' }, c: [
        { t: 'div', a: { class: 'bw-form-group' }, c: [
          { t: 'label', c: 'Name' },
          { t: 'input', a: { type: 'text', name: 'name', required: true, class: 'bw-input' } }
        ]},
        { t: 'div', a: { class: 'bw-form-group' }, c: [
          { t: 'label', c: 'Email' },
          { t: 'input', a: { type: 'email', name: 'email', required: true, class: 'bw-input' } }
        ]},
        { t: 'div', a: { class: 'bw-form-group' }, c: [
          { t: 'label', c: 'Password' },
          { t: 'input', a: { type: 'password', name: 'password', required: true, minlength: '8', class: 'bw-input' } }
        ]},
        { t: 'div', a: { class: 'bw-form-group' }, c: [
          { t: 'label', c: 'Confirm Password' },
          { t: 'input', a: { type: 'password', name: 'password_confirm', required: true, class: 'bw-input' } }
        ]},
        { t: 'button', a: { type: 'submit', class: 'bw-btn bw-btn-primary' }, c: 'Create Account',
          o: { events: { click: { action: 'register', sendForm: '#register-form', prevent: true } } }
        }
      ]},
      { t: 'p', c: [
        'Already have an account? ',
        { t: 'a', a: { href: '#' }, c: 'Sign in',
          o: { events: { click: { action: 'show-login', prevent: true } } }
        }
      ]}
    ]
  });
}

function renderDashboard(client, session) {
  var items = db.prepare('SELECT * FROM items WHERE user_id = ? ORDER BY created_at DESC').all(session.userId);

  client.render('#app', {
    t: 'div', a: { class: 'bw-container' }, c: [
      // Navbar
      { t: 'nav', a: { class: 'bw-navbar' }, c: [
        { t: 'span', a: { class: 'bw-navbar-brand' }, c: 'My App' },
        { t: 'span', c: 'Welcome, ' + session.name },
        { t: 'button', a: { class: 'bw-btn bw-btn-sm' }, c: 'Logout',
          o: { events: { click: { action: 'logout' } } }
        }
      ]},

      // Stats row
      { t: 'div', a: { class: 'bw-row', style: 'margin: 1rem 0' }, c: [
        { t: 'div', a: { class: 'bw-col' }, c: [
          { t: 'div', a: { class: 'bw-card' }, c: [
            { t: 'div', a: { class: 'bw-card-body' }, c: [
              { t: 'h3', c: String(items.length) },
              { t: 'p', c: 'Total Items' }
            ]}
          ]}
        ]}
      ]},

      // Add item form
      { t: 'div', a: { class: 'bw-card', style: 'margin-bottom: 1rem' }, c: [
        { t: 'div', a: { class: 'bw-card-body' }, c: [
          { t: 'h4', c: 'Add New Item' },
          { t: 'form', a: { id: 'add-form' }, c: [
            { t: 'div', a: { class: 'bw-form-group' }, c: [
              { t: 'input', a: { type: 'text', name: 'title', placeholder: 'Title', required: true, class: 'bw-input' } }
            ]},
            { t: 'div', a: { class: 'bw-form-group' }, c: [
              { t: 'textarea', a: { name: 'body', placeholder: 'Description (optional)', rows: '2', class: 'bw-input' } }
            ]},
            { t: 'button', a: { type: 'submit', class: 'bw-btn bw-btn-primary' }, c: 'Add',
              o: { events: { click: { action: 'add-item', sendForm: '#add-form', prevent: true } } }
            }
          ]}
        ]}
      ]},

      // Items list
      { t: 'div', a: { id: 'items-list' }, c: items.map(function(item) {
        return renderItemCard(item);
      })}
    ]
  });
}

function renderItemCard(item) {
  return {
    t: 'div', a: { class: 'bw-card', id: 'item-' + item.id, style: 'margin-bottom: 0.5rem' }, c: [
      { t: 'div', a: { class: 'bw-card-body' }, c: [
        { t: 'div', a: { style: 'display: flex; justify-content: space-between; align-items: center' }, c: [
          { t: 'div', c: [
            { t: 'strong', c: item.title },
            item.body ? { t: 'p', a: { style: 'margin: 0.25rem 0 0' }, c: item.body } : ''
          ]},
          { t: 'div', c: [
            { t: 'button', a: { class: 'bw-btn bw-btn-sm' }, c: 'Edit',
              o: { events: { click: { action: 'edit-item', data: { id: item.id } } } }
            },
            ' ',
            { t: 'button', a: { class: 'bw-btn bw-btn-sm bw-btn-danger' }, c: 'Delete',
              o: { events: { click: { action: 'delete-item', data: { id: item.id } } } }
            }
          ]}
        ]}
      ]}
    ]
  };
}

// ---- Page handler ----

app.page('/', function(client) {
  // Check for existing session (cookie-based)
  var session = sessions.get(client.sessionToken);
  if (session) {
    renderDashboard(client, session);
  } else {
    renderLoginPage(client);
  }
});

// ---- Action handlers ----

app.onAction('show-register', function(data, client) {
  renderRegisterPage(client);
});

app.onAction('show-login', function(data, client) {
  renderLoginPage(client);
});

app.onAction('register', function(data, client) {
  // data = { name, email, password, password_confirm }
  //
  // GRAMMAR NOTE: sendForm: '#register-form' collects ALL named inputs
  // in that form. data keys = input name attributes. Checkboxes send
  // true/false. Multi-selects send arrays. Password fields are included.

  if (!data.name || !data.email || !data.password) {
    return client.render('#register-error', {
      t: 'div', a: { class: 'bw-alert bw-alert-danger' }, c: 'All fields are required.'
    });
  }
  if (data.password !== data.password_confirm) {
    return client.render('#register-error', {
      t: 'div', a: { class: 'bw-alert bw-alert-danger' }, c: 'Passwords do not match.'
    });
  }

  try {
    var hash = simpleHash(data.password);  // placeholder — use bcrypt in production
    var result = db.prepare('INSERT INTO users (email, name, password_hash) VALUES (?, ?, ?)').run(data.email, data.name, hash);
    var token = crypto.randomUUID();
    sessions.set(token, { userId: result.lastInsertRowid, email: data.email, name: data.name });
    client.sessionToken = token;
    // Set cookie so SSE reconnects are authenticated
    client.setCookie('bw_session', token, { httpOnly: true, sameSite: 'Strict' });
    renderDashboard(client, sessions.get(token));
  } catch (e) {
    if (e.message.includes('UNIQUE constraint')) {
      client.render('#register-error', {
        t: 'div', a: { class: 'bw-alert bw-alert-danger' }, c: 'Email already registered.'
      });
    } else {
      client.render('#register-error', {
        t: 'div', a: { class: 'bw-alert bw-alert-danger' }, c: 'Registration failed: ' + e.message
      });
    }
  }
});

app.onAction('login', function(data, client) {
  // data = { email, password, remember }
  //
  // GRAMMAR NOTE: The 'remember' checkbox sends true if checked, absent or
  // false if unchecked. sendForm collects it because it has name="remember".

  var user = db.prepare('SELECT * FROM users WHERE email = ?').get(data.email);
  if (!user || simpleHash(data.password) !== user.password_hash) {
    return client.render('#login-error', {
      t: 'div', a: { class: 'bw-alert bw-alert-danger' }, c: 'Invalid email or password.'
    });
  }

  var token = crypto.randomUUID();
  sessions.set(token, { userId: user.id, email: user.email, name: user.name });
  client.sessionToken = token;
  client.setCookie('bw_session', token, {
    httpOnly: true,
    sameSite: 'Strict',
    maxAge: data.remember ? 30 * 24 * 60 * 60 : undefined  // 30 days or session
  });
  renderDashboard(client, sessions.get(token));
});

app.onAction('logout', function(data, client) {
  sessions.delete(client.sessionToken);
  client.clearCookie('bw_session');
  renderLoginPage(client);
});

app.onAction('add-item', function(data, client) {
  // data = { title, body }
  var session = sessions.get(client.sessionToken);
  if (!session) return renderLoginPage(client);

  if (!data.title) {
    return;  // client-side required attribute should prevent this
  }

  var result = db.prepare('INSERT INTO items (user_id, title, body) VALUES (?, ?, ?)').run(session.userId, data.title, data.body || '');

  // Prepend new item to the list (no full re-render needed)
  client.append('#items-list', renderItemCard({
    id: result.lastInsertRowid,
    title: data.title,
    body: data.body || '',
    created_at: new Date().toISOString()
  }));

  // Clear the form — patch each input to empty
  // GRAMMAR NOTE: This reveals a gap. We have no "clear form" message type.
  // Options: (a) batch of patches on each input, (b) replace the form,
  // (c) add a 'reset' message type, (d) add 'eval' type (dangerous).
  // For now: re-render the add form section.
  renderDashboard(client, session);
});

app.onAction('delete-item', function(data, client) {
  // data = { id: 123 }
  var session = sessions.get(client.sessionToken);
  if (!session) return renderLoginPage(client);

  db.prepare('DELETE FROM items WHERE id = ? AND user_id = ?').run(data.id, session.userId);

  // Remove the card from DOM — no full re-render needed
  client.remove('#item-' + data.id);
});

app.onAction('edit-item', function(data, client) {
  // data = { id: 123 }
  var session = sessions.get(client.sessionToken);
  if (!session) return renderLoginPage(client);

  var item = db.prepare('SELECT * FROM items WHERE id = ? AND user_id = ?').get(data.id, session.userId);
  if (!item) return;

  // Replace the item card with an inline edit form
  client.render('#item-' + item.id, {
    t: 'div', a: { class: 'bw-card-body' }, c: [
      { t: 'form', a: { id: 'edit-form-' + item.id }, c: [
        { t: 'input', a: { type: 'text', name: 'title', value: item.title, class: 'bw-input' } },
        { t: 'textarea', a: { name: 'body', rows: '2', class: 'bw-input' }, c: item.body },
        { t: 'input', a: { type: 'hidden', name: 'id', value: String(item.id) } },
        { t: 'div', a: { style: 'margin-top: 0.5rem' }, c: [
          { t: 'button', a: { class: 'bw-btn bw-btn-primary bw-btn-sm' }, c: 'Save',
            o: { events: { click: { action: 'save-item', sendForm: '#edit-form-' + item.id, prevent: true } } }
          },
          ' ',
          { t: 'button', a: { class: 'bw-btn bw-btn-sm' }, c: 'Cancel',
            o: { events: { click: { action: 'cancel-edit', data: { id: item.id } } } }
          }
        ]}
      ]}
    ]
  });
});

app.onAction('save-item', function(data, client) {
  // data = { id, title, body }
  //
  // GRAMMAR NOTE: The hidden input name="id" is collected by sendForm.
  // This is how we associate the form data with the record to update.
  // Alternative: put the id in the data: {} static data. But sendForm
  // already collects it, so the hidden input pattern works cleanly.

  var session = sessions.get(client.sessionToken);
  if (!session) return renderLoginPage(client);

  db.prepare('UPDATE items SET title = ?, body = ? WHERE id = ? AND user_id = ?').run(data.title, data.body || '', data.id, session.userId);

  // Replace edit form with updated card
  var item = db.prepare('SELECT * FROM items WHERE id = ?').get(data.id);
  client.render('#item-' + item.id, renderItemCard(item));
});

app.onAction('cancel-edit', function(data, client) {
  var session = sessions.get(client.sessionToken);
  if (!session) return;
  var item = db.prepare('SELECT * FROM items WHERE id = ? AND user_id = ?').get(data.id, session.userId);
  if (item) client.render('#item-' + item.id, renderItemCard(item));
});

app.listen();
```

### Supabase Variant (key differences)

With Supabase, auth is handled by Supabase Auth, not by bwserve:

```javascript
import { createClient } from '@supabase/supabase-js';
var supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

app.onAction('login', async function(data, client) {
  var { data: authData, error } = await supabase.auth.signInWithPassword({
    email: data.email, password: data.password
  });
  if (error) {
    return client.render('#login-error', {
      t: 'div', a: { class: 'bw-alert bw-alert-danger' }, c: error.message
    });
  }
  // Supabase returns a JWT — store it in the session
  sessions.set(authData.session.access_token, {
    userId: authData.user.id, email: data.email, name: authData.user.user_metadata.name
  });
  client.sessionToken = authData.session.access_token;
  client.setCookie('bw_session', authData.session.access_token, { httpOnly: true });
  renderDashboard(client, sessions.get(client.sessionToken));
});

// CRUD uses Supabase client instead of SQLite
app.onAction('add-item', async function(data, client) {
  var session = sessions.get(client.sessionToken);
  var { data: item, error } = await supabase
    .from('items')
    .insert({ user_id: session.userId, title: data.title, body: data.body })
    .select()
    .single();
  if (error) return;  // handle error
  client.append('#items-list', renderItemCard(item));
});
```

### PocketBase Variant (key differences)

PocketBase provides real-time subscriptions — bwserve can relay them:

```javascript
import PocketBase from 'pocketbase';
var pb = new PocketBase('http://127.0.0.1:8090');

app.page('/', async function(client) {
  // PocketBase real-time: subscribe to changes and push to client
  pb.collection('items').subscribe('*', function(e) {
    if (e.action === 'create') {
      client.append('#items-list', renderItemCard(e.record));
    } else if (e.action === 'delete') {
      client.remove('#item-' + e.record.id);
    } else if (e.action === 'update') {
      client.render('#item-' + e.record.id, renderItemCard(e.record));
    }
  });
});
```

### Protocol Trace: Login → Add Item → Delete Item

```
 ──── page load ────
 Browser                    bwserve
    |  GET /                   |
    |  (no bw_session cookie)  |
    |<─── SSE: replace ────────|  { type: 'replace', target: '#app',
    |     login form           |    node: { t: 'div', c: [login form TACO] } }
    |                          |
 ──── login ────
    |  POST /__bw/action ────> |  { action: 'login',
    |  sendForm: #login-form   |    data: { email: 'a@b.com', password: '***', remember: true } }
    |                          |
    |   (server validates,     |
    |    creates session,      |
    |    sets cookie header)   |
    |                          |
    |<─── SSE: replace ────────|  { type: 'replace', target: '#app',
    |     dashboard            |    node: { t: 'div', c: [navbar, stats, form, items] } }
    |                          |
 ──── add item ────
    |  POST /__bw/action ────> |  { action: 'add-item',
    |  sendForm: #add-form     |    data: { title: 'New thing', body: 'Details...' } }
    |                          |
    |<─── SSE: replace ────────|  { type: 'replace', target: '#app',
    |     full dashboard       |    node: { t: 'div', c: [...updated...] } }
    |                          |
 ──── delete item ────
    |  POST /__bw/action ────> |  { action: 'delete-item',
    |                          |    data: { id: 42 } }
    |                          |
    |<─── SSE: remove ─────────|  { type: 'remove', target: '#item-42' }
    |                          |
 ──── SSE reconnect (browser tab restore) ────
    |  GET /__bw/events        |
    |  Cookie: bw_session=xxx  |
    |   (server looks up       |
    |    session from cookie)  |
    |<─── SSE: replace ────────|  { type: 'replace', target: '#app',
    |     dashboard            |    node: { t: 'div', c: [dashboard TACO] } }
```

### Grammar Findings from This Use Case

This use case reveals several grammar questions that the previous six didn't:

**1. `sendForm` specification — now concrete:**

```javascript
// Input:  <form id="register-form">
//           <input name="name" value="Alice">
//           <input name="email" value="a@b.com">
//           <input type="password" name="password" value="secret">
//           <input type="checkbox" name="remember" checked>
//         </form>
//
// Output: { name: 'Alice', email: 'a@b.com', password: 'secret', remember: true }
//
// Algorithm:
//   1. querySelectorAll('[name]') inside the form
//   2. For each element:
//      - text/email/password/hidden/date/number → el.value (string)
//      - checkbox → el.checked (boolean)
//      - radio → el.checked ? el.value : skip
//      - select → el.value (string)
//      - select[multiple] → Array.from(el.selectedOptions).map(o => o.value)
//      - textarea → el.value (string)
//   3. Return as flat object { [name]: value }
//   4. Multiple elements with same name → last wins (except radio: first checked wins)
```

This is now concrete enough to implement. It's essentially `new FormData()` but
serialized to a plain object — which is what `sendForm` should use internally.

**2. `client.setCookie()` / `client.clearCookie()` — new server API:**

The auth flow requires the server to set cookies on the client. This is done
via HTTP headers on the SSE or action response, but bwserve should provide
a clean API instead of requiring raw header manipulation:

```javascript
client.setCookie(name, value, opts);   // opts: { httpOnly, sameSite, maxAge, secure, path }
client.clearCookie(name);              // sets maxAge=0
```

These translate to `Set-Cookie` headers. For SSE (which is a long-lived
response), cookies can only be set on the initial SSE handshake or on the
action POST response. **Decision**: cookies are set on the next POST response.
`client._pendingCookies` queue, flushed on next action response.

**3. Session token on SSE reconnect:**

When the browser tab restores and EventSource reconnects, how does the server
know which session to resume? Options:

- **(a) Cookie-based** (recommended): The SSE endpoint reads the `bw_session`
  cookie from the request headers. No URL params needed. Automatic.
- (b) URL-param: `/__bw/events?session=xxx`. Visible in logs, less secure.
- (c) POST-then-SSE: Client sends auth POST, gets SSE URL with token.

**Decision**: Cookie-based. It's automatic (browser sends cookies on reconnect),
secure (httpOnly prevents XSS theft), and doesn't pollute URLs.

**4. Validation error targeting:**

The pattern `client.render('#login-error', { ... alert ... })` works but has
a weakness: the server must know the DOM structure to target the error container.
This is fine for server-rendered apps (the server built the DOM, so it knows),
but fragile if the client modifies the DOM independently.

**Not a grammar problem** — this is inherent to server-driven UI. Streamlit
and LiveView have the same constraint. The server owns the layout; the client
is a renderer.

**5. Form reset after submission:**

After `add-item`, we need to clear the form. The protocol has no "reset form"
message. Options considered:
- **Full re-render** (`renderDashboard`): Works but wasteful. The whole page
  flashes for a form clear.
- **Batch of patches**: `{ type: 'batch', ops: [{ type: 'patch', target: 'title-input', content: '' }, ...] }`.
  Verbose but surgical. Requires each input to have an id.
- **New message type `reset`**: `{ type: 'reset', target: '#add-form' }` calls
  `form.reset()`. Tempting but adds a DOM-method-specific message.
- **`patch` with `attr` to set `value: ''`**: `{ type: 'patch', target: '#add-form input[name=title]', attr: { value: '' } }`. Uses existing grammar but CSS selector in target is underspecified.

**Decision**: Use `replace` on the form container. Re-render the form section
only, not the whole page. This is the cleanest mapping to existing grammar:

```javascript
client.render('#add-form-container', renderAddForm());
```

This means the add form should be wrapped in a targetable container. Good
pattern: every independently-updatable section gets its own id.

**6. Hidden inputs for record IDs:**

The edit form uses `<input type="hidden" name="id" value="42">` to pass the
record ID back via `sendForm`. This is a classic HTML pattern and works
naturally with `sendForm`. No grammar changes needed — the hidden input is
just another named element.

Alternative: static data in the event descriptor:
```javascript
o: { events: { click: { action: 'save-item', sendForm: '#edit-form', data: { id: 42 } } } }
```
Both `sendForm` data and static `data` merge into the action payload. If both
have the same key, static `data` wins (explicit > implicit). This merge rule
needs to be documented.

### Ergonomics Assessment

**What works well:**
- `sendForm` maps naturally to HTML forms. Registration, login, add, edit — all
  use the same pattern. The grammar is consistent.
- `client.render()` for full view swaps (login → dashboard) is clean
- `client.append()` for adding items and `client.remove()` for deleting them
  avoids full re-renders — the protocol is surgical
- Inline edit (replace card with form, then replace back) uses existing grammar
- Static `data: { id: N }` on event descriptors passes record context cleanly
- The auth pattern (server sets cookie, SSE reconnect reads cookie) is standard
  HTTP — no bwserve-specific auth protocol needed

**Friction points identified:**
- **Cookie API**: Need `client.setCookie()` / `client.clearCookie()`. Small
  addition but essential for any auth use case. ~10 lines of implementation.
- **Session lookup on SSE connect**: `app.page()` handler receives `client`,
  but needs `client.sessionToken` populated from cookie. This is middleware-level
  concern: bwserve should parse cookies from the SSE request and expose them
  as `client.cookies` (read-only object).
- **Form reset**: No elegant solution with current grammar. `replace` on form
  container is the best option. This is acceptable — server-driven means the
  server re-sends the clean form.
- **`sendForm` + static `data` merge precedence**: Needs a clear rule. Proposed:
  static `data` keys override `sendForm` keys (explicit wins over collected).
- **Async handlers**: Supabase operations are async. `app.onAction()` handler
  should support async functions (return a Promise). The dispatcher awaits it.

---

## Use Case 8: Client-Side Routed SPA (No bwserve)

**Scenario**: A multi-page single-page application with client-side routing.
No bwserve server — just a static HTML file (or `bitwrench build` output)
served from any web server, CDN, or even `file://`. The browser handles
navigation entirely in JS using `hashchange` or `popstate`.

**This validates**: That bitwrench works for the most common SPA pattern
*without* needing bwserve. This is important because many users will use
bitwrench for client-only apps, and the routing story should be clean without
requiring them to adopt server-driven mode. It also clarifies what bitwrench
provides vs. what standard browser APIs handle.

### The key question: Does bitwrench need a router?

**No.** Routing is fundamentally a mapping from URL → render function. The
browser provides two built-in mechanisms:

1. **Hash routing** (`#/products`, `#/cart`): `window.addEventListener('hashchange', fn)`
2. **History routing** (`/products`, `/cart`): `window.addEventListener('popstate', fn)` + `history.pushState()`

Both are ~15 lines of vanilla JS. Bitwrench's job is rendering, not routing.
A bitwrench router would be a thin wrapper around browser APIs that adds no
real value and creates lock-in. Better to show the pattern and let users
bring their own router (or none).

### Server Code

None. This is a static HTML file.

### Client Code

```html
<!DOCTYPE html>
<html><head>
  <title>My SPA</title>
  <script src="https://cdn.jsdelivr.net/npm/bitwrench/dist/bitwrench.umd.min.js"></script>
</head>
<body>
  <div id="app"></div>
  <script>
    bw.loadDefaultStyles();

    // ---- Route definitions ----
    var routes = {
      '':          renderHome,
      'products':  renderProducts,
      'product':   renderProduct,    // product/:id
      'cart':      renderCart,
      'about':     renderAbout
    };

    // ---- Router (vanilla JS, ~20 lines) ----
    function navigate(path) {
      window.location.hash = '#/' + path;
    }

    function getRoute() {
      var hash = window.location.hash.slice(2) || '';  // strip '#/'
      var parts = hash.split('/');
      return { name: parts[0] || '', params: parts.slice(1) };
    }

    function handleRoute() {
      var route = getRoute();
      var handler = routes[route.name] || renderNotFound;
      handler(route.params);
    }

    window.addEventListener('hashchange', handleRoute);

    // ---- Nav component (reused across pages) ----
    function renderNav(active) {
      return {
        t: 'nav', a: { class: 'bw-navbar' }, c: [
          { t: 'a', a: { href: '#/', class: active === '' ? 'active' : '' }, c: 'Home' },
          { t: 'a', a: { href: '#/products', class: active === 'products' ? 'active' : '' }, c: 'Products' },
          { t: 'a', a: { href: '#/cart', class: active === 'cart' ? 'active' : '' }, c: 'Cart (' + cart.length + ')' },
          { t: 'a', a: { href: '#/about', class: active === 'about' ? 'active' : '' }, c: 'About' }
        ]
      };
    }

    // ---- Page renderers ----
    function renderHome() {
      bw.DOM('#app', { t: 'div', c: [
        renderNav(''),
        { t: 'div', a: { class: 'bw-container' }, c: [
          { t: 'h1', c: 'Welcome' },
          { t: 'p', c: 'A client-side routed SPA with bitwrench.' },
          { t: 'button', a: { class: 'bw-btn bw-btn-primary', onclick: "navigate('products')" },
            c: 'Browse Products' }
        ]}
      ]});
    }

    function renderProducts() {
      bw.DOM('#app', { t: 'div', c: [
        renderNav('products'),
        { t: 'div', a: { class: 'bw-container' }, c: [
          { t: 'h1', c: 'Products' },
          { t: 'div', a: { class: 'bw-row' }, c: products.map(function(p) {
            return { t: 'div', a: { class: 'bw-col' }, c: [
              { t: 'div', a: { class: 'bw-card' }, c: [
                { t: 'div', a: { class: 'bw-card-body' }, c: [
                  { t: 'h3', c: p.name },
                  { t: 'p', c: '$' + p.price.toFixed(2) },
                  { t: 'button', a: { class: 'bw-btn bw-btn-sm', onclick: "addToCart(" + p.id + ")" },
                    c: 'Add to Cart' },
                  ' ',
                  { t: 'a', a: { href: '#/product/' + p.id }, c: 'Details' }
                ]}
              ]}
            ]};
          })}
        ]}
      ]});
    }

    function renderProduct(params) {
      var id = parseInt(params[0]);
      var p = products.find(function(x) { return x.id === id; });
      if (!p) return renderNotFound();

      bw.DOM('#app', { t: 'div', c: [
        renderNav('products'),
        { t: 'div', a: { class: 'bw-container' }, c: [
          { t: 'a', a: { href: '#/products' }, c: 'Back to Products' },
          { t: 'h1', c: p.name },
          { t: 'p', c: p.description },
          { t: 'p', c: { t: 'strong', c: '$' + p.price.toFixed(2) } },
          { t: 'button', a: { class: 'bw-btn bw-btn-primary', onclick: "addToCart(" + p.id + ")" },
            c: 'Add to Cart' }
        ]}
      ]});
    }

    function renderCart() {
      var total = cart.reduce(function(sum, item) { return sum + item.price * item.qty; }, 0);

      bw.DOM('#app', { t: 'div', c: [
        renderNav('cart'),
        { t: 'div', a: { class: 'bw-container' }, c: [
          { t: 'h1', c: 'Cart' },
          cart.length === 0
            ? { t: 'p', c: 'Your cart is empty.' }
            : { t: 'div', c: [
                { t: 'div', c: cart.map(function(item) {
                  return { t: 'div', a: { class: 'bw-card', style: 'margin-bottom: 0.5rem' }, c: [
                    { t: 'div', a: { class: 'bw-card-body', style: 'display:flex;justify-content:space-between;align-items:center' }, c: [
                      { t: 'span', c: item.name + ' x' + item.qty },
                      { t: 'span', c: '$' + (item.price * item.qty).toFixed(2) },
                      { t: 'button', a: { class: 'bw-btn bw-btn-sm bw-btn-danger', onclick: "removeFromCart(" + item.id + ")" },
                        c: 'Remove' }
                    ]}
                  ]};
                })},
                { t: 'hr' },
                { t: 'p', c: { t: 'strong', c: 'Total: $' + total.toFixed(2) } },
                { t: 'button', a: { class: 'bw-btn bw-btn-primary', onclick: "navigate('checkout')" },
                  c: 'Checkout' }
              ]}
        ]}
      ]});
    }

    function renderNotFound() {
      bw.DOM('#app', { t: 'div', c: [
        renderNav(''),
        { t: 'div', a: { class: 'bw-container' }, c: [
          { t: 'h1', c: '404 — Page Not Found' },
          { t: 'a', a: { href: '#/' }, c: 'Go home' }
        ]}
      ]});
    }

    // ---- App state (client-side only) ----
    var products = [
      { id: 1, name: 'Widget A', price: 29.99, description: 'A fine widget.' },
      { id: 2, name: 'Widget B', price: 49.99, description: 'A finer widget.' },
      { id: 3, name: 'Widget C', price: 19.99, description: 'The finest widget.' }
    ];
    var cart = [];

    function addToCart(id) {
      var p = products.find(function(x) { return x.id === id; });
      var existing = cart.find(function(x) { return x.id === id; });
      if (existing) { existing.qty++; } else { cart.push({ id: p.id, name: p.name, price: p.price, qty: 1 }); }
      handleRoute();  // re-render current page (updates cart badge in nav)
    }

    function removeFromCart(id) {
      cart = cart.filter(function(x) { return x.id !== id; });
      handleRoute();
    }

    // Boot
    handleRoute();
  </script>
</body>
</html>
```

### What bitwrench provides vs. what the developer provides

| Concern | Who handles it | How |
|---------|---------------|-----|
| URL parsing | Developer (vanilla JS) | `window.location.hash.split('/')` |
| URL change events | Browser | `hashchange` / `popstate` |
| Route → handler dispatch | Developer (~10 lines) | `routes[name](params)` |
| Rendering | bitwrench | `bw.DOM('#app', taco)` |
| Shared nav component | Developer (TACO function) | `renderNav(active)` returns TACO |
| State management | Developer | Plain JS variables + re-render on change |
| CSS / theming | bitwrench | `bw.loadDefaultStyles()`, BCCL classes |

The router is **not** part of bitwrench. It's 20 lines of vanilla JS. This is
intentional — routing is a solved problem and wrapping it in a library API adds
complexity without value. The important thing is that `bw.DOM()` is fast enough
that the full-page re-render on every route change feels instant (it does — DOM
creation from TACO is ~1ms for a typical page).

### Grammar Findings

**1. `onclick` vs. `o.events` for client-side-only actions:**

The example above uses `onclick: "navigate('products')"` — inline string
handlers. This works in any browser but has known downsides (global scope
pollution, CSP violations with strict policies).

The alternative is `o.mounted` to wire handlers:
```javascript
{
  t: 'button', c: 'Browse Products',
  o: { mounted: function(el) { el.addEventListener('click', function() { navigate('products'); }); } }
}
```

This is more verbose but CSP-safe. A third option: extend `o.events` with a
`local` action type that runs a registered client-side function instead of
posting to the server:

```javascript
// Hypothetical — NOT proposed for v1:
o: { events: { click: { fn: 'navigate', args: ['products'] } } }
```

**Decision**: Don't add this. `onclick` works for simple cases. `o.mounted`
works for CSP-strict environments. A client-side function registry in `o.events`
is overengineering for a pattern that vanilla JS handles well. bitwrench is
not trying to replace event listeners — it's trying to replace innerHTML.

**2. Re-render strategy:**

The `handleRoute()` function calls `bw.DOM('#app', ...)` which replaces the
entire `#app` subtree. This is clean but throws away all DOM state (scroll
position, input focus, animation state). For a simple SPA this is fine. For
a complex one, you'd use `bw.component()` with `.set()` to update reactive
state without full re-render — exactly what Phase 1 ComponentHandle provides.

The two patterns coexist:
- **Simple SPA**: `bw.DOM()` full re-render per route. Zero state management overhead.
- **Complex SPA**: `bw.component()` + `.set()` for in-page reactivity, `bw.DOM()` for route swaps.

No grammar change needed. This is the existing API working as designed.

**3. No server dependency:**

This entire use case has no `bwserve`, no SSE, no `o.events` with `action`.
It's pure client-side bitwrench. This proves that the client-side API is
self-sufficient — you don't need to buy into server-driven mode to build a
real app. This is important for adoption: users can start with client-side
bitwrench and add bwserve later when they need server state.

### Ergonomics Assessment

**What works well:**
- `bw.DOM('#app', taco)` as the universal "render this view" call
- TACO functions (`renderNav()`, `renderProducts()`) compose naturally
- Cart state is just a JS array — no state management library needed
- Hash routing is trivial and works on `file://` (great for prototyping)
- BCCL classes (`bw-card`, `bw-btn`, etc.) give styled output with no CSS work

**Friction points identified:**
- **`onclick` string handlers** are ugly and CSP-hostile. But the alternative
  (`o.mounted`) is verbose. This is a known trade-off, not a grammar gap.
  Future: `bw.on()` could provide a lighter syntax for client-side event binding,
  but this is sugar, not architecture.
- **Full re-render on every route change** loses focus/scroll. Acceptable for
  simple apps. For complex apps, `bw.component()` solves this at the component
  level. No new API needed.
- **Deep linking with params** (`#/product/42`) requires manual URL parsing.
  Again, this is 3 lines of JS. Not worth a bitwrench API.

---

## Use Case 9: Server-Side Routed App (bwserve Drives Navigation)

**Scenario**: A multi-page application where the **server** controls which
"page" the user sees. The URL changes as the user navigates, but the server
decides what to render based on navigation actions. The browser never loads
a new HTML document — it's still a single SSE connection — but the URL bar
updates to reflect the current view.

**This validates**: `app.page()` with multiple paths, server-pushed view
transitions, URL synchronization between server and client, browser
back/forward behavior, and the grammar for a `navigate` message type.

### How this differs from Use Case 8

| Aspect | UC8 (client-side) | UC9 (server-side) |
|--------|-------------------|-------------------|
| Who decides what to render | Client JS | Server |
| URL changes via | `window.location.hash` | `history.pushState()` triggered by server |
| State lives on | Client (JS variables) | Server (per-client state) |
| Data fetching | Client `fetch()` calls | Server queries DB directly |
| Works offline | Yes | No (needs SSE connection) |
| Works on `file://` | Yes | No (needs bwserve) |

Both are valid. The choice depends on where state lives. If the server has the
data (database, external APIs, auth), server-side routing is simpler because
the server renders from source data without an API layer in between.

### Architecture

```
Browser                              bwserve
┌─────────────────────────┐         ┌─────────────────────────┐
│ URL: /products          │         │ client._view = 'products'│
│                         │         │                         │
│ User clicks product     │         │                         │
│ ──POST action:navigate──│────────>│ onAction('navigate')    │
│   data:{path:'/p/42'}   │         │   set client._view      │
│                         │         │   query product from DB  │
│ <──SSE: batch──────────│<────────│   batch:                │
│   [pushUrl, replace]   │         │     pushUrl('/p/42')     │
│                         │         │     replace('#app',taco) │
│ Browser shows product   │         │                         │
│ URL bar: /p/42          │         │                         │
│                         │         │                         │
│ User clicks Back button │         │                         │
│ ──POST action:popstate──│────────>│ onAction('popstate')    │
│   data:{path:'/products'}│        │   re-render products    │
│ <──SSE: replace─────────│<────────│                         │
└─────────────────────────┘         └─────────────────────────┘
```

### New message type: `pushUrl`

Server-side routing requires the server to tell the client "update the URL bar
without reloading." This is a new message type:

```javascript
{ type: 'pushUrl', url: '/products/42', title: 'Widget A — My Store' }
```

Client-side implementation (~5 lines in `bw.clientApply()`):
```javascript
case 'pushUrl':
  history.pushState({ bwserve: true }, msg.title || '', msg.url);
  if (msg.title) document.title = msg.title;
  break;
```

This does NOT trigger `popstate` (pushState never does). The server sends
`pushUrl` alongside a `replace` in a `batch` to atomically update both the
URL and the content.

**Why not reuse `patch`?** Because URL changes aren't DOM mutations. They're
browser chrome. A separate message type makes the protocol explicit and
keeps `patch` clean.

**Alternative considered**: `{ type: 'message', target: '_router', action: 'push', data: { url: '...' } }`. This reuses the existing `message` type with a magic target. Rejected because routing is common enough to justify a first-class message type, and magic targets are opaque.

### Client-side popstate handler

When the user clicks Back/Forward, the browser fires `popstate`. The bwserve
shell page wires this automatically:

```javascript
// In the auto-generated shell page:
window.addEventListener('popstate', function(e) {
  conn.sendAction('popstate', { path: window.location.pathname });
});
```

This sends the URL back to the server, which re-renders the appropriate view.
The server is always the source of truth for what to display — the URL is just
a bookmark.

### Server Code

```javascript
import bwserve from 'bitwrench/bwserve';

var app = bwserve.create({ port: 7902, theme: 'ocean', title: 'My Store' });

// Product data (in reality, from a database)
var products = [
  { id: 1, name: 'Widget A', price: 29.99, description: 'A fine widget.', stock: 42 },
  { id: 2, name: 'Widget B', price: 49.99, description: 'A finer widget.', stock: 17 },
  { id: 3, name: 'Widget C', price: 19.99, description: 'The finest widget.', stock: 0 }
];

// ---- View renderers ----

function renderNav(active) {
  return {
    t: 'nav', a: { class: 'bw-navbar' }, c: [
      { t: 'span', a: { class: 'bw-navbar-brand' }, c: 'My Store' },
      navLink('/', 'Home', active),
      navLink('/products', 'Products', active),
      navLink('/about', 'About', active)
    ]
  };
}

function navLink(path, label, active) {
  return {
    t: 'a', a: { href: path, class: active === path ? 'active' : '' }, c: label,
    o: { events: { click: { action: 'navigate', data: { path: path }, prevent: true } } }
  };
}

function renderHomePage(client) {
  client.batch([
    { type: 'pushUrl', url: '/', title: 'My Store' },
    { type: 'replace', target: '#app', node: {
      t: 'div', c: [
        renderNav('/'),
        { t: 'div', a: { class: 'bw-container' }, c: [
          { t: 'h1', c: 'Welcome to My Store' },
          { t: 'p', c: 'Browse our fine selection of widgets.' },
          navLink('/products', 'Shop Now', null)
        ]}
      ]
    }}
  ]);
}

function renderProductsPage(client) {
  client.batch([
    { type: 'pushUrl', url: '/products', title: 'Products — My Store' },
    { type: 'replace', target: '#app', node: {
      t: 'div', c: [
        renderNav('/products'),
        { t: 'div', a: { class: 'bw-container' }, c: [
          { t: 'h1', c: 'Products' },
          { t: 'div', a: { class: 'bw-row' }, c: products.map(function(p) {
            return { t: 'div', a: { class: 'bw-col' }, c: [
              { t: 'div', a: { class: 'bw-card' }, c: [
                { t: 'div', a: { class: 'bw-card-body' }, c: [
                  { t: 'h3', c: p.name },
                  { t: 'p', c: '$' + p.price.toFixed(2) },
                  { t: 'p', c: p.stock > 0 ? 'In stock' : 'Out of stock',
                    a: { style: 'color:' + (p.stock > 0 ? 'green' : 'red') } },
                  { t: 'a', a: { href: '/products/' + p.id }, c: 'View Details',
                    o: { events: { click: { action: 'navigate', data: { path: '/products/' + p.id }, prevent: true } } }
                  }
                ]}
              ]}
            ]};
          })}
        ]}
      ]
    }}
  ]);
}

function renderProductDetailPage(client, productId) {
  var p = products.find(function(x) { return x.id === productId; });
  if (!p) return renderNotFoundPage(client);

  client.batch([
    { type: 'pushUrl', url: '/products/' + p.id, title: p.name + ' — My Store' },
    { type: 'replace', target: '#app', node: {
      t: 'div', c: [
        renderNav('/products'),
        { t: 'div', a: { class: 'bw-container' }, c: [
          { t: 'a', a: { href: '/products' }, c: 'Back to Products',
            o: { events: { click: { action: 'navigate', data: { path: '/products' }, prevent: true } } }
          },
          { t: 'h1', c: p.name },
          { t: 'p', c: p.description },
          { t: 'p', c: { t: 'strong', c: '$' + p.price.toFixed(2) } },
          p.stock > 0
            ? { t: 'button', a: { class: 'bw-btn bw-btn-primary' }, c: 'Add to Cart',
                o: { events: { click: { action: 'add-to-cart', data: { productId: p.id } } } }
              }
            : { t: 'span', a: { class: 'bw-badge bw-badge-danger' }, c: 'Out of Stock' }
        ]}
      ]
    }}
  ]);
}

function renderNotFoundPage(client) {
  client.batch([
    { type: 'pushUrl', url: '/404', title: 'Not Found — My Store' },
    { type: 'replace', target: '#app', node: {
      t: 'div', c: [
        renderNav(''),
        { t: 'div', a: { class: 'bw-container' }, c: [
          { t: 'h1', c: '404 — Page Not Found' },
          navLink('/', 'Go Home', null)
        ]}
      ]
    }}
  ]);
}

// ---- Route dispatcher (server-side) ----

function routeTo(client, path) {
  // Simple pattern matching — production would use a proper router lib
  if (path === '/' || path === '') return renderHomePage(client);
  if (path === '/products') return renderProductsPage(client);
  if (path === '/about') return renderAboutPage(client);

  var productMatch = path.match(/^\/products\/(\d+)$/);
  if (productMatch) return renderProductDetailPage(client, parseInt(productMatch[1]));

  renderNotFoundPage(client);
}

// ---- Handlers ----

app.page('/', function(client) {
  // Initial SSE connection — render based on the URL the browser loaded
  // The shell page passes the initial URL via query param on the SSE endpoint
  var initialPath = client.query.path || '/';
  routeTo(client, initialPath);
});

app.onAction('navigate', function(data, client) {
  routeTo(client, data.path);
});

app.onAction('popstate', function(data, client) {
  // Browser back/forward — re-render without pushUrl (URL already correct)
  var path = data.path;
  // Same as routeTo but skip the pushUrl in the batch
  // To handle this cleanly, pass a flag:
  client._skipPushUrl = true;
  routeTo(client, path);
  client._skipPushUrl = false;
});

app.listen();
```

### Initial page load and deep linking

When a user bookmarks `/products/42` and opens it later, the flow is:

1. Browser requests `GET /products/42`
2. bwserve serves the shell page (same for all paths — it's a SPA shell)
3. Shell page opens SSE to `/__bw/events?path=/products/42`
4. Server's `app.page('/')` handler reads `client.query.path` → `'/products/42'`
5. Server calls `routeTo(client, '/products/42')` → renders product detail

This means bwserve needs to serve the shell page for **all** routes, not just
`/`. This is standard SPA behavior — a catch-all that returns the same HTML
shell. Implementation: bwserve matches registered `app.page()` paths first,
then falls back to the catch-all shell for unmatched paths.

**New requirement for bwserve**: `app.page('*', handler)` — wildcard catch-all.
Or: bwserve always serves the shell for any GET that doesn't match a static
file, and passes the requested path via the SSE connection.

### The `popstate` problem

When the user clicks Back, the browser fires `popstate` with the previous URL.
The shell page sends this to the server as `action: 'popstate'`. The server
re-renders the view **without** sending `pushUrl` (because the URL is already
correct — Back already changed it).

This creates an asymmetry: `navigate` actions send `pushUrl` + `replace`,
but `popstate` actions send only `replace`. The cleanest implementation:
`renderHomePage()` etc. call `client.batch([pushUrl, replace])`, and the
popstate handler wraps the call to skip the pushUrl. This is slightly ugly
but correct.

**Alternative**: Send `pushUrl` always, even on popstate. `pushState` with the
same URL is a no-op in terms of browser behavior. Simpler code, one extra no-op
message. **This is probably the right answer** — simplicity beats elegance.

### Grammar Findings

**1. New message type `pushUrl`:**

```javascript
{ type: 'pushUrl', url: '/products/42', title: 'Widget A — My Store' }
```

This is the first message type that modifies browser chrome rather than DOM.
It's justified because URL management is fundamental to multi-page apps and
can't be expressed with existing types. Implementation: ~5 lines in
`bw.clientApply()`.

**Should `replaceUrl` also exist?** Yes, for cases like login → dashboard where
you don't want Back to return to the login form:

```javascript
{ type: 'replaceUrl', url: '/dashboard', title: 'Dashboard' }
// Uses history.replaceState() instead of history.pushState()
```

This is `pushUrl`'s sibling — same implementation, one method call difference.

**2. Shell page catch-all routing:**

bwserve must serve the shell page for any path, not just `/`. The server
then needs to know which path the browser actually requested, so it can
render the right initial view. Proposed: pass path via SSE URL query param
(`/__bw/events?path=/products/42`). The shell page generates this automatically:

```javascript
// In shell page:
var conn = bw.clientConnect('/__bw/events?path=' + encodeURIComponent(location.pathname), { ... });
```

**3. `popstate` auto-wiring:**

The shell page should automatically wire `popstate → sendAction('popstate', { path })`.
This is bwserve infrastructure, not user code. The user only writes `app.onAction('popstate', ...)`.

**4. Link interception:**

Navigation links use `o.events: { click: { action: 'navigate', data: { path }, prevent: true } }`.
The `prevent: true` stops the browser from following the `href`. This works
but is verbose. Consider auto-intercepting links within the bwserve shell:

```javascript
// Shell page: intercept all internal links
document.addEventListener('click', function(e) {
  var a = e.target.closest('a[href]');
  if (a && a.hostname === location.hostname && !a.hasAttribute('data-external')) {
    e.preventDefault();
    conn.sendAction('navigate', { path: a.pathname });
  }
});
```

This would mean links work without `o.events` at all — just `{ t: 'a', a: { href: '/products' }, c: 'Products' }`.
The shell page catches the click and sends it as a navigation action.

**Decision**: Add this to the shell page. It's ~8 lines and makes server-side
routing feel natural. Links look like normal links. `data-external` attribute
opts out (for links to other sites).

### Ergonomics Assessment

**What works well:**
- `routeTo(client, path)` is a clean dispatcher — just a function with if/else
- Navigation links look like real links (`href="/products"`) — accessible, right-click works
- `pushUrl` in a `batch` with `replace` makes the URL and content update atomically
- Deep linking works because the shell passes the initial path to the server
- Back/Forward work via `popstate` → server re-render

**Friction points identified:**
- **`popstate` skip-pushUrl asymmetry**: Slightly ugly. Mitigation: always send
  `pushUrl` even on popstate (no-op). Simplest solution.
- **No client-side route cache**: Every Back press re-queries the server.
  Acceptable for v1. Future optimization: server can cache last N renders per
  client and replay them instantly on popstate.
- **Shell catch-all**: bwserve needs to handle `app.page('*')` or auto-catch-all.
  Small addition (~5 lines in the HTTP handler).
- **Link interception in shell**: Needs careful handling of external links,
  download links, and target="_blank". The `data-external` escape hatch and
  checking `hostname` covers most cases.

---

## Use Case 10: E-Commerce Storefront (Multi-User, Roles, Cart)

**Scenario**: A multi-user e-commerce website with product catalog, shopping
cart, checkout, order history, and admin panel. Multiple users are on the site
simultaneously. An admin can update inventory and all connected customers see
the changes in real time.

**This validates**: Multi-user broadcast with role-based filtering, complex
form flows (checkout with multiple steps), cart state management (per-client),
real-time inventory updates, and the overall grammar under a realistic
"production app" workload. This is intentionally outside bitwrench's primary
design center — if the grammar works here, it works everywhere.

### Why this matters for grammar design

E-commerce is the canonical "real web app." It has:
- **Authentication + authorization** (customer vs. admin roles)
- **Per-user state** (cart) that persists across pages
- **Shared state** (inventory) that broadcasts to all users
- **Multi-step forms** (checkout: address → payment → confirm)
- **Conditional rendering** (admin sees edit buttons, customers don't)
- **Search with debounce** (product search)
- **Pagination** (product listing)

If any of these feel awkward with the bwserve grammar, we have a grammar gap.

### Architecture

```
Customers (N browsers)          bwserve                   Database
┌──────────────────┐           ┌──────────────────┐      ┌──────────┐
│ Browse products  │──SSE────> │ per-client:      │<────>│ products │
│ Add to cart      │           │   cart []         │      │ orders   │
│ Checkout         │──POST──>  │   role: customer  │      │ users    │
│                  │           │   view: products  │      │ inventory│
│                  │<──SSE──── │                   │      └──────────┘
│ "2 left in stock"│           │ broadcast:        │
└──────────────────┘           │   inventory change│
                               │   → all clients   │
Admin (1 browser)              │                   │
┌──────────────────┐           │ per-client:       │
│ Edit products    │──POST──>  │   role: admin     │
│ View orders      │           │   view: orders    │
│ Update inventory │──POST──>  │                   │
│                  │<──SSE──── │                   │
└──────────────────┘           └──────────────────┘
```

### Server Code

```javascript
import bwserve from 'bitwrench/bwserve';
import Database from 'better-sqlite3';

var db = new Database('store.db');
var app = bwserve.create({ port: 7902, theme: 'ocean', title: 'Widget Store' });

// ---- Per-client state ----
// Each client has a cart and a role. bwserve manages the SSE connection;
// we store app-specific state on the client object.

app.page('/', function(client) {
  client.cart = [];
  client.role = 'guest';       // guest | customer | admin
  client.user = null;

  // Check session cookie
  var session = lookupSession(client.cookies.bw_session);
  if (session) {
    client.role = session.role;
    client.user = session;
    client.cart = loadCart(session.userId);
  }

  routeTo(client, client.query.path || '/');
});

// ---- Navigation ----

function routeTo(client, path) {
  if (path === '/') return renderStorefront(client);
  if (path === '/products') return renderProductList(client, { page: 1 });
  if (path === '/cart') return renderCartPage(client);
  if (path === '/checkout') return renderCheckout(client, 'address');
  if (path === '/orders') return renderOrders(client);
  if (path === '/admin' && client.role === 'admin') return renderAdmin(client);
  if (path === '/login') return renderLogin(client);

  var m = path.match(/^\/products\/(\d+)$/);
  if (m) return renderProductDetail(client, parseInt(m[1]));

  var m2 = path.match(/^\/admin\/product\/(\d+)$/);
  if (m2 && client.role === 'admin') return renderAdminProductEdit(client, parseInt(m2[1]));

  renderNotFound(client);
}

// ---- Product list with search + pagination ----

function renderProductList(client, opts) {
  var page = opts.page || 1;
  var search = opts.search || '';
  var perPage = 12;
  var offset = (page - 1) * perPage;

  var where = search ? "WHERE name LIKE ? OR description LIKE ?" : "";
  var params = search ? ['%' + search + '%', '%' + search + '%'] : [];

  var total = db.prepare('SELECT COUNT(*) as n FROM products ' + where).get(...params).n;
  var items = db.prepare('SELECT * FROM products ' + where + ' ORDER BY name LIMIT ? OFFSET ?')
    .all(...params, perPage, offset);
  var totalPages = Math.ceil(total / perPage);

  client.batch([
    { type: 'pushUrl', url: '/products' + (search ? '?q=' + encodeURIComponent(search) : ''),
      title: 'Products — Widget Store' },
    { type: 'replace', target: '#app', node: {
      t: 'div', c: [
        renderNav(client, '/products'),
        { t: 'div', a: { class: 'bw-container' }, c: [
          { t: 'h1', c: 'Products' + (search ? ' — "' + search + '"' : '') },

          // Search bar
          { t: 'div', a: { style: 'margin-bottom: 1rem' }, c: [
            { t: 'input', a: {
              type: 'search', placeholder: 'Search products...', value: search,
              class: 'bw-input', style: 'max-width: 300px'
            }, o: { events: {
              input: { action: 'search-products', sendValue: true, debounce: 300 }
            }}}
          ]},

          // Product grid
          { t: 'div', a: { class: 'bw-row' }, c: items.map(function(p) {
            return { t: 'div', a: { class: 'bw-col' }, c: [
              renderProductCard(p, client.role)
            ]};
          })},

          // Pagination
          totalPages > 1 ? renderPagination(page, totalPages, search) : ''
        ]}
      ]
    }}
  ]);
}

function renderProductCard(p, role) {
  return {
    t: 'div', a: { class: 'bw-card', id: 'product-' + p.id }, c: [
      { t: 'div', a: { class: 'bw-card-body' }, c: [
        { t: 'h4', c: p.name },
        { t: 'p', c: '$' + p.price.toFixed(2) },
        { t: 'p', a: { id: 'stock-' + p.id },
          c: p.stock > 0 ? p.stock + ' in stock' : 'Out of stock',
          a: { style: 'color:' + (p.stock > 0 ? 'green' : 'red'), id: 'stock-' + p.id }
        },
        { t: 'div', c: [
          { t: 'a', a: { href: '/products/' + p.id }, c: 'Details',
            o: { events: { click: { action: 'navigate', data: { path: '/products/' + p.id }, prevent: true } } }
          },
          p.stock > 0 ? [' ',
            { t: 'button', a: { class: 'bw-btn bw-btn-sm bw-btn-primary' }, c: 'Add to Cart',
              o: { events: { click: { action: 'add-to-cart', data: { productId: p.id } } } }
            }
          ] : '',
          // Admin: edit button (only rendered for admin role)
          role === 'admin' ? [' ',
            { t: 'a', a: { href: '/admin/product/' + p.id, class: 'bw-btn bw-btn-sm' }, c: 'Edit',
              o: { events: { click: { action: 'navigate', data: { path: '/admin/product/' + p.id }, prevent: true } } }
            }
          ] : ''
        ]}
      ]}
    ]
  };
}

function renderPagination(current, total, search) {
  var pages = [];
  for (var i = 1; i <= total; i++) {
    pages.push({
      t: 'button',
      a: { class: 'bw-btn bw-btn-sm' + (i === current ? ' bw-btn-primary' : '') },
      c: String(i),
      o: { events: { click: { action: 'paginate', data: { page: i, search: search } } } }
    });
  }
  return { t: 'div', a: { style: 'margin-top: 1rem; display: flex; gap: 0.25rem' }, c: pages };
}

// ---- Cart ----

function renderCartPage(client) {
  var total = client.cart.reduce(function(sum, item) { return sum + item.price * item.qty; }, 0);

  client.batch([
    { type: 'pushUrl', url: '/cart', title: 'Cart — Widget Store' },
    { type: 'replace', target: '#app', node: {
      t: 'div', c: [
        renderNav(client, '/cart'),
        { t: 'div', a: { class: 'bw-container' }, c: [
          { t: 'h1', c: 'Shopping Cart' },
          client.cart.length === 0
            ? { t: 'p', c: 'Your cart is empty.' }
            : { t: 'div', c: [
                { t: 'div', a: { id: 'cart-items' }, c: client.cart.map(renderCartItem) },
                { t: 'hr' },
                { t: 'div', a: { style: 'display:flex;justify-content:space-between;align-items:center' }, c: [
                  { t: 'h3', c: 'Total: $' + total.toFixed(2) },
                  client.role !== 'guest'
                    ? { t: 'button', a: { class: 'bw-btn bw-btn-primary' }, c: 'Proceed to Checkout',
                        o: { events: { click: { action: 'navigate', data: { path: '/checkout' }, prevent: true } } }
                      }
                    : { t: 'p', c: ['Please ', { t: 'a', a: { href: '/login' }, c: 'sign in',
                        o: { events: { click: { action: 'navigate', data: { path: '/login' }, prevent: true } } }
                      }, ' to checkout.'] }
                ]}
              ]}
        ]}
      ]
    }}
  ]);
}

function renderCartItem(item) {
  return {
    t: 'div', a: { class: 'bw-card', id: 'cart-' + item.productId, style: 'margin-bottom: 0.5rem' }, c: [
      { t: 'div', a: { class: 'bw-card-body', style: 'display:flex;justify-content:space-between;align-items:center' }, c: [
        { t: 'span', c: item.name },
        { t: 'div', a: { style: 'display:flex;align-items:center;gap:0.5rem' }, c: [
          { t: 'button', a: { class: 'bw-btn bw-btn-sm' }, c: '-',
            o: { events: { click: { action: 'update-qty', data: { productId: item.productId, delta: -1 } } } }
          },
          { t: 'span', c: String(item.qty) },
          { t: 'button', a: { class: 'bw-btn bw-btn-sm' }, c: '+',
            o: { events: { click: { action: 'update-qty', data: { productId: item.productId, delta: 1 } } } }
          },
          { t: 'span', c: '$' + (item.price * item.qty).toFixed(2) },
          { t: 'button', a: { class: 'bw-btn bw-btn-sm bw-btn-danger' }, c: 'Remove',
            o: { events: { click: { action: 'remove-from-cart', data: { productId: item.productId } } } }
          }
        ]}
      ]}
    ]
  };
}

// ---- Multi-step checkout ----

function renderCheckout(client, step) {
  if (client.role === 'guest') return routeTo(client, '/login');

  var steps = ['address', 'payment', 'confirm'];
  var stepIndex = steps.indexOf(step);

  client.batch([
    { type: 'pushUrl', url: '/checkout', title: 'Checkout — Widget Store' },
    { type: 'replace', target: '#app', node: {
      t: 'div', c: [
        renderNav(client, ''),
        { t: 'div', a: { class: 'bw-container', style: 'max-width: 600px; margin: 2rem auto' }, c: [
          // Step indicator
          { t: 'div', a: { style: 'display:flex;gap:1rem;margin-bottom:2rem' }, c: steps.map(function(s, i) {
            return { t: 'span', a: {
              style: 'padding:0.5rem 1rem;border-radius:4px;' +
                (i === stepIndex ? 'background:#336699;color:white' : i < stepIndex ? 'background:#ccc' : 'background:#eee')
            }, c: (i + 1) + '. ' + s.charAt(0).toUpperCase() + s.slice(1) };
          })},

          // Step content
          step === 'address' ? renderAddressForm() :
          step === 'payment' ? renderPaymentForm() :
          step === 'confirm' ? renderConfirmation(client) : ''
        ]}
      ]
    }}
  ]);
}

function renderAddressForm() {
  return {
    t: 'form', a: { id: 'address-form' }, c: [
      { t: 'h2', c: 'Shipping Address' },
      formField('name', 'Full Name', 'text'),
      formField('street', 'Street Address', 'text'),
      formField('city', 'City', 'text'),
      formField('state', 'State', 'text'),
      formField('zip', 'ZIP Code', 'text'),
      { t: 'button', a: { class: 'bw-btn bw-btn-primary' }, c: 'Continue to Payment',
        o: { events: { click: { action: 'checkout-step', sendForm: '#address-form',
          data: { nextStep: 'payment' }, prevent: true } } }
      }
    ]
  };
}

function renderPaymentForm() {
  return {
    t: 'form', a: { id: 'payment-form' }, c: [
      { t: 'h2', c: 'Payment' },
      formField('cardNumber', 'Card Number', 'text'),
      formField('expiry', 'Expiry (MM/YY)', 'text'),
      formField('cvv', 'CVV', 'password'),
      { t: 'div', a: { style: 'display:flex;gap:0.5rem' }, c: [
        { t: 'button', a: { class: 'bw-btn' }, c: 'Back',
          o: { events: { click: { action: 'checkout-step', data: { nextStep: 'address' }, prevent: true } } }
        },
        { t: 'button', a: { class: 'bw-btn bw-btn-primary' }, c: 'Review Order',
          o: { events: { click: { action: 'checkout-step', sendForm: '#payment-form',
            data: { nextStep: 'confirm' }, prevent: true } } }
        }
      ]}
    ]
  };
}

function renderConfirmation(client) {
  var total = client.cart.reduce(function(sum, i) { return sum + i.price * i.qty; }, 0);
  return {
    t: 'div', c: [
      { t: 'h2', c: 'Confirm Order' },
      { t: 'div', c: client.cart.map(function(item) {
        return { t: 'p', c: item.name + ' x' + item.qty + ' — $' + (item.price * item.qty).toFixed(2) };
      })},
      { t: 'hr' },
      { t: 'p', c: { t: 'strong', c: 'Total: $' + total.toFixed(2) } },
      { t: 'div', a: { style: 'display:flex;gap:0.5rem' }, c: [
        { t: 'button', a: { class: 'bw-btn' }, c: 'Back',
          o: { events: { click: { action: 'checkout-step', data: { nextStep: 'payment' }, prevent: true } } }
        },
        { t: 'button', a: { class: 'bw-btn bw-btn-primary' }, c: 'Place Order',
          o: { events: { click: { action: 'place-order' } } }
        }
      ]}
    ]
  };
}

function formField(name, label, type) {
  return { t: 'div', a: { class: 'bw-form-group' }, c: [
    { t: 'label', c: label },
    { t: 'input', a: { type: type, name: name, required: true, class: 'bw-input' } }
  ]};
}

// ---- Action handlers ----

app.onAction('navigate', function(data, client) { routeTo(client, data.path); });
app.onAction('popstate', function(data, client) { routeTo(client, data.path); });

app.onAction('search-products', function(data, client) {
  renderProductList(client, { page: 1, search: data.value || '' });
});

app.onAction('paginate', function(data, client) {
  renderProductList(client, { page: data.page, search: data.search || '' });
});

app.onAction('add-to-cart', function(data, client) {
  var p = db.prepare('SELECT * FROM products WHERE id = ?').get(data.productId);
  if (!p || p.stock <= 0) return;

  var existing = client.cart.find(function(x) { return x.productId === p.id; });
  if (existing) { existing.qty++; } else {
    client.cart.push({ productId: p.id, name: p.name, price: p.price, qty: 1 });
  }

  // Update just the nav cart badge — not a full re-render
  client.patch('cart-badge', String(client.cart.length));

  // Confirmation toast (rendered as an append, auto-removed after 2s)
  var toastId = 'toast-' + Date.now();
  client.append('#toasts', {
    t: 'div', a: { id: toastId, class: 'bw-alert bw-alert-success', style: 'margin-bottom: 0.5rem' },
    c: p.name + ' added to cart'
  });
  setTimeout(function() { client.remove('#' + toastId); }, 2000);
});

app.onAction('update-qty', function(data, client) {
  var item = client.cart.find(function(x) { return x.productId === data.productId; });
  if (!item) return;
  item.qty += data.delta;
  if (item.qty <= 0) {
    client.cart = client.cart.filter(function(x) { return x.productId !== data.productId; });
  }
  renderCartPage(client);
});

app.onAction('remove-from-cart', function(data, client) {
  client.cart = client.cart.filter(function(x) { return x.productId !== data.productId; });
  client.remove('#cart-' + data.productId);
  // Also update total — easiest to re-render cart
  renderCartPage(client);
});

app.onAction('checkout-step', function(data, client) {
  // data may include form data from sendForm (address fields, payment fields)
  // Store them on the client for the final order
  if (data.name) client.checkoutData = Object.assign(client.checkoutData || {}, data);
  renderCheckout(client, data.nextStep);
});

app.onAction('place-order', function(data, client) {
  // Create order in DB
  var total = client.cart.reduce(function(sum, i) { return sum + i.price * i.qty; }, 0);
  var orderId = db.prepare('INSERT INTO orders (user_id, total, status) VALUES (?, ?, ?)')
    .run(client.user.userId, total, 'confirmed').lastInsertRowid;

  // Insert order items + decrement stock
  client.cart.forEach(function(item) {
    db.prepare('INSERT INTO order_items (order_id, product_id, qty, price) VALUES (?, ?, ?, ?)')
      .run(orderId, item.productId, item.qty, item.price);
    db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?')
      .run(item.qty, item.productId);
  });

  // Broadcast stock changes to ALL connected clients
  client.cart.forEach(function(item) {
    var updated = db.prepare('SELECT stock FROM products WHERE id = ?').get(item.productId);
    app.broadcast.patch('stock-' + item.productId,
      updated.stock > 0 ? updated.stock + ' in stock' : 'Out of stock');
  });

  // Clear cart
  client.cart = [];

  // Show confirmation
  client.batch([
    { type: 'replaceUrl', url: '/orders/' + orderId, title: 'Order Confirmed — Widget Store' },
    { type: 'replace', target: '#app', node: {
      t: 'div', c: [
        renderNav(client, ''),
        { t: 'div', a: { class: 'bw-container', style: 'text-align: center; padding: 3rem' }, c: [
          { t: 'h1', c: 'Order Confirmed!' },
          { t: 'p', c: 'Order #' + orderId + ' — $' + total.toFixed(2) },
          { t: 'a', a: { href: '/orders' }, c: 'View Orders',
            o: { events: { click: { action: 'navigate', data: { path: '/orders' }, prevent: true } } }
          }
        ]}
      ]
    }}
  ]);
});

// ---- Admin: inventory update (broadcasts to all) ----

app.onAction('update-stock', function(data, client) {
  if (client.role !== 'admin') return;

  db.prepare('UPDATE products SET stock = ? WHERE id = ?').run(data.stock, data.productId);

  // Broadcast to ALL connected clients — customers see live stock updates
  var label = data.stock > 0 ? data.stock + ' in stock' : 'Out of stock';
  app.broadcast.patch('stock-' + data.productId, label);
});

app.listen();
```

### Protocol Trace: Customer Browses → Admin Updates Stock → Customer Sees Change

```
 ──── Customer browsing products ────
 Customer Browser              bwserve
    |  SSE connected            |
    |<── replace: product list ─|  (12 product cards rendered)
    |                           |
    |  product-3 shows          |
    |  "5 in stock" (green)     |

 ──── Admin updates stock ────
 Admin Browser                 bwserve                     Customer Browser
    |  POST: update-stock ───> |                            |
    |  { productId: 3,         |                            |
    |    stock: 0 }            |                            |
    |                          |── broadcast.patch ────────>|
    |                          |   target: 'stock-3'        |
    |                          |   content: 'Out of stock'  |
    |                          |                            |
    |                          |   (Customer's card now     |
    |                          |    shows "Out of stock")   |
    |<── patch: stock-3 ───────|                            |
    |  (Admin also sees        |                            |
    |   the update)            |                            |
```

This is the key multi-user interaction: admin mutates shared state (inventory),
bwserve broadcasts a `patch` to all clients, and every browser's product card
updates in real time without any polling or client-side logic. The existing
`broadcast.patch()` grammar handles this perfectly.

### Grammar Findings

**1. `replaceUrl` (companion to `pushUrl`):**

Used in the checkout flow: after placing an order, we want `/orders/123` in
the URL bar, but we don't want Back to return to the checkout form (the order
is already placed). `replaceUrl` uses `history.replaceState()`:

```javascript
{ type: 'replaceUrl', url: '/orders/123', title: 'Order Confirmed' }
```

This was identified as likely-needed in Use Case 9; the e-commerce checkout
confirms it's required.

**2. Role-based conditional rendering — not a grammar issue:**

The server renders different TACO based on `client.role`. Admin gets edit
buttons; customers don't. This is just `if/else` in the render function — no
special protocol support needed. The grammar doesn't need roles or permissions
because the server owns the rendering decision.

```javascript
// This is enough:
role === 'admin' ? renderEditButton(p) : ''
```

No `bw.when()` or `bw.if()` needed on the wire. Server decides, server renders.
Client is a dumb terminal for role-based content.

**3. Toast/notification pattern:**

Add-to-cart shows a toast that auto-dismisses after 2 seconds:

```javascript
client.append('#toasts', { ... alert ... });
setTimeout(function() { client.remove('#' + toastId); }, 2000);
```

This uses existing `append` + `remove` + server-side `setTimeout`. No new
grammar needed. But it does reveal that the **server** manages the toast
lifecycle, which means a `setTimeout` on the server for every toast. For high
traffic, this could mean thousands of pending timers.

**Alternative**: A `ttl` field on messages — "client, remove this element
after 2 seconds yourself":

```javascript
{ type: 'append', target: '#toasts', node: { ... }, ttl: 2000 }
```

Client-side implementation: after appending, `setTimeout(() => el.remove(), msg.ttl)`.
This moves the timer to the client where it belongs.

**Decision**: `ttl` is a nice-to-have. Don't add it in v1 — the server-side
`setTimeout` works and keeps the grammar simpler. If server timer overhead
becomes a real issue, add `ttl` as an optional field on `append`/`replace`.

**4. Multi-step form state accumulation:**

The checkout flow (address → payment → confirm) collects form data across
multiple steps. Each step sends `sendForm` data back, and the server accumulates
it on `client.checkoutData`. This works cleanly:

```javascript
app.onAction('checkout-step', function(data, client) {
  client.checkoutData = Object.assign(client.checkoutData || {}, data);
  renderCheckout(client, data.nextStep);
});
```

`sendForm` + static `data: { nextStep: 'payment' }` merge in the action
payload. The server accumulates. No grammar gap — this is a pattern.

**5. Broadcast targeting (role filtering):**

`app.broadcast.patch()` sends to ALL clients. But what if we want to broadcast
only to admins? The current grammar has no role-aware broadcast.

Options:
- **(a) Filtered broadcast**: `app.broadcast.patch('stock-3', label, { role: 'admin' })`. Adds filtering to the broadcast handle.
- **(b) Manual loop**: `app._clients.forEach(function(c) { if (c.role === 'admin') c.patch(...); })`. Uses existing API, no grammar change.
- **(c) Named groups**: `app.group('admins').patch(...)`. Pre-defined client groups.

**Decision**: Option (b) for v1. The manual loop is explicit, flexible, and
doesn't add API surface. If this pattern becomes common, add option (c) later.
Not a grammar issue — it's a convenience API decision.

**6. Pagination state:**

Pagination buttons send `{ action: 'paginate', data: { page: 2, search: 'widget' } }`.
The server re-renders the product list with the new page. This works but means
the entire product grid re-renders on every page change.

For a smoother experience, the server could `replace` only the `#product-grid`
and `#pagination` sections instead of the whole `#app`. This requires targetable
sub-sections — the same pattern identified in Use Case 7 (every independently-
updatable section gets its own id).

This isn't a grammar gap; it's a rendering strategy. The grammar supports both
approaches (full `replace` on `#app` or partial `replace` on `#product-grid`).

### Ergonomics Assessment

**What works well:**
- Server-side routing (from UC9) composes naturally with e-commerce navigation
- `broadcast.patch()` for real-time inventory updates is elegant and concise
- Per-client state (`client.cart`, `client.role`) is just JS — no framework overhead
- Multi-step checkout uses `sendForm` + state accumulation pattern cleanly
- Conditional rendering (admin vs. customer) is just `if/else` — no special grammar
- Search with debounce uses existing `o.events` descriptor perfectly
- Cart operations (add, update qty, remove) map to existing message types
- Toast pattern (append + delayed remove) works with no new API

**Friction points identified:**
- **Full re-render on pagination**: Fixable by targeting sub-sections. Pattern, not grammar.
- **Server-side toast timers**: Work but don't scale. `ttl` field on messages
  would be cleaner but adds complexity. Defer.
- **Cart badge update**: `client.patch('cart-badge', ...)` requires the nav to
  have a patchable cart badge element. Server must know the DOM structure it
  rendered. This is inherent to server-driven UI — not a grammar issue.
- **Checkout form state**: Multi-step form accumulation on `client.checkoutData`
  works but is ad-hoc. No framework for wizard/stepper flows. This is fine —
  bwserve provides primitives, not patterns. Documentation should show this
  pattern clearly.
- **No broadcast filtering**: `broadcast` goes to all. Manual loop for role-
  based broadcast. Acceptable for v1.

---

## Cross-Cutting Concerns

### 1. Shell Page Generation

bwserve auto-generates the initial HTML shell. This is the page the browser loads
before the SSE connection opens. It must:

- Include bitwrench UMD (inlined or CDN)
- Call `bw.loadDefaultStyles()`
- Optionally call `bw.generateTheme()` if `opts.theme` is set
- Create `<div id="app">Connecting...</div>` mount point
- Call `bw.clientConnect()` with correct URLs
- Wire `data-bw-action` delegated click handler

```javascript
// Generated shell (simplified):
function generateShell(opts) {
  return '<!DOCTYPE html>' +
    '<html><head>' +
    '<meta charset="UTF-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">' +
    '<title>' + (opts.title || 'bwserve') + '</title>' +
    '<script>' + bwUmdSource + '</script>' +   // inlined UMD
    '</head><body>' +
    '<div id="app">Connecting...</div>' +
    '<script>' +
    'bw.loadDefaultStyles();' +
    (opts.theme ? 'bw.generateTheme("theme",' + JSON.stringify(themeConfig) + ');' : '') +
    'var conn = bw.clientConnect("/__bw/events", {' +
    '  transport: "sse",' +
    '  actionUrl: "/__bw/action"' +
    '});' +
    '</script>' +
    '</body></html>';
}
```

### 2. URL Routing

All bwserve-internal URLs use `/__bw/` prefix to avoid collisions:

| URL | Method | Purpose |
|-----|--------|---------|
| `/` (or custom path) | GET | Serve shell page |
| `/__bw/events` | GET | SSE event stream |
| `/__bw/action` | POST | User action dispatch |
| `/__bw/static/*` | GET | Static files (if configured) |

### 3. Client Session Management

Each SSE connection gets a unique client ID (UUID). The server tracks active
connections in a Map:

```javascript
// Internal to BwServeApp:
this._clients = new Map();   // clientId -> BwServeClient

// On SSE connect:
var clientId = crypto.randomUUID();
var client = new BwServeClient(clientId, res);
this._clients.set(clientId, client);
pageHandler(client);

// On SSE disconnect:
this._clients.delete(clientId);
disconnectHandler(client);
```

The client ID is passed via URL: `/__bw/events?id=<uuid>` on first connect.
Actions include the client ID: `POST /__bw/action` with body `{ clientId, action, data }`.

### 4. Broadcast Handle

`app.broadcast` is a special object that proxies all BwServeClient methods to
every active client:

```javascript
// BroadcastHandle — sends to all clients
class BroadcastHandle {
  constructor(app) { this._app = app; }

  render(target, taco) {
    this._app._clients.forEach(function(c) { c.render(target, taco); });
  }
  patch(id, content, attr) {
    this._app._clients.forEach(function(c) { c.patch(id, content, attr); });
  }
  append(target, taco) {
    this._app._clients.forEach(function(c) { c.append(target, taco); });
  }
  remove(target) {
    this._app._clients.forEach(function(c) { c.remove(target); });
  }
  batch(ops) {
    this._app._clients.forEach(function(c) { c.batch(ops); });
  }
  patchAll(patches) {
    this._app._clients.forEach(function(c) { c.patchAll(patches); });
  }
}
```

### 5. Error Handling

| Error | Server behavior | Client behavior |
|-------|----------------|-----------------|
| SSE disconnect | Remove client, fire `onDisconnect` | `EventSource` auto-reconnects |
| Action POST fails | Return 500, log error | Show error indicator, retry? |
| Invalid message | Log warning, skip | `bw.clientApply` ignores unknown types |
| Target not found | N/A (server doesn't know DOM) | Log warning, skip operation |

### 6. Security Considerations

- **CORS**: bwserve serves SSE and action endpoints on the same origin. No CORS needed for default setup.
- **Input validation**: `bw.clientApply` should sanitize TACO nodes — no `<script>` in content, no `javascript:` URLs. This is bitwrench's existing `bw.escapeHTML()` behavior.
- **Action validation**: Server must validate action names and data. Never trust client input.
- **Rate limiting**: Not in v1, but the `throttle` and `debounce` event options provide client-side throttling. Server-side rate limiting is a future concern.

---

## Implementation Plan

### Phase A: Client-Side (bitwrench.js) — ~180 lines

**Priority**: Implement first. Can be tested with mock SSE/fetch.

| Item | LOC | Description |
|------|-----|-------------|
| `bw.clientConnect()` | ~80 | SSE transport (EventSource), poll transport (setInterval + fetch), connection lifecycle |
| `bw.clientApply()` | ~40 | Message dispatcher for 6 types (replace, append, remove, patch, batch, message) |
| `bw.clientParse()` | ~30 | Relaxed JSON parser (single quotes, trailing commas) |
| Declarative `o.events` | ~30 | Wire event listeners from `o.events` map in `bw.createDOM()` |
| **Total** | **~180** | |

**Test plan**: ~50 tests using mock EventSource and jsdom.

### Phase B: Server-Side (src/bwserve/) — ~250 lines

**Priority**: Implement after Phase A so client can render.

| Item | LOC | Description |
|------|-----|-------------|
| HTTP server (Node `http`) | ~80 | Route handling, static files, SSE endpoint, action POST |
| Shell page generation | ~40 | Inline bitwrench UMD, theme config, clientConnect call |
| SSE stream management | ~40 | Keep-alive, client tracking, cleanup on disconnect |
| BroadcastHandle | ~30 | Proxy all client methods to all connections |
| `app.onAction/onInterval/onDisconnect` | ~30 | Event routing infrastructure |
| BwServeClient enhancements | ~30 | `patchAll()`, `startBuffer()/stopBuffer()`, token buffering |
| **Total** | **~250** | |

**Test plan**: ~40 tests. Most test the client stub's `_sent` array. Integration
tests use actual HTTP server with supertest or direct http.request.

### Phase C: Static Site Generation (CLI Phase 2) — ~300 lines

| Item | LOC | Description |
|------|-----|-------------|
| `src/cli/build.js` | ~120 | Directory scanner, per-file pipeline, asset copier, nav generator |
| `src/cli/dev.js` | ~80 | Build + fs.watch + SSE reload notification |
| `_layout.js` default fallback | ~40 | Responsive layout with nav slot, theme, footer |
| `bitwrench.config.json` loader | ~30 | Merge config file with CLI flags |
| Front matter parser (JSON) | ~30 | Extract `<!--{ ... }-->` metadata from markdown/HTML |
| **Total** | **~300** | |

**Test plan**: ~30 tests with fixture directories (markdown, HTML, JSON, nested,
assets, config variants).

### Phase D: Examples & Documentation — ~200 lines

| Item | Description |
|------|-------------|
| `examples/serve-counter.js` | Minimal counter (30 lines) |
| `examples/serve-dashboard.js` | Stock dashboard (Use Case 4) |
| `examples/serve-chat.js` | Multi-user chat (Use Case 2) |
| `examples/serve-llm-chat.js` | LLM streaming chat (Use Case 3) |
| `examples/serve-llm-ui.js` | LLM-generated dynamic UI (Use Case 6) — the showcase |
| `examples/static-site/` | Sample doc site with _layout.js (Use Case 5) |
| `docs/bwserve.md` update | Full user guide |
| `docs/tutorial-bwserve.md` | Step-by-step bwserve tutorial |
| `docs/tutorial-website.md` | Static site generation tutorial |

### Phase E: CLI Integration — ~50 lines

Activate the existing `bitwrench serve` CLI subcommand and new `build`/`dev`:

```bash
# Static site generation
bitwrench build docs/ -o site/ --theme ocean --nav

# Dev server with live reload (uses SSE — dogfooding our own protocol)
bitwrench dev docs/ --port 8080 --open

# Serve a bwserve app script
bitwrench serve app.js --port 3000
```

---

## Open Design Decisions

### 1. What data gets sent back with actions?

**Proposal**: Three levels of automatic data collection:

| Event descriptor | Data sent |
|-----------------|-----------|
| `{ action: 'click' }` | `{ action: 'click', data: {} }` |
| `{ action: 'search', sendValue: true }` | `{ action: 'search', data: { value: el.value } }` |
| `{ action: 'submit', sendForm: '#form' }` | `{ action: 'submit', data: { name: 'val', email: 'val', ... } }` |

Plus static data merge: `{ action: 'delete', data: { id: 'item-3' } }` from
`o.events: { click: { action: 'delete', data: { id: 'item-3' } } }`.

### 2. Optimistic updates?

**Proposal**: No. Keep it simple. Server is the source of truth. If you want
instant feedback, use `data-bw-action` with a local loading indicator class,
and let the server update it to the real value.

Future extension: `{ action: 'like', optimistic: { type: 'patch', target: 'count', content: '+1' } }` — applied immediately, rolled back if server errors.

### 3. `bw.clientParse()` relaxed JSON — now or later?

**Proposal**: Implement now. It's 30 lines and enables ESP32 from day one.
The fast-path (try JSON.parse first) means zero overhead for strict JSON.

### 4. DOM morphing for replace?

**Proposal**: Defer. Full subtree replace is correct and simple. Morphing
(preserve local state of unchanged nodes) is an optimization for after we
have real usage patterns. If users complain about lost scroll position or
input focus, implement `bw.morph()` then.

### 5. bwserve as separate npm package?

**Proposal**: Keep as sub-export (`bitwrench/bwserve`). Reasons:
- Single repo, single version chain
- Client-side protocol code (clientConnect, clientApply) lives in bitwrench.js
- Server-side code is tiny (~250 lines)
- Users install one package: `npm install bitwrench`
- If bwserve grows beyond ~500 lines, revisit

### 6. Node.js `http` vs Express vs custom?

**Proposal**: Use Node.js built-in `http` module. Zero dependencies.
bwserve is intentionally minimal. Users who want Express middleware
can use `app.handler` as a middleware function:

```javascript
// Use bwserve as Express middleware
var express = require('express');
var eApp = express();
eApp.use(bwserveApp.handler());
eApp.listen(3000);
```

---

## Grammar Summary

### Message types (server → client)

```javascript
{ type: 'replace',    target: '#app',       node: { t, a, c, o } }
{ type: 'append',     target: '#chat',      node: { t, a, c, o } }
{ type: 'remove',     target: '#item-3' }
{ type: 'patch',      target: 'counter',    content: '42', attr: null }
{ type: 'batch',      ops: [ msg, msg, ... ] }
{ type: 'message',    target: 'my-comp',    action: 'refresh', data: {} }
{ type: 'pushUrl',    url: '/products/42',  title: 'Product Detail' }       // (from UC9: server routing)
{ type: 'replaceUrl', url: '/orders/123',   title: 'Order Confirmed' }      // (from UC10: no-back-button nav)
```

### Action payload (client → server)

```javascript
{ clientId: 'uuid', action: 'action-name', data: { key: 'value' } }
```

### Declarative events (in TACO, rendered by client)

```javascript
o: { events: {
  eventType: {
    action: 'name',       // required
    sendValue: true,      // optional: send el.value
    sendForm: '#form',    // optional: send form data
    debounce: 300,        // optional: ms
    throttle: 100,        // optional: ms
    filter: 'Enter',      // optional: key filter
    prevent: true,        // optional: preventDefault
    data: { id: 'x' }    // optional: static data
  }
}}
```

### Client API (browser)

```javascript
var conn = bw.clientConnect(url, opts);
conn.sendAction(action, data);
conn.on(event, handler);
conn.close();
bw.clientApply(msg);
bw.clientParse(str);
```

### Server API (Node.js)

```javascript
var app = bwserve.create(opts);
app.page(path, handler);
app.onAction(name, handler);
app.onInterval(ms, handler);
app.onDisconnect(handler);
app.broadcast.render/patch/append/remove/batch();
app.listen(callback);
app.close();

client.render(target, taco);
client.patch(id, content, attr);
client.append(target, taco);
client.remove(target);
client.batch(ops);
client.message(target, action, data);
client.patchAll(patches);
client.on(action, handler);
client.setCookie(name, value, opts);   // (from Use Case 7: auth)
client.clearCookie(name);              // (from Use Case 7: auth)
client.cookies;                        // read-only, parsed from request
client.sessionToken;                   // shorthand for cookies['bw_session']
client.close();
```

---

## Comparison with Alternatives

### Runtime (server-driven) comparison

| Feature | bwserve | Streamlit | LiveView | htmx |
|---------|---------|-----------|----------|------|
| Language | JS (Node) | Python | Elixir | Any |
| Transport | SSE | WebSocket | WebSocket | AJAX/SSE/WS |
| Payload | JSON (TACO) | Protobuf | HTML diff | HTML fragments |
| Client library | bitwrench (38KB gz) | React (130KB gz) | Phoenix.js (10KB) | htmx (14KB gz) |
| Components | 50+ BCCL | Streamlit widgets | Phoenix components | None (BYO HTML) |
| Theming | `generateTheme()` | Limited | CSS | CSS |
| Embedded device | Yes (polling + relaxed JSON) | No | No | Possible |
| Server-side state | Yes (per-client Map) | Yes (session) | Yes (socket) | No (stateless) |
| Streaming LLM | patch per token | st.write_stream | handle_info | hx-trigger SSE |
| Bundle size budget | 45KB gz total | N/A | N/A | 14KB gz |

### Build-time (static site gen) comparison

| Feature | bitwrench build | Hugo | Jekyll | Astro | Next.js |
|---------|-----------------|------|--------|-------|---------|
| Language | JavaScript | Go | Ruby | JavaScript | JavaScript |
| Layout system | JS function → TACO | Go templates | Liquid | Astro/JSX | React/JSX |
| Dependencies | 0 runtime | 0 (binary) | Ruby gems | Node + many | Node + many |
| Interactive output | Yes (bitwrench injected) | No | No | Yes (islands) | Yes (hydration) |
| Server bridge | Yes (SSE via clientConnect) | No | No | No | Yes (API routes) |
| Theming | `generateTheme()` | TOML config | Theme gems | CSS/Tailwind | CSS/Tailwind |
| Offline/embedded | `--standalone` one-file | No | No | No | No |
| Build speed | Moderate | Fast | Slow | Moderate | Slow |
| Content model | Directories + JSON | Taxonomies, archetypes | Collections, YAML | Content collections | File-based routing |
| Maturity | New | 10+ years | 10+ years | 3 years | 7 years |

### The spectrum — bitwrench's unique position

No other tool covers all ten modes with the same library:

```
          bitwrench   bw.DOM()   bw.component()  bwserve       bw.client    LLM→TACO     bwserve+DB   client SPA   server SPA   e-commerce
          build                                                Connect
Mode:     static gen  client     reactive SPA    server-push   embedded     AI-gen UI    CRUD app     hash router  server route multi-user
Runtime:  build-time  browser    browser          Node+browser  HTTP+browser LLM+bwserve  Node+DB+brw  browser      Node+browser Node+DB+brw
Server:   none        none       none             SSE           poll         SSE          SSE          none         SSE          SSE
JS sent:  0/38KB      38KB       38KB             38KB          38KB(CDN)    38KB         38KB         38KB         38KB         38KB
Routing:  build-time  client     client           server        N/A          N/A          server       client(hash) server(push) server(push)
```

Hugo can only do column 1. Streamlit can only do columns 4-5. React can do
columns 2-3 (with Next.js: 1-3). No single tool covers client-side SPA routing
AND server-driven routing AND real-time multi-user broadcast with the same
component library and theme system. The e-commerce column is the ultimate
stress test: auth, cart state, multi-step forms, role-based rendering,
broadcast inventory updates — all with 38KB of client-side JS.

---

## Next Steps

1. Review this document — validate API grammar against all 10 use cases
2. Resolve open grammar decisions (pushUrl/replaceUrl, sendForm spec, link interception)
3. Implement Phase A (client-side protocol in bitwrench.js, including pushUrl/replaceUrl)
4. Implement Phase B (bwserve server runtime, shell page with link interception + popstate)
5. Implement Phase C (static site generation — `bitwrench build`)
6. Build Use Case 5 example (bitwrench docs site built with bitwrench)
7. Build Use Case 4 example (stock dashboard)
8. Build Use Case 8 example (client-side SPA — no bwserve, pure bitwrench)
9. Build Use Case 3 example (LLM chat)
10. Build Use Case 6 example (LLM-generated UI) — the showcase demo
11. Build Use Case 7 example (CRUD app — SQLite variant as reference)
12. Build Use Case 10 example (e-commerce — multi-user stress test)
13. Release as v2.0.16 (protocol + build) or v2.1.0 (if scope grows)

### Release scoping question

All ten use cases share the same TACO + theme infrastructure but differ in
transport layer. Possible release strategies:

**Option A — Ship everything in v2.0.16:**
- Client protocol (clientConnect, clientApply, declarative events)
- Server runtime (bwserve HTTP + SSE)
- Static site gen (bitwrench build)
- ~730 LOC total, moderate risk

**Option B — Split across releases:**
- v2.0.16: Client protocol + static site gen (no server dependency, lower risk)
- v2.0.17: bwserve server runtime + examples
- Pro: each release is smaller and more testable
- Con: bwserve examples can't ship until v2.0.17

**Option C — v2.1.0 for the whole thing:**
- Signal that this is a significant capability addition (semver minor bump)
- All five use cases ship together
- Pro: coherent story, one announcement
- Con: larger release, longer cycle

Recommend Option B — ship client-side protocol + static build first, server
runtime second. This lets the community validate the TACO-over-wire grammar
with polling (Use Case 1) and build their own docs sites (Use Case 5) before
we add the full bwserve server.
