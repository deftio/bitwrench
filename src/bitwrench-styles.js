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

export var SPACING_PRESETS = {
  compact:  { btn: '0.3rem 0.8rem',  card: '0.875rem 1rem', alert: '0.625rem 1rem', cell: '0.5rem 0.75rem', input: '0.375rem 0.7rem' },
  normal:   { btn: '0.5rem 1.125rem', card: '1.25rem 1.5rem', alert: '0.875rem 1.25rem', cell: '0.75rem 1rem', input: '0.5rem 0.875rem' },
  spacious: { btn: '0.75rem 1.5rem',  card: '1.75rem 2rem', alert: '1.125rem 1.5rem', cell: '1rem 1.25rem', input: '0.75rem 1.125rem' }
};

export var RADIUS_PRESETS = {
  none: { btn: '0', card: '0', badge: '0', alert: '0', input: '0' },
  sm:   { btn: '4px', card: '4px', badge: '.25rem', alert: '4px', input: '4px' },
  md:   { btn: '6px', card: '8px', badge: '.375rem', alert: '8px', input: '6px' },
  lg:   { btn: '10px', card: '12px', badge: '.5rem', alert: '12px', input: '10px' },
  pill: { btn: '50rem', card: '1rem', badge: '50rem', alert: '1rem', input: '50rem' }
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
  warning: '#ffc107',
  info: '#0dcaf0',
  light: '#f8f9fa',
  dark: '#212529'
};

/**
 * Built-in theme presets — named color combinations
 * Each preset provides primary, secondary, and tertiary seed colors.
 */
export var THEME_PRESETS = {
  teal:     { primary: '#006666', secondary: '#6c757d', tertiary: '#006666', label: 'Teal',     desc: 'The signature bitwrench palette — professional teal and neutral gray.' },
  ocean:    { primary: '#0077b6', secondary: '#90e0ef', tertiary: '#00b4d8', label: 'Ocean',    desc: 'Cool blues and teals for a calm, professional look.' },
  sunset:   { primary: '#e76f51', secondary: '#264653', tertiary: '#e9c46a', label: 'Sunset',   desc: 'Warm oranges and deep earth tones for a bold feel.' },
  forest:   { primary: '#2d6a4f', secondary: '#95d5b2', tertiary: '#52b788', label: 'Forest',   desc: 'Natural greens for an organic, earthy vibe.' },
  slate:    { primary: '#343a40', secondary: '#adb5bd', tertiary: '#6c757d', label: 'Slate',    desc: 'Elegant grays for a minimal, modern interface.' },
  rose:     { primary: '#e11d48', secondary: '#fda4af', tertiary: '#fb7185', label: 'Rose',     desc: 'Vibrant pinks and reds for a bold, energetic design.' },
  indigo:   { primary: '#4f46e5', secondary: '#a5b4fc', tertiary: '#818cf8', label: 'Indigo',   desc: 'Deep purples and soft lavenders for a creative palette.' },
  amber:    { primary: '#d97706', secondary: '#fbbf24', tertiary: '#f59e0b', label: 'Amber',    desc: 'Warm golds and yellows for a sunny, welcoming feel.' },
  emerald:  { primary: '#059669', secondary: '#6ee7b7', tertiary: '#34d399', label: 'Emerald',  desc: 'Bright greens and mints for a fresh, modern look.' },
  nord:     { primary: '#5e81ac', secondary: '#88c0d0', tertiary: '#81a1c1', label: 'Nord',     desc: 'Muted arctic blues inspired by the Nord color scheme.' },
  coral:    { primary: '#ef6461', secondary: '#4a7c7e', tertiary: '#e8a87c', label: 'Coral',    desc: 'Warm coral and teal for a balanced, approachable design.' },
  midnight: { primary: '#1e3a5f', secondary: '#7c8db5', tertiary: '#3d5a80', label: 'Midnight', desc: 'Deep navy and steel blue for a sophisticated, authoritative feel.' }
};

/**
 * Resolve layout config to spacing + radius objects
 * @param {Object} config - { spacing, radius, fontSize }
 * @returns {Object} { spacing, radius, fontSize }
 */
