/**
 * Bitwrench v2 Default Styles
 *
 * CSS-in-JS style definitions providing a complete, Bootstrap-inspired
 * design system. Styles are defined as nested JavaScript objects that
 * bw.css() converts to CSS strings and bw.injectCSS() injects into the DOM.
 *
 * The module exports:
 * - {@link defaultStyles} - All style categories as a structured object
 * - {@link getAllStyles} - Merges all categories into a flat CSS rules object
 * - {@link theme} - Design token configuration (colors, breakpoints, spacing, typography)
 * - {@link generateThemedCSS} - Generate scoped themed CSS from a palette
 * - {@link derivePalette} - Re-export from color-utils for convenience
 *
 * Style categories (core): reset, typography, grid, stacks, offsets, tables,
 * barChart, utilities, responsive. Widget categories (buttons, cards, forms,
 * modal, ...) moved to bitwrench-bccl-styles.js in 2.1.14 and ship with the
 * BCCL factories; the lean build carries neither.
 *
 * @module bitwrench-styles
 * @license BSD-2-Clause
 * @author M A Chatterjee <deftio [at] deftio [dot] com>
 */

import { derivePalette, relativeLuminance } from './bitwrench-color-utils.js';

// Re-export for use by bitwrench.js
export { derivePalette };

// =========================================================================
// Layout presets
// =========================================================================

/**
 * Base spacing scale (4px unit). Shared design token for consistent spacing
 * across all components. Use scale keys (0-7) in component definitions.
 */
var SPACING_SCALE = {
  0: '0',
  1: '0.25rem',   // 4px
  2: '0.5rem',    // 8px
  3: '0.75rem',   // 12px
  4: '1rem',      // 16px
  5: '1.5rem',    // 24px
  6: '2rem',      // 32px
  7: '3rem'       // 48px
};

let _S=SPACING_SCALE;

export var SPACING_PRESETS = {
  compact:  { btn: _S[1] + ' ' + _S[3],  card: _S[3] + ' ' + _S[4], alert: _S[2] + ' ' + _S[4], cell: _S[2] + ' ' + _S[3], input: _S[1] + ' ' + _S[3] },
  normal:   { btn: _S[2] + ' ' + _S[4],  card: _S[5] + ' ' + _S[5], alert: _S[3] + ' ' + _S[5], cell: _S[3] + ' ' + _S[4], input: _S[2] + ' ' + _S[3] },
  spacious: { btn: _S[3] + ' ' + _S[5],  card: _S[6] + ' ' + _S[6], alert: _S[4] + ' ' + _S[5], cell: _S[4] + ' ' + _S[5], input: _S[3] + ' ' + _S[4] }
};

export var RADIUS_PRESETS = {
  none: { btn: '0', card: '0', badge: '0', alert: '0', input: '0' },
  sm:   { btn: '4px', card: '4px', badge: '.25rem', alert: '4px', input: '4px' },
  md:   { btn: '6px', card: '8px', badge: '.375rem', alert: '8px', input: '6px' },
  lg:   { btn: '10px', card: '12px', badge: '.5rem', alert: '12px', input: '10px' },
  pill: { btn: '50rem', card: '1rem', badge: '50rem', alert: '1rem', input: '50rem' }
};

// ---- Typography scale presets ----

export var TYPE_RATIO_PRESETS = {
  tight:    1.125,
  normal:   1.200,
  relaxed:  1.250,
  dramatic: 1.333
};

/**
 * Generate a modular type scale from a base size and ratio.
 * @param {number} base - Base font size in px (default 16)
 * @param {number} ratio - Scale ratio (default 1.200)
 * @returns {Object} { xs, sm, base, lg, xl, '2xl', '3xl', '4xl' } in px
 */
export function generateTypeScale(base, ratio) {
  if (!base) base = 16;
  if (!ratio) ratio = 1.200;
  return {
    xs:   Math.round(base / (ratio * ratio)),
    sm:   Math.round(base / ratio),
    base: base,
    lg:   Math.round(base * ratio),
    xl:   Math.round(base * ratio * ratio),
    '2xl': Math.round(base * Math.pow(ratio, 3)),
    '3xl': Math.round(base * Math.pow(ratio, 4)),
    '4xl': Math.round(base * Math.pow(ratio, 5))
  };
}

// ---- Elevation (shadow depth) presets ----

export var ELEVATION_PRESETS = {
  flat: {
    sm:  'none',
    md:  'none',
    lg:  'none',
    xl:  'none'
  },
  sm: {
    sm:  '0 1px 2px rgba(0,0,0,0.05)',
    md:  '0 1px 3px rgba(0,0,0,0.08)',
    lg:  '0 2px 6px rgba(0,0,0,0.10)',
    xl:  '0 4px 12px rgba(0,0,0,0.12)'
  },
  md: {
    sm:  '0 1px 3px rgba(0,0,0,0.10), 0 1px 2px rgba(0,0,0,0.06)',
    md:  '0 4px 6px rgba(0,0,0,0.10), 0 2px 4px rgba(0,0,0,0.06)',
    lg:  '0 10px 15px rgba(0,0,0,0.12), 0 4px 6px rgba(0,0,0,0.08)',
    xl:  '0 20px 25px rgba(0,0,0,0.15), 0 8px 10px rgba(0,0,0,0.10)'
  },
  lg: {
    sm:  '0 2px 4px rgba(0,0,0,0.10)',
    md:  '0 4px 12px rgba(0,0,0,0.16)',
    lg:  '0 8px 24px rgba(0,0,0,0.22)',
    xl:  '0 16px 48px rgba(0,0,0,0.28)'
  }
};

// ---- Motion (transition) presets ----

export var MOTION_PRESETS = {
  reduced: {
    fast:    '0ms',
    normal:  '0ms',
    slow:    '0ms',
    easing:  'linear'
  },
  standard: {
    fast:    '100ms',
    normal:  '200ms',
    slow:    '300ms',
    easing:  'ease-out'
  },
  expressive: {
    fast:    '150ms',
    normal:  '300ms',
    slow:    '500ms',
    easing:  'cubic-bezier(0.34, 1.56, 0.64, 1)'
  }
};

/**
 * Default palette config — matches existing hardcoded colors
 */
