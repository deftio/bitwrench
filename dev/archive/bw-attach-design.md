# bwcli attach — Drop-in Remote Debugging for Bitwrench

## Status

**Implemented** in v2.0.18.

## Overview

`bwcli attach` provides a built-in remote debugging REPL for any bitwrench page. It is bitwrench's answer to Playwright/Chrome DevTools — a terminal-based inspector that speaks the bwserve protocol.

**Three ways to connect:**
1. Add `<script src="http://localhost:7902/bw/attach.js"></script>` to any page
2. Paste the snippet into devtools console
3. Use an existing bwserve page that loads bitwrench

Once connected, you get a REPL where you can evaluate JS, inspect the DOM tree, take screenshots, listen to events, and mount components — all from the terminal.

## Architecture

```
┌──────────────────────────────┐     ┌──────────────────────┐
│  bwcli attach                │     │  Target Browser Page  │
│                              │     │                       │
│  readline REPL ──────────────┼─SSE─┤  bwclient.attach()   │
│  /screenshot, /tree, etc.    │     │  _bw_query, _bw_tree │
│  JS expressions → query()    │◄POST┤  respond()            │
│                              │     │                       │
│  bwserve (port 7902)         │     │  <script src=         │
│  /bw/events/:id  (SSE out)   │     │   .../bw/attach.js>  │
│  /bw/return/:r/:id (POST in) │     │                       │
└──────────────────────────────┘     └──────────────────────┘
```

### Data Flow

1. **Server starts**: `bwcli attach` creates a bwserve instance on port 7902 (configurable)
2. **Drop-in script**: The page loads `/bw/attach.js` which:
   - Checks if bitwrench is already loaded; if not, injects the UMD bundle
   - Evaluates bwclient.js source inline
   - Calls `bw._bwClient.attach()` to connect via SSE
3. **SSE connection**: The browser opens `GET /bw/events/:clientId` — server registers the client
4. **REPL interaction**: User types JS or slash commands → server sends protocol messages
5. **Response**: Client evaluates and POSTs result back via `/bw/return/query/:clientId`
6. **Events**: When `/listen` is active, DOM events POST back via `/bw/return/event/:clientId`

## Drop-in Script (`/bw/attach.js`)

The attach script is a self-contained IIFE served by bwserve. It:

1. Checks `window.bw` — if bitwrench is already loaded, skips injection
2. If not, creates a `<script>` element pointing to `/bw/lib/bitwrench.umd.js`
3. Once bitwrench is available, evaluates the bwclient source (inlined at serve-time)
4. Calls `bw._bwClient.attach(origin, { allowExec: true })`
5. The SSE connection is established with a random client ID (`att_...`)

### Cross-Origin Usage

For attaching to a page on a different origin:

```html
<script src="http://debugger-host:7902/bw/attach.js"></script>
```

The attach script and all `/bw/return/` endpoints include `Access-Control-Allow-Origin: *` headers. The SSE endpoint (`/bw/events/`) also has CORS headers. OPTIONS preflight requests on `/bw/return/` are handled with a 204 response.

## REPL Commands

### JS Expressions

Any input that doesn't start with `/` is treated as a JavaScript expression. It is wrapped in `return(...)` and sent via `client.query()` to the browser:

```
bw> document.title
"My Page Title"

bw> bw.$('.bw-card').length
3

bw> window.innerWidth
1440
```

Statements (starting with `var`, `let`, `const`, `if`, `for`, `while`, `function`, `try`, `switch`, `throw`, `class`, or `{`) are sent without wrapping.

### `/tree [selector] [depth]`

Shows a DOM tree summary. Default selector is `body`, default depth is 3.

```
bw> /tree #app 2
div#app
  div.main-panel
    h1#title
    ul#list
    div.footer
```

Uses the `_bw_tree` builtin which walks the DOM and returns tag, id, class, and children. Limited to 20 children per level to prevent flooding.

### `/screenshot [selector] [filename]`

Captures a screenshot of the specified element (or `body`). Requires `--allow-screenshot` flag.

```
bw> /screenshot body page.png
Capturing body ...
Saved: page.png (1440x900, 245832 bytes)

bw> /screenshot .bw-card card.png
Capturing .bw-card ...
Saved: card.png (400x300, 48291 bytes)
```

Uses html2canvas (vendored, lazy-loaded on first call).

### `/mount <selector> <component> [json-props]`

Mounts a BCCL component on the client.

```
bw> /mount #app card {"title":"Hello","content":"World"}
Mounted card at #app

bw> /mount #sidebar accordion {"items":[{"title":"Section 1","content":"Body 1"}]}
Mounted accordion at #sidebar
```

### `/render <selector> <taco-json>`

Renders a TACO object at the specified selector.

