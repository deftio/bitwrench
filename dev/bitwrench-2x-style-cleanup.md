# Bitwrench 2.x — Styling Architecture & Cleanup

**Status:** Design discussion
**Author:** Manu Chatterjee / Claude
**Date:** March 2026

## 1. The Problem

Bitwrench has powerful style capabilities scattered across several patterns, but the developer experience doesn't build up cleanly. A new developer asks: "How do I style things?" and gets several answers at once (bitwrench.css, bw.css(), bw.s(), bw.u, inline styles, computed classes) without understanding when to use which, or how they connect.

The goal of this document is to define a **single mental model** for bitwrench styling — a progression from simple to advanced — and identify the library changes needed to make that model clean and automatic.

## 2. Design Principles

1. **Bitwrench is CSS-agnostic.** It generates DOM elements with `class` and `style` attributes. Any CSS source works: your own files, Bootstrap, Tailwind, bitwrench.css, or nothing at all.

2. **Styles are data.** Because styles are JavaScript objects (not template strings or class name conventions), they are composable, computable, serializable, and automatable. This is bitwrench's structural advantage over class-string frameworks.

3. **Progressive complexity.** Each level adds power, and the developer understands *why* they need the next level because they've hit the limit of the previous one.

4. **Automation-friendly.** Because TACO objects are plain JS/JSON, a server, script, or AI can generate, modify, and optimize styled UI without parsing HTML/CSS. This is significantly harder with JSX, template strings, or CSS-in-JS solutions that are coupled to a specific runtime.

## 3. The Styling Ladder

### Level 0: External CSS File (Bring Your Own)

The developer already has CSS — their own, Bootstrap, Tailwind, a corporate stylesheet. Bitwrench doesn't interfere. You just set the `class` attribute:

```javascript
{ t: 'div', a: { class: 'my-app-card shadow-lg' }, c: 'Hello' }
```

**What this teaches:** Bitwrench doesn't own your CSS. It sets attributes. Done.

**Limit:** You need to maintain a separate CSS file. Class names are just strings — no tooling, no validation.

### Level 1: Computed Classes (Classes Are Just Strings)

Since `class` is a string (or array), you can compute it with JavaScript:

```javascript
var variant = 'success';
{ t: 'div', a: { class: 'bw-alert bw-alert-' + variant }, c: 'Dynamic!' }

// Array form (falsy values filtered out)
{ t: 'div', a: { class: ['bw-card', isActive && 'bw-active', size === 'lg' && 'bw-card-lg'] }, c: '...' }
```

**What this teaches:** No template directives needed. JavaScript IS the directive system — ternary replaces `v-if:class`, `.map()` replaces `v-for`, string concat replaces class binding DSLs.

**Limit:** You still need a CSS file somewhere. The class names are conventions, not enforced.

### Level 2: bitwrench.css (Batteries Included)

Bitwrench ships ~22 component styles (buttons, cards, tables, forms, alerts, badges, tabs, grid, etc.). Two ways to load them:

```html
<link href="bitwrench.css" rel="stylesheet">
```
```javascript
bw.loadDefaultStyles();  // generates the same CSS from JS at runtime
```

Both produce the same `bw-btn`, `bw-card`, `bw-table` classes. This is a **convenience starter kit** — designed so an embedded dev or Python backend dev picks 3-5 colors and gets a reasonable-looking app without being a CSS expert.

**What this teaches:** bitwrench.css is one option. It uses the `bw-` prefix to avoid collisions. You can use it alongside your own CSS, or not at all.

**Limit:** You can't express `:hover`, `:focus`, media queries, or dynamic/conditional styles with just class names and a static file.

**Future work (separate doc):** Make `bw.loadDefaultStyles()` palette-driven. Developer passes `{ primary: '#006666', accent: '#ff9900' }`, gets all component styles derived from those colors. Current implementation requires the full theme object.

### Level 3: Inline Style Objects (No CSS File Needed)

Bitwrench TACO's `a.style` accepts objects, not just strings:

```javascript
{ t: 'div', a: { style: { background: '#006666', color: '#fff', padding: '1rem' } }, c: 'Styled!' }
```

