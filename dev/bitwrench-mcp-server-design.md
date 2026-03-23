# Bitwrench MCP Server Design

2026-03-23 -- Discussion draft

## Overview

`bwmcp` is an MCP (Model Context Protocol) server that lets AI agents
build and control live browser UI through bitwrench. An agent connects
via MCP, calls tools to compose TACO components, and the result renders
live in a browser window. The agent can screenshot, inspect, and iterate.

bwmcp is spiritually different from bwcli. bwcli is a human-at-the-
keyboard tool (file conversion, dev server, debugging REPL). bwmcp is
an agent-at-the-keyboard tool (MCP protocol, knowledge serving, live UI
rendering). They share infrastructure (bitwrench core, bwserve, docs)
but serve different audiences with different interaction models.

**Why this repo and not bitwrench-ag-ui:** bwmcp exposes bitwrench's own
API surface (BCCL components, theming, DOM operations). When a new
make*() function is added to BCCL, the MCP tool definition should update
in the same commit. Tight coupling to bitwrench internals = same repo.
AG-UI is a rendering protocol (how agents push UI to users). MCP is a
capability protocol (how agents discover and call tools). Different
concerns, different repos.

**Why a separate binary, not a bwcli subcommand:** bwmcp runs a bwserve
instance internally (the browser needs somewhere to connect). It manages
two protocols simultaneously -- MCP over stdio and bwserve over HTTP/SSE.
This is an application, not a CLI subcommand. bwcli stays lightweight
(file conversion + dev tools). bwmcp is the agent-facing server.


## Goals

1. Agent calls MCP tools, UI appears live in a browser
2. Agent can screenshot and inspect the rendered UI for iterative feedback
3. Knowledge tools teach the LLM how to use bitwrench (TACO, composition,
   layout, theming) -- without these, the LLM makes bad UI decisions
4. Expose BCCL components as individual MCP tools with JSON Schema params
5. Expose core utilities (theming, color, HTML generation) as tools
6. Zero runtime dependencies beyond Node.js stdlib
7. Same npm package as bitwrench, separate binary (`bwmcp`)


## Non-Goals

