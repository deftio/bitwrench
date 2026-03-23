# App Patterns

Five canonical layouts for bitwrench apps. Each section shows when to use it, directory structure, a code skeleton, and state flow.

---

## Pattern 1: Single-Page Dashboard

One page, multiple widgets, shared data. Stat cards, tables, and charts react to the same store. Good for monitoring dashboards and admin panels.

```
my-dashboard/
  index.html          <- loads bitwrench, includes app.js
  app.js              <- store, widgets, render functions
```

```javascript
// app.js
bw.loadStyles({ primary: '#1e40af', secondary: '#059669' });

// Store: plain object + scoped pub/sub
var store = { users: 128, revenue: 48200, orders: [] };

function updateStore(key, value) {
  store[key] = value;
  bw.pub('store:' + key, value);
}

// Widgets -- each subscribes to its own data slice
function renderStats() {
  bw.DOM('#stats', { t: 'div', c: [
    bw.makeStatCard({ label: 'Users', value: store.users }),
    bw.makeStatCard({ label: 'Revenue', value: '$' + store.revenue })
  ]});
}

function renderTable() {
  bw.DOM('#orders', bw.makeTable({ data: store.orders, sortable: true }));
}

// Layout
bw.DOM('#app', { t: 'div', c: [
  bw.makeNavbar({ brand: 'Dashboard' }),
  { t: 'div', a: { id: 'stats' } },
  { t: 'div', a: { id: 'orders' } }
]});

// Wire up
bw.sub('store:users', renderStats);
bw.sub('store:revenue', renderStats);
bw.sub('store:orders', renderTable);
renderStats();
renderTable();
```

**State flow:** `store` is a plain object. `updateStore()` sets values and publishes scoped topics (`store:users`, `store:orders`). Each widget subscribes only to its own topics and re-renders itself. Widgets never read each other -- they read from the shared store. See [state-management.md](state-management.md).

---

## Pattern 2: Multi-Page SPA

Client-side navigation between views with a persistent nav/footer and shared state. URL changes without full page reloads.

```
my-spa/
  index.html
  app.js              <- router, nav, footer
  views/
    home.js, users.js, settings.js
  store.js             <- shared state
```

```javascript
// store.js
var store = { user: { name: 'Alice' }, items: [] };
function updateStore(key, value) {
  store[key] = value;
  bw.pub('store:' + key, value);
}

// views/home.js
function homeView() {
  return { t: 'div', c: [
    bw.makeHero({ title: 'Welcome, ' + store.user.name }),
    bw.makeCard({ title: 'Recent', content: store.items.length + ' items' })
  ]};
}

// views/users.js
function usersView(params) {
  if (params.id) return bw.makeCard({ title: 'User ' + params.id });
  return bw.makeTable({ data: store.items, sortable: true });
}

// app.js
bw.loadStyles({ primary: '#2563eb', secondary: '#7c3aed' });

bw.DOM('#app', { t: 'div', c: [
  bw.makeNavbar({ brand: 'My App', items: [
    { text: 'Home', href: '#/' },
    { text: 'Users', href: '#/users' },
    { text: 'Settings', href: '#/settings' }
  ]}),
  { t: 'div', a: { id: 'view' } },
  { t: 'footer', a: { style: 'padding:1rem; text-align:center' }, c: '(c) 2026' }
]});

bw.router({
  target: '#view',
  routes: {
    '/':          function() { return homeView(); },
    '/users':     function() { return usersView({}); },
    '/users/:id': function(params) { return usersView(params); },
    '/settings':  function() { return settingsView(); },
    '*':          function() { return { t: 'h1', c: '404 Not Found' }; }
  },
  after: function(to) { bw.pub('nav:changed', { path: to }); }
});
```

