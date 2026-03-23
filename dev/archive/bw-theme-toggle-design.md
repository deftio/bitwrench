# Theme Toggle Design — Primary / Alternate Palettes

## Problem

The current dark mode system (`toggleDarkMode()`, `generateDarkModeCSS()`) is a
bolt-on: hardcoded dark colors, a fixed `.bw-dark` class, and no relationship to
the theme generator. It treats "dark mode" as a special case rather than a
first-class concept.

This doesn't match how themes actually work. A user who chooses dark seed colors
(navy + charcoal) gets a dark primary theme — and their "alternate" should be
light. The system shouldn't assume primary = light.

## Conceptual Model

Every generated theme has **two sides**:

| Side | Role |
|------|------|
| **Primary** | The palette derived directly from the user's seed colors |
| **Alternate** | The perceptual complement — same hues, inverted luminance |

"Light mode" and "dark mode" are not fixed concepts. They're properties of which
side is active:

- If the primary palette has light backgrounds → primary IS light mode,
  alternate IS dark mode
- If the primary palette has dark backgrounds → primary IS dark mode,
  alternate IS light mode

`applyTheme('light')` and `applyTheme('dark')` are semantic shortcuts that
examine both palettes and activate the one with the appropriate luminance.

## Palette Derivation

### How the alternate is computed

The alternate palette is derived from the same seed colors, not from hardcoded
values. The algorithm:

1. **Analyze primary luminance**: Compute average relative luminance of the
   seed colors (primary, secondary, tertiary)

2. **Determine direction**: If avg luminance > 0.5, seeds are "light-flavored"
   and the alternate needs dark backgrounds. If <= 0.5, seeds are
   "dark-flavored" and the alternate needs light backgrounds.

3. **Derive alternate seeds**: For each seed color, mirror its lightness
   around a midpoint. Keep hue and saturation. This preserves the color
   identity while inverting the feel.

4. **Generate alternate surface colors**: Body background, surface background,
   text color, and border color are derived from the alternate seeds — using
   the same formulas the primary palette uses, just with inverted lightness
   inputs.

5. **Re-derive through `derivePalette()`**: The alternate seeds go through the
   exact same pipeline as primary. Both palettes have the same structure
   (`{ primary: { base, hover, active, light, ... }, secondary: { ... }, ... }`).

### Key insight: same pipeline, different inputs

```
Seeds (user)  →  derivePalette()  →  Primary palette  →  generateThemedCSS()
                                                           ↓
                                                        Primary CSS rules

Seeds (user)  →  deriveAlternate() → derivePalette() →  Alternate palette → generateThemedCSS()
                                                           ↓
                                                        Alternate CSS rules (scoped under .bw-theme-alt)
```

Both sides go through `derivePalette()` and `generateThemedCSS()`. The only
difference is the input lightness values. This guarantees structural parity.

### `deriveAlternateSeed(hex)`

For a single color:

```javascript
function deriveAlternateSeed(hex) {
  var hsl = hexToHsl(hex);
  var h = hsl[0], s = hsl[1], l = hsl[2];

  // Mirror lightness around 50, with adjustments for readability
  var altL;
  if (l > 50) {
    // Light color → make dark. Map 50-100 → 30-10 (darker end)
    altL = clip(100 - l - 10, 8, 40);
  } else {
    // Dark color → make light. Map 0-50 → 85-65 (lighter end)
    altL = clip(100 - l + 10, 60, 92);
  }

  // Slightly reduce saturation for dark variants (too vivid at low L)
  var altS = l > 50 ? clip(s * 0.85, 0, 100) : clip(s * 1.1, 0, 100);

  return hslToHex([h, altS, altL]);
}
```

This is a starting point — the exact curve needs tuning with real themes. The
key properties:
- Hue is preserved (the brand stays recognizable)
- Lightness is inverted (the feel flips)
- Saturation adjusts slightly (dark backgrounds need less saturation)

### Alternate surface colors

Beyond the accent colors, we need surface colors (body bg, card bg, borders,
text). These come from the primary seed's hue:

