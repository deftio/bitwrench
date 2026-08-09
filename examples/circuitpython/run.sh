#!/usr/bin/env bash
#
# Run any of the bitwrench CircuitPython examples on this computer -- no board
# required. Sets up a virtualenv on first use, stages the bitwrench bundle, and
# starts the example on http://localhost:8085
#
#   ./run.sh          list the examples
#   ./run.sh 3        run example 3
#   ./run.sh all      run each one for a few seconds as a smoke test
#
# The same code.py runs unchanged on a board; see each example's README.

set -euo pipefail
cd "$(dirname "$0")"

PORT=8085
VENV=".venv-desktop"
REPO_ROOT="$(cd ../.. && pwd)"
BUNDLE="$REPO_ROOT/dist/bitwrench.umd.min.js.gz"

examples=(01a-taco-basics 01b-taco-nesting 02-styling 03-json-dumps 04-fetch-ui \
          05-round-trip 06-bwserve)

list() {
  echo ""
  echo "bitwrench CircuitPython examples -- run on this computer"
  echo ""
  local i=1
  for e in "${examples[@]}"; do
    local desc
    desc=$(head -1 "$e/README.md" 2>/dev/null | sed -E 's/^# ([0-9]+[ab]? -+ )?//')
    printf "  %d  %-16s %s\n" "$i" "${e#*-}" "$desc"
    i=$((i + 1))
  done
  echo ""
  echo "  ./run.sh 3        run one"
  echo "  ./run.sh all      smoke-test every one"
  echo ""
}

setup() {
  if [ ! -d "$VENV" ]; then
    echo "  creating $VENV ..."
    python3 -m venv "$VENV"
    "$VENV/bin/pip" install --quiet --upgrade pip
    "$VENV/bin/pip" install --quiet adafruit-circuitpython-httpserver
  fi

  # Every example from 02-styling on serves bitwrench from disk rather than a CDN.
  if [ ! -f "www/bitwrench.umd.min.js.gz" ]; then
    if [ ! -f "$BUNDLE" ]; then
      echo "  building the bundle first (npm run build) ..."
      (cd "$REPO_ROOT" && npm run build >/dev/null 2>&1)
    fi
    mkdir -p www && cp "$BUNDLE" www/
    echo "  staged www/bitwrench.umd.min.js.gz ($(wc -c < www/bitwrench.umd.min.js.gz | tr -d ' ') bytes)"
  fi
}

free_port() {
  local pids quiet="${1:-}"
  pids=$(lsof -nP -iTCP:$PORT -sTCP:LISTEN -t 2>/dev/null || true)
  if [ -n "$pids" ]; then
    [ -n "$quiet" ] || echo "  port $PORT was busy; freeing it"
    echo "$pids" | xargs kill -9 2>/dev/null || true
    sleep 1
  fi
}

# bwserve.py lives outside this folder and is only needed by the last example.
pypath() { echo "..:$REPO_ROOT/embedded_python"; }

run_one() {
  local dir="$1"
  free_port
  echo ""
  echo "  -> $dir   (ctrl-c to stop)"
  cd "$dir"
  PYTHONPATH="$(pypath)" exec "../$VENV/bin/python" -u code.py
}

smoke() {
  local failed=0 pid code
  set +m                       # no job-control chatter when we kill each server
  echo ""
  for e in "${examples[@]}"; do
    free_port quiet
    ( cd "$e" && PYTHONPATH="$(pypath)" exec "../$VENV/bin/python" -u code.py ) \
        >"/tmp/bw-$e.log" 2>&1 &
    pid=$!
    disown "$pid" 2>/dev/null || true

    for _ in 1 2 3 4 5 6 7 8; do
      lsof -nP -iTCP:$PORT -sTCP:LISTEN -t >/dev/null 2>&1 && break
      sleep 1
    done

    code=$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:$PORT/" || echo 000)
    if [ "$code" = "200" ]; then
      printf "  %-16s ok    GET / -> 200\n" "$e"
    else
      printf "  %-16s FAIL  GET / -> %s   (see /tmp/bw-%s.log)\n" "$e" "$code" "$e"
      failed=1
    fi

    kill -9 "$pid" 2>/dev/null || true
    free_port quiet
  done
  echo ""
  if [ "$failed" = "0" ]; then
    echo "  all ${#examples[@]} served a page on port $PORT"
  else
    echo "  some examples failed"
  fi
  return "$failed"
}

case "${1:-}" in
  "")        list ;;
  all)       setup; smoke ;;
  [1-7])     setup; run_one "${examples[$(( $1 - 1 ))]}" ;;
  *)         echo "  unknown option: $1"; list; exit 1 ;;
esac
