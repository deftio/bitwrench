# Bitwrench v2 Core Functions

This document describes the core utility functions that make bitwrench powerful and unique.

## Type Detection

### bw.typeOf(x, baseTypeOnly)

The most powerful type detection function - goes beyond native `typeof`:

```javascript
/**
 * Enhanced type detection that distinguishes built-in objects
 * @param {*} x - Value to examine
 * @param {boolean} [baseTypeOnly=false] - If true, returns only "object"/"function" for objects
 * @returns {string} - Type name
 */
bw.typeOf = function(x, baseTypeOnly) {
  // Handle null explicitly
  if (x === null) return "null";
  
  // Basic typeof
  const basic = typeof x;
  
  // For primitives, return basic type
  if (basic !== "object" && basic !== "function") {
    return basic;
  }
  
  // If baseTypeOnly requested, return basic type
  if (baseTypeOnly) return basic;
  
  // Get detailed type via toString
  const stringTag = Object.prototype.toString.call(x);
  
  // Map [object TypeName] to TypeName
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
  
  // Check for Bitwrench types
  if (x._is_BW_HTMLNode) {
    return "BW_HTMLNode";
  }
  
  // Try to get constructor name
  if (x.constructor && x.constructor.name) {
    return x.constructor.name;
  }
  
  return basic;
};

// Aliases
bw.to = bw.typeOf;

// Examples:
bw.typeOf(2)                    // "number"
bw.typeOf("hello")              // "string"
bw.typeOf([1,2,3])              // "array"
bw.typeOf(new Date())           // "Date"
bw.typeOf(/regex/)              // "RegExp"
bw.typeOf(new Map())            // "Map"
bw.typeOf(function(){})         // "function"
bw.typeOf(new MyClass())        // "MyClass"
bw.typeOf(null)                 // "null"
bw.typeOf(undefined)            // "undefined"
```

## TACO/HTML Generation

### bw.html(taco, options)

Convert TACO objects to HTML strings:

```javascript
/**
 * Convert TACO object to HTML string
 * @param {Object|Array|string} taco - TACO object or array of TACOs
 * @param {Object} [options] - Rendering options
 * @returns {string} - HTML string
 */
bw.html = function(taco, options = {}) {
  // See implementation in main design doc
};
```

### bw.createDOM(taco, options)

Create actual DOM elements from TACO:

```javascript
/**
 * Create DOM element from TACO object
 * @param {Object} taco - TACO object
 * @param {Object} [options] - Creation options
 * @returns {Element} - DOM element
 */
bw.createDOM = function(taco, options = {}) {
  // See implementation in main design doc
};
```

## CSS Generation

### bw.makeCSS(cssData, options)

Generate CSS from JavaScript data structures:

```javascript
/**
 * Generate CSS string from data
 * @param {string|Array|Object} cssData - CSS rules
 * @param {Object} [options] - Generation options
 * @returns {string} - CSS string
 */
bw.makeCSS = function(cssData, options = {}) {
  const { pretty = false, minify = !pretty } = options;
  let css = '';
  
  // Handle different input formats
  if (typeof cssData === 'string') {
    return cssData;
  }
  
  if (Array.isArray(cssData)) {
    cssData.forEach(rule => {
      if (typeof rule === 'string') {
        css += rule + '\n';
      } else if (Array.isArray(rule)) {
        css += bw.makeCSSRule(rule, options) + '\n';
      }
    });
  }
  
  return minify ? css.replace(/\s+/g, ' ').trim() : css;
};
```

### bw.makeCSSRule(selector, styles, options)

Generate a single CSS rule:

```javascript
/**
 * Generate CSS rule from selector and styles
 * @param {Array} rule - [selector, styles] or [[selectors], styles]
 * @param {Object} [options] - Generation options
 * @returns {string} - CSS rule
 */
bw.makeCSSRule = function(rule, options = {}) {
  const { pretty = false } = options;
  const [selector, styles] = rule;
  
  // Handle array of selectors
  const selectorStr = Array.isArray(selector) ? selector.join(', ') : selector;
  
  // Handle styles
  let stylesStr = '';
  if (typeof styles === 'string') {
    stylesStr = styles;
  } else if (typeof styles === 'object') {
    stylesStr = Object.entries(styles)
      .map(([prop, value]) => `${prop}: ${value}`)
      .join(pretty ? ';\n  ' : '; ');
  }
  
  return pretty 
    ? `${selectorStr} {\n  ${stylesStr};\n}`
    : `${selectorStr} { ${stylesStr} }`;
};
```

