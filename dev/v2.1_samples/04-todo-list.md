# Example 4: Todo List -- Dynamic Children

The classic test for UI frameworks. Tests: dynamic list management via
handle methods, add/remove without full rebuild, state as source of truth,
input handling.

**Structure of this example:** The first version below is intentionally
written without bw.append() to discover whether the API has gaps. It
does -- and the "STOP. Problem found." section documents the discovery.
The revised version below it shows the correct approach using bw.append().
Both versions are kept to show how the examples validated the API design.

---

## The component (first attempt -- reveals API gap)

```javascript
function makeTodoList(config) {
  var items = (config.items || []).map(function(text, i) {
    return makeTodoItem({ text: text, id: i });
  });

  return {
    t: 'div', a: { class: 'todo-list' },
    c: [
      // Input row
      { t: 'div', a: { class: 'todo-input' }, c: [
        { t: 'input', a: {
          type: 'text',
          placeholder: 'Add a task...',
          class: 'todo-field',
          onkeydown: function(e) {
            if (e.key === 'Enter' && e.target.value.trim()) {
              addItem(e.target);
            }
          }
        }},
        { t: 'button', a: {
          class: 'todo-add-btn',
          onclick: function() { addItem(this); }
        }, c: 'Add' }
      ]},

      // Count
      { t: 'span', a: { class: 'todo-count' }, c: items.length + ' items' },

      // List container
      { t: 'ul', a: { class: 'todo-items' }, c: items }
    ],
    o: {
      type: 'todo',
      state: {
        nextId: items.length,
        items: (config.items || []).map(function(text, i) {
          return { id: i, text: text, done: false };
        })
      },
      slots: { count: '.todo-count' },
      handle: {
        addItem: function(el, text) {
          var id = el._bw_state.nextId++;
          el._bw_state.items.push({ id: id, text: text, done: false });

          var itemTaco = makeTodoItem({ text: text, id: id });
          var list = el.querySelector('.todo-items');
          var node = bw.createDOM(itemTaco);
          list.appendChild(node);
          // _mountTree is called internally by... hmm.

          el.bw.setCount(el._bw_state.items.length + ' items');
        },

        removeItem: function(el, id) {
          // Remove from state
          el._bw_state.items = el._bw_state.items.filter(function(item) {
            return item.id !== id;
          });

          // Remove from DOM
          var itemEl = el.querySelector('[data-todo-id="' + id + '"]');
          // WAIT: no data-* attributes in bitwrench!
          // Use a class or DOM property instead:
          var items = el.querySelectorAll('.todo-item');
          items.forEach(function(itemEl) {
            if (itemEl._todoId === id) {
              bw.remove(itemEl);
            }
          });

          el.bw.setCount(el._bw_state.items.length + ' items');
        },

        toggleItem: function(el, id) {
          el._bw_state.items.forEach(function(item) {
            if (item.id === id) item.done = !item.done;
          });

          var items = el.querySelectorAll('.todo-item');
          items.forEach(function(itemEl) {
            if (itemEl._todoId === id) {
              itemEl.classList.toggle('done');
            }
          });
        },

        update: function(el, data) {
          if (data.add) el.bw.addItem(data.add);
          if (data.remove !== undefined) el.bw.removeItem(data.remove);
          if (data.toggle !== undefined) el.bw.toggleItem(data.toggle);
        }
      }
    }
  };
}
```

**STOP. Problem found.**

The addItem handle calls `bw.createDOM()` + `list.appendChild()` but
_mountTree doesn't fire automatically. In the current design, _mountTree
is called by bw.mount() and bw.DOM() after appendChild. But here we're
doing manual appendChild inside a handle method.

Options:
1. `bw.append(list, itemTaco)` -- the NEW API does createDOM + appendChild
   + _mountTree. This is exactly what we designed it for.
2. Manual: `var node = bw.createDOM(itemTaco); list.appendChild(node); bw._mountTree(node);`
   -- works but _mountTree is internal.

**Answer: use bw.append().** That's why we created it.

---

## Revised: using bw.append and bw.remove

