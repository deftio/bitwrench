## 0. The Problem and the Idea

Building web UIs with raw HTML, CSS, and JavaScript works — but it's painful. HTML is verbose. Styling the same element across a page means copying CSS rules or managing class hierarchies. Adding interactivity means wiring up event listeners, tracking state in variables, and manually updating the DOM when things change. The more complex the UI, the more copy-paste, the more boilerplate, the more places things can go wrong.

Different paradigms emerged to manage this complexity:

- **Markup generation**: JSX (React), templates (Vue, Svelte, Angular) — describe UI declaratively, let a compiler or runtime translate it to DOM operations.
- **Styling**: Sass and Less added variables and mixins. Tailwind invented utility classes. CSS-in-JS libraries generate styles at runtime. CSS Modules scope class names to avoid conflicts.
- **State management**: React hooks, Vue reactivity, Svelte stores, Redux, Zustand — track application state and automatically re-render when it changes.
- **Build tooling**: Babel, webpack, Vite, esbuild — transpile, bundle, tree-shake, hot-reload. Required infrastructure to connect the pieces.

Each of these solves a real problem. But each also adds a layer — a new syntax, a new tool, a new abstraction to learn, configure, and maintain.

Bitwrench takes a different approach. Instead of adding layers, it leans into what the browser already provides — the DOM for structure, CSS for styling, JavaScript for behavior — and uses the JavaScript language itself to manage all three concerns.

The mechanism is a plain JavaScript object called a TACO: `{t, a, c, o}` — Tag, Attributes, Content, Options. A TACO describes a UI element the same way HTML does, but because it's a JavaScript object, you get the full language at every point: variables, functions, loops, conditionals, composition. No special syntax. No compiler. No build step.

> **"If you know JavaScript, you already know bitwrench. Everything else is just learning the shape of the objects."**

---

## 1. TACO: the Shape of a UI Element

### From HTML to TACO

Every HTML element has a tag, attributes, and content. A TACO object mirrors this directly:

```html
<!-- HTML -->
<div class="card" id="x">Hello world</div>
```

```js
// TACO — the same element as a JavaScript object
{ t: 'div', a: { class: 'card', id: 'x' }, c: 'Hello world' }
```

The mapping is direct: `t` is the tag name, `a` is an object of HTML attributes, `c` is the content. If we had a function to convert this object to real HTML, we could render it in the browser. That's exactly what bitwrench provides:

```js
var card = { t: 'div', a: { class: 'card', id: 'x' }, c: 'Hello world' };

bw.html(card);           // → '<div class="card" id="x">Hello world</div>'
bw.createDOM(card);      // → HTMLDivElement (a real DOM node, ready to insert)
bw.DOM('#target', card); // mount directly into an existing element on the page
```

Three output modes from one input:

- `bw.html()` — returns an HTML string. Useful for server-side rendering, Node.js scripts, email templates.
- `bw.createDOM()` — returns a detached DOM element. Useful when you need to manipulate it before inserting.
- `bw.DOM()` — mounts the result into an existing page element. The most common use.

The TACO is data. The rendering is a separate step. You decide when and how it becomes real.

### Minimal cases

Every key is optional. These are all valid TACOs:

```js
{ t: 'br' }                                          // self-closing tag
{ t: 'h1', c: 'Hello' }                              // tag + text content
{ t: 'input', a: { type: 'email', required: true } } // tag + attributes, no content
{ t: 'div' }                                         // empty div
```

If `t` is omitted, it defaults to `'div'`.

### Nesting — TACOs inside TACOs

Content (`c:`) can be a string, another TACO, or an array of both. This nesting is recursive — TACOs go as deep as your UI requires:

```js
// A single child
{ t: 'div', c: { t: 'span', c: 'child' } }

// Multiple children
{ t: 'div', c: [
    { t: 'h2', c: 'Title' },
    { t: 'p', c: 'Body text' }
]}

// Three levels deep: page → section → card → button
{ t: 'div', a: { class: 'page' }, c: [
    { t: 'nav', c: [
        { t: 'a', a: { href: '/' }, c: 'Home' },
        { t: 'a', a: { href: '/about' }, c: 'About' }
    ]},
    { t: 'section', a: { class: 'content' }, c: [
        { t: 'div', a: { class: 'card' }, c: [
            { t: 'h3', c: 'Welcome' },
            { t: 'p', c: 'This is three levels deep.' },
            { t: 'button', c: 'Click me' }
        ]}
    ]}
]}
```

The HTML equivalent would be around a dozen lines of nested tags with closing tags to match. The TACO is the same structure, but as data you can store in a variable, pass to a function, or build from a loop.

### Skipping content — nulls and conditionals

`null`, `undefined`, and `false` in content arrays are silently skipped. This makes conditional rendering natural:

```js
var showHeader = true;
var isAdmin = false;

{ t: 'div', c: [
    showHeader ? { t: 'h1', c: 'Dashboard' } : null,
    { t: 'p', c: 'Always visible' },
    isAdmin ? { t: 'a', c: 'Admin Panel' } : null
]}
// Renders: <h1>Dashboard</h1><p>Always visible</p>
// The admin link is skipped entirely.
```

### The fourth key — `o:` options

The `o:` field is where non-HTML concerns live — lifecycle hooks, component state, rendering behavior. It was added to the format because bitwrench-specific metadata shouldn't go in `a:` (that compiles directly to HTML attributes), and the `data-*` attribute namespace was being used inconsistently across libraries. A separate `o:` key keeps the library's concerns cleanly separated from the DOM's, with zero risk of namespace collisions.

```js
{
  t: 'div',
  a: { class: 'widget' },          // → becomes HTML attributes
  c: 'Hello',                       // → becomes element content
  o: {                               // → bitwrench-only, never in HTML output
    mounted: function(el) { },       // called after element enters the DOM
    unmount: function(el) { },       // called before element is removed
    state: { count: 0 }              // component state (used with bw.component)
  }
}
```

We'll cover `o:` in detail in Section 5 (Three Levels of Commitment). For now, just know it's where non-DOM concerns live.

---

## 2. Styling — CSS Is Just Strings

You've made a TACO and rendered it. The next question is: how do I style it?

Bitwrench doesn't care where your CSS comes from. You can use an external stylesheet, bitwrench's built-in classes, or generate CSS entirely from JavaScript. All three work together. But the JavaScript approach is where bitwrench's philosophy shines — because CSS values are just strings, and strings are something JavaScript handles naturally.

### Start simple — inline styles

The `style` attribute in a TACO works exactly like the HTML `style` attribute:

```js
{ t: 'div',
  a: { style: 'padding:1.5rem; background:#f5f5f5; border-radius:12px' },
  c: 'A styled box'
}
```

Nothing new here. But now put that style in a variable:

```js
var boxStyle = 'padding:1.5rem; background:#f5f5f5; border-radius:12px';

{ t: 'div', a: { style: boxStyle }, c: 'Box one' }
{ t: 'div', a: { style: boxStyle }, c: 'Box two' }
```

Change `boxStyle` once, both boxes update. No Sass variables. No CSS custom properties. Just a JavaScript variable.

### Shared styles across nested TACOs

```js
var cardStyle  = 'border:1px solid #ddd; border-radius:12px; overflow:hidden';
var headerStyle = 'padding:1rem; background:#336699; color:#fff';
var bodyStyle  = 'padding:1.5rem';

{ t: 'div', a: { style: cardStyle }, c: [
    { t: 'div', a: { style: headerStyle }, c: 'Card Title' },
    { t: 'div', a: { style: bodyStyle }, c: 'Card content goes here.' }
]}
```

Three style variables, one card. Reuse `cardStyle` on every card across your page.

### Base style + overrides

For simple variations, string concatenation works:

```js
var base = 'border-radius:12px; padding:1rem; border:1px solid #ddd';

{ t: 'div', a: { style: base + '; background:#e8f5e9' }, c: 'Success' }
{ t: 'div', a: { style: base + '; background:#ffebee' }, c: 'Error' }
{ t: 'div', a: { style: base + '; background:#e3f2fd' }, c: 'Info' }
```

For more complex composition, use objects with `Object.assign`:

```js
var baseObj = { borderRadius: '12px', padding: '1rem', border: '1px solid #ddd' };

var success = Object.assign({}, baseObj, { background: '#e8f5e9' });
var error   = Object.assign({}, baseObj, { background: '#ffebee' });
var info    = Object.assign({}, baseObj, { background: '#e3f2fd' });
```

This is Sass `@extend` without Sass.

### CSS classes — `bw.css()` generates stylesheets from objects

When inline styles aren't enough — you need pseudo-classes, media queries, or want to reuse styles by class name — generate CSS from JavaScript objects:

```js
bw.injectCSS(bw.css({
  '.card': {
    padding: '1.5rem',
    borderRadius: '12px',
    border: '1px solid #ddd'
  },
  '.card:hover': {
    boxShadow: '0 4px 12px rgba(0,0,0,.1)'
  },
  '@media (max-width: 768px)': {
    '.card': { padding: '0.75rem' }
  }
}));
```

`bw.css()` takes a JavaScript object and returns a CSS string. `bw.injectCSS()` inserts it into the document. CamelCase properties (`borderRadius`) auto-convert to kebab-case (`border-radius`). Pseudo-classes (`:hover`, `:focus`, `:active`) and `@media` queries work as top-level keys.

### CSS variables are just JS variables

```js
var brand  = '#8B4513';
var radius = '12px';
var shadow = '0 4px 12px rgba(0,0,0,.08)';

bw.injectCSS(bw.css({
  '.card':  { borderRadius: radius, boxShadow: shadow, borderColor: brand },
  '.badge': { borderRadius: radius, background: brand, color: '#fff' },
  '.btn':   { borderRadius: radius, background: brand }
}));
```

