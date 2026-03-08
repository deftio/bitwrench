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
