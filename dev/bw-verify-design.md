# bitwrench-verify -- design

**Status: superseded by [docs/verify.md](../docs/verify.md); kept as history.**
Verify shipped in 2.1.12 as tier 1 only: a structural walk plus raw-content
warnings, 22 finding codes (16 errors, 6 warnings), and `bwcli verify`. Do not
add or rename finding codes here: the shipped codes are public API the moment
callers assert on them, so `docs/verify.md` is the single list.

**Specifically stale below, and load-bearing if believed:**

- "Verify checks TACO objects, component props and class names" -- it checks
  TACO structure only. Component props (tier 2, B5), handler names (B6) and
  class tokens (B7) did **not** ship. `docs/verify.md` lists them under "What
  verify does not check yet".
- "2.1.12 carries two workstreams ... and the embedded release" -- it does not.
  The sequence settled 2026-10-11 is 2.1.12 verify, 2.1.13 CSS/lean split,
  **2.1.14 embedded**.
- Anything reading "not written", "still open before code", or treating the
  manifest, the schema, `verify.install()` or tier 3 as shipping.

## North star

bitwrench-verify is an extra tool. It catches mistakes and assists in CI, as a
companion to bitwrench, in the situations where that help is worth a call.

bitwrench renders without it. There is no required build, and verify does not
add one. A person looking at a page already has feedback. Verify is for the
run where nobody is looking: a test, a generated payload, a saved frame, a
pipe in CI.

Reach for it when the TACOs are generated, numerous, or leaving your hands.
Skip it when the shapes are fixed and few and someone can see the page.
Section 4 is that line, written out. The library and the CLI are two doors
onto the same companion, not two products. If a later section reads like a
required workflow, this one wins.

**Status: APPROVED for 2.1.12** (decided 2026-10-04). Nothing in 2.1.11
depends on it.

**Settled 2026-10-06 (product shape).** Verify is one checker with two doors:
a JavaScript library, and a CLI that is that function plus file and stdin
buffering. Node and Bun import `bitwrench/verify` or shell out. A desktop,
server, or Pi-class Linux program in C++ or Python pipes a payload at the CLI,
because Node is on that machine. Bare metal has no Node, so the checker stays
on the host: compile-time assets, and any frame the host can already see (the
same C++ run on the desktop, a captured log). The chip never runs it. A frame
that exists only on the board, and that nobody captured, stays invisible until
it leaves the board. Looking at a live page the chip is driving is bwserve,
not verify.

Wire mode is the CLI default, because a file or a pipe is a payload. Authored
mode is the library default, because the caller is holding JavaScript.

**Settled 2026-10-06 (findings and schema).** Findings carry a **severity**:
`error` means the library ignores it or renders something you did not ask for;
`warn` means it is legal and verify cannot reliably tell what you meant. That
resolves the case that otherwise wanted a third mode -- a string `on*` handler
is correct for `bw.html()` and a dead control on a bwserve frame, so it warns
rather than failing. `verify.assert()` and the CLI fail on errors; `--strict`
promotes warnings.

Verify is outside the 46 KB bundle, so it inspects `bw.raw()` content that the
library cannot afford to look at: handler attributes, `javascript:` URLs,
`srcdoc`, `<script>`. It reports what executes and says plainly what it cannot
judge (`raw-unchecked`); it never claims raw content is safe. Scan now, a
caller-supplied parser later -- a dependency in the artifact people run in CI
is the thing to avoid, not the bytes.

Suppression is `{ ignore: [codes] }` in the library and a
`# bw-verify-ignore: <code> -- <reason>` pragma for files. Codes only, reasons
required, suppressions reported, and never a key inside the TACO.

**The schema is a 1.0 deliverable**, not a stretch goal -- see section 5.

**Still open before code** (guide hole 3): whether `verify.install()` ships in
2.1.12. It is one more door for inline TACO, not a gate -- you can pass the
object to `verify()` yourself.

**Revised 2026-10-04 after review** (`/tmp/verify-design-feedback.md`). Every
technical claim in that review was checked against the code and held. What
changed: tier 1's scope is stated honestly (it catches three of six, not five);
the `o` key set is generated from the renderer's seven keys, not the `.d.ts`'s
nine; `t` is required on an object; no attribute or class whitelist; `onClick`
is **not** an error; one API verb (`verify`); and the model-constraint claim is
tempered. Sections 7, 11a and 15 carry the substance.

**Revised 2026-10-06 (positioning).** Section 1 is a trade, not a missing
compiler. Section 3 is a set of doors, not a required workflow. Section 9 is
who can run the checker. The CLI is in the product. It is not a second checker
and it is not "drop if heavy".

The north star above is the product. Verify checks TACO objects, component
props and class names. It is not part of core and it is not a runtime
dependency.

> **What shipped:** TACO structure only. Component props and class names are
> tier 2 and did not land in 2.1.12 -- see the status note at the top of this
> file. The embedded release is 2.1.14, so 2.1.12 carried one workstream, not
> two. See section 14 on scope --
tiers 1 and 2 are self-contained, tier 3 can slip without hurting the story.

**Landing before 2.2 is safe, and the reason is section 6.** The manifest is
generated from source at build time, so when 2.2 carves BCCL out of core the
factory lists relocate automatically. If any list were hand-written, shipping
this before the split would guarantee rot.

---

## 1. Why this exists now

The north star is the reason. This section is only the cases the companion
catches when you ask it to.

