# Live Feed

Real-time event stream with filter bar, slide-in animations, and auto-expiring items.

## What This Demonstrates

- `bw.patch()` / `bw.patchAll()` for targeted DOM updates (counter badges)
- `bw.createDOM()` + `insertBefore` for appending items without full re-render
- `bw.cleanup()` for element lifecycle management (removing expired items)
- `bw.css({ '@keyframes slideIn': {...} })` for entry animations
- `bw.uuid()` for counter badge addressing
- `bw.makeButton()` filter bar with active state
- `bw.makeBadge()` for event type indicators

## Audience

**Intermediate** — Demonstrates DOM manipulation patterns beyond full re-renders.

## Theme

**Feed** — `#0f766e` (teal), `#be185d` (crimson), `#c2410c` (burnt orange). Multi-accent palette for different event types.

## How to Run

Open `index.html` in any browser. Events are simulated with timers.

```
open examples/live-feed/index.html
```

## Architecture

- `feedItems` array holds all items with expiry timestamps
- `addItem()` creates new items, prepends to DOM via `bw.createDOM()` + `insertBefore`
- `cleanupExpired()` removes items past their 30-second lifetime via `bw.cleanup()`
- `enforceMax()` caps visible items at 20
- Filter changes trigger full `renderList()` re-render; new items use append pattern
- Counter badges updated via `bw.patchAll()` — no re-render needed

## Key Patterns to Study

1. **Append vs. re-render**: New items use `bw.createDOM()` (fast), filter changes use `bw.DOM()` (full)
2. **bw.patchAll()**: Batch-updates multiple counter badges by CSS class in one call
3. **bw.uuid()**: Generates stable CSS classes for counter badges that `bw.patchAll()` targets
4. **bw.cleanup()**: Properly cleans up lifecycle hooks when removing elements
5. **Auto-expiry**: Items track their own expiry time; cleanup runs on a 5-second interval
