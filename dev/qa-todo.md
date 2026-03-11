# QA Todo — feature/phase2-component-handles (v2.0.16)

Updated 2026-03-10.

---

## P0: Documentation Blitz (v2.0.16)

The three-level component model (TACO → DOM → ComponentHandle) shipped in v2.0.15
with 77 tests, but documentation outside `dev/` and `pages/11-debugging.html` still
teaches only the old `el._bw_state + bw.update()` pattern. The README, state page,
and there is no standalone docs directory. Fix all of this before any new features.

### Create `docs/` directory

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

### `docs/state-management.md` — Comprehensive State Guide

Write a single authoritative markdown doc covering all three tiers. Target audience:
developer coming from React/Vue/Svelte who wants to understand bitwrench's approach.

Must cover:

**1. Three-level materialization model**
* Level 0: TACO as data/intent (what `make*()` returns, serializable, sendable over wire)
* Level 1: Fire-and-forget DOM rendering (`bw.DOM()`, `bw.html()`, `bw.createDOM()`)
* Level 2: ComponentHandle with managed API (`bw.component()`)
* When to use each level — decision guide with examples
* Escalation: Level 0 → Level 2 via `bw.component(makeCard({...}))`

**2. ComponentHandle API**
* `.get(key)`, `.set(key, val)`, `.getState()`, `.setState(updates)`
* `.mount(el)`, `.unmount()`, `.destroy()`
* `.on()`, `.off()`, `.sub()` (with auto-cleanup)
* `.action()`, `.select()`, `.selectAll()`
* `.userTag(tag)` for addressing
* `o.methods` promotion — define behavior, call as `handle.myMethod(data)`
* Template bindings: `${expr}` with auto-update on `.set()`
* Microtask batching (multiple `.set()` calls → one render flush)
* `bw.when()`, `bw.each()` control flow helpers

**3. Low-level APIs (the "Win32" layer)**
* `o.state` + `o.render` + `bw.update(el)` — manual render pump
* `bw.patch(uuid, content, attr)` — targeted DOM update by UUID
* `bw.patchAll({id: content})` — batch patch
* `bw.uuid(prefix)` — addressable element IDs
* `bw.emit(el, event, detail)` / `bw.on(el, event, handler)` — DOM-scoped events
* `bw.pub(topic, detail)` / `bw.sub(topic, handler, el?)` — app-scoped pub/sub
* When low-level is the right choice (custom components, escape hatches, bwserve transport)

**4. `make*()` functions and the three-tier model**
* `make*()` returns Level 0 TACO — pure data, no reactivity
* Composing TACOs before materialization (nesting, array content, factory patterns)
* Escalating to Level 2: `bw.component(makeCard({...}))` wraps any TACO in a handle
* Syntactic sugar discussion: `make*()` as intent declarations, `bw.component()` as the "activate" step
* Pattern: factory function that returns ComponentHandle with o.methods for the component type
* Example: wrapping makeCard in a reactive factory with `.setTitle()`, `.setContent()` via o.methods
* Note: make*() intentionally returns Level 0 — this is a feature, not a bug (keeps them serializable, composable, SSR-friendly)

**5. Cross-component communication patterns**
* Parent-child: nested TACOs, shared state object
* Sibling: `bw.pub()/sub()` with topic conventions
* Server-driven: `bw.message(target, action, data)` — Win32 SendMessage pattern
* `bw.inspect()` for debugging — console as DevTools

**6. Comparison with other frameworks**
* React: useState/useEffect → bw.component() + .set() + o.methods
* Vue: reactive refs → .get()/.set(), computed → template bindings
* Svelte: $state → .set(), $derived → ${expr} bindings
* Streamlit: server state push → bw.message() + bw.patch()
* Key difference: no VDOM, no compiler required, three explicit materialization levels

### Update README.md — DONE

* [x] update --> "Adding State" section: ComponentHandle as primary pattern, o.render as low-level link
* [x] update --> Core API table: added `bw.component()`, `bw.message()`, `bw.inspect()`
* [x] update --> Documentation links: added links to all docs/ guides

### Update `pages/05-state.html`

* [x] update --> Add new Section 1b: "ComponentHandle — The Recommended Pattern"
  - Shows `bw.component()` with template bindings, o.methods, framework comparison table
  - Try-it editor with live demo
* [x] update --> Reframe existing o.render sections as "Low-Level Pattern" (still valid, not deprecated)
  - Section 2 renamed to "Low-Level State: o.render + bw.update()"
  - Section 3 renamed to "Encapsulated Components (Low-Level)" with "prefer bw.component()" callout
