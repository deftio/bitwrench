# Reviewer Briefing: bitwrench v2.1.0 Lifecycle Cleanup

> **HISTORICAL (2026-07):** this briefing was written while v2.1 was in the
> design phase. v2.1 has since been implemented; the spec of record is
> `dev/bitwrench-lifecycle-cleanup-2026-06-09.md` and the shipped behavior is
> documented in `docs/`. Kept as context for the reviews in this folder.

**Date**: April 2026
**Current shipped version**: v2.0.32 (on npm, in production)
**Target version**: v2.1.0 (design phase -- not yet implemented)
**Repository**: https://github.com/deftio/bitwrench

---

## What is bitwrench?

bitwrench is a JavaScript UI library. Instead of JSX, templates, or a
virtual DOM, it uses plain JS objects called TACOs (Tag, Attributes,
Content, Options) to describe UI components:

```javascript
{
  t: 'div',
  a: { class: 'card', onclick: fn },
  c: ['child content'],
  o: { state: { count: 0 }, handle: { increment: function(el) { ... } } }
}
```

A TACO is created, turned into a DOM element, and then discarded -- the
DOM IS the component. No virtual DOM, no retained descriptors, no diffing.
Components are updated by calling methods on them (`el.bw.increment()`),
not by re-rendering from state. This is the MFC/Swing/Delphi lineage,
not the React lineage.

bitwrench ships as a single JS file (~38KB gzipped), works without a
build step, and includes:
- **Core**: TACO lifecycle, DOM helpers, pub/sub, CSS generation from palette objects
- **BCCL**: 30+ reference components (cards, tables, tabs, modals, etc.)
- **Styles**: full design system generated from seed colors (spacing, typography, elevation, color roles)
- **bwserve**: server-driven UI via SSE (any backend language pushes TACOs to the browser)
- **bwcli**: remote page inspection, mutation, and screenshot from the command line

---

## Your assignment

You are reviewing the **architecture and API design** for the v2.1.0
lifecycle cleanup. This is a design review, not a code review.

### DO

- Read the 3 primary design docs (listed below) thoroughly
- Explore the codebase to understand how things work today
- Browse the live pages to see bitwrench in action
- Reference the supporting design docs in `dev/` for deeper context
- Be brutally honest -- "this is stupid because X" is more valuable
  than "looks good"
- Challenge the philosophy, not just the implementation details
- Call out real problems: architectural flaws, missing edge cases,
  scaling concerns, ergonomic failures, logical errors in the reasoning
- Provide your own perspective on what bitwrench should or shouldn't do
- Note anything that confused you -- confusion is a signal

### DO NOT

- Modify any code or files (except your own review doc)
- Open PRs or issues
- Assume bitwrench should work like React/Vue/Solid/Svelte -- it is
  intentionally different. Challenge whether the difference is WRONG,
  not whether it is DIFFERENT
- Limit feedback to surface-level observations -- go deep

---

## Resources

### Primary design docs (read in this order)

These are the 3 docs you must read before writing your review.
Total reading time: ~45 minutes.

**1. North Star (~10 min)**
`dev/bitwrench-north-star.md`

The philosophy. A chain of 9 consequences flowing from one core
decision: TACO is a JS object. This frames everything else. Pay
attention to "For reviewers: what to challenge" at the end -- it
separates productive challenges from already-settled questions.

**2. Lifecycle Design v1.1 (~25 min)**
`dev/archive/bw-lifecycle-cleanup-2026-04-11-v1.1.md`

The full technical spec for the v2.1.0 cleanup. Covers:
- All 6 lifecycle phases with function signatures
- CSS class namespace registry (what each `bw_*` class means)
- DOM properties on elements (internal, not public API)
- New convenience operations (append, replace, remove)
- Operations across contexts (client, server, LLM, CLI)
- Open design questions (4 items needing decisions -- input welcome)
- Implementation plan (4 phases)
- TACO JSON Schema