`bw.s()` merges multiple style objects (like `Object.assign` but filters null/undefined):

```javascript
{ t: 'div', a: { style: bw.s(bw.u.flex, bw.u.gap4, bw.u.p4, { background: accent }) }, c: '...' }
```

`bw.u` provides ~50 pre-built utility objects:

```javascript
bw.u.flex       // { display: 'flex' }
bw.u.gap4       // { gap: '1rem' }
bw.u.p4         // { padding: '1rem' }
bw.u.bgTeal     // { background: '#006666', color: '#ffffff' }
bw.u.rounded    // { borderRadius: '0.375rem' }
bw.u.textCenter // { textAlign: 'center' }
```

**Why CSS variables aren't needed:**

```javascript
// CSS approach: define in :root, reference with var()
// :root { --accent: #006666; }
// .card { background: var(--accent); }

// bitwrench approach: it's just a JS variable
var accent = '#006666';
{ t: 'div', a: { style: { background: accent } }, c: '...' }

// Conditional? Ternary.
{ style: { background: isDark ? '#333' : '#fff' } }
```

**What this teaches:** Style objects are composable data. `bw.s()` is `Object.assign` for styles. JS variables replace CSS variables. Ternary replaces `@media prefers-color-scheme`. No CSS file needed for simple/medium apps.

**Limit:** Inline styles can't express `:hover`, `:focus`, `::before`, `@media`, `@keyframes`. If you need those, you need real CSS rules.

### Level 4: Generated CSS (bw.css + bw.injectCSS)

For pseudo-classes, pseudo-elements, and media queries, generate CSS at runtime:

```javascript
bw.injectCSS(bw.css({
  '.my-btn': bw.s(bw.u.bgTeal, bw.u.p3, bw.u.rounded, { cursor: 'pointer', border: 'none' }),
  '.my-btn:hover': { background: '#004d4d', transform: 'translateY(-1px)' }
}));
```

`bw.css()` converts JS objects to CSS strings. `bw.injectCSS()` creates a `<style>` element in the document head.

**Responsive shorthand:**

```javascript
bw.injectCSS(bw.responsive('.card', {
  base: bw.s(bw.u.p2, { background: '#eee' }),
  md:   bw.s(bw.u.p4, { background: '#cde' }),
  lg:   bw.s(bw.u.p8, { background: '#ade' })
}));
```

**What this teaches:** `bw.css()` turns `{ '.selector': { prop: 'val' } }` into `.selector { prop: val; }`. You write styles as data, bitwrench handles the CSS syntax. Same JS variable interpolation works here.

**Limit:** You have to manually call `bw.css()` and `bw.injectCSS()`. If you're mixing utility classes with generated CSS, there's friction.

### Level 5: Utility Class Compilation (PROPOSED)

**This is where bitwrench could do something unique.**

The idea: write Tailwind-style utility strings in the `class` attribute, and bitwrench compiles them to real CSS at render time. No Tailwind build pipeline, no PostCSS, no purging — just JavaScript string processing.

```javascript
{ t: 'div', a: { class: 'flex gap-4 p-4 bg-teal rounded hover:bg-dark' }, c: '...' }
```

Bitwrench scans the class list, recognizes utility patterns, generates the corresponding CSS, injects it, and leaves the class names on the element.

#### 5a. How It Could Work

**Option A: Per-element opt-in via `o`**

```javascript
{
  t: 'div',
  a: { class: 'flex gap-4 p-4 bg-teal hover:shadow-lg' },
  c: 'Hello',
  o: { compileCSS: true }
}
```

When `bw.createDOM()` or `bw.html()` encounters `o.compileCSS`, it:
1. Scans the `class` string for known utility patterns
2. Generates CSS rules (including pseudo-class variants like `hover:`)
3. Injects them once (deduped by class name)
4. Leaves the class names on the element as-is

**Option B: Global default**

```javascript
bw.config({ compileUtilityCSS: true });
// Now ALL TACO objects with utility classes get compiled automatically
```

**Option C: Explicit compile function**

