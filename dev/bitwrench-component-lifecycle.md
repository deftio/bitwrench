# Bitwrench Component Lifecycle

Complete walkthrough of a TACO component from definition to removal.
Covers every internal step bitwrench performs, with source references.

Source: `src/bitwrench.js` (v2.0.25)

---

## Core Philosophy: Build Once, Update via Member Functions

bitwrench is NOT a virtual-DOM framework. There is no diffing, no
reconciliation, no re-render-the-world model. Instead:

1. **Build** the component tree once via `bw.createDOM()` / `bw.mount()`
2. **Update** surgically via handle methods: `el.bw.setValue(42)`
3. **Communicate** between components via pub/sub or DOM events
4. **Tear down** via `bw.cleanup()` when removing from the page

This is the MFC/Swing model: you build controls, then call methods on them.
Focus, scroll position, CSS transitions, and input state are preserved
because the DOM is NOT being rebuilt. The component owns its rendering --
the caller operates through the `el.bw` API, never raw DOM.

`bw.update()` and `bw.DOM()` exist for full re-renders when needed (e.g.,
structural changes), but the primary update path is member functions.

---

## Overview

A bitwrench component is a plain JS object (TACO) that passes through these
stages:

```
TACO definition
  -> UUID assignment (optional, explicit)
  -> bw.html() for string output  -OR-  bw.createDOM() for live DOM
  -> attribute hydration (class, style, events, booleans)
  -> content processing (text, children, raw HTML)
  -> _bw_refs construction (parent->child fast lookup)
  -> node cache registration (id, UUID)
  -> lifecycle hook setup (state, render, mounted, unmount)
  -> handle/slots attachment (el.bw namespace)
  -> mount trigger (mounted callback or auto-render)
  -> updates via member functions (el.bw.method), patch, or re-render
  -> pub/sub messaging (bw.pub/bw.sub, bw.emit/bw.on)
  -> cleanup/unmount (bw.cleanup, bw.DOM re-render)
```

---

## Stage 1: TACO Definition

A TACO is a plain object with four keys:

```javascript
{
  t: 'div',                          // Tag name (required for element)
  a: { class: 'bw_card', id: 'c1' }, // Attributes (optional)
  c: 'Hello',                        // Content: string, TACO, array, bw.raw()
  o: {                               // Options: lifecycle, handle, slots
    state: { count: 0 },
    render: function(el, state) { ... },
    mounted: function(el, state) { ... },
    unmount: function(el, state) { ... },
    handle: { increment: function(el, n) { ... } },
    slots: { title: '.my_title', body: '.my_body' }
  }
}
```

At this point the TACO is inert data. No DOM, no side effects.

**Content types:**
- String: escaped by default (`bw.escapeHTML`)
- TACO object: recursively processed
- Array: each item recursively processed
- `bw.raw(str)`: bypasses escaping, returns `{__bw_raw: true, v: str}`
- null/undefined: renders as empty text node

---

## Stage 2: UUID Assignment (Optional, Explicit)

UUIDs provide addressable identity before DOM creation.

**`bw.assignUUID(taco, forceNew)`** (line 451):
1. Ensures `taco.a` exists
2. Checks `taco.a.class` for existing `bw_uuid_*` token via `_UUID_RE`
3. If found and `forceNew` is false: returns existing UUID (idempotent)
4. If `forceNew`: removes old UUID from class string
5. Generates new UUID via `bw.uuid('uuid')` -> `'bw_uuid_<10chars>'`
6. Appends UUID to `taco.a.class`
7. Returns the UUID string

**`bw.getUUID(tacoOrElement)`** (line 485):
- Pure getter, works on both TACO objects (reads `a.class`) and DOM elements
  (reads `className`). Returns null if no UUID.

UUIDs are used for:
- Node cache lookup (`bw._nodeMap[uuid]` -> DOM element, O(1))
- `_bw_refs` keys (parent->child fast access)
- `bw.sub()` lifecycle tying
- `bw._unmountCallbacks` keying
- `bw.patch()` / `bw.update()` targeting

---

## Stage 3: String Rendering Path -- bw.html()

`bw.html(taco, options)` (line 613) converts a TACO to an HTML string.
No DOM is created. Used for server-side rendering and `bw.htmlPage()`.

Processing order:
1. null/undefined -> `''`
2. Array -> map each through `bw.html()`, join
3. `bw.raw()` -> return `taco.v` verbatim
4. Non-object or missing `taco.t` -> `bw.escapeHTML(String(taco))`
5. Destructure `{t, a, c, o}`
6. Build attribute string:
   - Skip null/undefined/false values
   - Event handlers (`on*`): registered via `bw.funcRegister()`, serialized
     as `bw._fnDispatch(id, event)` string
   - `style` object: converted to `key:value;` string
   - `class` array: `.filter(Boolean).join(' ')`
   - Boolean `true`: attribute name only (no value)
   - All string values: `bw.escapeHTML()` applied
7. If lifecycle hooks exist (`o.mounted`/`o.unmount`): auto-inject UUID +
   `bw_lc` class into the class attribute (line 691)
8. Self-closing tags (`br`, `img`, `input`, etc.): `<tag attrs />`
9. Otherwise: `<tag attrs>` + recursive `bw.html(content)` + `</tag>`

**Template bindings**: If `options.state` provided, `${expr}` strings are
resolved via `bw._resolveTemplate()` in both content and attribute values.

---

## Stage 4: DOM Creation Path -- bw.createDOM()

`bw.createDOM(taco, options)` (line 908) builds a live DOM element.
This is the main path for client-side rendering.

### 4a. Input handling

1. null/undefined -> `document.createTextNode('')` (line 914)
2. `bw.raw()` -> create fragment, set innerHTML, return fragment (line 917)
3. Non-object or missing `taco.t` -> `document.createTextNode(String(taco))`
   (line 927)

### 4b. Element creation

```javascript
const { t: tag, a: attrs, c: content, o: opts } = taco;
const el = document.createElement(tag);
```

**Known gap -- SVG namespace:** `createElement()` creates HTML-namespace
elements. SVG requires `createElementNS('http://www.w3.org/2000/svg', tag)`.
Currently, SVG TACOs don't render correctly. The workaround is
`bw.raw(bw.html(svgTaco))` which round-trips through a string and lets the
browser's HTML parser handle SVG namespace. Proper fix: detect SVG context
(tag === 'svg' or parent is SVG) and use `createElementNS`, passing an
`_svgContext` flag through recursive calls so children inherit the namespace.

### 4c. Attribute hydration (line 936)

Iterates `Object.entries(attrs)`:

