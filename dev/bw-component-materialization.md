# Component Materialization: The Three-Level Model

**Status**: Active design (implementing)
**Author**: Claude + Manu Chatterjee
**Date**: March 2026

---

## The Core Insight

A TACO object can exist at three levels of materialization. The user
explicitly chooses which level they need. No magic promotion, no hidden
complexity.

```
Level 0: TACO          — intent / description / portable data
Level 1: DOM / HTML     — materialized artifact (fire-and-forget)
Level 2: ComponentHandle — managed object with API (get/set/on/destroy + custom methods)
```

This mirrors desktop framework history:

| Level | Bitwrench | MFC (Win32) | Qt | Swing | .NET WPF |
|-------|-----------|-------------|-----|-------|----------|
| 0 | TACO object | WNDCLASS struct | QML object | — | XAML element |
| 1 | `bw.html()` / `bw.createDOM()` | `CreateWindowEx()` | `QWidget` render | `paint()` | Measure/Arrange |
| 2 | `bw.component()` | `CButton` (MFC wrapper) | `QWidget` (full) | `JButton` | `Button` control |

The key: Level 0 is always the starting point. You escalate only when you
need to.

---

## Level 0: TACO (Intent)

Pure JavaScript data. No DOM, no side effects, no handles.

```javascript
// BCCL factory returns Level 0
var spec = bw.makeCard({
  title: 'Server Status',
  content: 'All systems operational',
  variant: 'success'
});

// spec is just: { t: 'div', a: { class: 'bw-card ...' }, c: [...], o: {...} }
```

**What you can do with Level 0:**
- Serialize to JSON (minus functions) and send over wire (bwserve / SSE)
- Store in a database or config file
- Transform programmatically (middleware, LLM pipelines)
- Pass to `bw.html()` for string output (SSR)
- Pass to `bw.DOM()` for client rendering
- Nest inside other TACOs (composition)
- Inspect and modify before rendering

