# bitwrench-verify -- user guide (DRAFT -- superseded)

**Status: superseded by [docs/verify.md](../docs/verify.md); kept as history.**
The tool shipped in 2.1.12 (tier 1: structural walk plus raw-content warnings,
21 finding codes, and `bwcli verify`), so "tool not built yet" below is stale.
The code table below is NOT the shipped list: `unknown-prop`, `unknown-class`
and `bad-handler-name` never shipped, and the shipped set includes
`unknown-opt-maybe`, `raw-unsafe`, `raw-unchecked`, `bad-style` and
`function-not-handler`. Two public code lists is how a breaking rename happens
by accident -- cite `docs/verify.md`, never this draft.

## North star

bitwrench-verify is an extra tool. It catches mistakes and assists in CI, as a
companion to bitwrench, in the situations where that help is worth a call.

bitwrench renders without it. There is no required build, and verify does not
add one. If you can see the page, you can already tell that something is wrong.
Verify is for the run where nobody is looking: a test, a generated payload, a
saved frame, a pipe in CI.

Reach for it when the TACOs are generated, numerous, or leaving your hands.
Skip it when the shapes are fixed and few and someone can see the page. The
library and the CLI are two ways to call the same companion.

Written before the code, deliberately: a guide you cannot finish writing is a
design that is not finished. **Every `>>> HOLE` below is a question a user would
ask that `dev/bw-verify-design.md` currently cannot answer.** Graduates to
`docs/verify.md` when the tool exists. The north star above is settled; a hole
does not reopen it.

---

## What it is

A companion checker for TACO objects. It reads your UI description and tells
you what bitwrench will quietly ignore. You call it. bitwrench does not.

```javascript
verify({ tag: 'h1', c: 'Hello' })
// [ { code: 'not-an-element', path: '', key: 'tag', hint: 't' } ]
```

That object renders the text `[object Object]` on your page today. If you see
that text, the object has no `t`. Verify is how a test says the same thing
when nobody is looking at the page.

## When to reach for it

The north star, applied. Skip it when the shapes are a handful of fixed cards
and someone can see the page. The first render already tells you.

Reach for it when the shapes are **generated, numerous, or shipped to other
people**: a component library, UI built from database rows, an LLM emitting
TACO, a device pushing frames you cannot see, or a CI run you want to keep
honest over years.

It is not a type checker (`bitwrench.d.ts` already ships, and types check code
you wrote, not data that arrived at runtime). It is not a linter for your CSS or
your JavaScript. It never runs in production.

---

## Getting it

**In a browser**, a script tag after bitwrench:

```html
<script src="bitwrench.umd.min.js"></script>
<script src="bitwrench-verify.js"></script>
<script>
  bwv.verify({ t: 'h1', c: 'hi' });   // []
</script>
```

**In Node**, a subpath of the same package -- same version, always:

```javascript
import { verify } from 'bitwrench/verify';
```

Same package, same version. The `./verify` export needs `import` and `types`.
`./debug` declares only `require` and `default`; verify cannot copy that,
because tests import it. The design says this (section 12).

---

## Your first check

`verify()` takes a TACO, an array of them, or anything you would pass to
`bw.mount()`. It returns an array of findings. Empty means clean.

```javascript
import { verify } from 'bitwrench/verify';

verify({ t: 'div', a: { class: 'bw_bccl_card' }, c: 'ok' });   // []

verify({ t: 'div', cc: 'oops' });
// [ { code: 'unknown-key', path: '', key: 'cc', hint: 'c' } ]
```

Arrays at the top level work, because `bw.mount()` accepts them:

```javascript
verify([{ t: 'p', c: 'a' }, { t: 'p', c: 'b' }]);   // []
```

It never throws on bad input and never mutates what you pass it. For tests,
`verify.assert()` throws instead:

```javascript
verify.assert({ t: 'div', cc: 'x' });
// Error: bitwrench-verify: unknown-key at '' (cc -- did you mean c?)
```

---

## Reading a finding

Every finding is an object, so you can filter instead of grepping strings:

| Field | Meaning |
|-------|---------|
| `severity` | `'error'` or `'warn'` -- see below |
| `code` | what is wrong, from the closed list below |
| `path` | where, as a JSON-pointer-ish location: `c[0].c[2]` |
| `key` | the offending key or token, when there is one |
| `hint` | a suggested correction, only when it is unambiguous |

### error vs warn

