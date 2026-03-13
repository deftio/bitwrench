# Bitwrench Demo App Ideas for the LLM Crowd

These are standalone demo apps designed to show the bitwrench/bwserve value proposition to developers coming from Streamlit, Gradio, Chainlit, or custom React setups. Each one is a single `.mjs` file + `npm install bitwrench`. No build step, no config, no framework.

The goal: a developer clones the repo, runs `node demo.mjs`, opens `localhost:PORT`, and immediately sees something impressive — then looks at the code and thinks "wait, that's it?"

---

## 1. Tool Use Visualizer — "Watch an Agent Think"

### What it is

A real-time visualization of an LLM agent executing a multi-step task. The user gives a prompt ("research the weather in Tokyo and write a summary"), and the UI renders each step of the agent's reasoning as it happens: the LLM's thinking, each tool call, each tool result, and the final answer — all streaming live.

### Why this demo

- **Shows off SSE streaming** — the agent's entire execution streams to the browser in real-time via TACO patches. No polling, no WebSocket, no manual refresh.
- **Shows off `renderAppend()`** — each step is appended to a growing timeline. The server pushes new TACO nodes as the agent progresses.
- **Shows off BCCL components** — each step is a `makeCard()` with status badges, expandable detail, and color-coded borders.
- **Hits the zeitgeist** — tool use / function calling is the #1 topic in LLM development right now. Every developer building agents wants to see what's happening inside the loop.
- **Competes with LangSmith/LangFuse** — those are SaaS observability platforms. This is the same visualization in 150 lines of code, running locally.

### Layout

```
+----------------------------------------------------------+
|  Agent Visualizer              [model: qwen3.5:9b]  Run  |
+----------------------------------------------------------+
|  Prompt: [____________________________________] [Submit] |
+----------------------------------------------------------+
|                                                          |
|  Step 1: Thinking                           [2.3s]       |
|  +----------------------------------------------------+  |
|  | "I need to find the current weather in Tokyo.       |  |
|  |  I'll use the weather tool."                        |  |
|  +----------------------------------------------------+  |
|                                                          |
|  Step 2: Tool Call — get_weather              [1.1s]     |
|  +----------------------------------------------------+  |
|  | Input:  { "city": "Tokyo", "units": "celsius" }     |  |
|  | Output: { "temp": 22, "condition": "partly cloudy"} |  |
|  +----------------------------------------------------+  |
|                                                          |
|  Step 3: Thinking                           [1.8s]       |
|  +----------------------------------------------------+  |
|  | "Now I have the weather data. Let me also check     |  |
|  |  the forecast for tomorrow..."                      |  |
|  +----------------------------------------------------+  |
|                                                          |
|  Step 4: Tool Call — get_forecast             [0.9s]     |
|  +----------------------------------------------------+  |
|  | Input:  { "city": "Tokyo", "days": 1 }              |  |
|  | Output: { "tomorrow": { "high": 25, "low": 18 } }  |  |
|  +----------------------------------------------------+  |
|                                                          |
|  Step 5: Final Answer                       [3.2s]       |
|  +----------------------------------------------------+  |
|  | Tokyo is currently 22C and partly cloudy. Tomorrow  |  |
|  | expect a high of 25C and a low of 18C. Good day     |  |
|  | for outdoor activities.                             |  |
|  +----------------------------------------------------+  |
|                                                          |
|  Total: 5 steps, 3 tool calls, 9.3s                     |
+----------------------------------------------------------+
```

### Architecture

```
Server (node app.mjs)
  |
  +-- app.page('/', handler)
  |     |
  |     +-- client.render() — initial layout (prompt input + empty timeline)
  |     +-- client.on('run') — receives prompt from user
  |           |
  |           +-- Ollama /api/chat with tools[] definition
  |           +-- On each streamed chunk:
  |           |     +-- If thinking text: client.call('addThinkingStep', text)
  |           |     +-- If tool_call: client.call('addToolCallStep', name, args)
  |           +-- Execute tool locally (mock or real)
  |           +-- client.call('addToolResultStep', name, result)
  |           +-- Loop: send tool result back to Ollama, continue
  |           +-- On final answer: client.call('addFinalStep', answer)
  |           +-- client.call('showSummary', stats)

Client (browser)
  |
  +-- Registered functions:
        +-- addThinkingStep(text) — appends a "thinking" card to #timeline
        +-- addToolCallStep(name, args) — appends a "tool call" card (yellow border)
        +-- addToolResultStep(name, result) — updates the tool card with result
        +-- addFinalStep(answer) — appends the final answer card (green border)
        +-- showSummary(stats) — appends a summary bar at the bottom
```

