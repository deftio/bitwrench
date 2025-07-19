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