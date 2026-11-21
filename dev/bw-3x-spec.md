# bitwrench 3.x -- design spec

Draft 1, 2026-11-08, on branch `design-3x`. For Manu's review. Nothing here
is scheduled; 2.1.14 shipped on 2026-11-07 and the next work is the 2.1.15
docs push (embedded article and examples, then AG-UI), which this spec does
not block and does not depend on.

How to read it: section 1 is what 3.x keeps, and is not up for debate in
this document. Section 2 is the three ideas. Section 3 is the change table
against 2.x, which is the part to review line by line. Section 7 is the
list of decisions that need an owner's answer.

Numbers quoted are the 2.1.14 release numbers (gzip level 9 of the shipped
`.gz`, see `dist/builds.json`): full UMD 47,944, full ESM 48,083, lean
29,941 / 29,735, BCCL 19,782, verify 7,098 raw minified.

---

## 0. In ten lines

1. The TACO object format becomes a written, versioned specification.
   bitwrench is its reference runtime. No rename, no fork, no new package.
2. The runtime is layered into entries (`core`, `bccl`, `wire`, `node`,
   `legacy`), ESM-first. The full UMD file continues to contain everything.
3. Every build format 2.x ships continues to ship. Longevity is a brand
   promise across deftio projects and 3.x does not spend it.
4. Modern ESM users see only the ESM story: entries, types, tree shaking.
   The legacy machinery is the pipeline's concern, gated by tests, invisible
   in the docs path a modern reader follows.
5. One contract over every factory: base props, one naming rule for the
   visible text, one class layering rule, CSS by composition.
6. One contract over every verb: a one-target verb throws on an unresolvable
   target; a query verb returns null or an empty array.
7. The attribute, resolver and sink rules that 2.1.13 and 2.1.14 unified
   move into the spec as renderer conformance requirements.
8. verify grows a migration rule set that names each 2.x pattern 3.x drops.
9. Compatibility stubs that exist only to throw a helpful error are removed.
10. Size targets: core 18 KB gz, lean 30 KB, full 47 KB. The full gate is
    not raised.

---

## 1. What 3.x keeps

These are decided and this spec builds on them.

- **The TACO shape.** `{ t, a, c, o }`. No new keys, no renamed keys. A 2.x
  TACO is a 3.x TACO.
- **Every build format.** UMD, CJS, ESM, ES5, minified and not, with source
  maps, SRI hashes, `builds.json`, and the embedded C headers. The deftio
  promise is that a file a reader vendored in 2019 still has a maintained
  successor in the same shape. 3.x adds entries; it removes no artifact.
- **No build step required.** A `<script>` tag and an object literal is a
  complete program.
- **No raw DOM and no `data-*` in library code.** The north star rules in
  `docs/bitwrench-northstar-principles.md` apply unchanged.
- **CSS is a function of the palette.** `bw.css()` plus palette values;
  no `var(--bw_*)`, no theme-override selectors.
- **The wire protocol.** bwserve's nine message types (`mount`, `patch`,
  `append`, `remove`, `batch`, `hello`, `listen`, `call`, `message`) and
  the C headers that emit them. A 2.x device talks to a 3.x page.
- **verify ships as the checker.** It stays under its documented size.
- **One path to main.** The release pipeline, unchanged.

---

## 2. The three ideas

### 2.1 TACO is a specification; bitwrench is the reference runtime

