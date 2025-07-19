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
  const random = Math.random().toString(36).substr(2, 9);
  
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
  
  // Add data-bw-id if lifecycle hooks present
  if ((opts.mounted || opts.unmount) && !attrs['data-bw-id']) {
    const id = opts.bw_id || bw.uuid();
    attrStr += ` data-bw-id="${id}"`;
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

// Export for different environments
export default bw;

// Also attach to global in browsers
if (bw._isBrowser && typeof window !== 'undefined') {
  window.bw = bw;
}