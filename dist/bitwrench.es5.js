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
    version: '2.0.0',
    name: 'bitwrench',
    description: 'A library for javascript UI functions.',
    license: 'BSD-2-Clause',
    homepage: 'http://deftio.com/bitwrench',
    repository: 'git://github.com/deftio/bitwrench.git',
    author: 'manu a. chatterjee <deftio@deftio.com> (https://deftio.com/)',
    buildDate: '2025-07-20T17:21:26.946Z'
  };

  var _typography;
  /**
   * Bitwrench v2 Default Styles
   * Beautiful, responsive CSS inspired by modern design systems
   * Zero dependencies, works everywhere
   */

  var defaultStyles = {
    // Custom properties (CSS variables)
    root: {
      ':root': {
        '--bw-blue': '#0d6efd',
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
        '--bw-primary': '#0d6efd',
        '--bw-secondary': '#6c757d',
        '--bw-success': '#198754',
        '--bw-info': '#0dcaf0',
        '--bw-warning': '#ffc107',
        '--bw-danger': '#dc3545',
        '--bw-light': '#f8f9fa',
        '--bw-dark': '#212529',
        '--bw-font-sans-serif': '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        '--bw-font-monospace': 'SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
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
    // CSS Reset and Base
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
        'font-family': '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        'font-size': '1rem',
        'font-weight': '400',
        'line-height': '1.5',
        'color': '#212529',
        'background-color': '#f8f9fa',
        'margin': '0',
        'padding': '0'
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
    // Typography
    typography: (_typography = {
      'h1, h2, h3, h4, h5, h6': {
        'margin-top': '0',
        'margin-bottom': '.5rem',
        'font-weight': '500',
        'line-height': '1.2'
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
      'color': '#0d6efd',
      'text-decoration': 'underline'
    }), _defineProperty(_typography, 'a:hover', {
      'color': '#0a58ca'
    })),
    // Grid System
    grid: _defineProperty({
      '.container': {
        'width': '100%',
        'padding-right': '0.75rem',
        'padding-left': '0.75rem',
        'margin-right': 'auto',
        'margin-left': 'auto'
      },
      '@media (min-width: 576px)': {
        '.container': {
          'max-width': '540px'
        }
      },
      '@media (min-width: 768px)': {
        '.container': {
          'max-width': '720px'
        }
      },
      '@media (min-width: 992px)': {
        '.container': {
          'max-width': '960px'
        }
      },
      '@media (min-width: 1200px)': {
        '.container': {
          'max-width': '1140px'
        }
      },
      '.container-fluid': {
        'width': '100%',
        'padding-right': '15px',
        'padding-left': '15px',
        'margin-right': 'auto',
        'margin-left': 'auto'
      },
      '.row': {
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
      '.col': {
        'flex': '1 0 0%'
      }
    }, ".col", {
      'flex-basis': '0',
      'flex-grow': '1',
      'max-width': '100%'
    }),
    // Buttons
    buttons: {
      '.btn': {
        'display': 'inline-block',
        'font-weight': '400',
        'line-height': '1.5',
        'color': '#212529',
        'text-align': 'center',
        'text-decoration': 'none',
        'vertical-align': 'middle',
        'cursor': 'pointer',
        'user-select': 'none',
        'background-color': 'transparent',
        'border': '1px solid transparent',
        'padding': '.5rem 1rem',
        'font-size': '1rem',
        'border-radius': '.375rem',
        'transition': 'all .15s ease-in-out',
        'box-shadow': '0 1px 2px rgba(0,0,0,.05)'
      },
      '.btn:hover': {
        'text-decoration': 'none',
        'transform': 'translateY(-1px)',
        'box-shadow': '0 3px 5px rgba(0,0,0,.1)'
      },
      '.btn:active': {
        'transform': 'translateY(0)',
        'box-shadow': '0 1px 2px rgba(0,0,0,.05)'
      },
      '.btn:focus': {
        'outline': '0',
        'box-shadow': '0 0 0 0.25rem rgba(13, 110, 253, 0.25)'
      },
      '.btn:disabled': {
        'opacity': '0.65',
        'cursor': 'not-allowed'
      },
      // Button variants
      '.btn-primary': {
        'color': '#fff',
        'background-color': '#0d6efd',
        'border-color': '#0d6efd'
      },
      '.btn-primary:hover': {
        'color': '#fff',
        'background-color': '#0b5ed7',
        'border-color': '#0a58ca'
      },
      '.btn-secondary': {
        'color': '#fff',
        'background-color': '#6c757d',
        'border-color': '#6c757d'
      },
      '.btn-secondary:hover': {
        'color': '#fff',
        'background-color': '#5c636a',
        'border-color': '#565e64'
      },
      '.btn-success': {
        'color': '#fff',
        'background-color': '#198754',
        'border-color': '#198754'
      },
      '.btn-success:hover': {
        'color': '#fff',
        'background-color': '#157347',
        'border-color': '#146c43'
      },
      '.btn-danger': {
        'color': '#fff',
        'background-color': '#dc3545',
        'border-color': '#dc3545'
      },
      '.btn-danger:hover': {
        'color': '#fff',
        'background-color': '#bb2d3b',
        'border-color': '#b02a37'
      },
      // Button sizes
      '.btn-lg': {
        'padding': '0.5rem 1rem',
        'font-size': '1.25rem',
        'border-radius': '0.3rem'
      },
      '.btn-sm': {
        'padding': '0.25rem 0.5rem',
        'font-size': '0.875rem',
        'border-radius': '0.2rem'
      }
    },
    // Cards
    cards: {
      '.card': {
        'position': 'relative',
        'display': 'flex',
        'flex-direction': 'column',
        'min-width': '0',
        'height': '100%',
        'word-wrap': 'break-word',
        'background-color': '#fff',
        'background-clip': 'border-box',
        'border': '1px solid rgba(0,0,0,.125)',
        'border-radius': '.5rem',
        'box-shadow': '0 0.125rem 0.25rem rgba(0,0,0,.075)',
        'transition': 'box-shadow .15s ease-in-out, transform .15s ease-in-out'
      },
      '.card:hover': {
        'box-shadow': '0 0.5rem 1rem rgba(0,0,0,.15)',
        'transform': 'translateY(-2px)'
      },
      '.card-body': {
        'flex': '1 1 auto',
        'padding': '1.5rem'
      },
      '.card-title': {
        'margin-bottom': '0.5rem',
        'font-size': '1.25rem',
        'font-weight': '500'
      },
      '.card-text': {
        'margin-bottom': '0'
      },
      '.card-header': {
        'padding': '0.5rem 1rem',
        'margin-bottom': '0',
        'background-color': 'rgba(0,0,0,.03)',
        'border-bottom': '1px solid rgba(0,0,0,.125)'
      },
      '.card-footer': {
        'padding': '0.5rem 1rem',
        'background-color': 'rgba(0,0,0,.03)',
        'border-top': '1px solid rgba(0,0,0,.125)'
      },
      '.card-img-top': {
        'width': '100%',
        'border-top-left-radius': 'calc(0.25rem - 1px)',
        'border-top-right-radius': 'calc(0.25rem - 1px)'
      }
    },
    // Forms
    forms: {
      '.form-control': {
        'display': 'block',
        'width': '100%',
        'padding': '0.375rem 0.75rem',
        'font-size': '1rem',
        'font-weight': '400',
        'line-height': '1.5',
        'color': '#212529',
        'background-color': '#fff',
        'background-clip': 'padding-box',
        'border': '1px solid #ced4da',
        'appearance': 'none',
        'border-radius': '0.25rem',
        'transition': 'border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out'
      },
      '.form-control:focus': {
        'color': '#212529',
        'background-color': '#fff',
        'border-color': '#86b7fe',
        'outline': '0',
        'box-shadow': '0 0 0 0.25rem rgba(13, 110, 253, 0.25)'
      },
      '.form-label': {
        'margin-bottom': '0.5rem',
        'font-weight': '500'
      },
      '.form-group': {
        'margin-bottom': '1rem'
      }
    },
    // Navigation
    navigation: {
      '.navbar': {
        'position': 'relative',
        'display': 'flex',
        'flex-wrap': 'wrap',
        'align-items': 'center',
        'justify-content': 'space-between',
        'padding-top': '.5rem',
        'padding-bottom': '.5rem',
        'background-color': '#f8f9fa'
      },
      '.navbar > .container': {
        'display': 'flex',
        'flex-wrap': 'wrap',
        'align-items': 'center',
        'justify-content': 'space-between'
      },
      '.navbar-dark': {
        'background-color': '#212529'
      },
      '.navbar-dark .navbar-brand': {
        'color': '#fff'
      },
      '.navbar-dark .nav-link': {
        'color': 'rgba(255,255,255,.55)'
      },
      '.navbar-dark .nav-link:hover': {
        'color': 'rgba(255,255,255,.75)'
      },
      '.navbar-dark .nav-link.active': {
        'color': '#fff'
      },
      '.navbar-brand': {
        'display': 'inline-block',
        'padding-top': '0.3125rem',
        'padding-bottom': '0.3125rem',
        'margin-right': '1rem',
        'font-size': '1.25rem',
        'line-height': 'inherit',
        'white-space': 'nowrap'
      },
      '.navbar-nav': {
        'display': 'flex',
        'flex-direction': 'row',
        'padding-left': '0',
        'margin-bottom': '0',
        'list-style': 'none'
      },
      '.nav-link': {
        'display': 'block',
        'padding': '0.5rem 1rem',
        'color': '#0d6efd',
        'text-decoration': 'none',
        'transition': 'color 0.15s ease-in-out'
      },
      '.nav-link:hover': {
        'color': '#0a58ca'
      },
      '.nav-link.active': {
        'color': '#495057',
        'font-weight': '500'
      }
    },
    // Tables
    tables: _defineProperty({
      '.table': {
        'width': '100%',
        'margin-bottom': '1rem',
        'color': '#212529',
        'vertical-align': 'top',
        'border-color': '#dee2e6'
      },
      '.table > :not(caption) > * > *': {
        'padding': '0.5rem 0.5rem',
        'background-color': 'transparent',
        'border-bottom-width': '1px',
        'box-shadow': 'inset 0 0 0 9999px transparent'
      },
      '.table > tbody': {
        'vertical-align': 'inherit'
      },
      '.table > thead': {
        'vertical-align': 'bottom'
      },
      '.table-striped > tbody > tr:nth-of-type(odd) > *': {
        'background-color': 'rgba(0, 0, 0, 0.05)'
      },
      '.table-hover > tbody > tr:hover > *': {
        'background-color': 'rgba(0, 0, 0, 0.075)'
      },
      '.table-bordered': {
        'border': '1px solid #dee2e6'
      },
      '.table-bordered > :not(caption) > * > *': {
        'border-width': '1px 0'
      }
    }, ".table-bordered > :not(caption) > * > *", {
      'border-width': '0 1px'
    }),
    // Alerts
    alerts: {
      '.alert': {
        'position': 'relative',
        'padding': '1rem 1rem',
        'margin-bottom': '1rem',
        'border': '1px solid transparent',
        'border-radius': '.375rem'
      },
      '.alert-heading': {
        'color': 'inherit'
      },
      '.alert-link': {
        'font-weight': '700'
      },
      '.alert-dismissible': {
        'padding-right': '3rem'
      },
      '.alert-dismissible .btn-close': {
        'position': 'absolute',
        'top': '0',
        'right': '0',
        'z-index': '2',
        'padding': '1.25rem 1rem'
      },
      '.alert-primary': {
        'color': '#084298',
        'background-color': '#cfe2ff',
        'border-color': '#b6d4fe'
      },
      '.alert-primary .alert-link': {
        'color': '#06357a'
      },
      '.alert-secondary': {
        'color': '#41464b',
        'background-color': '#e2e3e5',
        'border-color': '#d3d6d8'
      },
      '.alert-secondary .alert-link': {
        'color': '#34383c'
      },
      '.alert-success': {
        'color': '#0f5132',
        'background-color': '#d1e7dd',
        'border-color': '#badbcc'
      },
      '.alert-success .alert-link': {
        'color': '#0c4128'
      },
      '.alert-info': {
        'color': '#055160',
        'background-color': '#cff4fc',
        'border-color': '#b6effb'
      },
      '.alert-info .alert-link': {
        'color': '#04414d'
      },
      '.alert-warning': {
        'color': '#664d03',
        'background-color': '#fff3cd',
        'border-color': '#ffecb5'
      },
      '.alert-warning .alert-link': {
        'color': '#523e02'
      },
      '.alert-danger': {
        'color': '#842029',
        'background-color': '#f8d7da',
        'border-color': '#f5c2c7'
      },
      '.alert-danger .alert-link': {
        'color': '#6a1a21'
      },
      '.alert-light': {
        'color': '#636464',
        'background-color': '#fefefe',
        'border-color': '#fdfdfe'
      },
      '.alert-light .alert-link': {
        'color': '#4f5050'
      },
      '.alert-dark': {
        'color': '#141619',
        'background-color': '#d3d3d4',
        'border-color': '#bcbebf'
      },
      '.alert-dark .alert-link': {
        'color': '#101214'
      }
    },
    // Badges
    badges: {
      '.badge': {
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
      '.badge:empty': {
        'display': 'none'
      },
      '.btn .badge': {
        'position': 'relative',
        'top': '-1px'
      },
      '.badge-primary': {
        'color': '#fff',
        'background-color': '#0d6efd'
      },
      '.badge-secondary': {
        'color': '#fff',
        'background-color': '#6c757d'
      },
      '.badge-success': {
        'color': '#fff',
        'background-color': '#198754'
      },
      '.badge-info': {
        'color': '#000',
        'background-color': '#0dcaf0'
      },
      '.badge-warning': {
        'color': '#000',
        'background-color': '#ffc107'
      },
      '.badge-danger': {
        'color': '#fff',
        'background-color': '#dc3545'
      },
      '.badge-light': {
        'color': '#000',
        'background-color': '#f8f9fa'
      },
      '.badge-dark': {
        'color': '#fff',
        'background-color': '#212529'
      }
    },
    // Progress bars
    progress: {
      '.progress': {
        'display': 'flex',
        'height': '1.25rem',
        'overflow': 'hidden',
        'font-size': '.875rem',
        'background-color': '#e9ecef',
        'border-radius': '.5rem',
        'box-shadow': 'inset 0 1px 2px rgba(0,0,0,.1)'
      },
      '.progress-bar': {
        'display': 'flex',
        'flex-direction': 'column',
        'justify-content': 'center',
        'overflow': 'hidden',
        'color': '#fff',
        'text-align': 'center',
        'white-space': 'nowrap',
        'background-color': '#0d6efd',
        'transition': 'width .6s ease',
        'box-shadow': 'inset 0 -1px 0 rgba(0,0,0,.15)',
        'font-weight': '600'
      },
      '.progress-bar-striped': {
        'background-image': 'linear-gradient(45deg,rgba(255,255,255,.15) 25%,transparent 25%,transparent 50%,rgba(255,255,255,.15) 50%,rgba(255,255,255,.15) 75%,transparent 75%,transparent)',
        'background-size': '1rem 1rem'
      },
      '.progress-bar-animated': {
        'animation': 'progress-bar-stripes 1s linear infinite'
      },
      '@keyframes progress-bar-stripes': {
        '0%': {
          'background-position-x': '1rem'
        }
      }
    },
    // Utilities
    utilities: {
      // Spacing
      '.m-0': {
        'margin': '0 !important'
      },
      '.m-1': {
        'margin': '.25rem !important'
      },
      '.m-2': {
        'margin': '.5rem !important'
      },
      '.m-3': {
        'margin': '1rem !important'
      },
      '.m-4': {
        'margin': '1.5rem !important'
      },
      '.m-5': {
        'margin': '3rem !important'
      },
      '.m-auto': {
        'margin': 'auto !important'
      },
      '.mt-0': {
        'margin-top': '0 !important'
      },
      '.mt-1': {
        'margin-top': '.25rem !important'
      },
      '.mt-2': {
        'margin-top': '.5rem !important'
      },
      '.mt-3': {
        'margin-top': '1rem !important'
      },
      '.mt-4': {
        'margin-top': '1.5rem !important'
      },
      '.mt-5': {
        'margin-top': '3rem !important'
      },
      '.mb-0': {
        'margin-bottom': '0 !important'
      },
      '.mb-1': {
        'margin-bottom': '.25rem !important'
      },
      '.mb-2': {
        'margin-bottom': '.5rem !important'
      },
      '.mb-3': {
        'margin-bottom': '1rem !important'
      },
      '.mb-4': {
        'margin-bottom': '1.5rem !important'
      },
      '.mb-5': {
        'margin-bottom': '3rem !important'
      },
      '.ms-0': {
        'margin-left': '0 !important'
      },
      '.ms-1': {
        'margin-left': '.25rem !important'
      },
      '.ms-2': {
        'margin-left': '.5rem !important'
      },
      '.ms-3': {
        'margin-left': '1rem !important'
      },
      '.ms-4': {
        'margin-left': '1.5rem !important'
      },
      '.ms-5': {
        'margin-left': '3rem !important'
      },
      '.me-0': {
        'margin-right': '0 !important'
      },
      '.me-1': {
        'margin-right': '.25rem !important'
      },
      '.me-2': {
        'margin-right': '.5rem !important'
      },
      '.me-3': {
        'margin-right': '1rem !important'
      },
      '.me-4': {
        'margin-right': '1.5rem !important'
      },
      '.me-5': {
        'margin-right': '3rem !important'
      },
      '.p-0': {
        'padding': '0 !important'
      },
      '.p-1': {
        'padding': '.25rem !important'
      },
      '.p-2': {
        'padding': '.5rem !important'
      },
      '.p-3': {
        'padding': '1rem !important'
      },
      '.p-4': {
        'padding': '1.5rem !important'
      },
      '.p-5': {
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
      '.text-left': {
        'text-align': 'left'
      },
      '.text-right': {
        'text-align': 'right'
      },
      '.text-center': {
        'text-align': 'center'
      },
      // Display
      '.d-none': {
        'display': 'none'
      },
      '.d-block': {
        'display': 'block'
      },
      '.d-inline': {
        'display': 'inline'
      },
      '.d-inline-block': {
        'display': 'inline-block'
      },
      '.d-flex': {
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
      '.text-primary': {
        'color': '#0d6efd'
      },
      '.text-secondary': {
        'color': '#6c757d'
      },
      '.text-success': {
        'color': '#198754'
      },
      '.text-danger': {
        'color': '#dc3545'
      },
      '.text-warning': {
        'color': '#ffc107'
      },
      '.text-info': {
        'color': '#0dcaf0'
      },
      '.text-light': {
        'color': '#f8f9fa'
      },
      '.text-dark': {
        'color': '#212529'
      },
      '.text-muted': {
        'color': '#6c757d'
      },
      '.bg-primary': {
        'background-color': '#0d6efd'
      },
      '.bg-secondary': {
        'background-color': '#6c757d'
      },
      '.bg-success': {
        'background-color': '#198754'
      },
      '.bg-danger': {
        'background-color': '#dc3545'
      },
      '.bg-warning': {
        'background-color': '#ffc107'
      },
      '.bg-info': {
        'background-color': '#0dcaf0'
      },
      '.bg-light': {
        'background-color': '#f8f9fa'
      },
      '.bg-dark': {
        'background-color': '#212529'
      },
      // Borders
      '.border': {
        'border': '1px solid #dee2e6 !important'
      },
      '.border-0': {
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
      '.rounded': {
        'border-radius': '.375rem !important'
      },
      '.rounded-0': {
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
      '.rounded-circle': {
        'border-radius': '50% !important'
      },
      '.rounded-pill': {
        'border-radius': '50rem !important'
      },
      // Shadows
      '.shadow': {
        'box-shadow': '0 .5rem 1rem rgba(0,0,0,.15) !important'
      },
      '.shadow-sm': {
        'box-shadow': '0 .125rem .25rem rgba(0,0,0,.075) !important'
      },
      '.shadow-lg': {
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
    // Responsive utilities
    responsive: {
      '@media (min-width: 576px)': {
        '.col-sm-1': {
          'flex': '0 0 8.333333%',
          'max-width': '8.333333%'
        },
        '.col-sm-2': {
          'flex': '0 0 16.666667%',
          'max-width': '16.666667%'
        },
        '.col-sm-3': {
          'flex': '0 0 25%',
          'max-width': '25%'
        },
        '.col-sm-4': {
          'flex': '0 0 33.333333%',
          'max-width': '33.333333%'
        },
        '.col-sm-5': {
          'flex': '0 0 41.666667%',
          'max-width': '41.666667%'
        },
        '.col-sm-6': {
          'flex': '0 0 50%',
          'max-width': '50%'
        },
        '.col-sm-7': {
          'flex': '0 0 58.333333%',
          'max-width': '58.333333%'
        },
        '.col-sm-8': {
          'flex': '0 0 66.666667%',
          'max-width': '66.666667%'
        },
        '.col-sm-9': {
          'flex': '0 0 75%',
          'max-width': '75%'
        },
        '.col-sm-10': {
          'flex': '0 0 83.333333%',
          'max-width': '83.333333%'
        },
        '.col-sm-11': {
          'flex': '0 0 91.666667%',
          'max-width': '91.666667%'
        },
        '.col-sm-12': {
          'flex': '0 0 100%',
          'max-width': '100%'
        }
      },
      '@media (min-width: 768px)': {
        '.col-md-1': {
          'flex': '0 0 8.333333%',
          'max-width': '8.333333%'
        },
        '.col-md-2': {
          'flex': '0 0 16.666667%',
          'max-width': '16.666667%'
        },
        '.col-md-3': {
          'flex': '0 0 25%',
          'max-width': '25%'
        },
        '.col-md-4': {
          'flex': '0 0 33.333333%',
          'max-width': '33.333333%'
        },
        '.col-md-5': {
          'flex': '0 0 41.666667%',
          'max-width': '41.666667%'
        },
        '.col-md-6': {
          'flex': '0 0 50%',
          'max-width': '50%'
        },
        '.col-md-7': {
          'flex': '0 0 58.333333%',
          'max-width': '58.333333%'
        },
        '.col-md-8': {
          'flex': '0 0 66.666667%',
          'max-width': '66.666667%'
        },
        '.col-md-9': {
          'flex': '0 0 75%',
          'max-width': '75%'
        },
        '.col-md-10': {
          'flex': '0 0 83.333333%',
          'max-width': '83.333333%'
        },
        '.col-md-11': {
          'flex': '0 0 91.666667%',
          'max-width': '91.666667%'
        },
        '.col-md-12': {
          'flex': '0 0 100%',
          'max-width': '100%'
        }
      },
      '@media (min-width: 992px)': {
        '.col-lg-1': {
          'flex': '0 0 8.333333%',
          'max-width': '8.333333%'
        },
        '.col-lg-2': {
          'flex': '0 0 16.666667%',
          'max-width': '16.666667%'
        },
        '.col-lg-3': {
          'flex': '0 0 25%',
          'max-width': '25%'
        },
        '.col-lg-4': {
          'flex': '0 0 33.333333%',
          'max-width': '33.333333%'
        },
        '.col-lg-5': {
          'flex': '0 0 41.666667%',
          'max-width': '41.666667%'
        },
        '.col-lg-6': {
          'flex': '0 0 50%',
          'max-width': '50%'
        },
        '.col-lg-7': {
          'flex': '0 0 58.333333%',
          'max-width': '58.333333%'
        },
        '.col-lg-8': {
          'flex': '0 0 66.666667%',
          'max-width': '66.666667%'
        },
        '.col-lg-9': {
          'flex': '0 0 75%',
          'max-width': '75%'
        },
        '.col-lg-10': {
          'flex': '0 0 83.333333%',
          'max-width': '83.333333%'
        },
        '.col-lg-11': {
          'flex': '0 0 91.666667%',
          'max-width': '91.666667%'
        },
        '.col-lg-12': {
          'flex': '0 0 100%',
          'max-width': '100%'
        }
      }
    }
  };

  /**
   * Get all default styles as a single object
   */
  function getAllStyles() {
    return Object.assign({}, defaultStyles.root, defaultStyles.reset, defaultStyles.typography, defaultStyles.grid, defaultStyles.buttons, defaultStyles.cards, defaultStyles.forms, defaultStyles.navigation, defaultStyles.tables, defaultStyles.alerts, defaultStyles.badges, defaultStyles.progress, defaultStyles.utilities, defaultStyles.responsive);
  }

  /**
   * Get default theme configuration
   */
  var theme = {
    colors: {
      primary: '#0d6efd',
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
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
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
    }
  };

  var _excluded = ["title", "data", "columns", "className", "responsive"];

  // Core bitwrench namespace
  var bw = {
    // Version info from generated file
    version: VERSION_INFO.version,
    versionInfo: VERSION_INFO,
    // Internal state
    _idCounter: 0,
    _unmountCallbacks: new Map(),
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
  bw.uuid = function () {
    // Use crypto.randomUUID if available (modern browsers)
    if (bw._isBrowser && crypto && crypto.randomUUID) {
      return 'bw_' + crypto.randomUUID().replace(/-/g, '');
    }

    // Fallback for older browsers and Node.js
    var timestamp = Date.now().toString(36);
    var counter = (++bw._idCounter).toString(36);
    var random = Math.random().toString(36).substring(2, 11);
    return "bw_".concat(timestamp, "_").concat(counter, "_").concat(random);
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
        // Handle class as array or string
        var classStr = Array.isArray(value) ? value.filter(Boolean).join(' ') : String(value);
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
        // Handle class as array or string
        var classStr = Array.isArray(value) ? value.filter(Boolean).join(' ') : String(value);
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

    // Handle lifecycle hooks
    if (opts.mounted || opts.unmount) {
      var id = attrs['data-bw-id'] || bw.uuid();
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

    // Clean up existing content
    bw.cleanup(targetEl);

    // Clear and mount new content
    targetEl.innerHTML = '';
    if (taco != null) {
      if (Array.isArray(taco)) {
        taco.forEach(function (t) {
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

      // Clean up state
      delete el._bw_state;
    });

    // Check element itself
    var id = element.getAttribute('data-bw-id');
    if (id) {
      var callback = bw._unmountCallbacks.get(id);
      if (callback) {
        callback();
        bw._unmountCallbacks["delete"](id);
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
   * Get theme configuration
   * @returns {Object} - Theme object
   */
  bw.getTheme = function () {
    return _objectSpread2({}, theme);
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
        for (var _i3 = 0; _i3 < hex.length; _i3 += 2) {
          r[_i3 / 2] = parseInt(hex.substring(_i3, _i3 + 2), 16);
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

  // Helper for attributes to string conversion
  bw._attrsToStr = function (attrs) {
    if (!attrs || _typeof(attrs) !== "object") return "";
    var str = "";
    for (var _i4 = 0, _Object$entries3 = Object.entries(attrs); _i4 < _Object$entries3.length; _i4++) {
      var _Object$entries3$_i = _slicedToArray(_Object$entries3[_i4], 2),
        key = _Object$entries3$_i[0],
        value = _Object$entries3$_i[1];
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
   * Create a responsive data table with built-in features
   * @param {Object} config - Table configuration
   * @returns {Object} - TACO object for table with wrapper
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
    var _taco$o3, _taco$o4, _taco$o5;
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
    var componentId = ((_taco$o3 = taco.o) === null || _taco$o3 === void 0 ? void 0 : _taco$o3.id) || bw.uuid();

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
      _state: _objectSpread2({}, ((_taco$o4 = taco.o) === null || _taco$o4 === void 0 ? void 0 : _taco$o4.state) || {}),
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
    if ((_taco$o5 = taco.o) !== null && _taco$o5 !== void 0 && _taco$o5.mounted) {
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

  // Also attach to global in browsers
  if (bw._isBrowser && typeof window !== 'undefined') {
    window.bw = bw;
  }

  return bw;

}));
//# sourceMappingURL=bitwrench.es5.js.map