```javascript
// Compile utility string to CSS, inject it, return the class string unchanged
bw.compile('flex gap-4 p-4 bg-teal hover:bg-dark');
// Injects: .flex { display: flex } .gap-4 { gap: 1rem } ... .hover\:bg-dark:hover { background: #333 }
// Returns: 'flex gap-4 p-4 bg-teal hover:bg-dark'
```

This could be called once at app init for known utilities, or lazily per element.

#### 5b. Utility Recognition

The compiler needs a registry mapping class names to CSS properties:

```javascript
bw._utilityRegistry = {
  // Display
  'flex':        { display: 'flex' },
  'block':       { display: 'block' },
  'hidden':      { display: 'none' },
  'grid':        { display: 'grid' },

  // Flex
  'flex-col':    { flexDirection: 'column' },
  'flex-row':    { flexDirection: 'row' },
  'flex-wrap':   { flexWrap: 'wrap' },
  'items-center': { alignItems: 'center' },
  'justify-between': { justifyContent: 'space-between' },

  // Spacing (t-shirt sizes or numeric scale)
  'p-1': { padding: '0.25rem' }, 'p-2': { padding: '0.5rem' },
  'p-4': { padding: '1rem' },   'p-8': { padding: '2rem' },
  'gap-2': { gap: '0.5rem' },   'gap-4': { gap: '1rem' },
  // ... etc

  // Colors (from theme)
  'bg-teal':    { background: '#006666' },
  'text-white': { color: '#fff' },
  // ... derived from bw.getTheme()

  // Borders
  'rounded':    { borderRadius: '0.375rem' },
  'rounded-lg': { borderRadius: '0.5rem' },
  'border':     { border: '1px solid #d8d8d8' },

  // Typography
  'text-sm':    { fontSize: '0.875rem' },
  'text-lg':    { fontSize: '1.125rem' },
  'font-bold':  { fontWeight: '700' },
  'text-center': { textAlign: 'center' },
};
```

**Variant prefixes** (parsed by splitting on `:`):
- `hover:bg-dark` → `.hover\:bg-dark:hover { background: #333 }`
- `focus:border-teal` → `.focus\:border-teal:focus { border-color: #006666 }`
- `md:p-8` → `@media (min-width: 768px) { .md\:p-8 { padding: 2rem } }`
- `dark:bg-dark` → `.bw-dark .dark\:bg-dark { background: #333 }`

**Deduplication:** A `Set` tracks which classes have already been compiled. Each class is compiled at most once per page lifecycle.

#### 5c. Relationship to bw.u

`bw.u` is for inline style objects (Level 3). The utility class compiler is for class strings (Level 5). They share the same design tokens but serve different use cases:

| | bw.u (inline) | Utility classes (compiled) |
|---|---|---|
| Format | JS objects | CSS class strings |
| Supports :hover | No | Yes (via prefix) |
| Supports @media | No | Yes (via prefix) |
| Composable in JS | Yes (bw.s()) | Yes (string concat) |
| Server-renderable | Yes (inline style attr) | Yes (class attr + CSS block) |
| Automatable | Very (it's data) | Yes (it's strings) |

Both are valid. The developer picks based on whether they need pseudo-classes.

#### 5d. Advantages Over Tailwind

1. **No build step.** No PostCSS, no purging, no config file. Just `<script src="bitwrench.js">`.
2. **Runtime-extensible.** Add custom utilities at runtime: `bw.addUtility('bg-brand', { background: myBrandColor })`. Try doing that with Tailwind.
3. **Theme-aware.** Utilities auto-derive from `bw.getTheme()`. Change the theme, utilities update.
4. **Server-driven.** A Python/Go backend can emit `{ class: 'flex p-4 bg-teal' }` as JSON. The browser compiles it. No build pipeline on the server.
5. **Inspectable.** The generated CSS is in a `<style>` tag you can see in DevTools. No source maps needed.

**Where Tailwind still wins:**
- IDE autocomplete (VS Code extension with class name suggestions)
- Tree-shaking (only ships CSS for used classes — ours generates on demand, so no unused CSS anyway)
- Community ecosystem (plugins, component libraries)
- Build-time optimization (our compilation is fast but happens at runtime)

