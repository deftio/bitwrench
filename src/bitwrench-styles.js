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
 * Style categories: root (CSS variables), reset, typography, grid, buttons,
 * cards, forms, navigation, tables, alerts, badges, progress, tabs, listGroups,
 * pagination, breadcrumb, hero, features, enhancedCards, sections, cta,
 * utilities, responsive.
 *
 * @module bitwrench-styles
 * @license BSD-2-Clause
 * @author M A Chatterjee <deftio [at] deftio [dot] com>
 */

import { derivePalette, deriveShades, adjustLightness, mixColor, textOnColor, hexToHsl, hslToHex } from './bitwrench-color-utils.js';

// Re-export for use by bitwrench.js
export { derivePalette };

// =========================================================================
// Layout presets
// =========================================================================

/**
 * Base spacing scale (4px unit). Shared design token for consistent spacing
 * across all components. Use scale keys (0-7) in component definitions.
 */
export var SPACING_SCALE = {
  0: '0',
  1: '0.25rem',   // 4px
  2: '0.5rem',    // 8px
  3: '0.75rem',   // 12px
  4: '1rem',      // 16px
  5: '1.5rem',    // 24px
  6: '2rem',      // 32px
  7: '3rem'       // 48px
};

export var SPACING_PRESETS = {
  compact:  { btn: SPACING_SCALE[1] + ' ' + SPACING_SCALE[3],  card: SPACING_SCALE[3] + ' ' + SPACING_SCALE[4], alert: SPACING_SCALE[2] + ' ' + SPACING_SCALE[4], cell: SPACING_SCALE[2] + ' ' + SPACING_SCALE[3], input: SPACING_SCALE[1] + ' ' + SPACING_SCALE[3] },
  normal:   { btn: SPACING_SCALE[2] + ' ' + SPACING_SCALE[4],  card: SPACING_SCALE[5] + ' ' + SPACING_SCALE[5], alert: SPACING_SCALE[3] + ' ' + SPACING_SCALE[5], cell: SPACING_SCALE[3] + ' ' + SPACING_SCALE[4], input: SPACING_SCALE[2] + ' ' + SPACING_SCALE[3] },
  spacious: { btn: SPACING_SCALE[3] + ' ' + SPACING_SCALE[5],  card: SPACING_SCALE[6] + ' ' + SPACING_SCALE[6], alert: SPACING_SCALE[4] + ' ' + SPACING_SCALE[5], cell: SPACING_SCALE[4] + ' ' + SPACING_SCALE[5], input: SPACING_SCALE[3] + ' ' + SPACING_SCALE[4] }
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
    sm:  '0 1px 3px rgba(0,0,0,0.08)',
    md:  '0 2px 6px rgba(0,0,0,0.12)',
    lg:  '0 4px 12px rgba(0,0,0,0.16)',
    xl:  '0 8px 24px rgba(0,0,0,0.20)'
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
export var THEME_PRESETS = {
  teal:     { primary: '#006666', secondary: '#6c757d', tertiary: '#006666' },
  ocean:    { primary: '#0077b6', secondary: '#90e0ef', tertiary: '#00b4d8' },
  sunset:   { primary: '#e76f51', secondary: '#264653', tertiary: '#e9c46a' },
  forest:   { primary: '#2d6a4f', secondary: '#95d5b2', tertiary: '#52b788' },
  slate:    { primary: '#343a40', secondary: '#adb5bd', tertiary: '#6c757d' },
  rose:     { primary: '#e11d48', secondary: '#fda4af', tertiary: '#fb7185' },
  indigo:   { primary: '#4f46e5', secondary: '#a5b4fc', tertiary: '#818cf8' },
  amber:    { primary: '#d97706', secondary: '#fbbf24', tertiary: '#f59e0b' },
  emerald:  { primary: '#059669', secondary: '#6ee7b7', tertiary: '#34d399' },
  nord:     { primary: '#5e81ac', secondary: '#88c0d0', tertiary: '#81a1c1' },
  coral:    { primary: '#ef6461', secondary: '#4a7c7e', tertiary: '#e8a87c' },
  midnight: { primary: '#1e3a5f', secondary: '#7c8db5', tertiary: '#3d5a80' }
};

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
  if (sel.includes(',')) return sel.split(',').map(function(s) { return '.' + name + ' ' + s.trim(); }).join(', ');
  return '.' + name + ' ' + sel;
}

// =========================================================================
// Themed CSS generators
// =========================================================================

function generateTypographyThemed(scope, palette, layout) {
  var mot = layout.motion;
  var rules = {};
  rules[scopeSelector(scope, 'a')] = {
    'color': palette.primary.base,
    'text-decoration': 'none',
    'transition': 'color ' + mot.fast + ' ' + mot.easing
  };
  rules[scopeSelector(scope, 'a:hover')] = {
    'color': palette.primary.hover,
    'text-decoration': 'underline'
  };
  return rules;
}

function generateButtons(scope, palette, layout) {
  var rules = {};
  var sp = layout.spacing;
  var rd = layout.radius;

  // Base button (only when scoped — unscoped uses defaultStyles)
  rules[scopeSelector(scope, '.bw_btn')] = {
    'padding': sp.btn,
    'border-radius': rd.btn
  };
  rules[scopeSelector(scope, '.bw_btn:focus-visible')] = {
    'outline': '2px solid currentColor',
    'outline-offset': '2px',
    'box-shadow': '0 0 0 3px ' + palette.primary.focus
  };

  // Variant colors handled by palette class on component root

  // Size variants (structural, reuse layout radius)
  rules[scopeSelector(scope, '.bw_btn_lg')] = {
    'padding': '0.625rem 1.5rem',
    'font-size': '1rem',
    'border-radius': rd.btn === '50rem' ? '50rem' : (parseInt(rd.btn) + 2) + 'px'
  };
  rules[scopeSelector(scope, '.bw_btn_sm')] = {
    'padding': '0.25rem 0.75rem',
    'font-size': '0.8125rem',
    'border-radius': rd.btn === '50rem' ? '50rem' : (Math.max(parseInt(rd.btn) - 1, 0)) + 'px'
  };

  return rules;
}

function generateAlerts(scope, palette, layout) {
  var rules = {};
  var sp = layout.spacing;
  var rd = layout.radius;

  rules[scopeSelector(scope, '.bw_alert')] = {
    'padding': sp.alert,
    'border-radius': rd.alert
  };

  // Variant colors handled by palette class on component root

  return rules;
}

// generateBadges: removed — palette class on root handles variants

function generateCards(scope, palette, layout) {
  var rules = {};
  var sp = layout.spacing;
  var rd = layout.radius;

  var elev = layout.elevation;
  var motion = layout.motion;
  rules[scopeSelector(scope, '.bw_card')] = {
    'background-color': palette.surface || '#fff',
    'border': '1px solid ' + palette.light.border,
    'border-radius': rd.card,
    'box-shadow': elev.sm,
    'transition': 'box-shadow ' + motion.normal + ' ' + motion.easing + ', transform ' + motion.normal + ' ' + motion.easing
  };
  rules[scopeSelector(scope, '.bw_card:hover')] = {
    'box-shadow': elev.md
  };
  rules[scopeSelector(scope, '.bw_card_hoverable:hover')] = {
    'box-shadow': elev.lg
  };
  rules[scopeSelector(scope, '.bw_card_body')] = {
    'padding': sp.card
  };
  rules[scopeSelector(scope, '.bw_card_header')] = {
    'padding': sp.card.split(' ').map(function(v) { return (parseFloat(v) * 0.7).toFixed(3).replace(/\.?0+$/, '') + 'rem'; }).join(' '),
    'background-color': palette.light.light,
    'border-bottom': '1px solid ' + palette.light.border
  };
  rules[scopeSelector(scope, '.bw_card_footer')] = {
    'background-color': palette.light.light,
    'border-top': '1px solid ' + palette.light.border,
    'color': palette.secondary.base
  };
  rules[scopeSelector(scope, '.bw_card_title')] = {
    'color': palette.dark.base
  };
  rules[scopeSelector(scope, '.bw_card_subtitle')] = {
    'color': palette.secondary.base
  };

  // Card variant accent handled by palette class on component root

  return rules;
}

function generateForms(scope, palette, layout) {
  var rules = {};
  var sp = layout.spacing;
  var rd = layout.radius;

  rules[scopeSelector(scope, '.bw_form_control')] = {
    'padding': sp.input,
    'border-radius': rd.input,
    'color': palette.dark.base,
    'background-color': palette.surface || '#fff',
    'border-color': palette.light.border
  };
  rules[scopeSelector(scope, '.bw_form_control:focus')] = {
    'border-color': palette.primary.border,
    'outline': '2px solid ' + palette.primary.base,
    'outline-offset': '-1px',
    'box-shadow': '0 0 0 0.25rem ' + palette.primary.focus
  };
  rules[scopeSelector(scope, '.bw_form_control::placeholder')] = {
    'color': palette.secondary.base
  };
  rules[scopeSelector(scope, '.bw_form_label')] = {
    'color': palette.dark.base
  };
  rules[scopeSelector(scope, '.bw_form_text')] = {
    'color': palette.secondary.base
  };
  rules[scopeSelector(scope, '.bw_form_check_input:checked')] = {
    'background-color': palette.primary.base,
    'border-color': palette.primary.base
  };
  rules[scopeSelector(scope, '.bw_form_check_input:focus')] = {
    'box-shadow': '0 0 0 0.25rem ' + palette.primary.focus
  };
  // Validation states
  rules[scopeSelector(scope, '.bw_form_control.bw_is_valid')] = { 'border-color': palette.success.base };
  rules[scopeSelector(scope, '.bw_form_control.bw_is_valid:focus')] = {
    'border-color': palette.success.base,
    'box-shadow': '0 0 0 0.2rem ' + palette.success.focus
  };
  rules[scopeSelector(scope, '.bw_form_control.bw_is_invalid')] = { 'border-color': palette.danger.base };
  rules[scopeSelector(scope, '.bw_form_control.bw_is_invalid:focus')] = {
    'border-color': palette.danger.base,
    'box-shadow': '0 0 0 0.2rem ' + palette.danger.focus
  };
  // Form select
  rules[scopeSelector(scope, '.bw_form_select')] = {
    'padding': sp.input,
    'border-radius': rd.input,
    'color': palette.dark.base,
    'background-color': palette.surface || '#fff',
    'border-color': palette.light.border
  };
  rules[scopeSelector(scope, '.bw_form_select:focus')] = {
    'border-color': palette.primary.border,
    'box-shadow': '0 0 0 0.25rem ' + palette.primary.focus
  };

  return rules;
}

function generateNavigation(scope, palette) {
  var rules = {};
  rules[scopeSelector(scope, '.bw_navbar')] = {
    'background-color': palette.light.light,
    'border-bottom-color': palette.light.border
  };
  rules[scopeSelector(scope, '.bw_navbar_brand')] = {
    'color': palette.dark.base
  };
  rules[scopeSelector(scope, '.bw_navbar_nav .bw_nav_link')] = {
    'color': palette.secondary.base
  };
  rules[scopeSelector(scope, '.bw_navbar_nav .bw_nav_link:hover')] = {
    'color': palette.dark.base
  };
  rules[scopeSelector(scope, '.bw_navbar_nav .bw_nav_link.active')] = {
    'color': palette.primary.base,
    'background-color': palette.primary.focus
  };
  rules[scopeSelector(scope, '.bw_navbar_dark')] = {
    'background-color': palette.dark.base,
    'border-bottom-color': palette.dark.hover
  };
  rules[scopeSelector(scope, '.bw_navbar_dark .bw_navbar_brand')] = {
    'color': palette.light.base
  };
  rules[scopeSelector(scope, '.bw_navbar_dark .bw_nav_link')] = {
    'color': 'rgba(255,255,255,.65)'
  };
  rules[scopeSelector(scope, '.bw_navbar_dark .bw_nav_link:hover')] = {
    'color': '#fff'
  };
  rules[scopeSelector(scope, '.bw_navbar_dark .bw_nav_link.active')] = {
    'color': '#fff',
    'font-weight': '600'
  };
  rules[scopeSelector(scope, '.bw_nav_pills .bw_nav_link.active')] = {
    'color': palette.primary.textOn,
    'background-color': palette.primary.base
  };
  return rules;
}

