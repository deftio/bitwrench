# QA Todo — feature/pages-polish-round2
[ ] create ->  lets create a script, that takes the current raw bitwrench.js and reads all the docstrings and spits out an bitwrench_api_vX.Y.X.md file using the doc strings.  It should be mechanical.  *all* functions* should  have good doc strings, if not make sure they do.  In the bitwrench_api_vX.Y.Z.md file I want a summary at the top (bitwrench version, date, numlines in bw source, and table of builds in md format which can use the json builds table we already build), then for each function:
```md
## Name 
lines-of-code
### Purpose 

### params ( ..) --> output

### When its used

### side effects

```    
* [ ] http://localhost:9903/pages/index.html > sub nav below hero syas: Install npm install bitwrench or <script src="bitwrench.umd.min.js"></script> Downloads & CDN (link)  ---> these should be links, and the script tag should be a cdn one not a local.  links to builds should be 
clear.  

* [ ] pages/ Main NavBard (white text on black) --> there are a lot of entries in it.  Perhaps API Reference --> docs, perhpas styling & themes become one menu option and we use a subnav like we do for examples (discuss this).  

* [ ] build size watch --> I really don't want bitwrench to go above 40KB at the most and really want it to say closer to 25KB in many circumstances.  A primary use case is our ESP32 / Microcontroller ui crowd.  With 40kb they can statically serve one bw page and pull/push ui opdates without having to use a cdn.  We may need a build which is bitwrench-core vs bitwrench vs bitwrench-embedded (select subset).  To test this make a standalone test page --> pages/self-load-test.html which is a single bitwrench page which has some content and locally loads bitwrench (full gzipped) itself in it. so we can test any issues.  


## P0: Blocks professional use

### Component interactivity gaps
* [x] fix --> modal backdrop click should close modal (already implemented, verified)
* [x] fix --> carousel keyboard navigation (left/right arrow keys, tabindex, pause on hover)
* [x] fix --> accordion collapse/expand CSS transition (smooth maxHeight animation, reflow trick)
* [x] fix --> dropdown menu fade-in transition (visibility+opacity+transform, no display:none)
* [x] fix --> modal entrance/exit animation (visibility+opacity, no display:none)
* [x] fix --> tabs keyboard arrow navigation (Left/Right/Home/End, tabindex roving)

### Accessibility
* [x] fix --> color contrast: warning badge #b38600 replaces #ffc107 (3.31:1 with white, passes WCAG 1.4.11)
* [x] fix --> color contrast: info badge #0891b2 replaces #0dcaf0 (3.70:1 with white, passes WCAG 1.4.11)
* [x] fix --> focus states: buttons now use outline+box-shadow (visible in high-contrast mode)
* [x] fix --> focus-visible added to dropdown items, list-group items, pagination links
* [x] fix --> form inputs focus uses outline (2px solid) + box-shadow for stronger visibility

### Theme toggle (primary / alternate) — REDESIGNED
* [x] fix --> `bw.generateTheme()` now always produces two palettes: primary + alternate (luminance-inverted)
* [x] fix --> Added `bw.applyTheme('primary'|'alternate'|'light'|'dark')` and `bw.toggleTheme()`
* [x] fix --> Removed hardcoded dark mode: `toggleDarkMode()`, `generateDarkModeCSS()`, `getDarkModeStyles()` deleted
* [x] fix --> Alternate CSS scoped under `.bw-theme-alt` — both palettes go through same `generateThemedCSS()` pipeline
* [x] fix --> Design doc: `dev/bw-theme-toggle-design.md`

## P1: Polish (makes or breaks first impression)

### CSS consistency
* [ ] fix --> no consistent spacing scale — buttons, badges, form inputs all use ad-hoc padding values
* [x] fix --> font-size scale defined: TYPE_RATIO_PRESETS + generateTypeScale() (tight/normal/relaxed/dramatic)
* [x] fix --> shadow scale defined: ELEVATION_PRESETS (flat/sm/md/lg) wired into cards, modals, toasts, dropdowns
* [x] fix --> transitions normalized: 3 tiers (0.15s/0.2s/0.3s) + ease-out consistently; badge em→rem; carousel caption 0.9→0.875rem
* [x] fix --> `@media (prefers-reduced-motion: reduce)` added to structural CSS
* [x] assessed --> line-height: consistent hierarchy (1.5 body, 1.6 text blocks, 1.25-1.3 headings/titles). No changes needed.
* [x] assessed --> font-weight: clear 4-tier system (300 display, 400 body, 500 interactive, 600 headings, 700 emphasis). No changes needed.

### Missing hover/interactive states
* [x] assessed --> table rows: hover exists in themed CSS (generateTables → `.bw-table-hover > tbody > tr:hover`); requires `.bw-table-hover` class. Not a structural CSS concern.
* [x] fix --> list-group items: added transition to `a.bw-list-group-item`
* [x] fix --> nav links: added `background-color` to `.bw-nav-link` transition

### Component API cleanup
* [x] assessed --> prop naming follows convention: `content` (content containers), `children` (layout wrappers), `text` (single-label), `items` (collections). Documented in JSDoc.
* [x] fix --> `makeTable()` vs `makeDataTable()` JSDoc clarified: makeTable = bare table, makeDataTable = with title + responsive wrapper
* [x] fix --> string shorthand: `makeButton('OK')`, `makeBadge('New')`, `makeAlert('msg')` now all work. 5 new tests.

