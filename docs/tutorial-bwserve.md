# Tutorial: Building a Server App with bwserve

This tutorial builds a Streamlit-style dashboard where all state lives on the server. The browser is a thin display — the server pushes UI updates over SSE.

## What you'll build

A real-time analytics dashboard:
- Live counter with increment/decrement buttons
- Auto-updating metrics (requests/sec, memory, uptime)
- Event log with scrolling entries
- All state on the server -- state held in module scope survives a page refresh
  (a `var` declared inside `app.page()` does not: the handler re-runs on every
  connection, including reconnects)

## Prerequisites

- Node.js 18+
- `npm install bitwrench` (local or global)

## Step 1: Minimal server

Create `server.js`:

```javascript
import bwserve from 'bitwrench/bwserve';

var app = bwserve.create({ port: 7902, title: 'My Dashboard' });

app.page('/', function(client) {
  client.mount('#app', { t: 'h1', c: 'Hello from the server!' });
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

First, add the shared setup to the top of `server.js`:

```javascript
import bw from 'bitwrench';

// One theme config, used twice: the server reads palette values out of it to
// style the TACOs it sends, and bwserve hands the same object to
// bw.loadStyles() on the generated page (Step 5).
var theme   = { primary: '#0b7285', secondary: '#495057' };
var styles  = bw.makeStyles(theme);
var palette = styles.palette;
var layout  = styles.layout;

// Module scope, deliberately. app.page()'s handler runs again on every
// connection, so a `var count = 0` inside it resets on every refresh.
var count = 0;
```

Then replace the page handler:

```javascript
app.page('/', function(client) {
  // Render initial UI
  client.mount('#app', {
    t: 'div', c: [
      { t: 'h1', c: 'Counter' },
      { t: 'div', a: { id: 'count', style: bw.s({ fontSize: '3rem', textAlign: 'center' }) }, c: String(count) },
      { t: 'div', a: { style: bw.s({ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginTop: '1rem' }) }, c: [
        bw.makeButton({ action: 'decrement', text: '-1',    variant: 'secondary' }),
        bw.makeButton({ action: 'increment', text: '+1',    variant: 'primary' }),
        bw.makeButton({ action: 'reset',     text: 'Reset', variant: 'light' })
      ]}
    ]
  });

  // Handle button clicks
  client.on('increment', function() {
    count++;
    client.patch('count', { text: String(count) });
  });

  client.on('decrement', function() {
    count--;
    client.patch('count', { text: String(count) });
  });

  client.on('reset', function() {
    count = 0;
    client.patch('count', { text: '0' });
  });
});
```

Key concepts:
- `bw.makeButton({ action: 'increment' })` emits `class="bw_bccl_btn bw_primary bw_act_increment"` -- the `bw_act_*` class is what tells the client to POST the action when the button is clicked. You never hand-write that class string
- `client.on('increment', fn)` registers a server-side handler for that action
- `client.patch('count', { text: '0' })` sends an SSE message that updates the element with `id="count"` using a discriminated fields object
- `bw.s()` merges style objects, so the inline styles are data derived from `palette`/`layout` rather than hand-typed CSS text

## Step 3: Add live metrics

Add a metrics section that updates every 2 seconds:

```javascript
// Module scope, alongside `count` from Step 2
var startTime = Date.now();
var requestCount = 0;

// Two style objects, reused across the three cards
var metricLabel = bw.s({ color: palette.secondary.base, fontSize: '0.85rem' });
var metricValue = bw.s({ fontSize: '1.5rem', fontWeight: 700 });

