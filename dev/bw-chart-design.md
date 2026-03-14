# bitwrench-chart: SVG Charting Library Design

## Status: Design — not yet implemented

## Overview

`bitwrench-chart` is a **separate** SVG charting library that produces TACO
objects. It is not part of the bitwrench core bundle. It has zero runtime
dependencies — bitwrench integration (themes, bwserve patching) is optional.

### Why separate

| Concern | bitwrench core | bitwrench-chart |
|---------|---------------|-----------------|
| Bundle budget | 45KB gzipped max | **No limit** |
| Audience | Every bitwrench user | Users who need real charts |
| Release cadence | Tied to core | Independent |
| Tree-shaking | N/A (UMD primary) | ESM-first, import what you use |
| `bw.makeBarChart()` | Stays — trivial CSS-bar chart | Full-featured SVG bar chart |

### Why SVG (not Canvas)

SVG elements are DOM nodes. DOM nodes are TACO objects. This means charts
get bitwrench's full power for free:

1. **Serializable** — `bw.html(chart)` → SVG string. Works server-side.
2. **Patchable** — `bw.patch(barId, { height: 120 })` updates one bar.
3. **Themeable** — chart colors come from `theme.palette`.
4. **Server-renderable** — bwserve can push chart updates over SSE.
5. **Accessible** — SVG supports `<title>`, `<desc>`, `aria-*` natively.
6. **CSS-stylable** — SVG inherits document CSS. Themes Just Work.
7. **Resolution-independent** — scales to any display density.
8. **Inspectable** — dev tools show individual elements, not opaque pixels.

