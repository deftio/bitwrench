# Release Procedure

The canonical release process for bitwrench. It is driven by two scripts --
`tools/start-release.js` and `tools/release.js` -- and every step below is
what those scripts actually do. If this document and the scripts disagree,
the scripts are right and this file is a bug.

Contributors do not need this file; see [CONTRIBUTING.md](CONTRIBUTING.md) for
the pull-request workflow.

## Branch Model

- `main` is the only branch pushed to GitHub. It is always releasable.
- Development happens on `feature/<name>` branches that stay **local**.
  Feature branches are never pushed to the remote.
- `main` receives exactly one commit per release, via squash merge.
- Nothing is committed directly to `main`. A `pre-push` hook
  (`tools/hooks/pre-push`) blocks pushes to `main` unless `BW_RELEASE_PUSH=1`,
  which only `tools/release.js` sets.

## 1. Start a dev cycle

Always bump the version **first**, before any source change.

```bash
npm run start-release -- patch "fix the thing"       # 2.1.12 -> 2.1.13
npm run start-release -- minor "new subsystem"       # 2.1.12 -> 2.2.0
npm run start-release -- major "breaking change"     # 2.1.12 -> 3.0.0
```

The bump level is the **first** argument. Omit it and you get a patch bump;
pass it wrongly and the mistake is silent, so check the version it prints.

`tools/start-release.js` then:

1. Verifies you are on `main` with a clean working tree
2. Pulls the latest `main`
3. Bumps the version (`npm version <level> --no-git-tag-version`)
4. Regenerates `src/version.js`
5. Creates and checks out `feature/<slugified-name>`
6. Commits the bump (`package.json`, `package-lock.json`, `src/version.js`,
   `library.properties`, `library.json`, `idf_component.yml`, `dist`, `dbg`)

It does **not** push. The branch is local for its whole life.

## 2. Develop

Work on the feature branch. Before releasing, the local gates should be green:

```bash
npm run lint          # ESLint over src/
npm test              # Mocha + c8; coverage gates 99/99/96/95 and drift-lint
npm run test:gcc      # the C/C++ suite under gcc on Linux, in Docker
npm run ci:local      # the full GitHub CI job locally, Node 22 and 24
```

Run `npm run ci:local` before releasing anything that touches `embedded_c/`
or the C/C++ examples. macOS ships clang and CI runs gcc, and they are not
interchangeable -- v2.1.11 reached `main` green locally and failed CI three
times because clang does not implement `-Wformat-truncation`.

## 3. Release

On the feature branch:

```bash
npm run release              # the real thing
npm run release -- --dry-run # every gate, no mutations, nothing pushed
```

`tools/release.js` runs ten steps and stops at the first failure:

| # | Step | What it does |
|---|------|--------------|
| 1 | Pre-flight checks | Clean tree; this version not already on npm |
| 2 | Clean build | `npm run clean && npm run build && npm run build:generated` |
| 3 | Lint | `npm run lint` |
| 4 | Tests | `npm test` (which includes `test:cli` since v2.1.4), then the C/C++ suite under gcc in Docker |
| 5 | Version consistency | `package.json`, `src/version.js` and the dist banner must agree |
| 6 | Bundle size gate | Gzipped UMD **and** ESM must each be under 46 KB, measured on the level-9 `.gz` the build writes |
| 7 | Docker clean-room test | Skipped with a warning if Docker is absent |
| 8 | Archive | `tools/build-release.js` snapshots `dist/` into `releases/v2/` |
| 9 | Commit | `git add . && git commit` on the **feature branch**. No push |
| 10 | Merge to main | Prompts, then `git merge --squash <branch> && git commit && git push origin main` |

Step 10 is interactive and does the squash merge for you. The commit subject
comes from `--squash-msg` if given, otherwise the matching CHANGELOG section,
otherwise the branch name.

Before attempting any size optimization for step 6, read
[Bundle size findings](dev/bitwrench-2.1.6-size-opt-findings.md) -- string
interning, `passes: 3` and toplevel mangling have all been measured and are
useless or counterproductive.

If you decline step 10, do it by hand -- squash is required, so that `main`
keeps one commit per release:

```bash
git checkout main
git merge --squash feature/<name>
git commit -m "v<version>: <description>"
git push origin main
```

Commits on `main` are authored solely by the maintainer: no `Co-Authored-By`
trailer on the squash commit.

## 4. Everything after the push is automatic

1. `.github/workflows/ci.yml` runs on the push to `main`, across Node 22 and 24.
2. On success, `.github/workflows/publish.yml` fires on `workflow_run` and:
   - checks whether the version is already on npm, and stops if it is
   - creates and pushes the `vX.Y.Z` tag
   - creates the GitHub Release with the dist files attached
   - publishes to npm with provenance via OIDC

There is no tag job in `ci.yml`. **Never** run `npm publish` by hand and
**never** create a tag by hand -- CI owns both.

## 5. Post-release verification

- [ ] GitHub Release is present: https://github.com/deftio/bitwrench/releases
- [ ] npm has the version: `npm view bitwrench version`
- [ ] CDN serves it: https://cdn.jsdelivr.net/npm/bitwrench@latest/dist/bitwrench.umd.min.js
- [ ] Docs site looks right: https://deftio.github.io/bitwrench/

## Manual recovery

If the automated publish fails, re-run it: **Actions** > **Publish to npm** >
**Run workflow** (the workflow accepts `workflow_dispatch`), or re-run the
failed run from the Actions tab.

If a tag was created but the release or publish failed:

```bash
git push origin --delete vX.Y.Z
git tag -d vX.Y.Z
# fix the issue, push again, and let CI re-tag
```

A published version can never be replaced. If a bad build reaches npm, bump
the patch version and release again.

## Rules

- No commits directly to `main` -- all work lands by squash merge.
- No pushing feature branches to the remote.
- No `npm publish` by hand, and no hand-made tags.
- No `--force` pushes to `main`, and no `--no-verify` to skip hooks.
- No skipped tests (`it.skip`, `describe.skip`, `xit`).
- Lint warnings get resolved, not suppressed.
- Secrets and credentials are never committed.
- **`dist/` must be byte-for-byte what the release build produced.**
  `src/version.js` embeds a build date that propagates into every artifact and
  cascades into `sri.json` and `builds.json`, so any stray rebuild dirties
  roughly 44 files. Stale artifacts mean npm gets a different package than
  GitHub, and that cannot be undone for a published version.
- There is **one** path to `main`: this pipeline. Non-shipping cleanups ride
  along in the next patch release rather than taking a shortcut.