```javascript
function deriveAlternateSurface(primaryHex, isLightPrimary) {
  var hsl = hexToHsl(primaryHex);
  var h = hsl[0], s = Math.min(hsl[1], 15); // Desaturated for surfaces

  if (isLightPrimary) {
    // Primary is light → alternate surfaces are dark
    return {
      bodyBg:    hslToHex([h, s, 10]),
      surfaceBg: hslToHex([h, s, 15]),
      textColor: hslToHex([h, 5, 88]),
      borderColor: hslToHex([h, s, 28])
    };
  } else {
    // Primary is dark → alternate surfaces are light
    return {
      bodyBg:    hslToHex([h, s, 98]),
      surfaceBg: hslToHex([h, s, 100]),
      textColor: hslToHex([h, 10, 15]),
      borderColor: hslToHex([h, s, 80])
    };
  }
}
```

## CSS Structure

### Class convention

```
.bw-theme-alt     — alternate palette active (replaces .bw-dark)
```

When `bw.applyTheme('alternate')` is called, the `bw-alt` class is added to
`<html>`. All alternate CSS rules are scoped under `.bw-theme-alt`.

When `bw.applyTheme('primary')` is called, the `bw-alt` class is removed.

### Generated CSS layout

```css
/* Primary palette (always present) */
.bw-btn-primary { background-color: #006666; color: #fff; ... }
.bw-card { background-color: #fff; border-color: #dee2e6; ... }
body { color: #212529; background-color: #fff; }

/* Alternate palette (always present, scoped) */
.bw-theme-alt body { color: #e0e0e0; background-color: #0d1a1a; }
.bw-theme-alt .bw-card { background-color: #132626; border-color: #2a4747; ... }
.bw-theme-alt .bw-btn-primary { background-color: #00b3b3; color: #000; ... }
```

Both are emitted by `generateTheme()`. Switching is pure class swap — no
style injection/removal at toggle time.

### Named/scoped themes

For named themes (e.g., `bw.generateTheme('ocean', config)`), the structure is:

```css
.ocean .bw-btn-primary { ... }
.ocean.bw-theme-alt .bw-card { ... }
```

Double class: theme scope + alt mode (compound selector — both on `<html>`).

## API

### `bw.generateTheme(name, config)` — enhanced

```javascript
var result = bw.generateTheme('ocean', {
  primary: '#006666',
  secondary: '#cc6633'
});

// result.css               — primary CSS string
// result.palette           — primary palette object
// result.alternate.css     — alternate CSS string
// result.alternate.palette — alternate palette object
// result.name              — theme name
// result.isLightPrimary    — boolean: is the primary palette light?
```

The `config.dark` option is removed. Alternate is always generated.

### `bw.applyTheme(mode)` — new

```javascript
bw.applyTheme('primary');    // activate primary palette
bw.applyTheme('alternate');  // activate alternate palette
bw.applyTheme('light');      // activate whichever palette is lighter
bw.applyTheme('dark');       // activate whichever palette is darker
```

Implementation:

```javascript
bw.applyTheme = function(mode) {
  if (!bw._isBrowser) return mode;
  var root = document.documentElement;
  var isLightPrimary = bw._activeTheme ? bw._activeTheme.isLightPrimary : true;

  var wantAlt;
  if (mode === 'primary')        wantAlt = false;
  else if (mode === 'alternate') wantAlt = true;
  else if (mode === 'light')     wantAlt = !isLightPrimary;  // if primary is light, no alt needed
  else if (mode === 'dark')      wantAlt = isLightPrimary;   // if primary is light, want alt (dark)
  else                           wantAlt = false;

  if (wantAlt) {
    root.classList.add('bw-theme-alt');
  } else {
    root.classList.remove('bw-theme-alt');
  }

  bw._activeThemeMode = wantAlt ? 'alternate' : 'primary';
  return bw._activeThemeMode;
};
```

### `bw.toggleTheme()` — new

```javascript
bw.toggleTheme = function() {
  var current = bw._activeThemeMode || 'primary';
  return bw.applyTheme(current === 'primary' ? 'alternate' : 'primary');
};
```

### Removed (hard break — no deprecation warnings)

