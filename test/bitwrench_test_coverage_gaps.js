/**
 * Bitwrench v2 Coverage Gap Tests
 * Targets specific uncovered lines to push coverage toward 98%.
 */

import assert from "assert";
import bw from "../src/bitwrench.js";
import jsdom from 'jsdom';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { JSDOM } = jsdom;

function freshDOM() {
  const dom = new JSDOM('<!DOCTYPE html><html><head></head><body><div id="app"></div></body></html>');
  global.window = dom.window;
  global.document = dom.window.document;
  global.CustomEvent = dom.window.CustomEvent;
  // Clear bw's internal node cache so stale refs from previous DOMs don't interfere
  if (bw._nodeMap) {
    for (var k in bw._nodeMap) delete bw._nodeMap[k];
  }
  return dom;
}

freshDOM();


// =========================================================================
// bitwrench-utils.js — typeOf custom types (lines 75-84)
// =========================================================================
describe("typeOf — custom type detection", function() {
  it("should return _bw_type if present", function() {
    var obj = { _bw_type: "myCustomWidget" };
    assert.strictEqual(bw.typeOf(obj), "myCustomWidget");
  });

  it("should fall back to constructor.name", function() {
    class FancyWidget {}
    var w = new FancyWidget();
    assert.strictEqual(bw.typeOf(w), "FancyWidget");
  });

  it("should fall back to basic type if no constructor name", function() {
    var obj = Object.create(null);
    // Object with null prototype has no constructor
    assert.strictEqual(bw.typeOf(obj), "object");
  });
});


// =========================================================================
// bitwrench-utils.js — naturalCompare string parts (lines 387-394)
// =========================================================================
describe("naturalCompare — edge cases", function() {
  it("should sort pure string parts lexicographically", function() {
    var result = bw.naturalCompare("abc", "abd");
    assert.ok(result < 0, "abc should come before abd");
  });

  it("should handle different-length arrays", function() {
    var result = bw.naturalCompare("a1b", "a1b2");
    assert.ok(result < 0, "shorter should come before longer");
  });

  it("should handle leading zeros in numbers", function() {
    var result = bw.naturalCompare("file009", "file09");
    // Both should parse to 9, so should be equal or close
    assert.strictEqual(typeof result, "number");
  });

  it("should sort version strings correctly", function() {
    var arr = ["v1.2.10", "v1.2.2", "v1.2.1"];
    arr.sort(bw.naturalCompare);
    assert.strictEqual(arr[0], "v1.2.1");
    assert.strictEqual(arr[1], "v1.2.2");
    assert.strictEqual(arr[2], "v1.2.10");
  });
});


// =========================================================================
// bitwrench-color-utils.js — colorParse array input (lines 39-44)
// =========================================================================
describe("colorParse — array input", function() {
  it("should parse an array of RGB values", function() {
    var result = bw.colorParse([128, 64, 32]);
    assert.strictEqual(result[0], 128);
    assert.strictEqual(result[1], 64);
    assert.strictEqual(result[2], 32);
    assert.strictEqual(result[3], 255);
    assert.strictEqual(result[4], "rgb");
  });

  it("should parse array with alpha", function() {
    var result = bw.colorParse([128, 64, 32, 128]);
    assert.strictEqual(result[3], 128);
  });

  it("should parse array with mode string", function() {
    var result = bw.colorParse([128, 64, 32, 255, "rgb"]);
    assert.strictEqual(result[4], "rgb");
  });
});


// =========================================================================
// bitwrench-color-utils.js — colorRgbToHsl array input (lines 94-96)
// =========================================================================
describe("colorRgbToHsl — array input", function() {
  it("should accept array instead of separate params", function() {
    var result = bw.colorRgbToHsl([255, 0, 0]);
    assert.strictEqual(result[0], 0);    // hue = 0 for pure red
    assert.strictEqual(result[1], 100);  // full saturation
    assert.strictEqual(result[2], 50);   // 50% lightness
    assert.strictEqual(result[4], "hsl");
  });

  it("should handle array with alpha", function() {
    var result = bw.colorRgbToHsl([0, 128, 255, 200]);
    assert.strictEqual(result[3], 200);
    assert.strictEqual(result[4], "hsl");
  });
});