### Tools to implement (mock or real)

Keep it simple — 3-4 tools that are easy to demo:

- `get_weather(city)` — return hardcoded or fetch from a free API
- `get_time(timezone)` — return `new Date().toLocaleString()` for the timezone
- `calculate(expression)` — `eval()` a math expression (safe enough for a demo)
- `search(query)` — return mock results or hit a free search API

### Key code patterns to highlight

```js
// Server pushes a new step card as the agent progresses
client.call('addStep', {
  type: 'tool_call',
  name: 'get_weather',
  input: { city: 'Tokyo' },
  status: 'running'  // shows spinner
});

// Later, update the same card with the result
client.call('updateStep', stepId, {
  status: 'complete',
  output: { temp: 22, condition: 'partly cloudy' },
  duration: '1.1s'
});
```

```js
// Client-side: each step is a BCCL card with color-coded border
function addStep(step) {
  var colors = { thinking: '#3498db', tool_call: '#e67e22', tool_result: '#27ae60', final: '#2ecc71' };
  var card = bw.createDOM(bw.makeCard({
    title: step.type + (step.name ? ' — ' + step.name : ''),
    content: formatStepContent(step),
    variant: step.type === 'final' ? 'success' : 'default'
  }));
  card.style.borderLeft = '4px solid ' + colors[step.type];
  document.getElementById('timeline').appendChild(card);
}
```

### Estimated size

~150-200 lines server code. Shows off: SSE streaming, TACO rendering, BCCL cards/badges, `client.call()` RPC, `client.patch()` for updating in-place, Ollama tool use API.

---

## 2. Prompt Playground — "The LLM Hello World"

### What it is

A single-page tool for experimenting with LLM prompts. System prompt editor on the left, chat on the right, model parameters (temperature, top-p, max tokens) as sliders above. Every LLM developer builds this — if bitwrench makes it trivial, that's the onramp.

### Why this demo

- **It's the first thing every LLM developer wants.** Before building an app, they want to test prompts. If bitwrench is the fastest way to get a prompt playground running locally, developers will reach for it first.
- **Shows off the split-pane pattern** — system prompt editor (QuikdownEditor or textarea) on the left, chat (QuikChat) on the right.
- **Shows off BCCL form components** — sliders, selects, inputs for model parameters.
- **Shows off per-client state** — each browser tab is an independent playground session.
- **Dead simple** — should be under 100 lines. If it's more, something is wrong.

### Layout

```
+------------------------------------------------------------+
|  Prompt Playground        [model: v] [temp: ===] [Run]     |
+------------------------------------------------------------+
|  System Prompt          |  Chat                            |
|  +--------------------+ | +------------------------------+ |
|  | You are a helpful  | | | You: What's 2+2?            | |
|  | assistant that     | | |                              | |
|  | speaks like a      | | | AI: Arrr, that be 4,        | |
|  | pirate.            | | | ye scurvy landlubber!        | |
|  |                    | | |                              | |
|  |                    | | |                              | |
|  |                    | | |                              | |
|  +--------------------+ | +------------------------------+ |
|                         | | [Type a message...]   [Send] | |
+------------------------------------------------------------+
```

### Architecture

```
Server (node app.mjs)
  |
  +-- app.page('/', handler)
  |     |
  |     +-- client.render() — layout with system prompt textarea,
  |     |                      parameter controls, chat container
  |     +-- client.on('chat-send') — receives message + current system prompt + params
  |     |     |
  |     |     +-- Build messages array with system prompt
  |     |     +-- Call Ollama with temperature/top_p from sliders
  |     |     +-- Stream tokens back via client.call('updateMsg', accumulated)
  |     |
  |     +-- client.on('param-change') — update model/temperature/top_p in state
  |     +-- client.on('system-prompt-change') — update system prompt in state
```

### Key selling points in the code

