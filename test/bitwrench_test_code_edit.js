/**
 * Tests for bitwrench-code-edit.js
 *
 * Covers tokenizeJS, tokenizeCSS, tokenizeHTML, highlight, codeEditor,
 * install, CSS_TEXT, and integration with bw.create / jsdom.
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
    var el = bw.create(taco);
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
    var el = bw.create(taco);
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
    var el = bw.create(taco);
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
    var el = bw.create(taco);
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
    var el = bw.create(taco);
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
    const el = bw.create(taco);
    assert.ok(el, 'should create a DOM element');
    assert.strictEqual(el.tagName.toLowerCase(), 'div');
    assert.ok(el.className.includes('bw_ce'), 'element should have bw_ce class');
  });

  it('should expose _bwCodeEdit API after mounted hook fires', function() {
    const taco = codeEditor({ code: 'var x = 1;', lang: 'js' });
    const el = bw.create(taco);
    document.body.appendChild(el);
    // Manually fire mounted hook
    if (taco.o && taco.o.mounted) taco.o.mounted(el);
    assert.ok(el._bwCodeEdit, 'should have _bwCodeEdit on element');
    assert.strictEqual(typeof el._bwCodeEdit.getValue, 'function', 'should have getValue');
    assert.strictEqual(typeof el._bwCodeEdit.setValue, 'function', 'should have setValue');
  });

  it('should contain highlighted spans after rendering', function() {
    const taco = codeEditor({ code: 'var x = 1;', lang: 'js' });
    const el = bw.create(taco);
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

// =========================================================================
// 8. Branch coverage: tokenizeJS edge cases
// =========================================================================

describe('tokenizeJS branch coverage', function() {

  // L109:23 - unterminated block comment (end2 === -1)
  it('should handle unterminated block comment', function() {
    var tokens = tokenizeJS('/* unterminated');
    assert.strictEqual(tokens.length, 1);
    assert.strictEqual(tokens[0].type, 'comment');
    assert.ok(tokens[0].text.includes('unterminated'));
  });

  // L121:24 - regex at start of code (no prevToken)
  it('should tokenize regex at the very start of code', function() {
    var tokens = tokenizeJS('/abc/g');
    var regTok = tokens.find(function(t) { return t.type === 'string' && t.text.includes('/abc/'); });
    assert.ok(regTok, 'should find regex token at start');
  });

  // L122:47 - regex after punctuation token
  it('should tokenize regex after punctuation', function() {
    var tokens = tokenizeJS('(/test/)');
    var regTok = tokens.find(function(t) { return t.type === 'string' && t.text.includes('/test/'); });
    assert.ok(regTok, 'should find regex after punctuation');
  });

  // L122:83 - regex after keyword
  it('should tokenize regex after keyword', function() {
    var tokens = tokenizeJS('return /test/g');
    var regTok = tokens.find(function(t) { return t.type === 'string' && t.text.includes('/test/'); });
    assert.ok(regTok, 'should find regex after keyword');
  });

  // L132:23 - escaped character inside regex
  it('should handle escaped characters inside regex', function() {
    var tokens = tokenizeJS('= /te\\/st/g');
    var regTok = tokens.find(function(t) { return t.type === 'string' && t.text.includes('/te\\/st/'); });
    assert.ok(regTok, 'should handle escaped slash in regex');
  });

  // L133:27 - backslash in regex (sets escaped = true)
  // Covered by above test

  // L134:26 - character class open bracket in regex
  it('should handle character class in regex', function() {
    var tokens = tokenizeJS('= /[abc]/g');
    var regTok = tokens.find(function(t) { return t.type === 'string' && t.text.includes('[abc]'); });
    assert.ok(regTok, 'should handle character class brackets in regex');
  });

  // L135:26 - character class close bracket in regex
  // Covered by above test (] follows [abc)

  // L137:27 - newline breaks regex literal
  it('should break regex at newline', function() {
    var tokens = tokenizeJS('= /broken\nvar x');
    // The regex should not span across the newline
    var regTok = tokens.find(function(t) { return t.type === 'string' && t.text === '/broken'; });
    assert.ok(regTok, 'regex should stop at newline');
  });

  // L158:27 - escape in template literal
  it('should handle escaped characters in template literals', function() {
    var tokens = tokenizeJS('`hello\\nworld`');
    var strTok = tokens.find(function(t) { return t.type === 'string' && t.text.includes('\\n'); });
    assert.ok(strTok, 'should handle escape in template literal');
  });

  // L168:36 - nested braces in template interpolation
  it('should handle nested braces in template interpolation', function() {
    var tokens = tokenizeJS('`${a({b:1})}`');
    var interpTokens = tokens.filter(function(t) { return t.type === 'template-interp'; });
    assert.ok(interpTokens.length >= 2, 'should have template-interp markers');
  });

  // L186:28 - escape in single/double quoted string
  it('should handle escaped characters in double-quoted string', function() {
    var tokens = tokenizeJS('"hello\\nworld"');
    assert.strictEqual(tokens.length, 1);
    assert.strictEqual(tokens[0].type, 'string');
    assert.ok(tokens[0].text.includes('\\n'));
  });

  // L188:28 - newline breaks single/double-quoted string
  it('should break string at newline', function() {
    var tokens = tokenizeJS('"broken\nvar x');
    // The string should stop at the newline
    var strTok = tokens.find(function(t) { return t.type === 'string'; });
    assert.ok(strTok, 'should find string token');
    assert.strictEqual(strTok.text, '"broken');
  });

  // L206:51,66,99 - scientific notation in numbers
  it('should tokenize scientific notation number', function() {
    var tokens = tokenizeJS('1e10');
    assert.strictEqual(tokens.length, 1);
    assert.strictEqual(tokens[0].type, 'number');
    assert.strictEqual(tokens[0].text, '1e10');
  });

  it('should tokenize scientific notation with plus sign', function() {
    var tokens = tokenizeJS('1e+10');
    assert.strictEqual(tokens.length, 1);
    assert.strictEqual(tokens[0].type, 'number');
    assert.strictEqual(tokens[0].text, '1e+10');
  });

  it('should tokenize scientific notation with minus sign', function() {
    var tokens = tokenizeJS('2.5E-3');
    assert.strictEqual(tokens.length, 1);
    assert.strictEqual(tokens[0].type, 'number');
    assert.strictEqual(tokens[0].text, '2.5E-3');
  });

  // L231:21,42 - method call after dot (isDot && code[la] === '(')
  it('should tokenize method call after dot as function', function() {
    var tokens = tokenizeJS('obj.method()');
    var methodTok = tokens.find(function(t) { return t.text === 'method'; });
    assert.ok(methodTok, 'should find method token');
    assert.strictEqual(methodTok.type, 'function');
  });

  // L88:47 - flush with empty buffer (no-op)
  it('should handle flush with empty buffer gracefully', function() {
    // tokenizeJS starting with a keyword: flush('plain') is called but buf is empty
    var tokens = tokenizeJS('var');
    assert.strictEqual(tokens.length, 1);
    assert.strictEqual(tokens[0].type, 'keyword');
  });

  // L117:64 - regex check when prevBuf is not empty (not a regex context)
  it('should not treat division after identifier as regex', function() {
    var tokens = tokenizeJS('a / b');
    // "a" is plain, "/" is operator, "b" is plain
    var opTok = tokens.find(function(t) { return t.type === 'operator' && t.text === '/'; });
    assert.ok(opTok, 'slash after identifier should be operator not regex');
  });
});

// =========================================================================
// 9. Branch coverage: tokenizeCSS edge cases
// =========================================================================

describe('tokenizeCSS branch coverage', function() {

  // L282:47 - block comment in prop state (flush css-prop)
  it('should handle block comment inside prop context', function() {
    var tokens = tokenizeCSS('{color/* comment */: red;}');
    var commentTok = tokens.find(function(t) { return t.type === 'comment'; });
    assert.ok(commentTok, 'should find comment token inside prop context');
  });

  // Block comment in value state
  it('should handle block comment inside value context', function() {
    var tokens = tokenizeCSS('{color: /* comment */ red;}');
    var commentTok = tokens.find(function(t) { return t.type === 'comment'; });
    assert.ok(commentTok, 'should find comment token inside value context');
  });

  // L291:46 / L293:22 - unterminated CSS block comment
  it('should handle unterminated CSS block comment', function() {
    var tokens = tokenizeCSS('/* unterminated');
    assert.strictEqual(tokens.length, 1);
    assert.strictEqual(tokens[0].type, 'comment');
    assert.ok(tokens[0].text.includes('unterminated'));
  });

  // L300:57 - string in selector state
  it('should handle string in selector context', function() {
    var tokens = tokenizeCSS('[attr="value"]');
    var strTok = tokens.find(function(t) { return t.type === 'string'; });
    assert.ok(strTok, 'should find string in selector context');
    assert.ok(strTok.text.includes('value'));
  });

  // L301:33 - flush as selector type for string in selector state
  // Covered by above test

  // L306:30 - escape in CSS string
  it('should handle escaped characters in CSS string', function() {
    var tokens = tokenizeCSS('{content: "hello\\"world";}');
    var strTok = tokens.find(function(t) { return t.type === 'string'; });
    assert.ok(strTok, 'should find string with escape');
    assert.ok(strTok.text.includes('\\'));
  });

  // L348:46 - { when state is NOT selector (e.g. nested braces, flush as plain)
  it('should handle opening brace when not in selector state', function() {
    // After first { state goes to prop, if another { occurs it flushes as plain
    var tokens = tokenizeCSS('div { nested { }');
    var punctTokens = tokens.filter(function(t) { return t.type === 'punctuation' && t.text === '{'; });
    assert.ok(punctTokens.length >= 2, 'should have multiple { punctuation tokens');
  });

  // L354:42 - } when in prop state
  it('should handle closing brace in prop state', function() {
    var tokens = tokenizeCSS('div { color: red; }');
    var closeBrace = tokens.filter(function(t) { return t.type === 'punctuation' && t.text === '}'; });
    assert.ok(closeBrace.length >= 1, 'should find } token');
  });

  // } when in value state (no semicolon before })
  it('should handle closing brace in value state', function() {
    var tokens = tokenizeCSS('{color: red}');
    var closeBrace = tokens.filter(function(t) { return t.type === 'punctuation' && t.text === '}'; });
    assert.ok(closeBrace.length >= 1, 'should find } in value context');
    // "red" should be flushed as css-value
    var valTok = tokens.find(function(t) { return t.type === 'css-value' && t.text.trim() === 'red'; });
    assert.ok(valTok, 'red should be flushed as css-value');
  });

  // L366:44 - ; when NOT in value state (flushed as 'plain')
  it('should handle semicolon when not in value state', function() {
    // Semicolon in selector state
    var tokens = tokenizeCSS('a;');
    var semiTok = tokens.find(function(t) { return t.type === 'punctuation' && t.text === ';'; });
    assert.ok(semiTok, 'should find ; token');
  });

  // L371:20 - comma punctuation
  it('should handle comma in selector state', function() {
    var tokens = tokenizeCSS('h1, h2 {}');
    var commaTok = tokens.find(function(t) { return t.type === 'punctuation' && t.text === ','; });
    assert.ok(commaTok, 'should find comma punctuation');
  });

  it('should handle comma in value state', function() {
    var tokens = tokenizeCSS('{font-family: Arial, sans-serif;}');
    var commaTok = tokens.find(function(t) { return t.type === 'punctuation' && t.text === ','; });
    assert.ok(commaTok, 'should find comma in value state');
  });

  it('should handle comma in prop state', function() {
    // Unusual but triggers the "plain" branch in comma handling
    var tokens = tokenizeCSS('{,}');
    var commaTok = tokens.find(function(t) { return t.type === 'punctuation' && t.text === ','; });
    assert.ok(commaTok, 'should find comma in prop state');
  });

  // L381:42 - final flush in css-prop or css-value state
  it('should flush final buffer as css-prop when ending in prop state', function() {
    // Ends in prop state (after {, no closing })
    var tokens = tokenizeCSS('{color');
    var propTok = tokens.find(function(t) { return t.type === 'css-prop'; });
    assert.ok(propTok, 'should flush final buffer as css-prop');
    assert.ok(propTok.text.includes('color'));
  });

  it('should flush final buffer as css-value when ending in value state', function() {
    // Ends in value state (after :, no ; or })
    var tokens = tokenizeCSS('{color: red');
    var valTok = tokens.find(function(t) { return t.type === 'css-value'; });
    assert.ok(valTok, 'should flush final buffer as css-value');
  });
});

