# Bitwrench 2.1.x — Lifecycle Spec of Record

**Date**: 2026-06-09 (rev 7 — §0 quick card; readability/ambiguity fixes;
`bw.derive` (declared dataflow, the useMemo answer); CSS grammar
alignment (§15); actions dispatcher on-by-default)
**Status**: SPEC OF RECORD for the 2.1.x line. Where this conflicts with
`bw-lifecycle-cleanup-2026-04-11-v1.1.md`, this document wins. v1.1 remains
the background analysis (framework comparisons, rationale); its decision
table is superseded here. `bw-lifecycle-design.md` and
`bitwrench-component-lifecycle.md` are historical.
**Field version**: 2.0.32. This spec targets **2.1.0**.
**Breaking changes**: allowed and expected. 2.1.x is the correctness release.
**Release intent**: this is the version that goes to HN / Fireship. Ship the
architecture, not apologies for it.

---

## §0 Quick Card — the whole contract on one screen

```
DEFINE      taco = bw.makeX(props)          pure data; bw.validateTaco(taco)
CREATE      node = bw.create(taco)          hydrated, detached, no registrations
MOUNT       el = bw.mount(target, taco)     on page, registered, mounted() fired
            (manual: appendChild + bw.mountTree)
LIVE        el.bw.method() > slots > bw.message > bw.patch > bw.append
            > bw.replace > bw.refresh       ordered by cost; names are honest
UNMOUNT     bw.remove(ref)                  hooks fire, all bw traces removed
            (manual: bw.unmount + el.remove;  keep-alive: bw.detach)
STRING      bw.html(taco) / bw.htmlPage()   separate pure path; adoptable later
                                            via mountTree + hydrate
```

Invariants: (1) in-document ⇔ registered ⇔ mounted-fired · (2) unmount =
exact inverse of create+mount · (3) UUID class = name, registry = alive ·
(4) names carry cost · (5) TACO consumed, never retained · (6) code never
crosses the wire. Safety nets: liveness checks on every dispatch, a
MutationObserver janitor for rude removals, WeakRef/GC backstop.
Observability: `bw:lifecycle` + `bw:diag` pub/sub topics.

Everything below is the rationale, edge cases, and test contract for the
box above. The implementation is far smaller than this document.

---

## North Star

A bitwrench component is a plain JavaScript object — a TACO — that becomes
a live DOM element with its own state, methods, and lifecycle. The DOM **is**
the component and the DOM **is** the registry: there is no virtual tree, no
compiler, no hidden machinery, and nothing that works differently interpreted
than bundled.

Each lifecycle phase has exactly one verb that performs it. Convenience
verbs compose the phase verbs; they never reimplement them. Updates are
explicit: you tell a component what to do and it updates its own DOM —
the names of the update operations tell you what they cost. Teardown is
the exact inverse of creation: everything bitwrench puts on an element,
bitwrench takes off. And across every wire — server, CLI, LLM — **only
data travels, never code**.

CSS follows the same premise: JavaScript is the preprocessor. A handful of
seed values generate the whole design system; dark mode is a palette
inversion, not a parallel stylesheet. App as data, style as data, protocol
as data.

---

## 1. The Lifecycle and Its Verbs

```
define ──> create+hydrate ──> mount ──> live (update ops) ──> unmount ──> removed
  │                                                              │
  └────────────> bw.html() ──> HTML string (separate path)      caller detaches
```

### 1.0 The transition map, in plain words

One row per thing you want to do; one verb per row. This is the whole API
surface of the lifecycle.

| You want to… | Verb | Kind |
|---|---|---|
| compose a UI element description | object literal, `bw.h()`, or `bw.make*()` factory | define |
| validate it (structure, schema, team rules) | `bw.validateTaco(taco, schema?)` | define — pure, no DOM |
| turn it into an HTML snippet | `bw.html(taco)` | string path — pure |
| turn it into a complete HTML page | `bw.htmlPage(opts)` | string path — pure |
| turn it into a live-ready DOM object (not yet on the page) | `bw.create(taco)` | atomic |
| put it on the page and bring it to life | `bw.mount(target, taco)` — or manually: `parent.appendChild(node)` + `bw.mountTree(node)` | compound / atomic |
| update it while live | `el.bw.method()` and the §3 tiers | live operations |
| take it off the page but keep it alive | `bw.detach(el)` | atomic |
| remove it | `bw.remove(ref)` — or manually: `bw.unmount(el)` + `el.remove()` | compound / atomic |

Five lifecycle moments (define → create → mount → live → remove) plus two
pure string conversions. Validation belongs to the define phase: a TACO is
data, so it is checkable before anything exists.

### 1.0a Atomic vs compound — the rule and when to use which

**Atomic verbs do exactly one transition**: `create`, `hydrate`,
`mountTree`, `unmount`, `unmountChildren`, `detach`. Use them when you are
composing manually (hydrate-then-compose), building tooling, writing
tests, or doing something unusual — they give you every seam.

**Compound verbs chain atomics for everyday code**: `mount`/`DOM`,
`append`, `replace`, `remove`, `refresh`. Fewer calls, and — more
important — **you cannot skip a phase by accident**: the compound always
runs the teardown and the mount walk in the right order.

The rule that keeps this honest: **a compound verb contains no logic
except calls to atomic verbs.** If a compound ever needs its own teardown
or registration code, the atomic set is missing a verb — fix the atomic
set. (Every 2.0.x lifecycle bug was a violation of exactly this rule.)

App code should read as compounds; the atomics exist so that when you need
the seams, they're load-bearing and documented, not internal.

### 1.1 Phase verbs — one verb, one transition

Format: **verb** — what it does. Input → output. Mutated state / side
effects. Events fired.

* **(define)** — no verb. A TACO is written by hand, built with `bw.h()`,
  or returned by a `bw.make*()` factory. Nothing → TACO object. No side
  effects. No events. Optional `bw.assignUUID(taco)` appends a UUID token
  to the class string — still pure data.

* **`bw.create(taco)`** — expands a TACO into a hydrated, detached DOM
  node. Create + hydrate are fused (the recursive pass holds both TACO and
  node at every step). TACO | array | primitive | `bw.raw()` → detached
  Element | Text | Fragment. Mutations, all confined to the new node:
  attributes set, children built, live event listeners attached,
  `_bw_refs` built; for TACOs with `o.*`: `_bw_state`, `el.bw` (handle
  methods + cached slot setters + auto `getState()`), `_bw_type`,
  `_bw_unmount_fn`, marker classes (`bw_lc`, UUID class). **No
  registrations of any kind** — neither UUID nor `id` enters `_nodeMap`
  until mount. (rev 6 fix: 2.0.x registers `id` at create, so a created
  node that is never inserted and then abandoned is pinned by the
  registry forever, and no MutationObserver ever sees it — it was never
  in the document. Registration only at mount makes the abandoned-node
  leak class structurally impossible; invariant 3 applies to ids too.)
  `mounted` does **not** fire. Events: none.

* **`bw.hydrate(node, taco)`** — wires lifecycle from `taco.o` onto an
  existing DOM node (server-rendered HTML, third-party DOM). Element +
  TACO → same Element. Mutations: same properties as create's hydrate
  step. Idempotent — re-hydrating an already-hydrated node is a no-op.
  Events: none.

* **`bw.mountTree(el)`** — brings an inserted subtree to life. Hydrated
  Element already in the document → same Element. Mutations: every
  `.bw_lc` descendant's UUID — and every descendant's `id` attribute —
  registered in `_nodeMap` (ALL registration happens here and only
  here); each `mounted(el, state)` hook fired **synchronously**, parent
  before children (no rAF — the element is measurable when the hook
  runs).
  Events: `bw:mount` (bubbling CustomEvent, detail `{uuid, type}`) on
  each mounted component. **Idempotent**: an element whose UUID is
  already registered *to itself* is skipped silently (already alive) —
  this makes re-walking safe (reinserted `detach`'d elements, render
  functions that call `bw.mount` internally, adoption passes over
  server-rendered markup). Public as the escape hatch for manual
  `appendChild`; the convenience verbs call it for you.

* **`bw.unmount(el)`** — tears down a subtree's lifecycle. The exact
  inverse of hydrate + mount. Element → void; element stays in the DOM,
  now inert. Mutations: `unmount(el, state)` hooks fire (self first, then
  descendants in document order — a composite can still read its children
  during its own teardown); every tied `unsub()` called; deregistered
  from `_nodeMap`; `_bw_state`, `_bw_render`, `_bw_refs`, `_bw_type`,
  `_bw_unmount_fn`, and `el.bw` deleted; **marker classes stripped**
  (`bw_lc`, `bw_is_component[_bccl_*]`, and the `bw_uuid_*` token) —
  hydrate and create put them on, so unmount takes them off. An
  unmounted element is a *plain node*: it cannot be re-registered by a
  later mount walk, found by a stale `bw.el(uuid)` querySelector
  fallback, or mistaken for a component by the janitor — no half-alive
  husks. A stale `el.bw` reference throws on use rather than
  half-operating on a dead subtree. Events: `bw:unmount` on each
  component, fired **before** its properties are stripped (listeners may
  still read state).

