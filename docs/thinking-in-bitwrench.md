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

### Raw HTML in content — bw.raw()

By default, bitwrench escapes all content — `<b>bold</b>` renders as the literal text `<b>bold</b>`, not bold text. This prevents XSS and is almost always what you want.

When you need actual HTML inside a TACO (line breaks, inline formatting, HTML entities), use `bw.raw()`:

```js
// Without bw.raw() — the <br> and <span> are escaped to visible text
{ t: 'h1', c: 'Coffee That<br>Tells a <span>Story</span>' }
// Renders: Coffee That&lt;br&gt;Tells a &lt;span&gt;Story&lt;/span&gt;

// With bw.raw() — the HTML is rendered as-is
{ t: 'h1', c: bw.raw('Coffee That<br>Tells a <span class="accent">Story</span>') }
// Renders: Coffee That (line break) Tells a Story (styled)
```

`bw.raw()` returns a sentinel object `{ __bw_raw: true, v: str }` — it doesn't modify the string, it marks it. Bitwrench checks for this marker during rendering and skips escaping. Never use `bw.raw()` on user-provided input.

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
    state: { count: 0 }              // component state (used with o.render)
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
var theme = bw.makeStyles({ primary: '#336699', secondary: '#cc6633' });
bw.applyStyles(theme);

// theme.palette has every derived color as JS values
bw.injectCSS(bw.css({
  '.my-header': {
    background: theme.palette.primary.base,
    color: theme.palette.primary.textOn,
    borderBottom: '3px solid ' + theme.palette.secondary.base
  }
}));
```

`makeStyles()` isn't a black box. It returns the full palette as JavaScript values. You can mix theme-generated CSS with your own `bw.css()` rules using the same colors.

### @keyframes and nested at-rules

`bw.css()` handles `@media`, `@keyframes`, and all `@`-prefix rules recursively:

```js
bw.injectCSS(bw.css({
  '@keyframes fadeIn': {
    '0%': { opacity: '0', transform: 'translateY(-10px)' },
    '100%': { opacity: '1', transform: 'translateY(0)' }
  },
  '.toast': {
    animation: 'fadeIn 0.3s ease-out',
    padding: '0.75rem 1rem',
    borderRadius: '8px'
  },
  '@media (prefers-reduced-motion: reduce)': {
    '.toast': { animation: 'none' }
  }
}));
```

All `@`-prefix keys are treated as nested blocks. No special syntax needed — it's the same JS object structure used everywhere else.

### Style composition — bw.s()

When inline styles get complex, string concatenation becomes fragile. `bw.s()` merges any number of style objects into a style string:

```js
// Compose style objects — bw.s() merges them left-to-right
{ t: 'div', a: { style: bw.s({ display: 'flex' }, { alignItems: 'center' }, { gap: '1rem' }) }, c: [
    { t: 'img', a: { src: 'avatar.png', style: bw.s({ borderRadius: '0.375rem' }, { width: '40px' }) } },
    { t: 'span', c: 'Alice' }
]}

// Store base styles in variables, merge with custom properties
var cardHeader = bw.s({ display: 'flex' }, { justifyContent: 'space-between' }, { padding: '1rem' }, {
  borderBottom: '1px solid #eee',
  background: theme.palette.primary.light
});