bitwrench's answer to "where is your toolchain?" is that you do not need one.
A TACO is already a JavaScript object, and a page that renders is the feedback.
React and Svelte catch a mistyped prop when a compiler or a typechecker is
open. Those toolchains are mandatory there. bitwrench refuses that requirement.
The same typo is quiet here until someone looks, or until a test asks.

Someone looking at the page already has a signal. `{tag:'h1'}` shows up as the
text `[object Object]`. If you see that text, the object has no `t`. Say that
once in the ordinary docs. The other five below are quieter: content vanishes,
a hook never runs, a class does not match, a handler never fires. Those are
the cases a test run should fail when nobody is looking -- CI, a generated
payload, a saved frame.

Every one of these is a one-character mistake, and all **six** render without
a warning from the library (measured on 2.1.11). **Tier 1 catches the first
three; the last three need the manifest (tier 2)** -- see section 7, and do
not let the announcement claim otherwise:

```
{tag:'h1', c:'hi'}          ->  [object Object]        t typo: stringified onto the page
{t:'h1', cc:'hi'}           ->  <h1></h1>              content silently vanishes
{t:'h1', a:{clas:'x'}}      ->  <h1 clas="x">hi</h1>   bogus attribute forwarded
{t:'div', o:{onMount:fn}}   ->  <div>x</div>           hook never runs
{a:{class:'bw_bccl_crad'}}  ->  class="bw_bccl_crad"   no such class, unstyled
bw.makeInput({onchnage:fn}) ->  (nothing)              handler never fires
bw:diag emitted for any of the above: none
```

**The resolution is consistent with the north star, not a compromise of it.**
The principle already says *"compilation is optimization, not a prerequisite
for reactivity."* This is the same sentence one level up: **verification is
optimization of correctness, not a prerequisite for rendering.** You get the
check when you ask for it, and you never pay for it in bytes or at runtime.

### Types already exist; they are not the same thing

`src/bitwrench.d.ts` ships with the library, so the "no TypeScript" critique is
already half answered. But types and verify cover different things, and the
difference is the argument for building this:

| | TypeScript types | bitwrench-verify |
|---|---|---|
| Checks | code you authored | **data that arrives at runtime** |
| Sees a TACO from a server / Python script / LLM | no | yes |
| Requires the user to adopt TS | yes | no |
| Runs in CI | yes | yes |
| Catches `{tag:'h1'}` in a JSON payload | no | yes |

A type system cannot check a TACO that was generated by a Python script five
minutes ago and arrived over SSE. That TACO is **data**. Data gets schemas.

---

## 2. Two tools, two jobs

This has to be unambiguous or people will load the wrong one and conclude
neither works.

| | `bitwrench-debug.js` (exists today) | `bitwrench-verify.js` (proposed) |
|---|---|---|
| Question it answers | **"what is happening?"** | **"what is wrong?"** |
| Subject | a page that is already running | a TACO, a tree, a props object |
| When | behaviour surprised you | before or as you render |
| Mode | interactive, exploratory | assertive, pass/fail |
| Output | `console.table`, DOM trees, screenshots | a findings list, an exit code |
| Runs in | a browser, driven by a human | **browser, Node, Bun, and a CLI a pipe can drive** |
| Dependencies | auto-loads bitwrench from CDN, lazy-loads html2canvas (194 KB) | none |
| API shape | `bwd.tree()`, `bwd.state()`, `bwd.listen()`, `bwd.screenshot()` | `verify(taco)`, `verify.props()`, `verify.page()`, `verify.assert()` |

**The one-line rule: verify checks what you wrote; debug checks what happened.**

They stay separate artifacts. Do not merge them, and do not rename debug into
verify. The deciding reason is the dependency row: `bitwrench-debug.js`
auto-loads from jsdelivr and pulls in html2canvas, which is exactly what you
cannot have in a test harness or a CI job. A person looking at the page uses
their eyes, or debug. Verify is how a run fails when nobody is looking.

### When you would reach for each, concretely

| Situation | Tool |
|---|---|
| "My card renders empty" | **verify** -- a prop or key name is wrong |
| "`[object Object]` is on my page" | the object has no `t`. Verify if a test should say so |
| "My button does nothing" | **verify** first (handler name), **debug** second (is the listener attached) |
| "State is not updating" | **debug** -- `bwd.state()` shows what is on the element |
| "Which element is this?" | **debug** -- `bwd.tree()` |
| "Did my event actually fire?" | **debug** -- `bwd.listen()` |
| "Is my server sending valid TACO?" | **verify** -- at the boundary |
| "Does my whole app still pass?" | **verify** -- in the test suite |

---

## 3. Doors, none of them required

Write the TACO, mount it, look at the page. That is the path. No step below
is required, and none of them is a build.

**1. Author the TACO.** A function that returns one is convenient. An object
written inline at the `bw.mount()` call is the same thing.

```javascript
function statCard(label, value, id) {
  return { t: 'div', a: { class: 'bw_bccl_card bw_p_3' }, c: [
    { t: 'div', a: { class: 'bw_text_muted' }, c: label },
    { t: 'div', a: { class: 'bw_text_2xl', id: id }, c: value }
  ]};
}
```

**2. When a run should fail without a browser, call `verify()`.**

A TACO is data, so the check needs no DOM:

```javascript
import { verify } from 'bitwrench/verify';

it('statCard is well-formed', function() {
  const findings = verify(statCard('Temp', '22.4 C', 'temp'));
  assert.deepStrictEqual(findings, []);
});
```

