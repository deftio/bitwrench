/**
 * Bitwrench Attach Mode Test Suite
 *
 * Tests for:
 * - generateAttachScript() — returns valid JS with bwclient source
 * - /bw/attach.js route — HTTP integration
 * - _bw_tree builtin — DOM tree summary
 * - _bw_listen/_bw_unlisten builtins — event delegation
 * - event route in _handleReturn — dispatch to _bw_event
 * - CORS preflight on /bw/return/
 * - wrapExpression() — REPL expression wrapping
 */

import assert from "assert";
import bw from "../src/bitwrench.js";
import jsdom from 'jsdom';
const { JSDOM } = jsdom;

import bwserve from "../src/bwserve/index.js";
const { BwServeApp, BwServeClient } = bwserve;
import { generateAttachScript } from "../src/bwserve/attach.js";
import { wrapExpression } from "../src/cli/attach.js";

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
// generateAttachScript() tests
// ===================================================================================

describe("generateAttachScript()", function() {
  it("should return a string", function() {
    var js = generateAttachScript();
    assert.strictEqual(typeof js, 'string');
  });

  it("should contain bwclient attach call", function() {
    var js = generateAttachScript();
    assert.ok(js.includes('bw._bwClient.attach'), 'should contain bw._bwClient.attach');
  });

  it("should contain bitwrench UMD loader", function() {
    var js = generateAttachScript();
    assert.ok(js.includes('/bw/lib/bitwrench.umd.js'), 'should contain UMD path');
  });

  it("should contain bwclient source (respond function)", function() {
    var js = generateAttachScript();
    assert.ok(js.includes('_bwClient'), 'should contain _bwClient reference');
    assert.ok(js.includes('respond'), 'should contain respond function');
  });

  it("should use empty origin by default", function() {
    var js = generateAttachScript();
    assert.ok(js.includes('var origin = ""'), 'should have empty origin');
  });

  it("should respect opts.origin", function() {
    var js = generateAttachScript({ origin: 'http://myserver:3000' });
    assert.ok(js.includes('http://myserver:3000'), 'should contain custom origin');
  });

  it("should contain version string", function() {
    var js = generateAttachScript();
    assert.ok(js.includes('[bw-attach] v'), 'should contain version in log');
  });

  it("should be a self-invoking function", function() {
    var js = generateAttachScript();
    assert.ok(js.startsWith('(function()'), 'should start with IIFE');
    assert.ok(js.trimEnd().endsWith('})();'), 'should end with IIFE close');
  });

  it("should check for existing window.bw", function() {
    var js = generateAttachScript();
    assert.ok(js.includes('window.bw'), 'should check for existing bw');
  });

  it("should set allowExec to true", function() {
    var js = generateAttachScript();
    assert.ok(js.includes('allowExec: true'), 'should enable allowExec');
  });
});

// ===================================================================================
// /bw/attach.js route tests
// ===================================================================================

describe("/bw/attach.js route", function() {
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

  it("should serve attach script with correct content type", async function() {
    this.timeout(5000);
    var app = createApp();
    app.page('/', function() {});
    await app.listen();
    var port = app._server.address().port;
    var res = await fetch('http://localhost:' + port + '/bw/attach.js');
    assert.strictEqual(res.status, 200);
    var ct = res.headers.get('content-type');
    assert.ok(ct.includes('javascript'), 'should be javascript content type');
  });

  it("should have CORS header", async function() {
    this.timeout(5000);
    var app = createApp();
    app.page('/', function() {});
    await app.listen();
    var port = app._server.address().port;
    var res = await fetch('http://localhost:' + port + '/bw/attach.js');
    var cors = res.headers.get('access-control-allow-origin');
    assert.strictEqual(cors, '*', 'should allow all origins');
  });

  it("should return valid JS containing attach code", async function() {
    this.timeout(5000);
    var app = createApp();
    app.page('/', function() {});
    await app.listen();
    var port = app._server.address().port;
    var res = await fetch('http://localhost:' + port + '/bw/attach.js');
    var body = await res.text();
    assert.ok(body.includes('bw._bwClient.attach'), 'should contain attach call');
    assert.ok(body.length > 500, 'should be substantial (contains bwclient source)');
  });
});

// ===================================================================================
// CORS preflight tests
// ===================================================================================

describe("CORS preflight on /bw/return/", function() {
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

  it("should return 204 with CORS headers for OPTIONS", async function() {
    this.timeout(5000);
    var app = createApp();
    app.page('/', function() {});
    await app.listen();
    var port = app._server.address().port;
    var res = await fetch('http://localhost:' + port + '/bw/return/action/test', {
      method: 'OPTIONS'
    });
    assert.strictEqual(res.status, 204);
    assert.strictEqual(res.headers.get('access-control-allow-origin'), '*');
    assert.ok(res.headers.get('access-control-allow-methods').includes('POST'));
    assert.ok(res.headers.get('access-control-allow-headers').includes('Content-Type'));
  });
});

