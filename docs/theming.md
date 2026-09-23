# Theming

Bitwrench generates CSS at runtime from seed colors. You provide two or three hex colors, and the theme engine derives a complete design system — buttons, cards, alerts, tables, and every other component get consistent, coordinated styling.

There is no CSS preprocessor, no build step, and no external stylesheet to manage. The generated CSS is injected into the document as a `<style>` element.

## Quick start

```javascript
bw.loadStyles({
  primary: '#0077b6',
  secondary: '#90e0ef'
});
```

This single call:

1. Derives a full color palette from your two seed colors (9 color families, 8 shades each)
2. Generates scoped CSS for all bitwrench components
3. Generates an alternate palette (light/dark counterpart)
4. Injects both stylesheets into the document

Every bitwrench component rendered after this call uses the generated theme.

Not using the built-in components? You don't need any of this -- skip to
[Bring your own design](#bring-your-own-design).

## Theme presets

Bitwrench ships with 12 built-in presets:

| Preset | Primary | Secondary | Character |
|--------|---------|-----------|-----------|
| `teal` | `#006666` | `#6c757d` | Default, neutral |
| `ocean` | `#0077b6` | `#90e0ef` | Cool, professional |
| `sunset` | `#e76f51` | `#264653` | Warm, bold |
| `forest` | `#2d6a4f` | `#95d5b2` | Natural, calm |
| `slate` | `#343a40` | `#adb5bd` | Minimal, gray |
| `rose` | `#e11d48` | `#fda4af` | Vibrant, modern |
| `indigo` | `#4f46e5` | `#a5b4fc` | Deep, technical |
| `amber` | `#d97706` | `#fbbf24` | Energetic, warm |
| `emerald` | `#059669` | `#6ee7b7` | Fresh, growth |
| `nord` | `#5e81ac` | `#88c0d0` | Muted, Scandinavian |
| `coral` | `#ef6461` | `#4a7c7e` | Friendly, balanced |
| `midnight` | `#1e3a5f` | `#7c8db5` | Dark, serious |

Use a preset by name:

```javascript
bw.loadStyles(bw.THEME_PRESETS.ocean);
```

Or pass the preset colors directly:

```javascript
bw.loadStyles({
  primary: '#0077b6',
  secondary: '#90e0ef',
  tertiary: '#00b4d8'
});
```

## Configuration options

The full config object:

```javascript
bw.loadStyles({
  // Seed colors (primary and secondary are required)
  primary:   '#0077b6',        // Brand color
  secondary: '#90e0ef',        // Accent color
  tertiary:  '#00b4d8',        // Third accent (defaults to primary)

  // Semantic colors (optional — sensible defaults derived from seeds)
  success:   '#198754',
  danger:    '#dc3545',
  warning:   '#b38600',
  info:      '#0891b2',
  light:     '#f8f9fa',
  dark:      '#212529',

  // Surface colors (optional)
  background: '#ffffff',       // Page background
  surface:    '#f8f9fa',       // Card/panel background

  // Layout tokens
  spacing:   'normal',         // 'compact' | 'normal' | 'spacious'
  radius:    'md',             // 'none' | 'sm' | 'md' | 'lg' | 'pill'

  // Typography
  fontSize:  1.0,              // Base font size scale factor
  typeRatio: 'normal',         // 'tight' | 'normal' | 'relaxed' | 'dramatic'

  // Visual depth
  elevation: 'md',             // 'flat' | 'sm' | 'md' | 'lg'
  motion:    'standard',       // 'reduced' | 'standard' | 'expressive'

  // Color harmonization (0 to 1)
  harmonize: 0.20,             // Shift semantic colors toward primary hue

  // Injection behavior
  inject:    true              // Set to false to get CSS without injecting
});
```

### Spacing presets

Control padding across all components:

| Preset | Button | Card | Alert | Table cell | Input |
|--------|--------|------|-------|------------|-------|
| `compact` | 0.25rem 0.75rem | 0.75rem 1rem | 0.5rem 1rem | 0.5rem 0.75rem | 0.25rem 0.75rem |
| `normal` | 0.5rem 1rem | 1.5rem 1.5rem | 0.75rem 1.5rem | 0.75rem 1rem | 0.5rem 0.75rem |
| `spacious` | 0.75rem 1.5rem | 2rem 2rem | 1rem 1.5rem | 1rem 1.5rem | 0.75rem 1rem |

### Radius presets

Control border-radius across all components:

| Preset | Button | Card | Badge | Alert | Input |
|--------|--------|------|-------|-------|-------|
| `none` | 0 | 0 | 0 | 0 | 0 |
| `sm` | 4px | 4px | 0.25rem | 4px | 4px |
| `md` | 6px | 8px | 0.375rem | 8px | 6px |
| `lg` | 10px | 12px | 0.5rem | 12px | 10px |
| `pill` | 50rem | 1rem | 50rem | 1rem | 50rem |

### Type ratio presets

Control the modular scale for heading sizes:

| Preset | Ratio | Effect |
|--------|-------|--------|
| `tight` | 1.2 | Subtle size differences between headings |
| `normal` | 1.33 | Balanced (minor third scale) |
| `relaxed` | 1.5 | Pronounced heading hierarchy |
| `dramatic` | 1.618 | Golden ratio — large headings, compact body |

### Elevation presets

Control box-shadow depth:

| Preset | Description |
|--------|-------------|
| `flat` | No shadows |
| `sm` | Subtle shadows |
| `md` | Standard depth (default) |
| `lg` | Pronounced shadows |

### Motion presets

Control transition timing:

| Preset | Fast | Normal | Slow | Easing |
|--------|------|--------|------|--------|
| `reduced` | 100ms | 150ms | 200ms | ease-out |
| `standard` | 100ms | 200ms | 300ms | ease-out |
| `expressive` | 150ms | 300ms | 500ms | cubic-bezier(0.34, 1.56, 0.64, 1) |

## The palette

`bw.makeStyles()` returns an object with the full generated palette:

```javascript
var theme = bw.makeStyles({
  primary: '#0077b6',
  secondary: '#90e0ef'
});
bw.applyStyles(theme);

// theme.palette contains 9 color families, each with 8 shades:
theme.palette.primary.base;      // '#0077b6' — the seed color
theme.palette.primary.hover;     // darker variant for hover states
theme.palette.primary.active;    // darker still for active/pressed states
theme.palette.primary.light;     // very light tint for backgrounds
theme.palette.primary.darkText;  // dark variant for text
theme.palette.primary.border;    // medium-light for borders
theme.palette.primary.focus;     // semi-transparent for focus rings
theme.palette.primary.textOn;    // '#fff' or '#000' — readable text on base

// Same 8 shades available for:
// secondary, tertiary, success, danger, warning, info, light, dark

// Surface colors (raw hex strings):
theme.palette.background;  // '#ffffff'
theme.palette.surface;     // '#f8f9fa'
```

### How shade derivation works

From a single seed color, `bw.deriveShades()` produces eight coordinated variants:

| Shade | Derivation | Purpose |
|-------|-----------|---------|
| `base` | The seed color itself | Default button/badge/alert fill |
| `hover` | 10% darker | Hover state |
| `active` | 15% darker | Active/pressed state |
| `light` | 85% tinted with white | Light background (alert bg, card highlight) |
| `darkText` | 40% darker | Text color for dark-on-light layouts |
| `border` | 60% tinted with white | Border color |
| `focus` | 25% opacity of seed | Focus ring |
| `textOn` | `#fff` or `#000` | Readable text on the base color (WCAG contrast) |

### Color harmonization

When `harmonize` is set (default: 0.20), semantic colors (success, danger, warning, info) have their hue shifted slightly toward the primary color. This creates visual cohesion — a forest-themed app's success green will lean toward the forest primary, while an ocean-themed app's success green will lean toward blue.

Set `harmonize: 0` for pure, unmodified semantic colors.

## Primary and alternate palettes

Every theme has two palettes: primary and alternate. The alternate is derived automatically by inverting the luminance of each seed color.

- If your primary palette is light, the alternate will be dark
- If your primary palette is dark, the alternate will be light

```javascript
var theme = bw.makeStyles({
  primary: '#0077b6',
  secondary: '#90e0ef'
});
bw.applyStyles(theme);

theme.isLightPrimary;        // true -- judged on the whole primary palette
theme.alternatePalette;      // the luminance-inverted counterpart
theme.alternateCss;          // its CSS, scoped under .bw_theme_alt
```

### Switching between palettes

Both palettes are injected together — the alternate is scoped under the `bw_theme_alt` class. Switching is a one-class toggle, no restyling needed:

```javascript
bw.toggleThemeMode();              // flip primary <-> alternate (whole page)
bw.setThemeMode('alternate');      // set explicitly
bw.toggleThemeMode('#dashboard');  // toggle just one subtree
```

To swap in a different palette entirely, generate and apply another theme:

```javascript
var ocean  = bw.makeStyles({ primary: '#0077b6', secondary: '#90e0ef' });
var forest = bw.makeStyles({ primary: '#2d6a4f', secondary: '#d4a373' });
bw.applyStyles(forest);   // replaces the global theme
bw.applyStyles(ocean);    // switch back
```

> **Note:** `bw.toggleStyles()` was removed in v2.1. Its replacement is `bw.toggleThemeMode()`, which toggles the `bw_theme_alt` class instead of re-injecting styles. See [`bw.toggleThemeMode()`](bitwrench_api.md#bwtogglethememodescope) and [`bw.setThemeMode()`](bitwrench_api.md#bwsetthememodemode-scope).

### Clearing a theme

```javascript
bw.clearStyles();
```

This removes the injected `<style>` elements and clears the internal theme cache. Call this before generating a new theme with different colors to prevent CSS accumulation.

## Using themes without injection

`bw.makeStyles()` only generates; nothing reaches the document until you pass
the result to `bw.applyStyles()`. So to get the CSS as text, stop after
`makeStyles`:

```javascript
var theme = bw.makeStyles({
  primary: '#0077b6',
  secondary: '#90e0ef'
});

// Use the CSS string however you want
console.log(theme.css);          // primary CSS
console.log(theme.alternateCss); // alternate CSS

// Write to a file in Node.js
fs.writeFileSync('theme.css', theme.css + '\n' + theme.alternateCss);
```

This is useful for:

- Static site generation (write CSS to a file)
- Server-side rendering (include CSS in the HTML response)
- Theme export tools (let users download their theme)

## Bring your own design

The palette generator is for the built-in components. If you design your own
UI -- or only use TACO, `bw.css()` and `bw.injectCSS()` -- skip `loadStyles()`
and write your styles directly. Everything in this section works without it.

### Rules as objects

```javascript
bw.injectCSS(bw.css({
  body: { margin: 0, fontFamily: 'system-ui, sans-serif' },
  '.key': { fill: '#f5f5f5', stroke: '#333' },
  '.key:hover': { fill: '#ffd166' },
  '@media (max-width: 600px)': { '.key': { strokeWidth: '0.5px' } }
}), { id: 'app_css' });
```

- camelCase properties become kebab-case (`fontFamily` -> `font-family`).
- `@media` and `@keyframes` nest as objects.
- `injectCSS` with an `id` reuses one `<style>` element. It appends by default;
  pass `{ id, append: false }` to replace its contents, e.g. when regenerating.
- Output is readable by default, which is what you want while developing.
  Pass `minify: true` for compact output in production -- to `bw.css()`, or
  straight to `bw.injectCSS()`, which hands it on:

  ```javascript
  bw.injectCSS(rules, { id: 'app_css', minify: true });  // .key{fill:#f5f5f5;stroke:#333;}...
  ```

  `minify` applies to CSS generated from rule objects. A CSS string you pass
  in is inserted exactly as written.

### The same selector twice, or a fixed order

An object can't hold the same key twice, and its key order is the only order
you get. Pass an array of rule objects instead -- each is emitted in turn:

```javascript
bw.css([
  { '.btn': { padding: '4px 8px' } },
  { '.theme-dark .btn': { color: '#eee' } },
  { '.btn': { borderRadius: '4px' } }   // second .btn block, emitted last
]);
```

### Your own tokens

Custom properties pass through `bw.css()` untouched, so a token set is a
`:root` block plus an override block per theme:

```javascript
bw.injectCSS(bw.css({
  ':root':                { '--bg': '#0f1115', '--fg': '#e8e8e8', '--accent': '#ffd166' },
  '[data-theme="light"]': { '--bg': '#ffffff', '--fg': '#1a1a1a', '--accent': '#b5651d' },
  body:                   { background: 'var(--bg)', color: 'var(--fg)' },
  '.accent':              { color: 'var(--accent)' }
}), { id: 'app_tokens' });

// Switch themes by changing one attribute on <html>
function setTheme(name) { bw.patch(bw.$('html')[0], { 'data-theme': name }); }
```

This is a normal web-platform pattern and fine in your code. bitwrench's own
components don't use custom properties -- their values come from the palette
object in JS -- so your tokens and a generated theme don't interfere.

## Multiple themes on one page

Themes are scoped by CSS class name. You can have multiple themes active simultaneously:

```javascript
bw.loadStyles({ primary: '#0077b6', secondary: '#90e0ef' });
bw.loadStyles({ primary: '#e76f51', secondary: '#264653' });
```

Apply themes to different sections by adding the theme name as a class:

```javascript
bw.DOM('#header', {
  t: 'div', a: { class: 'ocean' },
  c: bw.makeNavbar({ brand: 'App', dark: true })
});

bw.DOM('#sidebar', {
  t: 'div', a: { class: 'sunset' },
  c: bw.makeCard({ title: 'Sidebar' })
});
```

Components inside an `ocean`-classed container use ocean colors; components inside a `sunset`-classed container use sunset colors.

## Color utility functions

These functions are available for custom color work:

| Function | Description |
|----------|-------------|
| `bw.hexToHsl(hex)` | Convert hex to `[h, s, l]` array |
| `bw.hslToHex([h, s, l])` | Convert HSL array to hex |
| `bw.adjustLightness(hex, amount)` | Shift lightness by percentage points |
| `bw.mixColor(hex1, hex2, ratio)` | Linear interpolation between two colors |
| `bw.relativeLuminance(hex)` | WCAG 2.0 relative luminance (0–1) |
| `bw.textOnColor(hex)` | Returns `'#fff'` or `'#000'` for readable text |
| `bw.deriveShades(hex)` | Generate 8 shade variants from one color |
| `bw.derivePalette(config)` | Generate full palette from seed config |

> **Coming from Tailwind?** Bitwrench's shade derivation is similar to Tailwind's color scale (50–900), but generated algorithmically from a single seed rather than hand-tuned. The 8 shades map to specific UI roles (hover, active, focus ring) rather than numeric levels.

> **Coming from Bootstrap?** Bitwrench's theme generation replaces Bootstrap's Sass `$theme-colors` map and `tint-color()`/`shade-color()` functions. Instead of a build step with Sass variables, you call `bw.loadStyles()` at runtime.
