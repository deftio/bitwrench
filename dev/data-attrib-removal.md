# data-* Attribute Removal -- Full Refactor Spec

## Status: Open (P0 in qa-todo.md)

## Why

bitwrench 1.x never used HTML `data-*` attributes. They were introduced in 2.x
without approval, following React/jQuery conventions that don't belong in
bitwrench's design. The v2.0.19 release cleaned them out of core (`bitwrench.js`,
`bitwrench-bccl.js`), but an unauthorized exception was carved out for bwserve's
`data-bw-action` and `data-bw-id`. That exception leaked the pattern into
examples, pages, docs, tools, and the embedded C header.

This is not cosmetic. `data-*` attributes are an architectural violation:

- bitwrench identifies elements by CSS classes (`bw_uuid_*`) or element IDs
- bitwrench stores state in closures or DOM properties (`el._bw_*`)
- bitwrench routes events by element ID, not by magic attribute selectors
- `data-*` is a React/Angular/Vue pattern. bitwrench is none of those.

## Scope

**179 occurrences** of `data-bw-action`/`data-bw-id` across 39 files.
**79 occurrences** of `getAttribute('data-')`/`dataset.*` across 41 files.

But most of that is docs, dist (auto-rebuilt), and archive (dead). The real
code change is small.

### What changes

| Category | Files | Real work |
|----------|-------|-----------|
| bwserve source | 2 (bwclient.js, index.js) | Medium -- redesign event forwarding |
| bwserve examples | 5 server files + 1 README | Easy -- mechanical once protocol fixed |
| Pages | 5 HTML files | Medium -- state-debug.html is chunky |
| Tools | 4 JS files | Easy |
| Docs | ~10 .md files | Tedious but mechanical |
| embedded_c | 1 .h + 1 README | Tiny |
| Tests | ~5 files | Must track source changes |
| dist/ releases/ | auto-rebuilt | Zero manual work |
| dev/archive/ | ~12 files | Add top-of-file note, do not rewrite |

### What does NOT change

- `src/vendor/quikdown.js` -- third-party vendored code, uses `data-qd-*`
- `src/vendor/html2canvas.min.js` -- third-party
- English prose containing "data-driven", "data-oriented", etc. -- not attributes

## The Core Change: bwclient.js Event Forwarding

This is the only runtime code that generates or reads `data-*`. Everything
else flows from it.

### Current model (WRONG)

Server-side TACO includes `'data-bw-action': 'inc'` on buttons. bwclient.js
has a document-level click handler that does:

```javascript
// bwclient.js lines 108-119 -- current (data-bw-action)
_client._wireActions = function() {
  document.addEventListener("click", function(e) {
    var el = e.target.closest("[data-bw-action]");
    if (!el) return;
    e.preventDefault();
    var actionData = {};
    if (el.getAttribute("data-bw-id"))
      actionData.bwId = el.getAttribute("data-bw-id");
    // ... snip input collection ...
    _client.sendAction(el.getAttribute("data-bw-action"), actionData);
  });
};
```

Server-side dispatch in `index.js` (line 393) extracts `data.result.action`
from the POST body and calls `client._dispatch(action, payload)`.

Server app code uses:

```javascript
client.on('inc', function(data, client) {
  count++;
  client.patch('val', String(count));
});
```

### New model (ID-based)

Buttons get an `id` attribute instead. bwclient.js walks up to the nearest
element with an `id` and posts that:

```javascript
// bwclient.js -- replacement
_client._wireActions = function() {
  document.addEventListener("click", function(e) {
    var el = e.target.closest("[id]");
    if (!el) return;
    // Skip non-interactive elements (don't fire on every div click)
    var tag = el.tagName;
    if (tag !== "BUTTON" && tag !== "A" && tag !== "INPUT"
        && !el.classList.contains("bw_clickable")) return;
    e.preventDefault();
    var actionData = { target: el.id };
    // Collect sibling input value (same as before)
    var form = el.closest("div") || document;
    var inp = form.querySelector("input[type=text],input:not([type])");
    if (inp) { actionData.inputValue = inp.value; inp.value = ""; }
    _client.sendAction(el.id, actionData);
  });
  document.addEventListener("keydown", function(e) {
    if (e.key === "Enter" && e.target.tagName === "INPUT") {
      var form = e.target.closest("div") || document;
      // Find nearest button with an id
      var btn = form.querySelector("button[id],a[id]");
      if (btn) {
        _client.sendAction(btn.id, { target: btn.id, inputValue: e.target.value });
        e.target.value = "";
      }
    }
  });
};
```

Server-side dispatch (`index.js` line 393) stays the same shape -- it already
extracts `data.result.action` which will now be an element ID string.

Server app code becomes:

```javascript
// Same API, action name is now the element ID
client.on('inc', function(data, client) {
  count++;
  client.patch('val', String(count));
});
```

TACO changes from:

```javascript
// OLD
{ t: 'button', a: { 'data-bw-action': 'inc', class: 'bw_btn' }, c: '+1' }

// NEW
{ t: 'button', a: { id: 'inc', class: 'bw_btn' }, c: '+1' }
```

### Behavioral differences

1. **Interactive filter**: The new handler only fires for `<button>`, `<a>`,
   `<input>`, or elements with class `bw_clickable`. The old handler fired for
   anything with `data-bw-action`. This is better -- it prevents accidental
   clicks on random divs from becoming server events.

2. **Element identification**: Old model used two attributes (`data-bw-action`
   for the action name, `data-bw-id` for an optional secondary ID). New model
   uses `id` for both. If you need a secondary identifier, use a class or
   DOM property.

3. **Backwards compatibility**: This is a BREAKING change for anyone using
   `data-bw-action` in bwserve apps. Since bwserve is pre-1.0 and the API
   surface is small, this is acceptable.

## Replacement Patterns (non-bwserve)

For `data-*` usage outside bwserve, here are the mechanical replacements:

| Old pattern | New pattern | Where used |
|------------|------------|------------|
| `data-bw-action="X"` | `id="X"` | bwserve buttons, examples |
| `data-bw-id="Y"` | `id="Y"` | bwserve element addressing |
| `data-testid="Z"` | `id="Z"` or class `bw_test_Z` | ember-and-oak example |
| `data-theme="T"` | `el._bw_theme = T` (DOM property) | component-gallery, screenshot tool |
| `data-preset="P"` | `el._bw_preset = P` (DOM property) | bwserve-sandbox |
| `data-tab="N"` | closure variable or `el._bw_tab = N` | state-debug.html |
| `data-api-name="F"` | class `bw_api_F` or `el._bw_apiName = F` | build-api-reference, 08-api-reference |
| `data-category="C"` | class `bw_cat_C` or `el._bw_category = C` | build-api-reference |
| `data-card-name` | `el._bw_name = N` | state-debug.html |
| `data-tip` | `title` attribute or `el._bw_tip` | state-debug.html |
| `data-type` / `data-id` | class or `el._bw_type` / `el.id` | live-feed example |
| `data-list-item` | class `bw_list_item` | state-debug.html |
| `getAttribute('data-X')` | read the replacement (property, class, id) | everywhere |
| `setAttribute('data-X', v)` | set the replacement | everywhere |
| `el.dataset.X` | `el._bw_X` or `el.id` or class | everywhere |

General rule: if it's identity, use `id` or `bw_uuid_*` class. If it's state,
use a closure or `el._bw_*` DOM property. If it's a test hook, use `id` or a
`bw_test_*` class.

## File-by-File Audit

### Source code (runtime)

