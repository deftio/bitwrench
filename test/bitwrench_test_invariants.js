/**
 * Invariant tests: properties that must hold across whole families of input,
 * not single examples. Each suite here exists because a user found a bug the
 * example-based tests could not see.
 *
 *  1. Parity -- bw.create() and bw.html() build the same tree (#105: nested
 *     arrays rendered in one and printed "[object Object]" in the other).
 *  2. Class contract -- every bw_* class a component emits has a CSS rule
 *     (#101 navbar, #104 gutters, container-fluid, bw_col_md_2.4, mb-3).
 *  3. Table model -- after any sequence of handle calls, the body, header and
 *     click reports match a from-scratch recomputation (review 2026-09-22,
 *     A1-A4: glyph, page slice, re-sort, stale row handlers).
 */

import assert from "assert";
import bw from "../src/bitwrench.js";
import { getStructuralStyles } from "../src/bitwrench-styles.js";
import jsdom from 'jsdom';
const { JSDOM } = jsdom;

function freshDOM() {
  const dom = new JSDOM('<!DOCTYPE html><html><head></head><body><div id="app"></div></body></html>');
  global.window = dom.window;
  global.document = dom.window.document;
  global.CustomEvent = dom.window.CustomEvent;
  global.requestAnimationFrame = function(fn) { fn(); };
  return dom;
}

// Props rich enough that every factory renders its sub-parts. Factories ignore
// keys they don't read.
var SAMPLE = {
  title: 'T', subtitle: 'S', text: 'X', label: 'L', content: 'C', description: 'D',
  footer: 'F', header: 'H', brand: 'B', value: 'v', placeholder: 'p', icon: '*',
  items: [{ text: 'a', title: 'a', content: 'c', label: 'l', href: '#', value: 'v', active: true }, { text: 'b', title: 'b', content: 'd', href: '#', value: 'w' }],
  tabs: [{ label: 'a', content: 'b' }, { label: 'c', content: 'd' }],
  options: [{ value: 'a', text: 'A' }, { value: 'b', label: 'B' }],
  data: [{ n: 'x', v: 0 }, { n: 'y', v: 2 }],
  columns: [{ key: 'n', label: 'N' }, { key: 'v', label: 'V' }],
  features: [{ icon: '*', title: 'a', description: 'd' }],
  steps: [{ title: 'a', description: 'd' }, { title: 'b' }],
  events: [{ title: 'a', date: 'd', content: 'c' }],
  slides: [{ content: 'x' }], children: ['x', { t: 'b', c: 'y' }],
  actions: [{ t: 'button', c: 'go' }], chips: ['a', 'b'],
  variant: 'primary', dismissible: true, checked: true
};

// Documented size values per factory (JSDoc). Sizes outside these are caller
// errors, not stylesheet gaps.
var SIZES = {
  makeButton: ['sm', 'lg'], makeButtonGroup: ['sm', 'lg'], makePagination: ['sm', 'lg'],
  makeBadge: ['sm', 'lg'], makeSpinner: ['sm', 'md', 'lg'], makeAvatar: ['sm', 'md', 'lg', 'xl'],
  makeModal: ['sm', 'lg', 'xl']
};

function allFactories() {
  return Object.keys(bw).filter(function(k) {
    return /^make[A-Z]/.test(k) && k !== 'makeStyles' && typeof bw[k] === 'function';
  }).sort();
}

// SAMPLE.columns is makeTable's column list; makeFeatureGrid reads columns as a count.
function propsFor(name) {
  return name === 'makeFeatureGrid' ? Object.assign({}, SAMPLE, { columns: 3 }) : SAMPLE;
}

function build(name, extra) {
  try { return bw[name](Object.assign({}, propsFor(name), extra)); } catch (e) { return bw[name](extra || {}); }
}

