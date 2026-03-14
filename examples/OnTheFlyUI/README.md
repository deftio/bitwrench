# OnTheFlyUI

Chat with an LLM in the console, watch it build a bitwrench UI in real-time in the browser.

The LLM translates natural language into bwserve protocol messages; the browser renders them live. No pip installs required — Python 3.8+ stdlib only.

## Quick Start

1. **Have an LLM running** (e.g., [ollama](https://ollama.ai)):
   ```
   ollama run llama3.2
   ```

2. **Run OnTheFlyUI** from the bitwrench repo:
   ```
   python3 examples/OnTheFlyUI/otfui.py
   ```

3. **Open** http://localhost:8080 in your browser and start talking:
   ```
   You> make a dashboard with 3 stat cards showing users, revenue, and orders
   ```

## Architecture

```
+-----------------+     +----------------+     +---------------+     +---------+
| Console (stdin) | --> | otfui.py       | --> | bwcli serve   | --> | Browser |
| User describes  |     | - calls LLM    |     | :8080 / :9000 |     | :8080   |
| what to build   |     | - parses JSON  |     | (existing CLI)|     |  (SSE)  |
|                 |     | - POSTs :9000  |     |               |     |         |
+-----------------+     +----------------+     +---------------+     +---------+
```

Two processes:
- **`bwcli serve`** — bitwrench's pipe server. Serves the browser page on `:8080`, accepts protocol messages via HTTP POST on `:9000`. Spawned automatically by `otfui.py`.
- **`otfui.py`** — Python console app. REPL loop: read user input, call LLM, parse response, POST bwserve JSON to `localhost:9000`.

`otfui.py` is NOT a web server — it just POSTs JSON. All the SSE/browser/bitwrench plumbing is handled by `bwcli serve`.

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `LLM_URL` | `http://localhost:11434/v1` | OpenAI-compatible API base URL |
| `LLM_MODEL` | `llama3.2` | Model name |
| `LLM_KEY` | _(empty)_ | API key (for cloud providers) |
| `OTFUI_PORT` | `8080` | Browser-facing port |
| `OTFUI_INPUT_PORT` | `9000` | bwcli input port |

All can also be set via CLI flags: `--url`, `--model`, `--key`, `--port`, `--input-port`.

## REPL Commands

| Command | Description |
|---|---|
| `/help` | List available commands |
| `/clear` | Clear the browser UI |
| `/dump` | Print last raw LLM response (for debugging) |
| `/reset` | Reset conversation history (keep session) |
| `/quit` | Save session and exit |
| `Ctrl-C` | Same as `/quit` |

## Session Logs

Each session is saved to `session-otfui-YYYY-MM-DD-HHMMSS.json` in the OnTheFlyUI directory:

```json
{
  "session_id": "otfui-2026-03-13-142530",
  "started_at": "2026-03-13T14:25:30",
  "config": { "llm_url": "...", "model": "...", "ports": [8080, 9000] },
  "exchanges": [
    {
      "timestamp": "2026-03-13T14:25:45",
      "user": "make a dashboard with 3 stat cards",
      "llm_raw": "{ raw LLM response }",
      "protocol_messages": [ { "type": "batch", "ops": [...] } ],
      "result": "ok"
    }
  ]
}
```

## How It Works

1. `otfui.py` spawns `bwcli serve --port 8080 --listen 9000 --allow-exec`
2. The browser loads bitwrench from `bwcli serve` and opens an SSE connection
3. User types a description in the console
4. `otfui.py` sends the description to the LLM with a system prompt explaining the bwserve protocol and available bitwrench components
5. The LLM responds with JSON protocol messages (TACO replace/append/patch or exec with JS)
6. `otfui.py` POSTs each message to `localhost:9000`
7. `bwcli serve` broadcasts the message to all connected browsers via SSE
8. The browser applies the message — UI appears/updates in real-time

The LLM has two modes:
- **TACO mode** — raw `replace`/`append`/`patch`/`remove` with TACO JSON objects
- **Exec mode** — `{"type":"exec","code":"..."}` which runs JS in the browser, giving access to all bitwrench `make*()` functions, theming, CSS generation, etc.

## Tips for Effective Prompts

- **Be specific**: "make a table with columns Name, Email, Role and 5 rows of sample data" works better than "make a table"
- **Iterate**: "change the header color to blue" or "add a search box above the table"
- **Use component names**: "add a navbar with brand 'MyApp' and links Home, About, Contact"
- **Request themes**: "apply an ocean theme" or "use dark colors"
- **Ask for layouts**: "make a 2-column layout with a sidebar on the left"

## Using with Cloud LLMs

```bash
# OpenAI
LLM_URL=https://api.openai.com/v1 LLM_MODEL=gpt-4o LLM_KEY=sk-... python3 otfui.py

# Anthropic (via OpenAI-compatible proxy)
LLM_URL=https://openrouter.ai/api/v1 LLM_MODEL=anthropic/claude-sonnet-4-20250514 LLM_KEY=sk-... python3 otfui.py

# LM Studio
LLM_URL=http://localhost:1234/v1 python3 otfui.py
```

## Troubleshooting

**bwcli not found**: Make sure you have Node.js and npm installed. Run from the bitwrench repo root, or install globally: `npm install -g bitwrench`.

**LLM not responding**: Check that your LLM server is running (e.g., `ollama serve`). Test with: `curl http://localhost:11434/v1/models`.

**Parse errors**: The LLM sometimes returns explanatory text instead of pure JSON. Try rephrasing, or use `/dump` to see what it returned. Smaller models may need more explicit prompts like "respond with only JSON, no explanation".

**Browser not updating**: Make sure http://localhost:8080 is open. Check the browser console for errors. Try `/clear` and re-describe what you want.

**Port conflicts**: Use `--port` and `--input-port` to change ports: `python3 otfui.py --port 3000 --input-port 3001`.
