/**
 * Bitwrench v2 Pub/Sub Test Suite
 * Tests for bw.pub(), bw.sub(), bw.unsub() and lifecycle integration
 */

import assert from "assert";
import bw from "../src/bitwrench.js";
import jsdom from 'jsdom';
const { JSDOM } = jsdom;

// Set up DOM environment
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.window = dom.window;
global.document = window.document;
global.Element = window.Element;
global.CustomEvent = window.CustomEvent;

// Reset topics between tests
beforeEach(function() {
  bw._topics = {};
  bw._subIdCounter = 0;
});

describe("bw.pub()", function() {
  it("should return 0 when no subscribers exist", function() {
    assert.equal(bw.pub('noone', { x: 1 }), 0);
  });

  it("should call all subscribers and return count", function() {
    var calls = [];
    bw.sub('test', function(d) { calls.push('a:' + d); });
    bw.sub('test', function(d) { calls.push('b:' + d); });
    var count = bw.pub('test', 42);
    assert.equal(count, 2);
    assert.deepEqual(calls, ['a:42', 'b:42']);
  });

  it("should pass detail to subscribers", function() {
    var received = null;
    bw.sub('detail', function(d) { received = d; });
    bw.pub('detail', { name: 'hello', value: 99 });
    assert.deepEqual(received, { name: 'hello', value: 99 });
  });

  it("should continue calling remaining subscribers after error", function() {
    var calls = [];
    bw.sub('err', function() { calls.push('first'); });
    bw.sub('err', function() { throw new Error('boom'); });
    bw.sub('err', function() { calls.push('third'); });

    // Suppress console.warn during test
    var origWarn = console.warn;
    var warned = false;
    console.warn = function() { warned = true; };

    var count = bw.pub('err', null);

    console.warn = origWarn;

    assert.equal(count, 2);  // first and third succeeded
    assert.deepEqual(calls, ['first', 'third']);
    assert.equal(warned, true);
  });

  it("should handle unsub during iteration (snapshot)", function() {
    var calls = [];
    var unsub2;
    bw.sub('snap', function() { calls.push('a'); unsub2(); });
    unsub2 = bw.sub('snap', function() { calls.push('b'); });
    bw.sub('snap', function() { calls.push('c'); });

    bw.pub('snap');
    // 'a' calls unsub2, but because of snapshot, 'b' still runs
    assert.deepEqual(calls, ['a', 'b', 'c']);
  });

  it("should call subscribers in registration order", function() {
    var order = [];
    bw.sub('order', function() { order.push(1); });
    bw.sub('order', function() { order.push(2); });
    bw.sub('order', function() { order.push(3); });
    bw.pub('order');
    assert.deepEqual(order, [1, 2, 3]);
  });
});

describe("bw.sub()", function() {
  it("should return an unsub function", function() {
    var unsub = bw.sub('test', function() {});
    assert.equal(typeof unsub, 'function');
  });

  it("should remove subscription when unsub is called", function() {
    var called = false;
    var unsub = bw.sub('rm', function() { called = true; });
    unsub();
    bw.pub('rm');
    assert.equal(called, false);
  });

  it("should clean empty topic arrays after unsub", function() {
    var unsub = bw.sub('empty', function() {});
    unsub();
    assert.equal(bw._topics['empty'], undefined);
  });

  it("should support multiple subs on same topic", function() {
    var count = 0;
    bw.sub('multi', function() { count++; });
    bw.sub('multi', function() { count++; });
    bw.sub('multi', function() { count++; });
    bw.pub('multi');
    assert.equal(count, 3);
  });

  it("should support same handler on multiple topics", function() {
    var calls = [];
    var handler = function(d) { calls.push(d); };
    bw.sub('topicA', handler);
    bw.sub('topicB', handler);
    bw.pub('topicA', 'a');
    bw.pub('topicB', 'b');
    assert.deepEqual(calls, ['a', 'b']);
  });

  it("should not interfere between different topics", function() {
    var aCalls = 0, bCalls = 0;
    bw.sub('alpha', function() { aCalls++; });
    bw.sub('beta', function() { bCalls++; });
    bw.pub('alpha');
    assert.equal(aCalls, 1);
    assert.equal(bCalls, 0);
  });
});

