# bwserve Screenshot — Design Document

**Status**: Design (not yet implemented)
**Author**: M. Chatterjee / deftio
**Date**: March 2026
**Target**: v2.0.19 or v2.1.0

---

## Why this matters

Programmatic UI generation — by LLMs, headless servers, embedded devices — has
no visual feedback loop. You push TACO to the browser and hope it looks right.
Every other framework shares this blind spot. Playwright/Puppeteer solve it but
they're heavyweight (headless Chromium, 100+ MB dependency).

bwserve already has the push channel (SSE). Adding a pull channel for
screenshots closes the loop:

- **LLMs**: Generate TACO → push via bwserve → screenshot back → vision model
  evaluates → refine. A **visual REPL for AI**. No other sub-50KB library can
  do this.
- **Embedded/IoT**: An ESP32 dashboard is running in a factory. Screenshot lets
  an operator see the state remotely without opening a browser to the device.
  Could trigger on alarm conditions.
- **Developers**: Visual regression testing without Playwright. Screenshot
  before/after a change, diff the images. Zero infrastructure.
- **Documentation**: Auto-generate screenshots of component states, themes,
  responsive layouts.

## Scope

This feature lives **entirely in bwserve** (`src/bwserve/`). No changes to
`bitwrench.js` or the client-side library. The screenshot function is a
server-side convenience that orchestrates an existing protocol pattern
(register + call + POST-back).

## Protocol design

### Request/response over SSE + POST

bwserve is SSE (server→client) + POST (client→server). Screenshot is
request/response: server says "capture," client does it, sends the result back.

```
Server                               Client (Browser)
  |                                    |
  |-- call('_bw_screenshot', {         |
  |     requestId, selector, options   |
  |   })  --------------------------->  |
  |                                    | html2canvas(element)
  |                                    | resize canvas (optional)
  |                                    | canvas.toDataURL()
  |   <-------------------------------  |
  |   POST /__bw/screenshot/:clientId  |
  |     { requestId, data, width,      |
  |       height, format }             |
  |                                    |
  | resolve Promise(Buffer)            |
```

### Correlation

A `requestId` (UUID) links the call to its response. The server holds a
pending Promise that resolves when the matching POST arrives, or rejects
on timeout.

```javascript
// Internal: _pendingScreenshots = Map<requestId, { resolve, reject, timer }>
```

## Server-side API

### `client.screenshot(selector?, options?)`

```javascript
/**
 * Capture a screenshot of the client's page or a specific element.
 *
 * @param {string} [selector='body'] - CSS selector of element to capture
 * @param {Object} [options]
 * @param {string} [options.format='png'] - 'png' or 'jpeg'
 * @param {number} [options.quality=0.85] - JPEG quality 0–1 (ignored for PNG)
 * @param {number} [options.maxWidth] - Resize if wider (preserves aspect ratio)
 * @param {number} [options.maxHeight] - Resize if taller (preserves aspect ratio)
 * @param {number} [options.scale=1] - Device pixel ratio override
 * @param {number} [options.timeout=10000] - Reject after ms
 * @returns {Promise<Object>} { data: Buffer, width, height, format }
 */
client.screenshot(selector, options)
```

### Usage examples

```javascript
// Basic — screenshot the whole page
var img = await client.screenshot();
fs.writeFileSync('page.png', img.data);

// Element — screenshot a specific card
var img = await client.screenshot('#dashboard', {
  format: 'jpeg',
  quality: 0.8,
  maxWidth: 1024
});

// LLM visual feedback loop
client.render('#app', bw.makeCard({ title: 'Hello', content: 'AI-generated' }));
var img = await client.screenshot('#app', { format: 'jpeg', maxWidth: 512 });
var feedback = await askVisionModel(
  "Does this card look well-styled? Is the text readable?",
  img.data.toString('base64')
);

// Embedded monitoring — screenshot on alarm
if (pressure > threshold) {
  var img = await client.screenshot('#hmi-panel');
  sendAlertEmail('Pressure alarm', img.data);
}
```

### Return value

```javascript
{
  data: Buffer,      // raw image bytes
  width: 1024,       // actual pixel width (after resize)
  height: 768,       // actual pixel height (after resize)
  format: 'jpeg'     // 'png' or 'jpeg'
}
```

The `data` field is a Node.js Buffer. Use `.toString('base64')` for LLM APIs,
`fs.writeFileSync()` for disk, or pass directly to image comparison libraries.

## Client-side implementation

### html2canvas integration

