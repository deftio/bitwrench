# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Bitwrench.js is a lightweight JavaScript UI utility library designed for rapid prototyping with minimal dependencies. It generates HTML from JavaScript/JSON objects and includes utilities for color manipulation, random data generation, and more. The library maintains backward compatibility with legacy browsers (IE7+) while supporting modern module formats.

## Essential Commands

### Building
- `npm run build` - Build all distribution formats (UMD, ESM, CJS, ES5) using Rollup
- `npm run cleanbuild` - Clean build with README updates and SRI hash generation
- `npm run build_1_x` - Build legacy v1.x compatibility version

### Testing
- `npm run test` - Run Mocha tests with nyc coverage (80% threshold required)
- `npm run testkarma` - Run browser tests via Karma

### Linting
- `npm run lint` - Run ESLint on bitwrench.js

### Other Important Commands
- `npm run generate-sri` - Generate Subresource Integrity hashes for security
- `npm run clean` - Remove build artifacts

## Architecture & Key Components

### Source Structure
- `/src/bitwrench.js` - Main v2.x source (modern, modular design)
- `/src_1x/bitwrench_1x.js` - Legacy v1.x source (monolithic, backward compatibility)
- `/dist/` - All distribution formats with source maps
- `/examples/` - 12 example HTML files demonstrating library usage
- `/test/` - Test suites for Node.js and browser environments
- `/tools/` - Build utilities and scripts

### Build System
The project uses Rollup to generate multiple distribution formats from a single source:
- UMD (Universal Module Definition) - Works in browsers and Node.js
- ESM (ES Modules) - For modern JavaScript environments
- CJS (CommonJS) - For Node.js require()
- ES5 builds - For legacy browser support (IE8+)

Each format has both minified and non-minified versions with source maps.

### Core Library Features
1. **HTML Generation**: `bw.html()` creates DOM elements from JSON structures
2. **DOM Manipulation**: `bw.DOM()` selects and modifies elements via CSS selectors
3. **Color Functions**: RGB/HSL conversions and interpolation
4. **Random Data**: `bw.random()` generates random values and arrays
5. **File I/O**: Save/load files in browser and Node.js
6. **URL Parameters**: Parse and generate query strings
7. **Logging System**: Timestamped logging with formatting options
8. **Cookie Handling**: Browser cookie manipulation
9. **Lorem Ipsum**: Placeholder text generation
10. **Table Generation**: Dynamic tables with sorting capabilities

### Testing Strategy
- Mocha + Chai for unit tests
- Karma for browser testing
- jsdom for DOM simulation in Node.js tests
- Coverage requirements: 80% minimum for all metrics
- Tests located in `/test/bitwrench_test.js` and `/test/karma-test.js`

### Version Management
- Currently on v2.0.0 (major refactor from v1.x)
- Dual version support: v2.x is modern/modular, v1.x maintained for backward compatibility
- Active branch: `v2`, main branch: `master`
- SRI hashes generated for security

### Development Workflow
1. Edit source in `/src/bitwrench.js`
2. Run `npm run build` to generate distributions
3. Test with `npm run test` and `npm run testkarma`
4. Ensure `npm run lint` passes
5. Use `npm run cleanbuild` for production builds

### Important Notes
- The library is self-contained with no runtime dependencies
- Designed to work in constrained environments (embedded systems, legacy browsers)
- CSS can be generated from JavaScript or included separately
- Global namespace: `bw` (configurable in UMD builds)
- All builds include the core CSS generation functionality

## Bitwrench v2 Architecture

### Philosophy
Bitwrench v2 is a counter-thesis to modern JavaScript frameworks. Instead of JSX and virtual DOMs, it uses pure JavaScript objects (TACO format) to represent UI. This approach:
- Eliminates build steps and transpilation
- Works directly with native DOM APIs
- Provides full control over HTML generation
- Supports both server-side rendering and client-side updates

