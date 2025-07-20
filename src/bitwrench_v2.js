/**
 * Bitwrench v2 Core
 * Zero-dependency UI library using JavaScript objects
 * Works in browsers (IE11+) and Node.js
 * 
 * @license BSD-2-Clause
 * @author M A Chatterjee <deftio [at] deftio [dot] com>
 */

import { VERSION_INFO } from './version.js';
import { getAllStyles, theme } from './bitwrench-styles.js';

// Core bitwrench namespace
const bw = {
  // Version info from generated file
  version: VERSION_INFO.version,
  versionInfo: VERSION_INFO,
  
  // Internal state
  _idCounter: 0,
  _unmountCallbacks: new Map(),
  
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
 * Detect if running in Node.js environment
 * @returns {boolean} - True if Node.js, false if browser
 */
bw.isNodeJS = function() {
  // Check monkey patch first (for testing)
  if (bw.__monkey_patch_is_nodejs__.get() !== 'ignore') {
    return bw.__monkey_patch_is_nodejs__.get();
  }
  
  // Primary check: Node.js has module.exports
  return (typeof module !== 'undefined' && module.exports) !== false;
};

// Set runtime flags based on detection
bw._isNode = bw.isNodeJS();
bw._isBrowser = !bw._isNode;

/**
 * Enhanced type detection beyond typeof
 * @param {*} x - Value to examine
 * @param {boolean} [baseTypeOnly=false] - Return only base type
 * @returns {string} - Type name
 */
bw.typeOf = function(x, baseTypeOnly) {
  if (x === null) return "null";
  
  const basic = typeof x;
  
  if (basic !== "object" && basic !== "function") {
    return basic;
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
 * Generate unique ID for elements
 * @returns {string} - Unique identifier
 */
bw.uuid = function() {
  // Use crypto.randomUUID if available (modern browsers)
  if (bw._isBrowser && crypto && crypto.randomUUID) {
    return 'bw_' + crypto.randomUUID().replace(/-/g, '');
  }
  
  // Fallback for older browsers and Node.js
  const timestamp = Date.now().toString(36);
  const counter = (++bw._idCounter).toString(36);
  const random = Math.random().toString(36).substring(2, 11);
  
  return `bw_${timestamp}_${counter}_${random}`;
};

/**
 * Escape HTML special characters
 * @param {string} str - String to escape
 * @returns {string} - Escaped string
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
 * Convert TACO object to HTML string
 * @param {Object|Array|string} taco - TACO object, array of TACOs, or string
 * @param {Object} [options] - Rendering options
 * @returns {string} - HTML string
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
      // Handle class as array or string
      const classStr = Array.isArray(value) 
        ? value.filter(Boolean).join(' ')
        : String(value);
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
    const existingClass = attrs.class || '';
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
 * Create DOM element from TACO (browser only)
 * @param {Object} taco - TACO object
 * @param {Object} [options] - Creation options
 * @returns {Element|Text} - DOM element or text node
 */
bw.createDOM = function(taco, options = {}) {
  if (bw._isNode) {
    throw new Error('bw.createDOM is not available in Node.js. Use bw.html() instead.');
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
      // Handle class as array or string
      const classStr = Array.isArray(value)
        ? value.filter(Boolean).join(' ')
        : String(value);
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
  
  // Handle lifecycle hooks
  if (opts.mounted || opts.unmount) {
    const id = attrs['data-bw-id'] || bw.uuid();
    el.setAttribute('data-bw-id', id);
    
    // Store state
    if (opts.state) {
      el._bw_state = opts.state;
    }
    
    // Queue mounted callback
    if (opts.mounted) {
      if (document.body.contains(el)) {
        // Already in DOM
        opts.mounted(el, el._bw_state || {});
      } else {
        // Wait for insertion
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
 * Mount TACO to DOM element (browser only)
 * @param {string|Element} target - Target selector or element
 * @param {Object} taco - TACO object
 * @param {Object} [options] - Mount options
 * @returns {Element} - Target element
 */
bw.DOM = function(target, taco, options = {}) {
  if (bw._isNode) {
    throw new Error('bw.DOM is not available in Node.js. Use bw.html() instead.');
  }
  
  // Get target element
  const targetEl = typeof target === 'string'
    ? document.querySelector(target)
    : target;
    
  if (!targetEl) {
    console.error('bw.DOM: Target element not found:', target);
    return null;
  }
  
  // Clean up existing content
  bw.cleanup(targetEl);
  
  // Clear and mount new content
  targetEl.innerHTML = '';
  
  if (taco != null) {
    if (Array.isArray(taco)) {
      taco.forEach(t => {
        if (t != null) {
          targetEl.appendChild(bw.createDOM(t, options));
        }
      });
    } else {
      targetEl.appendChild(bw.createDOM(taco, options));
    }
  }
  
  return targetEl;
};

/**
 * Clean up element and its children
 * Calls unmount callbacks and removes references
 * @param {Element} element - Element to clean up
 */
bw.cleanup = function(element) {
  if (bw._isNode || !element) return;
  
  // Find all elements with data-bw-id
  const elements = element.querySelectorAll('[data-bw-id]');
  
  elements.forEach(el => {
    const id = el.getAttribute('data-bw-id');
    const callback = bw._unmountCallbacks.get(id);
    
    if (callback) {
      callback();
      bw._unmountCallbacks.delete(id);
    }
    
    // Clean up state
    delete el._bw_state;
  });
  
  // Check element itself
  const id = element.getAttribute('data-bw-id');
  if (id) {
    const callback = bw._unmountCallbacks.get(id);
    if (callback) {
      callback();
      bw._unmountCallbacks.delete(id);
    }
    delete element._bw_state;
  }
};

/**
 * CSS generation from JavaScript objects
 * @param {Object|Array|string} rules - CSS rules
 * @param {Object} [options] - Generation options
 * @returns {string} - CSS string
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
 * Inject CSS into document (browser only)
 * @param {string|Object|Array} css - CSS to inject
 * @param {Object} [options] - Injection options
 * @returns {Element} - Style element
 */
bw.injectCSS = function(css, options = {}) {
  if (bw._isNode) {
    console.warn('bw.injectCSS is not available in Node.js');
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
 * Map/scale a value from one range to another
 * @param {number} x - Input value
 * @param {number} in0 - Input range start
 * @param {number} in1 - Input range end
 * @param {number} out0 - Output range start
 * @param {number} out1 - Output range end
 * @param {Object} [options] - Mapping options
 * @returns {number} - Mapped value
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
 * Clamp value between min and max
 * @param {number} value - Value to clamp
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} - Clamped value
 */
bw.clip = function(value, min, max) {
  return Math.max(min, Math.min(max, value));
};

/**
 * DOM selection helper (browser only)
 * Always returns an array for consistency
 * @param {string|Element|Array} selector - CSS selector, element, or array
 * @returns {Array} - Array of DOM elements
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
 * Load default styles
 * @param {Object} [options] - Style loading options
 * @returns {Element|null} - Style element if in browser
 */
bw.loadDefaultStyles = function(options = {}) {
  const { minify = true } = options;
  const styles = getAllStyles();
  return bw.injectCSS(styles, { ...options, minify });
};

/**
 * Get theme configuration
 * @returns {Object} - Theme object
 */
bw.getTheme = function() {
  return { ...theme };
};

// ===================================================================================
// Legacy v1 Functions - Useful utilities retained from bitwrench v1
// ===================================================================================

/**
 * Use a dictionary as a switch statement, including functions
 * @param {*} x - Key to look up
 * @param {Object} choices - Dictionary of choices
 * @param {*} def - Default value if key not found
 * @returns {*} - Value or function result
 * @example
 * const colors = {"red": 1, "blue": 2, "aqua": function(z){return z+"marine"}};
 * bw.choice("red", colors, "0")   // => "1"
 * bw.choice("aqua", colors)       // => "aquamarine"
 */
bw.choice = function(x, choices, def) {
  const z = (x in choices) ? choices[x] : def;
  return bw.typeOf(z) === "function" ? z(x) : z;
};

/**
 * Return unique elements of array
 * @param {Array} x - Input array
 * @returns {Array} - Array with unique elements
 */
bw.arrayUniq = function(x) {
  if (bw.typeOf(x) !== "array") return [];
  return x.filter((v, i, arr) => arr.indexOf(v) === i);
};

/**
 * Return intersection of two arrays
 * @param {Array} a - First array
 * @param {Array} b - Second array
 * @returns {Array} - Elements in both arrays
 */
bw.arrayBinA = function(a, b) {
  if (bw.typeOf(a) !== "array" || bw.typeOf(b) !== "array") return [];
  return bw.arrayUniq(a.filter(n => b.indexOf(n) !== -1));
};

/**
 * Return elements of b not present in a
 * @param {Array} a - First array
 * @param {Array} b - Second array
 * @returns {Array} - Elements in b but not in a
 */
bw.arrayBNotInA = function(a, b) {
  if (bw.typeOf(a) !== "array" || bw.typeOf(b) !== "array") return [];
  return bw.arrayUniq(b.filter(n => a.indexOf(n) < 0));
};

/**
 * Interpolate between an array of colors
 * @param {number} x - Value to interpolate
 * @param {number} in0 - Input range start
 * @param {number} in1 - Input range end
 * @param {Array} colors - Array of colors to interpolate between
 * @param {number} [stretch] - Exponential scaling factor
 * @returns {Array} - Interpolated color as [r,g,b,a,"rgb"]
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
 * Convert HSL to RGB color
 * @param {number|Array} h - Hue [0..360] or [h,s,l,a,"hsl"] array
 * @param {number} s - Saturation [0..100]
 * @param {number} l - Lightness [0..100]
 * @param {number} [a=255] - Alpha [0..255]
 * @param {boolean} [rnd=true] - Round results
 * @returns {Array} - RGB as [r,g,b,a,"rgb"]
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
 * Convert RGB to HSL color
 * @param {number|Array} r - Red [0..255] or [r,g,b,a,"rgb"] array
 * @param {number} g - Green [0..255]
 * @param {number} b - Blue [0..255]
 * @param {number} [a=255] - Alpha [0..255]
 * @param {boolean} [rnd=true] - Round results
 * @returns {Array} - HSL as [h,s,l,a,"hsl"]
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
 * Parse CSS color string to array format
 * @param {string|Array} s - CSS color string or color array
 * @param {number} [defAlpha=255] - Default alpha value
 * @returns {Array} - Color as [c0,c1,c2,a,model]
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
 * Set cookie value (browser only)
 * @param {string} cname - Cookie name
 * @param {string} cvalue - Cookie value
 * @param {number} exdays - Expiration in days
 * @param {Object} [options] - Additional cookie options
 */
bw.setCookie = function(cname, cvalue, exdays, options = {}) {
  if (bw._isNode) return;
  
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
 * Get cookie value (browser only)
 * @param {string} cname - Cookie name
 * @param {*} defaultValue - Default if not found
 * @returns {*} - Cookie value or default
 */
bw.getCookie = function(cname, defaultValue) {
  if (bw._isNode) return defaultValue;
  
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
 * Get URL parameter value
 * @param {string} key - Parameter name
 * @param {*} defaultValue - Default if not found
 * @returns {*} - Parameter value or default
 */
bw.getURLParam = function(key, defaultValue) {
  if (bw._isNode || typeof window !== "object") return defaultValue;
  
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
 * Create HTML table from data array
 * @param {Array} data - Table data
 * @param {Object} [opts] - Table options
 * @returns {string} - HTML table string
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

// Helper for attributes to string conversion
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
 * Create HTML tabs structure
 * @param {Array} tabData - Array of [title, content] pairs
 * @param {Object} [opts] - Tab options
 * @returns {string} - HTML tabs string
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
 * Tab selection handler
 * @param {Element} tabElement - Clicked tab element
 */
bw.selectTabContent = function(tabElement) {
  if (bw._isNode || !tabElement) return;
  
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
 * Generate Lorem Ipsum text
 * @param {number} [numChars] - Number of characters (random 25-150 if not provided)
 * @param {number} [startSpot] - Starting index in Lorem text (random if undefined)
 * @param {boolean} [startWithCapitalLetter=true] - Start with capital letter
 * @returns {string} - Lorem ipsum text
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
  const originalStartSpot = startSpot;
  
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
 * Create multidimensional array
 * @param {*} value - Value or function to fill array
 * @param {number|Array} dims - Dimensions
 * @returns {Array} - Multidimensional array
 * @example
 * bw.multiArray(0, [4, 5])     // 4x5 array of 0s
 * bw.multiArray("test", 5)     // 5x1 array of "test"
 * bw.multiArray(Math.random, [3, 4]) // 3x4 array of random numbers
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
 * Natural sort comparison function
 * @param {*} as - First value
 * @param {*} bs - Second value
 * @returns {number} - Sort order (-1, 0, 1)
 * @example
 * ["10", "2", "1", "foo"].sort(bw.naturalCompare)
 * // => ["1", "2", "10", "foo"]
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
 * setInterval with a maximum number of repetitions
 * @param {Function} callback - Function to call
 * @param {number} delay - Delay between calls in ms
 * @param {number} repetitions - Maximum number of times to call
 * @returns {number} - Interval ID
 * @example
 * bw.setIntervalX(function(i) {
 *   console.log("Iteration", i);
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
 * Repeat function until condition is met
 * @param {Function} testFn - Test function that returns true when done
 * @param {Function} successFn - Called when test passes
 * @param {Function} [failFn] - Called on each failed test
 * @param {number} [delay=250] - Delay between attempts in ms
 * @param {number} [maxReps=10] - Maximum attempts
 * @param {Function} [lastFn] - Called when done (success or max attempts)
 * @returns {string|number} - "err" if invalid params, otherwise interval ID
 * @example
 * bw.repeatUntil(
 *   () => document.getElementById('myDiv'),
 *   () => console.log('Element found!'),
 *   null,
 *   100,
 *   30
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

/**
 * Create a sortable HTML table from data
 * @param {Object} config - Table configuration
 * @param {Array} config.data - Array of objects to display
 * @param {Array} [config.columns] - Column definitions
 * @param {string} [config.className] - CSS class for table
 * @param {boolean} [config.sortable=true] - Enable sorting
 * @param {Function} [config.onSort] - Sort callback
 * @returns {Object} - TACO object for table
 * @example
 * bw.makeTable({
 *   data: [
 *     { name: "John", age: 30, city: "New York" },
 *     { name: "Jane", age: 25, city: "London" }
 *   ],
 *   columns: [
 *     { key: "name", label: "Name" },
 *     { key: "age", label: "Age", type: "number" },
 *     { key: "city", label: "City" }
 *   ],
 *   className: "table table-striped",
 *   sortable: true
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
 * Create a responsive data table with built-in features
 * @param {Object} config - Table configuration
 * @returns {Object} - TACO object for table with wrapper
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
 * Render a TACO object to DOM with object handle
 * @param {Element|string} element - Target element or selector
 * @param {string} position - Position relative to element: 'replace', 'prepend', 'append', 'before', 'after'
 * @param {Object} taco - TACO object to render
 * @returns {Object} - Component handle object
 * @example
 * const handle = bw.render('#app', 'append', {
 *   t: 'button',
 *   a: { class: 'btn btn-primary' },
 *   c: 'Click Me',
 *   o: {
 *     mounted: (el) => console.log('Button mounted!'),
 *     state: { clickCount: 0 }
 *   }
 * });
 * 
 * // Access the component
 * handle.element // DOM element
 * handle.setState({ clickCount: 1 }) // Update state
 * handle.update() // Re-render
 * handle.destroy() // Remove from DOM
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
      const nextSibling = this.element.nextSibling;
      
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
 * Get component handle by ID
 * @param {string} id - Component ID
 * @returns {Object|null} - Component handle or null
 */
bw.getComponent = function(id) {
  return bw._componentRegistry.get(id) || null;
};

/**
 * Get all component handles
 * @returns {Map} - Map of all component handles
 */
bw.getAllComponents = function() {
  return new Map(bw._componentRegistry);
};

// Export for different environments
export default bw;

// Also attach to global in browsers
if (bw._isBrowser && typeof window !== 'undefined') {
  window.bw = bw;
}