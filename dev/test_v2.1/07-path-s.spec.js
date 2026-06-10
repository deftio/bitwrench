/**
 * 2.1 Spec Tests — Package 07: Path S — string rendering + convergence
 * Contract: lifecycle spec §1.4 (two paths, registry mechanics, CSP
 * emission, adoption + behavior parity)
 * RED BY DESIGN.
 */
import assert from "assert";
import bw from "../../src/bitwrench.js";
import { freshDOM, app, makeSensorTaco, collectDiag, resetBWForTest } from "./_helpers.js";

beforeEach(freshDOM);
afterEach(function () { resetBWForTest(bw); });

describe("07.1 bw.html — pure, identity-stamping (§1.4)", function () {
  it("is pure: no registry growth, no retained state across calls", function () {
    const before = bw._debug().registered;
    bw.html(makeSensorTaco());
    bw.html({ t: "div", a: { onclick: function () {} }, c: "x" }, { fns: {} });
    assert.strictEqual(bw._debug().registered, before);
  });

  it("stamps identity classes for o.* elements; bw_act passes through", function () {
    const out = bw.html({ t: "div", a: { class: "bw_act_ping" }, c: "x", o: { type: "card" } });
    assert.ok(out.indexOf("bw_lc") !== -1);
    assert.ok(out.indexOf("bw_is_component") !== -1);
    assert.ok(out.indexOf("bw_uuid_") !== -1);
    assert.ok(out.indexOf("bw_act_ping") !== -1);
  });

  it("without {fns}: function attrs skipped + ONE fn_skipped diag; nothing inline", function () {
    const { codes, stop } = collectDiag(bw);
    const out = bw.html({ t: "div", c: [
      { t: "button", a: { onclick: function () {} }, c: "a" },
      { t: "button", a: { onclick: function () {} }, c: "b" }
    ]});
    stop();
    assert.ok(out.indexOf("onclick") === -1);
    assert.strictEqual(codes.filter(c => c === "fn_skipped").length, 1, "warn once per render");
  });

  it("with {fns}: caller registry filled; elements get bw_fn_* MARKER CLASSES, no inline on*", function () {
    const fns = {};
    const shared = function () {};
    const out = bw.html({ t: "div", c: [
      { t: "button", a: { onclick: shared }, c: "a" },
      { t: "button", a: { onclick: shared }, c: "b" },
      { t: "button", a: { onclick: function named() {} }, c: "c" }
    ]}, { fns: fns });

    assert.strictEqual(Object.keys(fns).length, 2, "dedupe by reference: shared=1, named=1");
    assert.ok(out.indexOf("onclick=") === -1, "NO inline handler attributes (CSP, rev 8)");
    const markers = out.match(/bw_fn_\d+/g) || [];
    assert.strictEqual(markers.length, 3, "three elements carry markers");
    assert.strictEqual(new Set(markers).size, 2, "two share one id");
  });

  it("same function on different event attrs records distinct bindings, not just one fn id", function () {
    // Function identity alone is not enough: onclick and onchange need
    // different DOM event names at bind time. This catches a subtle Path S
    // wart where dedupe-by-reference could silently drop one behavior.
    const fns = {};
    const shared = function () {};
    const out = bw.html({ t: "div", c: [
      { t: "button", a: { onclick: shared }, c: "click" },
      { t: "input", a: { onchange: shared } }
    ]}, { fns: fns });
    assert.strictEqual(Object.keys(fns).length, 2,
      "registry key must include event type as well as function reference");
    assert.strictEqual((out.match(/bw_fn_\d+/g) || []).length, 2);
  });

  it("registry output carries no data-bw-* action compatibility attributes", function () {
    const out = bw.html({ t: "button", a: { class: "bw_act_ok" }, c: "ok" });
    assert.ok(out.indexOf("data-bw-action") === -1,
      "2.1 action names ride as class tokens, not legacy data-bw attributes");
  });

  it("user-authored STRING onclick passes through (explicit author choice)", function () {
    const out = bw.html({ t: "button", a: { onclick: "doThing()" }, c: "x" });
    assert.ok(out.indexOf('onclick="doThing()"') !== -1);
  });
});

