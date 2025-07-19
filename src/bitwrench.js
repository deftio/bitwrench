/*
 *  bitwrench.js  --- Misc Helper Functions .. 
 *	
 *  version 2.x 
 * 
 *  bitwrench is just a named space set of javascript helper functions useful for common web tasks and 
 *  some server side js.   No rhyme or reason I just needed these items over and overgain and didn't feel
 *  like cobbling together different common libs
 *
 *	@copy Copyright (C) <2013>  <M. A. Chatterjee>
 *  	
 *  @author M A Chatterjee <deftio [at] deftio [dot] com>
 *
 *	This software is provided 'as-is', without any express or implied
 *	warranty. In no event will the authors be held liable for any damages
 *	arising from the use of this software.
 *
 *	Permission is granted to anyone to use this software for any purpose,
 *	including commercial applications, and to alter it and redistribute it
 *	freely, subject to the following restrictions:
 *
 *	1. The origin of this software must not be misrepresented; you must not
 *	claim that you wrote the original software. If you use this software
 *	in a product, an acknowledgment in the product documentation is required.
 *
 *	2. Altered source versions must be plainly marked as such, and must not be
 *	misrepresented as being the original software.
 *
 *	3. This notice may not be removed or altered from any source
 *	distribution.
 *
 */
//JS Hint linter directives
/*jshint -W069 */ //suppresses warning about using x.var_name vs x["var_name"]

//usage in browser
//<script type="text/javascript" src="./bitwrench.js"></script>

//usage in nodejs
//var bw = require('./bitwrench.js');  //adds to current scope in nodejs

//or use ESM module import
//import * as bw from './bitwrench_ESM.js'; //adds to current scope in nodejs

