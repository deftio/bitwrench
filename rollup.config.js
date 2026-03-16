// rollup.config.js for bitwrench 2.x project
// 2024-12-20

import { readFileSync } from 'fs';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import babel from '@rollup/plugin-babel';
import terser from '@rollup/plugin-terser'
import css from 'rollup-plugin-css-only'
import { execSync } from 'child_process';

import { fileURLToPath } from 'url';
import { dirname, resolve as pathResolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));
const banner = `/*! bitwrench v${pkg.version} | ${pkg.license} | ${pkg.homepage} */`;
const leanBanner = `/*! bitwrench-lean v${pkg.version} | ${pkg.license} | ${pkg.homepage} */`;
const bwserveBanner = `/*! bwserve v${pkg.version} | ${pkg.license} | ${pkg.homepage} */`;
const bcclBanner = `/*! bitwrench-bccl v${pkg.version} | ${pkg.license} | ${pkg.homepage} */`;
const utilCssBanner = `/*! bitwrench-util-css v${pkg.version} | ${pkg.license} | ${pkg.homepage} */`;

// Inline plugin: redirect component imports to empty stub (for lean build)
function stubComponents() {
  const stubPath = pathResolve(__dirname, 'src/bitwrench-components-stub.js');
  const componentPath = pathResolve(__dirname, 'src/bitwrench-bccl.js');
  return {
    name: 'stub-components',
    resolveId(source, importer) {
      if (importer && source.includes('bitwrench-bccl')) {
        return stubPath;
      }
      return null;
    }
  };
}

// Generate version.js before building
execSync('node tools/generate-version.cjs', { stdio: 'inherit' });

