# State Management

Bitwrench has a three-level component model. Each level adds capability on top of the one below it. You choose the level that fits your use case — there is no single "right" way.

| Level | What you get | When to use it |
|-------|-------------|---------------|
| Level 0 — TACO data | A plain JavaScript object describing UI | Static content, server rendering, serialization |
| Level 1 — DOM rendering | A live DOM element with optional lifecycle hooks | Render-once UI, manual state management |
| Level 2 — ComponentHandle | A managed object with `.get()`, `.set()`, template bindings, and automatic re-rendering | Interactive components with changing state |

This guide covers all three levels, from simplest to most capable.

> **Coming from React?** Level 0 is like calling `React.createElement()` to get a virtual element. Level 1 is like `ReactDOM.render()` with no state. Level 2 is like a class component with `this.state` and `this.setState()`.

> **Coming from Vue?** Level 0 is like a render function's return value. Level 1 is mounting with `createApp().mount()`. Level 2 is a component instance with reactive `ref()`s and automatic template updates.

> **Coming from Svelte?** Level 0 is like the compiled component descriptor. Level 1 is mounting with `new Component({ target })`. Level 2 is a live component instance with `$state` variables that trigger re-renders when changed.

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

> **Warning: Never use `o.mounted` to attach event handlers.** When a Level 2 component re-renders (after `.set()`), the old DOM element is replaced and any listeners attached via `addEventListener` in `mounted` are silently lost. Always put event handlers in `a: { onclick: fn }` — bitwrench re-attaches them on every render. Use `o.mounted` only for non-event setup: timers, observers, third-party library init, measuring dimensions.

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

## Level 2: ComponentHandle

Level 2 wraps a TACO in a `ComponentHandle` — an object with a managed API for state, events, and automatic re-rendering. This is the recommended pattern for interactive components.

```javascript
var counter = bw.component({
  t: 'div', c: [
    { t: 'h3', c: 'Count: ${count}' },
    { t: 'button', c: '+1', a: {
      onclick: function() { counter.set('count', counter.get('count') + 1); }
    }}
  ],
  o: { state: { count: 0 } }
});

bw.DOM('#app', counter);
counter.set('count', 42);  // DOM updates automatically
```

### Creating a ComponentHandle

Call `bw.component()` with a TACO object:

```javascript
var handle = bw.component({
  t: 'div',
  c: 'Value: ${value}',
  o: {
    state: { value: 'hello' }
  }
});
```

The handle is not yet in the DOM. It holds the TACO definition and manages state, but no DOM element exists until you mount it.

### Template bindings

Content strings and attribute values can contain `${expr}` expressions that resolve against component state:

```javascript
var profile = bw.component({
  t: 'div', c: [
    { t: 'h2', c: '${user.name}' },
    { t: 'p', c: 'Email: ${user.email}' },
    { t: 'span', a: { class: 'badge ${status}' }, c: '${status}' }
  ],
  o: {
    state: {
      user: { name: 'Alice', email: 'alice@example.com' },
      status: 'active'
    }
  }
});
```

When you call `handle.set('status', 'inactive')`, every binding that depends on `status` updates automatically. Only the affected DOM nodes are patched — there is no full re-render.

**Tier 1 expressions** (default) support dot-path lookups: `${user.name}`, `${items.length}`. These are CSP-safe and work in all environments.

**Tier 2 expressions** (via `bw.compile()`) support full JavaScript: `${count * 2}`, `${items.length > 0 ? 'has items' : 'empty'}`. These use `new Function` internally and require a CSP policy that allows `unsafe-eval`.

### Mounting and unmounting

```javascript
// Mount into a DOM element
handle.mount(document.getElementById('app'));

// Or use bw.DOM() — it detects ComponentHandle and calls .mount()
bw.DOM('#app', handle);

// Unmount (preserves state for re-mounting)
handle.unmount();

// Re-mount into a different element
handle.mount(document.getElementById('sidebar'));

// Destroy (unmount + clear all state and listeners)
handle.destroy();
```

### State API

