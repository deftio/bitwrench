# Ember & Oak Coffee Co.

A full-page e-commerce landing built entirely with bitwrench — the most comprehensive example in the gallery.

## What This Demonstrates

- `bw.component()` Level 2 with `${template}` bindings and `o.methods`
- `bw.pub()` / `bw.sub()` for cart state broadcast (navbar subscribes to `cart:updated`)
- `bw.loadStyles({ primary: '#8B4513', ... })` with warm brown/chocolate palette
- `bw.makeBarChart()`, `bw.makeTimeline()`, `bw.makeAccordion()`, `bw.makeTable()`
- `bw.makeSearchInput()` with live filter pattern
- `bw.createDOM()` for toast append pattern (transient UI)
- `bw.makeStatCard()`, `bw.makeFeatureGrid()`, `bw.makeCodeDemo()`
- Level 1 + Level 2 components working side by side
- 27 BCCL components used in a single page

## Audience

**Advanced** — This example covers the full bitwrench API surface. Best studied after understanding the basics from the Todo App and Dashboard examples.

## Theme

**Ember** — `#8B4513` (saddle brown), `#D2691E` (chocolate), `#2F4F2F` (dark olive green). Warm, earthy tones that evoke craft coffee culture.

## How to Run

Open `index.html` in any browser. No build step, no server required. All data is simulated client-side.

```
open examples/ember-and-oak/index.html
```

## Architecture

The page is organized as a sequence of TACO sections mounted via a single `bw.DOM('#app', ...)` call:

1. **Navbar** — `bw.component()` Level 2 with `${cartCount}` binding
2. **Hero** — Static TACO with gradient background
3. **Coffee Grid** — Level 1 `o.mounted` with search + filter re-render
4. **How It Works** — Static step cards
5. **Our Story** — `bw.makeTimeline()` with milestone entries
6. **Features** — `bw.makeFeatureGrid()` with 6 items
7. **Team** — Custom TACO cards
8. **Testimonials** — Dark section with quote cards
9. **Impact** — `bw.makeStatCard()` + `bw.makeBarChart()` + `bw.makeTable()`
10. **FAQ** — `bw.makeAccordion()` with 6 entries
11. **Contact** — `bw.component()` Level 2 form with status binding
12. **Newsletter** — Level 1 with mounted event handler
13. **Showcase** — Live counter + progress demos + code example
14. **Footer** — Static TACO
15. **Cart panel** — Slide-out panel driven by pub/sub

## Key Patterns to Study

1. **Pub/sub cart**: `cartAdd()` publishes `cart:updated` → navbar component subscribes and updates badge count automatically
2. **Component Level 2**: `${count}` template bindings auto-update DOM when `handle.set()` is called
3. **Filter pattern**: `renderCoffeeSection()` re-renders the product grid based on search text and selected filter
4. **Toast append**: `bw.createDOM()` creates transient notifications that auto-dismiss after 3.5 seconds
5. **Theme tokens**: All colors derived from 3 seed hex values via `bw.loadStyles()`
