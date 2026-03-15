# QA Todo — v2.0.17+

Updated 2026-03-12.

---

## Positioning: Where bitwrench sits in the web landscape

Bitwrench occupies a space that mostly doesn't exist in mainstream web dev — closest
to Mithril.js, Hyperapp, or "vanilla-JS-with-helpers," but with a more opinionated
component model and built-in CSS generation.

| Tier | Frameworks | What they solve |
|------|-----------|----------------|
| Full app frameworks | React, Vue, Svelte, Angular | Complex SPAs, large teams, ecosystem |
| Lightweight reactive | Mithril, Preact, Solid, Alpine | Reactivity without the weight |
| **Bitwrench** | — | **UI generation from data, zero toolchain** |
| Utility libraries | jQuery, lodash+templates | DOM helpers, no component model |
| Raw DOM | vanilla JS | Nothing included |

### Genuine strengths (real differentiation)

1. **Zero build step, zero deps** — rare and genuinely valuable for embedded (ESP32),
   internal tools, rapid prototyping. Most "lightweight" frameworks still need npm/vite.
2. **CSS generation from JS** — `bw.css()` + `bw.generateTheme()` is legitimately unique.
   No other sub-50KB library gives you a full design system from seed colors.
3. **Isomorphic TACO** — same object renders to DOM string (server) or live DOM (browser).
   This is the Swing/MFC insight done right.
4. **Server-driven UI** — bwserve's protocol (replace/patch/append) is a real architecture
   for IoT dashboards and embedded UIs, not a demo.

### Where it's genuinely weaker

1. **The component handle system (`bw.component()`) is young.** Binding/reactivity layer
   works but has sharp edges — sibling listener destruction, `o.render` not firing on mount,
   silent binding failures. React devs expect `.set()` to Just Work; right now it sometimes
   silently doesn't.
2. **Discovery/docs gap.** Features that exist but can't be found don't exist to users.
   Example: cell renderers (`col.render`) work but aren't documented.
3. **Not competing for SPA territory.** No routing, no devtools extension, no SSR hydration.
   That's fine — but it means the audience is smaller.

### Target pitch

**"What if you could build a Bootstrap dashboard without npm, webpack, React, or even a
CSS file — just one JS import and plain objects?"** — compelling for:
- Server-driven dashboards
- IoT/embedded UIs (ESP32 etc.)
- Internal tooling
- Rapid prototyping
- Streamlit-style data apps

The P2 work (v2.0.17) makes the component system trustworthy enough to back that pitch.

---

## P2: Component ergonomics (v2.0.17)

Informed by real-world feedback: a developer built `examples/ember_and_oak.html` (a full
coffee-ordering site, ~800 lines) using only bitwrench v2.0.16 + docs. Their pain points
are real bugs and DX friction in the `bw.component()` system.

### Ember & Oak analysis — what the feedback tells us

The developer tried Level 2 first, hit friction, fell back to Level 1, hit more friction,
then escaped to raw DOM. The gradient:

| Pattern | Where used | Why they chose it |
|---------|-----------|-------------------|
| Level 2 `bw.component()` | Navbar, contact form, counter, progress | Worked for simple bindings |
| Level 1 `o.mounted` + `o.render` | Coffee section, newsletter, progress | Fell back when Level 2 had friction |
| Raw DOM | Toast, cart panel, hero title, scroll button | Escaped when neither Level worked |

**What worked well** (validates bitwrench):
- `bw.css()` for all styling — 180 lines, clean, responsive, one object
- `bw.generateTheme()` — one line branded the whole site
- 27 BCCL components used naturally (makeTimeline, makeStatCard, makeBarChart, etc.)
- `bw.pub('cart:updated')` + `navbar.sub()` — cross-component pub/sub done right
- Counter with `o.methods` — Level 2 pattern working as intended
- Single CDN script, zero build step — the core pitch delivered

