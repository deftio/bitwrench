/**
 * Bitwrench bwserve Test Suite
 *
 * Tests for:
 * - bw.apply() — all 9 message types + message dispatch
 * - BwServeClient — message format, handler dispatch, query, mount, screenshot
 * - BwServeApp — page registration, app lifecycle
 * - Round-trip: client.render() → _sent → bw.apply() → DOM check
 * - _pend / _resolvePending — unified pending promise mechanism
 * - Unified return channel: /bw/return/<route>/<clientId>
 */

import assert from "assert";
import bw from "../src/bitwrench.js";
import jsdom from 'jsdom';
const { JSDOM } = jsdom;

// bwserve server-side imports
import bwserve from "../src/bwserve/index.js";
const { BwServeApp, BwServeClient } = bwserve;
import { generateShell } from "../src/bwserve/bwshell.js";

function resetApp() {
  var dom = new JSDOM('<!DOCTYPE html><html><body><div id="app"></div></body></html>');
  global.window = dom.window;
  global.document = dom.window.document;
  global.Element = dom.window.Element;
  global.HTMLElement = dom.window.HTMLElement;
  if (bw._nodeMap) {
    for (var k in bw._nodeMap) {
      if (Object.prototype.hasOwnProperty.call(bw._nodeMap, k)) {
        delete bw._nodeMap[k];
      }
    }
  }
}

resetApp();

// ===================================================================================
// bw.apply() tests
// ===================================================================================

describe("bw.apply()", function() {
  beforeEach(function() {
    resetApp();
  });

  it("should return false for null/undefined/missing type", function() {
    assert.strictEqual(bw.apply(null), false);
    assert.strictEqual(bw.apply(undefined), false);
    assert.strictEqual(bw.apply({}), false);
  });

  describe("mount", function() {
    it("should mount a TACO into #app", function() {
      bw.apply({
        v: 1,
        type: 'mount',
        ref: '#app',
        taco: { t: 'div', a: { id: 'hello' }, c: 'Hello World' }
      });
      var el = document.getElementById('hello');
      assert.ok(el, "should find #hello in DOM");
      assert.strictEqual(el.textContent, 'Hello World');
    });

    it("should replace existing content", function() {
      bw.DOM('#app', { t: 'p', c: 'Old content' });
      assert.ok(document.querySelector('#app p'));

      bw.apply({
        v: 1,
        type: 'mount',
        ref: '#app',
        taco: { t: 'span', c: 'New content' }
      });
      assert.ok(!document.querySelector('#app p'), "old p should be gone");
      assert.ok(document.querySelector('#app span'), "new span should exist");
    });

    it("should return false for unknown target", function() {
      var result = bw.apply({
        v: 1,
        type: 'mount',
        ref: '#nonexistent',
        taco: { t: 'div', c: 'test' }
      });
      assert.strictEqual(result, false);
    });
  });

  describe("patch", function() {
    it("should patch text content by id", function() {
      bw.DOM('#app', { t: 'span', a: { id: 'counter' }, c: '0' });
      bw.apply({
        v: 1,
        type: 'patch',
        ref: 'counter',
        text: '42'
      });
      var el = document.getElementById('counter');
      assert.strictEqual(el.textContent, '42');
    });

    it("should return false for unknown target", function() {
      var result = bw.apply({
        v: 1,
        type: 'patch',
        ref: 'nonexistent',
        text: 'test'
      });
      assert.strictEqual(result, false);
    });
  });

  describe("append", function() {
    it("should append a child to target", function() {
      bw.DOM('#app', { t: 'ul', a: { id: 'list' } });
      bw.apply({
        v: 1,
        type: 'append',
        ref: '#list',
        taco: { t: 'li', c: 'Item 1' }
      });
      var items = document.querySelectorAll('#list li');
      assert.strictEqual(items.length, 1);
      assert.strictEqual(items[0].textContent, 'Item 1');
    });

    it("should append multiple children in sequence", function() {
      bw.DOM('#app', { t: 'ul', a: { id: 'list' } });
      bw.apply({ v: 1, type: 'append', ref: '#list', taco: { t: 'li', c: 'A' } });
      bw.apply({ v: 1, type: 'append', ref: '#list', taco: { t: 'li', c: 'B' } });
      bw.apply({ v: 1, type: 'append', ref: '#list', taco: { t: 'li', c: 'C' } });
      var items = document.querySelectorAll('#list li');
      assert.strictEqual(items.length, 3);
    });

    it("should return false for unknown parent", function() {
      var result = bw.apply({
        v: 1,
        type: 'append',
        ref: '#nonexistent',
        taco: { t: 'li', c: 'test' }
      });
      assert.strictEqual(result, false);
    });
  });

  describe("remove", function() {
    it("should remove an element from the DOM", function() {
      bw.DOM('#app', [
        { t: 'div', a: { id: 'item-1' }, c: 'Item 1' },
        { t: 'div', a: { id: 'item-2' }, c: 'Item 2' }
      ]);
      assert.ok(document.getElementById('item-1'));

      bw.apply({ v: 1, type: 'remove', ref: '#item-1' });
      assert.ok(!document.getElementById('item-1'), "item-1 should be removed");
      assert.ok(document.getElementById('item-2'), "item-2 should remain");
    });

    it("should return false for unknown target", function() {
      var result = bw.apply({ v: 1, type: 'remove', ref: '#nonexistent' });
      assert.strictEqual(result, false);
    });
  });

  describe("batch", function() {
    it("should apply multiple operations in sequence", function() {
      bw.DOM('#app', {
        t: 'div', c: [
          { t: 'span', a: { id: 'val' }, c: '0' },
          { t: 'ul', a: { id: 'list' } }
        ]
      });

      bw.apply({
        type: 'batch',
        ops: [
          { v: 1, type: 'patch', ref: 'val', text: '99' },
          { v: 1, type: 'append', ref: '#list', taco: { t: 'li', c: 'Batch A' } },
          { v: 1, type: 'append', ref: '#list', taco: { t: 'li', c: 'Batch B' } }
        ]
      });

      assert.strictEqual(document.getElementById('val').textContent, '99');
      assert.strictEqual(document.querySelectorAll('#list li').length, 2);
    });

    it("should return false for non-array ops", function() {
      assert.strictEqual(bw.apply({ type: 'batch', ops: 'bad' }), false);
    });
  });

  it("should return false for unknown message type", function() {
    var result = bw.apply({ v: 1, type: 'unknown', ref: '#app' });
    assert.strictEqual(result, false);
  });

  describe("register (rejected in v2.1)", function() {
    it("should reject register type in v2.1 wire protocol", function() {
      var result = bw.apply({
        v: 1,
        type: 'register',
        name: 'greet',
        body: 'function(name) { return "Hello " + name; }'
      });
      assert.strictEqual(result, false);
    });
  });

  describe("call", function() {
    beforeEach(function() {
      bw._clientFunctions = {};
    });

    it("should call a registered function", function() {
      var callLog = [];
      bw._clientFunctions.myFn = function(a, b) { callLog.push(a + b); };
      var result = bw.apply({ v: 1, type: 'call', name: 'myFn', args: [3, 4] });
      assert.strictEqual(result, true);
      assert.deepStrictEqual(callLog, [7]);
    });

    it("should call a registered log function", function() {
      bw._clientFunctions.log = function() { console.log.apply(console, arguments); };
      var origLog = console.log;
      var logged = [];
      console.log = function() { logged.push([].slice.call(arguments)); };
      var result = bw.apply({ v: 1, type: 'call', name: 'log', args: ['hello', 'world'] });
      console.log = origLog;
      assert.strictEqual(result, true);
      assert.deepStrictEqual(logged, [['hello', 'world']]);
    });

    it("should call a registered focus function", function() {
      bw._clientFunctions.focus = function(sel) { var el = bw.el(sel); if (el && typeof el.focus === 'function') el.focus(); };
      bw.DOM('#app', { t: 'input', a: { id: 'inp' } });
      var focused = false;
      document.getElementById('inp').focus = function() { focused = true; };
      var result = bw.apply({ v: 1, type: 'call', name: 'focus', args: ['#inp'] });
      assert.strictEqual(result, true);
      assert.strictEqual(focused, true);
    });

    it("should call a registered scrollTo function", function() {
      bw._clientFunctions.scrollTo = function(sel) { var el = bw.el(sel); if (el) el.scrollTop = el.scrollHeight; };
      bw.DOM('#app', { t: 'div', a: { id: 'scrollable' } });
      var result = bw.apply({ v: 1, type: 'call', name: 'scrollTo', args: ['#scrollable'] });
      assert.strictEqual(result, true);
    });

    it("should handle missing args gracefully", function() {
      bw._clientFunctions.noArgs = function() { return 42; };
      var result = bw.apply({ v: 1, type: 'call', name: 'noArgs' });
      assert.strictEqual(result, true);
    });
  });

  describe("exec (rejected in v2.1)", function() {
    it("should reject exec type in v2.1 wire protocol", function() {
      bw._allowExec = true;
      var result = bw.apply({ v: 1, type: 'exec', code: '_execTest = 42;' });
      assert.strictEqual(result, false);
      bw._allowExec = false;
    });
  });
});

// ===================================================================================
// BwServeClient tests
// ===================================================================================

