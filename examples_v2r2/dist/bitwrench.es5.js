(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.bw = factory());
})(this, (function () { 'use strict';

  function _arrayLikeToArray(r, a) {
    (null == a || a > r.length) && (a = r.length);
    for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e];
    return n;
  }
  function _arrayWithHoles(r) {
    if (Array.isArray(r)) return r;
  }
  function _arrayWithoutHoles(r) {
    if (Array.isArray(r)) return _arrayLikeToArray(r);
  }
  function _classCallCheck(a, n) {
    if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function");
  }
  function _defineProperties(e, r) {
    for (var t = 0; t < r.length; t++) {
      var o = r[t];
      o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o);
    }
  }
  function _createClass(e, r, t) {
    return r && _defineProperties(e.prototype, r), Object.defineProperty(e, "prototype", {
      writable: !1
    }), e;
  }
  function _createForOfIteratorHelper(r, e) {
    var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"];
    if (!t) {
      if (Array.isArray(r) || (t = _unsupportedIterableToArray(r)) || e) {
        t && (r = t);
        var n = 0,
          F = function () {};
        return {
          s: F,
          n: function () {
            return n >= r.length ? {
              done: !0
            } : {
              done: !1,
              value: r[n++]
            };
          },
          e: function (r) {
            throw r;
          },
          f: F
        };
      }
      throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
    }
    var o,
      a = !0,
      u = !1;
    return {
      s: function () {
        t = t.call(r);
      },
      n: function () {
        var r = t.next();
        return a = r.done, r;
      },
      e: function (r) {
        u = !0, o = r;
      },
      f: function () {
        try {
          a || null == t.return || t.return();
        } finally {
          if (u) throw o;
        }
      }
    };
  }
  function _defineProperty(e, r, t) {
    return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, {
      value: t,
      enumerable: !0,
      configurable: !0,
      writable: !0
    }) : e[r] = t, e;
  }
  function _iterableToArray(r) {
    if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r);
  }
  function _iterableToArrayLimit(r, l) {
    var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"];
    if (null != t) {
      var e,
        n,
        i,
        u,
        a = [],
        f = !0,
        o = !1;
      try {
        if (i = (t = t.call(r)).next, 0 === l) ; else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0);
      } catch (r) {
        o = !0, n = r;
      } finally {
        try {
          if (!f && null != t.return && (u = t.return(), Object(u) !== u)) return;
        } finally {
          if (o) throw n;
        }
      }
      return a;
    }
  }
  function _nonIterableRest() {
    throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
  }
  function _nonIterableSpread() {
    throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
  }
  function ownKeys(e, r) {
    var t = Object.keys(e);
    if (Object.getOwnPropertySymbols) {
      var o = Object.getOwnPropertySymbols(e);
      r && (o = o.filter(function (r) {
        return Object.getOwnPropertyDescriptor(e, r).enumerable;
      })), t.push.apply(t, o);
    }
    return t;
  }
  function _objectSpread2(e) {
    for (var r = 1; r < arguments.length; r++) {
      var t = null != arguments[r] ? arguments[r] : {};
      r % 2 ? ownKeys(Object(t), !0).forEach(function (r) {
        _defineProperty(e, r, t[r]);
      }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) {
        Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r));
      });
    }
    return e;
  }
  function _objectWithoutProperties(e, t) {
    if (null == e) return {};
    var o,
      r,
      i = _objectWithoutPropertiesLoose(e, t);
    if (Object.getOwnPropertySymbols) {
      var s = Object.getOwnPropertySymbols(e);
      for (r = 0; r < s.length; r++) o = s[r], t.includes(o) || {}.propertyIsEnumerable.call(e, o) && (i[o] = e[o]);
    }
    return i;
  }
  function _objectWithoutPropertiesLoose(r, e) {
    if (null == r) return {};
    var t = {};
    for (var n in r) if ({}.hasOwnProperty.call(r, n)) {
      if (e.includes(n)) continue;
      t[n] = r[n];
    }
    return t;
  }
  function _slicedToArray(r, e) {
    return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest();
  }
  function _toConsumableArray(r) {
    return _arrayWithoutHoles(r) || _iterableToArray(r) || _unsupportedIterableToArray(r) || _nonIterableSpread();
  }
  function _toPrimitive(t, r) {
    if ("object" != typeof t || !t) return t;
    var e = t[Symbol.toPrimitive];
    if (void 0 !== e) {
      var i = e.call(t, r || "default");
      if ("object" != typeof i) return i;
      throw new TypeError("@@toPrimitive must return a primitive value.");
    }
    return ("string" === r ? String : Number)(t);
  }
  function _toPropertyKey(t) {
    var i = _toPrimitive(t, "string");
    return "symbol" == typeof i ? i : i + "";
  }
  function _typeof(o) {
    "@babel/helpers - typeof";

    return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) {
      return typeof o;
    } : function (o) {
      return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o;
    }, _typeof(o);
  }
  function _unsupportedIterableToArray(r, a) {
    if (r) {
      if ("string" == typeof r) return _arrayLikeToArray(r, a);
      var t = {}.toString.call(r).slice(8, -1);
      return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0;
    }
  }

  /**
   * Auto-generated version file from package.json
   * DO NOT EDIT DIRECTLY - Use npm run generate-version
   */

  var VERSION_INFO = {
    version: '2.0.3',
    name: 'bitwrench',
    description: 'A library for javascript UI functions.',
    license: 'BSD-2-Clause',
    homepage: 'http://deftio.com/bitwrench',
    repository: 'git://github.com/deftio/bitwrench.git',
    author: 'manu a. chatterjee <deftio@deftio.com> (https://deftio.com/)',
    buildDate: '2026-03-03T07:13:12.971Z'
  };

  var _typography, _grid;
  /**
   * Bitwrench v2 Default Styles
   *
   * CSS-in-JS style definitions providing a complete, Bootstrap-inspired
   * design system. Styles are defined as nested JavaScript objects that
   * bw.css() converts to CSS strings and bw.injectCSS() injects into the DOM.
   *
   * The module exports:
   * - {@link defaultStyles} - All style categories as a structured object
   * - {@link getAllStyles} - Merges all categories into a flat CSS rules object
   * - {@link theme} - Design token configuration (colors, breakpoints, spacing, typography)
   *
   * Style categories: root (CSS variables), reset, typography, grid, buttons,
   * cards, forms, navigation, tables, alerts, badges, progress, tabs, listGroups,
   * pagination, breadcrumb, hero, features, enhancedCards, sections, cta,
   * utilities, responsive.
   *
   * @module bitwrench-styles
   * @license BSD-2-Clause
   * @author M A Chatterjee <deftio [at] deftio [dot] com>
   */

  /**
   * Complete default style definitions organized by component category
   *
   * Each property is a style category containing CSS rule objects.
   * Pass individual categories to bw.css() or use getAllStyles() to
   * get everything merged into a single flat object.
   *
   * @type {Object}
   */
  var defaultStyles = {
    /**
     * CSS custom properties (variables) on :root
     *
     * Defines the full color palette, typography, border, and shadow tokens
     * used by all other style categories via var() references.
     */
    root: {
      ':root': {
        '--bw-blue': '#006666',
        '--bw-indigo': '#6610f2',
        '--bw-purple': '#6f42c1',
        '--bw-pink': '#d63384',
        '--bw-red': '#dc3545',
        '--bw-orange': '#fd7e14',
        '--bw-yellow': '#ffc107',
        '--bw-green': '#198754',
        '--bw-teal': '#20c997',
        '--bw-cyan': '#0dcaf0',
        '--bw-black': '#000',
        '--bw-white': '#fff',
        '--bw-gray': '#6c757d',
        '--bw-gray-dark': '#343a40',
        '--bw-gray-100': '#f8f9fa',
        '--bw-gray-200': '#e9ecef',
        '--bw-gray-300': '#dee2e6',
        '--bw-gray-400': '#ced4da',
        '--bw-gray-500': '#adb5bd',
        '--bw-gray-600': '#6c757d',
        '--bw-gray-700': '#495057',
        '--bw-gray-800': '#343a40',
        '--bw-gray-900': '#212529',
        '--bw-primary': '#006666',
        '--bw-secondary': '#6c757d',
        '--bw-success': '#198754',
        '--bw-info': '#0dcaf0',
        '--bw-warning': '#ffc107',
        '--bw-danger': '#dc3545',
        '--bw-light': '#f8f9fa',
        '--bw-dark': '#212529',
        '--bw-font-sans-serif': 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        '--bw-font-monospace': '"SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Liberation Mono", "Courier New", monospace',
        '--bw-body-font-family': 'var(--bw-font-sans-serif)',
        '--bw-body-font-size': '1rem',
        '--bw-body-font-weight': '400',
        '--bw-body-line-height': '1.5',
        '--bw-body-color': '#212529',
        '--bw-body-bg': '#fff',
        '--bw-border-width': '1px',
        '--bw-border-style': 'solid',
        '--bw-border-color': '#dee2e6',
        '--bw-border-radius': '.375rem',
        '--bw-border-radius-sm': '.25rem',
        '--bw-border-radius-lg': '.5rem',
        '--bw-border-radius-xl': '1rem',
        '--bw-border-radius-2xl': '2rem',
        '--bw-border-radius-pill': '50rem',
        '--bw-box-shadow': '0 .5rem 1rem rgba(0, 0, 0, .15)',
        '--bw-box-shadow-sm': '0 .125rem .25rem rgba(0, 0, 0, .075)',
        '--bw-box-shadow-lg': '0 1rem 3rem rgba(0, 0, 0, .175)',
        '--bw-box-shadow-inset': 'inset 0 1px 2px rgba(0, 0, 0, .075)'
      }
    },
    /**
     * CSS reset and base element styles
     *
     * Provides box-sizing reset, body defaults, page layout helpers
     * (.bw-page, .bw-page-content), and hr normalization.
     */
    reset: {
      '*': {
        'box-sizing': 'border-box',
        'margin': '0',
        'padding': '0'
      },
      'html': {
        'font-size': '16px',
        'line-height': '1.5',
        '-webkit-text-size-adjust': '100%',
        '-webkit-font-smoothing': 'antialiased',
        '-moz-osx-font-smoothing': 'grayscale'
      },
      'body': {
        'font-family': 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        'font-size': '1rem',
        'font-weight': '400',
        'line-height': '1.6',
        'color': '#1a1a1a',
        'background-color': '#f5f5f5',
        'margin': '0',
        'padding': '0',
        '-webkit-font-smoothing': 'antialiased',
        '-moz-osx-font-smoothing': 'grayscale'
      },
      // Standard page layout
      '.bw-page': {
        'min-height': '100vh',
        'display': 'flex',
        'flex-direction': 'column'
      },
      '.bw-page-content': {
        'flex': '1',
        'padding': '2rem 0'
      },
      'main': {
        'display': 'block'
      },
      'hr': {
        'box-sizing': 'content-box',
        'height': '0',
        'overflow': 'visible',
        'margin': '1rem 0',
        'color': 'inherit',
        'background-color': 'currentColor',
        'border': '0',
        'opacity': '.25'
      },
      'hr:not([size])': {
        'height': '1px'
      }
    },
    /**
     * Typography styles for headings, paragraphs, links, and small text
     *
     * Headings use responsive font sizes with clamp-like calc() values.
     * Links default to primary color with underline decoration.
     */
    typography: (_typography = {
      'h1, h2, h3, h4, h5, h6': {
        'margin-top': '0',
        'margin-bottom': '.5rem',
        'font-weight': '600',
        'line-height': '1.25',
        'letter-spacing': '-0.01em',
        'color': '#1a1a1a'
      },
      'h1': {
        'font-size': 'calc(1.375rem + 1.5vw)'
      },
      '@media (min-width: 1200px)': {
        'h1': {
          'font-size': '2.5rem'
        }
      },
      'h2': {
        'font-size': 'calc(1.325rem + .9vw)'
      }
    }, _defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_typography, "@media (min-width: 1200px)", {
      'h2': {
        'font-size': '2rem'
      }
    }), 'h3', {
      'font-size': 'calc(1.3rem + .6vw)'
    }), "@media (min-width: 1200px)", {
      'h3': {
        'font-size': '1.75rem'
      }
    }), 'h4', {
      'font-size': 'calc(1.275rem + .3vw)'
    }), "@media (min-width: 1200px)", {
      'h4': {
        'font-size': '1.5rem'
      }
    }), 'h5', {
      'font-size': '1.25rem'
    }), 'h6', {
      'font-size': '1rem'
    }), 'p', {
      'margin-top': '0',
      'margin-bottom': '1rem'
    }), 'small', {
      'font-size': '0.875rem'
    }), 'a', {
      'color': '#006666',
      'text-decoration': 'none',
      'transition': 'color 0.15s'
    }), _defineProperty(_typography, 'a:hover', {
      'color': '#004d4d',
      'text-decoration': 'underline'
    })),
    /**
     * 12-column flexbox grid system
     *
     * Classes: .bw-container (responsive max-widths), .bw-container-fluid,
     * .bw-row, .bw-col, .bw-col-{1-12}. Breakpoint-specific columns
     * are in the responsive category.
     */
    grid: (_grid = {
      '.bw-container': {
        'width': '100%',
        'padding-right': '0.75rem',
        'padding-left': '0.75rem',
        'margin-right': 'auto',
        'margin-left': 'auto'
      },
      '@media (min-width: 576px)': {
        '.bw-container': {
          'max-width': '540px'
        }
      },
      '@media (min-width: 768px)': {
        '.bw-container': {
          'max-width': '720px'
        }
      },
      '@media (min-width: 992px)': {
        '.bw-container': {
          'max-width': '960px'
        }
      },
      '@media (min-width: 1200px)': {
        '.bw-container': {
          'max-width': '1140px'
        }
      },
      '.bw-container-fluid': {
        'width': '100%',
        'padding-right': '15px',
        'padding-left': '15px',
        'margin-right': 'auto',
        'margin-left': 'auto'
      },
      '.bw-row': {
        'display': 'flex',
        'flex-wrap': 'wrap',
        'margin-right': 'calc(var(--bw-gutter-x, 0.75rem) * -0.5)',
        'margin-left': 'calc(var(--bw-gutter-x, 0.75rem) * -0.5)'
      },
      // Column system
      '.col, [class*="col-"]': {
        'position': 'relative',
        'width': '100%',
        'padding-right': 'calc(var(--bw-gutter-x, 0.75rem) * 0.5)',
        'padding-left': 'calc(var(--bw-gutter-x, 0.75rem) * 0.5)'
      },
      '.bw-col': {
        'flex': '1 0 0%'
      }
    }, _defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_grid, ".bw-col", {
      'flex-basis': '0',
      'flex-grow': '1',
      'max-width': '100%'
    }), '.bw-col-1', {
      'flex': '0 0 8.333333%',
      'max-width': '8.333333%'
    }), '.bw-col-2', {
      'flex': '0 0 16.666667%',
      'max-width': '16.666667%'
    }), '.bw-col-3', {
      'flex': '0 0 25%',
      'max-width': '25%'
    }), '.bw-col-4', {
      'flex': '0 0 33.333333%',
      'max-width': '33.333333%'
    }), '.bw-col-5', {
      'flex': '0 0 41.666667%',
      'max-width': '41.666667%'
    }), '.bw-col-6', {
      'flex': '0 0 50%',
      'max-width': '50%'
    }), '.bw-col-7', {
      'flex': '0 0 58.333333%',
      'max-width': '58.333333%'
    }), '.bw-col-8', {
      'flex': '0 0 66.666667%',
      'max-width': '66.666667%'
    }), '.bw-col-9', {
      'flex': '0 0 75%',
      'max-width': '75%'
    }), _defineProperty(_defineProperty(_defineProperty(_grid, '.bw-col-10', {
      'flex': '0 0 83.333333%',
      'max-width': '83.333333%'
    }), '.bw-col-11', {
      'flex': '0 0 91.666667%',
      'max-width': '91.666667%'
    }), '.bw-col-12', {
      'flex': '0 0 100%',
      'max-width': '100%'
    })),
    /**
     * Button styles - all variants, sizes, outlines, and states
     *
     * Classes: .bw-btn (base), .bw-btn-{variant} (filled), .bw-btn-outline-{variant},
     * .bw-btn-sm, .bw-btn-lg. States: :hover, :active, :focus, :disabled.
     * Variants: primary, secondary, success, danger, warning, info, light, dark.
     */
    buttons: {
      '.bw-btn': {
        'display': 'inline-flex',
        'align-items': 'center',
        'justify-content': 'center',
        'font-weight': '500',
        'line-height': '1.5',
        'color': '#1a1a1a',
        'text-align': 'center',
        'text-decoration': 'none',
        'vertical-align': 'middle',
        'cursor': 'pointer',
        'user-select': 'none',
        'background-color': 'transparent',
        'border': '1px solid transparent',
        'padding': '0.5rem 1.125rem',
        'font-size': '0.875rem',
        'font-family': 'inherit',
        'border-radius': '6px',
        'transition': 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
        'box-shadow': '0 1px 2px rgba(0,0,0,.05)',
        'gap': '0.5rem'
      },
      '.bw-btn:hover': {
        'text-decoration': 'none',
        'transform': 'translateY(-1px)',
        'box-shadow': '0 4px 6px rgba(0,0,0,.07)'
      },
      '.bw-btn:active': {
        'transform': 'translateY(0)',
        'box-shadow': '0 1px 2px rgba(0,0,0,.05)'
      },
      '.bw-btn:focus-visible': {
        'outline': '0',
        'box-shadow': '0 0 0 3px rgba(0, 102, 102, 0.3)'
      },
      '.bw-btn:disabled': {
        'opacity': '0.5',
        'cursor': 'not-allowed',
        'pointer-events': 'none'
      },
      // Button variants
      '.bw-btn-primary': {
        'color': '#fff',
        'background-color': '#006666',
        'border-color': '#006666'
      },
      '.bw-btn-primary:hover': {
        'color': '#fff',
        'background-color': '#005555',
        'border-color': '#004d4d'
      },
      '.bw-btn-secondary': {
        'color': '#fff',
        'background-color': '#6c757d',
        'border-color': '#6c757d'
      },
      '.bw-btn-secondary:hover': {
        'color': '#fff',
        'background-color': '#5c636a',
        'border-color': '#565e64'
      },
      '.bw-btn-success': {
        'color': '#fff',
        'background-color': '#198754',
        'border-color': '#198754'
      },
      '.bw-btn-success:hover': {
        'color': '#fff',
        'background-color': '#157347',
        'border-color': '#146c43'
      },
      '.bw-btn-danger': {
        'color': '#fff',
        'background-color': '#dc3545',
        'border-color': '#dc3545'
      },
      '.bw-btn-danger:hover': {
        'color': '#fff',
        'background-color': '#bb2d3b',
        'border-color': '#b02a37'
      },
      '.bw-btn-warning': {
        'color': '#000',
        'background-color': '#ffc107',
        'border-color': '#ffc107'
      },
      '.bw-btn-warning:hover': {
        'color': '#000',
        'background-color': '#ffca2c',
        'border-color': '#ffc720'
      },
      '.bw-btn-info': {
        'color': '#000',
        'background-color': '#0dcaf0',
        'border-color': '#0dcaf0'
      },
      '.bw-btn-info:hover': {
        'color': '#000',
        'background-color': '#31d2f2',
        'border-color': '#25cff2'
      },
      '.bw-btn-light': {
        'color': '#000',
        'background-color': '#f8f9fa',
        'border-color': '#f8f9fa'
      },
      '.bw-btn-light:hover': {
        'color': '#000',
        'background-color': '#f9fafb',
        'border-color': '#f9fafb'
      },
      '.bw-btn-dark': {
        'color': '#fff',
        'background-color': '#212529',
        'border-color': '#212529'
      },
      '.bw-btn-dark:hover': {
        'color': '#fff',
        'background-color': '#1c1f23',
        'border-color': '#1a1e21'
      },
      // Outline variants
      '.bw-btn-outline-primary': {
        'color': '#006666',
        'border-color': '#006666',
        'background-color': 'transparent'
      },
      '.bw-btn-outline-primary:hover': {
        'color': '#fff',
        'background-color': '#006666',
        'border-color': '#006666'
      },
      '.bw-btn-outline-secondary': {
        'color': '#6c757d',
        'border-color': '#6c757d',
        'background-color': 'transparent'
      },
      '.bw-btn-outline-secondary:hover': {
        'color': '#fff',
        'background-color': '#6c757d',
        'border-color': '#6c757d'
      },
      '.bw-btn-outline-success': {
        'color': '#198754',
        'border-color': '#198754',
        'background-color': 'transparent'
      },
      '.bw-btn-outline-success:hover': {
        'color': '#fff',
        'background-color': '#198754',
        'border-color': '#198754'
      },
      '.bw-btn-outline-danger': {
        'color': '#dc3545',
        'border-color': '#dc3545',
        'background-color': 'transparent'
      },
      '.bw-btn-outline-danger:hover': {
        'color': '#fff',
        'background-color': '#dc3545',
        'border-color': '#dc3545'
      },
      '.bw-btn-outline-warning': {
        'color': '#ffc107',
        'border-color': '#ffc107',
        'background-color': 'transparent'
      },
      '.bw-btn-outline-warning:hover': {
        'color': '#000',
        'background-color': '#ffc107',
        'border-color': '#ffc107'
      },
      '.bw-btn-outline-info': {
        'color': '#0dcaf0',
        'border-color': '#0dcaf0',
        'background-color': 'transparent'
      },
      '.bw-btn-outline-info:hover': {
        'color': '#000',
        'background-color': '#0dcaf0',
        'border-color': '#0dcaf0'
      },
      '.bw-btn-outline-light': {
        'color': '#f8f9fa',
        'border-color': '#f8f9fa',
        'background-color': 'transparent'
      },
      '.bw-btn-outline-light:hover': {
        'color': '#000',
        'background-color': '#f8f9fa',
        'border-color': '#f8f9fa'
      },
      '.bw-btn-outline-dark': {
        'color': '#212529',
        'border-color': '#212529',
        'background-color': 'transparent'
      },
      '.bw-btn-outline-dark:hover': {
        'color': '#fff',
        'background-color': '#212529',
        'border-color': '#212529'
      },
      // Button sizes
      '.bw-btn-lg': {
        'padding': '0.625rem 1.5rem',
        'font-size': '1rem',
        'border-radius': '8px'
      },
      '.bw-btn-sm': {
        'padding': '0.25rem 0.75rem',
        'font-size': '0.8125rem',
        'border-radius': '5px'
      }
    },
    /**
     * Card component styles
     *
     * Classes: .bw-card, .bw-card-body, .bw-card-title, .bw-card-text,
     * .bw-card-header, .bw-card-footer, .card-img-top, .card-subtitle.
     * Cards include hover lift animation by default.
     */
    cards: {
      '.bw-card': {
        'position': 'relative',
        'display': 'flex',
        'flex-direction': 'column',
        'min-width': '0',
        'height': '100%',
        'word-wrap': 'break-word',
        'background-color': '#fff',
        'background-clip': 'border-box',
        'border': '1px solid #e5e5e5',
        'border-radius': '8px',
        'box-shadow': '0 1px 3px rgba(0,0,0,.06), 0 1px 2px rgba(0,0,0,.04)',
        'transition': 'box-shadow 0.2s cubic-bezier(0.4,0,0.2,1), transform 0.2s cubic-bezier(0.4,0,0.2,1)',
        'margin-bottom': '1.5rem',
        'overflow': 'hidden'
      },
      '.bw-card:hover': {
        'box-shadow': '0 4px 12px rgba(0,0,0,.1), 0 2px 4px rgba(0,0,0,.06)',
        'transform': 'translateY(-2px)'
      },
      '.bw-card-body': {
        'flex': '1 1 auto',
        'padding': '1.25rem 1.5rem'
      },
      '.bw-card-body > *:last-child': {
        'margin-bottom': '0'
      },
      '.bw-card-title': {
        'margin-bottom': '0.5rem',
        'font-size': '1.125rem',
        'font-weight': '600',
        'line-height': '1.3',
        'color': '#1a1a1a'
      },
      '.card-subtitle': {
        'margin-top': '-0.25rem',
        'margin-bottom': '0.5rem',
        'color': '#777',
        'font-size': '0.875rem'
      },
      '.bw-card-text': {
        'margin-bottom': '0',
        'color': '#555',
        'font-size': '0.9375rem',
        'line-height': '1.6'
      },
      '.bw-card-header': {
        'padding': '0.875rem 1.5rem',
        'margin-bottom': '0',
        'background-color': '#fafafa',
        'border-bottom': '1px solid #e5e5e5',
        'font-weight': '600',
        'font-size': '0.875rem'
      },
      '.bw-card-footer': {
        'padding': '0.75rem 1.5rem',
        'background-color': '#fafafa',
        'border-top': '1px solid #e5e5e5',
        'font-size': '0.875rem',
        'color': '#777'
      },
      '.card-img-top': {
        'width': '100%',
        'border-top-left-radius': '7px',
        'border-top-right-radius': '7px'
      }
    },
    /**
     * Form control styles
     *
     * Classes: .bw-form-control (inputs, selects, textareas),
     * .bw-form-label, .bw-form-group. Includes focus ring styling.
     */
    forms: {
      '.bw-form-control': {
        'display': 'block',
        'width': '100%',
        'padding': '0.5rem 0.875rem',
        'font-size': '0.9375rem',
        'font-weight': '400',
        'line-height': '1.5',
        'color': '#1a1a1a',
        'background-color': '#fff',
        'background-clip': 'padding-box',
        'border': '1px solid #ccc',
        'appearance': 'none',
        'border-radius': '6px',
        'transition': 'border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out',
        'font-family': 'inherit'
      },
      '.bw-form-control:focus': {
        'color': '#1a1a1a',
        'background-color': '#fff',
        'border-color': '#80cccc',
        'outline': '0',
        'box-shadow': '0 0 0 0.25rem rgba(0, 102, 102, 0.25)'
      },
      '.bw-form-control::placeholder': {
        'color': '#999',
        'opacity': '1'
      },
      '.bw-form-label': {
        'display': 'block',
        'margin-bottom': '0.375rem',
        'font-size': '0.875rem',
        'font-weight': '600',
        'color': '#333'
      },
      '.bw-form-group': {
        'margin-bottom': '1.25rem'
      },
      '.bw-form-text': {
        'margin-top': '0.25rem',
        'font-size': '0.8125rem',
        'color': '#777'
      },
      'select.bw-form-control': {
        'padding-right': '2.25rem',
        'background-image': "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='%23666' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='m2 5 6 6 6-6'/%3e%3c/svg%3e\")",
        'background-repeat': 'no-repeat',
        'background-position': 'right 0.75rem center',
        'background-size': '16px 12px'
      },
      'textarea.bw-form-control': {
        'min-height': '5rem',
        'resize': 'vertical'
      }
    },
    /**
     * Navbar and navigation link styles
     *
     * Classes: .bw-navbar, .bw-navbar-dark, .bw-navbar-light,
     * .bw-navbar-brand, .bw-navbar-nav, .bw-nav-link (with :hover and .active).
     */
    navigation: {
      '.bw-navbar': {
        'position': 'relative',
        'display': 'flex',
        'flex-wrap': 'wrap',
        'align-items': 'center',
        'justify-content': 'space-between',
        'padding': '0.5rem 1.5rem',
        'background-color': '#fafafa',
        'border-bottom': '1px solid #e5e5e5'
      },
      '.bw-navbar > .container': {
        'display': 'flex',
        'flex-wrap': 'wrap',
        'align-items': 'center',
        'justify-content': 'space-between'
      },
      '.bw-navbar-dark': {
        'background-color': '#1a1a1a',
        'border-bottom-color': '#333'
      },
      '.bw-navbar-dark .bw-navbar-brand': {
        'color': '#fff'
      },
      '.bw-navbar-dark .bw-nav-link': {
        'color': 'rgba(255,255,255,.65)'
      },
      '.bw-navbar-dark .bw-nav-link:hover': {
        'color': '#fff'
      },
      '.bw-navbar-dark .bw-nav-link.active': {
        'color': '#fff',
        'font-weight': '600'
      },
      '.bw-navbar-brand': {
        'display': 'inline-flex',
        'align-items': 'center',
        'gap': '0.5rem',
        'padding-top': '0.25rem',
        'padding-bottom': '0.25rem',
        'margin-right': '1.5rem',
        'font-size': '1.125rem',
        'font-weight': '600',
        'line-height': 'inherit',
        'white-space': 'nowrap',
        'text-decoration': 'none',
        'color': '#1a1a1a'
      },
      '.bw-navbar-nav': {
        'display': 'flex',
        'flex-direction': 'row',
        'padding-left': '0',
        'margin-bottom': '0',
        'list-style': 'none',
        'gap': '0.25rem'
      },
      '.bw-navbar-nav .bw-nav-link': {
        'display': 'block',
        'padding': '0.5rem 0.875rem',
        'color': '#555',
        'text-decoration': 'none',
        'font-size': '0.875rem',
        'font-weight': '500',
        'border-radius': '6px',
        'transition': 'color 0.15s, background-color 0.15s'
      },
      '.bw-navbar-nav .bw-nav-link:hover': {
        'color': '#1a1a1a',
        'background-color': 'rgba(0,0,0,.04)'
      },
      '.bw-navbar-nav .bw-nav-link.active': {
        'color': '#006666',
        'font-weight': '600',
        'background-color': 'rgba(0, 102, 102, 0.06)'
      }
    },
    /**
     * Table styles with striped and hover variants
     *
     * Classes: .bw-table, .bw-table-striped, .bw-table-hover,
     * .bw-table-bordered. Applies to thead, tbody, th, td.
     */
    tables: {
      '.bw-table': {
        'width': '100%',
        'margin-bottom': '1.5rem',
        'color': '#1a1a1a',
        'vertical-align': 'top',
        'border-color': '#e0e0e0',
        'border-collapse': 'collapse',
        'font-size': '0.9375rem',
        'line-height': '1.5'
      },
      '.bw-table > :not(caption) > * > *': {
        'padding': '0.75rem 1rem',
        'background-color': 'transparent',
        'border-bottom': '1px solid #e0e0e0'
      },
      '.bw-table > tbody': {
        'vertical-align': 'inherit'
      },
      '.bw-table > thead': {
        'vertical-align': 'bottom'
      },
      '.bw-table > thead > tr > *': {
        'padding': '0.625rem 1rem',
        'font-size': '0.8125rem',
        'font-weight': '600',
        'text-transform': 'uppercase',
        'letter-spacing': '0.04em',
        'color': '#555',
        'border-bottom': '2px solid #ccc',
        'background-color': '#f8f8f8'
      },
      '.bw-table-striped > tbody > tr:nth-of-type(odd) > *': {
        'background-color': 'rgba(0, 0, 0, 0.025)'
      },
      '.bw-table-hover > tbody > tr:hover > *': {
        'background-color': 'rgba(0, 102, 102, 0.05)'
      },
      '.bw-table-bordered': {
        'border': '1px solid #e0e0e0'
      },
      '.bw-table-bordered > :not(caption) > * > *': {
        'border': '1px solid #e0e0e0'
      },
      '.bw-table caption': {
        'padding': '0.5rem 1rem',
        'font-size': '0.875rem',
        'color': '#777',
        'caption-side': 'bottom'
      }
    },
    /**
     * Alert/notification styles for all color variants
     *
     * Classes: .bw-alert, .bw-alert-{variant}, .bw-alert-dismissible.
     * Variants: primary, secondary, success, info, warning, danger, light, dark.
     */
    alerts: {
      '.bw-alert': {
        'position': 'relative',
        'padding': '0.875rem 1.25rem',
        'margin-bottom': '1rem',
        'border': '1px solid transparent',
        'border-radius': '8px',
        'font-size': '0.9375rem',
        'line-height': '1.6'
      },
      '.alert-heading': {
        'color': 'inherit'
      },
      '.alert-link': {
        'font-weight': '700'
      },
      '.bw-alert-dismissible': {
        'padding-right': '3rem'
      },
      '.bw-alert-dismissible .btn-close': {
        'position': 'absolute',
        'top': '0',
        'right': '0',
        'z-index': '2',
        'padding': '1.25rem 1rem'
      },
      '.bw-alert-primary': {
        'color': '#004d4d',
        'background-color': '#e0f2f1',
        'border-color': '#b2dfdb'
      },
      '.bw-alert-primary .alert-link': {
        'color': '#003d3d'
      },
      '.bw-alert-secondary': {
        'color': '#41464b',
        'background-color': '#e2e3e5',
        'border-color': '#d3d6d8'
      },
      '.bw-alert-secondary .alert-link': {
        'color': '#34383c'
      },
      '.bw-alert-success': {
        'color': '#0f5132',
        'background-color': '#d1e7dd',
        'border-color': '#badbcc'
      },
      '.bw-alert-success .alert-link': {
        'color': '#0c4128'
      },
      '.bw-alert-info': {
        'color': '#055160',
        'background-color': '#cff4fc',
        'border-color': '#b6effb'
      },
      '.bw-alert-info .alert-link': {
        'color': '#04414d'
      },
      '.bw-alert-warning': {
        'color': '#664d03',
        'background-color': '#fff3cd',
        'border-color': '#ffecb5'
      },
      '.bw-alert-warning .alert-link': {
        'color': '#523e02'
      },
      '.bw-alert-danger': {
        'color': '#842029',
        'background-color': '#f8d7da',
        'border-color': '#f5c2c7'
      },
      '.bw-alert-danger .alert-link': {
        'color': '#6a1a21'
      },
      '.bw-alert-light': {
        'color': '#636464',
        'background-color': '#fefefe',
        'border-color': '#fdfdfe'
      },
      '.bw-alert-light .alert-link': {
        'color': '#4f5050'
      },
      '.bw-alert-dark': {
        'color': '#141619',
        'background-color': '#d3d3d4',
        'border-color': '#bcbebf'
      },
      '.bw-alert-dark .alert-link': {
        'color': '#101214'
      }
    },
    /**
     * Inline badge/label styles
     *
     * Classes: .bw-badge, .bw-badge-{variant}.
     * Variants: primary, secondary, success, info, warning, danger, light, dark.
     */
    badges: {
      '.bw-badge': {
        'display': 'inline-block',
        'padding': '.35em .65em',
        'font-size': '.75em',
        'font-weight': '700',
        'line-height': '1',
        'color': '#fff',
        'text-align': 'center',
        'white-space': 'nowrap',
        'vertical-align': 'baseline',
        'border-radius': '.375rem'
      },
      '.bw-badge:empty': {
        'display': 'none'
      },
      '.btn .badge': {
        'position': 'relative',
        'top': '-1px'
      },
      '.bw-badge-primary': {
        'color': '#fff',
        'background-color': '#006666'
      },
      '.bw-badge-secondary': {
        'color': '#fff',
        'background-color': '#6c757d'
      },
      '.bw-badge-success': {
        'color': '#fff',
        'background-color': '#198754'
      },
      '.bw-badge-info': {
        'color': '#000',
        'background-color': '#0dcaf0'
      },
      '.bw-badge-warning': {
        'color': '#000',
        'background-color': '#ffc107'
      },
      '.bw-badge-danger': {
        'color': '#fff',
        'background-color': '#dc3545'
      },
      '.bw-badge-light': {
        'color': '#000',
        'background-color': '#f8f9fa'
      },
      '.bw-badge-dark': {
        'color': '#fff',
        'background-color': '#212529'
      }
    },
    /**
     * Progress bar styles with striped and animated variants
     *
     * Classes: .bw-progress, .bw-progress-bar, .bw-progress-bar-striped,
     * .bw-progress-bar-animated. Includes @keyframes for stripe animation.
     */
    progress: {
      '.bw-progress': {
        'display': 'flex',
        'height': '1.25rem',
        'overflow': 'hidden',
        'font-size': '.875rem',
        'background-color': '#e9ecef',
        'border-radius': '.5rem',
        'box-shadow': 'inset 0 1px 2px rgba(0,0,0,.1)'
      },
      '.bw-progress-bar': {
        'display': 'flex',
        'flex-direction': 'column',
        'justify-content': 'center',
        'overflow': 'hidden',
        'color': '#fff',
        'text-align': 'center',
        'white-space': 'nowrap',
        'background-color': '#006666',
        'transition': 'width .6s ease',
        'box-shadow': 'inset 0 -1px 0 rgba(0,0,0,.15)',
        'font-weight': '600'
      },
      '.bw-progress-bar-striped': {
        'background-image': 'linear-gradient(45deg,rgba(255,255,255,.15) 25%,transparent 25%,transparent 50%,rgba(255,255,255,.15) 50%,rgba(255,255,255,.15) 75%,transparent 75%,transparent)',
        'background-size': '1rem 1rem'
      },
      '.bw-progress-bar-animated': {
        'animation': 'progress-bar-stripes 1s linear infinite'
      },
      '@keyframes progress-bar-stripes': {
        '0%': {
          'background-position-x': '1rem'
        }
      }
    },
    /**
     * Tab navigation and content pane styles
     *
     * Classes: .bw-nav, .bw-nav-tabs, .bw-nav-item, .bw-nav-link (.active, :hover),
     * .bw-tab-content, .bw-tab-pane (.active). Inactive panes use display:none.
     */
    tabs: {
      '.bw-nav': {
        'display': 'flex',
        'flex-wrap': 'wrap',
        'padding-left': '0',
        'margin-bottom': '0',
        'list-style': 'none',
        'gap': '0'
      },
      '.bw-nav-tabs': {
        'border-bottom': '2px solid #e5e5e5'
      },
      '.bw-nav-item': {
        'display': 'block'
      },
      '.bw-nav-tabs .bw-nav-item': {
        'margin-bottom': '-2px'
      },
      '.bw-nav-link': {
        'display': 'block',
        'padding': '0.625rem 1rem',
        'font-size': '0.875rem',
        'font-weight': '500',
        'color': '#777',
        'text-decoration': 'none',
        'cursor': 'pointer',
        'border': 'none',
        'background': 'transparent',
        'transition': 'color 0.15s, border-color 0.15s',
        'font-family': 'inherit'
      },
      '.bw-nav-tabs .bw-nav-link': {
        'border': 'none',
        'border-bottom': '2px solid transparent',
        'border-radius': '0',
        'background-color': 'transparent'
      },
      '.bw-nav-tabs .bw-nav-link:hover': {
        'color': '#1a1a1a',
        'border-bottom-color': '#ccc'
      },
      '.bw-nav-tabs .bw-nav-link.active': {
        'color': '#006666',
        'background-color': 'transparent',
        'border-bottom': '2px solid #006666',
        'font-weight': '600'
      },
      '.bw-tab-content': {
        'padding': '1.25rem 0'
      },
      '.bw-tab-pane': {
        'display': 'none'
      },
      '.bw-tab-pane.active': {
        'display': 'block'
      }
    },
    /**
     * List group styles for vertical lists of items
     *
     * Classes: .bw-list-group, .bw-list-group-item (.active, .disabled),
     * .bw-list-group-flush. Supports anchor tags for interactive items.
     */
    listGroups: {
      '.bw-list-group': {
        'display': 'flex',
        'flex-direction': 'column',
        'padding-left': '0',
        'margin-bottom': '0',
        'border-radius': '0.375rem'
      },
      '.bw-list-group-item': {
        'position': 'relative',
        'display': 'block',
        'padding': '0.75rem 1.25rem',
        'color': '#1a1a1a',
        'text-decoration': 'none',
        'background-color': '#fff',
        'border': '1px solid #e5e5e5',
        'font-size': '0.9375rem'
      },
      '.bw-list-group-item:first-child': {
        'border-top-left-radius': 'inherit',
        'border-top-right-radius': 'inherit'
      },
      '.bw-list-group-item:last-child': {
        'border-bottom-right-radius': 'inherit',
        'border-bottom-left-radius': 'inherit'
      },
      '.bw-list-group-item + .bw-list-group-item': {
        'border-top-width': '0'
      },
      '.bw-list-group-item.active': {
        'z-index': '2',
        'color': '#fff',
        'background-color': '#006666',
        'border-color': '#006666'
      },
      '.bw-list-group-item.disabled': {
        'color': '#6c757d',
        'pointer-events': 'none',
        'background-color': '#fff'
      },
      'a.bw-list-group-item': {
        'cursor': 'pointer'
      },
      'a.bw-list-group-item:hover': {
        'z-index': '1',
        'color': '#495057',
        'text-decoration': 'none',
        'background-color': '#f8f9fa'
      },
      '.bw-list-group-flush': {
        'border-radius': '0'
      },
      '.bw-list-group-flush > .bw-list-group-item': {
        'border-width': '0 0 1px',
        'border-radius': '0'
      },
      '.bw-list-group-flush > .bw-list-group-item:last-child': {
        'border-bottom-width': '0'
      }
    },
    /**
     * Pagination control styles
     *
     * Classes: .bw-pagination, .bw-page-item (.bw-active, .bw-disabled),
     * .bw-page-link (:hover, :focus). First/last items get rounded corners.
     */
    pagination: {
      '.bw-pagination': {
        'display': 'flex',
        'padding-left': '0',
        'list-style': 'none',
        'margin-bottom': '0'
      },
      '.bw-page-item': {
        'display': 'list-item',
        'list-style': 'none'
      },
      '.bw-page-link': {
        'position': 'relative',
        'display': 'block',
        'padding': '0.375rem 0.75rem',
        'margin-left': '-1px',
        'line-height': '1.25',
        'color': '#006666',
        'text-decoration': 'none',
        'background-color': '#fff',
        'border': '1px solid #dee2e6',
        'transition': 'color 0.15s ease-in-out, background-color 0.15s ease-in-out, border-color 0.15s ease-in-out'
      },
      '.bw-page-link:hover': {
        'z-index': '2',
        'color': '#004d4d',
        'background-color': '#e9ecef',
        'border-color': '#dee2e6'
      },
      '.bw-page-link:focus': {
        'z-index': '3',
        'color': '#004d4d',
        'background-color': '#e9ecef',
        'outline': '0',
        'box-shadow': '0 0 0 0.25rem rgba(0, 102, 102, 0.25)'
      },
      '.bw-page-item:first-child .bw-page-link': {
        'margin-left': '0',
        'border-top-left-radius': '0.375rem',
        'border-bottom-left-radius': '0.375rem'
      },
      '.bw-page-item:last-child .bw-page-link': {
        'border-top-right-radius': '0.375rem',
        'border-bottom-right-radius': '0.375rem'
      },
      '.bw-page-item.bw-active .bw-page-link': {
        'z-index': '3',
        'color': '#fff',
        'background-color': '#006666',
        'border-color': '#006666'
      },
      '.bw-page-item.bw-disabled .bw-page-link': {
        'color': '#6c757d',
        'pointer-events': 'none',
        'background-color': '#fff',
        'border-color': '#dee2e6'
      }
    },
    /**
     * Breadcrumb navigation styles
     *
     * Classes: .bw-breadcrumb, .bw-breadcrumb-item (.active).
     * Uses "/" separator via ::before pseudo-element.
     */
    breadcrumb: {
      '.bw-breadcrumb': {
        'display': 'flex',
        'flex-wrap': 'wrap',
        'padding': '0 0',
        'margin-bottom': '1rem',
        'list-style': 'none',
        'background-color': 'transparent'
      },
      '.bw-breadcrumb-item': {
        'display': 'flex'
      },
      '.bw-breadcrumb-item + .bw-breadcrumb-item': {
        'padding-left': '0.5rem'
      },
      '.bw-breadcrumb-item + .bw-breadcrumb-item::before': {
        'float': 'left',
        'padding-right': '0.5rem',
        'color': '#6c757d',
        'content': '"/"'
      },
      '.bw-breadcrumb-item.active': {
        'color': '#6c757d'
      }
    },
    /**
     * Hero section styles for landing page headers
     *
     * Classes: .bw-hero, .bw-hero-{variant} (gradient backgrounds),
     * .bw-hero-overlay, .bw-hero-content, .bw-hero-title.
     * Also includes .bw-display-4, .bw-lead, and .bw-py-{3-6} spacing.
     */
    hero: {
      '.bw-hero': {
        'position': 'relative',
        'overflow': 'hidden'
      },
      '.bw-hero-primary': {
        'background': 'linear-gradient(135deg, #006666 0%, #004d4d 100%)',
        'color': '#fff'
      },
      '.bw-hero-secondary': {
        'background': 'linear-gradient(135deg, #6c757d 0%, #5a6268 100%)',
        'color': '#fff'
      },
      '.bw-hero-light': {
        'background': '#f8f9fa',
        'color': '#212529'
      },
      '.bw-hero-dark': {
        'background': 'linear-gradient(135deg, #212529 0%, #16181b 100%)',
        'color': '#fff'
      },
      '.bw-hero-overlay': {
        'position': 'absolute',
        'top': '0',
        'left': '0',
        'right': '0',
        'bottom': '0',
        'background': 'rgba(0,0,0,0.5)',
        'z-index': '1'
      },
      '.bw-hero-content': {
        'position': 'relative',
        'z-index': '2'
      },
      '.bw-hero-title': {
        'font-weight': '300',
        'letter-spacing': '-0.05rem'
      },
      '.bw-display-4': {
        'font-size': 'calc(1.475rem + 2.7vw)',
        'font-weight': '300',
        'line-height': '1.2'
      },
      '@media (min-width: 1200px)': {
        '.bw-display-4': {
          'font-size': '3.5rem'
        }
      },
      '.bw-lead': {
        'font-size': '1.25rem',
        'font-weight': '300'
      },
      '.bw-py-3': {
        'padding-top': '1rem !important',
        'padding-bottom': '1rem !important'
      },
      '.bw-py-4': {
        'padding-top': '1.5rem !important',
        'padding-bottom': '1.5rem !important'
      },
      '.bw-py-5': {
        'padding-top': '3rem !important',
        'padding-bottom': '3rem !important'
      },
      '.bw-py-6': {
        'padding-top': '4rem !important',
        'padding-bottom': '4rem !important'
      }
    },
    /**
     * Feature grid item styles
     *
     * Classes: .bw-feature, .bw-feature-icon, .bw-feature-title, .bw-g-4.
     */
    features: {
      '.bw-feature': {
        'padding': '1rem'
      },
      '.bw-feature-icon': {
        'display': 'inline-block',
        'margin-bottom': '1rem'
      },
      '.bw-feature-title': {
        'margin-bottom': '0.5rem'
      },
      '.bw-g-4': {
        '--bw-gutter-x': '1.5rem',
        '--bw-gutter-y': '1.5rem'
      }
    },
    /**
     * Enhanced card styles with hover effects and horizontal image support
     *
     * Classes: .bw-card-hoverable (lift on hover), .bw-card-img-left,
     * .bw-card-img-right, .bw-h5, .bw-h6.
     */
    enhancedCards: {
      '.bw-card-hoverable': {
        'transition': 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      },
      '.bw-card-hoverable:hover': {
        'transform': 'translateY(-4px)',
        'box-shadow': '0 1rem 2rem rgba(0,0,0,.15)'
      },
      '.bw-card-img-left': {
        'width': '40%',
        'object-fit': 'cover'
      },
      '.bw-card-img-right': {
        'width': '40%',
        'object-fit': 'cover'
      },
      '.bw-h5': {
        'font-size': '1.25rem'
      },
      '.bw-h6': {
        'font-size': '1rem'
      }
    },
    /**
     * Page section styles with header and subtitle
     *
     * Classes: .bw-section, .bw-section-header, .bw-section-title,
     * .bw-section-subtitle. Responsive title sizing included.
     */
    sections: {
      '.bw-section': {
        'position': 'relative'
      },
      '.bw-section-header': {
        'margin-bottom': '3rem'
      },
      '.bw-section-title': {
        'margin-bottom': '1rem',
        'font-weight': '300',
        'font-size': 'calc(1.325rem + .9vw)'
      },
      '@media (min-width: 1200px)': {
        '.bw-section-title': {
          'font-size': '2rem'
        }
      },
      '.bw-section-subtitle': {
        'font-size': '1.125rem',
        'color': '#6c757d'
      }
    },
    /**
     * Call-to-action section styles
     *
     * Classes: .bw-cta, .bw-cta-content, .bw-cta-title, .bw-cta-actions.
     * Content is centered with max-width constraint.
     */
    cta: {
      '.bw-cta': {
        'position': 'relative'
      },
      '.bw-cta-content': {
        'max-width': '48rem',
        'margin': '0 auto'
      },
      '.bw-cta-title': {
        'font-weight': '300'
      },
      '.bw-cta-actions': {
        'display': 'flex',
        'gap': '1rem',
        'justify-content': 'center',
        'flex-wrap': 'wrap'
      }
    },
    /**
     * Utility classes for spacing, text, display, flexbox, colors, borders, etc.
     *
     * Spacing: .bw-m-{0-5}, .bw-mt-{0-5}, .bw-mb-{0-5}, .bw-ms-{0-5}, .bw-me-{0-5},
     *          .bw-p-{0-5}, .pt-{0-5}, .pb-{0-5}, .ps-{0-5}, .pe-{0-5}
     * Text: .bw-text-{left,right,center}, .bw-text-{variant}, .fw-{weight}, .fs-{1-6}
     * Display: .bw-d-{none,block,inline,inline-block,flex}
     * Background: .bw-bg-{variant}
     * Borders: .bw-border, .bw-border-0, .bw-rounded, .bw-rounded-circle
     * Shadows: .bw-shadow, .bw-shadow-sm, .bw-shadow-lg
     * Sizing: .w-{25,50,75,100,auto}, .h-{25,50,75,100,auto}
     * Position: .position-{static,relative,absolute,fixed,sticky}
     */
    utilities: {
      // Spacing
      '.bw-m-0': {
        'margin': '0 !important'
      },
      '.bw-m-1': {
        'margin': '.25rem !important'
      },
      '.bw-m-2': {
        'margin': '.5rem !important'
      },
      '.bw-m-3': {
        'margin': '1rem !important'
      },
      '.bw-m-4': {
        'margin': '1.5rem !important'
      },
      '.bw-m-5': {
        'margin': '3rem !important'
      },
      '.m-auto': {
        'margin': 'auto !important'
      },
      '.bw-mt-0': {
        'margin-top': '0 !important'
      },
      '.bw-mt-1': {
        'margin-top': '.25rem !important'
      },
      '.bw-mt-2': {
        'margin-top': '.5rem !important'
      },
      '.bw-mt-3': {
        'margin-top': '1rem !important'
      },
      '.bw-mt-4': {
        'margin-top': '1.5rem !important'
      },
      '.bw-mt-5': {
        'margin-top': '3rem !important'
      },
      '.bw-mb-0': {
        'margin-bottom': '0 !important'
      },
      '.bw-mb-1': {
        'margin-bottom': '.25rem !important'
      },
      '.bw-mb-2': {
        'margin-bottom': '.5rem !important'
      },
      '.bw-mb-3': {
        'margin-bottom': '1rem !important'
      },
      '.bw-mb-4': {
        'margin-bottom': '1.5rem !important'
      },
      '.bw-mb-5': {
        'margin-bottom': '3rem !important'
      },
      '.bw-ms-0': {
        'margin-left': '0 !important'
      },
      '.bw-ms-1': {
        'margin-left': '.25rem !important'
      },
      '.bw-ms-2': {
        'margin-left': '.5rem !important'
      },
      '.bw-ms-3': {
        'margin-left': '1rem !important'
      },
      '.bw-ms-4': {
        'margin-left': '1.5rem !important'
      },
      '.bw-ms-5': {
        'margin-left': '3rem !important'
      },
      '.bw-me-0': {
        'margin-right': '0 !important'
      },
      '.bw-me-1': {
        'margin-right': '.25rem !important'
      },
      '.bw-me-2': {
        'margin-right': '.5rem !important'
      },
      '.bw-me-3': {
        'margin-right': '1rem !important'
      },
      '.bw-me-4': {
        'margin-right': '1.5rem !important'
      },
      '.bw-me-5': {
        'margin-right': '3rem !important'
      },
      '.bw-p-0': {
        'padding': '0 !important'
      },
      '.bw-p-1': {
        'padding': '.25rem !important'
      },
      '.bw-p-2': {
        'padding': '.5rem !important'
      },
      '.bw-p-3': {
        'padding': '1rem !important'
      },
      '.bw-p-4': {
        'padding': '1.5rem !important'
      },
      '.bw-p-5': {
        'padding': '3rem !important'
      },
      '.pt-0': {
        'padding-top': '0 !important'
      },
      '.pt-1': {
        'padding-top': '.25rem !important'
      },
      '.pt-2': {
        'padding-top': '.5rem !important'
      },
      '.pt-3': {
        'padding-top': '1rem !important'
      },
      '.pt-4': {
        'padding-top': '1.5rem !important'
      },
      '.pt-5': {
        'padding-top': '3rem !important'
      },
      '.pb-0': {
        'padding-bottom': '0 !important'
      },
      '.pb-1': {
        'padding-bottom': '.25rem !important'
      },
      '.pb-2': {
        'padding-bottom': '.5rem !important'
      },
      '.pb-3': {
        'padding-bottom': '1rem !important'
      },
      '.pb-4': {
        'padding-bottom': '1.5rem !important'
      },
      '.pb-5': {
        'padding-bottom': '3rem !important'
      },
      '.ps-0': {
        'padding-left': '0 !important'
      },
      '.ps-1': {
        'padding-left': '.25rem !important'
      },
      '.ps-2': {
        'padding-left': '.5rem !important'
      },
      '.ps-3': {
        'padding-left': '1rem !important'
      },
      '.ps-4': {
        'padding-left': '1.5rem !important'
      },
      '.ps-5': {
        'padding-left': '3rem !important'
      },
      '.pe-0': {
        'padding-right': '0 !important'
      },
      '.pe-1': {
        'padding-right': '.25rem !important'
      },
      '.pe-2': {
        'padding-right': '.5rem !important'
      },
      '.pe-3': {
        'padding-right': '1rem !important'
      },
      '.pe-4': {
        'padding-right': '1.5rem !important'
      },
      '.pe-5': {
        'padding-right': '3rem !important'
      },
      // Text alignment
      '.bw-text-left': {
        'text-align': 'left'
      },
      '.bw-text-right': {
        'text-align': 'right'
      },
      '.bw-text-center': {
        'text-align': 'center'
      },
      // Display
      '.bw-d-none': {
        'display': 'none'
      },
      '.bw-d-block': {
        'display': 'block'
      },
      '.bw-d-inline': {
        'display': 'inline'
      },
      '.bw-d-inline-block': {
        'display': 'inline-block'
      },
      '.bw-d-flex': {
        'display': 'flex'
      },
      // Flexbox
      '.justify-content-start': {
        'justify-content': 'flex-start'
      },
      '.justify-content-end': {
        'justify-content': 'flex-end'
      },
      '.justify-content-center': {
        'justify-content': 'center'
      },
      '.justify-content-between': {
        'justify-content': 'space-between'
      },
      '.justify-content-around': {
        'justify-content': 'space-around'
      },
      '.align-items-start': {
        'align-items': 'flex-start'
      },
      '.align-items-end': {
        'align-items': 'flex-end'
      },
      '.align-items-center': {
        'align-items': 'center'
      },
      // Colors
      '.bw-text-primary': {
        'color': '#006666'
      },
      '.bw-text-secondary': {
        'color': '#6c757d'
      },
      '.bw-text-success': {
        'color': '#198754'
      },
      '.bw-text-danger': {
        'color': '#dc3545'
      },
      '.bw-text-warning': {
        'color': '#ffc107'
      },
      '.bw-text-info': {
        'color': '#0dcaf0'
      },
      '.bw-text-light': {
        'color': '#f8f9fa'
      },
      '.bw-text-dark': {
        'color': '#212529'
      },
      '.bw-text-muted': {
        'color': '#6c757d'
      },
      '.bw-bg-primary': {
        'background-color': '#006666'
      },
      '.bw-bg-secondary': {
        'background-color': '#6c757d'
      },
      '.bw-bg-success': {
        'background-color': '#198754'
      },
      '.bw-bg-danger': {
        'background-color': '#dc3545'
      },
      '.bw-bg-warning': {
        'background-color': '#ffc107'
      },
      '.bw-bg-info': {
        'background-color': '#0dcaf0'
      },
      '.bw-bg-light': {
        'background-color': '#f8f9fa'
      },
      '.bw-bg-dark': {
        'background-color': '#212529'
      },
      // Borders
      '.bw-border': {
        'border': '1px solid #dee2e6 !important'
      },
      '.bw-border-0': {
        'border': '0 !important'
      },
      '.border-top-0': {
        'border-top': '0 !important'
      },
      '.border-end-0': {
        'border-right': '0 !important'
      },
      '.border-bottom-0': {
        'border-bottom': '0 !important'
      },
      '.border-start-0': {
        'border-left': '0 !important'
      },
      '.bw-rounded': {
        'border-radius': '.375rem !important'
      },
      '.bw-rounded-0': {
        'border-radius': '0 !important'
      },
      '.rounded-1': {
        'border-radius': '.25rem !important'
      },
      '.rounded-2': {
        'border-radius': '.375rem !important'
      },
      '.rounded-3': {
        'border-radius': '.5rem !important'
      },
      '.bw-rounded-circle': {
        'border-radius': '50% !important'
      },
      '.rounded-pill': {
        'border-radius': '50rem !important'
      },
      // Shadows
      '.bw-shadow': {
        'box-shadow': '0 .5rem 1rem rgba(0,0,0,.15) !important'
      },
      '.bw-shadow-sm': {
        'box-shadow': '0 .125rem .25rem rgba(0,0,0,.075) !important'
      },
      '.bw-shadow-lg': {
        'box-shadow': '0 1rem 3rem rgba(0,0,0,.175) !important'
      },
      '.shadow-none': {
        'box-shadow': 'none !important'
      },
      // Width/Height
      '.w-25': {
        'width': '25% !important'
      },
      '.w-50': {
        'width': '50% !important'
      },
      '.w-75': {
        'width': '75% !important'
      },
      '.w-100': {
        'width': '100% !important'
      },
      '.w-auto': {
        'width': 'auto !important'
      },
      '.h-25': {
        'height': '25% !important'
      },
      '.h-50': {
        'height': '50% !important'
      },
      '.h-75': {
        'height': '75% !important'
      },
      '.h-100': {
        'height': '100% !important'
      },
      '.h-auto': {
        'height': 'auto !important'
      },
      '.mw-100': {
        'max-width': '100% !important'
      },
      '.mh-100': {
        'max-height': '100% !important'
      },
      // Positioning
      '.position-static': {
        'position': 'static !important'
      },
      '.position-relative': {
        'position': 'relative !important'
      },
      '.position-absolute': {
        'position': 'absolute !important'
      },
      '.position-fixed': {
        'position': 'fixed !important'
      },
      '.position-sticky': {
        'position': 'sticky !important'
      },
      '.top-0': {
        'top': '0 !important'
      },
      '.top-50': {
        'top': '50% !important'
      },
      '.top-100': {
        'top': '100% !important'
      },
      '.bottom-0': {
        'bottom': '0 !important'
      },
      '.bottom-50': {
        'bottom': '50% !important'
      },
      '.bottom-100': {
        'bottom': '100% !important'
      },
      '.start-0': {
        'left': '0 !important'
      },
      '.start-50': {
        'left': '50% !important'
      },
      '.start-100': {
        'left': '100% !important'
      },
      '.end-0': {
        'right': '0 !important'
      },
      '.end-50': {
        'right': '50% !important'
      },
      '.end-100': {
        'right': '100% !important'
      },
      '.translate-middle': {
        'transform': 'translate(-50%, -50%) !important'
      },
      // Overflow
      '.overflow-auto': {
        'overflow': 'auto !important'
      },
      '.overflow-hidden': {
        'overflow': 'hidden !important'
      },
      '.overflow-visible': {
        'overflow': 'visible !important'
      },
      '.overflow-scroll': {
        'overflow': 'scroll !important'
      },
      // Typography utilities
      '.fs-1': {
        'font-size': 'calc(1.375rem + 1.5vw) !important'
      },
      '.fs-2': {
        'font-size': 'calc(1.325rem + .9vw) !important'
      },
      '.fs-3': {
        'font-size': 'calc(1.3rem + .6vw) !important'
      },
      '.fs-4': {
        'font-size': 'calc(1.275rem + .3vw) !important'
      },
      '.fs-5': {
        'font-size': '1.25rem !important'
      },
      '.fs-6': {
        'font-size': '1rem !important'
      },
      '.fw-light': {
        'font-weight': '300 !important'
      },
      '.fw-lighter': {
        'font-weight': 'lighter !important'
      },
      '.fw-normal': {
        'font-weight': '400 !important'
      },
      '.fw-bold': {
        'font-weight': '700 !important'
      },
      '.fw-bolder': {
        'font-weight': 'bolder !important'
      },
      '.fst-italic': {
        'font-style': 'italic !important'
      },
      '.fst-normal': {
        'font-style': 'normal !important'
      },
      '.text-decoration-none': {
        'text-decoration': 'none !important'
      },
      '.text-decoration-underline': {
        'text-decoration': 'underline !important'
      },
      '.text-decoration-line-through': {
        'text-decoration': 'line-through !important'
      },
      '.text-lowercase': {
        'text-transform': 'lowercase !important'
      },
      '.text-uppercase': {
        'text-transform': 'uppercase !important'
      },
      '.text-capitalize': {
        'text-transform': 'capitalize !important'
      },
      '.text-wrap': {
        'white-space': 'normal !important'
      },
      '.text-nowrap': {
        'white-space': 'nowrap !important'
      },
      // List utilities
      '.list-unstyled': {
        'padding-left': '0',
        'list-style': 'none'
      },
      '.list-inline': {
        'padding-left': '0',
        'list-style': 'none'
      },
      '.list-inline-item': {
        'display': 'inline-block'
      },
      '.list-inline-item:not(:last-child)': {
        'margin-right': '.5rem'
      },
      // Visibility
      '.visible': {
        'visibility': 'visible !important'
      },
      '.invisible': {
        'visibility': 'hidden !important'
      },
      // User select
      '.user-select-all': {
        'user-select': 'all !important'
      },
      '.user-select-auto': {
        'user-select': 'auto !important'
      },
      '.user-select-none': {
        'user-select': 'none !important'
      },
      // Pointer events
      '.pe-none': {
        'pointer-events': 'none !important'
      },
      '.pe-auto': {
        'pointer-events': 'auto !important'
      },
      // Opacity
      '.opacity-0': {
        'opacity': '0 !important'
      },
      '.opacity-25': {
        'opacity': '.25 !important'
      },
      '.opacity-50': {
        'opacity': '.5 !important'
      },
      '.opacity-75': {
        'opacity': '.75 !important'
      },
      '.opacity-100': {
        'opacity': '1 !important'
      }
    },
    /**
     * Responsive grid columns for sm, md, and lg breakpoints
     *
     * Classes: .bw-col-sm-{1-12} (>=576px), .bw-col-md-{1-12} (>=768px),
     * .bw-col-lg-{1-12} (>=992px). Applied via @media min-width queries.
     */
    responsive: {
      '@media (min-width: 576px)': {
        '.bw-col-sm-1': {
          'flex': '0 0 8.333333%',
          'max-width': '8.333333%'
        },
        '.bw-col-sm-2': {
          'flex': '0 0 16.666667%',
          'max-width': '16.666667%'
        },
        '.bw-col-sm-3': {
          'flex': '0 0 25%',
          'max-width': '25%'
        },
        '.bw-col-sm-4': {
          'flex': '0 0 33.333333%',
          'max-width': '33.333333%'
        },
        '.bw-col-sm-5': {
          'flex': '0 0 41.666667%',
          'max-width': '41.666667%'
        },
        '.bw-col-sm-6': {
          'flex': '0 0 50%',
          'max-width': '50%'
        },
        '.bw-col-sm-7': {
          'flex': '0 0 58.333333%',
          'max-width': '58.333333%'
        },
        '.bw-col-sm-8': {
          'flex': '0 0 66.666667%',
          'max-width': '66.666667%'
        },
        '.bw-col-sm-9': {
          'flex': '0 0 75%',
          'max-width': '75%'
        },
        '.bw-col-sm-10': {
          'flex': '0 0 83.333333%',
          'max-width': '83.333333%'
        },
        '.bw-col-sm-11': {
          'flex': '0 0 91.666667%',
          'max-width': '91.666667%'
        },
        '.bw-col-sm-12': {
          'flex': '0 0 100%',
          'max-width': '100%'
        }
      },
      '@media (min-width: 768px)': {
        '.bw-col-md-1': {
          'flex': '0 0 8.333333%',
          'max-width': '8.333333%'
        },
        '.bw-col-md-2': {
          'flex': '0 0 16.666667%',
          'max-width': '16.666667%'
        },
        '.bw-col-md-3': {
          'flex': '0 0 25%',
          'max-width': '25%'
        },
        '.bw-col-md-4': {
          'flex': '0 0 33.333333%',
          'max-width': '33.333333%'
        },
        '.bw-col-md-5': {
          'flex': '0 0 41.666667%',
          'max-width': '41.666667%'
        },
        '.bw-col-md-6': {
          'flex': '0 0 50%',
          'max-width': '50%'
        },
        '.bw-col-md-7': {
          'flex': '0 0 58.333333%',
          'max-width': '58.333333%'
        },
        '.bw-col-md-8': {
          'flex': '0 0 66.666667%',
          'max-width': '66.666667%'
        },
        '.bw-col-md-9': {
          'flex': '0 0 75%',
          'max-width': '75%'
        },
        '.bw-col-md-10': {
          'flex': '0 0 83.333333%',
          'max-width': '83.333333%'
        },
        '.bw-col-md-11': {
          'flex': '0 0 91.666667%',
          'max-width': '91.666667%'
        },
        '.bw-col-md-12': {
          'flex': '0 0 100%',
          'max-width': '100%'
        }
      },
      '@media (min-width: 992px)': {
        '.bw-col-lg-1': {
          'flex': '0 0 8.333333%',
          'max-width': '8.333333%'
        },
        '.bw-col-lg-2': {
          'flex': '0 0 16.666667%',
          'max-width': '16.666667%'
        },
        '.bw-col-lg-3': {
          'flex': '0 0 25%',
          'max-width': '25%'
        },
        '.bw-col-lg-4': {
          'flex': '0 0 33.333333%',
          'max-width': '33.333333%'
        },
        '.bw-col-lg-5': {
          'flex': '0 0 41.666667%',
          'max-width': '41.666667%'
        },
        '.bw-col-lg-6': {
          'flex': '0 0 50%',
          'max-width': '50%'
        },
        '.bw-col-lg-7': {
          'flex': '0 0 58.333333%',
          'max-width': '58.333333%'
        },
        '.bw-col-lg-8': {
          'flex': '0 0 66.666667%',
          'max-width': '66.666667%'
        },
        '.bw-col-lg-9': {
          'flex': '0 0 75%',
          'max-width': '75%'
        },
        '.bw-col-lg-10': {
          'flex': '0 0 83.333333%',
          'max-width': '83.333333%'
        },
        '.bw-col-lg-11': {
          'flex': '0 0 91.666667%',
          'max-width': '91.666667%'
        },
        '.bw-col-lg-12': {
          'flex': '0 0 100%',
          'max-width': '100%'
        }
      }
    }
  };

  /**
   * Merge all style categories into a single flat CSS rules object
   *
   * Returns an object suitable for passing directly to bw.css() or
   * bw.injectCSS(). All category objects are merged via Object.assign,
   * so later categories override earlier ones if selectors collide.
   *
   * @returns {Object} Merged CSS rules object with all selectors
   * @example
   * const allRules = getAllStyles();
   * const cssString = bw.css(allRules);
   * bw.injectCSS(cssString);
   */
  /**
   * Add underscore aliases for all bw- selectors
   * For each selector containing .bw-, adds a duplicate with .bw_ so both work in CSS
   * @param {Object} rules - CSS rules object
   * @returns {Object} - Rules with underscore aliases added
   */
  function addUnderscoreAliases(rules) {
    var result = {};
    for (var _i = 0, _Object$entries = Object.entries(rules); _i < _Object$entries.length; _i++) {
      var _Object$entries$_i = _slicedToArray(_Object$entries[_i], 2),
        selector = _Object$entries$_i[0],
        styles = _Object$entries$_i[1];
      result[selector] = styles;
      // If selector contains .bw-, add underscore variant
      if (selector.includes('.bw-')) {
        var underscoreSelector = selector.replace(/\.bw-/g, '.bw_');
        result[underscoreSelector] = styles;
      }
    }
    return result;
  }
  function getAllStyles() {
    var merged = Object.assign({}, defaultStyles.root, defaultStyles.reset, defaultStyles.typography, defaultStyles.grid, defaultStyles.buttons, defaultStyles.cards, defaultStyles.forms, defaultStyles.navigation, defaultStyles.tables, defaultStyles.alerts, defaultStyles.badges, defaultStyles.progress, defaultStyles.tabs, defaultStyles.listGroups, defaultStyles.pagination, defaultStyles.breadcrumb, defaultStyles.hero, defaultStyles.features, defaultStyles.enhancedCards, defaultStyles.sections, defaultStyles.cta, defaultStyles.utilities, defaultStyles.responsive);
    return addUnderscoreAliases(merged);
  }

  /**
   * Default theme design tokens
   *
   * Provides programmatic access to the design system values used in
   * the CSS. Useful for dynamic styling, color interpolation, and
   * building custom theme overrides.
   *
   * @type {Object}
   * @property {Object} colors - Named color values (primary, secondary, success, etc.)
   * @property {Object} breakpoints - Responsive breakpoint widths in pixels (xs, sm, md, lg, xl, xxl)
   * @property {Object} spacing - Spacing scale (0-5) mapped to rem values
   * @property {Object} typography - Font family and font size scale
   * @property {string} typography.fontFamily - Default sans-serif font stack
   * @property {Object} typography.fontSize - Named size scale (xs through 5xl)
   */
  /**
   * Default theme design tokens
   *
   * Provides programmatic access to the design system values used in
   * the CSS. Useful for dynamic styling, color interpolation, and
   * building custom theme overrides.
   *
   * @type {Object}
   */
  var theme = {
    colors: {
      primary: '#006666',
      secondary: '#6c757d',
      success: '#198754',
      danger: '#dc3545',
      warning: '#ffc107',
      info: '#0dcaf0',
      light: '#f8f9fa',
      dark: '#212529',
      white: '#fff',
      black: '#000'
    },
    breakpoints: {
      xs: 0,
      sm: 576,
      md: 768,
      lg: 992,
      xl: 1200,
      xxl: 1400
    },
    spacing: {
      0: '0',
      1: '0.25rem',
      2: '0.5rem',
      3: '1rem',
      4: '1.5rem',
      5: '3rem'
    },
    typography: {
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      fontSize: {
        xs: '0.75rem',
        sm: '0.875rem',
        base: '1rem',
        lg: '1.125rem',
        xl: '1.25rem',
        '2xl': '1.5rem',
        '3xl': '1.875rem',
        '4xl': '2.25rem',
        '5xl': '3rem'
      }
    },
    darkMode: false
  };

  /**
   * Get dark mode CSS rules
   * @returns {Object} - CSS rules for dark mode
   */
  function getDarkModeStyles() {
    return {
      ':root.bw-dark': {
        '--bw-body-color': '#e9ecef',
        '--bw-body-bg': '#1a1a2e'
      },
      '.bw-dark body, :root.bw-dark body': {
        'color': '#e9ecef',
        'background-color': '#1a1a2e'
      },
      '.bw-dark .bw-card': {
        'background-color': '#16213e',
        'border-color': '#495057',
        'color': '#e9ecef'
      },
      '.bw-dark .bw-navbar': {
        'background-color': '#0f3460'
      },
      '.bw-dark .bw-form-control': {
        'background-color': '#16213e',
        'border-color': '#495057',
        'color': '#e9ecef'
      },
      '.bw-dark .bw-table': {
        'color': '#e9ecef'
      },
      '.bw-dark .bw-table > :not(caption) > * > *': {
        'border-bottom-color': '#495057'
      },
      '.bw-dark .bw-table-striped > tbody > tr:nth-of-type(odd) > *': {
        'background-color': 'rgba(255, 255, 255, 0.05)'
      },
      '.bw-dark .bw-alert': {
        'border-color': '#495057'
      },
      '.bw-dark .bw-list-group-item': {
        'background-color': '#16213e',
        'border-color': '#495057',
        'color': '#e9ecef'
      },
      '@media (prefers-color-scheme: dark)': {
        ':root.bw-auto-dark body': {
          'color': '#e9ecef',
          'background-color': '#1a1a2e'
        }
      }
    };
  }

  /**
   * Deep merge two objects (target is mutated)
   * @param {Object} target
   * @param {Object} source
   * @returns {Object}
   */
  function deepMerge(target, source) {
    for (var _i2 = 0, _Object$keys = Object.keys(source); _i2 < _Object$keys.length; _i2++) {
      var key = _Object$keys[_i2];
      if (source[key] && _typeof(source[key]) === 'object' && !Array.isArray(source[key]) && target[key] && _typeof(target[key]) === 'object' && !Array.isArray(target[key])) {
        deepMerge(target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    }
    return target;
  }

  /**
   * Update the theme with new values (deep merge)
   * @param {Object} overrides - Partial theme object to merge
   */
  function updateTheme(overrides) {
    deepMerge(theme, overrides);
  }

  var _excluded$1 = ["type", "placeholder", "value", "id", "name", "disabled", "readonly", "required", "className", "style"],
    _excluded2 = ["placeholder", "value", "rows", "id", "name", "disabled", "readonly", "required", "className"],
    _excluded3 = ["options", "value", "id", "name", "disabled", "required", "className"];
  /**
   * Bitwrench v2 Components
   *
   * TACO-based UI component library providing Bootstrap-inspired components
   * as pure JavaScript objects. Every make* function returns a TACO object
   * ({t, a, c, o}) that can be rendered with bw.html() or bw.DOM().
   *
   * Components included: Card, Button, Container, Row, Col, Nav, Navbar,
   * Tabs, Alert, Badge, Progress, ListGroup, Breadcrumb, Form controls,
   * Stack, Spinner, Hero, FeatureGrid, CardV2, CTA, Section, CodeDemo.
   *
   * Handle classes (CardHandle, TableHandle, NavbarHandle, TabsHandle)
   * provide imperative DOM manipulation for rendered components.
   *
   * @module bitwrench-components-v2
   * @license BSD-2-Clause
   * @author M A Chatterjee <deftio [at] deftio [dot] com>
   */

  /**
   * Create a card component with optional header, body, and footer
   *
   * @param {Object} [props] - Card configuration
   * @param {string} [props.title] - Card title displayed in the body
   * @param {string|Object|Array} [props.content] - Card body content (string, TACO, or array)
   * @param {string|Object} [props.footer] - Card footer content
   * @param {string|Object} [props.header] - Card header content
   * @param {string} [props.variant] - Color variant (e.g. "primary", "danger")
   * @param {string} [props.className] - Additional CSS classes
   * @param {Object} [props.style] - Inline style object
   * @param {Object} [props.state] - Component state object
   * @returns {Object} TACO object representing a card component
   * @example
   * const card = makeCard({
   *   title: "Status",
   *   content: "All systems operational",
   *   variant: "success"
   * });
   * bw.DOM("#app", card);
   */
  function makeCard() {
    var props = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var title = props.title,
      content = props.content,
      footer = props.footer,
      header = props.header,
      variant = props.variant,
      _props$className = props.className,
      className = _props$className === void 0 ? '' : _props$className,
      style = props.style;
    return {
      t: 'div',
      a: {
        "class": "bw-card ".concat(variant ? "bw-card-".concat(variant) : '', " ").concat(className).trim(),
        style: style
      },
      c: [header && {
        t: 'div',
        a: {
          "class": 'bw-card-header'
        },
        c: header
      }, {
        t: 'div',
        a: {
          "class": 'bw-card-body'
        },
        c: [title && {
          t: 'h5',
          a: {
            "class": 'bw-card-title'
          },
          c: title
        }, content && (Array.isArray(content) ? content : [content])].flat().filter(Boolean)
      }, footer && {
        t: 'div',
        a: {
          "class": 'bw-card-footer'
        },
        c: footer
      }].filter(Boolean),
      o: {
        type: 'card',
        state: props.state || {}
      }
    };
  }

  /**
   * Create a button component
   *
   * @param {Object} [props] - Button configuration
   * @param {string} [props.text] - Button label text
   * @param {string} [props.variant="primary"] - Color variant (e.g. "primary", "secondary", "danger")
   * @param {string} [props.size] - Size variant ("sm" or "lg")
   * @param {boolean} [props.disabled=false] - Whether the button is disabled
   * @param {Function} [props.onclick] - Click event handler
   * @param {string} [props.type="button"] - HTML button type ("button", "submit", "reset")
   * @param {string} [props.className] - Additional CSS classes
   * @param {Object} [props.style] - Inline style object
   * @returns {Object} TACO object representing a button element
   * @example
   * const btn = makeButton({
   *   text: "Save",
   *   variant: "success",
   *   onclick: () => console.log("saved")
   * });
   */
  function makeButton() {
    var props = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var text = props.text,
      _props$variant = props.variant,
      variant = _props$variant === void 0 ? 'primary' : _props$variant,
      size = props.size,
      _props$disabled = props.disabled,
      disabled = _props$disabled === void 0 ? false : _props$disabled,
      onclick = props.onclick,
      _props$type = props.type,
      type = _props$type === void 0 ? 'button' : _props$type,
      _props$className2 = props.className,
      className = _props$className2 === void 0 ? '' : _props$className2,
      style = props.style;
    return {
      t: 'button',
      a: {
        type: type,
        "class": ['bw-btn', "bw-btn-".concat(variant), size && "bw-btn-".concat(size), className].filter(Boolean).join(' '),
        disabled: disabled,
        onclick: onclick,
        style: style
      },
      c: text,
      o: {
        type: 'button'
      }
    };
  }

  /**
   * Create a container component for centering and constraining content width
   *
   * @param {Object} [props] - Container configuration
   * @param {boolean} [props.fluid=false] - Use full-width fluid container
   * @param {Array|Object|string} [props.children] - Child content
   * @param {string} [props.className] - Additional CSS classes
   * @returns {Object} TACO object representing a container div
   * @example
   * const container = makeContainer({
   *   fluid: true,
   *   children: [makeRow({ children: [...] })]
   * });
   */
  function makeContainer() {
    var props = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var _props$fluid = props.fluid,
      fluid = _props$fluid === void 0 ? false : _props$fluid,
      children = props.children,
      _props$className3 = props.className,
      className = _props$className3 === void 0 ? '' : _props$className3;
    return {
      t: 'div',
      a: {
        "class": "bw-container".concat(fluid ? '-fluid' : '', " ").concat(className).trim()
      },
      c: children
    };
  }

  /**
   * Create a flexbox row for the grid system
   *
   * @param {Object} [props] - Row configuration
   * @param {Array|Object|string} [props.children] - Child columns
   * @param {string} [props.className] - Additional CSS classes
   * @param {number} [props.gap] - Gap size (1-5) applied via bw-g-{gap} class
   * @returns {Object} TACO object representing a grid row
   * @example
   * const row = makeRow({
   *   gap: 4,
   *   children: [makeCol({ size: 6, content: "Left" }), makeCol({ size: 6, content: "Right" })]
   * });
   */
  function makeRow() {
    var props = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var children = props.children,
      _props$className4 = props.className,
      className = _props$className4 === void 0 ? '' : _props$className4,
      gap = props.gap;
    return {
      t: 'div',
      a: {
        "class": "bw-row ".concat(gap ? "bw-g-".concat(gap) : '', " ").concat(className).trim()
      },
      c: children
    };
  }

  /**
   * Create a grid column with responsive sizing
   *
   * Supports both fixed and responsive column sizes. Pass an object for
   * responsive breakpoints (e.g. {xs: 12, md: 6, lg: 4}).
   *
   * @param {Object} [props] - Column configuration
   * @param {number|Object} [props.size] - Column size (1-12) or responsive object {xs, sm, md, lg, xl}
   * @param {number} [props.offset] - Column offset (1-12)
   * @param {number} [props.push] - Column push (1-12)
   * @param {number} [props.pull] - Column pull (1-12)
   * @param {Array|Object|string} [props.content] - Column content (alias for children)
   * @param {Array|Object|string} [props.children] - Column content
   * @param {string} [props.className] - Additional CSS classes
   * @returns {Object} TACO object representing a grid column
   * @example
   * const col = makeCol({ size: { xs: 12, md: 6 }, content: "Responsive column" });
   */
  function makeCol() {
    var props = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var size = props.size,
      offset = props.offset,
      push = props.push,
      pull = props.pull,
      content = props.content,
      children = props.children,
      _props$className5 = props.className,
      className = _props$className5 === void 0 ? '' : _props$className5;
    var classes = [];
    if (_typeof(size) === 'object') {
      // Responsive sizes
      Object.entries(size).forEach(function (_ref) {
        var _ref2 = _slicedToArray(_ref, 2),
          breakpoint = _ref2[0],
          value = _ref2[1];
        if (breakpoint === 'xs') {
          classes.push("bw-col-".concat(value));
        } else {
          classes.push("bw-col-".concat(breakpoint, "-").concat(value));
        }
      });
    } else if (size) {
      classes.push("bw-col-".concat(size));
    } else {
      classes.push('bw-col');
    }
    if (offset) classes.push("bw-offset-".concat(offset));
    if (push) classes.push("bw-push-".concat(push));
    if (pull) classes.push("bw-pull-".concat(pull));
    return {
      t: 'div',
      a: {
        "class": "".concat(classes.join(' '), " ").concat(className).trim()
      },
      c: content || children
    };
  }

  /**
   * Create a navigation component with tabs or pills styling
   *
   * @param {Object} [props] - Nav configuration
   * @param {Array<Object>} [props.items=[]] - Navigation items
   * @param {string} props.items[].text - Item display text
   * @param {string} [props.items[].href="#"] - Item link URL
   * @param {boolean} [props.items[].active] - Whether this item is active
   * @param {boolean} [props.items[].disabled] - Whether this item is disabled
   * @param {boolean} [props.pills=false] - Use pill styling instead of tabs
   * @param {boolean} [props.vertical=false] - Stack items vertically
   * @param {string} [props.className] - Additional CSS classes
   * @returns {Object} TACO object representing a nav element
   * @example
   * const nav = makeNav({
   *   pills: true,
   *   items: [
   *     { text: "Home", href: "/", active: true },
   *     { text: "About", href: "/about" }
   *   ]
   * });
   */
  function makeNav() {
    var props = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var _props$items = props.items,
      items = _props$items === void 0 ? [] : _props$items,
      _props$pills = props.pills,
      pills = _props$pills === void 0 ? false : _props$pills,
      _props$vertical = props.vertical,
      vertical = _props$vertical === void 0 ? false : _props$vertical,
      _props$className6 = props.className,
      className = _props$className6 === void 0 ? '' : _props$className6;
    return {
      t: 'ul',
      a: {
        "class": "bw-nav ".concat(pills ? 'bw-nav-pills' : 'bw-nav-tabs', " ").concat(vertical ? 'bw-nav-vertical' : '', " ").concat(className).trim()
      },
      c: items.map(function (item) {
        return {
          t: 'li',
          a: {
            "class": 'bw-nav-item'
          },
          c: {
            t: 'a',
            a: {
              href: item.href || '#',
              "class": "bw-nav-link ".concat(item.active ? 'active' : '', " ").concat(item.disabled ? 'disabled' : '').trim()
            },
            c: item.text
          }
        };
      })
    };
  }

  /**
   * Create a navbar component with brand and navigation links
   *
   * @param {Object} [props] - Navbar configuration
   * @param {string} [props.brand] - Brand name or logo text
   * @param {string} [props.brandHref="#"] - Brand link URL
   * @param {Array<Object>} [props.items=[]] - Navigation items
   * @param {string} props.items[].text - Item display text
   * @param {string} [props.items[].href="#"] - Item link URL
   * @param {boolean} [props.items[].active] - Whether this item is active
   * @param {boolean} [props.dark=true] - Use dark theme styling
   * @param {string} [props.className] - Additional CSS classes
   * @returns {Object} TACO object representing a navbar element
   * @example
   * const navbar = makeNavbar({
   *   brand: "MyApp",
   *   dark: true,
   *   items: [
   *     { text: "Home", href: "/", active: true },
   *     { text: "Docs", href: "/docs" }
   *   ]
   * });
   */
  function makeNavbar() {
    var props = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var brand = props.brand,
      _props$brandHref = props.brandHref,
      brandHref = _props$brandHref === void 0 ? '#' : _props$brandHref,
      _props$items2 = props.items,
      items = _props$items2 === void 0 ? [] : _props$items2,
      _props$dark = props.dark,
      dark = _props$dark === void 0 ? true : _props$dark,
      _props$className7 = props.className,
      className = _props$className7 === void 0 ? '' : _props$className7;
    return {
      t: 'nav',
      a: {
        "class": "bw-navbar ".concat(dark ? 'bw-navbar-dark' : 'bw-navbar-light', " ").concat(className).trim()
      },
      c: {
        t: 'div',
        a: {
          "class": 'bw-container'
        },
        c: [brand && {
          t: 'a',
          a: {
            href: brandHref,
            "class": 'bw-navbar-brand'
          },
          c: brand
        }, items.length > 0 && {
          t: 'div',
          a: {
            "class": 'bw-navbar-nav'
          },
          c: items.map(function (item) {
            return {
              t: 'a',
              a: {
                href: item.href || '#',
                "class": "bw-nav-link ".concat(item.active ? 'active' : '')
              },
              c: item.text
            };
          })
        }].filter(Boolean)
      },
      o: {
        type: 'navbar',
        state: {
          activeItem: items.findIndex(function (i) {
            return i.active;
          })
        }
      }
    };
  }

  /**
   * Create a tabbed interface with accessible tab navigation
   *
   * Each tab is rendered as a button with ARIA attributes for accessibility.
   * Clicking a tab shows its content pane and hides others. The active tab
   * can be set via activeIndex or by setting active:true on a tab item.
   *
   * @param {Object} [props] - Tabs configuration
   * @param {Array<Object>} [props.tabs=[]] - Tab definitions
   * @param {string} props.tabs[].label - Tab button label
   * @param {string|Object|Array} props.tabs[].content - Tab pane content
   * @param {boolean} [props.tabs[].active] - Whether this tab is initially active
   * @param {number} [props.activeIndex=0] - Default active tab index (overridden by tab.active)
   * @returns {Object} TACO object representing a tabbed interface
   * @example
   * const tabs = makeTabs({
   *   tabs: [
   *     { label: "Overview", content: "Tab 1 content", active: true },
   *     { label: "Details", content: "Tab 2 content" }
   *   ]
   * });
   * bw.DOM("#app", tabs);
   */
  function makeTabs() {
    var props = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var _props$tabs = props.tabs,
      tabs = _props$tabs === void 0 ? [] : _props$tabs,
      _props$activeIndex = props.activeIndex,
      activeIndex = _props$activeIndex === void 0 ? 0 : _props$activeIndex;

    // Find the active tab index based on the active property or use activeIndex
    var actualActiveIndex = activeIndex;
    tabs.forEach(function (tab, index) {
      if (tab.active) {
        actualActiveIndex = index;
      }
    });
    return {
      t: 'div',
      a: {
        "class": 'bw-tabs'
      },
      c: [{
        t: 'ul',
        a: {
          "class": 'bw-nav bw-nav-tabs',
          role: 'tablist'
        },
        c: tabs.map(function (tab, index) {
          return {
            t: 'li',
            a: {
              "class": 'bw-nav-item',
              role: 'presentation'
            },
            c: {
              t: 'button',
              a: {
                "class": "bw-nav-link ".concat(index === actualActiveIndex ? 'active' : ''),
                type: 'button',
                role: 'tab',
                'aria-selected': index === actualActiveIndex ? 'true' : 'false',
                'data-tab-index': index,
                onclick: function onclick(e) {
                  var tabsContainer = e.target.closest('.bw-tabs');
                  var allTabs = tabsContainer.querySelectorAll('.bw-nav-link');
                  var allPanes = tabsContainer.querySelectorAll('.bw-tab-pane');
                  allTabs.forEach(function (t) {
                    t.classList.remove('active');
                    t.setAttribute('aria-selected', 'false');
                  });
                  allPanes.forEach(function (p) {
                    return p.classList.remove('active');
                  });
                  e.target.classList.add('active');
                  e.target.setAttribute('aria-selected', 'true');
                  var targetIndex = parseInt(e.target.getAttribute('data-tab-index'));
                  allPanes[targetIndex].classList.add('active');
                }
              },
              c: tab.label
            }
          };
        })
      }, {
        t: 'div',
        a: {
          "class": 'bw-tab-content'
        },
        c: tabs.map(function (tab, index) {
          return {
            t: 'div',
            a: {
              "class": "bw-tab-pane ".concat(index === actualActiveIndex ? 'active' : ''),
              role: 'tabpanel'
            },
            c: tab.content
          };
        })
      }],
      o: {
        type: 'tabs',
        state: {
          activeIndex: actualActiveIndex
        }
      }
    };
  }

  /**
   * Create an alert/notification component
   *
   * @param {Object} [props] - Alert configuration
   * @param {string|Object|Array} [props.content] - Alert message content
   * @param {string} [props.variant="info"] - Color variant ("primary", "secondary", "success", "danger", "warning", "info", "light", "dark")
   * @param {boolean} [props.dismissible=false] - Show a close button to dismiss the alert
   * @param {string} [props.className] - Additional CSS classes
   * @returns {Object} TACO object representing an alert element
   * @example
   * const alert = makeAlert({
   *   content: "Operation completed successfully!",
   *   variant: "success",
   *   dismissible: true
   * });
   */
  function makeAlert() {
    var props = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var content = props.content,
      _props$variant2 = props.variant,
      variant = _props$variant2 === void 0 ? 'info' : _props$variant2,
      _props$dismissible = props.dismissible,
      dismissible = _props$dismissible === void 0 ? false : _props$dismissible,
      _props$className8 = props.className,
      className = _props$className8 === void 0 ? '' : _props$className8;
    return {
      t: 'div',
      a: {
        "class": "bw-alert bw-alert-".concat(variant, " ").concat(dismissible ? 'bw-alert-dismissible' : '', " ").concat(className).trim(),
        role: 'alert'
      },
      c: [content, dismissible && {
        t: 'button',
        a: {
          type: 'button',
          "class": 'bw-close',
          'aria-label': 'Close'
        },
        c: '×'
      }].filter(Boolean)
    };
  }

  /**
   * Create an inline badge/label component
   *
   * @param {Object} [props] - Badge configuration
   * @param {string} [props.text] - Badge display text
   * @param {string} [props.variant="primary"] - Color variant
   * @param {boolean} [props.pill=false] - Use pill (rounded) shape
   * @param {string} [props.className] - Additional CSS classes
   * @returns {Object} TACO object representing a badge span
   * @example
   * const badge = makeBadge({ text: "New", variant: "danger", pill: true });
   */
  function makeBadge() {
    var props = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var text = props.text,
      _props$variant3 = props.variant,
      variant = _props$variant3 === void 0 ? 'primary' : _props$variant3,
      _props$pill = props.pill,
      pill = _props$pill === void 0 ? false : _props$pill,
      _props$className9 = props.className,
      className = _props$className9 === void 0 ? '' : _props$className9;
    return {
      t: 'span',
      a: {
        "class": "bw-badge bw-badge-".concat(variant, " ").concat(pill ? 'bw-badge-pill' : '', " ").concat(className).trim()
      },
      c: text
    };
  }

  /**
   * Create a progress bar component with ARIA accessibility
   *
   * @param {Object} [props] - Progress bar configuration
   * @param {number} [props.value=0] - Current progress value
   * @param {number} [props.max=100] - Maximum value
   * @param {string} [props.variant="primary"] - Color variant
   * @param {boolean} [props.striped=false] - Use striped pattern
   * @param {boolean} [props.animated=false] - Animate the stripes
   * @param {string} [props.label] - Custom label text (defaults to percentage)
   * @param {number} [props.height] - Custom height in pixels
   * @returns {Object} TACO object representing a progress bar
   * @example
   * const progress = makeProgress({
   *   value: 75,
   *   variant: "success",
   *   striped: true,
   *   animated: true
   * });
   */
  function makeProgress() {
    var props = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var _props$value = props.value,
      value = _props$value === void 0 ? 0 : _props$value,
      _props$max = props.max,
      max = _props$max === void 0 ? 100 : _props$max,
      _props$variant4 = props.variant,
      variant = _props$variant4 === void 0 ? 'primary' : _props$variant4,
      _props$striped = props.striped,
      striped = _props$striped === void 0 ? false : _props$striped,
      _props$animated = props.animated,
      animated = _props$animated === void 0 ? false : _props$animated,
      label = props.label,
      height = props.height;
    var percentage = Math.round(value / max * 100);
    return {
      t: 'div',
      a: {
        "class": 'bw-progress',
        style: height ? {
          height: "".concat(height, "px")
        } : undefined
      },
      c: {
        t: 'div',
        a: {
          "class": ['bw-progress-bar', "bw-progress-bar-".concat(variant), striped && 'bw-progress-bar-striped', animated && 'bw-progress-bar-animated'].filter(Boolean).join(' '),
          role: 'progressbar',
          style: {
            width: "".concat(percentage, "%")
          },
          'aria-valuenow': value,
          'aria-valuemin': 0,
          'aria-valuemax': max
        },
        c: label || "".concat(percentage, "%")
      }
    };
  }

  /**
   * Create a list group component for displaying lists of items
   *
   * Items can be simple strings or objects with text, active, disabled,
   * href, and onclick properties. When interactive is true or items have
   * href/onclick, items render as anchor tags.
   *
   * @param {Object} [props] - List group configuration
   * @param {Array<string|Object>} [props.items=[]] - List items (strings or objects)
   * @param {string} props.items[].text - Item display text
   * @param {boolean} [props.items[].active] - Whether this item is active
   * @param {boolean} [props.items[].disabled] - Whether this item is disabled
   * @param {string} [props.items[].href] - Item link URL
   * @param {Function} [props.items[].onclick] - Item click handler
   * @param {boolean} [props.flush=false] - Remove borders for use inside cards
   * @param {boolean} [props.interactive=false] - Make all items interactive (anchor tags)
   * @returns {Object} TACO object representing a list group
   * @example
   * const list = makeListGroup({
   *   interactive: true,
   *   items: [
   *     { text: "Active item", active: true },
   *     { text: "Regular item" },
   *     { text: "Disabled item", disabled: true }
   *   ]
   * });
   */
  function makeListGroup() {
    var props = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var _props$items3 = props.items,
      items = _props$items3 === void 0 ? [] : _props$items3,
      _props$flush = props.flush,
      flush = _props$flush === void 0 ? false : _props$flush,
      _props$interactive = props.interactive,
      interactive = _props$interactive === void 0 ? false : _props$interactive;
    return {
      t: 'div',
      a: {
        "class": "bw-list-group ".concat(flush ? 'bw-list-group-flush' : '').trim()
      },
      c: items.map(function (item) {
        var isObject = _typeof(item) === 'object';
        var text = isObject ? item.text : item;
        var active = isObject ? item.active : false;
        var disabled = isObject ? item.disabled : false;
        var href = isObject ? item.href : null;
        var onclick = isObject ? item.onclick : null;

        // For interactive items or items with href/onclick, use anchor tag
        if (interactive || href || onclick) {
          return {
            t: 'a',
            a: {
              "class": ['bw-list-group-item', active && 'active', disabled && 'disabled'].filter(Boolean).join(' '),
              href: href || '#',
              onclick: onclick || function (e) {
                if (!href) e.preventDefault();
              },
              style: disabled ? 'pointer-events: none; opacity: 0.65;' : ''
            },
            c: text
          };
        }

        // For non-interactive items, use div
        return {
          t: 'div',
          a: {
            "class": ['bw-list-group-item', active && 'active', disabled && 'disabled'].filter(Boolean).join(' ')
          },
          c: text
        };
      })
    };
  }

  /**
   * Create a breadcrumb navigation component
   *
   * The last item with active:true is rendered as plain text (no link).
   * All other items render as anchor tags.
   *
   * @param {Object} [props] - Breadcrumb configuration
   * @param {Array<Object>} [props.items=[]] - Breadcrumb items
   * @param {string} props.items[].text - Item display text
   * @param {string} [props.items[].href="#"] - Item link URL
   * @param {boolean} [props.items[].active] - Whether this is the current page
   * @returns {Object} TACO object representing a breadcrumb nav
   * @example
   * const crumbs = makeBreadcrumb({
   *   items: [
   *     { text: "Home", href: "/" },
   *     { text: "Products", href: "/products" },
   *     { text: "Widget", active: true }
   *   ]
   * });
   */
  function makeBreadcrumb() {
    var props = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var _props$items4 = props.items,
      items = _props$items4 === void 0 ? [] : _props$items4;
    return {
      t: 'nav',
      a: {
        'aria-label': 'breadcrumb'
      },
      c: {
        t: 'ol',
        a: {
          "class": 'bw-breadcrumb'
        },
        c: items.map(function (item, index) {
          return {
            t: 'li',
            a: {
              "class": "bw-breadcrumb-item ".concat(item.active ? 'active' : ''),
              'aria-current': item.active ? 'page' : undefined
            },
            c: item.active ? item.text : {
              t: 'a',
              a: {
                href: item.href || '#'
              },
              c: item.text
            }
          };
        })
      }
    };
  }

  /**
   * Create a form wrapper with default submit prevention
   *
   * @param {Object} [props] - Form configuration
   * @param {Array|Object|string} [props.children] - Form contents (form groups, inputs, buttons)
   * @param {Function} [props.onsubmit] - Submit handler (defaults to preventDefault)
   * @param {string} [props.className] - Additional CSS classes
   * @returns {Object} TACO object representing a form element
   * @example
   * const form = makeForm({
   *   onsubmit: (e) => { e.preventDefault(); handleSubmit(); },
   *   children: [
   *     makeFormGroup({ label: "Name", input: makeInput({ placeholder: "Enter name" }) }),
   *     makeButton({ text: "Submit", type: "submit" })
   *   ]
   * });
   */
  function makeForm() {
    var props = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var children = props.children,
      onsubmit = props.onsubmit,
      _props$className10 = props.className,
      className = _props$className10 === void 0 ? '' : _props$className10;
    return {
      t: 'form',
      a: {
        "class": className,
        onsubmit: onsubmit || function (e) {
          return e.preventDefault();
        }
      },
      c: children
    };
  }

  /**
   * Create a form group with label, input, and optional help text
   *
   * @param {Object} [props] - Form group configuration
   * @param {string} [props.label] - Label text
   * @param {Object} [props.input] - Input TACO object (from makeInput, makeSelect, etc.)
   * @param {string} [props.help] - Help text displayed below the input
   * @param {string} [props.id] - Input ID (links label to input via for/id)
   * @returns {Object} TACO object representing a form group
   * @example
   * const group = makeFormGroup({
   *   label: "Email",
   *   id: "email",
   *   input: makeInput({ type: "email", id: "email", placeholder: "you@example.com" }),
   *   help: "We'll never share your email."
   * });
   */
  function makeFormGroup() {
    var props = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var label = props.label,
      input = props.input,
      help = props.help,
      id = props.id;
    return {
      t: 'div',
      a: {
        "class": 'bw-form-group'
      },
      c: [label && {
        t: 'label',
        a: {
          "for": id,
          "class": 'bw-form-label'
        },
        c: label
      }, input, help && {
        t: 'small',
        a: {
          "class": 'bw-form-text bw-text-muted'
        },
        c: help
      }].filter(Boolean)
    };
  }

  /**
   * Create an input element with form control styling
   *
   * Additional event handlers (oninput, onchange, etc.) can be passed
   * as extra properties and are spread onto the element attributes.
   *
   * @param {Object} [props] - Input configuration
   * @param {string} [props.type="text"] - Input type ("text", "email", "password", "number", etc.)
   * @param {string} [props.placeholder] - Placeholder text
   * @param {string} [props.value] - Input value
   * @param {string} [props.id] - Element ID
   * @param {string} [props.name] - Input name attribute
   * @param {boolean} [props.disabled=false] - Whether the input is disabled
   * @param {boolean} [props.readonly=false] - Whether the input is read-only
   * @param {boolean} [props.required=false] - Whether the input is required
   * @param {string} [props.className] - Additional CSS classes
   * @param {Object} [props.style] - Inline style object
   * @returns {Object} TACO object representing an input element
   * @example
   * const input = makeInput({
   *   type: "email",
   *   placeholder: "you@example.com",
   *   required: true,
   *   oninput: (e) => validate(e.target.value)
   * });
   */
  function makeInput() {
    var props = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var _props$type2 = props.type,
      type = _props$type2 === void 0 ? 'text' : _props$type2,
      placeholder = props.placeholder,
      value = props.value,
      id = props.id,
      name = props.name,
      _props$disabled2 = props.disabled,
      disabled = _props$disabled2 === void 0 ? false : _props$disabled2,
      _props$readonly = props.readonly,
      readonly = _props$readonly === void 0 ? false : _props$readonly,
      _props$required = props.required,
      required = _props$required === void 0 ? false : _props$required,
      _props$className11 = props.className,
      className = _props$className11 === void 0 ? '' : _props$className11,
      style = props.style,
      eventHandlers = _objectWithoutProperties(props, _excluded$1);
    return {
      t: 'input',
      a: _objectSpread2({
        type: type,
        "class": "bw-form-control ".concat(className).trim(),
        placeholder: placeholder,
        value: value,
        id: id,
        name: name,
        style: style,
        disabled: disabled,
        readonly: readonly,
        required: required
      }, eventHandlers)
    };
  }

  /**
   * Create a textarea element with form control styling
   *
   * @param {Object} [props] - Textarea configuration
   * @param {string} [props.placeholder] - Placeholder text
   * @param {string} [props.value] - Textarea content
   * @param {number} [props.rows=3] - Number of visible text rows
   * @param {string} [props.id] - Element ID
   * @param {string} [props.name] - Textarea name attribute
   * @param {boolean} [props.disabled=false] - Whether the textarea is disabled
   * @param {boolean} [props.readonly=false] - Whether the textarea is read-only
   * @param {boolean} [props.required=false] - Whether the textarea is required
   * @param {string} [props.className] - Additional CSS classes
   * @returns {Object} TACO object representing a textarea element
   * @example
   * const textarea = makeTextarea({
   *   rows: 5,
   *   placeholder: "Enter your message...",
   *   required: true
   * });
   */
  function makeTextarea() {
    var props = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var placeholder = props.placeholder,
      value = props.value,
      _props$rows = props.rows,
      rows = _props$rows === void 0 ? 3 : _props$rows,
      id = props.id,
      name = props.name,
      _props$disabled3 = props.disabled,
      disabled = _props$disabled3 === void 0 ? false : _props$disabled3,
      _props$readonly2 = props.readonly,
      readonly = _props$readonly2 === void 0 ? false : _props$readonly2,
      _props$required2 = props.required,
      required = _props$required2 === void 0 ? false : _props$required2,
      _props$className12 = props.className,
      className = _props$className12 === void 0 ? '' : _props$className12,
      eventHandlers = _objectWithoutProperties(props, _excluded2);
    return {
      t: 'textarea',
      a: _objectSpread2({
        "class": "bw-form-control ".concat(className).trim(),
        placeholder: placeholder,
        rows: rows,
        id: id,
        name: name,
        disabled: disabled,
        readonly: readonly,
        required: required
      }, eventHandlers),
      c: value
    };
  }

  /**
   * Create a select dropdown with options
   *
   * @param {Object} [props] - Select configuration
   * @param {Array<Object>} [props.options=[]] - Dropdown options
   * @param {string} props.options[].value - Option value
   * @param {string} [props.options[].text] - Option display text (defaults to value)
   * @param {string} [props.value] - Currently selected value
   * @param {string} [props.id] - Element ID
   * @param {string} [props.name] - Select name attribute
   * @param {boolean} [props.disabled=false] - Whether the select is disabled
   * @param {boolean} [props.required=false] - Whether the select is required
   * @param {string} [props.className] - Additional CSS classes
   * @returns {Object} TACO object representing a select element
   * @example
   * const select = makeSelect({
   *   value: "b",
   *   options: [
   *     { value: "a", text: "Option A" },
   *     { value: "b", text: "Option B" },
   *     { value: "c", text: "Option C" }
   *   ]
   * });
   */
  function makeSelect() {
    var props = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var _props$options = props.options,
      options = _props$options === void 0 ? [] : _props$options,
      value = props.value,
      id = props.id,
      name = props.name,
      _props$disabled4 = props.disabled,
      disabled = _props$disabled4 === void 0 ? false : _props$disabled4,
      _props$required3 = props.required,
      required = _props$required3 === void 0 ? false : _props$required3,
      _props$className13 = props.className,
      className = _props$className13 === void 0 ? '' : _props$className13,
      eventHandlers = _objectWithoutProperties(props, _excluded3);
    return {
      t: 'select',
      a: _objectSpread2({
        "class": "bw-form-control ".concat(className).trim(),
        id: id,
        name: name,
        disabled: disabled,
        required: required
      }, eventHandlers),
      c: options.map(function (opt) {
        return {
          t: 'option',
          a: {
            value: opt.value,
            selected: opt.value === value
          },
          c: opt.text || opt.value
        };
      })
    };
  }

  /**
   * Create a checkbox input with label
   *
   * @param {Object} [props] - Checkbox configuration
   * @param {string} [props.label] - Checkbox label text
   * @param {boolean} [props.checked=false] - Whether the checkbox is checked
   * @param {string} [props.id] - Element ID (links label to checkbox)
   * @param {string} [props.name] - Input name attribute
   * @param {boolean} [props.disabled=false] - Whether the checkbox is disabled
   * @param {string} [props.value] - Checkbox value attribute
   * @returns {Object} TACO object representing a checkbox form group
   * @example
   * const checkbox = makeCheckbox({
   *   label: "I agree to the terms",
   *   id: "agree",
   *   checked: false
   * });
   */
  function makeCheckbox() {
    var props = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var label = props.label,
      _props$checked = props.checked,
      checked = _props$checked === void 0 ? false : _props$checked,
      id = props.id,
      name = props.name,
      _props$disabled5 = props.disabled,
      disabled = _props$disabled5 === void 0 ? false : _props$disabled5,
      value = props.value;
    return {
      t: 'div',
      a: {
        "class": 'bw-form-check'
      },
      c: [{
        t: 'input',
        a: {
          type: 'checkbox',
          "class": 'bw-form-check-input',
          checked: checked,
          id: id,
          name: name,
          disabled: disabled,
          value: value
        }
      }, label && {
        t: 'label',
        a: {
          "class": 'bw-form-check-label',
          "for": id
        },
        c: label
      }].filter(Boolean)
    };
  }

  /**
   * Create a flexbox stack layout (vertical or horizontal)
   *
   * @param {Object} [props] - Stack configuration
   * @param {Array|Object|string} [props.children] - Stack children
   * @param {string} [props.direction="vertical"] - Stack direction ("vertical" or "horizontal")
   * @param {number} [props.gap=3] - Gap size (0-5)
   * @param {string} [props.className] - Additional CSS classes
   * @returns {Object} TACO object representing a stack layout
   * @example
   * const stack = makeStack({
   *   direction: "horizontal",
   *   gap: 2,
   *   children: [
   *     makeButton({ text: "Cancel", variant: "secondary" }),
   *     makeButton({ text: "Save", variant: "primary" })
   *   ]
   * });
   */
  function makeStack() {
    var props = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var children = props.children,
      _props$direction = props.direction,
      direction = _props$direction === void 0 ? 'vertical' : _props$direction,
      _props$gap = props.gap,
      gap = _props$gap === void 0 ? 3 : _props$gap,
      _props$className14 = props.className,
      className = _props$className14 === void 0 ? '' : _props$className14;
    return {
      t: 'div',
      a: {
        "class": "bw-".concat(direction === 'vertical' ? 'vstack' : 'hstack', " bw-gap-").concat(gap, " ").concat(className).trim()
      },
      c: children
    };
  }

  /**
   * Create a loading spinner indicator
   *
   * @param {Object} [props] - Spinner configuration
   * @param {string} [props.variant="primary"] - Color variant
   * @param {string} [props.size="md"] - Spinner size ("sm", "md", "lg")
   * @param {string} [props.type="border"] - Spinner type ("border" or "grow")
   * @returns {Object} TACO object representing a spinner with screen-reader text
   * @example
   * const spinner = makeSpinner({ variant: "info", size: "sm" });
   */
  function makeSpinner() {
    var props = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var _props$variant5 = props.variant,
      variant = _props$variant5 === void 0 ? 'primary' : _props$variant5,
      _props$size = props.size,
      size = _props$size === void 0 ? 'md' : _props$size,
      _props$type3 = props.type,
      type = _props$type3 === void 0 ? 'border' : _props$type3;
    return {
      t: 'div',
      a: {
        "class": "bw-spinner-".concat(type, " bw-spinner-").concat(type, "-").concat(size, " bw-text-").concat(variant),
        role: 'status'
      },
      c: {
        t: 'span',
        a: {
          "class": 'bw-visually-hidden'
        },
        c: 'Loading...'
      }
    };
  }

  /**
   * Create a hero section for landing pages and headers
   *
   * Supports gradient backgrounds, background images with overlays,
   * and action buttons. Commonly used as the first visible section.
   *
   * @param {Object} [props] - Hero configuration
   * @param {string} [props.title] - Main headline text
   * @param {string} [props.subtitle] - Supporting description text
   * @param {string|Object|Array} [props.content] - Additional body content
   * @param {string} [props.variant="primary"] - Background variant ("primary", "secondary", "light", "dark")
   * @param {string} [props.size="lg"] - Vertical padding size ("sm", "md", "lg", "xl")
   * @param {boolean} [props.centered=true] - Center-align text
   * @param {boolean} [props.overlay=false] - Add dark overlay (for background images)
   * @param {string} [props.backgroundImage] - Background image URL
   * @param {Array|Object} [props.actions] - Call-to-action buttons
   * @param {string} [props.className] - Additional CSS classes
   * @returns {Object} TACO object representing a hero section
   * @example
   * const hero = makeHero({
   *   title: "Welcome to Bitwrench",
   *   subtitle: "Build UIs with pure JavaScript",
   *   variant: "dark",
   *   actions: [
   *     makeButton({ text: "Get Started", variant: "primary", size: "lg" }),
   *     makeButton({ text: "Learn More", variant: "outline-light", size: "lg" })
   *   ]
   * });
   */
  function makeHero() {
    var props = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var title = props.title,
      subtitle = props.subtitle,
      content = props.content,
      _props$variant6 = props.variant,
      variant = _props$variant6 === void 0 ? 'primary' : _props$variant6,
      _props$size2 = props.size,
      size = _props$size2 === void 0 ? 'lg' : _props$size2,
      _props$centered = props.centered,
      centered = _props$centered === void 0 ? true : _props$centered,
      _props$overlay = props.overlay,
      overlay = _props$overlay === void 0 ? false : _props$overlay,
      backgroundImage = props.backgroundImage,
      actions = props.actions,
      _props$className15 = props.className,
      className = _props$className15 === void 0 ? '' : _props$className15;
    var sizeClasses = {
      sm: 'bw-py-3',
      md: 'bw-py-4',
      lg: 'bw-py-5',
      xl: 'bw-py-6'
    };
    return {
      t: 'section',
      a: {
        "class": "bw-hero bw-hero-".concat(variant, " ").concat(sizeClasses[size] || sizeClasses.lg, " ").concat(centered ? 'bw-text-center' : '', " ").concat(className).trim(),
        style: backgroundImage ? "background-image: url('".concat(backgroundImage, "'); background-size: cover; background-position: center;") : undefined
      },
      c: [overlay && {
        t: 'div',
        a: {
          "class": 'bw-hero-overlay'
        }
      }, {
        t: 'div',
        a: {
          "class": 'bw-container'
        },
        c: {
          t: 'div',
          a: {
            "class": 'bw-hero-content'
          },
          c: [title && {
            t: 'h1',
            a: {
              "class": 'bw-hero-title bw-display-4 bw-mb-3'
            },
            c: title
          }, subtitle && {
            t: 'p',
            a: {
              "class": 'bw-hero-subtitle bw-lead bw-mb-4'
            },
            c: subtitle
          }, content, actions && {
            t: 'div',
            a: {
              "class": 'bw-hero-actions bw-mt-4'
            },
            c: actions
          }].filter(Boolean)
        }
      }].filter(Boolean)
    };
  }

  /**
   * Create a responsive feature grid for showcasing capabilities
   *
   * Renders features in an equal-width column grid with optional icons,
   * titles, and descriptions.
   *
   * @param {Object} [props] - Feature grid configuration
   * @param {Array<Object>} [props.features=[]] - Feature items
   * @param {string} [props.features[].icon] - Icon content (emoji, HTML entity, or text)
   * @param {string} [props.features[].title] - Feature title
   * @param {string} [props.features[].description] - Feature description text
   * @param {number} [props.columns=3] - Number of columns (divides 12-col grid)
   * @param {boolean} [props.centered=true] - Center-align feature text
   * @param {string} [props.iconSize="3rem"] - Icon font size
   * @param {string} [props.className] - Additional CSS classes
   * @returns {Object} TACO object representing a feature grid
   * @example
   * const features = makeFeatureGrid({
   *   columns: 3,
   *   features: [
   *     { icon: "⚡", title: "Fast", description: "Zero build step" },
   *     { icon: "📦", title: "Small", description: "Under 45KB gzipped" },
   *     { icon: "🔧", title: "Flexible", description: "Pure JS objects" }
   *   ]
   * });
   */
  function makeFeatureGrid() {
    var props = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var _props$features = props.features,
      features = _props$features === void 0 ? [] : _props$features,
      _props$columns = props.columns,
      columns = _props$columns === void 0 ? 3 : _props$columns,
      _props$centered2 = props.centered,
      centered = _props$centered2 === void 0 ? true : _props$centered2,
      _props$iconSize = props.iconSize,
      iconSize = _props$iconSize === void 0 ? '3rem' : _props$iconSize,
      _props$className16 = props.className,
      className = _props$className16 === void 0 ? '' : _props$className16;
    var colClass = "bw-col-md-".concat(12 / columns);
    return {
      t: 'div',
      a: {
        "class": "bw-feature-grid ".concat(className).trim()
      },
      c: {
        t: 'div',
        a: {
          "class": 'bw-row bw-g-4'
        },
        c: features.map(function (feature) {
          return {
            t: 'div',
            a: {
              "class": colClass
            },
            c: {
              t: 'div',
              a: {
                "class": "bw-feature ".concat(centered ? 'bw-text-center' : '')
              },
              c: [feature.icon && {
                t: 'div',
                a: {
                  "class": 'bw-feature-icon bw-mb-3',
                  style: "font-size: ".concat(iconSize, "; color: var(--bw-primary);")
                },
                c: feature.icon
              }, feature.title && {
                t: 'h3',
                a: {
                  "class": 'bw-feature-title bw-h5 bw-mb-2'
                },
                c: feature.title
              }, feature.description && {
                t: 'p',
                a: {
                  "class": 'bw-feature-description bw-text-muted'
                },
                c: feature.description
              }].filter(Boolean)
            }
          };
        })
      }
    };
  }

  /**
   * Create an enhanced card with image support, shadows, and hover effects
   *
   * Extended version of makeCard with support for images (top, bottom, left, right),
   * shadow levels, subtitle, hover animation, and custom section class overrides.
   * For horizontal image layouts (left/right), content is wrapped in a row grid.
   *
   * @param {Object} [props] - Enhanced card configuration
   * @param {string} [props.title] - Card title
   * @param {string} [props.subtitle] - Card subtitle (muted text below title)
   * @param {string|Object|Array} [props.content] - Card body content
   * @param {string|Object} [props.footer] - Card footer content
   * @param {string|Object} [props.header] - Card header content
   * @param {Object} [props.image] - Card image configuration
   * @param {string} props.image.src - Image source URL
   * @param {string} [props.image.alt] - Image alt text
   * @param {string} [props.imagePosition="top"] - Image position ("top", "bottom", "left", "right")
   * @param {string} [props.variant] - Color variant
   * @param {boolean} [props.bordered=true] - Show card border
   * @param {string} [props.shadow="sm"] - Shadow level ("none", "sm", "md", "lg")
   * @param {boolean} [props.hoverable=false] - Enable hover lift animation
   * @param {string} [props.className] - Additional CSS classes
   * @param {Object} [props.style] - Inline style object
   * @param {string} [props.headerClass] - Additional header CSS classes
   * @param {string} [props.bodyClass] - Additional body CSS classes
   * @param {string} [props.footerClass] - Additional footer CSS classes
   * @param {Object} [props.state] - Component state object
   * @returns {Object} TACO object representing an enhanced card
   * @example
   * const card = makeCardV2({
   *   title: "Project Alpha",
   *   subtitle: "v2.0 Release",
   *   content: "Major performance improvements.",
   *   image: { src: "/img/alpha.jpg", alt: "Alpha" },
   *   imagePosition: "top",
   *   shadow: "lg",
   *   hoverable: true
   * });
   */
  function makeCardV2() {
    var props = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var title = props.title,
      subtitle = props.subtitle,
      content = props.content,
      footer = props.footer,
      header = props.header,
      image = props.image,
      _props$imagePosition = props.imagePosition,
      imagePosition = _props$imagePosition === void 0 ? 'top' : _props$imagePosition,
      variant = props.variant,
      _props$bordered = props.bordered,
      bordered = _props$bordered === void 0 ? true : _props$bordered,
      _props$shadow = props.shadow,
      shadow = _props$shadow === void 0 ? 'sm' : _props$shadow,
      _props$hoverable = props.hoverable,
      hoverable = _props$hoverable === void 0 ? false : _props$hoverable,
      _props$className17 = props.className,
      className = _props$className17 === void 0 ? '' : _props$className17,
      style = props.style,
      _props$headerClass = props.headerClass,
      headerClass = _props$headerClass === void 0 ? '' : _props$headerClass,
      _props$bodyClass = props.bodyClass,
      bodyClass = _props$bodyClass === void 0 ? '' : _props$bodyClass,
      _props$footerClass = props.footerClass,
      footerClass = _props$footerClass === void 0 ? '' : _props$footerClass;
    var shadowClasses = {
      none: '',
      sm: 'bw-shadow-sm',
      md: 'bw-shadow',
      lg: 'bw-shadow-lg'
    };
    var cardContent = [header && {
      t: 'div',
      a: {
        "class": "bw-card-header ".concat(headerClass).trim()
      },
      c: header
    }, image && (imagePosition === 'top' || imagePosition === 'left') && {
      t: 'img',
      a: {
        "class": "bw-card-img-".concat(imagePosition),
        src: image.src,
        alt: image.alt || ''
      }
    }, {
      t: 'div',
      a: {
        "class": "bw-card-body ".concat(bodyClass).trim()
      },
      c: [title && {
        t: 'h5',
        a: {
          "class": 'bw-card-title'
        },
        c: title
      }, subtitle && {
        t: 'h6',
        a: {
          "class": 'bw-card-subtitle bw-mb-2 bw-text-muted'
        },
        c: subtitle
      }, content && (Array.isArray(content) ? content : [content])].flat().filter(Boolean)
    }, image && (imagePosition === 'bottom' || imagePosition === 'right') && {
      t: 'img',
      a: {
        "class": "bw-card-img-".concat(imagePosition),
        src: image.src,
        alt: image.alt || ''
      }
    }, footer && {
      t: 'div',
      a: {
        "class": "bw-card-footer ".concat(footerClass).trim()
      },
      c: footer
    }].filter(Boolean);

    // Handle horizontal layout for left/right images
    if (image && (imagePosition === 'left' || imagePosition === 'right')) {
      return {
        t: 'div',
        a: {
          "class": "bw-card ".concat(variant ? "bw-card-".concat(variant) : '', " ").concat(!bordered ? 'bw-border-0' : '', " ").concat(shadowClasses[shadow], " ").concat(hoverable ? 'bw-card-hoverable' : '', " ").concat(className).trim(),
          style: style
        },
        c: {
          t: 'div',
          a: {
            "class": 'bw-row bw-g-0'
          },
          c: cardContent
        },
        o: {
          type: 'card',
          state: props.state || {}
        }
      };
    }
    return {
      t: 'div',
      a: {
        "class": "bw-card ".concat(variant ? "bw-card-".concat(variant) : '', " ").concat(!bordered ? 'bw-border-0' : '', " ").concat(shadowClasses[shadow], " ").concat(hoverable ? 'bw-card-hoverable' : '', " ").concat(className).trim(),
        style: style
      },
      c: cardContent,
      o: {
        type: 'card',
        state: props.state || {}
      }
    };
  }

  /**
   * Create a call-to-action section with title, description, and action buttons
   *
   * @param {Object} [props] - CTA configuration
   * @param {string} [props.title] - CTA headline
   * @param {string} [props.description] - CTA description text
   * @param {Array|Object} [props.actions] - CTA buttons or content
   * @param {string} [props.variant="light"] - Background variant
   * @param {boolean} [props.centered=true] - Center-align content
   * @param {string} [props.className] - Additional CSS classes
   * @returns {Object} TACO object representing a CTA section
   * @example
   * const cta = makeCTA({
   *   title: "Ready to get started?",
   *   description: "Join thousands of developers using Bitwrench.",
   *   actions: [
   *     makeButton({ text: "Sign Up Free", variant: "primary", size: "lg" })
   *   ]
   * });
   */
  function makeCTA() {
    var props = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var title = props.title,
      description = props.description,
      actions = props.actions,
      _props$variant7 = props.variant,
      variant = _props$variant7 === void 0 ? 'light' : _props$variant7,
      _props$centered3 = props.centered,
      centered = _props$centered3 === void 0 ? true : _props$centered3,
      _props$className18 = props.className,
      className = _props$className18 === void 0 ? '' : _props$className18;
    return {
      t: 'section',
      a: {
        "class": "bw-cta bw-bg-".concat(variant, " bw-py-5 ").concat(className).trim()
      },
      c: {
        t: 'div',
        a: {
          "class": 'bw-container'
        },
        c: {
          t: 'div',
          a: {
            "class": "bw-cta-content ".concat(centered ? 'bw-text-center' : '')
          },
          c: [title && {
            t: 'h2',
            a: {
              "class": 'bw-cta-title bw-mb-3'
            },
            c: title
          }, description && {
            t: 'p',
            a: {
              "class": 'bw-cta-description bw-lead bw-mb-4'
            },
            c: description
          }, actions && {
            t: 'div',
            a: {
              "class": 'bw-cta-actions'
            },
            c: actions
          }].filter(Boolean)
        }
      }
    };
  }

  /**
   * Create a page section with optional centered header and background
   *
   * @param {Object} [props] - Section configuration
   * @param {string} [props.title] - Section title
   * @param {string} [props.subtitle] - Section subtitle (muted)
   * @param {string|Object|Array} [props.content] - Section body content
   * @param {string} [props.variant="default"] - Background variant ("default" for none, or a color name)
   * @param {string} [props.spacing="md"] - Vertical padding ("sm", "md", "lg", "xl")
   * @param {string} [props.className] - Additional CSS classes
   * @returns {Object} TACO object representing a content section
   * @example
   * const section = makeSection({
   *   title: "Features",
   *   subtitle: "Everything you need to build great UIs",
   *   spacing: "lg",
   *   content: makeFeatureGrid({ features: [...] })
   * });
   */
  function makeSection() {
    var props = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var title = props.title,
      subtitle = props.subtitle,
      content = props.content,
      _props$variant8 = props.variant,
      variant = _props$variant8 === void 0 ? 'default' : _props$variant8,
      _props$spacing = props.spacing,
      spacing = _props$spacing === void 0 ? 'md' : _props$spacing,
      _props$className19 = props.className,
      className = _props$className19 === void 0 ? '' : _props$className19;
    var spacingClasses = {
      sm: 'bw-py-3',
      md: 'bw-py-4',
      lg: 'bw-py-5',
      xl: 'bw-py-6'
    };
    return {
      t: 'section',
      a: {
        "class": "bw-section ".concat(spacingClasses[spacing] || spacingClasses.md, " ").concat(variant !== 'default' ? "bw-bg-".concat(variant) : '', " ").concat(className).trim()
      },
      c: {
        t: 'div',
        a: {
          "class": 'bw-container'
        },
        c: [(title || subtitle) && {
          t: 'div',
          a: {
            "class": 'bw-section-header bw-text-center bw-mb-5'
          },
          c: [title && {
            t: 'h2',
            a: {
              "class": 'bw-section-title'
            },
            c: title
          }, subtitle && {
            t: 'p',
            a: {
              "class": 'bw-section-subtitle bw-text-muted'
            },
            c: subtitle
          }].filter(Boolean)
        }, content].filter(Boolean)
      }
    };
  }

  // =========================================================================
  // Component Handle Classes
  //
  // Handle classes provide imperative DOM manipulation for rendered components.
  // They cache child element references for efficient updates without
  // full re-renders. Used by bw.createCard(), bw.createTable(), etc.
  // =========================================================================

  /**
   * Imperative handle for a rendered card component
   *
   * Provides methods to update card title, content, and CSS classes
   * without re-rendering the entire component. Created automatically
   * when using bw.createCard().
   */
  var CardHandle = /*#__PURE__*/function () {
    /**
     * @param {Element} element - The card's root DOM element
     * @param {Object} taco - The original TACO object used to create the card
     */
    function CardHandle(element, taco) {
      var _taco$o;
      _classCallCheck(this, CardHandle);
      this.element = element;
      this._taco = taco;
      this.state = ((_taco$o = taco.o) === null || _taco$o === void 0 ? void 0 : _taco$o.state) || {};

      // Cache child elements
      this.children = {
        header: element.querySelector('.bw-card-header'),
        title: element.querySelector('.bw-card-title'),
        body: element.querySelector('.bw-card-body'),
        footer: element.querySelector('.bw-card-footer')
      };
    }

    /**
     * Update the card title text
     *
     * @param {string} title - New title text
     * @returns {CardHandle} this (for chaining)
     */
    return _createClass(CardHandle, [{
      key: "setTitle",
      value: function setTitle(title) {
        if (this.children.title) {
          this.children.title.textContent = title;
        }
        return this;
      }

      /**
       * Replace the card body content
       *
       * @param {string|Object} content - New content (string or TACO object)
       * @returns {CardHandle} this (for chaining)
       */
    }, {
      key: "setContent",
      value: function setContent(content) {
        if (this.children.body) {
          if (typeof content === 'string') {
            this.children.body.textContent = content;
          } else {
            // Re-render content
            this.children.body.innerHTML = '';
            var newContent = window.bw.taco.toDOM(content);
            this.children.body.appendChild(newContent);
          }
        }
        return this;
      }

      /**
       * Add a CSS class to the card root element
       *
       * @param {string} className - Class to add
       * @returns {CardHandle} this (for chaining)
       */
    }, {
      key: "addClass",
      value: function addClass(className) {
        this.element.classList.add(className);
        return this;
      }

      /**
       * Remove a CSS class from the card root element
       *
       * @param {string} className - Class to remove
       * @returns {CardHandle} this (for chaining)
       */
    }, {
      key: "removeClass",
      value: function removeClass(className) {
        this.element.classList.remove(className);
        return this;
      }

      /**
       * Query a child element within the card
       *
       * @param {string} selector - CSS selector
       * @returns {Element|null} Matching element or null
       */
    }, {
      key: "select",
      value: function select(selector) {
        return this.element.querySelector(selector);
      }
    }]);
  }();

  /**
   * Imperative handle for a rendered table component
   *
   * Provides methods for data updates and column sorting. Caches
   * thead/tbody/header references for efficient DOM updates.
   * Created automatically when using bw.createTable().
   */
  var TableHandle = /*#__PURE__*/function () {
    /**
     * @param {Element} element - The table's root DOM element
     * @param {Object} taco - The original TACO object used to create the table
     */
    function TableHandle(element, taco) {
      var _taco$o2;
      _classCallCheck(this, TableHandle);
      this.element = element;
      this._taco = taco;
      this.state = ((_taco$o2 = taco.o) === null || _taco$o2 === void 0 ? void 0 : _taco$o2.state) || {};
      this._data = this.state.data || [];
      this._sortColumn = null;
      this._sortDirection = 'asc';

      // Cache elements
      this.children = {
        thead: element.querySelector('thead'),
        tbody: element.querySelector('tbody'),
        headers: element.querySelectorAll('th')
      };

      // Set up sorting if enabled
      if (this.state.sortable) {
        this._setupSorting();
      }
    }

    /**
     * Attach click-to-sort handlers on all column headers
     * @private
     */
    return _createClass(TableHandle, [{
      key: "_setupSorting",
      value: function _setupSorting() {
        var _this = this;
        this.children.headers.forEach(function (th, index) {
          th.style.cursor = 'pointer';
          th.onclick = function () {
            return _this.sortBy(th.textContent);
          };
        });
      }

      /**
       * Replace the table data and re-render the body
       *
       * @param {Array<Object>} data - Array of row objects
       * @returns {TableHandle} this (for chaining)
       */
    }, {
      key: "setData",
      value: function setData(data) {
        this._data = data;
        this._renderBody();
        return this;
      }

      /**
       * Sort the table by a column name
       *
       * Toggles direction if the same column is sorted again.
       *
       * @param {string} column - Column header text to sort by
       * @param {string} [direction] - Sort direction ("asc" or "desc"); toggles if omitted
       * @returns {TableHandle} this (for chaining)
       */
    }, {
      key: "sortBy",
      value: function sortBy(column, direction) {
        var _this2 = this;
        if (column === this._sortColumn && !direction) {
          this._sortDirection = this._sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
          this._sortColumn = column;
          this._sortDirection = direction || 'asc';
        }
        var columnKey = Object.keys(this._data[0])[Array.from(this.children.headers).findIndex(function (th) {
          return th.textContent === column;
        })];
        this._data.sort(function (a, b) {
          var aVal = a[columnKey];
          var bVal = b[columnKey];
          var result = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
          return _this2._sortDirection === 'asc' ? result : -result;
        });
        this._renderBody();
        return this;
      }

      /**
       * Re-render the tbody from current _data
       * @private
       */
    }, {
      key: "_renderBody",
      value: function _renderBody() {
        var _this3 = this;
        this.children.tbody.innerHTML = '';
        this._data.forEach(function (row) {
          var tr = document.createElement('tr');
          Object.values(row).forEach(function (value) {
            var td = document.createElement('td');
            td.textContent = value;
            tr.appendChild(td);
          });
          _this3.children.tbody.appendChild(tr);
        });
      }
    }]);
  }();

  /**
   * Imperative handle for a rendered navbar component
   *
   * Provides methods to update the active navigation link.
   * Created automatically when using bw.createNavbar().
   */
  var NavbarHandle = /*#__PURE__*/function () {
    /**
     * @param {Element} element - The navbar's root DOM element
     * @param {Object} taco - The original TACO object used to create the navbar
     */
    function NavbarHandle(element, taco) {
      var _taco$o3;
      _classCallCheck(this, NavbarHandle);
      this.element = element;
      this._taco = taco;
      this.state = ((_taco$o3 = taco.o) === null || _taco$o3 === void 0 ? void 0 : _taco$o3.state) || {};
      this.children = {
        brand: element.querySelector('.bw-navbar-brand'),
        links: element.querySelectorAll('.bw-nav-link')
      };
    }

    /**
     * Set the active navigation link by href
     *
     * @param {string} href - The href value of the link to activate
     * @returns {NavbarHandle} this (for chaining)
     */
    return _createClass(NavbarHandle, [{
      key: "setActive",
      value: function setActive(href) {
        this.children.links.forEach(function (link) {
          if (link.getAttribute('href') === href) {
            link.classList.add('active');
          } else {
            link.classList.remove('active');
          }
        });
        return this;
      }
    }]);
  }();

  /**
   * Imperative handle for a rendered tabs component
   *
   * Provides programmatic tab switching. Sets up click handlers
   * on tab buttons and manages active states on both buttons and panes.
   * Created automatically when using bw.createTabs().
   */
  var TabsHandle = /*#__PURE__*/function () {
    /**
     * @param {Element} element - The tabs container DOM element
     * @param {Object} taco - The original TACO object used to create the tabs
     */
    function TabsHandle(element, taco) {
      var _taco$o4;
      _classCallCheck(this, TabsHandle);
      this.element = element;
      this._taco = taco;
      this.state = ((_taco$o4 = taco.o) === null || _taco$o4 === void 0 ? void 0 : _taco$o4.state) || {};
      this.children = {
        navItems: element.querySelectorAll('.bw-nav-link'),
        tabPanes: element.querySelectorAll('.bw-tab-pane')
      };
      this._setupTabs();
    }

    /**
     * Attach click handlers to tab navigation buttons
     * @private
     */
    return _createClass(TabsHandle, [{
      key: "_setupTabs",
      value: function _setupTabs() {
        var _this4 = this;
        this.children.navItems.forEach(function (navItem, index) {
          navItem.onclick = function (e) {
            e.preventDefault();
            _this4.switchTo(index);
          };
        });
      }

      /**
       * Programmatically switch to a tab by index
       *
       * @param {number} index - Zero-based tab index to activate
       * @returns {TabsHandle} this (for chaining)
       */
    }, {
      key: "switchTo",
      value: function switchTo(index) {
        this.children.navItems.forEach(function (item, i) {
          if (i === index) {
            item.classList.add('active');
          } else {
            item.classList.remove('active');
          }
        });
        this.children.tabPanes.forEach(function (pane, i) {
          if (i === index) {
            pane.classList.add('active');
          } else {
            pane.classList.remove('active');
          }
        });
        this.state.activeIndex = index;
        return this;
      }
    }]);
  }();

  /**
   * Create a code demo component for documentation pages
   *
   * Displays a live result alongside source code in a tabbed interface.
   * Includes a copy-to-clipboard button on the code tab.
   *
   * @param {Object} [props] - Code demo configuration
   * @param {string} [props.title] - Demo title heading
   * @param {string} [props.description] - Demo description text
   * @param {string} [props.code] - Source code to display (adds a "Code" tab when present)
   * @param {string|Object|Array} [props.result] - Live result content for the "Result" tab
   * @param {string} [props.language="javascript"] - Code language for syntax class
   * @returns {Object} TACO object representing a code demo with tabbed Result/Code views
   * @example
   * const demo = makeCodeDemo({
   *   title: "Button Example",
   *   description: "A simple primary button",
   *   code: 'makeButton({ text: "Click me" })',
   *   result: makeButton({ text: "Click me" })
   * });
   */
  function makeCodeDemo() {
    var props = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var title = props.title,
      description = props.description,
      code = props.code,
      result = props.result,
      _props$language = props.language,
      language = _props$language === void 0 ? 'javascript' : _props$language;

    // Generate unique ID for this demo
    var demoId = "demo-".concat(Math.random().toString(36).substr(2, 9));
    var tabs = [{
      label: 'Result',
      active: true,
      content: result
    }];

    // Only add Code tab if code is provided
    if (code) {
      tabs.push({
        label: 'Code',
        content: {
          t: 'div',
          a: {
            style: 'position: relative;'
          },
          c: [{
            t: 'button',
            a: {
              "class": 'copy-btn',
              style: 'position: absolute; top: 0.5rem; right: 0.5rem; padding: 0.25rem 0.625rem; font-size: 0.6875rem; background: rgba(255,255,255,0.12); color: #aaa; border: 1px solid rgba(255,255,255,0.15); border-radius: 4px; cursor: pointer; font-family: inherit; transition: all 0.15s;',
              onclick: function onclick(e) {
                navigator.clipboard.writeText(code).then(function () {
                  var btn = e.target;
                  var originalText = btn.textContent;
                  btn.textContent = 'Copied!';
                  btn.style.background = '#006666';
                  btn.style.color = '#fff';
                  setTimeout(function () {
                    btn.textContent = originalText;
                    btn.style.background = 'rgba(255,255,255,0.12)';
                    btn.style.color = '#aaa';
                  }, 2000);
                });
              }
            },
            c: 'Copy'
          }, {
            t: 'pre',
            a: {
              style: 'margin: 0; background: #1e293b; border: none; border-radius: 6px; overflow-x: auto;'
            },
            c: {
              t: 'code',
              a: {
                "class": "language-".concat(language),
                style: 'display: block; padding: 1.25rem; font-family: "SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace; font-size: 0.8125rem; line-height: 1.6; color: #e2e8f0;'
              },
              c: code
            }
          }]
        }
      });
    }
    var content = [title && {
      t: 'h3',
      c: title
    }, description && {
      t: 'p',
      a: {
        style: 'color: #6c757d; margin-bottom: 1rem;'
      },
      c: description
    }, makeTabs({
      tabs: tabs,
      id: demoId
    })].filter(Boolean);
    return {
      t: 'div',
      a: {
        "class": 'code-demo',
        style: 'margin-bottom: 2rem;'
      },
      c: content
    };
  }

  /**
   * Registry mapping component type names to their handle classes
   *
   * Used by bw.createCard(), bw.createTable(), etc. to wrap rendered
   * DOM elements in the appropriate imperative handle.
   *
   * @type {Object.<string, Function>}
   */
  var componentHandles = {
    card: CardHandle,
    table: TableHandle,
    navbar: NavbarHandle,
    tabs: TabsHandle
  };

  var components = /*#__PURE__*/Object.freeze({
    __proto__: null,
    CardHandle: CardHandle,
    NavbarHandle: NavbarHandle,
    TableHandle: TableHandle,
    TabsHandle: TabsHandle,
    componentHandles: componentHandles,
    makeAlert: makeAlert,
    makeBadge: makeBadge,
    makeBreadcrumb: makeBreadcrumb,
    makeButton: makeButton,
    makeCTA: makeCTA,
    makeCard: makeCard,
    makeCardV2: makeCardV2,
    makeCheckbox: makeCheckbox,
    makeCodeDemo: makeCodeDemo,
    makeCol: makeCol,
    makeContainer: makeContainer,
    makeFeatureGrid: makeFeatureGrid,
    makeForm: makeForm,
    makeFormGroup: makeFormGroup,
    makeHero: makeHero,
    makeInput: makeInput,
    makeListGroup: makeListGroup,
    makeNav: makeNav,
    makeNavbar: makeNavbar,
    makeProgress: makeProgress,
    makeRow: makeRow,
    makeSection: makeSection,
    makeSelect: makeSelect,
    makeSpinner: makeSpinner,
    makeStack: makeStack,
    makeTabs: makeTabs,
    makeTextarea: makeTextarea
  });

  var _excluded = ["title", "data", "columns", "className", "responsive"];

  // Core bitwrench namespace
  var bw = {
    // Version info from generated file
    version: VERSION_INFO.version,
    versionInfo: VERSION_INFO,
    /**
     * Get version metadata object (v1-compatible callable API)
     * @returns {Object} - Copy of VERSION_INFO with version, name, buildDate, etc.
     */
    getVersion: function getVersion() {
      return _objectSpread2({}, VERSION_INFO);
    },
    // Internal state
    _idCounter: 0,
    _unmountCallbacks: new Map(),
    _topics: {},
    // topic → [{handler, id}]  (plain object for IE11 compat)
    _subIdCounter: 0,
    // monotonic ID for subscriptions

    // Monkey patch for testing (same as v1)
    __monkey_patch_is_nodejs__: {
      _value: 'ignore',
      set: function set(x) {
        this._value = typeof x === 'boolean' ? x : 'ignore';
      },
      get: function get() {
        return this._value;
      }
    }
  };

  /**
   * Detect if running in Node.js environment
   * @returns {boolean} - True if Node.js, false if browser
   */
  bw.isNodeJS = function () {
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
  bw.typeOf = function (x, baseTypeOnly) {
    if (x === null) return "null";
    var basic = _typeof(x);
    if (basic !== "object" && basic !== "function") {
      return basic;
    }
    if (baseTypeOnly) return basic;
    var stringTag = Object.prototype.toString.call(x);
    var typeMap = {
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
  bw.uuid = function (prefix) {
    // Optional prefix creates IDs like bw_card_<hex>, bw_todo_<hex>, etc.
    // Without prefix: bw_<hex>
    var tag = prefix ? 'bw_' + prefix + '_' : 'bw_';

    // Use crypto.randomUUID if available (modern browsers)
    if (bw._isBrowser && crypto && crypto.randomUUID) {
      return tag + crypto.randomUUID().replace(/-/g, '');
    }

    // Fallback for older browsers and Node.js
    var timestamp = Date.now().toString(36);
    var counter = (++bw._idCounter).toString(36);
    var random = Math.random().toString(36).substring(2, 11);
    return "".concat(tag).concat(timestamp, "_").concat(counter, "_").concat(random);
  };

  /**
   * Escape HTML special characters
   * @param {string} str - String to escape
   * @returns {string} - Escaped string
   */
  bw.escapeHTML = function (str) {
    if (typeof str !== 'string') return '';
    var escapeMap = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
      '/': '&#x2F;'
    };
    return str.replace(/[&<>"'\/]/g, function (_char) {
      return escapeMap[_char];
    });
  };

  /**
   * Normalize CSS class names: convert underscores to hyphens for bw-prefixed classes
   * Allows users to write bw_card or bw-card and get consistent output
   * @param {string} classStr - Class string to normalize
   * @returns {string} - Normalized class string with hyphens
   */
  bw.normalizeClass = function (classStr) {
    if (typeof classStr !== 'string') return classStr;
    return classStr.replace(/\bbw_/g, 'bw-');
  };

  /**
   * Convert TACO object to HTML string
   * @param {Object|Array|string} taco - TACO object, array of TACOs, or string
   * @param {Object} [options] - Rendering options
   * @returns {string} - HTML string
   */
  bw.html = function (taco) {
    var _attrs$class;
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    // Handle null/undefined
    if (taco == null) return '';

    // Handle arrays of TACOs
    if (Array.isArray(taco)) {
      return taco.map(function (t) {
        return bw.html(t, options);
      }).join('');
    }

    // Handle primitives and non-TACO objects
    if (_typeof(taco) !== 'object' || !taco.t) {
      return options.raw ? String(taco) : bw.escapeHTML(String(taco));
    }
    var tag = taco.t,
      _taco$a = taco.a,
      attrs = _taco$a === void 0 ? {} : _taco$a,
      content = taco.c,
      _taco$o = taco.o,
      opts = _taco$o === void 0 ? {} : _taco$o;

    // Self-closing tags
    var selfClosing = ['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'];
    var isSelfClosing = selfClosing.includes(tag.toLowerCase());

    // Build attributes string
    var attrStr = '';
    for (var _i = 0, _Object$entries = Object.entries(attrs); _i < _Object$entries.length; _i++) {
      var _Object$entries$_i = _slicedToArray(_Object$entries[_i], 2),
        key = _Object$entries$_i[0],
        value = _Object$entries$_i[1];
      // Skip null, undefined, false
      if (value == null || value === false) continue;

      // Skip event handlers (they're for DOM only)
      if (key.startsWith('on')) continue;
      if (key === 'style' && _typeof(value) === 'object') {
        // Convert style object to string
        var styleStr = Object.entries(value).filter(function (_ref) {
          var _ref2 = _slicedToArray(_ref, 2);
            _ref2[0];
            var v = _ref2[1];
          return v != null;
        }).map(function (_ref3) {
          var _ref4 = _slicedToArray(_ref3, 2),
            k = _ref4[0],
            v = _ref4[1];
          return "".concat(k, ":").concat(v);
        }).join(';');
        if (styleStr) {
          attrStr += " style=\"".concat(bw.escapeHTML(styleStr), "\"");
        }
      } else if (key === 'class') {
        // Handle class as array or string, normalize bw_ to bw-
        var classStr = bw.normalizeClass(Array.isArray(value) ? value.filter(Boolean).join(' ') : String(value));
        if (classStr) {
          attrStr += " class=\"".concat(bw.escapeHTML(classStr), "\"");
        }
      } else if (value === true) {
        // Boolean attributes
        attrStr += " ".concat(key);
      } else {
        // Regular attributes
        attrStr += " ".concat(key, "=\"").concat(bw.escapeHTML(String(value)), "\"");
      }
    }

    // Add bw-id as a class if lifecycle hooks present
    if ((opts.mounted || opts.unmount) && !((_attrs$class = attrs["class"]) !== null && _attrs$class !== void 0 && _attrs$class.includes('bw-id-'))) {
      var id = opts.bw_id || bw.uuid();
      attrs["class"] || '';
      attrStr = attrStr.replace(/class="([^"]*)"/, function (match, classes) {
        return "class=\"".concat(classes, " bw-id-").concat(id, "\"").trim();
      });
      if (!attrStr.includes('class=')) {
        attrStr += " class=\"bw-id-".concat(id, "\"");
      }
    }

    // Build HTML
    if (isSelfClosing) {
      return "<".concat(tag).concat(attrStr, " />");
    }

    // Process content recursively
    var contentStr = content != null ? bw.html(content, options) : '';
    return "<".concat(tag).concat(attrStr, ">").concat(contentStr, "</").concat(tag, ">");
  };

  /**
   * Create DOM element from TACO (browser only)
   * @param {Object} taco - TACO object
   * @param {Object} [options] - Creation options
   * @returns {Element|Text} - DOM element or text node
   */
  bw.createDOM = function (taco) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    if (bw._isNode) {
      throw new Error('bw.createDOM is not available in Node.js. Use bw.html() instead.');
    }

    // Handle null/undefined
    if (taco == null) return document.createTextNode('');

    // Handle text nodes
    if (_typeof(taco) !== 'object' || !taco.t) {
      return document.createTextNode(String(taco));
    }
    var tag = taco.t,
      _taco$a2 = taco.a,
      attrs = _taco$a2 === void 0 ? {} : _taco$a2,
      content = taco.c,
      _taco$o2 = taco.o,
      opts = _taco$o2 === void 0 ? {} : _taco$o2;

    // Create element
    var el = document.createElement(tag);

    // Set attributes
    for (var _i2 = 0, _Object$entries2 = Object.entries(attrs); _i2 < _Object$entries2.length; _i2++) {
      var _Object$entries2$_i = _slicedToArray(_Object$entries2[_i2], 2),
        key = _Object$entries2$_i[0],
        value = _Object$entries2$_i[1];
      if (value == null || value === false) continue;
      if (key === 'style' && _typeof(value) === 'object') {
        // Apply styles directly
        Object.assign(el.style, value);
      } else if (key === 'class') {
        // Handle class as array or string, normalize bw_ to bw-
        var classStr = bw.normalizeClass(Array.isArray(value) ? value.filter(Boolean).join(' ') : String(value));
        if (classStr) {
          el.className = classStr;
        }
      } else if (key.startsWith('on') && typeof value === 'function') {
        // Event handlers
        var eventName = key.slice(2).toLowerCase();
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
        content.forEach(function (child) {
          if (child != null) {
            el.appendChild(bw.createDOM(child, options));
          }
        });
      } else if (_typeof(content) === 'object' && content.t) {
        el.appendChild(bw.createDOM(content, options));
      } else {
        el.textContent = String(content);
      }
    }

    // Handle lifecycle hooks and state
    if (opts.mounted || opts.unmount || opts.render || opts.state) {
      var id = attrs['data-bw-id'] || bw.uuid();
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
          requestAnimationFrame(function () {
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
          requestAnimationFrame(function () {
            if (document.body.contains(el)) {
              opts.mounted(el, el._bw_state || {});
            }
          });
        }
      }

      // Store unmount callback
      if (opts.unmount) {
        bw._unmountCallbacks.set(id, function () {
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
  bw.DOM = function (target, taco) {
    var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    if (bw._isNode) {
      throw new Error('bw.DOM is not available in Node.js. Use bw.html() instead.');
    }

    // Get target element
    var targetEl = typeof target === 'string' ? document.querySelector(target) : target;
    if (!targetEl) {
      console.error('bw.DOM: Target element not found:', target);
      return null;
    }

    // Clean up existing children (but preserve the target's own state, render, and subs —
    // the target is the mount point, not the content being replaced)
    var savedState = targetEl._bw_state;
    var savedRender = targetEl._bw_render;
    var savedBwId = targetEl.getAttribute('data-bw-id');
    var savedSubs = targetEl._bw_subs;

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
        taco.forEach(function (t) {
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
   * Compile props into getter/setter functions
   * @param {Object} handle - Component handle
   * @param {Object} props - Initial props
   * @returns {Object} Compiled props object
   */
  bw.compileProps = function (handle) {
    var props = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var compiledProps = {};
    Object.keys(props).forEach(function (key) {
      // Create getter/setter for each prop
      Object.defineProperty(compiledProps, key, {
        get: function get() {
          return handle._props[key];
        },
        set: function set(value) {
          var oldValue = handle._props[key];
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
   * Render a component and return an enhanced handle
   * @param {Object} taco - TACO object
   * @param {Object} options - Render options
   * @returns {Object} Component handle with compiled props
   */
  bw.renderComponent = function (taco) {
    var _taco$o3;
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var element = bw.createDOM(taco, options);

    // Enhanced handle with prop compilation
    var handle = {
      element: element,
      taco: taco,
      _props: _objectSpread2({}, taco.a),
      // Store props internally
      _state: ((_taco$o3 = taco.o) === null || _taco$o3 === void 0 ? void 0 : _taco$o3.state) || {},
      _children: {},
      // Store child component references

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
      $: function $(selector) {
        return this.element.querySelectorAll(selector);
      },
      /**
       * Query the first matching element within this component
       * @param {string} selector - CSS selector
       * @returns {Element|null} First matching element or null
       */
      $first: function $first(selector) {
        return this.element.querySelector(selector);
      },
      /**
       * Update component with new props and re-render in place
       * @param {Object} newProps - Properties to merge into current props
       * @returns {Object} this handle (for chaining)
       */
      update: function update(newProps) {
        // Update internal props
        Object.assign(this._props, newProps);

        // Rebuild TACO with new props
        var newTaco = _objectSpread2(_objectSpread2({}, this.taco), {}, {
          a: _objectSpread2(_objectSpread2({}, this.taco.a), newProps)
        });
        var newElement = bw.createDOM(newTaco, options);

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
      render: function render() {
        var newElement = bw.createDOM(this.taco, options);
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
      onPropChange: function onPropChange(key, newValue, oldValue) {
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
      setState: function setState(updates) {
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
      addChild: function addChild(name, component) {
        this._children[name] = component;
        return this;
      },
      /**
       * Retrieve a registered child component by name
       * @param {string} name - Child name key
       * @returns {Object|undefined} Child component handle
       */
      getChild: function getChild(name) {
        return this._children[name];
      },
      /**
       * Destroy this component and all registered children
       *
       * Calls destroy() recursively on children, runs bw.cleanup(),
       * removes the element from DOM, and clears all internal references.
       */
      destroy: function destroy() {
        // Destroy children first
        Object.values(this._children).forEach(function (child) {
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
   * Clean up element and its children
   * Calls unmount callbacks and removes references
   * @param {Element} element - Element to clean up
   */
  bw.cleanup = function (element) {
    if (bw._isNode || !element) return;

    // Find all elements with data-bw-id
    var elements = element.querySelectorAll('[data-bw-id]');
    elements.forEach(function (el) {
      var id = el.getAttribute('data-bw-id');
      var callback = bw._unmountCallbacks.get(id);
      if (callback) {
        callback();
        bw._unmountCallbacks["delete"](id);
      }

      // Clean up pub/sub subscriptions tied to this element
      if (el._bw_subs) {
        el._bw_subs.forEach(function (unsub) {
          unsub();
        });
        delete el._bw_subs;
      }

      // Clean up state and render
      delete el._bw_state;
      delete el._bw_render;
    });

    // Check element itself
    var id = element.getAttribute('data-bw-id');
    if (id) {
      var callback = bw._unmountCallbacks.get(id);
      if (callback) {
        callback();
        bw._unmountCallbacks["delete"](id);
      }
      // Clean up pub/sub subscriptions tied to element itself
      if (element._bw_subs) {
        element._bw_subs.forEach(function (unsub) {
          unsub();
        });
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
   * Trigger re-render of a component by calling its stored render function.
   * Emits 'bw:statechange' after re-render so listeners can react.
   * @param {string|Element} target - CSS selector or DOM element with _bw_render
   * @returns {Element|null} - The element, or null if not found / no render function
   */
  bw.update = function (target) {
    var el = typeof target === 'string' ? document.querySelector(target) : target;
    if (el && el._bw_render) {
      el._bw_render(el, el._bw_state || {});
      bw.emit(el, 'statechange', el._bw_state);
    }
    return el || null;
  };

  /**
   * Targeted DOM update by UUID — change one element's content or attribute
   * without rebuilding the component tree.
   *
   * @param {string|Element} id - Element ID string or DOM element
   * @param {string|Object} content - New text content, or TACO object to replace children
   * @param {string} [attr] - If provided, sets this attribute instead of content
   * @returns {Element|null} - The patched element, or null if not found
   */
  bw.patch = function (id, content, attr) {
    var el = typeof id === 'string' ? document.getElementById(id) : id;
    if (!el) return null;
    if (attr) {
      // Patch an attribute
      el.setAttribute(attr, String(content));
    } else if (_typeof(content) === 'object' && content !== null && content.t) {
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
   * Batch version of bw.patch — update multiple elements by UUID in one call.
   * @param {Object} patches - Map of { elementId: newContent, ... }
   * @returns {Object} - Map of { elementId: patchedElement|null, ... }
   */
  bw.patchAll = function (patches) {
    var results = {};
    for (var id in patches) {
      if (patches.hasOwnProperty(id)) {
        results[id] = bw.patch(id, patches[id]);
      }
    }
    return results;
  };

  /**
   * Emit a custom event on a DOM element.
   * Events are prefixed with 'bw:' to avoid collision with native events.
   * Events bubble by default so ancestors can listen.
   *
   * @param {string|Element} target - CSS selector or DOM element
   * @param {string} eventName - Event name (will be prefixed with 'bw:')
   * @param {*} [detail] - Data to pass with the event
   */
  bw.emit = function (target, eventName, detail) {
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
   * Handler receives (detail, event) for convenience.
   *
   * @param {string|Element} target - CSS selector or DOM element
   * @param {string} eventName - Event name (will be prefixed with 'bw:')
   * @param {Function} handler - Called with (detail, event)
   * @returns {Element|null} - The element (for chaining), or null if not found
   */
  bw.on = function (target, eventName, handler) {
    var el = typeof target === 'string' ? document.querySelector(target) : target;
    if (el) {
      el.addEventListener('bw:' + eventName, function (e) {
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
   * Publish to a topic. Calls all subscribers in registration order.
   * Try/catch per subscriber — errors are console.warned, not thrown.
   *
   * @param {string} topic - Topic name (plain string, no prefix)
   * @param {*} [detail] - Data to pass to subscribers
   * @returns {number} - Count of successfully called subscribers
   */
  bw.pub = function (topic, detail) {
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
   * Optional 3rd arg ties the subscription to an element's lifecycle —
   * when bw.cleanup() is called on that element, the subscription is removed.
   *
   * @param {string} topic - Topic name
   * @param {Function} handler - Called with (detail) on each publish
   * @param {Element} [el] - Optional element to tie lifecycle to
   * @returns {Function} - Call to unsubscribe
   */
  bw.sub = function (topic, handler, el) {
    var id = ++bw._subIdCounter;
    if (!bw._topics[topic]) bw._topics[topic] = [];
    bw._topics[topic].push({
      handler: handler,
      id: id
    });
    var unsub = function unsub() {
      var subs = bw._topics[topic];
      if (!subs) return;
      bw._topics[topic] = subs.filter(function (s) {
        return s.id !== id;
      });
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
   * Unsubscribe by handler reference. Removes ALL instances of the handler
   * on the given topic.
   *
   * @param {string} topic - Topic name
   * @param {Function} handler - The handler to remove (by reference equality)
   * @returns {number} - Count of removed subscriptions
   */
  bw.unsub = function (topic, handler) {
    var subs = bw._topics[topic];
    if (!subs) return 0;
    var before = subs.length;
    bw._topics[topic] = subs.filter(function (s) {
      return s.handler !== handler;
    });
    var removed = before - bw._topics[topic].length;
    if (bw._topics[topic].length === 0) delete bw._topics[topic];
    return removed;
  };

  /**
   * CSS generation from JavaScript objects
   * @param {Object|Array|string} rules - CSS rules
   * @param {Object} [options] - Generation options
   * @returns {string} - CSS string
   */
  bw.css = function (rules) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var _options$minify = options.minify,
      minify = _options$minify === void 0 ? false : _options$minify,
      _options$pretty = options.pretty,
      pretty = _options$pretty === void 0 ? !minify : _options$pretty;
    if (typeof rules === 'string') return rules;
    var css = '';
    var indent = pretty ? '  ' : '';
    var newline = pretty ? '\n' : '';
    var space = pretty ? ' ' : '';
    if (Array.isArray(rules)) {
      css = rules.map(function (rule) {
        return bw.css(rule, options);
      }).join(newline);
    } else if (_typeof(rules) === 'object') {
      Object.entries(rules).forEach(function (_ref5) {
        var _ref6 = _slicedToArray(_ref5, 2),
          selector = _ref6[0],
          styles = _ref6[1];
        if (_typeof(styles) === 'object' && !Array.isArray(styles)) {
          var declarations = Object.entries(styles).filter(function (_ref7) {
            var _ref8 = _slicedToArray(_ref7, 2);
              _ref8[0];
              var value = _ref8[1];
            return value != null;
          }).map(function (_ref9) {
            var _ref10 = _slicedToArray(_ref9, 2),
              prop = _ref10[0],
              value = _ref10[1];
            // Convert camelCase to kebab-case
            var kebabProp = prop.replace(/[A-Z]/g, function (m) {
              return '-' + m.toLowerCase();
            });
            return "".concat(indent).concat(kebabProp, ":").concat(space).concat(value, ";");
          }).join(newline);
          if (declarations) {
            css += "".concat(selector).concat(space, "{").concat(newline).concat(declarations).concat(newline, "}").concat(newline);
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
  bw.injectCSS = function (css) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    if (bw._isNode) {
      console.warn('bw.injectCSS is not available in Node.js');
      return null;
    }
    var _options$id = options.id,
      id = _options$id === void 0 ? 'bw-styles' : _options$id,
      _options$append = options.append,
      append = _options$append === void 0 ? true : _options$append;

    // Get or create style element
    var styleEl = document.getElementById(id);
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = id;
      styleEl.type = 'text/css';
      document.head.appendChild(styleEl);
    }

    // Convert CSS if needed
    var cssStr = typeof css === 'string' ? css : bw.css(css, options);

    // Set or append CSS
    if (append && styleEl.textContent) {
      styleEl.textContent += '\n' + cssStr;
    } else {
      styleEl.textContent = cssStr;
    }
    return styleEl;
  };

  /**
   * Merge multiple style objects into one. Filters null/undefined args.
   * Works for both inline style objects and CSS rule objects.
   * @param {...Object} styles - Style objects to merge (left-to-right)
   * @returns {Object} - Merged style object
   */
  bw.s = function () {
    var result = {};
    for (var i = 0; i < arguments.length; i++) {
      var arg = arguments[i];
      if (arg && _typeof(arg) === 'object') Object.assign(result, arg);
    }
    return result;
  };

  /**
   * Pre-built CSS utility objects (like Tailwind utilities, but in JS).
   * Use with bw.s() to compose: bw.s(bw.u.flex, bw.u.gap4, bw.u.p4)
   */
  bw.u = {
    // Display
    flex: {
      display: 'flex'
    },
    flexCol: {
      display: 'flex',
      flexDirection: 'column'
    },
    flexRow: {
      display: 'flex',
      flexDirection: 'row'
    },
    flexWrap: {
      display: 'flex',
      flexWrap: 'wrap'
    },
    block: {
      display: 'block'
    },
    inline: {
      display: 'inline'
    },
    hidden: {
      display: 'none'
    },
    // Flex alignment
    justifyCenter: {
      justifyContent: 'center'
    },
    justifyBetween: {
      justifyContent: 'space-between'
    },
    justifyEnd: {
      justifyContent: 'flex-end'
    },
    alignCenter: {
      alignItems: 'center'
    },
    alignStart: {
      alignItems: 'flex-start'
    },
    alignEnd: {
      alignItems: 'flex-end'
    },
    // Gap (0.25rem increments)
    gap1: {
      gap: '0.25rem'
    },
    gap2: {
      gap: '0.5rem'
    },
    gap3: {
      gap: '0.75rem'
    },
    gap4: {
      gap: '1rem'
    },
    gap6: {
      gap: '1.5rem'
    },
    gap8: {
      gap: '2rem'
    },
    // Padding
    p0: {
      padding: '0'
    },
    p1: {
      padding: '0.25rem'
    },
    p2: {
      padding: '0.5rem'
    },
    p3: {
      padding: '0.75rem'
    },
    p4: {
      padding: '1rem'
    },
    p6: {
      padding: '1.5rem'
    },
    p8: {
      padding: '2rem'
    },
    px4: {
      paddingLeft: '1rem',
      paddingRight: '1rem'
    },
    py2: {
      paddingTop: '0.5rem',
      paddingBottom: '0.5rem'
    },
    py4: {
      paddingTop: '1rem',
      paddingBottom: '1rem'
    },
    // Margin (same scale)
    m0: {
      margin: '0'
    },
    m4: {
      margin: '1rem'
    },
    mt2: {
      marginTop: '0.5rem'
    },
    mt4: {
      marginTop: '1rem'
    },
    mb2: {
      marginBottom: '0.5rem'
    },
    mb4: {
      marginBottom: '1rem'
    },
    mx_auto: {
      marginLeft: 'auto',
      marginRight: 'auto'
    },
    // Typography
    textSm: {
      fontSize: '0.875rem'
    },
    textBase: {
      fontSize: '1rem'
    },
    textLg: {
      fontSize: '1.125rem'
    },
    textXl: {
      fontSize: '1.25rem'
    },
    text2xl: {
      fontSize: '1.5rem'
    },
    text3xl: {
      fontSize: '1.875rem'
    },
    bold: {
      fontWeight: '700'
    },
    semibold: {
      fontWeight: '600'
    },
    italic: {
      fontStyle: 'italic'
    },
    textCenter: {
      textAlign: 'center'
    },
    textRight: {
      textAlign: 'right'
    },
    // Colors (from design tokens)
    bgWhite: {
      background: '#ffffff'
    },
    bgTeal: {
      background: '#006666',
      color: '#ffffff'
    },
    textWhite: {
      color: '#ffffff'
    },
    textTeal: {
      color: '#006666'
    },
    textMuted: {
      color: '#888'
    },
    // Borders
    rounded: {
      borderRadius: '0.375rem'
    },
    roundedLg: {
      borderRadius: '0.5rem'
    },
    roundedFull: {
      borderRadius: '9999px'
    },
    border: {
      border: '1px solid #d8d8d8'
    },
    // Sizing
    wFull: {
      width: '100%'
    },
    hFull: {
      height: '100%'
    },
    // Transitions
    transition: {
      transition: 'all 0.2s ease'
    }
  };

  /**
   * Generate responsive CSS with media query breakpoints.
   * @param {string} selector - CSS selector
   * @param {Object} breakpoints - Object with keys: base, sm, md, lg, xl
   * @returns {string} - Generated CSS string (pass to bw.injectCSS)
   */
  bw.responsive = function (selector, breakpoints) {
    var sizes = {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px'
    };
    var parts = [];
    Object.keys(breakpoints).forEach(function (key) {
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
   * Map/scale a value from one range to another
   * @param {number} x - Input value
   * @param {number} in0 - Input range start
   * @param {number} in1 - Input range end
   * @param {number} out0 - Output range start
   * @param {number} out1 - Output range end
   * @param {Object} [options] - Mapping options
   * @returns {number} - Mapped value
   */
  bw.mapScale = function (x, in0, in1, out0, out1) {
    var options = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : {};
    var _options$clip = options.clip,
      clip = _options$clip === void 0 ? false : _options$clip,
      _options$expScale = options.expScale,
      expScale = _options$expScale === void 0 ? 1 : _options$expScale;

    // Normalize to 0-1
    var normalized = (x - in0) / (in1 - in0);

    // Apply exponential scaling
    if (expScale !== 1) {
      normalized = Math.pow(normalized, expScale);
    }

    // Map to output range
    var result = normalized * (out1 - out0) + out0;

    // Clip if requested
    if (clip) {
      var min = Math.min(out0, out1);
      var max = Math.max(out0, out1);
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
  bw.clip = function (value, min, max) {
    return Math.max(min, Math.min(max, value));
  };

  /**
   * DOM selection helper (browser only)
   * Always returns an array for consistency
   * @param {string|Element|Array} selector - CSS selector, element, or array
   * @returns {Array} - Array of DOM elements
   */
  if (bw._isBrowser) {
    bw.$ = function (selector) {
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
    bw.$.one = function (selector) {
      return bw.$(selector)[0] || null;
    };
  }

  /**
   * Load default styles
   * @param {Object} [options] - Style loading options
   * @returns {Element|null} - Style element if in browser
   */
  bw.loadDefaultStyles = function () {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var _options$minify2 = options.minify,
      minify = _options$minify2 === void 0 ? true : _options$minify2;
    var styles = getAllStyles();
    return bw.injectCSS(styles, _objectSpread2(_objectSpread2({}, options), {}, {
      minify: minify
    }));
  };

  /**
   * Get current theme configuration (deep copy)
   * @returns {Object} - Theme object
   */
  bw.getTheme = function () {
    return JSON.parse(JSON.stringify(theme));
  };

  /**
   * Set theme overrides and optionally re-inject CSS
   * @param {Object} overrides - Partial theme object to merge
   * @param {Object} [options] - Options
   * @param {boolean} [options.inject=true] - Whether to re-inject CSS (browser only)
   * @returns {Object} - Updated theme
   */
  bw.setTheme = function (overrides) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var _options$inject = options.inject,
      inject = _options$inject === void 0 ? true : _options$inject;
    updateTheme(overrides);

    // Update CSS custom properties if colors changed and we're in browser
    if (inject && !bw._isNode && overrides.colors) {
      var root = document.documentElement;
      for (var _i3 = 0, _Object$entries3 = Object.entries(overrides.colors); _i3 < _Object$entries3.length; _i3++) {
        var _Object$entries3$_i = _slicedToArray(_Object$entries3[_i3], 2),
          name = _Object$entries3$_i[0],
          value = _Object$entries3$_i[1];
        root.style.setProperty('--bw-' + name, value);
      }
    }
    return bw.getTheme();
  };

  /**
   * Toggle dark mode on/off
   * Adds/removes 'bw-dark' class on <html> and injects dark mode CSS
   * @param {boolean} [force] - Force dark (true) or light (false). Omit to toggle.
   * @returns {boolean} - Whether dark mode is now active
   */
  bw.toggleDarkMode = function (force) {
    var isDark = force !== undefined ? force : !theme.darkMode;
    theme.darkMode = isDark;
    if (!bw._isNode) {
      var root = document.documentElement;
      if (isDark) {
        root.classList.add('bw-dark');
        // Inject dark mode styles if not already present
        if (!document.getElementById('bw-dark-styles')) {
          var darkCSS = bw.css(getDarkModeStyles());
          var styleEl = document.createElement('style');
          styleEl.id = 'bw-dark-styles';
          styleEl.textContent = darkCSS;
          document.head.appendChild(styleEl);
        }
      } else {
        root.classList.remove('bw-dark');
      }
    }
    return isDark;
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
  bw.choice = function (x, choices, def) {
    var z = x in choices ? choices[x] : def;
    return bw.typeOf(z) === "function" ? z(x) : z;
  };

  /**
   * Return unique elements of array
   * @param {Array} x - Input array
   * @returns {Array} - Array with unique elements
   */
  bw.arrayUniq = function (x) {
    if (bw.typeOf(x) !== "array") return [];
    return x.filter(function (v, i, arr) {
      return arr.indexOf(v) === i;
    });
  };

  /**
   * Return intersection of two arrays
   * @param {Array} a - First array
   * @param {Array} b - Second array
   * @returns {Array} - Elements in both arrays
   */
  bw.arrayBinA = function (a, b) {
    if (bw.typeOf(a) !== "array" || bw.typeOf(b) !== "array") return [];
    return bw.arrayUniq(a.filter(function (n) {
      return b.indexOf(n) !== -1;
    }));
  };

  /**
   * Return elements of b not present in a
   * @param {Array} a - First array
   * @param {Array} b - Second array
   * @returns {Array} - Elements in b but not in a
   */
  bw.arrayBNotInA = function (a, b) {
    if (bw.typeOf(a) !== "array" || bw.typeOf(b) !== "array") return [];
    return bw.arrayUniq(b.filter(function (n) {
      return a.indexOf(n) < 0;
    }));
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
  bw.colorInterp = function (x, in0, in1, colors, stretch) {
    var c = Array.isArray(colors) ? colors : ["#000", "#fff"];
    c = c.length === 0 ? ["#000", "#fff"] : c;
    if (c.length === 1) return c[0];

    // Convert all colors to RGB format
    c = c.map(function (col) {
      return bw.colorParse(col);
    });
    var a = bw.mapScale(x, in0, in1, 0, c.length - 1, {
      clip: true,
      expScale: stretch
    });
    var i = bw.clip(Math.floor(a), 0, c.length - 2);
    var r = a - i;
    var interp = function interp(idx) {
      return bw.mapScale(r, 0, 1, c[i][idx], c[i + 1][idx], {
        clip: true
      });
    };
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
  bw.colorHslToRgb = function (h, s, l) {
    var a = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 255;
    var rnd = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : true;
    if (bw.typeOf(h) === "array") {
      s = h[1];
      l = h[2];
      a = h[3];
      h = h[0];
    }
    var hNorm = h / 360;
    var sNorm = s / 100;
    var lNorm = l / 100;
    var r, g, b;
    if (sNorm === 0) {
      r = g = b = lNorm * 255;
    } else {
      var hue2rgb = function hue2rgb(p, q, t) {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };
      var q = lNorm < 0.5 ? lNorm * (1 + sNorm) : lNorm + sNorm - lNorm * sNorm;
      var p = 2 * lNorm - q;
      r = hue2rgb(p, q, hNorm + 1 / 3) * 255;
      g = hue2rgb(p, q, hNorm) * 255;
      b = hue2rgb(p, q, hNorm - 1 / 3) * 255;
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
  bw.colorRgbToHsl = function (r, g, b) {
    var a = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 255;
    var rnd = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : true;
    if (bw.typeOf(r) === "array") {
      g = r[1];
      b = r[2];
      a = r[3];
      r = r[0];
    }
    r /= 255;
    g /= 255;
    b /= 255;
    var max = Math.max(r, g, b);
    var min = Math.min(r, g, b);
    var h,
      s,
      l = (max + min) / 2;
    if (max === min) {
      h = s = 0; // achromatic
    } else {
      var d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r:
          h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
          break;
        case g:
          h = ((b - r) / d + 2) / 6;
          break;
        case b:
          h = ((r - g) / d + 4) / 6;
          break;
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
  bw.colorParse = function (s) {
    var defAlpha = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 255;
    var r = [0, 0, 0, defAlpha, "rgb"]; // default return

    if (bw.typeOf(s) === "array") {
      // Handle bitwrench color array
      var df = [0, 0, 0, 255, "rgb"];
      for (var p = 0; p < s.length && p < df.length; p++) {
        df[p] = s[p];
      }
      return df;
    }
    s = String(s).replace(/\s/g, "");

    // Handle hex colors
    if (s[0] === "#") {
      var hex = s.slice(1);
      if (hex.length === 3 || hex.length === 4) {
        // #rgb or #rgba
        for (var i = 0; i < hex.length; i++) {
          r[i] = parseInt(hex[i] + hex[i], 16);
        }
      } else if (hex.length === 6 || hex.length === 8) {
        // #rrggbb or #rrggbbaa
        for (var _i4 = 0; _i4 < hex.length; _i4 += 2) {
          r[_i4 / 2] = parseInt(hex.substring(_i4, _i4 + 2), 16);
        }
      }
    } else {
      // Handle rgb() rgba() hsl() hsla()
      var match = s.match(/^(rgb|hsl)a?\(([^)]+)\)$/i);
      if (match) {
        var type = match[1].toLowerCase();
        var values = match[2].split(",").map(function (v) {
          return parseFloat(v);
        });
        if (type === "rgb") {
          r[0] = values[0] || 0;
          r[1] = values[1] || 0;
          r[2] = values[2] || 0;
          r[3] = values[3] !== undefined ? values[3] * 255 : defAlpha;
          r[4] = "rgb";
        } else if (type === "hsl") {
          var rgb = bw.colorHslToRgb(values[0] || 0, values[1] || 0, values[2] || 0, values[3] !== undefined ? values[3] * 255 : defAlpha);
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
  bw.setCookie = function (cname, cvalue, exdays) {
    var options = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
    if (bw._isNode) return;
    var d = new Date();
    d.setTime(d.getTime() + exdays * 24 * 60 * 60 * 1000);
    var cookie = "".concat(cname, "=").concat(cvalue, "; expires=").concat(d.toUTCString());

    // Add additional options
    if (options.path) cookie += "; path=".concat(options.path);
    if (options.domain) cookie += "; domain=".concat(options.domain);
    if (options.secure) cookie += '; secure';
    if (options.sameSite) cookie += "; samesite=".concat(options.sameSite);
    document.cookie = cookie;
  };

  /**
   * Get cookie value (browser only)
   * @param {string} cname - Cookie name
   * @param {*} defaultValue - Default if not found
   * @returns {*} - Cookie value or default
   */
  bw.getCookie = function (cname, defaultValue) {
    if (bw._isNode) return defaultValue;
    var name = cname + "=";
    var ca = document.cookie.split(";");
    for (var i = 0; i < ca.length; i++) {
      var c = ca[i];
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
  bw.getURLParam = function (key, defaultValue) {
    if (bw._isNode || (typeof window === "undefined" ? "undefined" : _typeof(window)) !== "object") return defaultValue;
    try {
      var params = new URLSearchParams(window.location.search);
      if (!key) {
        // Return all params as object
        var result = {};
        var _iterator = _createForOfIteratorHelper(params),
          _step;
        try {
          for (_iterator.s(); !(_step = _iterator.n()).done;) {
            var _step$value = _slicedToArray(_step.value, 2),
              k = _step$value[0],
              v = _step$value[1];
            result[k] = v || true;
          }
        } catch (err) {
          _iterator.e(err);
        } finally {
          _iterator.f();
        }
        return result;
      }
      return params.has(key) ? params.get(key) || true : defaultValue;
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
  bw.htmlTable = function (data) {
    var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    if (bw.typeOf(data) !== "array" || data.length < 1) return "";
    var dopts = {
      useFirstRowAsHeaders: true,
      caption: null,
      atr: {
        "class": "table"
      },
      thead_atr: {},
      th_atr: {},
      tbody_atr: {},
      tr_atr: {},
      td_atr: {}
    };
    Object.assign(dopts, opts);
    var html = "<table".concat(bw._attrsToStr(dopts.atr), ">");
    if (dopts.caption) {
      html += "<caption>".concat(bw.escapeHTML(dopts.caption), "</caption>");
    }
    var startRow = 0;

    // Handle header row
    if (dopts.useFirstRowAsHeaders && data.length > 0) {
      html += "<thead".concat(bw._attrsToStr(dopts.thead_atr), ">");
      html += "<tr".concat(bw._attrsToStr(dopts.tr_atr), ">");
      data[0].forEach(function (cell) {
        html += "<th".concat(bw._attrsToStr(dopts.th_atr), ">").concat(bw.escapeHTML(String(cell)), "</th>");
      });
      html += "</tr></thead>";
      startRow = 1;
    }

    // Body rows
    if (data.length > startRow) {
      html += "<tbody".concat(bw._attrsToStr(dopts.tbody_atr), ">");
      for (var i = startRow; i < data.length; i++) {
        html += "<tr".concat(bw._attrsToStr(dopts.tr_atr), ">");
        data[i].forEach(function (cell) {
          html += "<td".concat(bw._attrsToStr(dopts.td_atr), ">").concat(bw.escapeHTML(String(cell)), "</td>");
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
  bw._attrsToStr = function (attrs) {
    if (!attrs || _typeof(attrs) !== "object") return "";
    var str = "";
    for (var _i5 = 0, _Object$entries4 = Object.entries(attrs); _i5 < _Object$entries4.length; _i5++) {
      var _Object$entries4$_i = _slicedToArray(_Object$entries4[_i5], 2),
        key = _Object$entries4$_i[0],
        value = _Object$entries4$_i[1];
      if (value != null && value !== false) {
        if (value === true) {
          str += " ".concat(key);
        } else {
          str += " ".concat(key, "=\"").concat(bw.escapeHTML(String(value)), "\"");
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
  bw.htmlTabs = function (tabData) {
    var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    if (bw.typeOf(tabData) !== "array" || tabData.length < 1) return "";
    var dopts = {
      atr: {
        "class": "bw-tab-container"
      },
      tab_atr: {
        "class": "bw-tab-item-list"
      },
      tabc_atr: {
        "class": "bw-tab-content-list"
      }
    };
    Object.assign(dopts, opts);

    // Create tab items
    var tabItems = tabData.map(function (tab, idx) {
      return {
        t: "li",
        a: {
          "class": idx === 0 ? "bw-tab-item bw-tab-active" : "bw-tab-item",
          onclick: "bw.selectTabContent(this)"
        },
        c: tab[0]
      };
    });

    // Create tab content
    var tabContent = tabData.map(function (tab, idx) {
      return {
        t: "div",
        a: {
          "class": idx === 0 ? "bw-tab-content bw-show" : "bw-tab-content"
        },
        c: tab[1]
      };
    });
    return bw.html({
      t: "div",
      a: dopts.atr,
      c: [{
        t: "ul",
        a: dopts.tab_atr,
        c: tabItems
      }, {
        t: "div",
        a: dopts.tabc_atr,
        c: tabContent
      }]
    });
  };

  /**
   * Tab selection handler
   * @param {Element} tabElement - Clicked tab element
   */
  bw.selectTabContent = function (tabElement) {
    if (bw._isNode || !tabElement) return;
    var container = tabElement.closest(".bw-tab-container");
    if (!container) return;

    // Remove active class from all tabs
    container.querySelectorAll(".bw-tab-item").forEach(function (tab) {
      tab.classList.remove("bw-tab-active");
    });

    // Add active to clicked tab
    tabElement.classList.add("bw-tab-active");

    // Get tab index
    var tabIndex = Array.from(tabElement.parentElement.children).indexOf(tabElement);

    // Hide all content
    container.querySelectorAll(".bw-tab-content").forEach(function (content) {
      content.classList.remove("bw-show");
    });

    // Show selected content
    var contents = container.querySelectorAll(".bw-tab-content");
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
  bw.loremIpsum = function (numChars, startSpot) {
    var startWithCapitalLetter = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;
    var lorem = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. ";

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
    var skippedChars = 0;

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
    var l = lorem.substring(startSpot) + lorem.substring(0, startSpot);
    var result = "";
    var remaining = numChars + skippedChars; // Add skipped chars to honor original numChars

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
      var c = result[0].toUpperCase();
      c = /[A-Z]/.test(c) ? c : "L"; // Use "L" as default if first char isn't a letter
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
  bw.multiArray = function (value, dims) {
    var v = function v() {
      return bw.typeOf(value) === "function" ? value() : value;
    };
    dims = typeof dims === "number" ? [dims] : dims;
    var _createArray = function createArray(dim) {
      if (dim >= dims.length) return v();
      var arr = [];
      for (var i = 0; i < dims[dim]; i++) {
        arr[i] = _createArray(dim + 1);
      }
      return arr;
    };
    return _createArray(0);
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
  bw.naturalCompare = function (as, bs) {
    // Handle numbers
    if (isFinite(as) && isFinite(bs)) {
      return Math.sign(as - bs);
    }
    var a = String(as).toLowerCase();
    var b = String(bs).toLowerCase();
    if (a === b) return as > bs ? 1 : 0;

    // If no digits, simple string compare
    if (!/\d/.test(a) || !/\d/.test(b)) {
      return a > b ? 1 : -1;
    }

    // Split into chunks of digits/non-digits
    var aParts = a.match(/(\d+|\D+)/g) || [];
    var bParts = b.match(/(\d+|\D+)/g) || [];
    var len = Math.min(aParts.length, bParts.length);
    for (var i = 0; i < len; i++) {
      var aPart = aParts[i];
      var bPart = bParts[i];
      if (aPart !== bPart) {
        // Both numeric
        if (/^\d+$/.test(aPart) && /^\d+$/.test(bPart)) {
          // Handle leading zeros
          var aNum = aPart;
          var bNum = bPart;
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
  bw.setIntervalX = function (callback, delay, repetitions) {
    var count = 0;
    var intervalID = setInterval(function () {
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
  bw.repeatUntil = function (testFn, successFn, failFn) {
    var delay = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 250;
    var maxReps = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 10;
    var lastFn = arguments.length > 5 ? arguments[5] : undefined;
    if (typeof testFn !== "function") return "err";
    var count = 0;
    var intervalID = setInterval(function () {
      var result = testFn();
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
   * Save data to a file (works in both Node.js and browser)
   * @param {string} fname - Filename to save as
   * @param {*} data - Data to save
   */
  bw.saveClientFile = function (fname, data) {
    if (bw.isNodeJS()) {
      // Node.js environment
      var fs = require("fs");
      fs.writeFile(fname, data, function (err) {
        if (err) {
          console.error("Error saving file:", err);
        }
      });
    } else {
      // Browser environment
      var blob = new Blob([data], {
        type: "application/octet-stream"
      });
      var url = window.URL.createObjectURL(blob);
      var a = bw.createDOM({
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
   * Save data as JSON file
   * @param {string} fname - Filename to save as
   * @param {*} data - Data to save as JSON
   */
  bw.saveClientJSON = function (fname, data) {
    bw.saveClientFile(fname, JSON.stringify(data, null, 2));
  };

  /**
   * Copy text to clipboard
   * @param {string} text - Text to copy
   * @returns {Promise} - Promise that resolves when copy is complete
   */
  bw.copyToClipboard = function (text) {
    // Modern clipboard API
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }

    // Fallback for older browsers
    return new Promise(function (resolve, reject) {
      var textarea = bw.createDOM({
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
        var successful = document.execCommand('copy');
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
  bw.makeTable = function (config) {
    var _config$data = config.data,
      data = _config$data === void 0 ? [] : _config$data,
      columns = config.columns,
      _config$className = config.className,
      className = _config$className === void 0 ? "table" : _config$className,
      _config$sortable = config.sortable,
      sortable = _config$sortable === void 0 ? true : _config$sortable,
      onSort = config.onSort,
      sortColumn = config.sortColumn,
      _config$sortDirection = config.sortDirection,
      sortDirection = _config$sortDirection === void 0 ? 'asc' : _config$sortDirection;

    // Auto-detect columns if not provided
    var cols = columns || (data.length > 0 ? Object.keys(data[0]).map(function (key) {
      return {
        key: key,
        label: key
      };
    }) : []);

    // Current sort state
    var currentSortColumn = sortColumn || null;
    var currentSortDirection = sortDirection;

    // Sort data if column specified
    var sortedData = _toConsumableArray(data);
    if (currentSortColumn) {
      sortedData.sort(function (a, b) {
        var aVal = a[currentSortColumn];
        var bVal = b[currentSortColumn];

        // Handle different types
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return currentSortDirection === 'asc' ? aVal - bVal : bVal - aVal;
        }

        // String comparison
        var aStr = String(aVal || '').toLowerCase();
        var bStr = String(bVal || '').toLowerCase();
        if (currentSortDirection === 'asc') {
          return aStr.localeCompare(bStr);
        } else {
          return bStr.localeCompare(aStr);
        }
      });
    }

    // Create sort handler
    var handleSort = function handleSort(column) {
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
    var thead = {
      t: 'thead',
      c: {
        t: 'tr',
        c: cols.map(function (col) {
          return {
            t: 'th',
            a: sortable ? {
              style: {
                cursor: 'pointer',
                userSelect: 'none'
              },
              onclick: function onclick() {
                return handleSort(col.key);
              }
            } : {},
            c: [col.label, sortable && currentSortColumn === col.key && {
              t: 'span',
              a: {
                style: {
                  marginLeft: '5px'
                }
              },
              c: currentSortDirection === 'asc' ? '▲' : '▼'
            }].filter(Boolean)
          };
        })
      }
    };

    // Build table body
    var tbody = {
      t: 'tbody',
      c: sortedData.map(function (row) {
        return {
          t: 'tr',
          c: cols.map(function (col) {
            return {
              t: 'td',
              c: col.render ? col.render(row[col.key], row) : String(row[col.key] || '')
            };
          })
        };
      })
    };
    return {
      t: 'table',
      a: {
        "class": className
      },
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
  bw.makeDataTable = function (config) {
    var title = config.title,
      data = config.data,
      columns = config.columns,
      _config$className2 = config.className,
      className = _config$className2 === void 0 ? "table table-striped table-hover" : _config$className2,
      _config$responsive = config.responsive,
      responsive = _config$responsive === void 0 ? true : _config$responsive,
      tableConfig = _objectWithoutProperties(config, _excluded);
    var table = bw.makeTable(_objectSpread2({
      data: data,
      columns: columns,
      className: className
    }, tableConfig));
    var content = [];
    if (title) {
      content.push({
        t: 'h5',
        a: {
          "class": 'mb-3'
        },
        c: title
      });
    }
    if (responsive) {
      content.push({
        t: 'div',
        a: {
          "class": 'table-responsive'
        },
        c: table
      });
    } else {
      content.push(table);
    }
    return {
      t: 'div',
      a: {
        "class": 'table-container'
      },
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
  bw.render = function (element, position, taco) {
    var _taco$o4, _taco$o5, _taco$o6;
    // Get target element
    var targetEl = typeof element === 'string' ? document.querySelector(element) : element;
    if (!targetEl) {
      return {
        object_type: 'error',
        component_id: null,
        object_handle_in_dom: null,
        status_code: 'error=target_element_not_found'
      };
    }

    // Generate unique ID if not provided
    var componentId = ((_taco$o4 = taco.o) === null || _taco$o4 === void 0 ? void 0 : _taco$o4.id) || bw.uuid();

    // Create DOM element
    var domElement;
    try {
      domElement = bw.createDOM(taco);
    } catch (e) {
      return {
        object_type: 'error',
        component_id: componentId,
        object_handle_in_dom: null,
        status_code: "error=render_failed:".concat(e.message)
      };
    }

    // Add component ID to element
    domElement.setAttribute('data-bw-id', componentId);

    // Insert into DOM based on position
    try {
      switch (position) {
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
          throw new Error("Invalid position: ".concat(position));
      }
    } catch (e) {
      return {
        object_type: 'error',
        component_id: componentId,
        object_handle_in_dom: null,
        status_code: "error=insertion_failed:".concat(e.message)
      };
    }

    // Create component handle
    var handle = {
      object_type: taco.t || 'element',
      component_id: componentId,
      object_handle_in_dom: domElement,
      status_code: 'success',
      // Reference to original TACO
      _taco: _objectSpread2({}, taco),
      _state: _objectSpread2({}, ((_taco$o5 = taco.o) === null || _taco$o5 === void 0 ? void 0 : _taco$o5.state) || {}),
      _mounted: true,
      // Get DOM element
      get element() {
        return this.object_handle_in_dom;
      },
      // Get/set state
      getState: function getState() {
        return _objectSpread2({}, this._state);
      },
      setState: function setState(updates) {
        var _this$_taco$o;
        this._state = _objectSpread2(_objectSpread2({}, this._state), updates);
        if ((_this$_taco$o = this._taco.o) !== null && _this$_taco$o !== void 0 && _this$_taco$o.onStateChange) {
          this._taco.o.onStateChange(this._state, updates);
        }
        return this;
      },
      // Update component (re-render)
      update: function update() {
        var _this$_taco$o2;
        if (!this._mounted || !this.element) return this;
        var parent = this.element.parentNode;
        this.element.nextSibling;

        // Update TACO with current state
        if (this._taco.o) {
          this._taco.o.state = this._state;
        }

        // Re-render
        var newElement = bw.createDOM(this._taco);
        newElement.setAttribute('data-bw-id', componentId);

        // Replace in DOM
        parent.replaceChild(newElement, this.element);
        this.object_handle_in_dom = newElement;

        // Call update lifecycle
        if ((_this$_taco$o2 = this._taco.o) !== null && _this$_taco$o2 !== void 0 && _this$_taco$o2.onUpdate) {
          this._taco.o.onUpdate(newElement, this._state);
        }
        return this;
      },
      // Get/set properties
      getProp: function getProp(key) {
        var _this$_taco$a;
        return (_this$_taco$a = this._taco.a) === null || _this$_taco$a === void 0 ? void 0 : _this$_taco$a[key];
      },
      setProp: function setProp(key, value) {
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
      getContent: function getContent() {
        return this._taco.c;
      },
      setContent: function setContent(content) {
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
      addClass: function addClass(className) {
        if (this.element) {
          this.element.classList.add(className);
        }
        return this;
      },
      removeClass: function removeClass(className) {
        if (this.element) {
          this.element.classList.remove(className);
        }
        return this;
      },
      toggleClass: function toggleClass(className) {
        if (this.element) {
          this.element.classList.toggle(className);
        }
        return this;
      },
      hasClass: function hasClass(className) {
        return this.element ? this.element.classList.contains(className) : false;
      },
      // Show/hide
      show: function show() {
        if (this.element) {
          this.element.style.display = '';
        }
        return this;
      },
      hide: function hide() {
        if (this.element) {
          this.element.style.display = 'none';
        }
        return this;
      },
      // Event handling
      on: function on(event, handler) {
        if (this.element) {
          this.element.addEventListener(event, handler);
        }
        return this;
      },
      off: function off(event, handler) {
        if (this.element) {
          this.element.removeEventListener(event, handler);
        }
        return this;
      },
      // Destroy component
      destroy: function destroy() {
        var _this$_taco$o3;
        if (!this._mounted) return this;

        // Call unmount lifecycle
        if ((_this$_taco$o3 = this._taco.o) !== null && _this$_taco$o3 !== void 0 && _this$_taco$o3.unmount) {
          this._taco.o.unmount(this.element);
        }

        // Remove from DOM
        if (this.element && this.element.parentNode) {
          this.element.parentNode.removeChild(this.element);
        }

        // Remove from registry
        bw._componentRegistry["delete"](componentId);

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
    if ((_taco$o6 = taco.o) !== null && _taco$o6 !== void 0 && _taco$o6.mounted) {
      taco.o.mounted(domElement, handle);
    }
    return handle;
  };

  /**
   * Get component handle by ID
   * @param {string} id - Component ID
   * @returns {Object|null} - Component handle or null
   */
  bw.getComponent = function (id) {
    return bw._componentRegistry.get(id) || null;
  };

  /**
   * Get all component handles
   * @returns {Map} - Map of all component handles
   */
  bw.getAllComponents = function () {
    return new Map(bw._componentRegistry);
  };

  // Register all make functions
  Object.entries(components).forEach(function (_ref11) {
    var _ref12 = _slicedToArray(_ref11, 2),
      name = _ref12[0],
      fn = _ref12[1];
    if (name.startsWith('make')) {
      bw[name] = fn;
    }
  });

  // Register component handles
  bw._componentHandles = componentHandles;

  // Create functions that return handles
  Object.entries(components).forEach(function (_ref13) {
    var _ref14 = _slicedToArray(_ref13, 2),
      name = _ref14[0],
      fn = _ref14[1];
    if (name.startsWith('make')) {
      var componentType = name.substring(4).toLowerCase(); // Remove 'make' prefix
      var createName = 'create' + name.substring(4); // createCard, createTable, etc.

      bw[createName] = function (props) {
        var taco = fn(props);
        var handle = bw.renderComponent(taco);

        // Use specialized handle class if available
        var HandleClass = bw._componentHandles[componentType];
        if (HandleClass) {
          var specializedHandle = new HandleClass(handle.element, taco);
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
  bw.createTable = function (data) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var taco = bw.makeTable(_objectSpread2({
      data: data
    }, options));
    var handle = bw.renderComponent(taco);

    // Use specialized TableHandle
    var TableHandle = bw._componentHandles.table;
    if (TableHandle) {
      var specializedHandle = new TableHandle(handle.element, taco);
      Object.setPrototypeOf(specializedHandle, handle);
      return specializedHandle;
    }
    return handle;
  };

  // Also attach to global in browsers
  if (bw._isBrowser && typeof window !== 'undefined') {
    window.bw = bw;
  }

  return bw;

}));
//# sourceMappingURL=bitwrench.es5.js.map
