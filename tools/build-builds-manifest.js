#!/usr/bin/env node
/**
 * Build dist/builds.json — manifest of all distribution files with sizes.
 *
 * Usage: node tools/build-builds-manifest.js
 *
 * Scans dist/ for .js and .css files (skips .map and _sri.txt),
 * computes raw and gzipped byte sizes, and writes the manifest JSON.
 */

import { readdirSync, statSync, readFileSync, writeFileSync } from 'fs';
import { gzipSync } from 'zlib';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = join(__dirname, '..', 'dist');
const outputPath = join(distDir, 'builds.json');

// Read package.json for version
const pkg = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf8'));

// Get all distributable files (skip .map and _sri.txt)
const allFiles = readdirSync(distDir).filter(f => {
  if (f === 'builds.json') return false;
  if (f.endsWith('.map')) return false;
  if (f.endsWith('_sri.txt')) return false;
  return f.endsWith('.js') || f.endsWith('.css');
});

// Determine which files have source maps
const mapFiles = new Set(readdirSync(distDir).filter(f => f.endsWith('.map')));

const files = allFiles.map(file => {
  const filePath = join(distDir, file);
  const raw = statSync(filePath).size;
  const gzipped = gzipSync(readFileSync(filePath)).length;

  // Determine format
  let format = 'Unknown';
  if (file.endsWith('.css')) {
    format = 'CSS';
  } else if (file.includes('.es5.')) {
    format = 'ES5 (UMD)';
  } else if (file.includes('.esm.')) {
    format = 'ESM';
  } else if (file.includes('.cjs.')) {
    format = 'CJS';
  } else if (file.includes('.umd.')) {
    format = 'UMD';
  }

  const ver = '2.x';

  // Minified?
  const minified = file.includes('.min.');

  // Source map?
  const sourceMap = mapFiles.has(file + '.map');

  return { file, format, ver, minified, raw, gzipped, sourceMap };
});

// Sort: by format, then non-min before min
files.sort((a, b) => {
  if (a.format !== b.format) return a.format.localeCompare(b.format);
  if (a.minified !== b.minified) return a.minified ? 1 : -1;
  return a.file.localeCompare(b.file);
});

const manifest = {
  version: pkg.version,
  buildDate: new Date().toISOString().split('T')[0],
  files
};

writeFileSync(outputPath, JSON.stringify(manifest, null, 2), 'utf8');
console.log('Generated dist/builds.json (' + files.length + ' files)');
