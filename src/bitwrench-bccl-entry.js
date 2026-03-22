/**
 * bitwrench-bccl-entry.js — Standalone entry point for BCCL component library.
 *
 * Use this alongside bitwrench-lean when you want the core library and
 * BCCL components as separate files. The UMD build auto-registers all
 * make*() functions onto the global `bw` object if present.
 *
 * Usage (browser):
 *   <script src="bitwrench-lean.umd.min.js"></script>
 *   <script src="bitwrench-bccl.umd.min.js"></script>
 *
 * Usage (ESM):
 *   import bw from 'bitwrench/lean';
 *   import { registerBCCL } from 'bitwrench/bccl';
 *   registerBCCL(bw);
 *
 * @module bitwrench-bccl
 * @license BSD-2-Clause
 */

import * as components from './bitwrench-bccl.js';

/**
 * Register all BCCL components onto a bitwrench instance.
 * Called automatically in UMD builds when `bw` is a global.
 *
 * @param {Object} bw - The bitwrench instance to register on
 */
export function registerBCCL(bw) {
  if (!bw) return;

  // Register all make* functions
  Object.entries(components).forEach(function(entry) {
    var name = entry[0], fn = entry[1];
    if (name.indexOf('make') === 0) {
      bw[name] = fn;
    }
  });

  // Factory dispatch: bw.make('card', props) → bw.makeCard(props)
  bw.make = components.make;

  // Component registry
  bw.BCCL = components.BCCL;

  // Variant class helper
  bw.variantClass = components.variantClass;

  // Create functions that return DOM elements
  if (typeof bw.createDOM === 'function') {
    Object.entries(components).forEach(function(entry) {
      var name = entry[0], fn = entry[1];
      if (name.indexOf('make') === 0) {
        var createName = 'create' + name.substring(4);
        bw[createName] = function(props) {
          return bw.createDOM(fn(props));
        };
      }
    });
  }
}

// Re-export all components for direct import
export { BCCL, make, variantClass } from './bitwrench-bccl.js';

// UMD auto-registration: if `bw` exists as a global, register automatically
if (typeof window !== 'undefined' && typeof window.bw !== 'undefined') {
  registerBCCL(window.bw);
} else if (typeof globalThis !== 'undefined' && typeof globalThis.bw !== 'undefined') {
  registerBCCL(globalThis.bw);
}
