# QA Todo -- v2.0.21+


## P1 -- COMPLETED (see qa-completed.md)

---

## P2: MCP Server -- Expose bitwrench as AI agent tools

Design doc: `dev/bitwrench-mcp-server-design.md`

`bwmcp` -- separate binary, same npm package. MCP server that lets AI agents
build and control live browser UI through bitwrench. Agent connects via MCP
(stdio), calls tools to compose TACO components, result renders live in a
browser via bwserve. Agent screenshots, inspects, iterates. Lives in `src/mcp/`,
built as separate artifact (NOT in core bundle). Port 7910 (default).

### Phase 1: Live MCP server (MVP -- first releasable milestone)

Scaffolding (all must work, but not individually shippable):
* [ ] scaffold --> Create `bin/bwmcp.js`, `src/mcp/` with server.js, tools.js, knowledge.js, live.js, transport.js
* [ ] implement --> stdio transport (newline-delimited JSON-RPC over stdin/stdout)
* [ ] implement --> JSON-RPC dispatch (initialize, tools/list, tools/call)
* [ ] implement --> Knowledge tools: bitwrench_start_here (~200 tokens funnel), bitwrench_guide (reads llm-bitwrench-guide.md, section filter), bitwrench_components (reads component-library.md, component filter), bitwrench_server_guide (reads tutorial-bwserve.md), bitwrench_themes (reads theming.md)
* [ ] implement --> Tool schemas + handlers for top-10 BCCL components (make_card, make_button, make_table, make_tabs, make_accordion, make_alert, make_nav, make_hero, make_stat_card, make_form_group)
* [ ] implement --> Core utility tools: render_taco (TACO -> HTML), build_page (standalone .html), make_styles (theme CSS)

Live rendering (the actual product):
* [ ] implement --> bwserve auto-start on bwmcp launch (port 7910 default)
* [ ] implement --> render_live tool (push TACO to browser via bwserve SSE)
* [ ] implement --> screenshot tool (capture browser via bwserve client.screenshot())
* [ ] implement --> query_dom tool (read DOM state via bwserve client.query())
* [ ] implement --> --port, --theme, --open CLI flags

Build and packaging:
* [ ] implement --> Rollup entry for bitwrench-mcp (separate from core build)
* [ ] implement --> package.json bin entry for bwmcp + exports for 'bitwrench/mcp'

Testing:
* [ ] test --> JSON-RPC protocol tests (~20 tests)
* [ ] test --> Tool execution tests (~30 tests)
* [ ] test --> Knowledge tool tests: section filtering, component filtering, fallback (~15 tests)
* [ ] test --> E2E test client: spawns bwmcp, runs full agent workflow over stdio
* [ ] test --> Playwright tests for live rendering + screenshot capture
* [ ] test --> Manual "vibe test" with Claude Code as MCP host
* [ ] doc --> README section on bwmcp setup + MCP host configuration

### Phase 2: Full BCCL coverage + composite tools

* [ ] implement --> Tool definitions for all remaining BCCL make*() functions (~35 more)
* [ ] implement --> Composite tools: build_dashboard, build_landing_page
* [ ] implement --> Data tools: make_table_array, derive_palette, text_on_color, color_interp
* [ ] implement --> Utility tools: lorem_ipsum, escape_html
* [ ] implement --> patch_live tool (surgical DOM updates), clear_live tool (reset browser)
* [ ] test --> Tests for all new tools (~50 tests)

### Phase 3: Streamable HTTP + polish

* [ ] implement --> HTTP transport for remote bwmcp (`bwmcp --http --port 8900`)
* [ ] implement --> Authentication (bearer token via --token flag)
* [ ] implement --> MCP resources (theme presets, component catalog)
* [ ] implement --> MCP prompts (pre-built UI pattern templates)
* [ ] implement --> Multi-client session management
* [ ] test --> HTTP transport tests

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

* [x] fix --> Consolidate page init boilerplate -- `initBitwrenchPage()` in shared-nav.js (v2.0.21)
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

## P1: Client-Side Router -- DONE (v2.0.21)

Implemented in `src/bitwrench-router.js`. 50 tests. Docs at `docs/routing.md`.
API: `bw.router(config)`, `bw.navigate(path)`, `bw.link(path, content)`.
Hash + History modes, :param + wildcard matching, before/after guards, pub/sub.

* [x] implement --> Route matching, hash mode, history mode, guards, bw.link()
* [x] test --> 50 tests (matching, hash, history, guards, pub/sub, edge cases)
* [x] doc --> docs/routing.md + updated LLM guide, framework table, tutorials
* [x] example --> Update pages/15-multi-page-site.html to use bw.router() (v2.0.21, Section 7)
* [ ] example --> `examples/dashboard-spa/` using router + shared state

---

## P4.5: Documentation and Examples (from external feedback)

Sources: `.feedback/bitwrench-feedback-v2.0.19-billy.md`, worklog-app developer feedback (v2.0.21)

Key insight: bitwrench doesn't need more primitives -- it needs clearer, shared
ways to use the ones it already has. These are all docs/examples, not code.

