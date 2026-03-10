# BCCL Component Representation: From Raw JS to Trie-Packed Definitions

## Problem Statement

`bitwrench-styles.js` is 2,242 lines producing 1,251 CSS selectors (994 structural +
257 themed) with 3,100+ property declarations. Despite a structural/themed separation
refactor, the UMD min gzipped bundle is 38.5KB — essentially unchanged — because the
rules were reorganized, not consolidated.

The root cause: **53% of themed CSS (137 of 257 selectors) are variant expansions** that
repeat the same formula across components. Each `generate*Themed()` function independently
loops `['primary','secondary','success','danger','warning','info','light','dark']` and
stamps out per-component selectors with per-variant colors. This happens 11 times across
37 themed generators.

Meanwhile, the structural CSS has **994 selectors with 2,440 declarations** — many of
which are programmatically generated utilities (`bw-col-1` through `bw-col-12`,
`bw-m-0` through `bw-m-5`, etc.) that follow mechanical patterns.

### What This Document Proposes

Replace the current architecture — 37 imperative JS functions that build CSS rule objects
at runtime — with a **declarative component definition format** stored as a JS data
structure. The definition fully describes each BCCL component's CSS needs using palette
references and layout token references instead of concrete values. At build time, a
rollup plugin replaces the raw definitions with a trie-packed + dictionary-compressed
version plus a small decoder. The runtime behavior is identical.

Benefits:
1. **Smaller bundle** — trie eliminates prefix duplication, dictionary eliminates
   repeated property names/values, and the resulting byte stream compresses better
   under gzip
2. **More consistent components** — the definition format forces every component
   through the same structure, exposing inconsistencies
3. **Easier authoring** — adding a BCCL component = adding a definition entry, not
   writing a new `generate*Themed()` function
4. **Dog-fooding** — the definition IS a TACO-adjacent data structure

---

## Part 1: The Raw Definition Format

### File: `src/bitwrench-bccl-defs.js`

A JS file (not JSON) so we can include functions where needed (e.g., tab switching,
table sorting). The default export is an object keyed by component name. Each component
has three sections: `taco` (DOM structure), `structural` (static CSS), and `themed`
(palette/layout-dependent CSS).