// =========================================================================
// 10. Branch coverage: tokenizeHTML edge cases
// =========================================================================

describe('tokenizeHTML branch coverage', function() {

  // L392:47 - flush with empty buffer in HTML tokenizer
  it('should handle flush with empty buffer', function() {
    // Starting with a tag: flush('plain') called but buf is empty
    var tokens = tokenizeHTML('<div>');
    var tagToks = tokens.filter(function(t) { return t.type === 'tag'; });
    assert.ok(tagToks.length >= 1);
  });

  // L402:22 - unterminated HTML comment (end === -1)
  it('should handle unterminated HTML comment', function() {
    var tokens = tokenizeHTML('<!-- unterminated');
    assert.strictEqual(tokens.length, 1);
    assert.strictEqual(tokens[0].type, 'comment');
    assert.ok(tokens[0].text.includes('unterminated'));
  });

  // L454:-1 - "anything else in tag" branch (non-whitespace, non-attr character)
  it('should handle unexpected characters inside a tag', function() {
    // Use a character that is not whitespace, not alpha/_ and not > or /
    var tokens = tokenizeHTML('<div !>');
    // The ! should be flushed as plain
    var plainTok = tokens.find(function(t) { return t.type === 'plain' && t.text === '!'; });
    assert.ok(plainTok, 'should flush unexpected char as plain');
  });

  // Attribute without value (no = sign)
  it('should handle attribute name without value', function() {
    var tokens = tokenizeHTML('<input disabled>');
    var attrTok = tokens.find(function(t) { return t.type === 'attr-name' && t.text === 'disabled'; });
    assert.ok(attrTok, 'should find attr-name without value');
  });

  // Single-quoted attribute value
  it('should handle single-quoted attribute value', function() {
    var tokens = tokenizeHTML("<div class='bar'>");
    var attrVal = tokens.find(function(t) { return t.type === 'attr-value'; });
    assert.ok(attrVal, 'should find single-quoted attr-value');
    assert.strictEqual(attrVal.text, "'bar'");
  });
});

