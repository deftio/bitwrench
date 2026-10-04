/**
 * Shared JSDoc extraction for the API docs generators.
 *
 * `build-api-markdown.js` (docs/bitwrench_api.md) and `build-api-reference.js`
 * (pages/08-api-reference.html) used to carry the same parser twice, with the
 * same blind spots. Both were missing 49 of 166 public functions, including
 * `bw.$`, `bw.DOM`, `bw.router` and every colour, array and file helper, which
 * is how the reference could look complete and not be.
 *
 * Shapes this recognises, each preceded by a JSDoc block:
 *
 *   bw.mount = function(target, taco) {}      // plain assignment
 *   bw.$ = function(selector, apply) {}       // $ in the name
 *     bw.router = function(config) {}         // indented (module installers)
 *   bw.DOM = bw.mount;                        // alias
 *   bw.typeOf = _typeOf;                      // re-export of an internal
 *   bw.clear = (ref) => {};                   // arrow
 *   export function makeCard(props) {}        // BCCL factory
 *
 * Signatures come from the source when it is a function literal, and from the
 * @param tags otherwise (an alias has no parameter list of its own).
 */

import { parse } from 'comment-parser';
import { readFileSync } from 'fs';

// bw.name = <something>, optionally indented, name may be `$`
const ASSIGN = /^\s*(bw\.(?:\$|[\w$]+)(?:\.[\w$]+)*)\s*=\s*(.*)$/;
// function literal on the right-hand side: function(a, b) / (a, b) => / a =>
const FN_LITERAL = /^(?:async\s+)?(?:function\s*\*?\s*)?\(([^)]*)\)\s*(?:=>)?|^(?:async\s+)?([\w$]+)\s*=>/;
const BCCL_FN = /^\s*(?:export\s+)?function\s+(make\w+)\s*\(([^)]*)\)/;
// `export function hexToHsl(hex)` in a helper module, re-exported as bw.hexToHsl.
// The doc lives with the implementation; this reads it from there rather than
// asking for a second copy at the assignment site.
const EXPORT_FN = /^\s*export\s+function\s+([\w$]+)\s*\(([^)]*)\)/;
// `getVersion: function() {}` inside the bw object literal. Only counted when
// bw exposes that name, so a component handle's `sort:` is not mistaken for one.
const LITERAL_FN = /^\s*([\w$]+)\s*:\s*function\s*\(([^)]*)\)/;

function tagsOf(block) {
  const params = block.tags
    .filter((t) => t.tag === 'param')
    .map((t) => [t.name, t.type || '', t.description || '']);

  const returnsTag = block.tags.find((t) => t.tag === 'returns' || t.tag === 'return');
  const exampleTag = block.tags.find((t) => t.tag === 'example');
  const categoryTag = block.tags.find((t) => t.tag === 'category');

  return {
    params,
    returns: returnsTag ? { type: returnsTag.type || '', desc: returnsTag.description || '' } : null,
    example: exampleTag ? (exampleTag.description || '').trim() : null,
    category: categoryTag
      ? categoryTag.name + (categoryTag.description ? ' ' + categoryTag.description : '')
      : null
  };
}

// The first non-empty, non-comment line after the JSDoc block, with its
// 1-based line number: the thing the block documents, and where it lives.
function lineAfter(lines, block) {
  const end = block.source[block.source.length - 1].number;
  for (let i = end + 1; i < lines.length && i < end + 8; i++) {
    const t = lines[i].trim();
    // Skip blank lines and ordinary comments: several APIs carry a `//` note
    // between the JSDoc block and the assignment (bw.$ is one).
    if (!t || t.startsWith('//') || t.startsWith('/*') || t.startsWith('*')) continue;
    return { text: lines[i], line: i + 1 };
  }
  return { text: '', line: 0 };
}