**`error`** means the library will ignore this or render something you did not
ask for. There is no reading of the code under which it does what it says.

**`warn`** means it is legal, and verify cannot reliably tell what you meant.
A string `on*` handler is the example: it is the whole point of
`htmlPage({ runtime: 'shim' })`, and it is a dead control on a bwserve frame.
Same object, opposite verdicts, and only you know the destination. Verify says
so and moves on.

`verify.assert()` and the CLI fail on errors. Warnings are reported and do not
fail, unless you ask: `verify.assert(taco, { strict: true })`, `bwcli verify
--strict`.

### The codes

Closed list. These are public API -- people filter and assert on them -- so a
rename is a breaking change.

**Structural (tier 1, no manifest):**

| Code | Sev | Means | Example |
|------|-----|-------|---------|
| `not-an-element` | error | an object with neither a string `t` nor `__bw_raw` -- renders as `[object Object]` | `{ tag: 'h1' }` |
| `unknown-key` | error | a top-level key other than `t`, `a`, `c`, `o` | `{ t: 'h1', cc: 'x' }` |
| `t-not-string` | error | `t` is present but not a string | `{ t: 42 }` |
| `bad-raw` | error | a `__bw_raw` object missing a string `v`, or carrying other keys | `{ __bw_raw: true }` |
| `attrs-not-object` | error | `a` is not a plain object | `{ t: 'p', a: 'class' }` |
| `bad-class` | error | `class` is neither a string nor an array of strings | `{ a: { class: 7 } }` |
| `opts-not-object` | error | `o` is not a plain object | `{ t: 'p', o: 'mounted' }` |
| `function-in-wire` | error | **wire mode:** a function value. JSON cannot carry it, so it is not what you think it is | `{ a: { onclick: fn } }` |
| `attr-typo` | **warn** | an attribute one edit from a name the library treats specially. Unknown attributes are forwarded on purpose, so this is a suggestion | `{ a: { clas: 'x' } }` |
| `handler-string` | **warn** | `a.on*` holds a string. Correct for `bw.html()` / `runtime:'shim'`; stripped by `bw.apply()`, so a dead control on a frame | `{ a: { onclick: 'save()' } }` |
| `raw-unsafe` | **warn** | a `__bw_raw` value containing a construct that executes: an `on*` attribute, a `javascript:` URL, or (in the `bw.html()` path) a `<script>` | `bw.raw('<img src=x onerror=f()>')` |
| `raw-unchecked` | **warn** | a `__bw_raw` value verify inspected and cannot judge. Reported once per tree, not per node, so it is a note rather than noise | any other raw content |

**Derived (tier 2, needs the generated manifest):**

| Code | Sev | Means | Example |
|------|-----|-------|---------|
| `unknown-opt` | error | an `o` key no renderer path reads | `{ o: { onMount: fn } }` |
| `unknown-prop` | error | a `bw.make*()` option the factory does not read | `makeButton({ href: '/x' })` |
| `bad-handler-name` | error | `on*` that normalises to something that is not a real event, so the listener never fires | `{ a: { onchnage: fn } }` |
| `unknown-class` | **warn** | a `bw_`-prefixed token matching no generated rule. Warn, not error: a project may define its own `bw_`-prefixed CSS | `bw_bccl_crad` |
| `version-mismatch` | **warn** | verify's version differs from the loaded `bw.version`, so its manifest may describe a different library | -- |

**Page-level (tier 3, needs a DOM):** `duplicate-id` (error),
`slot-no-match` (error), `render-unreachable` (warn).

### Raw content: what verify can and cannot say

`bw.raw()` content is a string that bypasses escaping. Verify is **not in the
46 KB bundle**, so unlike the library it can afford to look inside it.

What it reports with confidence: an event-handler attribute (`onerror`,
`onmouseover`, ...), a `javascript:` URL, `srcdoc`, and `<script>`. Measured
behaviour, because the destination changes the risk:

- **`innerHTML` path** (`mount`, `patch`): a `<script>` tag is inert by spec,
  but handler attributes and `javascript:` URLs execute.
- **`bw.html()` path**: the string is returned verbatim into a document, so a
  `<script>` **does** execute when the browser parses the page.

So the same raw string is more dangerous served than mounted, and verify does
not always know which you are doing -- hence `warn`, with the path named in the
message.

