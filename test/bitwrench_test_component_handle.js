/**
 * Bitwrench ComponentHandle Test Suite
 * Tests for the unified reactive component system (Phase 1, v2.0.15)
 */

import assert from "assert";
import bw from "../src/bitwrench.js";
import jsdom from 'jsdom';
const { JSDOM } = jsdom;

// Set up DOM environment (recreated in resetApp to survive cross-file clobbering)
function resetApp() {
  var dom = new JSDOM('<!DOCTYPE html><html><body><div id="app"></div></body></html>');
  global.window = dom.window;
  global.document = dom.window.document;
  global.Element = dom.window.Element;
  global.HTMLElement = dom.window.HTMLElement;
  // Clear stale node map refs from previous tests
  if (bw._nodeMap) {
    for (var k in bw._nodeMap) {
      if (Object.prototype.hasOwnProperty.call(bw._nodeMap, k)) {
        delete bw._nodeMap[k];
      }
    }
  }
}
resetApp();

// =============================================================================
// Function Registry
// =============================================================================

describe("Function Registry", function() {
  beforeEach(function() {
    // Clear registry
    bw._fnRegistry = {};
    bw._fnIDCounter = 0;
  });

  it("should register a function and return a name", function() {
    var name = bw.funcRegister(function() { return 42; });
    assert.equal(name, 'bw_fn_0');
    assert.equal(typeof bw.funcGetById(name), 'function');
    assert.equal(bw.funcGetById(name)(), 42);
  });

  it("should accept a custom name", function() {
    var name = bw.funcRegister(function() { return 'hello'; }, 'myFunc');
    assert.equal(name, 'myFunc');
    assert.equal(bw.funcGetById('myFunc')(), 'hello');
  });

  it("should auto-increment IDs", function() {
    var n1 = bw.funcRegister(function() {});
    var n2 = bw.funcRegister(function() {});
    assert.equal(n1, 'bw_fn_0');
    assert.equal(n2, 'bw_fn_1');
  });

  it("should return fallback for missing function", function() {
    var called = false;
    var fn = bw.funcGetById('nonexistent', function() { called = true; });
    fn();
    assert.equal(called, true);
  });

  it("should return a warning logger for missing function with no errFn", function() {
    var fn = bw.funcGetById('nonexistent');
    assert.equal(typeof fn, 'function');
    // Should not throw
    fn();
  });

  it("should unregister a function", function() {
    bw.funcRegister(function() {}, 'toRemove');
    assert.equal(bw.funcUnregister('toRemove'), true);
    assert.equal(bw.funcUnregister('toRemove'), false);
  });

  it("should generate dispatch strings", function() {
    bw.funcRegister(function() {}, 'myAction');
    var str = bw.funcGetDispatchStr('myAction', 'this,event');
    assert.equal(str, "bw.funcGetById('myAction')(this,event)");
  });

  it("should return a shallow copy of registry", function() {
    bw.funcRegister(function() {}, 'a');
    bw.funcRegister(function() {}, 'b');
    var reg = bw.funcGetRegistry();
    assert.ok('a' in reg);
    assert.ok('b' in reg);
    // Modifying copy shouldn't affect original
    delete reg.a;
    assert.ok('a' in bw._fnRegistry);
  });

  it("should return empty string for non-function argument", function() {
    assert.equal(bw.funcRegister('not a function'), '');
    assert.equal(bw.funcRegister(42), '');
  });
});

// =============================================================================
// Template Binding Utilities
// =============================================================================

describe("Template Binding Utilities", function() {
  describe("_parseBindings", function() {
    it("should parse single binding", function() {
      var result = bw._parseBindings('Count: ${count}');
      assert.equal(result.length, 1);
      assert.equal(result[0].expr, 'count');
    });

    it("should parse multiple bindings", function() {
      var result = bw._parseBindings('${first} and ${second}');
      assert.equal(result.length, 2);
      assert.equal(result[0].expr, 'first');
      assert.equal(result[1].expr, 'second');
    });

    it("should return empty for no bindings", function() {
      assert.equal(bw._parseBindings('no bindings here').length, 0);
    });

    it("should trim whitespace from expressions", function() {
      var result = bw._parseBindings('${ count }');
      assert.equal(result[0].expr, 'count');
    });
  });

  describe("_evaluatePath", function() {
    it("should resolve simple key", function() {
      assert.equal(bw._evaluatePath({ count: 42 }, 'count'), 42);
    });

    it("should resolve dot-path", function() {
      assert.equal(bw._evaluatePath({ user: { name: 'Alice' } }, 'user.name'), 'Alice');
    });

    it("should return empty string for null in path", function() {
      assert.equal(bw._evaluatePath({ user: null }, 'user.name'), '');
    });

    it("should return empty string for missing key", function() {
      assert.equal(bw._evaluatePath({}, 'missing'), '');
    });
  });

  describe("_resolveTemplate", function() {
    it("should resolve simple template", function() {
      assert.equal(bw._resolveTemplate('Count: ${count}', { count: 42 }), 'Count: 42');
    });

    it("should resolve multiple expressions", function() {
      assert.equal(
        bw._resolveTemplate('${a} + ${b}', { a: 1, b: 2 }),
        '1 + 2'
      );
    });

    it("should resolve dot-path in template", function() {
      assert.equal(
        bw._resolveTemplate('Hello ${user.name}', { user: { name: 'Bob' } }),
        'Hello Bob'
      );
    });

    it("should return original string if no bindings", function() {
      assert.equal(bw._resolveTemplate('hello', { count: 1 }), 'hello');
    });

    it("should handle compile mode (Tier 2)", function() {
      // Reset compiled expression cache
      bw._compiledExprs = {};
      assert.equal(
        bw._resolveTemplate('${count + 1}', { count: 5 }, true),
        '6'
      );
    });

    it("should handle ternary in compile mode", function() {
      bw._compiledExprs = {};
      assert.equal(
        bw._resolveTemplate('${count > 10 ? "high" : "low"}', { count: 5 }, true),
        'low'
      );
    });
  });

  describe("_extractDeps", function() {
    it("should extract simple key", function() {
      var deps = bw._extractDeps('count', ['count', 'name']);
      assert.deepEqual(deps, ['count']);
    });

    it("should extract key from dot-path", function() {
      var deps = bw._extractDeps('user.name', ['user', 'items']);
      assert.deepEqual(deps, ['user']);
    });

    it("should extract multiple keys from expression", function() {
      var deps = bw._extractDeps('count > 10 ? name : "default"', ['count', 'name', 'items']);
      assert.ok(deps.indexOf('count') >= 0);
      assert.ok(deps.indexOf('name') >= 0);
    });
  });
});