export var DEFAULT_PALETTE_CONFIG = {
  primary: '#006666',
  secondary: '#6c757d',
  tertiary: '#006666',
  success: '#198754',
  danger: '#dc3545',
  warning: '#b38600',
  info: '#0891b2',
  light: '#f8f9fa',
  dark: '#212529'
};

/**
 * Built-in theme presets — named color combinations
 * Each preset provides primary, secondary, and tertiary seed colors.
 */
export var THEME_PRESETS = Object.fromEntries([
  ['teal','#006666','#6c757d','#006666'],['ocean','#0077b6','#90e0ef','#00b4d8'],
  ['sunset','#e76f51','#264653','#e9c46a'],['forest','#2d6a4f','#95d5b2','#52b788'],
  ['slate','#343a40','#adb5bd','#6c757d'],['rose','#e11d48','#fda4af','#fb7185'],
  ['indigo','#4f46e5','#a5b4fc','#818cf8'],['amber','#d97706','#fbbf24','#f59e0b'],
  ['emerald','#059669','#6ee7b7','#34d399'],['nord','#5e81ac','#88c0d0','#81a1c1'],
  ['coral','#ef6461','#4a7c7e','#e8a87c'],['midnight','#1e3a5f','#7c8db5','#3d5a80']
].map(function(e) { return [e[0], {primary:e[1],secondary:e[2],tertiary:e[3]}]; }));

/**
 * Resolve layout config to spacing, radius, typeScale, elevation, and motion objects.
 * @param {Object} config - { spacing, radius, fontSize, typeRatio, elevation, motion }
 * @returns {Object} { spacing, radius, fontSize, typeScale, elevation, motion }
 */
export function resolveLayout(config) {
  var sp = (config && config.spacing) || 'normal';
  var rd = (config && config.radius) || 'md';
  var fs = (config && config.fontSize) || 1.0;

  // typeRatio: accept preset name or number
  var tr = (config && config.typeRatio) || 'normal';
  var ratioNum = typeof tr === 'string' ? (TYPE_RATIO_PRESETS[tr] || TYPE_RATIO_PRESETS.normal) : tr;

  // elevation: accept preset name or object
  var el = (config && config.elevation) || 'md';

  // motion: accept preset name or object
  var mo = (config && config.motion) || 'standard';

  return {
    spacing: typeof sp === 'string' ? (SPACING_PRESETS[sp] || SPACING_PRESETS.normal) : sp,
    radius: typeof rd === 'string' ? (RADIUS_PRESETS[rd] || RADIUS_PRESETS.md) : rd,
    fontSize: fs,
    typeScale: generateTypeScale(16, ratioNum),
    elevation: typeof el === 'string' ? (ELEVATION_PRESETS[el] || ELEVATION_PRESETS.md) : el,
    motion: typeof mo === 'string' ? (MOTION_PRESETS[mo] || MOTION_PRESETS.standard) : mo
  };
}

// =========================================================================
// Scoping helper
// =========================================================================

/**
 * Prefix a CSS selector with a scope class name.
 * @param {string} name - Scope class (e.g. 'ocean'). Empty = no scoping.
 * @param {string} sel - CSS selector(s)
 * @returns {string} Scoped selector
 */
function scopeSelector(name, sel) {
  if (!name) return sel;
  /* c8 ignore next -- scopeSelector never receives comma-separated selectors from internal callers */
  if (sel.includes(',')) return sel.split(',').map(function(s) { return '.' + name + ' ' + s.trim(); }).join(', ');
  return '.' + name + ' ' + sel;
}
var _sx=scopeSelector;
function _tr(p,m,s){var d=m[s||'fast'];return p.split(',').map(function(x){return x.trim()+' '+d+' '+m.easing;}).join(', ');}
function _fr(f,sz){return '0 0 0 '+(sz||'0.25rem')+' '+f;}
function _sf(p){return p.surface||'#fff';}

// =========================================================================
// Themed CSS generators
// =========================================================================

function generateTypographyThemed(scope, palette, layout) {
  var mot = layout.motion;
  var rules = {};
  rules[_sx(scope, 'a')] = {
    'color': palette.primary.base,
    'text-decoration': 'none',
    'transition': _tr('color', mot)
  };
  rules[_sx(scope, 'a:hover')] = {
    'color': palette.tertiary.hover,
    'text-decoration': 'underline'
  };
  return rules;
}

function generateTables(scope, palette, layout) {
  var rules = {};
  // Pager buttons: padding and radius of the widget sheet's small button, so
  // the pager looks the same whether or not the BCCL sheet is loaded.
  var rdBtn = layout.radius.btn;
  rules[_sx(scope, '.bw_bccl_table_pagination .bw_bccl_btn_sm')] = {
    'padding': '0.25rem 0.75rem',
    'border-radius': rdBtn === '50rem' ? '50rem' : (Math.max(parseInt(rdBtn) - 1, 0)) + 'px'
  };
  var sp = layout.spacing;

  rules[_sx(scope, '.bw_bccl_table')] = {
    'color': palette.dark.base,
    'border-color': palette.light.border
  };
  rules[_sx(scope, '.bw_bccl_table > :not(caption) > * > *')] = {
    'padding': sp.cell,
    'border-bottom-color': palette.light.border
  };
  rules[_sx(scope, '.bw_bccl_table > thead > tr > *')] = {
    'color': palette.secondary.base,
    'border-bottom-color': palette.light.border,
    'background-color': palette.surfaceAlt
  };
  rules[_sx(scope, '.bw_bccl_table_striped > tbody > tr:nth-of-type(odd) > *')] = {
    'background-color': palette.surfaceAlt
  };
  rules[_sx(scope, '.bw_bccl_table_hover > tbody > tr:hover > *')] = {
    'background-color': palette.primary.focus
  };
  rules[_sx(scope, '.bw_bccl_table_selectable > tbody > tr')] = {
    'cursor': 'pointer'
  };
  rules[_sx(scope, '.bw_bccl_table > tbody > tr.bw_bccl_table_row_selected > *')] = {
    'background-color': palette.primary.light
  };
  rules[_sx(scope, '.bw_bccl_table_bordered')] = {
    'border-color': palette.light.border
  };
  rules[_sx(scope, '.bw_bccl_table caption')] = {
    'color': palette.secondary.base
  };

  return rules;
}

/**
 * 'dark' or 'light' for a palette, judged on its background. Exported so
 * makeStyles can stamp the alternate palette's body override too.
 * @param {Object} palette - derivePalette() output
 * @returns {string}
 */
