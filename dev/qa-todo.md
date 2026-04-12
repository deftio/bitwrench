# QA Todo -- v2.0.21+


## P0: Purge ALL data-* Attributes from Codebase and Docs

Design doc: **`dev/data-attrib-removal.md`** -- full refactor spec with rationale,
before/after code, file-by-file audit, replacement patterns, and testing checklist.
Read that doc first. This section is the task checklist.

**Summary:** 179 occurrences of `data-bw-action`/`data-bw-id` across 39 files.
Core bitwrench is already clean (v2.0.19). The root cause is 7 lines in
`bwclient.js` -- fix that, then cascade through examples/pages/docs/tools.

### Phase 1: bwserve wire protocol (BREAKING -- source code)

* [ ] refactor --> `src/bwserve/bwclient.js`: ID-based event forwarding (see design doc "Core Change" section)
* [ ] refactor --> `src/mcp/knowledge.js`: update documentation string (~line 127)
* [ ] test --> Update `test/bitwrench_test_bwserve.js` for new event model
* [ ] test --> `npm run test` -- all pass

### Phase 2: Examples

* [ ] refactor --> `examples/client-server/server.js` (4), `screenshot-server.js` (2), `README.md` (2)
* [ ] refactor --> `examples/llm-chat/server.js` (1)
* [ ] refactor --> `examples/embedded-rpi/server.js` (2)
* [ ] refactor --> `examples/live-feed/index.html` -- `data-type`/`data-id` => DOM properties (~4)
* [ ] refactor --> `examples/ember-and-oak/index.html` -- `data-testid` => IDs or classes (~30)

### Phase 3: Pages

* [ ] refactor --> `pages/12-bwserve-protocol.html` (~9)
* [ ] refactor --> `pages/14-bwserve-sandbox.html` -- `data-bw-action` + `data-preset` (~11)
* [ ] refactor --> `pages/state-debug.html` -- `data-tab`/`data-card-name`/`data-testid`/`data-tip` (~12)
* [ ] refactor --> `pages/component-gallery.html` -- `data-theme` (1)
* [ ] refactor --> `pages/08-api-reference.html` -- `data-api-name` (2)

### Phase 4: Tools

* [ ] refactor --> `tools/component-tester.mjs` -- `data-bw-action` (4)
* [ ] refactor --> `tools/screenshot.cjs` -- `data-theme` (2)
* [ ] refactor --> `tools/build-api-reference.js` -- `data-api-name`/`data-category` (4)
* [ ] refactor --> `tools/analyze-bccl.js` -- remove `data-bs-toggle` allowlist entry (1)

### Phase 5: Docs

* [ ] doc --> `docs/bwserve.md` (~12), `docs/tutorial-bwserve.md` (~4)
* [ ] doc --> `docs/app-patterns.md` (2), `docs/taco-format.md` (1)
* [ ] doc --> `docs/thinking-in-bitwrench.md` (~3), `docs/llm-bitwrench-guide.md` (2)
* [ ] doc --> `docs/bitwrench_typescript_usage.md` (1)
* [ ] doc --> `docs/bitwrench-for-wasm.md` -- verify clean
* [ ] doc --> `dev/bw-client-server.md` (17), `dev/2.0.26-release-planning.md` (2)
* [ ] doc --> `dev/bw2x-state-and-addressing.md` (3), `dev/bitwrench-mcp-server-design.md` (2)
* [ ] doc --> `embedded_c/bitwrench.h` (2), `embedded_c/README.md` (2)

### Phase 6: Compliance + tests

* [ ] audit --> zero `data-bw` hits in src/ pages/ examples/ docs/ tools/ test/ embedded_c/
* [ ] audit --> zero `getAttribute.*data-` / `dataset\.` hits outside vendor/
* [ ] test --> `npm run test`, `npm run lint`, `npx playwright test` -- all pass
* [ ] test --> Manual smoke: bwserve examples, pages (08, 12, 14, state-debug, gallery)

### Exemptions (NO ACTION)

- `src/vendor/quikdown.js`, `src/vendor/html2canvas.min.js` -- third-party
- `dev/archive/*` -- dead historical docs, do not rewrite
- `dist/`, `releases/` -- auto-rebuilt from source
- English prose ("data-driven", "data-oriented") -- not attributes

---

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
- **bitwrench.umd.min.js** (full): **~40KB gzipped** -- under 45KB budget
- Savings from ComponentHandle removal: ~5KB
- **~7KB headroom** -- comfortable margin

Source breakdown: core ~3400 LOC, styles ~2190 LOC, BCCL ~3600 LOC, color ~460 LOC.

### If we approach 45KB limit

* [ ] analyze --> identify CSS generation bloat in bitwrench-styles.js (largest growth risk)
* [ ] consider --> tree-shakeable ESM build where unused make*() functions are eliminated

---

## P2.7: Lifecycle and Composition (v2.0.26)

Design doc: `dev/2.0.26-release-planning.md`
Source: `dev/bitwrench-component-lifecycle.md`, `dev/bitwrench_agui_a2ui_feedback.md`

### Must-have (paradigm correctness)