### Level 6: Stylesheet Swapping (Advanced)

Because `bw.injectCSS()` accepts an `id` option, you can replace entire stylesheets:

```javascript
// Create a named stylesheet
bw.injectCSS(bw.css(lightThemeRules), { id: 'app-theme' });

// Later, swap it entirely
bw.injectCSS(bw.css(darkThemeRules), { id: 'app-theme' });
// The old <style id="app-theme"> is replaced, not appended
```

**With UUIDs for scoping:**

```javascript
var widgetId = bw.uuid('widget');

// Widget-scoped styles
bw.injectCSS(bw.css({
  ['.' + widgetId + ' .header']: { background: brandColor },
  ['.' + widgetId + ' .header:hover']: { background: darken(brandColor) }
}), { id: widgetId + '-styles' });

// Later, hot-swap the widget's entire style sheet
bw.injectCSS(bw.css(newStyles), { id: widgetId + '-styles' });
```

**What this teaches:** Style sheets are DOM elements. If you can name them, you can swap them. This enables runtime theme switching, per-component style isolation, and server-driven style updates.

**Automation angle:** A server can push a new stylesheet via SSE/WebSocket:
```javascript
bw.on('style-update', function(e) {
  bw.injectCSS(bw.css(e.detail.rules), { id: e.detail.sheetId });
});
```

## 4. The Automation Advantage

This is bitwrench's deepest structural advantage and deserves its own section.

**In other frameworks**, styling is embedded in templates (JSX className strings, Vue :class bindings, Svelte class: directives). To programmatically generate or modify styled UI, you need to:
1. Parse the template language
2. Understand the class naming conventions
3. Generate valid template syntax
4. Hope the build pipeline handles it

**In bitwrench**, styled UI is a JavaScript object:

```javascript
var styledCard = {
  t: 'div',
  a: {
    class: 'bw-card',
    style: bw.s(bw.u.p4, { borderLeft: '4px solid ' + statusColor })
  },
  c: [
    { t: 'h3', a: { style: { color: headerColor } }, c: title },
    { t: 'p', c: body }
  ]
};
```

This object can be:
- **Generated** by a server (Python dict → JSON → TACO)
- **Modified** by a script (`card.a.style.borderColor = 'red'`)
- **Serialized** to JSON and stored/transmitted
- **Diffed** against another object to detect style changes
- **Validated** with a schema (does this TACO have the required classes?)
- **Transformed** programmatically (add dark mode overrides to every card)

A practical example — automated style transformation:

```javascript
// Walk a TACO tree and add dark mode overrides
function addDarkMode(taco) {
  if (taco.a && taco.a.style && taco.a.style.background === '#fff') {
    taco.a.style.background = isDark ? '#1a1a1a' : '#fff';
    taco.a.style.color = isDark ? '#e0e0e0' : '#1a1a1a';
  }
  if (Array.isArray(taco.c)) {
    taco.c.forEach(addDarkMode);
  }
  return taco;
}
```

Try doing that with JSX. You'd need to parse React components, understand className semantics, and hope you don't break anything. With TACO, it's a tree walk over plain objects.

## 5. Existing Code Inventory

### What We Have (v2.0.x)

| Function | Location | Lines | Status |
|----------|----------|-------|--------|
| `bw.css(rules, opts)` | bitwrench_v2.js:891 | ~40 | Working, handles nested rules, camelCase→kebab |
| `bw.injectCSS(css, opts)` | bitwrench_v2.js:931 | ~35 | Working, supports id-based replacement |
| `bw.s(...styles)` | bitwrench_v2.js:968 | ~10 | Working, merges style objects |
| `bw.u` | bitwrench_v2.js:981 | ~85 | Working, ~50 utility objects |
| `bw.responsive(sel, bp)` | bitwrench_v2.js:1068 | ~25 | Working, sm/md/lg/xl breakpoints |
| `bw.loadDefaultStyles()` | bitwrench_v2.js:1169 | ~10 | Working, loads from getAllStyles() |
| `bw.setTheme(overrides)` | bitwrench_v2.js:1190 | ~20 | Working, injects --bw-* CSS vars |
| `bw.toggleDarkMode()` | bitwrench_v2.js:1211 | ~30 | Working, class toggle + CSS inject |
| `bw.normalizeClass()` | bitwrench_v2.js:173 | ~10 | Working, bw_ → bw- conversion |
| `getAllStyles()` | bitwrench-styles.js | ~1750 | Working, 22 component categories |
| `addUnderscoreAliases()` | bitwrench-styles.js:1736 | ~12 | Working, dual bw-/bw_ selectors |

