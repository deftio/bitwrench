# UUID Addressing Design — `bw.assignUUID()` / `bw.getUUID()`

Status: Draft
Version: v2.0.19 target
Date: 2026-03-14

---

## Problem

BCCL components (`makeStatCard`, `makeBadge`, `makeProgress`, etc.) return plain TACO objects with no stable identity. When a developer needs to update a specific component's value after initial render — the core use case for embedded dashboards — they must either:

1. Abandon the `make*()` component and hand-build equivalent TACO with manual `id` attributes (losing the component abstraction)
2. Re-render the entire DOM via `bw.DOM()` (losing DOM state: scroll position, open `<details>`, input focus)

This was identified independently by two external developers building real applications:
- An NFC tag scanner on an ESP32-S3 microcontroller (CircuitPython + bitwrench)
- A Streamlit-like LLM chat app (Node.js + bwserve)

Both developers wrote the same workaround: abandon `make*()`, hand-build TACO with explicit IDs, use `bw.patch()` or `bw.clientApply()` for surgical updates. Both noted this undermines the component library for its most natural audience.

## Design Principles

1. **`make*()` stays pure** — TACO factories return plain `{t, a, c, o}` objects. No magic, no side effects, no auto-assigned identity.
2. **UUID assignment is explicit** — the caller decides when a TACO gets identity.
3. **Assign once, stick forever** — once a TACO has a UUID, it is never overwritten (unless the caller explicitly forces it).
4. **UUID lives in `a.class`** — consistent with the three-class-layer design (style class, item type class, UUID class). Composes naturally with CSS selectors and querySelector.
5. **Works at any stage** — UUID can be assigned to a TACO before hydration, and read from either a TACO object or a live DOM element.

## API

### `bw.assignUUID(taco, forceNew)`

Assigns a UUID to a TACO object by appending a `bw_uuid_*` token to `taco.a.class`.

**Parameters:**
- `taco` — a TACO object `{t, a, c, o}`
- `forceNew` (optional, boolean) — if `true`, replaces any existing UUID with a new one. Default `false`.

**Returns:** the UUID string (e.g. `'bw_uuid_a1b2c3d4e5'`)

**Behavior:**
- If `taco.a` doesn't exist, creates it.
- If `taco.a.class` doesn't exist, creates it as an empty string.
- If `taco.a.class` already contains a `bw_uuid_*` token and `forceNew` is falsy, returns the existing UUID (idempotent).
- If `taco.a.class` already contains a `bw_uuid_*` token and `forceNew` is `true`, removes the old token and appends a new one.
- If no UUID exists, generates one via `bw.uuid()` and appends it to the class string.

```js
var card = bw.makeStatCard({ value: '0', label: 'Scans' });
var uuid = bw.assignUUID(card);        // 'bw_uuid_a1b2c3d4e5'
var same = bw.assignUUID(card);        // 'bw_uuid_a1b2c3d4e5' (idempotent)
var diff = bw.assignUUID(card, true);  // 'bw_uuid_f6g7h8i9j0' (forced new)
```

### `bw.getUUID(tacoOrElement)`

Reads the UUID from a TACO object or DOM element. Pure getter, no side effects.

**Parameters:**
- `tacoOrElement` — a TACO object or a DOM element

**Returns:** the UUID string, or `null` if none assigned.

**Behavior:**
- If passed a TACO object: parses `taco.a.class` for a `bw_uuid_*` token.
- If passed a DOM element: parses `el.className` for a `bw_uuid_*` token.

```js
bw.getUUID(card)     // 'bw_uuid_a1b2c3d4e5' (from TACO)
bw.getUUID(el)       // 'bw_uuid_a1b2c3d4e5' (from DOM element)
bw.getUUID({t:'div'})  // null (no UUID assigned)
```

## Internal Changes

### `bw.createDOM()` — UUID registration

During element creation, when processing the `class` attribute, scan for `bw_uuid_*` tokens. If found, register the element in `bw._nodeMap` under that token. This ensures `bw._el('bw_uuid_xxx')` hits the O(1) cache.

No UUID is auto-generated. If the TACO has no `bw_uuid_*` class, nothing happens (current behavior preserved).

### `bw._el()` — fallback for class-based UUIDs

Add one fallback path: if the lookup string starts with `bw_uuid_` and is not found in `_nodeMap` or via `getElementById`, try `document.querySelector('.' + id)`.

This is a safety net for elements created outside bitwrench APIs or after cache eviction.

### Interaction with existing systems

