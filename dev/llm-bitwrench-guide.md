# Bitwrench LLM Guide

> Single-file reference for building sites with bitwrench.js v2.
> Feed this to an LLM to enable AI-assisted bitwrench development.

## What is bitwrench?

A zero-dependency JavaScript UI library. No build step, no JSX, no virtual DOM. You describe UI as plain JS objects (TACO format), bitwrench renders them to HTML/DOM. Works in browsers and Node.js.

## TACO Format

Every UI element is a plain object with four keys:

```javascript
{
  t: 'div',                          // Tag name (required)
  a: { class: 'card', id: 'main' }, // Attributes (optional)
  c: 'Hello World',                  // Content: string, TACO, or array of TACOs (optional)
  o: {                                // Options (optional)
    mounted: (el) => {},              //   called after DOM insertion
    unmount: (el) => {},              //   called before removal
    state: { count: 0 },             //   component state
    render: (el) => { /* re-render */ }, // re-render function
    raw: true                         //   skip HTML escaping
  }
}
```

Content is HTML-escaped by default. Use `o: { raw: true }` for raw HTML.

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

### State Management

| Function | Description |
|----------|-------------|
| `bw.uuid(prefix?)` | Generate unique ID: `bw.uuid('card')` → `"bw_card_a1b2c3"` |
| `bw.patch(id, content, attr?)` | Update element content or attribute by ID. O(1) lookup. |
| `bw.patchAll({ id: content })` | Batch patch multiple elements. |
| `bw.update(el)` | Re-render element by calling its `o.render` function. |
| `bw.emit(el, event, detail)` | Dispatch CustomEvent (auto-prefixed `bw:`). |
| `bw.on(el, event, handler)` | Listen for CustomEvent. Handler receives `(detail, event)`. |
| `bw.pub(topic, detail)` | App-wide publish (not DOM-scoped). |
| `bw.sub(topic, handler, el?)` | Subscribe. Returns unsub function. Optional element lifecycle tie. |
| `bw.cleanup(el)` | Run unmount hooks, clear state, deregister from cache. |

### Utilities

| Function | Description |
|----------|-------------|
| `bw.$(selector)` | Query DOM, always returns array. `bw.$.one(sel)` for single. |
| `bw.escapeHTML(str)` | Escape HTML special characters. |
| `bw.typeOf(x)` | Enhanced typeof: `"array"`, `"null"`, `"date"`, etc. |
| `bw.colorInterp(x, in0, in1, colors)` | Interpolate between color stops. |
| `bw.loremIpsum(n)` | Generate n characters of placeholder text. |

## Component Library (BCCL)

All `bw.make*()` functions accept a props object and return a TACO.

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
  image: { src, alt },          // imagePosition: 'top'|'bottom'|'left'|'right'
  variant,                       // 'primary','secondary','success','danger','warning','info'
  bordered: true, shadow,       // shadow: 'none'|'sm'|'md'|'lg'
  hoverable: false, className, style
})

bw.makeAlert({ content, variant: 'info', dismissible: false, className })
bw.makeBadge({ text, variant: 'primary', pill: false, className })
bw.makeProgress({ value: 0, max: 100, variant, striped, animated, label })
bw.makeSpinner({ variant: 'primary', size: 'md', type: 'border'|'grow' })
bw.makeListGroup({ items, flush: false, interactive: false })
// items: ['text'] or [{ text, active, disabled, href, onclick }]
```

### Navigation

```javascript
bw.makeNav({ items: [{ text, href, active, disabled }], pills: false, vertical: false })
bw.makeNavbar({ brand, brandHref: '#', items: [{ text, href, active }], dark: true })
bw.makeTabs({ tabs: [{ label, content, active }], activeIndex: 0 })
bw.makeBreadcrumb({ items: [{ text, href, active }] })
```

### Forms

```javascript
bw.makeForm({ children, onsubmit, className })
bw.makeFormGroup({ label, input, help, id })
bw.makeInput({ type: 'text', placeholder, value, id, name, disabled, required, oninput, onchange })
bw.makeTextarea({ placeholder, value, rows: 3, id, name })
bw.makeSelect({ options: [{ value, text }], value, id, name, onchange })
bw.makeCheckbox({ label, checked: false, id, name, disabled })
```

### Tables

```javascript
bw.makeTable({
  data: [{ name: 'Alice', age: 30 }],   // array of row objects
  columns: [{ key: 'name', label: 'Name' }], // optional, auto-detected from data keys
  sortable: true,
  className: 'table'
})

