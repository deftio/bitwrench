# Reactivity & Lifecycle Plan

**Version**: v2.0.15 design document
**Branch**: feature/reactivity-cleanup
**Status**: Design — no source code changes yet

---

## Section 1: Executive Summary

Bitwrench has three parallel component systems that don't communicate:

1. **47 `make*()` factories** (bitwrench-components-v2.js) — return plain TACO objects. No state management, no self-update capability.
2. **5 Handle classes** (CardHandle, TableHandle, NavbarHandle, TabsHandle, ModalHandle) — defined but unused by any public API path.
3. **`bw.renderComponent()` / `bw.render()`** (bitwrench.js:911) — separate handle factory with its own registry, only used internally by `create*()`.

The north star (Principle 2) requires: `card.set('count', 42)` auto-re-renders — the component owns its rendering. None of the three systems deliver this today.

This document specifies the unified **ComponentHandle** that replaces all three systems. It covers template bindings, targeted DOM updates, lifecycle hooks, named actions, a function registry (revived from v1), control flow helpers, and a compile path — all designed so that the same TACO definition works interpreted (zero build step) and compiled (production optimization).

---

## Section 2: Current State Inventory

### What exists

| Item | Location | Description |
|------|----------|-------------|
| `bw.compileProps(handle, props)` | bitwrench.js:873 | ODP getter/setter setup. Unused by make*() |
| `bw.renderComponent(taco)` | bitwrench.js:911 | Handle factory. Only used by create*() |
| `el._bw_refs` | bitwrench.js:672-702 | Compiled template holes, used by createDOM |
| `el._bw_state` | bitwrench.js:725 | Component state on DOM element |
| `el._bw_render` | bitwrench.js:730 | Render function on DOM element |
| `bw.update(target)` | bitwrench.js:1151 | Calls `_bw_render`, emits `bw:statechange` |
| `bw.patch(id, content, attr)` | bitwrench.js:1180 | Targeted DOM update by UUID |
| `bw._nodeMap` | bitwrench.js:69 | O(1) element cache |
| `bw.pub/sub/unsub` | bitwrench.js:1315-1389 | App-scoped pub/sub |
| `bw.emit/on` | bitwrench.js:1252-1281 | DOM-scoped events |
| `bw.cleanup()` | bitwrench.js:1078 | Lifecycle cleanup |
| Handle classes | components:1530-2266 | CardHandle, TableHandle, NavbarHandle, TabsHandle, ModalHandle — defined, unused |
| v1 func registry | src_1x/bitwrench_1x.js:2209-2290 | `funcRegister`, `funcGetById`, `funcGetDispatchStr`, `funcUnregister`, `funcGetRegistry` — dropped in v2 |

### What's missing

- Template bindings (`'${expr}'` in content/attribute strings)
- `.set()` / `.get()` on make*() returns
- Auto-re-render on state change
- Microtask batching
- Dependency tracking (which bindings depend on which state keys)
- Compile path (template → optimized update functions)
- Named actions (component-local event handlers that survive serialization)
- Function registry (for HTML string contexts, LLM wire format)

---

## Section 3: Design Decisions

### 3.1 What does make*() return?

**Decision**: ComponentHandle with a `.taco` property.

**Rationale**: Keeps TACO pure and serializable. The handle IS the component (like MFC `CButton`). `.taco` provides backward compatibility and SSR serialization. The handle adds `.get()`, `.set()`, `.on()`, `.sub()` — the component API.

### 3.2 Mount activation

**Decision**: `bw.DOM()` detects ComponentHandle (via `_bwComponent: true` marker), calls `handle.mount()`.

**Rationale**: Same object before and after mount — the MFC `CreateWindowEx` pattern. No separate "create" and "mount" steps for the user. `bw.DOM('#target', card)` just works whether `card` is a TACO or a ComponentHandle.

### 3.3 Template syntax

**Decision**: `'${expr}'` in content and attribute strings.

