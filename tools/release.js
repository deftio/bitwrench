#!/usr/bin/env node
/**
 * Bulletproof release script for bitwrench.
 *
 * Usage:  npm run release
 *         npm run release:dry     (or: npm run release -- --dry-run)
 *
 * Pre-conditions (done manually at start of dev cycle):
 *   npm version patch --no-git-tag-version
 *   npm run generate-version
 *   git commit -am "bump to vX.Y.Z" && git push
 *
 * This script validates, builds, tests, commits dist, and pushes.
 * CI then handles: git tag, GitHub Release, npm publish.
 *
 * --dry-run runs every gate (build, lint, tests, E2E, version consistency,
 * bundle budget, Docker clean-room) but performs NO mutations: no release
 * archive, no git commit, no merge, no push. Use it to rehearse a release.
 * Note that dist/ is still rebuilt, so the working tree will be dirty after.
 */

import { execSync } from 'child_process';
import { readFileSync, statSync, writeFileSync } from 'fs';
import { gzipSync } from 'zlib';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const argv = process.argv.slice(2);
const DRY_RUN = argv.includes('--dry-run') || argv.includes('-n');

// Minimum Node for the dev toolchain. c8 >=12 and mocha >=11 need require(esm),
// which landed in Node 22.12. This is a BUILD-time floor only -- the published
// library itself has no runtime dependencies and runs on far older engines.
const MIN_NODE = [22, 12, 0];

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

// In a dry run, describe the mutation instead of performing it.
function skipped(what) {
  console.log(`  ⤷ DRY RUN — skipped: ${what}`);
}

