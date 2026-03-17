# bwcli attach — Remote Debugging REPL for Bitwrench

## What is bwcli attach?

`bwcli attach` is a built-in terminal-based debugger for any bitwrench page. It starts a bwserve server, waits for a browser to connect via a drop-in `<script>` tag, then gives you an interactive REPL where you can:

- **Evaluate JavaScript** in the connected browser and see results
- **Inspect the DOM** with `/tree` — a structured tree view of elements
- **Take screenshots** with `/screenshot` — capture any element to a PNG file
- **Listen to events** with `/listen` — watch clicks, inputs, and other DOM events in real time
- **Mount components** with `/mount` — drop BCCL components into the page
- **Render TACO** with `/render` — push TACO objects directly to any selector
- **Patch elements** with `/patch` — update element text by ID

Think of it as bitwrench's built-in Playwright — a terminal inspector that speaks the bwserve protocol.

## Quick Start

### 1. Start the attach server

```bash
bwcli attach
```

You'll see:

```
bwcli attach v2.0.18
  Server: http://localhost:7902
  Drop-in: <script src="http://localhost:7902/bw/attach.js"></script>

Waiting for connection...
Type /help for commands, /quit to exit.
```

### 2. Connect a browser page

**Option A: Script tag** — Add this to any HTML page:

```html
<script src="http://localhost:7902/bw/attach.js"></script>
```

**Option B: DevTools console** — Paste this into the browser's developer console:

```javascript
var s=document.createElement('script');s.src='http://localhost:7902/bw/attach.js';document.head.appendChild(s);
```

**Option C: Existing bwserve page** — Any bwserve page already has bitwrench loaded. Just add the attach script.

Once the browser connects, you'll see:

```
[connected] client att_k4j8m2x1
bw>
```

### 3. Start debugging

```
bw> document.title
"My Page Title"

bw> bw.$('.bw-card').length
3

bw> /tree #app 2
div#app
  div.main-panel
    h1#title
    ul#list
    div.footer
```

## Installation

`bwcli` is included with bitwrench. Install globally:

```bash
npm install -g bitwrench
```

Or use `npx`:

```bash
npx bwcli attach
```

## CLI Options

```
bwcli attach [options]

Options:
  -p, --port <number>        Server port (default: 7902)
      --allow-screenshot     Enable /screenshot command (loads html2canvas in browser)
  -v, --verbose              Verbose output (show protocol details)
  -h, --help                 Print help
```

### Examples

```bash
# Start on default port
bwcli attach

# Custom port
bwcli attach --port 3000

# Enable screenshots
bwcli attach --allow-screenshot

# Verbose mode (shows protocol messages)
bwcli attach -v
```

## REPL Command Reference

### JavaScript Expressions

Any input that doesn't start with `/` is treated as a JavaScript expression. It is evaluated in the connected browser and the result is printed.

```
bw> document.title
"My Page Title"

bw> window.innerWidth
1440

bw> bw.$('.bw-card').length
3

bw> bw.$('.bw-btn').map(function(b) { return b.textContent; })
["Save", "Cancel", "Delete"]

bw> location.href
"http://localhost:3000/dashboard"
```

**Expression wrapping**: Expressions are automatically wrapped in `return(...)` so the result comes back. Statements (starting with `var`, `let`, `const`, `if`, `for`, `while`, `function`, `try`, `switch`, `throw`, `class`, or `{`) are sent without wrapping.

```
bw> var x = 42
undefined

bw> x
42
```

### `/tree [selector] [depth]`

Shows a DOM tree summary. Defaults: selector = `body`, depth = `3`.

```
bw> /tree
body
  div#app
    div.main-panel
      h1#title
      ul#list
      div.footer

bw> /tree #app 2
div#app
  div.main-panel
    h1#title
    ul#list
    div.footer

bw> /tree .bw-card 1
div.bw-card
  div.bw-card-header
  div.bw-card-body
  div.bw-card-footer
```

The tree shows tag name, id, and CSS classes for each element. Child elements are indented. Limited to 20 children per level to prevent flooding.

### `/screenshot [selector] [filename]`

Captures a screenshot of the specified element (or `body`). Saves as PNG. **Requires `--allow-screenshot` flag.**

```
bw> /screenshot
Capturing body ...
Saved: screenshot-1710595200000.png (1440x900, 245832 bytes)

bw> /screenshot body page.png
Capturing body ...
Saved: page.png (1440x900, 245832 bytes)

bw> /screenshot .bw-card card.png
Capturing .bw-card ...
Saved: card.png (400x300, 48291 bytes)
```

On the first screenshot, html2canvas (vendored, ~194KB) is lazy-loaded in the browser. Subsequent screenshots are fast.

### `/mount <selector> <component> [json-props]`

Mounts a BCCL component at the specified selector. The component name is camelCased automatically (e.g., `card` → `makeCard`).

```
bw> /mount #app card {"title":"Hello","content":"World"}
Mounted card at #app

bw> /mount #sidebar accordion {"items":[{"title":"Section 1","content":"Body 1"}]}
Mounted accordion at #sidebar

bw> /mount #main statCard {"value":"42","label":"Users","variant":"primary"}
Mounted statCard at #main
```

### `/render <selector> <taco-json>`

Renders a TACO object at the specified selector. Use for quick UI injection.