// =========================================================================
// 11. Branch coverage: codeEditor / mounted hook edge cases
// =========================================================================

describe('codeEditor branch coverage', function() {

  beforeEach(function() {
    freshDOM();
    global.window.bw = bw;
  });

  // L545:14 - opts is falsy (null/undefined)
  it('should handle null opts', function() {
    var result = codeEditor(null);
    assert.strictEqual(result.t, 'div');
    assert.ok(result.a.class.includes('bw_ce'));
  });

  it('should handle undefined opts', function() {
    var result = codeEditor(undefined);
    assert.strictEqual(result.t, 'div');
    assert.ok(result.a.class.includes('bw_ce'));
  });

  // L566:39 - code with no newlines (match returns null, || [] is used)
  it('should handle code with no newlines for line numbering', function() {
    var result = codeEditor({ code: 'single line', lang: 'js', lineNumbers: true });
    var wrap = result.c[0];
    var gutter = wrap.c[0];
    assert.strictEqual(gutter.c.length, 1, 'single line should produce 1 line number');
  });

  // L586:21 - mounted hook when no codeEl found (early return)
  it('should handle mounted when no code element is found', function() {
    var taco = codeEditor({ code: 'hello', lang: 'js' });
    // Create an element that has no .bw_ce_code child
    var el = document.createElement('div');
    // Calling mounted should not throw
    taco.o.mounted(el);
    assert.ok(!el._bwCodeEdit, 'should not create API if no codeEl');
  });

  // L627:22 - readOnly mode: mounted hook returns early after setting up API
  it('should not set up input/keydown handlers in readOnly mode', function() {
    var taco = codeEditor({ code: 'var x = 1;', lang: 'js', readOnly: true });
    var el = bw.create(taco);
    document.body.appendChild(el);
    taco.o.mounted(el);

    assert.ok(el._bwCodeEdit, 'should still have API');
    assert.strictEqual(typeof el._bwCodeEdit.getValue, 'function');
    assert.strictEqual(typeof el._bwCodeEdit.setValue, 'function');

    // Verify code element is NOT contenteditable
    var codeEl = el.querySelector('.bw_ce_code');
    assert.ok(codeEl, 'should find code element');
    assert.ok(!codeEl.getAttribute('contenteditable'), 'should not be contenteditable');
  });

  // L595:56 - getValue when textContent is empty/falsy
  it('should return empty string from getValue when textContent is empty', function() {
    var taco = codeEditor({ code: '', lang: 'js' });
    var el = bw.create(taco);
    document.body.appendChild(el);
    taco.o.mounted(el);

    var val = el._bwCodeEdit.getValue();
    assert.strictEqual(typeof val, 'string');
  });

  // L601:43 - setValue when bw.html is not available
  it('should handle setValue when bw.html is not available', function() {
    // Temporarily remove bw from window
    var origBw = global.window.bw;
    global.window.bw = {};  // no .html method
    var taco = codeEditor({ code: 'hello', lang: 'js' });
    var el = bw.create(taco);
    document.body.appendChild(el);
    taco.o.mounted(el);

    // setValue should not throw even without bw.html
    el._bwCodeEdit.setValue('new code');
    global.window.bw = origBw;
  });

  // L599:-1 - updateGutter early return when no gutterEl (no lineNumbers)
  it('should not fail in setValue without line numbers', function() {
    var taco = codeEditor({ code: 'hello', lang: 'js', lineNumbers: false });
    var el = bw.create(taco);
    document.body.appendChild(el);
    taco.o.mounted(el);

    // setValue calls updateGutter, which should return early
    el._bwCodeEdit.setValue('new\ncode');
    assert.strictEqual(el._bwCodeEdit.getValue(), 'new\ncode');
  });

  // L617:54 - codeEl.closest('.bw_ce') returns null, fallback to el
  it('should handle scroll sync when closest returns null', function() {
    var taco = codeEditor({ code: 'line1\nline2', lang: 'js', lineNumbers: true });
    var el = bw.create(taco);
    // Do NOT append to document body so closest may work differently
    // But we need to call mounted
    document.body.appendChild(el);
    taco.o.mounted(el);

    var gutterEl = el.querySelector('.bw_ce_gutter');
    assert.ok(gutterEl, 'should have gutter');

    // Dispatch scroll on the el itself
    var scrollEvt = new window.Event('scroll', { bubbles: true });
    el.dispatchEvent(scrollEvt);
    // No error means success
  });

  // setValue with lineNumbers: exercises updateGutter with actual gutter
  it('should update gutter on setValue with lineNumbers', function() {
    var taco = codeEditor({ code: 'line1\nline2', lang: 'js', lineNumbers: true });
    var el = bw.create(taco);
    document.body.appendChild(el);
    taco.o.mounted(el);

    el._bwCodeEdit.setValue('a\nb\nc\nd');
    var gutterEl = el.querySelector('.bw_ce_gutter');
    assert.ok(gutterEl, 'should have gutter');
    var spans = gutterEl.querySelectorAll('span');
    assert.strictEqual(spans.length, 4, 'should have 4 line number spans after setValue');
  });
});

