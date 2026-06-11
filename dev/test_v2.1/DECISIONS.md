# 2.1 Implementation Micro-Decisions

Append-only log. When the spec + tests underdetermine a choice, an agent
makes the smallest reasonable call, ADDS a test pinning it, and records
one line here. Manu reviews this file at phase gates — not diffs.
Prose and tests must never diverge: a decision logged here that changes
spec meaning gets folded into the spec the same day (foldback rule).

Format:

```
[package] [date] question → choice → pinning test
```

Example (illustrative only):

```
[02] 2026-06-12 does patch(ref, "") clear text or no-op? → clears (empty
string is a value, null would be the no-op) → 02-operations "patch with
empty string clears textContent"
```

— log starts below —
