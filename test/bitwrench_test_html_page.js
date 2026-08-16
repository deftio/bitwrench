/**
 * Bitwrench bw.html() function serialization + bw.htmlPage() tests
 */

import assert from "assert";
import bw from "../src/bitwrench.js";

describe("bw.html() function serialization", function() {

  beforeEach(function() {
    // Clear registry between tests for predictable IDs
    bw._fnRegistry = {};
    bw._fnIDCounter = 0;
  });

  // ---- Default path: no {fns} ------------------------------------------
  //
  // bw.html(taco) must produce HTML whose handler fires, with no binding pass
  // for the caller to remember. This is how 1.x and 2.0.x behaved; 1.x even
  // shipped an opt-out (o.atrOnEventRegister:false) rather than making it
  // opt-in. v2.1.0 replaced it with a silent drop unless {fns} was passed,
  // which quietly broke every bare bw.html() carrying a handler -- including
  // the demo on pages/15-html-generation.html. These tests pin the default so
  // it cannot regress silently again.

  it("should auto-register a function handler when no fns registry is given", function() {
    var called = 0;
    var html = bw.html({ t: 'button', a: { onclick: function() { called++; } }, c: 'Click' });

    assert.ok(html.includes('onclick="'), 'should emit an inline on* attribute');
    assert.ok(html.includes("bw.funcGetById('bw_fn_0')(event)"),
      'should emit the dispatch string. Got: ' + html);

    // The function is reachable and callable through the global registry --
    // this is what makes the emitted HTML work with no binding step.
    var resolved = bw.funcGetById('bw_fn_0');
    assert.strictEqual(typeof resolved, 'function');
    resolved();
    assert.strictEqual(called, 1, 'dispatch should reach the original function');
  });

  it("should not silently drop handlers when no fns registry is given", function() {
    // The specific 2.1.0 regression: handler vanished, nothing thrown, nothing
    // logged -- only a bw:diag nobody listens to.
    var html = bw.html({ t: 'button', a: { onclick: function() {} }, c: 'Click' });
    assert.ok(/onclick=|bw_fn_/.test(html),
      'a handler must leave some trace in the output. Got: ' + html);
  });

  it("should auto-register bound functions, which the fns path cannot serialize", function() {
    // The global registry holds a live reference, so there is nothing to
    // stringify and bound/native functions work. {fns} has to reject them.
    var bound = (function() { return this.n; }).bind({ n: 7 });

    var auto = bw.html({ t: 'b', a: { onclick: bound }, c: 'x' });
    assert.ok(auto.includes('funcGetById'), 'auto path should handle a bound fn');

    var fns = {};
    bw.html({ t: 'b', a: { onclick: bound }, c: 'x' }, { fns: fns });
    assert.strictEqual(Object.keys(fns).length, 0, 'fns path should reject a bound fn');
  });

  // ---- Opt-in path: {fns} ----------------------------------------------

  it("should serialize function onclick via fns registry", function() {
    var fn = function() { alert('hi'); };
    var fns = {};
    var html = bw.html({ t: 'button', a: { onclick: fn }, c: 'Click' }, { fns: fns, _fnCounter: 0 });
    // With {fns}, nothing executable goes in the markup -- a bw_fn_* class
    // token instead, which the caller binds. bw.htmlPage() emits that binder.
    assert.ok(html.includes("bw_fn_0"));
    assert.ok(!html.includes('onclick='), 'no inline handler, so output is CSP-safe');
    assert.ok(fns['bw_fn_0'], 'function should be registered in fns');
    assert.strictEqual(fns['bw_fn_0'].event, 'click');
  });

  it("should serialize string onclick as escaped string", function() {
    var html = bw.html({ t: 'button', a: { onclick: "alert('hi')" }, c: 'Click' });
    assert.ok(html.includes('onclick="'));
    assert.ok(html.includes("alert("));
    // Should NOT contain funcGetById
    assert.ok(!html.includes("funcGetById"));
  });

  it("should handle multiple on* handlers on same element", function() {
    var fns = {};
    var html = bw.html({
      t: 'input',
      a: {
        onclick: function() { return 1; },
        onchange: function() { return 2; }
      }
    }, { fns: fns, _fnCounter: 0 });
    // v2.1: no inline on* attributes, just bw_fn_* class tokens
    assert.ok(!html.includes("onclick="));
    assert.ok(!html.includes("onchange="));
    assert.ok(html.includes("bw_fn_0"));
    assert.ok(html.includes("bw_fn_1"));
    assert.strictEqual(fns['bw_fn_0'].event, 'click');
    assert.strictEqual(fns['bw_fn_1'].event, 'change');
  });

  it("should serialize functions at different nesting levels", function() {
    var fns = {};
    var html = bw.html({
      t: 'div', c: [
        { t: 'button', a: { onclick: function() { return 'a'; } }, c: 'A' },
        { t: 'div', c: [
          { t: 'button', a: { onclick: function() { return 'b'; } }, c: 'B' }
        ]}
      ]
    }, { fns: fns, _fnCounter: 0 });
    assert.ok(html.includes("bw_fn_0"));
    assert.ok(html.includes("bw_fn_1"));
  });

  it("should omit null/false/undefined on* values", function() {
    var html = bw.html({ t: 'button', a: { onclick: null, onchange: false, onkeyup: undefined }, c: 'X' });
    assert.ok(!html.includes("onclick"));
    assert.ok(!html.includes("onchange"));
    assert.ok(!html.includes("onkeyup"));
  });

  it("should register function in fns registry", function() {
    var fns = {};
    var fn = function() { return 42; };
    bw.html({ t: 'button', a: { onclick: fn }, c: 'Click' }, { fns: fns, _fnCounter: 0 });
    assert.ok(fns['bw_fn_0']);
    assert.equal(fns['bw_fn_0'].fn(), 42);
  });

  it("should produce correct funcGetDispatchStr format", function() {
    var str = bw.funcGetDispatchStr('bw_fn_0', 'event');
    assert.equal(str, "bw.funcGetById('bw_fn_0')(event)");
  });

  it("should not skip non-function non-string on* values", function() {
    // Number value for onclick should be skipped (only function and string emitted)
    var html = bw.html({ t: 'button', a: { onclick: 123 }, c: 'X' });
    assert.ok(!html.includes("onclick"));
  });
});

