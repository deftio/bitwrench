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
      ? exampleTag.description.trim() || extractExampleFromSource(block.source)
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

// ─── Parse component builders from bitwrench-components-v2.js ────────────────

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
      ? exampleTag.description.trim() || extractExampleFromSource(block.source)
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
const compSource = readFileSync(join(__dirname, '..', 'src', 'bitwrench-components-v2.js'), 'utf8');

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

  return {
    t: 'div',
    a: { class: 'api-entry', 'data-api-name': api.name.toLowerCase() },
    c: children
  };
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

// Table of contents
const toc = {
  t: 'div', a: { class: 'api-toc', id: 'api-toc' },
  c: orderedCategories.map(cat => ({
    t: 'div', a: { class: 'api-toc-group' }, c: [
      { t: 'h4', c: cat.name },
      { t: 'div', c: cat.entries.map(e => ({
        t: 'a', a: {
          href: '#' + e.name.replace(/[\.\$]/g, '-'),
          class: 'api-toc-link',
          'data-api-name': e.name.toLowerCase()
        }, c: e.name
      }))}
    ]
  }))
};

// API content sections
const content = {
  t: 'div', a: { id: 'api-entries' },
  c: orderedCategories.map(cat => ({
    t: 'div', a: { class: 'api-category', 'data-category': cat.name },
    c: [
      { t: 'h2', a: { id: 'cat-' + cat.name.toLowerCase().replace(/[^a-z]/g, '-') }, c: cat.name },
      { t: 'div', c: cat.entries.map(makeAPIEntry) }
    ]
  }))
};