Change `brand` once, every rule that references it updates. No build step, no preprocessor.

### Functions generate CSS rules

```js
function cardStyles(accentColor) {
  var shades = bw.deriveShades(accentColor);
  return {
    background: shades.light,
    border: '1px solid ' + shades.border,
    color: shades.darkText,
    borderRadius: '12px'
  };
}

bw.injectCSS(bw.css({
  '.warning-card': cardStyles('#e67e22'),
  '.success-card': cardStyles('#27ae60'),
  '.info-card':    cardStyles('#3498db')
}));
```

This is Sass mixins without Sass. And it's more powerful — the function can do arbitrary computation, derive colors algorithmically, or read configuration.

### Theme palettes — complete design systems from two colors

```js
var theme = bw.generateTheme('brand', { primary: '#336699', secondary: '#cc6633' });

// theme.palette has every derived color as JS values
bw.injectCSS(bw.css({
  '.my-header': {
    background: theme.palette.primary.base,
    color: theme.palette.primary.textOn,
    borderBottom: '3px solid ' + theme.palette.secondary.base
  }
}));
```

`generateTheme()` isn't a black box. It returns the full palette as JavaScript values. You can mix theme-generated CSS with your own `bw.css()` rules using the same colors.

### Built-in styles

Bitwrench ships with Bootstrap-inspired classes (`bw-card`, `bw-btn`, `bw-table`, etc.) that you can load with `bw.loadDefaultStyles()`. Use them, ignore them, or override them.

### The key insight

Every CSS framework — Sass, Tailwind, CSS-in-JS — exists because CSS alone lacks variables, composition, and computation. JavaScript has all three. If your UI is already described in JavaScript objects, then CSS is just another set of string properties on those objects.

---

## 3. It's Just JavaScript — the Core Insight

This section is about something you already know but may not have noticed: because a TACO is a JavaScript object literal, every field is a JavaScript expression. This is the most important thing to understand about bitwrench, and the most commonly overlooked.

### Every value is an expression

```js
var title = 'Dashboard';
var isAdmin = true;
var items = ['Apples', 'Bananas', 'Cherries'];

{
  t: isAdmin ? 'h1' : 'h2',                        // computed tag
  a: {
    class: 'header ' + (isAdmin ? 'admin' : ''),    // computed class
    style: 'color:' + (isAdmin ? 'red' : 'black')   // computed style
  },
  c: [
    title,                                           // variable as content
    ...items.map(function(i) { return { t: 'li', c: i }; })  // .map() → children
  ]
}
```

This isn't a special feature. This is just how JavaScript object literals work. Bitwrench doesn't add anything here — it just doesn't take it away. JSX requires a compiler to turn markup back into function calls. Template strings lose structure. TACO objects are native JavaScript from start to finish.

### Functions as values — two timing modes

One of the unusual properties of TACO is that it supports two timing modes in the same object: authoring time and rendering time.

**Authoring time (IIFE)** — the function runs immediately when the object is created. The result is baked in as static data:

```js
// Content computed when the TACO object is created
{ t: 'div', c: (function() {
    var data = getExpensiveData();
    return data.map(function(d) { return { t: 'p', c: d.summary }; });
  })()
}

// Style computed from window size at creation time
{ t: 'div', a: {
    style: (function() {
      var w = window.innerWidth;
      return 'padding:' + (w < 768 ? '8px' : '24px');
    })()
  }, c: 'Responsive without @media'
}
```

**Rendering time (function reference)** — the function is stored as-is and evaluated when bitwrench processes the tree:

```js
// This function runs when bw.createDOM() or bw.DOM() encounters it
{ t: 'div', a: {
    style: function() { return 'opacity:' + getOpacity(); }
  }
}
```

The distinction matters:

- **Authoring time** produces data. The TACO is serializable — you can send it over the wire, cache it, render it to an HTML string. This is what bwserve uses to push UI from server to client.
- **Rendering time** produces behavior. The function executes at the moment the UI is rendered. It can access the current window size, user preferences, sensor readings, the current time — anything available in the browser at that moment.

Most template systems are either fully static (Mustache, Handlebars) or fully live (React JSX). TACO lets you choose per-field, in the same object. You decide what's fixed and what's deferred by choosing whether to call the function (IIFE) or pass it as a reference.

### Composition patterns

**Arrays compose content:**

```js
function makeHeader(title) {
  return { t: 'header', c: { t: 'h1', c: title } };
}
function makeFooter() {
  return { t: 'footer', c: '(c) 2026' };
}

{ t: 'div', c: [
    makeHeader('My App'),
    ...pages[currentPage].sections,
    showFooter ? makeFooter() : null
  ].filter(Boolean)
}
```

**Object.assign composes attributes:**

```js
var baseAttrs = { class: 'card', style: 'border-radius:12px' };
var clickable = { onclick: function() { alert('clicked'); }, style: 'cursor:pointer' };

{ t: 'div', a: Object.assign({}, baseAttrs, clickable), c: 'Click me' }
```

