// ESM entry point — adds named exports for tree-shaking.
// Modern bundlers (Vite, webpack, esbuild) can import individual
// BCCL components without pulling in the entire library:
//
//   import bw from 'bitwrench';                       // full library
//   import { makeCard, makeButton } from 'bitwrench'; // tree-shakeable
//
// UMD/CJS builds use bitwrench.js directly (no named exports).

export { default } from './bitwrench.js';
export * from './bitwrench-bccl.js';