| System | Change needed | Notes |
|--------|---------------|-------|
| `bw.patch(id, content, attr)` | None | Uses `bw._el()`, which will find UUID-addressed elements |
| `bw.patchAll(patches)` | None | Same |
| `bw.clientApply(msg)` | None | Uses `bw._el()` for target resolution |
| `bw.update(el)` | None | Uses `bw._el()` |
| `bw.message(target, action, data)` | Minor | Use `bw._el()` first for UUID lookup, fall back to current `bw.$()` path. Enables `clientApply({ type:'message' })` with UUID targets. |
| `bw.cleanup(el)` | Minor | Should remove `bw_uuid_*` entries from `_nodeMap` |
| `data-bw_id` | None | Separate concern (lifecycle hooks). Coexists without conflict. |

## Usage Patterns

### Pattern 1: Embedded dashboard with polling

Construct once, assign UUIDs, render once, patch thereafter.

```js
// Setup (once)
var uuids = {};
var cards = ['Scans', 'Records', 'RF Field', 'Uptime'].map(function(label) {
    var card = bw.makeStatCard({ value: '--', label: label });
    uuids[label] = bw.assignUUID(card, true);
    return card;
});
bw.DOM('#stats', bw.makeRow({ children: cards }));

// Poll (every 3 seconds)
setInterval(function() {
    fetch('/api/patches').then(function(r) { return r.json(); }).then(function(data) {
        bw.patch(uuids['Scans'], data.scans);
        bw.patch(uuids['RF Field'], data.rf_active ? 'Active' : 'None');
    });
}, 3000);
```

### Pattern 2: Loop with forced new UUIDs

```js
var items = getData();
var components = [];

items.forEach(function(item) {
    var card = bw.makeCard({ title: item.name, content: item.value });
    var uuid = bw.assignUUID(card, true);  // force new — each card gets its own
    components.push({ card: card, uuid: uuid, item: item });
});

bw.DOM('#list', { t: 'div', c: components.map(function(c) { return c.card; }) });

// Update one specific card later:
bw.patch(components[2].uuid, 'new value');
```

### Pattern 3: Server-driven updates (bwserve or REST)

Server knows UUIDs (communicated during setup or hardcoded).

```python
# CircuitPython / MicroPython server
ops = [
    {"type": "patch", "target": "bw_uuid_abc123", "content": str(scan_count)},
    {"type": "patch", "target": "bw_uuid_def456", "content": uptime_str},
]
response = json.dumps({"type": "batch", "ops": ops})
```

```js
// Browser client
setInterval(function() {
    fetch('/api/patches')
        .then(function(r) { return r.json(); })
        .then(bw.clientApply);  // applies batch directly
}, 3000);
```

### Pattern 4: ndef_version pattern (conditional full re-render)

For mixed update strategies where some changes are structural:

```js
var knownVersion = -1;

function poll() {
    fetch('/api/patches').then(function(r) { return r.json(); }).then(function(data) {
        if (data.version !== knownVersion) {
            // Structural change — full re-render, re-assign UUIDs
            knownVersion = data.version;
            fetchFullState();
        } else {
            // Values only — surgical patch
            bw.clientApply(data);
        }
    });
}
```

## Levels of Commitment (updated)

| Level | What you use | Update strategy |
|-------|-------------|-----------------|
| **Level 0** | Raw TACO, `bw.DOM()` | Full re-render on change |
| **Level 0.5** | TACO + `bw.assignUUID()`, `bw.patch()` | Surgical updates by UUID |
| **Level 1** | `o.render`, `o.state`, `bw.update()` | Self-managing elements |
| **Level 2** | `bw.component()` with `.set()`, bindings | Reactive state, method dispatch |

Level 0.5 is the recommended path for embedded polling dashboards.

## Server-Driven Apps: Client Logic Patterns

### The problem

bwserve apps that need significant client-side logic currently write that logic as string literals inside `client.register()`. This works but has poor DX — no syntax highlighting, no linting, no completion, and errors surface only at runtime.

See: `.feedback/bitwrench-feedback-v2.0.17.md`, "Functions-as-strings is the #1 DX pain point"

### How other frameworks handle this

Research across 7 server-driven UI frameworks reveals 4 patterns:

| Pattern | Frameworks | How it works |
|---------|-----------|--------------|
| **Companion library** | Phoenix LiveView (hooks), Laravel Livewire (Alpine) | Client JS lives in separate `.js` files, imported by name. Server references hooks by string ID. |
| **Lifecycle hooks in files** | Blazor Server (`.razor.js`) | Co-located JS file alongside server component. Framework auto-discovers and loads it. |
| **JS as strings** | Gradio (`js=`), Vaadin (`executeJs`) | Server sends JS as string for eval on client. Same as bwserve `register()`. |
| **Separate world** | Streamlit (iframe), HTMX (minimal JS) | Client-side logic isn't the framework's concern. Use a separate JS file if needed. |