// App content TACO (mounted client-side via bw.DOM)
const appContent = {
  t: 'div', c: [
    // Header
    { t: 'div', a: { class: 'page-header' }, c: {
      t: 'div', a: { class: 'content-container wide', style: 'padding-top:0;padding-bottom:0' }, c: [
        { t: 'h1', c: 'API Reference' },
        { t: 'p', a: { class: 'subtitle' },
          c: 'Complete reference for all bitwrench functions, properties, and components' }
      ]
    }},

    // Main content
    { t: 'div', a: { class: 'content-container wide' }, c: [
      // Intro
      { t: 'div', a: { class: 'demo-section' }, c: [
        { t: 'p', c: 'This page documents every public API in bitwrench (' + totalEntries + ' entries, ' + withExamples + ' with code examples). Functions are organized by category. All bw.make*() helpers return TACO objects \u2014 they never touch the DOM directly.' },
        { t: 'p', a: { style: 'font-size:0.9rem;color:#666' },
          c: 'This page is auto-generated by tools/build-api-reference.js using comment-parser, which parses JSDoc from the source files and renders the documentation using bw.html() server-side. The project documents itself with itself.' },
        { t: 'p', a: { style: 'font-size:0.85rem;color:#888' },
          c: 'Generated from bitwrench v' + bw.version + ' on ' + new Date().toISOString().split('T')[0] }
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
        'border': '2px solid #d0d0d0', 'border-radius': '8px', 'outline': 'none',
        'font-family': 'inherit', 'transition': 'border-color 0.15s'
      },
      '.api-search-input:focus': { 'border-color': '#006666' },
      '.api-toc': { 'display': 'grid', 'grid-template-columns': 'repeat(3, 1fr)', 'gap': '0.75rem 2rem', 'margin': '1rem 0 2rem' },
      '.api-toc-group h4': { 'margin': '0 0 0.25rem', 'font-size': '0.75rem', 'text-transform': 'uppercase', 'letter-spacing': '0.06em', 'color': '#888' },
      '.api-toc-link': { 'display': 'block', 'padding': '0.15rem 0', 'color': '#006666', 'text-decoration': 'none', 'font-size': '0.85rem', 'font-family': "'SF Mono', 'Fira Code', monospace" },
      '.api-toc-link:hover': { 'text-decoration': 'underline' },
      '.api-toc-link.hidden': { 'display': 'none' },
      '.api-entry': {
        'background': '#fff', 'border': '1px solid #e4e4e4', 'border-radius': '8px',
        'padding': '1.25rem 1.5rem', 'margin-bottom': '1rem',
        'transition': 'box-shadow 0.15s'
      },
      '.api-entry:hover': { 'box-shadow': '0 2px 8px rgba(0,0,0,0.06)' },
      '.api-entry.hidden': { 'display': 'none' },
      '.api-sig': {
        'font-family': "'SF Mono', 'Fira Code', monospace", 'font-size': '1rem',
        'font-weight': '600', 'color': '#006666', 'margin': '0 0 0.5rem',
        'display': 'flex', 'align-items': 'baseline', 'gap': '0.5rem'
      },
      '.api-anchor': { 'color': '#ccc', 'text-decoration': 'none', 'font-size': '0.85rem' },
      '.api-anchor:hover': { 'color': '#006666' },
      '.api-desc': { 'margin': '0 0 0.4rem', 'line-height': '1.6', 'color': '#333' },
      '.api-usedfor': {
        'background': '#e8f5f3', 'border-left': '3px solid #006666',
        'padding': '0.5rem 0.75rem', 'margin': '0.5rem 0', 'font-size': '0.9rem',
        'color': '#444', 'border-radius': '0 4px 4px 0', 'line-height': '1.5'
      },
      '.api-params': { 'margin': '0.75rem 0' },
      '.api-param-row': { 'display': 'flex', 'align-items': 'baseline', 'gap': '0.5rem', 'padding': '0.2rem 0', 'flex-wrap': 'wrap' },
      '.api-param-name': { 'font-weight': '600', 'font-size': '0.85rem', 'color': '#333', 'background': '#f3f3f3', 'padding': '0.1em 0.4em', 'border-radius': '3px' },
      '.api-param-type': {
        'font-size': '0.8rem', 'color': '#006666', 'background': '#e8f5f3',
        'padding': '0.1em 0.4em', 'border-radius': '3px', 'font-family': "'SF Mono', monospace"
      },
      '.api-param-desc': { 'font-size': '0.875rem', 'color': '#555' },
      '.api-returns': { 'font-size': '0.875rem', 'color': '#555', 'margin': '0.5rem 0' },
      '.api-returns-type': {
        'background': '#e8f5f3', 'color': '#006666', 'padding': '0.1em 0.4em',
        'border-radius': '3px', 'font-weight': '600', 'font-size': '0.8rem'
      },
      '.api-example': { 'margin': '0.75rem 0 0' },
      '.api-example pre': {
        'background': '#1e293b', 'color': '#e2e8f0', 'padding': '1rem 1.25rem',
        'border-radius': '6px', 'overflow-x': 'auto', 'margin': '0',
        'font-family': "'SF Mono', Monaco, 'Cascadia Code', Consolas, monospace",
        'font-size': '0.8125rem', 'line-height': '1.6'
      },
      '.api-see': { 'font-size': '0.85rem', 'color': '#888', 'margin-top': '0.5rem' },
      '.api-see a': { 'color': '#006666' },
      '.api-category': { 'margin-top': '2.5rem' },
      '.api-category > h2': { 'border-bottom': '2px solid #006666', 'padding-bottom': '0.5rem', 'color': '#333' },
      '.api-category.hidden': { 'display': 'none' },
      '@media (max-width: 768px)': {
        '.api-toc': { 'grid-template-columns': 'repeat(2, 1fr)' },
        '.api-entry': { 'padding': '1rem' },
        '.api-param-row': { 'flex-direction': 'column', 'gap': '0.15rem' }
      },
      '@media (max-width: 480px)': {
        '.api-toc': { 'grid-template-columns': '1fr' }
      }
    }`;

// ─── Client-side search script ───────────────────────────────────────────────

const searchScript = `
(function() {
  var input = document.getElementById('api-search');
  if (!input) return;
  input.addEventListener('input', function() {
    var q = this.value.toLowerCase().trim();
    // Filter TOC links
    var tocLinks = document.querySelectorAll('.api-toc-link');
    for (var i = 0; i < tocLinks.length; i++) {
      var name = tocLinks[i].getAttribute('data-api-name') || '';
      if (!q || name.indexOf(q) !== -1) {
        tocLinks[i].classList.remove('hidden');
      } else {
        tocLinks[i].classList.add('hidden');
      }
    }
    // Filter API entry cards
    var entries = document.querySelectorAll('.api-entry');
    for (var j = 0; j < entries.length; j++) {
      var apiName = entries[j].getAttribute('data-api-name') || '';
      var text = entries[j].textContent.toLowerCase();
      if (!q || apiName.indexOf(q) !== -1 || text.indexOf(q) !== -1) {
        entries[j].classList.remove('hidden');
      } else {
        entries[j].classList.add('hidden');
      }
    }
    // Hide empty category sections
    var cats = document.querySelectorAll('.api-category');
    for (var k = 0; k < cats.length; k++) {
      var visibleEntries = cats[k].querySelectorAll('.api-entry:not(.hidden)');
      if (!q || visibleEntries.length > 0) {
        cats[k].classList.remove('hidden');
      } else {
        cats[k].classList.add('hidden');
      }
    }
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
  <script src="../dist/bitwrench.umd.js"><\/script>
  <link rel="stylesheet" href="../dist/bitwrench.css">
  <link rel="stylesheet" href="shared-theme.css">
  <script src="shared-nav.js"><\/script>
</head>
<body>
  <div id="example-nav"></div>
  <div id="app"></div>

  <script>
    mountExampleNav('#example-nav', '08-api-reference.html');

    bw.injectCSS(bw.css(${pageCssObj}));

    var appContent = ${appContentJSON};
    bw.DOM('#app', appContent, { raw: true });

    ${searchScript}
  <\/script>
</body>
</html>`;

writeFileSync(outputPath, html, 'utf8');
console.log('Generated pages/08-api-reference.html (' + html.length + ' bytes)');
