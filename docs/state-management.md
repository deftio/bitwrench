# State Management

Bitwrench has a progressive component model. Each stage adds capability on top of the one below it. You choose the stage that fits your use case — there is no single "right" way.

| Stage | What you get | When to use it |
|-------|-------------|---------------|
| TACO as data | A plain JavaScript object describing UI | Static content, server rendering, serialization |
| Mounting and rendering | A live DOM element with optional lifecycle hooks | Render-once UI, manual state management |
| Component handles | `o.handle` and `o.slots` for imperative control of rendered elements | Update parts of a component without re-rendering |
| Stateful components | A TACO with `o.state` + `o.render` and `bw.refresh()` for re-rendering | Interactive components with changing state |

This guide covers all stages, from simplest to most capable.

> **Coming from React?** A static TACO is like calling `React.createElement()` to get a virtual element. Mounting is like `ReactDOM.render()` with no state. A stateful TACO is like a class component with `this.state` and `this.setState()`, where you call `bw.refresh(el)` instead of `setState`.

> **Coming from Vue?** A static TACO is like a render function's return value. Mounting is like `createApp().mount()`. A stateful TACO is like a component with a `setup()` function that manages its own reactivity, where the render function re-runs on `bw.refresh()`.

> **Coming from Svelte?** A static TACO is like the compiled component descriptor. Mounting is like `new Component({ target })`. A stateful TACO is a live component with state variables, where `bw.refresh(el)` triggers the re-render.

---

## TACO as Data

Every UI element in bitwrench starts as a plain object:

```javascript
var greeting = { t: 'h1', c: 'Hello World' };
```

This is a TACO object — **T**ag, **A**ttributes, **C**ontent, **O**ptions. It describes what you want, not how to render it. See [TACO Format](taco-format.md) for the full specification.

As data, a TACO object is inert. You can:

- Store it in a variable
- Put it in an array with other TACOs
- Pass it to a function
- Serialize it to JSON and send it over the network
- Generate it on a server and send it to a browser

```javascript
// Compose with arrays and functions — standard JavaScript
var items = data.map(function(d) {
  return { t: 'li', c: d.name };
});
var list = { t: 'ul', c: items };
```

### The `make*()` factories

The component library provides over 50 factory functions that return static TACO objects:

```javascript
var card = bw.makeCard({ title: 'Users', content: '1,234 active' });
var btn  = bw.makeButton({ text: 'Save', variant: 'primary' });
var tbl  = bw.makeTable({ data: rows, sortable: true });
```

Each factory takes a props object and returns a TACO. The TACO is data — no DOM elements are created, no event listeners are attached. This is a deliberate design choice: it keeps factories composable, serializable, and usable in server-side rendering.

```javascript
// Compose factory output like any other TACO
var page = {
  t: 'div', c: [
    bw.makeNavbar({ brand: 'My App', items: navItems }),
    bw.makeCard({
      title: 'Dashboard',
      content: bw.makeTable({ data: stats })
    })
  ]
};
```

See [Component Library](component-library.md) for all available factories.

### When static TACOs are enough

Use static TACOs when the content does not change after rendering:

- Static pages and reports
- Server-rendered HTML (`bw.html(taco)` in Node.js)
- Email templates
- Content sent over the network as JSON
- Building up a UI description before deciding how to render it

---

## Mounting and Rendering

To turn a TACO into something visible, pass it to a rendering function:

```javascript
// Render to HTML string (works in Node.js and browsers)
var html = bw.html({ t: 'div', c: 'Hello' });
// '<div>Hello</div>'

// Create a detached DOM element (browser only)
var el = bw.create({ t: 'div', c: 'Hello' });

// Mount into an existing DOM element (browser only)
bw.DOM('#app', { t: 'div', c: 'Hello' });
```

`bw.DOM()` finds the element matching the selector, cleans up any previous content (running unmount hooks, clearing subscriptions), and mounts the new TACO as live DOM.

### Adding interactivity to mounted components

You can make mounted components interactive using closures, `o.state`, and `o.render`:

```javascript
function makeCounter() {
  return {
    t: 'div',
    o: {
      state: { count: 0 },
      render: function(el, state) {
        bw.DOM(el, {
          t: 'div', c: [
            { t: 'span', c: 'Count: ' + state.count },
            { t: 'button', c: '+1', a: {
              onclick: function() {
                state.count++;
                bw.refresh(el);
              }
            }}
          ]
        });
      }
    }
  };
}

bw.DOM('#app', makeCounter());
```

This is the **manual render pump** pattern:

1. Define state in `o.state`
2. Define a render function in `o.render`
3. When state changes, call `bw.refresh(el)` to re-invoke the render function

This pattern works and is fully supported. It gives you direct control over when and how re-rendering happens.

### Lifecycle hooks

Mounted components can respond to mount and unmount events:

```javascript
{
  t: 'div', c: 'I have lifecycle hooks',
  o: {
    mounted: function(el) {
      // Called after the element is inserted into the DOM
      console.log('Mounted:', el);
    },
    unmount: function(el) {
      // Called before the element is removed from the DOM
      // Clean up timers, event listeners, etc.
      console.log('Unmounting:', el);
    }
  }
}
```

> **Warning: Never use `o.mounted` to attach event handlers.** When a stateful component re-renders (after `bw.refresh()`), the old DOM content is replaced and any listeners attached via `addEventListener` in `mounted` are silently lost. Always put event handlers in `a: { onclick: fn }` -- bitwrench re-attaches them on every render. Use `o.mounted` only for non-event setup: timers, observers, third-party library init, measuring dimensions.

### Targeted updates with `bw.patch()`

For fine-grained updates without re-rendering an entire component, use `bw.patch()`:

```javascript
// Give the elements you will update an id
bw.mount('#app', { t: 'p', c: [
  { t: 'span', a: { id: 'count' }, c: '0' }, ' ',
  { t: 'span', a: { id: 'status' }, c: 'Idle' }
]});

// Later, update just that element's content (text, TACO, array or bw.raw)
bw.patch('count', '42');

// A plain object (no t) patches attributes instead
bw.patch('count', { style: 'color: red' });

// Batch multiple patches
bw.patchAll({
  count: '43',
  status: 'Active'
});
```

### When mounting is enough

Use this approach when:

- You need interactivity but want full control over the render cycle
- You are building a one-off interactive widget
- You are integrating with external libraries that manage their own state
- You prefer explicit `bw.refresh()` calls over automatic re-rendering
- You are building the transport layer for server-driven UI (bwserve)

> **Coming from jQuery?** Mounting with `o.render` + `bw.refresh()` is conceptually similar to jQuery's manual DOM updates, but structured. Instead of scattered `$('.count').text(val)` calls, you have a single render function that produces the complete UI from state. When state changes, you call `bw.refresh()` and the render function runs again.

---

## Component Handles

When you need imperative control of a rendered element -- updating a title, advancing a carousel, or reading a form value -- without re-rendering the entire component, use `o.handle` and `o.slots`.

Component handles attach methods directly to the DOM element via `el.bw`. This gives you a clean API to call from outside the component, and it avoids the "re-render kills input focus" problem that plagues full re-render approaches.

### o.handle -- attach methods

Define named methods in `o.handle`. Each method receives the element as its first argument (auto-bound by bitwrench):

```javascript
var carousel = {
  t: 'div', c: '...',
  o: {
    handle: {
      next: function(el) { /* advance slide */ },
      prev: function(el) { /* go back */ },
      goToSlide: function(el, index) { /* jump to slide */ }
    }
  }
};
var el = bw.mount('#app', carousel);
el.bw.next();         // methods are on el.bw
el.bw.goToSlide(3);
```

### o.slots -- auto-generate setters/getters

Declare named content areas with CSS selectors. Bitwrench auto-generates `el.bw.setName()` and `el.bw.getName()` pairs:

```javascript
var card = bw.makeCard({ title: 'Stats', content: '0' });
// makeCard declares o.slots: { title: '.bw_bccl_card_title', content: '.bw_bccl_card_body', footer: '.bw_bccl_card_footer' }
var el = bw.mount('#app', card);
el.bw.setTitle('Updated Title');
el.bw.setContent({ t: 'strong', c: '42' });  // accepts TACO objects
var text = el.bw.getTitle();                   // returns text content
```

Slot setters accept strings or TACO objects. They update just the targeted element -- no full re-render, so input focus, scroll position, and animation state are preserved.

### bw.mount() / bw.DOM() -- get the element back

`bw.mount()` and `bw.DOM()` are identical (aliases). Both return the created root element, which gives you access to `el.bw`:

```javascript
var el = bw.mount('#app', bw.makeCarousel({ items: slides }));
el.bw.goToSlide(2);  // direct access to handle methods
```

### bw.message() -- dispatch by selector

When you don't have a direct reference to the element, use `bw.message()` to dispatch by CSS selector, id, or UUID:

```javascript
bw.message('#my-card', 'setTitle', 'New Title');
bw.message('.bw_uuid_abc123', 'next');
```

### BCCL factories with handles

All BCCL factories include `o.handle` and/or `o.slots`. Examples:

| Factory | Handle methods |
|---------|---------------|
| makeCarousel | goToSlide, next, prev, getActiveIndex, pause, play |
| makeTabs | setActiveTab, getActiveTab |
| makeAccordion | toggle, openAll, closeAll |
| makeModal | open, close |
| makeProgress | setValue, getValue |
| makeChipInput | addChip, removeChip, getChips, clear |
| makeCard | setTitle/getTitle, setContent/getContent, setFooter/getFooter (slots) |
| makeStatCard | setValue/getValue, setLabel/getLabel (slots) |

### When to use handles vs stateful components

| Situation | Use |
|-----------|-----|
| Update a label, badge, or slot text | **Handles** -- `el.bw.setTitle('new')` |
| Advance a carousel or toggle an accordion | **Handles** -- `el.bw.next()`, `el.bw.toggle(0)` |
| Component has complex state that triggers full UI rebuild | **Stateful** -- `o.state` + `o.render` + `bw.refresh()` |
| Need to preserve input focus during updates | **Handles** -- slot setters don't re-render siblings |
| External code needs to control an embedded widget | **Handles** -- `bw.mount()` + `el.bw.method()` |

---

## Stateful Components

Adding `o.state` and `o.render` to a TACO gives it managed state and a render pump. When state changes, you call `bw.refresh(el)` to re-invoke the render function. This is the recommended pattern for interactive components.

```javascript
var counter = {
  t: 'div',
  o: {
    state: { count: 0 },
    render: function(el, state) {
      bw.DOM(el, {
        t: 'div', c: [
          { t: 'h3', c: 'Count: ' + state.count },
          bw.makeButton({ text: '+1', onclick: function() {
            state.count++;
            bw.refresh(el);
          }})
        ]
      });
    }
  }
};

bw.DOM('#app', counter);
```

### How it works

1. `bw.create()` (called internally by `bw.DOM()`) sees `o.state` and copies it to `el._bw_state`
2. If `o.render` is defined, it is stored as `el._bw_render` and called immediately: `o.render(el, el._bw_state)`
3. When state changes, you call `bw.refresh(el)` which re-invokes `el._bw_render(el, el._bw_state)` and emits a `bw:refresh` event
4. The render function produces new content via `bw.DOM(el, ...)`, replacing the old children

### Accessing state

State lives directly on the DOM element as `el._bw_state`:

```javascript
{
  t: 'div',
  o: {
    state: { count: 0, label: 'Clicks' },
    render: function(el, state) {
      bw.DOM(el, {
        t: 'div', c: state.label + ': ' + state.count
      });
    }
  }
}
```

To read or modify state from outside, get a reference to the element:

```javascript
var el = bw.el('my-component');   // or keep the element bw.mount() returned
el._bw_state.count = 42;
bw.refresh(el);
```

### Lifecycle hooks