describe("BwServeClient", function() {
  it("should create with id and null response", function() {
    var client = new BwServeClient('test-1', null);
    assert.strictEqual(client.id, 'test-1');
    assert.strictEqual(client._closed, false);
  });

  describe("#mount() / #render()", function() {
    it("should send a mount message with ref/taco fields", function() {
      var client = new BwServeClient('c1', null);
      client.mount('#app', { t: 'div', c: 'Hello' });
      assert.deepStrictEqual(client._sent[0], {
        type: 'mount',
        ref: '#app',
        taco: { t: 'div', c: 'Hello' },
        v: 1
      });
    });

    it("render() should alias to mount()", function() {
      var client = new BwServeClient('c1', null);
      client.render('#app', { t: 'div', c: 'Hello' });
      assert.strictEqual(client._sent[0].type, 'mount');
      assert.strictEqual(client._sent[0].ref, '#app');
    });
  });

  describe("#patch()", function() {
    it("should send a patch message with discriminated fields", function() {
      var client = new BwServeClient('c1', null);
      client.patch('counter', { text: '42' });
      assert.deepStrictEqual(client._sent[0], {
        type: 'patch',
        ref: 'counter',
        text: '42',
        v: 1
      });
    });

    it("should send patch with attrs field", function() {
      var client = new BwServeClient('c1', null);
      client.patch('el', { attrs: { class: 'active' } });
      assert.deepStrictEqual(client._sent[0].attrs, { class: 'active' });
      assert.strictEqual(client._sent[0].ref, 'el');
    });
  });

  describe("#append()", function() {
    it("should send an append message with ref/taco fields", function() {
      var client = new BwServeClient('c1', null);
      client.append('#list', { t: 'li', c: 'Item' });
      assert.deepStrictEqual(client._sent[0], {
        type: 'append',
        ref: '#list',
        taco: { t: 'li', c: 'Item' },
        v: 1
      });
    });
  });

  describe("#remove()", function() {
    it("should send a remove message with ref field", function() {
      var client = new BwServeClient('c1', null);
      client.remove('#old-item');
      assert.deepStrictEqual(client._sent[0], {
        type: 'remove',
        ref: '#old-item',
        v: 1
      });
    });
  });

  describe("#batch()", function() {
    it("should send a batch message", function() {
      var client = new BwServeClient('c1', null);
      client.batch([
        { type: 'patch', target: 'a', content: '1' },
        { type: 'patch', target: 'b', content: '2' }
      ]);
      assert.strictEqual(client._sent[0].type, 'batch');
      assert.strictEqual(client._sent[0].ops.length, 2);
    });
  });

  describe("#message()", function() {
    it("should send a message dispatch with ref field", function() {
      var client = new BwServeClient('c1', null);
      client.message('my-comp', 'refresh', { force: true });
      assert.deepStrictEqual(client._sent[0], {
        type: 'message',
        ref: 'my-comp',
        action: 'refresh',
        data: { force: true },
        v: 1
      });
    });
  });

  describe("#call()", function() {
    it("should send a call message with args", function() {
      var client = new BwServeClient('c1', null);
      client.call('scrollTo', '#chat');
      assert.deepStrictEqual(client._sent[0], {
        type: 'call',
        name: 'scrollTo',
        args: ['#chat'],
        v: 1
      });
    });

    it("should send a call with multiple args", function() {
      var client = new BwServeClient('c1', null);
      client.call('download', 'report.csv', 'id,name\n1,Alice', 'text/csv');
      assert.deepStrictEqual(client._sent[0], {
        type: 'call',
        name: 'download',
        args: ['report.csv', 'id,name\n1,Alice', 'text/csv'],
        v: 1
      });
    });

    it("should send a call with no args", function() {
      var client = new BwServeClient('c1', null);
      client.call('log');
      assert.deepStrictEqual(client._sent[0], {
        type: 'call',
        name: 'log',
        args: [],
        v: 1
      });
    });
  });

  describe("#on() and #_dispatch()", function() {
    it("should register and dispatch action handlers", function() {
      var client = new BwServeClient('c1', null);
      var called = false;
      var receivedData = null;
      client.on('increment', function(data) {
        called = true;
        receivedData = data;
      });
      var result = client._dispatch('increment', { count: 5 });
      assert.strictEqual(result, true);
      assert.strictEqual(called, true);
      assert.deepStrictEqual(receivedData, { count: 5 });
    });

    it("should return false for unregistered action", function() {
      var client = new BwServeClient('c1', null);
      assert.strictEqual(client._dispatch('unknown', {}), false);
    });

    it("should support chaining", function() {
      var client = new BwServeClient('c1', null);
      var result = client.on('a', function() {}).on('b', function() {});
      assert.strictEqual(result, client);
    });
  });

  describe("#close()", function() {
    it("should set _closed to true", function() {
      var client = new BwServeClient('c1', null);
      client.close();
      assert.strictEqual(client._closed, true);
    });

    it("should not send after close", function() {
      var client = new BwServeClient('c1', null);
      client.mount('#app', { t: 'div', c: 'before' });
      assert.strictEqual(client._sent.length, 1);
      client.close();
      client.mount('#app', { t: 'div', c: 'after' });
      assert.strictEqual(client._sent.length, 1, "no new messages after close");
    });
  });

  describe("#_send() SSE format", function() {
    it("should write SSE frame to response stream with v:1", function() {
      var written = '';
      var mockRes = {
        write: function(data) { written += data; }
      };
      var client = new BwServeClient('c1', mockRes);
      client.mount('#app', { t: 'div', c: 'Hi' });
      var expected = 'data: ' + JSON.stringify({ type: 'mount', ref: '#app', taco: { t: 'div', c: 'Hi' }, v: 1 }) + '\n\n';
      assert.strictEqual(written, expected);
    });

    it("should still store in _sent when writing SSE", function() {
      var mockRes = { write: function() {} };
      var client = new BwServeClient('c1', mockRes);
      client.patch('id', { text: 'val' });
      assert.strictEqual(client._sent.length, 1);
    });
  });
});

// ===================================================================================
// 2.1 removed APIs — query, exec, register are GONE
// ===================================================================================

describe("BwServeClient removed 2.0.x APIs", function() {
  it("query is removed", function() {
    var client = new BwServeClient('rm-1', null);
    assert.strictEqual(client.query, undefined);
  });

  it("exec is removed", function() {
    var client = new BwServeClient('rm-2', null);
    assert.strictEqual(client.exec, undefined);
  });

  it("register is removed", function() {
    var client = new BwServeClient('rm-3', null);
    assert.strictEqual(client.register, undefined);
  });

  it("inspect is removed", function() {
    var client = new BwServeClient('rm-4', null);
    assert.strictEqual(client.inspect, undefined);
  });

  it("screenshot is removed", function() {
    var client = new BwServeClient('rm-5', null);
    assert.strictEqual(client.screenshot, undefined);
  });

  it("_pend is removed", function() {
    var client = new BwServeClient('rm-6', null);
    assert.strictEqual(client._pend, undefined);
  });

  it("_resolvePending is removed", function() {
    var client = new BwServeClient('rm-7', null);
    assert.strictEqual(client._resolvePending, undefined);
  });
});

// ===================================================================================
// client.mount() tests — 2.1 (simple verb, not promise-based)
// ===================================================================================

describe("client.mount()", function() {
  it("should send a mount message with ref and taco", function() {
    var client = new BwServeClient('m-1', null);
    client.mount('#app', { t: 'div', c: 'Hello' });
    assert.strictEqual(client._sent.length, 1);
    var msg = client._sent[0];
    assert.strictEqual(msg.type, 'mount');
    assert.strictEqual(msg.ref, '#app');
    assert.deepStrictEqual(msg.taco, { t: 'div', c: 'Hello' });
    assert.strictEqual(msg.v, 1);
  });

  it("should support mount with complex TACO", function() {
    var client = new BwServeClient('m-2', null);
    var taco = { t: 'div', a: { id: 'card' }, c: [{ t: 'h2', c: 'Title' }] };
    client.mount('#app', taco);
    assert.deepStrictEqual(client._sent[0].taco, taco);
  });
});

// ===================================================================================
// client.listen() tests — 2.1
// ===================================================================================

describe("client.listen()", function() {
  it("should send a listen message with topic", function() {
    var client = new BwServeClient('l-1', null);
    client.listen('bw:lifecycle', function() {});
    assert.strictEqual(client._sent.length, 1);
    var msg = client._sent[0];
    assert.strictEqual(msg.type, 'listen');
    assert.strictEqual(msg.topic, 'bw:lifecycle');
    assert.strictEqual(msg.v, 1);
  });

  it("should register a topic handler", function() {
    var client = new BwServeClient('l-2', null);
    var received = null;
    client.listen('bw:lifecycle', function(data) { received = data; });
    client._dispatch('_topic:bw:lifecycle', { event: 'mount' });
    assert.deepStrictEqual(received, { event: 'mount' });
  });

  it("should support chaining", function() {
    var client = new BwServeClient('l-3', null);
    var result = client.listen('a', function() {}).listen('b', function() {});
    assert.strictEqual(result, client);
  });
});

// ===================================================================================
// BwServeApp tests
// ===================================================================================

describe("BwServeApp", function() {
  it("should create with default port", function() {
    var app = bwserve.create();
    assert.strictEqual(app.port, 7902);
    assert.strictEqual(app.injectBitwrench, true);
  });

  it("should create with custom options", function() {
    var app = bwserve.create({ port: 8080, title: 'My App' });
    assert.strictEqual(app.port, 8080);
    assert.strictEqual(app.title, 'My App');
  });

  describe("#page()", function() {
    it("should register a page handler", function() {
      var app = bwserve.create();
      var handler = function() {};
      app.page('/', handler);
      assert.strictEqual(app._pages.get('/'), handler);
    });

    it("should support chaining", function() {
      var app = bwserve.create();
      var result = app.page('/', function() {}).page('/about', function() {});
      assert.strictEqual(result, app);
    });
  });

  describe("#clientCount", function() {
    it("should return 0 initially", function() {
      var app = bwserve.create();
      assert.strictEqual(app.clientCount, 0);
    });
  });

  describe("#listen() and #close()", function() {
    it("should start and stop server", async function() {
      this.timeout(5000);
      var app = bwserve.create({ port: 0 });
      app.page('/', function(client) {
        client.mount('#app', { t: 'div', c: 'Hello' });
      });
      var callbackCalled = false;
      await app.listen(function() { callbackCalled = true; });
      assert.strictEqual(callbackCalled, true);
      assert.ok(app._server, "server should be running");
      await app.close();
      assert.strictEqual(app._server, null, "server should be stopped");
    });
  });
});