// Params for a signature: from the literal when there is one, else from @param.
// An IIFE (`bw.actions = (function() { ... })()`) is a namespace object, not a
// callable with those parameters, so it is treated as a value.
function signature(name, rhs, params) {
  const iife = /^\(\s*(?:function|\()/.test(rhs);
  const lit = iife ? null : FN_LITERAL.exec(rhs);
  if (lit) {
    const args = lit[1] !== undefined ? lit[1] : lit[2];
    return name + '(' + (args || '').trim().replace(/\s+/g, ' ') + ')';
  }
  if (params.length) {
    return name + '(' + params.map((p) => p[0]).join(', ') + ')';
  }
  return name;   // a value, not a function
}

/**
 * Extract documented APIs from one source file.
 *
 * @param {string} path - Source file
 * @param {string} defaultCategory - Category for blocks with no @category tag
 * @param {Object} [opts] - { bccl: true } to also read `export function makeX`;
 *   { publicNames: Set } to also read `export function x` when bw.x is public
 * @returns {Array<Object>} { name, sig, desc, params, returns, example, category }
 */
export function extractFromFile(path, defaultCategory, opts = {}) {
  const source = readFileSync(path, 'utf8');
  const lines = source.split('\n');
  const out = [];

  for (const block of parse(source)) {
    if (block.tags.some((t) => t.tag === 'private')) continue;

    const desc = block.description.trim();
    const t = tagsOf(block);
    const at = lineAfter(lines, block);
    const after = at.text;
    const where = { file: path, line: at.line };

    const bccl = opts.bccl && BCCL_FN.exec(after);
    if (bccl) {
      out.push({
        name: 'bw.' + bccl[1],
        sig: 'bw.' + bccl[1] + '(' + bccl[2].trim() + ')',
        desc: desc || 'Create ' + bccl[1].replace('make', '').toLowerCase() + ' component.',
        params: t.params,
        returns: t.returns || { type: 'Object', desc: 'TACO object' },
        example: t.example,
        category: t.category || defaultCategory,
        file: where.file,
        line: where.line
      });
      continue;
    }

    // A helper module's exported function, re-exported onto bw under the
    // same name. Only counted when bw actually exposes it.
    const exp = opts.publicNames && EXPORT_FN.exec(after);
    if (exp && opts.publicNames.has(exp[1])) {
      out.push({
        name: 'bw.' + exp[1],
        sig: 'bw.' + exp[1] + '(' + exp[2].trim().replace(/\s+/g, ' ') + ')',
        desc,
        params: t.params,
        returns: t.returns,
        example: t.example,
        category: t.category || defaultCategory,
        file: where.file,
        line: where.line
      });
      continue;
    }

    const lit = opts.publicNames && LITERAL_FN.exec(after);
    if (lit && opts.publicNames.has(lit[1])) {
      out.push({
        name: 'bw.' + lit[1],
        sig: 'bw.' + lit[1] + '(' + lit[2].trim().replace(/\s+/g, ' ') + ')',
        desc,
        params: t.params,
        returns: t.returns,
        example: t.example,
        category: t.category || defaultCategory,
        file: where.file,
        line: where.line
      });
      continue;
    }

    const m = ASSIGN.exec(after);
    if (!m) continue;

    const name = m[1];
    if (name.includes('._') && name !== 'bw.$.one') continue;   // internals
    if (/^bw\._/.test(name)) continue;

    out.push({
      name,
      sig: signature(name, m[2].trim(), t.params),
      desc,
      params: t.params,
      returns: t.returns,
      example: t.example,
      category: t.category || defaultCategory,
      file: where.file,
      line: where.line
    });
  }

  return out;
}

/**
 * Every source file that contributes public API, with its fallback category.
 * Keep this list in step with what `src/` attaches to `bw`.
 *
 * @param {string} srcDir - Path to src/
 * @returns {Array<Object>} { path, category, bccl }
 */
export function apiSources(srcDir) {
  const j = (f) => srcDir.replace(/\/$/, '') + '/' + f;
  return [
    { path: j('bitwrench.js'), category: 'Core' },
    { path: j('bitwrench-bccl.js'), category: 'Component Builders', bccl: true },
    { path: j('bitwrench-router.js'), category: 'Routing' },
    { path: j('bitwrench-file-ops.js'), category: 'File I/O' },
    { path: j('bitwrench-color-utils.js'), category: 'Color Utilities' },
    { path: j('bitwrench-utils.js'), category: 'Utilities' },
    { path: j('bitwrench-styles.js'), category: 'CSS & Styling' }
  ];
}

// How much documentation an entry actually carries. Used to pick a winner when
// the same API is documented twice: a re-export in bitwrench.js often carries
// only `@see the implementation`, while the helper module has the real block.
function richness(e) {
  return (e.desc ? e.desc.length : 0) + e.params.length * 20 +
    (e.returns ? 20 : 0) + (e.example ? 40 : 0);
}

/**
 * Extract from every API source, de-duplicated by name. When the same name is
 * documented in two places, the fuller block wins.
 *
 * @param {string} srcDir - Path to src/
 * @param {Set<string>} [publicNames] - Names bw exposes; lets helper modules'
 *   `export function x` count as documentation for bw.x
 * @returns {Array<Object>} API entries
 */
export function extractAll(srcDir, publicNames) {
  const seen = {};
  const out = [];
  for (const src of apiSources(srcDir)) {
    let entries;
    try {
      entries = extractFromFile(src.path, src.category, Object.assign({ publicNames: publicNames }, src));
    } catch (e) {
      continue;   // optional file
    }
    for (const e of entries) {
      const prev = seen[e.name];
      if (!prev) {
        seen[e.name] = e;
        out.push(e);
      } else if (richness(e) > richness(prev)) {
        out[out.indexOf(prev)] = e;
        seen[e.name] = e;
      }
    }
  }
  return out;
}
