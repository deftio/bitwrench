# Example 3: Dashboard as Page Component

The canonical bitwrench pattern: the entire page is one TACO with slots
and handle methods. Solves the re-subscription problem from Example 2.
Tests: page-as-component, nested components, dynamic panel replacement,
data flow at scale.

---

## The dashboard

```javascript
function makeDashboard(config) {
  var statsCards = config.stats.map(function(s) {
    return makeStatsCard({ title: s.title, value: s.value });
  });

  return {
    t: 'div', a: { class: 'dashboard' },
    c: [
      // Header
      { t: 'header', a: { class: 'dash-header' }, c: [
        { t: 'h1', c: config.title },
        { t: 'span', a: { class: 'dash-status' }, c: 'connecting...' }
      ]},

      // Stats row
      { t: 'div', a: { class: 'dash-stats' }, c: statsCards },

      // Main panel (swappable)
      { t: 'div', a: { class: 'dash-main' }, c: [
        { t: 'p', c: 'Select a view...' }
      ]},

      // Controls
      { t: 'div', a: { class: 'dash-controls' }, c: [
        { t: 'button', a: { onclick: function() { switchView(this, 'table'); } }, c: 'Table' },
        { t: 'button', a: { onclick: function() { switchView(this, 'chart'); } }, c: 'Chart' },
        { t: 'button', a: { onclick: function() { switchView(this, 'feed'); } }, c: 'Feed' }
      ]}
    ],
    o: {
      type: 'dashboard',
      state: {
        currentView: null,
        lastUpdate: null
      },
      slots: {
        status: '.dash-status',
        main:   '.dash-main'
      },
      handle: {
        // Update stats cards by index
        updateStat: function(el, index, data) {
          var cards = el.querySelectorAll('.bw_is_component_bccl_stats_card');
          if (cards[index] && cards[index].bw) {
            cards[index].bw.update(data);
          }
        },

        // Bulk update all stats
        updateStats: function(el, statsArray) {
          var cards = el.querySelectorAll('.bw_is_component_bccl_stats_card');
          statsArray.forEach(function(data, i) {
            if (cards[i] && cards[i].bw) cards[i].bw.update(data);
          });
          el._bw_state.lastUpdate = Date.now();
          el.bw.setStatus('updated ' + new Date().toLocaleTimeString());
        },

        // Swap the main panel
        setView: function(el, viewName) {
          el._bw_state.currentView = viewName;

          var viewTaco;
          if (viewName === 'table') viewTaco = makeDataTable({});
          else if (viewName === 'chart') viewTaco = makeChart({});
          else if (viewName === 'feed')  viewTaco = makeFeed({});
          else viewTaco = { t: 'p', c: 'Unknown view: ' + viewName };

          // Slot setter handles cleanup of old content + mount of new
          el.bw.setMain(viewTaco);
        },

        // General data update (for bw.update() dispatch)
        update: function(el, data) {
          if (data.stats) el.bw.updateStats(data.stats);
          if (data.view)  el.bw.setView(data.view);
          if (data.status) el.bw.setStatus(data.status);
        }
      },

      mounted: function(el) {
        el.bw.setStatus('connected');
      },

      unmount: function(el) {
        // cleanup any active connections, timers, etc.
      }
    }
  };
}

function switchView(btn, viewName) {
  var dash = btn.closest('.bw_is_component_bccl_dashboard');
  if (dash && dash.bw) dash.bw.setView(viewName);
}
```

---

## Mount and use

```javascript
var dash = bw.mount('#app', makeDashboard({
  title: 'Sales Dashboard',
  stats: [
    { title: 'Revenue', value: 50000 },
    { title: 'Users',   value: 1234 },
    { title: 'Orders',  value: 89 },
    { title: 'Conv %',  value: 3.2 }
  ]
}));

// Update one stat
dash.bw.updateStat(0, { value: 52000 });

// Bulk update all stats
dash.bw.updateStats([
  { value: 55000 },
  { value: 1300 },
  { value: 95 },
  { value: 3.5 }
]);

// Switch view
dash.bw.setView('table');

// Smart dispatch (same result)
bw.update(dash, {
  stats: [{ value: 60000 }, { value: 1400 }, { value: 101 }, { value: 3.8 }],
  view: 'chart'
});
```