No jsdom, no mount, no snapshot file. Inline TACO takes the same call. There
is nothing to enumerate:

```javascript
verify({ t: 'div', c: [ /* the object you were about to mount */ ] });
```

`verify.install()` is a third door, not the one that makes the tool real. It
wraps `bw.create`, `bw.mount`, `bw.patch` and `bw.append` from the tool (no
core hook, no core bytes) and warns while you click around. Useful for a live
demo and for an app that never holds the object in a variable. You can ship
verify without it.

**3. Mount it and look. When behaviour surprises you, switch to debug.**

```javascript
bw.mount('#app', statCard('Temp', '22.4 C', 'temp'));
// in the console:
bwd.tree('#app');        // what actually got built
bwd.state('#app');       // what state is on the elements
bwd.listen('#app', 'click');
```

**4. If the app is a set of factories, walk them in the test suite.**

Same call as step 2, once per factory:

```javascript
import * as ui from '../src/components.js';
import { verify } from 'bitwrench/verify';

describe('every component returns valid TACO', function() {
  Object.keys(ui).forEach(function(name) {
    it(name, function() {
      assert.deepStrictEqual(verify(ui[name](SAMPLE_PROPS[name])), []);
    });
  });
});
```

**5. For generated UI, verify the payload before it is sent.**

A JavaScript sender calls the library. Anything else pipes the CLI, which
defaults to wire mode:

```javascript
// node, before sending. Authored mode is the library default; say wire.
if (verify(taco, { mode: 'wire' }).length) throw new Error('refusing to send');
```

```
some-generator | bwcli verify
bwcli verify frame.json
```

**6. In the repo, `drift-lint` keeps the prose and the source honest.**
Different tool, different job -- see section 8.

---

## 4. The right situations

This is the north star as a rule you can apply. Verify is the companion for
these. It is ceremony everywhere else, and ceremony is the thing bitwrench
exists to avoid.

**Skip it when the TACOs are trivial or already trusted, and someone can see
the page.** A Python script, or a metal program, that emits the same three
shapes forever does not need a checker. If they were wrong, the first run
would show it. Adding a verification step there is ceremony, and ceremony is
the thing we are selling against. Reach for the CLI when those frames are
numerous, generated, or checked by a run that never opens a browser.

**Reach for it when the TACOs are generated, numerous, or shipped by someone
else:**

- a library of components other people call
- UI assembled from user or database input, where shapes vary
- an LLM or code generator emitting TACO
- a device or server pushing frames you cannot see rendered
- anything with a test suite you want to keep honest over years

The dividing line is roughly: **are the shapes fixed and few, or variable and
many?** Fixed and few, skip it. Variable and many, insert it in the programmatic
workflow where it costs one function call.

---

## 5. TACO as a schema-able UI format

This is the interesting part and it is the long answer to the TypeScript
critique. The schema is optional. You render without it. The claim is still
strong: **a UI described as TACO can be schema-checked, which is not true of
JSX.**

JSX is syntax, so checking it needs a parser and a type system. TACO is data,
so checking it needs a schema. That difference is the whole reason this is
possible at all.

### The wire form is fully schema-able today

A TACO that arrives as JSON cannot contain functions, because JSON has no
function type. `bw.apply()` also strips string `on*` attributes from wire TACOs
by design (the protocol carries data, never code). So **every TACO that crosses
a wire is pure data with a closed key set and is expressible in standard JSON
Schema right now**, with no extensions:

```
Content := string | number | boolean | null | Element | Raw | Array<Content>
Element := { t: string, a?: Attrs, c?: Content, o?: Options }   -- t REQUIRED
Raw     := { __bw_raw: true, v: string }                        -- from bw.raw()
Options := closed set of 7 keys (see below)
```

**`t` is not optional on an object.** `_createNode` treats a missing `t` as
"not an element" and falls through to `document.createTextNode(String(taco))`:

```javascript
if (!_is(taco, 'object') || !taco.t) {
  return document.createTextNode(String(taco));
}
```

That is the `[object Object]` failure. A schema marking `t` optional **accepts
the bug**. An object that is neither an Element nor a Raw is an error in both
modes.

`Raw` is `bw.raw()`'s output -- verified `{ __bw_raw: true, v: String(str) }` --
and it is handled *before* the `t` check. A tier 1 that rejects unknown
top-level keys will flag every legitimate `bw.raw()` unless `__bw_raw`/`v` are
allowed.

Measured coercion, so the schema matches reality rather than intent:
`c: 42` renders `42`, `c: true` renders `true`, `c: null` renders empty, and
numbers inside an array are stringified in place (`c: ['n=', 7]` -> `n=7`).
A schema should permit these rather than flag them, since the library accepts
them deliberately.

Deliverable: `schema/taco.schema.json`, generated, published.

### The authored form needs one extension: functional slots

In-JS TACOs legitimately contain functions, and they appear in a **closed,
enumerable set of places**:

| Slot | Type |
|---|---|
| `a.on*` | function (or string, which the wire strips) |
| `o.mounted`, `o.unmount`, `o.render` | function |
| `o.handle.*` | object of functions |

Everything else is data. So the authored-form check is the JSON Schema plus a
`typeof === 'function'` assertion on those slots -- not a second schema
language. Two modes, one schema:

- `verify(taco, { mode: 'wire' })` -- strict JSON Schema, functions are errors
- `verify(taco)` -- authored mode, functions allowed in the slots above only