* [ ] update --> Add section: "Which Pattern to Use?" decision table
  - Static content → Level 0 TACO (make*(), bw.html())
  - Render-once interactive → Level 1 (o.render + bw.update)
  - Managed stateful component → Level 2 (bw.component + .set())
* [ ] update --> Add section: "Wrapping make*() in ComponentHandle" with practical example
* [ ] update --> Add bw.message() example (server-driven update simulation)
* [ ] make --> a examples/llm-chat which is a stand alone example using python which has a streamlit like chat with an llm with real llm integraiton (example can use ollama | lm studio | openrouter) to do a nice chat window.  
* [ ] make --> a examples/llm-chat-advance which is a stand alone example using python which has a streamlit like chat with an llm with real llm integraiton (example can use ollama | lm studio | openrouter) to do a nice chat window but allows users to see markdown or images in the chat dynamically (this might be a stand alone repo -- discuss)

### Quick Start & Tutorials

Quick start must take someone from zero to a working app. Then longer tutorials guide
them through building real projects.

* [ ] rewrite --> `pages/00-quick-start.html`: proper onboarding from nothing to a simple app
  - Step 1: include bitwrench (CDN one-liner)
  - Step 2: first TACO render (bw.DOM)
  - Step 3: add a component (makeCard)
  - Step 4: add interactivity (bw.component + .set())
  - Step 5: add styling (loadDefaultStyles + generateTheme)
  - Must feel like "5 minutes to your first app"
* [ ] create --> `docs/tutorial-website.md`: longer tutorial building a complete multi-page website
  - Landing page with hero, features, CTA
  - Dashboard with stat cards, charts, tables
  - Forms with validation
  - Navigation between pages
  - Theming and responsive design
* [ ] create --> `docs/tutorial-bwserve.md`: tutorial building a Streamlit-style server app
  - Server state + SSE push
  - Interactive controls sending actions back
  - Real-time data updates
  - Deployment patterns
* [ ] create --> `docs/tutorial-embedded.md`: ESP32/IoT dashboard tutorial
  - C++ Arduino sketch serving static HTML
  - JSON state updates over SSE
  - bitwrench client rendering sensor data
  - Minimal memory footprint considerations

### Standalone Examples (`examples/`)

Cloneable, runnable example projects in `examples/` directory. Each should be
self-contained and work without a build step.

* [ ] create --> `examples/static-page/` — static page built with bitwrench
  - Single HTML file using CDN bitwrench
  - Landing page with hero, feature grid, contact form
  - Shows Level 0 TACO composition, makeCard, makeHero, makeForm
* [ ] create --> `examples/reactive-ui/` — interactive single-page app
  - Todo list or dashboard with live state
  - Uses bw.component() with template bindings
  - Shows Level 2 ComponentHandle pattern end-to-end
  - Pub/sub for cross-component communication
* [ ] create --> `examples/client-server/` — bwserve client-server app
  - Node.js server using bwserve library
  - SSE push for live updates
  - User actions sent back to server
  - Counter + dashboard demo
* [ ] create --> `examples/embedded/` — ESP32/IoT embedded dashboard
  - C++ Arduino sketch with embedded HTML
  - JSON endpoint for sensor data
  - SSE stream for real-time updates
  - bitwrench client rendering gauges, charts, status cards
  - Minimal footprint (< 10KB HTML payload)

### Other documentation tasks

* [x] fix --> `pages/11-debugging.html`: contrast issues — added explicit bg/color to `.api-table code`
* [x] update --> `dev/bitwrench-todo.md`: fixed stale items (LLM guide, v2.0.15 work, ComponentHandle, bwserve plan)
* [ ] update --> navbar on all pages: add "Docs" link pointing to docs/ or GH Pages docs section
* [x] fix --> `dev/coming-from-other-frameworks.md` — updated all 8 framework bridge tables with ComponentHandle, .get/.set, template bindings; updated cross-cutting concerns, reactivity section
* [ ] document --> Users can create custom TACO components without BCCL. BCCL is a convenience library, not a requirement. Users can write raw `{t, a, c, o}` objects, compose their own component factories, or wrap existing CSS frameworks (Bootstrap, Tailwind, etc.) in TACO objects. This should be clearly stated in the Quick Start, Component docs, and the LLM guide. Example: `{ t: 'button', a: { class: 'btn btn-primary' }, c: 'Click me' }` works fine — bitwrench doesn't care where the CSS classes come from.

### Stale docs culled

