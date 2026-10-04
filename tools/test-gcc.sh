#!/usr/bin/env bash
#
# Run the C/C++ test suite under gcc on Linux, in Docker.
#
# Why this exists: these tests compile the shipped headers, and macOS ships
# clang while CI runs gcc. The two are not interchangeable. v2.1.11 reached
# main with three failures that every local run had passed:
#
#   1. gcc implements -Wformat-truncation; clang does not. Nesting a
#      same-sized buffer is a hard error under -Wall -Werror, correctly --
#      it can truncate.
#   2. Argument evaluation order is unspecified in C, and the two compilers
#      chose differently, so a printf() with four side-effecting calls gave
#      different output.
#   3. A nested /* */ inside a doc comment broke the header outright under
#      -Werror=comment.
#
# None of those are reachable from a Mac. Run this before pushing anything
# that touches embedded_c/ or the C/C++ examples.
#
#   npm run test:gcc              both Node versions CI uses (22 and 24)
#   npm run test:gcc -- 24        just one, for a faster loop
#
# The repository is mounted READ-ONLY and copied inside the container, so a
# container-side npm install or build can never touch the host tree.

set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [ "$#" -gt 0 ]; then
  VERSIONS=("$@")
else
  VERSIONS=(22 24)
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "test:gcc: docker not found -- skipping (GitHub CI still runs gcc)" >&2
  exit 0
fi
if ! docker info >/dev/null 2>&1; then
  echo "test:gcc: docker installed but not running -- skipping" >&2
  exit 0
fi

# Only the suite that compiles C/C++. Everything else is compiler-independent
# and `npm test` already covers it on the host.
SUITE="test/bitwrench_test_embedded_c.js"

read -r -d '' SCRIPT <<'INNER' || true
set -e
# node:*-bookworm already ships gcc; only reach for apt if it does not, and
# never let a sandbox with no apt network fail the run.
if ! command -v cc >/dev/null 2>&1; then
  apt-get update -qq >/dev/null 2>&1 || true
  apt-get install -y -qq build-essential >/dev/null 2>&1 || true
fi
command -v cc >/dev/null 2>&1 || { echo "    no C compiler in this image" >&2; exit 1; }
echo "    cc:   $(cc --version | head -1)"
echo "    node: $(node -v)"
# Copy in, excluding what must not cross: the host node_modules holds darwin
# binaries, and .git is large and unneeded.
tar -C /src \
    --exclude=./node_modules --exclude=./.git \
    --exclude=./coverage --exclude=./test-results \
    --exclude=./playwright-report -cf - . | tar -xf -
npm ci --ignore-scripts --no-audit --no-fund --silent
npx mocha SUITE_PLACEHOLDER -r jsdom-global/register --exit
INNER
SCRIPT="${SCRIPT//SUITE_PLACEHOLDER/$SUITE}"

FAILED=0
for V in "${VERSIONS[@]}"; do
  echo ""
  echo "=== gcc + Node ${V} ======================================================"
  if docker run --rm \
      -v "${ROOT}":/src:ro \
      -v bw-gcc-npm-cache:/root/.npm \
      -w /build \
      "node:${V}-bookworm" \
      bash -c "$SCRIPT"; then
    echo "    gcc + Node ${V}: PASS"
  else
    echo "    gcc + Node ${V}: FAIL"
    FAILED=1
  fi
done

echo ""
if [ "$FAILED" -ne 0 ]; then
  echo "test:gcc: FAILED -- this is what GitHub CI would have told you." >&2
  exit 1
fi
echo "test:gcc: all green"
