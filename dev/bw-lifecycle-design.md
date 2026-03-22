# Bitwrench V2 Component Lifecycle Design

**Status**: Active design (discussion + prototype)
**Author**: Claude + Manu Chatterjee
**Date**: March 2026
**Prototype**: `src/exp_html_hydrate/core.js` (73 tests passing)

---

## The Problem

Bitwrench v2 grew organically. Functions accumulated responsibilities.
`bw.DOM()` does mount + replace + cleanup. `bw.createDOM()` does Level 1
DOM creation AND proto-Level 2 lifecycle setup. `data-*` attributes crept
in from React/Vue patterns. A global function registry leaks memory.
Three different reactive patterns coexist (`o.mounted/o.render` on TACO,
`bw.component()` with ComponentHandle, `bw.renderComponent()` with plain
handles).

This document defines the clean lifecycle model that will finalize
bitwrench v2.x for the long term.

---

## The Lifecycle: Spark to Ash

Every bitwrench component follows five stages:

```
idea -> taco -> node -> mounted -> deleted
```

### Stage 0: Idea (TACO as Data)

A factory returns a TACO -- a plain JS object. No DOM, no side effects,
no handles, no registry entries.

```javascript
var card = bw.makeCard({title: 'Status', content: 'OK', variant: 'success'});
// card = {t:'div', a:{class:'bw_card bw_success bw_uuid_xxx'}, c:[...], o:{...}}
```

TACO is bitwrench's unique advantage. No other mainstream framework has
a portable, serializable, inspectable component representation that works
in any JS environment. A Python server, a Rust microservice, an LLM, an
ESP32 -- they all can emit `{t:'div', c:'hello'}`.

At this stage you can: serialize to JSON, send over SSE, store in a
database, transform programmatically, nest inside other TACOs, pass to
`toHtml()` for string output.

### Stage 1: Node (hydrate)

`hydrate(taco)` converts TACO data into a live DOM subtree. Event
handlers become `addEventListener` calls. Components get handles with
promoted methods. But nothing is in the document yet -- it is a
detached tree.

```javascript
var table = hydrate(bw.makeTable({data: [...], sortable: true}));
// table = {el: <table>, uuid: 'bw_uuid_xxx', addRow: fn, sort: fn, ...}
```

For plain TACOs (no `o.methods`, no `o.state`), hydrate returns
`{el: <Element>}` -- just the DOM node, no handle, no UUID.

For components (TACO with `o.methods`, `o.state`, or lifecycle hooks),
hydrate returns a handle with:
- `el`: the root DOM element
- `uuid`: the component's UUID class
- `get(key)`, `set(key, val)`, `getState()`: state access
- Promoted methods from `o.methods`

This separation matters:
- You can hydrate, configure, then mount later
- You can hydrate multiple components then compose them
- Methods work before mount (they operate on handle state, not DOM)

### Stage 2: Mounted (mount)

`mount(selector, content)` finds a target element, cleans up its old
content, and inserts new content. Fires `mounted` hooks for all
components in the subtree.

```javascript
mount('#app', table);
// table.mounted = true
// table's mounted hook fires
```

This is a separate function from hydrate because mounting is a side
effect (DOM mutation) while hydration is construction.

### Stage 3: Live (methods, state, events)

While mounted, the component's handle is the API surface:

```javascript
table.addRow(['NewHost', 'online', '99.9%']);
table.sort('name');
table.get('sortCol');  // 'name'
```

Communication between components uses pub/sub (app-scoped) or
`bw.message()` (targeted dispatch):

```javascript
// Pub/sub (broadcast)
bw.sub('data:refresh', function(newData) {
  table.set('data', newData);
}, table.el);  // auto-unsubs when table is cleaned up

bw.pub('data:refresh', freshData);

// Message dispatch (targeted, used by bwserve SSE)
bw.message('bw_uuid_xxx', 'addRow', ['NewHost', 'online']);
```

### Stage 4: Deleted (cleanup)

`cleanup(el)` tears down a component and all its descendants:
1. Fires `unmount` hooks
2. Removes event listeners (tracked on the element, not global)
3. Unsubscribes pub/sub tied to the element
4. Deregisters handle from UUID registry
5. Sets `handle.el = null`