export function resolveLayout(config) {
  var sp = (config && config.spacing) || 'normal';
  var rd = (config && config.radius) || 'md';
  var fs = (config && config.fontSize) || 1.0;
  return {
    spacing: typeof sp === 'string' ? (SPACING_PRESETS[sp] || SPACING_PRESETS.normal) : sp,
    radius: typeof rd === 'string' ? (RADIUS_PRESETS[rd] || RADIUS_PRESETS.md) : rd,
    fontSize: fs
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

function generateTypographyThemed(scope, palette) {
  var rules = {};
  rules[scopeSelector(scope, 'a')] = {
    'color': palette.primary.base,
    'text-decoration': 'none',
    'transition': 'color 0.15s'
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
  rules[scopeSelector(scope, '.bw-btn')] = {
    'padding': sp.btn,
    'border-radius': rd.btn
  };
  rules[scopeSelector(scope, '.bw-btn:focus-visible')] = {
    'outline': '0',
    'box-shadow': '0 0 0 3px ' + palette.primary.focus
  };

  // Variants
  var variants = ['primary', 'secondary', 'success', 'danger', 'warning', 'info', 'light', 'dark'];
  variants.forEach(function(v) {
    var p = palette[v];
    rules[scopeSelector(scope, '.bw-btn-' + v)] = {
      'color': p.textOn,
      'background-color': p.base,
      'border-color': p.base
    };
    rules[scopeSelector(scope, '.bw-btn-' + v + ':hover')] = {
      'color': p.textOn,
      'background-color': p.hover,
      'border-color': p.active
    };
    // Outline
    rules[scopeSelector(scope, '.bw-btn-outline-' + v)] = {
      'color': p.base,
      'border-color': p.base,
      'background-color': 'transparent'
    };
    rules[scopeSelector(scope, '.bw-btn-outline-' + v + ':hover')] = {
      'color': p.textOn,
      'background-color': p.base,
      'border-color': p.base
    };
  });

  // Size variants (structural, reuse layout radius)
  rules[scopeSelector(scope, '.bw-btn-lg')] = {
    'padding': '0.625rem 1.5rem',
    'font-size': '1rem',
    'border-radius': rd.btn === '50rem' ? '50rem' : (parseInt(rd.btn) + 2) + 'px'
  };
  rules[scopeSelector(scope, '.bw-btn-sm')] = {
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

  rules[scopeSelector(scope, '.bw-alert')] = {
    'padding': sp.alert,
    'border-radius': rd.alert
  };

  var variants = ['primary', 'secondary', 'success', 'danger', 'warning', 'info', 'light', 'dark'];
  variants.forEach(function(v) {
    var p = palette[v];
    rules[scopeSelector(scope, '.bw-alert-' + v)] = {
      'color': p.darkText,
      'background-color': p.light,
      'border-color': p.border
    };
    rules[scopeSelector(scope, '.bw-alert-' + v + ' .alert-link')] = {
      'color': adjustLightness(p.darkText, -10)
    };
  });

  return rules;
}

function generateBadges(scope, palette) {
  var rules = {};
  var variants = ['primary', 'secondary', 'success', 'danger', 'warning', 'info', 'light', 'dark'];
  variants.forEach(function(v) {
    var p = palette[v];
    rules[scopeSelector(scope, '.bw-badge-' + v)] = {
      'color': p.textOn,
      'background-color': p.base
    };
  });
  return rules;
}

function generateCards(scope, palette, layout) {
  var rules = {};
  var sp = layout.spacing;
  var rd = layout.radius;

  rules[scopeSelector(scope, '.bw-card')] = {
    'background-color': '#fff',
    'border': '1px solid ' + palette.light.border,
    'border-radius': rd.card,
    'box-shadow': '0 1px 3px rgba(0,0,0,.06), 0 1px 2px rgba(0,0,0,.04)'
  };
  rules[scopeSelector(scope, '.bw-card:hover')] = {
    'box-shadow': '0 4px 12px rgba(0,0,0,.1), 0 2px 4px rgba(0,0,0,.06)'
  };
  rules[scopeSelector(scope, '.bw-card-body')] = {
    'padding': sp.card
  };
  rules[scopeSelector(scope, '.bw-card-header')] = {
    'padding': sp.card.split(' ').map(function(v) { return (parseFloat(v) * 0.7).toFixed(3).replace(/\.?0+$/, '') + 'rem'; }).join(' '),
    'background-color': palette.light.light,
    'border-bottom': '1px solid ' + palette.light.border
  };
  rules[scopeSelector(scope, '.bw-card-footer')] = {
    'background-color': palette.light.light,
    'border-top': '1px solid ' + palette.light.border,
    'color': palette.secondary.base
  };
  rules[scopeSelector(scope, '.bw-card-title')] = {
    'color': palette.dark.base
  };
  rules[scopeSelector(scope, '.bw-card-subtitle')] = {
    'color': palette.secondary.base
  };

  // Card variant accent borders
  var variants = ['primary', 'secondary', 'success', 'danger', 'warning', 'info', 'light', 'dark'];
  variants.forEach(function(v) {
    rules[scopeSelector(scope, '.bw-card-' + v)] = {
      'border-left': '4px solid ' + palette[v].base
    };
  });

  return rules;
}

function generateForms(scope, palette, layout) {
  var rules = {};
  var sp = layout.spacing;
  var rd = layout.radius;

  rules[scopeSelector(scope, '.bw-form-control')] = {
    'padding': sp.input,
    'border-radius': rd.input,
    'color': palette.dark.base,
    'background-color': '#fff',
    'border-color': palette.light.border
  };
  rules[scopeSelector(scope, '.bw-form-control:focus')] = {
    'border-color': palette.primary.border,
    'box-shadow': '0 0 0 0.25rem ' + palette.primary.focus
  };
  rules[scopeSelector(scope, '.bw-form-control::placeholder')] = {
    'color': palette.secondary.base
  };
  rules[scopeSelector(scope, '.bw-form-label')] = {
    'color': palette.dark.base
  };
  rules[scopeSelector(scope, '.bw-form-text')] = {
    'color': palette.secondary.base
  };
  rules[scopeSelector(scope, '.bw-form-check-input:checked')] = {
    'background-color': palette.primary.base,
    'border-color': palette.primary.base
  };
  rules[scopeSelector(scope, '.bw-form-check-input:focus')] = {
    'box-shadow': '0 0 0 0.25rem ' + palette.primary.focus
  };

  return rules;
}

function generateNavigation(scope, palette) {
  var rules = {};
  rules[scopeSelector(scope, '.bw-navbar')] = {
    'background-color': palette.light.light,
    'border-bottom-color': palette.light.border
  };
  rules[scopeSelector(scope, '.bw-navbar-brand')] = {
    'color': palette.dark.base
  };
  rules[scopeSelector(scope, '.bw-navbar-nav .bw-nav-link')] = {
    'color': palette.secondary.base
  };
  rules[scopeSelector(scope, '.bw-navbar-nav .bw-nav-link:hover')] = {
    'color': palette.dark.base
  };
  rules[scopeSelector(scope, '.bw-navbar-nav .bw-nav-link.active')] = {
    'color': palette.primary.base,
    'background-color': palette.primary.focus
  };
  rules[scopeSelector(scope, '.bw-navbar-dark')] = {
    'background-color': palette.dark.base,
    'border-bottom-color': palette.dark.hover
  };
  rules[scopeSelector(scope, '.bw-navbar-dark .bw-navbar-brand')] = {
    'color': palette.light.base
  };
  rules[scopeSelector(scope, '.bw-navbar-dark .bw-nav-link')] = {
    'color': 'rgba(255,255,255,.65)'
  };
  rules[scopeSelector(scope, '.bw-navbar-dark .bw-nav-link:hover')] = {
    'color': '#fff'
  };
  rules[scopeSelector(scope, '.bw-navbar-dark .bw-nav-link.active')] = {
    'color': '#fff',
    'font-weight': '600'
  };
  rules[scopeSelector(scope, '.bw-nav-pills .bw-nav-link.active')] = {
    'color': palette.primary.textOn,
    'background-color': palette.primary.base
  };
  return rules;
}

function generateTables(scope, palette, layout) {
  var rules = {};
  var sp = layout.spacing;

  rules[scopeSelector(scope, '.bw-table')] = {
    'color': palette.dark.base,
    'border-color': palette.light.border
  };
  rules[scopeSelector(scope, '.bw-table > :not(caption) > * > *')] = {
    'padding': sp.cell,
    'border-bottom-color': palette.light.border
  };
  rules[scopeSelector(scope, '.bw-table > thead > tr > *')] = {
    'color': palette.secondary.base,
    'border-bottom-color': palette.light.border,
    'background-color': palette.light.light
  };
  rules[scopeSelector(scope, '.bw-table-striped > tbody > tr:nth-of-type(odd) > *')] = {
    'background-color': 'rgba(0, 0, 0, 0.05)'
  };
  rules[scopeSelector(scope, '.bw-table-hover > tbody > tr:hover > *')] = {
    'background-color': palette.primary.focus
  };
  rules[scopeSelector(scope, '.bw-table-bordered')] = {
    'border-color': palette.light.border
  };
  rules[scopeSelector(scope, '.bw-table caption')] = {
    'color': palette.secondary.base
  };

  return rules;
}

function generateTabs(scope, palette) {
  var rules = {};
  rules[scopeSelector(scope, '.bw-nav-tabs')] = {
    'border-bottom-color': palette.light.border
  };
  rules[scopeSelector(scope, '.bw-nav-link')] = {
    'color': palette.secondary.base
  };
  rules[scopeSelector(scope, '.bw-nav-tabs .bw-nav-link:hover')] = {
    'color': palette.dark.base,
    'border-bottom-color': palette.light.border
  };
  rules[scopeSelector(scope, '.bw-nav-tabs .bw-nav-link.active')] = {
    'color': palette.primary.base,
    'border-bottom': '2px solid ' + palette.primary.base
  };
  return rules;
}

function generateListGroups(scope, palette, layout) {
  var rules = {};
  var sp = layout.spacing;

  rules[scopeSelector(scope, '.bw-list-group-item')] = {
    'padding': sp.cell,
    'color': palette.dark.base,
    'background-color': '#fff',
    'border-color': palette.light.border
  };
  rules[scopeSelector(scope, 'a.bw-list-group-item:hover')] = {
    'background-color': palette.light.light,
    'color': palette.dark.hover
  };
  rules[scopeSelector(scope, '.bw-list-group-item.active')] = {
    'color': palette.primary.textOn,
    'background-color': palette.primary.base,
    'border-color': palette.primary.base
  };
  rules[scopeSelector(scope, '.bw-list-group-item.disabled')] = {
    'color': palette.secondary.base,
    'background-color': '#fff'
  };

  return rules;
}

function generatePagination(scope, palette) {
  var rules = {};
  rules[scopeSelector(scope, '.bw-page-link')] = {
    'color': palette.primary.base,
    'background-color': '#fff',
    'border-color': palette.light.border
  };
  rules[scopeSelector(scope, '.bw-page-link:hover')] = {
    'color': palette.primary.hover,
    'background-color': palette.light.light,
    'border-color': palette.light.border
  };
  rules[scopeSelector(scope, '.bw-page-link:focus')] = {
    'box-shadow': '0 0 0 0.25rem ' + palette.primary.focus
  };
  rules[scopeSelector(scope, '.bw-page-item.bw-active .bw-page-link')] = {
    'color': palette.primary.textOn,
    'background-color': palette.primary.base,
    'border-color': palette.primary.base
  };
  rules[scopeSelector(scope, '.bw-page-item.bw-disabled .bw-page-link')] = {
    'color': palette.secondary.base,
    'background-color': '#fff',
    'border-color': palette.light.border
  };
  return rules;
}

function generateProgress(scope, palette) {
  var rules = {};
  rules[scopeSelector(scope, '.bw-progress')] = {
    'background-color': palette.light.light,
    'box-shadow': 'inset 0 1px 2px rgba(0,0,0,.1)'
  };
  rules[scopeSelector(scope, '.bw-progress-bar')] = {
    'color': '#fff',
    'background-color': palette.primary.base,
    'box-shadow': 'inset 0 -1px 0 rgba(0,0,0,.15)'
  };
  // Variant progress bars
  var variants = ['primary', 'secondary', 'success', 'danger', 'warning', 'info'];
  variants.forEach(function(v) {
    rules[scopeSelector(scope, '.bw-progress-bar-' + v)] = {
      'background-color': palette[v].base
    };
  });
  return rules;
}

function generateHero(scope, palette) {
  var rules = {};
  rules[scopeSelector(scope, '.bw-hero-primary')] = {
    'background': 'linear-gradient(135deg, ' + palette.primary.base + ' 0%, ' + palette.primary.hover + ' 100%)',
    'color': palette.primary.textOn
  };
  rules[scopeSelector(scope, '.bw-hero-secondary')] = {
    'background': 'linear-gradient(135deg, ' + palette.secondary.base + ' 0%, ' + palette.secondary.hover + ' 100%)',
    'color': palette.secondary.textOn
  };
  rules[scopeSelector(scope, '.bw-hero-dark')] = {
    'background': 'linear-gradient(135deg, ' + palette.dark.base + ' 0%, ' + palette.dark.hover + ' 100%)',
    'color': palette.dark.textOn
  };
  return rules;
}

function generateUtilityColors(scope, palette) {
  var rules = {};
  var variants = ['primary', 'secondary', 'success', 'danger', 'warning', 'info', 'light', 'dark'];
  variants.forEach(function(v) {
    var p = palette[v];
    rules[scopeSelector(scope, '.bw-text-' + v)] = { 'color': p.base };
    rules[scopeSelector(scope, '.bw-bg-' + v)] = { 'background-color': p.base };
  });
  return rules;
}

function generateResetThemed(scope, palette) {
  var rules = {};
  rules[scopeSelector(scope, 'body')] = {
    'color': palette.dark.base,
    'background-color': '#f5f5f5'
  };
  return rules;
}

function generateBreadcrumbThemed(scope, palette) {
  var rules = {};
  rules[scopeSelector(scope, '.bw-breadcrumb-item + .bw-breadcrumb-item::before')] = {
    'color': palette.secondary.base
  };
  rules[scopeSelector(scope, '.bw-breadcrumb-item.active')] = {
    'color': palette.secondary.base
  };
  return rules;
}

function generateSpinnerThemed(scope, palette) {
  var rules = {};
  var variants = ['primary', 'secondary', 'success', 'danger', 'warning', 'info', 'light', 'dark'];
  variants.forEach(function(v) {
    rules[scopeSelector(scope, '.bw-spinner-border.bw-text-' + v)] = { 'color': palette[v].base };
    rules[scopeSelector(scope, '.bw-spinner-grow.bw-text-' + v)] = { 'color': palette[v].base };
  });
  return rules;
}

function generateCloseButtonThemed(scope, palette) {
  var rules = {};
  rules[scopeSelector(scope, '.bw-close')] = {
    'color': palette.dark.base,
    'opacity': '0.5'
  };
  rules[scopeSelector(scope, '.bw-close:focus')] = {
    'box-shadow': '0 0 0 0.25rem ' + palette.primary.focus
  };
  return rules;
}

function generateSectionsThemed(scope, palette) {
  var rules = {};
  rules[scopeSelector(scope, '.bw-section-subtitle')] = {
    'color': palette.secondary.base
  };
  rules[scopeSelector(scope, '.bw-feature-description')] = {
    'color': palette.secondary.base
  };
  rules[scopeSelector(scope, '.bw-cta-description')] = {
    'color': palette.secondary.base
  };
  return rules;
}

function generateAccordionThemed(scope, palette) {
  var rules = {};
  rules[scopeSelector(scope, '.bw-accordion-item')] = {
    'background-color': '#fff',
    'border-color': palette.light.border
  };
  rules[scopeSelector(scope, '.bw-accordion-button')] = {
    'color': palette.dark.base
  };
  rules[scopeSelector(scope, '.bw-accordion-button:hover')] = {
    'background-color': palette.light.light
  };
  rules[scopeSelector(scope, '.bw-accordion-body')] = {
    'border-top': '1px solid ' + palette.light.border
  };
  return rules;
}

function generateModalThemed(scope, palette) {
  var rules = {};
  rules[scopeSelector(scope, '.bw-modal-content')] = {
    'background-color': '#fff',
    'border-color': palette.light.border,
    'box-shadow': '0 0.5rem 1rem rgba(0,0,0,0.15)'
  };
  rules[scopeSelector(scope, '.bw-modal-header')] = {
    'border-bottom-color': palette.light.border
  };
  rules[scopeSelector(scope, '.bw-modal-footer')] = {
    'border-top-color': palette.light.border
  };
  rules[scopeSelector(scope, '.bw-modal-title')] = {
    'color': palette.dark.base
  };
  return rules;
}

function generateToastThemed(scope, palette) {
  var rules = {};
  rules[scopeSelector(scope, '.bw-toast')] = {
    'background-color': '#fff',
    'border-color': 'rgba(0,0,0,0.1)',
    'box-shadow': '0 0.5rem 1rem rgba(0,0,0,0.15)'
  };
  rules[scopeSelector(scope, '.bw-toast-header')] = {
    'border-bottom-color': 'rgba(0,0,0,0.05)'
  };
  var variants = ['primary', 'secondary', 'success', 'danger', 'warning', 'info'];
  variants.forEach(function(v) {
    rules[scopeSelector(scope, '.bw-toast-' + v)] = {
      'border-left': '4px solid ' + palette[v].base
    };
  });
  return rules;
}

function generateDropdownThemed(scope, palette) {
  var rules = {};
  rules[scopeSelector(scope, '.bw-dropdown-menu')] = {
    'background-color': '#fff',
    'border-color': palette.light.border,
    'box-shadow': '0 0.5rem 1rem rgba(0,0,0,0.15)'
  };
  rules[scopeSelector(scope, '.bw-dropdown-item')] = {
    'color': palette.dark.base
  };
  rules[scopeSelector(scope, '.bw-dropdown-item:hover')] = {
    'color': palette.dark.hover,
    'background-color': palette.light.light
  };
  rules[scopeSelector(scope, '.bw-dropdown-item.disabled')] = {
    'color': palette.secondary.base
  };
  rules[scopeSelector(scope, '.bw-dropdown-divider')] = {
    'border-top-color': palette.light.border
  };
  return rules;
}

function generateSwitchThemed(scope, palette) {
  var rules = {};
  rules[scopeSelector(scope, '.bw-form-switch .bw-switch-input')] = {
    'background-color': palette.secondary.base,
    'border-color': palette.secondary.base
  };
  rules[scopeSelector(scope, '.bw-form-switch .bw-switch-input:checked')] = {
    'background-color': palette.primary.base,
    'border-color': palette.primary.base
  };
  rules[scopeSelector(scope, '.bw-form-switch .bw-switch-input:focus')] = {
    'box-shadow': '0 0 0 0.25rem ' + palette.primary.focus
  };
  return rules;
}

function generateSkeletonThemed(scope, palette) {
  var rules = {};
  rules[scopeSelector(scope, '.bw-skeleton')] = {
    'background-color': palette.light.border
  };
  return rules;
}

function generateAvatarThemed(scope, palette) {
  var rules = {};
  var variants = ['primary', 'secondary', 'success', 'danger', 'warning', 'info', 'light', 'dark'];
  variants.forEach(function(v) {
    rules[scopeSelector(scope, '.bw-avatar-' + v)] = {
      'background-color': palette[v].base,
      'color': palette[v].textOn
    };
  });
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
    generateTypographyThemed(scopeName, palette),
    generateButtons(scopeName, palette, layout),
    generateAlerts(scopeName, palette, layout),
    generateBadges(scopeName, palette),
    generateCards(scopeName, palette, layout),
    generateForms(scopeName, palette, layout),
    generateNavigation(scopeName, palette),
    generateTables(scopeName, palette, layout),
    generateTabs(scopeName, palette),
    generateListGroups(scopeName, palette, layout),
    generatePagination(scopeName, palette),
    generateProgress(scopeName, palette),
    generateHero(scopeName, palette),
    generateBreadcrumbThemed(scopeName, palette),
    generateSpinnerThemed(scopeName, palette),
    generateCloseButtonThemed(scopeName, palette),
    generateSectionsThemed(scopeName, palette),
    generateAccordionThemed(scopeName, palette),
    generateModalThemed(scopeName, palette),
    generateToastThemed(scopeName, palette),
    generateDropdownThemed(scopeName, palette),
    generateSwitchThemed(scopeName, palette),
    generateSkeletonThemed(scopeName, palette),
    generateAvatarThemed(scopeName, palette),
    generateUtilityColors(scopeName, palette)
  );
}

// =========================================================================
// Static structural styles (unchanged, color-independent)
// =========================================================================

/**
 * Complete default style definitions organized by component category
 *
 * Each property is a style category containing CSS rule objects.
 * Pass individual categories to bw.css() or use getAllStyles() to
 * get everything merged into a single flat object.
 *
 * @type {Object}
 */
export const defaultStyles = {
  /**
   * CSS custom properties (variables) on :root
   */
  root: {
    ':root': {
      '--bw-blue': '#006666',
      '--bw-indigo': '#6610f2',
      '--bw-purple': '#6f42c1',
      '--bw-pink': '#d63384',
      '--bw-red': '#dc3545',
      '--bw-orange': '#fd7e14',
      '--bw-yellow': '#ffc107',
      '--bw-green': '#198754',
      '--bw-teal': '#20c997',
      '--bw-cyan': '#0dcaf0',
      '--bw-black': '#000',
      '--bw-white': '#fff',
      '--bw-gray': '#6c757d',
      '--bw-gray-dark': '#343a40',
      '--bw-gray-100': '#f8f9fa',
      '--bw-gray-200': '#e9ecef',
      '--bw-gray-300': '#dee2e6',
      '--bw-gray-400': '#ced4da',
      '--bw-gray-500': '#adb5bd',
      '--bw-gray-600': '#6c757d',
      '--bw-gray-700': '#495057',
      '--bw-gray-800': '#343a40',
      '--bw-gray-900': '#212529',
      '--bw-primary': '#006666',
      '--bw-secondary': '#6c757d',
      '--bw-success': '#198754',
      '--bw-info': '#0dcaf0',
      '--bw-warning': '#ffc107',
      '--bw-danger': '#dc3545',
      '--bw-light': '#f8f9fa',
      '--bw-dark': '#212529',
      '--bw-font-sans-serif': 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      '--bw-font-monospace': '"SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Liberation Mono", "Courier New", monospace',
      '--bw-body-font-family': 'var(--bw-font-sans-serif)',
      '--bw-body-font-size': '1rem',
      '--bw-body-font-weight': '400',
      '--bw-body-line-height': '1.5',
      '--bw-body-color': '#212529',
      '--bw-body-bg': '#fff',
      '--bw-border-width': '1px',
      '--bw-border-style': 'solid',
      '--bw-border-color': '#dee2e6',
      '--bw-border-radius': '.375rem',
      '--bw-border-radius-sm': '.25rem',
      '--bw-border-radius-lg': '.5rem',
      '--bw-border-radius-xl': '1rem',
      '--bw-border-radius-2xl': '2rem',
      '--bw-border-radius-pill': '50rem',
      '--bw-box-shadow': '0 .5rem 1rem rgba(0, 0, 0, .15)',
      '--bw-box-shadow-sm': '0 .125rem .25rem rgba(0, 0, 0, .075)',
      '--bw-box-shadow-lg': '0 1rem 3rem rgba(0, 0, 0, .175)',
      '--bw-box-shadow-inset': 'inset 0 1px 2px rgba(0, 0, 0, .075)'
    }
  },
  /**
   * CSS reset and base element styles
   */
  reset: {
    '*': {
      'box-sizing': 'border-box',
      'margin': '0',
      'padding': '0'
    },
    'html': {
      'font-size': '16px',
      'line-height': '1.5',
      '-webkit-text-size-adjust': '100%',
      '-webkit-font-smoothing': 'antialiased',
      '-moz-osx-font-smoothing': 'grayscale'
    },
    'body': {
      'font-family': 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      'font-size': '1rem',
      'font-weight': '400',
      'line-height': '1.6',
      'color': '#1a1a1a',
      'background-color': '#f5f5f5',
      'margin': '0',
      'padding': '0',
      '-webkit-font-smoothing': 'antialiased',
      '-moz-osx-font-smoothing': 'grayscale'
    },
    // Standard page layout
    '.bw-page': {
      'min-height': '100vh',
      'display': 'flex',
      'flex-direction': 'column'
    },
    '.bw-page-content': {
      'flex': '1',
      'padding': '2rem 0'
    },
    'main': {
      'display': 'block'
    },
    'hr': {
      'box-sizing': 'content-box',
      'height': '0',
      'overflow': 'visible',
      'margin': '1rem 0',
      'color': 'inherit',
      'background-color': 'currentColor',
      'border': '0',
      'opacity': '.25'
    },
    'hr:not([size])': {
      'height': '1px'
    }
  },

  /**
   * Typography styles for headings, paragraphs, links, and small text
   */
  typography: {
    'h1, h2, h3, h4, h5, h6': {
      'margin-top': '0',
      'margin-bottom': '.5rem',
      'font-weight': '600',
      'line-height': '1.25',
      'letter-spacing': '-0.01em',
      'color': '#1a1a1a'
    },
    'h1': {
      'font-size': 'calc(1.375rem + 1.5vw)'
    },
    '@media (min-width: 1200px)': {
      'h1': { 'font-size': '2.5rem' }
    },
    'h2': {
      'font-size': 'calc(1.325rem + .9vw)'
    },
    '@media (min-width: 1200px)': {
      'h2': { 'font-size': '2rem' }
    },
    'h3': {
      'font-size': 'calc(1.3rem + .6vw)'
    },
    '@media (min-width: 1200px)': {
      'h3': { 'font-size': '1.75rem' }
    },
    'h4': {
      'font-size': 'calc(1.275rem + .3vw)'
    },
    '@media (min-width: 1200px)': {
      'h4': { 'font-size': '1.5rem' }
    },
    'h5': { 'font-size': '1.25rem' },
    'h6': { 'font-size': '1rem' },

    'p': {
      'margin-top': '0',
      'margin-bottom': '1rem'
    },

    'small': {
      'font-size': '0.875rem'
    },

    'a': {
      'color': '#006666',
      'text-decoration': 'none',
      'transition': 'color 0.15s'
    },
    'a:hover': {
      'color': '#004d4d',
      'text-decoration': 'underline'
    }
  },

  /**
   * 12-column flexbox grid system
   */
  grid: {
    '.bw-container': {
      'width': '100%',
      'padding-right': '0.75rem',
      'padding-left': '0.75rem',
      'margin-right': 'auto',
      'margin-left': 'auto'
    },
    '@media (min-width: 576px)': {
      '.bw-container': { 'max-width': '540px' }
    },
    '@media (min-width: 768px)': {
      '.bw-container': { 'max-width': '720px' }
    },
    '@media (min-width: 992px)': {
      '.bw-container': { 'max-width': '960px' }
    },
    '@media (min-width: 1200px)': {
      '.bw-container': { 'max-width': '1140px' }
    },
    '.bw-container-fluid': {
      'width': '100%',
      'padding-right': '15px',
      'padding-left': '15px',
      'margin-right': 'auto',
      'margin-left': 'auto'
    },

    '.bw-row': {
      'display': 'flex',
      'flex-wrap': 'wrap',
      'margin-right': 'calc(var(--bw-gutter-x, 0.75rem) * -0.5)',
      'margin-left': 'calc(var(--bw-gutter-x, 0.75rem) * -0.5)'
    },

    // Column system
    '.col, [class*="col-"]': {
      'position': 'relative',
      'width': '100%',
      'padding-right': 'calc(var(--bw-gutter-x, 0.75rem) * 0.5)',
      'padding-left': 'calc(var(--bw-gutter-x, 0.75rem) * 0.5)'
    },
    '.bw-col': {
      'flex': '1 0 0%'
    },
    '.bw-col': {
      'flex-basis': '0',
      'flex-grow': '1',
      'max-width': '100%'
    },

    // Column sizes
    '.bw-col-1': { 'flex': '0 0 8.333333%', 'max-width': '8.333333%' },
    '.bw-col-2': { 'flex': '0 0 16.666667%', 'max-width': '16.666667%' },
    '.bw-col-3': { 'flex': '0 0 25%', 'max-width': '25%' },
    '.bw-col-4': { 'flex': '0 0 33.333333%', 'max-width': '33.333333%' },
    '.bw-col-5': { 'flex': '0 0 41.666667%', 'max-width': '41.666667%' },
    '.bw-col-6': { 'flex': '0 0 50%', 'max-width': '50%' },
    '.bw-col-7': { 'flex': '0 0 58.333333%', 'max-width': '58.333333%' },
    '.bw-col-8': { 'flex': '0 0 66.666667%', 'max-width': '66.666667%' },
    '.bw-col-9': { 'flex': '0 0 75%', 'max-width': '75%' },
    '.bw-col-10': { 'flex': '0 0 83.333333%', 'max-width': '83.333333%' },
    '.bw-col-11': { 'flex': '0 0 91.666667%', 'max-width': '91.666667%' },
    '.bw-col-12': { 'flex': '0 0 100%', 'max-width': '100%' }
  },

  /**
   * Button styles - all variants, sizes, outlines, and states
   */
  buttons: {
    '.bw-btn': {
      'display': 'inline-flex',
      'align-items': 'center',
      'justify-content': 'center',
      'font-weight': '500',
      'line-height': '1.5',
      'color': '#1a1a1a',
      'text-align': 'center',
      'text-decoration': 'none',
      'vertical-align': 'middle',
      'cursor': 'pointer',
      'user-select': 'none',
      'background-color': 'transparent',
      'border': '1px solid transparent',
      'padding': '0.5rem 1.125rem',
      'font-size': '0.875rem',
      'font-family': 'inherit',
      'border-radius': '6px',
      'transition': 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
      'box-shadow': '0 1px 2px rgba(0,0,0,.05)',
      'gap': '0.5rem'
    },
    '.bw-btn:hover': {
      'text-decoration': 'none',
      'transform': 'translateY(-1px)',
      'box-shadow': '0 4px 6px rgba(0,0,0,.07)'
    },
    '.bw-btn:active': {
      'transform': 'translateY(0)',
      'box-shadow': '0 1px 2px rgba(0,0,0,.05)'
    },
    '.bw-btn:focus-visible': {
      'outline': '0',
      'box-shadow': '0 0 0 3px rgba(0, 102, 102, 0.3)'
    },
    '.bw-btn:disabled': {
      'opacity': '0.5',
      'cursor': 'not-allowed',
      'pointer-events': 'none'
    },

    // Button variants
    '.bw-btn-primary': {
      'color': '#fff',
      'background-color': '#006666',
      'border-color': '#006666'
    },
    '.bw-btn-primary:hover': {
      'color': '#fff',
      'background-color': '#005555',
      'border-color': '#004d4d'
    },

    '.bw-btn-secondary': {
      'color': '#fff',
      'background-color': '#6c757d',
      'border-color': '#6c757d'
    },
    '.bw-btn-secondary:hover': {
      'color': '#fff',
      'background-color': '#5c636a',
      'border-color': '#565e64'
    },

    '.bw-btn-success': {
      'color': '#fff',
      'background-color': '#198754',
      'border-color': '#198754'
    },
    '.bw-btn-success:hover': {
      'color': '#fff',
      'background-color': '#157347',
      'border-color': '#146c43'
    },

    '.bw-btn-danger': {
      'color': '#fff',
      'background-color': '#dc3545',
      'border-color': '#dc3545'
    },
    '.bw-btn-danger:hover': {
      'color': '#fff',
      'background-color': '#bb2d3b',
      'border-color': '#b02a37'
    },

    '.bw-btn-warning': {
      'color': '#000',
      'background-color': '#ffc107',
      'border-color': '#ffc107'
    },
    '.bw-btn-warning:hover': {
      'color': '#000',
      'background-color': '#ffca2c',
      'border-color': '#ffc720'
    },

    '.bw-btn-info': {
      'color': '#000',
      'background-color': '#0dcaf0',
      'border-color': '#0dcaf0'
    },
    '.bw-btn-info:hover': {
      'color': '#000',
      'background-color': '#31d2f2',
      'border-color': '#25cff2'
    },

    '.bw-btn-light': {
      'color': '#000',
      'background-color': '#f8f9fa',
      'border-color': '#f8f9fa'
    },
    '.bw-btn-light:hover': {
      'color': '#000',
      'background-color': '#f9fafb',
      'border-color': '#f9fafb'
    },

    '.bw-btn-dark': {
      'color': '#fff',
      'background-color': '#212529',
      'border-color': '#212529'
    },
    '.bw-btn-dark:hover': {
      'color': '#fff',
      'background-color': '#1c1f23',
      'border-color': '#1a1e21'
    },

    // Outline variants
    '.bw-btn-outline-primary': {
      'color': '#006666',
      'border-color': '#006666',
      'background-color': 'transparent'
    },
    '.bw-btn-outline-primary:hover': {
      'color': '#fff',
      'background-color': '#006666',
      'border-color': '#006666'
    },

    '.bw-btn-outline-secondary': {
      'color': '#6c757d',
      'border-color': '#6c757d',
      'background-color': 'transparent'
    },
    '.bw-btn-outline-secondary:hover': {
      'color': '#fff',
      'background-color': '#6c757d',
      'border-color': '#6c757d'
    },

    '.bw-btn-outline-success': {
      'color': '#198754',
      'border-color': '#198754',
      'background-color': 'transparent'
    },
    '.bw-btn-outline-success:hover': {
      'color': '#fff',
      'background-color': '#198754',
      'border-color': '#198754'
    },

    '.bw-btn-outline-danger': {
      'color': '#dc3545',
      'border-color': '#dc3545',
      'background-color': 'transparent'
    },
    '.bw-btn-outline-danger:hover': {
      'color': '#fff',
      'background-color': '#dc3545',
      'border-color': '#dc3545'
    },

    '.bw-btn-outline-warning': {
      'color': '#ffc107',
      'border-color': '#ffc107',
      'background-color': 'transparent'
    },
    '.bw-btn-outline-warning:hover': {
      'color': '#000',
      'background-color': '#ffc107',
      'border-color': '#ffc107'
    },

    '.bw-btn-outline-info': {
      'color': '#0dcaf0',
      'border-color': '#0dcaf0',
      'background-color': 'transparent'
    },
    '.bw-btn-outline-info:hover': {
      'color': '#000',
      'background-color': '#0dcaf0',
      'border-color': '#0dcaf0'
    },

    '.bw-btn-outline-light': {
      'color': '#f8f9fa',
      'border-color': '#f8f9fa',
      'background-color': 'transparent'
    },
    '.bw-btn-outline-light:hover': {
      'color': '#000',
      'background-color': '#f8f9fa',
      'border-color': '#f8f9fa'
    },

    '.bw-btn-outline-dark': {
      'color': '#212529',
      'border-color': '#212529',
      'background-color': 'transparent'
    },
    '.bw-btn-outline-dark:hover': {
      'color': '#fff',
      'background-color': '#212529',
      'border-color': '#212529'
    },

    // Button sizes
    '.bw-btn-lg': {
      'padding': '0.625rem 1.5rem',
      'font-size': '1rem',
      'border-radius': '8px'
    },
    '.bw-btn-sm': {
      'padding': '0.25rem 0.75rem',
      'font-size': '0.8125rem',
      'border-radius': '5px'
    }
  },

  /**
   * Card component styles
   */
  cards: {
    '.bw-card': {
      'position': 'relative',
      'display': 'flex',
      'flex-direction': 'column',
      'min-width': '0',
      'height': '100%',
      'word-wrap': 'break-word',
      'background-color': '#fff',
      'background-clip': 'border-box',
      'border': '1px solid #e5e5e5',
      'border-radius': '8px',
      'box-shadow': '0 1px 3px rgba(0,0,0,.06), 0 1px 2px rgba(0,0,0,.04)',
      'transition': 'box-shadow 0.2s cubic-bezier(0.4,0,0.2,1), transform 0.2s cubic-bezier(0.4,0,0.2,1)',
      'margin-bottom': '1.5rem',
      'overflow': 'hidden'
    },
    '.bw-card:hover': {
      'box-shadow': '0 4px 12px rgba(0,0,0,.1), 0 2px 4px rgba(0,0,0,.06)',
      'transform': 'translateY(-2px)'
    },
    '.bw-card-body': {
      'flex': '1 1 auto',
      'padding': '1.25rem 1.5rem'
    },
    '.bw-card-body > *:last-child': {
      'margin-bottom': '0'
    },
    '.bw-card-title': {
      'margin-bottom': '0.5rem',
      'font-size': '1.125rem',
      'font-weight': '600',
      'line-height': '1.3',
      'color': '#1a1a1a'
    },
    '.bw-card-text': {
      'margin-bottom': '0',
      'color': '#555',
      'font-size': '0.9375rem',
      'line-height': '1.6'
    },
    '.bw-card-header': {
      'padding': '0.875rem 1.5rem',
      'margin-bottom': '0',
      'background-color': '#fafafa',
      'border-bottom': '1px solid #e5e5e5',
      'font-weight': '600',
      'font-size': '0.875rem'
    },
    '.bw-card-footer': {
      'padding': '0.75rem 1.5rem',
      'background-color': '#fafafa',
      'border-top': '1px solid #e5e5e5',
      'font-size': '0.875rem',
      'color': '#777'
    },
    '.bw-card-primary': { 'border-left': '4px solid #006666' },
    '.bw-card-secondary': { 'border-left': '4px solid #6c757d' },
    '.bw-card-success': { 'border-left': '4px solid #198754' },
    '.bw-card-danger': { 'border-left': '4px solid #dc3545' },
    '.bw-card-warning': { 'border-left': '4px solid #ffc107' },
    '.bw-card-info': { 'border-left': '4px solid #0dcaf0' },
    '.bw-card-light': { 'border-left': '4px solid #f8f9fa' },
    '.bw-card-dark': { 'border-left': '4px solid #212529' },
  },

  /**
   * Form control styles
   */
  forms: {
    '.bw-form-control': {
      'display': 'block',
      'width': '100%',
      'padding': '0.5rem 0.875rem',
      'font-size': '0.9375rem',
      'font-weight': '400',
      'line-height': '1.5',
      'color': '#1a1a1a',
      'background-color': '#fff',
      'background-clip': 'padding-box',
      'border': '1px solid #ccc',
      'appearance': 'none',
      'border-radius': '6px',
      'transition': 'border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out',
      'font-family': 'inherit'
    },
    '.bw-form-control:focus': {
      'color': '#1a1a1a',
      'background-color': '#fff',
      'border-color': '#80cccc',
      'outline': '0',
      'box-shadow': '0 0 0 0.25rem rgba(0, 102, 102, 0.25)'
    },
    '.bw-form-control::placeholder': {
      'color': '#999',
      'opacity': '1'
    },
    '.bw-form-label': {
      'display': 'block',
      'margin-bottom': '0.375rem',
      'font-size': '0.875rem',
      'font-weight': '600',
      'color': '#333'
    },
    '.bw-form-group': {
      'margin-bottom': '1.25rem'
    },
    '.bw-form-text': {
      'margin-top': '0.25rem',
      'font-size': '0.8125rem',
      'color': '#777'
    },
    'select.bw-form-control': {
      'padding-right': '2.25rem',
      'background-image': "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='%23666' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='m2 5 6 6 6-6'/%3e%3c/svg%3e\")",
      'background-repeat': 'no-repeat',
      'background-position': 'right 0.75rem center',
      'background-size': '16px 12px'
    },
    'textarea.bw-form-control': {
      'min-height': '5rem',
      'resize': 'vertical'
    }
  },

  /**
   * Navbar and navigation link styles
   */
  navigation: {
    '.bw-navbar': {
      'position': 'relative',
      'display': 'flex',
      'flex-wrap': 'wrap',
      'align-items': 'center',
      'justify-content': 'space-between',
      'padding': '0.5rem 1.5rem',
      'background-color': '#fafafa',
      'border-bottom': '1px solid #e5e5e5'
    },
    '.bw-navbar > .bw-container, .bw-navbar > .container': {
      'display': 'flex',
      'flex-wrap': 'wrap',
      'align-items': 'center',
      'justify-content': 'space-between'
    },
    '.bw-navbar-dark': {
      'background-color': '#1a1a1a',
      'border-bottom-color': '#333'
    },
    '.bw-navbar-dark .bw-navbar-brand': {
      'color': '#fff'
    },
    '.bw-navbar-dark .bw-nav-link': {
      'color': 'rgba(255,255,255,.65)'
    },
    '.bw-navbar-dark .bw-nav-link:hover': {
      'color': '#fff'
    },
    '.bw-navbar-dark .bw-nav-link.active': {
      'color': '#fff',
      'font-weight': '600'
    },
    '.bw-navbar-brand': {
      'display': 'inline-flex',
      'align-items': 'center',
      'gap': '0.5rem',
      'padding-top': '0.25rem',
      'padding-bottom': '0.25rem',
      'margin-right': '1.5rem',
      'font-size': '1.125rem',
      'font-weight': '600',
      'line-height': 'inherit',
      'white-space': 'nowrap',
      'text-decoration': 'none',
      'color': '#1a1a1a'
    },
    '.bw-navbar-nav': {
      'display': 'flex',
      'flex-direction': 'row',
      'padding-left': '0',
      'margin-bottom': '0',
      'list-style': 'none',
      'gap': '0.25rem'
    },
    '.bw-navbar-nav .bw-nav-link': {
      'display': 'block',
      'padding': '0.5rem 0.875rem',
      'color': '#555',
      'text-decoration': 'none',
      'font-size': '0.875rem',
      'font-weight': '500',
      'border-radius': '6px',
      'transition': 'color 0.15s, background-color 0.15s'
    },
    '.bw-navbar-nav .bw-nav-link:hover': {
      'color': '#1a1a1a',
      'background-color': 'rgba(0,0,0,.04)'
    },
    '.bw-navbar-nav .bw-nav-link.active': {
      'color': '#006666',
      'font-weight': '600',
      'background-color': 'rgba(0, 102, 102, 0.06)'
    }
  },

  /**
   * Table styles with striped and hover variants
   */
  tables: {
    '.bw-table': {
      'width': '100%',
      'margin-bottom': '1.5rem',
      'color': '#1a1a1a',
      'vertical-align': 'top',
      'border-color': '#e0e0e0',
      'border-collapse': 'collapse',
      'font-size': '0.9375rem',
      'line-height': '1.5'
    },
    '.bw-table > :not(caption) > * > *': {
      'padding': '0.75rem 1rem',
      'background-color': 'transparent',
      'border-bottom': '1px solid #e0e0e0'
    },
    '.bw-table > tbody': {
      'vertical-align': 'inherit'
    },
    '.bw-table > thead': {
      'vertical-align': 'bottom'
    },
    '.bw-table > thead > tr > *': {
      'padding': '0.625rem 1rem',
      'font-size': '0.8125rem',
      'font-weight': '600',
      'text-transform': 'uppercase',
      'letter-spacing': '0.04em',
      'color': '#555',
      'border-bottom': '2px solid #ccc',
      'background-color': '#f8f8f8'
    },
    '.bw-table-striped > tbody > tr:nth-of-type(odd) > *': {
      'background-color': 'rgba(0, 0, 0, 0.05)'
    },
    '.bw-table-hover > tbody > tr:hover > *': {
      'background-color': 'rgba(0, 102, 102, 0.1)'
    },
    '.bw-table-bordered': {
      'border': '1px solid #e0e0e0'
    },
    '.bw-table-bordered > :not(caption) > * > *': {
      'border': '1px solid #e0e0e0'
    },
    '.bw-table caption': {
      'padding': '0.5rem 1rem',
      'font-size': '0.875rem',
      'color': '#777',
      'caption-side': 'bottom'
    }
  },

  /**
   * Alert/notification styles for all color variants
   */
  alerts: {
    '.bw-alert': {
      'position': 'relative',
      'padding': '0.875rem 1.25rem',
      'margin-bottom': '1rem',
      'border': '1px solid transparent',
      'border-radius': '8px',
      'font-size': '0.9375rem',
      'line-height': '1.6'
    },
    '.bw-alert-heading, .alert-heading': {
      'color': 'inherit'
    },
    '.bw-alert-link, .alert-link': {
      'font-weight': '700'
    },
    '.bw-alert-dismissible': {
      'padding-right': '3rem'
    },
    '.bw-alert-dismissible .btn-close': {
      'position': 'absolute',
      'top': '0',
      'right': '0',
      'z-index': '2',
      'padding': '1.25rem 1rem'
    },
    '.bw-alert-primary': {
      'color': '#004d4d',
      'background-color': '#e0f2f1',
      'border-color': '#b2dfdb'
    },
    '.bw-alert-primary .alert-link': {
      'color': '#003d3d'
    },
    '.bw-alert-secondary': {
      'color': '#41464b',
      'background-color': '#e2e3e5',
      'border-color': '#d3d6d8'
    },
    '.bw-alert-secondary .alert-link': {
      'color': '#34383c'
    },
    '.bw-alert-success': {
      'color': '#0f5132',
      'background-color': '#d1e7dd',
      'border-color': '#badbcc'
    },
    '.bw-alert-success .alert-link': {
      'color': '#0c4128'
    },
    '.bw-alert-info': {
      'color': '#055160',
      'background-color': '#cff4fc',
      'border-color': '#b6effb'
    },
    '.bw-alert-info .alert-link': {
      'color': '#04414d'
    },
    '.bw-alert-warning': {
      'color': '#664d03',
      'background-color': '#fff3cd',
      'border-color': '#ffecb5'
    },
    '.bw-alert-warning .alert-link': {
      'color': '#523e02'
    },
    '.bw-alert-danger': {
      'color': '#842029',
      'background-color': '#f8d7da',
      'border-color': '#f5c2c7'
    },
    '.bw-alert-danger .alert-link': {
      'color': '#6a1a21'
    },
    '.bw-alert-light': {
      'color': '#636464',
      'background-color': '#fefefe',
      'border-color': '#fdfdfe'
    },
    '.bw-alert-light .alert-link': {
      'color': '#4f5050'
    },
    '.bw-alert-dark': {
      'color': '#141619',
      'background-color': '#d3d3d4',
      'border-color': '#bcbebf'
    },
    '.bw-alert-dark .alert-link': {
      'color': '#101214'
    }
  },

  /**
   * Inline badge/label styles
   */
  badges: {
    '.bw-badge': {
      'display': 'inline-block',
      'padding': '.4em .75em',
      'font-size': '.875em',
      'font-weight': '600',
      'line-height': '1.3',
      'color': '#fff',
      'text-align': 'center',
      'white-space': 'nowrap',
      'vertical-align': 'baseline',
      'border-radius': '.375rem'
    },
    '.bw-badge:empty': {
      'display': 'none'
    },
    '.bw-badge-sm': {
      'font-size': '.75em',
      'padding': '.25em .5em'
    },
    '.bw-badge-lg': {
      'font-size': '1em',
      'padding': '.5em .9em'
    },
    '.bw-badge-pill': {
      'border-radius': '50rem'
    },
    '.btn .badge': {
      'position': 'relative',
      'top': '-1px'
    },
    '.bw-badge-primary': {
      'color': '#fff',
      'background-color': '#006666'
    },
    '.bw-badge-secondary': {
      'color': '#fff',
      'background-color': '#6c757d'
    },
    '.bw-badge-success': {
      'color': '#fff',
      'background-color': '#198754'
    },
    '.bw-badge-info': {
      'color': '#000',
      'background-color': '#0dcaf0'
    },
    '.bw-badge-warning': {
      'color': '#000',
      'background-color': '#ffc107'
    },
    '.bw-badge-danger': {
      'color': '#fff',
      'background-color': '#dc3545'
    },
    '.bw-badge-light': {
      'color': '#000',
      'background-color': '#f8f9fa'
    },
    '.bw-badge-dark': {
      'color': '#fff',
      'background-color': '#212529'
    }
  },

  /**
   * Progress bar styles
   */
  progress: {
    '.bw-progress': {
      'display': 'flex',
      'height': '1.25rem',
      'overflow': 'hidden',
      'font-size': '.875rem',
      'background-color': '#e9ecef',
      'border-radius': '.5rem',
      'box-shadow': 'inset 0 1px 2px rgba(0,0,0,.1)'
    },
    '.bw-progress-bar': {
      'display': 'flex',
      'flex-direction': 'column',
      'justify-content': 'center',
      'overflow': 'hidden',
      'color': '#fff',
      'text-align': 'center',
      'white-space': 'nowrap',
      'background-color': '#006666',
      'transition': 'width .6s ease',
      'box-shadow': 'inset 0 -1px 0 rgba(0,0,0,.15)',
      'font-weight': '600'
    },
    '.bw-progress-bar-striped': {
      'background-image': 'linear-gradient(45deg,rgba(255,255,255,.15) 25%,transparent 25%,transparent 50%,rgba(255,255,255,.15) 50%,rgba(255,255,255,.15) 75%,transparent 75%,transparent)',
      'background-size': '1rem 1rem'
    },
    '.bw-progress-bar-animated': {
      'animation': 'progress-bar-stripes 1s linear infinite'
    },
    '@keyframes progress-bar-stripes': {
      '0%': { 'background-position-x': '1rem' }
    },
    '.bw-progress-bar-primary': { 'background-color': '#006666' },
    '.bw-progress-bar-secondary': { 'background-color': '#6c757d' },
    '.bw-progress-bar-success': { 'background-color': '#198754' },
    '.bw-progress-bar-danger': { 'background-color': '#dc3545' },
    '.bw-progress-bar-warning': { 'background-color': '#ffc107' },
    '.bw-progress-bar-info': { 'background-color': '#0dcaf0' }
  },

  /**
   * Tab navigation styles
   */
  tabs: {
    '.bw-nav': {
      'display': 'flex',
      'flex-wrap': 'wrap',
      'padding-left': '0',
      'margin-bottom': '0',
      'list-style': 'none',
      'gap': '0'
    },
    '.bw-nav-tabs': {
      'border-bottom': '2px solid #e5e5e5'
    },
    '.bw-nav-pills .bw-nav-link': {
      'border-radius': '6px'
    },
    '.bw-nav-pills .bw-nav-link.active': {
      'color': '#fff',
      'background-color': '#006666'
    },
    '.bw-nav-vertical': {
      'flex-direction': 'column'
    },
    '.bw-nav-item': {
      'display': 'block'
    },
    '.bw-nav-tabs .bw-nav-item': {
      'margin-bottom': '-2px'
    },
    '.bw-nav-link': {
      'display': 'block',
      'padding': '0.625rem 1rem',
      'font-size': '0.875rem',
      'font-weight': '500',
      'color': '#777',
      'text-decoration': 'none',
      'cursor': 'pointer',
      'border': 'none',
      'background': 'transparent',
      'transition': 'color 0.15s, border-color 0.15s',
      'font-family': 'inherit'
    },
    '.bw-nav-tabs .bw-nav-link': {
      'border': 'none',
      'border-bottom': '2px solid transparent',
      'border-radius': '0',
      'background-color': 'transparent'
    },
    '.bw-nav-tabs .bw-nav-link:hover': {
      'color': '#1a1a1a',
      'border-bottom-color': '#ccc'
    },
    '.bw-nav-tabs .bw-nav-link.active': {
      'color': '#006666',
      'background-color': 'transparent',
      'border-bottom': '2px solid #006666',
      'font-weight': '600'
    },
    '.bw-tab-content': {
      'padding': '1.25rem 0'
    },
    '.bw-tab-pane': {
      'display': 'none'
    },
    '.bw-tab-pane.active': {
      'display': 'block'
    }
  },

  /**
   * List group styles
   */
  listGroups: {
    '.bw-list-group': {
      'display': 'flex',
      'flex-direction': 'column',
      'padding-left': '0',
      'margin-bottom': '0',
      'border-radius': '0.375rem'
    },
    '.bw-list-group-item': {
      'position': 'relative',
      'display': 'block',
      'padding': '0.75rem 1.25rem',
      'color': '#1a1a1a',
      'text-decoration': 'none',
      'background-color': '#fff',
      'border': '1px solid #e5e5e5',
      'font-size': '0.9375rem'
    },
    '.bw-list-group-item:first-child': {
      'border-top-left-radius': 'inherit',
      'border-top-right-radius': 'inherit'
    },
    '.bw-list-group-item:last-child': {
      'border-bottom-right-radius': 'inherit',
      'border-bottom-left-radius': 'inherit'
    },
    '.bw-list-group-item + .bw-list-group-item': {
      'border-top-width': '0'
    },
    '.bw-list-group-item.active': {
      'z-index': '2',
      'color': '#fff',
      'background-color': '#006666',
      'border-color': '#006666'
    },
    '.bw-list-group-item.disabled': {
      'color': '#6c757d',
      'pointer-events': 'none',
      'background-color': '#fff'
    },
    'a.bw-list-group-item': {
      'cursor': 'pointer'
    },
    'a.bw-list-group-item:hover': {
      'z-index': '1',
      'color': '#495057',
      'text-decoration': 'none',
      'background-color': '#f8f9fa'
    },
    '.bw-list-group-flush': {
      'border-radius': '0'
    },
    '.bw-list-group-flush > .bw-list-group-item': {
      'border-width': '0 0 1px',
      'border-radius': '0'
    },
    '.bw-list-group-flush > .bw-list-group-item:last-child': {
      'border-bottom-width': '0'
    }
  },

  /**
   * Pagination control styles
   */
  pagination: {
    '.bw-pagination': {
      'display': 'flex',
      'padding-left': '0',
      'list-style': 'none',
      'margin-bottom': '0'
    },
    '.bw-page-item': {
      'display': 'list-item',
      'list-style': 'none'
    },
    '.bw-page-link': {
      'position': 'relative',
      'display': 'block',
      'padding': '0.375rem 0.75rem',
      'margin-left': '-1px',
      'line-height': '1.25',
      'color': '#006666',
      'text-decoration': 'none',
      'background-color': '#fff',
      'border': '1px solid #dee2e6',
      'transition': 'color 0.15s ease-in-out, background-color 0.15s ease-in-out, border-color 0.15s ease-in-out'
    },
    '.bw-page-link:hover': {
      'z-index': '2',
      'color': '#004d4d',
      'background-color': '#e9ecef',
      'border-color': '#dee2e6'
    },
    '.bw-page-link:focus': {
      'z-index': '3',
      'color': '#004d4d',
      'background-color': '#e9ecef',
      'outline': '0',
      'box-shadow': '0 0 0 0.25rem rgba(0, 102, 102, 0.25)'
    },
    '.bw-page-item:first-child .bw-page-link': {
      'margin-left': '0',
      'border-top-left-radius': '0.375rem',
      'border-bottom-left-radius': '0.375rem'
    },
    '.bw-page-item:last-child .bw-page-link': {
      'border-top-right-radius': '0.375rem',
      'border-bottom-right-radius': '0.375rem'
    },
    '.bw-page-item.bw-active .bw-page-link': {
      'z-index': '3',
      'color': '#fff',
      'background-color': '#006666',
      'border-color': '#006666'
    },
    '.bw-page-item.bw-disabled .bw-page-link': {
      'color': '#6c757d',
      'pointer-events': 'none',
      'background-color': '#fff',
      'border-color': '#dee2e6'
    }
  },

  /**
   * Breadcrumb navigation styles
   */
  breadcrumb: {
    '.bw-breadcrumb': {
      'display': 'flex',
      'flex-wrap': 'wrap',
      'padding': '0 0',
      'margin-bottom': '1rem',
      'list-style': 'none',
      'background-color': 'transparent'
    },
    '.bw-breadcrumb-item': {
      'display': 'flex'
    },
    '.bw-breadcrumb-item + .bw-breadcrumb-item': {
      'padding-left': '0.5rem'
    },
    '.bw-breadcrumb-item + .bw-breadcrumb-item::before': {
      'float': 'left',
      'padding-right': '0.5rem',
      'color': '#6c757d',
      'content': '"/"'
    },
    '.bw-breadcrumb-item.active': {
      'color': '#6c757d'
    }
  },

  /**
   * Hero section styles
   */
  hero: {
    '.bw-hero': {
      'position': 'relative',
      'overflow': 'hidden'
    },
    '.bw-hero-primary': {
      'background': 'linear-gradient(135deg, #006666 0%, #004d4d 100%)',
      'color': '#fff'
    },
    '.bw-hero-secondary': {
      'background': 'linear-gradient(135deg, #6c757d 0%, #5a6268 100%)',
      'color': '#fff'
    },
    '.bw-hero-light': {
      'background': '#f8f9fa',
      'color': '#212529'
    },
    '.bw-hero-dark': {
      'background': 'linear-gradient(135deg, #212529 0%, #16181b 100%)',
      'color': '#fff'
    },
    '.bw-hero-overlay': {
      'position': 'absolute',
      'top': '0',
      'left': '0',
      'right': '0',
      'bottom': '0',
      'background': 'rgba(0,0,0,0.5)',
      'z-index': '1'
    },
    '.bw-hero-content': {
      'position': 'relative',
      'z-index': '2'
    },
    '.bw-hero-title': {
      'font-weight': '300',
      'letter-spacing': '-0.05rem',
      'color': 'inherit'
    },
    '.bw-hero-subtitle': {
      'color': 'inherit'
    },
    '.bw-display-4': {
      'font-size': 'calc(1.475rem + 2.7vw)',
      'font-weight': '300',
      'line-height': '1.2'
    },
    '@media (min-width: 1200px)': {
      '.bw-display-4': { 'font-size': '3.5rem' }
    },
    '.bw-lead': {
      'font-size': '1.25rem',
      'font-weight': '300'
    },
    '.bw-hero-actions': {
      'display': 'flex',
      'gap': '1rem',
      'justify-content': 'center',
      'flex-wrap': 'wrap'
    },
    '.bw-py-3': { 'padding-top': '1rem !important', 'padding-bottom': '1rem !important' },
    '.bw-py-4': { 'padding-top': '1.5rem !important', 'padding-bottom': '1.5rem !important' },
    '.bw-py-5': { 'padding-top': '3rem !important', 'padding-bottom': '3rem !important' },
    '.bw-py-6': { 'padding-top': '4rem !important', 'padding-bottom': '4rem !important' }
  },

  /**
   * Feature grid item styles
   */
  features: {
    '.bw-feature': {
      'padding': '1rem'
    },
    '.bw-feature-icon': {
      'display': 'inline-block',
      'margin-bottom': '1rem'
    },
    '.bw-feature-title': {
      'margin-bottom': '0.5rem'
    },
    '.bw-feature-description': {
      'color': '#6c757d',
      'font-size': '0.9375rem',
      'line-height': '1.6'
    },
    '.bw-feature-grid': {
      'width': '100%'
    },
    '.bw-g-4': {
      '--bw-gutter-x': '1.5rem',
      '--bw-gutter-y': '1.5rem'
    }
  },

  /**
   * Enhanced card styles
   */
  enhancedCards: {
    '.bw-card-hoverable': {
      'transition': 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    },
    '.bw-card-hoverable:hover': {
      'transform': 'translateY(-4px)',
      'box-shadow': '0 1rem 2rem rgba(0,0,0,.15)'
    },
    '.bw-card-img-top': {
      'width': '100%',
      'border-top-left-radius': '7px',
      'border-top-right-radius': '7px'
    },
    '.bw-card-img-bottom': {
      'width': '100%',
      'border-bottom-left-radius': '7px',
      'border-bottom-right-radius': '7px'
    },
    '.bw-card-img-left': {
      'width': '40%',
      'object-fit': 'cover'
    },
    '.bw-card-img-right': {
      'width': '40%',
      'object-fit': 'cover'
    },
    '.bw-card-subtitle, .card-subtitle': {
      'margin-top': '-0.25rem',
      'margin-bottom': '0.5rem',
      'color': '#777',
      'font-size': '0.875rem'
    },
    '.bw-h5': {
      'font-size': '1.25rem'
    },
    '.bw-h6': {
      'font-size': '1rem'
    }
  },

  /**
   * Page section styles
   */
  sections: {
    '.bw-section': {
      'position': 'relative'
    },
    '.bw-section-header': {
      'margin-bottom': '3rem'
    },
    '.bw-section-title': {
      'margin-bottom': '1rem',
      'font-weight': '300',
      'font-size': 'calc(1.325rem + .9vw)'
    },
    '@media (min-width: 1200px)': {
      '.bw-section-title': { 'font-size': '2rem' }
    },
    '.bw-section-subtitle': {
      'font-size': '1.125rem',
      'color': '#6c757d'
    }
  },

  /**
   * Call-to-action section styles
   */
  cta: {
    '.bw-cta': {
      'position': 'relative'
    },
    '.bw-cta-content': {
      'max-width': '48rem',
      'margin': '0 auto'
    },
    '.bw-cta-title': {
      'font-weight': '300'
    },
    '.bw-cta-actions': {
      'display': 'flex',
      'gap': '1rem',
      'justify-content': 'center',
      'flex-wrap': 'wrap'
    },
    '.bw-cta-description': {
      'font-size': '1.125rem',
      'color': '#6c757d',
      'max-width': '36rem',
      'margin-left': 'auto',
      'margin-right': 'auto'
    }
  },

  /**
   * Form check (checkbox/radio) styles
   */
  formChecks: {
    '.bw-form-check': {
      'display': 'flex',
      'align-items': 'center',
      'gap': '0.5rem',
      'min-height': '1.5rem',
      'margin-bottom': '0.25rem'
    },
    '.bw-form-check-input': {
      'width': '1rem',
      'height': '1rem',
      'margin': '0',
      'cursor': 'pointer',
      'flex-shrink': '0',
      'border': '1px solid #adb5bd',
      'border-radius': '0.25rem',
      'appearance': 'auto'
    },
    '.bw-form-check-input:checked': {
      'background-color': '#006666',
      'border-color': '#006666'
    },
    '.bw-form-check-input:focus': {
      'outline': '0',
      'box-shadow': '0 0 0 0.25rem rgba(0, 102, 102, 0.25)'
    },
    '.bw-form-check-input:disabled': {
      'opacity': '0.5',
      'cursor': 'not-allowed'
    },
    '.bw-form-check-label': {
      'cursor': 'pointer',
      'user-select': 'none',
      'font-size': '0.9375rem'
    }
  },

  /**
   * Spinner/loading indicator styles
   */
  spinner: {
    '.bw-spinner-border': {
      'display': 'inline-block',
      'width': '2rem',
      'height': '2rem',
      'vertical-align': '-0.125em',
      'border': '0.25em solid currentcolor',
      'border-right-color': 'transparent',
      'border-radius': '50%',
      'animation': 'bw-spinner-border 0.75s linear infinite'
    },
    '.bw-spinner-border-sm': {
      'width': '1rem',
      'height': '1rem',
      'border-width': '0.2em'
    },
    '.bw-spinner-border-lg': {
      'width': '3rem',
      'height': '3rem',
      'border-width': '0.3em'
    },
    '.bw-spinner-grow': {
      'display': 'inline-block',
      'width': '2rem',
      'height': '2rem',
      'vertical-align': '-0.125em',
      'background-color': 'currentcolor',
      'border-radius': '50%',
      'opacity': '0',
      'animation': 'bw-spinner-grow 0.75s linear infinite'
    },
    '.bw-spinner-grow-sm': {
      'width': '1rem',
      'height': '1rem'
    },
    '.bw-spinner-grow-lg': {
      'width': '3rem',
      'height': '3rem'
    },
    '.bw-spinner-grow-md': {},
    '.bw-spinner-border-md': {},
    '@keyframes bw-spinner-border': {
      '100%': { 'transform': 'rotate(360deg)' }
    },
    '@keyframes bw-spinner-grow': {
      '0%': { 'transform': 'scale(0)' },
      '50%': { 'opacity': '1', 'transform': 'none' }
    },
    '.bw-visually-hidden': {
      'position': 'absolute',
      'width': '1px',
      'height': '1px',
      'padding': '0',
      'margin': '-1px',
      'overflow': 'hidden',
      'clip': 'rect(0, 0, 0, 0)',
      'white-space': 'nowrap',
      'border': '0'
    }
  },

  /**
   * Close button styles
   */
  closeButton: {
    '.bw-close': {
      'display': 'inline-flex',
      'align-items': 'center',
      'justify-content': 'center',
      'width': '1.5rem',
      'height': '1.5rem',
      'padding': '0',
      'font-size': '1.25rem',
      'font-weight': '700',
      'line-height': '1',
      'color': '#000',
      'background': 'transparent',
      'border': '0',
      'border-radius': '0.25rem',
      'opacity': '0.5',
      'cursor': 'pointer'
    },
    '.bw-close:hover': {
      'opacity': '0.75'
    },
    '.bw-close:focus': {
      'opacity': '1',
      'outline': '0',
      'box-shadow': '0 0 0 0.25rem rgba(0, 102, 102, 0.25)'
    }
  },

  /**
   * Stack layout styles
   */
  stacks: {
    '.bw-vstack': {
      'display': 'flex',
      'flex-direction': 'column'
    },
    '.bw-hstack': {
      'display': 'flex',
      'flex-direction': 'row',
      'align-items': 'center'
    },
    '.bw-gap-0': { 'gap': '0' },
    '.bw-gap-1': { 'gap': '0.25rem' },
    '.bw-gap-2': { 'gap': '0.5rem' },
    '.bw-gap-3': { 'gap': '1rem' },
    '.bw-gap-4': { 'gap': '1.5rem' },
    '.bw-gap-5': { 'gap': '3rem' }
  },

  /**
   * Table responsive wrapper
   */
  tableResponsive: {
    '.bw-table-responsive': {
      'overflow-x': 'auto',
      '-webkit-overflow-scrolling': 'touch'
    }
  },

  /**
   * Grid offset classes
   */
  offsets: {
    '.bw-offset-1': { 'margin-left': '8.333333%' },
    '.bw-offset-2': { 'margin-left': '16.666667%' },
    '.bw-offset-3': { 'margin-left': '25%' },
    '.bw-offset-4': { 'margin-left': '33.333333%' },
    '.bw-offset-5': { 'margin-left': '41.666667%' },
    '.bw-offset-6': { 'margin-left': '50%' },
    '.bw-offset-7': { 'margin-left': '58.333333%' },
    '.bw-offset-8': { 'margin-left': '66.666667%' },
    '.bw-offset-9': { 'margin-left': '75%' },
    '.bw-offset-10': { 'margin-left': '83.333333%' },
    '.bw-offset-11': { 'margin-left': '91.666667%' }
  },

  /**
   * Code demo styles
   */
  codeDemo: {
    '.bw-code-demo': {
      'margin-bottom': '2rem'
    },
    '.bw-copy-btn': {
      'position': 'absolute',
      'top': '0.5rem',
      'right': '0.5rem',
      'padding': '0.25rem 0.625rem',
      'font-size': '0.6875rem',
      'background': 'rgba(255,255,255,0.12)',
      'color': '#aaa',
      'border': '1px solid rgba(255,255,255,0.15)',
      'border-radius': '4px',
      'cursor': 'pointer',
      'font-family': 'inherit',
      'transition': 'all 0.15s'
    },
    '.bw-copy-btn:hover': {
      'background': 'rgba(255,255,255,0.2)',
      'color': '#fff'
    },
    '.bw-code-pre': {
      'margin': '0',
      'background': '#1e293b',
      'border': 'none',
      'border-radius': '6px',
      'overflow-x': 'auto'
    },
    '.bw-code-block': {
      'display': 'block',
      'padding': '1.25rem',
      'font-family': '"SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace',
      'font-size': '0.8125rem',
      'line-height': '1.6',
      'color': '#e2e8f0'
    },
    '.bw-code-copy-btn': {
      'position': 'absolute',
      'top': '0.5rem',
      'right': '0.5rem',
      'padding': '0.25rem 0.625rem',
      'font-size': '0.6875rem',
      'background': 'rgba(255,255,255,0.12)',
      'color': '#aaa',
      'border': '1px solid rgba(255,255,255,0.15)',
      'border-radius': '4px',
      'cursor': 'pointer',
      'font-family': 'inherit',
      'transition': 'all 0.15s'
    }
  },

  /**
   * Button group styles
   */
  buttonGroup: {
    '.bw-btn-group, .bw-btn-group-vertical': {
      'position': 'relative',
      'display': 'inline-flex',
      'vertical-align': 'middle'
    },
    '.bw-btn-group > .bw-btn, .bw-btn-group-vertical > .bw-btn': {
      'position': 'relative',
      'flex': '1 1 auto',
      'border-radius': '0',
      'margin-left': '-1px'
    },
    '.bw-btn-group > .bw-btn:first-child': {
      'margin-left': '0',
      'border-top-left-radius': '6px',
      'border-bottom-left-radius': '6px'
    },
    '.bw-btn-group > .bw-btn:last-child': {
      'border-top-right-radius': '6px',
      'border-bottom-right-radius': '6px'
    },
    '.bw-btn-group-vertical': {
      'flex-direction': 'column',
      'align-items': 'flex-start',
      'justify-content': 'center'
    },
    '.bw-btn-group-vertical > .bw-btn': {
      'width': '100%',
      'margin-left': '0',
      'margin-top': '-1px'
    },
    '.bw-btn-group-vertical > .bw-btn:first-child': {
      'margin-top': '0',
      'border-top-left-radius': '6px',
      'border-top-right-radius': '6px',
      'border-bottom-left-radius': '0',
      'border-bottom-right-radius': '0'
    },
    '.bw-btn-group-vertical > .bw-btn:last-child': {
      'border-top-left-radius': '0',
      'border-top-right-radius': '0',
      'border-bottom-left-radius': '6px',
      'border-bottom-right-radius': '6px'
    },
    '.bw-btn-group-sm > .bw-btn': {
      'padding': '0.25rem 0.75rem',
      'font-size': '0.8125rem'
    },
    '.bw-btn-group-lg > .bw-btn': {
      'padding': '0.625rem 1.5rem',
      'font-size': '1rem'
    }
  },

  /**
   * Accordion collapse styles
   */
  accordion: {
    '.bw-accordion': {
      'border-radius': '8px',
      'overflow': 'hidden'
    },
    '.bw-accordion-item': {
      'background-color': '#fff',
      'border': '1px solid #e5e5e5'
    },
    '.bw-accordion-item + .bw-accordion-item': {
      'border-top': '0'
    },
    '.bw-accordion-item:first-child': {
      'border-top-left-radius': '8px',
      'border-top-right-radius': '8px'
    },
    '.bw-accordion-item:last-child': {
      'border-bottom-left-radius': '8px',
      'border-bottom-right-radius': '8px'
    },
    '.bw-accordion-header': {
      'margin': '0'
    },
    '.bw-accordion-button': {
      'position': 'relative',
      'display': 'flex',
      'align-items': 'center',
      'width': '100%',
      'padding': '1rem 1.25rem',
      'font-size': '1rem',
      'font-weight': '500',
      'color': '#1a1a1a',
      'text-align': 'left',
      'background-color': 'transparent',
      'border': '0',
      'overflow-anchor': 'none',
      'cursor': 'pointer',
      'font-family': 'inherit',
      'transition': 'color 0.15s ease-in-out, background-color 0.15s ease-in-out'
    },
    '.bw-accordion-button::after': {
      'flex-shrink': '0',
      'width': '1.25rem',
      'height': '1.25rem',
      'margin-left': 'auto',
      'content': '""',
      'background-image': "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='%23212529'%3e%3cpath fill-rule='evenodd' d='M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z'/%3e%3c/svg%3e\")",
      'background-repeat': 'no-repeat',
      'background-size': '1.25rem',
      'transition': 'transform 0.2s ease-in-out'
    },
    '.bw-accordion-button:not(.bw-collapsed)::after': {
      'transform': 'rotate(-180deg)'
    },
    '.bw-accordion-button:hover': {
      'background-color': 'rgba(0,0,0,0.03)'
    },
    '.bw-accordion-collapse': {
      'max-height': '0',
      'overflow': 'hidden',
      'transition': 'max-height 0.3s ease'
    },
    '.bw-accordion-collapse.bw-collapse-show': {
      'max-height': 'none'
    },
    '.bw-accordion-body': {
      'padding': '1rem 1.25rem'
    }
  },

  /**
   * Modal dialog styles
   */
  modal: {
    '.bw-modal': {
      'display': 'none',
      'position': 'fixed',
      'top': '0',
      'left': '0',
      'width': '100%',
      'height': '100%',
      'z-index': '1050',
      'background-color': 'rgba(0,0,0,0.5)',
      'overflow-x': 'hidden',
      'overflow-y': 'auto',
      'opacity': '0',
      'transition': 'opacity 0.15s linear'
    },
    '.bw-modal.bw-modal-show': {
      'display': 'flex',
      'align-items': 'center',
      'justify-content': 'center',
      'opacity': '1'
    },
    '.bw-modal-dialog': {
      'position': 'relative',
      'width': '100%',
      'max-width': '500px',
      'margin': '1.75rem auto',
      'pointer-events': 'none',
      'transform': 'translateY(-20px)',
      'transition': 'transform 0.2s ease-out'
    },
    '.bw-modal.bw-modal-show .bw-modal-dialog': {
      'transform': 'translateY(0)'
    },
    '.bw-modal-sm': { 'max-width': '300px' },
    '.bw-modal-lg': { 'max-width': '800px' },
    '.bw-modal-xl': { 'max-width': '1140px' },
    '.bw-modal-content': {
      'position': 'relative',
      'display': 'flex',
      'flex-direction': 'column',
      'pointer-events': 'auto',
      'background-color': '#fff',
      'background-clip': 'padding-box',
      'border': '1px solid rgba(0,0,0,0.2)',
      'border-radius': '8px',
      'box-shadow': '0 0.5rem 1rem rgba(0,0,0,0.15)',
      'outline': '0'
    },
    '.bw-modal-header': {
      'display': 'flex',
      'align-items': 'center',
      'justify-content': 'space-between',
      'padding': '1rem 1.5rem',
      'border-bottom': '1px solid #e5e5e5'
    },
    '.bw-modal-title': {
      'margin': '0',
      'font-size': '1.25rem',
      'font-weight': '600',
      'line-height': '1.3'
    },
    '.bw-modal-body': {
      'position': 'relative',
      'flex': '1 1 auto',
      'padding': '1.5rem'
    },
    '.bw-modal-footer': {
      'display': 'flex',
      'flex-wrap': 'wrap',
      'align-items': 'center',
      'justify-content': 'flex-end',
      'padding': '0.75rem 1.5rem',
      'border-top': '1px solid #e5e5e5',
      'gap': '0.5rem'
    }
  },

  /**
   * Toast notification styles
   */
  toast: {
    '.bw-toast-container': {
      'position': 'fixed',
      'z-index': '1080',
      'pointer-events': 'none',
      'display': 'flex',
      'flex-direction': 'column',
      'gap': '0.5rem',
      'padding': '1rem'
    },
    '.bw-toast-container.bw-toast-top-right': { 'top': '0', 'right': '0' },
    '.bw-toast-container.bw-toast-top-left': { 'top': '0', 'left': '0' },
    '.bw-toast-container.bw-toast-bottom-right': { 'bottom': '0', 'right': '0' },
    '.bw-toast-container.bw-toast-bottom-left': { 'bottom': '0', 'left': '0' },
    '.bw-toast-container.bw-toast-top-center': { 'top': '0', 'left': '50%', 'transform': 'translateX(-50%)' },
    '.bw-toast-container.bw-toast-bottom-center': { 'bottom': '0', 'left': '50%', 'transform': 'translateX(-50%)' },
    '.bw-toast': {
      'pointer-events': 'auto',
      'width': '350px',
      'max-width': '100%',
      'background-color': '#fff',
      'background-clip': 'padding-box',
      'border': '1px solid rgba(0,0,0,0.1)',
      'border-radius': '8px',
      'box-shadow': '0 0.5rem 1rem rgba(0,0,0,0.15)',
      'opacity': '0',
      'transform': 'translateY(-10px)',
      'transition': 'opacity 0.3s ease, transform 0.3s ease'
    },
    '.bw-toast.bw-toast-show': {
      'opacity': '1',
      'transform': 'translateY(0)'
    },
    '.bw-toast.bw-toast-hiding': {
      'opacity': '0',
      'transform': 'translateY(-10px)'
    },
    '.bw-toast-header': {
      'display': 'flex',
      'align-items': 'center',
      'justify-content': 'space-between',
      'padding': '0.5rem 0.75rem',
      'border-bottom': '1px solid rgba(0,0,0,0.05)',
      'font-size': '0.875rem'
    },
    '.bw-toast-body': {
      'padding': '0.75rem',
      'font-size': '0.9375rem'
    },
    '.bw-toast-primary': { 'border-left': '4px solid #006666' },
    '.bw-toast-secondary': { 'border-left': '4px solid #6c757d' },
    '.bw-toast-success': { 'border-left': '4px solid #198754' },
    '.bw-toast-danger': { 'border-left': '4px solid #dc3545' },
    '.bw-toast-warning': { 'border-left': '4px solid #ffc107' },
    '.bw-toast-info': { 'border-left': '4px solid #0dcaf0' }
  },

  /**
   * Dropdown menu styles
   */
  dropdown: {
    '.bw-dropdown': {
      'position': 'relative',
      'display': 'inline-block'
    },
    '.bw-dropdown-toggle::after': {
      'display': 'inline-block',
      'margin-left': '0.255em',
      'vertical-align': '0.255em',
      'content': '""',
      'border-top': '0.3em solid',
      'border-right': '0.3em solid transparent',
      'border-bottom': '0',
      'border-left': '0.3em solid transparent'
    },
    '.bw-dropdown-menu': {
      'position': 'absolute',
      'top': '100%',
      'left': '0',
      'z-index': '1000',
      'display': 'none',
      'min-width': '10rem',
      'padding': '0.5rem 0',
      'margin': '0.125rem 0 0',
      'background-color': '#fff',
      'background-clip': 'padding-box',
      'border': '1px solid rgba(0,0,0,0.15)',
      'border-radius': '6px',
      'box-shadow': '0 0.5rem 1rem rgba(0,0,0,0.15)'
    },
    '.bw-dropdown-menu.bw-dropdown-show': {
      'display': 'block'
    },
    '.bw-dropdown-menu-end': {
      'left': 'auto',
      'right': '0'
    },
    '.bw-dropdown-item': {
      'display': 'block',
      'width': '100%',
      'padding': '0.375rem 1rem',
      'clear': 'both',
      'font-weight': '400',
      'color': '#212529',
      'text-align': 'inherit',
      'text-decoration': 'none',
      'white-space': 'nowrap',
      'background-color': 'transparent',
      'border': '0',
      'font-size': '0.9375rem',
      'transition': 'background-color 0.15s, color 0.15s'
    },
    '.bw-dropdown-item:hover': {
      'color': '#1e2125',
      'background-color': '#f8f9fa'
    },
    '.bw-dropdown-item.disabled': {
      'color': '#adb5bd',
      'pointer-events': 'none',
      'background-color': 'transparent'
    },
    '.bw-dropdown-divider': {
      'height': '0',
      'margin': '0.5rem 0',
      'overflow': 'hidden',
      'border-top': '1px solid #e9ecef',
      'opacity': '1'
    }
  },

  /**
   * Toggle switch styles
   */
  formSwitch: {
    '.bw-form-switch': {
      'padding-left': '2.5em'
    },
    '.bw-form-switch .bw-switch-input': {
      'width': '2em',
      'height': '1.125em',
      'margin-left': '-2.5em',
      'border-radius': '2em',
      'appearance': 'none',
      'background-color': '#adb5bd',
      'border': '1px solid #adb5bd',
      'background-image': "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='-4 -4 8 8'%3e%3ccircle r='3' fill='rgba(255,255,255,1)'/%3e%3c/svg%3e\")",
      'background-position': 'left center',
      'background-repeat': 'no-repeat',
      'background-size': 'contain',
      'transition': 'background-position 0.15s ease-in-out, background-color 0.15s ease-in-out',
      'cursor': 'pointer'
    },
    '.bw-form-switch .bw-switch-input:checked': {
      'background-color': '#006666',
      'border-color': '#006666',
      'background-position': 'right center'
    },
    '.bw-form-switch .bw-switch-input:focus': {
      'box-shadow': '0 0 0 0.25rem rgba(0, 102, 102, 0.25)',
      'outline': '0'
    },
    '.bw-form-switch .bw-switch-input:disabled': {
      'opacity': '0.5',
      'cursor': 'not-allowed'
    }
  },

  /**
   * Skeleton loading placeholder styles
   */
  skeleton: {
    '.bw-skeleton': {
      'background-color': '#e9ecef',
      'border-radius': '4px',
      'animation': 'bw-skeleton-pulse 1.5s ease-in-out infinite'
    },
    '.bw-skeleton-text': {
      'height': '1em',
      'margin-bottom': '0.5rem'
    },
    '.bw-skeleton-circle': {
      'border-radius': '50%'
    },
    '.bw-skeleton-rect': {
      'border-radius': '8px'
    },
    '.bw-skeleton-group': {
      'display': 'flex',
      'flex-direction': 'column'
    },
    '@keyframes bw-skeleton-pulse': {
      '0%': { 'opacity': '1' },
      '50%': { 'opacity': '0.4' },
      '100%': { 'opacity': '1' }
    }
  },

  /**
   * Avatar styles
   */
  avatar: {
    '.bw-avatar': {
      'display': 'inline-flex',
      'align-items': 'center',
      'justify-content': 'center',
      'border-radius': '50%',
      'overflow': 'hidden',
      'font-weight': '600',
      'text-transform': 'uppercase',
      'vertical-align': 'middle',
      'object-fit': 'cover'
    },
    '.bw-avatar-sm': {
      'width': '2rem',
      'height': '2rem',
      'font-size': '0.75rem'
    },
    '.bw-avatar-md': {
      'width': '3rem',
      'height': '3rem',
      'font-size': '1rem'
    },
    '.bw-avatar-lg': {
      'width': '4rem',
      'height': '4rem',
      'font-size': '1.25rem'
    },
    '.bw-avatar-xl': {
      'width': '5rem',
      'height': '5rem',
      'font-size': '1.5rem'
    },
    '.bw-avatar-primary': { 'background-color': '#006666', 'color': '#fff' },
    '.bw-avatar-secondary': { 'background-color': '#6c757d', 'color': '#fff' },
    '.bw-avatar-success': { 'background-color': '#198754', 'color': '#fff' },
    '.bw-avatar-danger': { 'background-color': '#dc3545', 'color': '#fff' },
    '.bw-avatar-warning': { 'background-color': '#ffc107', 'color': '#000' },
    '.bw-avatar-info': { 'background-color': '#0dcaf0', 'color': '#000' },
    '.bw-avatar-light': { 'background-color': '#f8f9fa', 'color': '#212529' },
    '.bw-avatar-dark': { 'background-color': '#212529', 'color': '#fff' }
  },

  /**
   * Utility classes
   */
  utilities: {
    // Spacing
    '.bw-m-0': { 'margin': '0 !important' },
    '.bw-m-1': { 'margin': '.25rem !important' },
    '.bw-m-2': { 'margin': '.5rem !important' },
    '.bw-m-3': { 'margin': '1rem !important' },
    '.bw-m-4': { 'margin': '1.5rem !important' },
    '.bw-m-5': { 'margin': '3rem !important' },
    '.bw-m-auto, .m-auto': { 'margin': 'auto !important' },

    '.bw-mt-0': { 'margin-top': '0 !important' },
    '.bw-mt-1': { 'margin-top': '.25rem !important' },
    '.bw-mt-2': { 'margin-top': '.5rem !important' },
    '.bw-mt-3': { 'margin-top': '1rem !important' },
    '.bw-mt-4': { 'margin-top': '1.5rem !important' },
    '.bw-mt-5': { 'margin-top': '3rem !important' },

    '.bw-mb-0': { 'margin-bottom': '0 !important' },
    '.bw-mb-1': { 'margin-bottom': '.25rem !important' },
    '.bw-mb-2': { 'margin-bottom': '.5rem !important' },
    '.bw-mb-3': { 'margin-bottom': '1rem !important' },
    '.bw-mb-4': { 'margin-bottom': '1.5rem !important' },
    '.bw-mb-5': { 'margin-bottom': '3rem !important' },

    '.bw-ms-0': { 'margin-left': '0 !important' },
    '.bw-ms-1': { 'margin-left': '.25rem !important' },
    '.bw-ms-2': { 'margin-left': '.5rem !important' },
    '.bw-ms-3': { 'margin-left': '1rem !important' },
    '.bw-ms-4': { 'margin-left': '1.5rem !important' },
    '.bw-ms-5': { 'margin-left': '3rem !important' },

    '.bw-me-0': { 'margin-right': '0 !important' },
    '.bw-me-1': { 'margin-right': '.25rem !important' },
    '.bw-me-2': { 'margin-right': '.5rem !important' },
    '.bw-me-3': { 'margin-right': '1rem !important' },
    '.bw-me-4': { 'margin-right': '1.5rem !important' },
    '.bw-me-5': { 'margin-right': '3rem !important' },

    '.bw-p-0': { 'padding': '0 !important' },
    '.bw-p-1': { 'padding': '.25rem !important' },
    '.bw-p-2': { 'padding': '.5rem !important' },
    '.bw-p-3': { 'padding': '1rem !important' },
    '.bw-p-4': { 'padding': '1.5rem !important' },
    '.bw-p-5': { 'padding': '3rem !important' },

    '.bw-pt-0, .pt-0': { 'padding-top': '0 !important' },
    '.bw-pt-1, .pt-1': { 'padding-top': '.25rem !important' },
    '.bw-pt-2, .pt-2': { 'padding-top': '.5rem !important' },
    '.bw-pt-3, .pt-3': { 'padding-top': '1rem !important' },
    '.bw-pt-4, .pt-4': { 'padding-top': '1.5rem !important' },
    '.bw-pt-5, .pt-5': { 'padding-top': '3rem !important' },

    '.bw-pb-0, .pb-0': { 'padding-bottom': '0 !important' },
    '.bw-pb-1, .pb-1': { 'padding-bottom': '.25rem !important' },
    '.bw-pb-2, .pb-2': { 'padding-bottom': '.5rem !important' },
    '.bw-pb-3, .pb-3': { 'padding-bottom': '1rem !important' },
    '.bw-pb-4, .pb-4': { 'padding-bottom': '1.5rem !important' },
    '.bw-pb-5, .pb-5': { 'padding-bottom': '3rem !important' },

    '.bw-ps-0, .ps-0': { 'padding-left': '0 !important' },
    '.bw-ps-1, .ps-1': { 'padding-left': '.25rem !important' },
    '.bw-ps-2, .ps-2': { 'padding-left': '.5rem !important' },
    '.bw-ps-3, .ps-3': { 'padding-left': '1rem !important' },
    '.bw-ps-4, .ps-4': { 'padding-left': '1.5rem !important' },
    '.bw-ps-5, .ps-5': { 'padding-left': '3rem !important' },

    '.bw-pe-0, .pe-0': { 'padding-right': '0 !important' },
    '.bw-pe-1, .pe-1': { 'padding-right': '.25rem !important' },
    '.bw-pe-2, .pe-2': { 'padding-right': '.5rem !important' },
    '.bw-pe-3, .pe-3': { 'padding-right': '1rem !important' },
    '.bw-pe-4, .pe-4': { 'padding-right': '1.5rem !important' },
    '.bw-pe-5, .pe-5': { 'padding-right': '3rem !important' },

    // Text alignment
    '.bw-text-left': { 'text-align': 'left' },
    '.bw-text-right': { 'text-align': 'right' },
    '.bw-text-center': { 'text-align': 'center' },

    // Display
    '.bw-d-none': { 'display': 'none' },
    '.bw-d-block': { 'display': 'block' },
    '.bw-d-inline': { 'display': 'inline' },
    '.bw-d-inline-block': { 'display': 'inline-block' },
    '.bw-d-flex': { 'display': 'flex' },

    // Flexbox
    '.bw-justify-content-start, .justify-content-start': { 'justify-content': 'flex-start' },
    '.bw-justify-content-end, .justify-content-end': { 'justify-content': 'flex-end' },
    '.bw-justify-content-center, .justify-content-center': { 'justify-content': 'center' },
    '.bw-justify-content-between, .justify-content-between': { 'justify-content': 'space-between' },
    '.bw-justify-content-around, .justify-content-around': { 'justify-content': 'space-around' },

    '.bw-align-items-start, .align-items-start': { 'align-items': 'flex-start' },
    '.bw-align-items-end, .align-items-end': { 'align-items': 'flex-end' },
    '.bw-align-items-center, .align-items-center': { 'align-items': 'center' },

    // Colors
    '.bw-text-primary': { 'color': '#006666' },
    '.bw-text-secondary': { 'color': '#6c757d' },
    '.bw-text-success': { 'color': '#198754' },
    '.bw-text-danger': { 'color': '#dc3545' },
    '.bw-text-warning': { 'color': '#ffc107' },
    '.bw-text-info': { 'color': '#0dcaf0' },
    '.bw-text-light': { 'color': '#f8f9fa' },
    '.bw-text-dark': { 'color': '#212529' },
    '.bw-text-muted': { 'color': '#6c757d' },

    '.bw-bg-primary': { 'background-color': '#006666' },
    '.bw-bg-secondary': { 'background-color': '#6c757d' },
    '.bw-bg-success': { 'background-color': '#198754' },
    '.bw-bg-danger': { 'background-color': '#dc3545' },
    '.bw-bg-warning': { 'background-color': '#ffc107' },
    '.bw-bg-info': { 'background-color': '#0dcaf0' },
    '.bw-bg-light': { 'background-color': '#f8f9fa' },
    '.bw-bg-dark': { 'background-color': '#212529' },

    // Borders
    '.bw-border': { 'border': '1px solid #dee2e6 !important' },
    '.bw-border-0': { 'border': '0 !important' },
    '.bw-border-top-0, .border-top-0': { 'border-top': '0 !important' },
    '.bw-border-end-0, .border-end-0': { 'border-right': '0 !important' },
    '.bw-border-bottom-0, .border-bottom-0': { 'border-bottom': '0 !important' },
    '.bw-border-start-0, .border-start-0': { 'border-left': '0 !important' },

    '.bw-rounded': { 'border-radius': '.375rem !important' },
    '.bw-rounded-0': { 'border-radius': '0 !important' },
    '.bw-rounded-1, .rounded-1': { 'border-radius': '.25rem !important' },
    '.bw-rounded-2, .rounded-2': { 'border-radius': '.375rem !important' },
    '.bw-rounded-3, .rounded-3': { 'border-radius': '.5rem !important' },
    '.bw-rounded-circle': { 'border-radius': '50% !important' },
    '.bw-rounded-pill, .rounded-pill': { 'border-radius': '50rem !important' },

    // Shadows
    '.bw-shadow': { 'box-shadow': '0 .5rem 1rem rgba(0,0,0,.15) !important' },
    '.bw-shadow-sm': { 'box-shadow': '0 .125rem .25rem rgba(0,0,0,.075) !important' },
    '.bw-shadow-lg': { 'box-shadow': '0 1rem 3rem rgba(0,0,0,.175) !important' },
    '.bw-shadow-none, .shadow-none': { 'box-shadow': 'none !important' },

    // Width/Height
    '.bw-w-25, .w-25': { 'width': '25% !important' },
    '.bw-w-50, .w-50': { 'width': '50% !important' },
    '.bw-w-75, .w-75': { 'width': '75% !important' },
    '.bw-w-100, .w-100': { 'width': '100% !important' },
    '.bw-w-auto, .w-auto': { 'width': 'auto !important' },

    '.bw-h-25, .h-25': { 'height': '25% !important' },
    '.bw-h-50, .h-50': { 'height': '50% !important' },
    '.bw-h-75, .h-75': { 'height': '75% !important' },
    '.bw-h-100, .h-100': { 'height': '100% !important' },
    '.bw-h-auto, .h-auto': { 'height': 'auto !important' },

    '.bw-mw-100, .mw-100': { 'max-width': '100% !important' },
    '.bw-mh-100, .mh-100': { 'max-height': '100% !important' },

    // Positioning
    '.bw-position-static, .position-static': { 'position': 'static !important' },
    '.bw-position-relative, .position-relative': { 'position': 'relative !important' },
    '.bw-position-absolute, .position-absolute': { 'position': 'absolute !important' },
    '.bw-position-fixed, .position-fixed': { 'position': 'fixed !important' },
    '.bw-position-sticky, .position-sticky': { 'position': 'sticky !important' },

    '.bw-top-0, .top-0': { 'top': '0 !important' },
    '.bw-top-50, .top-50': { 'top': '50% !important' },
    '.bw-top-100, .top-100': { 'top': '100% !important' },
    '.bw-bottom-0, .bottom-0': { 'bottom': '0 !important' },
    '.bw-bottom-50, .bottom-50': { 'bottom': '50% !important' },
    '.bw-bottom-100, .bottom-100': { 'bottom': '100% !important' },
    '.bw-start-0, .start-0': { 'left': '0 !important' },
    '.bw-start-50, .start-50': { 'left': '50% !important' },
    '.bw-start-100, .start-100': { 'left': '100% !important' },
    '.bw-end-0, .end-0': { 'right': '0 !important' },
    '.bw-end-50, .end-50': { 'right': '50% !important' },
    '.bw-end-100, .end-100': { 'right': '100% !important' },

    '.translate-middle': { 'transform': 'translate(-50%, -50%) !important' },

    // Overflow
    '.bw-overflow-auto, .overflow-auto': { 'overflow': 'auto !important' },
    '.bw-overflow-hidden, .overflow-hidden': { 'overflow': 'hidden !important' },
    '.bw-overflow-visible, .overflow-visible': { 'overflow': 'visible !important' },
    '.bw-overflow-scroll, .overflow-scroll': { 'overflow': 'scroll !important' },

    // Typography utilities
    '.fs-1': { 'font-size': 'calc(1.375rem + 1.5vw) !important' },
    '.fs-2': { 'font-size': 'calc(1.325rem + .9vw) !important' },
    '.fs-3': { 'font-size': 'calc(1.3rem + .6vw) !important' },
    '.fs-4': { 'font-size': 'calc(1.275rem + .3vw) !important' },
    '.fs-5': { 'font-size': '1.25rem !important' },
    '.fs-6': { 'font-size': '1rem !important' },

    '.fw-light': { 'font-weight': '300 !important' },
    '.fw-lighter': { 'font-weight': 'lighter !important' },
    '.fw-normal': { 'font-weight': '400 !important' },
    '.fw-bold': { 'font-weight': '700 !important' },
    '.fw-bolder': { 'font-weight': 'bolder !important' },

    '.fst-italic': { 'font-style': 'italic !important' },
    '.fst-normal': { 'font-style': 'normal !important' },

    '.text-decoration-none': { 'text-decoration': 'none !important' },
    '.text-decoration-underline': { 'text-decoration': 'underline !important' },
    '.text-decoration-line-through': { 'text-decoration': 'line-through !important' },

    '.text-lowercase': { 'text-transform': 'lowercase !important' },
    '.text-uppercase': { 'text-transform': 'uppercase !important' },
    '.text-capitalize': { 'text-transform': 'capitalize !important' },

    '.text-wrap': { 'white-space': 'normal !important' },
    '.text-nowrap': { 'white-space': 'nowrap !important' },

    // List utilities
    '.list-unstyled': {
      'padding-left': '0',
      'list-style': 'none'
    },

    '.list-inline': {
      'padding-left': '0',
      'list-style': 'none'
    },

    '.list-inline-item': {
      'display': 'inline-block'
    },

    '.list-inline-item:not(:last-child)': {
      'margin-right': '.5rem'
    },

    // Visibility
    '.bw-visible, .visible': { 'visibility': 'visible !important' },
    '.bw-invisible, .invisible': { 'visibility': 'hidden !important' },

    // User select
    '.bw-user-select-all, .user-select-all': { 'user-select': 'all !important' },
    '.bw-user-select-auto, .user-select-auto': { 'user-select': 'auto !important' },
    '.bw-user-select-none, .user-select-none': { 'user-select': 'none !important' },

    // Pointer events
    '.pe-none': { 'pointer-events': 'none !important' },
    '.pe-auto': { 'pointer-events': 'auto !important' },

    // Opacity
    '.opacity-0': { 'opacity': '0 !important' },
    '.opacity-25': { 'opacity': '.25 !important' },
    '.opacity-50': { 'opacity': '.5 !important' },
    '.opacity-75': { 'opacity': '.75 !important' },
    '.opacity-100': { 'opacity': '1 !important' }
  },

  /**
   * Responsive grid columns
   */
  responsive: {
    '@media (min-width: 576px)': {
      '.bw-col-sm-1': { 'flex': '0 0 8.333333%', 'max-width': '8.333333%' },
      '.bw-col-sm-2': { 'flex': '0 0 16.666667%', 'max-width': '16.666667%' },
      '.bw-col-sm-3': { 'flex': '0 0 25%', 'max-width': '25%' },
      '.bw-col-sm-4': { 'flex': '0 0 33.333333%', 'max-width': '33.333333%' },
      '.bw-col-sm-5': { 'flex': '0 0 41.666667%', 'max-width': '41.666667%' },
      '.bw-col-sm-6': { 'flex': '0 0 50%', 'max-width': '50%' },
      '.bw-col-sm-7': { 'flex': '0 0 58.333333%', 'max-width': '58.333333%' },
      '.bw-col-sm-8': { 'flex': '0 0 66.666667%', 'max-width': '66.666667%' },
      '.bw-col-sm-9': { 'flex': '0 0 75%', 'max-width': '75%' },
      '.bw-col-sm-10': { 'flex': '0 0 83.333333%', 'max-width': '83.333333%' },
      '.bw-col-sm-11': { 'flex': '0 0 91.666667%', 'max-width': '91.666667%' },
      '.bw-col-sm-12': { 'flex': '0 0 100%', 'max-width': '100%' }
    },
    '@media (min-width: 768px)': {
      '.bw-col-md-1': { 'flex': '0 0 8.333333%', 'max-width': '8.333333%' },
      '.bw-col-md-2': { 'flex': '0 0 16.666667%', 'max-width': '16.666667%' },
      '.bw-col-md-3': { 'flex': '0 0 25%', 'max-width': '25%' },
      '.bw-col-md-4': { 'flex': '0 0 33.333333%', 'max-width': '33.333333%' },
      '.bw-col-md-5': { 'flex': '0 0 41.666667%', 'max-width': '41.666667%' },
      '.bw-col-md-6': { 'flex': '0 0 50%', 'max-width': '50%' },
      '.bw-col-md-7': { 'flex': '0 0 58.333333%', 'max-width': '58.333333%' },
      '.bw-col-md-8': { 'flex': '0 0 66.666667%', 'max-width': '66.666667%' },
      '.bw-col-md-9': { 'flex': '0 0 75%', 'max-width': '75%' },
      '.bw-col-md-10': { 'flex': '0 0 83.333333%', 'max-width': '83.333333%' },
      '.bw-col-md-11': { 'flex': '0 0 91.666667%', 'max-width': '91.666667%' },
      '.bw-col-md-12': { 'flex': '0 0 100%', 'max-width': '100%' }
    },
    '@media (min-width: 992px)': {
      '.bw-col-lg-1': { 'flex': '0 0 8.333333%', 'max-width': '8.333333%' },
      '.bw-col-lg-2': { 'flex': '0 0 16.666667%', 'max-width': '16.666667%' },
      '.bw-col-lg-3': { 'flex': '0 0 25%', 'max-width': '25%' },
      '.bw-col-lg-4': { 'flex': '0 0 33.333333%', 'max-width': '33.333333%' },
      '.bw-col-lg-5': { 'flex': '0 0 41.666667%', 'max-width': '41.666667%' },
      '.bw-col-lg-6': { 'flex': '0 0 50%', 'max-width': '50%' },
      '.bw-col-lg-7': { 'flex': '0 0 58.333333%', 'max-width': '58.333333%' },
      '.bw-col-lg-8': { 'flex': '0 0 66.666667%', 'max-width': '66.666667%' },
      '.bw-col-lg-9': { 'flex': '0 0 75%', 'max-width': '75%' },
      '.bw-col-lg-10': { 'flex': '0 0 83.333333%', 'max-width': '83.333333%' },
      '.bw-col-lg-11': { 'flex': '0 0 91.666667%', 'max-width': '91.666667%' },
      '.bw-col-lg-12': { 'flex': '0 0 100%', 'max-width': '100%' }
    },
    '@media (max-width: 575px)': {
      '.bw-card-img-left, .bw_card-img-left': { 'width': '100%' },
      '.bw-card-img-right, .bw_card-img-right': { 'width': '100%' },
      '.bw-hero, .bw_hero': { 'padding': '2rem 1rem' },
      '.bw-cta-actions, .bw_cta-actions': { 'flex-direction': 'column' },
      '.bw-hstack, .bw_hstack': { 'flex-direction': 'column' },
      '.bw-feature-grid, .bw_feature-grid': { 'grid-template-columns': '1fr' }
    }
  }
};

// =========================================================================
// Structural styles — color-independent layout/behavior CSS
// =========================================================================

/**
 * Structural styles contain only layout, sizing, spacing, and behavior
 * properties. No colors, backgrounds, shadows, or border-colors.
 * These never change with themes.
 *
 * @returns {Object} CSS rules object
 */
export function getStructuralStyles() {
  var rules = {};

  // Reset (structural portion)
  rules['*'] = { 'box-sizing': 'border-box', 'margin': '0', 'padding': '0' };
  rules['html'] = {
    'font-size': '16px', 'line-height': '1.5',
    '-webkit-text-size-adjust': '100%',
    '-webkit-font-smoothing': 'antialiased',
    '-moz-osx-font-smoothing': 'grayscale'
  };
  rules['body'] = {
    'font-family': 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    'font-size': '1rem', 'font-weight': '400', 'line-height': '1.6',
    'margin': '0', 'padding': '0',
    '-webkit-font-smoothing': 'antialiased',
    '-moz-osx-font-smoothing': 'grayscale'
  };
  rules['.bw-page'] = { 'min-height': '100vh', 'display': 'flex', 'flex-direction': 'column' };
  rules['.bw-page-content'] = { 'flex': '1', 'padding': '2rem 0' };
  rules['main'] = { 'display': 'block' };
  rules['hr'] = { 'box-sizing': 'content-box', 'height': '0', 'overflow': 'visible', 'margin': '1rem 0', 'border': '0' };
  rules['hr:not([size])'] = { 'height': '1px' };

  // Typography (structural)
  rules['h1, h2, h3, h4, h5, h6'] = {
    'margin-top': '0', 'margin-bottom': '.5rem', 'font-weight': '600',
    'line-height': '1.25', 'letter-spacing': '-0.01em'
  };
  rules['h1'] = { 'font-size': 'calc(1.375rem + 1.5vw)' };
  rules['h2'] = { 'font-size': 'calc(1.325rem + .9vw)' };
  rules['h3'] = { 'font-size': 'calc(1.3rem + .6vw)' };
  rules['h4'] = { 'font-size': 'calc(1.275rem + .3vw)' };
  rules['h5'] = { 'font-size': '1.25rem' };
  rules['h6'] = { 'font-size': '1rem' };
  rules['p'] = { 'margin-top': '0', 'margin-bottom': '1rem' };
  rules['small'] = { 'font-size': '0.875rem' };
  rules['a'] = { 'text-decoration': 'none', 'transition': 'color 0.15s' };

  // Grid (all structural)
  Object.assign(rules, defaultStyles.grid);

  // Button (structural)
  rules['.bw-btn'] = {
    'display': 'inline-flex', 'align-items': 'center', 'justify-content': 'center',
    'font-weight': '500', 'line-height': '1.5', 'text-align': 'center',
    'text-decoration': 'none', 'vertical-align': 'middle', 'cursor': 'pointer',
    'user-select': 'none', 'border': '1px solid transparent',
    'padding': '0.5rem 1.125rem', 'font-size': '0.875rem', 'font-family': 'inherit',
    'border-radius': '6px', 'transition': 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
    'gap': '0.5rem'
  };
  rules['.bw-btn:hover'] = { 'text-decoration': 'none', 'transform': 'translateY(-1px)' };
  rules['.bw-btn:active'] = { 'transform': 'translateY(0)' };
  rules['.bw-btn:focus-visible'] = { 'outline': '0' };
  rules['.bw-btn:disabled'] = { 'opacity': '0.5', 'cursor': 'not-allowed', 'pointer-events': 'none' };
  rules['.bw-btn-lg'] = { 'padding': '0.625rem 1.5rem', 'font-size': '1rem', 'border-radius': '8px' };
  rules['.bw-btn-sm'] = { 'padding': '0.25rem 0.75rem', 'font-size': '0.8125rem', 'border-radius': '5px' };

  // Card (structural)
  rules['.bw-card'] = {
    'position': 'relative', 'display': 'flex', 'flex-direction': 'column',
    'min-width': '0', 'height': '100%', 'word-wrap': 'break-word',
    'background-clip': 'border-box', 'border': '1px solid transparent',
    'border-radius': '8px', 'transition': 'box-shadow 0.2s cubic-bezier(0.4,0,0.2,1), transform 0.2s cubic-bezier(0.4,0,0.2,1)',
    'margin-bottom': '1.5rem', 'overflow': 'hidden'
  };
  rules['.bw-card-body'] = { 'flex': '1 1 auto', 'padding': '1.25rem 1.5rem' };
  rules['.bw-card-body > *:last-child'] = { 'margin-bottom': '0' };
  rules['.bw-card-title'] = { 'margin-bottom': '0.5rem', 'font-size': '1.125rem', 'font-weight': '600', 'line-height': '1.3' };
  rules['.bw-card-text'] = { 'margin-bottom': '0', 'font-size': '0.9375rem', 'line-height': '1.6' };
  rules['.bw-card-header'] = { 'padding': '0.875rem 1.5rem', 'margin-bottom': '0', 'font-weight': '600', 'font-size': '0.875rem' };
  rules['.bw-card-footer'] = { 'padding': '0.75rem 1.5rem', 'font-size': '0.875rem' };
  rules['.bw-card-hoverable'] = { 'transition': 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' };
  rules['.bw-card-img-top'] = { 'width': '100%', 'border-top-left-radius': '7px', 'border-top-right-radius': '7px' };
  rules['.bw-card-img-bottom'] = { 'width': '100%', 'border-bottom-left-radius': '7px', 'border-bottom-right-radius': '7px' };
  rules['.bw-card-img-left'] = { 'width': '40%', 'object-fit': 'cover' };
  rules['.bw-card-img-right'] = { 'width': '40%', 'object-fit': 'cover' };
  rules['.bw-card-subtitle'] = { 'margin-top': '-0.25rem', 'margin-bottom': '0.5rem', 'font-size': '0.875rem' };

  // Forms (structural)
  rules['.bw-form-control'] = {
    'display': 'block', 'width': '100%', 'padding': '0.5rem 0.875rem',
    'font-size': '0.9375rem', 'font-weight': '400', 'line-height': '1.5',
    'background-clip': 'padding-box', 'appearance': 'none',
    'border': '1px solid transparent', 'border-radius': '6px',
    'transition': 'border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out',
    'font-family': 'inherit'
  };
  rules['.bw-form-control:focus'] = { 'outline': '0' };
  rules['.bw-form-control::placeholder'] = { 'opacity': '1' };
  rules['.bw-form-label'] = { 'display': 'block', 'margin-bottom': '0.375rem', 'font-size': '0.875rem', 'font-weight': '600' };
  rules['.bw-form-group'] = { 'margin-bottom': '1.25rem' };
  rules['.bw-form-text'] = { 'margin-top': '0.25rem', 'font-size': '0.8125rem' };
  rules['select.bw-form-control'] = {
    'padding-right': '2.25rem',
    'background-repeat': 'no-repeat', 'background-position': 'right 0.75rem center',
    'background-size': '16px 12px'
  };
  rules['textarea.bw-form-control'] = { 'min-height': '5rem', 'resize': 'vertical' };

  // Form checks (structural)
  Object.assign(rules, {
    '.bw-form-check': { 'display': 'flex', 'align-items': 'center', 'gap': '0.5rem', 'min-height': '1.5rem', 'margin-bottom': '0.25rem' },
    '.bw-form-check-input': { 'width': '1rem', 'height': '1rem', 'margin': '0', 'cursor': 'pointer', 'flex-shrink': '0', 'border-radius': '0.25rem', 'appearance': 'auto' },
    '.bw-form-check-input:disabled': { 'opacity': '0.5', 'cursor': 'not-allowed' },
    '.bw-form-check-label': { 'cursor': 'pointer', 'user-select': 'none', 'font-size': '0.9375rem' }
  });

  // Navigation (structural)
  rules['.bw-navbar'] = {
    'position': 'relative', 'display': 'flex', 'flex-wrap': 'wrap',
    'align-items': 'center', 'justify-content': 'space-between', 'padding': '0.5rem 1.5rem'
  };
  rules['.bw-navbar > .bw-container, .bw-navbar > .container'] = { 'display': 'flex', 'flex-wrap': 'wrap', 'align-items': 'center', 'justify-content': 'space-between' };
  rules['.bw-navbar-brand'] = {
    'display': 'inline-flex', 'align-items': 'center', 'gap': '0.5rem',
    'padding-top': '0.25rem', 'padding-bottom': '0.25rem', 'margin-right': '1.5rem',
    'font-size': '1.125rem', 'font-weight': '600', 'line-height': 'inherit',
    'white-space': 'nowrap', 'text-decoration': 'none'
  };
  rules['.bw-navbar-nav'] = {
    'display': 'flex', 'flex-direction': 'row', 'padding-left': '0',
    'margin-bottom': '0', 'list-style': 'none', 'gap': '0.25rem'
  };
  rules['.bw-navbar-nav .bw-nav-link'] = {
    'display': 'block', 'padding': '0.5rem 0.875rem', 'text-decoration': 'none',
    'font-size': '0.875rem', 'font-weight': '500', 'border-radius': '6px',
    'transition': 'color 0.15s, background-color 0.15s'
  };

  // Tables (structural)
  rules['.bw-table'] = {
    'width': '100%', 'margin-bottom': '1.5rem', 'vertical-align': 'top',
    'border-collapse': 'collapse', 'font-size': '0.9375rem', 'line-height': '1.5'
  };
  rules['.bw-table > :not(caption) > * > *'] = { 'padding': '0.75rem 1rem' };
  rules['.bw-table > tbody'] = { 'vertical-align': 'inherit' };
  rules['.bw-table > thead'] = { 'vertical-align': 'bottom' };
  rules['.bw-table > thead > tr > *'] = {
    'padding': '0.625rem 1rem', 'font-size': '0.8125rem', 'font-weight': '600',
    'text-transform': 'uppercase', 'letter-spacing': '0.04em'
  };
  rules['.bw-table caption'] = { 'padding': '0.5rem 1rem', 'font-size': '0.875rem', 'caption-side': 'bottom' };
  rules['.bw-table-responsive'] = { 'overflow-x': 'auto', '-webkit-overflow-scrolling': 'touch' };

  // Alerts (structural)
  rules['.bw-alert'] = {
    'position': 'relative', 'padding': '0.875rem 1.25rem', 'margin-bottom': '1rem',
    'border': '1px solid transparent', 'border-radius': '8px',
    'font-size': '0.9375rem', 'line-height': '1.6'
  };
  rules['.bw-alert-heading, .alert-heading'] = { 'color': 'inherit' };
  rules['.bw-alert-link, .alert-link'] = { 'font-weight': '700' };
  rules['.bw-alert-dismissible'] = { 'padding-right': '3rem' };
  rules['.bw-alert-dismissible .btn-close'] = { 'position': 'absolute', 'top': '0', 'right': '0', 'z-index': '2', 'padding': '1.25rem 1rem' };

  // Badges (structural)
  rules['.bw-badge'] = {
    'display': 'inline-block', 'padding': '.4em .75em', 'font-size': '.875em',
    'font-weight': '600', 'line-height': '1.3', 'text-align': 'center',
    'white-space': 'nowrap', 'vertical-align': 'baseline', 'border-radius': '.375rem'
  };
  rules['.bw-badge:empty'] = { 'display': 'none' };
  rules['.bw-badge-sm'] = { 'font-size': '.75em', 'padding': '.25em .5em' };
  rules['.bw-badge-lg'] = { 'font-size': '1em', 'padding': '.5em .9em' };
  rules['.bw-badge-pill'] = { 'border-radius': '50rem' };

  // Progress (structural)
  rules['.bw-progress'] = { 'display': 'flex', 'height': '1.25rem', 'overflow': 'hidden', 'font-size': '.875rem', 'border-radius': '.5rem' };
  rules['.bw-progress-bar'] = {
    'display': 'flex', 'flex-direction': 'column', 'justify-content': 'center',
    'overflow': 'hidden', 'text-align': 'center', 'white-space': 'nowrap',
    'transition': 'width .6s ease', 'font-weight': '600'
  };
  rules['.bw-progress-bar-striped'] = {
    'background-image': 'linear-gradient(45deg,rgba(255,255,255,.15) 25%,transparent 25%,transparent 50%,rgba(255,255,255,.15) 50%,rgba(255,255,255,.15) 75%,transparent 75%,transparent)',
    'background-size': '1rem 1rem'
  };
  rules['.bw-progress-bar-animated'] = { 'animation': 'progress-bar-stripes 1s linear infinite' };
  rules['@keyframes progress-bar-stripes'] = { '0%': { 'background-position-x': '1rem' } };

  // Tabs (structural)
  rules['.bw-nav'] = { 'display': 'flex', 'flex-wrap': 'wrap', 'padding-left': '0', 'margin-bottom': '0', 'list-style': 'none', 'gap': '0' };
  rules['.bw-nav-item'] = { 'display': 'block' };
  rules['.bw-nav-tabs .bw-nav-item'] = { 'margin-bottom': '-2px' };
  rules['.bw-nav-link'] = {
    'display': 'block', 'padding': '0.625rem 1rem', 'font-size': '0.875rem',
    'font-weight': '500', 'text-decoration': 'none', 'cursor': 'pointer',
    'border': 'none', 'background': 'transparent',
    'transition': 'color 0.15s, border-color 0.15s', 'font-family': 'inherit'
  };
  rules['.bw-nav-tabs .bw-nav-link'] = { 'border': 'none', 'border-bottom': '2px solid transparent', 'border-radius': '0', 'background-color': 'transparent' };
  rules['.bw-nav-pills .bw-nav-link'] = { 'border-radius': '6px' };
  rules['.bw-nav-vertical'] = { 'flex-direction': 'column' };
  rules['.bw-tab-content'] = { 'padding': '1.25rem 0' };
  rules['.bw-tab-pane'] = { 'display': 'none' };
  rules['.bw-tab-pane.active'] = { 'display': 'block' };

  // List groups (structural)
  rules['.bw-list-group'] = { 'display': 'flex', 'flex-direction': 'column', 'padding-left': '0', 'margin-bottom': '0', 'border-radius': '0.375rem' };
  rules['.bw-list-group-item'] = { 'position': 'relative', 'display': 'block', 'padding': '0.75rem 1.25rem', 'text-decoration': 'none', 'font-size': '0.9375rem' };
  rules['.bw-list-group-item:first-child'] = { 'border-top-left-radius': 'inherit', 'border-top-right-radius': 'inherit' };
  rules['.bw-list-group-item:last-child'] = { 'border-bottom-right-radius': 'inherit', 'border-bottom-left-radius': 'inherit' };
  rules['.bw-list-group-item + .bw-list-group-item'] = { 'border-top-width': '0' };
  rules['.bw-list-group-item.disabled'] = { 'pointer-events': 'none' };
  rules['a.bw-list-group-item'] = { 'cursor': 'pointer' };
  rules['.bw-list-group-flush'] = { 'border-radius': '0' };
  rules['.bw-list-group-flush > .bw-list-group-item'] = { 'border-width': '0 0 1px', 'border-radius': '0' };
  rules['.bw-list-group-flush > .bw-list-group-item:last-child'] = { 'border-bottom-width': '0' };

  // Pagination (structural)
  rules['.bw-pagination'] = { 'display': 'flex', 'padding-left': '0', 'list-style': 'none', 'margin-bottom': '0' };
  rules['.bw-page-item'] = { 'display': 'list-item', 'list-style': 'none' };
  rules['.bw-page-link'] = {
    'position': 'relative', 'display': 'block', 'padding': '0.375rem 0.75rem',
    'margin-left': '-1px', 'line-height': '1.25', 'text-decoration': 'none',
    'transition': 'color 0.15s ease-in-out, background-color 0.15s ease-in-out, border-color 0.15s ease-in-out'
  };
  rules['.bw-page-item:first-child .bw-page-link'] = { 'margin-left': '0', 'border-top-left-radius': '0.375rem', 'border-bottom-left-radius': '0.375rem' };
  rules['.bw-page-item:last-child .bw-page-link'] = { 'border-top-right-radius': '0.375rem', 'border-bottom-right-radius': '0.375rem' };

  // Breadcrumb (structural)
  rules['.bw-breadcrumb'] = { 'display': 'flex', 'flex-wrap': 'wrap', 'padding': '0 0', 'margin-bottom': '1rem', 'list-style': 'none' };
  rules['.bw-breadcrumb-item'] = { 'display': 'flex' };
  rules['.bw-breadcrumb-item + .bw-breadcrumb-item'] = { 'padding-left': '0.5rem' };
  rules['.bw-breadcrumb-item + .bw-breadcrumb-item::before'] = { 'float': 'left', 'padding-right': '0.5rem', 'content': '"/"' };

  // Hero (structural)
  rules['.bw-hero'] = { 'position': 'relative', 'overflow': 'hidden' };
  rules['.bw-hero-overlay'] = { 'position': 'absolute', 'top': '0', 'left': '0', 'right': '0', 'bottom': '0', 'z-index': '1' };
  rules['.bw-hero-content'] = { 'position': 'relative', 'z-index': '2' };
  rules['.bw-hero-title'] = { 'font-weight': '300', 'letter-spacing': '-0.05rem', 'color': 'inherit' };
  rules['.bw-hero-subtitle'] = { 'color': 'inherit' };
  rules['.bw-hero-actions'] = { 'display': 'flex', 'gap': '1rem', 'justify-content': 'center', 'flex-wrap': 'wrap' };
  rules['.bw-display-4'] = { 'font-size': 'calc(1.475rem + 2.7vw)', 'font-weight': '300', 'line-height': '1.2' };
  rules['.bw-lead'] = { 'font-size': '1.25rem', 'font-weight': '300' };

  // Features (structural)
  rules['.bw-feature'] = { 'padding': '1rem' };
  rules['.bw-feature-icon'] = { 'display': 'inline-block', 'margin-bottom': '1rem' };
  rules['.bw-feature-title'] = { 'margin-bottom': '0.5rem' };
  rules['.bw-feature-grid'] = { 'width': '100%' };
  rules['.bw-g-4'] = { '--bw-gutter-x': '1.5rem', '--bw-gutter-y': '1.5rem' };

  // Sections (structural)
  rules['.bw-section'] = { 'position': 'relative' };
  rules['.bw-section-header'] = { 'margin-bottom': '3rem' };
  rules['.bw-section-title'] = { 'margin-bottom': '1rem', 'font-weight': '300', 'font-size': 'calc(1.325rem + .9vw)' };

  // CTA (structural)
  rules['.bw-cta'] = { 'position': 'relative' };
  rules['.bw-cta-content'] = { 'max-width': '48rem', 'margin': '0 auto' };
  rules['.bw-cta-title'] = { 'font-weight': '300' };
  rules['.bw-cta-actions'] = { 'display': 'flex', 'gap': '1rem', 'justify-content': 'center', 'flex-wrap': 'wrap' };

  // Spinner (structural)
  rules['.bw-spinner-border'] = {
    'display': 'inline-block', 'width': '2rem', 'height': '2rem',
    'vertical-align': '-0.125em', 'border': '0.25em solid currentcolor',
    'border-right-color': 'transparent', 'border-radius': '50%',
    'animation': 'bw-spinner-border 0.75s linear infinite'
  };
  rules['.bw-spinner-border-sm'] = { 'width': '1rem', 'height': '1rem', 'border-width': '0.2em' };
  rules['.bw-spinner-border-lg'] = { 'width': '3rem', 'height': '3rem', 'border-width': '0.3em' };
  rules['.bw-spinner-grow'] = {
    'display': 'inline-block', 'width': '2rem', 'height': '2rem',
    'vertical-align': '-0.125em', 'border-radius': '50%', 'opacity': '0',
    'animation': 'bw-spinner-grow 0.75s linear infinite'
  };
  rules['.bw-spinner-grow-sm'] = { 'width': '1rem', 'height': '1rem' };
  rules['.bw-spinner-grow-lg'] = { 'width': '3rem', 'height': '3rem' };
  rules['@keyframes bw-spinner-border'] = { '100%': { 'transform': 'rotate(360deg)' } };
  rules['@keyframes bw-spinner-grow'] = { '0%': { 'transform': 'scale(0)' }, '50%': { 'opacity': '1', 'transform': 'none' } };
  rules['.bw-visually-hidden'] = {
    'position': 'absolute', 'width': '1px', 'height': '1px', 'padding': '0',
    'margin': '-1px', 'overflow': 'hidden', 'clip': 'rect(0, 0, 0, 0)',
    'white-space': 'nowrap', 'border': '0'
  };

  // Close button (structural)
  rules['.bw-close'] = {
    'display': 'inline-flex', 'align-items': 'center', 'justify-content': 'center',
    'width': '1.5rem', 'height': '1.5rem', 'padding': '0',
    'font-size': '1.25rem', 'font-weight': '700', 'line-height': '1',
    'background': 'transparent', 'border': '0', 'border-radius': '0.25rem',
    'cursor': 'pointer'
  };

  // Stacks (structural)
  rules['.bw-vstack'] = { 'display': 'flex', 'flex-direction': 'column' };
  rules['.bw-hstack'] = { 'display': 'flex', 'flex-direction': 'row', 'align-items': 'center' };
  rules['.bw-gap-0'] = { 'gap': '0' };
  rules['.bw-gap-1'] = { 'gap': '0.25rem' };
  rules['.bw-gap-2'] = { 'gap': '0.5rem' };
  rules['.bw-gap-3'] = { 'gap': '1rem' };
  rules['.bw-gap-4'] = { 'gap': '1.5rem' };
  rules['.bw-gap-5'] = { 'gap': '3rem' };

  // Offsets (structural)
  for (var i = 1; i <= 11; i++) {
    rules['.bw-offset-' + i] = { 'margin-left': ((i / 12) * 100).toFixed(6).replace(/\.?0+$/, '') + '%' };
  }

  // Code demo (structural)
  rules['.bw-code-demo'] = { 'margin-bottom': '2rem' };
  rules['.bw-code-pre'] = { 'margin': '0', 'border': 'none', 'border-radius': '6px', 'overflow-x': 'auto' };
  rules['.bw-code-block'] = { 'display': 'block', 'padding': '1.25rem', 'font-family': '"SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace', 'font-size': '0.8125rem', 'line-height': '1.6' };
  rules['.bw-code-copy-btn'] = { 'position': 'absolute', 'top': '0.5rem', 'right': '0.5rem', 'padding': '0.25rem 0.625rem', 'font-size': '0.6875rem', 'border-radius': '4px', 'cursor': 'pointer', 'font-family': 'inherit', 'transition': 'all 0.15s' };

  // Button group (structural)
  rules['.bw-btn-group, .bw-btn-group-vertical'] = { 'position': 'relative', 'display': 'inline-flex', 'vertical-align': 'middle' };
  rules['.bw-btn-group > .bw-btn, .bw-btn-group-vertical > .bw-btn'] = { 'position': 'relative', 'flex': '1 1 auto', 'border-radius': '0', 'margin-left': '-1px' };
  rules['.bw-btn-group > .bw-btn:first-child'] = { 'margin-left': '0', 'border-top-left-radius': '6px', 'border-bottom-left-radius': '6px' };
  rules['.bw-btn-group > .bw-btn:last-child'] = { 'border-top-right-radius': '6px', 'border-bottom-right-radius': '6px' };
  rules['.bw-btn-group-vertical'] = { 'flex-direction': 'column', 'align-items': 'flex-start', 'justify-content': 'center' };
  rules['.bw-btn-group-vertical > .bw-btn'] = { 'width': '100%', 'margin-left': '0', 'margin-top': '-1px' };
  rules['.bw-btn-group-vertical > .bw-btn:first-child'] = { 'margin-top': '0', 'border-top-left-radius': '6px', 'border-top-right-radius': '6px', 'border-bottom-left-radius': '0', 'border-bottom-right-radius': '0' };
  rules['.bw-btn-group-vertical > .bw-btn:last-child'] = { 'border-top-left-radius': '0', 'border-top-right-radius': '0', 'border-bottom-left-radius': '6px', 'border-bottom-right-radius': '6px' };

  // Accordion (structural)
  rules['.bw-accordion'] = { 'border-radius': '8px', 'overflow': 'hidden' };
  rules['.bw-accordion-item'] = { 'border': '1px solid transparent' };
  rules['.bw-accordion-item + .bw-accordion-item'] = { 'border-top': '0' };
  rules['.bw-accordion-header'] = { 'margin': '0' };
  rules['.bw-accordion-button'] = {
    'position': 'relative', 'display': 'flex', 'align-items': 'center', 'width': '100%',
    'padding': '1rem 1.25rem', 'font-size': '1rem', 'font-weight': '500', 'text-align': 'left',
    'background-color': 'transparent', 'border': '0', 'overflow-anchor': 'none', 'cursor': 'pointer',
    'font-family': 'inherit', 'transition': 'color 0.15s ease-in-out, background-color 0.15s ease-in-out'
  };
  rules['.bw-accordion-button::after'] = {
    'flex-shrink': '0', 'width': '1.25rem', 'height': '1.25rem', 'margin-left': 'auto',
    'content': '""', 'background-repeat': 'no-repeat', 'background-size': '1.25rem',
    'transition': 'transform 0.2s ease-in-out'
  };
  rules['.bw-accordion-button:not(.bw-collapsed)::after'] = { 'transform': 'rotate(-180deg)' };
  rules['.bw-accordion-collapse'] = { 'max-height': '0', 'overflow': 'hidden', 'transition': 'max-height 0.3s ease' };
  rules['.bw-accordion-collapse.bw-collapse-show'] = { 'max-height': 'none' };
  rules['.bw-accordion-body'] = { 'padding': '1rem 1.25rem' };

  // Modal (structural)
  rules['.bw-modal'] = {
    'display': 'none', 'position': 'fixed', 'top': '0', 'left': '0', 'width': '100%', 'height': '100%',
    'z-index': '1050', 'overflow-x': 'hidden', 'overflow-y': 'auto', 'opacity': '0', 'transition': 'opacity 0.15s linear'
  };
  rules['.bw-modal.bw-modal-show'] = { 'display': 'flex', 'align-items': 'center', 'justify-content': 'center', 'opacity': '1' };
  rules['.bw-modal-dialog'] = {
    'position': 'relative', 'width': '100%', 'max-width': '500px', 'margin': '1.75rem auto',
    'pointer-events': 'none', 'transform': 'translateY(-20px)', 'transition': 'transform 0.2s ease-out'
  };
  rules['.bw-modal.bw-modal-show .bw-modal-dialog'] = { 'transform': 'translateY(0)' };
  rules['.bw-modal-sm'] = { 'max-width': '300px' };
  rules['.bw-modal-lg'] = { 'max-width': '800px' };
  rules['.bw-modal-xl'] = { 'max-width': '1140px' };
  rules['.bw-modal-content'] = {
    'position': 'relative', 'display': 'flex', 'flex-direction': 'column', 'pointer-events': 'auto',
    'background-clip': 'padding-box', 'border': '1px solid transparent', 'border-radius': '8px', 'outline': '0'
  };
  rules['.bw-modal-header'] = { 'display': 'flex', 'align-items': 'center', 'justify-content': 'space-between', 'padding': '1rem 1.5rem' };
  rules['.bw-modal-title'] = { 'margin': '0', 'font-size': '1.25rem', 'font-weight': '600', 'line-height': '1.3' };
  rules['.bw-modal-body'] = { 'position': 'relative', 'flex': '1 1 auto', 'padding': '1.5rem' };
  rules['.bw-modal-footer'] = { 'display': 'flex', 'flex-wrap': 'wrap', 'align-items': 'center', 'justify-content': 'flex-end', 'padding': '0.75rem 1.5rem', 'gap': '0.5rem' };

  // Toast (structural)
  rules['.bw-toast-container'] = {
    'position': 'fixed', 'z-index': '1080', 'pointer-events': 'none',
    'display': 'flex', 'flex-direction': 'column', 'gap': '0.5rem', 'padding': '1rem'
  };
  rules['.bw-toast'] = {
    'pointer-events': 'auto', 'width': '350px', 'max-width': '100%', 'background-clip': 'padding-box',
    'border-radius': '8px', 'opacity': '0', 'transform': 'translateY(-10px)',
    'transition': 'opacity 0.3s ease, transform 0.3s ease'
  };
  rules['.bw-toast.bw-toast-show'] = { 'opacity': '1', 'transform': 'translateY(0)' };
  rules['.bw-toast.bw-toast-hiding'] = { 'opacity': '0', 'transform': 'translateY(-10px)' };
  rules['.bw-toast-header'] = { 'display': 'flex', 'align-items': 'center', 'justify-content': 'space-between', 'padding': '0.5rem 0.75rem', 'font-size': '0.875rem' };
  rules['.bw-toast-body'] = { 'padding': '0.75rem', 'font-size': '0.9375rem' };

  // Dropdown (structural)
  rules['.bw-dropdown'] = { 'position': 'relative', 'display': 'inline-block' };
  rules['.bw-dropdown-toggle::after'] = {
    'display': 'inline-block', 'margin-left': '0.255em', 'vertical-align': '0.255em',
    'content': '""', 'border-top': '0.3em solid', 'border-right': '0.3em solid transparent',
    'border-bottom': '0', 'border-left': '0.3em solid transparent'
  };
  rules['.bw-dropdown-menu'] = {
    'position': 'absolute', 'top': '100%', 'left': '0', 'z-index': '1000', 'display': 'none',
    'min-width': '10rem', 'padding': '0.5rem 0', 'margin': '0.125rem 0 0',
    'background-clip': 'padding-box', 'border-radius': '6px'
  };
  rules['.bw-dropdown-menu.bw-dropdown-show'] = { 'display': 'block' };
  rules['.bw-dropdown-menu-end'] = { 'left': 'auto', 'right': '0' };
  rules['.bw-dropdown-item'] = {
    'display': 'block', 'width': '100%', 'padding': '0.375rem 1rem', 'clear': 'both',
    'font-weight': '400', 'text-align': 'inherit', 'text-decoration': 'none', 'white-space': 'nowrap',
    'background-color': 'transparent', 'border': '0', 'font-size': '0.9375rem',
    'transition': 'background-color 0.15s, color 0.15s'
  };
  rules['.bw-dropdown-divider'] = { 'height': '0', 'margin': '0.5rem 0', 'overflow': 'hidden', 'opacity': '1' };

  // Switch (structural)
  rules['.bw-form-switch'] = { 'padding-left': '2.5em' };
  rules['.bw-form-switch .bw-switch-input'] = {
    'width': '2em', 'height': '1.125em', 'margin-left': '-2.5em', 'border-radius': '2em',
    'appearance': 'none', 'background-position': 'left center', 'background-repeat': 'no-repeat',
    'background-size': 'contain', 'transition': 'background-position 0.15s ease-in-out, background-color 0.15s ease-in-out',
    'cursor': 'pointer'
  };
  rules['.bw-form-switch .bw-switch-input:checked'] = { 'background-position': 'right center' };
  rules['.bw-form-switch .bw-switch-input:disabled'] = { 'opacity': '0.5', 'cursor': 'not-allowed' };

  // Skeleton (structural)
  rules['.bw-skeleton'] = { 'border-radius': '4px', 'animation': 'bw-skeleton-pulse 1.5s ease-in-out infinite' };
  rules['.bw-skeleton-text'] = { 'height': '1em', 'margin-bottom': '0.5rem' };
  rules['.bw-skeleton-circle'] = { 'border-radius': '50%' };
  rules['.bw-skeleton-rect'] = { 'border-radius': '8px' };
  rules['.bw-skeleton-group'] = { 'display': 'flex', 'flex-direction': 'column' };
  rules['@keyframes bw-skeleton-pulse'] = { '0%': { 'opacity': '1' }, '50%': { 'opacity': '0.4' }, '100%': { 'opacity': '1' } };

  // Avatar (structural)
  rules['.bw-avatar'] = {
    'display': 'inline-flex', 'align-items': 'center', 'justify-content': 'center',
    'border-radius': '50%', 'overflow': 'hidden', 'font-weight': '600',
    'text-transform': 'uppercase', 'vertical-align': 'middle', 'object-fit': 'cover'
  };
  rules['.bw-avatar-sm'] = { 'width': '2rem', 'height': '2rem', 'font-size': '0.75rem' };
  rules['.bw-avatar-md'] = { 'width': '3rem', 'height': '3rem', 'font-size': '1rem' };
  rules['.bw-avatar-lg'] = { 'width': '4rem', 'height': '4rem', 'font-size': '1.25rem' };
  rules['.bw-avatar-xl'] = { 'width': '5rem', 'height': '5rem', 'font-size': '1.5rem' };

  // Spacing utilities (structural)
  var spacingValues = { '0': '0', '1': '.25rem', '2': '.5rem', '3': '1rem', '4': '1.5rem', '5': '3rem' };
  for (var k in spacingValues) {
    var v = spacingValues[k];
    rules['.bw-m-' + k] = { 'margin': v + ' !important' };
    rules['.bw-mt-' + k] = { 'margin-top': v + ' !important' };
    rules['.bw-mb-' + k] = { 'margin-bottom': v + ' !important' };
    rules['.bw-ms-' + k] = { 'margin-left': v + ' !important' };
    rules['.bw-me-' + k] = { 'margin-right': v + ' !important' };
    rules['.bw-p-' + k] = { 'padding': v + ' !important' };
    rules['.bw-pt-' + k + ', .pt-' + k] = { 'padding-top': v + ' !important' };
    rules['.bw-pb-' + k + ', .pb-' + k] = { 'padding-bottom': v + ' !important' };
    rules['.bw-ps-' + k + ', .ps-' + k] = { 'padding-left': v + ' !important' };
    rules['.bw-pe-' + k + ', .pe-' + k] = { 'padding-right': v + ' !important' };
  }
  rules['.bw-m-auto, .m-auto'] = { 'margin': 'auto !important' };
  rules['.bw-py-3'] = { 'padding-top': '1rem !important', 'padding-bottom': '1rem !important' };
  rules['.bw-py-4'] = { 'padding-top': '1.5rem !important', 'padding-bottom': '1.5rem !important' };
  rules['.bw-py-5'] = { 'padding-top': '3rem !important', 'padding-bottom': '3rem !important' };
  rules['.bw-py-6'] = { 'padding-top': '4rem !important', 'padding-bottom': '4rem !important' };

  // Display utilities (structural)
  rules['.bw-d-none'] = { 'display': 'none' };
  rules['.bw-d-block'] = { 'display': 'block' };
  rules['.bw-d-inline'] = { 'display': 'inline' };
  rules['.bw-d-inline-block'] = { 'display': 'inline-block' };
  rules['.bw-d-flex'] = { 'display': 'flex' };
  rules['.bw-text-left'] = { 'text-align': 'left' };
  rules['.bw-text-right'] = { 'text-align': 'right' };
  rules['.bw-text-center'] = { 'text-align': 'center' };

  // Flexbox utilities (structural)
  var jc = { start: 'flex-start', end: 'flex-end', center: 'center', between: 'space-between', around: 'space-around' };
  for (var jk in jc) {
    rules['.bw-justify-content-' + jk + ', .justify-content-' + jk] = { 'justify-content': jc[jk] };
  }
  var ai = { start: 'flex-start', end: 'flex-end', center: 'center' };
  for (var ak in ai) {
    rules['.bw-align-items-' + ak + ', .align-items-' + ak] = { 'align-items': ai[ak] };
  }

  // Size utilities (structural)
  ['25', '50', '75', '100'].forEach(function(n) {
    rules['.bw-w-' + n + ', .w-' + n] = { 'width': n + '% !important' };
    rules['.bw-h-' + n + ', .h-' + n] = { 'height': n + '% !important' };
  });
  rules['.bw-w-auto, .w-auto'] = { 'width': 'auto !important' };
  rules['.bw-h-auto, .h-auto'] = { 'height': 'auto !important' };
  rules['.bw-mw-100, .mw-100'] = { 'max-width': '100% !important' };
  rules['.bw-mh-100, .mh-100'] = { 'max-height': '100% !important' };

  // Position utilities (structural)
  ['static', 'relative', 'absolute', 'fixed', 'sticky'].forEach(function(p) {
    rules['.bw-position-' + p + ', .position-' + p] = { 'position': p + ' !important' };
  });
  rules['.bw-translate-middle, .translate-middle'] = { 'transform': 'translate(-50%, -50%) !important' };

  // Overflow utilities (structural)
  ['auto', 'hidden', 'visible', 'scroll'].forEach(function(o) {
    rules['.bw-overflow-' + o + ', .overflow-' + o] = { 'overflow': o + ' !important' };
  });

  // Visibility utilities (structural)
  rules['.bw-visible, .visible'] = { 'visibility': 'visible !important' };
  rules['.bw-invisible, .invisible'] = { 'visibility': 'hidden !important' };

  // User select utilities (structural)
  ['all', 'auto', 'none'].forEach(function(u) {
    rules['.bw-user-select-' + u + ', .user-select-' + u] = { 'user-select': u + ' !important' };
  });

  // Pointer events
  rules['.pe-none'] = { 'pointer-events': 'none !important' };
  rules['.pe-auto'] = { 'pointer-events': 'auto !important' };

  // Typography utilities (structural)
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

  // Font-size utilities (structural)
  rules['.fs-1'] = { 'font-size': 'calc(1.375rem + 1.5vw) !important' };
  rules['.fs-2'] = { 'font-size': 'calc(1.325rem + .9vw) !important' };
  rules['.fs-3'] = { 'font-size': 'calc(1.3rem + .6vw) !important' };
  rules['.fs-4'] = { 'font-size': 'calc(1.275rem + .3vw) !important' };
  rules['.fs-5'] = { 'font-size': '1.25rem !important' };
  rules['.fs-6'] = { 'font-size': '1rem !important' };

  // List utilities (structural)
  rules['.list-unstyled'] = { 'padding-left': '0', 'list-style': 'none' };
  rules['.list-inline'] = { 'padding-left': '0', 'list-style': 'none' };
  rules['.list-inline-item'] = { 'display': 'inline-block' };
  rules['.list-inline-item:not(:last-child)'] = { 'margin-right': '.5rem' };

  // Opacity utilities (structural)
  rules['.opacity-0'] = { 'opacity': '0 !important' };
  rules['.opacity-25'] = { 'opacity': '.25 !important' };
  rules['.opacity-50'] = { 'opacity': '.5 !important' };
  rules['.opacity-75'] = { 'opacity': '.75 !important' };
  rules['.opacity-100'] = { 'opacity': '1 !important' };

  // Responsive grid
  Object.assign(rules, defaultStyles.responsive);

  return addUnderscoreAliases(rules);
}

// =========================================================================
// getAllStyles — backwards compatible
// =========================================================================

/**
 * Add underscore aliases for all bw- selectors
 * @param {Object} rules - CSS rules object
 * @returns {Object} - Rules with underscore aliases added
 */
export function addUnderscoreAliases(rules) {
  const result = {};
  for (const [selector, styles] of Object.entries(rules)) {
    result[selector] = styles;
    if (selector.includes('.bw-')) {
      const underscoreSelector = selector.replace(/\.bw-/g, '.bw_');
      result[underscoreSelector] = styles;
    }
  }
  return result;
}

export function getAllStyles() {
  const merged = Object.assign({},
    defaultStyles.root,
    defaultStyles.reset,
    defaultStyles.typography,
    defaultStyles.grid,
    defaultStyles.buttons,
    defaultStyles.cards,
    defaultStyles.forms,
    defaultStyles.formChecks,
    defaultStyles.navigation,
    defaultStyles.tables,
    defaultStyles.tableResponsive,
    defaultStyles.alerts,
    defaultStyles.badges,
    defaultStyles.progress,
    defaultStyles.tabs,
    defaultStyles.listGroups,
    defaultStyles.pagination,
    defaultStyles.breadcrumb,
    defaultStyles.hero,
    defaultStyles.features,
    defaultStyles.enhancedCards,
    defaultStyles.sections,
    defaultStyles.cta,
    defaultStyles.spinner,
    defaultStyles.closeButton,
    defaultStyles.stacks,
    defaultStyles.offsets,
    defaultStyles.codeDemo,
    defaultStyles.buttonGroup,
    defaultStyles.accordion,
    defaultStyles.modal,
    defaultStyles.toast,
    defaultStyles.dropdown,
    defaultStyles.formSwitch,
    defaultStyles.skeleton,
    defaultStyles.avatar,
    defaultStyles.utilities,
    defaultStyles.responsive
  );
  return addUnderscoreAliases(merged);
}

// =========================================================================
// Theme tokens (backwards compatible)
// =========================================================================

export let theme = {
  colors: {
    primary: '#006666',
    secondary: '#6c757d',
    success: '#198754',
    danger: '#dc3545',
    warning: '#ffc107',
    info: '#0dcaf0',
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
  darkMode: false
};

export const darkModeColors = {
  '--bw-body-color': '#e9ecef',
  '--bw-body-bg': '#1a1a2e',
  '--bw-border-color': '#495057',
  '--bw-gray-100': '#212529',
  '--bw-gray-200': '#343a40',
  '--bw-gray-300': '#495057',
  '--bw-gray-800': '#e9ecef',
  '--bw-gray-900': '#f8f9fa'
};

/**
 * Generate theme-aware dark mode CSS from a palette.
 * Derives dark variants from the palette colors instead of using hardcoded values.
 *
 * @param {Object} palette - From derivePalette()
 * @returns {Object} CSS rules object for dark mode
 */
export function generateDarkModeCSS(palette) {
  var darkBg = adjustLightness(palette.primary.base, -15);
  var darkBgHsl = hexToHsl(darkBg);
  // Make it very dark (lightness 8-12%)
  var bodyBg = hslToHex([darkBgHsl[0], Math.min(darkBgHsl[1], 30), 10]);
  var surfaceBg = hslToHex([darkBgHsl[0], Math.min(darkBgHsl[1], 25), 15]);
  var textColor = adjustLightness(palette.light.base, 5);
  var borderColor = hslToHex([darkBgHsl[0], Math.min(darkBgHsl[1], 15), 30]);

  return {
    ':root.bw-dark': {
      '--bw-body-color': textColor,
      '--bw-body-bg': bodyBg
    },
    '.bw-dark body, :root.bw-dark body': {
      'color': textColor,
      'background-color': bodyBg
    },
    '.bw-dark .bw-card': {
      'background-color': surfaceBg,
      'border-color': borderColor,
      'color': textColor
    },
    '.bw-dark .bw-card-header': {
      'background-color': bodyBg,
      'border-bottom-color': borderColor,
      'color': textColor
    },
    '.bw-dark .bw-card-footer': {
      'background-color': bodyBg,
      'border-top-color': borderColor,
      'color': textColor
    },
    '.bw-dark .bw-card-title': {
      'color': textColor
    },
    '.bw-dark .bw-navbar': {
      'background-color': surfaceBg,
      'border-bottom-color': borderColor
    },
    '.bw-dark .bw-navbar-brand': {
      'color': textColor
    },
    '.bw-dark .bw-navbar-nav .bw-nav-link': {
      'color': adjustLightness(textColor, -15)
    },
    '.bw-dark .bw-navbar-nav .bw-nav-link:hover': {
      'color': textColor
    },
    '.bw-dark .bw-form-control': {
      'background-color': surfaceBg,
      'border-color': borderColor,
      'color': textColor
    },
    '.bw-dark .bw-form-label': {
      'color': textColor
    },
    '.bw-dark .bw-form-text': {
      'color': adjustLightness(textColor, -20)
    },
    '.bw-dark .bw-table': {
      'color': textColor
    },
    '.bw-dark .bw-table > :not(caption) > * > *': {
      'border-bottom-color': borderColor
    },
    '.bw-dark .bw-table > thead > tr > *': {
      'background-color': bodyBg,
      'color': adjustLightness(textColor, -10),
      'border-bottom-color': borderColor
    },
    '.bw-dark .bw-table-striped > tbody > tr:nth-of-type(odd) > *': {
      'background-color': 'rgba(255, 255, 255, 0.05)'
    },
    '.bw-dark .bw-alert': {
      'border-color': borderColor
    },
    '.bw-dark .bw-list-group-item': {
      'background-color': surfaceBg,
      'border-color': borderColor,
      'color': textColor
    },
    '.bw-dark .bw-badge': {
      'color': textColor
    },
    '.bw-dark .bw-nav-tabs': {
      'border-bottom-color': borderColor
    },
    '.bw-dark .bw-nav-link': {
      'color': adjustLightness(textColor, -15)
    },
    '.bw-dark .bw-nav-tabs .bw-nav-link:hover': {
      'color': textColor,
      'border-bottom-color': borderColor
    },
    '.bw-dark .bw-pagination .bw-page-link': {
      'background-color': surfaceBg,
      'border-color': borderColor,
      'color': textColor
    },
    '.bw-dark .bw-breadcrumb-item + .bw-breadcrumb-item::before': {
      'color': adjustLightness(textColor, -20)
    },
    '.bw-dark .bw-breadcrumb-item.active': {
      'color': adjustLightness(textColor, -10)
    },
    '.bw-dark .bw-hero-light': {
      'background': surfaceBg,
      'color': textColor
    },
    '.bw-dark .bw-progress': {
      'background-color': surfaceBg
    },
    '.bw-dark .bw-section-subtitle': {
      'color': adjustLightness(textColor, -15)
    },
    '.bw-dark .bw-close': {
      'color': textColor
    },
    '.bw-dark .bw-accordion-item': {
      'background-color': surfaceBg,
      'border-color': borderColor
    },
    '.bw-dark .bw-accordion-button': {
      'color': textColor
    },
    '.bw-dark .bw-accordion-button:hover': {
      'background-color': bodyBg
    },
    '.bw-dark .bw-accordion-body': {
      'border-top-color': borderColor
    },
    '.bw-dark .bw-modal-content': {
      'background-color': surfaceBg,
      'border-color': borderColor
    },
    '.bw-dark .bw-modal-header': {
      'border-bottom-color': borderColor
    },
    '.bw-dark .bw-modal-footer': {
      'border-top-color': borderColor
    },
    '.bw-dark .bw-modal-title': {
      'color': textColor
    },
    '.bw-dark .bw-toast': {
      'background-color': surfaceBg,
      'border-color': borderColor
    },
    '.bw-dark .bw-toast-header': {
      'border-bottom-color': borderColor,
      'color': textColor
    },
    '.bw-dark .bw-dropdown-menu': {
      'background-color': surfaceBg,
      'border-color': borderColor
    },
    '.bw-dark .bw-dropdown-item': {
      'color': textColor
    },
    '.bw-dark .bw-dropdown-item:hover': {
      'background-color': bodyBg
    },
    '.bw-dark .bw-dropdown-divider': {
      'border-top-color': borderColor
    },
    '.bw-dark .bw-skeleton': {
      'background-color': borderColor
    },
    '.bw-dark h1, .bw-dark h2, .bw-dark h3, .bw-dark h4, .bw-dark h5, .bw-dark h6': {
      'color': textColor
    },
    '@media (prefers-color-scheme: dark)': {
      ':root.bw-auto-dark body': {
        'color': textColor,
        'background-color': bodyBg
      }
    }
  };
}

export function getDarkModeStyles() {
  return {
    ':root.bw-dark': {
      '--bw-body-color': '#e9ecef',
      '--bw-body-bg': '#1a1a2e'
    },
    '.bw-dark body, :root.bw-dark body': {
      'color': '#e9ecef',
      'background-color': '#1a1a2e'
    },
    '.bw-dark .bw-card': {
      'background-color': '#16213e',
      'border-color': '#495057',
      'color': '#e9ecef'
    },
    '.bw-dark .bw-navbar': {
      'background-color': '#0f3460'
    },
    '.bw-dark .bw-form-control': {
      'background-color': '#16213e',
      'border-color': '#495057',
      'color': '#e9ecef'
    },
    '.bw-dark .bw-table': {
      'color': '#e9ecef'
    },
    '.bw-dark .bw-table > :not(caption) > * > *': {
      'border-bottom-color': '#495057'
    },
    '.bw-dark .bw-table-striped > tbody > tr:nth-of-type(odd) > *': {
      'background-color': 'rgba(255, 255, 255, 0.05)'
    },
    '.bw-dark .bw-alert': {
      'border-color': '#495057'
    },
    '.bw-dark .bw-list-group-item': {
      'background-color': '#16213e',
      'border-color': '#495057',
      'color': '#e9ecef'
    },
    '@media (prefers-color-scheme: dark)': {
      ':root.bw-auto-dark body': {
        'color': '#e9ecef',
        'background-color': '#1a1a2e'
      }
    }
  };
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
