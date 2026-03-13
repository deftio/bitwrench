# Thinking in Bitwrench — Detailed Outline (v2)

This is the teaching outline. Once approved, it becomes `docs/thinking-in-bitwrench.md`.
The compact derivative becomes the updated `docs/llm-bitwrench-guide.md`.

Target audience: developer who knows HTML, CSS, and JavaScript. May know React/Vue/Svelte.
Has never seen bitwrench. After reading this, they should be able to build anything without
reaching for raw DOM, and understand WHY each pattern works the way it does.

---

## 0. The Problem and the Idea

Building web UIs with raw HTML, CSS, and JavaScript works — but it's painful.
HTML is verbose. Styling the same element across a page means copying CSS rules
or managing class hierarchies. Adding interactivity means wiring up event listeners,
tracking state in variables, and manually updating the DOM when things change.
The more complex the UI, the more copy-paste, the more boilerplate, the more places
things can go wrong.

Different paradigms emerged to manage this complexity:

- **Markup generation**: JSX (React), templates (Vue, Svelte, Angular) — describe UI
  declaratively, let a compiler or runtime translate it to DOM operations.
- **Styling**: Sass/Less added variables and mixins. Tailwind invented utility classes.
  CSS-in-JS libraries generate styles at runtime. CSS Modules scope class names.
- **State management**: React hooks, Vue reactivity, Svelte stores, Redux, Zustand —
  track application state and re-render when it changes.
- **Build tooling**: Babel, webpack, Vite, esbuild — transpile, bundle, tree-shake,
  hot-reload. Required infrastructure to connect the pieces.

Each of these solves a real problem. But each also adds a layer — a new syntax,
a new tool, a new abstraction to learn, configure, and maintain.

**Bitwrench takes a different approach.** Instead of adding layers, it leans into what
the browser already provides — the DOM for structure, CSS for styling, JavaScript for
behavior — and uses the JavaScript language itself to manage all three concerns.

The mechanism is a plain JavaScript object called a TACO: `{t, a, c, o}` — Tag,
Attributes, Content, Options. A TACO describes a UI element the same way HTML does,
but because it's a JavaScript object, you get the full language at every point:
variables, functions, loops, conditionals, composition. No special syntax. No compiler.
No build step.

> "If you know JavaScript, you already know bitwrench.
> Everything else is just learning the shape of the objects."

---

## 1. TACO: the shape of a UI element

### 1a. From HTML to TACO

Every HTML element has a tag, attributes, and content. A TACO object mirrors this directly:

```html
<!-- HTML -->
<div class="card" id="x">Hello world</div>
```

```js
// TACO — the same element as a JavaScript object
{ t: 'div', a: { class: 'card', id: 'x' }, c: 'Hello world' }
```

The mapping is direct: `t` is the tag name, `a` is an object of attributes, `c` is
the content. If we had a function to convert this object to real HTML, we could render
it in the browser. That's exactly what bitwrench provides:

```js
var card = { t: 'div', a: { class: 'card', id: 'x' }, c: 'Hello world' };

bw.html(card);          // → '<div class="card" id="x">Hello world</div>'
bw.createDOM(card);     // → HTMLDivElement (detached DOM node, ready to insert)
bw.DOM('#target', card); // mount directly into an existing element on the page
```

Three output modes from one input:
- `bw.html()` → HTML string (for server-side rendering, Node.js, email templates)
- `bw.createDOM()` → detached DOM element (for programmatic insertion)
- `bw.DOM()` → mount into a page element (the most common use)

The TACO is data. The rendering is a separate step. You decide when and how it becomes real.

### 1b. Minimal cases

Every key is optional. These are all valid TACOs:

```js
{ t: 'br' }                                          // self-closing tag
{ t: 'h1', c: 'Hello' }                              // tag + text content
{ t: 'input', a: { type: 'email', required: true } } // tag + attributes, no content
{ t: 'div' }                                         // empty div (t defaults to 'div' if omitted)
```

### 1c. Nesting — TACOs inside TACOs

Content (`c:`) can be a string, another TACO, or an array of both:

```js
// A single child
{ t: 'div', c: { t: 'span', c: 'child' } }

// Multiple children
{ t: 'div', c: [
    { t: 'h2', c: 'Title' },
    { t: 'p', c: 'Body text' }
]}
```

This nesting is recursive — TACOs go as deep as your UI requires:

```js
// A page layout: nav → section → card → button
{ t: 'div', a: { class: 'page' }, c: [
    { t: 'nav', c: [
        { t: 'a', a: { href: '/' }, c: 'Home' },
        { t: 'a', a: { href: '/about' }, c: 'About' }
    ]},
    { t: 'section', a: { class: 'content' }, c: [
        { t: 'div', a: { class: 'card' }, c: [
            { t: 'h3', c: 'Welcome' },
            { t: 'p', c: 'This is three levels deep.' },
            { t: 'button', a: { onclick: function() { alert('hi'); } }, c: 'Click' }
        ]}
    ]}
]}
```

The HTML equivalent would be ~12 lines of nested tags. The TACO is the same structure,
but as data you can store in a variable, pass to a function, or build from a loop.

### 1d. Skipping content — nulls and conditionals

`null`, `undefined`, and `false` in content arrays are silently skipped. This makes
conditional rendering natural:

```js
var showHeader = true;
var isAdmin = false;

{ t: 'div', c: [
    showHeader ? { t: 'h1', c: 'Dashboard' } : null,
    { t: 'p', c: 'Always visible' },
    isAdmin ? { t: 'a', c: 'Admin Panel' } : null
]}
// Renders: <h1> + <p>. The admin link is skipped entirely.
```

### 1e. The fourth key — `o:` options

The `o:` field is for things that aren't HTML attributes — lifecycle hooks, component
state, rendering behavior. It exists because putting bitwrench-specific metadata in `a:`
would contaminate the HTML output, and the `data-*` attribute namespace was being used
inconsistently across libraries. A separate key keeps the library's concerns cleanly
separated from the DOM's.

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

We'll cover `o:` in detail in Section 5 (Three Levels of Commitment). For now,
just know it's where non-DOM concerns live.

---

## 2. Styling — CSS Is Just Strings

You've made a TACO and rendered it. The next question: how do I style it?

Bitwrench doesn't care where your CSS comes from. You can use an external stylesheet,
bitwrench's built-in classes, or generate CSS entirely from JavaScript. All three work
together. But the JavaScript approach is where bitwrench's philosophy shines — because
CSS values are just strings, and strings are something JavaScript handles naturally.

### 2a. Inline styles — start simple

The `style` attribute in a TACO works exactly like the HTML `style` attribute:

```js
{ t: 'div', a: { style: 'padding:1.5rem; background:#f5f5f5; border-radius:12px' },
  c: 'A styled box'
}
```

Nothing new here. But now put that style in a variable:

```js
var boxStyle = 'padding:1.5rem; background:#f5f5f5; border-radius:12px';

{ t: 'div', a: { style: boxStyle }, c: 'Box one' }
{ t: 'div', a: { style: boxStyle }, c: 'Box two' }  // same style, reused
```

Change `boxStyle` once, both boxes update. No Sass variables. No CSS custom properties.
Just a JavaScript variable.

### 2b. Shared styles across nested TACOs

```js
var cardStyle = 'border:1px solid #ddd; border-radius:12px; overflow:hidden';
var headerStyle = 'padding:1rem; background:#336699; color:#fff';
var bodyStyle = 'padding:1.5rem';

{ t: 'div', a: { style: cardStyle }, c: [
    { t: 'div', a: { style: headerStyle }, c: 'Card Title' },
    { t: 'div', a: { style: bodyStyle }, c: 'Card content goes here.' }
]}
```

Three style variables, one card. Reuse `cardStyle` on every card across your page.

### 2c. Base style + overrides

```js
var base = 'border-radius:12px; padding:1rem; border:1px solid #ddd';

{ t: 'div', a: { style: base + '; background:#e8f5e9' }, c: 'Success' }
{ t: 'div', a: { style: base + '; background:#ffebee' }, c: 'Error' }
{ t: 'div', a: { style: base + '; background:#e3f2fd' }, c: 'Info' }
```

String concatenation for simple overrides. For more complex composition, use objects:

```js
var baseObj = { borderRadius: '12px', padding: '1rem', border: '1px solid #ddd' };

// Object.assign merges style objects — later values override earlier ones
var success = Object.assign({}, baseObj, { background: '#e8f5e9' });
var error   = Object.assign({}, baseObj, { background: '#ffebee' });
```

This is Sass `@extend` without Sass.

### 2d. CSS classes — `bw.css()` generates stylesheets from objects

When inline styles aren't enough (pseudo-classes, media queries, reuse across many
elements), generate CSS classes from JavaScript objects:

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

`bw.css()` takes a JavaScript object and returns a CSS string. `bw.injectCSS()` puts
it in the document. CamelCase properties (`borderRadius`) auto-convert to kebab-case
(`border-radius`). Pseudo-classes (`:hover`, `:focus`, `:active`) and `@media` queries
work as top-level keys — this isn't a planned feature, it already works.

### 2e. CSS variables are just JS variables

```js
var brand = '#8B4513';
var radius = '12px';
var shadow = '0 4px 12px rgba(0,0,0,.08)';

bw.injectCSS(bw.css({
  '.card':  { borderRadius: radius, boxShadow: shadow, borderColor: brand },
  '.badge': { borderRadius: radius, background: brand, color: '#fff' },
  '.btn':   { borderRadius: radius, background: brand }
}));
```

Change `brand` once → every rule that references it updates on next render.
No Sass variables, no CSS custom properties, no build step. Just JavaScript.

### 2f. Functions generate CSS rules

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

This is Sass mixins without Sass. And it's more powerful — the function can do
arbitrary computation, call APIs, read state, derive colors algorithmically.

### 2g. Theme palettes — complete design systems from two colors

```js
var theme = bw.generateTheme('brand', { primary: '#336699', secondary: '#cc6633' });
// theme.css is injected automatically
// theme.palette has every derived color as JS values

// Use palette values in your own CSS rules
bw.injectCSS(bw.css({
  '.my-header': {
    background: theme.palette.primary.base,
    color: theme.palette.primary.textOn,
    borderBottom: '3px solid ' + theme.palette.secondary.base
  }
}));
```

`generateTheme()` isn't a black box that produces CSS you can't touch. It returns
the full palette as JavaScript values. You can mix theme-generated CSS with your own
`bw.css()` rules using the same colors.

### 2h. Built-in styles — bitwrench.css

Bitwrench ships with a set of Bootstrap-inspired classes (`bw-card`, `bw-btn`,
`bw-table`, etc.) that you can load with `bw.loadDefaultStyles()`. You can use these,
ignore them, or override them — bitwrench doesn't care where your CSS comes from.

### 2i. The key insight

CSS values are strings. JavaScript is good at strings. If your UI is already described
in JavaScript objects, then CSS is just another set of string properties on those objects.
You can store them in variables, compute them with functions, compose them with
`Object.assign`, and reuse them across components — all with plain JavaScript.

Every CSS framework (Sass, Tailwind, CSS-in-JS) exists because CSS alone lacks
variables, composition, and computation. JavaScript has all three. Bitwrench just
lets you use them.

---

## 3. It's Just JavaScript — the Core Insight

### 3a. Every value is an expression

Because a TACO is a JavaScript object literal, every field can be any JS expression:

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

This isn't a special feature. This is just how JavaScript object literals work.
Bitwrench doesn't add anything here — it just doesn't take it away. JSX requires
a compiler. Template strings lose structure. TACO objects are native JavaScript
from start to finish.

### 3b. Functions as values — two timing modes

**Define time (IIFE)** — the function runs immediately, result is baked into the object:

```js
// Content computed when the object is created
{ t: 'div', c: (function() {
    var data = getExpensiveData();
    return data.map(function(d) { return { t: 'p', c: d.summary }; });
  })()
}

// Style computed from runtime state at creation time
{ t: 'div', a: {
    style: (function() {
      var w = window.innerWidth;
      return 'padding:' + (w < 768 ? '8px' : '24px');
    })()
  }, c: 'Responsive without @media'
}
```

**Render time (function reference)** — bitwrench calls the function when it processes the tree:

```js
// Function evaluated by bw.createDOM() / bw.DOM() at render time
{ t: 'div', a: {
    style: function() { return 'opacity:' + getOpacity(); }
  }
}
```

This gives you two timing modes from one format:

- **Authoring time** (IIFE): the function executes when the TACO object is created.
  The result is static data — serializable, cacheable, transferable over the wire.
- **Rendering time** (function reference): the function executes when `bw.createDOM()`
  or `bw.DOM()` processes the tree. It can access the current window size, user data,
  sensor readings, the current time — anything available at the moment the UI is rendered.

This is an unusual property for a template system. Most templates are either fully
static (Mustache, Handlebars) or fully live (React JSX). TACO lets you choose
per-field, in the same object. The author of the TACO decides what's fixed and what's
deferred — and the decision is just whether to call the function or pass it.

### 3c. Composition patterns

**Arrays compose content:**

```js
function makeHeader(title) {
  return { t: 'header', c: { t: 'h1', c: title } };
}
function makeFooter() {
  return { t: 'footer', c: '(c) 2026' };
}

// Compose a page from parts — functions are just TACO factories
{ t: 'div', c: [
    makeHeader('My App'),
    ...pages[currentPage].sections,   // spread sections from data
    showFooter ? makeFooter() : null  // conditional (null is skipped)
  ].filter(Boolean)                   // clean up nulls
}
```

**Object.assign composes attributes:**

```js
var baseAttrs = { class: 'card', style: 'border-radius:12px' };
var clickable = { onclick: function() { alert('clicked'); }, style: 'cursor:pointer' };

{ t: 'div', a: Object.assign({}, baseAttrs, clickable), c: 'Click me' }
```

**Functions compose TACO factories (these are your "components"):**

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