**Rationale**: Developers already know this syntax from template literals. It's a plain string (not an actual template literal), so it's regex-parseable, IE11 safe, and compile-friendly. No conflict in practice because TACO values are string literals, not backtick strings.

### 3.4 Expression evaluation

**Decision**: Two tiers.

- **Tier 1 (default)**: Key-path lookup only. Safe, CSP-compliant. Expressions like `'${count}'`, `'${user.name}'` — resolved by splitting on `.` and walking the state object.
- **Tier 2 (opt-in)**: `new Function()` evaluator behind `o: { compile: true }`. Expressions like `'${count > 100 ? "success" : "warning"}'` — compiled to functions.

**Rationale**: Default works everywhere including strict CSP environments. Opt-in `new Function()` for complex expressions that need arithmetic/ternary/method calls.

### 3.5 Nested reactivity

**Decision**: Shallow by default. Dot-path setter supported. Dependency tracking at top-level keys.

**Rationale**: Deep observation requires Proxy (no IE11). Dot-path setters (`card.set('user.name', 'Alice')`) handle the common nested case without Proxy. The dependency system tracks at the top-level key (`'user'`), so changing `user.name` re-evaluates all bindings that reference `user`.

### 3.6 Array reactivity

**Decision**: `card.set('items', newArray)` is the primary API. Sugar methods: `card.push('items', val)`, `card.splice('items', start, deleteCount, ...items)`.

**Rationale**: No array interception (would require Proxy). Explicit replacement follows the MFC/Swing pattern. Sugar methods are convenience wrappers that clone, mutate, and set.

### 3.7 Batching

**Decision**: Microtask batching via `Promise.resolve().then(flush)`. IE11 fallback: `setTimeout(flush, 0)`. Sync flush available via `bw.flush()`.

**Rationale**: Multiple `.set()` calls in the same synchronous block produce one re-render. `bw.flush()` allows tests and imperative code to force synchronous updates.

### 3.8 Server-side rendering

**Decision**: `bw.html(handle.taco, { state })` resolves `${expr}` patterns during HTML string generation.

**Rationale**: Same TACO works in both DOM (browser) and string (server/CLI) paths. No separate SSR component model.

### 3.9 Event handler pattern

**Decision**: Both inline functions and named actions are first-class. Named actions recommended.

**Rationale**: Named actions are serializable, auditable, and testable — essential for LLM wire format and SSR. Inline functions are convenient for prototyping. Both work in interpret mode; only named actions survive compilation and serialization.

### 3.10 Function registry

**Decision**: Component-local `actions: {}` + revived global `bw.funcRegister()`.

**Rationale**: Local actions die with the component (no memory leak). Global registry handles cross-component shared handlers, serialization to HTML string contexts, and LLM wire format. Mirrors v1 design (src_1x/bitwrench_1x.js:2209-2290) but with cleanup improvements.

### 3.11 Compile mode

**Decision**: Full spec in this document. Implement basic `bw.compile()` alongside interpret mode.

**Rationale**: Validates that interpret-mode decisions don't create compile-mode pain. The v1 function registry was designed with string serialization in mind — we need to ensure the new system maintains that property.

---

## Section 4: Five Design Rules (Compile Compatibility)

These rules ensure that TACO definitions work identically in interpret and compile modes.

### Rule 1: State schema declared up front

```javascript
o: {
  state: { count: 0, items: [], user: { name: '' } }
}
```

Dynamic keys added via `.set('newKey', val)` work in interpret mode but bypass compiled fast paths. Declare all state keys up front for best performance.

### Rule 2: Expressions are static in TACO

```javascript
// Good — static expression, compile-friendly:
c: '${count + 1}'

// Works but interpret-only — runtime expression building:
c: '${' + dynamicKey + '}'
```

The compiler extracts expressions at build time. Dynamically constructed expressions can't be pre-compiled.

### Rule 3: Handlers receive context as arguments

