# Bitwrench Master Backlog

Consolidated from all feedback sources and internal roadmap. 2026-03-12.

## Thesis: bitwrench v2 is feature-complete — it needs polish, not features

The core surface area is done: TACO, bw.DOM/html/createDOM, bw.css/injectCSS,
bw.component() with bindings, 50+ BCCL make*() factories, bw.generateTheme(),
pub/sub, bwserve SSE protocol, CLI conversion. What remains is fixing bugs,
improving DX, documenting what exists, and keeping the bundle lean.

New *features* should be questioned hard. Every addition risks the 45KB budget
and adds maintenance surface. The bar for new code should be: "does this fix a
real user pain point that can't be solved with docs or patterns?"

---

## Sources

| Key | Source | Author | Context |
|-----|--------|--------|---------|
| EO | `examples/ember_and_oak.html` analysis | External dev | Built coffee shop site with v2.0.16 CDN + docs only |
| REP | `dev/rep-2.0.16-feeddback` | External reviewer | Independent assessment of bw.component() |
| PR1 | `dev/pr_bitwrench.md` | LiquidUI dev | Built bwserve app integrating quikchat+quikdown |
| PR2 | `dev/pr_bitwrench_css.md` | Same (LiquidUI) | CSS tokens and utility class requests |
| FB | `dev/bitwrench-2.0.16-feedback.md` | Same (LiquidUI) | Holistic ecosystem assessment |
| INT | Internal roadmap | Us | qa-todo.md, north-star.md, own observations |

---

## Master Table

Legend: **Type** = bug / dx / docs / feature / bloat-risk | **Scope** = core / bccl / bwserve / css / cli / docs