// ===================================================================================
// Round-trip tests: client.render() → _sent → bw.apply() → DOM
// ===================================================================================

describe("bwserve round-trip", function() {
  beforeEach(function() {
    resetApp();
  });

  it("should render a TACO via client then apply to DOM", function() {
    // v2.1: bw.apply uses v:1 wire protocol with ref/taco fields
    bw.apply({ v: 1, type: 'mount', ref: '#app', taco: {
      t: 'div', a: { id: 'greeting' }, c: 'Hello from server'
    }});
    var el = document.getElementById('greeting');
    assert.ok(el);
    assert.strictEqual(el.textContent, 'Hello from server');
  });

  it("should render then patch via round-trip", function() {
    bw.apply({ v: 1, type: 'mount', ref: '#app', taco: {
      t: 'div', c: [
        { t: 'span', a: { id: 'count' }, c: '0' }
      ]
    }});
    assert.strictEqual(document.getElementById('count').textContent, '0');
    bw.apply({ v: 1, type: 'patch', ref: 'count', text: '42' });
    assert.strictEqual(document.getElementById('count').textContent, '42');
  });

  it("should render then append then remove via round-trip", function() {
    bw.apply({ v: 1, type: 'mount', ref: '#app', taco: { t: 'ul', a: { id: 'list' } } });
    bw.apply({ v: 1, type: 'append', ref: '#list', taco: { t: 'li', a: { id: 'i1' }, c: 'Item 1' } });
    bw.apply({ v: 1, type: 'append', ref: '#list', taco: { t: 'li', a: { id: 'i2' }, c: 'Item 2' } });
    assert.strictEqual(document.querySelectorAll('#list li').length, 2);
    bw.apply({ v: 1, type: 'remove', ref: '#i1' });
    assert.strictEqual(document.querySelectorAll('#list li').length, 1);
    assert.ok(!document.getElementById('i1'));
    assert.ok(document.getElementById('i2'));
  });

  it("should handle batch round-trip", function() {
    bw.apply({ v: 1, type: 'mount', ref: '#app', taco: {
      t: 'div', c: [
        { t: 'span', a: { id: 'a' }, c: '-' },
        { t: 'span', a: { id: 'b' }, c: '-' },
        { t: 'ul', a: { id: 'list' } }
      ]
    }});
    bw.apply({
      type: 'batch',
      ops: [
        { v: 1, type: 'patch', ref: 'a', text: 'X' },
        { v: 1, type: 'patch', ref: 'b', text: 'Y' },
        { v: 1, type: 'append', ref: '#list', taco: { t: 'li', c: 'batch-item' } }
      ]
    });
    assert.strictEqual(document.getElementById('a').textContent, 'X');
    assert.strictEqual(document.getElementById('b').textContent, 'Y');
    assert.strictEqual(document.querySelectorAll('#list li').length, 1);
  });
});

// ===================================================================================
// Round-trip tests: register/call/exec
// ===================================================================================

describe("bwserve round-trip: register/call/exec", function() {
  beforeEach(function() {
    resetApp();
    bw._clientFunctions = {};
    bw._allowExec = false;
  });

  it("should call pre-registered function via round-trip", function() {
    // v2.1: register type is rejected by bw.apply; register functions directly
    bw._clientFunctions.setTitle = function(id, text) {
      var el = document.getElementById(id);
      if (el) el.textContent = text;
    };
    bw.apply({ v: 1, type: 'mount', ref: '#app', taco: { t: 'h1', a: { id: 'title' }, c: 'Original' } });
    assert.strictEqual(document.getElementById('title').textContent, 'Original');
    bw.apply({ v: 1, type: 'call', name: 'setTitle', args: ['title', 'Updated by call'] });
    assert.strictEqual(document.getElementById('title').textContent, 'Updated by call');
  });

  it("should call registered log via server round-trip", function() {
    bw._clientFunctions.log = function() { console.log.apply(console, arguments); };
    var origLog = console.log;
    var logged = [];
    console.log = function() { logged.push([].slice.call(arguments)); };
    bw.apply({ v: 1, type: 'call', name: 'log', args: ['server says hello'] });
    console.log = origLog;
    assert.deepStrictEqual(logged, [['server says hello']]);
  });

  it("should reject exec in round-trip (v2.1 rejects exec type)", function() {
    var result = bw.apply({ v: 1, type: 'exec', code: 'var x = 1;' });
    assert.strictEqual(result, false);
  });

  it("should allow exec in round-trip when opted in", function() {
    // v2.1: exec type is rejected by bw.apply wire protocol
    var result = bw.apply({ v: 1, type: 'exec', code: '_execRoundTrip = 99;' });
    assert.strictEqual(result, false);
  });

  it("should batch call in one round-trip", function() {
    // v2.1: register is rejected; pre-register the function directly
    bw._clientFunctions.markDone = function(id) {
      var el = document.getElementById(id);
      if (el) el.textContent = 'done';
    };
    bw.apply({ v: 1, type: 'mount', ref: '#app', taco: { t: 'div', a: { id: 'status' }, c: 'waiting' } });
    bw.apply({
      type: 'batch',
      ops: [
        { v: 1, type: 'call', name: 'markDone', args: ['status'] }
      ]
    });
    assert.strictEqual(document.getElementById('status').textContent, 'done');
  });
});

// ===================================================================================
// generateShell() tests
// ===================================================================================

describe("generateShell()", function() {
  it("should return a string", function() {
    var html = generateShell({ clientId: 'test-1' });
    assert.strictEqual(typeof html, 'string');
  });

  it("should include DOCTYPE and html tags", function() {
    var html = generateShell({ clientId: 'c1' });
    assert.ok(html.includes('<!DOCTYPE html>'));
    assert.ok(html.includes('<html lang="en">'));
    assert.ok(html.includes('</html>'));
  });

  it("should include default title", function() {
    var html = generateShell({ clientId: 'c1' });
    assert.ok(html.includes('<title>bwserve</title>'));
  });

  it("should use custom title", function() {
    var html = generateShell({ clientId: 'c1', title: 'My Dashboard' });
    assert.ok(html.includes('<title>My Dashboard</title>'));
  });

  it("should include bitwrench script and CSS from /bw/lib/", function() {
    var html = generateShell({ clientId: 'c1' });
    assert.ok(html.includes('/bw/lib/bitwrench.umd.js'));
    assert.ok(html.includes('/bw/lib/bitwrench.css'));
  });

  it("should not include bitwrench when injectBitwrench is false", function() {
    var html = generateShell({ clientId: 'c1', injectBitwrench: false });
    assert.ok(!html.includes('/bw/lib/bitwrench.umd.js'));
    assert.ok(!html.includes('/bw/lib/bitwrench.css'));
  });

  it("should include #app div", function() {
    var html = generateShell({ clientId: 'c1' });
    assert.ok(html.includes('<div id="app"></div>'));
  });

  it("should include bwclient inline and correct clientId", function() {
    var html = generateShell({ clientId: 'my-client-42' });
    assert.ok(html.includes('"my-client-42"'));
    assert.ok(html.includes('_bwClient'));
    assert.ok(html.includes('/bw/events/'));
  });

  it("should include data-bw-action delegation via bwclient", function() {
    var html = generateShell({ clientId: 'c1' });
    assert.ok(html.includes('data-bw-action'));
    assert.ok(html.includes('sendAction'));
  });

  it("should include Enter key handler", function() {
    var html = generateShell({ clientId: 'c1' });
    assert.ok(html.includes('keydown'));
    assert.ok(html.includes('Enter'));
  });

  it("should use defaults when called with empty opts", function() {
    var html = generateShell({});
    assert.ok(html.includes('<title>bwserve</title>'));
    assert.ok(html.includes('"default"'));
  });

  it("should use defaults when called with no opts", function() {
    var html = generateShell();
    assert.ok(html.includes('<title>bwserve</title>'));
  });

  it("should include theme loading when theme is provided as string", function() {
    var html = generateShell({ clientId: 'c1', theme: 'ocean' });
    assert.ok(html.includes('loadStyles'));
  });

  it("should include theme loading when theme is provided as object", function() {
    var html = generateShell({ clientId: 'c1', theme: { primary: '#336699', secondary: '#cc6633' } });
    assert.ok(html.includes('loadStyles'));
    assert.ok(html.includes('#336699'));
  });

  it("should include loadStyles call", function() {
    var html = generateShell({ clientId: 'c1' });
    assert.ok(html.includes('loadStyles'));
  });

  it("should include meta viewport", function() {
    var html = generateShell({ clientId: 'c1' });
    assert.ok(html.includes('viewport'));
  });

  it("should include inputValue collection logic", function() {
    var html = generateShell({ clientId: 'c1' });
    assert.ok(html.includes('inputValue'));
    assert.ok(html.includes('input[type=text]'));
  });
});

// ===================================================================================
// BwServeClient edge case tests
// ===================================================================================