**Where they hit walls** (drives our P2 work):
1. **Toast (raw DOM)** — needed ephemeral auto-dismissing UI, no TACO pattern for it
2. **Cart panel (raw DOM class toggle)** — `document.getElementById()` + `classList.add('open')`
3. **Hero title (innerHTML in o.mounted)** — needed `bw.raw()` but didn't know it existed
4. **Coffee filter/search (Level 1 + querySelector)** — data-driven list didn't feel natural in `bw.component()`
5. **`o.mounted` everywhere for click handlers** — used `btn.addEventListener('click',...)` instead of `onclick` attr
6. **Hardcoded hex colors** — theme generated but tokens not accessible enough for custom CSS
7. **Progress child widget** — `document.getElementById('prog-wrap')` to update child sub-component

**Key insight**: `onclick` attribute works fine (they used it on line 290 for cart button)
but the docs don't push it as the primary pattern. Most buttons use the verbose `o.mounted`
+ `addEventListener` pattern instead.

### Docs gaps surfaced by Ember & Oak

* [x] doc --> `bw.raw()` spotlight — documented in `thinking-in-bitwrench.md` § Raw HTML in content
* [x] doc --> `onclick` as primary event pattern — documented in `thinking-in-bitwrench.md` § Event handlers
* [x] doc --> pattern for ephemeral UI (toasts, slide-over panels) — documented in `thinking-in-bitwrench.md` § Ephemeral UI
* [x] doc --> pattern for data-driven filtered lists — documented in `thinking-in-bitwrench.md` § Data-driven filtered list
* [x] doc --> theme palette tokens in custom `bw.css()` — documented in `thinking-in-bitwrench.md` § Theme + custom CSS
* [x] doc --> pattern for child widget updates within a ComponentHandle — documented in `state-management.md` § Updating child widgets

### Critical fixes

* [x] fix --> `_applyPatches()` binding updates destroy sibling event listeners (CRITICAL)
  - `el.textContent = newValue` nukes sibling children + their listeners in mixed content
  - Fix: wrap `${expr}` strings in `{t:'span', a:{'data-bw_ref':refId, style:'display:contents'}}` to isolate
  - Files: `src/bitwrench.js` — `_compileBindings`, `_applyPatches`
  - Tests: 8-10 new (mixed content bindings, listener survival after .set(), nested children)

* [x] fix --> `o.render` not called on initial mount
  - `_tacoForDOM()` strips all `o:` from root, including `o.render`
  - Fix: in `mount()`, after `_resolveAndApplyAll()`, check+invoke original `o.render`
  - Files: `src/bitwrench.js` — `mount()`
  - Tests: 3-4 new (o.render fires on mount, fires before mounted hook, not re-called on .set())

### Debug and warnings

* [x] implement --> `bw.debug` flag + binding debug warnings
  - When true: warn on unknown state keys in `${expr}`, null `_bw_refs[refId]`, undefined expression values
  - Files: `src/bitwrench.js` — `_evaluatePath`, `_resolveTemplate`, `_applyPatches`, `set()`
  - Tests: 5 new (warnings when debug=true, silent when debug=false)

* [x] implement --> warn when child `o.mounted` is stripped by ComponentHandle
  - `_tacoForDOM()` silently strips child `o:` with `mounted/render/unmount` — correctness issue
  - Fix: emit `console.warn()` always (not gated by debug flag), recommend `a: {onclick: fn}` instead
  - Files: `src/bitwrench.js` — `_tacoForDOM`
  - Tests: 3 new

### Component ownership

* [x] implement --> child component ownership + destroy cascade
  - Nested ComponentHandles mounted independently with no parent tracking
  - Fix: `_children = []` / `_parent = null` in constructor; scan `[data-bw_comp_id]` after mount;
    `destroy()` cascades depth-first
  - Files: `src/bitwrench.js` — constructor, `mount()`, `destroy()`
  - Tests: 5 new (parent.destroy() cascades, _children populated, deeply nested cascade)

### Factory rebuild (make*() + ComponentHandle bridge)

* [x] implement --> factory `_factory` stash on BCCL TACOs (for .set() triggering factory rebuild)
  - Wrapper around BCCL registry (~8 lines), not per-function edits
  - Files: `src/bitwrench-bccl.js` — `make()` function
