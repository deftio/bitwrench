# northstar-llm — North Star corpus auditor (spec)

> **Status:** Phase 1 MVP implemented (`tools/northstar-llm/`)  
> **Date:** 2026-08-08  
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

- No automatic fixes, PRs, or agent loops
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
    "maxFileBytes": 200000
  }
}
```

CLI: `--provider`, `--model`, `--path`, `--concurrency`, `--out-dir`, `--resume`.

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
    meta.json
    findings.jsonl     # appended as each file completes
    report.md          # mechanical, regenerable via finalize
  latest -> …
```

Finding schema: `file`, `line`, `endLine`, `checkId`, `severity`, `evidence`,
`problem`, `recommendation`, `cite`. Progress lines use `"type":"file_done"`.

---

## Ignore pragmas

```
northstar-llm:ignore-next-line: reason
northstar-llm:ignore-start: intentional wrong demo
…
northstar-llm:ignore-end
```

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
### Phase 2 — Hardening (partial in MVP: chunking, selftest fixtures, latest symlink)
### Phase 3 — Optional public/maintainer docs later

---

## Acceptance criteria (MVP)

1. Overnight run over default corpus completes; `findings.jsonl` grows during
   the run; crash + `--resume` continues without redoing finished files.
2. `report.md` is fully regenerable from jsonl + meta with no LLM call.
3. Report opens with summary stats and clean severity tables.
4. Tool never writes to `docs/`, `pages/`, `examples/`, or `src/`.
5. Not referenced from release/CI scripts.

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