```javascript
// src/bitwrench-bccl-defs.js
export default {

  // ─── Example: Button ──────────────────────────────────────────────
  'bw-btn': {
    taco: {
      t: 'button',
      a: { class: 'bw-btn bw-btn-{variant}', type: 'button' },
      c: '{text}'
    },

    structural: {
      '.bw-btn': {
        display: 'inline-flex',
        'align-items': 'center',
        'justify-content': 'center',
        'font-weight': '500',
        'line-height': '1.5',
        'text-align': 'center',
        'text-decoration': 'none',
        'vertical-align': 'middle',
        cursor: 'pointer',
        'user-select': 'none',
        border: '1px solid transparent',
        'font-size': '0.875rem',
        'font-family': 'inherit',
        gap: '0.5rem'
      },
      '.bw-btn:hover':          { 'text-decoration': 'none', transform: 'translateY(-1px)' },
      '.bw-btn:active':         { transform: 'translateY(0)' },
      '.bw-btn:focus-visible':  { outline: '2px solid currentColor', 'outline-offset': '2px' },
      '.bw-btn:disabled':       { opacity: '0.5', cursor: 'not-allowed', 'pointer-events': 'none' },
      '.bw-btn-block':          { display: 'block', width: '100%' }
    },

    themed: {
      '.bw-btn': {
        padding: 'spacing.btn',
        'border-radius': 'radius.btn'
      },
      '.bw-btn:focus-visible': {
        'box-shadow': '0 0 0 3px palette.primary.focus'
      },

      // Variant expansion — one entry generates 8 selectors
      '$variants': {
        selector: '.bw-btn-{v}',
        expand: ['primary', 'secondary', 'success', 'danger', 'warning', 'info', 'light', 'dark'],
        rules: {
          '': {
            color: 'palette.{v}.textOn',
            'background-color': 'palette.{v}.base',
            'border-color': 'palette.{v}.base'
          },
          ':hover': {
            color: 'palette.{v}.textOn',
            'background-color': 'palette.{v}.hover',
            'border-color': 'palette.{v}.active'
          }
        }
      },

      // Outline variants — same expansion, different formula
      '$variants_outline': {
        selector: '.bw-btn-outline-{v}',
        expand: ['primary', 'secondary', 'success', 'danger', 'warning', 'info', 'light', 'dark'],
        rules: {
          '': {
            color: 'palette.{v}.base',
            'border-color': 'palette.{v}.base',
            'background-color': 'transparent'
          },
          ':hover': {
            color: 'palette.{v}.textOn',
            'background-color': 'palette.{v}.base',
            'border-color': 'palette.{v}.base'
          }
        }
      }
    }
  },

  // ─── Example: Card ────────────────────────────────────────────────
  'bw-card': {
    taco: {
      t: 'div',
      a: { class: 'bw-card bw-card-{variant}' },
      c: [
        { t: 'div', a: { class: 'bw-card-header' }, c: '{header}', when: 'header' },
        { t: 'div', a: { class: 'bw-card-body' }, c: [
          { t: 'h5', a: { class: 'bw-card-title' }, c: '{title}', when: 'title' },
          { t: 'h6', a: { class: 'bw-card-subtitle bw-mb-2 bw-text-muted' }, c: '{subtitle}', when: 'subtitle' },
          '{content}'
        ]},
        { t: 'div', a: { class: 'bw-card-footer' }, c: '{footer}', when: 'footer' }
      ]
    },

    structural: {
      '.bw-card': {
        position: 'relative', display: 'flex', 'flex-direction': 'column',
        'min-width': '0', height: '100%', 'word-wrap': 'break-word',
        'background-clip': 'border-box', 'margin-bottom': '1.5rem', overflow: 'hidden'
      },
      '.bw-card-body':                { flex: '1 1 auto' },
      '.bw-card-body > *:last-child': { 'margin-bottom': '0' },
      '.bw-card-title':               { 'margin-bottom': '0.5rem', 'font-size': '1.125rem', 'font-weight': '600', 'line-height': '1.3' },
      '.bw-card-text':                { 'margin-bottom': '0', 'font-size': '0.9375rem', 'line-height': '1.6' },
      '.bw-card-header':              { 'font-weight': '600', 'font-size': '0.875rem' },
      '.bw-card-footer':              { 'font-size': '0.875rem' },
      '.bw-card-hoverable':           { transition: 'all 0.3s ease-out' },
      '.bw-card-hoverable:hover':     { transform: 'translateY(-4px)' }
    },

    themed: {
      '.bw-card': {
        'background-color': '#fff',
        border: '1px solid palette.light.border',
        'border-radius': 'radius.card',
        'box-shadow': 'elevation.sm',
        transition: 'box-shadow motion.normal motion.easing, transform motion.normal motion.easing'
      },
      '.bw-card:hover':            { 'box-shadow': 'elevation.md' },
      '.bw-card-hoverable:hover':  { 'box-shadow': 'elevation.lg' },
      '.bw-card-body':             { padding: 'spacing.card' },
      '.bw-card-header':           { 'background-color': 'palette.light.light', 'border-bottom': '1px solid palette.light.border' },
      '.bw-card-footer':           { 'background-color': 'palette.light.light', 'border-top': '1px solid palette.light.border', color: 'palette.secondary.base' },
      '.bw-card-title':            { color: 'palette.dark.base' },
      '.bw-card-subtitle':         { color: 'palette.secondary.base' },

      // Variant accent borders
      '$variants': {
        selector: '.bw-card-{v}',
        expand: ['primary', 'secondary', 'success', 'danger', 'warning', 'info', 'light', 'dark'],
        rules: {
          '': { 'border-left': '4px solid palette.{v}.base' }
        }
      }
    }
  },

  // ─── Example: Alert ───────────────────────────────────────────────
  'bw-alert': {
    taco: {
      t: 'div',
      a: { class: 'bw-alert bw-alert-{variant}', role: 'alert' },
      c: ['{content}', { t: 'button', a: { class: 'bw-close' }, c: 'x', when: 'dismissible' }]
    },

    structural: {
      '.bw-alert':             { position: 'relative', 'margin-bottom': '1rem' },
      '.bw-alert-dismissible': { 'padding-right': '3rem' }
    },

    themed: {
      '.bw-alert': {
        padding: 'spacing.alert',
        'border-radius': 'radius.alert'
      },
      '$variants': {
        selector: '.bw-alert-{v}',
        expand: ['primary', 'secondary', 'success', 'danger', 'warning', 'info', 'light', 'dark'],
        rules: {
          '': {
            color: 'palette.{v}.darkText',
            'background-color': 'palette.{v}.light',
            'border-color': 'palette.{v}.border'
          }
        }
      }
    }
  },

  // ─── Example: Badge (minimal) ─────────────────────────────────────
  'bw-badge': {
    taco: {
      t: 'span',
      a: { class: 'bw-badge bw-badge-{variant}' },
      c: '{text}'
    },

    structural: {
      '.bw-badge': {
        display: 'inline-block', padding: '0.35em 0.65em',
        'font-size': '0.75em', 'font-weight': '600', 'line-height': '1',
        'text-align': 'center', 'white-space': 'nowrap', 'vertical-align': 'baseline'
      },
      '.bw-badge-pill': { 'border-radius': '50rem' }
    },

    themed: {
      '$variants': {
        selector: '.bw-badge-{v}',
        expand: ['primary', 'secondary', 'success', 'danger', 'warning', 'info', 'light', 'dark'],
        rules: {
          '': {
            color: 'palette.{v}.textOn',
            'background-color': 'palette.{v}.base'
          }
        }
      }
    }
  }

  // ... remaining 47 components follow the same pattern
};
```

### Token Reference Syntax

Themed values use dot-path strings that get resolved at runtime against the active
palette and layout. A value is a token reference if it contains a recognized root
name; otherwise it's a literal CSS value passed through as-is.

| Root | Resolves to | Example | Expands to |
|------|-------------|---------|------------|
| `palette.{variant}.{shade}` | `palette[variant][shade]` | `palette.primary.base` | `#006666` |
| `palette.{v}.{shade}` | palette ref inside `$variants` | `palette.{v}.hover` | `palette[currentVariant].hover` |
| `spacing.{key}` | `layout.spacing[key]` | `spacing.btn` | `0.5rem 1.125rem` |
| `radius.{key}` | `layout.radius[key]` | `radius.card` | `8px` |
| `elevation.{key}` | `layout.elevation[key]` | `elevation.md` | `0 2px 6px rgba(...)` |
| `motion.{key}` | `layout.motion[key]` | `motion.fast` | `150ms` |