```js
// The entire parameter bar is one TACO object using BCCL
client.render('#params', { t: 'div', a: { class: 'bw_flex bw_gap_md' }, c: [
  bw.makeSelect({ label: 'Model', options: models, id: 'model-select' }),
  bw.makeInput({ label: 'Temperature', type: 'range', min: 0, max: 2, step: 0.1, value: 0.7 }),
  bw.makeInput({ label: 'Top-P', type: 'range', min: 0, max: 1, step: 0.05, value: 0.9 }),
  bw.makeInput({ label: 'Max Tokens', type: 'number', value: 1024, min: 1, max: 4096 })
]});
```

The pitch: "This is a full prompt playground. It's 80 lines. There's no `package.json` with 47 dependencies. There's no webpack config. There's no React."

### Estimated size

~80-120 lines. The simplest demo of the set. Good for README, tutorials, and "getting started" docs.

---

## 3. Multi-Model Arena — "Side-by-Side Comparison"

### What it is

Send one prompt to 2-3 Ollama models simultaneously. Each model gets its own panel, streaming its response in real-time. See which model is faster, which gives a better answer, which uses more tokens. Vote on the winner (like Chatbot Arena but local).

### Why this demo

- **SSE multiplexing** — multiple independent streams to the same browser, updating different panels concurrently. This is something Streamlit genuinely can't do well because of its single-thread rerun model.
- **Shows off `client.call()` targeting** — same server, same client, but updates routed to different DOM panels.
- **Visually impressive** — watching 3 models race to answer the same question is inherently compelling.
- **Practical** — developers actually want this when evaluating models. It's useful, not just a demo.

### Layout

```
+--------------------------------------------------------------+
|  Model Arena                                          [Run]  |
+--------------------------------------------------------------+
|  Prompt: [__________________________________________] [Send] |
+--------------------------------------------------------------+
|  qwen3.5:9b        |  llama3.1:8b       |  gemma2:9b        |
|  +--------------+   |  +--------------+   |  +--------------+ |
|  | The answer   |   |  | Well, the    |   |  | Let me think | |
|  | to your      |   |  | key thing    |   |  | about this   | |
|  | question is  |   |  | here is...   |   |  | carefully... | |
|  | ...          |   |  | ...          |   |  |              | |
|  +--------------+   |  +--------------+   |  +--------------+ |
|  [tokens: 142]      |  [tokens: 98]       |  [streaming...] | |
|  [time: 3.2s]       |  [time: 2.1s]       |                 | |
|  [Vote Best]        |  [Vote Best]        |  [Vote Best]    | |
+--------------------------------------------------------------+
```

### Architecture

```
Server
  |
  +-- client.on('send-prompt')
        |
        +-- For each model (parallel):
              +-- ollamaStreamChat(model, messages, onToken, onDone)
              +-- onToken: client.call('updatePanel', modelIndex, accumulated)
              +-- onDone: client.call('finalizePanel', modelIndex, stats)
```

### Key code pattern

```js
// Stream to all models in parallel
var models = ['qwen3.5:9b', 'llama3.1:8b', 'gemma2:9b'];
models.forEach(function(model, i) {
  ollamaStreamChat(model, messages,
    function(acc) { client.call('updatePanel', i, acc); },
    function(err, text) { client.call('finalizePanel', i, { text, tokens, time }); }
  );
});
```

The concurrent streaming is the "wow" moment. Three panels filling up at different speeds, racing to completion.

### Estimated size

~120-150 lines. Moderate complexity. The parallel streaming logic is the interesting part.

---

## 4. RAG Chat with Source Highlights — "See Where the Answer Comes From"

### What it is

Chat interface on the left, document viewer on the right. Drop in a text file or paste a document. Ask questions about it. When the LLM answers, the relevant source passages highlight in the document viewer in real-time as the LLM cites them.

### Why this demo

- **Shows off `client.patch()`** — targeted highlighting of specific passages without re-rendering the whole document.
- **Shows off the split-pane pattern** — chat + document, same as LiquidUI but with a different coordination pattern.
- **RAG is the #1 LLM use case** — every enterprise developer is building this. Showing source attribution visually is a killer feature that most RAG UIs don't do well.
- **Practical** — this is actually useful for testing RAG pipelines.

### Layout