describe("bw.unsub()", function() {
  it("should remove by handler reference", function() {
    var called = false;
    var handler = function() { called = true; };
    bw.sub('ref', handler);
    var removed = bw.unsub('ref', handler);
    assert.equal(removed, 1);
    bw.pub('ref');
    assert.equal(called, false);
  });

  it("should remove all instances of same handler on topic", function() {
    var handler = function() {};
    bw.sub('dup', handler);
    bw.sub('dup', handler);
    bw.sub('dup', handler);
    var removed = bw.unsub('dup', handler);
    assert.equal(removed, 3);
    assert.equal(bw._topics['dup'], undefined);
  });

  it("should return 0 for unknown topic", function() {
    assert.equal(bw.unsub('nope', function() {}), 0);
  });

  it("should return 0 for unknown handler", function() {
    bw.sub('known', function() {});
    assert.equal(bw.unsub('known', function() {}), 0);
  });

  it("should clean empty topic arrays", function() {
    var handler = function() {};
    bw.sub('clean', handler);
    bw.unsub('clean', handler);
    assert.equal(bw._topics['clean'], undefined);
  });
});

describe("Lifecycle integration", function() {
  it("should store unsub in el._bw_subs when element is provided", function() {
    var el = document.createElement('div');
    bw.sub('life', function() {}, el);
    assert.ok(Array.isArray(el._bw_subs));
    assert.equal(el._bw_subs.length, 1);
    assert.equal(typeof el._bw_subs[0], 'function');
  });

  it("should set data-bw_id on element if not present", function() {
    var el = document.createElement('div');
    bw.sub('life2', function() {}, el);
    assert.ok(el.getAttribute('data-bw_id'));
    assert.ok(el.getAttribute('data-bw_id').indexOf('bw_sub_') === 0);
  });

  it("should not overwrite existing data-bw_id", function() {
    var el = document.createElement('div');
    el.setAttribute('data-bw_id', 'my-existing-id');
    bw.sub('life3', function() {}, el);
    assert.equal(el.getAttribute('data-bw_id'), 'my-existing-id');
  });

  it("should remove subscriptions on bw.cleanup()", function() {
    var el = document.createElement('div');
    el.setAttribute('data-bw_id', 'cleanup-test');
    document.body.appendChild(el);

    var called = false;
    bw.sub('cleanup', function() { called = true; }, el);

    bw.cleanup(el);
    bw.pub('cleanup');
    assert.equal(called, false);

    document.body.removeChild(el);
  });

  it("should preserve mount element subs across bw.DOM() re-render", function() {
    // bw.DOM needs browser-like environment for querySelector
    var container = document.createElement('div');
    container.id = 'pubsub-dom-test';
    container.setAttribute('data-bw_id', 'mount-test');
    document.body.appendChild(container);

    var calls = 0;
    bw.sub('mount', function() { calls++; }, container);

    // bw.DOM saves _bw_subs before cleanup and restores after
    // Verify by calling bw.DOM which does this internally
    bw.DOM(container, { t: 'span', c: 'new content' });

    bw.pub('mount');
    assert.equal(calls, 1);

    document.body.removeChild(container);
  });

  it("should handle multiple subs tied to same element", function() {
    var el = document.createElement('div');
    el.setAttribute('data-bw_id', 'multi-sub');
    document.body.appendChild(el);

    var aCalled = false, bCalled = false;
    bw.sub('subA', function() { aCalled = true; }, el);
    bw.sub('subB', function() { bCalled = true; }, el);
    assert.equal(el._bw_subs.length, 2);

    bw.cleanup(el);
    bw.pub('subA');
    bw.pub('subB');
    assert.equal(aCalled, false);
    assert.equal(bCalled, false);

    document.body.removeChild(el);
  });
});
