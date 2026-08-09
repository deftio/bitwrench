/**
 * Golden output for bw.html() and bw.htmlPage().
 *
 * ---------------------------------------------------------------------------
 * WHY THIS FILE EXISTS
 * ---------------------------------------------------------------------------
 * Every other test of these APIs checks substrings. Substrings cannot see a
 * removal. The v2.1.0 handler regression survived six releases because the one
 * assertion guarding it was:
 *
 *     assert.ok(html.includes('bw_fn_0'))
 *
 * which is true of BOTH of these:
 *
 *     <button onclick="bw.funcGetById('bw_fn_0')(event)">x</button>   (2.0)
 *     <button class="bw_fn_0">x</button>                              (2.1)
 *
 * The suite stayed green while the handler vanished from the output. CI was
 * green. The squash commit said "lifecycle refactor". It was found, eventually,
 * by a human clicking a button on a docs page.
 *
 * So: exact strings, committed to a fixture file. A behaviour change becomes a
 * visible diff that somebody has to consciously accept, instead of a check that
 * shrugs. This is a mechanical guard, deliberately requiring no judgement and no
 * alertness from whoever is editing.
 *
 * If a case here fails, the right first move is to read the `why` on that case
 * and decide whether the change was intended -- NOT to regenerate the file.
 * Regenerating to get a green suite is the exact failure this file exists to
 * prevent.
 *
 * To accept an intended change:  UPDATE_GOLDEN=1 npx mocha test/bitwrench_test_html_golden.js
 * then commit the diff, so it shows up in review and in the release notes.
 */

import assert from "assert";
import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import bw from "../src/bitwrench.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const GOLDEN_PATH = join(__dirname, "fixtures", "html-golden.json");
const UPDATE = process.env.UPDATE_GOLDEN === "1";

const golden = JSON.parse(readFileSync(GOLDEN_PATH, "utf8"));
let dirty = false;

// bw_fn_N ids come from a global counter, so reset it or the goldens depend on
// test execution order. Everything else about bw.html() is already pure.
function reset() {
  bw._fnRegistry = {};
  bw._fnIDCounter = 0;
}

// JSON cannot hold a function, so cases opt in with _onclick and the harness
// substitutes a real one. Keeping the fixture pure data is what makes its diffs
// readable in review.
function hydrate(spec) {
  const taco = JSON.parse(JSON.stringify(spec.taco));
  if (spec.taco._onclick) {
    taco.a = taco.a || {};
    taco.a.onclick = function () { /* noop -- identity is irrelevant, shape is not */ };
    delete taco._onclick;
  }
  delete taco._useFns;
  return taco;
}

function compare(name, actual, expected, why, apply) {
  if (UPDATE) {
    if (actual !== expected) { apply(actual); dirty = true; }
    return;
  }
  assert.strictEqual(
    actual, expected,
    "\n\nGolden mismatch: " + name +
    "\n\n  WHY THIS CASE EXISTS:\n  " + why +
    "\n\n  expected: " + expected +
    "\n  actual:   " + actual +
    "\n\n  If this change is intended, accept it deliberately:" +
    "\n    UPDATE_GOLDEN=1 npx mocha test/bitwrench_test_html_golden.js" +
    "\n  and commit the diff. If it is not intended, you just caught a regression.\n"
  );
}

describe("golden output — bw.html()", function () {
  golden.cases.forEach(function (c) {
    it(c.name, function () {
      reset();
      const taco = hydrate(c);
      const opts = c.taco._useFns ? { fns: {} } : undefined;
      const actual = bw.html(taco, opts);
      compare(c.name, actual, c.html, c.why, v => { c.html = v; });
    });
  });
});

describe("golden output — bw.htmlPage()", function () {
  golden.pages.forEach(function (p) {
    it(p.name, function () {
      reset();
      const actual = bw.htmlPage(Object.assign({}, p.opts, { body: p.body }));
      // Pages are stored as a line array purely so their diffs are readable.
      const expected = p.html ? p.html.join("\n") : null;
      if (expected === null && !UPDATE) {
        assert.fail("No golden recorded for page case '" + p.name +
          "'. Run: UPDATE_GOLDEN=1 npx mocha test/bitwrench_test_html_golden.js");
      }
      compare(p.name, actual, expected, p.why, v => { p.html = v.split("\n"); });
    });
  });
});

after(function () {
  if (UPDATE && dirty) {
    writeFileSync(GOLDEN_PATH, JSON.stringify(golden, null, 2) + "\n", "utf8");
    console.log("\n  golden file updated — review the diff before committing\n");
  }
});