* [x] archived --> 9 superseded docs moved to `dev/archive/`:
  - `bccl-components-representation.md` (trie-packing, not pursued)
  - `bccl-single-class-theme.md` (superseded by generateTheme)
  - `bitwrench-todo.md` (replaced by qa-todo.md)
  - `bw-theme-metaparams-design.md` (superseded by actual implementation)
  - `reactivity-and-lifecycle-plan.md` (superseded by ComponentHandle)
  - `dead-code-elimination-v2.0.15.md` (version-specific historical)
  - `v2.0.15-2026-03-08-size-analysis.md` (version-specific historical)
  - `perf-examination-plan.md` (not pursued)
  - `llm-bitwrench-guide.md` (replaced by docs/llm-bitwrench-guide.md)
* [x] fix --> `dev/bitwrench-todo.md` says "LLM One-Pager — NOT STARTED" — marked DONE
* [x] fix --> `dev/bitwrench-todo.md` "Completed" section — added v2.0.15: ComponentHandle, three-level model, 77 tests, dead code elimination, reactivity Phase 1
* [x] fix --> `dev/bitwrench-todo.md` "Future" section — bwserve now has concrete plan with client/server breakdown
* [x] fix --> `dev/bitwrench-todo.md` "State Management — DONE (v2.0.3)" — split into low-level (v2.0.3) + ComponentHandle (v2.0.15)

---

## P1: Mobile Responsiveness — pages/ site + default theme

The bitwrench pages/ website has mobile layout issues: side margins too small,
text overflowing containers. Both the default styles and the theme-generated
CSS need audit. Must be covered by automated Playwright tests.

### Audit and fix

* [ ] fix --> `pages/*.html`: audit all pages on mobile viewport (375px, 414px). Fix margin/padding issues where text overflows or touches screen edges.
* [ ] fix --> `src/bitwrench-styles.js`: audit default container, card, table, code block styles for mobile. Ensure `max-width: 100%`, `overflow-x: auto` on tables/pre, proper `padding` on containers at small viewports.
* [ ] fix --> `src/bitwrench-styles.js` + theme CSS: audit `@media` breakpoints. Ensure they cover 375px (iPhone SE), 414px (iPhone Plus), 768px (tablet). Fix any hard-coded widths or margins that break at small sizes.
* [ ] fix --> Generated theme CSS (`bw.generateTheme()`): ensure themed components (cards, alerts, navbars) inherit responsive behavior from base styles. Check that theme-specific padding/margin doesn't override responsive rules.

### Playwright mobile tests

* [ ] test --> Add mobile viewport Playwright tests (375px width) for all pages:
  - No horizontal scrollbar on any page
  - All text stays within its container (no overflow)
  - Nav/navbar collapses or wraps properly
  - Tables have `overflow-x: auto` scroll (not page overflow)
  - Cards stack vertically (no side-by-side at 375px)
  - Code blocks don't push containers wider than viewport
  - Form inputs are full-width on mobile
* [ ] test --> Add tablet viewport Playwright tests (768px width) for key pages
* [ ] test --> Add these to CI pipeline (`npm run test:playwright` should include mobile)

---

## P1: bwserve — Server-Driven UI (v2.0.16)

Server-push UI using SSE. Three target scenarios: Streamlit-style apps,
embedded device dashboards (ESP32), and agent-driven UI. Design docs exist
(`dev/bw-client-server.md`, `dev/bw-stream-agent-protocol-draft-2026-03-06.md`).

### Client-side additions (in bitwrench.js) — IMPLEMENTED

* [x] implement --> `bw.clientConnect(url, opts)` — establish SSE/poll connection, return connection object
  - opts: { transport: 'sse'|'poll', interval, reconnect, onStatus, actionUrl }
  - Returns: `{ sendAction(action, data), on(event, handler), close(), status }`
  - Auto-reconnect for SSE (EventSource does this natively)
* [x] implement --> `bw.clientApply(msg)` — message dispatcher for 5 types + message
  - replace → `bw.DOM(target, node)`
  - append → `target.appendChild(bw.createDOM(node))`
  - remove → `bw.cleanup(target); target.remove()`
  - patch → `bw.patch(target, content, attr)`
  - batch → sequential `clientApply()` per operation
  - message → `bw.message(target, action, data)`
* [x] implement --> Connection lifecycle: "connecting", "connected", "disconnected" via onStatus callback
* [ ] implement --> Declarative events: `o.events: { click: { action: 'increment', sendValue: true } }` in `bw.createDOM()`
  - Deferred: `data-bw-action` attribute covers the 80% case; o.events is Phase 2

### Server-side runtime (`src/bwserve/`) — IMPLEMENTED

