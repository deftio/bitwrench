# Future options

Things bitwrench could do, that it deliberately does not do yet.

This document exists so that "why doesn't bitwrench do X?" has an answer other
than silence. Each item below is technically coherent and has a plausible path.
None is currently planned. If one matters to you, open an issue or a PR --
that is a better signal than a roadmap guess.

Nothing here is a criticism of libraries that made different choices. These are
options that fit bitwrench's model, listed with the reasons they are not in core.

---

## 1. TACO tree diffing (computed partial updates)

**The idea.** Given a previous TACO tree and a new one, compute the minimal set of
updates and apply only those, instead of re-rendering a subtree.

**Why it is coherent here.** bitwrench authored both trees. They are plain data,
and `TACO -> DOM` is a deterministic transformation -- closer to a compilation than
to a rendering guess. Diffing two known inputs is a different problem from
inferring what changed in a DOM you do not control.

**What it would emit.** The bwserve protocol already has `patch` and `batch`
operations, so a differ has a natural output format:

```js
diff(prevTaco, nextTaco)
// -> [ {type:'patch', ref:'temp', text:'22.4'},
//      {type:'patch', ref:'status', attrs:{class:'bw_ok'}} ]
```

**Why it is not in core.**

- It requires **retaining the previous TACO**. Today TACO is consumed during
  create + hydrate and the DOM is the result -- nothing is kept. A differ needs
  that tree held somewhere, which is a real change in what the library owns.
- Most updates already have a shorter path. `el.bw.setValue(x)`, `bw.patch()`,
  and `o.render` + `bw.update(el)` cover the common cases with a direct call and
  no retained state.
- A differ has to be correct in *every* case, including keyed lists, reordering,
  and lifecycle-bearing nodes. That is a large correctness surface for a gain that
  is often small.

**Where it would run.** Probably not on a microcontroller: for embedded, the win
would be bytes over the wire rather than render time, and running a tree diff on an
MCU to save a few hundred bytes is usually a net loss. A server-side differ that
emits `batch([...])` is the more plausible shape.

**Open questions for anyone who wants to try it.**

- Keying strategy for lists. bitwrench has UUID addressing (`bw.assignUUID`) --
  is that sufficient, or is an explicit `key` needed?
- What happens to nodes carrying `o.mounted` / `o.handle` when their position moves?
- Client-side or server-side, and does the answer change for bwserve?

---

## 2. JSON Schema validation of TACO

**The idea.** Because a TACO is plain JSON-shaped data, it can be described by a
JSON Schema and validated by any standard validator -- no bespoke tooling.

**Why this is unusual.** Most UI is expressed as *code*: JSX, templates, tagged
literals, builder chains. Code can be type-checked, but it cannot be validated by a
data schema, because it is not data until it has been executed. TACO is data first,
which makes several things possible that are awkward elsewhere:

- **Design system enforcement.** A schema can restrict `class` tokens to the
  generated palette and reject ad-hoc hex values or arbitrary inline styles, turning
  a convention into something CI can check.
- **Validation of untrusted UI.** Anything that arrives over a wire -- bwserve
  messages, an agent-generated layout, a plugin -- can be validated before it is
  rendered. bitwrench already sanitizes inbound wire TACOs
  (`_sanitizeWireTaco` in `src/bitwrench.js`); a published schema would make that
  contract explicit and reusable outside the library.
- **Editor support for free.** Any JSON-Schema-aware editor gives completion and
  inline errors on TACO literals and on `.json` UI files, with no language server.
- **Constrained generation.** Tools that emit UI (including LLMs) can be held to a
  schema, and the output checked before it reaches a browser or a device.
- **Contract tests.** "This component returns a table with a header row" becomes a
  schema assertion rather than string matching on rendered HTML.

**The honest limit.** Only the serializable subset is schemable. `o.mounted`,
`o.handle`, and function-valued attributes are JavaScript, not data, and no schema
covers them. That subset is exactly what crosses a wire, so the natural scope is:

- the **wire/static subset** -- fully schemable, and the most valuable place for it
- the **in-process subset** with functions -- out of scope

**Why it is not in core.** It adds a spec to maintain alongside the code, and a
schema that drifts from the implementation is worse than none. It also raises a
policy question -- is validation advisory, or does it refuse to render? -- that
should be answered by someone with a concrete use case rather than in the abstract.

**Open questions.**

- One schema, or a strict/loose pair (strict for design-system enforcement, loose
  for general validity)?
- Should `bw.create()` optionally validate, or should validation stay entirely
  external?
- Does the schema describe TACO only, or also the bwserve message envelope?

---

## How to propose something

Open an issue describing the use case first, not the implementation. The useful
information is what you are trying to build and where bitwrench made it hard --
that is what tells us whether a feature belongs in core, in an optional helper, or
in your own code.

PRs are welcome, particularly for the optional-helper shape, where something can be
proven useful without changing what the core library owns.
