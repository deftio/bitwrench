# bwserve Query & Mount Design — v2.0.19+

## Status: SUPERSEDED

Route prefixes changed in v2.0.19: `/__bw/` is now `/bw/`. Function renames: `clientApply` -> `bw.apply`, `clientParse` -> `bw.parseJSONFlex`, `bwclient.js connection` removed (moved to bwclient.js), `built-in client functions` removed. See updated docs.

## Original Status: DESIGN ONLY — not yet implemented

Captured from P3 visual polish session (Mar 2026). Spin up a separate session to implement.

---

## Problem

Two gaps in bwserve's server-driven UI:

1. **No return channel**: Server can push to client (SSE) and client can send actions (POST `/bw/return/action/`), but there's no general-purpose way to query the client and get a structured result back. The screenshot feature has a special POST-back mechanism (`/bw/return/screenshot/`) but it's not generalized.

2. **onclick handlers lost over SSE**: TACO objects sent via `client.render()` go through `JSON.stringify()` which strips functions. Interactive BCCL components (accordion, tabs, dropdown) render but don't work. The component-tester works around this by injecting event delegation via `client.exec()`, but that's a hack.

---

## Proposed Features

### 1. `client.query(code)` → Promise\<result\>

General-purpose return channel. Server sends code to client, client evaluates, POSTs result back.

```javascript
// Server usage:
var bgColor = await client.query('return getComputedStyle(document.body).backgroundColor');
var bounds = await client.query(
  'var r = document.querySelector(".bw_card").getBoundingClientRect();' +
  'return { x: r.x, y: r.y, w: r.width, h: r.height }'
);
```

**How it works** (mirrors screenshot POST-back pattern):
- Server generates `requestId`, stores Promise in `client._pending[requestId]`
- Server calls `client.call('_bw_query', { requestId, code })`
- Client evaluates code via `new Function(code)()`, POSTs result to `/bw/return/respond/:clientId`
- Server route receives POST, calls `client._resolvePending(requestId, data)` which resolves the Promise

**Permission**: Requires `allowExec: true` (same as exec — evaluates arbitrary code).

**Timeout**: Default 5000ms (queries should be fast).

**Async support**: If the evaluated code returns a Promise, the client awaits it before POSTing.

### 2. `client.mount(selector, factory, props)` → Promise

Mounts interactive TACO with onclick handlers preserved. Key insight: `bitwrench.umd.js` is already loaded in the browser shell, so all `bw.make*()` functions are available client-side. Server just says "call bw.makeAccordion with these props and mount at this selector."

```javascript
// Component name shorthand — uses bw.BCCL registry + bw.make():
await client.mount('#sidebar', 'accordion', { items: [...] });
await client.mount('#header', 'hero', { title: 'Welcome', variant: 'primary' });
await client.mount('#stats', 'statCard', { label: 'Revenue', value: 12450 });

// Kebab-case also works:
await client.mount('#stats', 'stat-card', { label: 'Revenue', value: 12450 });

// Factory code string (requires allowExec):
await client.mount('#custom',
  'return bw.makeCard({ title: props.title, content: bw.makeProgress({ value: props.pct }) })',
  { title: 'Stats', pct: 75 }
);
```

**Component name shorthand**: If `factory` is a key in `bw.BCCL` (or kebab-case convertible to one), the client calls `bw.make(name, props)` → gets TACO with onclick handlers → `bw.DOM(selector, taco)`. No code evaluation needed — just calling known BCCL functions with data.

**Factory code string**: If `factory` contains code (parens, return, etc.), evaluated via `new Function('props', factory)(props)`. Requires `allowExec: true`.

**How it works**:
- Server calls `client.call('_bw_mount', { requestId, target, factory, props })`
- Client-side `_bw_mount` built-in checks if `factory` is in `bw.BCCL`:
  - Yes → `bw.DOM(target, bw.make(factory, props))`
  - No → `bw.DOM(target, new Function('props', factory)(props))` (requires `bw._allowExec`)
- POSTs confirmation/error to `/bw/return/respond/:clientId`
- Server resolves Promise

