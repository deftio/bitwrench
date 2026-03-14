# Metrics Dashboard

Live-updating admin dashboard with stat cards, bar chart, progress bars, and activity feed.

## What This Demonstrates

- `bw.s()` / `bw.u` for inline style composition
- `bw.responsive()` for layout breakpoints
- Theme palette tokens (`P.primary.base`, `P.muted.border`, etc.)
- `bw.css({ '@keyframes pulse': {...} })` for CSS animations
- `bw.pub()` / `bw.sub()` for metrics broadcast to progress panel
- `bw.makeStatCard()`, `bw.makeBarChart()`, `bw.makeProgress()`, `bw.makeBadge()`

## Audience

**Intermediate** — Assumes familiarity with TACO basics and bw.DOM().

## Theme

**Dashboard** — `#1e40af` (deep blue), `#059669` (emerald), `#7c3aed` (purple). Professional data-oriented palette.

## How to Run

Open `index.html` in any browser. Data is simulated with timers.

```
open examples/dashboard/index.html
```

## Architecture

- Stat cards grid updates every 3 seconds via `updateStats()`
- Activity feed appends items every 2.5 seconds
- Progress panel subscribes to `metrics:updated` topic and re-renders
- Responsive breakpoints adapt layout from 1-column (mobile) to 4-column (desktop)

## Key Patterns to Study

1. **Theme token usage**: No hardcoded hex values in CSS — everything derives from `theme.palette`
2. **Utility styles**: `bw.s(bw.u.flex, bw.u.justifyBetween, bw.u.mb4)` composes inline styles
3. **Responsive**: `bw.responsive('.dash-stats', { base: {...}, lg: {...} })` generates media queries
4. **Pub/sub decoupling**: `updateStats()` publishes data; `renderProgress()` subscribes independently
