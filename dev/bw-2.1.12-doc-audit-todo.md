# v2.1.12 doc + page audit: remediation list

Source: four parallel audits of `docs/`, `pages/`, root `*.md` and a dead-API
sweep, run 2026-10-09. Every item below was verified against source before
being listed. Severity:

- **BROKEN** -- following it errors or silently does nothing
- **VIOLATION** -- breaks a north-star rule (rule number given)
- **MISLEAD** -- runs but teaches the wrong model
- **STALE** -- outdated but harmless

Status: `[ ]` todo, `[x]` done, `[~]` deliberately not doing (reason given).

---

## 0. Done before this list existed

- [x] Library: `o.render` + `o.mounted` both now run (render first). 7 tests.
- [x] `src/mcp/live.js` wire shape -> `ref`/`taco`/`text`/`attrs`. Cross-layer
      test `test/bitwrench_test_mcp_wire.js`, 6 tests.
- [x] `RELEASE-PROCEDURE.md` rewritten against `tools/release.js`.
- [x] `CONTRIBUTING.md` release section -> pointer; dead `test:all` and
      `build:index` commands fixed.
- [x] `bw.unmount()` semantics in `agents.md` x2 + `llms.txt`; `bw.remove` row added.
- [x] `agents.md` coverage figure 80% -> real 99/96/95 gates.
- [x] `ABOUT.md` 40KB -> 46KB (x2); README coverage badge 98 -> 99.
- [x] `llms.txt` 7th option key `type`; stray `\$` escape.
- [x] Dead `colorInterp` in `bitwrench-utils.js`; JSDoc on the live one;
      `docs/bitwrench_api.md` signature. Meta test for dead exports.
- [x] Unminified bundle size claims 114KB -> 118KB (README, quickstart, readme.html).

---

## 0b. Found and fixed by the new page smoke test

The smoke test (`tests/pages-smoke.spec.js`, item 7.5) caught these on its
first run -- none were in any audit, because nothing had ever loaded the pages:

- [x] `pages/20-embedded.html` called `site.makeDemoSection({title, body})`
      **eight times**, but the helper takes `(id, title, description, content)`.
      So `id` got the object and title/content were undefined: all eight
      sections rendered as empty shells, which is also why
      `#lang-tabs-container` never existed and `renderTabs()` warned
      "target not found". Converted to positional with real section ids.
- [x] `pages/03-styling.html` -- `makeTableFromArray({style})` is not an
      accepted option; wrapped in a styled div instead.
- [x] `pages/20-embedded.html` -- `makeTable({compact:true})` silently ignored.
- [x] `pages/component-gallery.html` -- `makeButton({content:[...]})` ignored;
      the rich-content prop is `text`, which accepts a TACO array.
- [x] `pages/09-builds.html` -- download link to `bitwrench.cjs.min.js`, which
      is not built (the artifact is `bitwrench.min.cjs`). Two sites.
- [x] `pages/09-builds.html` -- `../embedded_c/`, `../embedded_python/`,
      `../embedded_rust/` have no index.html, so they 404 on the published
      site. Now point at the repo tree.
- [x] `pages/thinking-in-bitwrench.html` -- renders `docs/*.md` at `/pages/`,
      so all 10 relative doc links 404'd, and quikdown italicised the
      underscores inside `bitwrench_typescript_usage.md`, producing a href
      with nested quotes. Added `repairDocLinks()` for both.
- [x] `pages/site.js` -- `makeDemoSection` emitted an empty `<p>` when there
      was no description.


## 0c. Found while fixing (not in any audit)

- [x] **The API-reference generator corrupted every multi-line `@example`.**
      `tools/lib/api-extract.js` read comment-parser's flattened `description`,
      so a multi-line example became one line and the first `//` comment
      swallowed every statement after it. `bw.once`'s published example was
      syntactically invalid. Now reads the raw comment lines. (My first two
      fixes landed in `parseAPIs`/`parseComponents` inside the two build
      scripts -- which turn out to be **dead code** duplicating
      `tools/lib/api-extract.js`. Worth deleting; filed below.)