---

## Data flow with pub/sub

```javascript
// Subscribe at the dashboard level -- survives child replacement
bw.sub('api:data', function(data) {
  dash.bw.update(data);
}, dash);

// Simulate server data
setInterval(function() {
  bw.pub('api:data', {
    stats: [
      { value: Math.floor(Math.random() * 100000) },
      { value: Math.floor(Math.random() * 5000) },
      { value: Math.floor(Math.random() * 200) },
      { value: (Math.random() * 5).toFixed(1) }
    ]
  });
}, 2000);
```

**Why this solves the re-subscription problem from Example 2:**
The subscription is on the dashboard element, not the child components.
When the main panel is replaced (table -> chart), the subscription stays.
The dashboard's `update` handle dispatches to whatever is currently mounted.

---

## Via bwserve

```javascript
// Server-side (Node.js):
conn.send({ type: 'update', ref: '#app .bw_is_component_bccl_dashboard', data: {
  stats: [{ value: 72000 }, { value: 1800 }, { value: 130 }, { value: 4.1 }],
  status: 'live data'
}});

// Client automatically: bw.update(ref, data) -> dash.bw.update(data)

// Server replaces the main panel:
conn.send({ type: 'message', ref: '#app .bw_is_component_bccl_dashboard',
  action: 'setView', data: 'feed' });
```

Server uses the same operations as client code. No special protocol
for "update a nested component" -- the dashboard handle does the routing.

---

## Slot setter with component content

When `el.bw.setMain(viewTaco)` is called:
1. Slot setter finds cached target (.dash-main)
2. Calls cleanupChildren on .dash-main (old view's unmount fires)
3. Creates new DOM from viewTaco via createDOM (create+hydrate fused)
4. Appends to .dash-main
5. Calls _mountTree on new content (UUID registered, mounted() fires)

This means the slot setter IS the full lifecycle pipeline for child
content. Old components get proper cleanup. New components get proper
mount. The dashboard doesn't need to know or care.

**Ergonomics check:** This works. The slot setter does the right thing
automatically once GAP-3 and GAP-4 are fixed. No manual cleanup/mount.

---

## Nested component discovery

```javascript
// Find all stats cards in the dashboard
var cards = dash.querySelectorAll('.bw_is_component_bccl_stats_card');
// => NodeList of 4 elements, each with el.bw.update()

// Find the currently mounted view
var view = dash.querySelector('.dash-main .bw_is_component');
// => the table, chart, or feed component (whatever is mounted)

// From bwcli / bwattach:
// bwcli inspect
// => shows dashboard with 4 stats-card children + 1 chart child
//    lists all el.bw method names for each
```

Standard DOM queries. No framework API for "get child components."
querySelector IS the API. This is what "DOM IS the registry" means.

---

## Ergonomics verdict

**Good:**
- Page-as-component is the natural pattern. One TACO, one mount, one
  subscription. Handle methods dispatch to children.
- bw.update(dash, data) from any context (client, server, LLM, CLI)
  does the right thing because the dashboard's update handle routes data.
- Slot setters with TACO content do full lifecycle (cleanup + mount).
  No manual plumbing.
- Component replacement (setView) is clean: one slot setter call.
- Nested component discovery via querySelector. No framework method.
- Server and client use identical operation vocabulary.

**Needs attention:**
- Handle methods reference child components via querySelectorAll. If the
  DOM structure changes (e.g., stats cards wrapped in an extra div), the
  selector breaks. Using o.type classes (.bw_is_component_bccl_stats_card)
  is robust -- they survive structural changes.
- The dashboard handle is getting large (updateStat, updateStats, setView,
  update). For bigger pages, split into sub-handle functions or use
  composition (extend taco.o.handle from multiple sources).
- Closure state (timers, connections) should go in o.state when possible
  so bw.inspect() can see it. Trade-off: o.state is a plain object, not
  a class with methods. Complex objects (WebSocket, canvas context) must
  be closures or DOM properties.