| # | Item | Type | Scope | Source | Effort | Bundle Impact | Notes |
|---|------|------|-------|--------|--------|---------------|-------|
| **CORE: bw.component() bugs** | | | | | | | |
| 1 | `_applyPatches()` textContent nukes sibling listeners | bug | core | EO, REP | M | 0 | CRITICAL. #1 user pain point. Wrap ${expr} in span |
| 2 | `o.render` not called on initial mount in ComponentHandle | bug | core | REP, EO | S | 0 | 8 lines. Bridges Level 1→2 migration |
| 3 | Child `o.mounted` silently stripped by `_tacoForDOM()` | bug | core | EO, REP | S | 0 | Warn always (correctness issue) |
| 4 | Template binding race on first render (mounted sees partial DOM) | bug | core | REP | S | 0 | Document ordering or fix sequencing |
| 5 | Deeply nested bindings sometimes don't register | bug | core | REP | M | 0 | Need to verify — may be #1 manifesting |
| **CORE: DX improvements** | | | | | | | |
| 6 | `bw.debug(enable)` flag + binding warnings | dx | core | REP, EO | S | ~0.3KB | Warn on bad keys, null refs, undefined exprs |
| 7 | Child component ownership + destroy cascade | dx | core | INT | S | ~0.2KB | `_children[]`, `_parent`, depth-first destroy |
| 8 | `updated` alias for `onUpdate` lifecycle hook | dx | core | INT | XS | 0 | 1 line |
| 9 | List reorder helper (insertBefore-based) | dx | core | INT | XS | ~0.1KB | ~5 lines |
| **CORE: bloat audit** | | | | | | | |
| 10 | Audit `_deepCloneTaco` / `_tacoForDOM` — over-engineered? | bloat-risk | core | INT | M | -?KB | Refactor, simplify, reduce code |
| 11 | Audit 50+ make*() functions — which earn their keep? | bloat-risk | bccl | INT | L | -?KB | Some are trivially thin wrappers |
| 12 | Audit bitwrench-styles.js — CSS generation bloat | bloat-risk | css | INT | L | -?KB | Largest growth risk (2236 LOC, 21% of source) |
| 13 | Tree-shakeable ESM build for make*() | bloat-risk | bccl | INT | L | varies | Would let users import only what they use |
| **BCCL: component gaps** | | | | | | | |
| 14 | makeTable: row selection (`selectable`, `onRowClick`) | feature | bccl | REP | S | ~0.3KB | Real gap for data-heavy apps |
| 15 | makeTable: pagination (`pageSize`, `onPageChange`) | feature | bccl | REP | S | ~0.4KB | Slice data + append makePagination |
| 16 | makeTable: document existing `col.render` cell renderer | docs | bccl | REP | XS | 0 | Feature exists, user couldn't find it |
| 17 | makeSplitPane (resizable drag-to-resize) | feature | bccl | PR1 | M | ~0.5KB | Dashboard layouts. Question: worth bundle cost? |
| 18 | Factory stash on BCCL TACOs for .set() rebuild | feature | bccl | INT | M | ~0.4KB | make*() + ComponentHandle bridge |
| 19 | `bw.make(type, props)` factory dispatcher | feature | bccl | INT | S | ~0.2KB | Data-driven component creation |
| **BWSERVE: bugs** | | | | | | | |
| 20 | DIST_DIR path broken when installed from npm | bug | bwserve | PR1, FB | XS | 0 | CRITICAL. Blocks all npm users. Easy fix |
| 21 | `client.exec()` blocked — no `allowExec` in bwserve.create() | bug | bwserve | PR1, FB | XS | 0 | Config plumbing |
| 22 | POST to `/__bw/action/<clientId>` returns 404 intermittently | bug | bwserve | PR1 | M | 0 | Race condition in client registration? |
| **BWSERVE: DX improvements** | | | | | | | |
| 23 | Shell customization (headScripts, headStyles, favicon) | dx | bwserve | PR1, FB | M | ~0.2KB | Unblocks third-party lib integration |
| 24 | `register()` accept function refs (`.toString()`) | dx | bwserve | PR1, FB | S | ~0.1KB | Biggest bwserve DX pain point |
| 25 | `register()` accept file paths (`registerFile()`) | dx | bwserve | PR1 | S | ~0.2KB | Full editor support for client code |
| 26 | Lifecycle events: connect, disconnect, ready | dx | bwserve | PR1, FB | M | ~0.3KB | Prevents state leaks + race conditions |
| 27 | Error feedback from client-side execution | dx | bwserve | PR1, FB | M | ~0.2KB | Error channel back via action POST |
| 28 | `call()` with return values (callAsync via action POST) | feature | bwserve | PR1, FB | M | ~0.3KB | Fire-and-forget → request/response |
| 29 | `data-bw-action` richer payloads (`data-bw-payload`) | feature | bwserve | PR1 | S | ~0.1KB | Structured data on actions from DOM |
| 30 | `client.render()` append/prepend variants | feature | bwserve | PR1 | S | ~0.1KB | Already have `client.append()` — is this a docs issue? |
| **CSS: tokens and utilities** | | | | | | | |
| 31 | Expose `bw.tokens` — spacing, color, typography, radius | feature | css | PR2, FB | M | ~0.4KB | JS object, not CSS vars. Already partially exists internally |
| 32 | ~20 utility classes (bw_flex, bw_gap_md, bw_pad_md, etc.) | feature | css | PR2, FB | S | ~0.3KB | Question: worth it or just docs on bw.css()? |
| 33 | Document that pseudo-class nesting already works in bw.css() | docs | css | PR2 | XS | 0 | `:hover`, `:focus` etc. already work! |
| 34 | Document that @media nesting already works in bw.css() | docs | css | PR2 | XS | 0 | Already works! |
| 35 | CSS custom properties helper (`bw.cssVars()`) | feature | css | PR2 | S | ~0.2KB | Question: IE11 compat concern |
| **CSS: design system polish** | | | | | | | |
| 36 | Border-radius scale enforcement across all components | dx | css | INT | M | 0 | Already in RADIUS_PRESETS, ensure usage |
| 37 | Alternate palette derivation curve tuning (12 presets) | dx | css | INT | M | 0 | Visual quality |
| 38 | Per-component dark appearance quality | dx | css | INT | L | 0 | Depends on alternate palette quality |
| 39 | Visual audit: all components with default palette | dx | css | INT | L | 0 | Do they all look good? |
| **DOCS: foundational — "It's just JavaScript"** | | | | | | | |
| 40 | ABOUT.md — "Why Bitwrench Exists" (origin story + thesis) | docs | docs | INT | M | 0 | DONE (draft). Lampdesk→Palm→webOS origin, UsefulJunk→bitwrench evolution, why JSX/Tailwind/VDOM are accidental complexity, who bitwrench is for. Needs review/polish. |
| 41 | "TACO is computation, not a format" doc/section | docs | docs | INT, EO, REP | M | 0 | HIGHEST PRIORITY DOC. Every field is a JS expr. Covers: IIFEs in c:/a:/style:, functions as deferred computation, .map() for lists, Object.assign for style composition, filter(Boolean) for conditionals. Two timing modes: compile-time (data) vs instantiation-time (behavior). The table: static / computed-at-define / computed-at-render / composed for content, attrs, styles, classes. This is what both reviewers missed — they treated TACO as a static format, not a compositional computation |
| 42 | "CSS is just strings" doc/section | docs | docs | INT, PR2 | M | 0 | Store CSS values in JS vars, compose with Object.assign, write functions that return style objects, access generateTheme() palette in bw.css(), pseudo-classes and @media already nest. Both users asked for bw.tokens when they could have done `var sp = '16px'` |
| 43 | Document that pseudo-class nesting already works in bw.css() | docs | docs | PR2 | XS | 0 | `:hover`, `:focus` etc. already work! |
| 44 | Document that @media nesting already works in bw.css() | docs | docs | PR2 | XS | 0 | Already works! |
| **DOCS: gaps surfaced by users** | | | | | | | |
| 44 | `bw.raw()` needs a spotlight in docs/quick-start | docs | docs | EO | XS | 0 | User used innerHTML when bw.raw() was the answer |
| 45 | `onclick` attr as primary event pattern (not o.mounted) | docs | docs | EO | XS | 0 | Simpler, works, not documented prominently |
| 46 | Pattern: ephemeral UI (toasts, slide-overs) without raw DOM | docs | docs | EO | S | 0 | May also need a bw.toast() component |
| 47 | Pattern: data-driven filtered lists in bw.component() | docs | docs | EO | S | 0 | Coffee filter/search use case |
| 48 | Pattern: theme palette tokens in custom bw.css() | docs | docs | EO | XS | 0 | Show how to reference palette colors |
| 49 | Pattern: child widget updates within ComponentHandle | docs | docs | EO | S | 0 | Progress bar use case |
| 50 | `bw.DOM()` vs `bw.createDOM()` naming clarity | docs | docs | PR1 | XS | 0 | Clear docs, maybe aliases |
| 51 | bwserve + third-party client libraries example | docs | docs | PR1, FB | M | 0 | Recommended integration patterns |
| 52 | Document `col.render` cell renderer in component-library.md | docs | docs | REP | XS | 0 | Feature exists but invisible |
| 53 | Document lifecycle hook ordering (mounted vs binding vs render) | docs | docs | REP | S | 0 | Source of confusion |
| 54 | Soft-deprecate `willUpdate`/`willDestroy` in docs | docs | docs | INT | XS | 0 | Docs only, no code changes |
| **UTILITIES: nice-to-haves** | | | | | | | |
| 55 | `bw.loadScript()` / `bw.loadScripts()` helper | feature | core | PR1 | XS | ~0.2KB | Universal boilerplate elimination |
| 56 | `bw.fetch()` / `bw.post()` wrapper | feature | core | PR1 | S | ~0.3KB | Question: fetch() is standard, is wrapper needed? |
| 57 | Declarative events (`o.events`) in bw.createDOM() | feature | core | INT | M | ~0.5KB | sendValue, debounce, throttle. Deferred |
| 58 | DOM morphing (`bw.morph()`) | feature | core | INT | L | ~1KB+ | Study morphdom/idiomorph. Defer until real demand |
| 59 | TypeScript declarations (.d.ts) | feature | core | REP | L | 0 | No bundle impact but significant effort |
| **FUTURE / DEFERRED** | | | | | | | |
| 60 | WebSocket transport option for bwserve | feature | bwserve | INT | M | ~0.3KB | Defer until SSE proves insufficient |
| 61 | `bwcli serve` file watching + live reload | feature | cli | INT | M | ~0.3KB | Phase 2+ |
| 62 | `bwcli build` site generation | feature | cli | INT | L | ~1KB+ | Phase 2+ |
| 63 | `bwcli init` scaffolding | feature | cli | INT | S | ~0.3KB | Phase 2+ |
| 64 | Remote screenshot via bwcli debug protocol | feature | bwserve | INT | M | ~0.5KB | Niche |
| 65 | Form data serialization in actions (sendForm) | feature | bwserve | INT | S | ~0.2KB | Deferred |
| 66 | Optimistic updates (client-side immediate response) | feature | bwserve | INT | M | ~0.3KB | Deferred |

