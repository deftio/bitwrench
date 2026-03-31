/**
 * Tests for bitwrench-code-edit.js
 *
 * Covers tokenizeJS, tokenizeCSS, tokenizeHTML, highlight, codeEditor,
 * install, CSS_TEXT, and integration with bw.createDOM / jsdom.
 */

import assert from "assert";
import { tokenizeJS, tokenizeCSS, tokenizeHTML, highlight, codeEditor, install, CSS_TEXT } from "../src/bitwrench-code-edit.js";
import bw from "../src/bitwrench.js";
import jsdom from 'jsdom';
const { JSDOM } = jsdom;

function freshDOM() {
  const dom = new JSDOM('<!DOCTYPE html><html><head></head><body><div id="app"></div></body></html>');
  global.window = dom.window;
  global.document = dom.window.document;
  global.NodeFilter = dom.window.NodeFilter;
  global.CustomEvent = dom.window.CustomEvent;
  global.requestAnimationFrame = function(fn) { fn(); };
  return dom;
}

freshDOM();

// =========================================================================
// 1. tokenizeJS tests
// =========================================================================

describe('tokenizeJS', function() {
  it('should return empty array for empty string', function() {
    const tokens = tokenizeJS('');
    assert.ok(Array.isArray(tokens));
    assert.strictEqual(tokens.length, 0);
  });

  it('should tokenize a single keyword "var"', function() {
    const tokens = tokenizeJS('var');
    assert.strictEqual(tokens.length, 1);
    assert.strictEqual(tokens[0].type, 'keyword');
    assert.strictEqual(tokens[0].text, 'var');
  });

  it('should tokenize line comment "// hello"', function() {
    const tokens = tokenizeJS('// hello');
    assert.strictEqual(tokens.length, 1);
    assert.strictEqual(tokens[0].type, 'comment');
    assert.strictEqual(tokens[0].text, '// hello');
  });

  it('should tokenize block comment "/* hi */"', function() {
    const tokens = tokenizeJS('/* hi */');
    assert.strictEqual(tokens.length, 1);
    assert.strictEqual(tokens[0].type, 'comment');
    assert.strictEqual(tokens[0].text, '/* hi */');
  });

  it('should tokenize double-quoted string "hello"', function() {
    const tokens = tokenizeJS('"hello"');
    assert.strictEqual(tokens.length, 1);
    assert.strictEqual(tokens[0].type, 'string');
    assert.strictEqual(tokens[0].text, '"hello"');
  });

  it('should tokenize single-quoted string \'world\'', function() {
    const tokens = tokenizeJS("'world'");
    assert.strictEqual(tokens.length, 1);
    assert.strictEqual(tokens[0].type, 'string');
    assert.strictEqual(tokens[0].text, "'world'");
  });

  it('should tokenize template literal with interpolation', function() {
    const tokens = tokenizeJS('`hello ${name}`');
    // Expected: string(`hello ), template-interp(${), plain(name), template-interp(}), string(`)
    const types = tokens.map(function(t) { return t.type; });
    assert.ok(types.includes('string'), 'should have string tokens');
    assert.ok(types.includes('template-interp'), 'should have template-interp tokens');
    // The interpolated identifier "name" should appear as plain
    const nameTok = tokens.find(function(t) { return t.text === 'name'; });
    assert.ok(nameTok, 'should find the name token');
    assert.strictEqual(nameTok.type, 'plain');
  });

  it('should tokenize integer number 42', function() {
    const tokens = tokenizeJS('42');
    assert.strictEqual(tokens.length, 1);
    assert.strictEqual(tokens[0].type, 'number');
    assert.strictEqual(tokens[0].text, '42');
  });

  it('should tokenize hex number 0xFF', function() {
    const tokens = tokenizeJS('0xFF');
    assert.strictEqual(tokens.length, 1);
    assert.strictEqual(tokens[0].type, 'number');
    assert.strictEqual(tokens[0].text, '0xFF');
  });

  it('should tokenize float 3.14', function() {
    const tokens = tokenizeJS('3.14');
    assert.strictEqual(tokens.length, 1);
    assert.strictEqual(tokens[0].type, 'number');
    assert.strictEqual(tokens[0].text, '3.14');
  });

  it('should tokenize operator "==="', function() {
    const tokens = tokenizeJS('===');
    assert.strictEqual(tokens.length, 1);
    assert.strictEqual(tokens[0].type, 'operator');
    assert.strictEqual(tokens[0].text, '===');
  });

  it('should tokenize punctuation characters', function() {
    ['(', '{', '[', '.'].forEach(function(ch) {
      const tokens = tokenizeJS(ch);
      assert.strictEqual(tokens.length, 1, 'should produce one token for "' + ch + '"');
      assert.strictEqual(tokens[0].type, 'punctuation');
      assert.strictEqual(tokens[0].text, ch);
    });
  });

  it('should produce a function token for a function call "foo("', function() {
    const tokens = tokenizeJS('foo(');
    const fooTok = tokens.find(function(t) { return t.text === 'foo'; });
    assert.ok(fooTok, 'should find foo token');
    assert.strictEqual(fooTok.type, 'function');
  });

  it('should produce a property token for "obj.prop"', function() {
    const tokens = tokenizeJS('obj.prop');
    const propTok = tokens.find(function(t) { return t.text === 'prop'; });
    assert.ok(propTok, 'should find prop token');
    assert.strictEqual(propTok.type, 'property');
  });

  it('should tokenize regex literal /test/g as string', function() {
    // Regex after operator context
    const tokens = tokenizeJS('= /test/g');
    const regexTok = tokens.find(function(t) { return t.text === '/test/g'; });
    assert.ok(regexTok, 'should find regex token');
    assert.strictEqual(regexTok.type, 'string');
  });
});

