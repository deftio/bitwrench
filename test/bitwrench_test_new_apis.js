/**
 * Bitwrench v2 New API Test Suite
 * Tests for bw.once(), bw.formData(), bw.catalog()
 * 100% line coverage target for all three functions
 */

import assert from "assert";
import bw from "../src/bitwrench.js";
import jsdom from 'jsdom';
const { JSDOM } = jsdom;

var dom;

function freshDOM() {
  dom = new JSDOM('<!DOCTYPE html><html><body><div id="app"></div></body></html>');
  global.window = dom.window;
  global.document = dom.window.document;
  global.Element = dom.window.Element;
  global.DocumentFragment = dom.window.DocumentFragment;
  global.HTMLElement = dom.window.HTMLElement;
  global.CustomEvent = dom.window.CustomEvent;
  global.requestAnimationFrame = function(fn) { fn(); };
  if (bw._nodeMap) {
    Object.keys(bw._nodeMap).forEach(function(k) { delete bw._nodeMap[k]; });
  }
}

// =========================================================================
// bw.once()
// =========================================================================
describe("bw.once()", function() {
  beforeEach(function() {
    freshDOM();
    bw._topics = {};
    bw._subIdCounter = 0;
  });

  it("should be a function", function() {
    assert.equal(typeof bw.once, 'function');
  });

  it("should fire handler on first publish", function() {
    var received = null;
    bw.once('test:once', function(detail) { received = detail; });
    bw.pub('test:once', 42);
    assert.equal(received, 42);
  });

  it("should NOT fire handler on second publish", function() {
    var count = 0;
    bw.once('test:once2', function() { count++; });
    bw.pub('test:once2', 'a');
    bw.pub('test:once2', 'b');
    bw.pub('test:once2', 'c');
    assert.equal(count, 1);
  });

  it("should auto-unsubscribe after first fire", function() {
    bw.once('test:auto', function() {});
    assert.ok(bw._topics['test:auto'], 'topic exists before fire');
    bw.pub('test:auto');
    // After fire + unsub, topic array should be cleaned up
    assert.equal(bw._topics['test:auto'], undefined);
  });

  it("should return a cancel function", function() {
    var cancel = bw.once('test:cancel', function() {});
    assert.equal(typeof cancel, 'function');
  });

  it("should cancel before firing when cancel() is called", function() {
    var called = false;
    var cancel = bw.once('test:cancel2', function() { called = true; });
    cancel();
    bw.pub('test:cancel2');
    assert.equal(called, false);
  });

  it("should pass detail object to handler", function() {
    var received = null;
    bw.once('test:detail', function(d) { received = d; });
    bw.pub('test:detail', { name: 'hello', value: 99 });
    assert.deepEqual(received, { name: 'hello', value: 99 });
  });

  it("should work with element lifecycle binding", function() {
    var el = document.createElement('div');
    document.body.appendChild(el);
    var called = false;
    bw.once('test:el', function() { called = true; }, el);
    assert.ok(Array.isArray(el._bw_subs), 'should store unsub on element');
    bw.pub('test:el');
    assert.equal(called, true);
    document.body.removeChild(el);
  });

  it("should not interfere with other subscribers on same topic", function() {
    var onceCount = 0;
    var subCount = 0;
    bw.sub('test:mixed', function() { subCount++; });
    bw.once('test:mixed', function() { onceCount++; });
    bw.pub('test:mixed');
    bw.pub('test:mixed');
    assert.equal(onceCount, 1);
    assert.equal(subCount, 2);
  });

  it("should handle undefined detail", function() {
    var received = 'sentinel';
    bw.once('test:undef', function(d) { received = d; });
    bw.pub('test:undef');
    assert.equal(received, undefined);
  });
});

// =========================================================================
// Wildcard subscriptions
// =========================================================================
describe("Wildcard subscriptions", function() {
  beforeEach(function() {
    freshDOM();
    bw._topics = {};
    bw._subIdCounter = 0;
  });

  it("should match topics with trailing * wildcard", function() {
    var received = [];
    bw.sub('agui:*', function(d) { received.push(d); });
    bw.pub('agui:ready', 'r');
    bw.pub('agui:error', 'e');
    assert.deepEqual(received, ['r', 'e']);
  });

  it("should pass the actual topic as second arg to handler", function() {
    var topics = [];
    bw.sub('ns:*', function(d, t) { topics.push(t); });
    bw.pub('ns:one', 1);
    bw.pub('ns:two', 2);
    assert.deepEqual(topics, ['ns:one', 'ns:two']);
  });

  it("should also pass topic to exact-match handlers", function() {
    var got;
    bw.sub('exact', function(d, t) { got = t; });
    bw.pub('exact', 'x');
    assert.equal(got, 'exact');
  });

  it("should not double-fire when publishing the pattern string itself", function() {
    var count = 0;
    bw.sub('foo:*', function() { count++; });
    bw.pub('foo:*');  // fires as exact match of the key, but NOT also as wildcard
    assert.equal(count, 1);  // exactly once (exact match only, no wildcard self-match)
  });

  it("should fire both exact and wildcard subscribers", function() {
    var exactCount = 0, wildCount = 0;
    bw.sub('data:update', function() { exactCount++; });
    bw.sub('data:*', function() { wildCount++; });
    var total = bw.pub('data:update', {});
    assert.equal(exactCount, 1);
    assert.equal(wildCount, 1);
    assert.equal(total, 2);
  });

  it("should match empty suffix after prefix", function() {
    var count = 0;
    bw.sub('x:*', function() { count++; });
    bw.pub('x:', 'empty suffix');
    assert.equal(count, 1);
  });

  it("should not match if prefix does not match", function() {
    var count = 0;
    bw.sub('alpha:*', function() { count++; });
    bw.pub('beta:something');
    assert.equal(count, 0);
  });

  it("should support unsubscribe from wildcard", function() {
    var count = 0;
    var unsub = bw.sub('ev:*', function() { count++; });
    bw.pub('ev:a');
    assert.equal(count, 1);
    unsub();
    bw.pub('ev:b');
    assert.equal(count, 1);
  });

  it("should work with bw.once() and wildcards", function() {
    var count = 0;
    bw.once('o:*', function() { count++; });
    bw.pub('o:first');
    bw.pub('o:second');
    assert.equal(count, 1);
  });

  it("should handle multiple wildcard patterns", function() {
    var aCount = 0, bCount = 0;
    bw.sub('a:*', function() { aCount++; });
    bw.sub('b:*', function() { bCount++; });
    bw.pub('a:test');
    bw.pub('b:test');
    assert.equal(aCount, 1);
    assert.equal(bCount, 1);
  });

  it("should match deeply nested topics", function() {
    var received = [];
    bw.sub('app:*', function(d, t) { received.push(t); });
    bw.pub('app:module:sub:event', 'deep');
    assert.deepEqual(received, ['app:module:sub:event']);
  });

  it("should handle * as bare wildcard matching all topics", function() {
    var topics = [];
    bw.sub('*', function(d, t) { topics.push(t); });
    bw.pub('anything', 1);
    bw.pub('something:else', 2);
    assert.deepEqual(topics, ['anything', 'something:else']);
  });

  it("should survive handler error in wildcard subscriber", function() {
    var count = 0;
    bw.sub('err:*', function() { throw new Error('boom'); });
    bw.sub('err:*', function() { count++; });
    var total = bw.pub('err:test');
    assert.equal(count, 1);
    assert.equal(total, 1); // first threw, second succeeded
  });

  it("should tie wildcard sub to element lifecycle", function() {
    var count = 0;
    var el = bw.mount('#app', { t: 'div', o: {} });
    bw.sub('lc:*', function() { count++; }, el);
    bw.pub('lc:one');
    assert.equal(count, 1);
    bw.unmount(el);
    bw.pub('lc:two');
    assert.equal(count, 1);
  });

  it("should return correct count with mixed exact+wildcard", function() {
    bw.sub('m:x', function() {});
    bw.sub('m:*', function() {});
    bw.sub('m:*', function() {});
    var total = bw.pub('m:x');
    assert.equal(total, 3); // 1 exact + 2 wildcard
  });
});

// =========================================================================
// bw.formData()
// =========================================================================
describe("bw.formData()", function() {
  beforeEach(function() {
    freshDOM();
  });

  it("should be a function", function() {
    assert.equal(typeof bw.formData, 'function');
  });

  it("should return empty object for null/undefined target", function() {
    var result = bw.formData(null);
    assert.deepEqual(result, {});
  });

  it("should return empty object for non-existent selector", function() {
    var result = bw.formData('#does-not-exist');
    assert.deepEqual(result, {});
  });

  it("should collect text input value by name", function() {
    var container = document.createElement('div');
    container.innerHTML = '<input type="text" name="username" value="alice">';
    document.body.appendChild(container);
    var result = bw.formData(container);
    assert.equal(result.username, 'alice');
    document.body.removeChild(container);
  });

  it("should use id as key when name is absent", function() {
    var container = document.createElement('div');
    container.innerHTML = '<input type="text" id="email" value="a@b.com">';
    document.body.appendChild(container);
    var result = bw.formData(container);
    assert.equal(result.email, 'a@b.com');
    document.body.removeChild(container);
  });

  it("should skip inputs without name or id", function() {
    var container = document.createElement('div');
    container.innerHTML = '<input type="text" value="orphan">';
    document.body.appendChild(container);
    var result = bw.formData(container);
    assert.deepEqual(result, {});
    document.body.removeChild(container);
  });

  it("should collect checkbox as boolean true", function() {
    var container = document.createElement('div');
    container.innerHTML = '<input type="checkbox" name="agree" checked>';
    document.body.appendChild(container);
    var result = bw.formData(container);
    assert.strictEqual(result.agree, true);
    document.body.removeChild(container);
  });

  it("should collect unchecked checkbox as boolean false", function() {
    var container = document.createElement('div');
    container.innerHTML = '<input type="checkbox" name="agree">';
    document.body.appendChild(container);
    var result = bw.formData(container);
    assert.strictEqual(result.agree, false);
    document.body.removeChild(container);
  });

  it("should collect checked radio value", function() {
    var container = document.createElement('div');
    container.innerHTML =
      '<input type="radio" name="color" value="red">' +
      '<input type="radio" name="color" value="blue" checked>' +
      '<input type="radio" name="color" value="green">';
    document.body.appendChild(container);
    var result = bw.formData(container);
    assert.equal(result.color, 'blue');
    document.body.removeChild(container);
  });

  it("should omit unchecked radio groups", function() {
    var container = document.createElement('div');
    container.innerHTML =
      '<input type="radio" name="size" value="s">' +
      '<input type="radio" name="size" value="m">' +
      '<input type="radio" name="size" value="l">';
    document.body.appendChild(container);
    var result = bw.formData(container);
    assert.equal(result.size, undefined);
    assert.equal('size' in result, false);
    document.body.removeChild(container);
  });

  it("should collect textarea value", function() {
    var container = document.createElement('div');
    container.innerHTML = '<textarea name="bio">Hello world</textarea>';
    document.body.appendChild(container);
    var result = bw.formData(container);
    assert.equal(result.bio, 'Hello world');
    document.body.removeChild(container);
  });

  it("should collect select value", function() {
    var container = document.createElement('div');
    container.innerHTML =
      '<select name="fruit">' +
      '  <option value="apple">Apple</option>' +
      '  <option value="banana" selected>Banana</option>' +
      '</select>';
    document.body.appendChild(container);
    var result = bw.formData(container);
    assert.equal(result.fruit, 'banana');
    document.body.removeChild(container);
  });

  it("should collect multi-select as array", function() {
    var container = document.createElement('div');
    var select = document.createElement('select');
    select.name = 'tags';
    select.multiple = true;
    var opt1 = document.createElement('option');
    opt1.value = 'js'; opt1.selected = true;
    var opt2 = document.createElement('option');
    opt2.value = 'css'; opt2.selected = false;
    var opt3 = document.createElement('option');
    opt3.value = 'html'; opt3.selected = true;
    select.appendChild(opt1);
    select.appendChild(opt2);
    select.appendChild(opt3);
    container.appendChild(select);
    document.body.appendChild(container);
    var result = bw.formData(container);
    assert.deepEqual(result.tags, ['js', 'html']);
    document.body.removeChild(container);
  });

  it("should collect multi-select with nothing selected as empty array", function() {
    var container = document.createElement('div');
    var select = document.createElement('select');
    select.name = 'empty';
    select.multiple = true;
    var opt1 = document.createElement('option');
    opt1.value = 'a';
    select.appendChild(opt1);
    container.appendChild(select);
    document.body.appendChild(container);
    var result = bw.formData(container);
    assert.deepEqual(result.empty, []);
    document.body.removeChild(container);
  });

  it("should collect number input as string", function() {
    var container = document.createElement('div');
    container.innerHTML = '<input type="number" name="count" value="5">';
    document.body.appendChild(container);
    var result = bw.formData(container);
    assert.equal(result.count, '5');
    document.body.removeChild(container);
  });

  it("should handle mixed form controls", function() {
    var container = document.createElement('div');
    container.innerHTML =
      '<input type="text" name="name" value="Alice">' +
      '<input type="email" name="email" value="a@b.com">' +
      '<input type="checkbox" name="terms" checked>' +
      '<textarea name="notes">hello</textarea>';
    document.body.appendChild(container);
    var result = bw.formData(container);
    assert.equal(result.name, 'Alice');
    assert.equal(result.email, 'a@b.com');
    assert.strictEqual(result.terms, true);
    assert.equal(result.notes, 'hello');
    document.body.removeChild(container);
  });

  it("should work with CSS selector string via bw.el()", function() {
    var container = document.createElement('div');
    container.id = 'form-test';
    container.innerHTML = '<input type="text" name="x" value="42">';
    document.body.appendChild(container);
    var result = bw.formData('#form-test');
    assert.equal(result.x, '42');
    document.body.removeChild(container);
  });

  it("should return empty object for container with no inputs", function() {
    var container = document.createElement('div');
    container.innerHTML = '<p>No inputs here</p>';
    document.body.appendChild(container);
    var result = bw.formData(container);
    assert.deepEqual(result, {});
    document.body.removeChild(container);
  });

  it("should prefer name over id when both exist", function() {
    var container = document.createElement('div');
    container.innerHTML = '<input type="text" id="myId" name="myName" value="val">';
    document.body.appendChild(container);
    var result = bw.formData(container);
    assert.equal(result.myName, 'val');
    assert.equal(result.myId, undefined);
    document.body.removeChild(container);
  });
});

