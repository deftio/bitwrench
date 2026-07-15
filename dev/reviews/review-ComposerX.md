# Design review: bitwrench v2.1.0 lifecycle cleanup

**Author:** ComposerX  
**Date:** April 2026  
**Scope:** Architecture and API design for v2.1.0 (per `dev/reviews/reviewer-briefing.md`), validated against primary design docs and the current `src/bitwrench.js` implementation (~v2.0.x).

---

## Starting from `README.md`

The root README is a strong on-ramp: it states the TACO mental model, shows `bw.DOM` / `bw.html` duality, and honestly positions the library (embedded, zero-deps, explicit state). Two tensions worth noting for the v2.1 effort:

1. **Marketing vs. mechanics:** The FAQ claims there is “no lifecycle to learn,” while the north star and lifecycle spec center a six-phase state machine (`define → create → hydrate → mount → update → unmount`). That is not a contradiction if “lifecycle” in the FAQ means “framework scheduler / virtual DOM reconciliation,” but it *is* a vocabulary clash. Experienced developers will read “no lifecycle” and then hit `mounted`, `unmount`, `_mountTree`, and cache rules. The v2.1 docs pass should align README language with the phase model (e.g. “no *reconciliation* lifecycle”).

2. **Small accuracy nits (for maintainers, not part of this review’s design verdict):** e.g. “biwrench” typo in the bwserve bullet. These do not affect the v2.1 lifecycle design but erode trust in a doc-driven project.

The README’s counter example—handlers in `a:` not `o.mounted` for re-renders—is exactly the kind of sharp edge the lifecycle split and `bw.refresh` naming are meant to make teachable.

---

## Summary

The v2.1.0 lifecycle cleanup is **directionally sound**: separating pure tree creation from mount-time registration, fixing patch/slot teardown leaks, and adding `append` / `replace` / `remove` addresses real bugs and real ergonomic gaps surfaced by the v2.1 sample walkthroughs (especially the todo-list narrative). The **single biggest risk** is **consistency of semantics under partial failure and under “off-label” DOM operations** (collision, reparenting, hydrate mismatch, mid-tree exceptions): the happy path is well specified; the system’s invariants after a soft failure or a thrown render are still partly hand-waved.

---

## Strengths

**1. The problem statement matches the code.** Today `bw.createDOM` interleaves structural build, cache registration, unmount bookkeeping, and mount-like behavior. For example, lifecycle elements get UUID + `_registerNode` during `createDOM`, and `mounted` / auto-render runs inside `createDOM` via `document.body.contains` + `requestAnimationFrame` (`src/bitwrench.js` around the lifecycle block). That matches the spec’s critique: you cannot obtain a “dumb” node or a clean mount boundary without reading source.

**2. `bw.cleanupChildren` as a primitive is the right replacement for `bw.DOM`’s save/restore dance.** The current implementation snapshots `_bw_state`, `_bw_render`, UUID, and `_bw_subs` on the container, runs `bw.cleanup` on the whole subtree, then restores those fields (`bw.DOM` ~lines 1226–1246). It works until someone extends cleanup ordering or adds new side-effectful fields—then restore list drift becomes a bug farm. A dedicated “clean descendants only” API is simpler to test and to reason about.

**3. First-class `append` / `replace` / `remove` closes an honest gap.** The todo sample (`dev/v2.1_samples/04-todo-list.md`) correctly identifies that `createDOM` + `appendChild` without a mount pass is a footgun. Encoding the supported pattern in API names buys teachability and keeps bwserve/bwcli aligned with client JS (per the context table in the lifecycle doc).

**4. Splitting “heavy rebuild” into `bw.refresh` while making `bw.update` a smart dispatch matches developer intuition** *if* the docs and TypeScript types hammer the distinction: `update` is “ask the component”; `refresh` is “accept destruction of child state.” The spec’s explicit callout that React-trained authors will lose child state on refresh is valuable—keep it prominent.

**5. JSON Schema as a v2.1 deliverable fits the north star.** Consequence (1)–(2) in `dev/bitwrench-north-star.md` (“TACO is data”) genuinely benefits from cross-language validation; this is not busywork.

**6. Locked decision to keep `el.bw` instead of a detached handle object** coheres with “DOM IS the registry” and with tooling (`querySelector`, Playwright, bwattach). A handle object would duplicate identity and encourage stale references.

---

## Concerns

