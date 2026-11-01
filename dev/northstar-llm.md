# northstar-llm — North Star corpus auditor (spec)

> **Status:** Phase 1 MVP + Phase 2 reliability implemented (`tools/northstar-llm/`)  
> **Date:** 2026-08-08, revised 2026-10-12  
> **Never yet run over the real corpus.** The only artifact in
> `dbg/northstar-llm/` is the 2026-08-09 selftest: 3 fixture files. `dry-run`
> reports **89 files** for the default scan, so acceptance criterion 1 below is
> still unproven. Budget a couple of hours.  
> **Audience:** Maintainers (internal). Not user-facing docs.  
> **Relation to release:** Does **not** gate releases or CI. Manual tool for
> pre-release audits (e.g. overnight on a local GPU/unified-memory machine).
> Ship the tool in-tree; do not invoke it from `release.js` / CI.

---

## Purpose

Coding agents (and humans trained on React / Vue / Svelte / jQuery / vanilla
DOM patterns) continually reintroduce anti-patterns into `docs/`, `pages/`,
and `examples/` — code that “works” and may even look polished, but violates
bitwrench’s north star (TACO-first, palette/layout tokens, explicit updates,
BCCL before reinvention, no `var(--bw_*)` theming path, etc.).

**drift-lint** catches mechanical drift (stale APIs, banned tokens, structural
footguns). It cannot judge a whole page against design philosophy.

**northstar-llm** is an **audit-only** tool: an LLM reads each file against a
fixed rubric derived from the north star and emits structured findings.
It does **not** edit code, does **not** drive a coding agent, and does **not**
propose patches. Humans read the report and decide what to fix.

---

## Non-goals

- No automatic fixes, PRs, or agent loops. **A retry/re-ask ladder is not an
  agent loop** (added 2026-10-12): it asks the same fixed question again until
  one well-formed answer comes back. What stays out is the model choosing its
  own next action -- re-planning the corpus, picking its own rubric, or editing
  anything. `listScanFiles` is deterministic on purpose: it is what makes
  `--resume` correct and two nights' reports comparable.
- Not wired into `npm test`, `postbuild`, or `tools/release.js`
- Not documented in `docs/`, README, or `llms.txt` until we choose to ship it
  as a supported maintainer tool (optional later)
- Not a replacement for drift-lint — complementary, slower, judgmental
- Not required to be bit-identical across models/runs

---

## Placement

```
tools/northstar-llm/          # implementation (JS, zero new languages)
  cli.js                      # entry
  config.default.json         # defaults (providers, scan, run options)
  lib/                        # walk, providers, prompt, report
  rules/                      # rubric check definitions (data)
  fixtures/                   # planted-bad files for selftest
  README.md                   # maintainer how-to

tools/northstar-llm/northstar.config.json  # optional overrides (same dir)

dev/northstar-llm.md          # this spec

dbg/northstar-llm/            # run outputs (gitignored)
```

Public docs stay silent until explicitly promoted.

---

## Providers

Single **OpenAI-compatible** HTTP client (`baseUrl` … `/v1` →
`/chat/completions`). Configured backends:

| Id | Typical base URL | Auth |
|----|------------------|------|
| `ollama` (default) | `http://127.0.0.1:11434/v1` | none |
| `lmstudio` | `http://127.0.0.1:1234/v1` | none / local |
| `openrouter` | `https://openrouter.ai/api/v1` | `OPENROUTER_API_KEY` |

Default overnight path: **ollama** with a large local model
(`gemma4:31b-mxfp8` in defaults).

### Per-provider flags (required on every provider entry)

| Field | Default | Purpose |
|-------|---------|---------|
| `thinking` | `false` | Turn off model “think” / reasoning modes (not a deep-reasoning task) |
| `numCtx` | `100000` | Context window hint (`options.num_ctx` + related fields) |

The client always sends thinking-off / numCtx fields; servers ignore unknowns.
Responses are stripped of `<think>` wrappers before JSON parse.

---

## Configuration

Defaults live in `tools/northstar-llm/config.default.json`. Optional merge:
`tools/northstar-llm/northstar.config.json` (same directory; not repo root).

CLI with **no arguments** prints help and exits 0 — it never starts `run`.