**`src/bwserve/bwclient.js`** (7 occurrences) -- THE core change
- Line 11: comment "data-bw-action click/key delegation" => "ID-based click/key delegation"
- Line 107: comment => update
- Line 110: `closest("[data-bw-action]")` => `closest("[id]")` + tag filter
- Line 114: `getAttribute("data-bw-id")` => remove (use el.id)
- Line 118: `getAttribute("data-bw-action")` => `el.id`
- Line 123: `querySelector("[data-bw-action]")` => `querySelector("button[id],a[id]")`
- Line 125: `getAttribute("data-bw-action")` => `btn.id`

**`src/bwserve/index.js`** (0 direct data-*, but action dispatch)
- Line 393: `data.result.action` stays as-is -- value will now be element ID string

**`src/mcp/knowledge.js`** (1 occurrence)
- Line ~127: documentation string mentioning `data-bw-action` => update text

### Examples

**`examples/client-server/server.js`** (4 occurrences)
- Lines 45, 49, 53, 111: `'data-bw-action': 'X'` => `id: 'X'` in TACO attrs

**`examples/client-server/screenshot-server.js`** (2 occurrences)
- Lines 60, 64: same pattern

**`examples/client-server/README.md`** (2 occurrences)
- Lines 11, 42: prose + example code

**`examples/llm-chat/server.js`** (1 occurrence)
- Line 83: `data-bw-action` => `id`

**`examples/embedded-rpi/server.js`** (2 occurrences)
- Lines 452-453: `data-bw-action` and `data-bw-id` => `id`

**`examples/live-feed/index.html`** (~4 occurrences)
- Lines 198-199, 249, 278: `data-type`/`data-id` => DOM properties or classes

**`examples/ember-and-oak/index.html`** (~30 occurrences)
- Many `data-testid` throughout => `id` or `bw_test_*` classes

### Pages

**`pages/12-bwserve-protocol.html`** (~9 occurrences)
- Protocol documentation examples throughout => update to ID-based

**`pages/14-bwserve-sandbox.html`** (~11 occurrences)
- Lines 30, 89, 603-622: `data-bw-action` in examples => `id`
- Lines 694-695: `action()` helper => rewrite
- Lines 738-739, 761: `data-preset` => DOM property

**`pages/state-debug.html`** (~12 occurrences)
- Lines 321, 341, 345, 371: `data-tab` => closure or `_bw_tab`
- Lines 426, 611: `data-card-name` => `_bw_name`
- Lines 621, 838, 897, 900: `data-testid`, `data-tip`, `data-list-item` => id/class/property

**`pages/component-gallery.html`** (1 occurrence)
- Line 44: `data-theme` => DOM property

**`pages/08-api-reference.html`** (2 occurrences)
- Lines 133, 143: `getAttribute('data-api-name')` => class or property

### Tools

**`tools/component-tester.mjs`** (4 occurrences)
- Lines 30, 76, 86, 93: `data-bw-action` => `id`

**`tools/screenshot.cjs`** (2 occurrences)
- Lines 186, 190: `data-theme` set/remove => DOM property or class toggle

**`tools/build-api-reference.js`** (4 occurrences)
- Lines 307-308, 368, 380: `data-api-name`/`data-category` => class or property

**`tools/analyze-bccl.js`** (1 occurrence)
- Line 84: `data-bs-toggle` in allowlist => remove entry

### Docs

**`docs/bwserve.md`** (12 occurrences) -- heaviest doc
- Lines 36-37, 47, 68-69, 192, 196, 434, 441, 640, 661, 671-672
- Wire protocol diagram, rules, all code examples

**`docs/tutorial-bwserve.md`** (4 occurrences)
- Lines 57-59, 82-83

**`docs/app-patterns.md`** (2 occurrences)
- Lines 146, 159: Pattern 3 bwserve example

**`docs/taco-format.md`** (1 occurrence)
- Line 56: `'data-action': 'save'` example => `id: 'save'`

**`docs/thinking-in-bitwrench.md`** (2 occurrences bw-action + 1 namespace discussion)
- Lines 161, 869, 892, 920

**`docs/llm-bitwrench-guide.md`** (2 occurrences)
- Lines 474, 483-484

