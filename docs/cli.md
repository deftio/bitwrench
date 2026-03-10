# CLI

The `bitwrench` command converts files to styled HTML pages. It supports Markdown, HTML, and JSON input, and can produce self-contained offline pages or pages that load bitwrench from a CDN.

## Installation

```bash
npm install -g bitwrench
```

Or use `npx` without installing:

```bash
npx bitwrench README.md
```

## Basic usage

```bash
# Convert a Markdown file to HTML
bitwrench README.md

# Specify output file
bitwrench README.md -o index.html

# Apply a theme
bitwrench README.md -o index.html --theme ocean

# Create a self-contained offline page
bitwrench README.md -o index.html --standalone

# Add syntax highlighting
bitwrench README.md -o index.html --highlight
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
bitwrench docs/guide.md       # → docs/guide.html
bitwrench data.json            # → data.html
```

Override with `-o`:

```bash
bitwrench docs/guide.md -o site/index.html
```

## Bitwrench injection modes

By default, the CLI produces plain HTML without bitwrench. Three flags control how bitwrench is included in the output:

| Flag | Mode | What happens |
|------|------|-------------|
| `--standalone` / `-s` | Inline | The entire bitwrench UMD bundle is embedded in a `<script>` tag. Page works offline with no external dependencies. |
| `--cdn` | CDN | A `<script>` tag loads bitwrench from jsDelivr with an SRI hash for integrity. Requires internet access. |
| `--no-bw` | None | No bitwrench is included. Plain HTML output. This is the default. |

When bitwrench is included (`--standalone` or `--cdn`), a small script runs after the page loads to call `bw.loadDefaultStyles()`, applying bitwrench's default component styles.

## Themes

Apply a built-in theme preset:

```bash
bitwrench README.md --theme ocean
bitwrench README.md --theme sunset
bitwrench README.md --theme forest
bitwrench README.md --theme slate
```

Or specify custom colors as a comma-separated pair of hex values (primary and secondary):

```bash
bitwrench README.md --theme "#336699,#cc6633"
```

Available presets: `teal`, `ocean`, `sunset`, `forest`, `slate`, `rose`, `indigo`, `amber`, `emerald`, `nord`, `coral`, `midnight`.

Themes require bitwrench to be included (`--standalone` or `--cdn`). If neither is specified, the theme flag is ignored.

## Additional CSS

Include an external CSS file:

```bash
bitwrench README.md -c styles.css -o index.html
```

The CSS file's contents are embedded in a `<style>` tag in the output. This works with or without bitwrench injection.

## Favicon

Add a favicon to the page:

```bash
bitwrench README.md -f favicon.ico -o index.html
bitwrench README.md -f https://example.com/icon.png -o index.html
```

The value is used directly as the `href` attribute of a `<link rel="icon">` tag.

## Syntax highlighting

Include highlight.js for code block syntax highlighting:

```bash
bitwrench README.md --highlight -o index.html
```

This adds the highlight.js CDN stylesheet and script to the output page. Code blocks in the Markdown source get automatic syntax highlighting based on the language specified in the fenced code block.

## Page title

The CLI auto-detects the page title from the content:

- **Markdown**: First `# heading` in the file
- **HTML**: `<title>` element content
- **JSON**: The filename

Override with `--title`:

```bash
bitwrench README.md --title "My Project Documentation" -o index.html
```

## All flags

```
bitwrench <file> [options]

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

## The `bitwrench serve` subcommand

```bash
bitwrench serve [dir] [options]
```

A development server for bitwrench applications. This feature is under development — see [bwserve](bwserve.md) for the server-driven UI library it will be built on.

```
Options:
  -p, --port <number>    Port (default: 7902)
  -t, --theme <name>     Theme preset or hex colors
      --open             Open browser on start
  -v, --verbose          Verbose output
  -h, --help             Print help
```

## Page layout

The CLI wraps content in a responsive layout:

- Centered container (max-width 48rem)
- System font stack (San Francisco, Segoe UI, Roboto, Helvetica, Arial)
- Comfortable typography (1rem base, 1.6 line-height)
- Styled code blocks with horizontal scroll
- Responsive tables with alternating row colors
- Mobile-friendly (adjusts at 600px breakpoint)

This layout is designed to produce readable documents without any additional styling. Add `--theme` and `--standalone` (or `--cdn`) for bitwrench-styled components on top of this base.
