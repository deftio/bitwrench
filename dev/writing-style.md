# Bitwrench Writing Style

Read this before writing or editing any doc, README, comment block, or
release note in this repo. If your prose doesn't sound like this document,
rewrite it before committing.

**Status**: Draft for maintainer correction. Distilled July 2026 from
maintainer-authored sources (list at bottom). The fastest way to improve
this guide is to mark passages "I'd never write that."


## The voice in one paragraph

An experienced engineer explaining something to another engineer, with no
one to impress. Claims are argued from consequences, not asserted from
authority. Weaknesses get named before a critic can name them. Rules are
stated flat. Every exception carries its reason, because pragmas without
context are how codebases rot. The tone is confident about the ideas and
unpretentious about everything else -- "your mileage may vary" and "this is
the entire premise" can live in the same document.

## Principles

### 1. Show the reasoning, not just the rule

When a doc tells the reader to do something, it also says why -- and the
"why" is a consequence the reader can check, not an appeal to authority.

Bad: "Best practice is to use `a: { onclick: fn }` for event handlers."
The reader has to take it on faith.

Good: "Handlers attached in `o.mounted` are lost when the component
re-renders, because re-render replaces the DOM subtree. Handlers in `a:`
are re-attached on every render. So event handlers go in `a:`." The
reader can verify each step, and if they disagree, they know exactly
which step to argue with.

Longer arguments chain these steps: a TACO is a plain object -> plain
objects serialize to JSON -> so UI can cross the wire as data -> so a
server (or a microcontroller) can drive the browser without shipping
code. The north star doc is built entirely this way.

Phrases that signal a missing chain: "best practice is," "it is
recommended that," "you should generally." If the reason won't fit in
the sentence, the claim needs more thought before it goes in a doc.

### 2. Say where it breaks, in the same doc that says where it works

When you document a feature, include the case it handles badly and what
to do instead. Don't save the limitations for a troubleshooting page --
put them next to the feature, where the reader is deciding whether to
use it.

Bad: a section on `bw.refresh()` that shows the counter demo and stops.

Good: the same section, plus -- "`bw.refresh()` rebuilds the component's
children from scratch. Anything the browser was holding in that subtree
-- input focus, scroll position, text selection -- is lost. For a form,
use handle methods instead; they update content without rebuilding."

Two reasons. First, the reader is going to hit the failure anyway; the
only choice is whether they hit it warned or unwarned. Second, a doc
that admits its weak spots earns trust for its claims of strength. A doc
that only shows happy paths reads like marketing, and readers discount
it accordingly.

### 3. State what it doesn't do, as a choice with a reason

Bitwrench leaves things out on purpose -- no virtual DOM, no compiler, no
code over the wire. When you write about a feature, name the nearby thing
it deliberately doesn't do, and give the reason, so the omission reads as
a decision instead of a gap the author forgot to mention.

Bad: a bwserve doc that never mentions WebSockets, leaving the reader to
wonder if the author knew they exist.

Good: "bwserve pushes over SSE, not WebSockets. One-directional push
keeps the injected client small and works through proxies that break
WebSocket upgrades. If you need high-rate bidirectional traffic, bwserve
is the wrong tool."

