# Tutorial: Building a Server App with bwserve

This tutorial builds a Streamlit-style dashboard where all state lives on the server. The browser is a thin display — the server pushes UI updates over SSE.

## What you'll build

A real-time analytics dashboard:
- Live counter with increment/decrement buttons
- Auto-updating metrics (requests/sec, memory, uptime)
- Event log with scrolling entries
- All state on the server — refresh the page and you pick up where you left off

## Prerequisites

- Node.js 18+
- `npm install bitwrench` (local or global)

## Step 1: Minimal server

Create `server.js`:

```javascript
import bwserve from 'bitwrench/bwserve';

var app = bwserve.create({ port: 7902, title: 'My Dashboard' });

app.page('/', function(client) {
  client.render('#app', { t: 'h1', c: 'Hello from the server!' });
});

app.listen();
```

Run it:

```bash
node server.js
# Open http://localhost:7902
```

The browser shows "Hello from the server!" — rendered by bitwrench on the client from a TACO object sent over SSE.

## Step 2: Add a counter with buttons

Replace the page handler:

```javascript
app.page('/', function(client) {
  var count = 0;

  // Render initial UI
  client.render('#app', {
    t: 'div', c: [
      { t: 'h1', c: 'Counter' },
      { t: 'div', a: { id: 'count', style: 'font-size: 3rem; text-align: center' }, c: '0' },
      { t: 'div', a: { style: 'text-align: center; margin-top: 1rem' }, c: [
        { t: 'button', a: { 'data-bw-action': 'decrement', class: 'bw-btn bw-btn-secondary' }, c: '-1' },
        { t: 'button', a: { 'data-bw-action': 'increment', class: 'bw-btn bw-btn-primary', style: 'margin-left: 0.5rem' }, c: '+1' },
        { t: 'button', a: { 'data-bw-action': 'reset', class: 'bw-btn', style: 'margin-left: 0.5rem' }, c: 'Reset' }
      ]}
    ]
  });

  // Handle button clicks
  client.on('increment', function() {
    count++;
    client.patch('count', String(count));
  });

  client.on('decrement', function() {
    count--;
    client.patch('count', String(count));
  });

  client.on('reset', function() {
    count = 0;
    client.patch('count', '0');
  });
});
```

Key concepts:
- `data-bw-action="increment"` on the button tells the client to POST `{action: "increment"}` when clicked
- `client.on('increment', fn)` registers a server-side handler for that action
- `client.patch('count', '0')` sends an SSE message that updates the element with `id="count"`

## Step 3: Add live metrics

Add a metrics section that updates every 2 seconds:

```javascript
app.page('/', function(client) {
  var count = 0;
  var startTime = Date.now();
  var requestCount = 0;

  // ... counter UI from Step 2 ...

  // Add metrics section below the counter
  client.append('#app', {
    t: 'div', a: { style: 'margin-top: 2rem' }, c: [
      { t: 'h2', c: 'Live Metrics' },
      { t: 'div', a: { style: 'display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem' }, c: [
        { t: 'div', a: { class: 'bw-card' }, c: [
          { t: 'div', a: { style: 'color: #666; font-size: 0.85rem' }, c: 'Uptime' },
          { t: 'div', a: { id: 'uptime', style: 'font-size: 1.5rem; font-weight: 700' }, c: '0s' }
        ]},
        { t: 'div', a: { class: 'bw-card' }, c: [
          { t: 'div', a: { style: 'color: #666; font-size: 0.85rem' }, c: 'Memory' },
          { t: 'div', a: { id: 'memory', style: 'font-size: 1.5rem; font-weight: 700' }, c: '--' }
        ]},
        { t: 'div', a: { class: 'bw-card' }, c: [
          { t: 'div', a: { style: 'color: #666; font-size: 0.85rem' }, c: 'Requests' },
          { t: 'div', a: { id: 'requests', style: 'font-size: 1.5rem; font-weight: 700' }, c: '0' }
        ]}
      ]}
    ]
  });

  // Push updates every 2 seconds
  var interval = setInterval(function() {
    var uptime = Math.floor((Date.now() - startTime) / 1000);
    var mem = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);

    client.batch(
      { type: 'patch', target: 'uptime', content: uptime + 's' },
      { type: 'patch', target: 'memory', content: mem + ' MB' },
      { type: 'patch', target: 'requests', content: String(requestCount) }
    );
  }, 2000);

  // Track actions as requests
  client.on('increment', function() { count++; requestCount++; client.patch('count', String(count)); });
  client.on('decrement', function() { count--; requestCount++; client.patch('count', String(count)); });
  client.on('reset',     function() { count = 0; requestCount++; client.patch('count', '0'); });

  // Clean up when client disconnects
  client.on('disconnect', function() {
    clearInterval(interval);
  });
});
```