- [x] **`bwserve.create({theme:'ocean'})` discarded the preset name** and
      hardcoded a teal pair, so `bwcli serve --theme forest` silently produced
      the default while the CLI help promised both preset names and a
      "#pri,#sec" pair. Both forms now work; an unknown name warns. 7 tests.
- [x] **4 declared named exports did not exist.** `makeTable`,
      `makeTableFromArray`, `makeDataTable` and `makeBarChart` were declared in
      `bitwrench.d.ts` but live on `bw` rather than in `bitwrench-bccl.js`,
      which is what the entry re-exports. `import { makeTable }` type-checked
      and came back undefined. Now exported, with a meta test.
- [x] **`CardConfig.shadow` allowed `boolean`** -- measured: `shadow: true`
      emits no class at all, because `shadowClasses[true]` is undefined.
      Narrowed to the four real levels.
- [x] **`naturalCompare` in a function-reference position** (`.sort(naturalCompare)`)
      and `Object.keys(BCCL)` were missed by the prefix pass; both fixed.
- [x] Four `[...]` / `{ ... }` literal-ellipsis examples made concrete.
- [x] The doc harness leaked `bw._nodeMap` into the next suite once it covered
      400+ blocks, breaking the embedded-C tests. Cache cleared per block.
- [x] `component-lifecycle.md`'s `el.bw.update is not a function` was a
      **false positive** in the audit: the harness ran blocks in isolation, so
      the handle defined in an earlier block was missing. Marked sequential;
      the file now has zero skips and every block passes.

## 1. Pages: BROKEN

- [x] `pages/self-load-test.html:34,35,36,37,40,47` -- reads `f.name`;
      `builds.json` entries use `file`. TypeError is swallowed, all four
      tables print "No files found", and the "UMD min gzip under 40 KB"
      health check always passes while the real value is 45.8 KB.
      Fix `f.name` -> `f.file`, and correct the 40 KB threshold to the 46 KB budget.
- [x] `pages/10-themes.html:1400` -- `{t:'style', c: bw.raw(themeA.css + themeB.css)}`.
      `makeStyles()` is unscoped, so themeB wins globally and both panels
      render identically. Use `bw.applyStyles(themeA, '.demo-ocean')` +
      `bw.applyStyles(themeB, '.demo-sunset')`.
- [x] `pages/10-themes.html:994` (with `:983`) -- injects
      `result.css + result.alternateCss` raw; `alternateCss` is unprefixed and
      carries a global `body` rule, so the preview always shows the alternate
      palette and a `body` rule leaks site-wide. Use
      `bw.applyStyles(result, '#theme-preview')` + `bw.setThemeMode(mode, '#theme-preview')`.
- [x] `pages/shared-nav.js:306,428` -- `bw.applyStyles({css: ...})` has no
      `.rules`, so it warns `invalid styles object` and returns null on every
      theme toggle on every page. Delete 301-308 and the `:428` call; use
      `bw.toggleThemeMode()` / `bw.setThemeMode(savedMode)`.
- [x] `pages/13-code-editor.html:226` -- `from 'bitwrench-code-edit'` is not a
      package; the subpath export is `bitwrench/code-edit`.
- [x] `pages/12-bwserve-protocol.html:930` -- href `bwserve-sandbox.html` 404s;
      the file is `14-bwserve-sandbox.html`.

## 1b. Design-spirit pass (not a bug list -- a model correction)

- [x] `docs/framework-translation-table.md` taught the React model in
      bitwrench syntax: "State update / change state and trigger re-render"
      with `el._bw_state.x = 42; bw.refresh(el)` -- poking a **private** field
      from outside, then rebuilding the subtree. In the one doc whose job is
      translating away from React. Six cells corrected to the method-call
      model (`el.bw.setX(42)`, slots for text, computed values inside the
      handle), plus a "Why the bitwrench column reads differently" section
      with the measured cost.
