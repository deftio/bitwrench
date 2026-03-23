# Bitwrench Documentation

These guides cover how to build UIs with bitwrench.

## What to Read

| Question | Guide |
|----------|-------|
| What components does bitwrench have? | [Component Cheat Sheet](component-cheatsheet.md) |
| How do I build a page? | [Building a Website tutorial](tutorial-website.md) |
| How does TACO work? | [TACO Format](taco-format.md) or [Thinking in Bitwrench](thinking-in-bitwrench.md) |
| How do I add interactivity? | [State Management](state-management.md) |
| How do I theme my app? | [Theming](theming.md) |
| I'm an LLM generating bitwrench code | [LLM Guide](llm-bitwrench-guide.md) |
| Full API with signatures? | [API Reference](bitwrench_api.md) |

## Start Here

- **[Thinking in Bitwrench](thinking-in-bitwrench.md)** -- The complete guide to building with bitwrench. Covers TACO basics, styling (`bw.css`, `bw.s`, `bw.responsive`), composition, the three-level component model, events (and why `onclick` goes in `a:`, not `o.mounted`), bwserve, and common patterns. **Read this first.**
- **[LLM Guide](llm-bitwrench-guide.md)** -- Compact single-file reference for AI-assisted development. All APIs, patterns, and rules in one document. Also useful as a quick-reference cheat sheet for humans.

## Guides

| Guide | Description |
|-------|-------------|
| [Thinking in Bitwrench](thinking-in-bitwrench.md) | Design philosophy: why TACO exists, component model vs. DOM templates |
| [TACO Format](taco-format.md) | The `{t, a, c, o}` object format that bitwrench uses for everything |
| [State Management](state-management.md) | Three-level component model, reactive state, cross-component communication |
| [Component Cheat Sheet](component-cheatsheet.md) | Scannable table of all 47+ components with capabilities and handles |
| [Component Library](component-library.md) | All 50+ `make*()` functions with full signatures and examples |
| [Routing](routing.md) | Client-side router: hash/history mode, route params, guards, pub/sub |
| [Theming](theming.md) | Palette-driven theme generation, presets, design tokens |
| [CLI](cli.md) | The `bwcli` command: file conversion, themes, standalone pages |
| [bwserve](bwserve.md) | Server-driven UI: SSE protocol, pipe server, embedded devices, relaxed JSON |
| [bwcli attach](bw-attach.md) | Remote debugging REPL: terminal-based inspector for any bitwrench page |
| [LLM Guide](llm-bitwrench-guide.md) | Compact single-file reference for AI-assisted development |

## Tutorials

| Tutorial | Description |
|----------|-------------|
| [Building a Website](tutorial-website.md) | Build a complete landing page from scratch |
| [Server App with bwserve](tutorial-bwserve.md) | Build a Streamlit-style server-driven dashboard |
| [ESP32 Embedded](tutorial-embedded.md) | ESP32 IoT dashboard with C/C++ macros |

## Interactive Docs

The [live documentation site](https://deftio.github.io/bitwrench/pages/) has interactive examples:

- [Quick Start](https://deftio.github.io/bitwrench/pages/00-quick-start.html)
- [Components](https://deftio.github.io/bitwrench/pages/01-components.html)
- [Tables & Forms](https://deftio.github.io/bitwrench/pages/02-tables-forms.html)
- [Styling](https://deftio.github.io/bitwrench/pages/03-styling.html)
- [Dashboard](https://deftio.github.io/bitwrench/pages/04-dashboard.html)
- [State & Interactivity](https://deftio.github.io/bitwrench/pages/05-state.html)
- [Framework Comparison](https://deftio.github.io/bitwrench/pages/07-framework-comparison.html)
- [Themes](https://deftio.github.io/bitwrench/pages/10-themes.html)
- [Debugging](https://deftio.github.io/bitwrench/pages/11-debugging.html)
- [bwserve Protocol](https://deftio.github.io/bitwrench/pages/12-bwserve-protocol.html)
- [bwserve Sandbox](https://deftio.github.io/bitwrench/pages/bwserve-sandbox.html)

## Key Concepts

Bitwrench describes UI as plain JavaScript objects. There is no JSX, no templates, no virtual DOM, and no compile step required. A button is a JavaScript object. A page layout is a JavaScript object. You compose them with arrays and functions — standard language features.

The library provides four things:

1. **A rendering engine** that turns objects into HTML or DOM
2. **A component library** of 50+ ready-made UI elements
3. **A reactivity system** that updates the DOM when state changes
4. **A client-side router** that maps URLs to views with guards and pub/sub

Everything else -- styling, theming, event handling, server communication -- builds on these pieces.
