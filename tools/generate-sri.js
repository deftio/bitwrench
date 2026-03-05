#!/usr/bin/env node
/**
 * Generate SRI (Subresource Integrity) hashes for all dist files.
 *
 * Usage: node tools/generate-sri.js
 *
 * Reads all .js and .css files from dist/, computes SHA-384 hashes,
 * and writes dist/sri.json.
 */

import { createHash } from 'crypto';
import { readdirSync, readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = join(__dirname, '..', 'dist');
const outputPath = join(distDir, 'sri.json');

// Read package.json for version
const pkg = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf8'));

// Get distributable files (skip .map, builds.json, sri.json)
const files = readdirSync(distDir).filter(f => {
  if (f === 'builds.json' || f === 'sri.json') return false;
  if (f.endsWith('.map')) return false;
  return f.endsWith('.js') || f.endsWith('.css');
});

// Hash each file
const hashes = {};
files.sort().forEach(file => {
  const content = readFileSync(join(distDir, file));
  const hash = createHash('sha384').update(content).digest('base64');
  hashes[file] = 'sha384-' + hash;
});

const manifest = {
  version: pkg.version,
  algorithm: 'sha384',
  generated: new Date().toISOString().split('T')[0],
  files: hashes
};

writeFileSync(outputPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');

// Summary
const count = Object.keys(hashes).length;
console.log('Generated dist/sri.json (' + count + ' files, SHA-384)');
console.log('');

// Print example script tag using the minified UMD build
const umdMin = hashes['bitwrench.umd.min.js'];
if (umdMin) {
  console.log('Example usage:');
  console.log('  <script src="dist/bitwrench.umd.min.js"');
  console.log('          integrity="' + umdMin + '"');
  console.log('          crossorigin="anonymous"></script>');
}

const css = hashes['bitwrench.css'];
if (css) {
  console.log('  <link rel="stylesheet" href="dist/bitwrench.css"');
  console.log('        integrity="' + css + '"');
  console.log('        crossorigin="anonymous">');
}