| Attribute type | Processing |
|---|---|
| null/undefined/false | Skipped |
| `style` (object) | `Object.assign(el.style, value)` -- direct style merge |
| `class` (string or array) | Array: `.filter(Boolean).join(' ')`. Set via `el.className` |
| `on*` (function) | `el.addEventListener(eventName, value)` -- live JS reference |
| `value` on `<input>` | `el.value = value` (property, not attribute) |
| Boolean `true` | `el.setAttribute(key, '')` |
| Everything else | `el.setAttribute(key, String(value))` |

**Key difference from bw.html():** Event handlers are live function references
(addEventListener), not serialized strings. This is why createDOM components
are interactive without a function registry.

### 4d. Content processing (line 967)

| Content type | Processing |
|---|---|
| Array | forEach: recurse `bw.createDOM(child)`, appendChild |
| `bw.raw()` object | `el.innerHTML = content.v` |
| TACO object (has `.t`) | Recurse `bw.createDOM(content)`, appendChild |
| String/number/other | `el.textContent = String(content)` (auto-escaped) |

### 4e. _bw_refs construction (line 964)

As children are appended, bitwrench builds a flat `_bw_refs` map on the
parent element for fast child lookup without DOM queries:

```
el._bw_refs = {
  'child-id':     childElement,      // from child.a.id
  'bw_uuid_xxx':  childElement,      // from bw.getUUID(child)
}
```

Grandchild refs are bubbled up one level (line 980): if a child has its own
`_bw_refs`, they are copied to the parent. This gives the root element flat
access to deeply nested addressable children.

**Ref key source** (line 974): `child.a.id || bw.getUUID(child)` -- user-
assigned id takes precedence over UUID.

### 4f. Node cache registration (line 1014)

After content processing, two cache registrations happen:

1. **By id**: If `attrs.id` exists, `bw._registerNode(el, null)` adds the
   element to `bw._nodeMap` keyed by its id.

2. **By UUID**: If `el.className` contains a `bw_uuid_*` token (line 1020),
   `bw._nodeMap[uuid] = el` provides O(1) lookup for `bw._el()`.

These caches power `bw.patch()`, `bw.update()`, `bw.message()`, and
`bw._el()` -- all resolve targets through the node cache before falling
back to `document.querySelector()`.

---

## Stage 5: Lifecycle Hook Setup (line 1027)

Triggered when `o.mounted`, `o.unmount`, `o.render`, or `o.state` exist.

### 5a. Identity ensured

```javascript
var uuid = bw.getUUID(el) || bw.uuid('uuid');
el.classList.add(uuid);        // bw_uuid_* class
el.classList.add(_BW_LC);      // 'bw_lc' marker class
bw._registerNode(el, uuid);   // node cache
```

The `bw_lc` marker class is how `bw.cleanup()` finds lifecycle-managed
elements via `querySelectorAll('.bw_lc')` -- fast native selector, no
custom tracking structure needed.

### 5b. State storage

```javascript
if (opts.state) {
  el._bw_state = opts.state;  // mutable reference, shared with render
}
```

State is stored directly on the DOM element. This is intentional -- the DOM
IS the registry. No external store, no proxy, no virtual DOM diff.

### 5c. Render function storage

```javascript
if (opts.render) {
  el._bw_render = opts.render;  // fn(el, state) called by bw.update()
}
```

The render function is called with `(el, el._bw_state)`. It typically
rebuilds the element's children using `bw.DOM()` or direct `_bw_refs` patching.

### 5d. Unmount callback registration

```javascript
if (opts.unmount) {
  bw._unmountCallbacks.set(uuid, () => {
    opts.unmount(el, el._bw_state || {});
  });
}
```

Stored in a global `Map` keyed by UUID. Called during `bw.cleanup()`.

---

## Stage 6: Mount Trigger (line 1047)

After lifecycle setup, the mount callback fires:

```javascript
var mountFn = opts.mounted || (opts.render ? function(mountEl) {
  opts.render(mountEl, mountEl._bw_state || {});
} : null);
```

**Logic:**
- If `o.mounted` exists: use it (user controls initial render)
- Else if `o.render` exists: auto-call render as a convenience
- Otherwise: no mount callback

**Timing** (line 1054):
- If `document.body.contains(el)`: call immediately (element already in DOM)
- Otherwise: defer to `requestAnimationFrame` -- this handles the common
  case where `createDOM` builds an element that hasn't been appended yet.
  The rAF fires after the element is added to the DOM tree.

**Important**: `o.mounted` receives `(el, state)`. The element has all
attributes, children, refs, and handle/slots already set up. The mounted
callback is the right place to set up timers, fetch data, or call
`bw.sub()` to register subscriptions.

---

## Stage 7: Handle and Slots Attachment (line 1074)

Creates the `el.bw` namespace for component API methods.

### 7a. Handle methods

```javascript
if (opts.handle) {
  for (var hk in opts.handle) {
    el.bw[hk] = opts.handle[hk].bind(null, el);
  }
}
```

Each handle function is defined as `fn(el, ...args)`. The `bind(null, el)`
partially applies the element, so callers use `el.bw.method(arg)` without
knowing the element reference.

Example:
```javascript
// Definition:
handle: {
  increment: function(el, amount) {
    el._bw_state.count += amount;
    bw.update(el);
  }
}
// Usage:
el.bw.increment(5);  // el is already bound
```

### 7b. Slot declarations

Each slot generates a getter/setter pair using an IIFE closure to capture
the name and a cached reference to the target DOM node:

```javascript
if (opts.slots) {
  for (var sk in opts.slots) {
    (function(name, selector) {
      var cap = name.charAt(0).toUpperCase() + name.slice(1);
      var target = el.querySelector(selector);  // cache at creation time
      el.bw['set' + cap] = function(value) {
        if (!target) return;
        if (value != null && typeof value === 'object' && value.t) {
          target.innerHTML = '';
          target.appendChild(bw.createDOM(value));
        } else {
          target.textContent = (value != null) ? String(value) : '';
        }
      };
      el.bw['get' + cap] = function() {
        return target ? target.textContent : '';
      };
    })(sk, opts.slots[sk]);
  }
}
```

**Design intent:** Slot targets are resolved ONCE during hydration and
cached in the IIFE closure. Subsequent `el.bw.setTitle()` calls operate
directly on the cached node reference -- zero DOM queries. This is the
correct pattern: the component tree is fully built when slots are set up,
so the querySelector result is stable.

**BUG (current code):** The current implementation does `el.querySelector()`
on every setter/getter call instead of caching. This is a known bug to fix.

Slot API example from `bw.makeCard()`:
```javascript
slots: {
  title: '.bw_card_title',
  content: '.bw_card_body',
  footer: '.bw_card_footer'
}
// Generates: el.bw.setTitle(), el.bw.getTitle(),
//            el.bw.setContent(), el.bw.getContent(),
//            el.bw.setFooter(), el.bw.getFooter()
```