// Canonical form of a DOM subtree: what a user can observe, minus generated ids
// and handler registration (bw.html serialises handlers, bw.create binds them).
function canon(node) {
  if (node.nodeType === 3) return node.textContent;
  if (node.nodeType !== 1) return '';
  var attrs = [];
  for (var i = 0; i < node.attributes.length; i++) {
    var a = node.attributes[i];
    if (/^on/.test(a.name) || a.name === 'style' || a.name === 'value') continue;
    var v = a.value;
    if (a.name === 'class') v = v.split(/\s+/).filter(function(c) { return c && c.indexOf('bw_uuid_') !== 0; }).sort().join(' ');
    attrs.push(a.name + '=' + v);
  }
  if (node.style && node.style.cssText) attrs.push('style=' + node.style.cssText);
  if ('value' in node && /^(INPUT|TEXTAREA|SELECT|OPTION)$/i.test(node.tagName) && node.value) attrs.push('value=' + node.value);
  attrs.sort();
  var kids = [], text = '';
  for (var c = node.firstChild; c; c = c.nextSibling) {
    if (c.nodeType === 3) { text += c.textContent; continue; }
    if (text) { kids.push(text); text = ''; }
    kids.push(canon(c));
  }
  if (text) kids.push(text);
  return '<' + node.tagName.toLowerCase() + ' ' + attrs.join(' ') + '>' + kids.join('') + '</>';
}

function parity(taco) {
  var created = bw.create(taco);
  var tpl = document.createElement('template');
  tpl.innerHTML = bw.html(taco);
  var parsed = tpl.content.firstElementChild || tpl.content.firstChild;
  return { dom: canon(created), html: canon(parsed) };
}

// =========================================================================
// 1. create / html parity
// =========================================================================

describe('Invariant: bw.create() and bw.html() build the same tree', function() {
  beforeEach(function() { freshDOM(); });

  var CORPUS = {
    'text and numbers':      { t: 'p', c: ['a', 0, ' ', 1.5, false === false ? 'b' : ''] },
    'nested arrays':         { t: 'div', c: [['a ', { t: 'b', c: 'x' }], [[' c']], []] },
    'null children':         { t: 'ul', c: [null, { t: 'li', c: 'a' }, undefined] },
    'raw html':              { t: 'div', c: ['x', bw.raw('<i>r</i>'), [bw.raw('<u>s</u>')]] },
    'escaping':              { t: 'p', a: { title: 'a "q" <b>' }, c: '<script>&amp;' },
    'boolean attributes':    { t: 'input', a: { type: 'checkbox', disabled: true, checked: false, required: true } },
    'input value':           { t: 'input', a: { type: 'text', value: 'hello' } },
    'class array':           { t: 'div', a: { class: ['a', null, 'b'] } },
    'style object':          { t: 'div', a: { style: { color: 'red', marginTop: '4px' } } },
    'svg':                   { t: 'svg', a: { viewBox: '0 0 10 10', width: 20 }, c: [
                               { t: 'rect', a: { x: 1, width: 5, height: 5, 'stroke-width': 2, class: 'k' } },
                               { t: 'text', a: { x: 1, 'text-anchor': 'start' }, c: 'hi' }] },
    'svg foreignObject':     { t: 'svg', c: { t: 'foreignObject', c: { t: 'span', c: 'html' } } },
    'handlers ignored':      { t: 'button', a: { onclick: function() {} }, c: 'go' },
    'bw.h output':           bw.h('section', { id: 's' }, [bw.h('h2', null, 'T'), [bw.h('p', null, 'x')]])
  };

  Object.keys(CORPUS).forEach(function(name) {
    it(name, function() {
      var r = parity(CORPUS[name]);
      assert.strictEqual(r.dom, r.html);
    });
  });

  it('every make*() factory', function() {
    var diffs = [];
    allFactories().forEach(function(name) {
      var r = parity(build(name));
      if (r.dom !== r.html) diffs.push(name + '\n  create: ' + r.dom.slice(0, 300) + '\n  html:   ' + r.html.slice(0, 300));
    });
    assert.deepStrictEqual(diffs, []);
  });
});

// =========================================================================
// 2. Every emitted bw_* class has a rule
// =========================================================================