**What you cannot do:**
- Update it after rendering (it's just data — no connection to DOM)
- Listen to events on it (no DOM = no events)
- Call `.set()` on it (it's a plain object)

### Level 0 is bitwrench's unique advantage

No other mainstream framework has this layer. React components are
functions that must be called in a React tree. Vue components need a Vue
instance. Svelte components need compilation. Angular components need
a module system.

A TACO object is just a JS object. Any language that can produce JSON
can produce a TACO. A Python server, a Rust microservice, an LLM — they
all can emit `{ t: 'div', c: 'hello' }`. This is why bwserve works.
This is why embedded devices work. This is the moat.

**Do not compromise Level 0.** Every design decision must preserve it.

---

## Level 1: Materialized (Fire-and-Forget)

Convert TACO to a concrete artifact. One-way trip.

```javascript
// To HTML string (SSR, email, static site)
var htmlStr = bw.html(spec);

// To DOM node (browser, one-time render)
var node = bw.createDOM(spec);

// Mount to DOM (convenience — finds target, appends)
bw.DOM('#app', spec);
```

**What you can do:**
- Display it
- Attach event handlers (via `onclick` in TACO attributes)
- Style it (CSS applies normally)

**What you cannot do:**
- Update it efficiently (must re-call `bw.DOM()` with new TACO)
- Track state changes
- Call component methods

### Level 1 is where 80% of use cases live

Dashboard that renders once from server data. Admin panel that rebuilds
on navigation. Embedded device UI that replaces sections on SSE push.
Documentation page. Marketing site. Email template.

For these, Level 2 is overkill. `bw.DOM('#app', bw.makeCard({...}))` is
the right amount of ceremony.

---

## Level 2: ComponentHandle (Managed)

Wrap a TACO in a handle. The handle owns its DOM and manages updates.

```javascript
// Explicit escalation — user chooses Level 2
var card = bw.component({
  t: 'div', a: { class: 'bw-card' },
  c: [
    { t: 'h3', c: '${title}' },
    { t: 'p',  c: '${body}' }
  ],
  o: { state: { title: 'Hello', body: 'World' } }
});

// Mount it
bw.DOM('#app', card);

// Now you have an API
card.set('title', 'Goodbye');   // patches h3 text node (surgical)
card.get('title');               // 'Goodbye'
card.on('click', handler);       // event listening
card.destroy();                  // cleanup
```

**What Level 2 adds over Level 1:**
- State tracking (`_state` object)
- Template bindings (`${expr}` -> targeted DOM patches)
- Custom methods (`o.methods` -> promoted to handle API)
- Lifecycle hooks (willMount, mounted, willUpdate, onUpdate, unmount)
- Actions (named functions registered for event dispatch)
- Pub/sub integration (`card.sub('topic', handler)`)
- Microtask batching (multiple `.set()` calls -> one DOM update)
- Addressability via UUID and user tags (`bw.message()` dispatch)

**What Level 2 costs:**
- ComponentHandle overhead per instance (~500 bytes)
- Binding compilation on mount (walks TACO tree once)
- Ref tracking (`data-bw_ref` attributes on bound elements)

---

## Custom Methods: Components Own Their Behavior

Level 2 components can define custom methods via `o.methods`. These are
promoted to the handle API at `bw.component()` time.

This is the MFC/Qt model: CListBox has AddString(). QListWidget has
addItem(). The component knows how to update itself surgically — the
user doesn't manage the DOM, and neither does a generic diffing algorithm.

```javascript
var chatLog = bw.component({
  t: 'div', a: { class: 'chat-log' },
  c: [
    { t: 'ul', a: { bw_id: 'messages' }, c: [] }
  ],
  o: {
    state: { messages: [] },
    methods: {
      // Add ONE message — appends ONE <li>. No rebuild.
      addMessage: function(comp, msg) {
        var li = bw.createDOM({
          t: 'li', a: { 'data-bw_id': msg.id, class: 'chat-msg' },
          c: msg.from + ': ' + msg.text
        });
        comp.select('[data-bw_id="messages"]').appendChild(li);
        comp._state.messages.push(msg);
      },
      // Remove ONE message — removes ONE <li>. No rebuild.
      removeMessage: function(comp, id) {
        var el = comp.select('[data-bw_id="' + id + '"]');
        if (el) el.parentNode.removeChild(el);
        comp._state.messages = comp._state.messages.filter(
          function(m) { return m.id !== id; }
        );
      },
      // Clear all messages
      clear: function(comp) {
        comp.select('[data-bw_id="messages"]').innerHTML = '';
        comp._state.messages = [];
      }
    }
  }
});

bw.DOM('#app', chatLog);

// Each call does ONE DOM operation — O(1), not O(n)
chatLog.addMessage({ id: 'm1', from: 'Alice', text: 'Hello' });
chatLog.addMessage({ id: 'm2', from: 'Bob', text: 'Hi there' });
chatLog.removeMessage('m1');
```

### Why this is better than keyed reconciliation

React's approach to dynamic lists: re-render the entire template, diff
the old vs new virtual DOM using keys, apply minimal DOM patches. This
is clever but indirect — the framework infers what changed by comparing
two trees.

Bitwrench's approach: the component has explicit methods (`addMessage`,
`removeMessage`) that do exactly ONE DOM operation each. No diffing,
no reconciliation, no virtual DOM. The component knows what changed
because the user told it.

| Approach | "Add item to list of 1000" |
|----------|---------------------------|
| React | Re-render template -> diff 1001 virtual nodes -> 1 DOM insert |
| Vue | Reactive proxy -> diff 1001 virtual nodes -> 1 DOM insert |
| Solid | Signal -> compiled DOM updater -> 1 DOM insert |
| **Bitwrench** | `list.addMessage(item)` -> 1 DOM insert. No diffing. |
| MFC | `pList->AddString("item")` -> 1 Win32 call. No diffing. |
| Qt | `list->addItem("item")` -> 1 widget creation. No diffing. |

The component API approach is MORE direct than React's keyed
reconciliation. React does O(n) comparison to figure out that you added
one item. Bitwrench does O(1) because you told the component directly.

The trade-off: you write ~8 lines of surgical update methods per
component type. React's generic diffing handles any list without custom
code. But 8 lines of clear, explicit JavaScript is better than a 200-line
generic diffing algorithm that's hard to debug.

---

## Message Dispatch: SendMessage() for the Web

Components are addressable by UUID. `bw.message()` finds a component by
its UUID or user-defined tag and calls a method. This is bitwrench's
equivalent of Win32's `SendMessage(hwnd, msg, wParam, lParam)`.

```javascript
// Tag a component with a user-chosen ID
chatLog.userTag('chat_main');

// Now dispatch messages by tag — locally or from server
bw.message('chat_main', 'addMessage', { id: 'm3', from: 'Eve', text: 'Hey' });
```

### Server-driven component updates

The server doesn't know about DOM. It speaks in component IDs and actions.
The bitwrench client is a thin message dispatcher.

```javascript
// Client: 3 lines to wire up server -> component dispatch
var es = new EventSource('/api/updates');
es.onmessage = function(e) {
  var msg = JSON.parse(e.data);
  bw.message(msg.target, msg.action, msg.data);
};

// Server (Python / Rust / Go / anything):
# Add a message to the chat component
sse_send({ "target": "chat_main", "action": "addMessage",
           "data": { "id": "m4", "from": "Server", "text": "Alert!" } })

# Clear all messages
sse_send({ "target": "chat_main", "action": "clear", "data": {} })
```

This IS the Streamlit model: server decides what to show, client
dispatches. But with web-native components, no Python runtime on the
client, and the user keeps full control of the component API.

### Addressing: UUID classes on DOM elements

| Address type | Who creates it | Example | How it works |
|---|---|---|---|
| `bw_uuid` | bitwrench (auto) | `bw_uuid_a3f2` | CSS class on element, `bw.$('.bw_uuid_a3f2')` |
| `data-bw_comp_id` | ComponentHandle (auto) | `bw_comp_abc123` | Attribute set on mount |
| User tag | User via `.userTag()` | `chat_main` | CSS class added, registered for `bw.message()` |

Because user tags are CSS classes, `querySelector` finds them at native
C++ speed. No JavaScript registry to maintain. The DOM IS the registry.

Users can define their own addressing schemes for their server logic:
```javascript
// Tag with server-meaningful IDs
dashboard.userTag('dashboard_prod_east');
alertPanel.userTag('alerts_region_us');

// Server addresses components by its own naming scheme
sse_send({ target: 'dashboard_prod_east', action: 'updateMetric', data: {...} });
```

---

## Debugging: The Browser IS Your DevTools

### Why bitwrench doesn't need custom DevTools

React stores state in fibers (virtual DOM). You literally cannot find
`count = 42` by inspecting DOM elements. You need React DevTools to bridge
virtual world and real DOM.

Bitwrench's state IS on the DOM. Open Chrome DevTools, click an element:

```javascript
// In Console after clicking an element in Elements panel:
$0._bwComponentHandle             // the full component handle
$0._bwComponentHandle._state      // { count: 42, title: 'Hello' }
$0._bwComponentHandle.get('count') // 42
$0._bwComponentHandle.set('count', 99)  // LIVE UPDATES THE DOM

// List all methods
Object.keys($0._bwComponentHandle).filter(k => typeof $0._bwComponentHandle[k] === 'function')

// Find all components on the page
document.querySelectorAll('[data-bw_comp_id]')
```

You can live-mutate state, call methods, inspect bindings — all from the
browser's built-in Console. No extensions. No installs. Works in every
browser.

### bw.inspect() utility

For richer inspection, `bw.inspect()` dumps component info:

```javascript
bw.inspect('#my-component');
// Console output:
// Component: bw_comp_abc123
//   State: { count: 42, title: 'Hello' }
//   Bindings: 3 (deps: count, title)
//   Methods: addItem, removeItem, clear
//   User tag: dashboard_main
//   Mounted: true
//   Element: <div class="bw-card bw_uuid_abc123 dashboard_main">

// Returns handle for console chaining:
var h = bw.inspect('#my-component');
h.set('count', 99);
```

`bw.inspect()` is part of the core library (~35 lines), not a separate
extension. It's always available.

---

## Building Custom Components

Users build their own complex components (dashboards, custom widgets,
domain-specific controls) the same way BCCL factories work:

### Pattern: factory function + o.methods

```javascript
// 1. Write a factory that returns TACO with o.methods
function makeMonitorDashboard(props) {
  return {
    t: 'div', a: { class: 'monitor-dashboard' },
    c: [
      { t: 'h2', c: props.title || 'Monitor' },
      { t: 'div', a: { bw_id: 'alerts' }, c: [] },
      { t: 'div', a: { bw_id: 'metrics' }, c:
        (props.metrics || []).map(function(m) {
          return bw.makeStatCard({ title: m.name, value: m.value, bw_id: m.id });
        })
      }
    ],
    o: {
      state: {
        title: props.title || 'Monitor',
        metrics: props.metrics || [],
        alertCount: 0
      },
      methods: {
        addAlert: function(comp, alert) {
          var el = bw.createDOM(bw.makeAlert({
            text: alert.message, variant: alert.severity
          }));
          comp.select('[data-bw_id="alerts"]').appendChild(el);
          comp.set('alertCount', comp.get('alertCount') + 1);
        },
        removeAlert: function(comp, id) {
          var el = comp.select('[data-bw_id="' + id + '"]');
          if (el) el.parentNode.removeChild(el);
          comp.set('alertCount', comp.get('alertCount') - 1);
        },
        updateMetric: function(comp, data) {
          // Surgical update via bw.patch — no rebuild
          bw.patch(data.id, data.value);
        },
        clearAlerts: function(comp) {
          comp.select('[data-bw_id="alerts"]').innerHTML = '';
          comp.set('alertCount', 0);
        }
      }
    }
  };
}

// 2. Instantiate as Level 2 component
var dash = bw.component(makeMonitorDashboard({
  title: 'Production East',
  metrics: [
    { name: 'CPU', value: '42%', id: 'cpu' },
    { name: 'Memory', value: '67%', id: 'mem' },
    { name: 'Disk', value: '23%', id: 'disk' }
  ]
}));

// 3. Tag for server addressing
dash.userTag('dashboard_prod_east');

// 4. Mount
bw.DOM('#app', dash);

// 5. Use the API — locally or remotely
dash.addAlert({ message: 'CPU spike on host-7', severity: 'warning' });
dash.updateMetric({ id: 'cpu', value: '89%' });

// Remote: server sends via SSE
// { target: 'dashboard_prod_east', action: 'addAlert',
//   data: { message: 'Disk full', severity: 'danger' } }
```

### The recipe (for documentation)

1. **Write a factory function** that returns TACO with `o.state` and
   `o.methods`. Methods receive `(comp, data)` — comp is the handle.
2. **Methods do surgical DOM updates** — `appendChild`, `removeChild`,
   `bw.patch()`. Never rebuild the whole component.
3. **Wrap in `bw.component()`** to get a handle with `.get()/.set()` +
   your custom methods promoted to the handle API.
4. **Tag with `.userTag()`** if you want server addressing.
5. **Wire up SSE** with `bw.message()` for remote updates.

This pattern scales from a simple counter to a full production dashboard.
The component owns its rendering. The user (or server) interacts through
the API. The DOM is an implementation detail.

### Nested custom components

Custom components can contain BCCL components or other custom components:

```javascript
function makeTeamPage(props) {
  // Each team member gets their own managed card
  var memberCards = props.members.map(function(m) {
    return bw.component(bw.makeCard({
      title: m.name, content: '${status}',
      state: { status: m.status }
    }));
  });

  return {
    t: 'div', c: [
      { t: 'h1', c: props.teamName },
      { t: 'div', a: { class: 'team-grid' },
        c: memberCards  // ComponentHandles in content array — walker handles this
      }
    ],
    o: {
      state: { members: props.members },
      methods: {
        updateMemberStatus: function(comp, data) {
          // Find the member's card handle and update it
          memberCards[data.index].set('status', data.status);
        }
      }
    }
  };
}

var page = bw.component(makeTeamPage({
  teamName: 'Engineering',
  members: [
    { name: 'Alice', status: 'Online' },
    { name: 'Bob', status: 'Away' }
  ]
}));
bw.DOM('#app', page);

page.updateMemberStatus({ index: 1, status: 'Online' });
```

Level 0 children (plain TACO) are materialized as static DOM. Level 2
children (ComponentHandle) are mounted as managed sub-components. The
content walker handles both transparently.

---

## Real-World Scenarios: How Does It Feel?

### Scenario 1: Counter (simple state)

**React:**
```jsx
function Counter() {
  const [count, setCount] = useState(0);
  return (
    <div>
      <span>Count: {count}</span>
      <button onClick={() => setCount(c => c + 1)}>+1</button>
    </div>
  );
}
```

**Bitwrench Level 1 (re-render pattern):**
```javascript
var count = 0;
function render() {
  bw.DOM('#app', {
    t: 'div', c: [
      { t: 'span', c: 'Count: ' + count },
      { t: 'button', c: '+1', a: {
        onclick: function() { count++; render(); }
      }}
    ]
  });
}
render();
```

**Bitwrench Level 2 (component handle):**
```javascript
var counter = bw.component({
  t: 'div', c: [
    { t: 'span', c: 'Count: ${count}' },
    { t: 'button', c: '+1', a: { onclick: '${_action_increment}' } }
  ],
  o: {
    state: { count: 0 },
    actions: {
      increment: function(comp) { comp.set('count', comp.get('count') + 1); }
    }
  }
});
bw.DOM('#app', counter);
```

**Verdict:** React is more concise for this trivial case. Level 1
bitwrench is straightforward but requires manual re-render. Level 2 is
self-managing but more verbose than React's hooks. This is the trade-off
for zero-build-step.

The action dispatch string (`'${_action_increment}'`) is uglier than
React's inline arrow function. But it's serializable — a server can send
this TACO and the client executes it. React can't do that.

### Scenario 2: Dashboard with live data (bitwrench's sweet spot)

**React:**
```jsx
function Dashboard() {
  const [stats, setStats] = useState({ users: 0, revenue: 0, uptime: 0 });

  useEffect(() => {
    const es = new EventSource('/api/stats');
    es.onmessage = e => setStats(JSON.parse(e.data));
    return () => es.close();
  }, []);

  return (
    <div className="dashboard">
      <StatCard title="Users" value={stats.users} />
      <StatCard title="Revenue" value={'$' + stats.revenue} />
      <StatCard title="Uptime" value={stats.uptime + '%'} />
    </div>
  );
}
```
Requires: React, build step, bundler, StatCard component definition.

**Bitwrench Level 1 (server-push):**
```javascript
// Initial render
bw.DOM('#app', { t: 'div', a: { class: 'dashboard' }, c: [
  bw.makeStatCard({ title: 'Users',   value: '0' }),
  bw.makeStatCard({ title: 'Revenue', value: '$0' }),
  bw.makeStatCard({ title: 'Uptime',  value: '0%' })
]});

// Server pushes updates — surgical DOM patches
var es = new EventSource('/api/stats');
es.onmessage = function(e) {
  var d = JSON.parse(e.data);
  bw.patch('users-value',   d.users);
  bw.patch('revenue-value', '$' + d.revenue);
  bw.patch('uptime-value',  d.uptime + '%');
};
```
Requires: One script tag. No build step. No framework. Works on IE11.

**Verdict:** Bitwrench Level 1 with `bw.patch()` is arguably the cleanest
solution here. No component overhead, no hooks, no cleanup — just
"update that text node." React requires the most ceremony.

### Scenario 3: Dynamic list (the component API approach)

**React (template diffing):**
```jsx
function ChatLog() {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const es = new EventSource('/api/chat');
    es.onmessage = e => {
      const msg = JSON.parse(e.data);
      setMessages(prev => [...prev, msg]);
    };
    return () => es.close();
  }, []);

  return (
    <ul>
      {messages.map(msg => (
        <li key={msg.id}>{msg.from}: {msg.text}</li>
      ))}
    </ul>
  );
}
```
React re-renders the entire template on each new message, diffs
the virtual DOM by key, and applies a minimal DOM patch (one appendChild).
Clever, but indirect — O(n) comparison to infer one addition.

**Bitwrench Level 2 (component API):**
```javascript
var chatLog = bw.component({
  t: 'ul', a: { class: 'chat-log' }, c: [],
  o: {
    state: { messages: [] },
    methods: {
      addMessage: function(comp, msg) {
        var li = bw.createDOM({
          t: 'li', a: { 'data-bw_id': msg.id },
          c: msg.from + ': ' + msg.text
        });
        comp.element.appendChild(li);
        comp._state.messages.push(msg);
      },
      removeMessage: function(comp, id) {
        var el = comp.select('[data-bw_id="' + id + '"]');
        if (el) el.parentNode.removeChild(el);
        comp._state.messages = comp._state.messages.filter(
          function(m) { return m.id !== id; }
        );
      }
    }
  }
});
bw.DOM('#app', chatLog);
chatLog.userTag('chat_main');

// Server pushes messages
var es = new EventSource('/api/chat');
es.onmessage = function(e) {
  var msg = JSON.parse(e.data);
  bw.message('chat_main', 'addMessage', msg);
};
```
The component does ONE appendChild per message — O(1), no diffing,
no virtual DOM comparison. Existing messages keep their DOM state
(focus, animations, scroll position).

**Verdict:** Bitwrench's component API approach is MORE direct than
React's keyed reconciliation. React does O(n) comparison to figure out
that you added one item. Bitwrench does O(1) because the component method
tells the DOM exactly what to do.

The trade-off: you write ~8 lines of `addMessage`/`removeMessage` methods.
React's generic diffing handles any list without custom code. But 8 lines
of clear, explicit JavaScript is transparent and debuggable. React's
reconciliation algorithm is a black box.

### Scenario 4: Nested components (composition)

**React:**
```jsx
function Page() {
  return (
    <Card title="Settings">
      <Switch label="Dark mode" checked={dark} onChange={setDark} />
      <Select options={themes} value={theme} onChange={setTheme} />
      <Button variant="primary" onClick={save}>Save</Button>
    </Card>
  );
}
```

**Bitwrench Level 0 (pure TACO nesting):**
```javascript
bw.DOM('#app', bw.makeCard({
  title: 'Settings',
  content: [
    bw.makeSwitch({ label: 'Dark mode', checked: dark }),
    bw.makeSelect({ options: themes, value: theme }),
    bw.makeButton({ text: 'Save', variant: 'primary', onclick: save })
  ]
}));
```

**Bitwrench Level 2 (mixed — some children are handles):**
```javascript
var darkSwitch = bw.component(bw.makeSwitch({
  label: 'Dark mode', checked: false,
  state: { checked: false }
}));

var page = bw.makeCard({
  title: 'Settings',
  content: [
    darkSwitch,                                        // Level 2 — managed
    bw.makeSelect({ options: themes, value: theme }),  // Level 0 — static
    bw.makeButton({ text: 'Save', variant: 'primary', onclick: save })
  ]
});

bw.DOM('#app', page);
darkSwitch.set('checked', true);  // updates switch without touching card
```

**Verdict:** Level 0 nesting is comparable to JSX in readability. The
mixed Level 0 + Level 2 composition is powerful — you only escalate
the components that need managed state.

In React, every component re-renders on every parent state change (unless
you memo). In bitwrench, only the Level 2 components with dirty state
update. Level 0 children are inert.

### Scenario 5: Server-driven UI (bitwrench's killer feature)

**React:** Cannot do this without React Server Components (complex infra)
or a custom protocol.

**Bitwrench:**
```javascript
// Server (Node.js / Python / Rust / anything):
var update = {
  target: '#main',
  taco: bw.makeCard({
    title: 'Alert',
    content: 'Server detected an anomaly',
    variant: 'danger'
  })
};
sseStream.write('data: ' + JSON.stringify(update) + '\n\n');

// Client (3 lines):
var es = new EventSource('/api/updates');
es.onmessage = function(e) {
  var u = JSON.parse(e.data);
  bw.DOM(u.target, u.taco);
};
```

**Server-driven with managed components + message dispatch:**
```javascript
// Client: initial setup
var dash = bw.component(makeMonitorDashboard({...}));
dash.userTag('dashboard_prod_east');
bw.DOM('#app', dash);

// Client: wire up message dispatch (ONE TIME)
var es = new EventSource('/api/monitor');
es.onmessage = function(e) {
  var msg = JSON.parse(e.data);
  bw.message(msg.target, msg.action, msg.data);
};

// Server sends component-level messages:
sse_send({ target: 'dashboard_prod_east', action: 'addAlert',
           data: { message: 'CPU spike', severity: 'danger' } })
sse_send({ target: 'dashboard_prod_east', action: 'updateMetric',
           data: { id: 'cpu', value: '89%' } })
```

**Verdict:** No other framework can match this. The server speaks in
component IDs and actions — no DOM knowledge needed. The client is a
thin message dispatcher. The component handles everything.

### Scenario 6: Form with validation

**React:**
```jsx
function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!email.includes('@')) e.email = 'Invalid email';
    if (password.length < 8) e.password = 'Too short';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  return (
    <form onSubmit={e => { e.preventDefault(); if (validate()) submit(); }}>
      <input value={email} onChange={e => setEmail(e.target.value)} />
      {errors.email && <span className="error">{errors.email}</span>}
      <input type="password" value={password}
             onChange={e => setPassword(e.target.value)} />
      {errors.password && <span className="error">{errors.password}</span>}
      <button type="submit">Login</button>
    </form>
  );
}
```

**Bitwrench Level 2:**
```javascript
var form = bw.component({
  t: 'form', a: { onsubmit: '${_action_submit}' }, c: [
    bw.makeInput({ type: 'email', placeholder: 'Email',
                   oninput: '${_action_onEmail}' }),
    bw.when('emailError', { t: 'span', a: { class: 'bw-text-danger' }, c: '${emailError}' }),
    bw.makeInput({ type: 'password', placeholder: 'Password',
                   oninput: '${_action_onPass}' }),
    bw.when('passError', { t: 'span', a: { class: 'bw-text-danger' }, c: '${passError}' }),
    bw.makeButton({ text: 'Login', type: 'submit', variant: 'primary' })
  ],
  o: {
    state: { email: '', password: '', emailError: '', passError: '' },
    actions: {
      onEmail: function(comp, e) { comp.set('email', e.target.value); },
      onPass:  function(comp, e) { comp.set('password', e.target.value); },
      submit:  function(comp, e) {
        e.preventDefault();
        var errs = {};
        if (comp.get('email').indexOf('@') < 0) errs.emailError = 'Invalid email';
        if (comp.get('password').length < 8) errs.passError = 'Too short';
        comp.setState(errs.emailError || errs.passError ? errs : { emailError: '', passError: '' });
        if (!errs.emailError && !errs.passError) submit(comp.get('email'), comp.get('password'));
      }
    }
  }
});
bw.DOM('#app', form);
```

**Verdict:** Comparable verbosity. React is slightly more readable
because JSX inline expressions (`{errors.email && ...}`) are cleaner
than `bw.when()`. But bitwrench's version is framework-free and works
without a build step.

---

## Honest Comparison: Where Bitwrench Stands

### Genuinely Better

| Area | Why |
|------|-----|
| **Zero build step** | Script tag and go. No npm, no webpack, no babel. Real advantage for embedded, prototyping, internal tools, education. |
| **Server-driven UI** | TACO is plain data -> any language can produce it -> `bw.message()` dispatches actions to components. No other framework does this as simply. |
| **Embedded devices** | 45KB library serves as complete UI layer for ESP32/RPi. Send JSON updates over SSE. No Node.js on device needed. |
| **Theme generation** | `bw.generateTheme('ocean', { primary: '#336699' })` regenerates entire design system. No other framework has this. |
| **LLM UI generation** | LLMs output JSON natively. TACO IS JSON. No JSX parsing, no template syntax, no compile step. |
| **Explicit complexity control** | User chooses Level 0/1/2 per component. React forces every component through the reconciliation cycle. |
| **Debugging** | State lives on DOM elements. Browser DevTools IS the component inspector. No extensions needed. `bw.inspect()` for richer output. |
| **Dynamic lists** | Component API methods (`.add()`, `.remove()`) do O(1) surgical DOM updates. React does O(n) virtual DOM diffing. |

### Genuinely Different (not better or worse)

| Area | Bitwrench | React/Vue | Desktop (Qt/MFC) |
|------|-----------|-----------|-----------------|
| **Update model** | Imperative `.set()` + methods | Declarative re-render | Imperative setters |
| **State location** | Component object | Hooks / reactive refs | Member variables |
| **Event handling** | Action functions | Inline handlers | Signal/slot |
| **Composition** | TACO nesting | JSX children | Widget hierarchy |
| **Styling** | `bw.css()` + tokens | CSS modules/styled | QSS / resource files |
| **List updates** | Explicit `.add()/.remove()` | Key-based reconciliation | `.addItem()/.removeItem()` |

The imperative `.set()` model will feel foreign to React developers but
natural to anyone who's used Qt (`widget->setText("hello")`), MFC
(`button.SetWindowText(_T("hello"))`), or .NET WinForms
(`button.Text = "hello"`). It's the older, more established model.

### Honest Gaps (be candid)

| Area | Gap | Severity | Mitigation |
|------|-----|----------|-----------|
| **Readability at scale** | Deeply nested TACO objects are harder to read than JSX for complex UIs. | Medium | BCCL factories help. But raw TACO trees with 5+ nesting levels are noisy. |
| **Two-way binding** | No `v-model` equivalent. Form inputs need explicit `oninput` handlers. | Low | Intentional — two-way binding is a footgun. But for simple forms it means more boilerplate. |
| **Ecosystem** | No router, no i18n, no testing utilities, no component library ecosystem. | High | Bitwrench is a utility library, not a framework. The ecosystem gap is real but deliberate. |
| **TypeScript support** | No `.d.ts` files, no generic component types. | Low | Could add later. |
| **List reordering** | `.add()/.remove()` handle insert/delete. For drag-and-drop reordering of existing items, user must write `reorder()` method. | Low | 5-line method using insertBefore(). Could add helper. |

### The Honest Pitch

Bitwrench is not React with different syntax. It's a different tool for
different problems:

- **Use React** when building a complex SPA with a team, deep component
  trees, and heavy form-driven interactions.
- **Use bitwrench** when you want a lightweight, zero-dependency UI library
  that works everywhere — from a CDN script tag to an ESP32 to a
  server-rendered dashboard.

The TACO model gives you something React can't: your UI is plain
JavaScript data that you can create, transform, serialize, and send over
the wire. The component API gives you something React's reconciliation
can't: O(1) surgical updates where you tell the component what to do,
instead of O(n) diffing where the framework guesses.

---

## The Argument For JSX Skeptics

> "But JSX is so much more readable!"

JSX is HTML-in-JS. TACO is JS-objects-as-UI. They express the same tree,
differently:

```jsx
// JSX
<Card title="Status">
  <Badge variant="success">Online</Badge>
  <Progress value={75} max={100} />
</Card>
```

```javascript
// TACO
bw.makeCard({ title: 'Status', content: [
  bw.makeBadge({ text: 'Online', variant: 'success' }),
  bw.makeProgress({ value: 75, max: 100 })
]})
```

The JSX version has angle brackets and closing tags. The TACO version has
braces and commas. Readability is familiarity, not inherent superiority.

But TACO has properties JSX doesn't:
1. **It's just data.** `JSON.stringify()` it, send it over the wire, store
   it in a database. Try that with JSX.
2. **No compiler.** Works in a `<script>` tag, in Node.js, in an eval().
   JSX requires babel/esbuild/swc.
3. **Programmable.** TACO is objects. Map, filter, reduce, transform,
   merge. JSX requires extra tooling for programmatic manipulation.
4. **Server-native.** Any language that outputs JSON can generate TACO.
   JSX is JavaScript-only.

The argument isn't "TACO reads better than JSX." It's "TACO does things
JSX can't, and reads well enough."

---

## Qt Comparison (for the desktop-framework crowd)

Qt's model is the closest analog to bitwrench Level 2:

```cpp
// Qt
QPushButton *btn = new QPushButton("Click me");
btn->setText("Updated");        // imperative setter
connect(btn, &QPushButton::clicked, this, &MyApp::onBtnClick);
layout->addWidget(btn);         // mount to parent

// Bitwrench
var btn = bw.component(bw.makeButton({ text: 'Click me' }));
btn.set('text', 'Updated');     // imperative setter
btn.on('click', onBtnClick);    // event connection
bw.DOM('#layout', btn);         // mount to parent
```

Qt developers will feel immediately at home. The mental model is
identical: create component, configure via setters, connect events,
mount to container. The substrate is different (DOM vs. QWidget) but
the API shape is the same.

The message dispatch parallel is even stronger:

```cpp
// Qt: send event to a widget
QApplication::sendEvent(widget, new QEvent(QEvent::User));

// Win32: send message to a window
SendMessage(hwnd, WM_USER + 1, 0, (LPARAM)"data");

// Bitwrench: send message to a component
bw.message('dashboard_prod_east', 'addAlert', { severity: 'warning' });
```

Same pattern: address a component, name an action, pass data. The
component handles it internally.

---

## Implementation: What Needs to Change

### P0: Core infrastructure (~95 lines of library code)

| Change | File | Lines |
|--------|------|-------|
| `o.methods` promotion to handle API | `src/bitwrench.js` (ComponentHandle constructor) | ~15 |
| `ComponentHandle.prototype.userTag(id)` | `src/bitwrench.js` | ~8 |
| `bw.message(target, action, data)` | `src/bitwrench.js` | ~12 |
| `bw.inspect(el_or_selector)` | `src/bitwrench.js` | ~35 |
| ComponentHandle detection in `bw.createDOM()` content walker | `src/bitwrench.js` | ~15 |
| ComponentHandle detection in `bw.html()` content walker | `src/bitwrench.js` | ~10 |

### P0: Tests (~80 lines)

| Test area | File |
|-----------|------|
| o.methods promotion + calling | `test/bitwrench_test_component_handle.js` |
| bw.message dispatch by UUID and userTag | `test/bitwrench_test_component_handle.js` |
| bw.inspect output | `test/bitwrench_test_component_handle.js` |
| ComponentHandle in content arrays | `test/bitwrench_test_component_handle.js` |

### P0: Documentation (~1 page)

| Page | Content |
|------|---------|
| `pages/11-debugging.html` | Console debugging guide, bw.inspect() examples, live state mutation, bw.message() for remote, building custom components with o.methods |

### Deferred (P1/P2)

| Change | Priority | Notes |
|--------|----------|-------|
| Factory `_factory` stash on BCCL TACOs | P1 | For `.set()` triggering factory rebuild |
| Factory rebuild in `_flush()` | P1 | Depends on _factory stash |
| ComponentHandle cleanup (remove design smells) | P1 | _deepCloneTaco, _tacoForDOM |
| Child component ownership (parent.destroy cascades) | P2 | Add when needed |
| Per-factory template-friendly TACO | P2 | Per-need basis |

### Total P0 scope

~95 lines of library code + ~80 lines of tests + 1 documentation page.
No changes to any existing factory. No changes to existing tests.