**Functions are your "components":**

```js
function colorCard(title, body, color) {
  return {
    t: 'div',
    a: { class: 'card', style: 'border-left:4px solid ' + color },
    c: [
      { t: 'h3', c: title },
      { t: 'p', c: body }
    ]
  };
}

{ t: 'div', c: [
    colorCard('Warning', 'Disk space low', '#e67e22'),
    colorCard('Success', 'Backup complete', '#27ae60'),
    colorCard('Info', '3 updates available', '#3498db')
]}
```

You don't need React's component concept, Vue's slots, or Svelte's `{#each}` syntax. JavaScript already has functions (components), arrays (slots), and `.map()` (iteration). TACO just gives these a shape that maps to the DOM.

### Conditionals — three ways

```js
// Ternary (inline)
{ t: 'div', c: loggedIn ? 'Welcome back' : 'Please sign in' }

// null filtering (in arrays)
{ t: 'nav', c: [
    { t: 'a', c: 'Home' },
    isAdmin ? { t: 'a', c: 'Admin' } : null,
    { t: 'a', c: 'About' }
  ].filter(Boolean)
}

// IIFE for complex logic
{ t: 'div', c: (function() {
    if (status === 'loading') return { t: 'span', c: 'Loading...' };
    if (status === 'error') return { t: 'span', a: { class: 'error' }, c: errorMsg };
    return resultList.map(function(r) { return { t: 'li', c: r.name }; });
  })()
}
```

### Iteration — it's just .map()

```js
var users = [
  { name: 'Alice', role: 'admin' },
  { name: 'Bob', role: 'user' }
];

{ t: 'table', c: [
    { t: 'thead', c: { t: 'tr', c: [
        { t: 'th', c: 'Name' }, { t: 'th', c: 'Role' }
    ]}},
    { t: 'tbody', c: users.map(function(u) {
      return { t: 'tr', c: [
          { t: 'td', c: u.name },
          { t: 'td', c: u.role }
      ]};
    })}
]}
```

No `v-for`, no `{#each}`, no special key rules. Just JavaScript.

---

## 4. The BCCL: Ready-Made Components

### What BCCL is and why it exists

BCCL (Bitwrench Common Component Library) is a set of 50+ factory functions that return TACO objects for common UI patterns — cards, buttons, navbars, tables, forms, modals, alerts, and more. Think of it as Bootstrap or shadcn/ui, but instead of HTML templates you get plain JavaScript objects.

The point: you can build a complete, styled page without writing a single line of CSS or HTML. Load the default styles, call the factories, render. Great for quick UIs, prototyping, embedded device interfaces, and internal tools.

Three things to know about BCCL:

1. **Every factory returns a TACO object.** The output is a plain `{t, a, c, o}` object. You can inspect it, modify any part, nest it, or pass it to any function that takes a TACO.
2. **There are no tricks.** BCCL factories are regular functions that construct TACO objects. They don't use private APIs or special rendering paths. Anything a BCCL factory does, you can do by hand.
3. **BCCL is optional.** You can use it for everything, use it selectively, or ignore it entirely and build your own components from scratch.

### Factories return TACO, not DOM

```js
var card = bw.makeCard({ title: 'Users', content: '42 online' });
// card is { t:'div', a:{class:'bw-card'}, c:[...] }

var page = { t: 'div', c: [
    bw.makeNavbar({ brand: 'My App', items: [
        { text: 'Home', href: '#' },
        { text: 'About', href: '#about' }
    ]}),
    { t: 'div', a: { class: 'content' }, c: [
        bw.makeAlert({ content: 'Welcome!', variant: 'success' }),
        card
    ]},
    bw.makeTable({ data: users, sortable: true })
]};

bw.DOM('#app', page);
```

### Quick inventory

| Category | Components |
|----------|-----------|
| Layout | makeNavbar, makeSidebar, makeGrid, makeRow, makeCol, makeContainer |
| Content | makeCard, makeAlert, makeBadge, makeStatCard, makeTimeline, makeHero |
| Forms | makeInput, makeSelect, makeTextarea, makeForm, makeFormGroup, makeSearchInput |
| Data | makeTable, makeTableFromArray, makeBarChart, makeProgress, makePagination |
| Interactive | makeButton, makeAccordion, makeTabs, makeModal, makeCarousel, makeTooltip, makeDropdown |

See `docs/component-library.md` for full signatures and options.

### Mix BCCL with your own TACOs

```js
{ t: 'div', c: [
    bw.makeCard({ title: 'Stats' }),
    { t: 'div', a: { class: 'custom-widget', style: 'padding:2rem' }, c: [
        { t: 'h3', c: 'Custom Section' },
        { t: 'p', c: 'Hand-written TACO next to a BCCL card.' }
    ]}
]}
```

### Modifying BCCL output

Since BCCL returns plain objects, you can modify them before rendering:

```js
var card = bw.makeCard({ title: 'Users', content: '42 online' });
card.a.style = 'border-left:4px solid #336699';
card.c.push({ t: 'small', c: 'Updated 5m ago' });
bw.DOM('#app', card);
```

---

## 5. Three Levels of Commitment

| Level | What you get | What you write | When to use |
|-------|-------------|---------------|-------------|
| **0 — Data** | A plain JS object | `makeCard({...})` or `{t,a,c}` | Static content, SSR, data-driven lists |
| **1 — DOM** | A rendered DOM tree | `bw.DOM('#x', taco)` | One-shot renders, manual re-renders |
| **2 — Managed** | A reactive component | `bw.component(taco)` | State that changes, auto-updating UI |

Most of your UI should be Level 0. Only escalate when you need interactivity. Level 0 TACOs are composable, serializable, and free. Level 2 components have overhead — use them for the parts that actually change.

### Level 0 — pure data

```js
var listing = {
  t: 'div', a: { class: 'products' },
  c: products.map(function(p) {
    return {
      t: 'div', a: { class: 'card' }, c: [
        { t: 'h3', c: p.name },
        { t: 'p', c: '$' + p.price.toFixed(2) }
      ]
    };
  })
};

bw.DOM('#products', listing);  // render once, done
```

### Level 1 — render and re-render

```js
function renderClock() {
  bw.DOM('#clock', { t: 'div', c: new Date().toLocaleTimeString() });
}
setInterval(renderClock, 1000);
renderClock();
```

You own the render loop. Call `bw.DOM()` whenever you want. Simple, explicit, good enough for many use cases.

### Level 2 — managed component with bw.component()

```js
var counter = bw.component({
  t: 'div', c: [
    { t: 'span', c: 'Count: ${count}' },
    bw.makeButton({ text: '+1', onclick: function() {
      counter.set('count', counter.get('count') + 1);
    }})
  ],
  o: {
    state: { count: 0 }
  }
});

bw.DOM('#app', counter);

// Later:
counter.set('count', 42);   // DOM auto-updates
counter.get('count');        // 42
counter.destroy();           // cleanup
```

`.set()` triggers a targeted DOM update — only the `${count}` text node changes, not the entire component. No virtual DOM diffing.

### Level 2 — o.methods for clean APIs

```js
var counter = bw.component({
  t: 'div', c: [
    { t: 'div', c: '${count}' },
    bw.makeButton({ text: '+', onclick: function() { counter.increment(); } }),
    bw.makeButton({ text: 'Reset', onclick: function() { counter.reset(); } })
  ],
  o: {
    state: { count: 0 },
    methods: {
      increment: function(c) { c.set('count', c.get('count') + 1); },
      reset: function(c) { c.set('count', 0); }
    }
  }
});
```

Methods defined in `o.methods` are promoted to the component handle. External code calls `counter.increment()` — the component owns its update logic.

### When to use which level

```
Is the content static or computed once from data?
  → Level 0. Use make*() or hand-write TACO. Render with bw.DOM().

Does the content change, but you control when?
  → Level 1. Call bw.DOM() again when data changes.

Does the content change in response to user interaction or external events,
and you want automatic DOM updates?
  → Level 2. Use bw.component() with ${bindings} and .set().
```

---

## 6. Events and Communication

### Event handlers — use onclick, not o.mounted

```js
// Primary pattern — clean and simple
bw.makeButton({
  text: 'Save',
  onclick: function() { save(); }
})

// Also good — inline in TACO
{ t: 'button', a: { onclick: function() { save(); } }, c: 'Save' }

// Works but verbose — use only when you need the element reference
{ t: 'button', c: 'Save',
  o: { mounted: function(el) { el.addEventListener('click', save); } }
}
```

`onclick` in attributes is the primary event pattern. Use `o.mounted` only when you need the actual DOM element reference — for example, setting up an IntersectionObserver, initializing a third-party library, or measuring element dimensions.

### Cross-component communication — pub/sub

```js
// Publisher (cart module)
function addToCart(item) {
  cart.push(item);
  bw.pub('cart:updated', { count: cart.length });
}

// Subscriber (navbar badge) — auto-cleans on component destroy
navbar.sub('cart:updated', function(data) {
  navbar.set('cartCount', data.count);
});
```

`bw.pub()` and `bw.sub()` are app-wide — not scoped to the DOM tree. Any component can publish, any component can subscribe. Subscriptions created via `handle.sub()` auto-cleanup when the component is destroyed.

### bw.message() — named component messaging

```js
counter.userTag('my_counter');
bw.message('my_counter', 'reset');  // calls counter.reset()
```

Address a component by name and invoke a method on it. Like Win32's `SendMessage` — decoupled dispatch without needing a reference to the target.

---

## 7. Server-Driven UI (bwserve)

### The idea

Any server that can write JSON to an HTTP response can drive a bitwrench UI. The server sends TACO objects over SSE (Server-Sent Events). The browser renders them. No client-side application logic required.

