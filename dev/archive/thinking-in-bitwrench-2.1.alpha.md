# Thinking in Bitwrench

## Table of Contents

1. [The Problem and the Idea](#1-the-problem-and-the-idea)
2. [TACO to HTML String](#2-taco-to-html-string)
3. [TACO to Live DOM](#3-taco-to-live-dom)
4. [JavaScript Makes TACOs Composable](#4-javascript-makes-tacos-composable)
5. [Styling Grows Naturally](#5-styling-grows-naturally)
6. [Events and Behavior](#6-events-and-behavior)
7. [Lifecycle: `o:` Options](#7-lifecycle-o-options)
8. [Server-Driven UI (bwserve)](#8-server-driven-ui-bwserve)
9. [BCCL: Ready-Made Components](#9-bccl-ready-made-components)
10. [Routing, Utilities, Advanced](#10-routing-utilities-advanced)
11. [What Bitwrench Doesn't Do](#11-what-bitwrench-doesnt-do)
12. [Quick Reference](#12-quick-reference)
- [Framework Translation Table](#appendix-framework-translation-table)

**Related docs:** [Component Cheat Sheet](component-cheatsheet.md) | [State Management](state-management.md) | [Component Library](component-library.md) | [LLM Guide](llm-bitwrench-guide.md)

---

## 1. The Problem and the Idea

Building web UIs with raw HTML, CSS, and JavaScript works -- but it is painful. HTML is verbose. Styling the same element across a page means copying CSS rules or managing class hierarchies. Adding interactivity means wiring up event listeners, tracking state in variables, and manually updating the DOM when things change. The more complex the UI, the more copy-paste, the more boilerplate, the more places things can go wrong.

Different paradigms emerged to manage this complexity:

- **Markup generation**: JSX (React), templates (Vue, Svelte, Angular) -- describe UI declaratively, let a compiler or runtime translate it to DOM operations.
- **Styling**: Sass and Less added variables and mixins. Tailwind invented utility classes. CSS-in-JS libraries generate styles at runtime.
- **State management**: React hooks, Vue reactivity, Svelte stores, Redux, Zustand -- track application state and automatically re-render when it changes.
- **Build tooling**: Babel, webpack, Vite, esbuild -- transpile, bundle, tree-shake, hot-reload. Required infrastructure to connect the pieces.

Each of these solves a real problem. But each also adds a layer -- a new syntax, a new tool, a new abstraction to learn, configure, and maintain.

Bitwrench takes a different approach. Instead of adding layers, it leans into what the browser already provides -- the DOM for structure, CSS for styling, JavaScript for behavior -- and uses the JavaScript language itself to manage all three concerns.

The mechanism is a plain JavaScript object called a **TACO**: `{t, a, c, o}` -- Tag, Attributes, Content, Options. A TACO describes a UI element the same way HTML does, but because it is a JavaScript object, you get the full language at every point: variables, functions, loops, conditionals, composition. No special syntax. No compiler. No build step.

> **"If you know JavaScript, you already know bitwrench. Everything else is just learning the shape of the objects."**

This document walks a single example forward -- from a static HTML string to a live, interactive, server-driven application -- one layer at a time.

---

## 2. TACO to HTML String

### From HTML to TACO

Every HTML element has a tag, attributes, and content. A TACO object mirrors this directly:

```html
<!-- HTML -->
<div class="greeting" id="hero">Hello world</div>
```

```js
// TACO -- the same element as a JavaScript object
{ t: 'div', a: { class: 'greeting', id: 'hero' }, c: 'Hello world' }
```

The mapping is direct: `t` is the tag name, `a` is an object of HTML attributes, `c` is the content. The function `bw.html()` converts this object to an HTML string:

```js
var greeting = { t: 'div', a: { class: 'greeting', id: 'hero' }, c: 'Hello world' };

bw.html(greeting);
// => '<div class="greeting" id="hero">Hello world</div>'
```

That is the entire concept. Everything else builds on it.

### Minimal cases

Every key is optional. These are all valid TACOs:

```js
{ t: 'br' }                                          // self-closing tag
{ t: 'h1', c: 'Hello' }                              // tag + text content
{ t: 'input', a: { type: 'email', required: true } } // tag + attributes, no content
{ t: 'div' }                                         // empty div
```

If `t` is omitted, it defaults to `'div'`.

### Nesting -- TACOs inside TACOs

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

Let's build something more substantial -- a page with a nav and a card:

```js
var page = { t: 'div', a: { class: 'page' }, c: [
    { t: 'nav', c: [
        { t: 'a', a: { href: '/' }, c: 'Home' },
        { t: 'a', a: { href: '/about' }, c: 'About' }
    ]},
    { t: 'section', a: { class: 'content' }, c: [
        { t: 'div', a: { class: 'card' }, c: [
            { t: 'h3', c: 'Welcome' },
            { t: 'p', c: 'This is a card inside a section inside a page.' },
            { t: 'button', c: 'Click me' }
        ]}
    ]}
]};

bw.html(page);
// => full HTML string with all nested tags
```

### Conditionals -- nulls are skipped

`null`, `undefined`, and `false` in content arrays are silently skipped. This makes conditional rendering natural:

```js
var showHeader = true;
var isAdmin = false;

var dashboard = { t: 'div', c: [
    showHeader ? { t: 'h1', c: 'Dashboard' } : null,
    { t: 'p', c: 'Always visible' },
    isAdmin ? { t: 'a', c: 'Admin Panel' } : null
]};

bw.html(dashboard);
// => '<div><h1>Dashboard</h1><p>Always visible</p></div>'
// The admin link is omitted entirely.
```

### Arrays and .map() -- lists from data

```js
var items = ['Apples', 'Bananas', 'Cherries'];

var list = { t: 'ul', c: items.map(function(item) {
    return { t: 'li', c: item };
})};

bw.html(list);
// => '<ul><li>Apples</li><li>Bananas</li><li>Cherries</li></ul>'
```

No `v-for`, no `{#each}`, no special syntax. Just `.map()`.

### The TACO shape: `{t, a, c, o}`

You have seen `t`, `a`, and `c`. There is a fourth key -- `o` (options) -- for lifecycle hooks, component state, and behavior. We will cover it in Section 7. For now, know the full shape:

| Key | Purpose | Goes to HTML? |
|-----|---------|---------------|
| `t` | Tag name | Yes |
| `a` | HTML attributes | Yes |
| `c` | Content (text, TACOs, arrays) | Yes |
| `o` | Options (state, lifecycle, handles) | No -- bitwrench only |

---

## 3. TACO to Live DOM

### bw.mount() -- the primary path

`bw.html()` produces strings. For a live page, you need DOM elements. `bw.mount()` takes a CSS selector and a TACO, and renders the TACO into that element:

```html
<div id="app"></div>
<script>
bw.mount('#app', { t: 'h1', c: 'Hello from bitwrench' });
// The #app div now contains: <h1>Hello from bitwrench</h1>
</script>
```

`bw.mount()` returns the root element it created. This is the most common way to render UI.

Let's mount the page we built in Section 2:

```js
var page = { t: 'div', a: { class: 'page' }, c: [
    { t: 'nav', c: [
        { t: 'a', a: { href: '/' }, c: 'Home' },
        { t: 'a', a: { href: '/about' }, c: 'About' }
    ]},
    { t: 'section', c: [
        { t: 'h3', c: 'Welcome' },
        { t: 'p', c: 'Live in the browser.' }
    ]}
]};

bw.mount('#app', page);
```

### bw.create() -- detached elements

Sometimes you need a DOM element before inserting it. `bw.create()` returns a detached DOM node:

```js
var el = bw.create({ t: 'div', c: 'Not in the page yet' });
// el is an HTMLDivElement, but it is not attached to the document.
// You can inspect it, modify it, then insert it manually.
// Note: this low-level DOM call is what bw.mount() does for you automatically.
// In practice, prefer bw.mount('#target', taco) instead of manual insertion.
bw.el('#target').appendChild(el);
```

Use `bw.create()` when you need to manipulate the element before it goes into the page. For most cases, `bw.mount()` is simpler and handles lifecycle automatically.

### bw.DOM() and bw.el()

`bw.DOM()` is an exact alias for `bw.mount()`. Use whichever reads better in context.

`bw.el()` is a Swiss-army resolver. Given a CSS selector, it finds the element and optionally applies content:

```js
bw.el('#title');                        // find element
bw.el('#title', 'New text');            // set text content
bw.el('#app', { t: 'h1', c: 'Hi' });   // mount a TACO
bw.el('.card', function(el) {           // apply a function
    el.style.opacity = '0.5';
});
```

### Three output modes, one input

| Function | Returns | Use when |
|----------|---------|----------|
| `bw.html(taco)` | HTML string | SSR, Node.js scripts, email templates |
| `bw.create(taco)` | Detached DOM element | Need to manipulate before inserting |
| `bw.mount(sel, taco)` | Mounted DOM element | Most common -- render into the page |

The TACO is data. The rendering step is separate. You decide when and how it becomes real.

---

## 4. JavaScript Makes TACOs Composable

Because a TACO is a JavaScript object literal, every field is a JavaScript expression. This is the most important thing to understand about bitwrench.

### Functions are your components

A function that returns a TACO is a component. No class, no decorator, no registration:

```js
function greeting(name) {
    return { t: 'h2', c: 'Hello, ' + name + '!' };
}

bw.mount('#app', { t: 'div', c: [
    greeting('Alice'),
    greeting('Bob')
]});
```

### Component factory pattern

Build reusable components as factory functions with options:

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

bw.mount('#app', { t: 'div', c: [
    colorCard('Warning', 'Disk space low', '#e67e22'),
    colorCard('Success', 'Backup complete', '#27ae60'),
    colorCard('Info', '3 updates available', '#3498db')
]});
```

### .map() for lists

Render arrays of data using `.map()`:

```js
var users = [
    { name: 'Alice', role: 'admin' },
    { name: 'Bob', role: 'user' },
    { name: 'Carol', role: 'user' }
];

bw.mount('#app', { t: 'table', c: [
    { t: 'thead', c: { t: 'tr', c: [
        { t: 'th', c: 'Name' }, { t: 'th', c: 'Role' }
    ]}},
    { t: 'tbody', c: users.map(function(u) {
        return { t: 'tr', c: [
            { t: 'td', c: u.name },
            { t: 'td', c: u.role }
        ]};
    })}
]});
```

### Conditionals -- three ways

```js
// Ternary (inline)
{ t: 'div', c: loggedIn ? 'Welcome back' : 'Please sign in' }

// null filtering (in arrays)
{ t: 'nav', c: [
    { t: 'a', c: 'Home' },
    isAdmin ? { t: 'a', c: 'Admin' } : null,
    { t: 'a', c: 'About' }
]}

// IIFE for complex logic
{ t: 'div', c: (function() {
    if (status === 'loading') return { t: 'span', c: 'Loading...' };
    if (status === 'error') return { t: 'span', a: { class: 'error' }, c: errorMsg };
    return results.map(function(r) { return { t: 'li', c: r.name }; });
  })()
}
```

### Composing larger pages

Functions compose into full page layouts:

```js
function makeHeader(title) {
    return { t: 'header', c: { t: 'h1', c: title } };
}

function makeFooter() {
    return { t: 'footer', c: '(c) 2026' };
}

bw.mount('#app', { t: 'div', c: [
    makeHeader('My App'),
    { t: 'main', c: users.map(function(u) {
        return colorCard(u.name, u.role, u.role === 'admin' ? '#e67e22' : '#3498db');
    })},
    makeFooter()
]});
```

No template language needed. JavaScript already has functions (components), arrays (children), and `.map()` (iteration). TACO gives these a shape that maps to the DOM.

---

## 5. Styling Grows Naturally

### Start simple -- class and style attributes

The `style` and `class` attributes in a TACO work exactly like their HTML counterparts:

```js
bw.mount('#app', { t: 'div',
    a: { class: 'card', style: 'padding:1.5rem; background:#f5f5f5; border-radius:12px' },
    c: 'A styled card'
});
```

Put the style in a variable and reuse it:

```js
var cardStyle = 'padding:1.5rem; background:#f5f5f5; border-radius:12px';

bw.mount('#app', { t: 'div', c: [
    { t: 'div', a: { style: cardStyle }, c: 'Card one' },
    { t: 'div', a: { style: cardStyle }, c: 'Card two' }
]});
```

Change `cardStyle` once, and the next time your render function runs, both cards reflect the update. No preprocessor needed.

### bw.s() -- merge style objects

When inline styles get complex, string concatenation becomes fragile. `bw.s()` merges style objects into a style string:

```js
var flex = { display: 'flex', alignItems: 'center', gap: '1rem' };
var padded = { padding: '1rem' };

bw.mount('#app', { t: 'div', a: { style: bw.s(flex, padded) }, c: [
    { t: 'img', a: { src: 'avatar.png', style: bw.s({ borderRadius: '50%', width: '40px' }) } },
    { t: 'span', c: 'Alice' }
]});
```

`bw.s()` skips `null` and `undefined` arguments, so conditional composition works cleanly:

```js
{ t: 'div', a: {
    style: bw.s(
        { padding: '1rem' },
        isActive ? { fontWeight: '700' } : null,
        { color: accent }
    )
}, c: 'Status' }
```

### bw.css() and bw.injectCSS() -- generate stylesheets

When you need pseudo-classes, media queries, or reusable class names, generate CSS from JavaScript objects:

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

`bw.css()` converts a JavaScript object to a CSS string. CamelCase properties (`borderRadius`) auto-convert to kebab-case (`border-radius`). `bw.injectCSS()` inserts the result into the document.

### CSS variables are just JS variables

```js
var brand  = '#336699';
var radius = '12px';

bw.injectCSS(bw.css({
    '.card':  { borderRadius: radius, borderColor: brand },
    '.badge': { borderRadius: radius, background: brand, color: '#fff' },
    '.btn':   { borderRadius: radius, background: brand }
}));
```

Change `brand` once and re-run `bw.injectCSS(bw.css(...))` -- every rule that references it updates. No build step needed to generate the CSS; just call the functions again.

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

This is Sass mixins without Sass -- and more powerful, because the function can do arbitrary computation.

### bw.makeStyles() and bw.applyStyles() -- full design systems

Generate a complete design system from two seed colors:

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

`bw.loadStyles()` is a shorthand that generates and applies in one call:

```js
bw.loadStyles({ primary: '#336699', secondary: '#cc6633' });
// With no arguments, loads structural CSS only (no colors)
bw.loadStyles();
```

### @keyframes and at-rules

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
    }
}));
```

### The styling ladder

| Need | Tool | Example |
|------|------|---------|
| One-off inline style | `a: { style: '...' }` | Quick prototyping |
| Composed inline styles | `bw.s(obj1, obj2)` | Reusable style objects |
| Class-based CSS | `bw.css()` + `bw.injectCSS()` | Pseudo-classes, media queries |
| Full design system | `bw.makeStyles()` + `bw.applyStyles()` | Consistent theming from seed colors |

Start at the top. Move down when you need more power. Each level builds on the one before.

---

## 6. Events and Behavior

### Inline event handlers

Event handlers go in `a:` as function values:

```js
bw.mount('#app', {
    t: 'button',
    a: { onclick: function() { alert('Clicked!'); } },
    c: 'Click me'
});
```

All standard DOM events work: `onclick`, `onchange`, `oninput`, `onsubmit`, `onkeydown`, etc.

### Re-rendering on interaction

Combine event handlers with `bw.mount()` to build interactive UIs without any state framework:

```js
var filter = 'all';
var items = [
    { name: 'Widget A', type: 'widget' },
    { name: 'Gadget B', type: 'gadget' },
    { name: 'Widget C', type: 'widget' }
];

function renderApp() {
    var filtered = filter === 'all'
        ? items
        : items.filter(function(i) { return i.type === filter; });

    bw.mount('#app', { t: 'div', c: [
        { t: 'div', c: ['all', 'widget', 'gadget'].map(function(f) {
            return {
                t: 'button',
                a: {
                    onclick: function() { filter = f; renderApp(); },
                    style: 'margin:0.25rem; font-weight:' + (filter === f ? '700' : '400')
                },
                c: f
            };
        })},
        { t: 'ul', c: filtered.map(function(i) {
            return { t: 'li', c: i.name };
        })}
    ]});
}

renderApp();
```

This is the simplest interactive pattern: a render function that calls `bw.mount()`. When data changes, call the function again. No framework magic.

### Path L (local) vs Path S (server)

There are two event paths:

**Path L -- local.** The handler runs in the browser. This is what `onclick: function() { ... }` does. The function closes over local variables and can call `bw.mount()`, `bw.refresh()` (covered below in [Lifecycle](#7-lifecycle-o-options)), or any other API.

**Path S -- server.** The handler sends an action name to the server. This uses `bw_act_*` CSS classes:

```js
{ t: 'button', a: { class: 'bw_act_save' }, c: 'Save' }
```

When the user clicks a `bw_act_save` element, the browser POSTs `{ action: 'save' }` to the server via the bwserve connection. No JavaScript handler needed on the client -- the server handles it.

Path L is for client-only apps. Path S is for server-driven apps (covered in Section 8). The TACO is the same shape either way.

### Handling form data

`bw.$()` returns an array of matching DOM elements (like `querySelectorAll` but always an array), so we use `[0]` to get the first match:

```js
bw.mount('#app', {
    t: 'form',
    a: { onsubmit: function(e) {
        e.preventDefault();
        var name = bw.$('#name-input')[0].value;
        var email = bw.$('#email-input')[0].value;
        console.log('Submitted:', name, email);
    }},
    c: [
        { t: 'input', a: { id: 'name-input', type: 'text', placeholder: 'Name' } },
        { t: 'input', a: { id: 'email-input', type: 'email', placeholder: 'Email' } },
        { t: 'button', a: { type: 'submit' }, c: 'Submit' }
    ]
});
```

---

## 7. Lifecycle: `o:` Options

The `o:` key is where non-HTML concerns live. It was separated from `a:` because `a:` compiles directly to HTML attributes -- library metadata should not leak into the DOM.

### o.state -- component state

```js
bw.mount('#app', {
    t: 'div',
    o: {
        state: { count: 0 },
        render: function(el) {
            var s = el._bw_state;
            bw.mount(el, { t: 'div', c: [
                { t: 'span', c: 'Count: ' + s.count },
                { t: 'button', a: { onclick: function() {
                    s.count++;
                    bw.refresh(el);
                }}, c: '+1' },
                { t: 'button', a: { onclick: function() {
                    s.count = 0;
                    bw.refresh(el);
                }}, c: 'Reset' }
            ]});
        }
    }
});
```

`o.state` is copied to `el._bw_state` at creation time. `o.render` is stored on `el._bw_render` and called on mount and on every `bw.refresh(el)`. When state changes, mutate `el._bw_state` directly and call `bw.refresh(el)` to re-render.

### o.mounted and o.unmount -- lifecycle hooks

```js
{
    t: 'div', a: { class: 'sensor-display' },
    o: {
        mounted: function(el) {
            // Called after the element enters the DOM.
            // Good for: observers, timers, third-party library init.
            el._resizeObs = new ResizeObserver(function(entries) {
                console.log('Resized:', entries[0].contentRect.width);
            });
            el._resizeObs.observe(el);
        },
        unmount: function(el) {
            // Called before the element is removed from the DOM.
            // Good for: cleanup of observers, timers, connections.
            if (el._resizeObs) el._resizeObs.disconnect();
        }
    }
}
```

Use `mounted` for setup that needs the real DOM element -- observers, measuring dimensions, initializing third-party libraries. Use `unmount` to clean up.

**Important: never attach event handlers in `o.mounted`.** When a component re-renders (after `bw.refresh()`), old DOM children are replaced. Listeners attached via `addEventListener` in `o.mounted` are silently lost. Use `onclick` in `a:` instead -- it is re-attached automatically on every render:

```js
// CORRECT -- handler in attributes, survives re-renders
{ t: 'button', a: { onclick: function() { save(); } }, c: 'Save' }

// WRONG -- handler lost after first re-render
{ t: 'button', c: 'Save',
  o: { mounted: function(el) { el.addEventListener('click', save); } }
}
```

### o.handle -- component methods

`o.handle` attaches named methods to `el.bw`. These are the cheap update path -- surgical DOM updates without tearing down and rebuilding:

```js
var counter = {
    t: 'div', c: [
        { t: 'span', a: { class: 'count' }, c: '0' },
        { t: 'button', a: { onclick: function() {
            bw.el('#app').bw.increment();
        }}, c: '+' }
    ],
    o: {
        handle: {
            increment: function(el) {
                var span = el.querySelector('.count');
                span.textContent = String(Number(span.textContent) + 1);
            },
            reset: function(el) {
                el.querySelector('.count').textContent = '0';
            }
        }
    }
};

var el = bw.mount('#app', counter);
el.bw.increment();   // updates count without re-rendering the tree
el.bw.reset();       // same -- surgical, O(1)
```

### o.slots -- auto-generated setters and getters

`o.slots` maps names to CSS selectors. Bitwrench auto-generates `el.bw.setName()` and `el.bw.getName()` for each:

```js
var card = {
    t: 'div', a: { class: 'card' }, c: [
        { t: 'h3', a: { class: 'card-title' }, c: 'Initial Title' },
        { t: 'div', a: { class: 'card-body' }, c: 'Initial content' }
    ],
    o: {
        slots: {
            title: '.card-title',
            body: '.card-body'
        }
    }
};

var el = bw.mount('#app', card);
el.bw.setTitle('Revenue');                  // update just the title
el.bw.setBody({ t: 'b', c: '$42,000' });   // accepts TACOs
el.bw.getTitle();                           // returns 'Revenue'
```

Slot setters update only the targeted element. Input focus, scroll position, and animation state in siblings are preserved -- this is the key advantage over `bw.refresh()`.

### Why o: is separate from a:

| Key | Compiles to HTML | Purpose |
|-----|-----------------|---------|
| `a:` | Yes | HTML attributes: class, id, style, onclick, data-*, href, src, etc. |
| `o:` | No | Bitwrench concerns: state, render, handle, slots, mounted, unmount |

If `o:` properties went in `a:`, they would appear as HTML attributes in the rendered output -- or worse, in `bw.html()` string output. The separation keeps the DOM clean and makes TACOs safe to serialize.

### The update cost spectrum

| Operation | Cost | What happens |
|-----------|------|-------------|
| `el.bw.method()` | Surgical | Component updates its own DOM |
| Slot setters (`el.bw.setTitle()`) | O(1) | Replaces content at a cached DOM target |
| `bw.message(ref, action, data)` | Dispatch | Calls `el.bw[action](data)` by selector |
| `bw.update(ref, data)` | Dispatch | Calls `el.bw.update(data)`, warns if missing |
| `bw.patch(id, content)` | Targeted | Updates a single element's content |
| `bw.replace(ref, taco)` | Element swap | Unmounts old, mounts new at same position |
| `bw.refresh(ref)` | Full rebuild | Unmounts children, re-renders from `o.render` |

Prefer methods at the top of this list. Use `bw.refresh()` only when you need a full re-render.

### Cross-component communication -- pub/sub

```js
// Publisher
function addToCart(item) {
    cart.push(item);
    bw.pub('cart:updated', { count: cart.length });
}

// Subscriber -- navEl is the element returned by bw.mount() for a nav component
// Auto-cleans when element is removed
bw.sub('cart:updated', function(data) {
    navEl._bw_state.cartCount = data.count;
    bw.refresh(navEl);
}, navEl);
```

`bw.pub()` and `bw.sub()` are app-wide. Pass the element as the third argument to `bw.sub()` to tie the subscription lifetime to that element.

---

## 8. Server-Driven UI (bwserve)

### Why TACOs cross a wire

A TACO without functions in `o:` is pure data -- it serializes to JSON. This means any server in any language can generate TACOs and send them to the browser for rendering. That is exactly what bwserve does.

```
Server (any language)           Browser
  |                               |
  |-- SSE: {replace, #app, taco} --> bw.apply() --> DOM update
  |-- SSE: {patch, #counter, "42"} -> targeted text update
  |-- SSE: {append, #log, taco} ---> new child added
  |                               |
  |<-- POST: {action: "click"} ---+   user clicks bw_act_*
```

### Initial UI delivery

```js
import bwserve from 'bitwrench/bwserve';

var app = bwserve.create({ port: 8080 });
app.page('/', function(client) {
    client.mount('#app', {
        t: 'div', c: [
            { t: 'h1', c: 'Hello from the server' },
            { t: 'p', a: { id: 'status' }, c: 'Connected.' },
            { t: 'button', a: { class: 'bw_act_greet' }, c: 'Say hello' }
        ]
    });
});
app.listen();
```

The browser receives one HTML shell page with bitwrench loaded. Everything after that arrives as JSON messages over SSE.

### Incremental updates

```js
client.patch('#status', { text: 'Processing...' });
client.append('#log', { t: 'div', c: 'Event at ' + new Date().toISOString() });
client.remove('#old-notification');
client.batch([
    { type: 'patch', ref: '#status', text: 'Done.', v: 1 },
    { type: 'remove', ref: '#spinner', v: 1 }
]);
```

### Client events with bw_act_*

When a user clicks a `bw_act_*` element, the browser POSTs the action name to the server:

```js
// Client-side TACO (no onclick handler needed)
{ t: 'button', a: { class: 'bw_act_greet' }, c: 'Say hello' }

// Server-side handler
client.on('greet', function(data) {
    client.patch('#status', { text: 'Hello, user!' });
});
```

The client never runs application logic -- it renders what the server sends and relays user actions back.

### Why this matters

- **Language-agnostic**: any server that writes SSE can drive the UI -- Python, Go, Rust, C, shell scripts.
- **LLM-native**: an AI emits TACO JSON directly -- orders of magnitude fewer tokens than HTML/JSX.
- **Embedded**: an ESP32 serves one HTML page with bitwrench, then pushes sensor data as patches.
- **Replaces Streamlit/Gradio**: same server-driven pattern, not locked to Python, full composition model.

---

## 9. BCCL: Ready-Made Components

BCCL (Bitwrench Common Component Library) is a set of factory functions that return TACO objects for common UI patterns. Think of it as Bootstrap, but instead of HTML templates you get JavaScript objects.

### Factories return TACOs, not DOM

```js
var card = bw.makeCard({ title: 'Users', content: '42 online' });
// card is { t:'div', a:{class:'bw_bccl_card'}, c:[...] }
// It is a plain TACO -- inspect it, modify it, nest it.

bw.mount('#app', { t: 'div', c: [
    bw.makeNavbar({ brand: 'My App', items: [
        { text: 'Home', href: '#' },
        { text: 'About', href: '#about' }
    ]}),
    { t: 'div', a: { class: 'content' }, c: [
        bw.makeAlert({ content: 'Welcome!', variant: 'success' }),
        card
    ]},
    bw.makeTable({ data: users, sortable: true })
]});
```

### Quick inventory

| Category | Components |
|----------|-----------|
| Layout | makeNavbar, makeContainer, makeRow, makeCol, makeStack, makeSection |
| Content | makeCard, makeAlert, makeBadge, makeStatCard, makeTimeline, makeHero |
| Forms | makeInput, makeSelect, makeTextarea, makeForm, makeFormGroup, makeSearchInput |
| Data | makeTable, makeTableFromArray, makeBarChart, makeProgress, makePagination |
| Interactive | makeButton, makeAccordion, makeTabs, makeModal, makeCarousel, makeTooltip, makeDropdown |

See `docs/component-library.md` for full signatures.

### Mix BCCL with hand-written TACOs

```js
bw.mount('#app', { t: 'div', c: [
    bw.makeCard({ title: 'Stats' }),
    { t: 'div', a: { style: 'padding:2rem' }, c: [
        { t: 'h3', c: 'Custom Section' },
        { t: 'p', c: 'Hand-written TACO next to a BCCL card.' }
    ]}
]});
```

### Modify BCCL output before rendering

Since BCCL returns plain objects, you can modify them:

```js
var card = bw.makeCard({ title: 'Users', content: '42 online' });
card.a.style = 'border-left:4px solid #336699';
card.c.push({ t: 'small', c: 'Updated 5m ago' });
bw.mount('#app', card);
```

### BCCL components include handles and slots

All BCCL factories wire up `o.handle` and/or `o.slots` automatically:

```js
var el = bw.mount('#app', bw.makeCard({ title: 'Stats', content: '0' }));
el.bw.setTitle('Revenue');
el.bw.setContent({ t: 'b', c: '$42k' });
```

See [Component Library](component-library.md) for the full method table per component.

### Three things to know

1. Every factory returns a TACO. The output is a plain `{t, a, c, o}` object.
2. There are no tricks. BCCL factories are regular functions. Anything they do, you can do by hand.
3. BCCL is optional. Use it for everything, use it selectively, or ignore it entirely.

---

## 10. Routing, Utilities, Advanced

### Client-side routing

Bitwrench includes a built-in client-side router:

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

// Programmatic navigation
bw.navigate('/users/123');

// Navigation links (returns TACO)
bw.link('/about', 'About Us', { class: 'nav-item' })
```

Route parameters (`/users/:id`), query strings (`params._query.tab`), catch-all routes (`/docs/*` with `params._rest`), guards (`before`/`after` hooks), and hash vs. history mode are all supported. See [Routing Guide](routing.md) for the full API.

### bw.derive() -- declared dataflow

`bw.derive()` recomputes a derived value when its input topics publish:

```js
bw.derive(['cart:updated', 'discount:changed'], function(data) {
    var total = data['cart:updated'].total * (1 - data['discount:changed'].rate);
    return { total: total };
}, 'order:total');

// Subscribes automatically; fires when either input publishes
bw.sub('order:total', function(data) {
    bw.el('#total', '$' + data.total.toFixed(2));
});
```

The dependency graph is explicit and written in source code -- not assembled by getter traps at runtime.

### Color functions

```js
bw.hexToHsl('#336699');              // [210, 50, 40]
bw.hslToHex([210, 50, 40]);         // '#336699'
bw.adjustLightness('#336699', 20);   // lighten by 20%
bw.mixColor('#336699', '#cc6633', 0.5); // blend two colors
bw.textOnColor('#336699');           // '#fff' (contrast-safe text color)
bw.deriveShades('#336699');          // { base, hover, active, light, darkText, border, focus, textOn }
bw.derivePalette({ primary: '#336699', secondary: '#cc6633' }); // full palette
```

### Utility functions

```js
bw.typeOf([1, 2, 3]);               // 'array' (enhanced typeof)
bw.uuid('widget');                   // 'bw_uuid_widget_a3f2c1' (unique ID)
bw.escapeHTML('<script>');           // '&lt;script&gt;'
bw.getURLParam('page', 'home');      // read ?page=... from URL
bw.loremIpsum(200);                  // 200 characters of placeholder text
bw.random(1, 100);                   // random integer
bw.mapScale(75, 0, 100, 0, 255);    // map between ranges (191.25)
bw.clip(150, 0, 100);               // clamp to range (100)
bw.naturalCompare('item2', 'item10'); // natural sort comparison
bw.parseJSONFlex("{ name: 'Alice' }"); // flexible JSON (unquoted keys, single quotes, r-prefix)
```

### Raw HTML -- bw.raw()

By default, bitwrench escapes all content to prevent XSS. When you need actual HTML inside a TACO, use `bw.raw()`:

```js
// Without bw.raw() -- <br> is escaped to visible text
{ t: 'h1', c: 'Line One<br>Line Two' }
// Renders: Line One&lt;br&gt;Line Two

// With bw.raw() -- HTML rendered as-is
{ t: 'h1', c: bw.raw('Line One<br>Line Two') }
// Renders: Line One (line break) Line Two
```

Never use `bw.raw()` on user-provided input.

### File I/O

```js
// Browser
bw.saveClientFile('report.txt', content);
bw.loadClientJSON(function(obj) { /* parsed JSON */ });

// Node.js
bw.loadLocalFile('config.json').then(function(data) { /* ... */ });
bw.saveLocalFile('output.txt', content);
```

---

## 11. What Bitwrench Doesn't Do

| Feature | Why not | What to use instead |
|---------|---------|-------------------|
| Virtual DOM | Targeted patches via component handles are sufficient | `el.bw.method()`, `bw.patch()`, `bw.refresh()` |
| CSS purging | You generate only what you use via `bw.css()` | N/A |
| SSR hydration | `bw.html()` for SSR, `bw.mount()` for client | Full page render via `bw.html()` in Node |
| Module bundling | No build step required | `<script>` tag, CDN, or ESM `import` |
| Reactive state tracking | Explicit updates are clearer and debuggable | `el.bw.method()`, `bw.refresh()`, pub/sub |
| TypeScript requirement | Ships `dist/bitwrench.d.ts` for optional TS support | See [TypeScript Usage Guide](bitwrench_typescript_usage.md) |

---

## 12. Quick Reference

### The lifecycle

```
define -> create -> mount -> live (updates) -> unmount -> removed
```

Each phase has one verb. Convenience verbs compose phase verbs -- they never reimplement them.

### Core rendering

| Function | What it does |
|----------|-------------|
| `bw.html(taco)` | TACO to HTML string |
| `bw.create(taco)` | TACO to detached, hydrated DOM element |
| `bw.mount(sel, taco)` | Mount TACO into existing element; returns root element |
| `bw.DOM(sel, taco)` | Alias for `bw.mount()` |
| `bw.el(sel, apply)` | Find element by selector; optionally apply content/function |
| `bw.h(tag, attrs, c, o)` | TACO constructor from positional args |
| `bw.raw(str)` | Mark string as pre-escaped HTML |

### Lifecycle verbs (atomic)

These are low-level lifecycle primitives. Most applications only need `bw.mount()`, `bw.refresh()`, and `bw.unmount()`.

| Function | What it does |
|----------|-------------|
| `bw.create(taco)` | Build hydrated, detached DOM from TACO |
| `bw.hydrate(el, taco)` | Wire lifecycle from TACO onto existing DOM node |
| `bw.mountTree(el)` | Register inserted subtree; fire `mounted` hooks |
| `bw.unmount(el)` | Tear down subtree lifecycle; fire `unmount` hooks |
| `bw.unmountChildren(el)` | Unmount descendants only; element untouched |
| `bw.detach(el)` | Remove from document, keep lifecycle intact (keep-alive) |

### Convenience verbs (compound)

| Function | What it does |
|----------|-------------|
| `bw.mount(sel, taco)` | = `unmountChildren` + `create` + insert + `mountTree` |
| `bw.append(target, taco)` | Add child without touching existing; returns new element |
| `bw.replace(ref, taco)` | Swap element at DOM position; returns new element |
| `bw.remove(ref)` | = `unmount` + `el.remove()` |
| `bw.refresh(ref)` | = `unmountChildren` + re-render + `mountTree` (the heavy path) |

### CSS

| Function | What it does |
|----------|-------------|
| `bw.css(rules)` | JS object to CSS string (supports `@media`, `@keyframes`) |
| `bw.injectCSS(css)` | Insert CSS string into document |
| `bw.s(...styles)` | Merge style objects into a style string |
| `bw.responsive(sel, bp)` | Generate responsive `@media` CSS from breakpoint object |
| `bw.loadStyles(cfg?)` | Generate + apply styles (no args = structural CSS only) |
| `bw.makeStyles(cfg)` | Generate styles from seed colors (returns styles object) |
| `bw.applyStyles(styles)` | Inject generated styles into document |
| `bw.clearStyles()` | Remove injected styles |

### State and updates

| Function | What it does |
|----------|-------------|
| `o.state` | Initial state object (copied to `el._bw_state`) |
| `o.render(el, state)` | Render function; called on mount and `bw.refresh()` |
| `bw.refresh(ref)` | Re-invoke render -- tears down and rebuilds children |
| `bw.update(ref, data)` | Dispatch to `el.bw.update(data)` -- never falls back to rebuild |
| `bw.patch(id, content)` | Update addressed element's content |

### Component handles

| Function | What it does |
|----------|-------------|
| `o.handle` | Object of methods attached to `el.bw` at create time |
| `o.slots` | `{name: '.selector'}` -- auto-generates `el.bw.setName()`/`getName()` |
| `bw.mount(sel, taco)` | Returns root element for `el.bw` access |
| `bw.message(target, action, data)` | Dispatch to `el.bw[action](data)` by selector |

### Communication

| Function | What it does |
|----------|-------------|
| `bw.pub(topic, data)` | Publish to all subscribers |
| `bw.sub(topic, fn, owner?)` | Subscribe (with optional auto-cleanup on unmount) |
| `bw.once(topic, fn, el?)` | One-shot subscribe |
| `bw.derive(inputs, fn, output)` | Declared dataflow between topics |

### Routing

| Function | What it does |
|----------|-------------|
| `bw.router(config)` | Create and start a client-side router |
| `bw.navigate(path, opts)` | Programmatic navigation |
| `bw.link(path, content, attrs)` | Returns TACO `<a>` with navigation wired |

### Color

| Function | What it does |
|----------|-------------|
| `bw.hexToHsl(hex)` | Hex to `[h, s, l]` |
| `bw.hslToHex(hsl)` | `[h, s, l]` to hex |
| `bw.deriveShades(hex)` | 8 shade variants from one color |
| `bw.derivePalette(cfg)` | Full palette from seed colors |
| `bw.textOnColor(hex)` | Contrast-safe text color |
| `bw.mixColor(a, b, ratio)` | Blend two colors |

### Utilities

| Function | What it does |
|----------|-------------|
| `bw.$('selector')` | querySelectorAll as array |
| `bw.el(sel, apply?)` | Find + optionally apply content/function |
| `bw.escapeHTML(str)` | Escape HTML special chars |
| `bw.uuid(prefix)` | Generate unique ID |
| `bw.typeOf(x)` | Enhanced typeof |
| `bw.getURLParam(key, def)` | Read URL query parameter |
| `bw.random(min, max)` | Random integer (or array) |
| `bw.loremIpsum(n)` | Placeholder text |
| `bw.mapScale(x, i0, i1, o0, o1)` | Map value between ranges |
| `bw.parseJSONFlex(str)` | Parse flexible JSON (unquoted keys, single quotes, r-prefix) |
| `bw.saveClientFile(name, data)` | Browser file download |
| `bw.loadClientJSON(cb)` | Browser file upload (JSON) |

---

## Appendix: Framework Translation Table

How common UI operations map across frameworks:

| Operation | React | Vue 3 | Bitwrench |
|-----------|-------|-------|-----------|
| Render element | `<div className="card">Hi</div>` | `<div class="card">Hi</div>` | `bw.mount('#x', {t:'div', a:{class:'card'}, c:'Hi'})` |
| Update text | `setText('new')` via `useState` | `msg.value = 'new'` | `el.bw.setContent('new')` or `bw.patch(id, 'new')` |
| Conditional | `{show && <Comp/>}` | `v-if="show"` | `show ? taco : null` in `c:` array |
| List render | `{items.map(i => <Li key={i.id}/>)}` | `v-for="i in items"` | `c: items.map(function(i) { return {t:'li', c:i.name} })` |
| Event handler | `onClick={handler}` | `@click="handler"` | `a: { onclick: fn }` |
| Declare state | `const [x, setX] = useState(0)` | `const x = ref(0)` | `o: { state: { x: 0 } }` |
| Update state | `setX(42)` | `x.value = 42` | `el._bw_state.x = 42; bw.refresh(el)` |
| Side effect | `useEffect(() => {...}, [])` | `onMounted(() => {...})` | `o: { mounted: function(el) {...} }` |
| Cleanup | `useEffect return cleanup` | `onUnmounted(() => {...})` | `o: { unmount: fn }` |
| Inline style | `style={{color: 'red'}}` | `:style="{color: 'red'}"` | `a: { style: bw.s({color:'red'}) }` |
| Generate CSS | styled-components / emotion | `<style scoped>` | `bw.injectCSS(bw.css({'.card': {padding:'1rem'}}))` |
| Raw HTML | `dangerouslySetInnerHTML` | `v-html="str"` | `bw.raw(str)` in `c:` |
| Cross-component | Context / Zustand | provide/inject / Pinia | `bw.pub(topic, data)` / `bw.sub(topic, fn)` |
| Theme tokens | ThemeProvider / CSS vars | CSS vars / provide | `bw.makeStyles(cfg)` => `theme.palette` |
| Build step? | Yes (Babel/Vite) | Yes (Vite/CLI) | **No** -- open the HTML file |

---

*Bitwrench is maintained by [Manu Chatterjee](https://github.com/deftio) (deftio). BSD-2-Clause license.*
