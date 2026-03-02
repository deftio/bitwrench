# Bitwrench 2.x Direction Discussion

**Date**: February 2026
**Participants**: Manu Chatterjee, Claude (AI pair programming)

## Core Thesis

Bitwrench predates React and Vue. The fundamental challenge: around 2012-2013, the JavaScript ecosystem converged on JSX and virtual DOM as the standard approach to UI. Bitwrench challenges whether this was the right abstraction.

### The JSX Premise (and Why It's Wrong)

JSX encodes a false assumption: that HTML is the natural representation of UI and we just need to make it more dynamic. But HTML was designed as a **document** format, not an **application** format. JSX papers over this mismatch by letting you write HTML-like syntax inside JavaScript, requiring a compiler to bridge the gap.

The chain of consequences:
1. HTML is static -> we need templates -> templates need a language -> JSX
2. JSX isn't JavaScript -> we need a compiler -> Babel/webpack/vite
3. State isn't in the template -> we need state management -> Redux/Zustand/signals
4. DOM updates are expensive -> we need diffing -> Virtual DOM
5. Each layer adds complexity, bundle size, and cognitive overhead

### The Bitwrench Counter-Thesis

**UI is data, expressed in the native language of the runtime.**

DOM objects are just objects with properties: tag, attributes, content, behavior. JavaScript already has a perfect notation for this: object literals. So instead of inventing a new syntax (JSX) and a new reconciliation layer (VDOM), just use what the language gives you.

```javascript
// This IS the UI. No compilation. No bridging.
{
  t: "div",
  a: { class: "card", onclick: handleClick },
  c: [
    { t: "h3", c: "Title" },
    { t: "p", c: "Content here" }
  ]
}
```

**Key insight**: HTML is the serialization format of the DOM, not the other way around. We should be working with the DOM's actual structure (objects with properties), not its serialization format (angle brackets and strings).

## The Static/Dynamic Spectrum

This is the sharpest architectural insight in bitwrench and should be elevated to a first-class concept. There are two distinct modes that share a common format:

### JSON Mode (Static / Polyglot)

Pure data. No functions. Any programming language can generate it.

```json
{
  "t": "div",
  "a": { "class": "dashboard" },
  "c": [
    { "t": "h1", "c": "Sales Report" },
    { "t": "table", "a": { "class": "bw_table" }, "c": "..." }
  ]
}
```

**Use cases:**
- Server-generated pages from any backend (Python, Go, Rust, PHP)
- Static site generation
- Email templates
- PDF-like document generation
- Configuration-driven UIs (admin panels, dashboards)
- API responses that ARE the UI

**The profound implication**: Any language with JSON support can generate beautiful, styled web pages. A Python data scientist doesn't need to learn React. They emit JSON, bitwrench renders it.

### TACO Mode (Interactive / Dynamic)

JavaScript objects with functions: event handlers, lifecycle hooks, computed content.

```javascript
{
  t: "div",
  a: { class: "counter" },
  c: () => `Count: ${state.count}`,
  o: {
    state: { count: 0 },
    mounted: (el, state) => { /* setup */ },
    unmount: (el, state) => { /* cleanup */ }
  }
}
```

**Use cases:**
- Interactive applications
- Components with behavior (sorting, filtering, toggling)
- Real-time dashboards
- Forms with validation
- Anything requiring user interaction

### The Key: Same Format, Two Products

These aren't two features - they're two products that share a wire format. This duality is bitwrench's strongest differentiator and no other framework offers it cleanly.

## What to Learn from Frameworks

We should adopt good ideas from the framework ecosystem while keeping everything JS-native:

### From D3: Data-Driven Updates
D3's enter/update/exit pattern for binding data to DOM elements is the right mental model for updates. When data changes, elements should be added, modified, or removed accordingly - without rebuilding the entire tree.

### From React: Component Composition
Functions returning TACO objects is already the right pattern. Components are just functions. Composition is just function calls. No classes, no registration, no special syntax needed.

```javascript
const Card = (props) => ({
  t: "div", a: { class: "card" },
  c: [
    { t: "h3", c: props.title },
    { t: "div", c: props.content }
  ]
});

// Composition is just function calls
const Dashboard = (data) => ({
  t: "div",
  c: data.items.map(item => Card({ title: item.name, content: item.value }))
});
```

### From Svelte: Compile-Optional Reactivity
Svelte compiles reactivity. Bitwrench should offer reactivity without compilation, through explicit update calls or lightweight observation patterns.

### From Frameworks Generally: Lifecycle Management
Mount, update, unmount hooks are essential. But they should be plain functions in the options object, not class methods or decorators.

## The Advantages (When Done Right)

### 0. No Attribute Name Mangling
React's JSX-in-JS approach creates a naming collision: `class` is a reserved word in JavaScript, so JSX uses `className`. Same for `htmlFor` instead of `for`, `tabIndex` instead of `tabindex`, `onChange` instead of `onchange`, etc. Developers constantly trip over "is this the React name or the HTML name?"

TACO has zero of this. Attributes are dictionary keys - strings:
```javascript
{ t: "label", a: { class: "form-label", for: "email" }, c: "Email" }
```
No mapping table. No surprises. The attribute names are exactly what ends up in the DOM. This is a small thing that eliminates an entire category of bugs and documentation lookups.

### 1. No Compiler Needed
- JSX needs Babel. TypeScript needs tsc. SCSS needs sass. TACO needs... nothing.
- Edit a .js file, reload the browser. That's the development loop.
- Trade-off: no static analysis or autocomplete for TACO properties. Acceptable for the target audience.

### 2. Debuggable by Default
- `console.log(taco)` shows you the entire UI structure as plain data
- No React DevTools needed - the browser's object inspector IS the dev tool
- Every DOM element maps 1:1 to a TACO object

### 3. Compact and Compressible
- TACO objects minify extremely well (short property names: t, a, c, o)
- JSON mode: pure data compresses even better
- A full page description can be a few KB of JSON

### 4. Polyglot by Design
- Python backend? `json.dumps({"t": "div", "c": "hello"})` - done
- Go backend? `json.Marshal(taco)` - done
- No server-side rendering runtime needed
- No React/Next.js/Nuxt required on the server

### 5. Trivially Serializable
- TACO (in JSON mode) can be stored in databases, sent over WebSockets, cached in Redis, embedded in API responses
- UI-as-data means UI can be version-controlled, diffed, and merged like any other data

## The Unsolved Problems

### 1. The Update Model

This is the critical question. Three options:

**Option A: Replace (Current)**
```javascript
// Simple but wasteful - rebuilds entire subtree
function render() {
  bw.DOM("#app", MyComponent(currentState));
}
```
Pro: Simple. Con: Destroys and rebuilds DOM, loses focus/scroll state.

**Option B: Surgical Updates via Handles**
```javascript
// Efficient but complex - need handle system
const table = bw.render("#app", MyTable(data));
table.addRow(newRow);    // Adds one DOM row
table.sortBy("name");    // Rearranges existing rows
```
Pro: Efficient. Con: Every component needs custom update logic.