- Replacing bwserve (bwmcp uses bwserve internally, it doesn't replace it)
- Being a bwcli subcommand (different binary, different interaction model)
- TypeScript (bitwrench is plain JS; we write .js with JSDoc)
- Headless-only mode (the browser window IS the product -- the agent drives
  it, the user watches)


## The Core Value Loop

```
Agent                          bwmcp                         Browser
  |                              |                              |
  |-- bitwrench_start_here ----->|                              |
  |<-- orientation + workflow ---|                              |
  |                              |                              |
  |-- make_stat_card {...} ----->|                              |
  |<-- TACO JSON --------------- |                              |
  |                              |                              |
  |-- render_live {taco} ------->|-- bwserve SSE: replace ----->|
  |<-- {rendered, clientCount} --|                              |-- UI visible
  |                              |                              |
  |-- screenshot {} ------------>|-- bwserve: screenshot ------>|
  |<-- PNG image data -----------|<-- canvas capture -----------|
  |                              |                              |
  |  (agent evaluates image,     |                              |
  |   decides to adjust)         |                              |
  |                              |                              |
  |-- render_live {patch} ------>|-- bwserve SSE: patch ------->|
  |<-- {rendered} ---------------|                              |-- UI updated
```

This loop is the product. Everything else is scaffolding to make it work.


## The Knowledge Problem

Tool schemas alone are NOT sufficient for an LLM to use bitwrench well.

When an LLM connects via MCP, it sees tool names, JSON Schemas, and short
descriptions. That's enough to call individual tools correctly. But it is
NOT enough to:

- **Compose layouts.** The LLM doesn't know bw_container > bw_row > bw_col
  is the grid system. It'll stack everything vertically.
- **Understand TACO nesting.** That `c` accepts strings, TACOs, or arrays
  of TACOs. That you compose pages by nesting, not concatenating HTML.
- **Follow the workflow.** Make components -> compose into layout TACO ->
  call build_page. Without guidance, the LLM calls build_page per component.
- **Choose components wisely.** 47 tools with no design taste. "I need a
  dashboard" -- which tools? The LLM has no mental model.
- **Use theming.** That `build_page` with `theme: 'ocean'` gives you a
  styled page, and individual components inherit palette colors automatically.
- **Build server-driven UI.** bwserve's replace/patch/append model, SSE
  streaming, data-bw-action dispatch -- none of this is discoverable from
  component tool schemas.

MCP resources exist but most hosts don't auto-read them. The LLM has to
decide to look, and it won't look for things it doesn't know it needs.

**Solution: knowledge tools.** MCP tools that return documentation as text
content. They show up in tools/list. The LLM sees a description like
"IMPORTANT: Call this before using any other bitwrench tools" and calls it.
This is the most reliable discovery mechanism in MCP today.


## Knowledge Tools

These are pseudo-tools. They don't execute bitwrench code -- they return
documentation text. They are the LLM's instruction manual.

### bitwrench_start_here (the funnel)

Returns a ~30-line cheat sheet: what bitwrench is, what TACO is, the
5-step workflow, key rules, and which other knowledge tools to call.
This is the LLM's 30-second orientation.

```json
{
  "name": "bitwrench_start_here",
  "title": "Start Here -- Bitwrench Quick Orientation",
  "description": "IMPORTANT: Call this tool FIRST before using any other bitwrench tools. Returns a quick orientation: what bitwrench is, the TACO format, your workflow for building UI, and which other tools to call for deeper knowledge.",
  "inputSchema": { "type": "object", "properties": {} }
}
```

Returns hardcoded text (not read from a file -- this is the MCP-specific
funnel, not a general doc):

```
BITWRENCH QUICK ORIENTATION
============================

Bitwrench is a zero-dependency JS UI library (~39KB gzipped). You
generate UI by composing TACO objects -- plain JSON:

  {t: 'div', a: {class: 'bw_card'}, c: 'Hello'}
   ^tag       ^attributes             ^content (string, TACO, or array)

YOUR WORKFLOW:
1. Call bitwrench_guide to learn TACO format, layout, and composition
2. Call bitwrench_components to look up props for specific components
3. Call make_card, make_table, make_hero, etc. to build TACO components
4. Nest TACOs into a layout using the grid: bw_container > bw_row > bw_col
5. Call build_page with a theme to produce a complete standalone .html file

KEY RULES:
- Every make*() tool returns a TACO object, NOT HTML
- Compose by nesting TACOs in the 'c' field: {t:'div', c: [taco1, taco2]}
- Grid layout:
    {t:'div', a:{class:'bw_container'}, c:[
      {t:'div', a:{class:'bw_row'}, c:[
        {t:'div', a:{class:'bw_col'}, c:[ <your content> ]}
      ]}
    ]}
- Themes: pass theme:'ocean' to build_page (also: forest, sunset,
  midnight, slate, rose, indigo, amber, emerald, nord, coral, teal)
- Call render_taco to convert any TACO to an HTML string
- Call build_page to get a complete standalone .html file (works offline)

OTHER KNOWLEDGE TOOLS (call as needed):
- bitwrench_guide: Full tutorial (TACO format, 3 levels, events, CSS,
  components, bwserve, routing, API reference)
- bitwrench_components: Props reference for all 47+ make*() components
- bitwrench_server_guide: bwserve tutorial (SSE streaming, live UI)
- bitwrench_themes: Theme presets, custom palettes, color utilities
```

Why a separate tool instead of making bitwrench_guide shorter:
- bitwrench_guide IS the full tutorial. Cutting it loses important depth
  (events, state, handles, routing, debugging)
- start_here is the funnel -- tiny, always cheap to call, orients the LLM
- The LLM calls start_here first (~200 tokens), then decides whether to
  call bitwrench_guide (4K tokens) or jump straight to making components

### bitwrench_guide (full tutorial)

Returns the full content of `docs/llm-bitwrench-guide.md` (~629 lines).
This is the primary knowledge payload. It covers:

- Complete working page example (Step 1)
- TACO format: {t, a, c, o}, nesting, composition (Step 2)
- Three levels: data, DOM, stateful (Step 3)
- Events and component handles (Step 4)
- CSS, theming, bw.loadStyles() (Step 5)
- BCCL component inventory with categories (Step 6)
- Debugging with bwcli (Step 7)
- bwserve server-driven UI (Step 8)
- Client-side routing (Step 9)
- HTML generation and bwcli CLI (Step 10)
- Core API quick reference tables
- Key rules summary (the 11 commandments)

```json
{
  "name": "bitwrench_guide",
  "title": "Bitwrench Developer Guide",
  "description": "IMPORTANT: Call this tool FIRST before using any other bitwrench tools. Returns the complete bitwrench developer guide covering TACO format, component composition, layout patterns, theming, and workflow. Without this context you will produce poor UI. Read this guide, then use the component and utility tools.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "section": {
        "type": "string",
        "description": "Optional: return only a specific section. One of: 'taco', 'levels', 'events', 'css', 'components', 'bwserve', 'routing', 'api-reference', 'rules'. Omit for full guide.",
        "enum": ["taco", "levels", "events", "css", "components", "bwserve", "routing", "api-reference", "rules"]
      }
    }
  }
}
```

When called with no args, returns the full guide. When called with a
section name, returns just that section (~30-80 lines). This lets the
LLM re-read specific sections mid-task without re-reading everything.

### bitwrench_components

Returns the full content of `docs/component-library.md` (~1030 lines).
Complete props reference for all 47+ make*() components.

```json
{
  "name": "bitwrench_components",
  "title": "Component Library Reference",
  "description": "Complete reference for all bitwrench make*() components. Call this when you need to know the exact props, variants, and options for a specific component. Returns the full component catalog with examples.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "component": {
        "type": "string",
        "description": "Optional: return docs for a specific component only (e.g. 'makeCard', 'makeTable', 'makeAccordion'). Omit for complete catalog."
      }
    }
  }
}
```

### bitwrench_server_guide

Returns the full content of `docs/tutorial-bwserve.md` (~298 lines).
Step-by-step bwserve tutorial. Only relevant when the LLM needs to
build server-driven UI or stream UI via bwcli serve.

```json
{
  "name": "bitwrench_server_guide",
  "title": "Server-Driven UI Guide",
  "description": "Tutorial for building server-driven UI with bwserve. Covers: SSE streaming, replace/patch/append protocol, data-bw-action buttons, live metrics, screenshots. Call this when building real-time or server-pushed interfaces.",
  "inputSchema": {
    "type": "object",
    "properties": {}
  }
}
```

### bitwrench_themes

Returns the theming section from `docs/theming.md` (~310 lines): preset
names, configuration options, palette structure, color utilities.

```json
{
  "name": "bitwrench_themes",
  "title": "Theme and Color Reference",
  "description": "Reference for bitwrench theming: 12 built-in presets (teal, ocean, sunset, forest, slate, rose, indigo, amber, emerald, nord, coral, midnight), custom palette configuration, color utilities. Call this when choosing or customizing themes.",
  "inputSchema": {
    "type": "object",
    "properties": {}
  }
}
```

### Why Tools Instead of Resources

| Delivery method         | LLM sees it in tools/list? | Auto-loaded? | Reliable? |
|-------------------------|---------------------------|--------------|-----------|
| Tool description (40ch) | Yes                       | Yes          | Too short |
| MCP Resource            | No (separate resources/list) | No        | Host-dependent |
| MCP Prompt              | No (separate prompts/list)   | No        | User must invoke |
| **Knowledge tool**      | **Yes**                   | **On call**  | **Yes**   |

Knowledge tools are visible in the tool list, have descriptions that tell
the LLM to call them, and return full documentation on demand. The LLM
decides when it needs more context (e.g., "I'm about to build a theme,
let me check bitwrench_themes").

### Token Budget

| Knowledge tool          | Lines | Est. tokens | When needed                    |
|-------------------------|-------|-------------|--------------------------------|
| bitwrench_start_here    | ~30   | ~200        | Always (very first call)       |
| bitwrench_guide         | 629   | ~4,000      | Usually (full tutorial)        |
| bitwrench_components    | 1,030 | ~6,500      | When selecting/configuring components |
| bitwrench_server_guide  | 298   | ~1,800      | Only for server-driven UI      |
| bitwrench_themes        | 310   | ~1,900      | Only when theming matters      |

Minimal session (simple page): start_here (200) + a few component calls.
Typical session: start_here (200) + bitwrench_guide (4K) + bitwrench_components (6.5K) = ~10.7K tokens.
This is comparable to a CLAUDE.md file. Well within any modern LLM's
context window. The LLM only loads what it needs -- start_here is the
cheap entry point, deeper knowledge tools are on-demand.

### Keeping Docs In Sync

The knowledge tools read files from disk at call time:

```javascript
// src/mcp/tools.js
var DOCS_DIR = path.resolve(__dirname, '../../docs');

function handleBitwrenchGuide(args) {
  var content = fs.readFileSync(path.join(DOCS_DIR, 'llm-bitwrench-guide.md'), 'utf8');
  if (args.section) {
    content = extractSection(content, args.section);
  }
  return { content: [{ type: 'text', text: content }] };
}
```

No embedding, no caching, no stale copies. When docs are updated in the
bitwrench repo, the MCP server serves the latest version automatically.
This is why the MCP server belongs in the bitwrench repo -- docs and
tools evolve together.


## Architecture

```
MCP Host (Claude Code, Cursor, etc.)
    |
    | JSON-RPC 2.0 over stdio
    |
bwmcp  ─────────────────────────────────────
    |                                        |
    +-- src/mcp/server.js    (MCP protocol)  |
    +-- src/mcp/tools.js     (component tools)|
    +-- src/mcp/knowledge.js (doc serving)   |
    +-- src/mcp/transport.js (stdio)         |
    |                                        |
    +-- bwserve instance     (HTTP + SSE)    |
    |     port 7910 (default)                |
    |     serves shell page + bitwrench      |
    |     pushes TACO to browser via SSE     |
    |     receives screenshots via POST      |
    |                                        |
    +-- bitwrench (imported) (core library)  |
─────────────────────────────────────────────
                    |
                    | HTTP / SSE
                    |
              Browser window
              (renders TACO, captures screenshots)
```

### Binary and Ports

```
bwcli           -- human tool:  file conversion, dev server, REPL
  bwcli serve   -- port 8080 (web) + 9000 (input)
  bwcli attach  -- port 7902

bwmcp           -- agent tool:  MCP protocol + live browser rendering
  MCP:          -- stdio (no port -- pipe to MCP host)
  bwserve:      -- port 7910 (default, configurable with --port)
```

### How It Works

1. User configures MCP server in their AI tool:
   ```json
   {
     "mcpServers": {
       "bitwrench": {
         "command": "bwmcp"
       }
     }
   }
   ```

   With custom port:
   ```json
   {
     "mcpServers": {
       "bitwrench": {
         "command": "bwmcp",
         "args": ["--port", "8080"]
       }
     }
   }
   ```

2. MCP host spawns `bwmcp`. On startup, bwmcp:
   - Starts bwserve on port 7910 (serves shell page + bitwrench)
   - Opens stdio for MCP JSON-RPC communication
   - Optionally opens browser to http://localhost:7910 (--open flag)

3. Host sends `initialize` -- server responds with capabilities:
   ```json
   {
     "capabilities": {
       "tools": { "listChanged": false }
     },
     "serverInfo": {
       "name": "bwmcp",
       "version": "2.0.21",
       "description": "Bitwrench MCP server with live browser UI. Call bitwrench_start_here first."
     }
   }
   ```

4. Host sends `tools/list` -- server returns all available tools
   (knowledge tools first, then component tools, then utility tools)

5. Agent calls knowledge tools to learn bitwrench (start_here, guide, etc.)

6. Agent calls component tools (make_card, make_table, etc.) to build TACOs

7. Agent calls `render_live` to push TACO to the browser via bwserve

8. Agent calls `screenshot` to see what the browser is displaying

9. Agent evaluates screenshot, adjusts, re-renders -- iterative loop


## Tool Catalog

### Component Tools (BCCL)

Each BCCL make*() function becomes an MCP tool. The tool accepts the
same props object the function takes, and returns the TACO object.

| Tool Name          | bitwrench Function    | Description                        |
|--------------------|-----------------------|------------------------------------|
| make_card          | bw.makeCard()         | Card with title, body, image       |
| make_button        | bw.makeButton()       | Button with variant and size       |
| make_table         | bw.makeTable()        | Data table with headers and rows   |
| make_tabs          | bw.makeTabs()         | Tabbed interface                   |
| make_accordion     | bw.makeAccordion()    | Collapsible sections               |
| make_nav           | bw.makeNav()          | Horizontal navigation              |
| make_navbar        | bw.makeNavbar()       | Top navigation bar                 |
| make_alert         | bw.makeAlert()        | Alert/notification box             |
| make_badge         | bw.makeBadge()        | Small label/tag                    |
| make_progress      | bw.makeProgress()     | Progress bar                       |
| make_list_group    | bw.makeListGroup()    | List with optional dividers        |
| make_breadcrumb    | bw.makeBreadcrumb()   | Breadcrumb trail                   |
| make_modal         | bw.makeModal()        | Modal dialog                       |
| make_toast         | bw.makeToast()        | Toast notification                 |
| make_hero          | bw.makeHero()         | Full-width hero section            |
| make_feature_grid  | bw.makeFeatureGrid()  | 3-column feature grid              |
| make_stat_card     | bw.makeStatCard()     | Statistic display card             |
| make_timeline      | bw.makeTimeline()     | Timeline/milestone list            |
| make_stepper       | bw.makeStepper()      | Step indicator                     |
| make_carousel      | bw.makeCarousel()     | Image carousel                     |
| make_form          | bw.makeForm()         | Form container                     |
| make_form_group    | bw.makeFormGroup()    | Label + input wrapper              |
| make_input         | bw.makeInput()        | Text input                         |
| make_select        | bw.makeSelect()       | Dropdown select                    |
| make_checkbox      | bw.makeCheckbox()     | Checkbox with label                |
| make_radio         | bw.makeRadio()        | Radio button with label            |
| make_switch        | bw.makeSwitch()       | Toggle switch                      |
| make_search_input  | bw.makeSearchInput()  | Search box                         |
| make_stack         | bw.makeStack()        | Flex stack layout                  |
| make_pagination    | bw.makePagination()   | Page navigation controls           |
| make_dropdown      | bw.makeDropdown()     | Dropdown menu                      |
| make_avatar        | bw.makeAvatar()       | Avatar with image/initials         |
| make_spinner       | bw.makeSpinner()      | Loading indicator                  |
| make_skeleton      | bw.makeSkeleton()     | Loading placeholder                |
| make_tooltip       | bw.makeTooltip()      | Tooltip                            |
| make_chip_input    | bw.makeChipInput()    | Tag/chip input                     |
| make_section       | bw.makeSection()      | Generic section wrapper            |
| make_cta           | bw.makeCTA()          | Call-to-action section             |
| make_media_object  | bw.makeMediaObject()  | Media + text layout                |
| make_file_upload   | bw.makeFileUpload()   | File input                         |
| make_range         | bw.makeRange()        | Range slider                       |
| make_popover       | bw.makePopover()      | Popover bubble                     |
| make_code_demo     | bw.makeCodeDemo()     | Code snippet + preview             |
| make_button_group  | bw.makeButtonGroup()  | Grouped buttons                    |

### Core Utility Tools

| Tool Name         | bitwrench Function       | Description                              |
|-------------------|--------------------------|------------------------------------------|
| render_taco       | bw.html(taco)            | Convert any TACO to HTML string          |
| make_page         | bw.htmlPage()            | Generate full HTML page from TACO        |
| make_styles       | bw.makeStyles(config)    | Generate CSS from seed colors            |
| derive_palette    | bw.derivePalette(config) | Generate color palette from seeds        |
| make_table_array  | bw.makeTableFromArray()  | Table from 2D array data                 |
| escape_html       | bw.escapeHTML(str)       | Escape HTML special characters           |
| lorem_ipsum       | bw.loremIpsum(n)         | Generate placeholder text                |
| color_interp      | bw.colorInterp()         | Interpolate between colors               |
| text_on_color     | bw.textOnColor(hex)      | Get contrast text color for background   |


### Composite / High-Level Tools

These don't map 1:1 to a single function but compose multiple calls:

| Tool Name          | What It Does                                           |
|--------------------|--------------------------------------------------------|
| build_page         | Takes title + TACO content + optional theme config.    |
|                    | Returns complete standalone HTML page with inlined     |
|                    | bitwrench + styles. Ready to save as .html file.       |
| build_dashboard    | Takes array of stat cards + optional chart data +      |
|                    | theme. Composes a full dashboard layout.               |
| build_landing_page | Takes hero + features + CTA. Composes full landing.    |


## Tool Definition Format

Each tool is defined as a JSON Schema for MCP discovery. Example:

```json
{
  "name": "make_card",
  "title": "Create Card Component",
  "description": "Create a bitwrench card component. Returns a TACO object (JSON) that can be rendered to HTML using the render_taco tool, or composed into larger layouts.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "title": {
        "type": "string",
        "description": "Card title text"
      },
      "content": {
        "description": "Card body content. String or TACO object.",
        "oneOf": [
          { "type": "string" },
          { "type": "object" }
        ]
      },
      "image": {
        "type": "string",
        "description": "URL for card header image"
      },
      "footer": {
        "description": "Card footer content. String or TACO object.",
        "oneOf": [
          { "type": "string" },
          { "type": "object" }
        ]
      },
      "variant": {
        "type": "string",
        "enum": ["primary", "secondary", "success", "danger", "warning", "info"],
        "description": "Color variant"
      }
    }
  }
}
```

Example `render_taco` tool:

```json
{
  "name": "render_taco",
  "title": "Render TACO to HTML",
  "description": "Convert a TACO object (bitwrench's {t, a, c, o} format) to an HTML string. Use this to get the final HTML output from any TACO-producing tool.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "taco": {
        "type": "object",
        "description": "TACO object with fields: t (tag), a (attributes), c (content), o (options). Content can be a string, array of TACOs, or nested TACO.",
        "properties": {
          "t": { "type": "string", "description": "HTML tag name (div, p, h1, etc.)" },
          "a": { "type": "object", "description": "HTML attributes (class, id, style, etc.)" },
          "c": { "description": "Content: string, TACO, or array of strings/TACOs" }
        },
        "required": ["t"]
      },
      "indent": {
        "type": "boolean",
        "description": "Pretty-print with indentation (default: false)"
      }
    },
    "required": ["taco"]
  }
}
```

Example `build_page` tool:

```json
{
  "name": "build_page",
  "title": "Build Complete HTML Page",
  "description": "Generate a complete, standalone HTML page with bitwrench styles and scripts inlined. The output is a single .html file that works offline with no dependencies. Use this as the final step after composing your TACO layout.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "title": {
        "type": "string",
        "description": "Page title (shown in browser tab)"
      },
      "content": {
        "description": "Page body content as TACO object or array of TACOs",
        "oneOf": [
          { "type": "object" },
          { "type": "array", "items": { "type": "object" } }
        ]
      },
      "theme": {
        "type": "string",
        "description": "Theme preset name (ocean, forest, sunset, midnight, lavender, slate, ember, arctic, desert, wine, moss, storm) or hex color for primary seed"
      },
      "description": {
        "type": "string",
        "description": "Meta description for SEO"
      }
    },
    "required": ["title", "content"]
  }
}
```


## Tool Results

MCP tool results are arrays of content objects. For bitwrench tools:

### TACO-producing tools (make_card, make_table, etc.)

Return both structured JSON and text representation:

```json
{
  "content": [
    {
      "type": "text",
      "text": "{\"t\":\"div\",\"a\":{\"class\":\"bw_card\"},\"c\":[...]}"
    }
  ],
  "structuredContent": {
    "t": "div",
    "a": { "class": "bw_card" },
    "c": [...]
  }
}
```

The agent can pass the structuredContent directly to `render_taco` or
compose it into a larger TACO tree.

### HTML-producing tools (render_taco, build_page)

Return HTML string:

```json
{
  "content": [
    {
      "type": "text",
      "text": "<div class=\"bw-card\">...</div>"
    }
  ]
}
```

### Data-producing tools (derive_palette, text_on_color)

Return structured data:

```json
{
  "content": [
    {
      "type": "text",
      "text": "{\"primary\":{\"base\":\"#2563eb\",...},\"secondary\":{...}}"
    }
  ],
  "structuredContent": {
    "primary": { "base": "#2563eb", "hover": "#1d4ed8", ... },
    "secondary": { ... }
  }
}
```


## File Structure

```
bin/
  bwcli.js          # existing -- human-facing CLI
  bwmcp.js          # NEW -- agent-facing MCP server entry point

src/mcp/
  server.js         # MCP protocol handler (JSON-RPC dispatch)
  tools.js          # Component/utility tool definitions + handlers
  knowledge.js      # Knowledge tool definitions + doc file readers
  live.js           # bwserve integration: render_live, screenshot, query_dom
  transport.js      # stdio transport (streamable HTTP in future phase)

src/bwserve/        # existing -- used by both bwcli serve AND bwmcp
```

Knowledge tools read from `docs/` at call time:
```
docs/
  llm-bitwrench-guide.md   # -> bitwrench_guide tool
  component-library.md     # -> bitwrench_components tool
  tutorial-bwserve.md      # -> bitwrench_server_guide tool
  theming.md               # -> bitwrench_themes tool
```

NOT in the main rollup bundle. Built separately:

```
dist/
  bitwrench-mcp.cjs.js    # Node.js require() entry
  bitwrench-mcp.esm.js    # ESM import entry
```

Package.json additions:

```json
{
  "bin": {
    "bwcli": "./bin/bwcli.js",
    "bwmcp": "./bin/bwmcp.js"
  },
  "exports": {
    "./mcp": {
      "import": "./dist/bitwrench-mcp.esm.js",
      "require": "./dist/bitwrench-mcp.cjs.js"
    }
  }
}
```

### Library API (programmatic usage)

```javascript
import { createMcpServer } from 'bitwrench/mcp';

var server = createMcpServer({
  port: 7910,          // bwserve port for browser
  theme: 'ocean',      // default theme for rendered pages
  open: true,          // open browser on start
  tools: [             // additional custom tools alongside bitwrench tools
    { name: 'my_tool', ... }
  ]
});

server.listen();       // starts stdio MCP + bwserve HTTP
```


## Transport: stdio (Primary)

MCP over stdio is the standard for local MCP servers. Read JSON-RPC
messages from stdin, write responses to stdout.

```javascript
// src/mcp/transport.js

function createStdioTransport() {
  var buffer = '';

  process.stdin.setEncoding('utf8');
  process.stdin.on('data', function(chunk) {
    buffer += chunk;
    // MCP uses newline-delimited JSON-RPC
    var lines = buffer.split('\n');
    buffer = lines.pop();
    lines.forEach(function(line) {
      if (line.trim()) {
        var msg = JSON.parse(line);
        handleMessage(msg);
      }
    });
  });

  function send(msg) {
    process.stdout.write(JSON.stringify(msg) + '\n');
  }

  return { send: send };
}
```

No HTTP server, no ports, no network. The MCP host spawns the process
and talks over pipes. This is how Claude Desktop, Claude Code, and
VS Code extensions expect local MCP servers to work.


## Transport: Streamable HTTP (Secondary)

For remote MCP servers (e.g., shared team bitwrench instance):

```
bwmcp --http --port 8900
```

Uses HTTP POST for client-to-server messages, SSE for server-to-client
streaming. Same JSON-RPC protocol, different framing. Lower priority
than stdio -- most users will use local mode.


## Protocol Implementation

The MCP protocol is JSON-RPC 2.0. We implement it directly (no SDK dep).

### Messages to Handle

```
initialize          -> return capabilities + server info
notifications/initialized  -> acknowledged (no response needed)
tools/list          -> return tool definitions array
tools/call          -> execute tool, return result
```

### Messages to Send (Notifications)

```
(none in Phase 1 -- listChanged: false)
```

### Error Handling

```javascript
// Protocol error (unknown method)
{ "jsonrpc": "2.0", "id": 1, "error": { "code": -32601, "message": "Method not found" } }

// Invalid params
{ "jsonrpc": "2.0", "id": 2, "error": { "code": -32602, "message": "Unknown tool: foo" } }

// Tool execution error (not a protocol error -- tool ran but failed)
{ "jsonrpc": "2.0", "id": 3, "result": { "content": [{ "type": "text", "text": "Error: invalid color hex" }], "isError": true } }
```


## Implementation Plan

The internal scaffolding (MCP protocol, tool schemas, knowledge tools) is
NOT a releasable milestone. An MCP server that returns JSON blobs is
useless to an agent -- there's nothing to see. The agent needs the full
loop: call tools -> UI renders in browser -> screenshot -> iterate.

Phase 1 is the complete product: bwmcp starts bwserve, agent renders
live, agent screenshots, agent iterates.

### Phase 1: Live MCP Server (MVP -- first releasable milestone)

**Goal**: `bwmcp` works end-to-end. Agent connects via MCP, builds UI
with component tools, renders live in browser, screenshots, iterates.

Internal scaffolding (all must work, but not individually shippable):
- [ ] scaffold --> Create `bin/bwmcp.js`, `src/mcp/` with server.js, tools.js, knowledge.js, live.js, transport.js
- [ ] implement --> stdio transport (newline-delimited JSON-RPC read/write)
- [ ] implement --> JSON-RPC dispatch (initialize, tools/list, tools/call)
- [ ] implement --> Knowledge tools: bitwrench_start_here, bitwrench_guide (section filter), bitwrench_components (component filter), bitwrench_server_guide, bitwrench_themes
- [ ] implement --> Tool definitions for 10 most-used BCCL components: make_card, make_button, make_table, make_tabs, make_accordion, make_alert, make_nav, make_hero, make_stat_card, make_form_group
- [ ] implement --> Core utility tools: render_taco, build_page, make_styles

Live rendering (the actual product):
- [ ] implement --> bwserve auto-start on bwmcp launch (port 7910 default)
- [ ] implement --> `render_live` tool: push TACO to browser via bwserve SSE (replace, patch, append, remove)
- [ ] implement --> `screenshot` tool: capture browser via bwserve client.screenshot()
- [ ] implement --> `query_dom` tool: read DOM state via bwserve client.query()
- [ ] implement --> Browser session management (single client for MVP, multi-client later)
- [ ] implement --> `--port`, `--theme`, `--open` CLI flags

Build and packaging:
- [ ] implement --> rollup entry for bitwrench-mcp (separate from core build)
- [ ] implement --> package.json bin entry for bwmcp
- [ ] implement --> package.json exports for 'bitwrench/mcp'

Testing:
- [ ] test --> Unit tests for JSON-RPC protocol handling (~20 tests)
- [ ] test --> Unit tests for tool execution (~30 tests)
- [ ] test --> Knowledge tool tests: section filtering, component filtering, fallback (~15 tests)
- [ ] test --> E2E test client: spawns bwmcp, runs full agent workflow over stdio (see Testing section)
- [ ] test --> Playwright tests for live rendering + screenshot capture
- [ ] test --> Manual "vibe test" with Claude Code as MCP host
- [ ] doc --> README section on bwmcp setup + MCP host configuration

### Phase 2: Full BCCL Coverage + Composite Tools

- [ ] implement --> Tool definitions for all remaining BCCL make*() (~35 more)
- [ ] implement --> Composite tools: build_dashboard, build_landing_page
- [ ] implement --> make_table_array (table from 2D data)
- [ ] implement --> derive_palette, text_on_color, color_interp tools
- [ ] implement --> lorem_ipsum, escape_html utility tools
- [ ] implement --> `patch_live` tool: surgical DOM updates (text, attrs) without full replace
- [ ] implement --> `clear_live` tool: reset browser to blank state
- [ ] test --> Tests for all new tools (~50 tests)
- [ ] doc --> Tool catalog documentation

### Phase 3: Streamable HTTP + Polish

- [ ] implement --> HTTP transport for remote bwmcp server
- [ ] implement --> `bwmcp --http --port 8900` mode
- [ ] implement --> Authentication (bearer token via --token flag)
- [ ] implement --> MCP resources (theme presets, component catalog)
- [ ] implement --> MCP prompts (pre-built templates for common UI patterns)
- [ ] implement --> Multi-client session management
- [ ] test --> HTTP transport tests
- [ ] doc --> Remote bwmcp setup guide


## Example Session

What an agent sees when using bwmcp. The browser is already open
(bwserve started on `bwmcp` launch). The agent builds UI, pushes it
live, screenshots, and iterates.

```
Agent: "Create a dashboard with three stat cards and a data table"

1. tools/call: bitwrench_start_here {}
   -> returns 30-line orientation: TACO format, workflow, key rules

2. tools/call: make_stat_card { label: "Revenue", value: "$12,345", variant: "primary" }
   -> returns TACO: {t:'div', a:{class:'bw_stat_card ...'}, c:[...]}

3. tools/call: make_stat_card { label: "Users", value: "1,234", variant: "success" }
   -> returns TACO

4. tools/call: make_stat_card { label: "Orders", value: "567", variant: "info" }
   -> returns TACO

5. tools/call: make_table { headers: ["Name","Amount","Date"], rows: [...] }
   -> returns TACO

6. Agent composes layout TACO from the above, then renders live:
   tools/call: render_live {
     target: "#app",
     taco: {
       t: 'div', a: { class: 'bw_container' }, c: [
         { t: 'h1', c: 'Dashboard' },
         { t: 'div', a: { class: 'bw_row' }, c: [
           { t: 'div', a: { class: 'bw_col' }, c: [<stat1 taco>] },
           { t: 'div', a: { class: 'bw_col' }, c: [<stat2 taco>] },
           { t: 'div', a: { class: 'bw_col' }, c: [<stat3 taco>] }
         ]},
         <table taco>
       ]
     }
   }
   -> bwserve pushes TACO to connected browser via SSE
   -> returns { status: "rendered", clientCount: 1 }
   -> UI appears live in the browser window

7. tools/call: screenshot {}
   -> captures browser state via html2canvas
   -> returns { type: "image", data: "base64...", mimeType: "image/png" }

8. Agent evaluates screenshot, decides the header needs work:
   tools/call: render_live {
     target: "#app .bw_stat_card:first-child .bw_stat_value",
     patch: "$15,678"
   }
   -> surgically updates just the revenue number

9. tools/call: screenshot {}
   -> agent confirms the update looks right

10. Agent saves a standalone file for sharing:
    tools/call: build_page {
      title: "Dashboard",
      theme: "ocean",
      content: <the composed TACO from step 6>
    }
    -> returns complete standalone HTML page string (works offline)
```

The live render + screenshot loop is the core workflow. `build_page`
is used at the end to export a standalone .html file if needed.


## Why This Is Low-Hanging Fruit

1. **No new rendering code.** Every tool calls an existing bitwrench
   function. The MCP server is pure glue -- parse JSON-RPC, call bw.*(),
   return result.

2. **bwserve already exists.** The live rendering infrastructure (SSE
   streaming, screenshot capture, DOM queries) is already built and
   tested in bwserve. bwmcp just wires MCP tool calls to bwserve
   protocol messages.

3. **JSON-RPC is trivial.** Four methods to implement (initialize,
   initialized notification, tools/list, tools/call). The protocol is
   well-documented with no ambiguity.

4. **stdio transport is ~30 lines.** Read stdin, split on newlines,
   JSON.parse, dispatch, JSON.stringify, write stdout.

5. **Tool schemas are mechanical.** Each BCCL function already has a
   clear props interface. Converting to JSON Schema is tedious but
   straightforward. Could even be auto-generated from JSDoc.

6. **Instant value.** Any Claude Code user can configure this as an MCP
   server, open a browser, and iterate on live UI from natural language.
   The feedback loop is: describe UI -> agent builds + renders -> screenshot
   -> agent refines -> repeat.


## Size Estimate

- transport.js: ~50 lines
- server.js: ~120 lines (JSON-RPC dispatch + lifecycle)
- knowledge.js: ~80 lines (doc file readers + section extraction)
- tools.js: ~400 lines (schemas + handlers for Phase 1 tools)
- Total Phase 1: ~650 lines, <3KB gzipped (code only; docs read from disk)

The tool schemas are the bulk. The actual protocol handling is minimal.
Knowledge tools add ~80 lines but provide the majority of the value.


## Testing

### Unit Tests

Standard Mocha + Chai, same as bitwrench core.

```
test/mcp/
  transport-test.js     # stdio read/write, message framing
  server-test.js        # JSON-RPC dispatch, lifecycle, error handling
  tools-test.js         # each tool: valid input, invalid input, result format
  knowledge-test.js     # doc loading, section filtering, missing file fallback
```

### End-to-End Test Client

A Node.js script that spawns `bwmcp` as a child process, connects
over stdio, and runs a realistic agent workflow:

```javascript
// test/mcp/e2e-test.js
//
// Spawns bwmcp, sends JSON-RPC messages, validates responses.
// This simulates what Claude Code or Cursor would do.

var cp = require('child_process');
var assert = require('assert');

var proc = cp.spawn('node', ['bin/bwmcp.js'], {
  stdio: ['pipe', 'pipe', 'pipe']
});

var responses = {};
var nextId = 1;

function send(method, params) {
  var id = nextId++;
  var msg = { jsonrpc: '2.0', id: id, method: method, params: params || {} };
  proc.stdin.write(JSON.stringify(msg) + '\n');
  return new Promise(function(resolve) { responses[id] = resolve; });
}

// Parse responses from stdout
var buf = '';
proc.stdout.on('data', function(chunk) {
  buf += chunk.toString();
  var lines = buf.split('\n');
  buf = lines.pop();
  lines.forEach(function(line) {
    if (!line.trim()) return;
    var msg = JSON.parse(line);
    if (msg.id && responses[msg.id]) {
      responses[msg.id](msg);
      delete responses[msg.id];
    }
  });
});

async function runTests() {
  // 1. Initialize
  var init = await send('initialize', {
    protocolVersion: '2025-06-18',
    capabilities: {},
    clientInfo: { name: 'test-client', version: '1.0.0' }
  });
  assert(init.result.capabilities.tools);
  assert.equal(init.result.serverInfo.name, 'bwmcp');

  // 2. Send initialized notification (no response expected)
  proc.stdin.write(JSON.stringify({
    jsonrpc: '2.0', method: 'notifications/initialized'
  }) + '\n');

  // 3. List tools
  var list = await send('tools/list');
  var toolNames = list.result.tools.map(function(t) { return t.name; });

  // Verify start_here is first in the list
  assert.equal(toolNames[0], 'bitwrench_start_here');

  // Verify all knowledge tools are present
  assert(toolNames.indexOf('bitwrench_guide') >= 0);
  assert(toolNames.indexOf('bitwrench_components') >= 0);
  assert(toolNames.indexOf('bitwrench_server_guide') >= 0);
  assert(toolNames.indexOf('bitwrench_themes') >= 0);

  // Verify component tools
  assert(toolNames.indexOf('make_card') >= 0);
  assert(toolNames.indexOf('render_taco') >= 0);
  assert(toolNames.indexOf('build_page') >= 0);

  // 4. Call bitwrench_start_here (what an LLM would do first)
  var startHere = await send('tools/call', {
    name: 'bitwrench_start_here', arguments: {}
  });
  var startText = startHere.result.content[0].text;
  assert(startText.indexOf('TACO') >= 0);
  assert(startText.indexOf('bitwrench_guide') >= 0);  // points to deeper tools
  assert(startText.indexOf('bw_container') >= 0);      // includes grid hint
  assert(startText.indexOf('build_page') >= 0);         // includes workflow
  // Should be short -- under 2K chars
  assert(startText.length < 2000);

  // 5. Call bitwrench_guide (what an LLM would do second)
  var guide = await send('tools/call', {
    name: 'bitwrench_guide', arguments: {}
  });
  assert(guide.result.content[0].text.indexOf('TACO') >= 0);
  assert(guide.result.content[0].text.indexOf('bw.DOM') >= 0);

  // 6. Call bitwrench_guide with section filter
  var tacoSection = await send('tools/call', {
    name: 'bitwrench_guide', arguments: { section: 'taco' }
  });
  assert(tacoSection.result.content[0].text.indexOf('{t, a, c, o}') >= 0);
  // Section should be much shorter than full guide
  assert(tacoSection.result.content[0].text.length < guide.result.content[0].text.length);

  // 6. Call bitwrench_components for a specific component
  var cardDocs = await send('tools/call', {
    name: 'bitwrench_components', arguments: { component: 'makeCard' }
  });
  assert(cardDocs.result.content[0].text.indexOf('makeCard') >= 0);

  // 7. Build a realistic workflow: make components, compose, build page
  var card = await send('tools/call', {
    name: 'make_card',
    arguments: { title: 'Revenue', content: '$12,345' }
  });
  assert(card.result.structuredContent.t);  // is a TACO object
  assert.equal(card.result.isError, undefined);

  var stat = await send('tools/call', {
    name: 'make_stat_card',
    arguments: { label: 'Users', value: '1,234', variant: 'success' }
  });
  assert(stat.result.structuredContent.t);

  // 8. Render to HTML
  var html = await send('tools/call', {
    name: 'render_taco',
    arguments: { taco: card.result.structuredContent }
  });
  assert(html.result.content[0].text.indexOf('<') >= 0);  // contains HTML

  // 9. Build full page
  var page = await send('tools/call', {
    name: 'build_page',
    arguments: {
      title: 'Test Dashboard',
      theme: 'ocean',
      content: {
        t: 'div', a: { class: 'bw_container' }, c: [
          card.result.structuredContent,
          stat.result.structuredContent
        ]
      }
    }
  });
  assert(page.result.content[0].text.indexOf('<!DOCTYPE html>') >= 0);
  assert(page.result.content[0].text.indexOf('bitwrench') >= 0);

  // 10. Error handling: unknown tool
  var err = await send('tools/call', {
    name: 'nonexistent_tool', arguments: {}
  });
  assert(err.error || err.result.isError);

  console.log('All e2e tests passed.');
  proc.kill();
}

runTests().catch(function(e) {
  console.error('Test failed:', e);
  proc.kill();
  process.exit(1);
});
```

This test client validates:
- Protocol lifecycle (initialize -> tools/list -> tools/call)
- Knowledge tools return real documentation content
- Section/component filtering works
- Component tools return valid TACO objects
- Composition workflow (make -> render -> build_page)
- Error handling for bad tool names

### Manual "Vibe Test"

The ultimate test: configure `bwmcp` in Claude Code, then ask:

1. "Build me a dashboard for tracking sales metrics"
2. "Create a landing page for a SaaS product"
3. "Make a server-driven real-time monitor"

If the LLM:
- Calls bitwrench_start_here first -> funnel works
- Optionally calls bitwrench_guide for deeper knowledge -> escalation works
- Uses bw_container/bw_row/bw_col grid -> layout knowledge works
- Picks appropriate components (makeStatCard for KPIs, makeTable for data) -> component selection works
- Calls build_page with a theme as the final step -> workflow knowledge works
- Produces a working .html file that looks good -> everything works

If it doesn't, the knowledge tool content needs tuning, not the MCP
protocol implementation.


## Open Questions

1. **Should TACO-producing tools return HTML too?** Currently they return
   TACO JSON. The agent must call `render_taco` separately to get HTML.
   Alternative: each tool returns both TACO and HTML. Pro: fewer round
   trips. Con: HTML is useless if the agent is composing a larger layout
   (it only needs the TACO intermediate). Leaning toward TACO-only with
   explicit render_taco step -- keeps tool results composable.

2. **Auto-generate tool schemas from source?** The BCCL make*() functions
   don't have formal TypeScript interfaces, but they do have consistent
   props patterns. We could write a build script that reads the JSDoc
   comments and generates JSON Schemas. Or just hand-write them (more
   precise descriptions for LLM consumption). Leaning toward hand-written
   for Phase 1, auto-generate later if maintenance becomes tedious.

3. **Should `build_page` inline bitwrench or link to CDN?** Inlining
   makes truly standalone pages (~200KB with bitwrench). CDN link makes
   smaller files but needs network. Default to standalone (matches the
   bitwrench philosophy of working offline). Offer a `cdn` option.

4. **Knowledge tool ordering in tools/list.** Should knowledge tools
   appear first in the list? MCP doesn't guarantee ordering, but most
   hosts present tools in list order. Putting bitwrench_start_here
   first makes it the most likely to be called. Implementation:
   list knowledge tools before component tools in the tools array,
   with start_here at position 0.

5. **How aggressive should the "call me first" language be?** The
   bitwrench_start_here description says "IMPORTANT: Call this tool
   FIRST." Some MCP hosts might auto-call it based on this language.
   Others might not. We could also add a hint in the initialize
   response's serverInfo.description field: "Call bitwrench_start_here
   before using component tools." Belt and suspenders.

6. **Should bitwrench_guide be auto-called on initialize?** Some MCP
   servers return documentation in the initialize response's instructions
   field (non-standard but supported by some hosts). This would front-load
   the knowledge without requiring the LLM to discover the tool. Downside:
   4K tokens on every connection even when the LLM already knows bitwrench.
   Leaning toward NOT auto-loading -- let the LLM decide.

7. **Doc freshness and version pinning.** Knowledge tools read docs from
   disk. If someone installs bitwrench globally and the docs dir isn't
   found, knowledge tools fail. Mitigation: fall back to a bundled
   compressed copy of the docs embedded in knowledge.js at build time.
   Full docs from disk when available, compressed fallback otherwise.
