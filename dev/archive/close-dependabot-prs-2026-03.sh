#!/usr/bin/env bash
# close-dependabot-prs.sh
#
# Closes open Dependabot PRs #54-57 with comments explaining disposition.
# Run manually when ready: bash tools/close-dependabot-prs.sh
#
# Safe to run multiple times -- gh pr close on already-closed PRs is a no-op.
# Requires: gh CLI authenticated with repo access.

set -euo pipefail

REPO="deftio/bitwrench"
VERSION="v2.0.26"

# PRs #54, #55, #56: incorporated into release
for pr in 54 55 56; do
  echo "Closing PR #${pr}..."
  gh pr close "$pr" --repo "$REPO" --comment \
    "Changes incorporated into the ${VERSION} release branch. Closing to keep the PR queue clean -- thanks Dependabot."
done

# PR #57: chai 3->6 major version jump, needs separate evaluation
echo "Closing PR #57..."
gh pr close 57 --repo "$REPO" --comment \
  "Chai 3 to 6 is a major version jump with breaking API changes (ESM-only, dropped assertion styles). Will evaluate in a dedicated effort. Closing for now."

echo "Done. All 4 Dependabot PRs closed."