```javascript
// Good — serializable, compile-friendly:
actions: {
  increment: function(comp, e) { comp.set('count', comp.get('count') + 1); }
}

// Works but interpret-only — closure captures:
o: { mounted: function(el) {
  el.querySelector('button').onclick = function() { /* closure over outer scope */ };
}}
```

Closures work in interpret mode but can't be serialized or compiled. Named actions with explicit `comp` parameter are the portable pattern.

### Rule 4: Structural conditionals via `bw.when()` / `bw.each()`

```javascript
// Good — compile can analyze branches:
bw.when('${loggedIn}', loginView, logoutView)

// Escape hatch — works but interpret-only:
o: { render: function(el) { /* arbitrary logic */ } }
```

The compiler can pre-analyze `bw.when` / `bw.each` branches and generate optimized swap/diff code. Arbitrary `o.render` logic requires interpret mode.

### Rule 5: `o.render` is escape hatch, not default

Template bindings + `bw.when()` + `bw.each()` are the "compilable" path. `o.render` remains for fully custom components that need arbitrary DOM logic. If you find yourself using `o.render` for something that template bindings could handle, prefer template bindings.

---

## Section 5: ComponentHandle API

### Public Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `get` | `(key: string) → any` | Read state value. Dot-path supported: `get('user.name')` |
| `set` | `(key: string, value: any, opts?) → void` | Write state, schedule re-render. `opts.sync` for immediate |
| `getState` | `() → object` | Shallow clone of full state |
| `setState` | `(updates: object, opts?) → void` | Merge multiple keys. `opts.sync` for immediate |
| `on` | `(event: string, handler: function) → void` | DOM event listener on component root element |
| `off` | `(event: string, handler: function) → void` | Remove DOM event listener |
| `sub` | `(topic: string, handler: function) → function` | Pub/sub subscription, lifecycle-tied. Returns unsub function |
| `action` | `(name: string, ...args) → any` | Call a named action |
| `mount` | `(parentEl: Element) → void` | Create DOM, activate ODP, compile bindings |
| `unmount` | `() → void` | Remove from DOM, deactivate, preserve state |
| `destroy` | `() → void` | Unmount + clear state + unsubscribe all |
| `select` | `(selector: string) → Element\|null` | querySelector within component DOM |
| `selectAll` | `(selector: string) → Element[]` | querySelectorAll within component DOM |

### Public Properties

| Property | Type | Description |
|----------|------|-------------|
| `.taco` | object | The TACO spec (read-only, serializable) |
| `.element` | Element\|null | DOM node. `null` before mount |
| `.mounted` | boolean | Whether currently mounted |

### Internal (not part of public API)

| Internal | Description |
|----------|-------------|
| `_compileBindings()` | Walk TACO tree, extract `${expr}` patterns into binding descriptors |
| `_resolveBindings(changedKeys)` | Evaluate bindings whose deps include changedKeys |
| `_applyPatches(patches)` | Apply resolved values to DOM via `_bw_refs` |
| `_setupReactiveState()` | Wrap state keys in ODP getters/setters |
| `_onStateChange(key, newVal, oldVal)` | Called by ODP setter, marks dirty, schedules render |
| `_scheduleRender()` | Queue microtask flush |
| `_render()` | Full re-render (structural changes only) |
| `_bwComponent: true` | Duck-type marker for `bw.DOM()` detection |

---

## Section 6: Binding Compilation

### Process

Walk the TACO tree at mount time (or at compile time). For each string containing `${expr}`, create a binding descriptor:

```javascript
{
  path: [1, 0],           // position in TACO tree (content array indices)
  expr: 'count + 1',      // the expression inside ${}
  type: 'content',        // 'content' or 'attribute'
  attrName: null,         // attribute name if type === 'attribute'
  refId: 'bw_ref_3',     // data-bw-id on the target DOM node
  deps: ['count'],        // top-level state keys this expression reads
  evaluate: null          // compiled evaluator function (Tier 2) or null (Tier 1)
}
```

