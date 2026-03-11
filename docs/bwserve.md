# bwserve — Server-Driven UI

bwserve is a server-side library for pushing UI updates to the browser over Server-Sent Events (SSE). Application state lives on the server (Node.js), and the server sends TACO rendering commands to the client. User interactions are sent back as actions via HTTP POST.

This is the same pattern as Streamlit (Python), Phoenix LiveView (Elixir), and htmx — but bwserve sends TACO objects, not HTML strings. The browser already has bitwrench loaded, so it renders TACO natively.

**Status**: Implemented in v2.0.16. The library provides a working HTTP/SSE server with zero runtime dependencies (Node.js stdlib only).

## Quick Start

```javascript
import bwserve from 'bitwrench/bwserve';

var app = bwserve.create({ port: 7902 });

var count = 0;

app.page('/', function(client) {
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

## Protocol

bwserve uses 5 message types sent as JSON over SSE:

| Type | Purpose | Server Method | Client Action |
|------|---------|--------------|---------------|
| `replace` | Replace element content | `client.render(target, taco)` | `bw.DOM(target, node)` |
| `patch` | Update text/attributes | `client.patch(id, content, attr?)` | `bw.patch(target, content, attr)` |
| `append` | Add child element | `client.append(target, taco)` | `target.appendChild(bw.createDOM(node))` |
| `remove` | Remove element | `client.remove(target)` | `bw.cleanup(el); el.remove()` |
| `batch` | Multiple operations | `client.batch(ops)` | Execute each op in sequence |

### Message Schemas

```json
// replace — full subtree replacement
{ "type": "replace", "target": "#app", "node": {"t":"div","c":"Hello"} }

// patch — lightweight text/attribute update
{ "type": "patch", "target": "counter", "content": "42" }
{ "type": "patch", "target": "status", "content": "active", "attr": "class" }

// append — add a child
{ "type": "append", "target": "#list", "node": {"t":"li","c":"New item"} }

// remove — delete from DOM
{ "type": "remove", "target": "#old-item" }

// batch — atomic multi-update
{ "type": "batch", "ops": [
    { "type": "patch", "target": "a", "content": "1" },
    { "type": "patch", "target": "b", "content": "2" }
]}
```

### Target Resolution

- `#selector` or `.selector` → CSS query (`querySelector`)
- Bare string → `getElementById`, then `bw._el()` fallback (UUID registry)

### Actions (Client → Server)

User interactions are sent as POST requests:

```
POST /__bw/action/:clientId
Content-Type: application/json

{ "action": "increment", "data": { "inputValue": "hello" } }
```

Wire actions using `data-bw-action` attribute:

```javascript
{ t: 'button', a: { 'data-bw-action': 'save' }, c: 'Save' }
```

The shell page auto-delegates clicks on `[data-bw-action]` elements. Input values from nearby text inputs are automatically included as `inputValue`.

## Server API Reference

### `bwserve.create(opts)`

Create a bwserve application.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `port` | number | 7902 | Listen port |
| `title` | string | 'bwserve' | HTML `<title>` |
| `static` | string | null | Static file directory |
| `theme` | string/object | null | Theme preset or config |
| `injectBitwrench` | boolean | true | Auto-inject bitwrench UMD + CSS |

### `app.page(path, handler)`

Register a page handler. The handler is called with a `BwServeClient` when a browser connects via SSE.

```javascript
app.page('/', function(client) {
  client.render('#app', { t: 'div', c: 'Hello' });
});

app.page('/dashboard', function(client) {
  // different page, different handler
});
```

### `app.listen(callback?)` / `app.close()`

Start and stop the server.

```javascript
await app.listen(function() { console.log('Ready'); });
await app.close();
```

### `app.clientCount`

Number of active SSE connections.

### BwServeClient Methods

| Method | Description |
|--------|-------------|
| `client.render(target, taco)` | Replace target contents with TACO tree |
| `client.patch(id, content, attr?)` | Update text or attribute of element |
| `client.append(target, taco)` | Add TACO as child of target |
| `client.remove(target)` | Remove element from DOM |
| `client.batch(ops)` | Send multiple operations atomically |
| `client.message(target, action, data)` | Dispatch to ComponentHandle |
| `client.on(action, handler)` | Register handler for client actions |
| `client.close()` | Disconnect this client |

## Client API Reference

### `bw.clientConnect(url, opts)`

Connect to a bwserve SSE endpoint. Returns a connection object.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `transport` | string | 'sse' | 'sse' or 'poll' |
| `interval` | number | 2000 | Poll interval (ms), SSE ignores |
| `actionUrl` | string | auto | POST endpoint for actions |
| `reconnect` | boolean | true | Auto-reconnect on disconnect |
| `onStatus` | function | noop | Status callback |

```javascript
var conn = bw.clientConnect('/__bw/events/c1');
conn.sendAction('save', { text: 'hello' });
conn.on('message', function(msg) { /* raw message */ });
conn.close();
```

### `bw.clientApply(msg)`

Apply a single protocol message to the DOM. Called automatically by `clientConnect`, but also usable standalone for testing or custom transports.

```javascript
bw.clientApply({ type: 'replace', target: '#app', node: { t: 'div', c: 'Hi' } });
bw.clientApply({ type: 'patch', target: 'counter', content: '42' });
```

## Transport

bwserve supports multiple transports:

- **SSE (default)**: Uses browser-native `EventSource`. Auto-reconnects. Best for most apps.
- **HTTP Polling**: `setInterval` + `fetch`. Works on any HTTP server including ESP32.
- **WebSocket** (planned): Bidirectional. For high-frequency updates.

### Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `GET /` | GET | Serve page shell HTML |
| `GET /__bw/events/:clientId` | GET | SSE event stream |
| `POST /__bw/action/:clientId` | POST | User action dispatch |
| `GET /__bw/bitwrench.umd.js` | GET | Serve bitwrench JS |
| `GET /__bw/bitwrench.css` | GET | Serve bitwrench CSS |

## Target Use Cases

- **Streamlit-style apps**: Data dashboards, ML experiment UIs, admin panels — server computes, browser displays
- **Embedded device dashboards**: ESP32 or Raspberry Pi serves a web UI using lightweight SSE (client lib is ~40KB)
- **Agent-driven UI**: An AI agent pushes UI updates to a browser session
- **Prototyping**: Server-side Python/Node.js logic with zero frontend build step

## Related

- [Protocol Reference Page](../pages/12-bwserve-protocol.html) — Interactive protocol documentation
- [Sandbox](../pages/bwserve-sandbox.html) — Try bwserve protocol in the browser (no server needed)
- [CLI](cli.md) — The `bitwrench` command for file conversion
- [State Management](state-management.md) — Client-side state patterns that complement server-driven updates