State is gone. Handle becomes inert. If the user nulls the handle
variable, all closure references are released for GC.

---

## Function Separation

Clear responsibilities, no overloading:

| Function | Input | Output | Side effects |
|----------|-------|--------|-------------|
| `make*()` | props | TACO object | None |
| `toHtml()` | TACO | HTML string | None |
| `hydrate()` | TACO | DOM subtree + handle | Creates DOM nodes, registers handle |
| `mount()` | selector + content | handle | Cleans old content, inserts into DOM, fires hooks |
| `cleanup()` | element | void | Fires unmount, removes listeners, deregisters |
| `getHandle()` | UUID or CSS selector | handle | None (read-only lookup) |
| `pub/sub` | topic + data | count | Calls subscriber functions |
| `message()` | target + action + data | boolean | Calls method on target component |

`toHtml()` is a completely separate path. No handles, no registry, no
DOM. Pure function: TACO in, string out. Function attributes are skipped
(they are a hydrate-path concern). String onclick attributes pass through
for static pages with inline handlers.

---

## UUID and Class-Based Addressing

### No data-* Attributes

Bitwrench v1 never used `data-*` attributes. They crept into v2 from
React/Vue patterns. They violate bitwrench's own philosophy:

> DOM IS the registry. querySelector on classes = native C++ speed.

All addressing uses CSS classes:

| Purpose | Class pattern | Lookup |
|---------|--------------|--------|
| Component UUID | `bw_uuid_xxx` | `.bw_uuid_xxx` |
| Component marker | `bw_is_component` | `.bw_is_component` |
| BCCL type marker | `bw_is_component_bccl_table` | `.bw_is_component_bccl_table` |
| Style | `bw_card`, `bw_primary` | `.bw_card` |

No `data-bw_id`. No `data-bw_ref`. No `data-bw_when`. Classes only.

### UUID Assignment Rules

- **Components** (TACO with `o.methods`, `o.state`, or lifecycle hooks):
  UUID assigned at factory time. Always has `bw_is_component` class.
- **BCCL components**: additionally get `bw_is_component_bccl_<type>` class.
- **Plain DOM nodes** (`{t:'p', c:'text'}`): no UUID, no marker class,
  no handle. They live and die with their parent.

A component's UUID is its identity regardless of where or when it
materializes. The same UUID can be used to find a component via CSS
query, recover its handle, or target it with `bw.message()`.

---

## Event Handlers: On the Element, Not Global

### The Problem with funcRegistry

The current `bw.funcRegister()` stores functions in a global map. When
an element is deleted, its functions remain in the registry forever.
The closures prevent GC of captured variables. This is a memory leak
that worsens with every `bw.DOM()` re-render.

### The Solution

For the hydrate/mount path: event handlers are attached via
`addEventListener` directly on the DOM element. The element's
`_bw_listeners` array tracks them for cleanup. When `cleanup()` runs,
it calls `removeEventListener` for each. When the element is GC'd,
the listeners and their closures go with it. No global registry, no
leak, no refcounting.

For the `toHtml()` path: function attributes are skipped entirely.
`toHtml()` is for static output -- SSR, email, static sites. If you
want interactive handlers, use `hydrate()`.

For `bw.htmlDoc()` (full self-contained page generation): an optional
scoped registry object is passed in and serialized as a `<script>` block
in the output. No global state -- the caller owns the registry.

### Closures

When `cleanup()` removes event listeners from an element:
1. The listener function is dereferenced by the element
2. When the element is GC'd, the listener function can be GC'd
3. Variables captured by the closure can be GC'd (if no other refs)

This is standard JS GC behavior. No special handling needed. The key
insight: **attaching functions to elements (via addEventListener) gives
them the same lifetime as the element.** When the element dies, the
functions die. This is what we want.

Method closures on the handle survive cleanup (handle is a JS object,
not a DOM node). The user must null the handle reference for full GC.
This mirrors desktop patterns -- releasing a window handle (MFC
`DestroyWindow`, Qt `deleteLater`) requires the caller to stop holding
the pointer.

