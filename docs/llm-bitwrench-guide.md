# Bitwrench LLM Guide

> Compact reference for AI-assisted bitwrench development.
> For the full teaching narrative, see `docs/thinking-in-bitwrench.md`.

## What is bitwrench?

A zero-dependency (39KB gzipped) JavaScript UI library. No build step, no JSX, no virtual DOM. Describe UI as plain JS objects (TACO format), render to HTML/DOM. Works in browsers and Node.js.

## Core Concept: TACO Format

Every UI element is `{t, a, c, o}` — Tag, Attributes, Content, Options:

```javascript
{ t: 'div', a: { class: 'card', id: 'x' }, c: 'Hello world' }
// equivalent to: <div class="card" id="x">Hello world</div>
```

- `t` — tag name (defaults to `'div'` if omitted)
- `a` — object of HTML attributes
- `c` — string, TACO, or array of TACOs (nested arbitrarily deep)
- `o` — bitwrench-only metadata (lifecycle, state, methods) — used by DOM path, not serialized to HTML

Content is HTML-escaped by default. Use `bw.raw(str)` or `o: { raw: true }` for raw HTML.
`null`, `undefined`, `false` in content arrays are silently skipped.

## Key Insight: TACO Is Computation

Every TACO field is a JavaScript expression. This is the most important thing to understand:

```javascript
var items = ['Apples', 'Bananas'];
var isAdmin = true;

{
  t: isAdmin ? 'h1' : 'h2',                         // computed tag
  a: { class: 'header ' + (isAdmin ? 'admin' : '') }, // computed attrs
  c: items.map(function(i) { return { t: 'li', c: i }; }) // .map() → children
}
```

**Two timing modes** in the same object:
- **Authoring time (IIFE)**: `c: (function() { return expensiveCalc(); })()` — runs when object is created, result is baked in. TACO becomes serializable data.
- **Rendering time (function ref)**: `a: { style: function() { return 'opacity:' + getVal(); } }` — runs when bitwrench processes the tree.

**Composition patterns**: functions are components, arrays are slots, `.map()` is iteration, `Object.assign` merges attributes, `.filter(Boolean)` removes nulls.

## CSS Is Just Strings

CSS values are JS variables. No Sass, no Tailwind, no build step needed.

```javascript
// Variables
var brand = '#336699', radius = '12px';

// Inline
{ t: 'div', a: { style: 'background:' + brand + '; border-radius:' + radius }, c: 'Hi' }

// Object composition (Sass @extend equivalent)
var base = { borderRadius: radius, padding: '1rem', border: '1px solid #ddd' };
var success = Object.assign({}, base, { background: '#e8f5e9' });

// Generated classes
bw.injectCSS(bw.css({
  '.card': { borderRadius: radius, boxShadow: '0 2px 8px rgba(0,0,0,.08)' },
  '.card:hover': { boxShadow: '0 4px 12px rgba(0,0,0,.12)' },
  '@media (max-width: 768px)': { '.card': { padding: '0.5rem' } }
}));

// Functions → Sass mixins
function cardStyles(accent) {
  var s = bw.deriveShades(accent);
  return { background: s.light, border: '1px solid ' + s.border, color: s.darkText };
}
bw.injectCSS(bw.css({ '.warn': cardStyles('#e67e22'), '.ok': cardStyles('#27ae60') }));

// Theme palette — complete design system from 2 colors
var theme = bw.generateTheme('brand', { primary: '#336699', secondary: '#cc6633' });
// theme.palette.primary.base, theme.palette.secondary.light, etc.
```

## Three Levels

| Level | What | How | Use case |
|-------|------|-----|----------|
| **0 — Data** | Plain JS object | `bw.makeCard({...})` or `{t,a,c}` | Serialize, transform, SSR |
| **1 — DOM** | Rendered DOM tree | `bw.DOM('#x', taco)` | One-shot or manual re-render |
| **2 — Managed** | Reactive component | `bw.component(taco)` | Auto-updating UI via `.set()` |