Token references can appear inside composite values — the resolver finds and replaces
them while leaving literal fragments intact:

```javascript
border: '1px solid palette.light.border'
//  →   '1px solid #dee2e6'

transition: 'box-shadow motion.normal motion.easing'
//  →        'box-shadow 200ms ease-out'
```

### The `$variants` Block

The key insight for compression. Instead of 37 generator functions each with their own
`variants.forEach(...)` loop, we declare variants as data:

```javascript
'$variants': {
  selector: '.bw-btn-{v}',                              // template — {v} gets each variant name
  expand: ['primary', 'secondary', ...],                 // which variants to generate
  rules: {
    '':       { color: 'palette.{v}.textOn', ... },      // base selector
    ':hover': { color: 'palette.{v}.textOn', ... }       // pseudo-class appended
  }
}
```

One `$variants` block replaces an entire `generate*Themed()` function. The current 11
variant loops generating 137 selectors become 11 data entries — same output, ~70% fewer
bytes in the source.

---

## Part 2: The Runtime Resolver

At runtime, the resolver reads the raw definition and produces the same CSS rules object
that the current `generate*Themed()` functions produce. This is what runs in development
mode (no build step required — TACO principle 5).

### Pseudocode: `resolveComponentCSS(def, palette, layout)`

```
function resolveComponentCSS(def, palette, layout):
    result = {}

    // 1. Copy structural rules as-is (no token resolution needed)
    for each (selector, props) in def.structural:
        result[selector] = props

    // 2. Resolve themed rules
    for each (selector, props) in def.themed:

        if selector starts with '$variants':
            // Variant expansion
            block = props   // { selector, expand, rules }
            for each variantName in block.expand:
                baseSelector = block.selector.replace('{v}', variantName)
                for each (suffix, ruleProps) in block.rules:
                    fullSelector = baseSelector + suffix
                    resolvedProps = resolveTokens(ruleProps, palette, layout, variantName)
                    result[fullSelector] = resolvedProps
        else:
            // Regular themed rule
            resolvedProps = resolveTokens(props, palette, layout, null)
            result[selector] = resolvedProps

    return result


function resolveTokens(props, palette, layout, variantName):
    resolved = {}
    tokenRoots = ['palette.', 'spacing.', 'radius.', 'elevation.', 'motion.']
    for each (prop, value) in props:
        if value contains any of tokenRoots:
            resolved[prop] = expandToken(value, palette, layout, variantName)
        else:
            resolved[prop] = value
    return resolved


function expandToken(value, palette, layout, variantName):
    // Handle composite values like "1px solid palette.light.border"
    return value.replace(/(palette|spacing|radius|elevation|motion)\.([.\w{}]+)/g,
        function(match, root, path):
            pathParts = path.replace('{v}', variantName).split('.')
            switch root:
                case 'palette':   return drillDown(palette, pathParts)
                case 'spacing':   return drillDown(layout.spacing, pathParts)
                case 'radius':    return drillDown(layout.radius, pathParts)
                case 'elevation': return drillDown(layout.elevation, pathParts)
                case 'motion':    return drillDown(layout.motion, pathParts)
    )
```

### Size of the resolver

The resolver is ~40 lines of JavaScript (~800 bytes minified). It replaces the current
37 `generate*Themed()` functions totaling ~750 lines (~4KB minified). Net savings from
the resolver alone: ~3.2KB minified.

---

## Part 3: What Gets Compressed — Concrete Analysis

### Current State (measured)

```
Structural:  994 selectors,  2,440 property declarations
Themed:      257 selectors,    463 property declarations
Total:     1,251 selectors,  2,903 property declarations

Themed breakdown:
  137 variant-specific selectors (53%)  ← bulk compression target
  120 non-variant selectors

Top repeated CSS property NAMES in themed rules:
  156x  color
  128x  background-color
   72x  border-color
   26x  box-shadow
   14x  border-left
   10x  padding
    8x  border-radius
    8x  border-bottom-color
    8x  background

Top repeated CSS property NAMES in structural rules:
  160x  display
  153x  font-size
  101x  width
  100x  position
   82x  height
   77x  font-weight
   76x  margin-bottom
   74x  padding
   62x  align-items
   62x  border-radius
```

### What the dictionary substitutes

**Property name dictionary** — the 20 most common CSS property names, shortened:

| Short key | Full property name | Occurrences |
|-----------|--------------------|-------------|
| `d` | `display` | 160 |
| `fs` | `font-size` | 155 |
| `c` | `color` | 156 |
| `bg` | `background-color` | 128 |
| `w` | `width` | 101 |
| `pos` | `position` | 100 |
| `h` | `height` | 82 |
| `fw` | `font-weight` | 77 |
| `mb` | `margin-bottom` | 76 |
| `p` | `padding` | 84 |
| `bc` | `border-color` | 72 |
| `ai` | `align-items` | 62 |
| `br` | `border-radius` | 70 |
| `ml` | `margin-left` | 60 |
| `tf` | `transform` | 58 |
| `jc` | `justify-content` | 52 |
| `bd` | `border` | 49 |
| `cu` | `cursor` | 48 |
| `bs` | `box-shadow` | 26 |
| `tr` | `transition` | 3 |

