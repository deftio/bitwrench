/**
 * Ergonomic contract — the invariants that make bitwrench bitwrench.
 *
 * ===========================================================================
 * READ THIS BEFORE CHANGING ANY ASSERTION IN THIS FILE
 * ===========================================================================
 *
 * The northstar doc is prose, and prose cannot fail a build. This file is the
 * executable half: a small set of properties that must stay true, each with the
 * argument for why written next to it. If you are here because an assertion is
 * in your way, the assertion is probably right and the change is probably
 * drift. Read the WHY, then decide deliberately.
 *
 * ---------------------------------------------------------------------------
 * WHY THIS FILE EXISTS AT ALL
 * ---------------------------------------------------------------------------
 * bitwrench is a counter-thesis to the mainstream JS frameworks, which means
 * anyone working on it -- human or model -- arrives carrying patterns from
 * React, Svelte, htmx and raw-DOM jQuery-era code. Those patterns do not
 * announce themselves. They arrive disguised as rigour: "be explicit", "make
 * the caller opt in", "separate description from binding". Each sounds like
 * good engineering in isolation. Applied here they quietly convert a library
 * whose thesis is "objects in, working UI out" into one that needs a second
 * step for everything.
 *
 * That is not hypothetical. v2.1.0 did exactly this to bw.html(): a refactor
 * replaced auto-registered event handlers with a caller-supplied {fns} registry
 * plus a manual binding loop --
 *
 *     Object.keys(fns).forEach(function (id) {
 *       bw.$('.' + id).forEach(function (el) {
 *         el.addEventListener(fns[id].event, fns[id].fn);
 *       });
 *     });
 *
 * -- which is React's useEffect-attach-listeners shape wearing different
 * clothes. It shipped, silently dropped every handler passed to a bare
 * bw.html(), survived six releases, and was found by a human clicking a button
 * on a docs page. bitwrench 1.x had already settled the question the other way
 * a decade earlier: it auto-registered by default and offered
 * o.atrOnEventRegister:false as the opt-OUT.
 *
 * ---------------------------------------------------------------------------
 * THE HEURISTIC
 * ---------------------------------------------------------------------------
 * If making a bitwrench call work requires the caller to run a follow-up loop,
 * stop. That is the tell. React, htmx and Svelte all normalise a second wiring
 * step; bitwrench does not. "Describe it, then bind it" is someone else's
 * model. Here, describing it IS binding it.
 *
 * Corollary: adding a required option to make an existing call keep working is
 * a breaking change, not a refactor -- however internal it looks from inside
 * the diff.
 */

import assert from "assert";
import bw from "../src/bitwrench.js";

describe("contract — bw.html() is a one-call API", function () {

  beforeEach(function () {
    bw._fnRegistry = {};
    bw._fnIDCounter = 0;
  });

  /**
   * WHY: This is the whole promise of bw.html(). It is the oldest function in
   * the library -- it predates the name bitwrench -- and its contract has
   * always been TACO in, HTML out, one call. A fragment produced here gets
   * pasted into a page, an email, a device's flash, or an LLM's output. There
   * is nowhere to put a "and now run this binding loop" instruction, and no one
   * to run it. If the returned string does not carry its own behaviour, the
   * fragment is not self-contained and the API has lost its reason to exist.
   */
  it("returns HTML whose handler works, with no follow-up call", function () {
    var fired = 0;
    var html = bw.html({ t: "button", a: { onclick: function () { fired++; } }, c: "Go" });

    assert.ok(/onclick=/.test(html),
      "the handler must travel inside the returned string");

    // Reachable purely from what the string references -- no binding step ran.
    bw.funcGetById("bw_fn_0")();
    assert.strictEqual(fired, 1);
  });

  /**
   * WHY: The specific 2.1.0 failure mode. The handler vanished, nothing threw,
   * nothing logged -- the only signal was a bw:diag event with no subscribers.
   * Silence is what let it survive six releases. Whatever the mechanism ends up
   * being, a handler must never disappear without a trace in the output.
   */
  it("never silently discards a handler", function () {
    var html = bw.html({ t: "button", a: { onclick: function () {} }, c: "Go" });
    assert.ok(/onclick=|bw_fn_/.test(html),
      "a function attribute must leave SOME trace. Got: " + html);
  });

  /**
   * WHY: Guards against the tempting "just make the caller pass a registry"
   * refactor. The plain call is the common case and must stay complete on its
   * own; options are for the unusual case (here, strict CSP), never for the
   * ordinary one. If this test needs a second argument to pass, the API has
   * been inverted.
   */
  it("needs no options argument to be fully functional", function () {
    var html = bw.html({ t: "div", a: { onclick: function () {} }, c: "x" });
    assert.ok(html.length > 0);
    assert.ok(/onclick=/.test(html), "no options object should be required");
  });

  /**
   * WHY: bw.html() must run where there is no DOM -- Node, a build script, a
   * server, an MCP tool. That is what separates it from bw.create(). If it ever
   * reaches for document or window, server-side rendering and static generation
   * both break, and the embedded story goes with them.
   */
  it("works with no DOM present", function () {
    var savedDoc = global.document, savedWin = global.window;
    global.document = undefined; global.window = undefined;
    try {
      assert.strictEqual(bw.html({ t: "p", c: "hi" }), "<p>hi</p>");
    } finally {
      global.document = savedDoc; global.window = savedWin;
    }
  });
});

