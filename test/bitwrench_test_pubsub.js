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

  it("should add bw_uuid and bw_lc classes on element if not present", function() {
    var el = document.createElement('div');
    bw.sub('life2', function() {}, el);
    var uuid = bw.getUUID(el);
    assert.ok(uuid, 'should have bw_uuid_* class');
    assert.ok(uuid.indexOf('bw_uuid_') === 0);
    assert.ok(el.classList.contains('bw_lc'), 'should have bw_lc marker');
  });

  it("should not overwrite existing UUID class", function() {
    var el = document.createElement('div');
    var existingUuid = bw.uuid('uuid');
    el.classList.add(existingUuid);
    bw.sub('life3', function() {}, el);
    assert.equal(bw.getUUID(el), existingUuid);
    assert.ok(el.classList.contains('bw_lc'), 'should have bw_lc marker');
  });

  it("should remove subscriptions on bw.cleanup()", function() {
    var el = document.createElement('div');
    el.classList.add(bw.uuid('uuid'));
    el.classList.add('bw_lc');
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
    container.classList.add(bw.uuid('uuid'));
    container.classList.add('bw_lc');
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
    el.classList.add(bw.uuid('uuid'));
    el.classList.add('bw_lc');
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

// ===================================================================================
// Malformed input tests for pub/sub
// ===================================================================================

describe("pub/sub malformed inputs", function() {
  beforeEach(function() {
    bw._topics = {};
    bw._subIdCounter = 0;
  });

  it("bw.pub with undefined topic should return 0 and not crash", function() {
    assert.equal(bw.pub(undefined), 0);
  });

  it("bw.pub with null topic should return 0 and not crash", function() {
    assert.equal(bw.pub(null), 0);
  });

  it("bw.pub with numeric topic should return 0 and not crash", function() {
    assert.equal(bw.pub(42), 0);
  });

  it("bw.pub with empty string topic should return 0 when no subscribers", function() {
    assert.equal(bw.pub(''), 0);
  });

  it("bw.pub with empty string topic should fire empty-string subscribers", function() {
    var called = false;
    bw.sub('', function() { called = true; });
    bw.pub('');
    assert.equal(called, true);
  });

  it("bw.pub with object detail should pass it through", function() {
    var received = null;
    bw.sub('obj', function(d) { received = d; });
    bw.pub('obj', { nested: { deep: true } });
    assert.deepEqual(received, { nested: { deep: true } });
  });

  it("bw.pub with undefined detail should pass undefined", function() {
    var received = 'sentinel';
    bw.sub('undef', function(d) { received = d; });
    bw.pub('undef');
    assert.equal(received, undefined);
  });

  it("bw.sub with undefined topic should not crash", function() {
    var unsub = bw.sub(undefined, function() {});
    assert.equal(typeof unsub, 'function');
    unsub();
  });

  it("bw.sub with null handler should store it (no validation)", function() {
    // bw.sub doesn't validate handler type -- it stores whatever is passed
    // publishing will throw, but sub itself shouldn't crash
    bw.sub('bad-handler', null);
    assert.ok(bw._topics['bad-handler'].length === 1);
  });

  it("bw.pub should survive when handler is null (error in subscriber)", function() {
    bw.sub('null-handler', null);
    var origWarn = console.warn;
    var warned = false;
    console.warn = function() { warned = true; };
    // Should not throw -- error is caught and warned
    var count = bw.pub('null-handler');
    console.warn = origWarn;
    assert.equal(count, 0); // handler errored, so not counted
    assert.equal(warned, true);
  });

  it("bw.unsub with undefined topic should return 0", function() {
    assert.equal(bw.unsub(undefined, function() {}), 0);
  });

  it("bw.unsub with null handler should return 0 (no match)", function() {
    bw.sub('test', function() {});
    assert.equal(bw.unsub('test', null), 0);
  });

  it("bw.once with undefined topic should not crash", function() {
    var cancel = bw.once(undefined, function() {});
    assert.equal(typeof cancel, 'function');
    cancel();
  });

  it("bw.pub should handle topic with special characters", function() {
    var called = false;
    bw.sub('foo:bar/baz?qux=1&x=2', function() { called = true; });
    bw.pub('foo:bar/baz?qux=1&x=2');
    assert.equal(called, true);
  });

  it("bw.pub should handle very long topic names", function() {
    var longTopic = 'a'.repeat(10000);
    var called = false;
    bw.sub(longTopic, function() { called = true; });
    bw.pub(longTopic);
    assert.equal(called, true);
  });

  it("bw.sub should handle many subscribers on same topic", function() {
    var count = 0;
    for (var i = 0; i < 1000; i++) {
      bw.sub('mass', function() { count++; });
    }
    bw.pub('mass');
    assert.equal(count, 1000);
  });

  it("bw.pub with wildcard '*' alone should match all topics", function() {
    var topics = [];
    bw.sub('*', function(d, t) { topics.push(t); });
    bw.pub('any-topic');
    bw.pub('another:topic');
    assert.deepEqual(topics, ['any-topic', 'another:topic']);
  });

  it("wildcard subscriber error should not prevent other wildcard subs", function() {
    var count = 0;
    bw.sub('ns:*', function() { throw new Error('fail'); });
    bw.sub('ns:*', function() { count++; });
    var origWarn = console.warn;
    console.warn = function() {};
    var total = bw.pub('ns:event');
    console.warn = origWarn;
    assert.equal(count, 1);
    assert.equal(total, 1); // only the non-erroring one counted
  });

  it("double unsub should be safe (idempotent)", function() {
    var unsub = bw.sub('double', function() {});
    unsub();
    unsub(); // second call should not crash
    assert.equal(bw._topics['double'], undefined);
  });

  it("unsub during pub iteration should not skip remaining subscribers", function() {
    var results = [];
    var unsub2;
    bw.sub('iter', function() { results.push('a'); unsub2(); });
    unsub2 = bw.sub('iter', function() { results.push('b'); });
    bw.sub('iter', function() { results.push('c'); });
    bw.pub('iter');
    assert.deepEqual(results, ['a', 'b', 'c']); // snapshot ensures all run
  });
});