app.page('/', function(client) {
  // ... counter UI from Step 2 ...

  // Add metrics section below the counter
  client.append('#app', {
    t: 'div', a: { style: bw.s({ marginTop: '2rem' }) }, c: [
      { t: 'h2', c: 'Live Metrics' },
      { t: 'div', a: { style: bw.s({ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }) }, c: [
        { t: 'div', a: { class: 'bw_bccl_card' }, c: [
          { t: 'div', a: { style: metricLabel }, c: 'Uptime' },
          { t: 'div', a: { id: 'uptime', style: metricValue }, c: '0s' }
        ]},
        { t: 'div', a: { class: 'bw_bccl_card' }, c: [
          { t: 'div', a: { style: metricLabel }, c: 'Memory' },
          { t: 'div', a: { id: 'memory', style: metricValue }, c: '--' }
        ]},
        { t: 'div', a: { class: 'bw_bccl_card' }, c: [
          { t: 'div', a: { style: metricLabel }, c: 'Requests' },
          { t: 'div', a: { id: 'requests', style: metricValue }, c: '0' }
        ]}
      ]}
    ]
  });

  // Push updates every 2 seconds.
  // batch() takes ONE array of messages, and the client version-checks every
  // op it unpacks -- so each op carries its own `v: 1`. The envelope's stamp
  // does not cover them, and an unstamped op is dropped without a word.
  var interval = setInterval(function() {
    // There is no 'disconnect' action: nothing on the wire dispatches one.
    // The server sets client._closed when the SSE socket goes away, so poll
    // it here, or the interval outlives every reconnect.
    if (client._closed) { clearInterval(interval); return; }

    var uptime = Math.floor((Date.now() - startTime) / 1000);
    var mem = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);

    client.batch([
      { v: 1, type: 'patch', ref: 'uptime',   text: uptime + 's' },
      { v: 1, type: 'patch', ref: 'memory',   text: mem + ' MB' },
      { v: 1, type: 'patch', ref: 'requests', text: String(requestCount) }
    ]);
  }, 2000);

  // Track actions as requests
  client.on('increment', function() { count++; requestCount++; client.patch('count', { text: String(count) }); });
  client.on('decrement', function() { count--; requestCount++; client.patch('count', { text: String(count) }); });
  client.on('reset',     function() { count = 0; requestCount++; client.patch('count', { text: '0' }); });
});
```

`client.batch()` sends all three patches in a single SSE frame, which saves
round trips. It is not a transaction: the client applies the ops in order with
a `try`/`catch` around each one and rolls nothing back, so a batch whose third
op fails leaves the first two applied.

## Step 4: Add an event log

Append a scrolling log that records every action:

```javascript
  // Add log section
  client.append('#app', {
    t: 'div', a: { style: bw.s({ marginTop: '2rem' }) }, c: [
      { t: 'h2', c: 'Event Log' },
      { t: 'div', a: { id: 'log', style: bw.s({
        maxHeight: '200px',
        overflowY: 'auto',
        border: '1px solid ' + palette.secondary.border,
        borderRadius: layout.radius.card,
        padding: '0.5rem',
        fontFamily: 'monospace',
        fontSize: '0.85rem'
      }) }, c: '' }
    ]
  });

  var logRow = bw.s({ padding: '2px 0', borderBottom: '1px solid ' + palette.surfaceAlt });

  function logEvent(msg) {
    var time = new Date().toLocaleTimeString();
    client.append('#log', { t: 'div', a: { style: logRow }, c: time + '  ' + msg });
    // Auto-scroll to bottom. scrollTo takes a selector and nothing else:
    // it pins that element to its own bottom. There is no options argument.
    client.call('scrollTo', '#log');
  }

  // In each handler:
  client.on('increment', function() {
    count++; requestCount++;
    client.patch('count', { text: String(count) });
    logEvent('increment => ' + count);
  });
