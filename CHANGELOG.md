# Changelog

All notable changes to bitwrench are documented here.
Versions correspond to git tags and npm releases.

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
