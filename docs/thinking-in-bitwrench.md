# Thinking in Bitwrench

## Table of Contents

1. [The Problem and the Idea](#1-the-problem-and-the-idea)
2. [TACO to HTML String](#2-taco-to-html-string)
3. [TACO to Live DOM](#3-taco-to-live-dom)
4. [JavaScript Makes TACOs Composable](#4-javascript-makes-tacos-composable)
5. [Styling Grows Naturally](#5-styling-grows-naturally)
6. [Events and Behavior](#6-events-and-behavior)
7. [Lifecycle: `o:` Options](#7-lifecycle-o-options)
8. [BCCL: Ready-Made Components](#8-bccl-ready-made-components)
9. [Routing, Utilities, Advanced](#9-routing-utilities-advanced)
10. [What Bitwrench Does Instead](#10-what-bitwrench-does-instead)
11. [Server-Driven UI and CLI](#11-server-driven-ui-and-cli)
12. [Quick Reference](#12-quick-reference)
- [Framework Translation Table](#appendix-framework-translation-table)
- [Postscript: Validation](#postscript-validation)

**Related docs:** [North Star Principles](bitwrench-northstar-principles.md) | [Component Cheat Sheet](component-cheatsheet.md) | [State Management](state-management.md) | [Component Library](component-library.md) | [LLM Guide](llm-bitwrench-guide.md)


## 1. The Problem and the Idea

Building web UIs with raw HTML, CSS, and JavaScript works -- but it is painful. HTML is verbose. Styling the same element across a page means copying CSS rules or managing class hierarchies. Adding interactivity means wiring up event listeners, tracking state in variables, and manually updating the DOM when things change. The more complex the UI, the more copy-paste, the more boilerplate, the more places things can go wrong.

Frameworks emerged to manage this -- React, Vue, Svelte for rendering; Sass, Tailwind for styling; Redux, Zustand for state -- each adding a new syntax, a new tool, a new layer. Each solves a real problem. But each also adds an abstraction to learn, configure, and maintain.

Bitwrench takes a different approach. Instead of adding layers, it leans into what the browser already provides -- the DOM for structure, CSS for styling, JavaScript for behavior -- and uses the JavaScript language itself to manage all three concerns.

The mechanism is a plain JavaScript object called a **TACO**: `{t, a, c, o}` -- Tag, Attributes, Content, Options. A `{taco}` describes a UI element the same way HTML does, but because it is a JavaScript object, you get the full language at every point: variables, functions, loops, conditionals, composition. No special syntax. No compiler. No build step.

> **"If you know JavaScript, you already know bitwrench. Everything else is just learning the shape of the objects -- and a small set of conventions for mounting, lifecycle, and updates that the rest of this document covers."**

This document walks a single example forward -- from a static HTML string to a live, interactive, server-driven application -- one layer at a time.


## 2. TACO to HTML String

### From HTML to TACO

Every HTML element has a tag, attributes, and content. A `{taco}` object mirrors this directly:

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

> **A note on syntax:** Examples in this document use `var` and `function()` to show that bitwrench requires no transpiler -- it runs in any JS environment as-is. In your own code, use `const`, `let`, and arrow functions freely.

Content strings are HTML-escaped by default. `c: '<b>bold</b>'` renders as visible text, not markup. When you need actual HTML, use `bw.raw()` (covered in Section 9).

We will use a **contact card** as a running example throughout this document, building it up one capability at a time. Here is the card as a `{taco}`:

```js
var card = {
    t: 'div', a: { class: 'card' }, c: [
        { t: 'h3', c: 'Alice' },
        { t: 'p', c: 'alice@example.com' }
    ]
};

bw.html(card);
// => '<div class="card"><h3>Alice</h3><p>alice@example.com</p></div>'
```

A tag, attributes, nested content -- the same shape as the greeting, just with children. We will mount this card to the DOM in Section 3, make it reusable in Section 4, style it in Section 5, and add interactivity in Section 6.

### Minimal cases

Every key is optional. These are all valid TACOs:

```js
{ t: 'br' }                                          // void element
{ t: 'h1', c: 'Hello' }                              // tag + text content
{ t: 'input', a: { type: 'email', required: true } } // tag + attributes, no content
{ t: 'div' }                                         // empty div
```

If `t` is omitted, it defaults to `'div'`.

### Nesting -- TACOs inside TACOs

Content (`c:`) can be a string, another `{taco}`, or an array of both:

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

If you prefer positional arguments: `bw.h('div', {class: 'card'}, 'Hello')` returns the same `{taco}` object. Use whichever is clearer in context.


## 3. TACO to Live DOM

We can generate HTML strings, but a live page needs DOM elements.

### bw.mount() -- the primary path

`bw.mount()` takes a CSS selector and a `{taco}`. It unmounts and removes the target's existing children, creates the new `{taco}` tree, inserts it as the target's content, and returns the newly created root element:

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

Continuing our contact card: mounting it is a one-liner.

```js
bw.mount('#app', {
    t: 'div', a: { class: 'card' }, c: [
        { t: 'h3', c: 'Alice' },
        { t: 'p', c: 'alice@example.com' }
    ]
});
// The #app div now contains a live card element in the DOM.
```

### bw.create() -- detached elements

Sometimes you need a DOM element before inserting it. `bw.create()` returns a detached DOM node:

```js
var el = bw.create({ t: 'div', c: 'Not in the page yet' });
// el is an HTMLDivElement, but it is not attached to the document.
// You can inspect it, modify it, then insert it manually.
// In practice, prefer bw.mount('#target', taco) instead of manual insertion.
```

Use `bw.create()` when you need to manipulate the element before it goes into the page. For most cases, `bw.mount()` is simpler and handles lifecycle automatically.

### bw.DOM() and bw.el()

`bw.DOM()` is an exact alias for `bw.mount()`. Use whichever reads better in context.

`bw.el()` resolves an element by selector and can optionally update or transform it:

```js
bw.el('#title');                        // find element
bw.el('#title', 'New text');            // set text content
bw.el('#app', { t: 'h1', c: 'Hi' });   // mount a {taco}
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

The `{taco}` is data. The rendering step is separate. You decide when and how it becomes real.


## 4. JavaScript Makes TACOs Composable

Mounting a single `{taco}` is useful, but real pages have many elements. Because `{taco}` objects are plain JavaScript, composition is natural -- every field is a JavaScript expression. This is the most important thing to understand about bitwrench.

### Functions are your components

A function that returns a `{taco}` is a component. No class, no decorator, no registration:

```js
function greeting(name) {
    return { t: 'h2', c: 'Hello, ' + name + '!' };
}

bw.mount('#app', { t: 'div', c: [
    greeting('Alice'),
    greeting('Bob')
]});
```

Continuing our card: make it a function, and it works for any contact.

```js
function contactCard(name, email) {
    return {
        t: 'div', a: { class: 'card' }, c: [
            { t: 'h3', c: name },
            { t: 'p', c: email }
        ]
    };
}

bw.mount('#app', { t: 'div', c: [
    contactCard('Alice', 'alice@example.com'),
    contactCard('Bob', 'bob@example.com')
]});
```

Same pattern as the `greeting()` function, but now it produces structured content. This is the entire component model.

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

No template language needed. JavaScript already has functions (components), arrays (children), and `.map()` (iteration). The TACO format gives these a shape that maps to the DOM.


## 5. Styling Grows Naturally

We can compose structure, but unstyled HTML is not a UI. Because styles are just strings and objects in JavaScript, bitwrench handles CSS the same way it handles markup -- with plain JS.

### Start simple -- class and style attributes

The `style` and `class` attributes in a `{taco}` work exactly like their HTML counterparts:

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

### Use JavaScript variables as style tokens

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

Continuing our card: let's style the contact card with `bw.css()`.

```js
bw.injectCSS(bw.css({
    '.card': {
        padding: '1.5rem',
        borderRadius: '12px',
        border: '1px solid #ddd',
        maxWidth: '300px'
    },
    '.card h3': { margin: '0 0 0.5rem 0' },
    '.card p':  { margin: '0', color: '#666' }
}));

bw.mount('#app', contactCard('Alice', 'alice@example.com'));
// Now the card renders with rounded corners, padding, and subtle text.
```

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

This accomplishes what Sass mixins do, but with plain JavaScript functions -- no extra compilation step or grammar to learn.

### bw.makeStyles() and bw.applyStyles() -- theme and component style system

Generate a coherent theme from two seed colors:

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
| Theme + component styles | `bw.makeStyles()` + `bw.applyStyles()` | Consistent theming from seed colors |

Start at the top. Move down when you need more power. Each level builds on the one before.


## 6. Events and Behavior

A styled card looks right but does nothing. Adding behavior means adding event handler functions to `a:` -- the same place every other attribute lives.

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

Continuing our card: add a click handler that copies the email address.

```js
function contactCard(name, email) {
    return {
        t: 'div', a: {
            class: 'card',
            style: 'cursor:pointer',
            onclick: function() { alert('Email: ' + email); }
        },
        c: [
            { t: 'h3', c: name },
            { t: 'p', c: email }
        ]
    };
}
```

The handler closes over `email` -- no data binding, no state management. Just a closure.

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


## 7. Lifecycle: `o:` Options

Event handlers give us interactivity, but real components need state that persists across renders and cleanup logic for resources. That is what the `o:` (options) key provides.

The `o:` key is where non-HTML concerns live. It was separated from `a:` because `a:` compiles directly to HTML attributes -- library metadata should not leak into the DOM.

Bitwrench supports two broad update styles. Use `o.render` with `bw.refresh()` when a component should rebuild its contents from state. Use handles, slots, patching, or replacement when a component can update a specific part of the DOM directly. Pub/sub is available for communication between components that should not hold direct references to one another.

### o.state -- component state

```js
bw.mount('#app', {
    t: 'div',
    o: {
        state: { count: 0 },
        render: function(el, state) {
            bw.mount(el, { t: 'div', c: [
                { t: 'span', c: 'Count: ' + state.count },
                { t: 'button', a: { onclick: function() {
                    state.count++;
                    bw.refresh(el);
                }}, c: '+1' },
                { t: 'button', a: { onclick: function() {
                    state.count = 0;
                    bw.refresh(el);
                }}, c: 'Reset' }
            ]});
        }
    }
});
```

`o.state` is assigned by reference to `el._bw_state` at creation time (not cloned). `o.render` is called with `(el, state)` on mount and on every `bw.refresh(el)`. When state changes, mutate the state object and call `bw.refresh(el)` to re-render.

Continuing our card: let's add an expanded/collapsed state to the contact card.

```js
function contactCard(name, email, phone) {
    return {
        t: 'div', a: { class: 'card' },
        o: {
            state: { expanded: false },
            render: function(el, state) {
                bw.mount(el, { t: 'div', c: [
                    { t: 'h3', a: { onclick: function() {
                        state.expanded = !state.expanded;
                        bw.refresh(el);
                    }, style: 'cursor:pointer' }, c: name + (state.expanded ? ' \u25B2' : ' \u25BC') },
                    { t: 'p', c: email },
                    state.expanded ? { t: 'p', c: phone } : null
                ]});
            }
        }
    };
}

bw.mount('#app', contactCard('Alice', 'alice@example.com', '+1-555-0100'));
// Clicking the name toggles the phone number.
```

The card now has real state. The render function receives `(el, state)`, reads `state.expanded`, and conditionally shows the phone number. `bw.refresh(el)` re-renders when state changes.

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

**Automatic cleanup:** bitwrench runs a document-level MutationObserver that detects when elements are removed from the DOM -- even by third-party code or raw DOM operations. When a component disappears, its `unmount` hooks fire and bitwrench releases its lifecycle registrations and pub/sub subscriptions so that it does not retain the removed subtree. You do not need to detect DOM removal manually -- declare cleanup in `o.unmount`, and bitwrench invokes it when the component leaves the DOM.

**Prefer event handlers in `a:`.** Listeners attached directly to child nodes during `o.mounted` will be lost if those children are replaced by `bw.refresh()`. Handlers in `a:` are re-attached automatically on every render. Reserve imperative listeners in `o.mounted` for integrations that require them (e.g. window-level events), and clean them up in `o.unmount`:

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
var counterEl;

var counter = {
    t: 'div', c: [
        { t: 'span', a: { class: 'count' }, c: '0' },
        { t: 'button', a: { onclick: function() {
            counterEl.bw.increment();
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

counterEl = bw.mount('#app', counter);
counterEl.bw.increment();   // updates count without re-rendering the tree
counterEl.bw.reset();       // same -- surgical, targeted
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

If `o:` properties went in `a:`, they would appear as HTML attributes in the rendered output -- or worse, in `bw.html()` string output. The separation keeps framework metadata out of generated HTML and makes the serializable subset of a `{taco}` easier to identify. (A `{taco}` is serializable when it contains only JSON-compatible values -- no event-handler functions in `a:`, no lifecycle or render functions in `o:`, no DOM references.)

### The update cost spectrum

| Operation | Cost | What happens |
|-----------|------|-------------|
| `el.bw.method()` | Surgical | Component updates its own DOM |
| Slot setters (`el.bw.setTitle()`) | Targeted | Replaces content at a cached DOM target |
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


## 8. BCCL: Ready-Made Components

Building every component from scratch teaches you the model, but for common patterns -- cards, tables, modals, alerts -- bitwrench ships ready-made factories.

BCCL (Bitwrench Common Component Library) is a set of factory functions that return `{taco}` objects for common UI patterns. Think of it as Bootstrap, but instead of HTML templates you get JavaScript objects.

### Factories return TACOs, not DOM

```js
var card = bw.makeCard({ title: 'Users', content: '42 online' });
// card is { t:'div', a:{class:'bw_bccl_card'}, c:[...] }
// It is a plain {taco} -- inspect it, modify it, nest it.

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
        { t: 'p', c: 'Hand-written {taco} next to a BCCL card.' }
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

The stateful and interactive BCCL components (cards, tables, tabs, modals, toasts, accordions, and others) wire up `o.handle` and/or `o.slots` automatically. Purely structural factories (rows, containers, buttons) return plain TACOs with no handles -- they don't need any:

```js
var el = bw.mount('#app', bw.makeCard({ title: 'Stats', content: '0' }));
el.bw.setTitle('Revenue');
el.bw.setContent({ t: 'b', c: '$42k' });
```

See [Component Library](component-library.md) for the full method table per component.

### Three things to know

1. Every factory returns a `{taco}`. The output is a plain `{t, a, c, o}` object.
2. There are no tricks. BCCL factories are regular functions. Anything they do, you can do by hand.
3. BCCL is optional. Use it for everything, use it selectively, or ignore it entirely.


## 9. Routing, Utilities, Advanced

Sections 2-8 cover the core model. This section covers the remaining tools bitwrench provides: routing, declared dataflow, color utilities, and general-purpose helpers.

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

// Navigation links (returns {taco})
bw.link('/about', 'About Us', { class: 'nav-item' })
```

Route parameters (`/users/:id`), query strings (`params._query.tab`), catch-all routes (`/docs/*` with `params._rest`), guards (`before`/`after` hooks), and hash vs. history mode are all supported. See [Routing Guide](routing.md) for the full API.

### bw.derive() -- declared dataflow

`bw.derive()` recomputes a derived value when its input topics publish:

```js
bw.derive(['cart:updated', 'discount:changed'], function(cartData, discountData) {
    var total = cartData.total * (1 - discountData.rate);
    return { total: total };
}, 'order:total');

// Subscribes automatically; fires when either input publishes
bw.sub('order:total', function(data) {
    bw.el('#total', '$' + data.total.toFixed(2));
});
```

The combiner function receives the latest value from each input topic as positional arguments, in the same order as the `inputs` array. The dependency graph is explicit and written in source code -- not assembled by getter traps at runtime.

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
bw.mapScale(75, 0, 100, 0, 255);    // map between ranges (191.25)
bw.clip(150, 0, 100);               // clamp to range (100)
bw.naturalCompare('item2', 'item10'); // natural sort comparison
bw.parseJSONFlex("{ name: 'Alice' }"); // flexible JSON (unquoted keys, single quotes, r-prefix)
```

### Raw HTML -- bw.raw()

By default, bitwrench escapes all content to prevent XSS. When you need actual HTML inside a `{taco}`, use `bw.raw()`:

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
bw.loadClientFile('config.json', function(data) { /* ... */ });
```


## 10. What Bitwrench Does Instead

| You might expect | What bitwrench does |
|------------------|---------------------|
| Virtual DOM + diffing | Components update their own DOM directly via handles and cached slots, without a virtual-tree walk or full component rebuild |
| CSS purging / tree-shaking | `bw.css()` generates only the rules you write -- nothing unused exists to purge |
| SSR hydration | `bw.html()` renders TACOs to strings in Node; `bw.mount()` renders to DOM in the browser -- same input, two outputs |
| Build step / bundler | Load via `<script>` tag, CDN, or ESM `import` -- works without tooling, benefits from it optionally |
| Automatic state tracking | Explicit updates via methods, `bw.refresh()`, and pub/sub -- all wiring is visible in source |
| TypeScript required | Ships `dist/bitwrench.d.ts` for full type checking -- supported, never required. See [TypeScript Usage Guide](bitwrench_typescript_usage.md) |


## 11. Server-Driven UI and CLI

Everything in Sections 1-10 runs in the browser. But a `{taco}` without function values in `o:` is pure data -- it serializes to JSON. This means any program, in any language, can generate `{taco}` objects and send them to a browser for rendering. Bitwrench ships two tools that build on this property.

### bwserve -- server-driven UI over SSE

bwserve is a protocol that turns the browser into a display and input surface for a program running elsewhere. The server pushes `{taco}` objects and patches over Server-Sent Events; user interactions come back as named actions.

```
Server (any language)           Browser
  |                               |
  |-- SSE: {replace, #app, taco} --> bw.apply() --> DOM update
  |-- SSE: {patch, #counter, "42"} -> targeted text update
  |-- SSE: {append, #log, taco} ---> new child added
  |                               |
  |<-- POST: {action: "click"} ---+   user clicks bw_act_*
```

A minimal server in Node.js:

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

In Sections 6-7, every event handler was a local JavaScript function (`onclick: function() { ... }`). In server-driven mode, there is a second path: the click is forwarded to the server instead. Add a `bw_act_*` CSS class to any element, and when the user clicks it, the browser POSTs the action name to the server. No `onclick` handler is needed on the client:

```js
// Client-side {taco} (no onclick handler needed)
{ t: 'button', a: { class: 'bw_act_greet' }, c: 'Say hello' }

// Server-side handler
client.on('greet', function(data) {
    client.patch('#status', { text: 'Hello, user!' });
});
```

In a fully server-driven application, domain logic can remain on the server. The browser renders messages and relays named user actions back. Local handlers and server actions can coexist in the same page; the `{taco}` shape is the same either way.

### bwcli -- file conversion and pipe server

`bwcli` is a command-line tool that converts files to styled standalone HTML pages and acts as a bridge between any language and the bwserve protocol.

```bash
# Convert Markdown to a self-contained HTML page
bwcli README.md -o index.html --standalone

# Apply a theme preset
bwcli doc.md -o doc.html --standalone --theme ocean

# Pipe server -- any language becomes a bwserve backend
bwcli serve --port 8080 --input-port 9000
curl -X POST http://localhost:9000 -d '{"type":"patch","ref":"temp","content":"23.5 C"}'
```

With `bwcli serve`, a Python script, a shell loop, or a C program on a microcontroller can push UI updates to connected browsers by POSTing JSON to the pipe server's input port. No JavaScript on the server side at all.

### When to use bwserve

- **Language-agnostic**: any server that writes SSE can drive the UI -- Python, Go, Rust, C, shell scripts.
- **LLM-native**: an AI emits `{taco}` JSON directly -- potentially more compact and easier to validate than generated HTML or JSX.
- **Embedded**: an ESP32 serves one HTML page with bitwrench, then pushes sensor data as patches. C macros ship in `embedded_c/`.
- **Streamlit/Gradio-style applications**: the same broad server-driven pattern, but language-neutral and based on the full TACO composition model.

See the [bwserve docs](bwserve.md) for the full protocol, the [CLI docs](cli.md) for all flags and options, and the [ESP32 tutorial](tutorial-embedded.md) for a complete embedded walkthrough.


## 12. Quick Reference

The tutorial ends here. The following tables are a compact lookup reference for the APIs introduced above.

### The lifecycle

```
define -> create -> hydrate -> mount -> update -> unmount
```

Each phase has one verb. In practice, create+hydrate are fused for efficiency. Convenience verbs (`bw.mount`, `bw.append`, `bw.replace`, `bw.remove`, `bw.refresh`) compose phase verbs -- they never reimplement them.

### Core rendering

| Function | What it does |
|----------|-------------|
| `bw.html(taco)` | `{taco}` to HTML string |
| `bw.create(taco)` | `{taco}` to detached, hydrated DOM element |
| `bw.mount(sel, taco)` | Mount `{taco}` into existing element; returns root element |
| `bw.DOM(sel, taco)` | Alias for `bw.mount()` |
| `bw.el(sel, apply)` | Find element by selector; optionally apply content/function |
| `bw.h(tag, attrs, c, o)` | `{taco}` constructor from positional args |
| `bw.raw(str)` | Mark string as pre-escaped HTML |

### Lifecycle verbs (atomic)

These are low-level lifecycle primitives. Most applications only need `bw.mount()`, `bw.refresh()`, and `bw.unmount()`.

| Function | What it does |
|----------|-------------|
| `bw.create(taco)` | Build hydrated, detached DOM from `{taco}` |
| `bw.hydrate(el, taco)` | Wire lifecycle from `{taco}` onto existing DOM node |
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
| `bw.toggleThemeMode(scope?)` | Switch between primary and alternate palettes |
| `bw.clearStyles()` | Remove injected styles |

### State and updates

| Function | What it does |
|----------|-------------|
| `o.state` | Initial state object (assigned by reference to `el._bw_state`) |
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
| `bw.link(path, content, attrs)` | Returns `{taco}` `<a>` with navigation wired |

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
| `bw.loremIpsum(n)` | Placeholder text |
| `bw.mapScale(x, i0, i1, o0, o1)` | Map value between ranges |
| `bw.parseJSONFlex(str)` | Parse flexible JSON (unquoted keys, single quotes, r-prefix) |
| `bw.saveClientFile(name, data)` | Browser file download |
| `bw.loadClientJSON(cb)` | Browser file upload (JSON) |


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


## Postscript: Validation

A `{taco}` is a plain JavaScript object with a known shape: `t` is a string, `a` is an object of attributes, `c` is a string, array, or nested `{taco}`, and `o` is an object with specific keys (`state`, `render`, `handle`, `slots`, `mounted`, `unmount`). That shape is simple enough to describe as a JSON Schema, a TypeScript interface, or a validation function.

This means you can validate `{taco}` objects before they reach the DOM. A server can check that wire-format TACOs conform to an allowed subset before sending them to the client. A test suite can assert that a component factory returns well-formed output. An LLM generating UI can have its output validated against the schema before it is rendered. A content management system can enforce that editors produce valid `{taco}` structures.

Bitwrench does not ship a schema or enforce one at runtime -- the library is permissive by design, and validation has a cost. But the fact that the entire UI description is a plain object with a documented shape means validation is always available as an option. This is a property that template strings, JSX, and HTML do not have without a parser.

*Bitwrench is maintained by [deftio](https://github.com/deftio). BSD-2-Clause license.*