// Use it — three cards from one factory
{ t: 'div', c: [
    colorCard('Warning', 'Disk space low', '#e67e22'),
    colorCard('Success', 'Backup complete', '#27ae60'),
    colorCard('Info', '3 updates available', '#3498db')
]}
```

You don't need React's "component" concept, Vue's "slots", or Svelte's `{#each}`
syntax. JavaScript already has functions (components), arrays (slots), and `.map()`
(iteration). TACO just gives these a shape that maps to the DOM.

### 3d. Conditionals — three ways

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

### 3e. Iteration — it's just .map()

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

No `v-for`, no `{#each}`, no `.map()` inside JSX with special key rules.
Just JavaScript.

---

## 4. The BCCL: Ready-Made Components

### 4a. What BCCL is and why it exists

BCCL (Bitwrench Common Component Library) is a set of 50+ factory functions that
return TACO objects for common UI patterns — cards, buttons, navbars, tables, forms,
modals, alerts, and more. Think of it as Bootstrap or shadcn/ui, but instead of HTML
templates you get plain JavaScript objects.

The point: you can build a complete, styled page without writing a single line of CSS
or HTML. Load the default styles, call the factories, render. Great for quick UIs,
prototyping, embedded device interfaces, and internal tools.

Three things to know about BCCL:

1. **Every factory returns a TACO object.** The output is a plain `{t, a, c, o}` object.
   You can inspect it, modify any part of it, nest it inside other TACOs, or pass it
   to any function that takes a TACO.
2. **There are no tricks.** BCCL factories are regular functions that construct TACO
   objects. They don't use any private APIs or special rendering paths. Anything a
   BCCL factory does, you can do by hand.
3. **BCCL is optional.** You can use it for everything, use it for some things and
   write custom TACOs for others, or ignore it entirely and build your own components
   from scratch.

### 4b. Factories return TACO, not DOM

```js
var card = bw.makeCard({ title: 'Users', content: '42 online' });
// card is just { t:'div', a:{class:'bw-card'}, c:[...] }
// It's a TACO object — inspect it, modify it, nest it

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

### 4c. Quick inventory

| Category | Components |
|----------|-----------|
| Layout | makeNavbar, makeSidebar, makeGrid, makeRow, makeCol, makeContainer |
| Content | makeCard, makeAlert, makeBadge, makeStatCard, makeTimeline, makeHero |
| Forms | makeInput, makeSelect, makeTextarea, makeForm, makeFormGroup, makeSearchInput |
| Data | makeTable, makeTableFromArray, makeBarChart, makeProgress, makePagination |
| Interactive | makeButton, makeAccordion, makeTabs, makeModal, makeCarousel, makeTooltip, makeDropdown |

See `docs/component-library.md` for full signatures and options.

### 4d. BCCL + your own TACOs — mix freely

```js
// BCCL component next to hand-written TACO — no conflict
{ t: 'div', c: [
    bw.makeCard({ title: 'Stats' }),
    { t: 'div', a: { class: 'custom-widget', style: 'padding:2rem' }, c: [
        { t: 'h3', c: 'Custom Section' },
        { t: 'p', c: 'This is a hand-written TACO next to a BCCL card.' }
    ]}
]}
```

### 4e. Modifying BCCL output

Since BCCL returns plain objects, you can modify them before rendering:

```js
var card = bw.makeCard({ title: 'Users', content: '42 online' });
card.a.style = 'border-left:4px solid #336699';  // add a custom accent
card.c.push({ t: 'small', c: 'Updated 5m ago' }); // append content
bw.DOM('#app', card);
```

---

## 5. Three Levels of Commitment

### 5a. The model

| Level | What you get | What you write | When to use |
|-------|-------------|---------------|-------------|
| 0 — Data | A plain JS object | `makeCard({...})` or `{t,a,c}` | Static content, SSR, data-driven lists |
| 1 — DOM | A rendered DOM tree | `bw.DOM('#x', taco)` | One-shot renders, manual re-renders |
| 2 — Managed | A reactive component | `bw.component(taco)` | State that changes, auto-updating UI |

Most of your UI should be Level 0. Only escalate when you need interactivity.
Level 0 TACOs are composable, serializable, and free. Level 2 components have
overhead — use them for the parts that actually change.

### 5b. Level 0 — pure data

```js
// A product listing — pure data, no state, no DOM yet
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

### 5c. Level 1 — render and re-render

```js
// A clock — re-renders every second
function renderClock() {
  bw.DOM('#clock', { t: 'div', c: new Date().toLocaleTimeString() });
}
setInterval(renderClock, 1000);
renderClock();
```

You own the render loop. Call `bw.DOM()` whenever you want. This is simple,
explicit, and good enough for many use cases.

### 5d. Level 2 — managed component with bw.component()

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

// Later: counter.set('count', 42) → DOM auto-updates
// counter.get('count') → 42
// counter.destroy() → cleanup
```

`.set()` triggers a targeted DOM update — only the `${count}` text node changes,
not the entire component. No virtual DOM diffing.

### 5e. Level 2 — o.methods for clean APIs

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

// External code calls counter.increment(), counter.reset()
// The component owns its update logic
```

### 5f. When to use which level — decision guide

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

### 6a. Event handlers — use onclick, not o.mounted

```js
// GOOD — clean, simple
bw.makeButton({
  text: 'Save',
  onclick: function() { save(); }
})

// ALSO GOOD — inline in TACO
{ t: 'button', a: { onclick: function() { save(); } }, c: 'Save' }

// WORKS BUT VERBOSE — avoid unless you need the element reference
{ t: 'button', c: 'Save',
  o: { mounted: function(el) { el.addEventListener('click', save); } }
}
```

`onclick` in attributes is the primary pattern. Use `o.mounted` only when you need
the actual DOM element reference for something `onclick` can't do (e.g., setting up
IntersectionObserver, initializing a third-party library, measuring element dimensions).

### 6b. Cross-component communication — pub/sub

```js
// Publisher (cart)
function addToCart(item) {
  cart.push(item);
  bw.pub('cart:updated', { count: cart.length });
}

// Subscriber (navbar badge) — auto-cleans on component destroy
navbar.sub('cart:updated', function(data) {
  navbar.set('cartCount', data.count);
});
```

### 6c. bw.message() — named component messaging

```js
counter.userTag('my_counter');
bw.message('my_counter', 'reset');  // calls counter.reset()
```

Like Win32's `SendMessage` — address a component by name and invoke a method on it.

---

## 7. Server-Driven UI (bwserve)

### 7a. The idea

