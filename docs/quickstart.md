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
// focus, dark-text, border variants for each color) plus structural CSS
// for all built-in components. Returns the styles object.
var styles = bw.loadStyles({ primary: '#2d6a4f', secondary: '#d4a373' });
var p = styles.palette;  // use palette values in custom CSS -- never hex literals

// Custom CSS: always bw.css() with palette values, never raw strings.
bw.injectCSS(bw.css({
  '.task-done': { textDecoration: 'line-through', opacity: '0.5' }
}));

// --- 2. A static TACO -----------------------------------------------------
// Most UI is static objects. No state, no lifecycle. Just data.
var header = {
  t: 'h1',                                // tag name
  a: { style: 'color:' + p.primary.base },  // attributes (inc. event handlers)
  c: 'My Tasks'                            // content: string, TACO, or array
};

// --- 3. Using a built-in component (BCCL) ---------------------------------
// bitwrench ships 47 components. Check docs/component-cheatsheet.md first.
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
                class: 'bw_list_item' + (task.done ? ' task-done' : ''),
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
// bw.mount() returns the root element so you can call el.bw methods.
// bw.DOM() does the same but doesn't return the element.
var listEl = bw.mount('#app', {
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
  if (text) {
    // Find the task list element and call its handle method
    var list = listEl.querySelector('div[class]');  // or use bw.$(), bw.el()
    if (list && list.bw) list.bw.addTask(text);
  }
}

</script>
</body>
</html>
```

## What to read next

- **docs/thinking-in-bitwrench.md** -- full progressive walkthrough (1300 lines)
- **docs/component-cheatsheet.md** -- all 47 built-in components
- **docs/llm-bitwrench-guide.md** -- compact code-first tutorial (700 lines)
- **docs/theming.md** -- palette generation, dark mode, custom CSS
- **docs/state-management.md** -- o.state, o.render, handles, slots, pub/sub