**1. Hydrate vs. mount boundary is right in principle but `bw.hydrate(node, taco)` remains fragile.** The spec acknowledges GAP-2: pairing `taco.c` to `node.childNodes` by tag + position among same-tag siblings is *imperfect*. That is acceptable for a narrow SSR story if documented as such; it is risky if marketed as general “take any HTML, apply any TACO.” Mis-hydration could wire behavior onto the wrong subtree with no loud error. Mitigation ideas: strict mode that throws on ambiguity; optional keyed matching (e.g. `data-bw-key` or id) even if the product philosophy avoids `data-*` today—something has to disambiguate when tags repeat.

**2. “Soft” UUID collision (warn + skip) trades crash for silent partial behavior.** GAP-9’s resolution avoids a half-thrown tree, but the result—a node in the document without `_nodeMap`, `mounted`, or addressability—is hard for authors to notice. Consider: `console.warn` plus a one-time `el.classList.add('bw_hydrate_failed')` or similar inspectable marker so `bw.inspect` and humans can see failure mode without reading the console.

**3. `bw.update(ref, data)` smart dispatch may become a dumping ground.** One name doing method dispatch *or* full refresh *or* warning paths accumulates “what did this call do?” debugging cost. The spec mitigates with clear pseudocode; still, tooling (`bw.inspect` logging last update path?) or strict optional flags might help large teams.

**4. Root-to-leaf unmount order is coherent for parent reads during teardown** but differs from ecosystems many authors know (leaf-to-root). Document two things explicitly: (a) do not `removeChild` the tree from inside a parent `unmount` expecting children to still exist; (b) prefer `bw.remove` / `cleanup` ordering over ad-hoc DOM surgery.

**5. North star §7 vs. real component patterns:** Explicit updates scale until many regions must react to one payload (dashboards, permission matrices). The doc admits reactive bindings are less code; the answer “page-as-component + `update` method” is fine but should be backed by one large example and the promised 500–1000 component benchmark (GAP-8) so “O(1) everywhere” is evidence, not optimism.

**6. README / north star tension on “tooling parity.”** North star argues time-travel and HMR are “time, not architecture.” Partially true, but bitwrench also lacks a standardized *component identity* story beyond classes—no stable React-style “key” for reconcile-free list moves. Authors will reinvent ad hoc keys (`_todoId` on DOM) as in the todo sample. Consider whether v2.1 should standardize an optional internal property or pattern for list items without embracing full VDOM.

---

## Warnings

**1. Spec vs. shipped behavior on what counts as a “lifecycle element.”** The v1.1 spec’s hydrate section lists triggers including `o.handle` and `o.slots`. **Current** `createDOM` only enters the UUID / `bw_lc` / unmount registry path when `opts.mounted || opts.unmount || opts.render || opts.state`—not when the element has **only** `handle` or `slots` (`src/bitwrench.js`). Those elements still get `el.bw` but may miss `bw_lc` and UUID treatment. If v2.1 follows the spec table literally, this is a **behavioral fix** that can surface new cleanup/unmount coverage; treat it as breaking in spirit even if rare in BCCL (many components likely set `state` anyway).

**2. `bw.patch` and slot setters: confirmed leak path.** `bw.patch` on TACO/array uses `innerHTML = ''` then `createDOM` without `bw.cleanup` on previous children (`bw.patch` ~lines 1445–1458). Slot setters that replace TACO content do the same (`innerHTML = ''` + `appendChild(createDOM(value))`). The spec’s GAP-3 / GAP-4 matches the code—this is not theoretical; unmount hooks and pub/sub can orphan.

**3. Error handling philosophy is internally inconsistent today.** The lifecycle doc states that bitwrench does not catch exceptions in render/handle paths and that torn-down state after a failed refresh is the developer’s problem. **Current** code wraps `o.mounted` and `o.unmount` invocations in try/catch with console warnings inside `createDOM` / unmount callbacks. v2.1 should pick one story: either “mount/unmount are transactional boundaries that log and continue” *everywhere*, or “errors propagate” *everywhere*, or “mount/unmount catch, render/handle do not”—and document why. Mixed models confuse authors and test authors.

**4. `createDOM` registers UUIDs in `_nodeMap` immediately** (for lifecycle elements and pre-stamped UUID classes), while the v2.1 plan defers UUID registration to `_mountTree`. Tests and subtle timing bugs may exist where code resolves a node before it is “really” mounted. Migrating without a full audit of `_nodeMap` consumers could cause transient misses or double registration.