**Timeout**: Default 10000ms (component rendering could be complex).

### 3. `bw._bwClient` Shell Helper

Tiny object injected by `shell.js` that provides the POST-back mechanism for all return-channel features:

```javascript
// Injected by shell.js into the page's inline script
bw._bwClient = {
  id: '{clientId}',
  respond: function(requestId, result, error) {
    fetch('/bw/return/respond/' + this.id, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId: requestId, result: result, error: error || null })
    }).catch(function() {});
  }
};
```

~8 lines of JS. Always available in bwserve shells. This is the "mini client-side component" that bundles POST-back functionality.

The `_bw_query` and `_bw_mount` built-in functions use `bw._bwClient.respond()` to send results back. They guard with `if (!bw._bwClient) return;` for graceful no-op outside bwserve shells.

---

## Implementation Plan

### Server-side changes

**`src/bwserve/client.js`** — Add to `BwServeClient`:
```javascript
// Generic pending promise map (like _pendingScreenshots but reusable)
_pend(timeout) {
  var self = this;
  var requestId = 'rq_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
  if (!self._pending) self._pending = {};
  var entry = {};
  var promise = new Promise(function(resolve, reject) {
    entry.timer = setTimeout(function() {
      delete self._pending[requestId];
      reject(new Error('Timeout after ' + timeout + 'ms'));
    }, timeout);
    entry.resolve = resolve;
    entry.reject = reject;
  });
  self._pending[requestId] = entry;
  return { requestId: requestId, promise: promise };
}

_resolvePending(requestId, data) {
  if (!this._pending) return false;
  var pending = this._pending[requestId];
  if (!pending) return false;
  clearTimeout(pending.timer);
  delete this._pending[requestId];
  if (data.error) {
    pending.reject(new Error(data.error));
  } else {
    pending.resolve(data.result);
  }
  return true;
}

query(code, options) {
  var opts = options || {};
  var p = this._pend(opts.timeout || 5000);
  this.call('_bw_query', { requestId: p.requestId, code: code });
  return p.promise;
}

mount(selector, factory, props, options) {
  var opts = options || {};
  var p = this._pend(opts.timeout || 10000);
  // Kebab-case normalization
  var factoryStr = typeof factory === 'string' ? factory : String(factory);
  this.call('_bw_mount', {
    requestId: p.requestId,
    target: selector,
    factory: factoryStr,
    props: props || {}
  });
  return p.promise;
}
```

**`src/bwserve/index.js`** — Add route:
```javascript
// In _handleRequest, alongside /bw/return/screenshot/:
if (method === 'POST' && path.startsWith('/bw/return/respond/')) {
  var clientId = path.slice('/bw/return/respond/'.length);
  this._handleRespond(req, res, clientId);
  return;
}

// New handler (mirrors _handleScreenshot):
_handleRespond(req, res, clientId) {
  var record = this._clients.get(clientId);
  if (!record || !record.client) { /* 404 */ return; }
  var body = '';
  req.on('data', function(chunk) { body += chunk; });
  req.on('end', function() {
    var data = JSON.parse(body);
    record.client._resolvePending(data.requestId, data);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true }));
  });
}
```

**`src/bwserve/shell.js`** — After bwclient.js connection setup, inject:
```javascript
script.push('  bw._bwClient = {');
script.push('    id: ' + JSON.stringify(clientId) + ',');
script.push('    respond: function(rid, result, error) {');
script.push('      fetch("/bw/return/respond/" + this.id, {');
script.push('        method: "POST",');
script.push('        headers: {"Content-Type":"application/json"},');
script.push('        body: JSON.stringify({requestId:rid,result:result,error:error||null})');
script.push('      }).catch(function(){});');
script.push('    }');
script.push('  };');
```

### Client-side changes

