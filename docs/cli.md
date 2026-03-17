# CLI

The `bwcli` command converts files to styled HTML pages. It supports Markdown, HTML, and JSON input, and can produce self-contained offline pages or pages that load bitwrench from a CDN.

## Installation

```bash
npm install -g bitwrench
```

Or use `npx` without installing:

```bash
npx bwcli README.md
```

## Basic usage

```bash
# Convert a Markdown file to HTML
bwcli README.md

# Specify output file
bwcli README.md -o index.html

# Apply a theme
bwcli README.md -o index.html --theme ocean

# Create a self-contained offline page
bwcli README.md -o index.html --standalone

# Add syntax highlighting
bwcli README.md -o index.html --highlight
```

## Input formats

The CLI detects the input format by file extension:

| Extension | Handling |
|-----------|----------|
| `.md`, `.markdown` | Parsed with [Quikdown](https://github.com/deftio/quikdown) (bundled zero-dep Markdown parser). Title extracted from first `# heading`. |
| `.html`, `.htm` | If it is a full HTML document (has `<html>` or `<!DOCTYPE>`), the `<title>` and `<body>` content are extracted. Otherwise, the file is used as-is as body content. |
| `.json` | If the JSON has a `t` property, it is treated as a TACO object and rendered with `bw.html()`. Otherwise, it is pretty-printed as a code block. |

## Output

By default, the output file has the same name as the input with a `.html` extension:

```bash
bwcli docs/guide.md       # → docs/guide.html
bwcli data.json            # → data.html
```

Override with `-o`:

```bash
bwcli docs/guide.md -o site/index.html
```

## Bitwrench injection modes

By default, the CLI produces plain HTML without bitwrench. Three flags control how bitwrench is included in the output:

| Flag | Mode | What happens |
|------|------|-------------|
| `--standalone` / `-s` | Inline | The entire bitwrench UMD bundle is embedded in a `<script>` tag. Page works offline with no external dependencies. |
| `--cdn` | CDN | A `<script>` tag loads bitwrench from jsDelivr with an SRI hash for integrity. Requires internet access. |
| `--no-bw` | None | No bitwrench is included. Plain HTML output. This is the default. |

When bitwrench is included (`--standalone` or `--cdn`), a small script runs after the page loads to call `bw.loadStyles()`, applying bitwrench's default component styles.

## Themes

Apply a built-in theme preset:

```bash
bwcli README.md --theme ocean
bwcli README.md --theme sunset
bwcli README.md --theme forest
bwcli README.md --theme slate
```

Or specify custom colors as a comma-separated pair of hex values (primary and secondary):

```bash
bwcli README.md --theme "#336699,#cc6633"
```

Available presets: `teal`, `ocean`, `sunset`, `forest`, `slate`, `rose`, `indigo`, `amber`, `emerald`, `nord`, `coral`, `midnight`.

Themes require bitwrench to be included (`--standalone` or `--cdn`). If neither is specified, the theme flag is ignored.

## Additional CSS

Include an external CSS file:

```bash
bwcli README.md -c styles.css -o index.html
```

The CSS file's contents are embedded in a `<style>` tag in the output. This works with or without bitwrench injection.

## Favicon

Add a favicon to the page:

```bash
bwcli README.md -f favicon.ico -o index.html
bwcli README.md -f https://example.com/icon.png -o index.html
```

The value is used directly as the `href` attribute of a `<link rel="icon">` tag.

## Syntax highlighting

Include highlight.js for code block syntax highlighting:

```bash
bwcli README.md --highlight -o index.html
```

This adds the highlight.js CDN stylesheet and script to the output page. Code blocks in the Markdown source get automatic syntax highlighting based on the language specified in the fenced code block.

## Page title

The CLI auto-detects the page title from the content:

- **Markdown**: First `# heading` in the file
- **HTML**: `<title>` element content
- **JSON**: The filename

Override with `--title`:

```bash
bwcli README.md --title "My Project Documentation" -o index.html
```

## All flags

```
bwcli <file> [options]

Options:
  -o, --output <file>    Output file path
  -c, --css <file>       Include external CSS file
  -t, --theme <name>     Theme preset or hex colors ("primary,secondary")
  -s, --standalone       Embed bitwrench inline (works offline)
      --cdn              Link bitwrench via CDN (jsDelivr)
      --no-bw            Don't inject bitwrench (default)
      --title <text>     Page title (default: auto-detect)
  -f, --favicon <path>   Favicon path or URL
      --highlight        Include highlight.js for syntax highlighting
  -v, --verbose          Verbose output
  -h, --help             Print help
      --version          Print version
```

## The `bwcli serve` subcommand — Pipe Server

`bwcli serve` is a pipe server that turns **any language** into a bwserve backend. It opens two ports:

- **Web port** (default `:8080`) — browsers connect here via SSE
- **Input port** (default `:9000`) — your app sends protocol messages here via HTTP POST

Alternatively, use `--stdin` to pipe newline-delimited JSON from stdin.

### Usage

```bash
# Start the pipe server with default ports
bwcli serve

# Custom ports
bwcli serve --port 8080 --input-port 9000

# Open browser automatically
bwcli serve --open

# Stdin mode: pipe messages from any command
python sensor.py | bwcli serve --stdin --port 8080

# Verbose logging (shows all messages)
bwcli serve -v
```

### Sending protocol messages

Your app sends bwserve protocol messages (JSON) to the input port. All connected browsers update in real time.

```bash
# Patch a value:
curl -X POST http://localhost:9000 \
  -H "Content-Type: application/json" \
  -d '{"type":"patch","target":"temp","content":"23.5 C"}'

# Batch update:
curl -X POST http://localhost:9000 \
  -d '{"type":"batch","ops":[
    {"type":"patch","target":"temp","content":"23.5"},
    {"type":"patch","target":"humidity","content":"67%"}
  ]}'

# r-prefix relaxed JSON is also accepted (for C/embedded):
curl -X POST http://localhost:9000 -d "r{'type':'patch','target':'temp','content':'23.5'}"
```

### Options

```
bwcli serve [options]

Options:
  -p, --port <number>         Web port for browsers (default: 8080)
      --input-port <number>   Input port for protocol messages (default: 9000)
      --stdin                 Read messages from stdin instead of input port
  -t, --theme <name>          Theme preset or hex colors
      --open                  Open browser on start
  -v, --verbose               Verbose output (shows all messages)
  -h, --help                  Print help
```

### How it works

1. Browser opens `http://localhost:8080` and gets an auto-generated page shell
2. Shell loads bitwrench, opens SSE connection to `/bw/events/:clientId`
3. Your app POSTs protocol messages to `http://localhost:9000`
4. `bwcli serve` broadcasts each message to all connected browsers via SSE
5. Browser's `bw.apply()` updates the DOM

Both strict JSON and r-prefix relaxed JSON are accepted on the input port. See [bwserve](bwserve.md) for the full protocol reference.

## The `bwcli attach` subcommand — Remote Debugging REPL

`bwcli attach` provides a built-in terminal-based debugger for any bitwrench page. It starts a bwserve instance and waits for a browser to connect via a drop-in `<script>` tag. Once connected, you get an interactive REPL for evaluating JS, inspecting the DOM, taking screenshots, and listening to events.

### Usage

```bash
# Start on default port (7902)
bwcli attach

# Custom port
bwcli attach --port 3000

# Enable screenshot support
bwcli attach --allow-screenshot

# Verbose mode (shows protocol messages)
bwcli attach -v
```

### Connecting a page

Add this to any HTML page, or paste it into the browser's devtools console:

```html
<script src="http://localhost:7902/bw/attach.js"></script>
```

The drop-in script automatically loads bitwrench if it's not already on the page, then connects via SSE.

### REPL commands

Once connected, you get a `bw>` prompt:

```
bw> document.title                    # Evaluate JS expression
bw> /tree #app 2                      # Show DOM tree
bw> /screenshot body page.png         # Capture screenshot (requires --allow-screenshot)
bw> /mount #app card {"title":"Hi"}   # Mount BCCL component
bw> /render #app {"t":"h1","c":"Hi"}  # Render TACO
bw> /patch counter 42                 # Update element text
bw> /listen button click              # Watch DOM events
bw> /unlisten button click            # Stop watching
bw> /exec alert('hello')             # Execute JS (fire-and-forget)
bw> /clients                          # List connected clients
bw> /help                             # Command reference
bw> /quit                             # Exit
```

### Options

```
bwcli attach [options]

Options:
  -p, --port <number>        Server port (default: 7902)
      --allow-screenshot     Enable /screenshot command
  -v, --verbose              Verbose output
  -h, --help                 Print help
```

For the complete guide, see [bwcli attach documentation](bw-attach.md).

## Page layout

The CLI wraps content in a responsive layout:

- Centered container (max-width 48rem)
- System font stack (San Francisco, Segoe UI, Roboto, Helvetica, Arial)
- Comfortable typography (1rem base, 1.6 line-height)
- Styled code blocks with horizontal scroll
- Responsive tables with alternating row colors
- Mobile-friendly (adjusts at 600px breakpoint)

This layout is designed to produce readable documents without any additional styling. Add `--theme` and `--standalone` (or `--cdn`) for bitwrench-styled components on top of this base.
