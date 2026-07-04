#!/usr/bin/env node

/**
 * drift-lint.js — Scan release-facing files for stale v2.0 patterns.
 *
 * Catches drift between what the code does and what docs/examples/pages
 * say it does. Two rule kinds:
 *   - name rules:       a token that should no longer appear (e.g. a removed API)
 *   - structural rules: an anti-pattern shape — anchor on one line, evidence
 *                       within the next few lines (rule.followedBy / rule.within)
 *
 * Ignore pragma (any comment style — //, #, <!-- -->):
 *   drift-lint:ignore-start: reason for the exemption
 *   ...exempt lines...
 *   drift-lint:ignore-end
 * A missing reason warns (doesn't fail — hotfixes shouldn't be blocked on
 * prose, but please add one). Unclosed/unmatched pragmas fail the run.
 *
 * Usage:
 *   npm run lint:drift                # scan all release-facing dirs
 *   node tools/drift-lint.js --verbose  # also list honored ignore blocks
 *
 * Exit code:  0 = clean,  1 = stale patterns found (or malformed pragmas)
 *
 * Full documentation: docs/drift-lint.md
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { resolve, relative, extname } from 'path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

var __dirname = dirname(fileURLToPath(import.meta.url));
var ROOT = resolve(__dirname, '..');

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
    id: 'client.query',
    pattern: /client\.query\s*\(/g,
    message: 'client.query() removed in v2.1'
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
      /Coming from React|React\/Vue|vs React|compared to|React-style|framework comparison/i,  // comparative content OK
      /SUPERSEDED|removed|was reactive/i,  // explaining the change
      /not reactive|non-reactive|isn.t reactive|without reactive|explicit.not.reactive/i,  // negations OK
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
  }
];

// ── File collection ──────────────────────────────────────────────────

var SCAN_DIRS = ['docs', 'pages', 'examples', 'embedded_python'];
// readme.html is generated from README.md — scanning it catches "README fixed
// but build:readme not re-run", which is itself a form of drift.
var SCAN_ROOT_FILES = ['README.md', 'CONTRIBUTING.md', 'ABOUT.md', 'readme.html'];
var SCAN_EXTS = new Set(['.md', '.html', '.js', '.py', '.sh', '.ts']);
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
  return hits;
}

// ── Main ─────────────────────────────────────────────────────────────

var allHits = [];
var fileCount = 0;
var pragmaErrors = [];
var pragmaWarnings = [];
var ignoreBlocks = [];
var VERBOSE = process.argv.indexOf('--verbose') !== -1;

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