What it will not claim: that raw content is *safe*. A pattern scan can be
defeated by mutation-XSS and by encodings a scanner does not normalise.
`raw-unchecked` says so out loud rather than implying a clean bill.

> **Open: scan or parse.** A real HTML parser would be correct where a scan is
> approximate, and verify can afford the bytes. It cannot afford the
> **dependency**: bitwrench ships zero runtime dependencies and that is a
> stated selling point, so adding one to a shipped artifact -- even a tool --
> weakens the claim and adds a supply-chain surface to the thing people are
> told to run in CI. Recommendation: ship the conservative scan plus
> `raw-unchecked`, and treat a parser as a later opt-in (`verify(taco, { html:
> myParser })`) so the choice is the caller's. Decide before 1.0.

Note what is **not** an error: `onClick` works. The renderer normalises `on*`
with `slice(2).toLowerCase()`, so `onClick` becomes `click` and fires. Verify
may hint at the house style; it must not call it a failure.

Note what is **not** an error: `onClick` works. The renderer normalises
`on*` with `slice(2).toLowerCase()`, so `onClick` becomes `click` and fires.
Verify may hint at the house style; it must not call it a failure.

---

## In your tests

This is the point of the tool. A TACO is data, so testing it needs no browser,
no jsdom, and no snapshot files.

```javascript
import { verify } from 'bitwrench/verify';
import * as ui from '../src/components.js';

describe('every component returns valid TACO', () => {
  Object.keys(ui).forEach((name) => {
    it(name, () => {
      assert.deepStrictEqual(verify(ui[name](SAMPLE[name])), []);
    });
  });
});
```

### But my app does not have component factories

Most real pages build TACO inline, inside a render function, and never return
it from a named export. There is nothing for the loop above to walk.

Pass that object to `verify()` yourself. There is nothing to enumerate:

```javascript
verify({ t: 'div', c: [ /* the object you were about to mount */ ] });
```

`verify.install()` is another door. It wraps `bw.create`, `bw.mount`,
`bw.patch` and `bw.append` from the tool and warns while you click around:

```javascript
verify.install({ onFinding: f => console.warn(f.code, f.path, f.key) });
```

It is not what makes verify real, and it puts no bytes in core. The wrap
lives in the tool. Whether it ships in 2.1.12 is still open (design section
15). Memoizing per shape is an implementation detail, not a product question.

---

## The two modes

Authored TACOs may hold functions. TACOs that cross a wire cannot -- JSON has
no function type, and `bw.apply()` strips string `on*` handlers on arrival.

```javascript
verify(taco);                      // authored: functions allowed in on*, o.*
verify(taco, { mode: 'wire' });    // wire: any function is an error
```

Use wire mode on the **server**, before you send:

```javascript
if (verify(taco, { mode: 'wire' }).length) {
  throw new Error('refusing to send invalid TACO');
}
```

Wire mode is the one that catches a mistake nothing else reports: a server
sending `a: { onclick: 'save()' }` gets a button that does nothing, because
handlers deliberately never cross the wire. Even spelled correctly.

### I am not writing JavaScript

The CLI is the same `verify()`, with file and stdin buffering. Wire mode is
its default, because a file or a pipe is a payload.

```
bwcli verify frame.json
some-generator | bwcli verify
```

| Machine | What you do |
|---------|-------------|
| Node, Bun, a browser | Import the library, or drive the CLI. |
| Desktop, server, or a Pi-class Linux computer | Your program can be C++ or Python. Node is on that machine, so pipe the CLI. |
| Bare metal | The checker cannot run on the device. On the host, the CLI checks compile-time assets and any frame the host can already see: the same C++ run on the desktop, or a captured log. |

A frame built on the board is checkable once it has crossed a pipe. Until
someone captures it, there is nothing to read. The UI still exists: the
browser renders, and the metal program drives it over bwserve. Query and
screenshot are that same protocol with a return trip. The C headers do not
wrap the round-trip yet, so the usual inspector is a host tool
(`bwcli attach`) watching the page the chip is driving.

The embedded C tests already compile, run, and parse frames. Calling
`verify()` on that output checks the examples. It does not put a checker on
the chip.

---

## What verify does not check

Being explicit, because a checker that seems to cover more than it does is
worse than none.

- **Whether your raw HTML is safe.** `bw.raw()` is accepted as valid; verify
  has no opinion on its contents. Escaping is still yours.
- **Your own class names.** `class: 'my-card'` is correct and will never be
  flagged. Only `bw_`-prefixed tokens are checked against the stylesheet.