Stateful components support two primary lifecycle hooks:

| Hook | When it fires | Typical use |
|------|--------------|-------------|
| **`mounted`** | After DOM insertion | Start timers, attach observers, measure dimensions |
| **`unmount`** | Before DOM removal | Clean up timers, detach observers |

```javascript
var timer = {
  t: 'div',
  o: {
    state: { seconds: 0 },
    mounted: function(el) {
      el._interval = setInterval(function() {
        el._bw_state.seconds++;
        bw.refresh(el);
      }, 1000);
    },
    unmount: function(el) {
      clearInterval(el._interval);
    },
    render: function(el, state) {
      bw.DOM(el, { t: 'span', c: 'Elapsed: ' + state.seconds + 's' });
    }
  }
};
```

> **Warning: Never attach event handlers in `o.mounted`.** When `bw.refresh()` re-renders a component, the old DOM children are replaced. Any listeners attached via `addEventListener` in `mounted` are silently lost. Always put event handlers in `a: { onclick: fn }` -- bitwrench re-attaches them on every render.

### Targeted updates with `bw.patch()`

For fine-grained updates without re-rendering an entire component, use `bw.patch()`:

```javascript
var dashboard = {
  t: 'div',
  o: {
    state: { temp: 0 },
    render: function(el, state) {
      bw.DOM(el, {
        t: 'div', c: [
          { t: 'span', a: { class: bw.uuid('temp') }, c: state.temp + ' C' },
          { t: 'span', a: { class: bw.uuid('status') }, c: 'OK' }
        ]
      });
    }
  }
};

bw.DOM('#app', dashboard);

// Later, update just specific elements without a full re-render
bw.patch('temp', '23.5 C');
bw.patch('status', 'Warning');
```

### When to use stateful components

Use stateful components when:

- The component has state that changes after initial render
- You need a render function that re-runs on state changes
- You need lifecycle management (mount, unmount)
- You want explicit control over what triggers a re-render

> **Coming from React?** A stateful TACO is like a class component with `this.state` and a manual `forceUpdate()`. The render function rebuilds the component from state each time `bw.refresh()` is called.

> **Coming from jQuery?** A stateful TACO with `o.render` + `bw.refresh()` is conceptually similar to jQuery's manual DOM updates, but structured. Instead of scattered `$('.count').text(val)` calls, you have a single render function that produces the complete UI from state.

---

## Progressing Between Stages

You can start at any stage and progress when you need more capability.

### From Data to DOM

Pass a TACO to a rendering function:

```javascript
var taco = bw.makeCard({ title: 'Hello' });  // static TACO
bw.DOM('#app', taco);                          // mounted — now it's in the DOM
```

### From Data to Stateful

Add `o.state` and `o.render` to make a static TACO stateful:

```javascript
// Start with a static TACO
var card = bw.makeCard({ title: 'Hello' });

// Wrap in a stateful container
var statefulCard = {
  t: 'div',
  o: {
    state: { title: 'Hello' },
    render: function(el, state) {
      bw.DOM(el, bw.makeCard({ title: state.title }));
    }
  }
};
bw.DOM('#app', statefulCard);
```

### From Mounted to Stateful

If you have a mounted component using manual `bw.DOM()` calls, add `o.state` and `o.render`:

**Before (manual re-render):**
```javascript
var count = 0;
function renderCounter() {
  bw.DOM('#app', {
    t: 'div', c: [
      { t: 'span', c: 'Count: ' + count },
      { t: 'button', c: '+1', a: {
        onclick: function() { count++; renderCounter(); }
      }}
    ]
  });
}
renderCounter();
```

**After (stateful TACO):**
```javascript
bw.DOM('#app', {
  t: 'div',
  o: {
    state: { count: 0 },
    render: function(el, state) {
      bw.DOM(el, {
        t: 'div', c: [
          { t: 'span', c: 'Count: ' + state.count },
          { t: 'button', c: '+1', a: {
            onclick: function() { state.count++; bw.refresh(el); }
          }}
        ]
      });
    }
  }
});
```