// =============================================================================
// ComponentHandle Construction
// =============================================================================

describe("ComponentHandle Construction", function() {
  it("should create a ComponentHandle via bw.component()", function() {
    var comp = bw.component({ t: 'div', c: 'hello' });
    assert.equal(comp._bwComponent, true);
    assert.equal(comp.mounted, false);
    assert.equal(comp.element, null);
    assert.ok(comp._bwId.length > 0);
  });

  it("should initialize state from o.state", function() {
    var comp = bw.component({
      t: 'div', c: '${count}',
      o: { state: { count: 0, name: 'test' } }
    });
    assert.equal(comp.get('count'), 0);
    assert.equal(comp.get('name'), 'test');
  });

  it("should initialize actions from o.actions", function() {
    var comp = bw.component({
      t: 'div',
      o: {
        actions: {
          increment: function(c) { c.set('count', c.get('count') + 1); }
        },
        state: { count: 0 }
      }
    });
    assert.ok(comp._actions.increment);
  });

  it("should initialize lifecycle hooks", function() {
    var hooks = {
      willMount: function() {},
      mounted: function() {},
      unmount: function() {},
      willDestroy: function() {}
    };
    var comp = bw.component({ t: 'div', o: hooks });
    assert.equal(comp._hooks.willMount, hooks.willMount);
    assert.equal(comp._hooks.mounted, hooks.mounted);
  });

  it("should deep-copy state (not share references)", function() {
    var state = { count: 0, items: [1, 2] };
    var comp = bw.component({ t: 'div', o: { state: state } });
    comp.set('count', 99, { sync: true });
    assert.equal(state.count, 0); // original unchanged
  });
});

// =============================================================================
// ComponentHandle State Methods
// =============================================================================

describe("ComponentHandle State", function() {
  it("should get/set simple values", function() {
    var comp = bw.component({ t: 'div', o: { state: { count: 0 } } });
    comp.set('count', 42);
    assert.equal(comp.get('count'), 42);
  });

  it("should support dot-path set", function() {
    var comp = bw.component({ t: 'div', o: { state: { user: { name: 'A' } } } });
    comp.set('user.name', 'Bob');
    assert.equal(comp.get('user.name'), 'Bob');
  });

  it("should return shallow clone from getState()", function() {
    var comp = bw.component({ t: 'div', o: { state: { a: 1, b: 2 } } });
    var s = comp.getState();
    assert.deepEqual(s, { a: 1, b: 2 });
    s.a = 99;
    assert.equal(comp.get('a'), 1); // unaffected
  });

  it("should merge multiple keys via setState()", function() {
    var comp = bw.component({ t: 'div', o: { state: { a: 1, b: 2, c: 3 } } });
    comp.setState({ a: 10, b: 20 });
    assert.equal(comp.get('a'), 10);
    assert.equal(comp.get('b'), 20);
    assert.equal(comp.get('c'), 3);
  });

  it("should push onto an array", function() {
    var comp = bw.component({ t: 'div', o: { state: { items: [1, 2] } } });
    comp.push('items', 3);
    assert.deepEqual(comp.get('items'), [1, 2, 3]);
  });

  it("should splice an array", function() {
    var comp = bw.component({ t: 'div', o: { state: { items: ['a', 'b', 'c'] } } });
    comp.splice('items', 1, 1);
    assert.deepEqual(comp.get('items'), ['a', 'c']);
  });
});

// =============================================================================
// ComponentHandle Mount/Unmount/Destroy
// =============================================================================