### Style Processing in bw.html() / bw.createDOM()

- `a.style` as **object** → converted to CSS string (bw.html) or `Object.assign(el.style, ...)` (bw.createDOM)
- `a.class` as **string** → passed through `bw.normalizeClass()`
- `a.class` as **array** → filtered, joined, normalized

### What's Missing

1. **Utility class compilation** (Level 5) — the `bw.compile()` function and registry
2. **`o.compileCSS` flag** — per-element opt-in for utility compilation
3. **`bw.config({ compileUtilityCSS: true })`** — global opt-in
4. **Palette-driven `loadDefaultStyles()`** — accepts 3-5 colors, derives everything else
5. **`bw.addUtility(name, styles)`** — register custom utilities at runtime

## 6. Implementation Plan

### Phase A: Documentation & Examples (Current)
- Fix 03-styling.html cosmetic issues (heading, padding)
- Restructure page to follow the Styling Ladder progression
- Show each level with working try-it editors

### Phase B: Palette-Driven Default Styles
- `bw.loadDefaultStyles({ primary: '#006666', accent: '#ff9900' })`
- Derive secondary, success, danger, warning, info from primary via color math
- Keep full override available for power users
- Work in `src/bitwrench-styles.js`

### Phase C: Utility Class Compilation
- Implement `bw.compile(classString)` — parse, generate CSS, inject, return string
- Implement utility registry with ~80 base utilities
- Support variant prefixes: `hover:`, `focus:`, `md:`, `lg:`, `dark:`
- Implement `bw.addUtility(name, styles)` for custom utilities
- Wire into `bw.createDOM()` via `o.compileCSS` flag
- Add `bw.config({ compileUtilityCSS: true })` for global default

### Phase D: Stylesheet Management
- Document the `bw.injectCSS({ id })` pattern for named stylesheets
- Add `bw.removeCSS(id)` for explicit cleanup
- Consider `bw.listCSS()` for debugging (returns all injected sheet IDs)

### Phase E: Modernize Existing CSS Functions
- Audit `bw.css()` for edge cases (nested @media, @keyframes)
- Audit `adjustColor()` (currently in example pages, should be in core as `bw.colorAdjust()`)
- Consider `bw.colorScale(base, steps)` for generating palettes from a single color
- Make `bw.u` theme-aware (utilities reference theme tokens, not hardcoded values)

## 7. Developer Mental Model (Summary)

```
"How do I style this?"

├── Got a CSS file? → Use class: 'your-class'          (Level 0)
├── Need dynamic classes? → Compute with JS             (Level 1)
├── Want batteries included? → bw.loadDefaultStyles()   (Level 2)
├── Want zero CSS files? → bw.s(bw.u.flex, bw.u.p4)    (Level 3)
├── Need :hover or @media? → bw.css() + bw.injectCSS() (Level 4)
├── Want Tailwind-style? → bw.compile('flex p-4')       (Level 5)
└── Need theme swapping? → bw.injectCSS({id: 'theme'}) (Level 6)

Mix any combination. They all produce class/style attributes on DOM elements.
```

## 8. Open Questions

1. **Should utility compilation be on by default?** Pro: feels magic, zero setup. Con: processing cost on every render, potential class name collisions with user's own CSS.

