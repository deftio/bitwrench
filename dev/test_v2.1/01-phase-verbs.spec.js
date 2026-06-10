/**
 * 2.1 Spec Tests — Package 01: Phase Verbs
 *
 * Contract: dev/bitwrench-lifecycle-cleanup-2026-06-09.md (rev 12)
 *   §1.1 phase verbs (create, hydrate, mountTree, unmount,
 *        unmountChildren, detach)
 *   §2   invariants 1–3 (registered⇔live, unmount = exact inverse,
 *        name vs liveness)
 *
 * RED BY DESIGN until the 2.1 engine exists. Every failing test here is
 * a work item; all-green defines done for this package.
 */

import assert from "assert";
import bw from "../../src/bitwrench.js";
import jsdom from "jsdom";
const { JSDOM } = jsdom;

let dom;

function freshDOM() {
  dom = new JSDOM('<!DOCTYPE html><html><body><div id="app"></div></body></html>');
  global.window = dom.window;
  global.document = dom.window.document;
  global.Element = dom.window.Element;
  global.DocumentFragment = dom.window.DocumentFragment;
  global.HTMLElement = dom.window.HTMLElement;
  global.CustomEvent = dom.window.CustomEvent;
  global.MutationObserver = dom.window.MutationObserver;
  // Harness compatibility while running against 2.0.x src: the legacy rAF
  // mounted path crashes in bare jsdom and masks real assertion failures.
  // 2.1 deletes that path; this stub then becomes inert.
  global.requestAnimationFrame = function (fn) { return setTimeout(fn, 0); };
}

/** A full component TACO: state + handle + slots + hooks + type. */
function makeSensorTaco(opts) {
  opts = opts || {};
  return {
    t: "div",
    a: { class: "sensor_card" },
    c: [
      { t: "div", a: { class: "sc_label" }, c: opts.label || "Sensor" },
      { t: "div", a: { class: "sc_value" }, c: "—" }
    ],
    o: {
      type: "sensor-card",
      state: { value: null, log: opts.log || null },
      slots: { label: ".sc_label", value: ".sc_value" },
      handle: {
        update: function (el, d) {
          el._bw_state.value = d.value;
          el.bw.setValue(String(d.value));
        }
      },
      mounted: function (el, state) {
        if (state.log) state.log.push("mounted:" + (opts.name || "x"));
      },
      unmount: function (el, state) {
        if (state.log) state.log.push("unmount:" + (opts.name || "x"));
      }
    }
  };
}

function app() { return document.getElementById("app"); }

beforeEach(freshDOM);
afterEach(function () {
  if (bw && typeof bw._resetForTest === "function") bw._resetForTest();
  if (bw && bw.config) bw.config.cspNonce = null;
});

// -------------------------------------------------------------------------
describe("01.0 API surface (2.1 verbs exist)", function () {
  ["create", "hydrate", "mountTree", "unmount", "unmountChildren",
   "detach", "mount", "remove", "_debug"].forEach(function (fn) {
    it("bw." + fn + " is a function", function () {
      assert.strictEqual(typeof bw[fn], "function", "missing 2.1 verb: bw." + fn);
    });
  });
  it("bw._resetForTest exists for leak-free spec isolation", function () {
    // This is intentionally not a public app API. The suite needs a hard reset
    // because bitwrench owns global-ish machinery: pub/sub topics, janitor
    // queues, detached keep-alives, action delegation, remotes, and CSP config.
    assert.strictEqual(typeof bw._resetForTest, "function");
  });
  it("bw.createDOM and bw.cleanup are GONE (alias purge, §12)", function () {
    assert.strictEqual(bw.createDOM, undefined);
    assert.strictEqual(bw.cleanup, undefined);
  });
  it("the generated create* family is GONE — incl. the accidental 2.0.x bw.create (§12)", function () {
    assert.strictEqual(bw.createCard, undefined);
    assert.strictEqual(bw.createTable, undefined);
    // bw.create must be the §1.1 verb (TACO in), not the codegen artifact
    // (props in → createDOM(make(props))). Behavior: a TACO round-trips.
    const node = bw.create({ t: "em", c: "verb-check" });
    assert.strictEqual(node.tagName, "EM");
  });
  it("bw.DOM is an exact alias of bw.mount", function () {
    assert.strictEqual(bw.DOM, bw.mount);
  });
});