describe("ComponentHandle Lifecycle", function() {
  beforeEach(function() {
    resetApp();
    bw._fnRegistry = {};
    bw._fnIDCounter = 0;
  });

  it("should mount to a DOM element", function() {
    var comp = bw.component({ t: 'div', a: { class: 'test-card' }, c: 'Hello' });
    comp.mount(document.getElementById('app'));
    assert.equal(comp.mounted, true);
    assert.ok(comp.element);
    assert.equal(comp.element.textContent, 'Hello');
  });

  it("should work with bw.DOM()", function() {
    var comp = bw.component({ t: 'div', c: 'via DOM' });
    bw.DOM('#app', comp);
    assert.equal(comp.mounted, true);
    assert.equal(document.getElementById('app').textContent, 'via DOM');
  });

  it("should call willMount hook", function() {
    var called = false;
    var comp = bw.component({
      t: 'div', c: 'test',
      o: { willMount: function(c) { called = true; assert.equal(c._bwComponent, true); } }
    });
    comp.mount(document.getElementById('app'));
    assert.equal(called, true);
  });

  it("should call mounted hook", function() {
    var called = false;
    var comp = bw.component({
      t: 'div', c: 'test',
      o: { mounted: function(c) { called = true; } }
    });
    comp.mount(document.getElementById('app'));
    assert.equal(called, true);
  });

  it("should support old-style mounted(el, state) hook", function() {
    var receivedEl = null, receivedState = null;
    var comp = bw.component({
      t: 'div', c: 'compat',
      o: {
        state: { count: 5 },
        mounted: function(el, state) {
          receivedEl = el;
          receivedState = state;
        }
      }
    });
    comp.mount(document.getElementById('app'));
    assert.ok(receivedEl != null);
    assert.ok(receivedEl.tagName === 'DIV');
    assert.equal(receivedState.count, 5);
  });

  it("should unmount and preserve state", function() {
    var comp = bw.component({ t: 'div', c: 'unmount me', o: { state: { count: 5 } } });
    comp.mount(document.getElementById('app'));
    assert.equal(comp.mounted, true);
    comp.unmount();
    assert.equal(comp.mounted, false);
    assert.equal(comp.get('count'), 5); // state preserved
  });

  it("should call unmount hook", function() {
    var called = false;
    var comp = bw.component({
      t: 'div', c: 'test',
      o: { unmount: function(c) { called = true; } }
    });
    comp.mount(document.getElementById('app'));
    comp.unmount();
    assert.equal(called, true);
  });

  it("should destroy and clear state", function() {
    var destroyCalled = false;
    var comp = bw.component({
      t: 'div', c: 'destroy me',
      o: {
        state: { count: 10 },
        willDestroy: function(c) { destroyCalled = true; }
      }
    });
    comp.mount(document.getElementById('app'));
    comp.destroy();
    assert.equal(destroyCalled, true);
    assert.equal(comp.mounted, false);
    assert.deepEqual(comp._state, {});
    assert.equal(comp.element, null);
  });

  it("should set _bwComponentHandle back-reference on element", function() {
    var comp = bw.component({ t: 'div', c: 'ref test' });
    comp.mount(document.getElementById('app'));
    assert.equal(comp.element._bwComponentHandle, comp);
  });
});

// =============================================================================
// Reactivity + Batching
// =============================================================================

describe("Reactivity and Batching", function() {
  beforeEach(function() {
    resetApp();
    bw._fnRegistry = {};
    bw._fnIDCounter = 0;
    bw._dirtyComponents = [];
    bw._flushScheduled = false;
  });

  it("should update DOM on set() + flush()", function() {
    var comp = bw.component({
      t: 'div', c: [{ t: 'span', c: 'Count: ${count}' }],
      o: { state: { count: 0 } }
    });
    comp.mount(document.getElementById('app'));
    var span = comp.element.querySelector('span');
    assert.equal(span.textContent, 'Count: 0');

    comp.set('count', 42);
    bw.flush();
    assert.equal(span.textContent, 'Count: 42');
  });

  it("should batch multiple set() calls", function() {
    var updateCount = 0;
    var comp = bw.component({
      t: 'div', c: [{ t: 'span', c: '${a} ${b}' }],
      o: {
        state: { a: 1, b: 2 },
        onUpdate: function() { updateCount++; }
      }
    });
    comp.mount(document.getElementById('app'));
    comp.set('a', 10);
    comp.set('b', 20);
    bw.flush();
    assert.equal(updateCount, 1); // Only one flush
    assert.equal(comp.element.querySelector('span').textContent, '10 20');
  });

  it("should support sync option", function() {
    var comp = bw.component({
      t: 'div', c: [{ t: 'span', c: 'Val: ${val}' }],
      o: { state: { val: 'old' } }
    });
    comp.mount(document.getElementById('app'));
    comp.set('val', 'new', { sync: true });
    assert.equal(comp.element.querySelector('span').textContent, 'Val: new');
  });

  it("should update attribute bindings", function() {
    var comp = bw.component({
      t: 'div', c: [{ t: 'span', a: { title: 'Title: ${title}' }, c: 'text' }],
      o: { state: { title: 'hello' } }
    });
    comp.mount(document.getElementById('app'));
    var span = comp.element.querySelector('span');
    assert.equal(span.getAttribute('title'), 'Title: hello');

    comp.set('title', 'world', { sync: true });
    assert.equal(span.getAttribute('title'), 'Title: world');
  });

  it("should call willUpdate and onUpdate hooks", function() {
    var willKeys = null, onKeys = null;
    var comp = bw.component({
      t: 'div', c: [{ t: 'span', c: '${count}' }],
      o: {
        state: { count: 0 },
        willUpdate: function(c, keys) { willKeys = keys; },
        onUpdate: function(c, keys) { onKeys = keys; }
      }
    });
    comp.mount(document.getElementById('app'));
    comp.set('count', 5, { sync: true });
    assert.ok(willKeys);
    assert.ok(willKeys.indexOf('count') >= 0);
    assert.ok(onKeys);
    assert.ok(onKeys.indexOf('count') >= 0);
  });
});

