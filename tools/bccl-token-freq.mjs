#!/usr/bin/env node
/**
 * bccl-token-freq.mjs — Frequency analysis of all tokens in BCCL CSS output
 *
 * Counts every distinct token: CSS property names, property values,
 * property+value pairs, selectors, and selector prefixes.
 *
 * Usage: node tools/bccl-token-freq.mjs
 */

import { getStructuralStyles, generateThemedCSS, resolveLayout, DEFAULT_PALETTE_CONFIG } from '../src/bitwrench-styles.js';
import { derivePalette } from '../src/bitwrench-color-utils.js';

const structural = getStructuralStyles();
const palette = derivePalette(DEFAULT_PALETTE_CONFIG);
const layout = resolveLayout({});
const themed = generateThemedCSS('', palette, layout);
const all = Object.assign({}, structural, themed);

// ─── Counters ───────────────────────────────────────────────────────────

const propNames = new Map();     // CSS property name → count
const propValues = new Map();    // CSS property value → count
const pairs = new Map();         // "prop: value" → count
const selectors = new Map();     // full selector → count (should be 1 each)
const prefixes = new Map();      // selector prefix (up to second segment) → count

let totalSelectors = 0;
let totalDeclarations = 0;

Object.entries(all).forEach(([sel, rules]) => {
  if (typeof rules !== 'object' || rules === null) return;
  totalSelectors++;
  selectors.set(sel, (selectors.get(sel) || 0) + 1);

  // Extract prefix: everything up to and including second meaningful segment
  // .bw_btn_primary → .bw_btn
  // .bw_card_body > *:last-child → .bw_card
  // a:hover → a
  const prefixMatch = sel.match(/^(\.[a-zA-Z_-]+)/);
  if (prefixMatch) {
    // Get component-level prefix: .bw_btn from .bw_btn_primary
    const parts = prefixMatch[1].replace(/^\.bw-/, '').split('-');
    const componentPrefix = '.bw-' + parts[0];
    prefixes.set(componentPrefix, (prefixes.get(componentPrefix) || 0) + 1);
  }

  Object.entries(rules).forEach(([prop, val]) => {
    if (typeof val !== 'string') return;
    totalDeclarations++;
    propNames.set(prop, (propNames.get(prop) || 0) + 1);
    propValues.set(val, (propValues.get(val) || 0) + 1);
    const pair = prop + ': ' + val;
    pairs.set(pair, (pairs.get(pair) || 0) + 1);
  });
});

// ─── Output ─────────────────────────────────────────────────────────────

function printTable(title, map, limit) {
  const sorted = [...map.entries()].sort((a, b) => b[1] - a[1]);
  const shown = limit ? sorted.slice(0, limit) : sorted;
  const totalOccurrences = sorted.reduce((a, [, c]) => a + c, 0);

  console.log('\n' + '='.repeat(80));
  console.log(title);
  console.log('  Unique: ' + sorted.length + '  |  Total occurrences: ' + totalOccurrences);
  console.log('='.repeat(80));
  console.log('Rank  Count  Cum%    Token');
  console.log('-'.repeat(80));

  let cumulative = 0;
  shown.forEach(([token, count], i) => {
    cumulative += count;
    const pct = (100 * cumulative / totalOccurrences).toFixed(1);
    const display = token.length > 60 ? token.substring(0, 57) + '...' : token;
    console.log(
      String(i + 1).padStart(4) + '  ' +
      String(count).padStart(5) + '  ' +
      pct.padStart(5) + '%  ' +
      display
    );
  });

  if (limit && sorted.length > limit) {
    console.log('  ... and ' + (sorted.length - limit) + ' more');
  }

  // How many entries needed for coverage thresholds
  [50, 75, 90, 95, 99].forEach(threshold => {
    let cum = 0;
    let needed = 0;
    for (const [, count] of sorted) {
      cum += count;
      needed++;
      if (100 * cum / totalOccurrences >= threshold) break;
    }
    console.log('  ' + threshold + '% coverage: ' + needed + ' entries (of ' + sorted.length + ')');
  });
}

console.log('BCCL Token Frequency Analysis');
console.log('Total selectors: ' + totalSelectors);
console.log('Total declarations: ' + totalDeclarations);

printTable('CSS PROPERTY NAMES', propNames, 40);
printTable('CSS PROPERTY VALUES', propValues, 60);
printTable('CSS PROPERTY+VALUE PAIRS (declaration dict candidates)', pairs, 80);
printTable('SELECTOR COMPONENT PREFIXES', prefixes, 40);

// ─── Dictionary sizing analysis ─────────────────────────────────────────

console.log('\n' + '='.repeat(80));
console.log('DICTIONARY SIZING ANALYSIS');
console.log('='.repeat(80));

const sortedPairs = [...pairs.entries()].sort((a, b) => b[1] - a[1]);
const totalPairOccurrences = sortedPairs.reduce((a, [, c]) => a + c, 0);

[16, 64, 256, 512, 1024, 4096].forEach(size => {
  const digits = Math.ceil(Math.log2(size) / 4); // hex digits needed
  const top = sortedPairs.slice(0, size);
  const covered = top.reduce((a, [, c]) => a + c, 0);
  const pct = (100 * covered / totalPairOccurrences).toFixed(1);

  // Estimate bytes saved: each covered occurrence saves (avg pair length - digits) bytes
  const avgLen = top.reduce((a, [p]) => a + p.length, 0) / Math.max(top.length, 1);
  const savedPerHit = avgLen - digits;
  const grossSaved = Math.round(covered * savedPerHit);
  const dictCost = top.reduce((a, [p]) => a + p.length + 2, 0); // storing the dict itself
  const netSaved = grossSaved - dictCost;

  console.log(
    String(size).padStart(5) + ' entries (' + digits + ' hex digit' + (digits > 1 ? 's' : '') + '):  ' +
    pct.padStart(5) + '% coverage  (' + covered + '/' + totalPairOccurrences + ' occurrences)  ' +
    'est. net savings: ~' + (netSaved > 0 ? netSaved : 0) + ' bytes'
  );
});
