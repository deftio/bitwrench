# Bitwrench 2.1.0 — Implementation Brief

**Date**: 2026-06-09 (rev 1)
**Audience**: coding agents (and Manu, supervising). This document tells
you WHAT to build in WHAT order under WHAT rules. The design rationale
lives elsewhere — you should rarely need it:

| Authority | Document |
|---|---|
| THE contract (implement until green) | `dev/test_v2.1/*.spec.js` — red by design |
| Spec of record (when a test seems wrong) | `dev/bitwrench-lifecycle-cleanup-2026-06-09.md` — latest rev per its own header |
| CSS companion | `dev/bitwrench-css-cleanup-2026-06-09.md` |
| bwserve gates | `dev/bwserve-qa-charter-2026-06-09.md` |
| Philosophy / drift checks | `dev/bitwrench-north-star.md` |
| Browser-tier gate list (Phase 4) | `dev/test_v2.1/README.md` §"Browser-tier gates" |

(No exact counts or rev numbers in this brief, deliberately — they rot.
Run the suite for the current count; each doc's header is authoritative
for its own revision.)

**Progress metric**: `npx mocha "dev/test_v2.1/*.spec.js" --exit` —
watch the failing count fall to 0. That number is the whole project
status; no other reporting needed.

---

## Non-negotiable rules (for every agent, every package)

1. **The suite is append-only.** You may ADD tests for micro-decisions
   you hit. You may NEVER weaken, delete, or skip an existing assertion
   to get green. If you believe a test contradicts the spec, STOP and
   escalate (rule 6) — do not "fix" the test.
2. **Compounds call atomics. Only.** `mount`, `append`, `replace`,
   `remove`, `refresh`, `patch`'s content branch, and slot setters are
   compositions of the public atomics (`create`, `mountTree`, `unmount`,
   `unmountChildren`). Test 02.0 spies the atomics and asserts call
   sequences — inlined private teardown goes red even if the DOM looks
   right. This is the most important rule in the project.