describe("07.2 bw.htmlPage — registry on by default, CSP-clean (§1.4)", function () {
  function page(opts) {
    return bw.htmlPage(Object.assign({
      body: { t: "div", a: { id: "root" }, c: [
        { t: "button", a: { onclick: function () { document.title = "clicked"; } }, c: "Go" }
      ]}
    }, opts || {}));
  }

  it("emits the function registry + binder script by default; binds by marker class", function () {
    const htmlStr = page();
    assert.ok(/bw_fn_\d+/.test(htmlStr), "marker classes in markup");
    assert.ok(htmlStr.indexOf("onclick=") === -1, "no inline handler attributes");
    assert.ok(/<script/.test(htmlStr), "registry/binder script present");
  });

  it("{handlers:false} emits inert output — no registry script, no markers", function () {
    const htmlStr = page({ handlers: false });
    assert.ok(!/bw_fn_\d+/.test(htmlStr));
    assert.ok(htmlStr.indexOf("bw.__fnRegistry") === -1);
  });

  it("two renders have independent registries (no cross-render leak)", function () {
    const a = page(), b = page();
    // ids restart per render: both pages contain bw_fn_0, neither references the other's count
    assert.ok(a.indexOf("bw_fn_0") !== -1 && b.indexOf("bw_fn_0") !== -1);
  });

  it("with cspNonce: EVERY inline <script> and <style> carries the nonce (walk, don't spot-check)", function () {
    bw.config = bw.config || {};
    bw.config.cspNonce = "test-nonce-123";
    const htmlStr = page();
    bw.config.cspNonce = null;

    const doc = new window.DOMParser().parseFromString(htmlStr, "text/html");
    const scripts = doc.querySelectorAll("script:not([src])");
    const styles = doc.querySelectorAll("style");
    assert.ok(scripts.length >= 1, "page has inline scripts to check");
    scripts.forEach(function (s) {
      assert.strictEqual(s.getAttribute("nonce"), "test-nonce-123", "unnonced inline script: " + s.textContent.slice(0, 40));
    });
    styles.forEach(function (s) {
      assert.strictEqual(s.getAttribute("nonce"), "test-nonce-123");
    });
  });
});

describe("07.3 convergence — adopt, then hydrate (§1.4)", function () {
  it("html → innerHTML → mountTree(document.body): addressable; patch/remove work", function () {
    const taco = makeSensorTaco();
    app().innerHTML = bw.html(taco);
    bw.mountTree(document.body);

    const el = app().firstElementChild;
    const uuid = bw.getUUID(el);
    assert.strictEqual(bw.el(uuid), el, "adopted by identity in markup");
    bw.patch(uuid, { "aria-label": "sensor" });
    assert.strictEqual(el.getAttribute("aria-label"), "sensor");
    bw.remove(uuid);
    assert.strictEqual(app().children.length, 0);
  });

  it("adoption is registration-only: no hooks fire from markup, idempotent", function () {
    app().innerHTML = bw.html(makeSensorTaco());
    const events = [];
    const stop = bw.sub("bw:lifecycle", function (d) { events.push(d.event); });
    bw.mountTree(document.body);
    bw.mountTree(document.body);            // double adoption
    stop();
    assert.strictEqual(events.filter(e => e === "mount").length, 1);
  });

  it("behavior parity: hydrate(el, factoryTaco) makes el.bw identical to Path L", function () {
    const factory = makeSensorTaco();
    app().innerHTML = bw.html(factory);
    bw.mountTree(document.body);
    const el = app().firstElementChild;
    bw.hydrate(el, makeSensorTaco());

    // identical assertions to the Path L component:
    el.bw.update({ value: 12 });
    assert.strictEqual(el.querySelector(".sc_value").textContent, "12");
    el.bw.setLabel("CPU");
    assert.strictEqual(el.bw.getLabel(), "CPU");
    assert.strictEqual(typeof el.bw.getState, "function");
  });

  it("bw_act on a string-rendered page dispatches with zero setup (the §5.4 argument)", function () {
    app().innerHTML = bw.html({ t: "button", a: { class: "bw_act_from_string" }, c: "x" });
    const acts = [];
    const stop = bw.sub("act:from_string", function (d) { acts.push(d); });
    app().firstElementChild.dispatchEvent(new window.MouseEvent("click", { bubbles: true, cancelable: true }));
    stop();
    assert.strictEqual(acts.length, 1, "actions survive the string path — classes, not wiring");
  });
});