// From 2D arrays (CSV, Object.entries(), spreadsheet data)
bw.makeTableFromArray({
  data: [
    ['Name', 'Age'],       // first row = headers (headerRow: true, default)
    ['Alice', 30],
    ['Bob', 25]
  ],
  headerRow: true,         // default true; false → auto-generates col0, col1, ...
  striped: true, hover: true, sortable: true  // all makeTable props pass through
})

bw.makeDataTable({
  title: 'Users',
  data: [...],
  columns: [...],
  responsive: true     // wraps in scrollable div
})

// Bar chart from data
bw.makeBarChart({
  data: [
    { label: 'Jan', value: 4200 },
    { label: 'Feb', value: 5100 }
  ],
  labelKey: 'label',     // default 'label'
  valueKey: 'value',     // default 'value'
  title: 'Monthly Revenue',
  color: '#006666',      // bar color
  height: '200px',       // chart area height
  formatValue: (v) => '$' + (v / 1000).toFixed(1) + 'k',
  showValues: true,      // labels above bars
  showLabels: true,      // labels below bars
  className: ''          // extra CSS classes
})
```

### Page-Level Components

```javascript
bw.makeHero({
  title, subtitle, content,
  variant: 'primary',           // gradient background
  size: 'lg',                   // 'sm'|'md'|'lg'|'xl'
  centered: true,
  backgroundImage,              // URL for bg image
  overlay: false,               // dark overlay for readability
  actions                       // array of button TACOs
})

bw.makeSection({ title, subtitle, content, variant, spacing: 'md', className })
bw.makeFeatureGrid({ features: [{ icon, title, description }], columns: 3, centered: true })
bw.makeCTA({ title, description, actions, variant: 'light', centered: true })
bw.makeCodeDemo({ title, description, code, result, language: 'javascript' })
```

### Buttons

```javascript
bw.makeButton({ text, variant: 'primary', size, disabled, onclick, type: 'button', className })
// variant: 'primary','secondary','success','danger','warning','info','light','dark'
// also: 'outline-primary','outline-secondary', etc.
// size: 'sm' or 'lg'

bw.makeButtonGroup({ children, size, vertical: false, className })
// Wraps buttons in a flex group with shared border-radius
```

### Interactive

```javascript
bw.makeAccordion({
  items: [{ title, content, open: false }],
  multiOpen: false,               // allow multiple items open at once
  className
})

bw.makeModal({
  title, content, footer,
  size,                            // 'sm'|'lg'|'xl'
  closeButton: true,               // show X button
  onClose,                         // callback when closed
  className
})
// Show/hide via ModalHandle: handle.show(), handle.hide(), handle.toggle(), handle.destroy()

bw.makeToast({
  title, content,
  variant: 'info',                 // 'primary','success','danger','warning','info'
  autoDismiss: true,
  delay: 5000,                     // ms before auto-dismiss
  position: 'top-right',           // 'top-left','top-center','bottom-right', etc.
  className
})

bw.makeDropdown({
  trigger,                         // string or button TACO
  items: [{ text, href, onclick, divider, disabled }],
  align: 'start',                  // 'start'|'end'
  variant: 'primary',
  className
})
```

### Form Controls (additional)

```javascript
bw.makeRadio({ label, name, value, checked: false, id, disabled, className })
bw.makeSwitch({ label, checked: false, id, name, disabled, className })
// Toggle switch — styled checkbox with role="switch"

bw.makePagination({
  pages, currentPage,
  onPageChange: (page) => {},      // callback receives page number
  size,                            // 'sm'|'lg'
  className
})
```

### Loading & Placeholder

```javascript
bw.makeSkeleton({
  variant: 'text',                 // 'text'|'circle'|'rect'
  width, height,
  count: 1,                        // number of text lines
  className
})

