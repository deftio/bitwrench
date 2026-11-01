# TACO schemas -- draft documentation

Graduates to `docs/schemas.md`. Every grammar detail below was measured against
2.1.12, not inferred -- the notes say where.

**One tension to settle first.** `dev/bw-verify-design.md` section 11 lists
"no user-authored schemas" as a non-goal, and this document is largely about
writing your own. Those are compatible, but only under a specific split:

| | |
|---|---|
| **We publish** a schema for the TACO grammar. You validate against it with whatever your language already has. | yes |
| **You write** a schema for your own site's vocabulary, using standard JSON Schema, and run it in your own CI | yes -- this is documentation, not a feature |
| **verify loads your schema** and reports against it | **no.** That is the PropTypes trap: a dialect to support, error formatting, composition, versioning. Your validator already does this better |

So: verify never reads a user schema. The schema is a published contract and a
worked example. Your tooling does the rest. If that split is not kept, every
sentence below becomes a feature request.

---

## 1. What is schema-able, and what is not

A TACO that has crossed a pipe is JSON, and JSON has no function type. That is
what makes this possible at all -- and it is also the boundary.

| Form | Schema-able | Why |
|------|-------------|-----|
| A TACO in a JSON payload | **fully** | closed grammar, no functions |
| A TACO you wrote in JavaScript | partly | `a.on*`, `o.mounted`, `o.unmount`, `o.render`, `o.handle` hold functions |
| A bwserve **frame** | envelope only | `update.data`, `message.data`, `call.args` and `listen.topic` are deliberately arbitrary -- the app defines them |

That last row matters and is easy to oversell. The frame envelope pins `v`,
`type`, `ref` and `taco`; it cannot pin the app's own payloads, and should not
try.

### The `o` split: three of seven keys cross the wire

The renderer reads seven option keys. Only three are expressible in JSON:

| Key | Type | Wire |
|-----|------|------|
| `type` | string | yes |
| `state` | object | yes |
| `slots` | object of **selector strings** | yes |
| `mounted` | function | no |
| `unmount` | function | no |
| `render` | function | no |
| `handle` | object of functions | no |

So a server can meaningfully push `o.state`, `o.type` and `o.slots`. It cannot
push behaviour, by design -- see the north star, "control messages never carry
code".

---

## 2. The TACO schema

