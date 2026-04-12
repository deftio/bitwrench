# State Management

Bitwrench has a three-level component model. Each level adds capability on top of the one below it. You choose the level that fits your use case — there is no single "right" way.

| Level | What you get | When to use it |
|-------|-------------|---------------|
| Level 0 -- TACO data | A plain JavaScript object describing UI | Static content, server rendering, serialization |
| Level 1 -- DOM rendering | A live DOM element with optional lifecycle hooks | Render-once UI, manual state management |
| Level 1.5 -- Component handles | `o.handle` and `o.slots` for imperative control of rendered elements | Update parts of a component without re-rendering |
| Level 2 -- Stateful TACO | A TACO with `o.state` + `o.render` and `bw.update()` for re-rendering | Interactive components with changing state |

This guide covers all three levels, from simplest to most capable.

> **Coming from React?** Level 0 is like calling `React.createElement()` to get a virtual element. Level 1 is like `ReactDOM.render()` with no state. Level 2 is like a class component with `this.state` and `this.setState()`, where you call `bw.update(el)` instead of `setState`.

> **Coming from Vue?** Level 0 is like a render function's return value. Level 1 is mounting with `createApp().mount()`. Level 2 is like a component with a `setup()` function that manages its own reactivity, where the render function re-runs on `bw.update()`.

> **Coming from Svelte?** Level 0 is like the compiled component descriptor. Level 1 is mounting with `new Component({ target })`. Level 2 is a live component with state variables, where `bw.update(el)` triggers the re-render.

---

## Level 0: TACO as Data

Every UI element in bitwrench starts as a plain object:

```javascript
var greeting = { t: 'h1', c: 'Hello World' };
```

This is a TACO object — **T**ag, **A**ttributes, **C**ontent, **O**ptions. It describes what you want, not how to render it. See [TACO Format](taco-format.md) for the full specification.

At Level 0, a TACO object is inert data. You can:

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

The component library provides over 50 factory functions that return Level 0 TACO objects:

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

### When Level 0 is enough

Use Level 0 when the content does not change after rendering:

- Static pages and reports
- Server-rendered HTML (`bw.html(taco)` in Node.js)
- Email templates
- Content sent over the network as JSON
- Building up a UI description before deciding how to render it

---

## Level 1: Fire-and-Forget DOM Rendering

To turn a TACO into something visible, pass it to a rendering function:

```javascript
// Render to HTML string (works in Node.js and browsers)
var html = bw.html({ t: 'div', c: 'Hello' });
// '<div>Hello</div>'

// Create a detached DOM element (browser only)
var el = bw.createDOM({ t: 'div', c: 'Hello' });

// Mount into an existing DOM element (browser only)
bw.DOM('#app', { t: 'div', c: 'Hello' });
```

`bw.DOM()` finds the element matching the selector, cleans up any previous content (running unmount hooks, clearing subscriptions), and mounts the new TACO as live DOM.

### Adding interactivity at Level 1

You can make Level 1 components interactive using closures, `o.state`, and `o.render`:

```javascript
function makeCounter() {
  return {
    t: 'div',
    o: {
      state: { count: 0 },
      render: function(el) {
        bw.DOM(el, {
          t: 'div', c: [
            { t: 'span', c: 'Count: ' + el._bw_state.count },
            { t: 'button', c: '+1', a: {
              onclick: function() {
                el._bw_state.count++;
                bw.update(el);
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
3. When state changes, call `bw.update(el)` to re-invoke the render function

This pattern works and is fully supported. It gives you direct control over when and how re-rendering happens.

### Lifecycle hooks

Level 1 components can respond to mount and unmount events:

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

> **Warning: Never use `o.mounted` to attach event handlers.** When a stateful component re-renders (after `bw.update()`), the old DOM content is replaced and any listeners attached via `addEventListener` in `mounted` are silently lost. Always put event handlers in `a: { onclick: fn }` -- bitwrench re-attaches them on every render. Use `o.mounted` only for non-event setup: timers, observers, third-party library init, measuring dimensions.

### Targeted updates with `bw.patch()`

For fine-grained updates without re-rendering an entire component, use `bw.patch()`:

```javascript
// Give an element a UUID for addressing
var display = { t: 'span', a: { class: bw.uuid('count') }, c: '0' };