const extensions = ['.js', '.jsx'];
// Configure Babel to produce ES5 code for older browsers.
const babelConfig = {
    babelHelpers: 'bundled',
    presets: [
      [
        '@babel/preset-env',
        {
          targets: '> 0.25%, IE 11,IE 8', // legacy browsers support
        },
      ],
    ],
  };
  
  export default [
    // Modern builds — UMD + CJS (default export only, no named exports)
    {
      input: 'src/bitwrench.js',
      output: [
        // UMD (non-minified)
        {
          file: 'dist/bitwrench.umd.js',
          format: 'umd',
          name: 'bw', // Global name under which your library is exposed
          banner,
          sourcemap: true,
        },
        // UMD (minified)
        {
          file: 'dist/bitwrench.umd.min.js',
          format: 'umd',
          name: 'bw',
          banner,
          plugins: [terser()],
          sourcemap: true,
        },
        // CommonJS
        {
          file: 'dist/bitwrench.cjs.js',
          format: 'cjs',
          exports: 'auto',
          banner,
          sourcemap: true,
        },
        // CommonJS (minified)
        {
          file: 'dist/bitwrench.cjs.min.js',
          format: 'cjs',
          exports: 'auto',
          banner,
          plugins: [terser()],
          sourcemap: true,
        },
      ],
      plugins: [
        resolve(),
        commonjs(),
      ],
    },

    // Modern builds — ESM (default + named exports for tree-shaking)
    // Uses bitwrench-esm-entry.js which re-exports BCCL functions as
    // named exports. Bundlers (Vite, webpack, esbuild) can tree-shake:
    //   import { makeCard, makeButton } from 'bitwrench';
    {
      input: 'src/bitwrench-esm-entry.js',
      output: [
        // ESM (non-minified)
        {
          file: 'dist/bitwrench.esm.js',
          format: 'esm',
          banner,
          sourcemap: true,
        },
        // ESM (minified)
        {
          file: 'dist/bitwrench.esm.min.js',
          format: 'esm',
          banner,
          plugins: [terser()],
          sourcemap: true,
        },
      ],
      plugins: [
        resolve(),
        commonjs(),
      ],
    },
  
    // ES5 build (for legacy browsers)
    {
      input: 'src/bitwrench.js',
      output: [
        {
          file: 'dist/bitwrench.es5.js',
          format: 'umd',
          name: 'bw',
          banner,
          sourcemap: true,
        },
        {
          file: 'dist/bitwrench.es5.min.js',
          format: 'umd',
          name: 'bw',
          banner,
          plugins: [terser()],
          sourcemap: true,
        },
      ],
      plugins: [
        resolve(),
        commonjs(),
        babel(babelConfig),
      ],
    },

    // Code editor addon — modern builds (UMD, CJS, ESM)
    {
      input: 'src/bitwrench-code-edit.js',
      output: [
        {
          file: 'dist/bitwrench-code-edit.umd.js',
          format: 'umd',
          name: 'bwCodeEdit',
          exports: 'named',
          banner,
          sourcemap: true,
        },
        {
          file: 'dist/bitwrench-code-edit.umd.min.js',
          format: 'umd',
          name: 'bwCodeEdit',
          exports: 'named',
          banner,
          plugins: [terser()],
          sourcemap: true,
        },
        {
          file: 'dist/bitwrench-code-edit.cjs.js',
          format: 'cjs',
          exports: 'named',
          banner,
          sourcemap: true,
        },
        {
          file: 'dist/bitwrench-code-edit.cjs.min.js',
          format: 'cjs',
          exports: 'named',
          banner,
          plugins: [terser()],
          sourcemap: true,
        },
        {
          file: 'dist/bitwrench-code-edit.esm.js',
          format: 'esm',
          banner,
          sourcemap: true,
        },
        {
          file: 'dist/bitwrench-code-edit.esm.min.js',
          format: 'esm',
          banner,
          plugins: [terser()],
          sourcemap: true,
        },
      ],
      plugins: [
        resolve(),
        commonjs(),
      ],
    },

    // Code editor addon — ES5 build (legacy browsers)
    {
      input: 'src/bitwrench-code-edit.js',
      output: [
        {
          file: 'dist/bitwrench-code-edit.es5.js',
          format: 'umd',
          name: 'bwCodeEdit',
          exports: 'named',
          banner,
          sourcemap: true,
        },
        {
          file: 'dist/bitwrench-code-edit.es5.min.js',
          format: 'umd',
          name: 'bwCodeEdit',
          exports: 'named',
          banner,
          plugins: [terser()],
          sourcemap: true,
        },
      ],
      plugins: [
        resolve(),
        commonjs(),
        babel(babelConfig),
      ],
    },

    // Lean build — core library WITHOUT BCCL components (UMD, ESM, CJS)
    {
      input: 'src/bitwrench-lean.js',
      output: [
        {
          file: 'dist/bitwrench-lean.umd.js',
          format: 'umd',
          name: 'bw',
          banner: leanBanner,
          sourcemap: true,
        },
        {
          file: 'dist/bitwrench-lean.umd.min.js',
          format: 'umd',
          name: 'bw',
          banner: leanBanner,
          plugins: [terser()],
          sourcemap: true,
        },
        {
          file: 'dist/bitwrench-lean.esm.js',
          format: 'esm',
          banner: leanBanner,
          sourcemap: true,
        },
        {
          file: 'dist/bitwrench-lean.esm.min.js',
          format: 'esm',
          banner: leanBanner,
          plugins: [terser()],
          sourcemap: true,
        },
        {
          file: 'dist/bitwrench-lean.cjs.js',
          format: 'cjs',
          exports: 'auto',
          banner: leanBanner,
          sourcemap: true,
        },
        {
          file: 'dist/bitwrench-lean.cjs.min.js',
          format: 'cjs',
          exports: 'auto',
          banner: leanBanner,
          plugins: [terser()],
          sourcemap: true,
        },
      ],
      plugins: [
        stubComponents(),
        resolve(),
        commonjs(),
      ],
    },

    // Lean build — ES5 (legacy browsers)
    {
      input: 'src/bitwrench-lean.js',
      output: [
        {
          file: 'dist/bitwrench-lean.es5.js',
          format: 'umd',
          name: 'bw',
          banner: leanBanner,
          sourcemap: true,
        },
        {
          file: 'dist/bitwrench-lean.es5.min.js',
          format: 'umd',
          name: 'bw',
          banner: leanBanner,
          plugins: [terser()],
          sourcemap: true,
        },
      ],
      plugins: [
        stubComponents(),
        resolve(),
        commonjs(),
        babel(babelConfig),
      ],
    },

    // BCCL component addon — modern builds (UMD, CJS, ESM)
    // Use alongside bitwrench-lean for a split-bundle setup
    {
      input: 'src/bitwrench-bccl-entry.js',
      output: [
        {
          file: 'dist/bitwrench-bccl.umd.js',
          format: 'umd',
          name: 'bwBCCL',
          exports: 'named',
          banner: bcclBanner,
          sourcemap: true,
        },
        {
          file: 'dist/bitwrench-bccl.umd.min.js',
          format: 'umd',
          name: 'bwBCCL',
          exports: 'named',
          banner: bcclBanner,
          plugins: [terser()],
          sourcemap: true,
        },
        {
          file: 'dist/bitwrench-bccl.cjs.js',
          format: 'cjs',
          exports: 'named',
          banner: bcclBanner,
          sourcemap: true,
        },
        {
          file: 'dist/bitwrench-bccl.cjs.min.js',
          format: 'cjs',
          exports: 'named',
          banner: bcclBanner,
          plugins: [terser()],
          sourcemap: true,
        },
        {
          file: 'dist/bitwrench-bccl.esm.js',
          format: 'esm',
          banner: bcclBanner,
          sourcemap: true,
        },
        {
          file: 'dist/bitwrench-bccl.esm.min.js',
          format: 'esm',
          banner: bcclBanner,
          plugins: [terser()],
          sourcemap: true,
        },
      ],
      plugins: [
        resolve(),
        commonjs(),
      ],
    },

    // Util CSS addon — modern builds (UMD, CJS, ESM)
    {
      input: 'src/bitwrench-util-css.js',
      output: [
        {
          file: 'dist/bitwrench-util-css.umd.js',
          format: 'umd',
          name: 'bwUtilCSS',
          exports: 'named',
          banner: utilCssBanner,
          sourcemap: true,
        },
        {
          file: 'dist/bitwrench-util-css.umd.min.js',
          format: 'umd',
          name: 'bwUtilCSS',
          exports: 'named',
          banner: utilCssBanner,
          plugins: [terser()],
          sourcemap: true,
        },
        {
          file: 'dist/bitwrench-util-css.cjs.js',
          format: 'cjs',
          exports: 'named',
          banner: utilCssBanner,
          sourcemap: true,
        },
        {
          file: 'dist/bitwrench-util-css.cjs.min.js',
          format: 'cjs',
          exports: 'named',
          banner: utilCssBanner,
          plugins: [terser()],
          sourcemap: true,
        },
        {
          file: 'dist/bitwrench-util-css.esm.js',
          format: 'esm',
          banner: utilCssBanner,
          sourcemap: true,
        },
        {
          file: 'dist/bitwrench-util-css.esm.min.js',
          format: 'esm',
          banner: utilCssBanner,
          plugins: [terser()],
          sourcemap: true,
        },
      ],
      plugins: [
        resolve(),
        commonjs(),
      ],
    },

    // Util CSS addon — ES5 build (legacy browsers)
    {
      input: 'src/bitwrench-util-css.js',
      output: [
        {
          file: 'dist/bitwrench-util-css.es5.js',
          format: 'umd',
          name: 'bwUtilCSS',
          exports: 'named',
          banner: utilCssBanner,
          sourcemap: true,
        },
        {
          file: 'dist/bitwrench-util-css.es5.min.js',
          format: 'umd',
          name: 'bwUtilCSS',
          exports: 'named',
          banner: utilCssBanner,
          plugins: [terser()],
          sourcemap: true,
        },
      ],
      plugins: [
        resolve(),
        commonjs(),
        babel(babelConfig),
      ],
    },

    // bwserve — server-driven UI library (Node.js only, CJS + ESM)
    {
      input: 'src/bwserve/index.js',
      output: [
        {
          file: 'dist/bwserve.cjs.js',
          format: 'cjs',
          exports: 'named',
          banner: bwserveBanner,
          sourcemap: true,
        },
        {
          file: 'dist/bwserve.esm.js',
          format: 'esm',
          banner: bwserveBanner,
          sourcemap: true,
        },
      ],
      plugins: [
        resolve(),
        commonjs(),
      ],
    },
  ];