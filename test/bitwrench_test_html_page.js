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

  it("should serialize function onclick via funcRegister", function() {
    var fn = function() { alert('hi'); };
    var html = bw.html({ t: 'button', a: { onclick: fn }, c: 'Click' });
    assert.ok(html.includes("bw.funcGetById("));
    assert.ok(html.includes("bw_fn_0"));
    assert.ok(html.includes("(event)"));
  });

  it("should serialize string onclick as escaped string", function() {
    var html = bw.html({ t: 'button', a: { onclick: "alert('hi')" }, c: 'Click' });
    assert.ok(html.includes('onclick="'));
    assert.ok(html.includes("alert("));
    // Should NOT contain funcGetById
    assert.ok(!html.includes("funcGetById"));
  });

  it("should handle multiple on* handlers on same element", function() {
    var html = bw.html({
      t: 'input',
      a: {
        onclick: function() { return 1; },
        onchange: function() { return 2; }
      }
    });
    assert.ok(html.includes("onclick="));
    assert.ok(html.includes("onchange="));
    assert.ok(html.includes("bw_fn_0"));
    assert.ok(html.includes("bw_fn_1"));
  });

  it("should serialize functions at different nesting levels", function() {
    var html = bw.html({
      t: 'div', c: [
        { t: 'button', a: { onclick: function() { return 'a'; } }, c: 'A' },
        { t: 'div', c: [
          { t: 'button', a: { onclick: function() { return 'b'; } }, c: 'B' }
        ]}
      ]
    });
    assert.ok(html.includes("bw_fn_0"));
    assert.ok(html.includes("bw_fn_1"));
  });

  it("should omit null/false/undefined on* values", function() {
    var html = bw.html({ t: 'button', a: { onclick: null, onchange: false, onkeyup: undefined }, c: 'X' });
    assert.ok(!html.includes("onclick"));
    assert.ok(!html.includes("onchange"));
    assert.ok(!html.includes("onkeyup"));
  });

  it("should register function in bw._fnRegistry", function() {
    var fn = function() { return 42; };
    bw.html({ t: 'button', a: { onclick: fn }, c: 'Click' });
    assert.ok(bw._fnRegistry['bw_fn_0']);
    assert.equal(bw._fnRegistry['bw_fn_0'](), 42);
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
    assert.ok(result.includes("bw._fnRegistry['bw_fn_0']"));
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

  it("should include loadDefaultStyles for cdn runtime", function() {
    var result = bw.htmlPage({ runtime: 'cdn' });
    assert.ok(result.includes('bw.loadDefaultStyles()'));
  });

  it("should not include loadDefaultStyles for shim runtime", function() {
    var result = bw.htmlPage({ runtime: 'shim', body: 'test' });
    assert.ok(!result.includes('bw.loadDefaultStyles()'));
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
});
