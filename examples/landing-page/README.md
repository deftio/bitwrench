# Landing Page (SunForge Analytics)

A polished marketing page built entirely with BCCL component composition — no reactive state.

## What This Demonstrates

- `bw.makeNavbar()`, `bw.makeHero()`, `bw.makeSection()` for page structure
- `bw.makeFeatureGrid()` for feature showcase
- `bw.makeStatCard()` for social proof metrics
- `bw.makeAccordion()` for FAQ section
- `bw.makeForm()` / `bw.makeFormGroup()` for contact form
- `bw.makeButton()` with multiple variants and sizes
- Level 0 — zero reactive state, pure component composition

## Audience

**Beginner** — Demonstrates that bitwrench can produce professional marketing pages with zero custom state management.

## Theme

**Sunrise** — `#ea580c` (orange), `#dc2626` (red), `#f59e0b` (amber). Warm, energetic palette that feels distinct from the teal documentation site.

## How to Run

Open `index.html` in any browser. No build step, no server required.

```
open examples/landing-page/index.html
```

## Architecture

Pure TACO composition — each section is a variable (`nav`, `hero`, `stats`, `features`, `pricing`, etc.) mounted in a single `bw.DOM('#app', ...)` call. No timers, no pub/sub, no component handles.

## Key Patterns to Study

1. **BCCL composition**: The entire page is built from `bw.make*()` factory calls
2. **Theme independence**: Sunset orange palette proves bitwrench isn't "always teal"
3. **Custom CSS + BCCL**: Pricing table uses custom CSS classes alongside BCCL components
4. **Zero state**: Level 0 architecture — if it doesn't need reactivity, don't add it