That also catches a real mistake the wire mode should flag loudly: a server
sending `a: { onclick: 'save()' }`. It is stripped today in total silence, even
when spelled correctly, so the page renders a dead button and nobody is told.

### Schema 1.0 is in scope (decided 2026-10-06)

The wire form is now specified as a published JSON Schema, not left as a later
nice-to-have. It is doable because the wire form is small and closed: a TACO
that crossed a pipe holds no functions, and `t`/`a`/`c`/`o` plus `__bw_raw` is
the whole grammar.

**Two artifacts, one generated from the other:**

| File | Purpose |
|------|---------|
| `schema/taco.schema.json` | the normative wire form -- recursive `oneOf` + `$ref`, which is what it genuinely is |
| a generated flatter subset | "what current structured-output APIs accept". Hand-trimming rots: generate it or do not publish it |

The subset exists because structured-output APIs commonly reject the honest
shape (limited `oneOf`, weak recursion, no unevaluated properties). Two files,
because one file cannot be both correct and acceptable to those APIs today.

**Recommendation: drop the subset from 1.0.** "What current structured-output
APIs accept" is a compatibility matrix against three vendors' independently
changing restrictions -- unbounded maintenance hiding inside a one-line
deliverable. Publish the full schema, document the limitation, and add a subset
when someone actually needs it.

**There are two schemas, not one, and they carry different confidence.** The
TACO grammar is closed. A bwserve **frame** is an envelope with deliberate
holes: `update.data`, `message.data`, `call.args` and `listen.topic` are
arbitrary because the app defines them. Pin the envelope and the `taco` field;
do not pretend to pin the payloads. Saying "the schema" without that
distinction overstates the 1.0.

**Of the seven `o` keys the renderer reads, only three can cross the wire:**
`type`, `state` and `slots` (selector strings). `mounted`, `unmount`, `render`
and `handle` are functions. The wire schema's option set is those three, and
the generator must derive that rather than copy it.

**The schema is a published contract, not verify's engine.** This is the part
worth getting right:

- Verify keeps its own hand-rolled walk. It stays dependency-free and small
  enough to paste into a browser console, and bitwrench's zero-dependency
  claim survives.
- A **test** asserts the walk and the schema agree over the whole fixture
  corpus, in both directions: everything verify accepts validates, everything
  it rejects fails validation. That is what stops them drifting -- not one
  consuming the other.
- Pulling a validator (ajv or similar) into the shipped tool would make the
  schema authoritative at runtime and cost a dependency in the artifact people
  are told to run in CI. Not worth it.

**What the schema buys that the CLI cannot.** The CLI needs Node. A schema
needs nothing: a Python generator validates with `jsonschema`, a Go service
with its own library, an editor gets completion, and a model can be
*constrained* to emit valid TACO rather than checked afterwards. That is a
second answer to section 9's "who can run it" -- and the only one that reaches
a machine with no Node at all.

It also bounds the claim honestly. A schema says *well-formed*, never *safe*
or *correct*: `{ __bw_raw: true, v: '<img src=x onerror=f()>' }` is
schema-valid and is an injection, and a `bw_bccl_crad` class is schema-valid
and matches no rule. Schema-valid is the floor, and verify is the rest.

With the schema in place, verify's own job is what a schema cannot express:
does this class exist, does this factory read this prop, is this raw string
dangerous, does this `o` key do anything.

### The closed option set

**Generate this from the renderer, not from `src/bitwrench.d.ts`.** The two
disagree, and the `.d.ts` is the wrong source of truth.

The keys that actually change behaviour are the ones `hasOpts`
(`src/bitwrench.js:921`) and `hasLifecycle` (`:1302`) consult -- **seven**:

```
state, mounted, unmount, render, handle, slots, type
```

`userTag` and `events` used to be declared on `TacoOptions` and were removed
in 2.1.12: no renderer path reads them. `taco-options-drift` now fails the
build if the interface and the renderer disagree again. Verify still rejects
both keys, because a manifest generated from the old types would have
certified options the library ignores. The generator reads the call sites.

This must be **generated** into the manifest, not copied here -- see section 6.
A hand-copied list in this very document would be the second source of truth it
warns about. (Checked while writing: `opts.key` in `src/bitwrench.js` is a
`bw.syncChildren()` option, **not** a TACO `o.key` -- the sort of distinction a
generator gets right and a human transcribing a list does not.)

---

## 6. Derive everything; hand-maintain nothing

**This is the rule that makes or breaks the tool.**

If verify carries its own list of valid props, class names or option keys, those
lists rot and verify becomes a second source of truth -- which is the exact
disease the 2.1.11 cycle spent days curing. Six of the thirteen items in
`dev/bw-embedded-release-plan-2.1.x.md`'s inconsistency register are "the same
fact written in two places."

The repo already has the right habit: `dist/builds.json`, `dist/sri.json`,
`docs/bitwrench_api.md`, `embedded_c/bitwrench_embedded.h` and the embedded
size tables are all generated. So:

**`verify-manifest.json`, generated at build time, containing:**

| Content | Derived from |
|---|---|
| accepted props per factory | the same destructuring parse `_parseKeys()` already does in `src/bitwrench.js` |
| valid `bw_*` / `bw_bccl_*` class names | `bw.makeStyles()`'s own generated rules -- this directly kills the documented "5 of 9 class names guessed wrong" pain |
| the `o` option key set | the renderer's `hasOpts` / `hasLifecycle` reads (seven keys), not `TacoOptions` |
| void elements, valid attribute names | source |
| protocol message shapes | `bw.apply()`'s dispatch |