---

## Stage 8: Mounting into the Page

Three functions mount TACOs into the live DOM:

### bw.DOM(target, taco) (line 1140)

The primary mount function. Returns the target container element.

1. Resolve target via `bw._el(target)` (supports selector, id, UUID, element)
2. **Save** the target's own lifecycle state:
   - `_bw_state`, `_bw_render`, UUID, `_bw_subs`
3. **Temporarily** remove `_bw_subs` from target (prevents cleanup from
   killing the container's own subscriptions)
4. Call `bw.cleanup(targetEl)` -- cleans up ALL children
5. **Restore** saved state/render/UUID/subs to target
6. `targetEl.innerHTML = ''` -- clear the container
7. Call `bw.createDOM(taco)` and append result
8. Return `targetEl`

The save/cleanup/restore dance (lines 1155-1173) is critical: when you
re-render a component via `bw.DOM('#app', newTaco)`, the #app element
itself keeps its state and subscriptions. Only its children are torn down.

### bw.mount(target, taco) (line 1215)

Like `bw.DOM()` but returns the created root element (not the container).
This gives direct access to `el.bw` handle methods:

```javascript
var el = bw.mount('#app', bw.makeCarousel({ items: slides }));
el.bw.next();        // call handle method
el.bw.goToSlide(2);  // call handle method
```

### bw.message(target, action, data) (line 1823)

Dispatch to a component's handle method by name, from outside:

```javascript
bw.message('#my-carousel', 'next');
bw.message('bw_uuid_abc123', 'setValue', 75);
```

Resolves target via `bw._el()`, then calls `el.bw[action](data)`.

---

## Stage 9: Updates

### Primary: Member functions (el.bw.method)

The preferred update path. The component exposes an API via `o.handle`
and `o.slots`. Callers update the component through this API:

```javascript
var el = bw.mount('#app', bw.makeProgressBar({ value: 0, max: 100 }));

// Update via member function -- NO re-render, NO DOM rebuild
el.bw.setValue(75);

// List component example -- surgical add, no full re-render
el.bw.addItem({ name: 'New item' });
el.bw.removeItem(2);
el.bw.updateItem(0, { name: 'Updated' });
```

Member functions operate directly on cached DOM node references. Focus,
scroll, transitions, and input state are preserved because the surrounding
DOM is untouched. This is the bitwrench update model.

### Secondary: bw.patch() -- targeted content/attribute update

`bw.patch(id, content, attr)` (line 1363) changes one element's content
or attribute by ID/UUID without going through a component's handle API:

- `bw.patch('score', '42')` -- sets textContent
- `bw.patch('score', newTaco)` -- replaces children with TACO
- `bw.patch('status', 'active', 'class')` -- sets attribute

Uses `bw._el()` for O(1) node cache lookup. Useful for simple value
updates (labels, counters, status text) that don't justify a full handle.

`bw.patchAll(patches)` (line 1408) -- batch version:
`bw.patchAll({ 'cpu': '78%', 'mem': '4.2GB' })`

### Tertiary: bw.update() -- full re-render

`bw.update(target)` (line 1334) calls the stored `o.render` function for
a complete structural re-render. Use when the component's structure changes
(not just values):

```javascript
bw.update = function(target) {
  var el = bw._el(target);
  if (el && el._bw_render) {
    el._bw_render(el, el._bw_state || {});
    bw.emit(el, 'statechange', el._bw_state);
  }
  return el || null;
};
```

The render function typically calls `bw.DOM(el, newTaco)` internally, which
tears down children and rebuilds. This is the heavy path -- use member
functions for routine updates, reserve `bw.update()` for structural changes.

### When to use which

| Scenario | Method | DOM impact |
|---|---|---|
| Change a label, score, status | `el.bw.setX()` or `bw.patch()` | Single node touched |
| Add/remove list item | `el.bw.addItem()` / `removeItem()` | One node added/removed |
| Toggle visibility, state | `el.bw.toggle()` | Class/style change |
| Complete structural rebuild | `bw.update(el)` | Children torn down + rebuilt |

---

## Stage 10: Event Communication

Two orthogonal systems:

### DOM-scoped: bw.emit() / bw.on()

**bw.emit(target, eventName, detail)** (line 1435):
Dispatches `CustomEvent('bw:' + eventName)` on the element. Bubbles by
default, so ancestor elements can listen.

**bw.on(target, eventName, handler)** (line 1464):
Listens for `'bw:' + eventName` on the target. Handler receives
`(detail, event)` -- detail first for convenience.

Use for parent-child or ancestor communication within the DOM tree.

### Application-scoped: bw.pub() / bw.sub()

**bw.pub(topic, detail)** (line 1498):
Publishes to all subscribers on a topic. Each subscriber is try/catch
wrapped so one bad handler cannot break others. Returns count of
successfully called subscribers.

**bw.sub(topic, handler, el)** (line 1534):
Subscribes to a topic. Returns an `unsub()` function.

The optional `el` parameter ties the subscription to an element's lifecycle:
```javascript
bw.sub('score:updated', function(detail) {
  bw.patch('display', detail.score);
}, myElement);
```

When `el` is provided (line 1547):
1. `el._bw_subs` array is created (if needed)
2. The `unsub()` function is pushed onto it
3. If `el` has no UUID: one is added via `el.classList.add(bw.uuid('uuid'))`
4. `bw_lc` marker class is added if missing

This ensures `bw.cleanup()` will find the element and call all stored
`unsub()` functions, preventing subscription leaks.

**bw.unsub(topic, handler)** (line 1574):
Remove by handler reference. Alternative to calling the returned `unsub()`.

---

## Stage 11: CSS and Theme Application

### Structural CSS

`bw.loadStyles()` with no arguments loads structural (layout-only) CSS:
- Box model resets
- Component layout (flex, grid, padding, margin)
- No colors, no palette references

Source: `structuralRules` objects in `bitwrench-styles.js`.

### Themed CSS Generation

`bw.makeStyles(config)` (line 2374):
1. Merge config with `DEFAULT_PALETTE_CONFIG`
2. `derivePalette(config)` -> primary palette object
3. `resolveLayout(config)` -> spacing/radius values
4. `generateThemedCSS('', palette, layout)` -> primary rules object
5. `deriveAlternateConfig(config)` -> luminance-inverted config
6. `derivePalette(altConfig)` -> alternate palette
7. `generateThemedCSS('', altPalette, layout)` -> alternate rules object
8. Return `{ css, alternateCss, rules, alternateRules, palette,
   alternatePalette, isLightPrimary }`

Palette structure:
```
palette.primary   = { base, hover, active, light, darkText, border, focus, textOn }
palette.secondary = { base, hover, active, light, darkText, border, focus, textOn }
palette.success   = { ... }  // same shape for all color keys
palette.background = '#ffffff'   // plain string, NOT object
palette.surface    = '#f8f9fa'   // plain string
palette.surfaceAlt = '#e9ecef'   // plain string
```

### Theme Injection

`bw.applyStyles(styles, scope)` (line 2438):
1. Resolve style element id from scope
2. If scoped: wrap primary rules under scope selector
3. Wrap alternate rules under `.bw_theme_alt` (or `scope.bw_theme_alt`)
4. Combine primary + alternate CSS into one string
5. `bw.injectCSS(combined, { id: styleId, append: false })`

Result: A single `<style id="bw_style_global">` element containing all
primary CSS followed by all `.bw_theme_alt` scoped CSS.

### Theme Toggle

**Global toggle** -- `bw.toggleStyles()`:
- Adds/removes `bw_theme_alt` class on `<html>` element
- The `.bw_theme_alt` CSS rules in the style element immediately take effect
- Returns `'alternate'` or `'primary'`
- No CSS regeneration, no DOM rebuild, no re-render. Pure CSS class toggle.

**Scoped toggle** (quikchat pattern, future):
The global toggle puts `.bw_theme_alt` on `<html>`, which affects the entire
page. For per-component or per-panel theme control, the toggle class should
go on the scoped container instead:

```javascript
// Scoped styles already work:
bw.applyStyles(styles, '#panel');
// Generates: #panel .bw_card { ... }
// And:       #panel.bw_theme_alt .bw_card { ... }

// Scoped toggle (planned):
panelEl.classList.toggle('bw_theme_alt');
// Only #panel switches to dark mode; rest of page unchanged
```

This follows the quikchat model: theme class on the component root, not on
`<html>`. Each instance manages its own theme state independently.

### How themes apply to BCCL components

BCCL components (makeCard, makeTabs, etc.) emit TACO with standard classes
like `bw_card`, `bw_btn`, `bw_tabs`. The themed CSS generated by
`generateThemedCSS()` targets these classes:

```
.bw_card { background: palette.surface; border: 1px solid palette.light.border; ... }
.bw_btn_primary { background: palette.primary.base; color: palette.primary.textOn; ... }
```

When `.bw_theme_alt` is on `<html>`, the alternate rules override:
```
.bw_theme_alt .bw_card { background: altPalette.surface; ... }
.bw_theme_alt .bw_btn_primary { background: altPalette.primary.base; ... }
```

### How themes apply to user components

User components should use palette values from `bw.makeStyles()` to generate
their own CSS via `bw.css()`:

```javascript
var styles = bw.loadStyles({ primary: '#4f46e5' });
var p = styles.palette;
var ap = styles.alternatePalette;

// Primary CSS
var myRules = { '.my_widget': { background: p.surface, color: p.dark.base } };
// Alternate CSS
var myAltRules = bw.scopeRulesUnder(
  { '.my_widget': { background: ap.surface, color: ap.dark.base } },
  '.bw_theme_alt'
);
bw.injectCSS(bw.css(myRules) + '\n' + bw.css(myAltRules), { id: 'my_widget_css' });
```

This is the palette-driven pattern. Never use `var(--bw_*)` CSS custom
properties or hardcoded color values. See CLAUDE.md "CSS Generation Rules".

---

## Stage 12: Cleanup and Unmount

`bw.cleanup(element)` (line 1243) tears down an element and all its children.

### Processing order:

1. **Deregister non-lifecycle UUIDs** (line 1247):
   `querySelectorAll('[class*="bw_uuid_"]')` -- removes from `bw._nodeMap`

2. **Find lifecycle-managed elements** (line 1254):
   `querySelectorAll('.bw_lc')` -- the `bw_lc` marker class

3. **For each lifecycle element** (line 1256):
   a. Get UUID via `bw.getUUID(el)`
   b. Look up unmount callback in `bw._unmountCallbacks` Map
   c. Call callback: `opts.unmount(el, el._bw_state || {})`
   d. Delete callback from Map
   e. Deregister from node cache
   f. Clean up `_bw_subs`: call each `unsub()` function
   g. Delete `_bw_state`, `_bw_render`, `_bw_refs`

4. **Check the element itself** (line 1282):
   Same cleanup as children (unmount callback, node cache, subs, state)

### What cleanup removes:

| Property | Purpose | Cleaned? |
|---|---|---|
| `_bw_state` | Component state object | Deleted |
| `_bw_render` | Render function for bw.update() | Deleted |
| `_bw_refs` | Parent->child fast lookup map | Deleted |
| `_bw_subs` | Array of unsub() functions | Each called, then deleted |
| `bw._unmountCallbacks[uuid]` | Unmount callback | Called, then deleted |
| `bw._nodeMap[uuid]` | Node cache entry | Deleted |
| `bw._nodeMap[id]` | Node cache entry (by id) | Deleted (via deregister) |

### When cleanup is called:

- **`bw.DOM(target, taco)`**: automatically before re-render (line 1164)
- **`bw.mount(target, taco)`**: automatically before re-render (line 1221)
- **Manual**: `bw.cleanup(el)` before `el.remove()`
- **bw.DOM save/restore**: the target element's own state/subs are saved
  before cleanup and restored after, so only children are torn down

### Unmount callback pattern:

```javascript
{
  t: 'div',
  o: {
    state: { timerId: null },
    mounted: function(el, state) {
      state.timerId = setInterval(function() {
        // update something
      }, 1000);
    },
    unmount: function(el, state) {
      clearInterval(state.timerId);  // prevent leak
    }
  }
}
```

---

## Stage 13: Re-render Cycle (Heavy Path)

Most updates go through member functions (Stage 9) and never hit this path.
Full re-render is for structural changes where the component's DOM tree
shape changes, not just values.

When a component re-renders (via `bw.update()` or re-calling `bw.DOM()`),
the full cycle repeats for new children:

```
bw.update(el)
  -> el._bw_render(el, el._bw_state)
    -> typically calls bw.DOM(el, newTaco) inside render fn
      -> save el's own state/render/subs
      -> bw.cleanup(el)       [tears down old children]
      -> restore el's state
      -> el.innerHTML = ''
      -> bw.createDOM(newTaco) [builds new children]
        -> attribute hydration
        -> content processing
        -> _bw_refs construction
        -> node cache registration
        -> lifecycle setup (for new children)
        -> handle/slots (for new children)
        -> mount trigger (for new children)
  -> bw.emit(el, 'statechange', state)
```

The target element survives the re-render. Its `_bw_state`, `_bw_render`,
UUID, and subscriptions persist. Only its DOM children are replaced.

**Tradeoffs of full re-render:**
- Focus is lost on child elements
- Scroll position inside re-rendered containers resets
- CSS transitions/animations on children are interrupted
- Input cursor position and selection destroyed

This is why member functions are the primary update path. Reserve
`bw.update()` for cases where the DOM structure itself must change.

---

## BCCL Component Patterns

BCCL components (in `bitwrench-bccl.js`) follow a consistent pattern:

### Standard BCCL anatomy

```javascript
bw.makeCard = function(props) {
  // 1. Normalize props
  props = props || {};
  var title = props.title || '';

  // 2. Build TACO with standard classes
  return {
    t: 'div',
    a: { class: 'bw_card' },
    c: [
      { t: 'div', a: { class: 'bw_card_title' }, c: title },
      { t: 'div', a: { class: 'bw_card_body' }, c: props.content },
      { t: 'div', a: { class: 'bw_card_footer' }, c: props.footer }
    ],
    o: {
      type: 'card',
      state: props.state || {},
      slots: {
        title: '.bw_card_title',
        content: '.bw_card_body',
        footer: '.bw_card_footer'
      }
    }
  };
};
```

### BCCL class naming

All BCCL classes use the `bw_` prefix with underscores:
- Container: `bw_card`, `bw_tabs`, `bw_alert`, `bw_modal`
- Children: `bw_card_title`, `bw_card_body`, `bw_tab_panel`
- Variants: `bw_btn_primary`, `bw_alert_danger`

CSS uses both underscore and hyphenated selectors for compatibility.
`bw.normalizeClass()` converts underscores to hyphens internally.

### BCCL components with handles

More complex BCCL components use `o.handle` for imperative control:

```javascript
bw.makeTabs = function(props) {
  return {
    t: 'div',
    a: { class: 'bw_tabs' },
    c: [ /* tabs + panels */ ],
    o: {
      type: 'tabs',
      state: { activeIndex: 0 },
      handle: {
        setActiveTab: switchTab,  // fn(el, index)
        getActiveTab: function(el) { return el._bw_state.activeIndex; }
      },
      mounted: function(el) { /* keyboard nav setup */ }
    }
  };
};
```

Usage:
```javascript
var el = bw.mount('#tabs', bw.makeTabs({ items: tabData }));
el.bw.setActiveTab(2);
var idx = el.bw.getActiveTab();
```

---

## Addressing Summary

Multiple ways to address a component after creation:

| Method | Lookup speed | Source |
|---|---|---|
| `bw._el(uuid)` via UUID class | O(1) node cache | `bw.assignUUID()` or auto |
| `bw._el(id)` via id attribute | O(1) node cache | `a: { id: 'myid' }` |
| `bw._el(selector)` CSS selector | O(n) DOM query | Any CSS selector |
| `el._bw_refs[key]` parent ref | O(1) hash lookup | Built during createDOM |
| `el.bw.method()` handle | Direct call | `o.handle` |

The node cache (`bw._nodeMap`) provides O(1) lookup for both UUIDs and ids.
Falls back to `document.querySelector()` on cache miss.

---

## Memory Management

bitwrench has no garbage collection of its own. Memory is managed by:

1. **bw.cleanup()**: Removes all internal references (_bw_state, _bw_render,
   _bw_refs, node cache entries, unmount callbacks, pub/sub subscriptions)
2. **bw.DOM()**: Automatically calls cleanup before re-render
3. **bw.sub() lifecycle tying**: Subscriptions auto-unsubscribe when their
   tied element is cleaned up
4. **Browser GC**: Once all JS references and DOM references are cleared,
   standard browser garbage collection reclaims memory

Leak prevention checklist:
- Always use `bw.DOM()` or `bw.mount()` for re-renders (auto-cleanup)
- Tie `bw.sub()` subscriptions to elements (third argument)
- Use `o.unmount` to clear timers, intervals, and external references
- Call `bw.cleanup(el)` before manual `el.remove()`

---

## Animation Pattern

bitwrench has no built-in animation hooks. `bw.cleanup()` is synchronous,
so there's no window for exit animations at the framework level. Instead,
the component owns its own animation choreography via member functions:

### Enter animation

```javascript
handle: {
  animateIn: function(el) {
    el.classList.add('bw_enter');
    el.addEventListener('animationend', function() {
      el.classList.remove('bw_enter');
    }, { once: true });
  }
}
// Caller: el.bw.animateIn()
```

### Exit animation (self-removing)

```javascript
handle: {
  remove: function(el) {
    el.classList.add('bw_exit');
    el.addEventListener('animationend', function() {
      bw.cleanup(el);
      el.remove();
    }, { once: true });
  }
}
// Caller: el.bw.remove()  -- animates out, then cleans up and removes
```

This fits the philosophy: the component owns its rendering and its removal.
No framework-level animation system needed.

---

## o.type -- Component Type Metadata

BCCL components set `o.type` (e.g., `type: 'card'`, `type: 'tabs'`,
`type: 'alert'`). Currently the engine stores but does not read this value.

Planned uses:
- `bw.inspect()` output: show component type
- Debug tree walking: show type at each level
- Runtime type checking in handle methods
- `el._bw_type` storage on the DOM element during createDOM

Wiring it in is one line: `if (opts.type) el._bw_type = opts.type;`

---

## Paradigm Assessment

### Does the model hold water?

The core model -- TACO as specification, build once, update via member
functions, DOM is the registry -- is sound. It is the same pattern that
worked for decades in native UI toolkits (MFC, Swing, Qt, Cocoa). React
moved away from it not because it was wrong, but because coordinating many
imperative updates across a large tree is error-prone for average
developers. bitwrench bets that its audience (embedded, prototyping,
experienced devs who want explicit control) has the discipline. That is
a defensible bet.

**Strengths:**

- TACO is genuinely powerful. JSON-serializable (minus functions), human-
  readable, composable, no compiler. You can inspect, transform, and
  wire-protocol UI as plain data. This is not "JSX but worse" -- it is a
  different thing with different tradeoffs.
- State on the DOM element is the right call for this model. No sync bugs
  between a shadow store and the real DOM. No parallel data structure to
  keep in sync.
- The cleanup model (bw_lc marker + UUID keying + save/restore on re-render
  + subscription lifecycle tying) is well-engineered. No leaks by default.
- bwserve is where the paradigm shines hardest. Server sends JSON TACOs,
  client calls `bw.message()` to trigger member fns. This is a natural fit
  that React/Vue cannot match without heavy serialization layers.

### Tension points

**1. Component composition -- the biggest missing piece.**

Individual BCCL components work great. But there is no documented pattern
for "a component that contains other components." Example: building a
`makeSearchableList` that contains a text input, a filterable list, and
pagination controls -- each with their own handle methods.

The parent's `mounted` has to grab child `el.bw` references and manually
plumb events between them. This works but it is ad-hoc. Every developer
invents their own wiring pattern.

bitwrench has primitives for building individual components (handle, slots,
state, mounted, cleanup) and primitives for communication between them
(pub/sub, emit/on, bw.message). What is missing is the intermediate layer:
how to assemble components into composite components with documented wiring.

The north star says "TACO is a component specification (MFC/Swing lineage)."
In MFC/Swing, composite components are containers that create child controls
in their constructor and wire events between them. bitwrench can do this in
`o.mounted`. But the pattern is not documented or standardized. See the
"Composition Patterns" section below for the canonical approach.

**2. The o.render path is a foot-gun for newcomers.**

A developer coming from React will naturally reach for:

```javascript
o: {
  state: { items: [] },
  render: function(el, state) {
    bw.DOM(el, buildListTaco(state.items));
  }
}
// Then: el._bw_state.items.push(x); bw.update(el);
```

This is the "re-render everything" pattern. It works, but it is the heavy
path -- it destroys focus, scroll, transitions. The RIGHT bitwrench way is
handle methods that surgically add/remove items. But the API surface makes
the wrong path more discoverable than the right one.

`o.render` should almost come with a warning: "You probably want `o.handle`
instead." Reserve `o.render` for cases where the DOM structure itself must
change (e.g., switching between two completely different views).

**3. Pub/sub dependency graph is implicit.**

When you have 20+ components connected via `bw.pub()`/`bw.sub()`, the
dependency graph lives in your head. React's unidirectional flow (props
down, events up) makes it traceable. bitwrench's pub/sub is global and
unstructured -- topic names are freeform strings, any component can
pub/sub to any topic.

