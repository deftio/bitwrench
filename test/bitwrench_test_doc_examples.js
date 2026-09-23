/**
 * Doc examples must run. Every ```javascript / ```js / ```html block in the
 * onboarding docs below is executed in a fresh jsdom page. drift-lint checks
 * names; this checks that the code people copy first actually works.
 *
 * Why: 2.1.9 found a quickstart that styled its list with a class that never
 * existed, a theming example that threw on `theme.alternate.css`, and docs
 * telling agents `bw.DOM()` returns nothing -- all green in the unit suite.
 *
 * A block that is deliberately a fragment (placeholders like `users`, a
 * WRONG example, Node-only code) is skipped by putting this on the line
 * before its fence, with a reason:
 *
 *     <!-- doc-test: skip (uses the reader's own `users` array) -->
 */

import assert from "assert";
import bw from "../src/bitwrench.js";
// Optional plugin documented in the LLM guide: installs bw.u()
import utilCSS from "../src/bitwrench-util-css.js";
utilCSS.install(bw);
import jsdom from 'jsdom';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
const { JSDOM } = jsdom;

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const FILES = [
  'docs/component-library.md',
  'docs/llm-bitwrench-guide.md',
  'docs/component-cheatsheet.md',
  'README.md',
  'agents.md',
  'docs/quickstart.md',
  'docs/core-api.md',
  'docs/taco-format.md',
  'docs/theming.md',
  'docs/state-management.md',
  'llms.txt'
];

function blocks(file) {
  var lines = readFileSync(resolve(root, file), 'utf8').split('\n');
  var out = [];
  for (var i = 0; i < lines.length; i++) {
    var m = /^```(javascript|js|html)\s*$/.exec(lines[i]);
    if (!m) continue;
    var skip = /doc-test:\s*skip/.test(lines[i - 1] || '');
    var start = i + 1, body = [];
    for (i = start; i < lines.length && !/^```\s*$/.test(lines[i]); i++) body.push(lines[i]);
    out.push({ lang: m[1], line: start, code: body.join('\n'), skip: skip });
  }
  return out;
}

// For html blocks, run the inline scripts (script tags with a src are the
// bitwrench include, which the test provides as the global `bw`).
function scriptOf(block) {
  if (block.lang !== 'html') return block.code;
  var code = [], re = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g, m;
  while ((m = re.exec(block.code))) code.push(m[1]);
  return code.join('\n;\n');
}

// Names docs use as "your data" placeholders. Blocks run in a nested function,
// so a block that declares its own `data` (let/const/var) shadows these.
var FIXTURES = [
  "var data = [{ name: 'Alice', age: 30, role: 'Admin', status: 'active' }, { name: 'Bob', age: 25, role: 'User', status: 'away' }];",
  "var rows = data, users = data, allData = data, freshUsers = data, items = ['one', 'two'];",
  "var columns = [{ key: 'name', label: 'Name' }, { key: 'age', label: 'Age' }], cols = columns;",
  "var navItems = [{ text: 'Home', href: '#' }], slides = [{ content: 'Slide' }], isLoggedIn = true;",
  "var styles = bw.makeStyles({ primary: '#336699', secondary: '#cc6633' }), rules = { '.x': { color: 'red' } };",
  "var fs = { writeFileSync: function() {} }, save = function() {}, filter = function() {}, confirm = function() {};",
  "var saveSetting = function() {}, time = 'now', stats = data, fn = function() {};",
  "var isAdmin = true, isActive = true, hasData = true, all = data, brand = 'Acme';",
  "var cart = { items: [{ name: 'Widget', price: 9 }], total: 9 };",
  "var p = styles.palette, L = styles.layout, palette = p, radius = L.radius.card;",
  // "your component's element" in pub/sub and state examples
  "var el = bw.mount(document.body.appendChild(document.createElement('div')), { t: 'div', a: { id: 'my-component' }, o: { state: { count: 0 }, render: function(e, s) { bw.patch(e, 'Count: ' + s.count); } } });"
].join('\n');

// Split a block of bare object literals ({ t: ... } written as data, which JS
// would parse as a statement block) into its top-level objects.
function topLevelObjects(code) {
  var out = [], depth = 0, start = -1, q = null;
  for (var i = 0; i < code.length; i++) {
    var ch = code[i];
    if (q) { if (ch === '\\') i++; else if (ch === q) q = null; continue; }
    if (ch === '/' && code[i + 1] === '/') { while (i < code.length && code[i] !== '\n') i++; continue; }
    if (ch === "'" || ch === '"' || ch === '`') { q = ch; continue; }
    if (ch === '{') { if (depth++ === 0) start = i; }
    else if (ch === '}' && --depth === 0) out.push(code.slice(start, i + 1));
  }
  return out;
}

function freshPage(code) {
  var ids = {};
  (code.match(/['"]#([A-Za-z][\w-]*)['"]/g) || []).forEach(function(s) { ids[s.slice(2, -1)] = true; });
  (code.match(/getElementById\(\s*['"]([\w-]+)['"]/g) || []).forEach(function(s) {
    ids[/['"]([\w-]+)['"]/.exec(s)[1]] = true;
  });
  (code.match(/bw\.(?:el|patch)\(\s*['"]([A-Za-z][\w-]*)['"]/g) || []).forEach(function(s) {
    ids[/['"]([\w-]+)['"]/.exec(s)[1]] = true;
  });
  var body = Object.keys(ids).map(function(id) { return '<div id="' + id + '"></div>'; }).join('');
  var dom = new JSDOM('<!DOCTYPE html><html><head></head><body>' + body + '</body></html>');
  global.window = dom.window;
  global.document = dom.window.document;
  global.CustomEvent = dom.window.CustomEvent;
  global.prompt = function() { return 'doc-test'; };
  global.requestAnimationFrame = function(fn) { fn(); };
  return dom;
}

FILES.forEach(function(file) {
  describe('Doc examples run: ' + file, function() {
    var list = blocks(file);
    var runnable = list.filter(function(b) { return !b.skip; });

    if (!list.length) {
      it('has no code blocks', function() { assert.strictEqual(list.length, 0); });
      return;
    }

    runnable.forEach(function(b) {
      it('block at line ' + b.line + ' (' + b.lang + ')', function() {
        var code = scriptOf(b);
        freshPage(code);
        try {
          try {
            new Function('bw', FIXTURES + '\nreturn function() {\n' + code + '\n};')(bw)();
          } catch (e) {
            if (!(e instanceof SyntaxError)) throw e;
            // A block of bare TACO literals: render each through both paths.
            var objs = topLevelObjects(code);
            if (!objs.length) throw e;
            objs.forEach(function(src) {
              var taco = new Function('bw', FIXTURES + '\nreturn (' + src + ');')(bw);
              bw.html(taco);
              bw.create(taco);
            });
          }
        } catch (e) {
          assert.fail(file + ':' + b.line + ' threw ' + e.name + ': ' + e.message +
            '\n  (fix the example, or mark it <!-- doc-test: skip (reason) --> if it is a fragment)');
        } finally {
          bw.clearStyles && bw.clearStyles();
        }
      });
    });

    it('skips are few and explained', function() {
      var lines = readFileSync(resolve(root, file), 'utf8').split('\n');
      list.filter(function(b) { return b.skip; }).forEach(function(b) {
        assert.ok(/doc-test:\s*skip\s*\(.+\)/.test(lines[b.line - 2]), file + ':' + (b.line - 1) + ' skip needs a (reason)');
      });
    });
  });
});
