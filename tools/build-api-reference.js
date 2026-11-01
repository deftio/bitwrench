#!/usr/bin/env node
/**
 * Build 08-api-reference.html by parsing JSDoc from source files
 * and rendering the page using bitwrench server-side (bw.html).
 *
 * Usage: node tools/build-api-reference.js
 *
 * Uses comment-parser (devDependency) for reliable JSDoc parsing.
 * The project's API reference is generated WITH bitwrench.
 */

import bw from '../src/bitwrench.js';
import { parse } from 'comment-parser';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outputPath = join(__dirname, '..', 'pages', '08-api-reference.html');

// ─── JSDoc Parser using comment-parser ───────────────────────────────────────

/**
 * Parse a source file and extract all public bw.* API entries.
 * Uses comment-parser for reliable JSDoc block extraction, then
 * scans the line after each block for `bw.xxx = function(...)`.
 */
function parseAPIs(source, defaultCategory) {
  const entries = [];
  const lines = source.split('\n');
  const parsed = parse(source);

  for (const block of parsed) {
    // Find which source line this JSDoc ends on
    const endLine = block.source[block.source.length - 1].number;
    // Look at the next 1-2 non-empty lines for function assignment
    let funcLine = '';
    for (let i = endLine + 1; i <= endLine + 3 && i < lines.length; i++) {
      const trimmed = lines[i].trim();
      if (trimmed) { funcLine = trimmed; break; }
    }

    // Match bw.xxx = function(...) or bw.xxx = { or bw.xxx = bw.yyy
    const funcMatch = funcLine.match(/^(bw\.\$?[\w.]+)\s*=\s*(function\s*\(([^)]*)\)|(\{|bw\.\w+))/);
    if (!funcMatch) continue;

    const name = funcMatch[1];
    const isFunction = funcMatch[2] && funcMatch[2].startsWith('function');
    const params_str = funcMatch[3] || '';

    // Skip private/internal (but allow bw.$.one)
    if (name.includes('._') && name !== 'bw.$.one') continue;
    // Skip @private tagged blocks
    if (block.tags.some(t => t.tag === 'private')) continue;

    // Extract structured data from parsed block
    const desc = block.description.trim();

    const params = block.tags
      .filter(t => t.tag === 'param')
      .map(t => {
        const paramName = t.name;
        const type = t.type || '';
        const desc = t.description || '';
        return [paramName, type, desc];
      });

    const returnsTag = block.tags.find(t => t.tag === 'returns' || t.tag === 'return');
    const returns = returnsTag
      ? { type: returnsTag.type || '', desc: returnsTag.description || '' }
      : null;

    const exampleTag = block.tags.find(t => t.tag === 'example');
    const example = exampleTag
      // Source extraction FIRST: comment-parser flattens a multi-line
      // @example into one line, and a `//` comment then swallows every
      // statement after it -- which published syntactically invalid
      // examples (bw.once, bw.makeContainer and others).
      ? extractExampleFromSource(block.source) || exampleTag.description.trim()
      : null;

    const categoryTag = block.tags.find(t => t.tag === 'category');
    const category = categoryTag ? categoryTag.name + (categoryTag.description ? ' ' + categoryTag.description : '') : defaultCategory;

    const seeRefs = block.tags
      .filter(t => t.tag === 'see')
      .map(t => (t.name + (t.description ? ' ' + t.description : '')).trim());

    // Build signature
    const sig = isFunction ? name + '(' + params_str.trim() + ')' : name;

    entries.push({ name, sig, desc, params, returns, example, category, seeRefs });
  }

  return entries;
}

/**
 * Extract @example content from raw source lines when comment-parser
 * puts everything in description. Handles multi-line code blocks.
 */
