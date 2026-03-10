# bwserve — Server-Driven UI

bwserve is a server-side library for pushing UI updates to the browser over Server-Sent Events (SSE). It follows the same pattern as Streamlit or LiveView: application state lives on the server, and the server sends rendering commands to the client.

**Status**: bwserve is under active development. The library stubs and protocol are defined, but the HTTP server and SSE transport are not yet implemented. This page describes the planned API.

## Concept

A bwserve application is a Node.js script that serves HTML pages and pushes UI updates to connected browsers:

```javascript
import bwserve from 'bitwrench/bwserve';

var app = bwserve.create({ port: 7902 });

app.page('/', function(client) {
  // Send initial UI
  client.render('#app', {
    t: 'div', c: [
      { t: 'h1', c: 'Counter: 0' },
      { t: 'button', c: '+1' }
    ]
  });

  // Handle user actions
  client.on('increment', function(data) {
    count++;
    client.patch('counter', String(count));
  });
});

app.listen();
```

The browser receives TACO objects over SSE and renders them with `bw.DOM()`. User interactions send actions back to the server over HTTP POST.

## Protocol

bwserve uses five message types:

| Type | Purpose | Client behavior |
|------|---------|----------------|
| `replace` | Replace element content | `bw.DOM(target, node)` |
| `append` | Add child element | `target.appendChild(bw.createDOM(node))` |
| `remove` | Remove element | `bw.cleanup(target); target.remove()` |
| `patch` | Update text/attributes | `bw.patch(target, content, attr)` |
| `batch` | Multiple operations | Execute each operation in sequence |

## Target use cases

- **Streamlit-style apps**: Data dashboards, ML experiment UIs, admin panels — server computes, browser displays
- **Embedded device dashboards**: ESP32 or Raspberry Pi serves a web UI using lightweight SSE
- **Agent-driven UI**: An AI agent pushes UI updates to a browser session

## Related

- [CLI](cli.md) — The `bitwrench serve` command (dev server built on bwserve)
- [State Management](state-management.md) — Client-side state patterns that complement server-driven updates
