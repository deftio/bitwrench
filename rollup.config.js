// rollup.config.js for bitwrench 2.x project
// 2024-12-20

import { readFileSync } from 'fs';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import babel from '@rollup/plugin-babel';
import terser from '@rollup/plugin-terser'
import css from 'rollup-plugin-css-only'
import { execSync } from 'child_process';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));
const banner = `/*! bitwrench v${pkg.version} | ${pkg.license} | ${pkg.homepage} */`;

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
    // Modern builds (UMD, CJS, ESM)
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
        // We could include Babel here as well if needed for partial transpilation
        // but typically "modern" outputs can skip full ES5 transpilation.
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

    // Code editor addon (standalone, loads after bitwrench)
    {
      input: 'src/bitwrench-code-edit.js',
      output: [
        {
          file: 'dist/bitwrench-code-edit.umd.js',
          format: 'umd',
          name: 'bwCodeEdit',
          banner,
          sourcemap: true,
        },
        {
          file: 'dist/bitwrench-code-edit.umd.min.js',
          format: 'umd',
          name: 'bwCodeEdit',
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
  ];