**`src/bitwrench.js`** — Add to `bw.built-in client functions`:
```javascript
_bw_query: function(opts) {
  if (!bw._bwClient) return;
  try {
    var result = new Function(opts.code)();
    if (result && typeof result.then === 'function') {
      result.then(function(v) { bw._bwClient.respond(opts.requestId, v); })
        .catch(function(e) { bw._bwClient.respond(opts.requestId, null, e.message); });
    } else {
      bw._bwClient.respond(opts.requestId, result);
    }
  } catch(e) {
    bw._bwClient.respond(opts.requestId, null, e.message);
  }
},

_bw_mount: function(opts) {
  if (!bw._bwClient) return;
  try {
    var taco;
    var factory = opts.factory;
    // Kebab-case → camelCase
    var normalized = factory.replace(/-([a-z])/g, function(_, c) { return c.toUpperCase(); });
    if (bw.BCCL && bw.BCCL[normalized]) {
      // Component name — call bw.make() (no code eval, always safe)
      taco = bw.make(normalized, opts.props || {});
    } else if (bw._allowExec) {
      // Factory code string — requires allowExec
      var fn = new Function('props', factory);
      taco = fn(opts.props || {});
    } else {
      throw new Error('Unknown component "' + factory + '" and allowExec is disabled');
    }
    bw.DOM(opts.target, taco);
    if (opts.requestId) bw._bwClient.respond(opts.requestId, { mounted: true });
  } catch(e) {
    if (opts.requestId) bw._bwClient.respond(opts.requestId, null, e.message);
  }
}
```

---

## Permission Model

| Feature | Permission | Rationale |
|---------|-----------|-----------|
| `client.query(code)` | `allowExec: true` | Evaluates arbitrary code AND returns results |
| `client.mount(sel, componentName, props)` | None | Calls known BCCL function with data |
| `client.mount(sel, factoryCode, props)` | `allowExec: true` | Evaluates developer-written code |

---

## Screenshot Migration (future)

Keep `/bw/return/screenshot/:clientId` working for now. In a future release, have `_bw_screenshot` POST to `/bw/return/respond/` instead and use `_resolvePending`. The `_pend`/`_resolvePending` mechanism is designed to be shared.

---

## Component Tester Benefits

With `client.mount()`, the component-tester.mjs becomes much cleaner:

```javascript
// Before (hack): inject 50+ lines of event delegation JS via client.exec()
client.exec(`document.addEventListener('click', function(e) { ... accordion toggle ... tabs toggle ... dropdown toggle ... })`);

// After (clean): mount interactive components natively
client.mount('#accordion-section', 'accordion', { items: [...] });
client.mount('#tabs-section', 'tabs', { tabs: [...] });
client.mount('#dropdown-section', 'dropdown', { trigger: 'Actions', items: [...] });
```

The server sends data, BCCL on the client creates the interactive component. No exec needed for standard components.

---

## UUID Screenshots

Already works — just needs usage:
```javascript
var accordion = bw.makeAccordion({ items: [...] });
bw.assignUUID(accordion, 'gallery-accordion');
client.mount('#accordion', 'accordion', { items: [...] });
// Screenshot just that component:
var img = await client.screenshot('[data-bw-uuid="gallery-accordion"]');
```

---

## Size Impact

| Where | Lines | Bytes (unminified) |
|-------|-------|--------------------|
| `bw._bwClient` in shell | ~8 | ~200 |
| `_bw_query` + `_bw_mount` builtins | ~30 | ~800 |
| `query()` + `mount()` + `_pend()` + `_resolvePending()` server | ~50 | ~1200 |
| `_handleRespond()` route | ~20 | ~500 |
| **Total** | **~108** | **~2700 (~600 gzipped)** |

---

## Tests to Add

- Unit: `_pend` / `_resolvePending` (timeout, resolve, reject)
- Unit: `client.query()` produces correct `_sent` messages
- Unit: `client.mount()` with component name vs factory code
- Unit: `_bw_query` built-in (sync + async results, error handling)
- Unit: `_bw_mount` built-in (BCCL lookup, kebab-case, factory code, allowExec guard)
- Integration: `/bw/return/respond/` route handler
- Shell: `bw._bwClient` injected correctly

---

## Docs to Update

- `dev/bw-client-server.md` — Add query/mount sections
- `dev/qa-todo.md` — Add as P5 Phase 2 or new priority
