/**
 * Ergonomic contract — the LIVE lane (bw.create / bw.DOM / bw.mount).
 *
 * Companion to test/bitwrench_test_contract.js, which covers the string lane
 * (bw.html / bw.htmlPage). Read that file's header first: it explains why these
 * contract files exist and how a well-meant refactor silently inverted an API
 * in v2.1.0.
 *
 * ===========================================================================
 * READ THIS BEFORE CHANGING ANY ASSERTION IN THIS FILE
 * ===========================================================================
 *
 * This is the lane bitwrench actually wants you to build apps in: bw.DOM(),
 * lifecycle hooks, o.handle, bwserve, bwattach. It is also the lane where
 * imported framework habits do the most damage, because every one of them has
 * a plausible-sounding justification:
 *
 *   "re-render from state"        -> React's useState. Here it would throw away
 *                                    a live element and everything attached to
 *                                    it. Components update themselves instead.
 *   "keep a virtual tree"          -> React's VDOM exists because React decided
 *                                    the DOM cannot be trusted. bitwrench's
 *                                    position is that it can: the DOM IS the
 *                                    registry, queried at native speed.
 *   "descriptor in, new node out"  -> makes element identity disposable, which
 *                                    breaks focus, scroll, selection, media
 *                                    playback and every listener bound outside
 *                                    the framework.
 *   "return the node, or null"     -> querySelector's shape. bw.$ returns an
 *                                    array so call sites never branch.
 *   "stash it in a data-* attr"    -> the DOM as a string-keyed junk drawer.
 *                                    bitwrench 1.x never did this; 2.x does not
 *                                    either.
 *
 * None of these arrive labelled. They arrive as "clean up the update path".
 * The assertions below are what that clean-up has to get past.
 *
 * Corollary from the string lane, restated because it applies here too:
 * if making a call work requires the caller to run a follow-up loop, stop.
 */

import assert from "assert";
import { JSDOM } from "jsdom";
import bw from "../src/bitwrench.js";

function freshDOM() {
  const dom = new JSDOM('<!DOCTYPE html><html><body><div id="app"></div></body></html>');
  global.window = dom.window;
  global.document = dom.window.document;
  global.CustomEvent = dom.window.CustomEvent;
  global.Event = dom.window.Event;
  bw._resetForTest();
}

describe("contract (live) — components own their DOM", function () {

  beforeEach(freshDOM);

  /**
   * WHY: The single most important property of the live lane, and the one a
   * virtual-DOM refactor destroys first.
   *
   * When you call a method on a component, it mutates the element it already
   * has. It does not build a replacement and swap it in. If identity were
   * disposable, then every update would silently discard focus, text selection,
   * scroll position, in-flight CSS transitions, media playback state, and any
   * listener bound by code outside bitwrench. React tolerates that because it
   * owns the whole tree and reconciles those concerns back; bitwrench does not
   * own the tree and must not break them.
   *
   * This is also what makes `el.bw.method()` an honest API rather than a
   * disguised re-render: the thing you hold a reference to stays the thing on
   * the page.
   */
  it("keeps element identity across handle method calls", function () {
    const el = bw.mount("#app", {
      t: "div", c: "a",
      o: { handle: { setText: (e, v) => { e.textContent = v; } } }
    });
    const original = el;
    const originalChild = document.querySelector("#app").firstChild;

    el.bw.setText("b");

    assert.strictEqual(document.querySelector("#app").firstChild, originalChild,
      "the node in the document must be the same node, not a replacement");
    assert.strictEqual(el, original, "the handle must not swap the caller's reference");
    assert.strictEqual(el.textContent, "b", "and it must actually have updated");
  });

  /**
   * WHY: Handles are plain functions taking the element first — fn(el, ...args)
   * — bound at mount so callers write el.bw.method(args). Recording the calling
   * convention because it is the seam most likely to be "tidied" into something
   * this-bound or descriptor-based, which would break every existing handle.
   */
  it("passes the element as the first argument to handle methods", function () {
    let seen = null;
    const el = bw.mount("#app", {
      t: "div",
      o: { handle: { probe: (e, arg) => { seen = { e, arg }; } } }
    });
    el.bw.probe(42);
    assert.strictEqual(seen.e, el, "handle receives its own element");
    assert.strictEqual(seen.arg, 42, "caller args follow the element");
  });

  /**
   * WHY: The anti-useState invariant. Writing to state must NOT trigger a
   * render on its own.
   *
   * React couples them, so a refactor "for consistency" is a live temptation.
   * Coupling them here would mean bitwrench decides when your DOM changes, and
   * a render could fire in the middle of a multi-field update, halfway to a
   * valid state. Explicit updates (bw.patch / bw.update / calling render
   * yourself) keep that decision with the person who knows when the state is
   * coherent.
   *
   * If you are here because you want automatic re-render: that is a new API,
   * not a change to this one.
   */
  it("does not re-render when state is written directly", function () {
    let renders = 0;
    const el = bw.mount("#app", {
      t: "div",
      o: { state: { n: 0 }, render: (e, s) => { renders++; e.textContent = String(s.n); } }
    });
    const afterMount = renders;

    el._bw_state.n = 5;

    assert.strictEqual(renders, afterMount,
      "a bare state write must not schedule or perform a render");
  });
});