`schema/taco/v1.json`. Note `$id` carries **its own version line**, not
bitwrench's: the grammar changes far more slowly than the library's patch
cadence, and consumers pin this.

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://bitwrench.dev/schema/taco/v1.json",
  "title": "TACO (wire form)",
  "$ref": "#/$defs/content",

  "$defs": {
    "content": {
      "description": "Anything that can be the c of an element, or a whole tree.",
      "oneOf": [
        { "type": ["string", "number", "boolean", "null"] },
        { "$ref": "#/$defs/element" },
        { "$ref": "#/$defs/raw" },
        { "type": "array", "items": { "$ref": "#/$defs/content" } }
      ]
    },

    "element": {
      "type": "object",
      "required": ["t"],
      "additionalProperties": false,
      "properties": {
        "t": { "type": "string", "minLength": 1 },
        "a": { "$ref": "#/$defs/attrs" },
        "c": { "$ref": "#/$defs/content" },
        "o": { "$ref": "#/$defs/options" }
      }
    },

    "raw": {
      "description": "bw.raw(). The v string bypasses escaping -- schema-valid is not safe.",
      "type": "object",
      "required": ["__bw_raw", "v"],
      "additionalProperties": false,
      "properties": {
        "__bw_raw": { "const": true },
        "v": { "type": "string" }
      }
    },

    "attrs": {
      "type": "object",
      "properties": {
        "class": {
          "oneOf": [
            { "type": "string" },
            { "type": "array", "items": { "type": "string" } }
          ]
        },
        "style": {
          "oneOf": [{ "type": "string" }, { "type": "object" }]
        }
      },
      "additionalProperties": { "type": ["string", "number", "boolean", "null"] }
    },

    "options": {
      "description": "Wire-legal options only. The function-valued keys cannot cross JSON.",
      "type": "object",
      "additionalProperties": false,
      "properties": {
        "type": { "type": "string" },
        "state": { "type": "object" },
        "slots": {
          "type": "object",
          "additionalProperties": { "type": "string" }
        }
      }
    }
  }
}
```

**Why each unobvious line is there**, all measured:

- `"required": ["t"]` -- an object without `t` is not an element. `_createNode`
  falls through to `document.createTextNode(String(taco))`, so `{tag:'h1'}`
  renders the literal text `[object Object]`. A schema that makes `t` optional
  accepts that bug.
- `"additionalProperties": false` on `element` -- this is what catches `cc`,
  `tag`, `attrs`, `children`.
- `content` allows `number`, `boolean` and `null` -- deliberate, not laxity.
  `c: 42` renders `42`, `c: true` renders `true`, `c: null` is skipped.
- `attrs.additionalProperties` is permissive on purpose. bitwrench forwards
  unknown attributes, which is how `viewBox`, `stroke-width`, `aria-*` and
  `data-*` work. A closed attribute list would reject correct SVG.
- `style` accepts an **object** as well as a string: `{color:'red'}` renders
  `style="color:red"`.
- Attribute values may be `boolean`: `true` renders a bare attribute
  (`disabled`), `false` and `null` omit it.

---

## 3. Examples

Valid:

```json
{ "t": "h1", "c": "Hello" }
{ "t": "p", "c": ["n=", 7, true] }
{ "t": "div", "c": null }
{ "t": "svg", "a": { "viewBox": "0 0 10 10" },
  "c": { "t": "rect", "a": { "stroke-width": 1 } } }
{ "t": "div", "a": { "class": ["card", "bw_bccl_card"] } }
{ "t": "input", "a": { "disabled": true } }
{ "t": "p", "a": { "style": { "color": "red" } } }
{ "__bw_raw": true, "v": "<b>x</b>" }
{ "t": "div", "o": { "state": { "count": 0 }, "slots": { "body": ".card-body" } } }
```

Invalid, with the rule that rejects it:

```json
{ "tag": "h1", "c": "hi" }                  // element requires t
{ "t": "h1", "cc": "hi" }                   // additionalProperties false
{ "t": 42 }                                  // t must be a string
{ "__bw_raw": true }                         // raw requires v
{ "t": "p", "a": "class" }                   // a must be an object
{ "t": "p", "a": { "class": 7 } }            // class is string or string[]
{ "t": "div", "o": { "mounted": "fn" } }     // not a wire-legal option key
{ "t": "div", "o": { "events": {} } }        // removed in 2.1.12; never read
```

Schema-valid but **not** safe or correct -- the schema is a floor, not a
guarantee:

```json
{ "__bw_raw": true, "v": "<img src=x onerror=steal()>" }   // injection
{ "t": "div", "a": { "class": "bw_bccl_crad" } }           // no such class
{ "t": "buton", "c": "Save" }                              // not a real tag
```

---

## 4. Validating, in whatever language you already have

This is the part the CLI cannot give you: no Node required.

**Node:**

```bash
npx ajv-cli validate -s schema/taco/v1.json -d payload.json
```

**Python:**

```python
import json, jsonschema
schema = json.load(open("taco-v1.json"))
jsonschema.validate(json.load(open("payload.json")), schema)
```

**Anything else:** the schema is Draft 2020-12, so Go, Rust, Java and C# all
have libraries. A device that cannot run a validator at runtime can still have
its *generator* validated in CI on the host.

And in your own test suite, if you are in JavaScript, `verify()` is the fuller
check -- schema plus the things a schema cannot express.

---

## 5. A schema for your own site

This is the ask, and it is ordinary JSON Schema composition. You are narrowing
our grammar to your vocabulary.

Say your site renders exactly three shapes: a page wrapper, a stat card, and a
nav link. You want CI to reject anything else, because your content is
generated.

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://example.com/schema/my-site-v1.json",
  "allOf": [
    { "$ref": "https://bitwrench.dev/schema/taco/v1.json" },
    { "$ref": "#/$defs/mine" }
  ],

  "$defs": {
    "mine": {
      "oneOf": [
        { "$ref": "#/$defs/page" },
        { "$ref": "#/$defs/statCard" },
        { "$ref": "#/$defs/navLink" }
      ]
    },

    "page": {
      "type": "object",
      "properties": {
        "t": { "const": "div" },
        "a": {
          "type": "object",
          "properties": { "class": { "const": "bw_bccl_container" } },
          "required": ["class"]
        },
        "c": { "type": "array" }
      },
      "required": ["t", "a", "c"]
    },

    "statCard": {
      "type": "object",
      "properties": {
        "t": { "const": "div" },
        "a": {
          "type": "object",
          "properties": {
            "class": { "const": "bw_bccl_card bw_p_3" },
            "id": { "type": "string", "pattern": "^stat_[a-z_]+$" }
          },
          "required": ["class", "id"]
        }
      },
      "required": ["t", "a"]
    },

    "navLink": {
      "type": "object",
      "properties": {
        "t": { "const": "a" },
        "a": {
          "type": "object",
          "properties": { "href": { "type": "string", "pattern": "^/" } },
          "required": ["href"]
        }
      },
      "required": ["t", "a"]
    }
  }
}
```

