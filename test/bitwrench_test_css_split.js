/**
 * The CSS split (2.1.14, dev/bw-css-split-plan.md): widget rules live in
 * src/bitwrench-bccl-styles.js and ship with the BCCL factories. Core
 * (bitwrench-styles.js) keeps the reset, typography, role colours, utilities,
 * grid, tables and bar chart. The lean build has neither factories nor widget
 * CSS; loading BCCL after lean installs both through bw._installStyleSheet.
 *
 * These tests drive the sheet list directly, so they prove the lean path from
 * the full source: with no sheet installed, bw.loadStyles() must emit no widget
 * rule; with the sheet installed, every widget rule, once.
 */
import assert from "assert";
import bw from "../src/bitwrench.js";
import { bcclStyles } from "../src/bitwrench-bccl.js";
import { bcclStructural, bcclThemed } from "../src/bitwrench-bccl-styles.js";
import { registerBCCL } from "../src/bitwrench-bccl-entry.js";
import { getStructuralStyles, generateThemedCSS, resolveLayout, defaultStyles } from "../src/bitwrench-styles.js";
import jsdom from 'jsdom';
const { JSDOM } = jsdom;

var WIDGET = ['.bw_bccl_btn', '.bw_bccl_card', '.bw_bccl_modal', '.bw_bccl_alert', '.bw_bccl_tooltip', '.bw_bccl_navbar'];
var CORE = ['.bw_bccl_table', '.bw_bccl_container', '.bw_col_6', '.bw_primary', '.bw_text_muted', '.bw_d_flex', 'body'];

function freshPage() {
  var dom = new JSDOM('<!DOCTYPE html><html><head></head><body><div id="app"></div></body></html>', { url: 'http://localhost/' });
  global.window = dom.window;
  global.document = dom.window.document;
  bw.clearStyles && bw.clearStyles();
  return dom;
}
function withSheets(list, fn) {
  var saved = bw._bw_style_sheets.slice();
  bw._bw_style_sheets.length = 0;
  list.forEach(function(s) { bw._bw_style_sheets.push(s); });
  try { return fn(); } finally {
    bw._bw_style_sheets.length = 0;
    saved.forEach(function(s) { bw._bw_style_sheets.push(s); });
  }
}
function count(hay, needle) { return hay.split(needle).length - 1; }