* **`bw.unmountChildren(el)`** — `unmount` for descendants only. `el`'s
  own state, subs, registration, and unmount hook are untouched. Used
  internally by `mount`/`refresh`/`patch`. Replaces the 2.0.x
  save/restore hack in `bw.DOM` (which fires and permanently loses the
  target's own unmount hook — audit F8). Events: `bw:unmount` per child
  component.

* **`bw.detach(el)`** — remove from the document while keeping lifecycle
  intact. Element → same element, disconnected. Registration, state,
  handle, and tied subs all survive; the element is flagged
  janitor-exempt (§2.1) while detached, and tied pub/sub keeps
  delivering (updates apply to the offscreen DOM and are there when it
  returns). Re-insert with plain `appendChild` — identity survives,
  `mounted` does not re-fire. For tab panels, drag-and-drop, "unplug
  now, re-insert later." Events: none.

* **(final removal)** — the caller removes the node (`el.remove()`)
  after `unmount`, or uses `bw.remove()` below. Teardown and detachment
  are separate concerns (Bootstrap `dispose()` model). Anything removed
  *without* unmount is the janitor's job (§2.1).

### 1.2 Convenience verbs — compositions, never reimplementations

* **`bw.mount(target, content)`** — replace target's children with
  content. = `unmountChildren(target)` → `create(content)` → insert →
  `mountTree`. ref + TACO/array/node → **root element** of the new
  content (`el.bw.*` immediately usable). Events: `bw:unmount` (old
  children), `bw:mount` (new). **`bw.DOM` is an exact alias.**

* **`bw.append(target, content, opts?)`** — add a child without touching
  existing children. = `create` → insert → `mountTree`. Returns the new
  child element. `opts.before` (element | index) controls insertion
  position; default end. The verb for lists, feeds, toasts. Events:
  `bw:mount`.

* **`bw.replace(ref, taco)`** — swap the element itself at its DOM
  position. = `unmount(old)` → `create(taco)` → insert at position →
  `mountTree` → detach old. Returns the **new element**; the old
  reference is stale by definition. `taco === null` ⇒ behaves as
  `remove`, returns null. Events: `bw:unmount`, then `bw:mount`.

* **`bw.remove(ref)`** — = `unmount(el)` → `el.remove()`. Returns void;
  silent if ref not found. Events: `bw:unmount`.

* **`bw.refresh(ref)`** — rebuild a component's children from its own
  `o.render`. = `unmountChildren(el)` → `el._bw_render(el, state)` →
  `mountTree` over the new children. Returns the element. **The heavy
  path**: child focus, scroll, transitions, and child component state are
  destroyed. Events: `bw:unmount` (old children), `bw:mount` (new),
  `bw:refresh` on the element.

Live-update operations (`patch`, `message`, `update`, `updateSlot`,
`syncChildren`, `el.bw.*`) are §3 — they operate on mounted components and
are not phase transitions.

**Lifecycle events (new in 2.1)** — `bw:mount`, `bw:unmount`, `bw:refresh`,
plus the existing `bw:statechange`. Bubbling CustomEvents, fired per
*component* (not per plain node), **and mirrored to the pub/sub topic
`bw:lifecycle`** as `{event, uuid, type}`. The mirror exists because DOM
events on a *disconnected* tree don't bubble to document — a janitor reap
(§2.1) would be invisible to DOM listeners; the pub/sub mirror is
connection-independent, so observers (tests, bwattach, an LLM) see every
transition regardless of how it happened:
`bw.sub('bw:lifecycle', fn)`. This is what makes "the server/LLM can
listen to events and react" true for lifecycle, not just app events.
Detached-tree operations on never-mounted nodes fire nothing.

### 1.3 Renames and breaking changes (2.0.x → 2.1.0)

| 2.0.x | 2.1.0 | Notes |
|---|---|---|
| `bw.createDOM(taco)` | `bw.create(taco)` | no alias; mechanical rename across examples/pages/tests |
| `bw.cleanup(el)` | `bw.unmount(el)` | now also strips `el.bw` and `_bw_type` (zombie-handle fix) |
| — | `bw.unmountChildren(el)` | new primitive |
| — | `bw.mountTree(el)` | new public; was implicit/rAF |
| `bw.DOM(target, taco)` returns container | alias of `bw.mount`, returns **root** | most call sites ignore the return; loudly documented |
| `bw.mount(target, taco)` | same name, now full pipeline incl. `unmountChildren` | 2.0.x destroys the container's own subs/state — bug |
| `bw.update(target)` = rebuild | `bw.refresh(ref)` is the rebuild; `bw.update(ref, data)` is data dispatch (§3) | |
| mounted via rAF when detached | synchronous, only via `mountTree` | raw `appendChild` after `create` no longer fires mounted — use `bw.append` or `mountTree`. Grep pages/ + examples/ during migration. |
| protocol `exec`, server-side `register` | **removed** (§5) | |
| `data-bw-action` (bwserve docs) | **`bw_act_*` action classes** (§5.4) | classes-only policy; no data-* anywhere |
| `bw_card`, `bw_btn`, `bw_tabs`, … | `bw_bccl_card`, `bw_bccl_btn`, `bw_bccl_tabs`, … | §13 namespace cleanup. Clean break — **no dual-class emission** |
| `bw.toggleStyles` (alias), `bw._el` (alias), `compileProps`/`renderComponent` throw-stubs, `htmlTable`/`htmlTabs` (deprecated v1) | **deleted** | alias purge — 2.1.0 ships zero deprecation shims (§12) |

### 1.4 The two expansion paths — live and string (documented and tested separately)

A TACO expands two ways. They are different pipelines with different
rules, and the test contract treats them as such.

**Path L (live)**: `create` → `mountTree` → live component. Functions in
`a:` become real `addEventListener` calls; `o.*` becomes state, handles,
slots, hooks. Everything in §§1–3.

**Path S (string)**: `bw.html(taco)` → HTML snippet; `bw.htmlPage(opts)`
→ complete page. Pure in the sense that matters: no DOM, **no global
state, nothing retained after the call returns** — the only outputs are
the returned string and, if the caller provided one, their `{fns}`
registry object. Rules:

- **Identity is stamped into markup.** Elements with `o.*` get their
  `bw_uuid_*`, `bw_lc`, `bw_is_component[_bccl_*]` classes in the output
  HTML, and `bw_act_*` classes pass through like any class. This is what
  makes a string-rendered page *adoptable* later.
- **Function attributes — the registry mechanics.** The 1.x capability
  (onXXX functions in TACOs survive into emitted HTML) is **kept**; what
  dies is only the *global* registry that grew forever across renders.
  How it works, precisely:

  During a string render, every **function value** encountered in an
  `on*` attribute gets a sequential generated id (`bw_fn_0`, `bw_fn_1`,
  …) in a registry **owned by that render**, deduplicated **by
  reference** (a `Map` keyed on the function object). The emitted
  attribute is the dispatch call:
  `onclick="bw._fn('bw_fn_1', event)"`. The registry serializes each
  function via `Function.prototype.toString()` into a `<script>` block:
  `bw._fns = { bw_fn_0: function(){…}, bw_fn_1: function(){…} }`.

  So, the three-widgets question: **function *names* never matter and
  never collide** — identity is the generated id, keyed per function
  *value*. Three widgets with three different same-named handlers →
  three registry entries, three distinct ids. Three widgets *sharing*
  one handler reference (factory closure reused) → one entry, three
  attributes pointing at it. Anonymous functions are the normal case,
  not an edge case.

  Where the registry can live:
  - **`bw.htmlPage(opts)`** — registry **ON by default** (per Manu: it's
    lean and powerful and still works; the TypeScript crowd may cringe in
    the comments). The registry script is emitted inside that page —
    page-scoped, caller-owned, no cross-render state.
    `{handlers: false}` produces fully inert output for the air-gapped /
    static-artifact case.
  - **`bw.html(taco, {fns})`** — snippets can't carry a script block, so
    the caller passes a registry object; bitwrench fills it during the
    render and the caller decides where it lives (embed it, pass it to a
    later htmlPage, install it on the current page). No `{fns}` →
    function attributes are **skipped with one warning** — a bare
    fragment has nowhere to put code.

  **The honest caveat (documented, not hidden)**:
  `Function.toString()` serializes *source, not closures*. A handler that
  closes over a variable emits code that references a binding which won't
  exist in the target page. Rule: **serialized handlers must be
  self-contained** — they may use their `event` argument, the DOM, `bw.*`
  globals, and anything else the target page defines; they may not rely
  on captured variables. (This is undetectable statically in general, so
  it's a documented contract, not a lint.) Handlers that need closure
  state belong on Path L — or use `bw_act_*` classes, which serialize as
  pure data and have no closure problem at all.
- String `onclick="..."` attributes pass through untouched (author's
  explicit choice, escaped like any attribute value elsewhere).

**Convergence requirement** (the part that must work the same as Path L):
take a Path S page, load bitwrench (or have bwattach inject it), and run
`bw.mountTree(document.body)`. Because identity lives in classes,
mountTree finds every stamped component, registers it in `_nodeMap`, and
the page becomes addressable: `inspect`, `patch`, `bw_act_*` actions,
`remove`, `replace` all work — **identical to Path L** for everything
that doesn't require functions. (mountTree is idempotent and these
elements carry no hook properties, so this adoption pass is pure
registration — safe on any bitwrench-generated markup.)

Full component parity — handles, state, slots — requires the TACO, since
functions never survive serialization: call `bw.hydrate(el, factoryTaco)`
per component, then its `el.bw` works exactly as if built on Path L. This
is the documented two-step: **adopt (mountTree) for addressing parity,
hydrate-with-TACO for behavior parity.** bwserve/bwattach use the same
two steps; nothing special-cased.

---

## 2. Invariants

Written at the top of the engine source and enforced by spec tests.

1. **In-document ⇔ registered ⇔ mounted-fired.** Every path that inserts
   hydrated nodes runs `mountTree`; every path that discards them runs
   `unmount`. No exceptions — including `patch` content replacement and
   slot setters (2.0.x violates both; GAP-3/GAP-4 fixed here).
2. **Unmount is the exact inverse of hydrate + mount.** Everything they
   put on comes off. Nothing else comes off.
3. **UUID class = name; registry = alive.** The `bw_uuid_*` class is
   stamped at create (structural identity, keys `_bw_refs`); the
   `_nodeMap` entry exists only between mount and unmount.
4. **Names carry cost.** Cheap verbs are never secretly expensive;
   expensive verbs are never disguised as cheap ones.
5. **TACO is consumed, not retained.** After create+hydrate the TACO is
   gone; the DOM is the only truth. Clone TACOs, never DOM nodes.
6. **Code never crosses the wire.** Server, CLI, and LLM send data:
   TACOs (structure + action-class names), verb messages, method names.
   Executable code travels exactly once — when the page itself is served.

### 2.1 Ungraceful teardown — the janitor (100% coverage requirement)

The graceful path assumes everyone exits through bitwrench verbs. Real
pages don't: app code calls `el.remove()`, a third-party library wipes a
container, an ancestor five levels up gets replaced. **The teardown
matrix below must be covered — every row, by spec test.** Design
principle: *the DOM is the registry, so the registry watches the DOM.*

Three layers, cheapest first:

1. **Liveness checks at every dispatch (always on).** Before delivering
   a tied pub/sub message, or resolving `bw.el()` / `message` / `patch`
   through the registry, check `el.isConnected`. Disconnected and not
   janitor-exempt → skip delivery, auto-unsub that element's tied subs,
   prune its registry entries, warn once per element. **A component
   removed by any means stops receiving messages immediately — no ghost
   updates, ever.** This is the graceful pub/sub degradation requirement:
   publishers never need to know a subscriber died badly.

2. **The janitor (default on in browsers): one document-level
   MutationObserver.** On removed nodes, re-check `isConnected` at
   microtask end — a reparent or `syncChildren` move is remove+insert in
   the same task, so moved nodes are reconnected by check time and are
   left alone. Genuinely disconnected subtrees containing `.bw_lc` get a
   full `bw.unmount`: **hooks fire (late beats never — timers and
   observers set in `mounted` get cleared), registries cleaned, subs
   released.** `bw.detach()`'d elements are exempt. Consequence worth
   stating: an *asynchronous* move (remove now, re-insert after an await)
   must use `bw.detach` — anything else disconnected longer than a task
   is, by definition, garbage.

3. **GC backstop (memory only).** In modern builds, registries hold
   `WeakRef`s and a `FinalizationRegistry` purges keys when elements are
   actually collected — nothing bitwrench retains can pin a dead subtree,
   even if layers 1–2 somehow miss it. (This is the "node registers a
   self-cleanup closure with bw, GC sweeps it" idea — the platform
   already provides the registry; we don't build our own GC.) Hooks are
   NOT guaranteed at this layer — that's what layer 2 is for. The ES5
   build falls back to layers 1–2 with strong refs pruned on access.

| Teardown case | What handles it |
|---|---|
| `bw.remove(ref)` / `bw.unmount` + remove | graceful path — hooks, registries, subs, synchronously |
| raw `el.remove()` | janitor: full unmount within a microtask |
| user code sets `parent.innerHTML = ''` | janitor, all contained components |
| ancestor removed/replaced, component N levels deep | janitor |
| third-party library wipes a container | janitor |
| reparent / `syncChildren` move (same task) | untouched — reconnected at check time; `mounted` does not re-fire |
| intentional detach-and-keep | `bw.detach(el)` — janitor-exempt, lifecycle intact |
| message/pub to an ungracefully removed component | layer 1 — skipped, pruned, warned once |
| element GC'd with a registry entry somehow left | layer 3 — WeakRef/FinalizationRegistry purge |
| page unload | the browser's job |

**Trigger model** (per Manu's cron-vs-event question): the janitor is
**event-driven, not polled**. The MutationObserver fires on actual
removals — zero idle cost, microtask latency, and it cannot miss a DOM
removal because the browser reports every one. Layer 1's lazy checks
cover the dispatch paths between observer ticks. A heartbeat sweep is
therefore **not needed for correctness** — with one historical exception:
2.0.x registers `id`s at *create*, so a never-inserted, abandoned node was
registered but invisible to any observer (it was never in the document).
Rev 6 closes that class structurally instead: **no registration of any
kind happens before mount**, so nothing can dangle that the observer
didn't see arrive. For belt-and-suspenders deployments (long-running
embedded dashboards), `bw.janitor.start({interval: ms})` enables an
optional heartbeat that walks the registry checking `isConnected` —
available, off by default, and the spec tests must pass with it off.

**Testability**: MutationObserver callbacks are asynchronous, so the
janitor exposes **`bw.janitor.flush()`** — synchronously process all
pending removal records (the observer's `takeRecords()` + sweep). Every
janitor spec test is: do the rude thing → `bw.janitor.flush()` → assert.
No timeouts, no flaky waits. `flush()` is also the pre-measurement call
for the scale benchmark. `bw.janitor.disable()/enable()` exist for
embedded pages that provably never remove nodes ungracefully and want
zero observer overhead — i.e. the janitor is ON unless explicitly
disabled. **Coverage requirement: the full §2.1 matrix runs in BOTH
jsdom (mocha) and real browsers (karma/playwright)** — jsdom implements
MutationObserver and `isConnected`, so the matrix is portable; the
layer-3 GC tests run in Node with `--expose-gc` and are
timing-tolerant in browsers.

**Diagnostics drain (debug observers)**: every engine warning — UUID
collision remint, ghost-dispatch prune, janitor reap, skipped function
attribute, rejected wire message — goes through one internal channel
that (a) `console.warn`s by default and (b) publishes to the pub/sub
topic **`bw:diag`** as `{code, uuid?, ref?, msg}`. `bw.setLogDrain(fn)`
replaces the console default (silence it, ship it, buffer it). Together
with `bw:lifecycle`, a debug observer — local panel, test harness, or
bwattach — subscribes to two topics and sees everything the engine does
and everything it complains about.

---

## 3. Live Update Operations

Ordered cheapest to most expensive. The order IS the documentation.

| Tier | Operation | Cost | Focus/scroll/state preserved? |
|---|---|---|---|
| 1 | `el.bw.method(args)` | component-owned surgery, O(1) | yes |
| 2 | `el.bw.setSlot(v)` / `bw.updateSlot(ref, name, v)` | cached target, O(1) | yes |
| 3 | `bw.message(ref, action, data)` | tier 1 dispatched by name (the wire form) | yes |
| 4 | `bw.patch(ref, content\|attrs)` | element-level, bypasses the component gate | yes |
| 5 | `bw.append(ref, content)` | adds, never destroys | yes (existing children untouched) |
| 6 | `bw.replace(ref, taco)` | element identity dies and is reborn | no |
| 7 | `bw.refresh(ref)` | children die and are rebuilt from `o.render` | no — destroys child component state |

Decisions:

- **`bw.update(ref, data)` dispatches to `el.bw.update(data)` if the
  component defines it; otherwise it warns and does nothing.** It never
  falls back to `refresh` (invariant 4). Components that accept generic
  data implement `update` in their handle — a documented convention; the
  BCCL data components (table, chart, list, stat card) all implement it.
  Emits `bw:statechange` after successful dispatch.
- **`bw.patch` is for elements, not components.** It bypasses `el.bw`, so
  component state can go stale — documented as the escape hatch it is.
  Its TACO/array branches now run `unmountChildren` before replacement
  and `mountTree` after (GAP-3 fix). Slot setters share this exact code
  path (GAP-4 fix).
- **refresh vs replace, one sentence, in every doc:** *refresh keeps the
  element and kills its children; replace kills the element.*
- **Error policy** (single statement; doc and code must agree):
  `mounted`/`unmount` hooks are framework-invoked → caught, warned, walk
  continues. Handle methods and `o.render` are caller-invoked → errors
  propagate. (Changes 2.0.26, which swallows render errors.) Corollary:
  a render throw mid-`refresh` leaves the children empty — the old ones
  were already unmounted. **The recovery contract**: the failure state is
  well-defined, not corrupt — the component itself is still alive,
  registered, and addressable (its own state, handle, and subs are
  untouched; only its children are gone), and the failure is published on
  `bw:diag`. Recovery is therefore always possible: fix state and
  `refresh` again, or `replace` the component, or have the render
  function catch internally and return an error-state TACO (the
  documented error-boundary pattern). What bitwrench will NOT do is keep
  the old children around for rollback — that would mean retaining a
  shadow tree, which is the philosophy we don't have.

### 3.1 State access (GAP-7, resolved)

`_bw_state` is the **component-author surface**: your own handle methods,
`mounted`, and `render` read and write it directly — member variables in
the MFC/Swing sense. `el.bw` is the **consumer surface**: outside callers
never touch `_bw_*`. Convention enforced by docs and lint, not proxies.

Added: auto-generated `el.bw.getState()` returning a **shallow copy** —
for inspection, debugging, `bw.inspect`. **No `setState(patch)`**: an
auto-refreshing setState would make the heavy path the easy path.

Handle method signature stays `fn(el, ...args)` (locked).

### 3.2 Identity edge cases (resolved)

- **Unmount order**: self first, then descendants in document order.
- **The `bw_uuid_*` namespace is bw-owned — machine identity only.**
  Only `bw.uuid()` mints these; `bw.assignUUID(taco)` *reserves* a
  generated one early (for `_bw_refs` composition keying) and never
  accepts a caller-chosen string. Developers who want their own stable
  identity already have two namespaces: the `id` attribute (user-owned,
  never touched by bw) and their own classes — `bw.el()`, `message`, and
  `patch` resolve both. No third `bw_dev_uuid_*` namespace: id + classes
  *are* the developer namespace, and a third identity system would need
  its own collision story. A hand-written `bw_uuid_` literal in user
  code is drift (lint catches it).
- **Hand-placed UUIDs are honored.** If a TACO arrives with a
  `bw_uuid_*` token in its class string — via `assignUUID` or typed by
  hand — the engine cannot tell the difference and doesn't try: **first
  mount wins the token**, silently (warning on every pre-assigned UUID
  would spam the legitimate composition pattern). The namespace policy
  above is enforced by lint and docs, not runtime.
- **When UUIDs come into existence** (the documented table — this is the
  whole story):

  | Moment | Who | Why |
  |---|---|---|
  | define | `bw.assignUUID(taco)` — generates and appends | pre-addressing, `_bw_refs` composition keying |
  | create | automatic, for any TACO with `o.*` | structural identity for refs and markers |
  | `bw.html()` | stamped into markup for `o.*` elements | so Path S pages are adoptable later (§1.4) |
  | mount | fresh mint **only on collision** | see below |
  | never | `id` attribute | user-owned; bitwrench never writes it |

- **TACO-as-factory and the collision rule.** Reusing one TACO literal to
  stamp out many items is natural and allowed — but a UUID names an
  *instance*, not a template. First mount keeps the baked-in token; every
  subsequent mount of the same token gets a **fresh UUID + one console
  warning** (old token stripped, new one registered). So: factories that
  want stable per-instance identity call `assignUUID` *per invocation*;
  templates that bake a UUID in get exactly one honored instance and
  warnings after. Reject-with-throw was considered and declined — it
  punishes the innocent clone flow and turns one stale wire message into
  a dead SSE handler. Never skip-with-class-intact — a skipped element
  carrying a live component's UUID impersonates it at the next ancestor
  unmount and tears down the wrong component (F2).
- **Unmount callbacks live on the element** (`el._bw_unmount_fn`). The
  global `_unmountCallbacks` Map is **deleted** — it was pure indirection
  and pins detached subtrees forever when elements are removed outside
  bitwrench APIs (audit F10). Element lifetime = callback lifetime.
- **Reparenting**: `newParent.appendChild(mountedEl)` just works;
  identity and registration survive; `mounted()` does not re-fire.

---

## 4. Keyed Children — `bw.syncChildren()` (new)

**Prior-art check**: verified against 2.0.32 — no existing mechanism.
`_bw_refs` is addressing, not reconciliation; BCCL lists do manual surgery
(`addRow`) or full rebuilds (`setData` rebuilds the tbody). This is the gap.

**Positioning**: a tool a component calls **inside its own handle method**
— not a rendering paradigm. No virtual tree is retained: the existing
children ARE the previous state ("DOM is the registry," applied to lists).

```
bw.syncChildren(parentEl, items, {
  key:    function(item) -> string,      // required: stable identity
  create: function(item) -> TACO,        // required: for new keys
  update: function(el, item) -> void     // optional: for kept keys
})
```

Behavior: existing children matched to items by key (`el._bw_key`, set at
create). **Moved** → repositioned via `insertBefore`: the node *moves*, so
focus, input state, CSS transitions, and component state survive. **New**
→ create → insert → `mountTree`. **Absent** → `unmount` → detach. **Kept**
→ `update(el, item)` if provided. Final DOM order matches `items` order.
O(n), simple move strategy.

### 4.1 Worked example — a task list that doesn't eat your checkbox

```javascript
bw.makeTaskList = function(props) {
  return {
    t: 'div', a: { class: 'bw_bccl_card task_panel' },
    c: [ { t: 'ul', a: { class: 'task_list' }, c: [] } ],
    o: {
      type: 'task-list',
      state: { tasks: props.tasks || [] },
      handle: {
        // generic data entry point — also reachable via bw.update / wire 'update'
        update: function(el, tasks) {
          el._bw_state.tasks = tasks;
          bw.syncChildren(el.querySelector('.task_list'), tasks, {
            key:    function(t) { return t.id; },
            create: function(t) {
              return { t: 'li', a: { class: 'task_row' }, c: [
                { t: 'input', a: { type: 'checkbox', checked: t.done } },
                { t: 'span',  a: { class: 'task_label' }, c: t.label }
              ]};
            },
            update: function(li, t) {
              li.querySelector('.task_label').textContent = t.label;
            }
          });
        }
      },
      mounted: function(el, state) { el.bw.update(state.tasks); }
    }
  };
};
```

The scenario that justifies the tool: the user has checked the checkbox on
task `7` and has keyboard focus on it. New data arrives from the server —
task `3` deleted, task `9` added at the top, the rest reordered.

- **2.0.x way** (`setData` rebuild): tbody wiped, all rows recreated.
  Checkbox state gone, focus gone, any CSS transition restarts. The user
  notices.
- **`syncChildren` way**: row `3`'s unmount fires and it's detached; row
  `9` is created and mounted; rows `7`, `1`, `4` are *moved* with
  `insertBefore` — same DOM nodes, so the checkbox stays checked, focus
  stays put, nothing flickers. `update()` refreshes labels in place.

Same explicit model — the component's handle method decides when and how —
with the one piece of bookkeeping (key matching) that's miserable to
hand-roll. BCCL's `makeTable.setData`, `makeList`, and feed patterns are
rewritten on this in 2.1.0.

---

## 5. Wire Protocol v1 — versioned, no code, verb-aligned

### 5.1 Versioning

Every protocol message carries `v` (integer, starts at 1):

```
{ "v": 1, "type": "patch", "ref": "#cpu", "content": "78%" }
```

`bw.version()` reports the library; `v` versions the **wire contract** —
independent. Embedded is the forcing function: firmware ships and lives
for years against newer clients. Unknown `v` → reject with warning;
missing `v` → treated as v1 for one release, then rejected. The bwserve
handshake includes `v` both directions.

### 5.2 Verb table (protocol type ↔ client function ↔ CLI subcommand, 1:1:1)

| `type` | Client call | Notes |
|---|---|---|
| `mount` | `bw.mount(ref, taco)` | replaces children |
| `append` | `bw.append(ref, taco, opts)` | full pipeline (2.0.x apply skips the mount walk — bug) |
| `replace` | `bw.replace(ref, taco)` | swaps the element itself |
| `patch` | `bw.patch(ref, content, attr)` | text, attrs, or children |
| `remove` | `bw.remove(ref)` | |
| `refresh` | `bw.refresh(ref)` | client-created components only |
| `message` | `bw.message(ref, action, data)` | call a component's helper method |
| `update` | `bw.update(ref, data)` | warns if no `update` handle (§3) |
| `call` | invoke **client-registered** function | client-defined only (§5.3) |
| `batch` | iterate ops | |
| `inspect` | `bw.inspect(ref)` → POST-back | |
| `screenshot` | client capture → POST-back | |
| `navigate` | location change | data, not code |

### 5.3 Threat model: code never crosses the wire

Removed from the protocol and from `bw.apply()`:

- **`exec`** — arbitrary JS from the server. Gone, along with
  `bw._allowExec`. No gate, no debug mode. The verb table is complete
  enough that bwcli/bwattach drive everything through named verbs — the
  production API IS the debug API.
- **Server-side `register`** — 2.0.x does
  `new Function('return ' + msg.body)()` on server-sent source: eval
  wearing a different hat. Gone. `register` becomes client-side only —
  page code calls `bw.registerRemote(name, fn)` at serve time; the server
  may `call` by name with data arguments.
- In the apply path, string-valued `on*` attributes in wire TACOs are
  **stripped** before create (a string onclick is browser-parsed JS —
  remote code through the back door).
- `bw.raw()` from the wire is the remaining injection surface; documented
  (server authors escape or avoid; everything else auto-escapes).

`docs/security.md` states all of this plus deployment posture — including
**CSP**: `bw.config.cspNonce` is applied to every bitwrench-injected
`<style>` and to `bw.htmlPage`'s function-registry `<script>`; strict-CSP
deployments use pre-generated CSS files (`makeStyles().css` → static
file) and `{handlers:false}` pages (full design in the CSS companion
spec). The doc exists *before* HN does.

**Remote capability checklist** — everything `exec` was used for
legitimately, done with data. Each row works identically from page JS,
bwserve, bwcli, or an LLM via bwattach:

| Need | Local | Over the wire |
|---|---|---|
| change text via the component's helper method | `el.bw.setValue('71 °C')` | `{v:1, type:'message', ref:'.bw_uuid_x', action:'setValue', data:'71 °C'}` |
| feed a component new data | `el.bw.update(d)` | `{v:1, type:'update', ref, data}` |
| change an attribute | `bw.patch(ref, {disabled:true})` | `{v:1, type:'patch', ref, content:{disabled:true}}` |
| change a plain element's text | `bw.patch(ref, '42')` | `{v:1, type:'patch', ref, content:'42'}` |
| replace a component | `bw.replace(ref, taco)` | `{v:1, type:'replace', ref, taco}` |
| replace a container's contents | `bw.mount(ref, taco)` | `{v:1, type:'mount', ref, taco}` |
| add a child (feed, toast, row) | `bw.append(ref, taco)` | `{v:1, type:'append', ref, taco}` |
| remove an element | `bw.remove(ref)` | `{v:1, type:'remove', ref}` |
| run a page-defined function | `fn(args)` | `{v:1, type:'call', name, args}` |
| discover what's on the page | `bw.inspect()` | `{v:1, type:'inspect', ref}` → tree with types, handle names, state keys |
| observe lifecycle | `bw.on(document.body, 'mount', fn)` | bwattach event stream of `bw:mount`/`bw:unmount`/`bw:statechange` |

The only thing not on the list is "run code invented after the page was
served" — which is the point.

### 5.4 DECIDED: `bw_act_*` action classes — declarative actions for server-sent UI

**The gap.** Server-sent TACOs are structure-only (JSON carries no
functions), so server-driven UI is inert unless the page pre-wired
everything. The 2.0.x answer is the `data-bw-action` attribute — which
violates the classes-only/no-data-* policy and appears nowhere in the
lifecycle model (it's also the pattern currently taught in
`thinking-in-bitwrench.md` §7).

**The design** (per Manu, 2026-06-09): actions are a **class namespace**,
not a TACO option. No `o.*` addition — the v1.1 "7 options, final" lock
stands.

```javascript
// Server sends (pure JSON — or even a pre-rendered bw.html() string):
{ t: 'button', a: { class: 'bw_btn bw_act_sensor_reset' }, c: 'Reset' }
{ t: 'input',  a: { class: 'bw_act_threshold', type: 'range' } }
```

One **delegated dispatcher**, **on by default when bitwrench boots in a
browser** (same philosophy as the janitor; `bw.actions.disable()` to opt
out), listens at the document level and routes anything matching
`[class*="bw_act_"]`. Default-on is what makes the §1.4 convergence claim
true — an adopted Path S page gets working actions with zero setup:

- **Event heuristic by tag** — buttons, links, and generic elements fire
  on `click`; `input`/`select`/`textarea` fire on `change` (`input` for
  ranges); forms fire on `submit`. Covers the real cases with zero
  configuration.
- **Dispatch payload** — `{ action, value, ref }`: action name from the
  class (chars after `bw_act_`), the element's value where applicable,
  and the element's UUID or id so the handler knows *which* row/card
  fired. Locally published as `bw.pub('act:<name>', payload)`; when a
  bwserve connection exists, POSTed back so the server handles it with
  `client.on('<name>', fn)`.
- Action names use the class-safe alphabet `[a-z0-9_-]`
  (`bw_act_sensor_reset`, not `sensor:reset`).

**Why classes beat `o.act`** (the deciding arguments):

1. **Survives the string path.** A class rides through `bw.html()` /
   `bw.htmlPage()` untouched — server-rendered HTML strings get working
   actions with no hydration step at all. `o.act` would have needed
   special serialization.
2. **Works for any insertion path** — wire TACO, local TACO, raw
   innerHTML, pre-rendered static page. Delegation means no per-element
   listeners, so nothing to wire and nothing to leak; unmount needs no
   knowledge of actions at all.
3. **DOM is the registry, again.** `querySelectorAll('[class*="bw_act_"]')`
   lists every actionable element on the page — inspectable by DevTools,
   `bw.inspect()`, and an attached LLM. Class lookups are native-speed.
4. Consistent with the existing identity namespace (`bw_lc`, `bw_uuid_*`,
   `bw_is_component`): bitwrench already uses classes as machine-readable
   markers; this is the same move.

Only a *name* ever crosses the wire. The dispatcher shipped with the page.
`data-bw-action` is removed; the namespace registry gains one row:
`bw_act_*` — owner: action dispatcher; stamped by: page author or server
TACO; consumed by: delegated listener.

---

## 6. Accessibility — in scope for 2.1.0 ("do it now")

Per-component acceptance criteria:

| Component | Requirements |
|---|---|
| modal | focus trap; Esc closes; `aria-modal`; focus returns to opener |
| tabs | roving tabindex; arrow keys (exists — verify); `aria-selected`/`controls` |
| dropdown/popover | `aria-expanded`; Esc; focus management; outside-click (exists) |
| accordion | `aria-expanded`/`aria-controls`; Enter/Space |
| carousel | pause control; `aria-roledescription`; labeled prev/next; no autoplay without pause |
| table | `aria-sort` on sorted column; `scope` on headers |
| alert/toast | `role="alert"` / `role="status"` |
| forms | label association; `aria-invalid`; errors linked via `aria-describedby` |
| tooltip | `aria-describedby`; shows on focus, never hover-only |
| nav/pagination | `aria-current` |

Global wins:

- Focus-visible styles derive from the palette (`focus` shade) — verify on
  every interactive component.
- **Contrast guarantee**: `derivePalette` already computes WCAG luminance.
  Add an AA check inside palette generation that warns (or auto-adjusts)
  when seeds produce failing pairs. "The design-system generator cannot
  ship failing contrast" — say it on the landing page.
- CI keyboard-only smoke test across the component gallery.

## 7. Internationalization — the documented way (no framework)

bitwrench ships no i18n framework, deliberately: TACOs are generated by
JS from data, so localization is a data problem you already know how to
solve. **This section is the pattern** — written so a user or an LLM does
it the same way every time.

### 7.1 The pattern: strings are data, the page is a function of (data, strings)

```javascript
// 1. One plain dictionary per locale. Functions for anything with a count.
var STRINGS = {
  en: { title: 'Sensors', refresh: 'Refresh', close: 'Close',
        updated: function(s) { return 'Updated ' + s + 's ago'; } },
  de: { title: 'Sensoren', refresh: 'Aktualisieren', close: 'Schließen',
        updated: function(s) { return 'Vor ' + s + ' s aktualisiert'; } },
  ar: { title: 'المستشعرات', refresh: 'تحديث', close: 'إغلاق',
        updated: function(s) { return 'تم التحديث قبل ' + s + ' ث'; } }
};

// 2. Pick locale; keep the active table in one variable.
var locale = bw.getURLParam('lang', navigator.language.slice(0, 2));
var T = STRINGS[locale] || STRINGS.en;

// 3. Factories take strings as props — BCCL never hardcodes user-facing text.
function renderPage() {
  document.documentElement.lang = locale;
  document.documentElement.dir = (locale === 'ar') ? 'rtl' : 'ltr';
  bw.mount('#app', bw.makeCard({
    title: T.title,
    content: T.updated(5),
    closeLabel: T.close          // every BCCL string is a prop (2.1 audit)
  }));
}

// 4. Switching locale = swap the table, regenerate. TACOs are cheap.
function setLocale(code) { locale = code; T = STRINGS[code]; renderPage(); }

// 5. Dates and numbers: the platform already does this. No library.
new Intl.NumberFormat(locale).format(48920);            // 48.920 / 48,920 / ٤٨٬٩٢٠
new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date());
```

Server-side: TACOs are JSON, so a server (any language) can localize
*before* sending — the bwserve payload is already in the user's language.
This is something template-compiled frameworks cannot do without running
their toolchain server-side.

### 7.2 What core/BCCL owe (in 2.1.0, rides with the a11y pass)

1. **No hardcoded user-facing strings in BCCL** — close buttons, carousel
   prev/next, pagination labels, empty-table text become props with
   English defaults.
2. **RTL-safe generated CSS** — the CSS generator emits logical properties
   (`margin-inline-start`, `padding-inline-end`, `inset-inline`) where
   direction matters; `dir="rtl"` then works for free.
3. `lang`/`dir` pass through `a:` like any attribute — documented.

Out of scope forever: message catalogs, pluralization rules — use any i18n
library or the pattern above.

## 8. Forms — pattern + minimal API

Target market is internal tools; internal tools are forms. 2.1.0 ships:

- **One canonical doc page**: controlled inputs the bitwrench way (the
  component owns its inputs via handle methods; `bw.formData(el)`
  collects; validation lives in a handle method; errors render via
  slots), with one complete example: validation + error display + submit.
- **`bw.makeForm(config)`** in BCCL: fields array → labeled inputs,
  `getValues()` / `setValues()` / `validate()` / `setErrors()` handle
  methods, a11y-correct error wiring (§6). Validators are plain functions.

Schema-driven forms (from TACO schemas) are 2.2 material.

---

## 9. A 2.1 Component, End to End

One component, full grammar, every lifecycle stage — locally and over
bwserve. This is the example that goes in `thinking-in-bitwrench.md` and
the LLM guide once 2.1 lands.

### 9.1 The component

```javascript
bw.makeSensorCard = function(props) {
  return {
    t: 'div', a: { class: 'bw_bccl_card sensor_card' },
    c: [
      { t: 'div', a: { class: 'sc_label' }, c: props.label || 'Sensor' },
      { t: 'div', a: { class: 'sc_value' }, c: '—' },
      { t: 'div', a: { class: 'sc_unit'  }, c: props.unit || '' }
    ],
    o: {
      type: 'sensor-card',
      state: { value: null, unit: props.unit || '', topic: props.topic || null },

      slots: { label: '.sc_label', value: '.sc_value' },
      // auto-generates el.bw.setLabel/getLabel, el.bw.setValue/getValue
      // (targets cached once at hydrate — O(1) forever after)

      handle: {
        // the generic data entry point: el.bw.update(d), bw.update(ref, d),
        // and wire {type:'update'} all land here
        update: function(el, d) {
          el._bw_state.value = d.value;               // author surface
          el.bw.setValue(d.value + ' ' + el._bw_state.unit);
        }
      },

      mounted: function(el, state) {
        // tied subscription: auto-unsubscribes at unmount, no o.unmount needed
        if (state.topic) {
          bw.sub(state.topic, function(d) { el.bw.update(d); }, el);
        }
      }
    }
  };
};
```

### 9.2 Local walkthrough — every stage, every verb, every event

```javascript
// DEFINE — pure data. Serializable minus the o functions. Nothing happened.
var taco = bw.makeSensorCard({ label: 'CPU Temp', unit: '°C', topic: 'sensors:cpu' });

// CREATE+HYDRATE (explicit form) — detached, capable, unborn.
var node = bw.create(taco);
// node._bw_state ✓   node.bw.setValue ✓   in document ✗   mounted fired ✗

// MOUNT — the everyday form does all of it in one call:
var el = bw.mount('#dash', taco);          // ← normal path (skip bw.create above)
// or, manual composition:  dashEl.appendChild(node); bw.mountTree(node);
// Either way: UUID registered • mounted() fired synchronously (sub created,
// tied to el) • 'bw:mount' bubbled — a test or bwattach saw it happen.

// LIVE — tiers in action, cheapest first:
el.bw.update({ value: 71.2 });             // tier 1: component method
bw.pub('sensors:cpu', { value: 69.8 });    // pub/sub → same method, decoupled
el.bw.setLabel('CPU');                     // tier 2: slot, cached target
bw.message('.sensor_card', 'update', { value: 70.1 });  // tier 3: by name
bw.patch(el, { 'aria-busy': 'true' });     // tier 4: attribute, escape hatch

// REPLACE — identity dies and is reborn; old ref is stale:
el = bw.replace(el, bw.makeSensorCard({ label: 'GPU Temp', unit: '°C',
                                        topic: 'sensors:gpu' }));
// 'bw:unmount' (old: sub auto-unsubbed, el.bw stripped) then 'bw:mount' (new)

// REMOVE — unmount + detach:
bw.remove(el);
// 'bw:unmount' fired • _nodeMap clean • subscription gone • no Map entry
// pinning anything • a held reference's el.bw is gone (throws, not zombie)
```

### 9.3 The same component over bwserve

The page (served once, from an ESP32 or anywhere) loads bitwrench, defines
`makeSensorCard`, and connects. Two patterns, by where the component lives:

**Pattern A — client component, server feeds data** (preferred when the
page can ship the factory):

```
page:    var el = bw.mount('#dash', bw.makeSensorCard({label:'CPU', unit:'°C'}));
server → { "v":1, "type":"message", "ref":".sensor_card",
           "action":"update", "data":{ "value":71.2 } }
server → { "v":1, "type":"update",  "ref":".sensor_card",
           "data":{ "value":69.8 } }            // lands in handle.update
```

The MCU sends ~60 bytes per reading. The component does the DOM work.
This is the delta-update story: TACO once, numbers forever.

**Pattern B — server-sent structure, surgical patches** (server owns the UI):

```
server → { "v":1, "type":"mount", "ref":"#dash", "taco":
           { "t":"div", "a":{"class":"bw_bccl_card"}, "c":[
             { "t":"div", "a":{"class":"sc_value","id":"cpu_v"}, "c":"—" },
             { "t":"button", "a":{"class":"bw_act_sensor_reset"}, "c":"Reset" } ]}}
server → { "v":1, "type":"patch", "ref":"#cpu_v", "content":"71.2 °C" }

user clicks Reset → delegated dispatcher POSTs { action:"sensor_reset", ref:"…" }
server:  client.on('sensor_reset', fn)     // bw_act_* class, §5.4 — no code crossed
```

Same lifecycle either way: wire TACOs run create+hydrate (hydrate is a
near-no-op — no functions; `o.type` is data and DOES get wired; actions
need no wiring at all because the `bw_act_*` dispatcher is delegated),
then `mountTree`. `bw:mount` fires; an attached LLM watching the event
stream sees the card appear, can `inspect` it, can `message` it.

### 9.4 What writing this example surfaced (fed back into this spec)

- The **server-UI interactivity gap** (§5.4) — pattern B had no
  policy-compliant way to be interactive. Resolved with `bw_act_*`
  action classes (decided, no `o.*` addition).
- **Lifecycle events** (§1.2) — "the LLM can listen and react" needed
  lifecycle to be observable, not just app pub/sub. Now specified.
- **`bw.append` needed a position option** (`{before}`) — feeds and toasts
  prepend. Now specified.
- The manual-composition path (`create` → `appendChild` → `mountTree`)
  must stay documented — it's the natural vanilla-JS move and the docs
  currently teach it (toast example in thinking-in-bitwrench §10).

---

## 10. Spec-Test Contract (what coding agents implement against)

The prose above is rationale; **these tests are the contract**. Implement
until green. Named regressions come from `fable-feedback-2026-06-09.md`.

**Phase verbs**
- create returns hydrated detached node (state, el.bw, slots, classes, UUID class); NOTHING in `_nodeMap` — not the UUID and not the `id` attribute (rev 6); mounted not fired
- created-then-abandoned node (incl. one with an `id`) leaves zero registry entries — droppable with no leak and no janitor involvement
- mountTree registers both UUIDs and `id` attributes; ids deregister at unmount like UUIDs
- hydrate(node, taco) wires lifecycle; idempotent; wires `o.type` from function-free (wire) TACOs
- mountTree registers UUIDs, fires mounted synchronously, exactly once; fires `bw:mount` per component
- mountTree on manually-appended created node works (documented escape hatch)
- unmount: hooks fire self-first then document order; `bw:unmount` fires before properties stripped; everything hydrate+mount added is removed **including el.bw and _bw_type**; stale `el.bw.method` throws (REGRESSION F12)
- unmountChildren preserves target's state, subs, registration, **and unmount hook** (REGRESSION F8: bw.DOM eats target's unmount hook)
- mount(target,…) preserves target's own lifecycle (REGRESSION F9: 2.0.x bw.mount destroys container subs/state)
- element removed via raw `el.remove()` without unmount → no global retention; no `_unmountCallbacks` Map exists (REGRESSION F10)
- UUID collision at mount → fresh UUID stamped + registered, warning; original component untouched; ancestor unmount of re-uuid'd element does not affect original (REGRESSION F2: impersonation)

**Operations**
- mount/DOM alias returns root; replace returns new element; replace(ref, null) === remove
- append mounts through full pipeline incl. via protocol apply (REGRESSION: apply append skips walk); `{before}` positions correctly
- refresh: unmountChildren first (old children's hooks fire); render errors propagate; fires bw:refresh
- update(ref, data) → el.bw.update(data) when defined, emits bw:statechange; warns + no-op otherwise; never refreshes
- patch TACO/array: old children unmounted, new content mountTree'd (GAP-3); slot setter same path (GAP-4)
- error policy: hook throws → warn + continue; handle method throws → propagates
- getState returns shallow copy; mutation does not affect component
- **self-consistency invariant** (lifted from bw2x-state-and-addressing):
  after any tier-1/2 operation, `el._bw_state` matches what the DOM
  displays — asserted for every BCCL component with state (state says
  42 ⇒ the rendered value says 42)

**syncChildren**
- add/remove/move/keep by key; moved nodes preserve focus, input state, and component state; removed keys fire unmount; new keys fire mounted; final order matches items

**Action classes (`bw_act_*`)**
- click on `bw_act_x` element pubs `act:x` locally with `{action, value, ref}`; POSTs to bwserve when connected
- event heuristic: button/link → click; input/select/textarea → change (range → input); form → submit
- works identically for: wire TACO, local TACO, `bw.html()` string output, raw innerHTML insertion
- delegated — zero per-element listeners; unmount/remove needs no action cleanup
- `data-bw-action` no longer recognized anywhere (lint enforces in examples)

**Protocol**
- `v` validated; unknown v rejected; verb↔function 1:1 table test
- `exec` does not exist (returns false + warning); wire `register` refused; `call` invokes only client-registered fns
- string `on*` attrs in wire TACOs stripped before create

**String path / Path S (§1.4 — tested separately from Path L)**
- `bw.html` is pure: no registry entries, no DOM, no global state after any call
- `bw.html` without `{fns}` skips function attributes with one warning; with `{fns}` it fills the caller's registry; string `onclick` passes through escaped-correctly
- `bw.htmlPage` (handlers on by default) serializes function attributes into a page-scoped `<script>` registry; `{handlers:false}` emits inert output; two pages have independent registries; no global funcRegistry exists
- registry identity: three same-named different functions → three ids; one function reference used by three widgets → one id, three dispatch attributes; anonymous functions fine; emitted page's handlers actually fire (jsdom load test)
- markup stamps `bw_uuid_*`/`bw_lc`/`bw_is_component` for `o.*` elements; `bw_act_*` passes through
- **round-trip convergence**: `bw.html(taco)` → innerHTML → `mountTree(document.body)` → element addressable by uuid; `patch`/`remove`/`replace`/`bw_act_*` behave identically to a Path L element
- **behavior parity**: after `bw.hydrate(el, factoryTaco)` on adopted markup, `el.bw.*`, state, slots, and tied subs behave identically to Path L (same assertions run against both paths)

**Proofread fixes (rev 5)**
- mountTree idempotent: re-walking an already-mounted element is a silent no-op (reinserted detach, render-calls-mount, double adoption)
- unmounted element carries NO bw marker classes (bw_lc, bw_is_component*, bw_uuid_*) — a later mount walk treats it as a plain node; `bw.el(old-uuid)` finds nothing
- janitor reap of a disconnected subtree is observable via `bw:lifecycle` pub/sub mirror (DOM event alone would not bubble from a detached tree)
- `bw.janitor.flush()` makes every janitor test synchronous and deterministic

**Ungraceful teardown matrix (§2.1 — every row is a test)**
- raw `el.remove()` → janitor runs full unmount within a microtask: hooks fire, registries cleaned, tied subs gone
- `parent.innerHTML = ''` by user code → same, for every contained component
- ancestor removed raw, component 3+ levels deep → same
- pub to a topic whose tied subscriber was ungracefully removed → handler NOT called, sub auto-pruned, one warning (no ghost updates)
- `bw.el()`/`message`/`patch` on a disconnected element → null/false + registry pruned
- reparent and `syncChildren` move in the same task → NOT torn down; `mounted` does not re-fire
- `bw.detach(el)` → disconnected, lifecycle intact, janitor-exempt, tied subs still deliver; re-insert resumes without re-firing mounted
- async move without `bw.detach` → reaped (documented behavior, tested)
- modern build: registry entry purged via WeakRef/FinalizationRegistry after element GC (memory test)

**BCCL namespace (§13)**
- every factory emits `bw_bccl_*` root + sub-element classes; no `bw_card`-era component class appears in any factory output (automated over the whole catalog)
- variant (`bw_primary`) and utility (`bw_py_*`) classes unchanged

**Scale (GAP-8, finally)**
- benchmark page: 1000 components create/update/destroy; numbers recorded in repo

## 11. Release Gate (HN checklist)

| Gate | Why |
|---|---|
| Spec-contract tests green; coverage ≥ threshold | |
| Examples/pages drift-lint in CI: no `document.createElement`, no stray `innerHTML`, no `var(--`, no raw hex, no `data-bw-*` | examples are the corpus LLMs and reviewers imitate |
| `taco.schema.json` + `bw.validateTaco()` shipped | the schema claim needs an artifact |
| `docs/security.md` (threat model) live | preempt the worst thread |
| A11y audit (§6) done; keyboard smoke test in CI | checked in the first 10 minutes |
| **Documentation workstream (§16) complete** — thinking-in-bitwrench and all related docs rewritten to 2.1 grammar, migration guide shipped | the back half of thinking-in-bitwrench currently teaches what 2.1 demotes (render-rebuild as the stateful default, `${expr}` bindings, server-sent `register` code, `data-bw-action`, manual append/cleanup) |
| BCCL class rename (§13) complete; drift lint rejects old names | no `bw_card` mysteries in 3.3.33 |
| Benchmark numbers in README (1000 components, honest method) | preempt "does it scale" |
| Token-cost benchmark: same dashboard, TACO vs JSX (generate + inspect-and-modify) | turns "10x" into a demo |
| CHANGELOG current through 2.1.0 (backfill 2.0.27–32) | housekeeping is credibility |
| Old lifecycle docs stamped superseded; this doc linked from CLAUDE.md | anti-drift for all future agents |
| Demo assets: ESP32 live dashboard; bwcli streamlit-style demo; LLM-drives-the-UI capture via bwattach | the hook |
| The Preact answer, written down: 40KB **with** components + design-system generation + wire protocol, vs ~5KB bare engine | the rebuttal arrives within minutes; answer it first |

## 12. Scope Rule

**2.1.0 is the breaking release. The only things deferred are things that
can be added later without breaking anything.** (Per Manu, 2026-06-09:
"this is the time" — 8 GitHub stars is the cheapest breaking change
window this project will ever have. No `bw_card` mysteries still being
explained in 3.3.33.)

In scope because deferring would mean breaking later, or living with a
wart forever:

- The full verb rename and semantics changes (§1.3)
- BCCL class namespace rename (§13) — clean break, no dual classes
- **Alias purge** — 2.1.0 ships zero deprecation shims. Deleted outright:
  `bw.toggleStyles` (→ `toggleThemeMode` only), `bw._el` (→ `bw.el`),
  the `compileProps`/`renderComponent` throw-stubs, `htmlTable`/`htmlTabs`
  (deprecated v1 functions — `makeTable`/`makeTabs` are the replacements),
  `data-bw-action`, protocol `exec` + wire `register`, `_unmountCallbacks`
  Map, the rAF mounted path, `bw.createDOM`/`bw.cleanup` names.
- Protocol `v` field, action classes, lifecycle events, a11y, BCCL string
  props + RTL CSS, forms, syncChildren, `bw.derive` (§14), CSS grammar
  docs + typed rules objects (§15), schema + validator

Deferred — each verified additive-later with zero breakage:

- Signals / opt-in reactivity — philosophical no, not a deferral
- SSR rehydration beyond `bw.hydrate(node, taco)` — new capability, adds cleanly
- Python/Node server client library for bwserve (the streamlit wedge) —
  separate package; the protocol it speaks is frozen by this spec, so it
  can't be broken by waiting
- Message catalogs / pluralization — never in core (§7 pattern instead)
- Event-listener tracking (`_bw_listeners`) — additive bookkeeping;
  revisit only if measured
- Schema-driven forms — builds on shipped schema + makeForm, additive

## 13. BCCL Class Namespace Cleanup (in scope)

Rename now, once, completely. **No dual-class emission, no deprecation
period** — dual classes mean every CSS rule exists twice and the mystery
survives anyway.

| Class family | 2.0.x | 2.1.0 | Rule |
|---|---|---|---|
| BCCL component roots | `bw_card`, `bw_btn`, `bw_tabs`, `bw_modal`, … | `bw_bccl_card`, `bw_bccl_btn`, … | rename |
| BCCL sub-elements | `bw_card_title`, `bw_tab_panel`, … | `bw_bccl_card_title`, `bw_bccl_tab_panel`, … | rename |
| Lifecycle markers | `bw_lc`, `bw_uuid_*`, `bw_is_component`, `bw_is_component_bccl_*` | unchanged | already namespaced |
| Action classes | (`data-bw-action`) | `bw_act_*` | new (§5.4) |
| Variants | `bw_primary`, `bw_danger`, … | unchanged | palette-level, used across components — `bw_bccl_` would be redundant |
| Utilities | `bw_text_*`, `bw_py_*`, … | unchanged | CSS utilities, not components |
| Theme toggle | `bw_theme_alt` | unchanged | |

Mechanics: the rename touches `bitwrench-bccl.js`, `bitwrench-styles.js`,
`site.js`, every page/example/test, and the docs (§16). It is mechanical
(`bw_` component tokens → `bw_bccl_`), which is exactly why it happens in
the same release as the verb rename — one migration, one changelog entry,
one drift-lint rule (`bw_card`-era names fail CI), instead of two
migrations a year apart. Factory tests assert the new classes; the
hyphen-compat selector behavior (`bw-card` ≡ `bw_card`) follows the
rename (`bw-bccl-card`).

## 14. Derived State — `bw.derive()` (new, additive)

The one place React/Solid are honestly less code than bitwrench is
derived state: A changes, D = f(A, B) must recompute and reach its
consumers. React answers with useMemo (a *render cache* — meaningless
here, bitwrench has no re-renders); Solid answers with createMemo (a
dataflow node). bitwrench's answer is a **pub/sub combinator**:

```javascript
bw.derive(['cart:items', 'cart:coupon'], function(items, coupon) {
  return computeTotal(items, coupon);
}, 'cart:total', { el: optionalLifecycleTie, seed: [initialItems, null] });
```

When any input topic fires, recompute from the latest values (cached
inside the derive node — pub/sub semantics unchanged) and publish the
output topic. Consumers subscribe to `cart:total` like any topic; derives
chain; the `el` tie auto-unsubscribes on unmount like `bw.sub`.

The philosophical line, stated once: **dependencies declared, never
tracked.** The dataflow graph is readable in source — no proxies, no
getter traps, no compiler. The name is `derive` because bitwrench already
speaks it (`deriveShades`, `derivePalette`); it is deliberately NOT
called useMemo, which would import the wrong mental model.

Tests: recompute fires on any input; latest-values caching; seed values;
chained derives; element tie cleans up; a derive whose tied element is
janitor-reaped stops firing.

## 15. CSS Grammar Alignment (details: `bitwrench-css-cleanup-2026-06-09.md`)

The styling surface has eleven entry points (`css`, `injectCSS`,
`makeStyles`, `applyStyles`, `loadStyles`, `toggleThemeMode`,
`clearStyles`, `scopeRulesUnder`, `s`, `u`, `responsive`) — the same
disease the lifecycle had: overlapping verbs, unclear which to reach for.
Same cure, and the trio already secretly follows it:

| Styles | ≙ Components | Kind |
|---|---|---|
| `makeStyles(seeds)` — pure: seeds → palette + rules | `bw.create` | atomic |
| `applyStyles(styles, scope?)` — inject into document | `mountTree` | atomic |
| `loadStyles(seeds)` — generate + inject | `bw.mount` | compound |
| `toggleThemeMode(scope?)` — swap palette | a tier-1 update | live op |
| `clearStyles()` — remove injected CSS | `unmount` | atomic |

**Styles have a lifecycle too; document them as the same atomic/compound
grammar.** One mental model, taught once. The 2.1 deliverables on this
flank: the grammar documentation; scoped `toggleThemeMode(scope)`;
`s`/`responsive`/`u` framed as composition utilities, not parallel
systems; and **typed rules objects in `bitwrench.d.ts`** (a
CSSProperties-style interface) so TS-aware editors give property
autocomplete inside `bw.css({...})` today — the cheap 80% of the LSP
story, available before any LSP exists. (If traction comes, an LSP
follows, as it did for JSX; nothing in the architecture blocks it.)

## 16. Documentation Workstream (added to the todo list)

Every doc gets rewritten to 2.1 grammar **after the implementation is
green** (rewriting against an unimplemented API creates a third dialect).
Rules: one old→new grammar table (the §1.3 + §13 tables) drives every
edit; every code sample must pass the drift lint; removed APIs appear
nowhere except `docs/migrating-2.0-to-2.1.md`.

| Doc | What changes |
|---|---|
| `docs/migrating-2.0-to-2.1.md` | NEW — the old→new table, with the five behavior changes called out (mounted timing, bw.DOM return, update/refresh split, class rename, removed verbs) |
| `docs/thinking-in-bitwrench.md` | §§0–4 keep (they're the best writing in the repo). §5 "Three Levels" → data / render-loop / component(handle+slots), render-rebuild demoted to corner case. §6 o.mounted warning rewritten with the real rule. §7 bwserve: register-code and data-bw-action examples replaced (v field, bw_act_*). §10 patterns → append/remove/syncChildren. §12 quick ref + translation table regenerated (kill the `${expr}` row) |
| `docs/llm-bitwrench-guide.md` | full regrammar — this is the anti-drift document; add WRONG/RIGHT pairs for the exact failure modes observed (createElement, CSS vars, render-rebuild-everything) |
| `docs/bitwrench_api.md` + `pages/08-api-reference.html` | full regrammar |
| `docs/component-cheatsheet.md`, `component-library.md`, `state-management.md`, `app-patterns.md` | regrammar; state-management gains the update-tier table |
| `docs/taco-format.md` | o.* table (7 options, locked); consumed-not-retained; clone rule |
| `docs/framework-translation-table.md` | regenerate; "update text" row becomes `el.bw.setMsg()` not state+update |
| `docs/theming.md` | class rename; contrast-guarantee feature |
| `docs/bwserve.md`, `tutorial-bwserve.md`, `bwserve` pages (12, 14) | v field, verb table, bw_act_*, security posture link |
| `docs/security.md` | NEW (§5.3) |
| `docs/routing.md`, tutorials (website, embedded) | regrammar pass; embedded tutorial showcases pattern A delta updates |
| `pages/*.html` (00–17, component-gallery, thinking-in-bitwrench.html) | regrammar + class rename; these are live demos so they double as integration tests |
| `examples/` | regrammar + class rename; curated as the LLM-grounding corpus |
| `CLAUDE.md`, `dev/bitwrench-north-star.md` | point to this spec; update function lists |
| `README.md` | rewritten top: what it is, 40KB-with-batteries framing, Preact answer, schema + bwserve + LLM story |
| `dist/bitwrench.d.ts` | regenerate for renamed/removed API |

---

*Companion docs: `fable-feedback-2026-06-09.md` (audit findings F1–F13);
`bw-lifecycle-cleanup-2026-04-11-v1.1.md` (background analysis and
framework comparisons).*
