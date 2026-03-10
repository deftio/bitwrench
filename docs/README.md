# Bitwrench Documentation

These guides cover how to build UIs with bitwrench. Start with the TACO format, then explore state management and the component library.

## Guides

| Guide | Description |
|-------|-------------|
| [TACO Format](taco-format.md) | The `{t, a, c, o}` object format that bitwrench uses for everything |
| [State Management](state-management.md) | Three-level component model, reactive state, cross-component communication |
| [Component Library](component-library.md) | All 52 `make*()` functions with signatures and examples |
| [Theming](theming.md) | Palette-driven theme generation, presets, design tokens |
| [CLI](cli.md) | The `bitwrench` command: file conversion, themes, standalone pages |
| [bwserve](bwserve.md) | Server-driven UI (coming soon) |
| [LLM Guide](llm-bitwrench-guide.md) | Compact single-file reference for AI-assisted development |

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

## Key Concepts

Bitwrench describes UI as plain JavaScript objects. There is no JSX, no templates, no virtual DOM, and no compile step required. A button is a JavaScript object. A page layout is a JavaScript object. You compose them with arrays and functions — standard language features.

The library provides three things:

1. **A rendering engine** that turns objects into HTML or DOM
2. **A component library** of 52 ready-made UI elements
3. **A reactivity system** that updates the DOM when state changes

Everything else — styling, theming, event handling, server communication — builds on these three pieces.