The client-side capture function uses [html2canvas](https://html2canvas.hertzen.com/)
(~40KB). It is lazy-loaded on first screenshot request — not bundled into
bitwrench.js.

**Loading strategy** (in order of preference):
1. If `window.html2canvas` is already defined, use it (user loaded it manually)
2. If bwserve is serving vendored copy, load from `/__bw/vendor/html2canvas.min.js`
3. Fall back to CDN: `https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js`

The vendored copy lives at `src/vendor/html2canvas.min.js` and is served
automatically by bwserve's static handler. Users who need fully offline
operation include the vendor directory; others get CDN fallback.

### Capture function

Registered on the client automatically when the first `client.screenshot()`
call is made. The server sends a `register` message with this function body:

```javascript
function _bw_screenshot(opts) {
  var sel = opts.selector || 'body';
  var el = document.querySelector(sel);
  if (!el) {
    return fetch('/__bw/screenshot/' + opts.clientId, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requestId: opts.requestId,
        error: 'Element not found: ' + sel
      })
    });
  }

  // Ensure html2canvas is loaded
  var p = window.html2canvas
    ? Promise.resolve(window.html2canvas)
    : _loadScript(opts.captureUrl);

  p.then(function(html2canvas) {
    var captureOpts = { scale: opts.scale || 1, useCORS: true };
    return html2canvas(el, captureOpts);
  }).then(function(canvas) {
    // Optional client-side resize
    var out = canvas;
    var mw = opts.maxWidth;
    var mh = opts.maxHeight;
    if ((mw && canvas.width > mw) || (mh && canvas.height > mh)) {
      var sw = mw ? mw / canvas.width : 1;
      var sh = mh ? mh / canvas.height : 1;
      var scale = Math.min(sw, sh);
      out = document.createElement('canvas');
      out.width = Math.round(canvas.width * scale);
      out.height = Math.round(canvas.height * scale);
      out.getContext('2d').drawImage(canvas, 0, 0, out.width, out.height);
    }

    var fmt = opts.format === 'jpeg' ? 'image/jpeg' : 'image/png';
    var quality = opts.format === 'jpeg' ? (opts.quality || 0.85) : undefined;
    var dataUrl = out.toDataURL(fmt, quality);

    return fetch('/__bw/screenshot/' + opts.clientId, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requestId: opts.requestId,
        data: dataUrl,
        width: out.width,
        height: out.height,
        format: opts.format || 'png'
      })
    });
  }).catch(function(err) {
    fetch('/__bw/screenshot/' + opts.clientId, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requestId: opts.requestId,
        error: err.message || String(err)
      })
    });
  });
}

function _loadScript(url) {
  return new Promise(function(resolve, reject) {
    var s = document.createElement('script');
    s.src = url;
    s.onload = function() { resolve(window.html2canvas); };
    s.onerror = function() { reject(new Error('Failed to load html2canvas')); };
    document.head.appendChild(s);
  });
}
```

### Client-side resize

Resize happens **before encoding**, on the canvas. Reasons:

1. **Bandwidth**: 1920x1080 PNG ≈ 2–5MB. 512x288 JPEG @ 0.7 ≈ 30KB.
   For embedded on cellular, this is the difference between usable and not.
2. **LLM tokens**: Vision models charge by image resolution. 1024px wide is
   plenty for layout evaluation.
3. **Latency**: Smaller image = faster encode + faster transmit.

Canvas `drawImage` with different source/dest dimensions does bilinear
interpolation — good quality, zero dependencies.

Resize is optional. If `maxWidth` and `maxHeight` are both omitted, the full-
resolution capture is returned.

## Server-side implementation

### Changes to `BwServeClient` (`src/bwserve/client.js`)

Add `screenshot()` method (~30 lines):

```javascript
screenshot(selector, options) {
  var self = this;
  var opts = options || {};
  var requestId = 'ss_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
  var timeout = opts.timeout || 10000;

  return new Promise(function(resolve, reject) {
    // Store pending request
    var timer = setTimeout(function() {
      delete self._pendingScreenshots[requestId];
      reject(new Error('Screenshot timeout after ' + timeout + 'ms'));
    }, timeout);

    if (!self._pendingScreenshots) self._pendingScreenshots = {};
    self._pendingScreenshots[requestId] = { resolve: resolve, reject: reject, timer: timer };

    // Ensure capture function is registered (once per client)
    if (!self._screenshotRegistered) {
      self.register('_bw_screenshot', CAPTURE_FN_SOURCE);
      self._screenshotRegistered = true;
    }

    // Determine capture library URL
    var captureUrl = '/__bw/vendor/html2canvas.min.js';

    // Call the capture function
    self.call('_bw_screenshot', {
      clientId: self.id,
      requestId: requestId,
      selector: selector || 'body',
      format: opts.format || 'png',
      quality: opts.quality || 0.85,
      maxWidth: opts.maxWidth || null,
      maxHeight: opts.maxHeight || null,
      scale: opts.scale || 1,
      captureUrl: captureUrl
    });
  });
}

/**
 * Resolve a pending screenshot request.
 * @private
 */
_resolveScreenshot(requestId, result) {
  if (!this._pendingScreenshots) return false;
  var pending = this._pendingScreenshots[requestId];
  if (!pending) return false;

  clearTimeout(pending.timer);
  delete this._pendingScreenshots[requestId];

  if (result.error) {
    pending.reject(new Error(result.error));
  } else {
    // Convert data URL to Buffer
    var base64 = result.data.split(',')[1];
    pending.resolve({
      data: Buffer.from(base64, 'base64'),
      width: result.width,
      height: result.height,
      format: result.format
    });
  }
  return true;
}
```

### Changes to `BwServeApp` (`src/bwserve/index.js`)

Add one new route (~20 lines):

```javascript
// In _handleRequest(), after the action route:

// /__bw/screenshot/:clientId — screenshot POST-back
if (path.startsWith('/__bw/screenshot/') && method === 'POST') {
  var ssClientId = path.slice('/__bw/screenshot/'.length);
  return this._handleScreenshot(req, res, ssClientId);
}

// /__bw/vendor/:filename — serve vendored libraries
if (path.startsWith('/__bw/vendor/') && method === 'GET') {
  var vendorFile = path.slice('/__bw/vendor/'.length);
  return this._serveVendorFile(res, vendorFile);
}
```

Handler:

```javascript
_handleScreenshot(req, res, clientId) {
  var record = this._clients.get(clientId);
  if (!record || !record.client) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Unknown client' }));
    return;
  }

  var body = '';
  req.on('data', function(chunk) { body += chunk; });
  req.on('end', function() {
    try {
      var data = JSON.parse(body);
      record.client._resolveScreenshot(data.requestId, data);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true }));
    } catch (e) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
  });
}

_serveVendorFile(res, filename) {
  // Only allow known vendored files (security)
  var allowed = ['html2canvas.min.js'];
  if (allowed.indexOf(filename) === -1) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
    return;
  }
  var vendorDir = resolve(__dirname, '..', 'vendor');
  var filePath = join(vendorDir, filename);
  if (!existsSync(filePath)) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Vendor file not found: ' + filename);
    return;
  }
  var content = readFileSync(filePath);
  res.writeHead(200, {
    'Content-Type': 'application/javascript; charset=utf-8',
    'Cache-Control': 'public, max-age=86400'
  });
  res.end(content);
}
```

## Security

### Opt-in

Screenshot is disabled by default. Enable with:

```javascript
bw.clientConnect(url, { allowScreenshot: true });
```

Or on the server side:

```javascript
var app = bwserve.create({ allowScreenshot: true });
```

When disabled, the client-side capture function is never registered, and
`client.screenshot()` rejects immediately.

### What it can see

- **Only the bwserve page content.** html2canvas operates at DOM level, not
  screen level. It cannot see other tabs, OS windows, or anything outside the
  page.
- **Cross-origin images are blank.** html2canvas respects CORS. External images
  without CORS headers render as blank rectangles.

### Rate limiting

Default: max 1 screenshot per second per client. Configurable:

```javascript
var app = bwserve.create({
  allowScreenshot: true,
  screenshotRateLimit: 2000  // ms between screenshots
});
```

### Visual indicator (optional)

A brief border flash (100ms blue outline on the captured element) can indicate
a screenshot was taken. Disabled by default — enabled via:

```javascript
client.screenshot('#app', { indicator: true });
```

For headless/embedded/LLM use, the indicator is unnecessary and stays off.

## Vendor strategy: html2canvas

### Why vendor it

1. **Offline/airgapped environments.** Embedded devices, factory floors, secure
   networks may not have internet access. CDN fallback doesn't work.
2. **Deterministic builds.** Pinned version, no surprise breaking changes.
3. **Precedent.** `src/vendor/quikdown.js` already follows this pattern.

### What to vendor

- `html2canvas.min.js` v1.4.1 (latest stable, ~43KB minified)
- MIT license — compatible with bitwrench BSD-2-Clause
- File location: `src/vendor/html2canvas.min.js`
- Served by bwserve at `/__bw/vendor/html2canvas.min.js`

### Loading priority

1. `window.html2canvas` already defined → use it (user loaded manually or from
   a different CDN)
2. bwserve vendor route available → load from `/__bw/vendor/html2canvas.min.js`
3. CDN fallback → `https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js`

### Not bundled into bitwrench.js

html2canvas is NOT bundled into the bitwrench UMD/ESM/CJS builds. It's loaded
on demand, only when `client.screenshot()` is first called. This keeps the
bitwrench bundle at ~39KB gzipped. html2canvas adds ~43KB only for apps that
use screenshots.

## html2canvas CSS coverage

### What it handles well (bitwrench-relevant)

All standard CSS that bitwrench components use:
- Box model: padding, margin, border, border-radius
- Background: solid colors, linear-gradient
- Flexbox layout: flex, align-items, justify-content, gap
- Grid layout: basic grid-template-columns/rows
- Typography: font-size, font-weight, color, text-align, line-height
- Tables: borders, cell padding, striped rows
- Shadows: box-shadow (basic)
- Opacity, overflow, z-index

### What it doesn't handle well

CSS that bitwrench components don't use (and we should keep it that way):
- `backdrop-filter` (blur/saturate behind element)
- Complex `clip-path`
- `mix-blend-mode`
- CSS `filter` (blur, grayscale)
- Some pseudo-elements (::before/::after with complex content)
- Webfonts sometimes fail if CORS isn't right
- `position: sticky` can be inconsistent

### Implication for bitwrench component design

As long as bitwrench components stick to standard CSS (which they do — borders,
backgrounds, padding, flex, grid), html2canvas captures them accurately. This
is a reason to avoid exotic CSS in BCCL components. The screenshottable
constraint reinforces the design-tokens philosophy from the north star.

## Demos and integration

### bwserve Playground integration

Add a "Screenshot" button to `pages/bwserve-sandbox.html` that:
1. Sends a screenshot request to the connected bwserve instance
2. Displays the returned image inline in the sandbox
3. Shows metadata (dimensions, format, size in bytes)

This lets developers test the feature interactively.

### Example: screenshot demo

New example at `examples/client-server/screenshot-demo/`:

```javascript
// server.js
import bwserve from 'bitwrench/bwserve';
import bw from 'bitwrench';
import { writeFileSync } from 'fs';

var app = bwserve.create({
  port: 8080,
  title: 'Screenshot Demo',
  allowScreenshot: true
});

app.page('/', async function(client) {
  // Build a dashboard
  client.render('#app', { t: 'div', c: [
    bw.makeNavbar({ brand: 'Screenshot Demo', dark: true }),
    { t: 'div', a: { class: 'bw_container bw_py_4', id: 'dashboard' }, c: [
      bw.makeRow({ children: [
        bw.makeCol({ size: { md: 4 }, content:
          bw.makeStatCard({ value: '2,847', label: 'Users', icon: '\uD83D\uDC65' }) }),
        bw.makeCol({ size: { md: 4 }, content:
          bw.makeStatCard({ value: '$48.9K', label: 'Revenue', icon: '\uD83D\uDCB0' }) }),
        bw.makeCol({ size: { md: 4 }, content:
          bw.makeStatCard({ value: '99.9%', label: 'Uptime', icon: '\u2705' }) })
      ]})
    ]}
  ]});

  // Wait for page to render, then screenshot
  setTimeout(async function() {
    console.log('Taking screenshot...');
    var img = await client.screenshot('#dashboard', {
      format: 'jpeg',
      quality: 0.85,
      maxWidth: 1024
    });
    writeFileSync('dashboard.jpg', img.data);
    console.log('Saved dashboard.jpg (' + img.width + 'x' + img.height
      + ', ' + Math.round(img.data.length / 1024) + 'KB)');
  }, 1000);
});

app.listen(function() {
  console.log('Open http://localhost:8080 in a browser');
  console.log('The server will auto-screenshot the dashboard after 1 second');
});
```

### Example: LLM visual feedback

New example at `examples/client-server/llm-screenshot/`:

Shows the generate → render → screenshot → evaluate → refine loop. Uses
Ollama (local, free) with a vision model (llava or similar). The LLM generates
TACO, bwserve renders it, screenshots it, and the vision model evaluates the
result.

## Testing strategy

### Unit tests (jsdom)

html2canvas can't run in jsdom (no real rendering), but we can test:

1. **Protocol round-trip**: `client.screenshot()` sends the right call message,
   `_resolveScreenshot()` resolves the Promise with correct data.
2. **Timeout**: Promise rejects after timeout if no POST arrives.
3. **Error handling**: Client sends error → Promise rejects.
4. **Rate limiting**: Second call within rate limit rejects.
5. **Opt-in enforcement**: Screenshot rejected when `allowScreenshot` is false.
6. **Options pass-through**: format, quality, maxWidth, maxHeight, scale all
   arrive in the call message.

### Integration tests (Playwright)

Playwright can load the real page and verify:

1. Screenshot returns a valid image (check Buffer starts with PNG/JPEG magic bytes)
2. Resize produces correct dimensions
3. Element screenshot captures only the target
4. html2canvas loads from vendor path (check network requests)
5. JPEG quality affects file size

### Test file

`test/bitwrench_test_bwserve.js` — add a new `describe('screenshot')` block.
~15-20 tests for the protocol layer.

## Implementation plan

### Phase 1: Core protocol (this release)

1. Add `_pendingScreenshots` map and `screenshot()` method to `BwServeClient`
2. Add `_resolveScreenshot()` to `BwServeClient`
3. Add `/__bw/screenshot/:clientId` POST route to `BwServeApp`
4. Add `/__bw/vendor/:filename` GET route to `BwServeApp` (allowlisted)
5. Vendor `html2canvas.min.js` into `src/vendor/`
6. Write client-side capture function as string constant
7. Add `allowScreenshot` option to `create()` and `clientConnect()`
8. Unit tests for protocol round-trip, timeout, error, opt-in

### Phase 2: Demos and playground

1. Screenshot demo example (`examples/client-server/screenshot-demo/`)
2. Add Screenshot button to bwserve playground (`pages/bwserve-sandbox.html`)
3. LLM screenshot example (optional, depends on vision model availability)

### Phase 3: Polish

1. Rate limiting
2. Visual indicator option
3. `client.inspect()` — layout metadata without pixels (width, height,
   computed styles, child count)
4. Playwright integration tests
5. Documentation in `docs/bwserve.md`

## Lines of code estimate

| File | Changes | LOC |
|------|---------|-----|
| `src/bwserve/client.js` | `screenshot()`, `_resolveScreenshot()` | ~50 |
| `src/bwserve/index.js` | POST route, vendor route | ~40 |
| `src/vendor/html2canvas.min.js` | vendored (copy) | ~43KB |
| `test/bitwrench_test_bwserve.js` | screenshot test block | ~80 |
| `examples/client-server/screenshot-demo/` | server.js | ~40 |
| Total new code | | ~210 |

## Open questions

### 1. Capture library alternatives

html2canvas is the default. Should we support pluggable capture backends?

- `dom-to-image-more` (~10KB) — uses SVG foreignObject, better CSS fidelity
  for some cases, worse for others.
- User-provided function — `client.screenshot('#app', { capture: myCaptureFn })`

**Recommendation**: Default to html2canvas. Allow override via options in a
future version if demand exists. Keep the protocol generic — the server doesn't
care what produces the pixel data.

### 2. Should `client.inspect()` ship with screenshots?

`inspect()` returns layout metadata (dimensions, computed styles, child count)
without the pixel overhead. Useful for LLMs that need structural info, not
visual. Same protocol pattern (call + POST-back), much cheaper.

**Recommendation**: Defer to Phase 3. Screenshot is the high-value feature.
`inspect()` is additive and can use the same infrastructure.

### 3. Multiple screenshots (batch)

Should there be `client.screenshotAll(selectors)` that captures multiple
elements in one round-trip?

**Recommendation**: Defer. Single screenshot covers 95% of use cases. Batch
adds protocol complexity for marginal gain.

### 4. Streaming screenshots / video

Repeated screenshots at interval = poor-man's video. Not recommended — use
screen recording or the MediaRecorder API instead. But `setInterval` +
`client.screenshot()` works if someone really wants it.

### 5. POST body size limits

A full-page screenshot at 1920x1080 PNG is 2–5MB base64-encoded. Node's HTTP
server handles this fine, but we should document the default limit and how to
increase it if needed. The `maxWidth` option is the primary mitigation — use it.

---

## Summary

| Aspect | Decision |
|--------|----------|
| Scope | bwserve only, no bitwrench.js changes |
| Capture library | html2canvas (vendored + CDN fallback) |
| Vendor location | `src/vendor/html2canvas.min.js` |
| API | `client.screenshot(selector?, options?)` → `Promise<{data, width, height, format}>` |
| Resize | Client-side, on canvas, before encoding. Optional. |
| Security | Opt-in via `allowScreenshot`. DOM-level only, no screen capture. |
| Protocol | call + POST-back with requestId correlation |
| Testing | Protocol unit tests in jsdom, visual tests in Playwright |
| Demos | Screenshot demo example + bwserve playground integration |

This is ~210 LOC of new code (excluding the vendored html2canvas) that gives
bitwrench a genuinely unique capability: any server — LLM, embedded device,
CI pipeline — can see what it built.
