#!/usr/bin/env node
/**
 * build-css-class-inventory.js
 *
 * Generate a complete, review-oriented inventory of bitwrench CSS classes.
 * Sources:
 *   - structural + utility rules from bitwrench-styles.js
 *   - default themed rules from bitwrench-styles.js
 *   - code-editor addon CSS_TEXT
 *   - BCCL/core factory source (component cross-reference)
 *   - repository source/docs/pages/examples usage
 *
 * Usage:
 *   node tools/build-css-class-inventory.js
 *   node tools/build-css-class-inventory.js --canvas /absolute/path/name.canvas.tsx
 *
 * Outputs:
 *   dev/bitwrench-css-class-inventory.md
 */

import {
  defaultStyles,
  getStructuralStyles,
  generateThemedCSS,
  generateAlternateCSS,
  resolveLayout,
  DEFAULT_PALETTE_CONFIG
} from '../src/bitwrench-styles.js';
import { derivePalette } from '../src/bitwrench-color-utils.js';
import { CSS_TEXT as CODE_EDITOR_CSS } from '../src/bitwrench-code-edit.js';
import { utilCSS } from '../src/bitwrench-util-css.js';
import {
  readFileSync,
  writeFileSync,
  readdirSync,
  statSync,
  existsSync
} from 'fs';
import { dirname, extname, join, relative, resolve } from 'path';
import { fileURLToPath } from 'url';

var __dirname = dirname(fileURLToPath(import.meta.url));
var ROOT = resolve(__dirname, '..');
var OUT = join(ROOT, 'dev', 'bitwrench-css-class-inventory.md');

var args = process.argv.slice(2);
var canvasPath = null;
for (var ai = 0; ai < args.length; ai++) {
  if (args[ai] === '--canvas' && args[ai + 1]) canvasPath = resolve(args[++ai]);
}

var records = new Map();

function ensureRecord(name) {
  if (!records.has(name)) {
    records.set(name, {
      name: name,
      layers: new Set(),
      categories: new Set(),
      selectors: new Map(),
      components: new Set(),
      usageFiles: new Set(),
      sourceTokens: new Set()
    });
  }
  return records.get(name);
}

function classesInSelector(selector) {
  var out = [];
  var re = /\.([A-Za-z_][A-Za-z0-9_-]*)/g;
  var match;
  while ((match = re.exec(selector))) {
    out.push(match[1]);
  }
  return Array.from(new Set(out));
}

function isDeclarationObject(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  var vals = Object.values(value);
  return vals.length === 0 || vals.some(function(v) {
    return typeof v === 'string' || typeof v === 'number';
  });
}

function addRule(selector, declarations, layer, category) {
  selector.split(',').map(function(part) { return part.trim(); }).filter(Boolean).forEach(function(part) {
    classesInSelector(part).forEach(function(cls) {
      var rec = ensureRecord(cls);
      rec.layers.add(layer);
      if (category) rec.categories.add(category);
      if (!rec.selectors.has(part)) rec.selectors.set(part, declarations || {});
    });
  });
}

function walkRuleObject(obj, layer, category) {
  if (!obj || typeof obj !== 'object') return;
  Object.keys(obj).forEach(function(key) {
    var value = obj[key];
    if (key.charAt(0) === '@') {
      walkRuleObject(value, layer, category);
    } else if (isDeclarationObject(value)) {
      addRule(key, value, layer, category);
    } else if (value && typeof value === 'object') {
      walkRuleObject(value, layer, category);
    }
  });
}

// Structural category attribution from the categorized compatibility view.
Object.keys(defaultStyles).forEach(function(category) {
  walkRuleObject(defaultStyles[category], 'structural', category);
});

// Catch generated utility/alias selectors not represented by defaultStyles.
walkRuleObject(getStructuralStyles(), 'structural', 'generated-utility-or-alias');

var palette = derivePalette(DEFAULT_PALETTE_CONFIG);
var layout = resolveLayout({});
walkRuleObject(generateThemedCSS('', palette, layout), 'themed', 'default-theme');

// Alternate mode reuses the themed class set under this core scope token.
// Record the scope without duplicating every alternate selector in the detail.
var alternate = generateAlternateCSS('', palette, layout);
if (alternate && Object.keys(alternate).length) {
  var altRec = ensureRecord('bw_theme_alt');
  altRec.layers.add('themed-scope');
  altRec.categories.add('alternate-theme');
  altRec.selectors.set('.bw_theme_alt', {});
}

// The code editor owns a separate literal stylesheet.
function parseLiteralCSS(css, layer, category) {
  var ruleRe = /([^{}]+)\{([^{}]*)\}/g;
  var m;
  while ((m = ruleRe.exec(css))) {
    var selector = m[1].trim();
    if (!selector || selector.charAt(0) === '@') continue;
    var declarations = {};
    m[2].split(';').forEach(function(part) {
      var idx = part.indexOf(':');
      if (idx === -1) return;
      var prop = part.slice(0, idx).trim();
      var val = part.slice(idx + 1).trim();
      if (prop) declarations[prop] = val;
    });
    addRule(selector, declarations, layer, category);
  }
}
parseLiteralCSS(CODE_EDITOR_CSS, 'code-editor', 'code-editor-addon');

