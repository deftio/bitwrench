# State Management

Bitwrench has a three-level component model. Each level adds capability on top of the one below it. You choose the level that fits your use case — there is no single "right" way.

| Level | What you get | When to use it |
|-------|-------------|---------------|
| Level 0 -- TACO data | A plain JavaScript object describing UI | Static content, server rendering, serialization |
| Level 1 -- DOM rendering | A live DOM element with optional lifecycle hooks | Render-once UI, manual state management |
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
| `bw.pub(topic, detail)` | Publish to app-wide topic |
| `bw.sub(topic, handler, el?)` | Subscribe to app-wide topic |
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

## Choosing a Pattern

| Situation | Recommended approach |
|-----------|---------------------|
| Static content, server rendering | Level 0 -- TACO data, `bw.html()` |
| Interactive widget, full control | Level 1 -- manual `bw.DOM()` re-renders |
| Stateful component with changing data | Level 2 -- `o.state` + `o.render` + `bw.update()` |
| Server pushes UI updates | Level 1 -- `bw.patch()` / `bw.DOM()` |
| Components need to talk to each other | `bw.pub()`/`bw.sub()` |
| Debugging component state | `el._bw_state` in the console, or `bw.inspect(selector)` |

---

## Removed: bw.component() and ComponentHandle (v2.0.19)

`bw.component()`, `bw.compile()`, `bw.when()`, `bw.each()`, and the entire ComponentHandle class were removed in v2.0.19. Calling these functions now throws an Error. They have been replaced by:

- **`o.handle`** -- attach named methods directly to the DOM element via `el.bw`
- **`o.slots`** -- auto-generate `el.bw.setX()` / `el.bw.getX()` pairs for content areas
- **`bw.mount(target, taco)`** -- like `bw.DOM()` but returns the root element for direct `el.bw` access
- **`bw.message(target, action, data)`** -- dispatches to `el.bw[action](data)` (still works, rewritten)

### o.handle

Attach explicit methods to the DOM element. Each method receives the element as its first argument (auto-bound):

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

### o.slots

Declare named content areas with CSS selectors. Auto-generates setter/getter pairs:

```javascript
var card = bw.makeCard({ title: 'Stats', content: '0' });
// makeCard has o.slots: { title: '.bw_card_title', content: '.bw_card_body', footer: '.bw_card_footer' }
var el = bw.mount('#app', card);
el.bw.setTitle('Updated Title');
el.bw.setContent({ t: 'strong', c: '42' });  // accepts TACO objects
var text = el.bw.getTitle();                   // returns text content
```

### bw.mount()

Like `bw.DOM()` but returns the created root element instead of the container:

```javascript
var el = bw.mount('#app', bw.makeCarousel({ items: slides }));
el.bw.goToSlide(2);  // direct access to handle methods
```

### BCCL factories with handles

All BCCL factories now include `o.handle` and/or `o.slots`. Examples:

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
