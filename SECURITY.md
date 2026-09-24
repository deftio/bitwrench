# Security Policy

## Reporting a vulnerability

**Please do not open a public issue for a security problem.**

Use GitHub's private vulnerability reporting, which is enabled on this
repository:

> [Report a vulnerability](https://github.com/deftio/bitwrench/security/advisories/new)

That creates a private advisory visible only to you and the maintainer. If you
cannot use it, email <deftio@deftio.com> with "bitwrench security" in the
subject.

bitwrench is maintained by one person. Expect an acknowledgement within a week.
A fix ships in the next patch release; if the issue is serious enough to
warrant it, that release happens immediately rather than on the normal cadence.
You will be credited in the changelog and the advisory unless you ask not to
be.

## Supported versions

| Version | Supported |
|---|---|
| Latest 2.x | Yes |
| Older 2.x | No -- upgrade to the latest patch |
| 1.x | No. Frozen at 1.2.16 and archived in `releases/v1/` |

Fixes are issued as patch releases on the current minor. There are no
long-term-support branches.

## What is in scope

bitwrench has **zero runtime dependencies**. `dependencies` in `package.json`
is empty and the published package resolves nothing at install time. That
shapes the threat model considerably.

In scope:

- **Escaping and injection in the rendering path.** Content is escaped by
  default in `bw.html()`, `bw.create()` and friends. A case where escaping is
  bypassed *without* the caller opting in via `bw.raw()` or `o: { raw: true }`
  is a bug worth reporting. So is attribute-value handling that lets a value
  break out of its attribute.
- **`bw.escapeHTML()`** returning output that is not safe in the context it
  documents.
- **Prototype pollution** or similar via TACO objects, `bw.patch()`,
  `bw.update()`, or the style/palette generators.
- **The release pipeline** -- anything that would let a third party influence
  what gets published to npm under this package name.

Out of scope:

- **`bw.raw()` and `o: { raw: true }`.** These exist to insert markup verbatim.
  Passing untrusted input to them is the documented hazard of the API, not a
  defect in it.
- **Vulnerabilities in build or test tooling** that cannot reach a consumer.
  bitwrench ships no dependencies, so a CVE in rollup, mocha or jsdom affects
  contributors building from source, not anyone who installs the package. See
  "Dependency policy" below.
- **`bwserve` and `bwcli` exposed to untrusted networks.** These are
  development tools -- a local server for driving a page from your own machine.
  They are not hardened for public-facing deployment and should not be treated
  as production services.
- Findings from automated scanners with no demonstrated exploit path. Please
  include a concrete reproduction.

## Security posture

Recorded here because two of these controls live in GitHub repository settings
rather than in the repository, and would otherwise leave no trace.

### In this repository (reviewable in git)

- **GitHub Actions are pinned to commit SHAs**, not floating tags, in
  `.github/workflows/`. Version numbers are kept as comments so Dependabot can
  still propose updates. `github/codeql-action` is a deliberate exception,
  documented in `.github/dependabot.yml`: it tracks the floating `@v4` tag, and
  that job holds no publishing rights.
- **npm is pinned in the publish step.** That step runs with `id-token: write`
  and can publish to the registry, so it does not resolve `npm@latest` at run
  time.
- **`npm ci --ignore-scripts` in CI.** Dependency lifecycle scripts are the
  classic install-time vector and nothing in this build requires them.
- **Every workflow declares its own `permissions:`** rather than inheriting a
  repository-wide default.
- **Publishing uses OIDC trusted publishing** with `--provenance`. No
  long-lived npm token exists in this repository to leak.
- **The lockfile is committed and CI uses `npm ci`**, so dependency versions
  are integrity-pinned and any change is visible in a diff.
- **Builds are reproducible within a day.** `buildDate` is a calendar date
  honouring `SOURCE_DATE_EPOCH`, so two builds of the same source produce
  byte-identical output. `dist/` is committed, which makes `git diff dist/` a
  usable check that the build tools produced what the source says they should.

### In GitHub repository settings (not visible in git)

| Setting | State | Why |
|---|---|---|
| Dependabot alerts | **enabled** | Advisories should still be reported |
| Dependabot security updates (PRs) | **disabled** | See dependency policy below |
| Private vulnerability reporting | **enabled** | The channel named above |
| Secret scanning | **enabled** | |
| Default workflow permissions | **read** | Every workflow declares its own |

If this repository is ever forked, migrated or recreated, these need to be set
again. They do not travel with the code.

## Dependency policy

npm version-update pull requests are disabled
(`open-pull-requests-limit: 0` in `.github/dependabot.yml`). Dependabot alerts
remain on. GitHub Actions updates remain enabled at a quarterly cadence.

The reasoning, recorded at length in `.github/dependabot.yml`:

1. With no runtime dependencies, a CVE in a build tool cannot reach anyone who
   installs bitwrench. `npm audit --omit=dev` is the audit that describes
   user-facing risk.
2. Dependency freshness here is therefore build maintenance, not a security
   control, and belongs on the release cadence. Dev dependencies are refreshed
   deliberately at the start of each release cycle.
3. The risk that *does* apply is a compromised build dependency altering
   `dist/`, and updating faster makes that worse rather than better. GitHub
   applies a default cooldown to version updates for the same reason.

Between March and September 2026 this repository received 84 Dependabot pull
requests and closed 51 of them unmerged. The policy above is what replaced
that.

## Verifying a release

Every published version has:

- an npm provenance attestation linking the tarball to the GitHub Actions run
  and commit that built it (`npm view bitwrench --json` includes it, and npm
  shows it on the package page);
- a git tag and GitHub Release with the built artifacts attached;
- SHA-384 subresource integrity hashes in `dist/sri.json`, for use with the
  `integrity` attribute when loading from a CDN.

If any of those disagree with each other, please report it through the channel
above.