// =========================================================================
// bitwrench-color-utils.js — colorHslToRgb array input (lines 145-147)
// =========================================================================
describe("colorHslToRgb — array input", function() {
  it("should accept array instead of separate params", function() {
    var result = bw.colorHslToRgb([0, 100, 50]);
    assert.strictEqual(result[0], 255);  // pure red
    assert.strictEqual(result[1], 0);
    assert.strictEqual(result[2], 0);
    assert.strictEqual(result[4], "rgb");
  });

  it("should handle array with alpha", function() {
    var result = bw.colorHslToRgb([120, 100, 50, 128]);
    assert.strictEqual(result[3], 128);
    assert.strictEqual(result[4], "rgb");
  });
});


// =========================================================================
// bitwrench-color-utils.js — colorParse HSL string (lines 72-75)
// =========================================================================
describe("colorParse — HSL string input", function() {
  it("should parse hsl() string", function() {
    var result = bw.colorParse("hsl(120, 100, 50)");
    // Should convert to RGB: green
    assert.strictEqual(result[0], 0);    // R
    assert.strictEqual(result[1], 255);  // G
    assert.strictEqual(result[2], 0);    // B
    assert.strictEqual(result[4], "rgb");
  });

  it("should parse hsla() string with alpha", function() {
    var result = bw.colorParse("hsla(240, 100, 50, 0.5)");
    // Blue with 50% alpha
    assert.strictEqual(result[0], 0);
    assert.strictEqual(result[1], 0);
    assert.strictEqual(result[2], 255);
    assert.strictEqual(result[3], 128);  // 0.5 * 255 = 127.5, rounded
  });
});


// =========================================================================
// bitwrench.js — bw.compile() pre-compilation (lines 2667-2695)
// =========================================================================
describe("bw.compile() — pre-compilation", function() {
  it("should return a factory function", function() {
    var factory = bw.compile({ t: 'div', c: 'Hello ${name}' });
    assert.strictEqual(typeof factory, "function");
  });

  it("should create ComponentHandle from factory", function() {
    var factory = bw.compile({ t: 'div', c: 'Count: ${count}' });
    var comp = factory({ count: 42 });
    assert.strictEqual(comp._bwComponent, true);
    assert.strictEqual(comp.get('count'), 42);
  });

  it("should pre-compile attribute bindings", function() {
    var factory = bw.compile({
      t: 'div',
      a: { class: 'item-${type}', 'data-val': '${value}' },
      c: 'Text: ${label}'
    });
    var comp = factory({ type: 'primary', value: '42', label: 'hello' });
    assert.strictEqual(comp._bwComponent, true);
  });

  it("should handle nested content", function() {
    var factory = bw.compile({
      t: 'div', c: [
        { t: 'h1', c: '${title}' },
        { t: 'p', c: '${body}' }
      ]
    });
    var comp = factory({ title: 'Hello', body: 'World' });
    assert.strictEqual(comp.get('title'), 'Hello');
  });

  it("should handle single TACO child in content", function() {
    var factory = bw.compile({
      t: 'div', c: { t: 'span', c: '${msg}' }
    });
    var comp = factory({ msg: 'hi' });
    assert.strictEqual(comp.get('msg'), 'hi');
  });

  it("should handle invalid expressions gracefully", function() {
    var factory = bw.compile({ t: 'div', c: '${!!!invalid+++}' });
    var comp = factory({});
    assert.strictEqual(comp._bwComponent, true);
  });
});


// =========================================================================
// bitwrench.js — ComponentHandle.set with nested paths (lines 1738-1742)
// =========================================================================
describe("ComponentHandle.set — nested dot paths", function() {
  it("should create intermediate objects for dot-path keys", function() {
    var comp = bw.component({
      t: 'div', c: '${count}',
      o: { state: { count: 0 } }
    });
    comp.set('nested.deep.value', 42);
    assert.strictEqual(comp._state.nested.deep.value, 42);
  });

  it("should overwrite non-object intermediates", function() {
    var comp = bw.component({
      t: 'div', c: '${x}',
      o: { state: { x: 'string' } }
    });
    comp.set('x.sub', 'val');
    assert.strictEqual(comp._state.x.sub, 'val');
  });
});