### Dependency extraction

For Tier 1 (key-path only): the expression IS the dependency. `'${count}'` → deps `['count']`. `'${user.name}'` → deps `['user']`.

For Tier 2 (compiled expressions): scan identifiers in the expression string. `'${count > 100 ? "success" : "warning"}'` → deps `['count']`. This is a heuristic — it extracts word-boundary identifiers that match declared state keys.

### Evaluators

**Tier 1** (default, CSP-safe):
```javascript
function evaluatePath(state, path) {
  var parts = path.split('.');
  var val = state;
  for (var i = 0; i < parts.length; i++) {
    if (val == null) return '';
    val = val[parts[i]];
  }
  return val == null ? '' : val;
}
```

**Tier 2** (opt-in, `o: { compile: true }`):
```javascript
// Created once at binding compilation time:
var evaluate = new Function('state', 'with(state){return (' + expr + ');}');
```

### DOM reference setup

At mount time, each binding target node gets a `data-bw-id` attribute with a unique ref ID. These are collected into `el._bw_refs` (the existing mechanism at bitwrench.js:672-702). On `.set(key)`, the system finds bindings whose `deps` include that key, evaluates them, and patches via the ref map.

---

## Section 7: Targeted DOM Updates

### Update flow

```
set('count', 42)
  → ODP setter fires
  → _onStateChange('count', 42, 0)
  → mark 'count' dirty
  → _scheduleRender()
  → microtask fires → flush()
    → for each dirty component:
      → _resolveBindings(dirtyKeys)
        → for each binding whose deps ∩ dirtyKeys ≠ ∅:
          → evaluate expression with current state
          → compare to previous value
          → if changed: add to patches list
      → _applyPatches(patches)
        → for each patch:
          → lookup DOM node via _bw_refs[refId]
          → content binding: el.textContent = newValue
          → attribute binding: el.setAttribute(attrName, newValue)
    → clear dirty set
```

### When full re-render is needed

Full re-render (`_render()`) is reserved for **structural changes** — when the TACO tree shape changes (e.g., `bw.when()` branch switch, `bw.each()` list mutation). Binding patches handle value-only updates.

The heuristic: if `.set()` changes a key that a `bw.when()` or `bw.each()` depends on, trigger `_render()` instead of `_applyPatches()`. If it only changes value bindings, use patches.

---

## Section 8: Lifecycle Model

```
Created
  → willMount
  → createDOM + ODP setup + binding compilation
  → didMount (= existing o.mounted)
       ↕ (reactive updates)
  willUpdate
  → resolve bindings → apply patches
  → didUpdate (= existing o.onUpdate)
       ↕ (unmount)
  willUnmount
  → cleanup subscriptions + event listeners
  → remove from DOM
  → didUnmount
  → (state preserved — can re-mount)
       ↕ (destroy)
  willDestroy
  → clear state + unsubscribe all + remove from _nodeMap
  → destroyed
```

### Hooks in TACO `o:` block

| Hook | When | Signature |
|------|------|-----------|
| `willMount` | Before DOM creation | `function(comp)` |
| `mounted` | After DOM creation and binding setup | `function(comp)` |
| `willUpdate` | Before binding re-evaluation | `function(comp, changedKeys)` |
| `onUpdate` | After DOM patches applied | `function(comp, changedKeys)` |
| `unmount` | Before DOM removal | `function(comp)` |
| `willDestroy` | Before full teardown | `function(comp)` |

### Backward compatibility

Old-style `o.mounted(el, state)` (function with 2 parameters, receiving DOM element and state) is detected via `fn.length === 2` and wrapped:

```javascript
// Old pattern:
o: { mounted: function(el, state) { el.querySelector('h3').textContent = state.title; } }

// Internally wrapped to:
function(comp) { originalFn(comp.element, comp.getState()); }
```

This allows existing code to work without changes during the migration period.

---

## Section 9: Named Actions & Function Registry