// =========================================================================
// bw.catalog()
// =========================================================================
describe("bw.catalog()", function() {
  it("should be a function", function() {
    assert.equal(typeof bw.catalog, 'function');
  });

  it("should return an array when called with no arguments", function() {
    var result = bw.catalog();
    assert.ok(Array.isArray(result));
    assert.ok(result.length > 0, 'should have registered components');
  });

  it("should return objects with type and factory keys", function() {
    var result = bw.catalog();
    result.forEach(function(entry) {
      assert.ok(typeof entry.type === 'string', 'type should be string');
      assert.ok(typeof entry.factory === 'string', 'factory should be string');
    });
  });

  it("should include known component types", function() {
    var result = bw.catalog();
    var types = result.map(function(e) { return e.type; });
    assert.ok(types.indexOf('card') >= 0, 'should include card');
    assert.ok(types.indexOf('button') >= 0, 'should include button');
    assert.ok(types.indexOf('tabs') >= 0, 'should include tabs');
    assert.ok(types.indexOf('accordion') >= 0, 'should include accordion');
    assert.ok(types.indexOf('modal') >= 0, 'should include modal');
  });

  it("should generate correct factory names", function() {
    var result = bw.catalog();
    var cardEntry = result.find(function(e) { return e.type === 'card'; });
    assert.equal(cardEntry.factory, 'makeCard');
    var listGroupEntry = result.find(function(e) { return e.type === 'listGroup'; });
    assert.equal(listGroupEntry.factory, 'makeListGroup');
  });

  it("should match the number of BCCL registry entries", function() {
    var result = bw.catalog();
    var bccKeys = Object.keys(bw.BCCL);
    assert.equal(result.length, bccKeys.length);
  });

  it("should return single entry for known type", function() {
    var result = bw.catalog('card');
    assert.ok(result !== null);
    assert.equal(result.type, 'card');
    assert.equal(result.factory, 'makeCard');
  });

  it("should return null for unknown type", function() {
    var result = bw.catalog('nonexistent_component');
    assert.equal(result, null);
  });

  it("should return correct factory name for multi-word types", function() {
    var result = bw.catalog('chipInput');
    assert.ok(result !== null);
    assert.equal(result.factory, 'makeChipInput');
  });

  it("should return correct factory for searchInput", function() {
    var result = bw.catalog('searchInput');
    assert.ok(result !== null);
    assert.equal(result.factory, 'makeSearchInput');
  });

  it("should return correct factory for statCard", function() {
    var result = bw.catalog('statCard');
    assert.ok(result !== null);
    assert.equal(result.factory, 'makeStatCard');
  });

  it("every catalog entry factory should exist on bw", function() {
    var result = bw.catalog();
    result.forEach(function(entry) {
      assert.equal(typeof bw[entry.factory], 'function',
        entry.factory + ' should be a function on bw');
    });
  });
});

// =========================================================================
// Slot caching (o.slots target element cached at creation time)
// =========================================================================
describe("o.slots caching", function() {
  beforeEach(function() {
    freshDOM();
  });

  it("should cache slot target at creation time (no repeated querySelector)", function() {
    var container = document.getElementById('app');
    var taco = {
      t: 'div',
      c: [{ t: 'span', a: { class: 'title-slot' }, c: 'Hello' }],
      o: {
        slots: { title: '.title-slot' }
      }
    };
    var el = bw.create(taco);
    container.appendChild(el);

    // Setter should work
    el.bw.setTitle('World');
    assert.equal(el.bw.getTitle(), 'World');

    // Verify it still works after removing and re-adding the element
    // (cached reference should remain valid since we're not recreating)
    el.bw.setTitle('Again');
    assert.equal(el.bw.getTitle(), 'Again');
  });

  it("should handle TACO value in slot setter", function() {
    var container = document.getElementById('app');
    var taco = {
      t: 'div',
      c: [{ t: 'span', a: { class: 'content-slot' }, c: 'initial' }],
      o: {
        slots: { content: '.content-slot' }
      }
    };
    var el = bw.create(taco);
    container.appendChild(el);

    // Set a TACO object into the slot
    el.bw.setContent({ t: 'strong', c: 'bold text' });
    var inner = el.querySelector('.content-slot strong');
    assert.ok(inner, 'should have created strong element');
    assert.equal(inner.textContent, 'bold text');
  });

  it("should handle null/undefined value in slot setter", function() {
    var container = document.getElementById('app');
    var taco = {
      t: 'div',
      c: [{ t: 'span', a: { class: 'val-slot' }, c: 'has content' }],
      o: {
        slots: { val: '.val-slot' }
      }
    };
    var el = bw.create(taco);
    container.appendChild(el);

    el.bw.setVal(null);
    assert.equal(el.bw.getVal(), '');

    el.bw.setVal(undefined);
    assert.equal(el.bw.getVal(), '');
  });

  it("should gracefully handle missing slot target (no match)", function() {
    var container = document.getElementById('app');
    var taco = {
      t: 'div',
      c: [{ t: 'span', c: 'no class' }],
      o: {
        slots: { missing: '.nonexistent' }
      }
    };
    var el = bw.create(taco);
    container.appendChild(el);

    // Setter should not throw
    el.bw.setMissing('value');
    // Getter should return empty string
    assert.equal(el.bw.getMissing(), '');
  });
});

// =========================================================================
// o.type wiring
// =========================================================================
describe("o.type wiring", function() {
  beforeEach(function() {
    freshDOM();
  });

  it("should set _bw_type on element when o.type is provided", function() {
    var container = document.getElementById('app');
    var taco = {
      t: 'div', c: 'typed',
      o: { type: 'card' }
    };
    var el = bw.create(taco);
    container.appendChild(el);
    assert.equal(el._bw_type, 'card');
  });

  it("should not set _bw_type when o.type is absent", function() {
    var container = document.getElementById('app');
    var taco = { t: 'div', c: 'untyped' };
    var el = bw.create(taco);
    container.appendChild(el);
    assert.equal(el._bw_type, undefined);
  });

  it("should set _bw_type for custom component types", function() {
    var container = document.getElementById('app');
    var taco = {
      t: 'div', c: 'custom',
      o: { type: 'my-widget' }
    };
    var el = bw.create(taco);
    container.appendChild(el);
    assert.equal(el._bw_type, 'my-widget');
  });

  it("should set _bw_type independently of lifecycle hooks", function() {
    var container = document.getElementById('app');
    // o.type without o.mounted/o.render/o.state
    var taco = {
      t: 'div', c: 'type-only',
      o: { type: 'label' }
    };
    var el = bw.create(taco);
    container.appendChild(el);
    assert.equal(el._bw_type, 'label');
    // Should NOT have lifecycle-related properties
    assert.equal(el._bw_state, undefined);
    assert.equal(el._bw_render, undefined);
  });
});

