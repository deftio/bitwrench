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
         generateThemedCSS,
         DEFAULT_PALETTE_CONFIG, SPACING_PRESETS, RADIUS_PRESETS, THEME_PRESETS,
         TYPE_RATIO_PRESETS, ELEVATION_PRESETS, MOTION_PRESETS, generateTypeScale,
         resolveLayout, scopeRulesUnder } from './bitwrench-styles.js';
import { hexToHsl, hslToHex, adjustLightness, mixColor,
         relativeLuminance, textOnColor, deriveShades,
         derivePalette, harmonize, deriveAlternateSeed, deriveAlternateConfig,
         isLightPalette } from './bitwrench-color-utils.js';
import { colorParse as _colorParse, colorRgbToHsl as _colorRgbToHsl,
         colorHslToRgb as _colorHslToRgb, colorInterp as _colorInterp } from './bitwrench-color-utils.js';
import { bindFileOps } from './bitwrench-file-ops.js';
import { typeOf as _typeOf, mapScale as _mapScale, clip as _clip,
         choice as _choice, arrayUniq as _arrayUniq, arrayBinA as _arrayBinA,
         arrayBNotInA as _arrayBNotInA,
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
  _topics: {},          // topic → [{handler, id}]  (plain object for IE11 compat)
  _subIdCounter: 0,     // monotonic ID for subscriptions
  _detached: {},        // uuid → true for detach-exempt elements
  _mounted: {},         // uuid → true for elements that have fired mounted()

  // ── Node reference cache ──────────────────────────────────────────────
  // Fast O(1) lookup for elements by id attribute or bw_uuid_* class.
  //
  // Populated by bw.create() when elements have:
  //   - id attribute (standard HTML id)
  //   - bw_uuid_* class (lifecycle-managed or explicitly addressed elements)
  //
  // Cleaned up by bw.unmount() when elements are destroyed via bitwrench APIs.
  // On cache miss, falls back to querySelector/getElementById — never fails,
  // just slower. Stale entries (refs to detached nodes) are removed on miss
  // via parentNode === null check (IE11-safe, unlike el.isConnected).
  //
  // Elements created via bw.create() also get el._bw_refs — a local map of
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
// create, etc.).
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
// camelCase -> hyphenated CSS property name. Vendor-prefixed keys keep their
// leading dash (WebkitTransform -> -webkit-transform).
var _cssProp = function(k) {
  if (k.indexOf('--') === 0) return k;               // custom property, leave alone
  var out = k.replace(/[A-Z]/g, function(c) { return '-' + c.toLowerCase(); });
  return out;
};
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
  /* c8 ignore next 7 -- require() is not defined in ESM test environment */
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
      /* c8 ignore next -- mod.default always exists in Node.js ESM */
      bw._fsCache = mod.default || mod;
      return bw._fsCache;
    }).catch(function() {
      bw._fsCache = null;
      return null;
    });
  /* c8 ignore start -- Function() constructor never fails in test environments */
  } catch(e) {
    // Function() construction failed (shouldn't happen, but safety net)
    bw._fsCache = null;
    return Promise.resolve(null);
  }
  /* c8 ignore stop */
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
 * Look up a single DOM element by ID, CSS selector, UUID, or element ref.
 * Optionally apply content or a function to the resolved element.
 *
 * Resolution order for string targets:
 * 1. Check `bw._nodeMap[id]` cache (O(1), stale entries auto-pruned)
 * 2. `document.getElementById(id)`
 * 3. `document.querySelector(id)` for selectors starting with # or .
 * 4. Class-based lookup for `bw_uuid_*` tokens
 *
 * With one argument, returns the element (or null). With two arguments,
 * applies the second argument to the element and returns the element:
 * - string/number: sets `el.textContent`
 * - function: calls `apply(el)`, returns el
 * - TACO object: clears children, mounts TACO via `bw.create()`
 * - array: clears children, appends each item (string -> text node, TACO -> element)
 *
 * @param {string|Element} target - Element ref, ID, CSS selector, or bw_uuid_* class
 * @param {string|number|Function|Object|Array} [apply] - Content or function to apply
 * @returns {Element|null} The DOM element, or null if not found
 * @category DOM Selection
 * @see bw.$
 * @see bw.patch
 * @example
 * bw.el('#title')                         // lookup
 * bw.el('#title', 'Hello')                // set text content
 * bw.el('#app', { t: 'h1', c: 'Hi' })    // mount TACO
 * bw.el('.card', function(el) {           // apply function
 *   el.style.opacity = '0.5';
 * })
 */
bw.el = function(target, apply) {
  // Resolve target to element
  var el;
  if (!_is(target, 'string')) {
    el = target || null;
  } else if (!target || !bw._isBrowser) {
    el = null;
  } else {
    // 1. Check cache
    var cached = bw._nodeMap[target];
    if (cached) {
      // Detach-exempt elements survive the staleness check
      var cachedUuid = bw.getUUID(cached);
      if (cached.parentNode !== null || (cachedUuid && bw._detached[cachedUuid])) {
        el = cached;
        // Clear detach exemption on reconnect
        if (cachedUuid && bw._detached[cachedUuid] && cached.parentNode !== null) {
          delete bw._detached[cachedUuid];
        }
      } else {
        delete bw._nodeMap[target];
      }
    }
    if (!el) {
      // UUID strings are registry-only — never querySelector resurrection (§3.2)
      if (target.indexOf('bw_uuid_') === 0) {
        // Not in registry → null (no querySelector fallback)
        el = null;
      } else {
        // 2. getElementById
        el = document.getElementById(target);
        // 3. querySelector for CSS selectors
        if (!el && (target.charAt(0) === '#' || target.charAt(0) === '.')) {
          el = document.querySelector(target);
        }
        // 4. Cache result
        if (el) bw._nodeMap[target] = el;
      }
    }
  }

  // Apply (if provided and element found)
  if (el && apply !== undefined) _applyTo(el, apply);

  return el;
};

/**
 * Internal: apply content or function to a DOM element.
 * Shared by bw.el() and bw.$().
 * @private
 */
function _applyTo(el, apply) {
  if (_is(apply, 'function')) {
    apply(el);
  } else if (_isA(apply)) {
    bw.unmountChildren(el);
    el.innerHTML = '';
    apply.forEach(function(item) {
      if (item != null) {
        if (_is(item, 'object') && item.t) {
          el.appendChild(bw.create(item));
        } else {
          el.appendChild(document.createTextNode(String(item)));
        }
      }
    });
    bw.mountTree(el);
  } else if (_is(apply, 'object') && apply !== null && apply.t) {
    bw.unmountChildren(el);
    el.innerHTML = '';
    el.appendChild(bw.create(apply));
    bw.mountTree(el);
  } else {
    bw.unmountChildren(el);
    el.textContent = String(apply);
  }
}


/**
 * Register a DOM element in the node cache under one or more keys.
 *
 * Called internally by `bw.create()`. Registers elements that have
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
 * Called internally by `bw.unmount()` when elements are destroyed
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
 * Used by unmount() to find lifecycle-managed elements via querySelectorAll('.bw_lc').
 * @private
 */
var _BW_LC = 'bw_lc';

/**
 * Regex to match a bw_uuid_* token in a class string.
 * @private
 */
var _UUID_RE = /\bbw_uuid_[a-z0-9_]+\b/;

/**
 * SVG namespace URI for createElementNS.
 * @private
 */
var _SVG_NS = 'http://www.w3.org/2000/svg';

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
  // DOM element: check className (SVG elements use getAttribute for string value)
  if (tacoOrElement.className !== undefined && tacoOrElement.tagName) {
    classStr = typeof tacoOrElement.className === 'string'
      ? tacoOrElement.className : (tacoOrElement.getAttribute('class') || '');
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
  // Content escaping is the attribute set (_ATTR_ESCAPES, below) plus "/".
  // Written as that relationship rather than as a second table of the same
  // five entries: two hand-maintained copies of one mapping is how the
  // contexts drift apart, which is the bug this pair was split to fix.
  return str.replace(/[&<>"'/]/g, function(c) {
    return c === '/' ? '&#x2F;' : _ATTR_ESCAPES[c];
  });
};

// Escape a value for use inside a double-quoted attribute.
//
// Not the same job as bw.escapeHTML, which also escapes "/" -- an OWASP rule
// for element *content*, where it blunts a stray "</script". Inside an
// attribute value "/" is an ordinary character, so escaping it produced
// technically-valid but unreadable output: every href, src and action came out
// as https:&#x2F;&#x2F;example.com. Browsers decode it and the link works, which
// is why this survived so long -- but it is wrong for anything that diffs,
// greps or snapshots server-rendered HTML, wrong in a bwserve payload read by
// something that is not a browser, and actively confusing in a tutorial whose
// whole claim is "this is the HTML you would have written by hand".
//
// bw.create() was never affected: setAttribute takes the raw value and the DOM
// does its own serialisation. So, like the camelCase style bug, this only ever
// showed up in string output, where nothing complains.
//
// The character set is the one bw.htmlPage's favicon path already open-coded
// for exactly this reason. ' is kept even though the delimiter is always " --
// it costs nothing and keeps parity with that established behaviour.
var _ATTR_ESCAPES = {
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
};