### Component-local actions

```javascript
var card = bw.makeCard({
  state: { count: 0 },
  actions: {
    increment: function(comp) {
      comp.set('count', comp.get('count') + 1);
    },
    reset: function(comp) {
      comp.set('count', 0);
    }
  },
  c: [
    { t: 'h3', c: '${count}' },
    { t: 'button', c: '+', a: { onclick: 'increment' } },
    { t: 'button', c: 'Reset', a: { onclick: 'reset' } }
  ]
});
```

- Actions registered at mount time, cleaned up at destroy
- `comp.action('increment')` callable from code
- In HTML string output: `onclick="bw.funcGetById('compId_increment')(this)"`
- Action receives `(comp, event)` — comp is the ComponentHandle, event is the DOM event

### Global function registry (revived from v1)

The v1 function registry (src_1x/bitwrench_1x.js:2209-2290) solved a real problem: event handlers in HTML string contexts. When `bw.html()` generates a string, inline functions can't be embedded — they need string-based dispatch.

Revived API:

| Function | Description |
|----------|-------------|
| `bw.funcRegister(fn, name?)` | Register globally. Auto-generates name if not provided. Returns name. |
| `bw.funcGetById(name)` | Retrieve function by registered name |
| `bw.funcGetDispatchStr(name, argStr)` | Returns string like `"bw.funcGetById('name')(args)"` |
| `bw.funcUnregister(name)` | Remove from registry. Returns boolean. |
| `bw.funcGetRegistry()` | Returns shallow copy of registry for inspection |

**Use cases:**
- Shared handlers used by multiple components
- LLM wire format (JSON → TACO with string action references)
- SSR hydration (HTML string with inline `onclick` attributes)
- Debugging and inspection

**Cleanup improvement over v1**: Component-local actions auto-unregister on destroy. Global registrations require explicit `bw.funcUnregister()`.

---

## Section 10: Control Flow Helpers

### `bw.when(expr, tacoIfTrue, tacoIfFalse?)`

Compile-friendly conditional rendering.

```javascript
bw.when('${loggedIn}',
  { t: 'span', c: 'Welcome ${user.name}' },
  { t: 'a', c: 'Log in', a: { href: '/login' } }
)
```

**Interpret mode**: Evaluates `expr` against component state. Returns the matching branch TACO. Re-evaluated on state change.

**Compile mode**: Pre-creates both branch DOM trees. On state change, swaps the active branch in/out (no re-creation). The compiler knows the exact two branches, so the swap is a single DOM operation.

**Returns**: A TACO-like object with `_bwWhen: true` marker that `bw.DOM()` and `bw.html()` recognize.

### `bw.each(expr, fn)`

Compile-friendly list rendering.

```javascript
bw.each('${items}', function(item, i) {
  return { t: 'li', c: '${item.name}', a: { 'data-id': '${item.id}' } };
})
```

**Interpret mode**: Maps over the array, calls `fn` for each item, returns array of TACOs. On state change, re-maps and diffs.

**Compile mode**: Generates optimized add/remove/reorder DOM operations. Uses `data-id` or array index for identity.

**Returns**: A TACO-like object with `_bwEach: true` marker.

### Why not just arrays in content?

Plain arrays in TACO `c:` already work for static lists. `bw.each()` adds:
1. Dependency tracking — the system knows this list depends on `'items'`
2. Identity — items can be tracked for efficient reorder
3. Compile hint — the compiler can generate diff code

For static lists, plain arrays remain the right choice.

---

## Section 11: Compile Mode

### `bw.compile(taco) → factory function`

Compiles a TACO definition into an optimized factory that produces ComponentHandles.

**Steps:**

1. **Parse expressions**: Extract all `${expr}` patterns, build binding map
2. **Separate static from dynamic**: Nodes with no bindings are static. Only dynamic nodes need tracking.
3. **Create template**: Build a `<template>` element (or document fragment for IE11) with the full DOM tree. Static content filled in, dynamic spots left as placeholders.
4. **Generate updater**: For each binding, create a direct DOM access function (not ref lookup — compiled code knows the exact path).
5. **Return factory**: `function(state) → ComponentHandle` that clones the template and wires up the updater.