This is the Observer pattern, battle-tested for decades. But at scale it
needs discipline. Mitigations:
- Name topics hierarchically: `'game:score:updated'`, `'upload:progress'`
- Tie subscriptions to element lifecycle (third arg to `bw.sub()`)
- Use `bw.emit()`/`bw.on()` (DOM-scoped, hierarchical) when the
  communicating components share a DOM ancestor
- Reserve `bw.pub()`/`bw.sub()` for truly decoupled, cross-tree messaging

A `bw.tree()` debug tool that shows subscriptions per component would help:

```
#app
  bw_uuid_a1b2 (type: tabs)     handles: [setActiveTab, getActiveTab]
  bw_uuid_c3d4 (type: card)     handles: [setTitle, setContent]
    subs: ['score:updated', 'game:reset']
  bw_uuid_e5f6 (type: progress) handles: [setValue]
    subs: ['upload:progress']
```

**4. Testing story is undocumented.**

How do you unit test a bitwrench component? You need jsdom, mount via
`bw.mount()`, call handle methods, assert DOM state. This works -- the
existing 1400+ unit tests prove it. But there is no documented recipe for
a user building their own component and testing it. Pattern:

```javascript
// test: my searchable list filters correctly
var el = bw.mount(container, bw.makeSearchableList({ items: data }));
el.bw.filter('apple');
var visible = el.querySelectorAll('.list_item:not(.hidden)');
assert.equal(visible.length, 1);
assert.equal(visible[0].textContent, 'Apple');
```