**`docs/bitwrench_typescript_usage.md`** (1 occurrence)
- Line 134: `'data-id': '123'` => `id: 'item-123'`

**`docs/bitwrench-for-wasm.md`** -- already cleaned, verify zero

### Design docs

**`dev/bw-client-server.md`** (17 occurrences) -- the protocol design doc
- Must rewrite to reflect ID-based model

**`dev/2.0.26-release-planning.md`** (2 occurrences)
- Task #20 says bwserve is exempt -- update to say it is NOT exempt

**`dev/bw2x-state-and-addressing.md`** (3 occurrences)
- Update addressing examples

**`dev/bitwrench-mcp-server-design.md`** (2 occurrences)

### embedded_c

**`embedded_c/bitwrench.h`** (2 occurrences)
- Line 88-89: example comment using `data-bw-action` => `id`

**`embedded_c/README.md`** (2 occurrences)
- Lines 95, 98: example code => `id`

### Tests

**`test/bitwrench_test_bwserve.js`** (4 occurrences) -- must update to ID-based
**`test/bitwrench_test_coverage.js`** (2 occurrences) -- generic data-x attr tests
**`test/bitwrench_test_lifecycle.js`** (2 occurrences) -- getAttribute tests
**`test/bitwrench_test_new_apis.js`** (2 occurrences)
**`test/bitwrench_test_uuid.js`** (1 occurrence)
**`test/state-debug.spec.js`** (1 occurrence) -- Playwright test

### Archive (do NOT rewrite)

`dev/archive/` contains ~12 files with ~40 total `data-bw-action` references.
These are historical design docs and demos from pre-v2.0.19. Do not rewrite
them -- they are dead. Add a one-line note at the top of each if desired:

```
<!-- NOTE: This archive doc uses data-* attributes. See dev/data-attrib-removal.md -->
```

### dist/ and releases/

`dist/bwserve.cjs.js`, `dist/bwserve.esm.js`, `releases/v2/bwserve.*` -- these
are build outputs. They will be clean after rebuilding from the fixed source.
Zero manual work.

## Execution Order

1. **bwclient.js** -- fix the event forwarding (the root cause)
2. **bwserve tests** -- update `test/bitwrench_test_bwserve.js`, run suite
3. **Examples** -- mechanical: `data-bw-action` => `id` in TACO, verify `client.on()` still matches
4. **Pages** -- work through each, replace with closures/properties/IDs
5. **Tools** -- update data-theme/data-api-name patterns
6. **Docs** -- rewrite all .md examples to ID-based model
7. **embedded_c** -- update the 4 lines in .h and README
8. **Design docs** -- update bw-client-server.md (the protocol spec)
9. **Compliance grep** -- verify zero `data-` hits outside vendor/ and archive/
10. **Full test suite** -- `npm run test`, `npm run lint`, Playwright

## Testing Checklist

- [ ] `npm run test` -- all 1778+ unit tests pass
- [ ] `npm run lint` -- clean
- [ ] `npx playwright test` -- all 14 example tests pass
- [ ] Manual: start `examples/client-server/server.js`, click buttons, verify events fire
- [ ] Manual: start `examples/llm-chat/server.js`, send messages, verify chat works
- [ ] Manual: open `pages/12-bwserve-protocol.html`, verify examples render correctly
- [ ] Manual: open `pages/14-bwserve-sandbox.html`, verify sandbox works
- [ ] Manual: open `pages/state-debug.html`, verify tab switching works
- [ ] Manual: open `pages/component-gallery.html`, verify theme swatches work
- [ ] Manual: open `pages/08-api-reference.html`, verify search/filter works
- [ ] Compliance: `grep -r "data-bw" src/ pages/ examples/ docs/ tools/ test/ embedded_c/` returns zero
- [ ] Compliance: `grep -rn "getAttribute.*data-\|setAttribute.*data-\|dataset\." src/ pages/ examples/ tools/` returns zero outside vendor/