### TACO Format (Tag-Attributes-Content-Options)
```javascript
{
  t: "div",                    // tag name
  a: { class: "card" },       // attributes
  c: "Hello World",           // content (string, array, or nested TACOs)
  o: {                        // options
    mounted: (el) => {},      // lifecycle hook
    unmount: (el) => {},      // cleanup hook
    state: {}                 // component state
  }
}
```

### Core v2 Functions

#### HTML Generation
- `bw.html(taco, options)` - Convert TACO to HTML string
- `bw.createDOM(taco, options)` - Create DOM element from TACO
- `bw.DOM(selector, taco, options)` - Mount TACO to DOM

#### CSS Generation
- `bw.css(rules, options)` - Generate CSS from JS objects
- `bw.injectCSS(css, options)` - Inject CSS into document
- `bw.loadDefaultStyles()` - Load Bootstrap-like defaults

#### Utilities
- `bw.typeOf(x)` - Enhanced type detection
- `bw.uuid()` - Generate unique IDs
- `bw.escapeHTML(str)` - Escape HTML special chars
- `bw.mapScale(x, in0, in1, out0, out1)` - Map value between ranges
- `bw.clip(value, min, max)` - Clamp value
- `bw.$(selector)` - DOM selection (always returns array)
- `bw.cleanup(element)` - Clean up lifecycle hooks

### Legacy v1 Functions Retained in v2

#### Array Utilities
- `bw.arrayUniq(arr)` - Get unique elements
- `bw.arrayBinA(a, b)` - Intersection of two arrays
- `bw.arrayBNotInA(a, b)` - Elements in b not in a

#### Color Functions
- `bw.colorParse(str)` - Parse CSS color to [r,g,b,a,"rgb/hsl"]
- `bw.colorInterp(x, in0, in1, colors)` - Interpolate between colors
- `bw.colorHslToRgb(h, s, l, a)` - Convert HSL to RGB
- `bw.colorRgbToHsl(r, g, b, a)` - Convert RGB to HSL

#### Data Generation
- `bw.loremIpsum(numChars)` - Generate Lorem Ipsum text
- `bw.multiArray(value, dims)` - Create multidimensional arrays

#### HTML Generation
- `bw.htmlTable(data, opts)` - Create HTML table from array
- `bw.htmlTabs(tabData, opts)` - Create tab interface

#### Browser Utilities
- `bw.setCookie(name, value, days, options)` - Set cookie with options
- `bw.getCookie(name, default)` - Get cookie value
- `bw.getURLParam(key, default)` - Get URL parameter

#### Timing Utilities
- `bw.setIntervalX(fn, delay, count)` - Run interval N times
- `bw.repeatUntil(test, success, fail, delay, max)` - Retry until condition

#### Other Utilities
- `bw.choice(x, choices, default)` - Dictionary as switch
- `bw.naturalCompare(a, b)` - Natural sort comparison

### v2 Development Files
- `/src/bitwrench_v2.js` - Main v2 implementation
- `/src/bitwrench-styles.js` - Default Bootstrap-inspired styles
- `/examples_v2/` - v2 specific examples
- `/dev/bitwrench_v2_design.md` - v2 design philosophy
- `/dev/bitwrench_v2_components.md` - Component examples
- `/dev/bitwrench_v2_examples.md` - Full page examples

## Critical Development Rules

### NO Direct DOM Manipulation
**NEVER use `document.getElementById()`, `document.querySelector()`, or any direct DOM manipulation in Bitwrench examples.**
- Use `bw.DOM()` for mounting components
- Use TACO objects and reactive patterns for state management
- If you need DOM access, use `bw.$()` which returns arrays
- Re-render components by calling render functions, not by manipulating DOM directly
- If Bitwrench cannot accomplish something without direct DOM access, raise it as a fundamental issue

Example of WRONG approach:
```javascript
// WRONG - Direct DOM manipulation
const container = document.getElementById('my-container');
container.innerHTML = '<div>Content</div>';
```

Example of CORRECT approach:
```javascript
// CORRECT - Bitwrench reactive pattern
function render() {
  const content = { t: 'div', c: 'Content' };
  bw.DOM('#my-container', content);
}
render();
```