Any server that can write JSON to an HTTP response can drive a bitwrench UI.
The server sends TACO objects over SSE (Server-Sent Events). The browser renders
them. No client-side application logic required.

```
Server (any language)          Browser
  │                              │
  ├─ SSE: {replace, #app, taco} ──→ bw.clientApply() → DOM update
  ├─ SSE: {patch, #counter, "42"} ─→ targeted text update
  ├─ SSE: {append, #log, taco} ───→ new child added
  │                              │
  │←── POST: {action: "click"} ──┤  user interaction
```

### 7b. Flow 1 — Initial UI delivery

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

The browser gets one HTML page (the "shell") with bitwrench loaded. Everything
after that arrives as JSON messages over SSE.

### 7c. Flow 2 — Incremental updates from server

Once the UI is rendered, the server can update any part of it:

```js
// Replace a specific element's text
client.patch('#status', 'Processing...');

// Append a new child to a container
client.append('#log', { t: 'div', c: 'Event at ' + new Date().toISOString() });

// Remove an element
client.remove('#old-notification');

// Batch multiple operations
client.batch([
  { type: 'patch', target: '#status', content: 'Done.' },
  { type: 'remove', target: '#spinner' }
]);
```

### 7d. Flow 3 — Client events back to server

When a user clicks a `data-bw-action` element, the browser POSTs the action
to the server:

```js
// Server-side handler
client.on('greet', function(data) {
  client.patch('#status', 'Hello, user!');
});
```

The `data` object includes the action name, the element's `data-bw-id` (if set),
and any nearby input values.

### 7e. Flow 4 — Server-side lifecycle

Register JavaScript functions on the client, then call them by name:

```js
// Send a function to the client
client.register('showAlert', 'function(msg) { alert(msg); }');

// Invoke it later
client.call('showAlert', 'Server says hi!');

// Built-in calls: scrollTo, focus, redirect, clipboard, download
client.call('scrollTo', '#section-2');
client.call('redirect', '/dashboard');
```

### 7f. Flow 5 — Addressing modes

Target elements by any CSS selector:

```js
client.patch('#my-id', 'by ID');
client.patch('.status-bar', 'by class');
client.patch('[data-role="header"]', 'by attribute');
client.patch('#app h1:first-child', 'by complex selector');
```

Or use `bw.uuid()` for stable addressing of dynamic content:

```js
var itemId = bw.uuid('item');
client.render('#list', {
  t: 'div', a: { class: itemId }, c: 'Dynamic item'
});
// Later:
client.patch('.' + itemId, 'Updated content');
```

### 7g. Why this matters

- **Language-agnostic**: any server that writes SSE can do this — Python, Go, Rust,
  C, shell scripts. The protocol is 9 JSON message types.
- **LLMs**: an AI can emit TACO objects directly — orders of magnitude fewer tokens
  than generating HTML or JSX.
- **Embedded**: an ESP32 or Raspberry Pi serves one HTML page with bitwrench, then
  pushes sensor data as patches over SSE.
- **Replaces Streamlit/Gradio**: same server-driven pattern, but not locked to Python,
  and you get the full TACO composition model.
- **Relaxed JSON**: bwserve accepts relaxed JSON (unquoted keys, single quotes,
  trailing commas) — convenient for embedded C code that can't easily produce
  strict JSON.

---

## 8. Routing

Bitwrench is a UI library, not a framework — it doesn't include a router. But routing
is a common need, and it's straightforward to handle.

### 8a. Often you don't need it

Many bitwrench apps are single-page dashboards, embedded device UIs, or internal tools
where tab-switching is sufficient:

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

No URL changes, no history management. Just re-render.

### 8b. Client-side routing with hashchange