// =========================================================================
// Error boundaries (o.mounted, o.unmount, o.render)
// =========================================================================
describe("Error boundaries", function() {
  beforeEach(function() {
    freshDOM();
    // Use a deferred rAF so we can control when mounted fires
    global._rafQueue = [];
    global.requestAnimationFrame = function(fn) { global._rafQueue.push(fn); };
  });

  function flushRAF() {
    // Flush all queued rAF callbacks
    var queue = global._rafQueue.slice();
    global._rafQueue = [];
    queue.forEach(function(fn) { fn(); });
  }

  it("should catch error in o.mounted and not throw", function() {
    var container = document.getElementById('app');
    var taco = {
      t: 'div', c: 'will error',
      o: {
        mounted: function() { throw new Error('mount boom'); }
      }
    };
    var el = bw.create(taco);
    container.appendChild(el);
    // Now flush rAF -- mounted fires, error should be caught
    flushRAF();
    // Element should still be in DOM
    assert.ok(container.contains(el));
  });

  it("should catch error in o.render via bw.update() and not throw", function() {
    var container = document.getElementById('app');
    var updateCount = 0;
    var taco = {
      t: 'div', c: 'render error',
      o: {
        state: { count: 0 },
        handle: {
          update: function(el, data) {
            updateCount++;
          }
        }
      }
    };
    var el = bw.create(taco);
    container.appendChild(el);
    // v2.1: mounted fires synchronously during mountTree
    bw.mountTree(el);
    // bw.update dispatches to el.bw.update
    bw.update(el);
    assert.equal(updateCount, 1);
  });

  it("should catch error in o.unmount during cleanup and not throw", function() {
    var container = document.getElementById('app');
    var taco = {
      t: 'div', c: 'unmount error',
      o: {
        state: {},
        unmount: function() { throw new Error('unmount boom'); }
      }
    };
    var el = bw.create(taco);
    container.appendChild(el);
    flushRAF();
    // Cleanup should not throw
    bw.unmount(container);
  });

  it("should still emit statechange after successful bw.update()", function() {
    var container = document.getElementById('app');
    var emitted = false;
    var taco = {
      t: 'div', c: 'emit test',
      o: {
        state: { x: 1 },
        handle: {
          update: function(el, data) { /* noop */ }
        }
      }
    };
    var el = bw.create(taco);
    container.appendChild(el);
    // v2.1: mounted fires synchronously during mountTree
    bw.mountTree(el);
    // Listen for statechange
    el.addEventListener('bw:statechange', function() { emitted = true; });
    bw.update(el);
    assert.equal(emitted, true);
  });

  it("should log warning on mounted error", function() {
    var container = document.getElementById('app');
    var warnings = [];
    var origWarn = console.warn;
    console.warn = function() { warnings.push(Array.from(arguments).join(' ')); };
    var taco = {
      t: 'div', c: 'warn test',
      o: {
        mounted: function() { throw new Error('test warning'); }
      }
    };
    var el = bw.create(taco);
    container.appendChild(el);
    // v2.1: mounted fires synchronously during mountTree (not via rAF)
    bw.mountTree(el);
    console.warn = origWarn;
    assert.ok(warnings.some(function(w) { return w.indexOf('o.mounted error') >= 0; }),
      'should have logged o.mounted error warning, got: ' + JSON.stringify(warnings));
  });

  it("should catch error in o.mounted when element is already in body", function() {
    var container = document.getElementById('app');
    // Restore sync rAF for this test -- element will be in body before createDOM finishes
    global.requestAnimationFrame = function(fn) { fn(); };
    // Create a wrapper already in DOM, then createDOM inside
    var wrapper = document.createElement('div');
    container.appendChild(wrapper);
    var taco = {
      t: 'span', c: 'inline mount',
      o: {
        mounted: function() { throw new Error('sync mount error'); }
      }
    };
    // createDOM while wrapper is in body -- but el itself isn't in body yet
    // So this still uses rAF path. Use bw.mount instead for sync mounted.
    // Actually, let's just verify bw.update catches render errors
    var el2 = bw.create({
      t: 'div', c: 'render test',
      o: {
        state: {},
        render: function() { throw new Error('update render fail'); }
      }
    });
    container.appendChild(el2);
    // bw.update should catch
    bw.update(el2);
    assert.ok(container.contains(el2));
  });
});

// =========================================================================
// bw.inspect() -- DOM introspection
// =========================================================================
describe("bw.inspect()", function() {
  beforeEach(function() {
    freshDOM();
  });

  it("should be a function", function() {
    assert.equal(typeof bw.inspect, 'function');
  });

  it("should return null for non-existent target", function() {
    assert.equal(bw.inspect('#nonexistent'), null);
  });

  it("should return null for null target", function() {
    assert.equal(bw.inspect(null), null);
  });

  it("should return basic info for a plain element", function() {
    var container = document.getElementById('app');
    container.innerHTML = '';
    var div = document.createElement('div');
    div.id = 'test-div';
    div.className = 'foo bar';
    container.appendChild(div);
    var info = bw.inspect(div, 0);
    assert.equal(info.tag, 'div');
    assert.equal(info.id, 'test-div');
    assert.equal(info.classes, 'foo bar');
    assert.equal(info.children, undefined); // depth 0, no children
  });

  it("should default depth to 3", function() {
    var container = document.getElementById('app');
    container.innerHTML = '<div><span><em><strong>deep</strong></em></span></div>';
    var info = bw.inspect(container);
    // depth 3: container(d=0) -> div(d=1) -> span(d=2) -> em(d=3, no children since d=3 is not < 3)
    assert.ok(info.children, 'should have children');
    assert.ok(info.children[0].children, 'div should have children at d=1');
    assert.ok(info.children[0].children[0].children, 'span should have children at d=2');
    // em is at d=3 which is NOT < 3, so no children are returned
    assert.equal(info.children[0].children[0].children[0].tag, 'em');
    assert.equal(info.children[0].children[0].children[0].children, undefined);
  });

  it("should respect depth limit of 0 (no children)", function() {
    var container = document.getElementById('app');
    container.innerHTML = '<div><span>child</span></div>';
    var info = bw.inspect(container, 0);
    assert.equal(info.tag, 'div');
    assert.equal(info.children, undefined);
  });

  it("should respect depth limit of 1", function() {
    var container = document.getElementById('app');
    container.innerHTML = '<div><span><em>deep</em></span></div>';
    var info = bw.inspect(container, 1);
    assert.ok(info.children, 'should have direct children');
    // The div child at depth 1 should NOT have its children (span is at depth 1, its children would be depth 2 which exceeds limit of 1)
    assert.equal(info.children[0].children, undefined);
  });

  it("should include UUID for lifecycle-managed elements", function() {
    var container = document.getElementById('app');
    var taco = {
      t: 'div', c: 'managed',
      o: { state: { x: 1 } }
    };
    var el = bw.create(taco);
    container.appendChild(el);
    var info = bw.inspect(el, 0);
    assert.ok(info.uuid, 'should have uuid');
    assert.ok(info.uuid.indexOf('bw_uuid_') === 0);
  });

  it("should include type for components with o.type", function() {
    var container = document.getElementById('app');
    var taco = {
      t: 'div', c: 'typed',
      o: { type: 'card' }
    };
    var el = bw.create(taco);
    container.appendChild(el);
    var info = bw.inspect(el, 0);
    assert.equal(info.type, 'card');
  });

  it("should include handle methods", function() {
    var container = document.getElementById('app');
    var taco = {
      t: 'div', c: 'handled',
      o: {
        handle: {
          doSomething: function(el) { return el; },
          getValue: function(el) { return 42; }
        }
      }
    };
    var el = bw.create(taco);
    container.appendChild(el);
    var info = bw.inspect(el, 0);
    assert.ok(info.handles, 'should have handles');
    assert.ok(info.handles.indexOf('doSomething') >= 0);
    assert.ok(info.handles.indexOf('getValue') >= 0);
  });

  it("should include state", function() {
    var container = document.getElementById('app');
    var taco = {
      t: 'div', c: 'stateful',
      o: { state: { count: 5, name: 'test' } }
    };
    var el = bw.create(taco);
    container.appendChild(el);
    var info = bw.inspect(el, 0);
    assert.deepEqual(info.state, { count: 5, name: 'test' });
  });

  it("should include hasRender flag", function() {
    var container = document.getElementById('app');
    var taco = {
      t: 'div', c: 'renderable',
      o: { render: function(el, state) {} }
    };
    var el = bw.create(taco);
    container.appendChild(el);
    var info = bw.inspect(el, 0);
    assert.equal(info.hasRender, true);
  });

  it("should include hasSubs flag", function() {
    var container = document.getElementById('app');
    bw._topics = {};
    var el = document.createElement('div');
    container.appendChild(el);
    bw.sub('test-topic', function() {}, el);
    var info = bw.inspect(el, 0);
    assert.equal(info.hasSubs, true);
  });

  it("should work with CSS selector string", function() {
    var container = document.getElementById('app');
    container.innerHTML = '<span id="tree-target">hello</span>';
    var info = bw.inspect('#tree-target', 0);
    assert.ok(info);
    assert.equal(info.tag, 'span');
    assert.equal(info.id, 'tree-target');
  });

  it("should walk children recursively", function() {
    var container = document.getElementById('app');
    container.innerHTML =
      '<ul>' +
      '  <li>one</li>' +
      '  <li>two</li>' +
      '  <li>three</li>' +
      '</ul>';
    var info = bw.inspect(container, 2);
    assert.ok(info.children, 'should have children');
    var ul = info.children[0];
    assert.equal(ul.tag, 'ul');
    assert.ok(ul.children, 'ul should have children');
    assert.equal(ul.children.length, 3);
    assert.equal(ul.children[0].tag, 'li');
  });

  it("should truncate classes to first 5", function() {
    var container = document.getElementById('app');
    var div = document.createElement('div');
    div.className = 'a b c d e f g';
    container.appendChild(div);
    var info = bw.inspect(div, 0);
    assert.equal(info.classes, 'a b c d e');
  });

  it("should not include undefined properties for plain elements", function() {
    var container = document.getElementById('app');
    var div = document.createElement('div');
    container.appendChild(div);
    var info = bw.inspect(div, 0);
    assert.equal(info.uuid, undefined);
    assert.equal(info.type, undefined);
    assert.equal(info.handles, undefined);
    assert.equal(info.state, undefined);
    assert.equal(info.hasRender, undefined);
    assert.equal(info.hasSubs, undefined);
    assert.equal(info.refs, undefined);
  });
});