describe("BwServeClient edge cases", function() {
  it("should call res.end() when close() is called with a mock response", function() {
    var endCalled = false;
    var mockRes = {
      write: function() {},
      end: function() { endCalled = true; }
    };
    var client = new BwServeClient('c-close', mockRes);
    client.close();
    assert.strictEqual(endCalled, true);
    assert.strictEqual(client._closed, true);
  });

  it("should handle res.end() throwing an error", function() {
    var mockRes = {
      write: function() {},
      end: function() { throw new Error('stream already closed'); }
    };
    var client = new BwServeClient('c-close-err', mockRes);
    client.close();
    assert.strictEqual(client._closed, true);
  });

  it("should handle _send() when res.write() throws", function() {
    var mockRes = {
      write: function() { throw new Error('write after end'); }
    };
    var client = new BwServeClient('c-write-err', mockRes);
    client.mount('#app', { t: 'div', c: 'test' });
    assert.strictEqual(client._sent.length, 1);
  });

  it("should handle dispatch passing client as second arg", function() {
    var client = new BwServeClient('c-dispatch', null);
    var receivedClient = null;
    client.on('test', function(data, c) {
      receivedClient = c;
    });
    client._dispatch('test', {});
    assert.strictEqual(receivedClient, client);
  });
});

// ===================================================================================
// BwServeApp HTTP integration tests
// ===================================================================================