// Shipped non-runtime CSS channels. These are kept separate from the modern
// loadStyles pipeline so legacy/global selectors remain obvious in review.
function extractTemplateConstant(sourcePath, name) {
  var source = readFileSync(sourcePath, 'utf8');
  var re = new RegExp('(?:const|var)\\s+' + name + '\\s*=\\s*`([\\s\\S]*?)`;');
  var match = re.exec(source);
  return match ? match[1] : '';
}
parseLiteralCSS(
  extractTemplateConstant(join(ROOT, 'src', 'generate-css.js'), 'additionalCSS'),
  'legacy-static-css',
  'dist-bitwrench-css-legacy'
);
parseLiteralCSS(
  extractTemplateConstant(join(ROOT, 'src', 'cli', 'layout-default.js'), 'BASE_PAGE_CSS'),
  'cli-css',
  'cli-page-output'
);

// util-css generates names but deliberately injects no stylesheet. Enumerate
// fixed outputs plus wildcard families so mismatches with core utility rules
// (for example bw_flex_col vs bw_flex_column) are inspectable.
var utilStaticTokens = [
  'flex', 'flexCol', 'flexRow', 'flexWrap', 'block', 'inline', 'hidden',
  'bold', 'semibold', 'italic', 'textCenter', 'textRight', 'justifyCenter',
  'justifyBetween', 'justifyEnd', 'alignCenter', 'alignStart', 'alignEnd',
  'wFull', 'hFull', 'transition', 'textSm', 'textBase', 'textLg', 'textXl',
  'text2xl', 'text3xl'
];
utilCSS.cls(utilStaticTokens.join(' ')).split(/\s+/).filter(Boolean).forEach(function(name) {
  var rec = ensureRecord(name);
  rec.layers.add('util-css-output');
  rec.categories.add('util-css-static-token');
});
[
  'bw_p_*', 'bw_pt_*', 'bw_pb_*', 'bw_pl_*', 'bw_pr_*', 'bw_px_*', 'bw_py_*',
  'bw_m_*', 'bw_mt_*', 'bw_mb_*', 'bw_ml_*', 'bw_mr_*', 'bw_mx_*', 'bw_my_*',
  'bw_gap_*', 'bw_w_*', 'bw_h_*', 'bw_rounded_*',
  'bw_bg-*', 'bw_text-*', 'bw_custom_*'
].forEach(function(name) {
  var rec = ensureRecord(name);
  rec.layers.add('util-css-output');
  rec.categories.add('dynamic-util-css-family');
});

// Runtime-only machine class tokens: important to document even though they
// do not necessarily have a stylesheet rule.
[
  ['bw_lc', 'runtime', 'lifecycle-marker'],
  ['bw_is_component', 'runtime', 'component-marker'],
  ['bw_is_component_*', 'runtime', 'typed-component-marker'],
  ['bw_uuid_*', 'runtime', 'generated-identity'],
  ['bw_act_*', 'runtime', 'action-token'],
  ['bw_fn_*', 'runtime', 'serialized-handler-token'],
  ['bw_slot_*', 'runtime', 'slot-token']
].forEach(function(item) {
  var rec = ensureRecord(item[0]);
  rec.layers.add(item[1]);
  rec.categories.add(item[2]);
});

// Map class tokens found inside each make* factory to that component. Prefix
// tokens such as "bw_spinner_" match generated variants in the CSS inventory.
function extractFunctionSegments(source, pattern) {
  var starts = [];
  var m;
  while ((m = pattern.exec(source))) {
    starts.push({ name: m[1], index: m.index });
  }
  return starts.map(function(start, i) {
    return {
      name: start.name,
      body: source.slice(start.index, i + 1 < starts.length ? starts[i + 1].index : source.length)
    };
  });
}

function tokensInSource(text) {
  var tokens = new Set();
  // Function segments include the next factory's leading JSDoc; comments are
  // not emitted output and would otherwise create false component mappings.
  text = text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
  var re = /\bbw_[A-Za-z0-9_]+/g;
  var m;
  while ((m = re.exec(text))) {
    if (m[0].length > 3) tokens.add(m[0]);
  }
  return tokens;
}

