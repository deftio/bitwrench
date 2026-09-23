# Bitwrench Quickstart

A complete working app in ~100 lines, annotated.

## What bitwrench is

bitwrench is a UI library where every element is a plain JS object called
a TACO: `{t, a, c, o}` (Tag, Attributes, Content, Options). No compiler,
no virtual DOM, no JSX. One script tag, 45 KB gzipped, zero dependencies.
Started in 2011 -- by an author who'd previously co-founded the Lampdesk
webVM that became Palm/HP webOS -- with a simple premise: JavaScript
objects should be the UI primitive, not markup strings. Where Bootstrap
required writing HTML and bolting on behavior separately, TACO keeps tag,
attributes, content, and behavior in one object. JSX went the other
direction (markup-first, toolchain required); bitwrench bets that the
object-first approach is more composable and needs zero tooling. That same
design choice happens to work everywhere from cloud dashboards to ESP32
microcontrollers.

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

SVG is written the same way, starting from `{ t: 'svg', ... }` -- see
[SVG in taco-format.md](taco-format.md#svg).

## Which file do I load?

| You want | Load | Size (gzip) |
|----------|------|-------------|
| A `<script>` tag, everything included | `dist/bitwrench.umd.min.js` | ~45 KB |
| Your own design, no built-in components | `dist/bitwrench-lean.umd.min.js` | ~35 KB |
| Readable stack traces while debugging | `dist/bitwrench.umd.js` (unminified) | ~110 KB |
| `import bw from ...` without npm | `dist/bitwrench.esm.min.js` (or `-lean.esm.min.js`) | ~45 KB |
| npm | `npm install bitwrench`, then `import bw from 'bitwrench'` | -- |

Every file has a source map next to it. The unminified builds are for
debugging -- don't vendor them into a page you ship. All builds and their
hashes are listed in `dist/builds.json`.

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

- **docs/core-api.md** -- one-page card: mount, patch, css, pub/sub, syncChildren. Start here if you bring your own design
- **docs/taco-format.md** -- the object format, including [SVG](taco-format.md#svg) and `bw.h()`
- **docs/bw-attach.md** -- `bwcli attach`: drive a live page from a terminal (REPL, inspect, screenshots). Useful for anything a headless browser can't do, like Web MIDI or hardware
- **docs/thinking-in-bitwrench.md** -- full progressive walkthrough (1300 lines)
- **docs/component-cheatsheet.md** -- all 51 built-in components
- **docs/llm-bitwrench-guide.md** -- compact code-first tutorial (700 lines)
- **docs/theming.md** -- palette generation, dark mode, custom CSS
- **docs/state-management.md** -- o.state, o.render, handles, slots, pub/sub
