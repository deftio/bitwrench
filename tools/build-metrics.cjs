#!/usr/bin/env node
/**
 * build-metrics.js — Captures per-file source metrics and bundle sizes.
 *
 * Appends one JSONL record to dbg/build-metrics.jsonl on every invocation.
 * Each record contains:
 *   - Per source file: lines, bytes, minified bytes (comments stripped), gzip of minified
 *   - Per dist bundle: bytes, gzip bytes
 *   - Totals + version + git hash + timestamp
 *
 * Usage:  node tools/build-metrics.js
 */

var fs = require('fs');
var path = require('path');
var zlib = require('zlib');
var childProcess = require('child_process');

var ROOT = path.resolve(__dirname, '..');
var DBG_DIR = path.join(ROOT, 'dbg');
var JSONL_PATH = path.join(DBG_DIR, 'build-metrics.jsonl');

// Source files to measure (relative to src/)
var SOURCE_FILES = [
  // category: 'library' = ships in dist bundles (size-constrained)
  //           'cli'     = Node CLI tool (no size constraint)
  //           'vendor'  = third-party vendored code
  //           'tool'    = build-time tooling (not shipped)
  { file: 'bitwrench.js',               purpose: 'Core library',                         category: 'library' },
  { file: 'bitwrench-bccl.js',          purpose: 'BCCL component factories',             category: 'library' },
  { file: 'bitwrench-styles.js',        purpose: 'CSS generation (structural + themed)', category: 'library' },
  { file: 'bitwrench-utils.js',         purpose: 'Pure utility functions',               category: 'library' },
  { file: 'bitwrench-color-utils.js',   purpose: 'Color math utilities',                 category: 'library' },
  { file: 'bitwrench-file-ops.js',     purpose: 'File I/O (save/load)',                 category: 'library' },
  { file: 'bitwrench-code-edit.js',     purpose: 'Code editor component',                category: 'library' },
  { file: 'bitwrench-components-stub.js', purpose: 'Lean build stub',                    category: 'library' },
  { file: 'bitwrench-lean.js',          purpose: 'Lean bundle entry',                    category: 'library' },
  { file: 'version.js',                 purpose: 'Version constant',                     category: 'library' },
  { file: 'generate-css.js',            purpose: 'CSS build tool',                       category: 'tool' },
  { file: 'cli/index.js',               purpose: 'CLI entry point',                      category: 'cli' },
  { file: 'cli/convert.js',             purpose: 'CLI file conversion',                  category: 'cli' },
  { file: 'cli/inject.js',              purpose: 'CLI bitwrench injection',              category: 'cli' },
  { file: 'cli/layout-default.js',      purpose: 'CLI page layout',                      category: 'cli' },
  { file: 'vendor/quikdown.js',         purpose: 'Vendored markdown parser',             category: 'vendor' }
];

// Dist bundles to measure (the important ones — min + non-min for each format)
var BUNDLE_FILES = [
  'bitwrench.umd.js',
  'bitwrench.umd.min.js',
  'bitwrench.esm.js',
  'bitwrench.esm.min.js',
  'bitwrench.cjs.js',
  'bitwrench.cjs.min.js',
  'bitwrench.es5.js',
  'bitwrench.es5.min.js',
  'bitwrench-lean.umd.js',
  'bitwrench-lean.umd.min.js',
  'bitwrench-lean.esm.js',
  'bitwrench-lean.esm.min.js',
  'bitwrench-lean.cjs.js',
  'bitwrench-lean.cjs.min.js',
  'bitwrench-lean.es5.js',
  'bitwrench-lean.es5.min.js',
  'bitwrench-code-edit.umd.js',
  'bitwrench-code-edit.umd.min.js',
  'bitwrench-bccl.umd.js',
  'bitwrench-bccl.umd.min.js',
  'bitwrench-bccl.esm.js',
  'bitwrench-bccl.esm.min.js',
  'bitwrench-bccl.cjs.js',
  'bitwrench-bccl.cjs.min.js',
  'bwserve.cjs.js',
  'bwserve.esm.js',
  'bitwrench.css'
];

function gzipSize(buf) {
  return zlib.gzipSync(buf, { level: 9 }).length;
}

function countLines(str) {
  if (!str) return 0;
  return str.split('\n').length;
}

function getGitHash() {
  try {
    return childProcess.execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim();
  } catch (e) {
    return 'unknown';
  }
}

function getGitBranch() {
  try {
    return childProcess.execSync('git rev-parse --abbrev-ref HEAD', { cwd: ROOT }).toString().trim();
  } catch (e) {
    return 'unknown';
  }
}

async function minifySource(code) {
  // Use terser to strip comments and minify — shows actual code weight
  try {
    var terser = require('terser');
    var result = await terser.minify(code, {
      compress: false,    // no transforms — just strip comments + whitespace
      mangle: false,      // keep variable names readable
      output: { comments: false }
    });
    return result.code || '';
  } catch (e) {
    // If terser chokes (e.g. on non-JS), return original
    return code;
  }
}