Canvas is only better for >10K data points. For dashboards, reports, and
embedded UIs (bitwrench's audience), SVG wins on every axis.

---

## Package Structure

```
bitwrench-chart/
  src/
    index.js            # Entry: exports all chart functions
    core/
      scale.js          # Linear, log, band, time scales (~60 lines each)
      axis.js           # Axis generation (ticks, labels, gridlines)
      legend.js         # Legend layout
      tooltip.js        # Tooltip TACO (positioned on hover)
      responsive.js     # viewBox-based responsive wrapper
      animate.js        # CSS animation helpers (optional)
    charts/
      bar.js            # Bar chart (vertical, horizontal, stacked, grouped)
      line.js           # Line chart (single, multi-series, area, curved)
      sparkline.js      # Sparkline (inline mini chart, no axes)
      pie.js            # Pie / donut
      gauge.js          # Gauge (semi-circle, full, with needle)
      scatter.js        # Scatter plot (with optional regression line)
      heatmap.js        # Heatmap (2D grid, color-mapped cells)
      radar.js          # Radar / spider chart
      treemap.js        # Treemap (nested rectangles, squarified layout)
      chord.js          # Chord diagram (circular flow relationships)
      array-image.js    # 2D array → SVG image (pixel grid, adj palette)
    themes/
      default.js        # Default palette (standalone, no bitwrench needed)
      bitwrench.js      # Adapter: reads bw.generateTheme() palette
  dist/
    bitwrench-chart.esm.js
    bitwrench-chart.umd.js
    bitwrench-chart.cjs.js
  test/
  examples/
  package.json
  README.md
```

### Naming

- npm: `bitwrench-chart`
- Global (UMD): `bwChart`
- Alias: `bwchart` (npm alias or redirect)
- Import: `import { barChart, lineChart } from 'bitwrench-chart'`

---

## Chart Types

### Tier 1: Ship first (MVP)

| Chart | Function | Use case |
|-------|----------|----------|
| **Bar** | `barChart(config)` | Comparisons. Vertical, horizontal, stacked, grouped. |
| **Line** | `lineChart(config)` | Trends over time. Single, multi-series, area fill. |
| **Sparkline** | `sparkline(config)` | Inline mini trends. No axes, fits in a table cell. |
| **Pie / Donut** | `pieChart(config)` | Part-of-whole. Donut variant with center label. |
| **Gauge** | `gauge(config)` | Single KPI. Semi-circle or full circle with needle. |

### Tier 2: Ship second

| Chart | Function | Use case |
|-------|----------|----------|
| **Scatter** | `scatterChart(config)` | Correlations. Optional regression line, size encoding. |
| **Heatmap** | `heatmap(config)` | 2D density. Calendar heatmaps, correlation matrices. |
| **Radar** | `radarChart(config)` | Multi-axis comparison. Skill charts, product comparison. |
| **2D Array Image** | `arrayImage(config)` | Pixel-level visualization. Scientific data, image preview. |

### Tier 3: Ship third

| Chart | Function | Use case |
|-------|----------|----------|
| **Treemap** | `treemap(config)` | Hierarchical part-of-whole. File sizes, budgets. |
| **Chord** | `chord(config)` | Flow relationships. Migration, trade, dependencies. |

---

## API Design

### Universal config pattern

Every chart function follows the same shape:

```javascript
chartFunction({
  // Data (required)
  data: [...],

  // Dimensions (optional, viewBox-based)
  width: 600,
  height: 400,

  // Appearance (optional)
  palette: ['#4f46e5', '#d97706', '#059669'],  // or theme.palette object
  className: '',

  // Axes (where applicable)
  xAxis: { label: 'Month', ticks: 6 },
  yAxis: { label: 'Revenue ($)', format: v => '$' + v.toLocaleString() },

  // Features (optional)
  legend: true,       // or { position: 'top' | 'bottom' | 'right' }
  tooltip: true,      // hover tooltips
  animate: false,     // CSS animations on load
  responsive: true,   // viewBox scaling (default true)
  accessible: true,   // aria labels, <title>, <desc> (default true)

  // Events (browser only)
  onClick: (datum, index, event) => {},
  onHover: (datum, index, event) => {}
})
```

Returns a TACO `{t: 'svg', a: {...}, c: [...]}` object. Not a DOM element.

### Example: Bar chart

```javascript
import { barChart } from 'bitwrench-chart';

var chart = barChart({
  data: [
    { label: 'Q1', value: 12400 },
    { label: 'Q2', value: 18900 },
    { label: 'Q3', value: 15200 },
    { label: 'Q4', value: 22100 }
  ],
  width: 500,
  height: 300,
  yAxis: { format: v => '$' + (v / 1000) + 'k' },
  palette: ['#4f46e5']
});

// Render in browser
bw.DOM('#chart', chart);

// Or render to HTML string (server, static site, bwserve)
var svg = bw.html(chart);
```

### Example: With bitwrench theme

```javascript
var theme = bw.generateTheme('brand', {
  primary: '#4f46e5',
  secondary: '#d97706'
});

var chart = barChart({
  data: salesData,
  palette: theme.palette  // chart auto-extracts colors
});
```

### Example: bwserve real-time update

```javascript
// Server pushes chart updates over SSE
app.page('/', function(client) {
  var data = getInitialData();

  client.render('#chart', lineChart({
    data: data,
    width: 600,
    height: 300,
    yAxis: { label: 'Temperature (C)' }
  }));

  // Push new data point every second
  var interval = setInterval(function() {
    data.push({ x: Date.now(), y: readSensor() });
    if (data.length > 60) data.shift();

    // Full chart re-render — bwserve sends the diff
    client.render('#chart', lineChart({
      data: data,
      width: 600,
      height: 300,
      yAxis: { label: 'Temperature (C)' }
    }));
  }, 1000);

  client.on('disconnect', function() { clearInterval(interval); });
});
```

### Example: Sparkline in a table

```javascript
var table = bw.makeTable({
  data: metrics.map(function(m) {
    return {
      name: m.name,
      current: m.values[m.values.length - 1],
      trend: sparkline({ data: m.values, width: 80, height: 20 })
    };
  }),
  columns: [
    { key: 'name', label: 'Metric' },
    { key: 'current', label: 'Current' },
    { key: 'trend', label: 'Trend', render: function(v) { return v; } }
  ]
});
```

---

## Core Internals

### Scale functions (~50 lines each)

No D3 dependency. Scales are pure functions:

```javascript
// Linear scale: domain → range
function linearScale(domain, range) {
  var d0 = domain[0], d1 = domain[1];
  var r0 = range[0], r1 = range[1];
  var span = d1 - d0 || 1;
  return function(value) {
    return r0 + (value - d0) / span * (r1 - r0);
  };
}

// Band scale: categorical → positioned bands
function bandScale(labels, range, padding) {
  var step = (range[1] - range[0]) / labels.length;
  var bandWidth = step * (1 - (padding || 0.1));
  return function(label) {
    var i = labels.indexOf(label);
    return {
      x: range[0] + i * step + (step - bandWidth) / 2,
      width: bandWidth
    };
  };
}
```

### Tick generation

Nice tick values (1, 2, 5 multiples), label formatting, gridline TACO
objects. About 40 lines.

### SVG generation via TACO

All SVG is built as TACO objects:

```javascript
// A bar is just a TACO rect
{ t: 'rect', a: { x: 50, y: 20, width: 40, height: 180, fill: '#4f46e5' } }

// A line is a TACO path
{ t: 'path', a: { d: 'M10,190 L50,120 L90,150 L130,80', stroke: '#4f46e5', fill: 'none' } }

// An axis label is a TACO text
{ t: 'text', a: { x: 300, y: 395, 'text-anchor': 'middle' }, c: 'Months' }
```

The chart functions compose these primitives:

```javascript
function barChart(config) {
  var margin = { top: 20, right: 20, bottom: 40, left: 50 };
  var innerW = config.width - margin.left - margin.right;
  var innerH = config.height - margin.top - margin.bottom;

  var xScale = bandScale(labels, [0, innerW], 0.1);
  var yScale = linearScale([0, maxVal], [innerH, 0]);

  var bars = data.map(function(d) {
    var band = xScale(d.label);
    return {
      t: 'rect',
      a: {
        x: band.x,
        y: yScale(d.value),
        width: band.width,
        height: innerH - yScale(d.value),
        fill: palette[0],
        'data-value': d.value
      }
    };
  });

  return {
    t: 'svg',
    a: {
      viewBox: '0 0 ' + config.width + ' ' + config.height,
      class: 'bwchart bwchart-bar ' + (config.className || ''),
      role: 'img',
      'aria-label': config.title || 'Bar chart'
    },
    c: [
      { t: 'g', a: { transform: 'translate(' + margin.left + ',' + margin.top + ')' }, c: [
        ...bars,
        ...xAxisTaco,
        ...yAxisTaco
      ]}
    ]
  };
}
```

---

## Chart-Specific Design Notes

### Bar chart

- Variants: vertical (default), horizontal, stacked, grouped
- Horizontal: swap x/y scales, rotate labels
- Stacked: accumulate y offsets per category
- Grouped: subdivide band width by series count
- Negative values: bars grow downward from zero line

### Line chart

- Variants: straight segments (default), curved (monotone cubic), area fill
- Multi-series: multiple `<path>` elements, legend auto-generated
- Area fill: close path to x-axis, apply fill-opacity
- Data gaps: break the path at null/undefined values (moveTo)
- Curve: monotone cubic interpolation (~30 lines, no bezier lib needed)

### Sparkline

- Minimal: no axes, no labels, no tooltip by default
- SVG with small viewBox (e.g., 80x20)
- Optional: min/max dots, last-value label, reference line
- Renders inline (`display: inline-block`) for table cell usage

### Pie / Donut

- SVG arcs via `<path>` with arc commands
- Donut: inner radius > 0
- Center label for donut (total, percentage, custom text)
- Label placement: inside slice, outside with leader line, or legend only
- Minimum angle threshold: very small slices grouped as "Other"

### Gauge

- Semi-circle (180deg) or full circle (270deg, gap at bottom)
- Needle or filled arc to show value
- Configurable min/max/thresholds (green/yellow/red zones)
- Center value label with format function

### Scatter

- Dot size optionally maps to a third data dimension (bubble chart)
- Optional regression line (linear least-squares, ~15 lines)
- Quadrant lines (optional, for positioning matrices)
- Color encoding by category

### Heatmap

- 2D grid of colored rectangles
- Color scale: sequential (single hue), diverging (two hues from center)
- Cell labels (optional, auto-hide when cells are too small)
- Row/column labels
- Calendar variant: 7-row × 52-col with weekday/month labels

### Radar chart

- N-axis polygon grid (3-12 axes typical)
- Filled polygon data overlay with stroke
- Multiple series overlaid with transparency
- Axis labels at polygon vertices
- Configurable scale (0-100 default, or auto from data)

### Treemap

- Squarified layout algorithm (~50 lines)
- Nested rectangles with labels
- Color by category or value
- Drill-down: click a rectangle to zoom into children
- Breadcrumb trail for navigation

### Chord diagram

- Circular layout with arcs for categories
- Ribbons connecting categories show flow magnitude
- Symmetric (A→B and B→A share a ribbon) or directed
- Input: matrix (NxN flow values) or edge list
- Color by source category

### 2D Array → Image (arrayImage)

Heritage from bitwrench 1.x (didn't make it to the repo).

- Input: 2D numeric array (e.g., `[[0, 0.5, 1], [0.2, 0.8, 0.4]]`)
- Each cell maps to a colored SVG `<rect>` (or single pixel via `<image>`)
- Color palette: configurable (viridis, plasma, magma, inferno, grayscale, custom)
- Adjustable: contrast, brightness, gamma via palette transform
- Scale bar: optional color legend showing value → color mapping
- Use cases: scientific data, image preview, terrain maps, neural net weights
- For very large arrays (>100x100), consider `<image>` with data URL for
  performance; for smaller arrays, individual `<rect>` elements allow
  per-cell tooltips and click handlers

Two rendering modes:
```javascript
// Mode 1: SVG rects (interactive, <100x100)
arrayImage({
  data: matrix,
  palette: 'viridis',
  cellSize: 4,          // px per cell
  interactive: true     // tooltips on hover
})

// Mode 2: Canvas-to-data-URL (fast, >100x100)
arrayImage({
  data: bigMatrix,
  palette: 'plasma',
  mode: 'image'         // renders as <image> with data URL
})
```

---

## Palette Integration

### Standalone (no bitwrench)

```javascript
import { barChart } from 'bitwrench-chart';

barChart({
  data: myData,
  palette: ['#4f46e5', '#d97706', '#059669', '#dc2626', '#8b5cf6']
});
```

### With bitwrench theme

```javascript
import { barChart, fromTheme } from 'bitwrench-chart';

var theme = bw.generateTheme('brand', { primary: '#4f46e5', secondary: '#d97706' });
var colors = fromTheme(theme.palette);
// colors = [primary.base, secondary.base, tertiary.base, info.base, success.base, ...]

barChart({ data: myData, palette: colors });
```

### Default palette

When no palette is provided, charts use a built-in 8-color categorical
palette designed for sufficient contrast and colorblind accessibility:

```javascript
var DEFAULT_PALETTE = [
  '#4f46e5',  // indigo
  '#d97706',  // amber
  '#059669',  // emerald
  '#dc2626',  // red
  '#8b5cf6',  // violet
  '#0891b2',  // cyan
  '#c026d3',  // fuchsia
  '#65a30d'   // lime
];
```

---

## Responsive Strategy

All charts use `viewBox` for scaling:

```javascript
{
  t: 'svg',
  a: {
    viewBox: '0 0 600 400',
    // NO width/height attributes — fills container
    style: 'width: 100%; height: auto;',
    preserveAspectRatio: 'xMidYMid meet'
  }
}
```

Container controls size via CSS. Chart scales proportionally. Works on
embedded (ESP32 screen), mobile, desktop, and print.

---

## Accessibility

Every chart includes by default:

- `role="img"` on root `<svg>`
- `<title>` with chart title (or auto-generated)
- `<desc>` with data summary (e.g., "Bar chart showing Q1: $12.4k, Q2: $18.9k...")
- `aria-label` on interactive elements
- Sufficient color contrast (4.5:1 minimum for text)
- Pattern fills option for colorblind users (stripes, dots, crosshatch)
- Keyboard navigation for interactive charts (Tab through data points)

---

## Animation Strategy

CSS-based, not JS-based. Opt-in via `animate: true`:

```css
.bwchart-bar rect {
  transition: height 0.3s ease-out, y 0.3s ease-out;
}
.bwchart-line path {
  stroke-dasharray: 1000;
  stroke-dashoffset: 1000;
  animation: bwchart-draw 1s ease-out forwards;
}
@keyframes bwchart-draw {
  to { stroke-dashoffset: 0; }
}
```

Generated by the library as an injectable CSS string. No runtime animation
loop. Works in bwserve (CSS is included in the page shell).

---

## Testing Strategy

- Pure unit tests for scales, tick generation, layout algorithms
- Snapshot tests: verify SVG structure matches expected TACO
- Visual regression: render to HTML, screenshot with Playwright, compare
- Accessibility: axe-core on rendered charts
- Coverage target: 100% (same as bitwrench core)

---

## Relationship to `bw.makeBarChart()`

The existing `bw.makeBarChart()` in bitwrench core stays. It's a simple
CSS-based bar chart using `<div>` height percentages. Good enough for
dashboards and quick prototypes.

`bitwrench-chart` is for users who need:
- Real axes with tick marks and labels
- Multiple chart types
- Multi-series data
- SVG export
- Accessibility compliance
- Print-quality output

The two don't conflict. `bw.makeBarChart()` is ~60 lines of simple divs.
`barChart()` from bitwrench-chart is a full SVG charting solution.

---

## Implementation Plan

### Phase 1: Core + Bar + Line + Sparkline + Pie

- Scales (linear, band, time)
- Axis generation
- Bar chart (vertical only initially)
- Line chart (straight + area)
- Sparkline
- Pie chart (pie + donut)
- Default palette
- Responsive wrapper
- Basic accessibility (<title>, <desc>, role)
- Tests for all of the above
- README with examples
- npm publish as `bitwrench-chart` v0.1.0

### Phase 2: Gauge + Scatter + Heatmap + Radar + Array Image

- Gauge (semi-circle)
- Scatter plot (with optional bubble sizing)
- Heatmap (grid + calendar variant)
- Radar chart
- 2D array image (both rect and data-URL modes)
- Animation CSS
- bitwrench theme adapter (`fromTheme()`)
- Legend component
- Tooltip component
- v0.2.0

### Phase 3: Treemap + Chord + Bar variants + Polish

- Treemap (squarified algorithm)
- Chord diagram
- Bar chart variants (horizontal, stacked, grouped)
- Line chart curves (monotone cubic)
- Pattern fills for accessibility
- Keyboard navigation
- Print stylesheet
- Full documentation site
- v1.0.0

---

## LOC Estimates

| Module | Est. Lines |
|--------|-----------|
| Scales (linear, band, time, log) | 200 |
| Axis + ticks | 150 |
| Legend | 80 |
| Tooltip | 60 |
| Responsive wrapper | 30 |
| Bar chart (all variants) | 250 |
| Line chart (all variants) | 200 |
| Sparkline | 60 |
| Pie / donut | 150 |
| Gauge | 120 |
| Scatter | 120 |
| Heatmap | 150 |
| Radar | 150 |
| Treemap | 200 |
| Chord | 250 |
| Array image | 120 |
| Theme adapter | 40 |
| Animation CSS | 40 |
| Accessibility helpers | 60 |
| **Total** | **~2,430** |

Plus tests (~1:1 ratio) and documentation.

---

## Open Questions

1. **Repo structure**: Separate repo (`deftio/bitwrench-chart`) or monorepo
   subfolder (`bitwrench/packages/chart`)? Separate repo is simpler; monorepo
   enables shared CI and coordinated releases.

2. **TypeScript**: Ship `.d.ts` type definitions? Yes — many chart library
   users expect TypeScript support. Can be hand-written (not compiled from TS).

3. **Interactive features**: How far to go with tooltips, zoom, pan, brush
   selection? Start minimal (hover tooltips only), add interaction in later
   releases based on demand.

4. **Data transformation**: Should the library include helpers for common
   data ops (group-by, rolling average, bin/histogram)? Or leave that to
   the user? Lean toward leaving it out — the user's data is their business.

5. **Export**: Should charts have a built-in `toSVG()` / `toPNG()` method?
   `bw.html(chart)` already gives SVG string. PNG would need canvas rendering
   (same html2canvas approach as bwserve screenshot). Defer to later.

6. **Monochrome / print mode**: Auto-switch to pattern fills when
   `@media print` or `prefers-color-scheme: no-preference`? Nice to have,
   defer to v1.0.

---

## Prior Art

Studied for API design (not to copy):

| Library | Size | Approach | What to learn |
|---------|------|----------|---------------|
| Chart.js | 200KB | Canvas | API ergonomics, good defaults |
| D3 | 80KB | SVG + functional | Scale/axis design, layout algorithms |
| Vega-Lite | 400KB | Declarative grammar | Config-over-code pattern |
| uPlot | 35KB | Canvas | Performance at scale |
| Frappe Charts | 40KB | SVG | Clean API for common charts |

bitwrench-chart is closest to Frappe Charts in spirit (SVG, clean API,
focused scope) but with TACO integration and no runtime dependencies.