describe("bw._FUNC_REGISTRY_SHIM", function() {

  it("should be a non-empty string", function() {
    assert.equal(typeof bw._FUNC_REGISTRY_SHIM, 'string');
    assert.ok(bw._FUNC_REGISTRY_SHIM.length > 0);
  });

  it("should contain bw._fnRegistry and bw.funcGetById", function() {
    assert.ok(bw._FUNC_REGISTRY_SHIM.includes('bw._fnRegistry'));
    assert.ok(bw._FUNC_REGISTRY_SHIM.includes('bw.funcGetById'));
  });
});

describe("bw.htmlPage()", function() {

  beforeEach(function() {
    bw._fnRegistry = {};
    bw._fnIDCounter = 0;
  });

  it("should return string starting with <!DOCTYPE html>", function() {
    var result = bw.htmlPage();
    assert.ok(result.startsWith('<!DOCTYPE html>'));
  });

  it("should contain <title> from opts", function() {
    var result = bw.htmlPage({ title: 'My Test Page' });
    assert.ok(result.includes('<title>My Test Page</title>'));
  });

  it("should render TACO body via bw.html()", function() {
    var result = bw.htmlPage({ body: { t: 'h1', c: 'Hello' } });
    assert.ok(result.includes('<h1>Hello</h1>'));
  });

  it("should pass string body through as-is", function() {
    var result = bw.htmlPage({ body: '<p>Raw HTML</p>' });
    assert.ok(result.includes('<p>Raw HTML</p>'));
  });

  it("should include shim script for runtime:'shim'", function() {
    var result = bw.htmlPage({ runtime: 'shim' });
    assert.ok(result.includes(bw._FUNC_REGISTRY_SHIM));
  });

  it("should not include any script in head for runtime:'none'", function() {
    var result = bw.htmlPage({ runtime: 'none', body: 'hello' });
    var headMatch = result.match(/<head>([\s\S]*?)<\/head>/);
    assert.ok(headMatch);
    assert.ok(!headMatch[1].includes('<script'));
  });

  it("should contain jsdelivr URL for runtime:'cdn'", function() {
    var result = bw.htmlPage({ runtime: 'cdn' });
    assert.ok(result.includes('cdn.jsdelivr.net'));
    assert.ok(result.includes('bitwrench.umd.min.js'));
  });

  it("should include css option in <style> block", function() {
    var result = bw.htmlPage({ css: '.test { color: red; }' });
    assert.ok(result.includes('<style>'));
    assert.ok(result.includes('.test { color: red; }'));
  });

  it("should render extra head elements", function() {
    var result = bw.htmlPage({
      head: [
        { t: 'meta', a: { name: 'author', content: 'Test' } }
      ]
    });
    assert.ok(result.includes('name="author"'));
    assert.ok(result.includes('content="Test"'));
  });

  it("should include favicon link", function() {
    var result = bw.htmlPage({ favicon: '/icon.png' });
    assert.ok(result.includes('<link rel="icon" href="/icon.png">'));
  });

  it("should emit funcRegistry entries in body-end script", function() {
    var fn = function() { return 'works'; };
    var result = bw.htmlPage({
      body: { t: 'button', a: { onclick: fn }, c: 'Click' },
      runtime: 'shim'
    });
    // v2.1: body-end script uses local r[] registry with fn+event entries
    assert.ok(result.includes("r['bw_fn_0']"));
    assert.ok(result.includes("return 'works'"));
  });

  it("should produce valid HTML with default options", function() {
    var result = bw.htmlPage();
    assert.ok(result.includes('<!DOCTYPE html>'));
    assert.ok(result.includes('<html lang="en">'));
    assert.ok(result.includes('<head>'));
    assert.ok(result.includes('</head>'));
    assert.ok(result.includes('<body>'));
    assert.ok(result.includes('</body>'));
    assert.ok(result.includes('</html>'));
  });

  it("should respect lang option", function() {
    var result = bw.htmlPage({ lang: 'fr' });
    assert.ok(result.includes('<html lang="fr">'));
  });

  it("should handle body as array of TACOs", function() {
    var result = bw.htmlPage({
      body: [
        { t: 'h1', c: 'Title' },
        { t: 'p', c: 'Paragraph' }
      ]
    });
    assert.ok(result.includes('<h1>Title</h1>'));
    assert.ok(result.includes('<p>Paragraph</p>'));
  });

  it("should resolve state in body content", function() {
    var result = bw.htmlPage({
      body: { t: 'span', c: '${name}' },
      state: { name: 'World' }
    });
    assert.ok(result.includes('World'));
  });

  it("should include loadStyles for cdn runtime", function() {
    var result = bw.htmlPage({ runtime: 'cdn' });
    assert.ok(result.includes('bw.loadStyles()'));
  });

  it("should not include loadStyles for shim runtime", function() {
    var result = bw.htmlPage({ runtime: 'shim', body: 'test' });
    assert.ok(!result.includes('bw.loadStyles()'));
  });

  it("should handle theme as config object", function() {
    var result = bw.htmlPage({
      theme: { primary: '#336699', secondary: '#cc6633' }
    });
    assert.ok(result.includes('<style>'));
    // Theme CSS should contain color-related rules
    assert.ok(result.length > 500); // Should have substantial theme CSS
  });

  it("should escape title for XSS safety", function() {
    var result = bw.htmlPage({ title: '<script>alert("xss")</script>' });
    assert.ok(!result.includes('<title><script>'));
    assert.ok(result.includes('&lt;script&gt;'));
  });

  // lang was the one attribute in this function still concatenated raw, missed
  // by the 2.1.7 sweep that fixed href/src/class and the favicon two lines
  // above it. Author-supplied rather than attacker-supplied in practice, but
  // "in practice" is the argument every one of these bugs shipped behind.
  it("should escape the lang attribute", function() {
    var result = bw.htmlPage({ lang: 'en" onload="alert(1)' });
    assert.ok(!result.includes('onload="alert(1)"'),
      'lang must not be able to close its own attribute: ' + result.split('\n')[1]);
    assert.ok(result.includes('&quot;'), 'the quote should come out as an entity');
  });

  // <title> is RCDATA: entities decode, so a slash-escaped title rendered fine
  // and only ever looked wrong in the source. Same complaint that motivated the
  // attribute fix -- generated HTML should read like HTML someone wrote.
  it("should not slash-escape the title", function() {
    var result = bw.htmlPage({ title: 'Docs/Guide & More' });
    assert.ok(result.includes('<title>Docs/Guide &amp; More</title>'),
      'title should keep its slashes and still escape &');
  });
});
