# bw-perf-analysis: Fair Framework Performance Comparison

## Purpose

A standalone repo (`bw-perf-analysis`) that builds real, identical applications in each framework using each framework's actual toolchain. No simulations. Each framework gets its own folder, its own build step, and its own bundled output. The benchmarks measure two distinct things:

1. **Tooling time** — how long does it take to go from source to runnable output?
2. **Runtime performance** — how fast does the app render/update in the browser?

These are fundamentally different costs paid at different times, and conflating them is what makes most framework benchmarks misleading.

## Frameworks to Include

| Framework | Version | Build tool | Notes |
|-----------|---------|------------|-------|
| Vanilla JS | n/a | None | Baseline. No build step. |
| Bitwrench | 2.x | None (or Rollup for UMD) | Zero-build by design |
| React | 18+ | Vite | JSX transform, development vs production mode |
| Vue | 3.x | Vite | SFC compilation (.vue files) |
| Svelte | 5.x | Vite + svelte plugin | Compile-time framework |
| SolidJS | 1.x | Vite + solid plugin | Compile-time, fine-grained |
| Preact | 10.x | Vite | Lightweight React alternative |
| Lit | 3.x | None (or Rollup) | Web Components, tagged templates |

Optional later additions: Angular, Alpine.js, HTMX, Stencil.

## Repo Structure

```
bw-perf-analysis/
├── README.md
├── package.json              # workspace root (pnpm workspaces)
├── benchmarks/
│   ├── config.json           # shared params (item counts, iterations)
│   ├── runner.js             # Playwright-based benchmark harness
│   └── results/              # JSON output from runs
│       ├── 2026-03-07_macbook-m1.json
│       └── ...
├── apps/
│   ├── vanilla/
│   │   ├── index.html
│   │   └── app.js
│   ├── bitwrench/
│   │   ├── index.html
│   │   └── app.js
│   ├── react/
│   │   ├── package.json
│   │   ├── vite.config.js
│   │   ├── src/
│   │   │   ├── App.jsx
│   │   │   └── components/   # one file per benchmark component
│   │   └── dist/             # build output (gitignored)
│   ├── vue/
│   │   ├── package.json
│   │   ├── vite.config.js
│   │   └── src/
│   │       ├── App.vue
│   │       └── components/
│   ├── svelte/
│   ├── solid/
│   ├── preact/
│   └── lit/
├── reports/
│   ├── generate-report.js    # reads results JSON, outputs markdown + charts
│   └── latest.md             # auto-generated comparison report
└── tools/
    ├── build-all.sh          # builds every app, records timings
    ├── serve-all.js          # serves each app on a different port
    └── measure-bundles.js    # records bundle sizes (raw, gzip, brotli)
```

## Benchmark Scenarios

Each app implements the exact same 5 scenarios. The UI output must be visually identical across frameworks.

### Scenario 1: Flat List Render
- Render N items (badges/spans) into a container
- Measures: initial mount throughput
- Sizes: 100, 1000, 5000, 10000

### Scenario 2: Table Render
- Render a table with N rows, 5 columns (id, name, value, status, action button)
- Measures: structured/nested element creation
- Sizes: 100, 500, 1000, 5000

### Scenario 3: Partial Update
- Render N items, then update every 10th item's text
- Measures: reconciliation / surgical update efficiency
- This is where compiled frameworks should pull ahead

### Scenario 4: Component Creation
- Create N independent counter components (label + value + increment button)
- Each counter has its own state, click handler
- Measures: component instantiation + event wiring overhead

### Scenario 5: Swap Rows
- Render 1000 rows, then swap row 1 and row 998
- Classic js-framework-benchmark test
- Measures: keyed list reconciliation

### Scenario 6 (optional): Large Form
- Render a form with N fields (inputs, selects, checkboxes)
- Each field has validation, onChange handler
- Measures: realistic application complexity

## What to Measure

### A. Tooling / Build Time

Measured via `build-all.sh`:

| Metric | How | Notes |
|--------|-----|-------|
| Cold build time | `time npm run build` (fresh, no cache) | Most relevant for CI/CD |
| Warm build time | `time npm run build` (second run, caches hot) | Dev experience |
| Dev server startup | Time to first request served | DX metric |
| Bundle size (raw) | `wc -c dist/*.js` | Total JS shipped |
| Bundle size (gzip) | `gzip -c dist/*.js \| wc -c` | Network transfer |
| Bundle size (brotli) | `brotli -c dist/*.js \| wc -c` | Modern CDN transfer |
| Dependency count | `npm ls --all \| wc -l` | Supply chain surface |
| node_modules size | `du -sh node_modules` | Disk footprint |

For vanilla and bitwrench, most of these are zero or trivial — that's the point.

### B. Runtime Performance

Measured via Playwright in each app's built output:

| Metric | How | Notes |
|--------|-----|-------|
| Time to first render | `performance.mark()` around mount | Cold start |
| Re-render time | `performance.mark()` around update | Warm path |
| Memory (heap) | `performance.measureUserAgentSpecificMemory()` | After render |
| DOM node count | `document.querySelectorAll('*').length` | Overhead check |
| Layout/paint time | PerformanceObserver `'layout-shift'`, `'largest-contentful-paint'` | Browser-level |
| Interaction latency | Time from click to DOM update visible | User-perceived |

