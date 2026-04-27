# Example 1: Stats Card -- Full Lifecycle

Walk through every phase of a component's life using the v2.1.0 API.
This is a design exercise to test ergonomics before implementation.

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

What we have: a factory function that returns a TACO. Plain data (minus
the handle function). The factory captures `config` but does NOT create
DOM, wire lifecycle, or touch the document. This is just an object.

**What goes where:**
- `t, a, c` -- structure (tag, attributes, content)
- `o.type` -- typed discovery: `document.querySelectorAll('.bw_is_component_bccl_stats_card')`
- `o.state` -- local mutable state (value). Initialized from config.
- `o.slots` -- cached DOM targets. Auto-generates el.bw.setTitle(),
  el.bw.getTitle(), el.bw.setValue(), el.bw.getValue().
- `o.handle.update` -- the public "give me new data" method. Does
  formatting logic, then delegates to slot setters for DOM update.

**Slot vs handle interaction:** Slots generate simple setters that replace
DOM content. The `update` handle method adds logic (formatting) then calls
slot setters. Both live on el.bw. They don't collide because they have
different names: `setValue` (slot) vs `update` (handle).

The handle `update` is special: `bw.update(ref, data)` dispatches to
`el.bw.update(data)` automatically. So the factory just needs to define
an `update` handle method to work with the smart dispatch API.

---

## Phase 2+3: Create + Hydrate

```javascript
var taco = makeStatsCard({ title: 'Revenue', value: 50000 });
var node = bw.createDOM(taco);
```

After this call, `node` is a detached DOM element:
- `node.tagName` === 'DIV'
- `node.className` includes 'stats-card bw_lc bw_is_component bw_uuid_xxxx'
- `node._bw_state` === `{ value: 50000 }`
- `node.bw.update` exists (bound handle method)
- `node.bw.setValue` exists (slot setter, cached querySelector to .card-value)
- `node.bw.setTitle` exists (slot setter, cached querySelector to .card-title)
- `node.bw.getValue` exists (slot getter)
- `node._bw_type` === 'stats-card'
- The h3 contains 'Revenue', the span contains '$50,000'
- **NOT in the document.** Not in _nodeMap. mounted() has NOT fired.

You rarely call createDOM directly. This is shown for understanding.

---

## Phase 4: Mount

```javascript
var el = bw.mount('#dashboard', taco);
```

`bw.mount` does: cleanupChildren('#dashboard') + createDOM(taco) +
appendChild + _mountTree. Returns the root element.

After mount:
- Element is in the document inside #dashboard
- UUID registered in _nodeMap (findable via bw.el(uuid))
- mounted() would have fired if we had one (we don't -- no o.mounted)
- Element is alive: el.bw.update({value: 75000}) works

---

## Phase 5: Update

### Direct handle method call (cheapest)

```javascript
el.bw.update({ value: 75000 });
// card now shows '$75,000'
// el._bw_state.value === 75000
```

### Slot setter (bypass formatting logic)

```javascript
el.bw.setValue('SOLD OUT');
// card shows 'SOLD OUT' (raw, no formatting)
// el._bw_state.value is NOT updated (slot setter doesn't touch state)
```

This is intentional. Slot setters are low-level. Handle methods are the
public API. The developer decides whether raw slot access is appropriate.

### Smart dispatch via bw.update

```javascript
bw.update(el, { value: 100000, title: 'Profit' });
// dispatches to el.bw.update({ value: 100000, title: 'Profit' })
// card shows '$100,000', title changes to 'Profit'
```

Works identically via UUID:

```javascript
var uuid = bw.getUUID(el);
bw.update(uuid, { value: 100000 });
```

### Via bw.message (explicit method name)

```javascript
bw.message(el, 'update', { value: 200000 });
// same as el.bw.update({ value: 200000 })
```

### Via pub/sub (decoupled)

```javascript
bw.sub('revenue:change', function(data) {
  el.bw.update(data);
}, el);

// elsewhere:
bw.pub('revenue:change', { value: 999999 });
// card updates to '$999,999'
```

The third argument to bw.sub ties the subscription to the element.
When the element is cleaned up, the subscription is automatically removed.

---

## Phase 6: Unmount

```javascript
bw.remove(el);
```

This does: bw.cleanup(el) + el.remove(). Cleanup:
- Fires o.unmount if it existed (ours doesn't)
- Removes UUID from _nodeMap
- Calls unsub() on all pub/sub subscriptions tied to this element
- Deletes _bw_state, _bw_render, _bw_type, el.bw
- Removes element from DOM

After this, `el` is an inert DOM node with no bitwrench properties.

---

## The factory as reusable template

```javascript
var revenue = bw.mount('#stats', makeStatsCard({ title: 'Revenue', value: 50000 }));
var users   = bw.mount('#stats', makeStatsCard({ title: 'Users',   value: 1234 }));
var orders  = bw.mount('#stats', makeStatsCard({ title: 'Orders',  value: 89 }));
```

Three independent instances. Each has its own state, its own UUID, its
own slot targets. `makeStatsCard` is called three times, returning three
different TACO objects. The handle function in `o.handle.update` is shared
by reference (same function object), but `el` (first arg) is bound per
instance. State is per instance (`el._bw_state`).

To update all three:

```javascript
bw.pub('dashboard:refresh', newData);
// each card subscribed to this topic updates independently
```

---

## Ergonomics check

**What feels good:**
- Factory returns TACO, bw.mount does the rest. One line to create+mount.
- el.bw.update(data) is the natural public API. Formatting logic lives
  in one place (the handle method).
- Slot setters for simple cases, handles for logic. Clear layering.
- pub/sub with auto-cleanup via element binding.
- bw.update(uuid, data) works without holding the element reference.

**What to watch:**
- Slot setters bypass state. If someone calls el.bw.setValue('raw') instead
  of el.bw.update({value: 42}), state and DOM diverge. This is by design
  (slots are low-level), but worth documenting clearly.
- The handle function signature `function(el, data)` means `this` is not
  the element. MFC/Qt developers might expect `this.setValue()`. bitwrench
  uses `el.bw.setValue()`. Documented trade-off: arrow functions work,
  no `this` binding issues.
