# UI as Schema: Validating TACO Objects

**Status**: Discussion document -- not on the implementation roadmap
**Date**: 2026-03-28

This document explores what becomes possible when your UI layer is plain
data. It is not a specification or a product plan. It lives here to invite
discussion from developers who see the potential.

If you have thoughts, open an issue or reach out.

---

## The Observation

A bitwrench UI is a tree of `{t, a, c, o}` objects. That tree is JSON.
Not "JSON-like" or "serializable to JSON" -- it IS JSON (modulo function
references in `a.onclick` and `o.handle`, which are the only non-serializable
parts and can be handled with a registry pattern).

This means something that no compiled UI framework can claim: **the UI
definition is data that can be validated, transformed, and enforced using
the same tools we already use for APIs, configs, and data interchange.**

A React component tree? Opaque compiled code. A Vue template? A string
that gets parsed into a virtual DOM you never see. A Svelte component?
Gone after compilation. You cannot point a schema validator at any of
these and ask "is this UI well-formed?" -- the UI description doesn't
exist as inspectable data at runtime.

TACO objects do.

---

## Historical Precedent: We've Done This Before

If you're old enough to remember XML-based UI frameworks, this idea
will feel familiar:

**XAML (WPF/.NET)** -- Microsoft's UI markup was XML. You could validate
it with XSD schemas, transform it with XSLT, generate it from code, and
enforce organizational standards with schema-based tooling. The Visual
Studio designer was possible because the UI was self-describing data.

**Android XML Layouts** -- `res/layout/*.xml` files are validated against
the Android SDK's schema. The lint tool (`android lint`) catches invalid
attributes, accessibility violations, and deprecated APIs -- all because
the UI is structured data, not code.

**XUL (Mozilla)** -- Firefox's entire UI was defined in XUL/XML. Extensions
could inspect and modify the UI tree as data. Schema validation told you
if your XUL was well-formed before the browser tried to render it.

**Qt QML** -- A JSON-like declarative UI language with a type system and
static analysis tools. Qt Creator's design mode works because QML is
inspectable structured data.

These frameworks understood something the modern JS ecosystem forgot:
**when UI is data, tooling comes for free.** The shift to JSX and
compilation-first frameworks traded that capability for developer
ergonomics. TACO gets it back without the XML tax.

---

## What JSON Schema / Pydantic Developers Will Recognize

If you use JSON Schema for API validation or Pydantic for Python data
models, the TACO schema concept maps directly:

**JSON Schema parallel**: A TACO schema defines the valid shape of a UI
subtree the same way a JSON Schema defines the valid shape of an API
response. The difference is that the "response" is a UI component, and
the "properties" are HTML tags, attributes, and lifecycle hooks.

```javascript
// This is conceptually identical to a JSON Schema definition:
var cardSchema = {
  t: { type: 'string', const: 'div' },
  a: {
    properties: {
      class: { type: 'string', pattern: /bw_card/ }
    }
  },
  c: {
    type: 'array',
    items: { oneOf: [titleSchema, bodySchema, footerSchema] }
  }
};
```

**Pydantic parallel**: Pydantic validates Python objects against a model
definition and gives you clear error messages with field paths. A TACO
validator would do the same thing:

```javascript
// Pydantic-style: define the model, validate input, get path-specific errors
var result = validate(taco, cardSchema);
// => { valid: false, errors: [{ path: '.a.class', message: 'missing bw_card' }] }
```

**The key insight**: bitwrench could offer this natively because TACO
objects already have a consistent structure (every node has `t`, `a`,
`c`, `o`). JSON Schema and Pydantic work on arbitrary shapes. A TACO
schema knows the domain -- it knows that `t` is a tag name, `a` has
HTML attributes, `c` is content, and `o` has lifecycle hooks. Domain
knowledge makes the validator smaller, faster, and more helpful than
a generic tool.

And crucially, this tooling would ship as a separate add-on -- not part
of bitwrench core. The core library stays zero-dep and lean. The schema
tool is for teams that want governance, not a tax on everyone.

---

## Scenarios Where This Matters

### Scenario 1: The Wrong Property Name

You write `bw.makeAccordion({ items: [{ label: 'FAQ', body: 'Answer' }] })`.
Nothing renders. No error. You stare at it for 10 minutes before realizing
the properties are `title` and `content`, not `label` and `body`.