**Property value dictionary** — repeated literal values:

| Short key | Full value | Occurrences |
|-----------|-----------|-------------|
| `_n` | `none` | ~40 |
| `_f` | `flex` | ~30 |
| `_b` | `block` | ~25 |
| `_if` | `inline-flex` | ~15 |
| `_ib` | `inline-block` | ~15 |
| `_r` | `relative` | ~35 |
| `_a` | `absolute` | ~30 |
| `_fx` | `fixed` | ~10 |
| `_h` | `hidden` | ~15 |
| `_p` | `pointer` | ~20 |
| `_c` | `center` | ~25 |
| `_1` | `100%` | ~30 |
| `_0` | `0` | ~40 |
| `_t` | `transparent` | ~10 |
| `_w` | `#fff` | ~15 |

### Selector trie structure

CSS selectors share massive common prefixes:

```
.bw-
  btn
    ── (base)                     structural + themed
    -primary                      themed variant
    -secondary                    themed variant
    -success                      themed variant
    ...
    -outline-primary              themed variant
    -outline-secondary            themed variant
    ...
    -block                        structural
    -group                        structural
    -lg                           themed (layout)
    -sm                           themed (layout)
    :hover                        structural
    :active                       structural
    :disabled                     structural
    :focus-visible                structural + themed
  card
    ── (base)                     structural + themed
    -primary                      themed variant
    -secondary                    themed variant
    ...
    -body                         structural + themed
    -title                        structural + themed
    -subtitle                     structural + themed
    -header                       structural + themed
    -footer                       structural + themed
    -hoverable                    structural
    -hoverable:hover              structural + themed
    -img-top                      structural
  alert
    ── (base)                     structural + themed
    -primary                      themed variant
    ...
    -dismissible                  structural
  ...
```

The prefix `.bw-` appears on 950+ of 1,251 selectors. The trie stores it once.
Sub-prefixes like `.bw-card-`, `.bw-btn-`, `.bw-alert-` each appear 10-20 times.

### Estimated byte savings

| Layer | Current (minified) | After trie+dict (minified) | Savings |
|-------|-------------------|---------------------------|---------|
| Structural rules data | ~8.5KB | ~4.5KB | ~4KB |
| Themed generators (37 functions) | ~4.0KB | ~1.8KB (definitions only) | ~2.2KB |
| Resolver function | 0 | ~0.8KB | -0.8KB |
| Trie decoder | 0 | ~0.3KB | -0.3KB |
| Dictionary table | 0 | ~0.4KB | -0.4KB |
| **Net** | **~12.5KB** | **~7.8KB** | **~4.7KB (38%)** |

After gzip (which benefits from the pre-organized patterns):

| | Current gzipped | After trie+dict gzipped | Savings |
|---|----------------|------------------------|---------|
| Styles portion | ~5.0KB | ~3.0KB | ~2KB |
| **Full UMD bundle** | **38.5KB** | **~36.5KB** | **~2KB (5%)** |

The gzip savings are smaller because gzip already finds some of the repetition. But
the minified (pre-gzip) savings are substantial, and the code becomes much more
maintainable.

---

## Part 4: The Trie Encoder (Build Step)

### When it runs

As a rollup plugin, during the pre-minify transform phase. The raw
`bitwrench-bccl-defs.js` gets imported, encoded, and the encoded form replaces the
raw definition in the bundle output.

### Encoder pseudocode

```
function encode(definitions):
    // Step 1: Collect all CSS property names across all components
    allPropNames = collectAllPropertyNames(definitions)

    // Step 2: Build property name dictionary (most frequent → shortest key)
    propDict = {}
    sorted = allPropNames.sortBy(frequency, descending)
    for i, name in sorted:
        if frequency(name) > 2:  // only dictionary-encode if saves bytes
            propDict[shortKey(i)] = name

    // Step 3: Build property value dictionary
    allValues = collectAllPropertyValues(definitions)
    valueDict = {}
    sorted = allValues.sortBy(frequency, descending)
    for i, value in sorted:
        if frequency(value) > 2 and len(value) > 3:
            valueDict['_' + shortKey(i)] = value

    // Step 4: Substitute dictionary keys into all rule objects
    for each component in definitions:
        for each layer in [component.structural, component.themed]:
            for each (selector, props) in layer:
                substitutedProps = {}
                for each (prop, value) in props:
                    shortProp = reverseLookup(propDict, prop) or prop
                    shortValue = reverseLookup(valueDict, value) or value
                    substitutedProps[shortProp] = shortValue
                layer[selector] = substitutedProps

    // Step 5: Build selector trie
    //   Group all selectors by shared prefixes
    //   Each leaf node holds its rule object (with substituted keys/values)
    trie = buildTrie(allSelectors, allRuleObjects)

    // Step 6: Serialize
    return {
        k: propDict,      // property name dictionary
        v: valueDict,      // property value dictionary
        t: trie            // compressed selector trie
    }
```

### Trie node structure

