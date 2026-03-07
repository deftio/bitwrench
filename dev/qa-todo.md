# this serves as running list of things that need attention or fixes

### Pending QA for this branch
* [ ] Visual check: carousel slides, controls, indicators on `01-components.html`
* [ ] Visual check: heading alignment on `02-tables-forms.html`
* [ ] Visual check: sortable table on `07-framework-comparison.html`
* [ ] Visual check: scrollable tabs on narrow viewport (<768px) on `07-framework-comparison.html`
* [ ] Visual check: hero image renders from local SVG (no external network requests)
* [ ] Grep pages/ for remaining external image URLs (picsum, unsplash, etc.)

## Fixes completed in feature/bccl-parity-and-polish (v2.0.12)

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
