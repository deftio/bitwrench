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
// docs/verify.md is a guide to a tool, so its examples must actually run.
// verify is NOT part of bitwrench core -- it is a separate artifact -- so it is
// injected alongside bw rather than reached through it.
import verify from "../src/bitwrench-verify.js";
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
  // Generated from JSDoc, so this covers every @example in src/ -- the path by
  // which a wrong signature or an unprefixed call reaches the published
  // reference. 90 examples called bare make*() until 2.1.12.
  'docs/bitwrench_api.md',
  'docs/verify.md',
  'docs/svg.md',
  // 270 runnable blocks across these were never executed before 2.1.12, which
  // is how routing.md's four-tier match priority, bwserve's unstamped batch
  // ops and the wasm guide's non-TACO mount all survived review.
  'docs/thinking-in-bitwrench.md',
  'docs/routing.md',
  'docs/component-lifecycle.md',
  'docs/app-patterns.md',
  'docs/drift-lint.md',
  'docs/bitwrench-northstar-principles.md',
  'docs/bw-attach.md',
  'docs/bitwrench-mcp.md',
  'docs/bitwrench-future-options.md',
  'docs/framework-translation-table.md',
  'docs/component-library.md',
  'docs/llm-bitwrench-guide.md',
  'docs/component-cheatsheet.md',
  'README.md',
  'agents.md',
  'docs/quickstart.md',
  'docs/core-api.md',
  'docs/when-you-want.md',
  'docs/taco-format.md',
  'docs/theming.md',
  'docs/state-management.md',
  'llms.txt',
  // Added 2.1.13: the two tutorials, the bwserve guide and the rest were the
  // last onboarding docs whose examples had never run. Eight files, 69 blocks.
  'docs/tutorial-website.md',
  'docs/tutorial-bwserve.md',
  'docs/tutorial-embedded.md',
  'docs/bwserve.md',
  'docs/cli.md',
  'docs/bitwrench_typescript_usage.md',
  'docs/bitwrench-for-wasm.md'
  // Not listed: docs/bitwrench-taco-schema-discussion.md. It is a design
  // discussion whose code is pseudo-code by intent (validateTree, titleSchema
  // sketches), not something a reader copies.
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
  // Names the generated API reference uses as "something you already have".
  // These are reader-supplied in the prose around each entry, so the example
  // is honest -- it just is not self-contained.
  "var handler = function() {}, result = { ok: true }, row = data[0];",
  "var card = bw.makeCard({ title: 'Card' }), myRules = { '.x': { color: 'red' } };",
  "function MyClass() { this.t = 'div'; this.c = 'instance'; }",
  "var domEl = bw.create({ t: 'div' });",
  "var es = new EventSource('/bw/events/1');",
  // "a page/view function you wrote" and "a flag you already have" -- the
  // narrative guides name these in prose around the block.
  "var homePage = function() { return { t: 'h1', c: 'Home' }; };",
  "var overviewPage = homePage, newUserPage = homePage, contactCard = homePage();",
  "var colorCard = homePage(), content = 'text', newData = data;",
  "var loggedIn = true, isOpen = true, accent = '#336699', diff = function() { return {}; };",
  "var app = { page: function() {}, listen: function() {}, broadcast: function() {} };",
  // The bwserve client an app.page handler receives -- the real method names
  // from src/bwserve/client.js, inert. A doc that calls a method not on this
  // list is calling one the client does not have.
  "var client = { mount: function() {}, patch: function() {}, append: function() {}, remove: function() {}, batch: function() {}, message: function() {}, call: function() {}, listen: function() {}, on: function() {}, query: function() {}, screenshot: function() {}, close: function() {} };",
  "var layout = L, csvContent = 'a,b', records = data, msg1 = { v: 1, type: 'patch', ref: 'count', text: '1' }, msg2 = msg1;",
  "var makeNavBar = function() { return { t: 'nav', c: 'nav' }; };",
  "var createMcpServer = function() { return { start: function() {} }; };",
  "var navEl = bw.mount(document.body.appendChild(document.createElement('div')), { t: 'nav', a: { id: 'nav' }, o: { handle: { setActive: function() {} } } });",
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
  // A real origin: jsdom defaults to about:blank, where setting
  // location.hash throws, so every bw.navigate() example failed on the
  // environment rather than on its own merits.
  var dom = new JSDOM('<!DOCTYPE html><html><head></head><body>' + body + '</body></html>',
    { url: 'http://localhost/' });
  global.window = dom.window;
  global.document = dom.window.document;
  global.CustomEvent = dom.window.CustomEvent;
  global.prompt = function() { return 'doc-test'; };
  // jsdom ships no EventSource, and bw.connect() constructs one internally, so
  // without this the SSE examples fail on the environment rather than on their
  // own merits. Inert: it records the url and never opens a connection.
  function FakeEventSource(url) {
    this.url = url;
    this.onmessage = null;
    this.onerror = null;
    this.readyState = 0;
    this.addEventListener = function() {};
    this.removeEventListener = function() {};
    this.close = function() { this.readyState = 2; };
  }
  global.EventSource = FakeEventSource;
  dom.window.EventSource = FakeEventSource;
  // bw.el() caches nodes by id, and that cache outlives a jsdom instance. With
  // 400+ blocks mounting into #app, the entries left behind resolved to
  // detached nodes in whichever suite ran next -- which is how this file
  // started breaking the embedded-C suite that follows it.
  if (bw._nodeMap) {
    Object.keys(bw._nodeMap).forEach(function(k) { delete bw._nodeMap[k]; });
  }
  global.requestAnimationFrame = function(fn) { fn(); };
  return dom;
}

