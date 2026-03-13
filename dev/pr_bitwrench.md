# Bitwrench / bwserve — Bug Reports & Feature Requests

Found while building [LiquidUI](../bitwrench-feedback.md): a bwserve-powered app with LLM chat (quikchat) + editable document canvas (quikdown). Server drives UI via SSE, streams Ollama LLM responses to the browser via `client.call()`.

---

## Bugs

### 1. CRITICAL: bwserve `DIST_DIR` path resolution broken when installed from npm

**Affected:** `bwserve.esm.js` (and `.cjs.js`), all versions with bwserve

**Problem:** The `/__bw/bitwrench.umd.js` and `/__bw/bitwrench.css` routes always 404 when bwserve is installed via npm.

In the source (`src/bwserve/index.js`):
```js
var __dirname = dirname(fileURLToPath(import.meta.url));
var DIST_DIR = resolve(__dirname, '..', '..', 'dist');
```

This assumes the code runs from `src/bwserve/` (2 levels deep). But the published bundle is at `dist/bwserve.esm.js` (1 level deep). Result:

| Context | Resolves to | Correct? |
|---------|-------------|----------|
| Source (`src/bwserve/index.js`) | `<pkg>/dist/` | Yes |
| Built (`dist/bwserve.esm.js`) | `<pkg>/../dist/` → `node_modules/dist/` | **No** |

**Reproduction:**
```bash
mkdir test && cd test && npm init -y
npm install bitwrench
cat > app.mjs << 'EOF'
import bwserve from 'bitwrench/bwserve';
const app = bwserve.create({ port: 8080 });
app.page('/', (client) => { client.render('#app', { t: 'h1', c: 'Hello' }); });
app.listen(() => console.log('listening'));
EOF
node app.mjs
# Open http://localhost:8080 → blank page, console shows 404 for bitwrench.umd.js
```

**Workaround:**
```bash
mkdir -p node_modules/dist
ln -s ../bitwrench/dist/bitwrench.umd.js node_modules/dist/bitwrench.umd.js
ln -s ../bitwrench/dist/bitwrench.umd.min.js node_modules/dist/bitwrench.umd.min.js
ln -s ../bitwrench/dist/bitwrench.css node_modules/dist/bitwrench.css
```

**Suggested fix:** In the build step, rewrite the path to `resolve(__dirname, '.')` since the built file is already in `dist/`. Or detect at runtime:
```js
var DIST_DIR = existsSync(resolve(__dirname, 'bitwrench.umd.js'))
  ? __dirname
  : resolve(__dirname, '..', '..', 'dist');
```

---

### 2. `client.exec()` silently fails — no way to enable it via bwserve API

**Affected:** `bwserve` shell generation

**Problem:** The auto-generated shell calls `bw.clientConnect()` without `allowExec: true`. There's no `bwserve.create()` option to enable it. So `client.exec()` always silently fails — no error, no warning on the server side.

**Reproduction:**
```js
app.page('/', (client) => {
  client.exec('document.title = "Hello"');  // silently ignored
});
```

Client console shows: `[bw] exec rejected: allowExec is not enabled`

**Workaround:** Use `client.register()` + `client.call()` instead.

**Suggested fix:** Add `allowExec` option to `bwserve.create()`:
```js
const app = bwserve.create({ allowExec: true });
```
Pass it through to `generateShell()` → `bw.clientConnect()`.

### 3. Potential: POST to `/__bw/action/<clientId>` returns 404 intermittently

**Affected:** bwserve action handler

**Problem:** When client-side code POSTs to `/__bw/action/<clientId>`, it sometimes returns 404 even though the SSE connection is active and the client ID is valid. We observed this with QuikdownEditor's `onChange` firing and POSTing doc-sync updates to the action URL.

The 404 occurs despite the SSE stream being live and `client.on('doc-sync', ...)` being registered server-side. Server-side monkey-patch logging showed the request arriving but the client record not being found in `app._clients`.

**Possible causes:**
- Race condition: POST arrives before the client record is fully registered in `_clients` map
- Client ID mismatch after page reload (stale client ID cached in closure)
- The action route handler may not be matching correctly for certain client IDs

**Impact:** Any app using `fetch()` to POST custom payloads to the action URL (the recommended workaround for richer `data-bw-action` payloads) can hit this silently.

**Suggestion:**
- Add server-side debug logging for 404'd action POSTs (log the requested clientId and the current `_clients` keys)
- Return a more descriptive error body (e.g., `{"error": "unknown client", "clientId": "c1"}`) instead of bare 404
- Consider a `client.getActionUrl()` helper so clients don't have to construct `/__bw/action/<id>` manually

