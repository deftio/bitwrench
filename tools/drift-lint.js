#!/usr/bin/env node

/**
 * drift-lint.js -- Scan release-facing files for stale patterns.
 *
 * Catches drift between what the code does and what docs/examples/pages
 * say it does. Three rule kinds:
 *   - name rules:       a token that should no longer appear (e.g. a removed API)
 *   - structural rules: an anti-pattern shape -- anchor + evidence within N lines
 *   - api rules:        cross-reference bw.XXX() calls in docs against the real
 *                       public API extracted from source (auto-generated at runtime)
 *
 * Full documentation: docs/drift-lint.md
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'fs';
import { resolve, relative, extname, join } from 'path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

var __dirname = dirname(fileURLToPath(import.meta.url));
var ROOT = resolve(__dirname, '..');

// ── CLI flags ───────────────────────────────────────────────────────
var VERBOSE = process.argv.indexOf('--verbose') !== -1;
var HELP = process.argv.indexOf('--help') !== -1 || process.argv.indexOf('-h') !== -1;
var LIST_RULES = process.argv.indexOf('--list-rules') !== -1;

if (HELP) {
  console.log(
    'drift-lint -- keep docs honest\n' +
    '\n' +
    'Scans release-facing files (docs/, pages/, examples/, root .md files)\n' +
    'for stale API references, removed function names, renamed fields, and\n' +
    'structural anti-patterns. Extracts the real public API from src/ at\n' +
    'runtime and cross-references every bw.XXX() call in scanned files.\n' +
    '\n' +
    'Usage:\n' +
    '  npm run lint:drift              run all rules\n' +
    '  node tools/drift-lint.js        same thing, direct invocation\n' +
    '\n' +
    'Options:\n' +
    '  --verbose       show honored ignore blocks and config excludes\n' +
    '  --list-rules    print the rule inventory and exit\n' +
    '  --help, -h      show this help\n' +
    '\n' +
    'Ignore pragmas (works in any comment style):\n' +
    '  drift-lint:ignore-next-line: reason   suppress one line\n' +
    '  drift-lint:ignore-start: reason       block start\n' +
    '  drift-lint:ignore-end                 block end\n' +
    '\n' +
    'Config: .drift-lint-config.json (per-rule file excludes)\n' +
    'Docs:   docs/drift-lint.md\n' +
    'Exit:   0 = clean, 1 = violations found'
  );
  process.exit(0);
}

// ── Config file ─────────────────────────────────────────────────────
// .drift-lint-config.json: per-rule file excludes managed as data, not code.
// Format: { "exclude": { "rule-id": ["relative/path", ...], "*": ["globally-excluded"] } }

var CONFIG_PATH = resolve(ROOT, '.drift-lint-config.json');
var configExclude = {};
try {
  var configRaw = readFileSync(CONFIG_PATH, 'utf8');
  var config = JSON.parse(configRaw);
  if (config.exclude) configExclude = config.exclude;
} catch (_) { /* no config or parse error — proceed without */ }

// ── Public API extraction ────────────────────────────────────────────
// Builds the set of valid bw.XXX names from source files at runtime.
// This powers the stale-api rule: any bw.XXX() in docs that isn't in
// this set is flagged as a reference to a non-existent function.