```
bw> /render #app {"t":"h1","c":"Hello from REPL"}
Rendered at #app
```

### `/patch <id> <content>`

Updates the text content of an element by ID.

```
bw> /patch counter 42
Patched counter
```

### `/listen <selector> <event>`

Starts listening for DOM events matching a CSS selector. Events are printed inline in the REPL without disrupting the prompt.

```
bw> /listen button click
Listening for click on button

[event] click on button → BUTTON#save-btn "Save"
[event] click on button → BUTTON#cancel-btn "Cancel"
```

Uses the `_bw_listen` builtin which adds a delegated event listener on `document` with capture phase. Events POST back via `/bw/return/event/:clientId`.

### `/unlisten <selector> <event>`

Removes a previously added event listener.

```
bw> /unlisten button click
Stopped listening for click on button
```

### `/exec <code>`

Executes JavaScript on the client without capturing the return value. Fire-and-forget.

```
bw> /exec alert('Hello from the REPL!')
Executed.
```

### `/clients`

Lists all connected clients.

```
bw> /clients
  att_k4j8m2x1 (active)
  att_m9n3p5q7
```

### `/help`, `/quit`

Show help or exit.

## New bwclient Builtins

Three new builtins are registered in `bwclient.js`:

### `_bw_tree`

Returns a DOM tree summary as JSON. Walks the DOM starting from a CSS selector, up to a configurable depth.

```javascript
// Called via:
client.call('_bw_tree', {
  selector: 'body',  // CSS selector (default: 'body')
  depth: 3,          // max depth (default: 3)
  requestId: '...'   // for pending promise resolution
});

// Returns via /bw/return/query/:clientId:
{
  tag: 'div',
  id: 'app',
  cls: 'main-panel',
  children: [
    { tag: 'h1', id: 'title' },
    { tag: 'ul', id: 'list', children: [...] }
  ]
}
```

### `_bw_listen`

Adds a delegated DOM event listener that posts event data back to the server.

```javascript
client.call('_bw_listen', {
  selector: 'button',  // CSS selector for delegation
  event: 'click'       // DOM event name
});
```

Events are posted to `/bw/return/event/:clientId` with payload:
```json
{
  "event": "click",
  "selector": "button",
  "tagName": "BUTTON",
  "id": "save-btn",
  "text": "Save"
}
```

Listeners are stored in `bw._bwClient._listeners` keyed by `selector:::event`. Adding the same listener twice is a no-op.

### `_bw_unlisten`

Removes a previously added listener.

```javascript
client.call('_bw_unlisten', {
  selector: 'button',
  event: 'click'
});
```

## Security Model

- **allowExec is always true**: Attach mode is a debugging tool. The whole point is to execute arbitrary code on the client.
- **Local-only by default**: The server binds to `localhost`. Do not expose to a network without understanding the implications.
- **CORS headers**: All endpoints include `Access-Control-Allow-Origin: *` to support cross-origin attach. This is intentional for debugging workflows.
- **No authentication**: There is no auth mechanism. Anyone who can reach the port can attach. Use firewall rules if needed.

### Warning

Do not run `bwcli attach` on a production server or expose it to the public internet. It provides full JavaScript execution in the browser and should only be used for local development and debugging.

## Protocol Extensions

### Event Route

The existing `/bw/return/<route>/<clientId>` handler now recognizes `event` as a route in addition to `action`, `query`, `mount`, and `screenshot`. Events dispatch to the `_bw_event` handler on the client object.

### CORS Preflight

`OPTIONS` requests on `/bw/return/*` now return 204 with appropriate CORS headers, enabling cross-origin POST-backs from the attach script.

## Files

| File | Action | Description |
|------|--------|-------------|
| `src/bwserve/attach.js` | NEW | Generates the self-contained attach script |
| `src/bwserve/index.js` | MODIFIED | Added `/bw/attach.js` route, CORS preflight, event dispatch |
| `src/bwserve/bwclient.js` | MODIFIED | Added `_bw_tree`, `_bw_listen`, `_bw_unlisten` builtins |
| `src/cli/attach.js` | NEW | Interactive REPL with slash commands |
| `src/cli/index.js` | MODIFIED | Added `attach` subcommand dispatch |
| `test/bitwrench_test_attach.js` | NEW | 39 tests for attach functionality |

## Future Work

- **Multiple client targeting**: Currently the most-recent client is active. Could add `/switch <clientId>` command.
- **Session recording**: Record and replay REPL sessions for regression testing.
- **WebSocket transport**: Lower latency alternative to SSE for high-frequency event listening.
- **Rate limiting**: For `/listen` on high-frequency events (mousemove, scroll), add client-side throttling.
- **Inspect mode**: `/inspect <selector>` to show computed styles, bounding box, event listeners.