---

## Feature Requests

### 4. Shell customization — inject custom scripts, styles, favicon

**Problem:** The auto-generated shell has no extension points. Apps that need additional client-side libraries must use `client.register()` to dynamically create `<script>` tags at runtime — which is async, race-prone, and verbose.

There's also no way to set a favicon, which causes a 404 on every page load.

**Suggestion:**
```js
const app = bwserve.create({
  headScripts: ['/quikchat.umd.min.js', '/quikdown.umd.min.js'],
  headStyles: ['/quikchat.css', '/quikdown.light.min.css'],
  favicon: '/favicon.svg'
});
```

These would be injected as `<script>` and `<link>` tags in the shell `<head>`, loaded synchronously before the bwserve bootstrap script runs.

### 5. `client.call()` with return values

**Problem:** SSE is unidirectional, so `client.call()` is fire-and-forget. You can't get a return value from a client-side function. This forces ugly patterns:

```js
// Can't do this:
var msgId = client.call('createMessage');  // returns undefined

// Must do this instead:
// Register a function that stores result in window global
client.register('createMsg', 'function() { window._msgId = chat.messageAddNew(...); }');
client.call('createMsg');
// Then later reference window._msgId from other registered functions
```

**Suggestion:** Support an async response channel via the existing action POST:
```js
var msgId = await client.callAsync('createMessage');  // sends call, waits for POST response
```

### 6. `data-bw-action` with richer payloads

**Problem:** The shell's click delegation only scrapes `data-bw-id` and the nearest `<input>` value. For anything richer, you have to bypass the delegation and `fetch()` the action URL directly — which means the client needs to know the action URL.

We had to pass `client.id` to the client so it could construct the URL `/__bw/action/<clientId>` manually.

**Suggestion:** Support `data-bw-payload` attributes or a way to attach structured data to actions:
```html
<button data-bw-action="submit" data-bw-payload='{"key":"value"}'>Submit</button>
```

### 7. Split-pane / resizable panel component

Had to build a custom drag-to-resize handler (mousedown/mousemove/mouseup, ~25 lines of vanilla JS). A `bw.makeSplitPane()` TACO component would be useful for dashboard-style layouts.

### 8. No built-in fetch/POST wrapper (minor)

Minor — `fetch()` is standard. But bitwrench only has XHR GET utilities. A `bw.fetch()` or `bw.post()` wrapper would be consistent with the "batteries included" philosophy.

### 9. `client.register()` functions-as-strings is the biggest DX pain point

**Problem:** Every `client.register()` call requires writing client-side code as a string literal. For a large initialization function (ours is 160+ lines), this means:

- No syntax highlighting inside the string (editors treat it as a string, not JS)
- No linting, no type checking, no autocomplete for client-side APIs
- Stack traces from client errors show `<anonymous>` with unhelpful line numbers
- One unescaped backtick, `${`, or quote inside the string = silent breakage
- Can't use ES module imports, can't split across files
- Refactoring is error-prone (find-and-replace doesn't see into strings)

This is the single biggest friction in building a bwserve app. The register/call pattern is *architecturally* great, but the ergonomics of writing code-as-strings are painful.

**Suggestion (several options, not mutually exclusive):**

Option A — Accept a file path instead of a string:
```js
client.registerFile('luiBootstrap', './client/bootstrap.js');
// bwserve reads the file, wraps it, sends it over SSE
```
This lets developers write client code in actual `.js` files with full editor support.

Option B — Accept a function reference (serialize it):
```js
client.register('luiBootstrap', function(initialDoc, clientId) {
  // Actual JS code, not a string
  // Gets syntax highlighting, linting, autocomplete
});
// bwserve calls .toString() on the function and sends it
```
Caveat: closures won't work (can't serialize captured variables), but for most use cases this is fine — the function only uses its arguments and globals.

Option C — A build-time helper that reads `.js` files and inlines them:
```js
import { loadClientFn } from 'bitwrench/bwserve';
client.register('luiBootstrap', loadClientFn('./client/bootstrap.js'));
```

Any of these would dramatically improve the developer experience for non-trivial apps.

### 10. No lifecycle events — connect, disconnect, ready

**Problem:** There's no way to know when:
- The client has finished processing a `register()` or `call()` (no acknowledgment)
- The client's SSE connection drops (e.g., user closes tab, network failure)
- The client is fully initialized and ready to receive calls