---

## Component Discovery

### Pre-hydrate What You Need (Approach 3)

The cleanest pattern for building interactive pages:

```javascript
// Hydrate the components you want handles for
var nav   = hydrate(bw.makeNavbar({brand: 'MyApp', items: [...]}));
var table = hydrate(bw.makeTable({data: [...], sortable: true}));
var stats = hydrate(bw.makeStatCard({label: 'Users', value: 1234}));

// Compose with plain TACOs
mount('#app', {
  t: 'div', a: {class: 'dashboard'}, c: [
    nav,
    {t: 'h1', c: 'Dashboard'},       // plain TACO, no handle needed
    table,
    {t: 'div', a: {class: 'bw_row'}, c: [
      stats,
      bw.makeStatCard({label: 'Revenue', value: 56789})  // no handle kept
    ]},
    {t: 'footer', c: '(c) 2026'}     // plain TACO
  ]
});

// Handles are ready
table.addRow(['NewHost', 'online']);
nav.setActive('dashboard');
stats.set('value', 1235);
```

The user decides what needs a handle. Plain TACOs stay as data until
hydration happens internally during mount. Components the user does not
need handles for still get UUIDs and can be found later.

### Discovering Components After the Fact

If you did not pre-hydrate a component, or if components were added
dynamically after mount, you can always find them:

```javascript
// Find ALL components in the page
var allComponents = document.querySelectorAll('.bw_is_component');

// Find all BCCL tables
var tables = document.querySelectorAll('.bw_is_component_bccl_table');

// Get the handle from any component element
var handle = tables[0]._bwHandle;
handle.addRow([...]);

// Or use getHandle with a CSS selector
var nav = getHandle('.bw_is_component_bccl_navbar');
nav.setActive('settings');

// Or use getHandle with a UUID directly
var widget = getHandle('bw_uuid_abc123');
```

This works because:
1. Every component has `bw_is_component` in its class (discoverable)
2. BCCL components additionally have `bw_is_component_bccl_<type>` (typed discovery)
3. Every component element has `_bwHandle` back-reference (handle recovery)
4. Every handle is registered in the UUID map (direct lookup)

**The DOM IS the registry.** You do not need to maintain a separate
component tree or context object. `querySelectorAll('.bw_is_component')`
returns every component in the document in one native C++ call. From any
component element, you reach its handle in one property access.

This means deeply nested components in complex pages are always reachable.
A dashboard with 50 components -- some pre-hydrated, some created
dynamically by other components, some injected by bwserve SSE -- are all
discoverable the same way. No component is "lost" because you forgot to
save its handle at creation time.

---

## Single TACO Pages

For simple or static pages, you can build the entire page as one TACO:

```javascript
bw.DOM('#app', {
  t: 'div', c: [
    bw.makeNavbar({brand: 'Blog'}),
    bw.makeCard({title: 'Post 1', content: 'Lorem ipsum...'}),
    bw.makeCard({title: 'Post 2', content: 'Dolor sit amet...'}),
    {t: 'footer', c: '(c) 2026'}
  ]
});
```

No handles saved, no variables needed. For static generation, this is
`toHtml(pageTaco)` -- one call produces the entire page HTML. This is
the 80% use case: dashboards that render once from server data, admin
panels, documentation, marketing sites, email templates.

---

## No Template Directives

### Why bw.when and bw.each Are Unnecessary

React needs `{condition && <Component />}` because JSX is a template
syntax that compiles to function calls. Vue needs `v-if` and `v-for`
because templates cannot execute arbitrary JS. Jinja needs `{% if %}`
and `{% for %}` because it is a text template engine.

Bitwrench builds TACOs in plain JavaScript. You have the full language:

```javascript
// Conditional rendering -- just JS
var content = [];
if (isLoggedIn) {
  content.push({t: 'p', c: 'Welcome, ' + user.name});
} else {
  content.push({t: 'a', a: {href: '/login'}, c: 'Log in'});
}

// List rendering -- just .map()
var rows = data.map(function(row, i) {
  return {t: 'tr', a: {class: i % 2 ? 'even' : 'odd'}, c: [
    {t: 'td', c: row.name},
    {t: 'td', c: String(row.score)}
  ]};
});

// Complex pipeline -- try this in a Vue template
var topCards = items
  .filter(function(x) { return x.score > threshold; })
  .sort(function(a, b) { return b.score - a.score; })
  .slice(0, 10)
  .map(function(x) {
    return bw.makeCard({
      title: x.name,
      variant: x.score > 90 ? 'success' : 'warning'
    });
  });
```

