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
import { wrapExpression, printTree, printHelp, handleSlashCommand, startAttach, runAttach } from "../src/cli/attach.js";
import { EventEmitter } from 'node:events';
import { PassThrough } from 'node:stream';

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
// BwServeClient client.inspect() convenience method
// ===================================================================================

describe("BwServeClient client.inspect()", function() {
  it("should be a function", function() {
    var client = new BwServeClient('ins-1', null);
    assert.strictEqual(typeof client.inspect, 'function');
  });

  it("should call _bw_tree with defaults", function() {
    var client = new BwServeClient('ins-2', null);
    client.inspect();
    assert.strictEqual(client._sent.length, 1);
    var msg = client._sent[0];
    assert.strictEqual(msg.type, 'call');
    assert.strictEqual(msg.name, '_bw_tree');
    assert.strictEqual(msg.args[0].selector, 'body');
    assert.strictEqual(msg.args[0].depth, 3);
    assert.ok(msg.args[0].requestId);
  });

  it("should pass selector and depth options", function() {
    var client = new BwServeClient('ins-3', null);
    client.inspect('#sidebar', { depth: 5 });
    var msg = client._sent[0];
    assert.strictEqual(msg.args[0].selector, '#sidebar');
    assert.strictEqual(msg.args[0].depth, 5);
  });

  it("should return a promise", function() {
    var client = new BwServeClient('ins-4', null);
    var result = client.inspect();
    assert.ok(result && typeof result.then === 'function');
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

// ===================================================================================
// printTree() tests
// ===================================================================================

describe("printTree()", function() {
  var origLog;
  var logged;

  beforeEach(function() {
    origLog = console.log;
    logged = [];
    console.log = function() {
      logged.push(Array.prototype.slice.call(arguments).join(' '));
    };
  });

  afterEach(function() {
    console.log = origLog;
  });

  it("should handle null node", function() {
    printTree(null, 0);
    assert.strictEqual(logged.length, 0);
  });

  it("should print a simple node", function() {
    printTree({ tag: 'div' }, 0);
    assert.strictEqual(logged.length, 1);
    assert.strictEqual(logged[0], 'div');
  });

  it("should print node with id", function() {
    printTree({ tag: 'div', id: 'main' }, 0);
    assert.strictEqual(logged[0], 'div#main');
  });

  it("should print node with classes", function() {
    printTree({ tag: 'span', cls: 'foo bar' }, 0);
    assert.strictEqual(logged[0], 'span.foo.bar');
  });

  it("should print node with id and classes", function() {
    printTree({ tag: 'div', id: 'app', cls: 'container wide' }, 0);
    assert.strictEqual(logged[0], 'div#app.container.wide');
  });

  it("should indent children", function() {
    printTree({
      tag: 'div',
      children: [
        { tag: 'h1', id: 'title' },
        { tag: 'p' }
      ]
    }, 0);
    assert.strictEqual(logged.length, 3);
    assert.strictEqual(logged[0], 'div');
    assert.strictEqual(logged[1], '  h1#title');
    assert.strictEqual(logged[2], '  p');
  });

  it("should handle nested children recursively", function() {
    printTree({
      tag: 'div',
      children: [
        {
          tag: 'ul',
          children: [
            { tag: 'li', cls: 'item' }
          ]
        }
      ]
    }, 0);
    assert.strictEqual(logged.length, 3);
    assert.strictEqual(logged[0], 'div');
    assert.strictEqual(logged[1], '  ul');
    assert.strictEqual(logged[2], '    li.item');
  });

  it("should handle deeper indent levels", function() {
    printTree({ tag: 'span' }, 3);
    assert.strictEqual(logged[0], '      span');
  });

  it("should use ? for missing tag", function() {
    printTree({}, 0);
    assert.strictEqual(logged[0], '?');
  });
});

// ===================================================================================
// printHelp() tests
// ===================================================================================

describe("printHelp()", function() {
  var origLog;
  var logged;

  beforeEach(function() {
    origLog = console.log;
    logged = [];
    console.log = function() {
      logged.push(Array.prototype.slice.call(arguments).join(' '));
    };
  });

  afterEach(function() {
    console.log = origLog;
  });

  it("should print help text", function() {
    printHelp();
    assert.ok(logged.length > 0, 'should produce output');
  });

  it("should contain command references", function() {
    printHelp();
    var text = logged.join('\n');
    assert.ok(text.includes('/help'), 'should mention /help');
    assert.ok(text.includes('/quit'), 'should mention /quit');
    assert.ok(text.includes('/inspect'), 'should mention /inspect');
    assert.ok(text.includes('/tree'), 'should mention /tree alias');
    assert.ok(text.includes('/screenshot'), 'should mention /screenshot');
    assert.ok(text.includes('/mount'), 'should mention /mount');
    assert.ok(text.includes('/render'), 'should mention /render');
    assert.ok(text.includes('/patch'), 'should mention /patch');
    assert.ok(text.includes('/listen'), 'should mention /listen');
    assert.ok(text.includes('/unlisten'), 'should mention /unlisten');
    assert.ok(text.includes('/exec'), 'should mention /exec');
    assert.ok(text.includes('/clients'), 'should mention /clients');
  });
});

// ===================================================================================
// handleSlashCommand() tests
// ===================================================================================

describe("handleSlashCommand()", function() {
  var origLog, origError;
  var logged, errors;
  var promptCalled;
  var mockRl;
  var closeCalled;

  beforeEach(function() {
    origLog = console.log;
    origError = console.error;
    logged = [];
    errors = [];
    promptCalled = 0;
    closeCalled = false;
    console.log = function() {
      logged.push(Array.prototype.slice.call(arguments).join(' '));
    };
    console.error = function() {
      errors.push(Array.prototype.slice.call(arguments).join(' '));
    };
    mockRl = {
      prompt: function() { promptCalled++; },
      close: function() { closeCalled = true; }
    };
  });

  afterEach(function() {
    console.log = origLog;
    console.error = origError;
  });

  // -- /help --
  it("/help should print help and prompt", function() {
    handleSlashCommand('/help', null, new Map(), {}, mockRl);
    assert.ok(logged.length > 0);
    assert.ok(promptCalled > 0);
  });

  it("/h should print help", function() {
    handleSlashCommand('/h', null, new Map(), {}, mockRl);
    assert.ok(logged.length > 0);
  });

  // -- /quit --
  it("/quit should close readline", function() {
    handleSlashCommand('/quit', null, new Map(), {}, mockRl);
    assert.strictEqual(closeCalled, true);
  });

  it("/q should close readline", function() {
    handleSlashCommand('/q', null, new Map(), {}, mockRl);
    assert.strictEqual(closeCalled, true);
  });

  // -- /clients --
  it("/clients with no clients shows message", function() {
    handleSlashCommand('/clients', null, new Map(), {}, mockRl);
    assert.ok(logged.some(function(l) { return l.includes('No clients'); }));
    assert.ok(promptCalled > 0);
  });

  it("/clients with clients lists them", function() {
    var clients = new Map();
    var mockClient1 = { _closed: false };
    var mockClient2 = { _closed: true };
    clients.set('c1', mockClient1);
    clients.set('c2', mockClient2);
    handleSlashCommand('/clients', mockClient1, clients, {}, mockRl);
    assert.ok(logged.some(function(l) { return l.includes('c1') && l.includes('active'); }));
    assert.ok(logged.some(function(l) { return l.includes('c2') && l.includes('closed'); }));
  });

  // -- commands requiring active client --
  it("/tree with no client shows message", function() {
    handleSlashCommand('/tree', null, new Map(), {}, mockRl);
    assert.ok(logged.some(function(l) { return l.includes('No client'); }));
  });

  it("/screenshot with no client shows message", function() {
    handleSlashCommand('/screenshot', null, new Map(), {}, mockRl);
    assert.ok(logged.some(function(l) { return l.includes('No client'); }));
  });

  it("/screenshot without --allow-screenshot shows message", function() {
    var mockClient = {};
    handleSlashCommand('/screenshot', mockClient, new Map(), { allowScreenshot: false }, mockRl);
    assert.ok(logged.some(function(l) { return l.includes('not enabled'); }));
  });

  it("/mount with no client shows message", function() {
    handleSlashCommand('/mount', null, new Map(), {}, mockRl);
    assert.ok(logged.some(function(l) { return l.includes('No client'); }));
  });

  it("/mount with too few args shows usage", function() {
    var mockClient = {};
    handleSlashCommand('/mount #app', mockClient, new Map(), {}, mockRl);
    assert.ok(logged.some(function(l) { return l.includes('Usage'); }));
  });

  it("/render with no client shows message", function() {
    handleSlashCommand('/render', null, new Map(), {}, mockRl);
    assert.ok(logged.some(function(l) { return l.includes('No client'); }));
  });

  it("/render with too few args shows usage", function() {
    var mockClient = {};
    handleSlashCommand('/render #app', mockClient, new Map(), {}, mockRl);
    assert.ok(logged.some(function(l) { return l.includes('Usage'); }));
  });

  it("/patch with no client shows message", function() {
    handleSlashCommand('/patch', null, new Map(), {}, mockRl);
    assert.ok(logged.some(function(l) { return l.includes('No client'); }));
  });

  it("/patch with too few args shows usage", function() {
    var mockClient = {};
    handleSlashCommand('/patch myid', mockClient, new Map(), {}, mockRl);
    assert.ok(logged.some(function(l) { return l.includes('Usage'); }));
  });

  it("/listen with no client shows message", function() {
    handleSlashCommand('/listen', null, new Map(), {}, mockRl);
    assert.ok(logged.some(function(l) { return l.includes('No client'); }));
  });

  it("/listen with too few args shows usage", function() {
    var mockClient = {};
    handleSlashCommand('/listen button', mockClient, new Map(), {}, mockRl);
    assert.ok(logged.some(function(l) { return l.includes('Usage'); }));
  });

  it("/unlisten with no client shows message", function() {
    handleSlashCommand('/unlisten', null, new Map(), {}, mockRl);
    assert.ok(logged.some(function(l) { return l.includes('No client'); }));
  });

  it("/unlisten with too few args shows usage", function() {
    var mockClient = {};
    handleSlashCommand('/unlisten button', mockClient, new Map(), {}, mockRl);
    assert.ok(logged.some(function(l) { return l.includes('Usage'); }));
  });

  it("/exec with no client shows message", function() {
    handleSlashCommand('/exec', null, new Map(), {}, mockRl);
    assert.ok(logged.some(function(l) { return l.includes('No client'); }));
  });

  it("/exec with too few args shows usage", function() {
    var mockClient = {};
    handleSlashCommand('/exec', mockClient, new Map(), {}, mockRl);
    assert.ok(logged.some(function(l) { return l.includes('Usage'); }));
  });

  it("unknown command shows error", function() {
    handleSlashCommand('/foobar', null, new Map(), {}, mockRl);
    assert.ok(logged.some(function(l) { return l.includes('Unknown command'); }));
    assert.ok(promptCalled > 0);
  });

  // -- commands with mock client that has methods --

  it("/tree with client calls _pend and call", function() {
    var pendCalled = false;
    var callArgs = null;
    var mockClient = {
      _pend: function(timeout) {
        pendCalled = true;
        return {
          requestId: 'req1',
          promise: Promise.resolve(null)
        };
      },
      call: function(name, args) { callArgs = { name: name, args: args }; }
    };
    handleSlashCommand('/tree #content 2', mockClient, new Map(), {}, mockRl);
    assert.strictEqual(pendCalled, true);
    assert.strictEqual(callArgs.name, '_bw_tree');
    assert.strictEqual(callArgs.args.selector, '#content');
    assert.strictEqual(callArgs.args.depth, 2);
  });

  it("/tree prints result on resolve", function(done) {
    var treeResult = { tag: 'div', id: 'app', children: [{ tag: 'h1' }] };
    var mockClient = {
      _pend: function() {
        return { requestId: 'req1', promise: Promise.resolve(treeResult) };
      },
      call: function() {}
    };
    handleSlashCommand('/tree', mockClient, new Map(), {}, mockRl);
    setTimeout(function() {
      assert.ok(logged.some(function(l) { return l.includes('div#app'); }));
      done();
    }, 50);
  });

  it("/tree prints message for null result", function(done) {
    var mockClient = {
      _pend: function() {
        return { requestId: 'req1', promise: Promise.resolve(null) };
      },
      call: function() {}
    };
    handleSlashCommand('/tree .missing', mockClient, new Map(), {}, mockRl);
    setTimeout(function() {
      assert.ok(logged.some(function(l) { return l.includes('no element found'); }));
      done();
    }, 50);
  });

  it("/tree handles rejection", function(done) {
    var mockClient = {
      _pend: function() {
        return { requestId: 'req1', promise: Promise.reject(new Error('timeout')) };
      },
      call: function() {}
    };
    handleSlashCommand('/tree', mockClient, new Map(), {}, mockRl);
    setTimeout(function() {
      assert.ok(errors.some(function(l) { return l.includes('timeout'); }));
      done();
    }, 50);
  });

  it("/screenshot with client calls screenshot()", function(done) {
    var mockClient = {
      screenshot: function(sel, opts) {
        return Promise.resolve({ data: Buffer.from('png'), width: 100, height: 50 });
      }
    };
    // Need to mock writeFileSync
    handleSlashCommand('/screenshot body test.png', mockClient, new Map(), { allowScreenshot: true }, mockRl);
    setTimeout(function() {
      assert.ok(logged.some(function(l) { return l.includes('Saved') || l.includes('test.png'); }));
      done();
    }, 50);
  });

  it("/screenshot handles rejection", function(done) {
    var mockClient = {
      screenshot: function() {
        return Promise.reject(new Error('no html2canvas'));
      }
    };
    handleSlashCommand('/screenshot', mockClient, new Map(), { allowScreenshot: true }, mockRl);
    setTimeout(function() {
      assert.ok(errors.some(function(l) { return l.includes('no html2canvas'); }));
      done();
    }, 50);
  });

  it("/mount with valid args calls client.mount", function(done) {
    var mockClient = {
      mount: function(sel, comp, props, opts) {
        assert.strictEqual(sel, '#app');
        assert.strictEqual(comp, 'card');
        assert.deepStrictEqual(props, { title: 'Hi' });
        return Promise.resolve();
      }
    };
    handleSlashCommand('/mount #app card {"title":"Hi"}', mockClient, new Map(), {}, mockRl);
    setTimeout(function() {
      assert.ok(logged.some(function(l) { return l.includes('Mounted'); }));
      done();
    }, 50);
  });

  it("/mount handles rejection", function(done) {
    var mockClient = {
      mount: function() { return Promise.reject(new Error('mount failed')); }
    };
    handleSlashCommand('/mount #app card', mockClient, new Map(), {}, mockRl);
    setTimeout(function() {
      assert.ok(errors.some(function(l) { return l.includes('mount failed'); }));
      done();
    }, 50);
  });

  it("/mount with invalid JSON shows error", function() {
    var mockClient = {};
    handleSlashCommand('/mount #app card {invalid}', mockClient, new Map(), {}, mockRl);
    assert.ok(errors.some(function(l) { return l.includes('Invalid JSON'); }));
  });

  it("/render with valid TACO calls client.render", function() {
    var renderCalled = false;
    var mockClient = {
      render: function(sel, taco) {
        renderCalled = true;
        assert.strictEqual(sel, '#app');
        assert.deepStrictEqual(taco, { t: 'h1', c: 'Hi' });
      }
    };
    handleSlashCommand('/render #app {"t":"h1","c":"Hi"}', mockClient, new Map(), {}, mockRl);
    assert.strictEqual(renderCalled, true);
    assert.ok(logged.some(function(l) { return l.includes('Rendered'); }));
  });

  it("/render with invalid JSON shows error", function() {
    var mockClient = {};
    handleSlashCommand('/render #app not-json', mockClient, new Map(), {}, mockRl);
    assert.ok(errors.some(function(l) { return l.includes('Invalid TACO JSON'); }));
  });

  it("/patch calls client.patch", function() {
    var patchCalled = false;
    var mockClient = {
      patch: function(id, content) {
        patchCalled = true;
        assert.strictEqual(id, 'counter');
        assert.strictEqual(content, 'hello world');
      }
    };
    handleSlashCommand('/patch counter hello world', mockClient, new Map(), {}, mockRl);
    assert.strictEqual(patchCalled, true);
    assert.ok(logged.some(function(l) { return l.includes('Patched'); }));
  });

  it("/listen calls client.call with _bw_listen", function() {
    var callArgs = null;
    var mockClient = {
      call: function(name, args) { callArgs = { name: name, args: args }; }
    };
    handleSlashCommand('/listen .btn click', mockClient, new Map(), {}, mockRl);
    assert.strictEqual(callArgs.name, '_bw_listen');
    assert.strictEqual(callArgs.args.selector, '.btn');
    assert.strictEqual(callArgs.args.event, 'click');
    assert.ok(logged.some(function(l) { return l.includes('Listening'); }));
  });

  it("/unlisten calls client.call with _bw_unlisten", function() {
    var callArgs = null;
    var mockClient = {
      call: function(name, args) { callArgs = { name: name, args: args }; }
    };
    handleSlashCommand('/unlisten .btn click', mockClient, new Map(), {}, mockRl);
    assert.strictEqual(callArgs.name, '_bw_unlisten');
    assert.ok(logged.some(function(l) { return l.includes('Stopped listening'); }));
  });

  it("/exec calls client.exec", function() {
    var execCode = null;
    var mockClient = {
      exec: function(code) { execCode = code; }
    };
    handleSlashCommand('/exec alert("hi")', mockClient, new Map(), {}, mockRl);
    assert.strictEqual(execCode, 'alert("hi")');
    assert.ok(logged.some(function(l) { return l.includes('Executed'); }));
  });

  it("/screenshot generates default filename when not specified", function(done) {
    var ssSel = null;
    var mockClient = {
      screenshot: function(sel) {
        ssSel = sel;
        return Promise.resolve({ data: Buffer.from('png'), width: 10, height: 10 });
      }
    };
    handleSlashCommand('/screenshot', mockClient, new Map(), { allowScreenshot: true }, mockRl);
    setTimeout(function() {
      assert.strictEqual(ssSel, 'body');
      assert.ok(logged.some(function(l) { return l.includes('screenshot-'); }));
      done();
    }, 50);
  });

  it("/tree uses default selector and depth", function() {
    var callArgs = null;
    var mockClient = {
      _pend: function() {
        return { requestId: 'r1', promise: Promise.resolve(null) };
      },
      call: function(name, args) { callArgs = { name: name, args: args }; }
    };
    handleSlashCommand('/tree', mockClient, new Map(), {}, mockRl);
    assert.strictEqual(callArgs.args.selector, 'body');
    assert.strictEqual(callArgs.args.depth, 3);
  });

  // /inspect is the canonical name; /tree is alias
  it("/inspect routes to same handler as /tree", function() {
    var callArgs = null;
    var mockClient = {
      _pend: function() {
        return { requestId: 'r1', promise: Promise.resolve(null) };
      },
      call: function(name, args) { callArgs = { name: name, args: args }; }
    };
    handleSlashCommand('/inspect #main 4', mockClient, new Map(), {}, mockRl);
    assert.strictEqual(callArgs.name, '_bw_tree');
    assert.strictEqual(callArgs.args.selector, '#main');
    assert.strictEqual(callArgs.args.depth, 4);
  });

  it("/inspect with no client shows message", function() {
    handleSlashCommand('/inspect', null, new Map(), {}, mockRl);
    assert.ok(logged.some(function(l) { return l.includes('No client'); }));
  });
});

// ===================================================================================
// runAttach() tests
// ===================================================================================

describe("runAttach()", function() {
  var origExit, origLog, origError;
  var exitCode, logged, errors;

  beforeEach(function() {
    origExit = process.exit;
    origLog = console.log;
    origError = console.error;
    exitCode = null;
    logged = [];
    errors = [];
    process.exit = function(code) { exitCode = code; throw new Error('EXIT_' + code); };
    console.log = function() {
      logged.push(Array.prototype.slice.call(arguments).join(' '));
    };
    console.error = function() {
      errors.push(Array.prototype.slice.call(arguments).join(' '));
    };
  });

  afterEach(function() {
    process.exit = origExit;
    console.log = origLog;
    console.error = origError;
  });

  it("--help should print usage and return", function() {
    runAttach(['--help']);
    assert.ok(logged.some(function(l) { return l.includes('bwcli attach'); }));
    assert.strictEqual(exitCode, null, 'should not call process.exit');
  });

  it("-h should print usage and return", function() {
    runAttach(['-h']);
    assert.ok(logged.some(function(l) { return l.includes('bwcli attach'); }));
  });

  it("invalid flag should call process.exit(1)", function() {
    try {
      runAttach(['--invalidflag']);
    } catch (e) {
      if (!e.message.includes('EXIT_1')) throw e;
    }
    assert.strictEqual(exitCode, 1);
    assert.ok(errors.some(function(l) { return l.includes('Error:'); }));
  });

  it("invalid port should call process.exit(1)", function() {
    try {
      runAttach(['--port', 'notanumber']);
    } catch (e) {
      if (!e.message.includes('EXIT_1')) throw e;
    }
    assert.strictEqual(exitCode, 1);
    assert.ok(errors.some(function(l) { return l.includes('--port must be a number'); }));
  });

  it("port 0 should call process.exit(1)", function() {
    try {
      runAttach(['--port', '0']);
    } catch (e) {
      if (!e.message.includes('EXIT_1')) throw e;
    }
    assert.strictEqual(exitCode, 1);
  });

  it("port 99999 should call process.exit(1)", function() {
    try {
      runAttach(['--port', '99999']);
    } catch (e) {
      if (!e.message.includes('EXIT_1')) throw e;
    }
    assert.strictEqual(exitCode, 1);
  });

  it("should call process.exit(1) when bwserve import fails", function(done) {
    this.timeout(5000);
    var promise = runAttach(['--port', '9877'], { _importPath: './nonexistent_module_xyz.js' });
    if (promise && promise.then) {
      promise.then(function() {
        assert.ok(errors.some(function(l) { return l.includes('Failed to load bwserve'); }));
        assert.strictEqual(exitCode, 1);
        done();
      }).catch(function() {
        // The catch already called process.exit(1) which we stubbed
        assert.ok(errors.some(function(l) { return l.includes('Failed to load bwserve'); }));
        assert.strictEqual(exitCode, 1);
        done();
      });
    } else {
      done();
    }
  });

  it("valid args should import bwserve and call startAttach", function(done) {
    this.timeout(10000);
    var fakeInput = new PassThrough();
    var fakeOutput = new PassThrough();
    var promise = runAttach(['--port', '9876'], { input: fakeInput, output: fakeOutput });
    if (promise && promise.then) {
      promise.then(function(result) {
        // startAttach was called successfully
        assert.ok(result, 'should return { rl, app }');
        assert.ok(result.rl, 'should have rl');
        assert.ok(result.app, 'should have app');
        // Clean up
        result.rl.removeAllListeners('close');
        result.rl.close();
        if (result.app.close) {
          result.app.close().then(function() { done(); });
        } else {
          done();
        }
      }).catch(function(err) {
        done(err);
      });
    } else {
      done();
    }
  });
});

// ===================================================================================
// startAttach() tests
// ===================================================================================

describe("startAttach()", function() {
  var origLog, origError, origExit;
  var logged, errors;
  var instances;

  beforeEach(function() {
    origLog = console.log;
    origError = console.error;
    origExit = process.exit;
    logged = [];
    errors = [];
    instances = [];
    console.log = function() {
      logged.push(Array.prototype.slice.call(arguments).join(' '));
    };
    console.error = function() {
      errors.push(Array.prototype.slice.call(arguments).join(' '));
    };
    process.exit = function() {};
  });

  afterEach(function() {
    // Close all readline instances BEFORE restoring process.exit
    for (var inst of instances) {
      try {
        // Remove the close listener that calls process.exit
        inst.rl.removeAllListeners('close');
        inst.rl.close();
      } catch (e) {}
    }
    console.log = origLog;
    console.error = origError;
    process.exit = origExit;
  });

  function makeMockBwserve() {
    var mockApp = {
      _clients: new Map(),
      _handleSSE: function(req, res, clientId) {},
      listen: function(cb) { if (cb) setImmediate(cb); },
      close: function() { return Promise.resolve(); }
    };
    return {
      create: function(opts) { return mockApp; },
      _app: mockApp
    };
  }

  function makeInstance(overrides) {
    var mockBwserve = makeMockBwserve();
    var fakeInput = new PassThrough();
    var fakeOutput = new PassThrough();
    var opts = Object.assign({
      port: 7999,
      allowScreenshot: false,
      verbose: false,
      input: fakeInput,
      output: fakeOutput
    }, overrides || {});
    var result = startAttach(mockBwserve, opts);
    result.fakeInput = fakeInput;
    result.mockBwserve = mockBwserve;
    instances.push(result);
    return result;
  }

  it("should start server and print connection info", function(done) {
    makeInstance({ port: 7999 });
    setTimeout(function() {
      assert.ok(logged.some(function(l) { return l.includes('bwcli attach'); }));
      assert.ok(logged.some(function(l) { return l.includes('7999'); }));
      assert.ok(logged.some(function(l) { return l.includes('Waiting for connection'); }));
      done();
    }, 50);
  });

  it("should print screenshot enabled when allowScreenshot is true", function(done) {
    makeInstance({ allowScreenshot: true });
    setTimeout(function() {
      assert.ok(logged.some(function(l) { return l.includes('Screenshot: enabled'); }));
      done();
    }, 50);
  });

  it("should handle empty line input", function(done) {
    var inst = makeInstance();
    inst.fakeInput.write('\n');
    setTimeout(function() {
      // Empty line just re-prompts, no output
      done();
    }, 50);
  });

  it("should show 'No client connected' for JS expression with no client", function(done) {
    var inst = makeInstance();
    inst.fakeInput.write('document.title\n');
    setTimeout(function() {
      assert.ok(logged.some(function(l) { return l.includes('No client connected'); }));
      done();
    }, 50);
  });

  it("should dispatch slash commands from line input", function(done) {
    var inst = makeInstance();
    inst.fakeInput.write('/help\n');
    setTimeout(function() {
      assert.ok(logged.some(function(l) { return l.includes('/inspect'); }));
      done();
    }, 50);
  });

  it("should handle monkey-patched _handleSSE for attach clients", function() {
    var inst = makeInstance();
    var app = inst.mockBwserve._app;

    // Simulate an attach client connecting (no existing record)
    var mockReq = new EventEmitter();
    var clientId = 'att_test_1';
    app._handleSSE(mockReq, {}, clientId);

    assert.ok(app._clients.has(clientId));
    assert.strictEqual(app._clients.get(clientId).pagePath, '/_attach');
  });

  it("should handle client with record.client set (full attach flow)", function() {
    var inst = makeInstance();
    var app = inst.mockBwserve._app;

    // Pre-populate the record with a mock client
    var mockClient = new EventEmitter();
    mockClient.id = 'att_c1';
    mockClient._allowScreenshot = false;
    app._clients.set('att_c1', { pagePath: '/_attach', client: mockClient });

    var mockReq = new EventEmitter();
    app._handleSSE(mockReq, {}, 'att_c1');

    assert.ok(logged.some(function(l) { return l.includes('[connected]'); }));
  });

  it("should handle _bw_event from connected client", function() {
    var inst = makeInstance();
    var app = inst.mockBwserve._app;

    var mockClient = new EventEmitter();
    mockClient.id = 'att_e1';
    app._clients.set('att_e1', { pagePath: '/_attach', client: mockClient });

    var mockReq = new EventEmitter();
    app._handleSSE(mockReq, {}, 'att_e1');

    // Emit a _bw_event
    mockClient.emit('_bw_event', {
      event: 'click',
      selector: 'button',
      tagName: 'BUTTON',
      id: 'btn1',
      text: 'Click me'
    });

    assert.ok(logged.some(function(l) { return l.includes('[event]') && l.includes('click'); }));
  });

  it("should handle _bw_event without id or text", function() {
    var inst = makeInstance();
    var app = inst.mockBwserve._app;

    var mockClient = new EventEmitter();
    mockClient.id = 'att_e2';
    app._clients.set('att_e2', { pagePath: '/_attach', client: mockClient });

    var mockReq = new EventEmitter();
    app._handleSSE(mockReq, {}, 'att_e2');

    mockClient.emit('_bw_event', {
      event: 'mouseover',
      selector: 'div',
      tagName: 'DIV'
    });

    assert.ok(logged.some(function(l) { return l.includes('[event]') && l.includes('mouseover'); }));
  });

  it("should handle client disconnect", function() {
    var inst = makeInstance();
    var app = inst.mockBwserve._app;

    var mockClient = new EventEmitter();
    mockClient.id = 'att_d1';
    app._clients.set('att_d1', { pagePath: '/_attach', client: mockClient });

    var mockReq = new EventEmitter();
    app._handleSSE(mockReq, {}, 'att_d1');

    // Simulate disconnect
    mockReq.emit('close');

    assert.ok(logged.some(function(l) { return l.includes('[disconnected]'); }));
    assert.ok(logged.some(function(l) { return l.includes('Waiting for connection'); }));
  });

  it("should switch active client on disconnect when others remain", function() {
    var inst = makeInstance();
    var app = inst.mockBwserve._app;

    // Connect first client
    var client1 = new EventEmitter();
    client1.id = 'att_s1';
    app._clients.set('att_s1', { pagePath: '/_attach', client: client1 });
    var req1 = new EventEmitter();
    app._handleSSE(req1, {}, 'att_s1');

    // Connect second client
    var client2 = new EventEmitter();
    client2.id = 'att_s2';
    app._clients.set('att_s2', { pagePath: '/_attach', client: client2 });
    var req2 = new EventEmitter();
    app._handleSSE(req2, {}, 'att_s2');

    // Disconnect second (active) client
    req2.emit('close');

    // First client should now be active
    assert.ok(logged.some(function(l) { return l.includes('[active]'); }));
  });

  it("should handle JS query with connected client", function(done) {
    var inst = makeInstance({ verbose: false });
    var app = inst.mockBwserve._app;

    // Set up a mock client with query method
    var mockClient = new EventEmitter();
    mockClient.id = 'att_q1';
    mockClient.query = function(code, opts) {
      return Promise.resolve('test-title');
    };
    app._clients.set('att_q1', { pagePath: '/_attach', client: mockClient });
    var mockReq = new EventEmitter();
    app._handleSSE(mockReq, {}, 'att_q1');

    // Send a JS expression
    inst.fakeInput.write('document.title\n');
    setTimeout(function() {
      assert.ok(logged.some(function(l) { return l === 'test-title'; }));
      done();
    }, 100);
  });

  it("should handle JS query that returns object", function(done) {
    var inst = makeInstance();
    var app = inst.mockBwserve._app;

    var mockClient = new EventEmitter();
    mockClient.id = 'att_q2';
    mockClient.query = function() {
      return Promise.resolve({ foo: 'bar' });
    };
    app._clients.set('att_q2', { pagePath: '/_attach', client: mockClient });
    var mockReq = new EventEmitter();
    app._handleSSE(mockReq, {}, 'att_q2');

    inst.fakeInput.write('someObj\n');
    setTimeout(function() {
      assert.ok(logged.some(function(l) { return l.includes('"foo"'); }));
      done();
    }, 100);
  });

  it("should handle JS query that returns null", function(done) {
    var inst = makeInstance();
    var app = inst.mockBwserve._app;

    var mockClient = new EventEmitter();
    mockClient.id = 'att_q3';
    mockClient.query = function() {
      return Promise.resolve(null);
    };
    app._clients.set('att_q3', { pagePath: '/_attach', client: mockClient });
    var mockReq = new EventEmitter();
    app._handleSSE(mockReq, {}, 'att_q3');

    inst.fakeInput.write('null\n');
    setTimeout(function() {
      assert.ok(logged.some(function(l) { return l === 'undefined'; }));
      done();
    }, 100);
  });

  it("should handle JS query rejection", function(done) {
    var inst = makeInstance();
    var app = inst.mockBwserve._app;

    var mockClient = new EventEmitter();
    mockClient.id = 'att_q4';
    mockClient.query = function() {
      return Promise.reject(new Error('eval failed'));
    };
    app._clients.set('att_q4', { pagePath: '/_attach', client: mockClient });
    var mockReq = new EventEmitter();
    app._handleSSE(mockReq, {}, 'att_q4');

    inst.fakeInput.write('badcode\n');
    setTimeout(function() {
      assert.ok(errors.some(function(l) { return l.includes('eval failed'); }));
      done();
    }, 100);
  });

  it("should show verbose query info when verbose is true", function(done) {
    var inst = makeInstance({ verbose: true });
    var app = inst.mockBwserve._app;

    var mockClient = new EventEmitter();
    mockClient.id = 'att_v1';
    mockClient.query = function() { return Promise.resolve('ok'); };
    app._clients.set('att_v1', { pagePath: '/_attach', client: mockClient });
    var mockReq = new EventEmitter();
    app._handleSSE(mockReq, {}, 'att_v1');

    inst.fakeInput.write('1+1\n');
    setTimeout(function() {
      assert.ok(logged.some(function(l) { return l.includes('[query]'); }));
      done();
    }, 100);
  });

  it("should handle rl close event", function(done) {
    var inst = makeInstance();
    inst.rl.close();
    setTimeout(function() {
      assert.ok(logged.some(function(l) { return l.includes('Exiting'); }));
      done();
    }, 50);
  });

  it("should handle query result that throws on JSON.stringify", function(done) {
    var inst = makeInstance();
    var app = inst.mockBwserve._app;

    var mockClient = new EventEmitter();
    mockClient.id = 'att_circ';
    var circular = {};
    circular.self = circular;
    mockClient.query = function() { return Promise.resolve(circular); };
    app._clients.set('att_circ', { pagePath: '/_attach', client: mockClient });
    var mockReq = new EventEmitter();
    app._handleSSE(mockReq, {}, 'att_circ');

    inst.fakeInput.write('circularObj\n');
    setTimeout(function() {
      // Should fall back to String(result)
      assert.ok(logged.some(function(l) { return l.includes('[object Object]'); }));
      done();
    }, 100);
  });
});

// ===================================================================================
// runAttach() branch coverage: --allow-screenshot flag (line 131)
// ===================================================================================

describe("runAttach() --allow-screenshot flag", function() {
  var origExit, origLog, origError;
  var exitCode, logged, errors;

  beforeEach(function() {
    origExit = process.exit;
    origLog = console.log;
    origError = console.error;
    exitCode = null;
    logged = [];
    errors = [];
    process.exit = function(code) { exitCode = code; throw new Error('EXIT_' + code); };
    console.log = function() {
      logged.push(Array.prototype.slice.call(arguments).join(' '));
    };
    console.error = function() {
      errors.push(Array.prototype.slice.call(arguments).join(' '));
    };
  });

  afterEach(function() {
    process.exit = origExit;
    console.log = origLog;
    console.error = origError;
  });

  it("should parse --allow-screenshot flag (line 131)", function(done) {
    this.timeout(10000);
    var fakeInput = new PassThrough();
    var fakeOutput = new PassThrough();
    var promise = runAttach(['--port', '9875', '--allow-screenshot'], {
      input: fakeInput,
      output: fakeOutput
    });
    if (promise && promise.then) {
      promise.then(function(result) {
        assert.ok(result, 'should return { rl, app }');
        assert.ok(result.app, 'should have app');
        // The allowScreenshot flag should have been passed to startAttach
        // Verify by checking that the app was created (successful startup)
        result.rl.removeAllListeners('close');
        result.rl.close();
        if (result.app.close) {
          result.app.close().then(function() { done(); });
        } else {
          done();
        }
      }).catch(function(err) { done(err); });
    } else {
      done();
    }
  });
});

// ===================================================================================
// Malformed inputs for attach functions
// ===================================================================================

describe("attach malformed inputs", function() {
  it("wrapExpression with empty string", function() {
    var result = wrapExpression('');
    assert.strictEqual(typeof result, 'string');
  });

  it("wrapExpression with null-ish input should throw", function() {
    assert.throws(function() { wrapExpression(null); });
  });

  it("wrapExpression with numeric input should throw", function() {
    assert.throws(function() { wrapExpression(42); });
  });

  it("printTree with null node", function() {
    var origLog = console.log;
    var logged = [];
    console.log = function() {
      logged.push(Array.prototype.slice.call(arguments).join(' '));
    };
    printTree(null);
    console.log = origLog;
    // Should not crash
    assert.ok(true);
  });

  it("printTree with empty object and indent 0", function() {
    var origLog = console.log;
    var logged = [];
    console.log = function() {
      logged.push(Array.prototype.slice.call(arguments).join(' '));
    };
    printTree({}, 0);
    console.log = origLog;
    assert.ok(logged.length > 0);
    assert.ok(logged[0].includes('?'), 'should print ? for missing tag');
  });

  it("printHelp should return usage text", function() {
    var origLog = console.log;
    var logged = [];
    console.log = function() {
      logged.push(Array.prototype.slice.call(arguments).join(' '));
    };
    printHelp();
    console.log = origLog;
    assert.ok(logged.length > 0);
    assert.ok(logged.some(function(l) { return l.includes('/help') || l.includes('help'); }));
  });

  it("handleSlashCommand with /help should print help", function() {
    var origLog = console.log;
    var logged = [];
    console.log = function() {
      logged.push(Array.prototype.slice.call(arguments).join(' '));
    };
    var mockRl = { prompt: function() {} };
    handleSlashCommand('/help', null, new Map(), { verbose: false }, mockRl);
    console.log = origLog;
    assert.ok(logged.length > 0, 'should have printed help text');
  });
});