With schema validation:
```
[bw-schema] makeAccordion: items[0] has unknown property "label".
  Did you mean "title"?
[bw-schema] makeAccordion: items[0] has unknown property "body".
  Did you mean "content"?
```

This is the simplest, most immediately useful scenario. Every bitwrench
user has hit some version of this.

### Scenario 2: Server-Driven UI (bwserve)

A Python backend sends TACO over SSE to the browser. The browser renders
it with `bw.DOM()`. What happens when the server sends:

```json
{ "t": "script", "c": "alert('pwned')" }
```

Or a malformed payload from a bug? Today: it renders. With validation:

```javascript
bwserve.onMessage = function(msg) {
  var result = validate(msg.taco, {
    denyTags: ['script', 'iframe', 'object'],
    denyStringHandlers: true,
    denyRawHtml: true
  });
  if (!result.valid) return;  // reject
  bw.DOM(msg.target, msg.taco);
};
```

This is a real security boundary. When UI is data arriving over the wire,
validation isn't optional -- it's the same as validating API input.

### Scenario 3: Embedded Devices (ESP32, RPi)

A microcontroller sends JSON TACO updates to a browser dashboard. The
firmware is written in C. Bugs in the JSON serialization are catchable.
Schema validation on the browser side catches malformed payloads before
they break the UI -- and reports exactly what's wrong, which helps debug
the firmware.

### Scenario 4: LLM-Generated UI

You ask an LLM to generate a TACO dashboard. It produces:

```json
{
  "t": "div",
  "attributes": { "className": "dashboard" },
  "children": [...]
}
```

Wrong keys everywhere -- `attributes` instead of `a`, `className` instead
of `class`, `children` instead of `c`. The LLM hallucinated a React-shaped
object. Schema validation catches this immediately and the error messages
are specific enough to include in a retry prompt.

### Scenario 5: Enterprise UI Governance

A large team building internal tools with bitwrench. The tech lead wants:
- No inline styles (use design tokens)
- No string event handlers (security policy)
- All images must have alt text (accessibility)
- Only approved BCCL components in production code

Today this requires code review discipline. With a schema policy engine,
it's automated -- run it in CI, same as a linter.

```javascript
var policy = {
  rules: [
    { rule: 'no-inline-styles', severity: 'warn' },
    { rule: 'no-string-handlers', severity: 'error' },
    { rule: 'require-alt-text', severity: 'error' },
    { rule: 'allowed-components', value: ['card', 'button', 'table', 'nav', 'form'] }
  ]
};
```

### Scenario 6: Cross-Language Portability

Because TACO schema definitions would be plain JSON (no JS-specific
constructs), the same schema works in:
- **JavaScript/Node** -- validate in browser or server
- **Python** -- validate bwserve payloads before sending
- **Go/Rust** -- validate in microservices that generate UI
- **C** -- embedded devices that serialize TACO

This is the JSON Schema advantage: the schema itself is data, portable
across any language that can parse JSON.

---

## How It Might Work

### The Simplest Useful Thing

A single function that validates the `{t, a, c, o}` shape:

```javascript
function validateTaco(obj) {
  var errors = [];
  if (!obj || typeof obj !== 'object') {
    return { valid: false, errors: [{ message: 'not an object' }] };
  }
  if (typeof obj.t !== 'string') {
    errors.push({ path: '.t', message: 'tag must be a string' });
  }
  if (obj.a !== undefined && typeof obj.a !== 'object') {
    errors.push({ path: '.a', message: 'attributes must be an object' });
  }
  if (obj.o !== undefined) {
    var knownKeys = ['state', 'mounted', 'unmount', 'render', 'handle', 'slots', 'type'];
    Object.keys(obj.o).forEach(function(k) {
      if (knownKeys.indexOf(k) === -1) {
        errors.push({ path: '.o.' + k, message: 'unknown option "' + k + '"' });
      }
    });
  }
  return { valid: errors.length === 0, errors: errors };
}
```

That's maybe 30 lines and it already catches the most common mistakes.
No build step, no dependencies, works in any JS environment.

### Recursive Tree Validation

Walk the content tree and validate every node:

```javascript
function validateTree(taco, path) {
  path = path || '';
  var result = validateTaco(taco);
  // Recurse into content
  if (Array.isArray(taco.c)) {
    taco.c.forEach(function(child, i) {
      if (child && typeof child === 'object' && child.t) {
        var childResult = validateTree(child, path + '.c[' + i + ']');
        result.errors = result.errors.concat(childResult.errors);
      }
    });
  } else if (taco.c && typeof taco.c === 'object' && taco.c.t) {
    var childResult = validateTree(taco.c, path + '.c');
    result.errors = result.errors.concat(childResult.errors);
  }
  result.valid = result.errors.length === 0;
  return result;
}
```

### BCCL Config Validation with Fuzzy Matching

```javascript
var knownConfigs = {
  makeCard: ['title', 'content', 'footer', 'image', 'variant', 'shadow',
             'clickable', 'style', 'class'],
  makeAccordion: ['items', 'multiple', 'variant', 'style', 'class'],
  makeNav: ['items', 'variant', 'vertical', 'style', 'class']
  // ... all 45+ components
};

function validateConfig(factoryName, config) {
  var known = knownConfigs[factoryName];
  if (!known) return { valid: true, errors: [] };
  var errors = [];
  Object.keys(config).forEach(function(key) {
    if (known.indexOf(key) === -1) {
      var suggestion = findClosest(key, known);  // Levenshtein
      errors.push({
        path: '.' + key,
        message: factoryName + ': unknown property "' + key + '"'
          + (suggestion ? '. Did you mean "' + suggestion + '"?' : '')
      });
    }
  });
  return { valid: errors.length === 0, errors: errors };
}
```

### Policy Rules as Functions

```javascript
var builtinRules = {
  'no-inline-styles': function(taco, path) {
    if (taco.a && taco.a.style && typeof taco.a.style === 'object') {
      return { path: path + '.a.style', message: 'inline styles not allowed by policy' };
    }
  },
  'no-string-handlers': function(taco, path) {
    if (!taco.a) return;
    var errors = [];
    Object.keys(taco.a).forEach(function(k) {
      if (k.indexOf('on') === 0 && typeof taco.a[k] === 'string') {
        errors.push({
          path: path + '.a.' + k,
          message: k + ' must be a function, not a string'
        });
      }
    });
    return errors;
  },
  'require-alt-text': function(taco, path) {
    if (taco.t === 'img' && (!taco.a || !taco.a.alt)) {
      return { path: path + '.a.alt', message: '<img> requires alt attribute' };
    }
  }
};
```

None of this is rocket science. The power comes from the fact that TACO
gives you a uniform data structure to walk. Every node has the same shape.
The validator doesn't need to understand React hooks, Vue reactivity, or
Svelte compilation -- it just walks a tree of `{t, a, c, o}` objects.

---

## Proposed v0 Specification Skeleton (Additive)

This section is intentionally concrete so implementers can converge on one
validator behavior. It does not replace the discussion above. It turns the
discussion into a proposed minimum contract that can be implemented in a
standalone package (`bw-schema`) without changing bitwrench core.

### 1) Scope

v0 covers:

- Structural validation of TACO trees (`{t, a, c, o}`)
- Optional policy validation (security, accessibility, governance)
- Validation for both in-process objects and wire payloads (bwserve/LLM)
- Machine-readable errors suitable for IDEs, CI, and LLM retry loops

v0 does not cover:

- Full semantic DOM validation against every HTML spec edge case
- TypeScript replacement
- Compiler transforms or code generation

### 2) Canonical Node Shape (Normative)

A node is valid TACO if:

- `t` exists and is a non-empty string (tag name)
- `a` is optional; when present, it is an object
- `c` is optional; when present, it is one of:
  - string
  - number
  - `null`/`undefined`/`false` (treated as skipped content)
  - `BwRaw` sentinel (`{ __bw_raw: true, v: string }`)
  - nested TACO node
  - array of any allowed content values above
- `o` is optional; when present, it is an object with known keys only:
  - `state`, `mounted`, `unmount`, `render`, `handle`, `slots`, `type`

Unknown top-level keys are validator findings (severity depends on mode).

### 3) Validation Modes (Normative)

`validateTree(input, options)` supports:

- `mode: 'permissive'` (default for developer ergonomics)
  - checks required shape (`t`, object-ness)
  - unknown keys are `warn`
- `mode: 'strict'`
  - unknown keys are `error`
  - invalid content unions are `error`
  - malformed `o` options are `error`
- `mode: 'wire'` (for bwserve/LLM/embedded payload boundaries)
  - strict shape checks
  - policy defaults enabled:
    - deny dangerous tags (`script`, `iframe`, `object`, `embed`)
    - deny string event handlers
    - configurable `bw.raw` allowance (default deny)

