/**
 * Bitwrench v2 Core
 * Zero-dependency UI library using JavaScript objects
 * Works in browsers (IE11+) and Node.js
 * 
 * @license BSD-2-Clause
 * @author M A Chatterjee <deftio [at] deftio [dot] com>
 */

import { VERSION_INFO } from './version.js';
import { getStructuralStyles, theme, updateTheme, generateDarkModeCSS,
         generateThemedCSS, derivePalette as _derivePalette,
         DEFAULT_PALETTE_CONFIG, SPACING_PRESETS, RADIUS_PRESETS, THEME_PRESETS,
         resolveLayout, addUnderscoreAliases } from './bitwrench-styles.js';
import { hexToHsl, hslToHex, adjustLightness, mixColor,
         relativeLuminance, textOnColor, deriveShades,
         derivePalette } from './bitwrench-color-utils.js';

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
  
  return str.replace(/[&<>"'/]/g, (char) => escapeMap[char]);
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

// =========================================================================
// Import and register all components
// =========================================================================
import * as components from './bitwrench-components-v2.js';

// Register all make functions
Object.entries(components).forEach(([name, fn]) => {
  if (name.startsWith('make')) {
    bw[name] = fn;
  }
});

// Register component handles
bw._componentHandles = components.componentHandles || {};

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

// Export for different environments
export default bw;

// Also attach to global in browsers
if (bw._isBrowser && typeof window !== 'undefined') {
  window.bw = bw;
}