```javascript
// Each trie node is either:
//   [prefix_string, children_object]          — branch node
//   [prefix_string, children_object, rules]   — branch + leaf (has rules at this selector)
//   [prefix_string, rules]                    — pure leaf

// Example for buttons (after dictionary substitution of property names + common values):
[".bw-", {
  "btn": [
    "",                                      // prefix (empty = this node IS .bw-btn)
    {
      "-primary":  [{ c: "palette.primary.textOn", bg: "palette.primary.base", bc: "palette.primary.base" }],
      "-secondary":[{ c: "palette.secondary.textOn", bg: "palette.secondary.base", bc: "palette.secondary.base" }],
      ":hover":    [{ td: "_n", tf: "translateY(-1px)" }],
      ":disabled": [{ op: "0.5", cu: "not-allowed", pe: "_n" }],
      "-block":    [{ d: "_b", w: "_1" }]
    },
    // Rules for .bw-btn itself (property names shortened by dictionary):
    { d: "_if", ai: "_c", jc: "_c", fw: "500", lh: "1.5", ta: "_c", td: "_n",
      va: "middle", cu: "_p", us: "_n", bd: "1px solid _t", fs: "0.875rem",
      ff: "inherit", gap: "0.5rem" }
  ]
}]
```

### Trie shape: why it compresses well

The current CSS has this selector distribution:

```
.bw-btn*           ~25 selectors (base + 16 variants + sizes + states)
.bw-card*           ~15 selectors
.bw-alert*          ~12 selectors
.bw-badge*          ~10 selectors
.bw-form*           ~20 selectors
.bw-table*          ~10 selectors
.bw-nav*            ~15 selectors
.bw-col-*           ~12 selectors (grid columns — purely mechanical)
.bw-m-*/.bw-p-*     ~60 selectors (spacing utilities — purely mechanical)
...
```

The trie deduplicates the `.bw-` prefix once (stored in the root node), then each
component prefix (`btn`, `card`, `alert`) is stored once at the first branch level.
Variant suffixes (`-primary`, `-secondary`) appear once per trie level, not once per
component.

---

## Part 5: The Trie Decoder (Runtime)

### Decoder pseudocode

```
function decode(packed):
    propDict = packed.k
    valueDict = packed.v
    trie = packed.t

    // Walk the trie, reconstructing full selectors and expanding dictionaries
    rules = {}
    walkTrie(trie, '', rules, propDict, valueDict)
    return rules


function walkTrie(node, prefix, rules, propDict, valueDict):
    [nodePrefix, children_or_rules, maybe_rules] = node

    fullPrefix = prefix + nodePrefix

    // If this node has rules (leaf or branch+leaf)
    ruleObj = maybe_rules or (isRuleObject(children_or_rules) ? children_or_rules : null)
    if ruleObj:
        expandedRules = {}
        for each (shortProp, shortValue) in ruleObj:
            fullProp = propDict[shortProp] or shortProp
            fullValue = valueDict[shortValue] or shortValue
            expandedRules[fullProp] = fullValue
        rules[fullPrefix] = expandedRules

    // If this node has children (branch)
    childrenObj = isRuleObject(children_or_rules) ? null : children_or_rules
    if childrenObj:
        for each (childKey, childNode) in childrenObj:
            walkTrie(childNode, fullPrefix + childKey, rules, propDict, valueDict)
```

### Size of the decoder

The decoder is ~25 lines of ES5-compatible JavaScript. Minified: ~300 bytes. It runs
once at load time. After decoding, the result is identical to what the current
`getStructuralStyles()` and `generateThemedCSS()` produce — same object shape, same
property names, same values.

---

## Part 6: How $variants Work in the Packed Format

The variant expansion pattern is the single biggest compression opportunity. Here's
how it flows through the pipeline:

### Raw definition (development)

```javascript
'$variants': {
  selector: '.bw-badge-{v}',
  expand: ['primary', 'secondary', 'success', 'danger', 'warning', 'info', 'light', 'dark'],
  rules: {
    '': { color: 'palette.{v}.textOn', 'background-color': 'palette.{v}.base' }
  }
}
```

### After resolver (runtime, with default palette)

```javascript
// 8 selectors generated:
'.bw-badge-primary':   { color: '#fff',    'background-color': '#006666' }
'.bw-badge-secondary': { color: '#fff',    'background-color': '#6c757d' }
'.bw-badge-success':   { color: '#fff',    'background-color': '#198754' }
'.bw-badge-danger':    { color: '#fff',    'background-color': '#dc3545' }
'.bw-badge-warning':   { color: '#000',    'background-color': '#b38600' }
'.bw-badge-info':      { color: '#fff',    'background-color': '#0891b2' }
'.bw-badge-light':     { color: '#000',    'background-color': '#f8f9fa' }
'.bw-badge-dark':      { color: '#fff',    'background-color': '#212529' }
```

### In the trie (build, post-encoding)

The encoder recognizes `$variants` blocks and stores them as a special trie node type:

```javascript
// Packed format for badge variants
[".bw-badge-", {
  "$V": {                           // $V = variant expansion marker
    "e": ["primary","secondary","success","danger","warning","info","light","dark"],
    "r": { "": { c: "palette.{v}.textOn", bg: "palette.{v}.base" } }
  }
}]
```

The decoder sees `$V` and expands it, producing the same 8 selectors. But the trie
stores the pattern once instead of 8 times. Across 11 variant loops in the current
code, this saves ~100 selectors worth of storage.

### Where variant expansion gets resolved

Two options (trade-off between bundle size and runtime speed):