- **`bw_act_*` wiring.** The handler is often in firmware, which verify cannot
  see, so an unhandled action is not reported.
- **Attribute spelling in general.** bitwrench forwards attributes on purpose
  (that is how `viewBox`, `stroke-width`, `aria-*` and `data-*` work). Only
  near-misses of the handful of names the library treats specially are hinted.
- **Runtime behaviour.** A valid TACO can still render the wrong thing. For
  "what is actually on the page", use `bitwrench-debug.js` (`bwd.tree()`,
  `bwd.state()`). Verify checks what you wrote; debug checks what happened.

---

## When verify is wrong

Every checker is eventually wrong about something, and a developer who cannot
silence one finding silences the whole tool. Two escape hatches, matching the
two doors.

**In the library, the options object is the pragma:**

```javascript
verify(taco, { ignore: ['attr-typo'] });
```

**At the CLI, a pragma line in the file:**

```
# bw-verify-ignore: handler-string -- static page, handlers are serialised
{ "t": "button", "a": { "onclick": "save()" }, "c": "Go" }
```

Rules that keep this from becoming a mute button:

- **Codes only, never "all".** You silence `attr-typo`, not the tool.
- **The reason is part of the pragma**, as in drift-lint. A silenced code with
  no reason is itself reported.
- **Suppressions are reported**, not hidden: the summary says
  `3 findings, 1 suppressed (handler-string)`, so a project can see what it is
  carrying.
- **Errors are suppressible but noisy about it.** An ignored `error` prints the
  reason every run. An ignored `warn` is quiet.
- **Never a key inside the TACO.** A `__bw_ignore` field would put tool
  metadata into the data model, and the data model is the product. The object
  you check must be the object you ship.

Most warnings should not need suppressing at all, because severity already
carries the "legal but ambiguous" cases. If a project finds itself silencing
the same code everywhere, that is a bug report about the code, not a config
exercise.

---

## Version matching

Verify ships inside the `bitwrench` package and its manifest is generated at
build time, so verify 2.1.12 knows exactly what bitwrench 2.1.12 reads.

> `>>> HOLE 6 -- nothing detects a mismatch.`
> A user can load `bitwrench-verify.js` from one version against
> `bitwrench.umd.min.js` from another, especially via CDN, and get confident
> wrong answers -- verify would report an `o` key or class as unknown when the
> loaded library supports it. The design asserts same-version but specifies no
> check. Cheap fix: verify compares its baked-in version against `bw.version`
> when `bw` is present, and emits one `version-mismatch` finding. Needs to be
> in the design.

---

## Running it over this repo

Verify runs against bitwrench's own `pages/` and `examples/` in CI. If it ever
finds nothing there, the checks are too weak.

---

## FAQ

**Can I ship it in production?** No, and you do not want to. It is a dev and
test tool: no bytes in the 46 KB core budget, and it walks your whole tree on
every call.

**Does it replace TypeScript?** No. Types check the code you wrote; verify
checks data that shows up at runtime -- from a server, a Python script, or a
model. A type system cannot see those.

**Why is `onClick` not an error?** Because it works.

**Why does it not check my `data-*` attributes?** bitwrench forwards unknown
attributes deliberately. Checking them would flag correct code.

---

## Holes, collected

| # | Hole | Severity |
|---|------|----------|
| 1 | Import path | **settled:** `bitwrench/verify`, with `import` and `types` |
| 2 | Finding codes were never enumerated in the design as a closed list, and they are public API | must settle before code. The list in this guide is the proposal |
| 3 | `verify.install()` -- in 2.1.12 or later? Inline TACO is already covered by calling `verify()` on the object | open, not a gate |
| 4 | Who runs it when the author is not writing JavaScript | **settled:** library plus a thin CLI. See "I am not writing JavaScript" |
| 5 | Suppression | **settled:** `{ ignore: [codes] }` in the library, a `# bw-verify-ignore:` pragma for files, reasons required, suppressions reported, never a key in the TACO |
| 6 | Version mismatch | **settled:** a `version-mismatch` warn when verify's version differs from `bw.version` |

`verify()` accepts a top-level array, since `bw.mount('#app', [a, b])` does.
A JavaScript sender that wants the run to fail calls `verify(taco, { mode: 'wire' })`
and refuses to send. The CLI does that by default on a file or a pipe.