```
bw> /render #app {"t":"h1","c":"Hello from REPL"}
Rendered at #app

bw> /render #app {"t":"div","a":{"class":"bw-alert bw-alert-info"},"c":"Injected alert"}
Rendered at #app
```

### `/patch <id> <content>`

Updates the text content of an element by ID. This is the simplest way to change what's displayed.

```
bw> /patch counter 42
Patched counter

bw> /patch status Online
Patched status

bw> /patch greeting Hello World
Patched greeting
```

### `/listen <selector> <event>`

Starts listening for DOM events matching a CSS selector. Events are printed inline in the REPL without disrupting the prompt.

```
bw> /listen button click
Listening for click on button

[event] click on button → BUTTON#save-btn "Save"
[event] click on button → BUTTON#cancel-btn "Cancel"

bw> /listen .bw-card mouseover
Listening for mouseover on .bw-card

[event] mouseover on .bw-card → DIV "Card Title"

bw> /listen input change
Listening for change on input

[event] change on input → INPUT#email
```

Uses a delegated event listener on `document` with capture phase. Events that match the selector POST back to the server via `/bw/return/event/:clientId`.

Adding the same listener twice (same selector + event) is a no-op.

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

bw> /exec document.body.style.background = 'lightyellow'
Executed.
```

### `/clients`

Lists all connected clients. The most recently connected client is marked as active — all commands target this client.

```
bw> /clients
  att_k4j8m2x1 (active)
  att_m9n3p5q7
```

### `/help`, `/h`

Show the command reference.

### `/quit`, `/q`

Exit the REPL and stop the server.

## How It Works

### Architecture

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

1. **Server starts**: `bwcli attach` creates a bwserve instance on the specified port (default 7902)
2. **Drop-in script**: The browser loads `/bw/attach.js` which:
   - Checks if bitwrench is already loaded; if not, injects the UMD bundle from `/bw/lib/bitwrench.umd.js`
   - Evaluates the bwclient.js source inline (including builtins for query, tree, listen, screenshot)
   - Calls `bw._bwClient.attach()` to connect via SSE
3. **SSE connection**: The browser opens `GET /bw/events/:clientId` — the server registers the client
4. **REPL interaction**: You type JS or slash commands → the server sends protocol messages via SSE
5. **Response**: The client evaluates the code and POSTs the result back via `/bw/return/query/:clientId`
6. **Events**: When `/listen` is active, DOM events POST back via `/bw/return/event/:clientId`

### Protocol Messages Used

| REPL Action | Protocol | Route |
|-------------|----------|-------|
| JS expression | `call _bw_query` | `/bw/return/query/:id` |
| `/tree` | `call _bw_tree` | `/bw/return/query/:id` |
| `/screenshot` | `call _bw_screenshot` | `/bw/return/screenshot/:id` |
| `/mount` | `call _bw_mount` | `/bw/return/mount/:id` |
| `/render` | SSE `replace` | — (one-way) |
| `/patch` | SSE `patch` | — (one-way) |
| `/listen` | `call _bw_listen` | `/bw/return/event/:id` |
| `/exec` | SSE `exec` | — (one-way) |

### Client Builtins

Three builtins are registered specifically for attach mode:

| Builtin | Purpose |
|---------|---------|
| `_bw_tree` | Walk the DOM from a selector to a configurable depth, return `{tag, id, cls, children}` |
| `_bw_listen` | Add a delegated event listener that POSTs event data back to the server |
| `_bw_unlisten` | Remove a previously added listener |

These are registered automatically when `bw._bwClient.attach()` is called.

## Cross-Origin Usage

The attach script and all POST-back endpoints include `Access-Control-Allow-Origin: *` headers, enabling cross-origin debugging. To attach to a page on a different origin:

```html
<script src="http://debugger-host:7902/bw/attach.js"></script>
```

OPTIONS preflight requests on `/bw/return/*` are handled with a 204 response and appropriate CORS headers.

## Security

- **allowExec is always true**: Attach mode is a debugging tool. The whole point is to execute arbitrary code on the client.
- **Local-only by default**: The server binds to `localhost`. Do not expose to a network without understanding the implications.
- **CORS headers**: All endpoints include `Access-Control-Allow-Origin: *` to support cross-origin attach. This is intentional for debugging workflows.
- **No authentication**: Anyone who can reach the port can attach. Use firewall rules if needed.

**Do not run `bwcli attach` on a production server or expose it to the public internet.** It provides full JavaScript execution in the browser and should only be used for local development and debugging.

## Use Cases

- **Debugging bitwrench pages**: Inspect the DOM, check component state, test TACO rendering
- **Rapid prototyping**: Mount components and render TACO from the terminal without editing source files
- **Event debugging**: Listen to click, input, submit, and other DOM events in real time
- **Visual regression**: Take screenshots of specific components for comparison
- **Remote inspection**: Attach to a page running on another machine (within your local network)
- **AI-driven UI**: Script the REPL from another process for automated UI testing

## Multiple Clients

When multiple browsers connect, the most recently connected client becomes the active target. All REPL commands are sent to the active client. Use `/clients` to see the list. When the active client disconnects, the next available client becomes active.

## Related

- [bwserve Documentation](bwserve.md) — Full bwserve protocol reference
- [CLI Documentation](cli.md) — File conversion and `bwcli serve`
- [Protocol Reference Page](../pages/12-bwserve-protocol.html) — Interactive protocol reference
- [Design Document](../dev/bw-attach-design.md) — Architecture and implementation details
