# bitwrench.js

[![License](https://img.shields.io/badge/License-BSD%202--Clause-blue.svg)](https://opensource.org/licenses/BSD-2-Clause)
[![NPM version](https://img.shields.io/npm/v/bitwrench.svg?style=flat-square)](https://www.npmjs.com/package/bitwrench)
[![CI](https://github.com/deftio/bitwrench/actions/workflows/ci.yml/badge.svg)](https://github.com/deftio/bitwrench/actions/workflows/ci.yml)

[![bitwrench](./images/bitwrench-logo-med.png)](https://deftio.github.io/bitwrench/pages/)

Bitwrench is a UI library in a single script that provides HTML generation, reactive state, CSS and theme generation, 30+ components, and a static site CLI — all from plain JavaScript objects, with zero dependencies and zero compile steps. Works in browsers (including IE11) and Node.js.

## Quick Example

```javascript
const card = {
  t: 'div', a: { class: 'bw-card' },
  c: [
    { t: 'h3', c: 'Hello bitwrench' },
    { t: 'p',  c: 'UI as native JavaScript objects.' }
  ]
};

// Mount to the DOM
bw.DOM('#app', card);

// Or render to an HTML string (Node.js, emails, static pages)
const html = bw.html(card);
```

Each object has four keys: **t** (tag), **a** (attributes), **c** (content), and optionally **o** (options for state and lifecycle). Nest them, loop them, compose them — it's just JavaScript.

## Installation

```bash
npm install bitwrench
```

```javascript
// ES module
import bw from 'bitwrench';

// CommonJS
const bw = require('bitwrench');
```

Or include directly in a page:

```html
<script src="https://cdn.jsdelivr.net/npm/bitwrench/dist/bitwrench.umd.min.js"></script>
```

## Features

- **HTML from plain objects** — describe UI as JavaScript objects, render to live DOM with `bw.DOM()` or to HTML strings with `bw.html()` for server-side rendering, emails, and static pages
- **Built-in reactivity** — `bw.update()` re-renders components when state changes, `bw.patch()` updates individual elements by ID, `bw.pub()`/`bw.sub()` provides decoupled messaging between any part of the application
- **CSS and theme generation** — `bw.css()` generates stylesheets from objects, `bw.generateTheme()` derives a complete visual theme (buttons, alerts, badges, cards, forms, tables, dark mode) from 2-3 seed colors
- **45+ ready-made components** — cards, buttons, sortable tables, form inputs, modals, dropdowns, accordions, tooltips, popovers, toasts, timelines, steppers, file uploads, stat cards — each a single function call that returns a composable object
- **Server-driven UI (bwserve)** — push TACO rendering commands from Node.js to the browser over SSE; same protocol works from C (ESP32), Python, Rust, or any language via the `bwcli serve` pipe server
- **Static site CLI** — the `bwcli` command converts Markdown, HTML, and JSON files into styled, self-contained pages with theme support
- **Utilities** — color interpolation, random data generation, lorem ipsum, cookies, URL params, file I/O for both browser and Node.js

## Getting Started

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <script src="https://cdn.jsdelivr.net/npm/bitwrench/dist/bitwrench.umd.min.js"></script>
</head>
<body>
  <div id="app"></div>
  <script>
    bw.loadDefaultStyles();

    bw.DOM('#app', {
      t: 'div', a: { class: 'bw-container' },
      c: [
        { t: 'h1', c: 'My App' },
        bw.makeCard({
          title: 'Welcome',
          content: 'Built with plain JavaScript objects.'
        }),
        bw.makeButton({ text: 'Click me', variant: 'primary' })
      ]
    });
  </script>
</body>
</html>
```

## Adding State

Wrap any TACO in `bw.component()` to get a reactive component with `.get()`, `.set()`, and template bindings:

```javascript
var counter = bw.component({
  t: 'div', c: [
    { t: 'span', c: 'Count: ${count}' },
    { t: 'button', c: '+1', a: {
      onclick: function() { counter.set('count', counter.get('count') + 1); }
    }}
  ],
  o: {
    state: { count: 0 },
    methods: {
      reset: function(comp) { comp.set('count', 0); }
    }
  }
});

bw.DOM('#app', counter);
counter.set('count', 42);   // DOM updates automatically
counter.reset();             // methods from o.methods are callable on the handle
```

For low-level control, you can also use `o.render` + `bw.update()` directly — see the [State Management guide](docs/state-management.md).

For communication between components, use pub/sub:

```javascript
bw.sub('item-added', function(detail) {
  console.log('New item:', detail.name);
});

bw.pub('item-added', { name: 'Widget' });
```

## Theming

Generate a complete theme from two seed colors. All components — buttons, alerts, badges, cards, forms, tables — are styled automatically:

```javascript
bw.generateTheme('my-theme', {
  primary: '#336699',
  secondary: '#cc6633'
});

bw.toggleTheme();  // switch between primary and alternate palettes
```

## Core API

| Function | Description |
|---|---|
| `bw.html(obj)` | Convert an object to an HTML string |
| `bw.DOM(selector, obj)` | Mount an object to a DOM element |
| `bw.component(taco)` | Wrap a TACO in a ComponentHandle with `.get()/.set()` reactive API |
| `bw.css(rules)` | Generate CSS from a JS object |
| `bw.loadDefaultStyles()` | Inject the built-in stylesheet |
| `bw.generateTheme(name, config)` | Generate a scoped theme from seed colors |
| `bw.patch(id, content)` | Update a specific element by UUID |
| `bw.update(el)` | Re-render via the element's `o.render` function |
| `bw.message(target, action, data)` | Send a message to a component by tag name |
| `bw.pub(topic, detail)` | Publish a message to subscribers |
| `bw.sub(topic, handler)` | Subscribe to a topic; returns an unsub function |
| `bw.inspect(target)` | Debug a component in the browser console |
| `bw.clientConnect(url, opts)` | Connect to a bwserve SSE endpoint |
| `bw.clientApply(msg)` | Apply a bwserve protocol message to the DOM |
| `bw.clientParse(str)` | Parse strict or r-prefix relaxed JSON |

See the full [API Reference](https://deftio.github.io/bitwrench/pages/08-api-reference.html) for all functions.

## CLI

Convert Markdown, HTML, or JSON files to styled standalone pages:

```bash
# Convert Markdown to a self-contained HTML page
bwcli README.md -o index.html --standalone

# Apply a theme preset
bwcli doc.md -o doc.html --standalone --theme ocean

# Custom colors
bwcli doc.md -o doc.html --standalone --theme "#336699,#cc6633"
```

Flags: `--output/-o`, `--standalone/-s`, `--cdn`, `--theme/-t`, `--css/-c`, `--title`, `--favicon/-f`, `--highlight`, `--verbose/-v`

### Pipe Server

`bwcli serve` turns any language into a bwserve backend — send JSON protocol messages via HTTP POST or stdin, and connected browsers update in real time:

```bash
bwcli serve --port 8080 --input-port 9000
curl -X POST http://localhost:9000 -d '{"type":"patch","target":"temp","content":"23.5 C"}'
```

## Build Formats

| Format | File | Use case |
|--------|------|----------|
| UMD | `bitwrench.umd.min.js` | Browsers and Node.js |
| ESM | `bitwrench.esm.min.js` | Modern bundlers (Vite, webpack, etc.) |
| CJS | `bitwrench.cjs.min.js` | Node.js `require()` |
| ES5 | `bitwrench.es5.min.js` | Legacy browsers (IE11) |

All formats include source maps. A separate CSS file (`bitwrench.css`) is also available for use without JavaScript.

## Documentation

**Guides** (in `docs/`):

- [TACO Format](docs/taco-format.md) — the `{t, a, c, o}` object format
- [State Management](docs/state-management.md) — three-level component model, ComponentHandle, reactive state
- [Component Library](docs/component-library.md) — all 50+ `make*()` functions with signatures and examples
- [Theming](docs/theming.md) — palette-driven theme generation, presets, design tokens
- [CLI](docs/cli.md) — the `bwcli` command for file conversion and pipe server
- [bwserve](docs/bwserve.md) — server-driven UI protocol (SSE, actions, embedded devices)
- [LLM Guide](docs/llm-bitwrench-guide.md) — compact single-file reference for AI-assisted development

**Tutorials:**

- [Build a Website](docs/tutorial-website.md) — multi-section landing page from TACO objects
- [bwserve Dashboard](docs/tutorial-bwserve.md) — Streamlit-style server-push dashboard
- [ESP32 IoT Dashboard](docs/tutorial-embedded.md) — embedded sensor dashboard with C macros

**Interactive demos** (live site):

- [Quick Start](https://deftio.github.io/bitwrench/pages/00-quick-start.html) — first steps with `bw.DOM()`
- [Components](https://deftio.github.io/bitwrench/pages/01-components.html) — buttons, cards, alerts, badges, navbars
- [Styling & Theming](https://deftio.github.io/bitwrench/pages/03-styling.html) — CSS generation and theming strategies
- [State & Interactivity](https://deftio.github.io/bitwrench/pages/05-state.html) — state patterns and ComponentHandle
- [Tic Tac Toe Tutorial](https://deftio.github.io/bitwrench/pages/06-tic-tac-toe-tutorial.html) — step-by-step game with state management
- [Framework Comparison](https://deftio.github.io/bitwrench/pages/07-framework-comparison.html) — bitwrench vs React, Vue, Svelte
- [Themes](https://deftio.github.io/bitwrench/pages/10-themes.html) — interactive theme generator with presets and CSS export

## Development

```bash
npm install          # install dev dependencies
npm run build        # build all dist formats (UMD, ESM, CJS, ES5)
npm test             # run unit tests (1000+ tests)
npm run test:cli     # run CLI tests (49 tests)
npm run test:e2e     # run Playwright browser tests
npm run lint         # run ESLint
npm run cleanbuild   # full production build with SRI hashes
```

## License

[BSD-2-Clause](./LICENSE.txt) — (c) M. A. Chatterjee / [deftio](https://github.com/deftio)
