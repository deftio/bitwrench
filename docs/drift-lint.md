# drift-lint — keeping the docs honest

`tools/drift-lint.js` is a repo-specific consistency checker. Where ESLint asks
"is this code well-formed?", drift-lint asks **"do the docs still tell the truth?"**

It exists because documentation rots silently. Code that calls a removed function
fails a test; a doc that *teaches* a removed function fails a user, months later,
with no error pointing back here. The v2.1 alignment release cleaned up exactly
this kind of rot — drift-lint is what makes that cleanup permanent instead of a
one-time event. Every API removal, rename, or terminology ruling gets encoded as
a rule, and from then on the stale form physically cannot reach a release.

## When it runs

| Trigger | Why there |
|---------|-----------|
| `npm run lint:drift` | Direct invocation |
| `posttest` (after every `npm test`) | Cheapest possible feedback loop |
| `postbuild` (after every `npm run build`) | Generated artifacts (e.g. `readme.html`) are scanned fresh |
| `tools/release.js` step 4 | A stale doc cannot ship |

It scans ~120 files in well under a second. No browsers, no network, no flake —
it is always safe to make blocking.

## What it scans

- **Directories (recursive):** `docs/`, `pages/`, `examples/`, `embedded_python/`
- **Root files:** `README.md`, `CONTRIBUTING.md`, `ABOUT.md`, `readme.html`
- **Extensions:** `.md`, `.html`, `.js`, `.py`, `.sh`, `.ts`
- **Skipped:** `node_modules`, `dist`, `coverage`, `.git`, and `dev/` (internal
  notes are allowed to discuss stale patterns — the SUPERSEDED archives live there)

`src/` is deliberately out of scope: working code is ESLint's jurisdiction, and
several rules (like the wire-format field renames) would false-positive against
the implementation that has to handle both forms.

`readme.html` is scanned even though it is generated: if someone fixes
`README.md` but forgets `npm run build:readme`, the mirror goes stale — which is
itself drift, and the postbuild hook catches it.

## Rule kinds

### Name rules

A token that should no longer appear. The simplest and most common kind:

<!-- drift-lint:ignore-start: documenting the rule format requires showing banned tokens -->
```javascript
{
  id: 'toggleStyles',
  pattern: /toggleStyles/g,
  message: 'bw.toggleStyles() → bw.toggleThemeMode()',
  contextExclude: [
    /removed|was removed|renamed|no longer|SUPERSEDED/i
  ]
}
```
<!-- drift-lint:ignore-end -->

Fields:

| Field | Meaning |
|-------|---------|
| `id` | Short name, shown in the failure report |
| `pattern` | Regex tested line by line |
| `message` | What to do instead — write it as `old → new` |
| `contextExclude` | Regexes that exempt a matching line (e.g. a removal note legitimately names the removed API) |
| `fileFilter` | Only scan matching paths (e.g. `/\.md$/`) |
| `fileExclude` | Skip matching paths entirely |

### Structural rules

An anti-pattern *shape* rather than a banned name — every individual token is
fine, the combination is wrong. Structural rules add two fields: `followedBy`
(evidence regex) and `within` (line window). The rule fires when the anchor
matches and the evidence appears within N lines:

```javascript
{
  id: 'mounted-event-wiring',
  pattern: /\bmounted\s*:/,                          // anchor
  followedBy: /\.addEventListener\(\s*['"](?:click|input|...)['"]/,  // evidence
  within: 3,
  message: 'event handler wired in o.mounted is lost on bw.refresh() — use a: { onclick: fn }',
  fileFilter: /\.(html|js)$/,
  contextExclude: [
    /['"`].*addEventListener.*['"`]/,   // quoted demo code in comparison pages
    /window\.addEventListener|document\.addEventListener/  // page-level listeners are fine
  ]
}
```

For structural rules, `contextExclude` is applied to the **evidence line** —
that's where false-positive context lives (a quoted code string, a
window-level listener).

This rule enforces the #1 documented mistake in the lifecycle model: handlers
attached via `addEventListener` inside `o.mounted` are silently lost when the
component re-renders via `bw.refresh()`. Handlers belong in `a: { onclick: fn }`,
which bitwrench re-attaches on every render.

## The ignore pragma

Sometimes a scanned file must legitimately contain a banned pattern — this
document is the canonical example. Others: documenting how old versions worked,
counter-examples shown for discussion, quoting other frameworks' APIs. Wrap the
block and **give a reason**:

```markdown
<!-- drift-lint:ignore-start: comparison table quotes the old 2.0 API on purpose -->
...exempt content...
<!-- drift-lint:ignore-end -->
```

Any comment style works — the scanner matches the pragma text itself, so `//`,
`#`, `/* */`, and `<!-- -->` are all fine:

```javascript
// drift-lint:ignore-start: demo intentionally shows the WRONG pattern for teaching
...
// drift-lint:ignore-end
```

Guard rails, so exemptions can't silently swallow more than intended:

- `ignore-start` without a reason → **warning** (the run still passes — a
  hotfix shouldn't be blocked on prose — but the nag prints on every run
  until a reason is added. Pragmas without context become archaeology:
  months later nobody knows what the exemption was protecting.)
- `ignore-start` never closed → **error** (prevents accidentally exempting the rest of a file)
- `ignore-end` without a start → **error**
- nested `ignore-start` → **error**
- `node tools/drift-lint.js --verbose` lists every honored block with its
  file, line range, and reason — audit them occasionally; each one is debt
- the summary line always shows the honored-block count

Prefer `contextExclude` on the rule over pragmas in files: an exclusion encodes
*why* a context is acceptable once, centrally; pragmas scatter exemptions
through the tree. Use the pragma when a single file has a unique, legitimate
need the rule shouldn't generalize.

## Adding a rule

When you remove, rename, or re-decide something user-facing:

1. Add the rule to `RULES` in `tools/drift-lint.js` in the same commit as the
   change. The rule *is* the enforcement half of the decision.
2. Write the message as the migration: `old → new`, not just "don't".
3. Run `npm run lint:drift` — it will list every place the old form survives.
   Fix them all in the same commit if feasible.
4. Add `contextExclude` entries only for patterns of legitimate use you actually
   observed, not hypothetical ones.
5. If a doc must keep the old form (removal notes, migration guides,
   comparison tables), prefer a `contextExclude`; reach for the pragma only
   for one-off cases.

## Current rule inventory

<!-- drift-lint:ignore-start: the inventory table must name the banned patterns it documents -->

| Rule | Catches | Correct form |
|------|---------|--------------|
| `client.render` / `client.exec` / `client.query` / `client.register` | 2.0 bwserve client APIs | `client.mount()`; exec/query/register removed |
| `bw.createDOM` | 2.0 name | `bw.create()` |
| `bw.cleanup` | 2.0 name | `bw.unmount()` |
| `bw.component` | removed API | TACO `o:` options |
| `data-bw-action` | 2.0 action attribute | `bw_act_*` CSS class |
| `allowExec` / `--allow-exec` / `/exec` | removed exec surface | removed in v2.1 |
| `wire:target` / `wire:node` | 2.0 wire field names | `"ref"` / `"taco"` |
| `parseRJSON` | 2.0 name | `bw.parseJSONFlex()` |
| `levels-taxonomy` | "Level 0/1/2" component taxonomy | descriptive stage names |
| `toggleStyles` | removed API | `bw.toggleThemeMode()` |
| `bw_card-bare` / `bw_btn-bare` | pre-rename BCCL class names in docs | `bw_bccl_card` / `bw_bccl_btn` (the bare forms remain valid as stylesheet classes) |
| `bw-container` | hyphen class form | `bw_container` (underscore canonical) |
| `normalizeClass` | never-shipped API | remove reference |
| `three-level` | stale component-model count | describe stages, don't count |
| `outline-hyphen` | hyphen variant spelling | `outline_primary` etc. |
| `reactive-self` | "reactive" as self-description | "explicit stateful" / "state + explicit re-render" (comparative uses are excluded) |
| `getHandle` | removed API | handles live on `el.bw` directly |
| `update-as-rerender` | prose claiming `bw.update()` re-renders | `bw.update()` dispatches; re-render is `bw.refresh()` |
| `mounted-event-wiring` | structural: DOM event handlers wired in `o.mounted` | `a: { onclick: fn }` |

<!-- drift-lint:ignore-end -->

## Design constraints

- **Zero dependencies, zero flake.** Plain-string scanning only. If a rule
  needs an AST, it belongs in ESLint; if it needs a browser, it belongs in
  Playwright. Drift-lint stays fast enough that nobody is ever tempted to
  skip it.
- **Every rule earns its place by having fired at least once.** Rules encode
  real drift that actually happened (or a decision actually made), not
  hypothetical hygiene.
- **False positives are rule bugs.** If a legitimate line trips a rule, fix
  the rule (`contextExclude`), don't pragma around it — the next legitimate
  use will trip it again.
