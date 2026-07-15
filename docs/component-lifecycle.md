# Component Lifecycle Walkthrough

A stats card, taken through every phase of a component's life — define, create,
mount, update, unmount — using the v2.1 API. If you read one document after the
README, read this one: it is the shortest complete tour of how bitwrench
components actually work.

---

## Phase 1: Define

A stats card that displays a label and a formatted number.

```javascript
function makeStatsCard(config) {
  return {
    t: 'div', a: { class: 'stats-card' },
    c: [
      { t: 'h3', a: { class: 'card-title' }, c: config.title || '' },
      { t: 'span', a: { class: 'card-value' }, c: formatValue(config.value) }
    ],
    o: {
      type: 'stats-card',
      state: { value: config.value || 0 },
      slots: { title: '.card-title', value: '.card-value' },
      handle: {
        update: function(el, data) {
          if (data.value !== undefined) {
            el._bw_state.value = data.value;
            el.bw.setValue(formatValue(data.value));
          }
          if (data.title !== undefined) {
            el.bw.setTitle(data.title);
          }
        }
      }
    }
  };
}

function formatValue(v) {
  return '$' + Number(v).toLocaleString();
}
```

What we have: a factory function that returns a TACO. Plain data (minus the
handle function). The factory captures `config` but does NOT create DOM, wire
lifecycle, or touch the document. This is just an object.

**What goes where:**

- `t, a, c` — structure (tag, attributes, content)
- `o.type` — typed discovery: elements get a `bw_is_component_stats-card` class,
  findable via `querySelectorAll`
- `o.state` — local mutable state (value), initialized from config
- `o.slots` — cached DOM targets. Auto-generates `el.bw.setTitle()`,
  `el.bw.getTitle()`, `el.bw.setValue()`, `el.bw.getValue()`
- `o.handle.update` — the public "give me new data" method. Does formatting
  logic, then delegates to slot setters for the DOM update

**Slot vs handle interaction:** slots generate simple setters that replace DOM
content. The `update` handle method adds logic (formatting) then calls slot
setters. Both live on `el.bw`. They don't collide because they have different
names: `setValue` (slot) vs `update` (handle).

The handle named `update` is special: `bw.update(ref, data)` dispatches to
`el.bw.update(data)` automatically. Define an `update` handle and your
component works with the dispatch API for free.

---

## Phase 2+3: Create + Hydrate

```javascript
var taco = makeStatsCard({ title: 'Revenue', value: 50000 });
var node = bw.create(taco);
```

After this call, `node` is a **detached** DOM element:

- `node.tagName` === `'DIV'`
- `node.className` includes `stats-card bw_lc bw_is_component bw_uuid_xxxx`
- `node._bw_state` === `{ value: 50000 }`
- `node.bw.update` exists (bound handle method)
- `node.bw.setValue` / `node.bw.setTitle` exist (slot setters, cached selectors)
- `node.bw.getValue` / `node.bw.getTitle` exist (slot getters)
- The h3 contains `Revenue`, the span contains `$50,000`
- **NOT in the document.** Not registered. `o.mounted` has NOT fired.

You rarely call `bw.create()` directly — this is shown for understanding.

---

## Phase 4: Mount

```javascript
var el = bw.mount('#dashboard', taco);
```

`bw.mount()` unmounts any previous children of `#dashboard`, creates the
element, appends it, and runs the mount pass. It returns the root element.
(`bw.DOM()` is the same function under its other name.)

After mount:

- Element is in the document inside `#dashboard`
- Its UUID is registered — findable via `bw.el('bw_uuid_xxxx')`
- `o.mounted` would have fired if this component had one (it doesn't)
- Element is alive: `el.bw.update({ value: 75000 })` works

**Try it in devtools:** select the card in the Elements panel and type
`$0._bw_state` — the component's state, no browser extension required.
`$0.bw` shows its public methods.

---

## Phase 5: Update

Five ways, ordered by cost and coupling:

### Direct handle method call (cheapest)

```javascript
el.bw.update({ value: 75000 });
// card shows '$75,000'; el._bw_state.value === 75000
```

### Slot setter (bypasses the handle's logic)

```javascript
el.bw.setValue('SOLD OUT');
// card shows 'SOLD OUT' (raw, no formatting)
// el._bw_state.value is NOT updated — slot setters don't touch state
```

This is intentional. Slot setters are low-level; handle methods are the public
API. If you call `setValue()` directly, keeping state consistent is on you.

### Dispatch via bw.update

```javascript
bw.update(el, { value: 100000, title: 'Profit' });
// dispatches to el.bw.update({ ... })
```

Works identically by UUID, without holding the element reference:

```javascript
var uuid = bw.getUUID(el);
bw.update(uuid, { value: 100000 });
```

### Dispatch via bw.message (explicit method name)

```javascript
bw.message(el, 'update', { value: 200000 });
// same as el.bw.update({ value: 200000 })
```

### Pub/sub (decoupled)

```javascript
bw.sub('revenue:change', function(data) {
  el.bw.update(data);
}, el);

// elsewhere:
bw.pub('revenue:change', { value: 999999 });
```

The third argument to `bw.sub()` ties the subscription to the element — when
the element is unmounted, the subscription is removed automatically.

Note what this component never needs: `bw.refresh()`. It has no `o.render`,
because every update it supports is surgical. Reach for `o.render` +
`bw.refresh(el)` when the component's *structure* changes with state, not just
its values.

---

## Phase 6: Unmount

```javascript
bw.remove(el);
```

This unmounts and removes the element. The unmount pass:

- Fires `o.unmount` if it existed (ours doesn't)
- Unregisters the UUID
- Unsubscribes all pub/sub subscriptions tied to this element
- Deletes `_bw_state`, `_bw_render`, `_bw_type`, and `el.bw`
- Removes the element from the DOM

After this, `el` is an inert DOM node with no bitwrench properties.

---

## The factory as reusable template

```javascript
var revenue = bw.mount('#stats', makeStatsCard({ title: 'Revenue', value: 50000 }));
var users   = bw.mount('#stats', makeStatsCard({ title: 'Users',   value: 1234 }));
var orders  = bw.mount('#stats', makeStatsCard({ title: 'Orders',  value: 89 }));
```

Three independent instances. Each has its own state, its own UUID, its own slot
targets. The handle function is shared by reference, but `el` (the first
argument) is bound per instance. State is per instance (`el._bw_state`).

To update all three at once, publish:

```javascript
bw.pub('dashboard:refresh', newData);
// each card subscribed to this topic updates independently
```

---

## The design in one paragraph

The TACO was consumed at mount time — bitwrench does not keep a copy of it.
Everything the component is now lives on the DOM element itself: its state
(`el._bw_state`), its public API (`el.bw`), its identity (`bw_uuid_*` class).
There is no shadow tree to reconcile and no framework instance to look up.
That's why updates are explicit and cheap — you (or the component itself) talk
directly to the element — and why any component can be inspected, driven, or
debugged from the browser console with no tooling.

## See also

- [State Management](state-management.md) — the full component model, `o.render` + `bw.refresh()`
- [Thinking in Bitwrench §7](thinking-in-bitwrench.md) — lifecycle options and the update cost spectrum
- [Component Library](component-library.md) — the built-in BCCL factories, which follow this exact pattern