Consequence: verify can never disagree with the library it checks, and adding a
prop to a factory updates the checker for free.

---

## 7. What it checks, in tiers

### Tier 1 -- structural. A pure function: no DOM, no jsdom, no manifest.

It catches **three** of the six failures in section 1: the missing `t`
(`[object Object]`), the unknown top-level key (`cc`), and the `on*` string in
wire mode. The `~60 lines` estimate is for this walk, **not** for the feature as
motivated in section 1.

The algorithm:

1. Walk the tree. Arrays recurse (flattening the way `_flat` does, or document
   that verify does not flatten and recurse anyway).
2. A string, number or boolean is content. Accept.
3. `null` is content -- `_createNode` skips it via `if (content != null)`. Accept.
4. An object with `__bw_raw: true` and a string `v` is raw. Accept. Any other
   key on that object is an error.
5. An object with a string `t` is an Element. Any top-level key other than
   `t`, `a`, `c`, `o` is an error. Catches `tag`, `cc`, `attrs`, `children`.
6. An object with neither `t` nor `__bw_raw` is an error. Catches
   `{tag:'h1', c:'hi'}` and `{a:{class:'...'}}`.
7. `a`, when present, is a plain object. `class` is a string **or an array of
   strings** (both paths exist and are tested). Function values are legal only
   on keys starting with `on`. In wire mode any function is an error, and a
   **string** `on*` is an error -- `_sanitizeWireTaco` strips it silently, so
   the control ships dead even when spelled correctly.
8. Typo hints for the small set of names the library treats specially
   (`class`, `style`, `id`, `for`, `tabindex`, and the `on` prefix). Edit
   distance belongs **here**, in tier 1, for that set only -- not in tier 3.
9. `o`, when present, is a plain object. Keys are checked against the
   **generated** set once the manifest exists. Until then, **skip** the `o`
   check rather than hardcoding seven keys. A skipped check is honest; a
   hardcoded list is the rot section 6 forbids.

`c` recursion follows the same rules. Do not require `c` to be a string --
numbers and booleans are deliberate (`c: 42`, `c: true`).

Findings are **objects**, not strings, so tests and the diag loop can filter:

```javascript
{ code: 'unknown-key', path: 'c[0]', key: 'tag', hint: 't' }
```

`path` is a JSON-pointer-like location. `hint` is set only when the edit
distance is unambiguous. Return `[]` when clean. `verify.assert()` throws with
the codes joined, so a mocha failure names the key.

### Tier 2 -- derived. Needs the generated manifest, and carries the headline.

**The class typo and the bad factory prop are the two failures that hurt the
2.1.12 audience** (embedded pages and generated UI). `dev/embedded-tutorial-2.1.x.md`
already recorded "5 of 9 class names guessed wrong." A 2.1.12 that announces
verify with only structural key checks does not deliver section 1's argument,
so **the tool is not done until these two exist.**

- **Factory props** via the same `_parseKeys()` the runtime warning uses -- not
  a second parser. It returns `null` for the nine rest-element form factories;
  those need the rest-parameter handled rather than waved through. **Do not
  accept arbitrary keys just because a rest element is present** -- that is
  exactly how `onchnage` hides today.
- **`on*` handler names, normalised first.** The renderer does
  `key.slice(2).toLowerCase()` then `addEventListener`, so **`onClick` works**
  and must not be flagged as an error (a style hint at most). Normalise, then
  probe the normalised name: `onchnage` -> `chnage`, and `'onchnage' in probe`
  is false. Verified: `onclick`/`onClick`/`onInput`/`onFocus`/`ondrop` all
  normalise to real events; only `onchnage` is bogus, and it silently binds a
  listener to an event nothing dispatches.
- **Class names, `bw_`-prefixed only** (see the three kinds below).

#### Class tokens are three different things

1. **Application classes** (`card`, `is-open`). No generated rule will ever
   name them. Checking "every class matches a generated rule" flags every real
   app. **Do not do this.**
2. **`bw_` / `bw_bccl_` tokens** -- the library's own vocabulary, checked
   against `bw.makeStyles()` output. `bw_bccl_crad` is the finding. Ignore
   `bw_uuid_*` and `bw_lc`: the renderer stamps those, they are not authored.
3. **`bw_act_*`** -- the handler is frequently **not in the page**. `bw.actions`
   publishes `act:<name>` and posts to the device; firmware handles it. A
   "no handler anywhere" check cannot see firmware and would mark every correct
   device button wrong -- that is the embedded release's own pattern. **Leave
   this off** unless the caller passes a set of known action names.

#### Attributes: no whitelist

bitwrench forwards attributes on purpose -- `_createNode` special-cases
`style`, `class`, function `on*` and `value`-on-`input`, then falls through to
`el.setAttribute(key, String(value))`. That is how SVG keeps `viewBox` and
`stroke-width` and how apps keep `aria-*` and `data-*`; `docs/svg.md` depends on
it. Verified passing through today: `aria-label`, `data-reading`,
`stroke-width`. **A closed attribute list would flag correct TACOs on the first
dogfood run and people would switch the tool off.** The narrow check is the
typo hint in tier 1 step 8.

### Tier 3 -- semantic / page-level. Can slip.