### C. Developer Experience (qualitative, in report)

- Lines of code per scenario (raw count)
- Number of files touched
- Concepts required (JSX, signals, stores, compilers, etc.)
- Error message quality when something breaks
- Debugging story (can you inspect state in devtools?)

## Measurement Harness

### build-all.sh
```bash
#!/bin/bash
# For each app in apps/*, run its build and record timing
for app in apps/*/; do
  name=$(basename "$app")
  echo "Building $name..."

  # Record cold build
  rm -rf "$app/dist" "$app/node_modules/.cache"
  cold_start=$(date +%s%N)
  (cd "$app" && npm run build 2>&1) > "benchmarks/results/${name}_build.log"
  cold_end=$(date +%s%N)
  cold_ms=$(( (cold_end - cold_start) / 1000000 ))

  # Record warm build
  warm_start=$(date +%s%N)
  (cd "$app" && npm run build 2>&1) > /dev/null
  warm_end=$(date +%s%N)
  warm_ms=$(( (warm_end - warm_start) / 1000000 ))

  # Bundle size
  raw=$(find "$app/dist" -name '*.js' -exec cat {} + | wc -c)
  gzip=$(find "$app/dist" -name '*.js' -exec cat {} + | gzip -c | wc -c)

  echo "$name: cold=${cold_ms}ms warm=${warm_ms}ms raw=${raw}b gzip=${gzip}b"
done
```

### runner.js (Playwright-based)
```js
// For each app, for each scenario, for each item count:
// 1. Navigate to app's built page
// 2. Set item count via URL param or UI control
// 3. Call performance.mark('start') via page.evaluate
// 4. Trigger the render (click button or call function)
// 5. Call performance.mark('end') and measure
// 6. Repeat N iterations, record times array
// 7. Write results to JSON
```

Key: all measurements happen inside the browser via `page.evaluate()`. Playwright is just the automation layer — it doesn't affect the timing.

## Fairness Rules

1. **Each framework uses its recommended toolchain.** React uses Vite (not CRA), Svelte uses SvelteKit's Vite plugin, etc. No handicapping by using suboptimal configs.

2. **Production builds only for runtime benchmarks.** Dev mode has extra checks (React strict mode, Vue warnings) that aren't representative.

3. **Same HTML output.** Each scenario must produce the same DOM structure. Verify with a snapshot comparison tool.

4. **Same browser, same machine, same conditions.** All runtime benchmarks run in the same Playwright Chromium instance, sequentially, with a cooldown between tests.

5. **No cherry-picking.** Report all metrics, including ones where bitwrench loses. The point is understanding tradeoffs, not declaring winners.

6. **Reproducible.** Anyone can clone the repo, run `npm run benchmark`, and get their own numbers. Results include machine info (OS, CPU, RAM, Node version, browser version).

7. **Version-pinned.** Lock framework versions in package.json. Results are only valid for the versions tested.

## Expected Findings (Hypotheses)

| Dimension | Expected winner | Why |
|-----------|----------------|-----|
| Build time | Vanilla, Bitwrench | Zero build step |
| Bundle size | Vanilla, Bitwrench, Lit | No framework runtime |
| Initial render (small N) | All similar | DOM is the bottleneck |
| Initial render (large N) | Svelte, SolidJS | Compiled output eliminates runtime overhead |
| Partial update | SolidJS | Fine-grained signals skip diffing |
| Swap rows | SolidJS, Svelte | Keyed reconciliation is their strength |
| Component creation | Vanilla, Bitwrench | No component registration overhead |
| Memory | Vanilla, Lit | Minimal per-component bookkeeping |
| node_modules | Vanilla, Bitwrench | Zero or near-zero deps |
| LOC (simplicity) | Svelte, Bitwrench | Both minimize boilerplate |

Bitwrench's sweet spot is likely: **fast enough runtime + zero build + small bundle + simple mental model**. It won't beat compiled frameworks on large-scale updates, but it doesn't need to — its value proposition is eliminating the toolchain, not winning benchmarks.

## Report Format

`reports/latest.md` auto-generated with:

- Machine specs (CPU, RAM, OS, Node, browser)
- Framework versions tested
- Build time comparison (table + bar chart)
- Bundle size comparison (table + bar chart)
- Runtime results per scenario (tables, one per scenario)
- Overall summary with commentary on tradeoffs
- Methodology section explaining the harness

Charts generated as SVG (no external deps) or ASCII art for terminal readability.

## Implementation Order

1. **Scaffold repo** — workspace setup, directory structure, config.json
2. **Vanilla + Bitwrench apps** — implement all 5 scenarios (baseline)
3. **Playwright harness** — automated measurement, JSON output
4. **React + Vue apps** — the two most popular frameworks
5. **Svelte + SolidJS apps** — the compiled frameworks (this is where it gets interesting)
6. **Build timing script** — cold/warm build, bundle sizes
7. **Report generator** — markdown + charts from JSON results
8. **Preact + Lit** — lightweight alternatives
9. **CI integration** — run benchmarks on GitHub Actions, publish results
10. **Blog post / writeup** — interpret results, discuss tradeoffs honestly
