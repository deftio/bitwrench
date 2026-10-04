#!/usr/bin/env bash
#
# Run GitHub's CI job locally, in Docker, before pushing.
#
# Mirrors .github/workflows/ci.yml step for step:
#   npm ci --ignore-scripts  ->  npm run lint  ->  npm run build  ->  npm test
# across the same Node matrix (22 and 24), on Linux with gcc.
#
# Why: v2.1.11 was merged to main with a green local run and failed GitHub CI,
# because the host is macOS/clang and CI is Linux/gcc. A local run that does
# not use the CI toolchain is not a check, it is a guess.
#
#   npm run ci:local              both Node versions, exactly like CI
#   npm run ci:local -- 24        one version, for a faster loop
#
# The repository is mounted READ-ONLY and copied inside the container, so the
# container's npm install and build cannot touch the host tree -- your dist/
# and node_modules are left exactly as they were.

set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [ "$#" -gt 0 ]; then
  VERSIONS=("$@")
else
  VERSIONS=(22 24)
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "ci:local: docker not found -- cannot mirror CI locally" >&2
  exit 0
fi
if ! docker info >/dev/null 2>&1; then
  echo "ci:local: docker installed but not running -- skipping" >&2
  exit 0
fi

read -r -d '' SCRIPT <<'INNER' || true
set -e
if ! command -v cc >/dev/null 2>&1; then
  apt-get update -qq >/dev/null 2>&1 || true
  apt-get install -y -qq build-essential >/dev/null 2>&1 || true
fi
echo "    node: $(node -v)   cc: $(cc --version 2>/dev/null | head -1 || echo none)"

tar -C /src \
    --exclude=./node_modules --exclude=./.git \
    --exclude=./coverage --exclude=./test-results \
    --exclude=./playwright-report -cf - . | tar -xf -

echo "--- npm ci --ignore-scripts"
npm ci --ignore-scripts --no-audit --no-fund --silent

echo "--- npm run lint"
npm run lint --silent

echo "--- npm run build"
npm run build --silent >/dev/null

echo "--- npm test"
npm test --silent
INNER

FAILED=0
for V in "${VERSIONS[@]}"; do
  echo ""
  echo "=== CI mirror: Linux + gcc + Node ${V} =================================="
  if docker run --rm \
      -v "${ROOT}":/src:ro \
      -v bw-gcc-npm-cache:/root/.npm \
      -w /build \
      "node:${V}-bookworm" \
      bash -c "$SCRIPT"; then
    echo "    Node ${V}: PASS"
  else
    echo "    Node ${V}: FAIL"
    FAILED=1
  fi
done

echo ""
if [ "$FAILED" -ne 0 ]; then
  echo "ci:local: FAILED -- GitHub CI would fail the same way. Fix before pushing." >&2
  exit 1
fi
echo "ci:local: all green -- GitHub CI should agree"