2. **Should `bw.u` properties match Tailwind naming?** (`bw.u.flex` vs Tailwind's `flex`, `bw.u.p4` vs `p-4`). Currently they use camelCase (`bw.u.flexCol`). The compiled utility classes would use kebab-case (`flex-col`). Is this confusing or natural?

3. **How aggressive should palette derivation be?** Given `primary: '#006666'`, should `loadDefaultStyles()` auto-generate success (green-ish), danger (red-ish), warning (yellow-ish)? Or should those always be explicit?

4. **Should `bw.css()` support nesting?** Currently flat: `{ '.parent .child': { ... } }`. SASS-style nesting (`{ '.parent': { '.child': { ... } } }`) would be natural for JS objects but adds complexity.

5. **Performance budget for utility compilation.** Compiling 50 utilities on first render: ~1ms (fast). Compiling per-element on a 1000-row table: potentially slow. Should we batch? Lazy-compile on first use? Pre-compile at init?

6. **bw.u should be a function (or function-generated).** Currently `bw.u` is a static object with hardcoded colors (`bgTeal: '#006666'`, `border: '#d8d8d8'`). If `bw.u` were generated by a function that accepts theme colors, it becomes generic and theme-aware. Historical precedent: bw 1.x had `generateTheme()` for this purpose but it wasn't fully fleshed out. The clean v2 approach: `bw.u` is rebuilt whenever theme changes — either as a getter that reads from `bw.getTheme()`, or explicitly via `bw.rebuildUtilities()` after `bw.setTheme()`. Color utilities like `bgPrimary`, `textPrimary`, `borderPrimary` would derive from the active theme rather than being hardcoded to teal.

## 9. Theme Design Notes

### Default Theme: Neutral, Not Branded

The default bitwrench theme should be **plain and neutral** — grays, standard fonts, no strong brand color. The teal (`#006666`) is the bitwrench *brand* color, used on the bitwrench website itself, but most apps don't want teal as their primary. The number of teal-branded production sites in the wild is... low.

**Design rule:** A developer who calls `bw.loadDefaultStyles()` with no arguments should get a clean, professional-looking app that could belong to any brand. Teal is available as a named theme but not the default.

### Theme Structure

Themes are primarily **color changes**, but some themes may also adjust:
- **Padding** (compact theme tightens spacing, spacious theme loosens it)
- **Width** (sidebar width, max-content width)
- **Font** (monospace theme for dashboards, serif theme for reading)
- **Border radius** (sharp corners vs rounded)
- **Shadow** (flat theme removes shadows, elevated theme adds depth)

```javascript
// A theme is an object with color tokens + optional layout overrides
var neutralTheme = {
  // Colors (required)
  primary: '#4a4a4a',
  primaryDark: '#333333',
  accent: '#5b7dbd',
  success: '#4caf50',
  danger: '#e53935',
  warning: '#ff9800',
  info: '#2196f3',
  textPrimary: '#1a1a1a',
  textSecondary: '#666666',
  bg: '#ffffff',
  bgSecondary: '#f5f5f5',
  border: '#d8d8d8',

  // Optional layout overrides
  // borderRadius: '0.375rem',
  // fontFamily: 'system-ui, sans-serif',
  // basePadding: '1rem',
};
```

### Example Themes

```javascript
// Ships with bitwrench:
bw.themes = {
  neutral:  { primary: '#4a4a4a', accent: '#5b7dbd', ... },  // DEFAULT
  teal:     { primary: '#006666', accent: '#ff9900', ... },  // bitwrench brand
  dark:     { primary: '#e0e0e0', bg: '#1a1a1a', ... },      // dark mode base
  ocean:    { primary: '#1565c0', accent: '#00897b', ... },
  warm:     { primary: '#bf360c', accent: '#f57c00', ... },
  compact:  { ...neutral, basePadding: '0.5rem', borderRadius: '0.25rem' },
  spacious: { ...neutral, basePadding: '1.5rem', borderRadius: '0.5rem' },
};

// Usage:
bw.loadDefaultStyles(bw.themes.ocean);
// or
bw.loadDefaultStyles({ primary: '#8b0000' });  // just override one color
```

### Theme Cascade

When a developer passes partial overrides, the theme system should:
1. Start from the neutral (default) theme
2. Apply overrides via `Object.assign`
3. Auto-derive missing tokens where possible (e.g., `primaryDark` from `primary` via `bw.colorAdjust()`)
4. Rebuild `bw.u` color utilities from the active theme
5. Regenerate `bw-btn`, `bw-card`, etc. CSS with new colors
