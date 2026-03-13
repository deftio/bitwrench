# Bitwrench CSS — Feature Request: Design Tokens & Utility Classes

Found while building [LiquidUI](../bitwrench-feedback.md): a bwserve-powered app where all styling was done via `bw.css()` + `bw.injectCSS()` instead of external CSS frameworks.

---

## Context: What works today

`bw.css()` and `bw.injectCSS()` together already provide a compelling CSS authoring experience:

```js
bw.injectCSS(bw.css({
  '.my-layout': { display: 'flex', gap: '8px', padding: '16px' },
  '.my-card':   { border: '1px solid #ddd', borderRadius: '8px' }
}));
```

This is **CSS-in-JS without the JS framework**:
- Object syntax (autocomplete-friendly, composable, no string escaping)
- Runtime injection (no build step, no CSS modules, no PostCSS)
- Plain CSS output (no vendor lock-in, no className mangling)
- Works naturally with SSE-driven UI (inject styles before rendering content)
- camelCase property names auto-convert to kebab-case

The existing `bw_btn` and `bw_badge` utility classes also show the right direction — ship composable classes that handle common patterns so developers don't have to write raw CSS for every button.

This is a genuinely differentiated story: **"You don't need Tailwind, Sass, or CSS modules. Write CSS as objects, inject at runtime. Zero build step, zero config."**

---

## Feature Request 1: Design tokens / theme object

### Problem

Tailwind's real value isn't the syntax — it's the pre-built **design vocabulary**: a spacing scale, color palette, typography scale, and responsive breakpoints that enforce consistency. `bw.css()` gives you the mechanism but not the vocabulary. Every developer has to invent their own `'8px'` vs `'12px'` vs `'16px'` decisions.

### Suggestion

Ship a `bw.theme` or `bw.tokens` object with sensible defaults:

```js
// Spacing scale
bw.tokens.space.xs   // '4px'
bw.tokens.space.sm   // '8px'
bw.tokens.space.md   // '16px'
bw.tokens.space.lg   // '24px'
bw.tokens.space.xl   // '32px'

// Color palette
bw.tokens.color.gray[100]  // '#f3f4f6'
bw.tokens.color.gray[500]  // '#6b7280'
bw.tokens.color.gray[900]  // '#111827'
bw.tokens.color.blue[500]  // '#3b82f6'
bw.tokens.color.red[500]   // '#ef4444'
bw.tokens.color.green[500] // '#22c55e'

// Typography
bw.tokens.font.sm    // '0.875rem'
bw.tokens.font.base  // '1rem'
bw.tokens.font.lg    // '1.25rem'
bw.tokens.font.mono  // "'Menlo', 'Monaco', monospace"

// Borders & radii
bw.tokens.radius.sm  // '4px'
bw.tokens.radius.md  // '8px'
bw.tokens.radius.lg  // '16px'
bw.tokens.radius.full // '9999px'
```

Usage with `bw.css()`:
```js
bw.injectCSS(bw.css({
  '.card': {
    padding: bw.tokens.space.md,
    borderRadius: bw.tokens.radius.md,
    border: '1px solid ' + bw.tokens.color.gray[200],
    fontSize: bw.tokens.font.base
  }
}));
```

This keeps the zero-build philosophy — tokens are just JS objects. Developers can override them (`bw.tokens.color.blue[500] = '#custom'`) or ignore them entirely. But having sensible defaults means apps built with bitwrench will have consistent visual rhythm without reaching for Tailwind.

---

## Feature Request 2: More utility classes

### Problem

`bw_btn` and `bw_badge` are useful but there are only two. The most common CSS patterns (flex layouts, grids, padding, margins, text alignment) still require writing raw `bw.css()` or inline styles.

### Suggestion

Ship a small set of layout and spacing utility classes that cover the 80% case:

```css
/* Layout */
.bw_flex      { display: flex; }
.bw_flex_col  { display: flex; flex-direction: column; }
.bw_grid      { display: grid; }
.bw_center    { display: flex; align-items: center; justify-content: center; }

/* Spacing (using the token scale) */
.bw_gap_sm    { gap: 8px; }
.bw_gap_md    { gap: 16px; }
.bw_pad_sm    { padding: 8px; }
.bw_pad_md    { padding: 16px; }

/* Sizing */
.bw_full      { width: 100%; height: 100%; }
.bw_w_full    { width: 100%; }

/* Text */
.bw_text_sm   { font-size: 0.875rem; }
.bw_text_mono { font-family: 'Menlo', 'Monaco', monospace; }
.bw_text_muted { color: #6b7280; }

/* Overflow */
.bw_scroll    { overflow: auto; }
.bw_truncate  { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
```

These compose naturally with TACO:
```js
client.render('#app', {
  t: 'div', a: { class: 'bw_flex_col bw_gap_md bw_pad_md' }, c: [
    { t: 'h1', c: 'Dashboard' },
    { t: 'div', a: { class: 'bw_flex bw_gap_sm' }, c: [
      { t: 'button', a: { class: 'bw_btn' }, c: 'Save' },
      { t: 'span', a: { class: 'bw_badge' }, c: 'Draft' }
    ]}
  ]
});
```

The naming convention (`bw_` prefix, snake_case) is consistent with existing `bw_btn` and `bw_badge`.

**Key principle:** This is NOT trying to be Tailwind. Tailwind has hundreds of classes for every possible CSS property. This is just the top ~20 patterns that every app needs, so developers don't have to write `display: flex; gap: 16px;` over and over.

---

## Feature Request 3: `bw.css()` enhancements

### 3a. Pseudo-class support

**Problem:** Can't express `:hover`, `:focus`, `:active` states in the object format.

**Current workaround:** Write raw CSS strings or use `bw.injectCSS()` with a template literal.

**Suggestion:**
```js
bw.css({
  '.bw_btn': {
    background: '#3b82f6',
    ':hover': { background: '#2563eb' },
    ':active': { background: '#1d4ed8' }
  }
});
```

### 3b. Nested selectors / media queries

**Problem:** Responsive design requires media queries, which don't fit the flat object format.

**Suggestion:**
```js
bw.css({
  '.sidebar': {
    width: '100%',
    '@media (min-width: 768px)': { width: '300px' }
  }
});
```

### 3c. CSS custom properties / variables

**Suggestion:** A helper to generate CSS custom properties from the tokens object:
```js
bw.injectCSS(bw.cssVars(bw.tokens));
// Generates:
// :root { --bw-space-sm: 8px; --bw-space-md: 16px; --bw-color-gray-500: #6b7280; ... }
```

This would let developers use `var(--bw-space-md)` in their own CSS files while keeping the bitwrench token scale as the source of truth.

---

## What this is NOT

This is explicitly **not** a request to turn bitwrench into Tailwind, Sass, or a CSS framework. The asks are:

1. **Design tokens** — a JS object of sensible defaults (spacing, colors, typography). Just data.
2. **~20 utility classes** — the top layout/spacing patterns. Not hundreds.
3. **Object format enhancements** — pseudo-classes, media queries, CSS variables. Making `bw.css()` handle more of real-world CSS.

The philosophy stays the same: write real CSS, but with JS sugar. No build step, no config files, no purge passes, no class name generation. If you know CSS, you know how to use `bw.css()`.