```
Server (any language)          Browser
  |                              |
  |-- SSE: {replace, #app, taco} --> bw.clientApply() --> DOM update
  |-- SSE: {patch, #counter, "42"} -> targeted text update
  |-- SSE: {append, #log, taco} ---> new child added
  |                              |
  |<-- POST: {action: "click"} --+   user interaction
```

### Initial UI delivery

The server sends a `replace` message with a TACO that becomes the page content:

```js
import bwserve from 'bitwrench/bwserve';

var app = bwserve.create({ port: 8080 });
app.page('/', function(client) {
  client.render('#app', {
    t: 'div', c: [
      { t: 'h1', c: 'Hello from the server' },
      { t: 'p', a: { id: 'status' }, c: 'Connected.' },
      { t: 'button', a: { 'data-bw-action': 'greet' }, c: 'Say hello' }
    ]
  });
});
app.listen();
```

The browser receives one HTML page (the "shell") with bitwrench loaded. Everything after that arrives as JSON messages over SSE.

### Incremental updates from server

```js
client.patch('#status', 'Processing...');
client.append('#log', { t: 'div', c: 'Event at ' + new Date().toISOString() });
client.remove('#old-notification');
client.batch([
  { type: 'patch', target: '#status', content: 'Done.' },
  { type: 'remove', target: '#spinner' }
]);
```

### Client events back to server

When a user clicks a `data-bw-action` element, the browser POSTs the action name to the server:

```js
client.on('greet', function(data) {
  client.patch('#status', 'Hello, user!');
});
```

### Server-side lifecycle — register and call

Register JavaScript functions on the client, then invoke them by name:

```js
client.register('showAlert', 'function(msg) { alert(msg); }');
client.call('showAlert', 'Server says hi!');

// Built-in calls
client.call('scrollTo', '#section-2');
client.call('redirect', '/dashboard');
```

### Addressing modes

Target any element by CSS selector or UUID:

```js
client.patch('#my-id', 'by ID');
client.patch('.status-bar', 'by class');
client.patch('[data-role="header"]', 'by attribute');

// UUID for stable addressing of dynamic content
var itemId = bw.uuid('item');
client.render('#list', { t: 'div', a: { class: itemId }, c: 'Dynamic item' });
client.patch('.' + itemId, 'Updated content');
```

### Why this matters

- **Language-agnostic**: any server that writes SSE can do this — Python, Go, Rust, C, shell scripts.
- **LLMs**: an AI can emit TACO objects directly — orders of magnitude fewer tokens than HTML/JSX.
- **Embedded**: an ESP32 serves one HTML page with bitwrench, then pushes sensor data as patches over SSE.
- **Replaces Streamlit/Gradio**: same server-driven pattern, not locked to Python, full TACO composition model.
- **Relaxed JSON**: bwserve accepts unquoted keys, single quotes, trailing commas — convenient for embedded C code.

---

## 8. Routing

Bitwrench is a UI library, not a framework — it doesn't include a router. But routing is a common need, and it's straightforward to handle.

### Often you don't need it

Many bitwrench apps are single-page dashboards or internal tools where tab-switching is sufficient:

```js
var currentTab = 'overview';

function renderApp() {
  bw.DOM('#app', { t: 'div', c: [
    bw.makeTabs({
      tabs: ['overview', 'analytics', 'settings'],
      active: currentTab,
      onchange: function(tab) { currentTab = tab; renderApp(); }
    }),
    currentTab === 'overview'  ? makeOverview() :
    currentTab === 'analytics' ? makeAnalytics() :
    makeSettings()
  ]});
}
renderApp();
```

### Client-side routing with hashchange

For bookmarkable URLs:

```js
var routes = {
  '':         makeHomePage,
  'about':    makeAboutPage,
  'products': makeProductsPage
};

function navigate() {
  var hash = location.hash.slice(1) || '';
  var page = routes[hash] || make404Page;
  bw.DOM('#app', page());
}

window.addEventListener('hashchange', navigate);
navigate();
```

### Server-side routing with bwserve

With bwserve, the server owns routing:

```js
app.page('/', function(client) { client.render('#app', makeHomePage()); });
app.page('/dashboard', function(client) { client.render('#app', makeDashboard()); });
```

---

## 9. Utilities and Color Functions

Bitwrench includes utility functions that show up regularly in UI work. These aren't the main attraction, but they eliminate common boilerplate.

### Color functions

```js
bw.hexToHsl('#336699');              // [210, 50, 40]
bw.hslToHex([210, 50, 40]);         // '#336699'
bw.adjustLightness('#336699', 20);   // lighten by 20%
bw.mixColor('#336699', '#cc6633', 0.5); // blend two colors
bw.textOnColor('#336699');           // '#fff' (contrast-safe text color)
bw.relativeLuminance('#336699');     // WCAG 2.0 luminance value
bw.deriveShades('#336699');          // { base, hover, active, light, darkText, border, focus, textOn }
bw.derivePalette({ primary: '#336699', secondary: '#cc6633' }); // full 9-group palette
```