describe("contract — the three rendering lanes stay separate", function () {

  beforeEach(function () {
    bw._fnRegistry = {};
    bw._fnIDCounter = 0;
  });

  /**
   * WHY: bw.create() is the live lane and must attach a real listener to a real
   * element. It has an actual element in hand, so serialisation would be pure
   * overhead -- and routing live UI through a global registry would leak a
   * function per render for the life of the process. The registry is a
   * string-lane concern and must not bleed into interactive apps, which is
   * where bwserve, bwattach and the lifecycle hooks all live.
   */
  it("bw.create() attaches a real listener and never touches the registry", function () {
    if (typeof document === "undefined") return this.skip();
    var before = Object.keys(bw._fnRegistry).length;
    var fired = 0;
    var el = bw.create({ t: "button", a: { onclick: function () { fired++; } }, c: "x" });

    el.dispatchEvent(new window.Event("click"));
    assert.strictEqual(fired, 1, "listener should be bound directly");
    assert.strictEqual(el.getAttribute("onclick"), null,
      "live elements carry no inline handler attribute");
    assert.strictEqual(Object.keys(bw._fnRegistry).length, before,
      "the live lane must not add to the global registry");
  });

  /**
   * WHY: bw.htmlPage() emits a whole document, so it owns the CSP posture of
   * everything it produces -- including dashboards served off an ESP32. An
   * inline on* attribute violates a strict script-src, so this lane uses a
   * per-render {fns} registry, a bw_fn_N class and an emitted binder instead.
   * Two consequences are load-bearing: nothing executable in the markup, and
   * nothing added to the global registry (a server generating pages in a loop
   * would otherwise leak one entry per handler per page, forever).
   */
  it("bw.htmlPage() emits no inline handler and no global registry entries", function () {
    var before = Object.keys(bw._fnRegistry).length;
    var page = bw.htmlPage({ title: "t", body: { t: "button", a: { onclick: function () {} }, c: "x" } });

    assert.ok(!/onclick=/.test(page), "inline handlers would break a strict CSP");
    assert.ok(/bw_fn_/.test(page), "handlers should ride on a class marker");
    assert.ok(/addEventListener/.test(page), "the page must emit its own binder");
    assert.strictEqual(Object.keys(bw._fnRegistry).length, before,
      "per-render registry must not pollute the global one");
  });

  /**
   * WHY: The auto path keeps a live reference, so closures and bound functions
   * work. The {fns} path stringifies for embedding in a document, so it cannot
   * carry a bound or native function and correctly refuses. Recording the
   * asymmetry deliberately: it is a real difference between the lanes, not an
   * inconsistency to be "fixed" by making both behave the same.
   */
  it("auto path accepts bound functions; the fns path declines them", function () {
    var bound = (function () { return this.n; }).bind({ n: 7 });

    assert.ok(/funcGetById/.test(bw.html({ t: "b", a: { onclick: bound }, c: "x" })),
      "a live reference can hold a bound function");

    var fns = {};
    bw.html({ t: "b", a: { onclick: bound }, c: "x" }, { fns: fns });
    assert.strictEqual(Object.keys(fns).length, 0,
      "a bound function cannot be serialised into a document");
  });
});