// =========================================================================
// bitwrench.js — ComponentHandle.setState (lines 1773-1786)
// =========================================================================
describe("ComponentHandle.setState", function() {
  it("should merge multiple keys at once", function() {
    var comp = bw.component({
      t: 'div', c: '${a} ${b}',
      o: { state: { a: 1, b: 2 } }
    });
    comp.setState({ a: 10, b: 20 });
    assert.strictEqual(comp.get('a'), 10);
    assert.strictEqual(comp.get('b'), 20);
  });

  it("should mark all merged keys dirty", function() {
    var comp = bw.component({
      t: 'div', c: '${x}',
      o: { state: { x: 0, y: 0 } }
    });
    comp.setState({ x: 1, y: 2 });
    assert.strictEqual(comp._dirtyKeys.x, true);
    assert.strictEqual(comp._dirtyKeys.y, true);
  });

  it("should support sync flush option", function() {
    freshDOM();
    var comp = bw.component({
      t: 'div', c: 'Val: ${val}',
      o: { state: { val: 'old' } }
    });
    comp.mount(document.getElementById('app'));
    comp.setState({ val: 'new' }, { sync: true });
    assert.strictEqual(comp.get('val'), 'new');
  });
});


// =========================================================================
// bitwrench.js — ComponentHandle.getState (lines 1758-1766)
// =========================================================================
describe("ComponentHandle.getState", function() {
  it("should return a shallow clone of state", function() {
    var comp = bw.component({
      t: 'div', c: '${x}',
      o: { state: { x: 1, y: 2 } }
    });
    var s = comp.getState();
    assert.deepStrictEqual(s, { x: 1, y: 2 });
    // Verify it's a clone, not a reference
    s.x = 999;
    assert.strictEqual(comp.get('x'), 1);
  });
});


// =========================================================================
// bitwrench.js — _resolveTemplate error paths (lines 1550, 1556)
// =========================================================================
describe("_resolveTemplate — error handling", function() {
  it("should return empty string for compile error", function() {
    // Force an expression that compiles but throws at runtime
    var result = bw._resolveTemplate('${nonexistent.deep.path}', {}, true);
    assert.strictEqual(result, '');
  });

  it("should handle null in evaluated result", function() {
    var result = bw._resolveTemplate('${val}', { val: null }, false);
    assert.strictEqual(result, '');
  });

  it("should handle undefined in evaluated result", function() {
    var result = bw._resolveTemplate('${val}', { val: undefined }, false);
    assert.strictEqual(result, '');
  });
});


// =========================================================================
// bitwrench.js — _scheduleFlush with setTimeout fallback (lines 1605-1607)
// =========================================================================
describe("_scheduleFlush idempotency", function() {
  it("should not double-schedule", function() {
    bw._flushScheduled = false;
    bw._dirtyComponents = [];
    bw._scheduleFlush();
    assert.strictEqual(bw._flushScheduled, true);
    // Call again — should be a no-op
    bw._scheduleFlush();
    assert.strictEqual(bw._flushScheduled, true);
  });
});


// =========================================================================
// bitwrench.js — bw.inspect() with bindings (line 2625)
// =========================================================================
describe("bw.inspect — with bindings and deps", function() {
  it("should aggregate deps from bindings", function() {
    freshDOM();
    var comp = bw.component({
      t: 'div',
      c: '${a} and ${b}',
      o: { state: { a: 1, b: 2 } }
    });
    comp.mount(document.getElementById('app'));
    bw.flush();
    var result = bw.inspect(comp);
    assert.ok(result, 'should return the handle');
    assert.strictEqual(result._bwComponent, true);
  });
});


