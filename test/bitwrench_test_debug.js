/**
 * Bitwrench Debug Toolkit (bwd) Test Suite
 *
 * Tests for src/bitwrench-debug.js:
 *   - bwd.tree(): DOM tree walker
 *   - bwd.state(): stateful element dump
 *   - bwd.listen() / bwd.unlisten(): delegated event listeners
 *   - Auto-detect: when window.bw exists, does not try to load CDN
 *   - screenshot: skipped in Node (requires html2canvas + canvas)
 */

import assert from "assert";
import jsdom from 'jsdom';
const { JSDOM } = jsdom;

var dom, bwd;

function freshDOM(html) {
  html = html || '<!DOCTYPE html><html><body><div id="app"></div></body></html>';
  dom = new JSDOM(html, { url: 'http://localhost/' });
  global.window = dom.window;
  global.document = dom.window.document;
  global.Element = dom.window.Element;
  global.HTMLElement = dom.window.HTMLElement;
  global.Promise = dom.window.Promise || Promise;
  // Stub console.log to capture output
  global._consoleLogs = [];
  var origLog = console.log;
  console.log = function() {
    global._consoleLogs.push(Array.prototype.slice.call(arguments).join(' '));
    origLog.apply(console, arguments);
  };
  return dom;
}

function restoreConsole() {
  // We don't restore since mocha may need it; just clear logs
  global._consoleLogs = [];
}

// We import the debug script as a module. Since it's an IIFE that sets
// window.bwd, we need to load the source and eval it in our jsdom context.
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

var __filename = fileURLToPath(import.meta.url);
var __dirname = dirname(__filename);
var debugSource = readFileSync(resolve(__dirname, '../src/bitwrench-debug.js'), 'utf-8');

function loadBwd() {
  // Remove the auto-load CDN section at the end to avoid network calls in tests.
  // We eval the source in jsdom context after setting up a fake bw.
  dom.window.eval(debugSource);
  bwd = dom.window.bwd;
  return bwd;
}

// =========================================================================
// bwd.tree()
// =========================================================================

describe("bwd.tree()", function() {
  beforeEach(function() {
    freshDOM('<!DOCTYPE html><html><body>' +
      '<div id="app">' +
        '<h1 id="title" class="header big">Hello</h1>' +
        '<div class="content">' +
          '<p>Paragraph</p>' +
          '<span>Span</span>' +
        '</div>' +
      '</div>' +
    '</body></html>');
    // Set a fake bw.version so auto-load doesn't fire
    dom.window.bw = { version: '2.0.19', getUUID: function() { return ''; } };
    loadBwd();
    restoreConsole();
  });

  it("should return a tree structure for #app", function() {
    var result = bwd.tree('#app');
    assert.ok(result, 'should return a tree object');
    assert.strictEqual(result.tag, 'div');
    assert.strictEqual(result.id, 'app');
  });

  it("should include children with correct tags", function() {
    var result = bwd.tree('#app', 2);
    assert.ok(result.children, 'should have children');
    assert.strictEqual(result.children.length, 2);
    assert.strictEqual(result.children[0].tag, 'h1');
    assert.strictEqual(result.children[0].id, 'title');
    assert.ok(result.children[0].cls.indexOf('header') >= 0, 'should include class');
    assert.strictEqual(result.children[1].tag, 'div');
  });

  it("should respect depth limit", function() {
    var result = bwd.tree('#app', 1);
    // At depth 1, children of #app are visible but their children are not
    assert.ok(result.children, 'should have children at depth 0->1');
    var contentDiv = result.children[1]; // .content div
    assert.ok(!contentDiv.children, 'should not have grandchildren at depth 1');
  });

  it("should return null for non-existent selector", function() {
    var result = bwd.tree('#nonexistent');
    assert.strictEqual(result, null);
  });

  it("should default to body if no selector given", function() {
    var result = bwd.tree();
    assert.strictEqual(result.tag, 'body');
  });

  it("should limit classes to 5", function() {
    var el = dom.window.document.createElement('div');
    el.className = 'a b c d e f g';
    dom.window.document.body.appendChild(el);
    var result = bwd.tree('body', 1);
    var last = result.children[result.children.length - 1];
    var classes = last.cls.split(' ');
    assert.ok(classes.length <= 5, 'should limit to 5 classes');
  });

  it("should print to console", function() {
    bwd.tree('#app', 1);
    var output = global._consoleLogs.join('\n');
    assert.ok(output.indexOf('div#app') >= 0, 'should print div#app');
    assert.ok(output.indexOf('h1#title') >= 0, 'should print h1#title');
  });
});

// =========================================================================
// bwd.state()
// =========================================================================

