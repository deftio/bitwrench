/**
 * Dist bundle smoke tests for bitwrench
 *
 * Validates that every built dist/ bundle:
 *  - Loads without error in its respective module format
 *  - Exports the expected API surface
 *  - Produces correct results for basic operations
 *  - Matches version from package.json
 *  - Has parity between minified and non-minified variants
 *
 * Because the root package.json has "type": "module", CJS/UMD/ES5 bundles
 * (which use module.exports) cannot be loaded via import() or require() from
 * this context. To test them, we temporarily write a {"type":"commonjs"}
 * package.json into dist/ so Node treats those .js files as CJS, then load
 * them via a child process.
 */

import assert from 'assert';
import { readFileSync, writeFileSync, unlinkSync, existsSync, mkdtempSync } from 'fs';
import { execFileSync } from 'child_process';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { tmpdir } from 'os';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const pkgPath = resolve(ROOT, 'package.json');
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
const EXPECTED_VERSION = pkg.version;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Load an ESM bundle via dynamic import with a cache-busting query string.
 */
let esmCounter = 0;
async function loadESM(relPath) {
  const absPath = resolve(ROOT, relPath);
  const mod = await import(`${absPath}?cb=${++esmCounter}`);
  return mod;
}

/**
 * Load a CJS/UMD/ES5 bundle by copying it to a temp directory as a .cjs file.
 * This is necessary because the project's package.json has "type":"module",
 * which makes Node refuse to require() any .js file under this tree.
 * Copying to a temp dir with .cjs extension bypasses this restriction.
 *
 * Returns { keys: string[], functionNames: string[], version: string|null,
 *           htmlResult: string|null, typeOfArray: string|null,
 *           escapeResult: string|null }
 */
function probeCJS(relPath) {
  const absPath = resolve(ROOT, relPath);
  const tmpDir = mkdtempSync(join(tmpdir(), 'bw-bundle-test-'));
  const bundleCopy = join(tmpDir, 'bundle.cjs');
  const probe = join(tmpDir, 'probe.cjs');

  // Copy the bundle so it has .cjs extension (Node ignores parent package.json type)
  writeFileSync(bundleCopy, readFileSync(absPath, 'utf8'));

  const script = `
    const m = require(${JSON.stringify(bundleCopy)});
    const keys = Object.keys(m);
    const functionNames = keys.filter(k => typeof m[k] === 'function');
    const version = typeof m.version === 'string' ? m.version : null;
    const htmlResult = typeof m.html === 'function'
      ? m.html({ t: 'span', c: 'x' }) : null;
    const typeOfArray = typeof m.typeOf === 'function'
      ? m.typeOf([]) : null;
    const escapeResult = typeof m.escapeHTML === 'function'
      ? m.escapeHTML('<b>') : null;
    console.log(JSON.stringify({
      keys, functionNames, version, htmlResult, typeOfArray, escapeResult
    }));
  `;
  writeFileSync(probe, script);
  try {
    const result = execFileSync(process.execPath, [probe], {
      encoding: 'utf8',
      timeout: 10000,
    });
    return JSON.parse(result.trim());
  } finally {
    try { unlinkSync(bundleCopy); } catch { /* ignore */ }
    try { unlinkSync(probe); } catch { /* ignore */ }
  }
}

/**
 * Read the first line of a bundle file and return it (the banner comment).
 */
function readBanner(relPath) {
  const absPath = resolve(ROOT, relPath);
  const content = readFileSync(absPath, 'utf8');
  // For minified files the banner may be on the first non-empty line
  const lines = content.split('\n');
  for (const line of lines) {
    if (line.trim()) return line;
  }
  return '';
}

// ---------------------------------------------------------------------------
// Expected API surfaces per package
// ---------------------------------------------------------------------------

