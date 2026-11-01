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
var debugPath = resolve(__dirname, '../src/bitwrench-debug.js');
// The sourceURL annotation lets V8 (and therefore c8) attribute coverage from
// this jsdom eval back to the source file. Without it the file reports 0%
// even though every function below is exercised.
var debugSource = readFileSync(debugPath, 'utf-8') + '\n//# sourceURL=' + debugPath + '\n';

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

// =========================================================================
// bwd.listen() -- the delegated handler itself
//
// listen() was covered, but the closure it registers was never invoked, so
// the actual event-logging behaviour (the point of the tool) was untested.
// =========================================================================

describe("bwd.listen() delegated handler", function() {
  beforeEach(function() {
    freshDOM('<!DOCTYPE html><html><body>' +
      '<div id="app"><button id="go" class="act">Go</button></div>' +
      '<button id="other">Other</button>' +
    '</body></html>');
    dom.window.bw = { version: '2.0.19', getUUID: function() { return ''; } };
    loadBwd();
    restoreConsole();
  });

  function click(el) {
    el.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  }

  it("should log the matched element on a click", function() {
    bwd.listen('.act', 'click');
    restoreConsole();
    click(dom.window.document.getElementById('go'));
    var output = global._consoleLogs.join('\n');
    assert.ok(output.indexOf('[bwd] click on .act -> BUTTON#go') >= 0,
      'should log tag and id, got: ' + output);
    assert.ok(output.indexOf('"Go"') >= 0, 'should log trimmed text content');
  });

  it("should log nothing when the click is outside the selector", function() {
    bwd.listen('.act', 'click');
    restoreConsole();
    click(dom.window.document.getElementById('other'));
    assert.strictEqual(global._consoleLogs.join('\n').indexOf('[bwd] click on'), -1,
      'non-matching target should produce no log');
  });

  it("should match an ancestor, not just the event target", function() {
    bwd.listen('#app', 'click');
    restoreConsole();
    click(dom.window.document.getElementById('go'));
    assert.ok(global._consoleLogs.join('\n').indexOf('[bwd] click on #app -> DIV#app') >= 0,
      'closest() should walk up to the delegated ancestor');
  });

  it("should ignore a target with no closest() (e.g. document)", function() {
    bwd.listen('.act', 'click');
    restoreConsole();
    dom.window.document.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
    assert.strictEqual(global._consoleLogs.join('\n').indexOf('[bwd] click on'), -1,
      'a target without closest() must not throw or log');
  });

  it("should truncate long text content to 50 chars", function() {
    var btn = dom.window.document.getElementById('go');
    btn.textContent = 'x'.repeat(120);
    bwd.listen('.act', 'click');
    restoreConsole();
    click(btn);
    var logged = global._consoleLogs.join('\n');
    var m = logged.match(/"(x+)"/);
    assert.ok(m, 'should log quoted text, got: ' + logged);
    assert.strictEqual(m[1].length, 50, 'text should be clipped to 50 chars');
  });

  it("should log a bare tag for an element with no id and no text", function() {
    var bare = dom.window.document.createElement('span');
    bare.className = 'act';
    dom.window.document.getElementById('app').appendChild(bare);
    bwd.listen('.act', 'click');
    restoreConsole();
    click(bare);
    var output = global._consoleLogs.join('\n');
    assert.ok(output.indexOf('[bwd] click on .act -> SPAN') >= 0,
      'should log the tag, got: ' + output);
    assert.strictEqual(output.indexOf('#'), -1, 'no id fragment when there is no id');
    assert.strictEqual(output.indexOf('"'), -1, 'no text fragment when there is no text');
  });

  it("should stop logging after unlisten()", function() {
    bwd.listen('.act', 'click');
    bwd.unlisten('.act', 'click');
    restoreConsole();
    click(dom.window.document.getElementById('go'));
    assert.strictEqual(global._consoleLogs.join('\n').indexOf('[bwd] click on'), -1,
      'handler must be detached from the document');
  });
});

// =========================================================================
// bwd.state() -- reporting branches
// =========================================================================