function extractExampleFromSource(sourceLines) {
  let capturing = false;
  const lines = [];
  for (const s of sourceLines) {
    const raw = s.source;
    if (raw.includes('@example')) { capturing = true; continue; }
    if (capturing) {
      if (raw.match(/^\s*\*\s*@/)) break; // hit next tag
      if (raw.match(/^\s*\*\//)) break;   // hit end of comment
      const cleaned = raw.replace(/^\s*\*\s?/, '');
      lines.push(cleaned);
    }
  }
  return lines.join('\n').trim() || null;
}

// ─── Parse component builders from bitwrench-bccl.js ─────────────────────────

function parseComponents(source, defaultCategory) {
  const entries = [];
  const lines = source.split('\n');
  const parsed = parse(source);

  for (const block of parsed) {
    const endLine = block.source[block.source.length - 1].number;
    let funcLine = '';
    for (let i = endLine + 1; i <= endLine + 3 && i < lines.length; i++) {
      const trimmed = lines[i].trim();
      if (trimmed) { funcLine = trimmed; break; }
    }

    // Match export function makeXxx(...)
    const funcMatch = funcLine.match(/(?:export\s+)?function\s+(make\w+)\s*\(([^)]*)\)/);
    if (!funcMatch) continue;

    const funcName = funcMatch[1];
    const params_str = funcMatch[2];
    const name = 'bw.' + funcName;
    const desc = block.description.trim() || 'Create ' + funcName.replace('make', '').toLowerCase() + ' component.';

    const params = block.tags
      .filter(t => t.tag === 'param')
      .map(t => [t.name, t.type || '', t.description || '']);

    const returnsTag = block.tags.find(t => t.tag === 'returns' || t.tag === 'return');
    const returns = returnsTag
      ? { type: returnsTag.type || 'Object', desc: returnsTag.description || 'TACO object' }
      : { type: 'Object', desc: 'TACO object' };

    const exampleTag = block.tags.find(t => t.tag === 'example');
    const example = exampleTag
      // Source extraction FIRST: comment-parser flattens a multi-line
      // @example into one line, and a `//` comment then swallows every
      // statement after it -- which published syntactically invalid
      // examples (bw.once, bw.makeContainer and others).
      ? extractExampleFromSource(block.source) || exampleTag.description.trim()
      : null;

    const categoryTag = block.tags.find(t => t.tag === 'category');
    const category = categoryTag ? categoryTag.name + (categoryTag.description ? ' ' + categoryTag.description : '') : defaultCategory;

    const seeRefs = block.tags
      .filter(t => t.tag === 'see')
      .map(t => (t.name + (t.description ? ' ' + t.description : '')).trim());

    entries.push({
      name,
      sig: name + '(' + params_str.trim() + ')',
      desc,
      params,
      returns,
      example,
      category,
      seeRefs
    });
  }

  return entries;
}

// ─── Read source files ───────────────────────────────────────────────────────

const v2Source = readFileSync(join(__dirname, '..', 'src', 'bitwrench.js'), 'utf8');
const compSource = readFileSync(join(__dirname, '..', 'src', 'bitwrench-bccl.js'), 'utf8');

const coreAPIs = parseAPIs(v2Source, 'Core');
const componentAPIs = parseComponents(compSource, 'Component Builders');
const allAPIs = [...coreAPIs, ...componentAPIs];

// ─── Categorize ──────────────────────────────────────────────────────────────

// Category display order
const categoryOrder = [
  'Core', 'DOM Generation', 'DOM Selection', 'Identifiers',
  'State Management', 'Events (DOM)', 'Pub/Sub',
  'CSS & Styling', 'Component Builders',
  'Color', 'Math', 'Array Utilities', 'Text Generation',
  'Timing', 'Browser Utilities', 'File I/O',
  'Component Handles'
];

// Group by category
const grouped = {};
allAPIs.forEach(api => {
  const cat = api.category || 'Other';
  if (!grouped[cat]) grouped[cat] = [];
  grouped[cat].push(api);
});

// Order categories
const orderedCategories = categoryOrder
  .filter(c => grouped[c] && grouped[c].length > 0)
  .map(c => ({ name: c, entries: grouped[c] }));

// Add any uncategorized
Object.keys(grouped).forEach(c => {
  if (!categoryOrder.includes(c)) {
    orderedCategories.push({ name: c, entries: grouped[c] });
  }
});

const totalEntries = allAPIs.length;
const withExamples = allAPIs.filter(a => a.example).length;
console.log('Parsed ' + totalEntries + ' API entries in ' + orderedCategories.length + ' categories (' + withExamples + ' with code examples)');

// ─── Generate TACO page ─────────────────────────────────────────────────────

function makeAPIEntry(api) {
  const anchor = api.name.replace(/[\.\$]/g, '-');
  const children = [];

  // Signature with anchor link
  children.push({
    t: 'div', a: { class: 'api-sig', id: anchor },
    c: [
      { t: 'a', a: { href: '#' + anchor, class: 'api-anchor' }, c: '#' },
      ' ',
      api.sig
    ]
  });

  // Description — split into summary (first sentence) and extended
  // Escape since page renders with raw:true
  if (api.desc) {
    const escaped = bw.escapeHTML(api.desc);
    const sentences = escaped.split(/(?<=\.)\s+/);
    const summary = sentences[0] || '';
    const extended = sentences.slice(1).join(' ');

    children.push({ t: 'p', a: { class: 'api-desc' }, c: summary });

    if (extended) {
      children.push({
        t: 'div', a: { class: 'api-usedfor' },
        c: extended
      });
    }
  }

  // Parameters (escape since page renders with raw:true)
  if (api.params && api.params.length) {
    const paramRows = api.params.map(function(p) {
      return {
        t: 'div', a: { class: 'api-param-row' },
        c: [
          { t: 'code', a: { class: 'api-param-name' }, c: bw.escapeHTML(p[0]) },
          p[1] ? { t: 'span', a: { class: 'api-param-type' }, c: bw.escapeHTML(p[1]) } : null,
          p[2] ? { t: 'span', a: { class: 'api-param-desc' }, c: bw.escapeHTML(p[2]) } : null
        ].filter(Boolean)
      };
    });
    children.push({ t: 'div', a: { class: 'api-params' }, c: paramRows });
  }

  // Returns (escape since page renders with raw:true)
  if (api.returns) {
    children.push({
      t: 'div', a: { class: 'api-returns' },
      c: [
        'Returns ',
        { t: 'code', a: { class: 'api-returns-type' }, c: bw.escapeHTML(api.returns.type) },
        api.returns.desc ? ' \u2014 ' + bw.escapeHTML(api.returns.desc) : ''
      ]
    });
  }

  // Code example (escape since page renders with raw:true)
  if (api.example) {
    children.push({
      t: 'div', a: { class: 'api-example' },
      c: { t: 'pre', c: { t: 'code', c: bw.escapeHTML(api.example) } }
    });
  }

  // See also
  if (api.seeRefs && api.seeRefs.length) {
    children.push({
      t: 'div', a: { class: 'api-see' },
      c: [
        'See also: ',
        ...api.seeRefs.map((ref, i) => {
          const refAnchor = ref.replace(/[\.\$]/g, '-');
          const parts = [];
          if (i > 0) parts.push(', ');
          parts.push({ t: 'a', a: { href: '#' + refAnchor }, c: ref });
          return parts;
        }).flat()
      ]
    });
  }

  // No data-* anywhere in bitwrench: identity travels on class tokens.
  // The old per-entry name attribute was redundant too -- the name is already
  // the entry's own text, which is what the search filter matches on.
  return {
    t: 'div',
    a: { class: 'api-entry ' + catToken(api.category) },
    c: children
  };
}

// A stable class token per category, so the filter can count visible entries
// per category with one document-scoped bw.$() instead of a scoped
// querySelectorAll on each section.
function catToken(name) {
  return 'bw_api_cat_' + String(name || 'other').toLowerCase().replace(/[^a-z0-9]+/g, '_');
}

// Search bar
const searchBar = {
  t: 'div', a: { class: 'api-search-wrap' },
  c: {
    t: 'input', a: {
      type: 'text',
      id: 'api-search',
      class: 'api-search-input',
      placeholder: 'Filter APIs... (e.g. "html", "color", "table")',
      autocomplete: 'off'
    }
  }
};

// Category descriptions for the quick-nav
const categoryDescriptions = {
  'Core': 'Foundational utilities — type detection, escaping, version info',
  'DOM Generation': 'Convert TACO objects to HTML strings or live DOM elements',
  'DOM Selection': 'Query and select DOM elements',
  'Identifiers': 'Generate UUIDs and manage element identity',
  'State Management': 'Reactive state, patching, and update patterns',
  'Events (DOM)': 'DOM-scoped event emission and listening',
  'Pub/Sub': 'Application-scoped publish/subscribe messaging',
  'CSS & Styling': 'Generate CSS from JS objects, inject stylesheets, themes',
  'Component Builders': 'BCCL make*() factories — buttons, cards, modals, forms, and more',
  'Component': 'Reactive ComponentHandle API — get/set, template bindings, control flow',
  'Component Handles': 'Reactive ComponentHandle API — get/set, template bindings, control flow',
  'Color': 'Color parsing, conversion, interpolation, and contrast utilities',
  'Math': 'Numeric mapping, clamping, and scale functions',
  'Array Utilities': 'Array intersection, difference, and uniqueness',
  'Text Generation': 'Lorem ipsum and placeholder text generation',
  'Timing': 'Interval control and retry-until patterns',
  'Browser Utilities': 'Cookies, URL parameters, and browser-specific helpers',
  'File I/O': 'Load and save files in browser and Node.js environments'
};

// Table of contents — category headers are clickable links to their sections
const toc = {
  t: 'div', a: { class: 'api-toc', id: 'api-toc' },
  c: orderedCategories.map(cat => {
    const catAnchor = 'cat-' + cat.name.toLowerCase().replace(/[^a-z]/g, '-');
    return {
      t: 'div', a: { class: 'api-toc-group' }, c: [
        {
          t: 'a', a: {
            href: '#' + catAnchor,
            class: 'api-toc-category-link'
          }, c: [
            cat.name,
            { t: 'span', a: { class: 'api-toc-count' }, c: '' + cat.entries.length }
          ]
        },
        { t: 'div', c: cat.entries.map(e => ({
          t: 'a', a: {
            href: '#' + e.name.replace(/[\.\$]/g, '-'),
            class: 'api-toc-link'
          }, c: e.name
        }))}
      ]
    };
  })
};

// API content sections
const content = {
  t: 'div', a: { id: 'api-entries' },
  c: orderedCategories.map(cat => ({
    t: 'div', a: { class: 'api-category ' + catToken(cat.name) },
    c: [
      { t: 'h2', a: { id: 'cat-' + cat.name.toLowerCase().replace(/[^a-z]/g, '-') }, c: cat.name },
      { t: 'div', c: cat.entries.map(makeAPIEntry) }
    ]
  }))
};

// Quick-nav category cards (jump links to major groups)
const quickNav = {
  t: 'div', a: { class: 'api-quicknav' },
  c: orderedCategories.map(cat => {
    const catAnchor = 'cat-' + cat.name.toLowerCase().replace(/[^a-z]/g, '-');
    const desc = categoryDescriptions[cat.name] || '';
    return {
      t: 'a', a: { href: '#' + catAnchor, class: 'api-quicknav-card' },
      c: [
        { t: 'div', a: { class: 'api-quicknav-name' }, c: cat.name },
        { t: 'div', a: { class: 'api-quicknav-count' }, c: cat.entries.length + ' functions' },
        desc ? { t: 'div', a: { class: 'api-quicknav-desc' }, c: desc } : null
      ].filter(Boolean)
    };
  })
};

// App content TACO (mounted client-side via bw.DOM)
const appContent = {
  t: 'div', c: [
    // Header
    { t: 'div', a: { class: 'page-header' }, c: {
      t: 'div', a: { class: 'content-container wide', style: 'padding-top:0;padding-bottom:0' }, c: [
        { t: 'h1', c: 'API Reference' },
        { t: 'p', a: { class: 'subtitle' },
          c: totalEntries + ' functions across ' + orderedCategories.length + ' categories' }
      ]
    }},

    // Main content
    { t: 'div', a: { class: 'content-container wide' }, c: [
      // Intro + quick nav
      { t: 'div', a: { class: 'demo-section' }, c: [
        { t: 'p', c: 'Bitwrench provides a complete toolkit for building UIs from plain JavaScript objects. Use the TACO format ({t, a, c, o}) to define structure, the make*() factories for ready-made components, and utilities for color, styling, state management, and file I/O.' },
        { t: 'p', c: 'Jump to a category or use the search bar below to find any function.' },
        quickNav
      ]},
      // Search
      searchBar,
      // TOC
      { t: 'div', a: { class: 'demo-section' }, c: [
        { t: 'h2', c: 'Contents' },
        toc
      ]},
      // Entries
      content
    ]}
  ]
};

// Serialize the TACO for client-side embedding
const appContentJSON = JSON.stringify(appContent);

// ─── Page CSS (as bw.css object for dogfooding) ─────────────────────────────

const pageCssObj = `{
      '.api-search-wrap': { 'margin': '1.5rem 0' },
      '.api-search-input': {
        'width': '100%', 'padding': '0.6rem 1rem', 'font-size': '0.95rem',
        'border': '2px solid ' + p.light.border, 'border-radius': '8px', 'outline': 'none',
        'font-family': 'inherit', 'transition': 'border-color 0.15s'
      },
      '.api-search-input:focus': { 'border-color': p.primary.base },
      '.api-toc': { 'display': 'grid', 'grid-template-columns': 'repeat(3, 1fr)', 'gap': '0.75rem 2rem', 'margin': '1rem 0 2rem' },
      '.api-toc-group h4': { 'margin': '0 0 0.25rem', 'font-size': '0.75rem', 'text-transform': 'uppercase', 'letter-spacing': '0.06em', 'color': p.secondary.base },
      '.api-toc-link': { 'display': 'block', 'padding': '0.15rem 0', 'color': p.primary.base, 'text-decoration': 'none', 'font-size': '0.85rem', 'font-family': "'SF Mono', 'Fira Code', monospace" },
      '.api-toc-link:hover': { 'text-decoration': 'underline' },
      '.api-toc-link.hidden': { 'display': 'none' },
      '.api-entry': {
        'background': p.surface, 'border': '1px solid ' + p.light.border, 'border-radius': '8px',
        'padding': '1.25rem 1.5rem', 'margin-bottom': '1rem',
        'transition': 'box-shadow 0.15s', 'overflow': 'hidden'
      },
      '.api-entry:hover': { 'box-shadow': '0 2px 8px rgba(0,0,0,0.06)' },
      '.api-entry.hidden': { 'display': 'none' },
      '.api-sig': {
        'font-family': "'SF Mono', 'Fira Code', monospace", 'font-size': '1rem',
        'font-weight': '600', 'color': p.primary.base, 'margin': '0 0 0.5rem',
        'display': 'flex', 'align-items': 'baseline', 'gap': '0.5rem'
      },
      '.api-anchor': { 'color': p.light.active, 'text-decoration': 'none', 'font-size': '0.85rem' },
      '.api-anchor:hover': { 'color': p.primary.base },
      '.api-desc': { 'margin': '0 0 0.4rem', 'line-height': '1.6', 'color': p.dark.base },
      '.api-usedfor': {
        'background': p.primary.light, 'border-left': '3px solid ' + p.primary.base,
        'padding': '0.5rem 0.75rem', 'margin': '0.5rem 0', 'font-size': '0.9rem',
        'color': p.dark.base, 'border-radius': '0 4px 4px 0', 'line-height': '1.5'
      },
      '.api-params': { 'margin': '0.75rem 0' },
      '.api-param-row': { 'display': 'flex', 'align-items': 'baseline', 'gap': '0.5rem', 'padding': '0.2rem 0', 'flex-wrap': 'wrap' },
      '.api-param-name': { 'font-weight': '600', 'font-size': '0.85rem', 'color': p.dark.base, 'background': p.surfaceAlt, 'padding': '0.1em 0.4em', 'border-radius': '3px' },
      '.api-param-type': {
        'font-size': '0.8rem', 'color': p.primary.base, 'background': p.primary.light,
        'padding': '0.1em 0.4em', 'border-radius': '3px', 'font-family': "'SF Mono', monospace"
      },
      '.api-param-desc': { 'font-size': '0.875rem', 'color': p.secondary.base, 'overflow-wrap': 'anywhere', 'min-width': '0' },
      '.api-returns': { 'font-size': '0.875rem', 'color': p.secondary.base, 'margin': '0.5rem 0' },
      '.api-returns-type': {
        'background': p.primary.light, 'color': p.primary.base, 'padding': '0.1em 0.4em',
        'border-radius': '3px', 'font-weight': '600', 'font-size': '0.8rem'
      },
      '.api-example': { 'margin': '0.75rem 0 0' },
      '.api-example pre': {
        'background': p.dark.base, 'color': p.light.base, 'padding': '1rem 1.25rem',
        'border-radius': '6px', 'overflow-x': 'auto', 'margin': '0',
        'font-family': "'SF Mono', Monaco, 'Cascadia Code', Consolas, monospace",
        'font-size': '0.8125rem', 'line-height': '1.6'
      },
      '.api-see': { 'font-size': '0.85rem', 'color': p.secondary.base, 'margin-top': '0.5rem' },
      '.api-see a': { 'color': p.primary.base },
      '.api-category': { 'margin-top': '2.5rem' },
      '.api-category > h2': { 'border-bottom': '2px solid ' + p.primary.base, 'padding-bottom': '0.5rem', 'color': p.dark.base },
      '.api-category.hidden': { 'display': 'none' },
      '.api-toc-category-link': {
        'display': 'flex', 'align-items': 'center', 'gap': '0.4rem',
        'font-size': '0.8rem', 'font-weight': '700', 'text-transform': 'uppercase',
        'letter-spacing': '0.06em', 'color': p.primary.base, 'text-decoration': 'none',
        'margin': '0 0 0.25rem', 'padding': '0.15rem 0'
      },
      '.api-toc-category-link:hover': { 'text-decoration': 'underline' },
      '.api-toc-count': {
        'background': p.primary.light, 'color': p.primary.base, 'font-size': '0.7rem',
        'padding': '0.05em 0.45em', 'border-radius': '8px', 'font-weight': '600'
      },
      '.api-quicknav': {
        'display': 'grid', 'grid-template-columns': 'repeat(auto-fill, minmax(200px, 1fr))',
        'gap': '0.75rem', 'margin': '1.25rem 0 0.5rem'
      },
      '.api-quicknav-card': {
        'display': 'block', 'background': p.primary.light, 'border': '1px solid ' + p.primary.border,
        'border-radius': '8px', 'padding': '0.75rem 1rem',
        'text-decoration': 'none', 'transition': 'border-color 0.15s, box-shadow 0.15s'
      },
      '.api-quicknav-card:hover': {
        'border-color': p.primary.base, 'box-shadow': '0 2px 8px rgba(0,0,0,0.10)'
      },
      '.api-quicknav-name': {
        'font-weight': '700', 'color': p.primary.base, 'font-size': '0.9rem', 'margin-bottom': '0.15rem'
      },
      '.api-quicknav-count': {
        'font-size': '0.75rem', 'color': p.secondary.base, 'margin-bottom': '0.25rem'
      },
      '.api-quicknav-desc': {
        'font-size': '0.8rem', 'color': p.secondary.base, 'line-height': '1.4'
      },
      '@media (max-width: 768px)': {
        '.api-toc': { 'grid-template-columns': 'repeat(2, 1fr)' },
        '.api-entry': { 'padding': '1rem' },
        '.api-param-row': { 'flex-direction': 'column', 'gap': '0.15rem' },
        '.api-quicknav': { 'grid-template-columns': 'repeat(2, 1fr)' }
      },
      '@media (max-width: 480px)': {
        '.api-toc': { 'grid-template-columns': '1fr' },
        '.api-quicknav': { 'grid-template-columns': '1fr' }
      }
    }`;

// ─── Client-side search script ───────────────────────────────────────────────

const categoryTokens = orderedCategories.map(c => catToken(c.name));

const searchScript = `
(function() {
  var API_CATEGORY_TOKENS = ${JSON.stringify(categoryTokens)};
  var inputs = bw.$('#api-search');
  if (!inputs.length) return;
  inputs[0].addEventListener('input', function() {
    var q = this.value.toLowerCase().trim();

    // The API name is the link's own text and appears in the entry's text, so
    // matching on textContent needs no attribute at all. This previously read
    // a per-entry attribute off 261 of them with a raw document query.
    bw.$('.api-toc-link').forEach(function(link) {
      bw.toggleClass(link, 'hidden',
        !(!q || link.textContent.toLowerCase().indexOf(q) !== -1));
    });

    bw.$('.api-entry').forEach(function(entry) {
      bw.toggleClass(entry, 'hidden',
        !(!q || entry.textContent.toLowerCase().indexOf(q) !== -1));
    });

    // Hide a category whose every entry is filtered out. The category token is
    // on both the section and its entries, so one document-scoped query per
    // category replaces a nested querySelectorAll.
    API_CATEGORY_TOKENS.forEach(function(token) {
      var anyVisible = bw.$('.' + token + '.api-entry:not(.hidden)').length > 0;
      bw.$('.api-category.' + token).forEach(function(cat) {
        bw.toggleClass(cat, 'hidden', !(!q || anyVisible));
      });
    });
  });
})();
`;

// ─── Assemble HTML ───────────────────────────────────────────────────────────

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bitwrench - API Reference</title>
  <link rel="icon" type="image/x-icon" href="/images/favicon.ico">
  <script src="../dist/bitwrench.umd.min.js"><\/script>
  <script src="shared-nav.js"><\/script>
  <script src="site.js"><\/script>
</head>
<body>
  <div id="example-nav"></div>
  <div id="app"></div>

  <script>
    var p = initBitwrenchPage('08-api-reference.html').palette;

    bw.injectCSS(bw.css(${pageCssObj}));

    var appContent = ${appContentJSON};
    bw.DOM('#app', appContent, { raw: true });

    ${searchScript}
  <\/script>
</body>
</html>`;

writeFileSync(outputPath, html, 'utf8');
console.log('Generated pages/08-api-reference.html (' + html.length + ' bytes)');
