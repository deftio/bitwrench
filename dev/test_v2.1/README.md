# 2.1 Spec-Test Suite (staging)

**Status: RED BY DESIGN.** These tests assert the current 2.1 API specified
in `dev/bitwrench-lifecycle-cleanup-2026-06-09.md` and
`dev/bitwrench-css-cleanup-2026-06-09.md`. The 2.1 API does not exist yet —
every failure here is a work item, and **all-green defines
implementation-done**. This directory is the implementation contract; the
spec prose is its rationale.

Staged under `dev/` deliberately: nothing outside dev/ changes until the
2.1 branch opens. At that point this directory moves to `test/spec21/`
and a `test:spec21` npm script is added (the existing `npm run test`
enumerates files explicitly, so CI cannot pick these up by accident).

## File map (dependency order = implementation order)

| File | Spec | Status |
|---|---|---|
| `_helpers.js` | shared harness (freshDOM, makeSensorTaco, collectDiag, flush) | — |
| `01-phase-verbs.spec.js` | lifecycle §1.1, §2 invariants | written; standalone harness calibration |
| `02-operations.spec.js` | §1.2 compounds + §3 tiers, errors, state surface | written |
| `03-teardown.spec.js` | §2.1 matrix + janitor + detach timing | written; timing cases tagged @browser |
| `04-identity.spec.js` | §3.2 UUID honor/collision/refs-re-key/plain nodes/ids | written |
| `05-syncchildren.spec.js` | §4 keyed children | written; focus cases tagged @browser |
| `06-actions-protocol.spec.js` | §5.4 mechanics 1–8 + §5.1/5.2 wire + §5.3 threat model | written |
| `07-path-s.spec.js` | §1.4 string path, fn registry, CSP walk, adoption + parity | written |
| `08-derive.spec.js` | §14 full semantics | written |
| `09-css-theming.spec.js` | CSS companion CSS-1..8, layers, CSP, contrast | written |
| `10-bccl-namespace.spec.js` | §13 rename + §6 a11y rows + §7.2 strings + §8 makeForm | written |
| `11-memory.spec.js` | §2.1 L3 retention + real GC (`--expose-gc`), §14 disposal | written; GC cases self-skip without the flag |
| `12-bwserve.spec.js` | §5 + QA charter A/B/C4 — REAL server over raw http+SSE | written; bwserve is first-class, same red bar as core |

**Baseline (2026-06-09, against 2.0.32, with bwserve first-class):** the
suite is mostly red, with a small green set documenting behavior 2.0.x
already gets right. Keep those greens as regression guards. Run
`npx mocha "dev/test_v2.1/*.spec.js" --exit` and watch the red count fall;
0 failing = 2.1.0 engine done. GC run:
`node --expose-gc ./node_modules/.bin/mocha dev/test_v2.1/11-memory.spec.js`.
The suite is append-only during implementation: agents may ADD tests for
micro-decisions they hit, never weaken existing assertions to get green.

## Conventions (binding on all packages)

1. **Assert diag codes, never console text.** Engine warnings are
   `bw:diag` payloads `{code, ...}`; the code table in lifecycle §10 is
   append-only API. Collect via `bw.sub('bw:diag', fn)`.
2. **Count registry state via `bw._debug()`** —
   `{registered, detached, janitorPending, topics}`. Never reach into
   `bw._nodeMap` directly.
3. **Lifecycle observation via `bw.sub('bw:lifecycle', fn)`**
   (`{event, uuid, type}`) or the bubbling DOM events (`bw:mount` etc.,
   detail `{uuid, type}`).
4. **Browser-only cases** carry `@browser` in the test title — true
   microtask-race timing and real focus behavior. They still *run* in
   jsdom (jsdom implements MutationObserver/isConnected) but the
   authoritative pass is karma/playwright.
5. Fresh JSDOM per test (`freshDOM()` helper, matching the 2.0.x suite
   style); `bw.janitor.flush()` before any registry-count assertion that
   follows a removal.
6. **Reset singleton state between cases.** Every package using the shared
   harness calls `resetBWForTest(bw)` in `afterEach`, which calls the
   test-only `bw._resetForTest()` required by lifecycle spec §10. A fresh
   DOM does NOT reset topics, registries, janitor records, detach exemptions,
   derives, action delegation, remotes, function registries, or `cspNonce`.
   Absolute-count assertions are only valid under this rule.
7. **Do not add 2.0.x compatibility aliases to get green.** If a test rejects
   `target`/`node`, `exec`, `register`, `data-bw-action`, generated `create*`,
   or silent `update` refresh behavior, that is the 2.1 architecture speaking.
   Fix the engine or the spec, not the test by widening the contract.
8. Micro-decisions discovered while writing tests are resolved inline
   AND logged back into the spec the same day — prose and tests must
   never diverge.

## Architectural Intent

These tests are structured to validate the main 2.1 bets:

- Lifecycle is explicit and invertible: create/hydrate/mount/unmount/detach
  must leave no ghost handles, subscriptions, registry entries, or marker
  classes behind.
- Identity is addressability, not component-ness: UUID/id registration must be
  mount-to-unmount, while `o.*` controls component lifecycle behavior.
- The wire protocol is data-only: no remote code execution, no legacy field
  aliases, and no hidden client-side refreshes that blur state vs. render.
- The string path converges with the live path without inline handlers or
  global function leaks.
- CSS/theming is deterministic data output with scoped side effects, not a set
  of ad hoc DOM writes.

## Run

```
npx mocha dev/test_v2.1/01-phase-verbs.spec.js --exit
```

(Expect red. That's the point.)