The same rule applies to scope: if a comparison or tutorial excludes
something big, say so in the first paragraph ("not compared against
React/Vue/Angular ecosystems -- different category entirely"), not in a
footnote after the reader has assumed otherwise.

### 4. No religious wars

Never trash React, Vue, or reactivity. Other frameworks made different
trade-offs, not mistakes. Describe what bitwrench does and let the
contrast speak.

Bad: "Unlike React's wasteful virtual DOM diffing, bitwrench updates the
DOM directly."

Good: "Bitwrench has no virtual DOM. Updates are explicit -- you call a
method, the DOM changes. The trade-off: you decide when things update,
instead of a diffing engine deciding for you."

The test: if a passage would start a flame war on HN, rewrite it as a
trade-off statement.

### 5. Rules are stated flat

If something is a rule, write it as a short declarative prohibition or
requirement. Don't dress it in politeness -- softening a rule makes the
reader wonder whether it's actually optional.

Bad: "We strongly encourage contributors to avoid force-pushing to main
where possible."

Good: "No `--force` pushes to main."

If something is NOT a hard rule, don't state it like one -- say it's a
preference and give the reason: "Prefer `bw.mount()` in teaching docs;
`bw.DOM()` is the same function, but one name per tutorial is less for a
beginner to track."

### 6. Exceptions carry their context

Every ignore pragma, deferred item, and workaround gets its reason
written at the site, so the next reader (or you, in six months) knows
whether it still applies.

Bad: `<!-- drift-lint:ignore-start -->` with no reason, or a checklist
line that says only "deferred."

Good: `<!-- drift-lint:ignore-start: documents the removed 2.0.x API for
migration -->`, or "deferred -- blocked on the D1 naming decision."

The reason this is a rule and not a preference: code and docs littered
with bare pragmas can't be audited. Nobody can tell an exception that's
still earning its keep from one that outlived its excuse.

### 7. Show the reader there is no magic

When a doc introduces something that looks clever -- a factory, a helper,
generated methods -- show what it actually is underneath, so the reader
knows they could write it by hand. Never present a feature as a black box
the reader must trust.

Bad: "`bw.makeCard()` handles all the complexity of card creation for
you."

Good: "`bw.makeCard()` is a regular function that returns a TACO -- the
same `{t, a, c, o}` object you could write by hand. Log the return value
and look at it. Everything BCCL does, you can do yourself."

One usage note that follows from this: "just" is allowed when it removes
fear ("a TACO is just data -- log it, serialize it, diff it"), and banned
when it minimizes effort ("just configure the webpack loader"). Same
word, opposite jobs.

### 8. Label what a doc is and when it was true

Every design doc, plan, or working note opens by saying what it is, its
date, and its status. Unfinished is fine; unlabeled is not -- an undated
draft gets mistaken for the spec two years later.

Bad: a design doc with no header, describing an API in present tense so
the reader can't tell shipped from planned.

Good: "**Status**: Design discussion (not yet implemented). **Date**:
March 2026." -- and when it later ships or dies, a header update saying
what superseded it.

Sentences like "not yet implemented," "unreleased," and "this may be
naive" are welcome in this repo. A doc that reads as shipped when it
isn't costs a reader a debugging session.

### 9. Show, don't tell -- and show the failure too

Every abstract claim gets a concrete example the reader can run or
picture; every warning gets the actual failing code, not a vague caution.

Bad: "Be careful with event handlers in lifecycle hooks, as this can
cause issues after re-renders."

Good: show the six-line component with `addEventListener` in `o.mounted`,
click the button, call `bw.refresh()`, click again -- dead. Then show the
same component with `a: { onclick: fn }` surviving the refresh. The
reader now owns the lesson instead of renting the warning.

This applies to this style guide too: a principle without a bad/good
pair is a principle a new writer can't apply.

## Mechanics

- **bitwrench is lowercase**, everywhere except the start of a sentence.
- **Double hyphen `--` for asides**, not the typographic em dash. This is
  the house dash.
- **Bold sparingly, for load-bearing words only** -- the word the sentence
  turns on ("the Ptolemaic model actually **worked**"), not for decoration
  or list-item labels that are already labels.
- **Complete sentences over fragments**, including in bullets. Checklists
  are the exception: terse `verb --> object` form (`refactor -->
  src/bwserve/bwclient.js`), with counts in parentheses.
- **Tables for enumerable facts** (files, options, message types), prose
  for reasoning. Never put an argument in a table cell.
- **Code names in backticks**, always: `bw.mount()`, `o.state`, `el.bw`.
- **Second person is fine.** "You call methods, not re-render trees."
  Address the reader as a competent engineer.
- **Questions are allowed as section setups** -- "How does one pick an
  expert if one is not an expert?" -- but must be answered, not left as
  rhetorical decoration.

## Banned

These are the tells of generic doc-writing. drift-lint prose rules may
enforce the mechanical ones.

- Marketing adjectives: powerful, blazing/blazingly, seamless, elegant,
  robust, delightful, effortless, supercharge, game-changing.
- "simply" -- if it were simple the reader wouldn't be here. ("just" in the
  demystifying sense of principle 7 is allowed.)
- Exclamation points. Emoji.
- Throat-clearing: "In this guide, we'll explore...", "Let's dive in",
  "It's worth noting that", "As you can see".
- Hedged non-claims: "can potentially", "may or may not", "it could be
  argued". Either make the claim with its reasoning or cut the sentence.
- Superlatives about bitwrench itself: fastest, smallest, best. State the
  measurement (gzipped size, dependency count) and let the reader conclude.

## The whole voice in one before/after

Generic: "Bitwrench's powerful component system makes it simple to build
reactive UIs with minimal boilerplate!"

House voice: "A component is a DOM element with methods on it. You call
the methods; the DOM updates. There is no framework instance to look up
and nothing to compile."

The generic sentence breaks four rules at once: marketing adjective
(banned list), "simple" (banned list), an exclamation point (banned
list), and zero checkable claims (principle 1). The house sentence makes
three concrete claims a reader could verify in a debugger.

## Sources

Distilled from maintainer-authored prose, deliberately excluding docs with
heavy agent rework (most of `docs/` as of mid-2026):

- `dev/bitwrench-north-star.md` -- consequence chains, imperative openings
- `dev/future-features.md` -- "where it works / where it doesn't" honesty
- `dev/bitwrench_agui_a2ui_feedback.md` -- restraint framing
- The v1.x README (git history) -- "no great structure here, just a bunch
  of kitchen sink things"; unpretentious even at its own expense
- "What is Ground Truth Anyway?" (essay, 2019) -- anecdote-driven argument,
  named-category structure, nuance over winner-picking
- Maintainer chat/review notes, 2026 -- rules explained through scar
  tissue ("I've seen code littered with pragmas and without context it's
  hard to know what was intended")
