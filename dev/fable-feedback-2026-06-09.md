# Lifecycle Cleanup Review — Fable Feedback

> **Audit record.** Findings F1–F13 are resolved; the resolutions (some
> differing from the recommendations below) live in
> `bitwrench-lifecycle-cleanup-2026-06-09.md` and
> `bitwrench-css-cleanup-2026-06-09.md`. Read those for current design;
> read this for why.

**Date**: 2026-06-09
**Reviewed**: `bw-lifecycle-cleanup-2026-04-11-v1.1.md` (active design),
v1.0 (superseded), `bw-lifecycle-design.md`, `bitwrench-component-lifecycle.md`,
north star, and the live implementation in `src/bitwrench.js` @ v2.0.32.
**Scope**: observations only, no code changes. Line numbers refer to v2.0.32.

---

## Overall verdict

The v1.1 design is the strongest document in the series and the direction is
right. The v1.0 → v1.1 evolution shows good judgment: fusing create+hydrate
inside createDOM (instead of the parallel tree walk), demoting standalone
`hydrate()` to an external-DOM tool, softening UUID collision from throw to
warn, and locking decisions in a table. The "Design Decisions (locked)" table
and the TDD plan are exactly how a foundation release should be specified.

That said, I found one design contradiction, two latent bugs in the current
implementation that the design inherits or doesn't fully fix, and several
places where the design quietly conflicts with itself or with shipped code.
All are fixable on paper before implementation starts — which is the point
of the "DO NOT IMPLEMENT until reviewed" gate. The gate is working.

---

## Findings — design-level (fix in the v1.1 doc before implementing)

### F1. Cleanup order contradicts its own rationale for the root element

v1.1 locks "cleanup order: root-to-leaf, parent's unmount fires before
children's, so the parent can still read children during teardown."

But both the spec (Phase 6, steps 1–3) and the current implementation
(`bw.cleanup`, lines 1316–1386) do: `querySelectorAll('.bw_lc')` on the
element — which returns **descendants only** — then handle the element
itself **last**. So the outermost component's unmount fires *after* all of
its children are torn down and their state deleted. That is leaf-last for
everything except the root, where it's root-last. The one element most
likely to want to read its children during teardown (the composite/root
component) is the one element that can't.

Resolution options: (a) process self first, then descendants in document
order — matches the stated rationale; (b) keep current order and change the
stated rationale. Either is fine; they just can't both be in the doc. The
spec test "cleanup fires unmount hooks root-to-leaf (document order)" will
pass or fail depending on which you mean, so settle it before Phase 1.

### F2. UUID collision soft-skip leaves a live grenade

v1.1: on collision, "warn and skip — the element is structurally in the DOM
but has no lifecycle." The skipped element still **carries the colliding
`bw_uuid_*` class and the `bw_lc` class** in its class string.

Consequences with current cleanup logic:

- Any later `bw.cleanup()` of an ancestor of the skipped element finds it
  via `.bw_lc`, reads its UUID, and fires/deletes the **other** (legitimate)
  component's `_unmountCallbacks` entry and `_nodeMap` registration. The
  collision victim now tears down a component on the other side of the page.
- Same for cleanup's first pass (lines 1320–1325), which deletes `_nodeMap`
  entries for any descendant matching `[class*="bw_uuid_"]` — collision or not.

The skip must also strip the UUID class (or stamp a fresh one and register
nothing). "Skip" has to mean "this element is invisible to the lifecycle
system," not "this element impersonates another component during teardown."
Recommend adding a spec test: mount A with uuid X, attempt mount B with
uuid X (skip fires), cleanup B's parent, assert A's unmount did NOT fire
and A is still in `_nodeMap`.

### F3. Synchronous mounted() silently breaks the manual-append pattern

Removing the rAF is correct — the current rAF path is racy (if the element
is attached two frames later, mounted never fires; if never attached, it
silently drops). But the design only frames the change as *timing*. The
bigger behavioral change: under the sync model, mounted() fires from
`_mountTree`, which only `bw.DOM` / `bw.mount` / `bw.append` / `bw.replace`
call. This pattern stops working entirely:

- `var el = bw.createDOM(taco); container.appendChild(el);` — today the rAF
  hack catches this and fires mounted; after the refactor, mounted never fires.

That pattern appears in docs and examples (and is the natural thing a
vanilla-JS developer does). Options: (a) make `_mountTree` public
(`bw.mountTree(el)` or similar) so manual composers can opt in; (b) loudly
document "after createDOM, attach via bw.append/bw.DOM/bw.mount — raw
appendChild does not fire mounted"; (c) both. I'd do (c). Also grep
pages/ and examples/ for the raw-append pattern before shipping; this will
be the #1 silent migration breakage.

### F4. `bw.update(ref, data)` smart dispatch is the doc's one piece of magic

