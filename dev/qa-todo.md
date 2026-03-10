# QA Todo — feature/reactivity-cleanup (v2.0.15)

## Open items

* [ ] src/bitwrench-styles.js --> the built-in themes have unncessary "label" and "desc" fields.  For the lable any dev or ui can just capitlize the theme name from the dict, and for desc--> people will just pick the theme by looking at it not its flowerig desc.  Besure to make sure this doesn't break anything in pages/  
* [ ] create --> API doc generation script: reads bitwrench.js docstrings, produces bitwrench_api_vX.Y.Z.md with summary table (version, date, line count by file, builds) + per-function sections (Name, lines-of-code, Purpose, params-->output, When its used, side effects)
* [ ] pages/index.html sub-nav: install strip should have links, script tag should use CDN URL not local path, links to builds should be clear
* [ ] pages/ Main Navbar: consolidate entries — consider merging API Reference into "Docs", merging Styling & Themes into one option with subnav
* [ ] build size watch: target 25-40KB gzipped for ESP32/embedded crowd. Consider bitwrench-core vs bitwrench-embedded split. Create pages/self-load-test.html to validate single-page self-loading
* [ ] bitwrench logo in main banner should be slightly larger, as should bitwrench text
* [ ] CSS spacing scale: no consistent spacing scale — buttons, badges, form inputs all use ad-hoc padding values. Define 4px base (4, 8, 12, 16, 24, 32, 48) and enforce across components
* [ ] http://localhost:9903/pages/index.html --> On some viewports the word bitwrench is clipped in the navbar (Tested in chrome and firefox in ubuntu)

## Design explorations (plan before code)

### Component design system (track MUI / shadcn)

BCCL components should look like they came from a single designer. Currently
they feel assembled from different CSS snippets — inconsistent spacing, shadows,
transitions, color usage. Before adding new components, establish shared
design tokens that ALL components consume:

* [ ] define --> spacing scale (4px base: 4, 8, 12, 16, 24, 32, 48)
* [ ] define --> border-radius scale (none, sm, md, lg, pill) — already in RADIUS_PRESETS, enforce usage
* [ ] define --> color usage rules: when to use primary vs surface vs muted
* [ ] tune --> alternate derivation curves need tuning with all preset themes
* [ ] tune --> per-component dark appearance depends on alternate palette quality

Study MUI's design tokens, shadcn/ui's CSS variables, and Radix's component
primitives for reference. The theme generator is bitwrench's differentiator —
no other framework can regenerate an entire design system from 3 seed colors.
But the base components must be good enough that the generated themes look
professional, not like skinned Bootstrap 3.

### LLM UI generation

The killer use case. TACO is uniquely positioned for LLM-generated UIs:
- JSON-native — LLMs already output JSON fluently, no JSX/template parsing
- Component vocabulary — `makeCard`, `makeTable` etc. are higher-level
  than raw HTML, fewer tokens, fewer mistakes
- Self-contained components with get/set/pub/sub — LLMs don't need to
  emit manual DOM update boilerplate
- Server push via bw.remote() — LLM generates TACO on server, pushes
  to client in real time

**Pipeline**: LLM -> TACO JSON -> bw.remote() push -> client render -> compile

**Prerequisites (in order)**:
1. Components look good out of the box (this round of polish)
2. Reactivity is component-native (LLMs emit component defs, not render loops)
3. Server-side rendering works (bw.remote / SSE push)
4. Compilation works (TACO -> optimized production code)

**Deferred until**: reactivity + server + compile are done. But these
prerequisites ARE the product. Polish them and the LLM story follows.

---

## Completed in v2.0.15 (move to qa-completed.md at release)

### Reactivity system (Phase 1) — IMPLEMENTED
* [x] add --> ComponentHandle: unified reactive component class with .get()/.set()/.mount()/.destroy()
* [x] add --> Function registry: bw.funcRegister(), funcGetById(), funcGetDispatchStr(), funcUnregister()
* [x] add --> Template bindings: ${expr} in TACO content/attributes, Tier 1 (dot-path) + Tier 2 (new Function)
* [x] add --> Microtask batching: Promise.resolve().then(flush) with bw.flush() for sync testing
* [x] add --> Control flow: bw.when(expr, tacoTrue, tacoFalse), bw.each(expr, factory)
* [x] add --> bw.component() factory, bw.compile() pre-compilation
* [x] add --> Integration with bw.DOM(), bw.html(), bw.cleanup()
* [x] add --> 77 new tests (bitwrench_test_component_handle.js)

### Dead code elimination
* [x] remove --> 5 Handle classes (CardHandle, TableHandle, NavbarHandle, TabsHandle, ModalHandle) — superseded by ComponentHandle
* [x] remove --> componentHandles registry + create*() Handle wiring in bitwrench.js
* [x] remove --> Duplicate colorHslToRgb, colorRgbToHsl, colorParse from bitwrench.js (now imported from color-utils)
* [x] doc --> dev/dead-code-elimination-v2.0.15.md documents all removals with recovery code

### Previously completed (from v2.0.14 QA cycle)

#### P0: Blocks professional use
* [x] fix --> modal backdrop click, carousel keyboard nav, accordion transitions, dropdown/modal animations, tabs keyboard nav
* [x] fix --> color contrast (warning/info badges), focus states, focus-visible on interactive elements

#### P1: Polish
* [x] fix --> font-size scale, shadow scale, transitions normalized, reduced motion media query
* [x] fix --> list-group/nav-link hover transitions
* [x] fix --> prop naming convention documented, makeTable/makeDataTable JSDoc, string shorthand
* [x] fix --> pages polish (carousel autoplay, dropdown align, toast stacking, index cards/mobile)

#### P2: Missing components
* [x] add --> makeTooltip, makePopover, makeStatCard, form validation, makeFileUpload, makeRange, makeSearchInput
* [x] add --> makeTimeline, makeStepper, makeChipInput, makeMediaObject
* [x] fix --> breadcrumb active state, pagination/makeCodeDemo assessed

#### P3: Theming architecture
* [x] fix --> structural/cosmetic CSS split, CSS custom properties decision (IE11), responsive breakpoints, class naming convention

#### Theme toggle redesign
* [x] fix --> dual-palette system (primary + alternate), bw.applyTheme/toggleTheme, removed hardcoded dark mode
