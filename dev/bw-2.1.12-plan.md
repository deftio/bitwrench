# 2.1.12 -- what we can address now

**Status (what actually shipped in 2.1.12): verify tier 1 only.** A structural
walk plus raw-content warnings -- 21 finding codes (15 errors, 6 warnings) --
and `bwcli verify`. There is no `verify.install()`, no `verify.page()`, no
`schema/taco.schema.json`, no `verify-manifest.json`, no `version-mismatch`
finding, and no tier 2 or tier 3. The "COMPLETE / tiers 1-3 / schema /
`verify.install()` / `bw:diag` loop" paragraph immediately below was
aspirational and is contradicted by section B of this same file, which lists
tier 3 and the diag loop as out of scope. `docs/verify.md` is the public
truth. This file is kept as work-tracking history.

Branch: `feature/verify-tool`, version already bumped to 2.1.12.

**Scope clarified 2026-10-08, then NARROWED 2026-10-11 by what shipped.** The
2026-10-08 sentence below said every verify feature ships -- tiers 1-3, the
schema, `verify.install()`. It is **wrong**, kept here only because the rest of
the file was written against it. What shipped is tier 1, 22 finding codes, and
`bwcli verify`. Read `docs/verify.md`, not this paragraph.

~~Every verify feature ships: tiers 1-3, the CLI, the schema,
`verify.install()`, the docs, and `verify()` applied inside the embedded C
tests.~~ Superseded.

What is deferred is the **C/C++ library shape** for Arduino / PlatformIO /
ESP-IDF -- those authors expect a C/C++ library and its shape is still being
decided. So group C below (`BW_CALL`, `bw_asset_t`, `BW_REPLACE`,
`examples/README.md`, per-language status, the `embedded_rust` decision, the
registry name and version decoupling) waits on that design, not on time.

~~Back in scope as a result: `verify.install()` (B8), tier 3 /
`verify.page()`, and the `bw:diag` loop -- which means decision D1 (the
post-back path) is in this release.~~ **Not true of what shipped.** B8, tier 3,
`verify.page()`, the schema (B9), the generated manifest (B4), tier 2
(B5-B7) and the `bw:diag` loop are all OUT, and D1 was not decided. They are
2.1.13+ candidates. Section B's own "Out of 2.1.12" line is the accurate one.

The CSS/lean split is 2.1.13 (`dev/bw-css-split-plan.md`) and the embedded
library shape is 2.1.14, so Group C below is the 2.1.14 queue.

Already landed and rebuilt into `dist/`: the three jazzmac fixes (router
double-render, the one-target rule across seven verbs, the `routing.md` view
pattern), the `TacoOptions` drift fix with its `taco-options-drift` rule, and
the CI tooling (`ci:local`, `test:gcc`, the four strictness tests, the
`release.js` / `start-release.js` repairs).

**North star for verify** (design and guide, 2026-10-06): an extra tool that
catches mistakes and assists in CI, as a companion to bitwrench, in the
situations where that help is worth a call. bitwrench renders without it.
The library and the CLI are two doors onto that companion.
Structural CSS for bare elements is **decided, not open** -- see
`docs/bitwrench-northstar-principles.md` section 3.

Already landed on this branch: the local CI gates (`ci:local`, `test:gcc`), the
four gcc strictness tests, three `release.js` / `start-release.js` repairs, the
`stale-cdn-pin` fix, the `TacoOptions` drift fix and its `taco-options-drift`
rule.

---

## A. Decisions needed before any verify code

Three of these are public surface and expensive to change later. None take long
to decide; all block writing the checker.

| # | Decision | Recommendation | Why it blocks |
|---|----------|----------------|---------------|
| A1 | The finding-code vocabulary | the 14 codes drafted in `dev/bw-verify-guide-draft.md` | people filter and assert on codes; renaming one later is a breaking change |
| A2 | Suppression mechanism | `verify(taco, { ignore: ['attr-typo'] })`. **Not** a key inside the TACO -- that puts tool metadata in the data model | a checker you cannot silence gets switched off wholesale |
| A3 | `verify.install()` for inline TACO -- in 2.1.12 or later? | **in**, and small: wrap `bw.create`/`mount`/`patch`/`append` from the tool, no core hook, no core bytes. It is a door, not a gate: inline TACO can be passed to `verify()` directly | the click-around warning, and the live demo |
| A4 | Import path | `bitwrench/verify` subpath, with `import` **and** `types` (unlike `./debug`, which has only `require`/`default`) | the design currently says `bitwrench-verify`, which reads as a separate package |
| A5 | Version-mismatch finding | compare the baked-in version against `bw.version` when `bw` is present, emit one `version-mismatch` | a CDN mix of verify 2.1.12 + bitwrench 2.1.14 gives confident wrong answers |
| A6 | How does a non-JS author run it? | **settled 2026-10-06.** One checker, two doors. The CLI is `verify()` plus file and stdin buffering, wire mode by default, in this release. Node and Bun import `bitwrench/verify` or shell out. Desktop, server, and Pi-class Linux pipe the CLI. Bare metal: the host CLI checks compile-time assets and captured frames; the chip never runs it. Also call `verify()` inside the existing embedded C test | a checker only a JavaScript caller can run is a smaller product than section 9 of the design |