* [x] implement --> `src/bwserve/index.js` — Full HTTP/SSE server (zero runtime deps, Node.js stdlib only)
  - `bwserve.create({ port, static, title, theme })` → BwServeApp
  - `app.page(path, handler)`, `app.listen()`, `app.close()`, `app.clientCount`
  - Routes: page shell, SSE events, action POST, static files, bitwrench assets
  - Builds to `dist/bwserve.cjs.js` + `dist/bwserve.esm.js` via rollup
* [x] implement --> `src/bwserve/client.js` — BwServeClient with real SSE transport
  - `client.render()`, `.patch()`, `.append()`, `.remove()`, `.batch()`, `.message()`
  - `client.on(action, handler)` + `client._dispatch()` for incoming actions
  - `_send()`: writes SSE frames + stores in `_sent[]` for testing
* [x] implement --> `src/bwserve/shell.js` — Page shell generator
  - Auto-injects bitwrench UMD + CSS from `/__bw/` routes
  - Bootstrap: `bw.loadDefaultStyles()`, `bw.clientConnect()`, `data-bw-action` delegation
* [x] implement --> SSE stream management: keep-alive (15s), client tracking, cleanup on disconnect
* [ ] implement --> `bitwrench serve` actual dev server with file watching and live reload

### Documentation — IMPLEMENTED

* [x] create --> `pages/12-bwserve-protocol.html` — Protocol reference page (spec, schemas, examples)
* [x] update --> `docs/bwserve.md` — Full user guide (getting started, API, protocol, transport)
* [x] update --> `pages/shared-nav.js` — bwserve primary nav item + Protocol/Sandbox sub-nav
* [x] update --> `pages/bwserve-sandbox.html` — Linked from main nav (was standalone)

### Tests — IMPLEMENTED

* [x] test --> `bw.clientApply()`: all 5 message types + error cases (14 tests)
* [x] test --> `BwServeClient`: message format, SSE frame format, dispatch, chaining (15 tests)
* [x] test --> `BwServeApp`: create, page registration, listen/close lifecycle (5 tests)
* [x] test --> Round-trip: client.render() → _sent → clientApply() → DOM verification (4 tests)
* [x] test --> `bw.clientConnect()`: API shape, connection object (3 tests)
* Total: 42 new tests in `test/bitwrench_test_bwserve.js`

### Demos and examples (future)

* [ ] create --> `examples/serve-counter.js` — minimal Streamlit-style counter (~30 lines)
* [ ] create --> `examples/serve-dashboard.js` — multi-card dashboard with live data
* [ ] create --> `examples/serve-esp32-mock.js` — simulated embedded device SSE

### Future work

* [ ] implement --> Declarative events (`o.events`) in `bw.createDOM()` — sendValue, debounce, throttle, sendForm
* [ ] implement --> `bw.clientParse()` relaxed JSON for ESP32 (single-quoted keys, trailing commas)
* [ ] implement --> DOM morphing for `replace` — preserve local state (scroll pos, expanded accordions)
* [ ] implement --> Form data serialization in actions (sendForm: '#my-form')
* [x] implement --> `client.register()` / `client.call()` / `client.exec()` three-tier execution model — 6 built-in call functions (scrollTo, focus, download, clipboard, redirect, log), allowExec opt-in, 71 bwserve tests
* [ ] implement --> WebSocket transport option
* [ ] decide --> Optimistic updates: client-side immediate response while waiting for server
* [ ] decide --> Event batching: multiple actions in same frame → single POST

---

## P2: Component ergonomics (post-bwserve, informed by usage)

Items deferred from v2.0.15 plus new items that bwserve will likely surface.

### Factory rebuild (make*() + ComponentHandle bridge)
* [ ] implement --> factory `_factory` stash on BCCL TACOs (for .set() triggering factory rebuild)
* [ ] implement --> factory rebuild in `ComponentHandle._flush()` (~25 lines)
* [ ] discuss --> should `make*()` accept `{ reactive: true }` flag that auto-wraps in `bw.component()`?
* [ ] discuss --> or provide `bw.reactive(makeCard({...}))` as explicit sugar?

### ComponentHandle cleanup
* [ ] cleanup --> `_deepCloneTaco`, `_tacoForDOM` refactor (avoid TACO mutation)
* [ ] cleanup --> reduce lifecycle hooks from 6 to 3 (mounted, updated, unmount)
* [ ] implement --> child component ownership (parent.destroy() cascades to children)
* [ ] implement --> list reorder helper (insertBefore-based, ~5 lines)

