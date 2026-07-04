# v2.1 Alignment Release — Fix Tracker (CLOSED OUT 2026-07-03)

Working list from the full-repo consistency review (2026-07-01). All release-blocking
phases are complete; remaining items are explicitly deferred (see "Deferred" at bottom).

## Decisions (final)

- **D1 — Variant spelling:** underscore (`outline_primary`). Enforced by drift-lint rule `outline-hyphen`.
- **D2 — Render verb:** `bw.mount()` and `bw.DOM()` are equals; docs state the alias once and
  never invent differences. No forced primary.
- **D3 — bwserve protocol:** `replace`/`refresh`/`update` are documented protocol (the MCP
  `render_live` handler emits `replace` natively). `docs/bwserve.md` documents **13 message types**.
- **D4 — todo-app:** relabeled honestly (pub/sub + manual re-render). Converting one component
  to `o.state`/`o.render` remains a deferred follow-up.
- **`./mcp` export:** intentionally ships source (`src/mcp/server.js`) — node-only ESM, `src/`
  is in the npm `files` list, no build needed. Not an oversight.

## Corrections to the original checklist (from execution review)

- **1.1:** `bw.toggleStyles()` replacement is `bw.toggleThemeMode()` (src L4085, class-based
  toggle of `bw_theme_alt`), NOT `bw.applyStyles(theme.alternate)`. The theming.md removal note
  itself was stale; both it and `bitwrench_typescript_usage.md` now name the correct API.
- **2.4:** `docs/bitwrench-mcp.md` L129 "SSE: replace #app" is CORRECT — `src/mcp/live.js` L160
  broadcasts `{type:'replace'}`. Left unchanged. `.bw_stat_card` selector is also valid
  (factories emit `bw_bccl_statCard bw_stat_card`, both classes).
- **5.2:** drift-lint `bw_card`/`bw_btn` rules are .md-scoped with context exclusions because
  the stylesheet legitimately generates `.bw_btn`/`.bw_card` selectors for hand-authored markup.

## Completed

- **Phase 1 (README):** toggleStyles removed (3x), "biwrench" typo, `bw-container`,
  `readme.html` regenerated. Removal notes in theming.md / typescript_usage.md now point to
  `bw.toggleThemeMode()`; theming.md "Switching between palettes" shows the one-class toggle.
- **Phase 2 (doc falsehoods):** mount/container claim, normalizeClass, taco-format class names,
  MCP doc (per correction above), bwserve 13-type protocol table, phantom `TacoOptions.update`
  removed from d.ts, client-server README verb.
- **Phase 3 (terminology):** "reactive" retired as self-description (comparative bridges kept),
  "three-level" gone, FAQ reworded, D1/D2 applied.
- **Phase 4 (examples):** ember-and-oak onclick refactor + self-description updates, todo-app
  relabeled, card-lifecycle sample linked from docs/README, app-patterns embedded snippet
  labeled "quick prototype" with pointer to SSE version.
- **Phase 5 (guardrails):** `tools/drift-lint.js` blocking via `posttest` and in release.js;
  traversal guard hardened (`startsWith(resolvedBase + sep)`) + tests; SUPERSEDED headers on
  archive docs; `test_lifecycle.js` archived; `dev/test_v2.1` wired as `test:spec21`.
- **Phase 6 (Docker E2E gate):** `tools/e2e-docker.sh` runs the suite in the official
  Playwright image; tag derived from installed `@playwright/test` version (cannot drift);
  `E2E_DOCKER_LIMITS=1` approximates GH runner resources; `npm run test:e2e:docker`;
  release.js uses the Docker gate by default with `BW_E2E_NATIVE=1` escape hatch.
  `playwright.config.js` webServer switched to `node server.js` so the same config works
  inside the container.
- **Phase 7 (packaging):** description/keywords/homepage fixed; `bwserve.d.ts` created + wired;
  subpath exports added for `./util-css`, `./code-edit`, `./debug` (UMD-only); `makeBarChart`
  registered in `bw.BCCL`; lean-build header claim corrected.

## Deferred (post-2.1, intentional)

- **D4 follow-up:** convert one todo-app component to `o.state`/`o.render` so the beginner
  example teaches the stateful model directly (additive).
- **Phase 8:** public "Design Philosophy" page from `dev/bitwrench-north-star.md` (soften the
  rebuttal table L367–381 first; keep concessions + "what to challenge") and the update-cost
  ladder in README near the Core API table.
- **Nightly GH canary (optional):** scheduled Chromium-only advisory workflow — zero release
  risk, closes the "regression sits on main until release" latency gap.
- **Class vocabulary unification (2.2 candidate):** stylesheet generates `.bw_btn`/`.bw_card`
  while factories emit `bw_bccl_*` — two vocabularies for one concept; same disease this
  release cured elsewhere.
- **Addon type declarations:** `./util-css` / `./code-edit` / `./debug` exports ship without
  `types` entries (honest — no d.ts exists for them yet).