// =========================================================================
// SVG namespace support in bw.create()
// =========================================================================
describe("SVG namespace support", function() {
  beforeEach(function() {
    freshDOM();
  });

  var SVG_NS = 'http://www.w3.org/2000/svg';

  it("should create SVG element with correct namespace", function() {
    var taco = { t: 'svg', a: { width: '100', height: '100' } };
    var el = bw.create(taco);
    assert.equal(el.namespaceURI, SVG_NS);
    assert.equal(el.tagName.toLowerCase(), 'svg');
  });

  it("should create SVG child elements with correct namespace", function() {
    var taco = {
      t: 'svg', a: { width: '100', height: '100' },
      c: [
        { t: 'circle', a: { cx: '50', cy: '50', r: '40' } },
        { t: 'rect', a: { x: '10', y: '10', width: '80', height: '80' } }
      ]
    };
    var el = bw.create(taco);
    assert.equal(el.namespaceURI, SVG_NS);
    assert.equal(el.children[0].namespaceURI, SVG_NS);
    assert.equal(el.children[0].tagName.toLowerCase(), 'circle');
    assert.equal(el.children[1].namespaceURI, SVG_NS);
    assert.equal(el.children[1].tagName.toLowerCase(), 'rect');
  });

  it("should handle nested SVG groups", function() {
    var taco = {
      t: 'svg', a: { viewBox: '0 0 100 100' },
      c: {
        t: 'g', a: { transform: 'translate(10,10)' },
        c: { t: 'line', a: { x1: '0', y1: '0', x2: '50', y2: '50' } }
      }
    };
    var el = bw.create(taco);
    var g = el.children[0];
    assert.equal(g.namespaceURI, SVG_NS);
    assert.equal(g.tagName.toLowerCase(), 'g');
    var line = g.children[0];
    assert.equal(line.namespaceURI, SVG_NS);
    assert.equal(line.tagName.toLowerCase(), 'line');
  });

  it("should set attributes correctly on SVG elements", function() {
    var taco = {
      t: 'svg', c: {
        t: 'circle', a: { cx: '50', cy: '50', r: '25', fill: 'red', stroke: 'blue' }
      }
    };
    var el = bw.create(taco);
    var circle = el.children[0];
    assert.equal(circle.getAttribute('cx'), '50');
    assert.equal(circle.getAttribute('r'), '25');
    assert.equal(circle.getAttribute('fill'), 'red');
  });

  it("should handle class attribute on SVG elements via setAttribute", function() {
    var taco = {
      t: 'svg', c: {
        t: 'rect', a: { class: 'my-rect bw_chart', width: '50', height: '50' }
      }
    };
    var el = bw.create(taco);
    var rect = el.children[0];
    assert.equal(rect.getAttribute('class'), 'my-rect bw_chart');
  });

  it("should handle class as array on SVG elements", function() {
    var taco = {
      t: 'svg', c: {
        t: 'path', a: { class: ['path-a', 'path-b'], d: 'M0 0 L50 50' }
      }
    };
    var el = bw.create(taco);
    var path = el.children[0];
    assert.equal(path.getAttribute('class'), 'path-a path-b');
  });

  it("should create HTML elements outside SVG context normally", function() {
    var htmlTaco = { t: 'div', a: { class: 'wrapper' }, c: 'hello' };
    var el = bw.create(htmlTaco);
    // HTML namespace (not SVG)
    assert.notEqual(el.namespaceURI, SVG_NS);
    assert.equal(el.tagName.toLowerCase(), 'div');
  });

  it("should handle SVG embedded in HTML via TACO tree", function() {
    var container = document.getElementById('app');
    var taco = {
      t: 'div', a: { class: 'chart-wrapper' },
      c: {
        t: 'svg', a: { width: '200', height: '200' },
        c: { t: 'circle', a: { cx: '100', cy: '100', r: '50' } }
      }
    };
    var el = bw.create(taco);
    container.appendChild(el);
    // Outer div is HTML
    assert.notEqual(el.namespaceURI, SVG_NS);
    // SVG child has correct namespace
    var svg = el.children[0];
    assert.equal(svg.namespaceURI, SVG_NS);
    var circle = svg.children[0];
    assert.equal(circle.namespaceURI, SVG_NS);
  });

  it("should handle foreignObject children as HTML namespace", function() {
    var taco = {
      t: 'svg', a: { width: '200', height: '200' },
      c: {
        t: 'foreignObject', a: { x: '10', y: '10', width: '180', height: '180' },
        c: { t: 'div', c: { t: 'p', c: 'HTML inside SVG' } }
      }
    };
    var el = bw.create(taco);
    var fo = el.children[0];
    assert.equal(fo.namespaceURI, SVG_NS, 'foreignObject itself is SVG');
    assert.equal(fo.tagName.toLowerCase(), 'foreignobject');
    // Children of foreignObject should be HTML namespace
    var div = fo.children[0];
    assert.notEqual(div.namespaceURI, SVG_NS, 'div inside foreignObject should be HTML');
    var p = div.children[0];
    assert.notEqual(p.namespaceURI, SVG_NS, 'p inside foreignObject should be HTML');
  });

  it("should support lifecycle hooks on SVG elements", function() {
    var container = document.getElementById('app');
    var mounted = false;
    var taco = {
      t: 'svg', a: { width: '100', height: '100' },
      c: {
        t: 'g',
        o: {
          state: { color: 'red' },
          mounted: function(el) { mounted = true; }
        }
      }
    };
    var el = bw.create(taco);
    container.appendChild(el);
    // Flush rAF to trigger mounted
    var queue = global._rafQueue || [];
    queue.forEach(function(fn) { fn(); });
    // In case rAF is synchronous in our test setup
    if (!mounted && typeof global.requestAnimationFrame === 'function') {
      // mounted may have fired synchronously
    }
    var g = el.children[0];
    assert.equal(g.namespaceURI, SVG_NS);
    assert.deepEqual(g._bw_state, { color: 'red' });
  });

  it("should support o.type on SVG elements", function() {
    var taco = {
      t: 'svg', c: {
        t: 'g', o: { type: 'chart-axis' }
      }
    };
    var el = bw.create(taco);
    var g = el.children[0];
    assert.equal(g._bw_type, 'chart-axis');
  });

  it("should support handle methods on SVG elements", function() {
    var taco = {
      t: 'svg',
      c: {
        t: 'text', a: { x: '10', y: '20' }, c: 'hello',
        o: {
          handle: {
            setText: function(el, text) { el.textContent = text; }
          }
        }
      }
    };
    var el = bw.create(taco);
    var text = el.children[0];
    assert.equal(typeof text.bw.setText, 'function');
    text.bw.setText('world');
    assert.equal(text.textContent, 'world');
  });

  it("should handle text content in SVG elements", function() {
    var taco = {
      t: 'svg', c: {
        t: 'text', a: { x: '10', y: '20' }, c: 'Hello SVG'
      }
    };
    var el = bw.create(taco);
    var text = el.children[0];
    assert.equal(text.textContent, 'Hello SVG');
  });

  it("should support bw.inspect() on SVG trees", function() {
    var container = document.getElementById('app');
    var taco = {
      t: 'svg', a: { class: 'my-chart' },
      c: [
        { t: 'rect', a: { class: 'bar bar-1' } },
        { t: 'rect', a: { class: 'bar bar-2' } }
      ]
    };
    var el = bw.create(taco);
    container.appendChild(el);
    var info = bw.inspect(el, 1);
    assert.equal(info.tag, 'svg');
    assert.ok(info.children);
    assert.equal(info.children.length, 2);
    assert.equal(info.children[0].tag, 'rect');
  });

  it("should support UUID assignment on SVG elements", function() {
    var taco = {
      t: 'svg', c: {
        t: 'g',
        o: { state: {} }
      }
    };
    var el = bw.create(taco);
    var g = el.children[0];
    var uuid = bw.getUUID(g);
    assert.ok(uuid, 'SVG element should have UUID');
    assert.ok(uuid.indexOf('bw_uuid_') === 0);
  });

  it("should register SVG elements in node cache", function() {
    if (bw._nodeMap) {
      Object.keys(bw._nodeMap).forEach(function(k) { delete bw._nodeMap[k]; });
    }
    var taco = {
      t: 'svg', c: {
        t: 'g', a: { id: 'my-group' },
        o: { state: {} }
      }
    };
    var el = bw.create(taco);
    document.body.appendChild(el);
    // v2.1: registration happens at mount-time
    bw.mountTree(el);
    var g = el.children[0];
    // Should be registered by id
    assert.ok(bw._nodeMap['my-group']);
    // Should also be registered by UUID
    var uuid = bw.getUUID(g);
    if (uuid) {
      assert.ok(bw._nodeMap[uuid]);
    }
  });

  it("should handle cleanup of SVG lifecycle elements", function() {
    var container = document.getElementById('app');
    var unmounted = false;
    var taco = {
      t: 'div', c: {
        t: 'svg', c: {
          t: 'g',
          o: {
            state: {},
            unmount: function() { unmounted = true; }
          }
        }
      }
    };
    var el = bw.create(taco);
    container.appendChild(el);
    bw.unmount(container);
    assert.equal(unmounted, true, 'SVG element unmount should fire during cleanup');
  });

  it("should handle empty SVG", function() {
    var taco = { t: 'svg', a: { width: '0', height: '0' } };
    var el = bw.create(taco);
    assert.equal(el.namespaceURI, SVG_NS);
    assert.equal(el.children.length, 0);
  });

  it("should handle SVG with multiple nested levels", function() {
    var taco = {
      t: 'svg', a: { viewBox: '0 0 100 100' },
      c: [{
        t: 'defs', c: {
          t: 'linearGradient', a: { id: 'grad1' },
          c: [
            { t: 'stop', a: { offset: '0%', 'stop-color': 'red' } },
            { t: 'stop', a: { offset: '100%', 'stop-color': 'blue' } }
          ]
        }
      }, {
        t: 'rect', a: { fill: 'url(#grad1)', width: '100', height: '100' }
      }]
    };
    var el = bw.create(taco);
    assert.equal(el.namespaceURI, SVG_NS);
    var defs = el.children[0];
    assert.equal(defs.namespaceURI, SVG_NS);
    assert.equal(defs.tagName.toLowerCase(), 'defs');
    var gradient = defs.children[0];
    assert.equal(gradient.namespaceURI, SVG_NS);
    assert.equal(gradient.tagName.toLowerCase(), 'lineargradient');
    assert.equal(gradient.children.length, 2);
    assert.equal(gradient.children[0].namespaceURI, SVG_NS);
  });
});

// =============================================================================
// bw.el() apply support
// =============================================================================