---

## Bundle budget analysis

Current: **38.9KB gzipped** (45KB budget = 6.1KB headroom)

If we did EVERYTHING marked as having bundle impact above:

| Category | Items | Est. gzipped |
|----------|-------|-------------|
| Core bugs + DX (#1-9) | 9 | ~0.6KB |
| BCCL features (#14-19) | 6 | ~1.8KB |
| bwserve DX (#23-29) | 7 | ~1.5KB |
| CSS tokens/utilities (#31-35) | 5 | ~1.1KB |
| Utilities (#51-53) | 3 | ~1.0KB |
| Future/deferred (#54-62) | 9 | ~3.5KB+ |
| **Total (everything)** | | **~9.5KB** |
| **Total (minus deferred)** | | **~6.0KB** |

That would put us right at the 45KB line if we did *all* non-deferred items.
This means we MUST be selective. Every feature needs to justify its bytes.

### Bloat reduction opportunities (items 10-13)

These go the other direction — potential savings:
- Audit make*() thin wrappers: some functions are <5 lines wrapping a TACO literal. If they don't add value beyond what a user could write in 2 lines, cut them
- bitwrench-styles.js CSS deduplication: structural+cosmetic rules may have redundancy
- `_deepCloneTaco` / `_tacoForDOM` may be over-complex for what they do

---

## Discussion: what's "done" vs. "needs work"

### Done (don't touch unless broken)
- TACO format + bw.html() + bw.createDOM() + bw.DOM()
- bw.css() + bw.injectCSS() (already supports pseudo-classes + @media nesting)
- bw.generateTheme() + palette system + alternate derivation
- pub/sub (bw.pub/sub + bw.emit/on)
- bwserve protocol (9 message types, register/call/exec)
- CLI Phase 1 (single-file conversion)
- File I/O (loadClient/loadLocal/saveClient/saveLocal)
- Color utilities (hex↔hsl, deriveShades, derivePalette, etc.)
- Legacy compat (typeOf, mapScale, clip, loremIpsum, etc.)

### Needs bugs fixed (ship-blocking for v2.0.17)
- Items 1-5: bw.component() binding bugs
- Item 20: bwserve DIST_DIR (blocks npm users)

### Needs DX polish (high impact, low risk)
- Items 6-9: debug flag, destroy cascade, lifecycle alias
- Items 40-54: docs gaps (costs 0 bytes)

### Highest-leverage docs (change how people think about bw)
- Item 40: "TACO is computation, not a format" — IIFEs, functions in attrs/content/style, compile-time vs instantiation-time, composition via map/assign/filter. This is what both reviewers missed entirely.
- Item 41: "CSS is just strings" — JS vars for reuse, Object.assign for composition, functions that return style objects, palette access. Eliminates the need for bw.tokens as a formal API.

### Needs honest discussion (features vs. bloat)
- Items 14-19: BCCL additions (table, splitpane, factory) — each one adds bytes
- Items 31-35: CSS tokens/utilities — compelling ask but is it bitwrench's job?
- Items 55-56: loadScript/fetch wrappers — convenience vs. bundle
- Item 17: makeSplitPane — is this a BCCL component or a user-space pattern?
- Item 59: TypeScript — high effort, zero bundle, but real user request

### Defer (no demand yet)
- Items 57-58: declarative events, DOM morphing
- Items 60-66: bwserve Phase 2, CLI Phase 2