describe("bwd.state()", function() {
  beforeEach(function() {
    freshDOM('<!DOCTYPE html><html><body>' +
      '<div id="counter" class="bw_lc bw_uuid_abc123"></div>' +
      '<div id="timer" class="bw_lc bw_uuid_def456"></div>' +
      '<div id="static">Not stateful</div>' +
    '</body></html>');
    dom.window.bw = {
      version: '2.0.19',
      getUUID: function(el) {
        var classes = el.className.split(' ');
        for (var i = 0; i < classes.length; i++) {
          if (classes[i].indexOf('bw_uuid_') === 0) return classes[i];
        }
        return '';
      }
    };
    // Set _bw_state on elements
    dom.window.document.getElementById('counter')._bw_state = { count: 5 };
    dom.window.document.getElementById('timer')._bw_state = { running: true };
    loadBwd();
    restoreConsole();
  });

  it("should find .bw_lc elements by default", function() {
    var rows = bwd.state();
    assert.strictEqual(rows.length, 2);
  });

  it("should return id and state for each element", function() {
    var rows = bwd.state();
    assert.strictEqual(rows[0].id, 'counter');
    assert.deepStrictEqual(rows[0].state, { count: 5 });
    assert.strictEqual(rows[1].id, 'timer');
    assert.deepStrictEqual(rows[1].state, { running: true });
  });

  it("should include UUID from bw.getUUID()", function() {
    var rows = bwd.state();
    assert.strictEqual(rows[0].uuid, 'bw_uuid_abc123');
    assert.strictEqual(rows[1].uuid, 'bw_uuid_def456');
  });

  it("should accept a custom selector", function() {
    var rows = bwd.state('#counter');
    assert.strictEqual(rows.length, 1);
    assert.strictEqual(rows[0].id, 'counter');
  });

  it("should return empty array if no matches", function() {
    var rows = bwd.state('.nonexistent');
    assert.strictEqual(rows.length, 0);
  });
});

// =========================================================================
// bwd.listen() / bwd.unlisten()
// =========================================================================

describe("bwd.listen() / bwd.unlisten()", function() {
  beforeEach(function() {
    freshDOM('<!DOCTYPE html><html><body>' +
      '<button id="btn1" class="action">Click Me</button>' +
      '<button id="btn2" class="action">Other</button>' +
    '</body></html>');
    dom.window.bw = { version: '2.0.19', getUUID: function() { return ''; } };
    loadBwd();
    restoreConsole();
  });

  it("should register a listener and store in _listeners", function() {
    bwd.listen('button', 'click');
    assert.ok(bwd._listeners['button:::click'], 'should store listener');
    assert.strictEqual(typeof bwd._listeners['button:::click'].fn, 'function');
  });

  it("should not duplicate listeners for same selector+event", function() {
    bwd.listen('button', 'click');
    var fn1 = bwd._listeners['button:::click'].fn;
    restoreConsole();
    bwd.listen('button', 'click');
    var fn2 = bwd._listeners['button:::click'].fn;
    assert.strictEqual(fn1, fn2, 'should be same function reference');
    assert.ok(global._consoleLogs.join('\n').indexOf('already listening') >= 0);
  });

  it("should remove listener with unlisten()", function() {
    bwd.listen('button', 'click');
    assert.ok(bwd._listeners['button:::click']);
    bwd.unlisten('button', 'click');
    assert.ok(!bwd._listeners['button:::click'], 'should be removed');
  });

  it("unlisten on non-existent listener logs message", function() {
    restoreConsole();
    bwd.unlisten('.nonexistent', 'click');
    assert.ok(global._consoleLogs.join('\n').indexOf('no listener') >= 0);
  });
});

// =========================================================================
// Auto-detect: bw present
// =========================================================================

describe("bwd auto-detect", function() {
  it("should print ready message when bw is present", function() {
    freshDOM();
    dom.window.bw = { version: '2.0.19' };
    restoreConsole();
    loadBwd();
    var output = global._consoleLogs.join('\n');
    assert.ok(output.indexOf('[bwd] bitwrench debug toolkit ready') >= 0,
      'should print ready message');
  });

  it("should expose bwd on window", function() {
    freshDOM();
    dom.window.bw = { version: '2.0.19' };
    loadBwd();
    assert.ok(dom.window.bwd, 'window.bwd should exist');
    assert.strictEqual(typeof dom.window.bwd.tree, 'function');
    assert.strictEqual(typeof dom.window.bwd.listen, 'function');
    assert.strictEqual(typeof dom.window.bwd.unlisten, 'function');
    assert.strictEqual(typeof dom.window.bwd.state, 'function');
    assert.strictEqual(typeof dom.window.bwd.screenshot, 'function');
  });
});

// =========================================================================
// bwd.screenshot() -- basic checks (no html2canvas in Node)
// =========================================================================

describe("bwd.screenshot()", function() {
  beforeEach(function() {
    freshDOM();
    dom.window.bw = { version: '2.0.19', getUUID: function() { return ''; } };
    loadBwd();
    restoreConsole();
  });

  it("should return null for non-existent selector", function() {
    return bwd.screenshot('#nonexistent').then(function(result) {
      assert.strictEqual(result, null);
    });
  });
});
