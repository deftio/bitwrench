# QA Todo — feature/pages-polish-round2

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
* [ ] tune --> alternate derivation curves need tuning with all preset themes (follow-up PR)
* [ ] tune --> per-component dark appearance depends on alternate palette quality (follow-up)

## P1: Polish (makes or breaks first impression)

### CSS consistency
* [ ] fix --> no consistent spacing scale — buttons, badges, form inputs all use ad-hoc padding values
* [x] fix --> font-size scale defined: TYPE_RATIO_PRESETS + generateTypeScale() (tight/normal/relaxed/dramatic)
* [x] fix --> shadow scale defined: ELEVATION_PRESETS (flat/sm/md/lg) wired into cards, modals, toasts, dropdowns
* [ ] fix --> line-height inconsistent: tables 1.6, buttons unspecified, forms vary
* [ ] fix --> font-weight inconsistent: mix of 500 and 600 across components

### Missing hover/interactive states
* [ ] fix --> table rows: no hover highlight on interactive tables
* [ ] fix --> list-group items: no hover feedback
* [ ] fix --> nav links in shared-theme.css: no background-color transition

### Component API cleanup
* [ ] fix --> prop naming inconsistent: some use `content`, some `children`, some both
* [ ] fix --> `makeTable()` vs `makeDataTable()` — confusing. Document when to use which
* [ ] fix --> missing string shorthand: `makeButton('OK')` should work as shortcut for `makeButton({ text: 'OK' })`

### Pages polish
* [ ] fix --> 03-styling.html: sections 5 (responsive) and 6 (mixing approaches) have empty demo areas
* [ ] fix --> 01-components.html: grid examples use hardcoded hex colors instead of theme tokens
* [ ] fix --> 01-components.html: no auto-play carousel demo shown
* [ ] fix --> 01-components.html: dropdown only shows left-aligned; add align:"end" example
* [ ] fix --> 01-components.html: toast shows static preview but no stacking/auto-dismiss demo
* [ ] fix --> index.html: feature cards different heights due to text length (no equal-height grid)
* [ ] fix --> index.html: install strip text wrapping poor on tablet widths

## P2: Missing components (framework parity)

### High-value missing components
* [ ] add --> `makeTooltip()` / `makePopover()` — essential for any component library
* [ ] add --> `makeStatCard()` — dashboard pages hardcode this pattern; should be a helper
* [ ] add --> form validation states — error borders, help text, success feedback on inputs
* [ ] add --> `makeFileUpload()` — styled file input with drag-and-drop zone
* [ ] add --> `makeSlider()` / `makeRange()` — styled range input
* [ ] add --> `makeSearchInput()` — input with filter/autocomplete pattern

### Medium-value missing components
* [ ] add --> `makeTimeline()` — chronological event display
* [ ] add --> `makeStepper()` — multi-step wizard UI
* [ ] add --> `makeChipInput()` — tag/chip input with removable items
* [ ] add --> `makeMediaObject()` — image + text side-by-side layout

### Component completeness
* [ ] fix --> pagination `onPageChange` not wired in demos — show working example
* [ ] fix --> breadcrumb active state styling unclear
* [ ] fix --> `makeCodeDemo()` is 400+ lines for a narrow use case — consider simplifying

## P3: Theming architecture

* [ ] fix --> structural vs cosmetic CSS split not enforced in code (documented but not real)
* [ ] fix --> no CSS custom properties in component rules (hardcoded colors everywhere)
* [ ] fix --> responsive breakpoint values not documented anywhere user-facing
* [ ] fix --> underscore vs hyphen class naming still creates confusion (dual selectors)

---

## Design explorations (plan before code)

### Component design system (track MUI / shadcn)

BCCL components should look like they came from a single designer. Currently
they feel assembled from different CSS snippets — inconsistent spacing, shadows,
transitions, color usage. Before adding new components, establish shared
design tokens that ALL components consume:

* [ ] define --> spacing scale (4px base: 4, 8, 12, 16, 24, 32, 48)
* [x] define --> font-size scale: TYPE_RATIO_PRESETS + generateTypeScale() — modular scale from ratio
* [x] define --> shadow elevation scale: ELEVATION_PRESETS (flat/sm/md/lg × sm/md/lg/xl)
* [x] define --> motion/transition curves: MOTION_PRESETS (reduced/standard/expressive × fast/normal/slow+easing)
* [ ] define --> border-radius scale (none, sm, md, lg, pill) — already in RADIUS_PRESETS, enforce usage
* [ ] define --> color usage rules: when to use primary vs surface vs muted