**5. Server-driven story + `refresh`:** Remote TACOs cannot carry functions, so `refresh` is client-only. The spec says this plainly; still, bwserve docs must steer authors to `replace` / `patch` / `message` for server-owned subtrees so half the operation matrix does not look “broken” when tried from Python.

---

## Errors

**1. Lifecycle doc version drift:** Header says “**Current version**: 2.0.31” while the briefing and README ecosystem reference 2.0.32. Not a logical error in the design, but it undermines “cite the spec” workflows.

**2. Implementation plan contradiction to be resolved before coding:** Phase 1 tests include “createDOM DOES register by id attribute in _nodeMap” alongside “createDOM does NOT register UUID in _nodeMap.” That pair is coherent **only if** id registration remains a special case during create. If any engineer interprets “no mount side effects” as “no `_nodeMap` writes at all,” tests will fight the id-cache behavior. The spec should state explicitly: **id-only registration during create: yes/no** and why.

*(No claim here that the north star’s nine-step chain is “logically false”—but see Concerns on hydrate pairing and scale evidence.)*

---

## Future vision

- **Keyed hydration or keyed patch** for list stability without VDOM—enough to support drag-and-drop and sorted tables without full `refresh`.
- **Optional dev-mode invariant checker** after mount: duplicate UUIDs, `bw_lc` without `_nodeMap`, slot selectors resolving to zero nodes—fail loud in dev, quiet in prod.
- **Formalize “structural” vs. “behavioral” components** in docs (server-push vs. client `o.*`) so the mental model for bwserve users is as crisp as for SPA users.

---

## Wish list

- `bw.updateSlot` examples next to `bw.message` for “broadcast” patterns—today’s mental load is high for newcomers.
- A single “lifecycle cheat sheet” diagram in README linking to the six phases (without claiming “no lifecycle”).
- CLI/schema: `bwcli validate` returning machine-readable paths for CI (the spec mentions error path reporting—prioritize it).

---

## Opinions

I buy the core bet: **plain objects + explicit methods + server-push** is a coherent triangle for embedded, internal tools, and LLM-generated UI. The MFC/Swing analogy is not nostalgia—it explains why `el.bw.setX` and surgical updates are the right default when the DOM is trustworthy and component counts stay bounded.

I would **not** urge bitwrench to become reactive; I *would* urge the team to **document pain honestly** (complex forms, repeated structural lists) and ship **one** large reference app per pain point so critics see the intended patterns rather than inferring gaps from API lists.

The v2.1 lifecycle separation is the right time to make **mount** the single authority for “this node participates in bitwrench’s caches and hooks,” matching author intuition and closing the todo-list class of bugs.

---

## Open questions response (briefing Q1–Q4 / spec GAPs)

The v1.1 doc locks **Q1-style** “handle object vs. `el.bw`” in the Design Decisions table—**I agree with the lock.** A separate handle duplicates identity, complicates bwserve addressing, and fights the “DOM is registry” story.

**GAP-7 (uncontrolled `_bw_state`):** Prefer **(b) document as internal** plus optional **thin `getState`/`setState` shims** on `el.bw` *only if* you want DevTools ergonomics—not automatic `refresh` on every `setState`, which smuggles reactivity back in. If you add setters, make them explicit about whether they trigger render.

**GAP-9 (partial mount failure):** Soft skip is reasonable; **pair it with inspectable markers** on skipped nodes and a structured warning object (even just `{ uuid, reason }` in debug mode).

**GAP-2 (hydrate pairing):** Treat standalone `bw.hydrate` as **best-effort, documented constraints**; do not imply feature parity with `createDOM` fusion.

**GAP-10 (listener tracking):** Accepting deferral is fine for v2.1; the docs should still say **“raw `remove` without `cleanup` is undefined behavior for bitwrench components.”**

---

## Mental build: multi-step form with validation

Sketch: wizard shell as one component with `o.state.step` and slot setters for progress text; each step is a child created with `bw.append` when entering the step, removed with `bw.remove` when leaving (or kept mounted but hidden via handle methods—either pattern works). Cross-field validation fits naturally in a single `el.bw.validateAndNext()` handle; no need for reactive graphs.

**Where it feels natural:** explicit transitions, server can PATCH labels over bwserve, focus management localized to handles.

**Where it fights:** if validation requires **replacing** an inner widget with a different component *and* preserving sibling state—`replace` nukes focus; you must design the subtree so replace boundaries are acceptable, or use handles that mutate in place. That is acceptable but must be taught as **composition discipline**, not an accident.

---