| Old | Replacement |
|-----|-------------|
| `bw.toggleDarkMode()` | `bw.toggleTheme()` or `bw.applyTheme('dark')` |
| `generateDarkModeCSS()` | Deleted — alternate palette generated through same pipeline as primary |
| `getDarkModeStyles()` | Deleted — tests use `generateTheme()` directly |
| `config.dark` option | Deleted — alternate is always generated |
| `.bw-dark` class | `.bw-theme-alt` class |

## Manual Style Convention

Anyone writing custom CSS for bitwrench components must provide both palette
sides. The convention:

```css
/* Primary */
.my-widget { background: #fff; color: #333; }

/* Alternate */
.bw-theme-alt .my-widget { background: #1a1a2e; color: #e9ecef; }
```

For TACO components, the `make*()` factory handles this internally — the
component's CSS is derived from the palette, and the alternate scoping is
automatic.

For page-level custom styles, the same pattern applies. `bw.css()` can express
this naturally:

```javascript
bw.css({
  '.my-widget': { background: '#fff', color: '#333' },
  '.bw-theme-alt .my-widget': { background: '#1a1a2e', color: '#e9ecef' }
});
```

Or better — if the author uses `bw.generateTheme()` result:

```javascript
var theme = bw.generateTheme('myTheme', config);
// theme.palette and theme.alternate.palette available for manual use
bw.css({
  '.my-widget': { background: theme.palette.light.base, color: theme.palette.dark.base },
  '.bw-theme-alt .my-widget': { background: theme.alternate.palette.dark.base, color: theme.alternate.palette.light.base }
});
```

## `prefers-color-scheme` Integration

For users who want to respect the OS preference:

```javascript
bw.generateTheme('ocean', { primary: '#006666', secondary: '#cc6633' });

// Auto-apply based on OS setting
if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
  bw.applyTheme('dark');
}

// Listen for changes
window.matchMedia('(prefers-color-scheme: dark)')
  .addEventListener('change', function(e) {
    bw.applyTheme(e.matches ? 'dark' : 'light');
  });
```

This is user-space code, not built into bitwrench. The library provides the
mechanism (two palettes + class swap); the user decides the policy (manual
toggle, OS preference, time-of-day, etc.).

## State Tracking

```javascript
bw._activeTheme = {
  name: 'ocean',
  palette: { ... },              // primary palette
  alternate: {
    palette: { ... },            // alternate palette
    css: '...'                   // alternate CSS string
  },
  isLightPrimary: true           // true if primary seeds are light-colored
};
bw._activeThemeMode = 'primary';  // or 'alternate'
```

## Implementation Plan

### Implementation steps (this PR)

1. Add `deriveAlternateSeed()` and `deriveAlternatePalette()` to `bitwrench-color-utils.js`
2. Remove `generateDarkModeCSS()`, `getDarkModeStyles()`, `_hexToRgbStr()` from `bitwrench-styles.js`
3. Add `generateAlternateCSS()` to `bitwrench-styles.js` — uses same `generateThemedCSS()` pipeline with alternate palette, scoped under `.bw-theme-alt`
4. Modify `generateTheme()` to always produce both palettes + both CSS sets; remove `config.dark`; return nested `{ css, palette, alternate: { css, palette }, name, isLightPrimary }`
5. Remove `bw.toggleDarkMode()` — hard delete
6. Add `bw.applyTheme(mode)` and `bw.toggleTheme()` to `bitwrench.js`
7. Update all tests (remove dark mode tests, add alternate palette tests)
8. Update theme demo page (`pages/10-themes.html`) with toggle demo

### Follow-up (future PR)

1. Tune alternate derivation curves with all preset themes
2. Add `prefers-color-scheme` example to demo page

## Resolved Design Decisions

1. **Class name**: `.bw-theme-alt` — grammatically clear, follows `bw-theme-*` namespace
2. **Injection**: Always inject both CSS sets — avoids phantom missing-theme errors
3. **Named theme compound selector**: `.ocean.bw-theme-alt` — both classes on `<html>`
4. **Return shape**: Nested — `result.alternate.css`, `result.alternate.palette` — provides context
5. **Deprecation**: Hard remove `toggleDarkMode()`, `generateDarkModeCSS()`, `getDarkModeStyles()` — no warnings, clean break