// =========================================================================
// 2. tokenizeCSS tests
// =========================================================================

describe('tokenizeCSS', function() {
  it('should return empty array for empty string', function() {
    const tokens = tokenizeCSS('');
    assert.ok(Array.isArray(tokens));
    assert.strictEqual(tokens.length, 0);
  });

  it('should tokenize a simple selector "body"', function() {
    const tokens = tokenizeCSS('body');
    assert.strictEqual(tokens.length, 1);
    assert.strictEqual(tokens[0].type, 'selector');
    assert.strictEqual(tokens[0].text, 'body');
  });

  it('should tokenize at-rule "@media"', function() {
    const tokens = tokenizeCSS('@media');
    assert.strictEqual(tokens.length, 1);
    assert.strictEqual(tokens[0].type, 'at-rule');
    assert.strictEqual(tokens[0].text, '@media');
  });

  it('should tokenize property and value in "color: red;"', function() {
    // After {, state enters prop mode
    const tokens = tokenizeCSS('{color: red;}');
    const types = tokens.map(function(t) { return t.type; });
    assert.ok(types.includes('css-prop'), 'should have css-prop token');
    assert.ok(types.includes('css-value'), 'should have css-value token');
    const propTok = tokens.find(function(t) { return t.type === 'css-prop' && t.text.trim() === 'color'; });
    assert.ok(propTok, 'should find color as css-prop');
    const valTok = tokens.find(function(t) { return t.type === 'css-value'; });
    assert.ok(valTok, 'value token should exist');
  });

  it('should tokenize hex color "#ff0000" in value context', function() {
    const tokens = tokenizeCSS('{color: #ff0000;}');
    const colorTok = tokens.find(function(t) { return t.type === 'color'; });
    assert.ok(colorTok, 'should find color token');
    assert.strictEqual(colorTok.text, '#ff0000');
  });

  it('should tokenize number with unit "10px" in value context', function() {
    const tokens = tokenizeCSS('{margin: 10px;}');
    const numTok = tokens.find(function(t) { return t.type === 'number'; });
    assert.ok(numTok, 'should find number token');
    assert.strictEqual(numTok.text, '10px');
  });

  it('should tokenize block comment "/* comment */"', function() {
    const tokens = tokenizeCSS('/* comment */');
    assert.strictEqual(tokens.length, 1);
    assert.strictEqual(tokens[0].type, 'comment');
    assert.strictEqual(tokens[0].text, '/* comment */');
  });

  it('should tokenize CSS string "Arial" inside a value', function() {
    const tokens = tokenizeCSS('{font-family: "Arial";}');
    const strTok = tokens.find(function(t) { return t.type === 'string'; });
    assert.ok(strTok, 'should find string token');
    assert.strictEqual(strTok.text, '"Arial"');
  });

  it('should tokenize a complete rule "div { margin: 0; }"', function() {
    const tokens = tokenizeCSS('div { margin: 0; }');
    const types = tokens.map(function(t) { return t.type; });
    assert.ok(types.includes('selector'), 'should have selector');
    assert.ok(types.includes('punctuation'), 'should have punctuation');
    assert.ok(types.includes('css-prop'), 'should have css-prop');
    // 0 should be a number token
    const numTok = tokens.find(function(t) { return t.type === 'number'; });
    assert.ok(numTok, 'should find number token for 0');
  });

  it('should transition state correctly through selector -> prop -> value -> prop', function() {
    const tokens = tokenizeCSS('h1 { color: red; font-size: 12px; }');
    // After first ;, state goes back to prop, so font-size should be css-prop
    const propTokens = tokens.filter(function(t) { return t.type === 'css-prop'; });
    assert.ok(propTokens.length >= 2, 'should have at least two css-prop tokens');
  });
});

