# Bitwrench LLM Guide

> Single-file reference for building sites with bitwrench.js v2.
> Feed this to an LLM to enable AI-assisted bitwrench development.

## What is bitwrench?

A zero-dependency JavaScript UI library. No build step, no JSX, no virtual DOM. You describe UI as plain JS objects (TACO format), bitwrench renders them to HTML/DOM. Works in browsers and Node.js.

**Key mental model**: TACO objects are component specifications (like MFC or Swing), not DOM templates. A `bw.makeCard()` call creates an intent object. You choose when and how to materialize it — as a string, as a fire-and-forget DOM element, or as a managed component with reactive state.

## TACO Format

Every UI element is a plain object with four keys:

```javascript
{
  t: 'div',                          // Tag name (required)
  a: { class: 'card', id: 'main' }, // Attributes (optional)
  c: 'Hello World',                  // Content: string, TACO, or array of TACOs (optional)
  o: {                                // Options (optional)
    state: { count: 0 },             //   component state
    render: function(el) {},          //   re-render function (Level 1)
    mounted: function(el) {},         //   called after DOM insertion
    unmount: function(el) {},         //   called before removal
    methods: { ... },                 //   named methods (Level 2, promoted to handle API)
    actions: { ... },                 //   named event handlers (Level 2, registered in function registry)
    raw: true                         //   skip HTML escaping
  }
}
```

Content is HTML-escaped by default. Use `o: { raw: true }` or `bw.raw(str)` for raw HTML.

## Three Levels of Materialization

TACO objects exist at three levels. Choose per-component:

| Level | What | How | Use case |
|-------|------|-----|----------|
| **Level 0: TACO** | Plain JS object (data/intent) | `bw.makeCard({...})` | Serialize, transform, send over wire, SSR |
| **Level 1: DOM/HTML** | Live DOM nodes (fire-and-forget) | `bw.DOM(sel, taco)` or `bw.html(taco)` | Render once, manual state via o.render + bw.update() |
| **Level 2: ComponentHandle** | Managed reactive object | `bw.component(taco)` | .get()/.set(), template bindings, auto-rerender |

`make*()` factories always return Level 0. User escalates to Level 2 via `bw.component()`.

**This is not React.** There is no virtual DOM diff. Level 1 uses `o.render` for full re-renders. Level 2 uses template bindings for targeted DOM patches. The three levels are explicit — you always know which one you are using.

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
      c: [
        bw.makeCard({ title: 'Hello', content: 'Built with bitwrench.' })
      ]
    });
  </script>