// ===================================================================================
// event route in _handleReturn
// ===================================================================================

describe("event route dispatch", function() {
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

  it("should dispatch event route to _bw_event handler", async function() {
    this.timeout(5000);
    var eventReceived = false;
    var eventData = null;
    var app = createApp();
    app.page('/', function(client) {
      client.render('#app', { t: 'div', c: 'test' });
      client.on('_bw_event', function(data) {
        eventReceived = true;
        eventData = data;
      });
    });
    await app.listen();
    var port = app._server.address().port;

    // Get a client connected
    var pageRes = await fetch('http://localhost:' + port + '/');
    var html = await pageRes.text();
    var match = html.match(/"(c\d+)"/);
    var clientId = match[1];

    // Open SSE to trigger handler
    fetch('http://localhost:' + port + '/bw/events/' + clientId).catch(function() {});
    await new Promise(function(r) { setTimeout(r, 100); });

    // Post an event via the event route
    var eventRes = await fetch('http://localhost:' + port + '/bw/return/event/' + clientId, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        result: { event: 'click', selector: 'button', tagName: 'BUTTON', id: 'btn1', text: 'Click me' }
      })
    });
    assert.strictEqual(eventRes.status, 200);
    assert.strictEqual(eventReceived, true);
    assert.strictEqual(eventData.event, 'click');
    assert.strictEqual(eventData.selector, 'button');
  });

  it("should include CORS header on return responses", async function() {
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
    fetch('http://localhost:' + port + '/bw/events/' + clientId).catch(function() {});
    await new Promise(function(r) { setTimeout(r, 100); });

    var res = await fetch('http://localhost:' + port + '/bw/return/action/' + clientId, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ result: { action: 'test', data: {} } })
    });
    assert.strictEqual(res.headers.get('access-control-allow-origin'), '*');
  });
});

// ===================================================================================
// _bw_tree builtin tests (via bw.apply)
// ===================================================================================

describe("_bw_tree builtin", function() {
  beforeEach(function() {
    resetApp();
    bw._clientFunctions = {};
  });

  it("should register _bw_tree function from body string", function() {
    // Register the _bw_tree builtin
    var body = 'function(opts){if(!bw._bwClient)return;var sel=opts.selector||"body";var depth=opts.depth||3;function walk(el,d){if(!el||d>depth)return null;var info={tag:el.tagName?el.tagName.toLowerCase():"#text"};if(el.id)info.id=el.id;if(el.className&&typeof el.className==="string")info.cls=el.className.split(" ").slice(0,5).join(" ");if(el.children&&el.children.length>0&&d<depth){info.children=[];for(var i=0;i<Math.min(el.children.length,20);i++){var c=walk(el.children[i],d+1);if(c)info.children.push(c);}}return info;}var root=document.querySelector(sel);bw._bwClient.respond("query",opts.requestId,walk(root,0));}';
    var result = bw.apply({ type: 'register', name: '_bw_tree', body: body });
    assert.strictEqual(result, true);
    assert.strictEqual(typeof bw._clientFunctions._bw_tree, 'function');
  });

  it("should walk DOM and return tree structure", function() {
    // Build a small DOM tree
    bw.DOM('#app', {
      t: 'div', a: { id: 'container', class: 'main-panel' }, c: [
        { t: 'h1', a: { id: 'title' }, c: 'Hello' },
        { t: 'ul', a: { id: 'list' }, c: [
          { t: 'li', c: 'Item 1' },
          { t: 'li', c: 'Item 2' }
        ]}
      ]
    });

    // Walk manually to verify structure
    var root = document.querySelector('#container');
    assert.ok(root, 'container should exist');

    function walk(el, d, maxD) {
      if (!el || d > maxD) return null;
      var info = { tag: el.tagName ? el.tagName.toLowerCase() : '#text' };
      if (el.id) info.id = el.id;
      if (el.className && typeof el.className === 'string') {
        info.cls = el.className.split(' ').slice(0, 5).join(' ');
      }
      if (el.children && el.children.length > 0 && d < maxD) {
        info.children = [];
        for (var i = 0; i < Math.min(el.children.length, 20); i++) {
          var c = walk(el.children[i], d + 1, maxD);
          if (c) info.children.push(c);
        }
      }
      return info;
    }

    var tree = walk(root, 0, 3);
    assert.strictEqual(tree.tag, 'div');
    assert.strictEqual(tree.id, 'container');
    assert.ok(tree.cls.includes('main-panel'));
    assert.ok(tree.children.length >= 2, 'should have at least h1 and ul');
    assert.strictEqual(tree.children[0].tag, 'h1');
    assert.strictEqual(tree.children[0].id, 'title');
  });
});