describe("bwd.state() reporting", function() {
  beforeEach(function() {
    freshDOM('<!DOCTYPE html><html><body>' +
      '<div id="one" class="bw_lc"></div>' +
    '</body></html>');
    dom.window.bw = { version: '2.0.19', getUUID: function() { return 'uuid-1'; } };
    loadBwd();
    dom.window.document.getElementById('one')._bw_state = { count: 3 };
    restoreConsole();
  });

  it("should log a notice and return [] when nothing matches", function() {
    var rows = bwd.state('.no_such_class');
    assert.deepStrictEqual(rows, []);
    assert.ok(global._consoleLogs.join('\n')
      .indexOf('[bwd] no stateful elements found for ".no_such_class"') >= 0,
      'should say which selector found nothing');
  });

  it("should use console.table when available", function() {
    var tabled = [];
    var origTable = console.table;
    console.table = function(rows) { tabled.push(rows); };
    try {
      var rows = bwd.state();
      assert.strictEqual(rows.length, 1);
      assert.strictEqual(tabled.length, 1, 'console.table should be preferred');
      assert.deepStrictEqual(tabled[0], rows);
    } finally {
      console.table = origTable;
    }
  });

  it("should report empty id and null state, and no uuid without bw.getUUID", function() {
    var plain = dom.window.document.createElement('div');
    plain.className = 'bw_lc';
    dom.window.document.body.appendChild(plain);
    // A bitwrench build without getUUID (or an older one) must not break the dump.
    dom.window.bw = global.window.bw = { version: '2.0.19' };

    var rows = bwd.state();
    assert.strictEqual(rows.length, 2, 'both .bw_lc elements should be listed');
    assert.deepStrictEqual(rows[1], { id: '', uuid: '', state: null },
      'missing id, uuid and state should read as empty rather than undefined');
  });

  it("should fall back to console.log when console.table is missing", function() {
    var origTable = console.table;
    var logged = [];
    var origLog = console.log;
    console.log = function(x) { logged.push(x); };
    console.table = undefined;
    try {
      var rows = bwd.state();
      assert.deepStrictEqual(rows, [{ id: 'one', uuid: 'uuid-1', state: { count: 3 } }]);
      assert.deepStrictEqual(logged, [rows], 'should log the raw rows array');
    } finally {
      console.table = origTable;
      console.log = origLog;
    }
  });
});

// =========================================================================
// bwd.screenshot() -- full capture pipeline with a stubbed html2canvas
//
// Previously only the "no element" path ran; the capture, save and failure
// paths were all untested because html2canvas is absent in Node. A stub
// exercises them without a real canvas.
// =========================================================================