```javascript
// Read state
handle.get('count');              // single value
handle.get('user.name');          // dot-path
handle.getState();                // shallow copy of entire state

// Write state (schedules re-render)
handle.set('count', 42);
handle.set('user.name', 'Bob');

// Merge multiple keys (one re-render)
handle.setState({ count: 42, label: 'Updated' });

// Array operations
handle.push('items', newItem);
handle.splice('items', 2, 1);    // remove 1 item at index 2
```

#### Microtask batching

Multiple `.set()` calls in the same synchronous block produce a single re-render:

```javascript
handle.set('firstName', 'Alice');
handle.set('lastName', 'Smith');
handle.set('age', 30);
// Only ONE re-render happens (on the next microtask)
```

Bitwrench schedules re-renders using `Promise.resolve().then(flush)`. All state changes within the current synchronous execution collect into a single batch, and the DOM updates once.

To force an immediate synchronous render (useful in tests):

```javascript
handle.set('count', 42, { sync: true });
// DOM is updated right now

// Or flush all pending updates
bw.flush();
```

### Methods

Define reusable behavior with `o.methods`. Methods are promoted to the handle's API:

```javascript
var counter = bw.component({
  t: 'div', c: '${count}',
  o: {
    state: { count: 0 },
    methods: {
      increment: function(comp, amount) {
        comp.set('count', comp.get('count') + (amount || 1));
      },
      reset: function(comp) {
        comp.set('count', 0);
      }
    }
  }
});

bw.DOM('#app', counter);

// Methods are callable directly on the handle
counter.increment(5);   // count → 5
counter.increment();    // count → 6
counter.reset();        // count → 0
```

The first argument to every method is always the ComponentHandle itself (`comp`). When you call `counter.increment(5)`, bitwrench calls `methods.increment(counter, 5)`.

> **Coming from React?** Methods are similar to handler functions defined inside a component, but they live on the component instance rather than being closures. This is closer to class component methods than hooks.

> **Coming from Vue?** Methods map directly to Vue's `methods` option. The difference is that `this` in Vue methods refers to the component instance, while bitwrench passes the handle as the first explicit argument.

### Actions

Actions are event handlers that can be wired to DOM elements by name. They are registered in a global function registry, which enables server-driven UI — a server can reference actions by name without sending function code.

```javascript
var form = bw.component({
  t: 'form', c: [
    { t: 'input', a: { type: 'text', placeholder: 'Name' } },
    { t: 'button', c: 'Submit', a: { onclick: 'submit' } }
  ],
  o: {
    state: { submitted: false },
    actions: {
      submit: function(comp, event) {
        event.preventDefault();
        comp.set('submitted', true);
      }
    }
  }
});
```

### Events and pub/sub

ComponentHandle integrates with bitwrench's two event systems:

```javascript
// DOM events — scoped to this component's element
handle.on('click', function(event) { /* ... */ });
handle.off('click', handler);

// App-wide pub/sub — auto-cleaned on destroy
handle.sub('data:updated', function(detail) {
  handle.set('items', detail.items);
});
```

Subscriptions created with `handle.sub()` are automatically cleaned up when the component is destroyed. You do not need to manually unsubscribe.

### User tags and messaging

Tag a component for external addressing:

```javascript
var dashboard = bw.component({ /* ... */ });
dashboard.userTag('main_dashboard');
```

Send messages to tagged components from anywhere:

```javascript
bw.message('main_dashboard', 'refresh', { force: true });
```

`bw.message()` looks up the component by its user tag (or UUID), finds the named method, and calls it. This is bitwrench's equivalent of Win32's `SendMessage` — a decoupled way to communicate between components without holding references.

> **Coming from React?** This is similar to using a ref to call a method on a child component, but without needing a ref chain. Any component can message any other component by tag name.

> **Coming from Vue?** This is similar to template refs with `$refs.child.method()`, but decoupled from the component tree. You can message components that are not direct children.

### DOM queries within a component

```javascript
// Find a single element inside this component
var input = handle.select('input[name="email"]');

// Find all matching elements
var items = handle.selectAll('.list-item');
```

### Debugging

Use `bw.inspect()` to examine a component in the browser console:

```javascript
bw.inspect('#app');          // by selector
bw.inspect(handle);          // by handle reference
bw.inspect(domElement);      // by DOM element
```