const CORE_FUNCTIONS = [
  'html', 'create', 'DOM', 'mount', 'uuid', 'typeOf',
  'escapeHTML', 'hexToHsl', 'makeStyles', 'css', 'colorParse', 'loremIpsum',
  'colorInterp', 'colorHslToRgb', 'colorRgbToHsl',
  'hslToHex', 'adjustLightness', 'mixColor', 'relativeLuminance',
  'textOnColor', 'deriveShades', 'derivePalette',
  'arrayUniq', 'arrayBinA', 'arrayBNotInA',
  'mapScale', 'clip', 'choice', 'naturalCompare',
  'multiArray', 'setIntervalX',
];

const BCCL_EXPORTS = [
  'BCCL', 'make', 'registerBCCL', 'variantClass',
];

const CODE_EDIT_EXPORTS = [
  'tokenizeJS', 'tokenizeCSS', 'tokenizeHTML', 'highlight',
  'codeEditor', 'install', 'CSS_TEXT',
];

const UTIL_CSS_EXPORTS = [
  'utilCSS', 'install',
];

const BWSERVE_EXPORTS = [
  'create', 'version', 'BwServeApp', 'BwServeClient', 'generateShell',
];

// ---------------------------------------------------------------------------
// Bundle manifests: which files to test per package
// ---------------------------------------------------------------------------

const MAIN_BUNDLES = {
  esm:     'dist/bitwrench.esm.js',
  esmMin:  'dist/bitwrench.esm.min.js',
  cjs:     'dist/bitwrench.cjs.js',
  cjsMin:  'dist/bitwrench.cjs.min.js',
  umd:     'dist/bitwrench.umd.js',
  umdMin:  'dist/bitwrench.umd.min.js',
  es5:     'dist/bitwrench.es5.js',
  es5Min:  'dist/bitwrench.es5.min.js',
};

const LEAN_BUNDLES = {
  esm:     'dist/bitwrench-lean.esm.js',
  esmMin:  'dist/bitwrench-lean.esm.min.js',
  cjs:     'dist/bitwrench-lean.cjs.js',
  cjsMin:  'dist/bitwrench-lean.cjs.min.js',
  umd:     'dist/bitwrench-lean.umd.js',
  umdMin:  'dist/bitwrench-lean.umd.min.js',
  es5:     'dist/bitwrench-lean.es5.js',
  es5Min:  'dist/bitwrench-lean.es5.min.js',
};

const BCCL_BUNDLES = {
  esm:     'dist/bitwrench-bccl.esm.js',
  esmMin:  'dist/bitwrench-bccl.esm.min.js',
  cjs:     'dist/bitwrench-bccl.cjs.js',
  cjsMin:  'dist/bitwrench-bccl.cjs.min.js',
  umd:     'dist/bitwrench-bccl.umd.js',
  umdMin:  'dist/bitwrench-bccl.umd.min.js',
};

const CODE_EDIT_BUNDLES = {
  esm:     'dist/bitwrench-code-edit.esm.js',
  esmMin:  'dist/bitwrench-code-edit.esm.min.js',
  cjs:     'dist/bitwrench-code-edit.cjs.js',
  cjsMin:  'dist/bitwrench-code-edit.cjs.min.js',
  umd:     'dist/bitwrench-code-edit.umd.js',
  umdMin:  'dist/bitwrench-code-edit.umd.min.js',
  es5:     'dist/bitwrench-code-edit.es5.js',
  es5Min:  'dist/bitwrench-code-edit.es5.min.js',
};

const UTIL_CSS_BUNDLES = {
  esm:     'dist/bitwrench-util-css.esm.js',
  esmMin:  'dist/bitwrench-util-css.esm.min.js',
  cjs:     'dist/bitwrench-util-css.cjs.js',
  cjsMin:  'dist/bitwrench-util-css.cjs.min.js',
  umd:     'dist/bitwrench-util-css.umd.js',
  umdMin:  'dist/bitwrench-util-css.umd.min.js',
  es5:     'dist/bitwrench-util-css.es5.js',
  es5Min:  'dist/bitwrench-util-css.es5.min.js',
};

const BWSERVE_BUNDLES = {
  esm:     'dist/bwserve.esm.js',
  cjs:     'dist/bwserve.cjs.js',
};