async function main() {
  var pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
  var version = pkg.version;
  var gitHash = getGitHash();
  var gitBranch = getGitBranch();
  var timestamp = new Date().toISOString();

  // Measure source files
  var sources = [];
  var totalLines = 0;
  var totalBytes = 0;
  var totalMinBytes = 0;
  var totalGzipBytes = 0;

  for (var i = 0; i < SOURCE_FILES.length; i++) {
    var entry = SOURCE_FILES[i];
    var filePath = path.join(ROOT, 'src', entry.file);
    var code;
    try {
      code = fs.readFileSync(filePath, 'utf8');
    } catch (e) {
      continue; // skip missing files
    }
    var buf = Buffer.from(code, 'utf8');
    var lines = countLines(code);
    var bytes = buf.length;

    var minCode = await minifySource(code);
    var minBuf = Buffer.from(minCode, 'utf8');
    var minBytes = minBuf.length;
    var minGzipBytes = gzipSize(minBuf);

    sources.push({
      file: entry.file,
      purpose: entry.purpose,
      category: entry.category || 'library',
      lines: lines,
      bytes: bytes,
      minBytes: minBytes,
      gzipBytes: minGzipBytes
    });

    totalLines += lines;
    totalBytes += bytes;
    totalMinBytes += minBytes;
    totalGzipBytes += minGzipBytes;
  }

  // Measure dist bundles
  var bundles = [];
  for (var j = 0; j < BUNDLE_FILES.length; j++) {
    var bundleFile = BUNDLE_FILES[j];
    var bundlePath = path.join(ROOT, 'dist', bundleFile);
    try {
      var bundleBuf = fs.readFileSync(bundlePath);
      bundles.push({
        file: bundleFile,
        bytes: bundleBuf.length,
        gzipBytes: gzipSize(bundleBuf)
      });
    } catch (e) {
      // skip missing bundles
    }
  }

  var record = {
    timestamp: timestamp,
    version: version,
    gitHash: gitHash,
    gitBranch: gitBranch,
    sources: sources,
    bundles: bundles,
    totals: {
      sourceFiles: sources.length,
      sourceLines: totalLines,
      sourceBytes: totalBytes,
      sourceMinBytes: totalMinBytes,
      sourceGzipBytes: totalGzipBytes,
      bundleCount: bundles.length
    }
  };

  // Ensure dbg/ exists
  if (!fs.existsSync(DBG_DIR)) {
    fs.mkdirSync(DBG_DIR, { recursive: true });
  }

  // Append JSONL
  fs.appendFileSync(JSONL_PATH, JSON.stringify(record) + '\n');

  // Print source analysis — library files only
  var libSources = sources.filter(function(s) { return s.category === 'library'; });

  // Skip trivial entries (stubs, entry points < 1KB minified)
  var substantive = libSources.filter(function(s) { return s.minBytes >= 1024; });
  var trivial = libSources.filter(function(s) { return s.minBytes < 1024; });

  var libMinBytes = 0;
  libSources.forEach(function(s) { libMinBytes += s.minBytes; });
  var libLines = 0, libBytes = 0, libGz = 0;
  libSources.forEach(function(s) { libLines += s.lines; libBytes += s.bytes; libGz += s.gzipBytes; });

  console.log('\n=== Source Analysis v' + version + ' (' + gitHash + ') ===\n');
  console.log(pad('File', 32) + pad('LOC', 7) + pad('Raw KB', 9) + pad('Min KB', 9) + pad('Gz KB', 8) + pad('% Code', 8));
  console.log('-'.repeat(73));

  substantive.forEach(function(s) {
    var pct = libMinBytes > 0 ? ((s.minBytes / libMinBytes) * 100).toFixed(1) + '%' : '0%';
    console.log(pad(s.file, 32) +
      pad(String(s.lines), 7) +
      pad((s.bytes / 1024).toFixed(1), 9) +
      pad((s.minBytes / 1024).toFixed(1), 9) +
      pad((s.gzipBytes / 1024).toFixed(1), 8) +
      pad(pct, 8));
  });

  console.log('-'.repeat(73));
  console.log(pad('TOTAL', 32) +
    pad(String(libLines), 7) +
    pad((libBytes / 1024).toFixed(1), 9) +
    pad((libMinBytes / 1024).toFixed(1), 9) +
    pad((libGz / 1024).toFixed(1), 8) +
    pad('100%', 8));

  if (trivial.length > 0) {
    var trivNames = trivial.map(function(s) { return s.file; }).join(', ');
    console.log('\n(omitted < 1KB: ' + trivNames + ')');
  }

  // Print dist bundle analysis — group by family, show only .min.js variants
  var minBundles = bundles.filter(function(b) {
    return b.file.indexOf('.min.') !== -1 || b.file === 'bitwrench.css';
  });

  if (minBundles.length > 0) {
    console.log('\n=== Dist Bundles v' + version + ' ===\n');
    console.log(pad('Bundle', 40) + pad('Raw KB', 10) + pad('Gz KB', 10) + pad('Status', 10));
    console.log('-'.repeat(70));

    minBundles.forEach(function(b) {
      var rawKB = (b.bytes / 1024).toFixed(1);
      var gzKB = (b.gzipBytes / 1024).toFixed(1);
      var status = '';
      // Flag if gzipped size exceeds 45KB budget (only for full bundle)
      if (b.file.indexOf('bitwrench.umd.min') === 0 || b.file.indexOf('bitwrench.esm.min') === 0) {
        status = b.gzipBytes <= 46080 ? 'OK' : 'OVER 45KB!';
      }
      console.log(pad(b.file, 40) + pad(rawKB, 10) + pad(gzKB, 10) + pad(status, 10));
    });

    console.log('-'.repeat(70));

    // Show non-minified sizes for reference
    var nonMin = bundles.filter(function(b) {
      return b.file.indexOf('.min.') === -1 && b.file !== 'bitwrench.css';
    });
    if (nonMin.length > 0) {
      console.log('\n(' + nonMin.length + ' non-minified bundles also generated, not shown)');
    }
  }

  console.log('\nAppended to ' + JSONL_PATH);
}

function pad(str, len) {
  str = String(str);
  while (str.length < len) str += ' ';
  return str;
}

main().catch(function(err) {
  console.error('build-metrics error:', err);
  process.exit(1);
});