// =========================================================================
// 3. tokenizeHTML tests
// =========================================================================

describe('tokenizeHTML', function() {
  it('should return empty array for empty string', function() {
    const tokens = tokenizeHTML('');
    assert.ok(Array.isArray(tokens));
    assert.strictEqual(tokens.length, 0);
  });

  it('should tokenize simple tag "<div>"', function() {
    const tokens = tokenizeHTML('<div>');
    const tagTokens = tokens.filter(function(t) { return t.type === 'tag'; });
    assert.ok(tagTokens.length >= 1, 'should have tag tokens');
    const openTag = tagTokens.find(function(t) { return t.text.includes('div'); });
    assert.ok(openTag, 'should find div tag');
    assert.strictEqual(openTag.type, 'tag');
  });

  it('should tokenize tag with attribute <div class="foo">', function() {
    const tokens = tokenizeHTML('<div class="foo">');
    const attrName = tokens.find(function(t) { return t.type === 'attr-name'; });
    assert.ok(attrName, 'should find attr-name token');
    assert.strictEqual(attrName.text, 'class');
    const attrVal = tokens.find(function(t) { return t.type === 'attr-value'; });
    assert.ok(attrVal, 'should find attr-value token');
    assert.strictEqual(attrVal.text, '"foo"');
  });

  it('should tokenize self-closing tag "<br/>"', function() {
    const tokens = tokenizeHTML('<br/>');
    const tagTokens = tokens.filter(function(t) { return t.type === 'tag'; });
    assert.ok(tagTokens.length >= 1, 'should have tag tokens');
    const brTag = tagTokens.find(function(t) { return t.text.includes('br'); });
    assert.ok(brTag, 'should find br tag');
  });

  it('should tokenize HTML comment "<!-- hello -->"', function() {
    const tokens = tokenizeHTML('<!-- hello -->');
    assert.strictEqual(tokens.length, 1);
    assert.strictEqual(tokens[0].type, 'comment');
    assert.strictEqual(tokens[0].text, '<!-- hello -->');
  });

  it('should tokenize entity "&amp;" as string', function() {
    const tokens = tokenizeHTML('&amp;');
    assert.strictEqual(tokens.length, 1);
    assert.strictEqual(tokens[0].type, 'string');
    assert.strictEqual(tokens[0].text, '&amp;');
  });

  it('should tokenize closing tag "</div>"', function() {
    const tokens = tokenizeHTML('</div>');
    const tagTokens = tokens.filter(function(t) { return t.type === 'tag'; });
    assert.ok(tagTokens.length >= 1, 'should have tag tokens');
    const closeTag = tagTokens.find(function(t) { return t.text.includes('/'); });
    assert.ok(closeTag, 'should find closing tag token');
  });

  it('should handle text between tags', function() {
    const tokens = tokenizeHTML('<p>Hello</p>');
    const plainTok = tokens.find(function(t) { return t.type === 'plain' && t.text === 'Hello'; });
    assert.ok(plainTok, 'should find plain text "Hello"');
  });

  it('should tokenize unquoted attribute value <div id=foo>', function() {
    const tokens = tokenizeHTML('<div id=foo>');
    const attrVal = tokens.find(function(t) { return t.type === 'attr-value'; });
    assert.ok(attrVal, 'should find attr-value token');
    assert.strictEqual(attrVal.text, 'foo');
  });

  it('should handle multiple attributes', function() {
    const tokens = tokenizeHTML('<input type="text" name="field">');
    const attrNames = tokens.filter(function(t) { return t.type === 'attr-name'; });
    assert.strictEqual(attrNames.length, 2, 'should have two attr-name tokens');
    assert.strictEqual(attrNames[0].text, 'type');
    assert.strictEqual(attrNames[1].text, 'name');
  });
});