The whole document argues for explicitness — "no magic, no surprise
re-renders, the API names tell you the cost." Then `bw.update` is defined
as: cheap method dispatch if the component happens to define an `update`
handle, otherwise a destructive full `refresh` that wipes child state.
The same call site flips between the cheapest and most expensive operation
based on a property the caller can't see. A server emitting
`{type:'update'}` cannot know which it triggered. And `update` becomes a
reserved-ish handle name with hijacked semantics.

This is exactly the kind of cost-opaque dispatch the rest of the doc
(rightly) criticizes in reactive frameworks. Alternatives, in order of my
preference:

1. Fallback warns instead of refreshing: "no el.bw.update on <ref>; call
   bw.refresh explicitly if you want a rebuild." Keeps the convenience,
   removes the destructive surprise.
2. Drop smart dispatch; `bw.message(ref,'update',data)` + `bw.refresh(ref)`
   already cover both cases with honest names.
3. Keep as specced but require opt-in (component declares `update` in
   handle — which is option 1 with extra steps).

If you keep it as specced, at minimum the refresh fallback should log,
because "I sent new data and my form lost focus and child state" will be a
recurring bug report.

### F5. Error-handling policy contradicts shipped code

v1.1 Phase 5: "bitwrench does not catch exceptions in handle methods or
render functions. Errors propagate." But the v2.0.26 changelog (and current
code) added error boundaries: `o.mounted`, `o.unmount`, and `o.render` via
`bw.update` are wrapped in try/catch with `console.warn` (lines 1125–1142,
1411–1412). v1.1's own mount spec also fires mounted in try/catch.

So: render errors are swallowed today, and the active design says they
propagate. Pick one policy and state it once. My take: catch in lifecycle
hooks (mounted/unmount — a bad hook shouldn't break a mount/cleanup walk;
matches the bw.pub precedent), propagate in handle methods and render
(caller-initiated, caller should see the error). That's also defensible to
explain. Whatever you choose, the doc and code must match — this is a
"foundation release" claim.

### F6. GAP-7 framing: `_bw_state` is not internal, it's the component-author API

Policy 9 says `_bw_*` properties are not public API and users should go
through `el.bw`. But every handle-method example in the docs — including
the flagship TACO at the top of v1.1 — does `el._bw_state.value = v`
inside the handle. Component authors *must* touch `_bw_state`; there is no
other way to reach state from a handle method. So `_bw_state` is de facto
public for component authors and private for component consumers, which is
a perfectly good model (MFC member variables) — but it's not what Policy 9
says.

Two cheap ways to make the words match the reality:

- Reframe: "`_bw_state` is the component-author surface (your own handle
  methods, mounted, render); `el.bw` is the consumer surface. Consumers
  never touch `_bw_*`." No code change.
