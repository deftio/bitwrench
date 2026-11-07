# Bitwrench Quickstart

A complete working app in ~100 lines, annotated.

## What bitwrench is

bitwrench is a UI library where every element is a plain JS object called
a TACO: `{t, a, c, o}` (Tag, Attributes, Content, Options). No compiler,
no virtual DOM, no JSX. One script tag, 46 KB gzipped, zero dependencies.
Started in 2011 -- by an author who'd previously co-founded the Lampdesk
webVM that became Palm/HP webOS -- with a simple premise: JavaScript
objects should be the UI primitive, not markup strings. Where Bootstrap
required writing HTML and bolting on behavior separately, TACO keeps tag,
attributes, content, and behavior in one object. JSX went the other
direction (markup-first, toolchain required); bitwrench bets that the
object-first approach is more composable and needs zero tooling. That same
design choice happens to work everywhere from cloud dashboards to ESP32
microcontrollers.

## How bitwrench works

A TACO carries everything about a component in one object: the tag, the
attributes including event handlers, the content, and in `o` the state,
methods, slots and lifecycle hooks. bitwrench creates, mounts, updates and
unmounts the component from that object. The whole UI, including its CSS and
its actions, is composed in JavaScript, and nothing is added between the
source and the browser: no compiler, no template language, no build step.

Because the entire UI is a plain object, several things follow from the same
mechanism:

- **It renders anywhere.** `bw.html(taco)` returns a string in Node for static
  sites and server rendering; `bw.mount(taco)` returns live DOM in the browser.
  Same object.
- **CSS is JavaScript too.** `bw.css({ '.card': { padding: '1rem' } })` is a
  stylesheet; `bw.makeStyles` derives a palette from two seed colors; utility
  shorthand (`bw.u('flex gap4')`) is an optional plugin. No preprocessor.
- **UI is data, so it can be checked and shipped as data.** A TACO without
  functions is JSON. `verify()` validates a tree from a template or a model;
  a microcontroller can send one over SSE and the browser renders it.
- **No build chain is required.** One script tag is the whole setup. The
  tools bitwrench ships, `bwcli`, `bwcli attach`, `verify`, `drift-lint` and
  the `bwmcp` agent server, are helpers added when wanted, never prerequisites.

Compared with React: there is no virtual DOM and no reconciler. A component is
told what changed, with a method call, `bw.patch` or `bw.toggleClass`, and it
changes itself. The class attribute is `class`, the HTML name. Compared with
vanilla JS or jQuery: the object is not a shorter `createElement`. Handlers,
state and methods live in the object, and every later change has a verb, so
`querySelector`, `innerHTML` and `addEventListener` do not appear in bitwrench
code after the first mount.

The full account, built from a string to a server-driven app one layer at a
time, is [Thinking in Bitwrench](thinking-in-bitwrench.md). Its first section
covers the three starting points readers most often bring and what each one
maps to.

## Ten things that already exist

Each of these is in the lean build as well as the full one, and each was
re-implemented by at least one of the three apps audited after they shipped on
bitwrench. They are the names to learn first.

| You want to | Call | Not |
|---|---|---|
| build a TACO from positional args | `bw.h('li', null, text)` | your own `h()` |
| change one value or attribute | `bw.patch('id', value)` | `textContent =`, `setAttribute` |
| flip a visual state | `bw.toggleClass('.key', 'down', isDown)` | a `classList.toggle` loop |
| update a list, keeping typed input | `bw.syncChildren(ul, items, { key, create, update })` | re-mounting the list |
| empty a container | `bw.clear('log')` | `innerHTML = ''` |
| find, or find and change | `bw.el('id')`, `bw.$('.sel', fn)` | `document.querySelector` |
| call a component's method | `el.bw.setTitle(x)`, `bw.message('id', 'open')` | reaching into its DOM |
| address a built-in component later | `bw.makeCard({ id: 'stats', class: 'wide' })` | wrapping it in a div |
| route between views | `bw.router({ target, routes })` | a `switch` on `location.hash` |
| talk between components | `bw.pub` / `bw.sub(topic, fn, el)` | a global event bus |

The full problem-indexed list, with a running example for each:
[When you want X, call Y](when-you-want.md).

## Hello, world

The whole setup is one script tag. Save this as an `.html` file and open it:

```html
<script src="https://cdn.jsdelivr.net/npm/bitwrench@2/dist/bitwrench.umd.min.js"></script>
<div id="app"></div>
<script>
  bw.mount('#app', { t: 'h1', c: 'Hello, world' });
</script>
```