### Optimizations

| Optimization | How | Speedup |
|-------------|-----|---------|
| Template cloning | `document.importNode(template, true)` vs `createElement` per node | ~3-5x for large trees |
| Static extraction | Only dynamic nodes tracked in `_bw_refs` | Fewer binding evaluations |
| Direct updates | Compiled code holds direct reference to DOM node | No querySelector/ref lookup |
| Pre-compiled evaluators | `new Function()` created once at compile time | No parse cost per update |

### When to compile

- **Runtime** (before first render): `var factory = bw.compile(taco); var card = factory(initialState);`
- **Build-time** (Node script): `var code = bw.compile.toString(taco);` → write to file
- **Server-side**: Pre-compile frequently used components, serve optimized factories

### IE11 considerations

`document.importNode` and `<template>` are supported in IE11. `new Function()` is available. The compile path works on IE11 with the same code.

---

## Section 12: make*() Evolution

### Phase 1 (v2.0.15): ComponentHandle + `bw.component()`

- Add `ComponentHandle` class with full API (Section 5)
- Add `bw.component(taco)` — creates a ComponentHandle from any TACO
- All `make*()` functions remain unchanged — still return plain TACO
- Users who want reactivity: `var card = bw.component(bw.makeCard({...}))`
- Template binding compiler operational
- Named actions + function registry operational

### Phase 2 (v2.0.16): make*() returns ComponentHandle

- All `make*()` factories return ComponentHandle instead of plain TACO
- `.taco` property provides backward compat for code that passes make*() results to `bw.html()`
- `bw.html()` detects ComponentHandle and uses `.taco`
- `bw.DOM()` detects ComponentHandle and calls `.mount()`

### Phase 3 (v2.0.17): Component-specific methods

- Handle class mixins for component-specific APIs
- `bw.makeTable()` returns handle with `.sort()`, `.filter()`, `.addRow()`
- `bw.makeModal()` returns handle with `.show()`, `.hide()`, `.toggle()`
- `bw.makeTabs()` returns handle with `.selectTab()`, `.addTab()`
- Replaces the 5 unused Handle classes (CardHandle, TableHandle, etc.) with a mixin pattern

### Component registry

```javascript
bw.components = {};   // registry, extensible by users

bw.components.card = function(props) { /* ... */ };

// Factory dispatcher:
bw.make = function(type, props) {
  var factory = bw.components[type];
  if (!factory) throw new Error('Unknown component: ' + type);
  return factory(props);
};

// Sugar (existing functions become thin wrappers):
bw.makeCard = function(props) { return bw.make('card', props); };
```

---

## Section 13: Consolidation (Remove ~525 lines)

### Lines to remove

| Remove | Location | Est. Lines | Replacement |
|--------|----------|-----------|-------------|
| `bw.renderComponent()` | bitwrench.js:911-1060 | ~150 | ComponentHandle |
| `bw.compileProps()` | bitwrench.js:873-898 | ~25 | Absorbed into ComponentHandle._setupReactiveState |
| 5 Handle classes | components:1530-2266 | ~300 | Mixins or eliminated (Phase 3) |
| `bw._componentRegistry` + `bw.render()` | bitwrench.js | ~50 | Merged into _nodeMap |
| **Total removed** | | **~525** | |

### Lines to add

| Add | Est. Lines |
|-----|-----------|
| ComponentHandle class + prototype | ~200 |
| Template binding compiler | ~80 |
| Function registry (revived from v1) | ~60 |
| Control flow helpers (bw.when / bw.each) | ~40 |
| bw.compile() basic implementation | ~80 |
| **Total added** | **~460** |

**Net change**: ~65 fewer lines. The library gets significantly more capable with near-zero size increase.