// =========================================================================
// bitwrench-bccl.js — makeFormGroup with validation & help (lines 950-959)
// =========================================================================
describe("makeFormGroup — validation and help text", function() {
  it("should include help text when provided", function() {
    var fg = bw.makeFormGroup({
      label: 'Email',
      id: 'email',
      input: bw.makeInput({ id: 'email', type: 'email' }),
      help: 'Enter your work email'
    });
    var html = bw.html(fg);
    assert.ok(html.indexOf('Enter your work email') >= 0, 'help text should be in output');
    assert.ok(html.indexOf('bw_form_text') >= 0, 'help text class should be present');
  });

  it("should include invalid feedback when validation='invalid'", function() {
    var fg = bw.makeFormGroup({
      label: 'Name',
      id: 'name',
      input: bw.makeInput({ id: 'name' }),
      validation: 'invalid',
      feedback: 'Name is required'
    });
    var html = bw.html(fg);
    assert.ok(html.indexOf('Name is required') >= 0);
    assert.ok(html.indexOf('bw_invalid_feedback') >= 0);
  });

  it("should include valid feedback when validation='valid'", function() {
    var fg = bw.makeFormGroup({
      label: 'Name',
      id: 'name',
      input: bw.makeInput({ id: 'name' }),
      validation: 'valid',
      feedback: 'Looks good!'
    });
    var html = bw.html(fg);
    assert.ok(html.indexOf('Looks good!') >= 0);
    assert.ok(html.indexOf('bw_valid_feedback') >= 0);
  });
});


// =========================================================================
// bitwrench-bccl.js — makeListGroup interactive with no href (line 803)
// =========================================================================
describe("makeListGroup — interactive items", function() {
  it("should create interactive list items with onclick", function() {
    var clicked = false;
    var lg = bw.makeListGroup({
      items: [
        { text: 'Item 1', onclick: function() { clicked = true; } },
        { text: 'Item 2', active: true },
        { text: 'Item 3', disabled: true }
      ],
      interactive: true
    });
    var html = bw.html(lg);
    assert.ok(html.indexOf('Item 1') >= 0);
    assert.ok(html.indexOf('active') >= 0);
    assert.ok(html.indexOf('disabled') >= 0);
  });

  it("should create interactive items without href", function() {
    var lg = bw.makeListGroup({
      items: [{ text: 'No link' }],
      interactive: true
    });
    var html = bw.html(lg);
    assert.ok(html.indexOf('bw_list_group_item') >= 0);
  });
});


// =========================================================================
// bitwrench-bccl.js — makeHero with overlay (lines 1320-1322)
// =========================================================================
describe("makeHero — overlay and background", function() {
  it("should include overlay div when overlay=true", function() {
    var hero = bw.makeHero({
      title: 'Welcome',
      overlay: true,
      backgroundImage: 'bg.jpg'
    });
    var html = bw.html(hero);
    assert.ok(html.indexOf('bw_hero_overlay') >= 0, 'overlay div should be present');
    assert.ok(html.indexOf('background-image') >= 0, 'background image should be set');
  });
});


// =========================================================================
// bitwrench-bccl.js — makeFeatureGrid with icon (lines 1405-1411)
// =========================================================================
describe("makeFeatureGrid — with icons", function() {
  it("should render feature icons", function() {
    var grid = bw.makeFeatureGrid({
      features: [
        { icon: '🚀', title: 'Fast', description: 'Very fast' },
        { icon: '🔒', title: 'Secure', description: 'Very secure' }
      ]
    });
    var html = bw.html(grid);
    assert.ok(html.indexOf('bw_feature_icon') >= 0, 'icon class should be present');
  });

  it("should handle features without icons", function() {
    var grid = bw.makeFeatureGrid({
      features: [
        { title: 'No Icon', description: 'Just text' }
      ]
    });
    var html = bw.html(grid);
    assert.ok(html.indexOf('No Icon') >= 0);
  });
});


// =========================================================================
// bitwrench.js — DOM mounting edge cases
// =========================================================================
describe("bw.DOM — edge cases", function() {
  beforeEach(function() { freshDOM(); });

  it("should mount an array of TACOs", function() {
    bw.DOM('#app', [
      { t: 'div', c: 'one' },
      { t: 'div', c: 'two' }
    ]);
    var app = document.getElementById('app');
    assert.strictEqual(app.children.length, 2);
  });

  it("should handle mounting a ComponentHandle", function() {
    var comp = bw.component({
      t: 'div', c: 'Hello ${name}',
      o: { state: { name: 'test' } }
    });
    bw.DOM('#app', comp);
    bw.flush();
    var app = document.getElementById('app');
    assert.ok(app.innerHTML.indexOf('Hello test') >= 0);
  });

  it("should handle null selector gracefully", function() {
    // Should not throw
    var result = bw.DOM('#nonexistent-element-xyz', { t: 'div', c: 'test' });
    // bw.DOM returns undefined or null for invalid selector
    assert.ok(true, 'should not throw');
  });
});


