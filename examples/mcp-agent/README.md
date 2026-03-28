# MCP Agent Example (Python)

A Python script that connects to bwmcp over stdio and builds a live
dashboard UI. Demonstrates the full agent workflow: orient, build
components, compose layout, render live, screenshot, inspect, iterate.

## What This Shows

- **MCP stdio protocol**: JSON-RPC 2.0 over stdin/stdout to a Node.js server
- **Knowledge-first workflow**: Agent calls `bitwrench_start_here` before building
- **TACO composition**: Build components individually, nest into grid layout
- **Live rendering**: Push UI to browser via `render_live` (bwserve SSE)
- **Screenshot feedback**: Capture browser state, save to disk for inspection
- **DOM inspection**: `query_dom` to read element counts, text content, etc.
- **Standalone export**: `build_page` produces an offline HTML file with theme

## Requirements

- Python 3.8+
- Node.js 18+
- bitwrench (this repo -- no install needed, runs from source)

No pip packages required. The script uses only Python stdlib.

## Running

```bash
# From this directory:
python3 mcp_agent.py

# Or from the repo root:
python3 examples/mcp-agent/mcp_agent.py

# With live browser rendering (opens browser):
python3 mcp_agent.py --live

# Custom theme:
python3 mcp_agent.py --theme forest

# Save screenshot to a specific path:
python3 mcp_agent.py --live --screenshot dashboard.png
```

## What It Does

The script builds a sales metrics dashboard in six phases:

1. **Connect** -- Spawns `bin/bwmcp.js` as a child process, sends `initialize`
2. **Orient** -- Calls `bitwrench_start_here`, prints the orientation summary
3. **Discover** -- Calls `tools/list`, prints available tool count
4. **Build** -- Calls `make_stat_card` (x3) and `make_table` to create components
5. **Compose** -- Nests components into a `bw_container > bw_row > bw_col` grid
6. **Export** -- Calls `build_page` with ocean theme, saves `dashboard.html`

In `--live` mode, it also:
7. **Render** -- Pushes the layout to the browser via `render_live`
8. **Screenshot** -- Captures the browser via `screenshot`, saves PNG
9. **Inspect** -- Calls `query_dom` to count elements and read text

## How It Works

```
Python Script                bwmcp                          Browser
  |                            |                               |
  | spawn + stdin/stdout       |                               |
  |--------------------------->|                               |
  |                            |                               |
  | initialize                 |                               |
  |--------------------------->|                               |
  |<-- capabilities            |                               |
  |                            |                               |
  | tools/call start_here      |                               |
  |--------------------------->|                               |
  |<-- orientation text        |                               |
  |                            |                               |
  | tools/call make_stat_card  |                               |
  |--------------------------->|                               |
  |<-- TACO JSON               |                               |
  |    (x3 stat cards +        |                               |
  |     1 table)               |                               |
  |                            |                               |
  | tools/call build_page      |                               |
  |--------------------------->|                               |
  |<-- full HTML page          |                               |
  |                            |                               |
  | (save dashboard.html)      |                               |
  |                            |                               |
  | tools/call render_live     |                               |
  |--------------------------->|-- SSE: replace #app ---------> |
  |<-- {rendered}              |                               |-- UI visible
  |                            |                               |
  | tools/call screenshot      |                               |
  |--------------------------->|-- screenshot request --------> |
  |<-- PNG base64              |<-- html2canvas capture ------- |
  |                            |                               |
  | (save dashboard.png)       |                               |
  |                            |                               |
  | tools/call query_dom       |                               |
  |--------------------------->|-- eval JS ------  -----------> |
  |<-- "3" (stat card count)   |<-- result -------------------- |
```

## Structure

```
mcp-agent/
  mcp_agent.py         <- Python MCP client + dashboard builder (~280 lines)
  README.md            <- this file
```

## Output Files

After running, you will find in the current directory:

- `dashboard.html` -- Standalone HTML page with ocean theme (works offline)
- `dashboard.png` -- Browser screenshot (only with `--live`)

## Adapting This Example

This script is a template for any language that can spawn a process and
read/write stdio. The key pattern:

```python
# 1. Spawn bwmcp
proc = subprocess.Popen(['node', 'bin/bwmcp.js', '--no-browser'], ...)

# 2. Send JSON-RPC, read response
proc.stdin.write(json.dumps(message) + '\n')
response = json.loads(proc.stdout.readline())

# 3. Call tools by name
call_tool('make_card', {'title': 'Hello', 'content': 'World'})

# 4. Compose TACOs (plain dicts in Python)
layout = {'t': 'div', 'a': {'class': 'bw_container'}, 'c': [card1, card2]}

# 5. Build page
page = call_tool('build_page', {'title': 'My App', 'theme': 'ocean', 'content': layout})
```

Replace the dashboard-building logic with anything you want to build.
The MCP protocol is language-agnostic -- any language with subprocess
and JSON support works.