export function colorScheme(palette) {
  return relativeLuminance(palette.background || '#f5f5f5') > 0.179 ? 'light' : 'dark';
}

function generateResetThemed(scope, palette) {
  var rules = {};
  var bg = palette.background || '#f5f5f5';
  var baseReset = {
    'color': palette.dark.base,
    'background-color': bg,
    // Tell the browser which scheme this palette is, so native parts (select
    // popups, scrollbars, date/number spinners, autofill) follow it instead
    // of staying light inside a dark theme (#120).
    'color-scheme': colorScheme(palette)
  };
  rules[_sx(scope, 'body')] = baseReset;
  // Also apply to the scope element itself so themes work on any container, not just body
  if (scope) {
    rules['.' + scope] = baseReset;
  }
  return rules;
}

function generateProseThemed(scope, palette) {
  var rules = {};
  // Bare hr draws a rule now (see structuralRules.base), so it needs the
  // palette colour too -- otherwise it falls back to the UA's grey currentColor.
  rules[_sx(scope, 'hr, .bw_hr')] = { 'border-top-color': palette.light.border };
  rules[_sx(scope, '.bw_quote')] = {
    'border-left-color': palette.primary.base,
    'color': palette.dark.base
  };
  rules[_sx(scope, '.bw_code')] = {
    'background-color': palette.surfaceAlt,
    'color': palette.danger.darkText
  };
  return rules;
}

/**
 * Generate palette root classes. Each palette color (primary, secondary, etc.)
 * gets ONE class that sets bg, text, and border. Components add this single
 * class to their root element for variant styling. Component-specific overrides
 * (e.g. alerts use light bg, toasts use border-left accent) are included.
 *
 * @param {string} scope - CSS scope class ('' for global)
 * @param {Object} palette - From derivePalette()
 * @returns {Object} CSS rules object
 */
function generatePaletteClasses(scope, palette) {
  var rules = {};
  var keys = Object.keys(palette);
  keys.forEach(function(k) {
    if (typeof palette[k] !== 'object') return;
    var s = palette[k];

    // --- Root palette class: sets default bg/color/border ---
    rules[_sx(scope, '.bw_' + k)] = {
      'background-color': s.base,
      'color': s.textOn,
      'border-color': s.base
    };

    // --- Pseudo-states (shared across all components) ---
    rules[_sx(scope, '.bw_' + k + ':hover')] = {
      'background-color': s.hover,
      'border-color': s.active
    };
    rules[_sx(scope, '.bw_' + k + ':active')] = {
      'background-color': s.active
    };
    rules[_sx(scope, '.bw_' + k + ':focus-visible')] = {
      'box-shadow': '0 0 0 3px ' + s.focus,
      'outline': 'none'
    };

    // Widget-specific role overrides (alerts, toasts, outline buttons, ...)
    // live in bitwrench-bccl-styles.js and ship with the factories.

    // Background utility: .bw_bg_primary, .bw_bg_secondary, etc.
    rules[_sx(scope, '.bw_bg_' + k)] = {
      'background-color': s.base,
      'color': s.textOn
    };

    // Text color utility: .bw_text_primary, .bw_text_secondary, etc.
    rules[_sx(scope, '.bw_text_' + k)] = {
      'color': s.base
    };
  });

  // Text muted — uses palette secondary for theme-aware muted text
  rules[_sx(scope, '.bw_text_muted')] = { 'color': palette.secondary.base };

  // Common bg/text utilities — derive from palette for theme awareness
  rules[_sx(scope, '.bw_bg_dark')] = { 'background-color': palette.dark.base, 'color': palette.dark.textOn };
  rules[_sx(scope, '.bw_bg_light')] = { 'background-color': palette.light.base, 'color': palette.light.textOn };
  rules[_sx(scope, '.bw_text_light')] = { 'color': palette.light.base };
  rules[_sx(scope, '.bw_text_dark')] = { 'color': palette.dark.base };

  return rules;
}

/**
 * Generate all themed CSS rules from a palette and layout.
 * Returns a flat CSS rules object (selector → declarations).
 *
 * @param {string} scopeName - CSS scope class ('' for global)
 * @param {Object} palette - From derivePalette()
 * @param {Object} layout - From resolveLayout()
 * @returns {Object} CSS rules object
 */
export function generateThemedCSS(scopeName, palette, layout, sheets) {
  var rules = Object.assign({},
    generateResetThemed(scopeName, palette),
    generateTypographyThemed(scopeName, palette, layout),
    generateTables(scopeName, palette, layout),
    generateProseThemed(scopeName, palette)
  );
  // Installed sheets (the BCCL widget sheet) go here, before the role
  // classes, which is where their generators sat through 2.1.13: a widget
  // rule and a role class on the same element resolve the way they did.
  (sheets || []).forEach(function(sh) {
    Object.assign(rules, sh.themed(scopeName, palette, layout, styleHelpers));
  });
  return Object.assign(rules, generatePaletteClasses(scopeName, palette));
}

// The selector helpers generateThemedCSS hands to a style sheet's themed()
// generator (see bitwrench-bccl-styles.js), so the BCCL sheet stays free of
// imports. Module-local: the sheet receives them as an argument.
var styleHelpers = { sx: _sx, tr: _tr, fr: _fr, sf: _sf };

// =========================================================================
// structuralRules — static CSS that never changes regardless of theme
// =========================================================================
//
// Architecture (v2.0.15 refactor):
//
//   structuralRules = { category: { selector: { prop: value } } }
//     Pure data — display, flex, position, overflow, cursor, z-index, etc.
//     NEVER contains colors, backgrounds, shadows, or border-colors.
//
//   generate*Themed(scope, palette, layout)
//     Computes all configurable CSS: colors from palette, padding from
//     spacing presets, border-radius from radius presets, box-shadow from
//     elevation presets, transitions from motion presets.
//
//   getStructuralStyles()  → flattens structuralRules + underscore aliases
//   getAllStyles()          → merge(getStructuralCSS(), generateThemedCSS())
//   defaultStyles           → backward-compat categorized view
//
// Adding a new BCCL component = add a category and a generate*Themed()
// function in bitwrench-bccl-styles.js, the widget sheet that ships with
// the factories (2.1.14). structuralRules here is core only: reset,
// typography, grid, stacks, offsets, tables, bar chart, responsive grid lines.
// =========================================================================