**State flow:** `bw.router()` listens for hash changes. Each route handler returns a TACO mounted into `#view`. Nav and footer stay in the DOM -- only `#view` swaps. Views subscribe via `bw.sub('store:key', fn, el)` -- the `el` param auto-unsubscribes when the view unmounts. See [routing.md](routing.md), [state-management.md](state-management.md#shared-state-across-views).

---

## Pattern 3: bwserve Server-Driven App

Server owns all state and pushes UI over SSE. The client is thin -- it renders whatever the server sends. Good for internal tools, LLM-driven UIs, and apps with no client-side logic. No client files needed -- bwserve auto-generates the HTML shell.

```
my-bwserve-app/
  server.js            <- Node.js server (the only file)
```

```javascript
// server.js
import bwserve from 'bitwrench/bwserve';

var app = bwserve.create({ port: 7902 });
var count = 0;

app.page('/', function(client) {
  client.render('#app', {
    t: 'div', c: [
      { t: 'h1', c: 'Server Counter' },
      { t: 'span', a: { id: 'val' }, c: '0' },
      { t: 'button', a: { 'data-bw-action': 'inc' }, c: '+1' }
    ]
  });

  client.on('inc', function() {
    count++;
    client.patch('val', String(count));
  });
});

app.listen();
```

**State flow:** Browser requests `/` => server returns HTML shell. Shell opens SSE => server sends TACO via `client.render()`. User clicks `data-bw-action` => browser POSTs to server. Server calls `client.patch()` => browser updates. All state stays on the server. See [bwserve.md](bwserve.md).

---

## Pattern 4: Embedded / IoT Dashboard

A microcontroller (ESP32, Raspberry Pi) serves a static HTML page and pushes sensor data as JSON. Minimal footprint, works on constrained hardware.

```
firmware/
  main.ino             <- serves HTML + sensor data
  data/
    index.html         <- dashboard page
    bitwrench.umd.min.js
```

```javascript
// Inside data/index.html <script> block
bw.loadStyles({ primary: '#0d9488' });

// Static layout -- rendered once
bw.DOM('#app', { t: 'div', c: [
  { t: 'h1', c: 'Sensor Dashboard' },
  { t: 'div', a: { id: 'readings' } },
  bw.makeButton({ text: 'LED On', onclick: function() {
    fetch('/api/command', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cmd: 'led', val: 'on' })
    });
  }})
]});

// Poll the device -- re-render readings section each cycle
setInterval(function() {
  fetch('/api/sensors').then(function(r) { return r.json(); })
    .then(function(data) {
      bw.DOM('#readings', { t: 'div', c: [
        bw.makeStatCard({ label: 'Temperature', value: data.temp + ' C' }),
        bw.makeStatCard({ label: 'Humidity', value: data.humidity + ' %' })
      ]});
    });
}, 2000);
```

**State flow:** Device serves files from flash (SPIFFS/LittleFS). Page renders a static layout, then a `setInterval` polls `/api/sensors`. On each response, `bw.DOM()` re-renders the readings. For SSE push instead of polling, use `new EventSource('/events')` and call `bw.patch()` on each message. See [tutorial-embedded.md](tutorial-embedded.md).

---

## Pattern 5: Static Site (bwcli)

Convert Markdown or HTML to styled pages at build time. No runtime JavaScript required. Good for docs, blogs, and project pages.

```
my-docs/
  content/
    index.md, guide.md, api.md
  styles.css           <- optional custom CSS
  build.sh
  dist/                <- generated output
```

```bash
#!/bin/bash
# build.sh
for f in content/*.md; do
  name=$(basename "$f" .md)
  bwcli "$f" \
    --standalone \
    --theme ocean \
    --highlight \
    -c styles.css \
    -o "dist/${name}.html"
done
```

Each output is self-contained with bitwrench embedded inline. No CDN, no toolchain beyond `bwcli`.

**State flow:** There is none at runtime. `bwcli` reads Markdown, converts to HTML, applies a theme, and writes a static file. For pages that need interactivity, add `--standalone` and include a `<script>` block using bitwrench at runtime. See [cli.md](cli.md).

---

## Choosing a Pattern

| Use case | Pattern | Key API |
|----------|---------|---------|
| Monitoring dashboard, admin panel | Single-Page Dashboard | `bw.pub/sub`, `bw.DOM()`, `makeStatCard` |
| Multi-view app with URL navigation | Multi-Page SPA | `bw.router()`, `bw.navigate()` |
| Server owns all logic (internal tool, LLM UI) | bwserve Server-Driven | `client.render()`, `client.patch()` |
| Microcontroller or constrained device | Embedded / IoT | `bw.DOM()`, `fetch()` polling or SSE |
| Documentation, blog, project pages | Static Site (bwcli) | `bwcli`, `--theme`, `--standalone` |
| Prototype or quick one-off | Single-Page Dashboard | One HTML file, no build step |

Patterns compose: a bwserve app can include a client-side router, an embedded dashboard can use pub/sub, and a static site can include runtime bitwrench for interactive sections.

---

## Related

- [State Management](state-management.md) -- levels 0-2, pub/sub, shared state
- [Routing](routing.md) -- `bw.router()` full API
- [Component Library](component-library.md) -- all `make*()` factories
- [bwserve](bwserve.md) -- server-driven UI protocol
- [Tutorial: Embedded](tutorial-embedded.md) -- ESP32 walkthrough
- [CLI](cli.md) -- `bwcli` command reference
- [Thinking in Bitwrench](thinking-in-bitwrench.md) -- design philosophy