What that buys, concretely:

- **A generator cannot invent a component.** An LLM or a CMS exporter that
  emits `{t:'marquee'}` fails CI.
- **Your ids stay addressable.** `^stat_[a-z_]+$` means every card has an id
  your patches can target -- the thing that makes server-driven updates cheap.
- **Your links stay internal.** `^/` rejects an absolute URL someone pasted in.
- **You can constrain a model with it**, not only check it afterwards.

### Keep it small

The temptation is to describe your whole UI. Do not. A schema that pins every
class and every nesting level becomes a second copy of your components, and it
rots the moment you restyle something. Pin the things whose violation is
silent and expensive: component identity, id patterns, URL shapes, enumerated
variants. Let everything else through -- `verify` and the page cover the rest.

### Two things people get wrong

**`additionalProperties: false` does not compose through `allOf`.** Our
`element` already sets it, so adding a property in your own `$defs` without
re-listing `t`, `a`, `c`, `o` will fail in confusing ways. Narrow with `const`
and `pattern` on existing properties rather than introducing new ones.

**Do not add your own top-level keys to a TACO.** `{t, a, c, o}` is closed, and
`additionalProperties: false` is what catches typos. If you need metadata, put
it in `o.state`, which is yours.

---

## 6. Holes this document found

| # | Hole | Status |
|---|------|--------|
| 1 | The design says "the schema" as if there were one. There are **two with different confidence**: a closed TACO grammar and a frame envelope with deliberate holes (`update.data`, `call.args`, `message.data`, `listen.topic`) | needs saying in the design, or the 1.0 claim overreaches |
| 2 | The wire-legal `o` subset was never written down: **three of seven keys** (`type`, `state`, `slots`). The design implies all seven | fixed here; the generator must derive it, not copy this table |
| 3 | `$id` version line. If this ships as "the 2.1.12 schema" we field "which schema matches which library" forever. It wants `taco/v1`, bumped only when the grammar changes | **decide before publishing anything** |
| 4 | "No user schemas" (design section 11) versus this document | resolved by the split at the top: we publish and teach, verify never loads a user schema. **Needs writing into section 11** so it is not read as a reversal |
| 5 | The structured-output subset is still listed as a 1.0 artifact. It is a compatibility matrix against three vendors' changing restrictions -- unbounded maintenance in a one-line deliverable | recommend dropping from 1.0; publish the full schema, document the limitation |
| 6 | Nothing yet says a schema cannot judge safety. `{__bw_raw, v}` is schema-valid and is an injection | the "valid but not safe" block above; also belongs in the design's claim |

---

## 7. Documentation checklist

- [ ] `docs/schemas.md` -- this document, minus the holes section
- [ ] `schema/taco/v1.json` -- generated, with the two-way fixture agreement test
- [ ] A worked "schema for your own site" example in `examples/`, validated in
      CI so the doc cannot rot
- [ ] `docs/bwserve.md` -- the frame envelope, and which payloads are open
- [ ] `llms.txt` -- the schema URL and the one-paragraph grammar. A model that
      can read the schema does not need to guess TACO
- [ ] `docs/verify.md` -- "schema says well-formed; verify says the rest"
- [ ] `README.md` -- one line, with the caveat that you do not need it