### Pages polish
* [x] assessed --> 03-styling.html: sections 5 and 6 already have live try-it demos. No issue.
* [x] assessed --> 01-components.html: grid hex colors are demo visual aids (column differentiation), not component styles. Acceptable.
* [x] fix --> 01-components.html: carousel now shows auto-play demo (autoPlay: true, interval: 3000)
* [x] fix --> 01-components.html: added align:"end" dropdown example
* [x] fix --> 01-components.html: toast buttons now use createDOM+appendChild for proper stacking with auto-dismiss
* [x] fix --> index.html: feature cards now equal height (flex column fill)
* [x] fix --> index.html: install strip stacks vertically on mobile, code blocks have word-break

## P2: Missing components (framework parity)

### High-value missing components
* [x] add --> `makeTooltip()` — CSS-driven show/hide on hover/focus, 4 placements (top/bottom/left/right), lifecycle hooks, role=tooltip. 7 tests.
* [x] add --> `makePopover()` — click-triggered overlay with title + body, 4 placements, click-outside dismiss, mounted/unmount lifecycle. 7 tests.
* [x] add --> `makeStatCard()` — value + label + change indicator + format (number/currency/percent) + icon + variant. 8 tests. Replaces hardcoded dashboard pattern.
* [x] add --> form validation states — `bw-is-valid`/`bw-is-invalid` classes on inputs, `bw-valid-feedback`/`bw-invalid-feedback` text, `makeFormGroup()` enhanced with `validation`/`feedback`/`required` props. 8 tests.
* [x] add --> `makeFileUpload()` — drag-and-drop zone with hidden file input, keyboard accessible, dragover/dragleave/drop visual states. 7 tests.
* [x] add --> `makeRange()` — styled range slider with label + live value display, min/max/step, disabled state. 5 tests.
* [x] add --> `makeSearchInput()` — search input with clear button, onSearch/onInput callbacks, string shorthand. 5 tests.

### Medium-value missing components
* [x] add --> `makeTimeline()` — vertical timeline with date/title/content items, variant markers (primary/success/danger/etc), TACO content support. 7 tests.
* [x] add --> `makeStepper()` — numbered step indicator with completed/active/pending states, checkmark on completed, aria-current, description support. 7 tests.
* [x] add --> `makeChipInput()` — flex-wrap chip container with text input, Enter to add, Backspace to remove last, × remove button per chip, onAdd/onRemove callbacks. 6 tests.
* [x] add --> `makeMediaObject()` — image + text side-by-side flexbox layout, reverse mode, optional image. 5 tests.

### Component completeness
* [x] assessed --> pagination `onPageChange` — already shown in code sample on 01-components.html. Static demos show visual states; live page-change would require re-rendering which is a reactive pattern concern, not a component gap.
* [x] fix --> breadcrumb active state — added link colors (#006666), hover underline, font-weight: 500 on active item. 3 tests.
* [x] assessed --> `makeCodeDemo()` is ~80 lines (not 400+), thin wrapper around makeTabs with code/result split. Reasonable, no simplification needed.

## P3: Theming architecture

* [x] fix --> structural vs cosmetic CSS split — enforced through function separation: `getStructuralStyles()` (layout-only, 1 documented exception: progress bar stripe pattern), `defaultStyles.*` (cosmetic defaults), `generateThemedCSS()` (palette-driven). Policy comment added to JSDoc.
* [x] fix --> CSS custom properties not used — intentional for IE11 compat (Tier 1). Design note added documenting that `generateTheme()` provides full customization via class-scoped CSS generation. CSS variables can be added when IE11 is dropped without changing the API.
* [x] fix --> responsive breakpoints reconciled and documented — `bw.responsive()` now uses same values as grid/theme: sm=576, md=768, lg=992, xl=1200. Breakpoint reference table added to 03-styling.html. Tests updated.
* [x] fix --> underscore vs hyphen class naming documented — JSDoc added to `addUnderscoreAliases()` explaining canonical (hyphen) vs alias (underscore) forms. New "Class Naming Convention" section added to 03-styling.html with comparison table and `bw.normalizeClass()` tip.

---

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

### Automatic reactivity — component-level, not app-level

**Full design doc**: [`dev/reactivity-and-lifecycle-plan.md`](reactivity-and-lifecycle-plan.md)

Covers ComponentHandle API, template bindings (`'${expr}'`), targeted DOM
updates, lifecycle model, named actions, function registry (revived from v1),
`bw.when()`/`bw.each()` control flow, compile mode, and make*() evolution
plan (Phase 1-3).

### LLM UI generation

The killer use case. TACO is uniquely positioned for LLM-generated UIs:
- JSON-native — LLMs already output JSON fluently, no JSX/template parsing
- Component vocabulary — `makeCard`, `makeTable` etc. are higher-level
  than raw HTML, fewer tokens, fewer mistakes
- Self-contained components with get/set/pub/sub — LLMs don't need to
  emit manual DOM update boilerplate
- Server push via bw.remote() — LLM generates TACO on server, pushes
  to client in real time

**Pipeline**: LLM → TACO JSON → bw.remote() push → client render → compile

**Prerequisites (in order)**:
1. Components look good out of the box (this round of polish)
2. Reactivity is component-native (LLMs emit component defs, not render loops)
3. Server-side rendering works (bw.remote / SSE push)
4. Compilation works (TACO → optimized production code)

**Deferred until**: reactivity + server + compile are done. But these
prerequisites ARE the product. Polish them and the LLM story follows.