// Generate 12-column grid rules for a given class prefix (e.g. 'bw_col', 'bw_col_sm')
function _gridCols(prefix) {
  var r = {};
  for (var i = 1; i <= 12; i++) {
    var pct = +(100 * i / 12).toFixed(6) + '%';
    r['.' + prefix + '_' + i] = { 'flex': '0 0 ' + pct, 'max-width': pct };
  }
  return r;
}

var structuralRules = {
  // ---- Reset ----
  base: {
    '*': { 'box-sizing': 'border-box', 'margin': '0', 'padding': '0' },

    // The reset above zeroes padding on everything, which leaves a list with
    // list-style-position: outside rendering its markers to the LEFT of its own
    // content box -- overlapping whatever contains it. Put the indent back here
    // rather than in a class, so the reset replaces what it destroys instead of
    // leaving the damage for an opt-in to repair.
    //
    // Why 1.5em and not 1em. Measured in Chromium at a 16px root, marker ink
    // starts this far inside the list's own left edge:
    //
    //   1em -> 0px    1.25em -> 3px    1.5em -> 7px    2em -> 15px
    //
    // 1em looks like it should align the marker with the body-text edge, and
    // arithmetically it does -- but it aligns marker ink to the text BOX edge,
    // while the eye compares ink to ink. Every glyph has a left side bearing,
    // so at 1em the bullet reads as hanging outside the heading above it. That
    // is a real report from example 1a, not a theoretical concern. 1.5em clears
    // it with room to spare and matches what .bw_list has always shipped.
    //
    // em rather than rem so nested and smaller-type lists scale with their own
    // text instead of the root.
    // <menu> is a list too -- same list-style-position: outside, same markers
    // rendering to the left of a zeroed padding box. It is rare enough that
    // nobody reported it, which is exactly why it belongs here rather than in
    // whatever example trips over it next.
    'ul, ol, menu': { 'padding-left': '1.5em', 'margin-bottom': '1rem' },
    'ul ul, ul ol, ol ol, ol ul': { 'margin-bottom': '0' },

    // The same repair for the other two things `* { margin: 0 }` flattens.
    // A UA gives blockquote margin: 1em 40px and dd margin-left: 40px; the
    // reset takes both away, so a bare <blockquote> sits flush against body
    // text with nothing to say it is a quote, and a <dl> collapses into an
    // unreadable ladder of terms and definitions at the same indent.
    //
    // This is 2.1.6's rule applied where it was missed: plain markup should
    // look right with no class on it, and a class asks for something other
    // than the default rather than repairing one. .bw_quote is the former --
    // a rule with a coloured left border is styling you opt into, not the
    // repair for damage done here. Left indent only; the UA's symmetric 40px
    // right margin is a typographic opinion, not something the reset broke.
    // dl's half of the repair is just "a block of prose needs a bottom
    // margin", which is what the p rule in typography already says -- so it
    // says it there, for both, rather than as a second rule here.
    'blockquote': { 'margin': '0 0 1rem 1.5em' },
    'dd': { 'margin-left': '1.5em' },

    'html': {
      'font-size': '16px', 'line-height': '1.5',
      '-webkit-text-size-adjust': '100%',
      '-webkit-font-smoothing': 'antialiased',
      '-moz-osx-font-smoothing': 'grayscale'
    },
    'body': {
      'font-family': 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      'font-size': '1rem', 'font-weight': '400', 'line-height': '1.6',
      'margin': '0', 'padding': '0',
      '-webkit-font-smoothing': 'antialiased',
      '-moz-osx-font-smoothing': 'grayscale'
    },
    '.bw_page': { 'min-height': '100vh', 'display': 'flex', 'flex-direction': 'column' },
    '.bw_page_content': { 'flex': '1', 'padding': '2rem 0' },
    'main': { 'display': 'block' },
    // border: 0 is a normalize-style reset that expects a border added back.
    // Without the two longhands below, a bare <hr> is 1px tall with no border
    // and no background -- it occupies space and paints nothing. The longhands
    // follow the shorthand so they win; colour comes from generateProseThemed.
    'hr': {
      'box-sizing': 'content-box', 'height': '0', 'overflow': 'visible', 'margin': '1rem 0',
      'border': '0', 'border-top-width': '1px', 'border-top-style': 'solid'
    },
    'hr:not([size])': { 'height': '1px' }
  },

  // ---- Typography ----
  typography: {
    'h1, h2, h3, h4, h5, h6': {
      'margin-top': '0', 'margin-bottom': '.5rem', 'font-weight': '600',
      'line-height': '1.25', 'letter-spacing': '-0.01em'
    },
    'h1': { 'font-size': 'calc(1.375rem + 1.5vw)' },
    'h2': { 'font-size': 'calc(1.325rem + .9vw)' },
    'h3': { 'font-size': 'calc(1.3rem + .6vw)' },
    'h4': { 'font-size': 'calc(1.275rem + .3vw)' },
    'h5': { 'font-size': '1.25rem' },
    'h6': { 'font-size': '1rem' },
    'p, dl': { 'margin-top': '0', 'margin-bottom': '1rem' },

    // ---- Prose elements ----
    // ul/ol and hr are repaired in structuralRules.base, where the reset that
    // broke them lives -- these two classes are kept for compatibility and now
    // just restate the default. .bw_quote and .bw_code are different: bare
    // blockquote gets its indent back in base like any other reset casualty,
    // and .bw_quote is the styling (border, colour) you opt into on top. .bw_code
    // the reset never touched at all -- it simply has no opinion, so it stays
    // opt-in.
    '.bw_list': { 'padding-left': '1.5em', 'margin-bottom': '1rem' },
    '.bw_list .bw_list': { 'margin-bottom': '0' },
    '.bw_hr': {
      'height': '0', 'margin': '1.5rem 0',
      'border': '0', 'border-top-width': '1px', 'border-top-style': 'solid'
    },
    '.bw_quote': {
      'margin': '0 0 1rem', 'padding': '0.5rem 0 0.5rem 1rem',
      'border-left-width': '3px', 'border-left-style': 'solid'
    },
    '.bw_code': {
      'font-family': 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
      'font-size': '0.875em', 'padding': '0.15em 0.4em', 'border-radius': '4px'
    },
    'small': { 'font-size': '0.875rem' },
    'a': { 'text-decoration': 'none' },
    '.bw_display_4': { 'font-size': 'calc(1.475rem + 2.7vw)', 'font-weight': '300', 'line-height': '1.2' },
    '.bw_lead': { 'font-size': '1.25rem', 'font-weight': '300' },
    '.bw_h5': { 'font-size': '1.25rem' },
    '.bw_h6': { 'font-size': '1rem' }
  },

  // ---- Grid ----
  grid: {
    '.bw_bccl_container, .bw_container': {
      'width': '100%', 'padding-right': '0.75rem', 'padding-left': '0.75rem',
      'margin-right': 'auto', 'margin-left': 'auto'
    },
    '@media (min-width: 576px)': { '.bw_bccl_container, .bw_container': { 'max-width': '540px' } },
    '@media (min-width: 768px)': { '.bw_bccl_container, .bw_container': { 'max-width': '720px' } },
    '@media (min-width: 992px)': { '.bw_bccl_container, .bw_container': { 'max-width': '960px' } },
    '@media (min-width: 1200px)': { '.bw_bccl_container, .bw_container': { 'max-width': '1140px' } },
    '.bw_bccl_container_fluid': {
      'width': '100%', 'padding-right': '0.75rem', 'padding-left': '0.75rem',
      'margin-right': 'auto', 'margin-left': 'auto'
    },
    '.bw_row': {
      'display': 'flex', 'flex-wrap': 'wrap',
      'margin-right': '-0.375rem', 'margin-left': '-0.375rem'
    },
    '.bw_col, [class*="bw_col_"]': {
      'position': 'relative', 'width': '100%',
      'padding-right': '0.375rem', 'padding-left': '0.375rem'
    },
    '.bw_col': { 'flex-basis': '0', 'flex-grow': '1', 'max-width': '100%' },
    ..._gridCols('bw_col')
  },

  // ---- Tables ----
  tables: {
    // The table pager emits bw_bccl_btn bw_bccl_btn_sm (shared look with the
    // button factory). The button rules live in the widget sheet, which lean
    // does not carry, so the pager carries its own copy here: the same
    // declarations the sheet's .bw_bccl_btn / .bw_bccl_btn_sm give, scoped
    // under the pager, so full and lean render the pager identically.
    '.bw_bccl_table_pagination .bw_bccl_btn': {
      'display': 'inline-flex', 'align-items': 'center', 'justify-content': 'center',
      'font-weight': '500', 'line-height': '1.5', 'text-align': 'center',
      'text-decoration': 'none', 'vertical-align': 'middle', 'cursor': 'pointer',
      'user-select': 'none', 'border': '1px solid transparent',
      'font-family': 'inherit', 'gap': '0.5rem', 'font-size': '0.8125rem'
    },
    '.bw_bccl_table_pagination .bw_bccl_btn:disabled': { 'opacity': '0.5', 'cursor': 'not-allowed', 'pointer-events': 'none' },
    '.bw_bccl_table': {
      'width': '100%', 'margin-bottom': '1.5rem', 'vertical-align': 'top',
      'border-collapse': 'collapse', 'font-size': '0.9375rem', 'line-height': '1.5'
    },
    '.bw_bccl_table > :not(caption) > * > *': {
      'background-color': 'transparent',
      'border-bottom-width': '1px', 'border-bottom-style': 'solid'
    },
    '.bw_bccl_table > tbody': { 'vertical-align': 'inherit' },
    '.bw_bccl_table > thead': { 'vertical-align': 'bottom' },
    '.bw_bccl_table > thead > tr > *': {
      'font-size': '0.8125rem', 'font-weight': '600',
      'text-transform': 'uppercase', 'letter-spacing': '0.04em',
      'border-bottom-width': '2px'
    },
    '.bw_bccl_table caption': { 'font-size': '0.875rem', 'caption-side': 'bottom' },
    '.bw_bccl_table_bordered > :not(caption) > * > *': { 'border-width': '1px', 'border-style': 'solid' },
    '.bw_bccl_table_selectable > tbody > tr': { 'cursor': 'pointer' },
    '.bw_bccl_table > tbody > tr.bw_bccl_table_row_selected > *': { 'background-color': 'rgba(0, 102, 102, 0.1)' },
    '.bw_bccl_table_responsive': { 'overflow-x': 'auto', '-webkit-overflow-scrolling': 'touch' }
  },

  // ---- Stacks ----
  stacks: {
    '.bw_vstack': { 'display': 'flex', 'flex-direction': 'column' },
    '.bw_hstack': { 'display': 'flex', 'flex-direction': 'row', 'align-items': 'center' },
    '.bw_gap_0': { 'gap': '0' },
    '.bw_gap_1': { 'gap': '0.25rem' },
    '.bw_gap_2': { 'gap': '0.5rem' },
    '.bw_gap_3': { 'gap': '1rem' },
    '.bw_gap_4': { 'gap': '1.5rem' },
    '.bw_gap_5': { 'gap': '3rem' }
  },

  // ---- Offsets ----
  offsets: {
    '.bw_offset_1': { 'margin-left': '8.333333%' },
    '.bw_offset_2': { 'margin-left': '16.666667%' },
    '.bw_offset_3': { 'margin-left': '25%' },
    '.bw_offset_4': { 'margin-left': '33.333333%' },
    '.bw_offset_5': { 'margin-left': '41.666667%' },
    '.bw_offset_6': { 'margin-left': '50%' },
    '.bw_offset_7': { 'margin-left': '58.333333%' },
    '.bw_offset_8': { 'margin-left': '66.666667%' },
    '.bw_offset_9': { 'margin-left': '75%' },
    '.bw_offset_10': { 'margin-left': '83.333333%' },
    '.bw_offset_11': { 'margin-left': '91.666667%' }
  },

  // ---- Bar chart ----
  barChart: {
    '.bw_bar_chart_container': { 'padding': '1rem', 'border': '1px solid transparent' },
    '.bw_bar_chart': { 'display': 'flex', 'align-items': 'flex-end', 'gap': '6px', 'padding': '0 0.5rem' },
    '.bw_bar_group': { 'flex': '1', 'display': 'flex', 'flex-direction': 'column', 'align-items': 'center', 'height': '100%', 'justify-content': 'flex-end' },
    '.bw_bar': { 'width': '100%', 'border-radius': '3px 3px 0 0', 'min-height': '4px' },
    '.bw_bar:hover': { 'opacity': '0.85' },
    '.bw_bar_value': { 'font-size': '0.65rem', 'font-weight': '600', 'margin-bottom': '2px', 'text-align': 'center' },
    '.bw_bar_label': { 'font-size': '0.7rem', 'margin-top': '4px', 'text-align': 'center' },
    '.bw_bar_chart_title': { 'font-size': '1.1rem', 'font-weight': '600', 'margin': '0 0 0.75rem 0' }
  },

  // ---- Responsive ----
  responsive: {
    '@media (min-width: 576px)': _gridCols('bw_col_sm'),
    '@media (min-width: 768px)': _gridCols('bw_col_md'),
    '@media (min-width: 992px)': _gridCols('bw_col_lg'),
    '@media (min-width: 1200px)': _gridCols('bw_col_xl'),
    '@media (max-width: 575px)': {
      '.bw_hstack, .bw_hstack': { 'flex-direction': 'column' },
      '.bw_bccl_table': { 'display': 'block', 'overflow-x': 'auto', '-webkit-overflow-scrolling': 'touch' },
      '.bw_col, .bw_col_1, .bw_col_2, .bw_col_3, .bw_col_4, .bw_col_5, .bw_col_6, .bw_col_7, .bw_col_8, .bw_col_9, .bw_col_10, .bw_col_11, .bw_col_12': { 'flex': '0 0 100%', 'max-width': '100%' },
      '.bw_bccl_container': { 'padding-right': '0.5rem', 'padding-left': '0.5rem' },
      '.bw_bccl_container_fluid': { 'padding-right': '0.5rem', 'padding-left': '0.5rem' }
    }
  }
};