`client.batch()` sends all three patches in a single SSE frame — the browser applies them atomically.

## Step 4: Add an event log

Append a scrolling log that records every action:

```javascript
  // Add log section
  client.append('#app', {
    t: 'div', a: { style: 'margin-top: 2rem' }, c: [
      { t: 'h2', c: 'Event Log' },
      { t: 'div', a: { id: 'log', style: 'max-height: 200px; overflow-y: auto; border: 1px solid #e5e7eb; border-radius: 6px; padding: 0.5rem; font-family: monospace; font-size: 0.85rem' }, c: '' }
    ]
  });

  function logEvent(msg) {
    var time = new Date().toLocaleTimeString();
    client.append('#log', {
      t: 'div', a: { style: 'padding: 2px 0; border-bottom: 1px solid #f3f4f6' },
      c: time + ' — ' + msg
    });
    // Auto-scroll to bottom
    client.call('scrollTo', { target: '#log', behavior: 'smooth' });
  }

  // In each handler:
  client.on('increment', function() {
    count++; requestCount++;
    client.patch('count', String(count));
    logEvent('increment → ' + count);
  });
```

`client.call('scrollTo', ...)` invokes a built-in client-side function. Other built-ins: `focus`, `download`, `clipboard`, `redirect`, `log`.

## Step 5: Add a theme

```javascript
var app = bwserve.create({
  port: 7902,
  title: 'Analytics Dashboard',
  theme: 'ocean'        // Built-in preset: ocean, sunset, forest, slate, etc.
});
```

The auto-generated client page applies the theme automatically — all bitwrench components (buttons, cards, alerts) use the theme colors.

## Step 6: Multi-page app

Add a second page:

```javascript
app.page('/settings', function(client) {
  client.render('#app', {
    t: 'div', c: [
      { t: 'h1', c: 'Settings' },
      { t: 'a', a: { href: '/' }, c: 'Back to Dashboard' },
      { t: 'p', c: 'Configure your dashboard preferences here.' }
    ]
  });
});
```

Each page gets its own handler, its own state, its own client connection. Navigate between them with regular links.

## How it works

```
Browser                              Server (Node.js)
  |                                      |
  |  GET /                               |
  |  <── HTML shell (bitwrench + SSE)    |
  |                                      |
  |  GET /events/:id (SSE)               |
  |  <── {type:'replace', target:'#app', |
  |       node: {t:'div', c:[...]}}      |
  |                                      |
  |  User clicks [+1] button             |
  |  POST /action/:id                    |
  |  {action:'increment', data:{}}  ──>  |
  |                                      |  count++
  |  <── {type:'patch',                  |
  |       target:'count',                |
  |       content:'1'}                   |
  |                                      |
  |  (every 2s)                          |
  |  <── {type:'batch', ops:[            |
  |       {type:'patch',target:'uptime'} |
  |       {type:'patch',target:'memory'} |
  |      ]}                              |
```

## Protocol messages

| Type | Method | What it does |
|------|--------|-------------|
| `replace` | `client.render(target, taco)` | Replace element content with TACO |
| `patch` | `client.patch(id, text, attrs)` | Update text/attributes of element |
| `append` | `client.append(target, taco)` | Add child element |
| `remove` | `client.remove(target)` | Remove element from DOM |
| `batch` | `client.batch(op1, op2, ...)` | Multiple ops in one frame |
| `message` | `client.message(level, text)` | Show notification |
| `call` | `client.call(fn, args)` | Invoke built-in client function |

## Deployment

bwserve apps are regular Node.js servers. Deploy like any other:

```bash
# systemd, PM2, Docker, etc.
node server.js

# Or with environment variables
PORT=3000 node server.js
```

For production, put a reverse proxy (nginx, Caddy) in front for TLS and static asset caching.

## Next steps

- [bwserve Reference](bwserve.md) — full API documentation
- [Component Library](component-library.md) — all 50+ `make*()` components work in bwserve
- [Tutorial: Embedded](tutorial-embedded.md) — same protocol on ESP32
- [examples/client-server/](../examples/client-server/) — runnable example
