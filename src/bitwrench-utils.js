/**
 * Bitwrench v2 Utility Functions
 *
 * Pure utility functions with no DOM dependencies. These work identically
 * in Node.js and browsers: type detection, math, array ops, text generation,
 * timing helpers.
 *
 * Extracted from bitwrench.js to keep the core focused on DOM/TACO/state.
 *
 * @module bitwrench-utils
 * @license BSD-2-Clause
 * @author M A Chatterjee <deftio [at] deftio [dot] com>
 */

/**
 * Enhanced type detection that distinguishes arrays, dates, regexps, and more.
 *
 * Goes beyond `typeof` by using `Object.prototype.toString` to identify
 * specific object types. Returns lowercase strings for primitives and arrays,
 * PascalCase for built-in classes (Date, RegExp, Map, Set, etc.).
 *
 * @param {*} x - Value to examine
 * @param {boolean} [baseTypeOnly=false] - If true, return only the base type ("object" for all objects)
 * @returns {string} Type name
 * @category Core
 * @example
 * typeOf("hello")         // => "string"
 * typeOf(42)              // => "number"
 * typeOf([1, 2, 3])       // => "array"
 * typeOf(new Date())      // => "Date"
 * typeOf({a: 1})          // => "Object"
 * typeOf([1,2], true)     // => "object"
 */