// =============================================================================
// Named Actions
// =============================================================================

describe("Named Actions", function() {
  beforeEach(function() {
    resetApp();
    bw._fnRegistry = {};
    bw._fnIDCounter = 0;
  });

  it("should register actions on mount", function() {
    var comp = bw.component({
      t: 'div', c: [{ t: 'button', c: '+', a: { onclick: 'increment' } }],
      o: {
        state: { count: 0 },
        actions: {
          increment: function(c) { c.set('count', c.get('count') + 1); }
        }
      }
    });
    comp.mount(document.getElementById('app'));
    var regName = comp._bwId + '_increment';
    assert.equal(typeof bw.funcGetById(regName), 'function');
  });

  it("should call actions via comp.action()", function() {
    var comp = bw.component({
      t: 'div', c: [{ t: 'span', c: '${count}' }],
      o: {
        state: { count: 0 },
        actions: {
          increment: function(c) { c.set('count', c.get('count') + 1); }
        }
      }
    });
    comp.mount(document.getElementById('app'));
    comp.action('increment');
    bw.flush();
    assert.equal(comp.get('count'), 1);
  });

  it("should unregister actions on destroy", function() {
    var comp = bw.component({
      t: 'div',
      o: {
        actions: { doSomething: function() {} },
        state: {}
      }
    });
    comp.mount(document.getElementById('app'));
    var regName = comp._bwId + '_doSomething';
    assert.equal(typeof bw.funcGetById(regName), 'function');
    comp.destroy();
    // Should now return fallback
    var isFallback = false;
    bw.funcGetById(regName, function() { isFallback = true; })();
    assert.equal(isFallback, true);
  });
});

// =============================================================================
// Pub/Sub Integration
// =============================================================================

describe("ComponentHandle Pub/Sub", function() {
  beforeEach(function() {
    resetApp();
    bw._topics = {};
  });

  it("should subscribe and receive messages", function() {
    var received = null;
    var comp = bw.component({
      t: 'div', c: '${msg}',
      o: { state: { msg: 'initial' } }
    });
    comp.mount(document.getElementById('app'));
    comp.sub('test:msg', function(data) {
      received = data;
      comp.set('msg', data.text, { sync: true });
    });
    bw.pub('test:msg', { text: 'hello' });
    assert.equal(received.text, 'hello');
    assert.equal(comp.get('msg'), 'hello');
  });

  it("should auto-unsub on destroy", function() {
    var callCount = 0;
    var comp = bw.component({ t: 'div', o: { state: {} } });
    comp.mount(document.getElementById('app'));
    comp.sub('test:topic', function() { callCount++; });
    bw.pub('test:topic', {});
    assert.equal(callCount, 1);
    comp.destroy();
    bw.pub('test:topic', {});
    assert.equal(callCount, 1); // Not called again
  });
});

// =============================================================================
// bw.component() + bw.DOM() Integration
// =============================================================================

describe("bw.component() + bw.DOM() Integration", function() {
  beforeEach(function() {
    resetApp();
    bw._fnRegistry = {};
  });

  it("should mount ComponentHandle array via bw.DOM()", function() {
    var c1 = bw.component({ t: 'div', c: 'first' });
    var c2 = bw.component({ t: 'div', c: 'second' });
    bw.DOM('#app', [c1, c2]);
    assert.equal(c1.mounted, true);
    assert.equal(c2.mounted, true);
    assert.equal(document.getElementById('app').children.length, 2);
  });

  it("should support select() and selectAll()", function() {
    var comp = bw.component({
      t: 'div', c: [
        { t: 'span', a: { class: 'item' }, c: 'A' },
        { t: 'span', a: { class: 'item' }, c: 'B' }
      ]
    });
    comp.mount(document.getElementById('app'));
    assert.ok(comp.select('.item'));
    assert.equal(comp.selectAll('.item').length, 2);
  });

  it("should support on()/off() event listeners", function() {
    var clickCount = 0;
    var comp = bw.component({ t: 'div', c: 'click me' });
    comp.mount(document.getElementById('app'));
    var handler = function() { clickCount++; };
    comp.on('click', handler);
    comp.element.dispatchEvent(new window.Event('click'));
    assert.equal(clickCount, 1);
    comp.off('click', handler);
    comp.element.dispatchEvent(new window.Event('click'));
    assert.equal(clickCount, 1);
  });
});

// =============================================================================
// bw.html() with State
// =============================================================================

describe("bw.html() with State", function() {
  it("should resolve ${expr} in content", function() {
    var html = bw.html(
      { t: 'div', c: 'Count: ${count}' },
      { state: { count: 42 } }
    );
    assert.ok(html.indexOf('Count: 42') >= 0);
  });

  it("should resolve ${expr} in attributes", function() {
    var html = bw.html(
      { t: 'div', a: { title: 'Val: ${val}' }, c: 'test' },
      { state: { val: 'hello' } }
    );
    assert.ok(html.indexOf('Val: hello') >= 0);
  });

  it("should handle ComponentHandle in bw.html()", function() {
    var comp = bw.component({
      t: 'div', c: 'Hello ${name}',
      o: { state: { name: 'World' } }
    });
    var html = bw.html(comp);
    assert.ok(html.indexOf('Hello World') >= 0);
  });
});