* [x] implement --> factory rebuild in `ComponentHandle._flush()` (~25 lines)
  - When `_factory` exists and changed keys overlap factory props, call `bw.make(type, mergedProps)`
  - Files: `src/bitwrench.js` — constructor, `_flush()`
  - Tests: 6 new (factory stashed, rebuild on prop .set(), normal binding for non-props)
* [ ] discuss --> should `make*()` accept `{ reactive: true }` flag that auto-wraps in `bw.component()`?
* [ ] discuss --> or provide `bw.reactive(makeCard({...}))` as explicit sugar?

### Table enhancements

* [x] implement --> `selectable` prop + `onRowClick` callback + `bw_table_row_selected` CSS class on `makeTable()`
* [x] implement --> `pageSize`/`currentPage`/`onPageChange` props — pagination for `makeTable()`
* [x] document --> `col.render` cell renderer + selectable + pagination in `docs/component-library.md`

### Lifecycle cleanup

* [x] implement --> `updated` as alias for `onUpdate` (1 line)
* [x] doc --> `mounted`/`updated`/`unmount` as the "primary three" in `state-management.md` + `llm-bitwrench-guide.md`
* [x] doc --> soft-deprecate `willUpdate`/`willDestroy` as "rarely needed" in docs

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

## P3.5: Examples Gallery (v2.0.18)

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

---

## P4: TACO Shorthand (v2.0.x / v2.1.0)

Design doc: `dev/array_to_taco.md`

### bw.h() — TACO constructor (v2.0.x, low risk)

* [x] implement --> `bw.h(tag, attrs, content, opts)` — returns plain `{t,a,c,o}` TACO object (~5 lines)
  - All args optional except tag. Skippable: `bw.h('p', 'hello')` = `{t:'p', c:'hello'}`
  - Returns a plain serializable object, NOT a vnode — preserves bitwrench's differentiator
  - Files: `src/bitwrench.js`
  - Tests: 10+ (all arg combos, serializability, nested h() calls, undefined args omitted)

### Array shorthand (v2.1.0, needs compat audit)

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

## P5: bwserve Screenshot (v2.0.19 / v2.1.0)

Design doc: `dev/bw-screenshot-design.md`

**Killer feature**: Any server — LLM, embedded device, CI pipeline — can *see*
what it built. Visual feedback loop without Playwright/Puppeteer.

### Phase 1: Core protocol

* [ ] implement --> `client.screenshot(selector?, options?)` on `BwServeClient`
  - Returns `Promise<{ data: Buffer, width, height, format }>`
  - Options: format (png/jpeg), quality, maxWidth, maxHeight, scale, timeout
  - Uses requestId correlation: call → client captures → POST-back → resolve
  - Files: `src/bwserve/client.js`
* [ ] implement --> `_resolveScreenshot(requestId, result)` on `BwServeClient`
  - Resolves pending Promise, converts data URL to Buffer
  - Files: `src/bwserve/client.js`
* [ ] implement --> `/__bw/screenshot/:clientId` POST route in `BwServeApp`
  - Receives screenshot data from client, dispatches to `_resolveScreenshot()`
  - Files: `src/bwserve/index.js`
* [ ] implement --> `/__bw/vendor/:filename` GET route in `BwServeApp`
  - Serves vendored libraries (allowlisted filenames only)
  - Files: `src/bwserve/index.js`
* [ ] vendor --> `src/vendor/html2canvas.min.js` (v1.4.1, ~43KB, MIT license)
  - Load priority: window.html2canvas → vendor route → CDN fallback
  - NOT bundled into bitwrench.js — loaded on demand, first screenshot only
* [ ] implement --> Client-side capture function (registered as string)
  - html2canvas(element) → optional resize → toDataURL → POST back
  - Client-side resize via canvas drawImage (bilinear interpolation)
  - Files: string constant in `src/bwserve/client.js`
* [ ] implement --> `allowScreenshot` opt-in flag
  - Off by default. Set via `bwserve.create({ allowScreenshot: true })`
  - When off: `client.screenshot()` rejects immediately
* [ ] test --> Protocol round-trip unit tests (~15-20 tests)
  - call message structure, timeout rejection, error propagation
  - Opt-in enforcement, options pass-through, rate limiting
  - Files: `test/bitwrench_test_bwserve.js`

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