## Random Data Generation

### bw.random(rangeBegin, rangeEnd, options)

Enhanced random number generator:

```javascript
/**
 * Generate random numbers with various options
 * @param {number} [rangeBegin=0] - Start of range (inclusive)
 * @param {number} [rangeEnd=100] - End of range (inclusive)
 * @param {Object} [options] - Generation options
 * @returns {number|Array} - Random value(s)
 */
bw.random = function(rangeBegin = 0, rangeEnd = 100, options = {}) {
  const {
    setType = "int",     // "int" | "float"
    dims = false         // false | number | [x,y,z...]
  } = options;
  
  const generateOne = () => {
    const range = rangeEnd - rangeBegin;
    const raw = Math.random() * range + rangeBegin;
    return setType === "int" ? Math.round(raw) : raw;
  };
  
  // Handle dimensions
  if (dims) {
    return bw.multiArray(generateOne, dims);
  }
  
  return generateOne();
};

// Examples:
bw.random()                          // Random int 0-100
bw.random(1, 10)                     // Random int 1-10
bw.random(-5, 5, {setType: "float"}) // Random float -5 to 5
bw.random(0, 1, {dims: [3, 4]})      // 3x4 array of random ints
```

### bw.multiArray(value, dims)

Create multi-dimensional arrays:

```javascript
/**
 * Create multi-dimensional array filled with value or function results
 * @param {*|Function} value - Value or generator function
 * @param {number|Array} dims - Dimensions
 * @returns {Array} - Multi-dimensional array
 */
bw.multiArray = function(value, dims) {
  dims = typeof dims === 'number' ? [dims] : dims;
  
  const generate = () => typeof value === 'function' ? value() : value;
  
  const createArray = (depth) => {
    if (depth === dims.length - 1) {
      return Array(dims[depth]).fill(null).map(() => generate());
    }
    return Array(dims[depth]).fill(null).map(() => createArray(depth + 1));
  };
  
  return createArray(0);
};

// Examples:
bw.multiArray(0, [3, 3])              // 3x3 array of zeros
bw.multiArray(() => Date.now(), [2, 2]) // 2x2 array of timestamps
bw.multiArray(bw.random, [4, 5])      // 4x5 array of random numbers
```

## Text Utilities

### bw.loremIpsum(numChars, startSpot, startWithCapital)

Generate Lorem Ipsum placeholder text:

```javascript
/**
 * Generate Lorem Ipsum text
 * @param {number} [numChars=446] - Number of characters
 * @param {number} [startSpot=0] - Starting position in text
 * @param {boolean} [startWithCapital=true] - Capitalize first letter
 * @returns {string} - Lorem Ipsum text
 */
bw.loremIpsum = function(numChars = 446, startSpot = 0, startWithCapital = true) {
  const lorem = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. ";
  
  // Rotate starting position
  startSpot = startSpot % lorem.length;
  let text = lorem.substring(startSpot) + lorem.substring(0, startSpot);
  
  // Repeat as needed
  while (text.length < numChars) {
    text += lorem;
  }
  
  text = text.substring(0, numChars);
  
  // Capitalize if needed
  if (startWithCapital && text[0] && text[0] === text[0].toLowerCase()) {
    text = text[0].toUpperCase() + text.slice(1);
  }
  
  return text;
};
```

## URL Parameter Handling

### bw.getURLParam(key, defaultValue)

Parse URL parameters easily:

```javascript
/**
 * Get URL parameter value
 * @param {string} [key] - Parameter name (omit for all params)
 * @param {*} [defaultValue] - Default if not found
 * @returns {*} - Parameter value or object of all params
 */
bw.getURLParam = function(key, defaultValue) {
  if (typeof window === 'undefined' || !window.location) {
    return defaultValue;
  }
  
  const params = new URLSearchParams(window.location.search);
  
  // Return all params if no key specified
  if (!key) {
    const result = {};
    for (const [k, v] of params) {
      // Handle valueless params as boolean true
      result[k] = v === '' ? true : v;
    }
    return result;
  }
  
  // Return specific param
  if (params.has(key)) {
    const value = params.get(key);
    return value === '' ? true : value;
  }
  
  return defaultValue;
};

// Examples:
// URL: example.com?foo=123&bar&baz=hello
bw.getURLParam()              // {foo: "123", bar: true, baz: "hello"}
bw.getURLParam("foo")         // "123"
bw.getURLParam("bar")         // true (valueless param)
bw.getURLParam("missing", 0)  // 0 (default value)
```

### bw.URLParamSerialize(params)

Convert object to URL parameters:

```javascript
/**
 * Serialize object to URL parameters
 * @param {Object} params - Parameters object
 * @returns {string} - URL parameter string
 */
bw.URLParamSerialize = function(params) {
  const parts = [];
  
  for (const [key, value] of Object.entries(params)) {
    if (value === true) {
      parts.push(encodeURIComponent(key));
    } else if (value !== false && value != null) {
      parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
    }
  }
  
  return parts.join('&');
};
```

## File Operations

### bw.saveFile(filename, data, options)

Save files in browser or Node.js:

```javascript
/**
 * Save file to client
 * @param {string} filename - Name of file
 * @param {string|Blob} data - File contents
 * @param {Object} [options] - Save options
 */
bw.saveFile = function(filename, data, options = {}) {
  if (typeof window === 'undefined') {
    // Node.js
    const fs = require('fs');
    fs.writeFileSync(filename, data);
  } else {
    // Browser
    const blob = data instanceof Blob ? data : new Blob([data], {
      type: options.mimeType || 'text/plain'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
};
```

### bw.saveJSON(filename, object, pretty)

Save JavaScript objects as JSON:

```javascript
/**
 * Save object as JSON file
 * @param {string} filename - Name of file
 * @param {Object} object - Object to save
 * @param {boolean} [pretty=true] - Pretty print JSON
 */
bw.saveJSON = function(filename, object, pretty = true) {
  const json = JSON.stringify(object, null, pretty ? 2 : 0);
  bw.saveFile(filename, json, { mimeType: 'application/json' });
};
```

## Table Generation

### bw.htmlTable(data, options)

Generate sortable HTML tables from arrays:

```javascript
/**
 * Generate HTML table from array data
 * @param {Array} data - 2D array of table data
 * @param {Object} [options] - Table options
 * @returns {Object} - TACO object for table
 */
bw.htmlTable = function(data, options = {}) {
  const {
    useFirstRowAsHeaders = true,
    sortable = false,
    striped = true,
    caption = null,
    className = "bw-table"
  } = options;
  
  if (!Array.isArray(data) || data.length === 0) {
    return { t: "table", c: "No data" };
  }
  
  let headers = [];
  let rows = data;
  
  if (useFirstRowAsHeaders) {
    headers = data[0];
    rows = data.slice(1);
  }
  
  return {
    t: "table",
    a: { 
      class: [
        className,
        striped && "bw-table-stripe",
        sortable && "bw-sortable"
      ].filter(Boolean).join(" ")
    },
    c: [
      caption && { t: "caption", c: caption },
      headers.length > 0 && {
        t: "thead",
        c: {
          t: "tr",
          c: headers.map((h, idx) => ({
            t: "th",
            a: sortable ? {
              onclick: function() { bw.sortTable(this, idx); },
              style: { cursor: "pointer" }
            } : {},
            c: h
          }))
        }
      },
      {
        t: "tbody",
        c: rows.map(row => ({
          t: "tr",
          c: row.map(cell => ({
            t: "td",
            c: bw.typeOf(cell) === 'function' ? cell() : String(cell)
          }))
        }))
      }
    ].filter(Boolean)
  };
};
```

### bw.sortTable(headerElement, columnIndex)

Sort table by column:

```javascript
/**
 * Sort table by column
 * @param {Element} headerElement - Clicked header element
 * @param {number} columnIndex - Column to sort by
 */
bw.sortTable = function(headerElement, columnIndex) {
  const table = headerElement.closest('table');
  const tbody = table.querySelector('tbody');
  const rows = Array.from(tbody.querySelectorAll('tr'));
  
  // Determine sort direction
  const currentDir = headerElement.dataset.sortDir || 'none';
  const newDir = currentDir === 'asc' ? 'desc' : 'asc';
  
  // Clear other headers
  table.querySelectorAll('th').forEach(th => {
    th.dataset.sortDir = 'none';
    th.classList.remove('bw-sort-asc', 'bw-sort-desc');
  });
  
  // Set new direction
  headerElement.dataset.sortDir = newDir;
  headerElement.classList.add(`bw-sort-${newDir}`);
  
  // Sort rows
  rows.sort((a, b) => {
    const aVal = a.cells[columnIndex].textContent;
    const bVal = b.cells[columnIndex].textContent;
    
    // Try numeric comparison first
    const aNum = parseFloat(aVal);
    const bNum = parseFloat(bVal);
    
    if (!isNaN(aNum) && !isNaN(bNum)) {
      return newDir === 'asc' ? aNum - bNum : bNum - aNum;
    }
    
    // Fall back to string comparison
    const result = aVal.localeCompare(bVal);
    return newDir === 'asc' ? result : -result;
  });
  
  // Reorder DOM
  tbody.innerHTML = '';
  rows.forEach(row => tbody.appendChild(row));
};
```

## Alignment Utilities

### Layout Alignment Helpers

Using old CSS techniques for maximum compatibility:

```javascript
/**
 * Center content horizontally and vertically (old CSS)
 * Works in IE8+
 */
bw.alignCenter = (content) => ({
  t: "div",
  a: {
    style: {
      display: "table",
      width: "100%",
      height: "100%"
    }
  },
  c: {
    t: "div",
    a: {
      style: {
        display: "table-cell",
        "vertical-align": "middle",
        "text-align": "center"
      }
    },
    c: content
  }
});

/**
 * Align content with old CSS
 * @param {*} content - Content to align
 * @param {string} horizontal - "left" | "center" | "right"
 * @param {string} vertical - "top" | "middle" | "bottom"
 */
bw.align = (content, horizontal = "center", vertical = "middle") => ({
  t: "div",
  a: {
    style: {
      display: "table",
      width: "100%",
      height: "100%"
    }
  },
  c: {
    t: "div",
    a: {
      style: {
        display: "table-cell",
        "vertical-align": vertical,
        "text-align": horizontal
      }
    },
    c: content
  }
});

// For absolute positioning (IE6+)
bw.alignAbsolute = (content, position = "center") => {
  const positions = {
    "top-left": { top: "0", left: "0" },
    "top-center": { top: "0", left: "50%", transform: "translateX(-50%)" },
    "top-right": { top: "0", right: "0" },
    "center-left": { top: "50%", left: "0", transform: "translateY(-50%)" },
    "center": { top: "50%", left: "50%", transform: "translate(-50%, -50%)" },
    "center-right": { top: "50%", right: "0", transform: "translateY(-50%)" },
    "bottom-left": { bottom: "0", left: "0" },
    "bottom-center": { bottom: "0", left: "50%", transform: "translateX(-50%)" },
    "bottom-right": { bottom: "0", right: "0" }
  };
  
  return {
    t: "div",
    a: {
      style: {
        position: "relative",
        width: "100%",
        height: "100%"
      }
    },
    c: {
      t: "div",
      a: {
        style: Object.assign(
          { position: "absolute" },
          positions[position] || positions.center
        )
      },
      c: content
    }
  };
};
```

## Documentation

### Modern JSDoc Conventions

For v2, we should use standard JSDoc:

```javascript
/**
 * Brief description of function
 * 
 * @param {Type} paramName - Parameter description
 * @param {Object} [options] - Optional parameter
 * @param {string} options.key - Option property
 * @returns {Type} - Return value description
 * 
 * @example
 * // Example usage
 * bw.someFunction(arg1, { key: 'value' });
 * 
 * @since 2.0.0
 * @see {@link bw.otherFunction}
 */
```

## Utility Type Helpers

### bw.typeAssign(value, type, trueValue, falseValue)

Conditional assignment based on type:

```javascript
/**
 * Return value based on type check
 * @param {*} value - Value to check
 * @param {string} type - Expected type
 * @param {*} trueValue - Return if type matches
 * @param {*} falseValue - Return if type doesn't match
 * @returns {*} - Conditional result
 */
bw.typeAssign = function(value, type, trueValue, falseValue) {
  return bw.typeOf(value) === type ? trueValue : falseValue;
};

// Example:
const result = bw.typeAssign(myVar, "number", "It's a number!", "Not a number");
```

## Color Utilities

### Color Conversion Functions

```javascript
/**
 * Convert HSL to RGB
 * @param {number|Array} h - Hue [0-360] or [h,s,l,a,"hsl"] array
 * @param {number} [s] - Saturation [0-100]
 * @param {number} [l] - Lightness [0-100]
 * @param {number} [a=255] - Alpha [0-255]
 * @returns {Array} - [r,g,b,a,"rgb"]
 */
bw.colorHslToRgb = function(h, s, l, a = 255) {
  // Handle array input
  if (Array.isArray(h)) {
    [h, s, l, a] = h;
  }
  
  // Convert to 0-1 range
  h = h / 360;
  s = s / 100;
  l = l / 100;
  
  let r, g, b;
  
  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  
  return [
    Math.round(r * 255),
    Math.round(g * 255),
    Math.round(b * 255),
    a,
    "rgb"
  ];
};

/**
 * Convert RGB to HSL
 * @param {number|Array} r - Red [0-255] or [r,g,b,a,"rgb"] array
 * @param {number} [g] - Green [0-255]
 * @param {number} [b] - Blue [0-255]
 * @param {number} [a=255] - Alpha [0-255]
 * @returns {Array} - [h,s,l,a,"hsl"]
 */
bw.colorRgbToHsl = function(r, g, b, a = 255) {
  // Handle array input
  if (Array.isArray(r)) {
    [r, g, b, a] = r;
  }
  
  r /= 255;
  g /= 255;
  b /= 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  
  if (max === min) {
    h = s = 0; // achromatic
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    
    h /= 6;
  }
  
  return [
    Math.round(h * 360),
    Math.round(s * 100),
    Math.round(l * 100),
    a,
    "hsl"
  ];
};

/**
 * Parse any color format to bitwrench array
 * @param {string|Array} color - Color in any format
 * @returns {Array} - [c0,c1,c2,a,model]
 */
bw.colorParse = function(color) {
  if (Array.isArray(color)) return color;
  
  if (typeof color !== 'string') return [0, 0, 0, 255, "rgb"];
  
  color = color.trim();
  
  // Hex format
  if (color[0] === '#') {
    color = color.slice(1);
    
    // 3-digit hex
    if (color.length === 3) {
      color = color[0] + color[0] + color[1] + color[1] + color[2] + color[2];
    }
    
    const r = parseInt(color.substr(0, 2), 16);
    const g = parseInt(color.substr(2, 2), 16);
    const b = parseInt(color.substr(4, 2), 16);
    const a = color.length > 6 ? parseInt(color.substr(6, 2), 16) : 255;
    
    return [r, g, b, a, "rgb"];
  }
  
  // rgb()/rgba() format
  const rgbMatch = color.match(/rgba?\(([^)]+)\)/);
  if (rgbMatch) {
    const parts = rgbMatch[1].split(',').map(s => parseFloat(s.trim()));
    return [parts[0], parts[1], parts[2], parts[3] || 255, "rgb"];
  }
  
  // hsl()/hsla() format
  const hslMatch = color.match(/hsla?\(([^)]+)\)/);
  if (hslMatch) {
    const parts = hslMatch[1].split(',').map(s => parseFloat(s.trim()));
    return [parts[0], parts[1], parts[2], parts[3] || 255, "hsl"];
  }
  
  // Named colors (basic set)
  const namedColors = {
    black: [0, 0, 0],
    white: [255, 255, 255],
    red: [255, 0, 0],
    green: [0, 128, 0],
    blue: [0, 0, 255],
    // Add more as needed
  };
  
  if (namedColors[color.toLowerCase()]) {
    const rgb = namedColors[color.toLowerCase()];
    return [...rgb, 255, "rgb"];
  }
  
  return [0, 0, 0, 255, "rgb"]; // Default to black
};

/**
 * Convert any color to hex format
 * @param {string|Array} color - Color in any format
 * @param {string} [format="auto"] - Output format
 * @returns {string} - Hex color #RRGGBB or #RRGGBBAA
 */
bw.colorToRGBHex = function(color, format = "auto") {
  const c = bw.colorParse(color);
  
  // Convert to RGB if needed
  let rgb = c;
  if (c[4] === "hsl") {
    rgb = bw.colorHslToRgb(c);
  }
  
  const toHex = (n) => {
    const hex = Math.round(bw.clip(n, 0, 255)).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  
  let hex = '#' + toHex(rgb[0]) + toHex(rgb[1]) + toHex(rgb[2]);
  
  // Add alpha if not fully opaque or format requires it
  if (format !== "auto" || rgb[3] < 255) {
    hex += toHex(rgb[3]);
  }
  
  return hex;
};

/**
 * Interpolate between colors
 * @param {number} value - Value to interpolate
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value  
 * @param {Array} colors - Array of colors to interpolate between
 * @param {number} [stretch] - Exponential stretch factor
 * @returns {Array} - Interpolated color [r,g,b,a,"rgb"]
 */
bw.colorInterp = function(value, min, max, colors, stretch) {
  // Ensure we have at least 2 colors
  if (!Array.isArray(colors) || colors.length < 2) {
    colors = ["#000", "#fff"];
  }
  
  // Parse all colors to bitwrench format
  const parsedColors = colors.map(c => bw.colorParse(c));
  
  // Map value to color array position
  const position = bw.mapScale(value, min, max, 0, parsedColors.length - 1, {
    clip: true,
    expScale: stretch
  });
  
  // Find surrounding colors
  const i = Math.floor(position);
  const fraction = position - i;
  
  // Get colors to interpolate between
  const c1 = parsedColors[Math.min(i, parsedColors.length - 1)];
  const c2 = parsedColors[Math.min(i + 1, parsedColors.length - 1)];
  
  // Interpolate each channel
  const interpolate = (idx) => {
    return Math.round(c1[idx] + (c2[idx] - c1[idx]) * fraction);
  };
  
  return [
    interpolate(0),
    interpolate(1),
    interpolate(2),
    interpolate(3),
    "rgb"
  ];
};
```

