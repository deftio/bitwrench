#!/usr/bin/env node
/**
 * Build dist/bitwrench_api_v{VERSION}.md by parsing JSDoc from source files.
 * Reuses the same parsing approach as build-api-reference.js.
 *
 * Usage: node tools/build-api-markdown.js
 */

import bw from '../src/bitwrench.js';
import { parse } from 'comment-parser';
import { readFileSync, writeFileSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const version = bw.version;
const outputPath = join(__dirname, '..', 'docs', 'bitwrench_api.md');

// ─── JSDoc Parser ────────────────────────────────────────────────────────────

function parseAPIs(source, defaultCategory) {
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

    const funcMatch = funcLine.match(/^(bw\.\$?[\w.]+)\s*=\s*(function\s*\(([^)]*)\)|(\{|bw\.\w+))/);
    if (!funcMatch) continue;

    const name = funcMatch[1];
    const isFunction = funcMatch[2] && funcMatch[2].startsWith('function');
    const params_str = funcMatch[3] || '';

    if (name.includes('._') && name !== 'bw.$.one') continue;
    if (block.tags.some(t => t.tag === 'private')) continue;

    const desc = block.description.trim();

    const params = block.tags
      .filter(t => t.tag === 'param')
      .map(t => [t.name, t.type || '', t.description || '']);

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

    const sig = isFunction ? name + '(' + params_str.trim() + ')' : name;

    entries.push({ name, sig, desc, params, returns, example, category });
  }

  return entries;
}

function extractExampleFromSource(sourceLines) {
  let capturing = false;
  const lines = [];
  for (const s of sourceLines) {
    const raw = s.source;
    if (raw.includes('@example')) { capturing = true; continue; }
    if (capturing) {
      if (raw.match(/^\s*\*\s*@/)) break;
      if (raw.match(/^\s*\*\//)) break;
      const cleaned = raw.replace(/^\s*\*\s?/, '');
      lines.push(cleaned);
    }
  }
  return lines.join('\n').trim() || null;
}

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

    entries.push({
      name,
      sig: name + '(' + params_str.trim() + ')',
      desc,
      params,
      returns,
      example,
      category
    });
  }

  return entries;
}

// ─── Read and parse ──────────────────────────────────────────────────────────

const srcDir = join(__dirname, '..', 'src');
const sourceFiles = [
  { path: join(srcDir, 'bitwrench.js'), category: 'Core' },
  { path: join(srcDir, 'bitwrench-bccl.js'), category: 'Component Builders' }
];

const v2Source = readFileSync(sourceFiles[0].path, 'utf8');
const compSource = readFileSync(sourceFiles[1].path, 'utf8');

const coreAPIs = parseAPIs(v2Source, 'Core');
const componentAPIs = parseComponents(compSource, 'Component Builders');
const allAPIs = [...coreAPIs, ...componentAPIs];

// ─── Categorize ──────────────────────────────────────────────────────────────

const categoryOrder = [
  'Core', 'DOM Generation', 'DOM Selection', 'Identifiers',
  'State Management', 'Events (DOM)', 'Pub/Sub',
  'CSS & Styling', 'Component Builders',
  'Color', 'Math', 'Array Utilities', 'Text Generation',
  'Timing', 'Browser Utilities', 'File I/O',
  'Component Handles'
];

const grouped = {};
allAPIs.forEach(api => {
  const cat = api.category || 'Other';
  if (!grouped[cat]) grouped[cat] = [];
  grouped[cat].push(api);
});

const orderedCategories = categoryOrder
  .filter(c => grouped[c] && grouped[c].length > 0)
  .map(c => ({ name: c, entries: grouped[c] }));

Object.keys(grouped).forEach(c => {
  if (!categoryOrder.includes(c)) {
    orderedCategories.push({ name: c, entries: grouped[c] });
  }
});

// ─── Source file stats ───────────────────────────────────────────────────────

function countLines(filePath) {
  return readFileSync(filePath, 'utf8').split('\n').length;
}

const sourceStats = sourceFiles.map(f => ({
  file: f.path.split('/').pop(),
  lines: countLines(f.path)
}));

// ─── Generate Markdown ──────────────────────────────────────────────────────

const lines = [];
const today = new Date().toISOString().split('T')[0];

lines.push('# Bitwrench API Reference');
lines.push('');
lines.push('## Summary');
lines.push('');
lines.push('| Field | Value |');
lines.push('|-------|-------|');
lines.push('| Version | ' + version + ' |');
lines.push('| Generated | ' + today + ' |');
lines.push('| Total APIs | ' + allAPIs.length + ' |');
lines.push('| Categories | ' + orderedCategories.length + ' |');

for (const s of sourceStats) {
  lines.push('| ' + s.file + ' | ' + s.lines + ' lines |');
}

lines.push('');

// Table of contents
lines.push('## Table of Contents');
lines.push('');
for (const cat of orderedCategories) {
  const anchor = cat.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  lines.push('- [' + cat.name + '](#' + anchor + ') (' + cat.entries.length + ')');
}
lines.push('');
lines.push('---');
lines.push('');

// Per-category sections
for (const cat of orderedCategories) {
  lines.push('## ' + cat.name);
  lines.push('');

  for (const api of cat.entries) {
    lines.push('### `' + api.sig + '`');
    lines.push('');

    if (api.desc) {
      lines.push(api.desc);
      lines.push('');
    }

    if (api.params && api.params.length) {
      lines.push('**Parameters:**');
      lines.push('');
      lines.push('| Name | Type | Description |');
      lines.push('|------|------|-------------|');
      for (const p of api.params) {
        lines.push('| `' + p[0] + '` | ' + (p[1] ? '`' + p[1] + '`' : '') + ' | ' + (p[2] || '') + ' |');
      }
      lines.push('');
    }

    if (api.returns) {
      lines.push('**Returns:** `' + api.returns.type + '`' + (api.returns.desc ? ' \u2014 ' + api.returns.desc : ''));
      lines.push('');
    }

    if (api.example) {
      lines.push('**Example:**');
      lines.push('```javascript');
      lines.push(api.example);
      lines.push('```');
      lines.push('');
    }

    lines.push('---');
    lines.push('');
  }
}

const md = lines.join('\n');
writeFileSync(outputPath, md, 'utf8');
console.log('Generated ' + outputPath.split('/').pop() + ' (' + allAPIs.length + ' entries, ' + md.length + ' bytes)');