`bw.when()` and `bw.each()` existed because the ComponentHandle binding
system needed declarative markers to know what to re-evaluate on state
change. They reimplemented `if` and `for` as data structures -- which is
exactly what template engines do because they lack access to JS control
flow.

Bitwrench is not a template engine. TACO is built with JS. Use JS.

### What About Reactive Updates?

If a list needs to update when data changes, the component's method
handles it:

```javascript
o: {
  methods: {
    setData: function(h, newData) {
      h._state.data = newData;
      // Rebuild tbody from new data
      var tbody = h.el.querySelector('tbody');
      tbody.innerHTML = '';
      for (var i = 0; i < newData.length; i++) {
        var tr = document.createElement('tr');
        // ... build row ...
        tbody.appendChild(tr);
      }
    }
  }
}
```

This is explicit, obvious, debuggable. You read the method and know
exactly what happens. No binding compiler, no dependency graph, no
structural-vs-content binding distinction. Just code.

---

## No Reactive Bindings (${expr})

### The Cost vs Benefit

The current ComponentHandle `${expr}` binding system provides:
- Write `c: 'Count: ${count}'` in a TACO
- Call `handle.set('count', 42)` and the DOM auto-updates

This requires:
- `_compileBindings()`: walk TACO tree, extract expressions, build deps
- `_resolveBindings()`: evaluate expressions against state
- `_applyPatches()`: find DOM refs, apply changes
- `_scheduleDirty()` / `_flush()`: microtask batching
- Ref attributes on DOM elements for targeted patching
- `_prevValues` diff cache
- Structural vs content binding distinction

That is ~300 lines of machinery to avoid writing:
```javascript
h.el.querySelector('.count').textContent = 'Count: ' + h._state.count;
```

### The Method Alternative

Methods replace bindings with explicit, obvious code:

```javascript
o: {
  state: { count: 0 },
  methods: {
    setCount: function(h, val) {
      h._state.count = val;
      h.el.querySelector('.count').textContent = 'Count: ' + val;
    }
  }
}
```

More code per component, but:
- No binding compiler
- No dependency tracking
- No dirty scheduling
- No ref attribute infrastructure
- You can read the method and know exactly what DOM changes
- Arbitrary logic in updates (conditionals, derived values, animation)
- Debuggable: set a breakpoint in the method

This follows the north star: components own their rendering (Principle 2).
The method IS the rendering logic. MFC `CButton::SetWindowText()` does
not go through a binding compiler -- it updates the control directly.

### When Bindings Might Still Make Sense

Server-driven UI where the server sends state updates and the client
auto-resolves: `{type:'state', target:'dashboard', data:{count:42}}`.
With bindings, the client needs zero component-specific code.

But the alternative is equally clean:
`{type:'message', target:'dashboard', action:'setCount', data:42}`.
The server names the method. The client dispatches. Same number of lines
on both ends.

**Decision: bindings are deferred.** The method pattern covers all use
cases with simpler, more debuggable code. Bindings can be added later
as an optimization if a pattern emerges where they provide clear value.

---

## Factory Methods Define the Component API

### The Pattern

BCCL factories return TACOs with `o.methods` that define the component's
public API. `hydrate()` promotes these methods to the handle.

