/**
 * bitwrench-lean.js — Entry point for the lean build.
 *
 * This is identical to bitwrench.js but the Rollup config redirects
 * the bitwrench-components-v2.js import to an empty stub, so no
 * BCCL component code is included in the output.
 *
 * Includes: HTML/DOM generation, CSS generation, color utilities,
 *           state management, pub/sub, file I/O, random/lorem,
 *           cookies, URL params, logging, makeTable, makeDataTable.
 * Excludes: All make* component helpers from bitwrench-components-v2.js
 *           (makeButton, makeCard, makeAlert, makeTabs, etc.)
 */
export { default } from './bitwrench.js';