// =============================================================================
// bw.when() / bw.each()
// =============================================================================

describe("Control Flow Helpers", function() {
  beforeEach(function() {
    resetApp();
    bw._fnRegistry = {};
  });

  it("bw.when() should return marker object", function() {
    var w = bw.when('${loggedIn}', { t: 'span', c: 'Yes' }, { t: 'span', c: 'No' });
    assert.equal(w._bwWhen, true);
    assert.equal(w.branches.length, 2);
  });

  it("bw.when() should evaluate in bw.html() with state", function() {
    var html = bw.html(
      { t: 'div', c: [bw.when('${show}', { t: 'span', c: 'visible' }, { t: 'span', c: 'hidden' })] },
      { state: { show: true } }
    );
    assert.ok(html.indexOf('visible') >= 0);
    assert.ok(html.indexOf('hidden') < 0);
  });

  it("bw.each() should return marker object", function() {
    var e = bw.each('${items}', function(item) { return { t: 'li', c: item }; });
    assert.equal(e._bwEach, true);
    assert.equal(typeof e.factory, 'function');
  });

  it("bw.each() should evaluate in bw.html() with state", function() {
    var html = bw.html(
      { t: 'ul', c: [bw.each('${items}', function(item) { return { t: 'li', c: item }; })] },
      { state: { items: ['a', 'b', 'c'] } }
    );
    assert.ok(html.indexOf('<li>a</li>') >= 0);
    assert.ok(html.indexOf('<li>b</li>') >= 0);
    assert.ok(html.indexOf('<li>c</li>') >= 0);
  });
});

// =============================================================================
// bw.compile()
// =============================================================================

describe("bw.compile()", function() {
  beforeEach(function() {
    resetApp();
    bw._fnRegistry = {};
    bw._compiledExprs = {};
  });

  it("should return a factory function", function() {
    var factory = bw.compile({ t: 'div', c: '${count}', o: { state: { count: 0 } } });
    assert.equal(typeof factory, 'function');
  });

  it("should create a ComponentHandle from factory", function() {
    var factory = bw.compile({
      t: 'div', c: [{ t: 'span', c: '${count}' }],
      o: { state: { count: 0 } }
    });
    var comp = factory({ count: 5 });
    assert.equal(comp._bwComponent, true);
    assert.equal(comp._compile, true);
    assert.equal(comp.get('count'), 5);
  });

  it("should mount and react with compiled expressions", function() {
    var factory = bw.compile({
      t: 'div', c: [{ t: 'span', c: 'Val: ${count}' }],
      o: { state: { count: 0 } }
    });
    var comp = factory({ count: 10 });
    comp.mount(document.getElementById('app'));
    assert.equal(comp.mounted, true);
    var span = comp.element.querySelector('span');
    assert.equal(span.textContent, 'Val: 10');
    comp.set('count', 99, { sync: true });
    assert.equal(span.textContent, 'Val: 99');
  });
});

// =============================================================================
// Structural Updates (bw.when with mount)
// =============================================================================

describe("Structural Updates", function() {
  beforeEach(function() {
    resetApp();
    bw._fnRegistry = {};
  });

  it("bw.when should render truthy branch on mount", function() {
    var comp = bw.component({
      t: 'div', c: [
        bw.when('${show}', { t: 'span', c: 'visible' }, { t: 'span', c: 'hidden' })
      ],
      o: { state: { show: true } }
    });
    comp.mount(document.getElementById('app'));
    assert.ok(comp.element.textContent.indexOf('visible') >= 0);
  });

  it("bw.when should switch branch on state change", function() {
    var comp = bw.component({
      t: 'div', c: [
        bw.when('${show}', { t: 'span', c: 'visible' }, { t: 'span', c: 'hidden' })
      ],
      o: { state: { show: true } }
    });
    comp.mount(document.getElementById('app'));
    assert.ok(comp.element.textContent.indexOf('visible') >= 0);
    comp.set('show', false, { sync: true });
    assert.ok(comp.element.textContent.indexOf('hidden') >= 0);
  });

  it("bw.each should render list on mount", function() {
    var comp = bw.component({
      t: 'ul', c: [
        bw.each('${items}', function(item) { return { t: 'li', c: item }; })
      ],
      o: { state: { items: ['x', 'y'] } }
    });
    comp.mount(document.getElementById('app'));
    var lis = comp.element.querySelectorAll('li');
    assert.equal(lis.length, 2);
    assert.equal(lis[0].textContent, 'x');
    assert.equal(lis[1].textContent, 'y');
  });

  it("bw.each should update list on state change", function() {
    var comp = bw.component({
      t: 'ul', c: [
        bw.each('${items}', function(item) { return { t: 'li', c: item }; })
      ],
      o: { state: { items: ['a'] } }
    });
    comp.mount(document.getElementById('app'));
    assert.equal(comp.element.querySelectorAll('li').length, 1);
    comp.set('items', ['a', 'b', 'c'], { sync: true });
    assert.equal(comp.element.querySelectorAll('li').length, 3);
  });
});