- [x] Measured and encoded the reason: `bw.refresh()` clears the element and
      re-runs `o.render`, so a half-typed input value and focus are both
      destroyed; `el.bw.inc()` updates the counter and preserves both. Six
      tests in `test/bitwrench_test_new_apis.js` ("update path: methods vs
      re-render") pin this down, including `bw.update` dispatching to the
      handle and `o.slots` generating the accessor pair.
- [x] Guard against the lifecycle fix drifting into reactivity: a test asserts
      that mutating `el._bw_state` renders nothing until an explicit
      `bw.refresh()`. Composing render+mounted must stay an explicit
      lifecycle, not dependency tracking.

## 2. Pages: VIOLATIONs

- [x] `pages/shared-nav.js:300,309,310,425,429,437` (rules 1+5) -- hand-rolled
      `document.documentElement.classList` + `getElementById('bw_style_global')`
      theme toggle. Replace with `bw.toggleThemeMode()` / `bw.setThemeMode()`.
- [x] `tools/build-api-reference.js:307,368` (rule 2) -- emits 246
      `data-api-name` + 15 `data-category` into `pages/08-api-reference.html`.
      Carry names in a closure data array or a `bw_api_<name>` class.
- [x] `tools/build-api-reference.js:549-577` (rule 1) -- search filter is pure
      raw DOM. Emit the entry list as data, re-render matches with `bw.DOM()`.
- [x] `tools/build-api-reference.js:445-450` (rule 4) -- hardcoded `#d0d0d0`,
      `#006666` x2, `#888`. Map to `p.light.border`, `p.primary.base`, `p.secondary.base`.
- [ ] `pages/state-debug.html:321,341,345,371,611,621,838,897,900` (rule 2) --
      nine `data-*` sites; `data-tab` is written then read back with
      `getAttribute`, i.e. state stored in the DOM. `:426` ships
      `data-card-name` inside a teaching sample.
- [ ] `pages/state-debug.html:320-325` (rule 4) -- `bw.injectCSS()` with a
      4-line raw CSS string and hardcoded hex.
- [ ] `pages/15-html-generation.html:143,192,321` (rule 1) -- three live
      editors teach `target.innerHTML = '<p>' + ...` on the page whose job is
      to teach bitwrench's string API.
- [ ] `pages/20-embedded.html:18,23-52` (rule 4) -- binds `styles.palette` then
      never uses it; ~16 hardcoded dark hex values, unresponsive to theme toggle.
- [ ] `pages/05-state.html:1830` + `pages/11-debugging.html:1038` (rule 1) --
      duplicated block reads rendered output back out of the DOM and does
      `replaceChild` surgery. Build the `bw.codeEditor()` TACO in the original render.
- [ ] `pages/06-tic-tac-toe-tutorial.html:1533-1550,535-545` (rules 4+6) --
      flagship sample teaches a ~20-line hardcoded `<style>` block and
      "Include bitwrench.css".
- [ ] `pages/06-tic-tac-toe-tutorial.html:366,367` (rule 1) -- hand-rolled tabs
      via `querySelectorAll`, when `site.createTabbedDemo()` exists.
- [ ] `pages/14-bwserve-sandbox.html:735,762` (rule 2) -- `data-preset` written
      then read back; `key` is already in the closure.
- [ ] `pages/14-bwserve-sandbox.html:516,540,545` (rule 1) --
      `doc.querySelector(msg.ref)` although `win.bw.el()` is used on the
      sibling path at `:521`.
- [ ] `pages/component-gallery.html:31,44` (rule 2) -- `data-theme` written then
      read as `el.dataset.theme`.
- [x] `pages/10-themes.html:983` (rule 5) -- manual `' bw_theme_alt'` string
      composition instead of `bw.setThemeMode(mode, scope)`.
- [~] `pages/site.js:1018` (rule 2) -- `data-goatcounter`. Deliberate: it is
      GoatCounter's published third-party contract, documented at `:977-981`.
      No change.

## 3. Pages: STALE

- [x] `pages/09-builds.html:650` + `pages/17-bwcli.html:649` -- both link
      `11-debugging.html#section-9`; the real id is `section-bwd`.
- [ ] `pages/03-styling.html:170` -- "These example pages use this approach"
      next to a `<link bitwrench.css>` sample. No page does; all use `bw.loadStyles()`.
- [x] `pages/10-themes.html:454-455` -- "every call to `bw.makeStyles(config)`
      produces CSS rules scoped under a global class". False, and the direct
      cause of the two BROKEN bugs above.
- [ ] `pages/09-builds.html` -- orphaned, superseded by `09-downloads.html`.
      Delete or redirect. (Decision needed.)
- [ ] `pages/shared-nav.js:40-62` -- nav omits `src-sizes`, `state-debug`,
      `self-load-test`, `component-gallery`, `css-test/`, `09-builds`.
- [ ] `pages/12-bwserve-protocol.html:8-10` -- calls `site.makeCodeBlock` 31
      times without loading `bitwrench-code-edit.umd.min.js`, so all 31 blocks
      silently degrade to unhighlighted `<pre>`.
- [ ] `pages/index.html:343-354` -- `applyThemePreset()` does not update the
      nav glyph or the `bw_theme_mode` cookie, so nav and actual mode desync.
- [ ] `pages/site.js:977-983` -- comment says `pages/index.html` is an 11-line
      stub; it is 663 lines and does load site.js. The stub is the repo-root one.
- [x] `pages/self-load-test.html:78-83` -- `sourceInfo` omits
      `bitwrench-utils.js` and `bitwrench-verify.js`.
- [ ] `pages/self-load-test.html:231-245` -- raw `XMLHttpRequest`; use
      `bw.loadClientFile()` as `09-builds.html:525` does.
- [x] `pages/shared-nav.js:122` -- `window.bw.version || '2.0.4'` fallback is
      eight patch versions stale.

## 4. Docs: BROKEN (API/reference set)

- [x] `docs/bitwrench-mcp.md:129,138,201,292,294,305` -- documents the live
      render path that was dead; now fixed in source, so re-verify the doc
      against the corrected wire shape. Also `:203,302` `query_dom` ->
      `inspect_dom({selector, depth})`; `:159` section `levels` -> `materialization`.
- [ ] `docs/theming.md:350-373` -- "multiple themes on one page" uses two
      global `bw.loadStyles()` calls; the second replaces the first. Scoping is
      the 2nd arg.
- [ ] `docs/theming.md:102` -- `inject: true` option does not exist.
- [ ] `docs/taco-format.md:115,127,151` -- teaches `o: {raw: true}`; no
      renderer path reads it. Only `bw.raw()` and `bw.html(taco, {raw:true})`.
- [ ] `docs/state-management.md:393-405` -- `a: {class: bw.uuid('temp')}` then
      `bw.patch('temp', ...)`; `bw.uuid()` is not a resolvable token.
- [ ] `docs/state-management.md:358-377,548-562,586-616,742-762,764-781` -- five
      examples supply `mounted` + `render`. **Now fixed by the library change**;
      verify each renders and drop any "render is called at mount" caveat that
      is now wrong.
- [ ] `docs/bitwrench_typescript_usage.md:80-83,166-168` -- `o.render` written
      as mutate-in-place; `bw.refresh()` clears `innerHTML` first, so it throws.
- [ ] `docs/bitwrench_typescript_usage.md:213-215` -- `makeTabs({tabs:[{text}]})`
      -> `label`. `:199` `makeCard({shadow:true})` -> `'md'`.
- [x] `docs/routing.md:103-137` -- claims a four-tier match priority;
      `matchRoute()` is a single loop in registration order.
- [x] `docs/routing.md:249` -- router example with no `target`, so nothing
      mounts and `mounted` never fires.
- [x] `docs/routing.md:496` -- `makeTable({columns:['name',...]})`; source reads
      `col.key`/`col.label`/`col.render`.
- [x] `docs/bwserve.md:139-142,265-270,809-813` -- `batch` ops shown without
      `v:1`; `bw.apply` rejects them.
- [x] `docs/bwserve.md:631` + `docs/cli.md:175` -- `--input-port` -> `--listen`.
- [ ] `docs/cli.md:92` -- claims themes need `--standalone`/`--cdn`; theme CSS
      is inlined unconditionally.
- [x] `docs/bw-attach.md:197,71,200-208` -- `/patch` documented as working;
      source passes a bare string (see item 6.1).
- [x] `docs/svg.md:204,227-240` -- teaches `bw.syncChildren` for SVG; it does
      not thread SVG namespace (see item 6.2).
- [ ] `docs/component-library.md:146` + `docs/component-cheatsheet.md:27` --
      `makeAlert({title})` is ignored (and now warns).
- [ ] `docs/component-library.md:241` + `docs/component-cheatsheet.md:37` --
      `steps: ['a','b']` and `desc` -> objects with `label`/`description`.
- [ ] `docs/component-library.md:399-405` -- `makeFormGroup` listing omits
      `input` and invents `error:`; real API is `validation` + `feedback`.
- [ ] `docs/state-management.md:713` -- "auto-cleanup via `handle.sub()`";
      ComponentHandle-era. Pass `el` as `bw.sub`'s 3rd arg.
- [x] `docs/state-management.md:850` -- says `bw.compile` is `undefined`; it is
      a live function that throws, so `if (bw.compile)` takes the wrong branch.
- [x] `docs/bwserve.md:886-890,909` -- attach transcript shows bare JS input,
      removed in v2.1.

## 5. Docs: BROKEN (guides/tutorials set)

- [x] `docs/quickstart.md:166-205` -- flagship task list. **Fixed by the
      library change**; the `// render() is called once at mount` comment is now
      true. Verify and leave.
- [ ] `docs/tutorial-website.md:186` -- mounts `#contact-wrapper`, which never
      exists; `:187` then throws. Step 8 composes `contact` not `contactForm`.
- [ ] `docs/tutorial-website.md:95-98` -- `desc:` -> `description`.
- [ ] `docs/thinking-in-bitwrench.md:1099,1360` -- `bw.parseJSONFlex("{name:'x'}")`
      throws; needs the `r` prefix, and unquoted keys never work.
- [ ] `docs/thinking-in-bitwrench.md:1220,1221` -- `--input-port` -> `--listen`;
      curl payload missing `v:1`.
- [ ] `docs/llm-bitwrench-guide.md:730` -- type `Styles` -> `StylesResult`.
- [ ] `docs/llm-bitwrench-guide.md:564` -- `navEl.bw.setActive()`; `makeNav`
      returns no `o`, so `.bw` is undefined.
- [x] `docs/tutorial-bwserve.md:125-129,245` -- `client.batch(op, op)` varargs;
      signature is `batch(ops)` taking one array.
- [x] `docs/tutorial-bwserve.md:246` -- `client.message(level, text)`; real
      signature is `message(ref, action, data)`.
- [x] `docs/tutorial-bwserve.md:138-140` -- `client.on('disconnect')` never
      fires; the interval leaks per reconnect.
- [x] `docs/tutorial-bwserve.md:166` -- `client.call('scrollTo', {obj})`;
      built-in takes a selector string.
- [x] `docs/tutorial-bwserve.md:185` -- `theme:'ocean'`; bwshell ignores the
      name and hardcodes `{primary:'#006666'}`.
- [ ] `docs/tutorial-embedded.md:236-244` -- `cmake .. && make` FATAL_ERRORs
      unless the generated header exists; needs `npm run build:generated` first.
- [ ] `docs/tutorial-embedded.md:206` -- hand-rolled r-prefix parser corrupts
      the escaping the same doc teaches at `:271-279`.
- [x] `docs/framework-translation-table.md:14` -- `${x}` needs `compile:true`
      and resolves against render options' `state`, not `o.state`.
- [x] `docs/framework-translation-table.md:21` -- `bw.responsive()` returns a
      CSS string and applies nothing; prop is `gridTemplateColumns`.
- [x] `docs/framework-translation-table.md:28` -- router with no `target`.
- [x] `docs/bitwrench-for-wasm.md:200-201,398-408` -- `bw.DOM('#app', JSON.parse(render()))`
      where `render()` returns a protocol message, not a TACO.
- [x] `docs/bitwrench-for-wasm.md:217-218,247-249,277-279` -- `.forEach` on a
      single object.
- [x] `docs/bitwrench-for-wasm.md:336-343` -- classes `bw_bccl_stat_card/_value/_label`
      do not exist; real are `bw_stat_card`/`bw_stat_value`/`bw_stat_label`.
- [x] `docs/bitwrench-for-wasm.md:570-580` -- returns uninitialized
      `static char buf[256]`.

## 6. Source bugs surfaced by the audits (not yet fixed)

- [x] 6.1 `src/cli/attach.js:421` -- passes a bare string where `client.patch`
      needs `{text}`, so `/patch` never applies while the REPL prints
      "Patched". `test/bitwrench_test_attach.js:911` asserts only that the call
      happened. Needs a test that asserts the DOM changed.
- [x] 6.2 `bw.syncChildren` / `bw.append` / `bw.patch`-with-TACO do not thread
      SVG namespace context (`src/bitwrench.js:2493` calls `bw.create()` with
      no `_svgCtx` from `parentEl.namespaceURI`), so nodes land in the XHTML
      namespace and never render.
- [x] 6.3 `src/cli/index.js:39,55` -- top-level `--help` advertises port 7902;
      `src/cli/serve.js:321` defaults to 8080 web / 9000 listen.
- [x] 6.4 `src/bitwrench-router.js` -- `bw.link()` ignores `mode` and always
      prefixes `#`; guards (`before`) run *after* the URL is written and the
      URL is never reverted; JSDoc:107-111 claims a `stop` method and
      `(params, query)` handler args that do not exist.
- [x] 6.5 `src/bitwrench.d.ts` -- `syncChildren` signature wrong;
      `makeTable`/`makeTableFromArray`/`makeDataTable` declared as named ESM
      exports but are `undefined` on import; `CardConfig.shadow` too loose;
      `RouterConfig.before/after` arity wrong.
- [x] 6.6 `src/bitwrench.js:1326` -- comment says "clone so TACO isn't
      retained" above a reference assignment.

## 7. Automation (the durable half)

- [x] 7.1 Prefix the 90 bare `make*(...)` calls in `@example` blocks
      (`src/bitwrench-bccl.js` 70, `src/bitwrench-utils.js` 19,
      `src/bitwrench.js` 1) with `bw.`, then regenerate `docs/bitwrench_api.md`.
      Those files contain zero imports and already use `bw.DOM(`, so the
      global-object style is the authorial intent.
- [x] 7.2 Add `docs/bitwrench_api.md` to `test/bitwrench_test_doc_examples.js`
      so every JSDoc `@example` executes. 115 blocks; expect skip markers.
- [x] 7.3 Add the 14 untested docs with runnable blocks to the same test
      (`thinking-in-bitwrench` 55, `routing` 22, `bwserve` 21,
      `component-lifecycle` 12, `tutorial-website` 9, `tutorial-bwserve` 7,
      `app-patterns` 4, `bitwrench-for-wasm` 4, `drift-lint` 4, +5 small).
      270 blocks total currently unexecuted.
- [x] 7.4 The doc harness asserts "does not throw", not "renders something" --
      which is why the broken quickstart passed. Add an output assertion for
      blocks that mount.
- [x] 7.5 Page smoke test (`tests/pages-smoke.spec.js`, 31 checks, auto-discovers new pages): load all 30 `pages/*.html` and fail on any console
      error or `bw.*` TypeError. Only 8 of 30 are visited by `tests/*.spec.js`
      today, so a dead API call on the other 22 fails forever in silence.
- [ ] 7.6 drift-lint rule: BCCL prop names. `makeNav`/`makeBreadcrumb` ->
      `text`, `makeAccordion` -> `title`, `makeTabs`/`makeStepper` -> `label`,
      `makeStepper` -> `description`, `makeAlert` -> `content` (no `title`).
      Wrong name renders empty with no warning; this caused 5 doc bugs.
- [ ] 7.7 drift-lint rule: preset-value tables in prose must match
      `TYPE_RATIO_PRESETS` / `MOTION_PRESETS` / `SPACING_PRESETS` / typeScale.
      All four were wrong in `theming.md` and `northstar`.

## 8. Docs: MISLEAD / STALE (batch pass)

Lower value individually; fix in one sweep per file once 1-5 are done.
Highlights:

- [x] `docs/bitwrench-northstar-principles.md:343,344,345,347` -- spacing ramp,
      type ramp, colour-role list (`muted`/`error` do not exist; it is `danger`)
      and motion values all wrong. This is the file every task is told to read first.
- [x] `docs/bitwrench-northstar-principles.md:124-126` vs
      `docs/thinking-in-bitwrench.md:810,814` -- the two authorities disagree on
      whether `el.querySelector().textContent` is allowed inside `o.handle`.
      Needs a decision, then both updated.
- [x] Component counts: `47`/`45+`/`30+` -> **51** (`bw.catalog().length`) in
      `llm-bitwrench-guide.md:391`, `northstar:324`, `bitwrench-for-wasm.md:815`,
      `bitwrench-taco-schema-discussion.md:287`.
- [ ] `docs/theming.md:132-137,156,185-186,256` -- preset tables, `clearStyles`
      description, palette default comments.
- [ ] `docs/taco-format.md:74` -- `bw.s()` returns an object, not a string.
- [ ] `docs/taco-format.md:56` + `docs/bitwrench_typescript_usage.md:135` --
      `data-*` in the canonical attribute examples.
- [ ] `docs/llm-bitwrench-guide.md:171,395,528,608,293-294` -- state is assigned
      by reference not copied; 13 factories expose handles not 6; protocol type
      count; `bwcli serve` port; two non-ASCII ellipses.
- [ ] `docs/bitwrench-taco-schema-discussion.md:3,282-288,345-620` -- status line
      and normative sections now contradict the shipped
      `src/bitwrench-verify.js` on every point.
- [ ] `docs/drift-lint.md:36,42,267-298` -- "~120 files" -> 190; root-file list
      omits `SECURITY.md`; inventory omits `foreign-repo-url` and `stale-cdn-pin`.
- [ ] `dev/bw-cli-design.md` + `dev/bw-chart-design.md` -- 7 lines teaching
      `bw.generateTheme()`, which never existed. One-line banner amendment
      naming `makeStyles`/`loadStyles` is enough; both files already carry a
      STALE-CHECK banner.
- [ ] `keywords.txt` -- no entries for the C++ API (`bw::`/`bwserve::`), which
      `README.md:258-263` uses as the flagship embedded snippet; Arduino IDE
      colours none of it. Also `BW_MAX_CLIENTS`, `BW_ACTION_NAME_MAX`, and
      datatypes filed under the LITERAL1 banner.
- [ ] `README.md:426-436` -- "Reference guides" omits 9 existing docs that
      `llms.txt:409-428` does list, including `bitwrench_api.md` and `routing.md`.
- [ ] `agents.md` + `llms.txt` -- `src/mcp/` and the `bwmcp` binary are
      invisible: "mcp" appears in neither, nor in README/ABOUT/CONTRIBUTING,
      though it ships a binary and 5 test suites.

## 9. Gated on verify shipping (item B3: rollup target + export) -- DONE 2026-10-11

All 11 locations now reference verify. Verified by grep; the five that carry a
single mention were each read to confirm it is a real reference, not the word
"verify" in prose. Size claims across them are pinned to the artifact by
"stays inside the size the docs promise" in `test/bitwrench_test_bundles.js`.

- [x] `docs/core-api.md:88-94`, `docs/component-cheatsheet.md:86-91`,
      `docs/state-management.md:844`, `docs/bw-attach.md:337`,
      `docs/cli.md:257-318`, `docs/quickstart.md:232-243`,
      `docs/llm-bitwrench-guide.md:434-443`,
      `docs/thinking-in-bitwrench.md:1394`, `pages/11-debugging.html`,
      `agents.md`, `llms.txt`.