## Appendix A — Author opinion (expanded, direct)

**Good / bad in plain terms:** Bitwrench is **strong where it deliberately optimizes** (plain objects, explicit updates, server/LLM-shaped data, tiny deploy surface, inspect/screenshot story). It is **weaker where big SPA ecosystems optimize** (default hiring pool, infinite third-party widgets, years of battle-tested a11y patterns in community components). That is mostly a **scope and maturity** gap, not proof the trunk is wrong.

**What works:** One artifact (TACO) spanning browser and wire format; imperative `el.bw.*` matching how many real UIs are maintained after the first reactive honeymoon; bwserve + bwcli as **first-party** remote control and verification; schema-shaped UI as a real differentiator at boundaries.

**What to respect as hard problems:** Identity and list stability without a reconciler; teardown symmetry (patch/slots/dynamic children); teaching “explicit update” without sounding like “more boilerplate forever.”

**Would I use it?** Yes for **embedded panels**, **internal tools**, **SSE/server-driven surfaces**, and **LLM-in-the-loop UI** where JSON + inspect + screenshots beat JSX pipelines. For a **default enterprise SPA** with expectations around React hiring and npm ecosystem mass, I would still often default to React/Vue **unless** constraints (offline toolchain, device class, server-owned UI) point here.

**One-line verdict:** A **sharp, opinionated tool** with a coherent contract—not a drop-in cultural replacement for “the React ecosystem,” and that is fine if messaging stays accurate.

---

## Appendix B — Maintainer thesis (paraphrased) and reviewer response

**What you (maintainer) argued — summary for notes:**

- “Show don’t tell”: accuracy over religious wars; React/Vue/Solid are legitimate; the goal is **correct framing and fixed implementation**, then let comparisons be empirical.
- JSX is the wrong abstraction for many jobs: not HTML; state/events live outside; that helped justify **stacks of tooling** (Babel, TypeScript, Tailwind, bundlers, etc.).
- A counterfactual direction: **`{taco}`** — expressive power including **less need for Tailwind-style class oceans** and **less dependence on CSS variables** because **tokens and CSS can be generated from JS**; after 2.1, components can be **built atomically in one place**, including targeted stateful rendering.
- **Retained-mode mental model:** DOM should not be treated as an unstable surface that must be rediscovered via diffing (virtual or otherwise). **Native toolkits (MFC, Qt, iOS-style APIs)** use components that **own state** and **messages/APIs** between them; that can be performant.
- **Differentiators:** bwserve + bwcli → server-driven UI, live inspect, screenshots at page/component/element level; BCCL as **bootstrap/shadcn-class** batteries; early release but **a lot of lifting**; **TACOs schema-able** → discipline without compiler walls.
- **Pushback on “web dev Reactified”:** ten years of defaults shaped thinking; you may be wrong but the monoculture is real.
- **Go-to-market:** fix 2.0.x **warts in 2.1**, then **seed embedded devs and LLM UI devs** first (natural fit, help with debugging/tooling); ESP32-class **no cloud** apps; LLM can “see” the browser via inspect/screenshot and push **JSON-like partial updates**.

**ComposerX response — where that thesis lands:**

**Fair and important:**

- The **tooling pile** around the *modal* React product is as much **culture and default stack** as strict necessity; minimal paths exist but are not what most teams run.
- **TACO-as-data + schema at the boundary** is a **genuine axis** React does not own: validation in CI, on the server, and for LLM output without compiling JSX.
- **Explicit updates + DOM as handle** is a **valid** and **proven** paradigm (desktop retained mode); **O(1) surgical updates** vs **tree reconciliation** is a real trade, not superstition.
- **bwserve/bwcli/inspect/screenshot** is a **coherent product layer** most frameworks do not ship first-party.
- **Early audiences (embedded, LLM UI)** are a **coherent** beachhead: lower ecosystem expectations, higher payoff from wire format + observability.

**Where to tighten claims (accuracy, not surrender):**

1. **“JSX poisoned thinking”** → more precisely: **default reconciliation + component identity owned by the framework** shaped the ecosystem; JSX is replaceable (Solid, HTM, none). The deeper lock-in is **who owns updates and identity**, not angle brackets.

2. **“Five compilers”** → often **true in practice**, not **logically mandatory**; skeptics will nitpick. Prefer: **“typical org stack”** vs **“bitwrench’s default stack.”**

3. **“No Tailwind / no CSS variables because JS”** → **strong reduction of *some* needs**; not a proof you **never** want CSS variables (third-party CSS, foreign markup, some theming integration paths). Say **reduces dependence**; document limits.

