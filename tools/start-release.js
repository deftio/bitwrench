#!/usr/bin/env node
/**
 * Start a new dev cycle: bump version, create feature branch, commit, push.
 *
 * Usage:
 *   npm run start-release -- "feature name"           # patch bump (default)
 *   npm run start-release -- patch "feature name"
 *   npm run start-release -- minor "new subsystem"
 *   npm run start-release -- major "breaking change"
 *
 * Creates:  feature/feature-name  branch
 * Commits:  "start vX.Y.Z: feature name"
 * Pushes:   with -u to set upstream
 *
 * After development, merge to main and run: npm run release
 */

import { execSync } from 'child_process';
import { statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// ── Helpers ──────────────────────────────────────────────────────────────

function run(cmd, opts = {}) {
  console.log(`  → ${cmd}`);
  execSync(cmd, { cwd: root, stdio: 'inherit', ...opts });
}

function runQuiet(cmd) {
  return execSync(cmd, { cwd: root, encoding: 'utf8' }).trim();
}

function fail(msg) {
  console.error(`\n✗ ABORTED: ${msg}\n`);
  process.exit(1);
}

function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

// ── Parse arguments ─────────────────────────────────────────────────────

const BUMP_LEVELS = ['patch', 'minor', 'major'];
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log(`
Usage: npm run start-release -- [patch|minor|major] "feature name"

Examples:
  npm run start-release -- "add dark mode"
  npm run start-release -- minor "pub/sub system"
  npm run start-release -- major "v3 rewrite"

Bump level defaults to patch if omitted.
`);
  process.exit(0);
}

let bumpLevel = 'patch';
let featureName;

if (BUMP_LEVELS.includes(args[0])) {
  bumpLevel = args[0];
  featureName = args.slice(1).join(' ');
} else {
  featureName = args.join(' ');
}

if (!featureName) {
  fail('Feature name is required.\n  Usage: npm run start-release -- "feature name"');
}

const branchSlug = slugify(featureName);
const branchName = `feature/${branchSlug}`;

console.log(`\n  Start release: ${bumpLevel} bump, branch: ${branchName}\n`);

// ── 1. Pre-flight checks ────────────────────────────────────────────────

const branch = runQuiet('git rev-parse --abbrev-ref HEAD');
if (branch !== 'main') {
  fail(`Must start from 'main' branch (currently on '${branch}')`);
}

const status = runQuiet('git status --porcelain');
const dirtyFiles = status
  .split('\n')
  .filter(l => l.trim() !== '')
  .filter(l => !l.trim().startsWith('?? dev/'));
if (dirtyFiles.length > 0) {
  fail(`Working tree has uncommitted changes:\n${dirtyFiles.join('\n')}`);
}

try {
  statSync(join(root, 'node_modules'));
} catch {
  fail('node_modules not found — run npm install first');
}

// Check branch doesn't already exist
try {
  const existing = runQuiet(`git rev-parse --verify ${branchName} 2>/dev/null || true`);
  if (existing) {
    fail(`Branch '${branchName}' already exists`);
  }
} catch {
  // branch doesn't exist, good
}

console.log('  ✓ On main, clean tree\n');

// ── 2. Pull latest main ─────────────────────────────────────────────────

run('git pull --ff-only');

// ── 3. Bump version ─────────────────────────────────────────────────────

run(`npm version ${bumpLevel} --no-git-tag-version`);

const pkg = JSON.parse(
  execSync('node -p "JSON.stringify(require(\'./package.json\'))"', {
    cwd: root, encoding: 'utf8'
  })
);
const version = pkg.version;

run('npm run generate-version');

console.log(`\n  ✓ Version bumped to ${version}\n`);

// ── 4. Create feature branch ────────────────────────────────────────────

run(`git checkout -b ${branchName}`);

// ── 5. Commit and push ──────────────────────────────────────────────────

run('git add package.json package-lock.json src/version.js');
run(`git commit -m "start v${version}: ${featureName}"`);
run(`git push -u origin ${branchName}`);

// ── Summary ──────────────────────────────────────────────────────────────

console.log(`
  ✓ Ready to develop!

  Branch:   ${branchName}
  Version:  ${version}

  When done:
    git checkout main
    git merge ${branchName}
    npm run release
`);
