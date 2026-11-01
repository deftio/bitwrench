# bitwrench-verify

A companion checker for TACO objects. It reads your UI description and tells
you what bitwrench will quietly ignore.

You call it. bitwrench does not.

```javascript
verify({ tag: 'h1', c: 'Hello' });
// [ { severity: 'error', code: 'not-an-element', path: '', key: 'tag', hint: 't' } ]
```

That object renders the text `[object Object]` on your page today, because it
has no `t`. If you are looking at the page, you already know. Verify is how a
test says the same thing when nobody is looking.

## It is optional, and that is the point

bitwrench renders without it. There is no required build step and verify does
not add one. Nothing in the library calls it, and it never runs in production.

Reach for it when the TACOs are **generated, numerous, or leaving your hands**:
a component library, UI built from database rows, an LLM emitting TACO, a
device pushing frames you cannot see, a CI run you want to keep honest for
years.

Skip it when the shapes are a handful of fixed cards and someone can see the
page. The first render already told you.

It is not a type checker -- `bitwrench.d.ts` ships, and types check code you
wrote, not data that arrived at runtime. It is not a linter for your CSS or
your JavaScript.

## Getting it

Its own artifact, deliberately: **under 7 KB raw, under 3 KB gzipped**, and not part of
the bitwrench core bundle. A development-time checker has no business in
anyone's production payload, which is also why it sits outside the 46 KB core
budget. A bundle test asserts it never leaks in.

**Browser**, a script tag after bitwrench:

<!-- doc-test: skip (script-tag install; the harness has no page to load them into) -->
```html
<script src="bitwrench.umd.min.js"></script>
<script src="bitwrench-verify.min.js"></script>
<script>
  bwv.verify({ t: 'h1', c: 'hi' });   // []
</script>
```

From a CDN:

```html
<script src="https://cdn.jsdelivr.net/npm/bitwrench@2/dist/bitwrench-verify.min.js"></script>
```

**ESM** -- a subpath of the same package, so the version always matches:

<!-- doc-test: skip (ESM import statement, shown for the reader to copy) -->
```javascript
import verify from 'bitwrench/verify';
// or: import { verify } from 'bitwrench/verify';
```

**CommonJS** -- destructure it. `require()` returns a namespace object
(`{ default, verify }`), not the function:

<!-- doc-test: skip (CommonJS require, shown for the reader to copy) -->
```javascript
const { verify } = require('bitwrench/verify');
```

## Your first check

`verify()` takes a TACO, an array of them, or anything you would pass to
`bw.mount()`. It returns an array of findings. Empty means clean.

```javascript
verify({ t: 'div', a: { class: 'bw_bccl_card' }, c: 'ok' });   // []

verify({ t: 'div', cc: 'oops' });
// [ { severity: 'error', code: 'unknown-key', path: '', key: 'cc', hint: 'c' } ]
```

Arrays at the top level work, because `bw.mount()` accepts them:

```javascript
verify([{ t: 'p', c: 'a' }, { t: 'p', c: 'b' }]);   // []
```

It never throws on bad input and never mutates what you pass it.

For tests, `verify.assert()` throws instead:

<!-- doc-test: skip (throws on purpose, which is the point being shown) -->
```javascript
verify.assert({ t: 'div', cc: 'x' });
// Error: bitwrench-verify: unknown-key at '' (cc -- did you mean c?)
```

## Reading a finding

Every finding is an object, so you can filter instead of grepping strings:

| Field | Meaning |
|-------|---------|
| `severity` | `'error'` or `'warn'` -- see below |
| `code` | what is wrong, from the closed list below |
| `path` | where, as a location like `c[0].a.class`; empty string for the root |
| `key` | the offending key or token, when there is one to name |
| `hint` | a suggested correction, only when it is unambiguous |

### error vs warn

**`error`** means the library will ignore this, or render something you did not
ask for. There is no reading of the code under which it does what it says.

**`warn`** means it is legal, and verify cannot reliably tell what you meant.
A string `on*` handler is the example: it is the whole point of
`bw.htmlPage({ runtime: 'shim' })`, and it is a dead control on a bwserve
frame. Same object, opposite verdicts, and only you know the destination.
Verify says so and moves on.

