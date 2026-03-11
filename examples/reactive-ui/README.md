# Reactive UI Example

An interactive todo app built with bitwrench, demonstrating the reactive ComponentHandle pattern.

## What This Shows

- **Level 2 ComponentHandle**: `bw.component()` for the input bar
- **Pub/sub reactivity**: `bw.pub('todos:changed')` triggers re-render of list, filters, and stats
- **BCCL components**: `makeButton`, `makeInput`, `makeCheckbox` for form controls
- **Functional rendering**: Pure functions (`renderTodoItem`, `renderTodoList`, `renderStats`) return TACO
- **Filter state**: All / Active / Completed views with dynamic button highlighting
- **No direct DOM**: All updates go through `bw.DOM()`, no `innerHTML` or `document.querySelector()`

## Running

Open `index.html` in a browser. That's it.

For local development without CDN:

```html
<script src="../../dist/bitwrench.umd.js"></script>
<link rel="stylesheet" href="../../dist/bitwrench.css">
```

## Architecture

```
State:   todos[] array (plain JS)
Events:  bw.pub('todos:changed') on any mutation
Render:  renderApp() → bw.DOM() calls for list, filters, stats
Input:   bw.component() wrapping makeInput + makeButton
```

## Structure

```
reactive-ui/
  index.html    ← everything in one file (~180 lines of JS)
  README.md     ← this file
```
