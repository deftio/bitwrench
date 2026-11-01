/*! bitwrench-verify v2.1.12 | BSD-2-Clause | https://deftio.github.io/bitwrench/pages */
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.bwv = {}));
})(this, (function (exports) { 'use strict';

  /**
   * bitwrench-verify.js -- an opt-in checker for TACO objects.
   *
   * NOT part of bitwrench core and not a runtime dependency. bitwrench renders
   * without it, there is no required build, and verify does not add one. A person
   * looking at a page already has feedback; verify is for the run where nobody is
   * looking -- a test, a generated payload, a saved frame, a pipe in CI.
   *
   * Reach for it when the TACOs are generated, numerous, or leaving your hands.
   * Skip it when the shapes are fixed and few and someone can see the page.
   *
   *   import { verify } from 'bitwrench/verify';
   *   verify({ tag: 'h1', c: 'hi' });
   *   // [{ severity:'error', code:'not-an-element', path:'', key:'tag', hint:'t' }]
   *
   * Two modes. Authored (the default) allows functions in the slots the renderer
   * reads them from. Wire rejects them, because JSON cannot carry a function and
   * bw.apply() strips string handlers -- so a frame carrying either is not what
   * its author thinks it is.
   *
   * Design: dev/bw-verify-design.md. Grammar: dev/bw-taco-schema-draft.md.
   * Every rule here was measured against the renderer, not inferred.
   *
   * @module bitwrench-verify
   */

  /* ── The grammar, as the renderer actually implements it ─────────────── */

  // Top-level TACO keys. `additionalProperties: false` in schema terms -- this is
  // what catches `tag`, `cc`, `attrs`, `children`.
  var TACO_KEYS = ['t', 'a', 'c', 'o'];

  // Option keys the renderer consults, from hasOpts (bitwrench.js ~921) and
  // hasLifecycle (~1302). NOT from TacoOptions in the .d.ts: that interface
  // carried `userTag` and `events` for several releases while no renderer path
  // read them. The drift-lint rule `taco-options-drift` now fails the build if
  // the two disagree, and tier 2 reads this set from the generated manifest.
  var OPT_FUNCTION_KEYS = ['mounted', 'unmount', 'render'];
  var OPT_FUNCTION_MAP_KEYS = ['handle'];
  var OPT_DATA_KEYS = ['type', 'state', 'slots'];

  // Names the library treats specially. An attribute one edit away from one of
  // these is probably a typo; everything else is forwarded on purpose (viewBox,
  // stroke-width, aria-*, data-*), so there is no whitelist here.
  var SPECIAL_ATTRS = ['class', 'style', 'id', 'for', 'tabindex', 'value'];

  // ...except that some REAL attributes are one edit from a special one, and
  // "did you mean" is wrong about them. `form` is one insert from `for`; `is`
  // (customized built-in elements) is one substitution from `id`. Both are valid
  // HTML, both rendered fine, and both failed --strict. A suggestion is only
  // useful when the thing it is correcting is not already correct, so a name in
  // this set is never offered a hint.
  //
  // This is the standard-attribute surface, not an allowlist for attributes in
  // general: anything unrecognised is still forwarded without comment.
  var REAL_ATTRS = [
    'abbr', 'accept', 'accesskey', 'action', 'allow', 'alt', 'as', 'async',
    'autocapitalize', 'autocomplete', 'autofocus', 'autoplay', 'capture',
    'charset', 'checked', 'cite', 'cols', 'colspan', 'content', 'contenteditable',
    'controls', 'coords', 'crossorigin', 'datetime', 'decoding', 'default',
    'defer', 'dir', 'dirname', 'disabled', 'download', 'draggable', 'enctype',
    'enterkeyhint', 'fetchpriority', 'form', 'formaction', 'formenctype',
    'formmethod', 'formnovalidate', 'formtarget', 'headers', 'height', 'hidden',
    'high', 'href', 'hreflang', 'inert', 'inputmode', 'integrity', 'is',
    'ismap', 'itemprop', 'kind', 'label', 'lang', 'list', 'loading', 'loop',
    'low', 'max', 'maxlength', 'media', 'method', 'min', 'minlength', 'multiple',
    'muted', 'name', 'nomodule', 'novalidate', 'open', 'optimum', 'pattern',
    'ping', 'placeholder', 'playsinline', 'popover', 'popovertarget', 'poster',
    'preload', 'readonly', 'referrerpolicy', 'rel', 'required', 'reversed',
    'role', 'rows', 'rowspan', 'sandbox', 'scope', 'selected', 'shape', 'size',
    'sizes', 'slot', 'span', 'spellcheck', 'src', 'srcdoc', 'srclang', 'srcset',
    'start', 'step', 'target', 'title', 'translate', 'type', 'usemap', 'width',
    'wrap'
  ];

  // Raw content that executes. Not a safety guarantee -- see rawFindings().
  var RAW_HANDLER = /<[^>]+\s+on[a-z]+\s*=/i;
  var RAW_JS_URL = /(?:href|src|action|formaction)\s*=\s*["']?\s*javascript:/i;
  var RAW_SCRIPT = /<\s*script\b/i;
  var RAW_SRCDOC = /\bsrcdoc\s*=/i;

  var MAX_DEPTH = 512;

  /* ── Helpers ─────────────────────────────────────────────────────────── */

  function isPlainObject(v) {
    return v !== null && typeof v === 'object' && !Array.isArray(v);
  }

  // Strictly a plain object: `{}` or Object.create(null). This is the test the
  // renderer effectively applies, because bw.typeOf() returns the constructor
  // name ('Date', 'Map', 'Widget') for anything else, and `_is(x, 'object')` is
  // therefore false -- so a non-plain object NEVER takes the element path, even
  // when it has a `t`. A class instance carrying `t` renders `[object Object]`,
  // which is the nastiest version of this mistake: it looks like a TACO.
  // Callers must already know `v` is a plain object (see the single call site in
  // walk()); re-checking here only added an unreachable branch.
  function isPlainTacoObject(v) {
    var proto = Object.getPrototypeOf(v);
    return proto === Object.prototype || proto === null;
  }

  // Levenshtein distance, capped: we only care about "one edit away".
  function oneEditFrom(a, b) {
    if (a === b) return false;
    var la = a.length, lb = b.length;
    if (Math.abs(la - lb) > 1) return false;
    var i = 0, j = 0, edits = 0;
    while (i < la && j < lb) {
      if (a[i] === b[j]) { i++; j++; continue; }
      if (++edits > 1) return false;
      if (la > lb) i++;
      else if (lb > la) j++;
      else { i++; j++; }
    }
    if (i < la || j < lb) edits++;
    return edits <= 1;
  }

  function nearestSpecialAttr(name) {
    var lower = String(name).toLowerCase();
    for (var i = 0; i < SPECIAL_ATTRS.length; i++) {
      if (oneEditFrom(lower, SPECIAL_ATTRS[i])) return SPECIAL_ATTRS[i];
    }
    return null;
  }

  function nearestTacoKey(name) {
    for (var i = 0; i < TACO_KEYS.length; i++) {
      if (oneEditFrom(String(name).toLowerCase(), TACO_KEYS[i])) return TACO_KEYS[i];
    }
    // `children` and `attrs` are more than one edit out but are the two mistakes
    // people actually make, coming from other libraries.
    var known = { children: 'c', content: 'c', attrs: 'a', attributes: 'a',
      tag: 't', tagName: 't', opts: 'o', options: 'o' };
    return known[name] || null;
  }

  // Wire mode: find a function anywhere inside a data value.
  //
  // The top-level checks caught `a.onclick` and `o.handle`, but a function
  // nested in `o.state` or inside an `a.style` object produced no finding.
  // JSON.stringify then drops it silently, so the frame that left the checker
  // was not the frame that arrived -- which is the one thing wire mode exists to
  // prevent. Depth-capped and cycle-guarded, because state is the caller's data
  // and may be either.
  function scanForFunctions(ctx, value, path, depth, seen) {
    if (depth > 32) return;
    if (typeof value === 'function') {
      ctx.add('error', 'function-in-wire', path);
      return;
    }
    if (!value || typeof value !== 'object') return;
    if (seen.indexOf(value) !== -1) return;
    seen.push(value);
    if (Array.isArray(value)) {
      for (var i = 0; i < value.length; i++) {
        scanForFunctions(ctx, value[i], path + '[' + i + ']', depth + 1, seen);
      }
    } else {
      var ks = Object.keys(value);
      for (var j = 0; j < ks.length; j++) {
        scanForFunctions(ctx, value[ks[j]], path + '.' + ks[j], depth + 1, seen);
      }
    }
    seen.pop();
  }

  /* ── The walk ────────────────────────────────────────────────────────── */

  function Ctx(mode, ignore) {
    this.mode = mode === 'wire' ? 'wire' : 'authored';
    this.ignore = ignore || [];
    this.findings = [];
    this.suppressed = 0;
    this.suppressedCodes = [];
    this.seen = [];          // cycle detection; arrays stay small in practice
    this.rawNoted = false;   // raw-unchecked is once per tree, not per node
  }

  Ctx.prototype.add = function(severity, code, path, key, hint) {
    // `all` is deliberately not honoured: you silence a code, never the tool.
    if (code !== 'cycle' && this.ignore.indexOf(code) !== -1) {
      this.suppressed++;
      if (this.suppressedCodes.indexOf(code) === -1) this.suppressedCodes.push(code);
      return;
    }
    var f = { severity: severity, code: code, path: path };
    if (key !== undefined && key !== null) f.key = key;
    if (hint) f.hint = hint;
    this.findings.push(f);
  };

  function rawFindings(ctx, node, path) {
    var v = node.v;
    var unsafe = [];
    if (RAW_HANDLER.test(v)) unsafe.push('an event-handler attribute');
    if (RAW_JS_URL.test(v)) unsafe.push('a javascript: URL');
    if (RAW_SRCDOC.test(v)) unsafe.push('srcdoc');
    // A <script> inserted via innerHTML is inert by spec, but bw.html() returns
    // the string verbatim into a document, where it executes on parse. Verify
    // does not always know the destination, so it reports and lets you decide.
    if (RAW_SCRIPT.test(v)) unsafe.push('a <script> tag (executes via bw.html, inert via innerHTML)');

    if (unsafe.length) {
      ctx.add('warn', 'raw-unsafe', path, unsafe.join(', '));
      return;
    }
    // Verify will not claim raw content is safe: a pattern scan loses to
    // mutation-XSS and to encodings it does not normalise. Said once per tree.
    if (!ctx.rawNoted) {
      ctx.rawNoted = true;
      ctx.add('warn', 'raw-unchecked', path);
    }
  }

  function checkAttrs(ctx, attrs, path) {
    if (!isPlainObject(attrs)) {
      ctx.add('error', 'attrs-not-object', path);
      return;
    }
    var keys = Object.keys(attrs);
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i];
      var v = attrs[k];
      var p = path + '.' + k;

      // null and undefined are legal for ANY attribute: the renderer omits them.
      // This is not a corner case -- every BCCL factory writes
      // `style: props.style`, so `style: undefined` is the single most common
      // attribute value in the library. The first dogfood run over 10 factories
      // reported four false errors until this was here.
      if (v === null || v === undefined) continue;

      if (k === 'class') {
        // The renderer does array.filter(Boolean).join(' '), so false, null, 0
        // and '' drop out. `class: [isOn && 'bw_active', 'bw_btn']` is the
        // idiomatic conditional form and mounts correctly with isOn false --
        // requiring every entry to be a string made verify reject it.
        // Only a TRUTHY non-string is a problem: it survives the filter and
        // joins into the class list as whatever String() makes of it.
        var okClass = typeof v === 'string' ||
          (Array.isArray(v) && v.every(function(x) {
            return !x || typeof x === 'string';
          }));
        if (!okClass) ctx.add('error', 'bad-class', p, k);
        continue;
      }
      // An object attribute value (style, most often) can hide a function.
      if (ctx.mode === 'wire' && v && typeof v === 'object') {
        scanForFunctions(ctx, v, p, 0, []);
      }
      if (k === 'style') {
        // string or object, both render (object -> "color:red")
        if (typeof v !== 'string' && !isPlainObject(v)) ctx.add('error', 'bad-style', p, k);
        continue;
      }

      var isHandler = k.length > 2 && k.slice(0, 2).toLowerCase() === 'on';

      if (typeof v === 'function') {
        if (ctx.mode === 'wire') {
          ctx.add('error', 'function-in-wire', p, k);
        } else if (!isHandler) {
          // The renderer only calls a function value when the key starts with
          // `on`; anywhere else it is stringified into an attribute.
          ctx.add('error', 'function-not-handler', p, k);
        }
        continue;
      }

      if (isHandler && typeof v === 'string') {
        // Correct for bw.html() and htmlPage({runtime:'shim'}), which serialise
        // it. Stripped by _sanitizeWireTaco, so a dead control on a frame.
        ctx.add(ctx.mode === 'wire' ? 'error' : 'warn', 'handler-string', p, k);
        continue;
      }

      // A real attribute is not a typo, however close it looks.
      if (REAL_ATTRS.indexOf(k.toLowerCase()) !== -1) continue;
      var near = nearestSpecialAttr(k);
      if (near) ctx.add('warn', 'attr-typo', p, k, near);
    }
  }

  function checkOpts(ctx, o, path) {
    if (!isPlainObject(o)) {
      ctx.add('error', 'opts-not-object', path);
      return;
    }
    var keys = Object.keys(o);
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i];
      var v = o[k];
      var p = path + '.' + k;
      var isFn = OPT_FUNCTION_KEYS.indexOf(k) !== -1;
      var isFnMap = OPT_FUNCTION_MAP_KEYS.indexOf(k) !== -1;

      if (ctx.mode === 'wire' && (typeof v === 'function' || (isFnMap && isPlainObject(v) &&
          Object.keys(v).some(function(h) { return typeof v[h] === 'function'; })))) {
        ctx.add('error', 'function-in-wire', p, k);
        continue;
      }
      // The type check runs in BOTH modes. It used to be authored-only, so the
      // CLI -- which defaults to wire -- said nothing about `o: {mounted:'init'}`:
      // a hook that cannot run, in the mode where you are least able to see it.
      if (isFn && typeof v !== 'function') {
        ctx.add('error', 'opt-not-function', p, k);
        continue;
      }
      // `handle` must be a map of functions. A STRING handle was clean in both
      // modes and crashes hydration: the renderer iterates the value's keys and
      // calls .bind on each one, so 'ab' becomes a .bind on 'a'.
      if (isFnMap && !isPlainObject(v)) {
        ctx.add('error', 'opt-not-object', p, k);
        continue;
      }
      // `slots` must be a map of selectors. A string built one setter per
      // character.
      if (k === 'slots' && v !== undefined && v !== null && !isPlainObject(v)) {
        ctx.add('error', 'opt-not-object', p, k);
        continue;
      }
      // state/slots/type are data; in wire mode a function buried in them is
      // dropped by JSON.stringify without anyone noticing.
      if (ctx.mode === 'wire' && OPT_DATA_KEYS.indexOf(k) !== -1 && v && typeof v === 'object') {
        scanForFunctions(ctx, v, p, 0, []);
      }
      if (OPT_DATA_KEYS.indexOf(k) === -1 && !isFn && !isFnMap) {
        // Tier 1 does not own the option-key list -- tier 2 reads it from the
        // generated manifest, so this stays a warning until that lands rather
        // than hardcoding a second copy of the renderer's set.
        ctx.add('warn', 'unknown-opt-maybe', p, k);
      }
    }
  }

  function walk(ctx, node, path, depth) {
    if (depth > MAX_DEPTH) {
      ctx.add('error', 'too-deep', path);
      return;
    }

    // Content primitives. All of these render: strings and numbers are
    // stringified, booleans too, null is skipped.
    if (node === null || node === undefined) return;
    var t = typeof node;
    if (t === 'string' || t === 'number' || t === 'boolean') return;
    if (t === 'function') {
      ctx.add('error', ctx.mode === 'wire' ? 'function-in-wire' : 'function-as-content', path);
      return;
    }

    if (Array.isArray(node)) {
      for (var i = 0; i < node.length; i++) {
        walk(ctx, node[i], path + '[' + i + ']', depth + 1);
      }
      return;
    }

    // A non-plain object (Date, Map, Set, a class instance) is stringified by
    // the renderer, never treated as an element. Measured:
    //   c: new Date(0)      -> "Wed Dec 31 1969 17:00:00 GMT-0700 (...)"
    //   c: new Map([[1,2]]) -> "[object Map]"
    //   new Widget() with t -> "[object Object]"
    // The first renders something legible but locale-dependent; the others
    // render nothing anyone wanted. An instance carrying a `t` is the worst of
    // the three, because the author believes they wrote a TACO.
    if (isPlainObject(node) && !isPlainTacoObject(node)) {
      if ('t' in node) {
        ctx.add('error', 'not-an-element', path, 't',
          'a plain object -- a class instance renders [object Object]');
      } else {
        ctx.add('warn', 'object-as-content', path, undefined,
          'it will be stringified');
      }
      return;
    }
    if (!isPlainObject(node)) return;

    if (ctx.seen.indexOf(node) !== -1) {
      ctx.add('error', 'cycle', path);
      return;
    }
    ctx.seen.push(node);

    // Raw nodes are handled before the `t` check, exactly as the renderer does.
    if (node.__bw_raw) {
      var extra = Object.keys(node).filter(function(k) {
        return k !== '__bw_raw' && k !== 'v';
      });
      if (typeof node.v !== 'string' || extra.length) {
        ctx.add('error', 'bad-raw', path, extra.length ? extra[0] : 'v');
      } else {
        rawFindings(ctx, node, path);
      }
      ctx.seen.pop();
      return;
    }

    // An object with no `t` is not an element. The renderer falls through to
    // document.createTextNode(String(taco)), which is the [object Object] bug.
    if (!('t' in node)) {
      var hint = null;
      var keys0 = Object.keys(node);
      for (var h = 0; h < keys0.length && !hint; h++) {
        if (nearestTacoKey(keys0[h]) === 't') hint = 't';
      }
      ctx.add('error', 'not-an-element', path, keys0.length ? keys0[0] : undefined, hint || 't');
      ctx.seen.pop();
      return;
    }

    if (typeof node.t !== 'string' || !node.t) {
      ctx.add('error', 't-not-string', path, 't');
    }

    var keys = Object.keys(node);
    for (var k = 0; k < keys.length; k++) {
      if (TACO_KEYS.indexOf(keys[k]) === -1) {
        ctx.add('error', 'unknown-key', path, keys[k], nearestTacoKey(keys[k]));
      }
    }

    if ('a' in node && node.a !== null && node.a !== undefined) {
      checkAttrs(ctx, node.a, path ? path + '.a' : 'a');
    }
    if ('o' in node && node.o !== null && node.o !== undefined) {
      checkOpts(ctx, node.o, path ? path + '.o' : 'o');
    }
    if ('c' in node) {
      walk(ctx, node.c, path ? path + '.c' : 'c', depth + 1);
    }

    ctx.seen.pop();
  }

  /* ── Public API ──────────────────────────────────────────────────────── */

  /**
   * Check a TACO, an array of them, or anything you would pass to bw.mount().
   *
   * Never throws, never mutates the input. Returns an array of findings, with
   * `suppressed` and `suppressedCodes` attached so a project can see what it is
   * carrying rather than silencing things invisibly.
   *
   * @param {*} input - TACO, array of TACOs, or content
   * @param {Object} [opts]
   * @param {'authored'|'wire'} [opts.mode='authored'] - wire rejects functions
   *   and string `on*` handlers, because neither survives JSON or bw.apply()
   * @param {string[]} [opts.ignore] - finding codes to suppress. Codes only:
   *   'all' is not honoured
   * @returns {Array<{severity:string,code:string,path:string,key?:string,hint?:string}>}
   */
  function verify(input, opts) {
    opts = opts || {};
    var ctx = new Ctx(opts.mode, opts.ignore);
    try {
      walk(ctx, input, '', 0);
    } catch (e) {
      /* A checker that throws is worse than one that misses something. */
      ctx.findings.push({ severity: 'error', code: 'verify-failed', path: '', key: e.message });
    }
    var out = ctx.findings;
    // Non-enumerable on purpose. The natural assertion a caller writes is
    // `assert.deepStrictEqual(verify(taco), [])`, and deepStrictEqual compares
    // own ENUMERABLE properties -- attaching these plainly made a clean run
    // fail that check. Found by the fixture corpus before any user hit it.
    Object.defineProperty(out, 'suppressed', { value: ctx.suppressed, enumerable: false });
    Object.defineProperty(out, 'suppressedCodes', { value: ctx.suppressedCodes, enumerable: false });
    return out;
  }

  /**
   * Like verify(), but throws when there is anything to report. For tests.
   *
   * Errors always throw. Warnings throw only with `strict`, because a warning
   * means "legal, and verify cannot tell what you meant" -- failing a run on one
   * by default would make the tool something people switch off.
   *
   * @param {*} input - TACO to check
   * @param {Object} [opts] - verify() options, plus `strict` to fail on warnings
   * @returns {true} when clean
   */
  verify.assert = function(input, opts) {
    opts = opts || {};
    var findings = verify(input, opts);
    var fatal = findings.filter(function(f) {
      return f.severity === 'error' || (opts.strict && f.severity === 'warn');
    });
    if (!fatal.length) return true;
    var lines = fatal.map(function(f) {
      return f.code + ' at \'' + f.path + '\'' +
        (f.key ? ' (' + f.key + (f.hint ? ' -- did you mean ' + f.hint + '?' : '') + ')' : '');
    });
    throw new Error('bitwrench-verify: ' + lines.join('; '));
  };

  /* c8 ignore start -- browser global, exercised by the bundle smoke test */
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    window.bwv = window.bwv || {};
    window.bwv.verify = verify;
  }
  /* c8 ignore stop */

  exports.default = verify;
  exports.verify = verify;

  Object.defineProperty(exports, '__esModule', { value: true });

}));
//# sourceMappingURL=bitwrench-verify.js.map
