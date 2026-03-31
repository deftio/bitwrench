#!/usr/bin/env node
/**
 * Bulletproof release script for bitwrench.
 *
 * Usage:  npm run release
 *
 * Pre-conditions (done manually at start of dev cycle):
 *   npm version patch --no-git-tag-version
 *   npm run generate-version
 *   git commit -am "bump to vX.Y.Z" && git push
 *
 * This script validates, builds, tests, commits dist, and pushes.
 * CI then handles: git tag, GitHub Release, npm publish.
 */

import { execSync } from 'child_process';
import { readFileSync, statSync } from 'fs';
import { gzipSync } from 'zlib';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// ── Helpers ──────────────────────────────────────────────────────────────

function run(cmd, opts = {}) {
  console.log(`\n  → ${cmd}`);
  execSync(cmd, { cwd: root, stdio: 'inherit', ...opts });
}

function runQuiet(cmd) {
  return execSync(cmd, { cwd: root, encoding: 'utf8' }).trim();
}

function fail(msg) {
  console.error(`\n✗ RELEASE ABORTED: ${msg}\n`);
  process.exit(1);
}

function step(label) {
  console.log(`\n${'─'.repeat(60)}\n  ${label}\n${'─'.repeat(60)}`);
}

function fileSize(filePath) {
  return statSync(join(root, filePath)).size;
}

function gzSize(filePath) {
  const buf = readFileSync(join(root, filePath));
  return gzipSync(buf).length;
}

function kb(bytes) {
  return (bytes / 1024).toFixed(1) + 'KB';
}

// ── 1. Pre-flight checks ────────────────────────────────────────────────

step('1. Pre-flight checks');

// Warn if not on main — release runs on feature branches before merge
const branch = runQuiet('git rev-parse --abbrev-ref HEAD');
if (branch === 'main') {
  console.log(`  Branch: main`);
} else {
  console.log(`  ⚠ Branch: ${branch} (not main — remember to merge to main after release)`);
}

// Clean working tree (allow untracked in dev/)
const status = runQuiet('git status --porcelain');
const dirtyFiles = status
  .split('\n')
  .filter(l => l.trim() !== '')
  .filter(l => !l.trim().startsWith('?? dev/'));
if (dirtyFiles.length > 0) {
  fail(`Working tree has uncommitted changes:\n${dirtyFiles.join('\n')}`);
}

// node_modules must exist
try {
  statSync(join(root, 'node_modules'));
} catch {
  fail('node_modules not found — run npm install first');
}

// Check npm registry: current version must NOT be published yet
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const version = pkg.version;
console.log(`  Version: ${version}`);

try {
  const npmVersion = runQuiet(`npm view bitwrench@${version} version 2>/dev/null || true`);
  if (npmVersion === version) {
    fail(
      `v${version} is already published on npm.\n` +
      `  Did you forget to bump at the start of this dev cycle?\n` +
      `  Run: npm version patch --no-git-tag-version && npm run generate-version`
    );
  }
} catch {
  // npm view failed — version not on registry, which is what we want
}

console.log('  ✓ On main, clean tree, version not yet on npm');

// ── 2. Clean build ──────────────────────────────────────────────────────

step('2. Clean build');

run('npm run clean');
run('npm run build');
run('npm run build:generated');

// ── 3. Lint ─────────────────────────────────────────────────────────────

step('3. Lint');

run('npm run lint');

// ── 4. Tests ────────────────────────────────────────────────────────────

step('4. Tests');

run('npm test');
run('npm run test:cli');

// Update coverage badge in README from json-summary produced by npm test
run('node tools/update-coverage-badge.js');

// ── 5. Version consistency check ────────────────────────────────────────

step('5. Version consistency');

const pkgVersion = pkg.version;

const versionJs = readFileSync(join(root, 'src/version.js'), 'utf8');
const versionJsMatch = versionJs.match(/VERSION\s*=\s*'([^']+)'/);
const srcVersion = versionJsMatch ? versionJsMatch[1] : null;

const bannerLine = readFileSync(join(root, 'dist/bitwrench.umd.js'), 'utf8')
  .split('\n')[0];
const bannerMatch = bannerLine.match(/bitwrench v([^\s|]+)/);
const distVersion = bannerMatch ? bannerMatch[1] : null;

if (pkgVersion !== srcVersion || pkgVersion !== distVersion) {
  fail(
    `Version mismatch!\n` +
    `  package.json:     ${pkgVersion}\n` +
    `  src/version.js:   ${srcVersion}\n` +
    `  dist banner:      ${distVersion}\n` +
    `  Run: npm run generate-version && npm run build`
  );
}
console.log(`  ✓ All sources agree: v${pkgVersion}`);

// ── 6. Bundle size gate ─────────────────────────────────────────────────

step('6. Bundle size check');

const rawSize = fileSize('dist/bitwrench.umd.js');
const minSize = fileSize('dist/bitwrench.umd.min.js');
const gzipped = gzSize('dist/bitwrench.umd.min.js');

console.log(`  Bundle: ${kb(rawSize)} raw | ${kb(minSize)} min | ${kb(gzipped)} gzipped`);

const BUDGET = 45 * 1024; // 45KB
if (gzipped > BUDGET) {
  fail(`Gzipped bundle (${kb(gzipped)}) exceeds 45KB budget!`);
}
console.log('  ✓ Under 45KB budget');

// ── 7. Archive release snapshot ─────────────────────────────────────────

step('7. Archive release snapshot');

run('node tools/build-release.js');

// ── 8. Git commit and push ──────────────────────────────────────────────

step('8. Git commit and push');

const filesToStage = [
  'package.json',
  'src/version.js',
  'dist/',
  'releases/v2/',
  'readme.html',
  'pages/08-api-reference.html',
  'README.md'
];

// Stage only files that exist and have changes
for (const f of filesToStage) {
  try {
    run(`git add ${f}`, { stdio: 'pipe' });
  } catch {
    // file may not exist (e.g. readme.html), that's OK
  }
}

// Check if there's anything to commit
const staged = runQuiet('git diff --cached --name-only');
if (staged.length === 0) {
  console.log('  Nothing to commit — dist is already up to date');
} else {
  console.log(`  Staging: ${staged.split('\n').length} files`);
  run(`git commit -m "v${version} release"`);
}

// ── 9. Summary ──────────────────────────────────────────────────────────

step('Done!');

if (branch === 'main') {
  console.log(`
  Version:  ${version}
  Bundle:   ${kb(rawSize)} raw | ${kb(minSize)} min | ${kb(gzipped)} gzipped

  Committed on main. Push when ready — CI will:
    • Run tests on Node 20/22/24
    • Create git tag v${version}
    • Create GitHub Release with dist assets
    • Publish to npm with provenance

  Watch CI: https://github.com/deftio/bitwrench/actions
`);
} else {
  console.log(`
  Version:  ${version}
  Branch:   ${branch}
  Bundle:   ${kb(rawSize)} raw | ${kb(minSize)} min | ${kb(gzipped)} gzipped

  Committed on ${branch}. Next steps:
    git checkout main && git merge --squash ${branch} && git commit -m "v${version}: <description>" && git push origin main

  After push to main, CI will handle tagging + npm publish.
  Watch CI: https://github.com/deftio/bitwrench/actions
`);
}