```javascript
function makeTodoList(config) {
  var initialItems = (config.items || []).map(function(text, i) {
    return makeTodoItem({ text: text, id: i });
  });

  return {
    t: 'div', a: { class: 'todo-list' },
    c: [
      { t: 'div', a: { class: 'todo-input' }, c: [
        { t: 'input', a: {
          type: 'text',
          placeholder: 'Add a task...',
          class: 'todo-field',
          onkeydown: function(e) {
            if (e.key === 'Enter' && e.target.value.trim()) {
              addItem(e.target);
            }
          }
        }},
        { t: 'button', a: { onclick: function() { addItem(this); } }, c: 'Add' }
      ]},
      { t: 'span', a: { class: 'todo-count' }, c: initialItems.length + ' items' },
      { t: 'ul', a: { class: 'todo-items' }, c: initialItems }
    ],
    o: {
      type: 'todo',
      state: {
        nextId: initialItems.length,
        items: (config.items || []).map(function(text, i) {
          return { id: i, text: text, done: false };
        })
      },
      slots: { count: '.todo-count' },
      handle: {
        addItem: function(el, text) {
          var id = el._bw_state.nextId++;
          el._bw_state.items.push({ id: id, text: text, done: false });

          // bw.append: createDOM + appendChild + _mountTree
          bw.append(el.querySelector('.todo-items'), makeTodoItem({ text: text, id: id }));

          el.bw.setCount(el._bw_state.items.length + ' items');

          // Clear the input
          var input = el.querySelector('.todo-field');
          if (input) { input.value = ''; input.focus(); }
        },

        removeItem: function(el, id) {
          el._bw_state.items = el._bw_state.items.filter(function(item) {
            return item.id !== id;
          });

          // Find the item element by DOM property
          var itemEl = findItemById(el, id);
          if (itemEl) bw.remove(itemEl);

          el.bw.setCount(el._bw_state.items.length + ' items');
        },

        toggleItem: function(el, id) {
          var item = el._bw_state.items.find(function(i) { return i.id === id; });
          if (item) item.done = !item.done;

          var itemEl = findItemById(el, id);
          if (itemEl) itemEl.classList.toggle('done');
        },

        update: function(el, data) {
          if (data.add) el.bw.addItem(data.add);
          if (data.remove !== undefined) el.bw.removeItem(data.remove);
          if (data.toggle !== undefined) el.bw.toggleItem(data.toggle);
        }
      }
    }
  };
}

function makeTodoItem(config) {
  return {
    t: 'li', a: { class: 'todo-item' },
    c: [
      { t: 'input', a: {
        type: 'checkbox',
        onclick: function() { toggleFromItem(this, config.id); }
      }},
      { t: 'span', c: config.text },
      { t: 'button', a: {
        class: 'todo-remove',
        onclick: function() { removeFromItem(this, config.id); }
      }, c: 'x' }
    ],
    o: {
      mounted: function(el) {
        // Store the item ID on the DOM element for lookup
        el._todoId = config.id;
      }
    }
  };
}

// Find a todo item element by its _todoId property
function findItemById(listEl, id) {
  var items = listEl.querySelectorAll('.todo-item');
  for (var i = 0; i < items.length; i++) {
    if (items[i]._todoId === id) return items[i];
  }
  return null;
}

// Event handlers: navigate up to the list component, call handle
function addItem(el) {
  var list = el.closest('.bw_is_component_bccl_todo');
  var input = list.querySelector('.todo-field');
  if (list && input && input.value.trim()) {
    list.bw.addItem(input.value.trim());
  }
}

function toggleFromItem(checkbox, id) {
  var list = checkbox.closest('.bw_is_component_bccl_todo');
  if (list) list.bw.toggleItem(id);
}

function removeFromItem(btn, id) {
  var list = btn.closest('.bw_is_component_bccl_todo');
  if (list) list.bw.removeItem(id);
}
```

---

## Usage

```javascript
var todos = bw.mount('#app', makeTodoList({
  items: ['Buy groceries', 'Write docs', 'Ship v2.1.0']
}));

// Programmatic add
todos.bw.addItem('Review lifecycle design');

// Via bw.update (smart dispatch)
bw.update(todos, { add: 'Fix GAP-3' });
bw.update(todos, { toggle: 2 });   // toggle 'Ship v2.1.0'
bw.update(todos, { remove: 0 });   // remove 'Buy groceries'

// Via bwserve
// conn.send({ type: 'update', ref: '.bw_is_component_bccl_todo', data: { add: 'Server task' } });
```

---

## What this example reveals

### bw.append() is essential

Without it, the developer must do `bw.createDOM()` + `appendChild()` +
manual _mountTree call. bw.append() wraps the full pipeline. We designed
this API -- the todo list proves we need it.

### Item identity without data-* attributes

Each todo item stores `el._todoId` (set in mounted()). Lookup is
O(n) querySelectorAll + scan. For a todo list (<100 items) this is fine.
For large lists, alternatives:
- Use bw.assignUUID() on each item TACO, store a map { id -> uuid }
  in the parent's state, then bw.el(uuid) for O(1) lookup.
- Store items as components with o.type, use typed discovery.

For this example, DOM property + scan is the simplest correct approach.

### State lives in the parent

The todo list component owns the items array in _bw_state. Individual
todo items are lightweight (just DOM + a _todoId property, plus bw_lc
marker for cleanup). The items don't have their own state -- they're
rendered children, not independent components.

This is a design choice. Alternative: each item could be a full component
with its own state. That's heavier but more inspectable. For a todo item
(text + done boolean), the lighter approach is fine.

### The update handle is the routing layer

`el.bw.update(data)` accepts `{add, remove, toggle}` and dispatches to
the appropriate handle method. This is the pattern for bw.update() smart
dispatch: one `update` method that routes based on data shape.

### No conditional rendering needed

"Show completed items" filter? Don't hide/show elements -- just toggle
a CSS class on the list container, and use CSS `.todo-list.hide-done .done { display: none }`.
Or: rebuild the list from state with the filter applied (bw.refresh
territory, but only if the filter changes the DOM structure).

For toggle done/undone: classList.toggle('done'). Pure DOM. No framework
feature needed.

---

## Ergonomics verdict

**Good:**
- bw.append() and bw.remove() are the right primitives for list management.
- Handle methods do the state bookkeeping + DOM update in one place.
- Event delegation (onclick -> closest -> el.bw.method) is consistent
  across all examples.
- bw.update(todos, {add: 'text'}) from any context (client, server, LLM).
- No rebuild needed for add/remove/toggle. Surgical DOM updates.

**Needs attention:**
- Item identity lookup is O(n). Fine for small lists. For large lists,
  document the UUID map pattern.
- The mounted() hook on todo items exists just to set el._todoId. Could
  this be simpler? The alternative is a DOM property set during create
  (not hydrate). But the current design wires properties in hydrate/mount.
  This is a minor friction point.
- Handle methods manipulate child DOM directly (querySelector, classList).
  This is correct (the parent component owns its children's rendering).
  But it means the parent knows the child's class names. If makeTodoItem
  changes its class, the parent breaks. Coupling is localized (both in
  the same file), but worth noting.