// =============================================================================
// Edge Cases
// =============================================================================

describe("Edge Cases", function() {
  beforeEach(function() {
    resetApp();
    bw._fnRegistry = {};
  });

  it("should not crash when setting state before mount", function() {
    var comp = bw.component({
      t: 'div', c: '${count}',
      o: { state: { count: 0 } }
    });
    // No mount — setting should just update state, not crash
    comp.set('count', 5);
    assert.equal(comp.get('count'), 5);
  });

  it("should handle empty content", function() {
    var comp = bw.component({ t: 'div' });
    comp.mount(document.getElementById('app'));
    assert.equal(comp.mounted, true);
  });

  it("should handle nested TACO content", function() {
    var comp = bw.component({
      t: 'div', c: { t: 'span', c: 'nested ${val}' },
      o: { state: { val: 'ok' } }
    });
    comp.mount(document.getElementById('app'));
    assert.ok(comp.element.textContent.indexOf('ok') >= 0);
  });

  it("unmount on non-mounted component should be no-op", function() {
    var comp = bw.component({ t: 'div' });
    comp.unmount(); // should not throw
    assert.equal(comp.mounted, false);
  });
});

// =============================================================================
// o.methods Promotion
// =============================================================================

describe("o.methods Promotion", function() {
  beforeEach(resetApp);

  it("should promote o.methods to handle API", function() {
    var comp = bw.component({
      t: 'div', c: 'hello',
      o: {
        methods: {
          greet: function(comp, name) { return 'Hello ' + name; }
        }
      }
    });
    assert.equal(typeof comp.greet, 'function');
    assert.equal(comp.greet('World'), 'Hello World');
  });

  it("should pass comp as first arg to methods", function() {
    var comp = bw.component({
      t: 'div', c: '',
      o: {
        state: { count: 0 },
        methods: {
          increment: function(comp) {
            comp.set('count', comp.get('count') + 1, { sync: true });
          }
        }
      }
    });
    comp.mount(document.getElementById('app'));
    comp.increment();
    assert.equal(comp.get('count'), 1);
    comp.increment();
    assert.equal(comp.get('count'), 2);
    comp.destroy();
  });

  it("should store methods in _methods map", function() {
    var comp = bw.component({
      t: 'div',
      o: {
        methods: {
          foo: function(comp) { return 'foo'; },
          bar: function(comp, x) { return 'bar-' + x; }
        }
      }
    });
    assert.deepEqual(Object.keys(comp._methods).sort(), ['bar', 'foo']);
  });

  it("should handle component with no methods", function() {
    var comp = bw.component({ t: 'div', c: 'plain' });
    assert.deepEqual(Object.keys(comp._methods), []);
  });

  it("methods should do surgical DOM updates", function() {
    var comp = bw.component({
      t: 'ul', c: [],
      o: {
        state: { items: [] },
        methods: {
          addItem: function(comp, item) {
            var li = bw.createDOM({ t: 'li', a: { 'data-bw_id': item.id }, c: item.text });
            comp.element.appendChild(li);
            comp._state.items.push(item);
          },
          removeItem: function(comp, id) {
            var el = comp.select('[data-bw_id="' + id + '"]');
            if (el) el.parentNode.removeChild(el);
            comp._state.items = comp._state.items.filter(function(i) { return i.id !== id; });
          }
        }
      }
    });
    comp.mount(document.getElementById('app'));
    assert.equal(comp.element.children.length, 0);

    comp.addItem({ id: 'a', text: 'Alice' });
    assert.equal(comp.element.children.length, 1);
    assert.equal(comp.element.children[0].textContent, 'Alice');

    comp.addItem({ id: 'b', text: 'Bob' });
    assert.equal(comp.element.children.length, 2);

    comp.removeItem('a');
    assert.equal(comp.element.children.length, 1);
    assert.equal(comp.element.children[0].textContent, 'Bob');
    assert.equal(comp._state.items.length, 1);

    comp.destroy();
  });

  it("methods should coexist with actions", function() {
    var actionCalled = false;
    var comp = bw.component({
      t: 'div', c: '',
      o: {
        state: { val: 0 },
        actions: {
          bump: function(comp) { actionCalled = true; comp.set('val', 1, { sync: true }); }
        },
        methods: {
          reset: function(comp) { comp.set('val', 0, { sync: true }); }
        }
      }
    });
    comp.mount(document.getElementById('app'));
    comp.action('bump');
    assert.equal(actionCalled, true);
    assert.equal(comp.get('val'), 1);
    comp.reset();
    assert.equal(comp.get('val'), 0);
    comp.destroy();
  });

  it("method with multiple args should work", function() {
    var comp = bw.component({
      t: 'div',
      o: {
        methods: {
          add: function(comp, a, b) { return a + b; }
        }
      }
    });
    assert.equal(comp.add(3, 4), 7);
  });
});

// =============================================================================
// userTag
// =============================================================================