```javascript
bw.makeTable = function(props) {
  return {
    t: 'table',
    a: {class: 'bw_table bw_uuid_' + bw.uuid()},
    c: buildTableContent(props),
    o: {
      state: {
        data: props.data,
        columns: props.columns,
        sortCol: null,
        sortDir: 1
      },
      methods: {
        addRow: function(h, row) {
          h._state.data.push(row);
          var tr = document.createElement('tr');
          for (var i = 0; i < row.length; i++) {
            var td = document.createElement('td');
            td.textContent = row[i];
            tr.appendChild(td);
          }
          h.el.querySelector('tbody').appendChild(tr);
        },
        removeRow: function(h, index) {
          h._state.data.splice(index, 1);
          var rows = h.el.querySelectorAll('tbody tr');
          if (rows[index]) rows[index].remove();
        },
        sort: function(h, col) {
          // sort h._state.data by col, rebuild tbody
        },
        getData: function(h) {
          return h._state.data.slice();
        }
      },
      mounted: function(h) {
        // wire <th> click handlers -> h.sort(colIndex)
      },
      unmount: function(h) {
        // cleanup if needed
      }
    }
  };
};
```

### What This Means

The factory IS the component definition. Structure + state + behavior +
API in one object. This is the MFC/Qt/Swing pattern:

| Framework | Component definition |
|-----------|---------------------|
| MFC | CListCtrl class (data + methods + message handlers) |
| Qt | QTableWidget class (model + delegates + signals/slots) |
| Swing | JTable class (model + renderer + listeners) |
| Bitwrench | makeTable() factory (TACO + state + methods + hooks) |

### Static vs Interactive Components

Not all factories need methods:

- **Static**: `makeCard`, `makeBadge`, `makeAlert` (no dismissible) --
  pure TACOs, no UUID, no handle. Just structure and style.
- **Interactive**: `makeTable`, `makeTabs`, `makeAccordion`, `makeDropdown` --
  TACOs with methods, UUID, handle.

The `isComponent()` check is the dividing line: does the TACO have
`o.methods`, `o.state`, or lifecycle hooks? If yes, it is a component
and gets a UUID + handle. If no, it is a plain TACO that lives and dies
with its parent DOM node.

### Why Factories Get Bigger

Adding `o.methods` to factories makes them longer. But the method code is
not new code -- it is code that exists today, scattered across:
- `o.mounted` closures (click handlers that manipulate DOM)
- External caller code (`el.querySelector('.tab-pane').style.display = ...`)
- The never-written code that users wish they had ("how do I add a row?")

Moving it into the factory consolidates the component's behavior in one
place. Reading `makeTable`, you see structure, state, and API together.
Self-documenting.

---

## toHtml(): The Separate String Path

`toHtml()` is a pure function: TACO in, HTML string out.

- No handles created
- No UUID registry entries
- No global function registry pollution
- No DOM required
- Function attributes skipped (they are a hydrate-path concern)
- String attributes pass through (`onclick="alert('hi')"` works)

For full self-contained pages, `bw.htmlDoc()` accepts an optional scoped
function registry that is serialized into a `<script>` block in the
output. The registry is passed in by the caller, not stored globally.

```
toHtml(taco)     -> HTML string. Pure, no side effects.
hydrate(taco)    -> DOM nodes + handle. Functions become addEventListener.
htmlDoc(taco, opts) -> Full HTML page with embedded runtime + func registry.
```

---

## bw.message(): SendMessage for the Web

```javascript
function message(target, action, data) {
  var handle = getHandle(target);
  if (!handle || typeof handle[action] !== 'function') return false;
  handle[action](data);
  return true;
}
```

Three lines. Finds a component by UUID or CSS class, calls a method.

The value is bwserve. The server sends:
```json
{"type":"message", "target":"dashboard_prod", "action":"addAlert", "data":{"text":"CPU spike"}}
```

The client dispatches: `bw.message(msg.target, msg.action, msg.data)`.
The server does not know anything about the DOM. It names a component
and an action. This is Win32 `SendMessage(hwnd, msg, wParam, lParam)`
for the web.

---

## What Changes in bitwrench.js

### Remove
- `bw.renderComponent()` and all `create*()` wrappers (third reactive path)
- `bw.when()` and `bw.each()` (template directives)
- `${expr}` binding compilation (`_compileBindings`, `_resolveBindings`,
  `_applyPatches`, `_prevValues`, dirty tracking)
- All `data-bw_id`, `data-bw_ref`, `data-bw_when` attribute usage
- Global `funcRegistry` usage in `bw.html()` (toHtml path stays pure)