// ===================================================================================
// wrapExpression() tests
// ===================================================================================

describe("wrapExpression()", function() {
  it("should wrap simple expression in return()", function() {
    assert.strictEqual(wrapExpression('document.title'), 'return (document.title)');
  });

  it("should wrap property access", function() {
    assert.strictEqual(wrapExpression('window.innerWidth'), 'return (window.innerWidth)');
  });

  it("should wrap function call", function() {
    assert.strictEqual(wrapExpression('bw.$(".card").length'), 'return (bw.$(".card").length)');
  });

  it("should wrap number literal", function() {
    assert.strictEqual(wrapExpression('42'), 'return (42)');
  });

  it("should wrap string literal", function() {
    assert.strictEqual(wrapExpression('"hello"'), 'return ("hello")');
  });

  it("should NOT wrap var declarations", function() {
    assert.strictEqual(wrapExpression('var x = 5'), 'var x = 5');
  });

  it("should NOT wrap let declarations", function() {
    assert.strictEqual(wrapExpression('let x = 5'), 'let x = 5');
  });

  it("should NOT wrap const declarations", function() {
    assert.strictEqual(wrapExpression('const x = 5'), 'const x = 5');
  });

  it("should NOT wrap if statements", function() {
    assert.strictEqual(wrapExpression('if (true) { alert(1); }'), 'if (true) { alert(1); }');
  });

  it("should NOT wrap for loops", function() {
    assert.strictEqual(wrapExpression('for (var i=0; i<10; i++) {}'), 'for (var i=0; i<10; i++) {}');
  });

  it("should NOT wrap while loops", function() {
    assert.strictEqual(wrapExpression('while (false) {}'), 'while (false) {}');
  });

  it("should NOT wrap function declarations", function() {
    assert.strictEqual(wrapExpression('function foo() {}'), 'function foo() {}');
  });

  it("should NOT wrap try statements", function() {
    assert.strictEqual(wrapExpression('try { x(); } catch(e) {}'), 'try { x(); } catch(e) {}');
  });

  it("should NOT wrap switch statements", function() {
    assert.strictEqual(wrapExpression('switch (x) { case 1: break; }'), 'switch (x) { case 1: break; }');
  });

  it("should NOT wrap throw statements", function() {
    assert.strictEqual(wrapExpression('throw new Error("test")'), 'throw new Error("test")');
  });

  it("should NOT wrap class declarations", function() {
    assert.strictEqual(wrapExpression('class Foo {}'), 'class Foo {}');
  });

  it("should NOT wrap object literals starting with {", function() {
    assert.strictEqual(wrapExpression('{ a: 1 }'), '{ a: 1 }');
  });

  it("should trim whitespace", function() {
    assert.strictEqual(wrapExpression('  document.title  '), 'return (document.title)');
  });
});

// ===================================================================================
// BwServeClient _bw_tree via client.call
// ===================================================================================

describe("BwServeClient _bw_tree call", function() {
  it("should send a call to _bw_tree with selector and depth", function() {
    var client = new BwServeClient('tree-1', null);
    var pend = client._pend(5000);
    client.call('_bw_tree', {
      selector: '#app',
      depth: 2,
      requestId: pend.requestId
    });
    assert.strictEqual(client._sent.length, 1);
    var msg = client._sent[0];
    assert.strictEqual(msg.type, 'call');
    assert.strictEqual(msg.name, '_bw_tree');
    assert.strictEqual(msg.args[0].selector, '#app');
    assert.strictEqual(msg.args[0].depth, 2);
    assert.ok(msg.args[0].requestId);
    // Resolve to clean up
    client._resolvePending(pend.requestId, { result: null });
  });
});

// ===================================================================================
// BwServeClient _bw_listen/_bw_unlisten calls
// ===================================================================================

describe("BwServeClient _bw_listen/_bw_unlisten calls", function() {
  it("should send a call to _bw_listen", function() {
    var client = new BwServeClient('listen-1', null);
    client.call('_bw_listen', { selector: 'button', event: 'click' });
    assert.strictEqual(client._sent.length, 1);
    var msg = client._sent[0];
    assert.strictEqual(msg.type, 'call');
    assert.strictEqual(msg.name, '_bw_listen');
    assert.strictEqual(msg.args[0].selector, 'button');
    assert.strictEqual(msg.args[0].event, 'click');
  });

  it("should send a call to _bw_unlisten", function() {
    var client = new BwServeClient('unlisten-1', null);
    client.call('_bw_unlisten', { selector: 'button', event: 'click' });
    assert.strictEqual(client._sent.length, 1);
    var msg = client._sent[0];
    assert.strictEqual(msg.type, 'call');
    assert.strictEqual(msg.name, '_bw_unlisten');
    assert.strictEqual(msg.args[0].selector, 'button');
    assert.strictEqual(msg.args[0].event, 'click');
  });
});