describe("bwd.screenshot() capture pipeline", function() {
  var warnings, origError;

  beforeEach(function() {
    freshDOM('<!DOCTYPE html><html><body><div id="app">shot</div></body></html>');
    dom.window.bw = { version: '2.0.19', getUUID: function() { return ''; } };
    loadBwd();
    restoreConsole();
    warnings = [];
    origError = console.error;
    console.error = function() {
      warnings.push(Array.prototype.slice.call(arguments).join(' '));
    };
  });

  afterEach(function() {
    console.error = origError;
  });

  // A canvas stand-in: records the blob callback instead of rasterising.
  function fakeCanvas(blob) {
    return { toBlob: function(cb) { cb(blob); } };
  }

  it("should hand the element to html2canvas and save via bw.saveClientFile", function() {
    var seen = {};
    var blob = { size: 7 };
    dom.window.html2canvas = function(el, opts) {
      seen.el = el;
      seen.opts = opts;
      return Promise.resolve(fakeCanvas(blob));
    };
    dom.window.bw.saveClientFile = function(name, b) {
      seen.name = name;
      seen.blob = b;
    };
    return bwd.screenshot('#app').then(function() {
      assert.strictEqual(seen.el, dom.window.document.getElementById('app'),
        'should capture the selected element');
      assert.deepStrictEqual(seen.opts, { useCORS: true });
      assert.ok(/^screenshot-\d+\.png$/.test(seen.name),
        'filename should be screenshot-<ts>.png, got: ' + seen.name);
      assert.strictEqual(seen.blob, blob, 'should pass the blob through');
      var output = global._consoleLogs.join('\n');
      assert.ok(output.indexOf('[bwd] capturing #app ...') >= 0, 'should log capture start');
      assert.ok(output.indexOf('[bwd] saved: ' + seen.name) >= 0, 'should log the saved name');
    });
  });

  it("should default to body when no selector is given", function() {
    dom.window.html2canvas = function(el) {
      assert.strictEqual(el, dom.window.document.body, 'should default to body');
      return Promise.resolve(fakeCanvas({}));
    };
    dom.window.bw.saveClientFile = function() {};
    return bwd.screenshot();
  });

  it("should fall back to a download link when bw.saveClientFile is absent", function() {
    var clicked = [];
    var revoked = [];
    // The eval'd source resolves free globals (URL, console) against Node's
    // globals, so the stubs have to go there -- not on dom.window.
    var origCreate = global.URL.createObjectURL;
    var origRevoke = global.URL.revokeObjectURL;
    var origClick = dom.window.HTMLAnchorElement.prototype.click;
    global.URL.createObjectURL = function() { return 'blob:fake'; };
    global.URL.revokeObjectURL = function(u) { revoked.push(u); };
    // Spy on click() so jsdom does not attempt real navigation.
    dom.window.HTMLAnchorElement.prototype.click = function() {
      clicked.push({ href: this.href, download: this.download });
    };
    dom.window.html2canvas = function() { return Promise.resolve(fakeCanvas({})); };
    assert.ok(!dom.window.bw.saveClientFile, 'precondition: no saveClientFile');

    function restore() {
      global.URL.createObjectURL = origCreate;
      global.URL.revokeObjectURL = origRevoke;
      dom.window.HTMLAnchorElement.prototype.click = origClick;
    }

    return bwd.screenshot('#app').then(function() {
      assert.strictEqual(clicked.length, 1, 'should click a generated anchor');
      assert.strictEqual(clicked[0].href, 'blob:fake');
      assert.ok(/^screenshot-\d+\.png$/.test(clicked[0].download),
        'anchor download should be the filename, got: ' + clicked[0].download);
      assert.deepStrictEqual(revoked, ['blob:fake'], 'should revoke the object URL');
    }).then(function() { restore(); }, function(err) { restore(); throw err; });
  });

  it("should report a capture failure without rejecting", function() {
    dom.window.html2canvas = function() {
      return Promise.reject(new Error('canvas exploded'));
    };
    return bwd.screenshot('#app').then(function() {
      assert.ok(warnings.join('\n').indexOf('[bwd] screenshot failed: canvas exploded') >= 0,
        'should console.error the reason, got: ' + warnings.join('\n'));
    });
  });
});

// =========================================================================
// _loadScript() -- CDN fetch for html2canvas and for bitwrench itself
//
// jsdom does not fetch external scripts, so these tests assert the tag that
// gets appended and then settle it by hand.
// =========================================================================

var CDN_BW = 'https://cdn.jsdelivr.net/npm/bitwrench@2/dist/bitwrench.umd.min.js';
var CDN_H2C = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';

function lastScript(src) {
  var scripts = dom.window.document.head.querySelectorAll('script');
  for (var i = scripts.length - 1; i >= 0; i--) {
    if (!src || scripts[i].src === src) return scripts[i];
  }
  return null;
}