bw.makeAvatar({
  src,                             // image URL — shows img tag
  alt,
  initials,                        // fallback — shows colored circle with text
  size: 'md',                      // 'sm'|'md'|'lg'|'xl'
  variant: 'primary',              // background color for initials
  className
})
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
  radius: 'md'             // 'none'|'sm'|'md'|'lg'|'pill'
});

// Toggle between primary and alternate palette
bw.toggleTheme();          // returns 'primary' or 'alternate'
bw.applyTheme('primary');  // or 'alternate', 'light', 'dark'

// 12 built-in presets: ocean, sunset, forest, slate, monochrome,
// lavender, coral, midnight, emerald, autumn, nordic, cherry
```

## Three Levels of Materialization

TACO objects exist at three levels. Choose per-component:

| Level | What | How | Use case |
|-------|------|-----|----------|
| **Level 0: TACO** | Plain JS object (data/intent) | `bw.makeCard({...})` | Serialize, transform, send over wire, SSR |
| **Level 1: DOM/HTML** | Live DOM nodes (fire-and-forget) | `bw.DOM(sel, taco)` or `bw.html(taco)` | Render once, static pages |
| **Level 2: ComponentHandle** | Managed object with API | `bw.component(taco)` | Reactive state, .get()/.set()/.mount()/.destroy() |

`make*()` factories always return Level 0. User escalates to Level 2 via `bw.component()`.

## ComponentHandle (Reactive Components)

Wrap any TACO in `bw.component()` for reactive state with `.get()/.set()` API:

```javascript
var counter = bw.component({
  t: 'div',
  c: 'Count: ${count}',       // template binding — auto-updates on .set()
  o: {
    state: { count: 0 },
    methods: {
      increment: function(comp) { comp.set('count', comp.get('count') + 1); },
      reset: function(comp) { comp.set('count', 0); }
    }
  }
});

// Mount
counter.mount(document.getElementById('app'));
// or: bw.DOM('#app', counter);   // auto-detects ComponentHandle

// Use the API
counter.set('count', 42);        // auto-re-renders (microtask batched)
counter.get('count');             // 42
counter.increment();              // methods from o.methods are promoted to API
counter.destroy();                // cleanup + remove from DOM
```

### ComponentHandle API

| Method | Description |
|--------|-------------|
| `.get(key)` | Read state value |
| `.set(key, value)` | Set state, trigger re-render (batched) |
| `.mount(el)` | Mount into DOM element |
| `.destroy()` | Remove from DOM, run cleanup hooks |
| `.select(sel)` | Query within component |
| `.selectAll(sel)` | Query all within component |
| `.userTag(tag)` | Add CSS class for addressing via `bw.message()` |
| `.taco` | Access underlying TACO definition |
| `.element` | Access mounted DOM element |
| `.mounted` | Boolean: is component in the DOM? |

### Template Bindings

Use `${expr}` in TACO content or attributes. Bindings auto-update on `.set()`:

```javascript
bw.component({
  t: 'div', c: [
    { t: 'h3', c: 'Hello, ${name}!' },
    { t: 'p', c: 'Status: ${active ? "Online" : "Offline"}' }
  ],
  o: { state: { name: 'World', active: true } }
});
```

### Custom Methods (o.methods)

Define component behavior in `o.methods`. Each method receives the component handle as first arg:

```javascript
var dashboard = bw.component({
  t: 'div', c: 'Alerts: ${count}',
  o: {
    state: { count: 0, alerts: [] },
    methods: {
      addAlert: function(comp, data) {
        var alerts = comp.get('alerts').concat(data);
        comp.set('alerts', alerts);
        comp.set('count', alerts.length);
      },
      clearAlerts: function(comp) {
        comp.set('alerts', []);
        comp.set('count', 0);
      }
    }
  }
});

// Methods appear directly on the handle:
dashboard.addAlert({ severity: 'warning', text: 'CPU spike' });
dashboard.clearAlerts();
```

### Control Flow

```javascript
// Conditional rendering
bw.when('active', trueContent, falseContent)

