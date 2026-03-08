# Theme Generator Meta-Parameters

## Principle

Three seed colors in, complete design system out. Every meta-parameter has
a sensible default. A user who calls `bw.generateTheme('ocean', { primary:
'#006666', secondary: '#cc6633' })` gets a professional result with zero
configuration. Power users can tune individual knobs.

## Color Derivation — Simple Formula

### From 3 seeds to full palette

The user provides up to 3 colors. Everything else is derived:

```
INPUT:   primary, secondary, [tertiary = primary]
DERIVED: success, danger, warning, info, light, dark, neutral
```

### Harmonization (one formula)

Semantic colors start from fixed hues but shift toward the primary to
feel "of a piece" with the brand:

```javascript
function harmonize(semanticHex, primaryHex, amount) {
  // amount = 0.0 (no shift) to 1.0 (full shift). Default 0.20.
  var semHsl = hexToHsl(semanticHex);
  var priHsl = hexToHsl(primaryHex);

  // Shortest-arc hue interpolation
  var diff = priHsl[0] - semHsl[0];
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;

  var newHue = (semHsl[0] + diff * amount + 360) % 360;
  return hslToHex([newHue, semHsl[1], semHsl[2]]);
}
```

Default semantic base colors (before harmonization):

| Role     | Base Hue | Base Hex  | Why |
|----------|----------|-----------|-----|
| success  | 145      | `#198754` | Green — universal "good" |
| danger   | 354      | `#dc3545` | Red — universal "stop" |
| warning  | 45       | `#f0ad4e` | Amber — universal "caution" |
| info     | 195      | `#17a2b8` | Cyan — neutral informational |

After `harmonize(base, primary, 0.20)`, each shifts ~20% toward primary hue.
With `primary = #006666` (hue 180):

- danger hue 354 → shifts toward 180 → ~hue 319 (warm plum-red)
- warning hue 45 → shifts toward 180 → ~hue 72 (olive-amber)
- success hue 145 → shifts toward 180 → ~hue 152 (teal-green)
- info hue 195 → shifts toward 180 → ~hue 192 (stays close)

Result: every color in the UI feels related to the brand.

### Surface and neutral derivation

Light and dark surface colors are derived from primary hue with low saturation:

```javascript
var priHsl = hexToHsl(primary);
var h = priHsl[0];

light   = hslToHex([h, 8, 97]);     // near-white with primary tint
dark    = hslToHex([h, 10, 13]);     // near-black with primary tint
neutral = hslToHex([h, 5, 55]);      // mid-gray with primary tint
```

### Shade ramp (unchanged, simple)

For each color, `deriveShades(hex)` produces 8 variants via HSL math:

```
base     = hex (as-is)
hover    = adjustLightness(hex, -10)
active   = adjustLightness(hex, -15)
light    = mixColor(hex, '#ffffff', 0.85)
darkText = adjustLightness(hex, -40)
border   = mixColor(hex, '#ffffff', 0.60)
focus    = rgba(r, g, b, 0.25)
textOn   = relativeLuminance(hex) > 0.179 ? '#000' : '#fff'
```

This stays HSL-based for simplicity and IE11 compat. The harmonization
step is where the real improvement comes — not the shade math.

## Meta-Parameters

### Full config shape with defaults

```javascript
bw.generateTheme('ocean', {
  // === COLORS (existing) ===
  primary:   '#006666',    // REQUIRED
  secondary: '#cc6633',    // REQUIRED
  tertiary:  undefined,    // defaults to primary

  // === LAYOUT (existing) ===
  spacing:  'normal',      // 'compact' | 'normal' | 'spacious'
  radius:   'md',          // 'none' | 'sm' | 'md' | 'lg' | 'pill'

  // === NEW: TYPOGRAPHY ===
  typeRatio: 1.200,        // modular scale ratio

  // === NEW: ELEVATION ===
  elevation: 'md',         // 'flat' | 'sm' | 'md' | 'lg'

  // === NEW: MOTION ===
  motion: 'standard',      // 'reduced' | 'standard' | 'expressive'

  // === NEW: COLOR TUNING ===
  harmonize: 0.20,         // 0-1, how much to shift semantics toward primary

  // === INJECTION (existing) ===
  inject: true
});
```

### Typography: `typeRatio`

A modular scale. One number controls the entire type hierarchy.

```javascript
var TYPE_DEFAULTS = {
  base: 16,         // px, body text
  ratio: 1.200      // Minor Third
};

function generateTypeScale(base, ratio) {
  // Round to nearest integer for clean rendering
  return {
    xs:   Math.round(base / (ratio * ratio)),  // ~11px
    sm:   Math.round(base / ratio),            // ~13px
    base: base,                                // 16px
    lg:   Math.round(base * ratio),            // ~19px
    xl:   Math.round(base * ratio * ratio),    // ~23px
    '2xl': Math.round(base * Math.pow(ratio, 3)), // ~28px
    '3xl': Math.round(base * Math.pow(ratio, 4)), // ~33px
    '4xl': Math.round(base * Math.pow(ratio, 5))  // ~40px
  };
}
```

Preset ratios (named for convenience):

| Name        | Ratio | Feel |
|-------------|-------|------|
| `'tight'`   | 1.125 | Dense, data-heavy UIs |
| `'normal'`  | 1.200 | Balanced (DEFAULT) |
| `'relaxed'` | 1.250 | Marketing, editorial |
| `'dramatic'`| 1.333 | Hero-heavy, landing pages |