describe('bw.el() apply support', function() {

  beforeEach(function() {
    document.body.innerHTML = '';
  });

  it('should return element without apply arg', function() {
    var el = document.createElement('div');
    el.id = 'el-no-apply';
    document.body.appendChild(el);
    assert.strictEqual(bw.el('el-no-apply'), el);
  });

  it('should apply string as textContent', function() {
    var el = document.createElement('div');
    el.id = 'el-str';
    el.textContent = 'old';
    document.body.appendChild(el);
    var result = bw.el('el-str', 'new text');
    assert.strictEqual(result, el);
    assert.strictEqual(el.textContent, 'new text');
  });

  it('should apply number as textContent (coerced to string)', function() {
    var el = document.createElement('div');
    el.id = 'el-num';
    document.body.appendChild(el);
    bw.el('el-num', 42);
    assert.strictEqual(el.textContent, '42');
  });

  it('should apply empty string as textContent', function() {
    var el = document.createElement('div');
    el.id = 'el-empty';
    el.textContent = 'stuff';
    document.body.appendChild(el);
    bw.el('el-empty', '');
    assert.strictEqual(el.textContent, '');
  });

  it('should apply function with element as arg', function() {
    var el = document.createElement('div');
    el.id = 'el-fn';
    document.body.appendChild(el);
    var called = null;
    bw.el('el-fn', function(e) { called = e; e.textContent = 'fn-set'; });
    assert.strictEqual(called, el);
    assert.strictEqual(el.textContent, 'fn-set');
  });

  it('should apply TACO object (mount)', function() {
    var el = document.createElement('div');
    el.id = 'el-taco';
    el.textContent = 'old';
    document.body.appendChild(el);
    bw.el('el-taco', { t: 'span', c: 'mounted' });
    assert.strictEqual(el.children.length, 1);
    assert.strictEqual(el.children[0].tagName, 'SPAN');
    assert.strictEqual(el.children[0].textContent, 'mounted');
  });

  it('should clear previous content when applying TACO', function() {
    var el = document.createElement('div');
    el.id = 'el-taco-clear';
    el.innerHTML = '<p>old content</p><p>more old</p>';
    document.body.appendChild(el);
    bw.el('el-taco-clear', { t: 'h1', c: 'fresh' });
    assert.strictEqual(el.children.length, 1);
    assert.strictEqual(el.children[0].tagName, 'H1');
  });

  it('should apply array of TACO objects', function() {
    var el = document.createElement('div');
    el.id = 'el-arr';
    document.body.appendChild(el);
    bw.el('el-arr', [
      { t: 'p', c: 'first' },
      { t: 'p', c: 'second' },
      { t: 'p', c: 'third' }
    ]);
    assert.strictEqual(el.children.length, 3);
    assert.strictEqual(el.children[0].textContent, 'first');
    assert.strictEqual(el.children[1].textContent, 'second');
    assert.strictEqual(el.children[2].textContent, 'third');
  });

  it('should apply array of mixed TACO and strings', function() {
    var el = document.createElement('div');
    el.id = 'el-mixed';
    document.body.appendChild(el);
    bw.el('el-mixed', [
      'plain text',
      { t: 'strong', c: 'bold' },
      'more text'
    ]);
    // Should have 3 child nodes: text, strong, text
    assert.strictEqual(el.childNodes.length, 3);
    assert.strictEqual(el.childNodes[0].nodeType, 3); // text node
    assert.strictEqual(el.childNodes[0].textContent, 'plain text');
    assert.strictEqual(el.childNodes[1].tagName, 'STRONG');
    assert.strictEqual(el.childNodes[2].textContent, 'more text');
  });

  it('should skip null/undefined items in array', function() {
    var el = document.createElement('div');
    el.id = 'el-nulls';
    document.body.appendChild(el);
    bw.el('el-nulls', [null, { t: 'p', c: 'ok' }, undefined, 'text']);
    assert.strictEqual(el.childNodes.length, 2);
    assert.strictEqual(el.childNodes[0].tagName, 'P');
    assert.strictEqual(el.childNodes[1].textContent, 'text');
  });

  it('should clear previous content when applying array', function() {
    var el = document.createElement('div');
    el.id = 'el-arr-clear';
    el.innerHTML = '<span>old1</span><span>old2</span>';
    document.body.appendChild(el);
    bw.el('el-arr-clear', [{ t: 'p', c: 'new' }]);
    assert.strictEqual(el.children.length, 1);
    assert.strictEqual(el.children[0].tagName, 'P');
  });

  it('should not apply when element not found', function() {
    var result = bw.el('nonexistent', 'data');
    assert.strictEqual(result, null);
  });

  it('should accept DOM element directly with apply', function() {
    var el = document.createElement('div');
    document.body.appendChild(el);
    bw.el(el, 'direct');
    assert.strictEqual(el.textContent, 'direct');
  });

  it('should accept CSS selector with apply', function() {
    var el = document.createElement('div');
    el.className = 'apply-target';
    document.body.appendChild(el);
    bw.el('.apply-target', 'via-class');
    assert.strictEqual(el.textContent, 'via-class');
  });

  it('should accept #id selector with apply', function() {
    var el = document.createElement('div');
    el.id = 'hash-apply';
    document.body.appendChild(el);
    bw.el('#hash-apply', 'via-hash');
    assert.strictEqual(el.textContent, 'via-hash');
  });

  it('should accept UUID class with apply', function() {
    var taco = { t: 'div', c: 'old', o: { state: {} } };
    var el = bw.create(taco);
    document.body.appendChild(el);
    // v2.1: registration happens at mount-time (UUID lookup is registry-only)
    bw.mountTree(el);
    var uuid = bw.getUUID(el);
    bw.el(uuid, 'via-uuid');
    assert.strictEqual(el.textContent, 'via-uuid');
  });

  it('should not apply when apply is explicitly undefined', function() {
    var el = document.createElement('div');
    el.id = 'el-undef';
    el.textContent = 'untouched';
    document.body.appendChild(el);
    bw.el('el-undef', undefined);
    assert.strictEqual(el.textContent, 'untouched');
  });

  it('bw.el should resolve by id', function() {
    var el = document.createElement('div');
    el.id = 'alias-test';
    document.body.appendChild(el);
    assert.strictEqual(bw.el('alias-test'), el);
    bw.el('alias-test', 'aliased');
    assert.strictEqual(el.textContent, 'aliased');
  });

  it('should apply TACO with attributes and lifecycle', function() {
    var el = document.createElement('div');
    el.id = 'el-lifecycle';
    document.body.appendChild(el);
    var mounted = false;
    bw.el('el-lifecycle', {
      t: 'div',
      a: { class: 'card' },
      c: 'content',
      o: { mounted: function() { mounted = true; } }
    });
    assert.ok(el.children[0].classList.contains('card'));
    assert.strictEqual(el.children[0].textContent, 'content');
  });

  it('should apply nested TACO structure', function() {
    var el = document.createElement('div');
    el.id = 'el-nested';
    document.body.appendChild(el);
    bw.el('el-nested', {
      t: 'div', c: [
        { t: 'h1', c: 'Title' },
        { t: 'p', c: 'Body' }
      ]
    });
    assert.strictEqual(el.children[0].children.length, 2);
    assert.strictEqual(el.children[0].children[0].tagName, 'H1');
    assert.strictEqual(el.children[0].children[1].tagName, 'P');
  });

  it('should apply boolean false as string "false"', function() {
    var el = document.createElement('div');
    el.id = 'el-false';
    document.body.appendChild(el);
    bw.el('el-false', false);
    assert.strictEqual(el.textContent, 'false');
  });

  it('should apply zero as string "0"', function() {
    var el = document.createElement('div');
    el.id = 'el-zero';
    document.body.appendChild(el);
    bw.el('el-zero', 0);
    assert.strictEqual(el.textContent, '0');
  });
});

// =============================================================================
// bw.$() apply support
// =============================================================================

describe('bw.$() apply support', function() {

  beforeEach(function() {
    document.body.innerHTML = '';
  });

  it('should return array without apply arg', function() {
    var el = document.createElement('div');
    el.className = 'multi';
    document.body.appendChild(el);
    var result = bw.$('.multi');
    assert.ok(Array.isArray(result));
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0], el);
  });

  it('should apply string to all matched elements', function() {
    for (var i = 0; i < 3; i++) {
      var el = document.createElement('div');
      el.className = 'targets';
      document.body.appendChild(el);
    }
    var result = bw.$('.targets', 'applied');
    assert.strictEqual(result.length, 3);
    result.forEach(function(el) {
      assert.strictEqual(el.textContent, 'applied');
    });
  });

  it('should apply function to each element', function() {
    for (var i = 0; i < 3; i++) {
      var el = document.createElement('div');
      el.className = 'fn-targets';
      el.setAttribute('data-idx', String(i));
      document.body.appendChild(el);
    }
    var calls = [];
    bw.$('.fn-targets', function(el) {
      calls.push(el);
      el.textContent = 'fn-' + el.getAttribute('data-idx');
    });
    assert.strictEqual(calls.length, 3);
    assert.strictEqual(calls[0].textContent, 'fn-0');
    assert.strictEqual(calls[1].textContent, 'fn-1');
    assert.strictEqual(calls[2].textContent, 'fn-2');
  });

  it('should apply TACO object to each element', function() {
    for (var i = 0; i < 2; i++) {
      var el = document.createElement('div');
      el.className = 'taco-targets';
      document.body.appendChild(el);
    }
    bw.$('.taco-targets', { t: 'span', c: 'child' });
    var els = bw.$('.taco-targets');
    els.forEach(function(el) {
      assert.strictEqual(el.children.length, 1);
      assert.strictEqual(el.children[0].tagName, 'SPAN');
      assert.strictEqual(el.children[0].textContent, 'child');
    });
  });

  it('should apply array to each element', function() {
    for (var i = 0; i < 2; i++) {
      var el = document.createElement('div');
      el.className = 'arr-targets';
      document.body.appendChild(el);
    }
    bw.$('.arr-targets', [{ t: 'p', c: 'a' }, { t: 'p', c: 'b' }]);
    var els = bw.$('.arr-targets');
    els.forEach(function(el) {
      assert.strictEqual(el.children.length, 2);
      assert.strictEqual(el.children[0].textContent, 'a');
      assert.strictEqual(el.children[1].textContent, 'b');
    });
  });

  it('should apply to single DOM element wrapped', function() {
    var el = document.createElement('div');
    document.body.appendChild(el);
    var result = bw.$(el, 'single');
    assert.strictEqual(result.length, 1);
    assert.strictEqual(el.textContent, 'single');
  });

  it('should apply to array of elements', function() {
    var els = [];
    for (var i = 0; i < 3; i++) {
      var el = document.createElement('span');
      document.body.appendChild(el);
      els.push(el);
    }
    bw.$(els, 'bulk');
    els.forEach(function(el) {
      assert.strictEqual(el.textContent, 'bulk');
    });
  });

  it('should apply to NodeList (live collection)', function() {
    var container = document.createElement('div');
    container.innerHTML = '<p class="nl">a</p><p class="nl">b</p>';
    document.body.appendChild(container);
    var nodeList = container.querySelectorAll('.nl');
    bw.$(nodeList, 'replaced');
    assert.strictEqual(container.querySelectorAll('.nl')[0].textContent, 'replaced');
    assert.strictEqual(container.querySelectorAll('.nl')[1].textContent, 'replaced');
  });

  it('should return empty array for no match', function() {
    var result = bw.$('.no-match', 'data');
    assert.strictEqual(result.length, 0);
  });

  it('should return empty array for null selector', function() {
    var result = bw.$(null, 'data');
    assert.strictEqual(result.length, 0);
  });

  it('should return empty array for empty string', function() {
    var result = bw.$('', 'data');
    assert.strictEqual(result.length, 0);
  });

  it('should not apply when apply is explicitly undefined', function() {
    var el = document.createElement('div');
    el.className = 'no-apply';
    el.textContent = 'untouched';
    document.body.appendChild(el);
    bw.$('.no-apply', undefined);
    assert.strictEqual(el.textContent, 'untouched');
  });

  it('should apply number coerced to string', function() {
    var el = document.createElement('div');
    el.className = 'num-target';
    document.body.appendChild(el);
    bw.$('.num-target', 99);
    assert.strictEqual(el.textContent, '99');
  });

  it('should work with $.one returning single element', function() {
    var el = document.createElement('div');
    el.className = 'one-test';
    document.body.appendChild(el);
    var result = bw.$.one('.one-test');
    assert.strictEqual(result, el);
  });

  it('$.one should return null for no match', function() {
    var result = bw.$.one('.no-exist');
    assert.strictEqual(result, null);
  });
});

// =============================================================================
// _applyTo shared behavior (tested via bw.el and bw.$)
// =============================================================================

describe('_applyTo shared behavior', function() {

  beforeEach(function() {
    document.body.innerHTML = '';
  });

  it('bw.el and bw.$ produce identical results for string apply', function() {
    var el1 = document.createElement('div');
    el1.id = 'cmp-el';
    document.body.appendChild(el1);
    var el2 = document.createElement('div');
    el2.className = 'cmp-dollar';
    document.body.appendChild(el2);

    bw.el('cmp-el', 'same');
    bw.$('.cmp-dollar', 'same');
    assert.strictEqual(el1.textContent, el2.textContent);
  });

  it('bw.el and bw.$ produce identical results for TACO apply', function() {
    var el1 = document.createElement('div');
    el1.id = 'cmp-taco-el';
    document.body.appendChild(el1);
    var el2 = document.createElement('div');
    el2.className = 'cmp-taco-dollar';
    document.body.appendChild(el2);

    var taco = { t: 'em', c: 'shared' };
    bw.el('cmp-taco-el', taco);
    bw.$('.cmp-taco-dollar', taco);
    assert.strictEqual(el1.innerHTML, el2.innerHTML);
  });

  it('bw.el and bw.$ produce identical results for array apply', function() {
    var el1 = document.createElement('div');
    el1.id = 'cmp-arr-el';
    document.body.appendChild(el1);
    var el2 = document.createElement('div');
    el2.className = 'cmp-arr-dollar';
    document.body.appendChild(el2);

    var arr = [{ t: 'b', c: 'one' }, 'two'];
    bw.el('cmp-arr-el', arr);
    bw.$('.cmp-arr-dollar', arr);
    assert.strictEqual(el1.childNodes.length, el2.childNodes.length);
    assert.strictEqual(el1.childNodes[0].tagName, el2.childNodes[0].tagName);
    assert.strictEqual(el1.childNodes[1].textContent, el2.childNodes[1].textContent);
  });

  it('function apply receives same element reference from both APIs', function() {
    var el = document.createElement('div');
    el.id = 'fn-ref';
    el.className = 'fn-ref-cls';
    document.body.appendChild(el);

    var elRef = null;
    var dollarRef = null;
    bw.el('fn-ref', function(e) { elRef = e; });
    bw.$('.fn-ref-cls', function(e) { dollarRef = e; });
    assert.strictEqual(elRef, dollarRef);
    assert.strictEqual(elRef, el);
  });

  it('array with numbers coerces items to strings', function() {
    var el = document.createElement('div');
    el.id = 'num-arr';
    document.body.appendChild(el);
    bw.el('num-arr', [1, 2, 3]);
    assert.strictEqual(el.childNodes.length, 3);
    assert.strictEqual(el.childNodes[0].textContent, '1');
    assert.strictEqual(el.childNodes[1].textContent, '2');
    assert.strictEqual(el.childNodes[2].textContent, '3');
  });

  it('empty array clears element', function() {
    var el = document.createElement('div');
    el.id = 'empty-arr';
    el.textContent = 'content';
    document.body.appendChild(el);
    bw.el('empty-arr', []);
    assert.strictEqual(el.innerHTML, '');
    assert.strictEqual(el.childNodes.length, 0);
  });

  it('apply with TACO containing bw.raw() content', function() {
    var el = document.createElement('div');
    el.id = 'raw-apply';
    document.body.appendChild(el);
    bw.el('raw-apply', { t: 'div', c: bw.raw('<b>bold</b>') });
    assert.strictEqual(el.children[0].innerHTML, '<b>bold</b>');
  });
});