### Rename / Restructure
- `bw.createDOM()` -> internal only (not public API)
- `bw.DOM()` -> simplified: cleanup old, hydrate new, mount
- `bw.html()` -> becomes pure like `toHtml()` (no funcRegistry side effects)

### Add / Promote
- `bw.hydrate(taco)` -> public API for creating DOM + handle without mounting
- `o.methods` promotion in BCCL factories
- Class-based addressing throughout (replace all data-* attributes)
- `_bw_listeners` tracking on elements for cleanup
- `getHandle(selector)` for component discovery

### Keep
- `bw.component(taco)` -> still works for Level 2 user-defined components
- `bw.patch()` / `bw.update()` -> low-level escape hatches
- `bw.pub()` / `bw.sub()` -> app-scoped pub/sub
- `bw.emit()` / `bw.on()` -> DOM-scoped events
- `bw.message()` -> component-targeted dispatch
- `bw.cleanup()` -> teardown
- `bw.htmlDoc()` -> full page generation (with scoped func registry)

---

## Prototype Status (Phase 2 -- BCCL + bwserve)

### File inventory

| File | Lines | What |
|------|-------|------|
| `src/exp_html_hydrate/core.js` | 874 | Lifecycle engine: hydrate, mount, cleanup, toHtml, raw, message, emit/on, patch, pub/sub |
| `src/exp_html_hydrate/factories.js` | 690 | 4 BCCL factories: makeButton, makeCard, makeTabs, makeTable |
| `src/exp_html_hydrate/apply.js` | 202 | Protocol dispatcher: 9 bwserve message types |
| `test/exp_html_hydrate_test.js` | 1383 | 150 tests, all passing |
| **Total** | **3149** | |

### What's implemented

**Core lifecycle** (874 lines):
- `uuid()`, `isComponent()`, `hydrate()`, `mount()`, `cleanup()`
- `getHandle()`, `toHtml()`, `escapeHtml()`, `raw()`
- `message()` -- SendMessage dispatch (5 lines, no glue)
- `emit()` / `on()` -- DOM-scoped CustomEvents with bw: prefix
- `patch()` / `patchAll()` -- lightweight targeted DOM updates
- `pub()` / `sub()` with element-tied lifecycle
- `_cleanupChildren()` -- mount-safe cleanup (preserves target)
- Non-component listener cleanup -- walks ALL descendants, not just `.bw_is_component`
- `_resolveElement()` -- CSS selector, UUID string, or element

**BCCL factories** (690 lines, 4 factories):
- `makeButton` -- Tier 1 static TACO (no UUID, no handle, no methods)
- `makeCard` -- Tier 1 static TACO (structural only)
- `makeTabs` -- Tier 3 component: `setActive(index)`, `getActive()`, keyboard nav
- `makeTable` -- Tier 3 component: `addRow()`, `removeRow()`, `sort()`, `getData()`, `setData()`, `getSelectedRows()`
- All internal event wiring in mounted hooks (no inline onclick for internal events)
- TACOs are fully JSON-serializable -- server-sent components work with zero changes

**Protocol dispatcher** (202 lines):
- All 9 message types: replace, append, remove, patch, batch, message, register, call, exec
- `setAllowExec()` security gate
- Client function registry

### Tests (146, all passing)

| Section | Count | What |
|---------|-------|------|
| Stage 0: TACO data | 7 | isComponent detection |
| Stage 1: hydrate | 17 | Elements, handles, events, attrs, UUID |
| raw() | 6 | Marker, hydrate, toHtml |
| Stage 2: mount | 8 | Mounting, hooks, cleanup, nesting |
| Stage 3: live | 6 | Methods, state, events, discovery |
| message() | 4 | UUID, CSS, unknown target/action |
| emit/on | 3 | Events, bubbling, cleanup tracking |
| patch/patchAll | 6 | Text, attr, TACO, raw, batch |
| pub/sub | 6 | Subscribe, unsub, lifecycle, errors |
| Stage 4: cleanup | 7 | Unmount, listeners, handles, cascade, non-component |
| Approach 3 | 3 | Compose, handle recovery |
| getHandle | 3 | UUID, CSS, null |
| toHtml | 12 | Tags, attrs, escaping, self-closing, functions |
| Utilities | 3 | escapeHtml, uuid, variantClass |
| makeButton | 6 | Static TACO, shorthand, sizes, events |
| makeCard | 7 | Structure, variants, images, sections |
| makeTabs | 11 | Component, methods, keyboard, mounted handler, JSON-serializable, cleanup |
| makeTable | 16 | Component, addRow, sort, setData, columns, indicators, mounted handler, JSON-serializable, selectable |
| makeTableFromArray | 2 | Array conversion |
| apply() dispatcher | 13 | All 9 msg types + edge cases |
| End-to-end bwserve | 3 | Dashboard, chat, component replacement |