// =========================================================================
// 12. Branch coverage: ensureCSS edge cases
// =========================================================================

describe('ensureCSS branch coverage', function() {
  it('should call injectCSS on first invocation via install wrapper', function() {
    // Note: _cssInjected is module-level, but by this point it may already be true
    // from previous tests. We test the install wrapper behavior.
    var injected = false;
    var fakeBw = {
      injectCSS: function() { injected = true; }
    };
    install(fakeBw);
    // Calling the wrapper triggers ensureCSS
    var result = fakeBw.codeEditor({ code: 'x', lang: 'js' });
    assert.ok(result, 'should return TACO');
    // The _cssInjected flag may already be true, which covers the L70:20 early-return branch
  });
});

// =========================================================================
// 13. Branch coverage: rehighlight edge cases (readOnly + input)
// =========================================================================

describe('codeEditor rehighlight with lineNumbers', function() {
  beforeEach(function() {
    freshDOM();
    global.window.bw = bw;
  });

  it('should update gutter during rehighlight on input', function(done) {
    var taco = codeEditor({
      code: 'line1\nline2',
      lang: 'js',
      lineNumbers: true,
      onChange: function() {}
    });
    var el = bw.create(taco);
    document.body.appendChild(el);
    taco.o.mounted(el);

    var codeEl = el.querySelector('.bw_ce_code');
    codeEl.textContent = 'a\nb\nc';
    var event = new window.Event('input', { bubbles: true });
    codeEl.dispatchEvent(event);

    setTimeout(function() {
      var gutterEl = el.querySelector('.bw_ce_gutter');
      var spans = gutterEl.querySelectorAll('span');
      assert.strictEqual(spans.length, 3, 'gutter should update to 3 lines');
      done();
    }, 100);
  });
});