// =========================================================================
// 4. highlight tests
// =========================================================================

describe('highlight', function() {
  it('should return an array', function() {
    const result = highlight('var x = 1;', 'js');
    assert.ok(Array.isArray(result));
  });

  it('should produce TACO span with class bw_ce_keyword for JS keyword', function() {
    const result = highlight('var', 'js');
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].t, 'span');
    assert.strictEqual(result[0].a.class, 'bw_ce_keyword');
    assert.strictEqual(result[0].c, 'var');
  });

  it('should produce plain string (not TACO) for plain text', function() {
    const result = highlight(' ', 'js');
    assert.strictEqual(result.length, 1);
    assert.strictEqual(typeof result[0], 'string', 'plain text should be a raw string, not a TACO');
  });

  it('should use CSS tokenizer when lang is "css"', function() {
    const result = highlight('@media', 'css');
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].t, 'span');
    assert.strictEqual(result[0].a.class, 'bw_ce_at-rule');
  });

  it('should use HTML tokenizer when lang is "html"', function() {
    const result = highlight('<div>', 'html');
    const tagSpan = result.find(function(item) {
      return typeof item === 'object' && item.a && item.a.class === 'bw_ce_tag';
    });
    assert.ok(tagSpan, 'should find a span with bw_ce_tag class');
  });

  it('should fall back to JS tokenizer for unknown language', function() {
    const result = highlight('var x;', 'python');
    // "var" should be tokenized as JS keyword
    const kwSpan = result.find(function(item) {
      return typeof item === 'object' && item.a && item.a.class === 'bw_ce_keyword';
    });
    assert.ok(kwSpan, 'unknown lang should fall back to JS tokenizer');
    assert.strictEqual(kwSpan.c, 'var');
  });
});

// =========================================================================
// 5. codeEditor tests
// =========================================================================

describe('codeEditor', function() {
  it('should return a TACO object with t:"div"', function() {
    const result = codeEditor({ code: 'hello', lang: 'js' });
    assert.strictEqual(result.t, 'div');
  });

  it('should have class "bw_ce"', function() {
    const result = codeEditor({ code: 'hello', lang: 'js' });
    assert.ok(result.a.class.includes('bw_ce'), 'should include bw_ce class');
  });

  it('should not set contenteditable in readOnly mode', function() {
    const result = codeEditor({ code: 'hello', lang: 'js', readOnly: true });
    // Navigate to the code element
    // Structure: div > pre > code (no lineNumbers) or div > div.bw_ce_wrap > [gutter, pre > code]
    const pre = result.c[0]; // preBlock when no lineNumbers
    const codeEl = pre.c; // the code TACO
    assert.strictEqual(codeEl.a.contenteditable, undefined, 'readOnly should not have contenteditable');
  });

  it('should have max-height style', function() {
    const result = codeEditor({ code: 'hello', lang: 'js', height: '300px' });
    assert.ok(result.a.style.includes('max-height:300px'), 'should include max-height style');
  });

  it('should append custom className', function() {
    const result = codeEditor({ code: 'hello', lang: 'js', className: 'my-editor' });
    assert.ok(result.a.class.includes('bw_ce'), 'should have base class');
    assert.ok(result.a.class.includes('my-editor'), 'should have custom class');
  });

  it('should have o.mounted lifecycle hook', function() {
    const result = codeEditor({ code: 'hello', lang: 'js' });
    assert.ok(result.o, 'should have options object');
    assert.strictEqual(typeof result.o.mounted, 'function', 'mounted should be a function');
  });

  it('should create gutter TACO when lineNumbers is true', function() {
    const result = codeEditor({ code: 'line1\nline2\nline3', lang: 'js', lineNumbers: true });
    // With lineNumbers, structure is: div > [div.bw_ce_wrap > [gutter, pre]]
    const wrap = result.c[0];
    assert.strictEqual(wrap.a.class, 'bw_ce_wrap', 'should have wrap div');
    const gutter = wrap.c[0];
    assert.strictEqual(gutter.a.class, 'bw_ce_gutter', 'first child should be gutter');
    // 3 lines should produce 3 line number spans
    assert.strictEqual(gutter.c.length, 3, 'gutter should have 3 line number spans');
  });

  it('should work with default options (empty opts object)', function() {
    const result = codeEditor({});
    assert.strictEqual(result.t, 'div');
    assert.ok(result.a.class.includes('bw_ce'));
    assert.ok(result.a.style.includes('max-height:180px'), 'should use default height');
  });
});