### 4) Error Model (Normative)

Each finding follows a stable shape:

```javascript
{
  code: 'BW_SCHEMA_UNKNOWN_KEY',
  severity: 'error',          // 'error' | 'warn' | 'info'
  path: '.c[2].a.className',  // JSONPath-like pointer
  message: 'Unknown key "className"; did you mean "class"?',
  hint: 'Use TACO key "a.class" for CSS classes.',
  suggestion: 'class',
  meta: { received: 'className', allowed: ['id', 'class', 'style', '...'] }
}
```

Result envelope:

```javascript
{
  valid: false,         // true if no "error" findings
  summary: { errors: 2, warns: 1, infos: 0 },
  findings: [/* ordered by path, then severity */],
  normalized: null      // optional output if auto-fix is enabled
}
```

Codes should be stable across versions for tooling interoperability.

### 5) Suggested v0 Error Code Set

- `BW_SCHEMA_NOT_OBJECT`
- `BW_SCHEMA_MISSING_TAG`
- `BW_SCHEMA_INVALID_TAG_TYPE`
- `BW_SCHEMA_UNKNOWN_TOP_LEVEL_KEY`
- `BW_SCHEMA_INVALID_ATTRS_TYPE`
- `BW_SCHEMA_INVALID_OPTIONS_TYPE`
- `BW_SCHEMA_UNKNOWN_OPTION_KEY`
- `BW_SCHEMA_INVALID_CONTENT_TYPE`
- `BW_SCHEMA_UNKNOWN_ATTR_KEY` (optional, configurable)
- `BW_POLICY_DENY_TAG`
- `BW_POLICY_DENY_STRING_HANDLER`
- `BW_POLICY_DENY_RAW_HTML`
- `BW_POLICY_REQUIRE_ALT_TEXT`

### 6) Policy Engine Contract (Normative)

Policy rules are pure functions:

```javascript
function rule(node, ctx) {
  // ctx: { path, mode, parent, options, helpers }
  // return: null | finding | finding[]
}
```

Evaluation order:

1. Structural validation
2. Built-in policies (if enabled)
3. User policies

Policy merge behavior:

- Global defaults
- Mode defaults
- User overrides (last write wins)

### 7) Integration Points (Normative Recommendations)

#### A) bwserve ingress (high priority)

Validate message payloads before `bw.DOM()`/`bw.apply()`:

```javascript
var result = validateTree(msg.node, { mode: 'wire', policy: wirePolicy });
if (!result.valid) {
  // reject payload, log findings, optionally patch an error placeholder
  return;
}
```

#### B) LLM output boundary

Validate parsed model output before render:

```javascript
var r = validateTree(parsed, { mode: 'wire', autoSuggest: true });
if (!r.valid) {
  // feed r.findings back into retry prompt
}
```

#### C) CLI/CI

`bwcli validate` should:

- return non-zero on `error` findings
- optionally fail on `warn` with `--strict-warn`
- emit JSON (`--json`) and human text by default

### 8) Function and Serialization Profiles

Because function references are the main non-JSON part of TACO, v0 should
define explicit profiles:

- `profile: 'runtime'`
  - allows function values in `a.on*`, `o.mounted`, `o.render`, etc.
- `profile: 'wire-safe'`
  - disallows function values
  - allows only data payload representation
- `profile: 'wire-registry'`
  - allows function references only as registry tokens/IDs

This avoids ambiguity between "authoring objects" and "transport objects."

### 9) Normalization / Auto-Fix (Optional v0.1)

Auto-fix is opt-in and conservative:

- key aliases only (safe rewrites), e.g.:
  - `attributes` -> `a`
  - `children` -> `c`
  - `className` -> `class`
- never auto-enable dangerous features (`bw.raw`, string handlers)
- every rewrite emits an `info` finding with before/after path

Recommended API:

```javascript
validateTree(input, { normalize: true, aliasMap: defaultAliasMap });
```

### 10) Performance Expectations

Target complexity:

- Structural walk: O(n) nodes
- Policy checks: O(n * p) where `p` is active rule count

Operational guidance:

- Validate at boundaries (wire/LLM ingress), not every frame
- Cache by stable hash for repeated payloads
- Offer depth/node-count limits to protect against pathological payloads

### 11) Versioning and Compatibility