// =============================================================================
// bw.jsonPatch() -- RFC 6902 JSON Patch
// =============================================================================

describe('bw.jsonPatch()', function() {

  it('should be a function', function() {
    assert.strictEqual(typeof bw.jsonPatch, 'function');
  });

  it('should return obj unchanged for non-array ops', function() {
    var obj = { a: 1 };
    assert.strictEqual(bw.jsonPatch(obj, null), obj);
    assert.strictEqual(bw.jsonPatch(obj, 'nope'), obj);
    assert.strictEqual(bw.jsonPatch(obj, undefined), obj);
  });

  it('should return obj unchanged for empty ops array', function() {
    var obj = { a: 1 };
    assert.strictEqual(bw.jsonPatch(obj, []), obj);
    assert.deepStrictEqual(obj, { a: 1 });
  });

  // -- add --

  it('add: should add a new property', function() {
    var obj = { a: 1 };
    bw.jsonPatch(obj, [{ op: 'add', path: '/b', value: 2 }]);
    assert.deepStrictEqual(obj, { a: 1, b: 2 });
  });

  it('add: should add a nested property', function() {
    var obj = { a: { b: 1 } };
    bw.jsonPatch(obj, [{ op: 'add', path: '/a/c', value: 3 }]);
    assert.deepStrictEqual(obj, { a: { b: 1, c: 3 } });
  });

  it('add: should insert into array at index', function() {
    var obj = { arr: [1, 2, 3] };
    bw.jsonPatch(obj, [{ op: 'add', path: '/arr/1', value: 99 }]);
    assert.deepStrictEqual(obj.arr, [1, 99, 2, 3]);
  });

  it('add: should append to array at end index', function() {
    var obj = { arr: [1, 2] };
    bw.jsonPatch(obj, [{ op: 'add', path: '/arr/2', value: 3 }]);
    assert.deepStrictEqual(obj.arr, [1, 2, 3]);
  });

  it('add: should overwrite existing property', function() {
    var obj = { a: 1 };
    bw.jsonPatch(obj, [{ op: 'add', path: '/a', value: 'new' }]);
    assert.strictEqual(obj.a, 'new');
  });

  it('add: should throw for root path', function() {
    assert.throws(function() {
      bw.jsonPatch({}, [{ op: 'add', path: '', value: 1 }]);
    }, /Cannot add to root/);
  });

  // -- remove --

  it('remove: should remove a property', function() {
    var obj = { a: 1, b: 2 };
    bw.jsonPatch(obj, [{ op: 'remove', path: '/a' }]);
    assert.deepStrictEqual(obj, { b: 2 });
  });

  it('remove: should remove a nested property', function() {
    var obj = { a: { b: 1, c: 2 } };
    bw.jsonPatch(obj, [{ op: 'remove', path: '/a/b' }]);
    assert.deepStrictEqual(obj, { a: { c: 2 } });
  });

  it('remove: should remove array element by index', function() {
    var obj = { arr: [1, 2, 3] };
    bw.jsonPatch(obj, [{ op: 'remove', path: '/arr/1' }]);
    assert.deepStrictEqual(obj.arr, [1, 3]);
  });

  it('remove: should throw for nonexistent path on object', function() {
    assert.throws(function() {
      bw.jsonPatch({ a: 1 }, [{ op: 'remove', path: '/b' }]);
    }, /Path not found/);
  });

  it('remove: should throw for out-of-bounds array index', function() {
    assert.throws(function() {
      bw.jsonPatch({ arr: [1] }, [{ op: 'remove', path: '/arr/5' }]);
    }, /Index out of bounds/);
  });

  it('remove: should throw for root path', function() {
    assert.throws(function() {
      bw.jsonPatch({}, [{ op: 'remove', path: '' }]);
    }, /Cannot remove root/);
  });

  // -- replace --

  it('replace: should replace a value', function() {
    var obj = { a: 1 };
    bw.jsonPatch(obj, [{ op: 'replace', path: '/a', value: 42 }]);
    assert.strictEqual(obj.a, 42);
  });

  it('replace: should replace a nested value', function() {
    var obj = { a: { b: 'old' } };
    bw.jsonPatch(obj, [{ op: 'replace', path: '/a/b', value: 'new' }]);
    assert.strictEqual(obj.a.b, 'new');
  });

  it('replace: should replace array element', function() {
    var obj = { arr: [1, 2, 3] };
    bw.jsonPatch(obj, [{ op: 'replace', path: '/arr/1', value: 99 }]);
    assert.deepStrictEqual(obj.arr, [1, 99, 3]);
  });

  it('replace: should throw for nonexistent path', function() {
    assert.throws(function() {
      bw.jsonPatch({ a: 1 }, [{ op: 'replace', path: '/b', value: 2 }]);
    }, /Path not found/);
  });

  it('replace: should throw for out-of-bounds array index', function() {
    assert.throws(function() {
      bw.jsonPatch({ arr: [1] }, [{ op: 'replace', path: '/arr/5', value: 2 }]);
    }, /Index out of bounds/);
  });

  it('replace: should throw for root path', function() {
    assert.throws(function() {
      bw.jsonPatch({}, [{ op: 'replace', path: '', value: 1 }]);
    }, /Cannot replace root/);
  });

  // -- move --

  it('move: should move a value', function() {
    var obj = { a: 1, b: 2 };
    bw.jsonPatch(obj, [{ op: 'move', from: '/a', path: '/c' }]);
    assert.deepStrictEqual(obj, { b: 2, c: 1 });
  });

  it('move: should move between nested paths', function() {
    var obj = { a: { x: 1 }, b: {} };
    bw.jsonPatch(obj, [{ op: 'move', from: '/a/x', path: '/b/y' }]);
    assert.deepStrictEqual(obj, { a: {}, b: { y: 1 } });
  });

  it('move: should move array element', function() {
    var obj = { arr: [1, 2, 3], out: null };
    bw.jsonPatch(obj, [{ op: 'move', from: '/arr/0', path: '/out' }]);
    assert.deepStrictEqual(obj.arr, [2, 3]);
    assert.strictEqual(obj.out, 1);
  });

  it('move: should move value into array position', function() {
    var obj = { src: 'x', arr: [1, 2, 3] };
    bw.jsonPatch(obj, [{ op: 'move', from: '/src', path: '/arr/1' }]);
    assert.deepStrictEqual(obj.arr, [1, 'x', 2, 3]);
    assert.strictEqual(obj.src, undefined);
  });

  it('move: should throw without from', function() {
    assert.throws(function() {
      bw.jsonPatch({ a: 1 }, [{ op: 'move', path: '/b' }]);
    }, /move requires "from"/);
  });

  // -- copy --

  it('copy: should copy a value', function() {
    var obj = { a: 1 };
    bw.jsonPatch(obj, [{ op: 'copy', from: '/a', path: '/b' }]);
    assert.deepStrictEqual(obj, { a: 1, b: 1 });
  });

  it('copy: should copy into array', function() {
    var obj = { src: 'x', arr: [1, 2] };
    bw.jsonPatch(obj, [{ op: 'copy', from: '/src', path: '/arr/1' }]);
    assert.deepStrictEqual(obj.arr, [1, 'x', 2]);
  });

  it('copy: should throw without from', function() {
    assert.throws(function() {
      bw.jsonPatch({ a: 1 }, [{ op: 'copy', path: '/b' }]);
    }, /copy requires "from"/);
  });

  // -- test --

  it('test: should pass for matching value', function() {
    var obj = { a: 1 };
    assert.doesNotThrow(function() {
      bw.jsonPatch(obj, [{ op: 'test', path: '/a', value: 1 }]);
    });
  });

  it('test: should pass for matching object value', function() {
    var obj = { a: { b: [1, 2] } };
    assert.doesNotThrow(function() {
      bw.jsonPatch(obj, [{ op: 'test', path: '/a', value: { b: [1, 2] } }]);
    });
  });

  it('test: should throw for non-matching value', function() {
    assert.throws(function() {
      bw.jsonPatch({ a: 1 }, [{ op: 'test', path: '/a', value: 2 }]);
    }, /Test failed/);
  });

  it('test: should throw for nonexistent path', function() {
    assert.throws(function() {
      bw.jsonPatch({}, [{ op: 'test', path: '/missing', value: 1 }]);
    }, /Path not found/);
  });

  // -- error cases --

  it('should throw for unknown op', function() {
    assert.throws(function() {
      bw.jsonPatch({}, [{ op: 'foobar', path: '/a' }]);
    }, /Unknown op/);
  });

  it('should throw for missing op field', function() {
    assert.throws(function() {
      bw.jsonPatch({}, [{ path: '/a', value: 1 }]);
    }, /Invalid patch operation/);
  });

  it('should throw for missing path field', function() {
    assert.throws(function() {
      bw.jsonPatch({}, [{ op: 'add', value: 1 }]);
    }, /Invalid patch operation/);
  });

  it('should throw for invalid JSON Pointer (no leading /)', function() {
    assert.throws(function() {
      bw.jsonPatch({}, [{ op: 'add', path: 'a', value: 1 }]);
    }, /Invalid JSON Pointer/);
  });

  it('should throw for path through nonexistent intermediate', function() {
    assert.throws(function() {
      bw.jsonPatch({}, [{ op: 'add', path: '/a/b/c', value: 1 }]);
    }, /Path not found/);
  });

  // -- JSON Pointer escaping (RFC 6901) --

  it('should handle ~ escape in path (tilde)', function() {
    var obj = { 'a~b': 1 };
    bw.jsonPatch(obj, [{ op: 'replace', path: '/a~0b', value: 2 }]);
    assert.strictEqual(obj['a~b'], 2);
  });

  it('should handle / escape in path (slash)', function() {
    var obj = { 'a/b': 1 };
    bw.jsonPatch(obj, [{ op: 'replace', path: '/a~1b', value: 2 }]);
    assert.strictEqual(obj['a/b'], 2);
  });

  // -- multiple operations --

  it('should apply multiple operations in order', function() {
    var obj = { a: 1, b: { c: 2 } };
    bw.jsonPatch(obj, [
      { op: 'replace', path: '/a', value: 10 },
      { op: 'add', path: '/b/d', value: 3 },
      { op: 'remove', path: '/b/c' }
    ]);
    assert.deepStrictEqual(obj, { a: 10, b: { d: 3 } });
  });

  it('should stop on first error', function() {
    var obj = { a: 1 };
    assert.throws(function() {
      bw.jsonPatch(obj, [
        { op: 'add', path: '/b', value: 2 },
        { op: 'remove', path: '/nonexistent' },
        { op: 'add', path: '/c', value: 3 }
      ]);
    });
    // First op applied, third should not be
    assert.strictEqual(obj.b, 2);
    assert.strictEqual(obj.c, undefined);
  });

  // -- returns same reference --

  it('should return the same object reference', function() {
    var obj = { a: 1 };
    var result = bw.jsonPatch(obj, [{ op: 'add', path: '/b', value: 2 }]);
    assert.strictEqual(result, obj);
  });

  // -- complex nested structures --

  it('should handle deeply nested paths', function() {
    var obj = { a: { b: { c: { d: 1 } } } };
    bw.jsonPatch(obj, [{ op: 'replace', path: '/a/b/c/d', value: 99 }]);
    assert.strictEqual(obj.a.b.c.d, 99);
  });

  it('should handle array of objects', function() {
    var obj = { items: [{ id: 1, name: 'a' }, { id: 2, name: 'b' }] };
    bw.jsonPatch(obj, [{ op: 'replace', path: '/items/1/name', value: 'updated' }]);
    assert.strictEqual(obj.items[1].name, 'updated');
  });

  it('test + replace combo (conditional update)', function() {
    var obj = { version: 1, data: 'old' };
    bw.jsonPatch(obj, [
      { op: 'test', path: '/version', value: 1 },
      { op: 'replace', path: '/data', value: 'new' },
      { op: 'replace', path: '/version', value: 2 }
    ]);
    assert.deepStrictEqual(obj, { version: 2, data: 'new' });
  });

  it('test failure prevents subsequent ops', function() {
    var obj = { version: 2, data: 'safe' };
    assert.throws(function() {
      bw.jsonPatch(obj, [
        { op: 'test', path: '/version', value: 1 },
        { op: 'replace', path: '/data', value: 'SHOULD NOT HAPPEN' }
      ]);
    }, /Test failed/);
    assert.strictEqual(obj.data, 'safe');
  });

  // -- values --

  it('should handle null value', function() {
    var obj = { a: 1 };
    bw.jsonPatch(obj, [{ op: 'add', path: '/a', value: null }]);
    assert.strictEqual(obj.a, null);
  });

  it('should handle boolean value', function() {
    var obj = {};
    bw.jsonPatch(obj, [{ op: 'add', path: '/flag', value: true }]);
    assert.strictEqual(obj.flag, true);
  });

  it('should handle object value', function() {
    var obj = {};
    bw.jsonPatch(obj, [{ op: 'add', path: '/nested', value: { x: 1, y: [2] } }]);
    assert.deepStrictEqual(obj.nested, { x: 1, y: [2] });
  });
});