---

## Section 14: Framework Comparison

| Dimension | Bitwrench | React | Vue 2 | Svelte | Alpine | MFC | Swing |
|-----------|-----------|-------|-------|--------|--------|-----|-------|
| **Reactivity mechanism** | ODP getter/setter | Virtual DOM diff | Object.defineProperty | Compiler-generated | Proxy + Alpine.js | Message pump (WM_PAINT) | PropertyChangeListener |
| **Update granularity** | Per-binding | Subtree re-render | Per-watcher | Compiler-static | Per x- directive | Per control repaint | Per property |
| **Template syntax** | `'${expr}'` | JSX `{expr}` | `{{expr}}` | `{expr}` | `x-text="expr"` | .rc resource file | None (code) |
| **Build step required** | No | Yes (JSX) | Optional | Always | No | Yes (C++ compile) | Yes (Java compile) |
| **State location** | ComponentHandle._state | useState / this.state | data() return | Component scope vars | x-data object | Member variables | Bean properties |
| **Component identity** | **Same object pre/post mount** | New on each render | Same instance | Compiled away | DOM element | **Same object pre/post create** | **Same object** |
| **IE11 support** | Yes (ODP, no Proxy) | No (v18+) | Yes (Vue 2 only) | No | No | N/A | N/A |
| **Serializable definition** | Yes (TACO = JSON) | No (JSX = code) | Partially (.vue SFC) | No (.svelte = code) | Yes (HTML attrs) | No (.rc binary) | No (code) |

**Key differentiator**: Bitwrench shares the "same object pre/post mount" property with MFC and Swing. In React, a component is a function that runs on every render. In Vue/Svelte, the component is a compiled artifact. In bitwrench, the ComponentHandle IS the component — you hold a reference to it, call methods on it, and it persists across mounts/unmounts.

---

## Section 15: Concrete Examples

### Example 1: Simple Counter

**Inline actions (prototyping):**

```javascript
var counter = bw.component({
  t: 'div', a: { class: 'bw-card' },
  c: [
    { t: 'h3', c: 'Count: ${count}' },
    { t: 'button', c: '+', a: { class: 'bw-btn bw-btn-primary' } },
    { t: 'button', c: '-', a: { class: 'bw-btn bw-btn-secondary' } }
  ],
  o: {
    state: { count: 0 },
    mounted: function(comp) {
      var btns = comp.selectAll('button');
      btns[0].onclick = function() { comp.set('count', comp.get('count') + 1); };
      btns[1].onclick = function() { comp.set('count', comp.get('count') - 1); };
    }
  }
});
bw.DOM('#app', counter);
```

**Named actions (recommended):**

```javascript
var counter = bw.component({
  t: 'div', a: { class: 'bw-card' },
  c: [
    { t: 'h3', c: 'Count: ${count}' },
    { t: 'button', c: '+', a: { class: 'bw-btn bw-btn-primary', onclick: 'increment' } },
    { t: 'button', c: '-', a: { class: 'bw-btn bw-btn-secondary', onclick: 'decrement' } }
  ],
  o: {
    state: { count: 0 },
    actions: {
      increment: function(comp) { comp.set('count', comp.get('count') + 1); },
      decrement: function(comp) { comp.set('count', comp.get('count') - 1); }
    }
  }
});
bw.DOM('#app', counter);
```

### Example 2: Todo List (structural updates)