// =========================================================================
// Utility CSS — structural, generated programmatically
// =========================================================================

function generateUtilityRules() {
  var rules = {};

  // Spacing
  var spacingValues = { '0': '0', '1': '.25rem', '2': '.5rem', '3': '1rem', '4': '1.5rem', '5': '3rem' };
  for (var k in spacingValues) {
    var v = spacingValues[k];
    rules['.bw_m_' + k] = { 'margin': v + ' !important' };
    rules['.bw_mt_' + k] = { 'margin-top': v + ' !important' };
    rules['.bw_mb_' + k] = { 'margin-bottom': v + ' !important' };
    rules['.bw_ms_' + k] = { 'margin-left': v + ' !important' };
    rules['.bw_me_' + k] = { 'margin-right': v + ' !important' };
    rules['.bw_p_' + k] = { 'padding': v + ' !important' };
    rules['.bw_pt_' + k] = { 'padding-top': v + ' !important' };
    rules['.bw_pb_' + k] = { 'padding-bottom': v + ' !important' };
    rules['.bw_ps_' + k] = { 'padding-left': v + ' !important' };
    rules['.bw_pe_' + k] = { 'padding-right': v + ' !important' };
    // Gutter k: half on each side of every column, pulled back by the row
    var h = parseFloat(v) / 2 + 'rem';
    rules['.bw_g_' + k] = { 'margin-left': '-' + h, 'margin-right': '-' + h, 'row-gap': v };
    rules['.bw_g_' + k + ' > *'] = { 'padding-left': h, 'padding-right': h };
  }
  rules['.bw_m_auto'] = { 'margin': 'auto !important' };
  rules['.bw_py_3'] = { 'padding-top': '1rem !important', 'padding-bottom': '1rem !important' };
  rules['.bw_py_4'] = { 'padding-top': '1.5rem !important', 'padding-bottom': '1.5rem !important' };
  rules['.bw_py_5'] = { 'padding-top': '3rem !important', 'padding-bottom': '3rem !important' };
  rules['.bw_py_6'] = { 'padding-top': '4rem !important', 'padding-bottom': '4rem !important' };

  // Display
  rules['.bw_d_none'] = { 'display': 'none' };
  rules['.bw_d_block'] = { 'display': 'block' };
  rules['.bw_d_inline'] = { 'display': 'inline' };
  rules['.bw_d_inline_block'] = { 'display': 'inline-block' };
  rules['.bw_d_flex'] = { 'display': 'flex' };

  // Text alignment
  rules['.bw_text_left'] = { 'text-align': 'left' };
  rules['.bw_text_right'] = { 'text-align': 'right' };
  rules['.bw_text_center'] = { 'text-align': 'center' };
  rules['.bw_text_justify'] = { 'text-align': 'justify' };

  // Font weight
  rules['.bw_fw_bold'] = { 'font-weight': '700' };
  rules['.bw_fw_semibold'] = { 'font-weight': '600' };
  rules['.bw_fw_normal'] = { 'font-weight': '400' };
  rules['.bw_fw_light'] = { 'font-weight': '300' };

  // Font style
  rules['.bw_fst_italic'] = { 'font-style': 'italic' };
  rules['.bw_fst_normal'] = { 'font-style': 'normal' };

  // Text decoration
  rules['.bw_text_underline'] = { 'text-decoration': 'underline' };
  rules['.bw_text_line_through'] = { 'text-decoration': 'line-through' };
  rules['.bw_text_decoration_none'] = { 'text-decoration': 'none' };

  // Text transform
  rules['.bw_text_uppercase'] = { 'text-transform': 'uppercase' };
  rules['.bw_text_lowercase'] = { 'text-transform': 'lowercase' };
  rules['.bw_text_capitalize'] = { 'text-transform': 'capitalize' };

  // White-space
  rules['.bw_text_wrap'] = { 'white-space': 'normal' };
  rules['.bw_text_nowrap'] = { 'white-space': 'nowrap' };

  // Font size
  rules['.bw_fs_sm'] = { 'font-size': '0.875rem' };
  rules['.bw_fs_base'] = { 'font-size': '1rem' };
  rules['.bw_fs_lg'] = { 'font-size': '1.25rem' };
  rules['.bw_fs_xl'] = { 'font-size': '1.5rem' };

  // Flexbox
  var jc = { start: 'flex-start', end: 'flex-end', center: 'center', between: 'space-between', around: 'space-around' };
  for (var jk in jc) { rules['.bw_justify_content_' + jk] = { 'justify-content': jc[jk] }; }
  var ai = { start: 'flex-start', end: 'flex-end', center: 'center' };
  for (var ak in ai) { rules['.bw_align_items_' + ak] = { 'align-items': ai[ak] }; }

  // Borders
  rules['.bw_border'] = { 'border': '1px solid transparent !important' };
  rules['.bw_border_0'] = { 'border': '0 !important' };
  rules['.bw_border_top_0'] = { 'border-top': '0 !important' };
  rules['.bw_border_end_0'] = { 'border-right': '0 !important' };
  rules['.bw_border_bottom_0'] = { 'border-bottom': '0 !important' };
  rules['.bw_border_start_0'] = { 'border-left': '0 !important' };

  // Rounded
  rules['.bw_rounded'] = { 'border-radius': '.375rem !important' };
  rules['.bw_rounded_0'] = { 'border-radius': '0 !important' };
  rules['.bw_rounded_1'] = { 'border-radius': '.25rem !important' };
  rules['.bw_rounded_2'] = { 'border-radius': '.375rem !important' };
  rules['.bw_rounded_3'] = { 'border-radius': '.5rem !important' };
  rules['.bw_rounded_circle'] = { 'border-radius': '50% !important' };
  rules['.bw_rounded_pill'] = { 'border-radius': '50rem !important' };

  // Shadows
  rules['.bw_shadow'] = { 'box-shadow': '0 .5rem 1rem rgba(0,0,0,.15) !important' };
  rules['.bw_shadow_sm'] = { 'box-shadow': '0 .125rem .25rem rgba(0,0,0,.075) !important' };
  rules['.bw_shadow_lg'] = { 'box-shadow': '0 1rem 3rem rgba(0,0,0,.175) !important' };
  rules['.bw_shadow_none'] = { 'box-shadow': 'none !important' };

  // Width/Height
  ['25', '50', '75', '100'].forEach(function(n) {
    rules['.bw_w_' + n] = { 'width': n + '% !important' };
    rules['.bw_h_' + n] = { 'height': n + '% !important' };
  });
  rules['.bw_w_auto'] = { 'width': 'auto !important' };
  rules['.bw_h_auto'] = { 'height': 'auto !important' };
  rules['.bw_mw_100'] = { 'max-width': '100% !important' };
  rules['.bw_mh_100'] = { 'max-height': '100% !important' };

  // Positioning
  ['static', 'relative', 'absolute', 'fixed', 'sticky'].forEach(function(p) {
    rules['.bw_position_' + p] = { 'position': p + ' !important' };
  });
  rules['.bw_top_0'] = { 'top': '0 !important' };
  rules['.bw_top_50'] = { 'top': '50% !important' };
  rules['.bw_top_100'] = { 'top': '100% !important' };
  rules['.bw_bottom_0'] = { 'bottom': '0 !important' };
  rules['.bw_bottom_50'] = { 'bottom': '50% !important' };
  rules['.bw_bottom_100'] = { 'bottom': '100% !important' };
  rules['.bw_start_0'] = { 'left': '0 !important' };
  rules['.bw_start_50'] = { 'left': '50% !important' };
  rules['.bw_start_100'] = { 'left': '100% !important' };
  rules['.bw_end_0'] = { 'right': '0 !important' };
  rules['.bw_end_50'] = { 'right': '50% !important' };
  rules['.bw_end_100'] = { 'right': '100% !important' };
  rules['.bw_translate_middle'] = { 'transform': 'translate(-50%, -50%) !important' };

  // Overflow
  ['auto', 'hidden', 'visible', 'scroll'].forEach(function(o) {
    rules['.bw_overflow_' + o] = { 'overflow': o + ' !important' };
  });

  // Typography — bw_ prefixed utilities via loops
  var _imp = function(p, v) { var o = {}; o[p] = v + ' !important'; return o; };
  [['fs',{'xs':'0.75rem','sm':'0.875rem','base':'1rem','lg':'1.125rem','xl':'1.25rem','2xl':'1.5rem'},'font-size'],
   ['fw',{light:'300',normal:'400',medium:'500',semibold:'600',bold:'700'},'font-weight'],
   ['lh',{tight:'1.25',normal:'1.5',relaxed:'1.75'},'line-height']
  ].forEach(function(d) { for (var dk in d[1]) rules['.bw_'+d[0]+'_'+dk] = _imp(d[2], d[1][dk]); });

  // List utilities
  rules['.bw_list_unstyled'] = { 'padding-left': '0', 'list-style': 'none' };
  rules['.bw_list_inline'] = { 'padding-left': '0', 'list-style': 'none' };
  rules['.bw_list_inline_item'] = { 'display': 'inline-block' };
  rules['.bw_list_inline_item:not(:last-child)'] = { 'margin-right': '.5rem' };

  // Flex utilities
  rules['.bw_flex'] = { 'display': 'flex' };
  rules['.bw_flex_column'] = { 'flex-direction': 'column' };
  rules['.bw_flex_wrap'] = { 'flex-wrap': 'wrap' };
  rules['.bw_flex_center'] = { 'display': 'flex', 'align-items': 'center', 'justify-content': 'center' };
  for (var gk in spacingValues) rules['.bw_gap_' + gk] = { 'gap': spacingValues[gk] + ' !important' };

  // Visibility
  rules['.bw_visible'] = { 'visibility': 'visible !important' };
  rules['.bw_invisible'] = { 'visibility': 'hidden !important' };

  // User select
  ['all', 'auto', 'none'].forEach(function(u) {
    rules['.bw_user_select_' + u] = { 'user-select': u + ' !important' };
  });

  // Pointer events
  rules['.bw_pe_none'] = { 'pointer-events': 'none !important' };
  rules['.bw_pe_auto'] = { 'pointer-events': 'auto !important' };

  // Opacity
  rules['.bw_opacity_0'] = { 'opacity': '0 !important' };
  rules['.bw_opacity_25'] = { 'opacity': '.25 !important' };
  rules['.bw_opacity_50'] = { 'opacity': '.5 !important' };
  rules['.bw_opacity_75'] = { 'opacity': '.75 !important' };
  rules['.bw_opacity_100'] = { 'opacity': '1 !important' };

  return rules;
}