For bookmarkable URLs, use the browser's `hashchange` event:

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
navigate(); // render initial route
```

### 8c. Server-side routing with bwserve

With bwserve, the server owns routing:

```js
app.page('/', function(client) {
  client.render('#app', makeHomePage());
});
app.page('/dashboard', function(client) {
  client.render('#app', makeDashboard());
});
```

Each URL gets its own page handler. The server sends the appropriate TACO over SSE.

---

## 9. Utilities and Color Functions

Bitwrench includes a set of utility functions that show up regularly in UI work.
These aren't the main attraction, but they eliminate common boilerplate.

### 9a. Color functions

```js
bw.hexToHsl('#336699');              // → [210, 50, 40]
bw.hslToHex([210, 50, 40]);         // → '#336699'
bw.adjustLightness('#336699', 20);   // lighten by 20%
bw.mixColor('#336699', '#cc6633', 0.5); // blend two colors
bw.textOnColor('#336699');           // → '#fff' (contrast-safe text color)
bw.relativeLuminance('#336699');     // WCAG 2.0 luminance
bw.deriveShades('#336699');          // → { base, hover, active, light, darkText, border, focus, textOn }
bw.derivePalette({ primary: '#336699', secondary: '#cc6633' }); // full 9-group palette
```

`deriveShades()` and `derivePalette()` are the building blocks behind `generateTheme()`.
You can use them directly to build custom color systems.

### 9b. URL and data utilities

```js
bw.getURLParam('page', 'home');      // read ?page=... from URL, default 'home'
bw.typeOf(x);                        // enhanced typeof: 'array', 'null', 'date', etc.
bw.uuid('widget');                   // → 'bw_widget_a3f2c1' (unique ID with prefix)
bw.loremIpsum(200);                  // 200 characters of placeholder text
bw.random(1, 100);                   // random integer
bw.random(5, 1, 100);               // array of 5 random integers
bw.mapScale(75, 0, 100, 0, 255);    // map value between ranges → 191.25
bw.clip(150, 0, 100);               // clamp → 100
bw.naturalCompare('item2', 'item10'); // natural sort: item2 < item10
```

### 9c. File I/O

```js
// Browser — save/load via download dialog or FileReader
bw.saveClientFile('report.txt', content);
bw.saveClientJSON('data.json', obj);
bw.loadClientFile(function(data) { /* file contents */ });
bw.loadClientJSON(function(obj) { /* parsed JSON */ });

// Node.js — same API, uses fs under the hood
bw.loadLocalFile('config.json').then(function(data) { /* ... */ });
bw.saveLocalFile('output.txt', content);
```

### 9d. Relaxed JSON (rJSON)

Standard JSON requires double-quoted keys and no trailing commas. Bitwrench's
relaxed JSON parser accepts:

```js
bw.parseRJSON("{ name: 'Alice', age: 30, }");
// → { name: 'Alice', age: 30 }
```

Unquoted keys, single quotes, trailing commas — all accepted. This is especially
useful for embedded systems (C, microcontrollers) where producing strict JSON is
awkward, and for bwserve protocol messages where the server is a simple script.

---

## 10. Putting It All Together — Patterns

### 10a. Pattern: static page composition

```js
bw.loadDefaultStyles();
bw.generateTheme('brand', { primary: '#336699', secondary: '#cc6633' });

bw.DOM('#app', [
  bw.makeNavbar({ brand: 'Acme', items: [
    { text: 'Home', href: '#' },
    { text: 'About', href: '#about' }
  ]}),
  makeHeroSection(data.hero),      // your own factory function
  makeFeatureGrid(data.features),  // returns TACO from data
  bw.makeTable({ data: data.pricing, sortable: true }),
  makeFooter()
]);
```

### 10b. Pattern: data-driven filtered list

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

// Filter buttons
bw.DOM('#filters', { t: 'div', c: ['all', 'widget', 'gadget'].map(function(f) {
  return bw.makeButton({
    text: f,
    variant: filter === f ? 'primary' : 'outline-secondary',
    onclick: function() { filter = f; renderList(); }
  });
})});

renderList();
```

This is Level 1 — you own the render loop. No `bw.component()` needed.

### 10c. Pattern: reactive component with state

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

### 10d. Pattern: cross-component coordination

```js
// Three independent components, coordinated via pub/sub
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

### 10e. Pattern: theme + custom CSS

```js
var theme = bw.generateTheme('brand', { primary: '#336699', secondary: '#cc6633' });

var accent = theme.palette.secondary.base;
var accentLight = theme.palette.secondary.light;