`deriveShades()` and `derivePalette()` are the building blocks behind `generateTheme()`. You can use them directly for custom color systems.

### URL and data utilities

```js
bw.getURLParam('page', 'home');      // read ?page=... from URL, default 'home'
bw.typeOf(x);                        // enhanced typeof: 'array', 'null', 'date', etc.
bw.uuid('widget');                   // 'bw_widget_a3f2c1' (unique ID with prefix)
bw.loremIpsum(200);                  // 200 characters of placeholder text
bw.random(1, 100);                   // random integer
bw.random(5, 1, 100);               // array of 5 random integers
bw.mapScale(75, 0, 100, 0, 255);    // map value between ranges (191.25)
bw.clip(150, 0, 100);               // clamp to range (100)
bw.naturalCompare('item2', 'item10'); // natural sort comparison
```

### File I/O

```js
// Browser — save/load via download dialog or FileReader
bw.saveClientFile('report.txt', content);
bw.saveClientJSON('data.json', obj);
bw.loadClientFile(function(data) { /* file contents */ });
bw.loadClientJSON(function(obj) { /* parsed JSON */ });

// Node.js — same API names, uses fs
bw.loadLocalFile('config.json').then(function(data) { /* ... */ });
bw.saveLocalFile('output.txt', content);
```

### Relaxed JSON

Standard JSON requires double-quoted keys and no trailing commas. Bitwrench's relaxed JSON parser is more forgiving:

```js
bw.parseRJSON("{ name: 'Alice', age: 30, }");
// { name: 'Alice', age: 30 }
```

Unquoted keys, single quotes, trailing commas — all accepted. Especially useful for embedded systems where producing strict JSON is awkward, and for bwserve protocol messages from simple scripts.

---

## 10. Putting It All Together — Patterns

### Static page composition

```js
bw.loadDefaultStyles();
bw.generateTheme('brand', { primary: '#336699', secondary: '#cc6633' });

bw.DOM('#app', [
  bw.makeNavbar({ brand: 'Acme', items: [
    { text: 'Home', href: '#' }, { text: 'About', href: '#about' }
  ]}),
  makeHeroSection(data.hero),
  makeFeatureGrid(data.features),
  bw.makeTable({ data: data.pricing, sortable: true }),
  makeFooter()
]);
```

### Data-driven filtered list

```js
var allItems = [/* ... */];
var filter = 'all';

function renderList() {
  var items = filter === 'all' ? allItems : allItems.filter(function(i) {
    return i.type === filter;
  });
  bw.DOM('#list', { t: 'div', c: items.map(function(i) {
    return { t: 'div', a: { class: 'item' }, c: [
      { t: 'h3', c: i.name },
      { t: 'p', c: i.description }
    ]};
  })});
}

bw.DOM('#filters', { t: 'div', c: ['all', 'widget', 'gadget'].map(function(f) {
  return bw.makeButton({
    text: f,
    variant: filter === f ? 'primary' : 'outline-secondary',
    onclick: function() { filter = f; renderList(); }
  });
})});
renderList();
```

Level 1 — you own the render loop. No `bw.component()` needed.

### Reactive component with state

```js
var contactForm = bw.component({
  t: 'div', c: [
    { t: 'div', a: { style: 'display:${statusVisible}' }, c: '${statusMsg}' },
    bw.makeForm({ children: [
      bw.makeFormGroup({ label: 'Email', input: bw.makeInput({ type: 'email', id: 'email' }) }),
      bw.makeFormGroup({ label: 'Message', input: bw.makeTextarea({ id: 'msg', rows: 4 }) }),
      bw.makeButton({ text: 'Send', type: 'submit', variant: 'primary' })
    ], onsubmit: function(e) {
      e.preventDefault();
      contactForm.setState({ statusMsg: 'Sent!', statusVisible: 'block' });
    }})
  ],
  o: { state: { statusMsg: '', statusVisible: 'none' } }
});
bw.DOM('#contact', contactForm);
```

### Cross-component coordination

```js
var cartBadge = bw.component({
  t: 'span', c: 'Cart (${count})',
  o: { state: { count: 0 } }
});

cartBadge.sub('cart:updated', function(d) {
  cartBadge.set('count', d.count);
});

function addToCart(item) {
  cart.push(item);
  bw.pub('cart:updated', { count: cart.length, items: cart });
}
```

### Theme + custom CSS

```js
var theme = bw.generateTheme('brand', { primary: '#336699', secondary: '#cc6633' });
var accent = theme.palette.secondary.base;
var accentLight = theme.palette.secondary.light;

bw.injectCSS(bw.css({
  '.hero': {
    background: 'linear-gradient(135deg, ' + accent + ', ' + accentLight + ')',
    padding: '4rem 2rem', color: '#fff'
  },
  '.hero h1': { fontSize: 'clamp(2rem, 5vw, 3.5rem)' }
}));
```