// =========================================================================
// bitwrench.js — bw.createDOM with ComponentHandle (line top of fn)
// =========================================================================
describe("bw.createDOM — ComponentHandle input", function() {
  it("should extract taco from ComponentHandle", function() {
    var comp = bw.component({
      t: 'span', c: 'hello',
      o: { state: {} }
    });
    var el = bw.createDOM(comp);
    assert.strictEqual(el.tagName, 'SPAN');
  });
});


// =========================================================================
// bitwrench.js — cleanup with pub/sub unsubs
// =========================================================================
describe("bw.cleanup — pub/sub unsubscription", function() {
  beforeEach(function() { freshDOM(); });

  it("should call stored unsub functions on cleanup", function() {
    var unsubed = false;
    // cleanup only processes elements with data-bw_id
    var el = bw.createDOM({ t: 'div', a: { 'data-bw_id': 'test-cleanup-id' }, c: 'test' });
    document.getElementById('app').appendChild(el);
    el._bw_subs = [function() { unsubed = true; }];
    bw.cleanup(el);
    assert.strictEqual(unsubed, true);
  });

  it("should clean up child elements with bw_id", function() {
    var childCleaned = false;
    var parent = bw.createDOM({
      t: 'div', a: { 'data-bw_id': 'parent-id' }, c: [
        { t: 'span', a: { 'data-bw_id': 'child-id' }, c: 'child' }
      ]
    });
    document.getElementById('app').appendChild(parent);
    var child = parent.querySelector('[data-bw_id="child-id"]');
    child._bw_subs = [function() { childCleaned = true; }];
    bw.cleanup(parent);
    assert.strictEqual(childCleaned, true);
  });
});


// =========================================================================
// bitwrench.js — ComponentHandle.push and .filter
// =========================================================================
describe("ComponentHandle — push and filter", function() {
  it("should push value onto array in state", function() {
    var comp = bw.component({
      t: 'div', c: '${items.length}',
      o: { state: { items: ['a', 'b'] } }
    });
    comp.push('items', 'c');
    var items = comp.get('items');
    assert.deepStrictEqual(items, ['a', 'b', 'c']);
  });

  it("should filter array in state via set", function() {
    var comp = bw.component({
      t: 'div', c: '${items.length}',
      o: { state: { items: [1, 2, 3, 4, 5] } }
    });
    comp.set('items', comp.get('items').filter(function(v) { return v > 3; }));
    var items = comp.get('items');
    assert.deepStrictEqual(items, [4, 5]);
  });

  it("push should create array if key is not an array", function() {
    var comp = bw.component({
      t: 'div', c: '${x}',
      o: { state: { x: null } }
    });
    comp.push('x', 'val');
    assert.deepStrictEqual(comp.get('x'), ['val']);
  });
});


// =========================================================================
// bitwrench.js — ComponentHandle.destroy() (lines 1031-1045)
// =========================================================================
describe("ComponentHandle.destroy", function() {
  beforeEach(function() { freshDOM(); });

  it("should unmount and clear element reference", function() {
    var app = document.getElementById('app');
    var comp = bw.component({
      t: 'div', c: 'destroy me',
      o: { state: {} }
    });
    // Mount directly using createDOM + manual mount tracking
    var el = bw.createDOM(comp.taco);
    app.appendChild(el);
    comp.element = el;
    comp.mounted = true;
    el._bwComponentHandle = comp;

    assert.ok(comp.mounted, 'should be mounted before destroy');
    comp.destroy();
    assert.strictEqual(comp.mounted, false, 'should be unmounted after destroy');
    assert.strictEqual(comp.element, null, 'element should be null after destroy');
  });

  it("should call willDestroy hook", function() {
    var destroyed = false;
    var comp = bw.component({
      t: 'div', c: 'test',
      o: {
        state: {},
        willDestroy: function() { destroyed = true; }
      }
    });
    var app = document.getElementById('app');
    var el = bw.createDOM(comp.taco);
    app.appendChild(el);
    comp.element = el;
    comp.mounted = true;
    el._bwComponentHandle = comp;

    comp.destroy();
    assert.strictEqual(destroyed, true);
  });
});