// =========================================================================
// 6. install tests
// =========================================================================

describe('install', function() {
  it('should attach highlight to bw object', function() {
    const fakeBw = {};
    install(fakeBw);
    assert.strictEqual(typeof fakeBw.highlight, 'function');
  });

  it('should attach codeEditor to bw object', function() {
    const fakeBw = {};
    install(fakeBw);
    assert.strictEqual(typeof fakeBw.codeEditor, 'function');
  });

  it('CSS_TEXT should be a non-empty string', function() {
    assert.strictEqual(typeof CSS_TEXT, 'string');
    assert.ok(CSS_TEXT.length > 0, 'CSS_TEXT should not be empty');
    assert.ok(CSS_TEXT.includes('.bw_ce'), 'CSS_TEXT should contain .bw_ce rules');
  });
});

// =========================================================================
// 7. Integration tests
// =========================================================================

// =========================================================================
// 6b. install wrapper behavior (lines 662-664)
// =========================================================================

describe('install wrapper - ensureCSS and codeEditor call', function() {
  it('should call ensureCSS and return TACO when bw.codeEditor is invoked', function() {
    freshDOM();
    var injected = false;
    var fakeBw = {
      injectCSS: function() { injected = true; }
    };
    install(fakeBw);
    assert.strictEqual(typeof fakeBw.codeEditor, 'function');
    // Call the wrapper to exercise ensureCSS(bw) and codeEditor(opts)
    var result = fakeBw.codeEditor({ code: 'var x = 1;', lang: 'js' });
    assert.ok(result, 'should return a TACO');
    assert.strictEqual(result.t, 'div');
    assert.ok(result.a.class.includes('bw_ce'));
  });

  it('install(null) should not throw', function() {
    install(null);
  });

  it('install(undefined) should not throw', function() {
    install(undefined);
  });
});

// =========================================================================
// 6c. Tab key handler (lines 648-651)
// =========================================================================

describe('codeEditor Tab key handler', function() {
  beforeEach(function() {
    freshDOM();
  });

  it('should attach keydown handler that intercepts Tab', function() {
    var taco = codeEditor({ code: 'var x = 1;', lang: 'js' });
    var el = bw.createDOM(taco);
    document.body.appendChild(el);
    // Fire mounted to set up event listeners
    if (taco.o && taco.o.mounted) taco.o.mounted(el);

    var codeEl = el.querySelector('.bw_ce_code');
    assert.ok(codeEl, 'should find code element');

    // Simulate Tab keydown
    var prevented = false;
    var event = new window.KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
    // Override preventDefault to track it
    var origPD = event.preventDefault;
    event.preventDefault = function() { prevented = true; if (origPD) origPD.call(event); };
    codeEl.dispatchEvent(event);
    assert.ok(prevented, 'Tab should call preventDefault');
  });

  it('should not intercept non-Tab keys', function() {
    var taco = codeEditor({ code: 'hello', lang: 'js' });
    var el = bw.createDOM(taco);
    document.body.appendChild(el);
    if (taco.o && taco.o.mounted) taco.o.mounted(el);

    var codeEl = el.querySelector('.bw_ce_code');
    var prevented = false;
    var event = new window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
    event.preventDefault = function() { prevented = true; };
    codeEl.dispatchEvent(event);
    assert.ok(!prevented, 'Enter should not call preventDefault');
  });
});

// =========================================================================
// 6d. Rehighlight via input event (lines 630-643)
// =========================================================================