(function (global, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS
    module.exports = factory();
  } else {
    // Global (old browsers, <script> usage)
    global.bw = factory();
  }
}(this, function () {
  'use strict';

  // =========================================================================
  // 1. Internal Data & Utilities
  // =========================================================================

  /**
   * bitwrench typeOf : A more descriptive type checker than native `typeof`.
   * 
   * - Distinguishes built-in objects like Date, RegExp, Map, WeakMap, Set, WeakSet (if they exist).
 * - If `baseTypeOnly` is `true`, returns "object" or "function" for objects/functions.
 * - Otherwise tries to return the constructor name (e.g. "Car", "Date").
 * - Falls back to "object"/"function" if the constructor name is empty or minified.
 * - Special-cases a Bitwrench property `_is_BW_HTMLNode`.
 * - Uses old-school JS to support older browsers (down to IE8 or so).
 *
 * @function typeOf
 * @param {*} x - The value to examine
 * @param {boolean} [baseTypeOnly=false] - If `true`, returns only "object"/"function" for objects/functions
 * @returns {string} - A string describing the value's type
 */
  function typeOf(x, baseTypeOnly) {
    // For older browsers, ensure baseTypeOnly is either true/false
    if (typeof baseTypeOnly === "undefined") {
      baseTypeOnly = false;
    }

    // Handle null explicitly
    if (x === null) {
      return "null";
    }

    // Fallback if Object.prototype.toString not available
    // (very old browsers, though extremely rare)
    if (!Object.prototype.toString) {
      // If it doesn't exist, fallback to basic typeof
      var basic = typeof x;
      if (basic === "object" || basic === "function") {
        // We can’t refine more. 
        return basic;
      } else {
        return basic;
      }
    }

    // For older IE, if String.prototype.trim is not available, define a local fallback
    function safeTrim(str) {
      if (!str || typeof str.replace !== "function") {
        return str;
      }
      // Basic polyfill for trim
      return str.replace(/^\s+|\s+$/g, '');
    }

    // Use Object.prototype.toString to get a base "tag"
    var rawString = Object.prototype.toString.call(x);
    // e.g., "[object Object]" => "Object"
    var match = rawString.match(/\[object\s+([a-zA-Z]+)\]/);
    var rawType = match ? match[1].toLowerCase() : "object";

    // For non-object/function, return early
    if (rawType !== "object" && rawType !== "function") {
      return rawType; // e.g. "string", "number", "boolean", "undefined"
    }

    // If user wants only the base type
    if (baseTypeOnly === true) {
      return rawType; // "object" or "function"
    }

    // Additional detection for known built-ins
    //   => only if they're defined, since older browsers might not have them
    if (rawType === "object") {
      if (x instanceof Date) {
        return "Date";
      }
      if (x instanceof RegExp) {
        return "RegExp";
      }
      // Check for Map, Set, etc. only if they exist
      if (typeof Map !== "undefined" && x instanceof Map) {
        return "Map";
      }
      if (typeof WeakMap !== "undefined" && x instanceof WeakMap) {
        return "WeakMap";
      }
      if (typeof Set !== "undefined" && x instanceof Set) {
        return "Set";
      }
      if (typeof WeakSet !== "undefined" && x instanceof WeakSet) {
        return "WeakSet";
      }
    }

    // Attempt to refine via constructor.name
    var refinedType = rawType;
    try {
      var ctor = x.constructor;
      if (ctor && ctor.name) {
        var ctorName = safeTrim(ctor.name);
        // if constructor name is not empty and not just rawType
        if (ctorName && ctorName.toLowerCase() !== rawType) {
          refinedType = ctorName;
        }
      }
    } catch (e) {
      // Fail silently if constructor.name is inaccessible
    }

    // Special Bitwrench property check
    if (refinedType === "object" && x._is_BW_HTMLNode === true) {
      refinedType = "BW_HTMLNode";
    }

    return refinedType;
  }

  // Alias for convenience
  var _to = typeOf;
  /**
   * Internal set of known self-closing tags (HTML5).
   * Some are omitted or added as you see fit.
   */
  var SELF_CLOSING_TAGS = {
    area: true,
    base: true,
    br: true,
    col: true,
    embed: true,
    hr: true,
    img: true,
    input: true,
    link: true,
    meta: true,
    param: true,
    source: true,
    track: true,
    wbr: true
  };

  /**
   * Escapes special HTML characters in a string (minimal version).
   * For server and client usage (older browsers included).
   */
  function escapeHtml(str) {
    if (typeof str !== 'string') return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // =========================================================================
  // 2. Function Registry
  // =========================================================================

  var _fnRegistry = {};    // Internal dictionary of functionID -> function
  var _fnIDCounter = 0;

  /**
   * Register a function into the Bitwrench function registry, returning a unique ID.
   * @param {Function} fn - The function to register.
   * @param {string} [forceName] - Optional custom name for the function ID (e.g. "myFunc1").
   * @returns {string} - The function ID.
   */
  function funcRegister(fn, forceName) {
    if (typeof fn !== 'function') return '';
    var fnID = 'class_bwfn_' + _fnIDCounter;
    _fnIDCounter++;
    if (typeof forceName === 'string' && forceName.trim()) {
      fnID = forceName.trim();
    }
    _fnRegistry[fnID] = fn;
    return fnID;
  }

  /**
   * Unregister a function from the registry by its ID.
   * @param {string} fnID - The function ID to remove.
   */
  function funcUnregister(fnID) {
    if (fnID in _fnRegistry) {
      delete _fnRegistry[fnID];
    }
  }

  /**
   * Retrieve a function by its ID, or return an error function if not found.
   * @param {string} fnID
   * @param {Function} [errFn] - Optional fallback if not found.
   * @returns {Function}
   */
  function funcGetById(fnID, errFn) {
    fnID = String(fnID);
    if (_fnRegistry[fnID]) {
      return _fnRegistry[fnID];
    } else {
      var fallback = function () {
        // If no errFn is provided, just log an error
        if (typeof console !== 'undefined' && console.error) {
          console.error('Bitwrench: unregistered function ID:', fnID);
        }
      };
      return (typeof errFn === 'function') ? errFn : fallback;
    }
  }

  /**
   * Generate an inline string suitable for DOM attributes to dispatch a registered function.
   * Example result: "bw.funcGetById('class_bwfn_1')(this, 'arg1')"
   * @param {string} fnID
   * @param {string|Array|Function} argstring - Additional arguments to pass.
   * @returns {string}
   */
  function funcGetDispatchStr(fnID, argstring) {
    // Convert argstring to a string
    if (Array.isArray(argstring)) {
      argstring = argstring.join(',');
    } else if (typeof argstring === 'function') {
      argstring = argstring();
    } else if (typeof argstring !== 'string') {
      argstring = String(argstring || '');
    }
    return "bw.funcGetById('" + fnID + "')(" + argstring + ")";
  }

  // =========================================================================
  // 3. HTML Emitter (TACO -> HTML)
  // =========================================================================

  /**
   * Builds an attribute string from a dictionary of HTML attributes.
   * - boolean/null => ` key` (e.g. disabled)
   * - function => uses function registry => onclick="bw.funcGetById('fnID')(this)"
   * - strings => normal HTML escaped
   */
  function buildAttributes(attrs) {
    var parts = [];
    for (var key in attrs) {
      if (!attrs.hasOwnProperty(key)) continue;
      var val = attrs[key];

      // boolean attributes: (null or true => just the key)
      if (val === null || val === true) {
        parts.push(' ' + key);
        continue;
      }
      // function => generate dispatch
      if (typeof val === 'function') {
        var fnID = funcRegister(val); // register it
        var dispatchStr = funcGetDispatchStr(fnID, 'this');
        parts.push(' ' + key + '="' + dispatchStr + '"');
        continue;
      }
      // string => normal HTML escaped
      if (typeof val === 'string') {
        parts.push(' ' + key + '="' + escapeHtml(val) + '"');
        continue;
      }
      // everything else => convert to string
      parts.push(' ' + key + '="' + escapeHtml(String(val)) + '"');
    }
    return parts.join('');
  }

  /**
   * Recursively generate an HTML string from TACO object or string.
   * 
   * @param {Object|string} input - TACO object or string
   * @param {Object} [options] 
   *   - pretty: boolean => whether to indent 
   *   - indentLevel: number => current indentation
   *   - (future expansions possible)
   * @returns {string} - HTML string
   */
  function htmlEmit(input, options) {
    options = options || {};
    var pretty = !!options.pretty;
    var indentLevel = options.indentLevel || 0;

    // If input is a plain string, return it
    if (typeof input === 'string') {
      return input;
    }
    // If input is null or not an object, return empty
    if (!input || typeof input !== 'object') {
      return '';
    }

    // TACO keys => t, a, c, o
    var tagName = (input.t || '').trim();
    var attrs = input.a || {};
    var content = input.c || '';
    var compOpts = input.o || {};

    // Indentation strings
    var indentStr = pretty ? repeatStr('  ', indentLevel) : '';
    var newline = pretty ? '\n' : '';
    var childIndentLevel = indentLevel + 1;
    var childIndentStr = pretty ? repeatStr('  ', childIndentLevel) : '';

    // If tagName is empty => treat as fragment
    var isFragment = !tagName;
    var forceXml = !!compOpts.tags_force_xml;

    // Opening tag
    var result = '';
    if (!isFragment) {
      // Check if self-closing logic is possible
      var isSelfClose = SELF_CLOSING_TAGS[tagName.toLowerCase()] && !forceXml && (!content || (Array.isArray(content) && content.length === 0));
      result += indentStr + '<' + tagName + buildAttributes(attrs);
      if (isSelfClose) {
        // e.g. <br/>
        result += '/>';
        return result + (pretty ? newline : '');
      } else {
        // e.g. <div>
        result += '>';
      }
    }

    // Content logic
    if (Array.isArray(content)) {
      // multiple child nodes
      var parts = [];
      for (var i = 0; i < content.length; i++) {
        parts.push(htmlEmit(content[i], {
          pretty: pretty,
          indentLevel: isFragment ? indentLevel : childIndentLevel
        }));
      }
      var joinedContent = parts.join('');
      if (!isFragment && pretty && joinedContent.trim()) {
        // If it's a real tag, add newlines around content
        result += newline + joinedContent + indentStr;
      } else {
        result += joinedContent;
      }
    } else if (typeof content === 'string') {
      // textual content
      if (!isFragment) {
        if (pretty && content.trim()) {
          result += newline + childIndentStr + escapeHtml(content) + newline + indentStr;
        } else {
          result += escapeHtml(content);
        }
      } else {
        // fragment => return content directly, but escaped
        result += escapeHtml(content);
      }
    } else {
      // if content is an object, handle as single TACO child
      result += htmlEmit(content, {
        pretty: pretty,
        indentLevel: isFragment ? indentLevel : childIndentLevel
      });
    }

    // Closing tag if not fragment
    if (!isFragment) {
      result += '</' + tagName + '>';
      if (pretty) result += newline;
    }

    return result;
  }

  /**
   * Simple utility for repeating a string N times (works in older browsers).
   */
  function repeatStr(str, count) {
    var out = '';
    for (var i = 0; i < count; i++) {
      out += str;
    }
    return out;
  }

  // =============================================================================================
  function loremIpsum(numChars, startSpot, startWithCapitalLetter) {
    /** 
    bw.loremIpsum(numChars, startSpot)
    
    generate a simple string of Lorem Ipsum text (sample typographer's text) of numChars in length.  
    
    if startSpot is supplied, it starts the string at the supplied index e.g. bw.loremIpsum(200, 50) 
    will supply 200 chars of loremIpsum starting at index 50 of the Lorem Ipsum sample text.
    
    if startWithCapitalLetter == true then the function will capitlize the first character or inject a capital letter if ihe first character isn't a capital letter.
        default is true;
    
    Default is a paragraph of lorem ipsum (446 chars)
     */

    startSpot = _to(startSpot) != "number" ? 0 : Math.round(startSpot);

    var l = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. ";
    startSpot = startSpot % l.length;
    l = l.substring(startSpot, l.length) + l.substring(0, startSpot);

    if (_to(numChars) != "number")
      numChars = l.length;

    var i = numChars, s = "";


    while (i > 0) {
      s += (i < l.length) ? l.substring(0, i) : l;
      i -= l.length;
    }
    if (s[s.length - 1] == " ")
      s = s.substring(0, s.length - 1) + "."; // always end on non-whitespace.  "." was chosen arbitrarily.
    if (startWithCapitalLetter != false) {
      var c = s[0].toUpperCase();
      c = c.match(/[A-Z]/) ? c : "M";
      s = c + s.substring(1, s.length);
    }

    return s;

  }


  // =========================================================================
  // 4. Public API (bw)
  // =========================================================================

  var bw = {
    // Basic info
    version: function () {
      return { version: '0.0.1', name: 'Bitwrench2 Modernized' };
    },

    // Function Registry
    funcRegister: funcRegister,
    funcUnregister: funcUnregister,
    funcGetById: funcGetById,
    funcGetDispatchStr: funcGetDispatchStr,

    // Core TACO -> HTML emitter
    htmlEmit: htmlEmit,

    // Additional utilities
    escapeHtml: escapeHtml,
    loremIpsum: loremIpsum,
    typeOf: typeOf,
    to: typeOf
  };

  return bw;

}));