- duplicate `id`s in one tree
- `o.render` present but unreachable by `bw.refresh`
- `o.slots` selectors matching nothing in the node's own subtree

None of these block the announcement. Slot checks need a DOM or a simulated
tree, which is a **different tool** from the pure `verify(taco)` -- keep
`verify.page()` in the same package but behind a function the structural walk
never imports, so jsdom cannot leak into tier 1.

---

## 8. Naming: three verification tools, three jobs

There is already `npm run verify-sri` and `tools/drift-lint.js`. Three
verification-ish names will blur unless the split is stated:

| Tool | Checks | Audience |
|---|---|---|
| `drift-lint` | **our repo's** prose and source agreeing with itself | maintainers |
| `verify-sri` | **our published artifacts** matching their hashes | release pipeline |
| `bitwrench-verify` | **a user's** TACOs, props and classes | users |

Say this in `docs/` or the three will be confused forever. ("bw-verify" is fine
as shorthand; the artifact is `bitwrench-verify.js` to match `bitwrench-debug.js`.)

---

## 9. Run modes

One function. The library and the CLI are not two checkers.

| Door | Entry | Default mode | Use |
|---|---|---|---|
| Browser console | `<script src="bitwrench-verify.js">` -> `bwv.verify(taco)` | authored | poking at a live page |
| Node / Bun | `import { verify } from 'bitwrench/verify'` | authored | tests, tools, or shell out to the CLI |
| CLI | `bwcli verify <file.json>`, or stdin | **wire** | CI, and a pipe from Python, C++, or a shell |
| Explicit wire | `verify(taco, { mode: 'wire' })` | wire | a JavaScript sender, before it sends |

The CLI is the library linked to a file and stdin buffer. It does not grow
its own rules. A test that imports `verify` and a job that runs
`bwcli verify frame.json` report the same findings.

### Who can run it

| Machine | What they do |
|---|---|
| Node, Bun, a browser | Import the library, or drive the CLI. |
| Desktop, server, or a Pi-class Linux computer | The program can be C++ or Python. Node is on that machine, so the usual path is a pipe into the CLI. |
| Bare metal | No Node, so the checker cannot run on the device. On the host, the CLI checks compile-time assets (string literals, generated headers) and any frame the host can already see: the same C++ run on the desktop, or a captured log. |

A frame built at runtime on the board is checkable once it has crossed a pipe.
Until someone captures it, verify has nothing to read. That is the limit, and
it is a limit on where JavaScript runs, not on whether the UI exists.

Looking at that live page is bwserve. The browser is the renderer. Metal C++
drives it by sending frames -- the C headers already emit those -- and reads
action post-backs. Query and screenshot are the same protocol with a return
trip. The C headers do not wrap that round-trip yet, so the usual inspector is
a host tool (`bwcli attach`) watching the page the chip is driving. Firmware
that wants to ask the page a question itself speaks those messages and handles
the POST-back.

A page can subscribe to `bw:diag` and post findings back to the server that
produced the tree, so the generator learns it emitted something invalid. That
loop waits on the post-back URL decision (section 15). The snippet below is
the shape, not a 2.1.12 commitment:

```javascript
bw.sub('bw:diag', function(d) {
  if (bw.remote) bw.remote.send({ v:1, type:'event', action:'diag', value:d.code });
});
```

Two cautions if that is wired up: memoize per code (a generator in a loop will
otherwise flood the server with its own mistakes), and send the **code and a
bounded key name only** -- never echo arbitrary page content back into server
logs.

---

## 10. What stays in core

The end state is core nearly silent and verify loud. But a developer who never
loads verify must not be back to total silence, so core keeps only the checks
with the best value per byte:

- the `make*` unknown-option warning (already shipped, ~560 bytes) -- **note it
  leaves core anyway when 2.2 carves out BCCL**, so do not contort to save these
  bytes now
- ~~the `on*` handler heuristic~~ **Not in 2.1.12.** Two reasons. The version I
  proposed was simply wrong: it probed the raw key, which would have flagged
  `onClick` -- and `onClick` **works** (the renderer normalises it). The correct
  check normalises first, and that belongs in verify where it can be thorough.
  Second, headroom was 359 bytes at the 2.1.11 rebuild (46,745 against 47,104)
  and the heuristic is ~100 of them; leaving it out keeps the budget decision
  easy and costs nothing now that verify exists.
- the existing `bw:diag` codes

Everything thorough -- suggestions, class-name validation, page-level checks --
lives in verify where it costs production nothing.

**Discoverability: the highest-leverage placement is inside the warning core
already prints.**

```
bw.makeButton: unknown option "href" ignored. Accepted: text, variant, ...
  (load bitwrench-verify.js to check a whole tree)
```

Docs are found by people who go looking. That line finds people who are not.

---

## 11. Non-goals

- **Not PropTypes, and not a schema DSL.** Verify ships a fixed set of derived
  checks and **never loads a user-authored schema**. The moment verify reads
  your schema we own a dialect, its error formatting, its composition and its
  versioning -- a type system by instalments.

  This is not the same as refusing user schemas altogether. Users *should*
  write JSON Schema for their own site's vocabulary, narrowing the published
  TACO grammar with `allOf` + `const`/`pattern`, and run it with the validator
  their language already has (ajv, `jsonschema`, and so on). That costs us
  documentation, not a feature, and it reaches machines with no Node. The split
  that keeps both true:

  | | |
  |---|---|
  | We publish a grammar; you validate against it with your own tooling | yes |
  | You write a schema for your own vocabulary and run it in your CI | yes, documented |
  | Verify reads your schema and reports against it | **no** |

  See `dev/bw-taco-schema-draft.md`, which is that documentation.
