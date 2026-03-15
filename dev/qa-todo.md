# QA Todo — v2.0.18+

Updated 2026-03-15

Completed items moved to `dev/qa-completed.md`.

---

## P2: Component ergonomics — Open Items

### Factory rebuild (discuss)

* [ ] discuss --> should `make*()` accept `{ reactive: true }` flag that auto-wraps in `bw.component()`?
* [ ] discuss --> or provide `bw.reactive(makeCard({...}))` as explicit sugar?

### ComponentHandle cleanup (deferred)

* [ ] cleanup --> `_deepCloneTaco`, `_tacoForDOM` refactor (avoid TACO mutation)
* [ ] implement --> list reorder helper (insertBefore-based, ~5 lines)

---

## P2.5: Bundle Size Management

Current sizes (v2.0.18):
- **bitwrench.umd.min.js** (full): **42.8KB gzipped** — under 45KB budget (was 38.9KB in v2.0.16)
- Growth: table selectable/pagination, bw.h(), bw.component() enhancements
- **Only ~2KB headroom remaining** — monitor closely

Source breakdown: core 4222 LOC (40%), styles 2236 LOC (21%), BCCL 3614 LOC (34%), color 438 LOC (4%).

### If we approach 45KB limit

* [ ] analyze --> identify CSS generation bloat in bitwrench-styles.js (largest growth risk)
* [ ] consider --> tree-shakeable ESM build where unused make*() functions are eliminated
* [ ] monitor --> Phase 2 (make*() → ComponentHandle) adds ~1-2KB gzipped — still within budget
* [ ] monitor --> bwserve client-side additions (clientConnect, clientApply, declarative events) add ~3-5KB gzipped

---

## P3: Design system polish (ongoing)

* [ ] define --> border-radius scale enforcement (already in RADIUS_PRESETS, ensure all components use it)
* [ ] tune --> alternate derivation curves with all 12 preset themes
* [ ] tune --> per-component dark appearance depends on alternate palette quality
* [ ] audit --> visual quality: do all components look beautiful with default palette?
* [ ] audit --> theme consistency: do all 12 preset themes look good with all components?

---

## P3.6: UUID Addressing — Docs (open)

* [ ] doc --> Update State Management docs with "Level 0.5" embedded dashboard pattern
* [ ] doc --> Update LLM guide with UUID addressing API
* [ ] doc --> Add "Embedded Dashboard Golden Path" recipe

---

## P4: TACO Shorthand — Array shorthand (v2.1.0)

Design doc: `dev/array_to_taco.md`

* [ ] audit --> backward compatibility with existing `c: [child, child]` arrays
  - CRITICAL: `bw.html()` and `bw.createDOM()` already treat arrays in `c` as children lists
  - Array shorthand `[t, a, c, o]` must be unambiguously distinguishable from children arrays
  - Run full TDD suite from `dev/array_to_taco.md` against real examples before shipping
* [ ] implement --> `bw.normalizeTaco(node)` — converts array shorthand + strings to canonical `{t,a,c,o}`
  - Strict positional: `[c]`, `[t,c]`, `[t,a,c]`, `[t,a,c,o]`
  - Recursively normalizes children
  - Files: `src/bitwrench.js`
  - Tests: 30+ (see TDD section in `dev/array_to_taco.md`)
* [ ] decide --> double-bracket problem: `['p', [['a', {href:'...'}, 'link']]]` is unnatural
  - Alternative: require `{c:[...]}` wrapper when c is an array
  - This is the hardest UX question — needs real developer testing
* [ ] doc --> documentation strategy: teach {taco} first, introduce array shorthand as convenience layer
  - Users must understand TACO before seeing shorthand (shorthand is sugar, not the model)
  - Caveats section: when shorthand doesn't work (complex `o`, edge cases)
  - See `dev/array_to_taco.md` § Documentation Strategy

---

## P5: bwserve Screenshot — Phase 2 & 3

Design doc: `dev/bw-screenshot-design.md`

### Phase 2: Demos and playground

* [ ] make --> `examples/client-server/screenshot-demo/` — dashboard screenshot to disk
* [ ] make --> Add Screenshot button to `pages/bwserve-sandbox.html`
  - Displays returned image inline, shows metadata (dimensions, format, size)
* [ ] make --> `examples/client-server/llm-screenshot/` — LLM visual feedback loop
  - Generate TACO → render → screenshot → vision model evaluates → refine
  - Uses Ollama (local, free) with llava or similar vision model

### Phase 3: Polish

* [ ] implement --> Rate limiting (default 1/sec per client, configurable)
* [ ] implement --> Visual indicator option (brief border flash, off by default)
* [ ] implement --> `client.inspect(selector)` — layout metadata without pixels
  - Returns { width, height, scrollHeight, childCount, computedStyles }
  - Same call + POST-back protocol, much cheaper than screenshot