Most UI should be Level 0. Escalate only when needed.

## Minimal Page Template

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My Page</title>
  <script src="https://cdn.jsdelivr.net/npm/bitwrench@2/dist/bitwrench.umd.min.js"></script>
</head>
<body>
  <div id="app"></div>
  <script>
    bw.loadDefaultStyles();
    bw.DOM('#app', {
      t: 'div', a: { class: 'bw-container' },
      c: [ bw.makeCard({ title: 'Hello', content: 'Built with bitwrench.' }) ]
    });
  </script>
</body>
</html>
```

## Core API

### Rendering

| Function | Description |
|----------|-------------|
| `bw.html(taco)` | TACO → HTML string (browser + Node.js). Event handler functions are serialized via `funcRegister`. |
| `bw.htmlPage(opts)` | TACO → complete HTML document. Options: `body`, `title`, `runtime`, `css`, `theme`, `head`, `favicon`, `lang`, `state`. |
| `bw.createDOM(taco)` | TACO → detached DOM element |
| `bw.DOM(selector, taco)` | Mount TACO into existing element |
| `bw.raw(str)` | Mark string as pre-escaped HTML |

### CSS & Styling

| Function | Description |
|----------|-------------|
| `bw.css(rules)` | JS object → CSS string. CamelCase auto-converts. |
| `bw.injectCSS(css, { id })` | Insert CSS into `<head>` |
| `bw.loadDefaultStyles()` | Load built-in Bootstrap-like styles (call once) |
| `bw.generateTheme(name, config)` | Generate scoped theme from seed colors |
| `bw.s(...styles)` | Merge style objects: `bw.s(bw.u.flex, { gap: '1rem' })` |
| `bw.u` | Pre-built utilities: `bw.u.flex`, `bw.u.textCenter`, `bw.u.p4`, `bw.u.bold` |
| `bw.responsive(sel, breakpoints)` | Generate responsive CSS |

### State — Level 1 (Manual)

| Function | Description |
|----------|-------------|
| `bw.uuid(prefix?)` | Generate unique ID: `"bw_card_a1b2c3"` |
| `bw.patch(id, content, attr?)` | Update element by UUID |
| `bw.patchAll({ id: content })` | Batch patch |
| `bw.update(el)` | Call element's `o.render` function |
| `bw.cleanup(el)` | Run unmount hooks, clear state |

### State — Level 2 (Managed)

| Function | Description |
|----------|-------------|
| `bw.component(taco)` | Create managed component → ComponentHandle |
| `bw.compile(taco)` | Pre-compile template → factory function |
| `bw.when(expr, trueT, falseT)` | Conditional rendering |
| `bw.each(expr, factory)` | List rendering |
| `bw.message(target, action, data)` | Dispatch to component by tag |
| `bw.inspect(target)` | Debug: log component state |
| `bw.flush()` | Force synchronous render |

### Communication

| Function | Description |
|----------|-------------|
| `bw.pub(topic, detail)` | App-wide publish |
| `bw.sub(topic, handler, el?)` | Subscribe (returns unsub fn). Optional element lifecycle tie. |
| `bw.emit(el, event, detail)` | DOM-scoped CustomEvent (`bw:` prefixed) |
| `bw.on(el, event, handler)` | Listen for DOM CustomEvent |

### Color

| Function | Description |
|----------|-------------|
| `bw.hexToHsl(hex)` | Hex → `[h, s, l]` |
| `bw.hslToHex(hsl)` | `[h, s, l]` → hex |
| `bw.deriveShades(hex)` | 8 shade variants from one color |
| `bw.derivePalette(cfg)` | Full palette from seed colors |
| `bw.textOnColor(hex)` | Contrast-safe text (`'#fff'` or `'#000'`) |
| `bw.mixColor(a, b, ratio)` | Blend two colors |
| `bw.adjustLightness(hex, amt)` | Shift HSL lightness |
| `bw.relativeLuminance(hex)` | WCAG 2.0 luminance |

### Utilities

| Function | Description |
|----------|-------------|
| `bw.$('selector')` | querySelectorAll → array |
| `bw.escapeHTML(str)` | Escape HTML special chars |
| `bw.typeOf(x)` | Enhanced typeof: `"array"`, `"null"`, `"date"` |
| `bw.uuid(prefix)` | Generate unique ID |
| `bw.getURLParam(key, def)` | Read URL query parameter |
| `bw.random(min, max)` | Random integer (or `bw.random(n, min, max)` for array) |
| `bw.loremIpsum(n)` | Placeholder text (n characters) |
| `bw.mapScale(x, i0, i1, o0, o1)` | Map value between ranges |
| `bw.clip(val, min, max)` | Clamp value |
| `bw.naturalCompare(a, b)` | Natural sort comparison |
| `bw.parseRJSON(str)` | Relaxed JSON (unquoted keys, single quotes, trailing commas) |
| `bw.saveClientFile(name, data)` | Browser file download |
| `bw.loadClientJSON(cb)` | Browser file upload (JSON) |
| `bw.loadLocalFile(path)` | Node.js file read (returns Promise) |
| `bw.saveLocalFile(path, data)` | Node.js file write |

## ComponentHandle (Level 2)

```javascript
var counter = bw.component({
  t: 'div', c: [
    { t: 'span', c: 'Count: ${count}' },     // template binding
    { t: 'button', c: '+1', a: {
      onclick: function() { counter.increment(); }
    }}
  ],
  o: {
    state: { count: 0 },
    methods: {
      increment: function(comp) { comp.set('count', comp.get('count') + 1); },
      reset: function(comp) { comp.set('count', 0); }
    }
  }
});
bw.DOM('#app', counter);
counter.set('count', 42);    // auto-updates DOM
counter.increment();          // methods promoted to handle
counter.destroy();            // cleanup
```

### Handle API

| Method | Description |
|--------|-------------|
| `.get(key)` | Read state (dot-path: `'user.name'`) |
| `.set(key, val)` | Set state → auto-render (microtask batched) |
| `.getState()` | Shallow copy of state |
| `.setState(obj)` | Merge keys, one render |
| `.push(key, val)` | Push to array in state |
| `.splice(key, start, del, ...)` | Splice array in state |
| `.mount(el)` | Mount into DOM element |
| `.unmount()` | Remove from DOM (state preserved) |
| `.destroy()` | Full cleanup |
| `.on(event, handler)` | DOM listener on component el |
| `.sub(topic, handler)` | Pub/sub (auto-cleanup on destroy) |
| `.action(name, ...args)` | Call named action |
| `.select(sel)` | querySelector within component |
| `.userTag(tag)` | Set tag for `bw.message()` addressing |
| `.element` | Mounted DOM element |
| `.mounted` | Boolean |

### Template Bindings

`${expr}` in content or attributes. Auto-updates on `.set()`:

```javascript
{ t: 'span', a: { class: 'badge ${status}' }, c: 'Hello, ${name}!' }
// state: { name: 'World', status: 'active' }
```

**Tier 1** (default): dot-path only (`${user.name}`). CSP-safe.
**Tier 2** (via `bw.compile`): full JS expressions (`${count * 2}`). Requires `unsafe-eval`.

### Lifecycle Hooks

| Hook | When | Signature |
|------|------|-----------|
| `willMount` | Before first DOM insertion | `fn(handle)` |
| `mounted` | After DOM insertion | `fn(handle)` |
| `willUpdate` | Before re-render | `fn(handle, changedKeys)` |
| `onUpdate` | After re-render | `fn(handle, changedKeys)` |
| `unmount` | Before DOM removal | `fn(handle)` |
| `willDestroy` | Before destruction | `fn(handle)` |

## BCCL — Component Library

All `bw.make*()` return Level 0 TACOs. BCCL is optional. Factory dispatcher: `bw.make('card', props)`.

### Layout
```javascript
bw.makeContainer({ fluid, children, className })
bw.makeRow({ children, gap, className })
bw.makeCol({ size, offset, children, className })  // size: 1-12 or { sm:6, md:4 }
bw.makeStack({ children, direction: 'vertical'|'horizontal', gap, className })
bw.makeGrid({ children, columns, gap, className })
```

### Content
```javascript
bw.makeCard({ title, subtitle, content, footer, header, image, variant, shadow, hoverable })
bw.makeAlert({ title, content, variant: 'info', dismissible })
bw.makeBadge({ text, variant: 'primary', pill })
bw.makeProgress({ value, max: 100, variant, striped, animated, label })
bw.makeSpinner({ variant, size, type: 'border'|'grow' })
bw.makeListGroup({ items, flush, interactive })
bw.makeStatCard({ value, label, change, prefix, suffix, icon, variant })
bw.makeTimeline({ items: [{ title, content, date, variant }] })
bw.makeStepper({ steps, currentStep })
bw.makeHero({ title, subtitle, content, variant, size, actions })
bw.makeSection({ title, subtitle, content, variant, spacing })
bw.makeFeatureGrid({ features: [{ icon, title, description }], columns })
bw.makeCTA({ title, description, actions, variant })
```

### Navigation
```javascript
bw.makeNav({ items: [{ text, href, active }], pills, vertical })
bw.makeNavbar({ brand, brandHref, items, dark })
bw.makeTabs({ tabs: [{ label, content }], activeIndex })
bw.makeBreadcrumb({ items: [{ text, href, active }] })
bw.makePagination({ pages, currentPage, onPageChange, size })
```

### Forms
```javascript
bw.makeForm({ children, onsubmit })
bw.makeFormGroup({ label, help, error, required })
bw.makeInput({ type, placeholder, value, id, name, disabled, required, oninput, onchange })
bw.makeTextarea({ placeholder, value, rows, id, name })
bw.makeSelect({ options: [{ value, text }], value, id, onchange })
bw.makeCheckbox({ label, checked, id, name })
bw.makeRadio({ label, name, value, checked, id })
bw.makeSwitch({ label, checked, id, name })
bw.makeRange({ min, max, step, value, label, showValue })
bw.makeSearchInput({ placeholder, value, onSearch, onInput })
bw.makeChipInput({ chips, placeholder, onAdd, onRemove })
bw.makeFileUpload({ accept, multiple, onFiles, text })
```

### Buttons
```javascript
bw.makeButton({ text, variant: 'primary', size, disabled, onclick, type: 'button' })
bw.makeButtonGroup({ children, size, vertical })
```

### Interactive
```javascript
bw.makeAccordion({ items: [{ title, content, open }], multiOpen })
bw.makeModal({ title, content, footer, size, closeButton, onClose })
bw.makeToast({ title, content, variant, autoDismiss, delay, position })
bw.makeDropdown({ trigger, items, align, variant })
bw.makeCarousel({ items: [{ src, alt, caption }], showControls, autoPlay })
bw.makeTooltip({ content, text, placement })
```

### Tables
```javascript
bw.makeTable({ data, columns, sortable, striped, hover })
bw.makeTableFromArray({ data, headerRow, striped, sortable })
bw.makeDataTable({ title, data, columns, responsive, striped })
bw.makeBarChart({ data, labelKey, valueKey, title, color, height })
```

## Theming

```javascript
bw.loadDefaultStyles();  // call once

