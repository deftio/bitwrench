#!/usr/bin/env bash
#
# Run the Playwright E2E suite inside the official Playwright Docker image.
#
# Why: tests run against Linux browsers in a reproducible environment (the
# same one GitHub Actions would use), without putting E2E in any CI publish
# path. This is the pre-release gate; use `npm run test:e2e` for fast
# native iteration during development.
#
# The image tag is DERIVED from the installed @playwright/test version, so
# the image and the client library can never drift apart (browsers baked
# into the image are version-matched to the client).
#
# Usage:
#   npm run test:e2e:docker            # full suite, all three browsers
#   npm run test:e2e:docker -- --project=chromium
#   E2E_DOCKER_LIMITS=1 npm run test:e2e:docker   # approximate GH runner physics
#
set -euo pipefail

cd "$(dirname "$0")/.."

if ! command -v docker >/dev/null 2>&1; then
  echo "✗ docker not found. Install Docker, or run the native suite instead:" >&2
  echo "    npm run test:e2e" >&2
  exit 1
fi

if ! docker info >/dev/null 2>&1; then
  echo "✗ Docker daemon is not running. Start Docker, or run the native suite:" >&2
  echo "    npm run test:e2e" >&2
  exit 1
fi

# Derive image tag from the INSTALLED @playwright/test version (not the
# semver range in package.json) — this is the version the browsers must match.
PW_VERSION="$(node -p "require('@playwright/test/package.json').version")"
if [ -z "$PW_VERSION" ]; then
  echo "✗ Could not determine @playwright/test version. Run npm ci first." >&2
  exit 1
fi

IMAGE="mcr.microsoft.com/playwright:v${PW_VERSION}-noble"
echo "→ Playwright ${PW_VERSION} → image ${IMAGE}"

# Optional: approximate GitHub Actions runner resources to surface
# timing-sensitive flake before it ships (see dev/clark-fable-v2.1-fixes.md 6.3).
LIMITS=()
if [ "${E2E_DOCKER_LIMITS:-}" = "1" ]; then
  LIMITS=(--cpus=2 --memory=7g)
  echo "→ Resource limits enabled (--cpus=2 --memory=7g)"
fi

# --init: proper signal handling / zombie reaping for the webServer child.
# --ipc=host: recommended by Playwright docs to avoid Chromium OOM in Docker.
# CI=1: forbid test.only, enable retries, don't reuse a stale server.
exec docker run --rm --init --ipc=host \
  ${LIMITS[@]+"${LIMITS[@]}"} \
  -v "$PWD":/work -w /work \
  -e CI=1 \
  "$IMAGE" \
  npx playwright test "$@"