- Or unify signatures: `o.mounted`/`o.render`/`o.unmount` already receive
  `(el, state)`; handle methods receive only `(el, ...args)`. Passing state
  to handles the same way would remove most author-side `_bw_state`
  reaching. (This is a breaking signature change — v2.1.0 is the only
  window where it's cheap.)

Decide GAP-7 now; it shapes every BCCL factory written afterward.

### F7. Doc proliferation will misdirect future implementers (incl. LLMs)

Four lifecycle documents coexist. Only v1.0 is marked superseded.
`bw-lifecycle-design.md` (March) still specifies the **handle-object model**
(`hydrate()` returns `{el, uuid, addRow...}`, `o.methods`, throw-on-collision)
— all of which v1.1 explicitly reversed (el.bw, o.handle, warn+skip). Anyone
(human or agent) who lands on the March doc first will implement the wrong
architecture with full confidence; it's a detailed, persuasive document.

One-hour fix: add a status header to `bw-lifecycle-design.md` and
`bitwrench-component-lifecycle.md` ("historical / partially superseded —
authoritative spec is bw-lifecycle-cleanup-…-v1.1.md") and a one-line
pointer in CLAUDE.md. Given this project's explicit LLM-collaboration
workflow, doc hygiene is load-bearing in a way it isn't for other projects.

---

## Findings — implementation-level (current v2.0.32 behavior)

These validate or sharpen what the design already plans.

### F8. `bw.DOM`'s save/restore hack loses the target's own unmount hook (bug)

`bw.DOM` saves the target's `_bw_state`/`_bw_render`/uuid/`_bw_subs`, calls
`bw.cleanup(targetEl)`, restores. But cleanup's "check element itself"
block (lines 1357–1377) **fires the target's own unmount callback and
deletes it from `_unmountCallbacks`**. The restore puts back state, render,
uuid registration, and subs — but not the unmount callback. So re-rendering
into a lifecycle-managed target: (a) fires its unmount even though it isn't
being unmounted, and (b) permanently strips its unmount hook — the *next*
real cleanup is silent.

This is concrete proof the save/restore dance is broken, and the strongest
argument in the codebase for `bw.cleanupChildren()` (GAP-5). Suggest adding
a regression test for exactly this case to the Phase 1 spec tests — the
current test suite apparently doesn't catch it.

### F9. `bw.mount` doesn't even have the hack

`bw.mount` (lines 1288–1299) calls `bw.cleanup(container)` with **no**
save/restore at all. Mounting into a container that has its own state,
subs, or unmount hook destroys all of them. v1.1's GAP-5 only names
`bw.DOM`; the implementation plan's test list does say "bw.mount chains
cleanupChildren," so it's covered — but the gap description should name
both so the fix isn't half-applied.

### F10. `_unmountCallbacks` global Map: unnecessary indirection and a leak vector

The unmount callback is stored in a module-global `Map` keyed by UUID
(line 1139), holding a closure over `el`. If an element is removed by any
path that skips `bw.cleanup` (raw `el.remove()`, `innerHTML = ''` by user
code, a parent replaced via patch — see F11), the Map entry pins the whole
detached DOM subtree forever. This is the same class of leak the old
funcRegistry had, just smaller.

The indirection also buys nothing: cleanup always has the element in hand
when it needs the callback. Storing the unmount fn **on the element**
(`el._bw_unmount_fn`, which v1.1 already introduces for the pre-mount
window) and reading it from there during cleanup would make element
lifetime and callback lifetime identical — GC handles abandonment
automatically, and the global Map disappears. v1.1 currently specs the
opposite: mount *moves* the fn from the element into the Map. I'd invert
that decision: leave it on the element, delete the Map. Same lookup cost
(property access vs Map.get), strictly better GC behavior, one less
registry to keep consistent.

(If the Map survives for some reason I'm missing, it at least needs to be
swept or use the UUID→element `_nodeMap` for liveness checks.)

### F11. GAP-3/GAP-4 confirmed live in 2.0.32 — agree with the planned fix

`bw.patch` TACO/array paths (lines 1445–1458) and slot setters (lines
1168–1176) do `innerHTML = ''` + `createDOM` with no cleanup of old
children: unmount hooks don't fire, `_nodeMap` and `_unmountCallbacks`
entries leak (see F10 for why the latter is the worse half), tied subs
leak. The v1.1 fix (cleanupChildren before replacement, full pipeline
after) is right. Note the slot-setter fix and the patch fix should share
one code path — they're the same operation.

### F12. Cleanup doesn't delete `el.bw` or `_bw_type` (zombie handles)

Current cleanup deletes `_bw_state`, `_bw_render`, `_bw_refs` but never
`el.bw` or `_bw_type` (verified: no `delete el.bw` anywhere in src). A
caller holding a reference can invoke `el.bw.addRow()` on a cleaned-up,
detached element and it will half-work against a dead subtree — worst kind
of bug to chase. v1.1's Phase 6 spec correctly lists el.bw and _bw_type for
deletion; just flagging that this is a *change* from shipped behavior, so
it needs a spec test ("handle methods are gone after cleanup") rather than
an assumption that existing behavior carries over.

### F13. Minor: `_bw_refs` bubble-up duplicates aggressively

Every level copies all child refs upward (lines 1040–1069), so an element's
refs map contains every addressable descendant, at every ancestor level —
total entries are O(n·depth). Fine at bitwrench's target scale, and the
flat-access-from-root property is the point, but worth a line in the GAP-8
benchmark plan (deep trees with many id'd nodes), since refs maps are also
walked/rebuilt on re-render.

---

## Housekeeping

- **CHANGELOG drift**: package.json is 2.0.32 and git history shows
  v2.0.27–v2.0.32 released, but CHANGELOG.md top entry is "v2.0.26
  (unreleased)." For a project whose release procedure is this disciplined,
  the changelog should track. Also "v2.0.25 (unreleased)" is in the file
  while git shows it shipped.
- **v1.1 header** says "Current version: 2.0.31" — bump on next edit.
- The repo root has ~150 stray `screenshot-*.png` files — gitignore or
  sweep into dbg-images/.

## What's already good (keep doing this)

- The v2.0.26/27 incremental fixes (slot target caching, o.type wiring,
  SVG namespace, error boundaries-as-shipped, bw.el/bw.inspect) were the
  right "fix bugs now, refactor later" split — none of them painted the
  v2.1.0 design into a corner.
- The operation API naming (message/patch/append/replace/refresh/remove,
  names ordered by honesty about cost) is genuinely better than what most
  frameworks expose. `refresh` being scary-sounding is a feature.
- One protocol verb ↔ one client function ↔ one CLI subcommand is the
  kind of consistency that pays off for years. Hold that line.
- Locked-decision tables + explicit GAP numbering + TDD-first plan: this is
  how to run a foundation release. The review gate caught real issues
  (this doc is the gate working).

## Suggested order of resolution

1. Settle F1 (cleanup order) and F2 (collision skip) — they change spec tests.
2. Settle F4 (smart update) and F5 (error policy) — they change the API contract.
3. Decide F6/GAP-7 (state access) — it shapes all factories.
4. Fold F8/F9/F10/F12 into the Phase 1 spec-test list as named regression tests.
5. F3 (manual-append) — decide mountTree visibility, grep pages/examples.
6. F7 + housekeeping — one hour, do anytime before implementation starts.
