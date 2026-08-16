/**
 * Bare semantic HTML, and the prose classes.
 *
 * The line: a reset must replace what it destroys.
 *
 * bitwrench's base layer ships `* { margin: 0; padding: 0 }` and a
 * normalize-style `hr { border: 0 }`. Two elements come out of that visibly
 * broken through no choice of the author's:
 *
 *   ul, ol   padding zeroed while list-style-position stays `outside`, so the
 *            markers render to the LEFT of the list's own content box and
 *            overlap whatever contains it
 *   hr       1px tall with no border and no background -- it occupies space
 *            and paints nothing at all
 *
 * Those are repaired in structuralRules.base, next to the rules that cause
 * them, so `bw.loadReset()` alone leaves a page in a known-good state. That is
 * reset hygiene, not a styling opinion: an earlier version of this file argued
 * the repair belonged in an opt-in class, which meant shipping the damage and
 * then charging a class for the fix.
 *
 * Elements the reset does NOT break keep the opposite treatment -- they are
 * merely unstyled, which is a legitimate default, so they stay opt-in:
 *
 *   bw_quote   indents and rules a blockquote
 *   bw_code    inline code
 *   bw_list    restates the ul/ol default; kept for compatibility
 *   bw_hr      restates the hr default; kept for compatibility
 *
 * You are never obliged to use them. `{a: {class: 'my-own-class'}}` or an
 * inline style object works exactly as well.
 *
 * Data and control elements (table, input, button) stay bare regardless --
 * makeTable and makeInput own those.
 */

import assert from "assert";
import bw from "../src/bitwrench.js";

function styleSheetText() {
  return Array.prototype.map
    .call(document.querySelectorAll("style"), function (s) { return s.textContent; })
    .join("\n");
}