export function typeOf(x, baseTypeOnly) {
  if (x === null) return "null";

  const basic = typeof x;

  if (basic !== "object") {
    return basic;  // covers: string, number, boolean, undefined, function, symbol, bigint
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
}

/**
 * Map/scale a value from one range to another (linear interpolation).
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
 * @example
 * mapScale(50, 0, 100, 0, 1)  // => 0.5
 * mapScale(75, 0, 100, 0, 255) // => 191.25
 */
export function mapScale(x, in0, in1, out0, out1, options = {}) {
  const { clip: doClip = false, expScale = 1 } = options;

  // Normalize to 0-1
  let normalized = (x - in0) / (in1 - in0);

  // Apply exponential scaling
  if (expScale !== 1) {
    normalized = Math.pow(normalized, expScale);
  }

  // Map to output range
  let result = normalized * (out1 - out0) + out0;

  // Clip if requested
  if (doClip) {
    const min = Math.min(out0, out1);
    const max = Math.max(out0, out1);
    result = Math.max(min, Math.min(max, result));
  }

  return result;
}

/**
 * Clamp a value between min and max bounds.
 *
 * @param {number} value - Value to clamp
 * @param {number} min - Minimum allowed value
 * @param {number} max - Maximum allowed value
 * @returns {number} Clamped value
 * @category Math
 * @example
 * clip(150, 0, 100)  // => 100
 * clip(-5, 0, 100)   // => 0
 */
export function clip(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

/**
 * Use a dictionary as a switch statement, with support for function values.
 *
 * @param {*} x - Key to look up
 * @param {Object} choices - Dictionary of choices (values can be functions)
 * @param {*} def - Default value if key not found
 * @returns {*} Value or function result
 * @category Array Utilities
 * @example
 * var colors = { red: 1, blue: 2, aqua: function(z) { return z + 'marine'; } };
 * choice('red', colors, '0')   // => 1
 * choice('aqua', colors)       // => 'aquamarine'
 */
export function choice(x, choices, def) {
  const z = (x in choices) ? choices[x] : def;
  return typeOf(z) === "function" ? z(x) : z;
}

/**
 * Return unique elements of an array (preserves first occurrence order).
 *
 * @param {Array} x - Input array
 * @returns {Array} Array with unique elements
 * @category Array Utilities
 * @example
 * arrayUniq([1, 2, 2, 3, 1])  // => [1, 2, 3]
 */
export function arrayUniq(x) {
  if (typeOf(x) !== "array") return [];
  return x.filter((v, i, arr) => arr.indexOf(v) === i);
}

/**
 * Return the intersection of two arrays (elements present in both).
 *
 * @param {Array} a - First array
 * @param {Array} b - Second array
 * @returns {Array} Unique elements found in both a and b
 * @category Array Utilities
 * @example
 * arrayBinA([1, 2, 3], [2, 3, 4])  // => [2, 3]
 */
export function arrayBinA(a, b) {
  if (typeOf(a) !== "array" || typeOf(b) !== "array") return [];
  return arrayUniq(a.filter(n => b.indexOf(n) !== -1));
}

/**
 * Return elements of b that are not present in a (set difference).
 *
 * @param {Array} a - First array (the "exclude" set)
 * @param {Array} b - Second array (source of results)
 * @returns {Array} Unique elements in b but not in a
 * @category Array Utilities
 * @example
 * arrayBNotInA([1, 2, 3], [2, 3, 4, 5])  // => [4, 5]
 */
export function arrayBNotInA(a, b) {
  if (typeOf(a) !== "array" || typeOf(b) !== "array") return [];
  return arrayUniq(b.filter(n => a.indexOf(n) < 0));
}

/**
 * Interpolate between an array of colors based on a value in a range.
 *
 * @param {number} x - Value to interpolate
 * @param {number} in0 - Input range start
 * @param {number} in1 - Input range end
 * @param {Array} colors - Array of CSS color strings to interpolate between
 * @param {number} [stretch] - Exponential scaling factor (1 = linear)
 * @param {Function} colorParseFn - Color parse function (injected to avoid circular dep)
 * @returns {Array} Interpolated color as [r, g, b, a, "rgb"]
 * @category Color
 * @example
 * colorInterp(50, 0, 100, ['#ff0000', '#00ff00'], undefined, bw.colorParse)
 */
export function colorInterp(x, in0, in1, colors, stretch, colorParseFn) {
  let c = Array.isArray(colors) ? colors : ["#000", "#fff"];
  c = c.length === 0 ? ["#000", "#fff"] : c;
  if (c.length === 1) return c[0];

  // Convert all colors to RGB format
  c = c.map(col => colorParseFn(col));

  const a = mapScale(x, in0, in1, 0, c.length - 1, { clip: true, expScale: stretch });
  const i = clip(Math.floor(a), 0, c.length - 2);
  const r = a - i;

  const interp = (idx) => mapScale(r, 0, 1, c[i][idx], c[i + 1][idx], { clip: true });
  return [interp(0), interp(1), interp(2), interp(3), "rgb"];
}

/**
 * Generate Lorem Ipsum placeholder text.
 *
 * @param {number} [numChars] - Number of characters (random 25-150 if not provided)
 * @param {number} [startSpot] - Starting index in Lorem text (random if undefined)
 * @param {boolean} [startWithCapitalLetter=true] - Start with a capital letter
 * @returns {string} Lorem ipsum text
 * @category Text Generation
 * @example
 * loremIpsum(50)
 * // => "Lorem ipsum dolor sit amet, consectetur adipiscin"
 */
export function loremIpsum(numChars, startSpot, startWithCapitalLetter = true) {
  const lorem = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. ";

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
  let skippedChars = 0;
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

  let l = lorem.substring(startSpot) + lorem.substring(0, startSpot);

  let result = "";
  let remaining = numChars + skippedChars;  // Add skipped chars to honor original numChars

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
    let c = result[0].toUpperCase();
    c = /[A-Z]/.test(c) ? c : "L";  // Use "L" as default if first char isn't a letter
    result = c + result.substring(1);
  }

  return result;
}

/**
 * Create a multidimensional array filled with a value or function result.
 *
 * @param {*} value - Value or function to fill array with
 * @param {number|Array} dims - Dimensions (number for 1D, array for multi-D)
 * @returns {Array} Multidimensional array
 * @category Array Utilities
 * @example
 * multiArray(0, [4, 5])            // 4x5 array of 0s
 * multiArray(Math.random, [3, 4])  // 3x4 array of random numbers
 */
export function multiArray(value, dims) {
  const v = () => typeOf(value) === "function" ? value() : value;
  dims = typeof dims === "number" ? [dims] : dims;

  const createArray = (dim) => {
    if (dim >= dims.length) return v();

    const arr = [];
    for (let i = 0; i < dims[dim]; i++) {
      arr[i] = createArray(dim + 1);
    }
    return arr;
  };

  return createArray(0);
}

/**
 * Natural sort comparison function for use with `Array.sort()`.
 *
 * Sorts strings with embedded numbers in human-expected order
 * (e.g. "file2" before "file10") instead of lexicographic order.
 *
 * @param {*} as - First value
 * @param {*} bs - Second value
 * @returns {number} Sort order (-1, 0, 1)
 * @category Array Utilities
 * @example
 * ['item10', 'item2', 'item1'].sort(naturalCompare)
 * // => ['item1', 'item2', 'item10']
 */
export function naturalCompare(as, bs) {
  // Handle numbers
  if (isFinite(as) && isFinite(bs)) {
    return Math.sign(as - bs);
  }

  const a = String(as).toLowerCase();
  const b = String(bs).toLowerCase();

  if (a === b) return as > bs ? 1 : 0;

  // If no digits, simple string compare
  if (!/\d/.test(a) || !/\d/.test(b)) {
    return a > b ? 1 : -1;
  }

  // Split into chunks of digits/non-digits
  const aParts = a.match(/(\d+|\D+)/g) || [];
  const bParts = b.match(/(\d+|\D+)/g) || [];

  const len = Math.min(aParts.length, bParts.length);

  for (let i = 0; i < len; i++) {
    const aPart = aParts[i];
    const bPart = bParts[i];

    if (aPart !== bPart) {
      // Both numeric
      if (/^\d+$/.test(aPart) && /^\d+$/.test(bPart)) {
        // Handle leading zeros
        let aNum = aPart;
        let bNum = bPart;

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
}

/**
 * Run `setInterval` with a maximum number of repetitions.
 *
 * @param {Function} callback - Function to call (receives iteration index)
 * @param {number} delay - Delay between calls in ms
 * @param {number} repetitions - Maximum number of times to call
 * @returns {number} Interval ID (can be passed to clearInterval)
 * @category Timing
 * @example
 * setIntervalX(function(i) {
 *   console.log('Iteration', i);
 * }, 1000, 5); // Runs 5 times, 1 second apart
 */
export function setIntervalX(callback, delay, repetitions) {
  let count = 0;
  const intervalID = setInterval(function() {
    callback(count);

    if (++count >= repetitions) {
      clearInterval(intervalID);
    }
  }, delay);

  return intervalID;
}

/**
 * Repeat a test function until it returns truthy, or give up after max attempts.
 *
 * @param {Function} testFn - Test function that returns truthy when done
 * @param {Function} successFn - Called with test result when test passes
 * @param {Function} [failFn] - Called on each failed test attempt
 * @param {number} [delay=250] - Delay between attempts in ms
 * @param {number} [maxReps=10] - Maximum number of attempts
 * @param {Function} [lastFn] - Called when done with (success, count)
 * @returns {string|number} "err" if invalid params, otherwise interval ID
 * @category Timing
 */
export function repeatUntil(testFn, successFn, failFn, delay = 250, maxReps = 10, lastFn) {
  if (typeof testFn !== "function") return "err";

  let count = 0;

  const intervalID = setInterval(function() {
    const result = testFn();
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
}