describe('Invariant: every bw_* class a component emits has a CSS rule', function() {
  // Identity markers: classes that tag an element for lookup, not styling.
  // Adding one here is a decision -- a styling class must never land here.
  var MARKERS = /^bw_(uuid_|lc$|is_component|act_)/;
  var TYPE_MARKERS = [
    'bw_bccl_avatar', 'bw_bccl_chipInput', 'bw_bccl_codeDemo', 'bw_bccl_col', 'bw_bccl_cta',
    'bw_bccl_dataTable', 'bw_bccl_featureGrid', 'bw_bccl_fileUpload', 'bw_bccl_form',
    'bw_bccl_listGroup', 'bw_bccl_mediaObject', 'bw_bccl_nav', 'bw_bccl_popover', 'bw_bccl_range',
    'bw_bccl_row', 'bw_bccl_searchInput', 'bw_bccl_section', 'bw_bccl_skeleton', 'bw_bccl_spinner',
    'bw_bccl_stack', 'bw_bccl_statCard', 'bw_bccl_stepper', 'bw_bccl_tabs'
  ];
  // State hooks: emitted so app CSS and queries can target the state, styled
  // by default through their absence (a pending step looks like a plain step).
  TYPE_MARKERS.push('bw_step_pending');

  var css = bw.css(getStructuralStyles()) + bw.css(bw.makeStyles({ primary: '#336699', secondary: '#cc6633' }).rules);
  var defined = {};
  (css.match(/\.bw_[A-Za-z0-9_]+/g) || []).forEach(function(s) { defined[s.slice(1)] = true; });

  function emitted(taco, out) {
    var html = bw.html(taco);
    (html.match(/class="([^"]*)"/g) || []).forEach(function(m) {
      m.slice(7, -1).split(/\s+/).forEach(function(c) { if (/^bw_/.test(c)) out[c] = true; });
    });
    return out;
  }

  it('holds for every factory, with sample props and common variants', function() {
    var missing = {};
    allFactories().forEach(function(name) {
      var seen = {};
      emitted(build(name), seen);
      ['secondary', 'danger'].concat(name === 'makeButton' ? ['outline_primary'] : []).forEach(function(v) {
        emitted(build(name, { variant: v }), seen);
      });
      (SIZES[name] || []).forEach(function(sz) {
        emitted(build(name, { size: sz }), seen);
      });
      Object.keys(seen).forEach(function(c) {
        if (!defined[c] && !MARKERS.test(c) && TYPE_MARKERS.indexOf(c) < 0) (missing[c] = missing[c] || []).push(name);
      });
    });
    assert.deepStrictEqual(missing, {}, 'classes with no rule: ' + JSON.stringify(missing));
  });

  it('holds for makeCol / makeFeatureGrid spans at every size', function() {
    var bad = [];
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].forEach(function(n) {
      var seen = {};
      emitted(bw.makeFeatureGrid({ features: [{ title: 'a' }], columns: n }), seen);
      emitted(bw.makeCol({ size: { xs: n || 12, sm: n || 1, md: n || 1, lg: n || 1, xl: n || 1 } }), seen);
      Object.keys(seen).forEach(function(c) { if (/_col/.test(c) && !defined[c] && TYPE_MARKERS.indexOf(c) < 0 && n <= 12) bad.push(n + ':' + c); });
    });
    assert.deepStrictEqual(bad, []);
  });
});

// =========================================================================
// 3. Table model: handles agree with a from-scratch recomputation
// =========================================================================