```

`client.call('scrollTo', ...)` invokes a built-in client-side function. Other built-ins: `focus`, `download`, `clipboard`, `redirect`, `log`.

## Step 5: Add a theme

Pass the config object from Step 2 straight through:

```javascript
var app = bwserve.create({
  port: 7902,
  title: 'Analytics Dashboard',
  theme: theme          // the seed-color config from Step 2
});
```

The auto-generated client page calls `bw.loadStyles()` with that config, so
every bitwrench component (buttons, cards, alerts) picks up the same palette
the server used to style its TACOs.

> Named presets are not wired into bwserve. `theme` accepts a config object or
> a string, but the shell ignores the string's value and loads one fixed teal
> pair for any name you pass, so `theme: 'ocean'` and `theme: 'sunset'` render
> identically. Pass the object.

## Step 6: Multi-page app

Add a second page:

```javascript
app.page('/settings', function(client) {
  client.mount('#app', {
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
  |  <-- HTML shell (bitwrench + SSE)    |
  |                                      |
  |  GET /bw/events/<clientId>  (SSE)    |
  |  <-- {v:1, type:'hello'}             |
  |  <-- {v:1, type:'mount',             |
  |       ref:'#app',                    |
  |       taco:{t:'div', c:[...]}}       |
  |                                      |
  |  User clicks [+1] button             |
  |  POST /bw/return/action/<clientId>   |
  |  {requestId:null, route:'action',    |
  |   result:{action:'increment',        |
  |           data:{}},                  |
  |   error:null}                  -->   |
  |                                      |  count++
  |  <-- {v:1, type:'patch',             |
  |       ref:'count', text:'1'}         |
  |                                      |
  |  (every 2s)                          |
  |  <-- {v:1, type:'batch', ops:[       |
  |       {v:1,type:'patch',ref:'uptime'}|
  |       {v:1,type:'patch',ref:'memory'}|
  |      ]}                              |
```

Every POST from the browser goes to one return route, `/bw/return/<route>/<clientId>`,
with the same four-field body (`requestId`, `route`, `result`, `error`). A
button click is just `route: 'action'`; a screenshot or a `query` answer comes
back on the same shape with its `requestId` filled in.

## Protocol messages

The subset a page handler reaches for, and the `BwServeClient` method for each:

| Type | Method | What it does |
|------|--------|-------------|
| `mount` | `client.mount(ref, taco)` | Mount TACO tree into element |
| `patch` | `client.patch(ref, fields)` | Update element via discriminated fields (`text`, `attrs`, `content`) |
| `append` | `client.append(ref, taco)` | Add child element |
| `remove` | `client.remove(ref)` | Remove element from DOM |
| `batch` | `client.batch([op1, op2])` | Several ops in one frame -- one array, not varargs |
| `message` | `client.message(ref, action, data)` | Dispatch to `el.bw[action](data)` on a component handle |
| `call` | `client.call(name, ...args)` | Invoke built-in client-side function |
| `listen` | `client.listen(topic, handler)` | Forward a client-side pub/sub topic back to the server |

Five more types ride the same wire without a `BwServeClient` method of their
own: `hello`, which the server sends first on every connection, and `replace` /
`refresh` / `update` / `unlisten`, which you send through `app.broadcast()` or
inside a `batch`. That is thirteen in all, and `bw.apply()` on the client
handles every one -- see [bwserve.md](bwserve.md) for the full schema list.

`client._send()` stamps `v: 1` on each message it writes, so every method above
is covered. It does not reach inside a `batch`, so hand-built ops need their
own `v: 1`.

### Screenshots

The server can capture what the browser is displaying:

```javascript
import { writeFileSync } from 'fs';

// Enable in server options. Without allowScreenshot the call rejects.
var app = bwserve.create({ port: 7902, allowScreenshot: true });

app.page('/', function(client) {
  client.mount('#app', myDashboard);

  client.on('capture', async function() {
    // Capture the full page as PNG
    var img = await client.screenshot();
    writeFileSync('screenshot.png', img.data);

    // Capture a specific element, resized to max 800px wide
    var thumb = await client.screenshot('#chart', {
      maxWidth: 800,
      format: 'jpeg',
      quality: 0.8
    });
  });
});
```

Uses html2canvas (vendored, lazy-loaded). See [screenshot example](../examples/client-server/screenshot-server.js).

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
- [Component Library](component-library.md) — all `make*()` components work in bwserve
- [Tutorial: Embedded](tutorial-embedded.md) — same protocol on ESP32
- [examples/client-server/](../examples/client-server/) — runnable example
