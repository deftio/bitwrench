# Bundle size: findings from the v2.1.6 investigation

Status: current as of v2.1.6 (Aug 2026)
Scope: what actually moves gzipped bundle size in this codebase, what does not,
and how to measure it correctly. Written after a false alarm where the release
gate reported the budget blown when it was not.

Read this before optimizing bundle size, changing the terser config, or
"fixing" the 45KB gate. Several of the obvious moves here have been measured
and are counterproductive.

---

## TL;DR

| Finding | Result |
| --- | --- |
| Terser ran with all defaults | `compress: {passes: 2}` => **-428 bytes** across bundles |
| Release gate measured the wrong file | Fixed; it re-gzipped at level 6 while shipping level 9 |
| String interning of repeated CSS props | **Backfires.** -8.5KB raw, **+310 bytes gzipped** |
| Bundle carrying dead weight? | No. No markdown, CLI, MCP, editor, html2canvas |
| Duplicated code? | One trivial case, ~30 gzipped bytes. Not worth it |
| Where the real headroom is | `bitwrench-styles.js`, 14.5KB gzipped = 32% of the bundle |

Net: ESM went from 86 bytes **over** budget to 26 bytes **under**, with no
feature or API change.

---

## 1. Measure the artifact you ship, not a re-compression of it

This caused a false alarm that cost real time, so it is first.

`tools/release.js` used to compute the budget with:

```js
gzipSync(readFileSync(path)).length     // zlib default == level 6
```

But `build:metrics` writes the `.gz` artifacts at **level 9**, and level 9 is
what actually reaches a browser: served pre-compressed off disk (how the
embedded targets do it), or re-compressed by nginx/a CDN at a comparable level.

The gap is about 146 bytes on the core bundle -- enough to flip a verdict:

| file | level 6 (old gate) | level 9 (shipped) |
| --- | --- | --- |
| `bitwrench.umd.min.js` | 46176 FAIL | 46030 pass |

The gate was failing a file nobody is ever sent. Now fixed:

```js
function gzSize(filePath) {
  const gzPath = join(root, filePath + '.gz');
  if (existsSync(gzPath)) return statSync(gzPath).size;
  return gzipSync(readFileSync(join(root, filePath)), { level: 9 }).length;
}
```

**Rule: when quoting a bundle size, state the compression level.** Node's
`zlib.gzipSync` defaults to 6; Python's `gzip.compress` defaults to 9. Mixing
the two produces contradictory conclusions from correct measurements. That is
exactly what happened during this investigation -- history was measured at
level 9 and the working tree at level 6, producing a bogus "already over
budget at HEAD" claim.

---

## 2. Terser: `compress: { passes: 2 }`

The single real win. Terser was invoked at 24 call sites in `rollup.config.js`
with only `format: { comments: /^!/ }` -- every compress and mangle option left
at its default, including `passes: 1`.

`rollup.config.js` now defines one shared helper:

```js
const minify = () => terser({ format: { comments: /^!/ }, compress: { passes: 2 } });
```

Measured on a real build:

| bundle | before | after | delta |
| --- | --- | --- | --- |
| `bitwrench.umd.min.js` | 46030 | 45924 | -106 |
| `bitwrench.esm.min.js` | 46166 | **46054** | -112 |
| `bitwrench.min.cjs` | 45936 | 45830 | -106 |
| `bitwrench-lean.umd.min.js` | 35897 | 35800 | -97 |
| | | | **-428** |

Also measured, and NOT worth adding:

- `passes: 3` -- byte-identical to `passes: 2`. No reason to pay the build time.
- `mangle: { toplevel: true }` -- zero gain. The UMD wrapper already scopes
  everything, so there are no top-level names left to shorten.

### Measure terser changes with a real build, not standalone

A standalone re-minification of `dist/bitwrench.esm.js` reported ESM and CJS
getting **~1000 bytes worse** with `passes: 2`. That was wrong. Re-minifying
already-rolled-up output is not equivalent to the terser plugin running inside
the rollup pipeline. The real build showed a 112-byte improvement.

Always `npm run build` and measure `dist/`.

---

## 3. String interning backfires -- do not do it

The bundle contains roughly 10KB of raw bytes in repeated quoted CSS property
names:

```
  89 x "background-color"     53 x "border-radius"
  88 x "font-size"            45 x "font-weight"
  38 x "margin-bottom"        37 x "border-color"
```

The obvious move is to intern them into a lookup table (`var _S=[...]`, then
`_S[7]` at each use site). Measured:

| variant | raw | gzipped | delta |
| --- | --- | --- | --- |
| baseline | 171209 | 45924 | -- |
| intern top 10 | 167190 | 45895 | -29 |
| intern top 30 | 164969 | 46001 | **+77** |
| intern top 60 | 163161 | 46144 | **+220** |
| intern top 120 | 162690 | 46234 | **+310** |

Raw size drops 8.5KB. **Gzipped size grows.** gzip already back-references
those literals cheaply, while `_S[47]` references add entropy and defeat the
existing matches.

