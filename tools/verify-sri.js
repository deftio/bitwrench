#!/usr/bin/env node
/**
 * Verify dist/sri.json against the bytes actually sitting in dist/.
 *
 * Usage: node tools/verify-sri.js
 *
 * This exists because the failure it catches is invisible by inspection.
 * `npm run build` rewrites the bundles (src/version.js carries a buildDate, so
 * every rebuild changes bitwrench and bitwrench-lean across all eight formats)
 * and then runs build:builds, which *copies* hashes out of sri.json rather than
 * computing them (tools/build-builds-manifest.js). If generate-sri has not run,
 * sri.json and builds.json end up agreeing with each other and disagreeing with
 * the files -- internally consistent and externally wrong, so nothing notices.
 *
 * A wrong integrity value is not a soft failure: pages/09-downloads.html and
 * pages/09-builds.html publish these for copy-paste, and a browser silently
 * refuses to execute a script whose hash does not match.
 *
 * Four things are checked:
 *   1. every hash in sri.json matches the file on disk
 *   2. every loadable file in dist/ appears in sri.json  (a new build target
 *      cannot quietly ship without an integrity hash)
 *   3. sri.json lists nothing that no longer exists
 *   4. builds.json integrity values agree with sri.json
 */

import { createHash } from 'crypto';
import { readdirSync, readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const distDir = join(root, 'dist');
const sriPath = join(distDir, 'sri.json');
const buildsPath = join(distDir, 'builds.json');

// Same rule as tools/generate-sri.js: subresources a browser can load.
// .map, .d.ts and the manifests are not subresources. .gz is excluded because
// SRI is computed over decompressed bytes, so hashing the archive is wrong.
function isLoadable(f) {
  if (f === 'builds.json' || f === 'sri.json') return false;
  if (f.endsWith('.map')) return false;
  return f.endsWith('.js') || f.endsWith('.cjs') || f.endsWith('.css');
}

function sha384(path) {
  return 'sha384-' + createHash('sha384').update(readFileSync(path)).digest('base64');
}

function fail(lines) {
  console.error('\n✗ SRI VERIFICATION FAILED\n');
  lines.forEach(l => console.error('  ' + l));
  console.error('\n  Fix: npm run generate-sri && npm run build:builds');
  console.error('  (or just: npm run cleanbuild)\n');
  process.exit(1);
}

if (!existsSync(distDir)) {
  console.log('verify-sri: no dist/ -- nothing to verify (run npm run build)');
  process.exit(0);
}

const distFiles = readdirSync(distDir).filter(isLoadable);

if (distFiles.length === 0) {
  console.log('verify-sri: dist/ has no loadable files -- nothing to verify');
  process.exit(0);
}

if (!existsSync(sriPath)) {
  fail([`dist/ has ${distFiles.length} loadable files but dist/sri.json is missing.`]);
}

const sri = JSON.parse(readFileSync(sriPath, 'utf8'));
const hashes = sri.files || {};
const problems = [];

// 1. hashes match the bytes on disk
let checked = 0;
for (const [file, expected] of Object.entries(hashes)) {
  const p = join(distDir, file);
  if (!existsSync(p)) {
    // reported as (3) below; skip here so it is not counted twice
    continue;
  }
  checked++;
  const actual = sha384(p);
  if (actual !== expected) {
    problems.push(`stale hash: ${file}`);
  }
}

// 2. nothing loadable is missing an entry
for (const f of distFiles) {
  if (!hashes[f]) problems.push(`no SRI entry: ${f}`);
}

// 3. no entries for files that are gone
for (const f of Object.keys(hashes)) {
  if (!existsSync(join(distDir, f))) problems.push(`entry for missing file: ${f}`);
}

// 4. builds.json copies from sri.json, so it can drift independently
let buildsChecked = 0;
if (existsSync(buildsPath)) {
  const builds = JSON.parse(readFileSync(buildsPath, 'utf8'));
  for (const entry of builds.files || []) {
    if (!entry.integrity) continue;
    buildsChecked++;
    if (hashes[entry.file] && entry.integrity !== hashes[entry.file]) {
      problems.push(`builds.json disagrees with sri.json: ${entry.file}`);
    }
  }
}

if (problems.length) {
  const shown = problems.slice(0, 12);
  if (problems.length > shown.length) {
    shown.push(`...and ${problems.length - shown.length} more`);
  }
  fail(shown);
}

console.log(
  `verify-sri: ${checked} hashes match, ${distFiles.length} loadable files covered, ` +
  `${buildsChecked} builds.json entries agree`
);