</body>
</html>
```

## Core API

### Rendering

| Function | Description |
|----------|-------------|
| `bw.html(taco, opts)` | TACO → HTML string. Works in Node.js and browser. |
| `bw.createDOM(taco)` | TACO → live DOM element. Browser only. |
| `bw.DOM(selector, taco)` | Mount TACO into a DOM element. Cleans up previous content. Browser only. |

### CSS & Styling

| Function | Description |
|----------|-------------|
| `bw.css(rules)` | JS object → CSS string. `{ '.card': { padding: '1rem' } }` |
| `bw.injectCSS(css, { id })` | Inject CSS string into `<head>`. |
| `bw.loadDefaultStyles()` | Load built-in Bootstrap-like styles. Call once on page load. |
| `bw.generateTheme(name, config)` | Generate scoped theme. See Theming section. |
| `bw.s(...styles)` | Merge style objects: `bw.s(bw.u.flex, { gap: '1rem' })` |
| `bw.u` | Pre-built style utilities: `bw.u.flex`, `bw.u.textCenter`, `bw.u.p4`, `bw.u.bold`, etc. |
| `bw.responsive(sel, breakpoints)` | Generate responsive CSS: `{ base: {}, md: {}, lg: {} }` |

### Low-Level State (Level 1)

| Function | Description |
|----------|-------------|
| `bw.uuid(prefix?)` | Generate unique ID: `bw.uuid('card')` → `"bw_card_a1b2c3"` |
| `bw.patch(id, content, attr?)` | Update element content or attribute by ID. O(1) lookup. |
| `bw.patchAll({ id: content })` | Batch patch multiple elements. |
| `bw.update(el)` | Re-render element by calling its `o.render` function. |
| `bw.cleanup(el)` | Run unmount hooks, clear state, deregister from cache. |

### ComponentHandle (Level 2)

| Function | Description |
|----------|-------------|
| `bw.component(taco)` | Wrap TACO in ComponentHandle. Returns handle with .get()/.set()/.mount(). |
| `bw.compile(taco)` | Pre-compile template. Returns factory function(initialState?) → handle. |
| `bw.when(expr, trueT, falseT)` | Conditional rendering in content arrays. |
| `bw.each(expr, factory)` | List rendering in content arrays. |
| `bw.message(target, action, data)` | Dispatch to component by UUID or user tag. Returns boolean. |
| `bw.inspect(target)` | Log component state to console. Returns handle. |
| `bw.flush()` | Force synchronous render of all dirty components. |

### Events (both levels)

| Function | Description |
|----------|-------------|
| `bw.emit(el, event, detail)` | Dispatch CustomEvent (auto-prefixed `bw:`). DOM-scoped. |
| `bw.on(el, event, handler)` | Listen for CustomEvent. Handler receives `(detail, event)`. |
| `bw.pub(topic, detail)` | App-wide publish (not DOM-scoped). |
| `bw.sub(topic, handler, el?)` | Subscribe. Returns unsub function. Optional element lifecycle tie. |

### Utilities

| Function | Description |
|----------|-------------|
| `bw.$(selector)` | Query DOM, always returns array. |
| `bw.escapeHTML(str)` | Escape HTML special characters. |
| `bw.raw(str)` | Mark string as pre-escaped HTML (bypass escaping). |
| `bw.typeOf(x)` | Enhanced typeof: `"array"`, `"null"`, `"date"`, etc. |
| `bw.colorInterp(x, in0, in1, colors)` | Interpolate between color stops. |
| `bw.loremIpsum(n)` | Generate n characters of placeholder text. |

## ComponentHandle Pattern (Level 2)

This is the recommended pattern for stateful components:

```javascript
var counter = bw.component({
  t: 'div',
  c: [
    { t: 'h3', c: 'Count: ${count}' },    // template binding
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

bw.DOM('#app', counter);        // mount (auto-detects ComponentHandle)
counter.set('count', 42);       // auto-re-renders (microtask batched)
counter.increment();             // methods from o.methods promoted to handle
counter.get('count');            // 43
counter.destroy();               // cleanup + remove from DOM
```

### ComponentHandle API

| Method | Description |
|--------|-------------|
| `.get(key)` | Read state value (supports dot-path: `'user.name'`) |
| `.set(key, value)` | Set state, trigger re-render (batched via Promise.resolve) |
| `.getState()` | Shallow copy of entire state |
| `.setState(updates)` | Merge multiple keys, one re-render |
| `.push(key, val)` | Push to array in state |
| `.splice(key, start, del, ...)` | Splice array in state |
| `.mount(el)` | Mount into DOM element |
| `.unmount()` | Remove from DOM (preserves state for re-mount) |
| `.destroy()` | Full cleanup (unmount + clear state + unregister) |
| `.on(event, handler)` | DOM event listener on component element |
| `.off(event, handler)` | Remove DOM event listener |
| `.sub(topic, handler)` | Pub/sub subscription (auto-cleanup on destroy) |
| `.action(name, ...args)` | Call named action |
| `.select(sel)` | querySelector within component |
| `.selectAll(sel)` | querySelectorAll within component |
| `.userTag(tag)` | Set CSS class for `bw.message()` addressing |
| `.taco` | Access underlying TACO definition |
| `.element` | Access mounted DOM element |
| `.mounted` | Boolean: is component in the DOM? |

### Template Bindings

Use `${expr}` in TACO content or attributes. Bindings auto-update on `.set()`:

```javascript
bw.component({
  t: 'div', c: [
    { t: 'h3', c: 'Hello, ${name}!' },
    { t: 'span', a: { class: 'badge ${status}' }, c: '${status}' }
  ],
  o: { state: { name: 'World', status: 'active' } }
});
```

**Tier 1 (default)**: Dot-path only (`${user.name}`, `${items.length}`). CSP-safe.
**Tier 2 (via bw.compile)**: Full JS expressions (`${count * 2}`, `${active ? "on" : "off"}`). Requires `unsafe-eval`.

### Control Flow

```javascript
// Conditional rendering
bw.when('${loggedIn}',
  { t: 'p', c: 'Welcome, ${username}!' },
  { t: 'p', c: 'Please log in.' }
)

// List rendering
bw.each('${items}', function(item, index) {
  return { t: 'li', c: item.name };
})
```

### Lifecycle Hooks

| Hook | When | Signature |
|------|------|-----------|
| `willMount` | Before first DOM insertion | `function(handle)` |
| `mounted` | After DOM insertion | `function(handle)` or `function(el, state)` (legacy) |
| `willUpdate` | Before re-render | `function(handle, changedKeys)` |
| `onUpdate` | After re-render | `function(handle, changedKeys)` |
| `unmount` | Before DOM removal | `function(handle)` |
| `willDestroy` | Before full destruction | `function(handle)` |

### bw.message() — Component Dispatch

```javascript
// Tag a component
myPanel.userTag('dashboard_prod');

// Send from anywhere (decoupled)
bw.message('dashboard_prod', 'addAlert', { severity: 'warning', text: 'CPU spike' });

// Server-driven pattern (SSE)
var es = new EventSource('/api/events');
es.onmessage = function(e) {
  var msg = JSON.parse(e.data);
  bw.message(msg.target, msg.action, msg.data);
};
```

### bw.inspect() — Console Debugging

```javascript
bw.inspect($0);              // inspect selected element
bw.inspect('#my-component'); // by selector
// Logs: State, Bindings, Methods, Actions, User tag, Mounted status
// Returns the ComponentHandle for chaining
```

## Low-Level State Pattern (Level 1)

For simple widgets or when you want full control:

```javascript
bw.DOM('#app', {
  t: 'div',
  o: {
    state: { count: 0 },
    render: function(el) {
      var s = el._bw_state;
      bw.DOM(el, {
        t: 'div', c: [
          { t: 'span', c: 'Count: ' + s.count },
          bw.makeButton({ text: '+', onclick: function() {
            s.count++; bw.update(el);
          }})
        ]
      });
    }
  }
});
```

## Component Library (BCCL)

All `bw.make*()` functions accept a props object and return a Level 0 TACO.

> **BCCL is optional.** You can create any UI with raw `{t, a, c, o}` objects — bitwrench doesn't require its built-in components. You can also use BCCL components alongside classes from other CSS frameworks (Bootstrap, Tailwind, etc.): `{ t: 'button', a: { class: 'btn btn-primary' }, c: 'Save' }` works fine. BCCL provides pre-styled components with bitwrench's built-in CSS, but the TACO format is framework-agnostic.

### Layout

```javascript
bw.makeContainer({ fluid: false, children, className })
bw.makeRow({ children, gap, className })
bw.makeCol({ size, offset, children, className })
// size: number 1-12 or responsive { sm: 6, md: 4, lg: 3 }
bw.makeStack({ children, direction: 'vertical'|'horizontal', gap: 3, className })
```

### Content

```javascript
bw.makeCard({
  title, subtitle, content, footer, header,
  image: { src, alt }, imagePosition: 'top'|'bottom'|'left'|'right',
  variant, bordered: true, shadow, hoverable: false, className, style
})

bw.makeAlert({ title, content, variant: 'info', dismissible: true, className })
bw.makeBadge({ text, variant: 'primary', pill: false, className })
bw.makeProgress({ value: 0, max: 100, variant, striped, animated, label })
bw.makeSpinner({ variant: 'primary', size: 'md', type: 'border'|'grow' })
bw.makeListGroup({ items, flush: false, interactive: false })
bw.makeStatCard({ value, label, change, format, prefix, suffix, icon, variant })
bw.makeMediaObject({ src, alt, title, content, reverse, imageSize: '3rem' })
bw.makeTimeline({ items: [{ title, content, date, variant }] })
bw.makeStepper({ steps: ['Step 1', 'Step 2'], currentStep: 0 })
```

### Navigation

```javascript
bw.makeNav({ items: [{ text, href, active, disabled }], pills, vertical })
bw.makeNavbar({ brand, brandHref: '#', items, dark: true })
bw.makeTabs({ tabs: [{ label, content }], activeIndex: 0 })
bw.makeBreadcrumb({ items: [{ text, href, active }] })
bw.makePagination({ pages, currentPage, onPageChange, size })
```

### Forms

```javascript
bw.makeForm({ children, onsubmit, className })
bw.makeFormGroup({ label, help, error, required })
bw.makeInput({ type: 'text', placeholder, value, id, name, disabled, required, oninput, onchange })
bw.makeTextarea({ placeholder, value, rows: 3, id, name })
bw.makeSelect({ options: [{ value, text }], value, id, name, onchange })
bw.makeCheckbox({ label, checked: false, id, name, disabled })
bw.makeRadio({ label, name, value, checked, id, disabled })
bw.makeSwitch({ label, checked: false, id, name, disabled })
bw.makeRange({ min: 0, max: 100, step: 1, value: 50, label, showValue })
bw.makeSearchInput({ placeholder: 'Search...', value, onSearch, onInput })
bw.makeChipInput({ chips: [], placeholder: 'Add...', onAdd, onRemove })
bw.makeFileUpload({ accept, multiple, onFiles, text })
```

### Buttons

```javascript
bw.makeButton({ text, variant: 'primary', size, disabled, onclick, type: 'button' })
bw.makeButtonGroup({ children, size, vertical: false })
```

### Interactive

```javascript
bw.makeAccordion({ items: [{ title, content, open }], multiOpen: false })
bw.makeModal({ title, content, footer, size, closeButton: true, onClose })
bw.makeToast({ title, content, variant, autoDismiss: true, delay: 5000, position: 'top-right' })
bw.makeDropdown({ trigger, items, align: 'start', variant: 'primary' })
bw.makeCarousel({ items: [{ src, alt, caption }], showControls, autoPlay, interval, height })
```

### Tables & Data

```javascript
bw.makeTable({ data, columns, sortable: true, striped, hover, className })
bw.makeTableFromArray({ data, headerRow: true, striped, hover, sortable })
bw.makeDataTable({ title, data, columns, responsive: true, striped, hover })
bw.makeBarChart({ data, labelKey, valueKey, title, color, height, formatValue })
```

### Overlays & Loading

```javascript
bw.makeTooltip({ content, text, placement: 'top' })
bw.makePopover({ trigger, title, content, placement: 'top' })
bw.makeSkeleton({ variant: 'text', width, height, count: 1 })
bw.makeAvatar({ src, alt, initials, size: 'md', variant: 'primary' })
```

### Page-Level

```javascript
bw.makeHero({ title, subtitle, content, variant, size: 'lg', centered, backgroundImage, overlay, actions })
bw.makeSection({ title, subtitle, content, variant, spacing: 'md' })
bw.makeFeatureGrid({ features: [{ icon, title, description }], columns: 3, centered })
bw.makeCTA({ title, description, actions, variant: 'light', centered })
bw.makeCodeDemo({ title, description, code, result, language: 'javascript' })
```

### Factory Dispatcher

```javascript
bw.make('card', { title: 'Hello' })  // → bw.makeCard({ title: 'Hello' })
Object.keys(bw.BCCL)                 // list all available component types
```

## Theming

```javascript
// Load defaults (call once)
bw.loadDefaultStyles();

// Generate a custom theme (returns { css, palette, name, alternate })
bw.generateTheme('mytheme', {
  primary: '#336699',
  secondary: '#cc6633',
  tertiary: '#339966',     // optional, defaults to primary
  spacing: 'normal',       // 'compact'|'normal'|'spacious'
  radius: 'md',            // 'none'|'sm'|'md'|'lg'|'pill'
  elevation: 'md',         // 'flat'|'sm'|'md'|'lg'
  motion: 'standard',      // 'reduced'|'standard'|'expressive'
  harmonize: 0.20          // hue shift semantic colors toward primary (0-1)
});

// Toggle between primary and alternate palette
bw.toggleTheme();          // returns 'primary' or 'alternate'
bw.applyTheme('primary');  // or 'alternate', 'light', 'dark'

// 12 built-in presets: teal, ocean, sunset, forest, slate, rose,
// indigo, amber, emerald, nord, coral, midnight
bw.generateTheme('ocean', bw.THEME_PRESETS.ocean);
```

## Pub/Sub Pattern

```javascript
// Publisher
bw.pub('cart:updated', { items: cart.items, total: cart.total });

// Subscriber
var unsub = bw.sub('cart:updated', function(detail) {
  bw.patch('cart-count', String(detail.items.length));
});

// Tie to element lifecycle (auto-unsubs on cleanup)
bw.sub('cart:updated', handler, myElement);

// Or use handle.sub() for auto-cleanup on destroy
myComponent.sub('cart:updated', function(detail) { ... });
```

## Inline Styles with bw.s() and bw.u

```javascript
// Compose utility styles
bw.makeCard({
  title: 'Styled Card',
  content: 'Hello',
  style: bw.s(bw.u.p4, bw.u.textCenter, { maxWidth: '400px' })
})

// Available utilities on bw.u:
// Layout: flex, flexCol, flexRow, flexWrap, block, inline, hidden
// Justify: justifyCenter, justifyBetween, justifyEnd
// Align: alignCenter, alignStart, alignEnd
// Spacing: gap1-gap8, p0-p8, px4, py2, py4, m0, m4, mt2, mt4, mb2, mb4, mx_auto
// Typography: textSm, textBase, textLg, textXl, text2xl, text3xl, bold, semibold, italic, textCenter, textRight
// Visual: bgWhite, bgTeal, textWhite, textTeal, textMuted, rounded, roundedLg, roundedFull, border, wFull, hFull, transition
```

## CSS Generation

```javascript
// Object → CSS string
var css = bw.css({
  '.my-card': { padding: '1rem', borderRadius: '8px' },
  '.my-card:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.15)' },
  '@media (max-width: 768px)': {
    '.my-card': { padding: '0.5rem' }
  }
});
bw.injectCSS(css, { id: 'my-styles' });

// Responsive helper
var responsiveCSS = bw.responsive('.my-grid', {
  base: { display: 'block' },
  md: { display: 'grid', gridTemplateColumns: '1fr 1fr' },
  lg: { gridTemplateColumns: '1fr 1fr 1fr' }
});
bw.injectCSS(responsiveCSS, { id: 'my-grid-styles' });
```

## CLI Usage

```bash
npm install -g bitwrench    # installs the `bwcli` command

# File conversion
bwcli input.md -o output.html                    # basic conversion
bwcli input.md -o output.html --theme ocean       # with theme
bwcli input.md -o output.html --standalone         # offline (bitwrench inlined)
bwcli input.md -o output.html --cdn                # CDN mode (jsdelivr)
bwcli input.md -o output.html --css styles.css     # custom CSS
bwcli input.md -o output.html --highlight          # syntax highlighting
bwcli input.md --theme "#336699,#cc6633"            # custom hex colors

# Dev server
bwcli serve                                       # serve current dir on port 7902
bwcli serve ./site --port 8080 --open             # serve directory, open browser
```

## bwserve (Server-Driven UI)

Push TACO objects from Node.js to the browser via SSE. Think Streamlit for JS.

```javascript
import { create } from 'bitwrench/bwserve';

const app = create({ port: 7902 });
app.page('/', (client) => {
  // Push UI to browser
  client.replace('#app', { t: 'h1', c: 'Hello from server!' });
  client.patch('#status', 'Connected');
  client.append('#log', { t: 'p', c: 'New entry' });
  client.remove('.old-item');
  // Batch multiple operations
  client.batch([
    { type: 'replace', selector: '#title', taco: { t: 'h1', c: 'Updated' } },
    { type: 'patch', selector: '#count', content: '42' }
  ]);
});
app.listen();
```

**Protocol messages**: `replace`, `patch`, `append`, `remove`, `batch`, `message`, `register`, `call`, `exec`.

**Three-tier execution**:
- `call(name, args)` — invoke a named function registered on the client
- `register(name, fnBody)` — send a function to register on client
- `exec(code)` — arbitrary JS execution (opt-in only: `allowExec: true`)

**Client-side** (auto-included when served by bwserve):
```javascript
bw.clientConnect('http://localhost:7902');
// All messages from server are applied automatically
```

## Node.js / SSR Usage

```javascript
import bw from 'bitwrench';

var html = bw.html(
  bw.makeCard({ title: 'Server Rendered', content: 'Generated on the server.' })
);
// Returns: '<div class="bw-card ..."><div class="bw-card-body">...</div></div>'
```

## Common Patterns

### Landing Page
```javascript
bw.DOM('#app', {
  t: 'div', c: [
    bw.makeHero({ title: 'My Product', subtitle: 'Description', actions: [
      bw.makeButton({ text: 'Get Started', variant: 'light', size: 'lg' })
    ]}),
    bw.makeSection({ title: 'Features', content:
      bw.makeFeatureGrid({ features: [
        { icon: '⚡', title: 'Fast', description: 'Blazing speed' },
        { icon: '🔒', title: 'Secure', description: 'Built-in security' },
        { icon: '📦', title: 'Lightweight', description: 'Zero deps' }
      ]})
    }),
    bw.makeCTA({ title: 'Ready?', description: 'Get started today.', actions: [
      bw.makeButton({ text: 'Sign Up', variant: 'primary', size: 'lg' })
    ]})
  ]
});
```

### Dashboard
```javascript
bw.DOM('#app', {
  t: 'div', c: [
    bw.makeNavbar({ brand: 'Dashboard', items: [
      { text: 'Home', href: '#', active: true },
      { text: 'Reports', href: '#' }
    ]}),
    bw.makeContainer({ children:
      bw.makeRow({ gap: 4, children: [
        bw.makeCol({ size: { md: 4 }, children:
          bw.makeCard({ title: 'Users', content: '1,234' })
        }),
        bw.makeCol({ size: { md: 4 }, children:
          bw.makeCard({ title: 'Revenue', content: '$5,678' })
        }),
        bw.makeCol({ size: { md: 4 }, children:
          bw.makeCard({ title: 'Orders', content: '890' })
        })
      ]})
    })
  ]
});
```

### Reactive Counter (Level 2)
```javascript
var counter = bw.component({
  t: 'div', c: [
    { t: 'span', c: 'Count: ${count}' },
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
counter.set('count', 99);   // auto-re-renders
```

### Form with Validation
```javascript
bw.DOM('#app', bw.makeCard({
  title: 'Contact Us',
  content: bw.makeForm({
    children: [
      bw.makeFormGroup({ label: 'Name', id: 'name',
        input: bw.makeInput({ id: 'name', placeholder: 'Your name', required: true }) }),
      bw.makeFormGroup({ label: 'Email', id: 'email',
        input: bw.makeInput({ type: 'email', id: 'email', placeholder: 'you@example.com' }) }),
      bw.makeFormGroup({ label: 'Message', id: 'msg',
        input: bw.makeTextarea({ id: 'msg', placeholder: 'Your message', rows: 4 }) }),
      bw.makeButton({ text: 'Send', type: 'submit', variant: 'primary' })
    ],
    onsubmit: function(e) { e.preventDefault(); alert('Sent!'); }
  })
}));
```

### Data Table
```javascript
bw.DOM('#app', bw.makeDataTable({
  title: 'Team Members',
  data: [
    { name: 'Alice', role: 'Engineer', status: 'Active' },
    { name: 'Bob', role: 'Designer', status: 'Away' },
    { name: 'Carol', role: 'PM', status: 'Active' }
  ],
  sortable: true
}));
```

## Key Rules

1. **Always call `bw.loadDefaultStyles()`** before rendering components (in browser).
2. **Content is escaped by default.** Use `o: { raw: true }` or `bw.raw(str)` for pre-escaped HTML.
3. **All make* functions return Level 0 TACO objects**, not HTML strings. Pass them to `bw.DOM()` or `bw.html()`.
4. **Use `bw.DOM()` to mount**, not `innerHTML`. It handles lifecycle hooks and cleanup.
5. **For reactive components, use `bw.component(taco)`** to get a ComponentHandle with `.get()/.set()`.
6. **Low-level state**: `el._bw_state` + `bw.update(el)` still works for simple cases.
7. **CSS classes use `bw-` prefix**: `bw-card`, `bw-btn`, `bw-container`, etc.
8. **Variants**: `primary`, `secondary`, `success`, `danger`, `warning`, `info`, `light`, `dark`.
9. **`bw.message(target, action, data)`** dispatches to components by UUID or user tag — the foundation for server-driven UI.
10. **Browser console IS your DevTools**: `$0._bw_state`, `$0._bwComponentHandle`, `bw.inspect($0)`. No extension needed.
11. **TACO is a component spec, not a DOM template.** Think MFC/Swing/Qt, not innerHTML. Components own their rendering — user calls `.set()`, not manual DOM updates.
12. **Three levels are explicit.** You always know whether you have a TACO (data), a DOM element (rendered), or a ComponentHandle (reactive). There is no hidden magic.