describe("bwd CDN loading", function() {
  var warnings, origWarn, origError;

  // The auto-load chain settles over several microtasks (reject -> skipped
  // then() -> catch()), so drain a few before asserting.
  function drain() {
    var p = Promise.resolve();
    for (var i = 0; i < 5; i++) p = p.then(function() {});
    return p;
  }

  beforeEach(function() {
    freshDOM('<!DOCTYPE html><html><head></head><body><div id="app">x</div></body></html>');
    warnings = [];
    origWarn = console.warn;
    origError = console.error;
    console.warn = function() {
      warnings.push(Array.prototype.slice.call(arguments).join(' '));
    };
    console.error = function() {
      warnings.push(Array.prototype.slice.call(arguments).join(' '));
    };
  });

  afterEach(function() {
    console.warn = origWarn;
    console.error = origError;
  });

  it("should request html2canvas from the CDN when it is not loaded", function() {
    dom.window.bw = { version: '2.0.19' };
    loadBwd();
    restoreConsole();
    assert.ok(!dom.window.html2canvas, 'precondition: html2canvas absent');

    var p = bwd.screenshot('#app');
    var tag = lastScript(CDN_H2C);
    assert.ok(tag, 'should append a script tag for html2canvas');

    // Now satisfy the load the way a real CDN would.
    dom.window.html2canvas = function() {
      return Promise.resolve({ toBlob: function(cb) { cb({}); } });
    };
    dom.window.bw.saveClientFile = function() {};
    tag.onload();

    return p.then(function() {
      assert.ok(global._consoleLogs.join('\n').indexOf('[bwd] capturing #app ...') >= 0,
        'capture should proceed once the script loads');
    });
  });

  it("should report a failed html2canvas load instead of hanging", function() {
    dom.window.bw = { version: '2.0.19' };
    loadBwd();
    restoreConsole();

    var p = bwd.screenshot('#app');
    var tag = lastScript(CDN_H2C);
    assert.ok(tag, 'should append a script tag for html2canvas');
    tag.onerror();

    return p.then(function() {
      assert.ok(warnings.join('\n').indexOf('Failed to load ' + CDN_H2C) >= 0,
        'should surface the load failure, got: ' + warnings.join('\n'));
    });
  });

  it("should auto-load bitwrench from the CDN when window.bw is absent", function() {
    loadBwd();
    assert.ok(global._consoleLogs.join('\n')
      .indexOf('[bwd] bitwrench not detected, loading from CDN...') >= 0,
      'should announce the auto-load');
    assert.ok(lastScript(CDN_BW), 'should append a script tag for bitwrench');
  });

  it("should print the ready banner once the bitwrench CDN script loads", function() {
    loadBwd();
    var tag = lastScript(CDN_BW);
    restoreConsole();
    tag.onload();
    return drain().then(function() {
      assert.ok(global._consoleLogs.join('\n')
        .indexOf('[bwd] bitwrench debug toolkit ready') >= 0,
        'should print the banner after the CDN load resolves');
    });
  });

  it("should degrade gracefully when the bitwrench CDN load fails", function() {
    loadBwd();
    var tag = lastScript(CDN_BW);
    restoreConsole();
    tag.onerror();
    return drain().then(function() {
      var output = global._consoleLogs.join('\n');
      assert.ok(warnings.join('\n').indexOf('[bwd] could not load bitwrench') >= 0,
        'should warn, got: ' + warnings.join('\n'));
      assert.ok(output.indexOf('toolkit ready (limited') >= 0,
        'should still offer the DOM-only helpers, got: ' + output);
    });
  });
});

// =========================================================================
// CommonJS export guard
// =========================================================================

describe("bwd module export", function() {
  it("should assign to module.exports when a CommonJS module is present", function() {
    freshDOM();
    dom.window.bw = { version: '2.0.19' };
    // Stand in for a CommonJS wrapper around the file. The guard in the source
    // reads a free `module`, which resolves to the Node global here.
    global.module = { exports: {} };
    try {
      loadBwd();
      var exported = global.module.exports;
      assert.strictEqual(typeof exported.tree, 'function', 'should export the toolkit');
      assert.strictEqual(exported, dom.window.bwd, 'both doors should be the same object');
    } finally {
      delete global.module;
    }
  });
});

// =========================================================================
// Loading the file as a module
//
// Every test above evals the source into a jsdom window, which exercises the
// helpers but not the file's own top-level install. This loads it the way a
// page or a bundler does, against the ambient window.
// =========================================================================

describe("bitwrench-debug.js as a module", function() {
  it("should install itself on the ambient window on import", async function() {
    freshDOM();
    // Present a loaded bitwrench so the import takes the ready path rather
    // than reaching for the CDN.
    dom.window.bw = global.window.bw = { version: '2.0.19' };
    delete dom.window.bwd;

    await import('../src/bitwrench-debug.js');

    assert.ok(global.window.bwd, 'import should install window.bwd');
    ['tree', 'listen', 'unlisten', 'state', 'screenshot'].forEach(function(name) {
      assert.strictEqual(typeof global.window.bwd[name], 'function',
        'window.bwd.' + name + ' should be a function');
    });
    assert.ok(global._consoleLogs.join('\n').indexOf('[bwd] bitwrench debug toolkit ready') >= 0,
      'should print the ready banner, not attempt a CDN load');
  });
});
