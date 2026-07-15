/**
 * Bitwrench Color Utilities
 *
 * Hex-only color math for the theme derivation pipeline, plus legacy
 * tagged-array color functions (colorParse, colorRgbToHsl, colorHslToRgb,
 * colorInterp) for the public API.
 *
 * @module bitwrench-color-utils
 * @license BSD-2-Clause
 * @copy Manu Chatterjee @deftio
 */

function _xs (x) {
  return ('0' + x.toString(16)).slice(-2);
}

function clip(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

// Parse hex string to [r, g, b].
function _ph(hex) {
  var h = hex.charAt(0) === '#' ? hex.slice(1) : hex;
  if (h.length === 3) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
  return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)];
}

// RGB [0-255] to HSL [h 0-360, s 0-100, l 0-100], float precision.
function _r2h(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  var mx = Math.max(r, g, b), mn = Math.min(r, g, b);
  var h, s, l = (mx + mn) / 2;
  if (mx === mn) {
    h = s = 0;
  } else {
    var d = mx - mn;
    s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
    switch (mx) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return [h * 360, s * 100, l * 100];
}

// HSL [h 0-360, s 0-100, l 0-100] to RGB [0-255], rounded.
function _h2r(h, s, l) {
  var hN = h / 360, sN = s / 100, lN = l / 100;
  var r, g, b;
  if (sN === 0) {
    r = g = b = lN * 255;
  } else {
    var hue2rgb = function(p, q, t) {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    var q = lN < 0.5 ? lN * (1 + sN) : lN + sN - lN * sN;
    var p = 2 * lN - q;
    r = hue2rgb(p, q, hN + 1/3) * 255;
    g = hue2rgb(p, q, hN) * 255;
    b = hue2rgb(p, q, hN - 1/3) * 255;
  }
  return [Math.round(r), Math.round(g), Math.round(b)];
}

// =========================================================================
// Legacy color API — tagged 5-element arrays [r,g,b,a,"rgb"/"hsl"]
// =========================================================================

function _ms(x, i0, i1, o0, o1, opts) {
  var n = (x - i0) / (i1 - i0);
  if (opts && opts.expScale && opts.expScale !== 1) n = Math.pow(n, opts.expScale);
  var r = n * (o1 - o0) + o0;
  if (opts && opts.clip) r = clip(r, Math.min(o0, o1), Math.max(o0, o1));
  return r;
}

export function colorHslToRgb(h, s, l, a, rnd) {
  if (a === undefined) a = 255;
  if (rnd === undefined) rnd = true;
  if (Array.isArray(h)) { s = h[1]; l = h[2]; a = h[3] !== undefined ? h[3] : 255; h = h[0]; }
  var rgb = _h2r(h, s, l);
  if (rnd) a = Math.round(a);
  return [rgb[0], rgb[1], rgb[2], a, "rgb"];
}

export function colorRgbToHsl(r, g, b, a, rnd) {
  if (a === undefined) a = 255;
  if (rnd === undefined) rnd = true;
  if (Array.isArray(r)) { g = r[1]; b = r[2]; a = r[3] !== undefined ? r[3] : 255; r = r[0]; }
  var hsl = _r2h(r, g, b);
  if (rnd) { hsl[0] = Math.round(hsl[0]); hsl[1] = Math.round(hsl[1]); hsl[2] = Math.round(hsl[2]); a = Math.round(a); }
  return [hsl[0], hsl[1], hsl[2], a, "hsl"];
}

export function colorParse(s, defAlpha) {
  if (defAlpha === undefined) defAlpha = 255;
  var r = [0, 0, 0, defAlpha, "rgb"];
  if (Array.isArray(s)) {
    var df = [0, 0, 0, 255, "rgb"];
    for (var p = 0; p < s.length && p < df.length; p++) df[p] = s[p];
    return df;
  }
  s = String(s).replace(/\s/g, "");
  if (s[0] === "#") {
    var hex = s.slice(1);
    if (hex.length === 3 || hex.length === 4) {
      for (var i = 0; i < hex.length; i++) r[i] = parseInt(hex[i] + hex[i], 16);
    } else if (hex.length === 6 || hex.length === 8) {
      for (var j = 0; j < hex.length; j += 2) r[j / 2] = parseInt(hex.substring(j, j + 2), 16);
    }
  } else {
    var match = s.match(/^(rgb|hsl)a?\(([^)]+)\)$/i);
    if (match) {
      var type = match[1].toLowerCase();
      var values = match[2].split(",").map(function(v) { return parseFloat(v); });
      if (type === "rgb") {
        r[0] = values[0] || 0; r[1] = values[1] || 0; r[2] = values[2] || 0;
        r[3] = values[3] !== undefined ? values[3] * 255 : defAlpha;
      } else if (type === "hsl") {
        return colorHslToRgb(values[0] || 0, values[1] || 0, values[2] || 0,
                             values[3] !== undefined ? values[3] * 255 : defAlpha);
      }
    }
  }
  return r;
}

export function colorInterp(x, in0, in1, colors, stretch) {
  var c = Array.isArray(colors) ? colors : ["#000", "#fff"];
  c = c.length === 0 ? ["#000", "#fff"] : c;
  if (c.length === 1) return c[0];
  c = c.map(function(col) { return colorParse(col); });
  var a = _ms(x, in0, in1, 0, c.length - 1, { clip: true, expScale: stretch });
  var i = clip(Math.floor(a), 0, c.length - 2);
  var r = a - i;
  var interp = function(idx) { return _ms(r, 0, 1, c[i][idx], c[i + 1][idx], { clip: true }); };
  return [interp(0), interp(1), interp(2), interp(3), "rgb"];
}

// =========================================================================
// Public theme derivation helpers
// =========================================================================

/**
 * Convert hex color to HSL array [h, s, l].
 * @param {string} hex - Hex color e.g. '#006666'
 * @returns {Array} [h, s, l] where h=0-360, s=0-100, l=0-100
 */
export function hexToHsl(hex) {
  var rgb = _ph(hex);
  return _r2h(rgb[0], rgb[1], rgb[2]);
}

/**
 * Convert HSL array to hex color string.
 * @param {Array} hsl - [h, s, l] where h=0-360, s=0-100, l=0-100
 * @returns {string} Hex color e.g. '#006666'
 */
export function hslToHex(hsl) {
  var rgb = _h2r(hsl[0], hsl[1], hsl[2]);
  return '#' + _xs(rgb[0])+_xs(rgb[1])+_xs(rgb[2]);
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
  var c1 = _ph(hex1);
  var c2 = _ph(hex2);
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
export function relativeLuminance(hex) {
  var rgb = _ph(hex);
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
 * Shift a color's hue toward a target hue by a given amount.
 * Uses shortest-arc interpolation on the hue wheel.
 * @param {string} sourceHex - Color to shift
 * @param {string} targetHex - Color whose hue to shift toward
 * @param {number} [amount=0.20] - 0 = no shift, 1 = full shift to target hue
 * @returns {string} Harmonized hex color
 */
export function harmonize(sourceHex, targetHex, amount) {
  if (amount === undefined) amount = 0.20;
  if (amount === 0) return sourceHex;
  var srcHsl = hexToHsl(sourceHex);
  var tgtHsl = hexToHsl(targetHex);

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
export function deriveShades(hex) {
  var rgb = _ph(hex);
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
export function deriveAlternateSeed(hex) {
  var hsl = hexToHsl(hex);
  var h = hsl[0], s = hsl[1], l = hsl[2];
  var altL, altS;

  if (l > 50) {
    altL = clip(100 - l - 10, 8, 40);
    altS = clip(s * 0.85, 0, 100);
  } else {
    altL = clip(100 - l + 10, 60, 92);
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
export function isLightPalette(config) {
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
export function deriveAlternateConfig(config) {
  var alt = {};
  alt.primary = deriveAlternateSeed(config.primary);
  alt.secondary = deriveAlternateSeed(config.secondary || config.primary);
  alt.tertiary = config.tertiary ? deriveAlternateSeed(config.tertiary) : alt.primary;

  var priHsl = hexToHsl(config.primary);
  var h = priHsl[0];
  var primarySurface = config.surface || hslToHex([h, 8, 96]);
  var isLight = relativeLuminance(primarySurface) > 0.179;

  if (isLight) {
    alt.light = hslToHex([h, Math.min(priHsl[1], 15), 15]);
    alt.dark = hslToHex([h, 5, 88]);
    alt.surface = hslToHex([h, 12, 18]);
    alt.background = hslToHex([h, 10, 14]);
  } else {
    alt.light = hslToHex([h, Math.min(priHsl[1], 10), 96]);
    alt.dark = hslToHex([h, 10, 18]);
    alt.surface = hslToHex([h, 8, 96]);
    alt.background = hslToHex([h, 6, 98]);
  }

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

  alt.harmonize = 0;

  return alt;
}

/**
 * Derive complete palette from a theme config object.
 * @param {Object} config - Theme config with primary, secondary, tertiary, etc.
 * @param {number} [config.harmonize=0.20] - Hue shift amount for semantic colors (0-1)
 * @returns {Object} Full palette with shades for all 9 semantic colors
 */
export function derivePalette(config) {
  var amt = config.harmonize !== undefined ? config.harmonize : 0.20;
  var pri = config.primary;
  var sec = config.secondary || pri;
  var ter = config.tertiary || pri;
  var priHsl = hexToHsl(pri);
  var h = priHsl[0];

  var successBase = harmonize(config.success || '#198754', pri, amt);
  var dangerBase  = harmonize(config.danger  || '#dc3545', pri, amt);
  var warningBase = harmonize(config.warning || '#f0ad4e', pri, amt);
  var infoBase    = harmonize(config.info    || '#17a2b8', pri, amt);

  var lightBase = config.light || hslToHex([h, 8, 97]);
  var darkBase  = config.dark  || hslToHex([h, 10, 13]);

  var bgBase = config.background || hslToHex([h, 22, 96]);
  var surfBase = config.surface || hslToHex([h, 25, 94]);

  var surfHsl = hexToHsl(surfBase);
  var surfAlt = surfHsl[2] <= 50
    ? hslToHex([surfHsl[0], surfHsl[1], Math.min(surfHsl[2] + 8, 100)])
    : hslToHex([surfHsl[0], surfHsl[1], Math.max(surfHsl[2] - 3, 0)]);

  var palette = {
    primary:    deriveShades(pri),
    secondary:  deriveShades(sec),
    tertiary:   deriveShades(ter),
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