var _escapeAttr = function(str) {
  if (!_is(str, 'string')) return '';
  return str.replace(/[&<>"']/g, function(c) { return _ATTR_ESCAPES[c]; });
};

// An attribute NAME is markup, not data, so no amount of escaping makes a bad
// one safe -- the space in "x onclick=alert(1) y" is itself what ends the name
// and starts the next attribute. setAttribute rejects these outright, so
// bw.create() has always been safe and only the string path would emit
//   {a: {'x onclick=alert(1) y': 'z'}}  ->  <div x onclick=alert(1) y="z">
// which is the same shape as the two bugs fixed above: wrong only in string
// output, where nothing complains.
//
// This is the HTML5 grammar's own exclusion set rather than an allowlist of
// name shapes: whitespace, quotes, / and = are the characters that can end the
// name and begin something else. An allowlist would also reject names that are
// merely unusual -- @click, x-on:click -- which serialise fine and are none of
// bitwrench's business.
var _ATTR_NAME_BAD = /[\s"'>/=]/;

/**
 * Mark a string as raw HTML so it will not be escaped by bw.html() or bw.create().
 *
 * By default, bitwrench escapes all text content to prevent XSS. Use bw.raw()
 * when you need to embed pre-sanitized HTML, entities, or inline markup.
 *
 * @param {string} str - HTML string to mark as raw
 * @returns {Object} Marked object recognized by bw.html() and bw.create()
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
 * @see bw.create
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
 * **Event handlers.** Give an `on*` attribute a function and it is registered
 * with `bw.funcRegister` automatically; the attribute becomes a
 * `bw.funcGetById('bw_fn_N')(event)` dispatch call. The string therefore
 * carries a working handler with no binding step — it fires as soon as the
 * HTML is in the document, however it got there, and still works after a
 * clone or re-insert. The registry holds a live reference, so closures and
 * bound functions are fine.
 *
 * Pass `options.fns` when the output must satisfy a strict CSP: handlers go
 * into that per-render object and the element gets a `bw_fn_N` class instead
 * of an inline attribute, leaving nothing executable in the markup. You bind
 * them yourself; `bw.htmlPage` takes this path and emits the binder.
 *
 * Note that auto-registered handlers persist in the global registry for the
 * life of the process — see `bw.funcUnregister`. This is not a concern
 * for live UI, which uses `bw.create` and attaches real listeners
 * without touching the registry.
 *
 * @param {Object|Array|string} taco - TACO object, array of TACOs, or string
 * @param {Object} [options] - Rendering options
 * @param {boolean} [options.raw=false] - If true, skip HTML escaping on content
 * @param {Object} [options.fns] - Per-render handler registry. When supplied,
 *   `on*` functions are collected here as `{id: {fn, event}}` and emitted as a
 *   `bw_fn_N` class rather than an inline attribute (CSP-safe). Omit it for
 *   the auto-registered dispatch-string form.
 * @returns {string} HTML string
 * @category DOM Generation
 * @see bw.create
 * @see bw.DOM
 * @see bw.htmlPage
 * @see bw.funcRegister
 * @example
 * bw.html({ t: 'h1', c: 'Hello' })
 * // => '<h1>Hello</h1>'
 *
 * bw.html({ t: 'div', a: { class: 'card' }, c: [
 *   { t: 'p', c: 'Content here' }
 * ]})
 * // => '<div class="card"><p>Content here</p></div>'
 *
 * // Handlers just work — nothing to wire up afterwards
 * bw.html({ t: 'button', a: { onclick: function() { alert('hi'); } }, c: 'Go' })
 * // => '<button onclick="bw.funcGetById(\'bw_fn_0\')(event)">Go</button>'
 *
 * // CSP-safe variant: no inline handler, you bind the class yourself
 * var fns = {};
 * bw.html({ t: 'button', a: { onclick: function() {} }, c: 'Go' }, { fns: fns })
 * // => '<button class="bw_fn_0">Go</button>'   fns = { bw_fn_0: {fn, event:'click'} }
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
  var fnMarkers = []; // bw_fn_* markers to add to class
  var fnsRegistry = options.fns || null;

  for (const [key, value] of Object.entries(attrs)) {
    // Skip null, undefined, false
    if (value == null || value === false) continue;

    // Drop names that cannot be serialised (see _ATTR_NAME_BAD). Dropping
    // rather than throwing keeps a page rendering, and the diag says which key
    // vanished -- bw.create() would have thrown on the same TACO, so anything
    // reaching here is already a bug in the caller's data.
    if (_ATTR_NAME_BAD.test(key)) {
      bw.pub('bw:diag', { code: 'attr_name_invalid', name: key });
      continue;
    }

    // Serialize event handlers
    if (key.startsWith('on')) {
      if (_is(value, 'function')) {
        if (fnsRegistry) {
          // Check for unserializable functions (bound, native)
          var fnStr = '';
          try { fnStr = value.toString(); } catch(e) {}
          if (fnStr.indexOf('[native code]') !== -1) {
            if (!options._fnUnserializableWarned) {
              bw.pub('bw:diag', { code: 'fn_unserializable', msg: 'bound/native function cannot be serialized' });
              options._fnUnserializableWarned = true;
            }
            continue;
          }
          // Register function in per-render registry
          var eventName = key.substring(2);
          var fnId = null;
          // Dedupe by reference + event type
          var fnKeys = _keys(fnsRegistry);
          for (var fi = 0; fi < fnKeys.length; fi++) {
            if (fnsRegistry[fnKeys[fi]].fn === value && fnsRegistry[fnKeys[fi]].event === eventName) {
              fnId = fnKeys[fi]; break;
            }
          }
          if (!fnId) {
            fnId = 'bw_fn_' + (options._fnCounter || 0);
            options._fnCounter = (options._fnCounter || 0) + 1;
            fnsRegistry[fnId] = { fn: value, event: eventName };
          }
          fnMarkers.push(fnId);
          // No inline on* attribute emitted
        } else {
          // No {fns} registry → auto-register and emit a dispatch string.
          //
          // This is the 1.x/2.0 behaviour. bw.html(taco) has to just work:
          // hand it a function and you get HTML whose handler fires, with no
          // binding pass to remember. v2.1.0 replaced this with a silent drop
          // unless the caller passed {fns}, which quietly broke every bare
          // bw.html() carrying a handler. 1.x had already settled this question
          // the other way -- it auto-registered by default and offered
          // o.atrOnEventRegister:false as the opt-out.
          //
          // The dispatch string also survives things the {fns} class-marker
          // cannot: it works the moment the HTML lands in the DOM, however it
          // got there, and keeps working after a clone or a re-insert, because
          // there is no separate binding step to re-run. It holds a live
          // reference too, so bound and native functions work here even though
          // {fns} has to reject them.
          //
          // fnId is always 'bw_fn_N' from funcRegister, so it needs no escaping.
          var autoId = bw.funcRegister(value);
          attrStr += ' ' + key + '="' + bw.funcGetDispatchStr(autoId, 'event') + '"';
        }
        continue;
      } else if (_is(value, 'string')) {
        attrStr += ' ' + key + '="' + _escapeAttr(value) + '"';
      }
      continue;
    }

    if (key === 'style' && _is(value, 'object')) {
      // Property names must be hyphenated inside a style attribute. The DOM
      // path gets this free (el.style.paddingLeft is valid JS), but the string
      // path used the key verbatim and emitted style="paddingLeft:1rem", which
      // browsers ignore -- so server-rendered pages silently lost their styles.
      const styleStr = Object.entries(value)
        .filter(([, v]) => v != null)
        .map(([k, v]) => `${_cssProp(k)}:${v}`)
        .join(';');
      if (styleStr) {
        attrStr += ` style="${_escapeAttr(styleStr)}"`;
      }
    } else if (key === 'class') {
      // Handled below with identity stamps
      continue;
    } else if (value === true) {
      attrStr += ` ${key}`;
    } else {
      let resolvedVal = String(value);
      if (options.state && resolvedVal.indexOf('${') >= 0) {
        resolvedVal = bw._resolveTemplate(resolvedVal, options.state, !!options.compile);
      }
      attrStr += ` ${key}="${_escapeAttr(resolvedVal)}"`;
    }
  }

  // Build class attribute: user classes + identity stamps + fn markers
  var classTokens = [];
  var userClass = attrs.class || '';
  if (_isA(userClass)) userClass = userClass.filter(Boolean).join(' ');
  if (userClass) classTokens.push(String(userClass));

  // Add identity stamps for o.* elements
  var hasOpts = opts && (opts.type || opts.state || opts.mounted || opts.unmount || opts.handle || opts.render || opts.slots);
  if (hasOpts && !_UUID_RE.test(userClass)) {
    var uuid = bw.uuid('uuid');
    classTokens.push(uuid);
    classTokens.push(_BW_LC);
    classTokens.push('bw_is_component');
    if (opts.type) classTokens.push('bw_is_component_' + opts.type);
  }

  // Add fn marker classes
  for (var fmi = 0; fmi < fnMarkers.length; fmi++) {
    classTokens.push(fnMarkers[fmi]);
  }

  if (classTokens.length > 0) {
    attrStr += ' class="' + _escapeAttr(classTokens.join(' ')) + '"';
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

  var useHandlers = opts.handlers !== false;

  // Per-render function registry
  var fns = useHandlers ? {} : null;

  // Render body content
  var bodyHTML;
  if (_is(body, 'string')) {
    bodyHTML = body;
  } else {
    var htmlOpts = { _fnCounter: 0 };
    if (state) htmlOpts.state = state;
    if (fns) htmlOpts.fns = fns;
    bodyHTML = bw.html(body, htmlOpts);
  }

  // Build registry entries from per-render fns
  var registryEntries = '';
  if (fns) {
    var fnKeys = _keys(fns);
    for (var i = 0; i < fnKeys.length; i++) {
      var fnEntry = fns[fnKeys[i]];
      registryEntries += 'r[\'' + fnKeys[i] + '\']={fn:' +
        fnEntry.fn.toString() + ',event:\'' + fnEntry.event + '\'};\n';
    }
  }

  // Build runtime script for <head>
  var runtimeHead = '';
  if (runtime === 'inline') {
    // Read UMD bundle synchronously if in Node.js
    var umdSource = null;
    /* c8 ignore start -- htmlPage inline runtime: require('fs')/require('path')/__filename only available in CJS builds, not ESM test runner */
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
    /* c8 ignore stop */
    /* c8 ignore next 4 -- umdSource path depends on CJS fs.readFileSync */
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
    var safeFavicon = _escapeAttr(favicon);
    faviconTag = '<link rel="icon" href="' + safeFavicon + '">';
  }

  // Escaped title. <title> is RCDATA -- entities decode, so escapeHTML's "/"
  // rule was never doing anything here except putting Docs&#x2F;Guide in the
  // source of a file whose whole point is being readable. The attribute set is
  // both sufficient (& and < are the two that matter) and quieter.
  var safeTitle = _escapeAttr(title);

  // Combine all CSS
  var allCSS = (themeCSS ? themeCSS + '\n' : '') + css;

  // CSP nonce
  var nonce = (bw.config && bw.config.cspNonce) ? bw.config.cspNonce : null;
  var nonceAttr = nonce ? ' nonce="' + _escapeAttr(nonce) + '"' : '';

  // Body-end script: binder for registered functions
  var bodyEndScript = '';
  var bodyEndParts = [];
  if (registryEntries) {
    // Emit binder: iterate registered functions, find elements by bw_fn_* class,
    // bind event listeners. Wrap in try/catch with bw_act guidance.
    bodyEndParts.push('(function(){var r={};');
    bodyEndParts.push(registryEntries);
    bodyEndParts.push('for(var k in r){if(r.hasOwnProperty(k)){');
    bodyEndParts.push('var els=document.querySelectorAll("."+k);');
    bodyEndParts.push('for(var i=0;i<els.length;i++){');
    bodyEndParts.push('(function(el,entry){el.addEventListener(entry.event,function(event){');
    bodyEndParts.push('try{entry.fn.call(el,event);}catch(e){');
    bodyEndParts.push('console.error("bw_act handler error — if this is a ReferenceError from a closure, use bw_act_* class tokens instead:",e);}');
    bodyEndParts.push('});})(els[i],r[k]);}}}})();');
  }
  if (runtime === 'inline' || runtime === 'cdn') {
    bodyEndParts.push('if(typeof bw!=="undefined"){bw.loadStyles();}');
  }
  if (bodyEndParts.length > 0) {
    bodyEndScript = '<script' + nonceAttr + '>\n' + bodyEndParts.join('\n') + '\n</script>';
  }

  // Assemble document
  var parts = [
    '<!DOCTYPE html>',
    '<html lang="' + _escapeAttr(lang) + '">',
    '<head>',
    '<meta charset="UTF-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">'
  ];
  parts.push('<title>' + safeTitle + '</title>');
  if (faviconTag) parts.push(faviconTag);
  if (runtimeHead) {
    // Add nonce to runtime script tags
    if (nonce) runtimeHead = runtimeHead.replace(/<script(?![^>]*\bnonce\b)/g, '<script' + nonceAttr);
    parts.push(runtimeHead);
  }
  if (headHTML) parts.push(headHTML);
  if (allCSS) parts.push('<style' + nonceAttr + '>' + allCSS + '</style>');
  parts.push('</head>');
  parts.push('<body>');
  parts.push(bodyHTML);
  if (bodyEndScript) parts.push(bodyEndScript);
  parts.push('</body>');
  parts.push('</html>');

  return parts.join('\n');
};

/**
 * Create a hydrated, detached DOM element from a TACO object (browser only).
 *
 * v2.1 Phase verb: the element is fully wired (state, handles, slots, events,
 * unmount closure) but NOT registered and mounted() is NOT fired. Registration
 * happens in mountTree(); mounted fires there too.
 *
 * @param {Object} taco - TACO object with {t, a, c, o}
 * @param {Object} [options] - Creation options
 * @returns {Element|Text|DocumentFragment} DOM element, text node, or fragment
 * @category DOM Generation
 * @see bw.mount
 * @see bw.mountTree
 */
bw.create = function(taco, options) {
  if (!bw._isBrowser) {
    throw new Error('bw.create requires a DOM environment (document/window). Use bw.html() instead.');
  }
  return _createNode(taco, options || {});
};

/**
 * Internal: recursively build DOM from TACO. Separated so spy on bw.create
 * sees only the top-level call, not the recursive child builds.
 * @private
 */
function _createNode(taco, options) {
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

  // Handle text nodes (primitives)
  if (!_is(taco, 'object') || !taco.t) {
    return document.createTextNode(String(taco));
  }

  // Read attrs from taco without mutating the original
  var tag = taco.t;
  var attrs = taco.a || {};
  var content = taco.c;
  var opts = taco.o || {};

  // SVG namespace: detect SVG context and thread through children.
  var svgCtx = options._svgCtx || (tag === 'svg');
  var el = svgCtx ? document.createElementNS(_SVG_NS, tag) : document.createElement(tag);

  // Set attributes — never mutate taco.a, read from it
  var attrKeys = _keys(attrs);
  for (var ai = 0; ai < attrKeys.length; ai++) {
    var key = attrKeys[ai];
    var value = attrs[key];
    if (value == null || value === false) continue;

    if (key === 'style' && _is(value, 'object')) {
      Object.assign(el.style, value);
    } else if (key === 'class') {
      var classStr = _isA(value) ? value.filter(Boolean).join(' ') : String(value);
      if (classStr) {
        if (svgCtx) el.setAttribute('class', classStr);
        else el.className = classStr;
      }
    } else if (key.indexOf('on') === 0 && key.length > 2 && _is(value, 'function')) {
      var eventName = key.slice(2).toLowerCase();
      el.addEventListener(eventName, value);
    } else if (key === 'value' && tag === 'input') {
      el.value = value;
    } else if (value === true) {
      el.setAttribute(key, '');
    } else {
      el.setAttribute(key, String(value));
    }
  }

  // Add children, building _bw_refs for fast parent→child access.
  var childOpts = options;
  var childSvgCtx = svgCtx && tag !== 'foreignObject';
  if (childSvgCtx !== (options._svgCtx || false)) {
    childOpts = Object.assign({}, options, {_svgCtx: childSvgCtx || undefined});
  }
  if (content != null) {
    if (_isA(content)) {
      for (var ci = 0; ci < content.length; ci++) {
        var child = content[ci];
        if (child != null) {
          var childEl = _createNode(child, childOpts);
          el.appendChild(childEl);
          var childRefId = (child && child.a) ? (child.a.id || bw.getUUID(child)) : null;
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
        }
      }
    } else if (_is(content, 'object') && content.__bw_raw) {
      el.innerHTML = content.v;
    } else if (_is(content, 'object') && content.t) {
      var childEl2 = _createNode(content, childOpts);
      el.appendChild(childEl2);
      var childRefId2 = content.a ? (content.a.id || bw.getUUID(content)) : null;
      if (childRefId2) {
        if (!el._bw_refs) el._bw_refs = {};
        el._bw_refs[childRefId2] = childEl2;
      }
      if (childEl2._bw_refs) {
        if (!el._bw_refs) el._bw_refs = {};
        for (var rk2 in childEl2._bw_refs) {
          if (_hop.call(childEl2._bw_refs, rk2)) {
            el._bw_refs[rk2] = childEl2._bw_refs[rk2];
          }
        }
      }
    } else {
      el.textContent = String(content);
    }
  }

  // ── Hydrate: wire o.* onto the element ──
  // No registration, no mounted(), no rAF. That's mountTree's job.
  _hydrateElement(el, opts);

  return el;
}

// v2.1: bw.createDOM, bw.renderComponent, bw.compileProps fully removed.

/**
 * Internal: wire a TACO's o.* options onto an existing DOM element.
 * Used by both bw.create (inline) and bw.hydrate (standalone).
 * Idempotent: if el already has bw handle, skip.
 * @private
 */
function _hydrateElement(el, opts) {
  if (!opts || typeof opts !== 'object') return;

  // Check for any o.* key that makes this a component
  var hasLifecycle = opts.mounted || opts.unmount || opts.render || opts.state
    || opts.handle || opts.slots || opts.type;
  if (!hasLifecycle) return;

  // Idempotency: if el.bw already exists, skip (re-hydrate is no-op)
  if (el.bw) return;

  // Store component type
  if (opts.type) {
    el._bw_type = opts.type;
  }

  // Stamp UUID on the element (not on the input TACO)
  var uuid = bw.getUUID(el) || bw.uuid('uuid');
  if (!el.classList.contains(uuid)) el.classList.add(uuid);

  // Component markers
  el.classList.add(_BW_LC);
  el.classList.add('bw_is_component');
  if (opts.type) {
    el.classList.add('bw_is_component_' + opts.type);
  }

  // Store state (clone so TACO isn't retained)
  if (opts.state) {
    el._bw_state = opts.state;
  }

  // Store render function
  if (opts.render) {
    el._bw_render = opts.render;
  }

  // Store mounted function on element (fired later by mountTree)
  if (opts.mounted) {
    el._bw_mounted_fn = opts.mounted;
  } else if (opts.render && !opts.mounted) {
    // Auto-mount: if render exists but no mounted, auto-call render at mount
    el._bw_mounted_fn = function(mountEl, state) {
      opts.render(mountEl, state);
    };
  }

  // Store unmount closure on the element itself (not in a global Map)
  if (opts.unmount) {
    el._bw_unmount_fn = opts.unmount;
  }

  // Component handle: attach methods to el.bw namespace
  if (!el.bw) el.bw = {};

  // Auto-generate getState()
  el.bw.getState = function() {
    return Object.assign({}, el._bw_state || {});
  };

  // Explicit handle methods: fn(el, ...args) -> el.bw.method(...args)
  if (opts.handle) {
    for (var hk in opts.handle) {
      if (_hop.call(opts.handle, hk)) {
        el.bw[hk] = opts.handle[hk].bind(null, el);
      }
    }
  }

  // Slot declarations: lazy-cached on first use, refresh invalidates cache
  if (opts.slots) {
    el._bw_slots = opts.slots;
    el._bw_slot_cache = null; // lazy
    for (var sk in opts.slots) {
      if (_hop.call(opts.slots, sk)) {
        (function(name, selector) {
          var cap = name.charAt(0).toUpperCase() + name.slice(1);
          el.bw['set' + cap] = function(value) {
            if (!el._bw_slot_cache) el._bw_slot_cache = {};
            if (!el._bw_slot_cache[name]) {
              el._bw_slot_cache[name] = el.querySelector(selector);
            }
            var target = el._bw_slot_cache[name];
            if (!target) return;
            // Always unmount existing children before replacing
            bw.unmountChildren(target);
            if (value != null && typeof value === 'object' && value.t) {
              // TACO through slots runs mount pipeline
              target.innerHTML = '';
              var child = bw.create(value);
              target.appendChild(child);
              if (el.isConnected) bw.mountTree(child);
            } else {
              target.textContent = (value != null) ? String(value) : '';
            }
          };
          el.bw['get' + cap] = function() {
            if (!el._bw_slot_cache) el._bw_slot_cache = {};
            if (!el._bw_slot_cache[name]) {
              el._bw_slot_cache[name] = el.querySelector(selector);
            }
            var target = el._bw_slot_cache[name];
            return target ? target.textContent : '';
          };
        })(sk, opts.slots[sk]);
      }
    }
  }
}

/**
 * Wire lifecycle from taco.o onto an existing DOM node. Idempotent.
 * Used for Path S adoption: html() output → mountTree → hydrate adds behavior.
 *
 * @param {Element} el - Existing DOM element
 * @param {Object} taco - TACO object whose o.* to wire
 * @category DOM Generation
 */
bw.hydrate = function(el, taco) {
  if (!el || !taco) return;
  var opts = taco.o || {};
  _hydrateElement(el, opts);
};

/**
 * Walk a subtree, register every addressable node, fire mounted() hooks.
 * Idempotent: already-registered nodes (same element) are skipped silently.
 *
 * Mounted fires synchronously, parent before children.
 *
 * @param {Element} el - Root of subtree to mount
 * @category DOM Generation
 */
bw.mountTree = function(el) {
  if (!el || el.nodeType !== 1) return;

  // Lazy-install janitor observer on first mount
  if (bw.janitor && bw.janitor._ensureObserver) bw.janitor._ensureObserver();
  // Lazy-install action dispatcher if enabled (handles document changes in test envs)
  if (bw.actions && bw.actions._ensureInstalled) bw.actions._ensureInstalled();

  // Process this node
  _mountNode(el);

  // Process descendants in document order (parent-first = querySelectorAll order)
  var descendants = el.querySelectorAll('*');
  for (var i = 0; i < descendants.length; i++) {
    _mountNode(descendants[i]);
  }
};

/**
 * Internal: mount a single node — register and fire mounted if needed.
 * @private
 */
function _mountNode(el) {
  /* c8 ignore next -- _mountNode only called with valid elements from mountTree */
  if (!el || el.nodeType !== 1) return;

  var uuid = bw.getUUID(el);
  if (!uuid) {
    // Still register by id if present
    /* c8 ignore next -- all DOM elements in test env have getAttribute */
    var htmlId = el.getAttribute ? el.getAttribute('id') : null;
    if (htmlId) bw._nodeMap[htmlId] = el;
    return;
  }

  // Idempotent: if already registered to this same element, skip entirely
  if (bw._nodeMap[uuid] === el && bw._mounted[uuid]) return;

  // Collision detection: UUID already registered to a DIFFERENT element
  if (bw._nodeMap[uuid] && bw._nodeMap[uuid] !== el) {
    // Remint: generate a new UUID for this element
    var oldUuid = uuid;
    var newUuid = bw.uuid('uuid');
    // Replace on element
    el.classList.remove(oldUuid);
    el.classList.add(newUuid);
    uuid = newUuid;
    // Re-key parent's _bw_refs if applicable
    if (el.parentNode && el.parentNode._bw_refs) {
      if (el.parentNode._bw_refs[oldUuid] === el) {
        delete el.parentNode._bw_refs[oldUuid];
        el.parentNode._bw_refs[newUuid] = el;
      }
    }
    bw.pub('bw:diag', { code: 'uuid_collision', uuid: oldUuid, ref: newUuid,
      msg: 'UUID collision detected; reminted to ' + newUuid });
  }

  // Register UUID
  bw._nodeMap[uuid] = el;

  // Register id attribute
  /* c8 ignore next -- all DOM elements in test env have getAttribute */
  htmlId = el.getAttribute ? el.getAttribute('id') : null;
  if (htmlId) {
    bw._nodeMap[htmlId] = el;
  }

  // Clear detach exemption on reconnect
  if (bw._detached[uuid]) {
    delete bw._detached[uuid];
  }

  // Fire mounted() — only for lifecycle components, only once per identity
  if (el.classList.contains(_BW_LC) && !bw._mounted[uuid]) {
    bw._mounted[uuid] = true;

    if (el._bw_mounted_fn) {
      try { el._bw_mounted_fn(el, el._bw_state || {}); }
      catch (e) {
        _cw('o.mounted error: ' + e.message);
        bw.pub('bw:diag', { code: 'mounted_hook_error', uuid: uuid, msg: e.message });
      }
    }

    // Emit bw:mount CustomEvent (bubbles)
    try {
      el.dispatchEvent(new CustomEvent('bw:mount', {
        bubbles: true,
        detail: { uuid: uuid, type: el._bw_type || null }
      }));
    } catch (e) { /* jsdom edge case */ }

    // Mirror to bw:lifecycle pub/sub
    bw.pub('bw:lifecycle', { event: 'mount', uuid: uuid, type: el._bw_type || null });
  }
}

/**
 * Unmount an element and its entire subtree. Fire unmount hooks self-first,
 * then descendants in document order. Strip ALL bitwrench properties.
 * Deregister from _nodeMap.
 *
 * @param {Element} el - Element to unmount
 * @category DOM Generation
 */
bw.unmount = function(el) {
  if (!el || el.nodeType !== 1) return;

  // Collect all addressable nodes: self + descendants in document order
  var nodes = [el];
  var desc = el.querySelectorAll('.' + _BW_LC + ', [class*="bw_uuid_"], [id]');
  for (var i = 0; i < desc.length; i++) {
    nodes.push(desc[i]);
  }

  // Fire unmount hooks and strip, self-first
  for (var n = 0; n < nodes.length; n++) {
    _unmountNode(nodes[n]);
  }
};

/**
 * Internal: unmount a single node — fire hook, strip everything, deregister.
 * @private
 */
function _unmountNode(el) {
  /* c8 ignore next -- _unmountNode only called with valid elements */
  if (!el || el.nodeType !== 1) return;

  var uuid = bw.getUUID(el);
  /* c8 ignore next -- all DOM elements in test env have getAttribute */
  var htmlId = el.getAttribute ? el.getAttribute('id') : null;

  // If element has neither uuid nor id nor lifecycle, nothing to do
  if (!uuid && !htmlId && !el.classList.contains(_BW_LC)) return;

  // Emit bw:unmount BEFORE stripping (so listeners can read state)
  if (uuid && el.classList.contains(_BW_LC)) {
    try {
      el.dispatchEvent(new CustomEvent('bw:unmount', {
        bubbles: true,
        detail: { uuid: uuid, type: el._bw_type || null }
      }));
    } catch (e) { /* jsdom edge case */ }
  }

  // Fire unmount closure
  if (el._bw_unmount_fn) {
    try { el._bw_unmount_fn(el, el._bw_state || {}); }
    catch (e) {
      _cw('o.unmount error: ' + e.message);
      bw.pub('bw:diag', { code: 'unmount_hook_error', uuid: uuid, msg: e.message });
    }
  }

  // Clean up pub/sub subscriptions tied to this element
  if (el._bw_subs) {
    for (var si = 0; si < el._bw_subs.length; si++) {
      try { el._bw_subs[si](); } catch (e) {}
    }
    delete el._bw_subs;
  }

  // Deregister from node cache — remove all entries pointing to this element
  // (covers uuid, id, and selector-based cache entries like "#foo")
  for (var nk in bw._nodeMap) {
    if (_hop.call(bw._nodeMap, nk) && bw._nodeMap[nk] === el) {
      delete bw._nodeMap[nk];
    }
  }
  if (uuid) {
    delete bw._mounted[uuid];
    delete bw._detached[uuid];
  }

  // Strip ALL bitwrench properties
  delete el.bw;
  delete el._bw_state;
  delete el._bw_render;
  delete el._bw_refs;
  delete el._bw_type;
  delete el._bw_unmount_fn;
  delete el._bw_mounted_fn;
  delete el._bw_slots;
  delete el._bw_slot_cache;

  // Strip marker classes and uuid tokens
  if (el.classList) {
    el.classList.remove(_BW_LC);
    el.classList.remove('bw_is_component');
    // Remove typed marker
    var cls = el.className;
    if (typeof cls === 'string') {
      var classes = cls.split(/\s+/);
      for (var ci = 0; ci < classes.length; ci++) {
        if (classes[ci].indexOf('bw_is_component_') === 0 ||
            classes[ci].indexOf('bw_uuid_') === 0) {
          el.classList.remove(classes[ci]);
        }
      }
    }
  }
}

/**
 * Unmount descendants only; the element's own state/subs/registration are untouched.
 *
 * @param {Element} el - Parent element whose children to unmount
 * @category DOM Generation
 */
bw.unmountChildren = function(el) {
  if (!el || el.nodeType !== 1) return;

  // Find all direct and nested lifecycle/addressable nodes inside children
  var childNodes = el.querySelectorAll('.' + _BW_LC + ', [class*="bw_uuid_"], [id]');
  for (var i = 0; i < childNodes.length; i++) {
    _unmountNode(childNodes[i]);
  }
};

/**
 * Remove an element from the DOM and clean it up. Convenience compound:
 * unmount(el) + el.remove().
 *
 * @param {string|Element} ref - Element reference
 * @category DOM Generation
 */
bw.remove = function(ref) {
  var el = bw.el(ref);
  if (!el) return;
  bw.unmount(el);
  if (el.parentNode) el.parentNode.removeChild(el);
};

/**
 * Detach an element from the DOM but keep it registered (keep-alive).
 * The element stays addressable and its subscriptions keep delivering.
 * Janitor will not reap detach-exempt elements.
 *
 * @param {Element} el - Element to detach
 * @category DOM Generation
 */
bw.detach = function(el) {
  if (!el) return;
  var uuid = bw.getUUID(el);
  if (uuid) {
    bw._detached[uuid] = true;
  }
  if (el.parentNode) el.parentNode.removeChild(el);
};

// v2.1: bw.cleanup fully removed.

/**
 * Janitor: document-level cleanup for ungraceful teardown.
 * Detects rude el.remove() / innerHTML='' and fires full unmount.
 *
 * flush() = synchronous process all pending disconnected nodes.
 * enable()/disable() toggle monitoring. ON by default.
 */
bw.janitor = (function() {
  var _pending = [];        // elements pending liveness check
  var _enabled = true;
  var _reapedList = [];     // recently reaped elements for tripwire check
  var _observer = null;
  var _flushScheduled = false;

  function _scheduleFlush() {
    if (_flushScheduled) return;
    _flushScheduled = true;
    // In jsdom, MutationObserver callbacks fire synchronously during DOM
    // mutation. We use Promise.resolve() to defer flush to a microtask,
    // giving same-stack moves time to complete (same-task appendChild
    // after remove = move, not removal). The flush runs as a microtask
    // which fires before setTimeout callbacks.
    Promise.resolve().then(_doFlush);
  }

  function _doFlush() {
    _flushScheduled = false;
    _processPending();
  }

  // Install MutationObserver if available (detects rude removals)
  function _installObserver() {
    if (!bw._isBrowser || typeof MutationObserver === 'undefined') return;
    /* c8 ignore start -- observer body: MutationObserver callbacks are async and not triggered in synchronous tests */
    if (_observer) return;
    try {
      _observer = new MutationObserver(function(mutations) {
        if (!_enabled) return;
        var removedSet = [];
        var addedSet = [];
        // Collect all removals and additions in this batch
        for (var m = 0; m < mutations.length; m++) {
          var mut = mutations[m];
          for (var r = 0; r < mut.removedNodes.length; r++) {
            var rn = mut.removedNodes[r];
            if (rn.nodeType === 1) removedSet.push(rn);
          }
          for (var a = 0; a < mut.addedNodes.length; a++) {
            var an = mut.addedNodes[a];
            if (an.nodeType === 1) addedSet.push(an);
          }
        }
        // Same-stack moves: if a node appears in both removed and added,
        // it's a move (not a removal). Don't add to pending.
        var found = false;
        for (var i = 0; i < removedSet.length; i++) {
          var node = removedSet[i];
          if (addedSet.indexOf(node) !== -1) continue; // same-stack move
          var uuid = bw.getUUID(node);
          if (uuid && bw._nodeMap[uuid]) {
            if (_pending.indexOf(node) === -1) _pending.push(node);
            found = true;
          }
          if (node.querySelectorAll) {
            var desc = node.querySelectorAll('.' + _BW_LC + ', [class*="bw_uuid_"]');
            for (var d = 0; d < desc.length; d++) {
              if (addedSet.indexOf(desc[d]) === -1 && _pending.indexOf(desc[d]) === -1) {
                _pending.push(desc[d]);
                found = true;
              }
            }
          }
        }
        if (found) _scheduleFlush();
      });
      _observer.observe(document.body, { childList: true, subtree: true });
    } catch (e) { /* observer setup failed */ }
    /* c8 ignore stop */
  }

  // Try to install immediately; re-install when DOM becomes available
  if (bw._isBrowser && typeof document !== 'undefined' && document.body) {
    _installObserver();
  }

  function _processPending() {
    // Take snapshot from observer-reported removals and clear
    var batch = _pending.splice(0);
    var observerCount = batch.length; // items from observer are confirmed removals

    // Also scan entire registry for disconnected nodes (fallback for non-observer removals)
    for (var key in bw._nodeMap) {
      if (_hop.call(bw._nodeMap, key)) {
        var el = bw._nodeMap[key];
        if (el && el.nodeType === 1 && !el.isConnected) {
          if (batch.indexOf(el) === -1) batch.push(el);
        }
      }
    }

    // Clear detach exemptions for reconnected elements
    for (var uuid in bw._detached) {
      if (_hop.call(bw._detached, uuid)) {
        var detEl = bw._nodeMap[uuid];
        if (detEl && detEl.isConnected) {
          delete bw._detached[uuid];
        }
      }
    }

    // Check for reaped-reinserted tripwire — check if any recently reaped elements are back in DOM
    var nextReaped = [];
    for (var ri = 0; ri < _reapedList.length; ri++) {
      var rEl = _reapedList[ri];
      if (rEl.isConnected) {
        bw.pub('bw:diag', { code: 'reaped_reinserted',
          msg: 'a reaped element was reinserted — use bw.detach() for keep-alive' });
        // Don't carry forward — warn once
      } else {
        nextReaped.push(rEl);  // keep tracking for next flush
      }
    }
    _reapedList = nextReaped;

    // Process elements. Elements from _pending (MutationObserver) are confirmed
    // removals that weren't same-stack moves — reap them even if reconnected
    // (async reinsert without bw.detach). Elements from registry scan only
    // reap if still disconnected.
    for (var i = 0; i < batch.length; i++) {
      var node = batch[i];
      var fromObserver = batch.indexOf(node) < observerCount;
      /* c8 ignore next -- registry-scan reconnected nodes only occur with async observer batching */
      if (!fromObserver && node.isConnected) continue; // registry-scan hit: still alive

      var nodeUuid = bw.getUUID(node);
      if (nodeUuid && bw._detached[nodeUuid]) continue; // exempt

      // Check if this is a lifecycle component or plain addressable node
      var isComponent = node.classList && node.classList.contains(_BW_LC);
      var isAddressable = nodeUuid && bw._nodeMap[nodeUuid] === node;

      if (isComponent) {
        // Capture type before unmount strips it
        var nodeType = node._bw_type || null;
        // Full unmount for components
        bw.unmount(node);
        _reapedList.push(node);
        // Emit lifecycle mirror (DOM events can't bubble from detached tree)
        bw.pub('bw:lifecycle', { event: 'unmount', uuid: nodeUuid, type: nodeType });
        bw.pub('bw:diag', { code: 'janitor_reap', uuid: nodeUuid });
      } else if (isAddressable) {
        // Deregister plain addressable node
        _unmountNode(node);
        _reapedList.push(node);
        bw.pub('bw:diag', { code: 'janitor_reap', uuid: nodeUuid });
      }

      // Also check for lifecycle children inside this node
      /* c8 ignore start -- janitor children iteration: parent unmount already covers descendants */
      if (node.querySelectorAll) {
        var children = node.querySelectorAll('.' + _BW_LC + ', [class*="bw_uuid_"]');
        for (var ci = 0; ci < children.length; ci++) {
          var child = children[ci];
          var childUuid = bw.getUUID(child);
          if (childUuid && bw._nodeMap[childUuid] === child) {
            if (child.classList.contains(_BW_LC)) {
              bw.unmount(child);
              if (_reapedList) _reapedList.push(child);
              bw.pub('bw:diag', { code: 'janitor_reap', uuid: childUuid });
            } else {
              _unmountNode(child);
              bw.pub('bw:diag', { code: 'janitor_reap', uuid: childUuid });
            }
          }
        }
      }
      /* c8 ignore stop */
    }
  }

  return {
    flush: function() {
      _flushScheduled = false;
      // Lazy-install observer on first flush
      if (!_observer && bw._isBrowser && typeof document !== 'undefined' && document.body) {
        _installObserver();
      }
      _processPending();
    },
    enable: function() { _enabled = true; },
    disable: function() { _enabled = false; },
    _addPending: function(el) {
      if (_pending.indexOf(el) === -1) _pending.push(el);
    },
    _ensureObserver: function() {
      if (!_observer && bw._isBrowser && typeof document !== 'undefined' && document.body) {
        _installObserver();
      }
    },
    _reset: function() {
      _pending.length = 0;
      _reapedList.length = 0;
      _flushScheduled = false;
      _enabled = true;
      /* c8 ignore start -- observer not installed in jsdom test env */
      if (_observer) {
        _observer.disconnect();
        _observer = null;
      }
      /* c8 ignore stop */
    },
    _getPendingCount: function() {
      // Count pending plus any disconnected registry entries
      var count = _pending.length;
      for (var key in bw._nodeMap) {
        if (_hop.call(bw._nodeMap, key)) {
          var el = bw._nodeMap[key];
          if (el && el.nodeType === 1 && !el.isConnected) {
            var uuid = bw.getUUID(el);
            if (!uuid || !bw._detached[uuid]) count++;
          }
        }
      }
      return count;
    }
  };
})();

/**
 * Debug introspection for tests. Returns counts of internal state.
 * @returns {Object} {registered, detached, janitorPending, topics}
 * @category Internal
 */
bw._debug = function() {
  var regCount = 0;
  for (var k in bw._nodeMap) {
    if (_hop.call(bw._nodeMap, k)) regCount++;
  }
  var detCount = 0;
  for (var d in bw._detached) {
    if (_hop.call(bw._detached, d)) detCount++;
  }
  return {
    registered: regCount,
    detached: detCount,
    janitorPending: bw.janitor._getPendingCount(),
    topics: _keys(bw._topics).length
  };
};

/**
 * Hard reset all singleton state for test isolation.
 * @category Internal
 */
bw._resetForTest = function() {
  // Clear node registry
  for (var k in bw._nodeMap) {
    if (_hop.call(bw._nodeMap, k)) delete bw._nodeMap[k];
  }
  // Clear topics
  for (var t in bw._topics) {
    if (_hop.call(bw._topics, t)) delete bw._topics[t];
  }
  // Clear detached set
  for (var d in bw._detached) {
    if (_hop.call(bw._detached, d)) delete bw._detached[d];
  }
  // Clear mounted set
  for (var m in bw._mounted) {
    if (_hop.call(bw._mounted, m)) delete bw._mounted[m];
  }
  bw._subIdCounter = 0;
  bw._idCounter = 0;
  // Reset janitor
  if (bw.janitor) {
    if (typeof bw.janitor._reset === 'function') bw.janitor._reset();
  }
  // Reset actions — clear installed state, keep enabled (actions are ON by default)
  if (bw.actions) {
    if (typeof bw.actions._reset === 'function') bw.actions._reset();
    // Re-enable (actions are ON by default), but don't install yet
    // (install will happen lazily on next mountTree or enable call)
    bw.actions.enable();
  }
  // Reset remote/wire
  bw.remote = null;
  for (var wl in bw._wireListeners) {
    if (_hop.call(bw._wireListeners, wl)) {
      try { bw._wireListeners[wl](); } catch (e) {}
      delete bw._wireListeners[wl];
    }
  }
  for (var cr in bw._clientRemotes) {
    if (_hop.call(bw._clientRemotes, cr)) delete bw._clientRemotes[cr];
  }
};

/**
 * Mount a TACO into a target element. Returns the root element (single root),
 * first node (array), or null. This is the primary compound verb for putting
 * UI on the page.
 *
 * Composes atomics: unmountChildren(target) → clear → create(content) →
 * insert → mountTree(target).
 *
 * @param {string|Element} target - CSS selector or DOM element to mount into
 * @param {Object|Array} taco - TACO object or array to render
 * @param {Object} [options] - Creation options
 * @returns {Element|null} The root element, or null
 * @category DOM Generation
 */
bw.mount = function(target, taco, options) {
  var container = _is(target, 'string') ? bw.$(target)[0] : target;
  if (!container) {
    _cw('bw.mount: target not found');
    return null;
  }

  // Teardown existing children (compound calls atomic)
  bw.unmountChildren(container);
  container.innerHTML = '';

  if (taco == null) return null;

  var firstEl = null;
  var created = [];
  if (_isA(taco)) {
    for (var i = 0; i < taco.length; i++) {
      if (taco[i] != null) {
        var child = bw.create(taco[i], options || {});
        container.appendChild(child);
        created.push(child);
        if (!firstEl) firstEl = child;
      }
    }
  } else {
    firstEl = bw.create(taco, options || {});
    container.appendChild(firstEl);
    created.push(firstEl);
  }

  // Walk each created child to register and fire mounted (not the container itself)
  for (var ci = 0; ci < created.length; ci++) {
    bw.mountTree(created[ci]);
  }

  return firstEl;
};

// bw.DOM is an exact alias of bw.mount (v2.1 §2)
bw.DOM = bw.mount;

/**
 * Append content to a target. create → insert (respecting opts.before) → mountTree.
 * Returns the new child element.
 *
 * @param {string|Element} target - Container
 * @param {Object} content - TACO to append
 * @param {Object} [opts] - {before: Element|number} for positioning
 * @returns {Element|null} The appended element
 * @category DOM Generation
 */
bw.append = function(target, content, opts) {
  var container = _is(target, 'string') ? bw.$(target)[0] : target;
  if (!container) return null;
  var child = bw.create(content);
  if (opts && opts.before !== undefined) {
    var ref = opts.before;
    if (typeof ref === 'number') ref = container.children[ref] || null;
    container.insertBefore(child, ref);
  } else {
    container.appendChild(child);
  }
  bw.mountTree(child);
  return child;
};

/**
 * Replace an existing element with new content. unmount(old) → create(taco) →
 * insert at position → mountTree. Returns new element. null taco = remove.
 *
 * @param {Element} ref - Element to replace
 * @param {Object|null} taco - Replacement TACO, or null to just remove
 * @returns {Element|null} The new element, or null
 * @category DOM Generation
 */
bw.replace = function(ref, taco) {
  if (!ref) return null;
  var parent = ref.parentNode;
  var next = ref.nextSibling;

  bw.unmount(ref);
  if (ref.parentNode) ref.parentNode.removeChild(ref);

  if (taco == null) return null;

  var neo = bw.create(taco);
  if (parent) {
    if (next) parent.insertBefore(neo, next);
    else parent.appendChild(neo);
  }
  bw.mountTree(neo);
  return neo;
};

/**
 * Refresh a component: unmountChildren → re-render → mountTree.
 * Render throw propagates. Emits bw:refresh.
 *
 * @param {string|Element} ref - Component to refresh
 * @returns {Element|null} The element
 * @category DOM Generation
 */
bw.refresh = function(ref) {
  var el = bw.el(ref);
  if (!el) return null;

  bw.unmountChildren(el);
  el.innerHTML = '';
  // Invalidate slot cache so slots re-resolve after rebuild
  if (el._bw_slot_cache) el._bw_slot_cache = null;

  if (el._bw_render) {
    // Let throw propagate (§3 error policy)
    el._bw_render(el, el._bw_state || {});
    // Walk newly created children
    bw.mountTree(el);
  }

  // Emit bw:refresh
  try {
    el.dispatchEvent(new CustomEvent('bw:refresh', {
      bubbles: true,
      detail: { uuid: bw.getUUID(el), type: el._bw_type || null }
    }));
  } catch (e) { /* jsdom */ }

  return el;
};

/**
 * Update a component by dispatching to el.bw.update(data) if defined.
 * Emits bw:statechange. If no update handle, emits specific diag warning.
 * NEVER falls back to refresh.
 *
 * @param {string|Element} ref - Component to update
 * @param {*} data - Data to pass to el.bw.update
 * @returns {Element|null} The element
 * @category State Management
 */
bw.update = function(ref, data) {
  var el = bw.el(ref);
  if (!el) return null;

  if (el.bw && typeof el.bw.update === 'function') {
    el.bw.update(data);
    // Emit statechange via pub/sub lifecycle topic
    bw.pub('bw:lifecycle', { event: 'statechange', uuid: bw.getUUID(el), data: data });
    bw.emit(el, 'statechange', el._bw_state);
    return el;
  }

  // No update handle — emit appropriate diag warning
  if (el._bw_render) {
    bw.pub('bw:diag', { code: 'update_use_refresh', uuid: bw.getUUID(el),
      msg: 'component has o.render but no update handle — use bw.refresh() instead' });
  } else {
    bw.pub('bw:diag', { code: 'update_no_handle', uuid: bw.getUUID(el),
      msg: 'component has no update handle and no render — nothing to do' });
  }
  return el;
};

/**
 * Update a specific slot on a component by reference.
 *
 * @param {string|Element} ref - Component reference
 * @param {string} name - Slot name
 * @param {*} value - Value to set
 * @returns {boolean} True if slot was updated
 * @category DOM Generation
 */
bw.updateSlot = function(ref, name, value) {
  var el = bw.el(ref);
  if (!el || !el.bw) return false;
  var setter = 'set' + name.charAt(0).toUpperCase() + name.slice(1);
  if (typeof el.bw[setter] !== 'function') return false;
  el.bw[setter](value);
  return true;
};

// ===================================================================================
// State Management: update, patch, emit/on
// ===================================================================================

// v2.1: old bw.update (render-based) replaced by new bw.update (dispatch-based) above.

/**
 * Targeted DOM update by element ID — change one element's content or attribute
 * without rebuilding the entire component tree.
 *
 * Use `bw.patch()` for lightweight value updates (scores, labels, counters)
 * and `bw.refresh()` for full structural re-renders.
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
  var el = bw.el(id);
  if (!el) return null;

  // v2.1 discriminated patch:
  // - string/number → text content
  // - plain object without .t → attributes
  // - TACO (has .t) → unmountChildren + create + mountTree
  // - array → unmountChildren + create each + mountTree
  // - legacy 3rd arg: explicit attribute set

  if (attr) {
    // Legacy: explicit attribute patch
    el.setAttribute(attr, String(content));
  } else if (_is(content, 'string') || _is(content, 'number')) {
    // Text patch
    el.textContent = String(content);
  } else if (_isA(content)) {
    // Array of children: full pipeline
    bw.unmountChildren(el);
    el.innerHTML = '';
    for (var i = 0; i < content.length; i++) {
      var item = content[i];
      if (item != null) {
        if (_is(item, 'object') && item.t) {
          el.appendChild(bw.create(item));
        } else {
          el.appendChild(document.createTextNode(String(item)));
        }
      }
    }
    bw.mountTree(el);
  } else if (_is(content, 'object') && content !== null && content.t) {
    // TACO content: full pipeline
    bw.unmountChildren(el);
    el.innerHTML = '';
    el.appendChild(bw.create(content));
    bw.mountTree(el);
  } else if (_is(content, 'object') && content !== null) {
    // Plain object without .t → attribute patch
    var attrKeys = _keys(content);
    for (var ak = 0; ak < attrKeys.length; ak++) {
      el.setAttribute(attrKeys[ak], String(content[attrKeys[ak]]));
    }
  } else {
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
 * Keyed reconciliation: match existing children by `el._bw_key`, move/add/remove
 * to match `items` order. Moved nodes are the SAME DOM nodes (state/focus survives).
 *
 * @param {Element} parentEl - Container element
 * @param {Array} items - Data array for desired children
 * @param {Object} opts - {key: fn(item)→string, create: fn(item)→TACO, update: fn(el, item)}
 * @category DOM Generation
 */
bw.syncChildren = function(parentEl, items, opts) {
  if (!parentEl || !items || !opts) return;
  var keyFn = opts.key;
  var createFn = opts.create;
  var updateFn = opts.update;

  // Save focus to restore after reorder (insertBefore can blur in some environments)
  /* c8 ignore next -- document is always defined in jsdom test env */
  var focused = (typeof document !== 'undefined') ? document.activeElement : null;
  if (focused && !parentEl.contains(focused)) focused = null;

  // Build map of existing keyed children
  var existingByKey = {};
  var child = parentEl.firstElementChild;
  while (child) {
    if (child._bw_key != null) {
      existingByKey[child._bw_key] = child;
    }
    child = child.nextElementSibling;
  }

  // Determine which keys are in the new items
  var newKeys = {};
  for (var i = 0; i < items.length; i++) {
    newKeys[keyFn(items[i])] = true;
  }

  // Remove absent keys (unmount + remove)
  var toRemove = [];
  for (var ek in existingByKey) {
    if (_hop.call(existingByKey, ek) && !newKeys[ek]) {
      toRemove.push(existingByKey[ek]);
    }
  }
  for (var ri = 0; ri < toRemove.length; ri++) {
    bw.unmount(toRemove[ri]);
    if (toRemove[ri].parentNode) toRemove[ri].parentNode.removeChild(toRemove[ri]);
    delete existingByKey[toRemove[ri]._bw_key];
  }

  // Process items in order: create new, update existing, reorder
  var prevNode = null;
  for (var j = 0; j < items.length; j++) {
    var k = keyFn(items[j]);
    var existing = existingByKey[k];

    if (existing) {
      // Update existing
      if (updateFn) updateFn(existing, items[j]);
      // Move into correct position if needed
      var expectedAfter = prevNode ? prevNode.nextSibling : parentEl.firstChild;
      if (existing !== expectedAfter) {
        parentEl.insertBefore(existing, expectedAfter);
      }
      prevNode = existing;
    } else {
      // Create new
      var taco = createFn(items[j]);
      var neo = bw.create(taco);
      neo._bw_key = k;
      var insertBefore = prevNode ? prevNode.nextSibling : parentEl.firstChild;
      parentEl.insertBefore(neo, insertBefore);
      bw.mountTree(neo);
      existingByKey[k] = neo;
      prevNode = neo;
    }
  }

  // Restore focus if it was lost during reorder
  /* c8 ignore next 2 -- focus management not exercised in jsdom */
  if (focused && focused.isConnected && document.activeElement !== focused) {
    try { focused.focus(); } catch (e) {}
  }
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
  var el = bw.el(target);
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
  var el = bw.el(target);
  if (!el) return function() {};
  var wrapped = function(e) { handler(e.detail, e); };
  el.addEventListener('bw:' + eventName, wrapped);
  // v2.1: return off() function (not the element)
  return function() {
    el.removeEventListener('bw:' + eventName, wrapped);
  };
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
 * @returns {number} Count of successfully called subscribers (including wildcard matches)
 * @category Pub/Sub
 * @see bw.sub
 * @example
 * bw.pub('score:updated', { player: 'X', score: 10 });
 * // Wildcard subscribers matching 'score:*' will also fire
 */
bw.pub = function(topic, detail) {
  var called = 0;

  function _deliver(subs, topicKey) {
    if (!subs || subs.length === 0) return;
    var snapshot = subs.slice();
    var pruned = false;
    var ghostDiags = [];
    for (var i = 0; i < snapshot.length; i++) {
      var sub = snapshot[i];
      // Liveness check: tied element that is disconnected and not detach-exempt
      // Skip liveness check for diag/lifecycle topics to avoid recursion
      if (sub.tiedEl && topic !== 'bw:diag' && topic !== 'bw:lifecycle') {
        var tiedUuid = bw.getUUID(sub.tiedEl);
        if (!sub.tiedEl.isConnected && !(tiedUuid && bw._detached[tiedUuid])) {
          // Ghost: prune this subscription
          var idx = subs.indexOf(sub);
          if (idx !== -1) subs.splice(idx, 1);
          pruned = true;
          ghostDiags.push({ code: 'ghost_prune', uuid: tiedUuid, topic: topicKey });
          continue;
        }
      }
      try { sub.handler(detail, topic); called++; }
      catch (err) { _cw('bw.pub: subscriber error on topic "' + topicKey + '":', err); }
    }
    if (pruned && subs.length === 0) delete bw._topics[topicKey];
    // Emit ghost_prune diags AFTER delivery loop to avoid re-entrancy
    for (var g = 0; g < ghostDiags.length; g++) {
      bw.pub('bw:diag', ghostDiags[g]);
    }
  }

  // Exact-match subscribers
  _deliver(bw._topics[topic], topic);

  // Wildcard subscribers -- patterns ending with '*'
  var keys = Object.keys(bw._topics);
  for (var k = 0; k < keys.length; k++) {
    var pat = keys[k];
    if (pat.charAt(pat.length - 1) !== '*') continue;
    var prefix = pat.slice(0, -1);
    if (topic.length >= prefix.length && topic.substring(0, prefix.length) === prefix && topic !== pat) {
      _deliver(bw._topics[pat], pat);
    }
  }
  return called;
};

/**
 * Subscribe to a topic. Returns an unsub() function.
 *
 * Supports wildcard patterns: a topic ending in `*` matches any published
 * topic that starts with the prefix before the `*`. For example,
 * `'agui:*'` matches `'agui:ready'`, `'agui:error'`, etc. The handler
 * receives `(detail, topic)` so it can distinguish which topic fired.
 *
 * Optional third argument ties the subscription to a DOM element's lifecycle --
 * when `bw.unmount()` is called on that element, the subscription is automatically
 * removed, preventing memory leaks.
 *
 * @param {string} topic - Topic name, or wildcard pattern ending in '*'
 * @param {Function} handler - Called with (detail, topic) on each publish
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
 *
 * // Wildcard: listen to all 'agui:' topics
 * bw.sub('agui:*', function(detail, topic) {
 *   console.log('Got', topic, detail);
 * });
 */
bw.sub = function(topic, handler, el) {
  var id = ++bw._subIdCounter;
  if (!bw._topics[topic]) bw._topics[topic] = [];
  var entry = { handler: handler, id: id };
  // Track tied element for liveness checks in bw.pub
  if (el) entry.tiedEl = el;
  bw._topics[topic].push(entry);

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
    // Ensure element has UUID + bw_lc so unmount finds it
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

/**
 * Subscribe to a topic for a single event only. The subscription is
 * automatically removed after the first publish. Equivalent to manually
 * calling unsub() inside a bw.sub() handler, but avoids the common bug
 * of forgetting to unsubscribe.
 *
 * @param {string} topic - Topic name
 * @param {Function} handler - Called once with (detail) on the next publish
 * @param {Element} [el] - Optional DOM element to tie lifecycle to
 * @returns {Function} Call to cancel the subscription before it fires
 * @category Pub/Sub
 * @see bw.sub
 * @see bw.pub
 * @example
 * bw.once('data:loaded', function(detail) {
 *   console.log('Received:', detail);
 *   // No need to unsubscribe -- already done automatically
 * });
 *
 * // Cancel before it fires:
 * var cancel = bw.once('timeout', handler);
 * cancel(); // handler will never be called
 */
bw.once = function(topic, handler, el) {
  var unsub = bw.sub(topic, function(detail) {
    unsub();
    handler(detail);
  }, el);
  return unsub;
};

/**
 * Declared dataflow: recompute fn(inputs...) on any input publish.
 * Returns a disposer function. Optionally ties to an element lifecycle.
 *
 * @param {Array<string>} inputs - Topic names to subscribe to
 * @param {Function} fn - Combiner: fn(...latestValues) → result
 * @param {string} outTopic - Topic to publish result on
 * @param {Object} [opts] - {seed: [], immediate: bool, el: Element}
 * @returns {Function} Disposer
 * @category Pub/Sub
 */
bw.derive = function(inputs, fn, outTopic, opts) {
  opts = opts || {};
  var values = new Array(inputs.length);
  var ready = new Array(inputs.length);
  var disposed = false;
  var unsubs = [];

  // Validate seed length
  if (opts.seed) {
    if (opts.seed.length !== inputs.length) {
      throw new TypeError('bw.derive: seed length (' + opts.seed.length + ') must match inputs length (' + inputs.length + ')');
    }
    for (var si = 0; si < opts.seed.length; si++) {
      values[si] = opts.seed[si];
      ready[si] = true;
    }
  }

  // Cycle detection
  if (inputs.indexOf(outTopic) !== -1) {
    bw.pub('bw:diag', { code: 'derive_cycle', inputs: inputs, outTopic: outTopic });
  }

  function _allReady() {
    for (var r = 0; r < ready.length; r++) { if (!ready[r]) return false; }
    return true;
  }

  function _compute() {
    /* c8 ignore next -- disposed guard: race condition safety net */
    if (disposed) return;
    try {
      var result = fn.apply(null, values);
      bw.pub(outTopic, result);
    } catch (e) {
      bw.pub('bw:diag', { code: 'derive_error', outTopic: outTopic, msg: e.message });
    }
  }

  for (var i = 0; i < inputs.length; i++) {
    (function(idx) {
      var unsub = bw.sub(inputs[idx], function(v) {
        values[idx] = v;
        ready[idx] = true;
        if (_allReady()) _compute();
      });
      unsubs.push(unsub);
    })(i);
  }

  // Immediate: publish once at creation if ready
  if (opts.immediate && _allReady()) _compute();

  function dispose() {
    if (disposed) return;
    disposed = true;
    for (var u = 0; u < unsubs.length; u++) {
      /* c8 ignore next -- unsub() never throws in practice */
      try { unsubs[u](); } catch (e) {}
    }
  }

  // Tie to element lifecycle
  if (opts.el) {
    if (!opts.el._bw_subs) opts.el._bw_subs = [];
    opts.el._bw_subs.push(dispose);
  }

  return dispose;
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
  /* c8 ignore next -- non-function guard: tests always pass valid functions */
  if (!_is(fn, 'function')) return '';
  /* c8 ignore next -- ternary branches: both name and auto-generated paths tested elsewhere */
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
  /* c8 ignore start -- funcUnregister: tested via htmlPage/funcRegister integration */
  if (name in bw._fnRegistry) {
    delete bw._fnRegistry[name];
    return true;
  }
  /* c8 ignore stop */
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

// v2.1: ComponentHandle APIs (_extractDeps, _dirtyComponents, _flushScheduled,
// _scheduleFlush, _doFlush, _ComponentHandle, flush, when, each, component)
// fully removed — no stubs needed in v2.1.


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
  var el = bw.el(target);
  // Fallback: try class selector, but only for safe selector strings
  if (!el && _is(target, 'string') && target.indexOf('#') !== 0 && target.indexOf('.') !== 0) {
    try { el = bw.$('.' + target)[0]; } catch (e) { /* invalid selector */ }
  }
  if (!el || !el.bw || typeof el.bw[action] !== 'function') {
    _cw('bw.message: no handle method "' + action + '" on ' + target);
    return false;
  }
  el.bw[action](data);
  return true;
};

/**
 * Collect form data from all input, select, and textarea elements within a
 * container. Each element's `name` attribute (or `id` if no name) becomes a
 * key in the returned object. This provides a lightweight alternative to the
 * browser FormData API that returns a plain object suitable for JSON
 * serialization or bw.pub().
 *
 * Handles all standard HTML form controls:
 * - text/number/email/etc inputs: string value
 * - checkboxes: boolean (true/false)
 * - radio buttons: string value of the checked radio (unchecked groups omitted)
 * - multi-select: array of selected option values
 * - textarea: string value
 *
 * Elements without both `name` and `id` attributes are silently skipped.
 *
 * @param {string|Element} target - CSS selector, UUID string, or DOM element
 * @returns {Object} Plain object mapping field names to values
 * @category Component
 * @see bw.makeForm
 * @see bw.makeInput
 * @example
 * // Given a form with name="email" input and name="agree" checkbox:
 * var data = bw.formData('#signup-form');
 * // => { email: 'user@example.com', agree: true }
 *
 * // Collect and publish in one step:
 * bw.pub('form:submit', bw.formData('#my-form'));
 *
 * // Works with any container, not just <form>:
 * bw.pub('settings:changed', bw.formData('.settings-panel'));
 */
bw.formData = function(target) {
  var el = bw.el(target);
  if (!el) return {};
  var result = {};
  var inputs = el.querySelectorAll('input, select, textarea');
  for (var i = 0; i < inputs.length; i++) {
    var inp = inputs[i];
    var key = inp.name || inp.id;
    if (!key) continue;
    if (inp.type === 'checkbox') {
      result[key] = inp.checked;
    } else if (inp.type === 'radio') {
      if (inp.checked) result[key] = inp.value;
    } else if (inp.tagName === 'SELECT' && inp.multiple) {
      result[key] = [];
      for (var j = 0; j < inp.options.length; j++) {
        if (inp.options[j].selected) result[key].push(inp.options[j].value);
      }
    } else {
      result[key] = inp.value;
    }
  }
  return result;
};

// ===================================================================================
// bw.jsonPatch() — RFC 6902 JSON Patch on plain objects
// ===================================================================================

/**
 * Apply RFC 6902 JSON Patch operations to a plain object.
 *
 * Supported operations: add, remove, replace, move, copy, test.
 * Paths use JSON Pointer (RFC 6901) notation: `/foo/bar/0`.
 * Mutates the target object in place and returns it.
 *
 * @param {Object} obj - Target object to patch
 * @param {Array<Object>} ops - Array of patch operations
 * @param {string} ops[].op - Operation: 'add', 'remove', 'replace', 'move', 'copy', 'test'
 * @param {string} ops[].path - JSON Pointer path (e.g. '/a/b/0')
 * @param {*} [ops[].value] - Value for add/replace/test
 * @param {string} [ops[].from] - Source path for move/copy
 * @returns {Object} The patched object (same reference)
 * @throws {Error} On invalid op, missing path, test failure, or path not found for remove
 * @category Data Utilities
 * @see bw.patch
 * @example
 * var obj = { a: 1, b: { c: 2 } };
 * bw.jsonPatch(obj, [
 *   { op: 'replace', path: '/a', value: 10 },
 *   { op: 'add', path: '/b/d', value: 3 },
 *   { op: 'remove', path: '/b/c' }
 * ]);
 * // obj => { a: 10, b: { d: 3 } }
 */
bw.jsonPatch = function(obj, ops) {
  if (!_isA(ops)) return obj;

  // Parse JSON Pointer path to array of keys
  function parsePath(path) {
    if (path === '') return [];
    if (path.charAt(0) !== '/') throw new Error('Invalid JSON Pointer: ' + path);
    return path.slice(1).split('/').map(function(s) {
      return s.replace(/~1/g, '/').replace(/~0/g, '~');
    });
  }

  // Walk to parent of final key; return { parent, key }
  function resolve(root, keys) {
    var parent = root;
    for (var i = 0; i < keys.length - 1; i++) {
      var k = _isA(parent) ? parseInt(keys[i], 10) : keys[i];
      if (parent[k] === undefined) throw new Error('Path not found: /' + keys.slice(0, i + 1).join('/'));
      parent = parent[k];
    }
    return { parent: parent, key: _isA(parent) ? parseInt(keys[keys.length - 1], 10) : keys[keys.length - 1] };
  }

  // Get value at path
  function getVal(root, keys) {
    var cur = root;
    for (var i = 0; i < keys.length; i++) {
      var k = _isA(cur) ? parseInt(keys[i], 10) : keys[i];
      if (cur[k] === undefined) throw new Error('Path not found: /' + keys.slice(0, i + 1).join('/'));
      cur = cur[k];
    }
    return cur;
  }

  for (var i = 0; i < ops.length; i++) {
    var op = ops[i];
    if (!op.op || !_is(op.path, 'string')) throw new Error('Invalid patch operation at index ' + i);
    var keys = parsePath(op.path);

    var r, val, fromKeys, fr, tr, cr;
    switch (op.op) {
      case 'add': {
        if (keys.length === 0) throw new Error('Cannot add to root');
        r = resolve(obj, keys);
        if (_isA(r.parent) && r.key <= r.parent.length) {
          r.parent.splice(r.key, 0, op.value);
        } else {
          r.parent[r.key] = op.value;
        }
        break;
      }
      case 'remove': {
        if (keys.length === 0) throw new Error('Cannot remove root');
        r = resolve(obj, keys);
        if (_isA(r.parent)) {
          if (r.key >= r.parent.length) throw new Error('Index out of bounds: ' + r.key);
          r.parent.splice(r.key, 1);
        } else {
          if (!(r.key in r.parent)) throw new Error('Path not found: ' + op.path);
          delete r.parent[r.key];
        }
        break;
      }
      case 'replace': {
        if (keys.length === 0) throw new Error('Cannot replace root');
        r = resolve(obj, keys);
        if (_isA(r.parent)) {
          if (r.key >= r.parent.length) throw new Error('Index out of bounds: ' + r.key);
        } else {
          if (!(r.key in r.parent)) throw new Error('Path not found: ' + op.path);
        }
        r.parent[r.key] = op.value;
        break;
      }
      case 'move': {
        if (!_is(op.from, 'string')) throw new Error('move requires "from"');
        fromKeys = parsePath(op.from);
        val = getVal(obj, fromKeys);
        fr = resolve(obj, fromKeys);
        if (_isA(fr.parent)) { fr.parent.splice(fr.key, 1); }
        else { delete fr.parent[fr.key]; }
        tr = resolve(obj, keys);
        if (_isA(tr.parent) && tr.key <= tr.parent.length) {
          tr.parent.splice(tr.key, 0, val);
        } else {
          tr.parent[tr.key] = val;
        }
        break;
      }
      case 'copy': {
        if (!_is(op.from, 'string')) throw new Error('copy requires "from"');
        val = getVal(obj, parsePath(op.from));
        cr = resolve(obj, keys);
        if (_isA(cr.parent) && cr.key <= cr.parent.length) {
          cr.parent.splice(cr.key, 0, val);
        } else {
          cr.parent[cr.key] = val;
        }
        break;
      }
      case 'test': {
        var actual = getVal(obj, keys);
        if (JSON.stringify(actual) !== JSON.stringify(op.value)) {
          throw new Error('Test failed: ' + op.path + ' expected ' + JSON.stringify(op.value) + ' got ' + JSON.stringify(actual));
        }
        break;
      }
      default:
        throw new Error('Unknown op: ' + op.op);
    }
  }
  return obj;
};

// ===================================================================================
// bw.apply() / bw.parseJSONFlex() — Server-driven UI protocol
// ===================================================================================

/**
 * Registry of named functions for backward compat with code that checks _clientFunctions.
 * v2.1: exec/register are rejected at the protocol level; use bw.registerRemote() instead.
 * @private
 */
bw._clientFunctions = {};

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
 * Dispatches one of 12 v:1 message types:
 *   mount    — bw.mount(ref, taco)
 *   patch    — bw.patch(ref, text/attrs/content)
 *   append   — bw.append(ref, taco)
 *   replace  — bw.replace(ref, taco)
 *   remove   — bw.remove(ref)
 *   refresh  — bw.refresh(ref)
 *   update   — bw.update(ref, data)
 *   message  — bw.message(ref, action, data)
 *   batch    — iterate ops, call bw.apply for each
 *   listen   — subscribe to a pub/sub topic
 *   unlisten — unsubscribe from a topic
 *   call     — invoke a registered remote function
 *
 * Target resolution:
 *   Starts with '#' or '.' → CSS selector (querySelector)
 *   Otherwise → getElementById, then bw._el fallback
 *
 * @param {Object} msg - Protocol message
 * @returns {boolean} true if the message was applied successfully
 * @category Core
 */
// ===================================================================================
// bw.actions — document-level delegated action dispatcher (§5.4)
// ===================================================================================

bw.actions = (function() {
  var _enabled = false;
  var _installed = false;

  function _findActionToken(el) {
    /* c8 ignore next -- el always has classList in DOM event handlers */
    if (!el || !el.classList) return null;
    var cls = el.classList;
    var tokens = [];
    /* c8 ignore next 2 -- action token extraction: only hit via real DOM clicks */
    for (var i = 0; i < cls.length; i++) {
      if (cls[i].indexOf('bw_act_') === 0) tokens.push(cls[i].substring(7));
    }
    return tokens;
  }

  function _findOwner(el) {
    var node = el;
    while (node) {
      if (node._bw_type) {
        return { uuid: bw.getUUID(node), type: node._bw_type };
      }
      node = node.parentElement;
    }
    return null;
  }

  function _handleEvent(e) {
    /* c8 ignore next -- guard only reachable if disabled between install and event */
    if (!_enabled) return;
    var node = e.target;
    /* c8 ignore start -- action dispatch: requires real DOM event delegation not exercised in unit tests */
    while (node && node !== document) {
      var tokens = _findActionToken(node);
      if (tokens && tokens.length > 0) {
        var action = tokens[0];
        if (tokens.length > 1) {
          bw.pub('bw:diag', { code: 'act_multiple', tokens: tokens });
        }
        var tag = node.tagName ? node.tagName.toLowerCase() : '';
        if (tag === 'a' || tag === 'form') e.preventDefault();
        var value = null;
        var name = null;
        var form = null;
        if (tag === 'input' || tag === 'textarea' || tag === 'select') {
          value = node.value;
          name = node.getAttribute('name');
        }
        if (tag === 'form') {
          form = {};
          try {
            var fd = new FormData(node);
            fd.forEach(function(v, k) { form[k] = v; });
          } catch (ex) {}
        }
        var ref = bw.getUUID(node) || node.getAttribute('id') || null;
        var owner = _findOwner(node.parentElement);
        var payload = { action: action, value: value, name: name, ref: ref, owner: owner };
        if (form) payload.form = form;
        bw.pub('act:' + action, payload);
        if (bw.remote && typeof bw.remote.send === 'function') {
          bw.remote.send({ v: 1, type: 'event', action: action, value: value, name: name, ref: ref, owner: owner });
        }
        return;
      }
      node = node.parentElement;
    }
    /* c8 ignore stop */
  }

  var _installedDoc = null;

  function _install() {
    /* c8 ignore next -- document always available in test env */
    if (typeof document === 'undefined') return;
    // Re-install if document changed (jsdom test isolation)
    if (_installedDoc === document) return;
    _installedDoc = document;
    document.addEventListener('click', _handleEvent, true);
    document.addEventListener('change', _handleEvent, true);
    document.addEventListener('input', _handleEvent, true);
    document.addEventListener('submit', _handleEvent, true);
  }

  return {
    enable: function() { _enabled = true; _install(); },
    disable: function() { _enabled = false; },
    _ensureInstalled: function() { if (_enabled) _install(); },
    _reset: function() { _enabled = false; _installedDoc = null; }
  };
})();

bw.remote = null;
bw._clientRemotes = {};
bw._wireListeners = {};

bw.registerRemote = function(name, fn) { bw._clientRemotes[name] = fn; };

bw.connect = function(url) {
  bw.pub('bw:diag', { code: 'remote_status', status: 'connecting', url: url });
  var es = new EventSource(url);
  var remote = {
    send: function(msg) {
      try {
        var xhr = new XMLHttpRequest();
        xhr.open('POST', url.replace('/events/', '/apply/'), true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.send(JSON.stringify(msg));
      } catch (e) {}
    },
    close: function() { es.close(); }
  };
  es.onopen = function() { bw.pub('bw:diag', { code: 'remote_status', status: 'connected' }); };
  es.onmessage = function(e) { try { bw.apply(JSON.parse(e.data)); } catch (ex) {} };
  es.onerror = function() { bw.pub('bw:diag', { code: 'remote_status', status: 'disconnected' }); };
  bw.remote = remote;
  return remote;
};

function _sanitizeWireTaco(taco) {
  if (!taco || typeof taco !== 'object') return taco;
  if (taco.a) {
    var cleanAttrs = {};
    var akeys = _keys(taco.a);
    for (var ai = 0; ai < akeys.length; ai++) {
      if (akeys[ai].substring(0, 2).toLowerCase() === 'on' && typeof taco.a[akeys[ai]] === 'string') continue;
      cleanAttrs[akeys[ai]] = taco.a[akeys[ai]];
    }
    taco = Object.assign({}, taco, { a: cleanAttrs });
  }
  if (_isA(taco.c)) {
    taco = Object.assign({}, taco, { c: taco.c.map(_sanitizeWireTaco) });
  } else if (taco.c && typeof taco.c === 'object' && taco.c.t) {
    taco = Object.assign({}, taco, { c: _sanitizeWireTaco(taco.c) });
  }
  return taco;
}

bw.apply = function(msg) {
  if (!msg || !msg.type) return false;
  if (msg.type === 'hello') return true; // handshake -- no-op ack
  if (msg.type !== 'batch' && msg.v !== 1) {
    bw.pub('bw:diag', { code: 'wire_rejected', msg: 'missing or unknown version', v: msg.v });
    return false;
  }
  var type = msg.type;
  var ref = msg.ref;
  if (msg.target !== undefined || msg.node !== undefined) {
    bw.pub('bw:diag', { code: 'wire_rejected', msg: 'v:1 uses ref/taco, not target/node' });
    return false;
  }

  if (type === 'mount') {
    var mountTarget = bw.el(ref);
    if (!mountTarget) return false;
    bw.mount(mountTarget, _sanitizeWireTaco(msg.taco));
    return true;
  } else if (type === 'patch') {
    var patchEl = bw.el(ref);
    if (!patchEl) return false;
    if (msg.text !== undefined) bw.patch(patchEl, msg.text);
    else if (msg.attrs) bw.patch(patchEl, msg.attrs);
    else if (msg.content) bw.patch(patchEl, _sanitizeWireTaco(msg.content));
    return true;
  } else if (type === 'append') {
    var appendTarget = bw.el(ref);
    if (!appendTarget) return false;
    bw.append(appendTarget, _sanitizeWireTaco(msg.taco));
    return true;
  } else if (type === 'replace') {
    var replaceEl = bw.el(ref);
    if (!replaceEl) return false;
    bw.replace(replaceEl, _sanitizeWireTaco(msg.taco));
    return true;
  } else if (type === 'remove') {
    var removeEl = bw.el(ref);
    if (!removeEl) return false;
    bw.remove(removeEl);
    return true;
  } else if (type === 'refresh') {
    var refreshEl = bw.el(ref);
    if (!refreshEl) return false;
    if (!refreshEl._bw_render) {
      bw.pub('bw:diag', { code: 'refresh_no_render', ref: ref });
      return false;
    }
    bw.refresh(refreshEl);
    return true;
  } else if (type === 'update') {
    var updateEl = bw.el(ref);
    if (!updateEl) return false;
    bw.update(updateEl, msg.data);
    return true;
  } else if (type === 'message') {
    return bw.message(ref, msg.action, msg.data) !== false;
  } else if (type === 'batch') {
    if (!_isA(msg.ops)) return false;
    var allOk = true;
    for (var bi = 0; bi < msg.ops.length; bi++) {
      /* c8 ignore next 2 -- batch catch: bw.apply() handles errors internally */
      try { if (!bw.apply(msg.ops[bi])) allOk = false; }
      catch (e) { allOk = false; }
    }
    return allOk;
  } else if (type === 'listen') {
    if (!msg.topic) return false;
    if (bw._wireListeners[msg.topic]) return true;
    bw._wireListeners[msg.topic] = bw.sub(msg.topic, function(d) {
      if (bw.remote && typeof bw.remote.send === 'function') {
        bw.remote.send({ v: 1, type: 'topic', topic: msg.topic, data: d });
      }
    });
    return true;
  } else if (type === 'unlisten') {
    if (!msg.topic || !bw._wireListeners[msg.topic]) return false;
    bw._wireListeners[msg.topic]();
    delete bw._wireListeners[msg.topic];
    return true;
  } else if (type === 'call') {
    if (!msg.name) return false;
    var fn = bw._clientRemotes[msg.name] || bw._clientFunctions[msg.name];
    if (!_is(fn, 'function')) return false;
    try {
      var args = _isA(msg.args) ? msg.args : [];
      fn.apply(null, args);
      return true;
    } catch (e) { return false; }
  } else if (type === 'exec' || type === 'register') {
    bw.pub('bw:diag', { code: 'wire_rejected', msg: type + ' is not a valid v:1 verb' });
    return false;
  }
  bw.pub('bw:diag', { code: 'wire_rejected', msg: 'unknown type: ' + type });
  return false;
};


// ===================================================================================
// bw.inspect() — DOM introspection with bitwrench metadata
// ===================================================================================

/**
 * Inspect a DOM element and its subtree, returning a plain-object
 * representation with bitwrench metadata at each node. Useful for debugging,
 * devtools, MCP/AG-UI tool discovery, and automated testing.
 *
 * Each node in the returned tree includes:
 * - `tag` -- lowercase tag name (or '#text' for text nodes)
 * - `id` -- element id (if set)
 * - `uuid` -- bitwrench UUID class (if lifecycle-managed)
 * - `type` -- component type from o.type (if set, e.g. 'card', 'tabs')
 * - `classes` -- first 5 CSS classes (string, space-separated)
 * - `handles` -- array of el.bw method names (if any)
 * - `state` -- copy of _bw_state (if any)
 * - `hasRender` -- true if _bw_render is set
 * - `hasSubs` -- true if element has pub/sub subscriptions
 * - `refs` -- copy of _bw_refs keys (if any)
 * - `children` -- array of child node trees (up to depth limit, max 50 per level)
 *
 * @param {string|Element} target - CSS selector, UUID, or DOM element
 * @param {number} [depth=3] - Maximum recursion depth (0 = target only, no children)
 * @returns {Object|null} Plain object tree, or null if element not found
 * @category Component
 * @example
 * // Get full tree from #app, 3 levels deep (default):
 * var info = bw.inspect('#app');
 *
 * // Shallow inspection (just the element, no children):
 * var info = bw.inspect('#my-carousel', 0);
 * console.log(info.handles); // ['next', 'prev', 'goToSlide']
 * console.log(info.type);    // 'carousel'
 *
 * // Deep inspection for debugging:
 * console.log(JSON.stringify(bw.inspect('#app', 5), null, 2));
 */
bw.inspect = function(target, depth) {
  var el = bw.el(target);
  if (!el && _is(target, 'string')) el = bw.$(target)[0];
  if (!el) return null;
  if (depth === undefined || depth === null) depth = 3;

  function walk(node, d) {
    /* c8 ignore next -- null node guard: children iteration always passes valid nodes */
    if (!node) return null;
    // Skip non-element nodes (text, comment, etc.)
    /* c8 ignore next -- nodeType guard: el.children only contains elements */
    if (node.nodeType !== 1) return null;

    /* c8 ignore next -- tagName always exists on elements; #text fallback is defensive */
    var info = { tag: node.tagName ? node.tagName.toLowerCase() : '#text' };

    // Identity
    if (node.id) info.id = node.id;
    var uuid = bw.getUUID(node);
    if (uuid) info.uuid = uuid;
    if (node._bw_type) info.type = node._bw_type;

    // CSS classes (first 5 for readability)
    if (node.className && typeof node.className === 'string') {
      info.classes = node.className.split(' ').slice(0, 5).join(' ');
    }

    // Bitwrench handle methods
    if (node.bw) {
      var handles = _keys(node.bw);
      if (handles.length > 0) info.handles = handles;
    }

    // State
    if (node._bw_state) info.state = node._bw_state;
    if (node._bw_render) info.hasRender = true;
    if (node._bw_subs && node._bw_subs.length > 0) info.hasSubs = true;

    // Refs
    if (node._bw_refs) info.refs = _keys(node._bw_refs);

    // Direct text content (immediate text nodes only, truncated)
    var directText = '';
    for (var tc = node.firstChild; tc; tc = tc.nextSibling) {
      if (tc.nodeType === 3) directText += tc.textContent;
    }
    directText = directText.trim();
    if (directText) info.text = directText.length > 120 ? directText.slice(0, 120) + '...' : directText;

    // Children (recurse up to depth limit, max 50 children per level)
    if (d < depth && node.children && node.children.length > 0) {
      info.children = [];
      var max = Math.min(node.children.length, 50);
      for (var i = 0; i < max; i++) {
        var child = walk(node.children[i], d + 1);
        if (child) info.children.push(child);
      }
      if (node.children.length > 50) {
        info.children.push({ tag: '...', count: node.children.length - 50 });
      }
    }

    return info;
  }

  return walk(el, 0);
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

  // Warn if user is using bw_style_* reserved namespace
  if (id && /^bw_style_/.test(id) && !options._internal) {
    bw.pub('bw:diag', { code: 'css_reserved_id', ref: id, msg: 'id "' + id + '" is in the reserved bw_style_* namespace' });
  }

  // Get or create style element
  let styleEl = document.getElementById(id);

  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = id;
    styleEl.type = 'text/css';
    // Layer ordering: insert bw_style_* elements in deterministic order
    if (/^bw_style_/.test(id)) {
      var _layerOrder = ['bw_style_reset', 'bw_style_structural', 'bw_style_global'];
      var myIdx = _layerOrder.indexOf(id);
      if (myIdx === -1) myIdx = _layerOrder.length; // scoped styles after global
      // Find the first existing bw_style_* element that should come after this one
      var inserted = false;
      var headStyles = document.head.querySelectorAll('style[id^="bw_style_"]');
      for (var si = 0; si < headStyles.length; si++) {
        var thatIdx = _layerOrder.indexOf(headStyles[si].id);
        if (thatIdx === -1) thatIdx = _layerOrder.length;
        if (thatIdx > myIdx) {
          document.head.insertBefore(styleEl, headStyles[si]);
          inserted = true;
          break;
        }
      }
      if (!inserted) document.head.appendChild(styleEl);
    } else {
      document.head.appendChild(styleEl);
    }
  }

  // Apply CSP nonce if configured
  if (bw.config && bw.config.cspNonce) {
    styleEl.setAttribute('nonce', bw.config.cspNonce);
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
 * With an optional second argument, applies content or a function to
 * every matched element (same apply rules as `bw.el()`):
 * - string/number: sets `el.textContent`
 * - function: calls `apply(el)` for each element
 * - TACO object: clears children, mounts TACO via `bw.create()`
 * - array: clears children, appends each item
 *
 * @param {string|Element|Array} selector - CSS selector, element, or array
 * @param {string|number|Function|Object|Array} [apply] - Content or function to apply
 * @returns {Array} Array of DOM elements
 * @category DOM Selection
 * @see bw.el
 * @example
 * bw.$('.card')                           // => [div.card, div.card, ...]
 * bw.$('.status', 'Online')               // set text on all .status elements
 * bw.$('.card', function(el) {            // apply function to each
 *   el.style.opacity = '0.5';
 * })
 */
// Always define bw.$ — use dynamic _isBrowser check so it works when
// jsdom globals are injected after module load (test environments).
bw.$ = function(selector, apply) {
  if (!bw._isBrowser) return [];
  var els;
  if (!selector) {
    els = [];
  } else if (_isA(selector)) {
    els = selector;
  } else if (selector.nodeType) {
    els = [selector];
  } else if (selector.length !== undefined && !_is(selector, 'string')) {
    els = Array.from(selector);
  } else if (_is(selector, 'string')) {
    els = Array.from(document.querySelectorAll(selector));
  } else {
    els = [];
  }

  if (apply !== undefined) {
    for (var i = 0; i < els.length; i++) _applyTo(els[i], apply);
  }

  return els;
};

// Convenience single element selector
bw.$.one = function(selector) {
  return bw.$(selector)[0] || null;
};


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
  if (scope === 'structural') return 'bw_style_structural';
  // Preserve sigil distinction: '#dash' → 'id_dash', '.dash' → 'cls_dash'
  var clean = scope;
  if (clean.charAt(0) === '#') clean = 'id_' + clean.substring(1);
  else if (clean.charAt(0) === '.') clean = 'cls_' + clean.substring(1);
  clean = clean.replace(/-/g, '_');
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

  // Contrast check: warn if primary/secondary seeds are too close
  if (fullConfig.primary && fullConfig.secondary) {
    var l1 = relativeLuminance(fullConfig.primary);
    var l2 = relativeLuminance(fullConfig.secondary);
    var bright = Math.max(l1, l2);
    var dark = Math.min(l1, l2);
    var ratio = (bright + 0.05) / (dark + 0.05);
    if (ratio < 1.5) {
      bw.pub('bw:diag', { code: 'contrast_aa', msg: 'primary/secondary seeds have near-identical luminance (ratio ' + ratio.toFixed(2) + ')' });
    }
  }

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
  /* c8 ignore next 3 -- altPalette.surface always provided by derivePalette */
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
    layout: layout,
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
  // Reject complex/comma scopes
  if (scope && !_validateThemeScope(scope)) return null;

  var styleId = _scopeToStyleId(scope);

  // Scope the primary rules if a scope is provided
  var primaryRules = styles.rules;
  if (scope) {
    primaryRules = scopeRulesUnder(primaryRules, scope);
  }

  // Wrap alternate rules with .bw_theme_alt
  var altRules = styles.alternateRules;
  if (altRules) {
    // When scoped: remove the raw 'body' rule (dead as descendant of scope)
    // and add a self-rule on the scope root instead
    var bodyDecls = null;
    if (scope && altRules['body']) {
      bodyDecls = altRules['body'];
      // Work on a shallow copy so we don't mutate the original
      var altCopy = {};
      for (var k in altRules) {
        if (Object.prototype.hasOwnProperty.call(altRules, k) && k !== 'body') altCopy[k] = altRules[k];
      }
      altRules = altCopy;
    }
    if (scope) {
      // Scoped compound: #scope.bw_theme_alt .bw_card
      altRules = scopeRulesUnder(altRules, scope + '.bw_theme_alt');
      // Add self surface rule for the scope root
      if (bodyDecls) {
        altRules[scope + '.bw_theme_alt'] = bodyDecls;
      }
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

  return bw.injectCSS(combined, { id: styleId, append: false, _internal: true });
};

/**
 * Generate and apply styles in one call. Convenience wrapper.
 *
 * Equivalent to: `bw.applyStyles(bw.makeStyles(config), scope)`
 *
 * @param {Object} [config] - Style configuration (same as `makeStyles`)
 * @param {string} [scope] - Scope selector (same as `applyStyles`)
 * @returns {Object} The styles object (same as `makeStyles` return value:
 *   `{css, alternateCss, palette, alternatePalette, rules, alternateRules, isLightPrimary}`)
 * @category CSS & Styling
 * @see bw.makeStyles
 * @see bw.applyStyles
 * @example
 * bw.loadStyles();                                          // defaults, global
 * bw.loadStyles({ primary: '#4f46e5' });                    // custom, global
 * bw.loadStyles({ primary: '#4f46e5' }, '#my-dashboard');   // custom, scoped
 */
bw.loadStyles = function(config, scope) {
  // Inject structural CSS first (only once)
  bw.loadStructural();
  var styles = bw.makeStyles(config);
  bw.applyStyles(styles, scope);
  return styles;
};

/**
 * Inject structural (theme-independent) CSS only. Idempotent.
 *
 * @returns {Element|null} The `<style>` element, or null in Node.js
 * @category CSS & Styling
 * @see bw.loadStyles
 * @see bw.clearStyles
 */
bw.loadStructural = function() {
  if (!bw._isBrowser) return null;
  var existing = document.getElementById('bw_style_structural');
  if (existing) return existing;
  var structuralCSS = bw.css(getStructuralStyles());
  return bw.injectCSS(structuralCSS, { id: 'bw_style_structural', append: false, _internal: true });
};

/**
 * Prefix every selector in a rules object with a scope selector.
 * Useful for wrapping site-level CSS under `.bw_theme_alt` for dark mode.
 *
 * @param {Object} rules - CSS rules object (selector -> declarations)
 * @param {string} prefix - Scope prefix (e.g. '.bw_theme_alt')
 * @returns {Object} New rules object with scoped selectors
 * @category CSS & Styling
 * @see bw.applyStyles
 * @see bw.css
 * @example
 * var altRules = bw.scopeRulesUnder(myRules, '.bw_theme_alt');
 * bw.injectCSS(bw.css(altRules));
 */
bw.scopeRulesUnder = scopeRulesUnder;

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
  return bw.injectCSS(bw.css(getResetStyles()), { id: 'bw_style_reset', append: false, _internal: true });
};

/**
 * Toggle between primary and alternate theme palettes.
 *
 * Adds/removes the `bw_theme_alt` class on the scoping element(s).
 * Without a scope, toggles on `<html>` (global).
 * With a scope, toggles on ALL matching elements.
 *
 * @param {string|Element} [scope] - Selector or element. Omit for global.
 * @returns {string} Active mode after toggle: 'primary' or 'alternate' (based on first element)
 * @category CSS & Styling
 * @see bw.applyStyles
 * @see bw.clearStyles
 * @example
 * bw.toggleThemeMode();                   // global toggle on <html>
 * bw.toggleThemeMode('#my-dashboard');    // scoped toggle
 * bw.toggleThemeMode('.panel');           // toggle on ALL .panel elements
 */
/**
 * Validate a scope selector. Rejects complex/comma selectors.
 * @private
 * @param {string} scope
 * @returns {boolean}
 */
function _validateThemeScope(scope) {
  if (!scope) return true;
  // Reject comma-separated selectors
  if (scope.indexOf(',') !== -1) {
    bw.pub('bw:diag', { code: 'scope_rejected', ref: scope, msg: 'comma selectors not allowed' });
    return false;
  }
  // Reject descendant selectors (space-separated compound)
  if (/\s/.test(scope.trim())) {
    bw.pub('bw:diag', { code: 'scope_rejected', ref: scope, msg: 'complex selectors not allowed' });
    return false;
  }
  return true;
}

/**
 * Set the theme mode on all matching elements.
 *
 * @param {string} mode - 'primary' or 'alternate'
 * @param {string} [scope] - Selector. Omit for global (<html>).
 * @returns {Object} { mode, count } — the mode set and number of elements affected
 * @category CSS & Styling
 */
bw.setThemeMode = function(mode, scope) {
  if (!bw._isBrowser) return { mode: 'primary', count: 0 };
  if (!_validateThemeScope(scope)) return { mode: mode, count: 0 };
  var els;
  if (scope) {
    els = bw.$(scope);
  } else {
    els = [document.documentElement];
  }
  for (var i = 0; i < els.length; i++) {
    if (mode === 'alternate') {
      els[i].classList.add('bw_theme_alt');
    } else {
      els[i].classList.remove('bw_theme_alt');
    }
  }
  var result = { mode: mode, count: els.length };
  bw.pub('bw:thememode', { mode: mode, scope: scope || 'html', count: els.length });
  return result;
};

/**
 * Toggle between primary and alternate theme palettes.
 * Determines current mode from first matched element, then sets inverse on all.
 *
 * @param {string|Element} [scope] - Selector or element. Omit for global.
 * @returns {string} Active mode after toggle: 'primary' or 'alternate' (based on first element)
 * @category CSS & Styling
 */
bw.toggleThemeMode = function(scope) {
  if (!bw._isBrowser) return 'primary';
  if (!_validateThemeScope(scope)) return 'primary';
  var els;
  if (scope) {
    els = bw.$(scope);
  } else {
    els = [document.documentElement];
  }
  if (!els.length) return 'primary';

  // Determine inverse based on first element
  var firstHasAlt = els[0].classList.contains('bw_theme_alt');
  var newMode = firstHasAlt ? 'primary' : 'alternate';
  // Set all to the same mode
  for (var i = 0; i < els.length; i++) {
    if (newMode === 'alternate') {
      els[i].classList.add('bw_theme_alt');
    } else {
      els[i].classList.remove('bw_theme_alt');
    }
  }
  return newMode;
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

  // Also remove bw_theme_alt from ALL relevant elements
  if (scope && scope !== 'reset' && scope !== 'structural' && scope !== 'global') {
    var targets = bw.$(scope);
    for (var i = 0; i < targets.length; i++) {
      targets[i].classList.remove('bw_theme_alt');
    }
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
bw.colorParse = _colorParse;
bw.colorRgbToHsl = _colorRgbToHsl;
bw.colorHslToRgb = _colorHslToRgb;
bw.colorInterp = _colorInterp;

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
  
  /* c8 ignore start -- cookie parsing: jsdom doesn't support document.cookie in unit tests */
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === " ") c = c.substring(1);
    if (c.indexOf(name) === 0) return c.substring(name.length, c.length);
  }
  /* c8 ignore stop */
  
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
    
    /* c8 ignore next -- params.has() branch: jsdom window.location.search is always empty */
    return params.has(key) ? (params.get(key) || true) : defaultValue;
  /* c8 ignore start -- URLSearchParams never throws in test env */
  } catch (e) {
    return defaultValue;
  }
  /* c8 ignore stop */
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
    const textarea = bw.create({
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
    rowKey,
    pageSize,
    currentPage = 1,
    onPageChange
  } = config;

  // Build class list: always include bw_bccl_table, add striped/hover/selectable, append user className
  let cls = 'bw_bccl_table';
  if (striped) cls += ' bw_bccl_table_striped';
  if (hover || selectable) cls += ' bw_bccl_table_hover';
  if (selectable) cls += ' bw_bccl_table_selectable';
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

  // Build table header with scope="col" and aria-sort support
  const thead = {
    t: 'thead',
    c: {
      t: 'tr',
      c: cols.map(col => {
        var thAttrs = {
          scope: 'col',
          'data-col-key': col.key
        };
        if (sortable) {
          thAttrs.style = { cursor: 'pointer', userSelect: 'none' };
          // Wire the header to the table's own sort handle. Without this the
          // headers only *look* sortable: o.handle.sort does the work, but
          // nothing ever called it, so clicking a header did nothing.
          thAttrs.onclick = function(e) {
            var th = e.currentTarget;
            var tableEl = th.closest ? th.closest('table') : null;
            if (tableEl && tableEl.bw && typeof tableEl.bw.sort === 'function') {
              tableEl.bw.sort(col.key);
            }
          };
        }
        if (currentSortColumn === col.key) {
          thAttrs['aria-sort'] = currentSortDirection === 'asc' ? 'ascending' : 'descending';
        }
        return {
          t: 'th',
          a: thAttrs,
          c: [
            col.label,
            sortable && currentSortColumn === col.key && {
              t: 'span',
              a: { style: { marginLeft: '5px' } },
              c: currentSortDirection === 'asc' ? '\u25B2' : '\u25BC'
            }
          ].filter(Boolean)
        };
      })
    }
  };

  // Build table body with selectable/onRowClick support
  const tbody = {
    t: 'tbody',
    c: sortedData.map((row, idx) => {
      const globalIdx = pageSize ? (page - 1) * pageSize + idx : idx;
      const rowAttrs = {};
      if (rowKey && row[rowKey] !== undefined) {
        rowAttrs['data-row-key'] = String(row[rowKey]);
      }
      if (selectable || onRowClick) {
        rowAttrs.style = 'cursor:pointer;';
        rowAttrs.onclick = function(e) {
          if (selectable) {
            var tr = e.currentTarget;
            tr.classList.toggle('bw_bccl_table_row_selected');
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

  // Shared helper: sort the live table DOM
  function _sortTableDOM(el, column, direction) {
    var ths = el.querySelectorAll('th[data-col-key]');
    // Remove all aria-sort
    for (var h = 0; h < ths.length; h++) {
      ths[h].removeAttribute('aria-sort');
    }
    // Set aria-sort on the sorted column
    for (var h2 = 0; h2 < ths.length; h2++) {
      if (ths[h2].getAttribute('data-col-key') === column) {
        ths[h2].setAttribute('aria-sort', direction === 'asc' ? 'ascending' : 'descending');
        break;
      }
    }
  }

  // Shared helper: rebuild tbody rows from new data
  function _rebuildTbody(el, newData, colsDef, rKey) {
    var tbodyEl = el.querySelector('tbody');
    if (!tbodyEl) return;

    if (rKey) {
      // Keyed reconciliation: reuse existing row nodes
      var existingRows = {};
      var rows = tbodyEl.querySelectorAll('tr');
      for (var r = 0; r < rows.length; r++) {
        var k = rows[r].getAttribute('data-row-key');
        if (k !== null) existingRows[k] = rows[r];
      }

      // Build new order
      var frag = el.ownerDocument.createDocumentFragment();
      for (var d = 0; d < newData.length; d++) {
        var rowData = newData[d];
        var keyVal = String(rowData[rKey]);
        if (existingRows[keyVal]) {
          // Reuse existing row, update cells
          var tr = existingRows[keyVal];
          var cells = tr.querySelectorAll('td');
          for (var ci = 0; ci < colsDef.length; ci++) {
            if (cells[ci]) {
              var newText = colsDef[ci].render
                ? colsDef[ci].render(rowData[colsDef[ci].key], rowData)
                : String(rowData[colsDef[ci].key] || '');
              if (cells[ci].textContent !== newText) cells[ci].textContent = newText;
            }
          }
          frag.appendChild(tr);
        } else {
          // Create new row
          var newTr = el.ownerDocument.createElement('tr');
          newTr.setAttribute('data-row-key', keyVal);
          for (var ci2 = 0; ci2 < colsDef.length; ci2++) {
            var td = el.ownerDocument.createElement('td');
            td.textContent = colsDef[ci2].render
              ? colsDef[ci2].render(rowData[colsDef[ci2].key], rowData)
              : String(rowData[colsDef[ci2].key] || '');
            newTr.appendChild(td);
          }
          frag.appendChild(newTr);
        }
      }
      // Replace tbody contents
      while (tbodyEl.firstChild) tbodyEl.removeChild(tbodyEl.firstChild);
      tbodyEl.appendChild(frag);
    } else {
      // Full rebuild
      while (tbodyEl.firstChild) tbodyEl.removeChild(tbodyEl.firstChild);
      for (var d2 = 0; d2 < newData.length; d2++) {
        var tr2 = el.ownerDocument.createElement('tr');
        for (var ci3 = 0; ci3 < colsDef.length; ci3++) {
          var td2 = el.ownerDocument.createElement('td');
          td2.textContent = colsDef[ci3].render
            ? colsDef[ci3].render(newData[d2][colsDef[ci3].key], newData[d2])
            : String(newData[d2][colsDef[ci3].key] || '');
          tr2.appendChild(td2);
        }
        tbodyEl.appendChild(tr2);
      }
    }
  }

  const table = {
    t: 'table',
    a: { class: cls },
    c: [thead, tbody],
    o: {
      type: 'table',
      state: {
        data: data,
        columns: cols,
        sortColumn: currentSortColumn,
        sortDirection: currentSortDirection,
        rowKey: rowKey
      },
      handle: {
        sort: function(el, column, dir) {
          var state = el._bw_state || {};
          if (!dir) {
            if (state.sortColumn === column) {
              dir = state.sortDirection === 'asc' ? 'desc' : 'asc';
            } else {
              dir = 'asc';
            }
          }
          state.sortColumn = column;
          state.sortDirection = dir;
          _sortTableDOM(el, column, dir);

          // Re-sort and rebuild rows
          var d = state.data ? [...state.data] : [];
          d.sort(function(a, b) {
            var aVal = a[column];
            var bVal = b[column];
            if (typeof aVal === 'number' && typeof bVal === 'number') {
              return dir === 'asc' ? aVal - bVal : bVal - aVal;
            }
            var aStr = String(aVal || '').toLowerCase();
            var bStr = String(bVal || '').toLowerCase();
            return dir === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
          });
          _rebuildTbody(el, d, state.columns || cols, state.rowKey);

          if (onSort) onSort(column, dir);
        },
        update: function(el, newConfig) {
          if (!newConfig) return;
          var state = el._bw_state || {};
          if (newConfig.data) {
            state.data = newConfig.data;
            _rebuildTbody(el, newConfig.data, state.columns || cols, state.rowKey);
          }
        },
        setData: function(el, newData) {
          var state = el._bw_state || {};
          state.data = newData;
          _rebuildTbody(el, newData, state.columns || cols, state.rowKey);
        },
        getData: function(el) {
          return (el._bw_state && el._bw_state.data) || [];
        }
      }
    }
  };

  // If no pagination, return table directly
  if (!pageSize) return table;

  // Build pagination controls
  const pageButtons = [];
  pageButtons.push({
    t: 'button',
    a: {
      class: 'bw_bccl_btn bw_bccl_btn_sm',
      disabled: page <= 1 ? 'disabled' : undefined,
      onclick: page > 1 && onPageChange ? function() { onPageChange(page - 1); } : undefined
    },
    c: 'Prev'
  });
  pageButtons.push({
    t: 'span',
    a: { style: 'margin:0 0.5rem;font-size:0.875rem;' },
    c: 'Page ' + page + ' of ' + totalPages
  });
  pageButtons.push({
    t: 'button',
    a: {
      class: 'bw_bccl_btn bw_bccl_btn_sm',
      disabled: page >= totalPages ? 'disabled' : undefined,
      onclick: page < totalPages && onPageChange ? function() { onPageChange(page + 1); } : undefined
    },
    c: 'Next'
  });

  return {
    t: 'div',
    a: { class: 'bw_bccl_table_paginated' },
    c: [
      table,
      {
        t: 'div',
        a: { class: 'bw_bccl_table_pagination', style: 'display:flex;align-items:center;justify-content:flex-end;padding:0.5rem 0;gap:0.25rem;' },
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
    a: { class: 'bw_bccl_dataTable table-container' },
    c: content
  };
};

/**
 * Render a TACO into the DOM at a specific position relative to a target.
 *
 * Thin convenience factory over `bw.append()` / `bw.replace()`. Every code
 * path goes through the v2.1 lifecycle pipeline (create → insert → mountTree),
 * so mounted/unmount hooks, state, handles, and the janitor all work
 * automatically.
 *
 * @param {Element|string} target - Target element or CSS selector
 * @param {string} position - 'append', 'prepend', 'replace', 'before', 'after'
 * @param {Object} taco - TACO object to render
 * @returns {{ el: Element|null, ok: boolean, error: string|null }}
 * @category DOM Generation
 * @see bw.append
 * @see bw.replace
 * @example
 * var r = bw.render('#app', 'append', {
 *   t: 'button', a: { class: 'bw_btn' }, c: 'Click Me',
 *   o: { state: { clicks: 0 } }
 * });
 * if (r.ok) r.el.bw.myMethod();   // use component handle
 */
bw.render = function(target, position, taco) {
  try {
    var targetEl = _is(target, 'string') ? bw.$(target)[0] : target;
    if (!targetEl) return { el: null, ok: false, error: 'target not found' };

    var el;
    switch (position) {
      case 'append':
        el = bw.append(targetEl, taco);
        break;
      case 'prepend':
        el = bw.append(targetEl, taco, { before: 0 });
        break;
      case 'replace':
        el = bw.replace(targetEl, taco);
        break;
      case 'before':
        if (!targetEl.parentNode) return { el: null, ok: false, error: 'no parent for before' };
        el = bw.append(targetEl.parentNode, taco, { before: targetEl });
        break;
      case 'after':
        if (!targetEl.parentNode) return { el: null, ok: false, error: 'no parent for after' };
        el = bw.append(targetEl.parentNode, taco, { before: targetEl.nextSibling });
        break;
      default:
        return { el: null, ok: false, error: 'invalid position: ' + position };
    }
    return { el: el, ok: true, error: null };
  } catch (e) {
    return { el: null, ok: false, error: e.message };
  }
};

// =========================================================================
// Import and register router
// =========================================================================
import { initRouter } from './bitwrench-router.js';
initRouter(bw);

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

// Register makeTable (defined in bitwrench.js) in the shared BCCL registry
bw.BCCL.table = { make: bw.makeTable };
bw.BCCL.tableFromArray = { make: bw.makeTableFromArray };
bw.BCCL.dataTable = { make: bw.makeDataTable };
bw.BCCL.barChart = { make: bw.makeBarChart };

// Variant class helper: bw.variantClass('primary') → 'bw_primary'
bw.variantClass = components.variantClass;

// v2.1: codegen create* family removed (§12). Use bw.create(bw.makeX(props)) instead.

/**
 * Query the BCCL component registry. Returns metadata about registered
 * component types -- their names and factory function names. Useful for
 * tooling, introspection, documentation generators, and auto-complete
 * systems (including MCP/AG-UI tool discovery).
 *
 * With no arguments, returns an array of all registered component types.
 * With a type name, returns metadata for that single type (or null if
 * the type is not registered).
 *
 * @param {string} [type] - Optional component type name to look up
 * @returns {Array<Object>|Object|null} Array of {type, factory} objects,
 *   a single {type, factory} object, or null if the type is not found
 * @category Component
 * @see bw.make
 * @see bw.BCCL
 * @example
 * // List all available component types:
 * bw.catalog();
 * // => [{ type: 'card', factory: 'makeCard' },
 * //     { type: 'button', factory: 'makeButton' }, ...]
 *
 * // Look up a specific type:
 * bw.catalog('accordion');
 * // => { type: 'accordion', factory: 'makeAccordion' }
 *
 * // Check if a type exists:
 * if (bw.catalog('chart')) { ... }
 *
 * // Get just the type names:
 * bw.catalog().map(function(c) { return c.type; });
 * // => ['card', 'button', 'container', 'row', ...]
 */
bw.catalog = function(type) {
  if (type) {
    var def = bw.BCCL[type];
    if (!def) return null;
    return {
      type: type,
      factory: def.make.name || ('make' + type.charAt(0).toUpperCase() + type.slice(1))
    };
  }
  return Object.keys(bw.BCCL).map(function(k) {
    var def = bw.BCCL[k];
    return {
      type: k,
      factory: def.make.name || ('make' + k.charAt(0).toUpperCase() + k.slice(1))
    };
  });
};

// Export for different environments
export default bw;

// Also attach to global in browsers, with double-load guard
if (bw._isBrowser && typeof window !== 'undefined') {
  /* c8 ignore start -- double-load guard: only triggers when bitwrench is loaded twice */
  if (window.__bitwrench) {
    console.warn(
      'bitwrench: already loaded (v' + window.__bitwrench + '); ' +
      'loading v' + bw.version + ' over it.'
    );
  }
  /* c8 ignore stop */
  window.__bitwrench = bw.version;
  window.bw = bw;
}