// Later, update just that element's content
bw.patch('count', '42');

// Update content and attributes together
bw.patch('count', '42', { style: 'color: red' });

// Batch multiple patches
bw.patchAll({
  count: '42',
  status: 'Active',
  label: 'Updated'
});
```

### When Level 1 is enough

Use Level 1 when:

- You need interactivity but want full control over the render cycle
- You are building a one-off interactive widget
- You are integrating with external libraries that manage their own state
- You prefer explicit `bw.update()` calls over automatic re-rendering
- You are building the transport layer for server-driven UI (bwserve)

> **Coming from jQuery?** Level 1 with `o.render` + `bw.update()` is conceptually similar to jQuery's manual DOM updates, but structured. Instead of scattered `$('.count').text(val)` calls, you have a single render function that produces the complete UI from state. When state changes, you call `bw.update()` and the render function runs again.

---

## Level 1.5: Component Handles

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
// makeCard declares o.slots: { title: '.bw_card_title', content: '.bw_card_body', footer: '.bw_card_footer' }
var el = bw.mount('#app', card);
el.bw.setTitle('Updated Title');
el.bw.setContent({ t: 'strong', c: '42' });  // accepts TACO objects
var text = el.bw.getTitle();                   // returns text content
```

Slot setters accept strings or TACO objects. They update just the targeted element -- no full re-render, so input focus, scroll position, and animation state are preserved.

### bw.mount() -- get the element back

`bw.mount()` works like `bw.DOM()` but returns the created root element instead of the container. This is how you get access to `el.bw`:

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

### When to use handles vs Level 2

| Situation | Use |
|-----------|-----|
| Update a label, badge, or slot text | **Handles** -- `el.bw.setTitle('new')` |
| Advance a carousel or toggle an accordion | **Handles** -- `el.bw.next()`, `el.bw.toggle(0)` |
| Component has complex state that triggers full UI rebuild | **Level 2** -- `o.state` + `o.render` + `bw.update()` |
| Need to preserve input focus during updates | **Handles** -- slot setters don't re-render siblings |
| External code needs to control an embedded widget | **Handles** -- `bw.mount()` + `el.bw.method()` |

---

## Level 2: Stateful TACO

Level 2 adds `o.state` and `o.render` to a TACO, giving it managed state and a render pump. When state changes, you call `bw.update(el)` to re-invoke the render function. This is the recommended pattern for interactive components.

```javascript
var counter = {
  t: 'div',
  o: {
    state: { count: 0 },
    render: function(el) {
      var s = el._bw_state;
      bw.DOM(el, {
        t: 'div', c: [
          { t: 'h3', c: 'Count: ' + s.count },
          bw.makeButton({ text: '+1', onclick: function() {
            s.count++;
            bw.update(el);
          }})
        ]
      });
    }
  }
};

bw.DOM('#app', counter);
```

### How it works

1. `bw.createDOM()` (called internally by `bw.DOM()`) sees `o.state` and copies it to `el._bw_state`
2. If `o.render` is defined, it is stored as `el._bw_render` and called immediately: `o.render(el, el._bw_state)`
3. When state changes, you call `bw.update(el)` which re-invokes `el._bw_render(el, el._bw_state)` and emits a `bw:statechange` event
4. The render function produces new content via `bw.DOM(el, ...)`, replacing the old children

### Accessing state

State lives directly on the DOM element as `el._bw_state`:

```javascript
{
  t: 'div',
  o: {
    state: { count: 0, label: 'Clicks' },
    render: function(el) {
      var s = el._bw_state;
      bw.DOM(el, {
        t: 'div', c: s.label + ': ' + s.count
      });
    }
  }
}
```

To read or modify state from outside, get a reference to the element:

```javascript
var el = bw.$('#my-component')[0];
el._bw_state.count = 42;
bw.update(el);
```

### Lifecycle hooks

