'use strict';

/**
 * Auto-generated version file from package.json
 * DO NOT EDIT DIRECTLY - Use npm run generate-version
 */

const VERSION_INFO = {
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

const defaultStyles = {
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
    'h1': { 'font-size': '2.5rem' },
    'h2': { 'font-size': '2rem' },
    'h3': { 'font-size': '1.75rem' },
    'h4': { 'font-size': '1.5rem' },
    'h5': { 'font-size': '1.25rem' },
    'h6': { 'font-size': '1rem' },
    
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
      '.container': { 'max-width': '540px' }
    },
    '@media (min-width: 768px)': {
      '.container': { 'max-width': '720px' }
    },
    '@media (min-width: 992px)': {
      '.container': { 'max-width': '960px' }
    },
    '@media (min-width: 1200px)': {
      '.container': { 'max-width': '1140px' }
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
    '.m-0': { 'margin': '0' },
    '.m-1': { 'margin': '0.25rem' },
    '.m-2': { 'margin': '0.5rem' },
    '.m-3': { 'margin': '1rem' },
    '.m-4': { 'margin': '1.5rem' },
    '.m-5': { 'margin': '3rem' },
    
    '.p-0': { 'padding': '0' },
    '.p-1': { 'padding': '0.25rem' },
    '.p-2': { 'padding': '0.5rem' },
    '.p-3': { 'padding': '1rem' },
    '.p-4': { 'padding': '1.5rem' },
    '.p-5': { 'padding': '3rem' },
    
    // Text alignment
    '.text-left': { 'text-align': 'left' },
    '.text-right': { 'text-align': 'right' },
    '.text-center': { 'text-align': 'center' },
    
    // Display
    '.d-none': { 'display': 'none' },
    '.d-block': { 'display': 'block' },
    '.d-inline': { 'display': 'inline' },
    '.d-inline-block': { 'display': 'inline-block' },
    '.d-flex': { 'display': 'flex' },
    
    // Flexbox
    '.justify-content-start': { 'justify-content': 'flex-start' },
    '.justify-content-end': { 'justify-content': 'flex-end' },
    '.justify-content-center': { 'justify-content': 'center' },
    '.justify-content-between': { 'justify-content': 'space-between' },
    '.justify-content-around': { 'justify-content': 'space-around' },
    
    '.align-items-start': { 'align-items': 'flex-start' },
    '.align-items-end': { 'align-items': 'flex-end' },
    '.align-items-center': { 'align-items': 'center' },
    
    // Colors
    '.text-primary': { 'color': '#0d6efd' },
    '.text-secondary': { 'color': '#6c757d' },
    '.text-success': { 'color': '#198754' },
    '.text-danger': { 'color': '#dc3545' },
    '.text-warning': { 'color': '#ffc107' },
    '.text-info': { 'color': '#0dcaf0' },
    '.text-light': { 'color': '#f8f9fa' },
    '.text-dark': { 'color': '#212529' },
    '.text-muted': { 'color': '#6c757d' },
    
    '.bg-primary': { 'background-color': '#0d6efd' },
    '.bg-secondary': { 'background-color': '#6c757d' },
    '.bg-success': { 'background-color': '#198754' },
    '.bg-danger': { 'background-color': '#dc3545' },
    '.bg-warning': { 'background-color': '#ffc107' },
    '.bg-info': { 'background-color': '#0dcaf0' },
    '.bg-light': { 'background-color': '#f8f9fa' },
    '.bg-dark': { 'background-color': '#212529' }
  },

  // Responsive utilities
  responsive: {
    '@media (min-width: 576px)': {
      '.col-sm-1': { 'flex': '0 0 8.333333%', 'max-width': '8.333333%' },
      '.col-sm-2': { 'flex': '0 0 16.666667%', 'max-width': '16.666667%' },
      '.col-sm-3': { 'flex': '0 0 25%', 'max-width': '25%' },
      '.col-sm-4': { 'flex': '0 0 33.333333%', 'max-width': '33.333333%' },
      '.col-sm-5': { 'flex': '0 0 41.666667%', 'max-width': '41.666667%' },
      '.col-sm-6': { 'flex': '0 0 50%', 'max-width': '50%' },
      '.col-sm-7': { 'flex': '0 0 58.333333%', 'max-width': '58.333333%' },
      '.col-sm-8': { 'flex': '0 0 66.666667%', 'max-width': '66.666667%' },
      '.col-sm-9': { 'flex': '0 0 75%', 'max-width': '75%' },
      '.col-sm-10': { 'flex': '0 0 83.333333%', 'max-width': '83.333333%' },
      '.col-sm-11': { 'flex': '0 0 91.666667%', 'max-width': '91.666667%' },
      '.col-sm-12': { 'flex': '0 0 100%', 'max-width': '100%' }
    },
    '@media (min-width: 768px)': {
      '.col-md-1': { 'flex': '0 0 8.333333%', 'max-width': '8.333333%' },
      '.col-md-2': { 'flex': '0 0 16.666667%', 'max-width': '16.666667%' },
      '.col-md-3': { 'flex': '0 0 25%', 'max-width': '25%' },
      '.col-md-4': { 'flex': '0 0 33.333333%', 'max-width': '33.333333%' },
      '.col-md-5': { 'flex': '0 0 41.666667%', 'max-width': '41.666667%' },
      '.col-md-6': { 'flex': '0 0 50%', 'max-width': '50%' },
      '.col-md-7': { 'flex': '0 0 58.333333%', 'max-width': '58.333333%' },
      '.col-md-8': { 'flex': '0 0 66.666667%', 'max-width': '66.666667%' },
      '.col-md-9': { 'flex': '0 0 75%', 'max-width': '75%' },
      '.col-md-10': { 'flex': '0 0 83.333333%', 'max-width': '83.333333%' },
      '.col-md-11': { 'flex': '0 0 91.666667%', 'max-width': '91.666667%' },
      '.col-md-12': { 'flex': '0 0 100%', 'max-width': '100%' }
    },
    '@media (min-width: 992px)': {
      '.col-lg-1': { 'flex': '0 0 8.333333%', 'max-width': '8.333333%' },
      '.col-lg-2': { 'flex': '0 0 16.666667%', 'max-width': '16.666667%' },
      '.col-lg-3': { 'flex': '0 0 25%', 'max-width': '25%' },
      '.col-lg-4': { 'flex': '0 0 33.333333%', 'max-width': '33.333333%' },
      '.col-lg-5': { 'flex': '0 0 41.666667%', 'max-width': '41.666667%' },
      '.col-lg-6': { 'flex': '0 0 50%', 'max-width': '50%' },
      '.col-lg-7': { 'flex': '0 0 58.333333%', 'max-width': '58.333333%' },
      '.col-lg-8': { 'flex': '0 0 66.666667%', 'max-width': '66.666667%' },
      '.col-lg-9': { 'flex': '0 0 75%', 'max-width': '75%' },
      '.col-lg-10': { 'flex': '0 0 83.333333%', 'max-width': '83.333333%' },
      '.col-lg-11': { 'flex': '0 0 91.666667%', 'max-width': '91.666667%' },
      '.col-lg-12': { 'flex': '0 0 100%', 'max-width': '100%' }
    }
  }
};

/**
 * Get all default styles as a single object
 */
function getAllStyles() {
  return Object.assign({},
    defaultStyles.reset,
    defaultStyles.typography,
    defaultStyles.grid,
    defaultStyles.buttons,
    defaultStyles.cards,
    defaultStyles.forms,
    defaultStyles.navigation,
    defaultStyles.tables,
    defaultStyles.utilities,
    defaultStyles.responsive
  );
}

/**
 * Get default theme configuration
 */
const theme = {
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

/**
 * Bitwrench v2 Core
 * Zero-dependency UI library using JavaScript objects
 * Works in browsers (IE11+) and Node.js
 * 
 * @license BSD-2-Clause
 * @author M A Chatterjee <deftio [at] deftio [dot] com>
 */


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

// Also attach to global in browsers
if (bw._isBrowser && typeof window !== 'undefined') {
  window.bw = bw;
}

module.exports = bw;
//# sourceMappingURL=bitwrench.cjs.js.map
