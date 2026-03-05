#!/usr/bin/env node
/**
 * Snapshot dist/ into releases/v2/ for archival.
 *
 * Usage: node tools/build-release.js
 *
 * Copies all .js and .css files from dist/ (excluding .map and builds.json)
 * into releases/v2/ and writes a VERSION.txt file.
 */

import { readFileSync, writeFileSync, readdirSync, mkdirSync, copyFileSync, rmSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const distDir = join(root, 'dist');
const releaseDir = join(root, 'releases', 'v2');

// Read version from package.json
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const version = pkg.version;

// Clean and recreate releases/v2/
rmSync(releaseDir, { recursive: true, force: true });
mkdirSync(releaseDir, { recursive: true });

// Copy distributable files (skip .map and builds.json)
const files = readdirSync(distDir).filter(f => {
  if (f === 'builds.json') return false;
  if (f.endsWith('.map')) return false;
  return f.endsWith('.js') || f.endsWith('.css');
});

for (const file of files) {
  copyFileSync(join(distDir, file), join(releaseDir, file));
}

// Write VERSION.txt
writeFileSync(join(releaseDir, 'VERSION.txt'), version + '\n', 'utf8');

// Summary
console.log(`Release snapshot: bitwrench v${version}`);
console.log(`Output: releases/v2/`);
console.log(`Files copied: ${files.length}`);
files.forEach(f => console.log(`  ${f}`));