This logs the component's state, bindings, methods, actions, user tag, and mount status. It also returns the ComponentHandle, so you can chain operations:

```javascript
bw.inspect('#counter').set('count', 99);
```

### Lifecycle hooks

ComponentHandle supports six lifecycle hooks:

| Hook | When it fires | Typical use |
|------|--------------|-------------|
| `willMount` | Before first DOM insertion | Fetch initial data |
| `mounted` | After DOM insertion | Start timers, attach external listeners |
| `willUpdate` | Before re-render (state changed) | Validate state, cancel updates |
| `onUpdate` | After re-render | Scroll to element, focus input |
| `unmount` | Before DOM removal (state preserved) | Pause timers |
| `willDestroy` | Before full destruction | Final cleanup |

```javascript
var timer = bw.component({
  t: 'div', c: 'Elapsed: ${seconds}s',
  o: {
    state: { seconds: 0 },
    mounted: function(comp) {
      comp._interval = setInterval(function() {
        comp.set('seconds', comp.get('seconds') + 1);
      }, 1000);
    },
    unmount: function(comp) {
      clearInterval(comp._interval);
    }
  }
});
```

### Control flow helpers

#### `bw.when()` — conditional rendering

```javascript
var login = bw.component({
  t: 'div', c: [
    bw.when('${loggedIn}',
      { t: 'p', c: 'Welcome, ${username}!' },
      { t: 'p', c: 'Please log in.' }
    )
  ],
  o: {
    state: { loggedIn: false, username: '' }
  }
});

login.set('loggedIn', true);
login.set('username', 'Alice');
// DOM now shows: "Welcome, Alice!"
```

> **Coming from React?** `bw.when()` is similar to `{condition ? <A/> : <B/>}` in JSX, but as a function call in the content array.

> **Coming from Vue?** This is the equivalent of `v-if` / `v-else`.

#### `bw.each()` — list rendering

```javascript
var list = bw.component({
  t: 'ul', c: [
    bw.each('${items}', function(item, index) {
      return { t: 'li', c: item.name };
    })
  ],
  o: {
    state: { items: [{ name: 'Alice' }, { name: 'Bob' }] }
  }
});

list.push('items', { name: 'Charlie' });
// DOM now shows three list items
```

> **Coming from React?** This is similar to `{items.map(item => <li>{item.name}</li>)}`.

> **Coming from Vue?** This is the equivalent of `v-for`.

### Pre-compilation with `bw.compile()`

For components that will be instantiated many times, pre-compile the template:

```javascript
var CounterFactory = bw.compile({
  t: 'div', c: [
    { t: 'span', c: 'Count: ${count}' },
    { t: 'button', c: '+1' }
  ],
  o: { state: { count: 0 } }
});

// Create instances efficiently
var counter1 = CounterFactory({ count: 10 });
var counter2 = CounterFactory({ count: 20 });
```

`bw.compile()` extracts all `${expr}` bindings once and returns a factory function. Each call to the factory produces a new ComponentHandle with pre-compiled bindings. This enables Tier 2 expressions (full JavaScript in `${}`) and avoids re-parsing the template on every instantiation.

### When to use Level 2

Use Level 2 when:

- The component has state that changes after initial render
- You want automatic re-rendering when state changes
- You need named methods for component behavior
- You want template bindings (`${expr}`) for declarative state-to-DOM mapping
- You need lifecycle management (mount, unmount, destroy)
- You want to address components by tag and send messages between them

---

## Escalating Between Levels

You can start at any level and escalate when you need more capability.

### Level 0 → Level 1

Pass a TACO to a rendering function:

```javascript
var taco = bw.makeCard({ title: 'Hello' });  // Level 0
bw.DOM('#app', taco);                          // Level 1 — now it's in the DOM
```

### Level 0 → Level 2

Wrap a TACO in `bw.component()`:

```javascript
var taco = bw.makeCard({ title: 'Hello' });   // Level 0
var card = bw.component(taco);                  // Level 2 — now it has .get()/.set()
bw.DOM('#app', card);
```

### Level 1 → Level 2

If you have a Level 1 component using `o.render` + `bw.update()` and want to add managed state, refactor to use `bw.component()` with template bindings instead of a manual render function.