// -------------------------------------------------------------------------
describe("01.1 create — hydrated, detached, unregistered (§1.1)", function () {
  it("returns a detached element with state, handle, slots wired", function () {
    const node = bw.create(makeSensorTaco());
    assert.ok(node instanceof Element);
    assert.strictEqual(node.isConnected, false);
    assert.deepStrictEqual(node._bw_state.value, null);
    assert.strictEqual(typeof node.bw.update, "function");
    assert.strictEqual(typeof node.bw.setValue, "function");
    assert.strictEqual(typeof node.bw.getState, "function");
  });

  it("handle methods work before mount (capable but unborn)", function () {
    const node = bw.create(makeSensorTaco());
    node.bw.update({ value: 42 });
    assert.strictEqual(node.querySelector(".sc_value").textContent, "42");
  });

  it("stamps marker classes: bw_lc, bw_is_component, typed marker, uuid token", function () {
    const node = bw.create(makeSensorTaco());
    assert.ok(node.classList.contains("bw_lc"));
    assert.ok(node.classList.contains("bw_is_component"));
    assert.ok(node.classList.contains("bw_is_component_sensor-card"),
      "typed marker is bw_is_component_<type>");
    assert.ok(/(^|\s)bw_uuid_\S+/.test(node.className), "uuid token stamped at create");
  });

  it("never emits the dead _bccl_ marker namespace (rev 9)", function () {
    const node = bw.create(makeSensorTaco());
    assert.ok(node.className.indexOf("bw_is_component_bccl") === -1);
  });

  it("o.type ALONE creates a component shell (rev 9 decision)", function () {
    const node = bw.create({ t: "div", o: { type: "widget" } });
    assert.ok(node.classList.contains("bw_lc"));
    assert.ok(node.classList.contains("bw_is_component"));
    assert.ok(node.classList.contains("bw_is_component_widget"));
    assert.strictEqual(node._bw_type, "widget");
  });

  it("performs NO registrations — not uuid, not id (rev 6)", function () {
    const before = bw._debug().registered;
    bw.create(makeSensorTaco());
    bw.create({ t: "div", a: { id: "named-thing" }, c: "hi" });
    assert.strictEqual(bw._debug().registered, before,
      "create must not touch the registry");
  });

  it("created-then-abandoned node (with id) leaks nothing", function () {
    const before = bw._debug().registered;
    (function () { bw.create({ t: "div", a: { id: "abandoned" }, o: { state: {} } }); })();
    assert.strictEqual(bw._debug().registered, before);
  });

  it("mounted does NOT fire at create (no rAF path exists)", function (done) {
    const log = [];
    bw.create(makeSensorTaco({ log: log }));
    setTimeout(function () {
      assert.deepStrictEqual(log, [], "mounted fired without mount");
      done();
    }, 20);
  });

  it("primitives and null become text nodes; bw.raw becomes a fragment", function () {
    assert.strictEqual(bw.create("hello").nodeType, 3);
    assert.strictEqual(bw.create(null).nodeType, 3);
    assert.ok(bw.create(bw.raw("<b>hi</b><i>yo</i>")) instanceof DocumentFragment);
  });
});

// -------------------------------------------------------------------------
describe("01.2 hydrate — external DOM, idempotent (§1.1)", function () {
  it("wires lifecycle from taco.o onto existing DOM (Path S adoption step 2)", function () {
    app().innerHTML =
      '<div class="sensor_card"><div class="sc_label">CPU</div><div class="sc_value">—</div></div>';
    const el = app().firstElementChild;
    bw.hydrate(el, makeSensorTaco());
    assert.strictEqual(typeof el.bw.update, "function");
    el.bw.update({ value: 7 });
    assert.strictEqual(el.querySelector(".sc_value").textContent, "7");
  });

  it("is idempotent — re-hydrating is a no-op", function () {
    app().innerHTML = '<div class="sensor_card"><div class="sc_label"></div><div class="sc_value"></div></div>';
    const el = app().firstElementChild;
    bw.hydrate(el, makeSensorTaco());
    const firstUpdate = el.bw.update;
    bw.hydrate(el, makeSensorTaco());
    assert.strictEqual(el.bw.update, firstUpdate, "second hydrate must not rewire");
  });

  it("wires o.type from a function-free (wire/JSON) TACO", function () {
    app().innerHTML = "<div></div>";
    const el = app().firstElementChild;
    bw.hydrate(el, JSON.parse('{"t":"div","o":{"type":"gauge"}}'));
    assert.strictEqual(el._bw_type, "gauge");
    assert.ok(el.classList.contains("bw_is_component_gauge"));
  });
});

