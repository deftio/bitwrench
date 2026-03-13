/**
 * Bitwrench v2 Core
 * Zero-dependency UI library using JavaScript objects
 * Works in browsers (IE11+) and Node.js
 * 
 * @license BSD-2-Clause
 * @author M A Chatterjee <deftio [at] deftio [dot] com>
 */

import { VERSION_INFO } from './version.js';
import { getStructuralStyles,
         generateThemedCSS, generateAlternateCSS, derivePalette as _derivePalette,
         DEFAULT_PALETTE_CONFIG, SPACING_PRESETS, RADIUS_PRESETS, THEME_PRESETS,
         TYPE_RATIO_PRESETS, ELEVATION_PRESETS, MOTION_PRESETS, generateTypeScale,
         resolveLayout } from './bitwrench-styles.js';
import { hexToHsl, hslToHex, adjustLightness, mixColor,
         relativeLuminance, textOnColor, deriveShades,
         derivePalette, harmonize, deriveAlternateSeed, deriveAlternateConfig,
         isLightPalette,
         colorParse, colorRgbToHsl, colorHslToRgb } from './bitwrench-color-utils.js';
import { bindFileOps } from './bitwrench-file-ops.js';
import { typeOf as _typeOf, mapScale as _mapScale, clip as _clip,
         choice as _choice, arrayUniq as _arrayUniq, arrayBinA as _arrayBinA,
         arrayBNotInA as _arrayBNotInA, colorInterp as _colorInterp,
         loremIpsum as _loremIpsum, multiArray as _multiArray,
         naturalCompare as _naturalCompare, setIntervalX as _setIntervalX,
         repeatUntil as _repeatUntil } from './bitwrench-utils.js';

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
var _to   = _typeOf;  // imported from bitwrench-utils.js
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
bw.typeOf = _typeOf;

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
          if (!srcDir && typeof import.meta !== 'undefined' && import.meta.url) {
            var url = (typeof require === 'function') ? require('url') : null;
            if (url && url.fileURLToPath) srcDir = pathMod.dirname(url.fileURLToPath(import.meta.url));
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
      var themeResult = bw.generateTheme('', Object.assign({}, themeConfig, { inject: false }));
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

  // Body-end script: registry entries + optional loadDefaultStyles
  var bodyEndScript = '';
  var bodyEndParts = [];
  if (registryEntries) {
    bodyEndParts.push(registryEntries);
  }
  if (runtime === 'inline' || runtime === 'cdn') {
    bodyEndParts.push('if(typeof bw!=="undefined"){bw.loadDefaultStyles();}');
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
  if (!_is(comp[action], 'function')) {
    _cw('bw.message: unknown action "' + action + '" on component ' + target);
    return false;
  }
  comp[action](data);
  return true;
};

// ===================================================================================
// bw.clientApply() / bw.clientConnect() — Server-driven UI protocol
// ===================================================================================

/**
 * Registry of named functions sent via register messages.
 * Populated by clientApply({ type: 'register', name, body }).
 * Invoked by clientApply({ type: 'call', name, args }).
 * @private
 */
bw._clientFunctions = {};

/**
 * Whether exec messages are allowed. Set by clientConnect opts.allowExec.
 * Default false — exec messages are rejected unless explicitly opted in.
 * @private
 */
bw._allowExec = false;

/**
 * Built-in client functions available via call() without registration.
 * @private
 */
bw._builtinClientFunctions = {
  scrollTo: function(selector) {
    var el = bw._el(selector);
    if (el) el.scrollTop = el.scrollHeight;
  },
  focus: function(selector) {
    var el = bw._el(selector);
    if (el && _is(el.focus, 'function')) el.focus();
  },
  download: function(filename, content, mimeType) {
    if (typeof document === 'undefined') return;
    var blob = new Blob([content], { type: mimeType || 'text/plain' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  },
  clipboard: function(text) {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
    }
  },
  redirect: function(url) {
    if (typeof window !== 'undefined') window.location.href = url;
  },
  log: function() {
    console.log.apply(console, arguments);
  }
};

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
 * @category Server
 */
bw.clientParse = function(str) {
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
 *   batch    — iterate ops, call clientApply for each
 *   message  — bw.message(target, action, data)
 *   register — store a named function for later call()
 *   call     — invoke a registered or built-in function
 *   exec     — execute arbitrary JS (requires allowExec)
 *
 * Target resolution:
 *   Starts with '#' or '.' → CSS selector (querySelector)
 *   Otherwise → getElementById, then bw._el fallback
 *
 * @param {Object} msg - Protocol message
 * @returns {boolean} true if the message was applied successfully
 * @category Server
 */
bw.clientApply = function(msg) {
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
      if (!bw.clientApply(op)) allOk = false;
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
    var fn = bw._clientFunctions[msg.name] || bw._builtinClientFunctions[msg.name];
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

/**
 * Connect to a bwserve SSE endpoint and apply protocol messages automatically.
 *
 * Returns a connection object with sendAction(), on(), and close() methods.
 *
 * @param {string} url - SSE endpoint URL (e.g., '/__bw/events/client-1')
 * @param {Object} [opts] - Connection options
 * @param {string} [opts.transport='sse'] - Transport type: 'sse' (default) or 'poll'
 * @param {number} [opts.interval=2000] - Poll interval in ms (only for 'poll' transport)
 * @param {string} [opts.actionUrl] - POST endpoint for actions (default: derived from url)
 * @param {boolean} [opts.reconnect=true] - Auto-reconnect on disconnect
 * @param {boolean} [opts.allowExec=false] - Enable exec message type (arbitrary JS execution)
 * @param {Function} [opts.onStatus] - Status callback: 'connecting'|'connected'|'disconnected'
 * @param {Function} [opts.onMessage] - Raw message callback (before clientApply)
 * @returns {Object} Connection object { sendAction, on, close, status }
 * @category Server
 */
bw.clientConnect = function(url, opts) {
  opts = opts || {};
  var transport = opts.transport || 'sse';
  var actionUrl = opts.actionUrl || url.replace(/\/events\//, '/action/');
  var reconnect = opts.reconnect !== false;
  var onStatus = opts.onStatus || function() {};
  var onMessage = opts.onMessage || null;
  var handlers = {};
  // Set the global allowExec flag from connection options
  bw._allowExec = !!opts.allowExec;
  var conn = {
    status: 'connecting',
    _es: null,
    _pollTimer: null
  };

  function setStatus(s) {
    conn.status = s;
    onStatus(s);
  }

  function handleMessage(data) {
    try {
      var msg = _is(data, 'string') ? bw.clientParse(data) : data;
      if (onMessage) onMessage(msg);
      if (handlers.message) handlers.message(msg);
      bw.clientApply(msg);
    } catch (e) {
      if (handlers.error) handlers.error(e);
    }
  }

  if (transport === 'sse' && typeof EventSource !== 'undefined') {
    setStatus('connecting');
    var es = new EventSource(url);
    conn._es = es;

    es.onopen = function() {
      setStatus('connected');
      if (handlers.open) handlers.open();
    };

    es.onmessage = function(e) {
      handleMessage(e.data);
    };

    es.onerror = function() {
      if (conn.status === 'connected') {
        setStatus('disconnected');
      }
      if (handlers.error) handlers.error(new Error('SSE connection error'));
      if (!reconnect) {
        es.close();
      }
      // EventSource auto-reconnects by default when reconnect=true
    };
  } else if (transport === 'poll') {
    var interval = opts.interval || 2000;
    setStatus('connected');
    conn._pollTimer = setInterval(function() {
      fetch(url).then(function(r) { return r.json(); }).then(function(msgs) {
        if (_isA(msgs)) {
          msgs.forEach(handleMessage);
        } else if (msgs && msgs.type) {
          handleMessage(msgs);
        }
      }).catch(function(e) {
        if (handlers.error) handlers.error(e);
      });
    }, interval);
  }

  /**
   * Send an action to the server via POST.
   * @param {string} action - Action name
   * @param {Object} [data] - Action payload
   */
  conn.sendAction = function(action, data) {
    var body = JSON.stringify({ type: 'action', action: action, data: data || {} });
    fetch(actionUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body
    }).catch(function(e) {
      if (handlers.error) handlers.error(e);
    });
  };

  /**
   * Register an event handler.
   * @param {string} event - 'open'|'message'|'error'|'close'
   * @param {Function} handler
   */
  conn.on = function(event, handler) {
    handlers[event] = handler;
    return conn;
  };

  /**
   * Close the connection.
   */
  conn.close = function() {
    if (conn._es) {
      conn._es.close();
      conn._es = null;
    }
    if (conn._pollTimer) {
      clearInterval(conn._pollTimer);
      conn._pollTimer = null;
    }
    setStatus('disconnected');
    if (handlers.close) handlers.close();
  };

  return conn;
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
 * @see bw.loadDefaultStyles
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
 * @see bw.u
 * @example
 * var style = bw.s(bw.u.flex, bw.u.gap4, { color: 'red' });
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
bw.mapScale = _mapScale;

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
bw.clip = _clip;

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
bw.choice = _choice;
/** @see bitwrench-utils.js for implementation */
bw.arrayUniq = _arrayUniq;
/** @see bitwrench-utils.js for implementation */
bw.arrayBinA = _arrayBinA;
/** @see bitwrench-utils.js for implementation */
bw.arrayBNotInA = _arrayBNotInA;

/** @see bitwrench-utils.js for implementation — wraps _colorInterp with bw.colorParse */
bw.colorInterp = function(x, in0, in1, colors, stretch) {
  return _colorInterp(x, in0, in1, colors, stretch, colorParse);
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
bw.loremIpsum = _loremIpsum;

/** @see bitwrench-utils.js for implementation */
bw.multiArray = _multiArray;
/** @see bitwrench-utils.js for implementation */
bw.naturalCompare = _naturalCompare;
/** @see bitwrench-utils.js for implementation */
bw.setIntervalX = _setIntervalX;
/** @see bitwrench-utils.js for implementation */
bw.repeatUntil = _repeatUntil;

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

// =========================================================================
// Import and register all components
// =========================================================================
import * as components from './bitwrench-bccl.js';

// Register all make functions
Object.entries(components).forEach(([name, fn]) => {
  if (name.startsWith('make')) {
    bw[name] = fn;
  }
});

// Factory dispatch: bw.make('card', props) → bw.makeCard(props)
bw.make = components.make;

// Component registry: bw.BCCL lists all available component types
bw.BCCL = components.BCCL;

// Variant class helper: bw.variantClass('primary') → 'bw_primary'
bw.variantClass = components.variantClass;

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

// Export for different environments
export default bw;

// Also attach to global in browsers
if (bw._isBrowser && typeof window !== 'undefined') {
  window.bw = bw;
}