### Bottom line

The paradigm is sound. It is not trying to be React and should not be
evaluated on React's terms. The member-function model, TACO-as-data, and
DOM-as-registry are coherent and self-reinforcing. The biggest gap is not a
missing feature -- it is that the composition story (building components
from components) needs to be as clear and documented as the individual-
component story already is.

---

## Composition Patterns

This is the most important section for building real applications with
bitwrench. Individual components are well-served by handle/slots. The
question is: how do you assemble components into composite components?

### Pattern 1: UUID-wired composition (canonical)

Assign UUIDs to child TACOs before construction. Wire children in
`o.mounted` using `_bw_refs` for O(1) access to child handle methods.

```javascript
bw.makeSearchableList = function(props) {
  props = props || {};

  // 1. Build child TACOs and assign UUIDs
  var inputTaco = {
    t: 'input',
    a: { class: 'search_input', type: 'text', placeholder: 'Search...' }
  };
  var listTaco = bw.makeList({ items: props.items || [] });
  var inputUUID = bw.assignUUID(inputTaco);
  var listUUID = bw.assignUUID(listTaco);

  // 2. Return composite TACO
  return {
    t: 'div',
    a: { class: 'searchable_list' },
    c: [inputTaco, listTaco],
    o: {
      type: 'searchable-list',
      state: { items: props.items || [] },

      // 3. Wire children in mounted -- el._bw_refs has O(1) access
      mounted: function(el) {
        var inputEl = el._bw_refs[inputUUID];
        var listEl = el._bw_refs[listUUID];

        inputEl.addEventListener('input', function(e) {
          listEl.bw.filter(e.target.value);
        });
      },

      // 4. Parent handle delegates to children
      handle: {
        filter: function(el, query) {
          el._bw_refs[inputUUID].value = query;
          el._bw_refs[listUUID].bw.filter(query);
        },
        getSelected: function(el) {
          return el._bw_refs[listUUID].bw.getSelected();
        },
        addItem: function(el, item) {
          el._bw_refs[listUUID].bw.addItem(item);
        }
      }
    }
  };
};
```