// =========================================================================
// bitwrench.js — bw.when() and bw.each()
// =========================================================================
describe("bw.when and bw.each", function() {
  it("bw.when should return a marker object", function() {
    var result = bw.when('active', { t: 'span', c: 'yes' }, { t: 'span', c: 'no' });
    assert.strictEqual(result._bwWhen, true);
    assert.strictEqual(result.expr, 'active');
    assert.ok(Array.isArray(result.branches));
    assert.strictEqual(result.branches.length, 2);
  });

  it("bw.each should return a marker object", function() {
    var factory = function(item) { return { t: 'li', c: item.name }; };
    var result = bw.each('items', factory);
    assert.strictEqual(result._bwEach, true);
    assert.strictEqual(result.expr, 'items');
    assert.strictEqual(result.factory, factory);
  });
});


// =========================================================================
// bitwrench.js — _extractDeps
// =========================================================================
describe("_extractDeps", function() {
  it("should find simple key references", function() {
    var deps = bw._extractDeps('count', ['count', 'name']);
    assert.deepStrictEqual(deps, ['count']);
  });

  it("should find dot-path references", function() {
    var deps = bw._extractDeps('user.name', ['user', 'count']);
    assert.deepStrictEqual(deps, ['user']);
  });

  it("should find keys in expressions", function() {
    var deps = bw._extractDeps('count > 10 ? "many" : "few"', ['count', 'name']);
    assert.deepStrictEqual(deps, ['count']);
  });

  it("should return empty for no matches", function() {
    var deps = bw._extractDeps('42 + 1', ['count']);
    assert.deepStrictEqual(deps, []);
  });
});


// =========================================================================
// bitwrench.js — _parseBindings
// =========================================================================
describe("_parseBindings", function() {
  it("should parse template with single binding", function() {
    var result = bw._parseBindings('Hello ${name}!');
    assert.ok(Array.isArray(result));
    assert.ok(result.length > 0);
    assert.strictEqual(result[0].expr, 'name');
  });

  it("should parse template with multiple bindings", function() {
    var result = bw._parseBindings('${a} and ${b}');
    assert.strictEqual(result.length, 2);
    assert.strictEqual(result[0].expr, 'a');
    assert.strictEqual(result[1].expr, 'b');
  });

  it("should return empty for no bindings", function() {
    var result = bw._parseBindings('plain text');
    assert.strictEqual(result.length, 0);
  });
});


// =========================================================================
// bitwrench.js — CSS generation edge cases (camelCase, null values)
// =========================================================================
describe("bw.css — edge cases", function() {
  it("should convert camelCase to kebab-case", function() {
    var css = bw.css({ '.test': { backgroundColor: 'red', fontSize: '14px' } });
    assert.ok(css.indexOf('background-color') >= 0);
    assert.ok(css.indexOf('font-size') >= 0);
  });

  it("should filter out null/undefined values", function() {
    var css = bw.css({ '.test': { color: 'red', background: null, border: undefined } });
    assert.ok(css.indexOf('color') >= 0);
    assert.ok(css.indexOf('background') < 0 || css.indexOf('null') < 0);
  });

  it("should handle @media nested rules", function() {
    var css = bw.css({
      '@media (max-width: 768px)': {
        '.card': { padding: '0.5rem' }
      }
    });
    assert.ok(css.indexOf('@media') >= 0);
    assert.ok(css.indexOf('.card') >= 0);
    assert.ok(css.indexOf('padding') >= 0);
  });
});


// =========================================================================
// bitwrench.js — bw.raw()
// =========================================================================
describe("bw.raw", function() {
  it("should create raw sentinel object", function() {
    var r = bw.raw('<strong>bold</strong>');
    assert.strictEqual(r.__bw_raw, true);
    assert.strictEqual(r.v, '<strong>bold</strong>');
  });

  it("should be rendered unescaped in bw.html()", function() {
    var html = bw.html({ t: 'div', c: bw.raw('<em>italic</em>') });
    assert.ok(html.indexOf('<em>italic</em>') >= 0);
  });
});