`{ t: 'h1', c: 'Hello, world' }` is a TACO: **t**ag, **a**ttributes,
**c**ontent, **o**ptions. Children go in `c`, and event handlers are ordinary
attributes:

```javascript
var count = 0;
bw.mount('#app', {
  t: 'div', c: [
    { t: 'h1', c: 'Clicks' },
    { t: 'button', a: { onclick: function() { bw.patch('n', String(++count)); } }, c: '+1' },
    { t: 'span', a: { id: 'n' }, c: '0' }
  ]
});
```

If the key names feel heavy, `bw.h(tag, attrs, content)` builds the same
objects from positional arguments -- the output is identical, so mix freely:

```javascript
var h = bw.h;
bw.mount('#app', h('ul', null, ['one', 'two', 'three'].map(function(x) {
  return h('li', null, x);
})));
```

SVG is written the same way, starting from `{ t: 'svg', ... }` -- see the
[SVG guide](svg.md).

To change something already on screen, you do not rebuild it: `bw.toggleClass`
for a visual state, `bw.patch` for one value or attribute, `bw.syncChildren`
for a list, `bw.clear` to empty a container. The
[core API card](core-api.md) is one page of exactly these.

## Which file do I load?

| You want | Load | Size (gzip) |
|----------|------|-------------|
| A `<script>` tag, everything included | `dist/bitwrench.umd.min.js` | ~46 KB |
| Your own design, no built-in components | `dist/bitwrench-lean.umd.min.js` | ~36 KB |
| Readable stack traces while debugging | `dist/bitwrench.umd.js` (unminified) | ~121 KB |
| `import bw from ...` without npm | `dist/bitwrench.esm.min.js` (or `-lean.esm.min.js`) | ~46 KB |
| npm | `npm install bitwrench`, then `import bw from 'bitwrench'` | -- |

Every file has a source map next to it. The unminified builds are for
debugging -- don't vendor them into a page you ship. All builds and their
hashes are listed in `dist/builds.json`.

