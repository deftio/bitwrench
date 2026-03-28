# Live Builder -- Watch an LLM Build UI in Real-Time

A Python script that connects a local LLM to bwmcp and builds a UI live
in the browser. You type a prompt, the LLM decides what to build, and you
watch components appear one by one with a progress bar.

## What This Shows

- **LLM-driven UI generation**: LLM receives component catalog, returns a build plan
- **Live browser rendering**: Components appear in the browser as they are built
- **Progress visualization**: Status page, step list, progress bar update in real-time
- **Multi-provider LLM support**: ollama, lmstudio, openrouter, openai (any OpenAI-compatible API)
- **Fallback mode**: Runs without any LLM using a built-in plan (`--no-llm`)
- **Standalone export**: Saves a themed HTML page that works offline
- **Zero pip dependencies**: Uses only Python stdlib (urllib, json, subprocess)

## Requirements

- Python 3.8+
- Node.js 18+
- bitwrench (this repo -- runs from source)
- One of: ollama, lmstudio, openrouter key, or openai key

## Running

### With Ollama (easiest local option)

```bash
# Install and start ollama (https://ollama.ai)
ollama pull llama3.2

# Run the live builder
python3 live_builder.py --provider ollama --model llama3.2

# Custom prompt:
python3 live_builder.py --prompt "Build a project tracker with task status"
```

### With LM Studio

```bash
# Start LM Studio, load a model, enable the server (port 1234)
python3 live_builder.py --provider lmstudio
```

### With OpenRouter (cloud, free tier available)

```bash
export OPENROUTER_API_KEY=sk-or-...
python3 live_builder.py --provider openrouter
# Uses meta-llama/llama-3.2-3b-instruct:free by default
```

### With OpenAI

```bash
export OPENAI_API_KEY=sk-...
python3 live_builder.py --provider openai --model gpt-4o-mini
```

### Without any LLM (demo mode)

```bash
python3 live_builder.py --no-llm
# Uses a built-in sales dashboard plan
```

## What Happens

1. **Browser opens** to http://localhost:7910 showing "Initializing..."
2. **LLM receives** the component catalog and your prompt
3. **Plan appears** in the browser: a checklist of components to build
4. **Components appear** one by one with a progress bar
5. **Final layout** replaces the progress view with the composed UI
6. **HTML saved** to `output.html` -- a standalone page with theme

```
┌─────────────────────────────────────────────┐
│  Sales Dashboard                            │
│  Quarterly sales metrics and performance    │
│                                             │
│  ████████████░░░░░░░░  4/7 components       │
│  Building: Product breakdown table...       │
│                                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐    │
│  │ Revenue  │ │ Customers│ │ Avg Order│    │
│  │ $128,430 │ │   3,842  │ │   $284   │    │
│  └──────────┘ └──────────┘ └──────────┘    │
│                                             │
│  ┌─ Q1 revenue target exceeded... ────┐     │
│  └────────────────────────────────────┘     │
│                                             │
│  Built by llama3.2 via bwmcp               │
└─────────────────────────────────────────────┘
```

## CLI Options

```
Options:
  --provider {ollama,lmstudio,openrouter,openai}
                        LLM provider (default: ollama)
  --model MODEL         Model name (default: auto per provider)
  --api-key KEY         API key (or set env var)
  --base-url URL        Custom API base URL
  --prompt PROMPT       What to build (default: sales dashboard)
  --theme THEME         Bitwrench theme preset (default: ocean)
  --port PORT           bwserve port (default: 7910)
  --output FILE         Output HTML file path (default: output.html)
  --no-llm              Skip LLM, use built-in fallback plan
```

## How It Works

```
Python Script              LLM (ollama etc.)        bwmcp           Browser
  |                             |                     |                |
  | "Build a dashboard"         |                     |                |
  |                             |                     |                |
  |  POST /v1/chat/completions  |                     |                |
  |---------------------------->|                     |                |
  |<-- JSON plan                |                     |                |
  |   {title, components:[...]} |                     |                |
  |                             |                     |                |
  |  tools/call render_live ----+-------------------->|                |
  |  (status: "Planning...")    |                     |--- SSE ------->|
  |                             |                     |                |
  |  tools/call make_stat_card -+-------------------->|                |
  |<-- TACO JSON                |                     |                |
  |  tools/call render_live ----+-------------------->|--- SSE ------->| card
  |   (show card)               |                     |                | appears!
  |                             |                     |                |
  |  ... repeat for each component ...                |                |
  |                             |                     |                |
  |  tools/call render_live ----+-------------------->|--- SSE ------->| final
  |   (final composed layout)   |                     |                | layout
  |                             |                     |                |
  |  tools/call build_page -----+-------------------->|                |
  |<-- standalone HTML          |                     |                |
  |  (save to output.html)      |                     |                |
```

## Structure

```
mcp-agent-live/
  live_builder.py      <- LLM + bwmcp live builder (~430 lines)
  README.md            <- this file
```

## Customizing

### Change the component set

Edit the `SYSTEM_PROMPT` in `live_builder.py` to add or remove components
from the LLM's available toolkit. The current set matches bwmcp Phase 1
(10 components).

### Change the layout logic

The `compose_layout()` function groups components by width: `"full"` spans
the whole page, `"third"` groups into rows of 3. Add more layout modes
(half, two-thirds) by extending this function.

### Use a custom API endpoint

Any OpenAI-compatible endpoint works:

```bash
python3 live_builder.py --base-url http://my-server:8080/v1/chat/completions
```