- **Not required.** A companion for the situations in the north star and
  section 4. It must never become a build step or a toolchain.
- **Not in core.** No bytes in the 46 KB budget.
- **Not a replacement for the `.d.ts`.** TS users keep their compile-time
  checking; verify covers runtime data, which types cannot reach.
- **Not a formatter or a style enforcer.**

---

## 11a. Test fixtures to write first

These pin the behaviour above and are the acceptance criteria for tier 1. Each
was verified against 2.1.11 before being listed, so an "accept" case really
does render today.

**Accept:**

```javascript
{ t: 'h1', c: 'hi' }
{ t: 'p', c: ['n=', 7, true] }                        // numbers/booleans coerce
{ t: 'div', c: null }                                 // skipped, not an error
{ t: 'button', a: { onclick: function(){} }, c: 'Go' } // authored mode
{ t: 'button', a: { onClick: function(){} }, c: 'Go' } // WORKS -- not an error
{ t: 'svg', a: { viewBox: '0 0 10 10' },
  c: { t: 'rect', a: { 'stroke-width': 1 } } }
{ t: 'div', a: { class: ['card', 'bw_bccl_card'] } }  // class may be an array
{ __bw_raw: true, v: '<b>x</b>' }                     // bw.raw()
{ t: 'span', a: { 'aria-label': 'temp', 'data-reading': '1' } }
{ t: 'div', a: { class: 'my-card' } }                 // app class: MUST pass
```

**Reject:**

```javascript
{ tag: 'h1', c: 'hi' }                     // missing t, hint: t
{ t: 'h1', cc: 'hi' }                      // unknown key, hint: c
{ t: 'h1', a: { clas: 'x' } }              // hint: class
{ t: 'div', o: { onMount: fn } }           // once the manifest exists, hint: mounted
{ t: 'div', o: { events: {} } }            // the renderer does not read it
{ t: 'div', o: { userTag: 'x' } }          // ditto -- see section 5
{ a: { class: 'bw_bccl_crad' } }           // missing t (tier 1) + bad class (tier 2)
// wire mode only:
{ t: 'button', a: { onclick: 'save()' } }  // stripped silently -> dead control
```

**`{ t: 'div', a: { class: 'my-card' } }` is the regression test for an
over-broad class check. Put it in the suite before the class check is written** --
it is the one that stops verify from flagging every real application.

---

## 12. Open questions

1. ~~Does `verify()` return findings or throw?~~ **Settled: returns an array
   of finding objects; `verify.assert()` throws with the codes joined.**

**Settled: one name, `verify`.** An earlier draft had `verify()` in section 2
and `bwv.check()` in section 9; a second verb ends up in half the examples.

- Node / Bun: `import { verify } from 'bitwrench/verify'` -- subpath of the same package, with `import` and `types` (unlike `./debug`, which is `require` / `default` only)
- Browser global: `bwv.verify(taco)` -- the same function
- `verify.props(factoryName, props)` -- tier 2
- `verify.page(root)` -- tier 3, DOM-dependent, never imported by the walk
- `verify.assert(taco)` -- throws, for tests
2. One artifact or two -- is the Node entry the same file as the browser one?
   (Leaning: one UMD + one ESM, as every other target already does.)
3. Does the manifest ship inside `bitwrench-verify.js` or beside it?
   (Leaning: inside, so there is one file to load and nothing to fetch.)
4. Should `bwd` (debug) load verify when present, so the console has both?
5. Is `schema/taco.schema.json` published to npm, a docs URL, or both? (It
   wants a stable URL if models are to be constrained by it.)
6. Does the wire mode belong in verify, or is it cheap enough to sit in bwserve?
7. Versioning: does verify track bitwrench's version exactly?
   **Settled: yes.** Same npm package, same version, same release, exactly like
   `bitwrench-debug.js`. The manifest is generated per build, so a mismatched
   verify would be checking against another release's facts.

---

## 13. Repo plumbing for a new dist artifact

`bitwrench-debug.js` is the template -- every place that enumerates it needs a
verify entry, or the release gates will either miss the file or fail on it.
Traced from the existing target:

- [ ] `rollup.config.js` -- the build target (UMD + ESM, min + map)
- [ ] `package.json` -- `exports` map, `files`, and any build script
- [ ] `tools/build-builds-manifest.js` -- so it appears in `dist/builds.json`
- [ ] `npm run sri` / `verify-sri` -- the hash count moves off 53; the gate
      checks "every loadable file covered", so a missing entry fails the release
- [ ] `test/` -- a suite of its own, mirroring `test/bitwrench_test_debug.js`
- [ ] bundle-parity tests -- ESM vs CJS vs UMD export names
- [ ] `tools/drift-lint.js` -- it already name-checks dist targets
- [ ] `pages/09-downloads.html` -- the builds table is generated from
      `builds.json`, so verify this renders rather than assuming
- [ ] `releases/v2/` archive -- `tools/build-release.js` snapshots the targets
- [ ] **Not** the 46 KB core budget. Verify is a separate artifact and must stay
      out of it. The only core cost under discussion is the `on*` heuristic
      (~100 bytes, section 10), and now that verify exists that becomes an
      explicit choice rather than a necessity -- see section 14.