The stateful version encapsulates state inside the component. No external variable, no standalone render function. The render function is called automatically on mount and on each `bw.refresh(el)` call.

---

## Cross-Component Communication

Bitwrench provides three mechanisms for components to communicate, each suited to different relationship types.

### Shared state (parent-child)

Multiple components can share the same state object. When either calls `bw.refresh()`, it re-renders with the current shared state:

```javascript
var appState = { user: { name: 'Alice' }, items: [] };

var header = {
  t: 'header',
  o: {
    state: appState,
    render: function(el, state) {
      bw.DOM(el, { t: 'span', c: 'Hello, ' + state.user.name });
    }
  }
};

var main = {
  t: 'main',
  o: {
    state: appState,
    render: function(el, state) {
      bw.DOM(el, {
        t: 'div', c: state.items.map(function(item) {
          return { t: 'div', c: item.text };
        })
      });
    }
  }
};
```

### Pub/sub (siblings, decoupled)

Use `bw.pub()` and `bw.sub()` for app-wide topic-based messaging:

```javascript
// Publisher
var searchBox = { t: 'input', a: { oninput: function(e) {
  bw.pub('search:changed', { query: e.target.value });
}}};

// Subscriber
var results = {
  t: 'div',
  o: {
    state: { query: '' },
    mounted: function(el) {
      bw.sub('search:changed', function(detail) {
        el._bw_state.query = detail.query;
        bw.refresh(el);
      }, el);
    },
    render: function(el, state) {
      bw.DOM(el, { t: 'span', c: 'Results for: ' + state.query });
    }
  }
};
```

Pub/sub is app-scoped -- publishers and subscribers do not need to know about each other. Pass the element as the third argument to `bw.sub()` to tie the subscription's lifetime to the element (auto-cleaned on `bw.unmount()`).

Wildcard subscriptions let you listen to a group of related topics at once:

```javascript
// Listen to ALL search-related topics
bw.sub('search:*', function(detail, topic) {
  console.log('Search event:', topic, detail);
}, el);

// These all fire the wildcard handler above:
bw.pub('search:changed', { query: 'foo' });
bw.pub('search:cleared');
bw.pub('search:submitted', { query: 'foo' });
```

### Updating child widgets within a parent component

When a parent component contains child sub-components (like a progress bar inside a dashboard card), use pub/sub to update the child:

```javascript
// Dashboard with a progress indicator, updated via pub/sub
var progressId = bw.uuid('progress');

bw.DOM('#app', {
  t: 'div',
  o: {
    state: { pct: 0 },
    mounted: function(el) {
      bw.sub('upload:progress', function(d) {
        el._bw_state.pct = d.pct;
        bw.refresh(el);
      }, el);
    },
    render: function(el, state) {
      bw.DOM(el, {
        t: 'div', c: [
          { t: 'h2', c: 'Upload Progress' },
          bw.makeProgress({ value: state.pct, label: state.pct + '%' }),
          bw.makeButton({ text: 'Start', onclick: function() {
            var pct = 0;
            var interval = setInterval(function() {
              pct += 10;
              bw.pub('upload:progress', { pct: pct });
              if (pct >= 100) clearInterval(interval);
            }, 500);
          }})
        ]
      });
    }
  }
});
```

### Re-mount, patch, or sync?

Re-mounting a whole view on every change is fine for small views -- a MIDI
practice app that re-mounts on every note on/off never notices. It stops being fine when the
view holds something the user is in the middle of using, because a re-mount
replaces those elements:

- **An input being edited or dragged** loses focus, caret or drag. Re-mounting
  a settings panel from a range slider's `input` event ends the drag after one
  step.
- **A long list** rebuilds every row to change one.

Two tools cover those cases.

**Patch the part that changes.** Leave the input alone and update only what
depends on it:

```javascript
bw.mount('#settings', { t: 'label', c: [
  'Tempo ',
  { t: 'input', a: { type: 'range', min: 40, max: 240, value: 120,
      oninput:  function(e) { bw.patch('tempo_value', e.target.value + ' bpm'); },  // live label
      onchange: function(e) { saveSetting('tempo', +e.target.value); } } },      // commit on release
  { t: 'span', a: { id: 'tempo_value' }, c: '120 bpm' }
]});
```

### Keyed lists with bw.syncChildren()

For a list that changes, `bw.syncChildren()` matches existing children to your
data by key. Rows whose key is still present are the **same DOM nodes** --
moved if the order changed, updated in place if you pass `update` -- so their
focus, scroll position and state survive. Only new keys are created and only
missing keys are removed (with their unmount hooks).

```javascript
var list = bw.mount('#held', { t: 'ul', a: { class: 'held_notes' } });

var listOpts = {
  key:    function(note) { return String(note.midi); },
  create: function(note) { return { t: 'li', c: note.name }; },
  update: function(el, note) { bw.patch(el, note.name + (note.sustained ? ' (sus)' : '')); }
};

// Call whenever the data changes -- first call creates, later calls reconcile
function renderHeld(notes) { bw.syncChildren(list, notes, listOpts); }

renderHeld([{ midi: 60, name: 'C4' }, { midi: 64, name: 'E4' }]);
renderHeld([{ midi: 64, name: 'E4', sustained: true }, { midi: 67, name: 'G4' }]);
// C4's <li> removed, E4's <li> updated in place and moved first, G4's created
```

`key` must return a string that is unique within the list. `create` returns a
TACO. `update` is optional; without it, kept rows are only moved.

---

## Low-Level Primitives

These primitives are the building blocks of the stateful TACO model. They are also useful standalone for server-driven UI transport, integration with external libraries, and performance-critical update paths.

### Quick reference

| Function | Purpose |
|----------|---------|
| `bw.refresh(ref)` | Re-invoke `el._bw_render(el, state)` to re-render |
| `bw.update(ref, data)` | Dispatch to `el.bw.update(data)` |
| `bw.patch(uuid, content, attr)` | Update a single UUID-addressed element |
| `bw.patchAll(patches)` | Batch-update multiple UUID-addressed elements |
| `bw.uuid(prefix)` | Generate a UUID class for addressing |
| `bw.emit(el, event, detail)` | Dispatch a CustomEvent on a DOM element |
| `bw.on(el, event, handler)` | Listen for a CustomEvent on a DOM element |
| `bw.pub(topic, detail)` | Publish to app-wide topic (fires exact + wildcard matches) |
| `bw.sub(topic, handler, el?)` | Subscribe to topic (supports wildcard `'ns:*'` patterns) |
| `bw.once(topic, handler, el?)` | One-shot subscribe (auto-unsub after first fire) |
| `bw.unsub(topic, handler)` | Unsubscribe from topic |
| `bw.unmount(el)` | Tear down subtree lifecycle |
| `bw.mountTree(el)` | Register an inserted subtree |
| `bw.unmountChildren(el)` | Unmount descendants only |
| `bw.detach(el)` | Keep-alive disconnect |
| `bw.hydrate(el, taco)` | Wire lifecycle onto existing DOM |
| `bw.append(target, taco)` | Add child without removing existing |
| `bw.replace(ref, taco)` | Swap element at DOM position |
| `bw.remove(ref)` | Unmount + remove from DOM |

### `bw.emit()` / `bw.on()` vs `bw.pub()` / `bw.sub()`

Bitwrench has two event systems that serve different purposes:

| | `bw.emit()` / `bw.on()` | `bw.pub()` / `bw.sub()` |
|---|---|---|
| Scope | DOM element and its ancestors (bubbles) | App-wide (all subscribers) |
| Addressing | By DOM element reference | By topic string |
| Use case | Parent-child DOM communication | Decoupled cross-component messaging |
| Cleanup | Manual or via bw.unmount() | Auto-cleanup via `handle.sub()` or element lifecycle |

---

## Shared State Across Views