// Conditional styles — null/undefined args are skipped
{ t: 'div', a: {
    style: bw.s({ padding: '1rem' }, isActive ? { fontWeight: '700' } : null, { color: accent })
  }, c: 'Status'
}
```

`bw.s()` skips `null`/`undefined` arguments, so conditional composition works cleanly. It's `Object.assign` for CSS with a string output — runtime-composable. Unlike Tailwind class strings, you can store base styles in variables, merge them with `bw.s()`, and override individual properties.

### Responsive breakpoints — bw.responsive()

`bw.responsive()` generates `@media` rules from a JavaScript object, using bitwrench's standard breakpoints:

```js
bw.injectCSS([
  bw.css({ '.hero h1': { fontSize: '1.5rem', padding: '1rem' } }),
  bw.responsive('.hero h1', {
    md: { fontSize: '2.5rem', padding: '2rem' },
    xl: { fontSize: '3.5rem' }
  })
].join('\n'));
```

The breakpoints (`sm`, `md`, `lg`, `xl`) match bitwrench's grid system. `bw.responsive()` returns a CSS string — join it with `bw.css()` output and pass the combined string to `bw.injectCSS()`.

### Built-in styles

Bitwrench ships with Bootstrap-inspired classes (`bw-card`, `bw-btn`, `bw-table`, etc.) that you can load with `bw.loadStyles()`. Use them, ignore them, or override them.

### Utility shorthand — bw.u() (optional plugin)

If you prefer Tailwind-style terse tokens, the `bitwrench-util-css` plugin (~1KB gzipped, loaded separately) adds `bw.u()`:

```js
// Returns a style object — composes with bw.s()
bw.u('flex gap4 p4 alignCenter')
// => { display: 'flex', gap: '1rem', padding: '1rem', alignItems: 'center' }

// Or as a CSS string for inline styles
{ t: 'div', a: { style: bw.u.css('flex gap4 p4') }, c: '...' }