| Strategy | When variants expand | Bundle size | Runtime cost |
|----------|---------------------|-------------|-------------|
| **Build-time** | Rollup plugin expands variants, trie stores all 137 selectors | Larger trie | Zero |
| **Runtime** | Decoder sees `$V` nodes, expands on first call | Smaller trie | ~1ms at load |

Recommendation: **runtime expansion**. The 137 variant selectors compress to ~11 trie
pattern entries. The expansion cost is negligible (one-time, <1ms). And `generateTheme()`
already runs at page load, so adding variant expansion to that path is free.

---

## Part 7: Functions in Definitions

Some components need runtime behavior (event handlers, DOM manipulation). These live in
the `taco.o` (options) section and cannot be trie-packed. But they don't need to be —
they're already compact.

```javascript
'bw-tabs': {
  taco: {
    t: 'div', a: { class: 'bw-tabs' },
    c: [
      { t: 'ul', a: { class: 'bw-nav bw-nav-tabs' }, c: '{tabHeaders}' },
      { t: 'div', a: { class: 'bw-tab-content' }, c: '{tabPanels}' }
    ],
    o: {
      type: 'tabs',
      mounted: function(el) {
        // Tab switching logic — stays as JS, not packed
        el.querySelectorAll('.bw-nav-link').forEach(function(link) {
          link.addEventListener('click', function(e) {
            // ... tab activation logic
          });
        });
      }
    }
  },
  structural: { /* ... */ },
  themed: { /* ... */ }
}
```

**The CSS (structural + themed) gets trie-packed. The JS behavior stays as-is.**
This is the right split because:
- CSS rules are repetitive, structured data — ideal for compression
- Event handlers are unique per-component logic — already compact
- The `bitwrench-bccl-defs.js` file must remain `.js` (not `.json`) to hold these
  functions

---

## Part 8: Build Pipeline Integration

### Current build chain

```
src/bitwrench.js  ─────────┐
src/bitwrench-styles.js  ───┤
src/bitwrench-bccl.js  ─────┤── rollup ── terser ── gzip
src/bitwrench-color-utils.js┘
```

### Proposed build chain

```
src/bitwrench-bccl-defs.js ──── encode ──┐
                                          ├── inline as packed data
src/bitwrench.js  ────────────────────────┤
src/bitwrench-styles.js (resolver only) ──┤── rollup ── terser ── gzip
src/bitwrench-bccl.js  ──────────────────┤
src/bitwrench-color-utils.js ────────────┘
```

### Rollup plugin: `rollup-plugin-bccl-pack`

```javascript
// tools/rollup-plugin-bccl-pack.js
export default function bcclPack() {
  return {
    name: 'bccl-pack',
    transform(code, id) {
      if (!id.endsWith('bitwrench-bccl-defs.js')) return null;

      // 1. Import and evaluate the raw definitions
      const defs = evaluateModule(code);

      // 2. Separate CSS data from JS functions
      const cssData = extractCSSLayers(defs);
      const jsBehavior = extractBehavior(defs);

      // 3. Encode CSS into trie + dictionary
      const packed = encode(cssData);

      // 4. Emit replacement module
      return {
        code: `
          var _packed = ${JSON.stringify(packed)};
          var _behavior = ${serializeBehavior(jsBehavior)};
          export default { packed: _packed, behavior: _behavior };
        `,
        map: null
      };
    }
  };
}
```

### Development mode (no build)

In development, `bitwrench-bccl-defs.js` is imported as-is. The resolver reads the raw
definitions directly — no encoding or decoding. This means:

- Zero build step required for development (TACO principle 5)
- `npm run build` produces the optimized bundle with trie packing
- The resolver handles both raw and packed input (checks for `.packed` property)

---

## Part 9: Consistency Wins from the Format

### What the definition format exposes

By forcing every component through the same `{ taco, structural, themed }` structure,
the format makes inconsistencies glaringly obvious:

1. **Components with inline styles but no structural CSS**: The analysis found 21
   inline style instances. In the definition format, these would show up as empty
   `structural` sections with hardcoded values in `taco.a.style` — a visible smell.

2. **Components that define variant colors differently**: Currently `bw-btn-primary`
   uses `{ color: textOn, bg: base, border: base }` while `bw-alert-primary` uses
   `{ color: darkText, bg: light, border: border }`. These are intentionally different
   patterns (buttons are filled, alerts are tinted). But the definition format makes
   the two patterns explicit and auditable.

3. **Components with no themed CSS**: 105 classes have structural CSS but zero themed
   coverage. The definition format would show `themed: {}` — making it easy to ask
   "should this component respond to themes or not?"

4. **14 classes with zero CSS anywhere**: Classes like `bw-tabs`, `bw-step-pending`,
   `table-responsive` are emitted by make* functions but have no CSS rules. The
   definition format would either include them (with rules) or remove them from the
   TACO — no phantom classes.

### Hardcoded colors that should be palette references

The themed generators have **36 hardcoded color literals** that bypass the palette
entirely. When someone calls `generateTheme('ocean', {...})`, these values don't change
— they stay as `#fff` regardless of the theme. This is why theme switching doesn't feel
complete.