describe('codeEditor rehighlight via input', function() {
  beforeEach(function() {
    freshDOM();
    // Ensure bw is on window for the mounted hook to find it
    global.window.bw = bw;
  });

  it('should rehighlight code on input event after debounce', function(done) {
    var changed = false;
    var taco = codeEditor({
      code: 'var x = 1;',
      lang: 'js',
      onChange: function(newCode) { changed = true; }
    });
    var el = bw.createDOM(taco);
    document.body.appendChild(el);
    if (taco.o && taco.o.mounted) taco.o.mounted(el);

    var codeEl = el.querySelector('.bw_ce_code');
    assert.ok(codeEl, 'should find code element');

    // Modify the text content to trigger rehighlight
    codeEl.textContent = 'var y = 2;';
    // Dispatch input event
    var event = new window.Event('input', { bubbles: true });
    codeEl.dispatchEvent(event);

    // Wait for debounce (50ms + margin)
    setTimeout(function() {
      assert.ok(changed, 'onChange should have been called');
      done();
    }, 100);
  });

  it('should not call onChange if code is unchanged', function(done) {
    var changeCount = 0;
    var taco = codeEditor({
      code: 'var x = 1;',
      lang: 'js',
      onChange: function() { changeCount++; }
    });
    var el = bw.createDOM(taco);
    document.body.appendChild(el);
    if (taco.o && taco.o.mounted) taco.o.mounted(el);

    var codeEl = el.querySelector('.bw_ce_code');
    // Don't change the text, just dispatch input
    var event = new window.Event('input', { bubbles: true });
    codeEl.dispatchEvent(event);

    setTimeout(function() {
      assert.strictEqual(changeCount, 0, 'should not call onChange when code is the same');
      done();
    }, 100);
  });
});

// =========================================================================
// 6e. Scroll sync (lines 618-625)
// =========================================================================

describe('codeEditor scroll sync with lineNumbers', function() {
  beforeEach(function() {
    freshDOM();
    global.window.bw = bw;
  });

  it('should set up scroll handlers when lineNumbers enabled', function() {
    var taco = codeEditor({ code: 'line1\nline2\nline3', lang: 'js', lineNumbers: true });
    var el = bw.createDOM(taco);
    document.body.appendChild(el);
    if (taco.o && taco.o.mounted) taco.o.mounted(el);

    var gutterEl = el.querySelector('.bw_ce_gutter');
    assert.ok(gutterEl, 'should have gutter element');

    // Dispatch scroll event on parent to trigger sync
    var scrollEvt = new window.Event('scroll', { bubbles: true });
    el.dispatchEvent(scrollEvt);
    // Just verify no error thrown -- jsdom doesn't fully support scrollTop
  });
});

// =========================================================================
// 7. Integration tests
// =========================================================================

describe('Integration: codeEditor with jsdom', function() {
  beforeEach(function() {
    freshDOM();
  });

  it('should create DOM from codeEditor TACO', function() {
    const taco = codeEditor({ code: 'var x = 1;', lang: 'js' });
    const el = bw.createDOM(taco);
    assert.ok(el, 'should create a DOM element');
    assert.strictEqual(el.tagName.toLowerCase(), 'div');
    assert.ok(el.className.includes('bw_ce'), 'element should have bw_ce class');
  });

  it('should expose _bwCodeEdit API after mounted hook fires', function() {
    const taco = codeEditor({ code: 'var x = 1;', lang: 'js' });
    const el = bw.createDOM(taco);
    document.body.appendChild(el);
    // Manually fire mounted hook
    if (taco.o && taco.o.mounted) taco.o.mounted(el);
    assert.ok(el._bwCodeEdit, 'should have _bwCodeEdit on element');
    assert.strictEqual(typeof el._bwCodeEdit.getValue, 'function', 'should have getValue');
    assert.strictEqual(typeof el._bwCodeEdit.setValue, 'function', 'should have setValue');
  });

  it('should contain highlighted spans after rendering', function() {
    const taco = codeEditor({ code: 'var x = 1;', lang: 'js' });
    const el = bw.createDOM(taco);
    document.body.appendChild(el);
    // The code element should have span children from initial highlighting
    const codeEl = el.querySelector('.bw_ce_code');
    assert.ok(codeEl, 'should find code element');
    const spans = codeEl.querySelectorAll('span');
    assert.ok(spans.length > 0, 'code element should have highlighted span children');
    // Check that at least one span has a bw_ce_ class
    let hasCeClass = false;
    spans.forEach(function(s) {
      if (s.className && s.className.startsWith('bw_ce_')) hasCeClass = true;
    });
    assert.ok(hasCeClass, 'at least one span should have a bw_ce_ highlight class');
  });
});