bw.generateTheme('mytheme', {
  primary: '#336699',
  secondary: '#cc6633',
  tertiary: '#339966',     // optional
  spacing: 'normal',       // 'compact'|'normal'|'spacious'
  radius: 'md',            // 'none'|'sm'|'md'|'lg'|'pill'
  elevation: 'md',         // 'flat'|'sm'|'md'|'lg'
  motion: 'standard',      // 'reduced'|'standard'|'expressive'
  harmonize: 0.20          // hue shift semantics toward primary (0-1)
});

bw.toggleTheme();           // primary ↔ alternate
bw.applyTheme('primary');   // or 'alternate', 'light', 'dark'

// Presets: teal, ocean, sunset, forest, slate, rose, indigo, amber, emerald, nord, coral, midnight
bw.generateTheme('ocean', bw.THEME_PRESETS.ocean);
```

## Events Pattern

```javascript
// Primary: onclick in attributes
{ t: 'button', a: { onclick: function() { save(); } }, c: 'Save' }
bw.makeButton({ text: 'Save', onclick: function() { save(); } })

// Pub/sub (app-wide, not DOM-scoped)
bw.pub('cart:updated', { count: cart.length });
var unsub = bw.sub('cart:updated', function(d) { /* ... */ });
handle.sub('cart:updated', fn);  // auto-cleanup on destroy