function extractPublicAPI() {
  var api = new Set();
  var srcDir = resolve(ROOT, 'src');

  // 1. bw.XXX = function|value from bitwrench.js and other src files
  var srcFiles = ['bitwrench.js', 'bitwrench-file-ops.js', 'bitwrench-code-edit.js',
                  'bitwrench-router.js', 'bitwrench-styles.js',
                  'bitwrench-util-css.js', 'bitwrench-util-color.js',
                  'bitwrench-debug.js'];
  for (var i = 0; i < srcFiles.length; i++) {
    var fpath = resolve(srcDir, srcFiles[i]);
    var content;
    try { content = readFileSync(fpath, 'utf8'); } catch (_) { continue; }
    var lines = content.split('\n');
    for (var li = 0; li < lines.length; li++) {
      // Match: bw.xxx = function, bw.xxx = imported, bw.xxx = value
      var m = lines[li].match(/^\s*bw\.([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=/);
      if (m && m[1]) api.add(m[1]);
    }
  }

  // 2. Object-literal properties on the bw object (bitwrench.js top-level)
  //    e.g. "  getVersion: function() {"  or  "  version: VERSION_INFO.version,"
  var mainPath = resolve(srcDir, 'bitwrench.js');
  try {
    var mainContent = readFileSync(mainPath, 'utf8');
    var mainLines = mainContent.split('\n');
    for (var mi = 0; mi < mainLines.length; mi++) {
      var pm = mainLines[mi].match(/^\s+([a-zA-Z_$][a-zA-Z0-9_$]*):\s*(?:function|VERSION)/);
      if (pm && pm[1]) api.add(pm[1]);
      // Stop scanning object literal after closing brace
      if (/^};/.test(mainLines[mi])) break;
    }
  } catch (_) {}

  // 3. export function makeXxx from bitwrench-bccl.js (become bw.makeXxx)
  var exportFiles = ['bitwrench-bccl.js', 'bitwrench-color-utils.js'];
  for (var ei = 0; ei < exportFiles.length; ei++) {
    var epath = resolve(srcDir, exportFiles[ei]);
    try {
      var econtent = readFileSync(epath, 'utf8');
      var elines = econtent.split('\n');
      for (var eli = 0; eli < elines.length; eli++) {
        var em = elines[eli].match(/^export function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/);
        if (em && em[1]) api.add(em[1]);
      }
    } catch (_) {}
  }

  // 4. Known property names that aren't caught by patterns above
  ['BCCL', 'DOM', 'debug', 'remote', 'to', '$'].forEach(function(n) { api.add(n); });

  return api;
}

var PUBLIC_API = extractPublicAPI();

// ── Stale pattern rules ──────────────────────────────────────────────
// Each rule: { id, pattern (regex), message, allowIn (optional array of globs) }

var RULES = [
  {
    id: 'client.render',
    pattern: /client\.render\s*\(/g,
    message: 'client.render() → client.mount()'
  },
  {
    id: 'client.exec',
    pattern: /client\.exec\s*\(/g,
    message: 'client.exec() removed in v2.1'
  },
  {
    id: 'client.register',
    pattern: /client\.register\s*\(/g,
    message: 'client.register() removed in v2.1'
  },
  {
    id: 'bw.createDOM',
    pattern: /bw\.createDOM\s*\(/g,
    message: 'bw.createDOM() → bw.create()'
  },
  {
    id: 'bw.cleanup',
    pattern: /bw\.cleanup\s*\(/g,
    message: 'bw.cleanup() → bw.unmount()'
  },
  {
    id: 'bw.component',
    pattern: /bw\.component\s*\(/g,
    message: 'bw.component() removed in v2.1',
    contextExclude: [
      /removed|was removed|no longer|No bw\.component/i  // OK if explaining removal
    ]
  },
  {
    id: 'data-bw-action',
    pattern: /data-bw-action/g,
    message: 'data-bw-action → bw_act_* CSS class'
  },
  {
    // A fabricated owner (github.com/nicktackes/bitwrench) sat in the embedded
    // C headers and the Rust Cargo.toml from 2026-03 until v2.1.0 removed it.
    // It never shipped, but nothing would have caught it if it had -- and the
    // embedded registries display these URLs on the package page.
    id: 'foreign-repo-url',
    pattern: /github\.com\/(?!deftio\/)[A-Za-z0-9_.-]+\/bitwrench/g,
    message: 'bitwrench repo URL must point at github.com/deftio/bitwrench'
  },
  {
    id: 'allowExec',
    pattern: /allowExec/g,
    message: 'allowExec removed in v2.1'
  },
  {
    id: '--allow-exec',
    pattern: /--allow-exec/g,
    message: '--allow-exec flag removed in v2.1'
  },
  {
    id: 'wire:target',
    pattern: /"target"\s*:/g,
    message: 'Wire field "target" → "ref"',
    // Exclude: HTML target attr, tsconfig target, router target, Rust event.target
    contextExclude: [
      /target.*ES20/i,        // tsconfig "target": "ES2020"
      /a\.target|target="_/i, // HTML <a target=
      /target.*#/,            // router target: '#app'
      /event\[.target.\]/     // Rust event["target"]
    ]
  },
  {
    id: 'wire:node',
    pattern: /"node"\s*:/g,
    message: 'Wire field "node" → "taco"',
    contextExclude: [
      /moduleResolution.*node/i,  // tsconfig "moduleResolution": "node"
      /command.*node/i            // MCP config "command": "node"
    ]
  },
  {
    id: '/exec',
    pattern: /\/exec\b/g,
    message: '/exec REPL command removed in v2.1',
    contextExclude: [
      /removed|was removed|no longer/i  // OK if explaining removal
    ]
  },
  {
    id: 'parseRJSON',
    pattern: /parseRJSON/g,
    message: 'bw.parseRJSON → bw.parseJSONFlex'
  },
  {
    id: 'levels-taxonomy',
    pattern: /Level [012]\b/g,
    message: 'Level 0/1/2 taxonomy removed in v2.1 — use descriptive names',
    contextExclude: [
      /removed|was removed|no longer/i,   // OK if explaining removal
      /heading.*level|h[1-6].*level/i,    // heading-level references
      /level.*deep|depth.*level/i          // inspect depth references
    ]
  },
  {
    id: 'toggleStyles',
    pattern: /toggleStyles/g,
    message: 'bw.toggleStyles() → bw.toggleThemeMode()',
    contextExclude: [
      /removed|was removed|renamed|no longer|SUPERSEDED/i
    ]
  },
  {
    id: 'bw_card-bare',
    pattern: /\bbw_card\b/g,
    message: 'bw_card → bw_bccl_card when describing BCCL component output',
    fileFilter: /\.md$/,
    fileExclude: /taco-format|taco-schema|CONTRIBUTING|typescript_usage|bitwrench_api/,
    contextExclude: [
      /bw_bccl_card/,           // already correct
      /removed|renamed|was/i,   // explaining the change
      /\.bw_card/,              // CSS selector reference (still valid)
      /class[:\s]/i,            // CSS class attribute usage (CSS class still valid)
      /pattern/                 // regex pattern reference
    ]
  },
  {
    id: 'bw_btn-bare',
    pattern: /\bbw_btn\b/g,
    message: 'bw_btn → bw_bccl_btn when describing BCCL component output',
    fileFilter: /\.md$/,
    fileExclude: /taco-format|taco-schema|CONTRIBUTING|typescript_usage|bitwrench_api/,
    contextExclude: [
      /bw_bccl_btn/,
      /removed|renamed|was/i,
      /\.bw_btn/,              // CSS selector reference (still valid)
      /class[:\s]/i            // CSS class attribute usage
    ]
  },
  {
    id: 'bw-container',
    pattern: /bw-container/g,
    message: 'bw-container → bw_container (underscore canonical)'
  },
  {
    id: 'normalizeClass',
    pattern: /normalizeClass/g,
    message: 'bw.normalizeClass() does not exist — remove reference'
  },
  {
    id: 'three-level',
    pattern: /three-level/g,
    message: 'three-level → component model (state-management.md uses stages, not a fixed count)'
  },
  {
    id: 'outline-hyphen',
    pattern: /outline-(?:primary|secondary|success|danger|warning|info|light|dark)/g,
    message: 'outline-variant → outline_variant (underscore canonical)',
    fileFilter: /\.(md|html)$/,
    contextExclude: [
      /or .outline-/,             // explaining both forms
      /btn-outline-/,             // Bootstrap class names in comparison code
      /outline-offset|outline-color|outline-style|outline-width/  // CSS properties
    ]
  },
  {
    id: 'reactive-self',
    pattern: /\breactive\b/gi,
    message: '"reactive" as self-description — use "explicit stateful" or "state + explicit re-render"',
    fileFilter: /\.(md|html)$/,
    fileExclude: /framework-translation-table|bitwrench-for-wasm/,
    contextExclude: [
      /Coming from React|React\/Vue|vs React|compared to|React-style|framework comparison|Reactive frameworks/i,  // comparative content OK
      /SUPERSEDED|removed|was reactive/i,  // explaining the change
      /not reactive|non-reactive|isn.t reactive|without reactive|explicit.not.reactive|no reactiv/i,  // negations OK
      /zero reactive/i,     // negation: "zero reactive state"
      /CSS reactive|CSS.*react|react.*CSS/i,  // CSS context
      /\.reactive/,                            // CSS class name
      /Yew|Leptos|Dioxus|Vue|Svelte|Solid|Angular/i,  // describing other frameworks
      /does NOT do|doesn.t do/i,  // saying what bitwrench doesn't do
      /bitwrench does not/i,      // same
      /Log search is reactive/i   // fictional product copy, not bitwrench
    ]
  },
  {
    id: 'getHandle',
    pattern: /getHandle/g,
    message: 'bw.getHandle() removed in v2.1 — handles live on el.bw directly',
    contextExclude: [
      /removed|was removed|no longer|SUPERSEDED/i
    ]
  },
  {
    id: 'update-as-rerender',
    // Prose claiming bw.update() re-renders — it dispatches to el.bw.update();
    // re-render is bw.refresh(). Catches "call bw.update(el) to re-render" style text.
    pattern: /bw\.update\([^)]*\)[^.\n]{0,40}re-?render|re-?render[^.\n]{0,40}bw\.update\(/gi,
    message: 'bw.update() dispatches to el.bw.update(); re-render is bw.refresh()',
    contextExclude: [
      /never|not|instead of|rather than|vs\.?|whereas/i  // contrasting the two correctly
    ]
  },
  {
    id: 'mounted-event-wiring',
    // Structural rule: DOM event handlers attached via addEventListener inside
    // o.mounted. Handlers wired this way are lost on bw.refresh() — the docs
    // mark this pattern WRONG. Use a: { onclick: fn } instead.
    // Anchor: "mounted:" — evidence: an interactive-event listener within 3 lines.
    pattern: /\bmounted\s*:/,
    followedBy: /\.addEventListener\(\s*['"](?:click|input|change|submit|keydown|keyup|pointerdown|pointerup|touchstart)['"]/,
    within: 3,
    message: 'event handler wired in o.mounted is lost on bw.refresh() — use a: { onclick: fn }',
    fileFilter: /\.(html|js)$/,
    contextExclude: [
      /['"`].*addEventListener.*['"`]/,  // quoted demo/comparison code strings
      /window\.addEventListener|document\.addEventListener/  // page-level listeners are fine
    ]
  },
  {
    // bitwrench's design system uses palette/layout JS tokens, not var(--bw_*).
    // User CSS may use platform custom properties, but first-party docs/examples
    // must not teach var(--bw_*) as the theming path.
    id: 'css-var-bw',
    pattern: /var\(--bw[_-]/g,
    message: 'var(--bw_*) → styles.palette / styles.layout tokens (or .bw_bg_* / .bw_text_* classes)',
    contextExclude: [
      /does not use var\(--bw|no var\(--bw|never.*var\(--bw|not use var\(--bw|not var\(--bw/i,
      /WRONG|wrong --|anti-pattern|do not|don't use/i,
      /→ styles\.palette|→ .*palette/  // migration messages naming the old form
    ]
  }
];

if (LIST_RULES) {
  console.log('drift-lint rules (' + RULES.length + ' pattern rules + stale-api checker):\n');
  console.log('  Pattern rules:');
  for (var lr = 0; lr < RULES.length; lr++) {
    var r = RULES[lr];
    var kind = r.followedBy ? 'structural' : 'name';
    console.log('    ' + r.id.padEnd(25) + ' [' + kind + ']  ' + r.message);
  }
  console.log('\n  API rules:');
  console.log('    stale-api                 [api]       bw.XXX() in docs must match a real public API name');
  console.log('                                          (' + PUBLIC_API.size + ' API names extracted from src/)');
  process.exit(0);
}

// ── File collection ──────────────────────────────────────────────────

var SCAN_DIRS = ['docs', 'pages', 'examples', 'embedded_python'];
// readme.html is generated from README.md — scanning it catches "README fixed
// but build:readme not re-run", which is itself a form of drift.
var SCAN_ROOT_FILES = ['README.md', 'CONTRIBUTING.md', 'ABOUT.md', 'readme.html', 'llms.txt', 'agents.md'];
var SCAN_EXTS = new Set(['.md', '.html', '.js', '.py', '.sh', '.ts', '.txt']);
var SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'coverage', 'dev']);

function collectFiles(dir) {
  var files = [];
  try {
    var entries = readdirSync(dir);
  } catch (_) { return files; }

  for (var i = 0; i < entries.length; i++) {
    var name = entries[i];
    if (name.startsWith('.') || SKIP_DIRS.has(name)) continue;
    var full = resolve(dir, name);
    var st;
    try { st = statSync(full); } catch (_) { continue; }
    if (st.isDirectory()) {
      files = files.concat(collectFiles(full));
    } else if (SCAN_EXTS.has(extname(name))) {
      files.push(full);
    }
  }
  return files;
}

// ── Ignore pragma ────────────────────────────────────────────────────
//
//   drift-lint:ignore-start: <reason>     ← reason is REQUIRED
//   ...exempt lines...
//   drift-lint:ignore-end
//
// Works in any comment style (//, #, <!-- -->, /* */).
//
// Structural problems (unclosed start, end without start, nested start) are
// hard ERRORS — they can silently exempt far more than intended.
// A missing reason is a WARNING, not a failure: a hotfix shouldn't be blocked
// on prose, but pragmas without context become archaeology. Add the reason.

var PRAGMA_START = /drift-lint\s*:\s*ignore-start\s*:?\s*(.*)$/;
var PRAGMA_END = /drift-lint\s*:\s*ignore-end/;
var PRAGMA_NEXT_LINE = /drift-lint\s*:\s*ignore-next-line\s*:?\s*(.*)$/;

// Computes per-line ignore state.
// Returns { ignored: bool[], blocks: [...], errors: [...], warnings: [...] }
function computeIgnores(lines, relPath) {
  var ignored = new Array(lines.length).fill(false);
  var blocks = [];
  var errors = [];
  var warnings = [];
  var openLine = -1;
  var openReason = null;

  for (var i = 0; i < lines.length; i++) {
    // Single-line pragma: ignores the NEXT line only
    var nextLineMatch = lines[i].match(PRAGMA_NEXT_LINE);
    if (nextLineMatch) {
      var nlReason = nextLineMatch[1].replace(/-->.*$|\*\/.*$/, '').trim();
      if (!nlReason) {
        warnings.push(relPath + ':L' + (i + 1) + ' — ignore-next-line has no reason; add one so future readers know what was intended');
      }
      ignored[i] = true;
      if (i + 1 < lines.length) {
        ignored[i + 1] = true;
        blocks.push({ file: relPath, from: i + 1, to: i + 2, reason: nlReason || '(no reason given)' });
      }
      i++; // skip the next line in the loop
      continue;
    }
    var startMatch = lines[i].match(PRAGMA_START);
    if (startMatch) {
      if (openLine !== -1) {
        errors.push(relPath + ':L' + (i + 1) + ' — ignore-start inside an open ignore block (started L' + (openLine + 1) + ')');
        continue;
      }
      var reason = startMatch[1].replace(/-->.*$|\*\/.*$/, '').trim();
      if (!reason) {
        warnings.push(relPath + ':L' + (i + 1) + ' — ignore block has no reason; add one (drift-lint:ignore-start: <why>) so future readers know what was intended');
      }
      openLine = i;
      openReason = reason || '(no reason given)';
      ignored[i] = true;
      continue;
    }
    if (PRAGMA_END.test(lines[i])) {
      if (openLine === -1) {
        errors.push(relPath + ':L' + (i + 1) + ' — ignore-end without matching ignore-start');
        continue;
      }
      ignored[i] = true;
      blocks.push({ file: relPath, from: openLine + 1, to: i + 1, reason: openReason });
      openLine = -1;
      openReason = null;
      continue;
    }
    if (openLine !== -1) ignored[i] = true;
  }

  if (openLine !== -1) {
    errors.push(relPath + ':L' + (openLine + 1) + ' — ignore-start never closed (add drift-lint:ignore-end)');
  }
  return { ignored: ignored, blocks: blocks, errors: errors, warnings: warnings };
}

// ── Scan ─────────────────────────────────────────────────────────────

function ruleApplies(rule, relPath) {
  if (rule.fileFilter && !rule.fileFilter.test(relPath)) return false;
  if (rule.fileExclude && rule.fileExclude.test(relPath)) return false;
  // Config-based per-rule excludes
  var ruleExcludes = configExclude[rule.id];
  if (ruleExcludes && ruleExcludes.indexOf(relPath) !== -1) return false;
  // Global config excludes (keyed by "*")
  var globalExcludes = configExclude['*'];
  if (globalExcludes && globalExcludes.indexOf(relPath) !== -1) return false;
  return true;
}

function contextExcluded(rule, line) {
  if (!rule.contextExclude) return false;
  for (var ci = 0; ci < rule.contextExclude.length; ci++) {
    if (rule.contextExclude[ci].test(line)) return true;
  }
  return false;
}

function scanFile(filePath, content) {
  var hits = [];
  var lines = content.split('\n');
  var relPath = relative(ROOT, filePath);

  var ig = computeIgnores(lines, relPath);
  pragmaErrors = pragmaErrors.concat(ig.errors);
  pragmaWarnings = pragmaWarnings.concat(ig.warnings);
  ignoreBlocks = ignoreBlocks.concat(ig.blocks);

  for (var li = 0; li < lines.length; li++) {
    if (ig.ignored[li]) continue;
    var line = lines[li];

    for (var ri = 0; ri < RULES.length; ri++) {
      var rule = RULES[ri];
      if (!ruleApplies(rule, relPath)) continue;

      rule.pattern.lastIndex = 0;
      if (!rule.pattern.test(line)) continue;

      if (rule.followedBy) {
        // Structural rule: anchor matched; look for evidence within N lines
        // (including the anchor line itself). contextExclude is applied to
        // the EVIDENCE line, since that's where false-positive context lives.
        var window = rule.within || 3;
        var evidenceLine = -1;
        for (var wi = 0; wi <= window && li + wi < lines.length; wi++) {
          if (ig.ignored[li + wi]) continue;
          rule.followedBy.lastIndex = 0;
          if (rule.followedBy.test(lines[li + wi]) && !contextExcluded(rule, lines[li + wi])) {
            evidenceLine = li + wi;
            break;
          }
        }
        if (evidenceLine === -1) continue;
        hits.push({
          file: relPath,
          line: evidenceLine + 1,
          rule: rule.id,
          message: rule.message,
          text: lines[evidenceLine].trim().substring(0, 120)
        });
      } else {
        if (contextExcluded(rule, line)) continue;
        hits.push({
          file: relPath,
          line: li + 1,
          rule: rule.id,
          message: rule.message,
          text: line.trim().substring(0, 120)
        });
      }
    }
  }

  // ── Stale API check ───────────────────────────────────────────────
  // For .md and .html files, find every bw.XXX() call at namespace level
  // and verify it exists in the public API extracted from source.
  // EXCLUDES: el.bw.XXX() (handle/slot calls on component instances),
  //   private names (_xxx), removal notes, changelog entries.
  if (/\.(md|html)$/.test(relPath)) {
    var staleApiRule = { id: 'stale-api', fileFilter: null, fileExclude: null };
    if (ruleApplies(staleApiRule, relPath)) {
      // Match bw.XXX( but NOT .bw.XXX( or el.bw.XXX( -- those are handle calls
      var API_REF = /(?<![.\w])bw\.([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g;
      for (var ai = 0; ai < lines.length; ai++) {
        if (ig.ignored[ai]) continue;
        var aline = lines[ai];
        API_REF.lastIndex = 0;
        var am;
        while ((am = API_REF.exec(aline)) !== null) {
          var name = am[1];
          // Skip private/internal names (underscore prefix)
          if (name.charAt(0) === '_') continue;
          // Skip generic naming patterns (bw.makeXxx, bw.XXX as convention)
          if (/[Xx]{2}|[A-Z]{3}/.test(name)) continue;
          if (!PUBLIC_API.has(name)) {
            // Skip if the line is clearly explaining removal/history
            if (/removed|was removed|renamed|no longer|SUPERSEDED|deprecated|v2\.0|v1\.|No bw\./i.test(aline)) continue;
            // Skip changelog entries
            if (/CHANGELOG|## \[?\d+\.\d+/i.test(relPath)) continue;
            hits.push({
              file: relPath,
              line: ai + 1,
              rule: 'stale-api',
              message: 'bw.' + name + '() not found in public API',
              text: aline.trim().substring(0, 120)
            });
          }
        }
      }
    }
  }

  return hits;
}

// ── Main ─────────────────────────────────────────────────────────────

var allHits = [];
var fileCount = 0;
var pragmaErrors = [];
var pragmaWarnings = [];
var ignoreBlocks = [];

// Scan root-level files
for (var ri = 0; ri < SCAN_ROOT_FILES.length; ri++) {
  var rootFile = resolve(ROOT, SCAN_ROOT_FILES[ri]);
  var rootContent;
  try {
    rootContent = readFileSync(rootFile, 'utf8');
  } catch (_) { continue; }
  fileCount++;
  var rootHits = scanFile(rootFile, rootContent);
  allHits = allHits.concat(rootHits);
}

// Scan directories
for (var di = 0; di < SCAN_DIRS.length; di++) {
  var dir = resolve(ROOT, SCAN_DIRS[di]);
  var files = collectFiles(dir);
  for (var fi = 0; fi < files.length; fi++) {
    fileCount++;
    var content;
    try {
      content = readFileSync(files[fi], 'utf8');
    } catch (_) { continue; }
    var hits = scanFile(files[fi], content);
    allHits = allHits.concat(hits);
  }
}

// ── Report ───────────────────────────────────────────────────────────

if (pragmaErrors.length > 0) {
  console.log('drift-lint: malformed ignore pragma(s):\n');
  for (var pe = 0; pe < pragmaErrors.length; pe++) {
    console.log('  ' + pragmaErrors[pe]);
  }
  console.log('');
  process.exit(1);
}

if (pragmaWarnings.length > 0) {
  console.log('drift-lint: warning — ' + pragmaWarnings.length + ' ignore block(s) without a reason:\n');
  for (var pw = 0; pw < pragmaWarnings.length; pw++) {
    console.log('  ' + pragmaWarnings[pw]);
  }
  console.log('');
}

if (VERBOSE && ignoreBlocks.length > 0) {
  console.log('drift-lint: honored ignore blocks:');
  for (var ib = 0; ib < ignoreBlocks.length; ib++) {
    var b = ignoreBlocks[ib];
    console.log('  ' + b.file + ' L' + b.from + '-' + b.to + ' — ' + b.reason);
  }
  console.log('');
}

if (VERBOSE && Object.keys(configExclude).length > 0) {
  console.log('drift-lint: config excludes (.drift-lint-config.json):');
  var ceKeys = Object.keys(configExclude);
  for (var ck = 0; ck < ceKeys.length; ck++) {
    var ruleId = ceKeys[ck];
    var paths = configExclude[ruleId];
    for (var cp = 0; cp < paths.length; cp++) {
      console.log('  [' + ruleId + '] ' + paths[cp]);
    }
  }
  console.log('');
}

var ignoreNote = ignoreBlocks.length > 0
  ? ' (' + ignoreBlocks.length + ' ignore block' + (ignoreBlocks.length === 1 ? '' : 's') + ' honored)'
  : '';

if (allHits.length === 0) {
  console.log('drift-lint: ' + fileCount + ' files scanned, 0 stale patterns found' + ignoreNote + '.');
  process.exit(0);
} else {
  console.log('drift-lint: ' + fileCount + ' files scanned, ' + allHits.length + ' stale pattern(s) found:\n');
  var byFile = {};
  for (var i = 0; i < allHits.length; i++) {
    var h = allHits[i];
    if (!byFile[h.file]) byFile[h.file] = [];
    byFile[h.file].push(h);
  }
  var fileKeys = Object.keys(byFile).sort();
  for (var fk = 0; fk < fileKeys.length; fk++) {
    var fname = fileKeys[fk];
    console.log('  ' + fname);
    var fhits = byFile[fname];
    for (var hi = 0; hi < fhits.length; hi++) {
      var hit = fhits[hi];
      console.log('    L' + hit.line + ': [' + hit.rule + '] ' + hit.message);
      console.log('      ' + hit.text);
    }
    console.log('');
  }
  process.exit(1);
}
