# northstar-llm (maintainer tool)

Audit-only LLM reviewer for `docs/`, `pages/`, and `examples/` against the
bitwrench north star. **Does not edit code.** Not wired into CI or release.

Spec: [`dev/northstar-llm.md`](../../dev/northstar-llm.md)

## Quick start

```bash
# No args → help only (safe; does not start a long run)
npm run review:northstar
npm run review:northstar -- help

# Ollama serving gemma4:31b-mxfp8 (or override --model)
ollama serve   # if not already running

npm run review:northstar -- dry-run
npm run review:northstar -- run
npm run review:northstar -- selftest
npm run review:northstar -- finalize   # rebuild report.md from latest jsonl
```

A full run is **89 files** (`dry-run` to confirm) and takes a couple of hours
against a large local model. Give it a budget if you need it done by morning:

```bash
npm run review:northstar -- run --budget 6h
# on expiry: current file finishes, report is written, exit 0
npm run review:northstar -- run --resume   # continue where it stopped
```

Outputs land in gitignored `dbg/northstar-llm/<timestamp>/`:

- `findings.jsonl` — streamed during the run: findings, `file_done`, `error`
- `report.md` — mechanical tables from jsonl
- `meta.json` — provider/model/git HEAD, timing, budget, retry counters
- `rejects/` — full replies that would not parse even after a re-ask

## When a call fails

Nothing here lets the model choose its own next action; it only gets asked the
same question again.

| Failure | What happens |
|---------|--------------|
| Transport error, timeout, 429, 5xx | Retry with backoff 2s / 8s / 30s (jittered). `--max-retries`, default 3 |
| Any other 4xx | No retry — the same body fails the same way |
| Reply will not parse | Exactly one re-ask carrying the bad reply back, asking for the JSON array alone |
| Still will not parse | Full reply saved to `rejects/`, chunk skipped, file marked incomplete |
| Retries exhausted mid-file | Earlier chunks' findings are kept, `file_done.incomplete = true`, `--resume` redoes the file |

Duplicates are collapsed in the report on file + line + checkId. Two real
sources: chunks overlap 20 lines by design, and a resumed file re-reports what
its earlier chunks found.

Each call opens with a small context block — job, file N/total, chunk i/n,
role. No clock: a finding that depends on the time of day would be a bug, and a
changing timestamp would defeat prompt caching. Timing is in `meta.json`.

## Config

All config lives in this directory:

| File | Role |
|------|------|
| `config.default.json` | Shipped defaults |
| `northstar.config.json` | Optional local overrides (merge on top of defaults) |
| `rules/checks.json` | Rubric checks |

| Setting | Default |
|---------|---------|
| provider | `ollama` |
| baseUrl | `http://127.0.0.1:11434/v1` |
| model | `gemma4:31b-mxfp8` |
| thinking | `false` (all providers) |
| numCtx | `100000` |
| maxRetries | `3` (`--max-retries`) |
| budgetMs | `null` — no budget (`--budget 6h`) |
| temperature | `0.2` |
| timeoutMs | `600000` (10 min per call) |
| maxChunkChars | `60000` |
| maxFileBytes | `200000` |

Every provider entry must keep `thinking` and `numCtx` — the client sends
`think` / `enable_thinking` / `chat_template_kwargs` plus `options.num_ctx`
on each OpenAI-compatible `/chat/completions` call. Servers ignore unknown fields.

## Ignore pragmas

```
northstar-llm:ignore-next-line: reason
northstar-llm:ignore-start: reason
…
northstar-llm:ignore-end
```