3. **Do not imitate 2.0.x code.** The old source is the *defect record*,
   not the reference. Tests that contradict it say so inline ("2.0.x
   bug"). When stuck, read the spec section cited in the test file
   header — never the old implementation.
4. **No new global registries.** State lives on elements (`_bw_*`
   properties) or inside closures with disposers. The only module-level
   stores allowed: `_nodeMap` (WeakRef-backed where available), pub/sub
   topics, the janitor's pending records + exempt set, `bw.remote`,
   `bw.config`. Anything else is the F10 leak class returning.
5. **Diag codes are API** (spec §10 table, append-only). Warn through
   the single diag channel, never bare console. Tests assert codes.
6. **Escalation = micro-decision log.** When the spec+tests underdetermine
   a choice: make the smallest reasonable call, ADD a test pinning it,
   and append one line to `dev/test_v2.1/DECISIONS.md` (already created,
   format inside):
   `[package] [date] question → choice → test name`. Manu reviews that
   file, not your diffs. Prose and tests must never diverge (same-day
   foldback rule).
7. **Scope hygiene.** One package per work session. Touch only the files
   your package owns (map below). Do not reformat, rename, or "improve"
   neighboring code.

## Phase gate (per Manu: lifecycle first, everything piggybacks)

```
PHASE 1 (serial, gated):   01 → 02 → 03 → 04 → 04b   the lifecycle itself
   GATE: packages 01–04b fully green, incl. the 02.0 composition spies
         and 04b's reentrancy/half-born/zero-residue hardening.
         Nothing in Phase 2 starts before this gate. No exceptions.
PHASE 2 (parallelizable):  05 syncChildren | 06 actions+protocol |
                           07 Path S | 08 derive | 09 CSS
PHASE 3 (parallelizable):  10 BCCL rename+a11y | 11 memory | 12 bwserve
PHASE 4 (serial):          old-suite migration → docs workstream (§16) →
                           schema files (§15a) → release gate checklist (§11)
```

Rationale: a lifecycle bug fixed during package 02 costs one file; the
same bug found during package 07 costs five packages of rework. Phase 2/3
packages consume only what Phase 1 defines.

## Work packages

| # | Scope | Owns (primary files) | Notes |
|---|---|---|---|
| 01 | Phase verbs + invariants + `_debug`/`_resetForTest`/diag channel | `src/bitwrench.js` (engine sections) | FIRST: implement the test-infra contract (spec §10 items 1–4), then verbs. Delete the `create*` codegen loop (~line 4034) — `bw.create` is currently squatted by a 2.0.x bug; remove the loop, don't assign over it. |
| 02 | Operations: mount/append/replace/remove/refresh/update/patch/updateSlot/message + slot lazy-binding + `bw.on` off() | same | Slot binding rule spec §3 (lazy + refresh re-resolve). |
| 03 | Janitor (3 layers) + detach + liveness + lifecycle events + `bw:lifecycle`/`bw:diag` mirrors | same | Timing semantics: processed-removal-record (spec §2.1). `janitor.flush()` first — every later test uses it. |
| 04 | Identity: assignUUID, collision remint + `_bw_refs` re-key at mountTree, plain-node addressability, `bw.el` resolution order (§2.3), env guards (§2.2: double_load, shadow_root warn) | same | |
| 05 | `bw.syncChildren` | same | Tool, not paradigm: uses 01's verbs only. |
| 06 | `bw_act_*` dispatcher + `bw.actions` + wire `bw.apply` v:1 + `registerRemote` + `listen`/`unlisten` + `bw.connect`/remote_status | `src/bitwrench.js`, `src/bwserve/bwclient.js` | ONE seam: `bw.remote.send`. setTransport must not exist (tested). |
| 07 | Path S: html/htmlPage purity, `{fns}` registry, `bw_fn_*` marker+binder (NO inline on*), CSP nonce on ALL inline output, adoption | same + htmlPage code | |
| 08 | `bw.derive` | same | ~60 lines incl. disposal/seed/immediate/diag. |
| 09 | CSS: scope-id hash, clearStyles-all, @keyframes fix, scoped-alt self-rule, loadStructural, setThemeMode, layer ordering, reserved ids, contrast_aa, cspNonce on styles | `src/bitwrench.js` styles section, `src/bitwrench-styles.js` | CSS spec §2 findings CSS-1..8. |
| 10 | BCCL: `bw_bccl_*` rename (no dual emission), a11y rows + axe floor, string props, makeForm, table-on-syncChildren | `src/bitwrench-bccl.js`, `src/bitwrench-styles.js` | Mechanical rename + behavior; biggest diff, lowest risk after Phase 1. |
| 11 | Memory: verify counters + GC smoke (mostly proven by 01–03; fix what's red) | engine | |
| 12 | bwserve: hello/v, verb+field renames, code-route deletion, reconnect re-runs handler, loopback default, app.port, payload budget, listen round-trip | `src/bwserve/*`, `src/cli/attach.js` | Charter A/B/C4. bwcli parity checklist (charter A5) is a deliverable, not an afterthought. |

## Process decisions (settled here so nobody re-litigates mid-build)

- **Branch**: `npm run start-release -- "v2.1-lifecycle"` (per CLAUDE.md;
  feature branch stays local). Version → 2.1.0. First commit on the
  branch: backfill CHANGELOG 2.0.27–2.0.32 (release-gate housekeeping,
  cheapest now).
- **In-place rewrite.** 2.1 lands in the existing `src/` modules — no
  parallel `src2/`. The suite, not a directory split, is the safety net.
- **The 2.0.x test suite**: frozen at branch point. It WILL go red as
  renames land — that is expected and not a failure signal. Each package
  migrates or retires the old test files whose subject it owns (rename
  old asserts to 2.1 grammar where the behavior survives; delete tests
  of deleted behavior, noting them in DECISIONS.md). `npm run test`'s
  file list is updated in the same change. Coverage threshold (80%) is
  re-asserted at Phase 4, not per-package.
- **Suite graduation**: at Phase 4, `dev/test_v2.1/` moves to
  `test/spec21/` and `test:spec21` joins `npm run test`. Until then it
  runs via its own command only.
- **@browser / @gc tiers**: jsdom green is the per-package bar; the
  karma/playwright pass for @browser cases and the `--expose-gc` run are
  Phase 4 gates, not package gates.
- **dist/ and release machinery untouched** until Phase 4 (`npm run
  release` does its clean-build/lint/test/size-gate dance once, at the
  end, per CLAUDE.md — never `npm publish` by hand).
- **Examples/pages/docs untouched** until the §16 docs workstream
  (Phase 4) — except the drift-lint script, which Phase 4 adds to CI.

## Definition of done

- **Per package**: its spec file fully green in jsdom; no other
  package's green count regressed; DECISIONS.md updated for any
  micro-decision; owned 2.0.x test files migrated/retired.
- **Phase 1 gate**: 01–04 green including composition spies; Manu
  eyeballs DECISIONS.md before Phase 2 fan-out.
- **2.1.0 done**: 0 failing across the suite (jsdom), @browser tier
  green, GC smoke green under --expose-gc, old-suite migration complete
  with coverage ≥ threshold, then the release-gate checklist
  (lifecycle spec §11) — docs, schema files, security.md, benchmarks,
  demo assets — before anything ships.

---

*The paper trail: eleven review passes across four reviewers (Manu,
Fable, G5.5, Aggy), every decision either tested or logged — see each
doc's rev history for the record. The thesis to protect while building:
one verb, one transition, exact inverse — everything else piggybacks.*