In our app, after `client.call('luiBootstrap', ...)` (our app's init function that loads scripts and creates widgets), we immediately call `client.call('luiCreateMsg')` when a chat message arrives. If the init hasn't finished (scripts still loading), the call silently fails because `window._luiChat` doesn't exist yet.

**Workaround:** Hope for the best — init is usually fast enough. But this is a race condition.

**Suggestion:**
```js
// Server-side
client.on('connect', function() { /* client SSE stream opened */ });
client.on('disconnect', function() { /* client gone — clean up state */ });
client.on('ready', function() { /* client finished initial render + registered fns */ });

// Or, for call() acknowledgment:
await client.callAsync('myInitFunction', arg1, arg2);
// Now safe to call other functions
```

The disconnect event is especially important — without it, per-client state (chat history, document state) leaks forever on the server. There's no cleanup signal.

### 11. No script loading helper

**Problem:** Loading third-party scripts on the client requires building a custom promise-based loader every time:

```js
function loadScript(src) {
  return new Promise(function(resolve, reject) {
    var s = bw.createDOM({ t: 'script', a: { src: src } });
    s.onload = resolve;
    s.onerror = function() { reject(new Error('Failed to load ' + src)); };
    document.head.appendChild(s);
  });
}

loadScript('/quikdown.umd.min.js')
  .then(function() { return loadScript('/quikdown_edit.umd.min.js'); })
  .then(function() { return loadScript('/quikchat.umd.min.js'); })
  .then(function() { initApp(); });
```

Every app that integrates third-party libraries will write this exact boilerplate.

**Suggestion:**
```js
// Load scripts in order (each waits for previous)
bw.loadScripts(['/quikdown.umd.min.js', '/quikdown_edit.umd.min.js', '/quikchat.umd.min.js'])
  .then(function() { initApp(); });

// Or individual:
await bw.loadScript('/quikdown.umd.min.js');
```

### 12. `bw.DOM()` vs `bw.createDOM()` naming is confusing

**Problem:** These two functions do very different things but have similar names:
- `bw.DOM(selector, taco)` — renders TACO into an existing DOM element (replaces content)
- `bw.createDOM(taco)` — creates a detached DOM element from TACO (returns it)

The distinction isn't obvious from the names. We had to read the source to figure out which to use.

**Suggestion:** Rename or alias for clarity:
- `bw.renderInto(selector, taco)` instead of `bw.DOM()`
- `bw.createElement(taco)` instead of `bw.createDOM()`

Or keep the current names but add clear documentation distinguishing them.

### 13. `client.render()` is all-or-nothing — no append/prepend

**Problem:** `client.render(selector, taco)` replaces the entire content of the target element. For use cases where you want to add content without destroying existing content (e.g., adding a notification, appending a list item), the only option is `client.patch()` — but patch is for updating existing elements, not adding new ones.

**Suggestion:**
```js
client.render('#app', taco);              // replace (current behavior)
client.renderAppend('#app', taco);        // append child
client.renderPrepend('#app', taco);       // prepend child
client.renderBefore('#some-el', taco);    // insert before
client.renderAfter('#some-el', taco);     // insert after
```

### 14. No error feedback from `client.call()` / `client.register()`

**Problem:** If a registered function throws an error on the client side, the server has no way to know. Errors appear in the browser console but the server continues as if everything succeeded.

In our app, if `window._luiChat` is undefined (e.g., script failed to load), `luiCreateMsg` silently fails and the server keeps streaming tokens to a nonexistent message.

**Suggestion:** An error channel back to the server:
```js
client.on('error', function(err) {
  console.error('Client-side error in ' + err.functionName + ':', err.message);
});
```

### 15. First-party examples showing bwserve + third-party client libraries

**Problem:** All bwserve examples use only bitwrench's own TACO components. There's no example showing the recommended pattern for integrating third-party client-side libraries (chart libs, editors, chat widgets, etc.).

The pattern we discovered — `client.register()` a bootstrap function that dynamically loads scripts via `bw.createDOM()`, then initializes the library — works well but isn't documented anywhere. Developers will hit the same shell customization wall we did and may give up before finding this workaround.

**Suggestion:** Add an example to the docs or examples/ dir showing:
1. Using `opts.static` to serve third-party library files
2. Using `client.register()` to bootstrap a third-party widget
3. Using `client.call()` to interact with it from the server
4. Using `fetch()` to the action URL for client→server communication