User can pass a name or a number: `typeRatio: 'relaxed'` or `typeRatio: 1.25`.

### Elevation: `elevation`

Shadow depth preset. One setting, four levels consumed by components.

```javascript
var ELEVATION_PRESETS = {
  flat: {
    sm:  'none',
    md:  'none',
    lg:  'none',
    xl:  'none'
  },
  sm: {
    sm:  '0 1px 2px rgba(0,0,0,0.05)',
    md:  '0 1px 3px rgba(0,0,0,0.08)',
    lg:  '0 2px 6px rgba(0,0,0,0.10)',
    xl:  '0 4px 12px rgba(0,0,0,0.12)'
  },
  md: {
    sm:  '0 1px 3px rgba(0,0,0,0.08)',
    md:  '0 2px 6px rgba(0,0,0,0.12)',
    lg:  '0 4px 12px rgba(0,0,0,0.16)',
    xl:  '0 8px 24px rgba(0,0,0,0.20)'
  },
  lg: {
    sm:  '0 2px 4px rgba(0,0,0,0.10)',
    md:  '0 4px 12px rgba(0,0,0,0.16)',
    lg:  '0 8px 24px rgba(0,0,0,0.22)',
    xl:  '0 16px 48px rgba(0,0,0,0.28)'
  }
};
```

Components consume named levels: cards use `sm`, dropdowns use `md`,
modals use `lg`, tooltips use `xl`.

### Motion: `motion`

Transition duration + easing preset.

```javascript
var MOTION_PRESETS = {
  reduced: {
    fast:    '0ms',           // disabled
    normal:  '0ms',
    slow:    '0ms',
    easing:  'linear'
  },
  standard: {
    fast:    '100ms',         // hover, focus
    normal:  '200ms',         // expand, collapse
    slow:    '300ms',         // page transitions
    easing:  'ease-out'
  },
  expressive: {
    fast:    '150ms',
    normal:  '300ms',
    slow:    '500ms',
    easing:  'cubic-bezier(0.34, 1.56, 0.64, 1)' // slight overshoot
  }
};
```

Components use named speeds: hover effects use `fast`, accordion expand
uses `normal`, modal entrance uses `slow`.

### Harmonize: `harmonize`

A number from 0 to 1 controlling how much semantic colors shift toward
the primary hue:

- `0` = no shift, classic Bootstrap-style fixed colors
- `0.20` = subtle shift, brand-adjacent (DEFAULT)
- `0.40` = strong shift, very cohesive
- `1.0` = full monochrome (all colors become primary hue variants)

## What changes in the code

### `bitwrench-color-utils.js`

Add:
- `harmonize(semanticHex, primaryHex, amount)` — one function

### `bitwrench-styles.js`

Modify `generateThemedCSS()` to accept the full layout object which now
includes `type`, `elevation`, and `motion` resolved values. Components
consume these instead of hardcoded values:

```javascript
// Before (hardcoded)
'.bw-card': { 'box-shadow': '0 2px 4px rgba(0,0,0,0.1)' }

// After (from layout)
'.bw-card': { 'box-shadow': layout.elevation.sm }
```

### `derivePalette(config)` in `bitwrench-color-utils.js`

Changes to apply harmonization:

```javascript
function derivePalette(config) {
  var amt = config.harmonize !== undefined ? config.harmonize : 0.20;
  var pri = config.primary;

  return {
    primary:   deriveShades(config.primary),
    secondary: deriveShades(config.secondary),
    tertiary:  deriveShades(config.tertiary),
    success:   deriveShades(harmonize(config.success || '#198754', pri, amt)),
    danger:    deriveShades(harmonize(config.danger  || '#dc3545', pri, amt)),
    warning:   deriveShades(harmonize(config.warning || '#f0ad4e', pri, amt)),
    info:      deriveShades(harmonize(config.info    || '#17a2b8', pri, amt)),
    light:     deriveShades(config.light || hslToHex([hexToHsl(pri)[0], 8, 97])),
    dark:      deriveShades(config.dark  || hslToHex([hexToHsl(pri)[0], 10, 13]))
  };
}
```

### `resolveLayout(config)` in `bitwrench-styles.js`

Expands to resolve all meta-parameters:

```javascript
function resolveLayout(config) {
  return {
    spacing:   SPACING_PRESETS[config.spacing || 'normal'],
    radius:    RADIUS_PRESETS[config.radius || 'md'],
    type:      resolveTypeScale(config.typeRatio || 'normal'),
    elevation: ELEVATION_PRESETS[config.elevation || 'md'],
    motion:    MOTION_PRESETS[config.motion || 'standard']
  };
}
```

## Implementation order

1. Add `harmonize()` to color-utils (smallest change, biggest visual impact)
2. Update `derivePalette()` to use harmonize + derived light/dark
3. Add type scale, elevation, and motion presets to `bitwrench-styles.js`
4. Update `resolveLayout()` to resolve all presets
5. Update `generateThemedCSS()` to use `layout.elevation` and `layout.motion`
6. Update tests
7. Update theme demo page with meta-parameter controls

Steps 1-2 are the high-value work. Steps 3-5 are systematic but
lower risk. The formula for each meta-parameter is one lookup table
plus one resolver function — no complex algorithms.