// Mix shorthand with explicit properties
a: { style: bw.s(bw.u('flex gap4'), { borderBottom: '2px solid ' + accent }) }
```

The scale is `{n} * 0.25rem`, so `p4` = 1rem, `gap8` = 2rem. Tokens cover padding, margin, gap, width, height, flex, alignment, font sizes, and colors (`bg-[#hex]`, `text-[#hex]`). Add custom tokens with `bw.u.extend({ name: styleObj })`.

This is entirely optional — `bw.s()` and `bw.css()` handle everything without it. But for rapid prototyping, shorter token strings mean less typing and (for LLMs) fewer tokens.

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
| **0 -- Data** | A plain JS object | `makeCard({...})` or `{t,a,c}` | Static content, SSR, data-driven lists |
| **1 -- DOM** | A rendered DOM tree | `bw.DOM('#x', taco)` | One-shot renders, manual re-renders |
| **2 -- Stateful** | A reactive component | `o.state` + `o.render` + `bw.update()` | State that changes, re-rendering UI |

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

### Level 2 -- stateful TACO with o.state + o.render

```js
var counter = {
  t: 'div',
  o: {
    state: { count: 0 },
    render: function(el) {
      var s = el._bw_state;
      bw.DOM(el, {
        t: 'div', c: [
          { t: 'span', c: 'Count: ' + s.count },
          bw.makeButton({ text: '+1', onclick: function() {
            s.count++;
            bw.update(el);
          }}),
          bw.makeButton({ text: 'Reset', onclick: function() {
            s.count = 0;
            bw.update(el);
          }})
        ]
      });
    }
  }
};

bw.DOM('#app', counter);
```

When state changes, call `bw.update(el)` to re-invoke the render function. The component owns its update logic -- event handlers modify `el._bw_state` directly and trigger re-render.

### When to use which level

```
Is the content static or computed once from data?
  => Level 0. Use make*() or hand-write TACO. Render with bw.DOM().

Does the content change, but you control when?
  => Level 1. Call bw.DOM() again when data changes.

Does the content change in response to user interaction or external events,
and you want structured state management?
  => Level 2. Use o.state + o.render + bw.update().
```

---

## 6. Events and Communication

### Event handlers — use onclick, not o.mounted

> **Warning: Never attach event handlers in `o.mounted`.** When a stateful component re-renders (after `bw.update()`), the old DOM children are replaced. Any listeners attached via `addEventListener` in `o.mounted` are silently lost -- no error, no warning. The click handler simply stops working after the first state change. This is the most common mistake new bitwrench developers make.

```js
// CORRECT — onclick in attributes. Re-attached automatically on every render.
bw.makeButton({
  text: 'Save',
  onclick: function() { save(); }
})

// CORRECT — inline in TACO
{ t: 'button', a: { onclick: function() { save(); } }, c: 'Save' }

// WRONG — handler silently lost when component re-renders
{ t: 'button', c: 'Save',
  o: { mounted: function(el) { el.addEventListener('click', save); } }
}
```

`onclick` (and `onchange`, `oninput`, `onsubmit`, etc.) in `a:` is the only safe event pattern for components that re-render. Bitwrench re-attaches attribute handlers on every render automatically.

**When is `o.mounted` appropriate?** Only for non-event setup that needs the actual DOM element reference — IntersectionObserver, ResizeObserver, third-party library initialization, measuring element dimensions. Never for click/input/change handlers.

### Cross-component communication — pub/sub

```js
// Publisher (cart module)
function addToCart(item) {
  cart.push(item);
  bw.pub('cart:updated', { count: cart.length });
}

// Subscriber (navbar badge) -- auto-cleans when element is removed
bw.sub('cart:updated', function(data) {
  navbarEl._bw_state.cartCount = data.count;
  bw.update(navbarEl);
}, navbarEl);
```

`bw.pub()` and `bw.sub()` are app-wide -- not scoped to the DOM tree. Any component can publish, any component can subscribe. Pass the element as the third argument to `bw.sub()` to tie the subscription lifetime to that element (auto-cleaned on `bw.cleanup()`).

---

## 7. Server-Driven UI (bwserve)

### The idea

Any server that can write JSON to an HTTP response can drive a bitwrench UI. The server sends TACO objects over SSE (Server-Sent Events). The browser renders them. No client-side application logic required.

```
Server (any language)          Browser
  |                              |
  |-- SSE: {replace, #app, taco} --> bw.apply() --> DOM update
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

Bitwrench includes a built-in client-side router. It maps URLs to view functions, supports hash mode and History API mode, and integrates with pub/sub.

### Basic SPA routing

```js
bw.router({
  target: '#app',
  routes: {
    '/':          function() { return { t: 'h1', c: 'Home' }; },
    '/about':     function() { return { t: 'h1', c: 'About' }; },
    '/users/:id': function(params) {
      return bw.makeCard({ title: 'User ' + params.id });
    },
    '*':          function() { return { t: 'h1', c: '404 Not Found' }; }
  }
});
```

The router reads the current URL, matches a route, calls the handler, and mounts the returned TACO into `#app`. It listens for URL changes and re-renders automatically.

### Programmatic navigation

```js
bw.navigate('/users/123');
bw.navigate('/about', { replace: true });  // replace history entry
```

### Navigation links

```js
// bw.link() returns a TACO <a> with onclick wired to bw.navigate()
bw.link('/about', 'About Us', { class: 'nav-item' })
```

### Route parameters and query strings

```js
// /users/42?tab=posts
'/users/:id': function(params) {
  params.id;            // '42'
  params._query.tab;    // 'posts'
}

// /docs/api/colors (catch-all)
'/docs/*': function(params) {
  params._rest;         // 'api/colors'
}
```

### Guards and hooks

```js
bw.router({
  target: '#app',
  routes: { ... },
  before: function(to, from) {
    if (to === '/admin' && !loggedIn) return '/login';  // redirect
    if (to === '/locked') return false;                  // block
  },
  after: function(to, from) {
    window.scrollTo(0, 0);
  }
});
```

### Pub/sub integration

Every route change publishes `bw:route`:

```js
bw.sub('bw:route', function(data) {
  // data.path, data.params, data.query, data.from
  navEl.bw.setActive(data.path);
}, navEl);
```

### Hash vs history mode

Hash mode (default): URLs like `#/users/123`. Works everywhere, no server config needed.

History mode: URLs like `/users/123`. Requires SPA fallback on the server.

```js
bw.router({ mode: 'history', base: '/app', target: '#app', routes: { ... } });
```

### When you don't need routing

Many bitwrench apps are single-page dashboards where tab-switching is enough:

```js
bw.DOM('#app', bw.makeTabs({
  tabs: [
    { label: 'Overview', content: makeOverview() },
    { label: 'Analytics', content: makeAnalytics() }
  ]
}));
```

### Server-side routing with bwserve

The client router complements bwserve's `app.page()`:

```js
app.page('/', function(client) { client.render('#app', makeHomePage()); });
app.page('/dashboard', function(client) { client.render('#app', makeDashboard()); });
```

See [Routing Guide](routing.md) for the full API reference, patterns, and examples.

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

`deriveShades()` and `derivePalette()` are the building blocks behind `makeStyles()`. You can use them directly for custom color systems.

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
bw.loadStyles();
bw.loadStyles({ primary: '#336699', secondary: '#cc6633' });

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

Level 1 -- you own the render loop. No stateful TACO needed.

### Reactive component with state

```js
bw.DOM('#contact', {
  t: 'div',
  o: {
    state: { statusMsg: '', showStatus: false },
    render: function(el) {
      var s = el._bw_state;
      bw.DOM(el, {
        t: 'div', c: [
          s.showStatus ? { t: 'div', c: s.statusMsg } : null,
          bw.makeForm({ children: [
            bw.makeFormGroup({ label: 'Email', input: bw.makeInput({ type: 'email', id: 'email' }) }),
            bw.makeFormGroup({ label: 'Message', input: bw.makeTextarea({ id: 'msg', rows: 4 }) }),
            bw.makeButton({ text: 'Send', type: 'submit', variant: 'primary' })
          ], onsubmit: function(e) {
            e.preventDefault();
            s.statusMsg = 'Sent!';
            s.showStatus = true;
            bw.update(el);
          }})
        ]
      });
    }
  }
});
```

### Cross-component coordination

```js
var cartBadge = {
  t: 'span',
  o: {
    state: { count: 0 },
    mounted: function(el) {
      bw.sub('cart:updated', function(d) {
        el._bw_state.count = d.count;
        bw.update(el);
      }, el);
    },
    render: function(el) {
      bw.DOM(el, { t: 'span', c: 'Cart (' + el._bw_state.count + ')' });
    }
  }
};

function addToCart(item) {
  cart.push(item);
  bw.pub('cart:updated', { count: cart.length, items: cart });
}
```

### Theme + custom CSS

```js
var theme = bw.makeStyles({ primary: '#336699', secondary: '#cc6633' });
bw.applyStyles(theme);
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
// Add a toast container to your page layout (once)
bw.DOM('#app', [
  { t: 'div', a: { id: 'toast-container',
      style: 'position:fixed;top:1rem;right:1rem;z-index:9999' } },
  // ... rest of your page
]);

// Show a toast by appending to the container
function showToast(message, variant) {
  var toastId = bw.uuid('toast');
  var toast = {
    t: 'div', a: { class: toastId, style: 'min-width:280px;margin-bottom:0.5rem' },
    c: bw.makeAlert({ content: message, variant: variant || 'info', dismissible: true })
  };
  var container = bw.$('#toast-container')[0];
  if (container) {
    container.appendChild(bw.createDOM(toast));
    setTimeout(function() {
      var el = bw.$('.' + toastId)[0];
      if (el) { bw.cleanup(el); el.remove(); }
    }, 3500);
  }
}
showToast('Item added to cart', 'success');
```

The toast container is part of the TACO tree. Individual toasts append into it and auto-remove after a delay. `bw.cleanup()` ensures any lifecycle hooks are properly torn down.

### Dashboard card — theme tokens + bw.s() + responsive + component

This compact example combines the key patterns: theme palette tokens (no hardcoded hex), `bw.s()` for inline style composition, `bw.responsive()` for breakpoints, and Level 1 re-rendering for live-updating stat cards.

```js
var theme = bw.makeStyles({ primary: '#1e40af', secondary: '#059669' });
bw.applyStyles(theme);
var P = theme.palette;

// Responsive grid — base stacks, md goes 2-col, lg goes 4-col
bw.injectCSS(bw.css({
  '.stat-grid': { display: 'grid', gap: '1rem', marginBottom: '1.5rem' }
}));
bw.injectCSS(bw.responsive('.stat-grid', {
  base: { gridTemplateColumns: '1fr' },
  md:   { gridTemplateColumns: 'repeat(2, 1fr)' },
  lg:   { gridTemplateColumns: 'repeat(4, 1fr)' }
}));

// Stat cards — palette tokens, not hex literals
var metrics = { users: 2847, revenue: 48920, orders: 384, rate: 3.2 };

function renderStats() {
  bw.DOM('#stats', { t: 'div', a: { class: 'stat-grid' }, c: [
    bw.makeStatCard({ value: metrics.users.toLocaleString(), label: 'Users', variant: 'primary' }),
    bw.makeStatCard({ value: '$' + metrics.revenue.toLocaleString(), label: 'Revenue', variant: 'success' }),
    bw.makeStatCard({ value: metrics.orders.toString(), label: 'Orders', variant: 'info' }),
    bw.makeStatCard({ value: metrics.rate + '%', label: 'Conversion' })
  ]});
}

// Layout uses bw.s() — no inline style strings
bw.DOM('#app', { t: 'div', c: [
  { t: 'div', a: { style: bw.s({ display: 'flex' }, { justifyContent: 'space-between' },
    { alignItems: 'center' }, { background: P.primary.base, color: '#fff', padding: '1.5rem 2rem' }) },
    c: [
      { t: 'h1', a: { style: bw.s({ margin: '0', fontSize: '1.5rem' }) }, c: 'Dashboard' },
      { t: 'span', a: { style: bw.s({ opacity: '0.8', fontSize: '0.85rem' }) }, c: 'Live' }
    ]
  },
  { t: 'div', a: { id: 'stats', style: bw.s({ padding: '1rem' }, { maxWidth: '1200px', margin: '0 auto' }) } }
]});

renderStats();
setInterval(function() {
  metrics.users += Math.round(Math.random() * 20 - 5);
  metrics.revenue += Math.round(Math.random() * 500 - 100);
  renderStats();
}, 3000);
```

Key things this example proves:
- **No hardcoded hex in layout** -- colors come from `theme.palette`
- **No inline style strings** — `bw.s({ display: 'flex' }, { padding: '1rem' }, ...)` composes style objects
- **Responsive without media queries in HTML** — `bw.responsive()` generates `@media` CSS
- **Re-render is just calling `bw.DOM()` again** — Level 1, no framework magic

---

## 11. What Bitwrench Doesn't Do

| Feature | Why not | What to use instead |
|---------|---------|-------------------|
| TypeScript types | Ships as UMD/ESM, works everywhere | Community .d.ts welcome, JSDoc in source |
| Virtual DOM | Targeted patches via UUID refs are sufficient | `bw.patch()`, `o.render` + `bw.update()` |
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
| `bw.h(tag, attrs, c, o)` | TACO constructor — returns plain `{t,a,c,o}` from positional args |
| `bw.raw(str)` | Mark string as pre-escaped HTML |

### CSS

| Function | What it does |
|----------|-------------|
| `bw.css(rules)` | JS object to CSS string (supports `@media`, `@keyframes` recursively) |
| `bw.injectCSS(css)` | Insert CSS string into document |
| `bw.s(...styles)` | Merge style objects into a style string |
| `bw.responsive(sel, bp)` | Generate responsive `@media` CSS from breakpoint object |
| `bw.loadStyles()` | Load built-in structural CSS |
| `bw.makeStyles(cfg)` | Generate styled CSS from seed colors (returns styles object) |
| `bw.applyStyles(styles)` | Inject generated styles' CSS into the document |
| `bw.loadStyles(cfg)` | Generate and apply styles in one call |
| `bw.toggleStyles()` | Switch between primary and alternate palettes |
| `bw.clearStyles()` | Remove injected styles |

### State (Level 2)

| Function | What it does |
|----------|-------------|
| `o.state` | Initial state object (copied to `el._bw_state`) |
| `o.render(el, state)` | Render function called on mount and `bw.update()` |
| `bw.update(el)` | Re-invoke `el._bw_render(el, el._bw_state)` |
| `bw.patch(uuid, content)` | Update a single UUID-addressed element |
| `bw.cleanup(el)` | Run unmount hooks, clear subscriptions |

### Communication

| Function | What it does |
|----------|-------------|
| `bw.pub(topic, data)` | Publish to all subscribers |
| `bw.sub(topic, fn)` | Subscribe (returns unsub function) |
| `bw.sub(topic, fn, owner)` | Subscribe with auto-cleanup when owner is removed |
| `bw.message(target, action, data)` | Dispatch to `el.bw[action](data)` by id, UUID, or selector |

### Routing

| Function | What it does |
|----------|-------------|
| `bw.router(config)` | Create and start a client-side router |
| `bw.navigate(path, opts)` | Programmatic navigation (delegates to active router) |
| `bw.link(path, content, attrs)` | Returns TACO `<a>` with navigation wired |

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
| `bw.h(tag, attrs, c, o)` | TACO constructor (positional args → `{t,a,c,o}`) |
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

## Appendix: Framework Translation Table

How common UI operations map across frameworks. Each cell is the idiomatic one-liner for that framework.

| Operation | What it is | React | Vue 3 | Vanilla JS | Svelte 5 | Solid | Bitwrench |
|-----------|-----------|-------|-------|------------|----------|-------|-----------|
| **Render element** | Create and display a UI element | `<div className="card">Hi</div>` | `<div class="card">Hi</div>` | `el.innerHTML = '<div>Hi</div>'` | `<div class="card">Hi</div>` | `<div class="card">Hi</div>` | `bw.DOM('#x', {t:'div', a:{class:'card'}, c:'Hi'})` |
| **Update text** | Change text content after render | `setText('new')` via `useState` | `msg.value = 'new'` | `el.textContent = 'new'` | `msg = 'new'` | `setMsg('new')` | `el._bw_state.msg = 'new'; bw.update(el)` or `bw.patch(id, 'new')` |
| **Conditional render** | Show/hide based on state | `{show && <Comp/>}` | `v-if="show"` | `if (show) el.style.display = ''` | `{#if show}<Comp/>{/if}` | `<Show when={show}><Comp/></Show>` | `show ? taco : null` in `c:` array |
| **List rendering** | Render array of items | `{items.map(i => <Li key={i.id}/>)}` | `v-for="i in items" :key="i.id"` | `el.innerHTML = items.map(...)` | `{#each items as i (i.id)}` | `<For each={items}>{i => ...}</For>` | `c: items.map(function(i) { return {t:'li', c:i.name} })` |
| **Event handler** | Attach click/input handler | `onClick={handler}` | `@click="handler"` | `el.addEventListener('click', fn)` | `onclick={handler}` | `onClick={handler}` | `a: { onclick: fn }` |
| **State declaration** | Declare reactive state | `const [x, setX] = useState(0)` | `const x = ref(0)` | `let x = 0` | `let x = $state(0)` | `const [x, setX] = createSignal(0)` | `o: { state: { x: 0 } }` |
| **State update** | Change state and trigger re-render | `setX(42)` | `x.value = 42` | `x = 42; render()` | `x = 42` | `setX(42)` | `el._bw_state.x = 42; bw.update(el)` |
| **Computed / derived** | Derive value from state | `useMemo(() => x * 2, [x])` | `computed(() => x.value * 2)` | `function get() { return x * 2; }` | `let d = $derived(x * 2)` | `const d = () => x() * 2` | `c: '${x}'` with Tier 2: `'${x * 2}'` |
| **Side effect** | Run code on mount/change | `useEffect(() => {...}, [])` | `onMounted(() => {...})` | `window.addEventListener('load', fn)` | `$effect(() => {...})` | `onMount(() => {...})` | `o: { mounted: function(el) {...} }` |
| **Cleanup on unmount** | Tear down timers/listeners | `useEffect return cleanup` | `onUnmounted(() => {...})` | manual | `return () => {...}` in `$effect` | `onCleanup(() => {...})` | `o: { unmount: fn }` or `bw.cleanup(el)` |
| **Style inline** | Apply inline styles | `style={{color: 'red'}}` | `:style="{color: 'red'}"` | `el.style.color = 'red'` | `style="color:red"` | `style={{color: 'red'}}` | `a: { style: bw.s({ color: 'red' }) }` |
| **Style composition** | Compose/merge styles | `{...base, ...override}` | `[baseStyle, overrideStyle]` | `Object.assign({}, base, over)` | `{...base, ...override}` | `{...base, ...override}` | `bw.s({ display: 'flex' }, { padding: '1rem' }, { color: accent })` |
| **CSS class conditional** | Toggle classes | `className={active ? 'on' : ''}` | `:class="{on: active}"` | `el.classList.toggle('on')` | `class:on={active}` | `classList={{on: active()}}` | `a: { class: 'btn ' + (active ? 'on' : '') }` |
| **Generate stylesheet** | Create CSS rules in JS | styled-components / emotion | `<style scoped>` | `style.textContent = css` | `<style>` block | `css\`...\`` | `bw.injectCSS(bw.css({ '.card': { padding: '1rem' } }))` |
| **Responsive styles** | Breakpoint-based CSS | media query in CSS/styled | `@media` in `<style>` | `@media` in CSS file | `@media` in `<style>` | `@media` in CSS | `bw.responsive('.grid', { md: { columns: '1fr 1fr' } })` |
| **Animation** | CSS keyframe animation | `@keyframes` in CSS file | `@keyframes` in `<style>` | `@keyframes` in CSS | `animate:fn` or CSS | CSS or WAAPI | `bw.css({ '@keyframes fade': { '0%': {opacity:'0'}, '100%': {opacity:'1'} } })` |
| **Raw HTML** | Render unescaped HTML | `dangerouslySetInnerHTML` | `v-html="str"` | `el.innerHTML = str` | `{@html str}` | `innerHTML={str}` | `bw.raw(str)` in `c:` |
| **Cross-component events** | Decouple communication | Context + useReducer / Zustand | provide/inject or Pinia | CustomEvent / EventTarget | stores | Context or signals | `bw.pub(topic, data)` / `bw.sub(topic, fn)` |
| **Form input binding** | Read form values | `value={x} onChange={...}` | `v-model="x"` | `input.value` | `bind:value={x}` | `value={x()} onInput={...}` | `bw.$('#id')[0].value` or `bw.makeInput({oninput:fn})` |
| **Theme / design tokens** | Apply consistent theming | ThemeProvider / CSS vars | CSS vars / provide | CSS custom properties | CSS vars | CSS vars / createContext | `bw.loadStyles({ primary: '#hex' })` or `bw.makeStyles(cfg)` => `theme.palette` |
| **Build step required** | Required toolchain | Yes (Babel/Vite/webpack) | Yes (Vite or Vue CLI) | No | Yes (Svelte compiler) | Yes (Vite/Babel) | **No** — open the HTML file |
| **Bundle size** | Shipped JS size | ~45KB (React + ReactDOM) | ~33KB (Vue 3) | 0KB | ~2KB (runtime) | ~7KB | **39KB** (bitwrench UMD gzipped, includes 50+ components + CSS gen) |

---

*Bitwrench is maintained by [Manu Chatterjee](https://github.com/deftio) (deftio). BSD-2-Clause license.*