```javascript
var todo = bw.component({
  t: 'div', a: { class: 'bw-card' },
  c: [
    { t: 'h3', c: 'Todo (${items.length} items)' },
    { t: 'div', c: [
      { t: 'input', a: { type: 'text', placeholder: 'Add todo...', class: 'bw-form-control' } },
      { t: 'button', c: 'Add', a: { class: 'bw-btn bw-btn-primary', onclick: 'addItem' } }
    ]},
    { t: 'ul', a: { class: 'bw-list-group' }, c:
      bw.each('${items}', function(item, i) {
        return { t: 'li', a: { class: 'bw-list-group-item' }, c: [
          { t: 'span', c: '${item.text}' },
          { t: 'button', c: 'x', a: { onclick: 'removeItem', 'data-index': i } }
        ]};
      })
    }
  ],
  o: {
    state: { items: [] },
    actions: {
      addItem: function(comp) {
        var input = comp.select('input');
        if (input.value.trim()) {
          comp.push('items', { text: input.value.trim() });
          input.value = '';
        }
      },
      removeItem: function(comp, e) {
        var idx = parseInt(e.target.getAttribute('data-index'), 10);
        var items = comp.get('items').slice();
        items.splice(idx, 1);
        comp.set('items', items);
      }
    }
  }
});
bw.DOM('#app', todo);
```

### Example 3: Cross-component coordination (pub/sub)

```javascript
// Data source component
var dataSource = bw.component({
  t: 'div',
  c: { t: 'button', c: 'Fetch Data', a: { onclick: 'fetchData' } },
  o: {
    actions: {
      fetchData: function(comp) {
        // Simulate async data fetch
        setTimeout(function() {
          bw.pub('data:loaded', { users: 142, revenue: 58300 });
        }, 500);
      }
    }
  }
});

// Dashboard card — auto-updates via pub/sub
var usersCard = bw.component({
  t: 'div', a: { class: 'bw-card' },
  c: [
    { t: 'h4', c: 'Users Online' },
    { t: 'div', c: '${count}', a: { class: 'bw-display-4' } }
  ],
  o: {
    state: { count: '--' },
    mounted: function(comp) {
      comp.sub('data:loaded', function(d) {
        comp.set('count', d.users);
      });
    }
  }
});

bw.DOM('#controls', dataSource);
bw.DOM('#dashboard', usersCard);
```

### Example 4: Serializable wire format (LLM / JSON)

```javascript
// This JSON can come from an LLM, a server, or a config file:
var wireFormat = {
  "t": "div", "a": { "class": "bw-card" },
  "c": [
    { "t": "h3", "c": "${title}" },
    { "t": "p", "c": "${body}" },
    { "t": "button", "c": "Click me", "a": { "onclick": "handleClick" } }
  ],
  "o": {
    "state": { "title": "Hello", "body": "World" }
  }
};

// Register the handler globally (server knows this name):
bw.funcRegister(function(comp) {
  alert('Clicked! Title: ' + comp.get('title'));
}, 'handleClick');

// Create and mount:
var card = bw.component(wireFormat);
bw.DOM('#app', card);

// Server can update via pub/sub:
bw.pub('card:update', { title: 'Updated', body: 'From server' });
```

---

## Section 16: Open Questions (Future)

### Computed properties

Expressions like `'${count * 2}'` work via Tier 2 evaluation (new Function). True computed properties with caching (like Vue's `computed:`) are deferred. Template expressions are sufficient for now.

### Two-way form binding

`bindTo()` for form inputs — `{ t: 'input', a: { bindTo: 'name' } }` — auto-wires input events to `.set()`. Target: v2.0.16.

### SSR hydration markers

`data-bw-bind` attributes on server-rendered HTML to enable client-side hydration without re-rendering. Target: v2.1.0.

### Content array binding

Mixed TACO / string children with partial updates. Needs stable child identifiers (keys). Current approach: re-render the content array when any child changes. Optimization deferred.

### Web Component wrapper

`bw.defineElement('my-card', taco)` — registers a Custom Element backed by a ComponentHandle. Enables interop with other frameworks. Deferred until ComponentHandle is stable.

### Proxy upgrade path

When IE11 is dropped (Tier 1 → modern-only), replace ODP with Proxy for:
- Dynamic key detection (no need to declare state up front)
- Array mutation interception (no need for `comp.push()` sugar)
- Nested reactivity (deep observation)

The ComponentHandle API stays the same — only the internal mechanism changes.