* [ ] test --> Playwright integration tests (real rendering, image validation)
* [ ] doc --> Screenshot section in `docs/bwserve.md`

---

## P6: bitwrench-chart — Separate SVG Charting Library

Design doc: `dev/bw-chart-design.md`

**Separate package** (`bitwrench-chart` on npm). SVG-based, TACO-native, zero
runtime deps. No bundle size limit. Charts return `{t:'svg', ...}` TACO objects —
serializable, patchable via bwserve, themeable via palette.

### Phase 1: Core + MVP charts

* [ ] setup --> Create repo/package structure, build config, test harness
* [ ] implement --> Scale functions (linear, band, time) — pure functions, ~50 lines each
* [ ] implement --> Axis generation (ticks, labels, gridlines) — ~150 lines
* [ ] implement --> `barChart(config)` — vertical bars with axes, labels, palette
* [ ] implement --> `lineChart(config)` — straight segments, area fill, multi-series
* [ ] implement --> `sparkline(config)` — inline mini chart, no axes, for table cells
* [ ] implement --> `pieChart(config)` — pie + donut variants, center label
* [ ] implement --> Responsive wrapper (viewBox-based, width:100%)
* [ ] implement --> Default categorical palette (8 colors, colorblind-safe)
* [ ] implement --> Accessibility (<title>, <desc>, role="img") on all charts
* [ ] test --> Unit tests for scales, axes, all 4 chart types (~100 tests)
* [ ] doc --> README with examples, API reference

### Phase 2: More chart types + integration

* [ ] implement --> `gauge(config)` — semi-circle/full with needle, threshold zones
* [ ] implement --> `scatterChart(config)` — dots, optional bubble sizing, regression line
* [ ] implement --> `heatmap(config)` — 2D grid, sequential/diverging color scales
* [ ] implement --> `radarChart(config)` — N-axis polygon, multi-series overlay
* [ ] implement --> `arrayImage(config)` — 2D array → SVG rects or data-URL image (from bw 1.x)
* [ ] implement --> bitwrench theme adapter (`fromTheme(palette)` → color array)
* [ ] implement --> Legend component
* [ ] implement --> Tooltip component (hover)
* [ ] implement --> Animation CSS (opt-in, CSS transitions/keyframes)
* [ ] test --> Tests for Phase 2 chart types (~100 tests)

### Phase 3: Advanced charts + polish

* [ ] implement --> `treemap(config)` — squarified layout, nested rectangles
* [ ] implement --> `chord(config)` — circular flow diagram, matrix input
* [ ] implement --> Bar variants (horizontal, stacked, grouped)
* [ ] implement --> Line curves (monotone cubic interpolation)
* [ ] implement --> Pattern fills (stripes, dots) for colorblind accessibility
* [ ] implement --> Keyboard navigation for interactive charts
* [ ] doc --> Full documentation site
* [ ] release --> v1.0.0

---

## Deferred / Future

### Core
* [ ] implement --> `bw.make(type, props)` factory dispatcher — thin delegation to `bw.makeCard`, `bw.makeButton`, etc. Enables data-driven component creation. Audit which make*() functions earn their keep.
* [ ] implement --> `bw.morph(target, newTaco)` — update DOM in-place, preserving state of unchanged subtrees
* [ ] implement --> Component structural/cosmetic CSS split — separate structural styles (layout, display) from cosmetic (colors, shadows) in `bitwrench-styles.js`. Base CSS structural-only; `generateTheme()` handles cosmetic layer.

### bwserve
* [ ] implement --> Declarative events (`o.events`) in `bw.createDOM()` — sendValue, debounce, throttle, sendForm
* [ ] implement --> DOM morphing for `replace` — preserve local state (scroll pos, expanded accordions)
* [ ] implement --> Form data serialization in actions (sendForm: '#my-form')
* [ ] implement --> WebSocket transport option
* [ ] decide --> Optimistic updates: client-side immediate response while waiting for server
* [ ] decide --> Event batching: multiple actions in same frame → single POST

### CLI
* [ ] implement --> `bwcli serve` file watching and live reload
* [ ] implement --> `bwcli build` — static site generation from directory of .md/.html files
* [ ] implement --> `bwcli init` — scaffold a new bitwrench project

### Docs / DX
* [ ] improve --> API reference: fix JSDoc (@example, @category), use `comment-parser` devDep, improve CSS/layout (cards, search)
* [ ] make --> `examples/llm-chat-advance` (deferred to separate repo — requires markdown rendering + image display)
* [ ] implement --> `bw.makePage()` SEO metadata param — add support for keywords, description, og:tags, search tags. Make SEO-friendly pages easy out of the box.
* [ ] improve --> `pages/10-themes.html` — restructure: lead with presets, compact color explanation, bridge CSS/Tailwind → JS-driven CSS. Level 0 section is too thin.