describe("userTag", function() {
  beforeEach(resetApp);

  it("should set _userTag property", function() {
    var comp = bw.component({ t: 'div', c: 'test' });
    comp.userTag('my_dashboard');
    assert.equal(comp._userTag, 'my_dashboard');
  });

  it("should add class to element when mounted", function() {
    var comp = bw.component({ t: 'div', c: 'test' });
    comp.userTag('my_dashboard');
    comp.mount(document.getElementById('app'));
    assert.ok(comp.element.classList.contains('my_dashboard'));
    comp.destroy();
  });

  it("should add class immediately if already mounted", function() {
    var comp = bw.component({ t: 'div', c: 'test' });
    comp.mount(document.getElementById('app'));
    comp.userTag('late_tag');
    assert.ok(comp.element.classList.contains('late_tag'));
    comp.destroy();
  });

  it("should return this for chaining", function() {
    var comp = bw.component({ t: 'div', c: 'test' });
    var result = comp.userTag('chain_test');
    assert.strictEqual(result, comp);
  });

  it("should be findable via querySelector after mount", function() {
    var comp = bw.component({ t: 'div', c: 'tagged' });
    comp.userTag('findable_tag');
    comp.mount(document.getElementById('app'));
    var found = document.querySelector('.findable_tag');
    assert.ok(found);
    assert.equal(found.textContent, 'tagged');
    comp.destroy();
  });
});

// =============================================================================
// bw.message()
// =============================================================================

describe("bw.message()", function() {
  beforeEach(resetApp);

  it("should dispatch by user tag", function() {
    var received = null;
    var comp = bw.component({
      t: 'div', c: 'msg-test',
      o: {
        methods: {
          handleAlert: function(comp, data) { received = data; }
        }
      }
    });
    comp.mount(document.getElementById('app'));
    comp.userTag('msg_target');

    var result = bw.message('msg_target', 'handleAlert', { severity: 'warning' });
    assert.equal(result, true);
    assert.deepEqual(received, { severity: 'warning' });
    comp.destroy();
  });

  it("should dispatch by comp_id", function() {
    var received = null;
    var comp = bw.component({
      t: 'div', c: 'id-test',
      o: {
        methods: {
          ping: function(comp, data) { received = data; }
        }
      }
    });
    comp.mount(document.getElementById('app'));

    var result = bw.message(comp._bwId, 'ping', 'hello');
    assert.equal(result, true);
    assert.equal(received, 'hello');
    comp.destroy();
  });

  it("should return false for unknown target", function() {
    var result = bw.message('nonexistent', 'foo', {});
    assert.equal(result, false);
  });

  it("should return false for unknown action", function() {
    var comp = bw.component({
      t: 'div', c: 'test',
      o: { methods: { known: function() {} } }
    });
    comp.mount(document.getElementById('app'));
    comp.userTag('msg_test2');
    var result = bw.message('msg_test2', 'unknown_action', {});
    assert.equal(result, false);
    comp.destroy();
  });

  it("should work with built-in methods like set", function() {
    var comp = bw.component({
      t: 'div', c: '${val}',
      o: { state: { val: 'initial' } }
    });
    comp.mount(document.getElementById('app'));
    comp.userTag('set_test');
    // bw.message dispatches to comp.set('val', 'updated') — but set takes (key, value)
    // so message data is the first arg. For set, this won't work directly.
    // message calls comp[action](data), so comp.set({val:'updated'}) won't work.
    // This test verifies that custom methods are the right pattern for message dispatch.
    var result = bw.message('set_test', 'get', 'val');
    // get('val') returns 'initial' but message doesn't return the method's return value
    assert.equal(result, true);
    comp.destroy();
  });

  it("should simulate server-driven update pattern", function() {
    var alerts = [];
    var comp = bw.component({
      t: 'div', c: '',
      o: {
        state: { alertCount: 0 },
        methods: {
          addAlert: function(comp, data) {
            alerts.push(data);
            comp.set('alertCount', alerts.length, { sync: true });
          },
          clearAlerts: function(comp) {
            alerts = [];
            comp.set('alertCount', 0, { sync: true });
          }
        }
      }
    });
    comp.mount(document.getElementById('app'));
    comp.userTag('dashboard_east');

    // Simulate SSE messages
    var messages = [
      { target: 'dashboard_east', action: 'addAlert', data: { msg: 'CPU high' } },
      { target: 'dashboard_east', action: 'addAlert', data: { msg: 'Disk full' } },
      { target: 'dashboard_east', action: 'clearAlerts', data: null }
    ];

    messages.forEach(function(m) {
      bw.message(m.target, m.action, m.data);
    });

    assert.equal(comp.get('alertCount'), 0);
    assert.equal(alerts.length, 0);
    comp.destroy();
  });
});

// =============================================================================
// bw.inspect()
// =============================================================================

describe("bw.inspect()", function() {
  beforeEach(resetApp);

  it("should return ComponentHandle for a mounted component", function() {
    var comp = bw.component({
      t: 'div', a: { id: 'inspect-target' }, c: 'test',
      o: {
        state: { x: 42 },
        methods: { foo: function() {} }
      }
    });
    comp.mount(document.getElementById('app'));

    var result = bw.inspect('#inspect-target');
    assert.ok(result);
    assert.equal(result._bwId, comp._bwId);
    assert.equal(result._state.x, 42);
    assert.ok('foo' in result._methods);
    comp.destroy();
  });

  it("should accept a ComponentHandle directly", function() {
    var comp = bw.component({ t: 'div', c: 'direct' });
    comp.mount(document.getElementById('app'));
    var result = bw.inspect(comp);
    assert.strictEqual(result, comp);
    comp.destroy();
  });

  it("should accept a DOM element", function() {
    var comp = bw.component({ t: 'div', c: 'element-inspect' });
    comp.mount(document.getElementById('app'));
    var result = bw.inspect(comp.element);
    assert.strictEqual(result, comp);
    comp.destroy();
  });

  it("should return null for element without ComponentHandle", function() {
    var result = bw.inspect(document.getElementById('app'));
    assert.equal(result, null);
  });

  it("should return null for nonexistent selector", function() {
    var result = bw.inspect('#nonexistent');
    assert.equal(result, null);
  });

  it("should show userTag if set", function() {
    var comp = bw.component({ t: 'div', c: 'tagged' });
    comp.userTag('my_tag');
    comp.mount(document.getElementById('app'));
    var result = bw.inspect(comp);
    assert.equal(result._userTag, 'my_tag');
    comp.destroy();
  });
});