## Math Utilities

### bw.clip(value, min, max)

Constrain value to range:

```javascript
bw.clip = function(value, min, max) {
  return Math.max(min, Math.min(max, value));
};
```

### bw.mapScale(x, in0, in1, out0, out1, options)

Already documented above - one of bitwrench's most useful functions!

## DOM Utilities (Modernized)

### bw.$(selector) - jQuery-like but always returns array

```javascript
/**
 * Select DOM elements, always returns array
 * @param {string|Element|Array} selector - CSS selector, element, or array
 * @returns {Array} - Array of DOM elements
 */
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
  
  // CSS selector
  if (typeof selector === 'string') {
    return Array.from(document.querySelectorAll(selector));
  }
  
  return [];
};

// Convenience methods
bw.$.one = function(selector) {
  return bw.$(selector)[0] || null;
};

bw.$.addClass = function(selector, className) {
  bw.$(selector).forEach(el => el.classList.add(...className.split(' ')));
  return bw.$;
};

bw.$.removeClass = function(selector, className) {
  bw.$(selector).forEach(el => el.classList.remove(...className.split(' ')));
  return bw.$;
};

bw.$.toggleClass = function(selector, className) {
  bw.$(selector).forEach(el => el.classList.toggle(className));
  return bw.$;
};

bw.$.hasClass = function(selector, className) {
  return bw.$(selector).some(el => el.classList.contains(className));
};
```

## Summary

These core functions provide:
1. **Powerful type detection** beyond native JavaScript
2. **HTML/DOM generation** from TACO objects
3. **CSS generation** from JavaScript data
4. **Random data generation** with dimensions
5. **Text utilities** for placeholder content
6. **URL parameter** parsing and serialization
7. **File operations** for browser and Node.js
8. **Table generation** with sorting
9. **Alignment utilities** using old CSS for compatibility
10. **Color manipulation** functions

All functions maintain bitwrench's philosophy:
- Zero dependencies
- Works in old browsers (IE8+)
- Simple, predictable APIs
- JavaScript objects as the source of truth