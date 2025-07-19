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
  function _defineProperty(e, r, t) {
    return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, {
      value: t,
      enumerable: !0,
      configurable: !0,
      writable: !0
    }) : e[r] = t, e;
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
  function _slicedToArray(r, e) {
    return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest();
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
    buildDate: '2025-07-19T21:42:14.805Z'
  };

  /**
   * Bitwrench v2 Default Styles
   * Beautiful, responsive CSS inspired by modern design systems
   * Zero dependencies, works everywhere
   */

  var defaultStyles = {
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
        'color': '#212529',
        'background-color': '#fff',
        'margin': '0',
        'padding': '0'
      }
    },
    // Typography
    typography: {
      'h1, h2, h3, h4, h5, h6': {
        'margin-top': '0',
        'margin-bottom': '0.5rem',
        'font-weight': '500',
        'line-height': '1.2',
        'color': 'inherit'
      },
      'h1': {
        'font-size': '2.5rem'
      },
      'h2': {
        'font-size': '2rem'
      },
      'h3': {
        'font-size': '1.75rem'
      },
      'h4': {
        'font-size': '1.5rem'
      },
      'h5': {
        'font-size': '1.25rem'
      },
      'h6': {
        'font-size': '1rem'
      },
      'p': {
        'margin-top': '0',
        'margin-bottom': '1rem'
      },
      'small': {
        'font-size': '0.875rem'
      },
      'a': {
        'color': '#0d6efd',
        'text-decoration': 'underline'
      },
      'a:hover': {
        'color': '#0a58ca'
      }
    },
    // Grid System
    grid: {
      '.container': {
        'width': '100%',
        'padding-right': '15px',
        'padding-left': '15px',
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
        'margin-right': '-15px',
        'margin-left': '-15px'
      },
      // Column system
      '[class*="col-"]': {
        'position': 'relative',
        'width': '100%',
        'padding-right': '15px',
        'padding-left': '15px'
      },
      '.col': {
        'flex-basis': '0',
        'flex-grow': '1',
        'max-width': '100%'
      }
    },
    // Buttons
    buttons: {
      '.btn': {
        'display': 'inline-block',
        'font-weight': '400',
        'line-height': '1.5',
        'text-align': 'center',
        'text-decoration': 'none',
        'vertical-align': 'middle',
        'cursor': 'pointer',
        'user-select': 'none',
        'background-color': 'transparent',
        'border': '1px solid transparent',
        'padding': '0.375rem 0.75rem',
        'font-size': '1rem',
        'border-radius': '0.25rem',
        'transition': 'color 0.15s ease-in-out, background-color 0.15s ease-in-out, border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out'
      },
      '.btn:hover': {
        'text-decoration': 'none'
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
        'word-wrap': 'break-word',
        'background-color': '#fff',
        'background-clip': 'border-box',
        'border': '1px solid rgba(0,0,0,.125)',
        'border-radius': '0.25rem'
      },
      '.card-body': {
        'flex': '1 1 auto',
        'padding': '1rem'
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
        'padding': '0.5rem 1rem',
        'background-color': '#f8f9fa'
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
    tables: {
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
      }
    },
    // Utilities
    utilities: {
      // Spacing
      '.m-0': {
        'margin': '0'
      },
      '.m-1': {
        'margin': '0.25rem'
      },
      '.m-2': {
        'margin': '0.5rem'
      },
      '.m-3': {
        'margin': '1rem'
      },
      '.m-4': {
        'margin': '1.5rem'
      },
      '.m-5': {
        'margin': '3rem'
      },
      '.p-0': {
        'padding': '0'
      },
      '.p-1': {
        'padding': '0.25rem'
      },
      '.p-2': {
        'padding': '0.5rem'
      },
      '.p-3': {
        'padding': '1rem'
      },
      '.p-4': {
        'padding': '1.5rem'
      },
      '.p-5': {
        'padding': '3rem'
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
    return Object.assign({}, defaultStyles.reset, defaultStyles.typography, defaultStyles.grid, defaultStyles.buttons, defaultStyles.cards, defaultStyles.forms, defaultStyles.navigation, defaultStyles.tables, defaultStyles.utilities, defaultStyles.responsive);
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
    var random = Math.random().toString(36).substr(2, 9);
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

    // Add data-bw-id if lifecycle hooks present
    if ((opts.mounted || opts.unmount) && !attrs['data-bw-id']) {
      var id = opts.bw_id || bw.uuid();
      attrStr += " data-bw-id=\"".concat(id, "\"");
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

  // Also attach to global in browsers
  if (bw._isBrowser && typeof window !== 'undefined') {
    window.bw = bw;
  }

  return bw;

}));
//# sourceMappingURL=bitwrench.es5.js.map
