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

* [ ] doc --> `bw.raw()` needs a spotlight — user used innerHTML for hero title when `bw.raw()` was the answer
* [ ] doc --> `onclick` (and other event attributes) as primary event pattern — simpler than `o.mounted` + `addEventListener`
* [ ] doc --> pattern for ephemeral UI (toasts, slide-over panels) without raw DOM
* [ ] doc --> pattern for data-driven filtered lists in `bw.component()` (coffee filter/search use case)
* [ ] doc --> theme palette tokens accessible in custom `bw.css()` — show how to reference palette colors
* [ ] doc --> pattern for child widget updates within a ComponentHandle (progress bar use case)

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

* [ ] implement --> `selectable` prop + `onRowClick` callback + `bw_table_row_selected` CSS class on `makeTable()`
* [ ] implement --> `pageSize`/`currentPage`/`onPageChange` props — pagination for `makeTable()`
* [ ] document --> existing `col.render` cell renderer in `docs/component-library.md`

### Lifecycle cleanup

* [ ] implement --> `updated` as alias for `onUpdate` (1 line)
* [ ] doc --> `mounted`/`updated`/`unmount` as the "primary three" in docs
* [ ] doc --> soft-deprecate `willUpdate`/`willDestroy` in docs only (no code removal)

### ComponentHandle cleanup (deferred)

* [ ] cleanup --> `_deepCloneTaco`, `_tacoForDOM` refactor (avoid TACO mutation)
* [ ] implement --> list reorder helper (insertBefore-based, ~5 lines)

---

## P2.5: Bundle Size Management

Current sizes (v2.0.16):
- **bitwrench.umd.min.js** (full): 146KB raw, **38.9KB gzipped** — under 45KB budget
- **bitwrench-lean.umd.min.js** (no BCCL): 113KB raw, **29.9KB gzipped**
- **BCCL layer**: ~9KB gzipped delta (50+ make*() components)

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

## Deferred / Future

* [ ] implement --> Declarative events (`o.events`) in `bw.createDOM()` — sendValue, debounce, throttle, sendForm
* [ ] implement --> DOM morphing for `replace` — preserve local state (scroll pos, expanded accordions)
* [ ] implement --> Form data serialization in actions (sendForm: '#my-form')
* [ ] implement --> WebSocket transport option
* [ ] implement --> `bwcli serve` file watching and live reload
* [ ] implement --> `bw.morph(target, newTaco)` — update DOM in-place, preserving state of unchanged subtrees
* [ ] decide --> Optimistic updates: client-side immediate response while waiting for server
* [ ] decide --> Event batching: multiple actions in same frame → single POST
* [ ] implement --> Remote screenshot via bwcli debug protocol
* [ ] make --> `examples/llm-chat-advance` (deferred to separate repo — requires markdown rendering + image display)
