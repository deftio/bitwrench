# QA Todo -- v2.0.19+


## P1 -- COMPLETED (see qa-completed.md)

---

## P2.5: Bundle Size Management

Current sizes (v2.0.19):
- **bitwrench.umd.min.js** (full): **~38KB gzipped** -- under 45KB budget
- Savings from ComponentHandle removal: ~5KB
- **~7KB headroom** -- comfortable margin

Source breakdown: core ~3400 LOC, styles ~2190 LOC, BCCL ~3600 LOC, color ~460 LOC.

### If we approach 45KB limit

* [ ] analyze --> identify CSS generation bloat in bitwrench-styles.js (largest growth risk)
* [ ] consider --> tree-shakeable ESM build where unused make*() functions are eliminated

---

## P3: Design system polish (ongoing)

* [ ] tune --> alternate derivation curves with all 12 preset themes
* [ ] tune --> per-component dark appearance depends on alternate palette quality
* [ ] audit --> visual quality: do all components look beautiful with default palette?
* [ ] audit --> theme consistency: do all 12 preset themes look good with all components?

---

## P3.7: shared-theme.js migration -- Phase 1 DONE

Phase 1 complete: two-phase injection, duplicate CSS removed, source order fixed.
See `dev/qa-completed.md` for details.

### Remaining (Phase 2+)

* [ ] fix --> Consolidate page init boilerplate (loadStyles + applySiteStyles + mountExampleNav) into a single shared function in shared-nav.js or shared-theme.js so new pages cannot forget a step
* [ ] implement --> Code block color tokens in theme palette (for code editor theming)
* [ ] implement --> Font family in layout config (mono font stack)
* [ ] move --> Grid utilities from shared-theme.js to structural CSS (reusable by all users)
* [ ] move --> Callout styles from shared-theme.js to structural CSS or themed layer
* [ ] migrate --> Replace hardcoded `:root` CSS vars with palette-derived tokens from bw.makeStyles()
* [ ] migrate --> Convert hand-written component CSS to use design tokens

---

## P3.6: UUID Addressing -- Docs (open)

* [ ] doc --> Update State Management docs with "Level 0.5" embedded dashboard pattern
* [ ] doc --> Add "Embedded Dashboard Golden Path" recipe

---

## P5: bwserve Screenshot -- Phase 2 & 3

Design doc: `dev/bw-screenshot-design.md`

### Phase 2: Demos and playground

* [ ] make --> `examples/client-server/screenshot-demo/` -- dashboard screenshot to disk
* [ ] make --> Add Screenshot button to `pages/bwserve-sandbox.html`
  - Displays returned image inline, shows metadata (dimensions, format, size)
* [ ] make --> `examples/client-server/llm-screenshot/` -- LLM visual feedback loop
  - Generate TACO -> render -> screenshot -> vision model evaluates -> refine
  - Uses Ollama (local, free) with llava or similar vision model

### Phase 3: Polish

* [ ] implement --> Rate limiting (default 1/sec per client, configurable)
* [ ] implement --> Visual indicator option (brief border flash, off by default)
* [ ] implement --> `client.inspect(selector)` -- layout metadata without pixels
  - Returns { width, height, scrollHeight, childCount, computedStyles }
  - Same call + POST-back protocol, much cheaper than screenshot
* [ ] test --> Playwright integration tests (real rendering, image validation)
* [ ] doc --> Screenshot section in `docs/bwserve.md`

---

## P6: bitwrench-chart -- Separate SVG Charting Library

Design doc: `dev/bw-chart-design.md`

**Separate package** (`bitwrench-chart` on npm). SVG-based, TACO-native, zero
runtime deps. No bundle size limit. Charts return `{t:'svg', ...}` TACO objects --
serializable, patchable via bwserve, themeable via palette.

### Phase 1: Core + MVP charts