Study MUI's design tokens, shadcn/ui's CSS variables, and Radix's component
primitives for reference. The theme generator is bitwrench's differentiator —
no other framework can regenerate an entire design system from 3 seed colors.
But the base components must be good enough that the generated themes look
professional, not like skinned Bootstrap 3.

### Automatic reactivity — component-level, not app-level

**Design lineage**: Windows MFC, Java Swing, Borland C++ OWL/VCL. In those
frameworks, a UI control (CButton, JTextField, TEdit) was a self-contained
object that owned its rendering. You called `SetWindowText()` or `setText()`
— the control repainted itself. You didn't reach inside and manipulate the
device context or graphics buffer. The OS/runtime was the assembly language;
the component API was the programming model.

**Bitwrench BCCL follows this philosophy.** The "assembly language" is
JS + DOM + CSS. A TACO component definition is the equivalent of a Win32
window class registration + creation — it declares what the component is,
how it renders, what state it manages. The `make*()` factory returns a
component object with methods, just like `new CButton()` returned a control
with `SetWindowText()`.

What we have now (`o.render` + manual `bw.update()`) is like writing Win32
in raw C — `CreateWindowEx()`, `SendMessage(hwnd, WM_SETTEXT, ...)`,
manually pumping the message loop. That's the low-level layer (and should
stay available), but BCCL components should encapsulate it completely.

**Core design intent (per Manu)**: A TACO component is a complete component
specification — not a DOM enhancement object. BCCL `make*()` factories
should return self-contained components with internal state management.
The user never calls `bw.update()` for internal state changes. They interact
through getters/setters and pub/sub at the component boundary.

**How it should work**:
```javascript
// Component definition with reactive bindings:
var card = bw.makeCard({
  title: 'Users Online',
  content: '${count}',                        // template binding
  variant: '${count > 100 ? "success" : "warning"}'  // derived
});

// Component manages its own DOM updates:
card.set('count', 42);     // card re-renders internally
card.get('count');          // → 42
card.on('click', handler); // event interface
card.sub('data:update', function(d) { card.set('count', d.n); });

// Or via pub/sub for cross-component:
bw.pub('data:update', { n: 99 }); // card auto-updates
```

**What this means for implementation**:
1. `make*()` factories compile template strings (`'${expr}'`) into
   internal render functions that know which state keys they depend on
2. State is wrapped in Proxy (or ODP fallback) — mutations auto-trigger
   only the affected DOM nodes, not a full re-render
3. Component exposes `.get()`, `.set()`, `.on()`, `.sub()` — no direct
   DOM access needed by consumer
4. `o.render` remains available as escape hatch for fully custom components
5. `bw.update()` and `bw.patch()` remain for manual/perf-critical paths

**Key distinction from my earlier (wrong) framing**:
- WRONG: "wrap el._bw_state in Proxy, auto-call bw.update()" — this is
  jQuery thinking. The user shouldn't know about `el._bw_state` at all.
- RIGHT: the component IS the abstraction. State is internal. The public
  API is get/set/on/sub. The TACO definition compiles to self-managing
  DOM code, just like Svelte compiles .svelte files.

**Design questions**:
- Template syntax: `'${expr}'` is natural JS but conflicts with template
  literals in ES6. Alternative: `'{{expr}}'` (Mustache-style) or
  `{ bind: 'count' }` (object form). Need to decide.
- Nested reactivity: `card.set('user.name', 'Alice')` — dot-path or
  only top-level keys?
- Array reactivity: push/pop/splice on state arrays — track mutations
  or require `card.set('items', newArray)`?
- IE11: Proxy not available. ODP works for known keys but can't detect
  new property addition. Accept this limitation for Tier 1?
- Does `bw.render()` (the existing handle system) become the basis for
  this? It already has setState, setProp, show/hide, destroy.

**Target**: Design doc first (`dev/bw-reactivity-design.md`). This is the
most important architectural decision remaining. Get it right before coding.

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