describe("contract — content safety", function () {

  /**
   * WHY: Escaping is the default because TACO content routinely carries data
   * from outside the program. bw.raw() is the deliberate, greppable opt-out.
   * Flipping this default would turn every existing call site into an injection
   * point at once, silently.
   */
  it("escapes content by default and only bw.raw() opts out", function () {
    assert.ok(!/<script>/.test(bw.html({ t: "p", c: "<script>alert(1)</script>" })),
      "content must be escaped by default");
    assert.ok(/<b>hi<\/b>/.test(bw.html({ t: "p", c: bw.raw("<b>hi</b>") })),
      "bw.raw() is the explicit escape hatch");
  });

  /**
   * WHY: Attribute values and element content are different contexts with
   * different rules, and bitwrench used one escaper for both. escapeHTML also
   * escapes "/" -- an OWASP rule for content, where it blunts a stray
   * "</script" -- which inside an attribute turned every URL into
   * https:&#x2F;&#x2F;example.com. Valid, decoded by browsers, and wrong for
   * anything that diffs or greps server-rendered HTML.
   *
   * Content escaping is deliberately NOT relaxed here: the "/" rule earns its
   * keep in that context and the case above depends on it.
   */
  /**
   * WHY: escaping answers "is this value safe inside quotes", which is the
   * wrong question for a KEY -- the space in `x onclick=alert(1) y` is what
   * ends the attribute name and begins the next attribute, so there is nothing
   * to escape. bw.create() has always been safe here because setAttribute
   * throws on the same key; the string path emitted it. That is the third bug
   * of this exact shape (string output wrong alone, nobody renders it during
   * development), and the reason it is not caught by the html/create agreement
   * test below is that create() throws rather than disagreeing.
   */
  it("drops attribute names the DOM itself would refuse", function () {
    const out = bw.html({ t: "div", a: { "x onclick=alert(1) y": "z" }, c: "hi" });
    assert.ok(!/onclick/.test(out),
      "a key that smuggles a second attribute must not survive: " + out);
    assert.strictEqual(out, "<div>hi</div>", "the bad key is dropped, the element still renders");

    assert.throws(function () { bw.create({ t: "div", a: { "x onclick=alert(1) y": "z" } }); },
      "the DOM path rejects the same key -- that is why this one is a bug and not a feature");

    assert.ok(bw.html({ t: "div", a: { "data-x": "1", "aria-label": "a", "xml:lang": "en" } })
      .match(/data-x="1"[\s\S]*aria-label="a"[\s\S]*xml:lang="en"/),
      "the real attribute vocabulary -- data-*, aria-*, namespaced -- must pass");
  });

  it("does not slash-escape attribute values, but still does in content", function () {
    const url = "https://example.com/a?b=1";
    assert.ok(bw.html({ t: "a", a: { href: url }, c: "x" }).includes('href="https://example.com/a?b=1"'),
      "an attribute value must survive intact -- a URL is the common case");
    assert.ok(bw.html({ t: "p", c: "</script>" }).includes("&#x2F;"),
      "content escaping is unchanged; / is still neutralised there");
  });
});

/**
 * The string path and the DOM path are two implementations of one idea, and
 * they drift silently because only one of them is ever checked by eye. In both
 * shipped bugs of this kind bw.create() was correct and bw.html() was not,
 * because the DOM does its own serialising -- so the string path was wrong
 * alone, in output nobody renders during development.
 *
 * Comparing raw markup would not work: the DOM's serialiser leaves < and >
 * unescaped inside attributes, which is legal but not what we emit. So this
 * compares semantics -- parse both, ask what the attribute actually VALUES.
 *
 * Know what that does and does not buy you. Verified by mutation:
 *
 *   camelCase style properties  -> CAUGHT here. style="paddingLeft:1rem" parses
 *                                  to nothing, so the two paths genuinely
 *                                  disagree about the resolved value.
 *
 *   slash-escaped attributes    -> NOT caught here. href="https:&#x2F;&#x2F;x"
 *                                  and href="https://x" parse to the SAME
 *                                  value, because every parser decodes
 *                                  entities. The paths agree semantically; only
 *                                  the bytes were ugly. That one is pinned by
 *                                  the exact strings in the golden fixture and
 *                                  by the content-safety case above.
 *
 * Semantic equivalence catches divergence. Exact goldens catch noise. Neither
 * subsumes the other, which is why both exist.
 */
describe("contract — bw.html() and bw.create() agree on attributes", function () {
  const CASES = [
    { name: "a URL with a query string",
      taco: { t: "a", a: { href: "https://example.com/p?a=1&b=2" }, c: "x" } },
    { name: "quotes and angle brackets in a value",
      taco: { t: "p", a: { title: 'he said "no" <yet>' }, c: "x" } },
    { name: "a camelCase style object",
      taco: { t: "p", a: { style: { paddingLeft: "1.25rem", backgroundColor: "red" } }, c: "x" } },
    { name: "a data URI",
      taco: { t: "img", a: { src: "data:image/svg+xml,<svg xmlns='http://x'/>", alt: "i" } } },
    { name: "an apostrophe in text-bearing attributes",
      taco: { t: "input", a: { placeholder: "it's here" } } }
  ];

  function parse(markup) {
    const host = document.createElement("div");
    host.innerHTML = markup;
    return host.firstElementChild;
  }

  CASES.forEach(function (c) {
    it("round-trips " + c.name, function () {
      const fromString = parse(bw.html(c.taco));
      const fromDom = bw.create(c.taco);

      assert.strictEqual(fromString.tagName, fromDom.tagName, "same element");

      Object.keys(c.taco.a).forEach(function (key) {
        if (key === "style") {
          // Compare resolved properties, not the serialised string: the two
          // paths are free to order or space them differently.
          Object.keys(c.taco.a.style).forEach(function (prop) {
            assert.strictEqual(
              fromString.style[prop], fromDom.style[prop],
              "style." + prop + " must survive the string path identically"
            );
          });
          return;
        }
        assert.strictEqual(
          fromString.getAttribute(key), fromDom.getAttribute(key),
          "attribute '" + key + "' differs between bw.html() and bw.create()"
        );
      });
    });
  });
});
