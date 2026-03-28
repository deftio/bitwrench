# bwmcp -- MCP Server for Bitwrench

bwmcp is an MCP (Model Context Protocol) server that lets AI agents build
and control live browser UI through bitwrench. An agent connects via MCP,
calls tools to compose TACO components, and the result renders live in a
browser window. The agent can screenshot, inspect, and iterate.

## Quick Start

### 1. Configure in Claude Code

Add to your Claude Code MCP settings (`~/.claude/settings.json` or project `.mcp.json`):

```json
{
  "mcpServers": {
    "bitwrench": {
      "command": "node",
      "args": ["/path/to/bitwrench/bin/bwmcp.js"]
    }
  }
}
```

Or if bitwrench is installed globally (`npm install -g bitwrench`):

```json
{
  "mcpServers": {
    "bitwrench": {
      "command": "bwmcp"
    }
  }
}
```

### 2. Configure in Cursor / VS Code

In your project's `.cursor/mcp.json` or VS Code MCP settings:

```json
{
  "mcpServers": {
    "bitwrench": {
      "command": "node",
      "args": ["/path/to/bitwrench/bin/bwmcp.js", "--open"]
    }
  }
}
```

### 3. Use It

Ask the AI agent:

> "Build me a dashboard with stat cards showing revenue, users, and orders."

The agent will:
1. Call `bitwrench_start_here` to learn the workflow
2. Call `make_stat_card` three times with appropriate props
3. Compose the cards into a grid layout
4. Call `build_page` with a theme to produce a standalone HTML file

With `--open` or live rendering, the agent can also push UI to a browser
and iterate visually using screenshots.

## CLI Options

```
bwmcp [options]

Options:
  --port <n>      bwserve port for live browser rendering (default: 7910)
  --theme <name>  Default theme preset (ocean, forest, sunset, etc.)
  --open          Open browser automatically on start
  --no-browser    Skip starting bwserve (testing/offline mode)
  --help, -h      Show help
```

## How It Works

```
AI Agent (Claude, Cursor, etc.)
    |
    | JSON-RPC 2.0 over stdio
    |
bwmcp ──────────────────────────────────────
    |                                        |
    |  MCP Protocol Handler                  |
    |    tools/list -> 21 tools              |
    |    tools/call -> execute tool           |
    |                                        |
    |  Knowledge Tools (5)                   |
    |    Read docs from disk, serve to LLM   |
    |                                        |
    |  Component Tools (10)                  |
    |    Call bw.makeCard(), etc.             |
    |    Return TACO JSON                    |
    |                                        |
    |  Utility Tools (3)                     |
    |    render_taco, build_page, make_styles |
    |                                        |
    |  Live Tools (3)                        |
    |    Push to browser via bwserve SSE     |
    |                                        |
    |  bwserve instance (port 7910)          |
    |    HTTP server + SSE streaming         |
────|────────────────────────────────────────
    |
    | HTTP / SSE
    |
Browser Window
    Renders TACO, captures screenshots
```

## The Core Loop

The primary value of bwmcp is the iterative render-screenshot-adjust loop:

```
Agent                          bwmcp                         Browser
  |                              |                              |
  |-- bitwrench_start_here ----->|                              |
  |<-- orientation text ---------|                              |
  |                              |                              |
  |-- make_stat_card {...} ----->|                              |
  |<-- TACO JSON ----------------|                              |
  |                              |                              |
  |-- render_live {taco} ------->|-- SSE: replace #app -------->|
  |<-- {rendered, clientCount} --|                              |-- UI visible
  |                              |                              |
  |-- screenshot {} ------------>|-- screenshot request -------->|
  |<-- PNG image data -----------|<-- html2canvas capture ------|
  |                              |                              |
  |  (agent evaluates image,     |                              |
  |   decides to adjust)         |                              |
  |                              |                              |
  |-- render_live {patch} ------>|-- SSE: patch ---------------->|
  |<-- {rendered} ---------------|                              |-- UI updated
```


## Tool Reference

### Knowledge Tools

These return documentation text. They teach the LLM how to use bitwrench.

| Tool | Description | When to Call |
|------|-------------|--------------|
| `bitwrench_start_here` | 30-line orientation: TACO, workflow, key rules | Always first |
| `bitwrench_guide` | Full developer guide (629 lines). Optional `section` filter. | Before building UI |
| `bitwrench_components` | Props reference for all 50+ make*() components. Optional `component` filter. | When configuring components |
| `bitwrench_server_guide` | bwserve tutorial for server-driven UI | Only for live/streaming UI |
| `bitwrench_themes` | Theme presets, palettes, color utilities | When choosing/customizing themes |

**Section filter** for `bitwrench_guide`:
```
taco, levels, events, css, components, bwserve, routing, api-reference, rules
```