This is the general trap: **raw-size intuition points the wrong way for
gzipped payloads.** Any transform that trades a long repeated string for a
short unique-ish token is likely to lose. Measure gzipped, never raw.

---

## 4. The bundle carries no passengers

Probed `dist/bitwrench.umd.min.js` for things that should not be there:

| module | in core bundle? |
| --- | --- |
| quikdown (markdown) | no |
| CLI code | no |
| MCP server | no |
| code editor | no |
| html2canvas | no |
| bwserve **client** (`EventSource`) | yes -- correct |
| bwserve **server** (`createServer`) | no -- correct |
| BCCL components, styles, router, file ops | yes -- intended |

The split is already right. There is no quick win from removing an
accidentally-bundled dependency.

### Code duplication

One case: three accordion handle methods in `src/bitwrench-bccl.js` (around
lines 2173, 2179, 2192) each do `el.querySelectorAll('.bw_bccl_accordion_item')`
then loop. Extracting a shared helper saves roughly 30 gzipped bytes, inside
the 11KB bccl bundle which is not the constrained one. Left alone deliberately;
the churn is not worth the bytes.

---

## 5. Where the headroom actually went, and where it still is

Gzipped `bitwrench.umd.min.js` across releases (level 6, the historical series):

```
2.0.32    40437   -5643 under budget
14b014b   45552    -528     <-- v2.1.0 lifecycle refactor: +3634 bytes
2.1.2     45616    -464
2.1.3     45632    -448
33188c3   45899    -181     prose classes
HEAD      45927    -153
```

**No committed bundle has ever crossed the budget.** The headroom is thin
because `14b014b` (v2.1.0 lifecycle refactor) consumed 87% of it in one
release, adding ~1000 lines to `src/bitwrench.js`: `mountTree`, `_mountNode`,
`_unmountNode`, `_hydrateElement`, `syncChildren`, `unmountChildren`,
`updateSlot`, the janitor, and the action dispatcher. That is real
functionality, not waste -- but it is why every 30-byte commit since has felt
like it is pushing the budget over.

### The one remaining large lever

Per-source gzipped contribution (from `dbg/build-metrics.jsonl`):

```
bitwrench.js            21188
bitwrench-styles.js     14530   <-- 32% of the core bundle
bitwrench-bccl.js       11743   (separate bundle)
bitwrench-color-utils    2744
bitwrench-utils.js       2094
```

`bitwrench-styles.js` is mostly static theme and rule objects. Splitting it the
way `bitwrench-lean` already splits BCCL would free roughly 14KB for anyone who
brings their own CSS. **That is a packaging/API change and is out of scope for
a size pass** -- recorded here as the only remaining lever of that magnitude.

---

## 6. ESM is a special case

`bitwrench.esm.min.js` gzips *larger* than UMD despite being 116 bytes smaller
raw. The cause is the named-export list at the end of the file: 51 exports,
896 bytes raw, costing **346 gzipped bytes**.

That list exists for tree-shaking (`src/bitwrench-esm-entry.js`). Measured with
esbuild, tree-shaking does not currently work:

```
import { makeButton } only     gzip9  48411
import default bw              gzip9  48410
```

A one-byte difference. Importing a single component costs the same as importing
everything. Cause: `package.json` has no `sideEffects` field, so bundlers must
assume every module has side effects, and `src/bitwrench.js` performs 108
module-level `bw.x = ...` assignments building one object.

So ESM currently pays 346 bytes for a feature that does not function. Options,
none taken yet:

1. Add `"sideEffects": false` and verify BCCL is genuinely side-effect free.
   Then the 346 bytes buy something real and the budget question changes shape
   entirely, since nobody would ship the whole file.
2. Drop the named exports. Loses `import { makeButton }` syntax; loses nothing
   functional today.
3. Exempt ESM from the gate -- only honest after option 1.

This is tracked as open work, not a defect to be silently patched.

---

## Reproducing these measurements

```bash
# Correct gzipped size of what actually ships
node -e "const fs=require('fs'),z=require('zlib');
  console.log(z.gzipSync(fs.readFileSync('dist/bitwrench.umd.min.js'),{level:9}).length)"

# Or just read the .gz the build wrote
ls -l dist/bitwrench.umd.min.js.gz

# Per-source contribution
tail -1 dbg/build-metrics.jsonl | python3 -m json.tool

# Historical series across commits
git log --format=%h -- dist/bitwrench.umd.min.js | while read h; do
  printf "%s %s\n" "$h" "$(git show $h:dist/bitwrench.umd.min.js | gzip -9 | wc -c)"
done
```

The budget itself is `BUDGET` in `tools/release.js` (45 * 1024 = 46080 bytes).

---

## Checklist before claiming a size win

1. Did you measure **gzipped**, not raw? Raw improvements routinely reverse.
2. Did you state the **compression level**? Level 6 and level 9 disagree by
   ~146 bytes here.
3. Did you run a **real `npm run build`**, not a standalone re-minification?
4. Did `npm test` pass, including the **cross-format parity** suite
   (`test/bitwrench_test_bundles.js`)? That is the check that a minifier change
   did not drop an export from one format.
5. Did you run `npm run test:e2e`?