`verify.assert()` fails on errors. Warnings are reported and do not fail,
unless you ask:

<!-- doc-test: skip (throws on purpose: strict makes the warning fatal) -->
```javascript
var taco = { t: 'button', a: { onclick: 'save()' }, c: 'Go' };
verify.assert(taco, { strict: true });   // throws: handler-string is a warning
```

A warning that failed the build by default would make verify something people
switch off.

### The codes

A closed list. These are public API -- people filter and assert on them -- so
renaming one is a breaking change.

**Errors**

| Code | Means | Example |
|------|-------|---------|
| `not-an-element` | an object with neither a string `t` nor `__bw_raw`; renders `[object Object]` | `{ tag: 'h1' }` |
| `unknown-key` | a top-level key other than `t`, `a`, `c`, `o` | `{ t: 'h1', cc: 'x' }` |
| `t-not-string` | `t` is present but not a string | `{ t: 42 }` |
| `attrs-not-object` | `a` is not a plain object | `{ t: 'p', a: 'class' }` |
| `opts-not-object` | `o` is not a plain object | `{ t: 'p', o: 'mounted' }` |
| `bad-class` | `class` is neither a string nor an array whose entries are strings or falsy. Falsy entries are dropped by the renderer, so the conditional form `[isOn && 'active', 'card']` is fine; a truthy non-string survives into the class list | `{ a: { class: 7 } }` |
| `bad-style` | `style` is neither a string nor a plain object | `{ a: { style: 7 } }` |
| `bad-raw` | a `__bw_raw` object missing a string `v`, or carrying other keys | `{ __bw_raw: true }` |
| `function-not-handler` | a function on an attribute that is not `on*`; it gets stringified, not called | `{ a: { title: fn } }` |
| `function-as-content` | a function as `c`; it gets stringified | `{ t: 'p', c: fn }` |
| `opt-not-function` | a lifecycle hook (`mounted`, `unmount`, `render`) that is not a function, so it never runs. Checked in **both** modes | `{ o: { mounted: 'x' } }` |
| `opt-not-object` | `handle` or `slots` holding something other than an object. A string `handle` crashes hydration -- the renderer iterates its keys and calls `.bind` on each character | `{ o: { handle: 'go' } }` |
| `cycle` | the tree contains itself | `taco.c = taco` |
| `too-deep` | nesting past 512 levels; almost always an accidental cycle | -- |
| `function-in-wire` | **wire mode only:** a function value. JSON cannot carry it | `{ a: { onclick: fn } }` |
| `verify-failed` | verify itself threw on your input. A checker that crashes is worse than one that misses something, so it reports instead | -- |

**Warnings**

| Code | Means | Example |
|------|-------|---------|
| `attr-typo` | an attribute one edit from a name the library treats specially. Unknown attributes are forwarded on purpose, so this is a suggestion, and a real HTML attribute (`form`, `is`) is never offered one | `{ a: { clas: 'x' } }` |
| `handler-string` | `a.on*` holds a string. Correct for `bw.html()` and `runtime: 'shim'`; stripped by `bw.apply()`, so a dead control on a frame. **An error in wire mode**, where it is definitively dead | `{ a: { onclick: 'save()' } }` |
| `unknown-opt-maybe` | an `o` key the renderer may not read. A hint, because tier 1 does not own the option list | `{ o: { nope: 1 } }` |
| `object-as-content` | a non-plain object as content (a `Date`, a `Map`, a class instance); it gets stringified | `{ c: new Map() }` |
| `raw-unsafe` | a `__bw_raw` value containing something that executes | `bw.raw('<img src=x onerror=f()>')` |
| `raw-unchecked` | a `__bw_raw` value verify looked at and cannot judge. Reported once per tree, not per node | any other raw content |

Note what is **not** an error: `onClick` works. The renderer normalises `on*`
with `slice(2).toLowerCase()`, so `onClick` becomes `click` and fires. Verify
will not call a working thing a failure.

### Raw content: what verify can and cannot say