Lean is not a stripped-down core. It keeps the router, pub/sub, `patch`,
`syncChildren`, the class verbs, `bw.el`/`bw.$` and the table factories. The
only thing it drops is the 47 BCCL component factories (`makeButton`,
`makeCard`, `makeTooltip`, ...). The exact table is on the
[core API card](core-api.md#what-is-in-which-build).

## Lifecycle at a glance

1. **Define** -- write a TACO object: `{t: 'div', a: {class: 'card'}, c: 'Hello', o: {...}}`
2. **Create** -- `bw.create(taco)` builds a real DOM element from the object
3. **Hydrate** -- handles attach to `el.bw`, slots wire getters/setters, UUID assigned, state initialized
4. **Mount** -- element inserted into document; `o.mounted(el)` fires
5. **Interact** -- external code calls `el.bw.method()` -- the component updates its own DOM
6. **Unmount** -- `bw.unmount(el)` fires `o.unmount(el)`, tears down subscriptions, removes element

## The annotated tutorial

Copy this into a file and open it in a browser. Every section is commented.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Task List -- bitwrench quickstart</title>

  <!-- One script tag. No npm, no bundler, no build step. -->
  <script src="https://cdn.jsdelivr.net/npm/bitwrench@2/dist/bitwrench.umd.min.js"></script>
</head>
<body>
<div id="app"></div>
<script>

// --- 1. Theming -----------------------------------------------------------
// loadStyles() with seed colors generates a full palette (hover, active,
// focus, dark-text, border variants for each color), layout tokens
// (spacing, radius, typeScale, elevation, motion), plus structural CSS
// for all built-in components. Returns the styles object.
var styles = bw.loadStyles({
  primary: '#2d6a4f',
  secondary: '#d4a373',
  spacing: 'normal',   // 'compact' | 'normal' | 'spacious'
  radius: 'md',        // 'none' | 'sm' | 'md' | 'lg' | 'pill'
  elevation: 'md'      // 'flat' | 'sm' | 'md' | 'lg'
});
var p = styles.palette;  // color roles -- use these in custom CSS, not hex literals
var L = styles.layout;   // spacing / radius / type / elevation / motion

// Custom CSS: bw.css() with palette + layout tokens (not var(--bw_*), not raw hex).
bw.injectCSS(bw.css({
  '.task-done': { textDecoration: 'line-through', opacity: '0.5' },
  '.task-card': {
    background: p.surface,
    border: '1px solid ' + p.light.border,
    'border-radius': L.radius.card,
    padding: L.spacing.card,
    'box-shadow': L.elevation.sm
  }
}));

// --- 2. A static TACO -----------------------------------------------------
// Most UI is static objects. No state, no lifecycle. Just data.
var header = {
  t: 'h1',                                // tag name
  a: { style: 'color:' + p.primary.base },  // attributes (inc. event handlers)
  c: 'My Tasks'                            // content: string, TACO, or array
};

// --- 3. Using a built-in component (BCCL) ---------------------------------
// bitwrench ships 51 components. Check docs/component-cheatsheet.md first.
// BCCL functions return TACO objects -- they are data, not DOM yet.
var addButton = bw.makeButton({
  text: 'Add Task',
  variant: 'primary',
  onclick: function() { addTask(); }  // event handlers go in attributes
});

// --- 4. Stateful component with handles and render -------------------------
// o.state holds data. o.render rebuilds the element on bw.refresh().
// o.handle adds methods to el.bw for external control.
function taskList() {
  return {
    t: 'div',
    a: { id: 'tasks' },   // an id makes it addressable: bw.el('tasks')
    o: {
      state: {
        tasks: [
          { text: 'Read the quickstart', done: true },
          { text: 'Build something', done: false }
        ]
      },

      // render() is called once at mount, then on each bw.refresh(el)
      render: function(el, state) {
        bw.DOM(el, {
          t: 'ul', a: { class: 'bw_list_group' },
          c: state.tasks.map(function(task, i) {
            return {
              t: 'li',
              a: {
                class: 'bw_list_group_item' + (task.done ? ' task-done' : ''),
                onclick: function() {
                  state.tasks[i].done = !state.tasks[i].done;
                  bw.refresh(el);  // explicit re-render -- no magic
                }
              },
              c: task.text
            };
          })
        });
      },

      // handle methods attach to el.bw -- callable from outside
      handle: {
        addTask: function(el, text) {
          el._bw_state.tasks.push({ text: text, done: false });
          bw.refresh(el);
        },
        getCount: function(el) {
          return el._bw_state.tasks.length;
        }
      },

      // mounted fires once, after the element is in the DOM.
      // Use for non-event setup only (observers, measurements).
      // NEVER put addEventListener here -- use attributes instead.
      mounted: function(el) {
        console.log('Task list mounted with', el.bw.getCount(), 'tasks');
      }
    }
  };
}

// --- 5. Mount to DOM -------------------------------------------------------
// bw.mount() returns the root element. (bw.DOM() is another name for it.)
bw.mount('#app', {
  t: 'div', a: { class: 'bw_container' },
  c: [
    header,             // static TACO
    taskList(),         // stateful component
    { t: 'hr' },
    addButton           // BCCL component
  ]
});

// --- 6. Interact via handles -----------------------------------------------
// The component is now live. Update it by calling methods, not by
// manipulating the DOM directly. The component owns its DOM.
function addTask() {
  var text = prompt('New task:');
  if (text) bw.el('tasks').bw.addTask(text);  // find by id, call its method
}

</script>
</body>
</html>
```

## What to read next

- **docs/thinking-in-bitwrench.md** -- the argument and the model, built up one layer at a time. Read it before you write much code
- **docs/when-you-want.md** -- the core API indexed by the problem you have, every entry with a running example
- **docs/core-api.md** -- one-page card: mount, patch, css, pub/sub, syncChildren. Start here if you bring your own design
- **docs/taco-format.md** -- the object format and `bw.h()`
- **docs/svg.md** -- SVG as TACO: charts, gauges, diagrams, and changing them in place
- **docs/verify.md** -- `bitwrench/verify`: an opt-in checker for TACO. Not needed to render, and never in production -- reach for it when TACOs are generated, numerous, or leaving your hands (a test, a wire frame, a CI pipe)
- **docs/bw-attach.md** -- `bwcli attach`: drive a live page from a terminal (REPL, inspect, screenshots). Useful for anything a headless browser can't do, like Web MIDI or hardware
- **docs/component-cheatsheet.md** -- all 51 built-in components
- **docs/llm-bitwrench-guide.md** -- compact code-first tutorial (700 lines)
- **docs/theming.md** -- palette generation, dark mode, custom CSS
- **docs/state-management.md** -- o.state, o.render, handles, slots, pub/sub