// =========================================================================
// Flatten structuralRules → flat CSS rules object
// =========================================================================

function getStructuralCSS(sheets) {
  var result = {};
  // Core categories first, then each installed sheet's categories (the BCCL
  // widget sheet), then the utilities -- the order the one file had through
  // 2.1.13, so a utility class still wins over a widget default.
  var sections = [];
  Object.keys(structuralRules).forEach(function(c) { sections.push(structuralRules[c]); });
  (sheets || []).forEach(function(sh) {
    var cats = sh.structural();
    Object.keys(cats).forEach(function(c) { sections.push(cats[c]); });
  });
  for (var i = 0; i < sections.length; i++) {
    var sec = sections[i];
    for (var k in sec) {
      // A repeated @media key merges and moves to its later position, so
      // breakpoint grid rules land after the base .bw_col_N rules (#103).
      var prev = result[k];
      delete result[k];
      result[k] = prev && k.charAt(0) === '@' ? Object.assign({}, prev, sec[k]) : sec[k];
    }
  }
  Object.assign(result, generateUtilityRules());

  // Accessibility: reduce motion
  result['@media (prefers-reduced-motion: reduce)'] = {
    '*, *::before, *::after': {
      'animation-duration': '0.01ms !important',
      'animation-iteration-count': '1 !important',
      'transition-duration': '0.01ms !important',
      'scroll-behavior': 'auto !important'
    }
  };

  return result;
}