var factoryTokens = new Map();
var bcclSource = readFileSync(join(ROOT, 'src', 'bitwrench-bccl.js'), 'utf8');
extractFunctionSegments(bcclSource, /export function (make[A-Z]\w*)\s*\(/g)
  .forEach(function(seg) {
    factoryTokens.set(seg.name, tokensInSource(seg.body));
  });

var coreSource = readFileSync(join(ROOT, 'src', 'bitwrench.js'), 'utf8');
extractFunctionSegments(coreSource, /bw\.(make(?:Table|TableFromArray|DataTable|BarChart))\s*=\s*function/g)
  .forEach(function(seg) {
    factoryTokens.set(seg.name, tokensInSource(seg.body));
  });

// Preserve emitted classes that currently have no matching CSS selector. They
// are especially valuable in this audit: an unstyled emitted token may be a
// stale class, a state hook, or a missing rule. Dynamic prefixes are recorded
// as explicit wildcard families.
factoryTokens.forEach(function(tokens, component) {
  tokens.forEach(function(token) {
    var name = token.charAt(token.length - 1) === '_' ? token + '*' : token;
    var rec = ensureRecord(name);
    rec.layers.add('factory-output');
    rec.categories.add(name.indexOf('*') !== -1 ? 'dynamic-factory-prefix' : 'factory-token');
    rec.components.add(component);
    rec.sourceTokens.add(token);
  });
});

// Emitted classes that the bw_-only source token scan cannot represent.
[
  ['bw_bccl_container-fluid', ['makeContainer'], 'factory-token'],
  ['active', ['makeNav', 'makeNavbar', 'makeTabs', 'makeListGroup', 'makeCarousel'], 'state-token'],
  ['disabled', ['makeNav', 'makeListGroup'], 'state-token'],
  ['mb-3', ['makeDataTable'], 'bootstrap-leftover'],
  ['table-responsive', ['makeDataTable'], 'bootstrap-leftover'],
  ['table-container', ['makeDataTable'], 'bootstrap-leftover'],
  ['language-*', ['makeCodeDemo'], 'external-highlighter-hook']
].forEach(function(item) {
  var rec = ensureRecord(item[0]);
  rec.layers.add('factory-output');
  rec.categories.add(item[2]);
  item[1].forEach(function(component) { rec.components.add(component); });
});

function tokenMatchesClass(token, cls) {
  if (token === cls) return true;
  return token.charAt(token.length - 1) === '_' && cls.indexOf(token) === 0;
}

records.forEach(function(rec) {
  factoryTokens.forEach(function(tokens, component) {
    tokens.forEach(function(token) {
      if (tokenMatchesClass(token, rec.name)) {
        rec.components.add(component);
        rec.sourceTokens.add(token);
      }
    });
  });
});

// Known selector families make component mapping complete even when factory
// strings are assembled through helpers or variantClass().
var COMPONENT_FAMILIES = [
  [/^bw_bccl_card|^bw_card_/, ['makeCard']],
  [/^bw_bccl_btn(?:_|$)|^bw_btn_/, ['makeButton', 'makeButtonGroup', 'makeDropdown']],
  [/^bw_bccl_container/, ['makeContainer']],
  [/^bw_row$|^bw_g_\d|^bw_col(?:_|$)|^bw_offset_/, ['makeRow', 'makeCol']],
  [/^bw_stack/, ['makeStack']],
  [/^bw_bccl_nav(?:_|$)|^bw_nav(?:_|$)/, ['makeNav']],
  [/^bw_bccl_navbar|^bw_navbar/, ['makeNavbar']],
  [/^bw_bccl_tabs|^bw_tab_/, ['makeTabs']],
  [/^bw_bccl_alert/, ['makeAlert']],
  [/^bw_bccl_badge/, ['makeBadge']],
  [/^bw_bccl_progress/, ['makeProgress']],
  [/^bw_bccl_list|^bw_list_group/, ['makeListGroup']],
  [/^bw_bccl_breadcrumb|^bw_breadcrumb/, ['makeBreadcrumb']],
  [/^bw_form(?:_|$)|^bw_valid|^bw_invalid/, ['makeForm', 'makeFormGroup', 'makeInput', 'makeTextarea', 'makeSelect', 'makeCheckbox', 'makeRadio']],
  [/^bw_switch/, ['makeSwitch']],
  [/^bw_spinner/, ['makeSpinner']],
  [/^bw_bccl_hero/, ['makeHero']],
  [/^bw_feature/, ['makeFeatureGrid']],
  [/^bw_cta/, ['makeCTA']],
  [/^bw_section/, ['makeSection']],
  [/^bw_code/, ['makeCodeDemo', 'codeEditor']],
  [/^bw_ce/, ['codeEditor']],
  [/^bw_bccl_pagination/, ['makePagination']],
  [/^bw_bccl_accordion/, ['makeAccordion']],
  [/^bw_bccl_modal|^bw_close/, ['makeModal']],
  [/^bw_bccl_toast/, ['makeToast']],
  [/^bw_bccl_dropdown/, ['makeDropdown']],
  [/^bw_skeleton/, ['makeSkeleton']],
  [/^bw_avatar/, ['makeAvatar']],
  [/^bw_bccl_carousel/, ['makeCarousel']],
  [/^bw_stat/, ['makeStatCard']],
  [/^bw_tooltip|^bw_bccl_tooltip/, ['makeTooltip']],
  [/^bw_popover|^bw_bccl_popover/, ['makePopover']],
  [/^bw_search|^bw_bccl_search/, ['makeSearchInput']],
  [/^bw_range/, ['makeRange']],
  [/^bw_media/, ['makeMediaObject']],
  [/^bw_file_upload/, ['makeFileUpload']],
  [/^bw_timeline/, ['makeTimeline']],
  [/^bw_step/, ['makeStepper']],
  [/^bw_chip/, ['makeChipInput']],
  [/^bw_bccl_table|^bw_table(?:_|$)|^bw_sort_/, ['makeTable', 'makeTableFromArray', 'makeDataTable']],
  [/^bw_bar_chart/, ['makeBarChart']]
];

records.forEach(function(rec) {
  COMPONENT_FAMILIES.forEach(function(entry) {
    if (entry[0].test(rec.name)) entry[1].forEach(function(c) { rec.components.add(c); });
  });
});

// Map shared modifiers to the components they visibly affect. Keep this
// one-way: propagating modifier relationships back into component roots would
// make every .bw_primary selector appear to turn every component into every
// other component.
var SHARED_MODIFIER_RE = /^bw_(primary|secondary|tertiary|success|danger|warning|info|light|dark|active|show|disabled|valid|invalid)$/;
records.forEach(function(rec) {
  if (!SHARED_MODIFIER_RE.test(rec.name)) return;
  rec.selectors.forEach(function(_decl, selector) {
    classesInSelector(selector).forEach(function(cls) {
      if (cls === rec.name) return;
      var other = records.get(cls);
      if (other) other.components.forEach(function(c) { rec.components.add(c); });
    });
  });
});

records.forEach(function(rec) {
  if (rec.layers.has('runtime')) rec.components.clear();
});

// Repository usage index (source-facing files only; omit generated bundles and
// archives so counts remain useful to a reviewer).
var SEARCH_ROOTS = ['src', 'docs', 'pages', 'examples', 'blog', 'test', 'tests', 'tools'];
var SEARCH_EXTS = new Set(['.js', '.mjs', '.cjs', '.ts', '.html', '.md', '.css', '.yml', '.yaml']);

function walkFiles(abs, out) {
  if (!existsSync(abs)) return;
  var st = statSync(abs);
  if (st.isFile()) {
    if (SEARCH_EXTS.has(extname(abs))) out.push(abs);
    return;
  }
  readdirSync(abs, { withFileTypes: true }).forEach(function(ent) {
    if (ent.name === 'node_modules' || ent.name === 'dist' || ent.name === 'releases' || ent.name === 'archive') return;
    walkFiles(join(abs, ent.name), out);
  });
}

var usageFiles = [];
SEARCH_ROOTS.forEach(function(dir) { walkFiles(join(ROOT, dir), usageFiles); });
usageFiles.forEach(function(file) {
  if (file === fileURLToPath(import.meta.url)) return;
  var text;
  try { text = readFileSync(file, 'utf8'); } catch (e) { return; }
  var found = new Set();
  var re = /\b[A-Za-z_][A-Za-z0-9_*-]*/g;
  var m;
  while ((m = re.exec(text))) found.add(m[0]);
  found.forEach(function(token) {
    var rec = records.get(token);
    if (rec) rec.usageFiles.add(relative(ROOT, file));
  });
  records.forEach(function(rec) {
    if (rec.name.charAt(rec.name.length - 1) !== '*') return;
    var prefix = rec.name.slice(0, -1);
    if (Array.from(found).some(function(token) { return token.indexOf(prefix) === 0; })) {
      rec.usageFiles.add(relative(ROOT, file));
    }
  });
});

var PALETTE_ROLE_RE = /^bw_(primary|secondary|tertiary|success|danger|warning|info|light|dark)$/;
var PALETTE_UTILITY_RE = /^bw_(bg|text|border)_(primary|secondary|tertiary|success|danger|warning|info|light|dark|muted)$/;
var SPACING_RE = /^bw_(m|p)([trblxyse]?|s|e)_\d+$/;
var LAYOUT_RE = /^bw_(container|row|col|offset|g_|gap_|d_|flex|grid|justify|align|order|w_|h_|position|overflow|float|clearfix|stack)/;
var TYPE_RE = /^bw_(text_|font_|fw_|fst_|lh_|display_|h[1-6]$|lead$|quote$|code$|list$|hr$)/;
var STATE_RE = /_(active|show|open|disabled|valid|invalid|selected|current|collapsed|animated|striped|hoverable|loading)$/;

var BCCL_PRIVATE_BARE_RE = /^bw_(step|cta|feature|popover|skeleton|code_(?:demo|pre|result|header|copy)|nav_|section|stat_|chip|file_upload|media|range|avatar|page_|search|close$|copy_btn|list_group|spinner|switch_input|timeline|tooltip|bar_chart)/;
var BCCL_CATEGORIES = new Set([
  'buttons', 'cards', 'forms', 'formChecks', 'navigation', 'tables', 'alerts',
  'badges', 'progress', 'tabs', 'listGroups', 'pagination', 'breadcrumb',
  'hero', 'features', 'sections', 'cta', 'spinner', 'closeButton', 'codeDemo',
  'buttonGroup', 'accordion', 'carousel', 'modal', 'toast', 'dropdown',
  'formSwitch', 'skeleton', 'avatar', 'statCard', 'tooltip', 'popover',
  'searchInput', 'range', 'mediaObject', 'fileUpload', 'timeline', 'stepper',
  'chipInput', 'barChart'
]);

function classifyOwner(name, rec) {
  var hasModernLibraryLayer = rec.layers.has('structural') || rec.layers.has('themed') ||
    rec.layers.has('factory-output') || rec.layers.has('code-editor') ||
    rec.layers.has('themed-scope');
  if (rec.layers.has('legacy-static-css') && !hasModernLibraryLayer) return 'legacy static CSS';
  if (rec.layers.has('cli-css') && !hasModernLibraryLayer) return 'CLI output';
  if (rec.layers.has('util-css-output') && rec.selectors.size === 0) return 'util-css add-on';
  if (name.indexOf('bw_') !== 0) {
    var belongsToBCCL = rec.components.size > 0 ||
      Array.from(rec.categories).some(function(category) { return BCCL_CATEGORIES.has(category); });
    return belongsToBCCL ? 'BCCL (unprefixed legacy/state)' : 'core/global unprefixed selector';
  }
  if (name.indexOf('*') !== -1 && rec.layers.has('runtime')) return 'runtime';
  if (name.indexOf('bw_ce') === 0) return 'code-editor';
  if (name.indexOf('bw_code_') === 0) return 'code-editor / BCCL overlap';
  if (name.indexOf('bw_bccl_') === 0) return 'BCCL';
  if (name.indexOf('bw_act_') === 0 || name.indexOf('bw_uuid_') === 0 ||
      name.indexOf('bw_fn_') === 0 || name.indexOf('bw_slot_') === 0 ||
      name === 'bw_lc' || name === 'bw_is_component') return 'runtime';
  if (/^bw_(table|sort_|bar(?:_|$))/.test(name)) return 'table/chart decision';
  if (PALETTE_ROLE_RE.test(name) || PALETTE_UTILITY_RE.test(name) ||
      SPACING_RE.test(name) || LAYOUT_RE.test(name) || TYPE_RE.test(name) ||
      SHARED_MODIFIER_RE.test(name) ||
      /^bw_(shadow|rounded|border|opacity|visible|invisible|fade|collapse)/.test(name)) {
    return 'core';
  }
  if (BCCL_PRIVATE_BARE_RE.test(name)) return 'BCCL (bare legacy name)';
  if (rec.components.size) return 'BCCL (bare legacy name)';
  return 'core';
}

function classifyType(name, rec, owner) {
  if (rec.layers.has('runtime')) return 'runtime token';
  if (owner === 'legacy static CSS') return 'legacy stylesheet selector';
  if (owner === 'CLI output') return 'CLI-specific class';
  if (owner === 'util-css add-on') return 'generated utility token';
  if (name.indexOf('bw_') !== 0) {
    if (name === 'active' || name === 'disabled') return 'unprefixed state';
    return rec.components.size ? 'unprefixed component class' : 'unprefixed global selector';
  }
  if (name.indexOf('bw_ce') === 0 || name.indexOf('bw_code_') === 0) return 'code component';
  if (PALETTE_ROLE_RE.test(name)) return 'palette role';
  if (PALETTE_UTILITY_RE.test(name)) return 'palette utility';
  if (SPACING_RE.test(name)) return 'spacing utility';
  if (LAYOUT_RE.test(name)) return 'layout utility';
  if (TYPE_RE.test(name)) return 'typography utility';
  if (STATE_RE.test(name)) return 'component state/variant';
  if (owner.indexOf('BCCL') !== -1 || owner === 'table/chart decision') {
    return rec.components.size ? 'component class' : 'component style';
  }
  if (/^bw_(shadow|rounded|border|opacity|visible|invisible)/.test(name)) return 'visual utility';
  return rec.components.size ? 'shared component utility' : 'core utility/style';
}

function proposeBuild(owner) {
  if (owner === 'runtime') return 'runtime-generated (no CSS build)';
  if (owner === 'legacy static CSS') return 'legacy CSS artifact only (review/remove)';
  if (owner === 'CLI output') return 'CLI-generated pages only';
  if (owner === 'util-css add-on') return 'util-css token; matching rule belongs in core + full';
  if (owner === 'BCCL (unprefixed legacy/state)') return 'full/BCCL build only';
  if (owner.indexOf('code-editor') !== -1) return 'code-editor add-on only';
  if (owner === 'BCCL' || owner.indexOf('BCCL (bare') === 0 ||
      owner === 'table/chart decision') return 'full/BCCL build only';
  return 'core build + full build';
}

function compactDeclarations(rec) {
  var pairs = [];
  rec.selectors.forEach(function(decls) {
    Object.keys(decls || {}).forEach(function(prop) {
      var pair = prop + ': ' + decls[prop];
      if (pairs.indexOf(pair) === -1) pairs.push(pair);
    });
  });
  return pairs.slice(0, 6).join('; ') + (pairs.length > 6 ? '; …' : '');
}

function purposeFor(item) {
  if (item.type === 'runtime token') {
    var runtimePurpose = {
      bw_lc: 'Marks lifecycle-managed DOM nodes.',
      bw_is_component: 'Marks hydrated bitwrench components.',
      'bw_is_component_*': 'Typed component discovery marker.',
      'bw_uuid_*': 'Generated element identity token.',
      'bw_act_*': 'Delegated server/client action token.',
      'bw_fn_*': 'Serialized event-handler lookup token.',
      'bw_slot_*': 'Generated or declared slot targeting token.'
    };
    return runtimePurpose[item.name] || 'Bitwrench runtime machine token.';
  }
  var lead;
  if (item.owner === 'legacy static CSS') lead = 'Legacy dist/bitwrench.css selector; review for removal or migration.';
  else if (item.owner === 'CLI output') lead = 'Styles CLI-generated standalone pages.';
  else if (item.owner === 'util-css add-on') lead = 'Class name emitted by bw.u.cls(); util-css does not inject the matching rule.';
  else if (item.type === 'unprefixed state') lead = 'Unprefixed component state hook; collision-sensitive.';
  else if (item.type === 'unprefixed component class') lead = 'Unprefixed component class; rename or remove during BCCL cleanup.';
  else if (item.type === 'unprefixed global selector') lead = 'Global unprefixed selector targeted by bitwrench CSS.';
  else if (item.type === 'palette role') lead = 'Applies the named palette role.';
  else if (item.type === 'palette utility') lead = 'Applies palette color to background/text/border.';
  else if (item.type.indexOf('utility') !== -1) lead = 'Reusable core utility.';
  else if (item.type === 'component state/variant') lead = 'Styles a component state or variant.';
  else if (item.owner.indexOf('BCCL') !== -1) lead = 'Styles BCCL component structure or chrome.';
  else if (item.owner.indexOf('code-editor') !== -1) lead = 'Styles the code editor/demo surface.';
  else lead = 'Bitwrench style rule.';
  return lead + (item.declarations ? ' ' + item.declarations : '');
}

var inventory = Array.from(records.values()).map(function(rec) {
  var owner = classifyOwner(rec.name, rec);
  var type = classifyType(rec.name, rec, owner);
  var declarations = compactDeclarations(rec);
  var selectors = Array.from(rec.selectors.keys()).sort();
  var usage = Array.from(rec.usageFiles).sort();
  var item = {
    name: rec.name,
    owner: owner,
    type: type,
    proposedBuild: proposeBuild(owner),
    layers: Array.from(rec.layers).sort(),
    categories: Array.from(rec.categories).sort(),
    components: Array.from(rec.components).sort(),
    selectors: selectors,
    declarations: declarations,
    usageCount: usage.length,
    usageFiles: usage,
    purpose: ''
  };
  item.purpose = purposeFor(item);
  return item;
}).sort(function(a, b) { return a.name.localeCompare(b.name); });

function escCell(value) {
  return String(value == null ? '' : value)
    .replace(/\|/g, '\\|')
    .replace(/\r?\n/g, ' ');
}

function countBy(items, key) {
  var counts = {};
  items.forEach(function(item) {
    var value = item[key];
    counts[value] = (counts[value] || 0) + 1;
  });
  return counts;
}

function markdownTable(headers, rows) {
  var out = [];
  out.push('| ' + headers.join(' | ') + ' |');
  out.push('|' + headers.map(function() { return '---'; }).join('|') + '|');
  rows.forEach(function(row) {
    out.push('| ' + row.map(escCell).join(' | ') + ' |');
  });
  return out.join('\n');
}

var owners = countBy(inventory, 'owner');
var types = countBy(inventory, 'type');
var builds = countBy(inventory, 'proposedBuild');
var styledCount = inventory.filter(function(x) { return x.selectors.length > 0; }).length;
var runtimeCount = inventory.filter(function(x) { return x.layers.indexOf('runtime') !== -1; }).length;
var componentCount = inventory.filter(function(x) { return x.components.length > 0; }).length;
var unstyledFactory = inventory.filter(function(x) {
  var wildcardHasConcreteRule = false;
  if (x.name.charAt(x.name.length - 1) === '*') {
    var prefix = x.name.slice(0, -1);
    wildcardHasConcreteRule = inventory.some(function(other) {
      return other.name !== x.name && other.name.indexOf(prefix) === 0 && other.selectors.length > 0;
    });
  }
  return x.layers.indexOf('factory-output') !== -1 && x.selectors.length === 0 &&
    x.layers.indexOf('runtime') === -1 && !wildcardHasConcreteRule;
});

var md = [];
md.push('# Bitwrench CSS class inventory');
md.push('');
md.push('> Generated by `node tools/build-css-class-inventory.js` from the current working tree.  ');
md.push('> This is a **current-state inspection aid**, not a signed-off 2.2 namespace map.');
md.push('');
md.push('Generated: ' + new Date().toISOString());
md.push('');
md.push('## Scope');
md.push('');
md.push('Included: modern core/BCCL structural and themed selectors, classes emitted by all 51 registered component factories, runtime machine-token families, code-editor CSS, util-css class emissions, CLI page CSS, and the legacy `dist/bitwrench.css` channel. Unprefixed selectors are intentionally included because they are collision and migration concerns.');
md.push('');
md.push('Excluded: repository-local `pages/site.js` chrome and classes owned only by demos/examples/blog pages. Those are application CSS, not classes shipped by the bitwrench library, BCCL, or a package addon.');
md.push('');
md.push('## How to read this document');
md.push('');
md.push('- **Owner** is the best current/proposed ownership classification. “BCCL (bare legacy name)” is precisely the namespace debt under review.');
md.push('- **Proposed build** says where the rule should ship after cleanup. “Core build + full build” means the full build inherits the core rule; “full/BCCL build only” also covers the standalone BCCL style payload.');
md.push('- **Type** distinguishes reusable utilities/roles from component-specific structure and runtime machine tokens.');
md.push('- **Components** lists BCCL/core factories whose emitted source or selectors use the class.');
md.push('- **Purpose / key declarations** summarizes the generated default structural/themed rules; inspect selectors when specificity matters.');
md.push('- **Usage** counts source/docs/pages/examples/test/tool files, excluding generated `dist/`, `releases/`, and archived material.');
md.push('');
md.push('## Summary');
md.push('');
md.push(markdownTable(
  ['Metric', 'Count'],
  [
    ['Total named tokens', inventory.length],
    ['Tokens with generated/literal CSS selectors', styledCount],
    ['Runtime-only/wildcard machine tokens', runtimeCount],
    ['Tokens linked to one or more components', componentCount],
    ['Factory tokens/families with no CSS selector', unstyledFactory.length]
  ]
));
md.push('');
md.push('### By owner');
md.push('');
md.push(markdownTable(
  ['Owner', 'Classes'],
  Object.keys(owners).sort().map(function(k) { return [k, owners[k]]; })
));
md.push('');
md.push('### By type');
md.push('');
md.push(markdownTable(
  ['Type', 'Classes'],
  Object.keys(types).sort().map(function(k) { return [k, types[k]]; })
));
md.push('');
md.push('### By proposed build');
md.push('');
md.push(markdownTable(
  ['Proposed build', 'Classes/tokens'],
  Object.keys(builds).sort().map(function(k) { return [k, builds[k]]; })
));
md.push('');
if (unstyledFactory.length) {
  md.push('## Factory tokens with no matching CSS selector');
  md.push('');
  md.push('These are emitted literals or dynamic source families, but no current structural, themed, or code-editor rule targets the same token. Some are legitimate composition/state hooks; others are high-value stale-name or missing-rule candidates for the 2.2 cleanup.');
  md.push('');
  md.push(markdownTable(
    ['Class/family', 'Owner', 'Proposed build', 'Type', 'Components', 'Source usage'],
    unstyledFactory.map(function(item) {
      return [
        '`.' + item.name + '`',
        item.owner,
        item.proposedBuild,
        item.type,
        item.components.join(', '),
        item.usageFiles.join(', ')
      ];
    })
  ));
  md.push('');
}
md.push('## Complete inventory');
md.push('');
md.push(markdownTable(
  ['Class', 'Owner', 'Proposed build', 'Type', 'Layers/categories', 'Purpose / key declarations', 'Components', 'Usage'],
  inventory.map(function(item) {
    var usage = item.usageFiles.slice(0, 3).join(', ');
    if (item.usageFiles.length > 3) usage += ' +' + (item.usageFiles.length - 3) + ' more';
    return [
      '`.' + item.name + '`',
      item.owner,
      item.proposedBuild,
      item.type,
      item.layers.concat(item.categories).join(', '),
      item.purpose,
      item.components.join(', '),
      item.usageCount + (usage ? ': ' + usage : '')
    ];
  })
));
md.push('');
md.push('## Selector detail');
md.push('');
md.push('Each entry below records all generated selectors containing the class. This section is intentionally verbose so grouped, state, descendant and responsive selectors remain inspectable.');
md.push('');
inventory.filter(function(item) { return item.selectors.length > 0; }).forEach(function(item) {
  md.push('### `.' + item.name + '`');
  md.push('');
  md.push('- Owner: **' + item.owner + '**');
  md.push('- Proposed build: **' + item.proposedBuild + '**');
  md.push('- Type: **' + item.type + '**');
  if (item.components.length) md.push('- Components: ' + item.components.map(function(c) { return '`' + c + '`'; }).join(', '));
  if (item.usageFiles.length) md.push('- Used in: ' + item.usageFiles.map(function(f) { return '`' + f + '`'; }).join(', '));
  md.push('- Selectors:');
  item.selectors.forEach(function(selector) {
    md.push('  - `' + selector.replace(/`/g, '\\`') + '`');
  });
  md.push('');
});

writeFileSync(OUT, md.join('\n') + '\n', 'utf8');

function canvasSource(items) {
  var data = JSON.stringify(items.map(function(item) {
    return {
      name: item.name,
      owner: item.owner,
      type: item.type,
      proposedBuild: item.proposedBuild,
      layers: item.layers.join(', '),
      categories: item.categories.join(', '),
      components: item.components.join(', '),
      purpose: item.purpose,
      usageCount: item.usageCount,
      usage: item.usageFiles.slice(0, 5).join(', '),
      selectorCount: item.selectors.length
    };
  }));

  return `import {
  Button, Code, Grid, H1, H2, Pill, Row, Select, Stack, Stat, Table, Text,
  TextInput, useCanvasAction, useCanvasState, useHostTheme
} from "cursor/canvas";

// Generated from the current bitwrench CSS and component sources.
// Repository-local site/demo classes are intentionally outside this inventory.
type InventoryRow = {
  name: string;
  owner: string;
  type: string;
  proposedBuild: string;
  layers: string;
  categories: string;
  components: string;
  purpose: string;
  usageCount: number;
  usage: string;
  selectorCount: number;
};

const DATA: InventoryRow[] = ${data};

const OWNER_OPTIONS = [
  { value: "all", label: "All owners" },
  ...Array.from(new Set(DATA.map((r) => r.owner))).sort().map((v) => ({ value: v, label: v })),
];

const TYPE_OPTIONS = [
  { value: "all", label: "All types" },
  ...Array.from(new Set(DATA.map((r) => r.type))).sort().map((v) => ({ value: v, label: v })),
];

const BUILD_OPTIONS = [
  { value: "all", label: "All proposed builds" },
  ...Array.from(new Set(DATA.map((r) => r.proposedBuild))).sort().map((v) => ({ value: v, label: v })),
];

export default function CSSClassInventory() {
  const theme = useHostTheme();
  const dispatch = useCanvasAction();
  const [query, setQuery] = useCanvasState("css-class-query", "");
  const [owner, setOwner] = useCanvasState("css-class-owner", "all");
  const [type, setType] = useCanvasState("css-class-type", "all");
  const [proposedBuild, setProposedBuild] = useCanvasState("css-class-build", "all");
  const [onlyComponents, setOnlyComponents] = useCanvasState("css-class-components", "all");

  const q = query.trim().toLowerCase();
  const filtered = DATA.filter((row) => {
    if (owner !== "all" && row.owner !== owner) return false;
    if (type !== "all" && row.type !== type) return false;
    if (proposedBuild !== "all" && row.proposedBuild !== proposedBuild) return false;
    if (onlyComponents === "components" && !row.components) return false;
    if (onlyComponents === "unmapped" && row.components) return false;
    if (!q) return true;
    return [
      row.name, row.owner, row.type, row.proposedBuild, row.layers, row.categories,
      row.components, row.purpose, row.usage
    ].join(" ").toLowerCase().includes(q);
  });

  const bcclDebt = DATA.filter((r) => r.owner === "BCCL (bare legacy name)").length;
  const core = DATA.filter((r) => r.owner === "core").length;
  const bccl = DATA.filter((r) => r.owner === "BCCL").length;
  const shown = filtered.slice(0, 250);

  return (
    <Stack gap={16} style={{ padding: 20, background: theme.bg.editor, color: theme.text.primary }}>
      <Stack gap={4}>
        <H1>Bitwrench CSS class inventory</H1>
        <Text tone="secondary">
          Current generated selectors, runtime tokens, proposed ownership, component links, and repository usage.
        </Text>
      </Stack>

      <Grid columns={4} gap={8}>
        <Stat label="Named tokens" value={String(DATA.length)} />
        <Stat label="Core" value={String(core)} />
        <Stat label="BCCL namespaced" value={String(bccl)} />
        <Stat label="BCCL bare-name debt" value={String(bcclDebt)} tone={bcclDebt ? "warning" : undefined} />
      </Grid>

      <Stack gap={8}>
        <H2>Filter inventory</H2>
        <Row gap={8} wrap>
          <TextInput
            value={query}
            onChange={setQuery}
            placeholder="Search class, purpose, component, or file…"
            style={{ minWidth: 320, flex: 1 }}
          />
          <Select value={owner} onChange={setOwner} options={OWNER_OPTIONS} />
          <Select value={type} onChange={setType} options={TYPE_OPTIONS} />
          <Select value={proposedBuild} onChange={setProposedBuild} options={BUILD_OPTIONS} />
          <Select
            value={onlyComponents}
            onChange={setOnlyComponents}
            options={[
              { value: "all", label: "All mappings" },
              { value: "components", label: "Component-linked" },
              { value: "unmapped", label: "No component mapping" },
            ]}
          />
        </Row>
        <Row gap={8} align="center">
          <Pill tone="info">{filtered.length} matches</Pill>
          {filtered.length > 250 ? <Text tone="secondary">Table shows first 250; narrow the filters to inspect the rest.</Text> : null}
          <Button
            variant="primary"
            onClick={() => dispatch({ type: "openFile", path: "dev/bitwrench-css-class-inventory.md" })}
            style={{ marginLeft: "auto" }}
          >
            Open full Markdown
          </Button>
        </Row>
      </Stack>

      <Table
        stickyHeader
        striped
        headers={["Class", "Owner / type", "Proposed build", "Purpose", "Components", "Rules / usage"]}
        rows={shown.map((row) => [
          <Code>{row.name}</Code>,
          <Stack gap={2}>
            <Text as="span" weight="semibold">{row.owner}</Text>
            <Text as="span" tone="secondary" size="small">{row.type}</Text>
          </Stack>,
          <Text as="span" size="small" weight="semibold">{row.proposedBuild}</Text>,
          <Text as="span" size="small">{row.purpose}</Text>,
          row.components
            ? <Text as="span" size="small">{row.components}</Text>
            : <Text as="span" size="small" tone="quaternary">—</Text>,
          <Stack gap={2}>
            <Text as="span" size="small">{row.selectorCount} selectors · {row.usageCount} files</Text>
            {row.usage ? <Text as="span" size="small" tone="quaternary" truncate>{row.usage}</Text> : null}
          </Stack>,
        ])}
        columnAlign={["left", "left", "left", "left", "left", "left"]}
      />
    </Stack>
  );
}
`;
}

if (canvasPath) writeFileSync(canvasPath, canvasSource(inventory), 'utf8');

console.log(
  'CSS class inventory: ' + inventory.length + ' tokens (' + styledCount +
  ' styled, ' + runtimeCount + ' runtime)\\n' +
  'Wrote ' + relative(ROOT, OUT) +
  (canvasPath ? '\\nWrote ' + canvasPath : '')
);