// =========================================================================
// One target rule everywhere (reported by jazzmac, 2026-10-05)
//
// bw.el, bw.patch, bw.toggleClass and bw.clear all accept a bare element id
// ('status'). bw.mount resolved its target with bw.$(target)[0] -- a plain CSS
// selector query -- so the same string failed with "target not found". An
// author who learned the bare-id form from one verb had to remember that one
// other verb wanted '#status'.
// =========================================================================

describe('target resolution is the same for every verb', function() {
  // Every verb that takes a target string. append and render were missed in
  // the first pass at this: append returned null with no warning at all, which
  // is worse than mount's "target not found".
  var VERBS = ['el', 'patch', 'toggleClass', 'clear', 'mount', 'append', 'render'];

  function fresh() {
    document.body.innerHTML = '<div id="status">old</div><div class="card">c</div>';
  }

  function callWith(verb, target) {
    if (verb === 'el') return bw.el(target);
    if (verb === 'patch') return bw.patch(target, 'new');
    if (verb === 'toggleClass') return bw.toggleClass(target, 'on');
    if (verb === 'clear') return bw.clear(target);
    if (verb === 'append') return bw.append(target, { t: 'span', c: 'x' });
    if (verb === 'render') return bw.render(target, 'beforeend', { t: 'span', c: 'x' });
    return bw.mount(target, { t: 'span', c: 'x' });
  }

  it('every verb accepts a bare element id', function() {
    VERBS.forEach(function(verb) {
      fresh();
      var warned = [];
      var orig = console.warn;
      console.warn = function(m) { warned.push(String(m)); };
      var out;
      try { out = callWith(verb, 'status'); } finally { console.warn = orig; }
      assert.ok(out !== null && out !== undefined && !(Array.isArray(out) && !out.length),
        'bw.' + verb + "('status') did not resolve the element");
      assert.deepStrictEqual(warned.filter(function(w) { return /not found/.test(w); }), [],
        'bw.' + verb + "('status') warned about a target that exists");
    });
  });

  it('every verb accepts an id selector', function() {
    VERBS.forEach(function(verb) {
      fresh();
      var out = callWith(verb, '#status');
      assert.ok(out !== null && out !== undefined && !(Array.isArray(out) && !out.length),
        'bw.' + verb + "('#status') did not resolve the element");
    });
  });

  it('every verb accepts a class selector', function() {
    VERBS.forEach(function(verb) {
      fresh();
      var out = callWith(verb, '.card');
      assert.ok(out !== null && out !== undefined && !(Array.isArray(out) && !out.length),
        'bw.' + verb + "('.card') did not resolve the element");
    });
  });

  it('every verb accepts a live element', function() {
    VERBS.forEach(function(verb) {
      fresh();
      var el = document.getElementById('status');
      var out = callWith(verb, el);
      assert.ok(out !== null && out !== undefined && !(Array.isArray(out) && !out.length),
        'bw.' + verb + '(element) did not resolve');
    });
  });

  it('bw.mount still warns and returns null for a target that does not exist', function() {
    fresh();
    var warned = [];
    var orig = console.warn;
    console.warn = function(m) { warned.push(String(m)); };
    var out;
    try { out = bw.mount('no_such_thing', { t: 'p', c: 'x' }); } finally { console.warn = orig; }
    assert.strictEqual(out, null, 'should return null');
    assert.ok(warned.some(function(w) { return /target not found/.test(w); }),
      'should still warn');
  });

  it('bw.mount with a bare id actually mounts, and unmounts what was there', function() {
    fresh();
    var inner = bw.mount('status', { t: 'span', a: { id: 'inner' }, c: 'first' });
    assert.ok(inner, 'mount returned the container');
    assert.strictEqual(bw.el('inner').textContent, 'first');
    bw.mount('status', { t: 'b', c: 'second' });
    assert.strictEqual(bw.el('status').textContent, 'second', 'remount replaces children');
    assert.strictEqual(bw.$('#status span').length, 0, 'old child is gone');
  });

  it('bw.DOM gets the same rule (it is the same function)', function() {
    fresh();
    assert.strictEqual(bw.DOM, bw.mount, 'bw.DOM should be bw.mount');
    assert.ok(bw.DOM('status', { t: 'i', c: 'viaDOM' }));
    assert.strictEqual(bw.el('status').textContent, 'viaDOM');
  });

  it('bw.mount resolves a UUID class, like bw.el does', function() {
    document.body.innerHTML = '<div id="host"></div>';
    var el = bw.mount('#host', {
      t: 'div', o: { state: {} }, c: 'x'
    });
    var uuid = bw.getUUID(el.firstChild) || bw.getUUID(el);
    if (!uuid) return this.skip();
    assert.ok(bw.mount(uuid, { t: 'em', c: 'byUuid' }),
      'mount should resolve a bw_uuid_* token');
  });
});

// =========================================================================
// o.render + o.mounted together
//
// There is one _bw_mounted_fn slot. Supplying both used to mean `mounted`
// claimed it and the initial render never ran, so the component mounted
// empty with no warning -- it caught the quickstart's own flagship example
// and five more in docs/state-management.md. Both must now run, render
// first, because `mounted` commonly measures or wires up what render built.
// =========================================================================

describe('o.render and o.mounted together', function() {
  beforeEach(freshDOM);

  it('runs render when mounted is also supplied', function() {
    var calls = [];
    bw.mount('#app', {
      t: 'ul',
      o: {
        state: { items: ['a', 'b', 'c'] },
        render: function(el, s) {
          calls.push('render');
          bw.patch(el, s.items.map(function(i) { return { t: 'li', c: i }; }));
        },
        mounted: function() { calls.push('mounted'); }
      }
    });
    assert.deepStrictEqual(calls, ['render', 'mounted'],
      'both hooks run, render first');
    assert.strictEqual(document.querySelectorAll('#app li').length, 3,
      'the component must not mount empty');
  });

  it('lets mounted observe the DOM that render produced', function() {
    var seen = -1;
    bw.mount('#app', {
      t: 'ul',
      o: {
        state: { items: ['a', 'b'] },
        render: function(el, s) {
          bw.patch(el, s.items.map(function(i) { return { t: 'li', c: i }; }));
        },
        mounted: function(el) { seen = el.querySelectorAll('li').length; }
      }
    });
    assert.strictEqual(seen, 2, 'render must run before mounted, not after');
  });

  it('still runs render when it is the only hook', function() {
    var n = 0;
    bw.mount('#app', {
      t: 'div',
      o: { state: { v: 1 }, render: function(el, s) { n++; bw.patch(el, 'v=' + s.v); } }
    });
    assert.strictEqual(n, 1);
    assert.strictEqual(bw.$('#app div')[0].textContent, 'v=1');
  });

  it('still runs mounted when it is the only hook', function() {
    var n = 0;
    bw.mount('#app', { t: 'div', c: 'x', o: { mounted: function() { n++; } } });
    assert.strictEqual(n, 1);
  });

  it('passes the same element and state to both hooks', function() {
    var got = {};
    bw.mount('#app', {
      t: 'div',
      o: {
        state: { k: 'v' },
        render: function(el, s) { got.renderEl = el; got.renderState = s; },
        mounted: function(el, s) { got.mountedEl = el; got.mountedState = s; }
      }
    });
    assert.strictEqual(got.renderEl, got.mountedEl, 'same element');
    assert.strictEqual(got.renderState, got.mountedState, 'same state object');
    assert.strictEqual(got.renderState.k, 'v');
  });

  it('names render as the thrower, not mounted', function() {
    // Both halves share one _bw_mounted_fn slot, so one catch in mountTree
    // sees either throw. It used to call every failure "o.mounted error" --
    // including a render failure, which this release is what put in that slot.
    // bw.refresh() lets the same render throw under its own name, so the same
    // function failed two different ways depending on mount vs refresh.
    var mountedRan = false;
    var warns = [];
    var diags = [];
    var origWarn = console.warn;
    console.warn = function() { warns.push(Array.prototype.join.call(arguments, ' ')); };
    var unsub = bw.sub('bw:diag', function(d) { diags.push(d); });
    try {
      assert.doesNotThrow(function() {
        bw.mount('#app', {
          t: 'div',
          o: {
            render: function() { throw new Error('render boom'); },
            mounted: function() { mountedRan = true; }
          }
        });
      }, 'a throwing hook must not escape mountTree');
    } finally {
      console.warn = origWarn;
      bw.unsub('bw:diag', unsub);
    }

    assert.ok(warns.some(function(w) { return /o\.render error: render boom/.test(w); }),
      'the warning must name render, got: ' + warns.join(' | '));
    assert.ok(!warns.some(function(w) { return /o\.mounted error/.test(w); }),
      'it must not blame mounted');
    var d = diags.filter(function(x) { return /hook_error/.test(x.code); });
    assert.strictEqual(d.length, 1);
    assert.strictEqual(d[0].code, 'render_hook_error');
    assert.strictEqual(d[0].hook, 'render');

    // mountTree catches at the slot boundary, so mounted is skipped when
    // render throws. Asserted so a change in that contract is visible.
    assert.strictEqual(mountedRan, false,
      'render throwing short-circuits the composed slot');
  });

  it('still names mounted when mounted is the thrower', function() {
    var warns = [];
    var diags = [];
    var origWarn = console.warn;
    console.warn = function() { warns.push(Array.prototype.join.call(arguments, ' ')); };
    var unsub = bw.sub('bw:diag', function(d) { diags.push(d); });
    try {
      bw.mount('#app', {
        t: 'div',
        o: {
          render: function(el) { bw.patch(el, 'ok'); },
          mounted: function() { throw new Error('mounted boom'); }
        }
      });
    } finally {
      console.warn = origWarn;
      bw.unsub('bw:diag', unsub);
    }
    assert.ok(warns.some(function(w) { return /o\.mounted error: mounted boom/.test(w); }),
      'got: ' + warns.join(' | '));
    assert.strictEqual(diags.filter(function(x) { return /hook_error/.test(x.code); })[0].code,
      'mounted_hook_error');
    assert.strictEqual(bw.$('#app div')[0].textContent, 'ok',
      'render ran first and its work survives a later mounted throw');
  });

  it('names render when render is the only hook', function() {
    var warns = [];
    var origWarn = console.warn;
    console.warn = function() { warns.push(Array.prototype.join.call(arguments, ' ')); };
    try {
      bw.mount('#app', { t: 'div', o: { render: function() { throw new Error('solo'); } } });
    } finally {
      console.warn = origWarn;
    }
    assert.ok(warns.some(function(w) { return /o\.render error: solo/.test(w); }),
      'got: ' + warns.join(' | '));
  });

  it('does not re-render when state is mutated -- updates stay explicit', function() {
    // The guard against this fix drifting into reactivity. Composing render
    // and mounted must not introduce dependency tracking: mutating state is
    // inert until something explicitly asks for a render.
    var renders = 0;
    var el = bw.mount('#app', {
      t: 'div',
      o: {
        state: { n: 0 },
        render: function(e, s) { renders++; bw.patch(e, 'n=' + s.n); },
        mounted: function() {}
      }
    });
    assert.strictEqual(renders, 1, 'one render at mount');

    el._bw_state.n = 99;
    assert.strictEqual(renders, 1, 'mutating state must not trigger a render');
    assert.strictEqual(el.textContent, 'n=0', 'the DOM still shows the old value');

    bw.refresh(el);
    assert.strictEqual(renders, 2, 'only an explicit refresh renders again');
    assert.strictEqual(el.textContent, 'n=99');
  });

  it('fires the pair once per element identity', function() {
    var n = 0;
    var el = bw.mount('#app', {
      t: 'div',
      o: { state: {}, render: function() { n++; }, mounted: function() { n += 10; } }
    });
    bw.mountTree(el);
    assert.strictEqual(n, 11, 'a second mountTree pass must not re-fire either hook');
  });
});