bw.injectCSS(bw.css({
  '.hero': {
    background: 'linear-gradient(135deg, ' + accent + ', ' + accentLight + ')',
    padding: '4rem 2rem',
    color: '#fff'
  },
  '.hero h1': { fontSize: 'clamp(2rem, 5vw, 3.5rem)' },
  '.hero:hover': { boxShadow: '0 8px 30px ' + accent + '40' }
}));
```

### 10f. Pattern: ephemeral UI (toasts, notifications)

```js
function showToast(message, variant) {
  var toast = bw.createDOM(
    bw.makeAlert({ content: message, variant: variant || 'info', dismissible: true })
  );
  toast.style.cssText = 'position:fixed;top:1rem;right:1rem;z-index:9999;min-width:280px';
  document.body.appendChild(toast);
  setTimeout(function() { toast.remove(); }, 3500);
}

// Usage
showToast('Item added to cart', 'success');
```

This is one of the few places where raw DOM (`document.body.appendChild`) is the right
call — the toast lives outside the TACO tree. Use `bw.createDOM()` to build it, then
position it manually.

---

## 11. What Bitwrench Doesn't Do (and why)

| Feature | Why not | What to use instead |
|---------|---------|-------------------|
| Routing | UI library scope — see Section 8 for patterns | `hashchange` + `bw.DOM()`, or page.js/navigo |
| TypeScript types | Ships as UMD/ESM, works everywhere | Community .d.ts welcome, JSDoc in source |
| Virtual DOM | Unnecessary — targeted patches via UUID refs | `bw.patch()`, `bw.component()` bindings |
| CSS purging | No unused CSS problem — you generate only what you use | N/A |
| SSR hydration | `bw.html()` for SSR, `bw.DOM()` for client — no mismatch | Full page render via `bw.html()` in Node |
| Module bundling | No build step required | Load via `<script>` tag, CDN, or `import` |

---

## 12. Quick Reference Card

### Core rendering

| Function | What it does |
|----------|-------------|
| `bw.html(taco)` | TACO → HTML string |
| `bw.createDOM(taco)` | TACO → detached DOM element |
| `bw.DOM(sel, taco)` | Mount TACO into existing element |
| `bw.raw(str)` | Mark string as pre-escaped HTML (no double-escaping) |

### CSS

| Function | What it does |
|----------|-------------|
| `bw.css(rules)` | JS object → CSS string |
| `bw.injectCSS(css)` | Insert CSS string into document |
| `bw.loadDefaultStyles()` | Load built-in component CSS |
| `bw.generateTheme(name, config)` | Generate themed CSS from seed colors |

### State (Level 2)

| Function | What it does |
|----------|-------------|
| `bw.component(taco)` | Create managed component with .get/.set/.destroy |
| `handle.set(key, val)` | Update state, auto-patches DOM |
| `handle.get(key)` | Read state |
| `handle.setState(obj)` | Batch update multiple keys |
| `handle.destroy()` | Cleanup, remove from DOM |

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
| `bw.hexToHsl(hex)` | Hex → [h, s, l] |
| `bw.hslToHex(hsl)` | [h, s, l] → hex |
| `bw.deriveShades(hex)` | 8 shade variants from one color |
| `bw.derivePalette(config)` | Full palette from seed colors |
| `bw.textOnColor(hex)` | Contrast-safe text color (#fff or #000) |
| `bw.mixColor(a, b, ratio)` | Blend two colors |

### Utilities

| Function | What it does |
|----------|-------------|
| `bw.$('selector')` | querySelectorAll → array |
| `bw.escapeHTML(str)` | Escape HTML special chars |
| `bw.uuid(prefix)` | Generate unique ID |
| `bw.typeOf(x)` | Enhanced typeof ('array', 'null', 'date', etc.) |
| `bw.getURLParam(key, default)` | Read URL query parameter |
| `bw.random(min, max)` | Random integer (or array) |
| `bw.loremIpsum(n)` | Placeholder text |
| `bw.mapScale(x, in0, in1, out0, out1)` | Map value between ranges |
| `bw.parseRJSON(str)` | Parse relaxed JSON |
| `bw.saveClientFile(name, data)` | Browser file download |
| `bw.loadClientJSON(callback)` | Browser file upload (JSON) |

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
| `npm run dev` (vite/webpack) | Open the HTML file. That's it. |