### DOM morphing
* [ ] implement --> `bw.morph(target, newTaco)` — update DOM in-place, preserving state of unchanged subtrees
  - Needed when server does `client.render()` and user has local state (expanded menus, scroll position)
  - Study: morphdom, idiomorph (htmx) for approach
  - Defer until bwserve users actually complain about state loss on replace

---

## P2.5: Bundle Size Management

Current sizes (v2.0.16):
- **bitwrench.umd.min.js** (full): 146KB raw, **38.9KB gzipped** — under 45KB budget
- **bitwrench-lean.umd.min.js** (no BCCL): 113KB raw, **29.9KB gzipped**
- **BCCL layer**: ~9KB gzipped delta (50+ make*() components)

Source breakdown: core 4222 LOC (40%), styles 2236 LOC (21%), BCCL 3614 LOC (34%), color 438 LOC (4%).

Three-tier build now available:
- `bitwrench` = full batteries-included (38.9KB gz)
- `bitwrench-lean` = core without BCCL (29.9KB gz)
- `bitwrench-bccl` = standalone BCCL addon (10.0KB gz) — use with lean for split bundle

Package.json exports: `"."`, `"./lean"`, `"./bccl"`, `"./bwserve"`

### If we approach 45KB limit

* [ ] analyze --> identify CSS generation bloat in bitwrench-styles.js (largest growth risk)
* [x] implement --> three-tier build: `bitwrench-lean` (core), `bitwrench-bccl` (components addon), `bitwrench` (full)
  - Entry: `src/bitwrench-bccl-entry.js`, UMD auto-registers onto global `bw`
  - Rollup config, package.json exports, all formats (UMD/ESM/CJS raw+min)
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

## Completed (v2.0.15) — move to qa-completed.md at release

### Reactivity system (Phase 1) — IMPLEMENTED
* [x] add --> ComponentHandle: unified reactive component class with .get()/.set()/.mount()/.destroy()
* [x] add --> Function registry: bw.funcRegister(), funcGetById(), funcGetDispatchStr(), funcUnregister()
* [x] add --> Template bindings: ${expr} in TACO content/attributes, Tier 1 (dot-path) + Tier 2 (new Function)
* [x] add --> Microtask batching: Promise.resolve().then(flush) with bw.flush() for sync testing
* [x] add --> Control flow: bw.when(expr, tacoTrue, tacoFalse), bw.each(expr, factory)
* [x] add --> bw.component() factory, bw.compile() pre-compilation
* [x] add --> Integration with bw.DOM(), bw.html(), bw.cleanup()
* [x] add --> 77 new tests (bitwrench_test_component_handle.js)

### Three-level component materialization — IMPLEMENTED
* [x] implement --> o.methods promotion to ComponentHandle API
* [x] implement --> ComponentHandle.prototype.userTag(id)
* [x] implement --> bw.message(target, action, data)
* [x] implement --> bw.inspect(el_or_selector)
* [x] implement --> ComponentHandle detection in bw.createDOM() and bw.html() content walkers
* [x] test --> 77 ComponentHandle tests, 880 total tests, 97.51% statement coverage
* [x] docs --> pages/11-debugging.html, dev/llm-bitwrench-guide.md updated

### QA fixes (v2.0.15)
* [x] fix --> theme persistence, navbar clipping, logo sizing, install strip, builds page
* [x] add --> SPACING_SCALE, palette.background/surface tokens, API markdown generator, self-load-test page
* [x] doc --> 10-themes.html sections: applying themes, background/surface colors, mixed themes

### Dead code elimination
* [x] remove --> 5 old Handle classes, componentHandles registry, duplicate color functions (~498 lines)
* [x] doc --> dev/dead-code-elimination-v2.0.15.md with recovery code

### Doc cleanup (v2.0.16)
* [x] archive --> moved `dev/bitwrench-serve-and-protocol.md` → `dev/archive/` (superseded by bw-client-server.md)
* [x] archive --> moved `dev/bccl-component-redux.md` → `dev/archive/` (superseded by bccl-components-representation.md)
* [x] scaffold --> bwserve library stubs (`src/bwserve/`) + CLI `bitwrench serve` subcommand
* [x] build --> bwserve integrated into rollup + package.json exports

### Documentation Blitz (v2.0.16)
* [x] create --> `docs/` directory with 8 markdown guides (README, taco-format, state-management, component-library, theming, cli, bwserve, llm-bitwrench-guide)
* [x] update --> README.md: ComponentHandle as primary state pattern, updated API table, docs/ links
* [x] update --> `docs/llm-bitwrench-guide.md`: three-level model, ComponentHandle API, all make*() functions, mental model callouts for LLMs conditioned on React/Vue