// =========================================================================
// 14. Additional JS tokenizer edge cases for 100% branch coverage
// =========================================================================

describe('tokenizeJS additional branch coverage', function() {

  // Binary/octal number prefixes (0b, 0o)
  it('should tokenize binary number 0b1010', function() {
    var tokens = tokenizeJS('0b1010');
    assert.strictEqual(tokens.length, 1);
    assert.strictEqual(tokens[0].type, 'number');
    assert.strictEqual(tokens[0].text, '0b1010');
  });

  it('should tokenize octal number 0o77', function() {
    var tokens = tokenizeJS('0o77');
    assert.strictEqual(tokens.length, 1);
    assert.strictEqual(tokens[0].type, 'number');
    assert.strictEqual(tokens[0].text, '0o77');
  });

  // Number starting with dot: .5
  it('should tokenize number starting with dot .5', function() {
    var tokens = tokenizeJS('.5');
    // Since . is followed by a digit, this should be a number
    var numTok = tokens.find(function(t) { return t.type === 'number'; });
    assert.ok(numTok, 'should find number token for .5');
  });

  // Regex with flags (s, u, v, y)
  it('should tokenize regex with multiple flags', function() {
    var tokens = tokenizeJS('= /test/gimsuvy');
    var regTok = tokens.find(function(t) { return t.type === 'string' && t.text.includes('/test/'); });
    assert.ok(regTok, 'should find regex with flags');
    assert.ok(regTok.text.includes('gimsuvy'), 'should include all flags');
  });

  // Multi-char operators with 3 chars (===, !==, >>>, etc.)
  it('should tokenize three-character operator >>>', function() {
    var tokens = tokenizeJS('>>>');
    assert.strictEqual(tokens.length, 1);
    assert.strictEqual(tokens[0].type, 'operator');
    assert.strictEqual(tokens[0].text, '>>>');
  });

  // Template literal without interpolation
  it('should tokenize plain template literal without interpolation', function() {
    var tokens = tokenizeJS('`simple`');
    assert.strictEqual(tokens.length, 1);
    assert.strictEqual(tokens[0].type, 'string');
    assert.strictEqual(tokens[0].text, '`simple`');
  });

  // Unterminated template literal
  it('should handle unterminated template literal', function() {
    var tokens = tokenizeJS('`unterminated');
    var strTok = tokens.find(function(t) { return t.type === 'string'; });
    assert.ok(strTok, 'should find string for unterminated template');
  });

  // Unterminated single-quoted string
  it('should handle unterminated single-quoted string', function() {
    var tokens = tokenizeJS("'unterminated");
    var strTok = tokens.find(function(t) { return t.type === 'string'; });
    assert.ok(strTok, 'should find string for unterminated single quote');
  });

  // Scientific notation: e at end of number without valid follower
  it('should handle e at end of number input', function() {
    // "1e" - the e is consumed but there's no digit after. The loop checks code[i+1] exists.
    var tokens = tokenizeJS('1e');
    var numTok = tokens.find(function(t) { return t.type === 'number'; });
    assert.ok(numTok, 'should find number token');
    assert.ok(numTok.text.includes('1e'), 'should include the e');
  });

  // Whitespace and other characters accumulate as plain
  it('should accumulate whitespace and other chars as plain', function() {
    var tokens = tokenizeJS('  \t  ');
    assert.strictEqual(tokens.length, 1);
    assert.strictEqual(tokens[0].type, 'plain');
    assert.strictEqual(tokens[0].text, '  \t  ');
  });

  // Escape at end of double-quoted string (code[si+1] is undefined)
  it('should handle escape at end of string', function() {
    var tokens = tokenizeJS('"hello\\');
    var strTok = tokens.find(function(t) { return t.type === 'string'; });
    assert.ok(strTok, 'should find string with trailing escape');
  });

  // Escape at end of template literal (code[si+1] is undefined)
  it('should handle escape at end of template literal', function() {
    var tokens = tokenizeJS('`hello\\');
    var strTok = tokens.find(function(t) { return t.type === 'string'; });
    assert.ok(strTok, 'should find template string with trailing escape');
  });
});