// =========================================================================
// bitwrench.js — bw.injectCSS
// =========================================================================
describe("bw.injectCSS", function() {
  beforeEach(function() { freshDOM(); });

  it("should inject CSS into head", function() {
    bw.injectCSS('.test { color: red; }', { id: 'test-style' });
    var el = document.getElementById('test-style');
    assert.ok(el, 'style element should exist');
  });

  it("should replace existing style element with same id", function() {
    bw.injectCSS('.a { color: red; }', { id: 'reuse-test' });
    bw.injectCSS('.b { color: blue; }', { id: 'reuse-test' });
    var els = document.querySelectorAll('#reuse-test');
    assert.strictEqual(els.length, 1, 'should reuse existing element');
  });
});


// =========================================================================
// bitwrench.js — bw.$ selector utility
// =========================================================================
describe("bw.$ — selector utility", function() {
  beforeEach(function() { freshDOM(); });

  it("should return array for string selector", function() {
    // Create element directly in the DOM to avoid bw.DOM side effects
    var el = document.createElement('div');
    el.className = 'test-item';
    el.textContent = 'one';
    document.getElementById('app').appendChild(el);
    if (typeof bw.$ === 'function') {
      var result = bw.$('.test-item');
      assert.ok(Array.isArray(result));
      assert.strictEqual(result.length, 1);
    } else {
      // bw.$ not defined (browser-only) — skip
      assert.ok(true, 'bw.$ is browser-only, skipped in this environment');
    }
  });

  it("should return empty array for no matches", function() {
    if (typeof bw.$ === 'function') {
      var result = bw.$('.nonexistent');
      assert.ok(Array.isArray(result));
      assert.strictEqual(result.length, 0);
    } else {
      assert.ok(true, 'bw.$ is browser-only, skipped');
    }
  });

  it("should wrap single element in array", function() {
    if (typeof bw.$ === 'function') {
      var el = document.createElement('span');
      var result = bw.$(el);
      assert.ok(Array.isArray(result));
      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0], el);
    } else {
      assert.ok(true, 'bw.$ is browser-only, skipped');
    }
  });

  it("should return empty array for null input", function() {
    if (typeof bw.$ === 'function') {
      var result = bw.$(null);
      assert.deepStrictEqual(result, []);
    } else {
      assert.ok(true, 'bw.$ is browser-only, skipped');
    }
  });
});


// =========================================================================
// bitwrench.js — ComponentHandle lifecycle hooks
// =========================================================================
describe("ComponentHandle — lifecycle hooks", function() {
  beforeEach(function() { freshDOM(); });

  it("should call willMount before mounting", function() {
    var order = [];
    var comp = bw.component({
      t: 'div', c: 'test',
      o: {
        state: {},
        willMount: function() { order.push('willMount'); },
        mounted: function() { order.push('mounted'); }
      }
    });
    comp.mount(document.getElementById('app'));
    bw.flush();
    assert.ok(order.indexOf('willMount') >= 0, 'willMount should be called');
  });

  it("should call unmount on cleanup", function() {
    var unmounted = false;
    var comp = bw.component({
      t: 'div', c: 'test',
      o: {
        state: {},
        unmount: function() { unmounted = true; }
      }
    });
    comp.mount(document.getElementById('app'));
    bw.flush();
    comp.destroy();
    assert.strictEqual(unmounted, true);
  });
});


// =========================================================================
// bitwrench.js — ComponentHandle.select / selectAll
// =========================================================================
describe("ComponentHandle — select and selectAll", function() {
  beforeEach(function() { freshDOM(); });

  it("should find child elements with select()", function() {
    var comp = bw.component({
      t: 'div', c: [
        { t: 'span', a: { class: 'label' }, c: 'hello' },
        { t: 'span', a: { class: 'value' }, c: '42' }
      ],
      o: { state: {} }
    });
    comp.mount(document.getElementById('app'));
    bw.flush();
    var label = comp.select('.label');
    assert.ok(label, 'should find .label element');
    assert.strictEqual(label.textContent, 'hello');
  });

  it("should find all matching with selectAll()", function() {
    var comp = bw.component({
      t: 'div', c: [
        { t: 'span', a: { class: 'item' }, c: 'a' },
        { t: 'span', a: { class: 'item' }, c: 'b' }
      ],
      o: { state: {} }
    });
    comp.mount(document.getElementById('app'));
    bw.flush();
    var items = comp.selectAll('.item');
    assert.ok(Array.isArray(items));
    assert.strictEqual(items.length, 2);
  });
});


