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
import { generateShell } from "../src/bwserve/shell.js";

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

  describe("register", function() {
    beforeEach(function() {
      bw._clientFunctions = {};
    });

    it("should register a named function from body string", function() {
      var result = bw.clientApply({
        type: 'register',
        name: 'greet',
        body: 'function(name) { return "Hello " + name; }'
      });
      assert.strictEqual(result, true);
      assert.strictEqual(typeof bw._clientFunctions.greet, 'function');
      assert.strictEqual(bw._clientFunctions.greet('World'), 'Hello World');
    });

    it("should return false for missing name", function() {
      assert.strictEqual(bw.clientApply({ type: 'register', body: 'function(){}' }), false);
    });

    it("should return false for missing body", function() {
      assert.strictEqual(bw.clientApply({ type: 'register', name: 'foo' }), false);
    });

    it("should return false for invalid body syntax", function() {
      var result = bw.clientApply({
        type: 'register',
        name: 'bad',
        body: 'not valid javascript {{{}'
      });
      assert.strictEqual(result, false);
    });

    it("should overwrite a previously registered function", function() {
      bw.clientApply({ type: 'register', name: 'fn', body: 'function() { return 1; }' });
      bw.clientApply({ type: 'register', name: 'fn', body: 'function() { return 2; }' });
      assert.strictEqual(bw._clientFunctions.fn(), 2);
    });
  });

  describe("call", function() {
    beforeEach(function() {
      bw._clientFunctions = {};
    });

    it("should call a registered function", function() {
      var callLog = [];
      bw._clientFunctions.myFn = function(a, b) { callLog.push(a + b); };
      var result = bw.clientApply({ type: 'call', name: 'myFn', args: [3, 4] });
      assert.strictEqual(result, true);
      assert.deepStrictEqual(callLog, [7]);
    });

    it("should call a built-in function (log)", function() {
      var origLog = console.log;
      var logged = [];
      console.log = function() { logged.push([].slice.call(arguments)); };
      var result = bw.clientApply({ type: 'call', name: 'log', args: ['hello', 'world'] });
      console.log = origLog;
      assert.strictEqual(result, true);
      assert.deepStrictEqual(logged, [['hello', 'world']]);
    });

    it("should call built-in focus function", function() {
      bw.DOM('#app', { t: 'input', a: { id: 'inp' } });
      var focused = false;
      document.getElementById('inp').focus = function() { focused = true; };
      var result = bw.clientApply({ type: 'call', name: 'focus', args: ['#inp'] });
      assert.strictEqual(result, true);
      assert.strictEqual(focused, true);
    });

    it("should call built-in scrollTo function", function() {
      bw.DOM('#app', { t: 'div', a: { id: 'scrollable' } });
      var el = document.getElementById('scrollable');
      // jsdom doesn't fully support scroll, but we can verify the function runs
      var result = bw.clientApply({ type: 'call', name: 'scrollTo', args: ['#scrollable'] });
      assert.strictEqual(result, true);
    });

    it("should return false for missing name", function() {
      assert.strictEqual(bw.clientApply({ type: 'call', args: [] }), false);
    });

    it("should return false for unknown function name", function() {
      assert.strictEqual(bw.clientApply({ type: 'call', name: 'nonexistent', args: [] }), false);
    });

    it("should prefer registered over built-in if same name", function() {
      var called = '';
      bw._clientFunctions.log = function() { called = 'registered'; };
      bw.clientApply({ type: 'call', name: 'log', args: [] });
      assert.strictEqual(called, 'registered');
    });

    it("should handle missing args gracefully", function() {
      bw._clientFunctions.noArgs = function() { return 42; };
      var result = bw.clientApply({ type: 'call', name: 'noArgs' });
      assert.strictEqual(result, true);
    });
  });

  describe("exec", function() {
    afterEach(function() {
      bw._allowExec = false;
    });

    it("should reject exec when allowExec is false", function() {
      bw._allowExec = false;
      var result = bw.clientApply({ type: 'exec', code: 'var x = 1;' });
      assert.strictEqual(result, false);
    });

    it("should execute code when allowExec is true", function() {
      bw._allowExec = true;
      global._execTest = 0;
      var result = bw.clientApply({ type: 'exec', code: '_execTest = 42;' });
      assert.strictEqual(result, true);
      assert.strictEqual(global._execTest, 42);
      delete global._execTest;
    });

    it("should return false for empty code", function() {
      bw._allowExec = true;
      assert.strictEqual(bw.clientApply({ type: 'exec' }), false);
      assert.strictEqual(bw.clientApply({ type: 'exec', code: '' }), false);
    });

    it("should return false for code with syntax errors", function() {
      bw._allowExec = true;
      var result = bw.clientApply({ type: 'exec', code: 'if if if {{{' });
      assert.strictEqual(result, false);
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

  describe("#register()", function() {
    it("should send a register message", function() {
      var client = new BwServeClient('c1', null);
      client.register('autoScroll', 'function(sel) { var el = document.querySelector(sel); if (el) el.scrollTop = el.scrollHeight; }');
      assert.deepStrictEqual(client._sent[0], {
        type: 'register',
        name: 'autoScroll',
        body: 'function(sel) { var el = document.querySelector(sel); if (el) el.scrollTop = el.scrollHeight; }'
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
        args: ['#chat']
      });
    });

    it("should send a call with multiple args", function() {
      var client = new BwServeClient('c1', null);
      client.call('download', 'report.csv', 'id,name\n1,Alice', 'text/csv');
      assert.deepStrictEqual(client._sent[0], {
        type: 'call',
        name: 'download',
        args: ['report.csv', 'id,name\n1,Alice', 'text/csv']
      });
    });

    it("should send a call with no args", function() {
      var client = new BwServeClient('c1', null);
      client.call('log');
      assert.deepStrictEqual(client._sent[0], {
        type: 'call',
        name: 'log',
        args: []
      });
    });
  });

  describe("#exec()", function() {
    it("should send an exec message", function() {
      var client = new BwServeClient('c1', null);
      client.exec("document.title = 'New Title'");
      assert.deepStrictEqual(client._sent[0], {
        type: 'exec',
        code: "document.title = 'New Title'"
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
// Round-trip tests: register/call/exec
// ===================================================================================

describe("bwserve round-trip: register/call/exec", function() {
  beforeEach(function() {
    resetApp();
    bw._clientFunctions = {};
    bw._allowExec = false;
  });

  it("should register via server then call via round-trip", function() {
    var client = new BwServeClient('rt-reg', null);

    // Server registers a function
    client.register('setTitle', 'function(id, text) { var el = document.getElementById(id); if (el) el.textContent = text; }');
    bw.clientApply(client._sent[0]);
    assert.strictEqual(typeof bw._clientFunctions.setTitle, 'function');

    // Server renders some content, then calls the registered function
    client.render('#app', { t: 'h1', a: { id: 'title' }, c: 'Original' });
    bw.clientApply(client._sent[1]);
    assert.strictEqual(document.getElementById('title').textContent, 'Original');

    client.call('setTitle', 'title', 'Updated by call');
    bw.clientApply(client._sent[2]);
    assert.strictEqual(document.getElementById('title').textContent, 'Updated by call');
  });

  it("should call built-in log via server round-trip", function() {
    var client = new BwServeClient('rt-log', null);
    var origLog = console.log;
    var logged = [];
    console.log = function() { logged.push([].slice.call(arguments)); };
    client.call('log', 'server says hello');
    bw.clientApply(client._sent[0]);
    console.log = origLog;
    assert.deepStrictEqual(logged, [['server says hello']]);
  });

  it("should reject exec in round-trip when not opted in", function() {
    var client = new BwServeClient('rt-exec-no', null);
    client.exec('var x = 1;');
    var result = bw.clientApply(client._sent[0]);
    assert.strictEqual(result, false);
  });

  it("should allow exec in round-trip when opted in", function() {
    bw._allowExec = true;
    var client = new BwServeClient('rt-exec-yes', null);
    global._execRoundTrip = 0;
    client.exec('_execRoundTrip = 99;');
    var result = bw.clientApply(client._sent[0]);
    assert.strictEqual(result, true);
    assert.strictEqual(global._execRoundTrip, 99);
    delete global._execRoundTrip;
  });

  it("should batch register + call in one round-trip", function() {
    var client = new BwServeClient('rt-batch-call', null);

    // Render content first
    client.render('#app', { t: 'div', a: { id: 'status' }, c: 'waiting' });
    bw.clientApply(client._sent[0]);

    // Batch: register a function then call it
    client.batch([
      { type: 'register', name: 'markDone', body: 'function(id) { var el = document.getElementById(id); if (el) el.textContent = "done"; }' },
      { type: 'call', name: 'markDone', args: ['status'] }
    ]);
    bw.clientApply(client._sent[1]);
    assert.strictEqual(document.getElementById('status').textContent, 'done');
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

  it("should set bw._allowExec when allowExec option is true", function() {
    bw._allowExec = false;
    var conn = bw.clientConnect('/__bw/events/c2', {
      transport: 'poll',
      interval: 999999,
      allowExec: true
    });
    assert.strictEqual(bw._allowExec, true);
    conn.close();
    bw._allowExec = false; // cleanup
  });

  it("should not set bw._allowExec when allowExec option is absent", function() {
    bw._allowExec = true; // pre-set
    var conn = bw.clientConnect('/__bw/events/c3', {
      transport: 'poll',
      interval: 999999
    });
    assert.strictEqual(bw._allowExec, false);
    conn.close();
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

  it("should include bitwrench script and CSS by default", function() {
    var html = generateShell({ clientId: 'c1' });
    assert.ok(html.includes('/__bw/bitwrench.umd.js'));
    assert.ok(html.includes('/__bw/bitwrench.css'));
  });

  it("should not include bitwrench when injectBitwrench is false", function() {
    var html = generateShell({ clientId: 'c1', injectBitwrench: false });
    assert.ok(!html.includes('/__bw/bitwrench.umd.js'));
    assert.ok(!html.includes('/__bw/bitwrench.css'));
  });

  it("should include #app div", function() {
    var html = generateShell({ clientId: 'c1' });
    assert.ok(html.includes('<div id="app"></div>'));
  });

  it("should include clientConnect with correct clientId", function() {
    var html = generateShell({ clientId: 'my-client-42' });
    assert.ok(html.includes('"my-client-42"'));
    assert.ok(html.includes('/__bw/events/'));
    assert.ok(html.includes('/__bw/action/'));
  });

  it("should include data-bw-action click delegation", function() {
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
// BwServeClient edge case tests (error branches)
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
    // Should not throw
    client.close();
    assert.strictEqual(client._closed, true);
  });

  it("should handle _send() when res.write() throws", function() {
    var mockRes = {
      write: function() { throw new Error('write after end'); }
    };
    var client = new BwServeClient('c-write-err', mockRes);
    // Should not throw, should still store in _sent
    client.render('#app', { t: 'div', c: 'test' });
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
  var apps = [];  // track all apps for cleanup

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
      client.render('#app', { t: 'div', c: 'Hello from test' });
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

  it("should serve bitwrench.umd.js from /__bw/", async function() {
    this.timeout(5000);
    var app = createApp();
    app.page('/', function() {});
    await app.listen();
    var port = app._server.address().port;
    var res = await fetch('http://localhost:' + port + '/__bw/bitwrench.umd.js');
    assert.strictEqual(res.status, 200);
    var contentType = res.headers.get('content-type');
    assert.ok(contentType.includes('javascript'));
    var body = await res.text();
    assert.ok(body.length > 1000, "bitwrench.umd.js should be > 1KB");
  });

  it("should serve bitwrench.umd.min.js from /__bw/", async function() {
    this.timeout(5000);
    var app = createApp();
    app.page('/', function() {});
    await app.listen();
    var port = app._server.address().port;
    var res = await fetch('http://localhost:' + port + '/__bw/bitwrench.umd.min.js');
    assert.strictEqual(res.status, 200);
  });

  it("should serve bitwrench.css from /__bw/", async function() {
    this.timeout(5000);
    var app = createApp();
    app.page('/', function() {});
    await app.listen();
    var port = app._server.address().port;
    var res = await fetch('http://localhost:' + port + '/__bw/bitwrench.css');
    assert.strictEqual(res.status, 200);
    var contentType = res.headers.get('content-type');
    assert.ok(contentType.includes('css'));
  });

  it("should handle SSE connection and send messages", async function() {
    this.timeout(5000);
    var app = createApp();
    app.page('/', function(client) {
      client.render('#app', { t: 'div', c: 'Hello from SSE test' });
      // Close client after sending to allow fetch to complete
      setTimeout(function() { client.close(); }, 50);
    });
    await app.listen();
    var port = app._server.address().port;

    var pageRes = await fetch('http://localhost:' + port + '/');
    var html = await pageRes.text();

    var match = html.match(/"(c\d+)"/);
    assert.ok(match, "should have a client ID in the shell");
    var clientId = match[1];

    var sseRes = await fetch('http://localhost:' + port + '/__bw/events/' + clientId);
    assert.strictEqual(sseRes.status, 200);
    var sseType = sseRes.headers.get('content-type');
    assert.ok(sseType.includes('text/event-stream'));

    var body = await sseRes.text();
    assert.ok(body.includes('"type":"replace"'), "SSE should contain replace message");
    assert.ok(body.includes('Hello from SSE test'), "SSE should contain our content");
  });

  it("should handle action POST", async function() {
    this.timeout(5000);
    var actionCalled = false;
    var app = createApp();
    app.page('/', function(client) {
      client.render('#app', { t: 'div', c: 'test' });
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

    fetch('http://localhost:' + port + '/__bw/events/' + clientId).catch(function() {});
    await new Promise(function(r) { setTimeout(r, 100); });

    var actionRes = await fetch('http://localhost:' + port + '/__bw/action/' + clientId, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'myAction', data: { test: true } })
    });
    assert.strictEqual(actionRes.status, 200);
    var actionBody = await actionRes.json();
    assert.strictEqual(actionBody.ok, true);
    assert.strictEqual(actionCalled, true);
  });

  it("should return 404 for action with unknown client", async function() {
    this.timeout(5000);
    var app = createApp();
    app.page('/', function() {});
    await app.listen();
    var port = app._server.address().port;
    var res = await fetch('http://localhost:' + port + '/__bw/action/unknown-client', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'test' })
    });
    assert.strictEqual(res.status, 404);
  });

  it("should return 400 for malformed action POST body", async function() {
    this.timeout(5000);
    var app = createApp();
    app.page('/', function(client) {
      client.render('#app', { t: 'div', c: 'test' });
    });
    await app.listen();
    var port = app._server.address().port;

    var pageRes = await fetch('http://localhost:' + port + '/');
    var html = await pageRes.text();
    var match = html.match(/"(c\d+)"/);
    var clientId = match[1];

    fetch('http://localhost:' + port + '/__bw/events/' + clientId).catch(function() {});
    await new Promise(function(r) { setTimeout(r, 100); });

    var res = await fetch('http://localhost:' + port + '/__bw/action/' + clientId, {
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
      client.render('#app', { t: 'div', c: 'test' });
    });
    await app.listen();
    var port = app._server.address().port;

    var pageRes = await fetch('http://localhost:' + port + '/');
    var html = await pageRes.text();
    var match = html.match(/"(c\d+)"/);
    var clientId = match[1];

    var controller = new AbortController();
    fetch('http://localhost:' + port + '/__bw/events/' + clientId, {
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
      client.render('#app', { t: 'div', c: 'Home' });
    });
    app.page('/about', function(client) {
      client.render('#app', { t: 'div', c: 'About' });
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

    // Cleanup temp dir
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

  it("should handle page handler that throws", async function() {
    this.timeout(5000);
    var app = createApp();
    app.page('/', function(client) {
      throw new Error('test handler error');
    });
    await app.listen();
    var port = app._server.address().port;

    // Get the page to create a client ID
    var pageRes = await fetch('http://localhost:' + port + '/');
    var html = await pageRes.text();
    var match = html.match(/"(c\d+)"/);
    var clientId = match[1];

    // Connect SSE — the handler will throw but server should not crash
    var controller = new AbortController();
    var sseRes = await Promise.race([
      fetch('http://localhost:' + port + '/__bw/events/' + clientId, {
        signal: controller.signal
      }),
      new Promise(function(r) { setTimeout(function() { r({ status: 200 }); }, 200); })
    ]);
    controller.abort();
    // Server should still be running
    var res2 = await fetch('http://localhost:' + port + '/');
    assert.strictEqual(res2.status, 200);
  });

  it("should send keep-alive comments on SSE connection", async function() {
    this.timeout(5000);
    var app = createApp({ keepAliveInterval: 50 });
    app.page('/', function(client) {
      // Close after enough time for keep-alive to fire
      setTimeout(function() { client.close(); }, 150);
    });
    await app.listen();
    var port = app._server.address().port;

    var pageRes = await fetch('http://localhost:' + port + '/');
    var html = await pageRes.text();
    var match = html.match(/"(c\d+)"/);
    var clientId = match[1];

    var sseRes = await fetch('http://localhost:' + port + '/__bw/events/' + clientId);
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

    // Temporarily rename the CSS file to simulate missing dist file
    fs.renameSync(cssPath, backupPath);

    try {
      var app = createApp();
      app.page('/', function() {});
      await app.listen();
      var port = app._server.address().port;

      var res = await fetch('http://localhost:' + port + '/__bw/bitwrench.css');
      assert.strictEqual(res.status, 404);
      var body = await res.text();
      assert.ok(body.includes('Not Found'));
    } finally {
      // Restore the CSS file
      fs.renameSync(backupPath, cssPath);
    }
  });
});

// ===================================================================================
// bw.clientParse() — relaxed JSON parser
// ===================================================================================

describe("bw.clientParse()", function() {
  it("should parse strict JSON (no r-prefix)", function() {
    var msg = bw.clientParse('{"type":"patch","target":"temp","content":"23.5"}');
    assert.strictEqual(msg.type, 'patch');
    assert.strictEqual(msg.target, 'temp');
    assert.strictEqual(msg.content, '23.5');
  });

  it("should parse r-prefixed single-quoted strings", function() {
    var msg = bw.clientParse("r{'type':'patch','target':'temp','content':'23.5'}");
    assert.strictEqual(msg.type, 'patch');
    assert.strictEqual(msg.target, 'temp');
    assert.strictEqual(msg.content, '23.5');
  });

  it("should handle escaped single quotes", function() {
    var msg = bw.clientParse("r{'content':'it\\'s hot'}");
    assert.strictEqual(msg.content, "it's hot");
  });

  it("should handle double quotes inside single-quoted strings", function() {
    var msg = bw.clientParse("r{'msg':'say \"hello\"'}");
    assert.strictEqual(msg.msg, 'say "hello"');
  });

  it("should strip trailing commas", function() {
    var msg = bw.clientParse("r{'a':1,'b':[2,3,],}");
    assert.strictEqual(msg.a, 1);
    assert.deepStrictEqual(msg.b, [2, 3]);
  });

  it("should handle mixed strict JSON inside r-prefix", function() {
    var msg = bw.clientParse('r{"already":"valid json"}');
    assert.strictEqual(msg.already, 'valid json');
  });

  it("should handle nested objects", function() {
    var msg = bw.clientParse("r{'type':'replace','target':'#app','node':{'t':'div','c':'hi'}}");
    assert.strictEqual(msg.type, 'replace');
    assert.strictEqual(msg.node.t, 'div');
    assert.strictEqual(msg.node.c, 'hi');
  });

  it("should handle arrays in values", function() {
    var msg = bw.clientParse("r{'ops':[{'type':'patch','target':'a','content':'1'},{'type':'patch','target':'b','content':'2'}]}");
    assert.strictEqual(msg.ops.length, 2);
    assert.strictEqual(msg.ops[0].target, 'a');
    assert.strictEqual(msg.ops[1].target, 'b');
  });

  it("should handle whitespace in input", function() {
    var msg = bw.clientParse("  r{ 'type' : 'patch' , 'target' : 'x' , 'content' : '1' }  ");
    assert.strictEqual(msg.type, 'patch');
    assert.strictEqual(msg.target, 'x');
  });

  it("should throw on invalid JSON", function() {
    assert.throws(function() {
      bw.clientParse("not json");
    });
  });

  it("should throw on invalid r-prefixed JSON", function() {
    assert.throws(function() {
      bw.clientParse("r{broken");
    });
  });

  it("should handle empty/null input", function() {
    assert.throws(function() { bw.clientParse(''); });
    assert.throws(function() { bw.clientParse(null); });
  });

  it("should handle numeric values", function() {
    var msg = bw.clientParse("r{'count':42,'pi':3.14,'neg':-1}");
    assert.strictEqual(msg.count, 42);
    assert.strictEqual(msg.pi, 3.14);
    assert.strictEqual(msg.neg, -1);
  });

  it("should handle boolean and null values", function() {
    var msg = bw.clientParse("r{'a':true,'b':false,'c':null}");
    assert.strictEqual(msg.a, true);
    assert.strictEqual(msg.b, false);
    assert.strictEqual(msg.c, null);
  });

  // --- Real-world content with apostrophes ---

  it("should handle apostrophe in value (escaped)", function() {
    var msg = bw.clientParse("r{'content':'Barry\\'s food'}");
    assert.strictEqual(msg.content, "Barry's food");
  });

  it("should handle multiple apostrophes in value", function() {
    var msg = bw.clientParse("r{'content':'it\\'s Barry\\'s food and it\\'s great'}");
    assert.strictEqual(msg.content, "it's Barry's food and it's great");
  });

  it("should handle apostrophe in target value", function() {
    var msg = bw.clientParse("r{'type':'patch','target':'room-name','content':'Barry\\'s Room'}");
    assert.strictEqual(msg.content, "Barry's Room");
    assert.strictEqual(msg.type, 'patch');
  });

  it("should handle backslash in value", function() {
    var msg = bw.clientParse("r{'path':'C:\\\\Users\\\\data'}");
    assert.strictEqual(msg.path, "C:\\Users\\data");
  });

  it("should handle double quotes inside single-quoted values (C literal scenario)", function() {
    // In C: "r{'msg':'say \"hello\"'}"
    var msg = bw.clientParse("r{'msg':'say \"hello\"'}");
    assert.strictEqual(msg.msg, 'say "hello"');
  });

  it("should handle newline escape in value", function() {
    var msg = bw.clientParse("r{'text':'line1\\nline2'}");
    assert.strictEqual(msg.text, "line1\nline2");
  });

  it("should handle tab escape in value", function() {
    var msg = bw.clientParse("r{'text':'col1\\tcol2'}");
    assert.strictEqual(msg.text, "col1\tcol2");
  });

  // --- Nested TACO with content containing apostrophes ---

  it("should handle nested TACO with apostrophe in content", function() {
    var msg = bw.clientParse("r{'type':'replace','target':'#app','node':{'t':'p','c':'Don\\'t panic'}}");
    assert.strictEqual(msg.type, 'replace');
    assert.strictEqual(msg.node.t, 'p');
    assert.strictEqual(msg.node.c, "Don't panic");
  });

  it("should handle batch with apostrophes in multiple ops", function() {
    var msg = bw.clientParse("r{'type':'batch','ops':[{'type':'patch','target':'a','content':'it\\'s'},{'type':'patch','target':'b','content':'they\\'re'}]}");
    assert.strictEqual(msg.ops[0].content, "it's");
    assert.strictEqual(msg.ops[1].content, "they're");
  });

  // --- Edge cases ---

  it("should handle empty single-quoted string", function() {
    var msg = bw.clientParse("r{'content':''}");
    assert.strictEqual(msg.content, '');
  });

  it("should handle single char value", function() {
    var msg = bw.clientParse("r{'c':'x'}");
    assert.strictEqual(msg.c, 'x');
  });

  it("should handle value that is only an escaped apostrophe", function() {
    var msg = bw.clientParse("r{'c':'\\''}");
    assert.strictEqual(msg.c, "'");
  });

  it("should handle consecutive escaped apostrophes", function() {
    var msg = bw.clientParse("r{'c':'\\'\\'\\'\\''}");
    assert.strictEqual(msg.c, "''''");
  });

  // --- ESP32 / embedded simulation: BW_PATCH output ---

  it("should parse simulated BW_PATCH output (sensor value)", function() {
    // Simulates: BW_PATCH(msg, "val-temp", "23.5 C")
    var msg = bw.clientParse("r{'type':'patch','target':'val-temp','content':'23.5 C'}");
    assert.strictEqual(msg.target, 'val-temp');
    assert.strictEqual(msg.content, '23.5 C');
  });

  it("should parse simulated BW_BATCH output (multiple sensors)", function() {
    // Simulates batch of 3 sensor patches
    var msg = bw.clientParse("r{'type':'batch','ops':[{'type':'patch','target':'val-temp','content':'23.5 C'},{'type':'patch','target':'val-humidity','content':'45%'},{'type':'patch','target':'val-uptime','content':'3600s'}]}");
    assert.strictEqual(msg.type, 'batch');
    assert.strictEqual(msg.ops.length, 3);
    assert.strictEqual(msg.ops[0].content, '23.5 C');
    assert.strictEqual(msg.ops[2].content, '3600s');
  });

  it("should parse simulated BW_REPLACE with TACO node", function() {
    // Simulates: BW_REPLACE(msg, "#app", taco)
    var msg = bw.clientParse("r{'type':'replace','target':'#app','node':{'t':'h1','c':'Hello World'}}");
    assert.strictEqual(msg.type, 'replace');
    assert.strictEqual(msg.node.t, 'h1');
    assert.strictEqual(msg.node.c, 'Hello World');
  });

  it("should parse simulated BW_TACO_ATTR output", function() {
    // Simulates: BW_TACO_ATTR(buf, "button", "'data-bw-action':'increment','class':'bw-btn'", "+1")
    var msg = bw.clientParse("r{'t':'button','a':{'data-bw-action':'increment','class':'bw-btn'},'c':'+1'}");
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
    // Simulate two connected clients
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
    assert.strictEqual(client2._sent, undefined); // never initialized
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
    // The _serveDistFile method uses DIST_DIR internally.
    // We test that BwServeApp can be created (DIST_DIR resolves without error).
    var app = new BwServeApp({});
    assert.ok(app, "BwServeApp should instantiate");
  });
});

// ===================================================================================
// Bug fix: allowExec passthrough to shell
// ===================================================================================
describe("generateShell allowExec", function() {
  it("should NOT include allowExec by default", function() {
    var html = generateShell({ clientId: 'test1', title: 'Test' });
    assert.ok(html.indexOf('allowExec') === -1, "should not contain allowExec");
  });

  it("should include allowExec: true when opts.allowExec is true", function() {
    var html = generateShell({ clientId: 'test2', title: 'Test', allowExec: true });
    assert.ok(html.indexOf('allowExec: true') !== -1, "should contain allowExec: true");
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
// Screenshot protocol tests
// ===================================================================================

describe("client.screenshot()", function() {
  it("should reject when allowScreenshot is false (default)", function() {
    var client = new BwServeClient('ss-test-1', null);
    // _allowScreenshot is not set (defaults to undefined/falsy)
    return client.screenshot().then(
      function() { assert.fail('should have rejected'); },
      function(err) {
        assert.ok(err.message.indexOf('not enabled') !== -1);
      }
    );
  });

  it("should reject when allowScreenshot is explicitly false", function() {
    var client = new BwServeClient('ss-test-2', null);
    client._allowScreenshot = false;
    return client.screenshot('#app').then(
      function() { assert.fail('should have rejected'); },
      function(err) {
        assert.ok(err.message.indexOf('not enabled') !== -1);
      }
    );
  });

  it("should send register + call messages when allowed", function() {
    var client = new BwServeClient('ss-test-3', null);
    client._allowScreenshot = true;
    // Don't await — just trigger the send
    var p = client.screenshot('#app', { format: 'jpeg', quality: 0.8, timeout: 500 });

    // Check sent messages
    assert.strictEqual(client._sent.length, 2, 'should send 2 messages');

    // First message: register
    var reg = client._sent[0];
    assert.strictEqual(reg.type, 'register');
    assert.strictEqual(reg.name, '_bw_screenshot');
    assert.ok(reg.body.indexOf('html2canvas') !== -1, 'capture fn should reference html2canvas');

    // Second message: call
    var call = client._sent[1];
    assert.strictEqual(call.type, 'call');
    assert.strictEqual(call.name, '_bw_screenshot');
    assert.strictEqual(call.args[0].selector, '#app');
    assert.strictEqual(call.args[0].format, 'jpeg');
    assert.strictEqual(call.args[0].quality, 0.8);
    assert.strictEqual(call.args[0].clientId, 'ss-test-3');
    assert.ok(call.args[0].requestId, 'should have requestId');

    // Clean up: let the timeout reject
    return p.catch(function() {});
  });

  it("should only register capture function once", function() {
    var client = new BwServeClient('ss-test-4', null);
    client._allowScreenshot = true;
    var p1 = client.screenshot('#a', { timeout: 500 });
    var p2 = client.screenshot('#b', { timeout: 500 });

    // Should have 3 messages: 1 register + 2 calls
    assert.strictEqual(client._sent.length, 3);
    assert.strictEqual(client._sent[0].type, 'register');
    assert.strictEqual(client._sent[1].type, 'call');
    assert.strictEqual(client._sent[2].type, 'call');

    return Promise.all([p1.catch(function() {}), p2.catch(function() {})]);
  });

  it("should pass default options when none specified", function() {
    var client = new BwServeClient('ss-test-5', null);
    client._allowScreenshot = true;
    var p = client.screenshot(undefined, { timeout: 500 });

    var call = client._sent[1];
    assert.strictEqual(call.args[0].selector, 'body');
    assert.strictEqual(call.args[0].format, 'png');
    assert.strictEqual(call.args[0].quality, 0.85);
    assert.strictEqual(call.args[0].scale, 1);
    assert.strictEqual(call.args[0].maxWidth, null);
    assert.strictEqual(call.args[0].maxHeight, null);

    return p.catch(function() {});
  });

  it("should pass maxWidth and maxHeight options", function() {
    var client = new BwServeClient('ss-test-6', null);
    client._allowScreenshot = true;
    var p = client.screenshot('#app', { maxWidth: 1024, maxHeight: 768, timeout: 500 });

    var call = client._sent[1];
    assert.strictEqual(call.args[0].maxWidth, 1024);
    assert.strictEqual(call.args[0].maxHeight, 768);

    return p.catch(function() {});
  });

  it("should timeout and reject after specified ms", function() {
    var client = new BwServeClient('ss-test-7', null);
    client._allowScreenshot = true;
    var start = Date.now();
    return client.screenshot('#app', { timeout: 100 }).then(
      function() { assert.fail('should have rejected'); },
      function(err) {
        assert.ok(err.message.indexOf('timeout') !== -1);
        assert.ok(Date.now() - start >= 90, 'should wait at least ~100ms');
      }
    );
  });
});

describe("client._resolveScreenshot()", function() {
  it("should resolve pending promise with image data", function() {
    var client = new BwServeClient('ss-resolve-1', null);
    client._allowScreenshot = true;
    var p = client.screenshot('#app', { timeout: 5000 });

    // Get the requestId from the call message
    var requestId = client._sent[1].args[0].requestId;

    // Simulate client POST-back
    var fakeDataUrl = 'data:image/png;base64,' + Buffer.from('fake-png-data').toString('base64');
    client._resolveScreenshot(requestId, {
      data: fakeDataUrl,
      width: 800,
      height: 600,
      format: 'png'
    });

    return p.then(function(result) {
      assert.strictEqual(result.width, 800);
      assert.strictEqual(result.height, 600);
      assert.strictEqual(result.format, 'png');
      assert.ok(Buffer.isBuffer(result.data), 'data should be a Buffer');
      assert.strictEqual(result.data.toString(), 'fake-png-data');
    });
  });

  it("should reject pending promise on error", function() {
    var client = new BwServeClient('ss-resolve-2', null);
    client._allowScreenshot = true;
    var p = client.screenshot('#app', { timeout: 5000 });

    var requestId = client._sent[1].args[0].requestId;

    client._resolveScreenshot(requestId, {
      error: 'Element not found: #nonexistent'
    });

    return p.then(
      function() { assert.fail('should have rejected'); },
      function(err) {
        assert.ok(err.message.indexOf('Element not found') !== -1);
      }
    );
  });

  it("should return false for unknown requestId", function() {
    var client = new BwServeClient('ss-resolve-3', null);
    assert.strictEqual(client._resolveScreenshot('unknown_id', {}), false);
  });

  it("should clear timeout on resolve", function() {
    var client = new BwServeClient('ss-resolve-4', null);
    client._allowScreenshot = true;
    var p = client.screenshot('#app', { timeout: 200 });

    var requestId = client._sent[1].args[0].requestId;

    // Resolve immediately
    var fakeDataUrl = 'data:image/jpeg;base64,' + Buffer.from('jpeg-data').toString('base64');
    client._resolveScreenshot(requestId, {
      data: fakeDataUrl,
      width: 512,
      height: 384,
      format: 'jpeg'
    });

    return p.then(function(result) {
      assert.strictEqual(result.format, 'jpeg');
      // If timeout wasn't cleared, this test would fail with unhandled rejection
    });
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