// List rendering
bw.each('items', function(item) {
  return { t: 'li', c: item.name };
})
```

## bw.message() — Component Dispatch

Find a component by UUID or user tag, call one of its methods. Foundation for server-driven UI:

```javascript
// Tag a component for addressing
var panel = bw.component({...});
panel.userTag('dashboard_prod');
panel.mount(document.getElementById('app'));

// Dispatch from anywhere:
bw.message('dashboard_prod', 'addAlert', { severity: 'warning', text: 'CPU spike' });
// Returns true if dispatched, false if target/action not found

// Server-driven pattern (SSE):
var es = new EventSource('/api/events');
es.onmessage = function(e) {
  var msg = JSON.parse(e.data);
  bw.message(msg.target, msg.action, msg.data);
};
```

## bw.inspect() — Console Debugging

Dump component state, bindings, methods to console. Returns handle for chaining:

```javascript
// In browser console:
bw.inspect($0);              // inspect selected element
bw.inspect('#my-component'); // by selector
bw.inspect(myHandle);        // by ComponentHandle

// Output:
// Component: bw_comp_a1b2c3
//   State: { count: 42 }
//   Bindings: 1 (deps: ['count'])
//   Methods: ['increment', 'reset']
//   User tag: dashboard_prod
//   Mounted: true
//   Element: <div data-bw_comp_id="bw_comp_a1b2c3">
```

## State Management Patterns

### Low-Level Pattern (o.state + bw.update)

For simple components that don't need a managed API:

```javascript
function makeCounter(opts) {
  var id = bw.uuid('ctr');
  return {
    t: 'div', a: { id: id },
    o: {
      state: { count: opts.start || 0 },
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
  };
}
bw.DOM('#app', makeCounter({ start: 0 }));
```

### ComponentHandle Pattern (preferred for stateful components)

```javascript
function makeCounter(opts) {
  return bw.component({
    t: 'div',
    c: [
      { t: 'span', c: 'Count: ${count}' },
      bw.makeButton({ text: '+', onclick: function() {
        counter.increment();
      }})
    ],
    o: {
      state: { count: opts.start || 0 },
      methods: {
        increment: function(comp) { comp.set('count', comp.get('count') + 1); },
        reset: function(comp) { comp.set('count', 0); }
      }
    }
  });
}
var counter = makeCounter({ start: 0 });
bw.DOM('#app', counter);
counter.increment();   // API-driven update
```

## Pub/Sub Pattern

```javascript
// Publisher
bw.pub('cart:updated', { items: cart.items, total: cart.total });

// Subscriber
const unsub = bw.sub('cart:updated', function(detail) {
  bw.patch('cart-count', String(detail.items.length));
});

// Tie to element lifecycle (auto-unsubs on cleanup)
bw.sub('cart:updated', handler, myElement);

// Manual unsubscribe
unsub();
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
const css = bw.css({
  '.my-card': { padding: '1rem', borderRadius: '8px' },
  '.my-card:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.15)' },
  '@media (max-width: 768px)': {
    '.my-card': { padding: '0.5rem' }
  }
});
bw.injectCSS(css, { id: 'my-styles' });

// Or use responsive helper
const responsiveCSS = bw.responsive('.my-grid', {
  base: { display: 'block' },
  md: { display: 'grid', gridTemplateColumns: '1fr 1fr' },
  lg: { gridTemplateColumns: '1fr 1fr 1fr' }
});
bw.injectCSS(responsiveCSS, { id: 'my-grid-styles' });
```

## CLI Usage

```bash
# Install
npm install -g bitwrench

# Convert markdown to styled HTML page
bitwrench input.md -o output.html

# With theme
bitwrench input.md -o output.html --theme ocean

# Standalone (bitwrench.js inlined, no CDN needed)
bitwrench input.md -o output.html --standalone

# CDN mode (loads from jsdelivr)
bitwrench input.md -o output.html --cdn

# Custom CSS
bitwrench input.md -o output.html --css styles.css

# Custom hex colors
bitwrench input.md -o output.html --theme "#336699,#cc6633"
```

## Node.js / SSR Usage

```javascript
import bw from 'bitwrench';

const html = bw.html(
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