Usage:
```javascript
var el = bw.mount('#app', bw.makeSearchableList({ items: myData }));
el.bw.filter('apple');
el.bw.addItem({ name: 'Banana' });
var sel = el.bw.getSelected();
```

**Key points:**
- UUIDs assigned before `createDOM` -- so `_bw_refs` captures them
- `mounted` wires internal events between children
- Parent `handle` delegates to child handles -- caller never knows internals
- No pub/sub needed for internal wiring -- direct references via `_bw_refs`

### Pattern 2: Pub/sub composition (decoupled)

When children do not know about each other and should not. The parent
subscribes to topics and orchestrates.

```javascript
bw.makeDashboard = function(props) {
  var chartTaco = bw.makeChart({ data: props.data });
  var tableTaco = bw.makeDataTable({ rows: props.data });
  var filterTaco = bw.makeFilterBar({ filters: props.filters });
  var chartUUID = bw.assignUUID(chartTaco);
  var tableUUID = bw.assignUUID(tableTaco);

  return {
    t: 'div',
    a: { class: 'dashboard' },
    c: [filterTaco, chartTaco, tableTaco],
    o: {
      type: 'dashboard',
      mounted: function(el) {
        var chartEl = el._bw_refs[chartUUID];
        var tableEl = el._bw_refs[tableUUID];

        // Listen for filter changes, update both children
        bw.sub('filter:changed', function(detail) {
          var filtered = detail.rows;
          chartEl.bw.setData(filtered);
          tableEl.bw.setRows(filtered);
        }, el);  // tie to el lifecycle -- auto-unsub on cleanup
      },
      handle: {
        refresh: function(el) {
          bw.pub('dashboard:refresh');
        }
      }
    }
  };
};
```