Stateful TACOs support two primary lifecycle hooks:

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
        bw.update(el);
      }, 1000);
    },
    unmount: function(el) {
      clearInterval(el._interval);
    },
    render: function(el) {
      bw.DOM(el, { t: 'span', c: 'Elapsed: ' + el._bw_state.seconds + 's' });
    }
  }
};
```

> **Warning: Never attach event handlers in `o.mounted`.** When `bw.update()` re-renders a component, the old DOM children are replaced. Any listeners attached via `addEventListener` in `mounted` are silently lost. Always put event handlers in `a: { onclick: fn }` -- bitwrench re-attaches them on every render.

### Targeted updates with `bw.patch()`

For fine-grained updates without re-rendering an entire component, use `bw.patch()`:

```javascript
var dashboard = {
  t: 'div',
  o: {
    state: { temp: 0 },
    render: function(el) {
      var s = el._bw_state;
      bw.DOM(el, {
        t: 'div', c: [
          { t: 'span', a: { class: bw.uuid('temp') }, c: s.temp + ' C' },
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

### When to use Level 2

Use Level 2 when:

- The component has state that changes after initial render
- You need a render function that re-runs on state changes
- You need lifecycle management (mount, unmount)
- You want explicit control over what triggers a re-render

> **Coming from React?** Level 2 is like a class component with `this.state` and a manual `forceUpdate()`. The render function rebuilds the component from state each time `bw.update()` is called.

> **Coming from jQuery?** Level 2 with `o.render` + `bw.update()` is conceptually similar to jQuery's manual DOM updates, but structured. Instead of scattered `$('.count').text(val)` calls, you have a single render function that produces the complete UI from state.

---

## Escalating Between Levels

You can start at any level and escalate when you need more capability.

### Level 0 → Level 1

Pass a TACO to a rendering function:

```javascript
var taco = bw.makeCard({ title: 'Hello' });  // Level 0
bw.DOM('#app', taco);                          // Level 1 — now it's in the DOM
```

### Level 0 => Level 2

Add `o.state` and `o.render` to make a static TACO stateful:

```javascript
// Start with Level 0
var card = bw.makeCard({ title: 'Hello' });

// Wrap in a stateful container
var statefulCard = {
  t: 'div',
  o: {
    state: { title: 'Hello' },
    render: function(el) {
      bw.DOM(el, bw.makeCard({ title: el._bw_state.title }));
    }
  }
};
bw.DOM('#app', statefulCard);
```

### Level 1 => Level 2

If you have a Level 1 component using manual `bw.DOM()` calls, add `o.state` and `o.render`:

**Before (Level 1 -- manual re-render):**
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

**After (Level 2 -- stateful TACO):**
```javascript
bw.DOM('#app', {
  t: 'div',
  o: {
    state: { count: 0 },
    render: function(el) {
      var s = el._bw_state;
      bw.DOM(el, {
        t: 'div', c: [
          { t: 'span', c: 'Count: ' + s.count },
          { t: 'button', c: '+1', a: {
            onclick: function() { s.count++; bw.update(el); }
          }}
        ]
      });
    }
  }
});
```

The Level 2 version encapsulates state inside the component. No external variable, no standalone render function. The render function is called automatically on mount and on each `bw.update(el)` call.

---

## Cross-Component Communication

Bitwrench provides three mechanisms for components to communicate, each suited to different relationship types.

### Shared state (parent-child)

Multiple components can share the same state object. When either calls `bw.update()`, it re-renders with the current shared state:

```javascript
var appState = { user: { name: 'Alice' }, items: [] };

var header = {
  t: 'header',
  o: {
    state: appState,
    render: function(el) {
      bw.DOM(el, { t: 'span', c: 'Hello, ' + el._bw_state.user.name });
    }
  }
};

var main = {
  t: 'main',
  o: {
    state: appState,
    render: function(el) {
      var s = el._bw_state;
      bw.DOM(el, {
        t: 'div', c: s.items.map(function(item) {
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
        bw.update(el);
      }, el);
    },
    render: function(el) {
      bw.DOM(el, { t: 'span', c: 'Results for: ' + el._bw_state.query });
    }
  }
};
```

Pub/sub is app-scoped -- publishers and subscribers do not need to know about each other. Pass the element as the third argument to `bw.sub()` to tie the subscription's lifetime to the element (auto-cleaned on `bw.cleanup()`).

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
        bw.update(el);
      }, el);
    },
    render: function(el) {
      var s = el._bw_state;
      bw.DOM(el, {
        t: 'div', c: [
          { t: 'h2', c: 'Upload Progress' },
          bw.makeProgress({ value: s.pct, label: s.pct + '%' }),
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

---

## Low-Level Primitives

These primitives are the building blocks of the stateful TACO model. They are also useful standalone for server-driven UI transport, integration with external libraries, and performance-critical update paths.

### Quick reference

| Function | Purpose |
|----------|---------|
| `bw.update(el)` | Re-invoke `el._bw_render(el)` to re-render |
| `bw.patch(uuid, content, attr)` | Update a single UUID-addressed element |
| `bw.patchAll(patches)` | Batch-update multiple UUID-addressed elements |
| `bw.uuid(prefix)` | Generate a UUID class for addressing |
| `bw.emit(el, event, detail)` | Dispatch a CustomEvent on a DOM element |
| `bw.on(el, event, handler)` | Listen for a CustomEvent on a DOM element |
| `bw.pub(topic, detail)` | Publish to app-wide topic (fires exact + wildcard matches) |
| `bw.sub(topic, handler, el?)` | Subscribe to topic (supports wildcard `'ns:*'` patterns) |
| `bw.once(topic, handler, el?)` | One-shot subscribe (auto-unsub after first fire) |
| `bw.unsub(topic, handler)` | Unsubscribe from topic |
| `bw.cleanup(el)` | Run unmount hooks and clear subscriptions |

### `bw.emit()` / `bw.on()` vs `bw.pub()` / `bw.sub()`

Bitwrench has two event systems that serve different purposes:

| | `bw.emit()` / `bw.on()` | `bw.pub()` / `bw.sub()` |
|---|---|---|
| Scope | DOM element and its ancestors (bubbles) | App-wide (all subscribers) |
| Addressing | By DOM element reference | By topic string |
| Use case | Parent-child DOM communication | Decoupled cross-component messaging |
| Cleanup | Manual or via bw.cleanup() | Auto-cleanup via `handle.sub()` or element lifecycle |

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
          bw.update(el);
        }, el);  // auto-unsubscribes when view is removed
      },
      render: function(el) {
        var s = el._bw_state;
        bw.DOM(el, { t: 'ul', c: s.items.map(function(item) {
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
          bw.update(el);
        }, el);
      },
      render: function(el) {
        // ... render projects
      }
    }
  });
}
```

### Anti-pattern: single topic

Do NOT use a single `'store:changed'` topic that re-renders everything:

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

For surgical updates within a view (changing a title, updating a counter), use [Level 1.5 handles](state-management.md#level-15-component-handles) instead of a full re-render.

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
| Static content, server rendering | Level 0 -- TACO data, `bw.html()` |
| Interactive widget, full control | Level 1 -- manual `bw.DOM()` re-renders |
| Update a slot, label, or control a widget | Level 1.5 -- `o.handle` / `o.slots` via `bw.mount()` + `el.bw` |
| Stateful component with changing data | Level 2 -- `o.state` + `o.render` + `bw.update()` |
| Server pushes UI updates | Level 1 -- `bw.patch()` / `bw.DOM()` |
| Components need to talk to each other | `bw.pub()`/`bw.sub()` |
| URL-driven views (SPA) | `bw.router()` -- see [Routing](routing.md) |
| Debugging component state | `el._bw_state` in the console, or `bw.inspect(selector, 0)` |

---

## Removed: bw.component() (v2.0.19)

`bw.component()`, `bw.compile()`, `bw.when()`, and `bw.each()` were removed in v2.0.19. Calling these functions now throws an Error. Their functionality is replaced by `o.handle`, `o.slots`, and `bw.mount()` -- see [Level 1.5: Component Handles](#level-15-component-handles) above.