4. **MFC/Qt/iOS analogy** → good **intuition pump**; web differs (**untrusted markup, crawlers, integrations, extensions**). Retained mode still works; the analogy is **not proof** for every web SPA constraint.

5. **“SPA replacement”** → technically arguable for many apps; **organizationally** React is also **labor market + liability + vendor ecosystem**. Bitwrench can win **segments** first; **“replacement”** without qualification feeds flame wars instead of demos.

**Sharp line for hostile readers:**

> “We’re not replaying 2015 React with different syntax—we’re choosing a different **contract**: data-first UI, explicit updates, DOM-addressable components, and schema-friendly wire operations. Compare on **measurable** tasks (bundle, boot, SSE, inspect, offline).”

---

## Appendix C — “Show don’t tell” consolidation: framing vs implementation

**Maintainer intent (for notes):** Pushback in discussion is not resistance to depth—it is a demand that **bitwrench be accurate for what it is**, fix issues, and accept outcomes without framework holy wars. **2.1 = good bones** before loud promotion; **embedded + LLM UI** first; large-audience React/Vue/Solid acknowledged as legit.

### C.1 Framing (so promotion does not outrun the product)

| Topic | Note |
|--------|------|
| **Contract, not enemy** | Lead with bitwrench’s **contract** (DOM = component; explicit updates; wire = data). Avoid “X is trash” as the headline. |
| **Two early audiences, two sharp edges** | **Embedded:** bytes, predictability, reconnect, “what if power cycles mid-stream.” **LLM UI:** **idempotent ops**, **schemas**, **inspect/screenshot** fields, replay logs. |
| **Torture tests as artifacts** | One **public** artifact per loud claim: scale page, leak/regression tests for patch/slot, bwserve replay, ESP32-sized demo without npm. |
| **CSS / tokens** | One honest paragraph on **interop limits** (third-party CSS, foreign themes) to pre-empt bad-faith “gotchas.” |
| **README vocabulary** | Align “no lifecycle” FAQ with **six-phase** truth (e.g. “no **reconciliation** lifecycle”) per main review §Starting from README. |
| **Doc version pins** | Small drift (e.g. 2.0.31 vs 2.0.32) hurts **accuracy brand** for grep-and-cite early adopters. |

### C.2 Implementation / 2.1 — warts that early adopters will feel

| # | Item | Why it matters |
|---|------|----------------|
| 1 | **Single mount authority** | No mount-like behavior hidden in `createDOM`; `append` / `replace` / mount wrappers always hit the same path. |
| 2 | **Teardown symmetry** | Any path that replaces or nukes children (`patch`, slot setters, `innerHTML`) runs the same cleanup as `remove` (GAP-3/4 class). |
| 3 | **Lifecycle eligibility** | Spec vs shipped: **`handle`/`slots`-only** vs **`state`/`render`/`mounted`/`unmount`** gating for `bw_lc` / UUID / unmount — align and test. |
| 4 | **Error semantics** | One documented policy: propagate vs log-and-continue; **mixed** without docs reads accidental (see main Warnings §3). |
| 5 | **Partial failure visibility** | UUID collision “skip” needs **inspectable** failure (class marker, `bw.inspect`, debug struct). |
| 6 | **Standalone `hydrate`** | Document **narrow** reliability; do not imply parity with fused `createDOM`. |
| 7 | **Server-driven ops** | Steer authors: **`refresh`** is client-function-heavy; server paths emphasize **`replace` / `patch` / `message`**. |

### C.3 One project sentence (messaging)

> **2.1 makes the lifecycle and teardown contract honest and testable; public promotion tracks demos and schemas that enforce that contract.**

---

## Appendix D — Chat log: “what did I miss?” checklist (verbatim utility)

Short list the maintainer can drop into planning docs:

**Framing**

- Name the **contract**, not the competitor.
- Segment **embedded** vs **LLM UI** failure modes in docs first.
- **Show don’t tell** = versioned **torture tests + demos** per claim.
- **Under-promise** JS/CSS token story at third-party boundaries.

**2.1 bones**

- Mount authority; teardown symmetry; lifecycle eligibility; error policy; visible soft-fail; hydrate scope; bwserve op matrix clarity.

**Strategy**

- Embedded + LLM first → **mileage and tooling** before arguing “large SPA default.”

---

*End of review (includes appendices A–D from follow-up discussion, April 2026).*