**Component filter** for `bitwrench_components`:
```
makeCard, makeButton, makeTable, makeTabs, makeAccordion, makeAlert,
makeNav, makeHero, makeStatCard, makeFormGroup, ... (47+ total)
```

### Component Tools

Each returns a TACO object (JSON) that can be composed or rendered.

| Tool | Props | Description |
|------|-------|-------------|
| `make_card` | title, subtitle, content, footer, image, variant, ... | Card with optional header image |
| `make_button` | text, variant, size, disabled, type | Button with color variant |
| `make_table` | data, columns, striped, hover, sortable | Data table with sorting |
| `make_tabs` | tabs: [{label, content}], activeIndex | Tabbed interface |
| `make_accordion` | items: [{title, content}], multiOpen | Collapsible sections |
| `make_alert` | content, variant, dismissible | Alert/notification box |
| `make_nav` | items: [{text, href, active}], pills, vertical | Navigation links |
| `make_hero` | title, subtitle, content, variant, size, actions | Full-width hero section |
| `make_stat_card` | label, value, change, prefix, suffix, icon, variant | KPI stat card |
| `make_form_group` | label, input, help, id, required, validation | Label + input wrapper |

**Variants:** primary, secondary, success, danger, warning, info

### Utility Tools

| Tool | Input | Output |
|------|-------|--------|
| `render_taco` | `{taco, indent}` | HTML string |
| `build_page` | `{title, content, theme, runtime}` | Complete standalone HTML page |
| `make_styles` | `{primary, secondary, background, surface}` | CSS text |

### Live Rendering Tools

These require a browser connected to the bwserve instance.

| Tool | Input | Output |
|------|-------|--------|
| `render_live` | `{target, taco, action}` | Push TACO to browser. Actions: replace, append, patch, remove |
| `screenshot` | `{selector}` | Base64 PNG image of browser viewport |
| `query_dom` | `{code}` | Execute JS in browser, return result |


## Guide for LLM Agents

This section is written for you, the AI agent. When you connect to bwmcp
via MCP, follow this workflow.

### Step 1: Orient Yourself

Call `bitwrench_start_here`. It returns a 30-line cheat sheet covering:
- What bitwrench is (zero-dep JS UI library)
- The TACO format: `{t: 'div', a: {class: 'x'}, c: 'content'}`
- Your 5-step workflow
- Key rules (compose TACOs, use grid, pick a theme)
- Which other knowledge tools to call

This costs about 200 tokens. Always call it first.

### Step 2: Learn (Optional but Recommended)

If you have not used bitwrench before, call `bitwrench_guide`. This is the
full tutorial (about 4000 tokens). It covers TACO nesting, the three-level
component model, events, CSS/theming, all component categories, debugging,
bwserve, routing, and API reference tables.

If you only need info on specific topics, use the section filter:
```
bitwrench_guide({section: 'css'})       // just CSS and theming
bitwrench_guide({section: 'components'}) // component categories
```

### Step 3: Look Up Component Props

When you need exact props for a component, call:
```
bitwrench_components({component: 'makeStatCard'})
```
This returns the detailed signature, props, variants, and examples for
that specific component. Much cheaper than loading the full catalog.

### Step 4: Build Components

Call the make_* tools to create TACO objects:
```
make_stat_card({label: 'Revenue', value: '$12,345', variant: 'primary'})
make_stat_card({label: 'Users', value: '1,234', variant: 'success'})
make_table({data: [...], columns: [{key:'name', label:'Name'}, ...]})
```

Each returns a TACO object in `structuredContent`. Save these for composition.

### Step 5: Compose Layout

Nest the TACOs into a grid layout. The bitwrench grid uses three classes:
```
bw_container > bw_row > bw_col
```

Build a layout TACO by nesting:
```json
{
  "t": "div", "a": {"class": "bw_container"}, "c": [
    {"t": "h1", "c": "Dashboard"},
    {"t": "div", "a": {"class": "bw_row"}, "c": [
      {"t": "div", "a": {"class": "bw_col"}, "c": [<stat1 taco>]},
      {"t": "div", "a": {"class": "bw_col"}, "c": [<stat2 taco>]},
      {"t": "div", "a": {"class": "bw_col"}, "c": [<stat3 taco>]}
    ]},
    <table taco>
  ]
}
```

### Step 6: Generate Output

**For a standalone HTML file** (the typical case):
```
build_page({
  title: 'My Dashboard',
  theme: 'ocean',
  content: <your composed layout TACO>
})
```
Returns a complete `.html` file with bitwrench inlined. Works offline.
Save it to disk with your file-writing tool.

**For live browser rendering:**
```
render_live({target: '#app', taco: <your layout TACO>})
```
The UI appears immediately in the browser at http://localhost:7910.

### Step 7: Iterate (Live Mode)

If using live rendering:
```
screenshot({})           // see what the browser shows
screenshot({selector: '.bw_stat_card:first-child'})  // zoom in on one element
query_dom({code: 'document.querySelectorAll(".bw_card").length'})  // count cards
```

