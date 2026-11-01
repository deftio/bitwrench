// ESM entry point -- adds named exports as a spelling convenience.
// Both forms load the same library; the named form is not a smaller build:
//
//   import bw from 'bitwrench';                       // full library
//   import { makeCard, makeButton } from 'bitwrench'; // same library, named
//
// Measured: `import { makeButton }` and `import bw` produce the same output
// to within 8 bytes (479,861 vs 479,853) -- one component costs MORE than the
// whole library. This ESM artifact is a single
// pre-bundled file -- one module scope -- so a bundler has nothing to drop.
// See the note below and dev/bitwrench-2.1.6-size-opt-findings.md sections
// 6 and 7. Pick whichever call site reads better.
//
// UMD/CJS builds use bitwrench.js directly (no named exports).

export { default } from './bitwrench.js';
export * from './bitwrench-bccl.js';

// makeTable, makeTableFromArray, makeDataTable and makeBarChart live on `bw` in
// bitwrench.js rather than in bitwrench-bccl.js, so `export *` above does not
// pick them up. They are reached as `bw.makeTable(...)`, which is what the
// Bitwrench interface in src/bitwrench.d.ts declares.
//
// They were briefly added here as named exports to match a stale `export
// function` line in the .d.ts. The named-export list costs ~346 gzipped bytes
// and, per the measurement above, buys nothing. The stale declarations came
// out of the .d.ts instead; `bw.makeTable(...)` stays typed on the Bitwrench
// interface.