When building multi-view apps (SPAs, dashboards with panels, tabbed interfaces), you need shared state that persists across view switches. The canonical bitwrench pattern: a plain object store with topic-scoped pub/sub.

### The pattern

```javascript
// 1. Store is a plain object
var store = {
  todos: [],
  projects: [],
  user: { name: 'Alice' }
};

// 2. Update function publishes scoped topics
function updateStore(key, value) {
  store[key] = value;
  bw.pub('store:' + key, value);  // topic per data slice
}
```

### Scoped subscriptions

Each view subscribes only to the data it needs. Pass `el` as the third argument so the subscription auto-cleans when the view unmounts:

```javascript
// Todo view -- only re-renders when todos change
function renderTodoView(target) {
  var el = bw.mount(target, {
    t: 'div',
    o: {
      state: { items: store.todos },
      mounted: function(el) {
        bw.sub('store:todos', function(todos) {
          el._bw_state.items = todos;
          bw.refresh(el);
        }, el);  // auto-unsubscribes when view is removed
      },
      render: function(el, state) {
        bw.DOM(el, { t: 'ul', c: state.items.map(function(item) {
          return { t: 'li', c: item.text };
        })});
      }
    }
  });
}

// Project view -- only re-renders when projects change
function renderProjectView(target) {
  var el = bw.mount(target, {
    t: 'div',
    o: {
      state: { projects: store.projects },
      mounted: function(el) {
        bw.sub('store:projects', function(projects) {
          el._bw_state.projects = projects;
          bw.refresh(el);
        }, el);
      },
      render: function(el, state) {
        // ... render projects
      }
    }
  });
}
```

### Anti-pattern: single topic

Do NOT use a single `'store:changed'` topic that re-renders everything:

<!-- doc-test: skip (WRONG/RIGHT sketch; renderTodos and todosEl are the reader's) -->
```javascript
// WRONG -- every view re-renders on every store change
bw.sub('store:changed', function() {
  renderTodoView('#todos');
  renderProjectView('#projects');
  renderUserHeader('#header');
}, el);

// RIGHT -- each view subscribes to its own data slice
bw.sub('store:todos', renderTodos, todosEl);
bw.sub('store:projects', renderProjects, projectsEl);
```

If you need a global listener (e.g. for logging or debug), use a wildcard:

```javascript
// OK for debug/logging -- not for rendering
bw.sub('store:*', function(data, topic) {
  console.log('[store]', topic, data);
});
```

### When to use

- Multi-view SPAs where views share data
- Dashboard panels that react to shared metrics
- Any app with >1 view reading from the same data source

For surgical updates within a view (changing a title, updating a counter), use [component handles](state-management.md#component-handles) instead of a full re-render.

For URL-driven view switching, combine with [bw.router()](routing.md):

```javascript
bw.router({
  target: '#app',
  routes: {
    '/todos':    function() { return makeTodoView(); },
    '/projects': function() { return makeProjectView(); }
  }
});
```

---

## Choosing a Pattern

| Situation | Recommended approach |
|-----------|---------------------|
| Static content, server rendering | Static TACO data, `bw.html()` |
| Interactive widget, full control | Mounted -- manual `bw.DOM()` re-renders |
| Update a slot, label, or control a widget | Component handles -- `o.handle` / `o.slots` via `bw.mount()` + `el.bw` |
| Stateful component with changing data | Stateful -- `o.state` + `o.render` + `bw.refresh()` |
| Server pushes UI updates | Mounted -- `bw.patch()` / `bw.DOM()` |
| Components need to talk to each other | `bw.pub()`/`bw.sub()` |
| URL-driven views (SPA) | `bw.router()` -- see [Routing](routing.md) |
| Debugging component state | `el._bw_state` in the console, or `bw.inspect(selector, 0)` |

---

## Removed: bw.component() (v2.0.19)

`bw.component()`, `bw.compile()`, `bw.when()`, and `bw.each()` were removed in v2.0.19. These functions are now `undefined`. Their functionality is replaced by `o.handle`, `o.slots`, and `bw.mount()` -- see [Component Handles](#component-handles) above.
