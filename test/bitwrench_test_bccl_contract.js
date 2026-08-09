/**
 * BCCL contract tests.
 *
 * These exist because writing one tutorial against BCCL surfaced five separate
 * problems, and none of them were caught by the existing tests. The existing
 * suite checks that a factory returns the right TACO *shape*. These check the
 * things that actually broke:
 *
 *   1. Prop names. Factories disagree about `children` vs `content`, `items`
 *      vs `slides`, `content` vs `message`. Passing the wrong one produces an
 *      empty element with no error, so a page silently renders blank.
 *   2. Class names. A factory can emit a class that has no CSS rule, so the
 *      component renders structurally correct and completely unstyled.
 *   3. Wiring. A component can ship a working o.handle and still be inert
 *      because nothing connects a DOM event to it -- which is exactly how
 *      makeTable's click-to-sort was dead while being documented as working.
 */

import assert from "assert";
import bw from "../src/bitwrench.js";

const MARK = "CONTRACT_MARKER";

function html(taco) {
  return bw.html(taco);
}

// =========================================================================
// 1. Prop contract -- which prop actually carries the content
// =========================================================================
//
// This table is the documentation. If a factory changes which prop it reads,
// this fails rather than silently rendering nothing.

const CONTENT_PROP = {
  // container-style: take `children`
  makeContainer:   { prop: "children", value: [{ t: "span", c: MARK }] },
  makeRow:         { prop: "children", value: [{ t: "span", c: MARK }] },
  makeStack:       { prop: "children", value: [{ t: "span", c: MARK }] },
  makeForm:        { prop: "children", value: [{ t: "span", c: MARK }] },
  makeButtonGroup: { prop: "children", value: [{ t: "span", c: MARK }] },

  // card-style: take `content`
  makeCard:        { prop: "content", value: MARK },
  makeHero:        { prop: "content", value: MARK },
  makeSection:     { prop: "content", value: MARK },
  makeModal:       { prop: "content", value: MARK },
  makeToast:       { prop: "content", value: MARK },
  makeTooltip:     { prop: "content", value: MARK },
  makePopover:     { prop: "content", value: MARK },
  makeMediaObject: { prop: "content", value: MARK }
};

describe("BCCL contract: which prop carries content", function () {
  Object.keys(CONTENT_PROP).forEach(function (name) {
    const spec = CONTENT_PROP[name];

    it(name + "() should render content passed via `" + spec.prop + "`", function () {
      const taco = bw[name]({ [spec.prop]: spec.value });
      assert.ok(
        html(taco).includes(MARK),
        name + " ignored its documented `" + spec.prop + "` prop -- content vanished silently"
      );
    });
  });

  it("should document that container and card factories disagree", function () {
    // Not a preference, just a fact worth pinning: half take `children` and
    // half take `content`, and mixing them up renders nothing.
    const usesChildren = html(bw.makeStack({ children: [{ t: "span", c: MARK }] }));
    const usesContent = html(bw.makeCard({ content: MARK }));
    assert.ok(usesChildren.includes(MARK));
    assert.ok(usesContent.includes(MARK));

    // The mismatch case -- this is the failure mode that cost real time.
    assert.ok(
      !html(bw.makeSection({ children: [{ t: "span", c: MARK }] })).includes(MARK),
      "makeSection currently ignores `children`; if it starts accepting it, " +
      "update CONTENT_PROP and this test"
    );
  });
});

// =========================================================================
// 2. Collection factories -- what the list prop is called
// =========================================================================

const COLLECTION_PROP = {
  makeCarousel:  { props: { items: ["one", "two", "three"] }, expect: "one" },
  makeAccordion: { props: { items: [{ title: "T", content: MARK }] }, expect: MARK },
  makeTabs:      { props: { tabs: [{ label: "A", content: MARK }] }, expect: MARK },
  makeListGroup: { props: { items: [MARK] }, expect: MARK },
  makeBreadcrumb:{ props: { items: [{ text: MARK }] }, expect: MARK },
  makeNav:       { props: { items: [{ text: MARK }] }, expect: MARK }
};

describe("BCCL contract: collection prop names", function () {
  Object.keys(COLLECTION_PROP).forEach(function (name) {
    const spec = COLLECTION_PROP[name];
    const propName = Object.keys(spec.props)[0];

    it(name + "() should render entries passed via `" + propName + "`", function () {
      assert.ok(
        html(bw[name](spec.props)).includes(spec.expect),
        name + " ignored `" + propName + "` -- entries vanished silently"
      );
    });
  });
});

// =========================================================================
// 3. Class contract -- every styling class must have a rule
// =========================================================================
//
// A class with no rule renders an unstyled component. bw_bccl_* classes are
// identity markers and are exempt; anything else is meant to style something.

describe("BCCL contract: emitted classes have CSS rules", function () {
  let css;

  before(function () {
    bw.clearStyles && bw.clearStyles();
    bw.loadStyles({ primary: "#2563eb" });
    css = Array.prototype.map
      .call(document.querySelectorAll("style"), function (s) { return s.textContent; })
      .join("\n");
  });

  // Deliberately empty. Three orphans existed when this test was written --
  // bw_container, bw_breadcrumb and bw_spinner_border-md -- and all three were
  // fixed rather than allowlisted. Adding an entry here should be a last
  // resort; an unstyled class means a component renders wrong.
  const KNOWN_ORPHANS = [];

  it("should not introduce new classes without CSS rules", function () {
    const factories = Object.keys(bw).filter(function (k) { return /^make[A-Z]/.test(k); });
    const orphans = [];

    factories.forEach(function (name) {
      let taco;
      try { taco = bw[name]({}); } catch (e) { return; }
      if (!taco || typeof taco !== "object") return;

      let markup;
      try { markup = html(taco); } catch (e) { return; }

      const classes = [];
      const re = /class="([^"]*)"/g;
      let m;
      while ((m = re.exec(markup)) !== null) {
        m[1].split(/\s+/).forEach(function (c) { classes.push(c); });
      }

      classes.forEach(function (c) {
        if (!c.startsWith("bw_")) return;
        if (/uuid|bw_lc|bw_is_/.test(c)) return;   // identity/lifecycle markers
        if (c.startsWith("bw_bccl_")) return;      // component identity markers
        if (css.indexOf("." + c) !== -1) return;
        if (KNOWN_ORPHANS.indexOf(c) !== -1) return;
        if (orphans.indexOf(name + " -> ." + c) === -1) orphans.push(name + " -> ." + c);
      });
    });

    assert.deepStrictEqual(
      orphans, [],
      "these factories emit classes with no CSS rule, so they render unstyled"
    );
  });
});

