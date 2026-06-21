#!/usr/bin/env node

/**
 * drift-lint.js — Scan release-facing files for stale v2.0 patterns.
 *
 * Usage:
 *   node tools/drift-lint.js          # scan all release-facing dirs
 *   node tools/drift-lint.js --fix    # (future) auto-fix simple renames
 *
 * Exit code:  0 = clean,  1 = stale patterns found
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
  }
];

// ── File collection ──────────────────────────────────────────────────

var SCAN_DIRS = ['docs', 'pages', 'examples', 'embedded_python'];
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

// ── Scan ─────────────────────────────────────────────────────────────

function scanFile(filePath, content) {
  var hits = [];
  var lines = content.split('\n');

  for (var li = 0; li < lines.length; li++) {
    var line = lines[li];
    for (var ri = 0; ri < RULES.length; ri++) {
      var rule = RULES[ri];
      rule.pattern.lastIndex = 0;
      if (rule.pattern.test(line)) {
        // Check context exclusions
        var excluded = false;
        if (rule.contextExclude) {
          for (var ci = 0; ci < rule.contextExclude.length; ci++) {
            if (rule.contextExclude[ci].test(line)) {
              excluded = true;
              break;
            }
          }
        }
        if (!excluded) {
          hits.push({
            file: relative(ROOT, filePath),
            line: li + 1,
            rule: rule.id,
            message: rule.message,
            text: line.trim().substring(0, 120)
          });
        }
      }
    }
  }
  return hits;
}

// ── Main ─────────────────────────────────────────────────────────────

var allHits = [];
var fileCount = 0;

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

if (allHits.length === 0) {
  console.log('drift-lint: ' + fileCount + ' files scanned, 0 stale patterns found.');
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
