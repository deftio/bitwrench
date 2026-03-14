# Todo App

Classic reactive todo application with filter bar and pub/sub state management.

## What This Demonstrates

- `bw.component()` Level 2 with template bindings
- `bw.pub()` / `bw.sub()` for `todos:changed` events
- `bw.makeButton()` with dynamic variant switching (active filter)
- `bw.makeCheckbox()`, `bw.makeInput()` for form elements
- Composing multiple render functions that react to a shared topic

## Audience

**Beginner** — The best starting point for understanding bitwrench reactive patterns.

## Theme

**Todo** — `#6366f1` (indigo), `#ec4899` (pink). Clean, modern palette.

## How to Run

Open `index.html` in any browser. Comes pre-seeded with 3 demo todos.

```
open examples/todo-app/index.html
```

## Architecture

- `todos` array is the source of truth (plain JavaScript)
- `addTodo()`, `toggleTodo()`, `deleteTodo()` mutate the array then publish `todos:changed`
- `renderApp()` subscribes to `todos:changed` and re-renders list, filter bar, and stats
- Filter bar uses variant switching: active filter gets `'primary'`, others get `'outline_primary'`

## Key Patterns to Study

1. **Pub/sub state**: All mutations publish `todos:changed` → all UI sections re-render
2. **Filter pattern**: `filteredTodos()` applies current filter without modifying source array
3. **Component composition**: Input row, filter bar, todo list, and stats are independent render functions