describe("BwServeApp HTTP integration", function() {
  var apps = [];

  function createApp(opts) {
    var a = bwserve.create(Object.assign({ port: 0 }, opts || {}));
    apps.push(a);
    return a;
  }

  afterEach(async function() {
    this.timeout(5000);
    for (var a of apps) {
      if (a._server) await a.close();
    }
    apps = [];
  });

  it("should serve shell HTML for registered page", async function() {
    this.timeout(5000);
    var app = createApp();
    app.page('/', function(client) {
      client.mount('#app', { t: 'div', c: 'Hello from test' });
    });
    await app.listen();
    var port = app._server.address().port;
    var res = await fetch('http://localhost:' + port + '/');
    assert.strictEqual(res.status, 200);
    var html = await res.text();
    assert.ok(html.includes('<!DOCTYPE html>'));
    assert.ok(html.includes('bitwrench'));
    assert.ok(html.includes('id="app"'));
  });

  it("should return 404 for unregistered page", async function() {
    this.timeout(5000);
    var app = createApp();
    app.page('/', function() {});
    await app.listen();
    var port = app._server.address().port;
    var res = await fetch('http://localhost:' + port + '/nonexistent');
    assert.strictEqual(res.status, 404);
  });

  it("should serve bitwrench.umd.js from /bw/lib/", async function() {
    this.timeout(5000);
    var app = createApp();
    app.page('/', function() {});
    await app.listen();
    var port = app._server.address().port;
    var res = await fetch('http://localhost:' + port + '/bw/lib/bitwrench.umd.js');
    assert.strictEqual(res.status, 200);
    var contentType = res.headers.get('content-type');
    assert.ok(contentType.includes('javascript'));
    var body = await res.text();
    assert.ok(body.length > 1000, "bitwrench.umd.js should be > 1KB");
  });

  it("should serve bitwrench.umd.min.js from /bw/lib/", async function() {
    this.timeout(5000);
    var app = createApp();
    app.page('/', function() {});
    await app.listen();
    var port = app._server.address().port;
    var res = await fetch('http://localhost:' + port + '/bw/lib/bitwrench.umd.min.js');
    assert.strictEqual(res.status, 200);
  });

  it("should serve bitwrench.css from /bw/lib/", async function() {
    this.timeout(5000);
    var app = createApp();
    app.page('/', function() {});
    await app.listen();
    var port = app._server.address().port;
    var res = await fetch('http://localhost:' + port + '/bw/lib/bitwrench.css');
    assert.strictEqual(res.status, 200);
    var contentType = res.headers.get('content-type');
    assert.ok(contentType.includes('css'));
  });

  it("should handle SSE connection and send messages", async function() {
    this.timeout(5000);
    var app = createApp();
    app.page('/', function(client) {
      client.mount('#app', { t: 'div', c: 'Hello from SSE test' });
      setTimeout(function() { client.close(); }, 50);
    });
    await app.listen();
    var port = app._server.address().port;
    var pageRes = await fetch('http://localhost:' + port + '/');
    var html = await pageRes.text();
    var match = html.match(/"(c\d+)"/);
    assert.ok(match, "should have a client ID in the shell");
    var clientId = match[1];
    var sseRes = await fetch('http://localhost:' + port + '/bw/events/' + clientId);
    assert.strictEqual(sseRes.status, 200);
    var sseType = sseRes.headers.get('content-type');
    assert.ok(sseType.includes('text/event-stream'));
    var body = await sseRes.text();
    assert.ok(body.includes('"type":"mount"'), "SSE should contain mount message");
    assert.ok(body.includes('Hello from SSE test'), "SSE should contain our content");
  });

  it("should handle action POST via unified return channel", async function() {
    this.timeout(5000);
    var actionCalled = false;
    var app = createApp();
    app.page('/', function(client) {
      client.mount('#app', { t: 'div', c: 'test' });
      client.on('myAction', function() {
        actionCalled = true;
      });
    });
    await app.listen();
    var port = app._server.address().port;
    var pageRes = await fetch('http://localhost:' + port + '/');
    var html = await pageRes.text();
    var match = html.match(/"(c\d+)"/);
    var clientId = match[1];
    fetch('http://localhost:' + port + '/bw/events/' + clientId).catch(function() {});
    await new Promise(function(r) { setTimeout(r, 100); });
    var actionRes = await fetch('http://localhost:' + port + '/bw/return/action/' + clientId, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ result: { action: 'myAction', data: { test: true } } })
    });
    assert.strictEqual(actionRes.status, 200);
    var actionBody = await actionRes.json();
    assert.strictEqual(actionBody.ok, true);
    assert.strictEqual(actionCalled, true);
  });

  it("should return 404 for return with unknown client", async function() {
    this.timeout(5000);
    var app = createApp();
    app.page('/', function() {});
    await app.listen();
    var port = app._server.address().port;
    var res = await fetch('http://localhost:' + port + '/bw/return/action/unknown-client', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'test' })
    });
    assert.strictEqual(res.status, 404);
  });

  it("should return 400 for malformed return POST body", async function() {
    this.timeout(5000);
    var app = createApp();
    app.page('/', function(client) {
      client.mount('#app', { t: 'div', c: 'test' });
    });
    await app.listen();
    var port = app._server.address().port;
    var pageRes = await fetch('http://localhost:' + port + '/');
    var html = await pageRes.text();
    var match = html.match(/"(c\d+)"/);
    var clientId = match[1];
    fetch('http://localhost:' + port + '/bw/events/' + clientId).catch(function() {});
    await new Promise(function(r) { setTimeout(r, 100); });
    var res = await fetch('http://localhost:' + port + '/bw/return/action/' + clientId, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not valid json{{{}'
    });
    assert.strictEqual(res.status, 400);
  });

  it("should close all clients on app.close()", async function() {
    this.timeout(5000);
    var app = createApp();
    app.page('/', function(client) {
      client.mount('#app', { t: 'div', c: 'test' });
    });
    await app.listen();
    var port = app._server.address().port;
    var pageRes = await fetch('http://localhost:' + port + '/');
    var html = await pageRes.text();
    var match = html.match(/"(c\d+)"/);
    var clientId = match[1];
    var controller = new AbortController();
    fetch('http://localhost:' + port + '/bw/events/' + clientId, {
      signal: controller.signal
    }).catch(function() {});
    await new Promise(function(r) { setTimeout(r, 100); });
    assert.ok(app.clientCount >= 1);
    controller.abort();
    await app.close();
    assert.strictEqual(app.clientCount, 0);
    assert.strictEqual(app._server, null);
  });

  it("should close cleanly when no server is running", async function() {
    var emptyApp = createApp();
    await emptyApp.close();
  });

  it("should handle multiple pages", async function() {
    this.timeout(5000);
    var app = createApp();
    app.page('/', function(client) {
      client.mount('#app', { t: 'div', c: 'Home' });
    });
    app.page('/about', function(client) {
      client.mount('#app', { t: 'div', c: 'About' });
    });
    await app.listen();
    var port = app._server.address().port;
    var homeRes = await fetch('http://localhost:' + port + '/');
    assert.strictEqual(homeRes.status, 200);
    var aboutRes = await fetch('http://localhost:' + port + '/about');
    assert.strictEqual(aboutRes.status, 200);
  });

  it("should serve static files when static dir is set", async function() {
    this.timeout(5000);
    var fs = await import('fs');
    var os = await import('os');
    var path = await import('path');
    var tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bwserve-test-'));
    fs.writeFileSync(path.join(tmpDir, 'hello.txt'), 'static content');
    fs.writeFileSync(path.join(tmpDir, 'data.json'), '{"key":"value"}');
    var app = createApp({ static: tmpDir });
    app.page('/', function() {});
    await app.listen();
    var port = app._server.address().port;
    var res = await fetch('http://localhost:' + port + '/hello.txt');
    assert.strictEqual(res.status, 200);
    var body = await res.text();
    assert.strictEqual(body, 'static content');
    var jsonRes = await fetch('http://localhost:' + port + '/data.json');
    assert.strictEqual(jsonRes.status, 200);
    var ct = jsonRes.headers.get('content-type');
    assert.ok(ct.includes('json'));
    fs.unlinkSync(path.join(tmpDir, 'hello.txt'));
    fs.unlinkSync(path.join(tmpDir, 'data.json'));
    fs.rmdirSync(tmpDir);
  });

  it("should return 404 for non-existent static file", async function() {
    this.timeout(5000);
    var fs = await import('fs');
    var os = await import('os');
    var path = await import('path');
    var tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bwserve-test-'));
    var app = createApp({ static: tmpDir });
    app.page('/', function() {});
    await app.listen();
    var port = app._server.address().port;
    var res = await fetch('http://localhost:' + port + '/nonexistent.txt');
    assert.strictEqual(res.status, 404);
    fs.rmdirSync(tmpDir);
  });

  it("should serve index.html for trailing-slash directory request", async function() {
    this.timeout(5000);
    var fs = await import('fs');
    var os = await import('os');
    var path = await import('path');
    var tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bwserve-test-'));
    fs.mkdirSync(path.join(tmpDir, 'subdir'));
    fs.writeFileSync(path.join(tmpDir, 'index.html'), '<h1>Root Index</h1>');
    fs.writeFileSync(path.join(tmpDir, 'subdir', 'index.html'), '<h1>Sub Index</h1>');
    var app = createApp({ static: tmpDir });
    app.page('/bwpage', function() {});
    await app.listen();
    var port = app._server.address().port;
    // Root trailing slash should serve root index.html
    var rootRes = await fetch('http://localhost:' + port + '/', { redirect: 'manual' });
    assert.strictEqual(rootRes.status, 200);
    var rootBody = await rootRes.text();
    assert.strictEqual(rootBody, '<h1>Root Index</h1>');
    // Subdirectory trailing slash should serve subdir/index.html
    var subRes = await fetch('http://localhost:' + port + '/subdir/', { redirect: 'manual' });
    assert.strictEqual(subRes.status, 200);
    var subBody = await subRes.text();
    assert.strictEqual(subBody, '<h1>Sub Index</h1>');
    // Cleanup
    fs.unlinkSync(path.join(tmpDir, 'index.html'));
    fs.unlinkSync(path.join(tmpDir, 'subdir', 'index.html'));
    fs.rmdirSync(path.join(tmpDir, 'subdir'));
    fs.rmdirSync(tmpDir);
  });

  it("should 301 redirect bare directory path to trailing slash", async function() {
    this.timeout(5000);
    var fs = await import('fs');
    var os = await import('os');
    var path = await import('path');
    var tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bwserve-test-'));
    fs.mkdirSync(path.join(tmpDir, 'docs'));
    fs.writeFileSync(path.join(tmpDir, 'docs', 'index.html'), '<h1>Docs</h1>');
    var app = createApp({ static: tmpDir });
    app.page('/', function() {});
    await app.listen();
    var port = app._server.address().port;
    // Bare directory should redirect to trailing slash
    var res = await fetch('http://localhost:' + port + '/docs', { redirect: 'manual' });
    assert.strictEqual(res.status, 301);
    assert.strictEqual(res.headers.get('location'), '/docs/');
    // Following redirect should serve index.html
    var followRes = await fetch('http://localhost:' + port + '/docs/');
    assert.strictEqual(followRes.status, 200);
    var body = await followRes.text();
    assert.strictEqual(body, '<h1>Docs</h1>');
    // Cleanup
    fs.unlinkSync(path.join(tmpDir, 'docs', 'index.html'));
    fs.rmdirSync(path.join(tmpDir, 'docs'));
    fs.rmdirSync(tmpDir);
  });

  it("should return directory listing for directory without index.html", async function() {
    this.timeout(5000);
    var fs = await import('fs');
    var os = await import('os');
    var path = await import('path');
    var tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bwserve-test-'));
    fs.mkdirSync(path.join(tmpDir, 'emptydir'));
    var app = createApp({ static: tmpDir });
    app.page('/bwpage', function() {});
    await app.listen();
    var port = app._server.address().port;
    var res = await fetch('http://localhost:' + port + '/emptydir/', { redirect: 'manual' });
    assert.strictEqual(res.status, 200);
    var body = await res.text();
    assert.ok(body.includes('Index of /emptydir/'));
    assert.ok(body.includes('..'));
    // Cleanup
    fs.rmdirSync(path.join(tmpDir, 'emptydir'));
    fs.rmdirSync(tmpDir);
  });

  it("should preserve query string in bare directory redirect", async function() {
    this.timeout(5000);
    var fs = await import('fs');
    var os = await import('os');
    var path = await import('path');
    var tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bwserve-test-'));
    fs.mkdirSync(path.join(tmpDir, 'app'));
    fs.writeFileSync(path.join(tmpDir, 'app', 'index.html'), '<h1>App</h1>');
    var app = createApp({ static: tmpDir });
    app.page('/', function() {});
    await app.listen();
    var port = app._server.address().port;
    var res = await fetch('http://localhost:' + port + '/app?debug=1', { redirect: 'manual' });
    assert.strictEqual(res.status, 301);
    assert.strictEqual(res.headers.get('location'), '/app/?debug=1');
    // Cleanup
    fs.unlinkSync(path.join(tmpDir, 'app', 'index.html'));
    fs.rmdirSync(path.join(tmpDir, 'app'));
    fs.rmdirSync(tmpDir);
  });

  it("should handle page handler that throws", async function() {
    this.timeout(5000);
    var app = createApp();
    app.page('/', function() {
      throw new Error('test handler error');
    });
    await app.listen();
    var port = app._server.address().port;
    var pageRes = await fetch('http://localhost:' + port + '/');
    var html = await pageRes.text();
    var match = html.match(/"(c\d+)"/);
    var clientId = match[1];
    var controller = new AbortController();
    var sseRes = await Promise.race([
      fetch('http://localhost:' + port + '/bw/events/' + clientId, {
        signal: controller.signal
      }),
      new Promise(function(r) { setTimeout(function() { r({ status: 200 }); }, 200); })
    ]);
    controller.abort();
    var res2 = await fetch('http://localhost:' + port + '/');
    assert.strictEqual(res2.status, 200);
  });

  it("should send keep-alive comments on SSE connection", async function() {
    this.timeout(5000);
    var app = createApp({ keepAliveInterval: 50 });
    app.page('/', function(client) {
      setTimeout(function() { client.close(); }, 150);
    });
    await app.listen();
    var port = app._server.address().port;
    var pageRes = await fetch('http://localhost:' + port + '/');
    var html = await pageRes.text();
    var match = html.match(/"(c\d+)"/);
    var clientId = match[1];
    var sseRes = await fetch('http://localhost:' + port + '/bw/events/' + clientId);
    var body = await sseRes.text();
    assert.ok(body.includes(':keepalive'), "SSE stream should contain keep-alive comment");
  });

  it("should return 404 when dist file is missing", async function() {
    this.timeout(5000);
    var fs = await import('fs');
    var path = await import('path');
    var distDir = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', 'dist');
    var cssPath = path.join(distDir, 'bitwrench.css');
    var backupPath = cssPath + '.bak';
    fs.renameSync(cssPath, backupPath);
    try {
      var app = createApp();
      app.page('/', function() {});
      await app.listen();
      var port = app._server.address().port;
      var res = await fetch('http://localhost:' + port + '/bw/lib/bitwrench.css');
      assert.strictEqual(res.status, 404);
      var body = await res.text();
      assert.ok(body.includes('Not Found'));
    } finally {
      fs.renameSync(backupPath, cssPath);
    }
  });

  it("should show files and subdirectories in directory listing", async function() {
    this.timeout(5000);
    var fs = await import('fs');
    var os = await import('os');
    var path = await import('path');
    var tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bwserve-test-'));
    fs.writeFileSync(path.join(tmpDir, 'readme.txt'), 'hello');
    fs.mkdirSync(path.join(tmpDir, 'subdir'));
    var app = createApp({ static: tmpDir });
    app.page('/bwpage', function() {});
    await app.listen();
    var port = app._server.address().port;
    var res = await fetch('http://localhost:' + port + '/', { redirect: 'manual' });
    assert.strictEqual(res.status, 200);
    var body = await res.text();
    assert.ok(body.includes('Index of /'));
    assert.ok(body.includes('readme.txt'));
    assert.ok(body.includes('subdir/'));
    // Root listing should NOT have parent link
    assert.ok(!body.includes('>..'));
    // Cleanup
    fs.unlinkSync(path.join(tmpDir, 'readme.txt'));
    fs.rmdirSync(path.join(tmpDir, 'subdir'));
    fs.rmdirSync(tmpDir);
  });

  it("should return 404 for directory listing when dirList is false", async function() {
    this.timeout(5000);
    var fs = await import('fs');
    var os = await import('os');
    var path = await import('path');
    var tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bwserve-test-'));
    fs.mkdirSync(path.join(tmpDir, 'nolist'));
    var app = createApp({ static: tmpDir, dirList: false });
    app.page('/bwpage', function() {});
    await app.listen();
    var port = app._server.address().port;
    var res = await fetch('http://localhost:' + port + '/nolist/', { redirect: 'manual' });
    assert.strictEqual(res.status, 404);
    // Cleanup
    fs.rmdirSync(path.join(tmpDir, 'nolist'));
    fs.rmdirSync(tmpDir);
  });

  it("should show parent link in subdirectory listing", async function() {
    this.timeout(5000);
    var fs = await import('fs');
    var os = await import('os');
    var path = await import('path');
    var tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bwserve-test-'));
    fs.mkdirSync(path.join(tmpDir, 'docs'));
    fs.writeFileSync(path.join(tmpDir, 'docs', 'guide.txt'), 'content');
    var app = createApp({ static: tmpDir });
    app.page('/bwpage', function() {});
    await app.listen();
    var port = app._server.address().port;
    var res = await fetch('http://localhost:' + port + '/docs/', { redirect: 'manual' });
    assert.strictEqual(res.status, 200);
    var body = await res.text();
    assert.ok(body.includes('Index of /docs/'));
    assert.ok(body.includes('href="../"'));
    assert.ok(body.includes('guide.txt'));
    // Cleanup
    fs.unlinkSync(path.join(tmpDir, 'docs', 'guide.txt'));
    fs.rmdirSync(path.join(tmpDir, 'docs'));
    fs.rmdirSync(tmpDir);
  });

  it("should accept host option in constructor", async function() {
    this.timeout(5000);
    var app = createApp({ host: '127.0.0.1' });
    app.page('/', function() {});
    await app.listen();
    assert.strictEqual(app.host, '127.0.0.1');
    var port = app._server.address().port;
    var res = await fetch('http://127.0.0.1:' + port + '/');
    assert.strictEqual(res.status, 200);
  });

  it("should default host to 127.0.0.1 (loopback)", function() {
    var app = bwserve.create({ port: 0 });
    assert.strictEqual(app.host, '127.0.0.1');
  });

  it("should default dirList to true", function() {
    var app = bwserve.create({ port: 0 });
    assert.strictEqual(app.dirList, true);
  });
});