// =========================================================================
// 4. Wiring contract -- interactive components respond to real clicks
// =========================================================================
//
// The bug that started this: makeTable shipped a working o.handle.sort while
// nothing connected a header click to it. Structure was perfect, behaviour
// absent. These tests click, then assert the DOM changed.

describe("BCCL contract: interactive components respond to clicks", function () {
  function mount(taco) {
    document.body.innerHTML = '<div id="contract-host"></div>';
    return bw.mount("#contract-host", taco);
  }

  function texts(sel) {
    return Array.prototype.map.call(
      document.querySelectorAll("#contract-host " + sel),
      function (n) { return n.textContent; }
    );
  }

  it("makeTable headers should reorder rows when clicked", function () {
    mount(bw.makeTable({
      data: [{ pin: "D0" }, { pin: "D1" }, { pin: "A0" }],
      columns: [{ key: "pin", label: "Pin" }]
    }));
    assert.deepStrictEqual(texts("tbody td"), ["D0", "D1", "A0"]);
    document.querySelector("#contract-host th").click();
    assert.deepStrictEqual(texts("tbody td"), ["A0", "D0", "D1"], "header click must sort");
  });

  it("makeTabs should switch panels when a tab is clicked", function () {
    const el = mount(bw.makeTabs({
      tabs: [{ label: "One", content: "first" }, { label: "Two", content: "second" }]
    }));
    const before = el.bw && el.bw.getActiveTab ? el.bw.getActiveTab() : null;
    const buttons = document.querySelectorAll("#contract-host button");
    assert.ok(buttons.length >= 2, "tabs should render a button per tab");
    buttons[1].click();
    const after = el.bw && el.bw.getActiveTab ? el.bw.getActiveTab() : null;
    assert.notDeepStrictEqual(after, before, "clicking a tab must change the active tab");
  });

  it("makeAccordion should expand a section when its header is clicked", function () {
    mount(bw.makeAccordion({
      items: [{ title: "First", content: "body one" }, { title: "Second", content: "body two" }]
    }));
    const headers = document.querySelectorAll("#contract-host button");
    assert.ok(headers.length >= 2, "accordion should render a button per section");
    const markupBefore = document.querySelector("#contract-host").innerHTML;
    headers[1].click();
    assert.notStrictEqual(
      document.querySelector("#contract-host").innerHTML, markupBefore,
      "clicking an accordion header must change the DOM"
    );
  });

  it("makeCarousel should advance through slides", function () {
    const el = mount(bw.makeCarousel({ items: ["one", "two", "three"] }));
    assert.ok(document.querySelectorAll("#contract-host button").length > 0,
      "carousel should render navigation controls");
    assert.strictEqual(el.bw.getActiveIndex(), 0);
    el.bw.next();
    assert.strictEqual(el.bw.getActiveIndex(), 1, "next() must advance the active slide");
  });
});

// =========================================================================
// 5. Style serialisation -- string output must be valid CSS
// =========================================================================
//
// bw.DOM() sets el.style.paddingLeft, which the DOM converts for you. bw.html()
// built the attribute by hand and used the key verbatim, so it emitted
// style="paddingLeft:1rem" -- which browsers ignore. Server-rendered pages
// silently lost every camelCase style property.

describe("bw.html: style attribute uses CSS property names", function () {
  function styleOf(styleObj) {
    const m = bw.html({ t: "p", a: { style: styleObj }, c: "x" }).match(/style="([^"]*)"/);
    return m ? m[1] : null;
  }

  it("should hyphenate camelCase properties", function () {
    assert.strictEqual(styleOf({ paddingLeft: "1.25rem" }), "padding-left:1.25rem");
    assert.strictEqual(styleOf({ backgroundColor: "red" }), "background-color:red");
  });

  it("should leave already-hyphenated properties alone", function () {
    assert.strictEqual(styleOf({ "font-size": "12px" }), "font-size:12px");
  });

  it("should keep the leading dash on vendor-prefixed properties", function () {
    assert.strictEqual(styleOf({ WebkitTransform: "scale(2)" }), "-webkit-transform:scale(2)");
  });

  it("should not mangle custom properties", function () {
    assert.strictEqual(styleOf({ "--bw-x": "3px" }), "--bw-x:3px");
  });

  it("should match what the DOM path produces", function () {
    document.body.innerHTML = '<div id="style-host"></div>';
    bw.DOM("#style-host", { t: "p", a: { style: { paddingLeft: "1.25rem" } }, c: "x" });
    const fromDom = document.querySelector("#style-host p").style.paddingLeft;
    assert.strictEqual(fromDom, "1.25rem", "DOM path should apply the padding");
    assert.ok(styleOf({ paddingLeft: "1.25rem" }).indexOf("padding-left") === 0,
      "string path should express the same property the same way");
  });
});