function ask(question) {
  while (true) {
    try {
      const answer = execSync(`/bin/sh -c 'printf "${question}" >&2 && read ans && echo "$ans"'`, {
        stdio: ['inherit', 'pipe', 'inherit'],
        encoding: 'utf8'
      }).trim().toLowerCase();
      if (answer === 'y' || answer === 'yes') return 'y';
      if (answer === 'n' || answer === 'no') return 'n';
      console.log('  Please answer y or n.');
    } catch {
      fail('Interactive terminal required for release confirmation.');
    }
  }
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

if (DRY_RUN) {
  console.log('  *** DRY RUN — all gates run, no mutations, nothing pushed ***');
}

// Node version floor. Without this, an old local Node fails deep inside the
// build with an opaque ERR_REQUIRE_ESM instead of a clear message here.
const nodeParts = process.versions.node.split('.').map(Number);
const nodeOk =
  nodeParts[0] > MIN_NODE[0] ||
  (nodeParts[0] === MIN_NODE[0] &&
    (nodeParts[1] > MIN_NODE[1] ||
      (nodeParts[1] === MIN_NODE[1] && nodeParts[2] >= MIN_NODE[2])));
if (!nodeOk) {
  fail(
    `Node ${process.versions.node} is too old for the build toolchain.\n` +
    `  Minimum: v${MIN_NODE.join('.')} (c8 and mocha need require(esm)).\n` +
    `  See .nvmrc — this repo builds on Node 24 (matches the CI matrix).\n` +
    `  brew:  brew install node@24 && export PATH="$(brew --prefix node@24)/bin:$PATH"\n` +
    `  nvm:   nvm use`
  );
}
console.log(`  Node:   ${process.versions.node}`);

const branch = runQuiet('git rev-parse --abbrev-ref HEAD');
if (branch === 'main' || branch === 'master') {
  fail(
    `Cannot release from ${branch} directly.\n` +
    `  Use: npm run start-release -- "feature name"\n` +
    `  Then develop on the feature branch and run npm run release there.`
  );
}
console.log(`  Branch: ${branch}`);

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

// CHANGELOG.md must have an entry for this version
const changelog = readFileSync(join(root, 'CHANGELOG.md'), 'utf8');
if (!changelog.match(new RegExp(`^## v${version.replace(/\./g, '\\.')}\\b`, 'm'))) {
  fail(
    `CHANGELOG.md has no entry for v${version}.\n` +
    `  Add a "## v${version}" section before releasing.`
  );
}

console.log('  ✓ Pre-flight passed: branch, clean tree, npm, changelog');

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

// E2E gate: containerized by default (Linux browsers, reproducible env).
// BW_E2E_NATIVE=1 npm run release  → use the native suite instead (e.g. no Docker).
if (process.env.BW_E2E_NATIVE === '1') {
  console.log('  Running E2E tests (native — BW_E2E_NATIVE=1)...');
  run('npm run test:e2e');
} else {
  console.log('  Running E2E tests (Docker gate)...');
  run('npm run test:e2e:docker');
}

console.log('  Running drift-lint...');
run('node tools/drift-lint.js');

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

// Embedded registry manifests at repo root (Arduino / PlatformIO / ESP-IDF)
const libProps = readFileSync(join(root, 'library.properties'), 'utf8');
const libPropsMatch = libProps.match(/^version=(.+)$/m);
const arduinoVersion = libPropsMatch ? libPropsMatch[1].trim() : null;

const libJson = JSON.parse(readFileSync(join(root, 'library.json'), 'utf8'));
const pioVersion = libJson.version;

const idfYml = readFileSync(join(root, 'idf_component.yml'), 'utf8');
const idfMatch = idfYml.match(/^version:\s*["']?([^"'\s]+)["']?/m);
const idfVersion = idfMatch ? idfMatch[1] : null;

if (
  pkgVersion !== srcVersion || pkgVersion !== distVersion ||
  pkgVersion !== arduinoVersion || pkgVersion !== pioVersion ||
  pkgVersion !== idfVersion
) {
  fail(
    `Version mismatch!\n` +
    `  package.json:       ${pkgVersion}\n` +
    `  src/version.js:     ${srcVersion}\n` +
    `  dist banner:        ${distVersion}\n` +
    `  library.properties: ${arduinoVersion}\n` +
    `  library.json:       ${pioVersion}\n` +
    `  idf_component.yml:  ${idfVersion}\n` +
    `  Run: npm run generate-version && npm run build\n` +
    `  Then bump the version line in library.properties, library.json,\n` +
    `  and idf_component.yml (repo root) to match package.json.`
  );
}
console.log(`  ✓ All sources agree: v${pkgVersion}`);

// ── 6. Bundle size gate ─────────────────────────────────────────────────

step('6. Bundle size check');

const rawSize = fileSize('dist/bitwrench.umd.js');
const minSize = fileSize('dist/bitwrench.umd.min.js');
const gzipped = gzSize('dist/bitwrench.umd.min.js');

const esmMinSize = fileSize('dist/bitwrench.esm.min.js');
const esmGzipped = gzSize('dist/bitwrench.esm.min.js');

console.log(`  UMD: ${kb(rawSize)} raw | ${kb(minSize)} min | ${kb(gzipped)} gzipped`);
console.log(`  ESM: ${kb(esmMinSize)} min | ${kb(esmGzipped)} gzipped`);

const BUDGET = 45 * 1024; // 45KB
if (gzipped > BUDGET) {
  fail(`UMD gzipped bundle (${kb(gzipped)}) exceeds 45KB budget!`);
}
if (esmGzipped > BUDGET) {
  fail(`ESM gzipped bundle (${kb(esmGzipped)}) exceeds 45KB budget!`);
}
console.log('  ✓ UMD + ESM both under 45KB budget');

// ── 7. Docker clean-room install test ──────────────────────────────────

step('7. Docker clean-room test');

// Probe for Docker separately from running the test. Folding the two together
// meant any test failure was misread as "Docker missing" -- the failed command
// string contains the word "docker", so the old substring check always matched
// and a genuinely broken gate reported itself as merely skipped.
let dockerAvailable = true;
try {
  runQuiet('docker info');
} catch {
  dockerAvailable = false;
}

if (!dockerAvailable) {
  console.log('  ⚠ Docker not available — skipping clean-room test');
  console.log('    Install Docker to enable this gate');
} else {
  console.log('  Docker available — running clean-room install test');

  // Pack the tarball
  const packOut = runQuiet('npm pack --pack-destination tmp/');
  const tarball = packOut.split('\n').pop().trim();
  console.log(`  Packed: ${tarball}`);

  // Write the probes to real files rather than inlining them as `node -e`
  // inside an already-quoted `sh -c`. That nesting put double quotes inside
  // double quotes and the shell died on the first parenthesis.
  writeFileSync(join(root, 'tmp/cleanroom-cjs.cjs'), [
    "const bw = require('bitwrench');",
    "if (typeof bw.html !== 'function') { console.error('CJS: bw.html missing'); process.exit(1); }",
    "if (typeof bw.version !== 'string') { console.error('CJS: bw.version missing'); process.exit(1); }",
    "console.log('CJS OK: bitwrench v' + bw.version);",
    ''
  ].join('\n'));

  writeFileSync(join(root, 'tmp/cleanroom-esm.mjs'), [
    "import bw from 'bitwrench';",
    "if (typeof bw.html !== 'function') { console.error('ESM: bw.html missing'); process.exit(1); }",
    "if (typeof bw.version !== 'string') { console.error('ESM: bw.version missing'); process.exit(1); }",
    "console.log('ESM OK: bitwrench v' + bw.version);",
    ''
  ].join('\n'));

  // Single-quote the inner script so the outer double quotes stay balanced.
  // The probes must live beside node_modules: Node resolves bare specifiers
  // from the script's own directory upward, so running them from /pkg would
  // never find the package installed into /test.
  // Do NOT pipe the install through tail: a pipeline reports the exit status
  // of its LAST command, so a failed install was swallowed and only resurfaced
  // later as a baffling MODULE_NOT_FOUND from the probe. Let npm's own error
  // text through and let a non-zero status fail the step directly.
  const innerScript = [
    'mkdir /test && cd /test',
    'npm init -y > /dev/null 2>&1',
    `npm install /pkg/${tarball} --no-audit --no-fund --loglevel=error`,
    'cp /pkg/cleanroom-cjs.cjs /pkg/cleanroom-esm.mjs /test/',
    'node /test/cleanroom-cjs.cjs',
    'node /test/cleanroom-esm.mjs'
  ].join(' && ');

  const dockerCmd = [
    'docker run --rm',
    `-v "${join(root, 'tmp')}:/pkg"`,
    'node:22-slim',
    `sh -c '${innerScript}'`
  ].join(' ');

  try {
    run(dockerCmd);
  } catch (e) {
    fail('Docker clean-room install test failed: ' + e.message);
  }
  console.log('  ✓ Clean-room install: CJS + ESM verified');
}

// ── 8. Archive release snapshot ─────────────────────────────────────────

step('8. Archive release snapshot');

if (DRY_RUN) {
  skipped('node tools/build-release.js (would archive to releases/v2/)');
} else {
  run('node tools/build-release.js');
}

// ── 9. Git commit and push ──────────────────────────────────────────────

step('9. Git commit and push');

if (DRY_RUN) {
  const wouldStage = runQuiet('git status --porcelain')
    .split('\n').filter(l => l.trim() !== '');
  console.log(`  Would stage ${wouldStage.length} file(s) and commit "v${version} release"`);
  skipped('git add . && git commit');
} else {
  // Stage all build outputs — tree was verified clean in step 1,
  // so everything modified since then is a build artifact.
  run('git add .');

  // Check if there's anything to commit
  const staged = runQuiet('git diff --cached --name-only');
  if (staged.length === 0) {
    console.log('  Nothing to commit — dist is already up to date');
  } else {
    console.log(`  Staging: ${staged.split('\n').length} files`);
    run(`git commit -m "v${version} release"`);
  }
}

// ── 10. Merge to main ───────────────────────────────────────────────────

step('10. Merge to main');

// Derive description from branch name: feature/lifecycle-refactor -> lifecycle refactor
const branchDesc = branch
  .replace(/^feature\//, '')
  .replace(/[-_]/g, ' ');
const mergeMsg = `v${version}: ${branchDesc}`;

console.log(`
  All gates passed.
  Version:  ${version}
  Branch:   ${branch}
  Bundle:   ${kb(rawSize)} raw | ${kb(minSize)} min | ${kb(gzipped)} gzipped

  Ready to squash-merge to main and push.
  Commit message: "${mergeMsg}"
`);

if (DRY_RUN) {
  skipped(`git merge --squash ${branch} && git commit && git push origin main`);
  step('Dry run complete');
  console.log(`
  Every gate passed. NOTHING was archived, committed, merged, or pushed.

  A real release would now:
    1. Archive a snapshot to releases/v2/
    2. Commit dist artifacts as "v${version} release"
    3. Squash-merge ${branch} -> main as "${mergeMsg}"
    4. Push main, after which CI tags, releases, and publishes to npm

  dist/ was rebuilt, so your working tree is dirty. That is expected.
  When you are ready:  npm run release
`);
  process.exit(0);
}

const answer = ask('Squash-merge to main and push? (y/n) ');

if (answer === 'n') {
  console.log(`
  Skipped. You can merge manually later:
    git checkout main && git merge --squash ${branch}
    git commit -m "${mergeMsg}"
    git push origin main
`);
  process.exit(0);
}

try {
  run('git checkout main');
  run('git pull --ff-only origin main');
  run(`git merge --squash ${branch}`);
  run(`git commit -m "${mergeMsg}"`);
  execSync('git push origin main', {
    cwd: root,
    stdio: 'inherit',
    env: { ...process.env, BW_RELEASE_PUSH: '1' }
  });
  console.log('\n  → git push origin main (BW_RELEASE_PUSH=1)');
} catch (e) {
  console.error(`\n✗ Merge/push failed. You are now on main with a partial merge.`);
  console.error(`  Inspect the state, then either:`);
  console.error(`    git merge --abort   (undo and go back)`);
  console.error(`    git checkout ${branch}   (return to feature branch)`);
  process.exit(1);
}

// Return to feature branch
try { runQuiet(`git checkout ${branch}`); } catch { /* stay on main if checkout fails */ }

// ── Done ────────────────────────────────────────────────────────────────

step('Done!');

console.log(`
  Version:  ${version}
  Bundle:   ${kb(rawSize)} raw | ${kb(minSize)} min | ${kb(gzipped)} gzipped

  Pushed to main. CI will:
    - Run tests on Node 22/24
    - Create git tag v${version}
    - Create GitHub Release with dist assets
    - Publish to npm with provenance

  Watch CI: https://github.com/deftio/bitwrench/actions
`);