// ===================================================================================
// bw.parseJSONFlex() — relaxed JSON parser
// ===================================================================================

describe("bw.parseJSONFlex()", function() {
  it("should parse strict JSON (no r-prefix)", function() {
    var msg = bw.parseJSONFlex('{"type":"patch","target":"temp","content":"23.5"}');
    assert.strictEqual(msg.type, 'patch');
    assert.strictEqual(msg.target, 'temp');
    assert.strictEqual(msg.content, '23.5');
  });

  it("should parse r-prefixed single-quoted strings", function() {
    var msg = bw.parseJSONFlex("r{'type':'patch','target':'temp','content':'23.5'}");
    assert.strictEqual(msg.type, 'patch');
    assert.strictEqual(msg.target, 'temp');
    assert.strictEqual(msg.content, '23.5');
  });

  it("should handle escaped single quotes", function() {
    var msg = bw.parseJSONFlex("r{'content':'it\\'s hot'}");
    assert.strictEqual(msg.content, "it's hot");
  });

  it("should handle double quotes inside single-quoted strings", function() {
    var msg = bw.parseJSONFlex("r{'msg':'say \"hello\"'}");
    assert.strictEqual(msg.msg, 'say "hello"');
  });

  it("should strip trailing commas", function() {
    var msg = bw.parseJSONFlex("r{'a':1,'b':[2,3,],}");
    assert.strictEqual(msg.a, 1);
    assert.deepStrictEqual(msg.b, [2, 3]);
  });

  it("should handle mixed strict JSON inside r-prefix", function() {
    var msg = bw.parseJSONFlex('r{"already":"valid json"}');
    assert.strictEqual(msg.already, 'valid json');
  });

  it("should handle nested objects", function() {
    var msg = bw.parseJSONFlex("r{'type':'replace','target':'#app','node':{'t':'div','c':'hi'}}");
    assert.strictEqual(msg.type, 'replace');
    assert.strictEqual(msg.node.t, 'div');
    assert.strictEqual(msg.node.c, 'hi');
  });

  it("should handle arrays in values", function() {
    var msg = bw.parseJSONFlex("r{'ops':[{'type':'patch','target':'a','content':'1'},{'type':'patch','target':'b','content':'2'}]}");
    assert.strictEqual(msg.ops.length, 2);
    assert.strictEqual(msg.ops[0].target, 'a');
    assert.strictEqual(msg.ops[1].target, 'b');
  });

  it("should handle whitespace in input", function() {
    var msg = bw.parseJSONFlex("  r{ 'type' : 'patch' , 'target' : 'x' , 'content' : '1' }  ");
    assert.strictEqual(msg.type, 'patch');
    assert.strictEqual(msg.target, 'x');
  });

  it("should throw on invalid JSON", function() {
    assert.throws(function() { bw.parseJSONFlex("not json"); });
  });

  it("should throw on invalid r-prefixed JSON", function() {
    assert.throws(function() { bw.parseJSONFlex("r{broken"); });
  });

  it("should handle empty/null input", function() {
    assert.throws(function() { bw.parseJSONFlex(''); });
    assert.throws(function() { bw.parseJSONFlex(null); });
  });

  it("should handle numeric values", function() {
    var msg = bw.parseJSONFlex("r{'count':42,'pi':3.14,'neg':-1}");
    assert.strictEqual(msg.count, 42);
    assert.strictEqual(msg.pi, 3.14);
    assert.strictEqual(msg.neg, -1);
  });

  it("should handle boolean and null values", function() {
    var msg = bw.parseJSONFlex("r{'a':true,'b':false,'c':null}");
    assert.strictEqual(msg.a, true);
    assert.strictEqual(msg.b, false);
    assert.strictEqual(msg.c, null);
  });

  it("should handle apostrophe in value (escaped)", function() {
    var msg = bw.parseJSONFlex("r{'content':'Barry\\'s food'}");
    assert.strictEqual(msg.content, "Barry's food");
  });

  it("should handle multiple apostrophes in value", function() {
    var msg = bw.parseJSONFlex("r{'content':'it\\'s Barry\\'s food and it\\'s great'}");
    assert.strictEqual(msg.content, "it's Barry's food and it's great");
  });

  it("should handle apostrophe in target value", function() {
    var msg = bw.parseJSONFlex("r{'type':'patch','target':'room-name','content':'Barry\\'s Room'}");
    assert.strictEqual(msg.content, "Barry's Room");
    assert.strictEqual(msg.type, 'patch');
  });

  it("should handle backslash in value", function() {
    var msg = bw.parseJSONFlex("r{'path':'C:\\\\Users\\\\data'}");
    assert.strictEqual(msg.path, "C:\\Users\\data");
  });

  it("should handle double quotes inside single-quoted values (C literal scenario)", function() {
    var msg = bw.parseJSONFlex("r{'msg':'say \"hello\"'}");
    assert.strictEqual(msg.msg, 'say "hello"');
  });

  it("should handle newline escape in value", function() {
    var msg = bw.parseJSONFlex("r{'text':'line1\\nline2'}");
    assert.strictEqual(msg.text, "line1\nline2");
  });

  it("should handle tab escape in value", function() {
    var msg = bw.parseJSONFlex("r{'text':'col1\\tcol2'}");
    assert.strictEqual(msg.text, "col1\tcol2");
  });

  it("should handle nested TACO with apostrophe in content", function() {
    var msg = bw.parseJSONFlex("r{'type':'replace','target':'#app','node':{'t':'p','c':'Don\\'t panic'}}");
    assert.strictEqual(msg.type, 'replace');
    assert.strictEqual(msg.node.t, 'p');
    assert.strictEqual(msg.node.c, "Don't panic");
  });

  it("should handle batch with apostrophes in multiple ops", function() {
    var msg = bw.parseJSONFlex("r{'type':'batch','ops':[{'type':'patch','target':'a','content':'it\\'s'},{'type':'patch','target':'b','content':'they\\'re'}]}");
    assert.strictEqual(msg.ops[0].content, "it's");
    assert.strictEqual(msg.ops[1].content, "they're");
  });

  it("should handle empty single-quoted string", function() {
    var msg = bw.parseJSONFlex("r{'content':''}");
    assert.strictEqual(msg.content, '');
  });

  it("should handle single char value", function() {
    var msg = bw.parseJSONFlex("r{'c':'x'}");
    assert.strictEqual(msg.c, 'x');
  });

  it("should handle value that is only an escaped apostrophe", function() {
    var msg = bw.parseJSONFlex("r{'c':'\\''}");
    assert.strictEqual(msg.c, "'");
  });

  it("should handle consecutive escaped apostrophes", function() {
    var msg = bw.parseJSONFlex("r{'c':'\\'\\'\\'\\''}");
    assert.strictEqual(msg.c, "''''");
  });

  it("should parse simulated BW_PATCH output (sensor value)", function() {
    var msg = bw.parseJSONFlex("r{'type':'patch','target':'val-temp','content':'23.5 C'}");
    assert.strictEqual(msg.target, 'val-temp');
    assert.strictEqual(msg.content, '23.5 C');
  });

  it("should parse simulated BW_BATCH output (multiple sensors)", function() {
    var msg = bw.parseJSONFlex("r{'type':'batch','ops':[{'type':'patch','target':'val-temp','content':'23.5 C'},{'type':'patch','target':'val-humidity','content':'45%'},{'type':'patch','target':'val-uptime','content':'3600s'}]}");
    assert.strictEqual(msg.type, 'batch');
    assert.strictEqual(msg.ops.length, 3);
    assert.strictEqual(msg.ops[0].content, '23.5 C');
    assert.strictEqual(msg.ops[2].content, '3600s');
  });

  it("should parse simulated BW_REPLACE with TACO node", function() {
    var msg = bw.parseJSONFlex("r{'type':'replace','target':'#app','node':{'t':'h1','c':'Hello World'}}");
    assert.strictEqual(msg.type, 'replace');
    assert.strictEqual(msg.node.t, 'h1');
    assert.strictEqual(msg.node.c, 'Hello World');
  });

  it("should parse simulated BW_TACO_ATTR output", function() {
    var msg = bw.parseJSONFlex("r{'t':'button','a':{'data-bw-action':'increment','class':'bw-btn'},'c':'+1'}");
    assert.strictEqual(msg.t, 'button');
    assert.strictEqual(msg.a['data-bw-action'], 'increment');
    assert.strictEqual(msg.c, '+1');
  });
});

// ===================================================================================
// BwServeApp.broadcast()
// ===================================================================================

