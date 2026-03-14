# The TACO Format

Every UI element in bitwrench is a plain JavaScript object with up to four keys:

```javascript
{
  t: 'div',                          // Tag — HTML element name
  a: { class: 'card', id: 'main' }, // Attributes — HTML attributes
  c: 'Hello World',                  // Content — text, TACO, or array
  o: { state: { count: 0 } }        // Options — state, lifecycle, behavior
}
```

That's it. **T**ag, **A**ttributes, **C**ontent, **O**ptions — TACO.

## Why plain objects?

TACO objects are regular JavaScript. You can store them in variables, pass them to functions, put them in arrays, serialize them to JSON, send them over the network, and generate them on a server. No special syntax, no compiler, no toolchain.

```javascript
// It's just data — compose with standard JavaScript
const header = { t: 'h1', c: 'Welcome' };
const items = data.map(d => ({ t: 'li', c: d.name }));
const page = { t: 'div', c: [header, { t: 'ul', c: items }] };
```

> **Coming from React?** A TACO object is analogous to what `React.createElement()` returns — a description of UI, not the UI itself. The difference is that TACO is plain data you write directly, while JSX requires a compiler to produce React elements.

> **Coming from Vue?** TACO is similar to Vue's render function `h('div', { class: 'card' }, children)`, but as a data literal rather than a function call. Vue's `<template>` blocks compile down to something similar internally.

## The four keys

### `t` — Tag

The HTML element name. Required for rendering.

```javascript
{ t: 'div' }       // <div></div>
{ t: 'button' }    // <button></button>
{ t: 'input' }     // <input>
{ t: 'h1' }        // <h1></h1>
```

### `a` — Attributes

An object of HTML attributes. All standard attributes work, including event handlers.

```javascript
{
  t: 'button',
  a: {
    class: 'bw-btn bw-btn-primary',
    id: 'save-btn',
    disabled: true,
    onclick: function() { console.log('clicked'); },
    'data-action': 'save',
    style: 'margin-top: 1rem'
  }
}
```

Style can also be an object:

```javascript
a: { style: { marginTop: '1rem', color: '#333' } }
```

For composable styles, use `bw.s()` with `bw.u` utility objects:

```javascript
a: { style: bw.s(bw.u.flex, bw.u.alignCenter, bw.u.gap4, { marginTop: '1rem' }) }
```

`bw.s()` merges style objects into a style string, `bw.u` provides pre-built utilities (`bw.u.flex`, `bw.u.p4`, `bw.u.bold`, etc.). See [Thinking in Bitwrench](thinking-in-bitwrench.md) for full coverage.

> **Coming from React?** Attribute names use standard HTML casing (`class`, `onclick`, `tabindex`), not React's camelCase (`className`, `onClick`, `tabIndex`).

### `c` — Content

The element's content. This can be:

- **A string** — rendered as text content (HTML-escaped by default)
- **A TACO object** — rendered as a child element
- **An array** — each item rendered in order (strings, TACOs, or nested arrays)

```javascript
// String content
{ t: 'p', c: 'Hello World' }

// Child TACO
{ t: 'div', c: { t: 'span', c: 'nested' } }

// Array of children
{ t: 'ul', c: [
  { t: 'li', c: 'First' },
  { t: 'li', c: 'Second' },
  { t: 'li', c: 'Third' }
]}

// Mixed content
{ t: 'div', c: [
  { t: 'h2', c: 'Title' },
  'Some paragraph text',
  { t: 'button', c: 'Click me' }
]}
```

#### Content escaping

Content is HTML-escaped by default. The text `<script>alert('xss')</script>` renders as literal text, not as a script tag.

To include raw HTML, use `bw.raw()` or set `o: { raw: true }`:

```javascript
// Escaped (safe, default)
{ t: 'div', c: '<b>bold</b>' }
// Renders: &lt;b&gt;bold&lt;/b&gt;

// Raw HTML (opt-in)
{ t: 'div', c: bw.raw('<b>bold</b>') }
// Renders: <b>bold</b>

// Or via options
{ t: 'div', c: '<b>bold</b>', o: { raw: true } }
```

### `o` — Options

The options key carries state, lifecycle hooks, and component behavior. This is where TACO goes beyond simple HTML description.

```javascript
{
  t: 'div',
  o: {
    // Component state
    state: { count: 0, items: [] },

    // Render function (called by bw.update)
    render: function(el) {
      bw.DOM(el, { t: 'span', c: 'Count: ' + el._bw_state.count });
    },

    // Lifecycle hooks
    mounted: function(el) { console.log('in the DOM'); },
    unmount: function(el) { console.log('being removed'); },

    // Skip content escaping
    raw: true,

    // Methods (used with ComponentHandle)
    methods: {
      increment: function(comp) { comp.set('count', comp.get('count') + 1); }
    },

    // Actions (used with ComponentHandle)
    actions: {
      save: function(comp, evt) { /* handle save */ }
    }
  }
}
```

See [State Management](state-management.md) for detailed coverage of `o.state`, `o.render`, `o.methods`, and lifecycle hooks.

## Rendering TACO objects

TACO objects are data. To produce actual output, pass them to a rendering function:

```javascript
// Render to HTML string (works in Node.js and browsers)
const html = bw.html({ t: 'div', c: 'Hello' });
// '<div>Hello</div>'

// Create a live DOM element (browser only)
const el = bw.createDOM({ t: 'div', c: 'Hello' });
// HTMLDivElement

// Mount into an existing DOM element (browser only)
bw.DOM('#app', { t: 'div', c: 'Hello' });
// Replaces contents of #app
```

`bw.DOM()` cleans up any previous content (running unmount hooks, clearing state) before mounting new content. This prevents memory leaks when re-rendering.

## Composition patterns

Because TACO is just JavaScript, you compose UI with standard language features:

### Variables

```javascript
const title = { t: 'h1', c: 'Dashboard' };
const sidebar = { t: 'aside', c: 'Menu' };
const main = { t: 'main', c: [title, { t: 'p', c: 'Content' }] };
```

### Functions

```javascript
function userCard(user) {
  return {
    t: 'div', a: { class: 'card' },
    c: [
      { t: 'h3', c: user.name },
      { t: 'p', c: user.email }
    ]
  };
}

const cards = users.map(userCard);
bw.DOM('#list', { t: 'div', c: cards });
```

### Conditionals

```javascript
const content = isLoggedIn
  ? { t: 'div', c: 'Welcome back' }
  : { t: 'div', c: 'Please log in' };
```

### Loops

```javascript
const rows = data.map(item => ({
  t: 'tr', c: [
    { t: 'td', c: item.name },
    { t: 'td', c: String(item.value) }
  ]
}));
```

## TACO and the component library

The `make*()` functions in bitwrench's component library return TACO objects:

```javascript
const card = bw.makeCard({ title: 'Users', content: '1,234' });
// Returns a TACO object — not HTML, not DOM

bw.DOM('#app', card);        // Mount it
const html = bw.html(card);  // Or render to string
```

This means you can compose library components the same way you compose raw TACOs:

```javascript
bw.DOM('#app', {
  t: 'div', c: [
    bw.makeNavbar({ brand: 'My App', items: [...] }),
    bw.makeContainer({ children: [
      bw.makeCard({ title: 'Stats', content: '42' }),
      bw.makeTable({ data: rows, sortable: true })
    ]})
  ]
});
```

See [Component Library](component-library.md) for all available components.

## Custom components without BCCL

The `make*()` component library (BCCL) is a convenience, not a requirement. You can write your own component factories that return TACO objects — bitwrench doesn't care where the TACO comes from.

```javascript
// Your own component factory — no BCCL needed
function myStatusBadge(status) {
  var colors = { ok: '#4caf50', warn: '#ff9800', error: '#f44336' };
  return {
    t: 'span',
    a: {
      class: 'status-badge',
      style: 'background: ' + (colors[status] || '#999')
        + '; color: #fff; padding: 0.25rem 0.75rem;'
        + ' border-radius: 999px; font-size: 0.8rem;'
    },
    c: status.toUpperCase()
  };
}

bw.DOM('#app', myStatusBadge('ok'));
```

You can also wrap existing CSS frameworks (Bootstrap, Tailwind, etc.) in TACO objects:

```javascript
// Bootstrap button as a TACO
{ t: 'button', a: { class: 'btn btn-primary' }, c: 'Save' }

// Tailwind card as a TACO
{
  t: 'div',
  a: { class: 'bg-white rounded-lg shadow-md p-6' },
  c: [
    { t: 'h3', a: { class: 'text-lg font-semibold' }, c: 'Title' },
    { t: 'p', a: { class: 'text-gray-600 mt-2' }, c: 'Content' }
  ]
}
```

Bitwrench doesn't care where your CSS classes come from — it just renders the TACO to HTML/DOM. The `make*()` functions use bitwrench's built-in CSS classes (`bw_card`, `bw_btn`, etc.), but that's a choice, not a constraint.

To make a custom component reactive, wrap it in `bw.component()`:

```javascript
var badge = bw.component({
  t: 'span',
  a: { class: 'status-badge', style: 'background: ${color}; color: #fff; padding: 0.25rem 0.75rem; border-radius: 999px;' },
  c: '${label}',
  o: { state: { label: 'OK', color: '#4caf50' } }
});

bw.DOM('#app', badge);
badge.set('label', 'ERROR');
badge.set('color', '#f44336');
```

## TACO beyond the browser

Because TACO objects are plain data, they work in contexts beyond browser rendering:

- **Server-side rendering**: `bw.html(taco)` produces HTML strings in Node.js
- **Static site generation**: The `bwcli` command converts files to styled HTML pages
- **Server-driven UI**: A server can push TACO objects to the browser via SSE, and the client renders them with `bw.DOM()`
- **Serialization**: TACO objects (without function values) can be JSON-serialized and sent over the network
- **Testing**: TACO objects can be inspected and compared as data without needing a DOM

This is a deliberate design choice. The separation between "what to render" (TACO) and "how to render it" (bw.DOM, bw.html) means the same component definition works across all these contexts.

---

For a deeper exploration of bitwrench's design philosophy, see [Thinking in Bitwrench](thinking-in-bitwrench.md).