A6's test half is cheap: `test/bitwrench_test_embedded_c.js` already compiles
the C, runs it and feeds output to `bw.parseJSONFlex()`. Swapping that assert
for `verify()` checks the examples. The honest claim is "a host can check a
payload, and the examples are checked." The chip runs neither. Looking at a
live page the chip is driving is bwserve (`bwcli attach` today), not verify.

---

## B. The verify tool (the release's feature)

Per the review's honest minimum: tier 1 alone is not announceable, because the
two failures that hurt this release's audience are tier 2.

| # | Item | Depends on | Notes |
|---|------|-----------|-------|
| B1 | Fixtures from `dev/bw-verify-design.md` section 11a, written **first** | A1 | includes `{t:'div',a:{class:'my-card'}}` **must pass** -- the regression guard against an over-broad class check, written before the class check exists |
| B2 | Tier 1 structural walk, pure function | A1, A2 | the nine steps in design section 7; accepts a single node **or a top-level array** (`bw.mount('#app',[a,b])` works) |
| B3 | `rollup.config.js` target + `./verify` export | A4 | mirror the `bitwrench-debug` target: UMD + min + CJS, own banner, global `bwv` |
| B3b | Thin CLI: `bwcli verify <file>` and stdin | B2 | calls the same `verify()`, wire mode by default. File buffering, not a second checker. Design section 9 |
| B4 | Generated `verify-manifest.json` | -- | props via the existing `_parseKeys()` (**not** a second parser); `o` keys from the renderer's seven; `bw_`-prefixed class tokens from `makeStyles()` output |
| B5 | Tier 2: factory props, incl. the nine rest-element form factories | B4 | do **not** accept arbitrary keys because a rest element is present -- that is how `onchnage` hides |
| B6 | Tier 2: `on*` handler names, **normalised first** | B4 | `onClick` works and must not be an error; probe the normalised name (`onchnage` -> `chnage`) |
| B7 | Tier 2: `bw_` / `bw_bccl_` class tokens only | B4 | ignore `bw_uuid_*` and `bw_lc` (renderer-stamped); leave `bw_act_*` off -- the handler is often firmware |
| B8 | `verify.install()` | A3 | dev-mode wrapper; the thing that makes the live demo page worth looking at |
| B9 | `schema/taco.schema.json` + a test that schema and checker agree on the fixtures | B1, B2 | `t` is **required** on an object; add `Raw = {__bw_raw, v}` |
| B10 | Plumbing: builds.json, SRI, bundle-parity, own test suite, downloads page, release archive | B3 | ten points in design section 13. `verify-sri` gates on "every loadable file covered", so a missing entry **fails the release** |
| B11 | Dogfood over our own `pages/` and `examples/` in CI | B5-B7 | if it finds nothing, the checks are too weak |

**Out of 2.1.12:** tier 3 (duplicate ids, slot matching, `render` reachability),
the `bw:diag` loop, the model-subset schema, and any core `on*` heuristic.
`bwcli verify` is in: it is the library plus buffering, not a second checker.

---

## C. Embedded items -- DEFERRED to 2.1.14

Kept here as the next release's queue. None of it blocks 2.1.12.

These are from the register in `dev/bw-embedded-release-plan-2.1.x.md` and are
all small. None require a board.

| # | Item | Register # | Effort |
|---|------|-----------|--------|
| C1 | `BW_CALL` / `bwserve::call()` -- a device cannot invoke a registered remote today, which blocks device-driven theming | 9 | ~15 lines + test |
| C2 | `bw_asset_t` so adapters stop hardcoding `bitwrench_js_gz`, and full<->lean is a one-line swap | section 4 | generator change in `tools/build-embedded-header.js` |
| C3 | Remove `BW_REPLACE` (dead v2.0 alias for `BW_MOUNT`; only self-references remain) | 2 | one line + changelog note |
| C4 | `examples/README.md` index -- five `examples/embedded*` dirs with, in our own words, "no stated relationship". **There is no `examples/README.md` at all** | 7 | one page |
| C5 | Per-language status note in `embedded_c/`, `embedded_python/`, `embedded_rust/` READMEs: supported, example, or retired | 6 | three paragraphs, needs C6 |
| C6 | **Decide `embedded_rust/`**: 414 lines, `version = "0.1.0"`, suspected vestigial, carried a fabricated repo URL until 2.1.0 | 6 | decision |
| C7 | C/C++ doc-example harness: compile the self-contained snippets in `embedded_c/README.md` the way the JS harness runs JS blocks | checklist | ~40 lines; would have caught the unparseable first program |
| C8 | Document the two buffer rules and the clang/gcc divergence in `embedded_c/README.md` | 3 | partly done in 2.1.11; finish |