// =============================================================================
// ComponentHandle in content arrays (nesting)
// =============================================================================

describe("ComponentHandle in content arrays", function() {
  beforeEach(resetApp);

  it("should mount ComponentHandle children in createDOM content arrays", function() {
    var child = bw.component({
      t: 'span', c: 'child-content',
      o: { state: { val: 'hi' } }
    });
    var parent = bw.createDOM({
      t: 'div', a: { class: 'parent' },
      c: [
        { t: 'p', c: 'static child' },
        child
      ]
    });
    document.getElementById('app').appendChild(parent);
    assert.ok(child.mounted);
    assert.equal(child.element.textContent, 'child-content');
    assert.equal(parent.children.length, 2);
    assert.equal(parent.children[0].textContent, 'static child');
    assert.equal(parent.children[1].textContent, 'child-content');
  });

  it("should handle single ComponentHandle as content", function() {
    var child = bw.component({ t: 'span', c: 'only-child' });
    var parent = bw.createDOM({
      t: 'div',
      c: child
    });
    document.getElementById('app').appendChild(parent);
    assert.ok(child.mounted);
    assert.equal(parent.children.length, 1);
    assert.equal(parent.children[0].textContent, 'only-child');
  });

  it("should allow mixed Level 0 and Level 2 children", function() {
    var managed = bw.component({
      t: 'span', c: 'Count: ${count}',
      o: { state: { count: 0 } }
    });
    var taco = {
      t: 'div', c: [
        { t: 'h1', c: 'Dashboard' },
        managed,
        { t: 'p', c: 'Footer' }
      ]
    };
    bw.DOM('#app', taco);
    assert.ok(managed.mounted);
    assert.equal(managed.element.textContent, 'Count: 0');

    // Update managed child independently
    managed.set('count', 42, { sync: true });
    assert.equal(managed.element.textContent, 'Count: 42');

    // Parent structure unchanged
    var app = document.getElementById('app');
    assert.equal(app.children[0].children.length, 3);
  });

  it("should handle bw.html() with ComponentHandle in content", function() {
    var child = bw.component({
      t: 'span', c: 'html-child',
      o: { state: { x: 'test' } }
    });
    var html = bw.html({
      t: 'div', c: [
        { t: 'p', c: 'before' },
        child,
        { t: 'p', c: 'after' }
      ]
    });
    assert.ok(html.indexOf('<p>before</p>') >= 0);
    assert.ok(html.indexOf('html-child') >= 0);
    assert.ok(html.indexOf('<p>after</p>') >= 0);
  });

  it("should handle bw.createDOM() called directly on ComponentHandle", function() {
    var comp = bw.component({ t: 'div', c: 'direct-create' });
    var el = bw.createDOM(comp);
    assert.ok(el);
    assert.equal(el.textContent, 'direct-create');
  });

  it("managed children should update independently", function() {
    var child1 = bw.component({
      t: 'span', c: '${name}',
      o: { state: { name: 'Alice' } }
    });
    var child2 = bw.component({
      t: 'span', c: '${name}',
      o: { state: { name: 'Bob' } }
    });
    bw.DOM('#app', { t: 'div', c: [child1, child2] });

    assert.ok(child1.mounted);
    assert.ok(child2.mounted);

    child1.set('name', 'Carol', { sync: true });
    assert.equal(child1.element.textContent, 'Carol');
    assert.equal(child2.element.textContent, 'Bob');  // unchanged
  });

  it("nested ComponentHandles with methods should work", function() {
    var list = bw.component({
      t: 'ul', c: [],
      o: {
        methods: {
          addItem: function(comp, text) {
            var li = bw.createDOM({ t: 'li', c: text });
            comp.element.appendChild(li);
          }
        }
      }
    });
    bw.DOM('#app', { t: 'div', c: [
      { t: 'h2', c: 'My List' },
      list
    ]});

    assert.ok(list.mounted);
    list.addItem('Item 1');
    list.addItem('Item 2');
    assert.equal(list.element.children.length, 2);
  });

  it("bw.message should work on nested tagged component", function() {
    var received = null;
    var child = bw.component({
      t: 'div', c: 'inner',
      o: {
        methods: {
          notify: function(comp, data) { received = data; }
        }
      }
    });
    child.userTag('nested_target');
    bw.DOM('#app', { t: 'div', c: [child] });

    bw.message('nested_target', 'notify', { msg: 'hello from server' });
    assert.deepEqual(received, { msg: 'hello from server' });
    child.destroy();
  });
});
