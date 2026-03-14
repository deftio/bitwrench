# Basic Landing Page — Zero Custom CSS

A complete marketing landing page built with **zero custom CSS**. No `bw.css()`, no `bw.injectCSS()`, no inline `style:` attributes. Everything comes from:

- `bw.loadDefaultStyles()` — base component styles
- `bw.generateTheme('pulse', { primary: '#4f46e5', secondary: '#d97706' })` — indigo/amber theme
- `bw.make*()` component factories — 18 different components
- Utility classes (`bw_mt_4`, `bw_text_center`, etc.)

## What It Demonstrates

This is the "batteries included" demo. Open it and compare with the Styled Landing Page example (which adds 162 lines of custom CSS) to see what bitwrench delivers out of the box vs. what custom styling adds.

### Components Used (18)

| Component | Usage |
|-----------|-------|
| `makeNavbar` | Top navigation with brand |
| `makeHero` | Full-width hero section |
| `makeAlert` | Info banner |
| `makeRow` | Responsive grid rows |
| `makeCol` | Grid columns |
| `makeStatCard` | 4 metric cards |
| `makeSection` | Section wrappers with titles |
| `makeFeatureGrid` | 6-item feature grid |
| `makeTimeline` | 4-step "How It Works" |
| `makeCard` | Testimonials and pricing |
| `makeListGroup` | Pricing feature lists |
| `makeButton` | CTAs and actions |
| `makeAccordion` | FAQ section |
| `makeCTA` | Call-to-action banner |
| `makeBadge` | (via CTA variant) |
| `makeContainer` | (via Section) |
| `makeStack` | (via internal layout) |

## Running

Open `index.html` in any browser. No build step, no server.

## View Source Challenge

Open this page and hit View Source. Search for `bw.css(`, `bw.injectCSS(`, or `style:` — you won't find any. Every visual element comes from bitwrench's component and theme system.
