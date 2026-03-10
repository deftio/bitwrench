/*! bitwrench-lean v2.0.15 | BSD-2-Clause | https://deftio.github.com/bitwrench/pages */
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.bw = factory());
})(this, (function () { 'use strict';

  /**
   * Auto-generated version file from package.json
   * DO NOT EDIT DIRECTLY - Use npm run generate-version
   */

  const VERSION_INFO = {
    version: '2.0.15',
    name: 'bitwrench',
    description: 'A library for javascript UI functions.',
    license: 'BSD-2-Clause',
    homepage: 'https://deftio.github.com/bitwrench/pages',
    repository: 'git+https://github.com/deftio/bitwrench.git',
    author: 'manu a. chatterjee <deftio@deftio.com> (https://deftio.com/)',
    buildDate: '2026-03-10T09:03:33.939Z'
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

    // Derive alternate surface colors from primary hue
    var priHsl = hexToHsl(config.primary);
    var h = priHsl[0];
    var isLight = isLightPalette(config);

    if (isLight) {
      // Primary is light → alternate needs dark surfaces
      alt.light = hslToHex([h, Math.min(priHsl[1], 15), 15]);
      alt.dark = hslToHex([h, 5, 88]);
    } else {
      // Primary is dark → alternate needs light surfaces
      alt.light = hslToHex([h, Math.min(priHsl[1], 10), 96]);
      alt.dark = hslToHex([h, 10, 18]);
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

    // Background & surface tokens — default to light (white/near-white).
    // Dark backgrounds require explicit config.background / config.surface.
    // Primary/secondary colors are accents, not page backgrounds, so
    // isLightPalette should NOT drive bg/surface defaults.
    var bgBase = config.background || '#ffffff';
    var surfBase = config.surface || '#f8f9fa';

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
      surface:    surfBase
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

  var SPACING_PRESETS = {
    compact:  { btn: SPACING_SCALE[1] + ' ' + SPACING_SCALE[3],  card: SPACING_SCALE[3] + ' ' + SPACING_SCALE[4], alert: SPACING_SCALE[2] + ' ' + SPACING_SCALE[4], cell: SPACING_SCALE[2] + ' ' + SPACING_SCALE[3], input: SPACING_SCALE[1] + ' ' + SPACING_SCALE[3] },
    normal:   { btn: SPACING_SCALE[2] + ' ' + SPACING_SCALE[4],  card: SPACING_SCALE[5] + ' ' + SPACING_SCALE[5], alert: SPACING_SCALE[3] + ' ' + SPACING_SCALE[5], cell: SPACING_SCALE[3] + ' ' + SPACING_SCALE[4], input: SPACING_SCALE[2] + ' ' + SPACING_SCALE[3] },
    spacious: { btn: SPACING_SCALE[3] + ' ' + SPACING_SCALE[5],  card: SPACING_SCALE[6] + ' ' + SPACING_SCALE[6], alert: SPACING_SCALE[4] + ' ' + SPACING_SCALE[5], cell: SPACING_SCALE[4] + ' ' + SPACING_SCALE[5], input: SPACING_SCALE[3] + ' ' + SPACING_SCALE[4] }
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
  var THEME_PRESETS = {
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
  function generateThemedCSS(scopeName, palette, layout) {
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
  function getStructuralStyles() {
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
   * Generate alternate-palette CSS scoped under `.bw_theme_alt`.
   * Uses the same `generateThemedCSS()` pipeline as the primary palette —
   * both sides go through identical code paths.
   *
   * @param {string} name - Theme scope name (e.g. 'ocean'). '' for global.
   * @param {Object} altPalette - From derivePalette(deriveAlternateConfig(...))
   * @param {Object} layout - From resolveLayout()
   * @returns {Object} CSS rules object scoped under .bw_theme_alt (+ optional .name)
   */
  function generateAlternateCSS(name, altPalette, layout) {
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
   * Empty stub for bitwrench-bccl.js.
   * Used by the lean build to exclude all BCCL component code.
   */
  const componentHandles = {};
  function variantClass() { return ''; }
  var BCCL = {};
  function make() { throw new Error('bw.make() requires the full bitwrench build (not lean)'); }

  var components = /*#__PURE__*/Object.freeze({
    __proto__: null,
    BCCL: BCCL,
    componentHandles: componentHandles,
    make: make,
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
    if (typeof id !== 'string') return id || null;
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

    // 5. Cache the result for next time
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
    if (Array.isArray(taco)) {
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
      if (!Array.isArray(arr)) return '';
      return arr.map(function(item, idx) { return bw.html(taco.factory(item, idx), options); }).join('');
    }

    // Handle primitives and non-TACO objects
    if (typeof taco !== 'object' || !taco.t) {
      var str = options.raw ? String(taco) : bw.escapeHTML(String(taco));
      // Resolve template bindings if state provided
      if (options.state && typeof str === 'string' && str.indexOf('${') >= 0) {
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
      
      // Skip event handlers (they're for DOM only)
      if (key.startsWith('on')) continue;
      
      if (key === 'style' && typeof value === 'object') {
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
        const classStr = Array.isArray(value) ? value.filter(Boolean).join(' ') : String(value);
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
    if (options.state && typeof contentStr === 'string' && contentStr.indexOf('${') >= 0) {
      contentStr = bw._resolveTemplate(contentStr, options.state, !!options.compile);
    }

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
        // Handle class as array or string
        const classStr = Array.isArray(value) ? value.filter(Boolean).join(' ') : String(value);
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
    
    // Add children, building _bw_refs for fast parent→child access.
    // Children with data-bw_id or id attributes get local refs on the parent,
    // so o.render functions can access them without any DOM lookup.
    if (content != null) {
      if (Array.isArray(content)) {
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
                if (Object.prototype.hasOwnProperty.call(childEl._bw_refs, rk)) {
                  el._bw_refs[rk] = childEl._bw_refs[rk];
                }
              }
            }
          }
        });
      } else if (typeof content === 'object' && content.__bw_raw) {
        // Raw HTML content — inject via innerHTML
        el.innerHTML = content.v;
      } else if (content._bwComponent === true) {
        // Single ComponentHandle as content
        content.mount(el);
      } else if (typeof content === 'object' && content.t) {
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
            if (Object.prototype.hasOwnProperty.call(childEl._bw_refs, rk)) {
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
      console.error('bw.DOM: Target element not found:', target);
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
      else if (Array.isArray(taco)) {
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
    } else if (Array.isArray(content)) {
      // Patch with array of children (strings and/or TACOs)
      el.innerHTML = '';
      content.forEach(function(item) {
        if (typeof item === 'string' || typeof item === 'number') {
          el.appendChild(document.createTextNode(String(item)));
        } else if (item && item.t) {
          el.appendChild(bw.createDOM(item));
        }
      });
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
      if (Object.prototype.hasOwnProperty.call(patches, id)) {
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
    if (typeof fn !== 'function') return '';
    var fnID = (typeof name === 'string' && name.length > 0) ? name : ('bw_fn_' + bw._fnIDCounter++);
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
    return (typeof errFn === 'function') ? errFn : function() { console.warn('bw.funcGetById: unregistered fn "' + name + '"'); };
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
      if (Object.prototype.hasOwnProperty.call(bw._fnRegistry, k)) {
        copy[k] = bw._fnRegistry[k];
      }
    }
    return copy;
  };

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
      if (val == null) return '';
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
    if (typeof str !== 'string' || str.indexOf('${') < 0) return str;
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
        if (Object.prototype.hasOwnProperty.call(o.state, k)) {
          this._state[k] = o.state[k];
        }
      }
    }
    // Copy actions
    this._actions = {};
    if (o.actions) {
      for (var k2 in o.actions) {
        if (Object.prototype.hasOwnProperty.call(o.actions, k2)) {
          this._actions[k2] = o.actions[k2];
        }
      }
    }
    // Promote o.methods to handle API (MFC/Qt pattern: component owns its methods)
    this._methods = {};
    if (o.methods) {
      var self = this;
      for (var k3 in o.methods) {
        if (Object.prototype.hasOwnProperty.call(o.methods, k3)) {
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
      onUpdate: o.onUpdate || null,
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
  }

  // ── State Methods ──

  /**
   * Get a state value. Dot-path supported: `get('user.name')`
   */
  ComponentHandle.prototype.get = function(key) {
    return bw._evaluatePath(this._state, key);
  };

  /**
   * Set a state value. Dot-path supported. Schedules re-render.
   * @param {string} key - State key (dot-path)
   * @param {*} value - New value
   * @param {Object} [opts] - Options. `{sync: true}` for immediate flush.
   */
  ComponentHandle.prototype.set = function(key, value, opts) {
    // Dot-path set
    var parts = key.split('.');
    var obj = this._state;
    for (var i = 0; i < parts.length - 1; i++) {
      if (obj[parts[i]] == null || typeof obj[parts[i]] !== 'object') {
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
  ComponentHandle.prototype.getState = function() {
    var clone = {};
    for (var k in this._state) {
      if (Object.prototype.hasOwnProperty.call(this._state, k)) {
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
  ComponentHandle.prototype.setState = function(updates, opts) {
    for (var k in updates) {
      if (Object.prototype.hasOwnProperty.call(updates, k)) {
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
  ComponentHandle.prototype.push = function(key, val) {
    var arr = this.get(key);
    var newArr = Array.isArray(arr) ? arr.slice() : [];
    newArr.push(val);
    this.set(key, newArr);
  };

  /**
   * Splice an array in state. Clones the array.
   */
  ComponentHandle.prototype.splice = function(key, start, deleteCount) {
    var arr = this.get(key);
    var newArr = Array.isArray(arr) ? arr.slice() : [];
    var args = [start, deleteCount].concat(Array.prototype.slice.call(arguments, 3));
    Array.prototype.splice.apply(newArr, args);
    this.set(key, newArr);
  };

  // ── Scheduling ──

  ComponentHandle.prototype._scheduleDirty = function() {
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
  ComponentHandle.prototype._compileBindings = function() {
    this._bindings = [];
    this._refCounter = 0;
    var stateKeys = Object.keys(this._state);
    var self = this;

    function walkTaco(taco, path) {
      if (taco == null || typeof taco !== 'object' || !taco.t) return taco;

      // Check content for bindings
      if (typeof taco.c === 'string' && taco.c.indexOf('${') >= 0) {
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
          if (!Object.prototype.hasOwnProperty.call(taco.a, attrName)) continue;
          if (attrName === 'data-bw_ref') continue;
          var attrVal = taco.a[attrName];
          if (typeof attrVal === 'string' && attrVal.indexOf('${') >= 0) {
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
      if (Array.isArray(taco.c)) {
        for (var i = 0; i < taco.c.length; i++) {
          if (taco.c[i] && typeof taco.c[i] === 'object' && taco.c[i].t) {
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
      } else if (taco.c && typeof taco.c === 'object' && taco.c.t) {
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
  ComponentHandle.prototype._collectRefs = function() {
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
  ComponentHandle.prototype.mount = function(parentEl) {
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
      if (Object.prototype.hasOwnProperty.call(this._actions, actionName)) {
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

    // mounted hook (backward compat: fn.length === 2 wraps (el, state))
    if (this._hooks.mounted) {
      if (this._hooks.mounted.length === 2) {
        this._hooks.mounted(this.element, this.getState());
      } else {
        this._hooks.mounted(this);
      }
    }
  };

  /**
   * Prepare TACO for initial render: resolve when/each markers.
   * @private
   */
  ComponentHandle.prototype._prepareTaco = function(taco) {
    if (!taco || typeof taco !== 'object') return;

    if (Array.isArray(taco.c)) {
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
          if (Array.isArray(arr)) {
            for (var j = 0; j < arr.length; j++) {
              items.push(child.factory(arr[j], j));
            }
          }
          taco.c[i] = { t: 'span', a: { 'data-bw_each': child._refId, style: 'display:contents' }, c: items };
        }
        if (taco.c[i] && typeof taco.c[i] === 'object' && taco.c[i].t) {
          this._prepareTaco(taco.c[i]);
        }
      }
    } else if (taco.c && typeof taco.c === 'object' && taco.c.t) {
      this._prepareTaco(taco.c);
    }
  };

  /**
   * Wire action name strings (in onclick etc.) to dispatch function calls.
   * @private
   */
  ComponentHandle.prototype._wireActions = function(taco) {
    if (!taco || typeof taco !== 'object' || !taco.t) return;
    if (taco.a) {
      for (var key in taco.a) {
        if (!Object.prototype.hasOwnProperty.call(taco.a, key)) continue;
        if (key.startsWith('on') && typeof taco.a[key] === 'string') {
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
    if (Array.isArray(taco.c)) {
      for (var i = 0; i < taco.c.length; i++) {
        this._wireActions(taco.c[i]);
      }
    } else if (taco.c && typeof taco.c === 'object' && taco.c.t) {
      this._wireActions(taco.c);
    }
  };

  /**
   * Deep-clone a TACO tree, preserving _bwWhen/_bwEach markers and their factories.
   * @private
   */
  ComponentHandle.prototype._deepCloneTaco = function(taco) {
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
    if (typeof taco !== 'object' || !taco.t) return taco;
    var result = { t: taco.t };
    if (taco.a) {
      result.a = {};
      for (var k in taco.a) {
        if (Object.prototype.hasOwnProperty.call(taco.a, k)) result.a[k] = taco.a[k];
      }
    }
    if (taco.c != null) {
      if (Array.isArray(taco.c)) {
        result.c = taco.c.map(function(child) { return this._deepCloneTaco(child); }.bind(this));
      } else if (typeof taco.c === 'object') {
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
  ComponentHandle.prototype._tacoForDOM = function(taco) {
    if (!taco || typeof taco !== 'object' || !taco.t) return taco;
    var result = { t: taco.t };
    if (taco.a) result.a = taco.a;
    if (taco.c != null) {
      if (Array.isArray(taco.c)) {
        result.c = taco.c.map(function(child) { return this._tacoForDOM(child); }.bind(this));
      } else if (typeof taco.c === 'object' && taco.c.t) {
        result.c = this._tacoForDOM(taco.c);
      } else {
        result.c = taco.c;
      }
    }
    // Intentionally strip o (no mounted/unmount/state/render on sub-elements)
    return result;
  };

  /**
   * Unmount: remove from DOM, deactivate, preserve state for re-mount.
   */
  ComponentHandle.prototype.unmount = function() {
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
  ComponentHandle.prototype.destroy = function() {
    // willDestroy hook
    if (this._hooks.willDestroy) {
      this._hooks.willDestroy(this);
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
  ComponentHandle.prototype._flush = function() {
    this._scheduled = false;
    var changedKeys = Object.keys(this._dirtyKeys);
    this._dirtyKeys = {};
    if (changedKeys.length === 0 || !this.mounted) return;

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
  ComponentHandle.prototype._resolveBindings = function(changedKeys) {
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
  ComponentHandle.prototype._applyPatches = function(patches) {
    for (var i = 0; i < patches.length; i++) {
      var p = patches[i];
      var el = this._bw_refs[p.refId];
      if (!el) continue;
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
  ComponentHandle.prototype._resolveAndApplyAll = function() {
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
  ComponentHandle.prototype._render = function() {
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
  ComponentHandle.prototype.on = function(event, handler) {
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
  ComponentHandle.prototype.off = function(event, handler) {
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
  ComponentHandle.prototype.sub = function(topic, handler) {
    var unsub = bw.sub(topic, handler);
    this._subs.push(unsub);
    return unsub;
  };

  /**
   * Call a named action.
   * @param {string} name - Action name
   * @param {...*} args - Arguments passed after comp
   */
  ComponentHandle.prototype.action = function(name) {
    var fn = this._actions[name];
    if (!fn) {
      console.warn('ComponentHandle.action: unknown action "' + name + '"');
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
  ComponentHandle.prototype.select = function(sel) {
    return this.element ? this.element.querySelector(sel) : null;
  };

  /**
   * querySelectorAll within the component's DOM.
   * @param {string} sel - CSS selector
   * @returns {Element[]}
   */
  ComponentHandle.prototype.selectAll = function(sel) {
    if (!this.element) return [];
    return Array.prototype.slice.call(this.element.querySelectorAll(sel));
  };

  /**
   * Tag this component with a user-defined ID for addressing via bw.message().
   * The tag is added as a CSS class on the root element (DOM IS the registry).
   * @param {string} tag - User-defined identifier (e.g. 'dashboard_prod_east')
   * @returns {ComponentHandle} this (for chaining)
   */
  ComponentHandle.prototype.userTag = function(tag) {
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
   * @param {string} target - Component UUID (data-bw_comp_id) or user tag (CSS class)
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
    // Try data-bw_comp_id attribute first, then CSS class (user tag)
    var el = bw.$('[data-bw_comp_id="' + target + '"]')[0];
    if (!el) {
      el = bw.$('.' + target)[0];
    }
    if (!el || !el._bwComponentHandle) return false;
    var comp = el._bwComponentHandle;
    if (typeof comp[action] !== 'function') {
      console.warn('bw.message: unknown action "' + action + '" on component ' + target);
      return false;
    }
    comp[action](data);
    return true;
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
      if (typeof target === 'string') {
        el = bw.$(target)[0];
      }
      if (!el) {
        console.warn('bw.inspect: element not found');
        return null;
      }
      comp = el._bwComponentHandle;
    }
    if (!comp) {
      console.log('bw.inspect: no ComponentHandle on this element');
      console.log('  Tag:', el.tagName);
      console.log('  Classes:', el.className);
      console.log('  _bw_state:', el._bw_state || '(none)');
      return null;
    }
    var deps = comp._bindings.reduce(function(s, b) {
      return s.concat(b.deps || []);
    }, []).filter(function(v, i, a) { return a.indexOf(v) === i; });
    console.group('Component: ' + comp._bwId);
    console.log('State:', comp._state);
    console.log('Bindings:', comp._bindings.length, '(deps:', deps, ')');
    console.log('Methods:', Object.keys(comp._methods));
    console.log('Actions:', Object.keys(comp._actions));
    console.log('User tag:', comp._userTag || '(none)');
    console.log('Mounted:', comp.mounted);
    console.log('Element:', comp.element);
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
      if (!node || typeof node !== 'object') return;
      if (typeof node.c === 'string' && node.c.indexOf('${') >= 0) {
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
          if (Object.prototype.hasOwnProperty.call(node.a, key)) {
            var v = node.a[key];
            if (typeof v === 'string' && v.indexOf('${') >= 0) {
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
      if (Array.isArray(node.c)) {
        for (var k = 0; k < node.c.length; k++) walkExpressions(node.c[k]);
      } else if (node.c && typeof node.c === 'object' && node.c.t) {
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
          if (Object.prototype.hasOwnProperty.call(initialState, k)) {
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
   * @see bw.applyTheme
   * @see bw.toggleTheme
   * @example
   * bw.loadDefaultStyles();  // inject all default CSS
   */
  bw.loadDefaultStyles = function(options = {}) {
    const { minify = true, palette } = options;

    // 1. Inject structural CSS (layout, sizing — never changes with theme)
    if (bw._isBrowser) {
      var structuralCSS = bw.css(getStructuralStyles());
      bw.injectCSS(structuralCSS, { id: 'bw_structural', append: false, minify: minify });
    }

    // 2. Inject cosmetic CSS via generateTheme (colors, shadows, radii)
    var paletteConfig = Object.assign({}, DEFAULT_PALETTE_CONFIG, palette || {});
    var result = bw.generateTheme('', Object.assign({}, paletteConfig, { inject: true }));
    return result;
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
   * @param {string} [config.background] - Page background hex (default: '#ffffff' light, derived dark)
   * @param {string} [config.surface] - Surface/card background hex (default: '#f8f9fa' light, derived dark)
   * @param {string} [config.spacing='normal'] - 'compact' | 'normal' | 'spacious'
   * @param {string} [config.radius='md'] - 'none' | 'sm' | 'md' | 'lg' | 'pill'
   * @param {number} [config.fontSize=1.0] - Base font size scale factor
   * @param {string|number} [config.typeRatio='normal'] - 'tight' | 'normal' | 'relaxed' | 'dramatic' or a number
   * @param {string} [config.elevation='md'] - 'flat' | 'sm' | 'md' | 'lg'
   * @param {string} [config.motion='standard'] - 'reduced' | 'standard' | 'expressive'
   * @param {number} [config.harmonize=0.20] - 0-1, semantic color hue shift toward primary
   * @param {boolean} [config.inject=true] - Inject into DOM (browser only)
   * @returns {Object} { css, palette, name, isLightPrimary, alternate: { css, palette } }
   * @category CSS & Styling
   * @see bw.applyTheme
   * @see bw.toggleTheme
   * @see bw.loadDefaultStyles
   * @example
   * // Generate and inject an ocean theme (primary + alternate)
   * var theme = bw.generateTheme('ocean', {
   *   primary: '#0077b6',
   *   secondary: '#90e0ef',
   *   tertiary: '#00b4d8'
   * });
   *
   * // Apply to a container
   * document.getElementById('app').classList.add('ocean');
   *
   * // Toggle to alternate palette
   * bw.toggleTheme();
   *
   * // Generate CSS for static export (Node.js)
   * var result = bw.generateTheme('sunset', {
   *   primary: '#e76f51',
   *   secondary: '#264653',
   *   inject: false
   * });
   * fs.writeFileSync('sunset.css', result.css + result.alternate.css);
   */
  bw.generateTheme = function(name, config) {
    if (!config || !config.primary || !config.secondary) {
      throw new Error('bw.generateTheme requires config.primary and config.secondary');
    }

    // Merge with defaults; if user didn't supply tertiary, default to their primary
    var fullConfig = Object.assign({}, DEFAULT_PALETTE_CONFIG, config);
    if (!config.tertiary) fullConfig.tertiary = fullConfig.primary;

    // Derive primary palette
    var palette = derivePalette(fullConfig);

    // Resolve layout
    var layout = resolveLayout(fullConfig);

    // Generate primary themed CSS rules
    var themedRules = generateThemedCSS(name, palette, layout);
    var cssStr = bw.css(themedRules);

    // Derive alternate palette (luminance-inverted)
    var altConfig = deriveAlternateConfig(fullConfig);
    var altPalette = derivePalette(altConfig);

    // Generate alternate CSS scoped under .bw_theme_alt
    var altRules = generateAlternateCSS(name, altPalette, layout);
    var altCssStr = bw.css(altRules);

    // Determine if primary is light-flavored
    var lightPrimary = isLightPalette(fullConfig);

    // Inject both CSS sets into DOM if requested
    var shouldInject = config.inject !== false;
    if (shouldInject && bw._isBrowser) {
      var safeName = name ? name.replace(/-/g, '_') : '';
      var styleId = safeName ? 'bw_theme_' + safeName : 'bw_theme_default';
      var altStyleId = safeName ? 'bw_theme_' + safeName + '_alt' : 'bw_theme_default_alt';

      bw.injectCSS(cssStr, { id: styleId, append: false });
      bw.injectCSS(altCssStr, { id: altStyleId, append: false });

      bw._activeThemeStyleIds = [styleId, altStyleId];
    }

    // Update bw.u color entries to reflect the palette
    if (!name) {
      bw.u.bgTeal = { background: palette.primary.base, color: palette.primary.textOn };
      bw.u.textTeal = { color: palette.primary.base };
      bw.u.bgWhite = { background: '#ffffff' };
      bw.u.textWhite = { color: '#ffffff' };
    }

    // Store active theme state
    var result = {
      css: cssStr,
      palette: palette,
      name: name,
      isLightPrimary: lightPrimary,
      alternate: {
        css: altCssStr,
        palette: altPalette
      }
    };
    bw._activeTheme = result;
    bw._activeThemeMode = 'primary';

    return result;
  };

  /**
   * Apply a theme mode. Switches between primary and alternate palettes
   * by adding/removing the `bw_theme_alt` class on `<html>`.
   *
   * @param {string} mode - 'primary' | 'alternate' | 'light' | 'dark'
   * @returns {string} Active mode: 'primary' or 'alternate'
   * @category CSS & Styling
   * @see bw.generateTheme
   * @see bw.toggleTheme
   * @example
   * bw.applyTheme('alternate');  // switch to alternate palette
   * bw.applyTheme('dark');       // switch to whichever palette is darker
   * bw.applyTheme('primary');    // switch back to primary palette
   */
  bw.applyTheme = function(mode) {
    if (!bw._isBrowser) return mode || 'primary';
    var root = document.documentElement;
    var isLight = bw._activeTheme ? bw._activeTheme.isLightPrimary : true;

    var wantAlt;
    if (mode === 'primary')        wantAlt = false;
    else if (mode === 'alternate') wantAlt = true;
    else if (mode === 'light')     wantAlt = !isLight;
    else if (mode === 'dark')      wantAlt = isLight;
    else                           wantAlt = false;

    if (wantAlt) {
      root.classList.add('bw_theme_alt');
    } else {
      root.classList.remove('bw_theme_alt');
    }

    bw._activeThemeMode = wantAlt ? 'alternate' : 'primary';
    return bw._activeThemeMode;
  };

  /**
   * Toggle between primary and alternate theme palettes.
   *
   * @returns {string} Active mode after toggle: 'primary' or 'alternate'
   * @category CSS & Styling
   * @see bw.applyTheme
   * @see bw.generateTheme
   * @example
   * bw.toggleTheme();  // flip between primary and alternate
   */
  bw.toggleTheme = function() {
    var current = bw._activeThemeMode || 'primary';
    return bw.applyTheme(current === 'primary' ? 'alternate' : 'primary');
  };

  /**
   * Remove the currently active theme's injected style elements from the DOM.
   * Use this before generating a new theme with a different name to prevent
   * stale CSS accumulation.
   *
   * @category CSS & Styling
   * @see bw.generateTheme
   * @example
   * bw.clearTheme();                   // remove current theme styles
   * bw.generateTheme('sunset', conf);  // inject fresh theme
   */
  bw.clearTheme = function() {
    if (bw._activeThemeStyleIds && bw._isBrowser) {
      bw._activeThemeStyleIds.forEach(function(id) {
        var el = document.getElementById(id);
        if (el) el.remove();
      });
      bw._activeThemeStyleIds = null;
    }
    bw._activeTheme = null;
    bw._activeThemeMode = 'primary';
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
      className = '',
      striped = false,
      hover = false,
      sortable = true,
      onSort,
      sortColumn,
      sortDirection = 'asc'
    } = config;

    // Build class list: always include bw_table, add striped/hover, append user className
    let cls = 'bw_table';
    if (striped) cls += ' bw_table_striped';
    if (hover) cls += ' bw_table_hover';
    if (className) cls += ' ' + className;
    cls = cls.trim();
    
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
      a: { class: cls },
      c: [thead, tbody]
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

    if (!Array.isArray(data) || data.length === 0) {
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

    if (!Array.isArray(data) || data.length === 0) {
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

  return bw;

}));
//# sourceMappingURL=bitwrench-lean.umd.js.map