---

## Glue Code Analysis

This section documents where the o.methods pattern required extra code
("glue") to bridge factory time (TACO creation) and runtime (DOM interaction).
The user specifically asked to document this.

### ~~Glue pattern 1: onclick -> handle bridge~~ ELIMINATED

**Original problem**: Tab/header onclick handlers needed to call a method
on the component handle. But at factory time, no handle exists yet.

**Original solution**: Inline onclick closures used `closest()` +
`_bwHandle` to find the handle at click time (3 lines per handler).

**Refactored solution**: All internal event handlers are wired in the
`mounted` hook, where the handle `h` already exists and is captured by
closure. No `closest()`, no `_bwHandle` lookup.

```javascript
mounted: function(h) {
  var tabBtns = h.el.querySelectorAll('[role="tab"]');
  for (var i = 0; i < tabBtns.length; i++) {
    (function(idx) {
      tabBtns[idx].addEventListener('click', function() { h.setActive(idx); });
    })(i);
  }
}
```

**Cost**: Zero glue. The mounted hook is the right place for this.
**Benefits**:
1. TACOs are fully JSON-serializable (no function attrs for internal events)
2. Server-sent TACOs work with zero changes -- the mounted hook wires
   handlers after hydrate, regardless of how the TACO arrived
3. No need for closest() traversal or _bwHandle lookup
4. Factory code is shorter (helpers become purely structural)

**Verdict**: The bridge was always a workaround for wiring events at factory
time when no handle existed. The mounted hook is the correct abstraction.

### Glue pattern 2: DOM-building in methods (~15-30 lines)

**Problem**: Methods like `addRow()`, `sort()`, `setData()` need to
create or rebuild DOM elements. This duplicates the factory's initial
TACO -> DOM logic.

**Solution**: Shared helpers (`_rebuildTbody`, `_makeRow`) and direct
DOM manipulation inside methods:

```javascript
addRow: function(h, rowObj) {
  h._state.data.push(rowObj);
  var tbody = h.el.querySelector('tbody');
  var tr = document.createElement('tr');
  for (var i = 0; i < cols.length; i++) {
    var td = document.createElement('td');
    td.textContent = String(rowObj[cols[i].key] || '');
    tr.appendChild(td);
  }
  tbody.appendChild(tr);
}
```

**Cost**: makeTable methods total ~60 lines of DOM code. Initial TACO
structure is ~40 lines. So methods are 1.5x the initial build.
**Verdict**: Unavoidable. MFC `CListCtrl::InsertItem()` also builds
display structures. The alternative (full re-render via hydrate) would
work but wastes DOM recycling. Methods doing targeted updates are the
right pattern per north star principle 2 (components own rendering).

### Glue pattern 3: mounted hook for keyboard (clean)

**Problem**: Keyboard navigation needs `addEventListener` on a child
element (the tablist). This listener must be tracked for cleanup.

**Solution**: The mounted hook adds the listener and pushes it to the
child element's `_bw_listeners` array:

```javascript
mounted: function(h) {
  var tablist = h.el.querySelector('[role="tablist"]');
  h._keyHandler = function(e) { /* keyboard logic */ };
  tablist.addEventListener('keydown', h._keyHandler);
  if (!tablist._bw_listeners) tablist._bw_listeners = [];
  tablist._bw_listeners.push({ event: 'keydown', fn: h._keyHandler });
}
```