// -------------------------------------------------------------------------
describe("01.3 mountTree — registration + sync mounted, once (§1.1)", function () {
  it("registers uuid AND id at mount — and only at mount (invariant 3)", function () {
    const node = bw.create({ t: "div", a: { id: "dash" }, c: [makeSensorTaco()], o: { state: {} } });
    const before = bw._debug().registered;
    app().appendChild(node);
    bw.mountTree(node);
    // node uuid + node id + child component uuid = 3 new entries
    assert.strictEqual(bw._debug().registered, before + 3);
  });

  it("fires mounted synchronously, parent before children, exactly once", function () {
    const log = [];
    const parent = {
      t: "div", o: { state: { log: log }, type: "p",
        mounted: function () { log.push("mounted:parent"); } },
      c: [makeSensorTaco({ log: log, name: "child" })]
    };
    const node = bw.create(parent);
    app().appendChild(node);
    bw.mountTree(node);
    assert.deepStrictEqual(log, ["mounted:parent", "mounted:child"],
      "synchronous, parent-first");
  });

  it("is idempotent — re-walking an already-mounted tree is a silent no-op", function () {
    const log = [];
    const el = bw.mount(app(), makeSensorTaco({ log: log }));
    const diags = [];
    const stop = bw.sub("bw:diag", function (d) { diags.push(d.code); });
    bw.mountTree(el);
    stop();
    assert.deepStrictEqual(log.filter(x => x.indexOf("mounted") === 0).length, 1);
    assert.deepStrictEqual(diags, [], "idempotent re-walk warns about nothing");
  });

  it("manual composition works: create -> appendChild -> mountTree (escape hatch)", function () {
    const log = [];
    const node = bw.create(makeSensorTaco({ log: log }));
    app().appendChild(node);
    assert.deepStrictEqual(log, [], "raw appendChild alone must NOT fire mounted");
    bw.mountTree(node);
    assert.deepStrictEqual(log, ["mounted:x"]);
  });

  it("emits bw:mount (bubbling, {uuid,type}) and mirrors to bw:lifecycle", function () {
    const domEvents = [], pubEvents = [];
    document.body.addEventListener("bw:mount", function (e) { domEvents.push(e.detail); });
    const stop = bw.sub("bw:lifecycle", function (d) { pubEvents.push(d); });
    bw.mount(app(), makeSensorTaco());
    stop();
    assert.strictEqual(domEvents.length, 1);
    assert.strictEqual(domEvents[0].type, "sensor-card");
    assert.ok(/^bw_uuid_/.test(domEvents[0].uuid));
    assert.strictEqual(pubEvents.filter(d => d.event === "mount").length, 1);
  });

  it("registers plain pre-addressed nodes: UUID = addressability, o.* = component-ness", function () {
    const taco = { t: "span", c: "plain" };
    bw.assignUUID(taco);
    const el = bw.mount(app(), taco);
    assert.ok(!el.classList.contains("bw_lc"), "plain node is not a component");
    const uuid = bw.getUUID(el);
    assert.strictEqual(bw.el(uuid), el, "but it IS addressable");
  });
});

