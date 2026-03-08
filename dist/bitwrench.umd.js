/*! bitwrench v2.0.14 | BSD-2-Clause | https://deftio.github.com/bitwrench/pages */
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
    version: '2.0.14',
    name: 'bitwrench',
    description: 'A library for javascript UI functions.',
    license: 'BSD-2-Clause',
    homepage: 'https://deftio.github.com/bitwrench/pages',
    repository: 'git+https://github.com/deftio/bitwrench.git',
    author: 'manu a. chatterjee <deftio@deftio.com> (https://deftio.com/)',
    buildDate: '2026-03-08T07:51:17.655Z'
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
      altL = clip(100 - l - 10, 8, 40);
      // Reduce saturation slightly — vivid colors at low lightness look garish
      altS = clip(s * 0.85, 0, 100);
    } else {
      // Dark color → make light. Map 0-50 → 65-92 range
      altL = clip(100 - l + 10, 60, 92);
      // Slightly increase saturation for light variant
      altS = clip(s * 1.1, 0, 100);
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

    var palette = {
      primary:   deriveShades(config.primary),
      secondary: deriveShades(config.secondary),
      tertiary:  deriveShades(config.tertiary),
      success:   deriveShades(successBase),
      danger:    deriveShades(dangerBase),
      warning:   deriveShades(warningBase),
      info:      deriveShades(infoBase),
      light:     deriveShades(lightBase),
      dark:      deriveShades(darkBase)
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
    rules[scopeSelector(scope, '.bw-btn')] = {
      'padding': sp.btn,
      'border-radius': rd.btn
    };
    rules[scopeSelector(scope, '.bw-btn:focus-visible')] = {
      'outline': '2px solid currentColor',
      'outline-offset': '2px',
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

    var elev = layout.elevation;
    rules[scopeSelector(scope, '.bw-card')] = {
      'background-color': '#fff',
      'border': '1px solid ' + palette.light.border,
      'border-radius': rd.card,
      'box-shadow': elev.sm
    };
    rules[scopeSelector(scope, '.bw-card:hover')] = {
      'box-shadow': elev.md
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
      'outline': '2px solid ' + palette.primary.base,
      'outline-offset': '-1px',
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
      'outline': '2px solid ' + palette.primary.base,
      'outline-offset': '-2px'
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
    rules[scopeSelector(scope, '.bw-accordion-button:not(.bw-collapsed)')] = {
      'color': palette.primary.darkText,
      'background-color': palette.primary.light
    };
    rules[scopeSelector(scope, '.bw-accordion-button:hover')] = {
      'background-color': palette.light.light
    };
    rules[scopeSelector(scope, '.bw-accordion-button:not(.bw-collapsed):hover')] = {
      'background-color': palette.primary.hover
    };
    rules[scopeSelector(scope, '.bw-accordion-button:focus-visible')] = {
      'box-shadow': '0 0 0 0.2rem ' + palette.primary.focus
    };
    rules[scopeSelector(scope, '.bw-accordion-body')] = {
      'border-top': '1px solid ' + palette.light.border
    };
    return rules;
  }

  function generateCarouselThemed(scope, palette) {
    var rules = {};
    rules[scopeSelector(scope, '.bw-carousel')] = {
      'background-color': palette.light.light
    };
    rules[scopeSelector(scope, '.bw-carousel-indicator.active')] = {
      'background-color': palette.primary.base
    };
    return rules;
  }

  function generateModalThemed(scope, palette, layout) {
    var rules = {};
    rules[scopeSelector(scope, '.bw-modal-content')] = {
      'background-color': '#fff',
      'border-color': palette.light.border,
      'box-shadow': layout.elevation.lg
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

  function generateToastThemed(scope, palette, layout) {
    var rules = {};
    rules[scopeSelector(scope, '.bw-toast')] = {
      'background-color': '#fff',
      'border-color': 'rgba(0,0,0,0.1)',
      'box-shadow': layout.elevation.lg
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

  function generateDropdownThemed(scope, palette, layout) {
    var rules = {};
    rules[scopeSelector(scope, '.bw-dropdown-menu')] = {
      'background-color': '#fff',
      'border-color': palette.light.border,
      'box-shadow': layout.elevation.md
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
      'background': 'linear-gradient(90deg, ' + palette.light.border + ' 25%, ' + palette.light.light + ' 37%, ' + palette.light.border + ' 63%)'
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
  function generateThemedCSS(scopeName, palette, layout) {
    return Object.assign({},
      generateResetThemed(scopeName, palette),
      generateTypographyThemed(scopeName, palette, layout),
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
      generateCarouselThemed(scopeName, palette),
      generateModalThemed(scopeName, palette, layout),
      generateToastThemed(scopeName, palette, layout),
      generateDropdownThemed(scopeName, palette, layout),
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
  const defaultStyles = {
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
   * Structural styles — layout, sizing, spacing, positioning, and behavior.
   *
   * POLICY: No colors, backgrounds, shadows, or border-colors in this function.
   * All cosmetic values belong in `defaultStyles.*` sections (unthemed defaults)
   * or in `generateThemedCSS()` (theme-driven colors).
   *
   * Exception: `.bw-progress-bar-striped` uses rgba(255,255,255,.15) for the
   * stripe pattern overlay. This is theme-neutral — a semi-transparent white
   * gradient that creates visible stripes on any background color.
   *
   * Architecture:
   *   getStructuralStyles()  → layout-only rules (never change with themes)
   *   defaultStyles.*        → cosmetic defaults (colors, shadows, borders)
   *   generateThemedCSS()    → palette-driven cosmetics from seed colors
   *   generateAlternateCSS() → alternate palette (luminance-inverted)
   *
   * @returns {Object} CSS rules object (layout-only, theme-independent)
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
      'border-radius': '6px', 'transition': 'all 0.15s ease-out',
      'gap': '0.5rem'
    };
    rules['.bw-btn:hover'] = { 'text-decoration': 'none', 'transform': 'translateY(-1px)' };
    rules['.bw-btn:active'] = { 'transform': 'translateY(0)' };
    rules['.bw-btn:focus-visible'] = { 'outline': '2px solid currentColor', 'outline-offset': '2px' };
    rules['.bw-btn:disabled'] = { 'opacity': '0.5', 'cursor': 'not-allowed', 'pointer-events': 'none' };
    rules['.bw-btn-lg'] = { 'padding': '0.625rem 1.5rem', 'font-size': '1rem', 'border-radius': '8px' };
    rules['.bw-btn-sm'] = { 'padding': '0.25rem 0.75rem', 'font-size': '0.8125rem', 'border-radius': '5px' };

    // Card (structural)
    rules['.bw-card'] = {
      'position': 'relative', 'display': 'flex', 'flex-direction': 'column',
      'min-width': '0', 'height': '100%', 'word-wrap': 'break-word',
      'background-clip': 'border-box', 'border': '1px solid transparent',
      'border-radius': '8px', 'transition': 'box-shadow 0.2s ease-out, transform 0.2s ease-out',
      'margin-bottom': '1.5rem', 'overflow': 'hidden'
    };
    rules['.bw-card-body'] = { 'flex': '1 1 auto', 'padding': '1.25rem 1.5rem' };
    rules['.bw-card-body > *:last-child'] = { 'margin-bottom': '0' };
    rules['.bw-card-title'] = { 'margin-bottom': '0.5rem', 'font-size': '1.125rem', 'font-weight': '600', 'line-height': '1.3' };
    rules['.bw-card-text'] = { 'margin-bottom': '0', 'font-size': '0.9375rem', 'line-height': '1.6' };
    rules['.bw-card-header'] = { 'padding': '0.875rem 1.5rem', 'margin-bottom': '0', 'font-weight': '600', 'font-size': '0.875rem' };
    rules['.bw-card-footer'] = { 'padding': '0.75rem 1.5rem', 'font-size': '0.875rem' };
    rules['.bw-card-hoverable'] = { 'transition': 'all 0.3s ease-out' };
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
      'transition': 'border-color 0.15s ease-out, box-shadow 0.15s ease-out',
      'font-family': 'inherit'
    };
    rules['.bw-form-control:focus'] = { 'outline': '2px solid currentColor', 'outline-offset': '-1px' };
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

    // Form validation (structural)
    rules['.bw-valid-feedback'] = { 'display': 'block', 'font-size': '0.875rem', 'margin-top': '0.25rem' };
    rules['.bw-invalid-feedback'] = { 'display': 'block', 'font-size': '0.875rem', 'margin-top': '0.25rem' };

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
      'display': 'inline-block', 'padding': '0.375rem 0.625rem', 'font-size': '0.875rem',
      'font-weight': '600', 'line-height': '1.3', 'text-align': 'center',
      'white-space': 'nowrap', 'vertical-align': 'baseline', 'border-radius': '.375rem'
    };
    rules['.bw-badge:empty'] = { 'display': 'none' };
    rules['.bw-badge-sm'] = { 'font-size': '0.75rem', 'padding': '0.25rem 0.5rem' };
    rules['.bw-badge-lg'] = { 'font-size': '1rem', 'padding': '0.5rem 0.875rem' };
    rules['.bw-badge-pill'] = { 'border-radius': '50rem' };

    // Progress (structural)
    rules['.bw-progress'] = { 'display': 'flex', 'height': '1.25rem', 'overflow': 'hidden', 'font-size': '.875rem', 'border-radius': '.5rem' };
    rules['.bw-progress-bar'] = {
      'display': 'flex', 'flex-direction': 'column', 'justify-content': 'center',
      'overflow': 'hidden', 'text-align': 'center', 'white-space': 'nowrap',
      'transition': 'width 0.3s ease-out', 'font-weight': '600'
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
      'transition': 'color 0.15s ease-out, background-color 0.15s ease-out, border-color 0.15s ease-out', 'font-family': 'inherit'
    };
    rules['.bw-nav-tabs .bw-nav-link'] = { 'border': 'none', 'border-bottom': '2px solid transparent', 'border-radius': '0', 'background-color': 'transparent' };
    rules['.bw-nav-pills .bw-nav-link'] = { 'border-radius': '6px' };
    rules['.bw-nav-vertical'] = { 'flex-direction': 'column' };
    rules['.bw-tab-content'] = { 'padding': '1.25rem 0' };
    rules['.bw-tab-pane'] = { 'display': 'none' };
    rules['.bw-tab-pane.active'] = { 'display': 'block' };
    rules['.bw-nav-scrollable'] = { 'flex-wrap': 'nowrap', 'overflow-x': 'auto', '-webkit-overflow-scrolling': 'touch', 'scrollbar-width': 'none' };
    rules['.bw-nav-scrollable .bw-nav-link'] = { 'white-space': 'nowrap' };

    // List groups (structural)
    rules['.bw-list-group'] = { 'display': 'flex', 'flex-direction': 'column', 'padding-left': '0', 'margin-bottom': '0', 'border-radius': '0.375rem' };
    rules['.bw-list-group-item'] = { 'position': 'relative', 'display': 'block', 'padding': '0.75rem 1.25rem', 'text-decoration': 'none', 'font-size': '0.9375rem' };
    rules['.bw-list-group-item:first-child'] = { 'border-top-left-radius': 'inherit', 'border-top-right-radius': 'inherit' };
    rules['.bw-list-group-item:last-child'] = { 'border-bottom-right-radius': 'inherit', 'border-bottom-left-radius': 'inherit' };
    rules['.bw-list-group-item + .bw-list-group-item'] = { 'border-top-width': '0' };
    rules['.bw-list-group-item.disabled'] = { 'pointer-events': 'none' };
    rules['a.bw-list-group-item'] = { 'cursor': 'pointer', 'transition': 'background-color 0.15s ease-out, color 0.15s ease-out' };
    rules['a.bw-list-group-item:focus-visible, .bw-list-group-item:focus-visible'] = { 'z-index': '2', 'outline': '2px solid currentColor', 'outline-offset': '-2px' };
    rules['.bw-list-group-flush'] = { 'border-radius': '0' };
    rules['.bw-list-group-flush > .bw-list-group-item'] = { 'border-width': '0 0 1px', 'border-radius': '0' };
    rules['.bw-list-group-flush > .bw-list-group-item:last-child'] = { 'border-bottom-width': '0' };

    // Pagination (structural)
    rules['.bw-pagination'] = { 'display': 'flex', 'padding-left': '0', 'list-style': 'none', 'margin-bottom': '0' };
    rules['.bw-page-item'] = { 'display': 'list-item', 'list-style': 'none' };
    rules['.bw-page-link'] = {
      'position': 'relative', 'display': 'block', 'padding': '0.375rem 0.75rem',
      'margin-left': '-1px', 'line-height': '1.25', 'text-decoration': 'none',
      'transition': 'color 0.15s ease-out, background-color 0.15s ease-out, border-color 0.15s ease-out'
    };
    rules['.bw-page-item:first-child .bw-page-link'] = { 'margin-left': '0', 'border-top-left-radius': '0.375rem', 'border-bottom-left-radius': '0.375rem' };
    rules['.bw-page-item:last-child .bw-page-link'] = { 'border-top-right-radius': '0.375rem', 'border-bottom-right-radius': '0.375rem' };
    rules['.bw-page-link:focus-visible'] = { 'z-index': '3', 'outline': '2px solid currentColor', 'outline-offset': '-2px' };

    // Breadcrumb (structural)
    rules['.bw-breadcrumb'] = { 'display': 'flex', 'flex-wrap': 'wrap', 'padding': '0 0', 'margin-bottom': '1rem', 'list-style': 'none' };
    rules['.bw-breadcrumb-item'] = { 'display': 'flex' };
    rules['.bw-breadcrumb-item + .bw-breadcrumb-item'] = { 'padding-left': '0.5rem' };
    rules['.bw-breadcrumb-item + .bw-breadcrumb-item::before'] = { 'float': 'left', 'padding-right': '0.5rem', 'content': '"/"' };
    rules['.bw-breadcrumb-item a'] = { 'text-decoration': 'none', 'transition': 'color 0.15s ease-out' };
    rules['.bw-breadcrumb-item.active'] = { 'font-weight': '500' };

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
      'font-family': 'inherit', 'transition': 'color 0.15s ease-out, background-color 0.15s ease-out'
    };
    rules['.bw-accordion-button::after'] = {
      'flex-shrink': '0', 'width': '1.25rem', 'height': '1.25rem', 'margin-left': 'auto',
      'content': '""', 'background-repeat': 'no-repeat', 'background-size': '1.25rem',
      'transition': 'transform 0.2s ease-out'
    };
    rules['.bw-accordion-button:not(.bw-collapsed)::after'] = { 'transform': 'rotate(-180deg)' };
    rules['.bw-accordion-collapse'] = { 'max-height': '0', 'overflow': 'hidden', 'transition': 'max-height 0.3s ease' };
    rules['.bw-accordion-collapse.bw-collapse-show'] = { 'max-height': 'none' };
    rules['.bw-accordion-body'] = { 'padding': '1rem 1.25rem' };

    // Modal (structural)
    rules['.bw-modal'] = {
      'display': 'flex', 'align-items': 'center', 'justify-content': 'center',
      'position': 'fixed', 'top': '0', 'left': '0', 'width': '100%', 'height': '100%',
      'z-index': '1050', 'overflow-x': 'hidden', 'overflow-y': 'auto',
      'opacity': '0', 'visibility': 'hidden', 'pointer-events': 'none',
      'transition': 'opacity 0.2s ease, visibility 0.2s ease'
    };
    rules['.bw-modal.bw-modal-show'] = { 'opacity': '1', 'visibility': 'visible', 'pointer-events': 'auto' };
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

    // Carousel (structural)
    rules['.bw-carousel'] = { 'position': 'relative', 'overflow': 'hidden', 'border-radius': '8px' };
    rules['.bw-carousel-track'] = { 'display': 'flex', 'transition': 'transform 0.3s ease-out', 'height': '100%' };
    rules['.bw-carousel-slide'] = { 'min-width': '100%', 'flex-shrink': '0', 'overflow': 'hidden', 'position': 'relative', 'display': 'flex', 'align-items': 'center', 'justify-content': 'center' };
    rules['.bw-carousel-slide img'] = { 'width': '100%', 'height': '100%', 'object-fit': 'cover' };
    rules['.bw-carousel-caption'] = { 'position': 'absolute', 'bottom': '0', 'left': '0', 'right': '0', 'padding': '0.75rem 1rem' };
    rules['.bw-carousel-control'] = {
      'position': 'absolute', 'top': '50%', 'transform': 'translateY(-50%)', 'width': '40px', 'height': '40px',
      'border': 'none', 'border-radius': '50%', 'cursor': 'pointer', 'display': 'flex', 'align-items': 'center',
      'justify-content': 'center', 'z-index': '2', 'padding': '0', 'transition': 'background-color 0.2s ease'
    };
    rules['.bw-carousel-control img'] = { 'width': '20px', 'height': '20px', 'pointer-events': 'none' };
    rules['.bw-carousel-control-prev'] = { 'left': '10px' };
    rules['.bw-carousel-control-next'] = { 'right': '10px' };
    rules['.bw-carousel-indicators'] = {
      'position': 'absolute', 'bottom': '12px', 'left': '50%', 'transform': 'translateX(-50%)',
      'display': 'flex', 'gap': '6px', 'z-index': '2'
    };
    rules['.bw-carousel-indicator'] = {
      'width': '10px', 'height': '10px', 'border-radius': '50%', 'border': '2px solid transparent',
      'padding': '0', 'cursor': 'pointer', 'transition': 'opacity 0.2s ease, background-color 0.2s ease'
    };

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
      'position': 'absolute', 'top': '100%', 'left': '0', 'z-index': '1000', 'display': 'block',
      'min-width': '10rem', 'padding': '0.5rem 0', 'margin': '0.125rem 0 0',
      'background-clip': 'padding-box', 'border-radius': '6px',
      'opacity': '0', 'visibility': 'hidden', 'transform': 'translateY(-4px)',
      'pointer-events': 'none',
      'transition': 'opacity 0.15s ease, transform 0.15s ease, visibility 0.15s ease'
    };
    rules['.bw-dropdown-menu.bw-dropdown-show'] = { 'opacity': '1', 'visibility': 'visible', 'transform': 'translateY(0)', 'pointer-events': 'auto' };
    rules['.bw-dropdown-menu-end'] = { 'left': 'auto', 'right': '0' };
    rules['.bw-dropdown-item'] = {
      'display': 'block', 'width': '100%', 'padding': '0.375rem 1rem', 'clear': 'both',
      'font-weight': '400', 'text-align': 'inherit', 'text-decoration': 'none', 'white-space': 'nowrap',
      'background-color': 'transparent', 'border': '0', 'font-size': '0.9375rem',
      'transition': 'background-color 0.15s, color 0.15s'
    };
    rules['.bw-dropdown-item:focus-visible'] = { 'outline': '2px solid currentColor', 'outline-offset': '-2px' };
    rules['.bw-dropdown-divider'] = { 'height': '0', 'margin': '0.5rem 0', 'overflow': 'hidden', 'opacity': '1' };

    // Switch (structural)
    rules['.bw-form-switch'] = { 'padding-left': '2.5em' };
    rules['.bw-form-switch .bw-switch-input'] = {
      'width': '2em', 'height': '1.125em', 'margin-left': '-2.5em', 'border-radius': '2em',
      'appearance': 'none', 'background-position': 'left center', 'background-repeat': 'no-repeat',
      'background-size': 'contain', 'transition': 'background-position 0.15s ease-out, background-color 0.15s ease-out',
      'cursor': 'pointer'
    };
    rules['.bw-form-switch .bw-switch-input:checked'] = { 'background-position': 'right center' };
    rules['.bw-form-switch .bw-switch-input:disabled'] = { 'opacity': '0.5', 'cursor': 'not-allowed' };

    // Skeleton (structural)
    rules['.bw-skeleton'] = { 'border-radius': '4px', 'background-size': '400% 100%', 'animation': 'bw-skeleton-shimmer 1.4s ease infinite' };
    rules['.bw-skeleton-text'] = { 'height': '1em', 'margin-bottom': '0.5rem' };
    rules['.bw-skeleton-circle'] = { 'border-radius': '50%' };
    rules['.bw-skeleton-rect'] = { 'border-radius': '8px' };
    rules['.bw-skeleton-group'] = { 'display': 'flex', 'flex-direction': 'column' };
    rules['@keyframes bw-skeleton-shimmer'] = { '0%': { 'background-position': '100% 50%' }, '100%': { 'background-position': '0 50%' } };

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

    // Stat card (structural)
    rules['.bw-stat-card'] = {
      'border-radius': '8px', 'padding': '1.25rem',
      'border-left': '4px solid transparent',
      'transition': 'box-shadow 0.15s ease-out, transform 0.15s ease-out'
    };
    rules['.bw-stat-card:hover'] = { 'transform': 'translateY(-1px)' };
    rules['.bw-stat-icon'] = { 'font-size': '1.5rem', 'margin-bottom': '0.5rem' };
    rules['.bw-stat-value'] = { 'font-size': '2rem', 'font-weight': '700', 'line-height': '1.2' };
    rules['.bw-stat-label'] = { 'font-size': '0.875rem', 'margin-top': '0.25rem' };
    rules['.bw-stat-change'] = { 'font-size': '0.875rem', 'font-weight': '500', 'margin-top': '0.5rem' };

    // Tooltip (structural)
    rules['.bw-tooltip-wrapper'] = { 'position': 'relative', 'display': 'inline-block' };
    rules['.bw-tooltip'] = {
      'position': 'absolute', 'z-index': '999',
      'padding': '0.375rem 0.75rem', 'border-radius': '4px', 'font-size': '0.875rem',
      'white-space': 'nowrap', 'pointer-events': 'none',
      'opacity': '0', 'visibility': 'hidden',
      'transition': 'opacity 0.15s ease, visibility 0.15s ease, transform 0.15s ease'
    };
    rules['.bw-tooltip.bw-tooltip-show'] = { 'opacity': '1', 'visibility': 'visible' };
    rules['.bw-tooltip-top'] = { 'bottom': '100%', 'left': '50%', 'transform': 'translateX(-50%) translateY(-4px)', 'margin-bottom': '4px' };
    rules['.bw-tooltip-top.bw-tooltip-show'] = { 'transform': 'translateX(-50%) translateY(0)' };
    rules['.bw-tooltip-bottom'] = { 'top': '100%', 'left': '50%', 'transform': 'translateX(-50%) translateY(4px)', 'margin-top': '4px' };
    rules['.bw-tooltip-bottom.bw-tooltip-show'] = { 'transform': 'translateX(-50%) translateY(0)' };
    rules['.bw-tooltip-left'] = { 'right': '100%', 'top': '50%', 'transform': 'translateY(-50%) translateX(-4px)', 'margin-right': '4px' };
    rules['.bw-tooltip-left.bw-tooltip-show'] = { 'transform': 'translateY(-50%) translateX(0)' };
    rules['.bw-tooltip-right'] = { 'left': '100%', 'top': '50%', 'transform': 'translateY(-50%) translateX(4px)', 'margin-left': '4px' };
    rules['.bw-tooltip-right.bw-tooltip-show'] = { 'transform': 'translateY(-50%) translateX(0)' };

    // Search input (structural)
    rules['.bw-search-input'] = { 'position': 'relative', 'display': 'flex', 'align-items': 'center' };
    rules['.bw-search-input .bw-search-field'] = { 'padding-right': '2.5rem' };
    rules['.bw-search-clear'] = {
      'position': 'absolute', 'right': '0.5rem',
      'display': 'flex', 'align-items': 'center', 'justify-content': 'center',
      'width': '1.5rem', 'height': '1.5rem',
      'border': 'none', 'background': 'none',
      'font-size': '1.25rem', 'cursor': 'pointer', 'padding': '0',
      'border-radius': '50%', 'transition': 'color 0.15s ease-out'
    };

    // Range slider (structural)
    rules['.bw-range-wrapper'] = { 'margin-bottom': '1rem' };
    rules['.bw-range-label'] = { 'display': 'flex', 'justify-content': 'space-between', 'align-items': 'center', 'margin-bottom': '0.5rem', 'font-size': '0.875rem', 'font-weight': '500' };
    rules['.bw-range-value'] = { 'font-weight': '600' };
    rules['.bw-range'] = { 'width': '100%', 'height': '0.5rem', 'padding': '0', 'appearance': 'none', 'border': 'none', 'border-radius': '0.25rem', 'cursor': 'pointer', 'outline': 'none' };
    rules['.bw-range:disabled'] = { 'opacity': '0.5', 'cursor': 'not-allowed' };

    // Media object (structural)
    rules['.bw-media'] = { 'display': 'flex', 'align-items': 'flex-start', 'gap': '1rem' };
    rules['.bw-media-reverse'] = { 'flex-direction': 'row-reverse' };
    rules['.bw-media-img'] = { 'border-radius': '50%', 'object-fit': 'cover', 'flex-shrink': '0' };
    rules['.bw-media-body'] = { 'flex': '1', 'min-width': '0' };
    rules['.bw-media-title'] = { 'margin': '0 0 0.25rem 0', 'font-size': '1rem', 'font-weight': '600', 'line-height': '1.3' };

    // File upload (structural)
    rules['.bw-file-upload'] = {
      'display': 'flex', 'flex-direction': 'column', 'align-items': 'center', 'justify-content': 'center',
      'padding': '2rem', 'border': '2px dashed transparent', 'border-radius': '8px',
      'cursor': 'pointer', 'text-align': 'center', 'position': 'relative',
      'transition': 'border-color 0.15s ease-out, background-color 0.15s ease-out'
    };
    rules['.bw-file-upload-icon'] = { 'font-size': '2rem', 'margin-bottom': '0.5rem' };
    rules['.bw-file-upload-text'] = { 'font-size': '0.875rem' };
    rules['.bw-file-upload-input'] = {
      'position': 'absolute', 'width': '1px', 'height': '1px', 'padding': '0',
      'margin': '-1px', 'overflow': 'hidden', 'clip': 'rect(0,0,0,0)', 'border': '0'
    };

    // Timeline (structural)
    rules['.bw-timeline'] = { 'position': 'relative', 'padding-left': '2rem' };
    rules['.bw-timeline-item'] = { 'position': 'relative', 'padding-bottom': '1.5rem' };
    rules['.bw-timeline-item:last-child'] = { 'padding-bottom': '0' };
    rules['.bw-timeline-marker'] = { 'position': 'absolute', 'left': '-1.75rem', 'top': '0.25rem', 'width': '0.75rem', 'height': '0.75rem', 'border-radius': '50%' };
    rules['.bw-timeline-content'] = { 'padding-left': '0.5rem' };
    rules['.bw-timeline-date'] = { 'font-size': '0.75rem', 'margin-bottom': '0.25rem', 'font-weight': '500' };
    rules['.bw-timeline-title'] = { 'font-size': '1rem', 'font-weight': '600', 'margin': '0 0 0.25rem 0', 'line-height': '1.3' };
    rules['.bw-timeline-text'] = { 'font-size': '0.875rem', 'margin': '0', 'line-height': '1.5' };

    // Stepper (structural)
    rules['.bw-stepper'] = { 'display': 'flex', 'gap': '0' };
    rules['.bw-step'] = { 'flex': '1', 'display': 'flex', 'flex-direction': 'column', 'align-items': 'center', 'text-align': 'center', 'position': 'relative' };
    rules['.bw-step-indicator'] = { 'width': '2rem', 'height': '2rem', 'border-radius': '50%', 'display': 'flex', 'align-items': 'center', 'justify-content': 'center', 'font-size': '0.875rem', 'font-weight': '600', 'position': 'relative', 'z-index': '1', 'transition': 'background-color 0.2s ease-out, color 0.2s ease-out' };
    rules['.bw-step-body'] = { 'margin-top': '0.5rem' };
    rules['.bw-step-label'] = { 'font-size': '0.875rem', 'font-weight': '500' };
    rules['.bw-step-description'] = { 'font-size': '0.75rem', 'margin-top': '0.125rem' };

    // Chip input (structural)
    rules['.bw-chip-input'] = { 'display': 'flex', 'flex-wrap': 'wrap', 'align-items': 'center', 'gap': '0.375rem', 'padding': '0.375rem 0.5rem', 'border-radius': '6px', 'min-height': '2.5rem', 'cursor': 'text', 'transition': 'border-color 0.15s ease-out, box-shadow 0.15s ease-out' };
    rules['.bw-chip'] = { 'display': 'inline-flex', 'align-items': 'center', 'gap': '0.25rem', 'padding': '0.125rem 0.5rem', 'border-radius': '1rem', 'font-size': '0.8125rem', 'line-height': '1.5', 'white-space': 'nowrap' };
    rules['.bw-chip-remove'] = { 'display': 'inline-flex', 'align-items': 'center', 'justify-content': 'center', 'width': '1rem', 'height': '1rem', 'border': 'none', 'background': 'none', 'font-size': '0.875rem', 'cursor': 'pointer', 'padding': '0', 'border-radius': '50%', 'transition': 'color 0.15s ease-out, background-color 0.15s ease-out' };
    rules['.bw-chip-field'] = { 'flex': '1', 'min-width': '80px', 'border': 'none', 'outline': 'none', 'font-size': '0.875rem', 'padding': '0.125rem 0', 'background': 'transparent' };

    // Popover (structural)
    rules['.bw-popover-wrapper'] = { 'position': 'relative', 'display': 'inline-block' };
    rules['.bw-popover-trigger'] = { 'cursor': 'pointer' };
    rules['.bw-popover'] = {
      'position': 'absolute', 'z-index': '1000',
      'min-width': '200px', 'max-width': '320px',
      'border-radius': '8px',
      'pointer-events': 'none', 'opacity': '0', 'visibility': 'hidden',
      'transition': 'opacity 0.15s ease, visibility 0.15s ease, transform 0.15s ease'
    };
    rules['.bw-popover.bw-popover-show'] = { 'opacity': '1', 'visibility': 'visible', 'pointer-events': 'auto' };
    rules['.bw-popover-header'] = { 'padding': '0.625rem 0.875rem', 'font-weight': '600', 'font-size': '0.9375rem' };
    rules['.bw-popover-body'] = { 'padding': '0.75rem 0.875rem', 'font-size': '0.875rem', 'line-height': '1.5' };
    rules['.bw-popover-top'] = { 'bottom': '100%', 'left': '50%', 'transform': 'translateX(-50%) translateY(-8px)', 'margin-bottom': '8px' };
    rules['.bw-popover-top.bw-popover-show'] = { 'transform': 'translateX(-50%) translateY(0)' };
    rules['.bw-popover-bottom'] = { 'top': '100%', 'left': '50%', 'transform': 'translateX(-50%) translateY(8px)', 'margin-top': '8px' };
    rules['.bw-popover-bottom.bw-popover-show'] = { 'transform': 'translateX(-50%) translateY(0)' };
    rules['.bw-popover-left'] = { 'right': '100%', 'top': '50%', 'transform': 'translateY(-50%) translateX(-8px)', 'margin-right': '8px' };
    rules['.bw-popover-left.bw-popover-show'] = { 'transform': 'translateY(-50%) translateX(0)' };
    rules['.bw-popover-right'] = { 'left': '100%', 'top': '50%', 'transform': 'translateY(-50%) translateX(8px)', 'margin-left': '8px' };
    rules['.bw-popover-right.bw-popover-show'] = { 'transform': 'translateY(-50%) translateX(0)' };

    // Bar chart (structural)
    rules['.bw-bar-chart-container'] = {
      'padding': '1rem', 'border': '1px solid transparent', 'border-radius': '8px'
    };
    rules['.bw-bar-chart'] = {
      'display': 'flex', 'align-items': 'flex-end', 'gap': '6px', 'padding': '0 0.5rem'
    };
    rules['.bw-bar-group'] = {
      'flex': '1', 'display': 'flex', 'flex-direction': 'column',
      'align-items': 'center', 'height': '100%', 'justify-content': 'flex-end'
    };
    rules['.bw-bar'] = {
      'width': '100%', 'border-radius': '3px 3px 0 0',
      'transition': 'height 0.3s ease-out', 'min-height': '4px'
    };
    rules['.bw-bar:hover'] = { 'opacity': '0.85' };
    rules['.bw-bar-value'] = {
      'font-size': '0.65rem', 'font-weight': '600', 'margin-bottom': '2px', 'text-align': 'center'
    };
    rules['.bw-bar-label'] = {
      'font-size': '0.7rem', 'margin-top': '4px', 'text-align': 'center'
    };
    rules['.bw-bar-chart-title'] = {
      'font-size': '1.1rem', 'font-weight': '600', 'margin': '0 0 0.75rem 0'
    };

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

    // Accessibility: reduce motion for users who prefer it
    rules['@media (prefers-reduced-motion: reduce)'] = {
      '*, *::before, *::after': {
        'animation-duration': '0.01ms !important',
        'animation-iteration-count': '1 !important',
        'transition-duration': '0.01ms !important',
        'scroll-behavior': 'auto !important'
      }
    };

    return addUnderscoreAliases(rules);
  }

  // =========================================================================
  // getAllStyles — backwards compatible
  // =========================================================================

  /**
   * Add underscore aliases for all `.bw-` selectors.
   *
   * CSS CLASS NAMING CONVENTION:
   *
   * Canonical form:  `.bw-btn`, `.bw-card`, `.bw-table-hover`  (hyphens)
   * Underscore alias: `.bw_btn`, `.bw_card`, `.bw_table_hover`  (underscores)
   *
   * Both forms are valid in HTML and produce identical results. The hyphen
   * form is canonical (used in docs, generated CSS, component output).
   * Underscore aliases exist because:
   *   1. TACO attribute keys use underscores (`bw_id`, `bw_meta`) — no
   *      quoting needed in JS object literals
   *   2. Some users prefer underscores for consistency with JS identifiers
   *
   * Use `bw.normalizeClass()` to convert underscore classes to canonical
   * hyphen form at runtime if needed.
   *
   * @param {Object} rules - CSS rules object
   * @returns {Object} Rules with underscore aliases added (both forms work)
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
  //
  // DESIGN NOTE — Why no CSS custom properties (CSS variables)?
  //
  // Bitwrench targets IE11 as Tier 1 (see dev/bw2x-compatibility.md).
  // CSS custom properties (var(--color-primary)) are not supported in IE11.
  //
  // Instead, bitwrench uses class-scoped CSS generation:
  //   1. `defaultStyles.*` provides hardcoded cosmetic defaults
  //   2. `generateTheme(name, config)` generates a complete set of
  //      class-scoped CSS rules from 3 seed colors (primary, secondary,
  //      tertiary) — all components are restyled with the new palette
  //   3. `generateAlternateCSS()` produces the alternate (dark/light)
  //      variant scoped under `.bw-theme-alt`
  //
  // This achieves full theme customization without CSS variables:
  //   bw.generateTheme('ocean', { primary: '#006666', secondary: '#cc6633' })
  //   → generates .ocean .bw-btn-primary { background: #006666; } etc.
  //
  // When IE11 support is dropped, CSS custom properties can be added as
  // an optimization (one rule with var() instead of many scoped rules).
  // The generateTheme() API stays the same — only the output format changes.

  let theme = {
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
   * Generate alternate-palette CSS scoped under `.bw-theme-alt`.
   * Uses the same `generateThemedCSS()` pipeline as the primary palette —
   * both sides go through identical code paths.
   *
   * @param {string} name - Theme scope name (e.g. 'ocean'). '' for global.
   * @param {Object} altPalette - From derivePalette(deriveAlternateConfig(...))
   * @param {Object} layout - From resolveLayout()
   * @returns {Object} CSS rules object scoped under .bw-theme-alt (+ optional .name)
   */
  function generateAlternateCSS(name, altPalette, layout) {
    // Generate themed CSS using the same pipeline as primary
    var rawRules = generateThemedCSS('', altPalette, layout);

    // Re-scope every selector under .bw-theme-alt (+ optional theme name)
    var altPrefix = name ? '.' + name + '.bw-theme-alt' : '.bw-theme-alt';
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
          // 'body' selector gets special treatment: .bw-theme-alt body
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
                tabindex: index === actualActiveIndex ? '0' : '-1',
                'aria-selected': index === actualActiveIndex ? 'true' : 'false',
                'data-tab-index': index,
                onclick: (e) => {
                  const tabsContainer = e.target.closest('.bw-tabs');
                  const allTabs = tabsContainer.querySelectorAll('.bw-nav-link');
                  const allPanes = tabsContainer.querySelectorAll('.bw-tab-pane');

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
            'aria-label': 'Close',
            onclick: function(e) {
              var alert = e.target.closest('.bw-alert');
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

    const sizeClass = size === 'sm' ? ' bw-badge-sm' : size === 'lg' ? ' bw-badge-lg' : '';

    return {
      t: 'span',
      a: {
        class: `bw-badge bw-badge-${variant}${sizeClass} ${pill ? 'bw-badge-pill' : ''} ${className}`.trim()
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
      var validClass = validation === 'valid' ? 'bw-is-valid' : validation === 'invalid' ? 'bw-is-invalid' : '';
      if (validClass) {
        styledInput.a.class = ((styledInput.a.class || '') + ' ' + validClass).trim();
      }
    }

    return {
      t: 'div',
      a: { class: 'bw-form-group' },
      c: [
        label && {
          t: 'label',
          a: { for: id, class: 'bw-form-label' },
          c: required ? [label, { t: 'span', a: { class: 'bw-text-danger', style: 'margin-left: 0.25rem' }, c: '*' }] : label
        },
        styledInput,
        feedback && validation && {
          t: 'div',
          a: { class: validation === 'valid' ? 'bw-valid-feedback' : 'bw-invalid-feedback' },
          c: feedback
        },
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
      value,
      className = '',
      ...eventHandlers
    } = props;

    return {
      t: 'div',
      a: { class: `bw-form-check ${className}`.trim() },
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
            value,
            ...eventHandlers
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
                  class: 'bw-feature-icon bw-mb-3 bw-text-primary',
                  style: `font-size: ${iconSize};`
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
                class: 'bw-copy-btn bw-code-copy-btn',
                onclick: function(e) {
                  navigator.clipboard.writeText(code).then(function() {
                    var btn = e.target;
                    var originalText = btn.textContent;
                    btn.textContent = 'Copied!';
                    btn.classList.add('bw-code-copy-btn-copied');
                    setTimeout(function() {
                      btn.textContent = originalText;
                      btn.classList.remove('bw-code-copy-btn-copied');
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
                  a: { class: 'bw-code-pre' },
                  c: {
                    t: 'code',
                    a: { class: `bw-code-block language-${language}` },
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
        a: { class: 'bw-text-muted', style: 'margin-bottom: 1rem;' },
        c: description
      },
      makeTabs({ tabs})
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
      a: { class: `bw-page-item ${currentPage <= 1 ? 'bw-disabled' : ''}`.trim() },
      c: {
        t: 'a',
        a: { class: 'bw-page-link', href: '#', onclick: handleClick(currentPage - 1), 'aria-label': 'Previous' },
        c: '\u2039'
      }
    });

    // Page numbers
    for (var i = 1; i <= pages; i++) {
      (function(pageNum) {
        items.push({
          t: 'li',
          a: { class: `bw-page-item ${pageNum === currentPage ? 'bw-active' : ''}`.trim() },
          c: {
            t: 'a',
            a: { class: 'bw-page-link', href: '#', onclick: handleClick(pageNum) },
            c: '' + pageNum
          }
        });
      })(i);
    }

    // Next arrow
    items.push({
      t: 'li',
      a: { class: `bw-page-item ${currentPage >= pages ? 'bw-disabled' : ''}`.trim() },
      c: {
        t: 'a',
        a: { class: 'bw-page-link', href: '#', onclick: handleClick(currentPage + 1), 'aria-label': 'Next' },
        c: '\u203A'
      }
    });

    return {
      t: 'nav',
      a: { 'aria-label': 'Pagination' },
      c: {
        t: 'ul',
        a: {
          class: `bw-pagination ${size ? 'bw-pagination-' + size : ''} ${className}`.trim()
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
      a: { class: `bw-form-check ${className}`.trim() },
      c: [
        {
          t: 'input',
          a: {
            type: 'radio',
            class: 'bw-form-check-input',
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
          a: { class: 'bw-form-check-label', for: id },
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
        class: `${vertical ? 'bw-btn-group-vertical' : 'bw-btn-group'} ${size ? 'bw-btn-group-' + size : ''} ${className}`.trim(),
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
      a: { class: `bw-accordion ${className}`.trim() },
      c: items.map(function(item, index) {
        return {
          t: 'div',
          a: { class: 'bw-accordion-item' },
          c: [
            {
              t: 'h2',
              a: { class: 'bw-accordion-header' },
              c: {
                t: 'button',
                a: {
                  class: `bw-accordion-button ${item.open ? '' : 'bw-collapsed'}`.trim(),
                  type: 'button',
                  'aria-expanded': item.open ? 'true' : 'false',
                  'data-accordion-index': index,
                  onclick: function(e) {
                    var btn = e.target.closest('.bw-accordion-button');
                    var accordionEl = btn.closest('.bw-accordion');
                    var accordionItem = btn.closest('.bw-accordion-item');
                    var collapse = accordionItem.querySelector('.bw-accordion-collapse');
                    var isOpen = collapse.classList.contains('bw-collapse-show');

                    if (!multiOpen) {
                      // Animate-close all other open siblings
                      var allItems = accordionEl.querySelectorAll('.bw-accordion-item');
                      for (var j = 0; j < allItems.length; j++) {
                        if (allItems[j] === accordionItem) continue;
                        var sibCollapse = allItems[j].querySelector('.bw-accordion-collapse');
                        var sibBtn = allItems[j].querySelector('.bw-accordion-button');
                        if (sibCollapse.classList.contains('bw-collapse-show')) {
                          sibCollapse.style.maxHeight = sibCollapse.scrollHeight + 'px';
                          sibCollapse.offsetHeight; // force reflow
                          sibCollapse.style.maxHeight = '0px';
                          sibCollapse.classList.remove('bw-collapse-show');
                          sibBtn.classList.add('bw-collapsed');
                          sibBtn.setAttribute('aria-expanded', 'false');
                        }
                      }
                    }

                    if (isOpen) {
                      // Animate close
                      collapse.style.maxHeight = collapse.scrollHeight + 'px';
                      collapse.offsetHeight; // force reflow
                      collapse.style.maxHeight = '0px';
                      collapse.classList.remove('bw-collapse-show');
                      btn.classList.add('bw-collapsed');
                      btn.setAttribute('aria-expanded', 'false');
                    } else {
                      // Animate open
                      collapse.classList.add('bw-collapse-show');
                      collapse.style.maxHeight = '0px';
                      collapse.offsetHeight; // force reflow
                      collapse.style.maxHeight = collapse.scrollHeight + 'px';
                      btn.classList.remove('bw-collapsed');
                      btn.setAttribute('aria-expanded', 'true');
                      // After transition, allow dynamic content sizing
                      var onEnd = function(ev) {
                        if (ev.propertyName === 'max-height' && collapse.classList.contains('bw-collapse-show')) {
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
              a: { class: `bw-accordion-collapse ${item.open ? 'bw-collapse-show' : ''}`.trim() },
              c: {
                t: 'div',
                a: { class: 'bw-accordion-body' },
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

  /**
   * Imperative handle for a rendered modal component
   *
   * Provides `.show()`, `.hide()`, `.toggle()`, and `.destroy()` methods
   * for controlling the modal programmatically.
   *
   * @category Component Handles
   */
  class ModalHandle {
    /**
     * @param {Element} element - The modal backdrop DOM element
     * @param {Object} taco - The original TACO object
     */
    constructor(element, taco) {
      this.element = element;
      this._taco = taco;
      this._escHandler = null;
    }

    /** Show the modal */
    show() {
      this.element.classList.add('bw-modal-show');
      document.body.style.overflow = 'hidden';
      return this;
    }

    /** Hide the modal */
    hide() {
      this.element.classList.remove('bw-modal-show');
      document.body.style.overflow = '';
      return this;
    }

    /** Toggle modal visibility */
    toggle() {
      if (this.element.classList.contains('bw-modal-show')) {
        this.hide();
      } else {
        this.show();
      }
      return this;
    }

    /** Remove the modal from DOM and clean up */
    destroy() {
      this.hide();
      if (this._escHandler) {
        document.removeEventListener('keydown', this._escHandler);
      }
      if (this.element.parentNode) {
        this.element.parentNode.removeChild(this.element);
      }
    }
  }

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
      var backdrop = el.closest('.bw-modal');
      if (backdrop) {
        backdrop.classList.remove('bw-modal-show');
        document.body.style.overflow = '';
      }
      if (onClose) onClose();
    }

    return {
      t: 'div',
      a: { class: `bw-modal ${className}`.trim() },
      c: {
        t: 'div',
        a: { class: `bw-modal-dialog ${size ? 'bw-modal-' + size : ''}`.trim() },
        c: {
          t: 'div',
          a: { class: 'bw-modal-content' },
          c: [
            (title || closeButton) && {
              t: 'div',
              a: { class: 'bw-modal-header' },
              c: [
                title && { t: 'h5', a: { class: 'bw-modal-title' }, c: title },
                closeButton && {
                  t: 'button',
                  a: {
                    type: 'button',
                    class: 'bw-close',
                    'aria-label': 'Close',
                    onclick: function(e) { closeModal(e.target); }
                  },
                  c: '\u00D7'
                }
              ].filter(Boolean)
            },
            content && {
              t: 'div',
              a: { class: 'bw-modal-body' },
              c: content
            },
            footer && {
              t: 'div',
              a: { class: 'bw-modal-footer' },
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
            if (e.key === 'Escape' && el.classList.contains('bw-modal-show')) {
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
        class: `bw-toast bw-toast-${variant} ${className}`.trim(),
        role: 'alert',
        'data-position': position
      },
      c: [
        (title) && {
          t: 'div',
          a: { class: 'bw-toast-header' },
          c: [
            { t: 'strong', c: title },
            {
              t: 'button',
              a: {
                type: 'button',
                class: 'bw-close',
                'aria-label': 'Close',
                onclick: function(e) {
                  var toast = e.target.closest('.bw-toast');
                  if (toast) {
                    toast.classList.add('bw-toast-hiding');
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
          a: { class: 'bw-toast-body' },
          c: content
        }
      ].filter(Boolean),
      o: {
        type: 'toast',
        mounted: function(el) {
          // Trigger show animation
          requestAnimationFrame(function() {
            el.classList.add('bw-toast-show');
          });
          // Auto-dismiss
          if (autoDismiss) {
            setTimeout(function() {
              el.classList.add('bw-toast-hiding');
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
          class: `bw-btn bw-btn-${variant} bw-dropdown-toggle`,
          type: 'button',
          onclick: function(e) {
            var dropdown = e.target.closest('.bw-dropdown');
            var menu = dropdown.querySelector('.bw-dropdown-menu');
            menu.classList.toggle('bw-dropdown-show');
          }
        },
        c: trigger || 'Dropdown'
      };
    } else {
      triggerTaco = trigger;
    }

    return {
      t: 'div',
      a: { class: `bw-dropdown ${className}`.trim() },
      c: [
        triggerTaco,
        {
          t: 'div',
          a: { class: `bw-dropdown-menu ${align === 'end' ? 'bw-dropdown-menu-end' : ''}`.trim() },
          c: items.map(function(item) {
            if (item.divider) {
              return { t: 'hr', a: { class: 'bw-dropdown-divider' } };
            }
            return {
              t: 'a',
              a: {
                class: `bw-dropdown-item ${item.disabled ? 'disabled' : ''}`.trim(),
                href: item.href || '#',
                onclick: item.disabled ? undefined : function(e) {
                  if (!item.href) e.preventDefault();
                  var dropdown = e.target.closest('.bw-dropdown');
                  var menu = dropdown.querySelector('.bw-dropdown-menu');
                  menu.classList.remove('bw-dropdown-show');
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
              var menu = el.querySelector('.bw-dropdown-menu');
              if (menu) menu.classList.remove('bw-dropdown-show');
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
      a: { class: `bw-form-check bw-form-switch ${className}`.trim() },
      c: [
        {
          t: 'input',
          a: {
            type: 'checkbox',
            class: 'bw-form-check-input bw-switch-input',
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
          a: { class: 'bw-form-check-label', for: id },
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
          class: `bw-skeleton bw-skeleton-circle ${className}`.trim(),
          style: { width: circleSize, height: circleSize }
        }
      };
    }

    if (variant === 'rect') {
      return {
        t: 'div',
        a: {
          class: `bw-skeleton bw-skeleton-rect ${className}`.trim(),
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
          class: `bw-skeleton bw-skeleton-text ${className}`.trim(),
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
          class: 'bw-skeleton bw-skeleton-text',
          style: {
            width: i === count - 1 ? '75%' : (width || '100%'),
            height: height || '1em'
          }
        }
      });
    }

    return {
      t: 'div',
      a: { class: `bw-skeleton-group ${className}`.trim() },
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
          class: `bw-avatar bw-avatar-${size} ${className}`.trim(),
          src: src,
          alt: alt
        }
      };
    }

    return {
      t: 'div',
      a: {
        class: `bw-avatar bw-avatar-${size} bw-avatar-${variant} ${className}`.trim()
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
      var total = carouselEl.querySelectorAll('.bw-carousel-slide').length;
      if (index < 0) index = total - 1;
      if (index >= total) index = 0;
      carouselEl.setAttribute('data-carousel-index', index);
      var track = carouselEl.querySelector('.bw-carousel-track');
      track.style.transform = 'translateX(-' + (index * 100) + '%)';
      // Update indicators
      var indicators = carouselEl.querySelectorAll('.bw-carousel-indicator');
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
          a: { class: 'bw-carousel-caption' },
          c: item.caption
        }
      ].filter(Boolean);

      return {
        t: 'div',
        a: { class: 'bw-carousel-slide' },
        c: slideContent.length === 1 ? slideContent[0] : slideContent
      };
    });

    var children = [
      // Track
      {
        t: 'div',
        a: {
          class: 'bw-carousel-track',
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
          class: 'bw-carousel-control bw-carousel-control-prev',
          type: 'button',
          'aria-label': 'Previous slide',
          onclick: function(e) {
            var carousel = e.target.closest('.bw-carousel');
            var idx = parseInt(carousel.getAttribute('data-carousel-index') || '0');
            goToSlide(carousel, idx - 1);
          }
        },
        c: { t: 'img', a: { src: prevArrow, alt: '', role: 'presentation' } }
      });
      children.push({
        t: 'button',
        a: {
          class: 'bw-carousel-control bw-carousel-control-next',
          type: 'button',
          'aria-label': 'Next slide',
          onclick: function(e) {
            var carousel = e.target.closest('.bw-carousel');
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
        a: { class: 'bw-carousel-indicators' },
        c: items.map(function(_, i) {
          return {
            t: 'button',
            a: {
              class: 'bw-carousel-indicator' + (i === startIndex ? ' active' : ''),
              type: 'button',
              'aria-label': 'Go to slide ' + (i + 1),
              'data-slide-index': i,
              onclick: function(e) {
                var carousel = e.target.closest('.bw-carousel');
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
        class: ('bw-carousel ' + className).trim(),
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
      'bw-stat-card',
      variant ? 'bw-stat-card-' + variant : '',
      className
    ].filter(Boolean).join(' ').trim();

    var children = [];

    if (icon) {
      children.push({
        t: 'div',
        a: { class: 'bw-stat-icon' },
        c: icon
      });
    }

    children.push({
      t: 'div',
      a: { class: 'bw-stat-value' },
      c: formatValue(value, format)
    });

    if (label) {
      children.push({
        t: 'div',
        a: { class: 'bw-stat-label' },
        c: label
      });
    }

    if (change !== undefined && change !== null) {
      children.push({
        t: 'div',
        a: {
          class: 'bw-stat-change ' + (change >= 0 ? 'bw-stat-change-up' : 'bw-stat-change-down')
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
      a: { class: ('bw-tooltip-wrapper ' + className).trim() },
      c: [
        content,
        {
          t: 'span',
          a: {
            class: 'bw-tooltip bw-tooltip-' + placement,
            role: 'tooltip'
          },
          c: text
        }
      ],
      o: {
        type: 'tooltip',
        mounted: function(el) {
          var tip = el.querySelector('.bw-tooltip');
          el.addEventListener('mouseenter', function() {
            tip.classList.add('bw-tooltip-show');
          });
          el.addEventListener('mouseleave', function() {
            tip.classList.remove('bw-tooltip-show');
          });
          el.addEventListener('focusin', function() {
            tip.classList.add('bw-tooltip-show');
          });
          el.addEventListener('focusout', function() {
            tip.classList.remove('bw-tooltip-show');
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
        a: { class: 'bw-popover-header' },
        c: title
      },
      content && {
        t: 'div',
        a: { class: 'bw-popover-body' },
        c: content
      }
    ].filter(Boolean);

    return {
      t: 'span',
      a: { class: ('bw-popover-wrapper ' + className).trim() },
      c: [
        {
          t: 'span',
          a: {
            class: 'bw-popover-trigger',
            onclick: function(e) {
              var wrapper = e.target.closest('.bw-popover-wrapper');
              var pop = wrapper.querySelector('.bw-popover');
              pop.classList.toggle('bw-popover-show');
            }
          },
          c: trigger
        },
        {
          t: 'div',
          a: {
            class: 'bw-popover bw-popover-' + placement
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
              var pop = el.querySelector('.bw-popover');
              if (pop) pop.classList.remove('bw-popover-show');
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
      a: { class: ('bw-search-input ' + className).trim() },
      c: [
        {
          t: 'input',
          a: {
            type: 'search',
            class: 'bw-form-control bw-search-field',
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
              var wrapper = e.target.closest('.bw-search-input');
              var clearBtn = wrapper.querySelector('.bw-search-clear');
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
            class: 'bw-search-clear',
            'aria-label': 'Clear search',
            style: value ? undefined : 'display: none',
            onclick: function(e) {
              var wrapper = e.target.closest('.bw-search-input');
              var input = wrapper.querySelector('.bw-search-field');
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
          a: { class: 'bw-range-value' },
          c: '' + value
        });
      }
      children.push({
        t: 'div',
        a: { class: 'bw-range-label' },
        c: labelContent
      });
    }

    // Wrap oninput to update value display
    var userOnInput = eventHandlers.oninput;
    if (showValue) {
      eventHandlers.oninput = function(e) {
        var wrapper = e.target.closest('.bw-range-wrapper');
        var valDisplay = wrapper.querySelector('.bw-range-value');
        if (valDisplay) valDisplay.textContent = e.target.value;
        if (userOnInput) userOnInput(e);
      };
    }

    children.push({
      t: 'input',
      a: {
        type: 'range',
        class: 'bw-range',
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
      a: { class: ('bw-range-wrapper ' + className).trim() },
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
        class: 'bw-media-img',
        src: src,
        alt: alt,
        style: 'width:' + imageSize + ';height:' + imageSize
      }
    } : null;

    var bodyEl = {
      t: 'div',
      a: { class: 'bw-media-body' },
      c: [
        title && { t: 'h5', a: { class: 'bw-media-title' }, c: title },
        content
      ].filter(Boolean)
    };

    return {
      t: 'div',
      a: { class: ('bw-media ' + (reverse ? 'bw-media-reverse ' : '') + className).trim() },
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
        class: ('bw-file-upload ' + className).trim(),
        tabindex: '0',
        role: 'button',
        'aria-label': text
      },
      c: [
        { t: 'div', a: { class: 'bw-file-upload-icon' }, c: '\uD83D\uDCC1' },
        { t: 'div', a: { class: 'bw-file-upload-text' }, c: text },
        {
          t: 'input',
          a: {
            type: 'file',
            class: 'bw-file-upload-input',
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
          var input = el.querySelector('.bw-file-upload-input');

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
            el.classList.add('bw-file-upload-active');
          });
          el.addEventListener('dragleave', function() {
            el.classList.remove('bw-file-upload-active');
          });
          el.addEventListener('drop', function(e) {
            e.preventDefault();
            el.classList.remove('bw-file-upload-active');
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
      a: { class: ('bw-timeline ' + className).trim() },
      c: items.map(function(item) {
        return {
          t: 'div',
          a: { class: 'bw-timeline-item' },
          c: [
            {
              t: 'div',
              a: { class: 'bw-timeline-marker bw-timeline-marker-' + (item.variant || 'primary') }
            },
            {
              t: 'div',
              a: { class: 'bw-timeline-content' },
              c: [
                item.date && {
                  t: 'div',
                  a: { class: 'bw-timeline-date' },
                  c: item.date
                },
                item.title && {
                  t: 'h5',
                  a: { class: 'bw-timeline-title' },
                  c: item.title
                },
                item.content && (typeof item.content === 'string'
                  ? { t: 'p', a: { class: 'bw-timeline-text' }, c: item.content }
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
      a: { class: ('bw-stepper ' + className).trim(), role: 'list' },
      c: steps.map(function(step, index) {
        var state = index < currentStep ? 'completed' : index === currentStep ? 'active' : 'pending';
        return {
          t: 'div',
          a: {
            class: 'bw-step bw-step-' + state,
            role: 'listitem',
            'aria-current': state === 'active' ? 'step' : undefined
          },
          c: [
            {
              t: 'div',
              a: { class: 'bw-step-indicator' },
              c: state === 'completed' ? '\u2713' : '' + (index + 1)
            },
            {
              t: 'div',
              a: { class: 'bw-step-body' },
              c: [
                { t: 'div', a: { class: 'bw-step-label' }, c: step.label },
                step.description && { t: 'div', a: { class: 'bw-step-description' }, c: step.description }
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
        a: { class: 'bw-chip', 'data-chip-value': text },
        c: [
          text,
          {
            t: 'button',
            a: {
              type: 'button',
              class: 'bw-chip-remove',
              'aria-label': 'Remove ' + text,
              onclick: function(e) {
                var chip = e.target.closest('.bw-chip');
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
      a: { class: ('bw-chip-input ' + className).trim() },
      c: [
        ...chips.map(makeChipEl),
        {
          t: 'input',
          a: {
            type: 'text',
            class: 'bw-chip-field',
            placeholder: placeholder,
            onkeydown: function(e) {
              if (e.key === 'Enter' && e.target.value.trim()) {
                e.preventDefault();
                var val = e.target.value.trim();
                var wrapper = e.target.closest('.bw-chip-input');
                // Insert chip before the input
                var chipEl = document.createElement('span');
                chipEl.className = 'bw-chip';
                chipEl.setAttribute('data-chip-value', val);
                chipEl.innerHTML = '';
                chipEl.textContent = val;
                var removeBtn = document.createElement('button');
                removeBtn.type = 'button';
                removeBtn.className = 'bw-chip-remove';
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
                var wrapper = e.target.closest('.bw-chip-input');
                var chipEls = wrapper.querySelectorAll('.bw-chip');
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

  const componentHandles = {
    card: CardHandle,
    table: TableHandle,
    navbar: NavbarHandle,
    tabs: TabsHandle,
    modal: ModalHandle
  };

  var components = /*#__PURE__*/Object.freeze({
    __proto__: null,
    CardHandle: CardHandle,
    ModalHandle: ModalHandle,
    NavbarHandle: NavbarHandle,
    TableHandle: TableHandle,
    TabsHandle: TabsHandle,
    componentHandles: componentHandles,
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
    makeTooltip: makeTooltip
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
    //   - data-bw-id attribute (user-declared addressable elements)
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
   * data-bw-id attribute selector.
   *
   * @param {string|Element} id - Element ID, CSS selector, data-bw-id value, or DOM element
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

    // 4. Try data-bw-id attribute (for bw.uuid-generated IDs)
    if (!el) {
      el = document.querySelector('[data-bw-id="' + id + '"]');
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
   * id attributes, data-bw-id attributes, or both.
   *
   * @param {Element} el - DOM element to register
   * @param {string} [bwId] - data-bw-id value to register under
   * @category Internal
   */
  bw._registerNode = function(el, bwId) {
    if (!el) return;
    // Register under data-bw-id
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
   * @param {string} [bwId] - data-bw-id value to remove
   * @category Internal
   */
  bw._deregisterNode = function(el, bwId) {
    // Remove data-bw-id entry
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
    
    // Handle bw.raw() marked content
    if (taco && taco.__bw_raw) {
      return taco.v;
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
          .filter(([, v]) => v != null)
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
      attrStr = attrStr.replace(/class="([^"]*)"/, (_match, classes) => {
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

    // Handle bw.raw() marked content — inject as HTML
    if (taco && taco.__bw_raw) {
      var frag = document.createDocumentFragment();
      var tmp = document.createElement('span');
      tmp.innerHTML = taco.v;
      while (tmp.firstChild) frag.appendChild(tmp.firstChild);
      return frag;
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
    
    // Add children, building _bw_refs for fast parent→child access.
    // Children with data-bw-id or id attributes get local refs on the parent,
    // so o.render functions can access them without any DOM lookup.
    if (content != null) {
      if (Array.isArray(content)) {
        content.forEach(child => {
          if (child != null) {
            var childEl = bw.createDOM(child, options);
            el.appendChild(childEl);
            // Build local refs for addressable children
            var childBwId = (child && child.a) ? (child.a['data-bw-id'] || child.a.id) : null;
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
      } else if (typeof content === 'object' && content.t) {
        var childEl = bw.createDOM(content, options);
        el.appendChild(childEl);
        var childBwId = content.a ? (content.a['data-bw-id'] || content.a.id) : null;
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
      const id = attrs['data-bw-id'] || bw.uuid();
      el.setAttribute('data-bw-id', id);

      // Register in node cache under data-bw-id
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
    } else if (attrs['data-bw-id']) {
      // Element has explicit data-bw-id but no lifecycle hooks — still register it
      bw._registerNode(el, attrs['data-bw-id']);
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
    const savedBwId = targetEl.getAttribute('data-bw-id');
    const savedSubs = targetEl._bw_subs;

    // Temporarily remove _bw_subs so cleanup doesn't call them
    // (children's subs will still be cleaned up normally)
    delete targetEl._bw_subs;

    bw.cleanup(targetEl);

    // Restore the target's own state/render/subs after cleanup
    if (savedState !== undefined) targetEl._bw_state = savedState;
    if (savedRender) targetEl._bw_render = savedRender;
    if (savedBwId) {
      targetEl.setAttribute('data-bw-id', savedBwId);
      // Re-register mount point in node cache (cleanup deregistered it)
      bw._registerNode(targetEl, savedBwId);
    }
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

    // Find all elements with data-bw-id
    const elements = element.querySelectorAll('[data-bw-id]');

    elements.forEach(el => {
      const id = el.getAttribute('data-bw-id');
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
    const id = element.getAttribute('data-bw-id');
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
   * @param {string|Element} target - Element ID, data-bw-id, CSS selector, or DOM element
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
   * @param {string|Element} id - Element ID, data-bw-id, CSS selector, or DOM element.
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
   * @param {string|Element} target - Element ID, data-bw-id, CSS selector, or DOM element.
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
   * @param {string|Element} target - Element ID, data-bw-id, CSS selector, or DOM element.
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
    var aliasedRules = addUnderscoreAliases(themedRules);
    var cssStr = bw.css(aliasedRules);

    // Derive alternate palette (luminance-inverted)
    var altConfig = deriveAlternateConfig(fullConfig);
    var altPalette = derivePalette(altConfig);

    // Generate alternate CSS scoped under .bw-theme-alt
    var altRules = generateAlternateCSS(name, altPalette, layout);
    var aliasedAltRules = addUnderscoreAliases(altRules);
    var altCssStr = bw.css(aliasedAltRules);

    // Determine if primary is light-flavored
    var lightPrimary = isLightPalette(fullConfig);

    // Inject both CSS sets into DOM if requested
    var shouldInject = config.inject !== false;
    if (shouldInject && bw._isBrowser) {
      var styleId = name ? 'bw-theme-' + name : 'bw-theme-default';
      bw.injectCSS(cssStr, { id: styleId, append: false });

      var altStyleId = name ? 'bw-theme-' + name + '-alt' : 'bw-theme-default-alt';
      bw.injectCSS(altCssStr, { id: altStyleId, append: false });
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
   * by adding/removing the `bw-theme-alt` class on `<html>`.
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
      root.classList.add('bw-theme-alt');
    } else {
      root.classList.remove('bw-theme-alt');
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
    console.warn('bw.htmlTable() is deprecated. Use bw.makeTableFromArray() for TACO output or bw.makeTable() for object-array data.');
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
    console.warn('bw.htmlTabs() is deprecated. Use bw.makeTabs() instead.');
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
    console.warn('bw.selectTabContent() is deprecated. Use bw.makeTabs() instead.');
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

    // Build class list: always include bw-table, add striped/hover, append user className
    let cls = 'bw-table';
    if (striped) cls += ' bw-table-striped';
    if (hover) cls += ' bw-table-hover';
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
      return { t: 'div', a: { class: ('bw-bar-chart-container ' + className).trim() }, c: '' };
    }

    const values = data.map(function(d) { return Number(d[valueKey]) || 0; });
    const maxVal = Math.max.apply(null, values);

    const bars = data.map(function(d, i) {
      const val = values[i];
      const pct = maxVal > 0 ? (val / maxVal * 100) : 0;
      const formatted = formatValue ? formatValue(val) : String(val);

      const children = [];
      if (showValues) {
        children.push({ t: 'div', a: { class: 'bw-bar-value' }, c: formatted });
      }
      children.push({
        t: 'div',
        a: {
          class: 'bw-bar',
          style: 'height:' + pct + '%;background:' + color + ';'
        }
      });
      if (showLabels) {
        children.push({ t: 'div', a: { class: 'bw-bar-label' }, c: String(d[labelKey] || '') });
      }

      return { t: 'div', a: { class: 'bw-bar-group' }, c: children };
    });

    const chartChildren = [];
    if (title) {
      chartChildren.push({ t: 'h3', a: { class: 'bw-bar-chart-title' }, c: title });
    }
    chartChildren.push({
      t: 'div',
      a: { class: 'bw-bar-chart', style: 'height:' + height + ';' },
      c: bars
    });

    return {
      t: 'div',
      a: { class: ('bw-bar-chart-container ' + className).trim() },
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
  bw._componentHandles = componentHandles || {};

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

  return bw;

}));
//# sourceMappingURL=bitwrench.umd.js.map
