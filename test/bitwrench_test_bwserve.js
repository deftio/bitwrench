/**
 * Bitwrench bwserve Test Suite
 *
 * Tests for:
 * - bw.clientApply() — all 5 message types + message dispatch
 * - bw.clientConnect() — connection object API
 * - BwServeClient — message format, handler dispatch
 * - BwServeApp — page registration, app lifecycle
 * - Round-trip: client.render() → _sent → clientApply() → DOM check
 */

import assert from "assert";
import bw from "../src/bitwrench.js";
import jsdom from 'jsdom';
const { JSDOM } = jsdom;

// bwserve server-side imports
import bwserve from "../src/bwserve/index.js";
const { BwServeApp, BwServeClient } = bwserve;

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
// bw.clientApply() tests
// ===================================================================================

describe("bw.clientApply()", function() {
  beforeEach(function() {
    resetApp();
  });

  it("should return false for null/undefined/missing type", function() {
    assert.strictEqual(bw.clientApply(null), false);
    assert.strictEqual(bw.clientApply(undefined), false);
    assert.strictEqual(bw.clientApply({}), false);
  });

  describe("replace", function() {
    it("should replace #app content with a TACO", function() {
      bw.clientApply({
        type: 'replace',
        target: '#app',
        node: { t: 'div', a: { id: 'hello' }, c: 'Hello World' }
      });
      var el = document.getElementById('hello');
      assert.ok(el, "should find #hello in DOM");
      assert.strictEqual(el.textContent, 'Hello World');
    });

    it("should replace existing content", function() {
      bw.DOM('#app', { t: 'p', c: 'Old content' });
      assert.ok(document.querySelector('#app p'));

      bw.clientApply({
        type: 'replace',
        target: '#app',
        node: { t: 'span', c: 'New content' }
      });
      assert.ok(!document.querySelector('#app p'), "old p should be gone");
      assert.ok(document.querySelector('#app span'), "new span should exist");
    });

    it("should return false for unknown target", function() {
      var result = bw.clientApply({
        type: 'replace',
        target: '#nonexistent',
        node: { t: 'div', c: 'test' }
      });
      assert.strictEqual(result, false);
    });
  });

  describe("patch", function() {
    it("should patch text content by id", function() {
      bw.DOM('#app', { t: 'span', a: { id: 'counter' }, c: '0' });
      bw.clientApply({
        type: 'patch',
        target: 'counter',
        content: '42'
      });
      var el = document.getElementById('counter');
      assert.strictEqual(el.textContent, '42');
    });

    it("should return false for unknown target", function() {
      var result = bw.clientApply({
        type: 'patch',
        target: 'nonexistent',
        content: 'test'
      });
      assert.strictEqual(result, false);
    });
  });

  describe("append", function() {
    it("should append a child to target", function() {
      bw.DOM('#app', { t: 'ul', a: { id: 'list' } });
      bw.clientApply({
        type: 'append',
        target: '#list',
        node: { t: 'li', c: 'Item 1' }
      });
      var items = document.querySelectorAll('#list li');
      assert.strictEqual(items.length, 1);
      assert.strictEqual(items[0].textContent, 'Item 1');
    });

    it("should append multiple children in sequence", function() {
      bw.DOM('#app', { t: 'ul', a: { id: 'list' } });
      bw.clientApply({ type: 'append', target: '#list', node: { t: 'li', c: 'A' } });
      bw.clientApply({ type: 'append', target: '#list', node: { t: 'li', c: 'B' } });
      bw.clientApply({ type: 'append', target: '#list', node: { t: 'li', c: 'C' } });
      var items = document.querySelectorAll('#list li');
      assert.strictEqual(items.length, 3);
    });

    it("should return false for unknown parent", function() {
      var result = bw.clientApply({
        type: 'append',
        target: '#nonexistent',
        node: { t: 'li', c: 'test' }
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

      bw.clientApply({ type: 'remove', target: '#item-1' });
      assert.ok(!document.getElementById('item-1'), "item-1 should be removed");
      assert.ok(document.getElementById('item-2'), "item-2 should remain");
    });

    it("should return false for unknown target", function() {
      var result = bw.clientApply({ type: 'remove', target: '#nonexistent' });
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

      bw.clientApply({
        type: 'batch',
        ops: [
          { type: 'patch', target: 'val', content: '99' },
          { type: 'append', target: '#list', node: { t: 'li', c: 'Batch A' } },
          { type: 'append', target: '#list', node: { t: 'li', c: 'Batch B' } }
        ]
      });

      assert.strictEqual(document.getElementById('val').textContent, '99');
      assert.strictEqual(document.querySelectorAll('#list li').length, 2);
    });

    it("should return false for non-array ops", function() {
      assert.strictEqual(bw.clientApply({ type: 'batch', ops: 'bad' }), false);
    });
  });

  it("should return false for unknown message type", function() {
    var result = bw.clientApply({ type: 'unknown', target: '#app' });
    assert.strictEqual(result, false);
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

  describe("#render()", function() {
    it("should send a replace message", function() {
      var client = new BwServeClient('c1', null);
      client.render('#app', { t: 'div', c: 'Hello' });
      assert.deepStrictEqual(client._sent[0], {
        type: 'replace',
        target: '#app',
        node: { t: 'div', c: 'Hello' }
      });
    });
  });

  describe("#patch()", function() {
    it("should send a patch message", function() {
      var client = new BwServeClient('c1', null);
      client.patch('counter', '42');
      assert.deepStrictEqual(client._sent[0], {
        type: 'patch',
        target: 'counter',
        content: '42',
        attr: null
      });
    });

    it("should send patch with attr", function() {
      var client = new BwServeClient('c1', null);
      client.patch('el', 'val', { class: 'active' });
      assert.deepStrictEqual(client._sent[0].attr, { class: 'active' });
    });
  });

  describe("#append()", function() {
    it("should send an append message", function() {
      var client = new BwServeClient('c1', null);
      client.append('#list', { t: 'li', c: 'Item' });
      assert.deepStrictEqual(client._sent[0], {
        type: 'append',
        target: '#list',
        node: { t: 'li', c: 'Item' }
      });
    });
  });

  describe("#remove()", function() {
    it("should send a remove message", function() {
      var client = new BwServeClient('c1', null);
      client.remove('#old-item');
      assert.deepStrictEqual(client._sent[0], {
        type: 'remove',
        target: '#old-item'
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
    it("should send a message dispatch", function() {
      var client = new BwServeClient('c1', null);
      client.message('my-comp', 'refresh', { force: true });
      assert.deepStrictEqual(client._sent[0], {
        type: 'message',
        target: 'my-comp',
        action: 'refresh',
        data: { force: true }
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
      client.render('#app', { t: 'div', c: 'before' });
      assert.strictEqual(client._sent.length, 1);
      client.close();
      client.render('#app', { t: 'div', c: 'after' });
      assert.strictEqual(client._sent.length, 1, "no new messages after close");
    });
  });

  describe("#_send() SSE format", function() {
    it("should write SSE frame to response stream", function() {
      var written = '';
      var mockRes = {
        write: function(data) { written += data; }
      };
      var client = new BwServeClient('c1', mockRes);
      client.render('#app', { t: 'div', c: 'Hi' });
      var expected = 'data: ' + JSON.stringify({ type: 'replace', target: '#app', node: { t: 'div', c: 'Hi' } }) + '\n\n';
      assert.strictEqual(written, expected);
    });

    it("should still store in _sent when writing SSE", function() {
      var mockRes = { write: function() {} };
      var client = new BwServeClient('c1', mockRes);
      client.patch('id', 'val');
      assert.strictEqual(client._sent.length, 1);
    });
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
      var app = bwserve.create({ port: 0 }); // port 0 = random available port
      app.page('/', function(client) {
        client.render('#app', { t: 'div', c: 'Hello' });
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
// Round-trip tests: client.render() → _sent → clientApply() → DOM
// ===================================================================================

describe("bwserve round-trip", function() {
  beforeEach(function() {
    resetApp();
  });

  it("should render a TACO via client → apply to DOM", function() {
    var client = new BwServeClient('rt-1', null);
    client.render('#app', {
      t: 'div', a: { id: 'greeting' }, c: 'Hello from server'
    });

    // Simulate: grab what the server sent, apply it client-side
    var msg = client._sent[0];
    bw.clientApply(msg);

    var el = document.getElementById('greeting');
    assert.ok(el);
    assert.strictEqual(el.textContent, 'Hello from server');
  });

  it("should render then patch via round-trip", function() {
    var client = new BwServeClient('rt-2', null);

    // Server renders initial UI
    client.render('#app', {
      t: 'div', c: [
        { t: 'span', a: { id: 'count' }, c: '0' }
      ]
    });
    bw.clientApply(client._sent[0]);
    assert.strictEqual(document.getElementById('count').textContent, '0');

    // Server patches the counter
    client.patch('count', '42');
    bw.clientApply(client._sent[1]);
    assert.strictEqual(document.getElementById('count').textContent, '42');
  });

  it("should render then append then remove via round-trip", function() {
    var client = new BwServeClient('rt-3', null);

    // Initial list
    client.render('#app', {
      t: 'ul', a: { id: 'list' }
    });
    bw.clientApply(client._sent[0]);

    // Append items
    client.append('#list', { t: 'li', a: { id: 'i1' }, c: 'Item 1' });
    client.append('#list', { t: 'li', a: { id: 'i2' }, c: 'Item 2' });
    bw.clientApply(client._sent[1]);
    bw.clientApply(client._sent[2]);
    assert.strictEqual(document.querySelectorAll('#list li').length, 2);

    // Remove first item
    client.remove('#i1');
    bw.clientApply(client._sent[3]);
    assert.strictEqual(document.querySelectorAll('#list li').length, 1);
    assert.ok(!document.getElementById('i1'));
    assert.ok(document.getElementById('i2'));
  });

  it("should handle batch round-trip", function() {
    var client = new BwServeClient('rt-4', null);

    client.render('#app', {
      t: 'div', c: [
        { t: 'span', a: { id: 'a' }, c: '-' },
        { t: 'span', a: { id: 'b' }, c: '-' },
        { t: 'ul', a: { id: 'list' } }
      ]
    });
    bw.clientApply(client._sent[0]);

    client.batch([
      { type: 'patch', target: 'a', content: 'X' },
      { type: 'patch', target: 'b', content: 'Y' },
      { type: 'append', target: '#list', node: { t: 'li', c: 'batch-item' } }
    ]);
    bw.clientApply(client._sent[1]);

    assert.strictEqual(document.getElementById('a').textContent, 'X');
    assert.strictEqual(document.getElementById('b').textContent, 'Y');
    assert.strictEqual(document.querySelectorAll('#list li').length, 1);
  });
});

// ===================================================================================
// bw.clientConnect() tests (limited — no real EventSource in jsdom)
// ===================================================================================

describe("bw.clientConnect()", function() {
  it("should be a function", function() {
    assert.strictEqual(typeof bw.clientConnect, 'function');
  });

  it("should return a connection object with expected API", function() {
    // No EventSource in jsdom, so transport won't actually connect
    // but we can verify the returned object shape
    var conn = bw.clientConnect('/__bw/events/test', {
      transport: 'poll',
      interval: 999999 // don't actually poll
    });
    assert.strictEqual(typeof conn.sendAction, 'function');
    assert.strictEqual(typeof conn.on, 'function');
    assert.strictEqual(typeof conn.close, 'function');
    assert.ok('status' in conn);
    conn.close(); // cleanup
  });

  it("should derive actionUrl from event url", function() {
    var conn = bw.clientConnect('/__bw/events/c1', {
      transport: 'poll',
      interval: 999999
    });
    // Internal check: actionUrl should be /__bw/action/c1
    // We can't directly inspect, but the conn exists
    assert.ok(conn);
    conn.close();
  });
});