**Before (Level 1):**
```javascript
bw.DOM('#app', {
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
});
```

**After (Level 2):**
```javascript
var counter = bw.component({
  t: 'div', c: [
    { t: 'span', c: 'Count: ${count}' },
    { t: 'button', c: '+1', a: {
      onclick: function() { counter.set('count', counter.get('count') + 1); }
    }}
  ],
  o: { state: { count: 0 } }
});
bw.DOM('#app', counter);
```

The Level 2 version is shorter, has no manual `bw.update()` call, and the template binding `${count}` makes the state-to-DOM relationship visible in the TACO definition itself.

---

## Cross-Component Communication

Bitwrench provides three mechanisms for components to communicate, each suited to different relationship types.

### Shared state (parent-child)

Nest TACOs and share a state object:

```javascript
var appState = { user: { name: 'Alice' }, items: [] };

var header = bw.component({
  t: 'header', c: 'Hello, ${user.name}',
  o: { state: appState }
});

var main = bw.component({
  t: 'main', c: [
    bw.each('${items}', function(item) {
      return { t: 'div', c: item.text };
    })
  ],
  o: { state: appState }
});
```

When either component calls `.set()`, both re-render because they share the same state object.

### Pub/sub (siblings, decoupled)

Use `bw.pub()` and `bw.sub()` for app-wide topic-based messaging:

```javascript
// Publisher
var searchBox = bw.component({
  t: 'input', a: { oninput: function(e) {
    bw.pub('search:changed', { query: e.target.value });
  }}
});

// Subscriber
var results = bw.component({
  t: 'div', c: 'Results for: ${query}',
  o: {
    state: { query: '' },
    mounted: function(comp) {
      comp.sub('search:changed', function(detail) {
        comp.set('query', detail.query);
      });
    }
  }
});
```

Pub/sub is app-scoped — publishers and subscribers do not need to know about each other. Subscriptions created via `handle.sub()` are automatically cleaned up when the component is destroyed.

### Messaging (targeted, decoupled)

Use `bw.message()` to send a message to a specific component by tag:

```javascript
// Receiver
var notifications = bw.component({
  t: 'div', c: bw.each('${alerts}', function(a) {
    return bw.makeAlert({ content: a.text, variant: a.level });
  }),
  o: {
    state: { alerts: [] },
    methods: {
      addAlert: function(comp, data) {
        comp.push('alerts', data);
      }
    }
  }
});
notifications.userTag('notifications');

// Sender (from anywhere)
bw.message('notifications', 'addAlert', {
  text: 'File saved', level: 'success'
});
```

This pattern decouples the sender from the receiver. The sender does not need a reference to the notifications component — it only needs to know the tag name and the method signature.

> **Coming from Angular?** `bw.message()` is similar to a service with `Subject.next()`, but without dependency injection. The addressing is by tag name rather than by service class.

---

## The Low-Level API

The Level 1 primitives (`o.state`, `o.render`, `bw.update()`, `bw.patch()`, `bw.emit()`, `bw.pub()`) are not deprecated. They are the foundation that Level 2 is built on, and they remain the right choice in specific situations:

- **Custom rendering logic** that does not fit the template binding model
- **Integration with external libraries** (charts, maps, editors) that manage their own DOM
- **Server-driven UI transport** — the server sends patch commands, the client applies them directly
- **Performance-critical paths** where you want explicit control over what gets re-rendered

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
| Cleanup | Manual or via `bw.cleanup()` | Auto-cleanup via `handle.sub()` or element lifecycle |

---

## Choosing a Pattern

| Situation | Recommended approach |
|-----------|---------------------|
| Static content, server rendering | Level 0 — TACO data, `bw.html()` |
| Interactive widget, full control | Level 1 — `o.render` + `bw.update()` |
| Stateful component with changing data | Level 2 — `bw.component()` + `.set()` |
| List of similar components | Level 2 — `bw.compile()` factory |
| Server pushes UI updates | Level 1 — `bw.patch()` / `bw.DOM()` |
| Components need to talk to each other | `bw.pub()`/`bw.sub()` or `bw.message()` |
| Debugging component state | `bw.inspect(selector)` in the console |
