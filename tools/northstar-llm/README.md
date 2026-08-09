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

Outputs land in gitignored `dbg/northstar-llm/<timestamp>/`:

- `findings.jsonl` — streamed during the run
- `report.md` — mechanical tables from jsonl
- `meta.json` — provider/model/git HEAD

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