// =========================================================================
// getStructuralStyles — public API (backward compatible)
// =========================================================================

/**
 * Get all structural (theme-independent) CSS rules.
 * @returns {Object} CSS rules object
 */
export function getStructuralStyles(sheets) {
  return getStructuralCSS(sheets);
}

/**
 * Get CSS reset rules only (box-sizing, html/body font, reduced-motion).
 * Separate from themed/structural rules for independent injection.
 * @returns {Object} CSS rules object for the reset layer
 */
export function getResetStyles() {
  var rules = {};
  Object.assign(rules, structuralRules.base);
  // Include reduced-motion preference
  rules['@media (prefers-reduced-motion: reduce)'] = {
    '*, *::before, *::after': {
      'animation-duration': '0.01ms !important',
      'animation-iteration-count': '1 !important',
      'transition-duration': '0.01ms !important',
      'scroll-behavior': 'auto !important'
    }
  };
  return rules;
}

// =========================================================================
// defaultStyles — backward-compatible categorized view
// =========================================================================
//
// Tests import `defaultStyles` and check for category keys.
// We export structuralRules directly as defaultStyles — it already
// has all the required category keys. The 'utilities' category is
// generated from generateUtilityRules().
// =========================================================================

export var defaultStyles = Object.assign({}, structuralRules, {
  // Merge utility categories for backward compat
  reset: structuralRules.base,
  tableResponsive: { '.bw_bccl_table_responsive': { 'overflow-x': 'auto', '-webkit-overflow-scrolling': 'touch' } },
  utilities: generateUtilityRules()
});

