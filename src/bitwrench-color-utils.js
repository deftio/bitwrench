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
export function clip(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

/**
 * Parse a CSS color string to [r, g, b, a, "rgb"].
 * Handles #hex, rgb(), rgba(), hsl(), hsla(), and bitwrench color arrays.
 * @param {string|Array} s - Color string or array
 * @param {number} [defAlpha=255] - Default alpha
 * @returns {Array} [r, g, b, a, "rgb"]
 */
export function colorParse(s, defAlpha) {
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
export function colorRgbToHsl(r, g, b, a, rnd) {
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
export function colorHslToRgb(h, s, l, a, rnd) {
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
export function hexToHsl(hex) {
  var rgb = colorParse(hex);
  var hsl = colorRgbToHsl(rgb[0], rgb[1], rgb[2], 255, false);
  return [hsl[0], hsl[1], hsl[2]];
}

/**
 * Convert HSL array to hex color string.
 * @param {Array} hsl - [h, s, l] where h=0-360, s=0-100, l=0-100
 * @returns {string} Hex color e.g. '#006666'
 */
export function hslToHex(hsl) {
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
export function adjustLightness(hex, amount) {
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
export function mixColor(hex1, hex2, ratio) {
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
export function relativeLuminance(hex) {
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
export function textOnColor(hex) {
  return relativeLuminance(hex) > 0.179 ? '#000' : '#fff';
}

/**
 * Derive a full shade palette for a single semantic color.
 * @param {string} hex - Base color hex
 * @returns {Object} { base, hover, active, light, darkText, border, focus, textOn }
 */
export function deriveShades(hex) {
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
export function derivePalette(config) {
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