```
+------------------------------------------------------------+
|  RAG Chat                    [Load Document] [Clear]       |
+------------------------------------------------------------+
|  Chat                       |  Source Document             |
|  +------------------------+ | +------------------------+   |
|  | You: What's the return | | | ...                    |   |
|  | policy?                | | | Section 3.2: Returns   |   |
|  |                        | | | +-[HIGHLIGHTED]------+ |   |
|  | AI: According to       | | | | Customers may       | |   |
|  | section 3.2, customers | | | | return items within  | |   |
|  | may return items       | | | | 30 days of purchase  | |   |
|  | within 30 days...      | | | +--------------------+ |   |
|  |                        | | | ...                    |   |
|  +------------------------+ | +------------------------+   |
|  | [Ask a question...] [>]| |                              |
+------------------------------------------------------------+
```

### How it works

1. Document is chunked on the server (simple paragraph splitting)
2. Each chunk is rendered as a `<div>` with a unique `data-bw_id` (e.g., `chunk-0`, `chunk-1`, ...)
3. User asks a question
4. Server does naive similarity search (or just sends all chunks as context — it's a demo)
5. System prompt asks the LLM to cite chunk numbers: `[cite:3]`, `[cite:7]`
6. As the LLM streams, server parses cite tags and calls `client.patch('chunk-3', 'highlighted', 'class')` to highlight the source
7. Highlights appear in real-time as the answer streams

### Key code pattern

```js
// Parse citations from streaming text and highlight sources in real-time
var citeRegex = /\[cite:(\d+)\]/g;
var cited = new Set();

function onToken(accumulated) {
  // Check for new citations
  var match;
  while ((match = citeRegex.exec(accumulated)) !== null) {
    var chunkId = match[1];
    if (!cited.has(chunkId)) {
      cited.add(chunkId);
      // Highlight the source chunk in the document panel
      client.patch('chunk-' + chunkId, 'chunk chunk-highlighted', 'class');
    }
  }
  // Update chat (strip cite tags for display)
  pendingContent = accumulated.replace(citeRegex, '');
}
```

### Estimated size

~180-220 lines. The most complex demo, but the visual payoff is the highest. Seeing source passages light up as the LLM generates its answer is a "wow" moment.

---

## 5. MCP Inspector — "A GUI for Any MCP Tool Server"

### What it is

Connect to a local MCP (Model Context Protocol) server, discover its available tools, display each tool as a card with its schema, and let the user invoke any tool with a generated form. Results render live. Optionally, let an LLM use the tools via chat.

### Why this demo

- **MCP is everywhere right now** — it's the protocol Claude, Cursor, and others use for tool integration. There's no good lightweight GUI inspector for MCP servers.
- **Shows off BCCL perfectly** — each tool becomes a `makeCard()`, each tool's input schema becomes a `makeForm()` with `makeInput()`/`makeSelect()` fields auto-generated from JSON schema. This is the BCCL's moment to shine.
- **Shows off server-driven dynamic UI** — the server discovers tools at runtime and pushes their UIs to the browser. The client has no idea what tools exist until the server tells it. This is the bwserve model at its best.
- **Practical** — developers building MCP servers need a way to test them. This tool fills a real gap.

### Layout

```
+-------------------------------------------------------------+
|  MCP Inspector          [server: stdio://my-server] [Reload] |
+-------------------------------------------------------------+
|                                                             |
|  Available Tools (3)                                        |
|                                                             |
|  +-------------------------------------------------------+  |
|  | get_weather                                            |  |
|  | Get current weather for a city                         |  |
|  |                                                        |  |
|  | City: [__________]  Units: [celsius v]                 |  |
|  |                                        [Invoke]        |  |
|  |                                                        |  |
|  | Result:                                                |  |
|  | { "temp": 22, "condition": "partly cloudy" }           |  |
|  +-------------------------------------------------------+  |
|                                                             |
|  +-------------------------------------------------------+  |
|  | search_docs                                            |  |
|  | Search documentation by keyword                        |  |
|  |                                                        |  |
|  | Query: [__________]  Limit: [10]                       |  |
|  |                                        [Invoke]        |  |
|  +-------------------------------------------------------+  |
|                                                             |
|  +-------------------------------------------------------+  |
|  | run_query                                              |  |
|  | Execute a SQL query against the database               |  |
|  |                                                        |  |
|  | SQL: [________________________________]                |  |
|  |                                        [Invoke]        |  |
|  +-------------------------------------------------------+  |
|                                                             |
+-------------------------------------------------------------+
```

### Architecture

```
Server (node app.mjs)
  |
  +-- On startup: connect to MCP server (stdio or SSE transport)
  |     +-- Call tools/list to discover available tools
  |
  +-- app.page('/', handler)
  |     |
  |     +-- For each tool: generate a TACO card from its JSON schema
  |     |     +-- tool.name → card title
  |     |     +-- tool.description → card body text
  |     |     +-- tool.inputSchema.properties → form fields (auto-generated)
  |     |     +-- "Invoke" button → data-bw-action with tool name
  |     |
  |     +-- client.render('#tools', array of tool cards)
  |     |
  |     +-- client.on('invoke-<toolName>') — receives form data
  |           +-- Call MCP tools/call with the input
  |           +-- client.patch('result-<toolName>', formatted result)
```

### Key code pattern — auto-generating forms from JSON schema

```js
// Server discovers tools and generates UI dynamically
var tools = await mcpClient.listTools();

var toolCards = tools.map(function(tool) {
  // Generate form fields from JSON schema
  var fields = Object.entries(tool.inputSchema.properties).map(function([name, prop]) {
    if (prop.enum) {
      return bw.makeSelect({ label: name, options: prop.enum, id: tool.name + '-' + name });
    }
    return bw.makeInput({
      label: name,
      type: prop.type === 'number' ? 'number' : 'text',
      placeholder: prop.description || '',
      id: tool.name + '-' + name
    });
  });

  return bw.makeCard({
    title: tool.name,
    content: [
      { t: 'p', a: { class: 'bw_text_muted' }, c: tool.description },
      bw.makeForm({ children: fields }),
      bw.makeButton({ text: 'Invoke', 'data-bw-action': 'invoke-' + tool.name }),
      { t: 'pre', a: { 'data-bw_id': 'result-' + tool.name, class: 'bw_text_mono' }, c: '' }
    ]
  });
});

client.render('#tools', { t: 'div', c: toolCards });
```

### Estimated size

~150-200 lines (excluding MCP client setup). The dynamic form generation from JSON schema is the showcase — it demonstrates why server-driven UI works: the server knows the schema, generates the UI, pushes it. No client-side schema parsing needed.

---

## Priority Ranking

For maximum impact with minimum effort:

| Priority | Demo | Lines | Wow Factor | Practical Use | Audience |
|----------|------|-------|------------|---------------|----------|
| 1 | **Prompt Playground** | ~100 | Medium | High | Every LLM dev |
| 2 | **Tool Use Visualizer** | ~175 | High | High | Agent builders |
| 3 | **Multi-Model Arena** | ~130 | High | Medium | Model evaluators |
| 4 | **MCP Inspector** | ~180 | Medium | Very High | MCP developers |
| 5 | **RAG Chat + Highlights** | ~200 | Very High | High | Enterprise RAG |

**Recommended launch set:** Prompt Playground + Tool Use Visualizer. One is the "hello world" that gets people started, the other is the "holy shit" that gets people excited. Ship those two first, add the others over time.

---

## Cross-cutting Implementation Notes

### What every demo should have

- **Single file.** One `.mjs` file, `node demo.mjs`, done. The pitch is simplicity — don't undercut it with multi-file setups.
- **Model auto-detection.** Call Ollama `/api/tags` on startup, pick the first available model, show it in the header. Don't fail if the user doesn't have the exact model.
- **Graceful Ollama-offline handling.** Show a clear "Ollama not running" card with instructions, not a crash.
- **A README comment at the top.** First 5 lines of the file should explain what it does and how to run it.

### What makes these demos bitwrench-specific

Every demo above *could* be built with React or Streamlit. The differentiator is:

1. **One file, zero build** — no `create-react-app`, no `vite.config.ts`, no `requirements.txt`
2. **Server-driven** — the server owns all logic, the client is a thin renderer
3. **SSE streaming** — real-time updates without WebSocket complexity
4. **BCCL components** — cards, forms, badges, alerts without importing a component library
5. **~100-200 lines** — the React equivalent would be 500-1000+ across multiple files

This is the story every demo tells: "Look how little code this took."