describe('CSS split: the widget sheet ships with the factories', function() {

  it('the full build installs the BCCL sheet at load, once', function() {
    assert.strictEqual(bw._bw_style_sheets.length, 1);
    assert.strictEqual(bw._bw_style_sheets[0], bcclStyles);
    assert.strictEqual(typeof bcclStyles.structural, 'function');
    assert.strictEqual(typeof bcclStyles.themed, 'function');
  });

  // A rule object's keys, split on commas: ".bw_bccl_btn" as a selector of its
  // own, not as the tail of the pager's ".bw_bccl_table_pagination .bw_bccl_btn".
  function selectors(rules) {
    var out = {};
    Object.keys(rules).forEach(function(k) {
      if (k.charAt(0) === '@') { Object.keys(rules[k]).forEach(function(inner) { inner.split(',').forEach(function(s) { out[s.trim()] = true; }); }); }
      k.split(',').forEach(function(s) { out[s.trim()] = true; });
    });
    return out;
  }

  it('core alone (the lean path) emits no widget rule and every core rule', function() {
    withSheets([], function() {
      var styles = bw.makeStyles({ primary: '#336699', secondary: '#cc6633' });
      var sels = Object.assign(selectors(getStructuralStyles(bw._bw_style_sheets)), selectors(styles.rules), selectors(styles.alternateRules));
      WIDGET.forEach(function(sel) { assert.ok(!sels[sel], sel + ' leaked into the core sheet'); });
      CORE.forEach(function(sel) { assert.ok(sels[sel], sel + ' missing from the core sheet'); });
    });
  });

  it('with the sheet installed, every widget rule is present, in the primary and the alternate palette', function() {
    var styles = bw.makeStyles({ primary: '#336699', secondary: '#cc6633' });
    WIDGET.forEach(function(sel) {
      assert.ok(bw.css(getStructuralStyles(bw._bw_style_sheets)).includes(sel), sel + ' structural missing');
    });
    // Themed widget rules in both palettes: the alternate is what paints a
    // button under .bw_theme_alt; missing it means dark mode drops widget colours.
    assert.ok(styles.css.includes('.bw_bccl_btn_outline.bw_primary'), 'primary palette lacks outline button');
    assert.ok(styles.alternateCss.includes('.bw_bccl_btn_outline.bw_primary'), 'alternate palette lacks outline button');
    assert.ok(styles.alternateCss.includes('.bw_bccl_card'), 'alternate palette lacks card rules');
  });

  it('installing the sheet twice does not print a widget rule twice', function() {
    assert.strictEqual(bw._installStyleSheet(bcclStyles), false, 'second install must be a no-op');
    assert.strictEqual(bw._bw_style_sheets.length, 1);
    var css = bw.makeStyles({ primary: '#336699' }).css;
    assert.strictEqual(count(css, '.bw_bccl_btn_outline.bw_primary:hover {'), 1);
    assert.strictEqual(bw._installStyleSheet(null), false, 'null is ignored');
  });

  it('registerBCCL installs the sheet on a lean instance (lean script, then BCCL script, then loadStyles)', function() {
    withSheets([], function() {
      var before = bw.makeStyles({ primary: '#336699' }).css;
      assert.ok(!before.includes('.bw_bccl_btn_outline'), 'lean path should start without widget rules');
      registerBCCL(bw);
      assert.strictEqual(bw._bw_style_sheets.length, 1, 'registerBCCL installs the sheet');
      var after = bw.makeStyles({ primary: '#336699' }).css;
      assert.ok(after.includes('.bw_bccl_btn_outline.bw_primary'), 'widget rules present after registerBCCL');
      registerBCCL(bw);
      assert.strictEqual(bw._bw_style_sheets.length, 1, 'a second registerBCCL does not duplicate');
      // makeTooltip arrives with its CSS (#108): the factory and the rule together
      assert.strictEqual(typeof bw.makeTooltip, 'function');
      assert.ok(after.includes('.bw_bccl_tooltip'), 'tooltip rule present');
    });
  });

  it('bw.loadStyles() on a page emits structural + themed with the widget sheet merged', function() {
    freshPage();
    bw.loadStyles({ primary: '#336699', secondary: '#cc6633' });
    var structural = document.getElementById('bw_style_structural').textContent;
    var themed = document.getElementById('bw_style_global').textContent;
    assert.ok(structural.includes('.bw_bccl_modal_dialog'), 'structural widget rule injected');
    assert.ok(structural.includes('.bw_col_6'), 'core grid still injected');
    assert.ok(themed.includes('.bw_bccl_btn_outline.bw_primary'), 'themed widget rule injected');
    // The order of the one file through 2.1.13 is kept: utilities after widgets,
    // so a utility class still beats a widget default at equal specificity.
    assert.ok(structural.indexOf('.bw_bccl_modal_dialog') < structural.indexOf('.bw_d_flex'), 'utilities come after widget structure');
    // and role classes after widget themed rules
    assert.ok(themed.indexOf('.bw_bccl_card {') < themed.lastIndexOf('.bw_primary {'), 'role classes come after widget themed rules');
  });

  it('the small-screen media block merges: grid lines from core, widget lines from the sheet, one block', function() {
    var rules = getStructuralStyles(bw._bw_style_sheets);
    var block = rules['@media (max-width: 575px)'];
    assert.ok(block, 'media block present');
    assert.ok(block['.bw_bccl_container'], 'core grid line kept');
    assert.ok(block['.bw_bccl_modal_dialog'], 'widget line merged in');
    var core = getStructuralStyles([])['@media (max-width: 575px)'];
    assert.ok(core['.bw_bccl_container'] && !core['.bw_bccl_modal_dialog'], 'core block has no widget line');
  });

  it('the widget sheet has no import and the core keeps what the plan says it keeps', function() {
    var cats = Object.keys(bcclStructural());
    ['buttons', 'cards', 'forms', 'modal', 'toast', 'tooltip', 'chipInput', 'responsive'].forEach(function(c) {
      assert.ok(cats.indexOf(c) !== -1, 'widget sheet lacks ' + c);
    });
    ['tables', 'barChart', 'grid', 'stacks', 'offsets', 'base', 'typography'].forEach(function(c) {
      assert.ok(cats.indexOf(c) === -1, c + ' belongs to core, not the widget sheet');
      assert.ok(c in defaultStyles || c === 'base', c + ' missing from core');
    });
    var palette = bw.derivePalette(bw.DEFAULT_PALETTE_CONFIG);
    var themed = bcclThemed('', palette, resolveLayout({}), { sx: function(s, sel) { return sel; }, tr: function() { return ''; }, fr: function() { return ''; }, sf: function() { return '#fff'; } });
    assert.ok(themed['.bw_bccl_alert.bw_primary'], 'widget role override lives in the sheet');
    var core = generateThemedCSS('', palette, resolveLayout({}));
    assert.ok(!core['.bw_bccl_alert.bw_primary'], 'widget role override left core');
    assert.ok(core['.bw_primary'] && core['.bw_text_muted'], 'role classes stay in core');
  });

  it('the four core factories emit only classes the core sheet styles (lean renders them fully)', function() {
    freshPage();
    var data = [{ name: 'A', age: 1 }, { name: 'B', age: 2 }];
    var tacos = [
      bw.makeTable({ data: data, sortable: true, pageSize: 1 }),
      bw.makeTableFromArray({ data: [['a', 'b'], [1, 2]] }),
      bw.makeDataTable({ data: data, pageSize: 1 }),
      bw.makeBarChart({ data: [{ label: 'x', value: 3 }] })
    ];
    var html = tacos.map(function(t) { return bw.html(t); }).join('');
    var emitted = {};
    (html.match(/class="([^"]+)"/g) || []).forEach(function(m) {
      m.slice(7, -1).split(/\s+/).forEach(function(c) { if (/^bw_/.test(c)) emitted[c] = true; });
    });
    var core = withSheets([], function() {
      return bw.css(getStructuralStyles([])) + bw.makeStyles({ primary: '#336699' }).css;
    });
    // Identity markers and hook-only wrappers carry no rule by design.
    var MARKER = /^bw_(uuid_|lc$|is_component|bccl_table_paginated$|bccl_table_pagination$|bccl_dataTable$|bccl_table_sm$)/;
    var missing = Object.keys(emitted).filter(function(c) { return !MARKER.test(c) && !core.includes('.' + c); });
    assert.deepStrictEqual(missing, [], 'core factory classes without a core rule (lean would render them unstyled)');
    // and the pager look matches the widget sheet's small button
    assert.ok(core.includes('.bw_bccl_table_pagination .bw_bccl_btn'), 'pager carries its own button rule');
  });
});