**Option C: Data-Bound Re-render (D3-style)**
```javascript
// Bind data to TACO, let bitwrench diff
bw.bind("#app", MyComponent, dataSource);
// When dataSource changes, bitwrench updates only what changed
```
Pro: Automatic and efficient. Con: Requires a diffing/reconciliation layer (the thing we're trying to avoid).

**Current thinking**: Option A as the default (simple, works, good enough for most cases). Option B as an opt-in for components that need it (tables, forms). Option C is future work and only if profiling shows Option A is genuinely too slow.

The key realization: for most bitwrench use cases (dashboards, prototypes, admin panels, docs), full re-render is fast enough. Modern browsers can rebuild a page of 100 elements in under 5ms. We don't need virtual DOM unless we're building Gmail.

### 2. CSS Strategy: All Three Are First-Class

All three CSS approaches must be supported as equal citizens. They serve genuinely different use cases and compose together:

#### External CSS (Swappable Themes)
```html
<!-- Swap this one link and the entire site re-themes -->
<link rel="stylesheet" href="bw-theme-dark.css">
```
**Why it matters**: This is how the entire existing web works. Someone can swap a stylesheet and everything reskins - bitwrench components, hand-written HTML, everything. If bitwrench components are properly class-based, they participate in this ecosystem for free. No JS required for theming.

#### Generated Classes (JS Theme Objects → CSS)
```javascript
// JavaScript IS the preprocessor
bw.theme = {
  colors: { primary: "#007bff", danger: "#dc3545" },
  spacing: { sm: "0.5rem", md: "1rem", lg: "1.5rem" }
};

bw.loadDefaultStyles(); // Generates .bw_btn, .bw_card, etc. from theme
```
**Why it matters**: This eliminates CSS variables, Sass, Tailwind. JS functions (potentially shared across components) generate whatever CSS is needed without namespace collisions. You get the full power of a programming language for your styles.

#### Inline Styles (Component-Level Overrides)
```javascript
{
  t: "div",
  a: { style: { backgroundColor: computedColor, padding: "1rem" } },
  c: "Dynamic styling"
}
```
**Why it matters**: Dynamic values that depend on data or state. A heatmap cell whose color is computed from a value. An element positioned by a layout algorithm.

#### Why All Three Together

The key insight: **properly named CSS classes trigger browser-native style recalculation** across all matching elements. Change `.bw_btn_primary { background: blue }` to `{ background: red }` and every primary button updates instantly - at browser engine speed, not JavaScript speed. No framework update cycle, no virtual DOM diff. The browser's style engine IS the reactive system.

This means:
1. External CSS provides the base theme and overrides
2. Generated classes provide the component defaults (from JS theme objects)
3. Inline styles provide per-instance dynamic values
4. CSS class changes give you free bulk reactivity

Bitwrench eliminates the need for CSS variables and Tailwind for most cases (JS functions do it better), but native CSS still has tricks we should exploit - class-based bulk updates being the biggest one.

### 3. Component Library Scope

The BCCL should cover roughly what Bootstrap does out of the box. Once the TACO engine, CSS system, and theme are solid, components are relatively easy - they're just functions returning objects with the right class names. The hard part is the foundation, not the components themselves.

**Core components (Bootstrap parity):**
- Layout: Container, Row/Col, Grid, Stack, Spacer
- Content: Card, Alert, Badge, Jumbotron/Hero, Accordion
- Navigation: Navbar, Tabs, Breadcrumb, Pagination
- Interactive: Button, ButtonGroup, Dropdown
- Data: Table (sortable, filterable), List, Progress
- Forms: Input, Select, Checkbox, Radio, Switch, Textarea, Form wrapper
- Feedback: Modal, Toast, Tooltip
- Utility: Spinner, Divider

**Advanced components (post-foundation):**
- DataGrid (virtual scrolling, column resize)
- Calendar, Chart, TreeView
- CodeEditor, JsonView

The key realization: a Card component is ~15 lines of JS. A Table with sorting is ~60. Most of the "100+ components" list is achievable once the CSS classes and theme exist. The bottleneck is getting `.bw_card`, `.bw_btn`, `.bw_table` etc. to look good by default.

#### Helper Functions Emit TACO, Not HTML

In bitwrench 1.x, helper functions like `bw.htmlTable()` and `bw.htmlTabs()` generated HTML strings directly. In v2, **all helpers emit TACO objects**. The rendering is always done by the core primitives (`bw.html()`, `bw.DOM()`, `bw.render()`).

This is a critical architectural layering:
```
┌─────────────────────────────────────────────┐
│  Helper Functions (TACO generators)          │
│  bw.makeTable(), bw.makeTabs(), bw.makeCard()│
│  Input: data + options                       │
│  Output: TACO objects                        │
├─────────────────────────────────────────────┤
│  Core Rendering Primitives                   │
│  bw.html(taco)  → HTML string               │
│  bw.DOM(sel, taco) → mount to page          │
│  bw.render(sel, taco) → interactive handle   │
├─────────────────────────────────────────────┤
│  Browser DOM                                 │
└─────────────────────────────────────────────┘
```

Why this matters:
1. **Composability** - A table's TACO can be nested inside a card's TACO. Helpers compose naturally because they all speak the same format.
2. **Serializable** - `bw.makeTable(data)` returns a plain object. `JSON.stringify()` it, send it over a wire, render it on the client. This is what makes bw.remote work.
3. **Inspectable** - `console.log(bw.makeTable(data))` shows you exactly what will be rendered. No black box.
4. **Renderable anywhere** - The same TACO from `bw.makeTable()` can be rendered as an HTML string (email, SSR), mounted to DOM (client-side), or used in a bw.remote patch.

```javascript
// v1.x (old) - helpers produced HTML strings directly
var html = bw.htmlTable([[1,2],[3,4]], { header: ["A","B"] });
document.getElementById("out").innerHTML = html;

// v2 - helpers produce TACO objects, core renders them
var taco = bw.makeTable([[1,2],[3,4]], { header: ["A","B"], sortable: true });
bw.DOM("#out", taco);           // Mount to page
bw.html(taco);                  // Or get HTML string
JSON.stringify(taco);           // Or serialize for bw.remote

// Compose freely
bw.DOM("#dashboard", {
  t: "div", a: { class: "bw_container" },
  c: [
    bw.makeCard({ title: "Data", content: bw.makeTable(data) }),
    bw.makeTabs([
      { label: "Chart", content: bw.makeBarChart(data) },
      { label: "Raw", content: bw.makeTable(data, { raw: true }) }
    ])
  ]
});
```

**Key helpers from v1.x that carry forward (as TACO generators):**
- `bw.makeTable(data, opts)` - Array/object → sortable table TACO. Supports headers, column types, sort callbacks.
- `bw.makeTabs(tabs, opts)` - Tab interface TACO with proper ARIA. `[{ label, content }]` → tablist + panels.
- `bw.makeCard(opts)` - Card with header, body, footer.
- `bw.makeButton(opts)` - Button with variants.
- All new BCCL components follow the same pattern: `bw.make*(input) → TACO`.

### 4. The Streamlit Challenger: `bw.remote()`

This is the most exciting future direction and deserves deep treatment.

#### Naming: Why `bw.remote()`

The server-driven UI mode needs a name that is:
- Honest about what it does (server remotely controls the UI)
- Natural as a function name (`bw.remote.connect(url)`)
- Natural as a product name ("built with Bitwrench Remote")
- Clear in relation to the other rendering modes

The rendering mode progression:
```
bw.html(taco)              → HTML string (static, SSR, email)
bw.DOM(selector, taco)     → mount to page (local, client-side)
bw.render(selector, taco)  → interactive handle (local, stateful)
bw.remote(url, options)    → server-driven (remote, over the wire)
```

`bw.remote()` reads naturally: "the UI is controlled remotely." It pairs with the local modes. Other candidates considered: `bw.live` (too vague - live what?), `bw.serve` (ambiguous - serving or being served?), `bw.wire` (too abstract), `bw.connect` (too generic, conflicts with WebSocket terminology). `bw.remote` is the clearest.

#### The Vision

A server in any language controls a web UI by sending TACO-as-JSON. User interactions flow back to the server as events. The bitwrench runtime in the browser is a thin, fast rendering layer. No React, no Next.js, no Node.js on the server. Just JSON over a wire.

```
┌─────────────────────┐         ┌─────────────────────────┐
│  Server (Any Lang)   │         │  Browser (bw.remote)     │
│                      │         │                          │
│  Python / Go / Rust  │  JSON   │  bitwrench runtime       │
│  Java / C# / PHP     │◄──────►│  (~15KB)                 │
│  LLM / AI agent      │  TACO   │                          │
│                      │         │  Renders TACO → DOM      │
│  Business logic      │         │  Captures user events    │
│  Data processing     │         │  Applies server patches  │
│  UI generation       │         │  Manages component classes│
└─────────────────────┘         └─────────────────────────┘
```

#### The Entire App Is One TACO Object

A bitwrench app can be expressed as a single TACO tree. Every node gets a UUID assigned by bitwrench during rendering:

```javascript
// Server sends this:
{
  t: "div", a: { class: "app" },
  c: [
    { t: "nav", a: { class: "bw_navbar" }, c: [...] },
    {
      t: "main", a: { class: "bw_container" },
      c: [
        { t: "div", a: { class: "bw_card", bw_id: "stats-card" }, c: [...] },
        { t: "table", a: { class: "bw_table", bw_id: "data-table" }, c: [...] }
      ]
    }
  ]
}

// Bitwrench renders it and assigns UUIDs to every node.
// Now ANY node can be surgically replaced by targeting its UUID or bw-id.
```

#### UUID Lifecycle and Registry

Every element rendered by bitwrench gets a UUID. This makes the entire DOM tree addressable. But references need management.

**Two kinds of identifiers:**

| | `bw-id` | `bw-uuid` (class-based) |
|---|---------|-----------|
| Assigned by | Author / server | bitwrench runtime (automatic) |
| DOM representation | `class="... bw_id_stats_card"` or custom attr | `class="... bw_uuid_a1b2c3d4"` |
| CSS queryable | `document.querySelector('.bw_id_stats_card')` | `document.querySelector('.bw_uuid_a1b2c3d4')` |
| Stability | Stable across re-renders | Ephemeral, changes on re-render |
| Uniqueness | Must be unique per page | Guaranteed unique (generated) |
| Purpose | "This is the stats card" | "This is row 47 right now" |
| Survives `bw.DOM()` re-render | Yes (if same bw-id in new TACO) | No (new UUIDs assigned) |
| Survives `bw.patch()` | Yes | Yes (unless element replaced/removed) |
| Use in patch targets | `"target": "bw_id:stats-card"` | `"target": "bw_uuid:a1b2c3d4"` |

**Everything is CSS classes. The DOM IS the registry.**

All bitwrench identifiers live in the `class` attribute. No custom attributes, no `data-*`, no `name` hijacking. The developer's `name`, `id`, and `data-*` attributes are theirs to use however they want. Bitwrench uses classes exclusively, with `bw_` prefixed names to avoid collisions.

#### Underscore Convention for All Bitwrench Classes

All bitwrench CSS classes use underscores, not hyphens: `bw_table`, not `bw-table`.

**Why underscores:**

1. **Dot notation in JS** - Underscores are valid JS identifier characters. Hyphens are the minus operator. This matters everywhere bitwrench class names appear in JavaScript:
    ```javascript
    // Underscores - clean JS, no quotes needed in TACO attributes
    { t: "div", a: { class: "bw_card", bw_id: "stats", bw_meta: { refresh: 5000 } } }

    // Hyphens - needs quotes because JS sees minus operator
    { t: "div", a: { class: "bw-card", "bw-id": "stats", "bw-meta": { refresh: 5000 } } }

    // Underscores - dot notation for style/class references
    bw.styles.bw_table           // works
    bw.classes.bw_btn_primary    // works
    const { bw_table } = bw.styles;  // clean destructuring

    // Hyphens - bracket notation required
    bw.styles['bw-table']        // clunky
    const { 'bw-table': bwTable } = bw.styles;  // awkward
    ```

2. **JS-first philosophy** - Bitwrench's thesis is that UI belongs in JavaScript, not HTML/CSS. Using JS naming conventions for class names reinforces this. CSS convention is hyphens (`font-size`, `btn-primary`) because CSS is a hyphen-oriented language. But we're in JS-land.

3. **Visual distinction** - `bw_table` is instantly distinguishable from Bootstrap's `table`, Tailwind's `flex`, or BEM's `block__element--modifier`. In a DOM inspector full of hyphenated classes, underscored `bw_` classes stand out as "bitwrench manages this."

4. **Consistent namespacing** - Everything bitwrench generates uses `bw_` prefix with underscores. No mixed conventions. Style classes, item types, UUIDs, attributes - all underscore.

**Convention is not a strong counterargument here.** Yes, CSS uses hyphens. But bitwrench isn't asking developers to write CSS. It generates CSS from JavaScript. The class names are produced by JS functions, referenced in JS objects, and queried by JS code. They happen to end up in CSS, but they originate in and are managed by JavaScript.

Three layers of class-based identification:

```
┌──────────────────────────────────────────────────────────┐
│  Layer 1: Style Classes (visual)                          │
│  class="bw_table bw_table_striped"                       │
│  Purpose: CSS styling, generated from bw.loadDefaultStyles│
│  Queryable: bw.$('.bw_table') → all styled tables        │
├──────────────────────────────────────────────────────────┤
│  Layer 2: Item Type Classes (component identity)          │
│  class="bw_item_table"                                   │
│  Purpose: "This is a bitwrench table component"           │
│  Queryable: bw.$('.bw_item_table') → all bw tables       │
│  Also: bw_item_card, bw_item_tabs, bw_item_btn, etc.    │
├──────────────────────────────────────────────────────────┤
│  Layer 3: UUID Classes (instance identity)                │
│  class="bw_uuid_a1b2c3d4"                               │
│  Purpose: "This specific element, right now"              │
│  Queryable: bw.$('.bw_uuid_a1b2c3d4') → one element     │
└──────────────────────────────────────────────────────────┘
```

A rendered table element has ALL three:
```html
<table class="bw_table bw_table_striped bw_item_table bw_uuid_a1b2c3d4">
```

This gives you powerful native queries for free:
```javascript
bw.$('.bw_item_table')                        // All bitwrench tables on the page
bw.$('.bw_item_card')                         // All bitwrench cards
bw.$('.bw_uuid_a1b2c3d4')                    // This specific element
bw.$('#sidebar .bw_item_card')               // All cards inside #sidebar
bw.$('.bw_item_table .bw_item_btn')          // All buttons inside tables
bw.$('.bw_table_striped.bw_item_table')      // Striped tables only
```

**Why this eliminates the need for a JS registry:**

The browser's CSS selector engine IS the registry. It's native C++ code, highly optimized, and already maintains an index of all elements and their classes. We don't need a parallel `Map` or `WeakMap`:

```javascript
// NO registry needed. The DOM IS the source of truth.
// Finding an element by UUID:
document.querySelector('.bw_uuid_a1b2c3d4')    // Native speed

// Finding all tables:
document.querySelectorAll('.bw_item_table')     // Native speed

// When element is removed from DOM, its classes go with it.
// No cleanup needed. No memory leaks possible.
// No MutationObserver. No sweep timer. No bw.cleanup().
// The problem simply doesn't exist.
```

Compare to the earlier design with `bw._registry = new Map()`:
- Map needs manual cleanup → MutationObserver → sweep timer → `bw.cleanup()`
- Map can leak if cleanup fails
- Map duplicates information already in the DOM
- Map needs to be kept in sync

With class-based lookup, all of that complexity vanishes. The lifecycle "problem" was an artifact of maintaining a parallel data structure. Remove the data structure, remove the problem.

**The only thing we still need MutationObserver for**: firing `unmount` lifecycle hooks (the `o.unmount` callback in TACO). That's a real concern - if an element with an unmount hook is removed, we need to call the hook. But that's a much narrower problem than "maintain a full registry of all elements."

**When UUIDs are created:**

UUIDs are assigned at render time, NOT at TACO creation time. A TACO object is pure data. The UUID is a DOM-lifetime concept:

```javascript
// This is just data. No UUIDs yet.
var taco = bw.makeTable(data, { header: ["Name", "Age"] });

// NOW UUIDs are assigned - every element gets classes added.
bw.DOM("#out", taco);

// Resulting DOM:
// <table class="bw_table bw_item_table bw_uuid_a1b2c3d4">
//   <thead class="bw_uuid_e5f6a7b8">
//     <tr class="bw_uuid_c9d0e1f2">
//       <th class="bw_uuid_f3a4b5c6">Name</th>
//       <th class="bw_uuid_d7e8f9a0">Age</th>
//     </tr>
//   </thead>
//   <tbody class="bw_uuid_b1c2d3e4">
//     <tr class="bw_uuid_f5a6b7c8">  <!-- row 0 -->
//     <tr class="bw_uuid_d9e0f1a2">  <!-- row 1 -->
//   </tbody>
// </table>
//
// Note: bw_item_table only on the <table> root.
// Child elements get UUIDs but not item type classes (they're structural, not components).

// Finding things - no registry, just CSS selectors:
bw.$('.bw_uuid_a1b2c3d4')              // → [<table>]
bw.$('.bw_item_table')                  // → [<table>]  (all tables)
bw.$('.bw_uuid_a1b2c3d4 tr')           // → [<tr>, <tr>, <tr>]  (all rows in this table)
bw.$('.bw_uuid_a1b2c3d4 tbody tr')     // → [<tr>, <tr>]  (data rows only)
```

**Lifecycle cleanup (simplified):**

Without a registry, cleanup reduces to:
1. **Element removal** - DOM handles it. Classes are gone when element is gone.
2. **Unmount hooks** - If an element has `o.unmount`, bitwrench needs to track those (small set) and fire them on removal. MutationObserver for Tier 1, manual `bw.cleanup()` for Tier 2.
3. **Event listeners** - If using event delegation (listeners on parent), no per-element cleanup needed. If direct listeners, they GC with the element.

**Re-render semantics:**

```javascript
// FULL REPLACE - old UUIDs vanish with old DOM, new ones born
bw.DOM("#app", newTaco);
// 1. Fire unmount hooks for elements that have them
// 2. Replace innerHTML (old elements + their UUID classes are gone)
// 3. Render new TACO, assign new UUID classes
// 4. Fire mounted hooks

// SURGICAL PATCH - existing UUIDs survive
bw.patch([
  { op: "update", target: "bw_uuid:a1b2c3d4", content: "new value" }
]);
// 1. querySelector('.bw_uuid_a1b2c3d4') - native speed
// 2. Update content in place
// 3. UUID class unchanged, element unchanged
```

`bw.DOM()` = "I want a fresh render." `bw.patch()` = "I want to modify what's there."

#### Sending Data to Components (Tables, Lists, Charts)

Because helpers emit TACO and every rendered element gets a UUID, data can be sent to components as arrays, CSV, or objects - and individual rows/cells can be updated by UUID.

**Table from array data:**
```javascript
// Server sends raw data + instructions
Server → Client:
{
  "type": "render",
  "target": "bw_id:main",
  "taco": {
    "t": "div",
    "c": bw.makeTable(
      [["Alice", 30, "Eng"], ["Bob", 25, "Sales"], ["Carol", 35, "Eng"]],
      { "header": ["Name", "Age", "Dept"], "sortable": true, bw_id: "emp-table" }
    )
  }
}

// After rendering, the registry knows every row:
// bw_id:emp-table      → <table>
// bw_uuid:r001         → <tr> Alice row
// bw_uuid:r002         → <tr> Bob row
// bw_uuid:r003         → <tr> Carol row
```

**Table from CSV:**
```javascript
// bw.makeTable() accepts CSV strings too
bw.makeTable(
  "Name,Age,Dept\nAlice,30,Eng\nBob,25,Sales",
  { "csvHeader": true, "sortable": true }
);
// Same TACO output as the array version
```

**Update a single row by UUID:**
```
Server → Client:
{
  "type": "patch",
  "operations": [{
    "op": "replace",
    "target": "bw_uuid:r002",
    "taco": { "t": "tr", "c": [
      { "t": "td", "c": "Bob" },
      { "t": "td", "c": "26" },
      { "t": "td", "c": "Marketing" }
    ]}
  }]
}
// Only Bob's row re-renders. Alice and Carol untouched.
```

**Append rows:**
```
Server → Client:
{
  "type": "patch",
  "operations": [{
    "op": "append",
    "target": "bw_id:emp-table tbody",
    "taco": { "t": "tr", "c": [
      { "t": "td", "c": "Dave" },
      { "t": "td", "c": "28" },
      { "t": "td", "c": "Design" }
    ]}
  }]
}
// New row appended. Gets a new UUID automatically.
```

**Bulk data update (replace all rows, keep header):**
```
Server → Client:
{
  "type": "patch",
  "operations": [{
    "op": "replace",
    "target": "bw_id:emp-table tbody",
    "taco": bw.makeTableBody(newData)   // Helper that emits just <tbody> rows
  }]
}
// Header, sort state, column widths preserved. Only data rows replaced.
```

**How the server knows row UUIDs:**

When the client renders a table (or any component), it can report the UUID map back to the server:

```
Client → Server (after render):
{
  "type": "rendered",
  "target": "bw_id:emp-table",
  "uuidMap": {
    "thead": "bw_uuid:h001",
    "rows": [
      { "uuid": "bw_uuid:r001", "key": 0 },
      { "uuid": "bw_uuid:r002", "key": 1 },
      { "uuid": "bw_uuid:r003", "key": 2 }
    ]
  }
}
```

Alternatively, the server can pre-assign `bw-id`s to rows using a data key:
```javascript
bw.makeTable(data, {
  header: ["Name", "Age", "Dept"],
  rowId: (row, i) => "emp-" + row[0].toLowerCase()  // bw_id: "emp-alice", "emp-bob", etc.
});
// Now server can target "bw_id:emp-bob" without needing UUID reports
```

This is cleaner for most use cases - the server controls the identity scheme, using data keys it already knows (database IDs, usernames, etc.).

#### The Protocol

**Phase 1: Initial Render**
```
Server → Client:
{
  type: "render",
  target: "body",
  taco: { /* entire page as TACO-JSON */ }
}
```

**Phase 2: User Interaction**
```
Client → Server:
{
  type: "event",
  event: "click",
  target: "bw_id:submit-btn",
  data: {
    formValues: { name: "John", email: "john@example.com" },
    timestamp: 1709136000
  }
}
```

**Phase 3: Server Sends Patches**
```
Server → Client:
{
  type: "patch",
  operations: [
    {
      op: "replace",
      target: "bw_id:data-table",
      taco: { t: "table", c: [/* updated rows */] }
    },
    {
      op: "update",
      target: "bw_id:stats-card",
      attrs: { class: "bw_card bw_card_success" },
      content: "42 records saved"
    },
    {
      op: "append",
      target: "bw_id:notification-area",
      taco: { t: "div", a: { class: "bw_alert bw_alert_success" }, c: "Saved!" }
    },
    {
      op: "remove",
      target: "bw_id:loading-spinner"
    }
  ]
}
```

**Patch operations:**
- `replace` - Replace entire component with new TACO
- `update` - Update attributes and/or content of existing component
- `append` - Add child to existing component
- `prepend` - Add child at start
- `remove` - Remove component
- `reorder` - Reorder children
- `style` - Update CSS class or inline style only

#### Worked Example: Replacing DOM Elements and Pages

These examples show the full round-trip for common bw.remote scenarios.

**Example 1: Replacing a single component (table data refresh)**

```
1. Server sends initial page:
Server → Client:
{
  "type": "render",
  "target": "body",
  "taco": {
    "t": "div", "a": { "class": "bw_container" },
    "c": [
      { "t": "h1", "c": "Employee Directory" },
      { "t": "div", "a": { bw_id: "emp-table" },
        "c": bw.makeTable([
          ["Alice", "Engineering", "Senior"],
          ["Bob", "Sales", "Junior"]
        ], { "header": ["Name", "Dept", "Level"] })
      },
      { "t": "button", "a": { "class": "bw_btn", bw_id: "refresh-btn" },
        "c": "Refresh"
      }
    ]
  }
}

2. User clicks Refresh:
Client → Server:
{
  "type": "event",
  "event": "click",
  "target": "bw_id:refresh-btn"
}

3. Server fetches fresh data, sends ONLY the table replacement:
Server → Client:
{
  "type": "patch",
  "operations": [{
    "op": "replace",
    "target": "bw_id:emp-table",
    "taco": bw.makeTable([
      ["Alice", "Engineering", "Senior"],
      ["Bob", "Sales", "Junior"],
      ["Carol", "Engineering", "Mid"]
    ], { "header": ["Name", "Dept", "Level"] })
  }]
}
// Only the table re-renders. The h1, button, everything else untouched.
```

**Example 2: Full page navigation (SPA-style)**

```
1. User clicks a nav link:
Client → Server:
{
  "type": "event",
  "event": "click",
  "target": "bw_id:nav-settings"
}

2. Server replaces the main content area (not the whole page):
Server → Client:
{
  "type": "patch",
  "operations": [{
    "op": "replace",
    "target": "bw_id:main-content",
    "taco": {
      "t": "div", "a": { "class": "bw_container" },
      "c": [
        { "t": "h1", "c": "Settings" },
        bw.makeTabs([
          { "label": "Profile", "content": settingsForm },
          { "label": "Security", "content": securityForm },
          { "label": "Notifications", "content": notifForm }
        ])
      ]
    }
  },
  {
    "op": "update",
    "target": "bw_id:nav-settings",
    "attrs": { "class": "bw_nav_link active" }
  },
  {
    "op": "update",
    "target": "bw_id:nav-dashboard",
    "attrs": { "class": "bw_nav_link" }
  }]
}
// Navbar stays, main content swaps, active nav link updates.
// Three operations in one patch = one round-trip.
```

**Example 3: Progressive element updates (dashboard live data)**

```
Server pushes periodic updates (no user action needed):
Server → Client:
{
  "type": "patch",
  "operations": [
    { "op": "update", "target": "bw_id:cpu-gauge", "content": "73%" },
    { "op": "update", "target": "bw_id:mem-gauge", "content": "4.2 GB" },
    { "op": "style",  "target": "bw_id:cpu-gauge",
      "attrs": { "class": "bw_badge bw_badge_warning" }  // yellow = elevated
    },
    { "op": "replace", "target": "bw_id:activity-log",
      "taco": bw.makeTable(latestLogs, { "header": ["Time", "Event", "Status"] })
    }
  ]
}
// Four targeted updates. No full page re-render. Browser handles each independently.
```

#### Worked Example: Getting User Input Back

**Example 4: Form submission**

```
1. Server sends a form (could be generated from JSON Schema):
Server → Client:
{
  "type": "render",
  "target": "bw_id:main-content",
  "taco": {
    "t": "form", "a": { "class": "bw_form", bw_id: "contact-form" },
    "c": [
      bw.makeInput({ "name": "email", "type": "email", "label": "Email", "required": true }),
      bw.makeInput({ "name": "subject", "label": "Subject" }),
      bw.makeTextarea({ "name": "message", "label": "Message", "rows": 5 }),
      bw.makeSelect({ "name": "priority", "label": "Priority",
                       "options": ["Low", "Medium", "High"] }),
      bw.makeButton({ "type": "submit", "content": "Send", bw_id: "send-btn" })
    ]
  }
}

2. User fills in form, clicks Send. Client auto-collects form values:
Client → Server:
{
  "type": "event",
  "event": "submit",
  "target": "bw_id:contact-form",
  "data": {
    "formValues": {
      "email": "alice@example.com",
      "subject": "Bug report",
      "message": "The login page is broken",
      "priority": "High"
    }
  }
}
// bw.remote automatically serializes all named form fields.
// No manual DOM querying. No document.getElementById.

3. Server validates and responds:
Server → Client:
{
  "type": "patch",
  "operations": [
    { "op": "replace", "target": "bw_id:contact-form",
      "taco": {
        "t": "div", "a": { "class": "bw_alert bw_alert_success" },
        "c": "Message sent successfully!"
      }
    }
  ]
}

// OR, if validation fails:
{
  "type": "patch",
  "operations": [
    { "op": "update", "target": "bw_id:email-error",
      "content": "Invalid email address",
      "attrs": { "class": "bw_form_error visible" }
    }
  ]
}
```

**Example 5: Interactive controls (slider, toggle, search-as-you-type)**

```
1. Server sends a search interface:
{
  "t": "div", "a": { bw_id: "search-panel" },
  "c": [
    bw.makeInput({ "name": "query", "type": "search", "label": "Search",
                    "placeholder": "Type to filter...",
                    bw_id: "search-input",
                    bw_events: ["input"] }),  // Emit on every keystroke
    { "t": "div", "a": { bw_id: "search-results" }, "c": "Type to search..." }
  ]
}

2. User types "al" - client sends on each keystroke (debounced):
Client → Server:
{
  "type": "event",
  "event": "input",
  "target": "bw_id:search-input",
  "data": { "value": "al" }
}

3. Server filters data, sends results:
Server → Client:
{
  "type": "patch",
  "operations": [{
    "op": "replace",
    "target": "bw_id:search-results",
    "taco": bw.makeTable(
      [["Alice", "Engineering"], ["Albert", "Sales"]],
      { "header": ["Name", "Dept"] }
    )
  }]
}
```

**Example 6: Multi-step interaction (wizard / dialog)**

```
1. User clicks "Delete Account":
Client → Server:
{ "type": "event", "event": "click", "target": "bw_id:delete-acct-btn" }

2. Server injects a confirmation modal:
Server → Client:
{
  "type": "patch",
  "operations": [{
    "op": "append",
    "target": "body",
    "taco": {
      "t": "div", "a": { "class": "bw_modal_backdrop", bw_id: "confirm-modal" },
      "c": {
        "t": "div", "a": { "class": "bw_modal" },
        "c": [
          { "t": "h3", "c": "Are you sure?" },
          { "t": "p", "c": "This action cannot be undone." },
          { "t": "div", "a": { "class": "bw_btn_group" }, "c": [
            { "t": "button", "a": { "class": "bw_btn bw_btn_danger", bw_id: "confirm-yes" },
              "c": "Delete" },
            { "t": "button", "a": { "class": "bw_btn", bw_id: "confirm-no" },
              "c": "Cancel" }
          ]}
        ]
      }
    }
  }]
}

3. User clicks Cancel:
Client → Server:
{ "type": "event", "event": "click", "target": "bw_id:confirm-no" }

4. Server removes modal:
Server → Client:
{
  "type": "patch",
  "operations": [{ "op": "remove", "target": "bw_id:confirm-modal" }]
}
```

#### Worked Example: Swapping Components

**Example 7: Swap a component for a completely different one**

The `replace` operation doesn't care what was there before. A table can become a chart. A login form can become a dashboard. The `bw-id` is the anchor point - what's inside it is completely replaced.

```
1. Initial state: a data table showing sales figures
Server → Client:
{
  "type": "render",
  "target": "bw_id:main-content",
  "taco": {
    "t": "div", "a": { "class": "bw_container" },
    "c": [
      { "t": "div", "a": { "class": "bw_btn_group" }, "c": [
        { "t": "button", "a": { "class": "bw_btn bw_btn_primary", bw_id: "view-table" },
          "c": "Table" },
        { "t": "button", "a": { "class": "bw_btn", bw_id: "view-chart" },
          "c": "Chart" },
        { "t": "button", "a": { "class": "bw_btn", bw_id: "view-cards" },
          "c": "Cards" }
      ]},
      { "t": "div", "a": { bw_id: "data-view" },
        "c": bw.makeTable(salesData, { "header": ["Month", "Revenue", "Growth"] })
      }
    ]
  }
}

2. User clicks "Chart":
Client → Server:
{ "type": "event", "event": "click", "target": "bw_id:view-chart" }

3. Server replaces the table with a completely different component (SVG chart):
Server → Client:
{
  "type": "patch",
  "operations": [
    {
      "op": "replace",
      "target": "bw_id:data-view",
      "taco": {
        "t": "svg", "a": { "viewBox": "0 0 400 200", "class": "bw_chart" },
        "c": salesData.map((d, i) => ({
          "t": "rect",
          "a": {
            "x": i * 35, "y": 200 - d.revenue / 500,
            "width": 30, "height": d.revenue / 500,
            "class": "bw_chart_bar"
          }
        }))
      }
    },
    { "op": "update", "target": "bw_id:view-chart",
      "attrs": { "class": "bw_btn bw_btn_primary" } },
    { "op": "update", "target": "bw_id:view-table",
      "attrs": { "class": "bw_btn" } }
  ]
}
// The table is gone. An SVG chart is in its place.
// The bw_id:data-view anchor survived - it now contains different content.
// Old table UUIDs are cleaned up automatically.

4. User clicks "Cards":
Client → Server:
{ "type": "event", "event": "click", "target": "bw_id:view-cards" }

5. Server replaces the chart with card components:
Server → Client:
{
  "type": "patch",
  "operations": [
    {
      "op": "replace",
      "target": "bw_id:data-view",
      "taco": {
        "t": "div", "a": { "class": "bw_grid", "style": "grid-template-columns: repeat(3, 1fr)" },
        "c": salesData.map(d => bw.makeCard({
          "title": d.month,
          "content": [
            { "t": "p", "a": { "class": "bw_h2" }, "c": "$" + d.revenue },
            { "t": "span", "a": { "class": d.growth > 0 ? "bw_text_success" : "bw_text_danger" },
              "c": d.growth + "%" }
          ]
        }))
      }
    },
    { "op": "update", "target": "bw_id:view-cards",
      "attrs": { "class": "bw_btn bw_btn_primary" } },
    { "op": "update", "target": "bw_id:view-chart",
      "attrs": { "class": "bw_btn" } }
  ]
}
// Chart is gone. Three cards are in its place.
// Same bw_id:data-view, completely different content. Again.
```

**Example 8: Login → Dashboard transition (full app state change)**

```
1. App starts with a login form:
Server → Client:
{
  "type": "render",
  "target": "body",
  "taco": {
    "t": "div", "a": { "class": "bw_container", bw_id: "app-root" },
    "c": {
      "t": "div", "a": { "class": "bw_card", "style": "max-width: 400px; margin: 4rem auto" },
      "c": [
        { "t": "h2", "c": "Login" },
        { "t": "form", "a": { bw_id: "login-form" }, "c": [
          bw.makeInput({ "name": "username", "label": "Username", "required": true }),
          bw.makeInput({ "name": "password", "type": "password", "label": "Password" }),
          bw.makeButton({ "type": "submit", "content": "Sign In" })
        ]}
      ]
    }
  }
}

2. User submits login:
Client → Server:
{
  "type": "event", "event": "submit", "target": "bw_id:login-form",
  "data": { "formValues": { "username": "alice", "password": "..." } }
}

3. Server authenticates, replaces ENTIRE app content with dashboard:
Server → Client:
{
  "type": "patch",
  "operations": [{
    "op": "replace",
    "target": "bw_id:app-root",
    "taco": {
      "t": "div",
      "c": [
        bw.makeNavbar({
          "brand": "MyApp",
          "items": [
            { "label": "Dashboard", bw_id: "nav-dash", "active": true },
            { "label": "Settings", bw_id: "nav-settings" },
            { "label": "Logout", bw_id: "logout-btn" }
          ]
        }),
        { "t": "main", "a": { "class": "bw_container", bw_id: "main-content" },
          "c": [
            { "t": "h1", "c": "Welcome back, Alice" },
            { "t": "div", "a": { "class": "bw_grid" }, "c": [
              bw.makeCard({ "title": "Messages", "content": "12 unread", bw_id: "msg-card" }),
              bw.makeCard({ "title": "Tasks", "content": "5 pending", bw_id: "task-card" }),
              bw.makeCard({ "title": "Reports", "content": "3 new", bw_id: "report-card" })
            ]},
            bw.makeTable(recentActivity, {
              "header": ["Time", "Action", "Status"],
              bw_id: "activity-table"
            })
          ]
        }
      ]
    }
  }]
}
// Login form is completely gone. Full dashboard in its place.
// One replace operation. The app-root bw-id is the stable anchor.
// All new components get fresh UUIDs. All old ones cleaned up.
```

The key insight: **`bw-id` is the stable anchor, content is ephemeral.** You can replace what's inside any `bw-id` with anything else. A table becomes a chart becomes a card grid. A login form becomes a dashboard. The server just sends new TACO and says "put this where that was."

**Key design principle for user input:**
- The client runtime automatically captures form values for `submit` events
- Individual input events carry the input's current `value`
- `bw-events` attribute on an element controls which DOM events are forwarded to the server (default: `["click", "submit"]`)
- Client-side debouncing for high-frequency events (`input`, `scroll`, `resize`)
- Server never needs to know how to query the DOM - it just receives clean JSON data

#### The bw_metadata Field

TACO nodes can carry metadata in the attributes that is meaningful to bitwrench but invisible to the DOM:

```javascript
{
  t: "div",
  a: {
    class: "bw_card",
    bw_id: "user-profile",        // Stable identifier for patching
    bw_meta: {
      type: "card",                   // Component type
      refresh: 5000,                  // Auto-refresh every 5s
      source: "/api/user/123",        // Data source URL
      lifespan: "session",            // When to clean up: session, page, manual
      cacheable: true,                // Can be cached client-side
      priority: "high",              // Render priority for lazy loading
      version: 3,                    // For optimistic concurrency
      bindings: {                    // Data bindings for two-way sync
        "input.email": "user.email",
        "span.name": "user.displayName"
      }
    }
  },
  c: [...]
}
```

**What metadata enables:**
- **Auto-refresh**: Components that poll their data source on a schedule
- **Lifespan management**: Runtime knows when to garbage collect
- **Optimistic updates**: Version numbers prevent stale overwrites
- **Data binding declarations**: Server describes how UI maps to data, client can handle simple updates without round-tripping
- **Caching hints**: Client can cache component output and skip re-renders
- **Priority**: Lazy-load below-the-fold components, render critical ones first

#### Why This Beats Streamlit

| Aspect | Streamlit | bw.remote |
|--------|-----------|---------|
| Server language | Python only | Any language |
| Update model | Re-run entire script | Surgical patches |
| Payload size | Large (custom protocol) | Tiny (JSON TACO) |
| Component model | Python classes → custom JS | JSON → native DOM |
| Browser runtime | Heavy (React + custom) | Light (~15KB) |
| Offline capable | No | Yes (cached TACO) |
| State location | Server-only | Server or client |
| Latency | Full round-trip per interaction | Patches, can optimistic-update |

#### Why This Beats HTMX

HTMX sends HTML fragments. Bitwrench sends structured data (JSON). This means:

- TACO patches can be diffed, merged, and cached (HTML fragments can't)
- Server doesn't need an HTML template engine (just JSON)
- Patches carry metadata (refresh rates, bindings, caching hints)
- The client can do smart things with structured data (sort locally, filter locally, animate transitions)

#### LLM-Driven UI Generation

Because TACO is just JSON, LLMs can generate UIs directly:

```
User prompt: "Show me a dashboard with sales data"

LLM generates:
{
  "t": "div", "a": { "class": "bw_container" },
  "c": [
    { "t": "h1", "c": "Sales Dashboard" },
    {
      "t": "div", "a": { "class": "bw_grid", "style": "grid-template-columns: repeat(3, 1fr)" },
      "c": [
        { "t": "div", "a": { "class": "bw_card" }, "c": [
          { "t": "h3", "c": "Revenue" },
          { "t": "p", "a": { "class": "bw_h2" }, "c": "$125,000" }
        ]},
        { "t": "div", "a": { "class": "bw_card" }, "c": [
          { "t": "h3", "c": "Orders" },
          { "t": "p", "a": { "class": "bw_h2" }, "c": "342" }
        ]},
        { "t": "div", "a": { "class": "bw_card" }, "c": [
          { "t": "h3", "c": "Growth" },
          { "t": "p", "a": { "class": "bw_h2" }, "c": "+12.5%" }
        ]}
      ]
    }
  ]
}
```

**Why TACO is better for LLMs than HTML:**
- Structured data is what LLMs are best at generating
- No mismatched closing tags (objects self-close)
- Compact format = fewer tokens = cheaper and faster
- Validation is trivial (check for `t` property, done)
- Can be streamed as partial JSON (each component is independently valid)

**The LLM loop:**
1. User describes what they want (natural language)
2. LLM generates TACO-as-JSON
3. bitwrench renders it instantly
4. User interacts, events go to LLM (or server)
5. LLM generates TACO patches
6. bitwrench applies patches

This is a fraction of the work vs. generating React/Vue components, which need compilation, imports, state management, etc.

#### Transport: SSE + WebSockets (Support Both)

Server-Sent Events (SSE) and WebSockets serve different use cases. Both must be first-class:

**SSE (default for most apps):**
- Server pushes TACO patches, client sends events via regular HTTP POST
- Simpler server implementation (any HTTP server works)
- Works through proxies, load balancers, CDNs without special config
- Auto-reconnect built into the browser API
- Sufficient for dashboards, admin panels, data displays

```javascript
// Client
bw.remote.connect("/api/stream", { transport: "sse" });

// Server (any language) just writes SSE events:
// data: {"type":"patch","operations":[...]}
```

**WebSockets (opt-in for high-frequency):**
- Bidirectional, low-latency
- Needed for: chat, collaborative editing, gaming, real-time trading
- More complex server setup

```javascript
bw.remote.connect("ws://localhost:8080", { transport: "ws" });
```

**Auto-negotiation:**
```javascript
// Try WebSocket, fall back to SSE, fall back to polling
bw.remote.connect("/api", { transport: "auto" });
```

#### The Portable Streamlit: Server-Side Examples

The killer demo for bw.remote: the **same example app** implemented in multiple server languages. This proves the "any language" promise isn't theoretical. Each example should be the same app (e.g., a data dashboard with interactive filters) so the comparison is direct.

**Reference Example: Interactive Data Dashboard**
- A table of data with sortable columns
- Filter controls (dropdowns, search)
- Summary cards that update when filters change
- A chart/visualization that responds to selections
- Form to add new records

**Node.js / Bun Example** (`examples/server/node/`)
```javascript
// server.js - ~50 lines
const http = require("http");
const bw = require("bitwrench-server");

const app = bw.createApp();

app.page("/", (ctx) => ({
  t: "div", a: { class: "bw_container" },
  c: [
    { t: "h1", c: "Dashboard" },
    bw.makeTable(ctx.data, { sortable: true, bw_id: "main-table" }),
    bw.makeCard({ title: "Total", content: ctx.data.length, bw_id: "stats" })
  ]
}));

app.on("click", "bw_id:add-btn", (ctx, event) => {
  ctx.data.push(event.data.formValues);
  ctx.patch([
    { op: "replace", target: "bw_id:main-table", taco: bw.makeTable(ctx.data) },
    { op: "update", target: "bw_id:stats", content: ctx.data.length }
  ]);
});

app.listen(3000);
```

**Python Example** (`examples/server/python/`)
```python
# server.py - ~50 lines
from bitwrench import App, table, card, container

app = App()

@app.page("/")
def dashboard(ctx):
    return container([
        {"t": "h1", "c": "Dashboard"},
        table(ctx.data, sortable=True, bw_id="main-table"),
        card(title="Total", content=len(ctx.data), bw_id="stats")
    ])

@app.on("click", "bw_id:add-btn")
def add_record(ctx, event):
    ctx.data.append(event.data["formValues"])
    ctx.patch([
        {"op": "replace", "target": "bw_id:main-table", "taco": table(ctx.data)},
        {"op": "update", "target": "bw_id:stats", "content": len(ctx.data)}
    ])

app.run(port=3000)
```

**Go Example** (`examples/server/go/`)
```go
// server.go - ~60 lines
package main

import "github.com/bitwrench/bitwrench-go"

func main() {
    app := bitwrench.NewApp()

    app.Page("/", func(ctx *bitwrench.Context) bitwrench.TACO {
        return bitwrench.Container(
            bitwrench.T("h1", "Dashboard"),
            bitwrench.Table(ctx.Data, bitwrench.Opts{Sortable: true, BwID: "main-table"}),
            bitwrench.Card("Total", len(ctx.Data), bitwrench.Opts{BwID: "stats"}),
        )
    })

    app.Listen(":3000")
}
```

**Key principle**: The server libraries are thin. They provide:
1. TACO builder helpers (optional - you can always write raw dicts/maps)
2. SSE/WebSocket transport
3. Event routing
4. Session/state management

The client-side bitwrench runtime is identical regardless of server language. The server just emits JSON.

#### Implementation Roadmap for bw.remote

**Phase 1: Client-side patching engine**
- `bw.patch(operations)` - apply patch operations to live DOM
- UUID tracking on all rendered elements
- `bw-id` attribute for stable component identity

**Phase 2: Transport layer**
- SSE wrapper: `bw.remote.connect(url, { transport: "sse" })` - default, simple
- WebSocket wrapper: `bw.remote.connect(url, { transport: "ws" })` - opt-in, bidirectional
- HTTP polling fallback: `bw.remote.connect(url, { transport: "poll", interval: 2000 })`
- Auto-negotiation: `{ transport: "auto" }` tries ws → sse → poll
- Event capture: automatic event serialization and HTTP POST (SSE) or message (WS)

**Phase 3: Server libraries**
- Node.js/Bun: `npm install bitwrench-server` - reference implementation
- Python: `pip install bitwrench` - streamlit replacement, the headline demo
- Go: `go get bitwrench-go` - for performance-critical backends
- Others: the protocol is just JSON over SSE/WS, any language can implement it

**Phase 4: Developer experience**
- Hot reload: server pushes full page TACO on file change
- Inspector: browser extension showing TACO tree alongside DOM
- Playground: web-based TACO editor with live preview

## Design Decisions (Resolved)

### 1. Accessibility (a11y)
First-class concern, not an afterthought. All BCCL components must emit correct ARIA attributes by default. A button is `role="button"`, a modal has `aria-modal="true"`, tabs use `role="tablist"/"tab"/"tabpanel"` with proper `aria-selected` and keyboard navigation. Users shouldn't need to know ARIA - the components handle it. TACO makes this natural since ARIA attrs are just more dictionary keys in `a: {}`.

### 2. XSS / Content Escaping
**Default: safe. Override: explicit.**

All text content (`c: string`) is HTML-escaped by default. This is the only sane default, especially for bw.remote where TACO comes from a server or an LLM.

For raw HTML (trusted content, markdown output, etc.), require an explicit opt-in:
```javascript
// Safe by default
{ t: "p", c: userInput }                          // Escaped: <script> becomes &lt;script&gt;

// Explicit raw HTML - developer takes responsibility
{ t: "div", c: trustedHTML, o: { raw: true } }    // Injected as innerHTML

// Alternative: wrapper function for clarity
{ t: "div", c: bw.raw(trustedHTML) }              // Same thing, more readable
```

The `bw.raw()` wrapper or `o: { raw: true }` flag makes it obvious in code review that unescaped content is intentional. An expert developer can override the escaping, but they have to say so explicitly.

### 3. SVG Support
In scope. TACO represents SVG elements natively since they're just tags with attributes and children:
```javascript
// An SVG icon is just a TACO object
const checkIcon = {
  t: "svg", a: { viewBox: "0 0 24 24", width: "16", height: "16" },
  c: { t: "path", a: { d: "M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" } }
};

// Use it anywhere
{ t: "button", a: { class: "bw_btn" }, c: [checkIcon, " Save"] }
```
Need examples showing: icons, simple charts (bar, line, pie), data visualization. No icon library dependency needed - ship a few common icons as TACO objects, users can add their own or convert SVG files trivially.

### 4. Content Security Policy (CSP)
**Default: nonce-based injection. Override: configurable.**

Runtime CSS generation (`bw.loadDefaultStyles()`, `bw.css()`) injects `<style>` tags, which CSP blocks by default. Strategy:

```javascript
// Option A (recommended default): Nonce-based
// Server sets CSP header: style-src 'nonce-abc123'
bw.config.cspNonce = "abc123";
// All injected <style> tags get nonce="abc123"

// Option B: Pre-generated CSS file
// Run bw.css() at build time, save to .css file, serve statically
// No runtime injection needed, strictest CSP is fine
bw.generateCSSFile("bw-theme.css");   // Build-time tool

// Option C: Hash-based (for known, static styles)
// Server includes hash of generated CSS in CSP header
```

For enterprise/government deployments (strict CSP), recommend pre-generated CSS files. For development and most deployments, nonce-based injection works. The `bw.config.cspNonce` setting applies globally to all injected style elements.

### 5. Forms and Validation
Built-in form handling that borrows the best ideas from frameworks. The clever bit: **forms can be described as JSON Schema and return values as JSON Schema-compatible objects.**

```javascript
// Form definition (could come from server as JSON)
const userForm = {
  t: "form", a: { class: "bw_form", bw_id: "user-form" },
  c: [
    bw.makeInput({ name: "email", type: "email", label: "Email", required: true }),
    bw.makeInput({ name: "age", type: "number", label: "Age", min: 0, max: 150 }),
    bw.makeSelect({ name: "role", label: "Role", options: ["admin", "user", "guest"] }),
    bw.makeButton({ type: "submit", content: "Save" })
  ]
};

// Collect form values as a clean object
bw.formValues("#user-form");
// Returns: { email: "john@example.com", age: 30, role: "admin" }

// Validation (built-in common types, extensible)
bw.formValidate("#user-form");
// Returns: { valid: true, errors: {} }
// Or: { valid: false, errors: { email: "Required field", age: "Must be a number" } }
```

**JSON Schema integration:**
```javascript
// Define form FROM a JSON Schema
const schema = {
  type: "object",
  properties: {
    email: { type: "string", format: "email" },
    age: { type: "integer", minimum: 0 },
    role: { type: "string", enum: ["admin", "user", "guest"] }
  },
  required: ["email"]
};

bw.makeFormFromSchema(schema);  // Generates the TACO form automatically
bw.formValues("#form");         // Returns JSON Schema-valid object

// Round-trip: schema → form → user fills in → values match schema
// Perfect for bw.remote: server sends schema, client renders form, client returns valid data
```

This is especially powerful for bw.remote: the server sends a JSON Schema, bitwrench renders a form, the user fills it in, and the values come back as a validated JSON object that the server can trust.

### 6. Animation / Transitions
**Next version (v2.1).** Not in initial v2.0 scope. CSS transitions on class changes will cover 80% of cases naturally (fade, slide, collapse are just CSS). The `unmount` hook can be extended later to support async cleanup for exit animations:
```javascript
// Future: async unmount for exit animation
o: {
  unmount: async (el) => {
    el.classList.add("fade-out");
    await bw.transitionEnd(el);  // Wait for CSS transition
  }
}
```

### 7. Client-Side Routing
**Next version (v2.1), but stub the API now.** A minimal hash-router that maps routes to TACO-generating functions:
```javascript
// Stub API (v2.0 - just document the interface)
// Implementation in v2.1
bw.router = {
  route(path, handler) { },   // Register route
  navigate(path) { },         // Programmatic navigation
  current() { }               // Get current route
};

// Future usage:
bw.router.route("/", () => HomePage());
bw.router.route("/users/:id", (params) => UserPage(params.id));
bw.router.route("/settings", () => SettingsPage());
bw.router.start();  // Begin listening to hash changes
```

For bw.remote, routing might live on the server anyway (server decides what TACO to send based on URL). Client routing is primarily for pure-client apps.

### 8. Bundle Size Budget
**Target: 45KB gzipped max** for the full library including all BCCL components and bw.remote client.

Breakdown estimate:
- Core engine (TACO, CSS, DOM, utilities): ~8KB gzipped
- BCCL components (Bootstrap parity): ~15KB gzipped
- bw.remote client (patching, transport, event capture): ~5KB gzipped
- Default theme CSS generation: ~5KB gzipped
- Legacy compat / polyfills: ~3KB gzipped
- Headroom: ~9KB

If it grows beyond 45KB, consider splitting into:
- `bitwrench.js` - core + components (most users)
- `bitwrench-remote.js` - bw.remote client (server-driven apps only)

### 9. Plugin / Extension Model
**No formal plugin API. Components are just functions. That IS the extension model.**

```javascript
// A "plugin" is just a module that exports TACO-generating functions
// my-charts.js
export const BarChart = (data, opts) => ({
  t: "svg", a: { class: "bw_chart bw_chart_bar", viewBox: "..." },
  c: data.map((d, i) => ({
    t: "rect",
    a: { x: i * barWidth, y: maxHeight - d.value, width: barWidth, height: d.value }
  }))
});

// Usage - just import and call
import { BarChart } from "./my-charts.js";
bw.DOM("#chart", BarChart(salesData, { color: "blue" }));
```

No registration, no `bw.use()`, no lifecycle to learn. If your function returns a valid TACO object, it works with `bw.html()`, `bw.DOM()`, `bw.render()`, and bw.remote. The TACO format IS the plugin contract.

For components that need CSS, they can call `bw.injectCSS()` on first use (idempotent) or document which CSS classes they expect from the theme.

### 10. SSE vs WebSockets
**Support both. SSE is the default.** See Transport section under bw.remote above.

## Modernization Notes

Things that need updating for a clean v2:

1. **Browser compatibility** - Tiered support strategy. See [bw2x-compatibility.md](./bw2x-compatibility.md). IE8+ for HTML generation, modern browsers for full features. The constraint forces discipline.

2. **Clean up the API surface** - Too many functions. Consolidate naming. The `html*` prefix (htmlTable, htmlTabs) should become `make*` consistently.

3. **Three clear rendering modes** - `bw.html(taco)` for string generation (SSR, email, static). `bw.DOM(selector, taco)` for mounting to page. `bw.render(selector, taco)` for interactive components with handles. Each mode has a clear use case.

4. **Module format** - ESM as primary. UMD for `<script>` tag usage. ES5 build for legacy environments. Drop CJS unless there's a real Node.js use case.

5. **Test suite** - 100% test coverage required (lines, branches, functions, statements). No exceptions, no istanbul ignores unless genuinely untestable (e.g. browser-only code paths tested via Playwright instead).
   - **Unit tests**: Mocha + jsdom + nyc for all core functions (`bw.html()`, `bw.css()`, `bw.DOM()`, TACO parsing, color functions, utilities, etc.). This is where 100% coverage is measured.
   - **Playwright tests**: End-to-end tests for all example pages - verify they load without errors, components render correctly, interactive features work (sorting, tabs, forms), themes apply, no console errors. Also visual regression and accessibility checks.
   - **Compatibility test suite**: Verify each browser tier gets the features it should (see bw2x-compatibility.md).

6. **UUID system** - Every rendered element gets a `bw_uuid_xxxx` class. Components can also have stable `bw-id` attributes for server-driven patching.

## Open Questions

1. **How much backward compat with v1?** Current answer: minimal. Few users, clean break is acceptable.

2. **Component handles: needed or overengineered?** For core components, `bw.DOM()` with full re-render is fine. Handles become useful for stateful components (tables, modals) and for the bw.remote server-driven model.

3. **CSS delivery**: All three approaches are first-class. Generate CSS from JS theme by default. Ship pre-built `.css` files as alternative. Support external stylesheets for theme swapping. See CSS Strategy section.

4. **TypeScript definitions?** Not for implementation, but a `.d.ts` file for consumers would help adoption. Can be generated from JSDoc.

5. **What's the tagline?** "UI as JavaScript objects" doesn't have punch. Need something like: "The anti-framework" or "DOM without the drama" or "UI is just data."

6. **bw.remote naming** - Decided: `bw.remote()`. See naming discussion in section 4. The rendering mode progression is: `bw.html()` → `bw.DOM()` → `bw.render()` → `bw.remote()`. Could be a separate package (`bitwrench-remote`) or built into core (within the 45KB budget).

7. **Metadata schema?** The `bw-meta` / `bw-id` fields need a formal specification. What fields are reserved? What's the contract between server and client?

## Summary: What Makes Bitwrench Different

| Aspect | React/Vue/etc | Bitwrench |
|--------|--------------|-----------|
| UI representation | JSX (compiled HTML-in-JS) | JS objects (native) |
| Build step | Required | Optional |
| Server rendering | Needs Node.js runtime | Any language emits JSON |
| State management | External libraries | Plain JS variables + re-render |
| Update mechanism | Virtual DOM diffing | Direct DOM manipulation |
| Debugging | Requires framework devtools | Browser inspector works directly |
| Wire format | Not serializable | JSON (static) or JS (dynamic) |
| Bundle size | 30-100KB+ framework runtime | 45KB max gzipped (core + components + live client) |
| Learning curve | JSX + hooks + state + router + ... | Objects have {t, a, c, o}. That's it. |

The bet: for a large class of web UIs (dashboards, admin panels, prototypes, docs, server-driven apps), the framework overhead isn't worth it. Bitwrench offers 80% of the capability at 10% of the complexity.