`bw.raw()` content is a string that bypasses escaping. Verify is not in the
46 KB bundle, so unlike the library it can afford to look inside it.

It reports with confidence: an event-handler attribute (`onerror`,
`onmouseover`, ...), a `javascript:` URL, `srcdoc`, and `<script>`. The
destination changes the risk, which is measured rather than assumed:

- **`innerHTML` path** (`bw.mount`, `bw.patch`): a `<script>` tag is inert by
  spec, but handler attributes and `javascript:` URLs execute.
- **`bw.html()` path**: the string is returned verbatim into a document, so a
  `<script>` **does** execute when the browser parses the page.

The same raw string is therefore more dangerous served than mounted, and
verify does not always know which you are doing. Hence `warn`, with the path
named.

What it will not claim is that raw content is *safe*. A pattern scan can be
defeated by mutation-XSS and by encodings it does not normalise.
`raw-unchecked` says so out loud rather than implying a clean bill of health.

## In your tests

This is the point of the tool. A TACO is data, so testing it needs no browser,
no jsdom and no snapshot files.

<!-- doc-test: skip (illustrative fragment: the ignore comment style, not a statement) -->
```javascript
// doc-test: skip (illustrative test suite; needs the reader's own components)
import verify from 'bitwrench/verify';
import * as ui from '../src/components.js';

describe('every component returns valid TACO', () => {
  Object.keys(ui).forEach((name) => {
    it(name, () => {
      assert.deepStrictEqual(verify(ui[name](SAMPLE[name])), []);
    });
  });
});
```

`assert.deepStrictEqual(verify(taco), [])` is the assertion to reach for: it
prints the finding when it fails, so the failure tells you what is wrong rather
than just that something is.

**If your tree contains `bw.raw()`, assert on errors instead.** Any raw value
verify cannot judge produces one `raw-unchecked` warning per tree -- including
`bw.raw('<b>plain</b>')` -- so the empty-array assertion fails on every tree
with raw content in it. That is the warning doing its job, not a defect, but it
means the assertion above is the wrong one for those trees:

```javascript
var taco = { t: 'p', c: bw.raw('<b>trusted</b>') };
var errors = verify(taco).filter(function (f) { return f.severity === 'error'; });
errors;   // [] -- the raw-unchecked warning is reported, not fatal
```

This is what bitwrench's own suite does when it checks the TACO in its docs and
pages: errors fail the build, warnings are reported and read by a human.
`verify.assert(taco)` applies the same rule, which is why it does not throw on
a warning unless you pass `strict`. `ignore: ['raw-unchecked']` is the other
option when a project has decided about its raw content once.

If your app has no component factories, check the thing you do have -- the
object you are about to mount:

```javascript
const page = { t: 'main', c: rows.map(function (r) { return { t: 'p', c: r.name }; }) };
verify(page);   // []
```

## The two modes

`authored` is the default: a TACO you wrote by hand, where functions are
normal and expected.

`wire` is for a TACO that will cross JSON -- a bwserve frame, an LLM payload, a
message from a device. It additionally rejects functions and flags string
`on*` handlers, because neither survives `JSON.stringify` or `bw.apply()`:

```javascript
verify({ t: 'b', a: { onclick: function () {} } }, { mode: 'wire' });
// [ { severity: 'error', code: 'function-in-wire', path: 'a.onclick', key: 'onclick' } ]
```

The same object is clean in `authored` mode, because there it works.

Two codes change with the mode, because the mode is what decides whether the
thing is a mistake:

| Code | authored | wire |
|------|----------|------|
| `handler-string` (a string `on*`) | `warn` -- correct for `bw.html()` | **`error`** -- `bw.apply()` strips it, so the control is dead |
| a function as content | `function-as-content` | `function-in-wire` |

A function anywhere in `a` or `o` is an error in wire mode only; in authored
mode it is how handlers and lifecycle hooks are written. That includes one
*nested* in `o.state` or inside an object attribute value such as `a.style` --
`JSON.stringify` drops those silently, so the frame that left the checker would
not be the frame that arrives. The scan is depth-capped and cycle-safe, because
state is your data.