// Targets a block mounts into, as written in the source: bw.mount('#app', ...)
// or bw.DOM('#app', ...). Only string literals -- a variable target cannot be
// resolved statically, and that is fine; this is a net, not a proof.
function mountTargets(code) {
  // A mount inside a `//` comment is an alternative the prose offers, not a
  // call the block makes -- bwserve.md's bw:message example comments out the
  // toast variant and would otherwise be told it "left #toasts empty".
  code = code.replace(/^\s*\/\/.*$/gm, '');
  // A mount scheduled for later cannot have filled anything yet. app-patterns
  // polls sensors inside setInterval + fetch().then() and mounts in the
  // callback, so only mounts lexically before the first scheduler are checked.
  var asyncAt = code.search(/\b(?:setInterval|setTimeout|requestAnimationFrame|addEventListener)\s*\(|\.then\s*\(/);
  var limit = asyncAt === -1 ? Infinity : asyncAt;
  var out = [], re = /bw\.(?:mount|DOM)\(\s*(['"])([^'"]+)\1/g, m;
  while ((m = re.exec(code))) {
    if (m.index < limit) out.push(m[2]);
  }
  return out;
}

// A mount whose target exists must leave something in it. Skipped when the
// block tears down on purpose -- agents.md mounts a modal and then calls
// el.bw.close(), which legitimately ends empty.
function assertMountedSomething(code, file, line) {
  if (/\b(?:clear|clearStyles|unmount|remove|close|hide|destroy)\s*\(/.test(code)) return;
  mountTargets(code).forEach(function(sel) {
    var el = null;
    try { el = document.querySelector(sel.charAt(0) === '#' || sel.charAt(0) === '.' ? sel : '#' + sel); }
    catch (e) { return; }
    if (!el) return;
    var filled = el.childNodes.length > 0 || (el.textContent || '').trim().length > 0;
    assert.ok(filled, file + ':' + line + ' mounted into ' + sel +
      ' but left it empty -- the example runs and renders nothing');
  });
}

FILES.forEach(function(file) {
  describe('Doc examples run: ' + file, function() {
    var list = blocks(file);
    var runnable = list.filter(function(b) { return !b.skip; });

    if (!list.length) {
      it('has no code blocks', function() { assert.strictEqual(list.length, 0); });
      return;
    }

    // A guide written as a progression defines something in one block and uses
    // it in the next. Those files opt in with `<!-- doc-test: sequential -->`,
    // and each block then runs after the ones before it (in a fresh page), so
    // the examples stay copy-pasteable instead of being padded to stand alone.
    // Reference-style files stay isolated: their blocks are independent and
    // would otherwise collide over names like `items`.
    var sequential = /doc-test:\s*sequential/.test(readFileSync(resolve(root, file), 'utf8'));
    var prior = [];

    runnable.forEach(function(b) {
      it('block at line ' + b.line + ' (' + b.lang + ')', function() {
        // Earlier blocks are wrapped in a block scope: their `const`/`let` stay
        // out of the way (a later block may redeclare `items`), while function
        // declarations still hoist into the shared scope.
        var code = prior.map(function(p) { return '{\n' + p + '\n}'; }).join('\n') + '\n' + scriptOf(b);
        freshPage(code);
        var ranAsStatements = false;
        try {
          try {
            new Function('bw', 'verify', FIXTURES + '\nreturn function() {\n' + code + '\n};')(bw, verify)();
            ranAsStatements = true;
          } catch (e) {
            if (!(e instanceof SyntaxError)) throw e;
            // A block of bare TACO literals: render each through both paths.
            // Parse only this block; earlier blocks stay available as setup.
            var objs = topLevelObjects(scriptOf(b));
            if (!objs.length) throw e;
            var setup = prior.map(function(p) { return '{\n' + p + '\n}'; }).join('\n');
            objs.forEach(function(src) {
              var taco = new Function('bw', 'verify', FIXTURES + '\n' + setup + '\nreturn (' + src + ');')(bw, verify);
              bw.html(taco);
              bw.create(taco);
              // Dogfood: a TACO literal in the docs is exactly what verify
              // exists to check, so check it -- where it is actually a TACO.
              //
              // topLevelObjects() extracts every bare object literal, and not
              // all of them are TACO: docs/drift-lint.md shows rule configs
              // ({id, pattern, message}), which verify rightly calls
              // not-an-element. So only objects carrying a `t` or `__bw_raw`
              // are checked.
              //
              // Errors only. A warning means "legal, and verify cannot tell
              // what you meant" -- raw-unchecked fires on any legitimate
              // bw.raw() example, and failing the docs on that would make the
              // severity distinction meaningless.
              if (taco && typeof taco === 'object' &&
                  (typeof taco.t === 'string' || taco.__bw_raw)) {
                var errs = verify(taco).filter(function(f) { return f.severity === 'error'; });
                assert.deepStrictEqual(errs, [],
                  file + ':' + b.line + ' teaches a TACO verify rejects: ' +
                  JSON.stringify(errs));
              }
            });
          }
          // Running without throwing is not the same as working. The
          // quickstart's flagship example mounted an EMPTY list for months
          // because o.mounted suppressed the initial o.render -- and this
          // harness passed it every time, because nothing threw. So when a
          // block mounts into a target we can name, require that something
          // landed there.
          assertMountedSomething(scriptOf(b), file, b.line);

          // Later blocks may build on this one -- but only carry forward code that
          // is valid as statements. A block of bare TACO literals is not.
          if (ranAsStatements && sequential) prior.push(scriptOf(b));
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
