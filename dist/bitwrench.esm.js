/*! bitwrench v2.0.4 | BSD-2-Clause | http://deftio.com/bitwrench */
/**
 * Auto-generated version file from package.json
 * DO NOT EDIT DIRECTLY - Use npm run generate-version
 */

const VERSION_INFO = {
  version: '2.0.4',
  name: 'bitwrench',
  description: 'A library for javascript UI functions.',
  license: 'BSD-2-Clause',
  homepage: 'http://deftio.com/bitwrench',
  repository: 'git://github.com/deftio/bitwrench.git',
  author: 'manu a. chatterjee <deftio@deftio.com> (https://deftio.com/)',
  buildDate: '2026-03-06T05:20:25.634Z'
};

/**
 * Bitwrench Color Utilities
 *
 * Standalone color math helpers used by both bitwrench.js and bitwrench-styles.js.
 * Extracted to avoid circular dependencies. bitwrench.js re-exports these as
 * bw.colorParse, bw.colorRgbToHsl, etc.
 *
 * @module bitwrench-color-utils
 * @license BSD-2-Clause
 */

/**
 * Clamp a value between min and max.
 * @param {number} val
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function clip(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

/**
 * Parse a CSS color string to [r, g, b, a, "rgb"].
 * Handles #hex, rgb(), rgba(), hsl(), hsla(), and bitwrench color arrays.
 * @param {string|Array} s - Color string or array
 * @param {number} [defAlpha=255] - Default alpha
 * @returns {Array} [r, g, b, a, "rgb"]
 */
function colorParse(s, defAlpha) {
  if (defAlpha === undefined) defAlpha = 255;
  var r = [0, 0, 0, defAlpha, "rgb"];

  if (Array.isArray(s)) {
    var df = [0, 0, 0, 255, "rgb"];
    for (var p = 0; p < s.length && p < df.length; p++) {
      df[p] = s[p];
    }
    return df;
  }

  s = String(s).replace(/\s/g, "");

  if (s[0] === "#") {
    var hex = s.slice(1);
    if (hex.length === 3 || hex.length === 4) {
      for (var i = 0; i < hex.length; i++) {
        r[i] = parseInt(hex[i] + hex[i], 16);
      }
    } else if (hex.length === 6 || hex.length === 8) {
      for (var j = 0; j < hex.length; j += 2) {
        r[j / 2] = parseInt(hex.substring(j, j + 2), 16);
      }
    }
  } else {
    var match = s.match(/^(rgb|hsl)a?\(([^)]+)\)$/i);
    if (match) {
      var type = match[1].toLowerCase();
      var values = match[2].split(",").map(function(v) { return parseFloat(v); });

      if (type === "rgb") {
        r[0] = values[0] || 0;
        r[1] = values[1] || 0;
        r[2] = values[2] || 0;
        r[3] = values[3] !== undefined ? values[3] * 255 : defAlpha;
        r[4] = "rgb";
      } else if (type === "hsl") {
        var rgb = colorHslToRgb(values[0] || 0, values[1] || 0, values[2] || 0,
                                values[3] !== undefined ? values[3] * 255 : defAlpha);
        return rgb;
      }
    }
  }

  return r;
}

/**
 * Convert RGB to HSL.
 * @param {number|Array} r - Red 0-255, or [r,g,b,a] array
 * @param {number} [g] - Green 0-255
 * @param {number} [b] - Blue 0-255
 * @param {number} [a=255] - Alpha 0-255
 * @param {boolean} [rnd=true] - Round results
 * @returns {Array} [h, s, l, a, "hsl"]
 */
function colorRgbToHsl(r, g, b, a, rnd) {
  if (a === undefined) a = 255;
  if (Array.isArray(r)) {
    g = r[1]; b = r[2]; a = r[3] !== undefined ? r[3] : 255; r = r[0];
  }

  r /= 255;
  g /= 255;
  b /= 255;

  var max = Math.max(r, g, b);
  var min = Math.min(r, g, b);
  var h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    var d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  h *= 360;
  s *= 100;
  l *= 100;

  return [h, s, l, a, "hsl"];
}

/**
 * Convert HSL to RGB.
 * @param {number|Array} h - Hue 0-360, or [h,s,l,a] array
 * @param {number} [s] - Saturation 0-100
 * @param {number} [l] - Lightness 0-100
 * @param {number} [a=255] - Alpha 0-255
 * @param {boolean} [rnd=true] - Round results
 * @returns {Array} [r, g, b, a, "rgb"]
 */
function colorHslToRgb(h, s, l, a, rnd) {
  if (a === undefined) a = 255;
  if (rnd === undefined) rnd = true;
  if (Array.isArray(h)) {
    s = h[1]; l = h[2]; a = h[3] !== undefined ? h[3] : 255; h = h[0];
  }

  var hNorm = h / 360;
  var sNorm = s / 100;
  var lNorm = l / 100;

  var r, g, b;

  if (sNorm === 0) {
    r = g = b = lNorm * 255;
  } else {
    var hue2rgb = function(p, q, t) {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };

    var q = lNorm < 0.5 ? lNorm * (1 + sNorm) : lNorm + sNorm - lNorm * sNorm;
    var p = 2 * lNorm - q;

    r = hue2rgb(p, q, hNorm + 1/3) * 255;
    g = hue2rgb(p, q, hNorm) * 255;
    b = hue2rgb(p, q, hNorm - 1/3) * 255;
  }

  if (rnd) {
    r = Math.round(r);
    g = Math.round(g);
    b = Math.round(b);
    a = Math.round(a);
  }

  return [r, g, b, a, "rgb"];
}

// =========================================================================
// New theme derivation helpers
// =========================================================================

/**
 * Convert hex color to HSL array [h, s, l].
 * @param {string} hex - Hex color e.g. '#006666'
 * @returns {Array} [h, s, l] where h=0-360, s=0-100, l=0-100
 */
function hexToHsl(hex) {
  var rgb = colorParse(hex);
  var hsl = colorRgbToHsl(rgb[0], rgb[1], rgb[2], 255);
  return [hsl[0], hsl[1], hsl[2]];
}

/**
 * Convert HSL array to hex color string.
 * @param {Array} hsl - [h, s, l] where h=0-360, s=0-100, l=0-100
 * @returns {string} Hex color e.g. '#006666'
 */
function hslToHex(hsl) {
  var rgb = colorHslToRgb(hsl[0], hsl[1], hsl[2], 255, true);
  return '#' +
    ('0' + rgb[0].toString(16)).slice(-2) +
    ('0' + rgb[1].toString(16)).slice(-2) +
    ('0' + rgb[2].toString(16)).slice(-2);
}

/**
 * Adjust lightness of a hex color by a percentage amount.
 * Positive = lighten, negative = darken.
 * @param {string} hex - Hex color
 * @param {number} amount - Lightness change in percentage points (-100 to 100)
 * @returns {string} Adjusted hex color
 */
function adjustLightness(hex, amount) {
  var hsl = hexToHsl(hex);
  hsl[2] = clip(hsl[2] + amount, 0, 100);
  return hslToHex(hsl);
}

/**
 * Mix two hex colors via RGB linear interpolation.
 * @param {string} hex1 - First hex color
 * @param {string} hex2 - Second hex color (e.g. '#ffffff' for tinting)
 * @param {number} ratio - 0 = all hex1, 1 = all hex2
 * @returns {string} Mixed hex color
 */
function mixColor(hex1, hex2, ratio) {
  var c1 = colorParse(hex1);
  var c2 = colorParse(hex2);
  var r = Math.round(c1[0] + (c2[0] - c1[0]) * ratio);
  var g = Math.round(c1[1] + (c2[1] - c1[1]) * ratio);
  var b = Math.round(c1[2] + (c2[2] - c1[2]) * ratio);
  return '#' +
    ('0' + r.toString(16)).slice(-2) +
    ('0' + g.toString(16)).slice(-2) +
    ('0' + b.toString(16)).slice(-2);
}

/**
 * Compute WCAG 2.0 relative luminance of a hex color.
 * @param {string} hex - Hex color
 * @returns {number} Relative luminance 0-1
 */