**3. Worked Examples (~10 min)**
`dev/v2.1_samples/` -- five files:

| File | What it tests |
|------|--------------|
| `01-card-lifecycle.md` | Single component: full lifecycle from define to unmount |
| `02-two-component-page.md` | Two components communicating via pub/sub, component replacement |
| `03-dashboard-page-component.md` | Page-as-component pattern, nested components, slot setters with TACO content |
| `04-todo-list.md` | Dynamic children: add/remove without rebuild. Intentionally shows a first attempt that discovers an API gap, then the corrected version |
| `05-tic-tac-toe.md` | Game logic: state management, conditional rendering, reset |

These examples were written against the proposed API to validate the
design. Several discovered gaps that were then fixed in the spec.

**New APIs in examples** (proposed, not yet implemented):
`bw.append()`, `bw.replace()`, `bw.remove()`, `bw.updateSlot()`

**Existing APIs in examples** (shipped today, v2.0.32):
`bw.mount()`, `el.bw.*` handles, `el.bw.setX()` slots, `bw.pub/sub`,
`bw.update()`, `bw.patch()`, `bw.message()`, `bw.el()`, `bw.$()`,
`bw.loadStyles()`, `bw.css()`

### Live pages (bitwrench in action)

Browse these to see how bitwrench works today. All pages are built
with bitwrench -- they dogfood the library.

**GitHub Pages**: https://deftio.github.io/bitwrench/pages/

Key pages for a reviewer:

| Page | What it shows |
|------|--------------|
| `index.html` | Landing page and overview |
| `00-quick-start.html` | Getting started, basic TACO usage |
| `01-components.html` | BCCL component showcase |
| `03-styling.html` | Theme/palette system, design tokens |
| `04-dashboard.html` | Dynamic dashboard with theme switching |
| `05-state.html` | State management, handles, slots, pub/sub |
| `07-framework-comparison.html` | Side-by-side: bitwrench vs React vs Vue |
| `08-api-reference.html` | Full API reference |
| `10-themes.html` | All 12 built-in theme presets |
| `11-debugging.html` | Inspection and debugging tools |
| `component-gallery.html` | All BCCL components with live examples |
| `thinking-in-bitwrench.html` | Mental model guide for developers |

### Source code

| Path | What's there |
|------|-------------|
| `src/bitwrench.js` | Core library (~3900 lines) -- lifecycle, DOM, pub/sub, CSS, bwserve |
| `src/bitwrench-styles.js` | Design system: structural + themed CSS generation (~2190 lines) |
| `src/bitwrench-bccl.js` | BCCL reference components (cards, tables, tabs, modals, etc.) |
| `src/bitwrench-color-utils.js` | Color manipulation (hex/hsl, deriveShades, derivePalette) |
| `test/bitwrench_test.js` | Unit tests (~1800 tests, 97%+ coverage) |
| `pages/*.html` | Documentation/demo pages (all dogfood bitwrench) |

### Supporting design docs in `dev/`

These provide deeper context if you need it. Not required reading,
but available:

| Doc | Topic |
|-----|-------|
| `bitwrench-2x-discussion.md` | Master design discussion for v2.x |
| `bw2x-state-and-addressing.md` | State management, bw.patch, bw.update, UUID addressing |
| `bw-client-server.md` | bwserve protocol design |
| `bw-cli-design.md` | bwcli command-line tool design |
| `bw-chart-design.md` | Future: SVG charting library (P6, not yet implemented) |
| `bitwrench-component-lifecycle.md` | Current v2.0.x lifecycle documentation |
| `bw-lifecycle-design.md` | Earlier handle-object prototype (150 tests, alternate approach) |
| `qa-todo.md` | Full task tracker with priorities |
| `bitwrench_agui_a2ui_feedback.md` | AG-UI / A2UI protocol adapter analysis |

---

## What exists today vs what v2.1.0 changes

### Current shipped API (v2.0.32)

