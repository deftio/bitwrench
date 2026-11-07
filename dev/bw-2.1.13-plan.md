# 2.1.13 -- API consistency and stability

Status: **implemented 2026-11-03** on `feature/api-consistency-and-stability`
(uncommitted at time of writing; see CHANGELOG v2.1.13 for what shipped and
how). Groups A-E, B2, the north-star amendments and the matrix tests are in.
Group F (issue comments and closes) waits for Manu. Three issues filed on
2026-11-03 (#119 toggle button, #120 color-scheme, #121 contrast floor) were
folded in: #119 and #120 implemented, #121 partially (`bw.contrastRatio`;
the derived text roles declined, see the issue comment draft).

Deviations from the plan as written, each a judgement call made during
implementation:

- **Group B item 4 (filter the form controls' rest spread to `on*`) was not
  done.** The rest spread is the attribute passthrough callers rely on
  (`makeInput({ maxlength: 10, 'aria-label': 'x', autocomplete: 'off' })`),
  and it is the TACO-spread idiom the `class` decision is built on. The
  clobber is fixed by making `class` a read prop; the guard stays off for
  the seven form-control factories and `InputConfig` says so.
- **Group B item 1 (generate the .d.ts): the drift rule was chosen, not the
  generator.** A generator with an annotation table is hand-maintained types
  by another name, and `any` defaults would make the types worse than
  today's. `bccl-config-drift` holds the hand-written interfaces to the
  patterns in both directions; the ten interfaces were fixed once by hand.
- **Set verbs (`addClass`/`removeClass`/`toggleClass`) are silent on a miss**,
  not warning: they act on every match and an empty match is a valid outcome.
  Consequence 14 says so.
- **`id` on labelled form controls lands on the `<input>`**, where the label's
  `for` points, not on the wrapper root. `makeFormGroup` sets it on the
  caller's input when that input has none.
- **`makeDataTable` and `makePagination` moved the caller's class to the
  root** (was the inner table / ul). Recorded in the CHANGELOG as a change.
- **Alternate derivation changed by default** (decision 3: both). Numbers in
  the CHANGELOG; the 12-preset screenshot review is still Manu's to do.

## Why this release exists

Three consumer apps have now each produced a batch of issues against a shipped
release: triops (#92, 2.1.3), jazzmac (#108, 2.1.7) and quikleaf (#112-#118,
2.1.11). Every batch has the same shape. No single function is wrong on its own.
The defects are inconsistencies between siblings that the docs say obey one rule:
verbs that take a target, sinks that take content, factories that take props,
types that describe factories, tests that cover a wire boundary. The unit suite
tests one function at a time and cannot see inconsistency. Real apps see it
immediately, because an app author learns one verb and assumes the rest match.

All seven quikleaf issues were reproduced against the 2.1.12 tree on
2026-10-31. None are 2.1.12 regressions; all exist in 2.1.11.

The settled sequence was 2.1.12 verify, 2.1.13 CSS/lean split, 2.1.14 embedded.
This plan proposes inserting the consistency work as 2.1.13 and sliding the
other two by one: **2.1.14 CSS split, 2.1.15 embedded.** Reasoning: the CSS
split has ~100 bytes of ESM headroom to fit its glue into and touches the style
engine broadly; it should not share a release with resolver and type changes.
The embedded work keeps getting displaced by exactly these bugs, and the way to
stop that is to fix the class of bug, not the instances. Decision 1 below.

---

## 1. North star re-examination

`docs/bitwrench-northstar-principles.md` was read in full against the issues.
It already contains the principles the bugs violate; what it lacks is the
*caller-facing* half of those principles stated as rules, plus the test
discipline that would catch violations. Proposed amendments, each tied to the
issue that exposed the gap. These should land as a doc change **first**, so the
fixes are judged against written rules.

### 1.1 What the north star already says that these bugs violate

| Section | Principle | Violated by |
|---|---|---|
| 6 | Compounds compose phase verbs, "never reimplement" | #118: the slot setter reimplements the content switch instead of calling the shared one; `bw.patch` has its own copy too |
| 7 | DOM helpers "resolve by reference, CSS selector, or UUID" | #112: `bw.replace` resolves nothing; it reads `ref.parentNode` on whatever it is given |
| 10 | "If you can't tell what an operation costs from its name, that's a bug in the API" | #112 (2.1.11): `bw.append('id')` returned null silently; the name said append and nothing happened |
| 4 | Components own their rendering; callers go through the API | #114: a caller's stray `class` prop erases `bw_bccl_form_control` because `...eventHandlers` is spread after `class:`. The component's own class must not be strippable by accident |
| 1 | "TypeScript can type-check them (bitwrench ships .d.ts)" | #114, #113, #115: the .d.ts certifies props the factories never read, and omits ones they do. The types are a second, hand-maintained source of truth |
| 3 | "Dark mode is palette inversion" | #115: taken literally, inversion turns a 67%-lightness indigo into near-black on a dark surface. The rule as written produces the bug |
| 8, 13 | The protocol is described precisely | #116, #117: the attach REPL unwraps the return envelope in one handler and not another; one of three URL builders ignores the server origin. Nothing in the north star says boundaries are tested end to end |

### 1.2 Proposed new consequence: 14. One vocabulary for callers

> Every verb that takes a target accepts the same forms: a live element, an
> element id, a CSS selector, or a `bw_uuid_*` token. Every sink that takes
> content accepts the same forms: text, a TACO, an array of either, or
> `bw.raw()`. A verb that cannot resolve its target warns with the verb's name
> and returns null; it never fails silently. No sink ever stringifies an object.
> The resolver and the sink are one function each; verbs call them, they do not
> copy them.

Why a rule and not a sentence in a changelog: the current wording ("any form
`bw.el` takes, `mount` takes", 2.1.12 CHANGELOG) was written for one verb, and
the next verb along, `append`, was missed in the same release. A rule over the
*set* is what a contract test can be written against (section 2, group A).

### 1.3 Proposed new consequence: 15. Types and docs describe the runtime

> The runtime is the source of truth. `src/bitwrench.d.ts`, the generated API
> reference, `verify`, and the unknown-prop guard all describe what the renderer
> and the factories actually read. Where that description can be generated, it
> is generated. Where it cannot, drift-lint checks it against the source. The
> types are never corrected by changing the runtime to match them.

This is already the stated rationale of the `taco-options-drift` rule
(2.1.12), promoted from a tool comment to a principle, and extended from one
interface to all of them (group B). The `_checkProps` guard already parses each
factory's destructuring pattern at runtime; that parse is the ground truth the
.d.ts should be generated from.

### 1.4 Proposed amendment to 3: dark mode wording

Replace "Dark mode is palette inversion, not a parallel set of CSS overrides"
with:

> Dark mode is a second palette derived from the same seeds, not a parallel set
> of CSS overrides. The derivation keeps each role's hue and its contrast
> against its surface; it does not literally invert lightness. A seed may also
> be given for the alternate palette directly (`alternate: { primary: ... }`),
> because a brand's dark-mode accent is a design decision, not a formula.

The second sentence is what #115 asks for. The third is the escape hatch every
design system has and bitwrench lacks (group E).

### 1.5 Proposed addition to the component contract (under "BCCL")

> Every factory whose output has a single root accepts `id` and `class` and
> forwards them to the root's attributes. A caller-supplied `class` is merged
> with the component's own classes, never substituted for them. Props a factory
> does not read produce a warning (the unknown-prop guard), never a silent drop
> and never an HTML attribute. Attribute-shaped props carry the HTML attribute
> name (`class`, `for`), never a DOM-property or React spelling (`className`,
> `htmlFor`).

Why `class` and not `className` (Manu, 2026-11-01): a TACO's `a` object and a
factory's props must be spreadable into each other with no key translation.
`makeX({ ...taco.a })` and `a: { ...props }` only work blindly if the two
vocabularies agree, and `a` has always used the HTML name. The reserved word
costs the factory author one rename inside the destructuring pattern
(`class: cls = ''`) once; `className` would cost every caller a rename forever,
and it is the spelling the schema doc already tells LLMs to un-learn. `class`
is also what 1.x used and what `pages/07-framework-comparison.html` already
promises ("class, for").

#113 (7 of 47 factories accept `id`), #114 (`class` clobbers; `label` lands as
an attribute on `<input>`).

### 1.6 Proposed additions to "Quick drift checks"

| Question | If yes |
|---|---|
| Am I adding a verb that resolves its own target or applies its own content? | Drift. Call `_resolveTarget` / `_applyTo`. |
| Am I editing `bitwrench.d.ts` by hand for something the runtime already declares? | Drift. Generate it, or add the drift-lint rule. |
| Am I testing a wire boundary with a hand-built fixture on either side? | Drift. Feed the real producer's output through the real consumer. |
| Am I adding a factory prop to some factories and not others? | Drift. The contract is per-factory-set, not per-factory. |
| Am I naming a prop or wire field after a DOM property (`className`, `htmlFor`, `cls`, `classes`)? | Drift. Use the HTML attribute name (`class`, `for`); destructure as `class: cls`. |

### 1.7 "For reviewers" additions

Add to "Worth challenging": "The API is not consistent across verbs" -- expected
answer after 2.1.13: it is, and here is the matrix test that proves it; before
2.1.13 the honest answer was "it is not, and the docs claimed it was".

---

## 2. The issues, grouped by root cause

### Group A -- one vocabulary (#112, #118)

**Evidence.** `src/bitwrench.js` has at least 13 public verbs that take a
target (`el`, `unmount`, `unmountChildren`, `clear`, `addClass`, `removeClass`,
`toggleClass`, `remove`, `mount`, `append`, `replace`, `refresh`, `patch`, plus
`update`, `message`, `inspect`). Resolution is done three ways: `bw.el(ref)`
alone (most), `bw.$(target)[0] || bw.el(target)` (mount, append, and one
bwserve site at ~5407), and not at all (`replace`, which reads `ref.parentNode`
directly and is typed `@param {Element}`). Content is applied by three separate
switches: `_applyTo` (used by `el` and `$`), the slot setter inside hydrate
(`value.t` only; raw and arrays stringify), and `bw.patch` (its own copy of the
same four branches). The existing matrix test
(`test/bitwrench_test_new_apis.js` "every verb accepts a bare element id")
covers 7 verbs x 4 target forms and does not include `replace`, `remove`,
`refresh`, `update`, `message`, `addClass`, `removeClass`.

**Reasoning.** The docs promise a single vocabulary (llms.txt "Rendering
Functions"; core-api.md; the 2.1.12 changelog). The source has no single
implementation of it, so each verb is a separate chance to drift, and the test
that was written for the last drift was scoped to the verbs that had drifted.
Fixing `replace` and the slot setter the same way fixes two more instances and
leaves the structure that produced them.

**Proposed fix.**

1. `_resolveTarget(target, verbName)`: live query first, `bw.el` second (the
   ordering `mount` already documents and why), warn `bw.<verb>: target not
   found` on miss. Every verb above calls it. `replace` becomes
   `string|Element`.
2. `_applyTo(el, content)` becomes the only sink. The slot setter body is
   `unmountChildren(target); _applyTo(target, value)` (plus the
   `isConnected` guard it has today). `bw.patch`'s content branches delegate to
   it. Net effect should be fewer bytes, not more; measure.
3. The matrix test enumerates verbs by **introspection** over `bw` (every
   function whose first JSDoc param is `ref`/`target`/`id`, or an explicit list
   that a meta test asserts is complete against the source), so a new verb
   cannot opt out. Second matrix: every sink x {text, number, TACO, array,
   nested array, `bw.raw`, null}. Both written first, failing.
4. `.d.ts`: `replace(ref: string | Element, ...)`; `append`/`mount` return
   `HTMLElement | null`.
5. Docs: `state-management.md` slot setter forms, `component-cheatsheet.md`,
   `core-api.md` one line on the shared vocabulary; CHANGELOG 2.1.13 also
   records that 2.1.12 fixed `append` (it shipped without a line).

### Group B -- types follow the runtime (#114, sub-items of #113 and #115)

**Evidence.** Ten `*Config` interfaces in `src/bitwrench.d.ts` (lines 139-308).
Every one uses `class?`; all 47 BCCL factories and four core factories
(`makeTable`, `makeTableFromArray`, `makeBarChart`, `makeDataTable`) read
`className` (130 occurrences, 0 of `class`). `ModalConfig` declares `closable`, `variant`, `style`, `class` and
omits `closeButton`, `closeLabel`, `onClose`, `open`. `InputConfig` declares
`label` (which lands as an HTML attribute) and omits `id`, `readonly`.
`StyleConfig.palette` and `compact` are read nowhere; `harmonize` and
`fontSize` are read and undeclared. The form-control factories spread
`...eventHandlers` after `class:` (lines 1176, 1230, 1284, 1336, 1988, 2593),
so a caller's `class` replaces `bw_bccl_form_control`.

**Reasoning.** 2.1.12 fixed this defect class for `TacoOptions` and wrote a
drift rule for `TacoOptions` only. The guard already computes the accepted-key
list per factory from the destructuring pattern (`_parseKeys(fn)`); the .d.ts
is the only place that list is retyped by hand. A hand-maintained copy of a
machine-readable fact will drift; the fix is to stop maintaining it by hand.

**Proposed fix.**

1. `tools/build-dts-configs.js`: for each `make*` export, parse the
   destructuring (reuse `_parseKeys` logic, or share a module) and emit the
   `*Config` interface block into a marked region of `bitwrench.d.ts`. Types
   for each key come from an annotation table (string/number/boolean/function/
   TACO) with `any` as the default and a lint that flags `any`. Alternative if
   generation is too large for this release: drift-lint rule
   `bccl-config-drift` that fails when a `*Config` key is not in the factory's
   pattern or vice versa, and fix the ten interfaces by hand once. Prefer
   generation; the rule is the fallback.
2. The interfaces keep `class`. It is the runtime that moves (Group B2); this
   is the one case in this release where the type was right and the code was
   wrong, because the type matches the north star and the code matches React.
3. Remove `StyleConfig.palette` and `compact`; add `harmonize`, `fontSize`.
   `StyleConfig` is not a factory and stays hand-written, so it needs the
   drift rule.
4. Spread-order fix: filter the rest object to `on*` keys before spreading
   (`_handlers(rest)`), in the six sites above, so a stray `class` cannot
   clobber and the guard warns about it instead. Also `makeInput`'s `label`:
   either read it (wrap in a `<label>`) or drop it with the warning; today it
   silently becomes `<input label=...>`.
5. Test: for every factory, `makeX({ class: 'x' })` keeps the component's own
   class and carries `x`; for every typed interface, the key set equals the
   parsed pattern.

### Group B2 -- `class`, not `className`, in factory props (added 2026-11-01)

**Evidence.** Every factory destructures `className = ''` (43 sites in
`src/bitwrench-bccl.js`, 8 in `src/bitwrench.js`) and emits
`a: { class: ... }`. The renderer reads only `a.class`; `bitwrench-verify`
flags `a.className` with "did you mean class"; `docs/bitwrench-taco-schema-discussion.md`
lists `className -> class` as a React hallucination to correct; `TacoAttributes`
in the .d.ts is `class`. The spelling was in the first BCCL commit (10f3f25,
2026-03-08) with no recorded reason. On the wire the same field has three
spellings: `bw.inspect` emits `classes`, the bwclient inspector emits `cls`,
and `printTree` reads `cls`.

**Reasoning.** `class` is a reserved word, so `const { class = '' } = props`
is a syntax error and the DOM named its property `className` in 1998; React
inherited it and the destructuring idiom reaches for it by reflex. That is an
ergonomic nudge, not a constraint: `const { class: cls = '' } = props` is
legal, and `{ class: 'x' }`, `props.class`, `...props` and JSON all work with
the HTML name. The reason this matters more than taste: a TACO's `a` and a
factory's props must spread into each other without a translation step. With
two spellings, every `{ ...taco.a }` into a factory and every `{ ...rest }`
out of one needs a `className` exception, and callers following the .d.ts
(which says `class`) hit #114. One vocabulary (consequence 14) decides it.

**Proposed fix.**

1. Every factory destructures `class: cls = ''` and merges `cls` after its
   own classes. `className` is accepted as an alias for one release: if
   present and `class` is absent it is used, with a one-time deprecation
   warning naming the factory; if both are present `class` wins and the
   warning says so. Remove the alias in 2.1.14 or 2.2.
2. `_parseKeys` already captures `class` from a `class: cls` pattern (the
   identifier before the colon); confirm with a test. For the six form-control
   factories that spread `...eventHandlers`, `_parseKeys` returns null and
   the guard is off; Group B item 4 fixes that by filtering the rest object to
   `on*` keys so the pattern has no `...`.
3. Wire field: `bw.inspect` and the bwclient inspector both emit `class`;
   `printTree` reads `class` (and `cls`/`classes` for one release). This
   replaces Group D item 2.
4. Docs and types: `props.className` -> `props.class` in `docs/bitwrench_api.md`
   (8 rows) and `docs/component-library.md`; pages 01 and 02 examples; llms.txt
   if it shows a factory call with `className`. The .d.ts needs no change for
   the configs; the generator (Group B item 1) emits `class` from the pattern.
5. Test: a contract test over every `make*` export asserts that
   `makeX({ class: 'probe' })` renders a root whose class list contains both
   `probe` and the component's own class, and that `makeX({ className: 'probe' })`
   produces the same DOM plus exactly one warning. Both must fail on the
   current tree.
6. Size: one alias branch per factory is a handful of bytes each; implement
   it as a shared `_cls(props)` helper so it is paid once. Measure the ESM
   `.gz` before and after.

### Group C -- the component contract (#113)

**Evidence.** 7 of 47 factories read `id`. `makeButton({ id })` warns and drops
it. The documented workaround is mutating the returned TACO
(`thinking-in-bitwrench.md` section 8). `makeDropdown`'s menu element has no
addressable hook at all.

**Reasoning.** The north star and llms.txt tell callers that `id` is the
addressing handle for every later update. A factory that returns an element you
will update must let you name it. The inconsistency is visible precisely
because the 2.1.11 guard made it so; the guard is working.

**Proposed fix.** Add `id` to the destructuring of every factory with a single
addressable root and forward it to `a.id`. Keep it in the pattern (not a
post-hoc merge) so `_checkProps` and the generated types see it. For compound
factories (dropdown, tabs, accordion, carousel) decide per factory whether `id`
names the root and children derive `id + '_menu'` etc., or whether the child
gets its own prop. Recommendation: root `id` only in 2.1.13, derived child ids
documented, and no new per-child props until a consumer asks. Measure bytes:
47 destructuring entries is small but the ESM headroom is 101 bytes before
group A's savings.

### Group D -- wire boundaries tested end to end (#116, #117)

**Evidence.** `_handleReturn` (`src/bwserve/index.js:477`) resolves the
pending promise with the whole POST envelope `{requestId, route, result,
error}`. `client.screenshot()` unwraps `r.result` and checks `r.error`; the
attach `/tree` handler passes the envelope straight to `printTree`, which reads
`node.tag` (undefined -> `?`) and `node.cls` while `bw.inspect` emits
`classes`. The html2canvas loader in `bwclient.js:139` defaults to a
page-relative URL while `respond()` four lines up prefixes the server `origin`.
`test/bitwrench_test_attach.js` tests `printTree` only with hand-built
`{tag, cls}` nodes.

**Reasoning.** Third and fourth instances in one subsystem of the pattern 2.1.12
fixed for MCP live and attach `/patch`: both sides of a boundary tested with
fixtures that agree with themselves and not with each other. The fix shape
already exists in the repo (`test/bitwrench_test_mcp_wire.js`, the C suite
feeding real output through `bw.parseJSONFlex`).

**Proposed fix.**

1. Unwrap once, on the server: `_resolvePending(requestId, data)` resolves with
   `data.result` and rejects with `new Error(data.error)` when set. Update
   `screenshot()` to match. Every future caller gets the unwrapped value.
2. `printTree`: superseded by Group B2 item 3 (the field is `class` on both
   ends); `core-api.md` "as text" row corrected.
3. `bwclient.js`: `_ls(opts.captureUrl || base + "/bw/lib/vendor/html2canvas.min.js")`
   using the same `base` expression `respond()` uses.
4. Round-trip tests: run the `_bw_tree` and `_bw_screenshot` builtins in
   jsdom against a stubbed html2canvas, POST the real body through
   `_handleReturn`, and assert the REPL's printed output and the screenshot
   buffer. Also one test that the generated client script never contains a
   `/bw/` URL without `base` in front of it.
5. Fold in the two stale CLI items from `dev/v2.1_release_open_issues.md`:
   attach REPL presents `/render` where `serve.js` has deprecated it in favour
   of `/mount` (section 8), and `bwclient.js` still carries the `data-bw-action`
   legacy dispatch path the no-`data-*` rule forbids (section 7). Both are
   consistency items of the same kind.

### Group E -- alternate palette derivation (#115)

**Evidence.** `deriveAlternateSeed` (`src/bitwrench-color-utils.js`): for
L > 50, `altL = clip(100 - l - 10, 8, 40)`. `#6366f1` (L 67) -> `#111366`
(L 23) on background `#202027`. Confirmed 2026-10-31. No config key reaches
`deriveAlternateConfig`; `StyleConfig.palette` is declared and unread.

**Reasoning.** This is design, not a bug: the rule does what the doc says. But
the rule is wrong for the most common brand accent, a saturated mid-lightness
hue, and the only escape is a second scoped stylesheet with a hand-rolled
toggle, which `agents.md` forbids. It belongs to the P3 palette-tuning work and
touches all 12 presets' alternate palettes, so it needs a visual before/after,
not just a unit test.

**Proposed fix.**

1. `alternate: { primary, secondary, tertiary, success, danger, warning, info,
   light, dark, background, surface }` in the style config, merged over
   `deriveAlternateConfig(fullConfig)` before `derivePalette`. Any key given
   wins; the rest derive as today.
2. Derivation change for saturated mid-lightness seeds: when 50 < L <= 75 and
   S > 40, target a lighter tint (L ~ 72, S * 0.9) instead of inverting. Low
   saturation and extreme lightness keep today's rule. Render all 12 presets
   before and after with bwcli screenshot into `dbg/` and review.
3. Remove `StyleConfig.palette`; add `alternate` to the type and to
   `theming.md` "Primary and alternate palettes".
4. Decision 3 below: change the default (affects every existing dark mode) or
   ship the override only in 2.1.13 and tune the default in a visual-audit
   release.

### Group F -- queue hygiene

- Close #92: unknown-option warnings shipped in 2.1.11 with coverage.
- Close #111: no action needed.
- Comment on #112 that `append` was fixed in 2.1.12 and the changelog line
  lands in 2.1.13 (done in the CHANGELOG stub).
- Re-scope #108: `bw.addClass/removeClass/toggleClass` now exist, `bw.clear`
  exists, `bw.el(ref, apply)` is in `core-api.md`; the remaining asks are the
  `core` build (2.2) and `makeTooltip` in lean (the CSS split, 2.1.14). Comment
  and either close or retitle to the two remaining items.
- #113, #114, #115, #116, #117, #118: reference this plan from each, close on
  release.

---

## 3. Also on the next-release list (from dev/)

Collected 2026-10-31 so this is the one place to look.

| Source | Item | Proposed home |
|---|---|---|
| `dev/bw-2.1.12-doc-audit-todo.md` | 49 open doc/page items in sections 2-5, 7.6, 7.7 (VIOLATION/STALE pages, broken doc examples, two drift-lint rules). None are source bugs. | 2.1.13 as time allows; 7.6 (BCCL prop-name drift rule) overlaps group B and should ride with it |
| `dev/bw-2.1.12-plan.md` section D | Post-back path: `bw.connect` posts to `url.replace('/events/', '/apply/')`, which cannot match `/bw/events`; the POSIX demo depends on the accident. Needs decision D1 (post to stream URL vs `/bw/return/...`). | Protocol consistency; fits 2.1.13 if D1 is decided, otherwise 2.1.15 with embedded |
| `dev/bw-2.1.12-plan.md` section E | E1-E9 queue hygiene; E3 (#108) and E1 (#92) are in group F; E4 (registry name, version decoupling) is embedded | Group F / 2.1.15 |
| `dev/v2.1_release_open_issues.md` | Section 7 `data-bw-action` legacy path in `bwclient.js` and `embedded_c/`; section 8 attach `/render` vs `/mount` | Group D |
| `dev/bw-css-split-plan.md` | Core/BCCL sheet split; lean -5.6 KB gz; full file does not shrink; ~100 B ESM headroom for glue. Build shape decided 2026-11-01: `bitwrench.js` stays the full build, lean gets leaner, no rename | **2.1.14** (was 2.1.13) |
| `dev/bw-embedded-release-plan-2.1.x.md` group C | `BW_CALL`, `bw_asset_t`, `BW_REPLACE` removal, `examples/README.md`, per-language status, `embedded_rust` decision, C doc harness, buffer rules | **2.1.15** (was 2.1.14) |
| `dev/bitwrench-2.2-release-plan.md` section 10 | Five open decisions (`loadReset` alias, lean alias, class ownership sign-off, `makeTable` ownership, ES5 in matrix) | 2.2, unchanged |

---

## 4. Order of work and gates

0. **North star amendments** (section 1) as the first commit on the branch, so
   every later change is reviewed against written rules.
1. **Tests first, failing.** The verb x target matrix, the sink x content
   matrix, the factory contract test (`class` merges, `className` warns; `id` forwarded),
   the .d.ts-vs-pattern check, the attach round trips. Every one must fail on
   the current tree before its fix lands (the "every miss gets a check" rule,
   applied to the set rather than the instance).
2. Group A: `_resolveTarget`, `_applyTo` as the single sink, `replace`.
3. Group B and B2: generator or drift rule; `class` in every factory with the
   `className` alias; wire field `class`; `StyleConfig`; spread order.
4. Group C: `id` on factories.
5. Group D: envelope unwrap, `printTree`, origin, `/mount`, `data-bw-action`.
6. Group E: `alternate` seeds; derivation change gated on decision 3 and the
   screenshot review.
7. Docs, CHANGELOG (including the 2.1.12 `append` line), issue comments,
   closes.

**Size gate.** ESM headroom is 101 bytes at 2.1.12. Group A removes two
duplicate switches and should give bytes back; group C adds 47 small
destructuring entries. Measure after step 2 and after step 4 against the
shipped level-9 `.gz`, as `tools/release.js` does. If the full file would cross
46 KB, the fallback is to land group C for the factories consumers have asked
about (Button, Modal, Dropdown, Card) and the rest in 2.1.14.

**Measured 2026-11-03** (shipped `.gz`, the number `tools/release.js` reads):
UMD 47,368 (+498 over 2.1.12's 46,870; 264 over the 47,104 gate), ESM 47,508
(+505; 404 over). Lean 36,974 / 36,761. The bytes are the requested features:
`id` and `class` on 44 more factories, the `className` alias, the toggle
button, `alternate` seeds, `color-scheme`, `contrastRatio`, the warn-on-miss
strings. Cheap trims (shorter deprecation message, no `isPressed` handle)
are already in. Dropping #119 and #121 would recover roughly 200 bytes and
still leave the ESM over. **Decided 2026-11-07 (Manu): gate raised to 47 KB
(48,128) in `tools/release.js`, reason recorded in the gate's comment block.** The plan's
own fallback (partial group C) would reintroduce the per-factory
inconsistency this release exists to remove, so it is not recommended.

**Done when.** Every verb passes the target matrix; every sink passes the
content matrix; `bitwrench.d.ts` config interfaces match the factory patterns
mechanically; the attach round trips print the documented output; the seven
quikleaf issues and #92/#111 are closed; the north star contains sections 14
and 15.

---

## 5. Decisions for Manu

1. **Resequence**: 2.1.13 = this plan, CSS split -> 2.1.14, embedded -> 2.1.15.
   (Branch and version already reflect 2.1.13 for this work.)
2. **`class` vs `className`.** DECIDED 2026-11-01: factories take `class`,
   the .d.ts stays `class`, `className` is a warned alias for one release
   (Group B2). Reason: `a` and props must spread into each other blindly.
3. **Alternate palette default.** Change `deriveAlternateSeed` for saturated
   mid-lightness seeds in 2.1.13 (visual change to every existing dark mode),
   or ship only the `alternate` override now and tune the default in a visual
   audit release. Recommended: ship both, with the 12-preset before/after
   review as the gate.
4. **`id` on every factory** versus documenting the mutate-the-TACO idiom.
   Recommended: `id` on every single-root factory, root-only for compounds.
5. **Generate the .d.ts config interfaces** versus a drift rule plus one-time
   hand fix. Recommended: generate; the rule is the fallback if the generator
   is not ready.
6. **Post-back path D1**: decide now and include in 2.1.13, or leave with the
   embedded release.
