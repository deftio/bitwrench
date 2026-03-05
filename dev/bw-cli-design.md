# Bitwrench CLI Design Doc

> **Status:** Draft
> **Author:** Manu Chatterjee (deftio)
> **Date:** March 2026
> **Target version:** bitwrench 2.1.0

---

## Overview

The `bitwrench` CLI is a command-line tool for converting documents and generating static websites. It subsumes the functionality of [docbat](https://github.com/deftio/docbat) (document batch converter) and integrates [quikdown](https://github.com/deftio/quikdown) (markdown parser) — both authored by deftio — into the bitwrench ecosystem.

**Core capabilities:**

1. **Document conversion** — Markdown to styled HTML pages (replaces docbat)
2. **Static site generation** — Directory of mixed content (MD, HTML, JSON) to a complete website (like Hugo/Jekyll)
3. **CSS generation** — Generate theme CSS from seed colors via `bw.generateTheme()`
4. **Bitwrench injection** — Auto-embed bitwrench into generated pages (inline for offline, CDN for hosted)

**Non-goal (for now):** Live server-side rendering. That's `bwserve` / `bw.remote()` — a separate tool with a different architecture. See [Future: bwserve](#future-bwserve) at the end of this doc.

---

## CLI Name Decision

**Name:** `bitwrench`

Rationale:
- `bw` is taken by Bitwarden CLI (~12k GitHub stars, installed via npm/apt/brew/snap/choco). Using `bw` would cause confusion across every package manager and search engine.
- `bitwrench` matches the npm package name. This is the dominant pattern: `rollup`, `eslint`, `prettier`, `webpack`, `mocha` all use the package name as the CLI command.
- No conflict with library files — those are `bitwrench.umd.js`, `bitwrench.esm.js`, etc. The CLI binary is `bin/bitwrench.js`.
- The JS global namespace (`bw`) is unaffected.
- `npm install -g bitwrench` gives you both the library and the CLI. One install, two capabilities.

---

## Architecture

### Pipeline

Every operation follows the same core pipeline:

```
Input           Parse            Wrap              Render           Output
─────────────────────────────────────────────────────────────────────────────
.md file    → quikdown()      → TACO page       → bw.html()     → .html file
.html file  → (passthrough)   → TACO page       → bw.html()     → .html file
.json file  → JSON.parse()    → (already TACO)  → bw.html()     → .html file
directory   → (recurse above) → + nav + layout  → bw.html()     → directory
```

### Components

```
┌─────────────────────────────────────────────┐
│  bitwrench CLI  (bin/bitwrench.js)          │
│                                             │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐ │
│  │ quikdown │  │ bitwrench│  │ fs / path  │ │
│  │ (MD→HTML)│  │ (TACO→   │  │ (file I/O)│ │
│  │          │  │  HTML+CSS)│  │           │ │
│  └──────────┘  └──────────┘  └───────────┘ │
│                                             │
│  Arg parsing: util.parseArgs() (Node 18+)   │
└─────────────────────────────────────────────┘
```

### Dependencies

**Zero new runtime dependencies.** The CLI uses:

- **bitwrench** — Already the host package. `bw.html()`, `bw.css()`, `bw.generateTheme()`.
- **quikdown** — Zero-dependency markdown parser, same author. Vendored into `src/vendor/quikdown.js` (not a separate npm dep). This eliminates `marked` and `showdown` from the dependency tree.
- **util.parseArgs()** — Built into Node.js 18.3+. No `commander`, no `yargs`.
- **fs, path, url** — Node.js built-ins.

The bitwrench npm package remains **zero runtime dependencies** with CLI included.

### Node.js Version

Minimum: **Node.js 18** (already the CI test floor). `util.parseArgs()` requires 18.3+.

---

## CLI Interface

### Single-file conversion

```bash
# Markdown to HTML
bitwrench README.md                           # → README.html (same dir)
bitwrench README.md -o index.html             # → index.html
bitwrench README.md -o index.html --standalone # → self-contained, offline-ready

# HTML wrapping (add head, styles, bitwrench)
bitwrench page.html -o styled-page.html --css mytheme.css

# TACO JSON to HTML
bitwrench ui.json -o page.html

# CSS generation only
bitwrench --theme ocean -o ocean.css
bitwrench --theme "#336699,#cc6633" -o brand.css
```

### Site generation

```bash
# Directory to site
bitwrench build docs/ -o site/

# With options
bitwrench build docs/ -o site/ --theme forest --standalone --nav

# Dev server (build + watch + serve)
bitwrench dev docs/ --port 8080
```

### Flags

| Flag | Short | Type | Default | Description |
|------|-------|------|---------|-------------|
| `--output` | `-o` | string | derived | Output file or directory |
| `--css` | `-c` | string | (none) | External CSS file(s) to include |
| `--theme` | `-t` | string | (none) | Theme: preset name (`ocean`, `sunset`, `forest`) or hex colors (`"#336699,#cc6633"`) |
| `--standalone` | `-s` | flag | false | Embed bitwrench inline (works offline) |
| `--cdn` | | flag | false | Link to bitwrench via CDN (jsdelivr/unpkg) |
| `--no-bw` | | flag | false | Don't inject bitwrench at all (plain HTML) |
| `--title` | | string | auto | Page title (auto-detected from first `#` heading) |
| `--favicon` | `-f` | string | (none) | Favicon path or URL |
| `--nav` | | flag | false | Generate navigation from directory structure |
| `--layout` | `-l` | string | (none) | Custom layout file (_layout.js) |
| `--highlight` | | flag | true | Syntax highlighting in code blocks |
| `--watch` | `-w` | flag | false | Watch for changes and rebuild |
| `--port` | `-p` | number | 8080 | Dev server port |
| `--verbose` | `-v` | flag | false | Verbose output |
| `--version` | | flag | | Print version and exit |
| `--help` | `-h` | flag | | Print help and exit |

### Subcommands

| Command | Description |
|---------|-------------|
| `bitwrench <file>` | Convert a single file (default action) |
| `bitwrench build <dir>` | Build a static site from a directory |
| `bitwrench dev <dir>` | Build + watch + serve with live reload |
| `bitwrench theme <name-or-colors>` | Generate and print theme CSS |
| `bitwrench init [dir]` | Scaffold a new site project |
| `bitwrench version` | Print version |
| `bitwrench help` | Print help |

---

## Bitwrench Injection Modes

A key feature: generated pages can automatically include bitwrench so that TACO-based interactivity, `bw.DOM()`, themes, etc. work out of the box.

### `--standalone` (inline / binary form)

The entire bitwrench UMD bundle is embedded as an inline `<script>` in the HTML output. The page works offline with zero network requests.

```html
<!-- Generated output -->
<head>
  <script>/* bitwrench v2.x.x UMD bundle inlined here */</script>
  <style>/* generated theme CSS */</style>
</head>
```

**Use cases:** Embedded devices, air-gapped networks, USB-delivered docs, email attachments, single-file tools.

### `--cdn` (CDN link)

A `<script>` tag links to bitwrench on a CDN (jsdelivr or unpkg). Smaller file size, browser caching across pages.

```html
<head>
  <script src="https://cdn.jsdelivr.net/npm/bitwrench@2/dist/bitwrench.umd.min.js"
          integrity="sha384-..." crossorigin="anonymous"></script>
</head>
```

SRI integrity hashes are included automatically (already generated by `tools/generate-sri.js`).

**Use cases:** GitHub Pages, Netlify, any hosted site.

### `--no-bw` (no injection)

Plain HTML output with no bitwrench. The markdown is converted to HTML, wrapped in a page with optional CSS, but no JavaScript is included. This is the "just give me a styled document" mode.

**Use cases:** PDF-ready docs, static documentation where no interactivity is needed.

### Default behavior

If neither `--standalone` nor `--cdn` nor `--no-bw` is specified:
- **Single-file mode**: defaults to `--no-bw` (most users converting a README just want HTML)
- **Site build mode**: defaults to `--cdn` (sites typically need bitwrench for nav, theming)

---

## Quikdown Integration

### Why quikdown (not marked/showdown)

| | quikdown | marked | showdown |
|-|----------|--------|----------|
| Dependencies | 0 | 0 | 0 |
| Author | deftio | community | community |
| Fence plugins | Yes | No (uses marked extensions) | No (uses showdown extensions) |
| XSS protection | Default on | Opt-in | Manual |
| CSS generation | `emitStyles()` | No | No |
| Bidirectional (HTML→MD) | Yes | No | No |
| AST export | Yes | No | No |
| Maintained by us | Yes | No | No |

### Vendoring strategy

Quikdown is vendored into `src/vendor/quikdown.js` rather than added as an npm dependency:

- Keeps bitwrench at zero dependencies
- Same author — no upstream risk
- One less repo to publish/version/coordinate
- The core parser is ~650 lines / 9KB — negligible addition

The vendored file is the **full quikdown library** (not just the core parser). Quikdown includes significant fence plugin infrastructure (handling code blocks, HTML, SVG, GeoJSON, MathML), bidirectional MD↔HTML conversion with `data-qd` attributes, and AST export. These capabilities are valuable for the CLI and may be exposed in later phases.

The vendored file is the quikdown ESM build. Updated manually when quikdown has meaningful changes.

### Integration point

```javascript
// In the CLI pipeline:
import quikdown from '../src/vendor/quikdown.js';

function convertMarkdown(mdString, options) {
  return quikdown(mdString, {
    inline_styles: false,        // use class names, not inline styles
    xss_protect: true,           // default
    fence_plugins: options.highlight ? [highlightPlugin] : []
  });
}
```

The output is raw HTML, which becomes TACO content via `{ t: 'div', c: htmlString, o: { raw: true } }`.

### Syntax highlighting

No vendoring of highlight.js — it's too large. When `--highlight` is set, the CLI includes a highlight.js CDN link in the generated page (both CSS and JS). Quikdown's fence plugin system handles the integration: fenced code blocks get language-tagged `<pre><code class="language-xxx">` markup, and highlight.js picks them up at page load.

Quikdown's fence system supports much more than code highlighting — it handles HTML, SVG, GeoJSON, MathML, and custom renderers. These capabilities are available for future CLI features.

### Quikdown features exposed via CLI

| Feature | CLI exposure |
|---------|-------------|
| MD → HTML | Core pipeline (always on) |
| Fence plugins | `--highlight` flag adds highlight.js CDN link; quikdown fence system handles code block markup |
| CSS generation | `emitStyles()` used when no `--css` or `--theme` provided |
| Bidirectional | Not exposed in CLI initially (library-only feature, useful for future editing tools) |
| AST export | Future: `bitwrench ast README.md` subcommand |
| Fence types | Future: SVG, GeoJSON, MathML rendering in generated pages |

---

## Static Site Generation

### Directory conventions

```
my-site/
├── bitwrench.config.json # Site metadata (optional)
├── _layout.js            # Custom TACO layout function (optional)
├── style.css             # Custom CSS (optional)
├── index.md              # → site/index.html
├── about.md              # → site/about.html
├── getting-started.md    # → site/getting-started.html
├── images/               # → site/images/ (copied as-is)
│   └── logo.png
└── api/
    ├── index.md          # → site/api/index.html
    └── reference.md      # → site/api/reference.html
```

### `bitwrench.config.json`

```json
{
  "title": "My Project",
  "description": "A cool thing",
  "theme": "ocean",
  "favicon": "images/favicon.ico",
  "nav": true,
  "standalone": false,
  "highlight": true,
  "baseUrl": "/my-project/",
  "ignore": ["drafts/**", "*.tmp"]
}
```

All fields are optional. CLI flags override config file values.

### `_layout.js`

A JavaScript file exporting a function that wraps page content in a TACO structure:

```javascript
// _layout.js — receives content + metadata, returns a TACO page
export default function layout(content, meta) {
  return {
    t: 'html', c: [
      { t: 'head', c: [
        { t: 'title', c: meta.title },
        { t: 'meta', a: { charset: 'UTF-8' } },
        { t: 'meta', a: { name: 'viewport', content: 'width=device-width, initial-scale=1' } }
      ]},
      { t: 'body', c: [
        { t: 'nav', c: meta.nav },        // auto-generated nav if --nav
        { t: 'main', c: content },         // page content (TACO)
        { t: 'footer', c: meta.footer }
      ]}
    ]
  };
}
```

This is the Hugo/Jekyll differentiator: **your layout is plain JavaScript, not a template language.** No Liquid, no Go templates, no Handlebars. You have full access to `.map()`, ternaries, imports, and every JS feature.

If no `_layout.js` is provided, the CLI uses a sensible default layout with responsive meta tags, the chosen theme CSS, and optional nav.

### Navigation generation (`--nav`)

When `--nav` is set, the CLI scans the directory structure and generates a navigation TACO:

```javascript
// Auto-generated from directory listing
var nav = {
  t: 'nav', a: { class: 'bw-nav' },
  c: {
    t: 'ul', c: [
      { t: 'li', c: { t: 'a', a: { href: '/index.html' }, c: 'Home' } },
      { t: 'li', c: { t: 'a', a: { href: '/about.html' }, c: 'About' } },
      { t: 'li', c: [
        { t: 'a', a: { href: '/api/index.html' }, c: 'API' },
        { t: 'ul', c: [
          { t: 'li', c: { t: 'a', a: { href: '/api/reference.html' }, c: 'Reference' } }
        ]}
      ]}
    ]
  }
};
```

Page titles are derived from the first `#` heading in each file (or filename if no heading).

Nav order follows:
1. `bitwrench.config.json` `navOrder` array (if specified)
2. Alphabetical by filename (with `index` files first)

### Asset handling

Files that aren't `.md`, `.html`, or `.json` are **copied as-is** to the output directory. This includes images, fonts, PDFs, etc.

CSS files in the root (not `_`-prefixed) are included in all pages via `<link>` tags.

### Incremental builds

For `bitwrench dev` (watch mode):
- File watcher detects changes
- Only changed files are rebuilt (plus any files that depend on changed layouts/config)
- Dev server serves from the output directory
- Browser is notified via injected reload script (simple polling, no WebSocket — keeping it simple)

---

## Comparison with Hugo and Jekyll

| | bitwrench CLI | Hugo | Jekyll |
|-|---------------|------|--------|
| **Language** | JavaScript (Node.js) | Go | Ruby |
| **Template language** | Plain JavaScript (TACO) | Go templates | Liquid |
| **Markdown parser** | quikdown (vendored, zero deps) | goldmark (Go) | kramdown (Ruby) |
| **Theme system** | `bw.generateTheme()` — 3 seed colors → full CSS | Theme files + config | Theme gems |
| **Build step** | `bitwrench build docs/` | `hugo` | `jekyll build` |
| **Install** | `npm install -g bitwrench` | Binary download | `gem install jekyll` |
| **Config** | `bitwrench.config.json` | `config.toml/yaml` | `_config.yml`  |
| **Layout** | JS function returning TACO | Go template files | Liquid template files |
| **Data files** | JSON (native), JS modules | TOML, YAML, JSON | YAML, JSON, CSV |
| **Shortcodes** | TACO helper functions (`bw.makeCard()`, etc.) | Hugo shortcodes | Liquid includes |
| **Runtime interactivity** | Yes — bitwrench auto-injected | No (static only) | No (static only) |
| **Bundle size** | bitwrench is 26KB, or 0KB with `--no-bw` | 0KB (pure static) | 0KB (pure static) |
| **Server-driven UI** | Yes — pages can "wake up" with `bw.remote()` (future) | No | No |
| **Offline / embedded** | Yes — `--standalone` embeds everything | No (needs file server) | No (needs file server) |
| **Dependencies** | 0 runtime | 0 (single binary) | Ruby + gems |

### Bitwrench's advantages

1. **No template language** — layouts are JS functions. You already know the language.
2. **Data is native** — JSON feeds directly into TACO. No TOML/YAML/Liquid marshalling.
3. **Interactive output** — generated pages can include bitwrench and be interactive out of the box. Hugo/Jekyll produce dead HTML.
4. **Standalone mode** — a single HTML file with everything embedded. No server needed. Hugo/Jekyll can't do this without manual post-processing.
5. **Same tool, library to CLI** — bitwrench works in browser, Node.js, and CLI. Learn once, use everywhere. Hugo's Go templates don't work in the browser.
6. **Polyglot server bridge** — a static site generated by the CLI can later "wake up" with `bw.remote()` connections to any backend. Hugo sites can't do this.

### Where Hugo/Jekyll are ahead

1. **Build speed** — Hugo is famously fast (Go compiled binary). The bitwrench CLI runs in Node.js, which is slower. For sites with thousands of pages this matters.
2. **Ecosystem maturity** — Hugo has hundreds of themes and a large community. Bitwrench is new.
3. **Content management** — Hugo/Jekyll have mature front matter parsing, taxonomies, archetypes. Bitwrench starts simpler.
4. **Documentation** — Hugo and Jekyll have years of tutorials, guides, Stack Overflow answers.

These are facts. We don't claim bitwrench is "better" — we show what it does and let people decide.

---

## File Structure

```
bitwrench/
├── bin/
│   └── bitwrench.js           # CLI entry point (#!/usr/bin/env node)
├── src/
│   ├── cli/
│   │   ├── index.js           # Main CLI logic, arg parsing
│   │   ├── convert.js         # Single-file conversion pipeline
│   │   ├── build.js           # Directory/site build pipeline
│   │   ├── dev.js             # Watch + serve (dev mode)
│   │   ├── layout-default.js  # Default page layout (TACO)
│   │   └── inject.js          # Bitwrench injection (standalone/cdn/none)
│   ├── vendor/
│   │   └── quikdown.js        # Vendored quikdown parser
│   ├── bitwrench.js           # Main library (unchanged)
│   ├── bitwrench-styles.js    # Styles (unchanged)
│   └── ...
├── package.json               # + "bin": { "bitwrench": "./bin/bitwrench.js" }
└── ...
```

### package.json changes

```json
{
  "bin": {
    "bitwrench": "./bin/bitwrench.js"
  },
  "files": [
    "dist/",
    "bin/",
    "src/",
    "README.md",
    "LICENSE.txt"
  ]
}
```

### Build considerations

The CLI source files (`src/cli/`) are **not bundled** by Rollup into dist/. They're Node.js-only scripts that import from `src/` directly (or from `dist/` in the installed npm package). The CLI is a thin orchestration layer — the heavy lifting is done by the existing bitwrench library functions.

The `bin/bitwrench.js` entry point serves as both the CLI binary and the main orchestrator:
```javascript
#!/usr/bin/env node
import { run } from '../src/cli/index.js';
run(process.argv.slice(2));
```

The CLI is served from `bin/`, not `src/cli/`. The `src/cli/` directory contains the implementation modules; `bin/bitwrench.js` is the executable entry point that npm links into the user's PATH.

---

## Implementation Phases

### Phase 1: Single-file conversion (MVP)

**Goal:** `bitwrench README.md -o index.html` works.

1. Create `bin/bitwrench.js` entry point
2. Create `src/cli/index.js` with `util.parseArgs()`
3. Vendor quikdown into `src/vendor/quikdown.js`
4. Implement `src/cli/convert.js`:
   - Read input file
   - Detect type (.md → quikdown, .html → passthrough, .json → JSON.parse)
   - Wrap in default layout TACO
   - Render with `bw.html()`
   - Write output
5. Implement `--standalone`, `--cdn`, `--no-bw` injection modes
6. Implement `--theme` with `bw.generateTheme()`
7. Implement `--css` for external stylesheet inclusion
8. Add `"bin"` to package.json
9. Tests: unit tests for convert pipeline, integration tests for CLI invocation

**Deliverable:** A working document converter that replaces docbat.

### Phase 2: Site generation

**Goal:** `bitwrench build docs/ -o site/` works.

1. Implement `src/cli/build.js`:
   - Scan input directory recursively
   - Parse `bitwrench.config.json` if present
   - Load `_layout.js` if present (dynamic import)
   - Convert each content file through the Phase 1 pipeline
   - Copy asset files
   - Generate navigation if `--nav`
2. Implement default layout with responsive design
3. Implement `--nav` directory-based navigation generation
4. Tests: integration tests with fixture directories

**Deliverable:** A static site generator that handles mixed MD/HTML content.

### Phase 3: Dev mode

**Goal:** `bitwrench dev docs/` works.

1. Implement `src/cli/dev.js`:
   - Build site (Phase 2)
   - Start HTTP server (adapt existing `server.js`)
   - Watch for file changes (Node.js `fs.watch`)
   - Rebuild changed files
   - Inject reload script for browser notification
2. Implement `--port` flag
3. Tests: integration tests for watch/rebuild cycle

**Deliverable:** A development workflow with live reload.

### Phase 4: Polish

1. `bitwrench init` scaffolding
2. Front matter parsing (YAML/JSON at top of .md files)
3. Syntax highlighting via quikdown fence plugins
4. `bitwrench theme` subcommand for CSS generation
5. `bitwrench ast` subcommand for markdown AST export
6. Error messages and edge case handling
7. Documentation page demonstrating the CLI
8. Man page / `--help` comprehensive output

---

## Future: bwserve

`bwserve` is a separate tool/command for live server-side rendering using `bw.remote()`. It is **not part of the CLI design** described in this document but is noted here for context.

**Key differences from the CLI:**

| | bitwrench CLI | bwserve |
|-|---------------|---------|
| **Model** | Build-time (files in → files out) | Runtime (server stays running) |
| **Output** | Static HTML files | Live DOM updates via SSE/WS |
| **Server** | None after build | Required (any language) |
| **State** | None | Server-managed, pushed to clients |
| **Updates** | Rebuild on change | `bw.patch()` / `bw.update()` over the wire |
| **Comparison** | Hugo / Jekyll | Streamlit / HTMX |

The interesting bridge: a page generated by `bitwrench build` could later "wake up" when a `bw.remote()` server becomes available. The page is static by default but interactive when connected. This is a unique capability — neither Hugo nor Streamlit can do both.

This will be designed separately as part of bitwrench 2.1+.

---

## Decisions (Resolved)

1. **Front matter**: JSON front matter supported in 2.0.x. YAML front matter support deferred to 2.1 (requires a YAML parser or a lightweight one vendored).

2. **Quikdown vendoring vs. merging**: Vendored as `src/vendor/quikdown.js`. Full library (not just core parser) — includes bidirectional conversion, fence plugin infrastructure (code, HTML, SVG, GeoJSON, MathML), AST export, and CSS generation. Stays a separate module for now; merging into core (`bw.md()`) may happen in 2.2 if warranted.

3. **Syntax highlighting**: No vendoring. Use highlight.js from CDN when `--highlight` is set. Quikdown's fence plugin system handles the code block markup. Quikdown has extensive fence support (code, HTML, SVG, GeoJSON, MathML) built from significant investment.

4. **PDF output**: Separate concern, deferred to 2.1 or later. Puppeteer is ~400MB — violates zero-dep principle. May become an optional peer dependency.

5. **Config file name**: `bitwrench.config.json` — explicit, unambiguous, consistent with the ecosystem pattern (`eslint.config.json`, `prettier.config.json`, etc.).