// =========================================================================
// getAllStyles — backward compatible
// =========================================================================

export function getAllStyles() {
  return getStructuralCSS();
}

// =========================================================================
// Theme configuration object (deprecated — use makeStyles())
// =========================================================================

export let theme = {
  colors: {
    primary: '#006666',
    secondary: '#6c757d',
    success: '#198754',
    danger: '#dc3545',
    warning: '#b38600',
    info: '#0891b2',
    light: '#f8f9fa',
    dark: '#212529',
    white: '#fff',
    black: '#000'
  },
  breakpoints: {
    xs: 0,
    sm: 576,
    md: 768,
    lg: 992,
    xl: 1200,
    xxl: 1400
  },
  spacing: {
    0: '0',
    1: '0.25rem',
    2: '0.5rem',
    3: '1rem',
    4: '1.5rem',
    5: '3rem'
  },
  typography: {
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
      '5xl': '3rem'
    }
  },
};

/**
 * Generate alternate-palette CSS scoped under `.bw_theme_alt`.
 * Uses the same `generateThemedCSS()` pipeline as the primary palette —
 * both sides go through identical code paths.
 *
 * @param {string} name - Theme scope name (e.g. 'ocean'). '' for global.
 * @param {Object} altPalette - From derivePalette(deriveAlternateConfig(...))
 * @param {Object} layout - From resolveLayout()
 * @returns {Object} CSS rules object scoped under .bw_theme_alt (+ optional .name)
 */
export function generateAlternateCSS(name, altPalette, layout, sheets) {
  var rawRules = generateThemedCSS('', altPalette, layout, sheets);
  var altPrefix = name ? '.' + name + '.bw_theme_alt' : '.bw_theme_alt';
  var altRules = scopeRulesUnder(rawRules, altPrefix);

  altRules[altPrefix + ' body, :root' + altPrefix + ' body'] = {
    'color': altPalette.dark.base,
    'background-color': altPalette.light.base
  };

  return altRules;
}

/**
 * Prefix every selector in a rules object with a scope selector.
 * Handles @media/@keyframes blocks and comma-separated selectors.
 * @param {Object} rules - CSS rules object
 * @param {string} prefix - Scope prefix (e.g. '#my-dashboard', '.bw_theme_alt')
 * @param {boolean} [compound=false] - If true, use compound selector (no space)
 *   for the first segment: `#scope.bw_theme_alt .sel` vs `#scope .sel`
 * @returns {Object} New rules object with scoped selectors
 */
export function scopeRulesUnder(rules, prefix, _compound) {
  var scoped = {};
  for (var sel in rules) {
    if (!Object.prototype.hasOwnProperty.call(rules, sel)) continue;
    if (sel.charAt(0) === '@') {
      var innerBlock = rules[sel];
      // @keyframes — steps (0%, 100%, from, to) are NOT selectors; pass through
      if (/^@keyframes\s/.test(sel)) {
        scoped[sel] = innerBlock;
      } else {
        // @media — prefix inner selectors
        var scopedInner = {};
        for (var innerSel in innerBlock) {
          if (!Object.prototype.hasOwnProperty.call(innerBlock, innerSel)) continue;
          scopedInner[_prefixSelector(innerSel, prefix)] = innerBlock[innerSel];
        }
        scoped[sel] = scopedInner;
      }
    } else {
      scoped[_prefixSelector(sel, prefix)] = rules[sel];
    }
  }
  return scoped;
}

function _prefixSelector(sel, prefix) {
  var parts = sel.split(',');
  var result = [];
  for (var i = 0; i < parts.length; i++) {
    result.push(prefix + ' ' + parts[i].trim());
  }
  return result.join(', ');
}

export function deepMerge(target, source) {
  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])
        && target[key] && typeof target[key] === 'object' && !Array.isArray(target[key])) {
      deepMerge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
}

export function updateTheme(overrides) {
  deepMerge(theme, overrides);
}
