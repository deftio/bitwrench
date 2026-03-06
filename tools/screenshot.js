#!/usr/bin/env node

/**
 * Screenshot capture tool for bitwrench pages.
 *
 * Captures full-page screenshots in light and dark themes using Playwright,
 * with optional pixel-diff against a previous capture.
 *
 * Usage:
 *   node tools/screenshot.js                          # all pages, both themes
 *   node tools/screenshot.js pages/09-builds.html     # single page
 *   node tools/screenshot.js --theme light            # light only
 *   node tools/screenshot.js --viewport 1280x800,375x667
 *   node tools/screenshot.js --diff                   # diff against latest
 *   node tools/screenshot.js --diff .feedback/screenshots/2026-03-02T14-30-00
 *
 * Copyright (c) 2026 M. A. Chatterjee, BSD-2-Clause.
 */

'use strict';

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

// ── Defaults ────────────────────────────────────────────────────────────────

const DEFAULTS = {
  port: 9903,
  themes: ['light', 'dark'],
  outDir: '.feedback/screenshots',
  viewports: [{ w: 1280, h: 800, label: '1280x800' }],
};

// Discover all pages dynamically from pages/*.html
function discoverPages() {
  var pagesDir = path.join(__dirname, '..', 'pages');
  var files = [];
  try {
    files = fs.readdirSync(pagesDir)
      .filter(function(f) { return f.endsWith('.html'); })
      .sort()
      .map(function(f) { return 'pages/' + f; });
  } catch (e) {
    // fallback if pages dir doesn't exist
  }
  // Always include root index.html first
  return ['index.html'].concat(files);
}

var ALL_PAGES = discoverPages();

// ── Argument parsing ────────────────────────────────────────────────────────

function parseArgs(argv) {
  var args = argv.slice(2);
  var opts = {
    port: DEFAULTS.port,
    themes: DEFAULTS.themes.slice(),
    outDir: DEFAULTS.outDir,
    viewports: DEFAULTS.viewports.slice(),
    timestamp: true,
    diff: null,      // path string, or true for "latest"
    pages: [],
  };

  for (var i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--port':
        opts.port = parseInt(args[++i], 10);
        break;
      case '--theme':
        var val = args[++i];
        opts.themes = val === 'both' ? ['light', 'dark'] : val.split(',').map(function(t) { return t.trim(); });
        break;
      case '--out':
        opts.outDir = args[++i];
        break;
      case '--viewport':
        opts.viewports = args[++i].split(',').map(function(v) {
          var parts = v.trim().split('x').map(Number);
          return { w: parts[0], h: parts[1], label: parts[0] + 'x' + parts[1] };
        });
        break;
      case '--diff':
        // --diff without value or --diff <path>
        if (i + 1 < args.length && !args[i + 1].startsWith('--')) {
          opts.diff = args[++i];
        } else {
          opts.diff = true;  // auto-detect latest
        }
        break;
      case '--no-timestamp':
        opts.timestamp = false;
        break;
      case '--all':
        break;  // same as default
      case '--help': case '-h':
        printUsage();
        process.exit(0);
        break;
      default:
        if (!args[i].startsWith('--')) {
          opts.pages.push(args[i]);
        }
        break;
    }
  }

  if (opts.pages.length === 0) {
    opts.pages = ALL_PAGES.slice();
  }

  return opts;
}