The hook type checks (`opt-not-function`, `opt-not-object`) run in **both**
modes. A string `mounted` cannot run wherever it came from, and wire is the
mode where you are least able to see it.

## When verify is wrong

It will be, sometimes. Suppress a specific code:

```javascript
var taco = { t: 'button', a: { onclick: 'save()' }, c: 'Go' };
verify(taco, { ignore: ['handler-string'] });   // []
```

Codes only. `'all'` is deliberately not honoured -- you silence a particular
thing you have thought about, never the tool.

Suppression is visible rather than silent. The returned array carries a count
and the codes it hid:

```javascript
var taco = { t: 'button', a: { onclick: 'save()' }, c: 'Go' };
var findings = verify(taco, { ignore: ['handler-string'] });
findings.suppressed;        // 1
findings.suppressedCodes;   // ['handler-string']
```

Both are non-enumerable, so `assert.deepStrictEqual(findings, [])` still
passes on a clean tree. A project can print `suppressedCodes` in CI and see
what it is carrying.

## What verify does not check yet

Being explicit, so nothing here reads as a promise:

- **BCCL factory props.** `makeButton({ href: '/x' })` is ignored by the
  factory. The factories warn about unknown props at runtime
  (`bw.warnUnknownProps`), but verify does not yet read a manifest of them.
- **Event-handler names.** `onchnage` normalises to `chnage`, which is not a
  real event, so the listener never fires. Verify does not catch it.
- **Class tokens.** A misspelled `bw_bccl_crad` matches no rule and silently
  does nothing.
- **Page-level checks** -- duplicate ids, slots matching nothing -- which need
  a live DOM.

## The other door: bwcli verify

A JavaScript sender calls the library. Anything else -- a C++ or Python
generator, a shell pipeline, a CI job -- pipes a payload at the CLI:

```
bwcli verify frame.json
some-generator | bwcli verify
cat frames.ndjson | bwcli verify
```

**Wire mode is the default here**, because a file or a pipe is a payload that
has already crossed JSON. Authored mode is the library default, because there
the caller is holding JavaScript. Pass `--authored` to switch.

It is the same checker: a test that imports `verify` and a job that runs
`bwcli verify frame.json` report the same findings. The CLI does not grow its
own rules; it is the library plus file and stdin buffering.

| Flag | Effect |
|------|--------|
| `--authored` | Check as hand-written TACO; functions are allowed |
| `--strict` | Fail on warnings too |
| `--ignore <codes>` | Comma-separated codes to suppress |
| `--json` | Machine-readable output |
| `-q, --quiet` | Print nothing; use the exit code |

Exit codes, so CI can branch on it: **0** nothing fatal, **1** at least one
error (or a warning under `--strict`), **2** the input could not be read or
parsed.

It accepts one JSON document, or newline-delimited frames -- a generator piping
a stream gets each frame checked and reported with its index. It also takes the
`r`-prefixed relaxed form the embedded senders emit. Note that relaxed JSON
allows single quotes and trailing commas but **not unquoted keys**:
`r{'t':'p'}` parses, `r{t:'p'}` does not, and the CLI says so rather than
surfacing a bare JSON error.

Bare metal has no Node, so the checker runs on the host: compile-time assets,
and any frame the host can already see. A frame built on the board and never
captured stays invisible until it crosses a pipe. Watching a live page the chip
is driving is bwserve's job, not verify's.

## Version matching

Verify ships inside bitwrench and is versioned with it, so
`bitwrench/verify` always matches the `bitwrench` beside it. If you load the
browser build from a CDN, pin the same major as the library:

```html
<script src="https://cdn.jsdelivr.net/npm/bitwrench@2/dist/bitwrench.umd.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/bitwrench@2/dist/bitwrench-verify.min.js"></script>
```

## See also

- [TACO format](taco-format.md) -- what verify is checking against
- [Component cheatsheet](component-cheatsheet.md) -- when a prop does nothing
- [bwserve](bwserve.md) -- the wire protocol, and why `wire` mode exists
- [North star principles](bitwrench-northstar-principles.md) -- why the library
  itself does not do this
