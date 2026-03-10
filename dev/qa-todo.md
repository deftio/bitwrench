# QA Todo — feature/reactivity-cleanup (v2.0.15)

## Open items

* [ ] discuss --> what are the current gaps in component level reactivity?  Look at our design docs in dev/

## Remaining design explorations (not yet implemented)

## Design explorations (plan before code)

### Component design system (track MUI / shadcn)

BCCL components should look like they came from a single designer. Currently
they feel assembled from different CSS snippets — inconsistent spacing, shadows,
transitions, color usage. Before adding new components, establish shared
design tokens that ALL components consume:

* [x] define --> spacing scale (4px base: 4, 8, 12, 16, 24, 32, 48) — SPACING_SCALE added, SPACING_PRESETS updated
* [ ] define --> border-radius scale (none, sm, md, lg, pill) — already in RADIUS_PRESETS, enforce usage
* [x] define --> color usage rules: background/surface tokens added to palette output
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

### QA fixes (v2.0.15 round 2)
* [x] fix --> Removed label/desc from THEME_PRESETS, updated pages/10-themes.html + test/bitwrench_test_cli.js
* [x] fix --> Logo and bitwrench text enlarged in banner (36px->42px, mobile 22px->26px)
* [x] fix --> Navbar text clipping: reduced link padding, added 1024px breakpoint, reduced font-size
* [x] fix --> Theme persistence bug: bw._activeThemeStyleIds tracks and removes stale <style> elements
* [x] fix --> index.html install strip: CDN URL, prominent Downloads link
* [x] fix --> 09-builds.html: "Addons" -> "Addon Bundles", added code-edit ESM/CJS/ES5 descriptions
* [x] fix --> Navbar: API Reference+Builds -> "Docs" dropdown; Styling and Themes remain separate top-level items
* [x] add --> SPACING_SCALE constant (4px base), SPACING_PRESETS now references scale values
* [x] add --> palette.background + palette.surface tokens, generateResetThemed uses palette.background
* [x] add --> tools/build-api-markdown.js: generates dist/bitwrench_api_v{VERSION}.md from JSDoc
* [x] add --> pages/self-load-test.html: load timing, bundle sizes, health checks
* [x] doc --> 10-themes.html: added "Applying Themes" section (whole-page, scoped, switching with bw.clearTheme())
* [x] doc --> 10-themes.html: added "Background & Surface Colors" section with live swatches and override example
* [x] doc --> 10-themes.html: renamed multi-theme section to "Mixed Themes on One Page" with clearer explanation
* [x] doc --> bw.generateTheme() JSDoc updated with background/surface config params
* [x] fix --> Theme scope applied to #app not body (prevents navbar from being themed)
* [x] fix --> palette.surface wired into all component backgrounds (card, input, select, list-group, pagination, accordion, modal, toast, dropdown)
* [x] fix --> generateResetThemed also applies background to scope element itself (not just body descendant)
* [x] add --> Background/Surface color pickers in theme generator with Auto reset buttons
* [x] add --> Layered explainer graphic in Background & Surface section (background → surface → components)

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