**Cost**: 3 extra lines to track the listener for cleanup.
**Verdict**: Clean. The mounted hook IS the right place for DOM-dependent
setup. The listener tracking integrates perfectly with cleanup().

### Glue pattern 4: state includes "internal" data (clean)

**Problem**: Methods need access to column definitions, selectable flag,
etc. These aren't "user visible" state but methods need them.

**Solution**: Store in `o.state` alongside user state:

```javascript
state: {
  data: data.slice(),       // user visible
  columns: columns,         // internal (methods need this)
  sortCol: null,            // internal
  sortDir: 'asc',           // internal
  selectable: selectable    // internal
}
```

**Cost**: Zero extra code. State is just an object.
**Verdict**: Clean. MFC stores internal state in member variables too.
No separation needed between "public" and "private" state at this level.

### What did NOT require glue (pleasantly clean)

1. **message()**: 5 lines total. getHandle + method call. No glue.
2. **emit/on**: Standard CustomEvent. Tracked via `_bw_listeners`. No glue.
3. **patch/patchAll**: Direct DOM updates via _resolveElement. No glue.
4. **apply() dispatcher**: 80 lines of clean case dispatch. Each case maps
   directly to a lifecycle function. No adapter code, no transformations.
5. **raw()**: Marker object + innerHTML in hydrate + passthrough in toHtml.
   6 lines total implementation. No glue.
6. **Static factories** (makeButton, makeCard): Zero lifecycle code.
   Pure data transformation. Exactly the same complexity as before.
7. **Non-component cleanup**: Adding `getElementsByTagName('*')` walk
   to cleanup was trivial (4 lines). Fixes the listener leak for plain
   nodes with handlers.

### Summary verdict

The o.methods pattern adds **~60 lines of DOM-building code per complex
component** (makeTable). The onclick -> handle bridge was eliminated by
moving all internal event wiring to the mounted hook where `h` is already
available. Static components (makeButton, makeCard) have zero overhead.

For a library with 48 factories:
- ~24 static factories: zero overhead, zero glue
- ~14 items-array factories: ~15-20 lines of DOM code per factory for
  add/remove/update methods
- ~10 behavioral factories: ~30-60 lines per factory
- Internal event handlers: mounted hook wires them (zero per-handler glue)

Estimated total method code across all 48 factories: ~600-800 lines.
This replaces ~300 lines of binding machinery (`_compileBindings`,
`_resolveBindings`, `_applyPatches`, dirty tracking) that would be
needed for ALL components. The method approach front-loads work into
the factories that need it, while static factories pay nothing.

**Key win**: All factory TACOs are now fully JSON-serializable for internal
events. User-provided callbacks (e.g. makeButton onclick, onRowClick) still
use inline function attributes -- those are the caller's concern. But the
library's own event wiring (tab clicks, sort clicks, selection clicks)
produces function-free TACOs that work identically whether built locally
or received from a server via bwserve SSE.

### Still not prototyped
- bw.htmlDoc() with scoped function registry
- Integration with existing bw.component() ComponentHandle
- Declarative o.events map (bwserve input/keydown handlers)
- Full 48-factory migration

---

## Summary

| Design decision | Rationale |
|----------------|-----------|
| Separate hydrate from mount | Clear responsibilities: construction vs DOM mutation |
| UUID on components only | Plain DOM nodes do not need identity tracking |
| Classes only, no data-* | DOM IS the registry. Class selectors are C++ fast. |
| Listeners on element, not global | GC-friendly. Cleanup removes listeners. No leak. |
| toHtml is pure | No side effects. String in, string out. |
| No bw.when/bw.each | JS has if/else and .map(). Template directives unnecessary. |
| No ${expr} bindings (deferred) | Methods are explicit, debuggable, and cover all cases. |
| o.methods on factories | Component owns its API. MFC/Qt/Swing pattern. |
| querySelectorAll for discovery | DOM is the registry. Deeply nested components always findable. |
| Internal events in mounted hook | Zero glue. h captured by closure. TACOs are JSON-serializable. |
| DOM-building in methods | Components own their rendering. Methods ARE the render logic. |
| Internal state in o.state | No public/private split needed. Clean. |
