/**
 * bitwrench-lean.js — Entry point for the lean build.
 *
 * This is identical to bitwrench.js but the Rollup config redirects
 * the bitwrench-bccl.js import to an empty stub, so no
 * BCCL component code is included in the output.
 *
 * Includes: HTML/DOM generation, CSS generation (reset, typography, role
 *           colours, utilities, grid, table and bar-chart rules), color
 *           utilities, state management, pub/sub, router, file I/O,
 *           random/lorem, cookies, URL params, logging, makeTable,
 *           makeTableFromArray, makeDataTable, makeBarChart.
 * Excludes: BCCL component factories from bitwrench-bccl.js (makeButton,
 *           makeCard, makeAlert, makeTabs, makeModal, ...) and, since 2.1.14,
 *           their stylesheet (bitwrench-bccl-styles.js). Loading
 *           bitwrench-bccl after this file adds both.
 */
export { default } from './bitwrench.js';
