# QA Completed — feature/bccl-parity-and-polish (v2.0.12/v2.0.13)

* [x] enhance --> 01-components.html Grid System: added 6:3:3 (half+quarter+quarter) and 6:3:2:1 (half+quarter+sixth+twelfth) grid examples with distinct color palettes
* [x] enhance --> 01-components.html: added "Text Alignment & Vertical Centering" section with horizontal (bw-text-left/center/right) and vertical (flexbox top/middle/bottom) demos + code tab
* [x] enhance --> 00-quick-start.html "Your First Bitwrench Page": replaced static code + disconnected try-it with editable code editor + live iframe preview (srcdoc, sandbox="allow-scripts"). Reader sees full HTML, edits it, clicks Run, sees result. Added "What just happened?" callout explaining bw.DOM

## Fixes completed in feature/bccl-parity-and-polish (v2.0.12)

### Fix: Visual spec tests (`test/visual.spec.js`)
* [x] Fix `test/visual.spec.js` — 36/38 tests fail pre-existing — FIXED: all 37 tests now passing. Fixes: updated selectors (`.content-container`, `#app`, `.game-board`), gradient bg detection in contrast test, `role="presentation"` on carousel arrows, darkened `--bw-text-muted` (#888→#666) and `.bw-cta-description` (#6c757d→#555b62) for WCAG AA contrast

### Fix: Index page hero buttons, version text, install strip
* [x] fix --> index.html hero buttons left-aligned (added `justify-content: flex-start` to override default styles), removed v2.0.12 text after GitHub button, fixed INSTALL strip CDN script tag (was using `bw.raw()` which injected actual `<script>` element — removed `bw.raw()` so default escaping shows it as visible text)

### Visual checks (verified via Playwright)
* [x] Visual check: carousel slides, controls, indicators on `01-components.html` — verified: 2 carousels (4 + 3 slides), prev/next controls, indicator dots, captions all render correctly
* [x] Visual check: sortable table on `07-framework-comparison.html` — verified: table renders with columns, data visible
* [x] Visual check: scrollable tabs on narrow viewport (<768px) on `07-framework-comparison.html` — verified: overflow-x:auto, scrollWidth(562) > clientWidth(229), tabs scroll horizontally
* [x] Visual check: hero image renders from local SVG (no external network requests) — verified via Playwright

### Enhance: Tables page (`pages/02-tables.html`)
* [x] enhance: `pages/02-tables.html` → added `makeTableFromArray()` demo (cities 2D array, sortable, with code tab), added "Export CSV" button to interactive table
* [x] enhance: `pages/02-tables.html` → Interactive Sortable Table now uses `bw.makeTable()`, `bw.makeButton()`, `bw.makeInput()`, `bw.makeCodeDemo()`, `bw.saveClientJSON()`, `bw.saveClientFile()` — fully bitwrench-native

### Dogfooding & index page
* [x] fix --> `pages/index.html` blank white page — FIXED: converted to full TACO dogfooding pattern
* [x] enhance: all pages now use TACO pattern — `<style>` blocks replaced with `bw.injectCSS(bw.css({...}))`, body HTML replaced with `bw.DOM('#app', ...)`

### Fix: Index page hero text, install strip, and stat cards (`pages/index.html`)
* [x] Hero text black → white: Root cause was `bitwrench-styles.js` hardcoding `color: #1a1a1a` on all headings. Changed to `color: inherit` so headings respect parent container colors. Component-level fix.
* [x] Install strip readability: Bumped label, command, and CDN text to high-contrast white on dark background. Both `npm install` and `<script>` commands in pill-styled code blocks with subtle border. Added "Downloads & CDN →" link.
* [x] Stat strip compactified: Reduced padding from 1.5rem to 0.75rem, font sizes scaled down. Each stat item is now a mini card with border and rounded corners.
* [x] Dynamic bundle size: Fetches `dist/builds.json` at runtime, extracts `bitwrench.umd.min.js` gzipped size. Falls back to "~30 KB" if fetch fails.
* [x] Hero buttons: Already left-aligned via `display: flex` (defaults to `flex-start`). No change needed.

### New: Carousel component (`bw.makeCarousel()`)
* [x] `src/bitwrench-components-v2.js` — added `makeCarousel()` (items, controls, indicators, autoPlay, CSS translateX transitions)
* [x] `src/bitwrench-styles.js` — added carousel CSS (cosmetic, structural, dark mode, themed indicator colors)
* [x] `pages/01-components.html` — carousel demo section (image carousel + content cards carousel + options table + code tab)

### New: Local demo images (no external URLs)
* [x] `pages/images/carousel-1.svg` through `carousel-4.svg` — 800x400 colored slide placeholders
* [x] `pages/images/hero-bg.svg` — 1200x400 dark gradient for hero background
* [x] `pages/images/avatar-1.svg` through `avatar-3.svg` — 100x100 circle avatar placeholders
* [x] `pages/01-components.html` — replaced external `picsum.photos` hero URL with local `images/hero-bg.svg`

### New: Combined Clock/Stopwatch/Timer widget (`pages/06-clock.html`)
* [x] Added `makeCombinedWidget()` — Section 5 "Combined Widget" after "How It Fits Together"
* [x] Three-tab dark theme widget: Clock (cyan, live time), Stopwatch (green, bw.patch for ms), Timer (orange, countdown with progress bar)
* [x] Stopwatch uses `bw.patch()` for smooth ~30fps display updates
* [x] Timer publishes `timer:finished` via `bw.pub/sub`, toast listener shows notification
* [x] All custom CSS injected via `bw.css()` + `bw.injectCSS()` — no external dependencies
* [x] Code tab shows composition pattern (sub-panel functions returning TACO)
* [x] Responsive: font sizes adjust on narrow viewports via `@media (max-width: 480px)`

### New: Scrollable tabs CSS
* [x] `src/bitwrench-styles.js` — added `.bw-nav-scrollable` class (cosmetic + structural)
* [x] `pages/07-framework-comparison.html` — page-specific scrollable overrides for tab bars

### Fix: Navbar version text
* [x] `pages/shared-theme.css` — `.bw-site-nav-ver` bumped from 0.6875rem/#666 to 0.875rem/rgba(255,255,255,0.85)

### Fix: Headings touching left margin (component-level)
* [x] `pages/shared-theme.css` — added `.demo-section > h3, .demo-section > h4` padding rule (fixes 09-builds.html Addons h3 and any other direct-child sub-headings)

### Fix: Tables & Forms page (`pages/02-tables-forms.html`)
* [x] Headings were touching parent container — wrapped content in `.demo-content` divs
* [x] Redundant title text — removed "Step N:" prefix from makeCodeDemo titles, improved descriptions
* [x] Showcase and Pipeline Demo sections wrapped in `.demo-content` for consistent spacing
* [x] Added visible border to `.bw-code-demo .bw-table` so step-demo tables don't blend into cards

### Fix: Framework Comparison Comparison 2 text
* [x] "shine" language already removed and replaced with neutral text + links to Themes/Styling pages (verified via grep)

### Fix: Framework Comparison page (`pages/07-framework-comparison.html`)
* [x] Removed marketing spin from Comparison 1 ("genuine productivity win") — replaced with neutral description
* [x] Made table preview sortable with controlled state (sortColumn, sortDirection, onSort callback)
* [x] Updated bitwrench code tab to show sortable table pattern
* [x] Removed line-count comparison comments ("25+ lines", "~20 lines")
* [x] Removed "shine" language from Comparison 2 (Dynamic Theming) intro
* [x] Added links to Themes page and Styling page in Comparison 2 text
* [x] Added scrollable tabs CSS for narrow viewports (prevents tab overflow)
* [x] Verified SolidJS present in all 6 comparisons (18 label occurrences confirmed)

### Enhance: Framework Comparison counter example
* [x] Counter now has increment, decrement, reset buttons (was only increment)
* [x] All 7 framework code tabs updated with +/−/Reset pattern
* [x] New Comparison 5: Cross-Component Coordination (3 counters + global summary, 6 framework code tabs)

### Fix: State page counter button layout (`pages/05-state.html`)
* [x] Changed `.counters-row` from CSS grid to flexbox with `flex-wrap: wrap`
* [x] Increased counter card min-width to 160px, added `flex: 1 1 160px`
* [x] Added smaller button sizing and flex-wrap to `.counter-btns`

### Enhance: Counter CSS portability (`pages/05-state.html`)
* [x] Replaced `.counter-card`, `.counter-value`, `.counter-btns`, `.counters-row` CSS classes with inline styles
* [x] Style vars use CSS custom property fallbacks (e.g. `var(--bw-card-bg, #fff)`) so counters work with or without bitwrench.css
* [x] Code display updated to show inline-style pattern

### Discuss: Performance comparison
* [x] bitwrench ~2.3ms is competitive (React 3-8ms, Vue 2-5ms, Svelte 1-3ms, SolidJS 0.5-2ms, Vanilla 0.1-0.5ms). Bitwrench sits between Svelte and Vue — impressive for a zero-build library.

### New: `bw.raw()` function (`src/bitwrench.js`)
* [x] Added `bw.raw(str)` — marks a string as pre-sanitized HTML that should not be escaped
* [x] Returns `{ __bw_raw: true, v: str }` sentinel object
* [x] `bw.html()` recognizes `__bw_raw` and returns the raw value (no escaping)
* [x] `bw.createDOM()` recognizes `__bw_raw` — uses `innerHTML` (content child) or `DocumentFragment` (standalone)
* [x] Used throughout all converted pages for HTML entities (`&mdash;`, `&rarr;`) and inline markup (`<code>`, `<strong>`)

### Dogfooding: ALL pages converted to bitwrench TACO pattern
Every page in `pages/` now follows the dogfooding pattern:
- Minimal HTML body: `<div id="example-nav"></div><div id="app"></div>`
- No raw HTML in `<body>` — all structure built as TACO objects
- No `<style>` blocks — all CSS via `bw.injectCSS(bw.css({...}))`
- Single mount: `bw.DOM('#app', [pageHeader, contentWrapper])`

Pages converted:
* [x] `pages/index.html` — hero, install strip, stats, features, demos, page index, footer
* [x] `pages/02-tables.html` — interactive table, pagination, data grid demos
* [x] `pages/02-forms.html` — form showcase, tabbed forms, validation, layout patterns
* [x] `pages/03-styling.html` — inline styles, generated CSS, external CSS, theme preview
* [x] `pages/04-dashboard.html` — sidebar, stat cards, bar chart, activity table, theme picker
* [x] `pages/05-state.html` — counter demos, cross-component, patch, events, todo, dynamic CSS
* [x] `pages/06-tic-tac-toe-tutorial.html` — 5-step tutorial, congrats, complete example
* [x] `pages/07-framework-comparison.html` — 6 comparisons, summary table, use cases
* [x] `pages/08-api-reference.html` — build tool (`tools/build-api-reference.js`) now generates TACO
* [x] `pages/10-themes.html` — generator, gallery, multi-theme, code export, dark mode
* [x] `pages/11-code-editor.html` — overview, installation, API reference, demos

### Fix: Playwright test selectors after dogfooding
* [x] fix --> `test/mounted-pattern.spec.js` — updated 4 counter tests: `.counter-card` → `#counter-demo [data-bw-id]`, `.counter-value` → `#counter-demo [data-bw-id] h4 + div` (classes were replaced with inline styles during 05-state.html dogfooding)
* [x] fix --> removed obsolete `tests/debug-tabs.spec.js` and `tests/tab-click-debug.spec.js` (navigated to `/01-basic-components.html` which no longer exists)

### QA Results (v2.0.12/v2.0.13 final)
* [x] Unit tests: 448 passing (bitwrench.js 88.74% stmt coverage)
* [x] Playwright chromium: 136/136 passing
* [x] Playwright firefox/webkit: skipped (browsers not installed locally — CI handles multi-browser)
* [x] Visual spec: 37/37 passing (all fixed)

---

# QA Completed — feature/pages-polish-round2 (v2.0.14)

## P0: Component interactivity & accessibility
* [x] fix --> modal backdrop click (already implemented, verified)
* [x] fix --> carousel keyboard navigation (left/right arrow keys, tabindex, pause on hover)
* [x] fix --> accordion collapse/expand CSS transition (smooth maxHeight, reflow trick)
* [x] fix --> dropdown menu fade-in transition (visibility+opacity+transform)
* [x] fix --> modal entrance/exit animation (visibility+opacity)
* [x] fix --> tabs keyboard arrow navigation (Left/Right/Home/End, tabindex roving)
* [x] fix --> color contrast: warning #b38600, info #0891b2 (WCAG 1.4.11 pass)
* [x] fix --> focus states: outline+box-shadow on buttons, dropdowns, list-group, pagination, form inputs

## P0: Theme toggle redesign
* [x] fix --> `bw.generateTheme()` dual palettes: primary + alternate (luminance-inverted)
* [x] fix --> `bw.applyTheme()` / `bw.toggleTheme()` — `.bw-theme-alt` class toggle
* [x] fix --> Removed hardcoded dark mode: `toggleDarkMode()`, `generateDarkModeCSS()`, `getDarkModeStyles()` deleted
* [x] fix --> Design doc: `dev/bw-theme-toggle-design.md`

## P1: CSS consistency & polish
* [x] fix --> font-size scale: TYPE_RATIO_PRESETS + generateTypeScale()
* [x] fix --> shadow scale: ELEVATION_PRESETS (flat/sm/md/lg)
* [x] fix --> transitions normalized: 3 tiers (0.15s/0.2s/0.3s) + ease-out
* [x] fix --> `@media (prefers-reduced-motion: reduce)` in structural CSS
* [x] fix --> badge em→rem, carousel caption 0.9→0.875rem
* [x] fix --> list-group item transition, nav link background-color transition
* [x] fix --> string shorthand: `makeButton('OK')`, `makeBadge('New')`, `makeAlert('msg')`
* [x] fix --> carousel autoPlay demo, dropdown align:"end" example
* [x] fix --> toast buttons: createDOM+appendChild for proper stacking
* [x] fix --> index.html: equal-height feature cards, responsive install strip

## P2: New components (framework parity)
* [x] add --> `makeTooltip()` — CSS hover/focus, 4 placements, role=tooltip. 7 tests.
* [x] add --> `makePopover()` — click-triggered, click-outside dismiss, mounted/unmount. 7 tests.
* [x] add --> `makeStatCard()` — value/label/change/format/icon/variant. 8 tests.
* [x] add --> form validation — `bw-is-valid`/`bw-is-invalid`, `makeFormGroup()` enhanced. 8 tests.
* [x] add --> `makeFileUpload()` — drag-and-drop, keyboard accessible. 7 tests.
* [x] add --> `makeRange()` — styled slider with live value display. 5 tests.
* [x] add --> `makeSearchInput()` — search + clear button, callbacks. 5 tests.
* [x] add --> `makeTimeline()` — vertical timeline, variant markers, TACO content. 7 tests.
* [x] add --> `makeStepper()` — completed/active/pending states, checkmark, aria-current. 7 tests.
* [x] add --> `makeChipInput()` — Enter to add, Backspace to remove, × buttons. 6 tests.
* [x] add --> `makeMediaObject()` — image+text flexbox, reverse mode. 5 tests.
* [x] fix --> breadcrumb active state — link colors, hover underline, font-weight. 3 tests.

## P3: Theming architecture
* [x] fix --> structural/cosmetic CSS split documented and enforced (policy JSDoc on getStructuralStyles)
* [x] fix --> CSS custom properties: intentional IE11 omission documented (design note in bitwrench-styles.js)
* [x] fix --> responsive breakpoints reconciled: bw.responsive() now matches grid/theme (sm=576, md=768, lg=992, xl=1200). Reference table on 03-styling.html.
* [x] fix --> underscore/hyphen class naming documented: JSDoc on addUnderscoreAliases(), new section on 03-styling.html

### QA Results (v2.0.14 final)
* [x] Unit tests: 558 passing (bitwrench.js 88.98% stmt coverage)
* [x] Build: `npm run build:release` passes — 24 dist files, SRI hashes generated
* [x] Bundle: 35KB gzipped (budget: 45KB)
* [x] Coverage: bitwrench-styles.js 99.83%, bitwrench.js 88.98%, components 70.83%

## Design explorations completed (v2.0.14)
* [x] define --> font-size scale: TYPE_RATIO_PRESETS + generateTypeScale() — modular scale from ratio (tight/normal/relaxed/dramatic)
* [x] define --> shadow elevation scale: ELEVATION_PRESETS (flat/sm/md/lg) wired into cards, modals, toasts, dropdowns
* [x] define --> motion/transition curves: MOTION_PRESETS (reduced/standard/expressive × fast/normal/slow+easing). 3 tiers (0.15s/0.2s/0.3s), `@media (prefers-reduced-motion: reduce)` added

---

# QA Completed — v2.0.15 / v2.0.16

## Reactivity system (Phase 1, v2.0.15) — IMPLEMENTED
* [x] add --> ComponentHandle: unified reactive component class with .get()/.set()/.mount()/.destroy()
* [x] add --> Function registry: bw.funcRegister(), funcGetById(), funcGetDispatchStr(), funcUnregister()
* [x] add --> Template bindings: ${expr} in TACO content/attributes, Tier 1 (dot-path) + Tier 2 (new Function)
* [x] add --> Microtask batching: Promise.resolve().then(flush) with bw.flush() for sync testing
* [x] add --> Control flow: bw.when(expr, tacoTrue, tacoFalse), bw.each(expr, factory)
* [x] add --> bw.component() factory, bw.compile() pre-compilation
* [x] add --> Integration with bw.DOM(), bw.html(), bw.cleanup()
* [x] add --> 77 new tests (bitwrench_test_component_handle.js)

## Three-level component materialization (v2.0.15) — IMPLEMENTED
* [x] implement --> o.methods promotion to ComponentHandle API
* [x] implement --> ComponentHandle.prototype.userTag(id)
* [x] implement --> bw.message(target, action, data)
* [x] implement --> bw.inspect(el_or_selector)
* [x] implement --> ComponentHandle detection in bw.createDOM() and bw.html() content walkers
* [x] test --> 77 ComponentHandle tests, 880 total tests, 97.51% statement coverage
* [x] docs --> pages/11-debugging.html, dev/llm-bitwrench-guide.md updated

## QA fixes (v2.0.15)
* [x] fix --> theme persistence, navbar clipping, logo sizing, install strip, builds page
* [x] add --> SPACING_SCALE, palette.background/surface tokens, API markdown generator, self-load-test page
* [x] doc --> 10-themes.html sections: applying themes, background/surface colors, mixed themes

## Dead code elimination (v2.0.15)
* [x] remove --> 5 old Handle classes, componentHandles registry, duplicate color functions (~498 lines)
* [x] doc --> dev/dead-code-elimination-v2.0.15.md with recovery code

## Doc cleanup (v2.0.16)
* [x] archive --> moved `dev/bitwrench-serve-and-protocol.md` → `dev/archive/` (superseded by bw-client-server.md)
* [x] archive --> moved `dev/bccl-component-redux.md` → `dev/archive/` (superseded by bccl-components-representation.md)
* [x] scaffold --> bwserve library stubs (`src/bwserve/`) + CLI `bwcli serve` subcommand
* [x] build --> bwserve integrated into rollup + package.json exports

## Documentation Blitz (v2.0.16)
* [x] create --> `docs/` directory with 8 markdown guides (README, taco-format, state-management, component-library, theming, cli, bwserve, llm-bitwrench-guide)
* [x] update --> README.md: ComponentHandle as primary state pattern, updated API table, docs/ links
* [x] update --> `docs/llm-bitwrench-guide.md`: three-level model, ComponentHandle API, all make*() functions, mental model callouts for LLMs conditioned on React/Vue

## P0: Documentation Blitz — docs/ directory (v2.0.16)
* [x] create --> `docs/` directory at repo root for user-facing documentation (markdown)
* [x] create --> `docs/README.md` — index/table of contents for docs/ directory
* [x] create --> `docs/taco-format.md` — standalone TACO format reference with "Coming from React/Vue?" callouts
* [x] create --> `docs/state-management.md` — comprehensive three-level model guide with full ComponentHandle API
* [x] create --> `docs/component-library.md` — all 50+ make*() functions with signatures, props, examples
* [x] create --> `docs/theming.md` — theme generation guide (generateTheme, presets, palette, design tokens)
* [x] create --> `docs/cli.md` — CLI reference (convert, flags, themes, standalone/cdn modes, serve subcommand)
* [x] create --> `docs/bwserve.md` — bwserve placeholder (planned API, protocol, use cases)
* [x] create --> `docs/llm-bitwrench-guide.md` — updated from dev/ version with ComponentHandle, three-level model, all make*() functions, mental model callouts
* [x] update --> README.md: "Adding State" → ComponentHandle as primary pattern, Core API table updated, docs/ links added

## P0: State page, quick start, tutorials (v2.0.16)
* [x] update --> `pages/05-state.html`: Added Section 1b "ComponentHandle — The Recommended Pattern", reframed existing sections as "Low-Level Pattern"
* [x] update --> `pages/05-state.html`: Added "Which Pattern to Use?" decision table, "Wrapping make*() in ComponentHandle" example, bw.message() example
* [x] make --> `examples/llm-chat/` — Node.js + bwserve chat with LLM streaming (ollama/lm-studio/openrouter)
* [x] rewrite --> `pages/00-quick-start.html`: proper onboarding from nothing to a working app (7 steps)
* [x] create --> `docs/tutorial-website.md`: multi-section landing page tutorial (9 steps, ~120 lines JS)
* [x] create --> `docs/tutorial-bwserve.md`: Streamlit-style server dashboard tutorial (6 steps)
* [x] create --> `docs/tutorial-embedded.md`: ESP32 IoT dashboard tutorial (bwserve.h macros, SPIFFS, r-prefix JSON)

## P0: Standalone examples (v2.0.16)
* [x] create --> `examples/static-page/` — static page built with bitwrench (217 lines)
* [x] create --> `examples/reactive-ui/` — interactive single-page app / todo list (295 lines)
* [x] create --> `examples/client-server/` — bwserve client-server app (174 lines)
* [x] create --> `examples/embedded/` — ESP32/IoT embedded dashboard

## P0: Other documentation (v2.0.16)
* [x] fix --> `pages/11-debugging.html`: contrast issues — added explicit bg/color to `.api-table code`
* [x] update --> `dev/bitwrench-todo.md`: fixed stale items
* [x] update --> navbar on all pages: "Docs" link present in shared-nav.js
* [x] fix --> `dev/coming-from-other-frameworks.md` — updated all 8 framework bridge tables with ComponentHandle
* [x] document --> Custom TACO without BCCL: added section to `docs/taco-format.md` + callout in `docs/llm-bitwrench-guide.md`

## P0: Stale docs culled (v2.0.16)
* [x] archived --> 9 superseded docs moved to `dev/archive/`
* [x] fix --> `dev/bitwrench-todo.md` multiple stale items corrected

## P1: Mobile Responsiveness (v2.0.16)
* [x] fix --> `pages/index.html`: hero decorative circle hidden at 480px, tagline/subtitle max-width use `min(Npx, 90vw)`, 480px breakpoint added for hero text sizes
* [x] audit --> `src/bitwrench-styles.js`: default styles have proper mobile breakpoints (575px, 768px), toast uses `calc(100vw - 2rem)`, tooltips use `min()`, modals covered at 575px
* [x] audit --> `pages/shared-theme.css`: responsive at 480px/768px/1024px. Nav collapses at 900px, pipeline at 900px, try-it at 768px
* [x] fix --> Generated theme CSS (`bw.generateTheme()`): verified themed components inherit responsive behavior
* [x] test --> Add mobile viewport Playwright tests (375px width) for all 17 pages
* [x] test --> Add tablet viewport Playwright tests (768px width) for all 17 pages
* [x] test --> Playwright runs locally (not in CI)

## P1: bwserve — Server-Driven UI (v2.0.16) — IMPLEMENTED
* [x] implement --> `bw.apply(msg)` (was `bw.clientApply`) — message dispatcher for 5 types + message
* [x] implement --> SSE/poll connection (was `bw.clientConnect`, now in bwclient.js)
* [x] implement --> Connection lifecycle
* [x] implement --> `src/bwserve/index.js` — Full HTTP/SSE server (zero runtime deps)
* [x] implement --> `src/bwserve/client.js` — BwServeClient with real SSE transport
* [x] implement --> `src/bwserve/shell.js` — Page shell generator
* [x] implement --> SSE stream management: configurable keep-alive
* [x] implement --> `bwcli serve` pipe server
* [x] create --> `pages/12-bwserve-protocol.html` — Protocol reference page
* [x] update --> `docs/bwserve.md` — Full user guide
* [x] update --> `pages/shared-nav.js` — bwserve primary nav item
* [x] update --> `pages/bwserve-sandbox.html` — Linked from main nav
* [x] test --> 109 tests in `test/bitwrench_test_bwserve.js` (100% coverage on bwserve files)
* [x] create --> `examples/client-server/server.js`, `examples/llm-chat/server.js`, `examples/pipe-demo/sensor.sh`
* [x] implement --> `bw.parseJSONFlex()` (was `bw.clientParse`) relaxed JSON state machine — 14 tests
* [x] implement --> `client.register()` / `client.call()` / `client.exec()` three-tier execution model

## P2.5: Bundle Size — three-tier build (v2.0.16)
* [x] implement --> three-tier build: `bitwrench-lean` (core), `bitwrench-bccl` (components addon), `bitwrench` (full)

---

# QA Completed — v2.0.17 / v2.0.18

## P2: Component ergonomics (v2.0.17) — COMPLETED

Informed by real-world feedback: a developer built `examples/ember_and_oak.html` (a full
coffee-ordering site, ~800 lines) using only bitwrench v2.0.16 + docs.

### Docs gaps surfaced by Ember & Oak

* [x] doc --> `bw.raw()` spotlight — documented in `thinking-in-bitwrench.md` § Raw HTML in content
* [x] doc --> `onclick` as primary event pattern — documented in `thinking-in-bitwrench.md` § Event handlers
* [x] doc --> pattern for ephemeral UI (toasts, slide-over panels) — documented in `thinking-in-bitwrench.md` § Ephemeral UI
* [x] doc --> pattern for data-driven filtered lists — documented in `thinking-in-bitwrench.md` § Data-driven filtered list
* [x] doc --> theme palette tokens in custom `bw.css()` — documented in `thinking-in-bitwrench.md` § Theme + custom CSS
* [x] doc --> pattern for child widget updates within a ComponentHandle — documented in `state-management.md` § Updating child widgets

### Critical fixes

* [x] fix --> `_applyPatches()` binding updates destroy sibling event listeners (CRITICAL)
* [x] fix --> `o.render` not called on initial mount

### Debug and warnings

* [x] implement --> `bw.debug` flag + binding debug warnings
* [x] implement --> warn when child `o.mounted` is stripped by ComponentHandle

### Component ownership

* [x] implement --> child component ownership + destroy cascade

### Factory rebuild (make*() + ComponentHandle bridge)

* [x] implement --> factory `_factory` stash on BCCL TACOs (for .set() triggering factory rebuild)
* [x] implement --> factory rebuild in `ComponentHandle._flush()` (~25 lines)

### Table enhancements

* [x] implement --> `selectable` prop + `onRowClick` callback + `bw_table_row_selected` CSS class on `makeTable()`
* [x] implement --> `pageSize`/`currentPage`/`onPageChange` props — pagination for `makeTable()`
* [x] document --> `col.render` cell renderer + selectable + pagination in `docs/component-library.md`

### Lifecycle cleanup

* [x] implement --> `updated` as alias for `onUpdate` (1 line)
* [x] doc --> `mounted`/`updated`/`unmount` as the "primary three" in `state-management.md` + `llm-bitwrench-guide.md`
* [x] doc --> soft-deprecate `willUpdate`/`willDestroy` as "rarely needed" in docs

## P3.5: Examples Gallery (v2.0.18) — COMPLETED

* [x] make --> `examples/showcase/` — zero-CSS marketing page, 18 components, ~110 lines
* [x] make --> `examples/embedded-gpio/` — Raspberry Pi GPIO controller
* [x] make --> `examples/embedded-industrial/` — Industrial HMI panel
* [x] make --> `examples/embedded-network/` — Network device monitor
* [x] make --> `examples/embedded-home/` — Home automation panel
* [x] make --> `examples/embedded-pico-w/` — Raspberry Pi Pico W microcontroller dashboard
* [x] make --> `examples/embedded-rpi/` — Raspberry Pi (full Linux) system monitor
* [x] rewrite --> `examples/index.html` gallery — new ordering, categories, descriptions
* [x] make --> `examples/dashboard/` — live-updating metrics dashboard
* [x] make --> `examples/wizard/` — multi-step signup form
* [x] make --> `examples/live-feed/` — real-time event stream
* [x] make --> `examples/todo-app/` — reactive todo app

## P3.6: UUID Addressing — Implementation (v2.0.18) — COMPLETED

Design doc: `dev/bw-uuid-addressing-design.md`

* [x] implement --> `bw.assignUUID(taco, forceNew)` — explicit UUID assignment to TACO objects
* [x] implement --> `bw.getUUID(tacoOrElement)` — read UUID from TACO or DOM element
* [x] implement --> `createDOM()` UUID registration in `_nodeMap`
* [x] implement --> `_el()` class-based fallback for `bw_uuid_*` tokens
* [x] implement --> `cleanup()` UUID deregistration (element + descendants)
* [x] implement --> `message()` UUID lookup via `_el()` (enables server-driven method dispatch by UUID)
* [x] test --> 23 UUID addressing tests in `test/bitwrench_test_uuid.js`

## P4: bw.h() — TACO constructor (v2.0.18) — COMPLETED

* [x] implement --> `bw.h(tag, attrs, content, opts)` — returns plain `{t,a,c,o}` TACO object (~5 lines)

## P5: bwserve Screenshot — Phase 1: Core protocol (v2.0.18) — COMPLETED

Design doc: `dev/bw-screenshot-design.md`

* [x] implement --> `client.screenshot(selector?, options?)` on `BwServeClient`
* [x] implement --> `_resolveScreenshot(requestId, result)` on `BwServeClient`
* [x] implement --> `/bw/return/screenshot/:clientId` POST route in `BwServeApp`
* [x] implement --> `/bw/lib/vendor/:filename` GET route in `BwServeApp`
* [x] vendor --> `src/vendor/html2canvas.min.js` (v1.4.1, ~194KB minified, MIT license)
* [x] implement --> Client-side capture function (registered as string)
* [x] implement --> `allowScreenshot` opt-in flag
* [x] test --> Protocol round-trip unit tests (14 tests)