```json
{
  "providers": {
    "default": "ollama",
    "ollama": {
      "baseUrl": "http://127.0.0.1:11434/v1",
      "model": "gemma4:31b-mxfp8",
      "thinking": false,
      "numCtx": 100000
    },
    "lmstudio": {
      "baseUrl": "http://127.0.0.1:1234/v1",
      "model": "gemma-4-31b",
      "thinking": false,
      "numCtx": 100000
    },
    "openrouter": {
      "baseUrl": "https://openrouter.ai/api/v1",
      "model": "google/gemma-4-31b",
      "apiKeyEnv": "OPENROUTER_API_KEY",
      "thinking": false,
      "numCtx": 100000
    }
  },
  "scan": {
    "include": [
      "docs/**/*.md",
      "pages/**/*.{html,js}",
      "examples/**/*.{html,js}",
      "agents.md",
      "llms.txt"
    ],
    "exclude": [
      "dev/**",
      "**/node_modules/**",
      "pages/07-framework-comparison.html"
    ]
  },
  "run": {
    "concurrency": 1,
    "maxFindingsPerFile": 12,
    "outDir": "dbg/northstar-llm",
    "maxFileBytes": 200000,
    "maxChunkChars": 60000,
    "temperature": 0.2,
    "timeoutMs": 600000,
    "maxRetries": 3,
    "budgetMs": null
  },
  "rubric": {
    "sourceDocs": ["docs/bitwrench-northstar-principles.md", "agents.md"],
    "checksPath": "tools/northstar-llm/rules"
  }
}
```

The shipped `config.default.json` also excludes `**/dist/**` and two
`examples/circuitpython/` paths.

CLI: `--provider`, `--model`, `--path`, `--concurrency`, `--out-dir`,
`--resume`, `--config`, `--budget`, `--max-retries`.

### Rubric checks

Data: `tools/northstar-llm/rules/checks.json`

| id | Intent |
|----|--------|
| `raw-dom` | `document.*` / `innerHTML` for app UI instead of TACO/bitwrench APIs |
| `mounted-listeners` | Interactive handlers via `addEventListener` in `o.mounted` |
| `palette-bypass` | Theme-role colors as hex / non-token CSS instead of `styles.palette` |
| `css-var-bw` | Teaching or using `var(--bw_*)` as the design-system path |
| `bccl-reinvent` | Hand-built table/modal/nav when BCCL exists |
| `refresh-gravity` | Full rebuild / remount where handles, slots, or patch fit |
| `outer-state-react-shape` | Outer variables + manual DOM sync instead of `o.state` / handles / pub-sub |
| `look-feel-drift` | One-off styling that ignores shared tokens |

---

## CLI

```bash
npm run review:northstar -- run [options]
npm run review:northstar -- dry-run
npm run review:northstar -- finalize [runDir]
npm run review:northstar -- selftest
# or: node tools/northstar-llm/cli.js …
```

Exit code: **0** on completed audit (findings are data, not failure). Non-zero
only for tool errors (unreachable provider, bad config, aborted run).

---

## Output

```
dbg/northstar-llm/
  2026-08-08T22-15-03Z/
    meta.json          # provider, model, git HEAD, timing, budget, counters
    findings.jsonl     # appended as each file completes
    report.md          # mechanical, regenerable via finalize
    rejects/           # replies that would not parse after the re-ask
  latest -> …
```

Finding schema: `file`, `line`, `endLine`, `checkId`, `severity`, `evidence`,
`problem`, `recommendation`, `cite`.

Three record types share `findings.jsonl`:

| `type` | Meaning |
|--------|---------|
| (absent, has `checkId`) | A finding |
| `file_done` | A file finished. `incomplete: true` means a chunk failed after retries, so `--resume` will redo it |
| `error` | A provider or parse failure. Carries `chunk`, `status`, `attempts`, `partialFindings`, and `reject` when a reply was saved |

`meta.json` adds `budgetMs`, `elapsedMs`, `stoppedOnBudget`,
`filesSkippedForBudget`, `filesIncomplete`, `callRetries`, `reasks`,
`maxRetries`.

---

## Ignore pragmas

```
northstar-llm:ignore-next-line: reason
northstar-llm:ignore-start: intentional wrong demo
…
northstar-llm:ignore-end
```

---

## Context injection

Every user message opens with a few lines of orientation:

```
job: northstar-llm audit (audit only -- findings, never patches)
file: 34/89  pages/04-dashboard.html
role: page
chunk: 2/3  lineOffset 1200
```

**Deliberately no wall-clock, elapsed or remaining time in the prompt.** Two
reasons, and both are load-bearing:

1. A finding that appears only at 3am is a bug, not a feature. The verdict on a
   file must be a function of the file and the rubric, nothing else.
2. The system prompt is byte-identical across every call in a run and is the
   only part a provider can prompt-cache. A changing clock anywhere in the
   request defeats that, and also makes two runs of one file undiffable.

Timing lives where it is actually read: `meta.json` (`startedAt`, `elapsedMs`,
`budgetMs`, `stoppedOnBudget`, `filesSkippedForBudget`, `filesIncomplete`,
`callRetries`, `reasks`) and the per-file console line. A test asserts the
prompt contains no ISO timestamp and no timing words.

---

## Relationship to drift-lint