describe("contract (live) — lifecycle ordering", function () {

  beforeEach(freshDOM);

  /**
   * WHY: mounted() must fire with the element already in the document.
   *
   * Hooks routinely reach for the DOM — measuring, querying children, wiring a
   * third-party widget. If mounted fired before insertion, every one of those
   * would silently no-op: querySelector returns null, offsetWidth is 0, and
   * nothing throws. bw.mount() deliberately appends first and walks the tree
   * second (mountTree) so this holds.
   */
  it("fires mounted() only after the element is attached", function () {
    let connected = null;
    bw.mount("#app", { t: "div", o: { mounted: (e) => { connected = e.isConnected; } } });
    assert.strictEqual(connected, true,
      "mounted must see a connected element, or DOM work inside it silently fails");
  });

  /**
   * WHY: mounted() fires parent-first, depth-first — outermost before inner.
   *
   * This ordering is load-bearing and easy to invert while "cleaning up" the
   * mount walk. It is also genuinely surprising in one direction: a parent's
   * mounted() runs BEFORE its children's, so a parent cannot assume a child
   * hook has already run.
   *
   * That is not theoretical. pages/shared-tryit.js auto-ran its editor in the
   * container's mounted() and read the code via an API the nested editor
   * attaches in its OWN mounted() — which had not fired yet. Result: every
   * try-it editor on the docs site rendered an empty result panel until the
   * user clicked Run. Fourteen of them, across three pages, for months.
   *
   * If you invert this order to "fix" that class of bug, you will break the
   * opposite class: parents that set up context their children read.
   */
  it("fires mounted() parent-first, before children", function () {
    const order = [];
    bw.mount("#app", {
      t: "div",
      o: { mounted: () => order.push("parent") },
      c: [{ t: "span", o: { mounted: () => order.push("child") } }]
    });
    assert.deepStrictEqual(order, ["parent", "child"],
      "outermost mounted() runs first; a parent cannot rely on child hooks");
  });

  /**
   * WHY: Unmounting must leave nothing behind in the node registry.
   *
   * The DOM is the registry, so a stale entry is worse than a leak: it is a
   * lookup that resolves to a detached element, and writes to it vanish with no
   * error. Any change to the mount walk has to keep the teardown symmetric.
   */
  it("clears registry entries on unmount", function () {
    const el = bw.mount("#app", { t: "div", o: { mounted: () => {}, unmount: () => {} } });
    const uuid = bw.getUUID(el);
    assert.ok(bw._nodeMap[uuid], "should be registered while mounted");

    bw.unmount(el);

    assert.ok(!bw._nodeMap[uuid],
      "a detached element must not stay resolvable, or writes go nowhere");
  });
});

describe("contract (live) — addressing", function () {

  beforeEach(freshDOM);

  /**
   * WHY: bw.$ always returns an array, hit or miss.
   *
   * querySelector returns Element|null and querySelectorAll returns a NodeList,
   * so every raw-DOM call site branches before it can act. Returning an array
   * unconditionally means .forEach and .map always work and a miss is simply a
   * zero-length loop. Softening this to "the element, or null" would look like
   * a convenience and would break every existing call site's shape.
   */
  it("returns an array from bw.$ whether or not anything matches", function () {
    assert.ok(Array.isArray(bw.$("#app")), "array on hit");
    assert.strictEqual(bw.$("#app").length, 1);
    assert.ok(Array.isArray(bw.$("#no-such-thing")), "array on miss, never null");
    assert.strictEqual(bw.$("#no-such-thing").length, 0);
  });

  /**
   * WHY: No data-* attributes, anywhere in bitwrench's own output.
   *
   * 1.x never used them and 2.x does not either. They are a string-keyed junk
   * drawer bolted to the DOM: untyped, easy to collide with user markup, and
   * they encourage stashing component state where anything can edit it.
   * bitwrench addresses elements by UUID class, element id, or a direct
   * reference, and keeps state on the element as a property.
   *
   * This is a sweep rather than a per-component check on purpose: the failure
   * mode is a NEW component quietly introducing one, which per-component tests
   * cannot catch because nobody writes the test that does not exist yet.
   */
  it("emits no data-* attributes from any component", function () {
    const cases = {
      makeButton: { text: "x" },
      makeCard: { title: "t", content: "c" },
      makeNav: { items: [{ text: "a", href: "#" }] },
      makeTabs: { tabs: [{ title: "a", content: "b" }] },
      makeAccordion: { items: [{ title: "a", content: "b" }] },
      makeModal: { title: "t", content: "c" },
      makeTable: { columns: ["a"], rows: [["1"]] },
      makeBreadcrumb: { items: [{ text: "a", href: "#" }] },
      makePagination: { currentPage: 1, totalPages: 3 },
      makeDropdown: { label: "d", items: [{ text: "a" }] }
    };

    const offenders = [];
    for (const [name, args] of Object.entries(cases)) {
      if (typeof bw[name] !== "function") continue;
      let html = "";
      try { html = bw.html(bw[name](args)); } catch (e) { continue; }
      const found = html.match(/\sdata-[a-zA-Z-]+/g);
      if (found) offenders.push(name + " -> " + [...new Set(found)].join(", "));
    }

    assert.deepStrictEqual(offenders, [],
      "components must not emit data-* attributes. Use a UUID class, an id, or " +
      "an element property instead. Offenders:\n  " + offenders.join("\n  "));
  });
});