function generateTables(scope, palette, layout) {
  var rules = {};
  var sp = layout.spacing;

  rules[scopeSelector(scope, '.bw_table')] = {
    'color': palette.dark.base,
    'border-color': palette.light.border
  };
  rules[scopeSelector(scope, '.bw_table > :not(caption) > * > *')] = {
    'padding': sp.cell,
    'border-bottom-color': palette.light.border
  };
  rules[scopeSelector(scope, '.bw_table > thead > tr > *')] = {
    'color': palette.secondary.base,
    'border-bottom-color': palette.light.border,
    'background-color': palette.light.light
  };
  rules[scopeSelector(scope, '.bw_table_striped > tbody > tr:nth-of-type(odd) > *')] = {
    'background-color': 'rgba(0, 0, 0, 0.05)'
  };
  rules[scopeSelector(scope, '.bw_table_hover > tbody > tr:hover > *')] = {
    'background-color': palette.primary.focus
  };
  rules[scopeSelector(scope, '.bw_table_bordered')] = {
    'border-color': palette.light.border
  };
  rules[scopeSelector(scope, '.bw_table caption')] = {
    'color': palette.secondary.base
  };

  return rules;
}

function generateTabs(scope, palette) {
  var rules = {};
  rules[scopeSelector(scope, '.bw_nav_tabs')] = {
    'border-bottom-color': palette.light.border
  };
  rules[scopeSelector(scope, '.bw_nav_link')] = {
    'color': palette.secondary.base
  };
  rules[scopeSelector(scope, '.bw_nav_tabs .bw_nav_link:hover')] = {
    'color': palette.dark.base,
    'border-bottom-color': palette.light.border
  };
  rules[scopeSelector(scope, '.bw_nav_tabs .bw_nav_link.active')] = {
    'color': palette.primary.base,
    'border-bottom': '2px solid ' + palette.primary.base
  };
  return rules;
}

function generateListGroups(scope, palette, layout) {
  var rules = {};
  var sp = layout.spacing;

  rules[scopeSelector(scope, '.bw_list_group_item')] = {
    'padding': sp.cell,
    'color': palette.dark.base,
    'background-color': palette.surface || '#fff',
    'border-color': palette.light.border
  };
  rules[scopeSelector(scope, 'a.bw_list_group_item:hover')] = {
    'background-color': palette.light.light,
    'color': palette.dark.hover
  };
  rules[scopeSelector(scope, '.bw_list_group_item.active')] = {
    'color': palette.primary.textOn,
    'background-color': palette.primary.base,
    'border-color': palette.primary.base
  };
  rules[scopeSelector(scope, '.bw_list_group_item.disabled')] = {
    'color': palette.secondary.base,
    'background-color': palette.surface || '#fff'
  };

  return rules;
}

function generatePagination(scope, palette) {
  var rules = {};
  rules[scopeSelector(scope, '.bw_page_link')] = {
    'color': palette.primary.base,
    'background-color': palette.surface || '#fff',
    'border-color': palette.light.border
  };
  rules[scopeSelector(scope, '.bw_page_link:hover')] = {
    'color': palette.primary.hover,
    'background-color': palette.light.light,
    'border-color': palette.light.border
  };
  rules[scopeSelector(scope, '.bw_page_link:focus')] = {
    'outline': '2px solid ' + palette.primary.base,
    'outline-offset': '-2px'
  };
  rules[scopeSelector(scope, '.bw_page_item.bw_active .bw_page_link')] = {
    'color': palette.primary.textOn,
    'background-color': palette.primary.base,
    'border-color': palette.primary.base
  };
  rules[scopeSelector(scope, '.bw_page_item.bw_disabled .bw_page_link')] = {
    'color': palette.secondary.base,
    'background-color': palette.surface || '#fff',
    'border-color': palette.light.border
  };
  return rules;
}

function generateProgress(scope, palette) {
  var rules = {};
  rules[scopeSelector(scope, '.bw_progress')] = {
    'background-color': palette.light.light,
    'box-shadow': 'inset 0 1px 2px rgba(0,0,0,.1)'
  };
  rules[scopeSelector(scope, '.bw_progress_bar')] = {
    'color': '#fff',
    'background-color': palette.primary.base,
    'box-shadow': 'inset 0 -1px 0 rgba(0,0,0,.15)'
  };
  // Variant progress bar colors handled by palette class
  return rules;
}

// generateHero: removed — palette class with .bw_hero override handles variants

// generateUtilityColors: removed — palette classes replace utility colors

function generateResetThemed(scope, palette) {
  var rules = {};
  var bg = palette.background || '#f5f5f5';
  var baseReset = {
    'color': palette.dark.base,
    'background-color': bg
  };
  rules[scopeSelector(scope, 'body')] = baseReset;
  // Also apply to the scope element itself so themes work on any container, not just body
  if (scope) {
    rules['.' + scope] = baseReset;
  }
  return rules;
}

function generateBreadcrumbThemed(scope, palette) {
  var rules = {};
  rules[scopeSelector(scope, '.bw_breadcrumb_item + .bw_breadcrumb_item::before')] = {
    'color': palette.secondary.base
  };
  rules[scopeSelector(scope, '.bw_breadcrumb_item.active')] = {
    'color': palette.secondary.base
  };
  rules[scopeSelector(scope, '.bw_breadcrumb_item a:hover')] = {
    'color': palette.primary.hover,
    'text-decoration': 'underline'
  };
  return rules;
}

// generateSpinnerThemed: removed — palette class on root handles variants

function generateCloseButtonThemed(scope, palette) {
  var rules = {};
  rules[scopeSelector(scope, '.bw_close')] = {
    'color': palette.dark.base,
    'opacity': '0.5'
  };
  rules[scopeSelector(scope, '.bw_close:focus')] = {
    'box-shadow': '0 0 0 0.25rem ' + palette.primary.focus
  };
  return rules;
}

function generateSectionsThemed(scope, palette) {
  var rules = {};
  rules[scopeSelector(scope, '.bw_section_subtitle')] = {
    'color': palette.secondary.base
  };
  rules[scopeSelector(scope, '.bw_feature_description')] = {
    'color': palette.secondary.base
  };
  rules[scopeSelector(scope, '.bw_cta_description')] = {
    'color': palette.secondary.base
  };
  return rules;
}

function generateAccordionThemed(scope, palette) {
  var rules = {};
  rules[scopeSelector(scope, '.bw_accordion_item')] = {
    'background-color': palette.surface || '#fff',
    'border-color': palette.light.border
  };
  rules[scopeSelector(scope, '.bw_accordion_button')] = {
    'color': palette.dark.base
  };
  rules[scopeSelector(scope, '.bw_accordion_button:not(.bw_collapsed)')] = {
    'color': palette.primary.darkText,
    'background-color': palette.primary.light
  };
  rules[scopeSelector(scope, '.bw_accordion_button:hover')] = {
    'background-color': palette.light.light
  };
  rules[scopeSelector(scope, '.bw_accordion_button:not(.bw_collapsed):hover')] = {
    'background-color': palette.primary.hover
  };
  rules[scopeSelector(scope, '.bw_accordion_button:focus-visible')] = {
    'box-shadow': '0 0 0 0.2rem ' + palette.primary.focus
  };
  rules[scopeSelector(scope, '.bw_accordion_body')] = {
    'border-top': '1px solid ' + palette.light.border
  };
  return rules;
}

function generateCarouselThemed(scope, palette) {
  var rules = {};
  rules[scopeSelector(scope, '.bw_carousel')] = {
    'background-color': palette.light.light
  };
  rules[scopeSelector(scope, '.bw_carousel_indicator.active')] = {
    'background-color': palette.primary.base
  };
  rules[scopeSelector(scope, '.bw_carousel_control')] = {
    'background-color': 'rgba(0,0,0,0.4)',
    'color': '#fff'
  };
  rules[scopeSelector(scope, '.bw_carousel_control:hover')] = {
    'background-color': 'rgba(0,0,0,0.6)'
  };
  rules[scopeSelector(scope, '.bw_carousel_caption')] = {
    'background': 'linear-gradient(transparent, rgba(0,0,0,0.6))',
    'color': '#fff'
  };
  return rules;
}

function generateModalThemed(scope, palette, layout) {
  var rules = {};
  rules[scopeSelector(scope, '.bw_modal_content')] = {
    'background-color': palette.surface || '#fff',
    'border-color': palette.light.border,
    'box-shadow': layout.elevation.lg
  };
  rules[scopeSelector(scope, '.bw_modal_header')] = {
    'border-bottom-color': palette.light.border
  };
  rules[scopeSelector(scope, '.bw_modal_footer')] = {
    'border-top-color': palette.light.border
  };
  rules[scopeSelector(scope, '.bw_modal_title')] = {
    'color': palette.dark.base
  };
  return rules;
}

function generateToastThemed(scope, palette, layout) {
  var rules = {};
  rules[scopeSelector(scope, '.bw_toast')] = {
    'background-color': palette.surface || '#fff',
    'border-color': 'rgba(0,0,0,0.1)',
    'box-shadow': layout.elevation.lg
  };
  rules[scopeSelector(scope, '.bw_toast_header')] = {
    'border-bottom-color': 'rgba(0,0,0,0.05)'
  };
  // Variant toast borders handled by palette class
  return rules;
}

function generateDropdownThemed(scope, palette, layout) {
  var rules = {};
  rules[scopeSelector(scope, '.bw_dropdown_menu')] = {
    'background-color': palette.surface || '#fff',
    'border-color': palette.light.border,
    'box-shadow': layout.elevation.md
  };
  rules[scopeSelector(scope, '.bw_dropdown_item')] = {
    'color': palette.dark.base
  };
  rules[scopeSelector(scope, '.bw_dropdown_item:hover')] = {
    'color': palette.dark.hover,
    'background-color': palette.light.light
  };
  rules[scopeSelector(scope, '.bw_dropdown_item.disabled')] = {
    'color': palette.secondary.base
  };
  rules[scopeSelector(scope, '.bw_dropdown_divider')] = {
    'border-top-color': palette.light.border
  };
  return rules;
}

function generateSwitchThemed(scope, palette) {
  var rules = {};
  rules[scopeSelector(scope, '.bw_form_switch .bw_switch_input')] = {
    'background-color': palette.secondary.base,
    'border-color': palette.secondary.base
  };
  rules[scopeSelector(scope, '.bw_form_switch .bw_switch_input:checked')] = {
    'background-color': palette.primary.base,
    'border-color': palette.primary.base
  };
  rules[scopeSelector(scope, '.bw_form_switch .bw_switch_input:focus')] = {
    'box-shadow': '0 0 0 0.25rem ' + palette.primary.focus
  };
  return rules;
}

function generateSkeletonThemed(scope, palette) {
  var rules = {};
  rules[scopeSelector(scope, '.bw_skeleton')] = {
    'background': 'linear-gradient(90deg, ' + palette.light.border + ' 25%, ' + palette.light.light + ' 37%, ' + palette.light.border + ' 63%)'
  };
  return rules;
}

// generateAvatarThemed: removed — palette class on root handles variants