## 14. Documentation surface

"Document the heck out of it" -- the full list, so none of it is discovered
late. An undocumented checker is worse than no checker: it is bytes nobody
loads.

**New:**

- [ ] `docs/verify.md` -- the reference: what each tier checks, every finding
      code with an example of the mistake that produces it, the two modes
      (authored vs wire), and the run modes
- [ ] `pages/NN-verify.html` -- a live demo. The five silent failures from
      section 1, each shown rendering wrong next to the finding verify
      produces. That page *is* the argument; nothing else makes the case as fast
- [ ] `schema/taco.schema.json` -- published, with a stable URL so models can
      be constrained by it

**Updated:**

- [ ] `llms.txt` -- a "Checking your work" section. This matters more than usual
      here: an LLM writing bitwrench is exactly the author most likely to invent
      `onClick`, `children` or `tag`, and it is also the one that can run a
      checker without being asked
- [ ] `agents.md` -- the north star first, then the doors in section 3 and the
      verify-vs-debug rule, so an agent treats verify as a companion and not
      as a required step
- [ ] `docs/thinking-in-bitwrench.md` -- a "How do I know it is right?" section.
      Lead with the north star: an extra companion for mistakes and CI, in
      the situations in section 4. The page is the feedback. Verify is how a
      run fails when nobody is looking. One ordinary sentence: if you see
      `[object Object]`, the object has no `t`.
- [ ] `README.md` -- the north star in one or two sentences, plus section 4's
      situations, so it does not read as a required step
- [ ] `docs/README.md` -- index entry
- [ ] `docs/core-api.md` -- the three-tool naming split (section 8)
- [ ] `CONTRIBUTING.md` -- if verify runs in our own test suite, say so
- [ ] `CHANGELOG.md` -- and the 2.1.12 release notes
- [ ] core's unknown-option warning -- append the pointer (section 10). One
      string, read at the exact moment someone needs it

**Dogfood it:** run verify over our own `pages/` and `examples/` in CI. If it
finds nothing, the checks are too weak; if it finds something, we had a bug.
Either outcome is informative, and it means the tool is exercised on real
trees rather than fixtures.

## 15. Sequencing

**The honest minimum to announce beside the embedded work** -- tier 1 alone is
not it, because the two failures that hurt this release's audience are tier 2:

1. **Tier 1** as specified in section 7: shape, missing `t`, raw nodes, `on*`
   strings in wire mode, typo hints for the small special-name set.
2. **Tier 2 class check** for `bw_` / `bw_bccl_` only, from generated CSS.
3. **Tier 2 factory props** via `_parseKeys()`, including the rest-element case.
4. **`schema/taco.schema.json`** generated from the same rules, plus a test that
   verify and the schema agree on a shared fixture set.
5. **The one-line pointer** on the existing unknown-option warning.
6. **The CLI.** File and stdin buffering over the same `verify()`, wire mode
   by default. Not a second set of rules. This is how Python, desktop C++, a
   Pi, and CI reach the checker.
7. **`docs/verify.md`**, the live page showing the six cases, `llms.txt`
   and `agents.md`. An undocumented checker will not be loaded. The page
   sentence about `[object Object]` ships with the docs even if someone never
   loads the tool.

**Drop if the release gets heavy:** tier 3, the `bw:diag` loop, the
model-subset schema, and any core `on*` heuristic. `verify.install()` can
follow the library inside the same release; it is a door, not the minimum.

The CLI stays in the minimum because it is the library plus buffering. Dropping
it would leave a checker that only a JavaScript caller can run, which is a
smaller product than the one section 9 describes. Bare metal still does not
run it. The host does, on assets and captured frames. Calling `verify()` inside
`test/bitwrench_test_embedded_c.js` is the same function on frames the C tests
already produce. The honest claim is "a host can check a payload, and the
examples are checked." The chip runs neither.

**Sequence the `bw:diag` loop after the post-back URL decision.** Today
`bw.connect('/bw/events')` posts to that same URL because
`url.replace('/events/', '/apply/')` cannot match a path with no trailing slash,
and the POSIX demo depends on it (register item #12 in
`dev/bw-embedded-release-plan-2.1.x.md`). Building the "generator learns from
diag" loop before 2.1.12 picks one path teaches the accident again. The cautions
already in section 9 -- memoize per code, send the code and a bounded key name,
never echo page content -- stay.

### Scope warning for 2.1.12 -- RESOLVED 2026-10-11

**Option 2 was taken, and then some.** The sequence is 2.1.12 verify, 2.1.13
CSS/lean split, 2.1.14 embedded. Verify shipped tier 1 plus the CLI; tier 2 and
tier 3 did not ship at all, so even option 2 understated the narrowing. The
three options below are history.

~~2.1.12 now carries the embedded release *and* this.~~ Those are two substantial
workstreams, and the embedded one already has a 13-item inconsistency register
plus adapters to write. Three honest options:

1. Both, with tier 3 dropped and the embedded adapters limited to one stack.
2. Verify in 2.1.12, embedded in 2.1.13. Verify is self-contained and ships
   faster; embedded needs board testing on hardware we cannot CI.
3. Embedded in 2.1.12, verify in 2.1.13 -- but registry submission is the
   gating item for the embedded article, so this ordering delays the writing.

Option 1 is viable precisely because tiers 1-2 are small. Worth deciding before
work starts rather than discovering it halfway.
