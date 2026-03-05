# bitwrench.js

![License](https://img.shields.io/badge/License-BSD%202--Clause-blue.svg) ![NPM version](https://img.shields.io/npm/v/bitwrench.svg?style=flat-square) ![CI](https://github.com/deftio/bitwrench/actions/workflows/ci.yml/badge.svg)

[![bitwrench](./images/bitwrench-logo-med.png)](http://www.deftio.com/bitwrench)

**bitwrench.js** is a lightweight JavaScript UI library that builds HTML from plain objects — no JSX, no virtual DOM, no build step. Define UI with the TACO format (`{t, a, c, o}` — Tag, Attributes, Content, Options), render to strings or live DOM, and ship under 45 KB gzipped with zero dependencies. Works in browsers (IE11+) and Node.js.

## Quick Example

```javascript
// Define a component as a plain object
const card = {
  t: 'div', a: { class: 'bw-card' },
  c: [
    { t: 'h3', c: 'Hello bitwrench' },
    { t: 'p',  c: 'UI as native JavaScript objects.' }
  ]
};

// Render to live DOM
bw.DOM('#app', card);

// Or render to an HTML string (server-side, emails, etc.)
const html = bw.html(card);
```

## Key Features

- **TACO format** — `{ t, a, c, o }` objects describe UI; nest them, loop them, compose them with plain JS
- **Zero dependencies** — under 45 KB gzipped, IE11+ compatible
- **Batteries-included components** — grid, buttons, cards, forms, tables, alerts, badges, tabs, navbars
- **Server & client rendering** — `bw.html()` returns strings, `bw.DOM()` mounts to the DOM
- **Dynamic CSS & theming** — `bw.css()` generates stylesheets from objects, `bw.generateTheme()` builds full themes from seed colors, dark mode toggle included
- **State management** — `bw.patch()` for targeted DOM updates, `bw.update()` for re-renders, `bw.pub()`/`bw.sub()` for app-wide messaging
- **CLI tool** — the `bitwrench` command converts Markdown, HTML, and JSON files into styled pages
- **Utilities** — color functions, random data, lorem ipsum, cookies, URL params, file I/O

## Installation

### npm

```bash
npm install bitwrench
```

```javascript
// ES module
import bw from 'bitwrench';

// CommonJS
const bw = require('bitwrench');
```

### Browser

```html
<script src="dist/bitwrench.umd.js"></script>
```

### CDN

```html
<script src="https://cdn.jsdelivr.net/npm/bitwrench/dist/bitwrench.umd.min.js"></script>
```

## Getting Started

### Browser

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <title>bitwrench app</title>
  <script src="dist/bitwrench.umd.js"></script>
</head>
<body>
  <div id="app"></div>
  <script>
    bw.loadDefaultStyles();

    bw.DOM('#app', {
      t: 'div', a: { class: 'bw-container' },
      c: [
        { t: 'h1', c: 'My App' },
        { t: 'button', a: { class: 'bw-btn bw-btn-primary' }, c: 'Click me' }
      ]
    });
  </script>
</body>
</html>
```

### Node.js

```javascript
import bw from 'bitwrench';

const page = bw.html({
  t: 'div', a: { class: 'bw-container' },
  c: [
    { t: 'h1', c: 'Server-rendered page' },
    { t: 'p',  c: 'Generated with bw.html() in Node.js.' }
  ]
});

console.log(page);
```

## Core API

| Function | Description |
|---|---|
| `bw.html(taco)` | Convert a TACO object to an HTML string |
| `bw.DOM(selector, taco)` | Mount a TACO object to a DOM element |
| `bw.css(rules)` | Generate a CSS string from a JS object |
| `bw.loadDefaultStyles()` | Inject the built-in component stylesheet |
| `bw.generateTheme(name, config)` | Generate a scoped theme from seed colors |
| `bw.patch(uuid, content)` | Update a specific element's content by UUID |
| `bw.update(el)` | Re-render an element using its `o.render` function |
| `bw.pub(topic, detail)` | Publish a message to all subscribers |
| `bw.sub(topic, handler)` | Subscribe to a topic; returns an unsubscribe function |
| `bw.makeTable(data, opts)` | Create a sortable table (returns TACO) |
| `bw.makeCard(opts)` | Create a card component (returns TACO) |
| `bw.colorInterp(x, in0, in1, colors)` | Interpolate between colors |

See the full [API Reference](./pages/08-api-reference.html) for all functions.

## Examples

| Page | Description |
|---|---|
| [Quick Start](./pages/00-quick-start.html) | First steps with TACO and `bw.DOM()` |
| [Components](./pages/01-components.html) | Buttons, cards, alerts, badges, navbars |
| [Tables & Forms](./pages/02-tables-forms.html) | Sortable tables, form inputs, validation |
| [Styling](./pages/03-styling.html) | CSS generation, inline styles, theming strategies |
| [Dashboard](./pages/04-dashboard.html) | Full-page app with grid layout and charts |
| [State & Interactivity](./pages/05-state.html) | `bw.patch()`, `bw.update()`, pub/sub |
| [Tic Tac Toe Tutorial](./pages/06-tic-tac-toe-tutorial.html) | Step-by-step game built with bitwrench |
| [Framework Comparison](./pages/07-framework-comparison.html) | bitwrench vs React, Vue, Svelte, jQuery |
| [API Reference](./pages/08-api-reference.html) | Full function listing with signatures |
| [Builds & Downloads](./pages/09-builds.html) | All dist formats, bundle sizes, SRI hashes |
| [Themes](./pages/10-themes.html) | Theme generator, presets, dark mode |

## CLI

The `bitwrench` command converts Markdown, HTML, and JSON files into styled standalone pages.

```bash
# Install globally
npm install -g bitwrench

# Convert a Markdown file to a styled HTML page
bitwrench README.md -o index.html --standalone

# Use a theme preset
bitwrench doc.md -o doc.html --standalone --theme ocean

# Custom colors (primary, secondary)
bitwrench doc.md -o doc.html --standalone --theme "#336699,#cc6633"
```

**Flags:** `--output/-o`, `--standalone/-s` (inline bitwrench), `--cdn` (CDN link), `--theme/-t`, `--css/-c`, `--title`, `--favicon/-f`, `--highlight`, `--verbose/-v`

## Development

```bash
npm install          # install dev dependencies
npm run build        # build all dist formats
npm test             # run unit tests (251 tests)
npm run test:cli     # run CLI tests (49 tests)
npm run test:e2e     # run Playwright browser tests
npm run cleanbuild   # full production build
```

## License

[BSD-2-Clause](./LICENSE.txt)

## Links

- [GitHub](https://github.com/deftio/bitwrench)
- [npm](https://www.npmjs.com/package/bitwrench)
- [Homepage](http://deftio.com/bitwrench)