Schema contract should include:

```javascript
{
  schemaVersion: '1.0.0',
  tacoVersion: '2.x',
  profile: 'runtime'
}
```

Compatibility policy:

- Minor version: additive checks/codes only
- Major version: breaking code/path semantics
- Error codes remain stable within major versions

### 12) JSON Schema Interop Track

Two-layer model is recommended:

- Native validator contract (optimized for TACO semantics)
- Optional JSON Schema export/import for tooling interoperability

Practical approach:

1. Maintain canonical TACO spec in native format
2. Generate JSON Schema artifacts from canonical spec
3. Allow editor/tooling consumers to use `$schema` references

### 13) Suggested MVP Sequence

Phase 1 (smallest useful):

- `validateTaco` + `validateTree`
- strict/permissive modes
- stable findings envelope + core error codes

Phase 2 (boundary safety):

- `wire` mode
- deny-tag/string-handler/raw-html policies
- bwserve integration examples

Phase 3 (tooling):

- `bwcli validate`
- JSON output for CI
- LLM retry prompt formatter

Phase 4 (governance):

- policy packs
- optional normalization aliases
- JSON Schema export

### 14) Open Design Defaults (Proposed)

If no options are provided:

- mode: `permissive`
- profile: `runtime`
- findings include suggestions when confidence is high
- validator never mutates input unless `normalize: true`

For boundary validation (recommended default):

- mode: `wire`
- profile: `wire-safe`
- deny dangerous tags + string handlers + raw HTML unless explicitly allowed

---

## What This Is NOT

- **Not part of bitwrench core.** The core library stays zero-dep and
  lean. Schema tooling is a separate add-on for teams that want it.
- **Not a build step.** Validation runs at dev time or at data boundaries
  (bwserve, LLM output). It does not require a compiler or bundler.
- **Not a type system.** TypeScript already provides static types for
  bitwrench (see `dist/bitwrench.d.ts`). Schema validation is runtime
  checking for data that arrives dynamically -- server payloads, LLM
  output, config-driven UI.
- **Not on the roadmap.** This document describes what's possible. If
  demand materializes, the architecture is ready. The TACO format
  doesn't need to change to support any of this.

---

## Why This Matters Strategically

The JS framework landscape is dominated by compiled, opaque approaches.
Every major framework (React, Vue, Svelte, Solid) compiles away the UI
description before runtime. This makes certain categories of tooling
impossible:

| Capability | Compiled frameworks | TACO |
|------------|-------------------|------|
| Schema-validate a component tree | Impossible | Walk the JSON |
| Enforce UI policies in CI | Requires AST parsing | Validate the data |
| Validate server-sent UI before render | No standard format | `validate(payload)` |
| Cross-language UI generation | Each needs its own SDK | Emit JSON |
| LLM UI output validation | Framework-specific | `validate(parse(response))` |
| Accessibility audit at data level | Requires rendered DOM | Walk the tree |
| Generate docs from component specs | Custom per framework | Read the schema |
| Diff two UI versions | Render and compare | `JSON.diff(v1, v2)` |

This isn't an argument that TACO is better than React for building UIs.
It's an argument that data-as-UI opens a category of tooling that
code-as-UI structurally cannot access. For enterprise environments where
governance, security, and cross-platform generation matter, that's a
meaningful differentiator.

The XML UI world understood this. XAML, Android XML, and XUL all had
schema validation, design-time tooling, and cross-language generation
because the UI was structured data. The modern web lost that when it
moved to JSX. TACO brings it back in a lighter, JSON-native form.

---

## Discussion Questions

We'd welcome input on any of these:

1. Which scenarios resonate most with your use case?

2. Is JSON Schema interop important (standard `$schema` references,
   editor autocomplete via schema files), or is a JS-native format
   sufficient?

3. For the bwserve/embedded security boundary -- what validation rules
   would you need for server-sent TACO in your environment?

4. Would a CLI tool (`bwcli validate myapp.js`) be useful for CI
   integration, or is runtime-only validation enough?

5. How strict should a default schema be? Should `validate()` with
   no options be permissive (just check `t` exists) or strict (validate
   everything we know about)?

6. For cross-language use: which server-side languages would benefit
   most from a portable TACO schema? Python? Go? Rust?

Open an issue at [github.com/deftio/bitwrench](https://github.com/deftio/bitwrench/issues)
to share your thoughts.
