/**
 * Bitwrench Lifecycle Engine Test Suite
 *
 * Tests for the hydrate/mount/cleanup lifecycle system:
 *   - bw.isComponent(taco)
 *   - bw.hydrate(taco) -- TACO -> DOM + handle
 *   - bw.mount(target, taco) / bw.DOM(target, taco)
 *   - bw.cleanup(element)
 *   - bw.getHandle(selector)
 *   - bw._handles registry
 *   - Handle object: { el, uuid, mounted, _state, _hooks, get, set, getState }
 *   - bw.message(target, action, data)
 *   - bw.inspect(target)
 *   - Deprecation stubs
 */

import assert from "assert";
import bw from "../src/bitwrench.js";
import jsdom from 'jsdom';
const { JSDOM } = jsdom;

// =========================================================================
// DOM environment helper
// =========================================================================

var dom;

function freshDOM() {
  dom = new JSDOM('<!DOCTYPE html><html><body><div id="app"></div></body></html>');
  global.window = dom.window;
  global.document = dom.window.document;
  global.Element = dom.window.Element;
  global.DocumentFragment = dom.window.DocumentFragment;
  global.HTMLElement = dom.window.HTMLElement;
  global.CustomEvent = dom.window.CustomEvent;
  // Clear handles registry
  if (bw._handles) {
    var keys = Object.keys(bw._handles);
    for (var i = 0; i < keys.length; i++) {
      delete bw._handles[keys[i]];
    }
  }
  // Clear nodeMap
  if (bw._nodeMap) {
    var nkeys = Object.keys(bw._nodeMap);
    for (var j = 0; j < nkeys.length; j++) {
      delete bw._nodeMap[nkeys[j]];
    }
  }
  return dom;
}

freshDOM();

// =========================================================================
// Tests
// =========================================================================