| API | What it does |
|-----|-------------|
| `bw.createDOM(taco)` | TACO -> DOM element. Currently does create + hydrate + partial mount in one pass (this is the debt we're cleaning up) |
| `bw.DOM(selector, taco)` | Mount TACO into a container, returns the container |
| `bw.mount(selector, taco)` | Mount TACO, returns the root element (for `el.bw` access) |
| `bw.cleanup(element)` | Fire unmount hooks, deregister from caches, delete state |
| `bw.update(element)` | Re-render via `o.render` (heavy path -- destroys children, rebuilds) |
| `bw.patch(ref, content)` | Lightweight update: replace text, attribute, or children |
| `bw.pub/sub/unsub` | Pub/sub messaging between components |
| `bw.message(target, action, data)` | Dispatch to `el.bw[action](data)` |
| `el.bw.*` | Handle methods on mounted components (from `o.handle`) |
| `el.bw.setX()/getX()` | Slot getters/setters (from `o.slots`) |
| `bw.el(ref)` | Element resolver: DOM element, id string, CSS selector, UUID class |
| `bw.$(selector)` | Multi-match element resolver |
| `bw.assignUUID(taco)` / `bw.getUUID(el)` | Pre-assign / read identity on TACOs and elements |
| `bw.makeStyles/loadStyles/toggleThemeMode/clearStyles` | Design system generation from seed colors |
| `bw.css(rules)` | Generate CSS strings from JS objects + palette values |

Identity uses CSS classes only: `bw_uuid_*` (unique per mounted element),
`bw_lc` (lifecycle marker -- needs cleanup), `bw_is_component` (has
state/methods). No `data-*` attributes anywhere.

### What v2.1.0 changes

**The core problem**: `bw.createDOM()` tangles 3 lifecycle phases into
one function. You can't create a node without wiring lifecycle. You
can't hydrate without partially mounting.

**The fix**: Separate lifecycle into distinct single-step phases:

```
define -> create -> hydrate -> mount -> update -> unmount
```

**New APIs** (proposed, not yet implemented):

| API | What it does |
|-----|-------------|
| `bw.hydrate(node, taco)` | Wire lifecycle onto a created node (state, handles, slots, hooks). Does NOT stamp UUID or fire mounted(). |
| `bw.append(parent, taco)` | Create + hydrate + appendChild + mount. The correct way to add dynamic children. |
| `bw.replace(ref, taco)` | Cleanup old, create + hydrate + mount new at same DOM position. Returns the new element. |
| `bw.remove(ref)` | Cleanup + remove from DOM. |
| `bw.updateSlot(ref, name, value)` | Update a named slot across one or many matched components. |

**Changed APIs**:

| API | What changes |
|-----|-------------|
| `bw.createDOM(taco)` | Becomes pure create only. No lifecycle wiring, no identity stamping. |
| `bw.DOM(selector, taco)` | Becomes thin wrapper: cleanup + create + hydrate + mount. Same external behavior. |
| `bw.mount(selector, taco)` | Same -- thin wrapper calling single-step functions underneath. |

**Unchanged**: TACO format, `el.bw.*` handles, slot setters, pub/sub,
`bw.cleanup()`, CSS generation, bwserve protocol (minor internal
updates), BCCL components.

---

## What we're asking you to evaluate

1. **Does the chain of reasoning hold?** The north star argues from
   first principles. If a link in the chain is wrong, identify which
   one and why it fails.

2. **Are the 6 lifecycle phases the right decomposition?** Could they
   be fewer? Are any missing? Is the phase boundary between hydrate
   (wiring) and mount (entering the document) in the right place?

3. **Does the API surface feel right?** The examples show real usage
   patterns. Do the proposed operations cover the cases you'd need?
   What's missing?

4. **Open design questions.** The lifecycle doc has 4 open questions
   (Q1-Q4). Input on any is welcome, especially Q1: should the
   component API be `el.bw.method()` (current) or a standalone handle
   object?

5. **What happens when things go wrong?** The docs describe the happy
   path thoroughly. We need the unhappy path. What if a handle method
   throws? What if a slot selector matches nothing? What if
   bw.append() is called on an element not in the document? What if
   bw.replace() is called on an element that's already been removed?
   Where does this design fail ungracefully? Where are errors silent
   when they should be loud (or loud when they should be silent)?

6. **Build something mentally.** Pick a component you've actually
   built before -- a multi-step form, a data table with sort/filter,
   a chat widget, a drag-and-drop list, whatever is real to you.
   Sketch (even just in your head) how you'd build it with the
   proposed API. Where does it feel natural? Where does it fight you?
   Where do you reach for something that isn't there? This exercise
   surfaces ergonomic issues that pure doc-reading won't.

7. **What did we miss?** Blind spots, edge cases, scaling concerns,
   wrong assumptions -- anything.

---

## Review output format

Place your review in this directory:

```
dev/reviews/review-<your-name-or-identifier>.md
```

**Do not modify any other files.**

Structure your review with these sections. You don't need to have
content in every section -- skip any that don't apply. But the more
thorough the better.

### Required sections

**Summary**
2-3 sentences: your overall assessment. Is the design sound? What is
the single biggest risk?

**Strengths**
What works well in the design. What decisions are smart and why.
Be specific -- "the lifecycle separation is good" is less useful than
"separating hydrate from mount means you can test component wiring
without a DOM, which enables X."

**Concerns**
Issues that need attention but aren't necessarily wrong. Design
tensions, trade-offs that might bite later, areas where the reasoning
is thin. For each concern: what's the risk, how likely is it, what
would you do differently?

**Warnings**
Serious issues. Things that could cause real problems if shipped as
designed. Architectural mistakes, missing error paths, invariants that
can't be enforced, performance cliffs, backwards-compatibility breaks
that aren't acknowledged.

**Errors**
Outright mistakes. Logical contradictions in the docs, APIs that
can't work as described, impossible state transitions, incorrect
claims about browser behavior or DOM APIs. Cite the specific doc and
section.

### Optional sections

**Future Vision**
Where should this go after v2.1.0? What does the lifecycle cleanup
enable that isn't in the current plan? Are there architectural
directions the design opens up (or closes off) that the authors
may not have considered?

**Wish List**
Things you'd want if you were building on bitwrench. API ergonomics
improvements, missing convenience operations, developer experience
gaps, documentation needs. These are wants, not requirements --
things that would make the library more pleasant to use.

**Opinions**
Your subjective take. Do you buy the argument that TACO-as-data is
better than templates for certain workflows? Is the explicit-update
model the right call? Would you use this? Why or why not? (Remember
the ground rule: state your reasoning, not just your preference.)

**Open Questions Response**
If you have input on Q1-Q4 from the lifecycle doc, put it here with
your reasoning.

---

## Ground rules

- **No code changes.** This is a design review. Your deliverable is
  a markdown document with your analysis.

- **Be specific.** Reference doc names and section headers when
  citing issues. "The north star, section 7, claims X but Y" is
  actionable. "The update model seems off" is not.

- **Challenge the architecture, not just the API names.** We can
  rename functions. We can't easily change the phase model or the
  decision to not use reactivity. Focus your energy on the hard-to-
  change decisions.

- **Don't assume React/Vue/Solid is the baseline.** bitwrench is
  intentionally different from virtual-DOM frameworks. The question
  is not "why doesn't bitwrench do what React does?" but "does
  bitwrench's approach fail for a concrete reason?" If it does,
  describe the failure scenario.

- **State your reasoning everywhere.** This applies to every section,
  not just opinions. "This is a concern" is not actionable. "This is
  a concern because in scenario X, the invariant Y breaks, which
  causes Z" is actionable. We need the WHY, not just the WHAT.

- **Honest > polite.** We'd rather learn our design is flawed now
  than after implementation. If something is wrong, say so plainly.