// Named dispatch
myPanel.userTag('dashboard');
bw.message('dashboard', 'refresh', { force: true });
```

## Routing

Bitwrench doesn't include a router. Common patterns:

```javascript
// Tab switching (no URL)
var tab = 'overview';
function render() {
  bw.DOM('#app', { t: 'div', c: [
    bw.makeTabs({ tabs: ['overview','settings'], active: tab,
      onchange: function(t) { tab = t; render(); } }),
    tab === 'overview' ? makeOverview() : makeSettings()
  ]});
}

// Hash routing (bookmarkable)
var routes = { '': homePage, 'about': aboutPage, 'products': productsPage };
function navigate() {
  var hash = location.hash.slice(1) || '';
  bw.DOM('#app', (routes[hash] || make404)());
}
window.addEventListener('hashchange', navigate);
navigate();

// Server-side (bwserve)
app.page('/', function(c) { c.render('#app', homePage()); });
app.page('/dash', function(c) { c.render('#app', dashboard()); });
```

## bwserve — Server-Driven UI

Push TACO from any server to the browser via SSE:

```javascript
import { create } from 'bitwrench/bwserve';
var app = create({ port: 7902 });

app.page('/', function(client) {
  // Initial delivery
  client.replace('#app', { t: 'h1', c: 'Hello from server!' });

  // Incremental updates
  client.patch('#status', 'Processing...');
  client.append('#log', { t: 'p', c: 'New entry' });
  client.remove('.old-item');
  client.batch([
    { type: 'patch', target: '#count', content: '42' },
    { type: 'remove', target: '#spinner' }
  ]);

  // Client events
  client.on('greet', function(data) { client.patch('#status', 'Hello!'); });

  // Register + call functions on client
  client.register('showAlert', 'function(msg) { alert(msg); }');
  client.call('showAlert', 'Server says hi!');
  client.call('scrollTo', '#section-2');    // built-in
  client.call('redirect', '/dashboard');    // built-in
});
app.listen();
```

**Protocol**: `replace`, `patch`, `append`, `remove`, `batch`, `message`, `register`, `call`, `exec`.
**Client**: `bw.clientConnect('http://localhost:7902')` — auto-applies all messages.
**Language-agnostic**: any server that writes SSE works (Python, Go, Rust, C, shell).

## HTML Generation & Static Sites

`bw.html()` serializes event handler functions automatically via `funcRegister`:

```javascript
bw.html({ t: 'button', a: { onclick: function() { alert('hi'); } }, c: 'Click' })
// => '<button onclick="bw.funcGetById(\'bw_fn_0\')(event)">Click</button>'
```

`bw.htmlPage()` generates a complete self-contained HTML document:

```javascript
var page = bw.htmlPage({
  title: 'My App',
  body: [
    { t: 'h1', c: 'Hello' },
    bw.makeButton({ text: 'Click', onclick: function() { alert('works!'); } })
  ],
  runtime: 'shim',  // 'inline'|'cdn'|'shim'|'none'
  theme: 'ocean',   // preset name or { primary: '#336699', secondary: '#cc6633' }
  css: '.custom { color: red; }'
});
// page is a complete <!DOCTYPE html> string with working event handlers
```

**Runtime levels**: `'inline'` = full UMD bundle embedded (~120KB, offline/airgapped), `'cdn'` = jsdelivr script tag, `'shim'` = minimal funcRegistry dispatch (~500B), `'none'` = no bitwrench injection.

The shim (`bw._FUNC_REGISTRY_SHIM`) provides just enough runtime for serialized event handlers to work without loading the full library.

## CLI

```bash
npm install -g bitwrench