describe('Lifecycle Engine', function () {

  beforeEach(function () {
    freshDOM();
  });

  // =======================================================================
  // isComponent
  // =======================================================================

  describe('bw.isComponent', function () {

    it('returns false for null/undefined/strings/numbers', function () {
      assert.strictEqual(bw.isComponent(null), false);
      assert.strictEqual(bw.isComponent(undefined), false);
      assert.strictEqual(bw.isComponent('hello'), false);
      assert.strictEqual(bw.isComponent(42), false);
    });

    it('returns false for plain TACO {t:"div"}', function () {
      assert.strictEqual(bw.isComponent({ t: 'div' }), false);
      assert.strictEqual(bw.isComponent({ t: 'div', c: 'hello' }), false);
      assert.strictEqual(bw.isComponent({ t: 'p', a: { class: 'x' }, c: 'text' }), false);
    });

    it('returns true if o.methods exists', function () {
      assert.strictEqual(bw.isComponent({
        t: 'div', o: { methods: { foo: function () {} } }
      }), true);
    });

    it('returns true if o.state exists', function () {
      assert.strictEqual(bw.isComponent({
        t: 'div', o: { state: { x: 1 } }
      }), true);
    });

    it('returns true if o.mounted exists', function () {
      assert.strictEqual(bw.isComponent({
        t: 'div', o: { mounted: function () {} }
      }), true);
    });

  });

  // =======================================================================
  // hydrate - primitives
  // =======================================================================

  describe('bw.hydrate - primitives', function () {

    it('null -> empty text node', function () {
      var result = bw.hydrate(null);
      assert.ok(result.el);
      assert.strictEqual(result.el.textContent, '');
    });

    it('undefined -> empty text node', function () {
      var result = bw.hydrate(undefined);
      assert.ok(result.el);
      assert.strictEqual(result.el.textContent, '');
    });

    it('string -> text node', function () {
      var result = bw.hydrate('hello world');
      assert.strictEqual(result.el.textContent, 'hello world');
    });

    it('number -> text node', function () {
      var result = bw.hydrate(42);
      assert.strictEqual(result.el.textContent, '42');
    });

    it('bw.raw() -> innerHTML fragment', function () {
      var result = bw.hydrate(bw.raw('<em>italic</em>'));
      // Should produce an element or fragment containing the raw HTML
      assert.ok(result.el);
      if (result.el.tagName) {
        assert.strictEqual(result.el.tagName, 'EM');
      }
    });

    it('array -> document fragment with children', function () {
      var result = bw.hydrate([{ t: 'p', c: 'a' }, { t: 'p', c: 'b' }]);
      assert.ok(result.el instanceof DocumentFragment);
      assert.strictEqual(result.el.childNodes.length, 2);
    });

    it('non-TACO object -> text node', function () {
      var result = bw.hydrate({ foo: 'bar' });
      assert.ok(result.el);
      assert.strictEqual(result.el.nodeType, 3); // TEXT_NODE
    });

    it('already-hydrated handle passthrough', function () {
      var first = bw.hydrate({ t: 'div', o: { state: {} } });
      var second = bw.hydrate(first);
      assert.strictEqual(first, second);
    });

  });

  // =======================================================================
  // hydrate - components
  // =======================================================================

  describe('bw.hydrate - components', function () {

    it('component gets bw_uuid class + bw_is_component class', function () {
      var result = bw.hydrate({
        t: 'div', o: { state: { x: 1 } }
      });
      assert.ok(result.el.className.indexOf('bw_is_component') >= 0);
      assert.ok(result.uuid);
      assert.ok(result.el.className.indexOf(result.uuid) >= 0);
    });

    it('component gets handle with .el, .uuid, .get, .set, .getState', function () {
      var result = bw.hydrate({
        t: 'div', o: { state: { count: 0 } }
      });
      assert.ok(result.el instanceof Element);
      assert.ok(typeof result.uuid === 'string');
      assert.ok(typeof result.get === 'function');
      assert.ok(typeof result.set === 'function');
      assert.ok(typeof result.getState === 'function');
    });

    it('o.methods are promoted to handle (receive handle as first arg)', function () {
      var result = bw.hydrate({
        t: 'div',
        o: {
          methods: {
            greet: function (h, name) { return 'hi ' + name; }
          }
        }
      });
      assert.strictEqual(typeof result.greet, 'function');
      assert.strictEqual(result.greet('world'), 'hi world');
    });

    it('o.state is copied to handle._state', function () {
      var result = bw.hydrate({
        t: 'div', o: { state: { x: 10, y: 20 } }
      });
      assert.strictEqual(result._state.x, 10);
      assert.strictEqual(result._state.y, 20);
    });

    it('handle registered in bw._handles', function () {
      var result = bw.hydrate({ t: 'div', o: { state: {} } });
      assert.strictEqual(bw._handles[result.uuid], result);
    });

    it('el._bwHandle back-reference', function () {
      var result = bw.hydrate({ t: 'div', o: { state: {} } });
      assert.strictEqual(result.el._bwHandle, result);
    });

    it('multiple components get unique UUIDs', function () {
      var a = bw.hydrate({ t: 'div', o: { state: {} } });
      var b = bw.hydrate({ t: 'div', o: { state: {} } });
      assert.notStrictEqual(a.uuid, b.uuid);
    });

    it('handle._taco preserves original TACO', function () {
      var taco = { t: 'div', o: { state: { x: 1 } } };
      var result = bw.hydrate(taco);
      assert.strictEqual(result._taco, taco);
    });

    it('o.type adds bw_is_component_bccl_{type} class', function () {
      var result = bw.hydrate({
        t: 'div', o: { type: 'table', state: { x: 1 } }
      });
      assert.ok(result.el.className.indexOf('bw_is_component_bccl_table') >= 0);
    });

    it('component TACO with all options (methods + state + mounted + unmount)', function () {
      var result = bw.hydrate({
        t: 'div',
        o: {
          state: { count: 0 },
          methods: { inc: function (h) { h._state.count++; return h._state.count; } },
          mounted: function (h) { h.set('ready', true); },
          unmount: function (h) { h.set('ready', false); }
        }
      });
      assert.ok(result.el instanceof Element);
      assert.ok(result.uuid);
      assert.strictEqual(typeof result.inc, 'function');
      assert.strictEqual(result.get('count'), 0);
      // mounted hook not fired until mount() is called
      assert.strictEqual(result.mounted, false);
    });

  });

  // =======================================================================
  // hydrate - attributes
  // =======================================================================

  describe('bw.hydrate - attributes', function () {

    it('class string -> el.className', function () {
      var result = bw.hydrate({ t: 'div', a: { class: 'foo bar' } });
      assert.ok(result.el.className.indexOf('foo') >= 0);
      assert.ok(result.el.className.indexOf('bar') >= 0);
    });

    it('class array -> joined className', function () {
      var result = bw.hydrate({ t: 'div', a: { class: ['alpha', 'beta'] } });
      assert.ok(result.el.className.indexOf('alpha') >= 0);
      assert.ok(result.el.className.indexOf('beta') >= 0);
    });

    it('style object -> el.style properties', function () {
      var result = bw.hydrate({ t: 'div', a: { style: { color: 'red', fontSize: '14px' } } });
      assert.strictEqual(result.el.style.color, 'red');
    });

    it('boolean true -> setAttribute(key, "")', function () {
      var result = bw.hydrate({ t: 'input', a: { disabled: true, type: 'text' } });
      assert.ok(result.el.hasAttribute('disabled'));
      assert.strictEqual(result.el.getAttribute('type'), 'text');
    });

    it('null/false attributes skipped', function () {
      var result = bw.hydrate({ t: 'div', a: { class: 'test', id: null, hidden: false } });
      assert.strictEqual(result.el.hasAttribute('id'), false);
      assert.strictEqual(result.el.hasAttribute('hidden'), false);
    });

    it('event handlers tracked in _bw_listeners', function () {
      var called = false;
      var result = bw.hydrate({ t: 'button', a: { onclick: function () { called = true; } } });
      assert.ok(result.el._bw_listeners);
      assert.strictEqual(result.el._bw_listeners.length, 1);
      assert.strictEqual(result.el._bw_listeners[0].event, 'click');
    });

    it('data-* attributes set correctly', function () {
      var result = bw.hydrate({ t: 'div', a: { 'data-id': '42', 'data-role': 'widget' } });
      assert.strictEqual(result.el.getAttribute('data-id'), '42');
      assert.strictEqual(result.el.getAttribute('data-role'), 'widget');
    });

    it('input value property set correctly', function () {
      var result = bw.hydrate({ t: 'input', a: { value: 'hello', type: 'text' } });
      assert.strictEqual(result.el.value, 'hello');
    });

  });

  // =======================================================================
  // mount / DOM
  // =======================================================================

  describe('bw.mount / bw.DOM', function () {

    it('mount into selector string', function () {
      var result = bw.mount('#app', { t: 'p', c: 'hello' });
      assert.strictEqual(document.querySelector('#app p').textContent, 'hello');
    });

    it('mount into DOM element', function () {
      var target = document.querySelector('#app');
      bw.mount(target, { t: 'span', c: 'direct' });
      assert.strictEqual(target.querySelector('span').textContent, 'direct');
    });

    it('replaces old content', function () {
      bw.mount('#app', { t: 'p', c: 'first' });
      assert.strictEqual(document.querySelector('#app p').textContent, 'first');
      bw.mount('#app', { t: 'span', c: 'second' });
      assert.strictEqual(document.querySelector('#app p'), null);
      assert.strictEqual(document.querySelector('#app span').textContent, 'second');
    });

    it('returns hydrated result', function () {
      var result = bw.mount('#app', { t: 'div', o: { state: { v: 42 } } });
      assert.ok(result);
      assert.ok(result.el instanceof Element);
      assert.strictEqual(result.get('v'), 42);
    });

    it('fires mounted hooks after insertion', function () {
      var hookCalled = false;
      bw.mount('#app', {
        t: 'div', o: { state: {}, mounted: function (h) { hookCalled = true; } }
      });
      assert.strictEqual(hookCalled, true);
    });

    it('cleanup called on old content', function () {
      var unmounted = false;
      bw.mount('#app', {
        t: 'div', o: { state: {}, unmount: function () { unmounted = true; } }
      });
      bw.mount('#app', { t: 'p', c: 'new' });
      assert.strictEqual(unmounted, true);
    });

    it('mount null -> empty target', function () {
      bw.mount('#app', { t: 'p', c: 'content' });
      assert.ok(document.querySelector('#app p'));
      bw.mount('#app', null);
      assert.strictEqual(document.querySelector('#app p'), null);
    });

    it('mount array of TACOs', function () {
      bw.mount('#app', [{ t: 'p', c: 'one' }, { t: 'p', c: 'two' }]);
      var ps = document.querySelectorAll('#app p');
      assert.strictEqual(ps.length, 2);
      assert.strictEqual(ps[0].textContent, 'one');
      assert.strictEqual(ps[1].textContent, 'two');
    });

  });

  // =======================================================================
  // cleanup
  // =======================================================================

  describe('bw.cleanup', function () {

    it('fires unmount hook on components', function () {
      var unmounted = false;
      var h = bw.mount('#app', {
        t: 'div', o: { state: {}, unmount: function () { unmounted = true; } }
      });
      bw.cleanup(h.el);
      assert.strictEqual(unmounted, true);
    });

    it('removes _bw_listeners from elements', function () {
      var count = 0;
      bw.mount('#app', { t: 'button', a: { onclick: function () { count++; } }, c: 'btn' });
      var btn = document.querySelector('#app button');
      btn.click();
      assert.strictEqual(count, 1);
      bw.cleanup(btn);
      btn.click();
      assert.strictEqual(count, 1); // listener removed
    });

    it('deregisters handle from bw._handles', function () {
      var h = bw.mount('#app', { t: 'div', o: { state: {} } });
      var uid = h.uuid;
      assert.ok(bw._handles[uid]);
      bw.cleanup(h.el);
      assert.strictEqual(bw._handles[uid], undefined);
    });

    it('cleans all descendant components', function () {
      var order = [];
      bw.mount('#app', {
        t: 'div', c: [
          { t: 'span', o: { state: {}, unmount: function () { order.push('child1'); } } },
          { t: 'span', o: { state: {}, unmount: function () { order.push('child2'); } } }
        ]
      });
      bw.cleanup(document.querySelector('#app'));
      assert.ok(order.indexOf('child1') >= 0);
      assert.ok(order.indexOf('child2') >= 0);
    });

    it('cleans non-component elements with listeners', function () {
      bw.mount('#app', {
        t: 'div', c: [
          { t: 'button', a: { id: 'plain_btn', onclick: function () {} }, c: 'plain' }
        ]
      });
      var btn = document.querySelector('#plain_btn');
      assert.ok(btn._bw_listeners);
      bw.cleanup(document.querySelector('#app'));
      assert.strictEqual(btn._bw_listeners, undefined);
    });

    it('no error on null/undefined', function () {
      // Should not throw
      bw.cleanup(null);
      bw.cleanup(undefined);
    });

    it('no error on non-browser environment flag check', function () {
      // cleanup should gracefully return for null/undefined input
      // even in browser environment
      assert.doesNotThrow(function () { bw.cleanup(null); });
      assert.doesNotThrow(function () { bw.cleanup(undefined); });
    });

    it('cleans element itself (not just descendants)', function () {
      var h = bw.mount('#app', {
        t: 'div', o: { state: {}, unmount: function () {} }
      });
      var uid = h.uuid;
      assert.ok(bw._handles[uid]);
      bw.cleanup(h.el);
      assert.strictEqual(bw._handles[uid], undefined);
      assert.strictEqual(h.el, null); // handle.el nulled out
    });

  });

  // =======================================================================
  // getHandle
  // =======================================================================

  describe('bw.getHandle', function () {

    it('lookup by UUID string', function () {
      var h = bw.mount('#app', { t: 'div', o: { state: {} } });
      assert.strictEqual(bw.getHandle(h.uuid), h);
    });

    it('lookup by CSS selector (. prefix)', function () {
      bw.mount('#app', {
        t: 'div', a: { class: 'finder_test' }, o: { state: {} }
      });
      var found = bw.getHandle('.finder_test');
      assert.ok(found);
      assert.ok(found.uuid);
    });

    it('returns null for unknown', function () {
      assert.strictEqual(bw.getHandle('.nonexistent_class'), null);
      assert.strictEqual(bw.getHandle('bw_uuid_fake_does_not_exist'), null);
    });

    it('returns null for invalid selector', function () {
      // Invalid CSS selectors should not throw, just return null
      assert.strictEqual(bw.getHandle('$$$invalid!!!'), null);
    });

    it('direct registry lookup', function () {
      var h = bw.hydrate({ t: 'div', o: { state: {} } });
      assert.strictEqual(bw._handles[h.uuid], h);
      assert.strictEqual(bw.getHandle(h.uuid), h);
    });

  });

  // =======================================================================
  // message
  // =======================================================================

  describe('bw.message', function () {

    it('dispatches to component by UUID', function () {
      var h = bw.mount('#app', {
        t: 'div', o: {
          state: { val: 0 },
          methods: { setVal: function (h, v) { h._state.val = v; } }
        }
      });
      var ok = bw.message(h.uuid, 'setVal', 42);
      assert.strictEqual(ok, true);
      assert.strictEqual(h.get('val'), 42);
    });

    it('returns false for unknown target', function () {
      assert.strictEqual(bw.message('bw_uuid_nonexistent', 'foo'), false);
    });

    it('returns false for unknown action', function () {
      var h = bw.mount('#app', { t: 'div', o: { state: {} } });
      assert.strictEqual(bw.message(h.uuid, 'nonexistent'), false);
    });

    it('passes data to method', function () {
      var received = null;
      var h = bw.mount('#app', {
        t: 'div', o: {
          state: {},
          methods: { capture: function (h, data) { received = data; } }
        }
      });
      bw.message(h.uuid, 'capture', { key: 'value' });
      assert.deepStrictEqual(received, { key: 'value' });
    });

    it('works with CSS class selector', function () {
      bw.mount('#app', {
        t: 'div', a: { class: 'my_msg_widget' },
        o: { state: { x: 0 }, methods: { bump: function (h) { h._state.x++; } } }
      });
      var ok = bw.message('.my_msg_widget', 'bump');
      assert.strictEqual(ok, true);
      var h = bw.getHandle('.my_msg_widget');
      assert.strictEqual(h.get('x'), 1);
    });

  });

  // =======================================================================
  // mounted hook lifecycle
  // =======================================================================

  describe('mounted hook lifecycle', function () {

    it('mounted hook receives handle (not element)', function () {
      var receivedArg = null;
      bw.mount('#app', {
        t: 'div', o: {
          state: {},
          mounted: function (arg) { receivedArg = arg; }
        }
      });
      assert.ok(receivedArg);
      assert.ok(receivedArg.uuid, 'should receive handle with uuid');
      assert.ok(typeof receivedArg.get === 'function', 'should receive handle with get()');
    });

    it('mounted fires after DOM insertion (not during hydrate)', function () {
      var h = bw.hydrate({
        t: 'div', o: {
          state: {},
          mounted: function (h) { h.set('fired', true); }
        }
      });
      // After hydrate, mounted hook should NOT have fired
      assert.strictEqual(h.mounted, false);
      assert.strictEqual(h.get('fired'), undefined);
      // After mount, it should fire
      bw.mount('#app', h);
      assert.strictEqual(h.mounted, true);
      assert.strictEqual(h.get('fired'), true);
    });

    it('unmount fires during cleanup', function () {
      var unmountCalled = false;
      var h = bw.mount('#app', {
        t: 'div', o: {
          state: {},
          unmount: function () { unmountCalled = true; }
        }
      });
      assert.strictEqual(unmountCalled, false);
      bw.cleanup(h.el);
      assert.strictEqual(unmountCalled, true);
    });

    it('nested components all get mounted', function () {
      var order = [];
      bw.mount('#app', {
        t: 'div', c: [
          { t: 'span', o: { state: {}, mounted: function () { order.push('child1'); } } },
          { t: 'span', o: { state: {}, mounted: function () { order.push('child2'); } } }
        ],
        o: { state: {}, mounted: function () { order.push('parent'); } }
      });
      assert.ok(order.indexOf('child1') >= 0);
      assert.ok(order.indexOf('child2') >= 0);
      assert.ok(order.indexOf('parent') >= 0);
    });

    it('handle.mounted flag set to true after mount', function () {
      var h = bw.hydrate({ t: 'div', o: { state: {} } });
      assert.strictEqual(h.mounted, false);
      bw.mount('#app', h);
      assert.strictEqual(h.mounted, true);
    });

    it('set/get work on handle state', function () {
      var h = bw.mount('#app', { t: 'div', o: { state: { count: 0 } } });
      assert.strictEqual(h.get('count'), 0);
      h.set('count', 5);
      assert.strictEqual(h.get('count'), 5);
    });

    it('getState returns clone', function () {
      var h = bw.mount('#app', { t: 'div', o: { state: { a: 1, b: 2 } } });
      var state = h.getState();
      assert.strictEqual(state.a, 1);
      assert.strictEqual(state.b, 2);
      // Modifying clone should not affect original
      state.a = 99;
      assert.strictEqual(h.get('a'), 1);
    });

    it('methods receive handle as first arg, plus user args', function () {
      var capturedArgs = [];
      var h = bw.mount('#app', {
        t: 'div', o: {
          state: {},
          methods: {
            test: function (handle, x, y) {
              capturedArgs = [handle, x, y];
              return x + y;
            }
          }
        }
      });
      var result = h.test(3, 4);
      assert.strictEqual(result, 7);
      assert.strictEqual(capturedArgs[0], h); // first arg is the handle
      assert.strictEqual(capturedArgs[1], 3);
      assert.strictEqual(capturedArgs[2], 4);
    });

  });

  // =======================================================================
  // inspect
  // =======================================================================

  describe('bw.inspect', function () {

    it('returns handle for component element', function () {
      var h = bw.mount('#app', { t: 'div', o: { state: { x: 1 } } });
      // Suppress console output during inspect
      var origGroup = console.group;
      var origGroupEnd = console.groupEnd;
      var origLog = console.log;
      console.group = function () {};
      console.groupEnd = function () {};
      console.log = function () {};

      var result = bw.inspect(h.el);

      console.group = origGroup;
      console.groupEnd = origGroupEnd;
      console.log = origLog;

      assert.strictEqual(result, h);
    });

    it('returns null for non-component element', function () {
      bw.mount('#app', { t: 'p', c: 'plain text' });
      var p = document.querySelector('#app p');

      var origLog = console.log;
      console.log = function () {};
      var result = bw.inspect(p);
      console.log = origLog;

      assert.strictEqual(result, null);
    });

    it('works with CSS selector', function () {
      bw.mount('#app', {
        t: 'div', a: { class: 'inspect_target' },
        o: { state: { n: 7 } }
      });

      var origGroup = console.group;
      var origGroupEnd = console.groupEnd;
      var origLog = console.log;
      console.group = function () {};
      console.groupEnd = function () {};
      console.log = function () {};

      var result = bw.inspect('.inspect_target');

      console.group = origGroup;
      console.groupEnd = origGroupEnd;
      console.log = origLog;

      assert.ok(result);
      assert.strictEqual(result.get('n'), 7);
    });

    it('works with handle object', function () {
      var h = bw.mount('#app', { t: 'div', o: { state: { v: 42 } } });

      var origGroup = console.group;
      var origGroupEnd = console.groupEnd;
      var origLog = console.log;
      console.group = function () {};
      console.groupEnd = function () {};
      console.log = function () {};

      var result = bw.inspect(h);

      console.group = origGroup;
      console.groupEnd = origGroupEnd;
      console.log = origLog;

      assert.strictEqual(result, h);
    });

    it('returns null for not found', function () {
      var origWarn = console.warn;
      console.warn = function () {};

      var result = bw.inspect('.nonexistent_selector_xyz');

      console.warn = origWarn;

      assert.strictEqual(result, null);
    });

  });

  // =======================================================================
  // deprecation stubs
  // =======================================================================

  describe('deprecation stubs', function () {

    it('bw.component() throws Error', function () {
      assert.throws(function () { bw.component(); }, /removed/i);
    });

    it('bw.renderComponent() throws Error', function () {
      assert.throws(function () { bw.renderComponent(); }, /removed/i);
    });

    it('bw.compile() throws Error', function () {
      assert.throws(function () { bw.compile(); }, /removed/i);
    });

    it('bw.when() throws Error', function () {
      assert.throws(function () { bw.when(); }, /removed/i);
    });

    it('bw.each() throws Error', function () {
      assert.throws(function () { bw.each(); }, /removed/i);
    });

    it('bw.compileProps() throws Error', function () {
      assert.throws(function () { bw.compileProps(); }, /removed/i);
    });

    it('bw.flush() does NOT throw (no-op)', function () {
      assert.doesNotThrow(function () { bw.flush(); });
    });

    it('bw.mount === bw.DOM (alias)', function () {
      assert.strictEqual(bw.mount, bw.DOM);
    });

  });

  // =======================================================================
  // Additional lifecycle integration tests
  // =======================================================================

  describe('lifecycle integration', function () {

    it('pre-hydrated handle mounts correctly', function () {
      var h = bw.hydrate({ t: 'div', o: { state: { x: 1 } } });
      assert.strictEqual(h.mounted, false);
      bw.mount('#app', h);
      assert.strictEqual(h.mounted, true);
      assert.ok(document.querySelector('#app .bw_is_component'));
    });

    it('methods work after mount', function () {
      var h = bw.mount('#app', {
        t: 'div', o: {
          state: { count: 0 },
          methods: { inc: function (h) { h._state.count++; return h._state.count; } }
        }
      });
      assert.strictEqual(h.inc(), 1);
      assert.strictEqual(h.inc(), 2);
      assert.strictEqual(h.get('count'), 2);
    });

    it('methods work before mount (pre-hydrated)', function () {
      var h = bw.hydrate({
        t: 'div', o: {
          state: { items: [] },
          methods: { add: function (h, item) { h._state.items.push(item); } }
        }
      });
      h.add('one');
      h.add('two');
      assert.deepStrictEqual(h.get('items'), ['one', 'two']);
    });

    it('event handlers fire after mount', function () {
      var clicked = false;
      bw.mount('#app', { t: 'button', a: { onclick: function () { clicked = true; } }, c: 'Click' });
      var btn = document.querySelector('#app button');
      btn.click();
      assert.strictEqual(clicked, true);
    });

    it('component discovery via querySelectorAll', function () {
      bw.mount('#app', {
        t: 'div', c: [
          { t: 'span', o: { type: 'widget', state: {} } },
          { t: 'span', o: { type: 'widget', state: {} } }
        ]
      });
      var comps = document.querySelectorAll('.bw_is_component');
      assert.strictEqual(comps.length, 2);
    });

    it('typed component discovery', function () {
      bw.mount('#app', {
        t: 'div', c: [
          { t: 'span', o: { type: 'alpha', state: {} } },
          { t: 'span', o: { type: 'beta', state: {} } }
        ]
      });
      assert.strictEqual(document.querySelectorAll('.bw_is_component_bccl_alpha').length, 1);
      assert.strictEqual(document.querySelectorAll('.bw_is_component_bccl_beta').length, 1);
    });

    it('mix hydrated + plain TACOs in mount', function () {
      var comp = bw.hydrate({ t: 'div', o: { state: { x: 1 } } });
      bw.mount('#app', {
        t: 'div', c: [
          comp,
          { t: 'p', c: 'plain text' },
          { t: 'span', c: 'more plain' }
        ]
      });
      assert.ok(document.querySelector('#app .bw_is_component'));
      assert.ok(document.querySelector('#app p'));
      assert.strictEqual(comp.mounted, true);
    });

    it('handle recovery via UUID after mount', function () {
      var comp = bw.hydrate({ t: 'div', o: { state: { v: 42 } } });
      bw.mount('#app', { t: 'div', c: [comp, { t: 'p', c: 'sibling' }] });
      var recovered = bw.getHandle(comp.uuid);
      assert.strictEqual(recovered, comp);
      assert.strictEqual(recovered.get('v'), 42);
    });

    it('handle recovery via CSS class after mount', function () {
      bw.mount('#app', {
        t: 'div', c: {
          t: 'span', a: { class: 'my_lookup_thing' }, o: { state: { n: 7 } }
        }
      });
      var h = bw.getHandle('.my_lookup_thing');
      assert.ok(h);
      assert.strictEqual(h.get('n'), 7);
    });

    it('cleanup idempotent (double cleanup does not throw)', function () {
      var count = 0;
      var h = bw.mount('#app', {
        t: 'div', o: { state: {}, unmount: function () { count++; } }
      });
      bw.cleanup(h.el);
      // second cleanup on the now-nulled handle
      bw.cleanup(h.el);
      assert.strictEqual(count, 1);
    });

    it('replace with new content cleans old, mounts new', function () {
      var oldUnmounted = false;
      var newMounted = false;
      bw.mount('#app', {
        t: 'div', o: { state: {}, unmount: function () { oldUnmounted = true; } }
      });
      bw.mount('#app', {
        t: 'div', o: { state: {}, mounted: function () { newMounted = true; } }
      });
      assert.strictEqual(oldUnmounted, true);
      assert.strictEqual(newMounted, true);
    });

    it('raw() content inside TACO via hydrate', function () {
      var result = bw.hydrate({ t: 'div', c: bw.raw('<em>italic</em>') });
      assert.strictEqual(result.el.innerHTML, '<em>italic</em>');
    });

    it('raw() mixed with TACO in array content', function () {
      var result = bw.hydrate({ t: 'div', c: [bw.raw('<b>a</b>'), { t: 'span', c: 'b' }] });
      assert.ok(result.el.innerHTML.indexOf('<b>a</b>') >= 0);
      assert.ok(result.el.querySelector('span'));
    });

    it('nested TACOs hydrate correctly', function () {
      var result = bw.hydrate({ t: 'div', c: [{ t: 'span', c: 'inner' }] });
      assert.strictEqual(result.el.childNodes.length, 1);
      assert.strictEqual(result.el.firstChild.tagName, 'SPAN');
    });

    it('DOM returns null for invalid target', function () {
      var result = bw.DOM('#nonexistent_target_xyz', { t: 'div' });
      assert.strictEqual(result, null);
    });

  });

});