* [x] fix --> Slot target caching bug: cache querySelector result at creation time, not re-query every setter call
* [x] implement --> o.type wiring: `if (opts.type) el._bw_type = opts.type` in createDOM
* [x] implement --> Error boundaries: try/catch around o.mounted/o.render/o.unmount callbacks (match bw.pub pattern)
* [x] implement --> bw.inspect(target, depth) in bitwrench.js core: recursive walk returning plain object with bitwrench metadata
* [x] implement --> Enhanced _bw_tree in bwclient.js: thin wrapper around bw.inspect()
* [ ] implement --> client.inspect() convenience method on BwServeClient

### Should-have (unlocks)

* [x] implement --> SVG namespace support in createDOM (createElementNS for SVG/MathML context)
* [ ] implement --> Scoped theme toggle: bw.toggleStyles(scopeEl) for container-scoped palette switching

### Small wins (from AG-UI/A2UI feedback)

* [x] implement --> bw.once(topic, handler) -- one-shot subscription
* [ ] implement --> Wildcard subscriptions: bw.sub('topic:*', handler) -- trailing * glob, ~10 lines
* [x] implement --> bw.catalog() -- expose BCCL component registry (types + factory names)
* [x] implement --> bw.formData(el) -- extract form data as plain object
* [ ] implement --> bw.jsonPatch(obj, patches) -- RFC 6902 JSON Patch, ~40 lines

### Documentation

* [ ] doc --> Composition patterns tutorial (extract from lifecycle doc to standalone or 05-state.html)
* [ ] doc --> Component testing recipe (jsdom + bw.mount + handle methods + cleanup)
* [ ] doc --> "o.render is the heavy path" guidance in API reference

---

## P3: Design system polish (ongoing)

* [ ] tune --> alternate derivation curves with all 12 preset themes
* [ ] tune --> per-component dark appearance depends on alternate palette quality
* [ ] audit --> visual quality: do all components look beautiful with default palette?
* [ ] audit --> theme consistency: do all 12 preset themes look good with all components?

---

## P3.7: shared-theme.js migration -- COMPLETED (v2.0.25)

Full migration complete. shared-theme.js/css replaced with palette-driven site.js.
All pages migrated to BCCL flat-class pattern. See `dev/qa-completed.md` for details.

### Remaining polish

* [ ] implement --> Code block color tokens in theme palette (for code editor theming)
* [ ] implement --> Font family in layout config (mono font stack)

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

See `dev/qa-completed.md` for details.

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

* [x] doc --> **Component Cheat Sheet** (v2.0.21): `docs/component-cheatsheet.md` -- 47-row table with key props, capabilities, handles/slots. Embedded compact version (top 20) in LLM guide Step 6.
* [x] doc --> **API reference shows capabilities, not just names** (v2.0.21): makeTable, makeModal, makeToast, makeAccordion, makeTabs, makeCarousel entries now list handle methods and capabilities inline.
* [x] doc --> **Component library doc TOC** (v2.0.21): Quick Reference category table at top of component-library.md with anchor links. Capability badges on 6 key component headings.
* [x] doc --> **bw.uuid() return format** (v2.0.21): Documented in bitwrench_api.md -- `bw_<prefix>_<hex>` format, safe for CSS class and bw.patch() target.
* [x] doc --> **bw.raw() XSS warning** (v2.0.21): Added WARNING block to bitwrench_api.md entry.
* [x] doc --> **bw.sub(topic, handler, el) auto-unsubscribe** (v2.0.21): Documented el parameter with usage example in bitwrench_api.md.
* [x] doc --> **makeCard title accepts TACO** (v2.0.21): Verified -- title, subtitle, content, header, footer all pass through as `c:` content, so TACO objects and arrays work natively. Documented in component-cheatsheet.md.
* [x] doc --> **Store pattern for shared state** (v2.0.21): Added "Shared State Across Views" section to docs/state-management.md with scoped pub/sub pattern, anti-pattern warning, cross-refs to routing and handles.

Additional discoverability work done in v2.0.21:
* [x] doc --> **docs/README.md decision tree**: "What to read" table mapping questions to guides.
* [x] doc --> **thinking-in-bitwrench.md TOC**: Table of contents linking all 12 sections + appendix.
* [x] doc --> **Cross-references**: component-cheatsheet linked from LLM guide, component-library, thinking-in-bitwrench, README.

### Interactive Component Gallery

* [ ] make --> `pages/component-playground.html` -- live gallery where each make*() renders with editable props (like Storybook). Use bw.makeTryIt() for code editing + live preview.
* [ ] improve --> `pages/08-api-reference.html` -- add inline rendered examples for top 20 functions

### App Structure Patterns Guide

* [x] doc --> Created `docs/app-patterns.md` (v2.0.21) -- 5 canonical project layouts: dashboard, multi-page SPA, bwserve, embedded/IoT, static site. Each with directory structure, entry point, state flow, code example.
* [x] doc --> Each pattern: directory structure, entry point, state flow, example (v2.0.21)

### State / Store Canonical Pattern -- PARTIALLY DONE (v2.0.21)

* [x] doc --> Added "Shared State Across Views" section to state-management.md: plain object + topic-scoped pub/sub, scoped subscriptions with auto-cleanup, anti-pattern warning, cross-refs.
* [ ] doc --> Expand with: derived state = just a function, when to use o.state vs pub/sub vs store pattern, multi-store example (user store shared across nav + profile + settings)

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