| Hardcoded value | Count | Where | Should be |
|-----------------|-------|-------|-----------|
| `#fff` | 20 | card bg, form-control bg, list-group bg, modal bg, toast bg, dropdown bg, accordion bg, pagination bg, disabled bg, progress text, navbar dark text, carousel text, range thumb border, code btn text | `palette.light.textOn` for text, a new `surface` token for backgrounds |
| `#f5f5f5` | 1 | body background | `palette.light.light` |
| `rgba(0,0,0,0.08-0.16)` | 6 | card shadow, hoverable shadow, modal shadow, toast shadow, dropdown shadow | `elevation` tokens (already exist but not used here) |
| `rgba(0,0,0,0.4-0.6)` | 3 | carousel overlay, caption gradient | `overlay` token (new) |
| `rgba(0,0,0,0.05-0.15)` | 4 | striped table, progress inset, toast border, separator | `palette.dark` with alpha, or `separator` token |
| `rgba(255,255,255,*)` | 2 | navbar dark link, code btn hover | `palette.light` with alpha |

In the definition format, none of these would exist. Every color value is either a
`palette.*` reference or a new semantic token (`surface`, `overlay`, `separator`).
The definition format makes it structurally impossible to introduce a hardcoded color.

### CSS fat to trim

Based on the analysis YAML, candidates for consolidation:

| Current (per-component) | Proposed (shared) | Savings |
|--------------------------|-------------------|---------|
| `.bw-card-subtitle { color: palette.secondary.base }` | Use `.bw-text-muted` class | 1 selector |
| `.bw-section-subtitle { color: palette.secondary.base }` | Use `.bw-text-muted` class | 1 selector |
| `.bw-feature-description { color: palette.secondary.base }` | Use `.bw-text-muted` class | 1 selector |
| `.bw-cta-description { color: palette.secondary.base }` | Use `.bw-text-muted` class | 1 selector |
| `.bw-timeline-date { color: palette.secondary.base }` | Use `.bw-text-muted` class | 1 selector |
| `.bw-stat-card-{v} { border-left-color }` | Same pattern as `.bw-card-{v}` | merge |
| `.bw-toast-{v} { border-left: 4px solid }` | Same pattern as `.bw-card-{v}` | merge |

These are small wins individually, but the definition format makes them visible. More
importantly, it prevents future components from reinventing the pattern — authors see
the existing `$variants` blocks and reuse them.

---

## Part 10: Migration Path

### Phase 1: Write the raw definitions

Create `src/bitwrench-bccl-defs.js` containing all 51 components in the raw format.
This is a data migration — the CSS rules already exist in `bitwrench-styles.js`, we're
just restructuring them into per-component definitions. The `make*()` functions in
`bitwrench-bccl.js` start reading TACO structure from the definitions instead of
hardcoding it.

**Validation**: `resolveComponentCSS(def, palette, layout)` output must match
`generateThemedCSS() + getStructuralStyles()` output selector-for-selector. Write a
test that compares them.

### Phase 2: Replace generators with resolver

Delete the 37 `generate*Themed()` functions and `structuralRules` from
`bitwrench-styles.js`. Replace with the single `resolveComponentCSS()` function that
reads from the definitions. The file drops from ~2,200 lines to ~400 lines.

**Validation**: All 632+ tests pass. Visual regression check on all pages.

### Phase 3: Write the encoder + rollup plugin

Implement `tools/bccl-encoder.js` (the trie packer + dictionary builder) and
`tools/rollup-plugin-bccl-pack.js`. Add the plugin to `rollup.config.js`.

**Validation**: `npm run build` produces a working bundle. Minified size is smaller.
Decoded output matches raw resolver output.

### Phase 4: Measure and tune

Compare bundle sizes. Adjust dictionary thresholds (minimum frequency for inclusion).
Profile runtime decoder performance. Verify all theme presets produce correct CSS.

---

## Appendix A: Numeric Encoding — Hex Sixteenths

All spacing and font-size values in the system land on a 1/16 rem grid (382 of 470
decimal occurrences). This means every spatial value can be encoded as hex digits
where the last digit is the fractional sixteenth:

```
CSS value     Hex    Decode: integer part = hex[0:-1], fraction = hex[-1]/16
─────────     ───    ─────────────────────────────────────────────────────────
0.5rem        8      0 + 8/16 = 0.5
0.875rem      e      0 + 14/16 = 0.875
1.25rem       14     1 + 4/16 = 1.25
1.5rem        18     1 + 8/16 = 1.5
0.0625rem     1      0 + 1/16 = 0.0625
2.0rem        20     2 + 0/16 = 2.0
```

A value that's currently `'0.875rem'` (8 characters) becomes `'e'` (1 character).
Across 382 occurrences this is significant.

## Appendix B: Pair Dictionary — 2-Hex-Digit Declaration Codes

Taking it further: many complete property+value declarations repeat across components.
The system has 753 unique declarations, but the top 256 cover **70.4% of all 2,582
declarations** (1,817 occurrences). An array of 256 strings, indexed by a single byte
(2 hex chars), encodes any of these as a 2-character code.

```javascript
// Dictionary is just an array — index IS the code
var D = [
  'display: flex',              // 0x00 → "00"   (71 occurrences)
  'position: relative',         // 0x01 → "01"   (44 occurrences)
  'font-size: 0.875rem',        // 0x02 → "02"   (39 occurrences)
  'align-items: center',        // 0x03 → "03"   (39 occurrences)
  'color: #fff',                // 0x04 → "04"   (29 occurrences)
  'width: 100%',                // 0x05 → "05"   (28 occurrences)
  'cursor: pointer',            // 0x06 → "06"   (28 occurrences)
  'font-weight: 600',           // 0x07 → "07"   (27 occurrences)
  'position: absolute',         // 0x08 → "08"   (27 occurrences)
  // ... 247 more entries
];

// A component rule becomes an array of indices:
// .bw-btn { display: inline-flex; align-items: center; cursor: pointer; ... }
// → [0x12, 0x03, 0x06, ...]    (if inline-flex is at index 0x12)
```