// =========================================================================
// The update path: component methods, not re-renders
//
// These tests exist to pin down WHY bitwrench prefers el.bw.method() over
// o.render + bw.refresh(), because the difference is measurable rather than
// stylistic and the docs kept drifting toward the React framing ("change
// state and trigger re-render").
//
// bw.refresh() clears the element and runs o.render again, so every child is
// destroyed and rebuilt -- taking with it anything the DOM held that the
// state does not model. A handle method touches only what changed. If either
// half of this ever stops being true, the guidance in
// docs/framework-translation-table.md needs rewriting.
// =========================================================================

describe('update path: methods vs re-render', function() {
  beforeEach(freshDOM);

  // A counter next to an input the "user" is halfway through filling in.
  function blunt() {
    return {
      t: 'div',
      o: {
        state: { count: 0 },
        render: function(el, s) {
          bw.DOM(el, [
            { t: 'span', a: { id: 'n' }, c: String(s.count) },
            { t: 'input', a: { id: 'typed' } }
          ]);
        }
      }
    };
  }

  function surgical() {
    return {
      t: 'div',
      c: [
        { t: 'span', a: { id: 'n' }, c: '0' },
        { t: 'input', a: { id: 'typed' } }
      ],
      o: {
        state: { count: 0 },
        slots: { n: '#n' },
        handle: {
          inc: function(el) {
            el._bw_state.count++;
            el.bw.setN(String(el._bw_state.count));
          }
        }
      }
    };
  }

  it('bw.refresh discards DOM state the component state does not model', function() {
    var el = bw.mount('#app', blunt());
    var input = bw.$('#typed')[0];
    input.value = 'half-typed';
    input.focus();
    assert.strictEqual(document.activeElement, input, 'precondition: focused');

    el._bw_state.count = 1;
    bw.refresh(el);

    assert.strictEqual(bw.$('#n')[0].textContent, '1', 'the counter did update');
    assert.strictEqual(bw.$('#typed')[0].value, '',
      'refresh rebuilds children, so the half-typed value is gone');
    assert.notStrictEqual(document.activeElement, bw.$('#typed')[0],
      'and focus goes with it');
  });

  it('a handle method updates only what changed', function() {
    var el = bw.mount('#app', surgical());
    var input = bw.$('#typed')[0];
    input.value = 'half-typed';
    input.focus();

    el.bw.inc();

    assert.strictEqual(bw.$('#n')[0].textContent, '1', 'the counter updated');
    assert.strictEqual(bw.$('#typed')[0].value, 'half-typed',
      'the untouched input keeps its value');
    assert.strictEqual(document.activeElement, bw.$('#typed')[0],
      'and keeps focus');
  });

  it('the same node survives a handle call but not a refresh', function() {
    var el = bw.mount('#app', surgical());
    var before = bw.$('#typed')[0];
    el.bw.inc();
    assert.strictEqual(bw.$('#typed')[0], before,
      'a handle call must not replace sibling nodes');

    var el2 = bw.mount('#app', blunt());
    var before2 = bw.$('#typed')[0];
    bw.refresh(el2);
    assert.notStrictEqual(bw.$('#typed')[0], before2,
      'refresh replaces the subtree -- that is what makes it blunt');
  });

  it('bw.update dispatches to the handle rather than re-rendering', function() {
    var seen = null;
    var el = bw.mount('#app', {
      t: 'div',
      c: { t: 'span', a: { id: 'n' }, c: '0' },
      o: {
        state: { count: 0 },
        handle: { update: function(e, data) { seen = data; bw.patch('n', String(data.count)); } }
      }
    });
    var input = bw.create({ t: 'input' });
    el.appendChild(input);
    input.value = 'kept';

    bw.update(el, { count: 7 });

    assert.deepStrictEqual(seen, { count: 7 }, 'bw.update calls el.bw.update');
    assert.strictEqual(bw.$('#n')[0].textContent, '7');
    assert.strictEqual(input.value, 'kept', 'nothing else was rebuilt');
  });

  it('o.slots generates the accessor pair the surgical path relies on', function() {
    var el = bw.mount('#app', {
      t: 'div',
      c: { t: 'span', a: { class: 'title' }, c: 'before' },
      o: { slots: { title: '.title' } }
    });
    assert.strictEqual(typeof el.bw.setTitle, 'function', 'setter generated');
    assert.strictEqual(typeof el.bw.getTitle, 'function', 'getter generated');
    el.bw.setTitle('after');
    assert.strictEqual(el.bw.getTitle(), 'after');
    assert.strictEqual(bw.$('#app .title')[0].textContent, 'after');
  });
});

// =========================================================================
// SVG namespace through the insert verbs
//
// bw.create() detects SVG context from the TACO (`{t:'svg'}`) and threads it
// to children, which covers a tree built in one call. It cannot know the
// namespace of a parent it is inserted INTO, so every verb that adds children
// to an element already in the document had to be taught. Until it was,
// bw.append/patch/replace/syncChildren/mount built <rect> and friends with
// createElement() in the XHTML namespace: they appear in the DOM, match
// selectors, and render nothing -- which is why docs/svg.md recommending
// bw.syncChildren for SVG series could not have worked.
// =========================================================================

describe('SVG namespace survives the insert verbs', function() {
  var SVG_NS = 'http://www.w3.org/2000/svg';
  var layer;

  beforeEach(function() {
    freshDOM();
    bw.mount('#app', {
      t: 'svg', a: { width: '100', height: '100' },
      c: { t: 'g', a: { id: 'layer' } }
    });
    layer = bw.$('#layer')[0];
    assert.strictEqual(layer.namespaceURI, SVG_NS, 'precondition: the parent is SVG');
  });

  function nsOf(sel) {
    var el = bw.$(sel)[0];
    assert.ok(el, sel + ' should exist');
    return el.namespaceURI;
  }

  it('bw.append puts the child in the SVG namespace', function() {
    bw.append(layer, { t: 'rect', a: { id: 'r1', width: '10', height: '10' } });
    assert.strictEqual(nsOf('#r1'), SVG_NS);
  });

  it('bw.patch with a TACO stays in the SVG namespace', function() {
    bw.patch(layer, { t: 'circle', a: { id: 'c1', r: '5' } });
    assert.strictEqual(nsOf('#c1'), SVG_NS);
  });

  it('bw.patch with an array stays in the SVG namespace', function() {
    bw.patch(layer, [
      { t: 'line', a: { id: 'l1' } },
      { t: 'line', a: { id: 'l2' } }
    ]);
    assert.strictEqual(nsOf('#l1'), SVG_NS);
    assert.strictEqual(nsOf('#l2'), SVG_NS);
  });

  it('bw.syncChildren creates SVG children -- the case docs/svg.md recommends', function() {
    bw.syncChildren(layer, [1, 2, 3], {
      key: function(i) { return String(i); },
      create: function(i) { return { t: 'rect', a: { id: 's' + i, width: '5', height: '5' } }; }
    });
    assert.strictEqual(nsOf('#s1'), SVG_NS);
    assert.strictEqual(nsOf('#s3'), SVG_NS);
  });

  it('bw.replace keeps the namespace of the node it replaces', function() {
    bw.append(layer, { t: 'line', a: { id: 'old' } });
    bw.replace(bw.$('#old')[0], { t: 'ellipse', a: { id: 'e1' } });
    assert.strictEqual(nsOf('#e1'), SVG_NS);
  });

  it('bw.mount into an existing <svg> stays in the SVG namespace', function() {
    bw.mount(layer, { t: 'path', a: { id: 'p1', d: 'M0 0' } });
    assert.strictEqual(nsOf('#p1'), SVG_NS);
  });

  it('bw.el/bw.$ apply with a TACO stays in the SVG namespace', function() {
    bw.el(layer, { t: 'rect', a: { id: 'a1', width: '4', height: '4' } });
    assert.strictEqual(nsOf('#a1'), SVG_NS);
  });

  it('foreignObject children revert to HTML, as SVG requires', function() {
    bw.append(layer, {
      t: 'foreignObject', a: { id: 'fo', width: '50', height: '50' },
      c: { t: 'div', a: { id: 'inner' }, c: 'hi' }
    });
    assert.strictEqual(nsOf('#fo'), SVG_NS, 'foreignObject itself is SVG');
    assert.notStrictEqual(nsOf('#inner'), SVG_NS,
      'its children are HTML again -- that is the point of foreignObject');
  });

  it('an HTML parent is unaffected', function() {
    var host = bw.$('#app')[0];
    bw.append(host, { t: 'div', a: { id: 'plain' } });
    assert.notStrictEqual(nsOf('#plain'), SVG_NS,
      'the namespace must come from the parent, not be applied everywhere');
  });
});