function generateStatCardThemed(scope, palette) {
  var rules = {};
  // Variant border colors handled by palette class
  rules[scopeSelector(scope, '.bw_stat_change_up')] = { 'color': palette.success.base };
  rules[scopeSelector(scope, '.bw_stat_change_down')] = { 'color': palette.danger.base };
  return rules;
}

function generateTimelineThemed(scope, palette) {
  var rules = {};
  rules[scopeSelector(scope, '.bw_timeline::before')] = { 'background-color': palette.light.border };
  // Variant marker colors handled by palette class
  rules[scopeSelector(scope, '.bw_timeline_date')] = { 'color': palette.secondary.base };
  return rules;
}

function generateStepperThemed(scope, palette) {
  var rules = {};
  rules[scopeSelector(scope, '.bw_step_indicator')] = {
    'background-color': palette.light.light,
    'border': '2px solid ' + palette.light.border,
    'color': palette.secondary.base
  };
  rules[scopeSelector(scope, '.bw_step + .bw_step::before')] = { 'background-color': palette.light.border };
  rules[scopeSelector(scope, '.bw_step_active .bw_step_indicator')] = {
    'background-color': palette.primary.base,
    'color': palette.primary.textOn
  };
  rules[scopeSelector(scope, '.bw_step_active .bw_step_label')] = {
    'color': palette.dark.base,
    'font-weight': '600'
  };
  rules[scopeSelector(scope, '.bw_step_completed .bw_step_indicator')] = {
    'background-color': palette.primary.base,
    'color': palette.primary.textOn
  };
  rules[scopeSelector(scope, '.bw_step_completed .bw_step_label')] = { 'color': palette.primary.base };
  rules[scopeSelector(scope, '.bw_step_completed + .bw_step::before')] = { 'background-color': palette.primary.base };
  return rules;
}

function generateChipInputThemed(scope, palette) {
  var rules = {};
  rules[scopeSelector(scope, '.bw_chip_input')] = { 'border-color': palette.light.border };
  rules[scopeSelector(scope, '.bw_chip_input:focus-within')] = {
    'border-color': palette.primary.base,
    'box-shadow': '0 0 0 0.2rem ' + palette.primary.focus
  };
  rules[scopeSelector(scope, '.bw_chip')] = {
    'background-color': palette.light.light,
    'color': palette.dark.base
  };
  rules[scopeSelector(scope, '.bw_chip_remove:hover')] = {
    'color': palette.danger.base,
    'background-color': palette.danger.light
  };
  return rules;
}

function generateFileUploadThemed(scope, palette) {
  var rules = {};
  rules[scopeSelector(scope, '.bw_file_upload')] = {
    'border-color': palette.light.border,
    'background-color': palette.light.light
  };
  rules[scopeSelector(scope, '.bw_file_upload:hover')] = {
    'border-color': palette.primary.base,
    'background-color': palette.primary.light
  };
  rules[scopeSelector(scope, '.bw_file_upload:focus')] = {
    'outline': '2px solid ' + palette.primary.base,
    'outline-offset': '2px'
  };
  rules[scopeSelector(scope, '.bw_file_upload.bw_file_upload_active')] = {
    'border-color': palette.primary.base,
    'background-color': palette.primary.light,
    'border-style': 'solid'
  };
  return rules;
}

function generateRangeThemed(scope, palette) {
  var rules = {};
  rules[scopeSelector(scope, '.bw_range')] = { 'background-color': palette.light.border };
  rules[scopeSelector(scope, '.bw_range::-webkit-slider-thumb')] = {
    'background-color': palette.primary.base,
    'border-color': '#fff',
    'box-shadow': '0 1px 3px rgba(0,0,0,0.2)',
    'transition': 'background-color 0.15s ease-out, transform 0.15s ease-out'
  };
  rules[scopeSelector(scope, '.bw_range::-moz-range-thumb')] = {
    'background-color': palette.primary.base,
    'border-color': '#fff',
    'box-shadow': '0 1px 3px rgba(0,0,0,0.2)'
  };
  return rules;
}

function generateSearchThemed(scope, palette) {
  var rules = {};
  rules[scopeSelector(scope, '.bw_search_clear:hover')] = { 'color': palette.dark.base };
  return rules;
}

function generateCodeDemoThemed(scope, palette) {
  var rules = {};
  rules[scopeSelector(scope, '.bw_code_copy_btn_copied')] = {
    'background': palette.success.base,
    'color': palette.success.textOn,
    'border-color': palette.success.base
  };
  rules[scopeSelector(scope, '.bw_copy_btn:hover')] = {
    'background': 'rgba(255,255,255,0.2)',
    'color': '#fff'
  };
  return rules;
}

function generateNavPillsThemed(scope, palette, layout) {
  var rules = {};
  var rd = layout.radius;
  rules[scopeSelector(scope, '.bw_nav_pills .bw_nav_link')] = { 'border-radius': rd.btn };
  return rules;
}

// =========================================================================
// Palette classes — single-class theming for ALL components
// =========================================================================

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
    rules[scopeSelector(scope, '.bw_' + k)] = {
      'background-color': s.base,
      'color': s.textOn,
      'border-color': s.base
    };

    // --- Pseudo-states (shared across all components) ---
    rules[scopeSelector(scope, '.bw_' + k + ':hover')] = {
      'background-color': s.hover,
      'border-color': s.active
    };
    rules[scopeSelector(scope, '.bw_' + k + ':active')] = {
      'background-color': s.active
    };
    rules[scopeSelector(scope, '.bw_' + k + ':focus-visible')] = {
      'box-shadow': '0 0 0 3px ' + s.focus,
      'outline': 'none'
    };

    // --- Component-specific overrides ---

    // Alerts: light bg, dark text, subtle border
    rules[scopeSelector(scope, '.bw_alert.bw_' + k)] = {
      'background-color': s.light,
      'color': s.darkText,
      'border-color': s.border
    };

    // Toast: inherit bg, left border accent
    rules[scopeSelector(scope, '.bw_toast.bw_' + k)] = {
      'background-color': 'inherit',
      'color': 'inherit',
      'border-left': '4px solid ' + s.base
    };

    // Stat card: inherit bg, left border accent
    rules[scopeSelector(scope, '.bw_stat_card.bw_' + k)] = {
      'background-color': 'inherit',
      'color': 'inherit',
      'border-left-color': s.base
    };

    // Card accent: left border accent, inherit bg
    rules[scopeSelector(scope, '.bw_card.bw_' + k)] = {
      'background-color': 'inherit',
      'color': 'inherit',
      'border-left': '4px solid ' + s.base
    };

    // Timeline marker: colored dot
    rules[scopeSelector(scope, '.bw_timeline_marker.bw_' + k)] = {
      'box-shadow': '0 0 0 2px ' + s.base
    };

    // Spinner: text color only, transparent bg
    rules[scopeSelector(scope, '.bw_spinner_border.bw_' + k + ',\n' + scopeSelector(scope, '.bw_spinner_grow.bw_' + k))] = {
      'background-color': 'transparent',
      'color': s.base,
      'border-color': 'currentColor'
    };

    // Outline button: transparent bg, colored border+text, solid on hover
    rules[scopeSelector(scope, '.bw_btn_outline.bw_' + k)] = {
      'background-color': 'transparent',
      'color': s.base,
      'border-color': s.base
    };
    rules[scopeSelector(scope, '.bw_btn_outline.bw_' + k + ':hover')] = {
      'background-color': s.base,
      'color': s.textOn
    };

    // Hero: gradient background
    rules[scopeSelector(scope, '.bw_hero.bw_' + k)] = {
      'background': 'linear-gradient(135deg, ' + s.base + ' 0%, ' + s.hover + ' 100%)',
      'color': s.textOn
    };

    // Progress bar: white text on colored bg (default is fine, just ensure text)
    rules[scopeSelector(scope, '.bw_progress_bar.bw_' + k)] = {
      'color': '#fff'
    };
  });

  // Text muted
  rules[scopeSelector(scope, '.bw_text_muted')] = { 'color': palette.secondary.base };

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
export function generateThemedCSS(scopeName, palette, layout) {
  return Object.assign({},
    generateResetThemed(scopeName, palette),
    generateTypographyThemed(scopeName, palette, layout),
    generateButtons(scopeName, palette, layout),
    generateAlerts(scopeName, palette, layout),
    generateCards(scopeName, palette, layout),
    generateForms(scopeName, palette, layout),
    generateNavigation(scopeName, palette),
    generateTables(scopeName, palette, layout),
    generateTabs(scopeName, palette),
    generateListGroups(scopeName, palette, layout),
    generatePagination(scopeName, palette),
    generateProgress(scopeName, palette),
    generateBreadcrumbThemed(scopeName, palette),
    generateCloseButtonThemed(scopeName, palette),
    generateSectionsThemed(scopeName, palette),
    generateAccordionThemed(scopeName, palette),
    generateCarouselThemed(scopeName, palette),
    generateModalThemed(scopeName, palette, layout),
    generateToastThemed(scopeName, palette, layout),
    generateDropdownThemed(scopeName, palette, layout),
    generateSwitchThemed(scopeName, palette),
    generateSkeletonThemed(scopeName, palette),
    generateStatCardThemed(scopeName, palette),
    generateTimelineThemed(scopeName, palette),
    generateStepperThemed(scopeName, palette),
    generateChipInputThemed(scopeName, palette),
    generateFileUploadThemed(scopeName, palette),
    generateRangeThemed(scopeName, palette),
    generateSearchThemed(scopeName, palette),
    generateCodeDemoThemed(scopeName, palette),
    generateNavPillsThemed(scopeName, palette, layout),
    generatePaletteClasses(scopeName, palette)
  );
}

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
// Adding a new BCCL component = add a category to structuralRules +
// a generate*Themed() function. That's it.
// =========================================================================