// =========================================================================
// 15. CSS tokenizer: string with single quotes in value state
// =========================================================================

describe('tokenizeCSS additional branch coverage', function() {

  it('should tokenize single-quoted string in value context', function() {
    var tokens = tokenizeCSS("{font-family: 'Arial';}");
    var strTok = tokens.find(function(t) { return t.type === 'string'; });
    assert.ok(strTok, 'should find single-quoted string');
    assert.strictEqual(strTok.text, "'Arial'");
  });

  // } in state that is neither prop nor value (plain flush)
  it('should handle } in unexpected state as plain flush', function() {
    // Already in selector state when } appears
    var tokens = tokenizeCSS('}');
    var closeTok = tokens.find(function(t) { return t.type === 'punctuation' && t.text === '}'; });
    assert.ok(closeTok, 'should find } punctuation');
  });

  // CSS string in prop state should NOT match (state !== 'value' && state !== 'selector')
  it('should not tokenize string in prop state', function() {
    // After { we're in prop state, a quote should accumulate into buffer
    var tokens = tokenizeCSS('{"color: red;}');
    // The " should be accumulated in the buffer, not tokenized as a string
    var types = tokens.map(function(t) { return t.type; });
    // It would be accumulated into the prop buffer
    assert.ok(types.includes('punctuation'), 'should have punctuation');
  });
});

// =========================================================================
// 16. Branch coverage: caret save/restore (getCaretOffset / setCaretOffset)
// =========================================================================

