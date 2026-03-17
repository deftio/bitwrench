/*! bitwrench v2.0.18 | BSD-2-Clause | https://deftio.github.com/bitwrench/pages */
'use strict';

var _documentCurrentScript = typeof document !== 'undefined' ? document.currentScript : null;
/**
 * Auto-generated version file from package.json
 * DO NOT EDIT DIRECTLY - Use npm run generate-version
 */

const VERSION_INFO = {
  version: '2.0.18',
  name: 'bitwrench',
  description: 'A library for javascript UI functions.',
  license: 'BSD-2-Clause',
  homepage: 'https://deftio.github.com/bitwrench/pages',
  repository: 'git+https://github.com/deftio/bitwrench.git',
  author: 'manu a. chatterjee <deftio@deftio.com> (https://deftio.com/)',
  buildDate: '2026-03-16T21:59:49.105Z'
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
 * @copy Manu Chatterjee @deftio
 */

function _xs (x) {
  return ('0' + x.toString(16)).slice(-2)
}
/**
 * Clamp a value between min and max.
 * @param {number} val
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function clip$1(val, min, max) {
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
  if (rnd === undefined) rnd = true;
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

  if (rnd) {
    h = Math.round(h);
    s = Math.round(s);
    l = Math.round(l);
    a = Math.round(a);
  }

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
  var hsl = colorRgbToHsl(rgb[0], rgb[1], rgb[2], 255, false);
  return [hsl[0], hsl[1], hsl[2]];
}

/**
 * Convert HSL array to hex color string.
 * @param {Array} hsl - [h, s, l] where h=0-360, s=0-100, l=0-100
 * @returns {string} Hex color e.g. '#006666'
 */
function hslToHex(hsl) {
  var rgb = colorHslToRgb(hsl[0], hsl[1], hsl[2], 255, true);
  return '#' + _xs(rgb[0])+_xs(rgb[1])+_xs(rgb[2]);
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
  hsl[2] = clip$1(hsl[2] + amount, 0, 100);
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
  return '#' + _xs(r) + _xs(g) + _xs(b);
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
 * Shift a color's hue toward a target hue by a given amount.
 * Uses shortest-arc interpolation on the hue wheel.
 * @param {string} sourceHex - Color to shift
 * @param {string} targetHex - Color whose hue to shift toward
 * @param {number} [amount=0.20] - 0 = no shift, 1 = full shift to target hue
 * @returns {string} Harmonized hex color
 */
function harmonize(sourceHex, targetHex, amount) {
  if (amount === undefined) amount = 0.20;
  if (amount === 0) return sourceHex;
  var srcHsl = hexToHsl(sourceHex);
  var tgtHsl = hexToHsl(targetHex);

  // Shortest-arc hue interpolation
  var diff = tgtHsl[0] - srcHsl[0];
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;

  var newHue = (srcHsl[0] + diff * amount + 360) % 360;
  return hslToHex([newHue, srcHsl[1], srcHsl[2]]);
}

/**
 * Derive a full shade palette for a single semantic color.
 * @param {string} hex - Base color hex
 * @returns {Object} { base, hover, active, light, darkText, border, focus, textOn }
 */
function deriveShades(hex) {
  var rgb = colorParse(hex);
  // For light input colors (L > 75), mixing toward white produces invisible borders.
  // Darken instead so borders remain visible against light backgrounds.
  var borderColor = hexToHsl(hex)[2] > 75
    ? adjustLightness(hex, -18)
    : mixColor(hex, '#ffffff', 0.60);
  return {
    base: hex,
    hover: adjustLightness(hex, -10),
    active: adjustLightness(hex, -15),
    light: mixColor(hex, '#ffffff', 0.85),
    darkText: adjustLightness(hex, -40),
    border: borderColor,
    focus: 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',0.25)',
    textOn: textOnColor(hex)
  };
}

/**
 * Derive the alternate (luminance-inverted) version of a single seed color.
 * Preserves hue, mirrors lightness, adjusts saturation for readability.
 * @param {string} hex - Seed hex color
 * @returns {string} Alternate hex color
 */
function deriveAlternateSeed(hex) {
  var hsl = hexToHsl(hex);
  var h = hsl[0], s = hsl[1], l = hsl[2];
  var altL, altS;

  if (l > 50) {
    // Light color → make dark. Map 50-100 → 30-10 range
    altL = clip$1(100 - l - 10, 8, 40);
    // Reduce saturation slightly — vivid colors at low lightness look garish
    altS = clip$1(s * 0.85, 0, 100);
  } else {
    // Dark color → make light. Map 0-50 → 65-92 range
    altL = clip$1(100 - l + 10, 60, 92);
    // Slightly increase saturation for light variant
    altS = clip$1(s * 1.1, 0, 100);
  }

  return hslToHex([h, altS, altL]);
}

/**
 * Determine whether a palette config is "light-flavored" based on
 * the average luminance of its seed colors.
 * @param {Object} config - Theme config with primary, secondary hex colors
 * @returns {boolean} true if the seeds are predominantly light
 */
function isLightPalette(config) {
  var lum = relativeLuminance(config.primary);
  if (config.secondary) lum = (lum + relativeLuminance(config.secondary)) / 2;
  if (config.tertiary) lum = (lum * 2 + relativeLuminance(config.tertiary)) / 3;
  return lum > 0.179;
}

/**
 * Derive a complete alternate config from a primary theme config.
 * Each seed color is luminance-inverted; semantic colors are adjusted for
 * the new luminance context.
 * @param {Object} config - Primary theme config
 * @returns {Object} Alternate theme config (same shape, inverted lightness)
 */
function deriveAlternateConfig(config) {
  var alt = {};
  // Invert the user's seed colors
  alt.primary = deriveAlternateSeed(config.primary);
  alt.secondary = deriveAlternateSeed(config.secondary);
  alt.tertiary = config.tertiary ? deriveAlternateSeed(config.tertiary) : alt.primary;

  // Derive alternate surface colors from primary hue.
  // Check actual page surface brightness (not seed color brightness) to decide
  // whether alternate should be dark or light.  The page surface is what the
  // user sees; seeds can be dark while the page is still light (default L=96).
  var priHsl = hexToHsl(config.primary);
  var h = priHsl[0];
  var primarySurface = config.surface || hslToHex([h, 8, 96]);
  var isLight = relativeLuminance(primarySurface) > 0.179;

  if (isLight) {
    // Page surface is light → alternate needs dark surfaces
    alt.light = hslToHex([h, Math.min(priHsl[1], 15), 15]);
    alt.dark = hslToHex([h, 5, 88]);
    alt.surface = hslToHex([h, 12, 18]);
    alt.background = hslToHex([h, 10, 14]);
  } else {
    // Page surface is dark → alternate needs light surfaces
    alt.light = hslToHex([h, Math.min(priHsl[1], 10), 96]);
    alt.dark = hslToHex([h, 10, 18]);
    alt.surface = hslToHex([h, 8, 96]);
    alt.background = hslToHex([h, 6, 98]);
  }

  // Semantic colors: harmonize toward primary, then invert for alternate
  var amt = config.harmonize !== undefined ? config.harmonize : 0.20;
  var semanticDefaults = {
    success: '#198754', danger: '#dc3545',
    warning: '#f0ad4e', info: '#17a2b8'
  };
  var semantics = ['success', 'danger', 'warning', 'info'];
  for (var i = 0; i < semantics.length; i++) {
    var key = semantics[i];
    var seed = config[key] || semanticDefaults[key];
    var harmonized = harmonize(seed, config.primary, amt);
    alt[key] = deriveAlternateSeed(harmonized);
  }

  // Semantic colors are already harmonized+inverted — don't re-harmonize in derivePalette
  alt.harmonize = 0;

  return alt;
}

/**
 * Derive complete palette from a theme config object.
 * Semantic colors are harmonized toward the primary hue (configurable).
 * Light/dark surface colors are tinted with the primary hue.
 * @param {Object} config - Theme config with primary, secondary, tertiary, etc.
 * @param {number} [config.harmonize=0.20] - Hue shift amount for semantic colors (0-1)
 * @returns {Object} Full palette with shades for all 9 semantic colors
 */
function derivePalette(config) {
  var amt = config.harmonize !== undefined ? config.harmonize : 0.20;
  var pri = config.primary;
  var priHsl = hexToHsl(pri);
  var h = priHsl[0];

  // Semantic defaults — harmonized toward primary hue
  var successBase = harmonize(config.success || '#198754', pri, amt);
  var dangerBase  = harmonize(config.danger  || '#dc3545', pri, amt);
  var warningBase = harmonize(config.warning || '#f0ad4e', pri, amt);
  var infoBase    = harmonize(config.info    || '#17a2b8', pri, amt);

  // Light/dark: derive from primary hue with low saturation (if not user-supplied)
  var lightBase = config.light || hslToHex([h, 8, 97]);
  var darkBase  = config.dark  || hslToHex([h, 10, 13]);

  // Background & surface tokens — tinted with primary hue for theme personality.
  // Saturation high enough that the hue is visible (each theme feels distinct)
  // but low enough to stay neutral and readable.
  // User can override with config.background / config.surface.
  var bgBase = config.background || hslToHex([h, 22, 96]);
  var surfBase = config.surface || hslToHex([h, 25, 94]);

  // surfaceAlt: subtle background variant for striped rows, hover states, headers.
  // Slightly lighter than surface in dark mode, slightly darker in light mode.
  var surfHsl = hexToHsl(surfBase);
  var surfAlt = surfHsl[2] <= 50
    ? hslToHex([surfHsl[0], surfHsl[1], Math.min(surfHsl[2] + 8, 100)])
    : hslToHex([surfHsl[0], surfHsl[1], Math.max(surfHsl[2] - 3, 0)]);

  var palette = {
    primary:    deriveShades(config.primary),
    secondary:  deriveShades(config.secondary),
    tertiary:   deriveShades(config.tertiary),
    success:    deriveShades(successBase),
    danger:     deriveShades(dangerBase),
    warning:    deriveShades(warningBase),
    info:       deriveShades(infoBase),
    light:      deriveShades(lightBase),
    dark:       deriveShades(darkBase),
    background: bgBase,
    surface:    surfBase,
    surfaceAlt: surfAlt
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

/**
 * Base spacing scale (4px unit). Shared design token for consistent spacing
 * across all components. Use scale keys (0-7) in component definitions.
 */
var SPACING_SCALE = {
  1: '0.25rem',   // 4px
  2: '0.5rem',    // 8px
  3: '0.75rem',   // 12px
  4: '1rem',      // 16px
  5: '1.5rem',    // 24px
  6: '2rem'};

let _S=SPACING_SCALE;

var SPACING_PRESETS = {
  compact:  { btn: _S[1] + ' ' + _S[3],  card: _S[3] + ' ' + _S[4], alert: _S[2] + ' ' + _S[4], cell: _S[2] + ' ' + _S[3], input: _S[1] + ' ' + _S[3] },
  normal:   { btn: _S[2] + ' ' + _S[4],  card: _S[5] + ' ' + _S[5], alert: _S[3] + ' ' + _S[5], cell: _S[3] + ' ' + _S[4], input: _S[2] + ' ' + _S[3] },
  spacious: { btn: _S[3] + ' ' + _S[5],  card: _S[6] + ' ' + _S[6], alert: _S[4] + ' ' + _S[5], cell: _S[4] + ' ' + _S[5], input: _S[3] + ' ' + _S[4] }
};

var RADIUS_PRESETS = {
  none: { btn: '0', card: '0', badge: '0', alert: '0', input: '0' },
  sm:   { btn: '4px', card: '4px', badge: '.25rem', alert: '4px', input: '4px' },
  md:   { btn: '6px', card: '8px', badge: '.375rem', alert: '8px', input: '6px' },
  lg:   { btn: '10px', card: '12px', badge: '.5rem', alert: '12px', input: '10px' },
  pill: { btn: '50rem', card: '1rem', badge: '50rem', alert: '1rem', input: '50rem' }
};

// ---- Typography scale presets ----

var TYPE_RATIO_PRESETS = {
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
function generateTypeScale(base, ratio) {
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

var ELEVATION_PRESETS = {
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

var MOTION_PRESETS = {
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
var DEFAULT_PALETTE_CONFIG = {
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
var THEME_PRESETS = Object.fromEntries([
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
function resolveLayout(config) {
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
var _sx=scopeSelector;

// =========================================================================
// Themed CSS generators
// =========================================================================

function generateTypographyThemed(scope, palette, layout) {
  var mot = layout.motion;
  var rules = {};
  rules[_sx(scope, 'a')] = {
    'color': palette.primary.base,
    'text-decoration': 'none',
    'transition': 'color ' + mot.fast + ' ' + mot.easing
  };
  rules[_sx(scope, 'a:hover')] = {
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
  rules[_sx(scope, '.bw_btn')] = {
    'padding': sp.btn,
    'border-radius': rd.btn
  };
  rules[_sx(scope, '.bw_btn:focus-visible')] = {
    'outline': '2px solid currentColor',
    'outline-offset': '2px',
    'box-shadow': '0 0 0 3px ' + palette.primary.focus
  };

  // Variant colors handled by palette class on component root

  // Size variants (structural, reuse layout radius)
  rules[_sx(scope, '.bw_btn_lg')] = {
    'padding': '0.625rem 1.5rem',
    'font-size': '1rem',
    'border-radius': rd.btn === '50rem' ? '50rem' : (parseInt(rd.btn) + 2) + 'px'
  };
  rules[_sx(scope, '.bw_btn_sm')] = {
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

  rules[_sx(scope, '.bw_alert')] = {
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
  rules[_sx(scope, '.bw_card')] = {
    'background-color': palette.surface || '#fff',
    'border': '1px solid ' + palette.light.border,
    'border-radius': rd.card,
    'box-shadow': elev.sm,
    'transition': 'box-shadow ' + motion.normal + ' ' + motion.easing + ', transform ' + motion.normal + ' ' + motion.easing
  };
  rules[_sx(scope, '.bw_card:hover')] = {
    'box-shadow': elev.md
  };
  rules[_sx(scope, '.bw_card_hoverable:hover')] = {
    'box-shadow': elev.lg
  };
  rules[_sx(scope, '.bw_card_body')] = {
    'padding': sp.card
  };
  rules[_sx(scope, '.bw_card_header')] = {
    'padding': sp.card.split(' ').map(function(v) { return (parseFloat(v) * 0.7).toFixed(3).replace(/\.?0+$/, '') + 'rem'; }).join(' '),
    'background-color': palette.surfaceAlt,
    'border-bottom': '1px solid ' + palette.light.border
  };
  rules[_sx(scope, '.bw_card_footer')] = {
    'background-color': palette.surfaceAlt,
    'border-top': '1px solid ' + palette.light.border,
    'color': palette.secondary.base
  };
  rules[_sx(scope, '.bw_card_title')] = {
    'color': palette.dark.base
  };
  rules[_sx(scope, '.bw_card_subtitle')] = {
    'color': palette.secondary.base
  };

  // Card variant accent handled by palette class on component root

  return rules;
}

function generateForms(scope, palette, layout) {
  var rules = {};
  var sp = layout.spacing;
  var rd = layout.radius;

  rules[_sx(scope, '.bw_form_control')] = {
    'padding': sp.input,
    'border-radius': rd.input,
    'color': palette.dark.base,
    'background-color': palette.surface || '#fff',
    'border-color': palette.light.border
  };
  rules[_sx(scope, '.bw_form_control:focus')] = {
    'border-color': palette.primary.border,
    'outline': '2px solid ' + palette.primary.base,
    'outline-offset': '-1px',
    'box-shadow': '0 0 0 0.25rem ' + palette.primary.focus
  };
  rules[_sx(scope, '.bw_form_control::placeholder')] = {
    'color': palette.secondary.base
  };
  rules[_sx(scope, '.bw_form_label')] = {
    'color': palette.dark.base
  };
  rules[_sx(scope, '.bw_form_text')] = {
    'color': palette.secondary.base
  };
  rules[_sx(scope, '.bw_form_check_input:checked')] = {
    'background-color': palette.primary.base,
    'border-color': palette.primary.base
  };
  rules[_sx(scope, '.bw_form_check_input:focus')] = {
    'box-shadow': '0 0 0 0.25rem ' + palette.primary.focus
  };
  // Validation states
  rules[_sx(scope, '.bw_form_control.bw_is_valid')] = { 'border-color': palette.success.base };
  rules[_sx(scope, '.bw_form_control.bw_is_valid:focus')] = {
    'border-color': palette.success.base,
    'box-shadow': '0 0 0 0.2rem ' + palette.success.focus
  };
  rules[_sx(scope, '.bw_form_control.bw_is_invalid')] = { 'border-color': palette.danger.base };
  rules[_sx(scope, '.bw_form_control.bw_is_invalid:focus')] = {
    'border-color': palette.danger.base,
    'box-shadow': '0 0 0 0.2rem ' + palette.danger.focus
  };
  // Form select
  rules[_sx(scope, '.bw_form_select')] = {
    'padding': sp.input,
    'border-radius': rd.input,
    'color': palette.dark.base,
    'background-color': palette.surface || '#fff',
    'border-color': palette.light.border
  };
  rules[_sx(scope, '.bw_form_select:focus')] = {
    'border-color': palette.primary.border,
    'box-shadow': '0 0 0 0.25rem ' + palette.primary.focus
  };

  return rules;
}

function generateNavigation(scope, palette, layout) {
  var rules = {};
  rules[_sx(scope, '.bw_navbar')] = {
    'background-color': palette.surfaceAlt,
    'border-bottom-color': palette.light.border
  };
  rules[_sx(scope, '.bw_navbar_brand')] = {
    'color': palette.dark.base
  };
  rules[_sx(scope, '.bw_navbar_nav .bw_nav_link')] = {
    'color': palette.secondary.base,
    'border-radius': layout.radius.btn
  };
  rules[_sx(scope, '.bw_navbar_nav .bw_nav_link:hover')] = {
    'color': palette.dark.base,
    'background-color': palette.surfaceAlt
  };
  rules[_sx(scope, '.bw_navbar_nav .bw_nav_link.active')] = {
    'color': palette.primary.base,
    'background-color': palette.primary.focus,
    'font-weight': '600'
  };
  rules[_sx(scope, '.bw_navbar_dark')] = {
    'background-color': palette.dark.base,
    'border-bottom-color': palette.dark.hover
  };
  rules[_sx(scope, '.bw_navbar_dark .bw_navbar_brand')] = {
    'color': palette.light.base
  };
  rules[_sx(scope, '.bw_navbar_dark .bw_nav_link')] = {
    'color': palette.light.border
  };
  rules[_sx(scope, '.bw_navbar_dark .bw_nav_link:hover')] = {
    'color': palette.light.base
  };
  rules[_sx(scope, '.bw_navbar_dark .bw_nav_link.active')] = {
    'color': palette.light.base,
    'font-weight': '600'
  };
  rules[_sx(scope, '.bw_nav_pills .bw_nav_link.active')] = {
    'color': palette.primary.textOn,
    'background-color': palette.primary.base
  };
  return rules;
}

function generateTables(scope, palette, layout) {
  var rules = {};
  var sp = layout.spacing;

  rules[_sx(scope, '.bw_table')] = {
    'color': palette.dark.base,
    'border-color': palette.light.border
  };
  rules[_sx(scope, '.bw_table > :not(caption) > * > *')] = {
    'padding': sp.cell,
    'border-bottom-color': palette.light.border
  };
  rules[_sx(scope, '.bw_table > thead > tr > *')] = {
    'color': palette.secondary.base,
    'border-bottom-color': palette.light.border,
    'background-color': palette.surfaceAlt
  };
  rules[_sx(scope, '.bw_table_striped > tbody > tr:nth-of-type(odd) > *')] = {
    'background-color': palette.surfaceAlt
  };
  rules[_sx(scope, '.bw_table_hover > tbody > tr:hover > *')] = {
    'background-color': palette.primary.focus
  };
  rules[_sx(scope, '.bw_table_selectable > tbody > tr')] = {
    'cursor': 'pointer'
  };
  rules[_sx(scope, '.bw_table > tbody > tr.bw_table_row_selected > *')] = {
    'background-color': palette.primary.light
  };
  rules[_sx(scope, '.bw_table_bordered')] = {
    'border-color': palette.light.border
  };
  rules[_sx(scope, '.bw_table caption')] = {
    'color': palette.secondary.base
  };

  return rules;
}

function generateTabs(scope, palette, layout) {
  var rules = {}, mo = layout.motion;
  rules[_sx(scope, '.bw_nav_tabs')] = {
    'border-bottom-color': palette.light.border
  };
  rules[_sx(scope, '.bw_nav_link')] = {
    'color': palette.secondary.base,
    'transition': 'color ' + mo.fast + ' ' + mo.easing + ', border-color ' + mo.fast + ' ' + mo.easing + ', background-color ' + mo.fast + ' ' + mo.easing
  };
  rules[_sx(scope, '.bw_nav_tabs .bw_nav_link:hover')] = {
    'color': palette.dark.base,
    'background-color': palette.surfaceAlt,
    'border-bottom-color': palette.light.border
  };
  rules[_sx(scope, '.bw_nav_tabs .bw_nav_link.active')] = {
    'color': palette.primary.base,
    'background-color': palette.primary.focus,
    'border-bottom': '2px solid ' + palette.primary.base
  };
  return rules;
}

function generateListGroups(scope, palette, layout) {
  var rules = {};
  var sp = layout.spacing;
  var mo = layout.motion;

  rules[_sx(scope, '.bw_list_group_item')] = {
    'padding': sp.cell,
    'color': palette.dark.base,
    'background-color': palette.surface || '#fff',
    'border-color': palette.light.border,
    'transition': 'color ' + mo.fast + ' ' + mo.easing + ', background-color ' + mo.fast + ' ' + mo.easing
  };
  rules[_sx(scope, 'a.bw_list_group_item:hover')] = {
    'background-color': palette.surfaceAlt,
    'color': palette.dark.hover
  };
  rules[_sx(scope, '.bw_list_group_item.active')] = {
    'color': palette.primary.textOn,
    'background-color': palette.primary.base,
    'border-color': palette.primary.base
  };
  rules[_sx(scope, '.bw_list_group_item.disabled')] = {
    'color': palette.secondary.base,
    'background-color': palette.surface || '#fff'
  };

  return rules;
}

function generatePagination(scope, palette, layout) {
  var rules = {}, mo = layout.motion, rd = layout.radius;
  rules[_sx(scope, '.bw_page_item:first-child .bw_page_link')] = {
    'border-top-left-radius': rd.btn,
    'border-bottom-left-radius': rd.btn
  };
  rules[_sx(scope, '.bw_page_item:last-child .bw_page_link')] = {
    'border-top-right-radius': rd.btn,
    'border-bottom-right-radius': rd.btn
  };
  rules[_sx(scope, '.bw_page_link')] = {
    'color': palette.primary.base,
    'background-color': palette.surface || '#fff',
    'border-color': palette.light.border,
    'transition': 'color ' + mo.fast + ' ' + mo.easing + ', background-color ' + mo.fast + ' ' + mo.easing
  };
  rules[_sx(scope, '.bw_page_link:hover')] = {
    'color': palette.primary.hover,
    'background-color': palette.surfaceAlt,
    'border-color': palette.light.border
  };
  rules[_sx(scope, '.bw_page_link:focus')] = {
    'outline': '2px solid ' + palette.primary.base,
    'outline-offset': '-2px'
  };
  rules[_sx(scope, '.bw_page_item.bw_active .bw_page_link')] = {
    'color': palette.primary.textOn,
    'background-color': palette.primary.base,
    'border-color': palette.primary.base
  };
  rules[_sx(scope, '.bw_page_item.bw_disabled .bw_page_link')] = {
    'color': palette.secondary.base,
    'background-color': palette.surface || '#fff',
    'border-color': palette.light.border
  };
  return rules;
}

function generateProgress(scope, palette) {
  var rules = {};
  rules[_sx(scope, '.bw_progress')] = {
    'background-color': palette.surfaceAlt,
    'box-shadow': 'inset 0 1px 2px rgba(0,0,0,.1)'
  };
  rules[_sx(scope, '.bw_progress_bar')] = {
    'color': palette.primary.textOn,
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
  rules[_sx(scope, 'body')] = baseReset;
  return rules;
}

function generateBreadcrumbThemed(scope, palette, layout) {
  var rules = {}, mo = layout.motion;
  rules[_sx(scope, '.bw_breadcrumb')] = {
    'background-color': palette.surfaceAlt,
    'padding': '0.625rem 1rem',
    'border-radius': layout.radius.btn
  };
  rules[_sx(scope, '.bw_breadcrumb_item + .bw_breadcrumb_item::before')] = {
    'color': palette.secondary.base
  };
  rules[_sx(scope, '.bw_breadcrumb_item a')] = {
    'color': palette.primary.base,
    'transition': 'color ' + mo.fast + ' ' + mo.easing
  };
  rules[_sx(scope, '.bw_breadcrumb_item a:hover')] = {
    'color': palette.primary.hover,
    'text-decoration': 'underline'
  };
  rules[_sx(scope, '.bw_breadcrumb_item.active')] = {
    'color': palette.dark.base
  };
  return rules;
}

// generateSpinnerThemed: removed — palette class on root handles variants

function generateCloseButtonThemed(scope, palette) {
  var rules = {};
  rules[_sx(scope, '.bw_close')] = {
    'color': palette.dark.base,
    'opacity': '0.5'
  };
  rules[_sx(scope, '.bw_close:focus')] = {
    'box-shadow': '0 0 0 0.25rem ' + palette.primary.focus
  };
  return rules;
}

function generateSectionsThemed(scope, palette) {
  var rules = {};
  rules[_sx(scope, '.bw_section_subtitle')] = {
    'color': palette.secondary.base
  };
  rules[_sx(scope, '.bw_feature_description')] = {
    'color': palette.secondary.base
  };
  rules[_sx(scope, '.bw_cta_description')] = {
    'color': palette.secondary.base
  };
  return rules;
}

function generateAccordionThemed(scope, palette, layout) {
  var rules = {};
  var rd = layout ? layout.radius : { card: '8px' };
  rules[_sx(scope, '.bw_accordion_item')] = {
    'background-color': palette.surface || '#fff',
    'border-color': palette.light.border
  };
  rules[_sx(scope, '.bw_accordion_item:first-child')] = {
    'border-top-left-radius': rd.card,
    'border-top-right-radius': rd.card
  };
  rules[_sx(scope, '.bw_accordion_item:last-child')] = {
    'border-bottom-left-radius': rd.card,
    'border-bottom-right-radius': rd.card
  };
  rules[_sx(scope, '.bw_accordion_button')] = {
    'color': palette.dark.base
  };
  rules[_sx(scope, '.bw_accordion_button:not(.bw_collapsed)')] = {
    'color': palette.primary.darkText,
    'background-color': palette.primary.light,
    'border-left': '3px solid ' + palette.primary.base
  };
  rules[_sx(scope, '.bw_accordion_button:hover')] = {
    'background-color': palette.surfaceAlt
  };
  rules[_sx(scope, '.bw_accordion_button:not(.bw_collapsed):hover')] = {
    'background-color': palette.primary.base,
    'color': palette.primary.textOn
  };
  rules[_sx(scope, '.bw_accordion_button:focus-visible')] = {
    'box-shadow': '0 0 0 0.2rem ' + palette.primary.focus
  };
  rules[_sx(scope, '.bw_accordion_body')] = {
    'border-top': '1px solid ' + palette.light.border,
    'background-color': palette.surfaceAlt
  };
  return rules;
}

function generateCarouselThemed(scope, palette) {
  var rules = {};
  rules[_sx(scope, '.bw_carousel')] = {
    'background-color': palette.surfaceAlt
  };
  rules[_sx(scope, '.bw_carousel_indicator.active')] = {
    'background-color': palette.primary.base
  };
  rules[_sx(scope, '.bw_carousel_control')] = {
    'background-color': palette.dark.base,
    'color': palette.dark.textOn
  };
  rules[_sx(scope, '.bw_carousel_control:hover')] = {
    'background-color': palette.dark.hover
  };
  rules[_sx(scope, '.bw_carousel_caption')] = {
    'background': 'linear-gradient(transparent, ' + palette.dark.base + ')',
    'color': palette.dark.textOn
  };
  return rules;
}

function generateModalThemed(scope, palette, layout) {
  var rules = {};
  rules[_sx(scope, '.bw_modal_content')] = {
    'background-color': palette.surface || '#fff',
    'border-color': palette.light.border,
    'box-shadow': layout.elevation.lg
  };
  rules[_sx(scope, '.bw_modal_header')] = {
    'border-bottom-color': palette.light.border
  };
  rules[_sx(scope, '.bw_modal_footer')] = {
    'border-top-color': palette.light.border
  };
  rules[_sx(scope, '.bw_modal_title')] = {
    'color': palette.dark.base
  };
  return rules;
}

function generateToastThemed(scope, palette, layout) {
  var rules = {};
  rules[_sx(scope, '.bw_toast')] = {
    'background-color': palette.surface || '#fff',
    'border-color': palette.light.border,
    'box-shadow': layout.elevation.lg
  };
  rules[_sx(scope, '.bw_toast_header')] = {
    'border-bottom-color': palette.light.border
  };
  // Variant toast borders handled by palette class
  return rules;
}

function generateDropdownThemed(scope, palette, layout) {
  var rules = {};
  rules[_sx(scope, '.bw_dropdown_menu')] = {
    'background-color': palette.surface || '#fff',
    'border-color': palette.light.border,
    'box-shadow': layout.elevation.md
  };
  rules[_sx(scope, '.bw_dropdown_item')] = {
    'color': palette.dark.base,
    'transition': 'background-color ' + layout.motion.fast + ' ' + layout.motion.easing
  };
  rules[_sx(scope, '.bw_dropdown_item:hover')] = {
    'color': palette.dark.hover,
    'background-color': palette.surfaceAlt
  };
  rules[_sx(scope, '.bw_dropdown_item.disabled')] = {
    'color': palette.secondary.base
  };
  rules[_sx(scope, '.bw_dropdown_divider')] = {
    'border-top-color': palette.light.border
  };
  return rules;
}

function generateSwitchThemed(scope, palette) {
  var rules = {};
  rules[_sx(scope, '.bw_form_switch .bw_switch_input')] = {
    'background-color': palette.secondary.base,
    'border-color': palette.secondary.base
  };
  rules[_sx(scope, '.bw_form_switch .bw_switch_input:checked')] = {
    'background-color': palette.primary.base,
    'border-color': palette.primary.base
  };
  rules[_sx(scope, '.bw_form_switch .bw_switch_input:focus')] = {
    'box-shadow': '0 0 0 0.25rem ' + palette.primary.focus
  };
  return rules;
}

function generateSkeletonThemed(scope, palette) {
  var rules = {};
  rules[_sx(scope, '.bw_skeleton')] = {
    'background': 'linear-gradient(90deg, ' + palette.light.border + ' 25%, ' + palette.surfaceAlt + ' 37%, ' + palette.light.border + ' 63%)'
  };
  return rules;
}

// generateAvatarThemed: removed — palette class on root handles variants

function generateStatCardThemed(scope, palette, layout) {
  var rules = {}, mo = layout.motion, el = layout.elevation, rd = layout.radius;
  rules[_sx(scope, '.bw_stat_card')] = {
    'background-color': palette.surface || '#fff',
    'color': palette.dark.base,
    'border': '1px solid ' + palette.light.border,
    'border-radius': rd.card,
    'box-shadow': el.sm,
    'transition': 'box-shadow ' + mo.fast + ' ' + mo.easing + ', transform ' + mo.fast + ' ' + mo.easing
  };
  rules[_sx(scope, '.bw_stat_card:hover')] = { 'box-shadow': el.md };
  // Variant border colors handled by palette class
  rules[_sx(scope, '.bw_stat_change_up')] = { 'color': palette.success.base };
  rules[_sx(scope, '.bw_stat_change_down')] = { 'color': palette.danger.base };
  return rules;
}

function generateTimelineThemed(scope, palette) {
  var rules = {};
  rules[_sx(scope, '.bw_timeline::before')] = { 'background-color': palette.light.border };
  // Variant marker colors handled by palette class
  rules[_sx(scope, '.bw_timeline_date')] = { 'color': palette.secondary.base };
  return rules;
}

function generateStepperThemed(scope, palette) {
  var rules = {};
  rules[_sx(scope, '.bw_step_indicator')] = {
    'background-color': palette.surfaceAlt,
    'border': '2px solid ' + palette.light.border,
    'color': palette.secondary.base
  };
  rules[_sx(scope, '.bw_step + .bw_step::before')] = { 'background-color': palette.light.border };
  rules[_sx(scope, '.bw_step_active .bw_step_indicator')] = {
    'background-color': palette.primary.base,
    'color': palette.primary.textOn
  };
  rules[_sx(scope, '.bw_step_active .bw_step_label')] = {
    'color': palette.dark.base,
    'font-weight': '600'
  };
  rules[_sx(scope, '.bw_step_completed .bw_step_indicator')] = {
    'background-color': palette.primary.base,
    'color': palette.primary.textOn
  };
  rules[_sx(scope, '.bw_step_completed .bw_step_label')] = { 'color': palette.primary.base };
  rules[_sx(scope, '.bw_step_completed + .bw_step::before')] = { 'background-color': palette.primary.base };
  return rules;
}

function generateChipInputThemed(scope, palette) {
  var rules = {};
  rules[_sx(scope, '.bw_chip_input')] = {
    'border-color': palette.light.border,
    'background-color': palette.surface || '#fff',
    'color': palette.dark.base
  };
  rules[_sx(scope, '.bw_chip_input:focus-within')] = {
    'border-color': palette.primary.base,
    'box-shadow': '0 0 0 0.2rem ' + palette.primary.focus
  };
  rules[_sx(scope, '.bw_chip')] = {
    'background-color': palette.surfaceAlt,
    'color': palette.dark.base
  };
  rules[_sx(scope, '.bw_chip_remove:hover')] = {
    'color': palette.danger.base,
    'background-color': palette.danger.light
  };
  return rules;
}

function generateFileUploadThemed(scope, palette, layout) {
  var rules = {}, mo = layout.motion;
  rules[_sx(scope, '.bw_file_upload')] = {
    'border-color': palette.light.border,
    'background-color': palette.surfaceAlt,
    'transition': 'border-color ' + mo.fast + ' ' + mo.easing + ', background-color ' + mo.fast + ' ' + mo.easing
  };
  rules[_sx(scope, '.bw_file_upload:hover')] = {
    'border-color': palette.primary.base,
    'background-color': palette.primary.light
  };
  rules[_sx(scope, '.bw_file_upload:focus')] = {
    'outline': '2px solid ' + palette.primary.base,
    'outline-offset': '2px'
  };
  rules[_sx(scope, '.bw_file_upload.bw_file_upload_active')] = {
    'border-color': palette.primary.base,
    'background-color': palette.primary.light,
    'border-style': 'solid'
  };
  return rules;
}

function generateRangeThemed(scope, palette) {
  var rules = {};
  rules[_sx(scope, '.bw_range')] = { 'background-color': palette.light.border };
  rules[_sx(scope, '.bw_range::-webkit-slider-thumb')] = {
    'background-color': palette.primary.base,
    'border-color': palette.surface || '#fff',
    'box-shadow': '0 1px 3px rgba(0,0,0,0.2)',
    'transition': 'background-color 0.15s ease-out, transform 0.15s ease-out'
  };
  rules[_sx(scope, '.bw_range::-moz-range-thumb')] = {
    'background-color': palette.primary.base,
    'border-color': palette.surface || '#fff',
    'box-shadow': '0 1px 3px rgba(0,0,0,0.2)'
  };
  return rules;
}

function generateTooltipThemed(scope, palette, layout) {
  var rules = {}, sp = layout.spacing, rd = layout.radius, el = layout.elevation, mo = layout.motion;
  rules[_sx(scope, '.bw_tooltip')] = {
    'background-color': palette.dark.base, 'color': palette.dark.textOn,
    'padding': sp.input, 'border-radius': rd.badge, 'box-shadow': el.md,
    'transition': 'opacity ' + mo.fast + ' ' + mo.easing + ', transform ' + mo.fast + ' ' + mo.easing
  };
  return rules;
}

function generatePopoverThemed(scope, palette, layout) {
  var rules = {}, sp = layout.spacing, rd = layout.radius, el = layout.elevation, mo = layout.motion;
  rules[_sx(scope, '.bw_popover')] = {
    'background-color': palette.surface || '#fff', 'color': palette.dark.base,
    'border': '1px solid ' + palette.light.border, 'border-radius': rd.card, 'box-shadow': el.lg,
    'transition': 'opacity ' + mo.fast + ' ' + mo.easing + ', transform ' + mo.fast + ' ' + mo.easing
  };
  rules[_sx(scope, '.bw_popover_header')] = {
    'background-color': palette.surfaceAlt, 'border-bottom': '1px solid ' + palette.light.border,
    'padding': sp.input
  };
  rules[_sx(scope, '.bw_popover_body')] = { 'padding': sp.card };
  return rules;
}

function generateSearchThemed(scope, palette, layout) {
  var rules = {}, mo = layout.motion;
  rules[_sx(scope, '.bw_search_input')] = {
    'background-color': palette.surface || '#fff',
    'color': palette.dark.base
  };
  rules[_sx(scope, '.bw_search_clear')] = {
    'transition': 'color ' + mo.fast + ' ' + mo.easing + ', background-color ' + mo.fast + ' ' + mo.easing
  };
  rules[_sx(scope, '.bw_search_clear:hover')] = { 'color': palette.dark.base };
  return rules;
}

function generateCodeDemoThemed(scope, palette, layout) {
  var rules = {};
  var rd = layout ? layout.radius : { card: '0.375rem' };
  rules[_sx(scope, '.bw_code_demo')] = {
    'background-color': palette.surface || '#fff',
    'color': palette.dark.base,
    'border-radius': rd.card
  };
  rules[_sx(scope, '.bw_code_copy_btn_copied')] = {
    'background': palette.success.base,
    'color': palette.success.textOn,
    'border-color': palette.success.base
  };
  rules[_sx(scope, '.bw_copy_btn:hover')] = {
    'background': 'rgba(255,255,255,0.2)',
    'color': '#fff'
  };
  return rules;
}

function generateNavPillsThemed(scope, palette, layout) {
  var rules = {};
  var rd = layout.radius;
  rules[_sx(scope, '.bw_nav_pills .bw_nav_link')] = { 'border-radius': rd.btn };
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

    // --- Component-specific overrides ---

    // Alerts: light bg, dark text, subtle border
    rules[_sx(scope, '.bw_alert.bw_' + k)] = {
      'background-color': s.light,
      'color': s.darkText,
      'border-color': s.border
    };

    // Toast: inherit bg, left border accent
    rules[_sx(scope, '.bw_toast.bw_' + k)] = {
      'background-color': 'inherit',
      'color': 'inherit',
      'border-left': '4px solid ' + s.base
    };

    // Stat card: inherit bg, left border accent
    rules[_sx(scope, '.bw_stat_card.bw_' + k)] = {
      'background-color': 'inherit',
      'color': 'inherit',
      'border-left-color': s.base
    };

    // Card accent: left border accent, inherit bg
    rules[_sx(scope, '.bw_card.bw_' + k)] = {
      'background-color': 'inherit',
      'color': 'inherit',
      'border-left': '4px solid ' + s.base
    };

    // Timeline marker: colored dot
    rules[_sx(scope, '.bw_timeline_marker.bw_' + k)] = {
      'box-shadow': '0 0 0 2px ' + s.base
    };

    // Spinner: set color, re-apply border pattern so the root palette class
    // border-color doesn't fill in the transparent gap that makes it spin.
    // Also neutralize hover/active which would override border-right-color.
    rules[_sx(scope, '.bw_spinner_border.bw_' + k)] = {
      'background-color': 'transparent',
      'color': s.base,
      'border-color': s.base,
      'border-right-color': 'transparent'
    };
    rules[_sx(scope, '.bw_spinner_border.bw_' + k + ':hover')] = {
      'background-color': 'transparent',
      'border-color': s.base,
      'border-right-color': 'transparent'
    };
    rules[_sx(scope, '.bw_spinner_grow.bw_' + k)] = {
      'background-color': s.base,
      'color': s.base
    };

    // Outline button: transparent bg, colored border+text, solid on hover
    rules[_sx(scope, '.bw_btn_outline.bw_' + k)] = {
      'background-color': 'transparent',
      'color': s.base,
      'border-color': s.base
    };
    rules[_sx(scope, '.bw_btn_outline.bw_' + k + ':hover')] = {
      'background-color': s.base,
      'color': s.textOn
    };

    // Hero: gradient background
    rules[_sx(scope, '.bw_hero.bw_' + k)] = {
      'background': 'linear-gradient(135deg, ' + s.base + ' 0%, ' + s.hover + ' 100%)',
      'color': s.textOn
    };

    // Progress bar: contrasting text on colored bg
    rules[_sx(scope, '.bw_progress_bar.bw_' + k)] = {
      'color': s.textOn
    };

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

  // Text muted — always a neutral gray, never a brand color
  rules[_sx(scope, '.bw_text_muted')] = { 'color': '#6c757d' };

  // Common bg/text utilities that aren't per-variant
  rules[_sx(scope, '.bw_bg_dark')] = { 'background-color': '#212529', 'color': '#f8f9fa' };
  rules[_sx(scope, '.bw_bg_light')] = { 'background-color': '#f8f9fa', 'color': '#212529' };
  rules[_sx(scope, '.bw_text_light')] = { 'color': '#f8f9fa' };
  rules[_sx(scope, '.bw_text_dark')] = { 'color': '#212529' };

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
    generateTypographyThemed(scopeName, palette, layout),
    generateButtons(scopeName, palette, layout),
    generateAlerts(scopeName, palette, layout),
    generateCards(scopeName, palette, layout),
    generateForms(scopeName, palette, layout),
    generateNavigation(scopeName, palette, layout),
    generateTables(scopeName, palette, layout),
    generateTabs(scopeName, palette, layout),
    generateListGroups(scopeName, palette, layout),
    generatePagination(scopeName, palette, layout),
    generateProgress(scopeName, palette),
    generateBreadcrumbThemed(scopeName, palette, layout),
    generateCloseButtonThemed(scopeName, palette),
    generateSectionsThemed(scopeName, palette),
    generateAccordionThemed(scopeName, palette, layout),
    generateCarouselThemed(scopeName, palette),
    generateModalThemed(scopeName, palette, layout),
    generateToastThemed(scopeName, palette, layout),
    generateDropdownThemed(scopeName, palette, layout),
    generateSwitchThemed(scopeName, palette),
    generateSkeletonThemed(scopeName, palette),
    generateStatCardThemed(scopeName, palette, layout),
    generateTimelineThemed(scopeName, palette),
    generateStepperThemed(scopeName, palette),
    generateChipInputThemed(scopeName, palette),
    generateFileUploadThemed(scopeName, palette, layout),
    generateRangeThemed(scopeName, palette),
    generateSearchThemed(scopeName, palette, layout),
    generateTooltipThemed(scopeName, palette, layout),
    generatePopoverThemed(scopeName, palette, layout),
    generateCodeDemoThemed(scopeName, palette, layout),
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
      'width': '100%', 'padding-right': '0.75rem', 'padding-left': '0.75rem',
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
    '.bw_table_selectable > tbody > tr': { 'cursor': 'pointer' },
    '.bw_table > tbody > tr.bw_table_row_selected > *': { 'background-color': 'rgba(0, 102, 102, 0.1)' },
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
      'white-space': 'nowrap', 'vertical-align': 'baseline',
      'padding': '0.35rem 0.65rem', 'border-radius': '0.25rem'
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
      'padding': '0.625rem 1rem',
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
      'margin-left': '-1px', 'line-height': '1.25', 'text-decoration': 'none',
      'border': '1px solid transparent', 'cursor': 'pointer',
      'font-family': 'inherit', 'font-size': 'inherit', 'background': 'none'
    },
    '.bw_page_item:first-child .bw_page_link': { 'margin-left': '0' },
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
    '.bw_code_pre': { 'margin': '0', 'border': 'none', 'overflow-x': 'auto', 'max-width': '100%' },
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
      'padding': '0.875rem 1.25rem',
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
    '.bw_accordion_body': { 'padding': '1rem 1.25rem' },
    '.bw_accordion_collapse': { 'max-height': '0', 'overflow': 'hidden', 'transition': 'max-height 0.3s ease' },
    '.bw_accordion_collapse.bw_collapse_show': { 'max-height': 'none' }
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
      'position': 'relative', 'width': 'calc(100% - 1rem)', 'max-width': '500px', 'margin': '1.75rem auto',
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
      'pointer-events': 'auto', 'width': '350px', 'max-width': 'calc(100vw - 2rem)', 'background-clip': 'padding-box',
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
    '.bw_stat_card': {
      'padding': '1.25rem',
      'border-left': '4px solid transparent',
      'border-radius': '0.375rem',
      'background-color': 'inherit',
      'transition': 'transform 0.15s ease'
    },
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
      'font-size': '0.875rem', 'white-space': 'nowrap', 'max-width': 'min(300px, calc(100vw - 1rem))', 'pointer-events': 'none',
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
      'min-width': '200px', 'max-width': 'min(320px, calc(100vw - 2rem))',
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
      '.bw_feature_grid, .bw_feature-grid': { 'grid-template-columns': '1fr' },
      '.bw_modal_dialog': { 'margin': '0.5rem auto' },
      '.bw_modal_lg': { 'max-width': 'calc(100% - 1rem)' },
      '.bw_modal_xl': { 'max-width': 'calc(100% - 1rem)' },
      '.bw_navbar': { 'padding': '0.5rem 0.75rem' },
      '.bw_navbar_brand': { 'margin-right': '0.5rem', 'font-size': '1rem' },
      '.bw_navbar_nav': { 'flex-wrap': 'wrap' },
      '.bw_tooltip': { 'white-space': 'normal' },
      '.bw_table': { 'display': 'block', 'overflow-x': 'auto', '-webkit-overflow-scrolling': 'touch' },
      '.bw_col, .bw_col_1, .bw_col_2, .bw_col_3, .bw_col_4, .bw_col_5, .bw_col_6, .bw_col_7, .bw_col_8, .bw_col_9, .bw_col_10, .bw_col_11, .bw_col_12': { 'flex': '0 0 100%', 'max-width': '100%' },
      '.bw_container': { 'padding-right': '0.5rem', 'padding-left': '0.5rem' },
      '.bw_container_fluid': { 'padding-right': '0.5rem', 'padding-left': '0.5rem' }
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

  // Typography — bw_ prefixed utilities via loops
  var _imp = function(p, v) { var o = {}; o[p] = v + ' !important'; return o; };
  [['fs',{'xs':'0.75rem','sm':'0.875rem','base':'1rem','lg':'1.125rem','xl':'1.25rem','2xl':'1.5rem'},'font-size'],
   ['fw',{light:'300',normal:'400',medium:'500',semibold:'600',bold:'700'},'font-weight'],
   ['lh',{tight:'1.25',normal:'1.5',relaxed:'1.75'},'line-height']
  ].forEach(function(d) { for (var dk in d[1]) rules['.bw_'+d[0]+'_'+dk] = _imp(d[2], d[1][dk]); });

  // Flex utilities
  rules['.bw_flex'] = { 'display': 'flex' };
  rules['.bw_flex_column'] = { 'flex-direction': 'column' };
  rules['.bw_flex_wrap'] = { 'flex-wrap': 'wrap' };
  rules['.bw_flex_center'] = { 'display': 'flex', 'align-items': 'center', 'justify-content': 'center' };
  for (var gk in spacingValues) rules['.bw_gap_' + gk] = { 'gap': spacingValues[gk] + ' !important' };

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
function getStructuralStyles() {
  return getStructuralCSS();
}

/**
 * Get CSS reset rules only (box-sizing, html/body font, reduced-motion).
 * Separate from themed/structural rules for independent injection.
 * @returns {Object} CSS rules object for the reset layer
 */
function getResetStyles() {
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
// generated from generateUtilityRules() and 'root' from the theme token.
// =========================================================================

Object.assign({}, structuralRules, {
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

/**
 * Prefix every selector in a rules object with a scope selector.
 * Handles @media/@keyframes blocks and comma-separated selectors.
 * @param {Object} rules - CSS rules object
 * @param {string} prefix - Scope prefix (e.g. '#my-dashboard', '.bw_theme_alt')
 * @param {boolean} [compound=false] - If true, use compound selector (no space)
 *   for the first segment: `#scope.bw_theme_alt .sel` vs `#scope .sel`
 * @returns {Object} New rules object with scoped selectors
 */
function scopeRulesUnder(rules, prefix, compound) {
  var scoped = {};
  for (var sel in rules) {
    if (!rules.hasOwnProperty(sel)) continue;
    if (sel.charAt(0) === '@') {
      // @media / @keyframes — recurse into the block
      var innerBlock = rules[sel];
      var scopedInner = {};
      for (var innerSel in innerBlock) {
        if (!innerBlock.hasOwnProperty(innerSel)) continue;
        scopedInner[_prefixSelector(innerSel, prefix)] = innerBlock[innerSel];
      }
      scoped[sel] = scopedInner;
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

/**
 * Bitwrench v2 File I/O Functions
 *
 * Save/load files in both Node.js and browser environments.
 * Node uses fs module, browser uses Blob/XHR/FileReader.
 *
 * Called via bindFileOps(bw) which attaches all functions to the bw namespace.
 * This preserves the same public API (bw.saveClientFile, bw.loadClientFile, etc.)
 * while keeping the implementation in a separate module.
 *
 * @module bitwrench-file-ops
 * @license BSD-2-Clause
 * @author M A Chatterjee <deftio [at] deftio [dot] com>
 */

/**
 * Attach all file I/O functions to the bitwrench namespace.
 *
 * @param {Object} bw - Bitwrench namespace object
 */
function bindFileOps(bw) {

  /**
   * Save data to a file. Works in both Node.js (fs.writeFile) and browser (download link).
   *
   * @param {string} fname - Filename to save as
   * @param {*} data - Data to save (string or buffer)
   * @category File I/O
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
      var blob = new Blob([data], { type: "application/octet-stream" });
      var url = window.URL.createObjectURL(blob);
      var a = bw.createDOM({
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
   * Load a JSON file by path (Node.js) or URL (browser).
   *
   * @param {string} fname - File path (Node) or URL (browser)
   * @param {Function} callback - Called with (parsedData, error)
   * @returns {string} "BW_OK"
   * @category File I/O
   */
  bw.loadClientJSON = function(fname, callback) {
    return bw.loadClientFile(fname, callback, { parser: 'JSON' });
  };

  /**
   * Prompt user to pick a local file via file dialog (browser only).
   *
   * @param {Function} callback - Called with (data, filename, error)
   * @param {Object} [options] - Options
   * @param {string} [options.accept] - File type filter (e.g. ".json,.txt")
   * @param {string} [options.parser="raw"] - "raw" for string, "JSON" to auto-parse
   * @category File I/O
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
   */
  bw.loadLocalJSON = function(callback) {
    bw.loadLocalFile(callback, { parser: 'JSON', accept: '.json' });
  };
}

/**
 * Bitwrench v2 Utility Functions
 *
 * Pure utility functions with no DOM dependencies. These work identically
 * in Node.js and browsers: type detection, math, array ops, text generation,
 * timing helpers.
 *
 * Extracted from bitwrench.js to keep the core focused on DOM/TACO/state.
 *
 * @module bitwrench-utils
 * @license BSD-2-Clause
 * @author M A Chatterjee <deftio [at] deftio [dot] com>
 */

/**
 * Enhanced type detection that distinguishes arrays, dates, regexps, and more.
 *
 * Goes beyond `typeof` by using `Object.prototype.toString` to identify
 * specific object types. Returns lowercase strings for primitives and arrays,
 * PascalCase for built-in classes (Date, RegExp, Map, Set, etc.).
 *
 * @param {*} x - Value to examine
 * @param {boolean} [baseTypeOnly=false] - If true, return only the base type ("object" for all objects)
 * @returns {string} Type name
 * @category Core
 * @example
 * typeOf("hello")         // => "string"
 * typeOf(42)              // => "number"
 * typeOf([1, 2, 3])       // => "array"
 * typeOf(new Date())      // => "Date"
 * typeOf({a: 1})          // => "Object"
 * typeOf([1,2], true)     // => "object"
 */
function typeOf(x, baseTypeOnly) {
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
}

/**
 * Map/scale a value from one range to another (linear interpolation).
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
 * @example
 * mapScale(50, 0, 100, 0, 1)  // => 0.5
 * mapScale(75, 0, 100, 0, 255) // => 191.25
 */
function mapScale(x, in0, in1, out0, out1, options = {}) {
  const { clip: doClip = false, expScale = 1 } = options;

  // Normalize to 0-1
  let normalized = (x - in0) / (in1 - in0);

  // Apply exponential scaling
  if (expScale !== 1) {
    normalized = Math.pow(normalized, expScale);
  }

  // Map to output range
  let result = normalized * (out1 - out0) + out0;

  // Clip if requested
  if (doClip) {
    const min = Math.min(out0, out1);
    const max = Math.max(out0, out1);
    result = Math.max(min, Math.min(max, result));
  }

  return result;
}

/**
 * Clamp a value between min and max bounds.
 *
 * @param {number} value - Value to clamp
 * @param {number} min - Minimum allowed value
 * @param {number} max - Maximum allowed value
 * @returns {number} Clamped value
 * @category Math
 * @example
 * clip(150, 0, 100)  // => 100
 * clip(-5, 0, 100)   // => 0
 */
function clip(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

/**
 * Use a dictionary as a switch statement, with support for function values.
 *
 * @param {*} x - Key to look up
 * @param {Object} choices - Dictionary of choices (values can be functions)
 * @param {*} def - Default value if key not found
 * @returns {*} Value or function result
 * @category Array Utilities
 * @example
 * var colors = { red: 1, blue: 2, aqua: function(z) { return z + 'marine'; } };
 * choice('red', colors, '0')   // => 1
 * choice('aqua', colors)       // => 'aquamarine'
 */
function choice(x, choices, def) {
  const z = (x in choices) ? choices[x] : def;
  return typeOf(z) === "function" ? z(x) : z;
}

/**
 * Return unique elements of an array (preserves first occurrence order).
 *
 * @param {Array} x - Input array
 * @returns {Array} Array with unique elements
 * @category Array Utilities
 * @example
 * arrayUniq([1, 2, 2, 3, 1])  // => [1, 2, 3]
 */
function arrayUniq(x) {
  if (typeOf(x) !== "array") return [];
  return x.filter((v, i, arr) => arr.indexOf(v) === i);
}

/**
 * Return the intersection of two arrays (elements present in both).
 *
 * @param {Array} a - First array
 * @param {Array} b - Second array
 * @returns {Array} Unique elements found in both a and b
 * @category Array Utilities
 * @example
 * arrayBinA([1, 2, 3], [2, 3, 4])  // => [2, 3]
 */
function arrayBinA(a, b) {
  if (typeOf(a) !== "array" || typeOf(b) !== "array") return [];
  return arrayUniq(a.filter(n => b.indexOf(n) !== -1));
}

/**
 * Return elements of b that are not present in a (set difference).
 *
 * @param {Array} a - First array (the "exclude" set)
 * @param {Array} b - Second array (source of results)
 * @returns {Array} Unique elements in b but not in a
 * @category Array Utilities
 * @example
 * arrayBNotInA([1, 2, 3], [2, 3, 4, 5])  // => [4, 5]
 */
function arrayBNotInA(a, b) {
  if (typeOf(a) !== "array" || typeOf(b) !== "array") return [];
  return arrayUniq(b.filter(n => a.indexOf(n) < 0));
}

/**
 * Interpolate between an array of colors based on a value in a range.
 *
 * @param {number} x - Value to interpolate
 * @param {number} in0 - Input range start
 * @param {number} in1 - Input range end
 * @param {Array} colors - Array of CSS color strings to interpolate between
 * @param {number} [stretch] - Exponential scaling factor (1 = linear)
 * @param {Function} colorParseFn - Color parse function (injected to avoid circular dep)
 * @returns {Array} Interpolated color as [r, g, b, a, "rgb"]
 * @category Color
 * @example
 * colorInterp(50, 0, 100, ['#ff0000', '#00ff00'], undefined, bw.colorParse)
 */
function colorInterp(x, in0, in1, colors, stretch, colorParseFn) {
  let c = Array.isArray(colors) ? colors : ["#000", "#fff"];
  c = c.length === 0 ? ["#000", "#fff"] : c;
  if (c.length === 1) return c[0];

  // Convert all colors to RGB format
  c = c.map(col => colorParseFn(col));

  const a = mapScale(x, in0, in1, 0, c.length - 1, { clip: true, expScale: stretch });
  const i = clip(Math.floor(a), 0, c.length - 2);
  const r = a - i;

  const interp = (idx) => mapScale(r, 0, 1, c[i][idx], c[i + 1][idx], { clip: true });
  return [interp(0), interp(1), interp(2), interp(3), "rgb"];
}

/**
 * Generate Lorem Ipsum placeholder text.
 *
 * @param {number} [numChars] - Number of characters (random 25-150 if not provided)
 * @param {number} [startSpot] - Starting index in Lorem text (random if undefined)
 * @param {boolean} [startWithCapitalLetter=true] - Start with a capital letter
 * @returns {string} Lorem ipsum text
 * @category Text Generation
 * @example
 * loremIpsum(50)
 * // => "Lorem ipsum dolor sit amet, consectetur adipiscin"
 */
function loremIpsum(numChars, startSpot, startWithCapitalLetter = true) {
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
}

/**
 * Create a multidimensional array filled with a value or function result.
 *
 * @param {*} value - Value or function to fill array with
 * @param {number|Array} dims - Dimensions (number for 1D, array for multi-D)
 * @returns {Array} Multidimensional array
 * @category Array Utilities
 * @example
 * multiArray(0, [4, 5])            // 4x5 array of 0s
 * multiArray(Math.random, [3, 4])  // 3x4 array of random numbers
 */
function multiArray(value, dims) {
  const v = () => typeOf(value) === "function" ? value() : value;
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
}

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
 * ['item10', 'item2', 'item1'].sort(naturalCompare)
 * // => ['item1', 'item2', 'item10']
 */
function naturalCompare(as, bs) {
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
}

/**
 * Run `setInterval` with a maximum number of repetitions.
 *
 * @param {Function} callback - Function to call (receives iteration index)
 * @param {number} delay - Delay between calls in ms
 * @param {number} repetitions - Maximum number of times to call
 * @returns {number} Interval ID (can be passed to clearInterval)
 * @category Timing
 * @example
 * setIntervalX(function(i) {
 *   console.log('Iteration', i);
 * }, 1000, 5); // Runs 5 times, 1 second apart
 */
function setIntervalX(callback, delay, repetitions) {
  let count = 0;
  const intervalID = setInterval(function() {
    callback(count);

    if (++count >= repetitions) {
      clearInterval(intervalID);
    }
  }, delay);

  return intervalID;
}

/**
 * Repeat a test function until it returns truthy, or give up after max attempts.
 *
 * @param {Function} testFn - Test function that returns truthy when done
 * @param {Function} successFn - Called with test result when test passes
 * @param {Function} [failFn] - Called on each failed test attempt
 * @param {number} [delay=250] - Delay between attempts in ms
 * @param {number} [maxReps=10] - Maximum number of attempts
 * @param {Function} [lastFn] - Called when done with (success, count)
 * @returns {string|number} "err" if invalid params, otherwise interval ID
 * @category Timing
 */
function repeatUntil(testFn, successFn, failFn, delay = 250, maxReps = 10, lastFn) {
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
 * @module bitwrench-bccl
 * @license BSD-2-Clause
 * @author M A Chatterjee <deftio [at] deftio [dot] com>
 */

// =========================================================================
// Variant → Utility Class Mapping
//
// Components compose these shared utility classes instead of owning
// their own variant selectors. The CSS is generated once by
// generatePaletteUtilities() + generateInteractionRules().
// =========================================================================

/**
 * Maps component type to a function that returns utility classes for a variant.
 * Each function takes a variant name (e.g. 'primary') and returns a class string.
 * @type {Object.<string, function(string): string>}
 */
/**
 * Convert a variant name to a single palette class.
 * All BCCL components use this: variant='primary' → class includes 'bw_primary'.
 * The CSS palette class (.bw-primary) sets bg/color/border; component-specific
 * overrides in generatePaletteClasses() adjust per component type.
 *
 * @param {string} v - Variant name (e.g. 'primary', 'danger', 'outline_primary')
 * @returns {string} CSS class string
 */
function variantClass(v) {
  if (!v) return '';
  // Handle outline variants: 'outline_primary' or 'outline-primary'
  if (v.indexOf('outline') === 0) {
    var base = v.replace(/^outline[_-]/, '');
    return 'bw_btn_outline bw_' + base;
  }
  return 'bw_' + v;
}

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
    sm: 'bw_shadow_sm',
    md: 'bw_shadow',
    lg: 'bw_shadow_lg'
  };

  const cardClasses = [
    'bw_card',
    variantClass(variant),
    shadow ? (shadowClasses[shadow] || '') : '',
    !bordered ? 'bw_border_0' : '',
    hoverable ? 'bw_card_hoverable' : '',
    className
  ].filter(Boolean).join(' ').trim();

  const cardContent = [
    header && {
      t: 'div',
      a: { class: `bw_card_header ${headerClass}`.trim() },
      c: header
    },
    image && (imagePosition === 'top' || imagePosition === 'left') && {
      t: 'img',
      a: {
        class: `bw_card_img_${imagePosition}`,
        src: image.src,
        alt: image.alt || ''
      }
    },
    {
      t: 'div',
      a: { class: `bw_card_body ${bodyClass}`.trim() },
      c: [
        title && { t: 'h5', a: { class: 'bw_card_title' }, c: title },
        subtitle && { t: 'h6', a: { class: 'bw_card_subtitle bw_mb_2 bw_text_muted' }, c: subtitle },
        content && (Array.isArray(content) ? content : [content])
      ].flat().filter(Boolean)
    },
    image && (imagePosition === 'bottom' || imagePosition === 'right') && {
      t: 'img',
      a: {
        class: `bw_card_img_${imagePosition}`,
        src: image.src,
        alt: image.alt || ''
      }
    },
    footer && {
      t: 'div',
      a: { class: `bw_card_footer ${footerClass}`.trim() },
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
        a: { class: 'bw_row bw_g_0' },
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
 * // String shorthand:
 * const ok = makeButton("OK");
 */
function makeButton(props = {}) {
  if (typeof props === 'string') props = { text: props };
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
        'bw_btn',
        variantClass(variant),
        size && `bw_btn_${size}`,
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
    a: { class: `bw_container${fluid ? '-fluid' : ''} ${className}`.trim() },
    c: children
  };
}

/**
 * Create a flexbox row for the grid system
 *
 * @param {Object} [props] - Row configuration
 * @param {Array|Object|string} [props.children] - Child columns
 * @param {string} [props.className] - Additional CSS classes
 * @param {number} [props.gap] - Gap size (1-5) applied via bw_g_{gap} class
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
      class: `bw_row ${gap ? `bw_g_${gap}` : ''} ${className}`.trim()
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
        classes.push(`bw_col_${value}`);
      } else {
        classes.push(`bw_col_${breakpoint}_${value}`);
      }
    });
  } else if (size) {
    classes.push(`bw_col_${size}`);
  } else {
    classes.push('bw_col');
  }

  if (offset) classes.push(`bw_offset_${offset}`);
  if (push) classes.push(`bw_push_${push}`);
  if (pull) classes.push(`bw_pull_${pull}`);

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
      class: `bw_nav ${pills ? 'bw_nav_pills' : 'bw_nav_tabs'} ${vertical ? 'bw_nav_vertical' : ''} ${className}`.trim()
    },
    c: items.map(item => ({
      t: 'li',
      a: { class: 'bw_nav_item' },
      c: {
        t: 'a',
        a: {
          href: item.href || '#',
          class: `bw_nav_link ${item.active ? 'active' : ''} ${item.disabled ? 'disabled' : ''}`.trim()
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
      class: `bw_navbar ${dark ? 'bw_navbar_dark' : 'bw_navbar_light'} ${className}`.trim()
    },
    c: {
      t: 'div',
      a: { class: 'bw_container' },
      c: [
        brand && {
          t: 'a',
          a: { href: brandHref, class: 'bw_navbar_brand' },
          c: brand
        },
        items.length > 0 && {
          t: 'div',
          a: { class: 'bw_navbar_nav' },
          c: items.map(item => ({
            t: 'a',
            a: {
              href: item.href || '#',
              class: `bw_nav_link ${item.active ? 'active' : ''}`
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
    a: { class: 'bw_tabs' },
    c: [
      {
        t: 'ul',
        a: { class: 'bw_nav bw_nav_tabs', role: 'tablist' },
        c: tabs.map((tab, index) => ({
          t: 'li',
          a: { class: 'bw_nav_item', role: 'presentation' },
          c: {
            t: 'button',
            a: {
              class: `bw_nav_link ${index === actualActiveIndex ? 'active' : ''}`,
              type: 'button',
              role: 'tab',
              tabindex: index === actualActiveIndex ? '0' : '-1',
              'aria-selected': index === actualActiveIndex ? 'true' : 'false',
              'data-tab-index': index,
              onclick: (e) => {
                const tabsContainer = e.target.closest('.bw_tabs');
                const allTabs = tabsContainer.querySelectorAll('.bw_nav_link');
                const allPanes = tabsContainer.querySelectorAll('.bw_tab_pane');

                allTabs.forEach(t => {
                  t.classList.remove('active');
                  t.setAttribute('aria-selected', 'false');
                  t.setAttribute('tabindex', '-1');
                });
                allPanes.forEach(p => p.classList.remove('active'));

                e.target.classList.add('active');
                e.target.setAttribute('aria-selected', 'true');
                e.target.setAttribute('tabindex', '0');
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
        a: { class: 'bw_tab_content' },
        c: tabs.map((tab, index) => ({
          t: 'div',
          a: {
            class: `bw_tab_pane ${index === actualActiveIndex ? 'active' : ''}`,
            role: 'tabpanel'
          },
          c: tab.content
        }))
      }
    ],
    o: {
      type: 'tabs',
      state: { activeIndex: actualActiveIndex },
      mounted: function(el) {
        var tablist = el.querySelector('[role="tablist"]');
        if (!tablist) return;
        tablist.addEventListener('keydown', function(e) {
          var tabButtons = tablist.querySelectorAll('[role="tab"]');
          var currentIndex = -1;
          for (var i = 0; i < tabButtons.length; i++) {
            if (tabButtons[i] === e.target) { currentIndex = i; break; }
          }
          if (currentIndex === -1) return;

          var newIndex = -1;
          if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
            e.preventDefault();
            newIndex = currentIndex > 0 ? currentIndex - 1 : tabButtons.length - 1;
          } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
            e.preventDefault();
            newIndex = currentIndex < tabButtons.length - 1 ? currentIndex + 1 : 0;
          } else if (e.key === 'Home') {
            e.preventDefault();
            newIndex = 0;
          } else if (e.key === 'End') {
            e.preventDefault();
            newIndex = tabButtons.length - 1;
          }

          if (newIndex >= 0) {
            tabButtons[newIndex].focus();
            tabButtons[newIndex].click();
          }
        });
      }
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
 * // String shorthand:
 * const msg = makeAlert("Something happened");
 */
function makeAlert(props = {}) {
  if (typeof props === 'string') props = { content: props };
  const {
    content,
    variant = 'info',
    dismissible = false,
    className = ''
  } = props;

  return {
    t: 'div',
    a: {
      class: `bw_alert ${variantClass(variant)} ${dismissible ? 'bw_alert_dismissible' : ''} ${className}`.trim(),
      role: 'alert'
    },
    c: [
      content,
      dismissible && {
        t: 'button',
        a: {
          type: 'button',
          class: 'bw_close',
          'aria-label': 'Close',
          onclick: function(e) {
            var alert = e.target.closest('.bw_alert');
            if (alert) { alert.remove(); }
          }
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
 * @param {string} [props.size] - Size variant: 'sm' or 'lg' (default is medium)
 * @param {boolean} [props.pill=false] - Use pill (rounded) shape
 * @param {string} [props.className] - Additional CSS classes
 * @returns {Object} TACO object representing a badge span
 * @category Component Builders
 * @example
 * const badge = makeBadge({ text: "New", variant: "danger", pill: true });
 * const small = makeBadge({ text: "3", variant: "info", size: "sm" });
 * // String shorthand:
 * const tag = makeBadge("New");
 */
function makeBadge(props = {}) {
  if (typeof props === 'string') props = { text: props };
  const {
    text,
    variant = 'primary',
    size,
    pill = false,
    className = ''
  } = props;

  const sizeClass = size === 'sm' ? ' bw_badge_sm' : size === 'lg' ? ' bw_badge_lg' : '';

  return {
    t: 'span',
    a: {
      class: `bw_badge ${variantClass(variant)}${sizeClass} ${pill ? 'bw_badge_pill' : ''} ${className}`.trim()
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
      class: 'bw_progress',
      style: height ? { height: `${height}px` } : undefined
    },
    c: {
      t: 'div',
      a: {
        class: [
          'bw_progress_bar',
          variantClass(variant),
          striped && 'bw_progress_bar_striped',
          animated && 'bw_progress_bar_animated'
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
    a: { class: `bw_list_group ${flush ? 'bw_list_group_flush' : ''}`.trim() },
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
              'bw_list_group_item',
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
            'bw_list_group_item',
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
      a: { class: 'bw_breadcrumb' },
      c: items.map((item, index) => ({
        t: 'li',
        a: {
          class: `bw_breadcrumb_item ${item.active ? 'active' : ''}`,
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
 * Create a form group with label, input, optional help text and validation feedback
 *
 * @param {Object} [props] - Form group configuration
 * @param {string} [props.label] - Label text
 * @param {Object} [props.input] - Input TACO object (from makeInput, makeSelect, etc.)
 * @param {string} [props.help] - Help text displayed below the input
 * @param {string} [props.id] - Input ID (links label to input via for/id)
 * @param {string} [props.validation] - Validation state ("valid" or "invalid")
 * @param {string} [props.feedback] - Validation feedback text shown below input
 * @param {boolean} [props.required=false] - Show required indicator (*) on label
 * @returns {Object} TACO object representing a form group
 * @category Component Builders
 * @example
 * const group = makeFormGroup({
 *   label: "Email",
 *   id: "email",
 *   input: makeInput({ type: "email", id: "email", placeholder: "you@example.com" }),
 *   validation: "invalid",
 *   feedback: "Please enter a valid email address."
 * });
 */
function makeFormGroup(props = {}) {
  var { label, input, help, id, validation, feedback, required } = props;

  // Shallow-clone input TACO to add validation class without mutating original
  var styledInput = input;
  if (validation && input && input.a) {
    styledInput = { t: input.t, a: Object.assign({}, input.a), c: input.c, o: input.o };
    var validClass = validation === 'valid' ? 'bw_is_valid' : validation === 'invalid' ? 'bw_is_invalid' : '';
    if (validClass) {
      styledInput.a.class = ((styledInput.a.class || '') + ' ' + validClass).trim();
    }
  }

  return {
    t: 'div',
    a: { class: 'bw_form_group' },
    c: [
      label && {
        t: 'label',
        a: { for: id, class: 'bw_form_label' },
        c: required ? [label, { t: 'span', a: { class: 'bw_text_danger bw_ms_1' }, c: '*' }] : label
      },
      styledInput,
      feedback && validation && {
        t: 'div',
        a: { class: validation === 'valid' ? 'bw_valid_feedback' : 'bw_invalid_feedback' },
        c: feedback
      },
      help && {
        t: 'small',
        a: { class: 'bw_form_text bw_text_muted' },
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
      class: `bw_form_control ${className}`.trim(),
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
      class: `bw_form_control ${className}`.trim(),
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
      class: `bw_form_control ${className}`.trim(),
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
    value,
    className = '',
    ...eventHandlers
  } = props;

  return {
    t: 'div',
    a: { class: `bw_form_check ${className}`.trim() },
    c: [
      {
        t: 'input',
        a: {
          type: 'checkbox',
          class: 'bw_form_check_input',
          checked,
          id,
          name,
          disabled,
          value,
          ...eventHandlers
        }
      },
      label && {
        t: 'label',
        a: { class: 'bw_form_check_label', for: id },
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
      class: `bw_${direction === 'vertical' ? 'vstack' : 'hstack'} bw_gap_${gap} ${className}`.trim()
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
      class: `bw_spinner_${type} bw_spinner_${type}-${size} ${variantClass(variant)}`,
      role: 'status'
    },
    c: {
      t: 'span',
      a: { class: 'bw_visually_hidden' },
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
    sm: 'bw_py_3',
    md: 'bw_py_4',
    lg: 'bw_py_5',
    xl: 'bw_py_6'
  };

  return {
    t: 'section',
    a: {
      class: `bw_hero ${variantClass(variant)} ${sizeClasses[size] || sizeClasses.lg} ${centered ? 'bw_text_center' : ''} ${className}`.trim(),
      style: backgroundImage ? `background-image: url('${backgroundImage}'); background-size: cover; background-position: center;` : undefined
    },
    c: [
      overlay && {
        t: 'div',
        a: { class: 'bw_hero_overlay' }
      },
      {
        t: 'div',
        a: { class: 'bw_container' },
        c: {
          t: 'div',
          a: { class: 'bw_hero_content' },
          c: [
            title && {
              t: 'h1',
              a: { class: 'bw_hero_title bw_display_4 bw_mb_3' },
              c: title
            },
            subtitle && {
              t: 'p',
              a: { class: 'bw_hero_subtitle bw_lead bw_mb_4' },
              c: subtitle
            },
            content,
            actions && {
              t: 'div',
              a: { class: 'bw_hero_actions bw_mt_4' },
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

  const colClass = `bw_col_md_${12/columns}`;

  return {
    t: 'div',
    a: { class: `bw_feature_grid ${className}`.trim() },
    c: {
      t: 'div',
      a: { class: 'bw_row bw_g_4' },
      c: features.map(feature => ({
        t: 'div',
        a: { class: colClass },
        c: {
          t: 'div',
          a: { class: `bw_feature ${centered ? 'bw_text_center' : ''}` },
          c: [
            feature.icon && {
              t: 'div',
              a: {
                class: 'bw_feature_icon bw_mb_3 bw_text_primary',
                style: `font-size: ${iconSize};`
              },
              c: feature.icon
            },
            feature.title && {
              t: 'h3',
              a: { class: 'bw_feature_title bw_h5 bw_mb_2' },
              c: feature.title
            },
            feature.description && {
              t: 'p',
              a: { class: 'bw_feature_description bw_text_muted' },
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
    a: { class: `bw_cta bw_bg_${variant} bw_py_5 ${className}`.trim() },
    c: {
      t: 'div',
      a: { class: 'bw_container' },
      c: {
        t: 'div',
        a: { class: `bw_cta_content ${centered ? 'bw_text_center' : ''}` },
        c: [
          title && { t: 'h2', a: { class: 'bw_cta_title bw_mb_3' }, c: title },
          description && { t: 'p', a: { class: 'bw_cta_description bw_lead bw_mb_4' }, c: description },
          actions && {
            t: 'div',
            a: { class: 'bw_cta_actions' },
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
    sm: 'bw_py_3',
    md: 'bw_py_4',
    lg: 'bw_py_5',
    xl: 'bw_py_6'
  };

  return {
    t: 'section',
    a: {
      class: `bw_section ${spacingClasses[spacing] || spacingClasses.md} ${variant !== 'default' ? `bw_bg_${variant}` : ''} ${className}`.trim()
    },
    c: {
      t: 'div',
      a: { class: 'bw_container' },
      c: [
        (title || subtitle) && {
          t: 'div',
          a: { class: 'bw_section_header bw_text_center bw_mb_5' },
          c: [
            title && { t: 'h2', a: { class: 'bw_section_title' }, c: title },
            subtitle && { t: 'p', a: { class: 'bw_section_subtitle bw_text_muted' }, c: subtitle }
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

// Handle classes (CardHandle, TableHandle, NavbarHandle, TabsHandle)
// removed in v2.0.15 — superseded by ComponentHandle.
// See dev/dead-code-elimination-v2.0.15.md for recovery.

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
  `demo-${Math.random().toString(36).substr(2, 9)}`;

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
              class: 'bw_copy_btn bw_code_copy_btn',
              onclick: function(e) {
                navigator.clipboard.writeText(code).then(function() {
                  var btn = e.target;
                  var originalText = btn.textContent;
                  btn.textContent = 'Copied!';
                  btn.classList.add('bw_code_copy_btn_copied');
                  setTimeout(function() {
                    btn.textContent = originalText;
                    btn.classList.remove('bw_code_copy_btn_copied');
                  }, 2000);
                });
              }
            },
            c: 'Copy'
          },
          (typeof globalThis !== 'undefined' && typeof globalThis.bw !== 'undefined' && typeof globalThis.bw.codeEditor === 'function')
            ? globalThis.bw.codeEditor({ code: code, lang: language === 'javascript' ? 'js' : language, readOnly: true, height: 'auto' })
            : {
                t: 'pre',
                a: { class: 'bw_code_pre' },
                c: {
                  t: 'code',
                  a: { class: `bw_code_block language-${language}` },
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
      a: { class: 'bw_text_muted bw_mb_3' },
      c: description
    },
    makeTabs({ tabs})
  ].filter(Boolean);

  return {
    t: 'div',
    a: { class: 'bw_code_demo' },
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
// =========================================================================
// Phase 1: Quick Wins
// =========================================================================

/**
 * Create a pagination navigation component
 *
 * @param {Object} [props] - Pagination configuration
 * @param {number} [props.pages=1] - Total number of pages
 * @param {number} [props.currentPage=1] - Currently active page (1-based)
 * @param {Function} [props.onPageChange] - Callback when page changes, receives page number
 * @param {string} [props.size] - Size variant ("sm" or "lg")
 * @param {string} [props.className] - Additional CSS classes
 * @returns {Object} TACO object representing a pagination nav
 * @category Component Builders
 * @example
 * const pager = makePagination({
 *   pages: 10,
 *   currentPage: 3,
 *   onPageChange: (page) => loadPage(page)
 * });
 */
function makePagination(props = {}) {
  const {
    pages = 1,
    currentPage = 1,
    onPageChange,
    size,
    className = ''
  } = props;

  function handleClick(page) {
    return function(e) {
      e.preventDefault();
      if (page < 1 || page > pages || page === currentPage) return;
      if (onPageChange) onPageChange(page);
    };
  }

  const items = [];

  // Previous arrow
  items.push({
    t: 'li',
    a: { class: `bw_page_item ${currentPage <= 1 ? 'bw_disabled' : ''}`.trim() },
    c: {
      t: 'button',
      a: { class: 'bw_page_link', type: 'button', onclick: handleClick(currentPage - 1), 'aria-label': 'Previous', disabled: currentPage <= 1 ? true : undefined },
      c: '\u2039'
    }
  });

  // Page numbers
  for (var i = 1; i <= pages; i++) {
    (function(pageNum) {
      items.push({
        t: 'li',
        a: { class: `bw_page_item ${pageNum === currentPage ? 'bw_active' : ''}`.trim() },
        c: {
          t: 'button',
          a: { class: 'bw_page_link', type: 'button', onclick: handleClick(pageNum), 'aria-current': pageNum === currentPage ? 'page' : undefined },
          c: '' + pageNum
        }
      });
    })(i);
  }

  // Next arrow
  items.push({
    t: 'li',
    a: { class: `bw_page_item ${currentPage >= pages ? 'bw_disabled' : ''}`.trim() },
    c: {
      t: 'button',
      a: { class: 'bw_page_link', type: 'button', onclick: handleClick(currentPage + 1), 'aria-label': 'Next', disabled: currentPage >= pages ? true : undefined },
      c: '\u203A'
    }
  });

  return {
    t: 'nav',
    a: { 'aria-label': 'Pagination' },
    c: {
      t: 'ul',
      a: {
        class: `bw_pagination ${size ? 'bw_pagination_' + size : ''} ${className}`.trim()
      },
      c: items
    }
  };
}

/**
 * Create a radio button input with label
 *
 * @param {Object} [props] - Radio configuration
 * @param {string} [props.label] - Radio label text
 * @param {string} [props.name] - Radio group name
 * @param {string} [props.value] - Radio value attribute
 * @param {boolean} [props.checked=false] - Whether the radio is selected
 * @param {string} [props.id] - Element ID (links label to radio)
 * @param {boolean} [props.disabled=false] - Whether the radio is disabled
 * @param {string} [props.className] - Additional CSS classes
 * @returns {Object} TACO object representing a radio form group
 * @category Component Builders
 * @example
 * const radio = makeRadio({
 *   label: "Option A",
 *   name: "choice",
 *   value: "a",
 *   checked: true
 * });
 */
function makeRadio(props = {}) {
  const {
    label,
    name,
    value,
    checked = false,
    id,
    disabled = false,
    className = '',
    ...eventHandlers
  } = props;

  return {
    t: 'div',
    a: { class: `bw_form_check ${className}`.trim() },
    c: [
      {
        t: 'input',
        a: {
          type: 'radio',
          class: 'bw_form_check_input',
          name,
          value,
          checked,
          id,
          disabled,
          ...eventHandlers
        }
      },
      label && {
        t: 'label',
        a: { class: 'bw_form_check_label', for: id },
        c: label
      }
    ].filter(Boolean)
  };
}

/**
 * Create a button group wrapper
 *
 * @param {Object} [props] - Button group configuration
 * @param {Array} [props.children] - Button TACO objects to group
 * @param {string} [props.size] - Size variant ("sm" or "lg")
 * @param {boolean} [props.vertical=false] - Stack buttons vertically
 * @param {string} [props.className] - Additional CSS classes
 * @returns {Object} TACO object representing a button group
 * @category Component Builders
 * @example
 * const group = makeButtonGroup({
 *   children: [
 *     makeButton({ text: "Left", variant: "primary" }),
 *     makeButton({ text: "Middle", variant: "primary" }),
 *     makeButton({ text: "Right", variant: "primary" })
 *   ]
 * });
 */
function makeButtonGroup(props = {}) {
  const {
    children,
    size,
    vertical = false,
    className = ''
  } = props;

  return {
    t: 'div',
    a: {
      class: `${vertical ? 'bw_btn_group_vertical' : 'bw_btn_group'} ${size ? 'bw_btn_group_' + size : ''} ${className}`.trim(),
      role: 'group'
    },
    c: children
  };
}

// =========================================================================
// Phase 2: Core Interactive
// =========================================================================

/**
 * Create an accordion component with collapsible items
 *
 * @param {Object} [props] - Accordion configuration
 * @param {Array<Object>} [props.items=[]] - Accordion items
 * @param {string} props.items[].title - Header text for the accordion item
 * @param {string|Object|Array} props.items[].content - Collapsible content
 * @param {boolean} [props.items[].open=false] - Whether the item is initially open
 * @param {boolean} [props.multiOpen=false] - Allow multiple items open simultaneously
 * @param {string} [props.className] - Additional CSS classes
 * @returns {Object} TACO object representing an accordion
 * @category Component Builders
 * @example
 * const accordion = makeAccordion({
 *   items: [
 *     { title: "Section 1", content: "Content 1", open: true },
 *     { title: "Section 2", content: "Content 2" }
 *   ]
 * });
 */
function makeAccordion(props = {}) {
  const {
    items = [],
    multiOpen = false,
    className = ''
  } = props;

  return {
    t: 'div',
    a: { class: `bw_accordion ${className}`.trim() },
    c: items.map(function(item, index) {
      return {
        t: 'div',
        a: { class: 'bw_accordion_item' },
        c: [
          {
            t: 'h2',
            a: { class: 'bw_accordion_header' },
            c: {
              t: 'button',
              a: {
                class: `bw_accordion_button ${item.open ? '' : 'bw_collapsed'}`.trim(),
                type: 'button',
                'aria-expanded': item.open ? 'true' : 'false',
                'data-accordion-index': index,
                onclick: function(e) {
                  var btn = e.target.closest('.bw_accordion_button');
                  var accordionEl = btn.closest('.bw_accordion');
                  var accordionItem = btn.closest('.bw_accordion_item');
                  var collapse = accordionItem.querySelector('.bw_accordion_collapse');
                  var isOpen = collapse.classList.contains('bw_collapse_show');

                  if (!multiOpen) {
                    // Animate-close all other open siblings
                    var allItems = accordionEl.querySelectorAll('.bw_accordion_item');
                    for (var j = 0; j < allItems.length; j++) {
                      if (allItems[j] === accordionItem) continue;
                      var sibCollapse = allItems[j].querySelector('.bw_accordion_collapse');
                      var sibBtn = allItems[j].querySelector('.bw_accordion_button');
                      if (sibCollapse.classList.contains('bw_collapse_show')) {
                        sibCollapse.style.maxHeight = sibCollapse.scrollHeight + 'px';
                        sibCollapse.offsetHeight; // force reflow
                        sibCollapse.style.maxHeight = '0px';
                        sibCollapse.classList.remove('bw_collapse_show');
                        sibBtn.classList.add('bw_collapsed');
                        sibBtn.setAttribute('aria-expanded', 'false');
                      }
                    }
                  }

                  if (isOpen) {
                    // Animate close
                    collapse.style.maxHeight = collapse.scrollHeight + 'px';
                    collapse.offsetHeight; // force reflow
                    collapse.style.maxHeight = '0px';
                    collapse.classList.remove('bw_collapse_show');
                    btn.classList.add('bw_collapsed');
                    btn.setAttribute('aria-expanded', 'false');
                  } else {
                    // Animate open
                    collapse.classList.add('bw_collapse_show');
                    collapse.style.maxHeight = '0px';
                    collapse.offsetHeight; // force reflow
                    collapse.style.maxHeight = collapse.scrollHeight + 'px';
                    btn.classList.remove('bw_collapsed');
                    btn.setAttribute('aria-expanded', 'true');
                    // After transition, allow dynamic content sizing
                    var onEnd = function(ev) {
                      if (ev.propertyName === 'max-height' && collapse.classList.contains('bw_collapse_show')) {
                        collapse.style.maxHeight = 'none';
                      }
                      collapse.removeEventListener('transitionend', onEnd);
                    };
                    collapse.addEventListener('transitionend', onEnd);
                  }
                }
              },
              c: item.title
            }
          },
          {
            t: 'div',
            a: { class: `bw_accordion_collapse ${item.open ? 'bw_collapse_show' : ''}`.trim() },
            c: {
              t: 'div',
              a: { class: 'bw_accordion_body' },
              c: item.content
            },
            o: item.open ? {
              mounted: function(el) {
                el.style.maxHeight = 'none';
              }
            } : undefined
          }
        ]
      };
    }),
    o: {
      type: 'accordion',
      state: { multiOpen: multiOpen }
    }
  };
}

// ModalHandle removed in v2.0.15 — superseded by ComponentHandle.
// See dev/dead-code-elimination-v2.0.15.md for recovery.

/**
 * Create a modal dialog overlay
 *
 * @param {Object} [props] - Modal configuration
 * @param {string} [props.title] - Modal title in header
 * @param {string|Object|Array} [props.content] - Modal body content
 * @param {string|Object|Array} [props.footer] - Modal footer content
 * @param {string} [props.size] - Modal size ("sm", "lg", "xl")
 * @param {boolean} [props.closeButton=true] - Show X close button in header
 * @param {Function} [props.onClose] - Callback when modal is closed
 * @param {string} [props.className] - Additional CSS classes
 * @returns {Object} TACO object representing a modal
 * @category Component Builders
 * @example
 * const modal = makeModal({
 *   title: "Confirm",
 *   content: "Are you sure?",
 *   footer: makeButton({ text: "OK", variant: "primary" })
 * });
 */
function makeModal(props = {}) {
  const {
    title,
    content,
    footer,
    size,
    closeButton = true,
    onClose,
    className = ''
  } = props;

  function closeModal(el) {
    var backdrop = el.closest('.bw_modal');
    if (backdrop) {
      backdrop.classList.remove('bw_modal_show');
      document.body.style.overflow = '';
    }
    if (onClose) onClose();
  }

  return {
    t: 'div',
    a: { class: `bw_modal ${className}`.trim() },
    c: {
      t: 'div',
      a: { class: `bw_modal_dialog ${size ? 'bw_modal_' + size : ''}`.trim() },
      c: {
        t: 'div',
        a: { class: 'bw_modal_content' },
        c: [
          (title || closeButton) && {
            t: 'div',
            a: { class: 'bw_modal_header' },
            c: [
              title && { t: 'h5', a: { class: 'bw_modal_title' }, c: title },
              closeButton && {
                t: 'button',
                a: {
                  type: 'button',
                  class: 'bw_close',
                  'aria-label': 'Close',
                  onclick: function(e) { closeModal(e.target); }
                },
                c: '\u00D7'
              }
            ].filter(Boolean)
          },
          content && {
            t: 'div',
            a: { class: 'bw_modal_body' },
            c: content
          },
          footer && {
            t: 'div',
            a: { class: 'bw_modal_footer' },
            c: footer
          }
        ].filter(Boolean)
      }
    },
    o: {
      type: 'modal',
      mounted: function(el) {
        // Click backdrop to close
        el.addEventListener('click', function(e) {
          if (e.target === el) closeModal(el);
        });
        // Escape key to close
        var escHandler = function(e) {
          if (e.key === 'Escape' && el.classList.contains('bw_modal_show')) {
            closeModal(el);
          }
        };
        document.addEventListener('keydown', escHandler);
        el._bw_escHandler = escHandler;
      },
      unmount: function(el) {
        if (el._bw_escHandler) {
          document.removeEventListener('keydown', el._bw_escHandler);
        }
        document.body.style.overflow = '';
      }
    }
  };
}

/**
 * Create a toast notification popup
 *
 * @param {Object} [props] - Toast configuration
 * @param {string} [props.title] - Toast title
 * @param {string|Object|Array} [props.content] - Toast body content
 * @param {string} [props.variant="info"] - Color variant ("primary", "success", "danger", "warning", "info")
 * @param {boolean} [props.autoDismiss=true] - Auto-dismiss after delay
 * @param {number} [props.delay=5000] - Auto-dismiss delay in ms
 * @param {string} [props.position="top-right"] - Container position
 * @param {string} [props.className] - Additional CSS classes
 * @returns {Object} TACO object representing a toast
 * @category Component Builders
 * @example
 * const toast = makeToast({
 *   title: "Success",
 *   content: "File saved!",
 *   variant: "success"
 * });
 */
function makeToast(props = {}) {
  const {
    title,
    content,
    variant = 'info',
    autoDismiss = true,
    delay = 5000,
    position = 'top-right',
    className = ''
  } = props;

  return {
    t: 'div',
    a: {
      class: `bw_toast ${variantClass(variant)} ${className}`.trim(),
      role: 'alert',
      'data-position': position
    },
    c: [
      (title) && {
        t: 'div',
        a: { class: 'bw_toast_header' },
        c: [
          { t: 'strong', c: title },
          {
            t: 'button',
            a: {
              type: 'button',
              class: 'bw_close',
              'aria-label': 'Close',
              onclick: function(e) {
                var toast = e.target.closest('.bw_toast');
                if (toast) {
                  toast.classList.add('bw_toast_hiding');
                  setTimeout(function() { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 300);
                }
              }
            },
            c: '\u00D7'
          }
        ]
      },
      content && {
        t: 'div',
        a: { class: 'bw_toast_body' },
        c: content
      }
    ].filter(Boolean),
    o: {
      type: 'toast',
      mounted: function(el) {
        // Trigger show animation
        requestAnimationFrame(function() {
          el.classList.add('bw_toast_show');
        });
        // Auto-dismiss
        if (autoDismiss) {
          setTimeout(function() {
            el.classList.add('bw_toast_hiding');
            setTimeout(function() { if (el.parentNode) el.parentNode.removeChild(el); }, 300);
          }, delay);
        }
      }
    }
  };
}

// =========================================================================
// Phase 3: Essential Modern
// =========================================================================

/**
 * Create a dropdown menu triggered by a button
 *
 * @param {Object} [props] - Dropdown configuration
 * @param {string|Object} [props.trigger] - Button text or TACO for the trigger
 * @param {Array<Object>} [props.items=[]] - Menu items
 * @param {string} [props.items[].text] - Item display text
 * @param {string} [props.items[].href] - Item link URL
 * @param {Function} [props.items[].onclick] - Item click handler
 * @param {boolean} [props.items[].divider] - Render as a divider line
 * @param {boolean} [props.items[].disabled] - Whether the item is disabled
 * @param {string} [props.align="start"] - Menu alignment ("start" or "end")
 * @param {string} [props.variant="primary"] - Trigger button variant
 * @param {string} [props.className] - Additional CSS classes
 * @returns {Object} TACO object representing a dropdown
 * @category Component Builders
 * @example
 * const dropdown = makeDropdown({
 *   trigger: "Actions",
 *   items: [
 *     { text: "Edit", onclick: () => edit() },
 *     { divider: true },
 *     { text: "Delete", onclick: () => del() }
 *   ]
 * });
 */
function makeDropdown(props = {}) {
  const {
    trigger,
    items = [],
    align = 'start',
    variant = 'primary',
    className = ''
  } = props;

  var triggerTaco;
  if (typeof trigger === 'string' || trigger === undefined) {
    triggerTaco = {
      t: 'button',
      a: {
        class: `bw_btn ${variantClass(variant)} bw_dropdown_toggle`,
        type: 'button',
        onclick: function(e) {
          var dropdown = e.target.closest('.bw_dropdown');
          var menu = dropdown.querySelector('.bw_dropdown_menu');
          menu.classList.toggle('bw_dropdown_show');
        }
      },
      c: trigger || 'Dropdown'
    };
  } else {
    triggerTaco = trigger;
  }

  return {
    t: 'div',
    a: { class: `bw_dropdown ${className}`.trim() },
    c: [
      triggerTaco,
      {
        t: 'div',
        a: { class: `bw_dropdown_menu ${align === 'end' ? 'bw_dropdown_menu_end' : ''}`.trim() },
        c: items.map(function(item) {
          if (item.divider) {
            return { t: 'hr', a: { class: 'bw_dropdown_divider' } };
          }
          return {
            t: 'a',
            a: {
              class: `bw_dropdown_item ${item.disabled ? 'disabled' : ''}`.trim(),
              href: item.href || '#',
              onclick: item.disabled ? undefined : function(e) {
                if (!item.href) e.preventDefault();
                var dropdown = e.target.closest('.bw_dropdown');
                var menu = dropdown.querySelector('.bw_dropdown_menu');
                menu.classList.remove('bw_dropdown_show');
                if (item.onclick) item.onclick(e);
              }
            },
            c: item.text
          };
        })
      }
    ],
    o: {
      type: 'dropdown',
      mounted: function(el) {
        // Click outside to close
        var outsideHandler = function(e) {
          if (!el.contains(e.target)) {
            var menu = el.querySelector('.bw_dropdown_menu');
            if (menu) menu.classList.remove('bw_dropdown_show');
          }
        };
        document.addEventListener('click', outsideHandler);
        el._bw_outsideHandler = outsideHandler;
      },
      unmount: function(el) {
        if (el._bw_outsideHandler) {
          document.removeEventListener('click', el._bw_outsideHandler);
        }
      }
    }
  };
}

/**
 * Create a toggle switch (styled checkbox)
 *
 * @param {Object} [props] - Switch configuration
 * @param {string} [props.label] - Switch label text
 * @param {boolean} [props.checked=false] - Whether the switch is on
 * @param {string} [props.id] - Element ID (links label to switch)
 * @param {string} [props.name] - Input name attribute
 * @param {boolean} [props.disabled=false] - Whether the switch is disabled
 * @param {string} [props.className] - Additional CSS classes
 * @returns {Object} TACO object representing a toggle switch
 * @category Component Builders
 * @example
 * const toggle = makeSwitch({
 *   label: "Dark mode",
 *   checked: false,
 *   onchange: (e) => toggleDark(e.target.checked)
 * });
 */
function makeSwitch(props = {}) {
  const {
    label,
    checked = false,
    id,
    name,
    disabled = false,
    className = '',
    ...eventHandlers
  } = props;

  return {
    t: 'div',
    a: { class: `bw_form_check bw_form_switch ${className}`.trim() },
    c: [
      {
        t: 'input',
        a: {
          type: 'checkbox',
          class: 'bw_form_check_input bw_switch_input',
          role: 'switch',
          checked,
          id,
          name,
          disabled,
          ...eventHandlers
        }
      },
      label && {
        t: 'label',
        a: { class: 'bw_form_check_label', for: id },
        c: label
      }
    ].filter(Boolean)
  };
}

/**
 * Create a skeleton loading placeholder
 *
 * @param {Object} [props] - Skeleton configuration
 * @param {string} [props.variant="text"] - Shape variant ("text", "circle", "rect")
 * @param {string} [props.width] - Custom width (e.g. "200px", "100%")
 * @param {string} [props.height] - Custom height (e.g. "20px")
 * @param {number} [props.count=1] - Number of skeleton lines (for text variant)
 * @param {string} [props.className] - Additional CSS classes
 * @returns {Object} TACO object representing a skeleton placeholder
 * @category Component Builders
 * @example
 * const skeleton = makeSkeleton({ variant: "text", count: 3, width: "100%" });
 */
function makeSkeleton(props = {}) {
  const {
    variant = 'text',
    width,
    height,
    count = 1,
    className = ''
  } = props;

  if (variant === 'circle') {
    var circleSize = width || height || '3rem';
    return {
      t: 'div',
      a: {
        class: `bw_skeleton bw_skeleton_circle ${className}`.trim(),
        style: { width: circleSize, height: circleSize }
      }
    };
  }

  if (variant === 'rect') {
    return {
      t: 'div',
      a: {
        class: `bw_skeleton bw_skeleton_rect ${className}`.trim(),
        style: {
          width: width || '100%',
          height: height || '120px'
        }
      }
    };
  }

  // Text variant — multiple lines
  if (count === 1) {
    return {
      t: 'div',
      a: {
        class: `bw_skeleton bw_skeleton_text ${className}`.trim(),
        style: {
          width: width || '100%',
          height: height || '1em'
        }
      }
    };
  }

  var lines = [];
  for (var i = 0; i < count; i++) {
    lines.push({
      t: 'div',
      a: {
        class: 'bw_skeleton bw_skeleton_text',
        style: {
          width: i === count - 1 ? '75%' : (width || '100%'),
          height: height || '1em'
        }
      }
    });
  }

  return {
    t: 'div',
    a: { class: `bw_skeleton_group ${className}`.trim() },
    c: lines
  };
}

/**
 * Create a user avatar with image or initials fallback
 *
 * @param {Object} [props] - Avatar configuration
 * @param {string} [props.src] - Image source URL
 * @param {string} [props.alt] - Image alt text
 * @param {string} [props.initials] - Fallback initials (e.g. "JD")
 * @param {string} [props.size="md"] - Size ("sm", "md", "lg", "xl")
 * @param {string} [props.variant="primary"] - Background color variant for initials
 * @param {string} [props.className] - Additional CSS classes
 * @returns {Object} TACO object representing an avatar
 * @category Component Builders
 * @example
 * const avatar = makeAvatar({ src: "/photo.jpg", alt: "Jane Doe", size: "lg" });
 * const avatarInitials = makeAvatar({ initials: "JD", variant: "success" });
 */
function makeAvatar(props = {}) {
  const {
    src,
    alt = '',
    initials,
    size = 'md',
    variant = 'primary',
    className = ''
  } = props;

  if (src) {
    return {
      t: 'img',
      a: {
        class: `bw_avatar bw_avatar_${size} ${className}`.trim(),
        src: src,
        alt: alt
      }
    };
  }

  return {
    t: 'div',
    a: {
      class: `bw_avatar bw_avatar_${size} ${variantClass(variant)} ${className}`.trim()
    },
    c: initials || ''
  };
}

/**
 * Create a carousel/slideshow component with slide transitions
 *
 * Supports image slides, TACO content slides, captions, prev/next controls,
 * dot indicators, and optional auto-play. Uses CSS translateX transitions.
 *
 * @param {Object} [props] - Carousel configuration
 * @param {Array<Object>} [props.items=[]] - Slide items
 * @param {string|Object} props.items[].content - Slide content (TACO, string, or img element)
 * @param {string} [props.items[].caption] - Caption text shown at bottom of slide
 * @param {boolean} [props.showControls=true] - Show prev/next arrow buttons
 * @param {boolean} [props.showIndicators=true] - Show dot navigation
 * @param {boolean} [props.autoPlay=false] - Auto-advance slides
 * @param {number} [props.interval=5000] - Auto-advance interval in ms
 * @param {string} [props.height='300px'] - Carousel height
 * @param {number} [props.startIndex=0] - Initial slide index
 * @param {string} [props.className] - Additional CSS classes
 * @returns {Object} TACO object representing a carousel
 * @category Component Builders
 * @example
 * const carousel = makeCarousel({
 *   items: [
 *     { content: { t: 'img', a: { src: 'photo.jpg' } }, caption: 'Photo 1' },
 *     { content: { t: 'div', c: 'Text slide' } }
 *   ],
 *   autoPlay: true,
 *   interval: 3000
 * });
 */
function makeCarousel(props = {}) {
  const {
    items = [],
    showControls = true,
    showIndicators = true,
    autoPlay = false,
    interval = 5000,
    height = '300px',
    startIndex = 0,
    className = ''
  } = props;

  // Shared navigation logic
  function goToSlide(carouselEl, index) {
    var total = carouselEl.querySelectorAll('.bw_carousel_slide').length;
    if (index < 0) index = total - 1;
    if (index >= total) index = 0;
    carouselEl.setAttribute('data-carousel-index', index);
    var track = carouselEl.querySelector('.bw_carousel_track');
    track.style.transform = 'translateX(-' + (index * 100) + '%)';
    // Update indicators
    var indicators = carouselEl.querySelectorAll('.bw_carousel_indicator');
    for (var i = 0; i < indicators.length; i++) {
      if (i === index) {
        indicators[i].classList.add('active');
      } else {
        indicators[i].classList.remove('active');
      }
    }
  }

  // Arrow SVGs (inline data URIs, same pattern as accordion chevrons)
  var prevArrow = "data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='%23fff'%3e%3cpath d='M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z'/%3e%3c/svg%3e";
  var nextArrow = "data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='%23fff'%3e%3cpath d='M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z'/%3e%3c/svg%3e";

  var slides = items.map(function(item) {
    var slideContent = [
      item.content,
      item.caption && {
        t: 'div',
        a: { class: 'bw_carousel_caption' },
        c: item.caption
      }
    ].filter(Boolean);

    return {
      t: 'div',
      a: { class: 'bw_carousel_slide' },
      c: slideContent.length === 1 ? slideContent[0] : slideContent
    };
  });

  var children = [
    // Track
    {
      t: 'div',
      a: {
        class: 'bw_carousel_track',
        style: 'transform: translateX(-' + (startIndex * 100) + '%)'
      },
      c: slides
    }
  ];

  // Prev/Next controls
  if (showControls && items.length > 1) {
    children.push({
      t: 'button',
      a: {
        class: 'bw_carousel_control bw_carousel_control_prev',
        type: 'button',
        'aria-label': 'Previous slide',
        onclick: function(e) {
          var carousel = e.target.closest('.bw_carousel');
          var idx = parseInt(carousel.getAttribute('data-carousel-index') || '0');
          goToSlide(carousel, idx - 1);
        }
      },
      c: { t: 'img', a: { src: prevArrow, alt: '', role: 'presentation' } }
    });
    children.push({
      t: 'button',
      a: {
        class: 'bw_carousel_control bw_carousel_control_next',
        type: 'button',
        'aria-label': 'Next slide',
        onclick: function(e) {
          var carousel = e.target.closest('.bw_carousel');
          var idx = parseInt(carousel.getAttribute('data-carousel-index') || '0');
          goToSlide(carousel, idx + 1);
        }
      },
      c: { t: 'img', a: { src: nextArrow, alt: '', role: 'presentation' } }
    });
  }

  // Indicators
  if (showIndicators && items.length > 1) {
    children.push({
      t: 'div',
      a: { class: 'bw_carousel_indicators' },
      c: items.map(function(_, i) {
        return {
          t: 'button',
          a: {
            class: 'bw_carousel_indicator' + (i === startIndex ? ' active' : ''),
            type: 'button',
            'aria-label': 'Go to slide ' + (i + 1),
            'data-slide-index': i,
            onclick: function(e) {
              var carousel = e.target.closest('.bw_carousel');
              var idx = parseInt(e.target.getAttribute('data-slide-index'));
              goToSlide(carousel, idx);
            }
          }
        };
      })
    });
  }

  return {
    t: 'div',
    a: {
      class: ('bw_carousel ' + className).trim(),
      style: 'height: ' + height,
      tabindex: '0',
      'aria-roledescription': 'carousel',
      'data-carousel-index': startIndex
    },
    c: children,
    o: {
      type: 'carousel',
      state: { activeIndex: startIndex, autoPlay: autoPlay, interval: interval },
      mounted: function(el) {
        // Keyboard navigation
        el.addEventListener('keydown', function(e) {
          var idx = parseInt(el.getAttribute('data-carousel-index') || '0');
          if (e.key === 'ArrowLeft') {
            e.preventDefault();
            goToSlide(el, idx - 1);
          } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            goToSlide(el, idx + 1);
          }
        });
        // Auto-play
        if (autoPlay) {
          var intervalId = setInterval(function() {
            var idx = parseInt(el.getAttribute('data-carousel-index') || '0');
            goToSlide(el, idx + 1);
          }, interval);
          el._bw_carouselInterval = intervalId;
          // Pause on hover/focus for usability
          el.addEventListener('mouseenter', function() {
            if (el._bw_carouselInterval) clearInterval(el._bw_carouselInterval);
          });
          el.addEventListener('mouseleave', function() {
            el._bw_carouselInterval = setInterval(function() {
              var idx = parseInt(el.getAttribute('data-carousel-index') || '0');
              goToSlide(el, idx + 1);
            }, interval);
          });
        }
      },
      unmount: function(el) {
        if (el._bw_carouselInterval) {
          clearInterval(el._bw_carouselInterval);
        }
      }
    }
  };
}

// =========================================================================
// Phase 4: Dashboard & Data Display
// =========================================================================

/**
 * Create a stat card for dashboard metrics display
 *
 * Shows a large value with a label and optional change indicator.
 * Designed for dashboard grid layouts with left-border accent.
 *
 * @param {Object|string} [props] - Stat card configuration (string shorthand sets label)
 * @param {string|number} [props.value=0] - The main stat value to display
 * @param {string} [props.label] - Descriptive label below the value
 * @param {number} [props.change] - Percentage change indicator (positive = green arrow, negative = red)
 * @param {string} [props.format] - Value format ("number", "currency", "percent")
 * @param {string} [props.prefix] - Custom prefix (e.g. "$")
 * @param {string} [props.suffix] - Custom suffix (e.g. "%")
 * @param {string} [props.icon] - Icon content (emoji or text) shown above value
 * @param {string} [props.variant] - Left-border color variant ("primary", "success", "danger", etc.)
 * @param {string} [props.className] - Additional CSS classes
 * @param {Object} [props.style] - Inline style object
 * @returns {Object} TACO object representing a stat card
 * @category Component Builders
 * @example
 * const stat = makeStatCard({
 *   value: 2345,
 *   label: 'Active Users',
 *   change: 5.3,
 *   format: 'number',
 *   variant: 'primary'
 * });
 */
function makeStatCard(props = {}) {
  if (typeof props === 'string') props = { label: props };
  var {
    value = 0,
    label,
    change,
    format,
    prefix,
    suffix,
    icon,
    variant,
    className = '',
    style
  } = props;

  function formatValue(val, fmt) {
    if (prefix || suffix) return (prefix || '') + val + (suffix || '');
    switch (fmt) {
      case 'currency': return '$' + Number(val).toLocaleString();
      case 'percent': return val + '%';
      case 'number': return Number(val).toLocaleString();
      default: return '' + val;
    }
  }

  var classes = [
    'bw_stat_card',
    variantClass(variant),
    className
  ].filter(Boolean).join(' ').trim();

  var children = [];

  if (icon) {
    children.push({
      t: 'div',
      a: { class: 'bw_stat_icon' },
      c: icon
    });
  }

  children.push({
    t: 'div',
    a: { class: 'bw_stat_value' },
    c: formatValue(value, format)
  });

  if (label) {
    children.push({
      t: 'div',
      a: { class: 'bw_stat_label' },
      c: label
    });
  }

  if (change !== undefined && change !== null) {
    children.push({
      t: 'div',
      a: {
        class: 'bw_stat_change ' + (change >= 0 ? 'bw_stat_change_up' : 'bw_stat_change_down')
      },
      c: (change >= 0 ? '\u2191 +' : '\u2193 ') + change + '%'
    });
  }

  return {
    t: 'div',
    a: { class: classes, style: style },
    c: children,
    o: { type: 'stat-card' }
  };
}

// =========================================================================
// Phase 5: Overlays & Popovers
// =========================================================================

/**
 * Create a tooltip wrapper around trigger content
 *
 * Wraps the trigger element in a container that shows tooltip text
 * on hover and focus. Pure CSS-driven show/hide with JS lifecycle
 * for event binding.
 *
 * @param {Object} [props] - Tooltip configuration
 * @param {string|Object|Array} [props.content] - Trigger content (what the user hovers/focuses)
 * @param {string} [props.text=""] - Tooltip text to display
 * @param {string} [props.placement="top"] - Tooltip placement ("top", "bottom", "left", "right")
 * @param {string} [props.className] - Additional CSS classes
 * @returns {Object} TACO object representing a tooltip wrapper
 * @category Component Builders
 * @example
 * const tip = makeTooltip({
 *   content: makeButton({ text: 'Hover me' }),
 *   text: 'This is a tooltip!',
 *   placement: 'top'
 * });
 */
function makeTooltip(props = {}) {
  var {
    content,
    text = '',
    placement = 'top',
    className = ''
  } = props;

  return {
    t: 'span',
    a: { class: ('bw_tooltip_wrapper ' + className).trim() },
    c: [
      content,
      {
        t: 'span',
        a: {
          class: 'bw_tooltip bw_tooltip_' + placement,
          role: 'tooltip'
        },
        c: text
      }
    ],
    o: {
      type: 'tooltip',
      mounted: function(el) {
        var tip = el.querySelector('.bw_tooltip');
        el.addEventListener('mouseenter', function() {
          tip.classList.add('bw_tooltip_show');
        });
        el.addEventListener('mouseleave', function() {
          tip.classList.remove('bw_tooltip_show');
        });
        el.addEventListener('focusin', function() {
          tip.classList.add('bw_tooltip_show');
        });
        el.addEventListener('focusout', function() {
          tip.classList.remove('bw_tooltip_show');
        });
      }
    }
  };
}

/**
 * Create a popover wrapper around trigger content
 *
 * Like a tooltip but richer — supports title + body content and is
 * triggered by click rather than hover. Dismisses on click outside.
 *
 * @param {Object} [props] - Popover configuration
 * @param {string|Object|Array} [props.trigger] - Trigger content (what the user clicks)
 * @param {string} [props.title] - Popover header title
 * @param {string|Object|Array} [props.content] - Popover body content
 * @param {string} [props.placement="top"] - Placement ("top", "bottom", "left", "right")
 * @param {string} [props.className] - Additional CSS classes
 * @returns {Object} TACO object representing a popover wrapper
 * @category Component Builders
 * @example
 * const pop = makePopover({
 *   trigger: makeButton({ text: 'Click me' }),
 *   title: 'Popover Title',
 *   content: 'Some helpful information here.',
 *   placement: 'bottom'
 * });
 */
function makePopover(props = {}) {
  var {
    trigger,
    title,
    content,
    placement = 'top',
    className = ''
  } = props;

  var popoverContent = [
    title && {
      t: 'div',
      a: { class: 'bw_popover_header' },
      c: title
    },
    content && {
      t: 'div',
      a: { class: 'bw_popover_body' },
      c: content
    }
  ].filter(Boolean);

  return {
    t: 'span',
    a: { class: ('bw_popover_wrapper ' + className).trim() },
    c: [
      {
        t: 'span',
        a: {
          class: 'bw_popover_trigger',
          onclick: function(e) {
            var wrapper = e.target.closest('.bw_popover_wrapper');
            var pop = wrapper.querySelector('.bw_popover');
            pop.classList.toggle('bw_popover_show');
          }
        },
        c: trigger
      },
      {
        t: 'div',
        a: {
          class: 'bw_popover bw_popover_' + placement
        },
        c: popoverContent
      }
    ],
    o: {
      type: 'popover',
      mounted: function(el) {
        // Click outside to close
        var outsideHandler = function(e) {
          if (!el.contains(e.target)) {
            var pop = el.querySelector('.bw_popover');
            if (pop) pop.classList.remove('bw_popover_show');
          }
        };
        document.addEventListener('click', outsideHandler);
        el._bw_outsideHandler = outsideHandler;
      },
      unmount: function(el) {
        if (el._bw_outsideHandler) {
          document.removeEventListener('click', el._bw_outsideHandler);
        }
      }
    }
  };
}

// =========================================================================
// Phase 6: Form Enhancements & Layout
// =========================================================================

/**
 * Create a search input with clear button
 *
 * Wraps a text input with a clear (×) button that appears when
 * the field has content. Calls onSearch on Enter key.
 *
 * @param {Object} [props] - Search input configuration
 * @param {string} [props.placeholder="Search..."] - Placeholder text
 * @param {string} [props.value] - Initial value
 * @param {Function} [props.onSearch] - Callback when Enter is pressed, receives value
 * @param {Function} [props.onInput] - Callback on each keystroke, receives value
 * @param {string} [props.id] - Element ID
 * @param {string} [props.name] - Input name attribute
 * @param {string} [props.className] - Additional CSS classes
 * @returns {Object} TACO object representing a search input
 * @category Component Builders
 * @example
 * const search = makeSearchInput({
 *   placeholder: 'Search users...',
 *   onSearch: (val) => filterUsers(val)
 * });
 */
function makeSearchInput(props = {}) {
  if (typeof props === 'string') props = { placeholder: props };
  var {
    placeholder = 'Search...',
    value,
    onSearch,
    onInput,
    id,
    name,
    className = ''
  } = props;

  return {
    t: 'div',
    a: { class: ('bw_search_input ' + className).trim() },
    c: [
      {
        t: 'input',
        a: {
          type: 'search',
          class: 'bw_form_control bw_search_field',
          placeholder: placeholder,
          value: value,
          id: id,
          name: name,
          onkeydown: function(e) {
            if (e.key === 'Enter' && onSearch) {
              e.preventDefault();
              onSearch(e.target.value);
            }
          },
          oninput: function(e) {
            var wrapper = e.target.closest('.bw_search_input');
            var clearBtn = wrapper.querySelector('.bw_search_clear');
            if (clearBtn) {
              clearBtn.style.display = e.target.value ? 'flex' : 'none';
            }
            if (onInput) onInput(e.target.value);
          }
        }
      },
      {
        t: 'button',
        a: {
          type: 'button',
          class: 'bw_search_clear',
          'aria-label': 'Clear search',
          style: value ? undefined : 'display: none',
          onclick: function(e) {
            var wrapper = e.target.closest('.bw_search_input');
            var input = wrapper.querySelector('.bw_search_field');
            input.value = '';
            e.target.style.display = 'none';
            input.focus();
            if (onInput) onInput('');
            if (onSearch) onSearch('');
          }
        },
        c: '\u00D7'
      }
    ],
    o: { type: 'search-input' }
  };
}

/**
 * Create a styled range slider input
 *
 * @param {Object} [props] - Range configuration
 * @param {number} [props.min=0] - Minimum value
 * @param {number} [props.max=100] - Maximum value
 * @param {number} [props.step=1] - Step increment
 * @param {number} [props.value=50] - Current value
 * @param {string} [props.label] - Label text
 * @param {boolean} [props.showValue=false] - Show current value display
 * @param {string} [props.id] - Element ID
 * @param {string} [props.name] - Input name attribute
 * @param {boolean} [props.disabled=false] - Whether the slider is disabled
 * @param {string} [props.className] - Additional CSS classes
 * @returns {Object} TACO object representing a range input
 * @category Component Builders
 * @example
 * const slider = makeRange({
 *   min: 0, max: 100, value: 50,
 *   label: 'Volume',
 *   showValue: true,
 *   oninput: (e) => setVolume(e.target.value)
 * });
 */
function makeRange(props = {}) {
  var {
    min = 0,
    max = 100,
    step = 1,
    value = 50,
    label,
    showValue = false,
    id,
    name,
    disabled = false,
    className = '',
    ...eventHandlers
  } = props;

  var children = [];

  if (label || showValue) {
    var labelContent = [];
    if (label) {
      labelContent.push({
        t: 'span',
        c: label
      });
    }
    if (showValue) {
      labelContent.push({
        t: 'span',
        a: { class: 'bw_range_value' },
        c: '' + value
      });
    }
    children.push({
      t: 'div',
      a: { class: 'bw_range_label' },
      c: labelContent
    });
  }

  // Wrap oninput to update value display
  var userOnInput = eventHandlers.oninput;
  if (showValue) {
    eventHandlers.oninput = function(e) {
      var wrapper = e.target.closest('.bw_range_wrapper');
      var valDisplay = wrapper.querySelector('.bw_range_value');
      if (valDisplay) valDisplay.textContent = e.target.value;
      if (userOnInput) userOnInput(e);
    };
  }

  children.push({
    t: 'input',
    a: {
      type: 'range',
      class: 'bw_range',
      min: min,
      max: max,
      step: step,
      value: value,
      id: id,
      name: name,
      disabled: disabled,
      ...eventHandlers
    }
  });

  return {
    t: 'div',
    a: { class: ('bw_range_wrapper ' + className).trim() },
    c: children,
    o: { type: 'range' }
  };
}

/**
 * Create a media object layout (image + text side-by-side)
 *
 * Classic media object pattern: image/icon on one side, text content
 * on the other, using flexbox. Supports reversed layout.
 *
 * @param {Object} [props] - Media object configuration
 * @param {string} [props.src] - Image source URL
 * @param {string} [props.alt=""] - Image alt text
 * @param {string} [props.title] - Title text
 * @param {string|Object|Array} [props.content] - Body content
 * @param {boolean} [props.reverse=false] - Put image on the right
 * @param {string} [props.imageSize="3rem"] - Image width/height
 * @param {string} [props.className] - Additional CSS classes
 * @returns {Object} TACO object representing a media object
 * @category Component Builders
 * @example
 * const media = makeMediaObject({
 *   src: '/avatar.jpg',
 *   title: 'Jane Doe',
 *   content: 'Posted a comment 5 minutes ago.'
 * });
 */
function makeMediaObject(props = {}) {
  var {
    src,
    alt = '',
    title,
    content,
    reverse = false,
    imageSize = '3rem',
    className = ''
  } = props;

  var imgEl = src ? {
    t: 'img',
    a: {
      class: 'bw_media_img',
      src: src,
      alt: alt,
      style: 'width:' + imageSize + ';height:' + imageSize
    }
  } : null;

  var bodyEl = {
    t: 'div',
    a: { class: 'bw_media_body' },
    c: [
      title && { t: 'h5', a: { class: 'bw_media_title' }, c: title },
      content
    ].filter(Boolean)
  };

  return {
    t: 'div',
    a: { class: ('bw_media ' + (reverse ? 'bw_media_reverse ' : '') + className).trim() },
    c: reverse
      ? [bodyEl, imgEl].filter(Boolean)
      : [imgEl, bodyEl].filter(Boolean),
    o: { type: 'media-object' }
  };
}

/**
 * Create a file upload zone with drag-and-drop support
 *
 * Styled drop zone with file input. Supports drag-and-drop visuals
 * and multiple file selection.
 *
 * @param {Object} [props] - File upload configuration
 * @param {string} [props.accept] - Accepted file types (e.g. "image/*", ".pdf,.doc")
 * @param {boolean} [props.multiple=false] - Allow multiple file selection
 * @param {Function} [props.onFiles] - Callback when files are selected, receives FileList
 * @param {string} [props.text="Drop files here or click to browse"] - Zone label text
 * @param {string} [props.id] - Element ID
 * @param {string} [props.className] - Additional CSS classes
 * @returns {Object} TACO object representing a file upload zone
 * @category Component Builders
 * @example
 * const upload = makeFileUpload({
 *   accept: 'image/*',
 *   multiple: true,
 *   onFiles: (files) => uploadFiles(files)
 * });
 */
function makeFileUpload(props = {}) {
  var {
    accept,
    multiple = false,
    onFiles,
    text = 'Drop files here or click to browse',
    id,
    className = ''
  } = props;

  return {
    t: 'div',
    a: {
      class: ('bw_file_upload ' + className).trim(),
      tabindex: '0',
      role: 'button',
      'aria-label': text
    },
    c: [
      { t: 'div', a: { class: 'bw_file_upload_icon' }, c: '\uD83D\uDCC1' },
      { t: 'div', a: { class: 'bw_file_upload_text' }, c: text },
      {
        t: 'input',
        a: {
          type: 'file',
          class: 'bw_file_upload_input',
          accept: accept,
          multiple: multiple,
          id: id,
          onchange: function(e) {
            if (onFiles && e.target.files.length) onFiles(e.target.files);
          }
        }
      }
    ],
    o: {
      type: 'file-upload',
      mounted: function(el) {
        var input = el.querySelector('.bw_file_upload_input');

        // Click zone to trigger file input
        el.addEventListener('click', function(e) {
          if (e.target !== input) input.click();
        });

        // Keyboard activation
        el.addEventListener('keydown', function(e) {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            input.click();
          }
        });

        // Drag-and-drop visuals
        el.addEventListener('dragover', function(e) {
          e.preventDefault();
          el.classList.add('bw_file_upload_active');
        });
        el.addEventListener('dragleave', function() {
          el.classList.remove('bw_file_upload_active');
        });
        el.addEventListener('drop', function(e) {
          e.preventDefault();
          el.classList.remove('bw_file_upload_active');
          if (onFiles && e.dataTransfer.files.length) onFiles(e.dataTransfer.files);
        });
      }
    }
  };
}

// =========================================================================
// Phase 7: Data Display & Workflow
// =========================================================================

/**
 * Create a vertical timeline for chronological event display
 *
 * Renders events as a vertical line with markers and content cards.
 * Each item can have a colored variant marker.
 *
 * @param {Object} [props] - Timeline configuration
 * @param {Array<Object>} [props.items=[]] - Timeline events
 * @param {string} [props.items[].title] - Event title
 * @param {string|Object|Array} [props.items[].content] - Event description content
 * @param {string} [props.items[].date] - Date or time label
 * @param {string} [props.items[].variant="primary"] - Marker color variant
 * @param {string} [props.className] - Additional CSS classes
 * @returns {Object} TACO object representing a timeline
 * @category Component Builders
 * @example
 * const timeline = makeTimeline({
 *   items: [
 *     { title: 'Project Started', date: 'Jan 2026', variant: 'primary' },
 *     { title: 'Beta Release', date: 'Mar 2026', content: 'v2.0 beta shipped' },
 *     { title: 'Stable Release', date: 'Jun 2026', variant: 'success' }
 *   ]
 * });
 */
function makeTimeline(props = {}) {
  var {
    items = [],
    className = ''
  } = props;

  return {
    t: 'div',
    a: { class: ('bw_timeline ' + className).trim() },
    c: items.map(function(item) {
      return {
        t: 'div',
        a: { class: 'bw_timeline_item' },
        c: [
          {
            t: 'div',
            a: { class: 'bw_timeline_marker ' + variantClass(item.variant || 'primary') }
          },
          {
            t: 'div',
            a: { class: 'bw_timeline_content' },
            c: [
              item.date && {
                t: 'div',
                a: { class: 'bw_timeline_date' },
                c: item.date
              },
              item.title && {
                t: 'h5',
                a: { class: 'bw_timeline_title' },
                c: item.title
              },
              item.content && (typeof item.content === 'string'
                ? { t: 'p', a: { class: 'bw_timeline_text' }, c: item.content }
                : item.content)
            ].filter(Boolean)
          }
        ]
      };
    }),
    o: { type: 'timeline' }
  };
}

/**
 * Create a multi-step wizard/progress indicator
 *
 * Displays numbered steps with active and completed states.
 * Steps before currentStep are marked completed, the currentStep
 * is active, and subsequent steps are pending.
 *
 * @param {Object} [props] - Stepper configuration
 * @param {Array<Object>} [props.steps=[]] - Step definitions
 * @param {string} [props.steps[].label] - Step label text
 * @param {string} [props.steps[].description] - Optional step description
 * @param {number} [props.currentStep=0] - Zero-based index of the active step
 * @param {string} [props.className] - Additional CSS classes
 * @returns {Object} TACO object representing a stepper
 * @category Component Builders
 * @example
 * const stepper = makeStepper({
 *   currentStep: 1,
 *   steps: [
 *     { label: 'Account', description: 'Create account' },
 *     { label: 'Profile', description: 'Set up profile' },
 *     { label: 'Confirm', description: 'Review & submit' }
 *   ]
 * });
 */
function makeStepper(props = {}) {
  var {
    steps = [],
    currentStep = 0,
    className = ''
  } = props;

  return {
    t: 'div',
    a: { class: ('bw_stepper ' + className).trim(), role: 'list' },
    c: steps.map(function(step, index) {
      var state = index < currentStep ? 'completed' : index === currentStep ? 'active' : 'pending';
      return {
        t: 'div',
        a: {
          class: 'bw_step bw_step_' + state,
          role: 'listitem',
          'aria-current': state === 'active' ? 'step' : undefined
        },
        c: [
          {
            t: 'div',
            a: { class: 'bw_step_indicator' },
            c: state === 'completed' ? '\u2713' : '' + (index + 1)
          },
          {
            t: 'div',
            a: { class: 'bw_step_body' },
            c: [
              { t: 'div', a: { class: 'bw_step_label' }, c: step.label },
              step.description && { t: 'div', a: { class: 'bw_step_description' }, c: step.description }
            ].filter(Boolean)
          }
        ]
      };
    }),
    o: { type: 'stepper' }
  };
}

/**
 * Create a chip/tag input for managing a list of items
 *
 * Displays existing chips with remove buttons and an input field
 * for adding new ones. Chips are added on Enter and removed on
 * clicking the × button.
 *
 * @param {Object} [props] - Chip input configuration
 * @param {Array<string>} [props.chips=[]] - Initial chip values
 * @param {string} [props.placeholder="Add..."] - Input placeholder text
 * @param {Function} [props.onAdd] - Callback when a chip is added, receives value
 * @param {Function} [props.onRemove] - Callback when a chip is removed, receives value
 * @param {string} [props.className] - Additional CSS classes
 * @returns {Object} TACO object representing a chip input
 * @category Component Builders
 * @example
 * const tags = makeChipInput({
 *   chips: ['JavaScript', 'CSS'],
 *   placeholder: 'Add tag...',
 *   onAdd: (val) => addTag(val),
 *   onRemove: (val) => removeTag(val)
 * });
 */
function makeChipInput(props = {}) {
  var {
    chips = [],
    placeholder = 'Add...',
    onAdd,
    onRemove,
    className = ''
  } = props;

  function makeChipEl(text) {
    return {
      t: 'span',
      a: { class: 'bw_chip', 'data-chip-value': text },
      c: [
        text,
        {
          t: 'button',
          a: {
            type: 'button',
            class: 'bw_chip_remove',
            'aria-label': 'Remove ' + text,
            onclick: function(e) {
              var chip = e.target.closest('.bw_chip');
              var val = chip.getAttribute('data-chip-value');
              chip.parentNode.removeChild(chip);
              if (onRemove) onRemove(val);
            }
          },
          c: '\u00D7'
        }
      ]
    };
  }

  return {
    t: 'div',
    a: { class: ('bw_chip_input ' + className).trim() },
    c: [
      ...chips.map(makeChipEl),
      {
        t: 'input',
        a: {
          type: 'text',
          class: 'bw_chip_field',
          placeholder: placeholder,
          onkeydown: function(e) {
            if (e.key === 'Enter' && e.target.value.trim()) {
              e.preventDefault();
              var val = e.target.value.trim();
              var wrapper = e.target.closest('.bw_chip_input');
              // Insert chip before the input
              var chipEl = document.createElement('span');
              chipEl.className = 'bw_chip';
              chipEl.setAttribute('data-chip-value', val);
              chipEl.innerHTML = '';
              chipEl.textContent = val;
              var removeBtn = document.createElement('button');
              removeBtn.type = 'button';
              removeBtn.className = 'bw_chip_remove';
              removeBtn.setAttribute('aria-label', 'Remove ' + val);
              removeBtn.textContent = '\u00D7';
              removeBtn.onclick = function() {
                chipEl.parentNode.removeChild(chipEl);
                if (onRemove) onRemove(val);
              };
              chipEl.appendChild(removeBtn);
              wrapper.insertBefore(chipEl, e.target);
              e.target.value = '';
              if (onAdd) onAdd(val);
            }
            // Backspace on empty input removes last chip
            if (e.key === 'Backspace' && !e.target.value) {
              var wrapper = e.target.closest('.bw_chip_input');
              var chipEls = wrapper.querySelectorAll('.bw_chip');
              if (chipEls.length) {
                var last = chipEls[chipEls.length - 1];
                var removedVal = last.getAttribute('data-chip-value');
                last.parentNode.removeChild(last);
                if (onRemove) onRemove(removedVal);
              }
            }
          }
        }
      }
    ],
    o: { type: 'chip-input' }
  };
}

// componentHandles registry removed in v2.0.15.
// See dev/dead-code-elimination-v2.0.15.md for recovery.

// =========================================================================
// BCCL Component Registry
//
// Single registry mapping type names to their factory functions.
// Enables bw.make('card', props) dispatch and introspection via
// Object.keys(BCCL).
// =========================================================================

/**
 * BCCL component registry — maps component type names to factory functions.
 * Each entry's `make` function is the corresponding exported makeXxx().
 *
 * @type {Object.<string, {make: Function}>}
 */
var BCCL = {
  card:          { make: makeCard },
  button:        { make: makeButton },
  container:     { make: makeContainer },
  row:           { make: makeRow },
  col:           { make: makeCol },
  nav:           { make: makeNav },
  navbar:        { make: makeNavbar },
  tabs:          { make: makeTabs },
  alert:         { make: makeAlert },
  badge:         { make: makeBadge },
  progress:      { make: makeProgress },
  listGroup:     { make: makeListGroup },
  breadcrumb:    { make: makeBreadcrumb },
  form:          { make: makeForm },
  formGroup:     { make: makeFormGroup },
  input:         { make: makeInput },
  textarea:      { make: makeTextarea },
  select:        { make: makeSelect },
  checkbox:      { make: makeCheckbox },
  stack:         { make: makeStack },
  spinner:       { make: makeSpinner },
  hero:          { make: makeHero },
  featureGrid:   { make: makeFeatureGrid },
  cta:           { make: makeCTA },
  section:       { make: makeSection },
  codeDemo:      { make: makeCodeDemo },
  pagination:    { make: makePagination },
  radio:         { make: makeRadio },
  buttonGroup:   { make: makeButtonGroup },
  accordion:     { make: makeAccordion },
  modal:         { make: makeModal },
  toast:         { make: makeToast },
  dropdown:      { make: makeDropdown },
  switch:        { make: makeSwitch },
  skeleton:      { make: makeSkeleton },
  avatar:        { make: makeAvatar },
  carousel:      { make: makeCarousel },
  statCard:      { make: makeStatCard },
  tooltip:       { make: makeTooltip },
  popover:       { make: makePopover },
  searchInput:   { make: makeSearchInput },
  range:         { make: makeRange },
  mediaObject:   { make: makeMediaObject },
  fileUpload:    { make: makeFileUpload },
  timeline:      { make: makeTimeline },
  stepper:       { make: makeStepper },
  chipInput:     { make: makeChipInput }
};

/**
 * Factory function — create any BCCL component by type name.
 *
 * @param {string} type - Component type (e.g. 'card', 'button', 'alert')
 * @param {Object} [props] - Component properties
 * @returns {Object} TACO object
 * @throws {Error} If type is not found in the registry
 * @example
 * var card = make('card', { title: 'Hello', variant: 'primary' });
 * var btn = make('button', { text: 'Click', variant: 'success' });
 * var types = Object.keys(BCCL); // list all available types
 */
function make(type, props) {
  var def = BCCL[type];
  if (!def) throw new Error('bw.make: unknown component type "' + type + '". Available: ' + Object.keys(BCCL).join(', '));
  var taco = def.make(props || {});
  if (taco && typeof taco === 'object') {
    taco._bwFactory = { type: type, props: props || {} };
  }
  return taco;
}

var components = /*#__PURE__*/Object.freeze({
  __proto__: null,
  BCCL: BCCL,
  make: make,
  makeAccordion: makeAccordion,
  makeAlert: makeAlert,
  makeAvatar: makeAvatar,
  makeBadge: makeBadge,
  makeBreadcrumb: makeBreadcrumb,
  makeButton: makeButton,
  makeButtonGroup: makeButtonGroup,
  makeCTA: makeCTA,
  makeCard: makeCard,
  makeCarousel: makeCarousel,
  makeCheckbox: makeCheckbox,
  makeChipInput: makeChipInput,
  makeCodeDemo: makeCodeDemo,
  makeCol: makeCol,
  makeContainer: makeContainer,
  makeDropdown: makeDropdown,
  makeFeatureGrid: makeFeatureGrid,
  makeFileUpload: makeFileUpload,
  makeForm: makeForm,
  makeFormGroup: makeFormGroup,
  makeHero: makeHero,
  makeInput: makeInput,
  makeListGroup: makeListGroup,
  makeMediaObject: makeMediaObject,
  makeModal: makeModal,
  makeNav: makeNav,
  makeNavbar: makeNavbar,
  makePagination: makePagination,
  makePopover: makePopover,
  makeProgress: makeProgress,
  makeRadio: makeRadio,
  makeRange: makeRange,
  makeRow: makeRow,
  makeSearchInput: makeSearchInput,
  makeSection: makeSection,
  makeSelect: makeSelect,
  makeSkeleton: makeSkeleton,
  makeSpinner: makeSpinner,
  makeStack: makeStack,
  makeStatCard: makeStatCard,
  makeStepper: makeStepper,
  makeSwitch: makeSwitch,
  makeTabs: makeTabs,
  makeTextarea: makeTextarea,
  makeTimeline: makeTimeline,
  makeToast: makeToast,
  makeTooltip: makeTooltip,
  variantClass: variantClass
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

  // ── Node reference cache ──────────────────────────────────────────────
  // Fast O(1) lookup for elements by bw_id, id attribute, or bw_uuid.
  //
  // Populated by bw.createDOM() when elements have:
  //   - data-bw_id attribute (user-declared addressable elements)
  //   - id attribute (standard HTML id)
  //   - bw_uuid (internal, for lifecycle-managed elements)
  //
  // Cleaned up by bw.cleanup() when elements are destroyed via bitwrench APIs.
  // On cache miss, falls back to querySelector/getElementById — never fails,
  // just slower. Stale entries (refs to detached nodes) are removed on miss
  // via parentNode === null check (IE11-safe, unlike el.isConnected).
  //
  // Elements created via bw.createDOM() also get el._bw_refs — a local map of
  // child bw_id → DOM node ref for fast parent→child access in o.render.
  // This is the bitwrench equivalent of React's compiled template "holes".
  //
  // Contract: if you remove elements outside of bitwrench APIs (raw el.remove()),
  // map entries may linger until the next lookup attempt cleans them.
  _nodeMap: {},
  
  // Monkey patch for testing (same as v1)
  __monkey_patch_is_nodejs__: {
    _value: 'ignore',
    set: function(x) {
      this._value = _is(x, 'boolean') ? x : 'ignore';
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

// ── Internal aliases ─────────────────────────────────────────────────────
// Short names for frequently-used builtins and internal methods.
// Same pattern as v1 (_to = bw.typeOf, etc.).
//
// Why: Terser can't shorten global property chains (console.warn,
// Object.prototype.hasOwnProperty, Array.isArray, document.createElement)
// because it can't prove they're side-effect-free. We can, so we alias
// them here. Each alias saves bytes in the minified output, and the short
// names also reduce visual noise in the hot paths (binding pipeline,
// createDOM, etc.).
//
// Alias       Target                                  Sites
// ─────────   ──────────────────────────────────────   ─────
// _hop        Object.prototype.hasOwnProperty          15
// _isA        Array.isArray                             25
// _keys       Object.keys                               7
// _to         bw.typeOf (type string)                   26
// _is         type check boolean: _is(x,'string')       ~50
// _cw         console.warn                               8
// _cl         console.log                               11
// _ce         console.error                              4
// _chp        ComponentHandle.prototype                 28  (defined after constructor)
//
// Note: document.createElement etc. are NOT aliased because they require
// `this === document` and .bind() would add overhead on every call.
// Console aliases use thin wrappers (not direct refs) so test monkey-
// patching of console.warn/log/error continues to work.
//
// `typeof x` for UNDECLARED globals (window, document, process, require,
// EventSource, navigator, Promise, __filename, import.meta) MUST stay as
// raw `typeof` — calling _to(x) when x doesn't exist throws ReferenceError.
//
// ── v1 functional type helpers (kept for reference, not currently used) ──
// _toa(x, type, trueVal, falseVal) — bw.typeAssign:
//   returns trueVal if _to(x)===type, else falseVal.
//   Replaces: (typeof x === 'string') ? A : B → _toa(x,'string',A,B)
// _toc(x, type, trueVal, falseVal) — bw.typeConvert:
//   same as _toa but if trueVal/falseVal are functions, calls them with x.
//   Replaces: typeof x === 'string' ? fn(x) : default → _toc(x,'string',fn,default)
// Uncomment if pattern frequency justifies them:
// var _toa = function(x, t, y, n) { return _to(x) === t ? y : n; };
// var _toc = function(x, t, y, n) { var r = _to(x)===t; return r ? (_to(y)==='function'?y(x):y) : (_to(n)==='function'?n(x):n); };
// ─────────────────────────────────────────────────────────────────────────
var _hop  = Object.prototype.hasOwnProperty;
var _isA  = Array.isArray;
var _keys = Object.keys;
var _to   = typeOf;  // imported from bitwrench-utils.js
var _is   = function(x, t) { var r = _to(x); return r === t || r.toLowerCase() === t; };
// Console aliases use thin wrappers (not direct references) so that test
// code can monkey-patch console.warn/log/error and the patches take effect.
var _cw   = function() { console.warn.apply(console, arguments); };
var _cl   = function() { console.log.apply(console, arguments); };
var _ce   = function() { console.error.apply(console, arguments); };

/**
 * Debug flag. When true, emits console.warn for silent binding failures
 * (missing paths, null refs, auto-created intermediate objects).
 * @type {boolean}
 */
bw.debug = false;

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
bw.typeOf = typeOf;

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
 * Look up a DOM element by ID string, using the node cache for O(1) access.
 *
 * Resolution order:
 * 1. Check `bw._nodeMap[id]` — if found and still attached (parentNode !== null), return it
 * 2. If cached ref is detached (parentNode === null), remove stale entry
 * 3. Fall back to `document.getElementById(id)` then `document.querySelector(...)`
 * 4. If fallback finds the element, cache it for next time
 * 5. If not found anywhere, return null
 *
 * Accepts a DOM element directly (pass-through) or a string identifier.
 * String identifiers are tried as: direct map key, getElementById,
 * querySelector (for CSS selectors starting with . or #), and
 * data-bw_id attribute selector.
 *
 * @param {string|Element} id - Element ID, CSS selector, data-bw_id value, or DOM element
 * @returns {Element|null} The DOM element, or null if not found
 * @category Internal
 */
bw._el = function(id) {
  // Pass-through for DOM elements
  if (!_is(id, 'string')) return id || null;
  if (!id) return null;
  if (!bw._isBrowser) return null;

  // 1. Check cache
  var cached = bw._nodeMap[id];
  if (cached) {
    // Verify not detached (parentNode check is IE11-safe)
    if (cached.parentNode !== null) {
      return cached;
    }
    // Stale — remove and fall through
    delete bw._nodeMap[id];
  }

  // 2. DOM fallback: try getElementById first (fastest native lookup)
  var el = document.getElementById(id);

  // 3. Try querySelector for CSS selectors (starts with # or .)
  if (!el && (id.charAt(0) === '#' || id.charAt(0) === '.')) {
    el = document.querySelector(id);
  }

  // 4. Try data-bw_id attribute (for bw.uuid-generated IDs)
  if (!el) {
    el = document.querySelector('[data-bw_id="' + id + '"]');
  }

  // 5. Try class-based lookup for bw_uuid_* tokens (UUID addressing)
  if (!el && id.indexOf('bw_uuid_') === 0) {
    el = document.querySelector('.' + id);
  }

  // 6. Cache the result for next time
  if (el) {
    bw._nodeMap[id] = el;
  }

  return el;
};

/**
 * Register a DOM element in the node cache under one or more keys.
 *
 * Called internally by `bw.createDOM()`. Registers elements that have
 * id attributes, data-bw_id attributes, or both.
 *
 * @param {Element} el - DOM element to register
 * @param {string} [bwId] - data-bw_id value to register under
 * @category Internal
 */
bw._registerNode = function(el, bwId) {
  if (!el) return;
  // Register under data-bw_id
  if (bwId) {
    bw._nodeMap[bwId] = el;
  }
  // Register under id attribute
  var htmlId = el.getAttribute ? el.getAttribute('id') : null;
  if (htmlId) {
    bw._nodeMap[htmlId] = el;
  }
};

/**
 * Remove a DOM element from the node cache.
 *
 * Called internally by `bw.cleanup()` when elements are destroyed
 * through bitwrench APIs.
 *
 * @param {Element} el - DOM element to deregister
 * @param {string} [bwId] - data-bw_id value to remove
 * @category Internal
 */
bw._deregisterNode = function(el, bwId) {
  // Remove data-bw_id entry
  if (bwId) {
    delete bw._nodeMap[bwId];
  }
  // Remove id attribute entry
  var htmlId = el && el.getAttribute ? el.getAttribute('id') : null;
  if (htmlId) {
    delete bw._nodeMap[htmlId];
  }
};

// ===================================================================================
// bw.assignUUID() / bw.getUUID() — Explicit UUID addressing for TACO objects
// ===================================================================================

/**
 * Regex to match a bw_uuid_* token in a class string.
 * @private
 */
var _UUID_RE = /\bbw_uuid_[a-z0-9_]+\b/;

/**
 * Assign a UUID to a TACO object by appending a `bw_uuid_*` token to `taco.a.class`.
 *
 * Idempotent by default — calling twice returns the same UUID. Pass `forceNew=true`
 * to replace an existing UUID (useful in loops where each TACO needs a unique ID).
 *
 * @param {Object} taco - A TACO object `{t, a, c, o}`
 * @param {boolean} [forceNew=false] - If true, replaces any existing UUID with a new one
 * @returns {string} The UUID string (e.g. 'bw_uuid_a1b2c3d4e5')
 * @category Identifiers
 * @example
 * var card = bw.makeStatCard({ value: '0', label: 'Scans' });
 * var uuid = bw.assignUUID(card);        // 'bw_uuid_a1b2c3d4e5'
 * var same = bw.assignUUID(card);        // same UUID (idempotent)
 * var diff = bw.assignUUID(card, true);  // new UUID (forced)
 */
bw.assignUUID = function(taco, forceNew) {
  if (!taco || !_is(taco, 'object')) return null;

  // Ensure taco.a exists
  if (!taco.a) taco.a = {};
  if (!_is(taco.a.class, 'string')) taco.a.class = taco.a.class ? String(taco.a.class) : '';

  var existing = taco.a.class.match(_UUID_RE);

  if (existing && !forceNew) {
    return existing[0];
  }

  // Remove old UUID if forceNew
  if (existing) {
    taco.a.class = taco.a.class.replace(_UUID_RE, '').replace(/\s+/g, ' ').trim();
  }

  var uuid = bw.uuid('uuid');
  taco.a.class = (taco.a.class ? taco.a.class + ' ' : '') + uuid;
  return uuid;
};

/**
 * Read the UUID from a TACO object or DOM element. Pure getter, no side effects.
 *
 * @param {Object|Element} tacoOrElement - A TACO object or DOM element
 * @returns {string|null} The UUID string, or null if none assigned
 * @category Identifiers
 * @example
 * bw.getUUID(card)       // 'bw_uuid_a1b2c3d4e5' (from TACO)
 * bw.getUUID(domEl)      // 'bw_uuid_a1b2c3d4e5' (from DOM element)
 * bw.getUUID({t:'div'})  // null (no UUID)
 */
bw.getUUID = function(tacoOrElement) {
  if (!tacoOrElement) return null;

  var classStr;
  // DOM element: check className
  if (tacoOrElement.className !== undefined && tacoOrElement.tagName) {
    classStr = tacoOrElement.className;
  }
  // TACO object: check a.class
  else if (tacoOrElement.a && _is(tacoOrElement.a.class, 'string')) {
    classStr = tacoOrElement.a.class;
  }

  if (!classStr) return null;
  var match = classStr.match(_UUID_RE);
  return match ? match[0] : null;
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
  if (!_is(str, 'string')) return '';
  
  const escapeMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;'
  };
  
  return str.replace(/[&<>"'/]/g, (char) => escapeMap[char]);
};

/**
 * Mark a string as raw HTML so it will not be escaped by bw.html() or bw.createDOM().
 *
 * By default, bitwrench escapes all text content to prevent XSS. Use bw.raw()
 * when you need to embed pre-sanitized HTML, entities, or inline markup.
 *
 * @param {string} str - HTML string to mark as raw
 * @returns {Object} Marked object recognized by bw.html() and bw.createDOM()
 * @category DOM Generation
 * @see bw.escapeHTML
 * @see bw.html
 * @example
 * bw.raw('Hello &mdash; World')
 * // Used in TACO content:
 * { t: 'p', c: bw.raw('Price: <strong>$9.99</strong>') }
 */
bw.raw = function(str) {
  return { __bw_raw: true, v: String(str) };
};

/**
 * Hyperscript-style TACO constructor.
 *
 * A convenience helper that returns a canonical TACO object from positional
 * arguments. The return value is a plain object — serializable, works with
 * bwserve, and accepted everywhere TACO is accepted.
 *
 * @param {string} tag - HTML tag name (e.g. 'div', 'p', 'section')
 * @param {Object|null} [attrs] - HTML attributes object. Pass null or omit to skip.
 * @param {*} [content] - Content: string, number, TACO object, or array of children.
 * @param {Object} [options] - TACO options (state, lifecycle hooks, render fn).
 * @returns {Object} Plain TACO object {t, a?, c?, o?}
 * @category Utilities
 * @see bw.html
 * @see bw.createDOM
 * @see bw.DOM
 * @example
 * bw.h('div')
 * // => { t: 'div' }
 *
 * bw.h('p', { class: 'bw_text_muted' }, 'Hello')
 * // => { t: 'p', a: { class: 'bw_text_muted' }, c: 'Hello' }
 *
 * bw.h('ul', null, [
 *   bw.h('li', null, 'one'),
 *   bw.h('li', null, 'two')
 * ])
 * // => { t: 'ul', c: [{ t: 'li', c: 'one' }, { t: 'li', c: 'two' }] }
 */
bw.h = function(tag, attrs, content, options) {
  var taco = { t: String(tag) };
  if (attrs !== null && attrs !== undefined) taco.a = attrs;
  if (content !== undefined) taco.c = content;
  if (options !== undefined) taco.o = options;
  return taco;
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

  // Handle ComponentHandle — use its .taco
  if (taco && taco._bwComponent === true) {
    var compOptions = Object.assign({}, options);
    if (!compOptions.state && taco._state) {
      compOptions.state = taco._state;
    }
    return bw.html(taco.taco, compOptions);
  }

  // Handle arrays of TACOs
  if (_isA(taco)) {
    return taco.map(t => bw.html(t, options)).join('');
  }

  // Handle bw.raw() marked content
  if (taco && taco.__bw_raw) {
    return taco.v;
  }

  // Handle bw.when() markers
  if (taco && taco._bwWhen && options.state) {
    var whenExpr = taco.expr.replace(/^\$\{|\}$/g, '');
    var whenVal = options.compile
      ? bw._resolveTemplate('${' + whenExpr + '}', options.state, true)
      : bw._evaluatePath(options.state, whenExpr);
    var branch = whenVal ? taco.branches[0] : (taco.branches[1] || null);
    return branch ? bw.html(branch, options) : '';
  }

  // Handle bw.each() markers
  if (taco && taco._bwEach && options.state) {
    var eachExpr = taco.expr.replace(/^\$\{|\}$/g, '');
    var arr = bw._evaluatePath(options.state, eachExpr);
    if (!_isA(arr)) return '';
    return arr.map(function(item, idx) { return bw.html(taco.factory(item, idx), options); }).join('');
  }

  // Handle primitives and non-TACO objects
  if (!_is(taco, 'object') || !taco.t) {
    var str = options.raw ? String(taco) : bw.escapeHTML(String(taco));
    // Resolve template bindings if state provided
    if (options.state && _is(str, 'string') && str.indexOf('${') >= 0) {
      str = bw._resolveTemplate(str, options.state, !!options.compile);
    }
    return str;
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
    
    // Serialize event handlers via funcRegister
    if (key.startsWith('on')) {
      if (_is(value, 'function')) {
        var fnId = bw.funcRegister(value);
        attrStr += ' ' + key + '="' + bw.funcGetDispatchStr(fnId, 'event') + '"';
      } else if (_is(value, 'string')) {
        attrStr += ' ' + key + '="' + bw.escapeHTML(value) + '"';
      }
      continue;
    }
    
    if (key === 'style' && _is(value, 'object')) {
      // Convert style object to string
      const styleStr = Object.entries(value)
        .filter(([, v]) => v != null)
        .map(([k, v]) => `${k}:${v}`)
        .join(';');
      if (styleStr) {
        attrStr += ` style="${bw.escapeHTML(styleStr)}"`;
      }
    } else if (key === 'class') {
      // Handle class as array or string
      const classStr = _isA(value) ? value.filter(Boolean).join(' ') : String(value);
      if (classStr) {
        attrStr += ` class="${bw.escapeHTML(classStr)}"`;
      }
    } else if (value === true) {
      // Boolean attributes
      attrStr += ` ${key}`;
    } else {
      // Regular attributes — resolve ${expr} if state provided
      let resolvedVal = String(value);
      if (options.state && resolvedVal.indexOf('${') >= 0) {
        resolvedVal = bw._resolveTemplate(resolvedVal, options.state, !!options.compile);
      }
      attrStr += ` ${key}="${bw.escapeHTML(resolvedVal)}"`;
    }
  }

  // Add bw_id as a class if lifecycle hooks present
  if ((opts.mounted || opts.unmount) && !attrs.class?.includes('bw_id_')) {
    const id = opts.bw_id || bw.uuid();
    attrStr = attrStr.replace(/class="([^"]*)"/, (_match, classes) => {
      return `class="${classes} bw_id_${id}"`.trim();
    });
    if (!attrStr.includes('class=')) {
      attrStr += ` class="bw_id_${id}"`;
    }
  }
  
  // Build HTML
  if (isSelfClosing) {
    return `<${tag}${attrStr} />`;
  }
  
  // Process content recursively
  let contentStr = content != null ? bw.html(content, options) : '';
  // Resolve template bindings in content if state provided
  if (options.state && _is(contentStr, 'string') && contentStr.indexOf('${') >= 0) {
    contentStr = bw._resolveTemplate(contentStr, options.state, !!options.compile);
  }

  return `<${tag}${attrStr}>${contentStr}</${tag}>`;
};

/**
 * Generate a complete, self-contained HTML document from TACO content.
 *
 * Produces a full `<!DOCTYPE html>` page with configurable runtime injection,
 * func registry emission (so serialized event handlers work), optional theme,
 * and extra head elements. Designed for static site generation, offline/airgapped
 * use, and the "static site that isn't static" workflow.
 *
 * @param {Object} [opts={}] - Page options
 * @param {Object|string|Array} [opts.body=''] - Body content: TACO, string, or array
 * @param {string} [opts.title='bitwrench'] - Page title
 * @param {Object} [opts.state] - State for ${expr} resolution in bw.html()
 * @param {string} [opts.runtime='shim'] - Runtime level: 'inline'|'cdn'|'shim'|'none'
 * @param {string} [opts.css=''] - Additional CSS for <style> block
 * @param {string|Object} [opts.theme=null] - Theme preset name or config object
 * @param {Array} [opts.head=[]] - Extra TACO elements rendered into <head>
 * @param {string} [opts.favicon=''] - Favicon URL
 * @param {string} [opts.lang='en'] - HTML lang attribute
 * @returns {string} Complete HTML document string
 * @category DOM Generation
 * @see bw.html
 * @example
 * bw.htmlPage({
 *   title: 'My App',
 *   body: { t: 'h1', c: 'Hello World' },
 *   runtime: 'shim'
 * })
 */
bw.htmlPage = function(opts) {
  opts = opts || {};
  var title     = opts.title   || 'bitwrench';
  var body      = opts.body    || '';
  var state     = opts.state   || undefined;
  var runtime   = opts.runtime || 'shim';
  var css       = opts.css     || '';
  var theme     = opts.theme   || null;
  var headExtra = opts.head    || [];
  var favicon   = opts.favicon || '';
  var lang      = opts.lang    || 'en';

  // Snapshot funcRegistry counter before rendering
  var fnCounterBefore = bw._fnIDCounter;

  // Render body content
  var bodyHTML = '';
  if (_is(body, 'string')) {
    bodyHTML = body;
  } else {
    var htmlOpts = {};
    if (state) htmlOpts.state = state;
    bodyHTML = bw.html(body, htmlOpts);
  }

  // Collect functions registered during this render
  var fnCounterAfter = bw._fnIDCounter;
  var registryEntries = '';
  for (var i = fnCounterBefore; i < fnCounterAfter; i++) {
    var fnKey = 'bw_fn_' + i;
    if (bw._fnRegistry[fnKey]) {
      registryEntries += 'bw._fnRegistry[\'' + fnKey + '\']=' +
        bw._fnRegistry[fnKey].toString() + ';\n';
    }
  }

  // Build runtime script for <head>
  var runtimeHead = '';
  if (runtime === 'inline') {
    // Read UMD bundle synchronously if in Node.js
    var umdSource = null;
    if (bw._isNode) {
      try {
        var fs = (typeof require === 'function') ? require('fs') : null;
        var pathMod = (typeof require === 'function') ? require('path') : null;
        if (fs && pathMod) {
          // Resolve dist/ relative to this source file
          var srcDir = '';
          try { srcDir = pathMod.dirname((typeof __filename !== 'undefined') ? __filename : ''); }
          catch(e2) { /* ESM: __filename not available */ }
          if (!srcDir && typeof ({ url: (typeof document === 'undefined' ? require('u' + 'rl').pathToFileURL(__filename).href : (_documentCurrentScript && _documentCurrentScript.tagName.toUpperCase() === 'SCRIPT' && _documentCurrentScript.src || new URL('bitwrench.cjs.js', document.baseURI).href)) }) !== 'undefined' && (typeof document === 'undefined' ? require('u' + 'rl').pathToFileURL(__filename).href : (_documentCurrentScript && _documentCurrentScript.tagName.toUpperCase() === 'SCRIPT' && _documentCurrentScript.src || new URL('bitwrench.cjs.js', document.baseURI).href))) {
            var url = (typeof require === 'function') ? require('url') : null;
            if (url && url.fileURLToPath) srcDir = pathMod.dirname(url.fileURLToPath((typeof document === 'undefined' ? require('u' + 'rl').pathToFileURL(__filename).href : (_documentCurrentScript && _documentCurrentScript.tagName.toUpperCase() === 'SCRIPT' && _documentCurrentScript.src || new URL('bitwrench.cjs.js', document.baseURI).href))));
          }
          if (srcDir) {
            var distPath = pathMod.resolve(srcDir, '../dist/bitwrench.umd.min.js');
            umdSource = fs.readFileSync(distPath, 'utf8');
          }
        }
      } catch(e) { /* fall through */ }
    }
    if (umdSource) {
      runtimeHead = '<script>' + umdSource + '</script>';
    } else {
      // Fallback to shim in browser or if dist not available
      runtimeHead = '<script>' + bw._FUNC_REGISTRY_SHIM + '</script>';
    }
  } else if (runtime === 'cdn') {
    runtimeHead = '<script src="https://cdn.jsdelivr.net/npm/bitwrench@2/dist/bitwrench.umd.min.js"></script>';
  } else if (runtime === 'shim') {
    runtimeHead = '<script>' + bw._FUNC_REGISTRY_SHIM + '</script>';
  }
  // runtime === 'none' → empty

  // Theme CSS
  var themeCSS = '';
  if (theme) {
    var themeConfig = _is(theme, 'string')
      ? (THEME_PRESETS[theme.toLowerCase()] || null)
      : theme;
    if (themeConfig) {
      var themeResult = bw.makeStyles(themeConfig);
      themeCSS = themeResult.css;
    }
  }

  // Extra <head> elements
  var headHTML = '';
  if (_isA(headExtra) && headExtra.length > 0) {
    headHTML = headExtra.map(function(el) { return bw.html(el); }).join('\n');
  }

  // Favicon
  var faviconTag = '';
  if (favicon) {
    var safeFavicon = favicon.replace(/[&<>"']/g, function(c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
    faviconTag = '<link rel="icon" href="' + safeFavicon + '">';
  }

  // Escaped title
  var safeTitle = bw.escapeHTML(title);

  // Combine all CSS
  var allCSS = (themeCSS ? themeCSS + '\n' : '') + css;

  // Body-end script: registry entries + optional loadStyles
  var bodyEndScript = '';
  var bodyEndParts = [];
  if (registryEntries) {
    bodyEndParts.push(registryEntries);
  }
  if (runtime === 'inline' || runtime === 'cdn') {
    bodyEndParts.push('if(typeof bw!=="undefined"){bw.loadStyles();}');
  }
  if (bodyEndParts.length > 0) {
    bodyEndScript = '<script>\n' + bodyEndParts.join('\n') + '\n</script>';
  }

  // Assemble document
  var parts = [
    '<!DOCTYPE html>',
    '<html lang="' + lang + '">',
    '<head>',
    '<meta charset="UTF-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">'
  ];
  parts.push('<title>' + safeTitle + '</title>');
  if (faviconTag) parts.push(faviconTag);
  if (runtimeHead) parts.push(runtimeHead);
  if (headHTML) parts.push(headHTML);
  if (allCSS) parts.push('<style>' + allCSS + '</style>');
  parts.push('</head>');
  parts.push('<body>');
  parts.push(bodyHTML);
  if (bodyEndScript) parts.push(bodyEndScript);
  parts.push('</body>');
  parts.push('</html>');

  return parts.join('\n');
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
 *   a: { class: 'bw_btn', onclick: () => alert('clicked') },
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

  // Handle bw.raw() marked content — inject as HTML
  if (taco && taco.__bw_raw) {
    var frag = document.createDocumentFragment();
    var tmp = document.createElement('span');
    tmp.innerHTML = taco.v;
    while (tmp.firstChild) frag.appendChild(tmp.firstChild);
    return frag;
  }

  // Handle ComponentHandle — extract .taco for DOM creation
  if (taco && taco._bwComponent === true) {
    return bw.createDOM(taco.taco, options);
  }

  // Handle text nodes
  if (!_is(taco, 'object') || !taco.t) {
    return document.createTextNode(String(taco));
  }

  const { t: tag, a: attrs = {}, c: content, o: opts = {} } = taco;
  
  // Create element
  const el = document.createElement(tag);
  
  // Set attributes
  for (const [key, value] of Object.entries(attrs)) {
    if (value == null || value === false) continue;
    
    if (key === 'style' && _is(value, 'object')) {
      // Apply styles directly
      Object.assign(el.style, value);
    } else if (key === 'class') {
      // Handle class as array or string
      const classStr = _isA(value) ? value.filter(Boolean).join(' ') : String(value);
      if (classStr) {
        el.className = classStr;
      }
    } else if (key.startsWith('on') && _is(value, 'function')) {
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
  
  // Add children, building _bw_refs for fast parent→child access.
  // Children with data-bw_id or id attributes get local refs on the parent,
  // so o.render functions can access them without any DOM lookup.
  if (content != null) {
    if (_isA(content)) {
      content.forEach(child => {
        if (child != null) {
          // Handle ComponentHandle in content arrays (Level 2 children)
          if (child._bwComponent === true) {
            child.mount(el);
            return;
          }
          var childEl = bw.createDOM(child, options);
          el.appendChild(childEl);
          // Build local refs for addressable children
          var childBwId = (child && child.a) ? (child.a['data-bw_id'] || child.a.id) : null;
          if (childBwId) {
            if (!el._bw_refs) el._bw_refs = {};
            el._bw_refs[childBwId] = childEl;
          }
          // Bubble up grandchild refs (flatten one level)
          if (childEl._bw_refs) {
            if (!el._bw_refs) el._bw_refs = {};
            for (var rk in childEl._bw_refs) {
              if (_hop.call(childEl._bw_refs, rk)) {
                el._bw_refs[rk] = childEl._bw_refs[rk];
              }
            }
          }
        }
      });
    } else if (_is(content, 'object') && content.__bw_raw) {
      // Raw HTML content — inject via innerHTML
      el.innerHTML = content.v;
    } else if (content._bwComponent === true) {
      // Single ComponentHandle as content
      content.mount(el);
    } else if (_is(content, 'object') && content.t) {
      var childEl = bw.createDOM(content, options);
      el.appendChild(childEl);
      var childBwId = content.a ? (content.a['data-bw_id'] || content.a.id) : null;
      if (childBwId) {
        if (!el._bw_refs) el._bw_refs = {};
        el._bw_refs[childBwId] = childEl;
      }
      if (childEl._bw_refs) {
        if (!el._bw_refs) el._bw_refs = {};
        for (var rk in childEl._bw_refs) {
          if (_hop.call(childEl._bw_refs, rk)) {
            el._bw_refs[rk] = childEl._bw_refs[rk];
          }
        }
      }
    } else {
      el.textContent = String(content);
    }
  }

  // Register element in node cache if it has an id attribute
  if (attrs.id) {
    bw._registerNode(el, null);
  }

  // Register UUID class in node cache (bw_uuid_* tokens in class string)
  if (el.className) {
    var uuidMatch = el.className.match(_UUID_RE);
    if (uuidMatch) {
      bw._nodeMap[uuidMatch[0]] = el;
    }
  }

  // Handle lifecycle hooks and state
  if (opts.mounted || opts.unmount || opts.render || opts.state) {
    const id = attrs['data-bw_id'] || bw.uuid();
    el.setAttribute('data-bw_id', id);

    // Register in node cache under data-bw_id
    bw._registerNode(el, id);

    // Store state
    if (opts.state) {
      el._bw_state = opts.state;
    }

    // o.render — first-class render function (replaces mounted boilerplate)
    if (opts.render) {
      el._bw_render = opts.render;

      if (opts.mounted) {
        _cw('bw.createDOM: o.render and o.mounted are mutually exclusive. o.render wins.');
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
  } else if (attrs['data-bw_id']) {
    // Element has explicit data-bw_id but no lifecycle hooks — still register it
    bw._registerNode(el, attrs['data-bw_id']);
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
  
  // Get target element (use cache-backed lookup)
  const targetEl = bw._el(target);
    
  if (!targetEl) {
    _ce('bw.DOM: Target element not found:', target);
    return null;
  }
  
  // Clean up existing children (but preserve the target's own state, render, and subs —
  // the target is the mount point, not the content being replaced)
  const savedState = targetEl._bw_state;
  const savedRender = targetEl._bw_render;
  const savedBwId = targetEl.getAttribute('data-bw_id');
  const savedSubs = targetEl._bw_subs;

  // Temporarily remove _bw_subs so cleanup doesn't call them
  // (children's subs will still be cleaned up normally)
  delete targetEl._bw_subs;

  bw.cleanup(targetEl);

  // Restore the target's own state/render/subs after cleanup
  if (savedState !== undefined) targetEl._bw_state = savedState;
  if (savedRender) targetEl._bw_render = savedRender;
  if (savedBwId) {
    targetEl.setAttribute('data-bw_id', savedBwId);
    // Re-register mount point in node cache (cleanup deregistered it)
    bw._registerNode(targetEl, savedBwId);
  }
  if (savedSubs) targetEl._bw_subs = savedSubs;

  // Clear and mount new content
  targetEl.innerHTML = '';
  
  if (taco != null) {
    // Handle ComponentHandle (reactive components from bw.component())
    if (taco._bwComponent === true) {
      taco.mount(targetEl);
    }
    // Handle component handles (objects with element property)
    else if (taco.element instanceof Element) {
      targetEl.appendChild(taco.element);
    }
    // Handle arrays
    else if (_isA(taco)) {
      taco.forEach(t => {
        if (t != null) {
          if (t._bwComponent === true) {
            t.mount(targetEl);
          } else if (t.element instanceof Element) {
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
  
  _keys(props).forEach(key => {
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
    onPropChange(_key, _newValue, _oldValue) {
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

  // Deregister UUID classes from node cache (element + descendants)
  // Covers elements that have UUID but no data-bw_id
  var selfUuidMatch = element.className && element.className.match(_UUID_RE);
  if (selfUuidMatch) delete bw._nodeMap[selfUuidMatch[0]];
  var uuidEls = element.querySelectorAll('[class*="bw_uuid_"]');
  uuidEls.forEach(function(uel) {
    var m = uel.className && uel.className.match(_UUID_RE);
    if (m) delete bw._nodeMap[m[0]];
  });

  // Find all elements with data-bw_id
  const elements = element.querySelectorAll('[data-bw_id]');

  elements.forEach(el => {
    const id = el.getAttribute('data-bw_id');
    const callback = bw._unmountCallbacks.get(id);

    if (callback) {
      callback();
      bw._unmountCallbacks.delete(id);
    }

    // Deregister from node cache
    bw._deregisterNode(el, id);

    // Deregister UUID class from node cache
    var uuidMatch = el.className && el.className.match(_UUID_RE);
    if (uuidMatch) delete bw._nodeMap[uuidMatch[0]];

    // Clean up pub/sub subscriptions tied to this element
    if (el._bw_subs) {
      el._bw_subs.forEach(function(unsub) { unsub(); });
      delete el._bw_subs;
    }

    // Clean up state, render, and local refs
    delete el._bw_state;
    delete el._bw_render;
    delete el._bw_refs;
  });

  // Check element itself
  const id = element.getAttribute('data-bw_id');
  if (id) {
    const callback = bw._unmountCallbacks.get(id);
    if (callback) {
      callback();
      bw._unmountCallbacks.delete(id);
    }

    // Deregister from node cache
    bw._deregisterNode(element, id);

    // Deregister UUID class from node cache
    var elemUuidMatch = element.className && element.className.match(_UUID_RE);
    if (elemUuidMatch) delete bw._nodeMap[elemUuidMatch[0]];

    // Clean up pub/sub subscriptions tied to element itself
    if (element._bw_subs) {
      element._bw_subs.forEach(function(unsub) { unsub(); });
      delete element._bw_subs;
    }
    delete element._bw_state;
    delete element._bw_render;
    delete element._bw_refs;

    // Clean up ComponentHandle back-reference
    if (element._bwComponentHandle) {
      element._bwComponentHandle.mounted = false;
      element._bwComponentHandle.element = null;
      delete element._bwComponentHandle;
    }
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
 * @param {string|Element} target - Element ID, data-bw_id, CSS selector, or DOM element
 * @returns {Element|null} The element, or null if not found / no render function
 * @category State Management
 * @see bw.patch
 * @example
 * // Given a counter element with o.render
 * el._bw_state.count++;
 * bw.update(el);  // re-renders, emits bw:statechange
 */
bw.update = function(target) {
  var el = bw._el(target);
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
 * @param {string|Element} id - Element ID, data-bw_id, CSS selector, or DOM element.
 *   Uses node cache for O(1) lookup; falls back to DOM query on cache miss.
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
  var el = bw._el(id);
  if (!el) return null;

  if (attr) {
    // Patch an attribute
    el.setAttribute(attr, String(content));
  } else if (_isA(content)) {
    // Patch with array of children (strings and/or TACOs)
    el.innerHTML = '';
    content.forEach(function(item) {
      if (_is(item, 'string') || _is(item, 'number')) {
        el.appendChild(document.createTextNode(String(item)));
      } else if (item && item.t) {
        el.appendChild(bw.createDOM(item));
      }
    });
  } else if (_is(content, 'object') && content.t) {
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
    if (_hop.call(patches, id)) {
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
 * @param {string|Element} target - Element ID, data-bw_id, CSS selector, or DOM element.
 *   Uses node cache for O(1) lookup; falls back to DOM query on cache miss.
 * @param {string} eventName - Event name (will be prefixed with 'bw:')
 * @param {*} [detail] - Data to pass with the event
 * @category Events (DOM)
 * @see bw.on
 * @example
 * bw.emit('#my-widget', 'statechange', { count: 42 });
 * // Dispatches CustomEvent 'bw:statechange' on the element
 */
bw.emit = function(target, eventName, detail) {
  var el = bw._el(target);
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
 * @param {string|Element} target - Element ID, data-bw_id, CSS selector, or DOM element.
 *   Uses node cache for O(1) lookup; falls back to DOM query on cache miss.
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
  var el = bw._el(target);
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
      _cw('bw.pub: subscriber error on topic "' + topic + '":', err);
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
    // Ensure element has data-bw_id so bw.cleanup() finds it
    if (!el.getAttribute('data-bw_id')) {
      var bwId = 'bw_sub_' + id;
      el.setAttribute('data-bw_id', bwId);
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

// ===================================================================================
// Function Registry (revived from v1 for string dispatch contexts)
// ===================================================================================

bw._fnRegistry = {};
bw._fnIDCounter = 0;

/**
 * Register a function in the global function registry.
 *
 * Registered functions can be invoked by name in HTML string contexts
 * (e.g., onclick attributes) via `bw.funcGetById()`. Useful for
 * serializable event handlers, LLM wire format, and SSR.
 *
 * @param {Function} fn - Function to register
 * @param {string} [name] - Optional name. Auto-generated if omitted.
 * @returns {string} The registered name (use for dispatch)
 * @category Function Registry
 * @see bw.funcGetById
 * @see bw.funcGetDispatchStr
 */
bw.funcRegister = function(fn, name) {
  if (!_is(fn, 'function')) return '';
  var fnID = (_is(name, 'string') && name.length > 0) ? name : ('bw_fn_' + bw._fnIDCounter++);
  bw._fnRegistry[fnID] = fn;
  return fnID;
};

/**
 * Retrieve a registered function by name.
 *
 * Returns the function if found, or `errFn` (or a no-op logger) if not.
 *
 * @param {string} name - Registered function name
 * @param {Function} [errFn] - Fallback if not found
 * @returns {Function} The registered function or fallback
 * @category Function Registry
 * @see bw.funcRegister
 */
bw.funcGetById = function(name, errFn) {
  name = String(name);
  if (name in bw._fnRegistry) return bw._fnRegistry[name];
  return _is(errFn, 'function') ? errFn : function() { _cw('bw.funcGetById: unregistered fn "' + name + '"'); };
};

/**
 * Generate a dispatch string suitable for inline HTML event attributes.
 *
 * @param {string} name - Registered function name
 * @param {string} [argStr=''] - Arguments string (literal, not variable names)
 * @returns {string} Dispatch string like `"bw.funcGetById('name')(args)"`
 * @category Function Registry
 * @see bw.funcRegister
 */
bw.funcGetDispatchStr = function(name, argStr) {
  argStr = (argStr != null) ? String(argStr) : '';
  return "bw.funcGetById('" + name + "')(" + argStr + ")";
};

/**
 * Remove a function from the registry.
 *
 * @param {string} name - Registered function name
 * @returns {boolean} True if removed, false if not found
 * @category Function Registry
 */
bw.funcUnregister = function(name) {
  if (name in bw._fnRegistry) {
    delete bw._fnRegistry[name];
    return true;
  }
  return false;
};

/**
 * Get a shallow copy of the function registry for inspection.
 *
 * @returns {Object} Copy of registry (name → function)
 * @category Function Registry
 */
bw.funcGetRegistry = function() {
  var copy = {};
  for (var k in bw._fnRegistry) {
    if (_hop.call(bw._fnRegistry, k)) {
      copy[k] = bw._fnRegistry[k];
    }
  }
  return copy;
};

/**
 * Minimal runtime shim for funcRegister dispatch in static HTML.
 * When embedded in a `<script>` tag, provides just enough infrastructure
 * for `bw.funcGetById()` calls to resolve. The actual function bodies
 * are emitted separately as `bw._fnRegistry['bw_fn_X'] = ...;` assignments.
 * @type {string}
 * @category Function Registry
 */
bw._FUNC_REGISTRY_SHIM = '(function(){var bw=window.bw||(window.bw={});' +
  'if(!bw._fnRegistry)bw._fnRegistry={};' +
  'bw.funcGetById=function(n){return bw._fnRegistry[n]||function(){' +
  'console.warn("bw: unregistered fn "+n)};};' +
  'bw.funcRegister=function(fn,name){' +
  'var id=name||("bw_fn_"+(bw._fnIDCounter=(bw._fnIDCounter||0)+1));' +
  'bw._fnRegistry[id]=fn;return id;};' +
  'window.bw=bw;})();';

// ===================================================================================
// Template Binding Utilities
// ===================================================================================

/**
 * Parse binding expressions from a template string.
 * Returns array of {start, end, expr} for each `${expr}` found.
 * @private
 */
bw._parseBindings = function(str) {
  var results = [];
  var re = /\$\{([^}]+)\}/g;
  var match;
  while ((match = re.exec(str)) !== null) {
    results.push({ start: match.index, end: match.index + match[0].length, expr: match[1].trim() });
  }
  return results;
};

/**
 * Evaluate a dot-path on a state object. Returns empty string for null/undefined.
 * @private
 */
bw._evaluatePath = function(state, path) {
  var parts = path.split('.');
  var val = state;
  for (var i = 0; i < parts.length; i++) {
    if (val == null) {
      if (bw.debug) _cw('bw.debug: _evaluatePath — null at key "' + parts[i] + '" in path "' + path + '"');
      return '';
    }
    val = val[parts[i]];
  }
  return (val == null) ? '' : val;
};

/**
 * Resolve all `${expr}` bindings in a template string against a state object.
 *
 * Tier 1 (default): dot-path lookup only (CSP-safe).
 * Tier 2 (compile=true): uses new Function for complex expressions.
 *
 * @param {string} str - Template string
 * @param {Object} state - State object
 * @param {boolean} [compile=false] - Use Tier 2 evaluation
 * @returns {string} Resolved string
 * @private
 */
bw._compiledExprs = {};
bw._resolveTemplate = function(str, state, compile) {
  if (!_is(str, 'string') || str.indexOf('${') < 0) return str;
  var bindings = bw._parseBindings(str);
  if (bindings.length === 0) return str;

  var result = '';
  var lastEnd = 0;
  for (var i = 0; i < bindings.length; i++) {
    var b = bindings[i];
    result += str.slice(lastEnd, b.start);
    var val;
    if (compile) {
      // Tier 2: new Function evaluator (cached)
      if (!bw._compiledExprs[b.expr]) {
        try {
          bw._compiledExprs[b.expr] = new Function('state', 'with(state){return (' + b.expr + ');}');
        } catch (e) {
          bw._compiledExprs[b.expr] = function() { return ''; };
        }
      }
      try {
        val = bw._compiledExprs[b.expr](state);
      } catch (e) {
        if (bw.debug) _cw('bw.debug: _resolveTemplate — Tier 2 eval failed for "${' + b.expr + '}":', e.message);
        val = '';
      }
    } else {
      // Tier 1: dot-path only
      val = bw._evaluatePath(state, b.expr);
    }
    result += (val == null) ? '' : String(val);
    lastEnd = b.end;
  }
  result += str.slice(lastEnd);
  return result;
};

/**
 * Extract top-level state keys that an expression depends on.
 * @param {string} expr - Expression string
 * @param {string[]} stateKeys - Declared state keys
 * @returns {string[]} Matching dependency keys
 * @private
 */
bw._extractDeps = function(expr, stateKeys) {
  var deps = [];
  for (var i = 0; i < stateKeys.length; i++) {
    var key = stateKeys[i];
    // Match word boundary: key must be preceded by start/non-word and followed by non-word/end
    var re = new RegExp('(?:^|[^\\w$.])' + key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?:[^\\w$]|$)');
    if (re.test(expr) || expr === key || expr.indexOf(key + '.') === 0) {
      deps.push(key);
    }
  }
  return deps;
};

// ===================================================================================
// Microtask Batching
// ===================================================================================

bw._dirtyComponents = [];
bw._flushScheduled = false;

/**
 * Schedule a microtask flush for dirty components.
 * @private
 */
bw._scheduleFlush = function() {
  if (bw._flushScheduled) return;
  bw._flushScheduled = true;
  if (typeof Promise !== 'undefined') {
    Promise.resolve().then(bw._doFlush);
  } else {
    setTimeout(bw._doFlush, 0);
  }
};

/**
 * Flush all dirty components. Deduplicates by _bwId.
 * @private
 */
bw._doFlush = function() {
  bw._flushScheduled = false;
  var queue = bw._dirtyComponents.slice();
  bw._dirtyComponents = [];
  // Deduplicate by _bwId
  var seen = {};
  for (var i = 0; i < queue.length; i++) {
    var comp = queue[i];
    if (!seen[comp._bwId]) {
      seen[comp._bwId] = true;
      comp._flush();
    }
  }
};

/**
 * Synchronous flush for testing and imperative code.
 * Forces immediate re-render of all dirty components.
 *
 * @category Component
 */
bw.flush = function() {
  bw._doFlush();
};

// ===================================================================================
// ComponentHandle — unified reactive component (Phase 1)
// ===================================================================================

/**
 * ComponentHandle constructor.
 * Wraps a TACO definition with reactive state, lifecycle hooks,
 * template bindings, and named actions.
 *
 * @param {Object} taco - TACO definition {t, a, c, o}
 * @constructor
 * @private
 */
function ComponentHandle(taco) {
  this._bwComponent = true;         // duck-type marker
  this._bwId = bw.uuid('comp');
  this.taco = taco;
  this.element = null;
  this.mounted = false;

  var o = taco.o || {};
  // Copy initial state
  this._state = {};
  if (o.state) {
    for (var k in o.state) {
      if (_hop.call(o.state, k)) {
        this._state[k] = o.state[k];
      }
    }
  }
  // Copy actions
  this._actions = {};
  if (o.actions) {
    for (var k2 in o.actions) {
      if (_hop.call(o.actions, k2)) {
        this._actions[k2] = o.actions[k2];
      }
    }
  }
  // Promote o.methods to handle API (MFC/Qt pattern: component owns its methods)
  this._methods = {};
  if (o.methods) {
    var self = this;
    for (var k3 in o.methods) {
      if (_hop.call(o.methods, k3)) {
        this._methods[k3] = o.methods[k3];
        (function(methodName, methodFn) {
          self[methodName] = function() {
            var args = [self].concat(Array.prototype.slice.call(arguments));
            return methodFn.apply(null, args);
          };
        })(k3, o.methods[k3]);
      }
    }
  }
  // User tag for addressing via bw.message()
  this._userTag = null;
  // Lifecycle hooks
  this._hooks = {
    willMount: o.willMount || null,
    mounted: o.mounted || null,
    willUpdate: o.willUpdate || null,
    onUpdate: o.onUpdate || o.updated || null,
    unmount: o.unmount || null,
    willDestroy: o.willDestroy || null
  };
  // Binding tracking
  this._bindings = [];
  this._dirtyKeys = {};
  this._scheduled = false;
  this._subs = [];
  this._eventListeners = [];
  this._registeredActions = [];
  this._prevValues = {};
  this._compile = !!o.compile;
  this._bw_refs = {};
  this._refCounter = 0;
  // Child component ownership (Bug #5)
  this._children = [];
  this._parent = null;
  // Factory metadata for BCCL rebuild (Bug #6)
  this._factory = taco._bwFactory || null;
}

// Short alias for ComponentHandle.prototype (see alias block at top of file).
// 28 method definitions × 25 chars = ~700B raw savings in minified output.
var _chp = ComponentHandle.prototype;

// ── State Methods ──

/**
 * Get a state value. Dot-path supported: `get('user.name')`
 */
_chp.get = function(key) {
  return bw._evaluatePath(this._state, key);
};

/**
 * Set a state value. Dot-path supported. Schedules re-render.
 * @param {string} key - State key (dot-path)
 * @param {*} value - New value
 * @param {Object} [opts] - Options. `{sync: true}` for immediate flush.
 */
_chp.set = function(key, value, opts) {
  // Dot-path set
  var parts = key.split('.');
  var obj = this._state;
  for (var i = 0; i < parts.length - 1; i++) {
    if (!_is(obj[parts[i]], 'object')) {
      if (bw.debug) _cw('bw.debug: set() — auto-creating intermediate "' + parts[i] + '" in path "' + key + '"');
      obj[parts[i]] = {};
    }
    obj = obj[parts[i]];
  }
  obj[parts[parts.length - 1]] = value;
  // Mark top-level key dirty
  this._dirtyKeys[parts[0]] = true;
  if (this.mounted) {
    if (opts && opts.sync) {
      this._flush();
    } else {
      this._scheduleDirty();
    }
  }
};

/**
 * Get a shallow clone of the full state.
 */
_chp.getState = function() {
  var clone = {};
  for (var k in this._state) {
    if (_hop.call(this._state, k)) {
      clone[k] = this._state[k];
    }
  }
  return clone;
};

/**
 * Merge multiple state keys. Schedules re-render.
 * @param {Object} updates - Key-value pairs to merge
 * @param {Object} [opts] - Options. `{sync: true}` for immediate flush.
 */
_chp.setState = function(updates, opts) {
  for (var k in updates) {
    if (_hop.call(updates, k)) {
      this._state[k] = updates[k];
      this._dirtyKeys[k] = true;
    }
  }
  if (this.mounted) {
    if (opts && opts.sync) {
      this._flush();
    } else {
      this._scheduleDirty();
    }
  }
};

/**
 * Push a value onto an array in state. Clones the array.
 */
_chp.push = function(key, val) {
  var arr = this.get(key);
  var newArr = _isA(arr) ? arr.slice() : [];
  newArr.push(val);
  this.set(key, newArr);
};

/**
 * Splice an array in state. Clones the array.
 */
_chp.splice = function(key, start, deleteCount) {
  var arr = this.get(key);
  var newArr = _isA(arr) ? arr.slice() : [];
  var args = [start, deleteCount].concat(Array.prototype.slice.call(arguments, 3));
  Array.prototype.splice.apply(newArr, args);
  this.set(key, newArr);
};

// ── Scheduling ──

_chp._scheduleDirty = function() {
  if (!this._scheduled) {
    this._scheduled = true;
    bw._dirtyComponents.push(this);
    bw._scheduleFlush();
  }
};

// ── Binding Compilation ──

/**
 * Walk the TACO tree and extract ${expr} bindings.
 * Creates binding descriptors with refIds for targeted DOM updates.
 * @private
 */
_chp._compileBindings = function() {
  this._bindings = [];
  this._refCounter = 0;
  var stateKeys = _keys(this._state);
  var self = this;

  function walkTaco(taco, path) {
    if (!_is(taco, 'object') || !taco.t) return taco;

    // Check content for bindings
    if (_is(taco.c, 'string') && taco.c.indexOf('${') >= 0) {
      var refId = 'bw_ref_' + self._refCounter++;
      var parsed = bw._parseBindings(taco.c);
      var deps = [];
      for (var j = 0; j < parsed.length; j++) {
        deps = deps.concat(bw._extractDeps(parsed[j].expr, stateKeys));
      }
      self._bindings.push({
        expr: taco.c,
        type: 'content',
        refId: refId,
        deps: deps,
        template: taco.c
      });
      // Inject data-bw_ref on the TACO for createDOM to pick up
      if (!taco.a) taco.a = {};
      taco.a['data-bw_ref'] = refId;
    }

    // Check attributes for bindings
    if (taco.a) {
      for (var attrName in taco.a) {
        if (!_hop.call(taco.a, attrName)) continue;
        if (attrName === 'data-bw_ref') continue;
        var attrVal = taco.a[attrName];
        if (_is(attrVal, 'string') && attrVal.indexOf('${') >= 0) {
          var refId2 = 'bw_ref_' + self._refCounter++;
          var parsed2 = bw._parseBindings(attrVal);
          var deps2 = [];
          for (var j2 = 0; j2 < parsed2.length; j2++) {
            deps2 = deps2.concat(bw._extractDeps(parsed2[j2].expr, stateKeys));
          }
          self._bindings.push({
            expr: attrVal,
            type: 'attribute',
            attrName: attrName,
            refId: refId2,
            deps: deps2,
            template: attrVal
          });
          if (!taco.a) taco.a = {};
          taco.a['data-bw_ref'] = taco.a['data-bw_ref'] || refId2;
          // If multiple attribute bindings on same element, store additional marker
          if (taco.a['data-bw_ref'] !== refId2) {
            taco.a['data-bw_ref_' + attrName] = refId2;
          }
        }
      }
    }

    // Recurse into children
    if (_isA(taco.c)) {
      for (var i = 0; i < taco.c.length; i++) {
        // Wrap string children with ${expr} in a span so patches target the span, not the parent
        if (_is(taco.c[i], 'string') && taco.c[i].indexOf('${') >= 0) {
          var mixedRefId = 'bw_ref_' + self._refCounter++;
          var mixedParsed = bw._parseBindings(taco.c[i]);
          var mixedDeps = [];
          for (var mi = 0; mi < mixedParsed.length; mi++) {
            mixedDeps = mixedDeps.concat(bw._extractDeps(mixedParsed[mi].expr, stateKeys));
          }
          self._bindings.push({
            expr: taco.c[i],
            type: 'content',
            refId: mixedRefId,
            deps: mixedDeps,
            template: taco.c[i]
          });
          // Replace string with a span wrapper so textContent targets the span only
          taco.c[i] = { t: 'span', a: { 'data-bw_ref': mixedRefId, style: 'display:contents' }, c: taco.c[i] };
        }
        if (_is(taco.c[i], 'object') && taco.c[i].t) {
          walkTaco(taco.c[i], path.concat(i));
        }
        // Handle bw.when/bw.each markers
        if (taco.c[i] && taco.c[i]._bwWhen) {
          var whenRefId = 'bw_ref_' + self._refCounter++;
          var whenDeps = bw._extractDeps(taco.c[i].expr.replace(/^\$\{|\}$/g, ''), stateKeys);
          self._bindings.push({
            expr: taco.c[i].expr,
            type: 'structural',
            subtype: 'when',
            refId: whenRefId,
            deps: whenDeps,
            branches: taco.c[i].branches,
            index: i,
            parentPath: path
          });
          taco.c[i]._refId = whenRefId;
        }
        if (taco.c[i] && taco.c[i]._bwEach) {
          var eachRefId = 'bw_ref_' + self._refCounter++;
          var eachDeps = bw._extractDeps(taco.c[i].expr.replace(/^\$\{|\}$/g, ''), stateKeys);
          self._bindings.push({
            expr: taco.c[i].expr,
            type: 'structural',
            subtype: 'each',
            refId: eachRefId,
            deps: eachDeps,
            factory: taco.c[i].factory,
            index: i,
            parentPath: path
          });
          taco.c[i]._refId = eachRefId;
        }
      }
    } else if (_is(taco.c, 'object') && taco.c.t) {
      walkTaco(taco.c, path.concat(0));
    }

    return taco;
  }

  walkTaco(this.taco, []);
};

// ── DOM Reference Collection ──

/**
 * Build ref map from the live DOM after createDOM.
 * @private
 */
_chp._collectRefs = function() {
  this._bw_refs = {};
  if (!this.element) return;
  var els = this.element.querySelectorAll('[data-bw_ref]');
  for (var i = 0; i < els.length; i++) {
    this._bw_refs[els[i].getAttribute('data-bw_ref')] = els[i];
  }
  // Also check root element
  var rootRef = this.element.getAttribute && this.element.getAttribute('data-bw_ref');
  if (rootRef) {
    this._bw_refs[rootRef] = this.element;
  }
};

// ── Lifecycle ──

/**
 * Mount the component into a parent DOM element.
 * Creates DOM, compiles bindings, registers actions, and calls lifecycle hooks.
 * @param {Element} parentEl - DOM element to mount into
 */
_chp.mount = function(parentEl) {
  // willMount hook
  if (this._hooks.willMount) this._hooks.willMount(this);

  // Save original TACO for re-renders (structural changes clone from this)
  if (!this._originalTaco) {
    this._originalTaco = this.taco;
  }

  // Deep-clone TACO so binding annotations don't mutate original.
  // Custom clone to preserve _bwWhen/_bwEach markers and their factory functions.
  this.taco = this._deepCloneTaco(this._originalTaco);

  // Compile bindings (annotates TACO with data-bw_ref attributes)
  this._compileBindings();

  // Prepare TACO: resolve initial binding values, evaluate when/each
  this._prepareTaco(this.taco);

  // Register named actions in function registry
  var self = this;
  for (var actionName in this._actions) {
    if (_hop.call(this._actions, actionName)) {
      var registeredName = this._bwId + '_' + actionName;
      (function(aName) {
        bw.funcRegister(function(evt) {
          self._actions[aName](self, evt);
        }, registeredName);
      })(actionName);
      this._registeredActions.push(registeredName);
    }
  }

  // Wire action names in onclick etc. to dispatch strings
  this._wireActions(this.taco);

  // Create DOM (strip o before createDOM to prevent double lifecycle)
  var tacoForDOM = this._tacoForDOM(this.taco);
  this.element = bw.createDOM(tacoForDOM);
  this.element._bwComponentHandle = this;
  this.element.setAttribute('data-bw_comp_id', this._bwId);

  // Restore o.render from original TACO (stripped by _tacoForDOM)
  if (this.taco.o && this.taco.o.render) {
    this.element._bw_render = this.taco.o.render;
  }
  if (this._userTag) {
    this.element.classList.add(this._userTag);
  }

  // Append to parent
  parentEl.appendChild(this.element);

  // Collect refs from live DOM
  this._collectRefs();

  // Resolve initial bindings and apply to DOM
  this._resolveAndApplyAll();

  this.mounted = true;

  // Scan for child ComponentHandles and link parent/child (Bug #5)
  var childEls = this.element.querySelectorAll('[data-bw_comp_id]');
  for (var ci = 0; ci < childEls.length; ci++) {
    var ch = childEls[ci]._bwComponentHandle;
    if (ch && ch !== this && !ch._parent) {
      ch._parent = this;
      this._children.push(ch);
    }
  }

  // mounted hook (backward compat: fn.length === 2 wraps (el, state))
  if (this._hooks.mounted) {
    if (this._hooks.mounted.length === 2) {
      this._hooks.mounted(this.element, this.getState());
    } else {
      this._hooks.mounted(this);
    }
  }

  // Invoke o.render on initial mount (if present)
  if (this.element._bw_render) {
    this.element._bw_render(this.element, this._state);
  }
};

/**
 * Prepare TACO for initial render: resolve when/each markers.
 * @private
 */
_chp._prepareTaco = function(taco) {
  if (!_is(taco, 'object')) return;

  if (_isA(taco.c)) {
    for (var i = taco.c.length - 1; i >= 0; i--) {
      var child = taco.c[i];
      if (child && child._bwWhen) {
        var exprStr = child.expr.replace(/^\$\{|\}$/g, '');
        var val;
        if (this._compile) {
          try {
            val = (new Function('state', 'with(state){return (' + exprStr + ');}'))(this._state);
          } catch(e) { val = false; }
        } else {
          val = bw._evaluatePath(this._state, exprStr);
        }
        var branch = val ? child.branches[0] : (child.branches[1] || null);
        if (branch) {
          // Wrap in a container so we can track it
          taco.c[i] = { t: 'span', a: { 'data-bw_when': child._refId, style: 'display:contents' }, c: branch };
        } else {
          taco.c[i] = { t: 'span', a: { 'data-bw_when': child._refId, style: 'display:contents' }, c: '' };
        }
      }
      if (child && child._bwEach) {
        var eachExprStr = child.expr.replace(/^\$\{|\}$/g, '');
        var arr = bw._evaluatePath(this._state, eachExprStr);
        var items = [];
        if (_isA(arr)) {
          for (var j = 0; j < arr.length; j++) {
            items.push(child.factory(arr[j], j));
          }
        }
        taco.c[i] = { t: 'span', a: { 'data-bw_each': child._refId, style: 'display:contents' }, c: items };
      }
      if (_is(taco.c[i], 'object') && taco.c[i].t) {
        this._prepareTaco(taco.c[i]);
      }
    }
  } else if (_is(taco.c, 'object') && taco.c.t) {
    this._prepareTaco(taco.c);
  }
};

/**
 * Wire action name strings (in onclick etc.) to dispatch function calls.
 * @private
 */
_chp._wireActions = function(taco) {
  if (!_is(taco, 'object') || !taco.t) return;
  if (taco.a) {
    for (var key in taco.a) {
      if (!_hop.call(taco.a, key)) continue;
      if (key.startsWith('on') && _is(taco.a[key], 'string')) {
        var actionName = taco.a[key];
        if (actionName in this._actions) {
          var registeredName = this._bwId + '_' + actionName;
          // Replace string with actual function for createDOM event binding
          (function(rName) {
            taco.a[key] = function(evt) {
              bw.funcGetById(rName)(evt);
            };
          })(registeredName);
        }
      }
    }
  }
  if (_isA(taco.c)) {
    for (var i = 0; i < taco.c.length; i++) {
      this._wireActions(taco.c[i]);
    }
  } else if (_is(taco.c, 'object') && taco.c.t) {
    this._wireActions(taco.c);
  }
};

/**
 * Deep-clone a TACO tree, preserving _bwWhen/_bwEach markers and their factories.
 * @private
 */
_chp._deepCloneTaco = function(taco) {
  if (taco == null) return taco;
  // Preserve _bwWhen / _bwEach markers (contain functions)
  if (taco._bwWhen) {
    return { _bwWhen: true, expr: taco.expr, branches: [
      this._deepCloneTaco(taco.branches[0]),
      taco.branches[1] ? this._deepCloneTaco(taco.branches[1]) : null
    ], _refId: taco._refId };
  }
  if (taco._bwEach) {
    return { _bwEach: true, expr: taco.expr, factory: taco.factory, _refId: taco._refId };
  }
  if (!_is(taco, 'object') || !taco.t) return taco;
  var result = { t: taco.t };
  if (taco.a) {
    result.a = {};
    for (var k in taco.a) {
      if (_hop.call(taco.a, k)) result.a[k] = taco.a[k];
    }
  }
  if (taco.c != null) {
    if (_isA(taco.c)) {
      result.c = taco.c.map(function(child) { return this._deepCloneTaco(child); }.bind(this));
    } else if (_is(taco.c, 'object')) {
      result.c = this._deepCloneTaco(taco.c);
    } else {
      result.c = taco.c;
    }
  }
  if (taco.o) result.o = taco.o; // Keep o reference (not deep-cloned; hooks are functions)
  return result;
};

/**
 * Create a copy of TACO suitable for createDOM (strips o to prevent double lifecycle).
 * @private
 */
_chp._tacoForDOM = function(taco) {
  if (!_is(taco, 'object') || !taco.t) return taco;
  var result = { t: taco.t };
  if (taco.a) result.a = taco.a;
  if (taco.c != null) {
    if (_isA(taco.c)) {
      result.c = taco.c.map(function(child) { return this._tacoForDOM(child); }.bind(this));
    } else if (_is(taco.c, 'object') && taco.c.t) {
      result.c = this._tacoForDOM(taco.c);
    } else {
      result.c = taco.c;
    }
  }
  // Intentionally strip o (no mounted/unmount/state/render on sub-elements)
  if (taco.o && (taco.o.mounted || taco.o.render || taco.o.unmount)) {
    _cw('bw: _tacoForDOM stripped o.mounted/render/unmount from child <' + taco.t +
      '>. Use onclick attribute or bw.component() for child interactivity.');
  }
  return result;
};

/**
 * Unmount: remove from DOM, deactivate, preserve state for re-mount.
 */
_chp.unmount = function() {
  if (!this.mounted) return;

  // unmount hook
  if (this._hooks.unmount) {
    this._hooks.unmount(this);
  }

  // Remove DOM event listeners
  for (var i = 0; i < this._eventListeners.length; i++) {
    var l = this._eventListeners[i];
    if (this.element) {
      this.element.removeEventListener(l.event, l.handler);
    }
  }
  this._eventListeners = [];

  // Unsubscribe pub/sub
  for (var j = 0; j < this._subs.length; j++) {
    this._subs[j]();
  }
  this._subs = [];

  // Remove from DOM
  if (this.element && this.element.parentNode) {
    this.element.parentNode.removeChild(this.element);
  }

  this.mounted = false;
  // State preserved — can re-mount
};

/**
 * Destroy: unmount + clear state + unregister actions.
 */
_chp.destroy = function() {
  // willDestroy hook
  if (this._hooks.willDestroy) {
    this._hooks.willDestroy(this);
  }

  // Cascade destroy to children depth-first (Bug #5)
  for (var ci = this._children.length - 1; ci >= 0; ci--) {
    this._children[ci].destroy();
  }
  this._children = [];
  if (this._parent) {
    var idx = this._parent._children.indexOf(this);
    if (idx >= 0) this._parent._children.splice(idx, 1);
    this._parent = null;
  }

  this.unmount();

  // Unregister actions from function registry
  for (var i = 0; i < this._registeredActions.length; i++) {
    bw.funcUnregister(this._registeredActions[i]);
  }
  this._registeredActions = [];

  // Clear state
  this._state = {};
  this._bindings = [];
  this._bw_refs = {};
  this._prevValues = {};
  this._dirtyKeys = {};
  if (this.element) {
    delete this.element._bwComponentHandle;
    this.element = null;
  }
};

// ── Flush & Binding Resolution ──

/**
 * Flush dirty state: resolve changed bindings and apply to DOM.
 * @private
 */
_chp._flush = function() {
  this._scheduled = false;
  var changedKeys = _keys(this._dirtyKeys);
  this._dirtyKeys = {};
  if (changedKeys.length === 0 || !this.mounted) return;

  // Factory rebuild: if a BCCL factory exists and changed keys overlap factory props,
  // rebuild the TACO from the factory with merged state (Bug #6)
  if (this._factory) {
    var rebuildNeeded = false;
    for (var fi = 0; fi < changedKeys.length; fi++) {
      if (_hop.call(this._factory.props, changedKeys[fi])) {
        rebuildNeeded = true; break;
      }
    }
    if (rebuildNeeded) {
      var merged = {};
      for (var mk in this._factory.props) if (_hop.call(this._factory.props, mk)) merged[mk] = this._factory.props[mk];
      for (var sk in this._state) if (_hop.call(this._state, sk)) merged[sk] = this._state[sk];
      this._factory.props = merged;
      var newTaco = bw.make(this._factory.type, merged);
      newTaco._bwFactory = this._factory;
      this.taco = newTaco;
      this._originalTaco = this._deepCloneTaco(newTaco);
      this._render();
      if (this._hooks.onUpdate) this._hooks.onUpdate(this, changedKeys);
      return;
    }
  }

  // willUpdate hook
  if (this._hooks.willUpdate) {
    this._hooks.willUpdate(this, changedKeys);
  }

  // Check if any structural bindings are affected
  var needsFullRender = false;
  for (var i = 0; i < this._bindings.length; i++) {
    var b = this._bindings[i];
    if (b.type === 'structural') {
      for (var j = 0; j < b.deps.length; j++) {
        if (changedKeys.indexOf(b.deps[j]) >= 0) {
          needsFullRender = true;
          break;
        }
      }
      if (needsFullRender) break;
    }
  }

  if (needsFullRender) {
    this._render();
  } else {
    var patches = this._resolveBindings(changedKeys);
    this._applyPatches(patches);
  }

  // onUpdate hook
  if (this._hooks.onUpdate) {
    this._hooks.onUpdate(this, changedKeys);
  }
};

/**
 * Resolve bindings whose deps intersect with changedKeys.
 * Returns list of patches to apply.
 * @private
 */
_chp._resolveBindings = function(changedKeys) {
  var patches = [];
  for (var i = 0; i < this._bindings.length; i++) {
    var b = this._bindings[i];
    if (b.type === 'structural') continue;

    // Check if any dep matches
    var affected = false;
    for (var j = 0; j < b.deps.length; j++) {
      if (changedKeys.indexOf(b.deps[j]) >= 0) {
        affected = true;
        break;
      }
    }
    if (!affected) continue;

    // Evaluate
    var newVal = bw._resolveTemplate(b.template, this._state, this._compile);
    var prevKey = b.refId + '_' + (b.attrName || 'content');
    if (this._prevValues[prevKey] !== newVal) {
      this._prevValues[prevKey] = newVal;
      patches.push({
        refId: b.refId,
        type: b.type,
        attrName: b.attrName,
        value: newVal
      });
    }
  }
  return patches;
};

/**
 * Apply patches to DOM.
 * @private
 */
_chp._applyPatches = function(patches) {
  for (var i = 0; i < patches.length; i++) {
    var p = patches[i];
    var el = this._bw_refs[p.refId];
    if (!el) {
      if (bw.debug) _cw('bw.debug: _applyPatches — ref "' + p.refId + '" not found in DOM');
      continue;
    }
    if (p.type === 'content') {
      el.textContent = p.value;
    } else if (p.type === 'attribute') {
      if (p.attrName === 'class') {
        el.className = p.value;
      } else {
        el.setAttribute(p.attrName, p.value);
      }
    }
  }
};

/**
 * Resolve all bindings and apply (used for initial render).
 * @private
 */
_chp._resolveAndApplyAll = function() {
  var patches = [];
  for (var i = 0; i < this._bindings.length; i++) {
    var b = this._bindings[i];
    if (b.type === 'structural') continue;

    var newVal = bw._resolveTemplate(b.template, this._state, this._compile);
    var prevKey = b.refId + '_' + (b.attrName || 'content');
    this._prevValues[prevKey] = newVal;
    patches.push({
      refId: b.refId,
      type: b.type,
      attrName: b.attrName,
      value: newVal
    });
  }
  this._applyPatches(patches);
};

/**
 * Full re-render for structural changes (when/each branch switches).
 * @private
 */
_chp._render = function() {
  if (!this.element || !this.element.parentNode) return;
  var parent = this.element.parentNode;
  var nextSibling = this.element.nextSibling;

  // Remove old DOM
  parent.removeChild(this.element);

  // Re-prepare TACO with current state (deep clone preserving functions)
  this.taco = this._deepCloneTaco(this._originalTaco || this.taco);

  // Re-compile bindings and prepare
  this._compileBindings();
  this._prepareTaco(this.taco);
  this._wireActions(this.taco);

  var tacoForDOM = this._tacoForDOM(this.taco);
  this.element = bw.createDOM(tacoForDOM);
  this.element._bwComponentHandle = this;
  this.element.setAttribute('data-bw_comp_id', this._bwId);

  // Re-insert at same position
  if (nextSibling) {
    parent.insertBefore(this.element, nextSibling);
  } else {
    parent.appendChild(this.element);
  }

  // Re-collect refs and apply all bindings
  this._collectRefs();
  this._resolveAndApplyAll();
};

// ── Event & Pub/Sub Methods ──

/**
 * Add a DOM event listener on the component's root element.
 * @param {string} event - Event name (e.g., 'click')
 * @param {Function} handler - Event handler
 */
_chp.on = function(event, handler) {
  if (this.element) {
    this.element.addEventListener(event, handler);
  }
  this._eventListeners.push({ event: event, handler: handler });
};

/**
 * Remove a DOM event listener.
 * @param {string} event - Event name
 * @param {Function} handler - Handler to remove
 */
_chp.off = function(event, handler) {
  if (this.element) {
    this.element.removeEventListener(event, handler);
  }
  this._eventListeners = this._eventListeners.filter(function(l) {
    return !(l.event === event && l.handler === handler);
  });
};

/**
 * Subscribe to a pub/sub topic. Lifecycle-tied: auto-unsubs on destroy.
 * @param {string} topic - Topic name
 * @param {Function} handler - Handler function
 * @returns {Function} Unsubscribe function
 */
_chp.sub = function(topic, handler) {
  var unsub = bw.sub(topic, handler);
  this._subs.push(unsub);
  return unsub;
};

/**
 * Call a named action.
 * @param {string} name - Action name
 * @param {...*} args - Arguments passed after comp
 */
_chp.action = function(name) {
  var fn = this._actions[name];
  if (!fn) {
    _cw('ComponentHandle.action: unknown action "' + name + '"');
    return;
  }
  var args = [this].concat(Array.prototype.slice.call(arguments, 1));
  return fn.apply(null, args);
};

/**
 * querySelector within the component's DOM.
 * @param {string} sel - CSS selector
 * @returns {Element|null}
 */
_chp.select = function(sel) {
  return this.element ? this.element.querySelector(sel) : null;
};

/**
 * querySelectorAll within the component's DOM.
 * @param {string} sel - CSS selector
 * @returns {Element[]}
 */
_chp.selectAll = function(sel) {
  if (!this.element) return [];
  return Array.prototype.slice.call(this.element.querySelectorAll(sel));
};

/**
 * Tag this component with a user-defined ID for addressing via bw.message().
 * The tag is added as a CSS class on the root element (DOM IS the registry).
 * @param {string} tag - User-defined identifier (e.g. 'dashboard_prod_east')
 * @returns {ComponentHandle} this (for chaining)
 */
_chp.userTag = function(tag) {
  this._userTag = tag;
  if (this.element) {
    this.element.classList.add(tag);
  }
  return this;
};

// Expose ComponentHandle on bw (for testing and advanced use)
bw._ComponentHandle = ComponentHandle;

// ===================================================================================
// Control Flow Helpers
// ===================================================================================

/**
 * Conditional rendering helper.
 * Returns a marker object that ComponentHandle detects during binding compilation.
 * In static contexts (bw.html with state), evaluates immediately.
 *
 * @param {string} expr - Expression string like '${loggedIn}'
 * @param {Object} tacoTrue - TACO to render when truthy
 * @param {Object} [tacoFalse] - TACO to render when falsy
 * @returns {Object} Marker object with _bwWhen flag
 * @category Component
 */
bw.when = function(expr, tacoTrue, tacoFalse) {
  return { _bwWhen: true, expr: expr, branches: [tacoTrue, tacoFalse || null] };
};

/**
 * List rendering helper.
 * Returns a marker object that ComponentHandle detects during binding compilation.
 *
 * @param {string} expr - Expression string like '${items}'
 * @param {Function} fn - Factory function(item, index) returning TACO
 * @returns {Object} Marker object with _bwEach flag
 * @category Component
 */
bw.each = function(expr, fn) {
  return { _bwEach: true, expr: expr, factory: fn };
};

// ===================================================================================
// bw.component() — Factory for ComponentHandle
// ===================================================================================

/**
 * Create a ComponentHandle from a TACO definition.
 * The returned handle has .get(), .set(), .mount(), .destroy(), etc.
 *
 * @param {Object} taco - TACO definition with {t, a, c, o}
 * @returns {ComponentHandle} Reactive component handle
 * @category Component
 * @see bw.DOM
 * @example
 * var counter = bw.component({
 *   t: 'div', c: [{ t: 'h3', c: 'Count: ${count}' }],
 *   o: { state: { count: 0 } }
 * });
 * bw.DOM('#app', counter);
 * counter.set('count', 42); // DOM auto-updates
 */
bw.component = function(taco) {
  return new ComponentHandle(taco);
};

// ===================================================================================
// bw.message() — SendMessage() for the web
// ===================================================================================

/**
 * Dispatch a message to a component by UUID or user tag.
 * Finds the component's DOM element, looks up its ComponentHandle,
 * and calls the named method. This is the bitwrench equivalent of
 * Win32 SendMessage(hwnd, msg, wParam, lParam).
 *
 * @param {string} target - Component UUID (bw_uuid_*), comp ID (data-bw_comp_id), or user tag (CSS class)
 * @param {string} action - Method name to call on the component
 * @param {*} data - Data to pass to the method
 * @returns {boolean} True if message was dispatched successfully
 * @category Component
 * @example
 * // Tag a component
 * myDash.userTag('dashboard_prod');
 * // Dispatch locally
 * bw.message('dashboard_prod', 'addAlert', { severity: 'warning', text: 'CPU spike' });
 * // Or from SSE handler:
 * es.onmessage = function(e) {
 *   var msg = JSON.parse(e.data);
 *   bw.message(msg.target, msg.action, msg.data);
 * };
 */
bw.message = function(target, action, data) {
  // Try bw._el() first (handles UUID class, nodeMap cache, getElementById)
  var el = bw._el(target);
  // Then try data-bw_comp_id attribute
  if (!el || !el._bwComponentHandle) {
    el = bw.$('[data-bw_comp_id="' + target + '"]')[0];
  }
  // Then try CSS class (user tag)
  if (!el || !el._bwComponentHandle) {
    el = bw.$('.' + target)[0];
  }
  if (!el || !el._bwComponentHandle) return false;
  var comp = el._bwComponentHandle;
  if (!_is(comp[action], 'function')) {
    _cw('bw.message: unknown action "' + action + '" on component ' + target);
    return false;
  }
  comp[action](data);
  return true;
};

// ===================================================================================
// bw.apply() / bw.parseJSONFlex() — Server-driven UI protocol
// ===================================================================================

/**
 * Registry of named functions sent via register messages.
 * Populated by bw.apply({ type: 'register', name, body }).
 * Invoked by bw.apply({ type: 'call', name, args }).
 * @private
 */
bw._clientFunctions = {};

/**
 * Whether exec messages are allowed. Set by bwclient connect opts.allowExec.
 * Default false — exec messages are rejected unless explicitly opted in.
 * @private
 */
bw._allowExec = false;

/**
 * Parse a bwserve protocol message string, supporting both strict JSON
 * and r-prefixed relaxed JSON (single-quoted strings, trailing commas).
 *
 * The r-prefix format is designed for C/C++ string literals where
 * double-quote escaping is painful. The parser is a state machine
 * that walks character by character — not a regex replace.
 *
 * Escaping: apostrophes inside single-quoted values must be escaped
 * with backslash: r{'name':'Barry\'s room'}
 *
 * @param {string} str - JSON or r-prefixed relaxed JSON string
 * @returns {Object} Parsed message object
 * @throws {SyntaxError} If the string is not valid JSON or relaxed JSON
 * @category Core
 */
bw.parseJSONFlex = function(str) {
  str = (str || '').trim();
  if (str.charAt(0) !== 'r') return JSON.parse(str);
  str = str.slice(1);

  var out = [];
  var i = 0;
  var len = str.length;

  while (i < len) {
    var ch = str[i];

    if (ch === "'") {
      // Single-quoted string → emit as double-quoted
      out.push('"');
      i++;
      while (i < len) {
        var c = str[i];
        if (c === '\\' && i + 1 < len) {
          var next = str[i + 1];
          if (next === "'") {
            out.push("'");     // \' in input → ' in output
          } else {
            out.push('\\');
            out.push(next);
          }
          i += 2;
        } else if (c === '"') {
          out.push('\\"');
          i++;
        } else if (c === "'") {
          break;
        } else {
          out.push(c);
          i++;
        }
      }
      out.push('"');
      i++; // skip closing '

    } else if (ch === '"') {
      // Double-quoted string — pass through verbatim
      out.push(ch);
      i++;
      while (i < len) {
        var c2 = str[i];
        if (c2 === '\\' && i + 1 < len) {
          out.push(c2);
          out.push(str[i + 1]);
          i += 2;
        } else {
          out.push(c2);
          i++;
          if (c2 === '"') break;
        }
      }

    } else if (ch === ',') {
      // Trailing comma check: skip comma if next non-whitespace is } or ]
      var j = i + 1;
      while (j < len && (str[j] === ' ' || str[j] === '\t' || str[j] === '\n' || str[j] === '\r')) j++;
      if (j < len && (str[j] === '}' || str[j] === ']')) {
        i++; // skip trailing comma
      } else {
        out.push(ch);
        i++;
      }

    } else {
      out.push(ch);
      i++;
    }
  }

  return JSON.parse(out.join(''));
};

/**
 * Apply a bwserve protocol message to the DOM.
 *
 * Dispatches one of 9 message types:
 *   replace  — bw.DOM(target, node)
 *   append   — target.appendChild(bw.createDOM(node))
 *   remove   — bw.cleanup(target); target.remove()
 *   patch    — bw.patch(target, content, attr)
 *   batch    — iterate ops, call bw.apply for each
 *   message  — bw.message(target, action, data)
 *   register — store a named function for later call()
 *   call     — invoke a registered function
 *   exec     — execute arbitrary JS (requires allowExec)
 *
 * Target resolution:
 *   Starts with '#' or '.' → CSS selector (querySelector)
 *   Otherwise → getElementById, then bw._el fallback
 *
 * @param {Object} msg - Protocol message
 * @returns {boolean} true if the message was applied successfully
 * @category Core
 */
bw.apply = function(msg) {
  if (!msg || !msg.type) return false;

  var type = msg.type;
  var target = msg.target;

  if (type === 'replace') {
    var el = bw._el(target);
    if (!el) return false;
    bw.DOM(el, msg.node);
    return true;

  } else if (type === 'patch') {
    var patched = bw.patch(target, msg.content, msg.attr);
    return patched !== null;

  } else if (type === 'append') {
    var parent = bw._el(target);
    if (!parent) return false;
    var child = bw.createDOM(msg.node);
    parent.appendChild(child);
    return true;

  } else if (type === 'remove') {
    var toRemove = bw._el(target);
    if (!toRemove) return false;
    if (_is(bw.cleanup, 'function')) bw.cleanup(toRemove);
    toRemove.remove();
    return true;

  } else if (type === 'batch') {
    if (!_isA(msg.ops)) return false;
    var allOk = true;
    msg.ops.forEach(function(op) {
      if (!bw.apply(op)) allOk = false;
    });
    return allOk;

  } else if (type === 'message') {
    return bw.message(msg.target, msg.action, msg.data);

  } else if (type === 'register') {
    if (!msg.name || !msg.body) return false;
    try {
      bw._clientFunctions[msg.name] = new Function('return ' + msg.body)();
      return true;
    } catch (e) {
      _ce('[bw] register error:', msg.name, e);
      return false;
    }

  } else if (type === 'call') {
    if (!msg.name) return false;
    var fn = bw._clientFunctions[msg.name];
    if (!_is(fn, 'function')) return false;
    try {
      var args = _isA(msg.args) ? msg.args : [];
      fn.apply(null, args);
      return true;
    } catch (e) {
      _ce('[bw] call error:', msg.name, e);
      return false;
    }

  } else if (type === 'exec') {
    if (!bw._allowExec) {
      _cw('[bw] exec rejected: allowExec is not enabled');
      return false;
    }
    if (!msg.code) return false;
    try {
      new Function(msg.code)();
      return true;
    } catch (e) {
      _ce('[bw] exec error:', e);
      return false;
    }
  }

  return false;
};


// ===================================================================================
// bw.inspect() — Debug utility
// ===================================================================================

/**
 * Inspect a component's state, bindings, methods, and metadata.
 * Works with DOM elements, CSS selectors, or ComponentHandle objects.
 * Returns the ComponentHandle for console chaining.
 *
 * @param {string|Element|ComponentHandle} target - Selector, element, or handle
 * @returns {ComponentHandle|null} The component handle, or null if not found
 * @category Component
 * @example
 * // In browser console, click element in Elements panel then:
 * bw.inspect($0);
 * // Or by selector:
 * var h = bw.inspect('#my-dashboard');
 * h.set('count', 99);  // chain from returned handle
 */
bw.inspect = function(target) {
  var el = target;
  var comp;
  if (target && target._bwComponent === true) {
    el = target.element;
    comp = target;
  } else {
    if (_is(target, 'string')) {
      el = bw.$(target)[0];
    }
    if (!el) {
      _cw('bw.inspect: element not found');
      return null;
    }
    comp = el._bwComponentHandle;
  }
  if (!comp) {
    _cl('bw.inspect: no ComponentHandle on this element');
    _cl('  Tag:', el.tagName);
    _cl('  Classes:', el.className);
    _cl('  _bw_state:', el._bw_state || '(none)');
    return null;
  }
  var deps = comp._bindings.reduce(function(s, b) {
    return s.concat(b.deps || []);
  }, []).filter(function(v, i, a) { return a.indexOf(v) === i; });
  console.group('Component: ' + comp._bwId);
  _cl('State:', comp._state);
  _cl('Bindings:', comp._bindings.length, '(deps:', deps, ')');
  _cl('Methods:', _keys(comp._methods));
  _cl('Actions:', _keys(comp._actions));
  _cl('User tag:', comp._userTag || '(none)');
  _cl('Mounted:', comp.mounted);
  _cl('Element:', comp.element);
  console.groupEnd();
  return comp;
};

// ===================================================================================
// bw.compile() — Pre-compile TACO into optimized factory
// ===================================================================================

/**
 * Pre-compile a TACO definition into a factory function.
 * The factory produces ComponentHandles with pre-compiled binding evaluators.
 *
 * Phase 1: validates API surface. Template cloning optimization deferred.
 *
 * @param {Object} taco - TACO definition
 * @returns {Function} Factory function(initialState?) → ComponentHandle
 * @category Component
 */
bw.compile = function(taco) {
  // Pre-extract all binding expressions
  var precompiled = [];
  function walkExpressions(node) {
    if (!_is(node, 'object')) return;
    if (_is(node.c, 'string') && node.c.indexOf('${') >= 0) {
      var parsed = bw._parseBindings(node.c);
      for (var i = 0; i < parsed.length; i++) {
        try {
          precompiled.push({
            expr: parsed[i].expr,
            fn: new Function('state', 'with(state){return (' + parsed[i].expr + ');}')
          });
        } catch(e) {
          precompiled.push({ expr: parsed[i].expr, fn: function() { return ''; } });
        }
      }
    }
    if (node.a) {
      for (var key in node.a) {
        if (_hop.call(node.a, key)) {
          var v = node.a[key];
          if (_is(v, 'string') && v.indexOf('${') >= 0) {
            var parsed2 = bw._parseBindings(v);
            for (var j = 0; j < parsed2.length; j++) {
              try {
                precompiled.push({
                  expr: parsed2[j].expr,
                  fn: new Function('state', 'with(state){return (' + parsed2[j].expr + ');}')
                });
              } catch(e2) {
                precompiled.push({ expr: parsed2[j].expr, fn: function() { return ''; } });
              }
            }
          }
        }
      }
    }
    if (_isA(node.c)) {
      for (var k = 0; k < node.c.length; k++) walkExpressions(node.c[k]);
    } else if (_is(node.c, 'object') && node.c.t) {
      walkExpressions(node.c);
    }
  }
  walkExpressions(taco);

  return function(initialState) {
    var handle = new ComponentHandle(taco);
    handle._compile = true;
    handle._precompiledBindings = precompiled;
    if (initialState) {
      for (var k in initialState) {
        if (_hop.call(initialState, k)) {
          handle._state[k] = initialState[k];
        }
      }
    }
    return handle;
  };
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

  if (_is(rules, 'string')) return rules;

  let css = '';
  const indent = pretty ? '  ' : '';
  const newline = pretty ? '\n' : '';
  const space = pretty ? ' ' : '';

  if (_isA(rules)) {
    css = rules.map(rule => bw.css(rule, options)).join(newline);
  } else if (_is(rules, 'object')) {
    Object.entries(rules).forEach(([selector, styles]) => {
      if (_is(styles, 'object')) {
        // Handle @media, @keyframes, @supports — recurse into nested block
        if (selector.charAt(0) === '@') {
          const inner = bw.css(styles, options);
          if (inner) {
            css += `${selector}${space}{${newline}${inner}${newline}}${newline}`;
          }
          return;
        }
        const declarations = Object.entries(styles)
          .filter(([, value]) => value != null)
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
 * @param {string} [options.id='bw_styles'] - ID for the style element
 * @param {boolean} [options.append=true] - Append to existing CSS (false to replace)
 * @returns {Element} The style element
 * @category CSS & Styling
 * @see bw.css
 * @see bw.loadStyles
 * @example
 * bw.injectCSS('.my-class { color: red; }');
 * bw.injectCSS({ '.card': { padding: '1rem' } }, { id: 'card-styles' });
 */
bw.injectCSS = function(css, options = {}) {
  if (!bw._isBrowser) {
    _cw('bw.injectCSS requires a DOM environment');
    return null;
  }
  
  const { id = 'bw_styles', append = true } = options;
  
  // Get or create style element
  let styleEl = document.getElementById(id);
  
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = id;
    styleEl.type = 'text/css';
    document.head.appendChild(styleEl);
  }
  
  // Convert CSS if needed
  const cssStr = _is(css, 'string') ? css : bw.css(css, options);
  
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
 * @example
 * var style = bw.s({ display: 'flex' }, { gap: '1rem' }, { color: 'red' });
 * // => { display: 'flex', gap: '1rem', color: 'red' }
 */
bw.s = function() {
  var result = {};
  for (var i = 0; i < arguments.length; i++) {
    var arg = arguments[i];
    if (_is(arg, 'object')) Object.assign(result, arg);
  }
  return result;
};

/**
 * Generate responsive CSS with media query breakpoints.
 *
 * Produces a CSS string with `@media (min-width)` rules for standard
 * breakpoints. These match the grid system and theme.breakpoints:
 *   sm: 576px, md: 768px, lg: 992px, xl: 1200px
 * Pass the result to `bw.injectCSS()`.
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
  var sizes = { sm: '576px', md: '768px', lg: '992px', xl: '1200px' };
  var parts = [];
  _keys(breakpoints).forEach(function(key) {
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
bw.mapScale = mapScale;

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
bw.clip = clip;

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
    if (_isA(selector)) return selector;
    
    // Single element
    if (selector.nodeType) return [selector];
    
    // NodeList or HTMLCollection
    if (selector.length !== undefined && !_is(selector, 'string')) {
      return Array.from(selector);
    }
    
    // CSS selector string
    if (_is(selector, 'string')) {
      return Array.from(document.querySelectorAll(selector));
    }
    
    return [];
  };
  
  // Convenience single element selector
  bw.$.one = function(selector) {
    return bw.$(selector)[0] || null;
  };
}


// =========================================================================
// v2.0.18 Clean Styles API — makeStyles / applyStyles / loadStyles / etc.
// =========================================================================

/**
 * Convert a scope selector to a <style> element id.
 * @private
 * @param {string} [scope] - Scope selector (e.g. '#my-dashboard', '.preview')
 * @returns {string} Style element id (e.g. 'bw_style_my_dashboard')
 */
function _scopeToStyleId(scope) {
  if (!scope || scope === '' || scope === 'global') return 'bw_style_global';
  if (scope === 'reset') return 'bw_style_reset';
  // Strip leading # or . and convert - to _
  var clean = scope.replace(/^[#.]/, '').replace(/-/g, '_');
  return 'bw_style_' + clean;
}

/**
 * Generate a complete styles object from seed colors and layout config.
 * Pure function — no DOM, no state, no side effects.
 *
 * All parameters are optional. Defaults to the bitwrench default palette.
 *
 * @param {Object} [config] - Style configuration
 * @param {string} [config.primary='#006666'] - Primary brand color hex
 * @param {string} [config.secondary='#6c757d'] - Secondary color hex
 * @param {string} [config.tertiary] - Tertiary color hex (defaults to primary)
 * @param {string} [config.spacing='normal'] - 'compact' | 'normal' | 'spacious'
 * @param {string} [config.radius='md'] - 'none' | 'sm' | 'md' | 'lg' | 'pill'
 * @returns {Object} { css, alternateCss, rules, alternateRules, palette, alternatePalette, isLightPrimary }
 * @category CSS & Styling
 * @see bw.applyStyles
 * @see bw.loadStyles
 * @example
 * var styles = bw.makeStyles({ primary: '#4f46e5', secondary: '#d97706' });
 * console.log(styles.palette.primary.base); // '#4f46e5'
 * // styles.css contains all themed CSS — nothing injected
 */
bw.makeStyles = function(config) {
  var fullConfig = Object.assign({}, DEFAULT_PALETTE_CONFIG, config || {});
  if (config && !config.tertiary) fullConfig.tertiary = fullConfig.primary;

  // Derive primary palette
  var palette = derivePalette(fullConfig);

  // Resolve layout
  var layout = resolveLayout(fullConfig);

  // Generate primary themed CSS rules (unscoped)
  var themedRules = generateThemedCSS('', palette, layout);
  var cssStr = bw.css(themedRules);

  // Derive alternate palette (luminance-inverted)
  var altConfig = deriveAlternateConfig(fullConfig);
  var altPalette = derivePalette(altConfig);

  // Generate alternate CSS rules WITHOUT .bw_theme_alt prefix (raw rules)
  // applyStyles() wraps them appropriately based on scope
  var altRawRules = generateThemedCSS('', altPalette, layout);

  // Add body-level surface overrides for the alternate palette.
  // When .bw_theme_alt is on <html>, ".bw_theme_alt body" correctly matches.
  altRawRules['body'] = {
    'color': altPalette.dark.base,
    'background-color': altPalette.surface || altPalette.light.base
  };

  var altCssStr = bw.css(altRawRules);

  // Determine if primary is light-flavored
  var lightPrimary = isLightPalette(fullConfig);

  return {
    css: cssStr,
    alternateCss: altCssStr,
    rules: themedRules,
    alternateRules: altRawRules,
    palette: palette,
    alternatePalette: altPalette,
    isLightPrimary: lightPrimary
  };
};

/**
 * Inject styles into the DOM with optional scoping.
 *
 * Takes a styles object from `makeStyles()` and creates a single `<style>`
 * element in `<head>`. If a scope selector is provided, all CSS rules are
 * wrapped under that selector. Alternate CSS is wrapped under `.bw_theme_alt`.
 *
 * @param {Object} styles - Result of `bw.makeStyles()`
 * @param {string} [scope] - Scope selector (e.g. '#my-dashboard', '.preview'). Omit for global.
 * @returns {Element|null} The `<style>` element, or null in Node.js
 * @category CSS & Styling
 * @see bw.makeStyles
 * @see bw.loadStyles
 * @see bw.clearStyles
 * @example
 * var styles = bw.makeStyles({ primary: '#4f46e5' });
 * bw.applyStyles(styles);                     // global
 * bw.applyStyles(styles, '#my-dashboard');     // scoped
 */
bw.applyStyles = function(styles, scope) {
  if (!bw._isBrowser) return null;
  if (!styles || !styles.rules) {
    _cw('bw.applyStyles: invalid styles object');
    return null;
  }

  var styleId = _scopeToStyleId(scope);

  // Scope the primary rules if a scope is provided
  var primaryRules = styles.rules;
  if (scope) {
    primaryRules = scopeRulesUnder(primaryRules, scope);
  }

  // Wrap alternate rules with .bw_theme_alt
  var altRules = styles.alternateRules;
  if (altRules) {
    if (scope) {
      // Scoped compound: #scope.bw_theme_alt .bw_card
      altRules = scopeRulesUnder(altRules, scope + '.bw_theme_alt');
    } else {
      // Global: .bw_theme_alt .bw_card
      altRules = scopeRulesUnder(altRules, '.bw_theme_alt');
    }
  }

  // Combine primary + alternate into one CSS string
  var combined = bw.css(primaryRules);
  if (altRules) {
    combined += '\n' + bw.css(altRules);
  }

  return bw.injectCSS(combined, { id: styleId, append: false });
};

/**
 * Generate and apply styles in one call. Convenience wrapper.
 *
 * Equivalent to: `bw.applyStyles(bw.makeStyles(config), scope)`
 *
 * @param {Object} [config] - Style configuration (same as `makeStyles`)
 * @param {string} [scope] - Scope selector (same as `applyStyles`)
 * @returns {Element|null} The `<style>` element, or null in Node.js
 * @category CSS & Styling
 * @see bw.makeStyles
 * @see bw.applyStyles
 * @example
 * bw.loadStyles();                                          // defaults, global
 * bw.loadStyles({ primary: '#4f46e5' });                    // custom, global
 * bw.loadStyles({ primary: '#4f46e5' }, '#my-dashboard');   // custom, scoped
 */
bw.loadStyles = function(config, scope) {
  // Also inject structural CSS first (only once)
  if (bw._isBrowser) {
    var existing = document.getElementById('bw_structural');
    if (!existing) {
      var structuralCSS = bw.css(getStructuralStyles());
      bw.injectCSS(structuralCSS, { id: 'bw_structural', append: false });
    }
  }
  return bw.applyStyles(bw.makeStyles(config), scope);
};

/**
 * Inject the CSS reset (box-sizing, html/body font, reduced-motion).
 * Idempotent — if already injected, returns the existing `<style>` element.
 *
 * @returns {Element|null} The `<style>` element, or null in Node.js
 * @category CSS & Styling
 * @see bw.loadStyles
 * @see bw.clearStyles
 * @example
 * bw.loadReset();  // inject once, safe to call multiple times
 */
bw.loadReset = function() {
  if (!bw._isBrowser) return null;
  var existing = document.getElementById('bw_style_reset');
  if (existing) return existing;
  return bw.injectCSS(bw.css(getResetStyles()), { id: 'bw_style_reset', append: false });
};

/**
 * Toggle between primary and alternate palettes.
 *
 * Adds/removes the `bw_theme_alt` class on the scoping element.
 * Without a scope, toggles on `<html>` (global).
 * With a scope, toggles on the first matching element.
 *
 * @param {string} [scope] - Scope selector (e.g. '#my-dashboard'). Omit for global.
 * @returns {string} Active mode after toggle: 'primary' or 'alternate'
 * @category CSS & Styling
 * @see bw.applyStyles
 * @see bw.clearStyles
 * @example
 * bw.toggleStyles();                   // global toggle on <html>
 * bw.toggleStyles('#my-dashboard');    // scoped toggle
 */
bw.toggleStyles = function(scope) {
  if (!bw._isBrowser) return 'primary';
  var target;
  if (scope) {
    var els = bw.$(scope);
    target = els[0];
  } else {
    target = document.documentElement;
  }
  if (!target) return 'primary';

  var hasAlt = target.classList.contains('bw_theme_alt');
  if (hasAlt) {
    target.classList.remove('bw_theme_alt');
    return 'primary';
  } else {
    target.classList.add('bw_theme_alt');
    return 'alternate';
  }
};

/**
 * Remove injected styles for a given scope.
 *
 * Finds the `<style>` element by id and removes it. Also removes
 * the `bw_theme_alt` class from the relevant element.
 *
 * @param {string} [scope] - Scope selector. Omit to remove global styles.
 * @category CSS & Styling
 * @see bw.applyStyles
 * @see bw.loadStyles
 * @example
 * bw.clearStyles();                    // remove global styles
 * bw.clearStyles('#my-dashboard');     // remove scoped styles
 * bw.clearStyles('reset');             // remove the CSS reset
 */
bw.clearStyles = function(scope) {
  if (!bw._isBrowser) return;
  var styleId = _scopeToStyleId(scope);
  var el = document.getElementById(styleId);
  if (el) el.remove();

  // Also remove bw_theme_alt from the relevant element
  if (scope && scope !== 'reset' && scope !== 'global') {
    var targets = bw.$(scope);
    if (targets[0]) targets[0].classList.remove('bw_theme_alt');
  } else if (!scope || scope === 'global') {
    document.documentElement.classList.remove('bw_theme_alt');
  }
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
bw.harmonize = harmonize;
bw.deriveAlternateSeed = deriveAlternateSeed;
bw.deriveAlternateConfig = deriveAlternateConfig;
bw.isLightPalette = isLightPalette;

// Expose layout and theme presets
bw.SPACING_PRESETS = SPACING_PRESETS;
bw.RADIUS_PRESETS = RADIUS_PRESETS;
bw.TYPE_RATIO_PRESETS = TYPE_RATIO_PRESETS;
bw.ELEVATION_PRESETS = ELEVATION_PRESETS;
bw.MOTION_PRESETS = MOTION_PRESETS;
bw.generateTypeScale = generateTypeScale;
bw.DEFAULT_PALETTE_CONFIG = DEFAULT_PALETTE_CONFIG;
bw.THEME_PRESETS = THEME_PRESETS;

// ===================================================================================
// Legacy v1 Functions - Useful utilities retained from bitwrench v1
// ===================================================================================

/** @see bitwrench-utils.js for implementation */
bw.choice = choice;
/** @see bitwrench-utils.js for implementation */
bw.arrayUniq = arrayUniq;
/** @see bitwrench-utils.js for implementation */
bw.arrayBinA = arrayBinA;
/** @see bitwrench-utils.js for implementation */
bw.arrayBNotInA = arrayBNotInA;

/** @see bitwrench-utils.js for implementation — wraps _colorInterp with bw.colorParse */
bw.colorInterp = function(x, in0, in1, colors, stretch) {
  return colorInterp(x, in0, in1, colors, stretch, colorParse);
};

// Color conversion functions — imported from bitwrench-color-utils.js (single source of truth)
bw.colorHslToRgb = colorHslToRgb;
bw.colorRgbToHsl = colorRgbToHsl;
bw.colorParse = colorParse;

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


/** @see bitwrench-utils.js for implementation */
bw.loremIpsum = loremIpsum;

/** @see bitwrench-utils.js for implementation */
bw.multiArray = multiArray;
/** @see bitwrench-utils.js for implementation */
bw.naturalCompare = naturalCompare;
/** @see bitwrench-utils.js for implementation */
bw.setIntervalX = setIntervalX;
/** @see bitwrench-utils.js for implementation */
bw.repeatUntil = repeatUntil;

// File I/O — see bitwrench-file-ops.js
bindFileOps(bw);

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
 * Returns a bare `<table>` TACO — no wrapper, title, or responsive scroll.
 * Use this when you need full control over table placement, or when embedding
 * the table inside your own layout. For a ready-to-use table with title,
 * responsive wrapper, and defaults (striped + hover), use `bw.makeDataTable()`.
 *
 * Auto-detects columns from data keys if not specified. Supports click-to-sort
 * headers with ascending/descending indicators.
 *
 * @param {Object} config - Table configuration
 * @param {Array<Object>} config.data - Array of row objects to display
 * @param {Array<Object>} [config.columns] - Column definitions with key, label, render
 * @param {string} [config.className=''] - Additional CSS classes for table element
 * @param {boolean} [config.sortable=true] - Enable click-to-sort headers
 * @param {Function} [config.onSort] - Sort callback (column, direction)
 * @param {boolean} [config.selectable=false] - Enable row selection on click
 * @param {Function} [config.onRowClick] - Row click callback (row, index, event)
 * @param {number} [config.pageSize] - Rows per page (enables pagination when set)
 * @param {number} [config.currentPage=1] - Current page number (1-based)
 * @param {Function} [config.onPageChange] - Page change callback (newPage)
 * @returns {Object} TACO object for table (with optional pagination controls)
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
 *   ],
 *   selectable: true,
 *   onRowClick: function(row, i) { console.log('clicked', row.name); },
 *   pageSize: 10,
 *   currentPage: 1,
 *   onPageChange: function(page) { console.log('page', page); }
 * });
 */
bw.makeTable = function(config) {
  const {
    data = [],
    columns,
    className = '',
    striped = false,
    hover = false,
    sortable = true,
    onSort,
    sortColumn,
    sortDirection = 'asc',
    selectable = false,
    onRowClick,
    pageSize,
    currentPage = 1,
    onPageChange
  } = config;

  // Build class list: always include bw_table, add striped/hover/selectable, append user className
  let cls = 'bw_table';
  if (striped) cls += ' bw_table_striped';
  if (hover || selectable) cls += ' bw_table_hover';
  if (selectable) cls += ' bw_table_selectable';
  if (className) cls += ' ' + className;
  cls = cls.trim();

  // Auto-detect columns if not provided
  const cols = columns || (data.length > 0
    ? _keys(data[0]).map(key => ({ key, label: key }))
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
      if (_is(aVal, 'number') && _is(bVal, 'number')) {
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

  // Pagination
  const totalRows = sortedData.length;
  const totalPages = pageSize ? Math.max(1, Math.ceil(totalRows / pageSize)) : 1;
  const page = Math.max(1, Math.min(currentPage, totalPages));
  if (pageSize) {
    const start = (page - 1) * pageSize;
    sortedData = sortedData.slice(start, start + pageSize);
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

  // Build table body with selectable/onRowClick support
  const tbody = {
    t: 'tbody',
    c: sortedData.map((row, idx) => {
      const globalIdx = pageSize ? (page - 1) * pageSize + idx : idx;
      const rowAttrs = {};
      if (selectable || onRowClick) {
        rowAttrs.style = 'cursor:pointer;';
        rowAttrs.onclick = function(e) {
          if (selectable) {
            // Toggle selected class on this row
            var tr = e.currentTarget;
            tr.classList.toggle('bw_table_row_selected');
          }
          if (onRowClick) {
            onRowClick(row, globalIdx, e);
          }
        };
      }
      return {
        t: 'tr',
        a: rowAttrs,
        c: cols.map(col => ({
          t: 'td',
          c: col.render ? col.render(row[col.key], row) : String(row[col.key] || '')
        }))
      };
    })
  };

  const table = {
    t: 'table',
    a: { class: cls },
    c: [thead, tbody]
  };

  // If no pagination, return table directly
  if (!pageSize) return table;

  // Build pagination controls
  const pageButtons = [];
  // Previous button
  pageButtons.push({
    t: 'button',
    a: {
      class: 'bw_btn bw_btn_sm',
      disabled: page <= 1 ? 'disabled' : undefined,
      onclick: page > 1 && onPageChange ? function() { onPageChange(page - 1); } : undefined
    },
    c: 'Prev'
  });
  // Page info
  pageButtons.push({
    t: 'span',
    a: { style: 'margin:0 0.5rem;font-size:0.875rem;' },
    c: 'Page ' + page + ' of ' + totalPages
  });
  // Next button
  pageButtons.push({
    t: 'button',
    a: {
      class: 'bw_btn bw_btn_sm',
      disabled: page >= totalPages ? 'disabled' : undefined,
      onclick: page < totalPages && onPageChange ? function() { onPageChange(page + 1); } : undefined
    },
    c: 'Next'
  });

  return {
    t: 'div',
    a: { class: 'bw_table_paginated' },
    c: [
      table,
      {
        t: 'div',
        a: { class: 'bw_table_pagination', style: 'display:flex;align-items:center;justify-content:flex-end;padding:0.5rem 0;gap:0.25rem;' },
        c: pageButtons
      }
    ]
  };
};

/**
 * Create a table from a 2D array.
 *
 * Converts a 2D array into the object-array format that `bw.makeTable()`
 * expects, then delegates. By default, the first row is used as column
 * headers. All standard `makeTable` props (striped, hover, sortable,
 * columns, onSort, etc.) are passed through.
 *
 * @param {Object} config - Configuration object
 * @param {Array<Array>} config.data - 2D array of values
 * @param {boolean} [config.headerRow=true] - Treat first row as column headers
 * @param {boolean} [config.striped=false] - Striped rows
 * @param {boolean} [config.hover=false] - Hover highlight
 * @param {boolean} [config.sortable=true] - Enable sort
 * @param {Array<Object>} [config.columns] - Override auto-generated column defs
 * @param {string} [config.className=''] - Additional CSS classes
 * @param {Function} [config.onSort] - Sort callback
 * @param {string} [config.sortColumn] - Currently sorted column key
 * @param {string} [config.sortDirection='asc'] - Sort direction
 * @returns {Object} TACO object for table
 * @category Component Builders
 * @see bw.makeTable
 * @example
 * bw.makeTableFromArray({
 *   data: [
 *     ['Name', 'Role', 'Status'],
 *     ['Alice', 'Engineer', 'Active'],
 *     ['Bob', 'Designer', 'Away']
 *   ],
 *   striped: true,
 *   hover: true
 * });
 */
bw.makeTableFromArray = function(config) {
  const { data = [], headerRow = true, columns, ...rest } = config;

  if (!_isA(data) || data.length === 0) {
    return bw.makeTable({ data: [], columns: columns || [], ...rest });
  }

  // Determine headers
  let headers;
  let rows;
  if (headerRow && data.length > 0) {
    headers = data[0].map(function(h) { return String(h); });
    rows = data.slice(1);
  } else {
    // Generate col0, col1, ... headers
    const width = data[0].length;
    headers = [];
    for (let i = 0; i < width; i++) {
      headers.push('col' + i);
    }
    rows = data;
  }

  // Convert rows to object arrays
  const objData = rows.map(function(row) {
    const obj = {};
    headers.forEach(function(key, i) {
      obj[key] = row[i] !== undefined ? row[i] : '';
    });
    return obj;
  });

  // Auto-generate column defs if not provided
  const cols = columns || headers.map(function(key) {
    return { key: key, label: key };
  });

  return bw.makeTable({ data: objData, columns: cols, ...rest });
};

/**
 * Create a vertical bar chart from data.
 *
 * Renders a pure-CSS bar chart using flexbox and percentage heights.
 * No canvas, SVG, or external charting library required.
 *
 * @param {Object} config - Chart configuration
 * @param {Array<Object>} config.data - Array of data objects
 * @param {string} [config.labelKey='label'] - Key for bar labels
 * @param {string} [config.valueKey='value'] - Key for bar values
 * @param {string} [config.title] - Chart title
 * @param {string} [config.color='#006666'] - Bar color (hex or CSS color)
 * @param {string} [config.height='200px'] - Height of the chart area
 * @param {Function} [config.formatValue] - Value label formatter: (value) => string
 * @param {boolean} [config.showValues=true] - Show value labels above bars
 * @param {boolean} [config.showLabels=true] - Show labels below bars
 * @param {string} [config.className=''] - Additional CSS classes
 * @returns {Object} TACO object
 * @category Component Builders
 * @example
 * bw.makeBarChart({
 *   data: [
 *     { label: 'Jan', value: 12400 },
 *     { label: 'Feb', value: 15800 },
 *     { label: 'Mar', value: 9200 }
 *   ],
 *   title: 'Monthly Revenue',
 *   color: '#0077b6',
 *   formatValue: (v) => '$' + (v / 1000).toFixed(1) + 'k'
 * });
 */
bw.makeBarChart = function(config) {
  const {
    data = [],
    labelKey = 'label',
    valueKey = 'value',
    title,
    color = '#006666',
    height = '200px',
    formatValue,
    showValues = true,
    showLabels = true,
    className = ''
  } = config;

  if (!_isA(data) || data.length === 0) {
    return { t: 'div', a: { class: ('bw_bar_chart_container ' + className).trim() }, c: '' };
  }

  const values = data.map(function(d) { return Number(d[valueKey]) || 0; });
  const maxVal = Math.max.apply(null, values);

  const bars = data.map(function(d, i) {
    const val = values[i];
    const pct = maxVal > 0 ? (val / maxVal * 100) : 0;
    const formatted = formatValue ? formatValue(val) : String(val);

    const children = [];
    if (showValues) {
      children.push({ t: 'div', a: { class: 'bw_bar_value' }, c: formatted });
    }
    children.push({
      t: 'div',
      a: {
        class: 'bw_bar',
        style: 'height:' + pct + '%;background:' + color + ';'
      }
    });
    if (showLabels) {
      children.push({ t: 'div', a: { class: 'bw_bar_label' }, c: String(d[labelKey] || '') });
    }

    return { t: 'div', a: { class: 'bw_bar_group' }, c: children };
  });

  const chartChildren = [];
  if (title) {
    chartChildren.push({ t: 'h3', a: { class: 'bw_bar_chart_title' }, c: title });
  }
  chartChildren.push({
    t: 'div',
    a: { class: 'bw_bar_chart', style: 'height:' + height + ';' },
    c: bars
  });

  return {
    t: 'div',
    a: { class: ('bw_bar_chart_container ' + className).trim() },
    c: chartChildren
  };
};

/**
 * Create a ready-to-use data table with title and responsive wrapper.
 *
 * Convenience wrapper around `bw.makeTable()` that adds a title heading,
 * responsive horizontal scroll container, and defaults to striped + hover.
 * Use this for the common case; use `bw.makeTable()` when you need a bare
 * table element with no wrapper.
 *
 * @param {Object} config - Table configuration
 * @param {string} [config.title] - Table title heading
 * @param {Array<Object>} config.data - Array of row objects
 * @param {Array<Object>} [config.columns] - Column definitions
 * @param {string} [config.className=''] - Additional CSS classes for the table
 * @param {boolean} [config.striped=true] - Add striped row styling
 * @param {boolean} [config.hover=true] - Add hover row highlighting
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
    className = '',
    striped = true,
    hover = true,
    responsive = true,
    ...tableConfig
  } = config;
  
  const table = bw.makeTable({
    data,
    columns,
    className,
    striped,
    hover,
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
 *   t: 'button', a: { class: 'bw_btn' }, c: 'Click Me',
 *   o: { state: { clicks: 0 } }
 * });
 * handle.setState({ clicks: 1 });
 * handle.destroy();
 */
bw.render = function(element, position, taco) {
  // Get target element
  const targetEl = _is(element, 'string')
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
  domElement.setAttribute('data-bw_id', componentId);
  
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
      
      // Update TACO with current state
      if (this._taco.o) {
        this._taco.o.state = this._state;
      }
      
      // Re-render
      const newElement = bw.createDOM(this._taco);
      newElement.setAttribute('data-bw_id', componentId);
      
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
        if (_is(content, 'string')) {
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

// Factory dispatch: bw.make('card', props) → bw.makeCard(props)
bw.make = make;

// Component registry: bw.BCCL lists all available component types
bw.BCCL = BCCL;

// Variant class helper: bw.variantClass('primary') → 'bw_primary'
bw.variantClass = variantClass;

// Create functions that return handles (plain renderComponent, no Handle overlay)
Object.entries(components).forEach(([name, fn]) => {
  if (name.startsWith('make')) {
    const createName = 'create' + name.substring(4); // createCard, createTable, etc.
    bw[createName] = function(props) {
      const taco = fn(props);
      return bw.renderComponent(taco);
    };
  }
});

// Also attach to global in browsers
if (bw._isBrowser && typeof window !== 'undefined') {
  window.bw = bw;
}

module.exports = bw;
//# sourceMappingURL=bitwrench.cjs.js.map
