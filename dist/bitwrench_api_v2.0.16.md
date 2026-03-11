# Bitwrench API Reference

## Summary

| Field | Value |
|-------|-------|
| Version | 2.0.16 |
| Generated | 2026-03-11 |
| Total APIs | 99 |
| Categories | 11 |
| bitwrench.js | 4223 lines |
| bitwrench-bccl.js | 3615 lines |

## Table of Contents

- [Core](#core) (3)
- [DOM Generation](#dom-generation) (10)
- [Identifiers](#identifiers) (2)
- [State Management](#state-management) (3)
- [Events (DOM)](#events-dom-) (2)
- [Pub/Sub](#pub-sub) (3)
- [CSS & Styling](#css-styling) (10)
- [Component Builders](#component-builders) (50)
- [Browser Utilities](#browser-utilities) (4)
- [Function Registry](#function-registry) (5)
- [Component](#component) (7)

---

## Core

### `bw.isNodeJS()`

Detect if running in Node.js environment. Useful for writing isomorphic code that behaves differently in Node.js vs browser. Uses `process.versions.node` for reliable detection that works in both CJS and ESM.

**Returns:** `boolean` — if Node.js, false if browser

**Example:**
```javascript
if (bw.isNodeJS()) { console.log('Running in Node.js'); } else { console.log('Running in browser'); }
```

---

### `bw.colorInterp(x, in0, in1, colors, stretch)`

---

### `bw.makeDataTable(config)`

Create a ready-to-use data table with title and responsive wrapper. Convenience wrapper around `bw.makeTable()` that adds a title heading, responsive horizontal scroll container, and defaults to striped + hover. Use this for the common case; use `bw.makeTable()` when you need a bare table element with no wrapper.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `config` | `Object` | - Table configuration |
| `config.title` | `string` | - Table title heading |
| `config.data` | `Array<Object>` | - Array of row objects |
| `config.columns` | `Array<Object>` | - Column definitions |
| `config.className` | `string` | - Additional CSS classes for the table |
| `config.striped` | `boolean` | - Add striped row styling |
| `config.hover` | `boolean` | - Add hover row highlighting |
| `config.responsive` | `boolean` | - Wrap table in responsive overflow div |

**Returns:** `Object` — object for table with wrapper

**Example:**
```javascript
const table = bw.makeDataTable({ title: "Users", data: [{ name: "Alice", role: "Admin" }], responsive: true });
```

---

## DOM Generation

### `bw.raw(str)`

Mark a string as raw HTML so it will not be escaped by bw.html() or bw.createDOM(). By default, bitwrench escapes all text content to prevent XSS. Use bw.raw() when you need to embed pre-sanitized HTML, entities, or inline markup.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `str` | `string` | - HTML string to mark as raw |

**Returns:** `Object` — object recognized by bw.html() and bw.createDOM()

**Example:**
```javascript
bw.raw('Hello &mdash; World') // Used in TACO content: { t: 'p', c: bw.raw('Price: <strong>$9.99</strong>') }
```

---

### `bw.html(taco, options = {})`

Convert a TACO object (or array of TACOs) to an HTML string. This is the core rendering function — it works in both Node.js and browsers. Use it for server-side rendering, static site generation, or generating HTML snippets. Content is HTML-escaped by default; pass `{ raw: true }` to insert raw HTML.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `taco` | `Object|Array|string` | - TACO object, array of TACOs, or string |
| `options` | `Object` | - Rendering options |
| `options.raw` | `boolean` | - If true, skip HTML escaping on content |

**Returns:** `string` — string

**Example:**
```javascript
bw.html({ t: 'h1', c: 'Hello' }) // => '<h1>Hello</h1>' bw.html({ t: 'div', a: { class: 'card' }, c: [ { t: 'p', c: 'Content here' } ]}) // => '<div class="card"><p>Content here</p></div>'
```

---

### `bw.createDOM(taco, options = {})`

Create a live DOM element from a TACO object (browser only). Unlike `bw.html()` which returns a string, this creates real DOM elements with event handlers, lifecycle hooks (mounted/unmount), and state. Used internally by `bw.DOM()`. Throws in Node.js — use `bw.html()` instead.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `taco` | `Object` | - TACO object with {t, a, c, o} |
| `options` | `Object` | - Creation options |

**Returns:** `Element|Text` — element or text node

**Example:**
```javascript
var el = bw.createDOM({ t: 'button', a: { class: 'bw_btn', onclick: () => alert('clicked') }, c: 'Click Me' }); document.body.appendChild(el);
```

---

### `bw.DOM(target, taco, options = {})`

Mount a TACO object into a DOM element, replacing its contents (browser only). This is the primary way to render bitwrench UI to the page. It cleans up any existing children (calling unmount hooks), then renders the TACO into the target. The target element itself is preserved — only its children change.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `target` | `string|Element` | - CSS selector or DOM element to mount into |
| `taco` | `Object` | - TACO object to render |
| `options` | `Object` | - Mount options |

**Returns:** `Element` — element

**Example:**
```javascript
bw.DOM('#app', { t: 'div', a: { class: 'card' }, c: [ { t: 'h2', c: 'Hello' }, { t: 'p', c: 'Built with bitwrench.' } ] });
```

---

### `bw.compileProps(handle, props = {})`

Compile props into getter/setter functions for reactive updates. Used internally by `bw.renderComponent()`. Creates a proxy-like object where setting a property triggers `handle.onPropChange()`.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `handle` | `Object` | - Component handle |
| `props` | `Object` | - Initial props |

**Returns:** `Object` — props object with getters/setters

---

### `bw.renderComponent(taco, options = {})`

Render a TACO component and return an enhanced handle object. The handle provides compiled props, state management, child registration, and a destroy method. Used internally by `bw.createCard()`, `bw.createTable()`, etc.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `taco` | `Object` | - TACO object to render |
| `options` | `Object` | - Render options |

**Returns:** `Object` — handle with element, props, state, update(), destroy()

---

### `bw.cleanup(element)`

Clean up a DOM element and all its children by calling unmount callbacks, removing pub/sub subscriptions, and clearing state/render references. Called automatically by `bw.DOM()` before re-rendering. Call manually when removing elements to prevent memory leaks from orphaned callbacks.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `element` | `Element` | - DOM element to clean up |

**Example:**
```javascript
var el = document.querySelector('#my-widget'); bw.cleanup(el);   // runs unmount hooks, clears _bw_state, _bw_render el.remove();       // safe to remove from DOM now
```

---

### `bw.render(element, position, taco)`

Render a TACO object into the DOM at a specific position, returning a component handle. The handle provides full lifecycle control: state management, re-rendering, class manipulation, show/hide, event binding, and destroy. Components are tracked in a registry for later retrieval via `bw.getComponent()`.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `element` | `Element|string` | - Target element or CSS selector |
| `position` | `string` | - Position: 'replace', 'prepend', 'append', 'before', 'after' |
| `taco` | `Object` | - TACO object to render |

**Returns:** `Object` — handle with element, setState, update, destroy, etc.

**Example:**
```javascript
var handle = bw.render('#app', 'append', { t: 'button', a: { class: 'bw_btn' }, c: 'Click Me', o: { state: { clicks: 0 } } }); handle.setState({ clicks: 1 }); handle.destroy();
```

---

### `bw.getComponent(id)`

Get a component handle by its ID from the component registry.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `id` | `string` | - Component ID (from bw.render) |

**Returns:** `Object|null` — handle or null if not found

---

### `bw.getAllComponents()`

Get all registered component handles as a Map.

**Returns:** `Map` — of componentId → component handle

---

## Identifiers

### `bw.uuid(prefix)`

Generate a unique identifier string for DOM elements or application use. Uses `crypto.randomUUID()` when available (modern browsers), otherwise falls back to a timestamp + counter + random combination. Optional prefix creates namespaced IDs like `bw_card_<hex>` for easier debugging.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `prefix` | `string` | - Optional namespace prefix (e.g. "card", "todo") |

**Returns:** `string` — identifier (e.g. "bw_card_a1b2c3d4")

**Example:**
```javascript
bw.uuid()          // => "bw_m3x9k_1_7f2h4j6a8" bw.uuid('card')    // => "bw_card_a1b2c3d4e5f6"
```

---

### `bw.escapeHTML(str)`

Escape HTML special characters to prevent XSS. Converts &, <, >, ", ', and / to their HTML entity equivalents. Used automatically by `bw.html()` unless raw mode is enabled.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `str` | `string` | - String to escape |

**Returns:** `string` — string safe for HTML insertion

**Example:**
```javascript
bw.escapeHTML('<b>Hello</b> & "world"') // => '&lt;b&gt;Hello&lt;&#x2F;b&gt; &amp; &quot;world&quot;'
```

---

## State Management

### `bw.update(target)`

Trigger re-render of a component by calling its stored `o.render` function. This is the recommended way to update a component after changing its state. Calls `el._bw_render(el, state)` and emits `bw:statechange` so other components can react without tight coupling.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `target` | `string|Element` | - Element ID, data-bw_id, CSS selector, or DOM element |

**Returns:** `Element|null` — element, or null if not found / no render function

**Example:**
```javascript
// Given a counter element with o.render el._bw_state.count++; bw.update(el);  // re-renders, emits bw:statechange
```

---

### `bw.patch(id, content, attr)`

Targeted DOM update by element ID — change one element's content or attribute without rebuilding the entire component tree. Use `bw.patch()` for lightweight value updates (scores, labels, counters) and `bw.update()` for full structural re-renders.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `id` | `string|Element` | - Element ID, data-bw_id, CSS selector, or DOM element. Uses node cache for O(1) lookup; falls back to DOM query on cache miss. |
| `content` | `string|Object` | - New text content, or TACO object to replace children |
| `attr` | `string` | - If provided, sets this attribute instead of content |

**Returns:** `Element|null` — patched element, or null if not found

**Example:**
```javascript
bw.patch('score-display', '42');          // update text content bw.patch('status', 'active', 'class');    // update an attribute bw.patch('info', { t: 'em', c: 'new' }); // replace children with TACO
```

---

### `bw.patchAll(patches)`

Batch version of `bw.patch()` — update multiple elements in one call. Useful for updating several independent values simultaneously, such as a dashboard with multiple counters.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `patches` | `Object` | - Map of { elementId: newContent, ... } |

**Returns:** `Object` — of { elementId: patchedElement|null, ... }

**Example:**
```javascript
bw.patchAll({ 'cpu-display': '78%', 'mem-display': '4.2 GB', 'disk-display': '120 GB free' });
```

---

## Events (DOM)

### `bw.emit(target, eventName, detail)`

Emit a custom DOM event on an element. Events are prefixed with `bw:` to avoid collision with native events and bubble by default so ancestor elements can listen. Use with `bw.on()` for DOM-scoped communication between components.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `target` | `string|Element` | - Element ID, data-bw_id, CSS selector, or DOM element. Uses node cache for O(1) lookup; falls back to DOM query on cache miss. |
| `eventName` | `string` | - Event name (will be prefixed with 'bw:') |
| `detail` | `*` | - Data to pass with the event |

**Example:**
```javascript
bw.emit('#my-widget', 'statechange', { count: 42 }); // Dispatches CustomEvent 'bw:statechange' on the element
```

---

### `bw.on(target, eventName, handler)`

Listen for a custom bitwrench event on a DOM element. Handler receives `(detail, event)` for convenience — the detail object is the first argument so you don't need to destructure `e.detail`. Events bubble, so you can listen on an ancestor element.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `target` | `string|Element` | - Element ID, data-bw_id, CSS selector, or DOM element. Uses node cache for O(1) lookup; falls back to DOM query on cache miss. |
| `eventName` | `string` | - Event name (will be prefixed with 'bw:') |
| `handler` | `Function` | - Called with (detail, event) |

**Returns:** `Element|null` — element (for chaining), or null if not found

**Example:**
```javascript
bw.on(document.body, 'statechange', function(detail) { console.log('State changed:', detail); });
```

---

## Pub/Sub

### `bw.pub(topic, detail)`

Publish to a topic, calling all subscribers in registration order. Application-scoped pub/sub decoupled from the DOM tree. Each subscriber is wrapped in try/catch so one bad handler can't break others. Use `bw.pub()`/`bw.sub()` for app-wide communication; use `bw.emit()`/`bw.on()` for DOM-scoped events.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `topic` | `string` | - Topic name (plain string, no prefix) |
| `detail` | `*` | - Data to pass to subscribers |

**Returns:** `number` — of successfully called subscribers

**Example:**
```javascript
bw.pub('score:updated', { player: 'X', score: 10 });
```

---

### `bw.sub(topic, handler, el)`

Subscribe to a topic. Returns an unsub() function. Optional third argument ties the subscription to a DOM element's lifecycle — when `bw.cleanup()` is called on that element, the subscription is automatically removed, preventing memory leaks.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `topic` | `string` | - Topic name |
| `handler` | `Function` | - Called with (detail) on each publish |
| `el` | `Element` | - Optional DOM element to tie lifecycle to |

**Returns:** `Function` — to unsubscribe

**Example:**
```javascript
var unsub = bw.sub('score:updated', function(detail) { console.log(detail.player, 'scored', detail.score); }); // Later: unsub() to stop listening
```

---

### `bw.unsub(topic, handler)`

Unsubscribe a handler by reference from a topic. Removes ALL instances of the given handler on the topic. Alternative to calling the unsub function returned by `bw.sub()`.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `topic` | `string` | - Topic name |
| `handler` | `Function` | - The handler to remove (by reference equality) |

**Returns:** `number` — of removed subscriptions

---

## CSS & Styling

### `bw.css(rules, options = {})`

Generate CSS from JavaScript objects. Converts an object of `{ selector: { prop: value } }` rules into a CSS string. CamelCase property names are auto-converted to kebab-case (e.g. `fontSize` → `font-size`). Accepts nested arrays of rule objects.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `rules` | `Object|Array|string` | - CSS rules as JS objects, array of rule objects, or raw CSS string |
| `options` | `Object` | - Generation options |
| `options.minify` | `boolean` | - Minify output (no whitespace) |

**Returns:** `string` — string

**Example:**
```javascript
bw.css({ '.card': { padding: '1rem', fontSize: '14px', borderRadius: '8px' } }) // => '.card {\n  padding: 1rem;\n  font-size: 14px;\n  border-radius: 8px;\n}'
```

---

### `bw.injectCSS(css, options = {})`

Inject CSS into the document head (browser only). Creates or reuses a `<style>` element (identified by `id`). Can accept raw CSS strings or JS rule objects (which are converted via `bw.css()`). By default appends to existing content; set `append: false` to replace.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `css` | `string|Object|Array` | - CSS string, or JS rule objects to convert |
| `options` | `Object` | - Injection options |
| `options.id` | `string` | - ID for the style element |
| `options.append` | `boolean` | - Append to existing CSS (false to replace) |

**Returns:** `Element` — style element

**Example:**
```javascript
bw.injectCSS('.my-class { color: red; }'); bw.injectCSS({ '.card': { padding: '1rem' } }, { id: 'card-styles' });
```

---

### `bw.s()`

Merge multiple style objects into one (left-to-right). Like `Object.assign()` for styles, but filters out null/undefined arguments. Compose inline styles or CSS rule objects without mutation.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `styles` | `...Object` | - Style objects to merge (left-to-right) |

**Returns:** `Object` — style object

**Example:**
```javascript
var style = bw.s(bw.u.flex, bw.u.gap4, { color: 'red' }); // => { display: 'flex', gap: '1rem', color: 'red' }
```

---

### `bw.u`

Pre-built CSS utility objects (like Tailwind utilities, but in JS). Compose with `bw.s()` to build inline styles without writing raw CSS strings. Includes flex, padding, margin, typography, color, border, and transition utilities.

**Example:**
```javascript
{ t: 'div', a: { style: bw.s(bw.u.flex, bw.u.gap4, bw.u.p4) },
  c: 'Flexbox with 1rem gap and padding' }
```

---

### `bw.responsive(selector, breakpoints)`

Generate responsive CSS with media query breakpoints. Produces a CSS string with `@media (min-width)` rules for standard breakpoints. These match the grid system and theme.breakpoints: sm: 576px, md: 768px, lg: 992px, xl: 1200px Pass the result to `bw.injectCSS()`.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `selector` | `string` | - CSS selector |
| `breakpoints` | `Object` | - Object with keys: base, sm, md, lg, xl |

**Returns:** `string` — CSS string (pass to bw.injectCSS)

**Example:**
```javascript
var css = bw.responsive('.grid', { base: { gridTemplateColumns: '1fr' }, md:   { gridTemplateColumns: '1fr 1fr' }, lg:   { gridTemplateColumns: '1fr 1fr 1fr' } }); bw.injectCSS(css);
```

---

### `bw.loadDefaultStyles(options = {})`

Load the built-in Bootstrap-inspired default stylesheet. Injects bitwrench's batteries-included CSS (buttons, cards, grids, forms, alerts, badges, nav, tabs, etc.) into the document head. Call once at app startup. Returns null in Node.js (no DOM).

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `options` | `Object` | - Style loading options |
| `options.minify` | `boolean` | - Minify the CSS output |

**Returns:** `Element|null` — element if in browser, null in Node.js

**Example:**
```javascript
bw.loadDefaultStyles();  // inject all default CSS
```

---

### `bw.generateTheme(name, config)`

Generate a complete, scoped theme from seed colors. Produces CSS for all themed components (buttons, alerts, badges, cards, forms, nav, tables, tabs, list groups, pagination, progress, hero, utilities) scoped under `.name` class. Multiple themes can coexist in the stylesheet. Swap themes by changing the class on a container element.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `name` | `string` | - CSS scope class (e.g. 'ocean'). Empty string = unscoped global. |
| `config` | `Object` | - Theme configuration |
| `config.primary` | `string` | - Primary brand color hex |
| `config.secondary` | `string` | - Secondary color hex |
| `config.tertiary` | `string` | - Tertiary/accent color hex (defaults to primary) |
| `config.success` | `string` | - Success color hex |
| `config.danger` | `string` | - Danger color hex |
| `config.warning` | `string` | - Warning color hex |
| `config.info` | `string` | - Info color hex |
| `config.light` | `string` | - Light color hex |
| `config.dark` | `string` | - Dark color hex |
| `config.background` | `string` | - Page background hex (default: '#ffffff' light, derived dark) |
| `config.surface` | `string` | - Surface/card background hex (default: '#f8f9fa' light, derived dark) |
| `config.spacing` | `string` | - 'compact' | 'normal' | 'spacious' |
| `config.radius` | `string` | - 'none' | 'sm' | 'md' | 'lg' | 'pill' |
| `config.fontSize` | `number` | - Base font size scale factor |
| `config.typeRatio` | `string|number` | - 'tight' | 'normal' | 'relaxed' | 'dramatic' or a number |
| `config.elevation` | `string` | - 'flat' | 'sm' | 'md' | 'lg' |
| `config.motion` | `string` | - 'reduced' | 'standard' | 'expressive' |
| `config.harmonize` | `number` | - 0-1, semantic color hue shift toward primary |
| `config.inject` | `boolean` | - Inject into DOM (browser only) |

**Returns:** `Object` — css, palette, name, isLightPrimary, alternate: { css, palette } }

**Example:**
```javascript
// Generate and inject an ocean theme (primary + alternate) var theme = bw.generateTheme('ocean', { primary: '#0077b6', secondary: '#90e0ef', tertiary: '#00b4d8' }); // Apply to a container document.getElementById('app').classList.add('ocean'); // Toggle to alternate palette bw.toggleTheme(); // Generate CSS for static export (Node.js) var result = bw.generateTheme('sunset', { primary: '#e76f51', secondary: '#264653', inject: false }); fs.writeFileSync('sunset.css', result.css + result.alternate.css);
```

---

### `bw.applyTheme(mode)`

Apply a theme mode. Switches between primary and alternate palettes by adding/removing the `bw_theme_alt` class on `<html>`.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `mode` | `string` | - 'primary' | 'alternate' | 'light' | 'dark' |

**Returns:** `string` — mode: 'primary' or 'alternate'

**Example:**
```javascript
bw.applyTheme('alternate');  // switch to alternate palette bw.applyTheme('dark');       // switch to whichever palette is darker bw.applyTheme('primary');    // switch back to primary palette
```

---

### `bw.toggleTheme()`

Toggle between primary and alternate theme palettes.

**Returns:** `string` — mode after toggle: 'primary' or 'alternate'

**Example:**
```javascript
bw.toggleTheme();  // flip between primary and alternate
```

---

### `bw.clearTheme()`

Remove the currently active theme's injected style elements from the DOM. Use this before generating a new theme with a different name to prevent stale CSS accumulation.

**Example:**
```javascript
bw.clearTheme();                   // remove current theme styles bw.generateTheme('sunset', conf);  // inject fresh theme
```

---

## Component Builders

### `bw.makeTable(config)`

Create a sortable TACO table from an array of row objects. Returns a bare `<table>` TACO — no wrapper, title, or responsive scroll. Use this when you need full control over table placement, or when embedding the table inside your own layout. For a ready-to-use table with title, responsive wrapper, and defaults (striped + hover), use `bw.makeDataTable()`. Auto-detects columns from data keys if not specified. Supports click-to-sort headers with ascending/descending indicators.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `config` | `Object` | - Table configuration |
| `config.data` | `Array<Object>` | - Array of row objects to display |
| `config.columns` | `Array<Object>` | - Column definitions with key, label, render |
| `config.className` | `string` | - CSS class for table element |
| `config.sortable` | `boolean` | - Enable click-to-sort headers |
| `config.onSort` | `Function` | - Sort callback (column, direction) |

**Returns:** `Object` — object for table

**Example:**
```javascript
bw.makeTable({ data: [ { name: 'Alice', age: 30 }, { name: 'Bob', age: 25 } ], columns: [ { key: 'name', label: 'Name' }, { key: 'age', label: 'Age' } ] });
```

---

### `bw.makeTableFromArray(config)`

Create a table from a 2D array. Converts a 2D array into the object-array format that `bw.makeTable()` expects, then delegates. By default, the first row is used as column headers. All standard `makeTable` props (striped, hover, sortable, columns, onSort, etc.) are passed through.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `config` | `Object` | - Configuration object |
| `config.data` | `Array<Array>` | - 2D array of values |
| `config.headerRow` | `boolean` | - Treat first row as column headers |
| `config.striped` | `boolean` | - Striped rows |
| `config.hover` | `boolean` | - Hover highlight |
| `config.sortable` | `boolean` | - Enable sort |
| `config.columns` | `Array<Object>` | - Override auto-generated column defs |
| `config.className` | `string` | - Additional CSS classes |
| `config.onSort` | `Function` | - Sort callback |
| `config.sortColumn` | `string` | - Currently sorted column key |
| `config.sortDirection` | `string` | - Sort direction |

**Returns:** `Object` — object for table

**Example:**
```javascript
bw.makeTableFromArray({ data: [ ['Name', 'Role', 'Status'], ['Alice', 'Engineer', 'Active'], ['Bob', 'Designer', 'Away'] ], striped: true, hover: true });
```

---

### `bw.makeBarChart(config)`

Create a vertical bar chart from data. Renders a pure-CSS bar chart using flexbox and percentage heights. No canvas, SVG, or external charting library required.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `config` | `Object` | - Chart configuration |
| `config.data` | `Array<Object>` | - Array of data objects |
| `config.labelKey` | `string` | - Key for bar labels |
| `config.valueKey` | `string` | - Key for bar values |
| `config.title` | `string` | - Chart title |
| `config.color` | `string` | - Bar color (hex or CSS color) |
| `config.height` | `string` | - Height of the chart area |
| `config.formatValue` | `Function` | - Value label formatter: (value) => string |
| `config.showValues` | `boolean` | - Show value labels above bars |
| `config.showLabels` | `boolean` | - Show labels below bars |
| `config.className` | `string` | - Additional CSS classes |

**Returns:** `Object` — object

**Example:**
```javascript
bw.makeBarChart({ data: [ { label: 'Jan', value: 12400 }, { label: 'Feb', value: 15800 }, { label: 'Mar', value: 9200 } ], title: 'Monthly Revenue', color: '#0077b6', formatValue: (v) => '$' + (v / 1000).toFixed(1) + 'k' });
```

---

### `bw.makeCard(props = {})`

Create a card component with optional header, body, footer, and image support Supports images (top, bottom, left, right), shadow levels, subtitle, hover animation, and custom section class overrides. For horizontal image layouts (left/right), content is wrapped in a row grid.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `props` | `Object` | - Card configuration |
| `props.title` | `string` | - Card title displayed in the body |
| `props.subtitle` | `string` | - Card subtitle (muted text below title) |
| `props.content` | `string|Object|Array` | - Card body content (string, TACO, or array) |
| `props.footer` | `string|Object` | - Card footer content |
| `props.header` | `string|Object` | - Card header content |
| `props.image` | `Object` | - Card image configuration |
| `props.image.src` | `string` | - Image source URL |
| `props.image.alt` | `string` | - Image alt text |
| `props.imagePosition` | `string` | - Image position ("top", "bottom", "left", "right") |
| `props.variant` | `string` | - Color variant (e.g. "primary", "danger") |
| `props.bordered` | `boolean` | - Show card border |
| `props.shadow` | `string` | - Shadow level ("none", "sm", "md", "lg") |
| `props.hoverable` | `boolean` | - Enable hover lift animation |
| `props.className` | `string` | - Additional CSS classes |
| `props.style` | `Object` | - Inline style object |
| `props.headerClass` | `string` | - Additional header CSS classes |
| `props.bodyClass` | `string` | - Additional body CSS classes |
| `props.footerClass` | `string` | - Additional footer CSS classes |
| `props.state` | `Object` | - Component state object |

**Returns:** `Object` — object representing a card component

**Example:**
```javascript
const card = makeCard({ title: "Status", content: "All systems operational", variant: "success" }); bw.DOM("#app", card);
```

---

### `bw.makeButton(props = {})`

Create a button component

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `props` | `Object` | - Button configuration |
| `props.text` | `string` | - Button label text |
| `props.variant` | `string` | - Color variant (e.g. "primary", "secondary", "danger") |
| `props.size` | `string` | - Size variant ("sm" or "lg") |
| `props.disabled` | `boolean` | - Whether the button is disabled |
| `props.onclick` | `Function` | - Click event handler |
| `props.type` | `string` | - HTML button type ("button", "submit", "reset") |
| `props.className` | `string` | - Additional CSS classes |
| `props.style` | `Object` | - Inline style object |

**Returns:** `Object` — object representing a button element

**Example:**
```javascript
const btn = makeButton({ text: "Save", variant: "success", onclick: () => console.log("saved") }); // String shorthand: const ok = makeButton("OK");
```

---

### `bw.makeContainer(props = {})`

Create a container component for centering and constraining content width

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `props` | `Object` | - Container configuration |
| `props.fluid` | `boolean` | - Use full-width fluid container |
| `props.children` | `Array|Object|string` | - Child content |
| `props.className` | `string` | - Additional CSS classes |

**Returns:** `Object` — object representing a container div

**Example:**
```javascript
const container = makeContainer({ fluid: true, children: [makeRow({ children: [...] })] });
```

---

### `bw.makeRow(props = {})`

Create a flexbox row for the grid system

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `props` | `Object` | - Row configuration |
| `props.children` | `Array|Object|string` | - Child columns |
| `props.className` | `string` | - Additional CSS classes |
| `props.gap` | `number` | - Gap size (1-5) applied via bw_g_{gap} class |

**Returns:** `Object` — object representing a grid row

**Example:**
```javascript
const row = makeRow({ gap: 4, children: [makeCol({ size: 6, content: "Left" }), makeCol({ size: 6, content: "Right" })] });
```

---

### `bw.makeCol(props = {})`

Create a grid column with responsive sizing Supports both fixed and responsive column sizes. Pass an object for responsive breakpoints (e.g. {xs: 12, md: 6, lg: 4}).

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `props` | `Object` | - Column configuration |
| `props.size` | `number|Object` | - Column size (1-12) or responsive object {xs, sm, md, lg, xl} |
| `props.offset` | `number` | - Column offset (1-12) |
| `props.push` | `number` | - Column push (1-12) |
| `props.pull` | `number` | - Column pull (1-12) |
| `props.content` | `Array|Object|string` | - Column content (alias for children) |
| `props.children` | `Array|Object|string` | - Column content |
| `props.className` | `string` | - Additional CSS classes |

**Returns:** `Object` — object representing a grid column

**Example:**
```javascript
const col = makeCol({ size: { xs: 12, md: 6 }, content: "Responsive column" });
```

---

### `bw.makeNav(props = {})`

Create a navigation component with tabs or pills styling

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `props` | `Object` | - Nav configuration |
| `props.items` | `Array<Object>` | - Navigation items |
| `props.items[].text` | `string` | - Item display text |
| `props.items[].href` | `string` | - Item link URL |
| `props.items[].active` | `boolean` | - Whether this item is active |
| `props.items[].disabled` | `boolean` | - Whether this item is disabled |
| `props.pills` | `boolean` | - Use pill styling instead of tabs |
| `props.vertical` | `boolean` | - Stack items vertically |
| `props.className` | `string` | - Additional CSS classes |

**Returns:** `Object` — object representing a nav element

**Example:**
```javascript
const nav = makeNav({ pills: true, items: [ { text: "Home", href: "/", active: true }, { text: "About", href: "/about" } ] });
```

---

### `bw.makeNavbar(props = {})`

Create a navbar component with brand and navigation links

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `props` | `Object` | - Navbar configuration |
| `props.brand` | `string` | - Brand name or logo text |
| `props.brandHref` | `string` | - Brand link URL |
| `props.items` | `Array<Object>` | - Navigation items |
| `props.items[].text` | `string` | - Item display text |
| `props.items[].href` | `string` | - Item link URL |
| `props.items[].active` | `boolean` | - Whether this item is active |
| `props.dark` | `boolean` | - Use dark theme styling |
| `props.className` | `string` | - Additional CSS classes |

**Returns:** `Object` — object representing a navbar element

**Example:**
```javascript
const navbar = makeNavbar({ brand: "MyApp", dark: true, items: [ { text: "Home", href: "/", active: true }, { text: "Docs", href: "/docs" } ] });
```

---

### `bw.makeTabs(props = {})`

Create a tabbed interface with accessible tab navigation Each tab is rendered as a button with ARIA attributes for accessibility. Clicking a tab shows its content pane and hides others. The active tab can be set via activeIndex or by setting active:true on a tab item.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `props` | `Object` | - Tabs configuration |
| `props.tabs` | `Array<Object>` | - Tab definitions |
| `props.tabs[].label` | `string` | - Tab button label |
| `props.tabs[].content` | `string|Object|Array` | - Tab pane content |
| `props.tabs[].active` | `boolean` | - Whether this tab is initially active |
| `props.activeIndex` | `number` | - Default active tab index (overridden by tab.active) |

**Returns:** `Object` — object representing a tabbed interface

**Example:**
```javascript
const tabs = makeTabs({ tabs: [ { label: "Overview", content: "Tab 1 content", active: true }, { label: "Details", content: "Tab 2 content" } ] }); bw.DOM("#app", tabs);
```

---

### `bw.makeAlert(props = {})`

Create an alert/notification component

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `props` | `Object` | - Alert configuration |
| `props.content` | `string|Object|Array` | - Alert message content |
| `props.variant` | `string` | - Color variant ("primary", "secondary", "success", "danger", "warning", "info", "light", "dark") |
| `props.dismissible` | `boolean` | - Show a close button to dismiss the alert |
| `props.className` | `string` | - Additional CSS classes |

**Returns:** `Object` — object representing an alert element

**Example:**
```javascript
const alert = makeAlert({ content: "Operation completed successfully!", variant: "success", dismissible: true }); // String shorthand: const msg = makeAlert("Something happened");
```

---

### `bw.makeBadge(props = {})`

Create an inline badge/label component

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `props` | `Object` | - Badge configuration |
| `props.text` | `string` | - Badge display text |
| `props.variant` | `string` | - Color variant |
| `props.size` | `string` | - Size variant: 'sm' or 'lg' (default is medium) |
| `props.pill` | `boolean` | - Use pill (rounded) shape |
| `props.className` | `string` | - Additional CSS classes |

**Returns:** `Object` — object representing a badge span

**Example:**
```javascript
const badge = makeBadge({ text: "New", variant: "danger", pill: true }); const small = makeBadge({ text: "3", variant: "info", size: "sm" }); // String shorthand: const tag = makeBadge("New");
```

---

### `bw.makeProgress(props = {})`

Create a progress bar component with ARIA accessibility

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `props` | `Object` | - Progress bar configuration |
| `props.value` | `number` | - Current progress value |
| `props.max` | `number` | - Maximum value |
| `props.variant` | `string` | - Color variant |
| `props.striped` | `boolean` | - Use striped pattern |
| `props.animated` | `boolean` | - Animate the stripes |
| `props.label` | `string` | - Custom label text (defaults to percentage) |
| `props.height` | `number` | - Custom height in pixels |

**Returns:** `Object` — object representing a progress bar

**Example:**
```javascript
const progress = makeProgress({ value: 75, variant: "success", striped: true, animated: true });
```

---

### `bw.makeListGroup(props = {})`

Create a list group component for displaying lists of items Items can be simple strings or objects with text, active, disabled, href, and onclick properties. When interactive is true or items have href/onclick, items render as anchor tags.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `props` | `Object` | - List group configuration |
| `props.items` | `Array<string|Object>` | - List items (strings or objects) |
| `props.items[].text` | `string` | - Item display text |
| `props.items[].active` | `boolean` | - Whether this item is active |
| `props.items[].disabled` | `boolean` | - Whether this item is disabled |
| `props.items[].href` | `string` | - Item link URL |
| `props.items[].onclick` | `Function` | - Item click handler |
| `props.flush` | `boolean` | - Remove borders for use inside cards |
| `props.interactive` | `boolean` | - Make all items interactive (anchor tags) |

**Returns:** `Object` — object representing a list group

**Example:**
```javascript
const list = makeListGroup({ interactive: true, items: [ { text: "Active item", active: true }, { text: "Regular item" }, { text: "Disabled item", disabled: true } ] });
```

---

### `bw.makeBreadcrumb(props = {})`

Create a breadcrumb navigation component The last item with active:true is rendered as plain text (no link). All other items render as anchor tags.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `props` | `Object` | - Breadcrumb configuration |
| `props.items` | `Array<Object>` | - Breadcrumb items |
| `props.items[].text` | `string` | - Item display text |
| `props.items[].href` | `string` | - Item link URL |
| `props.items[].active` | `boolean` | - Whether this is the current page |

**Returns:** `Object` — object representing a breadcrumb nav

**Example:**
```javascript
const crumbs = makeBreadcrumb({ items: [ { text: "Home", href: "/" }, { text: "Products", href: "/products" }, { text: "Widget", active: true } ] });
```

---

### `bw.makeForm(props = {})`

Create a form wrapper with default submit prevention

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `props` | `Object` | - Form configuration |
| `props.children` | `Array|Object|string` | - Form contents (form groups, inputs, buttons) |
| `props.onsubmit` | `Function` | - Submit handler (defaults to preventDefault) |
| `props.className` | `string` | - Additional CSS classes |

**Returns:** `Object` — object representing a form element

**Example:**
```javascript
const form = makeForm({ onsubmit: (e) => { e.preventDefault(); handleSubmit(); }, children: [ makeFormGroup({ label: "Name", input: makeInput({ placeholder: "Enter name" }) }), makeButton({ text: "Submit", type: "submit" }) ] });
```

---

### `bw.makeFormGroup(props = {})`

Create a form group with label, input, optional help text and validation feedback

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `props` | `Object` | - Form group configuration |
| `props.label` | `string` | - Label text |
| `props.input` | `Object` | - Input TACO object (from makeInput, makeSelect, etc.) |
| `props.help` | `string` | - Help text displayed below the input |
| `props.id` | `string` | - Input ID (links label to input via for/id) |
| `props.validation` | `string` | - Validation state ("valid" or "invalid") |
| `props.feedback` | `string` | - Validation feedback text shown below input |
| `props.required` | `boolean` | - Show required indicator (*) on label |

**Returns:** `Object` — object representing a form group

**Example:**
```javascript
const group = makeFormGroup({ label: "Email", id: "email", input: makeInput({ type: "email", id: "email", placeholder: "you@example.com" }), validation: "invalid", feedback: "Please enter a valid email address." });
```

---

### `bw.makeInput(props = {})`

Create an input element with form control styling Additional event handlers (oninput, onchange, etc.) can be passed as extra properties and are spread onto the element attributes.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `props` | `Object` | - Input configuration |
| `props.type` | `string` | - Input type ("text", "email", "password", "number", etc.) |
| `props.placeholder` | `string` | - Placeholder text |
| `props.value` | `string` | - Input value |
| `props.id` | `string` | - Element ID |
| `props.name` | `string` | - Input name attribute |
| `props.disabled` | `boolean` | - Whether the input is disabled |
| `props.readonly` | `boolean` | - Whether the input is read-only |
| `props.required` | `boolean` | - Whether the input is required |
| `props.className` | `string` | - Additional CSS classes |
| `props.style` | `Object` | - Inline style object |

**Returns:** `Object` — object representing an input element

**Example:**
```javascript
const input = makeInput({ type: "email", placeholder: "you@example.com", required: true, oninput: (e) => validate(e.target.value) });
```

---

### `bw.makeTextarea(props = {})`

Create a textarea element with form control styling

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `props` | `Object` | - Textarea configuration |
| `props.placeholder` | `string` | - Placeholder text |
| `props.value` | `string` | - Textarea content |
| `props.rows` | `number` | - Number of visible text rows |
| `props.id` | `string` | - Element ID |
| `props.name` | `string` | - Textarea name attribute |
| `props.disabled` | `boolean` | - Whether the textarea is disabled |
| `props.readonly` | `boolean` | - Whether the textarea is read-only |
| `props.required` | `boolean` | - Whether the textarea is required |
| `props.className` | `string` | - Additional CSS classes |

**Returns:** `Object` — object representing a textarea element

**Example:**
```javascript
const textarea = makeTextarea({ rows: 5, placeholder: "Enter your message...", required: true });
```

---

### `bw.makeSelect(props = {})`

Create a select dropdown with options

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `props` | `Object` | - Select configuration |
| `props.options` | `Array<Object>` | - Dropdown options |
| `props.options[].value` | `string` | - Option value |
| `props.options[].text` | `string` | - Option display text (defaults to value) |
| `props.value` | `string` | - Currently selected value |
| `props.id` | `string` | - Element ID |
| `props.name` | `string` | - Select name attribute |
| `props.disabled` | `boolean` | - Whether the select is disabled |
| `props.required` | `boolean` | - Whether the select is required |
| `props.className` | `string` | - Additional CSS classes |

**Returns:** `Object` — object representing a select element

**Example:**
```javascript
const select = makeSelect({ value: "b", options: [ { value: "a", text: "Option A" }, { value: "b", text: "Option B" }, { value: "c", text: "Option C" } ] });
```

---

### `bw.makeCheckbox(props = {})`

Create a checkbox input with label

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `props` | `Object` | - Checkbox configuration |
| `props.label` | `string` | - Checkbox label text |
| `props.checked` | `boolean` | - Whether the checkbox is checked |
| `props.id` | `string` | - Element ID (links label to checkbox) |
| `props.name` | `string` | - Input name attribute |
| `props.disabled` | `boolean` | - Whether the checkbox is disabled |
| `props.value` | `string` | - Checkbox value attribute |

**Returns:** `Object` — object representing a checkbox form group

**Example:**
```javascript
const checkbox = makeCheckbox({ label: "I agree to the terms", id: "agree", checked: false });
```

---

### `bw.makeStack(props = {})`

Create a flexbox stack layout (vertical or horizontal)

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `props` | `Object` | - Stack configuration |
| `props.children` | `Array|Object|string` | - Stack children |
| `props.direction` | `string` | - Stack direction ("vertical" or "horizontal") |
| `props.gap` | `number` | - Gap size (0-5) |
| `props.className` | `string` | - Additional CSS classes |

**Returns:** `Object` — object representing a stack layout

**Example:**
```javascript
const stack = makeStack({ direction: "horizontal", gap: 2, children: [ makeButton({ text: "Cancel", variant: "secondary" }), makeButton({ text: "Save", variant: "primary" }) ] });
```

---

### `bw.makeSpinner(props = {})`

Create a loading spinner indicator

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `props` | `Object` | - Spinner configuration |
| `props.variant` | `string` | - Color variant |
| `props.size` | `string` | - Spinner size ("sm", "md", "lg") |
| `props.type` | `string` | - Spinner type ("border" or "grow") |

**Returns:** `Object` — object representing a spinner with screen-reader text

**Example:**
```javascript
const spinner = makeSpinner({ variant: "info", size: "sm" });
```

---

### `bw.makeHero(props = {})`

Create a hero section for landing pages and headers Supports gradient backgrounds, background images with overlays, and action buttons. Commonly used as the first visible section.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `props` | `Object` | - Hero configuration |
| `props.title` | `string` | - Main headline text |
| `props.subtitle` | `string` | - Supporting description text |
| `props.content` | `string|Object|Array` | - Additional body content |
| `props.variant` | `string` | - Background variant ("primary", "secondary", "light", "dark") |
| `props.size` | `string` | - Vertical padding size ("sm", "md", "lg", "xl") |
| `props.centered` | `boolean` | - Center-align text |
| `props.overlay` | `boolean` | - Add dark overlay (for background images) |
| `props.backgroundImage` | `string` | - Background image URL |
| `props.actions` | `Array|Object` | - Call-to-action buttons |
| `props.className` | `string` | - Additional CSS classes |

**Returns:** `Object` — object representing a hero section

**Example:**
```javascript
const hero = makeHero({ title: "Welcome to Bitwrench", subtitle: "Build UIs with pure JavaScript", variant: "dark", actions: [ makeButton({ text: "Get Started", variant: "primary", size: "lg" }), makeButton({ text: "Learn More", variant: "outline-light", size: "lg" }) ] });
```

---

### `bw.makeFeatureGrid(props = {})`

Create a responsive feature grid for showcasing capabilities Renders features in an equal-width column grid with optional icons, titles, and descriptions.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `props` | `Object` | - Feature grid configuration |
| `props.features` | `Array<Object>` | - Feature items |
| `props.features[].icon` | `string` | - Icon content (emoji, HTML entity, or text) |
| `props.features[].title` | `string` | - Feature title |
| `props.features[].description` | `string` | - Feature description text |
| `props.columns` | `number` | - Number of columns (divides 12-col grid) |
| `props.centered` | `boolean` | - Center-align feature text |
| `props.iconSize` | `string` | - Icon font size |
| `props.className` | `string` | - Additional CSS classes |

**Returns:** `Object` — object representing a feature grid

**Example:**
```javascript
const features = makeFeatureGrid({ columns: 3, features: [ { icon: "⚡", title: "Fast", description: "Zero build step" }, { icon: "📦", title: "Small", description: "Under 45KB gzipped" }, { icon: "🔧", title: "Flexible", description: "Pure JS objects" } ] });
```

---

### `bw.makeCTA(props = {})`

Create a call-to-action section with title, description, and action buttons

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `props` | `Object` | - CTA configuration |
| `props.title` | `string` | - CTA headline |
| `props.description` | `string` | - CTA description text |
| `props.actions` | `Array|Object` | - CTA buttons or content |
| `props.variant` | `string` | - Background variant |
| `props.centered` | `boolean` | - Center-align content |
| `props.className` | `string` | - Additional CSS classes |

**Returns:** `Object` — object representing a CTA section

**Example:**
```javascript
const cta = makeCTA({ title: "Ready to get started?", description: "Join thousands of developers using Bitwrench.", actions: [ makeButton({ text: "Sign Up Free", variant: "primary", size: "lg" }) ] });
```

---

### `bw.makeSection(props = {})`

Create a page section with optional centered header and background

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `props` | `Object` | - Section configuration |
| `props.title` | `string` | - Section title |
| `props.subtitle` | `string` | - Section subtitle (muted) |
| `props.content` | `string|Object|Array` | - Section body content |
| `props.variant` | `string` | - Background variant ("default" for none, or a color name) |
| `props.spacing` | `string` | - Vertical padding ("sm", "md", "lg", "xl") |
| `props.className` | `string` | - Additional CSS classes |

**Returns:** `Object` — object representing a content section

**Example:**
```javascript
const section = makeSection({ title: "Features", subtitle: "Everything you need to build great UIs", spacing: "lg", content: makeFeatureGrid({ features: [...] }) });
```

---

### `bw.makeCodeDemo(props = {})`

Create a code demo component for documentation pages Displays a live result alongside source code in a tabbed interface. Includes a copy-to-clipboard button on the code tab.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `props` | `Object` | - Code demo configuration |
| `props.title` | `string` | - Demo title heading |
| `props.description` | `string` | - Demo description text |
| `props.code` | `string` | - Source code to display (adds a "Code" tab when present) |
| `props.result` | `string|Object|Array` | - Live result content for the "Result" tab |
| `props.language` | `string` | - Code language for syntax class |

**Returns:** `Object` — object representing a code demo with tabbed Result/Code views

**Example:**
```javascript
const demo = makeCodeDemo({ title: "Button Example", description: "A simple primary button", code: 'makeButton({ text: "Click me" })', result: makeButton({ text: "Click me" }) });
```

---

### `bw.makePagination(props = {})`

Create a pagination navigation component

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `props` | `Object` | - Pagination configuration |
| `props.pages` | `number` | - Total number of pages |
| `props.currentPage` | `number` | - Currently active page (1-based) |
| `props.onPageChange` | `Function` | - Callback when page changes, receives page number |
| `props.size` | `string` | - Size variant ("sm" or "lg") |
| `props.className` | `string` | - Additional CSS classes |

**Returns:** `Object` — object representing a pagination nav

**Example:**
```javascript
const pager = makePagination({ pages: 10, currentPage: 3, onPageChange: (page) => loadPage(page) });
```

---

### `bw.makeRadio(props = {})`

Create a radio button input with label

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `props` | `Object` | - Radio configuration |
| `props.label` | `string` | - Radio label text |
| `props.name` | `string` | - Radio group name |
| `props.value` | `string` | - Radio value attribute |
| `props.checked` | `boolean` | - Whether the radio is selected |
| `props.id` | `string` | - Element ID (links label to radio) |
| `props.disabled` | `boolean` | - Whether the radio is disabled |
| `props.className` | `string` | - Additional CSS classes |

**Returns:** `Object` — object representing a radio form group

**Example:**
```javascript
const radio = makeRadio({ label: "Option A", name: "choice", value: "a", checked: true });
```

---

### `bw.makeButtonGroup(props = {})`

Create a button group wrapper

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `props` | `Object` | - Button group configuration |
| `props.children` | `Array` | - Button TACO objects to group |
| `props.size` | `string` | - Size variant ("sm" or "lg") |
| `props.vertical` | `boolean` | - Stack buttons vertically |
| `props.className` | `string` | - Additional CSS classes |

**Returns:** `Object` — object representing a button group

**Example:**
```javascript
const group = makeButtonGroup({ children: [ makeButton({ text: "Left", variant: "primary" }), makeButton({ text: "Middle", variant: "primary" }), makeButton({ text: "Right", variant: "primary" }) ] });
```

---

### `bw.makeAccordion(props = {})`

Create an accordion component with collapsible items

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `props` | `Object` | - Accordion configuration |
| `props.items` | `Array<Object>` | - Accordion items |
| `props.items[].title` | `string` | - Header text for the accordion item |
| `props.items[].content` | `string|Object|Array` | - Collapsible content |
| `props.items[].open` | `boolean` | - Whether the item is initially open |
| `props.multiOpen` | `boolean` | - Allow multiple items open simultaneously |
| `props.className` | `string` | - Additional CSS classes |

**Returns:** `Object` — object representing an accordion

**Example:**
```javascript
const accordion = makeAccordion({ items: [ { title: "Section 1", content: "Content 1", open: true }, { title: "Section 2", content: "Content 2" } ] });
```

---

### `bw.makeModal(props = {})`

Create a modal dialog overlay

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `props` | `Object` | - Modal configuration |
| `props.title` | `string` | - Modal title in header |
| `props.content` | `string|Object|Array` | - Modal body content |
| `props.footer` | `string|Object|Array` | - Modal footer content |
| `props.size` | `string` | - Modal size ("sm", "lg", "xl") |
| `props.closeButton` | `boolean` | - Show X close button in header |
| `props.onClose` | `Function` | - Callback when modal is closed |
| `props.className` | `string` | - Additional CSS classes |

**Returns:** `Object` — object representing a modal

**Example:**
```javascript
const modal = makeModal({ title: "Confirm", content: "Are you sure?", footer: makeButton({ text: "OK", variant: "primary" }) });
```

---

### `bw.makeToast(props = {})`

Create a toast notification popup

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `props` | `Object` | - Toast configuration |
| `props.title` | `string` | - Toast title |
| `props.content` | `string|Object|Array` | - Toast body content |
| `props.variant` | `string` | - Color variant ("primary", "success", "danger", "warning", "info") |
| `props.autoDismiss` | `boolean` | - Auto-dismiss after delay |
| `props.delay` | `number` | - Auto-dismiss delay in ms |
| `props.position` | `string` | - Container position |
| `props.className` | `string` | - Additional CSS classes |

**Returns:** `Object` — object representing a toast

**Example:**
```javascript
const toast = makeToast({ title: "Success", content: "File saved!", variant: "success" });
```

---

### `bw.makeDropdown(props = {})`

Create a dropdown menu triggered by a button

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `props` | `Object` | - Dropdown configuration |
| `props.trigger` | `string|Object` | - Button text or TACO for the trigger |
| `props.items` | `Array<Object>` | - Menu items |
| `props.items[].text` | `string` | - Item display text |
| `props.items[].href` | `string` | - Item link URL |
| `props.items[].onclick` | `Function` | - Item click handler |
| `props.items[].divider` | `boolean` | - Render as a divider line |
| `props.items[].disabled` | `boolean` | - Whether the item is disabled |
| `props.align` | `string` | - Menu alignment ("start" or "end") |
| `props.variant` | `string` | - Trigger button variant |
| `props.className` | `string` | - Additional CSS classes |

**Returns:** `Object` — object representing a dropdown

**Example:**
```javascript
const dropdown = makeDropdown({ trigger: "Actions", items: [ { text: "Edit", onclick: () => edit() }, { divider: true }, { text: "Delete", onclick: () => del() } ] });
```

---

### `bw.makeSwitch(props = {})`

Create a toggle switch (styled checkbox)

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `props` | `Object` | - Switch configuration |
| `props.label` | `string` | - Switch label text |
| `props.checked` | `boolean` | - Whether the switch is on |
| `props.id` | `string` | - Element ID (links label to switch) |
| `props.name` | `string` | - Input name attribute |
| `props.disabled` | `boolean` | - Whether the switch is disabled |
| `props.className` | `string` | - Additional CSS classes |

**Returns:** `Object` — object representing a toggle switch

**Example:**
```javascript
const toggle = makeSwitch({ label: "Dark mode", checked: false, onchange: (e) => toggleDark(e.target.checked) });
```

---

### `bw.makeSkeleton(props = {})`

Create a skeleton loading placeholder

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `props` | `Object` | - Skeleton configuration |
| `props.variant` | `string` | - Shape variant ("text", "circle", "rect") |
| `props.width` | `string` | - Custom width (e.g. "200px", "100%") |
| `props.height` | `string` | - Custom height (e.g. "20px") |
| `props.count` | `number` | - Number of skeleton lines (for text variant) |
| `props.className` | `string` | - Additional CSS classes |

**Returns:** `Object` — object representing a skeleton placeholder

**Example:**
```javascript
const skeleton = makeSkeleton({ variant: "text", count: 3, width: "100%" });
```

---

### `bw.makeAvatar(props = {})`

Create a user avatar with image or initials fallback

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `props` | `Object` | - Avatar configuration |
| `props.src` | `string` | - Image source URL |
| `props.alt` | `string` | - Image alt text |
| `props.initials` | `string` | - Fallback initials (e.g. "JD") |
| `props.size` | `string` | - Size ("sm", "md", "lg", "xl") |
| `props.variant` | `string` | - Background color variant for initials |
| `props.className` | `string` | - Additional CSS classes |

**Returns:** `Object` — object representing an avatar

**Example:**
```javascript
const avatar = makeAvatar({ src: "/photo.jpg", alt: "Jane Doe", size: "lg" }); const avatarInitials = makeAvatar({ initials: "JD", variant: "success" });
```

---

### `bw.makeCarousel(props = {})`

Create a carousel/slideshow component with slide transitions Supports image slides, TACO content slides, captions, prev/next controls, dot indicators, and optional auto-play. Uses CSS translateX transitions.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `props` | `Object` | - Carousel configuration |
| `props.items` | `Array<Object>` | - Slide items |
| `props.items[].content` | `string|Object` | - Slide content (TACO, string, or img element) |
| `props.items[].caption` | `string` | - Caption text shown at bottom of slide |
| `props.showControls` | `boolean` | - Show prev/next arrow buttons |
| `props.showIndicators` | `boolean` | - Show dot navigation |
| `props.autoPlay` | `boolean` | - Auto-advance slides |
| `props.interval` | `number` | - Auto-advance interval in ms |
| `props.height` | `string` | - Carousel height |
| `props.startIndex` | `number` | - Initial slide index |
| `props.className` | `string` | - Additional CSS classes |

**Returns:** `Object` — object representing a carousel

**Example:**
```javascript
const carousel = makeCarousel({ items: [ { content: { t: 'img', a: { src: 'photo.jpg' } }, caption: 'Photo 1' }, { content: { t: 'div', c: 'Text slide' } } ], autoPlay: true, interval: 3000 });
```

---

### `bw.makeStatCard(props = {})`

Create a stat card for dashboard metrics display Shows a large value with a label and optional change indicator. Designed for dashboard grid layouts with left-border accent.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `props` | `Object|string` | - Stat card configuration (string shorthand sets label) |
| `props.value` | `string|number` | - The main stat value to display |
| `props.label` | `string` | - Descriptive label below the value |
| `props.change` | `number` | - Percentage change indicator (positive = green arrow, negative = red) |
| `props.format` | `string` | - Value format ("number", "currency", "percent") |
| `props.prefix` | `string` | - Custom prefix (e.g. "$") |
| `props.suffix` | `string` | - Custom suffix (e.g. "%") |
| `props.icon` | `string` | - Icon content (emoji or text) shown above value |
| `props.variant` | `string` | - Left-border color variant ("primary", "success", "danger", etc.) |
| `props.className` | `string` | - Additional CSS classes |
| `props.style` | `Object` | - Inline style object |

**Returns:** `Object` — object representing a stat card

**Example:**
```javascript
const stat = makeStatCard({ value: 2345, label: 'Active Users', change: 5.3, format: 'number', variant: 'primary' });
```

---

### `bw.makeTooltip(props = {})`

Create a tooltip wrapper around trigger content Wraps the trigger element in a container that shows tooltip text on hover and focus. Pure CSS-driven show/hide with JS lifecycle for event binding.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `props` | `Object` | - Tooltip configuration |
| `props.content` | `string|Object|Array` | - Trigger content (what the user hovers/focuses) |
| `props.text` | `string` | - Tooltip text to display |
| `props.placement` | `string` | - Tooltip placement ("top", "bottom", "left", "right") |
| `props.className` | `string` | - Additional CSS classes |

**Returns:** `Object` — object representing a tooltip wrapper

**Example:**
```javascript
const tip = makeTooltip({ content: makeButton({ text: 'Hover me' }), text: 'This is a tooltip!', placement: 'top' });
```

---

### `bw.makePopover(props = {})`

Create a popover wrapper around trigger content Like a tooltip but richer — supports title + body content and is triggered by click rather than hover. Dismisses on click outside.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `props` | `Object` | - Popover configuration |
| `props.trigger` | `string|Object|Array` | - Trigger content (what the user clicks) |
| `props.title` | `string` | - Popover header title |
| `props.content` | `string|Object|Array` | - Popover body content |
| `props.placement` | `string` | - Placement ("top", "bottom", "left", "right") |
| `props.className` | `string` | - Additional CSS classes |

**Returns:** `Object` — object representing a popover wrapper

**Example:**
```javascript
const pop = makePopover({ trigger: makeButton({ text: 'Click me' }), title: 'Popover Title', content: 'Some helpful information here.', placement: 'bottom' });
```

---

### `bw.makeSearchInput(props = {})`

Create a search input with clear button Wraps a text input with a clear (×) button that appears when the field has content. Calls onSearch on Enter key.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `props` | `Object` | - Search input configuration |
| `props.placeholder` | `string` | - Placeholder text |
| `props.value` | `string` | - Initial value |
| `props.onSearch` | `Function` | - Callback when Enter is pressed, receives value |
| `props.onInput` | `Function` | - Callback on each keystroke, receives value |
| `props.id` | `string` | - Element ID |
| `props.name` | `string` | - Input name attribute |
| `props.className` | `string` | - Additional CSS classes |

**Returns:** `Object` — object representing a search input

**Example:**
```javascript
const search = makeSearchInput({ placeholder: 'Search users...', onSearch: (val) => filterUsers(val) });
```

---

### `bw.makeRange(props = {})`

Create a styled range slider input

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `props` | `Object` | - Range configuration |
| `props.min` | `number` | - Minimum value |
| `props.max` | `number` | - Maximum value |
| `props.step` | `number` | - Step increment |
| `props.value` | `number` | - Current value |
| `props.label` | `string` | - Label text |
| `props.showValue` | `boolean` | - Show current value display |
| `props.id` | `string` | - Element ID |
| `props.name` | `string` | - Input name attribute |
| `props.disabled` | `boolean` | - Whether the slider is disabled |
| `props.className` | `string` | - Additional CSS classes |

**Returns:** `Object` — object representing a range input

**Example:**
```javascript
const slider = makeRange({ min: 0, max: 100, value: 50, label: 'Volume', showValue: true, oninput: (e) => setVolume(e.target.value) });
```

---

### `bw.makeMediaObject(props = {})`

Create a media object layout (image + text side-by-side) Classic media object pattern: image/icon on one side, text content on the other, using flexbox. Supports reversed layout.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `props` | `Object` | - Media object configuration |
| `props.src` | `string` | - Image source URL |
| `props.alt` | `string` | - Image alt text |
| `props.title` | `string` | - Title text |
| `props.content` | `string|Object|Array` | - Body content |
| `props.reverse` | `boolean` | - Put image on the right |
| `props.imageSize` | `string` | - Image width/height |
| `props.className` | `string` | - Additional CSS classes |

**Returns:** `Object` — object representing a media object

**Example:**
```javascript
const media = makeMediaObject({ src: '/avatar.jpg', title: 'Jane Doe', content: 'Posted a comment 5 minutes ago.' });
```

---

### `bw.makeFileUpload(props = {})`

Create a file upload zone with drag-and-drop support Styled drop zone with file input. Supports drag-and-drop visuals and multiple file selection.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `props` | `Object` | - File upload configuration |
| `props.accept` | `string` | - Accepted file types (e.g. "image/*", ".pdf,.doc") |
| `props.multiple` | `boolean` | - Allow multiple file selection |
| `props.onFiles` | `Function` | - Callback when files are selected, receives FileList |
| `props.text` | `string` | - Zone label text |
| `props.id` | `string` | - Element ID |
| `props.className` | `string` | - Additional CSS classes |

**Returns:** `Object` — object representing a file upload zone

**Example:**
```javascript
const upload = makeFileUpload({ accept: 'image/*', multiple: true, onFiles: (files) => uploadFiles(files) });
```

---

### `bw.makeTimeline(props = {})`

Create a vertical timeline for chronological event display Renders events as a vertical line with markers and content cards. Each item can have a colored variant marker.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `props` | `Object` | - Timeline configuration |
| `props.items` | `Array<Object>` | - Timeline events |
| `props.items[].title` | `string` | - Event title |
| `props.items[].content` | `string|Object|Array` | - Event description content |
| `props.items[].date` | `string` | - Date or time label |
| `props.items[].variant` | `string` | - Marker color variant |
| `props.className` | `string` | - Additional CSS classes |

**Returns:** `Object` — object representing a timeline

**Example:**
```javascript
const timeline = makeTimeline({ items: [ { title: 'Project Started', date: 'Jan 2026', variant: 'primary' }, { title: 'Beta Release', date: 'Mar 2026', content: 'v2.0 beta shipped' }, { title: 'Stable Release', date: 'Jun 2026', variant: 'success' } ] });
```

---

### `bw.makeStepper(props = {})`

Create a multi-step wizard/progress indicator Displays numbered steps with active and completed states. Steps before currentStep are marked completed, the currentStep is active, and subsequent steps are pending.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `props` | `Object` | - Stepper configuration |
| `props.steps` | `Array<Object>` | - Step definitions |
| `props.steps[].label` | `string` | - Step label text |
| `props.steps[].description` | `string` | - Optional step description |
| `props.currentStep` | `number` | - Zero-based index of the active step |
| `props.className` | `string` | - Additional CSS classes |

**Returns:** `Object` — object representing a stepper

**Example:**
```javascript
const stepper = makeStepper({ currentStep: 1, steps: [ { label: 'Account', description: 'Create account' }, { label: 'Profile', description: 'Set up profile' }, { label: 'Confirm', description: 'Review & submit' } ] });
```

---

### `bw.makeChipInput(props = {})`

Create a chip/tag input for managing a list of items Displays existing chips with remove buttons and an input field for adding new ones. Chips are added on Enter and removed on clicking the × button.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `props` | `Object` | - Chip input configuration |
| `props.chips` | `Array<string>` | - Initial chip values |
| `props.placeholder` | `string` | - Input placeholder text |
| `props.onAdd` | `Function` | - Callback when a chip is added, receives value |
| `props.onRemove` | `Function` | - Callback when a chip is removed, receives value |
| `props.className` | `string` | - Additional CSS classes |

**Returns:** `Object` — object representing a chip input

**Example:**
```javascript
const tags = makeChipInput({ chips: ['JavaScript', 'CSS'], placeholder: 'Add tag...', onAdd: (val) => addTag(val), onRemove: (val) => removeTag(val) });
```

---

## Browser Utilities

### `bw.setCookie(cname, cvalue, exdays, options = {})`

Set a browser cookie with expiration and options.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `cname` | `string` | - Cookie name |
| `cvalue` | `string` | - Cookie value |
| `exdays` | `number` | - Expiration in days from now |
| `options` | `Object` | - Additional cookie options |
| `options.path` | `string` | - Cookie path |
| `options.domain` | `string` | - Cookie domain |
| `options.secure` | `boolean` | - Secure flag |
| `options.sameSite` | `string` | - SameSite attribute |

---

### `bw.getCookie(cname, defaultValue)`

Get a browser cookie value by name.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `cname` | `string` | - Cookie name |
| `defaultValue` | `*` | - Default value if cookie not found |

**Returns:** `*` — value or default

---

### `bw.getURLParam(key, defaultValue)`

Get a URL query parameter value from the current page URL. Pass no key to get all parameters as an object. Returns `true` for present-but-empty parameters.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `key` | `string` | - Parameter name (omit to get all params) |
| `defaultValue` | `*` | - Default if not found |

**Returns:** `*` — value, true (present but empty), or default

---

### `bw.copyToClipboard(text)`

Copy text to the system clipboard (browser only). Uses the modern Clipboard API when available, falls back to `document.execCommand('copy')`.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `text` | `string` | - Text to copy |

**Returns:** `Promise` — that resolves when copy is complete

---

## Function Registry

### `bw.funcRegister(fn, name)`

Register a function in the global function registry. Registered functions can be invoked by name in HTML string contexts (e.g., onclick attributes) via `bw.funcGetById()`. Useful for serializable event handlers, LLM wire format, and SSR.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `fn` | `Function` | - Function to register |
| `name` | `string` | - Optional name. Auto-generated if omitted. |

**Returns:** `string` — registered name (use for dispatch)

---

### `bw.funcGetById(name, errFn)`

Retrieve a registered function by name. Returns the function if found, or `errFn` (or a no-op logger) if not.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `name` | `string` | - Registered function name |
| `errFn` | `Function` | - Fallback if not found |

**Returns:** `Function` — registered function or fallback

---

### `bw.funcGetDispatchStr(name, argStr)`

Generate a dispatch string suitable for inline HTML event attributes.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `name` | `string` | - Registered function name |
| `argStr` | `string` | - Arguments string (literal, not variable names) |

**Returns:** `string` — string like `"bw.funcGetById('name')(args)"`

---

### `bw.funcUnregister(name)`

Remove a function from the registry.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `name` | `string` | - Registered function name |

**Returns:** `boolean` — if removed, false if not found

---

### `bw.funcGetRegistry()`

Get a shallow copy of the function registry for inspection.

**Returns:** `Object` — of registry (name → function)

---

## Component

### `bw.flush()`

Synchronous flush for testing and imperative code. Forces immediate re-render of all dirty components.

---

### `bw.when(expr, tacoTrue, tacoFalse)`

Conditional rendering helper. Returns a marker object that ComponentHandle detects during binding compilation. In static contexts (bw.html with state), evaluates immediately.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `expr` | `string` | - Expression string like '${loggedIn}' |
| `tacoTrue` | `Object` | - TACO to render when truthy |
| `tacoFalse` | `Object` | - TACO to render when falsy |

**Returns:** `Object` — object with _bwWhen flag

---

### `bw.each(expr, fn)`

List rendering helper. Returns a marker object that ComponentHandle detects during binding compilation.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `expr` | `string` | - Expression string like '${items}' |
| `fn` | `Function` | - Factory function(item, index) returning TACO |

**Returns:** `Object` — object with _bwEach flag

---

### `bw.component(taco)`

Create a ComponentHandle from a TACO definition. The returned handle has .get(), .set(), .mount(), .destroy(), etc.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `taco` | `Object` | - TACO definition with {t, a, c, o} |

**Returns:** `ComponentHandle` — component handle

**Example:**
```javascript
var counter = bw.component({ t: 'div', c: [{ t: 'h3', c: 'Count: ${count}' }], o: { state: { count: 0 } } }); bw.DOM('#app', counter); counter.set('count', 42); // DOM auto-updates
```

---

### `bw.message(target, action, data)`

Dispatch a message to a component by UUID or user tag. Finds the component's DOM element, looks up its ComponentHandle, and calls the named method. This is the bitwrench equivalent of Win32 SendMessage(hwnd, msg, wParam, lParam).

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `target` | `string` | - Component UUID (data-bw_comp_id) or user tag (CSS class) |
| `action` | `string` | - Method name to call on the component |
| `data` | `*` | - Data to pass to the method |

**Returns:** `boolean` — if message was dispatched successfully

**Example:**
```javascript
// Tag a component myDash.userTag('dashboard_prod'); // Dispatch locally bw.message('dashboard_prod', 'addAlert', { severity: 'warning', text: 'CPU spike' }); // Or from SSE handler: es.onmessage = function(e) { var msg = JSON.parse(e.data); bw.message(msg.target, msg.action, msg.data); };
```

---

### `bw.inspect(target)`

Inspect a component's state, bindings, methods, and metadata. Works with DOM elements, CSS selectors, or ComponentHandle objects. Returns the ComponentHandle for console chaining.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `target` | `string|Element|ComponentHandle` | - Selector, element, or handle |

**Returns:** `ComponentHandle|null` — component handle, or null if not found

**Example:**
```javascript
// In browser console, click element in Elements panel then: bw.inspect($0); // Or by selector: var h = bw.inspect('#my-dashboard'); h.set('count', 99);  // chain from returned handle
```

---

### `bw.compile(taco)`

Pre-compile a TACO definition into a factory function. The factory produces ComponentHandles with pre-compiled binding evaluators. Phase 1: validates API surface. Template cloning optimization deferred.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `taco` | `Object` | - TACO definition |

**Returns:** `Function` — function(initialState?) → ComponentHandle

---