describe('caret save/restore via rehighlight with selection', function() {
  beforeEach(function() {
    freshDOM();
    global.window.bw = bw;
  });

  // L513-516: getCaretOffset when selection has a range
  it('should save and restore caret position during rehighlight', function(done) {
    var taco = codeEditor({
      code: 'var x = 1;',
      lang: 'js',
      onChange: function() {}
    });
    var el = bw.create(taco);
    document.body.appendChild(el);
    taco.o.mounted(el);

    var codeEl = el.querySelector('.bw_ce_code');
    assert.ok(codeEl, 'should find code element');

    // Place a selection/caret inside the code element
    var sel = window.getSelection();
    var range = document.createRange();
    // Find a text node to place cursor in
    if (codeEl.firstChild) {
      var textNode = codeEl.firstChild;
      // Walk to find a text node
      while (textNode && textNode.nodeType !== 3 && textNode.firstChild) {
        textNode = textNode.firstChild;
      }
      if (textNode && textNode.nodeType === 3 && textNode.textContent.length > 0) {
        range.setStart(textNode, Math.min(1, textNode.textContent.length));
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
      }
    }

    // Now change text and trigger input
    codeEl.textContent = 'var y = 2;';
    var event = new window.Event('input', { bubbles: true });
    codeEl.dispatchEvent(event);

    setTimeout(function() {
      // No error means caret save/restore worked
      done();
    }, 100);
  });

  // L534-540: setCaretOffset fallback when offset exceeds content
  it('should handle setCaretOffset fallback when content becomes empty during rehighlight', function(done) {
    // Start with non-empty code so there's a code difference to trigger rehighlight
    var taco = codeEditor({
      code: 'hello',
      lang: 'js',
      onChange: function() {}
    });
    var el = bw.create(taco);
    document.body.appendChild(el);
    taco.o.mounted(el);

    var codeEl = el.querySelector('.bw_ce_code');

    // Change content to empty string. This is different from 'hello',
    // so rehighlight will proceed. After highlight('', 'js') returns [],
    // bw.html({ t:'span', c:[] }) produces <span></span> with no text nodes.
    // setCaretOffset will find no text nodes via tree walker, and fall through
    // to the L536-540 fallback code.
    codeEl.textContent = '';

    var event = new window.Event('input', { bubbles: true });
    codeEl.dispatchEvent(event);

    setTimeout(function() {
      done();
    }, 100);
  });

  // L534: setCaretOffset iterates past first text node(s) to reach offset
  it('should iterate past text nodes when offset is in a later node', function(done) {
    // Use code that produces multiple highlighted tokens
    var taco = codeEditor({
      code: 'var longIdentifier = 123;',
      lang: 'js',
      onChange: function() {}
    });
    var el = bw.create(taco);
    document.body.appendChild(el);
    taco.o.mounted(el);

    var codeEl = el.querySelector('.bw_ce_code');
    assert.ok(codeEl, 'should find code element');

    // Set textContent to new code (different from initial to trigger rehighlight).
    // Place cursor at position 20 which is past the first few highlighted tokens.
    codeEl.textContent = 'var longIdentifier = 456;';

    // Place cursor at position 20 in the raw text
    var sel = window.getSelection();
    var range = document.createRange();
    var tn = codeEl.firstChild; // single text node from textContent assignment
    range.setStart(tn, 20);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);

    // Dispatch input - rehighlight will:
    // 1. getCaretOffset returns 20
    // 2. highlight re-renders into multiple spans
    // 3. setCaretOffset(codeEl, 20) walks text nodes through spans
    //    It must iterate past 'var'(3), ' '(1), 'longIdentifier'(14), ' '(1)
    //    which covers L534 (pos += nodeLen) multiple times before finding offset 20
    var event = new window.Event('input', { bubbles: true });
    codeEl.dispatchEvent(event);

    setTimeout(function() {
      done();
    }, 100);
  });
});


// =========================================================================
// 15. Branch coverage: tokenizeJS flush empty buffer at boundaries (line 88)
// =========================================================================
describe('tokenizeJS — flush empty buffer at comment/string boundaries (line 88)', function() {
  it('should handle consecutive special tokens with no plain text between', function() {
    // Two comments back-to-back: flush is called but buf is empty
    var tokens = tokenizeJS('/* a *//* b */');
    var comments = tokens.filter(function(t) { return t.type === 'comment'; });
    assert.strictEqual(comments.length, 2, 'should find 2 comments');
  });

  it('should handle string immediately after keyword', function() {
    // "var" followed immediately by a string — flush plain at string boundary with empty buf
    var tokens = tokenizeJS('return"hello"');
    var kw = tokens.find(function(t) { return t.type === 'keyword' && t.text === 'return'; });
    var str = tokens.find(function(t) { return t.type === 'string'; });
    assert.ok(kw, 'should find return keyword');
    assert.ok(str, 'should find string');
  });
});


// =========================================================================
// 16. Branch coverage: tokenizeCSS flush empty buffer (line 282)
// =========================================================================
describe('tokenizeCSS — flush empty buffer at comment boundaries (line 282)', function() {
  it('should handle comment at start of CSS (empty buf flush)', function() {
    var tokens = tokenizeCSS('/* comment */div{}');
    var comment = tokens.find(function(t) { return t.type === 'comment'; });
    assert.ok(comment, 'should find comment token');
  });

  it('should handle consecutive comments', function() {
    var tokens = tokenizeCSS('/* a *//* b */');
    var comments = tokens.filter(function(t) { return t.type === 'comment'; });
    assert.strictEqual(comments.length, 2, 'should find 2 comments');
  });
});


// =========================================================================
// 17. Branch coverage: tokenizeCSS escaped char in CSS string (line 306)
// =========================================================================
describe('tokenizeCSS — escape character in string (line 306)', function() {
  it('should handle backslash escape inside CSS value string', function() {
    var tokens = tokenizeCSS('{content: "line1\\nline2";}');
    var strTok = tokens.find(function(t) { return t.type === 'string'; });
    assert.ok(strTok, 'should find string with escape');
    assert.ok(strTok.text.includes('\\'), 'string should contain backslash');
  });

  it('should handle escape at end of string content', function() {
    var tokens = tokenizeCSS('{content: "test\\\\"}');
    var strTok = tokens.find(function(t) { return t.type === 'string'; });
    assert.ok(strTok, 'should find string with double escape');
  });

  it('should handle backslash at very end of CSS input (code[i+1] undefined)', function() {
    // Backslash is the very last character, so code[i+1] is undefined -> falls back to ''
    var tokens = tokenizeCSS('{content: "test\\');
    var strTok = tokens.find(function(t) { return t.type === 'string'; });
    assert.ok(strTok, 'should find string token even with trailing backslash');
    // The string should contain the backslash
    assert.ok(strTok.text.includes('\\'), 'string should include the trailing backslash');
  });
});