* [ ] setup --> Create repo/package structure, build config, test harness
* [ ] implement --> Scale functions (linear, band, time) -- pure functions, ~50 lines each
* [ ] implement --> Axis generation (ticks, labels, gridlines) -- ~150 lines
* [ ] implement --> `barChart(config)` -- vertical bars with axes, labels, palette
* [ ] implement --> `lineChart(config)` -- straight segments, area fill, multi-series
* [ ] implement --> `sparkline(config)` -- inline mini chart, no axes, for table cells
* [ ] implement --> `pieChart(config)` -- pie + donut variants, center label
* [ ] implement --> Responsive wrapper (viewBox-based, width:100%)
* [ ] implement --> Default categorical palette (8 colors, colorblind-safe)
* [ ] implement --> Accessibility (<title>, <desc>, role="img") on all charts
* [ ] test --> Unit tests for scales, axes, all 4 chart types (~100 tests)
* [ ] doc --> README with examples, API reference

### Phase 2: More chart types + integration

* [ ] implement --> `gauge(config)` -- semi-circle/full with needle, threshold zones
* [ ] implement --> `scatterChart(config)` -- dots, optional bubble sizing, regression line
* [ ] implement --> `heatmap(config)` -- 2D grid, sequential/diverging color scales
* [ ] implement --> `radarChart(config)` -- N-axis polygon, multi-series overlay
* [ ] implement --> `arrayImage(config)` -- 2D array -> SVG rects or data-URL image (from bw 1.x)
* [ ] implement --> bitwrench theme adapter (`fromTheme(palette)` -> color array)
* [ ] implement --> Legend component
* [ ] implement --> Tooltip component (hover)
* [ ] implement --> Animation CSS (opt-in, CSS transitions/keyframes)
* [ ] test --> Tests for Phase 2 chart types (~100 tests)

### Phase 3: Advanced charts + polish

* [ ] implement --> `treemap(config)` -- squarified layout, nested rectangles
* [ ] implement --> `chord(config)` -- circular flow diagram, matrix input
* [ ] implement --> Bar variants (horizontal, stacked, grouped)
* [ ] implement --> Line curves (monotone cubic interpolation)
* [ ] implement --> Pattern fills (stripes, dots) for colorblind accessibility
* [ ] implement --> Keyboard navigation for interactive charts
* [ ] doc --> Full documentation site
* [ ] release --> v1.0.0

---

## P1: Client-Side Router

Design doc: `dev/bitwrench-router-design.md` (DRAFT -- awaiting sign-off)

~100-120 lines in core. Hash + History API modes. Pure function: URL -> TACO.
Integrates with pub/sub (`bw:route` events). Complements bwserve `app.page()`.
Zero deps. Makes bitwrench a complete app framework.

* [ ] decide --> Sign off on router design doc (API shape, naming, scope)
* [ ] implement --> Route matching (static, :param, wildcard, query string parsing)
* [ ] implement --> Hash mode (hashchange listener, bw.navigate, back/forward)
* [ ] implement --> History mode (pushState, popstate, base path)
* [ ] implement --> before/after guards, pub/sub integration
* [ ] implement --> bw.link() convenience helper (optional -- pending decision)
* [ ] test --> ~46 tests (matching, hash, history, guards, pub/sub, edge cases)
* [ ] doc --> Router section in docs/state-management.md or new docs/routing.md
* [ ] example --> Update pages/15-multi-page-site.html to use bw.router()

---

## P4.5: Documentation and Examples (from external feedback)

Source: `.feedback/bitwrench-feedback-v2.0.19-billy.md`

Key insight: bitwrench doesn't need more primitives -- it needs clearer, shared
ways to use the ones it already has. These are all docs/examples, not code.

### App Structure Patterns Guide

* [ ] doc --> Create `docs/app-patterns.md` -- canonical project layouts for:
  - Dashboard (single page, state + pub/sub, embedded UI)
  - Multi-page SPA (client router, shared nav/footer)
  - bwserve app (server-driven, SSE, server-side state)
  - Embedded/IoT UI (static shell + JSON updates)
  - Static site (bwcli convert, markdown -> HTML)