function relativeLuminance(hex) {
  var rgb = colorParse(hex);
  var vals = [rgb[0] / 255, rgb[1] / 255, rgb[2] / 255].map(function(v) {
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * vals[0] + 0.7152 * vals[1] + 0.0722 * vals[2];
}

/**
 * Return '#fff' or '#000' for readable text on a given background color.
 * Uses WCAG luminance threshold.
 * @param {string} hex - Background hex color
 * @returns {string} '#fff' or '#000'
 */
function textOnColor(hex) {
  return relativeLuminance(hex) > 0.179 ? '#000' : '#fff';
}

/**
 * Derive a full shade palette for a single semantic color.
 * @param {string} hex - Base color hex
 * @returns {Object} { base, hover, active, light, darkText, border, focus, textOn }
 */
function deriveShades(hex) {
  var rgb = colorParse(hex);
  return {
    base: hex,
    hover: adjustLightness(hex, -10),
    active: adjustLightness(hex, -15),
    light: mixColor(hex, '#ffffff', 0.85),
    darkText: adjustLightness(hex, -40),
    border: mixColor(hex, '#ffffff', 0.60),
    focus: 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',0.25)',
    textOn: textOnColor(hex)
  };
}

/**
 * Derive complete palette from a theme config object.
 * @param {Object} config - Theme config with primary, secondary, tertiary, etc.
 * @returns {Object} Full palette with shades for all 8 semantic colors + tertiary
 */
function derivePalette(config) {
  var defaults = {
    success: '#198754',
    danger: '#dc3545',
    warning: '#ffc107',
    info: '#0dcaf0',
    light: '#f8f9fa',
    dark: '#212529'
  };

  var palette = {
    primary: deriveShades(config.primary),
    secondary: deriveShades(config.secondary),
    tertiary: deriveShades(config.tertiary),
    success: deriveShades(config.success || defaults.success),
    danger: deriveShades(config.danger || defaults.danger),
    warning: deriveShades(config.warning || defaults.warning),
    info: deriveShades(config.info || defaults.info),
    light: deriveShades(config.light || defaults.light),
    dark: deriveShades(config.dark || defaults.dark)
  };

  return palette;
}

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


// =========================================================================
// Layout presets
// =========================================================================

var SPACING_PRESETS = {
  compact:  { btn: '0.3rem 0.8rem',  card: '0.875rem 1rem', alert: '0.625rem 1rem', cell: '0.5rem 0.75rem', input: '0.375rem 0.7rem' },
  normal:   { btn: '0.5rem 1.125rem', card: '1.25rem 1.5rem', alert: '0.875rem 1.25rem', cell: '0.75rem 1rem', input: '0.5rem 0.875rem' },
  spacious: { btn: '0.75rem 1.5rem',  card: '1.75rem 2rem', alert: '1.125rem 1.5rem', cell: '1rem 1.25rem', input: '0.75rem 1.125rem' }
};

var RADIUS_PRESETS = {
  none: { btn: '0', card: '0', badge: '0', alert: '0', input: '0' },
  sm:   { btn: '4px', card: '4px', badge: '.25rem', alert: '4px', input: '4px' },
  md:   { btn: '6px', card: '8px', badge: '.375rem', alert: '8px', input: '6px' },
  lg:   { btn: '10px', card: '12px', badge: '.5rem', alert: '12px', input: '10px' },
  pill: { btn: '50rem', card: '1rem', badge: '50rem', alert: '1rem', input: '50rem' }
};

/**
 * Default palette config — matches existing hardcoded colors
 */
var DEFAULT_PALETTE_CONFIG = {
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
var THEME_PRESETS = {
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
function resolveLayout(config) {
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
    'background-color': 'rgba(0, 0, 0, 0.025)'
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

/**
 * Generate all themed CSS rules from a palette and layout.
 * Returns a flat CSS rules object (selector → declarations).
 *
 * @param {string} scopeName - CSS scope class ('' for global)
 * @param {Object} palette - From derivePalette()
 * @param {Object} layout - From resolveLayout()
 * @returns {Object} CSS rules object
 */
function generateThemedCSS(scopeName, palette, layout) {
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
const defaultStyles = {
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
    '.bw-navbar > .container': {
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
      'background-color': 'rgba(0, 0, 0, 0.025)'
    },
    '.bw-table-hover > tbody > tr:hover > *': {
      'background-color': 'rgba(0, 102, 102, 0.05)'
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
      'padding': '.35em .65em',
      'font-size': '.75em',
      'font-weight': '700',
      'line-height': '1',
      'color': '#fff',
      'text-align': 'center',
      'white-space': 'nowrap',
      'vertical-align': 'baseline',
      'border-radius': '.375rem'
    },
    '.bw-badge:empty': {
      'display': 'none'
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
      'letter-spacing': '-0.05rem'
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
    }
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
function getStructuralStyles() {
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
  rules['.bw-navbar > .container'] = { 'display': 'flex', 'flex-wrap': 'wrap', 'align-items': 'center', 'justify-content': 'space-between' };
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
    'display': 'inline-block', 'padding': '.35em .65em', 'font-size': '.75em',
    'font-weight': '700', 'line-height': '1', 'text-align': 'center',
    'white-space': 'nowrap', 'vertical-align': 'baseline', 'border-radius': '.375rem'
  };
  rules['.bw-badge:empty'] = { 'display': 'none' };
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
  rules['.bw-hero-title'] = { 'font-weight': '300', 'letter-spacing': '-0.05rem' };
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
function addUnderscoreAliases(rules) {
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

// =========================================================================
// Theme tokens (backwards compatible)
// =========================================================================

let theme = {
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

/**
 * Generate theme-aware dark mode CSS from a palette.
 * Derives dark variants from the palette colors instead of using hardcoded values.
 *
 * @param {Object} palette - From derivePalette()
 * @returns {Object} CSS rules object for dark mode
 */
function generateDarkModeCSS(palette) {
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

function deepMerge(target, source) {
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

function updateTheme(overrides) {
  deepMerge(theme, overrides);
}

/**
 * Bitwrench v2 Components
 *
 * TACO-based UI component library providing Bootstrap-inspired components
 * as pure JavaScript objects. Every make* function returns a TACO object
 * ({t, a, c, o}) that can be rendered with bw.html() or bw.DOM().
 *
 * Components included: Card, Button, Container, Row, Col, Nav, Navbar,
 * Tabs, Alert, Badge, Progress, ListGroup, Breadcrumb, Form controls,
 * Stack, Spinner, Hero, FeatureGrid, CardV2, CTA, Section, CodeDemo.
 *
 * Handle classes (CardHandle, TableHandle, NavbarHandle, TabsHandle)
 * provide imperative DOM manipulation for rendered components.
 *
 * @module bitwrench-components-v2
 * @license BSD-2-Clause
 * @author M A Chatterjee <deftio [at] deftio [dot] com>
 */

/**
 * Create a card component with optional header, body, footer, and image support
 *
 * Supports images (top, bottom, left, right), shadow levels, subtitle,
 * hover animation, and custom section class overrides. For horizontal
 * image layouts (left/right), content is wrapped in a row grid.
 *
 * @param {Object} [props] - Card configuration
 * @param {string} [props.title] - Card title displayed in the body
 * @param {string} [props.subtitle] - Card subtitle (muted text below title)
 * @param {string|Object|Array} [props.content] - Card body content (string, TACO, or array)
 * @param {string|Object} [props.footer] - Card footer content
 * @param {string|Object} [props.header] - Card header content
 * @param {Object} [props.image] - Card image configuration
 * @param {string} props.image.src - Image source URL
 * @param {string} [props.image.alt] - Image alt text
 * @param {string} [props.imagePosition="top"] - Image position ("top", "bottom", "left", "right")
 * @param {string} [props.variant] - Color variant (e.g. "primary", "danger")
 * @param {boolean} [props.bordered=true] - Show card border
 * @param {string} [props.shadow] - Shadow level ("none", "sm", "md", "lg")
 * @param {boolean} [props.hoverable=false] - Enable hover lift animation
 * @param {string} [props.className] - Additional CSS classes
 * @param {Object} [props.style] - Inline style object
 * @param {string} [props.headerClass] - Additional header CSS classes
 * @param {string} [props.bodyClass] - Additional body CSS classes
 * @param {string} [props.footerClass] - Additional footer CSS classes
 * @param {Object} [props.state] - Component state object
 * @returns {Object} TACO object representing a card component
 * @category Component Builders
 * @example
 * const card = makeCard({
 *   title: "Status",
 *   content: "All systems operational",
 *   variant: "success"
 * });
 * bw.DOM("#app", card);
 */
function makeCard(props = {}) {
  const {
    title,
    subtitle,
    content,
    footer,
    header,
    image,
    imagePosition = 'top',
    variant,
    bordered = true,
    shadow,
    hoverable = false,
    className = '',
    style,
    headerClass = '',
    bodyClass = '',
    footerClass = ''
  } = props;

  const shadowClasses = {
    none: '',
    sm: 'bw-shadow-sm',
    md: 'bw-shadow',
    lg: 'bw-shadow-lg'
  };

  const cardClasses = [
    'bw-card',
    variant ? `bw-card-${variant}` : '',
    shadow ? (shadowClasses[shadow] || '') : '',
    !bordered ? 'bw-border-0' : '',
    hoverable ? 'bw-card-hoverable' : '',
    className
  ].filter(Boolean).join(' ').trim();

  const cardContent = [
    header && {
      t: 'div',
      a: { class: `bw-card-header ${headerClass}`.trim() },
      c: header
    },
    image && (imagePosition === 'top' || imagePosition === 'left') && {
      t: 'img',
      a: {
        class: `bw-card-img-${imagePosition}`,
        src: image.src,
        alt: image.alt || ''
      }
    },
    {
      t: 'div',
      a: { class: `bw-card-body ${bodyClass}`.trim() },
      c: [
        title && { t: 'h5', a: { class: 'bw-card-title' }, c: title },
        subtitle && { t: 'h6', a: { class: 'bw-card-subtitle bw-mb-2 bw-text-muted' }, c: subtitle },
        content && (Array.isArray(content) ? content : [content])
      ].flat().filter(Boolean)
    },
    image && (imagePosition === 'bottom' || imagePosition === 'right') && {
      t: 'img',
      a: {
        class: `bw-card-img-${imagePosition}`,
        src: image.src,
        alt: image.alt || ''
      }
    },
    footer && {
      t: 'div',
      a: { class: `bw-card-footer ${footerClass}`.trim() },
      c: footer
    }
  ].filter(Boolean);

  // Handle horizontal layout for left/right images
  if (image && (imagePosition === 'left' || imagePosition === 'right')) {
    return {
      t: 'div',
      a: { class: cardClasses, style },
      c: {
        t: 'div',
        a: { class: 'bw-row bw-g-0' },
        c: cardContent
      },
      o: {
        type: 'card',
        state: props.state || {}
      }
    };
  }

  return {
    t: 'div',
    a: { class: cardClasses, style },
    c: cardContent,
    o: {
      type: 'card',
      state: props.state || {}
    }
  };
}

/**
 * Create a button component
 *
 * @param {Object} [props] - Button configuration
 * @param {string} [props.text] - Button label text
 * @param {string} [props.variant="primary"] - Color variant (e.g. "primary", "secondary", "danger")
 * @param {string} [props.size] - Size variant ("sm" or "lg")
 * @param {boolean} [props.disabled=false] - Whether the button is disabled
 * @param {Function} [props.onclick] - Click event handler
 * @param {string} [props.type="button"] - HTML button type ("button", "submit", "reset")
 * @param {string} [props.className] - Additional CSS classes
 * @param {Object} [props.style] - Inline style object
 * @returns {Object} TACO object representing a button element
 * @category Component Builders
 * @example
 * const btn = makeButton({
 *   text: "Save",
 *   variant: "success",
 *   onclick: () => console.log("saved")
 * });
 */
function makeButton(props = {}) {
  const {
    text,
    variant = 'primary',
    size,
    disabled = false,
    onclick,
    type = 'button',
    className = '',
    style
  } = props;

  return {
    t: 'button',
    a: {
      type,
      class: [
        'bw-btn',
        `bw-btn-${variant}`,
        size && `bw-btn-${size}`,
        className
      ].filter(Boolean).join(' '),
      disabled,
      onclick,
      style
    },
    c: text,
    o: {
      type: 'button'
    }
  };
}

/**
 * Create a container component for centering and constraining content width
 *
 * @param {Object} [props] - Container configuration
 * @param {boolean} [props.fluid=false] - Use full-width fluid container
 * @param {Array|Object|string} [props.children] - Child content
 * @param {string} [props.className] - Additional CSS classes
 * @returns {Object} TACO object representing a container div
 * @category Component Builders
 * @example
 * const container = makeContainer({
 *   fluid: true,
 *   children: [makeRow({ children: [...] })]
 * });
 */
function makeContainer(props = {}) {
  const { fluid = false, children, className = '' } = props;

  return {
    t: 'div',
    a: { class: `bw-container${fluid ? '-fluid' : ''} ${className}`.trim() },
    c: children
  };
}

/**
 * Create a flexbox row for the grid system
 *
 * @param {Object} [props] - Row configuration
 * @param {Array|Object|string} [props.children] - Child columns
 * @param {string} [props.className] - Additional CSS classes
 * @param {number} [props.gap] - Gap size (1-5) applied via bw-g-{gap} class
 * @returns {Object} TACO object representing a grid row
 * @category Component Builders
 * @example
 * const row = makeRow({
 *   gap: 4,
 *   children: [makeCol({ size: 6, content: "Left" }), makeCol({ size: 6, content: "Right" })]
 * });
 */
function makeRow(props = {}) {
  const { children, className = '', gap } = props;

  return {
    t: 'div',
    a: {
      class: `bw-row ${gap ? `bw-g-${gap}` : ''} ${className}`.trim()
    },
    c: children
  };
}

/**
 * Create a grid column with responsive sizing
 *
 * Supports both fixed and responsive column sizes. Pass an object for
 * responsive breakpoints (e.g. {xs: 12, md: 6, lg: 4}).
 *
 * @param {Object} [props] - Column configuration
 * @param {number|Object} [props.size] - Column size (1-12) or responsive object {xs, sm, md, lg, xl}
 * @param {number} [props.offset] - Column offset (1-12)
 * @param {number} [props.push] - Column push (1-12)
 * @param {number} [props.pull] - Column pull (1-12)
 * @param {Array|Object|string} [props.content] - Column content (alias for children)
 * @param {Array|Object|string} [props.children] - Column content
 * @param {string} [props.className] - Additional CSS classes
 * @returns {Object} TACO object representing a grid column
 * @category Component Builders
 * @example
 * const col = makeCol({ size: { xs: 12, md: 6 }, content: "Responsive column" });
 */
function makeCol(props = {}) {
  const { size, offset, push, pull, content, children, className = '' } = props;

  const classes = [];

  if (typeof size === 'object') {
    // Responsive sizes
    Object.entries(size).forEach(([breakpoint, value]) => {
      if (breakpoint === 'xs') {
        classes.push(`bw-col-${value}`);
      } else {
        classes.push(`bw-col-${breakpoint}-${value}`);
      }
    });
  } else if (size) {
    classes.push(`bw-col-${size}`);
  } else {
    classes.push('bw-col');
  }

  if (offset) classes.push(`bw-offset-${offset}`);
  if (push) classes.push(`bw-push-${push}`);
  if (pull) classes.push(`bw-pull-${pull}`);

  return {
    t: 'div',
    a: { class: `${classes.join(' ')} ${className}`.trim() },
    c: content || children
  };
}

/**
 * Create a navigation component with tabs or pills styling
 *
 * @param {Object} [props] - Nav configuration
 * @param {Array<Object>} [props.items=[]] - Navigation items
 * @param {string} props.items[].text - Item display text
 * @param {string} [props.items[].href="#"] - Item link URL
 * @param {boolean} [props.items[].active] - Whether this item is active
 * @param {boolean} [props.items[].disabled] - Whether this item is disabled
 * @param {boolean} [props.pills=false] - Use pill styling instead of tabs
 * @param {boolean} [props.vertical=false] - Stack items vertically
 * @param {string} [props.className] - Additional CSS classes
 * @returns {Object} TACO object representing a nav element
 * @category Component Builders
 * @example
 * const nav = makeNav({
 *   pills: true,
 *   items: [
 *     { text: "Home", href: "/", active: true },
 *     { text: "About", href: "/about" }
 *   ]
 * });
 */
function makeNav(props = {}) {
  const {
    items = [],
    pills = false,
    vertical = false,
    className = ''
  } = props;

  return {
    t: 'ul',
    a: {
      class: `bw-nav ${pills ? 'bw-nav-pills' : 'bw-nav-tabs'} ${vertical ? 'bw-nav-vertical' : ''} ${className}`.trim()
    },
    c: items.map(item => ({
      t: 'li',
      a: { class: 'bw-nav-item' },
      c: {
        t: 'a',
        a: {
          href: item.href || '#',
          class: `bw-nav-link ${item.active ? 'active' : ''} ${item.disabled ? 'disabled' : ''}`.trim()
        },
        c: item.text
      }
    }))
  };
}

/**
 * Create a navbar component with brand and navigation links
 *
 * @param {Object} [props] - Navbar configuration
 * @param {string} [props.brand] - Brand name or logo text
 * @param {string} [props.brandHref="#"] - Brand link URL
 * @param {Array<Object>} [props.items=[]] - Navigation items
 * @param {string} props.items[].text - Item display text
 * @param {string} [props.items[].href="#"] - Item link URL
 * @param {boolean} [props.items[].active] - Whether this item is active
 * @param {boolean} [props.dark=true] - Use dark theme styling
 * @param {string} [props.className] - Additional CSS classes
 * @returns {Object} TACO object representing a navbar element
 * @category Component Builders
 * @example
 * const navbar = makeNavbar({
 *   brand: "MyApp",
 *   dark: true,
 *   items: [
 *     { text: "Home", href: "/", active: true },
 *     { text: "Docs", href: "/docs" }
 *   ]
 * });
 */
function makeNavbar(props = {}) {
  const {
    brand,
    brandHref = '#',
    items = [],
    dark = true,
    className = ''
  } = props;

  return {
    t: 'nav',
    a: {
      class: `bw-navbar ${dark ? 'bw-navbar-dark' : 'bw-navbar-light'} ${className}`.trim()
    },
    c: {
      t: 'div',
      a: { class: 'bw-container' },
      c: [
        brand && {
          t: 'a',
          a: { href: brandHref, class: 'bw-navbar-brand' },
          c: brand
        },
        items.length > 0 && {
          t: 'div',
          a: { class: 'bw-navbar-nav' },
          c: items.map(item => ({
            t: 'a',
            a: {
              href: item.href || '#',
              class: `bw-nav-link ${item.active ? 'active' : ''}`
            },
            c: item.text
          }))
        }
      ].filter(Boolean)
    },
    o: {
      type: 'navbar',
      state: { activeItem: items.findIndex(i => i.active) }
    }
  };
}

/**
 * Create a tabbed interface with accessible tab navigation
 *
 * Each tab is rendered as a button with ARIA attributes for accessibility.
 * Clicking a tab shows its content pane and hides others. The active tab
 * can be set via activeIndex or by setting active:true on a tab item.
 *
 * @param {Object} [props] - Tabs configuration
 * @param {Array<Object>} [props.tabs=[]] - Tab definitions
 * @param {string} props.tabs[].label - Tab button label
 * @param {string|Object|Array} props.tabs[].content - Tab pane content
 * @param {boolean} [props.tabs[].active] - Whether this tab is initially active
 * @param {number} [props.activeIndex=0] - Default active tab index (overridden by tab.active)
 * @returns {Object} TACO object representing a tabbed interface
 * @category Component Builders
 * @example
 * const tabs = makeTabs({
 *   tabs: [
 *     { label: "Overview", content: "Tab 1 content", active: true },
 *     { label: "Details", content: "Tab 2 content" }
 *   ]
 * });
 * bw.DOM("#app", tabs);
 */
function makeTabs(props = {}) {
  const { tabs = [], activeIndex = 0 } = props;

  // Find the active tab index based on the active property or use activeIndex
  let actualActiveIndex = activeIndex;
  tabs.forEach((tab, index) => {
    if (tab.active) {
      actualActiveIndex = index;
    }
  });

  return {
    t: 'div',
    a: { class: 'bw-tabs' },
    c: [
      {
        t: 'ul',
        a: { class: 'bw-nav bw-nav-tabs', role: 'tablist' },
        c: tabs.map((tab, index) => ({
          t: 'li',
          a: { class: 'bw-nav-item', role: 'presentation' },
          c: {
            t: 'button',
            a: {
              class: `bw-nav-link ${index === actualActiveIndex ? 'active' : ''}`,
              type: 'button',
              role: 'tab',
              'aria-selected': index === actualActiveIndex ? 'true' : 'false',
              'data-tab-index': index,
              onclick: (e) => {
                const tabsContainer = e.target.closest('.bw-tabs');
                const allTabs = tabsContainer.querySelectorAll('.bw-nav-link');
                const allPanes = tabsContainer.querySelectorAll('.bw-tab-pane');

                allTabs.forEach(t => {
                  t.classList.remove('active');
                  t.setAttribute('aria-selected', 'false');
                });
                allPanes.forEach(p => p.classList.remove('active'));

                e.target.classList.add('active');
                e.target.setAttribute('aria-selected', 'true');
                const targetIndex = parseInt(e.target.getAttribute('data-tab-index'));
                allPanes[targetIndex].classList.add('active');
              }
            },
            c: tab.label
          }
        }))
      },
      {
        t: 'div',
        a: { class: 'bw-tab-content' },
        c: tabs.map((tab, index) => ({
          t: 'div',
          a: {
            class: `bw-tab-pane ${index === actualActiveIndex ? 'active' : ''}`,
            role: 'tabpanel'
          },
          c: tab.content
        }))
      }
    ],
    o: {
      type: 'tabs',
      state: { activeIndex: actualActiveIndex }
    }
  };
}

/**
 * Create an alert/notification component
 *
 * @param {Object} [props] - Alert configuration
 * @param {string|Object|Array} [props.content] - Alert message content
 * @param {string} [props.variant="info"] - Color variant ("primary", "secondary", "success", "danger", "warning", "info", "light", "dark")
 * @param {boolean} [props.dismissible=false] - Show a close button to dismiss the alert
 * @param {string} [props.className] - Additional CSS classes
 * @returns {Object} TACO object representing an alert element
 * @category Component Builders
 * @example
 * const alert = makeAlert({
 *   content: "Operation completed successfully!",
 *   variant: "success",
 *   dismissible: true
 * });
 */
function makeAlert(props = {}) {
  const {
    content,
    variant = 'info',
    dismissible = false,
    className = ''
  } = props;

  return {
    t: 'div',
    a: {
      class: `bw-alert bw-alert-${variant} ${dismissible ? 'bw-alert-dismissible' : ''} ${className}`.trim(),
      role: 'alert'
    },
    c: [
      content,
      dismissible && {
        t: 'button',
        a: {
          type: 'button',
          class: 'bw-close',
          'aria-label': 'Close'
        },
        c: '×'
      }
    ].filter(Boolean)
  };
}

/**
 * Create an inline badge/label component
 *
 * @param {Object} [props] - Badge configuration
 * @param {string} [props.text] - Badge display text
 * @param {string} [props.variant="primary"] - Color variant
 * @param {boolean} [props.pill=false] - Use pill (rounded) shape
 * @param {string} [props.className] - Additional CSS classes
 * @returns {Object} TACO object representing a badge span
 * @category Component Builders
 * @example
 * const badge = makeBadge({ text: "New", variant: "danger", pill: true });
 */
function makeBadge(props = {}) {
  const {
    text,
    variant = 'primary',
    pill = false,
    className = ''
  } = props;

  return {
    t: 'span',
    a: {
      class: `bw-badge bw-badge-${variant} ${pill ? 'bw-badge-pill' : ''} ${className}`.trim()
    },
    c: text
  };
}

/**
 * Create a progress bar component with ARIA accessibility
 *
 * @param {Object} [props] - Progress bar configuration
 * @param {number} [props.value=0] - Current progress value
 * @param {number} [props.max=100] - Maximum value
 * @param {string} [props.variant="primary"] - Color variant
 * @param {boolean} [props.striped=false] - Use striped pattern
 * @param {boolean} [props.animated=false] - Animate the stripes
 * @param {string} [props.label] - Custom label text (defaults to percentage)
 * @param {number} [props.height] - Custom height in pixels
 * @returns {Object} TACO object representing a progress bar
 * @category Component Builders
 * @example
 * const progress = makeProgress({
 *   value: 75,
 *   variant: "success",
 *   striped: true,
 *   animated: true
 * });
 */
function makeProgress(props = {}) {
  const {
    value = 0,
    max = 100,
    variant = 'primary',
    striped = false,
    animated = false,
    label,
    height
  } = props;

  const percentage = Math.round((value / max) * 100);

  return {
    t: 'div',
    a: {
      class: 'bw-progress',
      style: height ? { height: `${height}px` } : undefined
    },
    c: {
      t: 'div',
      a: {
        class: [
          'bw-progress-bar',
          `bw-progress-bar-${variant}`,
          striped && 'bw-progress-bar-striped',
          animated && 'bw-progress-bar-animated'
        ].filter(Boolean).join(' '),
        role: 'progressbar',
        style: { width: `${percentage}%` },
        'aria-valuenow': value,
        'aria-valuemin': 0,
        'aria-valuemax': max
      },
      c: label || `${percentage}%`
    }
  };
}

/**
 * Create a list group component for displaying lists of items
 *
 * Items can be simple strings or objects with text, active, disabled,
 * href, and onclick properties. When interactive is true or items have
 * href/onclick, items render as anchor tags.
 *
 * @param {Object} [props] - List group configuration
 * @param {Array<string|Object>} [props.items=[]] - List items (strings or objects)
 * @param {string} props.items[].text - Item display text
 * @param {boolean} [props.items[].active] - Whether this item is active
 * @param {boolean} [props.items[].disabled] - Whether this item is disabled
 * @param {string} [props.items[].href] - Item link URL
 * @param {Function} [props.items[].onclick] - Item click handler
 * @param {boolean} [props.flush=false] - Remove borders for use inside cards
 * @param {boolean} [props.interactive=false] - Make all items interactive (anchor tags)
 * @returns {Object} TACO object representing a list group
 * @category Component Builders
 * @example
 * const list = makeListGroup({
 *   interactive: true,
 *   items: [
 *     { text: "Active item", active: true },
 *     { text: "Regular item" },
 *     { text: "Disabled item", disabled: true }
 *   ]
 * });
 */
function makeListGroup(props = {}) {
  const { items = [], flush = false, interactive = false } = props;

  return {
    t: 'div',
    a: { class: `bw-list-group ${flush ? 'bw-list-group-flush' : ''}`.trim() },
    c: items.map(item => {
      const isObject = typeof item === 'object';
      const text = isObject ? item.text : item;
      const active = isObject ? item.active : false;
      const disabled = isObject ? item.disabled : false;
      const href = isObject ? item.href : null;
      const onclick = isObject ? item.onclick : null;

      // For interactive items or items with href/onclick, use anchor tag
      if (interactive || href || onclick) {
        return {
          t: 'a',
          a: {
            class: [
              'bw-list-group-item',
              active && 'active',
              disabled && 'disabled'
            ].filter(Boolean).join(' '),
            href: href || '#',
            onclick: onclick || ((e) => {
              if (!href) e.preventDefault();
            }),
            style: disabled ? 'pointer-events: none; opacity: 0.65;' : ''
          },
          c: text
        };
      }

      // For non-interactive items, use div
      return {
        t: 'div',
        a: {
          class: [
            'bw-list-group-item',
            active && 'active',
            disabled && 'disabled'
          ].filter(Boolean).join(' ')
        },
        c: text
      };
    })
  };
}

/**
 * Create a breadcrumb navigation component
 *
 * The last item with active:true is rendered as plain text (no link).
 * All other items render as anchor tags.
 *
 * @param {Object} [props] - Breadcrumb configuration
 * @param {Array<Object>} [props.items=[]] - Breadcrumb items
 * @param {string} props.items[].text - Item display text
 * @param {string} [props.items[].href="#"] - Item link URL
 * @param {boolean} [props.items[].active] - Whether this is the current page
 * @returns {Object} TACO object representing a breadcrumb nav
 * @category Component Builders
 * @example
 * const crumbs = makeBreadcrumb({
 *   items: [
 *     { text: "Home", href: "/" },
 *     { text: "Products", href: "/products" },
 *     { text: "Widget", active: true }
 *   ]
 * });
 */
function makeBreadcrumb(props = {}) {
  const { items = [] } = props;

  return {
    t: 'nav',
    a: { 'aria-label': 'breadcrumb' },
    c: {
      t: 'ol',
      a: { class: 'bw-breadcrumb' },
      c: items.map((item, index) => ({
        t: 'li',
        a: {
          class: `bw-breadcrumb-item ${item.active ? 'active' : ''}`,
          'aria-current': item.active ? 'page' : undefined
        },
        c: item.active ? item.text : {
          t: 'a',
          a: { href: item.href || '#' },
          c: item.text
        }
      }))
    }
  };
}

/**
 * Create a form wrapper with default submit prevention
 *
 * @param {Object} [props] - Form configuration
 * @param {Array|Object|string} [props.children] - Form contents (form groups, inputs, buttons)
 * @param {Function} [props.onsubmit] - Submit handler (defaults to preventDefault)
 * @param {string} [props.className] - Additional CSS classes
 * @returns {Object} TACO object representing a form element
 * @category Component Builders
 * @example
 * const form = makeForm({
 *   onsubmit: (e) => { e.preventDefault(); handleSubmit(); },
 *   children: [
 *     makeFormGroup({ label: "Name", input: makeInput({ placeholder: "Enter name" }) }),
 *     makeButton({ text: "Submit", type: "submit" })
 *   ]
 * });
 */
function makeForm(props = {}) {
  const { children, onsubmit, className = '' } = props;

  return {
    t: 'form',
    a: {
      class: className,
      onsubmit: onsubmit || ((e) => e.preventDefault())
    },
    c: children
  };
}

/**
 * Create a form group with label, input, and optional help text
 *
 * @param {Object} [props] - Form group configuration
 * @param {string} [props.label] - Label text
 * @param {Object} [props.input] - Input TACO object (from makeInput, makeSelect, etc.)
 * @param {string} [props.help] - Help text displayed below the input
 * @param {string} [props.id] - Input ID (links label to input via for/id)
 * @returns {Object} TACO object representing a form group
 * @category Component Builders
 * @example
 * const group = makeFormGroup({
 *   label: "Email",
 *   id: "email",
 *   input: makeInput({ type: "email", id: "email", placeholder: "you@example.com" }),
 *   help: "We'll never share your email."
 * });
 */
function makeFormGroup(props = {}) {
  const { label, input, help, id } = props;

  return {
    t: 'div',
    a: { class: 'bw-form-group' },
    c: [
      label && {
        t: 'label',
        a: { for: id, class: 'bw-form-label' },
        c: label
      },
      input,
      help && {
        t: 'small',
        a: { class: 'bw-form-text bw-text-muted' },
        c: help
      }
    ].filter(Boolean)
  };
}

/**
 * Create an input element with form control styling
 *
 * Additional event handlers (oninput, onchange, etc.) can be passed
 * as extra properties and are spread onto the element attributes.
 *
 * @param {Object} [props] - Input configuration
 * @param {string} [props.type="text"] - Input type ("text", "email", "password", "number", etc.)
 * @param {string} [props.placeholder] - Placeholder text
 * @param {string} [props.value] - Input value
 * @param {string} [props.id] - Element ID
 * @param {string} [props.name] - Input name attribute
 * @param {boolean} [props.disabled=false] - Whether the input is disabled
 * @param {boolean} [props.readonly=false] - Whether the input is read-only
 * @param {boolean} [props.required=false] - Whether the input is required
 * @param {string} [props.className] - Additional CSS classes
 * @param {Object} [props.style] - Inline style object
 * @returns {Object} TACO object representing an input element
 * @category Component Builders
 * @example
 * const input = makeInput({
 *   type: "email",
 *   placeholder: "you@example.com",
 *   required: true,
 *   oninput: (e) => validate(e.target.value)
 * });
 */
function makeInput(props = {}) {
  const {
    type = 'text',
    placeholder,
    value,
    id,
    name,
    disabled = false,
    readonly = false,
    required = false,
    className = '',
    style,
    ...eventHandlers
  } = props;

  return {
    t: 'input',
    a: {
      type,
      class: `bw-form-control ${className}`.trim(),
      placeholder,
      value,
      id,
      name,
      style,
      disabled,
      readonly,
      required,
      ...eventHandlers
    }
  };
}

/**
 * Create a textarea element with form control styling
 *
 * @param {Object} [props] - Textarea configuration
 * @param {string} [props.placeholder] - Placeholder text
 * @param {string} [props.value] - Textarea content
 * @param {number} [props.rows=3] - Number of visible text rows
 * @param {string} [props.id] - Element ID
 * @param {string} [props.name] - Textarea name attribute
 * @param {boolean} [props.disabled=false] - Whether the textarea is disabled
 * @param {boolean} [props.readonly=false] - Whether the textarea is read-only
 * @param {boolean} [props.required=false] - Whether the textarea is required
 * @param {string} [props.className] - Additional CSS classes
 * @returns {Object} TACO object representing a textarea element
 * @category Component Builders
 * @example
 * const textarea = makeTextarea({
 *   rows: 5,
 *   placeholder: "Enter your message...",
 *   required: true
 * });
 */
function makeTextarea(props = {}) {
  const {
    placeholder,
    value,
    rows = 3,
    id,
    name,
    disabled = false,
    readonly = false,
    required = false,
    className = '',
    ...eventHandlers
  } = props;

  return {
    t: 'textarea',
    a: {
      class: `bw-form-control ${className}`.trim(),
      placeholder,
      rows,
      id,
      name,
      disabled,
      readonly,
      required,
      ...eventHandlers
    },
    c: value
  };
}

/**
 * Create a select dropdown with options
 *
 * @param {Object} [props] - Select configuration
 * @param {Array<Object>} [props.options=[]] - Dropdown options
 * @param {string} props.options[].value - Option value
 * @param {string} [props.options[].text] - Option display text (defaults to value)
 * @param {string} [props.value] - Currently selected value
 * @param {string} [props.id] - Element ID
 * @param {string} [props.name] - Select name attribute
 * @param {boolean} [props.disabled=false] - Whether the select is disabled
 * @param {boolean} [props.required=false] - Whether the select is required
 * @param {string} [props.className] - Additional CSS classes
 * @returns {Object} TACO object representing a select element
 * @category Component Builders
 * @example
 * const select = makeSelect({
 *   value: "b",
 *   options: [
 *     { value: "a", text: "Option A" },
 *     { value: "b", text: "Option B" },
 *     { value: "c", text: "Option C" }
 *   ]
 * });
 */
function makeSelect(props = {}) {
  const {
    options = [],
    value,
    id,
    name,
    disabled = false,
    required = false,
    className = '',
    ...eventHandlers
  } = props;

  return {
    t: 'select',
    a: {
      class: `bw-form-control ${className}`.trim(),
      id,
      name,
      disabled,
      required,
      ...eventHandlers
    },
    c: options.map(opt => ({
      t: 'option',
      a: {
        value: opt.value,
        selected: opt.value === value
      },
      c: opt.text || opt.value
    }))
  };
}

/**
 * Create a checkbox input with label
 *
 * @param {Object} [props] - Checkbox configuration
 * @param {string} [props.label] - Checkbox label text
 * @param {boolean} [props.checked=false] - Whether the checkbox is checked
 * @param {string} [props.id] - Element ID (links label to checkbox)
 * @param {string} [props.name] - Input name attribute
 * @param {boolean} [props.disabled=false] - Whether the checkbox is disabled
 * @param {string} [props.value] - Checkbox value attribute
 * @returns {Object} TACO object representing a checkbox form group
 * @category Component Builders
 * @example
 * const checkbox = makeCheckbox({
 *   label: "I agree to the terms",
 *   id: "agree",
 *   checked: false
 * });
 */
function makeCheckbox(props = {}) {
  const {
    label,
    checked = false,
    id,
    name,
    disabled = false,
    value
  } = props;

  return {
    t: 'div',
    a: { class: 'bw-form-check' },
    c: [
      {
        t: 'input',
        a: {
          type: 'checkbox',
          class: 'bw-form-check-input',
          checked,
          id,
          name,
          disabled,
          value
        }
      },
      label && {
        t: 'label',
        a: { class: 'bw-form-check-label', for: id },
        c: label
      }
    ].filter(Boolean)
  };
}

/**
 * Create a flexbox stack layout (vertical or horizontal)
 *
 * @param {Object} [props] - Stack configuration
 * @param {Array|Object|string} [props.children] - Stack children
 * @param {string} [props.direction="vertical"] - Stack direction ("vertical" or "horizontal")
 * @param {number} [props.gap=3] - Gap size (0-5)
 * @param {string} [props.className] - Additional CSS classes
 * @returns {Object} TACO object representing a stack layout
 * @category Component Builders
 * @example
 * const stack = makeStack({
 *   direction: "horizontal",
 *   gap: 2,
 *   children: [
 *     makeButton({ text: "Cancel", variant: "secondary" }),
 *     makeButton({ text: "Save", variant: "primary" })
 *   ]
 * });
 */
function makeStack(props = {}) {
  const {
    children,
    direction = 'vertical',
    gap = 3,
    className = ''
  } = props;

  return {
    t: 'div',
    a: {
      class: `bw-${direction === 'vertical' ? 'vstack' : 'hstack'} bw-gap-${gap} ${className}`.trim()
    },
    c: children
  };
}

/**
 * Create a loading spinner indicator
 *
 * @param {Object} [props] - Spinner configuration
 * @param {string} [props.variant="primary"] - Color variant
 * @param {string} [props.size="md"] - Spinner size ("sm", "md", "lg")
 * @param {string} [props.type="border"] - Spinner type ("border" or "grow")
 * @returns {Object} TACO object representing a spinner with screen-reader text
 * @category Component Builders
 * @example
 * const spinner = makeSpinner({ variant: "info", size: "sm" });
 */
function makeSpinner(props = {}) {
  const {
    variant = 'primary',
    size = 'md',
    type = 'border'
  } = props;

  return {
    t: 'div',
    a: {
      class: `bw-spinner-${type} bw-spinner-${type}-${size} bw-text-${variant}`,
      role: 'status'
    },
    c: {
      t: 'span',
      a: { class: 'bw-visually-hidden' },
      c: 'Loading...'
    }
  };
}

/**
 * Create a hero section for landing pages and headers
 *
 * Supports gradient backgrounds, background images with overlays,
 * and action buttons. Commonly used as the first visible section.
 *
 * @param {Object} [props] - Hero configuration
 * @param {string} [props.title] - Main headline text
 * @param {string} [props.subtitle] - Supporting description text
 * @param {string|Object|Array} [props.content] - Additional body content
 * @param {string} [props.variant="primary"] - Background variant ("primary", "secondary", "light", "dark")
 * @param {string} [props.size="lg"] - Vertical padding size ("sm", "md", "lg", "xl")
 * @param {boolean} [props.centered=true] - Center-align text
 * @param {boolean} [props.overlay=false] - Add dark overlay (for background images)
 * @param {string} [props.backgroundImage] - Background image URL
 * @param {Array|Object} [props.actions] - Call-to-action buttons
 * @param {string} [props.className] - Additional CSS classes
 * @returns {Object} TACO object representing a hero section
 * @category Component Builders
 * @example
 * const hero = makeHero({
 *   title: "Welcome to Bitwrench",
 *   subtitle: "Build UIs with pure JavaScript",
 *   variant: "dark",
 *   actions: [
 *     makeButton({ text: "Get Started", variant: "primary", size: "lg" }),
 *     makeButton({ text: "Learn More", variant: "outline-light", size: "lg" })
 *   ]
 * });
 */
function makeHero(props = {}) {
  const {
    title,
    subtitle,
    content,
    variant = 'primary',
    size = 'lg',
    centered = true,
    overlay = false,
    backgroundImage,
    actions,
    className = ''
  } = props;

  const sizeClasses = {
    sm: 'bw-py-3',
    md: 'bw-py-4',
    lg: 'bw-py-5',
    xl: 'bw-py-6'
  };

  return {
    t: 'section',
    a: {
      class: `bw-hero bw-hero-${variant} ${sizeClasses[size] || sizeClasses.lg} ${centered ? 'bw-text-center' : ''} ${className}`.trim(),
      style: backgroundImage ? `background-image: url('${backgroundImage}'); background-size: cover; background-position: center;` : undefined
    },
    c: [
      overlay && {
        t: 'div',
        a: { class: 'bw-hero-overlay' }
      },
      {
        t: 'div',
        a: { class: 'bw-container' },
        c: {
          t: 'div',
          a: { class: 'bw-hero-content' },
          c: [
            title && {
              t: 'h1',
              a: { class: 'bw-hero-title bw-display-4 bw-mb-3' },
              c: title
            },
            subtitle && {
              t: 'p',
              a: { class: 'bw-hero-subtitle bw-lead bw-mb-4' },
              c: subtitle
            },
            content,
            actions && {
              t: 'div',
              a: { class: 'bw-hero-actions bw-mt-4' },
              c: actions
            }
          ].filter(Boolean)
        }
      }
    ].filter(Boolean)
  };
}

/**
 * Create a responsive feature grid for showcasing capabilities
 *
 * Renders features in an equal-width column grid with optional icons,
 * titles, and descriptions.
 *
 * @param {Object} [props] - Feature grid configuration
 * @param {Array<Object>} [props.features=[]] - Feature items
 * @param {string} [props.features[].icon] - Icon content (emoji, HTML entity, or text)
 * @param {string} [props.features[].title] - Feature title
 * @param {string} [props.features[].description] - Feature description text
 * @param {number} [props.columns=3] - Number of columns (divides 12-col grid)
 * @param {boolean} [props.centered=true] - Center-align feature text
 * @param {string} [props.iconSize="3rem"] - Icon font size
 * @param {string} [props.className] - Additional CSS classes
 * @returns {Object} TACO object representing a feature grid
 * @category Component Builders
 * @example
 * const features = makeFeatureGrid({
 *   columns: 3,
 *   features: [
 *     { icon: "⚡", title: "Fast", description: "Zero build step" },
 *     { icon: "📦", title: "Small", description: "Under 45KB gzipped" },
 *     { icon: "🔧", title: "Flexible", description: "Pure JS objects" }
 *   ]
 * });
 */
function makeFeatureGrid(props = {}) {
  const {
    features = [],
    columns = 3,
    centered = true,
    iconSize = '3rem',
    className = ''
  } = props;

  const colClass = `bw-col-md-${12/columns}`;

  return {
    t: 'div',
    a: { class: `bw-feature-grid ${className}`.trim() },
    c: {
      t: 'div',
      a: { class: 'bw-row bw-g-4' },
      c: features.map(feature => ({
        t: 'div',
        a: { class: colClass },
        c: {
          t: 'div',
          a: { class: `bw-feature ${centered ? 'bw-text-center' : ''}` },
          c: [
            feature.icon && {
              t: 'div',
              a: {
                class: 'bw-feature-icon bw-mb-3',
                style: `font-size: ${iconSize}; color: var(--bw-primary);`
              },
              c: feature.icon
            },
            feature.title && {
              t: 'h3',
              a: { class: 'bw-feature-title bw-h5 bw-mb-2' },
              c: feature.title
            },
            feature.description && {
              t: 'p',
              a: { class: 'bw-feature-description bw-text-muted' },
              c: feature.description
            }
          ].filter(Boolean)
        }
      }))
    }
  };
}


/**
 * Create a call-to-action section with title, description, and action buttons
 *
 * @param {Object} [props] - CTA configuration
 * @param {string} [props.title] - CTA headline
 * @param {string} [props.description] - CTA description text
 * @param {Array|Object} [props.actions] - CTA buttons or content
 * @param {string} [props.variant="light"] - Background variant
 * @param {boolean} [props.centered=true] - Center-align content
 * @param {string} [props.className] - Additional CSS classes
 * @returns {Object} TACO object representing a CTA section
 * @category Component Builders
 * @example
 * const cta = makeCTA({
 *   title: "Ready to get started?",
 *   description: "Join thousands of developers using Bitwrench.",
 *   actions: [
 *     makeButton({ text: "Sign Up Free", variant: "primary", size: "lg" })
 *   ]
 * });
 */
function makeCTA(props = {}) {
  const {
    title,
    description,
    actions,
    variant = 'light',
    centered = true,
    className = ''
  } = props;

  return {
    t: 'section',
    a: { class: `bw-cta bw-bg-${variant} bw-py-5 ${className}`.trim() },
    c: {
      t: 'div',
      a: { class: 'bw-container' },
      c: {
        t: 'div',
        a: { class: `bw-cta-content ${centered ? 'bw-text-center' : ''}` },
        c: [
          title && { t: 'h2', a: { class: 'bw-cta-title bw-mb-3' }, c: title },
          description && { t: 'p', a: { class: 'bw-cta-description bw-lead bw-mb-4' }, c: description },
          actions && {
            t: 'div',
            a: { class: 'bw-cta-actions' },
            c: actions
          }
        ].filter(Boolean)
      }
    }
  };
}

/**
 * Create a page section with optional centered header and background
 *
 * @param {Object} [props] - Section configuration
 * @param {string} [props.title] - Section title
 * @param {string} [props.subtitle] - Section subtitle (muted)
 * @param {string|Object|Array} [props.content] - Section body content
 * @param {string} [props.variant="default"] - Background variant ("default" for none, or a color name)
 * @param {string} [props.spacing="md"] - Vertical padding ("sm", "md", "lg", "xl")
 * @param {string} [props.className] - Additional CSS classes
 * @returns {Object} TACO object representing a content section
 * @category Component Builders
 * @example
 * const section = makeSection({
 *   title: "Features",
 *   subtitle: "Everything you need to build great UIs",
 *   spacing: "lg",
 *   content: makeFeatureGrid({ features: [...] })
 * });
 */
function makeSection(props = {}) {
  const {
    title,
    subtitle,
    content,
    variant = 'default',
    spacing = 'md',
    className = ''
  } = props;

  const spacingClasses = {
    sm: 'bw-py-3',
    md: 'bw-py-4',
    lg: 'bw-py-5',
    xl: 'bw-py-6'
  };

  return {
    t: 'section',
    a: {
      class: `bw-section ${spacingClasses[spacing] || spacingClasses.md} ${variant !== 'default' ? `bw-bg-${variant}` : ''} ${className}`.trim()
    },
    c: {
      t: 'div',
      a: { class: 'bw-container' },
      c: [
        (title || subtitle) && {
          t: 'div',
          a: { class: 'bw-section-header bw-text-center bw-mb-5' },
          c: [
            title && { t: 'h2', a: { class: 'bw-section-title' }, c: title },
            subtitle && { t: 'p', a: { class: 'bw-section-subtitle bw-text-muted' }, c: subtitle }
          ].filter(Boolean)
        },
        content
      ].filter(Boolean)
    }
  };
}

// =========================================================================
// Component Handle Classes
//
// Handle classes provide imperative DOM manipulation for rendered components.
// They cache child element references for efficient updates without
// full re-renders. Used by bw.createCard(), bw.createTable(), etc.
// =========================================================================

/**
 * Imperative handle for a rendered card component
 *
 * Provides methods to update card title, content, and CSS classes
 * without re-rendering the entire component. Created automatically
 * when using bw.createCard().
 *
 * @category Component Handles
 */
class CardHandle {
  /**
   * @param {Element} element - The card's root DOM element
   * @param {Object} taco - The original TACO object used to create the card
   */
  constructor(element, taco) {
    this.element = element;
    this._taco = taco;
    this.state = taco.o?.state || {};

    // Cache child elements
    this.children = {
      header: element.querySelector('.bw-card-header'),
      title: element.querySelector('.bw-card-title'),
      body: element.querySelector('.bw-card-body'),
      footer: element.querySelector('.bw-card-footer')
    };
  }

  /**
   * Update the card title text
   *
   * @param {string} title - New title text
   * @returns {CardHandle} this (for chaining)
   */
  setTitle(title) {
    if (this.children.title) {
      this.children.title.textContent = title;
    }
    return this;
  }

  /**
   * Replace the card body content
   *
   * @param {string|Object} content - New content (string or TACO object)
   * @returns {CardHandle} this (for chaining)
   */
  setContent(content) {
    if (this.children.body) {
      if (typeof content === 'string') {
        this.children.body.textContent = content;
      } else {
        // Re-render content
        this.children.body.innerHTML = '';
        const newContent = window.bw.taco.toDOM(content);
        this.children.body.appendChild(newContent);
      }
    }
    return this;
  }

  /**
   * Add a CSS class to the card root element
   *
   * @param {string} className - Class to add
   * @returns {CardHandle} this (for chaining)
   */
  addClass(className) {
    this.element.classList.add(className);
    return this;
  }

  /**
   * Remove a CSS class from the card root element
   *
   * @param {string} className - Class to remove
   * @returns {CardHandle} this (for chaining)
   */
  removeClass(className) {
    this.element.classList.remove(className);
    return this;
  }

  /**
   * Query a child element within the card
   *
   * @param {string} selector - CSS selector
   * @returns {Element|null} Matching element or null
   */
  select(selector) {
    return this.element.querySelector(selector);
  }
}

/**
 * Imperative handle for a rendered table component
 *
 * Provides methods for data updates and column sorting. Caches
 * thead/tbody/header references for efficient DOM updates.
 * Created automatically when using bw.createTable().
 *
 * @category Component Handles
 */
class TableHandle {
  /**
   * @param {Element} element - The table's root DOM element
   * @param {Object} taco - The original TACO object used to create the table
   */
  constructor(element, taco) {
    this.element = element;
    this._taco = taco;
    this.state = taco.o?.state || {};
    this._data = this.state.data || [];
    this._sortColumn = null;
    this._sortDirection = 'asc';

    // Cache elements
    this.children = {
      thead: element.querySelector('thead'),
      tbody: element.querySelector('tbody'),
      headers: element.querySelectorAll('th')
    };

    // Set up sorting if enabled
    if (this.state.sortable) {
      this._setupSorting();
    }
  }

  /**
   * Attach click-to-sort handlers on all column headers
   * @private
   */
  _setupSorting() {
    this.children.headers.forEach((th, index) => {
      th.style.cursor = 'pointer';
      th.onclick = () => this.sortBy(th.textContent);
    });
  }

  /**
   * Replace the table data and re-render the body
   *
   * @param {Array<Object>} data - Array of row objects
   * @returns {TableHandle} this (for chaining)
   */
  setData(data) {
    this._data = data;
    this._renderBody();
    return this;
  }

  /**
   * Sort the table by a column name
   *
   * Toggles direction if the same column is sorted again.
   *
   * @param {string} column - Column header text to sort by
   * @param {string} [direction] - Sort direction ("asc" or "desc"); toggles if omitted
   * @returns {TableHandle} this (for chaining)
   */
  sortBy(column, direction) {
    if (column === this._sortColumn && !direction) {
      this._sortDirection = this._sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this._sortColumn = column;
      this._sortDirection = direction || 'asc';
    }

    const columnKey = Object.keys(this._data[0])[
      Array.from(this.children.headers).findIndex(th => th.textContent === column)
    ];

    this._data.sort((a, b) => {
      const aVal = a[columnKey];
      const bVal = b[columnKey];
      const result = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return this._sortDirection === 'asc' ? result : -result;
    });

    this._renderBody();
    return this;
  }

  /**
   * Re-render the tbody from current _data
   * @private
   */
  _renderBody() {
    this.children.tbody.innerHTML = '';
    this._data.forEach(row => {
      const tr = document.createElement('tr');
      Object.values(row).forEach(value => {
        const td = document.createElement('td');
        td.textContent = value;
        tr.appendChild(td);
      });
      this.children.tbody.appendChild(tr);
    });
  }
}

/**
 * Imperative handle for a rendered navbar component
 *
 * Provides methods to update the active navigation link.
 * Created automatically when using bw.createNavbar().
 *
 * @category Component Handles
 */
class NavbarHandle {
  /**
   * @param {Element} element - The navbar's root DOM element
   * @param {Object} taco - The original TACO object used to create the navbar
   */
  constructor(element, taco) {
    this.element = element;
    this._taco = taco;
    this.state = taco.o?.state || {};

    this.children = {
      brand: element.querySelector('.bw-navbar-brand'),
      links: element.querySelectorAll('.bw-nav-link')
    };
  }

  /**
   * Set the active navigation link by href
   *
   * @param {string} href - The href value of the link to activate
   * @returns {NavbarHandle} this (for chaining)
   */
  setActive(href) {
    this.children.links.forEach(link => {
      if (link.getAttribute('href') === href) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
    return this;
  }
}

/**
 * Imperative handle for a rendered tabs component
 *
 * Provides programmatic tab switching. Sets up click handlers
 * on tab buttons and manages active states on both buttons and panes.
 * Created automatically when using bw.createTabs().
 *
 * @category Component Handles
 */
class TabsHandle {
  /**
   * @param {Element} element - The tabs container DOM element
   * @param {Object} taco - The original TACO object used to create the tabs
   */
  constructor(element, taco) {
    this.element = element;
    this._taco = taco;
    this.state = taco.o?.state || {};

    this.children = {
      navItems: element.querySelectorAll('.bw-nav-link'),
      tabPanes: element.querySelectorAll('.bw-tab-pane')
    };

    this._setupTabs();
  }

  /**
   * Attach click handlers to tab navigation buttons
   * @private
   */
  _setupTabs() {
    this.children.navItems.forEach((navItem, index) => {
      navItem.onclick = (e) => {
        e.preventDefault();
        this.switchTo(index);
      };
    });
  }

  /**
   * Programmatically switch to a tab by index
   *
   * @param {number} index - Zero-based tab index to activate
   * @returns {TabsHandle} this (for chaining)
   */
  switchTo(index) {
    this.children.navItems.forEach((item, i) => {
      if (i === index) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    this.children.tabPanes.forEach((pane, i) => {
      if (i === index) {
        pane.classList.add('active');
      } else {
        pane.classList.remove('active');
      }
    });

    this.state.activeIndex = index;
    return this;
  }
}

/**
 * Create a code demo component for documentation pages
 *
 * Displays a live result alongside source code in a tabbed interface.
 * Includes a copy-to-clipboard button on the code tab.
 *
 * @param {Object} [props] - Code demo configuration
 * @param {string} [props.title] - Demo title heading
 * @param {string} [props.description] - Demo description text
 * @param {string} [props.code] - Source code to display (adds a "Code" tab when present)
 * @param {string|Object|Array} [props.result] - Live result content for the "Result" tab
 * @param {string} [props.language="javascript"] - Code language for syntax class
 * @returns {Object} TACO object representing a code demo with tabbed Result/Code views
 * @category Component Builders
 * @example
 * const demo = makeCodeDemo({
 *   title: "Button Example",
 *   description: "A simple primary button",
 *   code: 'makeButton({ text: "Click me" })',
 *   result: makeButton({ text: "Click me" })
 * });
 */
function makeCodeDemo(props = {}) {
  const {
    title,
    description,
    code,
    result,
    language = 'javascript'
  } = props;

  // Generate unique ID for this demo
  const demoId = `demo-${Math.random().toString(36).substr(2, 9)}`;

  const tabs = [
    {
      label: 'Result',
      active: true,
      content: result
    }
  ];

  // Only add Code tab if code is provided
  if (code) {
    tabs.push({
      label: 'Code',
      content: {
        t: 'div',
        a: { style: 'position: relative;' },
        c: [
          {
            t: 'button',
            a: {
              class: 'bw-copy-btn',
              style: 'position: absolute; top: 0.5rem; right: 0.5rem; padding: 0.25rem 0.625rem; font-size: 0.6875rem; background: rgba(255,255,255,0.12); color: #aaa; border: 1px solid rgba(255,255,255,0.15); border-radius: 4px; cursor: pointer; font-family: inherit; transition: all 0.15s;',
              onclick: (e) => {
                navigator.clipboard.writeText(code).then(() => {
                  const btn = e.target;
                  const originalText = btn.textContent;
                  btn.textContent = 'Copied!';
                  btn.style.background = '#006666';
                  btn.style.color = '#fff';
                  setTimeout(() => {
                    btn.textContent = originalText;
                    btn.style.background = 'rgba(255,255,255,0.12)';
                    btn.style.color = '#aaa';
                  }, 2000);
                });
              }
            },
            c: 'Copy'
          },
          {
            t: 'pre',
            a: {
              style: 'margin: 0; background: #1e293b; border: none; border-radius: 6px; overflow-x: auto;'
            },
            c: {
              t: 'code',
              a: {
                class: `language-${language}`,
                style: 'display: block; padding: 1.25rem; font-family: "SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace; font-size: 0.8125rem; line-height: 1.6; color: #e2e8f0;'
              },
              c: code
            }
          }
        ]
      }
    });
  }

  const content = [
    title && { t: 'h3', c: title },
    description && {
      t: 'p',
      a: { style: 'color: #6c757d; margin-bottom: 1rem;' },
      c: description
    },
    makeTabs({ tabs, id: demoId })
  ].filter(Boolean);

  return {
    t: 'div',
    a: { class: 'bw-code-demo' },
    c: content
  };
}

/**
 * Registry mapping component type names to their handle classes
 *
 * Used by bw.createCard(), bw.createTable(), etc. to wrap rendered
 * DOM elements in the appropriate imperative handle.
 *
 * @type {Object.<string, Function>}
 */
const componentHandles = {
  card: CardHandle,
  table: TableHandle,
  navbar: NavbarHandle,
  tabs: TabsHandle
};

var components = /*#__PURE__*/Object.freeze({
  __proto__: null,
  CardHandle: CardHandle,
  NavbarHandle: NavbarHandle,
  TableHandle: TableHandle,
  TabsHandle: TabsHandle,
  componentHandles: componentHandles,
  makeAlert: makeAlert,
  makeBadge: makeBadge,
  makeBreadcrumb: makeBreadcrumb,
  makeButton: makeButton,
  makeCTA: makeCTA,
  makeCard: makeCard,
  makeCheckbox: makeCheckbox,
  makeCodeDemo: makeCodeDemo,
  makeCol: makeCol,
  makeContainer: makeContainer,
  makeFeatureGrid: makeFeatureGrid,
  makeForm: makeForm,
  makeFormGroup: makeFormGroup,
  makeHero: makeHero,
  makeInput: makeInput,
  makeListGroup: makeListGroup,
  makeNav: makeNav,
  makeNavbar: makeNavbar,
  makeProgress: makeProgress,
  makeRow: makeRow,
  makeSection: makeSection,
  makeSelect: makeSelect,
  makeSpinner: makeSpinner,
  makeStack: makeStack,
  makeTabs: makeTabs,
  makeTextarea: makeTextarea
});

/**
 * Bitwrench v2 Core
 * Zero-dependency UI library using JavaScript objects
 * Works in browsers (IE11+) and Node.js
 * 
 * @license BSD-2-Clause
 * @author M A Chatterjee <deftio [at] deftio [dot] com>
 */


// Environment-aware module loader for optional Node.js built-ins (fs).
// Strategy: try require() first (CJS/UMD), fall back to import() (ESM).
// import() is wrapped in Function() to avoid parse errors in ES5/IE11 environments.

// Core bitwrench namespace
const bw = {
  // Version info from generated file
  version: VERSION_INFO.version,
  versionInfo: VERSION_INFO,
  
  /**
   * Get version metadata object (v1-compatible callable API).
   *
   * Returns a copy of the build-time version info including version string,
   * name, build date, and git hash.
   *
   * @returns {Object} Copy of VERSION_INFO with version, name, buildDate, etc.
   * @category Core
   */
  getVersion: function() {
    return { ...VERSION_INFO };
  },

  // Internal state
  _idCounter: 0,
  _unmountCallbacks: new Map(),
  _topics: {},          // topic → [{handler, id}]  (plain object for IE11 compat)
  _subIdCounter: 0,     // monotonic ID for subscriptions
  
  // Monkey patch for testing (same as v1)
  __monkey_patch_is_nodejs__: {
    _value: 'ignore',
    set: function(x) {
      this._value = (typeof x === 'boolean') ? x : 'ignore';
    },
    get: function() {
      return this._value;
    }
  }
};

/**
 * Detect if running in Node.js environment.
 *
 * Useful for writing isomorphic code that behaves differently in Node.js vs browser.
 * Uses `process.versions.node` for reliable detection that works in both CJS and ESM.
 *
 * @returns {boolean} True if Node.js, false if browser
 * @category Core
 * @example
 * if (bw.isNodeJS()) {
 *   console.log('Running in Node.js');
 * } else {
 *   console.log('Running in browser');
 * }
 */
bw.isNodeJS = function() {
  // Check monkey patch first (for testing)
  if (bw.__monkey_patch_is_nodejs__.get() !== 'ignore') {
    return bw.__monkey_patch_is_nodejs__.get();
  }

  // Reliable Node.js detection: works in both CJS and ESM
  // - `process.versions.node` exists in Node.js but not browsers
  // - `typeof window` alone is unreliable (jsdom, Electron, Deno)
  return typeof process !== 'undefined'
    && process.versions != null
    && process.versions.node != null;
};

// Set runtime flags based on detection
// _isNode: Node.js APIs (fs, process) available — static, won't change at runtime
// _isBrowser: DOM APIs (document, window) available — dynamic getter because
//   globals may be set up after module init (e.g., jsdom in test environments)
// These are NOT mutually exclusive: jsdom provides DOM in Node.js
bw._isNode = bw.isNodeJS();
Object.defineProperty(bw, '_isBrowser', {
  get: function() { return typeof document !== 'undefined' && typeof window !== 'undefined'; },
  configurable: true
});

/**
 * Lazy-resolve Node.js `fs` module.
 * Tries require('fs') first (available in CJS/UMD Node.js builds),
 * then falls back to dynamic import('fs') for ESM.
 * The import() call is wrapped in Function() so ES5 parsers (IE11) don't
 * choke on the syntax — it's only evaluated at runtime in Node.js.
 * Returns a Promise resolving to the fs module or null in browsers.
 * Result is cached after first resolution.
 * @private
 * @returns {Promise<Object|null>} - Promise resolving to Node fs module or null
 */
bw._fsCache = undefined;  // undefined = not yet resolved, null = resolved but unavailable
bw._getFs = function() {
  if (bw._fsCache !== undefined) return Promise.resolve(bw._fsCache);
  if (!bw.isNodeJS()) { bw._fsCache = null; return Promise.resolve(null); }

  // Strategy 1: synchronous require (CJS / UMD in Node.js)
  if (typeof require === 'function') {
    try {
      bw._fsCache = require('fs');
      return Promise.resolve(bw._fsCache);
    } catch(e) { /* require not available or failed, try import */ }
  }

  // Strategy 2: dynamic import (ESM in Node.js)
  // Wrapped in Function() so the import() keyword isn't parsed by ES5 engines
  try {
    var _importDynamic = new Function('m', 'return import(m)');
    return _importDynamic('fs').then(function(mod) {
      bw._fsCache = mod.default || mod;
      return bw._fsCache;
    }).catch(function() {
      bw._fsCache = null;
      return null;
    });
  } catch(e) {
    // Function() construction failed (shouldn't happen, but safety net)
    bw._fsCache = null;
    return Promise.resolve(null);
  }
};

/**
 * Enhanced type detection that distinguishes arrays, dates, regexps, and more.
 *
 * Goes beyond `typeof` by using `Object.prototype.toString` to identify
 * specific object types. Returns lowercase strings for primitives and arrays,
 * PascalCase for built-in classes (Date, RegExp, Map, Set, etc.).
 *
 * @param {*} x - Value to examine
 * @param {boolean} [baseTypeOnly=false] - If true, return only the base type ("object" for all objects)
 * @returns {string} Type name as shown in table below
 * @category Core
 * @example
 * // Primitives (lowercase):
 * bw.typeOf("hello")         // => "string"
 * bw.typeOf(42)              // => "number"
 * bw.typeOf(true)            // => "boolean"
 * bw.typeOf(undefined)       // => "undefined"
 * bw.typeOf(null)            // => "null"
 * bw.typeOf(Symbol('x'))     // => "symbol"
 * bw.typeOf(42n)             // => "bigint"
 * bw.typeOf(() => {})        // => "function"
 *
 * // Arrays (lowercase):
 * bw.typeOf([1, 2, 3])       // => "array"
 *
 * // Built-in classes (PascalCase):
 * bw.typeOf(new Date())      // => "Date"
 * bw.typeOf(/abc/)           // => "RegExp"
 * bw.typeOf(new Error())     // => "Error"
 * bw.typeOf(new Map())       // => "Map"
 * bw.typeOf(new Set())       // => "Set"
 * bw.typeOf(new WeakMap())   // => "WeakMap"
 * bw.typeOf(new WeakSet())   // => "WeakSet"
 * bw.typeOf(Promise.resolve()) // => "Promise"
 *
 * // Typed arrays (PascalCase):
 * bw.typeOf(new Uint8Array())   // => "Uint8Array"
 * bw.typeOf(new Float64Array()) // => "Float64Array"
 * bw.typeOf(new ArrayBuffer(8)) // => "ArrayBuffer"
 *
 * // Plain objects and custom classes:
 * bw.typeOf({a: 1})          // => "Object"
 * bw.typeOf(new MyClass())   // => "MyClass" (constructor.name)
 *
 * // baseTypeOnly mode:
 * bw.typeOf([1,2], true)     // => "object"
 */
bw.typeOf = function(x, baseTypeOnly) {
  if (x === null) return "null";
  
  const basic = typeof x;
  
  if (basic !== "object") {
    return basic;  // covers: string, number, boolean, undefined, function, symbol, bigint
  }

  if (baseTypeOnly) return basic;
  
  const stringTag = Object.prototype.toString.call(x);
  
  const typeMap = {
    '[object Array]': 'array',
    '[object Date]': 'Date',
    '[object RegExp]': 'RegExp',
    '[object Error]': 'Error',
    '[object Promise]': 'Promise',
    '[object Map]': 'Map',
    '[object Set]': 'Set',
    '[object WeakMap]': 'WeakMap',
    '[object WeakSet]': 'WeakSet',
    '[object ArrayBuffer]': 'ArrayBuffer',
    '[object DataView]': 'DataView',
    '[object Int8Array]': 'Int8Array',
    '[object Uint8Array]': 'Uint8Array',
    '[object Uint8ClampedArray]': 'Uint8ClampedArray',
    '[object Int16Array]': 'Int16Array',
    '[object Uint16Array]': 'Uint16Array',
    '[object Int32Array]': 'Int32Array',
    '[object Uint32Array]': 'Uint32Array',
    '[object Float32Array]': 'Float32Array',
    '[object Float64Array]': 'Float64Array'
  };
  
  if (typeMap[stringTag]) {
    return typeMap[stringTag];
  }
  
  // Check for custom bitwrench types
  if (x._bw_type) {
    return x._bw_type;
  }
  
  // Try constructor name
  if (x.constructor && x.constructor.name) {
    return x.constructor.name;
  }
  
  return basic;
};

// Alias
bw.to = bw.typeOf;

/**
 * Generate a unique identifier string for DOM elements or application use.
 *
 * Uses `crypto.randomUUID()` when available (modern browsers), otherwise
 * falls back to a timestamp + counter + random combination. Optional prefix
 * creates namespaced IDs like `bw_card_<hex>` for easier debugging.
 *
 * @param {string} [prefix] - Optional namespace prefix (e.g. "card", "todo")
 * @returns {string} Unique identifier (e.g. "bw_card_a1b2c3d4")
 * @category Identifiers
 * @example
 * bw.uuid()          // => "bw_m3x9k_1_7f2h4j6a8"
 * bw.uuid('card')    // => "bw_card_a1b2c3d4e5f6"
 */
bw.uuid = function(prefix) {
  // Optional prefix creates IDs like bw_card_<hex>, bw_todo_<hex>, etc.
  // Without prefix: bw_<hex>
  var tag = prefix ? 'bw_' + prefix + '_' : 'bw_';

  // Use crypto.randomUUID if available (modern browsers)
  if (bw._isBrowser && crypto && crypto.randomUUID) {
    return tag + crypto.randomUUID().replace(/-/g, '');
  }

  // Fallback for older browsers and Node.js
  const timestamp = Date.now().toString(36);
  const counter = (++bw._idCounter).toString(36);
  const random = Math.random().toString(36).substring(2, 11);

  return `${tag}${timestamp}_${counter}_${random}`;
};

/**
 * Escape HTML special characters to prevent XSS.
 *
 * Converts &, <, >, ", ', and / to their HTML entity equivalents.
 * Used automatically by `bw.html()` unless raw mode is enabled.
 *
 * @param {string} str - String to escape
 * @returns {string} Escaped string safe for HTML insertion
 * @category Identifiers
 * @see bw.html
 * @example
 * bw.escapeHTML('<b>Hello</b> & "world"')
 * // => '&lt;b&gt;Hello&lt;&#x2F;b&gt; &amp; &quot;world&quot;'
 */
bw.escapeHTML = function(str) {
  if (typeof str !== 'string') return '';
  
  const escapeMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;'
  };
  
  return str.replace(/[&<>"'\/]/g, (char) => escapeMap[char]);
};

/**
 * Normalize CSS class names by converting underscores to hyphens for bw-prefixed classes.
 *
 * Allows users to write either `bw_card` or `bw-card` and get consistent
 * hyphenated output. Only converts the `bw_` prefix — other underscores are untouched.
 *
 * @param {string} classStr - Class string to normalize
 * @returns {string} Normalized class string with hyphens
 * @category Identifiers
 * @example
 * bw.normalizeClass('bw_card bw_btn')  // => 'bw-card bw-btn'
 * bw.normalizeClass('my_class')         // => 'my_class' (unchanged)
 */
bw.normalizeClass = function(classStr) {
  if (typeof classStr !== 'string') return classStr;
  return classStr.replace(/\bbw_/g, 'bw-');
};

/**
 * Convert a TACO object (or array of TACOs) to an HTML string.
 *
 * This is the core rendering function — it works in both Node.js and browsers.
 * Use it for server-side rendering, static site generation, or generating
 * HTML snippets. Content is HTML-escaped by default; pass `{ raw: true }`
 * to insert raw HTML.
 *
 * @param {Object|Array|string} taco - TACO object, array of TACOs, or string
 * @param {Object} [options] - Rendering options
 * @param {boolean} [options.raw=false] - If true, skip HTML escaping on content
 * @returns {string} HTML string
 * @category DOM Generation
 * @see bw.createDOM
 * @see bw.DOM
 * @example
 * bw.html({ t: 'h1', c: 'Hello' })
 * // => '<h1>Hello</h1>'
 *
 * bw.html({ t: 'div', a: { class: 'card' }, c: [
 *   { t: 'p', c: 'Content here' }
 * ]})
 * // => '<div class="card"><p>Content here</p></div>'
 */
bw.html = function(taco, options = {}) {
  // Handle null/undefined
  if (taco == null) return '';
  
  // Handle arrays of TACOs
  if (Array.isArray(taco)) {
    return taco.map(t => bw.html(t, options)).join('');
  }
  
  // Handle primitives and non-TACO objects
  if (typeof taco !== 'object' || !taco.t) {
    return options.raw ? String(taco) : bw.escapeHTML(String(taco));
  }
  
  const { t: tag, a: attrs = {}, c: content, o: opts = {} } = taco;
  
  // Self-closing tags
  const selfClosing = ['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 
                       'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'];
  const isSelfClosing = selfClosing.includes(tag.toLowerCase());
  
  // Build attributes string
  let attrStr = '';
  
  for (const [key, value] of Object.entries(attrs)) {
    // Skip null, undefined, false
    if (value == null || value === false) continue;
    
    // Skip event handlers (they're for DOM only)
    if (key.startsWith('on')) continue;
    
    if (key === 'style' && typeof value === 'object') {
      // Convert style object to string
      const styleStr = Object.entries(value)
        .filter(([_, v]) => v != null)
        .map(([k, v]) => `${k}:${v}`)
        .join(';');
      if (styleStr) {
        attrStr += ` style="${bw.escapeHTML(styleStr)}"`;
      }
    } else if (key === 'class') {
      // Handle class as array or string, normalize bw_ to bw-
      const classStr = bw.normalizeClass(
        Array.isArray(value)
          ? value.filter(Boolean).join(' ')
          : String(value)
      );
      if (classStr) {
        attrStr += ` class="${bw.escapeHTML(classStr)}"`;
      }
    } else if (value === true) {
      // Boolean attributes
      attrStr += ` ${key}`;
    } else {
      // Regular attributes
      attrStr += ` ${key}="${bw.escapeHTML(String(value))}"`;
    }
  }

  // Add bw-id as a class if lifecycle hooks present
  if ((opts.mounted || opts.unmount) && !attrs.class?.includes('bw-id-')) {
    const id = opts.bw_id || bw.uuid();
    attrs.class || '';
    attrStr = attrStr.replace(/class="([^"]*)"/, (match, classes) => {
      return `class="${classes} bw-id-${id}"`.trim();
    });
    if (!attrStr.includes('class=')) {
      attrStr += ` class="bw-id-${id}"`;
    }
  }
  
  // Build HTML
  if (isSelfClosing) {
    return `<${tag}${attrStr} />`;
  }
  
  // Process content recursively
  const contentStr = content != null ? bw.html(content, options) : '';
  
  return `<${tag}${attrStr}>${contentStr}</${tag}>`;
};

/**
 * Create a live DOM element from a TACO object (browser only).
 *
 * Unlike `bw.html()` which returns a string, this creates real DOM elements
 * with event handlers, lifecycle hooks (mounted/unmount), and state. Used
 * internally by `bw.DOM()`. Throws in Node.js — use `bw.html()` instead.
 *
 * @param {Object} taco - TACO object with {t, a, c, o}
 * @param {Object} [options] - Creation options
 * @returns {Element|Text} DOM element or text node
 * @category DOM Generation
 * @see bw.html
 * @see bw.DOM
 * @example
 * var el = bw.createDOM({
 *   t: 'button',
 *   a: { class: 'bw-btn', onclick: () => alert('clicked') },
 *   c: 'Click Me'
 * });
 * document.body.appendChild(el);
 */
bw.createDOM = function(taco, options = {}) {
  if (!bw._isBrowser) {
    throw new Error('bw.createDOM requires a DOM environment (document/window). Use bw.html() instead.');
  }
  
  // Handle null/undefined
  if (taco == null) return document.createTextNode('');
  
  // Handle text nodes
  if (typeof taco !== 'object' || !taco.t) {
    return document.createTextNode(String(taco));
  }
  
  const { t: tag, a: attrs = {}, c: content, o: opts = {} } = taco;
  
  // Create element
  const el = document.createElement(tag);
  
  // Set attributes
  for (const [key, value] of Object.entries(attrs)) {
    if (value == null || value === false) continue;
    
    if (key === 'style' && typeof value === 'object') {
      // Apply styles directly
      Object.assign(el.style, value);
    } else if (key === 'class') {
      // Handle class as array or string, normalize bw_ to bw-
      const classStr = bw.normalizeClass(
        Array.isArray(value)
          ? value.filter(Boolean).join(' ')
          : String(value)
      );
      if (classStr) {
        el.className = classStr;
      }
    } else if (key.startsWith('on') && typeof value === 'function') {
      // Event handlers
      const eventName = key.slice(2).toLowerCase();
      el.addEventListener(eventName, value);
    } else if (key === 'value' && tag === 'input') {
      // Special handling for input value
      el.value = value;
    } else if (value === true) {
      // Boolean attributes
      el.setAttribute(key, '');
    } else {
      // Regular attributes
      el.setAttribute(key, String(value));
    }
  }
  
  // Add children
  if (content != null) {
    if (Array.isArray(content)) {
      content.forEach(child => {
        if (child != null) {
          el.appendChild(bw.createDOM(child, options));
        }
      });
    } else if (typeof content === 'object' && content.t) {
      el.appendChild(bw.createDOM(content, options));
    } else {
      el.textContent = String(content);
    }
  }
  
  // Handle lifecycle hooks and state
  if (opts.mounted || opts.unmount || opts.render || opts.state) {
    const id = attrs['data-bw-id'] || bw.uuid();
    el.setAttribute('data-bw-id', id);

    // Store state
    if (opts.state) {
      el._bw_state = opts.state;
    }

    // o.render — first-class render function (replaces mounted boilerplate)
    if (opts.render) {
      el._bw_render = opts.render;

      if (opts.mounted) {
        console.warn('bw.createDOM: o.render and o.mounted are mutually exclusive. o.render wins.');
      }

      // Queue initial render (same timing as mounted)
      if (document.body.contains(el)) {
        opts.render(el, el._bw_state || {});
      } else {
        requestAnimationFrame(() => {
          if (document.body.contains(el)) {
            opts.render(el, el._bw_state || {});
          }
        });
      }
    } else if (opts.mounted) {
      // Queue mounted callback (legacy pattern)
      if (document.body.contains(el)) {
        opts.mounted(el, el._bw_state || {});
      } else {
        requestAnimationFrame(() => {
          if (document.body.contains(el)) {
            opts.mounted(el, el._bw_state || {});
          }
        });
      }
    }

    // Store unmount callback
    if (opts.unmount) {
      bw._unmountCallbacks.set(id, () => {
        opts.unmount(el, el._bw_state || {});
      });
    }
  }
  
  return el;
};

/**
 * Mount a TACO object into a DOM element, replacing its contents (browser only).
 *
 * This is the primary way to render bitwrench UI to the page. It cleans up
 * any existing children (calling unmount hooks), then renders the TACO into
 * the target. The target element itself is preserved — only its children change.
 *
 * @param {string|Element} target - CSS selector or DOM element to mount into
 * @param {Object} taco - TACO object to render
 * @param {Object} [options] - Mount options
 * @returns {Element} Target element
 * @category DOM Generation
 * @see bw.html
 * @see bw.createDOM
 * @see bw.cleanup
 * @example
 * bw.DOM('#app', {
 *   t: 'div', a: { class: 'card' },
 *   c: [
 *     { t: 'h2', c: 'Hello' },
 *     { t: 'p', c: 'Built with bitwrench.' }
 *   ]
 * });
 */
bw.DOM = function(target, taco, options = {}) {
  if (!bw._isBrowser) {
    throw new Error('bw.DOM requires a DOM environment (document/window). Use bw.html() instead.');
  }
  
  // Get target element
  const targetEl = typeof target === 'string'
    ? document.querySelector(target)
    : target;
    
  if (!targetEl) {
    console.error('bw.DOM: Target element not found:', target);
    return null;
  }
  
  // Clean up existing children (but preserve the target's own state, render, and subs —
  // the target is the mount point, not the content being replaced)
  const savedState = targetEl._bw_state;
  const savedRender = targetEl._bw_render;
  const savedBwId = targetEl.getAttribute('data-bw-id');
  const savedSubs = targetEl._bw_subs;

  // Temporarily remove _bw_subs so cleanup doesn't call them
  // (children's subs will still be cleaned up normally)
  delete targetEl._bw_subs;

  bw.cleanup(targetEl);

  // Restore the target's own state/render/subs after cleanup
  if (savedState !== undefined) targetEl._bw_state = savedState;
  if (savedRender) targetEl._bw_render = savedRender;
  if (savedBwId) targetEl.setAttribute('data-bw-id', savedBwId);
  if (savedSubs) targetEl._bw_subs = savedSubs;

  // Clear and mount new content
  targetEl.innerHTML = '';
  
  if (taco != null) {
    // Handle component handles (objects with element property)
    if (taco.element instanceof Element) {
      targetEl.appendChild(taco.element);
    }
    // Handle arrays
    else if (Array.isArray(taco)) {
      taco.forEach(t => {
        if (t != null) {
          if (t.element instanceof Element) {
            targetEl.appendChild(t.element);
          } else {
            targetEl.appendChild(bw.createDOM(t, options));
          }
        }
      });
    }
    // Handle TACO objects
    else {
      targetEl.appendChild(bw.createDOM(taco, options));
    }
  }
  
  return targetEl;
};

/**
 * Compile props into getter/setter functions for reactive updates.
 *
 * Used internally by `bw.renderComponent()`. Creates a proxy-like object
 * where setting a property triggers `handle.onPropChange()`.
 *
 * @param {Object} handle - Component handle
 * @param {Object} props - Initial props
 * @returns {Object} Compiled props object with getters/setters
 * @category DOM Generation
 */
bw.compileProps = function(handle, props = {}) {
  const compiledProps = {};
  
  Object.keys(props).forEach(key => {
    // Create getter/setter for each prop
    Object.defineProperty(compiledProps, key, {
      get() {
        return handle._props[key];
      },
      set(value) {
        const oldValue = handle._props[key];
        if (oldValue !== value) {
          handle._props[key] = value;
          // Trigger update if prop changed
          if (handle.onPropChange) {
            handle.onPropChange(key, value, oldValue);
          }
        }
      },
      enumerable: true,
      configurable: true
    });
  });
  
  return compiledProps;
};

/**
 * Render a TACO component and return an enhanced handle object.
 *
 * The handle provides compiled props, state management, child registration,
 * and a destroy method. Used internally by `bw.createCard()`, `bw.createTable()`, etc.
 *
 * @param {Object} taco - TACO object to render
 * @param {Object} [options] - Render options
 * @returns {Object} Component handle with element, props, state, update(), destroy()
 * @category DOM Generation
 */
bw.renderComponent = function(taco, options = {}) {
  const element = bw.createDOM(taco, options);
  
  // Enhanced handle with prop compilation
  const handle = {
    element,
    taco,
    _props: { ...taco.a },  // Store props internally
    _state: taco.o?.state || {},
    _children: {},  // Store child component references
    
    // Get compiled props with getters/setters
    get props() {
      if (!this._compiledProps) {
        this._compiledProps = bw.compileProps(this, this._props);
      }
      return this._compiledProps;
    },
    
    /**
     * Query all matching elements within this component
     * @param {string} selector - CSS selector
     * @returns {NodeList} Matching elements
     */
    $(selector) {
      return this.element.querySelectorAll(selector);
    },
    
    /**
     * Query the first matching element within this component
     * @param {string} selector - CSS selector
     * @returns {Element|null} First matching element or null
     */
    $first(selector) {
      return this.element.querySelector(selector);
    },
    
    /**
     * Update component with new props and re-render in place
     * @param {Object} newProps - Properties to merge into current props
     * @returns {Object} this handle (for chaining)
     */
    update(newProps) {
      // Update internal props
      Object.assign(this._props, newProps);
      
      // Rebuild TACO with new props
      const newTaco = { ...this.taco, a: { ...this.taco.a, ...newProps } };
      const newElement = bw.createDOM(newTaco, options);
      
      // Replace in DOM
      this.element.replaceWith(newElement);
      this.element = newElement;
      this.taco = newTaco;
      
      return this;
    },
    
    /**
     * Re-render the component from its current TACO, replacing the DOM element
     * @returns {Object} this handle (for chaining)
     */
    render() {
      const newElement = bw.createDOM(this.taco, options);
      this.element.replaceWith(newElement);
      this.element = newElement;
      return this;
    },
    
    /**
     * Called when a compiled prop value changes. Override to customize behavior.
     * Default implementation triggers a full re-render.
     * @param {string} key - Property name that changed
     * @param {*} newValue - New property value
     * @param {*} oldValue - Previous property value
     */
    onPropChange(key, newValue, oldValue) {
      // Auto re-render on prop change by default
      this.render();
    },
    
    // State management
    get state() {
      return this._state;
    },
    
    set state(newState) {
      this._state = newState;
      this.render();
    },
    
    /**
     * Merge state updates and re-render the component
     * @param {Object} updates - State properties to merge
     * @returns {Object} this handle (for chaining)
     */
    setState(updates) {
      Object.assign(this._state, updates);
      this.render();
      return this;
    },

    /**
     * Register a child component under a name for later retrieval
     * @param {string} name - Child name key
     * @param {Object} component - Child component handle
     * @returns {Object} this handle (for chaining)
     */
    addChild(name, component) {
      this._children[name] = component;
      return this;
    },
    
    /**
     * Retrieve a registered child component by name
     * @param {string} name - Child name key
     * @returns {Object|undefined} Child component handle
     */
    getChild(name) {
      return this._children[name];
    },

    /**
     * Destroy this component and all registered children
     *
     * Calls destroy() recursively on children, runs bw.cleanup(),
     * removes the element from DOM, and clears all internal references.
     */
    destroy() {
      // Destroy children first
      Object.values(this._children).forEach(child => {
        if (child && child.destroy) child.destroy();
      });
      
      // Clean up this component
      bw.cleanup(this.element);
      this.element.remove();
      
      // Clear references
      this._children = {};
      this._props = {};
      this._state = {};
      this._compiledProps = null;
    }
  };
  
  // Store handle reference on element
  element._bwHandle = handle;
  
  return handle;
};

/**
 * Clean up a DOM element and all its children by calling unmount callbacks,
 * removing pub/sub subscriptions, and clearing state/render references.
 *
 * Called automatically by `bw.DOM()` before re-rendering. Call manually when
 * removing elements to prevent memory leaks from orphaned callbacks.
 *
 * @param {Element} element - DOM element to clean up
 * @category DOM Generation
 * @see bw.DOM
 * @example
 * var el = document.querySelector('#my-widget');
 * bw.cleanup(el);   // runs unmount hooks, clears _bw_state, _bw_render
 * el.remove();       // safe to remove from DOM now
 */
bw.cleanup = function(element) {
  if (!bw._isBrowser || !element) return;

  // Find all elements with data-bw-id
  const elements = element.querySelectorAll('[data-bw-id]');

  elements.forEach(el => {
    const id = el.getAttribute('data-bw-id');
    const callback = bw._unmountCallbacks.get(id);

    if (callback) {
      callback();
      bw._unmountCallbacks.delete(id);
    }

    // Clean up pub/sub subscriptions tied to this element
    if (el._bw_subs) {
      el._bw_subs.forEach(function(unsub) { unsub(); });
      delete el._bw_subs;
    }

    // Clean up state and render
    delete el._bw_state;
    delete el._bw_render;
  });

  // Check element itself
  const id = element.getAttribute('data-bw-id');
  if (id) {
    const callback = bw._unmountCallbacks.get(id);
    if (callback) {
      callback();
      bw._unmountCallbacks.delete(id);
    }
    // Clean up pub/sub subscriptions tied to element itself
    if (element._bw_subs) {
      element._bw_subs.forEach(function(unsub) { unsub(); });
      delete element._bw_subs;
    }
    delete element._bw_state;
    delete element._bw_render;
  }
};

// ===================================================================================
// State Management: update, patch, emit/on
// ===================================================================================

/**
 * Trigger re-render of a component by calling its stored `o.render` function.
 *
 * This is the recommended way to update a component after changing its state.
 * Calls `el._bw_render(el, state)` and emits `bw:statechange` so other
 * components can react without tight coupling.
 *
 * @param {string|Element} target - CSS selector or DOM element with _bw_render
 * @returns {Element|null} The element, or null if not found / no render function
 * @category State Management
 * @see bw.patch
 * @example
 * // Given a counter element with o.render
 * el._bw_state.count++;
 * bw.update(el);  // re-renders, emits bw:statechange
 */
bw.update = function(target) {
  var el = typeof target === 'string' ? document.querySelector(target) : target;
  if (el && el._bw_render) {
    el._bw_render(el, el._bw_state || {});
    bw.emit(el, 'statechange', el._bw_state);
  }
  return el || null;
};

/**
 * Targeted DOM update by element ID — change one element's content or attribute
 * without rebuilding the entire component tree.
 *
 * Use `bw.patch()` for lightweight value updates (scores, labels, counters)
 * and `bw.update()` for full structural re-renders.
 *
 * @param {string|Element} id - Element ID string or DOM element
 * @param {string|Object} content - New text content, or TACO object to replace children
 * @param {string} [attr] - If provided, sets this attribute instead of content
 * @returns {Element|null} The patched element, or null if not found
 * @category State Management
 * @see bw.patchAll
 * @see bw.update
 * @example
 * bw.patch('score-display', '42');          // update text content
 * bw.patch('status', 'active', 'class');    // update an attribute
 * bw.patch('info', { t: 'em', c: 'new' }); // replace children with TACO
 */
bw.patch = function(id, content, attr) {
  var el = typeof id === 'string' ? document.getElementById(id) : id;
  if (!el) return null;

  if (attr) {
    // Patch an attribute
    el.setAttribute(attr, String(content));
  } else if (typeof content === 'object' && content !== null && content.t) {
    // Patch with a TACO — replace children
    el.innerHTML = '';
    el.appendChild(bw.createDOM(content));
  } else {
    // Patch text content
    el.textContent = String(content);
  }
  return el;
};

/**
 * Batch version of `bw.patch()` — update multiple elements in one call.
 *
 * Useful for updating several independent values simultaneously,
 * such as a dashboard with multiple counters.
 *
 * @param {Object} patches - Map of { elementId: newContent, ... }
 * @returns {Object} Map of { elementId: patchedElement|null, ... }
 * @category State Management
 * @see bw.patch
 * @example
 * bw.patchAll({
 *   'cpu-display': '78%',
 *   'mem-display': '4.2 GB',
 *   'disk-display': '120 GB free'
 * });
 */
bw.patchAll = function(patches) {
  var results = {};
  for (var id in patches) {
    if (patches.hasOwnProperty(id)) {
      results[id] = bw.patch(id, patches[id]);
    }
  }
  return results;
};

/**
 * Emit a custom DOM event on an element.
 *
 * Events are prefixed with `bw:` to avoid collision with native events and
 * bubble by default so ancestor elements can listen. Use with `bw.on()` for
 * DOM-scoped communication between components.
 *
 * @param {string|Element} target - CSS selector or DOM element
 * @param {string} eventName - Event name (will be prefixed with 'bw:')
 * @param {*} [detail] - Data to pass with the event
 * @category Events (DOM)
 * @see bw.on
 * @example
 * bw.emit('#my-widget', 'statechange', { count: 42 });
 * // Dispatches CustomEvent 'bw:statechange' on the element
 */
bw.emit = function(target, eventName, detail) {
  var el = typeof target === 'string' ? document.querySelector(target) : target;
  if (el) {
    el.dispatchEvent(new CustomEvent('bw:' + eventName, {
      bubbles: true,
      detail: detail || {}
    }));
  }
};

/**
 * Listen for a custom bitwrench event on a DOM element.
 *
 * Handler receives `(detail, event)` for convenience — the detail object
 * is the first argument so you don't need to destructure `e.detail`.
 * Events bubble, so you can listen on an ancestor element.
 *
 * @param {string|Element} target - CSS selector or DOM element
 * @param {string} eventName - Event name (will be prefixed with 'bw:')
 * @param {Function} handler - Called with (detail, event)
 * @returns {Element|null} The element (for chaining), or null if not found
 * @category Events (DOM)
 * @see bw.emit
 * @example
 * bw.on(document.body, 'statechange', function(detail) {
 *   console.log('State changed:', detail);
 * });
 */
bw.on = function(target, eventName, handler) {
  var el = typeof target === 'string' ? document.querySelector(target) : target;
  if (el) {
    el.addEventListener('bw:' + eventName, function(e) {
      handler(e.detail, e);
    });
  }
  return el || null;
};

// ===================================================================================
// Topic-Based Pub/Sub: bw.pub(), bw.sub(), bw.unsub()
//
// Separate from emit/on (DOM-scoped CustomEvents). Pub/sub is application-scoped,
// topic-based, and decoupled from the DOM tree. Try/catch per subscriber so one
// bad handler can't break others.
// ===================================================================================

/**
 * Publish to a topic, calling all subscribers in registration order.
 *
 * Application-scoped pub/sub decoupled from the DOM tree. Each subscriber
 * is wrapped in try/catch so one bad handler can't break others.
 * Use `bw.pub()`/`bw.sub()` for app-wide communication; use `bw.emit()`/`bw.on()`
 * for DOM-scoped events.
 *
 * @param {string} topic - Topic name (plain string, no prefix)
 * @param {*} [detail] - Data to pass to subscribers
 * @returns {number} Count of successfully called subscribers
 * @category Pub/Sub
 * @see bw.sub
 * @example
 * bw.pub('score:updated', { player: 'X', score: 10 });
 */
bw.pub = function(topic, detail) {
  var subs = bw._topics[topic];
  if (!subs || subs.length === 0) return 0;
  var snapshot = subs.slice(); // safe against unsub during iteration
  var called = 0;
  for (var i = 0; i < snapshot.length; i++) {
    try {
      snapshot[i].handler(detail);
      called++;
    } catch (err) {
      console.warn('bw.pub: subscriber error on topic "' + topic + '":', err);
    }
  }
  return called;
};

/**
 * Subscribe to a topic. Returns an unsub() function.
 *
 * Optional third argument ties the subscription to a DOM element's lifecycle —
 * when `bw.cleanup()` is called on that element, the subscription is automatically
 * removed, preventing memory leaks.
 *
 * @param {string} topic - Topic name
 * @param {Function} handler - Called with (detail) on each publish
 * @param {Element} [el] - Optional DOM element to tie lifecycle to
 * @returns {Function} Call to unsubscribe
 * @category Pub/Sub
 * @see bw.pub
 * @see bw.unsub
 * @example
 * var unsub = bw.sub('score:updated', function(detail) {
 *   console.log(detail.player, 'scored', detail.score);
 * });
 * // Later: unsub() to stop listening
 */
bw.sub = function(topic, handler, el) {
  var id = ++bw._subIdCounter;
  if (!bw._topics[topic]) bw._topics[topic] = [];
  bw._topics[topic].push({ handler: handler, id: id });

  var unsub = function() {
    var subs = bw._topics[topic];
    if (!subs) return;
    bw._topics[topic] = subs.filter(function(s) { return s.id !== id; });
    if (bw._topics[topic].length === 0) delete bw._topics[topic];
  };

  // Tie to element lifecycle if provided
  if (el) {
    if (!el._bw_subs) el._bw_subs = [];
    el._bw_subs.push(unsub);
    // Ensure element has data-bw-id so bw.cleanup() finds it
    if (!el.getAttribute('data-bw-id')) {
      var bwId = 'bw_sub_' + id;
      el.setAttribute('data-bw-id', bwId);
    }
  }

  return unsub;
};

/**
 * Unsubscribe a handler by reference from a topic.
 *
 * Removes ALL instances of the given handler on the topic.
 * Alternative to calling the unsub function returned by `bw.sub()`.
 *
 * @param {string} topic - Topic name
 * @param {Function} handler - The handler to remove (by reference equality)
 * @returns {number} Count of removed subscriptions
 * @category Pub/Sub
 * @see bw.sub
 */
bw.unsub = function(topic, handler) {
  var subs = bw._topics[topic];
  if (!subs) return 0;
  var before = subs.length;
  bw._topics[topic] = subs.filter(function(s) { return s.handler !== handler; });
  var removed = before - bw._topics[topic].length;
  if (bw._topics[topic].length === 0) delete bw._topics[topic];
  return removed;
};

/**
 * Generate CSS from JavaScript objects.
 *
 * Converts an object of `{ selector: { prop: value } }` rules into a CSS string.
 * CamelCase property names are auto-converted to kebab-case (e.g. `fontSize` → `font-size`).
 * Accepts nested arrays of rule objects.
 *
 * @param {Object|Array|string} rules - CSS rules as JS objects, array of rule objects, or raw CSS string
 * @param {Object} [options] - Generation options
 * @param {boolean} [options.minify=false] - Minify output (no whitespace)
 * @returns {string} CSS string
 * @category CSS & Styling
 * @see bw.injectCSS
 * @example
 * bw.css({
 *   '.card': { padding: '1rem', fontSize: '14px', borderRadius: '8px' }
 * })
 * // => '.card {\n  padding: 1rem;\n  font-size: 14px;\n  border-radius: 8px;\n}'
 */
bw.css = function(rules, options = {}) {
  const { minify = false, pretty = !minify } = options;

  if (typeof rules === 'string') return rules;

  let css = '';
  const indent = pretty ? '  ' : '';
  const newline = pretty ? '\n' : '';
  const space = pretty ? ' ' : '';

  if (Array.isArray(rules)) {
    css = rules.map(rule => bw.css(rule, options)).join(newline);
  } else if (typeof rules === 'object') {
    Object.entries(rules).forEach(([selector, styles]) => {
      if (typeof styles === 'object' && !Array.isArray(styles)) {
        // Handle @media, @keyframes, @supports — recurse into nested block
        if (selector.charAt(0) === '@') {
          const inner = bw.css(styles, options);
          if (inner) {
            css += `${selector}${space}{${newline}${inner}${newline}}${newline}`;
          }
          return;
        }
        const declarations = Object.entries(styles)
          .filter(([_, value]) => value != null)
          .map(([prop, value]) => {
            // Convert camelCase to kebab-case
            const kebabProp = prop.replace(/[A-Z]/g, m => '-' + m.toLowerCase());
            return `${indent}${kebabProp}:${space}${value};`;
          })
          .join(newline);

        if (declarations) {
          css += `${selector}${space}{${newline}${declarations}${newline}}${newline}`;
        }
      }
    });
  }

  return css.trim();
};

/**
 * Inject CSS into the document head (browser only).
 *
 * Creates or reuses a `<style>` element (identified by `id`). Can accept
 * raw CSS strings or JS rule objects (which are converted via `bw.css()`).
 * By default appends to existing content; set `append: false` to replace.
 *
 * @param {string|Object|Array} css - CSS string, or JS rule objects to convert
 * @param {Object} [options] - Injection options
 * @param {string} [options.id='bw-styles'] - ID for the style element
 * @param {boolean} [options.append=true] - Append to existing CSS (false to replace)
 * @returns {Element} The style element
 * @category CSS & Styling
 * @see bw.css
 * @see bw.loadDefaultStyles
 * @example
 * bw.injectCSS('.my-class { color: red; }');
 * bw.injectCSS({ '.card': { padding: '1rem' } }, { id: 'card-styles' });
 */
bw.injectCSS = function(css, options = {}) {
  if (!bw._isBrowser) {
    console.warn('bw.injectCSS requires a DOM environment');
    return null;
  }
  
  const { id = 'bw-styles', append = true } = options;
  
  // Get or create style element
  let styleEl = document.getElementById(id);
  
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = id;
    styleEl.type = 'text/css';
    document.head.appendChild(styleEl);
  }
  
  // Convert CSS if needed
  const cssStr = typeof css === 'string' ? css : bw.css(css, options);
  
  // Set or append CSS
  if (append && styleEl.textContent) {
    styleEl.textContent += '\n' + cssStr;
  } else {
    styleEl.textContent = cssStr;
  }
  
  return styleEl;
};

/**
 * Merge multiple style objects into one (left-to-right).
 *
 * Like `Object.assign()` for styles, but filters out null/undefined arguments.
 * Compose inline styles or CSS rule objects without mutation.
 *
 * @param {...Object} styles - Style objects to merge (left-to-right)
 * @returns {Object} Merged style object
 * @category CSS & Styling
 * @see bw.u
 * @example
 * var style = bw.s(bw.u.flex, bw.u.gap4, { color: 'red' });
 * // => { display: 'flex', gap: '1rem', color: 'red' }
 */
bw.s = function() {
  var result = {};
  for (var i = 0; i < arguments.length; i++) {
    var arg = arguments[i];
    if (arg && typeof arg === 'object') Object.assign(result, arg);
  }
  return result;
};

/**
 * Pre-built CSS utility objects (like Tailwind utilities, but in JS).
 *
 * Compose with `bw.s()` to build inline styles without writing raw CSS strings.
 * Includes flex, padding, margin, typography, color, border, and transition utilities.
 *
 * @category CSS & Styling
 * @see bw.s
 * @example
 * { t: 'div', a: { style: bw.s(bw.u.flex, bw.u.gap4, bw.u.p4) },
 *   c: 'Flexbox with 1rem gap and padding' }
 */
bw.u = {
  // Display
  flex: { display: 'flex' },
  flexCol: { display: 'flex', flexDirection: 'column' },
  flexRow: { display: 'flex', flexDirection: 'row' },
  flexWrap: { display: 'flex', flexWrap: 'wrap' },
  block: { display: 'block' },
  inline: { display: 'inline' },
  hidden: { display: 'none' },

  // Flex alignment
  justifyCenter: { justifyContent: 'center' },
  justifyBetween: { justifyContent: 'space-between' },
  justifyEnd: { justifyContent: 'flex-end' },
  alignCenter: { alignItems: 'center' },
  alignStart: { alignItems: 'flex-start' },
  alignEnd: { alignItems: 'flex-end' },

  // Gap (0.25rem increments)
  gap1: { gap: '0.25rem' },
  gap2: { gap: '0.5rem' },
  gap3: { gap: '0.75rem' },
  gap4: { gap: '1rem' },
  gap6: { gap: '1.5rem' },
  gap8: { gap: '2rem' },

  // Padding
  p0: { padding: '0' },
  p1: { padding: '0.25rem' },
  p2: { padding: '0.5rem' },
  p3: { padding: '0.75rem' },
  p4: { padding: '1rem' },
  p6: { padding: '1.5rem' },
  p8: { padding: '2rem' },
  px4: { paddingLeft: '1rem', paddingRight: '1rem' },
  py2: { paddingTop: '0.5rem', paddingBottom: '0.5rem' },
  py4: { paddingTop: '1rem', paddingBottom: '1rem' },

  // Margin (same scale)
  m0: { margin: '0' },
  m4: { margin: '1rem' },
  mt2: { marginTop: '0.5rem' },
  mt4: { marginTop: '1rem' },
  mb2: { marginBottom: '0.5rem' },
  mb4: { marginBottom: '1rem' },
  mx_auto: { marginLeft: 'auto', marginRight: 'auto' },

  // Typography
  textSm: { fontSize: '0.875rem' },
  textBase: { fontSize: '1rem' },
  textLg: { fontSize: '1.125rem' },
  textXl: { fontSize: '1.25rem' },
  text2xl: { fontSize: '1.5rem' },
  text3xl: { fontSize: '1.875rem' },
  bold: { fontWeight: '700' },
  semibold: { fontWeight: '600' },
  italic: { fontStyle: 'italic' },
  textCenter: { textAlign: 'center' },
  textRight: { textAlign: 'right' },

  // Colors (from design tokens)
  bgWhite: { background: '#ffffff' },
  bgTeal: { background: '#006666', color: '#ffffff' },
  textWhite: { color: '#ffffff' },
  textTeal: { color: '#006666' },
  textMuted: { color: '#888' },

  // Borders
  rounded: { borderRadius: '0.375rem' },
  roundedLg: { borderRadius: '0.5rem' },
  roundedFull: { borderRadius: '9999px' },
  border: { border: '1px solid #d8d8d8' },

  // Sizing
  wFull: { width: '100%' },
  hFull: { height: '100%' },

  // Transitions
  transition: { transition: 'all 0.2s ease' }
};

/**
 * Generate responsive CSS with media query breakpoints.
 *
 * Produces a CSS string with `@media` rules for sm (640px), md (768px),
 * lg (1024px), and xl (1280px) breakpoints. Pass the result to `bw.injectCSS()`.
 *
 * @param {string} selector - CSS selector
 * @param {Object} breakpoints - Object with keys: base, sm, md, lg, xl
 * @returns {string} Generated CSS string (pass to bw.injectCSS)
 * @category CSS & Styling
 * @see bw.css
 * @see bw.injectCSS
 * @example
 * var css = bw.responsive('.grid', {
 *   base: { gridTemplateColumns: '1fr' },
 *   md:   { gridTemplateColumns: '1fr 1fr' },
 *   lg:   { gridTemplateColumns: '1fr 1fr 1fr' }
 * });
 * bw.injectCSS(css);
 */
bw.responsive = function(selector, breakpoints) {
  var sizes = { sm: '640px', md: '768px', lg: '1024px', xl: '1280px' };
  var parts = [];
  Object.keys(breakpoints).forEach(function(key) {
    var rules = {};
    if (key === 'base') {
      rules[selector] = breakpoints[key];
      parts.push(bw.css(rules));
    } else if (sizes[key]) {
      rules[selector] = breakpoints[key];
      parts.push('@media (min-width: ' + sizes[key] + ') {\n' + bw.css(rules) + '\n}');
    }
  });
  return parts.join('\n');
};

/**
 * Map/scale a value from one range to another (linear interpolation).
 *
 * Useful for converting sensor data, normalizing values, or creating
 * visual scales. Supports optional clamping and exponential scaling.
 *
 * @param {number} x - Input value
 * @param {number} in0 - Input range start
 * @param {number} in1 - Input range end
 * @param {number} out0 - Output range start
 * @param {number} out1 - Output range end
 * @param {Object} [options] - Mapping options
 * @param {boolean} [options.clip=false] - Clamp result to output range
 * @param {number} [options.expScale=1] - Exponential scaling factor
 * @returns {number} Mapped value
 * @category Math
 * @see bw.clip
 * @example
 * bw.mapScale(50, 0, 100, 0, 1)  // => 0.5
 * bw.mapScale(75, 0, 100, 0, 255) // => 191.25
 */
bw.mapScale = function(x, in0, in1, out0, out1, options = {}) {
  const { clip = false, expScale = 1 } = options;
  
  // Normalize to 0-1
  let normalized = (x - in0) / (in1 - in0);
  
  // Apply exponential scaling
  if (expScale !== 1) {
    normalized = Math.pow(normalized, expScale);
  }
  
  // Map to output range
  let result = normalized * (out1 - out0) + out0;
  
  // Clip if requested
  if (clip) {
    const min = Math.min(out0, out1);
    const max = Math.max(out0, out1);
    result = Math.max(min, Math.min(max, result));
  }
  
  return result;
};

/**
 * Clamp a value between min and max bounds.
 *
 * @param {number} value - Value to clamp
 * @param {number} min - Minimum allowed value
 * @param {number} max - Maximum allowed value
 * @returns {number} Clamped value
 * @category Math
 * @see bw.mapScale
 * @example
 * bw.clip(150, 0, 100)  // => 100
 * bw.clip(-5, 0, 100)   // => 0
 * bw.clip(50, 0, 100)   // => 50
 */
bw.clip = function(value, min, max) {
  return Math.max(min, Math.min(max, value));
};

/**
 * DOM selection helper that always returns an array (browser only).
 *
 * Wraps `querySelectorAll` and normalizes the result to a plain Array
 * so you can use `.map()`, `.filter()`, etc. directly. Accepts CSS selectors,
 * single elements, NodeLists, or arrays.
 *
 * @param {string|Element|Array} selector - CSS selector, element, or array
 * @returns {Array} Array of DOM elements
 * @category DOM Selection
 * @example
 * bw.$('.card')       // => [div.card, div.card, ...]
 * bw.$(myElement)     // => [myElement]
 * bw.$('.card').map(el => el.textContent)
 */
if (bw._isBrowser) {
  bw.$ = function(selector) {
    if (!selector) return [];
    
    // Already an array
    if (Array.isArray(selector)) return selector;
    
    // Single element
    if (selector.nodeType) return [selector];
    
    // NodeList or HTMLCollection
    if (selector.length !== undefined && typeof selector !== 'string') {
      return Array.from(selector);
    }
    
    // CSS selector string
    if (typeof selector === 'string') {
      return Array.from(document.querySelectorAll(selector));
    }
    
    return [];
  };
  
  // Convenience single element selector
  bw.$.one = function(selector) {
    return bw.$(selector)[0] || null;
  };
}

/**
 * Load the built-in Bootstrap-inspired default stylesheet.
 *
 * Injects bitwrench's batteries-included CSS (buttons, cards, grids, forms,
 * alerts, badges, nav, tabs, etc.) into the document head. Call once at app startup.
 * Returns null in Node.js (no DOM).
 *
 * @param {Object} [options] - Style loading options
 * @param {boolean} [options.minify=true] - Minify the CSS output
 * @returns {Element|null} Style element if in browser, null in Node.js
 * @category CSS & Styling
 * @see bw.setTheme
 * @see bw.toggleDarkMode
 * @example
 * bw.loadDefaultStyles();  // inject all default CSS
 */
bw.loadDefaultStyles = function(options = {}) {
  const { minify = true, palette } = options;

  // 1. Inject structural CSS (layout, sizing — never changes with theme)
  if (bw._isBrowser) {
    var structuralCSS = bw.css(getStructuralStyles());
    bw.injectCSS(structuralCSS, { id: 'bw-structural', append: false, minify: minify });
  }

  // 2. Inject cosmetic CSS via generateTheme (colors, shadows, radii)
  var paletteConfig = Object.assign({}, DEFAULT_PALETTE_CONFIG, palette || {});
  var result = bw.generateTheme('', Object.assign({}, paletteConfig, { inject: true }));
  return result;
};

/**
 * Get the current theme configuration as a deep copy.
 *
 * @returns {Object} Theme object with colors, fonts, spacing, etc.
 * @category CSS & Styling
 * @see bw.setTheme
 */
bw.getTheme = function() {
  if (typeof console !== 'undefined' && console.warn) {
    console.warn('bw.getTheme() is deprecated. Use bw.generateTheme() instead.');
  }
  return JSON.parse(JSON.stringify(theme));
};

/**
 * Set theme overrides and optionally re-inject CSS custom properties.
 *
 * Merges your overrides into the current theme and updates `--bw-*` CSS
 * custom properties on `<html>` so all components pick up the changes live.
 *
 * @param {Object} overrides - Partial theme object to merge (e.g. { colors: { primary: '#ff0000' } })
 * @param {Object} [options] - Options
 * @param {boolean} [options.inject=true] - Whether to re-inject CSS (browser only)
 * @returns {Object} Updated theme
 * @category CSS & Styling
 * @see bw.getTheme
 * @see bw.loadDefaultStyles
 * @example
 * bw.setTheme({ colors: { primary: '#ff6600' } });
 */
bw.setTheme = function(overrides, options = {}) {
  if (typeof console !== 'undefined' && console.warn) {
    console.warn('bw.setTheme() is deprecated. Use bw.generateTheme() instead.');
  }
  const { inject = true } = options;
  updateTheme(overrides);

  // Update CSS custom properties if colors changed and we're in browser
  if (inject && bw._isBrowser && overrides.colors) {
    const root = document.documentElement;
    for (const [name, value] of Object.entries(overrides.colors)) {
      root.style.setProperty('--bw-' + name, value);
    }
  }

  return bw.getTheme();
};

/**
 * Toggle dark mode on/off.
 *
 * Adds/removes the `bw-dark` class on `<html>` and injects dark mode CSS
 * overrides. Pass `true`/`false` to force a mode, or omit to toggle.
 *
 * @param {boolean} [force] - Force dark (true) or light (false). Omit to toggle.
 * @returns {boolean} Whether dark mode is now active
 * @category CSS & Styling
 * @see bw.setTheme
 * @example
 * bw.toggleDarkMode();        // toggle
 * bw.toggleDarkMode(true);    // force dark
 * bw.toggleDarkMode(false);   // force light
 */
bw.toggleDarkMode = function(force) {
  const isDark = force !== undefined ? force : !theme.darkMode;
  theme.darkMode = isDark;

  if (bw._isBrowser) {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('bw-dark');
      // Generate palette-aware dark mode CSS, or fall back to default
      var palette = bw._activePalette || derivePalette(DEFAULT_PALETTE_CONFIG);
      var darkRules = generateDarkModeCSS(palette);
      var darkCSS = bw.css(darkRules);

      // Remove existing dark styles to allow regeneration
      var existing = document.getElementById('bw-dark-styles');
      if (existing) existing.remove();

      var styleEl = document.createElement('style');
      styleEl.id = 'bw-dark-styles';
      styleEl.textContent = darkCSS;
      document.head.appendChild(styleEl);
    } else {
      root.classList.remove('bw-dark');
      // Remove dark mode styles when switching to light
      var darkEl = document.getElementById('bw-dark-styles');
      if (darkEl) darkEl.remove();
    }
  }

  return isDark;
};

/**
 * Generate a complete, scoped theme from seed colors.
 *
 * Produces CSS for all themed components (buttons, alerts, badges, cards,
 * forms, nav, tables, tabs, list groups, pagination, progress, hero, utilities)
 * scoped under `.name` class. Multiple themes can coexist in the stylesheet.
 * Swap themes by changing the class on a container element.
 *
 * @param {string} name - CSS scope class (e.g. 'ocean'). Empty string = unscoped global.
 * @param {Object} config - Theme configuration
 * @param {string} config.primary - Primary brand color hex
 * @param {string} config.secondary - Secondary color hex
 * @param {string} [config.tertiary] - Tertiary/accent color hex (defaults to primary)
 * @param {string} [config.success='#198754'] - Success color hex
 * @param {string} [config.danger='#dc3545'] - Danger color hex
 * @param {string} [config.warning='#ffc107'] - Warning color hex
 * @param {string} [config.info='#0dcaf0'] - Info color hex
 * @param {string} [config.light='#f8f9fa'] - Light color hex
 * @param {string} [config.dark='#212529'] - Dark color hex
 * @param {string} [config.spacing='normal'] - 'compact' | 'normal' | 'spacious'
 * @param {string} [config.radius='md'] - 'none' | 'sm' | 'md' | 'lg' | 'pill'
 * @param {number} [config.fontSize=1.0] - Base font size scale factor
 * @param {boolean} [config.inject=true] - Inject into DOM (browser only)
 * @returns {Object} { css, palette, name }
 * @category CSS & Styling
 * @see bw.loadDefaultStyles
 * @example
 * // Generate and inject an ocean theme
 * bw.generateTheme('ocean', {
 *   primary: '#0077b6',
 *   secondary: '#90e0ef',
 *   tertiary: '#00b4d8'
 * });
 *
 * // Apply to a container
 * document.getElementById('app').classList.add('ocean');
 *
 * // Generate CSS for static export (Node.js)
 * var result = bw.generateTheme('sunset', {
 *   primary: '#e76f51',
 *   secondary: '#264653',
 *   tertiary: '#e9c46a',
 *   inject: false
 * });
 * fs.writeFileSync('sunset.css', result.css);
 */
bw.generateTheme = function(name, config) {
  if (!config || !config.primary || !config.secondary) {
    throw new Error('bw.generateTheme requires config.primary and config.secondary');
  }

  // Merge with defaults; if user didn't supply tertiary, default to their primary
  var fullConfig = Object.assign({}, DEFAULT_PALETTE_CONFIG, config);
  if (!config.tertiary) fullConfig.tertiary = fullConfig.primary;

  // Derive palette
  var palette = derivePalette(fullConfig);

  // Store active palette for dark mode
  bw._activePalette = palette;

  // Resolve layout
  var layout = resolveLayout(fullConfig);

  // Generate themed CSS rules
  var themedRules = generateThemedCSS(name, palette, layout);

  // Add underscore aliases
  var aliasedRules = addUnderscoreAliases(themedRules);

  // Convert to CSS string
  var cssStr = bw.css(aliasedRules);

  // Inject into DOM if requested and in browser
  var shouldInject = config.inject !== false;
  if (shouldInject && bw._isBrowser) {
    var styleId = name ? 'bw-theme-' + name : 'bw-theme-default';
    bw.injectCSS(cssStr, { id: styleId, append: false });
  }

  // Update bw.u color entries to reflect the palette
  if (!name) {
    bw.u.bgTeal = { background: palette.primary.base, color: palette.primary.textOn };
    bw.u.textTeal = { color: palette.primary.base };
    bw.u.bgWhite = { background: '#ffffff' };
    bw.u.textWhite = { color: '#ffffff' };
  }

  return { css: cssStr, palette: palette, name: name };
};

// Expose color utility functions on bw namespace
bw.hexToHsl = hexToHsl;
bw.hslToHex = hslToHex;
bw.adjustLightness = adjustLightness;
bw.mixColor = mixColor;
bw.relativeLuminance = relativeLuminance;
bw.textOnColor = textOnColor;
bw.deriveShades = deriveShades;
bw.derivePalette = derivePalette;

// Expose layout and theme presets
bw.SPACING_PRESETS = SPACING_PRESETS;
bw.RADIUS_PRESETS = RADIUS_PRESETS;
bw.DEFAULT_PALETTE_CONFIG = DEFAULT_PALETTE_CONFIG;
bw.THEME_PRESETS = THEME_PRESETS;

// ===================================================================================
// Legacy v1 Functions - Useful utilities retained from bitwrench v1
// ===================================================================================

/**
 * Use a dictionary as a switch statement, with support for function values.
 *
 * Looks up `x` in `choices`. If the value is a function, calls it with `x` as argument.
 * Returns `def` if the key is not found.
 *
 * @param {*} x - Key to look up
 * @param {Object} choices - Dictionary of choices (values can be functions)
 * @param {*} def - Default value if key not found
 * @returns {*} Value or function result
 * @category Array Utilities
 * @example
 * var colors = { red: 1, blue: 2, aqua: function(z) { return z + 'marine'; } };
 * bw.choice('red', colors, '0')   // => 1
 * bw.choice('aqua', colors)       // => 'aquamarine'
 * bw.choice('pink', colors, 'n/a') // => 'n/a'
 */
bw.choice = function(x, choices, def) {
  const z = (x in choices) ? choices[x] : def;
  return bw.typeOf(z) === "function" ? z(x) : z;
};

/**
 * Return unique elements of an array (preserves first occurrence order).
 *
 * @param {Array} x - Input array
 * @returns {Array} Array with unique elements
 * @category Array Utilities
 * @example
 * bw.arrayUniq([1, 2, 2, 3, 1])  // => [1, 2, 3]
 */
bw.arrayUniq = function(x) {
  if (bw.typeOf(x) !== "array") return [];
  return x.filter((v, i, arr) => arr.indexOf(v) === i);
};

/**
 * Return the intersection of two arrays (elements present in both).
 *
 * @param {Array} a - First array
 * @param {Array} b - Second array
 * @returns {Array} Unique elements found in both a and b
 * @category Array Utilities
 * @see bw.arrayBNotInA
 * @example
 * bw.arrayBinA([1, 2, 3], [2, 3, 4])  // => [2, 3]
 */
bw.arrayBinA = function(a, b) {
  if (bw.typeOf(a) !== "array" || bw.typeOf(b) !== "array") return [];
  return bw.arrayUniq(a.filter(n => b.indexOf(n) !== -1));
};

/**
 * Return elements of b that are not present in a (set difference).
 *
 * @param {Array} a - First array (the "exclude" set)
 * @param {Array} b - Second array (source of results)
 * @returns {Array} Unique elements in b but not in a
 * @category Array Utilities
 * @see bw.arrayBinA
 * @example
 * bw.arrayBNotInA([1, 2, 3], [2, 3, 4, 5])  // => [4, 5]
 */
bw.arrayBNotInA = function(a, b) {
  if (bw.typeOf(a) !== "array" || bw.typeOf(b) !== "array") return [];
  return bw.arrayUniq(b.filter(n => a.indexOf(n) < 0));
};

/**
 * Interpolate between an array of colors based on a value in a range.
 *
 * Maps a value from [in0..in1] across a gradient of colors, smoothly blending
 * between adjacent stops. Useful for heatmaps, gauges, and data visualization.
 *
 * @param {number} x - Value to interpolate
 * @param {number} in0 - Input range start
 * @param {number} in1 - Input range end
 * @param {Array} colors - Array of CSS color strings to interpolate between
 * @param {number} [stretch] - Exponential scaling factor (1 = linear)
 * @returns {Array} Interpolated color as [r, g, b, a, "rgb"]
 * @category Color
 * @see bw.colorParse
 * @see bw.mapScale
 * @example
 * bw.colorInterp(50, 0, 100, ['#ff0000', '#00ff00'])
 * // => [128, 128, 0, 255, "rgb"] (yellow midpoint)
 */
bw.colorInterp = function(x, in0, in1, colors, stretch) {
  let c = Array.isArray(colors) ? colors : ["#000", "#fff"];
  c = c.length === 0 ? ["#000", "#fff"] : c;
  if (c.length === 1) return c[0];
  
  // Convert all colors to RGB format
  c = c.map(col => bw.colorParse(col));
  
  const a = bw.mapScale(x, in0, in1, 0, c.length - 1, { clip: true, expScale: stretch });
  const i = bw.clip(Math.floor(a), 0, c.length - 2);
  const r = a - i;
  
  const interp = (idx) => bw.mapScale(r, 0, 1, c[i][idx], c[i + 1][idx], { clip: true });
  return [interp(0), interp(1), interp(2), interp(3), "rgb"];
};

/**
 * Convert an HSL color to RGB.
 *
 * Accepts individual h, s, l values or a bitwrench color array [h, s, l, a, "hsl"].
 *
 * @param {number|Array} h - Hue [0..360] or [h,s,l,a,"hsl"] array
 * @param {number} s - Saturation [0..100]
 * @param {number} l - Lightness [0..100]
 * @param {number} [a=255] - Alpha [0..255]
 * @param {boolean} [rnd=true] - Round results to integers
 * @returns {Array} RGB as [r, g, b, a, "rgb"]
 * @category Color
 * @see bw.colorRgbToHsl
 * @example
 * bw.colorHslToRgb(0, 100, 50)    // => [255, 0, 0, 255, "rgb"]
 * bw.colorHslToRgb(120, 100, 50)  // => [0, 255, 0, 255, "rgb"]
 */
bw.colorHslToRgb = function(h, s, l, a = 255, rnd = true) {
  if (bw.typeOf(h) === "array") {
    s = h[1]; l = h[2]; a = h[3]; h = h[0];
  }
  
  const hNorm = h / 360;
  const sNorm = s / 100;
  const lNorm = l / 100;
  
  let r, g, b;
  
  if (sNorm === 0) {
    r = g = b = lNorm * 255;
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    
    const q = lNorm < 0.5 ? lNorm * (1 + sNorm) : lNorm + sNorm - lNorm * sNorm;
    const p = 2 * lNorm - q;
    
    r = hue2rgb(p, q, hNorm + 1/3) * 255;
    g = hue2rgb(p, q, hNorm) * 255;
    b = hue2rgb(p, q, hNorm - 1/3) * 255;
  }
  
  if (rnd) {
    r = Math.round(r);
    g = Math.round(g);
    b = Math.round(b);
    a = Math.round(a);
  }
  
  return [r, g, b, a, "rgb"];
};

/**
 * Convert an RGB color to HSL.
 *
 * Accepts individual r, g, b values or a bitwrench color array [r, g, b, a, "rgb"].
 *
 * @param {number|Array} r - Red [0..255] or [r,g,b,a,"rgb"] array
 * @param {number} g - Green [0..255]
 * @param {number} b - Blue [0..255]
 * @param {number} [a=255] - Alpha [0..255]
 * @param {boolean} [rnd=true] - Round results to integers
 * @returns {Array} HSL as [h, s, l, a, "hsl"]
 * @category Color
 * @see bw.colorHslToRgb
 * @example
 * bw.colorRgbToHsl(255, 0, 0)   // => [0, 100, 50, 255, "hsl"]
 * bw.colorRgbToHsl(0, 0, 255)   // => [240, 100, 50, 255, "hsl"]
 */
bw.colorRgbToHsl = function(r, g, b, a = 255, rnd = true) {
  if (bw.typeOf(r) === "array") {
    g = r[1]; b = r[2]; a = r[3]; r = r[0];
  }
  
  r /= 255;
  g /= 255;
  b /= 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  
  if (max === min) {
    h = s = 0; // achromatic
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  
  h *= 360;
  s *= 100;
  l *= 100;
  
  if (rnd) {
    h = Math.round(h);
    s = Math.round(s);
    l = Math.round(l);
    a = Math.round(a);
  }
  
  return [h, s, l, a, "hsl"];
};

/**
 * Parse a CSS color string into bitwrench's internal array format.
 *
 * Supports hex (#rgb, #rrggbb, #rrggbbaa), rgb(), rgba(), hsl(), and hsla().
 * Also accepts existing bitwrench color arrays (pass-through).
 *
 * @param {string|Array} s - CSS color string (e.g. "#ff0000", "rgb(255,0,0)") or color array
 * @param {number} [defAlpha=255] - Default alpha value
 * @returns {Array} Color as [c0, c1, c2, a, "rgb"|"hsl"]
 * @category Color
 * @see bw.colorInterp
 * @example
 * bw.colorParse('#ff0000')        // => [255, 0, 0, 255, "rgb"]
 * bw.colorParse('rgb(0,128,255)') // => [0, 128, 255, 255, "rgb"]
 */
bw.colorParse = function(s, defAlpha = 255) {
  let r = [0, 0, 0, defAlpha, "rgb"]; // default return
  
  if (bw.typeOf(s) === "array") {
    // Handle bitwrench color array
    const df = [0, 0, 0, 255, "rgb"];
    for (let p = 0; p < s.length && p < df.length; p++) {
      df[p] = s[p];
    }
    return df;
  }
  
  s = String(s).replace(/\s/g, "");
  
  // Handle hex colors
  if (s[0] === "#") {
    const hex = s.slice(1);
    if (hex.length === 3 || hex.length === 4) {
      // #rgb or #rgba
      for (let i = 0; i < hex.length; i++) {
        r[i] = parseInt(hex[i] + hex[i], 16);
      }
    } else if (hex.length === 6 || hex.length === 8) {
      // #rrggbb or #rrggbbaa
      for (let i = 0; i < hex.length; i += 2) {
        r[i / 2] = parseInt(hex.substring(i, i + 2), 16);
      }
    }
  } else {
    // Handle rgb() rgba() hsl() hsla()
    const match = s.match(/^(rgb|hsl)a?\(([^)]+)\)$/i);
    if (match) {
      const type = match[1].toLowerCase();
      const values = match[2].split(",").map(v => parseFloat(v));
      
      if (type === "rgb") {
        r[0] = values[0] || 0;
        r[1] = values[1] || 0;
        r[2] = values[2] || 0;
        r[3] = values[3] !== undefined ? values[3] * 255 : defAlpha;
        r[4] = "rgb";
      } else if (type === "hsl") {
        const rgb = bw.colorHslToRgb(values[0] || 0, values[1] || 0, values[2] || 0, 
                                      values[3] !== undefined ? values[3] * 255 : defAlpha);
        return rgb;
      }
    }
  }
  
  return r;
};

/**
 * Set a browser cookie with expiration and options.
 *
 * @param {string} cname - Cookie name
 * @param {string} cvalue - Cookie value
 * @param {number} exdays - Expiration in days from now
 * @param {Object} [options] - Additional cookie options
 * @param {string} [options.path] - Cookie path
 * @param {string} [options.domain] - Cookie domain
 * @param {boolean} [options.secure] - Secure flag
 * @param {string} [options.sameSite] - SameSite attribute
 * @category Browser Utilities
 * @see bw.getCookie
 */
bw.setCookie = function(cname, cvalue, exdays, options = {}) {
  if (!bw._isBrowser) return;
  
  const d = new Date();
  d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
  
  let cookie = `${cname}=${cvalue}; expires=${d.toUTCString()}`;
  
  // Add additional options
  if (options.path) cookie += `; path=${options.path}`;
  if (options.domain) cookie += `; domain=${options.domain}`;
  if (options.secure) cookie += '; secure';
  if (options.sameSite) cookie += `; samesite=${options.sameSite}`;
  
  document.cookie = cookie;
};

/**
 * Get a browser cookie value by name.
 *
 * @param {string} cname - Cookie name
 * @param {*} defaultValue - Default value if cookie not found
 * @returns {*} Cookie value or default
 * @category Browser Utilities
 * @see bw.setCookie
 */
bw.getCookie = function(cname, defaultValue) {
  if (!bw._isBrowser) return defaultValue;
  
  const name = cname + "=";
  const ca = document.cookie.split(";");
  
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === " ") c = c.substring(1);
    if (c.indexOf(name) === 0) return c.substring(name.length, c.length);
  }
  
  return defaultValue;
};

/**
 * Get a URL query parameter value from the current page URL.
 *
 * Pass no key to get all parameters as an object. Returns `true` for
 * present-but-empty parameters.
 *
 * @param {string} [key] - Parameter name (omit to get all params)
 * @param {*} defaultValue - Default if not found
 * @returns {*} Parameter value, true (present but empty), or default
 * @category Browser Utilities
 */
bw.getURLParam = function(key, defaultValue) {
  if (!bw._isBrowser || typeof window !== "object") return defaultValue;
  
  try {
    const params = new URLSearchParams(window.location.search);
    
    if (!key) {
      // Return all params as object
      const result = {};
      for (const [k, v] of params) {
        result[k] = v || true;
      }
      return result;
    }
    
    return params.has(key) ? (params.get(key) || true) : defaultValue;
  } catch (e) {
    return defaultValue;
  }
};

/**
 * Create an HTML table string from a 2D data array.
 *
 * Legacy v1 API — returns an HTML string, not a TACO. First row is used
 * as headers by default. For TACO-based tables, use `bw.makeTable()` instead.
 *
 * @param {Array} data - 2D array of table data
 * @param {Object} [opts] - Table options
 * @param {boolean} [opts.useFirstRowAsHeaders=true] - Use first row as headers
 * @param {string} [opts.caption] - Table caption
 * @returns {string} HTML table string
 * @category Legacy (v1)
 * @see bw.makeTable
 */
bw.htmlTable = function(data, opts = {}) {
  if (bw.typeOf(data) !== "array" || data.length < 1) return "";
  
  const dopts = {
    useFirstRowAsHeaders: true,
    caption: null,
    atr: { class: "table" },
    thead_atr: {},
    th_atr: {},
    tbody_atr: {},
    tr_atr: {},
    td_atr: {}
  };
  
  Object.assign(dopts, opts);
  
  let html = `<table${bw._attrsToStr(dopts.atr)}>`;
  
  if (dopts.caption) {
    html += `<caption>${bw.escapeHTML(dopts.caption)}</caption>`;
  }
  
  let startRow = 0;
  
  // Handle header row
  if (dopts.useFirstRowAsHeaders && data.length > 0) {
    html += `<thead${bw._attrsToStr(dopts.thead_atr)}>`;
    html += `<tr${bw._attrsToStr(dopts.tr_atr)}>`;
    
    data[0].forEach(cell => {
      html += `<th${bw._attrsToStr(dopts.th_atr)}>${bw.escapeHTML(String(cell))}</th>`;
    });
    
    html += "</tr></thead>";
    startRow = 1;
  }
  
  // Body rows
  if (data.length > startRow) {
    html += `<tbody${bw._attrsToStr(dopts.tbody_atr)}>`;
    
    for (let i = startRow; i < data.length; i++) {
      html += `<tr${bw._attrsToStr(dopts.tr_atr)}>`;
      
      data[i].forEach(cell => {
        html += `<td${bw._attrsToStr(dopts.td_atr)}>${bw.escapeHTML(String(cell))}</td>`;
      });
      
      html += "</tr>";
    }
    
    html += "</tbody>";
  }
  
  html += "</table>";
  
  return html;
};

/**
 * Convert an attributes object to an HTML attribute string
 *
 * Handles boolean attributes (key only), null/undefined/false (skipped),
 * and regular string values (HTML-escaped). Used internally by bw.htmlTable()
 * and bw.htmlTabs().
 *
 * @param {Object} attrs - Attribute key-value pairs
 * @returns {string} HTML attribute string with leading space, or empty string
 * @private
 */
bw._attrsToStr = function(attrs) {
  if (!attrs || typeof attrs !== "object") return "";
  
  let str = "";
  for (const [key, value] of Object.entries(attrs)) {
    if (value != null && value !== false) {
      if (value === true) {
        str += ` ${key}`;
      } else {
        str += ` ${key}="${bw.escapeHTML(String(value))}"`;
      }
    }
  }
  
  return str;
};

/**
 * Create an HTML tabs structure from an array of [title, content] pairs.
 *
 * Legacy v1 API — returns an HTML string. For TACO-based tabs,
 * use `bw.makeTabs()` instead.
 *
 * @param {Array} tabData - Array of [title, content] pairs
 * @param {Object} [opts] - Tab options
 * @returns {string} HTML tabs string
 * @category Legacy (v1)
 * @see bw.makeTabs
 */
bw.htmlTabs = function(tabData, opts = {}) {
  if (bw.typeOf(tabData) !== "array" || tabData.length < 1) return "";
  
  const dopts = {
    atr: { class: "bw-tab-container" },
    tab_atr: { class: "bw-tab-item-list" },
    tabc_atr: { class: "bw-tab-content-list" }
  };
  
  Object.assign(dopts, opts);
  
  // Create tab items
  const tabItems = tabData.map((tab, idx) => ({
    t: "li",
    a: { 
      class: idx === 0 ? "bw-tab-item bw-tab-active" : "bw-tab-item",
      onclick: "bw.selectTabContent(this)"
    },
    c: tab[0]
  }));
  
  // Create tab content
  const tabContent = tabData.map((tab, idx) => ({
    t: "div",
    a: { class: idx === 0 ? "bw-tab-content bw-show" : "bw-tab-content" },
    c: tab[1]
  }));
  
  return bw.html({
    t: "div",
    a: dopts.atr,
    c: [
      { t: "ul", a: dopts.tab_atr, c: tabItems },
      { t: "div", a: dopts.tabc_atr, c: tabContent }
    ]
  });
};

/**
 * Tab selection handler — shows the clicked tab's content and hides others.
 *
 * Used internally by `bw.htmlTabs()`. You generally don't call this directly.
 *
 * @param {Element} tabElement - Clicked tab element
 * @category Legacy (v1)
 */
bw.selectTabContent = function(tabElement) {
  if (!bw._isBrowser || !tabElement) return;
  
  const container = tabElement.closest(".bw-tab-container");
  if (!container) return;
  
  // Remove active class from all tabs
  container.querySelectorAll(".bw-tab-item").forEach(tab => {
    tab.classList.remove("bw-tab-active");
  });
  
  // Add active to clicked tab
  tabElement.classList.add("bw-tab-active");
  
  // Get tab index
  const tabIndex = Array.from(tabElement.parentElement.children).indexOf(tabElement);
  
  // Hide all content
  container.querySelectorAll(".bw-tab-content").forEach(content => {
    content.classList.remove("bw-show");
  });
  
  // Show selected content
  const contents = container.querySelectorAll(".bw-tab-content");
  if (contents[tabIndex]) {
    contents[tabIndex].classList.add("bw-show");
  }
};

/**
 * Generate Lorem Ipsum placeholder text.
 *
 * Useful for prototyping layouts. Generates repeatable text from the standard
 * Lorem Ipsum passage. Omit numChars for a random length between 25-150 characters.
 *
 * @param {number} [numChars] - Number of characters (random 25-150 if not provided)
 * @param {number} [startSpot] - Starting index in Lorem text (random if undefined)
 * @param {boolean} [startWithCapitalLetter=true] - Start with a capital letter
 * @returns {string} Lorem ipsum text
 * @category Text Generation
 * @example
 * bw.loremIpsum(50)
 * // => "Lorem ipsum dolor sit amet, consectetur adipiscin"
 */
bw.loremIpsum = function(numChars, startSpot, startWithCapitalLetter = true) {
  const lorem = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. ";
  
  // If numChars not provided, generate random length between 25-150
  if (typeof numChars !== "number") {
    numChars = Math.floor(Math.random() * 125) + 25;
  }
  
  // If startSpot is undefined, randomize it
  if (startSpot === undefined) {
    startSpot = Math.floor(Math.random() * lorem.length);
  }
  
  startSpot = startSpot % lorem.length;
  
  // Track how many characters we skip to honor numChars
  let skippedChars = 0;
  
  // Move startSpot to the next non-whitespace and non-punctuation character
  while (lorem[startSpot] === ' ' || /[.,:;!?]/.test(lorem[startSpot])) {
    startSpot = (startSpot + 1) % lorem.length;
    skippedChars++;
    // Prevent infinite loop in case entire lorem is spaces/punctuation
    if (skippedChars >= lorem.length) {
      startSpot = 0;
      skippedChars = 0;
      break;
    }
  }
  
  let l = lorem.substring(startSpot) + lorem.substring(0, startSpot);
  
  let result = "";
  let remaining = numChars + skippedChars;  // Add skipped chars to honor original numChars
  
  while (remaining > 0) {
    result += remaining < l.length ? l.substring(0, remaining) : l;
    remaining -= l.length;
  }
  
  // Trim to exact numChars length
  if (result.length > numChars) {
    result = result.substring(0, numChars);
  }
  
  // Ensure no trailing space
  if (result[result.length - 1] === " ") {
    result = result.substring(0, result.length - 1) + ".";
  }
  
  // Ensure capital letter at start if requested
  if (startWithCapitalLetter) {
    let c = result[0].toUpperCase();
    c = /[A-Z]/.test(c) ? c : "L";  // Use "L" as default if first char isn't a letter
    result = c + result.substring(1);
  }
  
  return result;
};

/**
 * Create a multidimensional array filled with a value or function result.
 *
 * If value is a function, it's called for each cell (useful for random data).
 *
 * @param {*} value - Value or function to fill array with
 * @param {number|Array} dims - Dimensions (number for 1D, array for multi-D)
 * @returns {Array} Multidimensional array
 * @category Array Utilities
 * @example
 * bw.multiArray(0, [4, 5])            // 4x5 array of 0s
 * bw.multiArray('test', 5)            // ['test','test','test','test','test']
 * bw.multiArray(Math.random, [3, 4])  // 3x4 array of random numbers
 */
bw.multiArray = function(value, dims) {
  const v = () => bw.typeOf(value) === "function" ? value() : value;
  dims = typeof dims === "number" ? [dims] : dims;
  
  const createArray = (dim) => {
    if (dim >= dims.length) return v();
    
    const arr = [];
    for (let i = 0; i < dims[dim]; i++) {
      arr[i] = createArray(dim + 1);
    }
    return arr;
  };
  
  return createArray(0);
};

/**
 * Natural sort comparison function for use with `Array.sort()`.
 *
 * Sorts strings with embedded numbers in human-expected order
 * (e.g. "file2" before "file10") instead of lexicographic order.
 *
 * @param {*} as - First value
 * @param {*} bs - Second value
 * @returns {number} Sort order (-1, 0, 1)
 * @category Array Utilities
 * @example
 * ['item10', 'item2', 'item1'].sort(bw.naturalCompare)
 * // => ['item1', 'item2', 'item10']
 */
bw.naturalCompare = function(as, bs) {
  // Handle numbers
  if (isFinite(as) && isFinite(bs)) {
    return Math.sign(as - bs);
  }
  
  const a = String(as).toLowerCase();
  const b = String(bs).toLowerCase();
  
  if (a === b) return as > bs ? 1 : 0;
  
  // If no digits, simple string compare
  if (!/\d/.test(a) || !/\d/.test(b)) {
    return a > b ? 1 : -1;
  }
  
  // Split into chunks of digits/non-digits
  const aParts = a.match(/(\d+|\D+)/g) || [];
  const bParts = b.match(/(\d+|\D+)/g) || [];
  
  const len = Math.min(aParts.length, bParts.length);
  
  for (let i = 0; i < len; i++) {
    const aPart = aParts[i];
    const bPart = bParts[i];
    
    if (aPart !== bPart) {
      // Both numeric
      if (/^\d+$/.test(aPart) && /^\d+$/.test(bPart)) {
        // Handle leading zeros
        let aNum = aPart;
        let bNum = bPart;
        
        if (aPart[0] === "0") aNum = "0." + aPart;
        if (bPart[0] === "0") bNum = "0." + bPart;
        
        return parseFloat(aNum) - parseFloat(bNum);
      }
      
      // String comparison
      return aPart > bPart ? 1 : -1;
    }
  }
  
  // Different lengths
  return aParts.length - bParts.length;
};

/**
 * Run `setInterval` with a maximum number of repetitions.
 *
 * Like `setInterval` but automatically clears after N calls.
 *
 * @param {Function} callback - Function to call (receives iteration index)
 * @param {number} delay - Delay between calls in ms
 * @param {number} repetitions - Maximum number of times to call
 * @returns {number} Interval ID (can be passed to clearInterval)
 * @category Timing
 * @example
 * bw.setIntervalX(function(i) {
 *   console.log('Iteration', i);
 * }, 1000, 5); // Runs 5 times, 1 second apart
 */
bw.setIntervalX = function(callback, delay, repetitions) {
  let count = 0;
  const intervalID = setInterval(function() {
    callback(count);
    
    if (++count >= repetitions) {
      clearInterval(intervalID);
    }
  }, delay);
  
  return intervalID;
};

/**
 * Repeat a test function until it returns truthy, or give up after max attempts.
 *
 * Useful for polling (waiting for an element to appear, an API to respond, etc.).
 *
 * @param {Function} testFn - Test function that returns truthy when done
 * @param {Function} successFn - Called with test result when test passes
 * @param {Function} [failFn] - Called on each failed test attempt
 * @param {number} [delay=250] - Delay between attempts in ms
 * @param {number} [maxReps=10] - Maximum number of attempts
 * @param {Function} [lastFn] - Called when done with (success, count)
 * @returns {string|number} "err" if invalid params, otherwise interval ID
 * @category Timing
 * @example
 * bw.repeatUntil(
 *   function() { return document.getElementById('myDiv'); },
 *   function() { console.log('Element found!'); },
 *   null, 100, 30
 * );
 */
bw.repeatUntil = function(testFn, successFn, failFn, delay = 250, maxReps = 10, lastFn) {
  if (typeof testFn !== "function") return "err";
  
  let count = 0;
  
  const intervalID = setInterval(function() {
    const result = testFn();
    count++;
    
    if (result) {
      clearInterval(intervalID);
      if (successFn) successFn(result);
      if (lastFn) lastFn(true, count);
    } else if (count >= maxReps) {
      clearInterval(intervalID);
      if (failFn) failFn();
      if (lastFn) lastFn(false, count);
    } else {
      if (failFn) failFn();
    }
  }, delay);
  
  return intervalID;
};

// ===================================================================================
// File I/O Functions - Works in both Node.js and browser
// ===================================================================================

/**
 * Save data to a file. Works in both Node.js (fs.writeFile) and browser (download link).
 *
 * @param {string} fname - Filename to save as
 * @param {*} data - Data to save (string or buffer)
 * @category File I/O
 * @see bw.saveClientJSON
 */
bw.saveClientFile = function(fname, data) {
  if (bw.isNodeJS()) {
    bw._getFs().then(function(fs) {
      if (!fs) { console.error('bw.saveClientFile: fs module not available'); return; }
      fs.writeFile(fname, data, function(err) {
        if (err) {
          console.error("Error saving file:", err);
        }
      });
    });
  } else {
    // Browser environment
    const blob = new Blob([data], { type: "application/octet-stream" });
    const url = window.URL.createObjectURL(blob);
    const a = bw.createDOM({
      t: 'a',
      a: { 
        href: url, 
        download: fname,
        style: 'display: none'
      }
    });
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }
};

/**
 * Save data as a JSON file with pretty formatting.
 *
 * @param {string} fname - Filename to save as
 * @param {*} data - Data to serialize as JSON
 * @category File I/O
 * @see bw.saveClientFile
 */
bw.saveClientJSON = function(fname, data) {
  bw.saveClientFile(fname, JSON.stringify(data, null, 2));
};

/**
 * Load a file by path (Node.js) or URL (browser via XHR).
 *
 * @param {string} fname - File path (Node) or URL (browser)
 * @param {Function} callback - Called with (data, error). data is null on error.
 * @param {Object} [options] - Options
 * @param {string} [options.parser="raw"] - "raw" for string, "JSON" to auto-parse
 * @returns {string} "BW_OK"
 * @category File I/O
 * @see bw.loadClientJSON
 */
bw.loadClientFile = function(fname, callback, options) {
  var opts = { parser: 'raw' };
  if (options && options.parser) { opts.parser = options.parser; }
  var parse = (opts.parser === 'JSON') ? JSON.parse : function(s) { return s; };

  if (bw.isNodeJS()) {
    bw._getFs().then(function(fs) {
      if (!fs) { callback(null, new Error('fs module not available')); return; }
      fs.readFile(fname, 'utf8', function(err, data) {
        if (err) { callback(null, err); }
        else {
          try { callback(parse(data), null); }
          catch (e) { callback(null, e); }
        }
      });
    });
  } else {
    var x = new XMLHttpRequest();
    x.open('GET', fname, true);
    x.onreadystatechange = function() {
      if (x.readyState === 4) {
        if (x.status >= 200 && x.status < 300) {
          try { callback(parse(x.responseText), null); }
          catch (e) { callback(null, e); }
        } else {
          callback(null, new Error('HTTP ' + x.status + ': ' + fname));
        }
      }
    };
    x.send(null);
  }
  return 'BW_OK';
};

/**
 * Load a JSON file by path (Node.js) or URL (browser). Convenience wrapper
 * around `bw.loadClientFile()` with `parser: "JSON"`.
 *
 * @param {string} fname - File path (Node) or URL (browser)
 * @param {Function} callback - Called with (parsedData, error)
 * @returns {string} "BW_OK"
 * @category File I/O
 * @see bw.loadClientFile
 */
bw.loadClientJSON = function(fname, callback) {
  return bw.loadClientFile(fname, callback, { parser: 'JSON' });
};

/**
 * Prompt user to pick a local file via file dialog (browser only).
 *
 * Opens a native file picker and reads the selected file.
 *
 * @param {Function} callback - Called with (data, filename, error)
 * @param {Object} [options] - Options
 * @param {string} [options.accept] - File type filter (e.g. ".json,.txt")
 * @param {string} [options.parser="raw"] - "raw" for string, "JSON" to auto-parse
 * @category File I/O
 * @see bw.loadLocalJSON
 */
bw.loadLocalFile = function(callback, options) {
  var opts = { parser: 'raw', accept: '' };
  if (options) {
    if (options.parser) { opts.parser = options.parser; }
    if (options.accept) { opts.accept = options.accept; }
  }
  var parse = (opts.parser === 'JSON') ? JSON.parse : function(s) { return s; };

  if (bw.isNodeJS()) {
    callback(null, '', new Error('bw.loadLocalFile is browser-only. Use bw.loadClientFile() in Node.'));
    return;
  }

  var input = bw.createDOM({
    t: 'input',
    a: {
      type: 'file',
      accept: opts.accept,
      style: 'display: none'
    }
  });
  input.addEventListener('change', function() {
    var file = input.files[0];
    if (!file) { callback(null, '', new Error('No file selected')); return; }
    var reader = new FileReader();
    reader.onload = function(e) {
      try { callback(parse(e.target.result), file.name, null); }
      catch (err) { callback(null, file.name, err); }
    };
    reader.onerror = function() { callback(null, file.name, reader.error); };
    reader.readAsText(file);
    input.remove();
  });
  document.body.appendChild(input);
  input.click();
};

/**
 * Prompt user to pick a local JSON file via file dialog (browser only).
 *
 * @param {Function} callback - Called with (parsedData, filename, error)
 * @category File I/O
 * @see bw.loadLocalFile
 */
bw.loadLocalJSON = function(callback) {
  bw.loadLocalFile(callback, { parser: 'JSON', accept: '.json' });
};

/**
 * Copy text to the system clipboard (browser only).
 *
 * Uses the modern Clipboard API when available, falls back to `document.execCommand('copy')`.
 *
 * @param {string} text - Text to copy
 * @returns {Promise} Promise that resolves when copy is complete
 * @category Browser Utilities
 */
bw.copyToClipboard = function(text) {
  // Modern clipboard API
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text);
  }
  
  // Fallback for older browsers
  return new Promise((resolve, reject) => {
    const textarea = bw.createDOM({
      t: 'textarea',
      a: {
        value: text,
        style: {
          position: 'fixed',
          top: '-999px',
          left: '-999px',
          width: '2em',
          height: '2em',
          padding: 0,
          border: 'none',
          outline: 'none',
          boxShadow: 'none',
          background: 'transparent'
        }
      }
    });
    
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    
    try {
      const successful = document.execCommand('copy');
      document.body.removeChild(textarea);
      
      if (successful) {
        resolve();
      } else {
        reject(new Error('Copy command failed'));
      }
    } catch (err) {
      document.body.removeChild(textarea);
      reject(err);
    }
  });
};

/**
 * Create a sortable TACO table from an array of row objects.
 *
 * Auto-detects columns from data keys if not specified. Supports click-to-sort
 * headers with ascending/descending indicators. Returns a TACO object —
 * render with `bw.DOM()` or `bw.html()`.
 *
 * @param {Object} config - Table configuration
 * @param {Array<Object>} config.data - Array of row objects to display
 * @param {Array<Object>} [config.columns] - Column definitions with key, label, render
 * @param {string} [config.className='table'] - CSS class for table element
 * @param {boolean} [config.sortable=true] - Enable click-to-sort headers
 * @param {Function} [config.onSort] - Sort callback (column, direction)
 * @returns {Object} TACO object for table
 * @category Component Builders
 * @see bw.makeDataTable
 * @example
 * bw.makeTable({
 *   data: [
 *     { name: 'Alice', age: 30 },
 *     { name: 'Bob', age: 25 }
 *   ],
 *   columns: [
 *     { key: 'name', label: 'Name' },
 *     { key: 'age', label: 'Age' }
 *   ]
 * });
 */
bw.makeTable = function(config) {
  const {
    data = [],
    columns,
    className = "table",
    sortable = true,
    onSort,
    sortColumn,
    sortDirection = 'asc'
  } = config;
  
  // Auto-detect columns if not provided
  const cols = columns || (data.length > 0 
    ? Object.keys(data[0]).map(key => ({ key, label: key }))
    : []);
    
  // Current sort state
  let currentSortColumn = sortColumn || null;
  let currentSortDirection = sortDirection;
  
  // Sort data if column specified
  let sortedData = [...data];
  if (currentSortColumn) {
    sortedData.sort((a, b) => {
      const aVal = a[currentSortColumn];
      const bVal = b[currentSortColumn];
      
      // Handle different types
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return currentSortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }
      
      // String comparison
      const aStr = String(aVal || '').toLowerCase();
      const bStr = String(bVal || '').toLowerCase();
      
      if (currentSortDirection === 'asc') {
        return aStr.localeCompare(bStr);
      } else {
        return bStr.localeCompare(aStr);
      }
    });
  }
  
  // Create sort handler
  const handleSort = (column) => {
    if (!sortable) return;
    
    if (currentSortColumn === column) {
      currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      currentSortColumn = column;
      currentSortDirection = 'asc';
    }
    
    if (onSort) {
      onSort(column, currentSortDirection);
    }
  };
  
  // Build table header
  const thead = {
    t: 'thead',
    c: {
      t: 'tr',
      c: cols.map(col => ({
        t: 'th',
        a: sortable ? {
          style: { cursor: 'pointer', userSelect: 'none' },
          onclick: () => handleSort(col.key)
        } : {},
        c: [
          col.label,
          sortable && currentSortColumn === col.key && {
            t: 'span',
            a: { style: { marginLeft: '5px' } },
            c: currentSortDirection === 'asc' ? '▲' : '▼'
          }
        ].filter(Boolean)
      }))
    }
  };
  
  // Build table body
  const tbody = {
    t: 'tbody',
    c: sortedData.map(row => ({
      t: 'tr',
      c: cols.map(col => ({
        t: 'td',
        c: col.render ? col.render(row[col.key], row) : String(row[col.key] || '')
      }))
    }))
  };
  
  return {
    t: 'table',
    a: { class: className },
    c: [thead, tbody]
  };
};

/**
 * Create a responsive data table with title and optional wrapper
 *
 * Wraps bw.makeTable() output in a responsive container div.
 * Adds an optional title heading above the table.
 *
 * @param {Object} config - Table configuration
 * @param {string} [config.title] - Table title heading
 * @param {Array<Object>} config.data - Array of row objects
 * @param {Array<Object>} [config.columns] - Column definitions
 * @param {string} [config.className="table table-striped table-hover"] - Table CSS class
 * @param {boolean} [config.responsive=true] - Wrap table in responsive overflow div
 * @returns {Object} TACO object for table with wrapper
 * @example
 * const table = bw.makeDataTable({
 *   title: "Users",
 *   data: [{ name: "Alice", role: "Admin" }],
 *   responsive: true
 * });
 */
bw.makeDataTable = function(config) {
  const {
    title,
    data,
    columns,
    className = "table table-striped table-hover",
    responsive = true,
    ...tableConfig
  } = config;
  
  const table = bw.makeTable({
    data,
    columns,
    className,
    ...tableConfig
  });
  
  const content = [];
  
  if (title) {
    content.push({
      t: 'h5',
      a: { class: 'mb-3' },
      c: title
    });
  }
  
  if (responsive) {
    content.push({
      t: 'div',
      a: { class: 'table-responsive' },
      c: table
    });
  } else {
    content.push(table);
  }
  
  return {
    t: 'div',
    a: { class: 'table-container' },
    c: content
  };
};

/**
 * Component registry for tracking rendered components
 * @private
 */
bw._componentRegistry = new Map();

/**
 * Render a TACO object into the DOM at a specific position, returning a component handle.
 *
 * The handle provides full lifecycle control: state management, re-rendering,
 * class manipulation, show/hide, event binding, and destroy. Components are
 * tracked in a registry for later retrieval via `bw.getComponent()`.
 *
 * @param {Element|string} element - Target element or CSS selector
 * @param {string} position - Position: 'replace', 'prepend', 'append', 'before', 'after'
 * @param {Object} taco - TACO object to render
 * @returns {Object} Component handle with element, setState, update, destroy, etc.
 * @category DOM Generation
 * @see bw.getComponent
 * @see bw.DOM
 * @example
 * var handle = bw.render('#app', 'append', {
 *   t: 'button', a: { class: 'bw-btn' }, c: 'Click Me',
 *   o: { state: { clicks: 0 } }
 * });
 * handle.setState({ clicks: 1 });
 * handle.destroy();
 */
bw.render = function(element, position, taco) {
  // Get target element
  const targetEl = typeof element === 'string' 
    ? document.querySelector(element) 
    : element;
    
  if (!targetEl) {
    return {
      object_type: 'error',
      component_id: null,
      object_handle_in_dom: null,
      status_code: 'error=target_element_not_found'
    };
  }
  
  // Generate unique ID if not provided
  const componentId = taco.o?.id || bw.uuid();
  
  // Create DOM element
  let domElement;
  try {
    domElement = bw.createDOM(taco);
  } catch(e) {
    return {
      object_type: 'error',
      component_id: componentId,
      object_handle_in_dom: null,
      status_code: `error=render_failed:${e.message}`
    };
  }
  
  // Add component ID to element
  domElement.setAttribute('data-bw-id', componentId);
  
  // Insert into DOM based on position
  try {
    switch(position) {
      case 'replace':
        targetEl.parentNode.replaceChild(domElement, targetEl);
        break;
      case 'prepend':
        targetEl.insertBefore(domElement, targetEl.firstChild);
        break;
      case 'append':
        targetEl.appendChild(domElement);
        break;
      case 'before':
        targetEl.parentNode.insertBefore(domElement, targetEl);
        break;
      case 'after':
        targetEl.parentNode.insertBefore(domElement, targetEl.nextSibling);
        break;
      default:
        throw new Error(`Invalid position: ${position}`);
    }
  } catch(e) {
    return {
      object_type: 'error',
      component_id: componentId,
      object_handle_in_dom: null,
      status_code: `error=insertion_failed:${e.message}`
    };
  }
  
  // Create component handle
  const handle = {
    object_type: taco.t || 'element',
    component_id: componentId,
    object_handle_in_dom: domElement,
    status_code: 'success',
    
    // Reference to original TACO
    _taco: { ...taco },
    _state: { ...(taco.o?.state || {}) },
    _mounted: true,
    
    // Get DOM element
    get element() {
      return this.object_handle_in_dom;
    },
    
    // Get/set state
    getState() {
      return { ...this._state };
    },
    
    setState(updates) {
      this._state = { ...this._state, ...updates };
      if (this._taco.o?.onStateChange) {
        this._taco.o.onStateChange(this._state, updates);
      }
      return this;
    },
    
    // Update component (re-render)
    update() {
      if (!this._mounted || !this.element) return this;
      
      const parent = this.element.parentNode;
      this.element.nextSibling;
      
      // Update TACO with current state
      if (this._taco.o) {
        this._taco.o.state = this._state;
      }
      
      // Re-render
      const newElement = bw.createDOM(this._taco);
      newElement.setAttribute('data-bw-id', componentId);
      
      // Replace in DOM
      parent.replaceChild(newElement, this.element);
      this.object_handle_in_dom = newElement;
      
      // Call update lifecycle
      if (this._taco.o?.onUpdate) {
        this._taco.o.onUpdate(newElement, this._state);
      }
      
      return this;
    },
    
    // Get/set properties
    getProp(key) {
      return this._taco.a?.[key];
    },
    
    setProp(key, value) {
      if (!this._taco.a) this._taco.a = {};
      this._taco.a[key] = value;
      
      // Update DOM attribute
      if (this.element) {
        if (value === null || value === undefined) {
          this.element.removeAttribute(key);
        } else if (value === true) {
          this.element.setAttribute(key, '');
        } else {
          this.element.setAttribute(key, String(value));
        }
      }
      
      return this;
    },
    
    // Get/set content
    getContent() {
      return this._taco.c;
    },
    
    setContent(content) {
      this._taco.c = content;
      if (this.element) {
        if (typeof content === 'string') {
          this.element.textContent = content;
        } else {
          // Re-render for complex content
          this.update();
        }
      }
      return this;
    },
    
    // Add/remove CSS classes
    addClass(className) {
      if (this.element) {
        this.element.classList.add(className);
      }
      return this;
    },
    
    removeClass(className) {
      if (this.element) {
        this.element.classList.remove(className);
      }
      return this;
    },
    
    toggleClass(className) {
      if (this.element) {
        this.element.classList.toggle(className);
      }
      return this;
    },
    
    hasClass(className) {
      return this.element ? this.element.classList.contains(className) : false;
    },
    
    // Show/hide
    show() {
      if (this.element) {
        this.element.style.display = '';
      }
      return this;
    },
    
    hide() {
      if (this.element) {
        this.element.style.display = 'none';
      }
      return this;
    },
    
    // Event handling
    on(event, handler) {
      if (this.element) {
        this.element.addEventListener(event, handler);
      }
      return this;
    },
    
    off(event, handler) {
      if (this.element) {
        this.element.removeEventListener(event, handler);
      }
      return this;
    },
    
    // Destroy component
    destroy() {
      if (!this._mounted) return this;
      
      // Call unmount lifecycle
      if (this._taco.o?.unmount) {
        this._taco.o.unmount(this.element);
      }
      
      // Remove from DOM
      if (this.element && this.element.parentNode) {
        this.element.parentNode.removeChild(this.element);
      }
      
      // Remove from registry
      bw._componentRegistry.delete(componentId);
      
      // Clean up
      this._mounted = false;
      this.object_handle_in_dom = null;
      this.status_code = 'destroyed';
      
      return this;
    }
  };
  
  // Store in registry
  bw._componentRegistry.set(componentId, handle);
  
  // Call mounted lifecycle
  if (taco.o?.mounted) {
    taco.o.mounted(domElement, handle);
  }
  
  return handle;
};

/**
 * Get a component handle by its ID from the component registry.
 *
 * @param {string} id - Component ID (from bw.render)
 * @returns {Object|null} Component handle or null if not found
 * @category DOM Generation
 * @see bw.render
 */
bw.getComponent = function(id) {
  return bw._componentRegistry.get(id) || null;
};

/**
 * Get all registered component handles as a Map.
 *
 * @returns {Map} Map of componentId → component handle
 * @category DOM Generation
 * @see bw.getComponent
 */
bw.getAllComponents = function() {
  return new Map(bw._componentRegistry);
};

// Register all make functions
Object.entries(components).forEach(([name, fn]) => {
  if (name.startsWith('make')) {
    bw[name] = fn;
  }
});

// Register component handles
bw._componentHandles = componentHandles;

// Create functions that return handles
Object.entries(components).forEach(([name, fn]) => {
  if (name.startsWith('make')) {
    const componentType = name.substring(4).toLowerCase(); // Remove 'make' prefix
    const createName = 'create' + name.substring(4); // createCard, createTable, etc.
    
    bw[createName] = function(props) {
      const taco = fn(props);
      const handle = bw.renderComponent(taco);
      
      // Use specialized handle class if available
      const HandleClass = bw._componentHandles[componentType];
      if (HandleClass) {
        const specializedHandle = new HandleClass(handle.element, taco);
        // Copy base handle properties
        Object.setPrototypeOf(specializedHandle, handle);
        return specializedHandle;
      }
      
      return handle;
    };
  }
});

// Manual registration for functions defined in this file
// createTable
bw.createTable = function(data, options = {}) {
  const taco = bw.makeTable({ data, ...options });
  const handle = bw.renderComponent(taco);
  
  // Use specialized TableHandle
  const TableHandle = bw._componentHandles.table;
  if (TableHandle) {
    const specializedHandle = new TableHandle(handle.element, taco);
    Object.setPrototypeOf(specializedHandle, handle);
    return specializedHandle;
  }
  
  return handle;
};

// Also attach to global in browsers
if (bw._isBrowser && typeof window !== 'undefined') {
  window.bw = bw;
}

export { bw as default };
//# sourceMappingURL=bitwrench.esm.js.map