// -------------------------------------------------------------------------
describe("01.4 unmount — exact inverse, subtree becomes bw-inert (§1.1, inv 2)", function () {
  function mountedSensor(log) { return bw.mount(app(), makeSensorTaco({ log: log })); }

  it("fires unmount hooks self-first, then descendants in document order (F1)", function () {
    const log = [];
    const tree = {
      t: "div", o: { state: { log: log }, mounted: function () {},
        unmount: function () { log.push("unmount:outer"); } },
      c: [makeSensorTaco({ log: log, name: "inner" })]
    };
    const el = bw.mount(app(), tree);
    log.length = 0;
    bw.unmount(el);
    assert.deepStrictEqual(log, ["unmount:outer", "unmount:inner"]);
  });

  it("bw:unmount fires BEFORE properties are stripped (listener reads state)", function () {
    const seen = [];
    const el = mountedSensor();
    el.bw.update({ value: 99 });
    document.body.addEventListener("bw:unmount", function () {
      seen.push(el._bw_state ? el._bw_state.value : "ALREADY-STRIPPED");
    });
    bw.unmount(el);
    assert.deepStrictEqual(seen, [99]);
  });

  it("strips EVERYTHING: el.bw, _bw_state, _bw_type, marker classes, uuid token (F12)", function () {
    const el = mountedSensor();
    bw.unmount(el);
    assert.strictEqual(el.bw, undefined, "zombie handle");
    assert.strictEqual(el._bw_state, undefined);
    assert.strictEqual(el._bw_type, undefined);
    assert.ok(!el.classList.contains("bw_lc"));
    assert.ok(!el.classList.contains("bw_is_component"));
    assert.ok(!/bw_uuid_/.test(el.className), "uuid token must be stripped");
    assert.throws(function () { el.bw.update({ value: 1 }); }, TypeError);
  });

  it("deregisters every token in the subtree — uuid, id, plain or component (rev 11)", function () {
    const plain = { t: "span", c: "x" };
    bw.assignUUID(plain);
    const el = bw.mount(app(), {
      t: "div", a: { id: "outer-id" }, o: { state: {} },
      c: [makeSensorTaco(), plain]
    });
    const uuid = bw.getUUID(el);
    bw.unmount(el);
    assert.strictEqual(bw.el(uuid), null, "stale uuid resolves to nothing");
    assert.strictEqual(bw._debug().registered, 0, "registry fully clean");
  });

  it("calls every tied unsub — no ghost deliveries after unmount", function () {
    const calls = [];
    const el = mountedSensor();
    bw.sub("data:tick", function (d) { calls.push(d); }, el);
    bw.pub("data:tick", 1);
    bw.unmount(el);
    bw.pub("data:tick", 2);
    assert.deepStrictEqual(calls, [1]);
  });
});

// -------------------------------------------------------------------------
describe("01.5 unmountChildren — target survives intact (F8/F9)", function () {
  it("tears down children but preserves target state, subs, registration AND unmount hook", function () {
    const log = [];
    const target = bw.mount(app(), {
      t: "div",
      o: { state: { keep: true }, mounted: function () {},
           unmount: function () { log.push("target-unmount"); } },
      c: [makeSensorTaco({ log: log, name: "kid" })]
    });
    bw.sub("t:topic", function () { log.push("sub-alive"); }, target);
    log.length = 0;

    bw.unmountChildren(target);
    assert.deepStrictEqual(log, ["unmount:kid"], "only children torn down");
    assert.strictEqual(target._bw_state.keep, true);
    bw.pub("t:topic", null);
    assert.ok(log.indexOf("sub-alive") !== -1, "target subs survive (F9)");

    log.length = 0;
    bw.unmount(target);
    assert.ok(log.indexOf("target-unmount") !== -1,
      "the target's own unmount hook MUST still fire later (F8 regression)");
  });
});

// -------------------------------------------------------------------------
describe("01.6 detach — registered ⇔ live includes keep-alive (§1.1, inv 1)", function () {
  it("stays registered and reachable while disconnected; tied subs keep delivering", function () {
    const el = bw.mount(app(), makeSensorTaco());
    const uuid = bw.getUUID(el);
    bw.sub("sensors:x", function (d) { el.bw.update(d); }, el);

    bw.detach(el);
    assert.strictEqual(el.isConnected, false);
    assert.strictEqual(bw.el(uuid), el, "still addressable (invariant 1: live)");
    assert.strictEqual(bw._debug().detached, 1);

    bw.pub("sensors:x", { value: 5 });
    assert.strictEqual(el.querySelector(".sc_value").textContent, "5",
      "offscreen updates apply");
  });

  it("reinsert via plain appendChild: mounted does NOT re-fire; exemption clears", function () {
    const log = [];
    const el = bw.mount(app(), makeSensorTaco({ log: log }));
    bw.detach(el);
    app().appendChild(el);
    if (bw.janitor && bw.janitor.flush) bw.janitor.flush();
    assert.deepStrictEqual(log.filter(x => x === "mounted:x").length, 1,
      "once per identity");
    assert.strictEqual(bw._debug().detached, 0, "exemption cleared on reconnect (rev 9)");
  });
});
