/*! bitwrench-util-css v2.0.27 | BSD-2-Clause | https://deftio.github.com/bitwrench/pages */
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.bwUtilCSS = {}));
})(this, (function (exports) { 'use strict';

  /**
   * bitwrench-util-css.js - Rule-based CSS utility parser plugin
   *
   * Replaces the old static `bw.u` dictionary with a parser that generates
   * style objects, CSS strings, or class names from shorthand tokens.
   *
   * Three output methods:
   *   bw.u('flex gap4 p4')       → { display: 'flex', gap: '1rem', padding: '1rem' }
   *   bw.u.css('flex gap4 p4')   → "display:flex;gap:1rem;padding:1rem"
   *   bw.u.cls('flex gap4 p4')   → "bw_flex bw_gap_4 bw_p_4"
   *   bw.u.extend({ name: fn })  → register custom rules
   *
   * Can be loaded standalone (browser script tag after bitwrench.umd.js),
   * or imported as an ES module / CJS module.
   *
   * @module bitwrench-util-css
   * @license BSD-2-Clause
   */

  // -- Scale: n → rem (0.25rem increments) ---------------------------------
  function _rem(n) { return (n * 0.25) + 'rem'; }

  // -- Built-in parametric rules -------------------------------------------
  // Each returns a style object or null (not recognized).
  var PARAMETRIC = {
    p:   function(n) { return { padding: _rem(n) }; },
    pt:  function(n) { return { paddingTop: _rem(n) }; },
    pb:  function(n) { return { paddingBottom: _rem(n) }; },
    pl:  function(n) { return { paddingLeft: _rem(n) }; },
    pr:  function(n) { return { paddingRight: _rem(n) }; },
    px:  function(n) { return { paddingLeft: _rem(n), paddingRight: _rem(n) }; },
    py:  function(n) { return { paddingTop: _rem(n), paddingBottom: _rem(n) }; },
    m:   function(n) { return { margin: _rem(n) }; },
    mt:  function(n) { return { marginTop: _rem(n) }; },
    mb:  function(n) { return { marginBottom: _rem(n) }; },
    ml:  function(n) { return { marginLeft: _rem(n) }; },
    mr:  function(n) { return { marginRight: _rem(n) }; },
    mx:  function(n) { return { marginLeft: _rem(n), marginRight: _rem(n) }; },
    my:  function(n) { return { marginTop: _rem(n), marginBottom: _rem(n) }; },
    gap: function(n) { return { gap: _rem(n) }; },
    w:   function(n) { return { width: _rem(n) }; },
    h:   function(n) { return { height: _rem(n) }; },
    rounded: function(n) { return { borderRadius: _rem(n) }; },
    textSm:   function()  { return { fontSize: '0.875rem' }; },
    textBase: function()  { return { fontSize: '1rem' }; },
    textLg:   function()  { return { fontSize: '1.125rem' }; },
    textXl:   function()  { return { fontSize: '1.25rem' }; },
    text2xl:  function()  { return { fontSize: '1.5rem' }; },
    text3xl:  function()  { return { fontSize: '1.875rem' }; }
  };

  // -- Static keywords (no numeric param) ----------------------------------
  var STATICS = {
    flex:           { display: 'flex' },
    flexCol:        { display: 'flex', flexDirection: 'column' },
    flexRow:        { display: 'flex', flexDirection: 'row' },
    flexWrap:       { display: 'flex', flexWrap: 'wrap' },
    block:          { display: 'block' },
    inline:         { display: 'inline' },
    hidden:         { display: 'none' },
    bold:           { fontWeight: '700' },
    semibold:       { fontWeight: '600' },
    italic:         { fontStyle: 'italic' },
    textCenter:     { textAlign: 'center' },
    textRight:      { textAlign: 'right' },
    justifyCenter:  { justifyContent: 'center' },
    justifyBetween: { justifyContent: 'space-between' },
    justifyEnd:     { justifyContent: 'flex-end' },
    alignCenter:    { alignItems: 'center' },
    alignStart:     { alignItems: 'flex-start' },
    alignEnd:       { alignItems: 'flex-end' },
    wFull:          { width: '100%' },
    hFull:          { height: '100%' },
    transition:     { transition: 'all 0.2s ease' }
  };

  // -- Custom rules (added via u.extend) -----------------------------------
  var _custom = {};

  // -- Token parser --------------------------------------------------------
  // Regex: split on whitespace
  var _splitRe = /\s+/;

  // Match parametric token: name + digits, e.g. "p4", "gap8", "rounded2"
  var _paramRe = /^([a-zA-Z]+?)(\d+)$/;

  // Match color rules: bg-<name>, text-<name>, bg-[#hex]
  var _bgBracketRe = /^bg-\[([^\]]+)\]$/;
  var _textBracketRe = /^text-\[([^\]]+)\]$/;
  var _bgNameRe = /^bg-(.+)$/;
  var _textNameRe = /^text-(.+)$/;

  /**
   * Parse a single token into a style object, or null if unknown.
   */
  function _parseToken(token) {
    // 1. Custom rules first
    if (_custom[token]) {
      var val = _custom[token];
      return typeof val === 'function' ? val(token) : val;
    }

    // 2. Static keywords
    if (STATICS[token]) return STATICS[token];

    // 3. Parametric rules (e.g. p4, gap8, mb2)
    var pm = _paramRe.exec(token);
    if (pm) {
      var name = pm[1];
      var num = parseInt(pm[2], 10);
      if (PARAMETRIC[name]) return PARAMETRIC[name](num);
    }

    // 4. Non-numeric parametric (text sizes like textSm)
    if (PARAMETRIC[token]) return PARAMETRIC[token]();

    // 5. Color: bg-[#hex]
    var bgBr = _bgBracketRe.exec(token);
    if (bgBr) return { background: bgBr[1] };

    // 6. Color: text-[#hex]
    var textBr = _textBracketRe.exec(token);
    if (textBr) return { color: textBr[1] };

    // 7. Color: bg-<name>
    var bgN = _bgNameRe.exec(token);
    if (bgN) return { background: bgN[1] };

    // 8. Color: text-<name>
    var textN = _textNameRe.exec(token);
    if (textN) return { color: textN[1] };

    // Unknown → silently ignored
    return null;
  }

  /**
   * Parse a space-separated string of utility tokens into a merged style object.
   *
   * @param {string} str - Space-separated utility tokens
   * @returns {Object} Merged style object
   */
  function u(str) {
    if (!str || typeof str !== 'string') return {};
    var tokens = str.trim().split(_splitRe);
    var result = {};
    for (var i = 0; i < tokens.length; i++) {
      var style = _parseToken(tokens[i]);
      if (style) {
        var keys = Object.keys(style);
        for (var j = 0; j < keys.length; j++) {
          result[keys[j]] = style[keys[j]];
        }
      }
    }
    return result;
  }

  /**
   * Parse tokens and return a CSS declaration string.
   *
   * @param {string} str - Space-separated utility tokens
   * @returns {string} CSS declarations (e.g. "display:flex;gap:1rem")
   */
  u.css = function(str) {
    var style = u(str);
    var parts = [];
    var keys = Object.keys(style);
    for (var i = 0; i < keys.length; i++) {
      // Convert camelCase to kebab-case
      var prop = keys[i].replace(/([A-Z])/g, function(m) { return '-' + m.toLowerCase(); });
      parts.push(prop + ':' + style[keys[i]]);
    }
    return parts.join(';');
  };

  /**
   * Parse tokens and return BEM-style class names (bw_ prefixed).
   *
   * @param {string} str - Space-separated utility tokens
   * @returns {string} Space-separated class names
   */
  u.cls = function(str) {
    if (!str || typeof str !== 'string') return '';
    var tokens = str.trim().split(_splitRe);
    var classes = [];
    for (var i = 0; i < tokens.length; i++) {
      var token = tokens[i];
      // Only emit classes for recognized tokens
      if (_parseToken(token)) {
        // Convert camelCase to underscore, digits get underscore prefix
        var cls = 'bw_' + token
          .replace(/([A-Z])/g, function(m) { return '_' + m.toLowerCase(); })
          .replace(/(\d+)/g, function(m) { return '_' + m; });
        classes.push(cls);
      }
    }
    return classes.join(' ');
  };

  /**
   * Register custom rules. Each key is a token name, value is either
   * a style object or a function returning a style object.
   *
   * @param {Object} rules - Map of token → style object or function
   */
  u.extend = function(rules) {
    if (!rules || typeof rules !== 'object') return;
    var keys = Object.keys(rules);
    for (var i = 0; i < keys.length; i++) {
      _custom[keys[i]] = rules[keys[i]];
    }
  };

  // -- Plugin installation -------------------------------------------------
  function install(bw) {
    if (!bw) return;
    bw.utilCSS = u;
    bw.u = u;
  }

  // Auto-install if bw is on window (script tag usage)
  if (typeof window !== 'undefined' && window.bw) {
    install(window.bw);
  }
  var bitwrenchUtilCss = { utilCSS: u, install };

  exports.default = bitwrenchUtilCss;
  exports.install = install;
  exports.utilCSS = u;

  Object.defineProperty(exports, '__esModule', { value: true });

}));
//# sourceMappingURL=bitwrench-util-css.umd.js.map