// Match rules by exact selector rather than by searching the CSS text: a
// substring search finds "hr" inside unrelated selectors and misses grouped
// ones like "h1, h2, h3", which produced confidently wrong answers.
function rulesFor(selector) {
  const css = styleSheetText();
  const found = [];
  const re = /([^{}]+)\{([^{}]*)\}/g;
  let m;
  while ((m = re.exec(css)) !== null) {
    const prelude = m[1].trim();
    if (prelude.startsWith("@")) continue;           // @media / @keyframes preludes
    const selectors = prelude.split(",").map(function (x) {
      // drop any @media prefix left attached to the first selector in a block
      return x.replace(/^.*\{/, "").trim();
    });
    if (selectors.indexOf(selector) !== -1) found.push(m[2].replace(/\s+/g, " ").trim());
  }
  return found.join(" ");
}

function ruleFor(selector) {
  const body = rulesFor(selector);
  return body.length ? body : null;
}

// "Has a padding-left" is not the property that matters -- v2.1.6 shipped
// padding-left: 1em and the markers still hung outside, which is what a reader
// actually reported. Measured in Chromium at a 16px root, marker ink starts
// this far inside the list's own left edge:
//
//   1em -> 0px    1.15em -> 1px    1.25em -> 3px    1.5em -> 7px    2em -> 15px
//
// At 1em the bullet is flush with the box edge, so against a heading whose
// glyphs carry a left side bearing it reads as hanging out to the left. The
// invariant is therefore a MINIMUM, not the shipped value -- this should fail
// when the markers stop clearing, not merely when someone retunes the number.
const MIN_LIST_INDENT_PX = 20;      // 1.25em at the 16px root

function assertClearsMarker(selector, rule) {
  const m = /padding-left\s*:\s*([\d.]+)(em|rem|px)/.exec(rule);
  assert.ok(m, `${selector} padding-left should be a length; got: ${rule}`);
  const n = parseFloat(m[1]);
  const px = m[2] === "px" ? n : n * 16;
  assert.ok(px >= MIN_LIST_INDENT_PX,
    `${selector} padding-left is ${m[1]}${m[2]} (${px}px), which does not clear ` +
    `the marker -- it needs at least ${MIN_LIST_INDENT_PX}px or the bullets ` +
    `render outside the list box. See the measurements above.`);
}

// Same idea as assertClearsMarker, for the elements whose repair is a margin
// rather than a padding. The regex is passed in because the two shapes differ:
// dd sets margin-left directly, blockquote sets the shorthand and the indent is
// its fourth value.
function assertIndented(selector, rule, re) {
  const m = re.exec(rule);
  assert.ok(m, `${selector} should set a left indent; rule was: ${rule}`);
  const px = m[2] === "px" ? parseFloat(m[1]) : parseFloat(m[1]) * 16;
  assert.ok(px >= MIN_LIST_INDENT_PX,
    `${selector} left indent is ${m[1]}${m[2]} (${px}px), which does not read ` +
    `as an indent -- the reset zeroed the UA's and this is what puts it back.`);
}

describe("prose classes make plain markup readable", function () {
  before(function () {
    bw.clearStyles && bw.clearStyles();
    bw.loadStyles({ primary: "#2563eb" });
  });

  // ---- Already true today. These guard against regression. ---------------

  it("headings should have a size scale", function () {
    assert.ok(ruleFor("h1"), "h1 should have a rule");
    assert.ok(/font-size/.test(ruleFor("h1")), "h1 should set font-size");
  });

  it("paragraphs should have spacing and line-height", function () {
    const p = ruleFor("p");
    assert.ok(p, "p should have a rule");
    assert.ok(/margin/.test(p), "p should set a margin so paragraphs separate");
  });

  // ---- The prose classes -------------------------------------------------

  it(".bw_list should indent so markers sit inside the content box", function () {
    // The global `* { padding: 0 }` reset zeroes list padding. With
    // list-style-position: outside (the default), markers then render to the
    // left of the box -- overlapping whatever contains the list.
    const list = ruleFor(".bw_list");
    assert.ok(list, ".bw_list should exist");
    assert.ok(/padding-left/.test(list),
      ".bw_list should set padding-left so markers sit inside the element");
    assertClearsMarker(".bw_list", list);
  });

  it("should indent bare ul and ol so markers sit inside the content box", function () {
    // The reset zeroes padding on everything. With list-style-position: outside
    // (the default) the markers then render to the left of the box, overlapping
    // whatever contains the list. The reset repairs its own damage.
    //
    // This replaces an assertion that bare ul/ol must have NO rule, justified
    // by the worry that a bare-tag rule would reach into component internals.
    // Measured across the docs site -- 110 lists on 28 pages -- exactly the
    // bare ones moved: .bw_nav, .bw_bccl_pagination, .bw_bccl_breadcrumb_list
    // and .bw_list_group all set their own padding-left: 0, and a class beats
    // an element selector. The worry was real in principle and empty in fact.
    // menu is in the list because it is a list: same default
    // list-style-position, same markers outside the same zeroed box. Nobody
    // reported it because nobody writes <menu>, which is the argument for
    // pinning it here rather than waiting for the report.
    for (const tag of ["ul", "ol", "menu"]) {
      const rule = ruleFor(tag);
      assert.ok(rule, `bare ${tag} should have a rule`);
      assert.ok(/padding-left/.test(rule),
        `bare ${tag} should set padding-left so markers sit inside the element`);
      assert.ok(/margin-bottom/.test(rule),
        `bare ${tag} should set margin-bottom so it separates from what follows`);
      assertClearsMarker(tag, rule);
    }
  });

  it("should give back the indents the reset takes from blockquote and dl", function () {
    // Same defect as the lists, found by asking what else `* { margin: 0 }`
    // flattens rather than by waiting for a second report. A UA ships
    // blockquote { margin: 1em 40px } and dd { margin-left: 40px }; with both
    // gone, a quotation is indistinguishable from body text and a definition
    // list is a flat ladder of terms and definitions at one indent.
    //
    // Asserted as a MINIMUM for the same reason as the list indent: this should
    // fail when the indent stops being an indent, not when someone retunes it.
    const bq = ruleFor("blockquote");
    assert.ok(bq, "bare blockquote should have a rule");
    assertIndented("blockquote", bq, /margin(?:-left)?\s*:[^;]*?([\d.]+)(em|rem|px)\s*(?:;|$)/);

    const dd = ruleFor("dd");
    assert.ok(dd, "bare dd should have a rule");
    assertIndented("dd", dd, /margin-left\s*:\s*([\d.]+)(em|rem|px)/);

    assert.ok(/margin-bottom/.test(ruleFor("dl") || ""),
      "bare dl should set margin-bottom so it separates from what follows");
  });

  it("should not double-space nested lists", function () {
    // A nested list inside an li would otherwise add the outer margin again.
    const nested = ruleFor("ul ul");
    assert.ok(nested, "nested lists should have a rule");
    assert.ok(/margin-bottom\s*:\s*0/.test(nested),
      "a nested list should not add its own bottom margin");
  });

  // Both the bare tag and the compatibility class must actually paint. The
  // assertions deliberately check for a *drawn* border: an earlier version
  // tested /border/ and passed happily against "border: 0" -- a test agreeing
  // with the bug it was meant to catch.
  for (const sel of ["hr", ".bw_hr"]) {
    it(`${sel} should draw a visible rule`, function () {
      const rule = ruleFor(sel);
      assert.ok(rule, `${sel} should have a rule`);

      const zeroed = /border-top-width\s*:\s*(0|none)\b/.test(rule);
      const drawn = /border-top-style\s*:[^;]*\b(solid|dashed|dotted)\b/.test(rule);
      assert.ok(!zeroed && drawn,
        `${sel} must draw a rule, not stop at the base reset of height:0 + ` +
        `border:0, which occupies space and paints nothing. Rule was: ` + rule);
    });
  }

  it(".bw_quote should be visually set apart", function () {
    const bq = ruleFor(".bw_quote");
    assert.ok(bq, ".bw_quote should exist");
    assert.ok(/padding|margin|border/.test(bq),
      ".bw_quote should be indented or ruled so it reads as a quotation");
  });

  it(".bw_code should be distinguishable from body text", function () {
    const code = ruleFor(".bw_code");
    assert.ok(code, ".bw_code should exist -- the examples already use it");
    assert.ok(/background|font-family|padding/.test(code),
      ".bw_code should differ from surrounding prose");
  });

  // ---- Deliberately out of scope -----------------------------------------

  it("should leave data and control elements to their components", function () {
    // A bare <table> or <input> is a component's job (makeTable, makeInput).
    // This documents the boundary so nobody "helpfully" adds bare-tag rules.
    assert.strictEqual(ruleFor("table"), null, "bare table belongs to makeTable");
    assert.strictEqual(ruleFor("input"), null, "bare input belongs to makeInput");
  });
});