Today the format is defined by what `src/bitwrench.js` does, described
after the fact in `docs/taco-format.md`. The C headers, bwserve, verify, the
MCP server and the `.d.ts` each restate parts of it, and the 2.1.13 audit
found them disagreeing (type drift on day one). The attribute-boolean bug
(#124) was three sinks each with their own idea of the format.

3.x writes the format down once, as a document with a version number, and
makes everything else an implementation of it.

**What the spec document contains** (`docs/taco-spec.md`, "TACO 1.0"):

- The four keys and their value domains. `t` is a string; `a` is an object
  of string keys; `c` is a string, a TACO, or an array of those, flattened
  to any depth; `o` is an object with an enumerated key set (`state`,
  `handle`, `slots`, `mounted`, `unmount`, `render`, `update`, and the
  rest that verify's option list already names).
- **Two profiles.** *Authored TACO* may contain functions in `a` (handlers)
  and `o`. *Wire TACO* is the JSON subset: no functions, handlers named by
  string and resolved by the runtime's registry. verify already
  distinguishes these (`function-in-wire`, `handler-string`); the spec gives
  the distinction a name.
- **Renderer conformance.** What a conformant renderer must do with a TACO:
  escape content by default and honour `raw`; serialise attribute values by
  the one rule (null omits, booleans by attribute class, everything else
  stringified: the #124 rule, verbatim); switch to the SVG namespace at
  `svg` and back at `foreignObject`; flatten nested arrays in `c`; treat an
  unknown `o` key as an error in wire profile and a warning in authored.
- **Identity.** The `bw_uuid_*` class as the addressable identity of a
  node, `bw_lc` as the lifecycle marker, and the resolver rule (element,
  id, selector, uuid) that every verb shares.
- **The wire operations** as a second small document, "TACO Wire 1.0": the
  five DOM operations and four communication operations bwserve uses, their
  JSON shapes, target resolution, and the post-back forms. This is what the
  C headers implement.
- **Conformance test.** verify is the reference validator. A fixture set
  of TACOs with expected verdicts and expected HTML ships in `test/spec/`;
  a second runtime passes conformance by producing the same verdicts and
  the same HTML.

**What changes in practice:**

- `bitwrench.h` and `bwserve.h` say "implements TACO 1.0 and TACO Wire
  1.0" and carry the spec version, not the JS version. This answers open
  decision 5 in `dev/bw-embedded-release-plan-2.1.x.md` (decouple the C
  manifest version from the JS version): the C side is versioned by the
  spec it implements, and the spec moves slowly.
- The AG-UI and A2UI mapping in `dev/bitwrench_agui_a2ui_feedback.md`
  becomes a mapping between two specifications, which is how those projects
  describe themselves. "Map AG-UI events to TACO Wire 1.0 operations" is a
  sentence their readers understand; "map AG-UI to bitwrench's internal
  object format" is not.
- `docs/taco-format.md` stays as the teaching document and links to the
  spec for the normative text.
- The JSON Schema the north star says bitwrench does not publish gets
  published, generated from the same source verify reads. It is a
  by-product of writing the rules down once.

**What this is not.** It is not a rename, a fork, a new npm package, or a
second repository. The npm name, the GitHub repo, the registry entries and
the download history stay where they are. If a second runtime ever appears
(a Rust renderer, a different JS runtime), it implements the spec and
picks its own name; `taco-dom`, `tacojs`, `tacoui` and `tacoml` were free
on npm on 2026-11-08. bitwrench does not need one of them.

### 2.2 A layered runtime, ESM-first, with the legacy undistracted

**Entries.** The `exports` map in `package.json` already has `.`, `./lean`,
`./bccl`, `./bwserve`, `./util-css`, `./code-edit`, `./verify`, `./debug`,
`./mcp`. 3.x reshapes the runtime side of it:

| Entry | Contains | Target gz |
|---|---|---|
| `bitwrench/core` | TACO to DOM and HTML, `h`, `raw`, `css`, `injectCSS`, resolver and verbs (`mount`, `append`, `replace`, `patch`, `clear`, `el`, `$`, class verbs), identity, lifecycle, `syncChildren`, pub/sub, `loadStyles` with the reset, typography, roles, grid and tables sheet | 18 KB |
| `bitwrench/wire` | the bwserve client (`connect`, `apply`, `actions`, `registerRemote`), `parseJSONFlex`, `jsonPatch` | 3 KB |
| `bitwrench/bccl` | the 48 factories, the widget sheet, the utility class sheet | 20 KB |
| `bitwrench/node` | `htmlPage`, file ops, `janitor`, anything that needs `fs` or `process` | 3 KB |
| `bitwrench/legacy` | the 1.x utilities: `loremIpsum`, cookies, `getURLParam`, `setIntervalX`, `repeatUntil`, `colorParse`, `colorInterp`, `multiArray`, the array set operations, `choice`, `naturalCompare`, `mapScale`, `clip` | 2 KB |
| `bitwrench` (default) | everything above, one object, for the reader who wants one import | 47 KB |
| `bitwrench/lean` | core + wire + router + the four core factories, the microcontroller file | 30 KB |

The numbers come from the source-map attribution in
`dev/bw-lean-engine-cuts-plan.md` and are targets to measure against, not
promises.

**The legacy promise, kept without cost to modern readers.** Every entry
builds to UMD, CJS, ESM and ES5 from the same source, as now. The
distinction 3.x draws is in the *documentation path*, not the artifacts:

- The quickstart, the API card, llms.txt and agents.md show ESM imports
  (`import { mount } from 'bitwrench/core'`) and the one-file `<script>`
  tag. They do not mention ES5, CJS or UMD.
- `docs/builds.md` (new) is the one place the full matrix lives: every
  file, what it is for, who should load it. The downloads page and
  `builds.json` are generated from the same table. A reader who needs a
  2012 browser finds it in one step; a reader who does not never sees it.
- The self-load test and the bundle tests gate every format, so the legacy
  files are maintained by the pipeline, not by attention.
- `bitwrench.d.ts` splits per entry (`core.d.ts`, `bccl.d.ts`, ...), so
  a `core` import has a `core`-sized type surface. The single
  `bitwrench.d.ts` remains for the default entry.

**What this costs.** The full UMD file does not get smaller; it is the
longevity artifact and holds everything. The win is for the ESM reader
(core at 18 KB, tree-shakeable) and for the microcontroller (lean at 30
KB with nothing it cannot use). The utility sheet and the Node verbs
leave lean, which is the plan already drafted; 3.x is where the Node
verbs leave the *browser* entries too, which is the only cut that lowers
the full ESM file and needs the major because `bw.htmlPage` moves.

### 2.3 One contract over the set

The 2.1.x fixes that held were the ones that replaced per-case code with a
rule over the set and a test over the set: one resolver (`_resolveTarget`),
one sink (`_applyTo`), one attribute serialiser (`_attrValue`). 3.x applies
the same move to the three places that still lack a rule.

**Factories.** 48 `make*` functions in `src/bitwrench-bccl.js`, four more
in core. Today the visible text of a thing is `text` (nav, breadcrumb,
dropdown, list group), `title` (accordion, card), `label` (tabs, stepper)
or `content` (alert), and the open `ComponentConfig` index signature means
the config-drift lint cannot see two of them. A wrong name renders empty
with no warning; the 2.1.12 audit found five doc bugs from this alone.

The contract:

- Every factory takes `FactoryProps` (`id`, `class`, plus `a` for
  attributes to merge onto the root). `className` is removed.
- One vocabulary for text: `label` is the short visible text of a control
  or item (button, tab, step, nav item, chip, badge, breadcrumb, option);
  `title` is the heading of a container (card, accordion panel, modal,
  alert); `content` is a body; `description` is secondary text. `text` is
  not a prop name anywhere.
- Every factory has a named `*Config` interface; `ComponentConfig` with its
  open index signature is removed, so `bccl-config-drift` covers the set.
- Every factory's root carries exactly three class layers in a fixed order:
  the widget class (`bw_<widget>`), part classes on descendants
  (`bw_<widget>_<part>`), state classes (`bw_is_<state>`). Variant and
  size are state classes, not widget classes.
- A factory never writes an attribute onto a TACO it did not create (the
  #127 rule, generalised).
- The contract test (`test/bitwrench_test_bccl_contract.js` exists and
  grows): for every exported factory, call it with the minimum props,
  render, and check the class layering, the id placement, the `label`
  vocabulary, and that no `data-*` or inline handler string appears.

**Widget CSS.** The 2.1.14 measurement of the widget sheet: 296 rules,
963 declarations, 362 distinct, 56 percent repeated bytes, 163
declarations already a core utility class, and every themed rule written
twice for two palettes. Three layers replace the bag of properties:

1. Utility classes the factories emit directly (`bw_d_flex`, `bw_p_2`,
   ...): the 163 declarations leave the widget sheet.
2. Pattern classes shared by widgets (`bw_surface`, `bw_interactive`,
   `bw_focus_ring`, `bw_elevated`): one rule each, themed once.
3. Widget-specific rules, which should be what is left after 1 and 2, and
   are the only place a widget name appears in CSS.

The inventory tool (`tools/build-css-class-inventory.js`) becomes a test:
every class a factory emits is defined in some sheet, every class a sheet
defines is emitted by some factory or documented as a public hook.
Expected effect on BCCL gz: 5,304 structural bytes toward the core sheet's
3,776 for a comparable rule count; measure, do not promise.

**Verbs.** `append` and `replace` return `HTMLElement | null` and warn when
the target does not resolve. quikleaf wrapped them in a throwing helper and
changed seventeen call sites (#127 item 2). The 3.x rule: a one-target verb
(`mount`, `append`, `replace`, `patch`, `clear`, `unmount`) throws when its
target does not resolve, because an unresolvable target on a verb that
exists to act on one element is a programmer error. A query (`el`, `$`)
returns null or `[]`, because probing is what a query is for. Callers who
want to probe before acting call `el` first. This is the smallest possible
breaking change in behaviour and the one most asked for.

**Palette.** `palette.background`, `surface` and `surfaceAlt` are strings;
every other key is an object with eight shade fields. Consumers have to
know which is which. Whether 3.x gives surfaces the object shape is open
question 4; it is breaking for every theme consumer and the benefit is
uniformity, so it needs a measured count of affected call sites first.

---

## 3. What changes from 2.x

The review table. "Breaking" means a 2.x program can stop working.

| Area | 2.x | 3.x | Breaking | Migration |
|---|---|---|---|---|
| Format definition | implied by `src/bitwrench.js`, described in taco-format.md | `docs/taco-spec.md` (TACO 1.0) and `docs/taco-wire-spec.md` (TACO Wire 1.0), normative; JSON Schema published | no | none |
| C header versioning | tracks the JS version | states the spec version it implements | no | none |
| Default import | `import bw from 'bitwrench'`, everything | unchanged | no | none |
| Entries | `.`, `lean`, `bccl`, `bwserve`, `util-css`, `code-edit`, `verify`, `debug`, `mcp` | adds `core`, `wire`, `node`, `legacy`; `util-css` folds into `bccl` | no for existing entries | optional: narrow imports to `core` |
| `bw.htmlPage`, file ops, `janitor` in browser builds | present in full and lean | present in default and `node`; absent from `core`, `lean`, `bccl` | yes for lean users who called them in a browser | import from `bitwrench/node` or the default entry |
| 1.x utilities | on `bw` in every build | on `bw` in the default entry and `legacy`; absent from `core` and `lean` | yes for lean users | import `bitwrench/legacy` or the default entry |
| Utility class sheet | in core's `loadStyles()` | in `bccl`; `core` `loadStyles()` emits reset, typography, roles, grid, tables | yes for lean pages that used `bw_d_flex` etc. | load the BCCL file, or the utility sheet file |
| `append`, `replace`, `mount`, `patch`, `clear`, `unmount` on an unresolvable target | warn and return null | throw | yes | probe with `bw.el()` first where null was intended; `bw.strictTargets = true` (2.1.15) previews the 3.0 behaviour |
| `bw.el`, `bw.$` | null / `[]` | unchanged | no | none |
| Factory text prop | `text`, `title`, `label`, `content` by widget | `label` / `title` / `content` / `description` by role; `text` removed | yes | verify `v2-factory-prop` rule names each site; the `.d.ts` rejects `text` |
| `className` prop | accepted, deprecated | removed | yes | `class` |
| `ComponentConfig` open type | `makeToast`, `makeFormGroup` | named configs for all 48 | type-level only | none at runtime |
| Factory root classes | widget class plus assorted variant classes | three fixed layers: `bw_<widget>`, `bw_<widget>_<part>`, `bw_is_<state>` | yes for CSS that targeted a 2.x variant class | class map published in the changelog; verify warns on 2.x class names in `a.class` |
| Widget CSS | one sheet, per-widget property bags | three layers: utilities, patterns, widget-specific | only for consumers who styled against internal classes | same class map |
| Throwing stubs `bw.component`, `bw.compile`, `bw.when`, `bw.each` | throw an explanatory error | removed | yes, trivially | the 2.0.19 migration already applied |
| `bw._el` alias | present | removed | yes | `bw.el` |
| `.d.ts` | one file for all entries | one per entry plus the combined file | no | none |
| Build matrix documentation | downloads page, README table, builds.json | `docs/builds.md` is the source; the others generate from it | no | none |
| verify | structural rules | adds a `v2-*` migration rule set that is on by default in 3.0 and removable with one option | no | run verify on the 2.x code before upgrading |
| bwserve protocol | nine types | unchanged | no | none |
| Palette shape | surfaces are strings | open question 4 | would be | TBD |
| Size gates | full 47 KB, lean 30 KB | adds core 18 KB; full and lean unchanged | no | none |

---

## 4. What does not change, stated so it is not reopened

- The `{ t, a, c, o }` keys, the handler-in-attribute convention, the
  escaping default and `raw`, the SVG rules, the identity classes.
- `bw.loadStyles()`, `makeStyles`, `applyStyles`, `toggleThemeMode`,
  `setThemeMode`, `clearStyles`.
- `o.handle`, `o.slots`, `el.bw`, `bw.mount` returning the root,
  `bw.message`.
- The router, pub/sub, `syncChildren`, `derive`.
- The CLI (`bwcli`), attach, the MCP server, and the bwserve server API.
- The C headers' macros and the five DOM operations they emit.
- The release pipeline and the one-path-to-main rule.

---

## 5. verify as the migration tool

The 2.0.19 migration left throwing stubs in the runtime because there was
no other way to tell a reader what had moved. 3.x has verify. Each breaking
row in section 3 gets a verify rule that names the 2.x pattern and the 3.x
replacement:

- `v2-factory-prop`: a `make*` call with `text`, or `title` where `label`
  is now the name, by factory.
- `v2-classname`: `className` in factory props.
- `v2-null-check`: `if (!bw.append(...))` shapes, which are dead in 3.x.
- `v2-removed-api`: `bw.component`, `bw.compile`, `bw.when`, `bw.each`,
  `bw._el`, `bw.toggleStyles`.
- `v2-variant-class`: a 2.x widget variant class in `a.class`.
- `v2-lean-surface`: on a lean page, a call to a verb that moved to `node`
  or `legacy`.

The rule set runs by default in 3.0.x, is off by default in 3.1, and is
removed in 3.2. That gives the migration a lifetime without leaving it in
the runtime, and it keeps verify inside its size budget because the rules
are a separate entry (`bitwrench/verify-migrate`).

---

## 6. Sequencing

3.x does not come before the docs push. Proposed order:

1. **2.1.15: the embedded article and examples, then the AG-UI version.**
   Docs and examples, with two non-breaking engine cuts riding along if
   they are ready: the utility sheet leaving lean, and the Node verbs
   leaving lean (they stay in full). Both measured against the 30 KB gate.
2. **The spec documents are written during 2.1.x**, because they describe
   2.1.14's behaviour, which is already the unified behaviour. Publishing
   TACO 1.0 is not a breaking change and does not wait for 3.0.
3. **3.0** is the breaking set from section 3, shipped in one release with
   the migration rule set, and nothing else. No new features in 3.0; the
   point is that a 2.1.x program either runs or verify tells it why not.
4. **3.1** is where new work resumes, including #108 item 3 (focus
   preservation across mount), #121 (muted text token), and the `core`
   entry's own quickstart.

No 2.2. A 2.2 would carry compatibility shims for the section 3 rows, and
shims are what made 2.x heavy.

---

## 7. Open decisions

Numbered so answers can be given inline.

1. **`text` to `label` everywhere, or keep `text` for items and `label`
   for controls?** The spec proposes one word. The cost is every nav,
   breadcrumb, dropdown and list-group call site in three consumer apps.
2. **Throw on unresolvable target for `patch` too, or only for the four
   mounting verbs?** `patch` is called in hot paths with ids that may not
   be mounted yet; some callers may rely on the no-op.
3. **Does `lean` keep the four core factories?** The engine-cuts plan says
   yes (a device wants a table). This spec agrees. Confirm.
4. **Palette surfaces as objects?** Needs a count of affected call sites in
   pages/, examples/, and the three consumer apps before deciding.
5. **Where does the utility sheet live when `core` is loaded alone?** As
   part of `bccl` (every widget page wants it) or as its own file so an
   own-design page can take it without widgets. The spec leans to its own
   file plus inclusion in `bccl`.
6. **Spec licence and location.** In the repo under docs/, or a separate
   `deftio/taco-spec` repo so a second implementer can cite it without
   pulling a runtime? The spec text says docs/ for now; a separate repo
   is a later move with no cost.
7. **3.0 date.** After the embedded and AG-UI articles have been out long
   enough to bring their readers in on 2.1.x, so that 3.0 arrives with
   verify able to move them, not before.

---

## 8. Measurements to take before 3.0 is scheduled

- Rerun the source-map attribution on 2.1.14's full and lean ESM to fix the
  per-entry targets in the section 2.2 table.
- Count `text:` prop uses per factory across pages/, examples/, docs/ and
  the three consumer apps, to size open decision 1.
- Count `bw.append(` / `bw.replace(` call sites that test the return value.
- Count palette string-shape accesses (`palette.surface`,
  `palette.background`, `palette.surfaceAlt`) for open decision 4.
- Build the widget sheet in the three-layer shape on a branch and measure
  BCCL gz before and after, so the composition claim has a number.
- Time a cold `import { mount } from 'bitwrench/core'` in a bundler to
  confirm the tree-shaking actually drops what the table says it drops.

---

## 9. Related documents

- `docs/bitwrench-northstar-principles.md`: the rules this spec applies.
- `dev/bw-lean-engine-cuts-plan.md`: the attribution and the two cuts.
- `dev/bw-css-split-plan.md`: how the widget sheet left core in 2.1.14.
- `dev/bw-embedded-release-plan-2.1.x.md` and
  `dev/embedded-tutorial-2.1.x.md`: the docs push that comes first.
- `dev/bitwrench_agui_a2ui_feedback.md`: the mapping that becomes a
  spec-to-spec mapping.
- Issues #108 (core build, focus preservation), #127 item 2 (throwing
  verbs), #121 (palette token).
