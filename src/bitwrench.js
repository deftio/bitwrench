/**
 * Bitwrench v2 Core
 * Zero-dependency UI library using JavaScript objects
 * Works in browsers (IE11+) and Node.js
 * 
 * @license BSD-2-Clause
 * @author M A Chatterjee <deftio [at] deftio [dot] com>
 */

import { VERSION_INFO } from './version.js';
import { getStructuralStyles, getResetStyles,
         generateThemedCSS, derivePalette as _derivePalette,
         DEFAULT_PALETTE_CONFIG, SPACING_PRESETS, RADIUS_PRESETS, THEME_PRESETS,
         TYPE_RATIO_PRESETS, ELEVATION_PRESETS, MOTION_PRESETS, generateTypeScale,
         resolveLayout, scopeRulesUnder } from './bitwrench-styles.js';
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
  // Fast O(1) lookup for elements by id attribute or bw_uuid_* class.
  //
  // Populated by bw.createDOM() when elements have:
  //   - id attribute (standard HTML id)
  //   - bw_uuid_* class (lifecycle-managed or explicitly addressed elements)
  //
  // Cleaned up by bw.cleanup() when elements are destroyed via bitwrench APIs.
  // On cache miss, falls back to querySelector/getElementById — never fails,
  // just slower. Stale entries (refs to detached nodes) are removed on miss
  // via parentNode === null check (IE11-safe, unlike el.isConnected).
  //
  // Elements created via bw.createDOM() also get el._bw_refs — a local map of
  // child id/UUID -> DOM node ref for fast parent->child access in o.render.
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
 * 4. Try class-based lookup for bw_uuid_* tokens (UUID addressing)
 * 5. Cache the result for next time
 *
 * Accepts a DOM element directly (pass-through) or a string identifier.
 * String identifiers are tried as: direct map key, getElementById,
 * querySelector (for CSS selectors starting with . or #), and
 * bw_uuid_* class selector.
 *
 * @param {string|Element} id - Element ID, CSS selector, bw_uuid_* class, or DOM element
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

  // 4. Try class-based lookup for bw_uuid_* tokens (UUID addressing)
  if (!el && id.indexOf('bw_uuid_') === 0) {
    el = document.querySelector('.' + id);
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
 * id attributes, UUID classes, or both.
 *
 * @param {Element} el - DOM element to register
 * @param {string} [uuid] - bw_uuid_* class token to register under
 * @category Internal
 */
bw._registerNode = function(el, uuid) {
  if (!el) return;
  // Register under UUID class token
  if (uuid) {
    bw._nodeMap[uuid] = el;
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
 * @param {string} [uuid] - bw_uuid_* class token to remove
 * @category Internal
 */
bw._deregisterNode = function(el, uuid) {
  // Remove UUID class entry
  if (uuid) {
    delete bw._nodeMap[uuid];
  }
  // Remove id attribute entry
  var htmlId = el && el.getAttribute ? el.getAttribute('id') : null;
  if (htmlId) {
    delete bw._nodeMap[htmlId];
  }
};

// ===================================================================================
// bw.assignUUID() / bw.getUUID() — Explicit UUID addressing for TACO objects
// ===================================================================================

/**
 * Marker class for elements with lifecycle hooks (mounted/unmount/render/state).
 * Used by cleanup() to find lifecycle-managed elements via querySelectorAll('.bw_lc').
 * @private
 */
var _BW_LC = 'bw_lc';

/**
 * Regex to match a bw_uuid_* token in a class string.
 * @private
 */
var _UUID_RE = /\bbw_uuid_[a-z0-9_]+\b/;

/**
 * Assign a UUID to a TACO object by appending a `bw_uuid_*` token to `taco.a.class`.
 *
 * Idempotent by default — calling twice returns the same UUID. Pass `forceNew=true`
 * to replace an existing UUID (useful in loops where each TACO needs a unique ID).
 *
 * @param {Object} taco - A TACO object `{t, a, c, o}`
 * @param {boolean} [forceNew=false] - If true, replaces any existing UUID with a new one
 * @returns {string} The UUID string (e.g. 'bw_uuid_a1b2c3d4e5')
 * @category Identifiers
 * @example
 * var card = bw.makeStatCard({ value: '0', label: 'Scans' });
 * var uuid = bw.assignUUID(card);        // 'bw_uuid_a1b2c3d4e5'
 * var same = bw.assignUUID(card);        // same UUID (idempotent)
 * var diff = bw.assignUUID(card, true);  // new UUID (forced)
 */
bw.assignUUID = function(taco, forceNew) {
  if (!taco || !_is(taco, 'object')) return null;

  // Ensure taco.a exists
  if (!taco.a) taco.a = {};
  if (!_is(taco.a.class, 'string')) taco.a.class = taco.a.class ? String(taco.a.class) : '';

  var existing = taco.a.class.match(_UUID_RE);

  if (existing && !forceNew) {
    return existing[0];
  }

  // Remove old UUID if forceNew
  if (existing) {
    taco.a.class = taco.a.class.replace(_UUID_RE, '').replace(/\s+/g, ' ').trim();
  }

  var uuid = bw.uuid('uuid');
  taco.a.class = (taco.a.class ? taco.a.class + ' ' : '') + uuid;
  return uuid;
};

/**
 * Read the UUID from a TACO object or DOM element. Pure getter, no side effects.
 *
 * @param {Object|Element} tacoOrElement - A TACO object or DOM element
 * @returns {string|null} The UUID string, or null if none assigned
 * @category Identifiers
 * @example
 * bw.getUUID(card)       // 'bw_uuid_a1b2c3d4e5' (from TACO)
 * bw.getUUID(domEl)      // 'bw_uuid_a1b2c3d4e5' (from DOM element)
 * bw.getUUID({t:'div'})  // null (no UUID)
 */
bw.getUUID = function(tacoOrElement) {
  if (!tacoOrElement) return null;

  var classStr;
  // DOM element: check className
  if (tacoOrElement.className !== undefined && tacoOrElement.tagName) {
    classStr = tacoOrElement.className;
  }
  // TACO object: check a.class
  else if (tacoOrElement.a && _is(tacoOrElement.a.class, 'string')) {
    classStr = tacoOrElement.a.class;
  }

  if (!classStr) return null;
  var match = classStr.match(_UUID_RE);
  return match ? match[0] : null;
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
 * Hyperscript-style TACO constructor.
 *
 * A convenience helper that returns a canonical TACO object from positional
 * arguments. The return value is a plain object — serializable, works with
 * bwserve, and accepted everywhere TACO is accepted.
 *
 * @param {string} tag - HTML tag name (e.g. 'div', 'p', 'section')
 * @param {Object|null} [attrs] - HTML attributes object. Pass null or omit to skip.
 * @param {*} [content] - Content: string, number, TACO object, or array of children.
 * @param {Object} [options] - TACO options (state, lifecycle hooks, render fn).
 * @returns {Object} Plain TACO object {t, a?, c?, o?}
 * @category Utilities
 * @see bw.html
 * @see bw.createDOM
 * @see bw.DOM
 * @example
 * bw.h('div')
 * // => { t: 'div' }
 *
 * bw.h('p', { class: 'bw_text_muted' }, 'Hello')
 * // => { t: 'p', a: { class: 'bw_text_muted' }, c: 'Hello' }
 *
 * bw.h('ul', null, [
 *   bw.h('li', null, 'one'),
 *   bw.h('li', null, 'two')
 * ])
 * // => { t: 'ul', c: [{ t: 'li', c: 'one' }, { t: 'li', c: 'two' }] }
 */
bw.h = function(tag, attrs, content, options) {
  var taco = { t: String(tag) };
  if (attrs !== null && attrs !== undefined) taco.a = attrs;
  if (content !== undefined) taco.c = content;
  if (options !== undefined) taco.o = options;
  return taco;
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
  if (_isA(taco)) {
    return taco.map(t => bw.html(t, options)).join('');
  }

  // Handle bw.raw() marked content
  if (taco && taco.__bw_raw) {
    return taco.v;
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

  // Add bw_uuid + bw_lc classes if lifecycle hooks present
  if ((opts.mounted || opts.unmount) && !_UUID_RE.test(attrs.class || '')) {
    const uuid = bw.uuid('uuid');
    attrStr = attrStr.replace(/class="([^"]*)"/, (_match, classes) => {
      return `class="${classes} ${uuid} ${_BW_LC}"`.trim();
    });
    if (!attrStr.includes('class=')) {
      attrStr += ` class="${uuid} ${_BW_LC}"`;
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
      var themeResult = bw.makeStyles(themeConfig);
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

  // Body-end script: registry entries + optional loadStyles
  var bodyEndScript = '';
  var bodyEndParts = [];
  if (registryEntries) {
    bodyEndParts.push(registryEntries);
  }
  if (runtime === 'inline' || runtime === 'cdn') {
    bodyEndParts.push('if(typeof bw!=="undefined"){bw.loadStyles();}');
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
  // Children with id attributes or bw_uuid_* classes get local refs on the parent,
  // so o.render functions can access them without any DOM lookup.
  if (content != null) {
    if (_isA(content)) {
      content.forEach(child => {
        if (child != null) {
          var childEl = bw.createDOM(child, options);
          el.appendChild(childEl);
          // Build local refs for addressable children
          var childRefId = (child && child.a) ? (child.a.id || bw.getUUID(child)) : null;
          if (childRefId) {
            if (!el._bw_refs) el._bw_refs = {};
            el._bw_refs[childRefId] = childEl;
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
    } else if (_is(content, 'object') && content.t) {
      var childEl = bw.createDOM(content, options);
      el.appendChild(childEl);
      var childRefId = content.a ? (content.a.id || bw.getUUID(content)) : null;
      if (childRefId) {
        if (!el._bw_refs) el._bw_refs = {};
        el._bw_refs[childRefId] = childEl;
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

  // Register UUID class in node cache (bw_uuid_* tokens in class string)
  if (el.className) {
    var uuidMatch = el.className.match(_UUID_RE);
    if (uuidMatch) {
      bw._nodeMap[uuidMatch[0]] = el;
    }
  }

  // Handle lifecycle hooks and state
  if (opts.mounted || opts.unmount || opts.render || opts.state) {
    // Ensure element has a UUID class for identity
    var uuid = bw.getUUID(el) || bw.uuid('uuid');
    el.classList.add(uuid);
    el.classList.add(_BW_LC);

    // Register in node cache under UUID class
    bw._registerNode(el, uuid);

    // Store state
    if (opts.state) {
      el._bw_state = opts.state;
    }

    // o.render — store the render function for bw.update()
    if (opts.render) {
      el._bw_render = opts.render;
    }

    // Determine what to call on mount:
    // - If o.mounted exists, call it (it can call el._bw_render() for initial render)
    // - Otherwise if o.render exists, auto-call it as a convenience shorthand
    var mountFn = opts.mounted || (opts.render ? function(mountEl) {
      opts.render(mountEl, mountEl._bw_state || {});
    } : null);

    if (mountFn) {
      if (document.body.contains(el)) {
        mountFn(el, el._bw_state || {});
      } else {
        requestAnimationFrame(() => {
          if (document.body.contains(el)) {
            mountFn(el, el._bw_state || {});
          }
        });
      }
    }

    // Store unmount callback keyed by UUID class
    if (opts.unmount) {
      bw._unmountCallbacks.set(uuid, () => {
        opts.unmount(el, el._bw_state || {});
      });
    }
  }

  // Component handle: attach methods to el.bw namespace
  if (opts.handle || opts.slots) {
    if (!el.bw) el.bw = {};

    // Explicit handle methods: fn(el, ...args) -> el.bw.method(...args)
    if (opts.handle) {
      for (var hk in opts.handle) {
        if (_hop.call(opts.handle, hk)) {
          el.bw[hk] = opts.handle[hk].bind(null, el);
        }
      }
    }

    // Slot declarations: auto-generate setX/getX pairs
    if (opts.slots) {
      for (var sk in opts.slots) {
        if (_hop.call(opts.slots, sk)) {
          (function(name, selector) {
            var cap = name.charAt(0).toUpperCase() + name.slice(1);
            el.bw['set' + cap] = function(value) {
              var t = el.querySelector(selector);
              if (!t) return;
              if (value != null && typeof value === 'object' && value.t) {
                t.innerHTML = '';
                t.appendChild(bw.createDOM(value));
              } else {
                t.textContent = (value != null) ? String(value) : '';
              }
            };
            el.bw['get' + cap] = function() {
              var t = el.querySelector(selector);
              return t ? t.textContent : '';
            };
          })(sk, opts.slots[sk]);
        }
      }
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
  const savedUuid = bw.getUUID(targetEl);
  const savedSubs = targetEl._bw_subs;

  // Temporarily remove _bw_subs so cleanup doesn't call them
  // (children's subs will still be cleaned up normally)
  delete targetEl._bw_subs;

  bw.cleanup(targetEl);

  // Restore the target's own state/render/subs after cleanup
  if (savedState !== undefined) targetEl._bw_state = savedState;
  if (savedRender) targetEl._bw_render = savedRender;
  if (savedUuid) {
    // UUID class stays on element through cleanup; re-register in cache
    bw._registerNode(targetEl, savedUuid);
  }
  if (savedSubs) targetEl._bw_subs = savedSubs;

  // Clear and mount new content
  targetEl.innerHTML = '';
  
  if (taco != null) {
    // Handle arrays
    if (_isA(taco)) {
      taco.forEach(t => {
        if (t != null) {
          targetEl.appendChild(bw.createDOM(t, options));
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

// Deprecation stubs for removed ComponentHandle APIs
bw.compileProps = function() { throw new Error('bw.compileProps() removed in v2.0.19. Use o.handle/o.slots instead.'); };
bw.renderComponent = function() { throw new Error('bw.renderComponent() removed in v2.0.19. Use bw.mount() with o.handle/o.slots instead.'); };

/**
 * Mount a TACO into a target element and return the created root element.
 * Like bw.DOM() but returns the root element of the TACO (not the container),
 * giving direct access to el.bw handle methods.
 *
 * @param {string|Element} target - CSS selector or DOM element
 * @param {Object} taco - TACO to render
 * @param {Object} [options] - Mount options
 * @returns {Element} The created root element
 * @category DOM Generation
 * @example
 * var el = bw.mount('#app', bw.makeCarousel({ items: slides }));
 * el.bw.goToSlide(2);
 * el.bw.next();
 */
bw.mount = function(target, taco, options) {
  var container = _is(target, 'string') ? bw.$(target)[0] : target;
  if (!container) {
    _cw('bw.mount: target not found');
    return null;
  }
  bw.cleanup(container);
  container.innerHTML = '';
  var el = bw.createDOM(taco, options || {});
  container.appendChild(el);
  return el;
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

  // Deregister UUID classes from node cache for non-lifecycle UUID elements
  var uuidEls = element.querySelectorAll('[class*="bw_uuid_"]');
  uuidEls.forEach(function(uel) {
    var m = uel.className && uel.className.match(_UUID_RE);
    if (m) delete bw._nodeMap[m[0]];
  });

  // Find all lifecycle-managed elements (have bw_lc marker class)
  const elements = element.querySelectorAll('.' + _BW_LC);

  elements.forEach(el => {
    var uuid = bw.getUUID(el);

    if (uuid) {
      const callback = bw._unmountCallbacks.get(uuid);
      if (callback) {
        callback();
        bw._unmountCallbacks.delete(uuid);
      }

      // Deregister from node cache
      bw._deregisterNode(el, uuid);
    }

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
  var selfUuid = bw.getUUID(element);
  if (selfUuid) {
    delete bw._nodeMap[selfUuid];

    const callback = bw._unmountCallbacks.get(selfUuid);
    if (callback) {
      callback();
      bw._unmountCallbacks.delete(selfUuid);
    }

    // Deregister from node cache
    bw._deregisterNode(element, selfUuid);

    // Clean up pub/sub subscriptions tied to element itself
    if (element._bw_subs) {
      element._bw_subs.forEach(function(unsub) { unsub(); });
      delete element._bw_subs;
    }
    delete element._bw_state;
    delete element._bw_render;
    delete element._bw_refs;

  } else {
    // No UUID on element itself, but still check for _bw_subs (from bw.sub())
    if (element._bw_subs) {
      element._bw_subs.forEach(function(unsub) { unsub(); });
      delete element._bw_subs;
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
 * @param {string|Element} target - Element ID, bw_uuid_* class, CSS selector, or DOM element
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
 * @param {string|Element} id - Element ID, bw_uuid_* class, CSS selector, or DOM element.
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
 * @param {string|Element} target - Element ID, bw_uuid_* class, CSS selector, or DOM element.
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
 * @param {string|Element} target - Element ID, bw_uuid_* class, CSS selector, or DOM element.
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
    // Ensure element has UUID + bw_lc so bw.cleanup() finds it
    if (!bw.getUUID(el)) {
      el.classList.add(bw.uuid('uuid'));
    }
    if (!el.classList.contains(_BW_LC)) {
      el.classList.add(_BW_LC);
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

// ===================================================================================
// Deprecation stubs for removed ComponentHandle APIs (v2.0.19)
// ===================================================================================

bw._extractDeps = undefined;
bw._dirtyComponents = undefined;
bw._flushScheduled = undefined;
bw._scheduleFlush = undefined;
bw._doFlush = undefined;
bw._ComponentHandle = undefined;

/**
 * No-op flush (ComponentHandle removed in v2.0.19).
 * Kept as no-op for backward compatibility.
 * @category Component
 */
bw.flush = function() {};


bw.when = function() { throw new Error('bw.when() removed in v2.0.19. Use conditional logic in o.render instead.'); };
bw.each = function() { throw new Error('bw.each() removed in v2.0.19. Use array mapping in o.render instead.'); };
bw.component = function() { throw new Error('bw.component() removed in v2.0.19. Use o.handle/o.slots on TACO options instead.'); };


// ===================================================================================
// bw.message() — SendMessage() for the web
// ===================================================================================

/**
 * Dispatch a message to a component by UUID, CSS class, or selector.
 * Finds the element, looks up el.bw, and calls the named method.
 * This is the bitwrench equivalent of Win32 SendMessage(hwnd, msg, wParam, lParam).
 *
 * @param {string} target - Component UUID (bw_uuid_*), CSS class, or selector
 * @param {string} action - Method name to call on el.bw
 * @param {*} data - Data to pass to the method
 * @returns {boolean} True if message was dispatched successfully
 * @category Component
 * @example
 * bw.message('my_carousel', 'goToSlide', 2);
 * // Or from SSE handler:
 * es.onmessage = function(e) {
 *   var msg = JSON.parse(e.data);
 *   bw.message(msg.target, msg.action, msg.data);
 * };
 */
bw.message = function(target, action, data) {
  var el = bw._el(target);
  if (!el) el = bw.$('.' + target)[0];
  if (!el || !el.bw || typeof el.bw[action] !== 'function') {
    _cw('bw.message: no handle method "' + action + '" on ' + target);
    return false;
  }
  el.bw[action](data);
  return true;
};

// ===================================================================================
// bw.apply() / bw.parseJSONFlex() — Server-driven UI protocol
// ===================================================================================

/**
 * Registry of named functions sent via register messages.
 * Populated by bw.apply({ type: 'register', name, body }).
 * Invoked by bw.apply({ type: 'call', name, args }).
 * @private
 */
bw._clientFunctions = {};

/**
 * Whether exec messages are allowed. Set by bwclient connect opts.allowExec.
 * Default false — exec messages are rejected unless explicitly opted in.
 * @private
 */
bw._allowExec = false;

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
 * @category Core
 */
bw.parseJSONFlex = function(str) {
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
 *   batch    — iterate ops, call bw.apply for each
 *   message  — bw.message(target, action, data)
 *   register — store a named function for later call()
 *   call     — invoke a registered function
 *   exec     — execute arbitrary JS (requires allowExec)
 *
 * Target resolution:
 *   Starts with '#' or '.' → CSS selector (querySelector)
 *   Otherwise → getElementById, then bw._el fallback
 *
 * @param {Object} msg - Protocol message
 * @returns {boolean} true if the message was applied successfully
 * @category Core
 */
bw.apply = function(msg) {
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
      if (!bw.apply(op)) allOk = false;
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
    var fn = bw._clientFunctions[msg.name];
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


// ===================================================================================
// bw.inspect() — Debug utility
// ===================================================================================

/**
 * Inspect a DOM element's bitwrench state, handle methods, and metadata.
 * Works with DOM elements or CSS selectors.
 *
 * @param {string|Element} target - Selector or DOM element
 * @returns {Element|null} The element, or null if not found
 * @category Component
 * @example
 * bw.inspect('#my-carousel');
 * bw.inspect($0);
 */
bw.inspect = function(target) {
  var el = _is(target, 'string') ? bw.$(target)[0] : target;
  if (!el) { _cw('bw.inspect: element not found'); return null; }
  console.group('Element: ' + (bw.getUUID(el) || el.id || el.tagName));
  _cl('State:', el._bw_state || '(none)');
  _cl('Handle:', el.bw ? _keys(el.bw) : '(none)');
  _cl('Classes:', el.className);
  _cl('Refs:', el._bw_refs || '(none)');
  console.groupEnd();
  return el;
};

bw.compile = function() { throw new Error('bw.compile() removed in v2.0.19. Use o.handle/o.slots on TACO options instead.'); };

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
 * @see bw.loadStyles
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
 * @example
 * var style = bw.s({ display: 'flex' }, { gap: '1rem' }, { color: 'red' });
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


// =========================================================================
// v2.0.18 Clean Styles API — makeStyles / applyStyles / loadStyles / etc.
// =========================================================================

/**
 * Convert a scope selector to a <style> element id.
 * @private
 * @param {string} [scope] - Scope selector (e.g. '#my-dashboard', '.preview')
 * @returns {string} Style element id (e.g. 'bw_style_my_dashboard')
 */
function _scopeToStyleId(scope) {
  if (!scope || scope === '' || scope === 'global') return 'bw_style_global';
  if (scope === 'reset') return 'bw_style_reset';
  // Strip leading # or . and convert - to _
  var clean = scope.replace(/^[#.]/, '').replace(/-/g, '_');
  return 'bw_style_' + clean;
}

/**
 * Generate a complete styles object from seed colors and layout config.
 * Pure function — no DOM, no state, no side effects.
 *
 * All parameters are optional. Defaults to the bitwrench default palette.
 *
 * @param {Object} [config] - Style configuration
 * @param {string} [config.primary='#006666'] - Primary brand color hex
 * @param {string} [config.secondary='#6c757d'] - Secondary color hex
 * @param {string} [config.tertiary] - Tertiary color hex (defaults to primary)
 * @param {string} [config.spacing='normal'] - 'compact' | 'normal' | 'spacious'
 * @param {string} [config.radius='md'] - 'none' | 'sm' | 'md' | 'lg' | 'pill'
 * @returns {Object} { css, alternateCss, rules, alternateRules, palette, alternatePalette, isLightPrimary }
 * @category CSS & Styling
 * @see bw.applyStyles
 * @see bw.loadStyles
 * @example
 * var styles = bw.makeStyles({ primary: '#4f46e5', secondary: '#d97706' });
 * console.log(styles.palette.primary.base); // '#4f46e5'
 * // styles.css contains all themed CSS — nothing injected
 */
bw.makeStyles = function(config) {
  var fullConfig = Object.assign({}, DEFAULT_PALETTE_CONFIG, config || {});
  if (config && !config.tertiary) fullConfig.tertiary = fullConfig.primary;

  // Derive primary palette
  var palette = derivePalette(fullConfig);

  // Resolve layout
  var layout = resolveLayout(fullConfig);

  // Generate primary themed CSS rules (unscoped)
  var themedRules = generateThemedCSS('', palette, layout);
  var cssStr = bw.css(themedRules);

  // Derive alternate palette (luminance-inverted)
  var altConfig = deriveAlternateConfig(fullConfig);
  var altPalette = derivePalette(altConfig);

  // Generate alternate CSS rules WITHOUT .bw_theme_alt prefix (raw rules)
  // applyStyles() wraps them appropriately based on scope
  var altRawRules = generateThemedCSS('', altPalette, layout);

  // Add body-level surface overrides for the alternate palette.
  // When .bw_theme_alt is on <html>, ".bw_theme_alt body" correctly matches.
  altRawRules['body'] = {
    'color': altPalette.dark.base,
    'background-color': altPalette.surface || altPalette.light.base
  };

  var altCssStr = bw.css(altRawRules);

  // Determine if primary is light-flavored
  var lightPrimary = isLightPalette(fullConfig);

  return {
    css: cssStr,
    alternateCss: altCssStr,
    rules: themedRules,
    alternateRules: altRawRules,
    palette: palette,
    alternatePalette: altPalette,
    isLightPrimary: lightPrimary
  };
};

/**
 * Inject styles into the DOM with optional scoping.
 *
 * Takes a styles object from `makeStyles()` and creates a single `<style>`
 * element in `<head>`. If a scope selector is provided, all CSS rules are
 * wrapped under that selector. Alternate CSS is wrapped under `.bw_theme_alt`.
 *
 * @param {Object} styles - Result of `bw.makeStyles()`
 * @param {string} [scope] - Scope selector (e.g. '#my-dashboard', '.preview'). Omit for global.
 * @returns {Element|null} The `<style>` element, or null in Node.js
 * @category CSS & Styling
 * @see bw.makeStyles
 * @see bw.loadStyles
 * @see bw.clearStyles
 * @example
 * var styles = bw.makeStyles({ primary: '#4f46e5' });
 * bw.applyStyles(styles);                     // global
 * bw.applyStyles(styles, '#my-dashboard');     // scoped
 */
bw.applyStyles = function(styles, scope) {
  if (!bw._isBrowser) return null;
  if (!styles || !styles.rules) {
    _cw('bw.applyStyles: invalid styles object');
    return null;
  }

  var styleId = _scopeToStyleId(scope);

  // Scope the primary rules if a scope is provided
  var primaryRules = styles.rules;
  if (scope) {
    primaryRules = scopeRulesUnder(primaryRules, scope);
  }

  // Wrap alternate rules with .bw_theme_alt
  var altRules = styles.alternateRules;
  if (altRules) {
    if (scope) {
      // Scoped compound: #scope.bw_theme_alt .bw_card
      altRules = scopeRulesUnder(altRules, scope + '.bw_theme_alt');
    } else {
      // Global: .bw_theme_alt .bw_card
      altRules = scopeRulesUnder(altRules, '.bw_theme_alt');
    }
  }

  // Combine primary + alternate into one CSS string
  var combined = bw.css(primaryRules);
  if (altRules) {
    combined += '\n' + bw.css(altRules);
  }

  return bw.injectCSS(combined, { id: styleId, append: false });
};

/**
 * Generate and apply styles in one call. Convenience wrapper.
 *
 * Equivalent to: `bw.applyStyles(bw.makeStyles(config), scope)`
 *
 * @param {Object} [config] - Style configuration (same as `makeStyles`)
 * @param {string} [scope] - Scope selector (same as `applyStyles`)
 * @returns {Element|null} The `<style>` element, or null in Node.js
 * @category CSS & Styling
 * @see bw.makeStyles
 * @see bw.applyStyles
 * @example
 * bw.loadStyles();                                          // defaults, global
 * bw.loadStyles({ primary: '#4f46e5' });                    // custom, global
 * bw.loadStyles({ primary: '#4f46e5' }, '#my-dashboard');   // custom, scoped
 */
bw.loadStyles = function(config, scope) {
  // Also inject structural CSS first (only once)
  if (bw._isBrowser) {
    var existing = document.getElementById('bw_structural');
    if (!existing) {
      var structuralCSS = bw.css(getStructuralStyles());
      bw.injectCSS(structuralCSS, { id: 'bw_structural', append: false });
    }
  }
  return bw.applyStyles(bw.makeStyles(config), scope);
};

/**
 * Inject the CSS reset (box-sizing, html/body font, reduced-motion).
 * Idempotent — if already injected, returns the existing `<style>` element.
 *
 * @returns {Element|null} The `<style>` element, or null in Node.js
 * @category CSS & Styling
 * @see bw.loadStyles
 * @see bw.clearStyles
 * @example
 * bw.loadReset();  // inject once, safe to call multiple times
 */
bw.loadReset = function() {
  if (!bw._isBrowser) return null;
  var existing = document.getElementById('bw_style_reset');
  if (existing) return existing;
  return bw.injectCSS(bw.css(getResetStyles()), { id: 'bw_style_reset', append: false });
};

/**
 * Toggle between primary and alternate palettes.
 *
 * Adds/removes the `bw_theme_alt` class on the scoping element.
 * Without a scope, toggles on `<html>` (global).
 * With a scope, toggles on the first matching element.
 *
 * @param {string} [scope] - Scope selector (e.g. '#my-dashboard'). Omit for global.
 * @returns {string} Active mode after toggle: 'primary' or 'alternate'
 * @category CSS & Styling
 * @see bw.applyStyles
 * @see bw.clearStyles
 * @example
 * bw.toggleStyles();                   // global toggle on <html>
 * bw.toggleStyles('#my-dashboard');    // scoped toggle
 */
bw.toggleStyles = function(scope) {
  if (!bw._isBrowser) return 'primary';
  var target;
  if (scope) {
    var els = bw.$(scope);
    target = els[0];
  } else {
    target = document.documentElement;
  }
  if (!target) return 'primary';

  var hasAlt = target.classList.contains('bw_theme_alt');
  if (hasAlt) {
    target.classList.remove('bw_theme_alt');
    return 'primary';
  } else {
    target.classList.add('bw_theme_alt');
    return 'alternate';
  }
};

/**
 * Remove injected styles for a given scope.
 *
 * Finds the `<style>` element by id and removes it. Also removes
 * the `bw_theme_alt` class from the relevant element.
 *
 * @param {string} [scope] - Scope selector. Omit to remove global styles.
 * @category CSS & Styling
 * @see bw.applyStyles
 * @see bw.loadStyles
 * @example
 * bw.clearStyles();                    // remove global styles
 * bw.clearStyles('#my-dashboard');     // remove scoped styles
 * bw.clearStyles('reset');             // remove the CSS reset
 */
bw.clearStyles = function(scope) {
  if (!bw._isBrowser) return;
  var styleId = _scopeToStyleId(scope);
  var el = document.getElementById(styleId);
  if (el) el.remove();

  // Also remove bw_theme_alt from the relevant element
  if (scope && scope !== 'reset' && scope !== 'global') {
    var targets = bw.$(scope);
    if (targets[0]) targets[0].classList.remove('bw_theme_alt');
  } else if (!scope || scope === 'global') {
    document.documentElement.classList.remove('bw_theme_alt');
  }
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
 * @param {string} [config.className=''] - Additional CSS classes for table element
 * @param {boolean} [config.sortable=true] - Enable click-to-sort headers
 * @param {Function} [config.onSort] - Sort callback (column, direction)
 * @param {boolean} [config.selectable=false] - Enable row selection on click
 * @param {Function} [config.onRowClick] - Row click callback (row, index, event)
 * @param {number} [config.pageSize] - Rows per page (enables pagination when set)
 * @param {number} [config.currentPage=1] - Current page number (1-based)
 * @param {Function} [config.onPageChange] - Page change callback (newPage)
 * @returns {Object} TACO object for table (with optional pagination controls)
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
 *   ],
 *   selectable: true,
 *   onRowClick: function(row, i) { console.log('clicked', row.name); },
 *   pageSize: 10,
 *   currentPage: 1,
 *   onPageChange: function(page) { console.log('page', page); }
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
    sortDirection = 'asc',
    selectable = false,
    onRowClick,
    pageSize,
    currentPage = 1,
    onPageChange
  } = config;

  // Build class list: always include bw_table, add striped/hover/selectable, append user className
  let cls = 'bw_table';
  if (striped) cls += ' bw_table_striped';
  if (hover || selectable) cls += ' bw_table_hover';
  if (selectable) cls += ' bw_table_selectable';
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

  // Pagination
  const totalRows = sortedData.length;
  const totalPages = pageSize ? Math.max(1, Math.ceil(totalRows / pageSize)) : 1;
  const page = Math.max(1, Math.min(currentPage, totalPages));
  if (pageSize) {
    const start = (page - 1) * pageSize;
    sortedData = sortedData.slice(start, start + pageSize);
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

  // Build table body with selectable/onRowClick support
  const tbody = {
    t: 'tbody',
    c: sortedData.map((row, idx) => {
      const globalIdx = pageSize ? (page - 1) * pageSize + idx : idx;
      const rowAttrs = {};
      if (selectable || onRowClick) {
        rowAttrs.style = 'cursor:pointer;';
        rowAttrs.onclick = function(e) {
          if (selectable) {
            // Toggle selected class on this row
            var tr = e.currentTarget;
            tr.classList.toggle('bw_table_row_selected');
          }
          if (onRowClick) {
            onRowClick(row, globalIdx, e);
          }
        };
      }
      return {
        t: 'tr',
        a: rowAttrs,
        c: cols.map(col => ({
          t: 'td',
          c: col.render ? col.render(row[col.key], row) : String(row[col.key] || '')
        }))
      };
    })
  };

  const table = {
    t: 'table',
    a: { class: cls },
    c: [thead, tbody]
  };

  // If no pagination, return table directly
  if (!pageSize) return table;

  // Build pagination controls
  const pageButtons = [];
  // Previous button
  pageButtons.push({
    t: 'button',
    a: {
      class: 'bw_btn bw_btn_sm',
      disabled: page <= 1 ? 'disabled' : undefined,
      onclick: page > 1 && onPageChange ? function() { onPageChange(page - 1); } : undefined
    },
    c: 'Prev'
  });
  // Page info
  pageButtons.push({
    t: 'span',
    a: { style: 'margin:0 0.5rem;font-size:0.875rem;' },
    c: 'Page ' + page + ' of ' + totalPages
  });
  // Next button
  pageButtons.push({
    t: 'button',
    a: {
      class: 'bw_btn bw_btn_sm',
      disabled: page >= totalPages ? 'disabled' : undefined,
      onclick: page < totalPages && onPageChange ? function() { onPageChange(page + 1); } : undefined
    },
    c: 'Next'
  });

  return {
    t: 'div',
    a: { class: 'bw_table_paginated' },
    c: [
      table,
      {
        t: 'div',
        a: { class: 'bw_table_pagination', style: 'display:flex;align-items:center;justify-content:flex-end;padding:0.5rem 0;gap:0.25rem;' },
        c: pageButtons
      }
    ]
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
  
  // Generate unique UUID class if not provided
  const componentId = taco.o?.id || bw.uuid('uuid');
  
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
  
  // Add component ID as class + lifecycle marker
  domElement.classList.add(componentId);
  domElement.classList.add(_BW_LC);

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
      newElement.classList.add(componentId);
      newElement.classList.add(_BW_LC);
      
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

// Create functions that return DOM elements (createCard, createTable, etc.)
Object.entries(components).forEach(([name, fn]) => {
  if (name.startsWith('make')) {
    const createName = 'create' + name.substring(4);
    bw[createName] = function(props) {
      return bw.createDOM(fn(props));
    };
  }
});

// Export for different environments
export default bw;

// Also attach to global in browsers
if (bw._isBrowser && typeof window !== 'undefined') {
  window.bw = bw;
}