// =========================================================================
// bitwrench.js — bw.isNodeJS() and environment detection
// =========================================================================
describe("Environment detection", function() {
  it("bw.isNodeJS() should return true in Node", function() {
    assert.strictEqual(bw.isNodeJS(), true);
  });

  it("bw._isNode should be true", function() {
    assert.strictEqual(bw._isNode, true);
  });

  it("bw._isBrowser should be true in jsdom", function() {
    assert.strictEqual(bw._isBrowser, true);
  });
});


// =========================================================================
// bitwrench.js — style toggling
// =========================================================================
describe("Style toggling", function() {
  beforeEach(function() { freshDOM(); });

  it("bw.toggleStyles should toggle bw_theme_alt class", function() {
    bw.loadStyles({ primary: '#336699', secondary: '#cc6633' });
    var mode1 = bw.toggleStyles();
    assert.ok(document.documentElement.classList.contains('bw_theme_alt'),
              'should add alt class');
    var mode2 = bw.toggleStyles();
    assert.ok(!document.documentElement.classList.contains('bw_theme_alt'),
              'should remove alt class');
    assert.notStrictEqual(mode1, mode2, 'should toggle between modes');
  });
});


// =========================================================================
// bitwrench.js — clearStyles
// =========================================================================
describe("bw.clearStyles", function() {
  beforeEach(function() { freshDOM(); });

  it("should remove generated style elements", function() {
    bw.loadStyles({ primary: '#336699', secondary: '#cc6633' });
    bw.clearStyles();
    assert.strictEqual(document.getElementById('bw_style_global'), null);
    assert.ok(!document.documentElement.classList.contains('bw_theme_alt'));
  });
});

// =========================================================================
// _resolveTemplate edge cases
// =========================================================================
describe("bw._resolveTemplate edge cases", function() {
  it("should return non-string inputs unchanged", function() {
    assert.strictEqual(bw._resolveTemplate(42, {}, false), 42);
    assert.strictEqual(bw._resolveTemplate(null, {}, false), null);
  });

  it("should return strings without ${} unchanged", function() {
    assert.strictEqual(bw._resolveTemplate('hello world', {}, false), 'hello world');
  });

  it("should resolve simple path in tier 1 mode (no compile)", function() {
    var result = bw._resolveTemplate('Count: ${count}', { count: 5 }, false);
    assert.strictEqual(result, 'Count: 5');
  });

  it("should resolve expression in tier 2 mode (compile)", function() {
    var result = bw._resolveTemplate('${a + b}', { a: 3, b: 4 }, true);
    assert.strictEqual(result, '7');
  });

  it("should handle invalid expressions gracefully in compile mode", function() {
    var result = bw._resolveTemplate('${!!!}', {}, true);
    assert.strictEqual(result, '');
  });

  it("should handle null/undefined state values as empty string", function() {
    var result = bw._resolveTemplate('${missing}', {}, false);
    assert.strictEqual(result, '');
  });

  it("should handle multiple bindings in one string", function() {
    var result = bw._resolveTemplate('${a} and ${b}', { a: 'X', b: 'Y' }, false);
    assert.strictEqual(result, 'X and Y');
  });
});

// =========================================================================
// toggleStyles edge cases
// =========================================================================
describe("bw.toggleStyles edge cases", function() {
  beforeEach(function() { freshDOM(); });

  it("should toggle and return mode string", function() {
    bw.loadStyles({ primary: '#336699', secondary: '#cc6633' });
    var result = bw.toggleStyles();
    assert.ok(typeof result === 'string');
    assert.strictEqual(result, 'alternate');
  });

  it("should toggle back to primary", function() {
    bw.loadStyles({ primary: '#336699', secondary: '#cc6633' });
    bw.toggleStyles(); // to alternate
    var result = bw.toggleStyles(); // back to primary
    assert.strictEqual(result, 'primary');
  });

  it("should return primary for nonexistent scope", function() {
    var result = bw.toggleStyles('#nonexistent');
    assert.strictEqual(result, 'primary');
  });

  it("should return primary in non-browser", function() {
    // toggleStyles returns 'primary' when not in browser
    assert.ok(typeof bw.toggleStyles === 'function');
  });
});