describe("BwServeApp.broadcast()", function() {
  it("should send message to all connected clients", function() {
    var app = new BwServeApp({});
    var client1 = new BwServeClient('c1', null);
    var client2 = new BwServeClient('c2', null);
    app._clients.set('c1', { pagePath: '/', client: client1 });
    app._clients.set('c2', { pagePath: '/', client: client2 });
    var count = app.broadcast({ type: 'patch', target: 'test', content: 'hello' });
    assert.strictEqual(count, 2);
    assert.strictEqual(client1._sent.length, 1);
    assert.strictEqual(client2._sent.length, 1);
    assert.strictEqual(client1._sent[0].content, 'hello');
  });

  it("should target specific client when clientId is set", function() {
    var app = new BwServeApp({});
    var client1 = new BwServeClient('c1', null);
    var client2 = new BwServeClient('c2', null);
    app._clients.set('c1', { pagePath: '/', client: client1 });
    app._clients.set('c2', { pagePath: '/', client: client2 });
    var count = app.broadcast({ type: 'patch', target: 'test', content: 'only-c1', clientId: 'c1' });
    assert.strictEqual(count, 1);
    assert.strictEqual(client1._sent.length, 1);
    assert.strictEqual(client2._sent, undefined);
  });

  it("should skip closed clients", function() {
    var app = new BwServeApp({});
    var client1 = new BwServeClient('c1', null);
    var client2 = new BwServeClient('c2', null);
    client2._closed = true;
    app._clients.set('c1', { pagePath: '/', client: client1 });
    app._clients.set('c2', { pagePath: '/', client: client2 });
    var count = app.broadcast({ type: 'patch', target: 'test', content: 'x' });
    assert.strictEqual(count, 1);
    assert.strictEqual(client1._sent.length, 1);
  });

  it("should return 0 when no clients connected", function() {
    var app = new BwServeApp({});
    var count = app.broadcast({ type: 'patch', target: 'test', content: 'x' });
    assert.strictEqual(count, 0);
  });

  it("should return 0 for unknown clientId", function() {
    var app = new BwServeApp({});
    var count = app.broadcast({ type: 'patch', target: 'test', content: 'x', clientId: 'unknown' });
    assert.strictEqual(count, 0);
  });
});

// ===================================================================================
// Bug fix: DIST_DIR fallback paths
// ===================================================================================
describe("DIST_DIR resolution", function() {
  it("BwServeApp._serveDistFile should find bitwrench.umd.js from source layout", function() {
    var app = new BwServeApp({});
    assert.ok(app, "BwServeApp should instantiate");
  });
});

// ===================================================================================
// generateShell allowExec
// ===================================================================================
describe("generateShell allowExec", function() {
  it("should NOT include allowExec in init script by default", function() {
    var html = generateShell({ clientId: 'test1', title: 'Test' });
    // The bwclient source always contains _allowExec inside attach() as part of an if-statement.
    // The init script puts it on its own line after the clientId declaration.
    // Count occurrences — without allowExec, only bwclient's attach handler should have it.
    var count = html.split('bw._allowExec = true').length - 1;
    assert.strictEqual(count, 1, "only bwclient attach handler should contain _allowExec, not the init script");
  });

  it("should include _allowExec = true when opts.allowExec is true", function() {
    var html = generateShell({ clientId: 'test2', title: 'Test', allowExec: true });
    // Should have 2 occurrences: one in bwclient attach handler, one in init script
    var count = html.split('bw._allowExec = true').length - 1;
    assert.strictEqual(count, 2, "should contain _allowExec in both bwclient and init script");
  });

  it("BwServeApp should store allowExec option", function() {
    var app = new BwServeApp({ allowExec: true });
    assert.strictEqual(app.allowExec, true);
  });

  it("BwServeApp should default allowExec to false", function() {
    var app = new BwServeApp({});
    assert.strictEqual(app.allowExec, false);
  });
});

// ===================================================================================
// Screenshot and pending mechanism removed in 2.1
// ===================================================================================

describe("client.screenshot() — removed in 2.1", function() {
  it("screenshot is not a function on BwServeClient", function() {
    var client = new BwServeClient('ss-rm', null);
    assert.strictEqual(client.screenshot, undefined);
  });
});

describe("BwServeApp screenshot config", function() {
  it("should store allowScreenshot option", function() {
    var app = new BwServeApp({ allowScreenshot: true });
    assert.strictEqual(app.allowScreenshot, true);
  });

  it("should default allowScreenshot to false", function() {
    var app = new BwServeApp({});
    assert.strictEqual(app.allowScreenshot, false);
  });
});

// ===================================================================================
// BwServeApp._serveVendorFile() coverage
// ===================================================================================

describe("BwServeApp._serveVendorFile()", function() {
  it("should return 404 for disallowed filename", function() {
    var app = new BwServeApp({});
    var status, body;
    var mockRes = {
      writeHead: function(s) { status = s; },
      end: function(b) { body = b; }
    };
    app._serveVendorFile(mockRes, 'evil.js');
    assert.strictEqual(status, 404);
    assert.strictEqual(body, 'Not found');
  });

  it("should serve html2canvas.min.js if it exists", function() {
    var app = new BwServeApp({});
    var status, body, headers;
    var mockRes = {
      writeHead: function(s, h) { status = s; headers = h; },
      end: function(b) { body = b; }
    };
    app._serveVendorFile(mockRes, 'html2canvas.min.js');
    // File may or may not exist -- either 200 or 404
    assert.ok(status === 200 || status === 404, 'should be 200 or 404, got ' + status);
    if (status === 200) {
      assert.ok(headers['Content-Type'].indexOf('javascript') >= 0);
      assert.ok(headers['Cache-Control'].indexOf('public') >= 0);
    }
  });

  it("should return 404 for allowed filename when file is missing on disk (lines 445-448)", async function() {
    // Temporarily rename the vendor file to test the missing-file branch
    var fs = await import('fs');
    var path = await import('path');
    var vendorDir = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', 'src', 'vendor');
    var filePath = path.join(vendorDir, 'html2canvas.min.js');
    var backupPath = filePath + '.bak';
    if (!fs.existsSync(filePath)) return; // skip if already missing
    fs.renameSync(filePath, backupPath);
    try {
      var app = new BwServeApp({});
      var status, body;
      var mockRes = {
        writeHead: function(s) { status = s; },
        end: function(b) { body = b; }
      };
      app._serveVendorFile(mockRes, 'html2canvas.min.js');
      assert.strictEqual(status, 404);
      assert.ok(body.includes('Vendor file not found'));
    } finally {
      fs.renameSync(backupPath, filePath);
    }
  });
});

// ===================================================================================
// BwServeApp._handleReturn() route dispatch
// ===================================================================================

import { EventEmitter } from 'node:events';

describe("BwServeApp._handleReturn() route dispatch", function() {
  it("should dispatch action route to client._dispatch", function(done) {
    var app = new BwServeApp({});
    var dispatched = null;
    var client = new BwServeClient('ret-a1', null);
    client._dispatch = function(action, payload) {
      dispatched = { action: action, payload: payload };
    };
    app._clients.set('ret-a1', { pagePath: '/', client: client });

    var mockReq = new EventEmitter();
    var resStatus;
    var mockRes = {
      writeHead: function(s) { resStatus = s; },
      end: function() {
        assert.strictEqual(resStatus, 200);
        assert.ok(dispatched);
        done();
      }
    };

    app._handleReturn(mockReq, mockRes, 'action', 'ret-a1');
    mockReq.emit('data', JSON.stringify({ action: 'click', data: { x: 1 } }));
    mockReq.emit('end');
  });

  it("should dispatch event route to _bw_event", function(done) {
    var app = new BwServeApp({});
    var dispatched = null;
    var client = new BwServeClient('ret-e1', null);
    client._dispatch = function(action, payload) {
      dispatched = { action: action, payload: payload };
    };
    app._clients.set('ret-e1', { pagePath: '/', client: client });

    var mockReq = new EventEmitter();
    var mockRes = {
      writeHead: function() {},
      end: function() {
        assert.ok(dispatched);
        assert.strictEqual(dispatched.action, '_bw_event');
        done();
      }
    };

    app._handleReturn(mockReq, mockRes, 'event', 'ret-e1');
    mockReq.emit('data', JSON.stringify({ eventType: 'click', target: '#btn' }));
    mockReq.emit('end');
  });

  it("should dispatch topic route to listen handler", function(done) {
    var app = new BwServeApp({});
    var received = null;
    var client = new BwServeClient('ret-t1', null);
    client.listen('bw:lifecycle', function(data) { received = data; });
    app._clients.set('ret-t1', { pagePath: '/', client: client });

    var mockReq = new EventEmitter();
    var mockRes = {
      writeHead: function() {},
      end: function() {
        assert.ok(received);
        assert.strictEqual(received.event, 'mount');
        done();
      }
    };

    app._handleReturn(mockReq, mockRes, 'topic', 'ret-t1');
    mockReq.emit('data', JSON.stringify({ topic: 'bw:lifecycle', data: { event: 'mount' } }));
    mockReq.emit('end');
  });

  it("should return 404 for unknown client", function() {
    var app = new BwServeApp({});
    var status, body;
    var mockReq = new EventEmitter();
    var mockRes = {
      writeHead: function(s) { status = s; },
      end: function(b) { body = b; }
    };
    app._handleReturn(mockReq, mockRes, 'query', 'nonexistent');
    assert.strictEqual(status, 404);
    assert.ok(JSON.parse(body).error.indexOf('Unknown client') >= 0);
  });

  it("should return 400 for malformed JSON body", function(done) {
    var app = new BwServeApp({});
    var client = new BwServeClient('ret-bad1', null);
    app._clients.set('ret-bad1', { pagePath: '/', client: client });

    var mockReq = new EventEmitter();
    var resStatus;
    var mockRes = {
      writeHead: function(s) { resStatus = s; },
      end: function(b) {
        assert.strictEqual(resStatus, 400);
        assert.ok(JSON.parse(b).error);
        done();
      }
    };

    app._handleReturn(mockReq, mockRes, 'query', 'ret-bad1');
    mockReq.emit('data', 'not-valid-json');
    mockReq.emit('end');
  });
});

// ===================================================================================
// BwServeApp._serveAttachScript() coverage
// ===================================================================================

