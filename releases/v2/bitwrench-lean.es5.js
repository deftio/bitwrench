/*! bitwrench-lean v2.0.12 | BSD-2-Clause | https://deftio.github.com/bitwrench/pages */
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.bw = factory());
})(this, (function () { 'use strict';

  function _arrayLikeToArray(r, a) {
    (null == a || a > r.length) && (a = r.length);
    for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e];
    return n;
  }
  function _arrayWithHoles(r) {
    if (Array.isArray(r)) return r;
  }
  function _arrayWithoutHoles(r) {
    if (Array.isArray(r)) return _arrayLikeToArray(r);
  }
  function _createForOfIteratorHelper(r, e) {
    var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"];
    if (!t) {
      if (Array.isArray(r) || (t = _unsupportedIterableToArray(r)) || e) {
        t && (r = t);
        var n = 0,
          F = function () {};
        return {
          s: F,
          n: function () {
            return n >= r.length ? {
              done: true
            } : {
              done: false,
              value: r[n++]
            };
          },
          e: function (r) {
            throw r;
          },
          f: F
        };
      }
      throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
    }
    var o,
      a = true,
      u = false;
    return {
      s: function () {
        t = t.call(r);
      },
      n: function () {
        var r = t.next();
        return a = r.done, r;
      },
      e: function (r) {
        u = true, o = r;
      },
      f: function () {
        try {
          a || null == t.return || t.return();
        } finally {
          if (u) throw o;
        }
      }
    };
  }
  function _defineProperty(e, r, t) {
    return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, {
      value: t,
      enumerable: true,
      configurable: true,
      writable: true
    }) : e[r] = t, e;
  }
  function _iterableToArray(r) {
    if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r);
  }
  function _iterableToArrayLimit(r, l) {
    var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"];
    if (null != t) {
      var e,
        n,
        i,
        u,
        a = [],
        f = true,
        o = false;
      try {
        if (i = (t = t.call(r)).next, 0 === l) ; else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0);
      } catch (r) {
        o = true, n = r;
      } finally {
        try {
          if (!f && null != t.return && (u = t.return(), Object(u) !== u)) return;
        } finally {
          if (o) throw n;
        }
      }
      return a;
    }
  }
  function _nonIterableRest() {
    throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
  }
  function _nonIterableSpread() {
    throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
  }
  function ownKeys(e, r) {
    var t = Object.keys(e);
    if (Object.getOwnPropertySymbols) {
      var o = Object.getOwnPropertySymbols(e);
      r && (o = o.filter(function (r) {
        return Object.getOwnPropertyDescriptor(e, r).enumerable;
      })), t.push.apply(t, o);
    }
    return t;
  }
  function _objectSpread2(e) {
    for (var r = 1; r < arguments.length; r++) {
      var t = null != arguments[r] ? arguments[r] : {};
      r % 2 ? ownKeys(Object(t), true).forEach(function (r) {
        _defineProperty(e, r, t[r]);
      }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) {
        Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r));
      });
    }
    return e;
  }
  function _objectWithoutProperties(e, t) {
    if (null == e) return {};
    var o,
      r,
      i = _objectWithoutPropertiesLoose(e, t);
    if (Object.getOwnPropertySymbols) {
      var n = Object.getOwnPropertySymbols(e);
      for (r = 0; r < n.length; r++) o = n[r], -1 === t.indexOf(o) && {}.propertyIsEnumerable.call(e, o) && (i[o] = e[o]);
    }
    return i;
  }
  function _objectWithoutPropertiesLoose(r, e) {
    if (null == r) return {};
    var t = {};
    for (var n in r) if ({}.hasOwnProperty.call(r, n)) {
      if (-1 !== e.indexOf(n)) continue;
      t[n] = r[n];
    }
    return t;
  }
  function _slicedToArray(r, e) {
    return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest();
  }
  function _toConsumableArray(r) {
    return _arrayWithoutHoles(r) || _iterableToArray(r) || _unsupportedIterableToArray(r) || _nonIterableSpread();
  }
  function _toPrimitive(t, r) {
    if ("object" != typeof t || !t) return t;
    var e = t[Symbol.toPrimitive];
    if (void 0 !== e) {
      var i = e.call(t, r);
      if ("object" != typeof i) return i;
      throw new TypeError("@@toPrimitive must return a primitive value.");
    }
    return ("string" === r ? String : Number)(t);
  }
  function _toPropertyKey(t) {
    var i = _toPrimitive(t, "string");
    return "symbol" == typeof i ? i : i + "";
  }
  function _typeof(o) {
    "@babel/helpers - typeof";

    return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) {
      return typeof o;
    } : function (o) {
      return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o;
    }, _typeof(o);
  }
  function _unsupportedIterableToArray(r, a) {
    if (r) {
      if ("string" == typeof r) return _arrayLikeToArray(r, a);
      var t = {}.toString.call(r).slice(8, -1);
      return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0;
    }
  }

  /**
   * Auto-generated version file from package.json
   * DO NOT EDIT DIRECTLY - Use npm run generate-version
   */

  var VERSION_INFO = {
    version: '2.0.12',
    name: 'bitwrench',
    description: 'A library for javascript UI functions.',
    license: 'BSD-2-Clause',
    homepage: 'https://deftio.github.com/bitwrench/pages',
    repository: 'git+https://github.com/deftio/bitwrench.git',
    author: 'manu a. chatterjee <deftio@deftio.com> (https://deftio.com/)',
    buildDate: '2026-03-07T22:06:15.575Z'
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
        var values = match[2].split(",").map(function (v) {
          return parseFloat(v);
        });
        if (type === "rgb") {
          r[0] = values[0] || 0;
          r[1] = values[1] || 0;
          r[2] = values[2] || 0;
          r[3] = values[3] !== undefined ? values[3] * 255 : defAlpha;
          r[4] = "rgb";
        } else if (type === "hsl") {
          var rgb = colorHslToRgb(values[0] || 0, values[1] || 0, values[2] || 0, values[3] !== undefined ? values[3] * 255 : defAlpha);
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
      g = r[1];
      b = r[2];
      a = r[3] !== undefined ? r[3] : 255;
      r = r[0];
    }
    r /= 255;
    g /= 255;
    b /= 255;
    var max = Math.max(r, g, b);
    var min = Math.min(r, g, b);
    var h,
      s,
      l = (max + min) / 2;
    if (max === min) {
      h = s = 0;
    } else {
      var d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r:
          h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
          break;
        case g:
          h = ((b - r) / d + 2) / 6;
          break;
        case b:
          h = ((r - g) / d + 4) / 6;
          break;
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
      s = h[1];
      l = h[2];
      a = h[3] !== undefined ? h[3] : 255;
      h = h[0];
    }
    var hNorm = h / 360;
    var sNorm = s / 100;
    var lNorm = l / 100;
    var r, g, b;
    if (sNorm === 0) {
      r = g = b = lNorm * 255;
    } else {
      var hue2rgb = function hue2rgb(p, q, t) {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };
      var q = lNorm < 0.5 ? lNorm * (1 + sNorm) : lNorm + sNorm - lNorm * sNorm;
      var p = 2 * lNorm - q;
      r = hue2rgb(p, q, hNorm + 1 / 3) * 255;
      g = hue2rgb(p, q, hNorm) * 255;
      b = hue2rgb(p, q, hNorm - 1 / 3) * 255;
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
    return '#' + ('0' + rgb[0].toString(16)).slice(-2) + ('0' + rgb[1].toString(16)).slice(-2) + ('0' + rgb[2].toString(16)).slice(-2);
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
    return '#' + ('0' + r.toString(16)).slice(-2) + ('0' + g.toString(16)).slice(-2) + ('0' + b.toString(16)).slice(-2);
  }

  /**
   * Compute WCAG 2.0 relative luminance of a hex color.
   * @param {string} hex - Hex color
   * @returns {number} Relative luminance 0-1
   */
  function relativeLuminance(hex) {
    var rgb = colorParse(hex);
    var vals = [rgb[0] / 255, rgb[1] / 255, rgb[2] / 255].map(function (v) {
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

  var _typography, _grid;

  // =========================================================================
  // Layout presets
  // =========================================================================

  var SPACING_PRESETS = {
    compact: {
      btn: '0.3rem 0.8rem',
      card: '0.875rem 1rem',
      alert: '0.625rem 1rem',
      cell: '0.5rem 0.75rem',
      input: '0.375rem 0.7rem'
    },
    normal: {
      btn: '0.5rem 1.125rem',
      card: '1.25rem 1.5rem',
      alert: '0.875rem 1.25rem',
      cell: '0.75rem 1rem',
      input: '0.5rem 0.875rem'
    },
    spacious: {
      btn: '0.75rem 1.5rem',
      card: '1.75rem 2rem',
      alert: '1.125rem 1.5rem',
      cell: '1rem 1.25rem',
      input: '0.75rem 1.125rem'
    }
  };
  var RADIUS_PRESETS = {
    none: {
      btn: '0',
      card: '0',
      badge: '0',
      alert: '0',
      input: '0'
    },
    sm: {
      btn: '4px',
      card: '4px',
      badge: '.25rem',
      alert: '4px',
      input: '4px'
    },
    md: {
      btn: '6px',
      card: '8px',
      badge: '.375rem',
      alert: '8px',
      input: '6px'
    },
    lg: {
      btn: '10px',
      card: '12px',
      badge: '.5rem',
      alert: '12px',
      input: '10px'
    },
    pill: {
      btn: '50rem',
      card: '1rem',
      badge: '50rem',
      alert: '1rem',
      input: '50rem'
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
    teal: {
      primary: '#006666',
      secondary: '#6c757d',
      tertiary: '#006666',
      label: 'Teal',
      desc: 'The signature bitwrench palette — professional teal and neutral gray.'
    },
    ocean: {
      primary: '#0077b6',
      secondary: '#90e0ef',
      tertiary: '#00b4d8',
      label: 'Ocean',
      desc: 'Cool blues and teals for a calm, professional look.'
    },
    sunset: {
      primary: '#e76f51',
      secondary: '#264653',
      tertiary: '#e9c46a',
      label: 'Sunset',
      desc: 'Warm oranges and deep earth tones for a bold feel.'
    },
    forest: {
      primary: '#2d6a4f',
      secondary: '#95d5b2',
      tertiary: '#52b788',
      label: 'Forest',
      desc: 'Natural greens for an organic, earthy vibe.'
    },
    slate: {
      primary: '#343a40',
      secondary: '#adb5bd',
      tertiary: '#6c757d',
      label: 'Slate',
      desc: 'Elegant grays for a minimal, modern interface.'
    },
    rose: {
      primary: '#e11d48',
      secondary: '#fda4af',
      tertiary: '#fb7185',
      label: 'Rose',
      desc: 'Vibrant pinks and reds for a bold, energetic design.'
    },
    indigo: {
      primary: '#4f46e5',
      secondary: '#a5b4fc',
      tertiary: '#818cf8',
      label: 'Indigo',
      desc: 'Deep purples and soft lavenders for a creative palette.'
    },
    amber: {
      primary: '#d97706',
      secondary: '#fbbf24',
      tertiary: '#f59e0b',
      label: 'Amber',
      desc: 'Warm golds and yellows for a sunny, welcoming feel.'
    },
    emerald: {
      primary: '#059669',
      secondary: '#6ee7b7',
      tertiary: '#34d399',
      label: 'Emerald',
      desc: 'Bright greens and mints for a fresh, modern look.'
    },
    nord: {
      primary: '#5e81ac',
      secondary: '#88c0d0',
      tertiary: '#81a1c1',
      label: 'Nord',
      desc: 'Muted arctic blues inspired by the Nord color scheme.'
    },
    coral: {
      primary: '#ef6461',
      secondary: '#4a7c7e',
      tertiary: '#e8a87c',
      label: 'Coral',
      desc: 'Warm coral and teal for a balanced, approachable design.'
    },
    midnight: {
      primary: '#1e3a5f',
      secondary: '#7c8db5',
      tertiary: '#3d5a80',
      label: 'Midnight',
      desc: 'Deep navy and steel blue for a sophisticated, authoritative feel.'
    }
  };

  /**
   * Resolve layout config to spacing + radius objects
   * @param {Object} config - { spacing, radius, fontSize }
   * @returns {Object} { spacing, radius, fontSize }
   */
  function resolveLayout(config) {
    var sp = config && config.spacing || 'normal';
    var rd = config && config.radius || 'md';
    var fs = config && config.fontSize || 1.0;
    return {
      spacing: typeof sp === 'string' ? SPACING_PRESETS[sp] || SPACING_PRESETS.normal : sp,
      radius: typeof rd === 'string' ? RADIUS_PRESETS[rd] || RADIUS_PRESETS.md : rd,
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
    if (sel.includes(',')) return sel.split(',').map(function (s) {
      return '.' + name + ' ' + s.trim();
    }).join(', ');
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
    variants.forEach(function (v) {
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
      'border-radius': rd.btn === '50rem' ? '50rem' : parseInt(rd.btn) + 2 + 'px'
    };
    rules[scopeSelector(scope, '.bw-btn-sm')] = {
      'padding': '0.25rem 0.75rem',
      'font-size': '0.8125rem',
      'border-radius': rd.btn === '50rem' ? '50rem' : Math.max(parseInt(rd.btn) - 1, 0) + 'px'
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
    variants.forEach(function (v) {
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
    variants.forEach(function (v) {
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
      'padding': sp.card.split(' ').map(function (v) {
        return (parseFloat(v) * 0.7).toFixed(3).replace(/\.?0+$/, '') + 'rem';
      }).join(' '),
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
    variants.forEach(function (v) {
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
    variants.forEach(function (v) {
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
    variants.forEach(function (v) {
      var p = palette[v];
      rules[scopeSelector(scope, '.bw-text-' + v)] = {
        'color': p.base
      };
      rules[scopeSelector(scope, '.bw-bg-' + v)] = {
        'background-color': p.base
      };
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
    variants.forEach(function (v) {
      rules[scopeSelector(scope, '.bw-spinner-border.bw-text-' + v)] = {
        'color': palette[v].base
      };
      rules[scopeSelector(scope, '.bw-spinner-grow.bw-text-' + v)] = {
        'color': palette[v].base
      };
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
    variants.forEach(function (v) {
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
      'background': 'linear-gradient(90deg, ' + palette.light.border + ' 25%, ' + palette.light.light + ' 37%, ' + palette.light.border + ' 63%)'
    };
    return rules;
  }
  function generateAvatarThemed(scope, palette) {
    var rules = {};
    var variants = ['primary', 'secondary', 'success', 'danger', 'warning', 'info', 'light', 'dark'];
    variants.forEach(function (v) {
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
    return Object.assign({}, generateResetThemed(scopeName, palette), generateTypographyThemed(scopeName, palette), generateButtons(scopeName, palette, layout), generateAlerts(scopeName, palette, layout), generateBadges(scopeName, palette), generateCards(scopeName, palette, layout), generateForms(scopeName, palette, layout), generateNavigation(scopeName, palette), generateTables(scopeName, palette, layout), generateTabs(scopeName, palette), generateListGroups(scopeName, palette, layout), generatePagination(scopeName, palette), generateProgress(scopeName, palette), generateHero(scopeName, palette), generateBreadcrumbThemed(scopeName, palette), generateSpinnerThemed(scopeName, palette), generateCloseButtonThemed(scopeName, palette), generateSectionsThemed(scopeName, palette), generateAccordionThemed(scopeName, palette), generateCarouselThemed(scopeName, palette), generateModalThemed(scopeName, palette), generateToastThemed(scopeName, palette), generateDropdownThemed(scopeName, palette), generateSwitchThemed(scopeName, palette), generateSkeletonThemed(scopeName, palette), generateAvatarThemed(scopeName, palette), generateUtilityColors(scopeName, palette));
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
  var defaultStyles = {
    /**
     * Typography styles for headings, paragraphs, links, and small text
     */
    typography: (_typography = {
      'h1, h2, h3, h4, h5, h6': {
        'margin-top': '0',
        'margin-bottom': '.5rem',
        'font-weight': '600',
        'line-height': '1.25',
        'letter-spacing': '-0.01em',
        'color': 'inherit'
      },
      'h1': {
        'font-size': 'calc(1.375rem + 1.5vw)'
      },
      '@media (min-width: 1200px)': {
        'h1': {
          'font-size': '2.5rem'
        }
      },
      'h2': {
        'font-size': 'calc(1.325rem + .9vw)'
      }
    }, _defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_typography, "@media (min-width: 1200px)", {
      'h2': {
        'font-size': '2rem'
      }
    }), 'h3', {
      'font-size': 'calc(1.3rem + .6vw)'
    }), "@media (min-width: 1200px)", {
      'h3': {
        'font-size': '1.75rem'
      }
    }), 'h4', {
      'font-size': 'calc(1.275rem + .3vw)'
    }), "@media (min-width: 1200px)", {
      'h4': {
        'font-size': '1.5rem'
      }
    }), 'h5', {
      'font-size': '1.25rem'
    }), 'h6', {
      'font-size': '1rem'
    }), 'p', {
      'margin-top': '0',
      'margin-bottom': '1rem'
    }), 'small', {
      'font-size': '0.875rem'
    }), 'a', {
      'color': '#006666',
      'text-decoration': 'none',
      'transition': 'color 0.15s'
    }), _defineProperty(_typography, 'a:hover', {
      'color': '#004d4d',
      'text-decoration': 'underline'
    })),
    /**
     * 12-column flexbox grid system
     */
    grid: (_grid = {
      '.bw-container': {
        'width': '100%',
        'padding-right': '0.75rem',
        'padding-left': '0.75rem',
        'margin-right': 'auto',
        'margin-left': 'auto'
      },
      '@media (min-width: 576px)': {
        '.bw-container': {
          'max-width': '540px'
        }
      },
      '@media (min-width: 768px)': {
        '.bw-container': {
          'max-width': '720px'
        }
      },
      '@media (min-width: 992px)': {
        '.bw-container': {
          'max-width': '960px'
        }
      },
      '@media (min-width: 1200px)': {
        '.bw-container': {
          'max-width': '1140px'
        }
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
      }
    }, _defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_grid, ".bw-col", {
      'flex-basis': '0',
      'flex-grow': '1',
      'max-width': '100%'
    }), '.bw-col-1', {
      'flex': '0 0 8.333333%',
      'max-width': '8.333333%'
    }), '.bw-col-2', {
      'flex': '0 0 16.666667%',
      'max-width': '16.666667%'
    }), '.bw-col-3', {
      'flex': '0 0 25%',
      'max-width': '25%'
    }), '.bw-col-4', {
      'flex': '0 0 33.333333%',
      'max-width': '33.333333%'
    }), '.bw-col-5', {
      'flex': '0 0 41.666667%',
      'max-width': '41.666667%'
    }), '.bw-col-6', {
      'flex': '0 0 50%',
      'max-width': '50%'
    }), '.bw-col-7', {
      'flex': '0 0 58.333333%',
      'max-width': '58.333333%'
    }), '.bw-col-8', {
      'flex': '0 0 66.666667%',
      'max-width': '66.666667%'
    }), '.bw-col-9', {
      'flex': '0 0 75%',
      'max-width': '75%'
    }), _defineProperty(_defineProperty(_defineProperty(_grid, '.bw-col-10', {
      'flex': '0 0 83.333333%',
      'max-width': '83.333333%'
    }), '.bw-col-11', {
      'flex': '0 0 91.666667%',
      'max-width': '91.666667%'
    }), '.bw-col-12', {
      'flex': '0 0 100%',
      'max-width': '100%'
    })),
    /**
     * Responsive grid columns
     */
    responsive: {
      '@media (min-width: 576px)': {
        '.bw-col-sm-1': {
          'flex': '0 0 8.333333%',
          'max-width': '8.333333%'
        },
        '.bw-col-sm-2': {
          'flex': '0 0 16.666667%',
          'max-width': '16.666667%'
        },
        '.bw-col-sm-3': {
          'flex': '0 0 25%',
          'max-width': '25%'
        },
        '.bw-col-sm-4': {
          'flex': '0 0 33.333333%',
          'max-width': '33.333333%'
        },
        '.bw-col-sm-5': {
          'flex': '0 0 41.666667%',
          'max-width': '41.666667%'
        },
        '.bw-col-sm-6': {
          'flex': '0 0 50%',
          'max-width': '50%'
        },
        '.bw-col-sm-7': {
          'flex': '0 0 58.333333%',
          'max-width': '58.333333%'
        },
        '.bw-col-sm-8': {
          'flex': '0 0 66.666667%',
          'max-width': '66.666667%'
        },
        '.bw-col-sm-9': {
          'flex': '0 0 75%',
          'max-width': '75%'
        },
        '.bw-col-sm-10': {
          'flex': '0 0 83.333333%',
          'max-width': '83.333333%'
        },
        '.bw-col-sm-11': {
          'flex': '0 0 91.666667%',
          'max-width': '91.666667%'
        },
        '.bw-col-sm-12': {
          'flex': '0 0 100%',
          'max-width': '100%'
        }
      },
      '@media (min-width: 768px)': {
        '.bw-col-md-1': {
          'flex': '0 0 8.333333%',
          'max-width': '8.333333%'
        },
        '.bw-col-md-2': {
          'flex': '0 0 16.666667%',
          'max-width': '16.666667%'
        },
        '.bw-col-md-3': {
          'flex': '0 0 25%',
          'max-width': '25%'
        },
        '.bw-col-md-4': {
          'flex': '0 0 33.333333%',
          'max-width': '33.333333%'
        },
        '.bw-col-md-5': {
          'flex': '0 0 41.666667%',
          'max-width': '41.666667%'
        },
        '.bw-col-md-6': {
          'flex': '0 0 50%',
          'max-width': '50%'
        },
        '.bw-col-md-7': {
          'flex': '0 0 58.333333%',
          'max-width': '58.333333%'
        },
        '.bw-col-md-8': {
          'flex': '0 0 66.666667%',
          'max-width': '66.666667%'
        },
        '.bw-col-md-9': {
          'flex': '0 0 75%',
          'max-width': '75%'
        },
        '.bw-col-md-10': {
          'flex': '0 0 83.333333%',
          'max-width': '83.333333%'
        },
        '.bw-col-md-11': {
          'flex': '0 0 91.666667%',
          'max-width': '91.666667%'
        },
        '.bw-col-md-12': {
          'flex': '0 0 100%',
          'max-width': '100%'
        }
      },
      '@media (min-width: 992px)': {
        '.bw-col-lg-1': {
          'flex': '0 0 8.333333%',
          'max-width': '8.333333%'
        },
        '.bw-col-lg-2': {
          'flex': '0 0 16.666667%',
          'max-width': '16.666667%'
        },
        '.bw-col-lg-3': {
          'flex': '0 0 25%',
          'max-width': '25%'
        },
        '.bw-col-lg-4': {
          'flex': '0 0 33.333333%',
          'max-width': '33.333333%'
        },
        '.bw-col-lg-5': {
          'flex': '0 0 41.666667%',
          'max-width': '41.666667%'
        },
        '.bw-col-lg-6': {
          'flex': '0 0 50%',
          'max-width': '50%'
        },
        '.bw-col-lg-7': {
          'flex': '0 0 58.333333%',
          'max-width': '58.333333%'
        },
        '.bw-col-lg-8': {
          'flex': '0 0 66.666667%',
          'max-width': '66.666667%'
        },
        '.bw-col-lg-9': {
          'flex': '0 0 75%',
          'max-width': '75%'
        },
        '.bw-col-lg-10': {
          'flex': '0 0 83.333333%',
          'max-width': '83.333333%'
        },
        '.bw-col-lg-11': {
          'flex': '0 0 91.666667%',
          'max-width': '91.666667%'
        },
        '.bw-col-lg-12': {
          'flex': '0 0 100%',
          'max-width': '100%'
        }
      },
      '@media (max-width: 575px)': {
        '.bw-card-img-left, .bw_card-img-left': {
          'width': '100%'
        },
        '.bw-card-img-right, .bw_card-img-right': {
          'width': '100%'
        },
        '.bw-hero, .bw_hero': {
          'padding': '2rem 1rem'
        },
        '.bw-cta-actions, .bw_cta-actions': {
          'flex-direction': 'column'
        },
        '.bw-hstack, .bw_hstack': {
          'flex-direction': 'column'
        },
        '.bw-feature-grid, .bw_feature-grid': {
          'grid-template-columns': '1fr'
        }
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
    rules['*'] = {
      'box-sizing': 'border-box',
      'margin': '0',
      'padding': '0'
    };
    rules['html'] = {
      'font-size': '16px',
      'line-height': '1.5',
      '-webkit-text-size-adjust': '100%',
      '-webkit-font-smoothing': 'antialiased',
      '-moz-osx-font-smoothing': 'grayscale'
    };
    rules['body'] = {
      'font-family': 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      'font-size': '1rem',
      'font-weight': '400',
      'line-height': '1.6',
      'margin': '0',
      'padding': '0',
      '-webkit-font-smoothing': 'antialiased',
      '-moz-osx-font-smoothing': 'grayscale'
    };
    rules['.bw-page'] = {
      'min-height': '100vh',
      'display': 'flex',
      'flex-direction': 'column'
    };
    rules['.bw-page-content'] = {
      'flex': '1',
      'padding': '2rem 0'
    };
    rules['main'] = {
      'display': 'block'
    };
    rules['hr'] = {
      'box-sizing': 'content-box',
      'height': '0',
      'overflow': 'visible',
      'margin': '1rem 0',
      'border': '0'
    };
    rules['hr:not([size])'] = {
      'height': '1px'
    };

    // Typography (structural)
    rules['h1, h2, h3, h4, h5, h6'] = {
      'margin-top': '0',
      'margin-bottom': '.5rem',
      'font-weight': '600',
      'line-height': '1.25',
      'letter-spacing': '-0.01em'
    };
    rules['h1'] = {
      'font-size': 'calc(1.375rem + 1.5vw)'
    };
    rules['h2'] = {
      'font-size': 'calc(1.325rem + .9vw)'
    };
    rules['h3'] = {
      'font-size': 'calc(1.3rem + .6vw)'
    };
    rules['h4'] = {
      'font-size': 'calc(1.275rem + .3vw)'
    };
    rules['h5'] = {
      'font-size': '1.25rem'
    };
    rules['h6'] = {
      'font-size': '1rem'
    };
    rules['p'] = {
      'margin-top': '0',
      'margin-bottom': '1rem'
    };
    rules['small'] = {
      'font-size': '0.875rem'
    };
    rules['a'] = {
      'text-decoration': 'none',
      'transition': 'color 0.15s'
    };

    // Grid (all structural)
    Object.assign(rules, defaultStyles.grid);

    // Button (structural)
    rules['.bw-btn'] = {
      'display': 'inline-flex',
      'align-items': 'center',
      'justify-content': 'center',
      'font-weight': '500',
      'line-height': '1.5',
      'text-align': 'center',
      'text-decoration': 'none',
      'vertical-align': 'middle',
      'cursor': 'pointer',
      'user-select': 'none',
      'border': '1px solid transparent',
      'padding': '0.5rem 1.125rem',
      'font-size': '0.875rem',
      'font-family': 'inherit',
      'border-radius': '6px',
      'transition': 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
      'gap': '0.5rem'
    };
    rules['.bw-btn:hover'] = {
      'text-decoration': 'none',
      'transform': 'translateY(-1px)'
    };
    rules['.bw-btn:active'] = {
      'transform': 'translateY(0)'
    };
    rules['.bw-btn:focus-visible'] = {
      'outline': '0'
    };
    rules['.bw-btn:disabled'] = {
      'opacity': '0.5',
      'cursor': 'not-allowed',
      'pointer-events': 'none'
    };
    rules['.bw-btn-lg'] = {
      'padding': '0.625rem 1.5rem',
      'font-size': '1rem',
      'border-radius': '8px'
    };
    rules['.bw-btn-sm'] = {
      'padding': '0.25rem 0.75rem',
      'font-size': '0.8125rem',
      'border-radius': '5px'
    };

    // Card (structural)
    rules['.bw-card'] = {
      'position': 'relative',
      'display': 'flex',
      'flex-direction': 'column',
      'min-width': '0',
      'height': '100%',
      'word-wrap': 'break-word',
      'background-clip': 'border-box',
      'border': '1px solid transparent',
      'border-radius': '8px',
      'transition': 'box-shadow 0.2s cubic-bezier(0.4,0,0.2,1), transform 0.2s cubic-bezier(0.4,0,0.2,1)',
      'margin-bottom': '1.5rem',
      'overflow': 'hidden'
    };
    rules['.bw-card-body'] = {
      'flex': '1 1 auto',
      'padding': '1.25rem 1.5rem'
    };
    rules['.bw-card-body > *:last-child'] = {
      'margin-bottom': '0'
    };
    rules['.bw-card-title'] = {
      'margin-bottom': '0.5rem',
      'font-size': '1.125rem',
      'font-weight': '600',
      'line-height': '1.3'
    };
    rules['.bw-card-text'] = {
      'margin-bottom': '0',
      'font-size': '0.9375rem',
      'line-height': '1.6'
    };
    rules['.bw-card-header'] = {
      'padding': '0.875rem 1.5rem',
      'margin-bottom': '0',
      'font-weight': '600',
      'font-size': '0.875rem'
    };
    rules['.bw-card-footer'] = {
      'padding': '0.75rem 1.5rem',
      'font-size': '0.875rem'
    };
    rules['.bw-card-hoverable'] = {
      'transition': 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    };
    rules['.bw-card-img-top'] = {
      'width': '100%',
      'border-top-left-radius': '7px',
      'border-top-right-radius': '7px'
    };
    rules['.bw-card-img-bottom'] = {
      'width': '100%',
      'border-bottom-left-radius': '7px',
      'border-bottom-right-radius': '7px'
    };
    rules['.bw-card-img-left'] = {
      'width': '40%',
      'object-fit': 'cover'
    };
    rules['.bw-card-img-right'] = {
      'width': '40%',
      'object-fit': 'cover'
    };
    rules['.bw-card-subtitle'] = {
      'margin-top': '-0.25rem',
      'margin-bottom': '0.5rem',
      'font-size': '0.875rem'
    };

    // Forms (structural)
    rules['.bw-form-control'] = {
      'display': 'block',
      'width': '100%',
      'padding': '0.5rem 0.875rem',
      'font-size': '0.9375rem',
      'font-weight': '400',
      'line-height': '1.5',
      'background-clip': 'padding-box',
      'appearance': 'none',
      'border': '1px solid transparent',
      'border-radius': '6px',
      'transition': 'border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out',
      'font-family': 'inherit'
    };
    rules['.bw-form-control:focus'] = {
      'outline': '0'
    };
    rules['.bw-form-control::placeholder'] = {
      'opacity': '1'
    };
    rules['.bw-form-label'] = {
      'display': 'block',
      'margin-bottom': '0.375rem',
      'font-size': '0.875rem',
      'font-weight': '600'
    };
    rules['.bw-form-group'] = {
      'margin-bottom': '1.25rem'
    };
    rules['.bw-form-text'] = {
      'margin-top': '0.25rem',
      'font-size': '0.8125rem'
    };
    rules['select.bw-form-control'] = {
      'padding-right': '2.25rem',
      'background-repeat': 'no-repeat',
      'background-position': 'right 0.75rem center',
      'background-size': '16px 12px'
    };
    rules['textarea.bw-form-control'] = {
      'min-height': '5rem',
      'resize': 'vertical'
    };

    // Form checks (structural)
    Object.assign(rules, {
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
        'border-radius': '0.25rem',
        'appearance': 'auto'
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
    });

    // Navigation (structural)
    rules['.bw-navbar'] = {
      'position': 'relative',
      'display': 'flex',
      'flex-wrap': 'wrap',
      'align-items': 'center',
      'justify-content': 'space-between',
      'padding': '0.5rem 1.5rem'
    };
    rules['.bw-navbar > .bw-container, .bw-navbar > .container'] = {
      'display': 'flex',
      'flex-wrap': 'wrap',
      'align-items': 'center',
      'justify-content': 'space-between'
    };
    rules['.bw-navbar-brand'] = {
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
      'text-decoration': 'none'
    };
    rules['.bw-navbar-nav'] = {
      'display': 'flex',
      'flex-direction': 'row',
      'padding-left': '0',
      'margin-bottom': '0',
      'list-style': 'none',
      'gap': '0.25rem'
    };
    rules['.bw-navbar-nav .bw-nav-link'] = {
      'display': 'block',
      'padding': '0.5rem 0.875rem',
      'text-decoration': 'none',
      'font-size': '0.875rem',
      'font-weight': '500',
      'border-radius': '6px',
      'transition': 'color 0.15s, background-color 0.15s'
    };

    // Tables (structural)
    rules['.bw-table'] = {
      'width': '100%',
      'margin-bottom': '1.5rem',
      'vertical-align': 'top',
      'border-collapse': 'collapse',
      'font-size': '0.9375rem',
      'line-height': '1.5'
    };
    rules['.bw-table > :not(caption) > * > *'] = {
      'padding': '0.75rem 1rem'
    };
    rules['.bw-table > tbody'] = {
      'vertical-align': 'inherit'
    };
    rules['.bw-table > thead'] = {
      'vertical-align': 'bottom'
    };
    rules['.bw-table > thead > tr > *'] = {
      'padding': '0.625rem 1rem',
      'font-size': '0.8125rem',
      'font-weight': '600',
      'text-transform': 'uppercase',
      'letter-spacing': '0.04em'
    };
    rules['.bw-table caption'] = {
      'padding': '0.5rem 1rem',
      'font-size': '0.875rem',
      'caption-side': 'bottom'
    };
    rules['.bw-table-responsive'] = {
      'overflow-x': 'auto',
      '-webkit-overflow-scrolling': 'touch'
    };

    // Alerts (structural)
    rules['.bw-alert'] = {
      'position': 'relative',
      'padding': '0.875rem 1.25rem',
      'margin-bottom': '1rem',
      'border': '1px solid transparent',
      'border-radius': '8px',
      'font-size': '0.9375rem',
      'line-height': '1.6'
    };
    rules['.bw-alert-heading, .alert-heading'] = {
      'color': 'inherit'
    };
    rules['.bw-alert-link, .alert-link'] = {
      'font-weight': '700'
    };
    rules['.bw-alert-dismissible'] = {
      'padding-right': '3rem'
    };
    rules['.bw-alert-dismissible .btn-close'] = {
      'position': 'absolute',
      'top': '0',
      'right': '0',
      'z-index': '2',
      'padding': '1.25rem 1rem'
    };

    // Badges (structural)
    rules['.bw-badge'] = {
      'display': 'inline-block',
      'padding': '.4em .75em',
      'font-size': '.875em',
      'font-weight': '600',
      'line-height': '1.3',
      'text-align': 'center',
      'white-space': 'nowrap',
      'vertical-align': 'baseline',
      'border-radius': '.375rem'
    };
    rules['.bw-badge:empty'] = {
      'display': 'none'
    };
    rules['.bw-badge-sm'] = {
      'font-size': '.75em',
      'padding': '.25em .5em'
    };
    rules['.bw-badge-lg'] = {
      'font-size': '1em',
      'padding': '.5em .9em'
    };
    rules['.bw-badge-pill'] = {
      'border-radius': '50rem'
    };

    // Progress (structural)
    rules['.bw-progress'] = {
      'display': 'flex',
      'height': '1.25rem',
      'overflow': 'hidden',
      'font-size': '.875rem',
      'border-radius': '.5rem'
    };
    rules['.bw-progress-bar'] = {
      'display': 'flex',
      'flex-direction': 'column',
      'justify-content': 'center',
      'overflow': 'hidden',
      'text-align': 'center',
      'white-space': 'nowrap',
      'transition': 'width .6s ease',
      'font-weight': '600'
    };
    rules['.bw-progress-bar-striped'] = {
      'background-image': 'linear-gradient(45deg,rgba(255,255,255,.15) 25%,transparent 25%,transparent 50%,rgba(255,255,255,.15) 50%,rgba(255,255,255,.15) 75%,transparent 75%,transparent)',
      'background-size': '1rem 1rem'
    };
    rules['.bw-progress-bar-animated'] = {
      'animation': 'progress-bar-stripes 1s linear infinite'
    };
    rules['@keyframes progress-bar-stripes'] = {
      '0%': {
        'background-position-x': '1rem'
      }
    };

    // Tabs (structural)
    rules['.bw-nav'] = {
      'display': 'flex',
      'flex-wrap': 'wrap',
      'padding-left': '0',
      'margin-bottom': '0',
      'list-style': 'none',
      'gap': '0'
    };
    rules['.bw-nav-item'] = {
      'display': 'block'
    };
    rules['.bw-nav-tabs .bw-nav-item'] = {
      'margin-bottom': '-2px'
    };
    rules['.bw-nav-link'] = {
      'display': 'block',
      'padding': '0.625rem 1rem',
      'font-size': '0.875rem',
      'font-weight': '500',
      'text-decoration': 'none',
      'cursor': 'pointer',
      'border': 'none',
      'background': 'transparent',
      'transition': 'color 0.15s, border-color 0.15s',
      'font-family': 'inherit'
    };
    rules['.bw-nav-tabs .bw-nav-link'] = {
      'border': 'none',
      'border-bottom': '2px solid transparent',
      'border-radius': '0',
      'background-color': 'transparent'
    };
    rules['.bw-nav-pills .bw-nav-link'] = {
      'border-radius': '6px'
    };
    rules['.bw-nav-vertical'] = {
      'flex-direction': 'column'
    };
    rules['.bw-tab-content'] = {
      'padding': '1.25rem 0'
    };
    rules['.bw-tab-pane'] = {
      'display': 'none'
    };
    rules['.bw-tab-pane.active'] = {
      'display': 'block'
    };
    rules['.bw-nav-scrollable'] = {
      'flex-wrap': 'nowrap',
      'overflow-x': 'auto',
      '-webkit-overflow-scrolling': 'touch',
      'scrollbar-width': 'none'
    };
    rules['.bw-nav-scrollable .bw-nav-link'] = {
      'white-space': 'nowrap'
    };

    // List groups (structural)
    rules['.bw-list-group'] = {
      'display': 'flex',
      'flex-direction': 'column',
      'padding-left': '0',
      'margin-bottom': '0',
      'border-radius': '0.375rem'
    };
    rules['.bw-list-group-item'] = {
      'position': 'relative',
      'display': 'block',
      'padding': '0.75rem 1.25rem',
      'text-decoration': 'none',
      'font-size': '0.9375rem'
    };
    rules['.bw-list-group-item:first-child'] = {
      'border-top-left-radius': 'inherit',
      'border-top-right-radius': 'inherit'
    };
    rules['.bw-list-group-item:last-child'] = {
      'border-bottom-right-radius': 'inherit',
      'border-bottom-left-radius': 'inherit'
    };
    rules['.bw-list-group-item + .bw-list-group-item'] = {
      'border-top-width': '0'
    };
    rules['.bw-list-group-item.disabled'] = {
      'pointer-events': 'none'
    };
    rules['a.bw-list-group-item'] = {
      'cursor': 'pointer'
    };
    rules['.bw-list-group-flush'] = {
      'border-radius': '0'
    };
    rules['.bw-list-group-flush > .bw-list-group-item'] = {
      'border-width': '0 0 1px',
      'border-radius': '0'
    };
    rules['.bw-list-group-flush > .bw-list-group-item:last-child'] = {
      'border-bottom-width': '0'
    };

    // Pagination (structural)
    rules['.bw-pagination'] = {
      'display': 'flex',
      'padding-left': '0',
      'list-style': 'none',
      'margin-bottom': '0'
    };
    rules['.bw-page-item'] = {
      'display': 'list-item',
      'list-style': 'none'
    };
    rules['.bw-page-link'] = {
      'position': 'relative',
      'display': 'block',
      'padding': '0.375rem 0.75rem',
      'margin-left': '-1px',
      'line-height': '1.25',
      'text-decoration': 'none',
      'transition': 'color 0.15s ease-in-out, background-color 0.15s ease-in-out, border-color 0.15s ease-in-out'
    };
    rules['.bw-page-item:first-child .bw-page-link'] = {
      'margin-left': '0',
      'border-top-left-radius': '0.375rem',
      'border-bottom-left-radius': '0.375rem'
    };
    rules['.bw-page-item:last-child .bw-page-link'] = {
      'border-top-right-radius': '0.375rem',
      'border-bottom-right-radius': '0.375rem'
    };

    // Breadcrumb (structural)
    rules['.bw-breadcrumb'] = {
      'display': 'flex',
      'flex-wrap': 'wrap',
      'padding': '0 0',
      'margin-bottom': '1rem',
      'list-style': 'none'
    };
    rules['.bw-breadcrumb-item'] = {
      'display': 'flex'
    };
    rules['.bw-breadcrumb-item + .bw-breadcrumb-item'] = {
      'padding-left': '0.5rem'
    };
    rules['.bw-breadcrumb-item + .bw-breadcrumb-item::before'] = {
      'float': 'left',
      'padding-right': '0.5rem',
      'content': '"/"'
    };

    // Hero (structural)
    rules['.bw-hero'] = {
      'position': 'relative',
      'overflow': 'hidden'
    };
    rules['.bw-hero-overlay'] = {
      'position': 'absolute',
      'top': '0',
      'left': '0',
      'right': '0',
      'bottom': '0',
      'z-index': '1'
    };
    rules['.bw-hero-content'] = {
      'position': 'relative',
      'z-index': '2'
    };
    rules['.bw-hero-title'] = {
      'font-weight': '300',
      'letter-spacing': '-0.05rem',
      'color': 'inherit'
    };
    rules['.bw-hero-subtitle'] = {
      'color': 'inherit'
    };
    rules['.bw-hero-actions'] = {
      'display': 'flex',
      'gap': '1rem',
      'justify-content': 'center',
      'flex-wrap': 'wrap'
    };
    rules['.bw-display-4'] = {
      'font-size': 'calc(1.475rem + 2.7vw)',
      'font-weight': '300',
      'line-height': '1.2'
    };
    rules['.bw-lead'] = {
      'font-size': '1.25rem',
      'font-weight': '300'
    };

    // Features (structural)
    rules['.bw-feature'] = {
      'padding': '1rem'
    };
    rules['.bw-feature-icon'] = {
      'display': 'inline-block',
      'margin-bottom': '1rem'
    };
    rules['.bw-feature-title'] = {
      'margin-bottom': '0.5rem'
    };
    rules['.bw-feature-grid'] = {
      'width': '100%'
    };
    rules['.bw-g-4'] = {
      '--bw-gutter-x': '1.5rem',
      '--bw-gutter-y': '1.5rem'
    };

    // Sections (structural)
    rules['.bw-section'] = {
      'position': 'relative'
    };
    rules['.bw-section-header'] = {
      'margin-bottom': '3rem'
    };
    rules['.bw-section-title'] = {
      'margin-bottom': '1rem',
      'font-weight': '300',
      'font-size': 'calc(1.325rem + .9vw)'
    };

    // CTA (structural)
    rules['.bw-cta'] = {
      'position': 'relative'
    };
    rules['.bw-cta-content'] = {
      'max-width': '48rem',
      'margin': '0 auto'
    };
    rules['.bw-cta-title'] = {
      'font-weight': '300'
    };
    rules['.bw-cta-actions'] = {
      'display': 'flex',
      'gap': '1rem',
      'justify-content': 'center',
      'flex-wrap': 'wrap'
    };

    // Spinner (structural)
    rules['.bw-spinner-border'] = {
      'display': 'inline-block',
      'width': '2rem',
      'height': '2rem',
      'vertical-align': '-0.125em',
      'border': '0.25em solid currentcolor',
      'border-right-color': 'transparent',
      'border-radius': '50%',
      'animation': 'bw-spinner-border 0.75s linear infinite'
    };
    rules['.bw-spinner-border-sm'] = {
      'width': '1rem',
      'height': '1rem',
      'border-width': '0.2em'
    };
    rules['.bw-spinner-border-lg'] = {
      'width': '3rem',
      'height': '3rem',
      'border-width': '0.3em'
    };
    rules['.bw-spinner-grow'] = {
      'display': 'inline-block',
      'width': '2rem',
      'height': '2rem',
      'vertical-align': '-0.125em',
      'border-radius': '50%',
      'opacity': '0',
      'animation': 'bw-spinner-grow 0.75s linear infinite'
    };
    rules['.bw-spinner-grow-sm'] = {
      'width': '1rem',
      'height': '1rem'
    };
    rules['.bw-spinner-grow-lg'] = {
      'width': '3rem',
      'height': '3rem'
    };
    rules['@keyframes bw-spinner-border'] = {
      '100%': {
        'transform': 'rotate(360deg)'
      }
    };
    rules['@keyframes bw-spinner-grow'] = {
      '0%': {
        'transform': 'scale(0)'
      },
      '50%': {
        'opacity': '1',
        'transform': 'none'
      }
    };
    rules['.bw-visually-hidden'] = {
      'position': 'absolute',
      'width': '1px',
      'height': '1px',
      'padding': '0',
      'margin': '-1px',
      'overflow': 'hidden',
      'clip': 'rect(0, 0, 0, 0)',
      'white-space': 'nowrap',
      'border': '0'
    };

    // Close button (structural)
    rules['.bw-close'] = {
      'display': 'inline-flex',
      'align-items': 'center',
      'justify-content': 'center',
      'width': '1.5rem',
      'height': '1.5rem',
      'padding': '0',
      'font-size': '1.25rem',
      'font-weight': '700',
      'line-height': '1',
      'background': 'transparent',
      'border': '0',
      'border-radius': '0.25rem',
      'cursor': 'pointer'
    };

    // Stacks (structural)
    rules['.bw-vstack'] = {
      'display': 'flex',
      'flex-direction': 'column'
    };
    rules['.bw-hstack'] = {
      'display': 'flex',
      'flex-direction': 'row',
      'align-items': 'center'
    };
    rules['.bw-gap-0'] = {
      'gap': '0'
    };
    rules['.bw-gap-1'] = {
      'gap': '0.25rem'
    };
    rules['.bw-gap-2'] = {
      'gap': '0.5rem'
    };
    rules['.bw-gap-3'] = {
      'gap': '1rem'
    };
    rules['.bw-gap-4'] = {
      'gap': '1.5rem'
    };
    rules['.bw-gap-5'] = {
      'gap': '3rem'
    };

    // Offsets (structural)
    for (var i = 1; i <= 11; i++) {
      rules['.bw-offset-' + i] = {
        'margin-left': (i / 12 * 100).toFixed(6).replace(/\.?0+$/, '') + '%'
      };
    }

    // Code demo (structural)
    rules['.bw-code-demo'] = {
      'margin-bottom': '2rem'
    };
    rules['.bw-code-pre'] = {
      'margin': '0',
      'border': 'none',
      'border-radius': '6px',
      'overflow-x': 'auto'
    };
    rules['.bw-code-block'] = {
      'display': 'block',
      'padding': '1.25rem',
      'font-family': '"SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace',
      'font-size': '0.8125rem',
      'line-height': '1.6'
    };
    rules['.bw-code-copy-btn'] = {
      'position': 'absolute',
      'top': '0.5rem',
      'right': '0.5rem',
      'padding': '0.25rem 0.625rem',
      'font-size': '0.6875rem',
      'border-radius': '4px',
      'cursor': 'pointer',
      'font-family': 'inherit',
      'transition': 'all 0.15s'
    };

    // Button group (structural)
    rules['.bw-btn-group, .bw-btn-group-vertical'] = {
      'position': 'relative',
      'display': 'inline-flex',
      'vertical-align': 'middle'
    };
    rules['.bw-btn-group > .bw-btn, .bw-btn-group-vertical > .bw-btn'] = {
      'position': 'relative',
      'flex': '1 1 auto',
      'border-radius': '0',
      'margin-left': '-1px'
    };
    rules['.bw-btn-group > .bw-btn:first-child'] = {
      'margin-left': '0',
      'border-top-left-radius': '6px',
      'border-bottom-left-radius': '6px'
    };
    rules['.bw-btn-group > .bw-btn:last-child'] = {
      'border-top-right-radius': '6px',
      'border-bottom-right-radius': '6px'
    };
    rules['.bw-btn-group-vertical'] = {
      'flex-direction': 'column',
      'align-items': 'flex-start',
      'justify-content': 'center'
    };
    rules['.bw-btn-group-vertical > .bw-btn'] = {
      'width': '100%',
      'margin-left': '0',
      'margin-top': '-1px'
    };
    rules['.bw-btn-group-vertical > .bw-btn:first-child'] = {
      'margin-top': '0',
      'border-top-left-radius': '6px',
      'border-top-right-radius': '6px',
      'border-bottom-left-radius': '0',
      'border-bottom-right-radius': '0'
    };
    rules['.bw-btn-group-vertical > .bw-btn:last-child'] = {
      'border-top-left-radius': '0',
      'border-top-right-radius': '0',
      'border-bottom-left-radius': '6px',
      'border-bottom-right-radius': '6px'
    };

    // Accordion (structural)
    rules['.bw-accordion'] = {
      'border-radius': '8px',
      'overflow': 'hidden'
    };
    rules['.bw-accordion-item'] = {
      'border': '1px solid transparent'
    };
    rules['.bw-accordion-item + .bw-accordion-item'] = {
      'border-top': '0'
    };
    rules['.bw-accordion-header'] = {
      'margin': '0'
    };
    rules['.bw-accordion-button'] = {
      'position': 'relative',
      'display': 'flex',
      'align-items': 'center',
      'width': '100%',
      'padding': '1rem 1.25rem',
      'font-size': '1rem',
      'font-weight': '500',
      'text-align': 'left',
      'background-color': 'transparent',
      'border': '0',
      'overflow-anchor': 'none',
      'cursor': 'pointer',
      'font-family': 'inherit',
      'transition': 'color 0.15s ease-in-out, background-color 0.15s ease-in-out'
    };
    rules['.bw-accordion-button::after'] = {
      'flex-shrink': '0',
      'width': '1.25rem',
      'height': '1.25rem',
      'margin-left': 'auto',
      'content': '""',
      'background-repeat': 'no-repeat',
      'background-size': '1.25rem',
      'transition': 'transform 0.2s ease-in-out'
    };
    rules['.bw-accordion-button:not(.bw-collapsed)::after'] = {
      'transform': 'rotate(-180deg)'
    };
    rules['.bw-accordion-collapse'] = {
      'max-height': '0',
      'overflow': 'hidden',
      'transition': 'max-height 0.3s ease'
    };
    rules['.bw-accordion-collapse.bw-collapse-show'] = {
      'max-height': 'none'
    };
    rules['.bw-accordion-body'] = {
      'padding': '1rem 1.25rem'
    };

    // Modal (structural)
    rules['.bw-modal'] = {
      'display': 'none',
      'position': 'fixed',
      'top': '0',
      'left': '0',
      'width': '100%',
      'height': '100%',
      'z-index': '1050',
      'overflow-x': 'hidden',
      'overflow-y': 'auto',
      'opacity': '0',
      'transition': 'opacity 0.15s linear'
    };
    rules['.bw-modal.bw-modal-show'] = {
      'display': 'flex',
      'align-items': 'center',
      'justify-content': 'center',
      'opacity': '1'
    };
    rules['.bw-modal-dialog'] = {
      'position': 'relative',
      'width': '100%',
      'max-width': '500px',
      'margin': '1.75rem auto',
      'pointer-events': 'none',
      'transform': 'translateY(-20px)',
      'transition': 'transform 0.2s ease-out'
    };
    rules['.bw-modal.bw-modal-show .bw-modal-dialog'] = {
      'transform': 'translateY(0)'
    };
    rules['.bw-modal-sm'] = {
      'max-width': '300px'
    };
    rules['.bw-modal-lg'] = {
      'max-width': '800px'
    };
    rules['.bw-modal-xl'] = {
      'max-width': '1140px'
    };
    rules['.bw-modal-content'] = {
      'position': 'relative',
      'display': 'flex',
      'flex-direction': 'column',
      'pointer-events': 'auto',
      'background-clip': 'padding-box',
      'border': '1px solid transparent',
      'border-radius': '8px',
      'outline': '0'
    };
    rules['.bw-modal-header'] = {
      'display': 'flex',
      'align-items': 'center',
      'justify-content': 'space-between',
      'padding': '1rem 1.5rem'
    };
    rules['.bw-modal-title'] = {
      'margin': '0',
      'font-size': '1.25rem',
      'font-weight': '600',
      'line-height': '1.3'
    };
    rules['.bw-modal-body'] = {
      'position': 'relative',
      'flex': '1 1 auto',
      'padding': '1.5rem'
    };
    rules['.bw-modal-footer'] = {
      'display': 'flex',
      'flex-wrap': 'wrap',
      'align-items': 'center',
      'justify-content': 'flex-end',
      'padding': '0.75rem 1.5rem',
      'gap': '0.5rem'
    };

    // Carousel (structural)
    rules['.bw-carousel'] = {
      'position': 'relative',
      'overflow': 'hidden',
      'border-radius': '8px'
    };
    rules['.bw-carousel-track'] = {
      'display': 'flex',
      'transition': 'transform 0.4s ease',
      'height': '100%'
    };
    rules['.bw-carousel-slide'] = {
      'min-width': '100%',
      'flex-shrink': '0',
      'overflow': 'hidden',
      'position': 'relative',
      'display': 'flex',
      'align-items': 'center',
      'justify-content': 'center'
    };
    rules['.bw-carousel-slide img'] = {
      'width': '100%',
      'height': '100%',
      'object-fit': 'cover'
    };
    rules['.bw-carousel-caption'] = {
      'position': 'absolute',
      'bottom': '0',
      'left': '0',
      'right': '0',
      'padding': '0.75rem 1rem'
    };
    rules['.bw-carousel-control'] = {
      'position': 'absolute',
      'top': '50%',
      'transform': 'translateY(-50%)',
      'width': '40px',
      'height': '40px',
      'border': 'none',
      'border-radius': '50%',
      'cursor': 'pointer',
      'display': 'flex',
      'align-items': 'center',
      'justify-content': 'center',
      'z-index': '2',
      'padding': '0',
      'transition': 'background-color 0.2s ease'
    };
    rules['.bw-carousel-control img'] = {
      'width': '20px',
      'height': '20px',
      'pointer-events': 'none'
    };
    rules['.bw-carousel-control-prev'] = {
      'left': '10px'
    };
    rules['.bw-carousel-control-next'] = {
      'right': '10px'
    };
    rules['.bw-carousel-indicators'] = {
      'position': 'absolute',
      'bottom': '12px',
      'left': '50%',
      'transform': 'translateX(-50%)',
      'display': 'flex',
      'gap': '6px',
      'z-index': '2'
    };
    rules['.bw-carousel-indicator'] = {
      'width': '10px',
      'height': '10px',
      'border-radius': '50%',
      'border': '2px solid transparent',
      'padding': '0',
      'cursor': 'pointer',
      'transition': 'opacity 0.2s ease, background-color 0.2s ease'
    };

    // Toast (structural)
    rules['.bw-toast-container'] = {
      'position': 'fixed',
      'z-index': '1080',
      'pointer-events': 'none',
      'display': 'flex',
      'flex-direction': 'column',
      'gap': '0.5rem',
      'padding': '1rem'
    };
    rules['.bw-toast'] = {
      'pointer-events': 'auto',
      'width': '350px',
      'max-width': '100%',
      'background-clip': 'padding-box',
      'border-radius': '8px',
      'opacity': '0',
      'transform': 'translateY(-10px)',
      'transition': 'opacity 0.3s ease, transform 0.3s ease'
    };
    rules['.bw-toast.bw-toast-show'] = {
      'opacity': '1',
      'transform': 'translateY(0)'
    };
    rules['.bw-toast.bw-toast-hiding'] = {
      'opacity': '0',
      'transform': 'translateY(-10px)'
    };
    rules['.bw-toast-header'] = {
      'display': 'flex',
      'align-items': 'center',
      'justify-content': 'space-between',
      'padding': '0.5rem 0.75rem',
      'font-size': '0.875rem'
    };
    rules['.bw-toast-body'] = {
      'padding': '0.75rem',
      'font-size': '0.9375rem'
    };

    // Dropdown (structural)
    rules['.bw-dropdown'] = {
      'position': 'relative',
      'display': 'inline-block'
    };
    rules['.bw-dropdown-toggle::after'] = {
      'display': 'inline-block',
      'margin-left': '0.255em',
      'vertical-align': '0.255em',
      'content': '""',
      'border-top': '0.3em solid',
      'border-right': '0.3em solid transparent',
      'border-bottom': '0',
      'border-left': '0.3em solid transparent'
    };
    rules['.bw-dropdown-menu'] = {
      'position': 'absolute',
      'top': '100%',
      'left': '0',
      'z-index': '1000',
      'display': 'none',
      'min-width': '10rem',
      'padding': '0.5rem 0',
      'margin': '0.125rem 0 0',
      'background-clip': 'padding-box',
      'border-radius': '6px'
    };
    rules['.bw-dropdown-menu.bw-dropdown-show'] = {
      'display': 'block'
    };
    rules['.bw-dropdown-menu-end'] = {
      'left': 'auto',
      'right': '0'
    };
    rules['.bw-dropdown-item'] = {
      'display': 'block',
      'width': '100%',
      'padding': '0.375rem 1rem',
      'clear': 'both',
      'font-weight': '400',
      'text-align': 'inherit',
      'text-decoration': 'none',
      'white-space': 'nowrap',
      'background-color': 'transparent',
      'border': '0',
      'font-size': '0.9375rem',
      'transition': 'background-color 0.15s, color 0.15s'
    };
    rules['.bw-dropdown-divider'] = {
      'height': '0',
      'margin': '0.5rem 0',
      'overflow': 'hidden',
      'opacity': '1'
    };

    // Switch (structural)
    rules['.bw-form-switch'] = {
      'padding-left': '2.5em'
    };
    rules['.bw-form-switch .bw-switch-input'] = {
      'width': '2em',
      'height': '1.125em',
      'margin-left': '-2.5em',
      'border-radius': '2em',
      'appearance': 'none',
      'background-position': 'left center',
      'background-repeat': 'no-repeat',
      'background-size': 'contain',
      'transition': 'background-position 0.15s ease-in-out, background-color 0.15s ease-in-out',
      'cursor': 'pointer'
    };
    rules['.bw-form-switch .bw-switch-input:checked'] = {
      'background-position': 'right center'
    };
    rules['.bw-form-switch .bw-switch-input:disabled'] = {
      'opacity': '0.5',
      'cursor': 'not-allowed'
    };

    // Skeleton (structural)
    rules['.bw-skeleton'] = {
      'border-radius': '4px',
      'background-size': '400% 100%',
      'animation': 'bw-skeleton-shimmer 1.4s ease infinite'
    };
    rules['.bw-skeleton-text'] = {
      'height': '1em',
      'margin-bottom': '0.5rem'
    };
    rules['.bw-skeleton-circle'] = {
      'border-radius': '50%'
    };
    rules['.bw-skeleton-rect'] = {
      'border-radius': '8px'
    };
    rules['.bw-skeleton-group'] = {
      'display': 'flex',
      'flex-direction': 'column'
    };
    rules['@keyframes bw-skeleton-shimmer'] = {
      '0%': {
        'background-position': '100% 50%'
      },
      '100%': {
        'background-position': '0 50%'
      }
    };

    // Avatar (structural)
    rules['.bw-avatar'] = {
      'display': 'inline-flex',
      'align-items': 'center',
      'justify-content': 'center',
      'border-radius': '50%',
      'overflow': 'hidden',
      'font-weight': '600',
      'text-transform': 'uppercase',
      'vertical-align': 'middle',
      'object-fit': 'cover'
    };
    rules['.bw-avatar-sm'] = {
      'width': '2rem',
      'height': '2rem',
      'font-size': '0.75rem'
    };
    rules['.bw-avatar-md'] = {
      'width': '3rem',
      'height': '3rem',
      'font-size': '1rem'
    };
    rules['.bw-avatar-lg'] = {
      'width': '4rem',
      'height': '4rem',
      'font-size': '1.25rem'
    };
    rules['.bw-avatar-xl'] = {
      'width': '5rem',
      'height': '5rem',
      'font-size': '1.5rem'
    };

    // Bar chart (structural)
    rules['.bw-bar-chart-container'] = {
      'padding': '1rem',
      'border': '1px solid transparent',
      'border-radius': '8px'
    };
    rules['.bw-bar-chart'] = {
      'display': 'flex',
      'align-items': 'flex-end',
      'gap': '6px',
      'padding': '0 0.5rem'
    };
    rules['.bw-bar-group'] = {
      'flex': '1',
      'display': 'flex',
      'flex-direction': 'column',
      'align-items': 'center',
      'height': '100%',
      'justify-content': 'flex-end'
    };
    rules['.bw-bar'] = {
      'width': '100%',
      'border-radius': '3px 3px 0 0',
      'transition': 'height 0.5s ease',
      'min-height': '4px'
    };
    rules['.bw-bar:hover'] = {
      'opacity': '0.85'
    };
    rules['.bw-bar-value'] = {
      'font-size': '0.65rem',
      'font-weight': '600',
      'margin-bottom': '2px',
      'text-align': 'center'
    };
    rules['.bw-bar-label'] = {
      'font-size': '0.7rem',
      'margin-top': '4px',
      'text-align': 'center'
    };
    rules['.bw-bar-chart-title'] = {
      'font-size': '1.1rem',
      'font-weight': '600',
      'margin': '0 0 0.75rem 0'
    };

    // Spacing utilities (structural)
    var spacingValues = {
      '0': '0',
      '1': '.25rem',
      '2': '.5rem',
      '3': '1rem',
      '4': '1.5rem',
      '5': '3rem'
    };
    for (var k in spacingValues) {
      var v = spacingValues[k];
      rules['.bw-m-' + k] = {
        'margin': v + ' !important'
      };
      rules['.bw-mt-' + k] = {
        'margin-top': v + ' !important'
      };
      rules['.bw-mb-' + k] = {
        'margin-bottom': v + ' !important'
      };
      rules['.bw-ms-' + k] = {
        'margin-left': v + ' !important'
      };
      rules['.bw-me-' + k] = {
        'margin-right': v + ' !important'
      };
      rules['.bw-p-' + k] = {
        'padding': v + ' !important'
      };
      rules['.bw-pt-' + k + ', .pt-' + k] = {
        'padding-top': v + ' !important'
      };
      rules['.bw-pb-' + k + ', .pb-' + k] = {
        'padding-bottom': v + ' !important'
      };
      rules['.bw-ps-' + k + ', .ps-' + k] = {
        'padding-left': v + ' !important'
      };
      rules['.bw-pe-' + k + ', .pe-' + k] = {
        'padding-right': v + ' !important'
      };
    }
    rules['.bw-m-auto, .m-auto'] = {
      'margin': 'auto !important'
    };
    rules['.bw-py-3'] = {
      'padding-top': '1rem !important',
      'padding-bottom': '1rem !important'
    };
    rules['.bw-py-4'] = {
      'padding-top': '1.5rem !important',
      'padding-bottom': '1.5rem !important'
    };
    rules['.bw-py-5'] = {
      'padding-top': '3rem !important',
      'padding-bottom': '3rem !important'
    };
    rules['.bw-py-6'] = {
      'padding-top': '4rem !important',
      'padding-bottom': '4rem !important'
    };

    // Display utilities (structural)
    rules['.bw-d-none'] = {
      'display': 'none'
    };
    rules['.bw-d-block'] = {
      'display': 'block'
    };
    rules['.bw-d-inline'] = {
      'display': 'inline'
    };
    rules['.bw-d-inline-block'] = {
      'display': 'inline-block'
    };
    rules['.bw-d-flex'] = {
      'display': 'flex'
    };
    rules['.bw-text-left'] = {
      'text-align': 'left'
    };
    rules['.bw-text-right'] = {
      'text-align': 'right'
    };
    rules['.bw-text-center'] = {
      'text-align': 'center'
    };

    // Flexbox utilities (structural)
    var jc = {
      start: 'flex-start',
      end: 'flex-end',
      center: 'center',
      between: 'space-between',
      around: 'space-around'
    };
    for (var jk in jc) {
      rules['.bw-justify-content-' + jk + ', .justify-content-' + jk] = {
        'justify-content': jc[jk]
      };
    }
    var ai = {
      start: 'flex-start',
      end: 'flex-end',
      center: 'center'
    };
    for (var ak in ai) {
      rules['.bw-align-items-' + ak + ', .align-items-' + ak] = {
        'align-items': ai[ak]
      };
    }

    // Size utilities (structural)
    ['25', '50', '75', '100'].forEach(function (n) {
      rules['.bw-w-' + n + ', .w-' + n] = {
        'width': n + '% !important'
      };
      rules['.bw-h-' + n + ', .h-' + n] = {
        'height': n + '% !important'
      };
    });
    rules['.bw-w-auto, .w-auto'] = {
      'width': 'auto !important'
    };
    rules['.bw-h-auto, .h-auto'] = {
      'height': 'auto !important'
    };
    rules['.bw-mw-100, .mw-100'] = {
      'max-width': '100% !important'
    };
    rules['.bw-mh-100, .mh-100'] = {
      'max-height': '100% !important'
    };

    // Position utilities (structural)
    ['static', 'relative', 'absolute', 'fixed', 'sticky'].forEach(function (p) {
      rules['.bw-position-' + p + ', .position-' + p] = {
        'position': p + ' !important'
      };
    });
    rules['.bw-translate-middle, .translate-middle'] = {
      'transform': 'translate(-50%, -50%) !important'
    };

    // Overflow utilities (structural)
    ['auto', 'hidden', 'visible', 'scroll'].forEach(function (o) {
      rules['.bw-overflow-' + o + ', .overflow-' + o] = {
        'overflow': o + ' !important'
      };
    });

    // Visibility utilities (structural)
    rules['.bw-visible, .visible'] = {
      'visibility': 'visible !important'
    };
    rules['.bw-invisible, .invisible'] = {
      'visibility': 'hidden !important'
    };

    // User select utilities (structural)
    ['all', 'auto', 'none'].forEach(function (u) {
      rules['.bw-user-select-' + u + ', .user-select-' + u] = {
        'user-select': u + ' !important'
      };
    });

    // Pointer events
    rules['.pe-none'] = {
      'pointer-events': 'none !important'
    };
    rules['.pe-auto'] = {
      'pointer-events': 'auto !important'
    };

    // Typography utilities (structural)
    rules['.fw-light'] = {
      'font-weight': '300 !important'
    };
    rules['.fw-lighter'] = {
      'font-weight': 'lighter !important'
    };
    rules['.fw-normal'] = {
      'font-weight': '400 !important'
    };
    rules['.fw-bold'] = {
      'font-weight': '700 !important'
    };
    rules['.fw-bolder'] = {
      'font-weight': 'bolder !important'
    };
    rules['.fst-italic'] = {
      'font-style': 'italic !important'
    };
    rules['.fst-normal'] = {
      'font-style': 'normal !important'
    };
    rules['.text-decoration-none'] = {
      'text-decoration': 'none !important'
    };
    rules['.text-decoration-underline'] = {
      'text-decoration': 'underline !important'
    };
    rules['.text-decoration-line-through'] = {
      'text-decoration': 'line-through !important'
    };
    rules['.text-lowercase'] = {
      'text-transform': 'lowercase !important'
    };
    rules['.text-uppercase'] = {
      'text-transform': 'uppercase !important'
    };
    rules['.text-capitalize'] = {
      'text-transform': 'capitalize !important'
    };
    rules['.text-wrap'] = {
      'white-space': 'normal !important'
    };
    rules['.text-nowrap'] = {
      'white-space': 'nowrap !important'
    };

    // Font-size utilities (structural)
    rules['.fs-1'] = {
      'font-size': 'calc(1.375rem + 1.5vw) !important'
    };
    rules['.fs-2'] = {
      'font-size': 'calc(1.325rem + .9vw) !important'
    };
    rules['.fs-3'] = {
      'font-size': 'calc(1.3rem + .6vw) !important'
    };
    rules['.fs-4'] = {
      'font-size': 'calc(1.275rem + .3vw) !important'
    };
    rules['.fs-5'] = {
      'font-size': '1.25rem !important'
    };
    rules['.fs-6'] = {
      'font-size': '1rem !important'
    };

    // List utilities (structural)
    rules['.list-unstyled'] = {
      'padding-left': '0',
      'list-style': 'none'
    };
    rules['.list-inline'] = {
      'padding-left': '0',
      'list-style': 'none'
    };
    rules['.list-inline-item'] = {
      'display': 'inline-block'
    };
    rules['.list-inline-item:not(:last-child)'] = {
      'margin-right': '.5rem'
    };

    // Opacity utilities (structural)
    rules['.opacity-0'] = {
      'opacity': '0 !important'
    };
    rules['.opacity-25'] = {
      'opacity': '.25 !important'
    };
    rules['.opacity-50'] = {
      'opacity': '.5 !important'
    };
    rules['.opacity-75'] = {
      'opacity': '.75 !important'
    };
    rules['.opacity-100'] = {
      'opacity': '1 !important'
    };

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
    var result = {};
    for (var _i = 0, _Object$entries = Object.entries(rules); _i < _Object$entries.length; _i++) {
      var _Object$entries$_i = _slicedToArray(_Object$entries[_i], 2),
        selector = _Object$entries$_i[0],
        styles = _Object$entries$_i[1];
      result[selector] = styles;
      if (selector.includes('.bw-')) {
        var underscoreSelector = selector.replace(/\.bw-/g, '.bw_');
        result[underscoreSelector] = styles;
      }
    }
    return result;
  }

  // =========================================================================
  // Theme tokens (backwards compatible)
  // =========================================================================

  var theme = {
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
      '.bw-dark .bw-accordion-item': {
        'background-color': surfaceBg,
        'border-color': borderColor
      },
      '.bw-dark .bw-accordion-button': {
        'color': textColor
      },
      '.bw-dark .bw-accordion-button:not(.bw-collapsed)': {
        'color': '#7dd3e0',
        'background-color': 'rgba(125, 211, 224, 0.1)'
      },
      '.bw-dark .bw-accordion-button:hover': {
        'background-color': bodyBg
      },
      '.bw-dark .bw-accordion-button:not(.bw-collapsed):hover': {
        'background-color': 'rgba(125, 211, 224, 0.15)'
      },
      '.bw-dark .bw-accordion-button:focus-visible': {
        'box-shadow': '0 0 0 0.2rem rgba(125, 211, 224, 0.3)'
      },
      '.bw-dark .bw-accordion-body': {
        'border-top-color': borderColor
      },
      '.bw-dark .bw-carousel': {
        'background-color': bodyBg
      },
      '.bw-dark .bw-carousel-control': {
        'background-color': 'rgba(255,255,255,0.15)'
      },
      '.bw-dark .bw-carousel-control:hover': {
        'background-color': 'rgba(255,255,255,0.25)'
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
        'background': 'linear-gradient(90deg, ' + borderColor + ' 25%, ' + surfaceBg + ' 37%, ' + borderColor + ' 63%)'
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
    for (var _i2 = 0, _Object$keys = Object.keys(source); _i2 < _Object$keys.length; _i2++) {
      var key = _Object$keys[_i2];
      if (source[key] && _typeof(source[key]) === 'object' && !Array.isArray(source[key]) && target[key] && _typeof(target[key]) === 'object' && !Array.isArray(target[key])) {
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
   * Empty stub for bitwrench-components-v2.js.
   * Used by the lean build to exclude all BCCL component code.
   */
  var componentHandles = {};

  var components = /*#__PURE__*/Object.freeze({
    __proto__: null,
    componentHandles: componentHandles
  });

  var _excluded = ["data", "headerRow", "columns"],
    _excluded2 = ["title", "data", "columns", "className", "striped", "hover", "responsive"];

  // Environment-aware module loader for optional Node.js built-ins (fs).
  // Strategy: try require() first (CJS/UMD), fall back to import() (ESM).
  // import() is wrapped in Function() to avoid parse errors in ES5/IE11 environments.

  // Core bitwrench namespace
  var bw = {
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
    getVersion: function getVersion() {
      return _objectSpread2({}, VERSION_INFO);
    },
    // Internal state
    _idCounter: 0,
    _unmountCallbacks: new Map(),
    _topics: {},
    // topic → [{handler, id}]  (plain object for IE11 compat)
    _subIdCounter: 0,
    // monotonic ID for subscriptions

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
      set: function set(x) {
        this._value = typeof x === 'boolean' ? x : 'ignore';
      },
      get: function get() {
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
  bw.isNodeJS = function () {
    // Check monkey patch first (for testing)
    if (bw.__monkey_patch_is_nodejs__.get() !== 'ignore') {
      return bw.__monkey_patch_is_nodejs__.get();
    }

    // Reliable Node.js detection: works in both CJS and ESM
    // - `process.versions.node` exists in Node.js but not browsers
    // - `typeof window` alone is unreliable (jsdom, Electron, Deno)
    return typeof process !== 'undefined' && process.versions != null && process.versions.node != null;
  };

  // Set runtime flags based on detection
  // _isNode: Node.js APIs (fs, process) available — static, won't change at runtime
  // _isBrowser: DOM APIs (document, window) available — dynamic getter because
  //   globals may be set up after module init (e.g., jsdom in test environments)
  // These are NOT mutually exclusive: jsdom provides DOM in Node.js
  bw._isNode = bw.isNodeJS();
  Object.defineProperty(bw, '_isBrowser', {
    get: function get() {
      return typeof document !== 'undefined' && typeof window !== 'undefined';
    },
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
  bw._fsCache = undefined; // undefined = not yet resolved, null = resolved but unavailable
  bw._getFs = function () {
    if (bw._fsCache !== undefined) return Promise.resolve(bw._fsCache);
    if (!bw.isNodeJS()) {
      bw._fsCache = null;
      return Promise.resolve(null);
    }

    // Strategy 1: synchronous require (CJS / UMD in Node.js)
    if (typeof require === 'function') {
      try {
        bw._fsCache = require('fs');
        return Promise.resolve(bw._fsCache);
      } catch (e) {/* require not available or failed, try import */}
    }

    // Strategy 2: dynamic import (ESM in Node.js)
    // Wrapped in Function() so the import() keyword isn't parsed by ES5 engines
    try {
      var _importDynamic = new Function('m', 'return import(m)');
      return _importDynamic('fs').then(function (mod) {
        bw._fsCache = mod["default"] || mod;
        return bw._fsCache;
      })["catch"](function () {
        bw._fsCache = null;
        return null;
      });
    } catch (e) {
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
  bw.typeOf = function (x, baseTypeOnly) {
    if (x === null) return "null";
    var basic = _typeof(x);
    if (basic !== "object") {
      return basic; // covers: string, number, boolean, undefined, function, symbol, bigint
    }
    if (baseTypeOnly) return basic;
    var stringTag = Object.prototype.toString.call(x);
    var typeMap = {
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
  bw.uuid = function (prefix) {
    // Optional prefix creates IDs like bw_card_<hex>, bw_todo_<hex>, etc.
    // Without prefix: bw_<hex>
    var tag = prefix ? 'bw_' + prefix + '_' : 'bw_';

    // Use crypto.randomUUID if available (modern browsers)
    if (bw._isBrowser && crypto && crypto.randomUUID) {
      return tag + crypto.randomUUID().replace(/-/g, '');
    }

    // Fallback for older browsers and Node.js
    var timestamp = Date.now().toString(36);
    var counter = (++bw._idCounter).toString(36);
    var random = Math.random().toString(36).substring(2, 11);
    return "".concat(tag).concat(timestamp, "_").concat(counter, "_").concat(random);
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
  bw._el = function (id) {
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
  bw._registerNode = function (el, bwId) {
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
  bw._deregisterNode = function (el, bwId) {
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
  bw.escapeHTML = function (str) {
    if (typeof str !== 'string') return '';
    var escapeMap = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
      '/': '&#x2F;'
    };
    return str.replace(/[&<>"'/]/g, function (_char) {
      return escapeMap[_char];
    });
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
  bw.raw = function (str) {
    return {
      __bw_raw: true,
      v: String(str)
    };
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
  bw.normalizeClass = function (classStr) {
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
  bw.html = function (taco) {
    var _attrs$class;
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    // Handle null/undefined
    if (taco == null) return '';

    // Handle arrays of TACOs
    if (Array.isArray(taco)) {
      return taco.map(function (t) {
        return bw.html(t, options);
      }).join('');
    }

    // Handle bw.raw() marked content
    if (taco && taco.__bw_raw) {
      return taco.v;
    }

    // Handle primitives and non-TACO objects
    if (_typeof(taco) !== 'object' || !taco.t) {
      return options.raw ? String(taco) : bw.escapeHTML(String(taco));
    }
    var tag = taco.t,
      _taco$a = taco.a,
      attrs = _taco$a === void 0 ? {} : _taco$a,
      content = taco.c,
      _taco$o = taco.o,
      opts = _taco$o === void 0 ? {} : _taco$o;

    // Self-closing tags
    var selfClosing = ['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'];
    var isSelfClosing = selfClosing.includes(tag.toLowerCase());

    // Build attributes string
    var attrStr = '';
    for (var _i = 0, _Object$entries = Object.entries(attrs); _i < _Object$entries.length; _i++) {
      var _Object$entries$_i = _slicedToArray(_Object$entries[_i], 2),
        key = _Object$entries$_i[0],
        value = _Object$entries$_i[1];
      // Skip null, undefined, false
      if (value == null || value === false) continue;

      // Skip event handlers (they're for DOM only)
      if (key.startsWith('on')) continue;
      if (key === 'style' && _typeof(value) === 'object') {
        // Convert style object to string
        var styleStr = Object.entries(value).filter(function (_ref) {
          var _ref2 = _slicedToArray(_ref, 2),
            v = _ref2[1];
          return v != null;
        }).map(function (_ref3) {
          var _ref4 = _slicedToArray(_ref3, 2),
            k = _ref4[0],
            v = _ref4[1];
          return "".concat(k, ":").concat(v);
        }).join(';');
        if (styleStr) {
          attrStr += " style=\"".concat(bw.escapeHTML(styleStr), "\"");
        }
      } else if (key === 'class') {
        // Handle class as array or string, normalize bw_ to bw-
        var classStr = bw.normalizeClass(Array.isArray(value) ? value.filter(Boolean).join(' ') : String(value));
        if (classStr) {
          attrStr += " class=\"".concat(bw.escapeHTML(classStr), "\"");
        }
      } else if (value === true) {
        // Boolean attributes
        attrStr += " ".concat(key);
      } else {
        // Regular attributes
        attrStr += " ".concat(key, "=\"").concat(bw.escapeHTML(String(value)), "\"");
      }
    }

    // Add bw-id as a class if lifecycle hooks present
    if ((opts.mounted || opts.unmount) && !((_attrs$class = attrs["class"]) !== null && _attrs$class !== void 0 && _attrs$class.includes('bw-id-'))) {
      var id = opts.bw_id || bw.uuid();
      attrStr = attrStr.replace(/class="([^"]*)"/, function (_match, classes) {
        return "class=\"".concat(classes, " bw-id-").concat(id, "\"").trim();
      });
      if (!attrStr.includes('class=')) {
        attrStr += " class=\"bw-id-".concat(id, "\"");
      }
    }

    // Build HTML
    if (isSelfClosing) {
      return "<".concat(tag).concat(attrStr, " />");
    }

    // Process content recursively
    var contentStr = content != null ? bw.html(content, options) : '';
    return "<".concat(tag).concat(attrStr, ">").concat(contentStr, "</").concat(tag, ">");
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
  bw.createDOM = function (taco) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
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
    if (_typeof(taco) !== 'object' || !taco.t) {
      return document.createTextNode(String(taco));
    }
    var tag = taco.t,
      _taco$a2 = taco.a,
      attrs = _taco$a2 === void 0 ? {} : _taco$a2,
      content = taco.c,
      _taco$o2 = taco.o,
      opts = _taco$o2 === void 0 ? {} : _taco$o2;

    // Create element
    var el = document.createElement(tag);

    // Set attributes
    for (var _i2 = 0, _Object$entries2 = Object.entries(attrs); _i2 < _Object$entries2.length; _i2++) {
      var _Object$entries2$_i = _slicedToArray(_Object$entries2[_i2], 2),
        key = _Object$entries2$_i[0],
        value = _Object$entries2$_i[1];
      if (value == null || value === false) continue;
      if (key === 'style' && _typeof(value) === 'object') {
        // Apply styles directly
        Object.assign(el.style, value);
      } else if (key === 'class') {
        // Handle class as array or string, normalize bw_ to bw-
        var classStr = bw.normalizeClass(Array.isArray(value) ? value.filter(Boolean).join(' ') : String(value));
        if (classStr) {
          el.className = classStr;
        }
      } else if (key.startsWith('on') && typeof value === 'function') {
        // Event handlers
        var eventName = key.slice(2).toLowerCase();
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
        content.forEach(function (child) {
          if (child != null) {
            var childEl = bw.createDOM(child, options);
            el.appendChild(childEl);
            // Build local refs for addressable children
            var childBwId = child && child.a ? child.a['data-bw-id'] || child.a.id : null;
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
      } else if (_typeof(content) === 'object' && content.__bw_raw) {
        // Raw HTML content — inject via innerHTML
        el.innerHTML = content.v;
      } else if (_typeof(content) === 'object' && content.t) {
        var childEl = bw.createDOM(content, options);
        el.appendChild(childEl);
        var childBwId = content.a ? content.a['data-bw-id'] || content.a.id : null;
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
      var id = attrs['data-bw-id'] || bw.uuid();
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
          requestAnimationFrame(function () {
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
          requestAnimationFrame(function () {
            if (document.body.contains(el)) {
              opts.mounted(el, el._bw_state || {});
            }
          });
        }
      }

      // Store unmount callback
      if (opts.unmount) {
        bw._unmountCallbacks.set(id, function () {
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
  bw.DOM = function (target, taco) {
    var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    if (!bw._isBrowser) {
      throw new Error('bw.DOM requires a DOM environment (document/window). Use bw.html() instead.');
    }

    // Get target element (use cache-backed lookup)
    var targetEl = bw._el(target);
    if (!targetEl) {
      console.error('bw.DOM: Target element not found:', target);
      return null;
    }

    // Clean up existing children (but preserve the target's own state, render, and subs —
    // the target is the mount point, not the content being replaced)
    var savedState = targetEl._bw_state;
    var savedRender = targetEl._bw_render;
    var savedBwId = targetEl.getAttribute('data-bw-id');
    var savedSubs = targetEl._bw_subs;

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
        taco.forEach(function (t) {
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
  bw.compileProps = function (handle) {
    var props = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var compiledProps = {};
    Object.keys(props).forEach(function (key) {
      // Create getter/setter for each prop
      Object.defineProperty(compiledProps, key, {
        get: function get() {
          return handle._props[key];
        },
        set: function set(value) {
          var oldValue = handle._props[key];
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
  bw.renderComponent = function (taco) {
    var _taco$o3;
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var element = bw.createDOM(taco, options);

    // Enhanced handle with prop compilation
    var handle = {
      element: element,
      taco: taco,
      _props: _objectSpread2({}, taco.a),
      // Store props internally
      _state: ((_taco$o3 = taco.o) === null || _taco$o3 === void 0 ? void 0 : _taco$o3.state) || {},
      _children: {},
      // Store child component references

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
      $: function $(selector) {
        return this.element.querySelectorAll(selector);
      },
      /**
       * Query the first matching element within this component
       * @param {string} selector - CSS selector
       * @returns {Element|null} First matching element or null
       */
      $first: function $first(selector) {
        return this.element.querySelector(selector);
      },
      /**
       * Update component with new props and re-render in place
       * @param {Object} newProps - Properties to merge into current props
       * @returns {Object} this handle (for chaining)
       */
      update: function update(newProps) {
        // Update internal props
        Object.assign(this._props, newProps);

        // Rebuild TACO with new props
        var newTaco = _objectSpread2(_objectSpread2({}, this.taco), {}, {
          a: _objectSpread2(_objectSpread2({}, this.taco.a), newProps)
        });
        var newElement = bw.createDOM(newTaco, options);

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
      render: function render() {
        var newElement = bw.createDOM(this.taco, options);
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
      onPropChange: function onPropChange(_key, _newValue, _oldValue) {
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
      setState: function setState(updates) {
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
      addChild: function addChild(name, component) {
        this._children[name] = component;
        return this;
      },
      /**
       * Retrieve a registered child component by name
       * @param {string} name - Child name key
       * @returns {Object|undefined} Child component handle
       */
      getChild: function getChild(name) {
        return this._children[name];
      },
      /**
       * Destroy this component and all registered children
       *
       * Calls destroy() recursively on children, runs bw.cleanup(),
       * removes the element from DOM, and clears all internal references.
       */
      destroy: function destroy() {
        // Destroy children first
        Object.values(this._children).forEach(function (child) {
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
  bw.cleanup = function (element) {
    if (!bw._isBrowser || !element) return;

    // Find all elements with data-bw-id
    var elements = element.querySelectorAll('[data-bw-id]');
    elements.forEach(function (el) {
      var id = el.getAttribute('data-bw-id');
      var callback = bw._unmountCallbacks.get(id);
      if (callback) {
        callback();
        bw._unmountCallbacks["delete"](id);
      }

      // Deregister from node cache
      bw._deregisterNode(el, id);

      // Clean up pub/sub subscriptions tied to this element
      if (el._bw_subs) {
        el._bw_subs.forEach(function (unsub) {
          unsub();
        });
        delete el._bw_subs;
      }

      // Clean up state, render, and local refs
      delete el._bw_state;
      delete el._bw_render;
      delete el._bw_refs;
    });

    // Check element itself
    var id = element.getAttribute('data-bw-id');
    if (id) {
      var callback = bw._unmountCallbacks.get(id);
      if (callback) {
        callback();
        bw._unmountCallbacks["delete"](id);
      }

      // Deregister from node cache
      bw._deregisterNode(element, id);

      // Clean up pub/sub subscriptions tied to element itself
      if (element._bw_subs) {
        element._bw_subs.forEach(function (unsub) {
          unsub();
        });
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
  bw.update = function (target) {
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
  bw.patch = function (id, content, attr) {
    var el = bw._el(id);
    if (!el) return null;
    if (attr) {
      // Patch an attribute
      el.setAttribute(attr, String(content));
    } else if (Array.isArray(content)) {
      // Patch with array of children (strings and/or TACOs)
      el.innerHTML = '';
      content.forEach(function (item) {
        if (typeof item === 'string' || typeof item === 'number') {
          el.appendChild(document.createTextNode(String(item)));
        } else if (item && item.t) {
          el.appendChild(bw.createDOM(item));
        }
      });
    } else if (_typeof(content) === 'object' && content !== null && content.t) {
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
  bw.patchAll = function (patches) {
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
  bw.emit = function (target, eventName, detail) {
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
  bw.on = function (target, eventName, handler) {
    var el = bw._el(target);
    if (el) {
      el.addEventListener('bw:' + eventName, function (e) {
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
  bw.pub = function (topic, detail) {
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
  bw.sub = function (topic, handler, el) {
    var id = ++bw._subIdCounter;
    if (!bw._topics[topic]) bw._topics[topic] = [];
    bw._topics[topic].push({
      handler: handler,
      id: id
    });
    var unsub = function unsub() {
      var subs = bw._topics[topic];
      if (!subs) return;
      bw._topics[topic] = subs.filter(function (s) {
        return s.id !== id;
      });
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
  bw.unsub = function (topic, handler) {
    var subs = bw._topics[topic];
    if (!subs) return 0;
    var before = subs.length;
    bw._topics[topic] = subs.filter(function (s) {
      return s.handler !== handler;
    });
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
  bw.css = function (rules) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var _options$minify = options.minify,
      minify = _options$minify === void 0 ? false : _options$minify,
      _options$pretty = options.pretty,
      pretty = _options$pretty === void 0 ? !minify : _options$pretty;
    if (typeof rules === 'string') return rules;
    var css = '';
    var indent = pretty ? '  ' : '';
    var newline = pretty ? '\n' : '';
    var space = pretty ? ' ' : '';
    if (Array.isArray(rules)) {
      css = rules.map(function (rule) {
        return bw.css(rule, options);
      }).join(newline);
    } else if (_typeof(rules) === 'object') {
      Object.entries(rules).forEach(function (_ref5) {
        var _ref6 = _slicedToArray(_ref5, 2),
          selector = _ref6[0],
          styles = _ref6[1];
        if (_typeof(styles) === 'object' && !Array.isArray(styles)) {
          // Handle @media, @keyframes, @supports — recurse into nested block
          if (selector.charAt(0) === '@') {
            var inner = bw.css(styles, options);
            if (inner) {
              css += "".concat(selector).concat(space, "{").concat(newline).concat(inner).concat(newline, "}").concat(newline);
            }
            return;
          }
          var declarations = Object.entries(styles).filter(function (_ref7) {
            var _ref8 = _slicedToArray(_ref7, 2),
              value = _ref8[1];
            return value != null;
          }).map(function (_ref9) {
            var _ref0 = _slicedToArray(_ref9, 2),
              prop = _ref0[0],
              value = _ref0[1];
            // Convert camelCase to kebab-case
            var kebabProp = prop.replace(/[A-Z]/g, function (m) {
              return '-' + m.toLowerCase();
            });
            return "".concat(indent).concat(kebabProp, ":").concat(space).concat(value, ";");
          }).join(newline);
          if (declarations) {
            css += "".concat(selector).concat(space, "{").concat(newline).concat(declarations).concat(newline, "}").concat(newline);
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
  bw.injectCSS = function (css) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    if (!bw._isBrowser) {
      console.warn('bw.injectCSS requires a DOM environment');
      return null;
    }
    var _options$id = options.id,
      id = _options$id === void 0 ? 'bw-styles' : _options$id,
      _options$append = options.append,
      append = _options$append === void 0 ? true : _options$append;

    // Get or create style element
    var styleEl = document.getElementById(id);
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = id;
      styleEl.type = 'text/css';
      document.head.appendChild(styleEl);
    }

    // Convert CSS if needed
    var cssStr = typeof css === 'string' ? css : bw.css(css, options);

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
  bw.s = function () {
    var result = {};
    for (var i = 0; i < arguments.length; i++) {
      var arg = arguments[i];
      if (arg && _typeof(arg) === 'object') Object.assign(result, arg);
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
    flex: {
      display: 'flex'
    },
    flexCol: {
      display: 'flex',
      flexDirection: 'column'
    },
    flexRow: {
      display: 'flex',
      flexDirection: 'row'
    },
    flexWrap: {
      display: 'flex',
      flexWrap: 'wrap'
    },
    block: {
      display: 'block'
    },
    inline: {
      display: 'inline'
    },
    hidden: {
      display: 'none'
    },
    // Flex alignment
    justifyCenter: {
      justifyContent: 'center'
    },
    justifyBetween: {
      justifyContent: 'space-between'
    },
    justifyEnd: {
      justifyContent: 'flex-end'
    },
    alignCenter: {
      alignItems: 'center'
    },
    alignStart: {
      alignItems: 'flex-start'
    },
    alignEnd: {
      alignItems: 'flex-end'
    },
    // Gap (0.25rem increments)
    gap1: {
      gap: '0.25rem'
    },
    gap2: {
      gap: '0.5rem'
    },
    gap3: {
      gap: '0.75rem'
    },
    gap4: {
      gap: '1rem'
    },
    gap6: {
      gap: '1.5rem'
    },
    gap8: {
      gap: '2rem'
    },
    // Padding
    p0: {
      padding: '0'
    },
    p1: {
      padding: '0.25rem'
    },
    p2: {
      padding: '0.5rem'
    },
    p3: {
      padding: '0.75rem'
    },
    p4: {
      padding: '1rem'
    },
    p6: {
      padding: '1.5rem'
    },
    p8: {
      padding: '2rem'
    },
    px4: {
      paddingLeft: '1rem',
      paddingRight: '1rem'
    },
    py2: {
      paddingTop: '0.5rem',
      paddingBottom: '0.5rem'
    },
    py4: {
      paddingTop: '1rem',
      paddingBottom: '1rem'
    },
    // Margin (same scale)
    m0: {
      margin: '0'
    },
    m4: {
      margin: '1rem'
    },
    mt2: {
      marginTop: '0.5rem'
    },
    mt4: {
      marginTop: '1rem'
    },
    mb2: {
      marginBottom: '0.5rem'
    },
    mb4: {
      marginBottom: '1rem'
    },
    mx_auto: {
      marginLeft: 'auto',
      marginRight: 'auto'
    },
    // Typography
    textSm: {
      fontSize: '0.875rem'
    },
    textBase: {
      fontSize: '1rem'
    },
    textLg: {
      fontSize: '1.125rem'
    },
    textXl: {
      fontSize: '1.25rem'
    },
    text2xl: {
      fontSize: '1.5rem'
    },
    text3xl: {
      fontSize: '1.875rem'
    },
    bold: {
      fontWeight: '700'
    },
    semibold: {
      fontWeight: '600'
    },
    italic: {
      fontStyle: 'italic'
    },
    textCenter: {
      textAlign: 'center'
    },
    textRight: {
      textAlign: 'right'
    },
    // Colors (from design tokens)
    bgWhite: {
      background: '#ffffff'
    },
    bgTeal: {
      background: '#006666',
      color: '#ffffff'
    },
    textWhite: {
      color: '#ffffff'
    },
    textTeal: {
      color: '#006666'
    },
    textMuted: {
      color: '#888'
    },
    // Borders
    rounded: {
      borderRadius: '0.375rem'
    },
    roundedLg: {
      borderRadius: '0.5rem'
    },
    roundedFull: {
      borderRadius: '9999px'
    },
    border: {
      border: '1px solid #d8d8d8'
    },
    // Sizing
    wFull: {
      width: '100%'
    },
    hFull: {
      height: '100%'
    },
    // Transitions
    transition: {
      transition: 'all 0.2s ease'
    }
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
  bw.responsive = function (selector, breakpoints) {
    var sizes = {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px'
    };
    var parts = [];
    Object.keys(breakpoints).forEach(function (key) {
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
  bw.mapScale = function (x, in0, in1, out0, out1) {
    var options = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : {};
    var _options$clip = options.clip,
      clip = _options$clip === void 0 ? false : _options$clip,
      _options$expScale = options.expScale,
      expScale = _options$expScale === void 0 ? 1 : _options$expScale;

    // Normalize to 0-1
    var normalized = (x - in0) / (in1 - in0);

    // Apply exponential scaling
    if (expScale !== 1) {
      normalized = Math.pow(normalized, expScale);
    }

    // Map to output range
    var result = normalized * (out1 - out0) + out0;

    // Clip if requested
    if (clip) {
      var min = Math.min(out0, out1);
      var max = Math.max(out0, out1);
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
  bw.clip = function (value, min, max) {
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
    bw.$ = function (selector) {
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
    bw.$.one = function (selector) {
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
  bw.loadDefaultStyles = function () {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var _options$minify2 = options.minify,
      minify = _options$minify2 === void 0 ? true : _options$minify2,
      palette = options.palette;

    // 1. Inject structural CSS (layout, sizing — never changes with theme)
    if (bw._isBrowser) {
      var structuralCSS = bw.css(getStructuralStyles());
      bw.injectCSS(structuralCSS, {
        id: 'bw-structural',
        append: false,
        minify: minify
      });
    }

    // 2. Inject cosmetic CSS via generateTheme (colors, shadows, radii)
    var paletteConfig = Object.assign({}, DEFAULT_PALETTE_CONFIG, palette || {});
    var result = bw.generateTheme('', Object.assign({}, paletteConfig, {
      inject: true
    }));
    return result;
  };

  /**
   * Get the current theme configuration as a deep copy.
   *
   * @returns {Object} Theme object with colors, fonts, spacing, etc.
   * @category CSS & Styling
   * @see bw.setTheme
   */
  bw.getTheme = function () {
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
  bw.setTheme = function (overrides) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    if (typeof console !== 'undefined' && console.warn) {
      console.warn('bw.setTheme() is deprecated. Use bw.generateTheme() instead.');
    }
    var _options$inject = options.inject,
      inject = _options$inject === void 0 ? true : _options$inject;
    updateTheme(overrides);

    // Update CSS custom properties if colors changed and we're in browser
    if (inject && bw._isBrowser && overrides.colors) {
      var root = document.documentElement;
      for (var _i3 = 0, _Object$entries3 = Object.entries(overrides.colors); _i3 < _Object$entries3.length; _i3++) {
        var _Object$entries3$_i = _slicedToArray(_Object$entries3[_i3], 2),
          name = _Object$entries3$_i[0],
          value = _Object$entries3$_i[1];
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
  bw.toggleDarkMode = function (force) {
    var isDark = force !== undefined ? force : !theme.darkMode;
    theme.darkMode = isDark;
    if (bw._isBrowser) {
      var root = document.documentElement;
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
  bw.generateTheme = function (name, config) {
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
      bw.injectCSS(cssStr, {
        id: styleId,
        append: false
      });
    }

    // Update bw.u color entries to reflect the palette
    if (!name) {
      bw.u.bgTeal = {
        background: palette.primary.base,
        color: palette.primary.textOn
      };
      bw.u.textTeal = {
        color: palette.primary.base
      };
      bw.u.bgWhite = {
        background: '#ffffff'
      };
      bw.u.textWhite = {
        color: '#ffffff'
      };
    }
    return {
      css: cssStr,
      palette: palette,
      name: name
    };
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
  bw.choice = function (x, choices, def) {
    var z = x in choices ? choices[x] : def;
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
  bw.arrayUniq = function (x) {
    if (bw.typeOf(x) !== "array") return [];
    return x.filter(function (v, i, arr) {
      return arr.indexOf(v) === i;
    });
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
  bw.arrayBinA = function (a, b) {
    if (bw.typeOf(a) !== "array" || bw.typeOf(b) !== "array") return [];
    return bw.arrayUniq(a.filter(function (n) {
      return b.indexOf(n) !== -1;
    }));
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
  bw.arrayBNotInA = function (a, b) {
    if (bw.typeOf(a) !== "array" || bw.typeOf(b) !== "array") return [];
    return bw.arrayUniq(b.filter(function (n) {
      return a.indexOf(n) < 0;
    }));
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
  bw.colorInterp = function (x, in0, in1, colors, stretch) {
    var c = Array.isArray(colors) ? colors : ["#000", "#fff"];
    c = c.length === 0 ? ["#000", "#fff"] : c;
    if (c.length === 1) return c[0];

    // Convert all colors to RGB format
    c = c.map(function (col) {
      return bw.colorParse(col);
    });
    var a = bw.mapScale(x, in0, in1, 0, c.length - 1, {
      clip: true,
      expScale: stretch
    });
    var i = bw.clip(Math.floor(a), 0, c.length - 2);
    var r = a - i;
    var interp = function interp(idx) {
      return bw.mapScale(r, 0, 1, c[i][idx], c[i + 1][idx], {
        clip: true
      });
    };
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
  bw.colorHslToRgb = function (h, s, l) {
    var a = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 255;
    var rnd = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : true;
    if (bw.typeOf(h) === "array") {
      s = h[1];
      l = h[2];
      a = h[3];
      h = h[0];
    }
    var hNorm = h / 360;
    var sNorm = s / 100;
    var lNorm = l / 100;
    var r, g, b;
    if (sNorm === 0) {
      r = g = b = lNorm * 255;
    } else {
      var hue2rgb = function hue2rgb(p, q, t) {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };
      var q = lNorm < 0.5 ? lNorm * (1 + sNorm) : lNorm + sNorm - lNorm * sNorm;
      var p = 2 * lNorm - q;
      r = hue2rgb(p, q, hNorm + 1 / 3) * 255;
      g = hue2rgb(p, q, hNorm) * 255;
      b = hue2rgb(p, q, hNorm - 1 / 3) * 255;
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
  bw.colorRgbToHsl = function (r, g, b) {
    var a = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 255;
    var rnd = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : true;
    if (bw.typeOf(r) === "array") {
      g = r[1];
      b = r[2];
      a = r[3];
      r = r[0];
    }
    r /= 255;
    g /= 255;
    b /= 255;
    var max = Math.max(r, g, b);
    var min = Math.min(r, g, b);
    var h,
      s,
      l = (max + min) / 2;
    if (max === min) {
      h = s = 0; // achromatic
    } else {
      var d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r:
          h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
          break;
        case g:
          h = ((b - r) / d + 2) / 6;
          break;
        case b:
          h = ((r - g) / d + 4) / 6;
          break;
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
  bw.colorParse = function (s) {
    var defAlpha = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 255;
    var r = [0, 0, 0, defAlpha, "rgb"]; // default return

    if (bw.typeOf(s) === "array") {
      // Handle bitwrench color array
      var df = [0, 0, 0, 255, "rgb"];
      for (var p = 0; p < s.length && p < df.length; p++) {
        df[p] = s[p];
      }
      return df;
    }
    s = String(s).replace(/\s/g, "");

    // Handle hex colors
    if (s[0] === "#") {
      var hex = s.slice(1);
      if (hex.length === 3 || hex.length === 4) {
        // #rgb or #rgba
        for (var i = 0; i < hex.length; i++) {
          r[i] = parseInt(hex[i] + hex[i], 16);
        }
      } else if (hex.length === 6 || hex.length === 8) {
        // #rrggbb or #rrggbbaa
        for (var _i4 = 0; _i4 < hex.length; _i4 += 2) {
          r[_i4 / 2] = parseInt(hex.substring(_i4, _i4 + 2), 16);
        }
      }
    } else {
      // Handle rgb() rgba() hsl() hsla()
      var match = s.match(/^(rgb|hsl)a?\(([^)]+)\)$/i);
      if (match) {
        var type = match[1].toLowerCase();
        var values = match[2].split(",").map(function (v) {
          return parseFloat(v);
        });
        if (type === "rgb") {
          r[0] = values[0] || 0;
          r[1] = values[1] || 0;
          r[2] = values[2] || 0;
          r[3] = values[3] !== undefined ? values[3] * 255 : defAlpha;
          r[4] = "rgb";
        } else if (type === "hsl") {
          var rgb = bw.colorHslToRgb(values[0] || 0, values[1] || 0, values[2] || 0, values[3] !== undefined ? values[3] * 255 : defAlpha);
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
  bw.setCookie = function (cname, cvalue, exdays) {
    var options = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
    if (!bw._isBrowser) return;
    var d = new Date();
    d.setTime(d.getTime() + exdays * 24 * 60 * 60 * 1000);
    var cookie = "".concat(cname, "=").concat(cvalue, "; expires=").concat(d.toUTCString());

    // Add additional options
    if (options.path) cookie += "; path=".concat(options.path);
    if (options.domain) cookie += "; domain=".concat(options.domain);
    if (options.secure) cookie += '; secure';
    if (options.sameSite) cookie += "; samesite=".concat(options.sameSite);
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
  bw.getCookie = function (cname, defaultValue) {
    if (!bw._isBrowser) return defaultValue;
    var name = cname + "=";
    var ca = document.cookie.split(";");
    for (var i = 0; i < ca.length; i++) {
      var c = ca[i];
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
  bw.getURLParam = function (key, defaultValue) {
    if (!bw._isBrowser || (typeof window === "undefined" ? "undefined" : _typeof(window)) !== "object") return defaultValue;
    try {
      var params = new URLSearchParams(window.location.search);
      if (!key) {
        // Return all params as object
        var result = {};
        var _iterator = _createForOfIteratorHelper(params),
          _step;
        try {
          for (_iterator.s(); !(_step = _iterator.n()).done;) {
            var _step$value = _slicedToArray(_step.value, 2),
              k = _step$value[0],
              v = _step$value[1];
            result[k] = v || true;
          }
        } catch (err) {
          _iterator.e(err);
        } finally {
          _iterator.f();
        }
        return result;
      }
      return params.has(key) ? params.get(key) || true : defaultValue;
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
  bw.htmlTable = function (data) {
    var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    console.warn('bw.htmlTable() is deprecated. Use bw.makeTableFromArray() for TACO output or bw.makeTable() for object-array data.');
    if (bw.typeOf(data) !== "array" || data.length < 1) return "";
    var dopts = {
      useFirstRowAsHeaders: true,
      caption: null,
      atr: {
        "class": "table"
      },
      thead_atr: {},
      th_atr: {},
      tbody_atr: {},
      tr_atr: {},
      td_atr: {}
    };
    Object.assign(dopts, opts);
    var html = "<table".concat(bw._attrsToStr(dopts.atr), ">");
    if (dopts.caption) {
      html += "<caption>".concat(bw.escapeHTML(dopts.caption), "</caption>");
    }
    var startRow = 0;

    // Handle header row
    if (dopts.useFirstRowAsHeaders && data.length > 0) {
      html += "<thead".concat(bw._attrsToStr(dopts.thead_atr), ">");
      html += "<tr".concat(bw._attrsToStr(dopts.tr_atr), ">");
      data[0].forEach(function (cell) {
        html += "<th".concat(bw._attrsToStr(dopts.th_atr), ">").concat(bw.escapeHTML(String(cell)), "</th>");
      });
      html += "</tr></thead>";
      startRow = 1;
    }

    // Body rows
    if (data.length > startRow) {
      html += "<tbody".concat(bw._attrsToStr(dopts.tbody_atr), ">");
      for (var i = startRow; i < data.length; i++) {
        html += "<tr".concat(bw._attrsToStr(dopts.tr_atr), ">");
        data[i].forEach(function (cell) {
          html += "<td".concat(bw._attrsToStr(dopts.td_atr), ">").concat(bw.escapeHTML(String(cell)), "</td>");
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
  bw._attrsToStr = function (attrs) {
    if (!attrs || _typeof(attrs) !== "object") return "";
    var str = "";
    for (var _i5 = 0, _Object$entries4 = Object.entries(attrs); _i5 < _Object$entries4.length; _i5++) {
      var _Object$entries4$_i = _slicedToArray(_Object$entries4[_i5], 2),
        key = _Object$entries4$_i[0],
        value = _Object$entries4$_i[1];
      if (value != null && value !== false) {
        if (value === true) {
          str += " ".concat(key);
        } else {
          str += " ".concat(key, "=\"").concat(bw.escapeHTML(String(value)), "\"");
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
  bw.htmlTabs = function (tabData) {
    var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    console.warn('bw.htmlTabs() is deprecated. Use bw.makeTabs() instead.');
    if (bw.typeOf(tabData) !== "array" || tabData.length < 1) return "";
    var dopts = {
      atr: {
        "class": "bw-tab-container"
      },
      tab_atr: {
        "class": "bw-tab-item-list"
      },
      tabc_atr: {
        "class": "bw-tab-content-list"
      }
    };
    Object.assign(dopts, opts);

    // Create tab items
    var tabItems = tabData.map(function (tab, idx) {
      return {
        t: "li",
        a: {
          "class": idx === 0 ? "bw-tab-item bw-tab-active" : "bw-tab-item",
          onclick: "bw.selectTabContent(this)"
        },
        c: tab[0]
      };
    });

    // Create tab content
    var tabContent = tabData.map(function (tab, idx) {
      return {
        t: "div",
        a: {
          "class": idx === 0 ? "bw-tab-content bw-show" : "bw-tab-content"
        },
        c: tab[1]
      };
    });
    return bw.html({
      t: "div",
      a: dopts.atr,
      c: [{
        t: "ul",
        a: dopts.tab_atr,
        c: tabItems
      }, {
        t: "div",
        a: dopts.tabc_atr,
        c: tabContent
      }]
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
  bw.selectTabContent = function (tabElement) {
    console.warn('bw.selectTabContent() is deprecated. Use bw.makeTabs() instead.');
    if (!bw._isBrowser || !tabElement) return;
    var container = tabElement.closest(".bw-tab-container");
    if (!container) return;

    // Remove active class from all tabs
    container.querySelectorAll(".bw-tab-item").forEach(function (tab) {
      tab.classList.remove("bw-tab-active");
    });

    // Add active to clicked tab
    tabElement.classList.add("bw-tab-active");

    // Get tab index
    var tabIndex = Array.from(tabElement.parentElement.children).indexOf(tabElement);

    // Hide all content
    container.querySelectorAll(".bw-tab-content").forEach(function (content) {
      content.classList.remove("bw-show");
    });

    // Show selected content
    var contents = container.querySelectorAll(".bw-tab-content");
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
  bw.loremIpsum = function (numChars, startSpot) {
    var startWithCapitalLetter = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;
    var lorem = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. ";

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
    var skippedChars = 0;
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
    var l = lorem.substring(startSpot) + lorem.substring(0, startSpot);
    var result = "";
    var remaining = numChars + skippedChars; // Add skipped chars to honor original numChars

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
      var c = result[0].toUpperCase();
      c = /[A-Z]/.test(c) ? c : "L"; // Use "L" as default if first char isn't a letter
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
  bw.multiArray = function (value, dims) {
    var v = function v() {
      return bw.typeOf(value) === "function" ? value() : value;
    };
    dims = typeof dims === "number" ? [dims] : dims;
    var _createArray = function createArray(dim) {
      if (dim >= dims.length) return v();
      var arr = [];
      for (var i = 0; i < dims[dim]; i++) {
        arr[i] = _createArray(dim + 1);
      }
      return arr;
    };
    return _createArray(0);
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
  bw.naturalCompare = function (as, bs) {
    // Handle numbers
    if (isFinite(as) && isFinite(bs)) {
      return Math.sign(as - bs);
    }
    var a = String(as).toLowerCase();
    var b = String(bs).toLowerCase();
    if (a === b) return as > bs ? 1 : 0;

    // If no digits, simple string compare
    if (!/\d/.test(a) || !/\d/.test(b)) {
      return a > b ? 1 : -1;
    }

    // Split into chunks of digits/non-digits
    var aParts = a.match(/(\d+|\D+)/g) || [];
    var bParts = b.match(/(\d+|\D+)/g) || [];
    var len = Math.min(aParts.length, bParts.length);
    for (var i = 0; i < len; i++) {
      var aPart = aParts[i];
      var bPart = bParts[i];
      if (aPart !== bPart) {
        // Both numeric
        if (/^\d+$/.test(aPart) && /^\d+$/.test(bPart)) {
          // Handle leading zeros
          var aNum = aPart;
          var bNum = bPart;
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
  bw.setIntervalX = function (callback, delay, repetitions) {
    var count = 0;
    var intervalID = setInterval(function () {
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
  bw.repeatUntil = function (testFn, successFn, failFn) {
    var delay = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 250;
    var maxReps = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 10;
    var lastFn = arguments.length > 5 ? arguments[5] : undefined;
    if (typeof testFn !== "function") return "err";
    var count = 0;
    var intervalID = setInterval(function () {
      var result = testFn();
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
  bw.saveClientFile = function (fname, data) {
    if (bw.isNodeJS()) {
      bw._getFs().then(function (fs) {
        if (!fs) {
          console.error('bw.saveClientFile: fs module not available');
          return;
        }
        fs.writeFile(fname, data, function (err) {
          if (err) {
            console.error("Error saving file:", err);
          }
        });
      });
    } else {
      // Browser environment
      var blob = new Blob([data], {
        type: "application/octet-stream"
      });
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
   * @see bw.saveClientFile
   */
  bw.saveClientJSON = function (fname, data) {
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
  bw.loadClientFile = function (fname, callback, options) {
    var opts = {
      parser: 'raw'
    };
    if (options && options.parser) {
      opts.parser = options.parser;
    }
    var parse = opts.parser === 'JSON' ? JSON.parse : function (s) {
      return s;
    };
    if (bw.isNodeJS()) {
      bw._getFs().then(function (fs) {
        if (!fs) {
          callback(null, new Error('fs module not available'));
          return;
        }
        fs.readFile(fname, 'utf8', function (err, data) {
          if (err) {
            callback(null, err);
          } else {
            try {
              callback(parse(data), null);
            } catch (e) {
              callback(null, e);
            }
          }
        });
      });
    } else {
      var x = new XMLHttpRequest();
      x.open('GET', fname, true);
      x.onreadystatechange = function () {
        if (x.readyState === 4) {
          if (x.status >= 200 && x.status < 300) {
            try {
              callback(parse(x.responseText), null);
            } catch (e) {
              callback(null, e);
            }
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
  bw.loadClientJSON = function (fname, callback) {
    return bw.loadClientFile(fname, callback, {
      parser: 'JSON'
    });
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
  bw.loadLocalFile = function (callback, options) {
    var opts = {
      parser: 'raw',
      accept: ''
    };
    if (options) {
      if (options.parser) {
        opts.parser = options.parser;
      }
      if (options.accept) {
        opts.accept = options.accept;
      }
    }
    var parse = opts.parser === 'JSON' ? JSON.parse : function (s) {
      return s;
    };
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
    input.addEventListener('change', function () {
      var file = input.files[0];
      if (!file) {
        callback(null, '', new Error('No file selected'));
        return;
      }
      var reader = new FileReader();
      reader.onload = function (e) {
        try {
          callback(parse(e.target.result), file.name, null);
        } catch (err) {
          callback(null, file.name, err);
        }
      };
      reader.onerror = function () {
        callback(null, file.name, reader.error);
      };
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
  bw.loadLocalJSON = function (callback) {
    bw.loadLocalFile(callback, {
      parser: 'JSON',
      accept: '.json'
    });
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
  bw.copyToClipboard = function (text) {
    // Modern clipboard API
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }

    // Fallback for older browsers
    return new Promise(function (resolve, reject) {
      var textarea = bw.createDOM({
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
        var successful = document.execCommand('copy');
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
  bw.makeTable = function (config) {
    var _config$data = config.data,
      data = _config$data === void 0 ? [] : _config$data,
      columns = config.columns,
      _config$className = config.className,
      className = _config$className === void 0 ? '' : _config$className,
      _config$striped = config.striped,
      striped = _config$striped === void 0 ? false : _config$striped,
      _config$hover = config.hover,
      hover = _config$hover === void 0 ? false : _config$hover,
      _config$sortable = config.sortable,
      sortable = _config$sortable === void 0 ? true : _config$sortable,
      onSort = config.onSort,
      sortColumn = config.sortColumn,
      _config$sortDirection = config.sortDirection,
      sortDirection = _config$sortDirection === void 0 ? 'asc' : _config$sortDirection;

    // Build class list: always include bw-table, add striped/hover, append user className
    var cls = 'bw-table';
    if (striped) cls += ' bw-table-striped';
    if (hover) cls += ' bw-table-hover';
    if (className) cls += ' ' + className;
    cls = cls.trim();

    // Auto-detect columns if not provided
    var cols = columns || (data.length > 0 ? Object.keys(data[0]).map(function (key) {
      return {
        key: key,
        label: key
      };
    }) : []);

    // Current sort state
    var currentSortColumn = sortColumn || null;
    var currentSortDirection = sortDirection;

    // Sort data if column specified
    var sortedData = _toConsumableArray(data);
    if (currentSortColumn) {
      sortedData.sort(function (a, b) {
        var aVal = a[currentSortColumn];
        var bVal = b[currentSortColumn];

        // Handle different types
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return currentSortDirection === 'asc' ? aVal - bVal : bVal - aVal;
        }

        // String comparison
        var aStr = String(aVal || '').toLowerCase();
        var bStr = String(bVal || '').toLowerCase();
        if (currentSortDirection === 'asc') {
          return aStr.localeCompare(bStr);
        } else {
          return bStr.localeCompare(aStr);
        }
      });
    }

    // Create sort handler
    var handleSort = function handleSort(column) {
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
    var thead = {
      t: 'thead',
      c: {
        t: 'tr',
        c: cols.map(function (col) {
          return {
            t: 'th',
            a: sortable ? {
              style: {
                cursor: 'pointer',
                userSelect: 'none'
              },
              onclick: function onclick() {
                return handleSort(col.key);
              }
            } : {},
            c: [col.label, sortable && currentSortColumn === col.key && {
              t: 'span',
              a: {
                style: {
                  marginLeft: '5px'
                }
              },
              c: currentSortDirection === 'asc' ? '▲' : '▼'
            }].filter(Boolean)
          };
        })
      }
    };

    // Build table body
    var tbody = {
      t: 'tbody',
      c: sortedData.map(function (row) {
        return {
          t: 'tr',
          c: cols.map(function (col) {
            return {
              t: 'td',
              c: col.render ? col.render(row[col.key], row) : String(row[col.key] || '')
            };
          })
        };
      })
    };
    return {
      t: 'table',
      a: {
        "class": cls
      },
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
  bw.makeTableFromArray = function (config) {
    var _config$data2 = config.data,
      data = _config$data2 === void 0 ? [] : _config$data2,
      _config$headerRow = config.headerRow,
      headerRow = _config$headerRow === void 0 ? true : _config$headerRow,
      columns = config.columns,
      rest = _objectWithoutProperties(config, _excluded);
    if (!Array.isArray(data) || data.length === 0) {
      return bw.makeTable(_objectSpread2({
        data: [],
        columns: columns || []
      }, rest));
    }

    // Determine headers
    var headers;
    var rows;
    if (headerRow && data.length > 0) {
      headers = data[0].map(function (h) {
        return String(h);
      });
      rows = data.slice(1);
    } else {
      // Generate col0, col1, ... headers
      var width = data[0].length;
      headers = [];
      for (var i = 0; i < width; i++) {
        headers.push('col' + i);
      }
      rows = data;
    }

    // Convert rows to object arrays
    var objData = rows.map(function (row) {
      var obj = {};
      headers.forEach(function (key, i) {
        obj[key] = row[i] !== undefined ? row[i] : '';
      });
      return obj;
    });

    // Auto-generate column defs if not provided
    var cols = columns || headers.map(function (key) {
      return {
        key: key,
        label: key
      };
    });
    return bw.makeTable(_objectSpread2({
      data: objData,
      columns: cols
    }, rest));
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
  bw.makeBarChart = function (config) {
    var _config$data3 = config.data,
      data = _config$data3 === void 0 ? [] : _config$data3,
      _config$labelKey = config.labelKey,
      labelKey = _config$labelKey === void 0 ? 'label' : _config$labelKey,
      _config$valueKey = config.valueKey,
      valueKey = _config$valueKey === void 0 ? 'value' : _config$valueKey,
      title = config.title,
      _config$color = config.color,
      color = _config$color === void 0 ? '#006666' : _config$color,
      _config$height = config.height,
      height = _config$height === void 0 ? '200px' : _config$height,
      formatValue = config.formatValue,
      _config$showValues = config.showValues,
      showValues = _config$showValues === void 0 ? true : _config$showValues,
      _config$showLabels = config.showLabels,
      showLabels = _config$showLabels === void 0 ? true : _config$showLabels,
      _config$className2 = config.className,
      className = _config$className2 === void 0 ? '' : _config$className2;
    if (!Array.isArray(data) || data.length === 0) {
      return {
        t: 'div',
        a: {
          "class": ('bw-bar-chart-container ' + className).trim()
        },
        c: ''
      };
    }
    var values = data.map(function (d) {
      return Number(d[valueKey]) || 0;
    });
    var maxVal = Math.max.apply(null, values);
    var bars = data.map(function (d, i) {
      var val = values[i];
      var pct = maxVal > 0 ? val / maxVal * 100 : 0;
      var formatted = formatValue ? formatValue(val) : String(val);
      var children = [];
      if (showValues) {
        children.push({
          t: 'div',
          a: {
            "class": 'bw-bar-value'
          },
          c: formatted
        });
      }
      children.push({
        t: 'div',
        a: {
          "class": 'bw-bar',
          style: 'height:' + pct + '%;background:' + color + ';'
        }
      });
      if (showLabels) {
        children.push({
          t: 'div',
          a: {
            "class": 'bw-bar-label'
          },
          c: String(d[labelKey] || '')
        });
      }
      return {
        t: 'div',
        a: {
          "class": 'bw-bar-group'
        },
        c: children
      };
    });
    var chartChildren = [];
    if (title) {
      chartChildren.push({
        t: 'h3',
        a: {
          "class": 'bw-bar-chart-title'
        },
        c: title
      });
    }
    chartChildren.push({
      t: 'div',
      a: {
        "class": 'bw-bar-chart',
        style: 'height:' + height + ';'
      },
      c: bars
    });
    return {
      t: 'div',
      a: {
        "class": ('bw-bar-chart-container ' + className).trim()
      },
      c: chartChildren
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
  bw.makeDataTable = function (config) {
    var title = config.title,
      data = config.data,
      columns = config.columns,
      _config$className3 = config.className,
      className = _config$className3 === void 0 ? '' : _config$className3,
      _config$striped2 = config.striped,
      striped = _config$striped2 === void 0 ? true : _config$striped2,
      _config$hover2 = config.hover,
      hover = _config$hover2 === void 0 ? true : _config$hover2,
      _config$responsive = config.responsive,
      responsive = _config$responsive === void 0 ? true : _config$responsive,
      tableConfig = _objectWithoutProperties(config, _excluded2);
    var table = bw.makeTable(_objectSpread2({
      data: data,
      columns: columns,
      className: className,
      striped: striped,
      hover: hover
    }, tableConfig));
    var content = [];
    if (title) {
      content.push({
        t: 'h5',
        a: {
          "class": 'mb-3'
        },
        c: title
      });
    }
    if (responsive) {
      content.push({
        t: 'div',
        a: {
          "class": 'table-responsive'
        },
        c: table
      });
    } else {
      content.push(table);
    }
    return {
      t: 'div',
      a: {
        "class": 'table-container'
      },
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
  bw.render = function (element, position, taco) {
    var _taco$o4, _taco$o5, _taco$o6;
    // Get target element
    var targetEl = typeof element === 'string' ? document.querySelector(element) : element;
    if (!targetEl) {
      return {
        object_type: 'error',
        component_id: null,
        object_handle_in_dom: null,
        status_code: 'error=target_element_not_found'
      };
    }

    // Generate unique ID if not provided
    var componentId = ((_taco$o4 = taco.o) === null || _taco$o4 === void 0 ? void 0 : _taco$o4.id) || bw.uuid();

    // Create DOM element
    var domElement;
    try {
      domElement = bw.createDOM(taco);
    } catch (e) {
      return {
        object_type: 'error',
        component_id: componentId,
        object_handle_in_dom: null,
        status_code: "error=render_failed:".concat(e.message)
      };
    }

    // Add component ID to element
    domElement.setAttribute('data-bw-id', componentId);

    // Insert into DOM based on position
    try {
      switch (position) {
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
          throw new Error("Invalid position: ".concat(position));
      }
    } catch (e) {
      return {
        object_type: 'error',
        component_id: componentId,
        object_handle_in_dom: null,
        status_code: "error=insertion_failed:".concat(e.message)
      };
    }

    // Create component handle
    var handle = {
      object_type: taco.t || 'element',
      component_id: componentId,
      object_handle_in_dom: domElement,
      status_code: 'success',
      // Reference to original TACO
      _taco: _objectSpread2({}, taco),
      _state: _objectSpread2({}, ((_taco$o5 = taco.o) === null || _taco$o5 === void 0 ? void 0 : _taco$o5.state) || {}),
      _mounted: true,
      // Get DOM element
      get element() {
        return this.object_handle_in_dom;
      },
      // Get/set state
      getState: function getState() {
        return _objectSpread2({}, this._state);
      },
      setState: function setState(updates) {
        var _this$_taco$o;
        this._state = _objectSpread2(_objectSpread2({}, this._state), updates);
        if ((_this$_taco$o = this._taco.o) !== null && _this$_taco$o !== void 0 && _this$_taco$o.onStateChange) {
          this._taco.o.onStateChange(this._state, updates);
        }
        return this;
      },
      // Update component (re-render)
      update: function update() {
        var _this$_taco$o2;
        if (!this._mounted || !this.element) return this;
        var parent = this.element.parentNode;

        // Update TACO with current state
        if (this._taco.o) {
          this._taco.o.state = this._state;
        }

        // Re-render
        var newElement = bw.createDOM(this._taco);
        newElement.setAttribute('data-bw-id', componentId);

        // Replace in DOM
        parent.replaceChild(newElement, this.element);
        this.object_handle_in_dom = newElement;

        // Call update lifecycle
        if ((_this$_taco$o2 = this._taco.o) !== null && _this$_taco$o2 !== void 0 && _this$_taco$o2.onUpdate) {
          this._taco.o.onUpdate(newElement, this._state);
        }
        return this;
      },
      // Get/set properties
      getProp: function getProp(key) {
        var _this$_taco$a;
        return (_this$_taco$a = this._taco.a) === null || _this$_taco$a === void 0 ? void 0 : _this$_taco$a[key];
      },
      setProp: function setProp(key, value) {
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
      getContent: function getContent() {
        return this._taco.c;
      },
      setContent: function setContent(content) {
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
      addClass: function addClass(className) {
        if (this.element) {
          this.element.classList.add(className);
        }
        return this;
      },
      removeClass: function removeClass(className) {
        if (this.element) {
          this.element.classList.remove(className);
        }
        return this;
      },
      toggleClass: function toggleClass(className) {
        if (this.element) {
          this.element.classList.toggle(className);
        }
        return this;
      },
      hasClass: function hasClass(className) {
        return this.element ? this.element.classList.contains(className) : false;
      },
      // Show/hide
      show: function show() {
        if (this.element) {
          this.element.style.display = '';
        }
        return this;
      },
      hide: function hide() {
        if (this.element) {
          this.element.style.display = 'none';
        }
        return this;
      },
      // Event handling
      on: function on(event, handler) {
        if (this.element) {
          this.element.addEventListener(event, handler);
        }
        return this;
      },
      off: function off(event, handler) {
        if (this.element) {
          this.element.removeEventListener(event, handler);
        }
        return this;
      },
      // Destroy component
      destroy: function destroy() {
        var _this$_taco$o3;
        if (!this._mounted) return this;

        // Call unmount lifecycle
        if ((_this$_taco$o3 = this._taco.o) !== null && _this$_taco$o3 !== void 0 && _this$_taco$o3.unmount) {
          this._taco.o.unmount(this.element);
        }

        // Remove from DOM
        if (this.element && this.element.parentNode) {
          this.element.parentNode.removeChild(this.element);
        }

        // Remove from registry
        bw._componentRegistry["delete"](componentId);

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
    if ((_taco$o6 = taco.o) !== null && _taco$o6 !== void 0 && _taco$o6.mounted) {
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
  bw.getComponent = function (id) {
    return bw._componentRegistry.get(id) || null;
  };

  /**
   * Get all registered component handles as a Map.
   *
   * @returns {Map} Map of componentId → component handle
   * @category DOM Generation
   * @see bw.getComponent
   */
  bw.getAllComponents = function () {
    return new Map(bw._componentRegistry);
  };

  // Register all make functions
  Object.entries(components).forEach(function (_ref1) {
    var _ref10 = _slicedToArray(_ref1, 2),
      name = _ref10[0],
      fn = _ref10[1];
    if (name.startsWith('make')) {
      bw[name] = fn;
    }
  });

  // Register component handles
  bw._componentHandles = componentHandles || {};

  // Create functions that return handles
  Object.entries(components).forEach(function (_ref11) {
    var _ref12 = _slicedToArray(_ref11, 2),
      name = _ref12[0],
      fn = _ref12[1];
    if (name.startsWith('make')) {
      var componentType = name.substring(4).toLowerCase(); // Remove 'make' prefix
      var createName = 'create' + name.substring(4); // createCard, createTable, etc.

      bw[createName] = function (props) {
        var taco = fn(props);
        var handle = bw.renderComponent(taco);

        // Use specialized handle class if available
        var HandleClass = bw._componentHandles[componentType];
        if (HandleClass) {
          var specializedHandle = new HandleClass(handle.element, taco);
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
  bw.createTable = function (data) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var taco = bw.makeTable(_objectSpread2({
      data: data
    }, options));
    var handle = bw.renderComponent(taco);

    // Use specialized TableHandle
    var TableHandle = bw._componentHandles.table;
    if (TableHandle) {
      var specializedHandle = new TableHandle(handle.element, taco);
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
//# sourceMappingURL=bitwrench-lean.es5.js.map
