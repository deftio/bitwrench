# Static Page Example

A complete landing page built with bitwrench — no build step, no framework, just a single HTML file.

## What This Shows

- **Level 0 TACO composition**: Everything is plain `{t, a, c, o}` objects
- **BCCL components**: `makeHero`, `makeFeatureGrid`, `makeCard`, `makeStatCard`, `makeForm`, `makeNavbar`, `makeButton`, `makeAlert`
- **Theme generation**: `bw.generateTheme()` with seed colors
- **Custom CSS**: `bw.css()` + `bw.injectCSS()` for page-specific styles
- **Single mount**: Everything assembled and mounted with one `bw.DOM('#app', ...)`

## Running

Open `index.html` in a browser. That's it.

For local development without CDN, change the script/link tags to point to your local `dist/` directory:

```html
<script src="../../dist/bitwrench.umd.js"></script>
<link rel="stylesheet" href="../../dist/bitwrench.css">
```

## Structure

```
static-page/
  index.html    ← everything in one file (~160 lines of JS)
  README.md     ← this file
```