| | drift-lint | northstar-llm |
|--|------------|---------------|
| Speed | &lt;1s | minutes–hours |
| Determinism | yes | no |
| CI / release | yes | **no** |
| Output | stdout violations | timestamped jsonl + md |
| When a finding repeats and is mechanical | — | **promote** to a drift-lint rule |

---

## Gitignore

```
dbg/northstar-llm/
```

---

## Implementation phases

### Phase 0 — Spec — done
### Phase 1 — MVP — done (this tree)
### Phase 2 — Hardening — done 2026-10-12

Chunking, selftest fixtures and the `latest` symlink landed with the MVP. The
reliability work landed 2026-10-12:

- **Failure ladder.** Transport errors, 429 and 5xx retry with backoff
  (2s / 8s / 30s, jittered, `--max-retries`, default 3). Other 4xx never
  retries -- the same body fails the same way. Errors carry `.retryable` and
  `.status` so no caller pattern-matches on message text.
- **One corrective re-ask** when a reply will not parse, carrying the bad reply
  back with "JSON array only". Exactly one: a model that ignores it twice will
  not comply on the third ask. Recoveries are logged, `meta.reasks` counts them.
- **Rejects are kept.** A reply still unparseable after the re-ask is written
  whole to `<runDir>/rejects/<file>.<chunk>.txt` and the jsonl error points at
  it. Previously only a 200-character slice survived.
- **Partial work is kept.** A chunk failure used to `return`, discarding every
  finding earlier chunks had produced and writing no `file_done`. It now
  `break`s, writes what it has, and marks `file_done.incomplete = true`.
- **Resume redoes incomplete files** and skips only complete ones.
- **Report dedupes** on file + line + checkId. Two real sources of duplicates:
  `chunkText` overlaps 20 lines between chunks by design, and a resumed file
  re-reports what its earlier chunks already found.
- **Budget stop.** `--budget 6h` finishes the file in flight, writes the
  report, and exits 0 with `meta.stoppedOnBudget`; `--resume` continues.
- **Context block** at the top of every user message: job, file N/total,
  chunk i/n, role. No clock -- see "Context injection" below.
- **Tests.** `test/bitwrench_test_northstar_llm.js`, 42 cases, no network
  (the single HTTP call is injected via `runOpts.chat`). Wired into `npm test`.
  Coverage config is `src/**` only, so this does not move the gate.

Two defects were found by writing those tests, both fixed:

1. `(order[sev] || 9)` ranked `high` at 0, and `0 || 9` is 9 -- so the
   `maxFindingsPerFile` cap kept the **low** findings and threw away the
   **high** ones, the exact opposite of what the system prompt promises the
   model. Only bites on files over the cap, which is how it survived. Now
   `severityOrder` in `parse.js`, used by both cap sites.
2. The chunk-discard bug above.
### Phase 3 — Optional public/maintainer docs later

---

## Acceptance criteria (MVP)

1. **NOT YET MET.** Overnight run over the default corpus (89 files) completes;
   `findings.jsonl` grows during the run; crash + `--resume` continues without
   redoing finished files. Only the 3-file selftest has ever run. The resume
   path and the failure ladder are now covered by unit tests with an injected
   provider, but a real multi-hour run against a local model is still the only
   thing that proves this one.
2. `report.md` is fully regenerable from jsonl + meta with no LLM call -- met
   (`finalize`).
3. Report opens with summary stats and clean severity tables -- met.
4. Tool never writes to `docs/`, `pages/`, `examples/`, or `src/` -- met.
5. Not referenced from release/CI scripts -- met. `npm test` runs the unit
   tests for its pure functions, which make no network call; the audit itself
   is never invoked by a test, a build or a release.

---

## Decision log

| Decision | Choice |
|----------|--------|
| Role | Audit only — no fixes, no coding agent |
| Languages | JS only (Node) |
| Providers | OpenAI-compatible baseUrl (Ollama default) |
| Thinking | `thinking: false` on every provider; strip wrappers |
| Context | `numCtx: 100000` default |
| Default model | `gemma4:31b-mxfp8` (ollama) |
| Human output | Markdown tables, mechanically rendered |
| Machine output | jsonl streamed per finding |
| Artifacts | Timestamped dir under gitignored `dbg/northstar-llm/` |
| Docs visibility | `dev/` + tools README only |
| Release gating | None — tool may ship unused |
| Retry on failure | Backoff on transport / 429 / 5xx; never on other 4xx (2026-10-12) |
| Unparseable reply | Exactly one corrective re-ask, then keep the raw reply (2026-10-12) |
| Re-planning | No — the scan plan stays deterministic (2026-10-12) |
| Clock in the prompt | No — job identity to the model, timing to `meta.json` (2026-10-12) |
| Budget expiry | Finish current file, write report, exit 0, resumable (2026-10-12) |
