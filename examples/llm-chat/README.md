# LLM Chat Example

A chat interface powered by bitwrench + bwserve. The server streams LLM responses token-by-token over SSE — no client-side JavaScript needed beyond bitwrench.

Works with any OpenAI-compatible API: **ollama**, **lm-studio**, **openrouter**, or OpenAI itself.

## Quick Start

### 1. Install an LLM backend

Pick one:

**Ollama** (easiest):
```bash
# Install ollama from https://ollama.ai
ollama pull llama3.2
```

**LM Studio**:
- Download from https://lmstudio.ai
- Load a model, start the local server (default: port 1234)

**OpenRouter** (cloud, no install):
- Sign up at https://openrouter.ai
- Get an API key

### 2. Run the chat server

```bash
cd examples/llm-chat

# With ollama (default)
node server.js

# With lm-studio
LLM_URL=http://localhost:1234/v1 node server.js

# With openrouter
LLM_URL=https://openrouter.ai/api/v1 LLM_KEY=sk-or-... LLM_MODEL=anthropic/claude-3.5-sonnet node server.js
```

### 3. Open in browser

Navigate to http://localhost:7903

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `LLM_URL` | `http://localhost:11434/v1` | OpenAI-compatible API base URL |
| `LLM_MODEL` | `llama3.2` | Model name to use |
| `LLM_KEY` | _(empty)_ | API key (required for openrouter/OpenAI) |
| `PORT` | `7903` | Port for the chat server |

## How It Works

```
Browser                              Server (Node.js + bwserve)
  |                                      |
  |  GET /                               |
  |  <── HTML shell (auto-generated)     |
  |                                      |
  |  SSE /bw/events/:id                  |
  |  <── {replace: chat UI}              |
  |                                      |
  |  User types "Hello"                  |
  |  POST /bw/return/action/:id           |
  |  {action:"send", inputValue:"Hello"} |
  |                                      |  → POST to LLM API (streaming)
  |  <── {append: user bubble}           |
  |  <── {append: assistant bubble}      |
  |  <── {patch: "Hello"}               |  ← token "Hello"
  |  <── {patch: "Hello! How"}          |  ← token "! How"
  |  <── {patch: "Hello! How can I..."}  |  ← token " can I..."
  |  ...                                 |
```

1. bwserve generates a shell HTML page with bitwrench loaded
2. The chat UI is rendered server-side as TACO objects pushed over SSE
3. When the user sends a message, it POSTs to the server
4. The server calls the LLM API with streaming enabled
5. As tokens arrive, the server patches the assistant message bubble
6. The browser updates in real-time — no client JS beyond bitwrench

## Files

| File | Description |
|------|-------------|
| `server.js` | bwserve app (~180 lines) — chat UI + LLM streaming |
| `README.md` | This file |

## Requirements

- Node.js 18+ (uses built-in `fetch`)
- An OpenAI-compatible LLM endpoint