* [ ] doc --> Each pattern: directory structure, entry point, state flow, example

### State / Store Canonical Pattern

* [ ] doc --> Create `docs/patterns-state.md` (or section in state-management.md):
  - "The bitwrench way" for shared state: plain object + pub/sub topic
  - Canonical store pattern (not an API, just a documented convention)
  - Derived state = just a function
  - When to use o.state vs pub/sub vs store pattern
  - Example: user store shared across nav + profile + settings

### Async / Data Fetching Recipes

* [ ] doc --> Create `docs/patterns-async.md`:
  - fetch + loading state + error handling pattern
  - AbortController + pub/sub for cancellation
  - Retry pattern with bw.repeatUntil()
  - Polling pattern (bw.setIntervalX + render)
  - bwserve: server pushes data, no client fetch needed

### Theming Discoverability

* [ ] doc --> Improve `docs/theming.md` positioning -- make loadStyles/makeStyles
  front and center, show preset themes, show CSS var consumption
* [ ] doc --> Add "Theming Quick Start" to top of docs/theming.md:
  1-line theme, preset themes, custom palette, toggle dark mode
* [ ] improve --> `pages/10-themes.html` -- restructure: lead with presets,
  compact color explanation, bridge CSS/Tailwind -> JS-driven CSS

### Working Examples

* [ ] make --> `examples/dashboard-spa/` -- full SPA with router, shared state,
  multiple views, pub/sub between components. Demonstrates app-patterns.md.
* [ ] make --> `examples/embedded-iot/` -- minimal ESP32-style UI: static shell,
  JSON polling updates, compact bundle. Demonstrates embedded pattern.
* [ ] improve --> `examples/landing-page/` -- add deep-link sections, show
  bw.link() or hash navigation for scroll-to-section

---

## Deferred / Future

### Core
* [ ] implement --> `bw.make(type, props)` factory dispatcher -- thin delegation to `bw.makeCard`, `bw.makeButton`, etc. Enables data-driven component creation. Audit which make*() functions earn their keep.
* [ ] implement --> `bw.morph(target, newTaco)` -- update DOM in-place, preserving state of unchanged subtrees
* [ ] implement --> Component structural/cosmetic CSS split -- separate structural styles (layout, display) from cosmetic (colors, shadows) in `bitwrench-styles.js`. Base CSS structural-only; `makeStyles()` handles cosmetic layer.

### bwserve
* [ ] implement --> Declarative events (`o.events`) in `bw.createDOM()` -- sendValue, debounce, throttle, sendForm
* [ ] implement --> DOM morphing for `replace` -- preserve local state (scroll pos, expanded accordions)
* [ ] implement --> Form data serialization in actions (sendForm: '#my-form')
* [ ] implement --> WebSocket transport option
* [ ] decide --> Optimistic updates: client-side immediate response while waiting for server
* [ ] decide --> Event batching: multiple actions in same frame -> single POST

### CLI
* [ ] implement --> `bwcli serve` file watching and live reload
* [ ] implement --> `bwcli build` -- static site generation from directory of .md/.html files
* [ ] implement --> `bwcli init` -- scaffold a new bitwrench project

### Docs / DX
* [ ] improve --> API reference: fix JSDoc (@example, @category), use `comment-parser` devDep, improve CSS/layout (cards, search)
* [ ] make --> `examples/llm-chat-advance` (deferred to separate repo -- requires markdown rendering + image display)
* [ ] implement --> `bw.makePage()` SEO metadata param -- add support for keywords, description, og:tags, search tags. Make SEO-friendly pages easy out of the box.
* [ ] improve --> `pages/10-themes.html` -- restructure: lead with presets, compact color explanation, bridge CSS/Tailwind -> JS-driven CSS. Level 0 section is too thin.
