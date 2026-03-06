# Release Procedure

Step-by-step checklist for contributing to and releasing bitwrench.

## Branch Model

- `main` is the production branch. Only the repo maintainer (@deftio) merges to `main`.
- All work happens on feature branches created from `main`.
- Feature branches use the naming convention: `feature/<short-description>` or `fix/<short-description>`.

## Development Workflow

### 1. Issue Investigation

- [ ] Open or identify a GitHub Issue describing the bug, feature, or improvement.
- [ ] Confirm the issue is reproducible (for bugs) or well-defined (for features).
- [ ] Assign the issue and add appropriate labels.

### 2. Create Feature Branch

```bash
git checkout main
git pull origin main
git checkout -b feature/<short-description>
```

### 3. Test-Driven Development

- [ ] Write failing tests first that describe the expected behavior.
- [ ] Run tests to confirm they fail: `npm test`
- [ ] Implement the feature or fix.
- [ ] Run tests to confirm they pass: `npm test`

### 4. Code Quality Gates

All of the following must pass before opening a PR:

- [ ] **Lint**: `npm run lint` passes with 0 errors and 0 warnings.
- [ ] **Unit tests**: `npm test` — all tests passing, no skips.
- [ ] **CLI tests**: `npm run test:cli` — all tests passing.
- [ ] **Test coverage**: 100% of new code covered. Overall coverage must not decrease.
- [ ] **Build**: `npm run build` succeeds without errors.
- [ ] **Bundle size**: Verify gzipped UMD min stays under 45KB budget.

### 5. Open Pull Request

- [ ] Push feature branch: `git push -u origin feature/<short-description>`
- [ ] Open PR targeting `main` on GitHub.
- [ ] PR title is concise (under 70 chars). Description explains the "why".
- [ ] Reference the related issue (e.g., "Closes #42").
- [ ] CI must pass (lint, build, test on Node 20/22/24).

### 6. Code Review

- [ ] Maintainer reviews the PR.
- [ ] Address any review feedback with new commits (do not force-push).
- [ ] CI passes on the final state of the PR.

### 7. Merge to Main

Only the repo maintainer (@deftio) performs this step.

- [ ] Squash-merge or merge the PR into `main`.
- [ ] Delete the feature branch after merge.

## Release Workflow

### 8. Version Bump

- [ ] Update `version` in `package.json` following [semver](https://semver.org/):
  - **Patch** (2.0.x): Bug fixes, documentation, internal changes.
  - **Minor** (2.x.0): New features, backward-compatible additions.
  - **Major** (x.0.0): Breaking API changes.
- [ ] Commit the version bump to `main`: `"bump version to X.Y.Z"`
- [ ] Push to `main`.

### 9. Automated Release Pipeline

Once the version bump is pushed to `main`, the CI/CD pipeline runs automatically:

```
push to main
  |
  v
ci.yml: lint + build + test (Node 20/22/24)
  |
  v (all pass)
ci.yml: tag-version job creates git tag vX.Y.Z (if new)
  |
  v (tag push triggers)
publish.yml: lint + build + test + create GitHub Release + npm publish (OIDC)
```

- **GitHub Release**: Created automatically with generated release notes and dist assets.
- **npm Publish**: Published via OIDC trusted publishing (no token needed).

### 10. Post-Release Verification

- [ ] Verify the GitHub Release appears at https://github.com/deftio/bitwrench/releases
- [ ] Verify npm has the new version: `npm view bitwrench version`
- [ ] Verify CDN availability: https://cdn.jsdelivr.net/npm/bitwrench@latest/dist/bitwrench.umd.min.js
- [ ] Spot-check the docs site: https://deftio.github.io/bitwrench/

## Manual Recovery

If the automated publish fails, use the manual trigger:

1. Go to **Actions** > **Publish to npm (manual)** > **Run workflow**.
2. Or re-run the failed publish workflow from the Actions tab.

If a tag was created but the release/publish failed:

```bash
# Delete the orphaned tag
git push origin --delete vX.Y.Z
git tag -d vX.Y.Z

# Fix the issue, push, and let CI re-tag
```

## Rules

- No direct commits to `main` except version bumps by the maintainer.
- No `--force` pushes to `main`.
- No `--no-verify` to skip hooks.
- No skipped tests (`it.skip`, `describe.skip`, `xit`).
- All lint warnings must be resolved, not suppressed.
- Secrets and credentials are never committed.