// ---------------------------------------------------------------------------
// All bundles flat list (for banner checks)
// ---------------------------------------------------------------------------

const ALL_BUNDLES = [
  ...Object.values(MAIN_BUNDLES),
  ...Object.values(LEAN_BUNDLES),
  ...Object.values(BCCL_BUNDLES),
  ...Object.values(CODE_EDIT_BUNDLES),
  ...Object.values(UTIL_CSS_BUNDLES),
  ...Object.values(BWSERVE_BUNDLES),
];

// =========================================================================
// Tests
// =========================================================================

describe('Dist Bundle Smoke Tests', function () {

  // -------------------------------------------------------------------------
  // 1. Banner version checks
  // -------------------------------------------------------------------------

  describe('Banner version strings', function () {
    for (const bundle of ALL_BUNDLES) {
      it(`${bundle} banner contains v${EXPECTED_VERSION}`, function () {
        const banner = readBanner(bundle);
        assert.ok(
          banner.includes(EXPECTED_VERSION),
          `Banner "${banner}" should contain "${EXPECTED_VERSION}"`
        );
      });
    }
  });

  // -------------------------------------------------------------------------
  // 2. Main bitwrench — ESM bundles
  // -------------------------------------------------------------------------

  describe('bitwrench ESM bundles', function () {

    describe('bitwrench.esm.js', function () {
      let bw;
      before(async function () {
        bw = (await loadESM(MAIN_BUNDLES.esm)).default;
      });

      it('exports default bw object', function () {
        assert.ok(bw);
        assert.strictEqual(typeof bw, 'object');
      });

      it('version matches package.json', function () {
        assert.strictEqual(bw.version, EXPECTED_VERSION);
      });

      it('has all core functions', function () {
        for (const fn of CORE_FUNCTIONS) {
          assert.strictEqual(typeof bw[fn], 'function', `bw.${fn} should be a function`);
        }
      });

      it('bw.html() renders TACO', function () {
        assert.strictEqual(bw.html({ t: 'div', c: 'hello' }), '<div>hello</div>');
      });

      it('bw.typeOf([]) returns "array"', function () {
        assert.strictEqual(bw.typeOf([]), 'array');
      });

      it('bw.escapeHTML("<b>") works', function () {
        assert.strictEqual(bw.escapeHTML('<b>'), '&lt;b&gt;');
      });

      it('bw.uuid() returns a non-empty string', function () {
        const id = bw.uuid();
        assert.strictEqual(typeof id, 'string');
        assert.ok(id.length > 0, 'uuid should be non-empty');
      });
    });

    describe('bitwrench.esm.min.js', function () {
      let bw;
      before(async function () {
        bw = (await loadESM(MAIN_BUNDLES.esmMin)).default;
      });

      it('exports default bw with version', function () {
        assert.ok(bw);
        assert.strictEqual(bw.version, EXPECTED_VERSION);
      });

      it('has all core functions', function () {
        for (const fn of CORE_FUNCTIONS) {
          assert.strictEqual(typeof bw[fn], 'function', `bw.${fn} should be a function`);
        }
      });

      it('bw.html() renders TACO', function () {
        assert.strictEqual(bw.html({ t: 'div', c: 'hello' }), '<div>hello</div>');
      });
    });
  });

  // -------------------------------------------------------------------------
  // 3. Main bitwrench — CJS/UMD/ES5 bundles (via child process)
  // -------------------------------------------------------------------------

  describe('bitwrench CJS/UMD/ES5 bundles', function () {

    for (const [label, path] of [
      ['CJS', MAIN_BUNDLES.cjs],
      ['CJS min', MAIN_BUNDLES.cjsMin],
      ['UMD', MAIN_BUNDLES.umd],
      ['UMD min', MAIN_BUNDLES.umdMin],
      ['ES5', MAIN_BUNDLES.es5],
      ['ES5 min', MAIN_BUNDLES.es5Min],
    ]) {
      describe(`${label} (${path})`, function () {
        let info;
        before(function () {
          info = probeCJS(path);
        });

        it('exports bw object with version', function () {
          assert.strictEqual(info.version, EXPECTED_VERSION);
        });

        it('has all core functions', function () {
          for (const fn of CORE_FUNCTIONS) {
            assert.ok(
              info.functionNames.includes(fn),
              `${label} should export function "${fn}"`
            );
          }
        });

        it('bw.html() renders TACO', function () {
          assert.strictEqual(info.htmlResult, '<span>x</span>');
        });

        it('bw.typeOf([]) returns "array"', function () {
          assert.strictEqual(info.typeOfArray, 'array');
        });

        it('bw.escapeHTML("<b>") works', function () {
          assert.strictEqual(info.escapeResult, '&lt;b&gt;');
        });
      });
    }
  });

  // -------------------------------------------------------------------------
  // 4. Lean bundles
  // -------------------------------------------------------------------------

  describe('bitwrench-lean bundles', function () {

    describe('ESM (bitwrench-lean.esm.js)', function () {
      let bw;
      before(async function () {
        bw = (await loadESM(LEAN_BUNDLES.esm)).default;
      });

      it('exports default bw with version', function () {
        assert.ok(bw);
        assert.strictEqual(bw.version, EXPECTED_VERSION);
      });

      it('has core functions', function () {
        for (const fn of CORE_FUNCTIONS) {
          assert.strictEqual(typeof bw[fn], 'function', `bw.${fn} should be a function`);
        }
      });

      it('bw.html() renders TACO', function () {
        assert.strictEqual(bw.html({ t: 'div', c: 'lean' }), '<div>lean</div>');
      });
    });

    describe('ESM min (bitwrench-lean.esm.min.js)', function () {
      let bw;
      before(async function () {
        bw = (await loadESM(LEAN_BUNDLES.esmMin)).default;
      });

      it('exports default bw with version', function () {
        assert.ok(bw);
        assert.strictEqual(bw.version, EXPECTED_VERSION);
      });

      it('has core functions', function () {
        for (const fn of CORE_FUNCTIONS) {
          assert.strictEqual(typeof bw[fn], 'function', `bw.${fn} should be a function`);
        }
      });
    });

    for (const [label, path] of [
      ['CJS', LEAN_BUNDLES.cjs],
      ['CJS min', LEAN_BUNDLES.cjsMin],
      ['UMD', LEAN_BUNDLES.umd],
      ['UMD min', LEAN_BUNDLES.umdMin],
      ['ES5', LEAN_BUNDLES.es5],
      ['ES5 min', LEAN_BUNDLES.es5Min],
    ]) {
      describe(`${label} (${path})`, function () {
        let info;
        before(function () {
          info = probeCJS(path);
        });

        it('exports bw with version', function () {
          assert.strictEqual(info.version, EXPECTED_VERSION);
        });

        it('has core functions', function () {
          for (const fn of CORE_FUNCTIONS) {
            assert.ok(
              info.functionNames.includes(fn),
              `${label} should export function "${fn}"`
            );
          }
        });

        it('bw.html() renders TACO', function () {
          assert.strictEqual(info.htmlResult, '<span>x</span>');
        });
      });
    }
  });

  // -------------------------------------------------------------------------
  // 5. BCCL bundles
  // -------------------------------------------------------------------------

  describe('bitwrench-bccl bundles', function () {

    describe('ESM (bitwrench-bccl.esm.js)', function () {
      let mod;
      before(async function () {
        mod = await loadESM(BCCL_BUNDLES.esm);
      });

      it('exports expected named exports', function () {
        for (const name of BCCL_EXPORTS) {
          assert.ok(name in mod, `ESM should export "${name}"`);
        }
      });

      it('BCCL is an object and make is a function', function () {
        assert.strictEqual(typeof mod.BCCL, 'object');
        assert.strictEqual(typeof mod.make, 'function');
      });
    });

    describe('ESM min (bitwrench-bccl.esm.min.js)', function () {
      let mod;
      before(async function () {
        mod = await loadESM(BCCL_BUNDLES.esmMin);
      });

      it('exports expected named exports', function () {
        for (const name of BCCL_EXPORTS) {
          assert.ok(name in mod, `ESM min should export "${name}"`);
        }
      });
    });

    for (const [label, path] of [
      ['CJS', BCCL_BUNDLES.cjs],
      ['CJS min', BCCL_BUNDLES.cjsMin],
      ['UMD', BCCL_BUNDLES.umd],
      ['UMD min', BCCL_BUNDLES.umdMin],
    ]) {
      describe(`${label} (${path})`, function () {
        let info;
        before(function () {
          info = probeCJS(path);
        });

        it('exports expected properties', function () {
          for (const name of BCCL_EXPORTS) {
            assert.ok(
              info.keys.includes(name),
              `${label} should export "${name}"`
            );
          }
        });
      });
    }
  });

  // -------------------------------------------------------------------------
  // 6. Code-edit bundles
  // -------------------------------------------------------------------------

  describe('bitwrench-code-edit bundles', function () {

    describe('ESM (bitwrench-code-edit.esm.js)', function () {
      let mod;
      before(async function () {
        mod = await loadESM(CODE_EDIT_BUNDLES.esm);
      });

      it('exports expected named exports', function () {
        for (const name of CODE_EDIT_EXPORTS) {
          assert.ok(name in mod, `ESM should export "${name}"`);
        }
      });

      it('tokenizeJS is a function', function () {
        assert.strictEqual(typeof mod.tokenizeJS, 'function');
      });

      it('highlight is a function', function () {
        assert.strictEqual(typeof mod.highlight, 'function');
      });
    });

    describe('ESM min (bitwrench-code-edit.esm.min.js)', function () {
      let mod;
      before(async function () {
        mod = await loadESM(CODE_EDIT_BUNDLES.esmMin);
      });

      it('exports expected named exports', function () {
        for (const name of CODE_EDIT_EXPORTS) {
          assert.ok(name in mod, `ESM min should export "${name}"`);
        }
      });
    });

    for (const [label, path] of [
      ['CJS', CODE_EDIT_BUNDLES.cjs],
      ['CJS min', CODE_EDIT_BUNDLES.cjsMin],
      ['UMD', CODE_EDIT_BUNDLES.umd],
      ['UMD min', CODE_EDIT_BUNDLES.umdMin],
      ['ES5', CODE_EDIT_BUNDLES.es5],
      ['ES5 min', CODE_EDIT_BUNDLES.es5Min],
    ]) {
      describe(`${label} (${path})`, function () {
        let info;
        before(function () {
          info = probeCJS(path);
        });

        it('exports expected properties', function () {
          for (const name of CODE_EDIT_EXPORTS) {
            assert.ok(
              info.keys.includes(name) ||
              // CJS/UMD may have default export wrapping
              info.functionNames.includes(name),
              `${label} should export "${name}"`
            );
          }
        });
      });
    }
  });

  // -------------------------------------------------------------------------
  // 7. Util-CSS bundles
  // -------------------------------------------------------------------------

  describe('bitwrench-util-css bundles', function () {

    describe('ESM (bitwrench-util-css.esm.js)', function () {
      let mod;
      before(async function () {
        mod = await loadESM(UTIL_CSS_BUNDLES.esm);
      });

      it('exports expected named exports', function () {
        for (const name of UTIL_CSS_EXPORTS) {
          assert.ok(name in mod, `ESM should export "${name}"`);
        }
      });

      it('utilCSS is a function', function () {
        assert.strictEqual(typeof mod.utilCSS, 'function');
      });
    });

    describe('ESM min (bitwrench-util-css.esm.min.js)', function () {
      let mod;
      before(async function () {
        mod = await loadESM(UTIL_CSS_BUNDLES.esmMin);
      });

      it('exports expected named exports', function () {
        for (const name of UTIL_CSS_EXPORTS) {
          assert.ok(name in mod, `ESM min should export "${name}"`);
        }
      });
    });

    for (const [label, path] of [
      ['CJS', UTIL_CSS_BUNDLES.cjs],
      ['CJS min', UTIL_CSS_BUNDLES.cjsMin],
      ['UMD', UTIL_CSS_BUNDLES.umd],
      ['UMD min', UTIL_CSS_BUNDLES.umdMin],
      ['ES5', UTIL_CSS_BUNDLES.es5],
      ['ES5 min', UTIL_CSS_BUNDLES.es5Min],
    ]) {
      describe(`${label} (${path})`, function () {
        let info;
        before(function () {
          info = probeCJS(path);
        });

        it('exports expected properties', function () {
          for (const name of UTIL_CSS_EXPORTS) {
            assert.ok(
              info.keys.includes(name),
              `${label} should export "${name}"`
            );
          }
        });
      });
    }
  });

  // -------------------------------------------------------------------------
  // 8. bwserve bundles
  // -------------------------------------------------------------------------

  describe('bwserve bundles', function () {

    describe('ESM (bwserve.esm.js)', function () {
      let mod;
      before(async function () {
        mod = await loadESM(BWSERVE_BUNDLES.esm);
      });

      it('exports expected named exports', function () {
        for (const name of BWSERVE_EXPORTS) {
          assert.ok(name in mod, `ESM should export "${name}"`);
        }
      });

      it('create is a function', function () {
        assert.strictEqual(typeof mod.create, 'function');
      });

      it('version matches package.json', function () {
        assert.strictEqual(mod.version, EXPECTED_VERSION);
      });
    });

    describe('CJS (bwserve.cjs.js)', function () {
      let info;
      before(function () {
        info = probeCJS(BWSERVE_BUNDLES.cjs);
      });

      it('exports expected properties', function () {
        for (const name of BWSERVE_EXPORTS) {
          assert.ok(
            info.keys.includes(name),
            `CJS should export "${name}"`
          );
        }
      });

      it('version matches package.json', function () {
        assert.strictEqual(info.version, EXPECTED_VERSION);
      });
    });
  });

  // -------------------------------------------------------------------------
  // 9. Minified parity (ESM: in-process comparison)
  // -------------------------------------------------------------------------

  describe('Minified parity', function () {

    describe('bitwrench ESM min vs non-min', function () {
      let bw, bwMin;
      before(async function () {
        bw = (await loadESM(MAIN_BUNDLES.esm)).default;
        bwMin = (await loadESM(MAIN_BUNDLES.esmMin)).default;
      });

      it('min exports same function names', function () {
        const keys = Object.keys(bw).filter(k => typeof bw[k] === 'function').sort();
        const minKeys = Object.keys(bwMin).filter(k => typeof bwMin[k] === 'function').sort();
        assert.deepStrictEqual(keys, minKeys);
      });

      it('min produces same html output', function () {
        assert.strictEqual(
          bwMin.html({ t: 'span', c: 'x' }),
          bw.html({ t: 'span', c: 'x' })
        );
      });
    });

    describe('bitwrench CJS min vs non-min', function () {
      let info, infoMin;
      before(function () {
        info = probeCJS(MAIN_BUNDLES.cjs);
        infoMin = probeCJS(MAIN_BUNDLES.cjsMin);
      });

      it('min exports same function names', function () {
        assert.deepStrictEqual(info.functionNames.sort(), infoMin.functionNames.sort());
      });

      it('min produces same html output', function () {
        assert.strictEqual(info.htmlResult, infoMin.htmlResult);
      });
    });

    describe('bitwrench UMD min vs non-min', function () {
      let info, infoMin;
      before(function () {
        info = probeCJS(MAIN_BUNDLES.umd);
        infoMin = probeCJS(MAIN_BUNDLES.umdMin);
      });

      it('min exports same function names', function () {
        assert.deepStrictEqual(info.functionNames.sort(), infoMin.functionNames.sort());
      });

      it('min produces same html output', function () {
        assert.strictEqual(info.htmlResult, infoMin.htmlResult);
      });
    });

    describe('bitwrench ES5 min vs non-min', function () {
      let info, infoMin;
      before(function () {
        info = probeCJS(MAIN_BUNDLES.es5);
        infoMin = probeCJS(MAIN_BUNDLES.es5Min);
      });

      it('min exports same function names', function () {
        assert.deepStrictEqual(info.functionNames.sort(), infoMin.functionNames.sort());
      });

      it('min produces same html output', function () {
        assert.strictEqual(info.htmlResult, infoMin.htmlResult);
      });
    });

    describe('bitwrench-lean ESM min vs non-min', function () {
      let bw, bwMin;
      before(async function () {
        bw = (await loadESM(LEAN_BUNDLES.esm)).default;
        bwMin = (await loadESM(LEAN_BUNDLES.esmMin)).default;
      });

      it('min exports same function names', function () {
        const keys = Object.keys(bw).filter(k => typeof bw[k] === 'function').sort();
        const minKeys = Object.keys(bwMin).filter(k => typeof bwMin[k] === 'function').sort();
        assert.deepStrictEqual(keys, minKeys);
      });

      it('min produces same html output', function () {
        assert.strictEqual(
          bwMin.html({ t: 'span', c: 'x' }),
          bw.html({ t: 'span', c: 'x' })
        );
      });
    });

    describe('bitwrench-bccl CJS min vs non-min', function () {
      let info, infoMin;
      before(function () {
        info = probeCJS(BCCL_BUNDLES.cjs);
        infoMin = probeCJS(BCCL_BUNDLES.cjsMin);
      });

      it('min exports same property names', function () {
        assert.deepStrictEqual(info.keys.sort(), infoMin.keys.sort());
      });
    });

    describe('bitwrench-code-edit CJS min vs non-min', function () {
      let info, infoMin;
      before(function () {
        info = probeCJS(CODE_EDIT_BUNDLES.cjs);
        infoMin = probeCJS(CODE_EDIT_BUNDLES.cjsMin);
      });

      it('min exports same property names', function () {
        assert.deepStrictEqual(info.keys.sort(), infoMin.keys.sort());
      });
    });

    describe('bitwrench-util-css CJS min vs non-min', function () {
      let info, infoMin;
      before(function () {
        info = probeCJS(UTIL_CSS_BUNDLES.cjs);
        infoMin = probeCJS(UTIL_CSS_BUNDLES.cjsMin);
      });

      it('min exports same property names', function () {
        assert.deepStrictEqual(info.keys.sort(), infoMin.keys.sort());
      });
    });
  });

  // -------------------------------------------------------------------------
  // 10. Cross-format parity
  // -------------------------------------------------------------------------

  describe('Cross-format parity', function () {

    describe('bitwrench: ESM vs CJS vs UMD vs ES5 same functions', function () {
      let esmFns, cjsFns, umdFns, es5Fns;

      before(async function () {
        const esm = (await loadESM(MAIN_BUNDLES.esm)).default;
        esmFns = Object.keys(esm).filter(k => typeof esm[k] === 'function').sort();
        cjsFns = probeCJS(MAIN_BUNDLES.cjs).functionNames.sort();
        umdFns = probeCJS(MAIN_BUNDLES.umd).functionNames.sort();
        es5Fns = probeCJS(MAIN_BUNDLES.es5).functionNames.sort();
      });

      it('ESM and CJS have same function names', function () {
        assert.deepStrictEqual(esmFns, cjsFns);
      });

      it('ESM and UMD have same function names', function () {
        assert.deepStrictEqual(esmFns, umdFns);
      });

      it('ESM and ES5 have same function names', function () {
        assert.deepStrictEqual(esmFns, es5Fns);
      });
    });

    describe('bitwrench-lean: ESM vs CJS vs UMD vs ES5 same functions', function () {
      let esmFns, cjsFns, umdFns, es5Fns;

      before(async function () {
        const esm = (await loadESM(LEAN_BUNDLES.esm)).default;
        esmFns = Object.keys(esm).filter(k => typeof esm[k] === 'function').sort();
        cjsFns = probeCJS(LEAN_BUNDLES.cjs).functionNames.sort();
        umdFns = probeCJS(LEAN_BUNDLES.umd).functionNames.sort();
        es5Fns = probeCJS(LEAN_BUNDLES.es5).functionNames.sort();
      });

      it('ESM and CJS have same function names', function () {
        assert.deepStrictEqual(esmFns, cjsFns);
      });

      it('ESM and UMD have same function names', function () {
        assert.deepStrictEqual(esmFns, umdFns);
      });

      it('ESM and ES5 have same function names', function () {
        assert.deepStrictEqual(esmFns, es5Fns);
      });
    });

    describe('bitwrench-bccl: ESM vs CJS vs UMD same exports', function () {
      let esmKeys, cjsKeys, umdKeys;

      before(async function () {
        const esm = await loadESM(BCCL_BUNDLES.esm);
        esmKeys = Object.keys(esm).filter(k => k !== 'default').sort();
        cjsKeys = probeCJS(BCCL_BUNDLES.cjs).keys.sort();
        umdKeys = probeCJS(BCCL_BUNDLES.umd).keys.sort();
      });

      it('ESM and CJS have same export names', function () {
        assert.deepStrictEqual(esmKeys, cjsKeys);
      });

      it('ESM and UMD have same export names', function () {
        assert.deepStrictEqual(esmKeys, umdKeys);
      });
    });

    describe('bitwrench-code-edit: ESM vs CJS vs UMD same exports', function () {
      let esmKeys, cjsKeys, umdKeys;

      before(async function () {
        const esm = await loadESM(CODE_EDIT_BUNDLES.esm);
        esmKeys = Object.keys(esm).filter(k => k !== 'default').sort();
        const cjsRaw = probeCJS(CODE_EDIT_BUNDLES.cjs).keys;
        cjsKeys = cjsRaw.filter(k => k !== 'default' && k !== '__esModule').sort();
        const umdRaw = probeCJS(CODE_EDIT_BUNDLES.umd).keys;
        umdKeys = umdRaw.filter(k => k !== 'default' && k !== '__esModule').sort();
      });

      it('ESM and CJS have same export names', function () {
        assert.deepStrictEqual(esmKeys, cjsKeys);
      });

      it('ESM and UMD have same export names', function () {
        assert.deepStrictEqual(esmKeys, umdKeys);
      });
    });

    describe('bitwrench-util-css: ESM vs CJS vs UMD same exports', function () {
      let esmKeys, cjsKeys, umdKeys;

      before(async function () {
        const esm = await loadESM(UTIL_CSS_BUNDLES.esm);
        esmKeys = Object.keys(esm).filter(k => k !== 'default').sort();
        const cjsRaw = probeCJS(UTIL_CSS_BUNDLES.cjs).keys;
        cjsKeys = cjsRaw.filter(k => k !== 'default' && k !== '__esModule').sort();
        const umdRaw = probeCJS(UTIL_CSS_BUNDLES.umd).keys;
        umdKeys = umdRaw.filter(k => k !== 'default' && k !== '__esModule').sort();
      });

      it('ESM and CJS have same export names', function () {
        assert.deepStrictEqual(esmKeys, cjsKeys);
      });

      it('ESM and UMD have same export names', function () {
        assert.deepStrictEqual(esmKeys, umdKeys);
      });
    });

    describe('bwserve: ESM vs CJS same exports', function () {
      let esmKeys, cjsKeys;

      before(async function () {
        const esm = await loadESM(BWSERVE_BUNDLES.esm);
        esmKeys = Object.keys(esm).filter(k => k !== 'default').sort();
        const cjsRaw = probeCJS(BWSERVE_BUNDLES.cjs).keys;
        cjsKeys = cjsRaw.filter(k => k !== 'default' && k !== '__esModule').sort();
      });

      it('ESM and CJS have same export names', function () {
        assert.deepStrictEqual(esmKeys, cjsKeys);
      });
    });
  });
});