**When to use pub/sub vs direct wiring:**
- Direct wiring (`_bw_refs` + child handles): parent knows its children,
  children are private implementation details. Most common case.
- Pub/sub: children are independent and reusable, parent orchestrates but
  children can also be used standalone. Use for cross-cutting concerns
  (theme changes, user auth, global notifications).

### Pattern 3: Slot-based composition (content injection)

Parent provides structural slots; caller injects content at mount time or
later via slot setters:

```javascript
bw.makePanel = function(props) {
  return {
    t: 'div',
    a: { class: 'panel' },
    c: [
      { t: 'div', a: { class: 'panel_header' }, c: props.title || '' },
      { t: 'div', a: { class: 'panel_body' }, c: props.content || '' },
      { t: 'div', a: { class: 'panel_footer' }, c: props.footer || '' }
    ],
    o: {
      type: 'panel',
      slots: {
        header: '.panel_header',
        body: '.panel_body',
        footer: '.panel_footer'
      }
    }
  };
};

// Mount with initial content
var el = bw.mount('#sidebar', bw.makePanel({ title: 'Filters' }));

// Later: inject a complex TACO into the body slot
el.bw.setBody(bw.makeFilterBar({ filters: activeFilters }));
```

Slot-based composition is for cases where the container's structure is
fixed but the content varies. The container does not need to know what
goes in its slots.

### Pattern 4: Event-bubbling composition (DOM hierarchy)

Use `bw.emit()`/`bw.on()` when children need to notify ancestors without
knowing who is listening. Events bubble through the DOM tree.

```javascript
// Child: emits event on user action
handle: {
  select: function(el, item) {
    el._bw_state.selected = item;
    bw.emit(el, 'itemselected', { item: item });
  }
}

// Ancestor: listens for bubbled events
mounted: function(el) {
  bw.on(el, 'itemselected', function(detail) {
    el._bw_refs[detailPanelUUID].bw.show(detail.item);
  });
}
```

**When to use emit/on vs pub/sub:**
- `emit/on`: communication follows the DOM hierarchy. Parent listens for
  events from any descendant. Scoped to a subtree.
- `pub/sub`: communication is global, topic-based, decoupled from DOM
  structure. Any component anywhere can publish or subscribe.

### Composition anti-patterns

**Do not:**
- Reach into child internals (`el.querySelector('.child_internal_class')`)
  from a parent handle. Use the child's handle API.
- Use `bw.update()` on a parent to re-render children that have their own
  state. This destroys child state. Use child handle methods instead.
- Create circular pub/sub (A publishes topic X on receiving topic Y, B
  publishes Y on receiving X). Use direct wiring or emit/on instead.
- Store child element references in state (`el._bw_state.childEl = ...`).
  Use `_bw_refs` -- they are built automatically and cleaned up properly.

### Choosing a composition pattern

| Scenario | Pattern | Why |
|---|---|---|
| Parent owns children, wires them together | Pattern 1 (UUID-wired) | Direct, fast, no indirection |
| Decoupled children, parent orchestrates | Pattern 2 (pub/sub) | Children reusable standalone |
| Fixed container, variable content | Pattern 3 (slots) | Container agnostic to content |
| Child notifies unknown ancestors | Pattern 4 (event bubbling) | Hierarchical, DOM-scoped |
| Simple value display, no behavior | `bw.patch()` | No component needed |

---

## Known Gaps and Future Work

### SVG namespace (blocks P6 chart library)

`createDOM` uses `document.createElement()` for all tags. SVG requires
`document.createElementNS('http://www.w3.org/2000/svg', tag)`. Fix:
detect SVG context via tag name or parent flag, pass `_svgContext` through
recursive calls. Also needed for MathML (`<math>`).

### Error boundaries in lifecycle callbacks

`o.mounted`, `o.render`, and `o.unmount` are called without try/catch.
A bad callback propagates up and can break the entire mount/cleanup chain.
Fix: wrap each callback in try/catch, log via `_cw()`, continue processing.
Match the pattern already used in `bw.pub()`.

### Slot target caching (bug)

Current slot setters call `el.querySelector(selector)` on every invocation.
Should cache the target node at creation time in the IIFE closure, since
the slot target is stable after hydration. See Stage 7b.

### Scoped theme toggle

`bw.toggleStyles()` is global-only (toggles on `<html>`). Scoped styles
via `bw.applyStyles(styles, '#panel')` generate CSS but the toggle doesn't
know about scopes. Fix: allow `bw.toggleStyles(scopeEl)` to toggle
`.bw_theme_alt` on a specific container, following the quikchat pattern.

### Server-side hydration

`bw.html()` generates strings for SSR but there's no `bw.hydrate()` to
attach handlers and state to existing server-rendered DOM. A hydrate
function would walk existing DOM, match to TACO tree by position/class,
attach event handlers, set up state/render/handle/slots, and fire mounted
-- without creating new elements. Lower priority: client-side re-render is
fast enough for most bitwrench use cases (embedded, prototyping, tools).

### Async mounted pattern

`o.mounted` is synchronous. Async data fetching requires manual async +
`bw.update()`. Could provide a helper or documented pattern for
loading/error states. Keep `o.mounted` itself synchronous for simplicity.

### Debug tree inspection

#### Current state

`bw.inspect()` (bitwrench.js, line 2066) dumps a single element: state,
handle keys, classes, refs. It does not walk children.

`_bw_tree` (bwclient.js, line 98) is a bwserve builtin registered on the
browser client. It walks the DOM tree and returns JSON via the query
POST-back mechanism. The server invokes it via
`client.call('_bw_tree', { selector, depth })`.

Current `_bw_tree` output per node:
- `tag` -- tagName
- `id` -- if present
- `cls` -- first 5 CSS classes
- `children` -- recursive, max 20 per level, max depth 3

There is no `client.tree()` convenience method on the server-side client
(unlike `client.screenshot()` and `client.query()`).

#### What `_bw_tree` does NOT report (yet)

- `_bw_state` -- component state keys/values
- `_bw_type` -- component type from `o.type`
- `el.bw` -- handle method names
- `_bw_subs` -- subscription count/topics
- `_bw_render` -- whether element has a render function
- `_bw_refs` -- addressable child refs
- `bw_lc` -- whether element is lifecycle-managed
- UUID highlighting

