/*! bitwrench-util-color v2.1.6 | BSD-2-Clause | https://deftio.github.io/bitwrench/pages */
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.bwUtilColor = {}));
})(this, (function (exports) { 'use strict';

  /**
   * bitwrench-util-color.js - Legacy color parsing and conversion utilities
   *
   * Self-contained module providing CSS color parsing, RGB/HSL conversion,
   * and multi-stop color interpolation. Extracted from bitwrench core in v2.1.
   *
   * Can be loaded standalone (browser script tag after bitwrench.umd.js),
   * or imported as an ES module / CJS module.
   *
   * @module bitwrench-util-color
   * @license BSD-2-Clause
   * @author M A Chatterjee <deftio [at] deftio [dot] com>
   */

  function _clip(val, min, max) {
    return Math.max(min, Math.min(max, val));
  }
  function _mapScale(x, in0, in1, out0, out1, options) {
    if (!options) options = {};
    var doClip = options.clip || false;
    var expScale = options.expScale || 1;
    var normalized = (x - in0) / (in1 - in0);
    if (expScale !== 1) normalized = Math.pow(normalized, expScale);
    var result = normalized * (out1 - out0) + out0;
    if (doClip) {
      var mn = Math.min(out0, out1);
      var mx = Math.max(out0, out1);
      result = Math.max(mn, Math.min(mx, result));
    }
    return result;
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
    if (rnd) {
      h = Math.round(h);
      s = Math.round(s);
      l = Math.round(l);
      a = Math.round(a);
    }
    return [h, s, l, a, "hsl"];
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
   * Interpolate between N colors based on a mapped position.
   * @param {number} x - Input value
   * @param {number} in0 - Input range start
   * @param {number} in1 - Input range end
   * @param {Array} colors - Array of color strings
   * @param {number} [stretch] - Exponential scaling factor
   * @returns {Array} [r, g, b, a, "rgb"]
   */
  function colorInterp(x, in0, in1, colors, stretch) {
    var c = Array.isArray(colors) ? colors : ["#000", "#fff"];
    c = c.length === 0 ? ["#000", "#fff"] : c;
    if (c.length === 1) return c[0];
    c = c.map(function (col) {
      return colorParse(col);
    });
    var a = _mapScale(x, in0, in1, 0, c.length - 1, {
      clip: true,
      expScale: stretch
    });
    var i = _clip(Math.floor(a), 0, c.length - 2);
    var r = a - i;
    var interp = function interp(idx) {
      return _mapScale(r, 0, 1, c[i][idx], c[i + 1][idx], {
        clip: true
      });
    };
    return [interp(0), interp(1), interp(2), interp(3), "rgb"];
  }
  var utilColor = {
    colorParse: colorParse,
    colorRgbToHsl: colorRgbToHsl,
    colorHslToRgb: colorHslToRgb,
    colorInterp: colorInterp
  };

  /**
   * Install color utilities onto a bitwrench instance.
   * @param {Object} bw - The bitwrench object to extend
   */
  function install(bw) {
    if (!bw) return;
    bw.colorParse = colorParse;
    bw.colorRgbToHsl = colorRgbToHsl;
    bw.colorHslToRgb = colorHslToRgb;
    bw.colorInterp = colorInterp;
  }
  if (typeof window !== 'undefined' && window.bw) {
    install(window.bw);
  }

  exports.colorHslToRgb = colorHslToRgb;
  exports.colorInterp = colorInterp;
  exports.colorParse = colorParse;
  exports.colorRgbToHsl = colorRgbToHsl;
  exports.default = utilColor;
  exports.install = install;
  exports.utilColor = utilColor;

  Object.defineProperty(exports, '__esModule', { value: true });

}));
//# sourceMappingURL=bitwrench-util-color.es5.js.map
