# Example 2: Two-Component Page

A counter and a display that communicate. Tests: pub/sub, button events,
timer updates, component replacement.

---

## The components

### Counter: button with increment/decrement

```javascript
function makeCounter(config) {
  var step = config.step || 1;
  return {
    t: 'div', a: { class: 'counter' },
    c: [
      { t: 'button', a: { onclick: function() { dec(this); } }, c: '-' },
      { t: 'span', a: { class: 'counter-value' }, c: String(config.initial || 0) },
      { t: 'button', a: { onclick: function() { inc(this); } }, c: '+' }
    ],
    o: {
      type: 'counter',
      state: { count: config.initial || 0, step: step },
      slots: { display: '.counter-value' },
      handle: {
        increment: function(el) {
          el._bw_state.count += el._bw_state.step;
          el.bw.setDisplay(String(el._bw_state.count));
          bw.pub('counter:change', { count: el._bw_state.count });
        },
        decrement: function(el) {
          el._bw_state.count -= el._bw_state.step;
          el.bw.setDisplay(String(el._bw_state.count));
          bw.pub('counter:change', { count: el._bw_state.count });
        },
        reset: function(el) {
          el._bw_state.count = 0;
          el.bw.setDisplay('0');
          bw.pub('counter:change', { count: 0 });
        },
        update: function(el, data) {
          if (data.count !== undefined) {
            el._bw_state.count = data.count;
            el.bw.setDisplay(String(data.count));
          }
          if (data.step !== undefined) {
            el._bw_state.step = data.step;
          }
        }
      }
    }
  };
}

// Button event wiring: onclick finds the component root via closest()
// then calls its handle method
function inc(btn) {
  var root = btn.closest('.bw_is_component');
  if (root && root.bw) root.bw.increment();
}
function dec(btn) {
  var root = btn.closest('.bw_is_component');
  if (root && root.bw) root.bw.decrement();
}
```

**Ergonomics note:** The onclick->closest->el.bw pattern is how button
events reach the component. The button doesn't know about bitwrench -- it
just finds the nearest component ancestor and calls a method. This is
the standard DOM event delegation pattern.

Alternative: closures. The onclick could close over the TACO's state
directly. But then the button bypasses the component's handle method,
losing the pub/sub notification. The closest() pattern keeps the
component as the gate.

### Display: shows the count with formatting

```javascript
function makeDisplay(config) {
  return {
    t: 'div', a: { class: 'display' },
    c: [
      { t: 'label', c: config.label || 'Value' },
      { t: 'span', a: { class: 'display-value' }, c: '0' },
      { t: 'span', a: { class: 'display-status' }, c: 'waiting...' }
    ],
    o: {
      type: 'display',
      state: { count: 0, updates: 0 },
      slots: {
        value:  '.display-value',
        status: '.display-status'
      },
      handle: {
        update: function(el, data) {
          el._bw_state.count = data.count;
          el._bw_state.updates++;
          el.bw.setValue(formatCount(data.count));
          el.bw.setStatus('updated ' + el._bw_state.updates + ' times');
        }
      }
    }
  };
}

function formatCount(n) {
  if (n > 0) return '+' + n;
  return String(n);
}
```

---

## Wiring them together

### Basic: pub/sub

```javascript
// Mount both components
var counter = bw.mount('#controls', makeCounter({ initial: 0, step: 5 }));
var display = bw.mount('#output', makeDisplay({ label: 'Counter' }));

// Wire: counter publishes, display subscribes
bw.sub('counter:change', function(data) {
  display.bw.update(data);
}, display);  // auto-cleanup: when display is removed, sub is removed
```

Click '+' five times:
- counter.bw.increment() fires each time
- counter publishes { count: 5 }, { count: 10 }, ..., { count: 25 }
- display.bw.update({ count: 25 }) fires, shows '+25', 'updated 5 times'

**What feels good:** Two components, zero coupling. Counter doesn't know
display exists. Display doesn't know counter exists. pub/sub is the only
link. Either component can be replaced independently.

### With timer: auto-increment

```javascript
var timer = null;

function startAutoIncrement(counterEl) {
  timer = setInterval(function() {
    counterEl.bw.increment();
  }, 1000);
}

function stopAutoIncrement() {
  clearInterval(timer);
  timer = null;
}

// Start auto-increment
startAutoIncrement(counter);

// Stop when counter is removed
// Option A: use o.unmount
// Option B: just call stopAutoIncrement() before bw.remove()
```

**Ergonomics note:** Timer cleanup is the developer's job. bitwrench
provides o.unmount for this, but in this case the timer is external to
both components. The developer manages it. This is explicit and
unsurprising. No framework magic (React's useEffect cleanup, Vue's
onUnmounted).

Better pattern: make the timer part of the counter component:

```javascript
function makeAutoCounter(config) {
  var timerHandle = null;
  var taco = makeCounter(config);

  // Extend the handle with start/stop
  taco.o.handle.startAuto = function(el, interval) {
    timerHandle = setInterval(function() { el.bw.increment(); }, interval || 1000);
  };
  taco.o.handle.stopAuto = function(el) {
    clearInterval(timerHandle);
    timerHandle = null;
  };

  // Clean up timer on unmount
  taco.o.unmount = function(el) {
    clearInterval(timerHandle);
  };

  return taco;
}

var counter = bw.mount('#controls', makeAutoCounter({ initial: 0, step: 1 }));
counter.bw.startAuto(500);  // increment every 500ms
// ... later:
counter.bw.stopAuto();
// or: bw.remove(counter) -- o.unmount clears the timer automatically
```

**This is the composition pattern.** makeAutoCounter wraps makeCounter,
adds handle methods, adds unmount cleanup. No inheritance, no mixins, no
HOCs. Just a function that modifies a TACO before it's consumed.

---

## Replacing a component

The display component is boring. Replace it with a chart.

```javascript
function makeChart(config) {
  return {
    t: 'div', a: { class: 'chart' },
    c: [
      { t: 'canvas', a: { class: 'chart-canvas', width: 300, height: 200 } }
    ],
    o: {
      type: 'chart',
      state: { points: [] },
      mounted: function(el) {
        // set up canvas context
        var canvas = el.querySelector('.chart-canvas');
        el._ctx = canvas.getContext('2d');
      },
      handle: {
        update: function(el, data) {
          el._bw_state.points.push(data.count);
          drawChart(el._ctx, el._bw_state.points);
        }
      },
      unmount: function(el) {
        // canvas is GC'd automatically, but clear reference
        el._ctx = null;
      }
    }
  };
}

// Replace display with chart -- returns the new element
var chart = bw.replace(display, makeChart({}));
// display element is cleaned up (unmount fires, removed from _nodeMap)
// chart element is created, mounted at same DOM position
// display variable now points to a dead element; chart is the new ref

// Re-wire pub/sub (old subscription died with old element)
bw.sub('counter:change', function(data) {
  chart.bw.update(data);
}, chart);
```

**Note:** bw.replace() returns the new element. The old variable (`display`)
is stale. Always capture the return: `var chart = bw.replace(display, taco);`

**Ergonomics issue:** The pub/sub subscription was tied to the old
element and died with it. The developer must re-subscribe. This is
correct behavior (auto-cleanup) but means component replacement requires
re-wiring.

Alternative pattern: subscribe at the page level, dispatch dynamically:

```javascript
// Page-level dispatcher -- survives component replacement
bw.sub('counter:change', function(data) {
  bw.$('.bw_is_component_bccl_display, .bw_is_component_bccl_chart')
    .forEach(function(el) {
      if (el.bw && el.bw.update) el.bw.update(data);
    });
});
```

This subscription isn't tied to any element, so it survives replacement.
The querySelector finds whatever is currently mounted. Trade-off: no
auto-cleanup (must unsub manually if the page is torn down).

Or: use the page-as-component pattern (Example 3).

---

## Page-level CSS (palette-driven)

```javascript
// After bw.loadStyles(themeConfig):
var palette = bw.loadStyles(themeConfig).palette;

bw.injectCSS(bw.css({
  '.stats-card': {
    padding: '16px',
    'border-radius': '8px',
    'background-color': palette.surface,
    border: '1px solid ' + palette.light.border
  },
  '.counter': {
    display: 'flex',
    'align-items': 'center',
    gap: '8px'
  },
  '.counter button': {
    padding: '4px 12px',
    'background-color': palette.primary.base,
    color: palette.primary.textOn,
    border: 'none',
    'border-radius': '4px',
    cursor: 'pointer'
  },
  '.counter button:hover': {
    'background-color': palette.primary.hover
  }
}), { id: 'page-styles' });
```

No CSS vars. No .bw_theme_alt overrides. Values come from palette objects.
Dark mode: call bw.toggleThemeMode(), palette swaps, regenerate CSS.

---

## Ergonomics verdict

**Good:**
- Factory pattern is natural. Return a TACO, mount it, done.
- pub/sub decoupling works cleanly. Components don't know about each other.
- Composition via TACO modification (makeAutoCounter wraps makeCounter).
- Timer cleanup via o.unmount is explicit and correct.
- bw.replace() for component swapping is clean.
- CSS from palette objects -- no preprocessor, no CSS vars.

**Needs attention:**
- Event wiring (onclick -> closest -> el.bw.method) is boilerplate.
  Consider whether a convenience pattern is warranted, or if the
  explicitness is worth keeping.
- Re-subscribing pub/sub after component replacement is manual. The
  page-as-component pattern (Example 3) solves this.
- Closures in handle functions (timerHandle in makeAutoCounter) work but
  they're invisible to bw.inspect(). State in _bw_state is inspectable.
  Closure state is not. Document this trade-off.