describe('Invariant: makeTable handles agree with a recomputed view', function() {
  beforeEach(function() { freshDOM(); });

  // Deterministic PRNG so failures reproduce.
  function rng(seed) { return function() { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; }; }

  function expectedView(data, col, dir, pageSize, page) {
    var rows = data.slice();
    if (col) {
      rows.sort(function(a, b) {
        var x = a[col], y = b[col];
        if (typeof x === 'number' && typeof y === 'number') return dir === 'asc' ? x - y : y - x;
        x = x == null ? '' : String(x).toLowerCase(); y = y == null ? '' : String(y).toLowerCase();
        return dir === 'asc' ? x.localeCompare(y) : y.localeCompare(x);
      });
    }
    if (!pageSize) return { rows: rows, offset: 0 };
    var pages = Math.max(1, Math.ceil(rows.length / pageSize));
    var off = (Math.max(1, Math.min(page, pages)) - 1) * pageSize;
    return { rows: rows.slice(off, off + pageSize), offset: off };
  }

  function randomData(r) {
    var n = Math.floor(r() * 7);
    var out = [];
    for (var i = 0; i < n; i++) out.push({ id: i + '_' + Math.floor(r() * 1000), n: ['b', 'a', 'c', 'A'][Math.floor(r() * 4)], v: Math.floor(r() * 5) });
    return out;
  }

  [1, 2, 3, 4, 5, 6, 7, 8].forEach(function(seed) {
    it('random handle sequence, seed ' + seed, function() {
      var r = rng(seed);
      var pageSize = seed % 2 ? 2 : undefined;
      var page = pageSize ? 1 + Math.floor(r() * 3) : 1;
      var clicks = [];
      var data = randomData(r);
      var col = r() < 0.5 ? 'n' : null, dir = 'asc';
      var root = bw.mount('#app', bw.makeTable({
        data: data, rowKey: seed % 3 ? 'id' : undefined, pageSize: pageSize, currentPage: page,
        sortColumn: col, sortDirection: dir,
        columns: [{ key: 'id', label: 'Id' }, { key: 'n', label: 'N' }, { key: 'v', label: 'V' }],
        onRowClick: function(row, idx) { clicks.push([row, idx]); }
      }));
      var table = root.tagName === 'TABLE' ? root : root.querySelector('table');

      for (var step = 0; step < 12; step++) {
        var op = r();
        if (op < 0.4) {
          var c = ['n', 'v', 'id'][Math.floor(r() * 3)];
          if (r() < 0.5) { dir = col === c && dir === 'asc' ? 'desc' : 'asc'; col = c; table.bw.sort(c); }
          else { dir = r() < 0.5 ? 'asc' : 'desc'; col = c; table.bw.sort(c, dir); }
        } else if (op < 0.7) {
          data = randomData(r); table.bw.setData(data);
        } else {
          data = randomData(r); table.bw.update({ data: data });
        }

        var exp = expectedView(data, col, dir, pageSize, page);
        var body = Array.prototype.map.call(table.querySelectorAll('tbody tr'), function(tr) { return tr.children[0].textContent; });
        assert.deepStrictEqual(body, exp.rows.map(function(x) { return x.id; }), 'step ' + step + ' body');

        if (pageSize) {
          var pages = Math.max(1, Math.ceil(data.length / pageSize));
          var shown = exp.offset / pageSize + 1;
          var box = root.querySelector('.bw_bccl_table_pagination');
          var btns = box.querySelectorAll('button');
          assert.strictEqual(box.querySelector('span').textContent, 'Page ' + shown + ' of ' + pages, 'step ' + step + ' pager label');
          assert.strictEqual(btns[0].disabled, shown <= 1, 'step ' + step + ' prev');
          assert.strictEqual(btns[1].disabled, shown >= pages, 'step ' + step + ' next');
        }

        var ths = table.querySelectorAll('thead th');
        ['id', 'n', 'v'].forEach(function(k, i) {
          var sorted = k === col;
          assert.strictEqual(ths[i].getAttribute('aria-sort'), sorted ? (dir === 'asc' ? 'ascending' : 'descending') : null, 'step ' + step + ' aria ' + k);
          var glyph = /[▲▼]/.exec(ths[i].textContent);
          assert.strictEqual(glyph && glyph[0], sorted ? (dir === 'asc' ? '▲' : '▼') : null, 'step ' + step + ' glyph ' + k);
        });

        if (exp.rows.length) {
          var i = Math.floor(r() * exp.rows.length);
          clicks = [];
          table.querySelectorAll('tbody tr')[i].click();
          assert.strictEqual(clicks.length, 1);
          assert.strictEqual(clicks[0][0], exp.rows[i], 'step ' + step + ' clicked row object');
          assert.strictEqual(clicks[0][1], exp.offset + i, 'step ' + step + ' clicked index');
        }
      }
    });
  });
});