Evaluate the screenshot, decide what to change, and call `render_live` again.

### Key Rules

1. Every make*() tool returns a TACO object, NOT HTML
2. Compose by nesting TACOs in the `c` field: `{t:'div', c: [taco1, taco2]}`
3. Grid layout: `bw_container > bw_row > bw_col`
4. Always use a theme with `build_page` (ocean, forest, sunset, midnight, etc.)
5. Call `render_taco` to preview a single TACO as HTML
6. Call `build_page` as the final step to get a standalone file
7. The `structuredContent` field in tool results contains the TACO as a parsed object -- use it directly when composing
8. Do NOT generate raw HTML strings -- always work with TACO objects

### Common Mistakes

- **Stacking everything vertically.** Use the grid (bw_container/bw_row/bw_col).
- **Calling build_page per component.** Build all components first, compose into one layout, then call build_page once.
- **Ignoring themes.** `build_page` with no theme produces unstyled output. Always pass a theme name.
- **Generating HTML strings.** The tools return TACO objects. Compose TACOs, not HTML. Call render_taco or build_page only at the end.
- **Not calling start_here first.** Without orientation, you will misuse the tools.

### Token Budget

| Knowledge Tool | Tokens | When Needed |
|---------------|--------|-------------|
| bitwrench_start_here | ~200 | Always (first call) |
| bitwrench_guide | ~4,000 | Usually (first session) |
| bitwrench_guide (section) | ~300-600 | When refreshing one topic |
| bitwrench_components | ~6,500 | When configuring components |
| bitwrench_components (one) | ~100-300 | When looking up one component |
| bitwrench_server_guide | ~1,800 | Only for server-driven UI |
| bitwrench_themes | ~1,900 | Only when theming matters |

Minimal session: start_here (200) + a few make_* calls = under 1K tokens of context.
Typical session: start_here (200) + guide (4K) + components (6.5K) = about 11K tokens.


## Programmatic Usage (Node.js)

```javascript
import { createMcpServer } from 'bitwrench/mcp';

var server = createMcpServer({
  port: 7910,
  theme: 'ocean',
  open: true
});

server.listen();
```

## Programmatic Usage (Python)

Two example projects demonstrate Python integration:

- **`examples/mcp-agent/`** -- Scripted agent that builds a dashboard and
  saves a standalone HTML file. Demonstrates the full tool workflow
  (orient, build, compose, export, screenshot, inspect).

- **`examples/mcp-agent-live/`** -- Connects a local LLM (ollama, lmstudio,
  openrouter, or openai) to bwmcp. You type a prompt, the LLM decides what
  to build, and you watch components appear one by one in the browser with a
  live progress bar. Run `python3 live_builder.py --no-llm` for a demo
  without any LLM.

The pattern works with any language -- bwmcp speaks JSON-RPC
2.0 over stdin/stdout.

```python
import subprocess, json

proc = subprocess.Popen(
    ['node', '/path/to/bin/bwmcp.js', '--no-browser'],
    stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
    text=True
)

def call_tool(name, args={}):
    msg = {"jsonrpc": "2.0", "id": 1, "method": "tools/call",
           "params": {"name": name, "arguments": args}}
    proc.stdin.write(json.dumps(msg) + "\n")
    proc.stdin.flush()
    return json.loads(proc.stdout.readline())

# Orient
orientation = call_tool("bitwrench_start_here")
print(orientation["result"]["content"][0]["text"][:200])

# Build a card
card = call_tool("make_card", {"title": "Hello", "content": "World"})
taco = card["result"]["structuredContent"]

# Build a full page
page = call_tool("build_page", {
    "title": "My Page", "theme": "ocean", "content": taco
})
html = page["result"]["content"][0]["text"]

with open("output.html", "w") as f:
    f.write(html)
```


## Architecture Notes

- bwmcp runs as a single Node.js process
- MCP protocol is JSON-RPC 2.0 over stdio (newline-delimited)
- bwserve runs as an embedded HTTP+SSE server on port 7910
- Knowledge tools read docs from disk at call time (always fresh)
- Component tools call `bw.makeCard()` etc. from source directly (not dist)
- No runtime dependencies beyond Node.js stdlib
- No build step needed -- bwmcp runs from source


## Related Documentation

- [LLM Guide](llm-bitwrench-guide.md) -- The full developer guide served by `bitwrench_guide`
- [Component Library](component-library.md) -- Full props reference served by `bitwrench_components`
- [Theming](theming.md) -- Theme configuration served by `bitwrench_themes`
- [bwserve Tutorial](tutorial-bwserve.md) -- Server-driven UI served by `bitwrench_server_guide`
- [bwserve Protocol](bwserve.md) -- Wire protocol details (SSE message types)
- [MCP Server Design](../dev/bitwrench-mcp-server-design.md) -- Internal design document
