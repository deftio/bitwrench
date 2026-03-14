# Array Shorthand for TACO

**Status**: Design discussion (not yet implemented)
**Author**: M. Chatterjee / deftio
**Date**: March 2026

---

## Problem

TACO objects are self-documenting and unambiguous, but they're visually heavy for simple nodes:

```javascript
// 56 characters for a div with a class and text
{ t: 'div', a: { class: 'bw_py_4' }, c: 'hello' }

// 33 characters for a paragraph
{ t: 'p', c: 'Hello world' }
```

In practice, most raw TACO in user code is structural glue — wrapper divs, footers, headings — where the `t:`, `a:`, `c:` keys feel like ceremony. The `make*()` factories absorb the bulk of component complexity, but the connective tissue between them is all raw TACO.

This matters because bitwrench examples are meant to be read via View Source. Verbosity in the glue code obscures the compositional pattern we're trying to teach.

## Non-negotiable constraints

1. **TACO `{t,a,c,o}` remains the canonical form.** Array shorthand is sugar that normalizes to TACO internally. All downstream code (`bw.html()`, `bw.createDOM()`, `bw.DOM()`, `bw.patch()`, `make*()` return values) continues to use TACO objects.

2. **`o` stays separate from `a`.** `a` is HTML-attribute-compliant (anything you'd put in a real HTML tag). `o` is bitwrench-private (state, lifecycle hooks, render functions). This separation guarantees no name collisions with future HTML spec changes and keeps the serialization boundary clean.

3. **Serializability is preserved.** Array shorthand can be JSON-serialized (modulo functions, same as TACO). This is critical for bwserve (sending UI over SSE/WS), LLM generation (models output JSON, not function calls), and CLI tooling.

4. **No ambiguity.** There must never be a case where the same array could reasonably mean two different things. The user should never have to think about disambiguation rules.

## Why not `bw.h()`?

A hyperscript-style helper function is the industry-standard solution to this problem (Mithril's `m()`, React's `createElement()`, hyperscript's `h()`):

```javascript
bw.h('div', { class: 'bw_py_4' }, 'hello')
```

It solves ambiguity naturally — a function call is always a node, an array is always children. But it **loses serializability**. You can't `JSON.stringify()` a tree of `bw.h()` calls. You can't send them over bwserve. An LLM can't generate them without a JavaScript runtime.

However, `bw.h()` is still useful as a **convenience helper that returns TACO**:

```javascript
bw.h = function(tag, attrs, content, options) {
  var taco = { t: tag };
  if (attrs)   taco.a = attrs;
  if (content !== undefined) taco.c = content;
  if (options) taco.o = options;
  return taco;
};

// Usage — returns a plain TACO object:
bw.h('div', { class: 'bw_py_4' }, 'hello')
// → { t: 'div', a: { class: 'bw_py_4' }, c: 'hello' }
```

This is purely ergonomic — fewer keystrokes to produce TACO. The output is still serializable, still works with bwserve, still works with every existing function. It's additive and safe.

**Recommendation**: Ship `bw.h()` regardless of whether array shorthand is adopted. It's simple, useful, and risk-free.

## Array shorthand: strict positional mapping

### The rule

Array length determines the mapping. No heuristics, no tag-name lookup, no content inspection.

| Length | Positions | Example | Equivalent TACO |
|--------|-----------|---------|-----------------|
| 0 | (empty) | `[]` | `{ c: '' }` |
| 1 | `[c]` | `['hello']` | `{ c: 'hello' }` |
| 2 | `[t, c]` | `['div', 'hello']` | `{ t: 'div', c: 'hello' }` |
| 3 | `[t, a, c]` | `['div', {class:'x'}, 'hello']` | `{ t: 'div', a: {class:'x'}, c: 'hello' }` |
| 4 | `[t, a, c, o]` | `['div', {}, 'hello', {mounted:fn}]` | `{ t: 'div', a: {}, c: 'hello', o: {mounted:fn} }` |

The normalizer is trivial — a `switch` on `node.length`. No sniffing, no guessing.

### The children-array problem

The strict positional rule creates one tension: when `c` is an array, is it a single child node (array shorthand) or a list of children?

```javascript
// Is this a [t,c] node or an array of two children?
['p', 'hello']
```

Under strict rules, it's always `[t, c]` → `{ t: 'p', c: 'hello' }`. Unambiguous.

But what about passing multiple children?

```javascript
// I want: <div><p>one</p><p>two</p></div>
// This WON'T work — ['p','one'] is treated as a single [t,c] node in the c position
['div', ['p', 'one']]  // → { t: 'div', c: { t: 'p', c: 'one' } }
```

### Solution: arrays in c-position are always content arrays

When the c-position value is itself an array, it is treated as an **array of children** (not as a single array-shorthand node). Each element of that array is then independently normalized.

```javascript
// Single string content
['div', 'hello']
// → { t: 'div', c: 'hello' }

// Single TACO child
['div', { t: 'p', c: 'hello' }]
// → { t: 'div', c: { t: 'p', c: 'hello' } }

// Single make*() child
['div', bw.makeCard({ title: 'hi' })]
// → { t: 'div', c: <taco from makeCard> }

// Multiple children — c is an array, each element normalized
['div', [
  ['p', 'first'],      // each child is independently normalized
  ['p', 'second']
]]
// → { t: 'div', c: [
//      { t: 'p', c: 'first' },
//      { t: 'p', c: 'second' }
//    ]}
```

#### The ambiguous case: single array-shorthand child

```javascript
// I want: <div><p>hello</p></div> — a div with ONE child p
['div', ['p', 'hello']]
```

Under the "arrays in c are children lists" rule, this becomes:
`c = ['p', 'hello']` → array of two children → `'p'` (string) and `'hello'` (string)
→ `{ t: 'div', c: ['p', 'hello'] }` — a div with two text nodes "p" and "hello". **Wrong.**

To get a single array-shorthand child, you have three options:

**Option A: Double brackets** — wrap in a children array of one:
```javascript
['div', [['p', 'hello']]]
// → { t: 'div', c: [{ t: 'p', c: 'hello' }] }
```

**Option B: Use TACO for the inner node** — mix forms freely:
```javascript
['div', { t: 'p', c: 'hello' }]
// → { t: 'div', c: { t: 'p', c: 'hello' } }
```

**Option C: Use `bw.h()` for the inner node:**
```javascript
['div', bw.h('p', null, 'hello')]
// → { t: 'div', c: { t: 'p', c: 'hello' } }
```

Options B and C are natural — you're mixing TACO and shorthand, which is explicitly supported. Option A works but adds bracket noise.

### The practical reality

How often does the ambiguous case actually occur? The c-position value is typically one of:

| c value | Frequency | Ambiguous? |
|---------|-----------|------------|
| String | Very common | No |
| `make*()` return (TACO obj) | Very common | No |
| Array of multiple children | Common | No (naturally needs `[...]` wrapper) |
| Single TACO object child | Occasional | No |
| Single array-shorthand child, no siblings | Rare | **Yes** — needs `[[...]]` or TACO |

The ambiguous case (a parent with exactly one child, where that child is written in array shorthand) is uncommon. Most single-child wrappers have string or `make*()` content. Most array-shorthand nodes appear as siblings in a children list, where the `[...]` wrapper is already present.

## Normalization function

```javascript
/**
 * Convert array shorthand to canonical TACO.
 * Accepts TACO objects, strings, numbers, and array shorthand.
 * Returns canonical TACO (or passes through strings/numbers).
 *
 * @param {*} node - TACO object, string, number, or array shorthand
 * @returns {*} Canonical TACO object (or string/number)
 */
function normalizeTaco(node) {
  var nt = bw.typeOf(node);

  // Strings and numbers pass through (text nodes)
  if (nt === 'string' || nt === 'number') return node;

  // Null/undefined → empty string
  if (nt === 'null' || nt === 'undefined') return '';

  // Already a TACO object — normalize its c value recursively
  if (nt === 'object') {
    if (node.c !== undefined) {
      node.c = normalizeContent(node.c);
    }
    return node;
  }

  // Array shorthand
  if (nt === 'array') {
    var taco = {};
    switch (node.length) {
      case 0:
        return '';
      case 1:
        // [c] — content only (implicit div? or just content?)
        taco.c = normalizeContent(node[0]);
        break;
      case 2:
        // [t, c]
        taco.t = node[0];
        taco.c = normalizeContent(node[1]);
        break;
      case 3:
        // [t, a, c]
        taco.t = node[0];
        taco.a = node[1];
        taco.c = normalizeContent(node[2]);
        break;
      case 4:
        // [t, a, c, o]
        taco.t = node[0];
        taco.a = node[1];
        taco.c = normalizeContent(node[2]);
        taco.o = node[3];
        break;
      default:
        // 5+ elements: treat as [t, a, c, o, ...ignored]
        taco.t = node[0];
        taco.a = node[1];
        taco.c = normalizeContent(node[2]);
        taco.o = node[3];
        break;
    }
    return taco;
  }

  // Anything else passes through
  return node;
}

/**
 * Normalize a content value (the c-position).
 * If it's an array, each element is normalized as a child node.
 * Otherwise, normalized as a single value.
 */
function normalizeContent(c) {
  var ct = bw.typeOf(c);
  if (ct === 'array') {
    // Array = children list — normalize each element
    return c.map(normalizeTaco);
  }
  // Single value — could be string, TACO object, or nested array-shorthand
  // For non-arrays, just normalize as a node
  return normalizeTaco(c);
}
```

### Where normalization is applied

Normalization happens at the **entry points** — the functions that accept user-provided TACO:

- `bw.html(node)` — normalize `node` before processing
- `bw.createDOM(node)` — normalize `node` before processing
- `bw.DOM(selector, node)` — normalize `node` before processing

The `make*()` factories do NOT need changes — they already return canonical TACO objects. If a user passes array shorthand as a child to a `make*()` call (e.g., in `content:` or `children:`), the factory passes it through as the `c` value, and normalization catches it at the entry point.

## `bw.h()` specification

Regardless of array shorthand, `bw.h()` is a useful convenience:

```javascript
/**
 * Hyperscript-style TACO constructor.
 * Returns a canonical TACO object.
 *
 * @param {string} tag - HTML tag name
 * @param {Object} [attrs] - HTML attributes (pass null to skip)
 * @param {*} [content] - Content (string, TACO, array of children)
 * @param {Object} [options] - TACO options (state, lifecycle hooks)
 * @returns {Object} TACO object
 */
bw.h = function(tag, attrs, content, options) {
  var taco = { t: tag };
  if (attrs !== null && attrs !== undefined)   taco.a = attrs;
  if (content !== undefined) taco.c = content;
  if (options !== undefined) taco.o = options;
  return taco;
};
```

Key behaviors:
- `bw.h('div')` → `{ t: 'div' }`
- `bw.h('div', null, 'hello')` → `{ t: 'div', c: 'hello' }`
- `bw.h('p', { class: 'x' }, 'text')` → `{ t: 'p', a: { class: 'x' }, c: 'text' }`
- `bw.h('div', null, [child1, child2])` → `{ t: 'div', c: [child1, child2] }`
- Returns a plain TACO object — serializable, works with bwserve, works everywhere

## Test-driven design (TDD cases)

These tests define the contract. Implementation must pass all of them.

### Basic normalization

```javascript
// Strings pass through
normalize('hello')           // → 'hello'
normalize('')                // → ''

// Numbers pass through
normalize(42)                // → 42
normalize(0)                 // → 0

// Null/undefined → empty string
normalize(null)              // → ''
normalize(undefined)         // → ''

// TACO objects pass through (with recursive c normalization)
normalize({ t: 'div', c: 'hello' })
// → { t: 'div', c: 'hello' }

normalize({ t: 'div', a: { class: 'x' }, c: 'y', o: { state: {} } })
// → unchanged
```

### Length 0: empty

```javascript
normalize([])                // → ''
```

### Length 1: content only

```javascript
normalize(['hello'])         // → { c: 'hello' }
normalize([42])              // → { c: 42 }
normalize([{ t: 'p', c: 'x' }])  // → { c: { t: 'p', c: 'x' } }
```

### Length 2: tag + content

```javascript
normalize(['div', 'hello'])
// → { t: 'div', c: 'hello' }

normalize(['p', 'text'])
// → { t: 'p', c: 'text' }

// c is a TACO object (single child)
normalize(['div', { t: 'p', c: 'inner' }])
// → { t: 'div', c: { t: 'p', c: 'inner' } }

// c is a make*() return (TACO object, single child)
normalize(['div', bw.makeCard({ title: 'hi' })])
// → { t: 'div', c: <taco from makeCard> }

// c is a string that happens to be an HTML tag name — still just text
normalize(['div', 'span'])
// → { t: 'div', c: 'span' }

// c is an array → children list, each element normalized
normalize(['div', ['hello', 'world']])
// → { t: 'div', c: ['hello', 'world'] }

normalize(['div', [['p', 'one'], ['p', 'two']]])
// → { t: 'div', c: [{ t: 'p', c: 'one' }, { t: 'p', c: 'two' }] }
```

### Length 3: tag + attrs + content

```javascript
normalize(['div', { class: 'bw_py_4' }, 'hello'])
// → { t: 'div', a: { class: 'bw_py_4' }, c: 'hello' }

normalize(['a', { href: '/about' }, 'About'])
// → { t: 'a', a: { href: '/about' }, c: 'About' }

// c is an array → children list
normalize(['div', { class: 'x' }, [
  ['p', 'first'],
  ['p', 'second']
]])
// → { t: 'div', a: { class: 'x' }, c: [
//      { t: 'p', c: 'first' },
//      { t: 'p', c: 'second' }
//    ]}

// Empty attrs
normalize(['div', {}, 'content'])
// → { t: 'div', a: {}, c: 'content' }
```

### Length 4: tag + attrs + content + options

```javascript
var mountFn = function(el) { console.log('mounted'); };

normalize(['div', { class: 'x' }, 'hello', { mounted: mountFn }])
// → { t: 'div', a: { class: 'x' }, c: 'hello', o: { mounted: mountFn } }

normalize(['div', {}, 'content', { state: { count: 0 } }])
// → { t: 'div', a: {}, c: 'content', o: { state: { count: 0 } } }
```

### Deep nesting — mixed TACO and array shorthand

```javascript
// Array shorthand containing TACO objects as children
normalize(['div', [
  { t: 'h1', c: 'Title' },         // TACO object child
  ['p', 'Paragraph'],               // Array shorthand child
  'Just a string',                   // Text node child
  bw.makeButton({ text: 'Click' })  // make*() return child
]])
// → { t: 'div', c: [
//      { t: 'h1', c: 'Title' },
//      { t: 'p', c: 'Paragraph' },
//      'Just a string',
//      <taco from makeButton>
//    ]}

// TACO object with array shorthand in c
normalize({ t: 'div', c: ['p', 'hello'] })
// → { t: 'div', c: [{ t: 'p', c: 'hello' }] }
// Wait — this is ambiguous! See "Existing TACO compatibility" below.
```

### Existing TACO compatibility (CRITICAL)

**Today, TACO's `c` accepts arrays as children lists:**

```javascript
// This EXISTING code must continue to work:
{ t: 'div', c: ['hello', 'world'] }
// → a div with two text-node children
```

If we apply normalization to TACO objects' `c` values, and `c` is an array, each element gets normalized. For `['hello', 'world']`, each element is a string, so normalization is a no-op. **Existing behavior preserved.**

But what about:

```javascript
// Existing: a div with two TACO children
{ t: 'div', c: [
  { t: 'p', c: 'one' },
  { t: 'p', c: 'two' }
]}
```

Each element is a TACO object → normalization passes through. **Existing behavior preserved.**

What about this new edge case:

```javascript
// New: does this mean [t,c] shorthand or two string children?
{ t: 'div', c: ['p', 'hello'] }
```

Today, this means a div with two text children: `"p"` and `"hello"`. With normalization, `['p', 'hello']` would become `{ t: 'p', c: 'hello' }` — **breaking change!**

**Resolution**: Normalization of arrays ONLY applies when the array is encountered as a **top-level node** (argument to `bw.html()`, `bw.createDOM()`, `bw.DOM()`), NOT when it's a `c` value of an existing TACO object. TACO objects' `c` arrays are always treated as children lists (existing behavior). Array shorthand only activates at the entry point.

Actually, this creates a two-tier system that's confusing. A cleaner resolution:

**Alternative resolution**: Array shorthand is ONLY recognized at the top level and as elements within a `c` children array. A 2-element array like `['p', 'hello']` is only treated as `[t, c]` if it appears as:
1. The top-level argument to `bw.html()` / `bw.createDOM()` / `bw.DOM()`
2. An element inside a children array whose parent was already identified as a node

This means normalization is contextual — an array is `[t,a,c,o]` when it's a node, and `[child, child, ...]` when it's in the c-position of a TACO object.

**This is the core design tension. See "Open Questions" below.**

### The single-array-child case

```javascript
// I want: <div><p>hello</p></div>

// Option A: double brackets (p is in a children array)
normalize(['div', [['p', 'hello']]])
// → { t: 'div', c: [{ t: 'p', c: 'hello' }] }

// Option B: use TACO for the inner node
normalize(['div', { t: 'p', c: 'hello' }])
// → { t: 'div', c: { t: 'p', c: 'hello' } }

// Option C: use bw.h() for the inner node
normalize(['div', bw.h('p', null, 'hello')])
// → { t: 'div', c: { t: 'p', c: 'hello' } }
```

### `bw.h()` tests

```javascript
// Basic
bw.h('div')                              // → { t: 'div' }
bw.h('div', null, 'hello')               // → { t: 'div', c: 'hello' }
bw.h('p', { class: 'x' }, 'text')        // → { t: 'p', a: { class: 'x' }, c: 'text' }

// With options
bw.h('div', {}, 'hi', { state: { n: 0 } })
// → { t: 'div', a: {}, c: 'hi', o: { state: { n: 0 } } }

// Null attrs skipped
bw.h('span', null, 'text')               // → { t: 'span', c: 'text' }

// Children array
bw.h('ul', null, [
  bw.h('li', null, 'one'),
  bw.h('li', null, 'two')
])
// → { t: 'ul', c: [{ t: 'li', c: 'one' }, { t: 'li', c: 'two' }] }

// Return value is serializable
JSON.parse(JSON.stringify(bw.h('div', { id: 'x' }, 'hello')))
// → { t: 'div', a: { id: 'x' }, c: 'hello' }
```

### Real-world example: showcase footer

```javascript
// Current TACO
var footer = {
  t: 'footer', a: { class: 'bw_bg_dark bw_text_light bw_py_4 bw_text_center' },
  c: [
    { t: 'p', a: { class: 'bw_mb_1' }, c: 'Pulse Analytics \u00A9 2026.' },
    { t: 'p', a: { class: 'bw_text_muted' }, c: {
      t: 'a', a: { href: 'https://github.com/deftio/bitwrench' }, c: 'View on GitHub'
    }}
  ]
};

// Array shorthand
var footer = ['footer', { class: 'bw_bg_dark bw_text_light bw_py_4 bw_text_center' }, [
  ['p', { class: 'bw_mb_1' }, 'Pulse Analytics \u00A9 2026.'],
  ['p', { class: 'bw_text_muted' }, [
    ['a', { href: 'https://github.com/deftio/bitwrench' }, 'View on GitHub']
  ]]
]];

// bw.h()
var h = bw.h;
var footer = h('footer', { class: 'bw_bg_dark bw_text_light bw_py_4 bw_text_center' }, [
  h('p', { class: 'bw_mb_1' }, 'Pulse Analytics \u00A9 2026.'),
  h('p', { class: 'bw_text_muted' },
    h('a', { href: 'https://github.com/deftio/bitwrench' }, 'View on GitHub')
  )
]);

// All three produce identical TACO after normalization
```

## Documentation Strategy

### Principle: TACO first, shorthand second

Users must internalize `{t, a, c, o}` before seeing any shorthand. TACO is the mental model — shorthand is a typing convenience for people who already understand the model. Getting this order wrong means users adopt shorthand as "the way," hit the ambiguity wall, and blame bitwrench.

### Teaching order across docs/examples

**Layer 1: TACO only (first contact)**
All introductory material uses `{t, a, c, o}` exclusively:
- Quick Start page
- First three example pages (components, tables/forms, styling)
- API reference (primary examples)
- README quick-start snippet

The goal: a user who reads only Layer 1 can build complete UIs and never feel like something is missing. TACO is not "the verbose form" — it's the real form.

**Layer 2: `bw.h()` as helper (intermediate)**
Introduced after users have built at least one multi-section page in TACO:
- "Concise Syntax" section on the examples site (after state management, before advanced topics)
- Framed as: "Now that you know TACO, here's a convenience for writing it faster"
- Emphasize: `bw.h()` returns a plain TACO object — same thing, fewer keystrokes
- Show: `var h = bw.h;` alias pattern for compact code
- Show: mixing `h()` calls with `make*()` returns and raw TACO

**Layer 3: Array shorthand (advanced, v2.1.0+)**
A dedicated section titled something like "Array Shorthand" or "Compact Notation":
- Opens with: "For experienced bitwrench users who want terser syntax for structural nodes"
- The rule table (length → positions) up front
- Caveats immediately after the rule, not buried:
  1. Single array-shorthand child needs double brackets or TACO: `[['p', 'hello']]` or `{t:'p', c:'hello'}`
  2. For anything with `o` (lifecycle, render, state), use full TACO — shorthand saves nothing
  3. `make*()` returns are already TACO — shorthand is for the glue between them
- Side-by-side comparison: same component in TACO, `bw.h()`, and array shorthand
- Explicit statement: "All three forms produce identical TACO. Use whichever is clearest for your context."

### API reference treatment

Every function that accepts TACO (`bw.html()`, `bw.createDOM()`, `bw.DOM()`) documents the primary signature with TACO objects. A "Also accepts" note mentions `bw.h()` return values and (once shipped) array shorthand, linking to the dedicated section.

### Example pages

Existing examples stay in TACO. New examples may use `bw.h()` for glue code if it's shipped, but always with a comment on first use:

```javascript
// bw.h(tag, attrs, content) returns a TACO object — see "Concise Syntax"
var h = bw.h;
```

Array shorthand appears only in its dedicated example/section, never in the primary examples. Users who want it will find it; users who don't will never be confused by it.

### Error messages

If array shorthand is enabled and a user hits the single-child ambiguity:

```javascript
// If we can detect the likely mistake:
// ['div', ['p', 'hello']]  ← probably wanted a single <p> child, got two text nodes
```

Consider a `bw.debug` warning: "Array in c-position treated as children list. For a single array-shorthand child, use double brackets `[['p', 'hello']]` or TACO `{t:'p', c:'hello'}`."

---

## Open questions

### 1. Backward compatibility of `c` arrays in TACO objects

Today: `{ t: 'div', c: ['p', 'hello'] }` means two text children `"p"` and `"hello"`.

With normalization: each element of a `c` array is normalized. `'p'` → `'p'` (string, no change). `'hello'` → `'hello'` (string, no change). **No breakage for string/TACO children.**

But: `{ t: 'div', c: [['p', 'hello'], ['span', 'world']] }` — today this is an array with two array children (probably a bug or unused pattern). With normalization, each inner array becomes a TACO node. This is probably the *intended* behavior anyway, but it's technically a semantic change.

**Mitigation**: Audit existing code and tests for arrays-of-arrays in `c` values. If none exist, the risk is zero.

### 2. Should the 1-element form `[c]` imply a tag?

Options:
- `['hello']` → `{ c: 'hello' }` (tagless, just content — let bw.html() handle default tag)
- `['hello']` → `{ t: 'div', c: 'hello' }` (implicit div)
- `['hello']` → `'hello'` (unwrap, treat as plain text)

Recommendation: `{ c: 'hello' }` — tagless. The existing TACO convention is that omitting `t` is valid (defaults to `div` in rendering). Keep array shorthand consistent with TACO semantics.

### 3. Implementation timeline

`bw.h()` is trivial (5 lines, no risk) and can ship immediately.

Array shorthand normalization touches `bw.html()`, `bw.createDOM()`, and `bw.DOM()` — the three most foundational functions. It wants:
- Comprehensive TDD coverage (the test cases in this doc)
- Backward compatibility audit (no existing `c` arrays break)
- Performance benchmark (normalization adds a traversal step)

Suggested timeline: `bw.h()` in v2.0.x, array shorthand in v2.1.0 with full test suite.

### 4. The single-array-child bracket tax

The one case where array shorthand requires extra syntax:

```javascript
// A p containing a single anchor — needs [[ ]] to distinguish from children list
['p', [['a', { href: '...' }, 'link text']]]
```

This is infrequent in practice (most single children are strings or `make*()` returns), and users can mix TACO freely to avoid it. But it should be prominently documented with examples.

### 5. Tag validation

Array shorthand accepts any string as a tag: `['foo', 'bar']` → `{ t: 'foo', c: 'bar' }`. This is intentional — HTML is forgiving about unknown tags, and custom elements (web components) use arbitrary hyphenated names. No tag-name lookup table is needed or desired.

## Summary of recommendations

| Feature | Recommendation | Timeline |
|---------|---------------|----------|
| `bw.h(tag, attrs, content, options)` | Ship it. 5 lines, returns TACO, no risk. | v2.0.x |
| Array shorthand `[t, a, c, o]` | Design is sound. Needs TDD + compat audit. | v2.1.0 |
| Tag-name validation | Don't. Accept any string. | n/a |
| `{c:[]}` marker for children | Not needed if "array in c = children list" rule works | n/a |

## Appendix: comparison with other array-based UI formats

| System | Syntax | Disambiguation | Serializable |
|--------|--------|---------------|-------------|
| Hiccup (Clojure) | `[:div {:class "x"} "hello"]` | Tag is keyword (`:div`), attrs is map | Yes (EDN) |
| Mithril `m()` | `m('div.x', 'hello')` | Function call = node | No |
| React `createElement` | `React.createElement('div', {className:'x'}, 'hello')` | Function call = node | No |
| TACO | `{t:'div', a:{class:'x'}, c:'hello'}` | Named keys | Yes (JSON) |
| TACO array (proposed) | `['div', {class:'x'}, 'hello']` | Length-based positional | Yes (JSON) |