function printUsage() {
  console.log([
    '',
    'Usage: node tools/screenshot.js [options] [page...]',
    '',
    'Capture screenshots of bitwrench pages for visual review.',
    '',
    'Pages:',
    '  Specify paths relative to site root (e.g. pages/09-builds.html)',
    '  or full URLs (e.g. http://localhost:9903/pages/09-builds.html).',
    '  With no pages given, captures all ' + ALL_PAGES.length + ' site pages.',
    '',
    'Options:',
    '  --port <n>           Server port (default: ' + DEFAULTS.port + ')',
    '  --theme <t>          light, dark, or both (default: both)',
    '  --out <dir>          Output base directory (default: ' + DEFAULTS.outDir + ')',
    '  --viewport <sizes>   Comma-separated WxH (default: 1280x800)',
    '  --diff [dir]         Compare against previous capture (omit dir for latest)',
    '  --no-timestamp       Don\'t create a timestamped subdirectory',
    '  --all                Capture all pages (default when none specified)',
    '  -h, --help           Show this help',
    '',
    'Examples:',
    '  node tools/screenshot.js                              # all pages, both themes',
    '  node tools/screenshot.js pages/09-builds.html         # single page',
    '  node tools/screenshot.js --theme light --no-timestamp # light only, flat dir',
    '  node tools/screenshot.js --viewport 1280x800,375x667  # desktop + mobile',
    '  node tools/screenshot.js --diff                       # capture + diff vs latest',
    '',
  ].join('\n'));
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function makeTimestamp() {
  return new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
}

function pageToFilename(pagePath) {
  // Strip leading slash, extract basename without extension
  var clean = pagePath.replace(/^\/+/, '');
  return path.basename(clean, '.html') || clean;
}

/**
 * Find the most recent timestamped subdirectory in outDir that is NOT currentDir.
 */
function findLatestCapture(baseDir, currentDir) {
  if (!fs.existsSync(baseDir)) return null;
  var entries = fs.readdirSync(baseDir, { withFileTypes: true });
  var dirs = entries
    .filter(function(e) { return e.isDirectory(); })
    .map(function(e) { return e.name; })
    .filter(function(name) { return /^\d{4}-\d{2}-\d{2}T/.test(name); })
    .filter(function(name) { return path.join(baseDir, name) !== currentDir; })
    .sort()
    .reverse();
  return dirs.length > 0 ? path.join(baseDir, dirs[0]) : null;
}

// ── Screenshot capture ──────────────────────────────────────────────────────

async function captureScreenshot(page, url, theme, viewport, outDir) {
  await page.setViewportSize({ width: viewport.w, height: viewport.h });
  await page.goto(url, { waitUntil: 'networkidle', timeout: 20000 });

  // Apply theme
  if (theme === 'dark') {
    await page.evaluate(function() {
      document.documentElement.setAttribute('data-theme', 'dark');
    });
  } else {
    await page.evaluate(function() {
      document.documentElement.removeAttribute('data-theme');
    });
  }
  // Let CSS transitions and JS rendering settle
  await page.waitForTimeout(400);

  var urlObj = new URL(url);
  var name = pageToFilename(urlObj.pathname);
  var filename = name + '-' + theme + '-' + viewport.label + '.png';
  var filepath = path.join(outDir, filename);

  await page.screenshot({ path: filepath, fullPage: true });
  return { filename: filename, filepath: filepath };
}

// ── Pixel diff ──────────────────────────────────────────────────────────────

async function diffScreenshots(currentDir, previousDir) {
  var pixelmatch, PNG;
  try {
    pixelmatch = require('pixelmatch');
    PNG = require('pngjs').PNG;
  } catch (e) {
    console.error('  pixelmatch or pngjs not installed. Run: npm install --save-dev pixelmatch pngjs');
    return [];
  }

  var diffDir = path.join(currentDir, 'diffs');
  fs.mkdirSync(diffDir, { recursive: true });

  var currentFiles = fs.readdirSync(currentDir).filter(function(f) { return f.endsWith('.png'); });
  var previousFiles = fs.readdirSync(previousDir).filter(function(f) { return f.endsWith('.png'); });
  var previousSet = {};
  previousFiles.forEach(function(f) { previousSet[f] = true; });

  var results = [];

  for (var ci = 0; ci < currentFiles.length; ci++) {
    var file = currentFiles[ci];
    if (!previousSet[file]) {
      results.push({ file: file, status: 'new' });
      continue;
    }

    var img1Data = fs.readFileSync(path.join(previousDir, file));
    var img2Data = fs.readFileSync(path.join(currentDir, file));

    var img1 = PNG.sync.read(img1Data);
    var img2 = PNG.sync.read(img2Data);

    // Use the larger dimensions for comparison
    var width = Math.max(img1.width, img2.width);
    var height = Math.max(img1.height, img2.height);

    // Pad image data to common size (transparent fill)
    function padImage(img, w, h) {
      if (img.width === w && img.height === h) return img.data;
      var padded = Buffer.alloc(w * h * 4, 0);
      for (var y = 0; y < img.height && y < h; y++) {
        var srcStart = y * img.width * 4;
        var srcEnd = srcStart + Math.min(img.width, w) * 4;
        var dstStart = y * w * 4;
        img.data.copy(padded, dstStart, srcStart, srcEnd);
      }
      return padded;
    }

    var data1 = padImage(img1, width, height);
    var data2 = padImage(img2, width, height);

    var diff = new PNG({ width: width, height: height });
    var numDiffPixels = pixelmatch(data1, data2, diff.data, width, height, {
      threshold: 0.1,
    });

    if (numDiffPixels > 0) {
      var totalPixels = width * height;
      var pct = ((numDiffPixels / totalPixels) * 100).toFixed(2);
      var diffFile = 'diff-' + file;
      fs.writeFileSync(path.join(diffDir, diffFile), PNG.sync.write(diff));
      results.push({ file: file, status: 'changed', diffPixels: numDiffPixels, pct: pct, diffFile: diffFile });
    } else {
      results.push({ file: file, status: 'identical' });
    }
  }

  // Detect deleted pages (present in previous but not current)
  for (var pi = 0; pi < previousFiles.length; pi++) {
    var pf = previousFiles[pi];
    if (currentFiles.indexOf(pf) === -1) {
      results.push({ file: pf, status: 'deleted' });
    }
  }

  return results;
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  var opts = parseArgs(process.argv);
  var baseUrl = 'http://localhost:' + opts.port;

  // Build output directory
  var outDir = path.resolve(opts.outDir);
  if (opts.timestamp) {
    outDir = path.join(outDir, makeTimestamp());
  }
  fs.mkdirSync(outDir, { recursive: true });

  console.log('Screenshot capture');
  console.log('  Server:    ' + baseUrl);
  console.log('  Pages:     ' + opts.pages.length);
  console.log('  Themes:    ' + opts.themes.join(', '));
  console.log('  Viewports: ' + opts.viewports.map(function(v) { return v.label; }).join(', '));
  console.log('  Output:    ' + outDir);
  console.log('');

  var browser = await chromium.launch();
  var context = await browser.newContext();
  var page = await context.newPage();

  var captured = [];
  var errors = [];
  var total = opts.pages.length * opts.themes.length * opts.viewports.length;
  var count = 0;

  for (var pi = 0; pi < opts.pages.length; pi++) {
    var pagePath = opts.pages[pi];
    // Support full URLs or relative paths
    var url = pagePath.startsWith('http') ? pagePath : baseUrl + '/' + pagePath;

    for (var vi = 0; vi < opts.viewports.length; vi++) {
      var viewport = opts.viewports[vi];

      for (var ti = 0; ti < opts.themes.length; ti++) {
        var theme = opts.themes[ti];
        count++;
        var progress = '[' + count + '/' + total + ']';

        try {
          var result = await captureScreenshot(page, url, theme, viewport, outDir);
          captured.push(result);
          console.log('  ' + progress + ' ok  ' + result.filename);
        } catch (err) {
          errors.push({ page: pagePath, theme: theme, viewport: viewport.label, error: err.message });
          console.error('  ' + progress + ' ERR ' + pagePath + ' (' + theme + ', ' + viewport.label + '): ' + err.message);
        }
      }
    }
  }

  await browser.close();

  // Write summary metadata
  var summary = {
    timestamp: new Date().toISOString(),
    baseUrl: baseUrl,
    port: opts.port,
    themes: opts.themes,
    viewports: opts.viewports,
    pages: opts.pages,
    captured: captured.map(function(c) { return c.filename; }),
    errors: errors,
  };
  fs.writeFileSync(path.join(outDir, 'summary.json'), JSON.stringify(summary, null, 2));

  console.log('');
  console.log('Captured ' + captured.length + '/' + total + ' screenshots -> ' + outDir);
  if (errors.length > 0) {
    console.log('Errors: ' + errors.length);
  }

  // ── Diff ──
  if (opts.diff) {
    var previousDir;
    if (opts.diff === true) {
      previousDir = findLatestCapture(path.resolve(opts.outDir), outDir);
      if (!previousDir) {
        console.log('\nNo previous capture found to diff against.');
        return;
      }
    } else {
      previousDir = path.resolve(opts.diff);
    }

    if (!fs.existsSync(previousDir)) {
      console.error('\nDiff target not found: ' + previousDir);
      process.exit(2);
    }

    console.log('\nComparing against: ' + previousDir);
    var diffResults = await diffScreenshots(outDir, previousDir);

    var changed = diffResults.filter(function(r) { return r.status === 'changed'; });
    var identical = diffResults.filter(function(r) { return r.status === 'identical'; });
    var newFiles = diffResults.filter(function(r) { return r.status === 'new'; });
    var deleted = diffResults.filter(function(r) { return r.status === 'deleted'; });

    if (changed.length > 0) {
      console.log('\n  Changed (' + changed.length + '):');
      changed.forEach(function(r) {
        console.log('    ' + r.file + ': ' + r.pct + '% different (' + r.diffPixels + ' px) -> diffs/' + r.diffFile);
      });
    }
    if (newFiles.length > 0) {
      console.log('\n  New (' + newFiles.length + '):');
      newFiles.forEach(function(r) { console.log('    ' + r.file); });
    }
    if (deleted.length > 0) {
      console.log('\n  Deleted (' + deleted.length + '):');
      deleted.forEach(function(r) { console.log('    ' + r.file); });
    }

    console.log('\n  Summary: ' + changed.length + ' changed, ' + identical.length + ' identical, ' +
      newFiles.length + ' new, ' + deleted.length + ' deleted');
  }
}

main().catch(function(err) {
  console.error('Fatal: ' + err.message);
  process.exit(1);
});