var structuralRules = {
  // ---- Reset ----
  base: {
    '*': { 'box-sizing': 'border-box', 'margin': '0', 'padding': '0' },
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
    'hr': { 'box-sizing': 'content-box', 'height': '0', 'overflow': 'visible', 'margin': '1rem 0', 'border': '0' },
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
    'p': { 'margin-top': '0', 'margin-bottom': '1rem' },
    'small': { 'font-size': '0.875rem' },
    'a': { 'text-decoration': 'none' },
    '.bw_display_4': { 'font-size': 'calc(1.475rem + 2.7vw)', 'font-weight': '300', 'line-height': '1.2' },
    '.bw_lead': { 'font-size': '1.25rem', 'font-weight': '300' },
    '.bw_h5': { 'font-size': '1.25rem' },
    '.bw_h6': { 'font-size': '1rem' }
  },

  // ---- Grid ----
  grid: {
    '.bw_container': {
      'width': '100%', 'padding-right': '0.75rem', 'padding-left': '0.75rem',
      'margin-right': 'auto', 'margin-left': 'auto'
    },
    '@media (min-width: 576px)': { '.bw_container': { 'max-width': '540px' } },
    '@media (min-width: 768px)': { '.bw_container': { 'max-width': '720px' } },
    '@media (min-width: 992px)': { '.bw_container': { 'max-width': '960px' } },
    '@media (min-width: 1200px)': { '.bw_container': { 'max-width': '1140px' } },
    '.bw_container_fluid': {
      'width': '100%', 'padding-right': '15px', 'padding-left': '15px',
      'margin-right': 'auto', 'margin-left': 'auto'
    },
    '.bw_row': {
      'display': 'flex', 'flex-wrap': 'wrap',
      'margin-right': 'calc(var(--bw_gutter_x, 0.75rem) * -0.5)',
      'margin-left': 'calc(var(--bw_gutter_x, 0.75rem) * -0.5)'
    },
    '.col, [class*="col-"]': {
      'position': 'relative', 'width': '100%',
      'padding-right': 'calc(var(--bw_gutter_x, 0.75rem) * 0.5)',
      'padding-left': 'calc(var(--bw_gutter_x, 0.75rem) * 0.5)'
    },
    '.bw_col': { 'flex-basis': '0', 'flex-grow': '1', 'max-width': '100%' },
    '.bw_col_1': { 'flex': '0 0 8.333333%', 'max-width': '8.333333%' },
    '.bw_col_2': { 'flex': '0 0 16.666667%', 'max-width': '16.666667%' },
    '.bw_col_3': { 'flex': '0 0 25%', 'max-width': '25%' },
    '.bw_col_4': { 'flex': '0 0 33.333333%', 'max-width': '33.333333%' },
    '.bw_col_5': { 'flex': '0 0 41.666667%', 'max-width': '41.666667%' },
    '.bw_col_6': { 'flex': '0 0 50%', 'max-width': '50%' },
    '.bw_col_7': { 'flex': '0 0 58.333333%', 'max-width': '58.333333%' },
    '.bw_col_8': { 'flex': '0 0 66.666667%', 'max-width': '66.666667%' },
    '.bw_col_9': { 'flex': '0 0 75%', 'max-width': '75%' },
    '.bw_col_10': { 'flex': '0 0 83.333333%', 'max-width': '83.333333%' },
    '.bw_col_11': { 'flex': '0 0 91.666667%', 'max-width': '91.666667%' },
    '.bw_col_12': { 'flex': '0 0 100%', 'max-width': '100%' }
  },

  // ---- Buttons ----
  buttons: {
    '.bw_btn': {
      'display': 'inline-flex', 'align-items': 'center', 'justify-content': 'center',
      'font-weight': '500', 'line-height': '1.5', 'text-align': 'center',
      'text-decoration': 'none', 'vertical-align': 'middle', 'cursor': 'pointer',
      'user-select': 'none', 'border': '1px solid transparent',
      'font-size': '0.875rem', 'font-family': 'inherit', 'gap': '0.5rem'
    },
    '.bw_btn:hover': { 'text-decoration': 'none', 'transform': 'translateY(-1px)' },
    '.bw_btn:active': { 'transform': 'translateY(0)' },
    '.bw_btn:focus-visible': { 'outline': '2px solid currentColor', 'outline-offset': '2px' },
    '.bw_btn:disabled': { 'opacity': '0.5', 'cursor': 'not-allowed', 'pointer-events': 'none' },
    '.bw_btn_block': { 'display': 'block', 'width': '100%' }
  },

  // ---- Cards ----
  cards: {
    '.bw_card': {
      'position': 'relative', 'display': 'flex', 'flex-direction': 'column',
      'min-width': '0', 'height': '100%', 'word-wrap': 'break-word',
      'background-clip': 'border-box', 'margin-bottom': '1.5rem', 'overflow': 'hidden'
    },
    '.bw_card_body': { 'flex': '1 1 auto' },
    '.bw_card_body > *:last-child': { 'margin-bottom': '0' },
    '.bw_card_title': { 'margin-bottom': '0.5rem', 'font-size': '1.125rem', 'font-weight': '600', 'line-height': '1.3' },
    '.bw_card_text': { 'margin-bottom': '0', 'font-size': '0.9375rem', 'line-height': '1.6' },
    '.bw_card_header': { 'margin-bottom': '0', 'font-weight': '600', 'font-size': '0.875rem' },
    '.bw_card_footer': { 'font-size': '0.875rem' },
    '.bw_card_hoverable': { 'transition': 'all 0.3s ease-out' },
    '.bw_card_hoverable:hover': { 'transform': 'translateY(-4px)' },
    '.bw_card_img_top': { 'width': '100%' },
    '.bw_card_img_bottom': { 'width': '100%' },
    '.bw_card_img_left': { 'width': '40%', 'object-fit': 'cover' },
    '.bw_card_img_right': { 'width': '40%', 'object-fit': 'cover' },
    '.bw_card_subtitle, .card-subtitle': { 'margin-top': '-0.25rem', 'margin-bottom': '0.5rem', 'font-size': '0.875rem' }
  },

  // ---- Forms ----
  forms: {
    '.bw_form_control': {
      'display': 'block', 'width': '100%',
      'font-size': '0.9375rem', 'font-weight': '400', 'line-height': '1.5',
      'background-clip': 'padding-box', 'appearance': 'none',
      'border': '1px solid transparent', 'font-family': 'inherit'
    },
    '.bw_form_control:focus': { 'outline': '2px solid currentColor', 'outline-offset': '-1px' },
    '.bw_form_control::placeholder': { 'opacity': '1' },
    '.bw_form_label': { 'display': 'block', 'margin-bottom': '0.375rem', 'font-size': '0.875rem', 'font-weight': '600' },
    '.bw_form_group': { 'margin-bottom': '1.25rem' },
    '.bw_form_text': { 'margin-top': '0.25rem', 'font-size': '0.8125rem' },
    'select.bw_form_control': {
      'padding-right': '2.25rem',
      'background-image': "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='%23666' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='m2 5 6 6 6-6'/%3e%3c/svg%3e\")",
      'background-repeat': 'no-repeat', 'background-position': 'right 0.75rem center',
      'background-size': '16px 12px'
    },
    'textarea.bw_form_control': { 'min-height': '5rem', 'resize': 'vertical' },
    '.bw_valid_feedback': { 'display': 'block', 'font-size': '0.875rem', 'margin-top': '0.25rem' },
    '.bw_invalid_feedback': { 'display': 'block', 'font-size': '0.875rem', 'margin-top': '0.25rem' }
  },

  // ---- Form checks ----
  formChecks: {
    '.bw_form_check': { 'display': 'flex', 'align-items': 'center', 'gap': '0.5rem', 'min-height': '1.5rem', 'margin-bottom': '0.25rem' },
    '.bw_form_check_input': { 'width': '1rem', 'height': '1rem', 'margin': '0', 'cursor': 'pointer', 'flex-shrink': '0', 'border-radius': '0.25rem', 'appearance': 'auto' },
    '.bw_form_check_input:disabled': { 'opacity': '0.5', 'cursor': 'not-allowed' },
    '.bw_form_check_label': { 'cursor': 'pointer', 'user-select': 'none', 'font-size': '0.9375rem' }
  },

  // ---- Navigation ----
  navigation: {
    '.bw_navbar': {
      'position': 'relative', 'display': 'flex', 'flex-wrap': 'wrap',
      'align-items': 'center', 'justify-content': 'space-between', 'padding': '0.5rem 1.5rem'
    },
    '.bw_navbar > .bw_container, .bw_navbar > .container': { 'display': 'flex', 'flex-wrap': 'wrap', 'align-items': 'center', 'justify-content': 'space-between' },
    '.bw_navbar_brand': {
      'display': 'inline-flex', 'align-items': 'center', 'gap': '0.5rem',
      'padding-top': '0.25rem', 'padding-bottom': '0.25rem', 'margin-right': '1.5rem',
      'font-size': '1.125rem', 'font-weight': '600', 'line-height': 'inherit',
      'white-space': 'nowrap', 'text-decoration': 'none'
    },
    '.bw_navbar_nav': {
      'display': 'flex', 'flex-direction': 'row', 'padding-left': '0',
      'margin-bottom': '0', 'list-style': 'none', 'gap': '0.25rem'
    },
    '.bw_navbar_nav .bw_nav_link': {
      'display': 'block', 'text-decoration': 'none',
      'font-size': '0.875rem', 'font-weight': '500'
    }
  },

  // ---- Tables ----
  tables: {
    '.bw_table': {
      'width': '100%', 'margin-bottom': '1.5rem', 'vertical-align': 'top',
      'border-collapse': 'collapse', 'font-size': '0.9375rem', 'line-height': '1.5'
    },
    '.bw_table > :not(caption) > * > *': {
      'background-color': 'transparent',
      'border-bottom-width': '1px', 'border-bottom-style': 'solid'
    },
    '.bw_table > tbody': { 'vertical-align': 'inherit' },
    '.bw_table > thead': { 'vertical-align': 'bottom' },
    '.bw_table > thead > tr > *': {
      'font-size': '0.8125rem', 'font-weight': '600',
      'text-transform': 'uppercase', 'letter-spacing': '0.04em',
      'border-bottom-width': '2px'
    },
    '.bw_table caption': { 'font-size': '0.875rem', 'caption-side': 'bottom' },
    '.bw_table_bordered > :not(caption) > * > *': { 'border-width': '1px', 'border-style': 'solid' },
    '.bw_table_responsive': { 'overflow-x': 'auto', '-webkit-overflow-scrolling': 'touch' }
  },

  // ---- Alerts ----
  alerts: {
    '.bw_alert': {
      'position': 'relative', 'margin-bottom': '1rem',
      'border': '1px solid transparent',
      'font-size': '0.9375rem', 'line-height': '1.6'
    },
    '.bw_alert_heading, .alert-heading': { 'color': 'inherit' },
    '.bw_alert_link, .alert-link': { 'font-weight': '700' },
    '.bw_alert_dismissible': { 'padding-right': '3rem' },
    '.bw_alert_dismissible .btn-close': { 'position': 'absolute', 'top': '0', 'right': '0', 'z-index': '2', 'padding': '1.25rem 1rem' }
  },

  // ---- Badges ----
  badges: {
    '.bw_badge': {
      'display': 'inline-block', 'font-size': '0.875rem',
      'font-weight': '600', 'line-height': '1.3', 'text-align': 'center',
      'white-space': 'nowrap', 'vertical-align': 'baseline'
    },
    '.bw_badge:empty': { 'display': 'none' },
    '.bw_badge_sm': { 'font-size': '0.75rem', 'padding': '0.25rem 0.5rem' },
    '.bw_badge_lg': { 'font-size': '1rem', 'padding': '0.5rem 0.875rem' },
    '.bw_badge_pill': { 'border-radius': '50rem' },
    '.btn .badge': { 'position': 'relative', 'top': '-1px' }
  },

  // ---- Progress ----
  progress: {
    '.bw_progress': { 'display': 'flex', 'height': '1.25rem', 'overflow': 'hidden', 'font-size': '.875rem' },
    '.bw_progress_bar': {
      'display': 'flex', 'flex-direction': 'column', 'justify-content': 'center',
      'overflow': 'hidden', 'text-align': 'center', 'white-space': 'nowrap', 'font-weight': '600'
    },
    '.bw_progress_bar_striped': {
      'background-image': 'linear-gradient(45deg,rgba(255,255,255,.15) 25%,transparent 25%,transparent 50%,rgba(255,255,255,.15) 50%,rgba(255,255,255,.15) 75%,transparent 75%,transparent)',
      'background-size': '1rem 1rem'
    },
    '.bw_progress_bar_animated': { 'animation': 'progress-bar-stripes 1s linear infinite' },
    '@keyframes progress-bar-stripes': { '0%': { 'background-position-x': '1rem' } }
  },

  // ---- Tabs ----
  tabs: {
    '.bw_nav': { 'display': 'flex', 'flex-wrap': 'wrap', 'padding-left': '0', 'margin-bottom': '0', 'list-style': 'none', 'gap': '0' },
    '.bw_nav_item': { 'display': 'block' },
    '.bw_nav_tabs .bw_nav_item': { 'margin-bottom': '-2px' },
    '.bw_nav_link': {
      'display': 'block', 'font-size': '0.875rem', 'font-weight': '500',
      'text-decoration': 'none', 'cursor': 'pointer',
      'border': 'none', 'background': 'transparent', 'font-family': 'inherit'
    },
    '.bw_nav_tabs .bw_nav_link': { 'border': 'none', 'border-bottom': '2px solid transparent', 'border-radius': '0', 'background-color': 'transparent' },
    '.bw_nav_vertical': { 'flex-direction': 'column' },
    '.bw_tab_content': { 'padding': '1.25rem 0' },
    '.bw_tab_pane': { 'display': 'none' },
    '.bw_tab_pane.active': { 'display': 'block' },
    '.bw_nav_scrollable': { 'flex-wrap': 'nowrap', 'overflow-x': 'auto', '-webkit-overflow-scrolling': 'touch', 'scrollbar-width': 'none' },
    '.bw_nav_scrollable::-webkit-scrollbar': { 'display': 'none' },
    '.bw_nav_scrollable .bw_nav_link': { 'white-space': 'nowrap' }
  },

  // ---- List groups ----
  listGroups: {
    '.bw_list_group': { 'display': 'flex', 'flex-direction': 'column', 'padding-left': '0', 'margin-bottom': '0' },
    '.bw_list_group_item': { 'position': 'relative', 'display': 'block', 'text-decoration': 'none', 'font-size': '0.9375rem' },
    '.bw_list_group_item:first-child': { 'border-top-left-radius': 'inherit', 'border-top-right-radius': 'inherit' },
    '.bw_list_group_item:last-child': { 'border-bottom-right-radius': 'inherit', 'border-bottom-left-radius': 'inherit' },
    '.bw_list_group_item + .bw_list_group_item': { 'border-top-width': '0' },
    '.bw_list_group_item.disabled': { 'pointer-events': 'none' },
    'a.bw_list_group_item': { 'cursor': 'pointer' },
    'a.bw_list_group_item:focus-visible, .bw_list_group_item:focus-visible': { 'z-index': '2', 'outline': '2px solid currentColor', 'outline-offset': '-2px' },
    '.bw_list_group_flush': { 'border-radius': '0' },
    '.bw_list_group_flush > .bw_list_group_item': { 'border-width': '0 0 1px', 'border-radius': '0' },
    '.bw_list_group_flush > .bw_list_group_item:last-child': { 'border-bottom-width': '0' }
  },

  // ---- Pagination ----
  pagination: {
    '.bw_pagination': { 'display': 'flex', 'padding-left': '0', 'list-style': 'none', 'margin-bottom': '0' },
    '.bw_page_item': { 'display': 'list-item', 'list-style': 'none' },
    '.bw_page_link': {
      'position': 'relative', 'display': 'block', 'padding': '0.375rem 0.75rem',
      'margin-left': '-1px', 'line-height': '1.25', 'text-decoration': 'none'
    },
    '.bw_page_item:first-child .bw_page_link': { 'margin-left': '0', 'border-top-left-radius': '0.375rem', 'border-bottom-left-radius': '0.375rem' },
    '.bw_page_item:last-child .bw_page_link': { 'border-top-right-radius': '0.375rem', 'border-bottom-right-radius': '0.375rem' },
    '.bw_page_link:focus-visible': { 'z-index': '3', 'outline': '2px solid currentColor', 'outline-offset': '-2px' }
  },

  // ---- Breadcrumb ----
  breadcrumb: {
    '.bw_breadcrumb': { 'display': 'flex', 'flex-wrap': 'wrap', 'padding': '0 0', 'margin-bottom': '1rem', 'list-style': 'none' },
    '.bw_breadcrumb_item': { 'display': 'flex' },
    '.bw_breadcrumb_item + .bw_breadcrumb_item': { 'padding-left': '0.5rem' },
    '.bw_breadcrumb_item + .bw_breadcrumb_item::before': { 'float': 'left', 'padding-right': '0.5rem', 'content': '"/"' },
    '.bw_breadcrumb_item a': { 'text-decoration': 'none' },
    '.bw_breadcrumb_item.active': { 'font-weight': '500' }
  },

  // ---- Hero ----
  hero: {
    '.bw_hero': { 'position': 'relative', 'overflow': 'hidden' },
    '.bw_hero_overlay': { 'position': 'absolute', 'top': '0', 'left': '0', 'right': '0', 'bottom': '0', 'z-index': '1' },
    '.bw_hero_content': { 'position': 'relative', 'z-index': '2' },
    '.bw_hero_title': { 'font-weight': '300', 'letter-spacing': '-0.05rem', 'color': 'inherit' },
    '.bw_hero_subtitle': { 'color': 'inherit' },
    '.bw_hero_actions': { 'display': 'flex', 'gap': '1rem', 'justify-content': 'center', 'flex-wrap': 'wrap' }
  },

  // ---- Features ----
  features: {
    '.bw_feature': { 'padding': '1rem' },
    '.bw_feature_icon': { 'display': 'inline-block', 'margin-bottom': '1rem' },
    '.bw_feature_title': { 'margin-bottom': '0.5rem' },
    '.bw_feature_grid': { 'width': '100%' },
    '.bw_g_4': { '--bw_gutter_x': '1.5rem', '--bw_gutter_y': '1.5rem' }
  },

  // ---- Sections ----
  sections: {
    '.bw_section': { 'position': 'relative' },
    '.bw_section_header': { 'margin-bottom': '3rem' },
    '.bw_section_title': { 'margin-bottom': '1rem', 'font-weight': '300', 'font-size': 'calc(1.325rem + .9vw)' }
  },

  // ---- CTA ----
  cta: {
    '.bw_cta': { 'position': 'relative' },
    '.bw_cta_content': { 'max-width': '48rem', 'margin': '0 auto' },
    '.bw_cta_title': { 'font-weight': '300' },
    '.bw_cta_actions': { 'display': 'flex', 'gap': '1rem', 'justify-content': 'center', 'flex-wrap': 'wrap' }
  },

  // ---- Spinner ----
  spinner: {
    '.bw_spinner_border': {
      'display': 'inline-block', 'width': '2rem', 'height': '2rem',
      'vertical-align': '-0.125em', 'border': '0.25em solid currentcolor',
      'border-right-color': 'transparent', 'border-radius': '50%',
      'animation': 'bw_spinner_border 0.75s linear infinite'
    },
    '.bw_spinner_border_sm': { 'width': '1rem', 'height': '1rem', 'border-width': '0.2em' },
    '.bw_spinner_border_lg': { 'width': '3rem', 'height': '3rem', 'border-width': '0.3em' },
    '.bw_spinner_border_md': {},
    '.bw_spinner_grow': {
      'display': 'inline-block', 'width': '2rem', 'height': '2rem',
      'vertical-align': '-0.125em', 'border-radius': '50%', 'opacity': '0',
      'animation': 'bw_spinner_grow 0.75s linear infinite'
    },
    '.bw_spinner_grow_sm': { 'width': '1rem', 'height': '1rem' },
    '.bw_spinner_grow_lg': { 'width': '3rem', 'height': '3rem' },
    '.bw_spinner_grow_md': {},
    '@keyframes bw_spinner_border': { '100%': { 'transform': 'rotate(360deg)' } },
    '@keyframes bw_spinner_grow': { '0%': { 'transform': 'scale(0)' }, '50%': { 'opacity': '1', 'transform': 'none' } },
    '.bw_visually_hidden': {
      'position': 'absolute', 'width': '1px', 'height': '1px', 'padding': '0',
      'margin': '-1px', 'overflow': 'hidden', 'clip': 'rect(0, 0, 0, 0)',
      'white-space': 'nowrap', 'border': '0'
    }
  },

  // ---- Close button ----
  closeButton: {
    '.bw_close': {
      'display': 'inline-flex', 'align-items': 'center', 'justify-content': 'center',
      'width': '1.5rem', 'height': '1.5rem', 'padding': '0',
      'font-size': '1.25rem', 'font-weight': '700', 'line-height': '1',
      'background': 'transparent', 'border': '0', 'border-radius': '0.25rem', 'cursor': 'pointer'
    },
    '.bw_close:hover': { 'opacity': '0.75' }
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

  // ---- Code demo ----
  codeDemo: {
    '.bw_code_demo': { 'margin-bottom': '2rem' },
    '.bw_code_pre': { 'margin': '0', 'border': 'none', 'overflow-x': 'auto' },
    '.bw_code_block': {
      'display': 'block', 'padding': '1.25rem',
      'font-family': '"SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace',
      'font-size': '0.8125rem', 'line-height': '1.6'
    },
    '.bw_code_copy_btn': {
      'position': 'absolute', 'top': '0.5rem', 'right': '0.5rem',
      'padding': '0.25rem 0.625rem', 'font-size': '0.6875rem',
      'cursor': 'pointer', 'font-family': 'inherit'
    },
    '.bw_copy_btn': {
      'position': 'absolute', 'top': '0.5rem', 'right': '0.5rem',
      'padding': '0.25rem 0.625rem', 'font-size': '0.6875rem',
      'cursor': 'pointer', 'font-family': 'inherit'
    }
  },

  // ---- Button group ----
  buttonGroup: {
    '.bw_btn_group, .bw_btn_group_vertical': { 'position': 'relative', 'display': 'inline-flex', 'vertical-align': 'middle' },
    '.bw_btn_group > .bw_btn, .bw_btn_group_vertical > .bw_btn': { 'position': 'relative', 'flex': '1 1 auto', 'border-radius': '0', 'margin-left': '-1px' },
    '.bw_btn_group > .bw_btn:first-child': { 'margin-left': '0' },
    '.bw_btn_group > .bw_btn:last-child': {},
    '.bw_btn_group_lg > .bw_btn': { 'padding': '0.625rem 1.5rem', 'font-size': '1rem' },
    '.bw_btn_group_sm > .bw_btn': { 'padding': '0.25rem 0.75rem', 'font-size': '0.8125rem' },
    '.bw_btn_group_vertical': { 'flex-direction': 'column', 'align-items': 'flex-start', 'justify-content': 'center' },
    '.bw_btn_group_vertical > .bw_btn': { 'width': '100%', 'margin-left': '0', 'margin-top': '-1px' },
    '.bw_btn_group_vertical > .bw_btn:first-child': { 'margin-top': '0' },
    '.bw_btn_group_vertical > .bw_btn:last-child': {}
  },

  // ---- Accordion ----
  accordion: {
    '.bw_accordion': { 'overflow': 'hidden' },
    '.bw_accordion_item': { 'border': '1px solid transparent' },
    '.bw_accordion_item + .bw_accordion_item': { 'border-top': '0' },
    '.bw_accordion_header': { 'margin': '0' },
    '.bw_accordion_button': {
      'position': 'relative', 'display': 'flex', 'align-items': 'center', 'width': '100%',
      'font-size': '1rem', 'font-weight': '500', 'text-align': 'left',
      'background-color': 'transparent', 'border': '0', 'overflow-anchor': 'none', 'cursor': 'pointer',
      'font-family': 'inherit'
    },
    '.bw_accordion_button::after': {
      'flex-shrink': '0', 'width': '1.25rem', 'height': '1.25rem', 'margin-left': 'auto',
      'content': '""',
      'background-image': "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='%23212529'%3e%3cpath fill-rule='evenodd' d='M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z'/%3e%3c/svg%3e\")",
      'background-repeat': 'no-repeat', 'background-size': '1.25rem'
    },
    '.bw_accordion_button:not(.bw_collapsed)::after': { 'transform': 'rotate(-180deg)' },
    '.bw_accordion_collapse': { 'max-height': '0', 'overflow': 'hidden' },
    '.bw_accordion_collapse.bw_collapse_show': { 'max-height': 'none' },
    '.bw_accordion_item:first-child': { 'border-top-left-radius': '8px', 'border-top-right-radius': '8px' },
    '.bw_accordion_item:last-child': { 'border-bottom-left-radius': '8px', 'border-bottom-right-radius': '8px' }
  },

  // ---- Carousel ----
  carousel: {
    '.bw_carousel': { 'position': 'relative', 'overflow': 'hidden' },
    '.bw_carousel_track': { 'display': 'flex', 'height': '100%' },
    '.bw_carousel_slide': {
      'min-width': '100%', 'flex-shrink': '0', 'overflow': 'hidden',
      'position': 'relative', 'display': 'flex', 'align-items': 'center', 'justify-content': 'center'
    },
    '.bw_carousel_slide img': { 'width': '100%', 'height': '100%', 'object-fit': 'cover' },
    '.bw_carousel_caption': { 'position': 'absolute', 'bottom': '0', 'left': '0', 'right': '0', 'padding': '0.75rem 1rem', 'font-size': '0.875rem' },
    '.bw_carousel_control': {
      'position': 'absolute', 'top': '50%', 'transform': 'translateY(-50%)',
      'width': '40px', 'height': '40px', 'border': 'none', 'border-radius': '50%',
      'cursor': 'pointer', 'display': 'flex', 'align-items': 'center', 'justify-content': 'center',
      'z-index': '2', 'padding': '0'
    },
    '.bw_carousel_control img': { 'width': '20px', 'height': '20px', 'pointer-events': 'none' },
    '.bw_carousel_control_prev': { 'left': '10px' },
    '.bw_carousel_control_next': { 'right': '10px' },
    '.bw_carousel_indicators': {
      'position': 'absolute', 'bottom': '12px', 'left': '50%', 'transform': 'translateX(-50%)',
      'display': 'flex', 'gap': '6px', 'z-index': '2'
    },
    '.bw_carousel_indicator': {
      'width': '10px', 'height': '10px', 'border-radius': '50%', 'border': '2px solid transparent',
      'padding': '0', 'cursor': 'pointer'
    },
    '.bw_carousel_indicator:hover': { 'opacity': '0.8' }
  },

  // ---- Modal ----
  modal: {
    '.bw_modal': {
      'display': 'flex', 'align-items': 'center', 'justify-content': 'center',
      'position': 'fixed', 'top': '0', 'left': '0', 'width': '100%', 'height': '100%',
      'z-index': '1050', 'overflow-x': 'hidden', 'overflow-y': 'auto',
      'opacity': '0', 'visibility': 'hidden', 'pointer-events': 'none'
    },
    '.bw_modal.bw_modal_show': { 'opacity': '1', 'visibility': 'visible', 'pointer-events': 'auto' },
    '.bw_modal_dialog': {
      'position': 'relative', 'width': '100%', 'max-width': '500px', 'margin': '1.75rem auto',
      'pointer-events': 'none'
    },
    '.bw_modal.bw_modal_show .bw_modal_dialog': { 'transform': 'translateY(0)' },
    '.bw_modal_sm': { 'max-width': '300px' },
    '.bw_modal_lg': { 'max-width': '800px' },
    '.bw_modal_xl': { 'max-width': '1140px' },
    '.bw_modal_content': {
      'position': 'relative', 'display': 'flex', 'flex-direction': 'column', 'pointer-events': 'auto',
      'background-clip': 'padding-box', 'border': '1px solid transparent', 'outline': '0'
    },
    '.bw_modal_header': { 'display': 'flex', 'align-items': 'center', 'justify-content': 'space-between' },
    '.bw_modal_title': { 'margin': '0', 'font-size': '1.25rem', 'font-weight': '600', 'line-height': '1.3' },
    '.bw_modal_body': { 'position': 'relative', 'flex': '1 1 auto' },
    '.bw_modal_footer': { 'display': 'flex', 'flex-wrap': 'wrap', 'align-items': 'center', 'justify-content': 'flex-end', 'gap': '0.5rem' }
  },

  // ---- Toast ----
  toast: {
    '.bw_toast_container': {
      'position': 'fixed', 'z-index': '1080', 'pointer-events': 'none',
      'display': 'flex', 'flex-direction': 'column', 'gap': '0.5rem', 'padding': '1rem'
    },
    '.bw_toast_container.bw_toast_top_right': { 'top': '0', 'right': '0' },
    '.bw_toast_container.bw_toast_top_left': { 'top': '0', 'left': '0' },
    '.bw_toast_container.bw_toast_bottom_right': { 'bottom': '0', 'right': '0' },
    '.bw_toast_container.bw_toast_bottom_left': { 'bottom': '0', 'left': '0' },
    '.bw_toast_container.bw_toast_top_center': { 'top': '0', 'left': '50%', 'transform': 'translateX(-50%)' },
    '.bw_toast_container.bw_toast_bottom_center': { 'bottom': '0', 'left': '50%', 'transform': 'translateX(-50%)' },
    '.bw_toast': {
      'pointer-events': 'auto', 'width': '350px', 'max-width': '100%', 'background-clip': 'padding-box',
      'opacity': '0'
    },
    '.bw_toast.bw_toast_show': { 'opacity': '1', 'transform': 'translateY(0)' },
    '.bw_toast.bw_toast_hiding': { 'opacity': '0' },
    '.bw_toast_header': { 'display': 'flex', 'align-items': 'center', 'justify-content': 'space-between', 'font-size': '0.875rem' },
    '.bw_toast_body': { 'font-size': '0.9375rem' }
  },

  // ---- Dropdown ----
  dropdown: {
    '.bw_dropdown': { 'position': 'relative', 'display': 'inline-block' },
    '.bw_dropdown_toggle::after': {
      'display': 'inline-block', 'margin-left': '0.255em', 'vertical-align': '0.255em',
      'content': '""', 'border-top': '0.3em solid', 'border-right': '0.3em solid transparent',
      'border-bottom': '0', 'border-left': '0.3em solid transparent'
    },
    '.bw_dropdown_menu': {
      'position': 'absolute', 'top': '100%', 'left': '0', 'z-index': '1000', 'display': 'block',
      'min-width': '10rem', 'padding': '0.5rem 0', 'margin': '0.125rem 0 0',
      'background-clip': 'padding-box',
      'opacity': '0', 'visibility': 'hidden', 'pointer-events': 'none'
    },
    '.bw_dropdown_menu.bw_dropdown_show': { 'opacity': '1', 'visibility': 'visible', 'pointer-events': 'auto' },
    '.bw_dropdown_menu_end': { 'left': 'auto', 'right': '0' },
    '.bw_dropdown_item': {
      'display': 'block', 'width': '100%', 'clear': 'both',
      'font-weight': '400', 'text-align': 'inherit', 'text-decoration': 'none', 'white-space': 'nowrap',
      'background-color': 'transparent', 'border': '0', 'font-size': '0.9375rem'
    },
    '.bw_dropdown_item:focus-visible': { 'outline': '2px solid currentColor', 'outline-offset': '-2px' },
    '.bw_dropdown_divider': { 'height': '0', 'margin': '0.5rem 0', 'overflow': 'hidden', 'opacity': '1' }
  },

  // ---- Form switch ----
  formSwitch: {
    '.bw_form_switch': { 'padding-left': '2.5em' },
    '.bw_form_switch .bw_switch_input': {
      'width': '2em', 'height': '1.125em', 'margin-left': '-2.5em', 'border-radius': '2em',
      'appearance': 'none',
      'background-image': "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='-4 -4 8 8'%3e%3ccircle r='3' fill='rgba(255,255,255,1)'/%3e%3c/svg%3e\")",
      'background-position': 'left center', 'background-repeat': 'no-repeat',
      'background-size': 'contain', 'cursor': 'pointer'
    },
    '.bw_form_switch .bw_switch_input:checked': { 'background-position': 'right center' },
    '.bw_form_switch .bw_switch_input:disabled': { 'opacity': '0.5', 'cursor': 'not-allowed' }
  },

  // ---- Skeleton ----
  skeleton: {
    '.bw_skeleton': { 'background-size': '400% 100%', 'animation': 'bw_skeleton_shimmer 1.4s ease infinite' },
    '.bw_skeleton_text': { 'height': '1em', 'margin-bottom': '0.5rem' },
    '.bw_skeleton_circle': { 'border-radius': '50%' },
    '.bw_skeleton_rect': {},
    '.bw_skeleton_group': { 'display': 'flex', 'flex-direction': 'column' },
    '@keyframes bw_skeleton_shimmer': { '0%': { 'background-position': '100% 50%' }, '100%': { 'background-position': '0 50%' } }
  },

  // ---- Avatar ----
  avatar: {
    '.bw_avatar': {
      'display': 'inline-flex', 'align-items': 'center', 'justify-content': 'center',
      'border-radius': '50%', 'overflow': 'hidden', 'font-weight': '600',
      'text-transform': 'uppercase', 'vertical-align': 'middle', 'object-fit': 'cover'
    },
    '.bw_avatar_sm': { 'width': '2rem', 'height': '2rem', 'font-size': '0.75rem' },
    '.bw_avatar_md': { 'width': '3rem', 'height': '3rem', 'font-size': '1rem' },
    '.bw_avatar_lg': { 'width': '4rem', 'height': '4rem', 'font-size': '1.25rem' },
    '.bw_avatar_xl': { 'width': '5rem', 'height': '5rem', 'font-size': '1.5rem' }
  },

  // ---- Stat card ----
  statCard: {
    '.bw_stat_card': { 'border-left': '4px solid transparent' },
    '.bw_stat_card:hover': { 'transform': 'translateY(-1px)' },
    '.bw_stat_icon': { 'font-size': '1.5rem', 'margin-bottom': '0.5rem' },
    '.bw_stat_value': { 'font-size': '2rem', 'font-weight': '700', 'line-height': '1.2' },
    '.bw_stat_label': { 'font-size': '0.875rem', 'margin-top': '0.25rem' },
    '.bw_stat_change': { 'font-size': '0.875rem', 'font-weight': '500', 'margin-top': '0.5rem' }
  },

  // ---- Tooltip ----
  tooltip: {
    '.bw_tooltip_wrapper': { 'position': 'relative', 'display': 'inline-block' },
    '.bw_tooltip': {
      'position': 'absolute', 'z-index': '999',
      'font-size': '0.875rem', 'white-space': 'nowrap', 'pointer-events': 'none',
      'opacity': '0', 'visibility': 'hidden'
    },
    '.bw_tooltip.bw_tooltip_show': { 'opacity': '1', 'visibility': 'visible' },
    '.bw_tooltip_top': { 'bottom': '100%', 'left': '50%', 'transform': 'translateX(-50%) translateY(-4px)', 'margin-bottom': '4px' },
    '.bw_tooltip_top.bw_tooltip_show': { 'transform': 'translateX(-50%) translateY(0)' },
    '.bw_tooltip_bottom': { 'top': '100%', 'left': '50%', 'transform': 'translateX(-50%) translateY(4px)', 'margin-top': '4px' },
    '.bw_tooltip_bottom.bw_tooltip_show': { 'transform': 'translateX(-50%) translateY(0)' },
    '.bw_tooltip_left': { 'right': '100%', 'top': '50%', 'transform': 'translateY(-50%) translateX(-4px)', 'margin-right': '4px' },
    '.bw_tooltip_left.bw_tooltip_show': { 'transform': 'translateY(-50%) translateX(0)' },
    '.bw_tooltip_right': { 'left': '100%', 'top': '50%', 'transform': 'translateY(-50%) translateX(4px)', 'margin-left': '4px' },
    '.bw_tooltip_right.bw_tooltip_show': { 'transform': 'translateY(-50%) translateX(0)' }
  },

  // ---- Popover ----
  popover: {
    '.bw_popover_wrapper': { 'position': 'relative', 'display': 'inline-block' },
    '.bw_popover_trigger': { 'cursor': 'pointer' },
    '.bw_popover': {
      'position': 'absolute', 'z-index': '1000',
      'min-width': '200px', 'max-width': '320px',
      'pointer-events': 'none', 'opacity': '0', 'visibility': 'hidden'
    },
    '.bw_popover.bw_popover_show': { 'opacity': '1', 'visibility': 'visible', 'pointer-events': 'auto' },
    '.bw_popover_header': { 'font-weight': '600', 'font-size': '0.9375rem' },
    '.bw_popover_body': { 'font-size': '0.875rem', 'line-height': '1.5' },
    '.bw_popover_top': { 'bottom': '100%', 'left': '50%', 'transform': 'translateX(-50%) translateY(-8px)', 'margin-bottom': '8px' },
    '.bw_popover_top.bw_popover_show': { 'transform': 'translateX(-50%) translateY(0)' },
    '.bw_popover_bottom': { 'top': '100%', 'left': '50%', 'transform': 'translateX(-50%) translateY(8px)', 'margin-top': '8px' },
    '.bw_popover_bottom.bw_popover_show': { 'transform': 'translateX(-50%) translateY(0)' },
    '.bw_popover_left': { 'right': '100%', 'top': '50%', 'transform': 'translateY(-50%) translateX(-8px)', 'margin-right': '8px' },
    '.bw_popover_left.bw_popover_show': { 'transform': 'translateY(-50%) translateX(0)' },
    '.bw_popover_right': { 'left': '100%', 'top': '50%', 'transform': 'translateY(-50%) translateX(8px)', 'margin-left': '8px' },
    '.bw_popover_right.bw_popover_show': { 'transform': 'translateY(-50%) translateX(0)' }
  },

  // ---- Search input ----
  searchInput: {
    '.bw_search_input': { 'position': 'relative', 'display': 'flex', 'align-items': 'center' },
    '.bw_search_input .bw_search_field': { 'padding-right': '2.5rem' },
    '.bw_search_clear': {
      'position': 'absolute', 'right': '0.5rem',
      'display': 'flex', 'align-items': 'center', 'justify-content': 'center',
      'width': '1.5rem', 'height': '1.5rem',
      'border': 'none', 'background': 'none',
      'font-size': '1.25rem', 'cursor': 'pointer', 'padding': '0', 'border-radius': '50%'
    }
  },

  // ---- Range ----
  range: {
    '.bw_range_wrapper': { 'margin-bottom': '1rem' },
    '.bw_range_label': { 'display': 'flex', 'justify-content': 'space-between', 'align-items': 'center', 'margin-bottom': '0.5rem', 'font-size': '0.875rem', 'font-weight': '500' },
    '.bw_range_value': { 'font-weight': '600' },
    '.bw_range': { 'width': '100%', 'height': '0.5rem', 'padding': '0', 'appearance': 'none', 'border': 'none', 'border-radius': '0.25rem', 'cursor': 'pointer', 'outline': 'none' },
    '.bw_range:focus': { 'outline': 'none' },
    '.bw_range::-webkit-slider-thumb': {
      'appearance': 'none', 'width': '1.25rem', 'height': '1.25rem', 'border-radius': '50%',
      'border-width': '2px', 'border-style': 'solid', 'cursor': 'pointer'
    },
    '.bw_range::-moz-range-thumb': {
      'width': '1.25rem', 'height': '1.25rem', 'border-radius': '50%',
      'border-width': '2px', 'border-style': 'solid', 'cursor': 'pointer'
    },
    '.bw_range::-webkit-slider-thumb:hover': { 'transform': 'scale(1.15)' },
    '.bw_range:disabled': { 'opacity': '0.5', 'cursor': 'not-allowed' }
  },

  // ---- Media object ----
  mediaObject: {
    '.bw_media': { 'display': 'flex', 'align-items': 'flex-start', 'gap': '1rem' },
    '.bw_media_reverse': { 'flex-direction': 'row-reverse' },
    '.bw_media_img': { 'border-radius': '50%', 'object-fit': 'cover', 'flex-shrink': '0' },
    '.bw_media_body': { 'flex': '1', 'min-width': '0' },
    '.bw_media_title': { 'margin': '0 0 0.25rem 0', 'font-size': '1rem', 'font-weight': '600', 'line-height': '1.3' }
  },

  // ---- File upload ----
  fileUpload: {
    '.bw_file_upload': {
      'display': 'flex', 'flex-direction': 'column', 'align-items': 'center', 'justify-content': 'center',
      'border': '2px dashed transparent', 'cursor': 'pointer', 'text-align': 'center', 'position': 'relative'
    },
    '.bw_file_upload_icon': { 'font-size': '2rem', 'margin-bottom': '0.5rem' },
    '.bw_file_upload_text': { 'font-size': '0.875rem' },
    '.bw_file_upload_input': {
      'position': 'absolute', 'width': '1px', 'height': '1px', 'padding': '0',
      'margin': '-1px', 'overflow': 'hidden', 'clip': 'rect(0,0,0,0)', 'border': '0'
    }
  },

  // ---- Timeline ----
  timeline: {
    '.bw_timeline': { 'position': 'relative', 'padding-left': '2rem' },
    '.bw_timeline::before': {
      'content': '""', 'position': 'absolute', 'left': '0.5rem', 'top': '0', 'bottom': '0',
      'width': '2px'
    },
    '.bw_timeline_item': { 'position': 'relative', 'padding-bottom': '1.5rem' },
    '.bw_timeline_item:last-child': { 'padding-bottom': '0' },
    '.bw_timeline_marker': { 'position': 'absolute', 'left': '-1.75rem', 'top': '0.25rem', 'width': '0.75rem', 'height': '0.75rem', 'border-radius': '50%' },
    '.bw_timeline_content': { 'padding-left': '0.5rem' },
    '.bw_timeline_date': { 'font-size': '0.75rem', 'margin-bottom': '0.25rem', 'font-weight': '500' },
    '.bw_timeline_title': { 'font-size': '1rem', 'font-weight': '600', 'margin': '0 0 0.25rem 0', 'line-height': '1.3' },
    '.bw_timeline_text': { 'font-size': '0.875rem', 'margin': '0', 'line-height': '1.5' }
  },

  // ---- Stepper ----
  stepper: {
    '.bw_stepper': { 'display': 'flex', 'gap': '0', 'counter-reset': 'step' },
    '.bw_step': { 'flex': '1', 'display': 'flex', 'flex-direction': 'column', 'align-items': 'center', 'text-align': 'center', 'position': 'relative' },
    '.bw_step + .bw_step::before': { 'content': '""', 'position': 'absolute', 'top': '1rem', 'left': '-50%', 'right': '50%', 'height': '2px' },
    '.bw_step_indicator': {
      'width': '2rem', 'height': '2rem', 'border-radius': '50%',
      'display': 'flex', 'align-items': 'center', 'justify-content': 'center',
      'font-size': '0.875rem', 'font-weight': '600', 'position': 'relative', 'z-index': '1'
    },
    '.bw_step_body': { 'margin-top': '0.5rem' },
    '.bw_step_label': { 'font-size': '0.875rem', 'font-weight': '500' },
    '.bw_step_description': { 'font-size': '0.75rem', 'margin-top': '0.125rem' }
  },

  // ---- Chip input ----
  chipInput: {
    '.bw_chip_input': {
      'display': 'flex', 'flex-wrap': 'wrap', 'align-items': 'center', 'gap': '0.375rem',
      'padding': '0.375rem 0.5rem', 'min-height': '2.5rem', 'cursor': 'text'
    },
    '.bw_chip': {
      'display': 'inline-flex', 'align-items': 'center', 'gap': '0.25rem',
      'padding': '0.125rem 0.5rem', 'border-radius': '1rem',
      'font-size': '0.8125rem', 'line-height': '1.5', 'white-space': 'nowrap'
    },
    '.bw_chip_remove': {
      'display': 'inline-flex', 'align-items': 'center', 'justify-content': 'center',
      'width': '1rem', 'height': '1rem', 'border': 'none', 'background': 'none',
      'font-size': '0.875rem', 'cursor': 'pointer', 'padding': '0', 'border-radius': '50%'
    },
    '.bw_chip_field': { 'flex': '1', 'min-width': '80px', 'border': 'none', 'outline': 'none', 'font-size': '0.875rem', 'padding': '0.125rem 0', 'background': 'transparent' }
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
    '@media (min-width: 576px)': {
      '.bw_col_sm_1': { 'flex': '0 0 8.333333%', 'max-width': '8.333333%' },
      '.bw_col_sm_2': { 'flex': '0 0 16.666667%', 'max-width': '16.666667%' },
      '.bw_col_sm_3': { 'flex': '0 0 25%', 'max-width': '25%' },
      '.bw_col_sm_4': { 'flex': '0 0 33.333333%', 'max-width': '33.333333%' },
      '.bw_col_sm_5': { 'flex': '0 0 41.666667%', 'max-width': '41.666667%' },
      '.bw_col_sm_6': { 'flex': '0 0 50%', 'max-width': '50%' },
      '.bw_col_sm_7': { 'flex': '0 0 58.333333%', 'max-width': '58.333333%' },
      '.bw_col_sm_8': { 'flex': '0 0 66.666667%', 'max-width': '66.666667%' },
      '.bw_col_sm_9': { 'flex': '0 0 75%', 'max-width': '75%' },
      '.bw_col_sm_10': { 'flex': '0 0 83.333333%', 'max-width': '83.333333%' },
      '.bw_col_sm_11': { 'flex': '0 0 91.666667%', 'max-width': '91.666667%' },
      '.bw_col_sm_12': { 'flex': '0 0 100%', 'max-width': '100%' }
    },
    '@media (min-width: 768px)': {
      '.bw_col_md_1': { 'flex': '0 0 8.333333%', 'max-width': '8.333333%' },
      '.bw_col_md_2': { 'flex': '0 0 16.666667%', 'max-width': '16.666667%' },
      '.bw_col_md_3': { 'flex': '0 0 25%', 'max-width': '25%' },
      '.bw_col_md_4': { 'flex': '0 0 33.333333%', 'max-width': '33.333333%' },
      '.bw_col_md_5': { 'flex': '0 0 41.666667%', 'max-width': '41.666667%' },
      '.bw_col_md_6': { 'flex': '0 0 50%', 'max-width': '50%' },
      '.bw_col_md_7': { 'flex': '0 0 58.333333%', 'max-width': '58.333333%' },
      '.bw_col_md_8': { 'flex': '0 0 66.666667%', 'max-width': '66.666667%' },
      '.bw_col_md_9': { 'flex': '0 0 75%', 'max-width': '75%' },
      '.bw_col_md_10': { 'flex': '0 0 83.333333%', 'max-width': '83.333333%' },
      '.bw_col_md_11': { 'flex': '0 0 91.666667%', 'max-width': '91.666667%' },
      '.bw_col_md_12': { 'flex': '0 0 100%', 'max-width': '100%' }
    },
    '@media (min-width: 992px)': {
      '.bw_col_lg_1': { 'flex': '0 0 8.333333%', 'max-width': '8.333333%' },
      '.bw_col_lg_2': { 'flex': '0 0 16.666667%', 'max-width': '16.666667%' },
      '.bw_col_lg_3': { 'flex': '0 0 25%', 'max-width': '25%' },
      '.bw_col_lg_4': { 'flex': '0 0 33.333333%', 'max-width': '33.333333%' },
      '.bw_col_lg_5': { 'flex': '0 0 41.666667%', 'max-width': '41.666667%' },
      '.bw_col_lg_6': { 'flex': '0 0 50%', 'max-width': '50%' },
      '.bw_col_lg_7': { 'flex': '0 0 58.333333%', 'max-width': '58.333333%' },
      '.bw_col_lg_8': { 'flex': '0 0 66.666667%', 'max-width': '66.666667%' },
      '.bw_col_lg_9': { 'flex': '0 0 75%', 'max-width': '75%' },
      '.bw_col_lg_10': { 'flex': '0 0 83.333333%', 'max-width': '83.333333%' },
      '.bw_col_lg_11': { 'flex': '0 0 91.666667%', 'max-width': '91.666667%' },
      '.bw_col_lg_12': { 'flex': '0 0 100%', 'max-width': '100%' }
    },
    '@media (max-width: 575px)': {
      '.bw_card_img_left, .bw_card-img-left': { 'width': '100%' },
      '.bw_card_img_right, .bw_card-img-right': { 'width': '100%' },
      '.bw_hero, .bw_hero': { 'padding': '2rem 1rem' },
      '.bw_cta_actions, .bw_cta-actions': { 'flex-direction': 'column' },
      '.bw_hstack, .bw_hstack': { 'flex-direction': 'column' },
      '.bw_feature_grid, .bw_feature-grid': { 'grid-template-columns': '1fr' }
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
    rules['.bw_pt_' + k + ', .pt-' + k] = { 'padding-top': v + ' !important' };
    rules['.bw_pb_' + k + ', .pb-' + k] = { 'padding-bottom': v + ' !important' };
    rules['.bw_ps_' + k + ', .ps-' + k] = { 'padding-left': v + ' !important' };
    rules['.bw_pe_' + k + ', .pe-' + k] = { 'padding-right': v + ' !important' };
  }
  rules['.bw_m_auto, .m-auto'] = { 'margin': 'auto !important' };
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

  // Flexbox
  var jc = { start: 'flex-start', end: 'flex-end', center: 'center', between: 'space-between', around: 'space-around' };
  for (var jk in jc) { rules['.bw_justify_content_' + jk + ', .justify-content-' + jk] = { 'justify-content': jc[jk] }; }
  var ai = { start: 'flex-start', end: 'flex-end', center: 'center' };
  for (var ak in ai) { rules['.bw_align_items_' + ak + ', .align-items-' + ak] = { 'align-items': ai[ak] }; }

  // Borders
  rules['.bw_border'] = { 'border': '1px solid transparent !important' };
  rules['.bw_border_0'] = { 'border': '0 !important' };
  rules['.bw_border_top_0, .border-top-0'] = { 'border-top': '0 !important' };
  rules['.bw_border_end_0, .border-end-0'] = { 'border-right': '0 !important' };
  rules['.bw_border_bottom_0, .border-bottom-0'] = { 'border-bottom': '0 !important' };
  rules['.bw_border_start_0, .border-start-0'] = { 'border-left': '0 !important' };

  // Rounded
  rules['.bw_rounded'] = { 'border-radius': '.375rem !important' };
  rules['.bw_rounded_0'] = { 'border-radius': '0 !important' };
  rules['.bw_rounded_1, .rounded-1'] = { 'border-radius': '.25rem !important' };
  rules['.bw_rounded_2, .rounded-2'] = { 'border-radius': '.375rem !important' };
  rules['.bw_rounded_3, .rounded-3'] = { 'border-radius': '.5rem !important' };
  rules['.bw_rounded_circle'] = { 'border-radius': '50% !important' };
  rules['.bw_rounded_pill, .rounded-pill'] = { 'border-radius': '50rem !important' };

  // Shadows
  rules['.bw_shadow'] = { 'box-shadow': '0 .5rem 1rem rgba(0,0,0,.15) !important' };
  rules['.bw_shadow_sm'] = { 'box-shadow': '0 .125rem .25rem rgba(0,0,0,.075) !important' };
  rules['.bw_shadow_lg'] = { 'box-shadow': '0 1rem 3rem rgba(0,0,0,.175) !important' };
  rules['.bw_shadow_none, .shadow-none'] = { 'box-shadow': 'none !important' };

  // Width/Height
  ['25', '50', '75', '100'].forEach(function(n) {
    rules['.bw_w_' + n + ', .w-' + n] = { 'width': n + '% !important' };
    rules['.bw_h_' + n + ', .h-' + n] = { 'height': n + '% !important' };
  });
  rules['.bw_w_auto, .w-auto'] = { 'width': 'auto !important' };
  rules['.bw_h_auto, .h-auto'] = { 'height': 'auto !important' };
  rules['.bw_mw_100, .mw-100'] = { 'max-width': '100% !important' };
  rules['.bw_mh_100, .mh-100'] = { 'max-height': '100% !important' };

  // Positioning
  ['static', 'relative', 'absolute', 'fixed', 'sticky'].forEach(function(p) {
    rules['.bw_position_' + p + ', .position-' + p] = { 'position': p + ' !important' };
  });
  rules['.bw_top_0, .top-0'] = { 'top': '0 !important' };
  rules['.bw_top_50, .top-50'] = { 'top': '50% !important' };
  rules['.bw_top_100, .top-100'] = { 'top': '100% !important' };
  rules['.bw_bottom_0, .bottom-0'] = { 'bottom': '0 !important' };
  rules['.bw_bottom_50, .bottom-50'] = { 'bottom': '50% !important' };
  rules['.bw_bottom_100, .bottom-100'] = { 'bottom': '100% !important' };
  rules['.bw_start_0, .start-0'] = { 'left': '0 !important' };
  rules['.bw_start_50, .start-50'] = { 'left': '50% !important' };
  rules['.bw_start_100, .start-100'] = { 'left': '100% !important' };
  rules['.bw_end_0, .end-0'] = { 'right': '0 !important' };
  rules['.bw_end_50, .end-50'] = { 'right': '50% !important' };
  rules['.bw_end_100, .end-100'] = { 'right': '100% !important' };
  rules['.bw_translate_middle, .translate-middle'] = { 'transform': 'translate(-50%, -50%) !important' };

  // Overflow
  ['auto', 'hidden', 'visible', 'scroll'].forEach(function(o) {
    rules['.bw_overflow_' + o + ', .overflow-' + o] = { 'overflow': o + ' !important' };
  });

  // Typography utilities
  rules['.fs-1'] = { 'font-size': 'calc(1.375rem + 1.5vw) !important' };
  rules['.fs-2'] = { 'font-size': 'calc(1.325rem + .9vw) !important' };
  rules['.fs-3'] = { 'font-size': 'calc(1.3rem + .6vw) !important' };
  rules['.fs-4'] = { 'font-size': 'calc(1.275rem + .3vw) !important' };
  rules['.fs-5'] = { 'font-size': '1.25rem !important' };
  rules['.fs-6'] = { 'font-size': '1rem !important' };
  rules['.fw-light'] = { 'font-weight': '300 !important' };
  rules['.fw-lighter'] = { 'font-weight': 'lighter !important' };
  rules['.fw-normal'] = { 'font-weight': '400 !important' };
  rules['.fw-bold'] = { 'font-weight': '700 !important' };
  rules['.fw-bolder'] = { 'font-weight': 'bolder !important' };
  rules['.fst-italic'] = { 'font-style': 'italic !important' };
  rules['.fst-normal'] = { 'font-style': 'normal !important' };
  rules['.text-decoration-none'] = { 'text-decoration': 'none !important' };
  rules['.text-decoration-underline'] = { 'text-decoration': 'underline !important' };
  rules['.text-decoration-line-through'] = { 'text-decoration': 'line-through !important' };
  rules['.text-lowercase'] = { 'text-transform': 'lowercase !important' };
  rules['.text-uppercase'] = { 'text-transform': 'uppercase !important' };
  rules['.text-capitalize'] = { 'text-transform': 'capitalize !important' };
  rules['.text-wrap'] = { 'white-space': 'normal !important' };
  rules['.text-nowrap'] = { 'white-space': 'nowrap !important' };

  // List utilities
  rules['.list-unstyled'] = { 'padding-left': '0', 'list-style': 'none' };
  rules['.list-inline'] = { 'padding-left': '0', 'list-style': 'none' };
  rules['.list-inline-item'] = { 'display': 'inline-block' };
  rules['.list-inline-item:not(:last-child)'] = { 'margin-right': '.5rem' };

  // Visibility
  rules['.bw_visible, .visible'] = { 'visibility': 'visible !important' };
  rules['.bw_invisible, .invisible'] = { 'visibility': 'hidden !important' };

  // User select
  ['all', 'auto', 'none'].forEach(function(u) {
    rules['.bw_user_select_' + u + ', .user-select-' + u] = { 'user-select': u + ' !important' };
  });

  // Pointer events
  rules['.pe-none'] = { 'pointer-events': 'none !important' };
  rules['.pe-auto'] = { 'pointer-events': 'auto !important' };

  // Opacity
  rules['.opacity-0'] = { 'opacity': '0 !important' };
  rules['.opacity-25'] = { 'opacity': '.25 !important' };
  rules['.opacity-50'] = { 'opacity': '.5 !important' };
  rules['.opacity-75'] = { 'opacity': '.75 !important' };
  rules['.opacity-100'] = { 'opacity': '1 !important' };

  return rules;
}

// =========================================================================
// Flatten structuralRules → flat CSS rules object
// =========================================================================

function getStructuralCSS() {
  var result = {};
  var keys = Object.keys(structuralRules);
  for (var i = 0; i < keys.length; i++) {
    Object.assign(result, structuralRules[keys[i]]);
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
export function getStructuralStyles() {
  return getStructuralCSS();
}

// =========================================================================
// defaultStyles — backward-compatible categorized view
// =========================================================================
//
// Tests import `defaultStyles` and check for category keys.
// We export structuralRules directly as defaultStyles — it already
// has all the required category keys. The 'utilities' category is
// generated from generateUtilityRules() and 'root' from the theme token.
// =========================================================================

export var defaultStyles = Object.assign({}, structuralRules, {
  // Merge utility + root categories for backward compat
  root: {
    ':root': {
      '--bw_font_sans_serif': 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      '--bw_font_monospace': '"SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Liberation Mono", "Courier New", monospace',
      '--bw_body_font_family': 'var(--bw_font_sans_serif)',
      '--bw_body_font_size': '1rem',
      '--bw_body_font_weight': '400',
      '--bw_body_line_height': '1.5'
    }
  },
  reset: structuralRules.base,
  enhancedCards: structuralRules.cards,
  tableResponsive: { '.bw_table_responsive': { 'overflow-x': 'auto', '-webkit-overflow-scrolling': 'touch' } },
  utilities: generateUtilityRules()
});

// =========================================================================
// getAllStyles — backward compatible
// =========================================================================

export function getAllStyles() {
  return getStructuralCSS();
}

// =========================================================================
// Theme configuration object (deprecated — use generateTheme())
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
export function generateAlternateCSS(name, altPalette, layout) {
  // Generate themed CSS using the same pipeline as primary
  var rawRules = generateThemedCSS('', altPalette, layout);

  // Re-scope every selector under .bw_theme_alt (+ optional theme name)
  var altPrefix = name ? '.' + name + '.bw_theme_alt' : '.bw_theme_alt';
  var altRules = {};

  for (var sel in rawRules) {
    if (!rawRules.hasOwnProperty(sel)) continue;

    if (sel.charAt(0) === '@') {
      // @media / @keyframes — recurse into the block
      var innerBlock = rawRules[sel];
      var altInner = {};
      for (var innerSel in innerBlock) {
        if (!innerBlock.hasOwnProperty(innerSel)) continue;
        altInner[altPrefix + ' ' + innerSel] = innerBlock[innerSel];
      }
      altRules[sel] = altInner;
    } else {
      // Regular selector — prefix with alt scope
      // Handle comma-separated selectors
      var parts = sel.split(',');
      var scopedParts = [];
      for (var i = 0; i < parts.length; i++) {
        var s = parts[i].trim();
        // 'body' selector gets special treatment: .bw_theme_alt body
        if (s === 'body' || s.indexOf('body') === 0) {
          scopedParts.push(altPrefix + ' ' + s);
        } else {
          scopedParts.push(altPrefix + ' ' + s);
        }
      }
      altRules[scopedParts.join(', ')] = rawRules[sel];
    }
  }

  // Add body-level overrides for the alternate surface
  altRules[altPrefix + ' body, :root' + altPrefix + ' body'] = {
    'color': altPalette.dark.base,
    'background-color': altPalette.light.base
  };

  return altRules;
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
