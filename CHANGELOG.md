# Changelog

All notable changes to bitwrench are documented here.
Versions correspond to git tags and npm releases.

## v2.1.14 (2026-11-07)

The lean build gets lean. Through 2.1.13 `bitwrench-lean` carried the full
component stylesheet -- 132 `bw_bccl_*` class names in CSS -- with no factories
to use it. The widget rules now live in `src/bitwrench-bccl-styles.js` and ship
with the factories; core keeps the reset, typography, role colours, utilities,
grid, tables and bar chart. Measured on the shipped level-9 `.gz`:

| Artifact | 2.1.13 | 2.1.14 |
|---|---|---|
| `bitwrench-lean.umd.min.js` | 36,995 | 29,941 |
| `bitwrench-lean.esm.min.js` | 36,783 | 29,735 |
| `bitwrench-bccl.umd.min.js` | 11,398 | 19,782 |
| `bitwrench.umd.min.js` | 47,387 | 47,944 |
| `bitwrench.esm.min.js` | 47,527 | 48,083 |

Of the full build's growth, the install glue and the pager rules are about
320 bytes, the attribute serialiser (#124, below) about 180, and the two
dispatch fixes (#128, #129) about 40 together. The ESM file is 45 bytes under
the 47 KB gate. The next change to the engine has to take bytes out first;
`dev/bw-lean-engine-cuts-plan.md` is where.

Lean is 20% smaller. The full file grows by the install glue and the pager
rules, about 320 bytes, and stays under its 47 KB gate with roughly 270 bytes
to spare on the ESM side. Lean gets a gate of its own, 30 KB, in
`tools/release.js`.

### Changed

- **Widget CSS ships with the factories.** `bw.loadStyles()` is still the one
  call. In the full build nothing changes for the page. On lean, `loadStyles()`
  emits no `.bw_bccl_btn`, `.bw_bccl_card` or `.bw_bccl_modal` rules; loading
  `bitwrench-bccl.umd.min.js` after lean (or `registerBCCL(bw)` in ESM) installs
  the sheet along with the factories, and a `loadStyles()` called after both
  emits everything. Order matters: lean, then BCCL, then `loadStyles()`. A
  `loadStyles()` that ran before the BCCL script does not pick up widget
  structure later. This answers the jazzmac item "makeTooltip reachable from
  lean" (#108): lean plus BCCL is the full build in two files.
- The lean build still styles everything it emits. The table pager uses the
  button classes, so the tables category carries a pager-scoped copy of the
  small-button rules; full and lean render the pager identically. A test
  renders the four core factories and checks every class they emit against
  the core sheet alone.
- `bitwrench-styles.js`: `generateThemedCSS`, `getStructuralStyles` and
  `generateAlternateCSS` take an optional `sheets` argument. `defaultStyles`
  no longer has the widget categories (`buttons`, `cards`, `modal`, ...); they
  are `bcclStructural()` in `bitwrench-bccl-styles.js`. The rule order of the
  one file is kept: widget structure before the utilities, widget themed rules
  before the role classes, so nothing resolves differently on a page.
- Docs: the README, quickstart, core API card, `llms.txt` and the lean entry's
  header describe lean as the engine, reset, utilities, grid, tables and bar
  chart, with no component CSS, and give the lean-then-BCCL order. The
  unminified debug builds no longer have a size quoted in prose; it moves every
  release and cost two rebuild cycles in 2.1.13. `dist/builds.json` is the
  reference.

### Fixed

Four from the quikleaf and Timeify ports, each landed as a rule over the set
rather than a patch to the one case that was reported.

- **Attribute booleans are one rule across every sink** (#124). `bw.html()`
  and `bw.create()` treated every boolean as an HTML boolean attribute, so
  `'aria-pressed': true` rendered `aria-pressed=""` (invalid; assistive tech
  reads it as unset) and `'aria-expanded': false`, the meaningful state,
  disappeared. `bw.patch()` with an attribute object went the other way and
  wrote `hidden="false"`. The serialiser is now one function, `_attrValue`:
  presence for HTML booleans (`disabled`, `hidden`, `required`), the word for
  ARIA states and the enumerated `draggable`, `contenteditable`, `spellcheck`,
  `yes`/`no` for `translate`; in `patch`, `false` and `null` remove the
  attribute. A vocabulary matrix renders the same attribute set through all
  three sinks and asserts identical attribute maps, and a meta test fails if a
  sink grows an inline boolean branch again. North star consequence 14 names
  the serialiser alongside the resolver and the sink.
- **`verify` no longer flags the SVG path attribute `d` as a typo of `id`**
  (#126). The real-attribute list was HTML-only; `d` is one deletion from
  `id`, so every `<path>` drew a warning (83 of 83 findings on one app). The
  short SVG geometry, filter and animation names (`d`, `r`, `cx`, `x1`, `fr`,
  `in`, `k1`..`k4`, `values`, `points`, ...) are real attributes now. A hint is
  only ever offered for a name within one edit of a special one, so longer
  names (`fill`, `viewBox`, `transform`) never needed listing; the test sweeps
  the whole surface to prove it, and the verify module stays under its 7 KB.
- **`makeFormGroup` writes `id` onto a labelable control only** (#127, item
  1). 2.1.13 copied the group's `id` onto whatever TACO was passed as `input`,
  so a wrapper div holding the control shared its id and the label's `for`
  pointed at a div. The id lands on `input`, `select`, `textarea`, `button`,
  `meter`, `output` or `progress` without one of their own; a wrapper is never
  written to. Item 2, a throwing form of `append`/`replace`, is a 3.x
  question; 2.x keeps warn-and-null.
- **`syncChildren` delivers kept rows to their `update` handle** (#128). The
  handle named `update` is the dispatch target of `bw.update(ref, data)`; the
  list form of the same idea did not honour it, so a kept row with an update
  handle was moved and showed its old data unless the caller wrote
  `update: (el, it) => el.bw.update(it)` by hand. Without `opts.update` the
  row's own handle now receives the item; an explicit function still wins; a
  row with neither is only moved, as before. A list of components is `key`
  and `create`, and each row decides what to patch.
- **The content sink skips the write when the string is unchanged** (#129).
  Slot setters, `bw.patch(ref, string)` and `bw.el(ref, apply)` share
  `_applyTo`, so one check covers all: when the target holds a single text
  node whose data equals the new string, nothing is touched. A naive update
  handle that sets every slot on every tick costs nothing, and a selection
  inside the slot survives. Only the identical string short-circuits; TACO and
  array content always replace.
- **`bwcli attach /screenshot` names its failure** (#125, item 2). The capture
  error did reach the REPL, as a bare `[error] ...` line that read like a
  relayed console message. It now prints `Screenshot failed: <message>` and,
  when html2canvas rejects a colour function, says that the bundled 1.4.1
  cannot parse CSS Color 4 (`color-mix()`, `oklch()`, `color()`,
  `light-dark()`). `docs/bw-attach.md` and `docs/bwserve.md` state the limit.
  Replacing the capturer (item 1) is separate work with #80.

### Tests

- `test/bitwrench_test_css_split.js`: the lean path from the full source (no
  sheet installed, then installed, then installed twice), both palettes, the
  merged small-screen media block, rule order, and the core-factory invariant.
- Bundle tests on the shipped files: lean emits no widget rule, lean + BCCL
  ESM and UMD register the sheet once, the BCCL artifact carries the sheet
  and not the engine, the full build is unchanged.
- `tools/build-css-class-inventory.js` walks the widget sheet as well.
- Vocabulary matrix D: attribute booleans through `bw.html`, `bw.create`,
  `bw.patch(ref, attrs)` and `bw.patch(ref, value, attr)`, plus the meta check
  on the source. `verify`: the SVG attribute sweep and a real typo inside an
  svg still firing. `makeFormGroup`: bare control, select/textarea, wrapper
  div untouched with one `id` in the rendered page, caller TACO not mutated.
  attach: the `Screenshot failed:` line and the CSS Color 4 note. Matrix E:
  syncChildren with and without `opts.update`, rows with no handle, and
  `bw.update` reaching the same handle. Matrix F: the unchanged-string
  short-circuit through a slot setter and `bw.patch`, TACO and array content
  still replacing, and the clear-once cases.

## v2.1.13 (2026-11-07)

API consistency and stability. Three consumer apps (triops, jazzmac, quikleaf)
each filed a batch of bugs with the same shape: no single function wrong, but
siblings that the docs said obey one rule did not. This release fixes the
class of defect, not the instances, and adds the matrix tests that make the
rule enforceable (`test/bitwrench_test_vocabulary.js`: every verb x every
target form, every content sink x every content form, every factory x the
factory contract). Plan: `dev/bw-2.1.13-plan.md`. North star: new consequences
14 (one vocabulary for callers) and 15 (types and docs describe the runtime),
and the factory contract under "BCCL".

### Fixed

- **`false` and `true` in content rendered as the words "false" and "true"**
  (#123). Both `bw.html()` and `bw.create()` stringified booleans, while
  three docs said they were skipped, so `c: [header, isAdmin && panel]` printed
  "false" whenever the condition was off. Booleans now render nothing on both
  paths and in every content sink (`patch`, slot setters, `bw.el`/`bw.$`
  apply); numbers, including `0`, still render. Found during the Timeify
  migration.
- **One target rule for every verb** (#112). `bw.replace('some-id', taco)`
  created the new element and never inserted it: it read `.parentNode` of a
  string and returned a detached node with no warning. Every verb that takes a
  target now resolves it through one internal resolver (live query first,
  `bw.el` second, the order `mount` already documented): `replace`, `refresh`,
  `update`, `updateSlot`, `patch`, `clear`, `remove`, `emit`, `on`, `message`,
  `inspect`, `render`, and the phase verbs `unmount`, `unmountChildren`,
  `mountTree`, `hydrate`, `detach`, `syncChildren` all accept a live element,
  an element id, a CSS selector, or a `bw_uuid_*` token. A verb that acts on
  one target and cannot find it warns `bw.<verb>: target not found` and
  returns null; `bw.patch`, `bw.remove`, `bw.refresh`, `bw.update`, `bw.emit`
  and `bw.on` used to return silently. Queries (`bw.el`, `bw.$`, `bw.hasClass`,
  `bw.inspect`) and the class verbs stay silent on a miss.
- (carried from 2.1.12, which shipped it without a line) **`bw.append` accepted
  a bare element id** from 2.1.12 on. Before that it resolved the string with a
  plain selector query, so `bw.append('status', taco)` returned `null` with no
  warning (reported in #112).
- **One content sink** (#118). Slot setters (`el.bw.setBody(v)`,
  `bw.updateSlot`) rendered `"[object Object]"` for `bw.raw()` and for arrays;
  they had their own narrower switch. The setter and `bw.patch` now delegate to
  the same sink `bw.el(ref, content)` and `bw.$(sel, content)` use, so text, a
  TACO, an array (nested arrays flattened), `bw.raw()`, a function, and `null`
  (renders empty, not `"null"`) behave identically in all five places. The
  same defect was fixed independently in PR #122 by Shahid Shamim Shah
  (imshah-id), bitwrench's first outside contribution; the release carries the
  shared sink together with that PR's tests and documentation. One of those
  tests caught a regression in the sink: it had dropped the 2.1.12 slot
  setter's `isConnected` guard, so content applied to a component not yet in
  the document fired `mounted` early. The guard is now in the sink, so
  `patch`, `bw.el`/`bw.$` apply and slots all defer hooks until the tree is
  mounted.
- **BCCL config types describe the factories** (#114). `ModalConfig`,
  `ButtonConfig`, `CardConfig`, `InputConfig`, `TableConfig`, `NavConfig`,
  `TabsConfig`, `AccordionConfig`, `AlertConfig` and `CarouselConfig` declared
  props the factories never read (`closable`, `clickable`, `outline`, `block`,
  `label`, `indicators`) and omitted ones they do (`closeButton`, `onClose`,
  `open`, `subtitle`, `header`, `readonly`, `action`, `pageSize`, ...). All ten
  are rewritten from the factories' destructuring patterns, and a new
  drift-lint rule `bccl-config-drift` fails the release when they disagree
  again, in either direction. `StyleConfig` loses `palette` and `compact`
  (read nowhere) and gains `harmonize`, `fontSize` and `alternate`;
  `surfaceAlt`, declared for releases, is now actually honoured by
  `derivePalette`. `bw.patch` is typed for its attribute-map and function
  forms; `bw.append` and `bw.replace` return `HTMLElement | null`.
- **`makeInput({ class })` no longer erases `bw_bccl_form_control`** (#114).
  `class` fell through the form controls' rest spread and replaced the
  component class. It is now a read prop on every factory and merges.
- **bwcli attach `/tree` printed `?`** (#116). The server resolved every
  pending promise with the whole POST envelope `{requestId, route, result,
  error}`; `screenshot()` unwrapped it, `/tree` did not. The server now
  unwraps once (`_resolvePending(requestId, result, error)`), resolves with
  the client's result and rejects with its error, for every caller including
  `client.query()`, the MCP `inspect_dom` tool and `bwcli serve`. The class
  field of `bw.inspect()` is `class` (it was `classes`; the client fallback
  walk said `cls`); `printTree` reads the old spellings for one release.
  Tested as a round trip: real `bw.inspect()` output, real HTTP return route,
  real printer.
- **bwcli attach `/screenshot` failed cross-origin** (#117). The html2canvas
  loader defaulted to a page-relative `/bw/lib/vendor/...` URL while every
  other client URL was prefixed with the server origin. It now uses the same
  `base` as `respond()`; a test asserts the generated client script contains no
  page-relative `/bw/` URL.
- **Alternate palette for a mid-lightness accent** (#115).
  `deriveAlternateSeed` inverted lightness literally, so indigo `#6366f1`
  (L 67) became `#111366` (L 23) on a `#202027` background, contrast 1.0:1.
  A saturated mid-lightness seed (50 < L <= 75, S > 40) now becomes a lighter
  tint of the same hue (L 72), the convention every design system's dark mode
  uses: `#6366f1` -> `#8284ed`, contrast 5.0:1. This changes the derived dark
  palette of 14 role/preset pairs across the built-in presets (sunset, forest,
  rose, indigo, amber, emerald, nord, coral), every one from a contrast
  between 1.1 and 4.2 to between 5.2 and 10.7. Low-saturation and very light
  or dark seeds derive as before.
- **`makeDataTable` and `makePagination` put the caller's class on the root.**
  DataTable forwarded it to the inner `<table>`, Pagination to the inner
  `<ul>`; the factory contract says the root. Style selectors that relied on
  the inner placement need `.bw_bccl_table` / `.bw_bccl_pagination` instead.

### Added

- **Every factory takes `id` and `class`** (#113). 7 of 51 factories read
  `id`; `makeButton({ id })` warned and dropped it. All 51 now take `id` (on
  the root, or on the `<input>` of a labelled form control, where the label's
  `for` points) and `class`, merged with the component's own classes. The
  prop is `class`, the HTML attribute name and the same key as TACO
  `a.class`, so a TACO's `a` and a factory's props spread into each other
  with no translation. **`className` is deprecated**: still accepted on every
  factory and `bw.codeEditor`, warns once per factory, removed in a later
  minor. The .d.ts exports `FactoryProps` (`id`, `class`, `className`) and
  every `*Config` extends it.
- **`alternate` seeds in the style config** (#115): `bw.loadStyles({ primary,
  alternate: { primary: '#818cf8', background: '#0f1419' } })`. Any key given
  overrides the derived alternate seed; the rest derive. Same keys as the top
  level.
- **`color-scheme` on every theme** (#120). The generated `body` and scope-root
  rules declare `color-scheme: light` or `dark`, judged on the palette's
  background, for both palettes. Native parts (`<select>` popups, scrollbars,
  date and number spinners, autofill) follow a dark theme instead of staying
  light.
- **`bw.makeButton({ toggle: true, pressed, onToggle })`** (#119). A
  press-to-stay-on button: `aria-pressed` carries the state, clicking flips it
  and calls `onToggle(pressed, e)` then `onclick`, the root gets
  `bw_bccl_btn_toggle`, and the palette styles `[aria-pressed="true"]` (text
  colour on page background, which reads in both palettes). Code that is not
  the click handler drives it through the component: `el.bw.setPressed(on)`
  or `bw.message(id, 'setPressed', true)`; read it back from `aria-pressed`.
- **`bw.contrastRatio(a, b)`** (#121): WCAG contrast ratio between two colours,
  1 to 21. `makeStyles` uses it for its existing seed-contrast check.

### Changed

- `bw.unmount`, `bw.unmountChildren`, `bw.mountTree`, `bw.hydrate`,
  `bw.detach` and `bw.syncChildren` accept a target string (id, selector,
  UUID token) as well as an element. Passing `null` is still a silent no-op.
- `bw.patch(id, fn)` calls `fn(el)`, like `bw.el(id, fn)`.
- The unknown-option warning no longer lists `className` among accepted keys.
- bwcli attach `/render` sends `mount` (the `render` verb has been a
  deprecated alias since 2.1.x).
- Docs: `docs/core-api.md` states the one-vocabulary rule once for every
  verb; `theming.md` describes the alternate derivation and the `alternate`
  seeds; `state-management.md` and the cheatsheet list what slot setters
  accept; `component-library.md`, `bitwrench_api.md` and the pages use
  `class`.
- **Docs: the model first, then the reference.** Three consumer apps
  re-implemented eight things the library ships; the docs were indexed by
  function and did not say how bitwrench's model differs from the one the
  code was written in. `docs/thinking-in-bitwrench.md` now opens with how
  bitwrench works, then how that compares with three common starting points
  (React, vanilla JS, server templates), what one decision buys (server
  rendering, CSS as data, schemable UI, no build chain), and the five concepts
  the audited apps missed. The quickstart gains a "How bitwrench works"
  section and a table of ten calls that already exist. New
  `docs/when-you-want.md`: the core API indexed by problem, 33 running
  examples. `agents.md` and `llms.txt` open by pointing at
  thinking-in-bitwrench, with the audit as the reason, and gain a table of the
  optional helpers (`bwcli`, `bwcli attach`, `verify`, `drift-lint`, `bwmcp`,
  `bitwrench-debug`, `util-css`, `util-color`, `code-edit`) with their docs.
- Bundle budget raised from 46 KB to 47 KB (level-9 gzip of the shipped UMD
  and ESM). The bytes are the `id`/`class` contract on 44 factories, the
  resolver and sink, the toggle button, `alternate` seeds and `color-scheme`.
  Reason on record in `tools/release.js`; the lean build is where the next
  size work goes.
- `bw.on` JSDoc says what it returns: the function that removes the listener
  (it has done so since 2.1).

### Tests

- `test/bitwrench_test_vocabulary.js`: 361 tests. A meta test reads every
  `bw.*` verb whose first JSDoc parameter is a target out of the source and
  fails if it is in neither the matrix nor the exemption list with a reason, so
  a new verb cannot opt out. 29 verbs x 5 target forms plus miss behaviour;
  5 sinks x 9 content forms plus unmount-hook behaviour; 51 factories x
  (`class` merges, `className` warns exactly once, `id` lands once).
- Wire round trips in `test/bitwrench_test_attach.js`: real `bw.inspect()`
  tree through the real `/bw/return` route into `printTree`; error envelope
  rejects; no page-relative `/bw/` URL in the generated client.
- drift-lint `bccl-config-drift` (release gate).
- Doc examples: seven more files run in `test/bitwrench_test_doc_examples.js`
  (both tutorials, `bwserve.md`, `cli.md`, the TypeScript and WASM guides,
  `when-you-want.md`), 507 blocks in all. The harness now ignores a mount
  inside a `//` comment and supplies the real bwserve client method names, so
  a doc calling a method the client lacks fails. One `bwserve.md` block that
  mixed bare literals with statements is now runnable.
- Coverage: 99.44% of statements and lines, 98.32% of branches, with 4420
  tests passing (4050 at 2.1.12; the matrix suite is 361 of the new ones).

## v2.1.12 (2026-10-31)

Verification tooling, and the type drift it found on day one.

### Added

- **`bwcli verify` -- the CLI door of the checker.** Verify was specified as one
  checker with two doors (`dev/bw-verify-design.md` section 9): a JavaScript
  sender imports the library, and anything else -- a C++ or Python generator, a
  shell pipeline, a CI job -- pipes a payload at the CLI. Only the library door
  existed. Now both do.

  `bwcli verify <file>`, or stdin when no file is given. **Wire mode by
  default**, because a file or a pipe is a payload that has already crossed
  JSON, where the library defaults to authored because the caller is holding
  JavaScript. Flags: `--authored`, `--strict`, `--ignore <codes>`, `--json`,
  `-q`. It accepts one JSON document, newline-delimited frames (reported with
  their index), or the `r`-prefixed relaxed form the embedded senders emit.

  Exit codes, so CI can branch: **0** nothing fatal, **1** an error (or a
  warning under `--strict`), **2** unreadable or unparseable input. This needed
  a fix in `bin/bwcli.js`, which discarded `run()`'s return value -- every
  subcommand exited 0 regardless, which would have made the checker useless in
  a pipeline. It now propagates via `process.exitCode` rather than
  `process.exit()`, so a finding cannot be truncated before it is flushed.

  17 tests drive the real binary, including a parity test asserting the CLI and
  the library report the same findings for the same payload -- the design's
  central claim is that the CLI does not grow its own rules.

  One thing the CLI surfaces that the library could not: `bw.parseJSONFlex`
  relaxes quotes and trailing commas but **not keys**, so `r{'t':'p'}` parses
  and `r{t:'p'}` does not. The bare JSON error did not explain that, so the CLI
  does, and it also spots a relaxed payload that arrived without its `r`
  prefix.

- **`bitwrench-verify` ships as its own artifact.** Until now the checker
  existed only as `src/bitwrench-verify.js` with no build target, so nothing
  could load it. It is now built and exported as `bitwrench/verify`, with three
  entry points: ESM (`import verify from 'bitwrench/verify'`), CJS
  (`const { verify } = require('bitwrench/verify')` -- destructured, the CJS
  output is `{ default, verify }` and is not itself callable), and a script tag
  (`dist/bitwrench-verify.min.js`, loaded after bitwrench, global `bwv`). Also
  on the CDN: `https://cdn.jsdelivr.net/npm/bitwrench@2/dist/bitwrench-verify.min.js`.
  Five bundles plus `bitwrench-verify.d.ts`; the minified UMD is under 7 KB raw and
  under 3 KB gzipped. It is deliberately **not** bundled into core and sits outside
  the 46 KB core budget -- a development-time tool that never runs in
  production, and a bundle test asserts it never leaks into the core build.
  `verify(input, opts)` returns an array of findings and never throws;
  `verify.assert(input, opts)` throws, for tests. Guide: `docs/verify.md`.

### Fixed

- **Supplying both `o.render` and `o.mounted` silently rendered nothing.**
  There is one `_bw_mounted_fn` slot, and `o.mounted` claimed it, so the
  initial render never ran: the component mounted empty, with no warning and
  no diagnostic. The quickstart's own flagship example was built this way, as
  were five more in `docs/state-management.md` -- all of them documented as
  "render() is called once at mount". When both are present the slot now runs
  render first, then mounted, so the hook observes the DOM render produced
  (`mounted` commonly measures or wires up that content). Nothing can have
  depended on the old behaviour, because the old behaviour was a no-op.
  Seven tests cover the pair, the two single-hook paths, argument identity,
  the throwing case and once-per-identity; five of them fail if the fix is
  reverted.
- **Every MCP live render was dropped on the client.** `src/mcp/live.js`
  broadcast the v2.0 wire shape -- `{type:'replace', target, node}`, and
  `patch` with `content`/`attr` -- long after `bw.apply` moved to v:1, which
  names those fields `ref`/`taco` and `text`/`attrs`. `bw.apply` rejects any
  message carrying `target` or `node` outright: it publishes `wire_rejected`
  and returns false. So `render_live`'s replace, append, patch and remove all
  failed silently, and `docs/bitwrench-mcp.md` documented behaviour that could
  not happen. The MCP suite had five test files and every one of them asserted
  only that the handler had been called. Fixed, and
  `test/bitwrench_test_mcp_wire.js` now asserts the boundary itself: each
  frame the server can emit is fed through `bw.apply` and must both return
  true and change the DOM, the same way the C/C++ suite feeds C output
  through `bw.parseJSONFlex`.
- **`bw.unmount()` was documented as removing the element.** It fires
  `o.unmount` and tears down subscriptions but leaves the node in the DOM;
  only `bw.remove()` removes it. Wrong in `agents.md` twice and `llms.txt`
  once -- the three files agents read first -- so generated code leaked orphan
  nodes. Corrected, and `bw.remove` added to the agents.md API table, where it
  was missing entirely.

- **`bw.router` rendered every view twice in hash mode (reported by jazzmac).**
  `navigate()` set `location.hash` -- which queues a `hashchange` -- and then
  re-read `location.hash` to decide whether to render by hand. The re-read
  always matched the path just assigned, so each navigation rendered once
  immediately and once when the queued event arrived. An app that builds state
  in a route handler built it twice, the second time from different inputs.

  The guard existed for the opposite case: navigating to the route you are
  already on fires no `hashchange`, so without a manual call nothing renders.
  Both cases now render exactly once, and `navigate()` stays **synchronous** --
  the first attempt at this fix let the event do the rendering, which removed
  the duplicate but broke twelve existing tests that read the DOM on the line
  after `navigate()`. Instead the render happens immediately as before and the
  `hashchange` it causes is recognised and skipped.
- **`bw.mount` was the only target-taking verb that rejected a bare element id
  (reported by jazzmac).** `bw.el`, `bw.patch`, `bw.toggleClass` and `bw.clear`
  all accept `'status'`; `bw.mount('status')` warned "target not found" because
  it resolved with a plain selector query. One rule for the caller now: any
  form `bw.el` takes, `mount` (and `bw.DOM`) takes.

  Resolution order is a live query first, `bw.el` second, deliberately: `bw.el`
  consults a node cache that can return a **detached** element, and mounting
  into a node the document cannot see renders content nobody can find. Putting
  `bw.el` first broke a documented example in exactly that way, so selectors
  behave as they always have and bare ids fall through.
- **`TacoOptions` declared two options the renderer never read.**
  `src/bitwrench.d.ts` listed `o.userTag` and `o.events` alongside the seven
  keys that do work, so TypeScript certified both -- write
  `o: { events: { save: fn } }` and you got no error, no warning and no
  handler. `userTag` outlived ComponentHandle, removed in 2.0.19 (`bw.message()`
  addresses elements through `bw.el()` and a class-token fallback, never a
  tag); `events` was a declarative-handler idea that was never wired. Both
  removed. The keys the renderer actually consults are `state`, `mounted`,
  `unmount`, `render`, `handle`, `slots` and `type` -- seven, from `hasOpts`
  and `hasLifecycle`.

  Nothing can break: no working code could have depended on an option that did
  nothing. Use `a: { onclick: fn }` or a `bw_act_*` class with `bw.actions`
  instead of `o.events`.
- Two stale JSDoc references in `src/bwserve/client.js` pointed at the same
  removed concepts ("Component userTag or UUID", "from o.events declarative
  handler").

- **`src/bitwrench-utils.js` carried a third, unreachable copy of
  `colorInterp`.** `bitwrench.js` imports `colorInterp` from
  `bitwrench-color-utils.js` and deliberately omits it from its
  `bitwrench-utils.js` import list, so that copy was in no bundle and no test
  -- thirty lines of colour maths that could drift from the live one without
  anything noticing. It was an older variant that took `colorParse` as a sixth
  argument to dodge a circular import; the logic is otherwise identical.
  Removed, along with a superfluous `export` on `SPACING_SCALE`, which is an
  internal constant feeding `bw.SPACING_PRESETS` and was never imported
  anywhere. Found by chasing a coverage hole, so there is now a check for it
  (below).
- **`docs/bitwrench_api.md` documented a `bw.colorInterp` that does not
  exist.** The dead copy above was the *documented* one, so the generator read
  its JSDoc and published the signature
  `bw.colorInterp(x, in0, in1, colors, stretch, colorParseFn)` -- a sixth
  argument the real function has never accepted. Anyone following the reference
  passed a parse function that was silently ignored. The live implementation in
  `bitwrench-color-utils.js` had no JSDoc at all; it now does, and the
  reference shows the real five-parameter signature. `drift-lint` reported this
  the moment the dead copy was deleted, which is the rule working as intended.
- **`import { makeCard } from 'bitwrench/bccl'` was `undefined` for every
  factory.** `src/bitwrench-bccl-entry.js` said "re-export all components"
  above a line that re-exported three names (`BCCL`, `make`, `variantClass`),
  so the named form -- the one `docs/llm-bitwrench-guide.md` teaches -- gave
  `undefined` for all 48 `make*` functions on the ESM and CJS paths. The UMD
  path never noticed, because `registerBCCL()` copies them onto the global
  `bw`. Now `export *`. This is a nicer spelling, not a smaller build: the
  artifact is one pre-bundled scope, so importing one factory costs what
  importing all of them costs (see Bundle size, below).
- **A throw from `o.render` on first mount was reported as an `o.mounted`
  error.** Since render and mounted share the mount slot (above), both
  arrived at the same catch, which named the wrong hook and published
  `mounted_hook_error` for a render failure -- while `bw.refresh()` let the
  same render throw under its own name, so one function failed two different
  ways depending on whether it was the first mount or a later refresh. The
  console line now says `o.render error`, and `bw:diag` carries
  `code: 'render_hook_error'` plus a `hook` field (`'render'` or `'mounted'`)
  on both codes, so a subscriber can branch without parsing the message.

### Tests

Overall coverage 97.97% -> 99.46% of statements and lines, 98.38% of branches,
with 4050 tests passing. The gaps were missing cases, not missing padding:

- **`bitwrench-debug.js` 0% -> 100%** of statements, lines and functions (41
  tests, up from 19). Credit for the existing tests came back with the
  `sourceURL` fix below; the new ones cover what was genuinely untested -- the
  delegated handler `bwd.listen()` installs (its whole point, and it had never
  been fired), the full `bwd.screenshot()` pipeline against a stubbed
  html2canvas including the download-link fallback and the failure path, both
  CDN loads settled by hand, and the `console.table` fallback.
- **`bitwrench-util-color.js` branches 81% -> 97.5%.** This is a published
  entry point (`bitwrench/util-color`) and its edge cases were untested: the
  array forms of both converters and their alpha defaults, the hue wheel at
  every 30 degrees (which is what exercises all four `hue2rgb` segments and
  both sides of the lightness split), zero channels in `rgb()`/`hsl()` where
  `|| 0` could swallow a real 0, and auto-install onto an existing `window.bw`.
- **`bitwrench-verify.js` branches 93.5% -> 98.3%.** Two of the four
  raw-content safety patterns had no fixture at all -- `srcdoc=` and
  `<script>` were never matched, so either regex could have been wrong
  silently. Also added: the exotic primitives the renderer stringifies
  (boolean, number, bigint, symbol -- all measured against `bw.html` first),
  `o: null` and `o: undefined`, an empty object, a key too far from any TACO
  key to suggest a fix, and all three `verify.assert` message shapes.
- **`bitwrench-utils.js` 96.1% -> 100%**, by deleting the unreachable
  `colorInterp` and widening a `c8 ignore next` that covered only the first
  line of a four-line guard.

- **Every page and example app now loads in a real browser in CI**
  (`tests/pages-smoke.spec.js`, Playwright). It auto-discovers `pages/*.html`
  and every `examples/*/index.html` that loads bitwrench from `dist/`, fails on
  any console error or page error, checks that every relative link between
  pages resolves, and exercises the API reference search. It also dogfoods
  verify: `bw.create` is wrapped so every TACO a page or example actually
  renders is run through the checker, and an `error` finding fails the test
  (plan item B11 -- if it finds nothing, the checks are too weak). Its first
  run caught eight calls on `pages/20-embedded.html` that passed an object to
  a helper taking four positional arguments; none of the four doc audits had
  seen them, because nothing had ever loaded the pages.

What remains uncovered in these files is unreachable: `typeof window` and
`!el` guards, and private defaults no caller can omit.

### Docs

- **`docs/routing.md` now shows the shape most views end up with** (reported by
  jazzmac): subscribe inside `o.mounted`, passing the element as `bw.sub`'s
  third argument so the subscription is torn down when the route changes. The
  doc previously showed only global `bw.sub('bw:route', ...)` handlers. The
  example runs in CI, and the note names the common mistake -- omitting that
  third argument leaves stale subscribers writing to elements that are gone.

### Bundle size

- **Test-only helpers no longer ship.** `bw._resetForTest` (~0.7KB minified)
  and `bw._propWarnReset` were in every bundle; the suite imports from `src/`,
  so nothing at runtime needed either. `rollup.config.js` gained a
  `stripTestOnly()` transform that blanks `/* @bw-test-only start|end */`
  regions -- blanks rather than deletes, newlines included, so following lines
  keep their position and the sourcemaps stay correct. **-174 bytes gzipped on
  UMD, -206 on ESM.** Three helpers that look test-only are read by production
  code and stay: `__monkey_patch_is_nodejs__` (`_isBrowser`),
  `_FUNC_REGISTRY_SHIM` (`htmlPage`) and `_compiledExprs` (the binding
  compiler's cache).
- **Four stale `export function` declarations removed from
  `src/bitwrench.d.ts`.** `makeTable`, `makeTableFromArray`, `makeDataTable`
  and `makeBarChart` live on `bw` rather than in `bitwrench-bccl.js`, so
  `export *` never picked them up and `import { makeTable } from 'bitwrench'`
  type-checked and returned `undefined`. They were briefly added as real named
  exports; measurement said otherwise, so the declarations came out instead.
  They remain on the `Bitwrench` interface, so `bw.makeTable(...)` is typed as
  before. Nothing that worked stops working.

  Why not export them: re-measured with rollup, `import { makeButton }` from
  `dist/bitwrench.esm.js` produces **479,861 bytes** against **479,853** for
  `import bw` -- one component costs 8 bytes *more* than the whole library. The
  ESM artifact is a single pre-bundled file with no `output.preserveModules`,
  so a bundler cannot drop modules sharing one scope. The named-export list
  costs ~346 gzipped bytes for a feature that does not function. Removing the
  other 49 is a breaking change to `import { makeCard }` and belongs in a
  major. Recorded in `dev/bitwrench-2.1.6-size-opt-findings.md` section 7.
- Both gated bundles stay under the 46KB ceiling, measured the way the gate
  measures: the shipped level-9 `.gz`, not a level-6 re-compression. Exact byte
  counts are deliberately not quoted here -- `src/version.js` embeds a build
  date, so every rebuild moves them and a number in prose is stale within the
  hour. `dist/builds.json` now reports the same figure the gate reads, so there
  is one source for it instead of three.
- **ESM headroom is thin: around 100 bytes.** That is fine for a release that
  kept verify out of core, and it is not fine to forget before 2.1.13 adds
  anything to `src/bitwrench.js`.

### Tooling: catch it next time

Found by review, not by any check -- so the check now exists.

- **drift-lint rule `taco-options-drift`** compares the `TacoOptions` keys in
  `src/bitwrench.d.ts` against the keys the renderer reads (`opts.x` / `o.x` in
  `src/bitwrench.js`) and fails the build on a disagreement, naming the line.
  The renderer is the source of truth; the types are checked against it, never
  the reverse. Verified by re-introducing both keys and confirming the rule
  reports them.
- **`npm run ci:local`** runs GitHub's CI job locally -- `npm ci
  --ignore-scripts`, lint, build, test -- on Linux with gcc across the Node 22
  and 24 matrix, with the repo mounted read-only so a container-side build
  cannot touch your tree. **`npm run test:gcc`** is the fast subset for the
  C/C++ suite and is now a gate inside `tools/release.js`.

  v2.1.11 was merged to main on a green local run and failed GitHub CI three
  times over, because macOS ships clang and CI runs gcc: clang does not
  implement `-Wformat-truncation`, so nesting a same-sized buffer passed
  locally and was correctly rejected in CI. A local run that does not use the
  CI toolchain is a guess, not a check.
- **Four strictness tests** (`test/bitwrench_test_embedded_c.js`) encode what
  only a strict Linux toolchain enforces: headers compile standalone with no
  nested comments, a nesting destination must be larger than its source, every
  documented buffer example builds under `-Wall -Wextra -Werror`, and no
  side-effecting call sits in a `printf()` argument list (evaluation order is
  unspecified in C). Under gcc all four run; on clang the truncation one skips,
  so the asymmetry is visible rather than invisible.
- **`stale-cdn-pin` no longer blocks a fresh branch.** It compared doc pins
  against `package.json`, but `start-release` bumps that before anything is
  published -- so it demanded a pin to a bundle that does not exist on the CDN
  and failed `npm run build` at the start of every cycle. It now accepts the
  current version or the newest released one, read from the newest dated
  CHANGELOG heading.
- `tools/release.js`: the final confirmation passed its prompt through the
  shell, so an apostrophe in the question aborted the release after every gate
  had passed. Prompts now travel by environment variable. It also detects a
  branch that was already squash-merged (where the merge base falls back to the
  previous release and every shared file conflicts), takes the branch tree with
  `git read-tree` instead, and restores main on failure rather than leaving a
  half-merge that `git merge --abort` cannot undo.
- `tools/start-release.js`: `patch` is now shown as an explicit example in both
  the docstring and the runtime help, with a note that the bump level is the
  first argument and passing the wrong one is silent.
- **`RELEASE-PROCEDURE.md` documented a process this repo does not use** and
  has now been rewritten against `tools/release.js`. It told maintainers to
  push the feature branch, hand-edit the version, commit the bump straight to
  `main`, and expect a tag job in `ci.yml` -- which has none -- on a Node
  20/22/24 matrix that is actually 22/24. It never named `start-release` or
  `release`, so following it bypassed all ten release gates. The rewrite lists
  the real ten steps, `--dry-run`, the squash requirement and the `pre-push`
  guard; `CONTRIBUTING.md` now points at it instead of describing a second,
  also-drifting copy. Two dead commands are gone from `CONTRIBUTING.md` as
  well (`npm run test:all`, `npm run build:index` -- neither script exists).
  Deliberately **not** added: an `engines` field. The Node 22.12 floor is a
  development requirement, and `engines` would warn browser consumers who
  never run the toolchain.
- **Meta test `no dead exports in src/`** resolves every `import`/`export ... from`
  in `src/`, `test/`, `tools/` and `bin/` to the module it points at, then
  reports any non-entry export that nothing pulls in. It credits a name only to
  the module it was imported **from**: the first version matched on the bare
  name and missed the very defect that prompted it, because two other modules
  also export a `colorInterp`. Entry points (rollup inputs, aliased modules,
  `package.json` `exports`/`bin`, and anything re-exported with `export *`) are
  exempt, so the rule needs no allowlist. Verified by re-introducing both dead
  exports and confirming each is named.
- **Coverage thresholds raised from 80% to a ratchet just under the current
  numbers** (`package.json`, `c8` block: statements and lines 99, branches 96,
  functions 95). They had sat at 80 while the suite ran at 99, so nineteen
  points of regression would have passed silently.
- **`bitwrench-debug.js` reported 0% coverage while being fully tested.** Its
  suite reads the source and runs it through `dom.window.eval`, which V8 cannot
  trace back to a file, so nineteen passing tests counted for nothing and the
  file looked like dead weight in every report. Appending a `//# sourceURL=`
  annotation to the eval'd text restores the attribution -- the same trick
  works for any source a test evals rather than imports.
- **`npm run review:northstar` (the audit-only LLM reviewer under
  `tools/northstar-llm/`) can now survive an overnight run.** It is a
  maintainer tool, never in CI or release, but a full pass is 89 files over a
  couple of hours against a local model, and a silent failure cost the whole
  night. It gained a failure ladder (transport errors, 429 and 5xx retry with
  2s/8s/30s backoff; other 4xx do not), exactly one corrective re-ask when a
  reply will not parse, a `rejects/` directory for replies that still will
  not, partial-file results kept instead of discarded, `--resume` that redoes
  only incomplete files, `--budget 6h` that finishes the file in flight and
  writes the report, and report de-duplication on file + line + check. Every
  user message now opens with a context block (job, file N/total, chunk i/n)
  that deliberately carries no clock, so the same file yields the same prompt
  and the cache stays warm. 42 tests in `test/bitwrench_test_northstar_llm.js`
  cover the pure functions with an injected provider; none touch the network.

## v2.1.11 (2026-10-04)

Option warnings, class verbs, an SVG guide and a C++ embedded app.

A wrong option name is now visible instead of silent, the cheapest update
finally has a verb, SVG has a guide, and an embedded board can serve the bundle
straight from flash.

Most of this came from reading a real app (a Web MIDI practice tool built on
2.1.10) rather than from reports. Every call it hand-rolled -- a router, a
surgical-update mechanism, an element finder, a tooltip -- was already in the
build it had loaded. That is a discoverability bug, and it set the agenda here.

### Added

- **Class verbs: `bw.toggleClass`, `bw.addClass`, `bw.removeClass`,
  `bw.hasClass`.** Changing a class is the cheapest update there is -- no node
  is created, nothing unmounts, focus and transitions survive -- and the library
  had no verb for it, so apps wrote `classList.toggle` loops over
  `querySelectorAll`. They take anything `bw.$` takes (selector, element, array,
  NodeList) plus a bare element id, apply to **every** match, and accept a
  class, a space-separated list, or an array. A third argument forces instead of
  flipping: `bw.toggleClass('.key', 'down', isDown)`.
- **`bw.clear(ref)`** empties a container: unmount hooks fire, then the children
  go. `el.innerHTML = ''` skips the hooks, which is what people were writing.
  (It is not an alias for `bw.unmountChildren`, which fires the hooks but leaves
  the children in place.)
- **`docs/svg.md`** -- a full SVG guide: the five rules, viewBox versus width,
  shapes from data, styling with classes and `currentColor`, handlers in `a:`
  and delegation, **changing SVG that is already on the page** (class, attribute
  patch, `syncChildren`, when to rebuild), mixing SVG with components,
  `foreignObject`, accessibility, recipes (progress ring, gauge, clickable
  keyboard, annotated diagram), server-driven SVG, export, and the gotchas.
  Every block in it runs in CI.
- **`pages/18-svg.html`** -- the same material as editable demos: a chart from
  data, a delegated click handler, in-place updates, a live `syncChildren`
  series, SVG inside a card and a table, a progress ring and a clickable
  keyboard. Covered by a browser test that drives the demos.
- The SVG guide and page address elements by **id and class, not `data-*`**.
  bitwrench emits no `data-*` itself, and the teaching examples should match the
  library: identity is a `bw_uuid_*` class, state is a class, and anything you
  look up has an id. Application markup may still use `data-*` -- the guide says
  so -- but it is no longer what the examples demonstrate.

- **Factories warn on options they do not read (#92).** `makeButton({ href })`
  rendered a styled button that did not navigate; `makeTable({ headers, rows })`
  rendered an empty table. Both reviewed clean and shipped to real sites. Every
  `bw.make*()` call now warns once per factory and key, naming the key and
  listing what the factory accepts, through `bw.makeX()` and `bw.make(type)`
  alike. The accepted keys are read from each factory's own source, so there is
  no list to keep in sync; factories that forward arbitrary `on*` handlers are
  skipped. `bw.warnUnknownProps = false` turns it off. Costs ~560 bytes gzipped.
- `makeTableFromArray` given rows of objects now throws a message naming
  `bw.makeTable` / `bw.makeDataTable` instead of failing later with
  `data[0].map is not a function` from inside the minified bundle (#92).

### Embedded (#91)

The embedded packaging was missing the piece the issue was actually about, and
the C path had a bug that made its own README's recipe unusable. Both fixed.
The registry submissions are still not done -- the manifests are version-locked
and ready, and `embedded_c/README.md` now says so plainly instead of implying
you can install from Library Manager today.

**This release is groundwork, not the embedded release.** The C/C++ side is
example-grade: header-only and tested, but with no per-stack glue, no published
package and an undecided name. If you are here for embedded, read
[`dev/bw-embedded-release-plan-2.1.x.md`](dev/bw-embedded-release-plan-2.1.x.md)
-- it holds the intended scope (a narrow compose/protocol/asset library, not a
web framework), the inconsistency register, the hygiene backlog and the open
decisions. 2.1.12 is the embedded release.

- **`embedded_c/bitwrench_embedded.h`** (and `_lean.h`): the gzipped bundle as
  a `PROGMEM` array, generated at release time from the file that ships. A board
  with no filesystem can now answer `GET /bitwrench.js` from flash -- ~46 KB for
  the full build, ~36 KB for lean -- served with `Content-Encoding: gzip`, which
  the browser unpacks and the device never touches. Each header carries
  `BITWRENCH_EMBEDDED_VERSION` and the SRI hash of its source, so a stale copy
  is visible.
- **Fixed: the C protocol macros produced messages the client rejected.**
  `BW_MOUNT` and `BW_APPEND` embedded a nested TACO with its `r` prefix intact,
  giving `'taco':r{...}`, which `bw.parseJSONFlex()` throws on. The C++ helpers
  and `bw_batch_add()` had always stripped it; the macros had not, so every C
  example following the README emitted unparseable frames. Both macros now
  strip it (`BW_SKIP_R`).
- **`bw_parse_action()` / `bw_action_field()`**: read the action name and one
  data field out of a `bw_act_*` post-back without a JSON parser, accepting both
  strict and relaxed quoting, with no allocation.
- **`bw_clients_t`**: a fixed-size SSE client registry (`init`, `add`, `remove`,
  `each`), so two browsers watching one board is not something every project
  re-implements. A send that reports failure drops that client.
- **A generated size table** in `embedded_c/README.md`: on-disk and gzipped per
  build, flash cost per header, and where the RAM actually goes. These are the
  numbers embedded developers decide on, and they were absent.
- **A C++ web app you can build on your laptop:**
  [`examples/embedded/posix-cpp/`](examples/embedded/posix-cpp/). ~400 lines of
  C++11, one compiler, no Node and no network: it serves the bundle out of the
  flash array, mounts a themed dashboard over SSE, and keeps several browsers in
  sync. It is the ESP32 sketch with the transport swapped, so the app is written
  and debugged on a machine with a debugger and then moved to a board unchanged.

  Its README walks the **whole round trip** in seven numbered steps, each with
  the bytes that actually go over the wire: bundle from flash, a page that is
  four `bw.*` calls, the server mounting the UI, batched patches, a `bw_act_*`
  control posting a typed value back, the device escaping it and patching what
  changed, and a device notification landing on `bw:message`. Getting a value
  *from* the browser was the half the embedded examples never showed.
- Registry packaging, ahead of the Library Manager / PlatformIO / ESP Component
  Registry submissions (#91):
  - **Every Arduino example now lives in a folder named after its sketch.** All
    six were `examples/<something>/<other_name>.ino`, which arduino-lint flags
    and which makes the IDE prompt the user to relocate the sketch before it
    will open. Renamed to `esp32_dashboard/`, `pico_w_server/`, `pico2w_basic/`,
    `esp32s3_basic/`, `pico2w_imu/` and `esp32s3_imu/`, with every reference
    updated. The MicroPython and CircuitPython files stay where they were --
    only Arduino has this rule.
  - `keywords.txt` covers the API added since 2.1.9, so the Arduino IDE
    highlights it.
  - `library.json` no longer ships an `examples/*/build/` directory if someone
    built a demo in-tree, and lists the new `src/` shims.
- **Composition primitives, because the headers could not nest a node.** Every
  `BW_TACO_*` macro quotes its content, which makes it a leaf -- there was no
  way to put one node inside another, in C or in C++. A device could therefore
  only send flat, one-element UIs, which is why the C demo had given up and
  hand-written HTML. Added `BW_NEST`, `BW_NEST_CLS`, `BW_NEST_ATTR` and, for
  C++, `bw::nest()`, `bw::nest_attr()`, `bw::taco_attr()`, plus `bw::array()`
  and `bwserve::batch()` over a `std::vector` for the data-driven case.
- **Fixed: `BW_ARRAY_ITEM` built child lists the client rejected.** It appended
  each item with its `r` prefix intact, so any array content gave
  `'c':[r{...}]`, which does not parse. Same bug class as the `BW_MOUNT` one
  below, same fix (`BW_SKIP_R`, now applied on every nesting path). Arrays were
  unusable before this.
- **Fixed: `bw.connect()` dropped every message a device sent.** It parsed
  frames with `JSON.parse`, which rejects the relaxed `r{'v':1,...}` form that
  all the C macros emit -- and the error was swallowed, so the symptom was a
  page that connected and then did nothing. It now uses `bw.parseJSONFlex()`,
  which reads strict JSON identically. Without this, an embedded project had to
  hand-write its own SSE client, and both desktop demos did.
- **Fixed: a device's notifications were rejected outright.** `BW_MESSAGE` and
  `bwserve::message()` are documented as "send a notification to the browser",
  but `message` also means component-method dispatch on this wire, and
  `bw.apply()` only handled that second meaning -- so every notification a
  device sent was dropped with a confusing warning. The two forms are now told
  apart by whether `action` is present. A notification is **published** on the
  `bw:message` topic rather than rendered, because where a toast belongs and
  how long it lives is the page's decision:
  `bw.sub('bw:message', function(m) { bw.patch('status', m.text); })`.
- **Fixed: the C++ protocol wrappers truncated anything over `BW_BUF_SIZE`.**
  `bwserve::mount`, `append`, `patch`, `patch_num`, `remove` and `message`
  copied through a fixed 512-byte buffer, so a UI composed with the unbounded
  `bw::nest()` helpers was silently cut mid-frame and arrived unparseable, with
  no error on either side. They build with `std::string` now. This was the
  single worst trap on the C++ path: composition had no limit, but the message
  wrapper did. The C macros still take a caller-supplied buffer, which is the
  right behaviour for firmware.
- **Fixed: `#include <bitwrench_embedded.h>` did not compile in the Arduino
  IDE.** Arduino's recursive layout puts only `src/` on the include path, which
  is why `src/bitwrench.h` and `src/bwserve.h` are forwarding shims -- but the
  new flash-array headers had none, so the include line printed in their own
  documentation failed. Added `src/bitwrench_embedded.h` and
  `src/bitwrench_embedded_lean.h`, and a test that compiles every header with
  `-I src` alone, exactly as the Arduino toolchain does.
- **Fixed: `bw.apply()` dropped the attributes of a combined patch.** The
  `patch` branch was an else-if chain, so a message carrying both `text` and
  `attrs` -- which is exactly what `BW_PATCH_ATTR` and the new
  `bwserve::patch_attr()` emit -- applied the text and silently discarded the
  styling. A device telling the browser "41.2 C, and make it red" got half of
  that. Both are applied now.
- `bwserve::patch_attr()` added for parity: `BW_PATCH_ATTR` existed in C with no
  C++ counterpart, so the C++ path had to re-mount a node to restyle it.
- `bw_action_field()` now also reads top-level fields, so the post-back shape
  that bitwrench core sends (`bw.actions.enable()` + `bw.connect()`:
  `{v,type,action,value,name}`, no `data` object) works without a second code
  path in firmware.
- **Rewrote the C demo** (`examples/embedded/cmake-demo/`), which served a
  hand-written SSE client built on `document.getElementById` and `innerHTML`
  with its styling inlined as a CSS string -- the one thing the north star
  forbids, in the file people copy from. It now serves the bundle from flash and
  a bootstrap page that is four lines of `bw.*` calls, and builds its UI with
  `BW_NEST`, `bw_clients_t` and `bw_parse_action` like the C++ one.
- Documented all of it: serving from flash, handling clicks, multiple clients,
  composing a tree, and the two buffer rules the C macros impose (own buffer per
  level, size it for the subtree).
- The `esp32-adafruitST25DV16` example told people to download **2.0.17** in
  four places, including its curl and PowerShell commands. Pinned to the current
  release, and drift-lint now has a **`stale-cdn-pin`** rule so an explicit pin
  that is not the current version fails the build (channel pins like `@2` or
  `@2.1` are fine).

### Tests: the C headers are compiled now

`test/bitwrench_test_embedded_c.js` builds small programs against `embedded_c/`
with the system compiler (`-std=c99 -Wall -Werror`, and again as C++), runs
them, and checks their output. Nothing was compiling these headers before, which
is how the nested-prefix bug survived.

The test that matters most is cross-language: every message the C macros emit is
fed to `bw.parseJSONFlex()`, so the device half and the browser half are checked
against each other rather than against a regex. It skips with a message when no
compiler is available, so `npm test` still works without build tools.

It now also runs the whole path end to end: the POSIX C++ demo is compiled with
`-Wall -Wextra -Werror`, started, driven over a real socket (bundle fetch,
bootstrap page, SSE stream, a click posted back the way `bw.actions` posts it),
and every frame it pushes is rendered into jsdom with `bw.apply()` and asserted
against the resulting DOM. Both desktop demos are also checked for teaching the
pattern -- the page they serve must contain no `document.*`, no `innerHTML` and
no markup, and the UI must come from TACO.

That end-to-end test is what found the `bw.connect()` and `BW_ARRAY_ITEM` bugs
above. Both were invisible to unit tests on either side.

### Docs: the API reference is now complete

- **`docs/bitwrench_api.md` opens with an Index table**: every public API, its
  call signature, its category and a one-line summary, each linked to its full
  entry. That is the "every API in one table" view the reference never had.
- **It was missing a quarter of the API.** `bw` exposes 166 public functions and
  the reference documented 117 -- `bw.$`, `bw.DOM`, `bw.router`, `bw.navigate`,
  `bw.link`, `bw.make`, `bw.apply`, `bw.typeOf` and every colour, array, timing
  and file helper were absent, not merely thin. It now documents 165 of 166
  (the last is `bw.compile`, a removed stub that throws).
- **Cause, and the fix:** the two generators (`docs/bitwrench_api.md` and
  `pages/08-api-reference.html`) each carried their own copy of the same JSDoc
  parser, with the same blind spots -- it read two source files, required a
  function literal on the right-hand side, and could not match `bw.$`. There is
  now one shared extractor (`tools/lib/api-extract.js`) that reads every API
  source file and understands aliases, re-exports, arrow functions, object
  literal methods, IIFE namespaces and `export function` in helper modules
  (where the real JSDoc already lived, so no documentation was duplicated).
- Wrote the JSDoc that was genuinely missing: `bw.DOM`, `bw.to`, `bw.apply`,
  `bw.connect`, `bw.registerRemote`, `bw.actions`, `bw.router`, `bw.navigate`,
  `bw.link`, `bw.colorParse`, `bw.colorHslToRgb`, `bw.colorRgbToHsl`.
- Fixed a stranded JSDoc block: the documentation for `bw.apply` had been left
  behind by an earlier code move and was sitting above `bw.actions`, which the
  new parser surfaced immediately.

### Docs

- **The `apply` second argument of `bw.el` and `bw.$` is documented.** It has
  existed since 2.0.26 and was missing from the core API card, so readers went
  back to raw DOM for anything beyond "find this element".
- **What is in which build is written down.** "Everything except the built-in
  components" did not say that the router, pub/sub, `derive`, `patch`,
  `syncChildren`, the class verbs and the table factories are all in the lean
  build -- nor that `makeTooltip` is not. That one omission explains both a
  hand-rolled router and a hand-rolled tooltip in the field.
- The update-cost ladder now appears where people actually read: a new section
  in `thinking-in-bitwrench.md`, a table in the cheat sheet, the core API card,
  the quickstart, `llms.txt` and `agents.md`.

### Tests and tooling: three checks for whole-project consistency

Each of these would have caught something that actually went wrong this week:

- **API completeness** (`test/bitwrench_test_meta.js`): every public `bw.*` name
  appears in the generated reference, and every documented entry appears in the
  Index table. Values, data tables and removed stubs sit on a declared
  allowlist with a reason each. This test fails at 117/166.
- **`undocumented-api`** (drift-lint): a public `bw.*` with no JSDoc at its
  assignment, reported with the source file and line. Catches the problem when
  the API is written, not a release later.
- **`stale-size`** (drift-lint): every `NN KB` claim in prose is compared with
  the real `raw`/`gzipped` numbers in `dist/builds.json`. It found six stale
  claims on first run (the README, the quickstart, the downloads page and the
  home page's meta description all still said 165 KB / 110 KB). Lines about RAM,
  flash, images or another library's bundle are skipped, and `CHANGELOG.md` is
  exempt so history stays historical.

## v2.1.10 (2026-09-23)

Supply-chain and toolchain release. No API changes and no behavioural changes
to any component: every hand-written file under `src/` is byte-identical to
2.1.9. The work is in the release pipeline, the dependency policy, and making
the build reproducible enough that a compromised tool would be visible.

### Security

The threat model here is specific. bitwrench has zero runtime dependencies, so
a CVE in a build tool cannot reach anyone who installs the package. What *can*
reach them is a compromised tool altering `dist/`, or compromised CI publishing
as the project. These changes target that, in order of blast radius:

- **GitHub Actions are pinned to commit SHAs** rather than floating major tags
  (`actions/checkout`, `actions/setup-node`, `actions/upload-artifact`). The
  publish job holds `id-token: write` and `contents: write`; a moved or
  compromised tag would run inside it. Version comments are retained so
  Dependabot can still propose updates.
- **npm is pinned in the publish step.** It was `npx -y npm@latest`, resolved at
  run time, executing with publishing rights -- the least-reviewed and most
  privileged code in the pipeline. Now `npm@12.1.0`, bumped deliberately.
- **`npm ci --ignore-scripts` in CI.** Dependency lifecycle scripts are the
  classic install-time vector and nothing in this build needs them. Verified:
  lint, build and the full suite pass without them.
- **`github/codeql-action` deliberately stays on the floating `@v4` tag**, as
  documented in `.github/dependabot.yml`. That job cannot publish, so the
  trade-off differs from the publish path.

Unchanged and worth stating: publishing uses OIDC trusted publishing, so no
long-lived npm token exists in the repository to leak.

### Changed

**Builds are reproducible within a day.** `buildDate` in the generated
`src/version.js` is now a calendar date (`2026-09-23`) instead of a
millisecond timestamp (`2026-09-23T02:07:01.064Z`), and honours
`SOURCE_DATE_EPOCH` if set.

This is the change that makes the security work above checkable. `dist/` is
committed, so `git diff dist/` is the cheapest available evidence that the
build tools produced what the source says they should -- but the old stamp
propagated into every artifact importing `version.js` and cascaded into
`sri.json` and `builds.json`, dirtying ~44 files on every build. Real
unexplained output changes were indistinguishable from noise. Now two builds
of the same source on the same day are byte-identical, and anything else in
that diff is a question worth asking.

`bw.versionInfo().buildDate` therefore returns a shorter string. It is still a
string, still ISO-8601, and still parses with `new Date()`.

**Project documentation added.** `SECURITY.md` records how to report a
vulnerability (GitHub private advisories, which are enabled), what is and is
not in scope given a library with no runtime dependencies, and the full
security posture -- including the two controls that live in GitHub repository
settings and would otherwise leave no trace in the repository. `drift-lint`
now scans it, because it names real APIs and can rot like any other doc.

Also added: `CODE_OF_CONDUCT.md` (Contributor Covenant 2.1), issue templates
for bugs and feature requests, and a pull request template. `CONTRIBUTING.md`
now states the real Node floor -- 22.12+ for the build toolchain, tested on 22
and 24 -- rather than 18+, which has not been accurate for some time.

**Dropped four unused devDependencies.** None were reachable from the build,
the tests or the tooling:

- `@babel/preset-react` -- a React preset in a library whose premise is that
  JSX is unnecessary. Its only remaining reference was an ignore rule in
  `.github/dependabot.yml`.
- `uglify-js` -- superseded by `@rollup/plugin-terser`. A carry-over from the
  1.x build, when uglify was the only minifier worth using.
- `uglifyjs` -- the deprecated 2.4.11 fork of the above, almost certainly an
  accidental install.
- `rollup-plugin-postcss` -- `rollup.config.js` uses `rollup-plugin-css-only`.

The lockfile drops from 457 to 354 packages, a ~23% smaller install for
contributors. No effect on consumers: bitwrench has zero runtime dependencies
and devDependencies are never installed downstream.

**Dependency update policy is now explicit.** npm version-update pull requests
are disabled (`open-pull-requests-limit: 0`); dev dependencies are refreshed
deliberately at the start of each release cycle instead. GitHub Actions updates
remain enabled at a quarterly cadence, because actions execute with repository
credentials and are a genuine supply-chain surface. Dependabot alerts remain
on, so advisories are still reported.

The reasoning is recorded in `.github/dependabot.yml` itself: with no runtime
dependencies, a CVE in a transitive build tool cannot reach a bitwrench user,
so dependency freshness here is build maintenance rather than a security
control -- and updating *faster* is the wrong reflex against the one risk that
does apply, a compromised tool altering `dist/`.

## v2.1.9 (2026-09-23)

Maintenance release: tables, grid, docs and better tests.

Every fix came from someone using bitwrench -- field reports, filed issues and
two rounds of outside review -- and each is locked by a test that fails on the
old code. Core is ~110 bytes larger gzipped than 2.1.8, spent on keeping table
cells alive across updates.

### Fixed

**Rendering**

- **Nested arrays in `c` render everywhere (#105).** `bw.create`, `bw.mount`,
  `bw.patch` and `bw.el(ref, apply)` flatten `c: [[a, b], c]` the way
  `bw.html` always has, instead of printing `[object Object]`. This is what
  broke `makeAlert({ content: [...] })`.
- `bw.patch(ref, bw.raw(html))` inserts the markup instead of treating the raw
  wrapper as an attribute object.
- `bw.patch(ref, text)` over child elements runs their unmount hooks first.

**Tables** -- first paint and every handle now compute one view (current sort,
then the current page's slice), so the parts agree with each other:

- `render()` output survives a sort (#98); `0` and `false` render as values,
  not blanks (#102), and sort as values.
- The sort glyph moves with the column and flips with the direction. It was
  painted once, so it disagreed with `aria-sort`.
- `sort()` and `setData()` keep the page slice; a header click on a paginated
  table used to show every row. `setData()` and `update()` re-apply the active
  sort.
- The pager follows that slice: label, disabled states and the page passed to
  `onPageChange` are clamped to the data. A one-row table used to read
  "Page 2 of 3" and offer a Next that asked for a page that no longer existed.
- `onRowClick` reports the row and index on screen now. Rows carry no handlers;
  one `onclick` on `<tbody>` resolves the row at click time, so a reused row no
  longer reports the record it was first painted with.
- A keyed row keeps the cells whose rendered content is unchanged, so an
  `<input>` in a cell keeps focus and caret while the table re-sorts. Changed
  cells still go through `bw.patch`, so what they replace still unmounts.
  Reordering rows no longer blurs the focused element.
- Cell values that are already a TACO or `bw.raw()` render as markup without a
  `render()` function.
- No `data-*` attributes left: row keys live in component state, headers match
  columns by position.

**Components**

- `makeNavbar` lays out in one row again (#101). The flex rule targeted
  `.bw_bccl_container`; the factory renders `.bw_container`.
- `makeRow({ gap: 0 })` means no gutter -- `0` is falsy, so no class was
  emitted and the row kept the default.
- `makeContainer({ fluid: true })` emits `bw_bccl_container_fluid`, which has
  rules; the old hyphenated class matched nothing.
- `makePagination({ size })` and `makeDataTable`'s title spacing have CSS. Both
  emitted classes no rule matched.
- `makeBarChart` shows a `0` label; `makeFeatureGrid({ columns })` always emits
  a whole grid span (counts that don't divide 12 round; documented).
- `makeSelect` options accept `label` as well as `text`.
- `makeTabs` wires Arrow/Home/End through `onkeydown` in the tablist's
  attributes, not `addEventListener` in `o.mounted`.

**Grid CSS**

- Gutters work (#104): column padding targeted Bootstrap's `.col`/`col-*` and
  never matched `bw_col_*`. `bw_g_0`..`bw_g_5` are generated from the spacing
  scale and set `row-gap`. **Visible change:** every `bw_row`/`bw_col_*` layout
  gains the 0.375rem column padding its row's negative margin already reserved.
- Responsive sizes apply when `xs` is set (#103). Section merging reused the
  `@media` keys, so base `.bw_col_N` rules landed after the breakpoints and the
  container's 540/720/960px max-widths were dropped. `bw_col_xl_*` now exists.
- No CSS custom properties in the library: gutters are generated values, and a
  dead `:root` font block is gone.

**bwserve / types**

- `client.screenshot()` is back (#107). The 2.1 refactor dropped the server
  side while `bwcli serve`, `bwcli attach /screenshot` and the browser capture
  still called it. Honours `format`, `quality`, `maxWidth`, `maxHeight`,
  `scale`; resolves to `{ data: Buffer, width, height, format }`.
- Types: `TabsConfig` declared `text` where `makeTabs` reads `label`; `css()`
  and `injectCSS()` accept rule arrays and `{ minify }`; `screenshot()` typed;
  removed `bw._el`, `bw._unmountCallbacks` and options no code reads.

### Added

- `makeTabs({ onTabChange })` (#106), called as `(index, tab, el)` on click,
  keyboard or `setActiveTab()`, only when the index changes. `tab` is your own
  object, so extra keys come back.
- `docs/core-api.md`: one page, one line per call, for bringing your own design.
- SVG is documented (`taco-format.md#svg`) -- it has worked since 2.0.26, but
  the docs never said so, so people built SVG as strings.

### Docs

- The quickstart opens with a three-line hello world and a "which file do I
  load?" table; `docs/README.md`, `llms.txt` and `agents.md` point there first.
- Corrected against the code: `bw.DOM()` returns the mounted element (it is
  `bw.mount`), `t` is required, 51 components not 47, `data-*` and custom
  properties are banned in library source but fine in application CSS, and the
  cheat sheet lists the table handles.
- ~100 uses of class names with no CSS rule (`bw_btn`, `bw_card`, `bw_table`
  ...) across 15 pages, examples, the README and `CONTRIBUTING.md`. Nine
  reference tables on the docs site rendered empty (`makeTable({headers,rows})`
  is not a thing; `makeTableFromArray` is).
- The quick-start page's own try-it wired its Run button with
  `addEventListener` in `o.mounted` -- the mistake it teaches against. It is a
  component now (`el.bw.run()`), shared by every tutorial page.

### Tests and tooling

- Invariants: `bw.create()` and `bw.html()` build the same tree; every emitted
  `bw_*` class has a CSS rule; `makeTable` under random handle sequences
  matches a recomputed view.
- Every code block in 11 onboarding docs runs in CI (191 blocks); `.d.ts`
  members must exist at runtime; `assert.ok(true)` counts may only decrease.
- Playwright layout specs measure gutters, navbar, responsive columns and
  container widths -- what jsdom cannot see.
- drift-lint scans `src/` (no `data-*`, no custom properties) and catches dead
  BCCL class names in every file type, not just `.md`.

### Dev dependencies

- eslint 10.11.0, mocha 12.0.2 (major), rollup 4.63.3 -- Dependabot #109, taken
  on this branch rather than merged to `main` separately.

## v2.1.8 (2026-09-12)

Site analytics and dev dependency updates, no library changes. The API,
bundles and runtime behaviour are byte-for-byte what v2.1.7 shipped -- the only
file under `src/` that moved is the generated version stamp.

### Docs site

- **GoatCounter added to the documentation site**, injected once from
  `pages/site.js` rather than pasted into every page. It is a TACO through
  `bw.append()` like everything else on the site, so there is no raw DOM here
  either.
- **Local development does not reach the counter.** Requests from `localhost`,
  `127.0.0.1`, `192.168.*`, `*.local` and `file:` are skipped. Without this
  every `./run.sh`, every local preview and every device-on-the-bench session
  lands in the traffic numbers and they stop meaning anything.
- **The visible hit-counter badge is off.** GoatCounter's copy-paste snippet
  includes `visit_count({append: 'body'})`, which appends a counter to the page
  body -- a visible design element on every page, which is a different decision
  from measuring traffic. `ANALYTICS.showVisitorCount` turns it on.
- **Fixed a race in that snippet while we were at it.** It calls
  `window.goatcounter.visit_count()` from a sibling `<script>` while `count.js`
  loads `async`, so whenever the network is slower than the parser it reads
  `visit_count` off an undefined `window.goatcounter`. The call now hangs off
  the script element's own `load` event.
- **Coverage went from 38 to 46 of the 61 published pages.** GitHub Pages
  serves this repository from `main` at `/`, so the site is larger than
  `pages/` -- `examples/` is part of it and eight of those pages had no shared
  include at all. They do now.

- **A privacy page**, `pages/privacy.html`, linked from the footer on every
  page that renders one. It states what is measured and -- more usefully for a
  library sold on having no dependencies and no build step -- that bitwrench
  itself sends nothing, from any install path, ever.
- Removed a second, unreferenced copy of the site footer in `pages/site.js`.
  `mountExampleNav()` in `shared-nav.js` builds the real one, so every footer
  edit had even odds of landing in the dead copy.

### Deliberately not instrumented

`examples/*/dashboard.html` and `examples/esp32-adafruitST25DV16/static/` are
**firmware payloads, not web pages.** Each sits next to the thing that serves
it -- `server.py`, `server.ino`, `settings.toml`, `sketch.ino` -- and gets
copied onto a board. Putting an analytics beacon in them would mean code
flashed to someone else's hardware phoning home from their LAN, which is not
what a UI library should do to the people using it. Several also load
bitwrench from an absolute path (`/bitwrench.umd.min.js`) that only resolves
when the device serves them, so they do not work on the docs site anyway.

Also skipped: the root `index.html`, an eleven-line meta-refresh stub that
forwards to `pages/` in zero seconds and would only double-count its
destination.

**The library itself contains no analytics of any kind, and never has.** This
release adds a tag to the documentation website. Nothing in `dist/` phones
home, and a page served off an ESP32 talks to nobody but its own device.

### Dev dependencies

Clears dependabot #97, #99 and #100. All dev-only -- bitwrench still has zero
runtime dependencies.

| package | from | to |
|---|---|---|
| `comment-parser` | 1.4.7 | 1.4.9 |
| `eslint` | 10.8.0 | 10.10.0 |
| `globals` | 17.8.0 | 17.12.0 |
| `mocha` | 11.7.6 | 11.8.0 |
| `js-yaml` (via mocha) | 4.3.1 | 4.3.2 |
| `svgo` (via rollup-plugin-postcss) | 2.8.3 | 2.8.4 |

3,158 unit tests plus 168 bundle tests. Coverage 97.79% statements,
98.6% branches -- unchanged, as expected for a release that touches no
library source.

## v2.1.7 (2026-08-15)

The string path catches up with the DOM path. Every fix here is one of two
shapes. Either `bw.html()` and `bw.create()` disagreed -- and it was always
`bw.html()` that was wrong, because the DOM does its own serialising while
string output is something nobody renders during development -- or the reset
broke plain markup and did not put it back, which is the rule 2.1.6 settled and
this release finishes applying.

### Fixed

- **`bw.html()` slash-escaped every attribute value.** `bw.escapeHTML()` also
  escapes `/`, an OWASP rule for element *content* where it blunts a stray
  `</script`. Inside an attribute `/` is an ordinary character, so every href,
  src and action came out as `https:&#x2F;&#x2F;example.com`. Browsers decode
  it and the links worked, which is why it survived -- but it is wrong for
  anything that diffs, greps or snapshots server-rendered HTML, wrong in a
  bwserve payload read by something that is not a browser, and openly
  confusing in a tutorial whose claim is "this is the HTML you would have
  written by hand". Attributes now use their own escaper; content escaping is
  unchanged, `/` included.
- **`bw.html()` emitted attribute *names* unchecked.** No escaping makes a bad
  name safe -- the space in `{a: {'x onclick=alert(1) y': 'z'}}` is itself what
  ends the name and begins the next attribute, so that TACO produced
  `<div x onclick=alert(1) y="z">`. `bw.create()` was never affected because
  `setAttribute` throws on the same key. Names carrying whitespace, quotes, `/`
  or `=` are now dropped with a `bw:diag` (`attr_name_invalid`); unusual but
  serialisable names still pass.
- **`bw.htmlPage()` interpolated `lang` raw**, the one attribute the sweep
  above missed -- two lines below the favicon it did fix. `<title>` also stopped
  slash-escaping: it is RCDATA, so entities decode and `Docs&#x2F;Guide` only
  ever looked wrong in the source.
- **List markers hung outside the list box at `padding-left: 1em`.** Measured
  in Chromium at a 16px root, marker ink starts 0px inside the box at 1em and
  7px at 1.5em: 1em aligns marker ink to the text *box* edge while the eye
  compares ink to ink, so the bullet read as hanging out to the left of the
  heading above it. Bare `ul`/`ol` and `.bw_list` now indent 1.5em, and the
  test asserts a minimum rather than the shipped number.
- **The reset flattened `blockquote`, `dd` and `menu` and never put them back.**
  `* { margin: 0; padding: 0 }` takes away `blockquote { margin: 1em 40px }`
  and `dd { margin-left: 40px }`, leaving a quotation indistinguishable from
  body text and a definition list as a flat ladder; `<menu>` is a list and lost
  its markers outside the box exactly like `<ul>`. Repaired where the reset
  that broke them lives. `.bw_quote` stays what it always was -- styling you
  opt into, not the repair.

### Changed

- **The bundle gate is 46KB gzipped, raised from 45KB.** Both UMD and ESM are
  measured, against the pre-compressed `.gz` the build writes. ESM had been the
  binding artifact for some time without anyone noticing -- it went into this
  release 9 bytes under the old gate -- so any one of the fixes above would have
  tripped it. Raised once and deliberately rather than dropped a fix or golfed
  library internals to fit a policy number. 2.2 splits core from BCCL, which
  takes the ~14KB of BCCL CSS that core ships and cannot use out of this same
  artifact; per-SKU budgets arrive with that split. Until then 46KB is a
  ceiling, not headroom.

### Tests

- Golden fixtures pin the exact attribute bytes, including the case the
  semantic-equivalence test cannot see: `href="https:&#x2F;&#x2F;x"` and
  `href="https://x"` parse to the same value, so only exact strings catch it.
- A new contract suite parses `bw.html()` output and compares resolved
  attribute values against `bw.create()`, so the two paths cannot drift again
  in silence. Verified by mutation: it catches the v2.1.6 camelCase style bug.
- List and prose indents assert a minimum, not a snapshot -- they should fail
  when the markers stop clearing, not when someone retunes a number.

### Examples

- `examples/circuitpython/01a` is now an introduction to bitwrench and the
  `{taco}` format rather than a board demo that happens to use it; `01b`
  trimmed to match.
- **Ember & Oak rendered a blank page.** A duplicated `}), { id: 'eo-styles' });`
  made the whole inline script a syntax error, so the most elaborate example in
  the gallery -- 27 components -- displayed nothing at all.
- **Five gallery cards linked to an HTTP 500.** The server-driven and AI
  examples are directories holding a server and a README with no `index.html`,
  so "Open Example" could only fail. Their own prereq line already said
  `Run: node server.js`; the button now agrees with it and offers the code
  instead of a demo that cannot exist until something is running.

## v2.1.6 (2026-08-08)

Consistency release: plain markup works right with no class on it. Everything
here answers the same complaint -- bitwrench sometimes did the right thing only
if you knew to ask for it. A handler passed
to `bw.html()` was dropped unless you also passed `{fns}`. A `<ul>` needed a
class to undo damage the library's own reset had done. Three components emitted
classes that styled nothing. A sortable table shipped a working sort handle that
no click ever reached. Each was individually small and silent; together they
made the library feel like it had opinions it had not told you about.

The rule this release settles on: **plain markup should look right and work
right with no class on it, and a class is how you ask for something other than
the default -- never how you repair one.**

### Fixed

- **`create`+`appendChild` dogfooding footgun (post-v2.1.0 lifecycle).**
  `bw.create()` hydrates but does not fire `o.mounted`; `mountTree` is what
  `bw.mount` / `bw.DOM` / `bw.append` / `bw.replace` run. Demos and docs that
  taught `parent.appendChild(bw.create(taco))` looked fine and silently skipped
  lifecycle. Sweep for 2.1.6:
  - `pages/14-bwserve-sandbox.html` — editor mount + protocol fallback now use
    `bw.DOM` / `bw.append` / `bw.remove` (Run was a silent no-op)
  - Toast demos on `pages/01-components.html` and `pages/index.html` → `bw.append`
  - `pages/thinking-in-bitwrench.html` code blocks → `bw.replace`
  - `pages/shared-nav.js`, `blog/blog-nav.js` → `bw.append`
  - `examples/live-feed`, `examples/ember-and-oak` → `bw.append`
  - Docs (`bwserve.md`, protocol page, lifecycle, thinking-in, llm-guide,
    agents.md) now teach `bw.append` / warn against raw `appendChild`
- **`bw.html()` dropped `on*` handlers.** Passing a function to an event
  attribute produced HTML with no handler at all unless the caller also passed
  `{fns}`; the only signal was a `bw:diag` message nobody was subscribed to.
  This was the behaviour in 1.x and 2.0 -- auto-register and emit a dispatch
  string, with `o.atrOnEventRegister: false` as the opt-out -- and v2.1.0
  replaced it with a silent drop. Restored: `bw.html(taco)` now registers the
  function and emits `onclick="bw.funcGetById('bw_fn_N')(event)"`, so the markup
  carries a working handler with no binding pass to remember. It also survives a
  clone or a re-insert, because there is no separate binding step to re-run.
  `{fns}` is unchanged and remains the CSP-safe path -- handlers go into a
  per-render object and the element gets a `bw_fn_N` class instead.
  **Anyone server-rendering interactive markup on 2.1.0-2.1.5 was affected and
  had no way to know.**
- **`bw.html()` emitted camelCase style properties.** `{style: {paddingLeft:
  '1rem'}}` serialised to `style="paddingLeft:1rem"`, which every browser
  ignores. The DOM path via `bw.create()` was always correct, because assigning
  `el.style.paddingLeft` does the conversion for you -- so this only ever showed
  up in string output, where nothing complained. Properties are now hyphenated,
  with custom properties (`--x`) and vendor prefixes (`WebkitTransform`) handled.
- **`makeTable` sortable headers never responded to clicks.** The table shipped
  a correct `el.bw.sort()` handle and header cells that looked clickable, and
  nothing connected the two. Structure perfect, behaviour absent -- the failure
  mode that motivated most of this release. Headers now dispatch to the table's
  own handle.
- **Three components emitted classes with no CSS rule**, so they rendered
  structurally correct and completely unstyled: `makeBreadcrumb` (now
  `bw_bccl_breadcrumb_list` / `bw_bccl_breadcrumb_item`, with real rules),
  `makeSpinner` at the default size (emitted `bw_spinner_border-md` with a
  hyphen, while the stylesheet has always used `_sm` / `_md` / `_lg`), and
  `bw_container` (the documented short form of `bw_bccl_container`, which
  existed in the docs but in no rule -- including inside all four responsive
  breakpoints, so `bw_col_md_4` lost to `bw_col_12` and the grid never
  responded).

### CSS and the design system

- **The reset now repairs what it breaks.** `* { padding: 0 }` left every `<ul>`
  rendering its markers outside its own content box, overlapping whatever
  contained it, and `hr { border: 0 }` left a bare `<hr>` occupying space and
  painting nothing. Both are fixed where the reset lives, so plain HTML looks
  right with no class. `hr` takes its colour from the palette.
- **New prose classes** for elements the reset never touched and that simply
  have no default opinion: `.bw_quote` and `.bw_code`. `.bw_list` and `.bw_hr`
  also exist and now restate the default -- they are kept for compatibility and
  are no longer necessary.
- **`bw.makeStyles()` returns `layout`** alongside `palette`, so spacing and
  radius tokens are reachable from JavaScript the same way colours are. Page CSS
  can be a function of the design system rather than a string of hard-coded
  values.
- **drift-lint rejects `var(--bw_*)` in first-party docs and examples.** The
  theming path is `styles.palette` / `styles.layout`, and CSS custom properties
  named after bitwrench were teaching a path the library does not take. The rule
  is scoped to first-party content -- your own CSS may use custom properties
  freely.
- `tools/build-readme.js` was rewritten to derive its CSS from the palette
  instead of ten `var(--bw_*)` references, which is what surfaced the rule above.

### Build and release integrity

- **`tools/verify-sri.js`, wired into both `postbuild` and `posttest`.** It
  asserts every hash in `dist/sri.json` matches the file on disk, that every
  loadable artifact is covered, and that `dist/builds.json` agrees. This closes
  a real gap: CI rebuilds the bundles before publishing, and nothing regenerated
  or rechecked the manifest, so the published `sri.json` did not describe the
  published JavaScript. `npm run build` now regenerates and verifies it in the
  same pass. 53 files covered.
- Builds are still not byte-reproducible -- the banner carries a full ISO
  `buildDate`, so any rebuild changes every hash. That no longer affects SRI
  correctness, since the manifest is regenerated from the same bytes it
  describes. It does mean a local rebuild always shows a `dist/` diff.

### Tests

New suites covering the shapes of bug above, all of which passed the old suite:

- **`bitwrench_test_bccl_contract.js`** -- which prop actually carries content
  (`children` vs `content` vs `items` vs `tabs`), an audit that fails if any
  factory emits a class with no CSS rule, and wiring tests that issue real
  clicks and assert the DOM changed.
- **`bitwrench_test_html_golden.js`** with a fixture file -- pins the exact
  string `bw.html()` produces, which is where the camelCase style bug hid.
- **`bitwrench_test_contract.js`** and **`bitwrench_test_contract_live.js`.**
- **`bitwrench_test_semantic_html.js`** -- what plain markup is entitled to look
  like without a class.

3,145 unit tests plus 168 bundle tests. Coverage 97.78% statements, 98.63%
branches.

### Notes

- `makeBreadcrumb`'s markup classes changed from `bw_breadcrumb` /
  `bw_breadcrumb_item` to the `bw_bccl_` prefixed forms. Neither old name had a
  CSS rule in any release, so nothing that relied on bitwrench's own styling
  changes -- but hand-written CSS targeting the old names needs updating.

## v2.1.5 (2026-08-03)

Release tooling and CI stabilization. No library source changes -- the API,
bundles, and runtime behavior are identical to v2.1.4.

### CI and release tooling

- **GitHub Release assets now include the CommonJS builds.** The asset glob
  was `dist/*.js`, which does not match `.cjs` -- so the v2.1.4 release
  attached 76 files and not one CommonJS bundle, despite that release
  existing to repair CommonJS packaging. Now also attaches `*.cjs`,
  `*.cjs.map`, `*.gz` (used by embedded targets that serve pre-compressed
  files from flash) and `*.d.ts`.
- **Release notes come from the CHANGELOG.** The GitHub Release body is the
  matching version section rather than a list of commit subjects, falling
  back to generated notes when no section exists.
- **`npm run release` no longer guesses the merge commit message.** It
  derives a subject from the CHANGELOG, accepts `--squash-msg="..."` as an
  override, and confirms the message in a step separate from confirming the
  release itself. Previously the subject came from the branch name, which is
  how v2.1.4 -- a CommonJS packaging fix -- nearly landed as "dependabot
  deps".
- **`npm run start-release` now rebuilds `dist` before committing.** Bumping
  the version without rebuilding left every bundle banner stamped with the
  previous version, so a freshly created branch failed 58 bundle assertions
  before any work had been done.
- **drift-lint rejects bitwrench repository URLs that do not point at
  `github.com/deftio`.** A fabricated owner sat in the embedded C headers
  and the Rust manifest from 2026-03 until v2.1.0 removed it. It never
  reached npm, but nothing would have caught it, and the embedded registries
  render this URL on the package page.

### Notes

<!-- drift-lint:ignore-start: migration note must name the retired attribute -->
- **`data-bw-action` / `data-bw-id` were removed in v2.1.0** and this was not
  called out at the time. bitwrench does not use `data-*` attributes anywhere;
  bwserve had been an unintended exception. Server-driven apps written against
  v2.0.x that annotated markup for click binding should move to `bw_act_*`
  class tokens, which the thin client delegates on identically:

  ```
  // v2.0.x
  { t: 'button', a: { 'data-bw-action': 'save' }, c: 'Save' }

  // v2.1.x
  { t: 'button', a: { class: 'bw_act_save' }, c: 'Save' }
  ```

  BCCL factories emit these automatically -- `makeButton({ action: 'save' })`
  produces `bw_act_save`.
<!-- drift-lint:ignore-end -->

## v2.1.4 (2026-08-03)

No library source changes -- the API and runtime behavior are identical to
v2.1.3. This release repairs CommonJS packaging and modernizes the build.

### Fixes

- **`require('bitwrench')` was broken for CommonJS consumers.** package.json
  declares `"type": "module"`, which makes Node parse every `.js` file in the
  package as ESM -- including the CommonJS builds, which were named
  `*.cjs.js`. Requiring one threw
  `ReferenceError: module is not defined in ES module scope`. Every `require`
  target was affected: the main entry plus `./lean`, `./bccl`, `./bwserve`,
  `./util-css`, and `./code-edit`. ESM `import` was never affected.

  CommonJS builds now use a bare `.cjs` extension (`bitwrench.cjs`,
  `bitwrench.min.cjs`, and so on), which forces CommonJS parsing regardless
  of the `"type"` field. `main` now points at `./dist/bitwrench.cjs` rather
  than the UMD bundle, which had the same defect.

  If you consume bitwrench via `import`, nothing changes. If you reference a
  dist file by path, `dist/bitwrench.cjs.js` is now `dist/bitwrench.cjs` and
  `dist/bitwrench.cjs.min.js` is now `dist/bitwrench.min.cjs`.

- **`require('bitwrench/debug')` returned an empty object.** The `./debug`
  subpath mapped `require` to a UMD `.js` bundle; parsed as ESM, its wrapper
  fell through to the global branch and exported nothing. A real CommonJS
  build (`dist/bitwrench-debug.cjs`) is now emitted and mapped.

- **`.cjs` files were missing from the npm tarball.** The `files` allowlist
  matched only `dist/*.js`, so the renamed builds would not have shipped.

- **Pre-gzipped `.gz` companions were not emitted for the CommonJS bundles.**
  The build's bundle list still named the old `*.cjs.js` paths, so those
  reads failed silently, and the gzip step tested for a `.min.js` substring
  which cannot match `.min.cjs`. `bitwrench.min.cjs.gz` and friends are
  generated and shipped again -- these matter for embedded/SPIFFS use, where
  the pre-compressed file is served directly from flash.

### CI

- Bumped GitHub Actions: `actions/checkout` v6 -> v7, `actions/setup-node`
  v6 -> v7, `github/codeql-action` v4 -> v4.37.3.
- Node test matrix narrowed to 22 and 24. Node 20 reached end-of-life in
  April 2026.
- `npm run release` gained `--dry-run` (also `npm run release:dry`), which
  runs every gate but performs no archive, commit, merge, or push.
- `npm run release` now fails fast with a clear message if the local Node
  is older than 22.12, instead of dying inside the build with
  `ERR_REQUIRE_ESM`. Added `.nvmrc` pinning the dev toolchain to Node 24.
- **Repaired the Docker clean-room release gate, which had never run.** Its
  probes were inlined as `node -e "..."` inside an already double-quoted
  `sh -c "..."`, so the shell aborted on the first parenthesis; the error
  handler then misreported that as "Docker not available" because it tested
  whether the message contained the string `docker` -- which the failing
  command always did. The gate now writes its probes to files and separates
  Docker detection from test execution, so a failure fails the release.
  Repairing it is what surfaced the CommonJS bug above.
- The clean-room step piped its `npm install` through `tail`, and a shell
  pipeline reports the exit status of its last command -- so a failed
  install returned 0 and only resurfaced later as a confusing
  `MODULE_NOT_FOUND`. The install now runs unpiped so npm's own diagnostics
  reach the log and a non-zero status fails the release.

### Testing

- **Coverage was being measured dishonestly.** c8 ran without `all`, so any
  source file the suite never loaded was omitted from the report rather than
  counted as 0%. `bwcli` reported 99.91% while only 2 of its 6 files were
  measured at all. `all` is now enabled, with deliberate exclusions for
  vendored code, `.d.ts` files, Rollup entry shims, and the build-time CSS
  generator.
- **The documented 80% coverage gate had never been enforced** --
  `check-coverage` was `false`. It is now `true`, so falling below the
  threshold fails the build.
- **Five test suites existed on disk but were never run by `npm test`:**
  cli, util_color, uuid, stable, and v2. `bitwrench-util-color.js` (240
  lines) read as 0% covered purely because its 32 tests were never invoked.
  All five are now part of the measured suite.
- Repaired stale expectations in those suites. Each asserted a contract the
  library had deliberately moved away from; none were product bugs. Notably:
  UUID registration happens at mount rather than in `bw.create()`; the
  bwserve wire protocol addresses elements with `ref`/`text` and a per-message
  `v`, not `target`/`content`; `bw.el()` deliberately refuses to resurrect a
  deregistered UUID via `querySelector`; and `bw.htmlTable()` is a v1 API
  replaced by `makeTableFromArray`, which emits TACO.
- Test count: 2911 -> 3074. Coverage across 28 measured files: 97.74% lines,
  95.57% functions, 98.70% branches (bwserve 99.85, bwcli 98.84, mcp 99.55).
- Known gap: `bitwrench-debug.js` sits at 0%. It is a self-executing IIFE
  that falls back to fetching bitwrench from a CDN on import, so it cannot be
  tested without restructuring. It is counted rather than excluded so the
  debt stays visible.

### Development dependencies

- Upgraded `@rollup/plugin-babel` 6 -> 7, `@rollup/plugin-commonjs` 26 -> 29,
  `@rollup/plugin-node-resolve` 15 -> 16, `c8` 8 -> 12.
- `@babel/*` held at 7.x. `@rollup/plugin-babel@7.1.0` (its latest release)
  still peer-requires `@babel/core ^7.0.0`, so Babel 8 cannot be installed
  alongside it. Recorded as dependabot ignore rules.
- Removed Karma and its eight `karma-*` packages plus `chai`. Karma was
  deprecated upstream in 2023, was never run in CI, and carried the repo's
  only security advisory. Browser testing is covered by Playwright.
- Removed `test/karma-test.js`, and `test/bitwrench_test.js` (which imported
  a `nyc` package absent from devDependencies and asserted v1-era APIs such
  as `bw.logExport` that no longer exist in the source).
- Dev dependency tree: 785 -> 466 packages, 1 high-severity advisory -> 0.

## v2.1.3 (2026-07-18)

### Fixes

- **`_applyTo()` lifecycle pipeline** -- `bw.el(sel, taco)` and `bw.$(sel, taco)` now properly call `bw.unmountChildren()` before clearing content and `bw.mountTree()` after appending, so replaced TACO children fire their unmount/mounted hooks and stay registered in `_nodeMap`. (#90)
- **`bw.unmountChildren()` selector leak** -- added `[id]` to the descendant selector so elements registered in `_nodeMap` by id alone (no UUID, no lifecycle hooks) are properly deregistered on teardown. (#90)

## v2.1.2 (2026-07-16)

### Fixes

- **`bw.inspect()` includes text content** -- walk function now extracts direct text nodes from elements, truncated to 120 chars. Useful for automated testing, accessibility auditing, and AI agents that need to "read" a page. (#74)
- **`client.query()` restored** -- execute a JavaScript expression on the client and return the result via the `_bw_query` built-in. Uses `_pend`/`_resolvePending` request-response mechanism over SSE. Accepts `{ timeout }` option. (#75)
- **Trailing slash normalization in `app.page()` route matching** -- `/app/` now matches a handler registered for `/app`. Root `/` is unchanged. (#77)

### Tooling

- **`start-release.js` auto-bumps embedded manifests** -- `library.properties`, `library.json`, and `idf_component.yml` are now updated automatically when starting a release, preventing version drift with ESP32/Arduino/PlatformIO packages.

### Docs

- **`docs/quickstart.md`** -- new annotated 100-line tutorial covering the full lifecycle (theming, static TACO, BCCL, stateful component with handles, mount, interact).
- **README.md** -- added "Dev Server & Debugging" subsection with bwcli serve/inspect/screenshot examples. Added quickstart.md and bw-attach.md links to Documentation section.
- **`llms.txt` / `agents.md`** -- added origin story, lifecycle bullets, and quickstart links for agent discoverability.
- **`docs/bwserve.md`** -- added `client.query()` section and method table entry.
- **`docs/bitwrench_api.md`** -- added `text` field to `bw.inspect()` return documentation.
- **`docs/drift-lint.md`** -- removed `client.query` from banned patterns (restored in this release).

## v2.1.1 (2026-07-15)

Dependency updates only (dependabot dev deps).

## v2.1.0 (2026-07-14)

v2.1.0 is a lifecycle and rendering refactor. The core rendering pipeline
(`create`, `mount`, `unmount`) is redesigned around composable atomic
operations and a janitor that catches ungraceful teardown. Several
v2.0.x APIs are renamed or removed.

### Breaking Changes

- **`bw.createDOM()` removed** -- renamed to `bw.create()`. No shim; callers must update.
- **`bw.cleanup()` removed** -- renamed to `bw.unmount()`. No shim.
- **`bw.compileProps()` removed** -- was deprecated in v2.0.19. Now fully deleted.
- **`bw.renderComponent()` removed** -- was deprecated in v2.0.19. Now fully deleted.
- **`bw.getComponent()` / `bw.getAllComponents()` removed** -- component registry eliminated. Use `bw.catalog()` for BCCL introspection.
- **`bw._componentRegistry` removed** -- internal component registry deleted.
- **`bw._el` alias removed** -- was kept one release cycle (v2.0.26). Use `bw.el()`.
- **`bw.toggleStyles()` alias removed** -- use `bw.toggleThemeMode()`.
- **`bw.DOM()` is now an alias for `bw.mount()`** -- both return the root element. Code that ignored `bw.DOM()`'s return value still works; code that relied on it returning `void` should verify.
- **`bw.update()` signature changed** -- now takes `(ref, data)` and dispatches to `el.bw.update(data)`. The v2.0.x `bw.update(target)` (no data arg, triggered `o.render`) is replaced by `bw.refresh(ref)`.
- **bwserve default host changed** -- `0.0.0.0` (all interfaces) changed to `127.0.0.1` (loopback only). Pass `host: '0.0.0.0'` to restore the old behavior.
- **bwserve `allowExec` removed from shell options** -- `allowExec` no longer passed to `generateShell()`.

### New APIs

- **`bw.create(taco, options)`** -- create a detached DOM element from a TACO (renamed from `bw.createDOM()`).
- **`bw.hydrate(el, taco)`** -- attach lifecycle (handles, slots, state, hooks) to an existing DOM element using a TACO's `o` block. Shared implementation with `bw.create()`.
- **`bw.mountTree(el)`** -- walk a subtree and fire `o.mounted` hooks on all lifecycle-managed elements. Called automatically by `bw.mount()`, `bw.append()`, `bw.replace()`.
- **`bw.unmount(el)`** -- tear down lifecycle hooks and remove element from DOM (renamed from `bw.cleanup()`).
- **`bw.unmountChildren(el)`** -- unmount all lifecycle-managed children of an element without removing the element itself.
- **`bw.remove(ref)`** -- unmount + remove an element by reference, ID, or UUID.
- **`bw.detach(el)`** -- remove an element from DOM without firing unmount hooks (keep-alive pattern).
- **`bw.append(target, content, opts)`** -- create and append a TACO as a new child of a target element.
- **`bw.replace(ref, taco)`** -- replace an existing element with a new TACO, preserving position in the DOM.
- **`bw.refresh(ref)`** -- re-invoke `o.render` on a stateful component. Replaces the v2.0.x `bw.update(target)` for re-rendering.
- **`bw.updateSlot(ref, name, value)`** -- update a named slot on a component by reference.
- **`bw.syncChildren(parentEl, items, opts)`** -- reconcile a parent's children against a data array using keyed identity. Minimal DOM mutations (add/remove/reorder).
- **`bw.derive(inputs, fn, outTopic, opts)`** -- derived pub/sub: subscribe to multiple input topics, compute a derived value, publish to an output topic. Auto-disposes on element unmount.
- **`bw.actions`** -- declarative event dispatcher. Elements with `bw_act_*` classes dispatch to registered action handlers. Replaces `data-bw-action` attributes.
- **`bw.connect(url)`** -- establish a bwserve SSE connection from client code. Returns a remote handle.
- **`bw.registerRemote(name, fn)`** -- register a named remote handler for bwserve protocol.
- **`bw.$.one(selector)`** -- return the first matching element (like `querySelector` but via `bw.$` resolution).
- **`bw.loadStructural()`** -- inject structural CSS only (component layout, no theme colors). Explicit alias for `bw.loadStyles()` with no config.
- **`bw.setThemeMode(mode, scope)`** -- programmatically set theme mode to `'primary'` or `'alternate'` (vs `bw.toggleThemeMode()` which toggles).
- **`bw.janitor`** -- document-level MutationObserver that catches elements removed without `bw.unmount()`. Three layers: observer, pending queue, flush. Prevents lifecycle leaks from `innerHTML =` or framework-managed teardown.
- **`bw._debug()`** -- diagnostic introspection: returns object with lifecycle counters, janitor state, pub/sub stats, nodeMap size.
- **`bw._resetForTest()`** -- reset all internal state for test isolation.

### Security

- **bwserve path traversal fix** -- static file serving now resolves paths against the static root and rejects traversal attempts (`GET /../../etc/passwd` returns 403). Uses `path.resolve()` containment check.

### bwserve

- Static files now take priority over registered page routes, making bwserve a drop-in static server with opt-in SSE superpowers.
- Default host changed from `0.0.0.0` to `127.0.0.1` (loopback). Pass `host: '0.0.0.0'` to expose on all interfaces.
- Port `0` accepted (OS-assigned port).
- `bwserve.d.ts` TypeScript definitions added.

### bwcli

- `bwcli serve` path traversal hardened.
- Lint expansion: `npm run lint` now covers all files under `src/` (was `src/bitwrench.js` only).
- Playwright E2E wired into `npm run release` pipeline.

### Embedded

- Root-level `CMakeLists.txt`, `library.json`, `library.properties`, `idf_component.yml` moved to project root for PlatformIO/ESP-IDF discovery.
- `embedded_c/bitwrench.h` and `embedded_c/bwserve.h` updated for v2.1 API names.
- `embedded_rust/Cargo.toml` version bump.
- New `examples/embedded-basic/` with ESP32-S3 Arduino + CircuitPython examples and dashboard template.

### Build & Tooling

- **drift-lint** (`tools/drift-lint.js`) -- new tool that scans docs, pages, and examples for stale API references, removed patterns, and doc/source drift. Three rule kinds: name rules, structural rules, API cross-reference. Documented in `docs/drift-lint.md`. Wired into release pipeline via `npm run lint:drift`.
- **Release script** (`tools/release.js`) expanded: drift-lint gate, E2E gate, improved error messages.
- `bitwrench-util-color` standalone build added to dist/ (UMD, ESM, CJS, ES5).
- `src/bitwrench.h` and `src/bwserve.h` C header stubs added for embedded FFI.

### Docs

- **`docs/thinking-in-bitwrench.md`** -- new progressive walkthrough (static HTML to server-driven app). Explains WHY bitwrench works the way it does. Primary teaching doc for new users and LLMs.
- **`docs/bitwrench-northstar-principles.md`** -- moved from `dev/` to `docs/`. Core design philosophy.
- **`docs/component-lifecycle.md`** -- new doc covering mounted, unmount, handles, slots, state, janitor.
- **`docs/drift-lint.md`** -- drift-lint usage and rule authoring guide.
- **`llms.txt`** -- new file (robots.txt for LLMs). Mental model, common mistakes, quick start, doc map.
- **`agents.md`** -- new file. Instructions for AI coding agents: required reading, five patterns, removed APIs.
- `docs/bitwrench_api.md` -- updated for all v2.1 renames and new APIs.
- `docs/bwserve.md` -- rewritten for v2.1 protocol changes and security.
- `docs/state-management.md` -- rewritten: `bw.refresh()` replaces `bw.update()`, three-level model clarified.
- `docs/llm-bitwrench-guide.md` -- updated for v2.1 API names and patterns.
- Size claims updated across all docs, pages, and examples: `~45 KB gzipped` (was `~40 KB`), on-disk `~165 KB` (was `~130 KB`).
- "Reactive/reactivity" language replaced with "explicit stateful" throughout docs.

### Tests

- Test suites expanded significantly: new bundles test, component tests, coverage gap tests, MCP knowledge/tools tests.
- `test/bitwrench_test_lifecycle.js` removed (replaced by new lifecycle tests integrated into other suites).

### Internal

- Compound operations (`mount`, `append`, `replace`, `remove`, `refresh`) built on atomic primitives (`create`, `mountTree`, `unmount`, `unmountChildren`).
- `bw_is_component` / `bw_is_component_<type>` CSS classes added to elements with lifecycle options.
- Per-render function registry replaces global funcRegistry counter snapshot.
- `bw.flush()` removed (was a no-op).
- `bw._extractDeps`, `bw._dirtyComponents`, `bw._flushScheduled`, `bw._scheduleFlush`, `bw._doFlush` removed.
- `bw._allowExec` removed from core (bwserve-only concern).

## v2.0.32 (2026-04-26)

- Fix `bwcli serve` root path priority: static files now served before registered bwserve page routes, so `bwcli serve .` works as a drop-in static server (like `python -m http.server`) with opt-in bwserve features.

## v2.0.31 (2026-04-12)

- CI publish fix: drop `registry-url` from GitHub Actions publish step, use `npm@latest` for OIDC provenance compatibility.

## v2.0.30 (2026-04-12)

- `bwcli serve` input port resilience: if the input port (default 8903) is already in use, automatically picks a free port and logs the fallback. Fixes #67.
- "Ready" message now prints after both web and input servers are bound (was printing before input server was ready).

## v2.0.29 (2026-04-11)

### bwserve

- Directory listings: when a URL resolves to a directory with no `index.html`, bwserve generates an HTML directory listing (opt-out via `dirList: false`).
- MIME type expansion: added `.txt`, `.xml`, `.pdf`, `.zip`, `.gz`, `.mp3`, `.mp4`, `.webm`, `.webp`, `.avif`, `.wasm`, `.csv`, `.md`, `.mjs`.
- Configurable bind address: `host` option (default `0.0.0.0`) for controlling which interface bwserve listens on.

## v2.0.28 (2026-04-11)

- Dependency updates: eslint 8 to 10 (FlatConfig), jsdom 25 to 26, Playwright 1.54 to 1.59. Added `@eslint/js` and `globals` packages.

## v2.0.27 (2026-04-11)

### New APIs

- **`bw.el(target, apply?)`** -- public element resolver. Accepts DOM element, id string, CSS selector (`#id`, `.class`), or UUID class. Returns first matching element or null. Optional `apply` arg: string (textContent), function (called with el), TACO (mount), or array (append items). Replaces internal `bw._el()`.
- **`bw.$(selector, apply?)`** -- now accepts optional `apply` second arg, same semantics as `bw.el()` but applied to every matched element.
- **`bw.toggleThemeMode(scope?)`** -- renamed from `bw.toggleStyles()`. Toggles primary/alternate palette on ALL matching elements (was first-only). `bw.toggleStyles` kept as alias for one release cycle.
- **`bw.inspect(target, depth)`** -- rewritten. Returns a plain-object tree with bitwrench metadata (tag, uuid, type, handles, state, hasRender, hasSubs, refs, children). Recursive with configurable depth (default 3). Old `bw.inspect()` only logged to console.
- **Wildcard subscriptions** -- `bw.sub('ns:*', handler)` matches any topic starting with the prefix before `*`. Handler receives `(detail, topic)`. Works with `bw.once()`, element lifecycle, and `bw.unsub()`. Bare `'*'` matches all topics.
- **`bw.once(topic, handler, el)`** -- subscribe for a single event; auto-unsubscribes after first fire. Returns cancel function.
- **`bw.formData(target)`** -- collect all form inputs from a container into a plain object.
- **`bw.catalog([type])`** -- introspect the BCCL component registry.
- **`bw.jsonPatch(obj, ops)`** -- RFC 6902 JSON Patch on plain objects (add, remove, replace, move, copy, test).

### Component Engine

- **SVG namespace support** -- `bw.create()` detects SVG context and uses `createElementNS()`. `{t:'svg'}` starts SVG context; child elements inherit it. `foreignObject` children revert to HTML namespace. All lifecycle features work on SVG elements.
- **Slot caching fix** -- `o.slots` setters/getters now cache the target element at creation time instead of calling `querySelector` on every invocation.
- **`o.type` wiring** -- `o.type` in TACO options now sets `el._bw_type` on the DOM element for component type introspection.
- **Error boundaries** -- `o.mounted`, `o.unmount`, and `o.render` wrapped in try/catch; errors logged via `console.warn` instead of crashing the component.

### Breaking Changes

- **`bw.inspect()` signature changed** -- now takes `(target, depth)` and returns a plain object. No longer logs to console.

### bwserve

- **`client.inspect(selector?, opts?)`** -- server-side DOM tree inspection. Calls `_bw_tree` builtin on the client.

### CLI

- **`/inspect` command** -- renamed from `/tree` in bwcli attach REPL. `/tree` kept as alias.

### Internal

- `bw._el` renamed to `bw.el()` (public API). `bw._el` kept as alias for one release cycle.
- `_applyTo()` internal helper shared between `bw.el()` and `bw.$()`.

## v2.0.26

v2.0.26 was developed on a feature branch but never released to npm or tagged. Its changes were included in v2.0.27.

## v2.0.25 (2026-03-15)

### Site CSS Architecture

- Replaced `shared-theme.js`/`shared-theme.css` with palette-driven `site.js`: all site chrome CSS generated via `bw.css()` from palette objects, no CSS custom properties.
- Site CSS split into structural + per-component themed rule functions.
- Dark mode auto-generated via `bw.scopeRulesUnder()`.
- Migrated all 25+ doc pages from old class names to BCCL flat-class pattern.

### Core

- `bw.loadStyles()` now returns the full styles object (palette, rules, etc.) instead of just the style element.
- `bw.scopeRulesUnder()` exposed as public API.
- Theme color tuning: interactive elements use `tertiary` palette.
- `bw_text_muted` uses `palette.secondary.base` instead of hardcoded `#6c757d`.

### Embedded Examples

- New tutorial-depth examples: ESP32, Pico W (MicroPython + CircuitPython), Raspberry Pi.
- Adafruit ST25DV16 NFC example with I2C register-level detail.
- Examples gallery reorganized with category cards.

### Docs & Testing

- TypeScript definitions (`bitwrench.d.ts`) for full public API.
- Test coverage to 97%.
- New test suites for bwserve, MCP, code editor.

## v2.0.24 (2026-02-28)

- Fix flatted CVE (prototype pollution via `parse()`).

## v2.0.23 (2026-02-15)

- MCP server, MCP tools, live rendering via bwserve.
- `bwmcp` CLI entry point (`bin/bwmcp.js`).
- MCP stdio transport, tool dispatch, knowledge base.

## v2.0.22 (2026-02-01)

- README fixes and documentation cleanup.

## v2.0.21 (2026-01-15)

- `bw.router()` client-side hash router.
- Removed legacy v1.x source (`src_1x/`).
- Updated homepage, docs, and tutorial pages.

## v2.0.20 (2025-12-15)

- Updated logo and branding.

## v2.0.19 (2025-12-01)

- **Identity unification**: removed `data-bw_id` attributes and `bw_id_*` classes; all identity via `bw_uuid_*` classes + `bw_lc` marker class.
- **`o.handle` / `o.slots`**: replacement for ComponentHandle; methods on `el.bw`, slots auto-generate setters/getters.
- **`bw.mount()`**: like `bw.DOM()` but returns root element for `el.bw` access.
- **Removed `bw.component()`, `bw.compile()`, `bw.when()`, `bw.each()`** -- all now throw Error.
- Eliminated all `data-*` attributes from bitwrench.js and bitwrench-bccl.js.
- Debug toolkit additions.

## v2.0.18 (2025-11-15)

- `bwserve` attach protocol and `bwcli attach` for live DOM inspection.
- Structural CSS cleanup: all pages use `bw.loadStyles()` instead of `<link>` tags.
- `bw.u()` utility CSS extracted to plugin (`bitwrench-util-css.js`).
- Component structural CSS improvements.
- Embedded and server example updates.

## v2.0.17 (2025-10-15)

- Documentation overhaul: HTML generation docs, enhanced examples.
- Bug fixes: local `_to`/`_toa` scope, minor component fixes.
- Build metrics tracking.

## v2.0.16 (2025-09-15)

- **`bwserve`**: real-time server-driven UI over SSE (~200 LOC).
- `bwserve` protocol: 9 message types (replace, append, patch, remove, eval, screenshot, etc.).
- `bwcli` CLI tool for file conversion, markdown-to-HTML, theme presets.
- Phase 2 component handles.
- State management patterns documented.

## v2.0.15 (2025-08-15)

- Explicit stateful component model (`o.state`, `o.render`, pub/sub).
- `bw.u()` utility CSS classes.
- BCCL component registry and `bw.make()` factory dispatch.
- Dead code elimination.
- `start-release` / `release` workflow scripts.

## v2.0.14 (2025-07-15)

- BCCL component and theme consistency fixes.
- Removed accidentally committed root `CLAUDE.md`.
- Updated release procedure docs.

## v2.0.13 (2025-06-15)

- Refresh SRI hashes and build artifacts.

## v2.0.12 (2025-05-15)

- Dogfood all pages with bitwrench components.
- Visual test fixes and content polish.
- BCCL parity improvements.

## v2.0.11 (2025-04-15)

- `bw.makeBarChart()` component.
- LLM integration guide (`docs/llm-bitwrench-guide.md`).
- BCCL bug fixes, page cleanup.
- `start-release` script for feature branch dev cycles.

## v2.0.10 (2025-03-15)

- Release script automation.

## v2.0.9 (2025-02-15)

- `bw._nodeMap`: O(1) node reference cache for UUID/ID lookups.
- Fix dependabot alerts (mocha vulnerable deps override).
- CI/publish pipeline fixes.

## v2.0.8 (2025-01-15)

- bwserve protocol design doc.
- Renamed default branch to `main`.
- Release procedure documentation.

## v2.0.7 (2024-12-15)

- CI/CD workflow updates.

## v2.0.6 (2024-11-15)

- npm publishing setup.

## v2.0.5 (2024-10-15)

- npm workflow updates.

## v2.0.4 (2024-09-15)

- Initial v2.x release on npm.
- TACO format, `bw.html()`, `bw.create()`, `bw.DOM()`.
- Color utilities, random data generation, cookie handling.
- UMD/ESM/CJS/ES5 build formats via Rollup.