**Out (needs hardware or a decision you own):** per-stack `bw_attach()` adapters
beyond POSIX, registry submission, the C++ article.

---

## D. The post-back path -- one real bug

Register item 12, and the only genuine defect left in the protocol.

`bw.connect(url)` posts back with `url.replace('/events/', '/apply/')`, which
**cannot match** the documented `/bw/events` (no trailing slash), so the POST
lands on the SSE URL itself. The POSIX demo depends on that accident. Meanwhile
the bwserve thin client posts to `/bw/return/action/<clientId>`. Two shapes, two
URLs, one of them unintentional.

| # | Item | Notes |
|---|------|-------|
| D1 | Decide the canonical post-back path | options: keep posting to the stream URL and delete the dead `replace`, or route everything through `/bw/return/...`. The second is more consistent; the first is what ships today and what the demo and `docs/bwserve.md` describe |
| D2 | Implement, update the POSIX + C demos and `embedded_c/README.md`'s two-client table | small once D1 is decided |
| D3 | Keep `bw_parse_action()` accepting both bodies | firmware should not care; this is already true |

The `bw:diag` round trip stays out of 2.1.12 until D1 lands -- building it on
the accident teaches the accident.

---

## E. Queue hygiene (GitHub)

`dev/qa-todo.md` no longer exists, so GitHub issues are the queue. Five are
open and almost none of this work is in them.

| # | Action |
|---|--------|
| E1 | **Close #92** -- unknown-option warnings shipped in 2.1.11 with test coverage |
| E2 | **Close #111** -- "no action needed" question |
| E3 | **Comment on #108** and re-scope. Verified delivered: nested-array flattening (`_flat`), `docs/svg.md`, `bw.h` in the quickstart, `docs/core-api.md` as the DOM-only card, the `bwcli attach` pointer. Remaining: `core` build (2.2, out), `bw.tokens()`, `injectCSS` minify default, help-bubble primitive, optional `bw.svg()` alias |
| E4 | **Record two one-way doors on #91** before submitting: the registry **name** (`bitwrench` vs `bitwrench-embedded`) and **version decoupling** (`start-release.js:140-142` bumps three C manifests on every JS-only patch) |
| E5 | **File: bitwrench-verify** -- acceptance is the guide's remaining holes (codes, suppression, `verify.install()` timing, version-mismatch) plus the settled shape in the design: library and thin CLI, Pi versus bare metal |
| E6 | **File: embedded 2.1.12** -- the register items in section C |
| E7 | **File: post-back path** (section D) as a bug |
| E8 | **File: `embedded_rust` -- supported, example or retired?** (C6) |
| E9 | **Open the jazzmac-side issue** -- unblocked now that 2.1.11 is on npm. Recommend the full build, `makeTooltip`, `bw.router`, `bw.toggleClass`, `bw.patch`, `bw.clear`, `bw.el`; drop its local `h` and dead string-SVG helpers; and no `data-*` for addressing |

Not filed: 2.2 / `core` build (out of scope by decision), structural CSS for
bare elements (decided -- north star section 3).

---

## Suggested order

1. **E1-E4** -- queue hygiene, minutes, and it makes the rest legible.
2. **A1-A6** -- the verify decisions. Nothing in B can start cleanly without
   A1 and A2.
3. **C1, C3, C4** -- `BW_CALL`, drop `BW_REPLACE`, write `examples/README.md`.
   Independent of verify, small, and C1 unblocks the theming beat in the
   embedded article.
4. **B1-B3, B3b** -- fixtures, tier 1, the build target, and the thin CLI. The
   first thing anyone can actually run, including a pipe.
5. **B4-B7** -- the manifest and the two tier-2 checks that carry the release.
6. **D1-D2** -- the post-back decision, then the demos.
7. **B8-B11** -- `verify.install()`, schema, plumbing, dogfooding.
8. **C2, C5-C8** -- the remaining embedded polish.

Checkpoint after step 5: that is the point where "is 2.1.12 a verify release, an
embedded release, or both" can be answered from something that exists rather
than from a plan.

**Gate every step with `npm run ci:local`** before it goes anywhere near main.
