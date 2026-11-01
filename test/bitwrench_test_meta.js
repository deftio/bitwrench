/**
 * Meta tests: the contracts around the code, not the code itself.
 *
 *  1. Type declarations match the runtime. A .d.ts member with no function
 *     behind it compiles in a user's editor and fails in their browser
 *     (2.1.9: TabsConfig declared `text` for labels, css() declared options
 *     no code read, BwServeClient.screenshot was declared and missing).
 *  2. No dead exports. A non-entry module that exports a name nobody imports
 *     is unreachable code that still has to be read, reviewed and kept in
 *     step (2.1.12: bitwrench-utils.js exported a third copy of colorInterp
 *     that no bundle contained -- found by chasing a coverage hole, not by
 *     any check).
 *  3. The suite does not grow tests that cannot fail. `assert.ok(true)` after
 *     a call is coverage, not a check -- the table bugs in review 2026-09-22
 *     sat under one. The count may only go down.
 */

import assert from "assert";
import bw from "../src/bitwrench.js";
import bwserve from "../src/bwserve/index.js";
import { readFileSync, readdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(resolve(root, p), 'utf8');

// Body of `interface Name { ... }` with nested braces balanced.
function interfaceBody(src, name) {
  var start = src.indexOf('interface ' + name + ' {');
  if (start < 0) start = src.indexOf('class ' + name + ' {');
  assert.ok(start >= 0, 'interface ' + name + ' not found');
  var i = src.indexOf('{', start), depth = 0;
  for (var j = i; j < src.length; j++) {
    if (src[j] === '{') depth++;
    else if (src[j] === '}' && --depth === 0) return src.slice(i + 1, j);
  }
  throw new Error('unbalanced interface ' + name);
}

// Top-level member names of an interface body (depth 0 only).
function members(body) {
  var names = [], depth = 0;
  body.split('\n').forEach(function(line) {
    if (depth === 0) {
      var m = /^\s*(?:readonly\s+)?([A-Za-z_$][\w$]*)\??\s*[(:<]/.exec(line);
      if (m) names.push(m[1]);
    }
    depth += (line.match(/[{(]/g) || []).length - (line.match(/[})]/g) || []).length;
  });
  return names;
}

describe('Meta: type declarations match the runtime', function() {
  var dts = read('src/bitwrench.d.ts');

  it('every Bitwrench interface member exists on bw', function() {
    var missing = members(interfaceBody(dts, 'Bitwrench')).filter(function(n) { return typeof bw[n] === 'undefined'; });
    assert.deepStrictEqual(missing, []);
  });

  it('every exported function exists on bw', function() {
    var names = (dts.match(/^export function (\w+)/gm) || []).map(function(s) { return s.slice(16); });
    assert.ok(names.length > 40, 'parsed ' + names.length + ' exports');
    var missing = names.filter(function(n) { return typeof bw[n] !== 'function'; });
    assert.deepStrictEqual(missing, []);
  });

  it('every BwServeClient method in bwserve.d.ts exists on the class', function() {
    var body = interfaceBody(read('src/bwserve.d.ts'), 'BwServeClient');
    var proto = bwserve.BwServeClient.prototype;
    var missing = members(body).filter(function(n) {
      return /\(/.test(body.split('\n').find(function(l) { return new RegExp('^\\s*' + n + '\\??\\s*[(<]').test(l); }) || '') &&
        typeof proto[n] !== 'function';
    });
    assert.deepStrictEqual(missing, []);
  });

  it('TabsConfig declares the prop makeTabs actually reads for labels', function() {
    assert.ok(/label\s*:/.test(interfaceBody(dts, 'TabItem')));
  });
});

describe('Meta: every declared named export resolves', function() {
  // src/bitwrench.d.ts declared makeTable, makeTableFromArray, makeDataTable
  // and makeBarChart as named exports, but they live on `bw` in
  // bitwrench.js rather than in bitwrench-bccl.js, which is what the entry
  // re-exports with `export *`. So `import { makeTable } from 'bitwrench'`
  // type-checked and came back undefined -- the exact failure mode the
  // type-declaration tests above exist to prevent, one level out.
  it('every `export function` in the .d.ts is importable from the ESM entry', async function() {
    var entry = await import('../src/bitwrench-esm-entry.js');
    var declared = (read('src/bitwrench.d.ts').match(/^export function (\w+)/gm) || [])
      .map(function(s) { return s.slice(16); });
    assert.ok(declared.length > 40, 'parsed ' + declared.length + ' declared exports');
    var missing = declared.filter(function(n) { return typeof entry[n] === 'undefined'; });
    assert.deepStrictEqual(missing, [],
      'declared as named exports but undefined on import -- either export them ' +
      'from src/bitwrench-esm-entry.js or stop declaring them');
  });

  it('every declared named export is also reachable on bw', async function() {
    var entry = await import('../src/bitwrench-esm-entry.js');
    var declared = (read('src/bitwrench.d.ts').match(/^export function (\w+)/gm) || [])
      .map(function(s) { return s.slice(16); });
    var missing = declared.filter(function(n) { return typeof entry.default[n] !== 'function'; });
    assert.deepStrictEqual(missing, [], 'named export exists but bw.<name> does not');
  });
});

describe('Meta: every public API is in the generated reference', function() {
  // Data tables and values whose documentation lives elsewhere, plus removed
  // stubs. Anything else missing is a gap: write the JSDoc at the assignment.
  var NOT_IN_REFERENCE = {
    compile: 'removed in 2.0.19; throws. Listed under Removed APIs in agents.md',
    remote: 'transport object installed by bw.connect() at runtime',
    version: 'string; see bw.getVersion()',
    versionInfo: 'object; see bw.getVersion()',
    BCCL: 'component registry; see docs/component-cheatsheet.md',
    THEME_PRESETS: 'data table; see docs/theming.md',
    DEFAULT_PALETTE_CONFIG: 'data table; see docs/theming.md',
    SPACING_PRESETS: 'data table; see docs/theming.md',
    RADIUS_PRESETS: 'data table; see docs/theming.md',
    ELEVATION_PRESETS: 'data table; see docs/theming.md',
    MOTION_PRESETS: 'data table; see docs/theming.md',
    TYPE_RATIO_PRESETS: 'data table; see docs/theming.md',
    // Optional plugins, shipped as their own dist files and documented with
    // them. They land on bw only when a page (or another test) loads them.
    u: 'bitwrench-util-css plugin; see pages/16-utility-css.html',
    utilCSS: 'bitwrench-util-css plugin; see pages/16-utility-css.html',
    codeEditor: 'bitwrench-code-edit plugin; see pages/13-code-editor.html',
    highlight: 'bitwrench-code-edit plugin; see pages/13-code-editor.html'
  };

  var doc = read('docs/bitwrench_api.md');

  it('documents every public bw.* name', function() {
    var missing = Object.keys(bw)
      .filter(function(k) { return !/^_/.test(k) && !NOT_IN_REFERENCE[k]; })
      .filter(function(k) {
        return doc.indexOf('### `bw.' + k + '(') < 0 && doc.indexOf('### `bw.' + k + '`') < 0;
      });
    assert.deepStrictEqual(missing, [], 'undocumented: ' + missing.join(', ') +
      ' -- add a JSDoc block at the assignment, or list it in NOT_IN_REFERENCE with a reason');
  });

  it('lists every documented API in the index table', function() {
    var headings = (doc.match(/^### `([^`]+)`/gm) || []).map(function(h) { return h.slice(5, -1); });
    assert.ok(headings.length > 150, 'parsed ' + headings.length + ' headings');
    var rows = doc.slice(doc.indexOf('## Index'), doc.indexOf('\n---'));
    var absent = headings.filter(function(sig) { return rows.indexOf('`' + sig + '`') < 0; });
    assert.deepStrictEqual(absent, []);
  });

  it('keeps the allowlist honest: every core entry still exists on bw', function() {
    // Plugin names are only present when a plugin happens to be loaded, so
    // they are exempt from this check.
    var PLUGIN = { u: 1, utilCSS: 1, codeEditor: 1, highlight: 1 };
    var stale = Object.keys(NOT_IN_REFERENCE)
      .filter(function(k) { return !PLUGIN[k] && !(k in bw); });
    assert.deepStrictEqual(stale, [], 'remove from NOT_IN_REFERENCE: ' + stale.join(', '));
  });
});

// ===========================================================================
// Dead exports
// ===========================================================================

// Files whose exports ARE the public surface: anything rollup bundles,
// package.json hands out, or an entry re-exports wholesale with `export *`.
// Their exports need no in-tree importer.
function entryModules() {
  var entries = new Set();
  // Any src module the build names: a rollup `input`, or a module it swaps in
  // by path (bitwrench-components-stub.js is aliased, never imported).
  (read('rollup.config.js').match(/'(src\/[\w./-]+\.js)'/g) || []).forEach(function(m) {
    entries.add(/'([^']+)'/.exec(m)[1]);
  });
  var pkg = JSON.parse(read('package.json'));
  [pkg.exports, pkg.bin].forEach(function(field) {
    (JSON.stringify(field || {}).match(/(?:\.\/)?src\/[\w./-]+\.js/g) || [])
      .forEach(function(v) { entries.add(v.replace(/^\.\//, '')); });
  });
  // `export * from './x.js'` in an entry makes x's whole surface public too.
  // Iterate so a chain of re-exports is followed.
  for (var pass = 0; pass < 5; pass++) {
    var before = entries.size;
    Array.from(entries).forEach(function(f) {
      var src = safeRead(f);
      if (src === null) return;
      var re = /export\s+\*\s+from\s+['"]([^'"]+)['"]/g, m;
      while ((m = re.exec(src))) {
        var target = resolve(root, dirname(f), m[1]);
        entries.add(target.slice(root.length + 1));
      }
    });
    if (entries.size === before) break;
  }
  return entries;
}

function safeRead(p) {
  try { return read(p); } catch (e) { return null; }
}

function srcFiles(dir, out) {
  out = out || [];
  readdirSync(resolve(root, dir), { withFileTypes: true }).forEach(function(e) {
    var rel = dir + '/' + e.name;
    if (e.isDirectory()) {
      if (e.name !== 'vendor') srcFiles(rel, out);
    } else if (e.name.endsWith('.js')) {
      out.push(rel);
    }
  });
  return out;
}

// Map every `from '<path>'` in a consumer to the module it resolves to, so a
// name is only credited to the module it was actually imported FROM. Matching
// on the bare name is not enough: three modules exported a `colorInterp` and
// only one of them was ever imported.
function importGraph(consumers, sourceOf) {
  var named = {};       // module -> Set of names imported from it
  var whole = new Set(); // modules consumed wholesale (namespace/default/dynamic)

  function target(from, spec) {
    if (spec[0] !== '.') return null; // bare package specifier
    return resolve(root, dirname(from), spec).slice(root.length + 1);
  }

  consumers.forEach(function(f) {
    var src = sourceOf(f), m;

    var namedRe = /(?:import|export)\s*\{([^}]*)\}\s*from\s*['"]([^'"]+)['"]/g;
    while ((m = namedRe.exec(src))) {
      var t = target(f, m[2]);
      if (!t) continue;
      if (!named[t]) named[t] = new Set();
      m[1].split(',').forEach(function(spec) {
        var name = spec.trim().split(/\s+as\s+/)[0].trim();
        if (name) named[t].add(name);
      });
    }

    // `import * as ns`, `import def`, `export * from`, and dynamic import()
    // all reach names without naming them, so treat the module as consumed.
    [/import\s+\*\s+as\s+\w+\s+from\s*['"]([^'"]+)['"]/g,
     /import\s+\w+(?:\s*,\s*\{[^}]*\})?\s+from\s*['"]([^'"]+)['"]/g,
     /export\s+\*\s+(?:as\s+\w+\s+)?from\s*['"]([^'"]+)['"]/g,
     /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g].forEach(function(re) {
      var mm;
      while ((mm = re.exec(src))) {
        var t2 = target(f, mm[1]);
        if (t2) whole.add(t2);
      }
    });
  });

  return { named: named, whole: whole };
}

describe('Meta: no dead exports in src/', function() {
  it('every non-entry export has an importer', function() {
    var entries = entryModules();
    assert.ok(entries.size > 5, 'parsed ' + entries.size + ' entry modules');
    var files = srcFiles('src');
    assert.ok(files.length > 10, 'found ' + files.length + ' source files');

    // Tests, build tools and the bin shims are legitimate consumers: an
    // export exists for them too. Scan them for importers, but only look
    // for dead exports in src/.
    var consumers = files.concat(srcFiles('test'), srcFiles('tools'), srcFiles('bin'));
    var sources = {};
    consumers.forEach(function(f) { sources[f] = read(f); });
    var sourceOf = function(f) { return sources[f]; };

    var graph = importGraph(consumers, sourceOf);
    assert.ok(Object.keys(graph.named).length > 5,
      'resolved ' + Object.keys(graph.named).length + ' imported modules');

    var dead = [];
    files.forEach(function(f) {
      if (entries.has(f) || graph.whole.has(f)) return;
      var from = graph.named[f] || new Set();
      var re = /^export\s+(?:async\s+)?(?:function\*?|class|const|let|var)\s+([A-Za-z_$][\w$]*)/gm, m;
      while ((m = re.exec(sources[f]))) {
        if (!from.has(m[1])) dead.push(f + ': ' + m[1]);
      }
    });

    assert.deepStrictEqual(dead, [],
      'unreachable export(s) -- delete them, or make the file an entry point');
  });
});

describe('Meta: tests that cannot fail may only decrease', function() {
  // Lower this as assert.ok(true) calls are replaced with real assertions.
  // Never raise it: write an assertion about the outcome instead.
  var BASELINE = 110;

  it('assert.ok(true) count is at or below baseline (' + BASELINE + ')', function() {
    var dir = resolve(root, 'test');
    var count = 0, where = {};
    readdirSync(dir).filter(function(f) { return /\.js$/.test(f) && f !== 'bitwrench_test_meta.js'; }).forEach(function(f) {
      var n = (readFileSync(resolve(dir, f), 'utf8').match(/assert\.ok\(\s*true\s*[,)]/g) || []).length;
      if (n) { count += n; where[f] = n; }
    });
    assert.ok(count <= BASELINE, count + ' > ' + BASELINE + ': ' + JSON.stringify(where));
  });
});