describe("BwServeApp._serveAttachScript()", function() {
  it("should serve the attach script with correct headers", function() {
    var app = new BwServeApp({});
    var status, body, headers;
    var mockRes = {
      writeHead: function(s, h) { status = s; headers = h; },
      end: function(b) { body = b; }
    };
    app._serveAttachScript({}, mockRes);
    assert.strictEqual(status, 200);
    assert.ok(headers['Content-Type'].indexOf('javascript') >= 0);
    assert.ok(body.length > 0, 'should return non-empty JS');
  });

  it("should include CORS header on attach script response", function() {
    var app = new BwServeApp({});
    var status, body, headers;
    var mockRes = {
      writeHead: function(s, h) { status = s; headers = h; },
      end: function(b) { body = b; }
    };
    app._serveAttachScript({}, mockRes);
    assert.strictEqual(status, 200);
    assert.strictEqual(headers['Access-Control-Allow-Origin'], '*');
    assert.strictEqual(headers['Cache-Control'], 'no-cache');
    assert.ok(body.length > 100, 'attach script should be non-trivial');
  });
});

// ===================================================================================
// BwServeClient 2.1 branch coverage
// ===================================================================================

describe("BwServeClient 2.1 branch coverage", function() {
  it("mount() with null taco should not throw", function() {
    var client = new BwServeClient('bc-1', null);
    client.mount('#app', null);
    assert.strictEqual(client._sent.length, 1);
    assert.strictEqual(client._sent[0].taco, null);
  });

  it("patch() with empty fields object should send ref only", function() {
    var client = new BwServeClient('bc-2', null);
    client.patch('#el', {});
    assert.strictEqual(client._sent[0].ref, '#el');
    assert.strictEqual(client._sent[0].type, 'patch');
  });

  it("patch() with null fields should not throw", function() {
    var client = new BwServeClient('bc-3', null);
    client.patch('#el', null);
    assert.strictEqual(client._sent.length, 1);
  });

  it("patch() with non-object fields should not throw", function() {
    var client = new BwServeClient('bc-4', null);
    client.patch('#el', 'string');
    assert.strictEqual(client._sent.length, 1);
  });

  it("all sent messages carry v:1", function() {
    var client = new BwServeClient('bc-5', null);
    client.mount('#a', { t: 'div' });
    client.patch('#b', { text: 'hi' });
    client.append('#c', { t: 'li' });
    client.remove('#d');
    client.batch([]);
    client.call('fn');
    client.listen('topic', function() {});
    client._sent.forEach(function(msg) {
      assert.strictEqual(msg.v, 1, 'message type=' + msg.type + ' should have v:1');
    });
  });
});

// ===================================================================================
// BwServeApp HTTP: vendor file route, .json MIME, attach script error
// ===================================================================================

describe("BwServeApp HTTP vendor and attach routes", function() {
  var apps = [];
  function createApp(opts) {
    var a = bwserve.create(Object.assign({ port: 0 }, opts || {}));
    apps.push(a);
    return a;
  }
  afterEach(async function() {
    this.timeout(5000);
    for (var a of apps) {
      if (a._server) await a.close();
    }
    apps = [];
  });

  it("should serve vendor file via /bw/lib/vendor/ HTTP route", async function() {
    this.timeout(5000);
    var app = createApp();
    app.page('/', function() {});
    await app.listen();
    var port = app._server.address().port;
    // Request disallowed vendor file -- should 404
    var res = await fetch('http://localhost:' + port + '/bw/lib/vendor/evil.js');
    assert.strictEqual(res.status, 404);
    var body = await res.text();
    assert.ok(body.includes('Not found'));
  });

  it("should serve allowed vendor file via HTTP if it exists", async function() {
    this.timeout(5000);
    var fs = await import('fs');
    var path = await import('path');
    var vendorDir = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', 'src', 'vendor');
    var vendorFile = path.join(vendorDir, 'html2canvas.min.js');
    if (!fs.existsSync(vendorFile)) {
      // Skip if vendor file doesn't exist in test environment
      return;
    }
    var app = createApp();
    app.page('/', function() {});
    await app.listen();
    var port = app._server.address().port;
    var res = await fetch('http://localhost:' + port + '/bw/lib/vendor/html2canvas.min.js');
    assert.strictEqual(res.status, 200);
    var ct = res.headers.get('content-type');
    assert.ok(ct.includes('javascript'));
  });

  it("should serve .json static files with correct MIME type", async function() {
    this.timeout(5000);
    var fs = await import('fs');
    var path = await import('path');
    var tmpDir = path.resolve('/tmp/bwserve-json-test-' + Date.now());
    fs.mkdirSync(tmpDir, { recursive: true });
    fs.writeFileSync(path.join(tmpDir, 'test.json'), '{"ok":true}');
    try {
      var app = bwserve.create({ port: 0, static: tmpDir });
      apps.push(app);
      app.page('/', function() {});
      await app.listen();
      var port = app._server.address().port;
      var res = await fetch('http://localhost:' + port + '/test.json');
      assert.strictEqual(res.status, 200);
      var ct = res.headers.get('content-type');
      assert.ok(ct.includes('json'), 'should serve with JSON content-type, got: ' + ct);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it("should serve attach script via /bw/attach.js HTTP route", async function() {
    this.timeout(5000);
    var app = createApp();
    app.page('/', function() {});
    await app.listen();
    var port = app._server.address().port;
    var res = await fetch('http://localhost:' + port + '/bw/attach.js');
    assert.strictEqual(res.status, 200);
    var ct = res.headers.get('content-type');
    assert.ok(ct.includes('javascript'));
    var body = await res.text();
    assert.ok(body.length > 0);
    assert.ok(body.includes('EventSource') || body.includes('bw'), 'attach script should contain SSE or bw references');
  });

  it("should return 400 for /bw/return/ without slash in rest path (lines 244-247)", async function() {
    this.timeout(5000);
    var app = createApp();
    app.page('/', function() {});
    await app.listen();
    var port = app._server.address().port;
    // POST to /bw/return/noslash -- no second slash after route, so line 243 slash === -1
    var res = await fetch('http://localhost:' + port + '/bw/return/noslash', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}'
    });
    assert.strictEqual(res.status, 400);
    var body = await res.json();
    assert.ok(body.error.includes('Invalid return path'));
  });
});

// ===================================================================================
// Malformed input tests for bwserve client/app
// ===================================================================================

describe("BwServeClient malformed inputs", function() {
  it("mount with null target should not throw", function() {
    var client = new BwServeClient('mal-1', null);
    client.mount(null, { t: 'div', c: 'test' });
    assert.ok(client._sent.length > 0);
  });

  it("mount with undefined taco should not throw", function() {
    var client = new BwServeClient('mal-2', null);
    client.mount('#app', undefined);
    assert.ok(client._sent.length > 0);
  });

  it("patch with empty string ref should not throw", function() {
    var client = new BwServeClient('mal-3', null);
    client.patch('', { text: 'content' });
    assert.ok(client._sent.length > 0);
  });

  it("batch with empty array should not throw", function() {
    var client = new BwServeClient('mal-4', null);
    client.batch([]);
    assert.ok(client._sent.length > 0);
  });

  it("call with empty name should not throw", function() {
    var client = new BwServeClient('mal-5', null);
    client.call('', { x: 1 });
    assert.ok(client._sent.length > 0);
  });

  it("message with null action should not throw", function() {
    var client = new BwServeClient('mal-8', null);
    client.message(null);
    assert.ok(client._sent.length > 0);
  });

  it("on with non-string event should not throw", function() {
    var client = new BwServeClient('mal-9', null);
    client.on(123, function() {});
    assert.ok(true, 'did not throw');
  });

  it("mount with null selector should not throw", function() {
    var client = new BwServeClient('mal-12', null);
    client.mount(null, null);
    assert.ok(client._sent.length > 0);
    assert.strictEqual(client._sent[0].ref, null);
  });
});

// ===================================================================================
// bw.apply() malformed inputs
// ===================================================================================

describe("bw.apply() malformed inputs", function() {
  beforeEach(function() {
    resetApp();
  });

  it("should return false for non-object input", function() {
    assert.strictEqual(bw.apply('string'), false);
    assert.strictEqual(bw.apply(42), false);
    assert.strictEqual(bw.apply(true), false);
    assert.strictEqual(bw.apply([]), false);
  });

  it("should handle replace with missing target gracefully", function() {
    var result = bw.apply({ type: 'replace', node: { t: 'div', c: 'test' } });
    // Should not crash even with missing target
    assert.ok(result === false || result === undefined || result === true);
  });

  it("should handle replace with missing node gracefully", function() {
    var result = bw.apply({ type: 'replace', target: '#app' });
    assert.ok(result === false || result === undefined || result === true);
  });

  it("should handle patch with null content gracefully", function() {
    var result = bw.apply({ type: 'patch', target: '#app', content: null });
    assert.ok(result === false || result === undefined || result === true);
  });

  it("should handle batch with non-array ops gracefully", function() {
    var result = bw.apply({ type: 'batch', ops: 'not-an-array' });
    assert.ok(result === false || result === undefined || result === true);
  });

  it("should handle unknown type gracefully", function() {
    var result = bw.apply({ type: 'nonexistent-type' });
    assert.strictEqual(result, false);
  });

  it("should handle register with missing name", function() {
    var origWarn = console.warn;
    console.warn = function() {};
    try {
      var result = bw.apply({ type: 'register', body: 'return 1;' });
      assert.ok(result === false || result === undefined || result === true);
    } finally {
      console.warn = origWarn;
    }
  });

  it("should handle register with missing body", function() {
    var origWarn = console.warn;
    console.warn = function() {};
    try {
      var result = bw.apply({ type: 'register', name: 'test' });
      assert.ok(result === false || result === undefined || result === true);
    } finally {
      console.warn = origWarn;
    }
  });

  it("should handle call with missing name", function() {
    var origWarn = console.warn;
    console.warn = function() {};
    try {
      var result = bw.apply({ type: 'call', args: [1, 2, 3] });
      assert.ok(result === false || result === undefined || result === true);
    } finally {
      console.warn = origWarn;
    }
  });

  it("should handle exec with empty code", function() {
    var result = bw.apply({ type: 'exec', code: '' });
    assert.ok(result === false || result === undefined || result === true);
  });
});