**Lesson from worklog feedback (Mar 2026):** A developer read the docs, built a
todo app, studied the LLM guide -- and still didn't know o.handle/o.slots exists.
Their #1 complaint (full-subtree replacement kills input focus) is solved by
handles, but they never found it. Documentation structure, not missing features,
is the main barrier to adoption for form-heavy apps.

### Handle/Slots Documentation Prominence -- DONE (v2.0.21)

* [x] doc --> Added o.handle/o.slots callout + rule 11 in LLM guide
* [x] doc --> Added "Level 1.5: Component Handles" section to docs/state-management.md
* [x] doc --> Added handle/slots subsection to docs/thinking-in-bitwrench.md section 6
* [x] doc --> Added Step 7b (handle-based form validation) to tutorial-website.md
* [x] doc --> Added "Component Handles" section to docs/component-library.md
* [ ] make --> `examples/worklog/` -- form-heavy app (editable table, date pickers, textarea, shared state) demonstrating handle pattern for input preservation. Directly addresses "bitwrench can't do forms" misconception.

### TypeScript Declarations -- DONE (v2.0.21)

* [x] implement --> Created `dist/bitwrench.d.ts` (~530 lines): Taco, TacoOptions, StyleConfig, Palette, ShadeSet, Styles, RouterConfig, RouterInstance, Bw interface (~100 methods), all 47 BCCL named exports
* [x] implement --> Added `"dist/*.d.ts"` to package.json files array
* [x] test --> Validated with tsc --noEmit --strict -- all checks pass

### Documentation Discoverability (from dogfooding report, Mar 2026)

Second round of feedback confirmed: the #1 adoption barrier is not missing
features -- developers (human and LLM) can't find features that already exist.
Specific failures: didn't know makeTable is sortable, didn't know makeTextarea
exists, reinvented makeFormGroup, didn't find o.handle/o.slots (now fixed).

* [ ] doc --> **Component Cheat Sheet** (HIGHEST PRIORITY): single scannable table of ALL make*() with key props AND capabilities (sortable, handles, auto-dismiss, etc.). Embed in LLM guide AND as standalone `docs/component-cheatsheet.md`. This one artifact would have prevented 3 of 4 documented mistakes.
* [ ] doc --> **API reference shows capabilities, not just names**: makeTable entry must say "sortable, pagination"; makeModal must say "ESC dismiss, open/close handles"; makeToast must say "auto-dismiss timer". Current API ref lists names only.
* [ ] doc --> **Component library doc TOC**: Add anchor-linked table of contents at top of component-library.md so truncated views (LLM tooling, GitHub preview) still expose the full list of sections.
* [ ] doc --> **bw.uuid() return format**: Document exact format (`bw_<prefix>_<hex>` or `bw_<hex>` without prefix). Matters for bw.patch() targeting.
* [ ] doc --> **bw.raw() XSS warning**: Add prominent security note about XSS when using bw.raw() with user-supplied content. Consider `bw.sanitize()` utility.
* [ ] doc --> **bw.sub(topic, handler, el) auto-unsubscribe**: Already implemented but undocumented in main docs. Developer built manual cleanup because they didn't know about the el parameter.
* [ ] doc --> **makeCard title accepts TACO**: Verify and document whether makeCard title prop supports TACO objects (not just strings). Cards with badges/buttons in headers are common.
* [ ] doc --> **Store pattern for shared state**: Document canonical pattern for multi-view shared state with scoped re-rendering (pub/sub + element-scoped subscriptions).

### Interactive Component Gallery

* [ ] make --> `pages/component-playground.html` -- live gallery where each make*() renders with editable props (like Storybook). Use bw.makeTryIt() for code editing + live preview.
* [ ] improve --> `pages/08-api-reference.html` -- add inline rendered examples for top 20 functions

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
* [x] implement --> `bw.make(type, props)` factory dispatcher -- DONE (v2.0.19, uses BCCL registry)
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

### BCCL Data-Entry Components (from worklog feedback)
* [ ] implement --> `bw.makeEditableTable({columns, data, onCellChange})` -- inline-edit cells with handle-based focus preservation
* [ ] implement --> `bw.makeDatePicker(config)` -- date input with calendar dropdown
* [ ] implement --> `bw.makeTimeRange(config)` -- start/end time selector
* [ ] consider --> Sortable + filterable table combo (extend makeDataTable or new component)

### Docs / DX
* [ ] improve --> API reference: fix JSDoc (@example, @category), use `comment-parser` devDep, improve CSS/layout (cards, search)
* [ ] make --> `examples/llm-chat-advance` (deferred to separate repo -- requires markdown rendering + image display)
* [ ] implement --> `bw.makePage()` SEO metadata param -- add support for keywords, description, og:tags, search tags. Make SEO-friendly pages easy out of the box.
* [ ] improve --> `pages/10-themes.html` -- restructure: lead with presets, compact color explanation, bridge CSS/Tailwind -> JS-driven CSS. Level 0 section is too thin.