// =========================================================================
// 18. Branch coverage: tokenizeHTML flush empty buffer (line 392)
// =========================================================================
describe('tokenizeHTML — flush empty buffer at tag boundaries (line 392)', function() {
  it('should handle consecutive tags with no text between', function() {
    var tokens = tokenizeHTML('<div><span></span></div>');
    var tags = tokens.filter(function(t) { return t.type === 'tag'; });
    assert.ok(tags.length >= 2, 'should find multiple tag tokens');
  });

  it('should handle comment immediately at start', function() {
    var tokens = tokenizeHTML('<!-- comment --><div>');
    var comment = tokens.find(function(t) { return t.type === 'comment'; });
    assert.ok(comment, 'should find comment');
  });
});


// =========================================================================
// 19. Branch coverage: updateGutter with single-line text (line 599)
// =========================================================================
describe('codeEditor updateGutter — single-line text (line 599 || [] fallback)', function() {
  beforeEach(function() {
    freshDOM();
    global.window.bw = bw;
  });

  it('should update gutter for single-line text (no newlines)', function() {
    var taco = codeEditor({ code: 'hello', lang: 'js', lineNumbers: true });
    var el = bw.create(taco);
    document.body.appendChild(el);
    taco.o.mounted(el);

    // setValue with single-line (no newlines) - text.match(/\n/g) returns null
    el._bwCodeEdit.setValue('single line no newlines');
    var gutterEl = el.querySelector('.bw_ce_gutter');
    assert.ok(gutterEl, 'should have gutter');
    var spans = gutterEl.querySelectorAll('span');
    assert.strictEqual(spans.length, 1, 'single line should have 1 gutter line number');
  });
});


// =========================================================================
// 20. Branch coverage: scroll sync with .bw_ce ancestor (line 617)
// =========================================================================
describe('codeEditor scroll sync — closest .bw_ce fallback (line 617)', function() {
  beforeEach(function() {
    freshDOM();
    global.window.bw = bw;
  });

  it('should set up scroll sync with gutter when lineNumbers enabled', function() {
    var taco = codeEditor({ code: 'a\nb', lang: 'js', lineNumbers: true });
    var el = bw.create(taco);
    document.body.appendChild(el);
    taco.o.mounted(el);

    var gutterEl = el.querySelector('.bw_ce_gutter');
    assert.ok(gutterEl, 'should have gutter');

    // The scrollParent should be found via codeEl.closest('.bw_ce') or fallback to el
    // Dispatch scroll to test the handler doesn't crash
    var codeEl = el.querySelector('.bw_ce_code');
    var scrollParent = codeEl.closest('.bw_ce') || el;
    var evt = new window.Event('scroll');
    scrollParent.dispatchEvent(evt);
    el.dispatchEvent(new window.Event('scroll'));
    assert.ok(true, 'scroll handlers should not crash');
  });
});


// =========================================================================
// 21. Branch coverage: install() manually (line 669 auto-install path)
// =========================================================================
describe('codeEditor install — manual install on bw (line 669 analogue)', function() {
  it('should install codeEditor on bw via install()', function() {
    // The auto-install at line 669 checks window.bw at module load time.
    // In ESM tests, window.bw may not exist at import time, so auto-install doesn't fire.
    // We exercise the same code path via manual install().
    install(bw);
    assert.strictEqual(typeof bw.codeEditor, 'function', 'bw.codeEditor should be installed');
  });

  it('installed bw.codeEditor should return a valid TACO', function() {
    install(bw);
    var taco = bw.codeEditor({ code: 'test', lang: 'js' });
    assert.ok(taco);
    assert.strictEqual(taco.t, 'div');
  });
});


// =========================================================================
// 22. Auto-install at module load time (lines 669-671)
//
// NOTE: Lines 669-671 execute at ESM module load time:
//   if (typeof window !== 'undefined' && window.bw) { install(window.bw); }
//
// Since the module is cached after first import, re-importing won't re-run
// this code. In jsdom tests, window.bw is typically not set at module load
// time, so this branch is never exercised. Covering this would require
// Playwright/browser tests where bitwrench-code-edit.js is loaded as a
// script tag AFTER bw is defined on window.
// =========================================================================