bwcli input.md -o output.html                # basic conversion
bwcli input.md -o output.html --theme ocean   # with theme
bwcli input.md -o output.html --standalone    # bitwrench inlined (offline)
bwcli input.md -o output.html --cdn           # jsdelivr CDN
bwcli input.md --theme "#336699,#cc6633"      # custom colors

bwcli serve                                   # dev server (port 7902)
bwcli serve ./site --port 8080 --open         # serve directory
```

## Common Patterns

### Static page (Level 0)
```javascript
bw.loadDefaultStyles();
bw.generateTheme('brand', { primary: '#336699', secondary: '#cc6633' });
bw.DOM('#app', [
  bw.makeNavbar({ brand: 'Acme', items: [{ text: 'Home', href: '#' }] }),
  bw.makeHero({ title: 'Welcome', subtitle: 'Built with bitwrench' }),
  bw.makeTable({ data: products, sortable: true })
]);
```

### Data-driven list (Level 1)
```javascript
var filter = 'all';
function render() {
  var items = filter === 'all' ? all : all.filter(function(i) { return i.type === filter; });
  bw.DOM('#list', { t: 'div', c: items.map(function(i) {
    return bw.makeCard({ title: i.name, content: i.desc });
  })});
}
```

### Reactive component (Level 2)
```javascript
var counter = bw.component({
  t: 'div', c: [
    { t: 'span', c: 'Count: ${count}' },
    bw.makeButton({ text: '+1', onclick: function() { counter.increment(); } })
  ],
  o: {
    state: { count: 0 },
    methods: { increment: function(c) { c.set('count', c.get('count') + 1); } }
  }
});
bw.DOM('#app', counter);
```

### Cross-component (pub/sub)
```javascript
var badge = bw.component({ t: 'span', c: 'Cart (${n})', o: { state: { n: 0 } } });
badge.sub('cart:updated', function(d) { badge.set('n', d.count); });
// Elsewhere:
bw.pub('cart:updated', { count: cart.length });
```

## Key Rules

1. **Call `bw.loadDefaultStyles()`** before rendering (browser).
2. **Content is escaped by default.** Use `bw.raw(str)` for raw HTML.
3. **All `make*()` return Level 0 TACOs** — pass to `bw.DOM()` or `bw.html()`.
4. **Use `bw.DOM()` to mount** — handles lifecycle + cleanup.
5. **For reactive state, use `bw.component()`** — `.set()` auto-renders.
6. **CSS classes use `bw-` prefix**: `bw-card`, `bw-btn`, `bw-container`.
7. **Variants**: `primary`, `secondary`, `success`, `danger`, `warning`, `info`, `light`, `dark`.
8. **No raw DOM** — use `bw.DOM()`, not `innerHTML` or `document.querySelector`.
9. **TACO is computation** — every field is a JS expression. Use variables, functions, `.map()`, ternaries.
10. **CSS is just strings** — store in variables, compose with `Object.assign`, generate with functions.
11. **Three levels are explicit** — you always know if you have data (L0), DOM (L1), or a managed component (L2).
12. **Console is DevTools**: `bw.inspect($0)`, `$0._bw_state`, `$0._bwComponentHandle`.