### Ephemeral UI (toasts, notifications)

```js
function showToast(message, variant) {
  var toast = bw.createDOM(
    bw.makeAlert({ content: message, variant: variant || 'info', dismissible: true })
  );
  toast.style.cssText = 'position:fixed;top:1rem;right:1rem;z-index:9999;min-width:280px';
  document.body.appendChild(toast);
  setTimeout(function() { toast.remove(); }, 3500);
}
showToast('Item added to cart', 'success');
```

This is one of the few places where direct DOM insertion is the right call — the toast lives outside the application's TACO tree.

---

## 11. What Bitwrench Doesn't Do

| Feature | Why not | What to use instead |
|---------|---------|-------------------|
| Routing | UI library scope — see Section 8 | `hashchange` + `bw.DOM()`, or page.js/navigo |
| TypeScript types | Ships as UMD/ESM, works everywhere | Community .d.ts welcome, JSDoc in source |
| Virtual DOM | Targeted patches via UUID refs are sufficient | `bw.patch()`, `bw.component()` bindings |
| CSS purging | You generate only what you use via `bw.css()` | N/A |
| SSR hydration | `bw.html()` for SSR, `bw.DOM()` for client | Full page render via `bw.html()` in Node |
| Module bundling | No build step required | `<script>` tag, CDN, or ESM `import` |

---

## 12. Quick Reference

### Core rendering

| Function | What it does |
|----------|-------------|
| `bw.html(taco)` | TACO to HTML string |
| `bw.createDOM(taco)` | TACO to detached DOM element |
| `bw.DOM(sel, taco)` | Mount TACO into existing element |
| `bw.raw(str)` | Mark string as pre-escaped HTML |

### CSS

| Function | What it does |
|----------|-------------|
| `bw.css(rules)` | JS object to CSS string |
| `bw.injectCSS(css)` | Insert CSS string into document |
| `bw.loadDefaultStyles()` | Load built-in component CSS |
| `bw.generateTheme(name, cfg)` | Generate themed CSS from seed colors |

### State (Level 2)

| Function | What it does |
|----------|-------------|
| `bw.component(taco)` | Create managed component |
| `handle.set(key, val)` | Update state, auto-patch DOM |
| `handle.get(key)` | Read state |
| `handle.setState(obj)` | Batch update multiple keys |
| `handle.destroy()` | Cleanup and remove from DOM |

### Communication

| Function | What it does |
|----------|-------------|
| `bw.pub(topic, data)` | Publish to all subscribers |
| `bw.sub(topic, fn)` | Subscribe (returns unsub function) |
| `handle.sub(topic, fn)` | Subscribe with auto-cleanup on destroy |
| `bw.message(tag, action, data)` | Send to named component |

### Color

| Function | What it does |
|----------|-------------|
| `bw.hexToHsl(hex)` | Hex to [h, s, l] |
| `bw.hslToHex(hsl)` | [h, s, l] to hex |
| `bw.deriveShades(hex)` | 8 shade variants from one color |
| `bw.derivePalette(cfg)` | Full palette from seed colors |
| `bw.textOnColor(hex)` | Contrast-safe text color |
| `bw.mixColor(a, b, ratio)` | Blend two colors |

### Utilities

| Function | What it does |
|----------|-------------|
| `bw.$('selector')` | querySelectorAll as array |
| `bw.escapeHTML(str)` | Escape HTML special chars |
| `bw.uuid(prefix)` | Generate unique ID |
| `bw.typeOf(x)` | Enhanced typeof |
| `bw.getURLParam(key, def)` | Read URL query parameter |
| `bw.random(min, max)` | Random integer (or array) |
| `bw.loremIpsum(n)` | Placeholder text |
| `bw.mapScale(x, i0, i1, o0, o1)` | Map value between ranges |
| `bw.parseRJSON(str)` | Parse relaxed JSON |
| `bw.saveClientFile(name, data)` | Browser file download |
| `bw.loadClientJSON(cb)` | Browser file upload (JSON) |

---

## Appendix: For React/Vue/Svelte Developers

| React/Vue/Svelte | Bitwrench |
|-----------------|-----------|
| JSX / `<template>` | TACO object `{t, a, c, o}` |
| `useState` / `ref()` / `$state` | `bw.component()` + `.set()` |
| `useEffect` / `onMounted` / `onMount` | `o: { mounted: fn }` |
| `props` | Function arguments (TACO factories) |
| `children` / `<slot>` | `c:` array |
| `className` conditional | String concatenation or ternary |
| `map()` in JSX | `.map()` in `c:` array (same thing) |
| CSS Modules / styled-components | `bw.css()` + `bw.injectCSS()` |
| Context / Redux / Zustand | `bw.pub()` / `bw.sub()` |
| `npm run dev` (vite/webpack) | Open the HTML file |

---

*Bitwrench is maintained by [Manu Chatterjee](https://github.com/deftio) (deftio). BSD-2-Clause license.*