The mature solutions (LiveView, Blazor) all converge on: **real JS files, loaded by name, invoked by the framework**.

### Existing capabilities (no new code needed)

bwserve already supports the companion library pattern:

1. **Static file serving**: `bwserve.create({ static: './public' })` serves any file from a directory. Put your client JS in `./public/app.js`.

2. **Custom `<script>` tags**: The server can send any TACO to the client, including script tags:
   ```js
   client.send({ type: 'append', target: 'head', node: {
       t: 'script', a: { src: '/app.js' }
   }});
   ```
   Or inline scripts:
   ```js
   client.send({ type: 'append', target: 'body', node: {
       t: 'script', c: bw.raw('function handleClick(e) { ... }')
   }});
   ```

3. **`client.call()`**: Once a function exists on the client (via `<script>` tag or `register()`), the server invokes it by name:
   ```js
   client.call('handleClick', [{ id: 42 }]);
   // → bw.clientApply({ type: 'call', name: 'handleClick', args: [{ id: 42 }] })
   ```

4. **`bw.message()`**: Dispatches method calls to components by UUID or user tag. Already available as a `clientApply` message type:
   ```js
   client.send({ type: 'message', target: 'dashboard_prod', action: 'addAlert', data: { text: 'CPU spike' } });
   ```

**Recommendation**: For bwserve apps with substantial client logic, serve JS files via `static` option and use `client.call()` for server→client invocation. Reserve `register()` for small one-off helpers. Document this pattern clearly.

### Future concept: `clientInvoke` (document only, do not implement yet)

When a component is hydrated on the client, the browser knows its full method inventory — a `makeStatCard` has `.set()`, `.get()`, `.on()`; a `makeTable` has `.sort()`, `.filter()`, etc. This is analogous to how LLM tool calling works: the system exposes a manifest of available functions with parameter schemas, and the caller invokes them by name.

**Concept**: `bw.clientInvoke(uuid, method, args)`

The server invokes a component's method by UUID + method name, without needing to `register()` anything or know the component's internals:

```js
// Server side (Node.js)
client.invoke('bw_uuid_abc123', 'set', { value: '42' });
client.invoke('bw_uuid_def456', 'sort', { column: 'name', dir: 'asc' });

// Translates to protocol message:
// { type: 'invoke', target: 'bw_uuid_abc123', method: 'set', args: { value: '42' } }
```

```js
// Client side handler (in bw.clientApply)
// 1. Find element by UUID → bw._el('bw_uuid_abc123')
// 2. Find ComponentHandle → el._bwComponentHandle
// 3. Call method → comp.set({ value: '42' })
```

**Why this might not be needed**: `bw.message()` already does exactly this — it finds a component by UUID/tag and dispatches a method call. The `clientApply` `message` type already bridges this to the server. The only missing piece is that `bw.message()` currently looks up by `data-bw_comp_id` or CSS class, not by `bw_uuid_*` class. Once UUID addressing lands, `bw.message()` can use `bw._el()` which will find UUID-addressed elements.

**Decision**: Do not implement `clientInvoke` as a separate mechanism. Instead, ensure `bw.message()` works with UUID-addressed components (minor change to use `bw._el()` for lookup). The existing `message` protocol type then covers this use case completely.

### Method manifest (future, if needed)

If a server needs to discover what methods a remote component supports (rather than knowing ahead of time), the client could report its component inventory:

```js
// Hypothetical — NOT implementing now
bw.clientManifest('bw_uuid_abc123')
// → { type: 'StatCard', methods: ['set', 'get', 'on'], props: { value: 'string', label: 'string' } }
```

This mirrors LLM tool schemas. It would only matter for fully dynamic UIs where the server doesn't know what components exist — a niche use case. The typical bwserve app creates its own page layout and knows exactly what components it placed.

## Implementation Estimate

- `bw.assignUUID()`: ~20 lines
- `bw.getUUID()`: ~15 lines
- `createDOM()` UUID registration: ~5 lines (scan class for `bw_uuid_*`, register in `_nodeMap`)
- `_el()` fallback: ~3 lines
- `cleanup()` deregistration: ~3 lines
- `message()` UUID lookup: ~3 lines (try `bw._el()` before `bw.$()`)
- Tests: ~20 tests (assign, idempotent, forceNew, getUUID on TACO, getUUID on element, patch via UUID, clientApply via UUID, loop pattern, cleanup, message via UUID)
- Docs: update State Management, LLM guide, add "Embedded Dashboard Golden Path" recipe

Total: ~55 lines of implementation + ~100 lines of tests