#### Design decision: where does tree inspection live?

This is a paradigm question. There are three options:

**Option A: bw.tree() in bitwrench.js core (alongside bw.inspect)**

For direct browser console use. No bwserve dependency. Walks the subtree,
console.log formatted. Knows about all bitwrench internals (_bw_state,
_bw_type, el.bw, _bw_subs, _bw_refs, bw_lc).

```javascript
bw.tree('#app', 4);
// Output:
// div#app
//   div (tabs) [bw_uuid_a1b2]  handles: [setActiveTab, getActiveTab]  state: {activeIndex}
//     div.bw_tab_panel
//       div (card) [bw_uuid_c3d4]  handles: [setTitle, setContent]  subs: 2
```

Pro: available everywhere, no server needed. Fits the "DOM is the registry"
philosophy -- if state lives on elements, inspection should too.
Con: adds code to the core bundle.

**Option B: enhanced _bw_tree in bwclient.js only**

Keep inspection in the bwserve debug tooling. Enhance `_bw_tree` to
report bitwrench metadata. Add `client.tree()` convenience method.
Used via `bwcli attach` or programmatic bwserve scripts.

Pro: zero core bundle cost. Debugging is an opt-in tool.
Con: requires bwserve running. Cannot inspect a standalone page loaded
from a file:// URL or third-party server.

**Option C: both (shared information model, different outputs)**

`bw.tree()` in core for console debugging. Enhanced `_bw_tree` in
bwclient for remote debugging. Both report the same information: type,
state, handles, subs, refs, lifecycle status. Core version outputs to
console.log. bwclient version returns JSON via POST-back.

Pro: works everywhere. Remote and local debugging covered.
Con: two implementations to keep in sync.

**Recommendation: Option C, with the core `bw.tree()` generating a plain
object (not console output), so `_bw_tree` can reuse it.**

```javascript
// bitwrench.js core -- returns data, no console output
bw.tree = function(target, depth) {
  var el = bw._el(target) || document.body;
  depth = (depth != null) ? depth : 4;
  function walk(node, d) {
    if (!node || !node.tagName || d > depth) return null;
    var info = { tag: node.tagName.toLowerCase() };
    if (node.id) info.id = node.id;
    var uuid = bw.getUUID(node);
    if (uuid) info.uuid = uuid;
    if (node._bw_type) info.type = node._bw_type;
    if (node.bw) info.handles = Object.keys(node.bw);
    if (node._bw_state) info.state = Object.keys(node._bw_state);
    if (node._bw_subs) info.subs = node._bw_subs.length;
    if (node._bw_render) info.hasRender = true;
    if (node._bw_refs) info.refs = Object.keys(node._bw_refs);
    if (node.classList && node.classList.contains('bw_lc')) info.lifecycle = true;
    // Recurse children
    if (node.children && node.children.length && d < depth) {
      var kids = [];
      for (var i = 0; i < node.children.length; i++) {
        var c = walk(node.children[i], d + 1);
        if (c) kids.push(c);
      }
      if (kids.length) info.children = kids;
    }
    return info;
  }
  return walk(el, 0);
};
```

Then `_bw_tree` in bwclient becomes:
```javascript
function _bw_tree(opts) {
  var result = bw.tree(opts.selector || 'body', opts.depth || 4);
  bw._bwClient.respond('query', opts.requestId, result);
}
```

And `client.tree()` on the server:
```javascript
tree(selector, options) {
  var opts = options || {};
  var pend = this._pend(opts.timeout || 5000);
  this.call('_bw_tree', {
    selector: selector || 'body',
    depth: opts.depth || 4,
    requestId: pend.requestId
  });
  return pend.promise;
}
```

This keeps one implementation (`bw.tree()`) as the source of truth.
The bwclient builtin and server method are thin wrappers.

**Paradigm alignment:** `bw.tree()` is consistent with "DOM is the
registry." All the information it reports is already stored on DOM
elements. It is a read-only traversal with zero side effects. It
belongs in core alongside `bw.inspect()` because the information it
exposes IS the component model -- type, handles, state, subscriptions,
lifecycle status. If these things are first-class concepts, they should
be first-class inspectable.

### Component testing recipe

Document the canonical pattern for unit testing a bitwrench component:

```javascript
// Setup: jsdom + bitwrench loaded
var container = document.createElement('div');
document.body.appendChild(container);

// Mount
var el = bw.mount(container, bw.makeSearchableList({ items: data }));

// Act via handle methods
el.bw.filter('apple');

// Assert DOM state
var visible = el.querySelectorAll('.list_item:not(.hidden)');
assert.equal(visible.length, 1);

// Cleanup
bw.cleanup(container);
container.remove();
```

### Cleanup optimization (candidates)

- `querySelectorAll('.bw_lc')` is O(n) on large trees. Probably fine in
  practice (native C++ selector) but worth profiling on 1000+ element trees.
- `bw._unmountCallbacks` Map lookup per UUID is O(1) -- already optimal.

---

## Release Planning

### Current release: v2.0.25 (feature/embedded-plus)

This branch contains:
- site.js BCCL flat-class refactor (4 phases complete)
- Dark mode fixes (overlays helper, palette-driven values)
- Page migrations (var(--bw_*) elimination, class renames)
- Embedded examples improvements
- This lifecycle document

Release procedure:
1. Commit all work on feature/embedded-plus
2. `npm run release` (clean build, lint, test, bundle gate, commit dist)
3. `git checkout master && git merge --squash feature/embedded-plus`
4. `git commit -m "v2.0.25: embedded-plus, site.js BCCL refactor, lifecycle doc"`
5. `git push origin master` (CI handles tag, GitHub Release, npm publish)

### Next release: v2.0.26 (composition + lifecycle improvements)

After v2.0.25 lands, `npm run start-release -- "composition"` to create
a new feature branch. Implementation targets:

**Must-have (paradigm correctness):**
- Slot target caching bug fix (Stage 7b)
- `o.type` wiring: `if (opts.type) el._bw_type = opts.type` in createDOM
- Error boundaries: try/catch around mounted/render/unmount callbacks
- `bw.tree()` in bitwrench.js core (Option C implementation)
- Enhanced `_bw_tree` in bwclient.js (thin wrapper around `bw.tree()`)
- `client.tree()` convenience method on BwServeClient

**Should-have (unlocks):**
- SVG namespace support in createDOM (unblocks P6 chart library)
- Scoped theme toggle: `bw.toggleStyles(scopeEl)`

**Document (no code change):**
- Composition patterns already in this doc -- extract to standalone
  tutorial or add to 05-state.html / thinking-in-bitwrench.html
- Component testing recipe
- "o.render is the heavy path" guidance in API reference