The decoder splits the hex string into pairs, indexes into the array, and
reconstructs full CSS declarations. Declarations not in the dictionary are stored
inline as-is — the encoder only substitutes when it saves bytes.

Combined with the selector trie, a typical component rule like:

```
.bw-card-body { flex: 1 1 auto; display: flex; flex-direction: column }
```

becomes a trie leaf at path `.bw- → card- → body` containing `[0x2a, 0x00, 0x0f]`
(three array indices). That's 6 hex characters for 3 declarations that would otherwise
be ~60 characters of CSS property text in the minified bundle.

---

## Appendix C: Relationship to triepack

The selector trie structure is directly inspired by
[triepack](https://github.com/deftio/triepack) — a general-purpose trie compression
library by the same author. Key differences for this use case:

- **triepack** compresses arrays of strings into a trie. Here we compress
  selector-to-rules mappings — the trie keys are selectors, the leaves are rule objects.
- **triepack** uses a compact binary/string encoding. Here we use JSON-serializable
  arrays because the output goes through rollup/terser which has its own minification.
- The dictionary layer (property name + value substitution) is new — triepack doesn't
  do this because it operates on opaque strings, while we can exploit the structured
  nature of CSS property declarations.

A future optimization could use triepack directly for the selector strings and add the
rule-object layer on top. But the JSON-array approach is simpler to implement and debug.

## Appendix D: Class String Dictionary — Canonical Sorting + Combined Entries

### The insight

Every BCCL component emits TACO with `a: { class: "bw-card bw-card-primary" }`. These
class attribute strings are themselves highly repetitive — especially once you expand all
variants. With variant expansion across all 51 make*() functions:

- **386 class attribute strings** emitted total
- **230 unique** literal strings
- **124 unique** when variant/size names are replaced with `{v}`/`{sz}` templates

By canonically sorting class names within each attribute (alphabetical), identical
combinations always produce the same string regardless of the order the author wrote them.
This makes combined class strings reliable dictionary entries.

### Two layers of compression

**Layer 1 — Literal class string dictionary** (like the CSS pair dictionary):

Strings appearing 2+ times become dictionary entries. 45 multi-use strings cover 201 of
386 total class attributes. With 2-hex-digit codes:

- Raw bytes (multi-use): 3,057
- With dictionary: 1,143
- **Saved: 1,914 bytes (22.2% of total class attr bytes)**

Top entries:

| Code | Count | Sorted class string |
|------|-------|---------------------|
| `00` | 17 | `bw-close` |
| `01` | 16 | `bw-visually-hidden` |
| `02` | 8 | `bw-card-body` |
| `03` | 8 | `bw-card-title` |
| `04` | 8 | `bw-toast-header` |
| `05` | 8 | `bw-progress` |
| `06` | 8 | `bw-stat-value` |
| `07` | 8 | `bw-stat-label` |
| `08` | 8 | `bw-list-group-item` |
| `09` | 8 | `bw-timeline-item` |

**Layer 2 — Template expansion** (stores pattern once, expands at resolve time):

The pattern `bw-X bw-X-{v}` accounts for 14.8% of all class attributes. Instead of
storing 8 expanded strings, store one template:

```javascript
// Instead of 8 strings:
//   "bw-card bw-card-primary"    (23 chars)
//   "bw-card bw-card-secondary"  (25 chars)
//   "bw-card bw-card-success"    (23 chars)
//   ... 5 more = ~184 bytes total

// Store once:
{ template: 'bw-card bw-card-{v}', expand: VARIANTS }  // ~35 bytes
```

Template compression alone saves **~3,782 bytes** across all variant-expanded class
strings (raw ~4,460 → compact ~678).

### Canonical sort order

BCCL already emits classes in a consistent order (analysis found 0 duplicates collapsed by
sorting). The value of enforcing canonical sorting is **forward-looking**:

1. **Future components** automatically produce dictionary-friendly strings
2. **User-authored TACO** that uses the same utility class combo hits the dictionary too
3. **Utility class combos become single entries** — `bw-mb-3 bw-text-primary` is one
   string when sorted, regardless of whether the author wrote `bw-text-primary bw-mb-3`

Sort rule: alphabetical by full class name. Simple, deterministic, no configuration.

### Combined with CSS declaration dictionary

The class string dictionary and the CSS declaration dictionary (Appendix B) are
orthogonal. They compress different parts of the same component definition:

```
BCCL component definition
├── taco.a.class  →  class string dictionary  (Appendix D)
├── structural    →  CSS declaration dictionary (Appendix B) + selector trie
└── themed        →  CSS declaration dictionary (Appendix B) + selector trie + token refs
```

Both dictionaries can share the same array format — or even be a single unified array
where indices 0x000–0x2FF are CSS declarations and 0x300–0x3FF are class strings.
Since we have 706 CSS pairs and ~124 class templates, a single 1024-entry array (3 hex
digits) covers everything.
