/**
 * 2.1 Spec Tests — Package 02: Live Operations
 * Contract: lifecycle spec §1.2 (compounds), §3 (tiers, decisions, errors)
 * RED BY DESIGN until the 2.1 engine exists.
 */
import assert from "assert";
import bw from "../../src/bitwrench.js";
import { freshDOM, app, makeSensorTaco, collectDiag, resetBWForTest } from "./_helpers.js";

beforeEach(freshDOM);
afterEach(function () { resetBWForTest(bw); });

describe("02.0 THE rule, mechanically enforced — compounds are compositions of atomics (§1.0a)", function () {
  function spyOn(names) {
    const calls = [];
    const originals = {};
    names.forEach(function (n) {
      originals[n] = bw[n];
      bw[n] = function () { calls.push(n); return originals[n].apply(bw, arguments); };
    });
    return { calls: calls, restore: function () {
      names.forEach(function (n) { bw[n] = originals[n]; });
    } };
  }

  it("mount = unmountChildren → create → mountTree (no private teardown paths)", function () {
    bw.mount(app(), { t: "p", c: "old" });                  // give it children to tear down
    const spy = spyOn(["unmountChildren", "create", "mountTree"]);
    bw.mount(app(), makeSensorTaco());
    spy.restore();
    assert.deepStrictEqual(spy.calls, ["unmountChildren", "create", "mountTree"],
      "an implementation that inlines its own logic goes red here even if the DOM looks right");
  });

  it("replace = unmount(old) → create → mountTree; remove = unmount only", function () {
    const el = bw.mount(app(), makeSensorTaco());
    let spy = spyOn(["unmount", "create", "mountTree"]);
    const neo = bw.replace(el, { t: "div", o: { state: {} } });
    spy.restore();
    assert.deepStrictEqual(spy.calls, ["unmount", "create", "mountTree"]);

    spy = spyOn(["unmount", "unmountChildren"]);
    bw.remove(neo);
    spy.restore();
    assert.deepStrictEqual(spy.calls, ["unmount"], "remove never reaches for child-only teardown");
  });

  it("patch with TACO content routes through the atomics too (GAP-3 by construction)", function () {
    bw.mount(app(), { t: "div", a: { id: "host" }, c: [makeSensorTaco()] });
    const spy = spyOn(["unmountChildren", "create", "mountTree"]);
    bw.patch("host", makeSensorTaco());
    spy.restore();
    assert.deepStrictEqual(spy.calls, ["unmountChildren", "create", "mountTree"],
      "a mini-cleanup inside patch is the 2.0.x disease returning");
  });
});

describe("02.1 mount/DOM — return contract + target preservation (§1.2)", function () {
  it("single-root content returns that element", function () {
    const el = bw.mount(app(), makeSensorTaco());
    assert.ok(el.classList.contains("sensor_card"));
    assert.strictEqual(typeof el.bw.update, "function");
  });

  it("array content returns the FIRST inserted node (documented non-handle path)", function () {
    const el = bw.mount(app(), [{ t: "h1", c: "a" }, { t: "p", c: "b" }]);
    assert.strictEqual(el.tagName, "H1");
    assert.strictEqual(app().children.length, 2);
  });

  it("null content returns null and empties the target", function () {
    bw.mount(app(), makeSensorTaco());
    assert.strictEqual(bw.mount(app(), null), null);
    assert.strictEqual(app().children.length, 0);
  });

  it("re-mount preserves the target's own state, subs, AND unmount hook (F8/F9)", function () {
    const log = [];
    // make #app itself a component by mounting a wrapper, then re-render into it
    const target = bw.mount(app(), {
      t: "div", o: { state: { keep: 1 }, mounted: function () {},
        unmount: function () { log.push("target-unmount"); } },
      c: [{ t: "p", c: "old" }]
    });
    bw.sub("k:topic", function () { log.push("sub"); }, target);

    bw.mount(target, { t: "p", c: "new" });          // re-render children
    assert.strictEqual(target._bw_state.keep, 1, "state survives re-mount");
    bw.pub("k:topic", null);
    assert.ok(log.indexOf("sub") !== -1, "subs survive re-mount (F9)");
    assert.ok(log.indexOf("target-unmount") === -1, "unmount hook did NOT fire on re-mount");

    bw.unmount(target);
    assert.ok(log.indexOf("target-unmount") !== -1, "hook still armed afterward (F8)");
  });

  it("old children are unmounted on re-mount (hooks fire)", function () {
    const log = [];
    bw.mount(app(), makeSensorTaco({ log: log, name: "old" }));
    bw.mount(app(), { t: "p", c: "new" });
    assert.ok(log.indexOf("unmount:old") !== -1);
  });
});

describe("02.2 append — full pipeline, positioning (§1.2)", function () {
  it("appends without touching existing children; mounted fires; returns the child", function () {
    const log = [];
    bw.mount(app(), { t: "p", c: "keep-me" });
    const first = app().firstElementChild;
    const child = bw.append(app(), makeSensorTaco({ log: log }));
    assert.strictEqual(app().firstElementChild, first, "existing child untouched");
    assert.deepStrictEqual(log, ["mounted:x"], "append runs the mount walk");
    assert.ok(child.classList.contains("sensor_card"));
  });

  it("{before: element} and {before: index} position the insert", function () {
    bw.mount(app(), [{ t: "i", c: "1" }, { t: "i", c: "3" }]);
    bw.append(app(), { t: "i", c: "2" }, { before: app().children[1] });
    bw.append(app(), { t: "i", c: "0" }, { before: 0 });
    const text = Array.prototype.map.call(app().children, c => c.textContent).join("");
    assert.strictEqual(text, "0123");
  });
});

describe("02.3 replace — identity dies and is reborn (§1.2)", function () {
  it("returns the new element; old is unmounted; DOM position preserved", function () {
    const log = [];
    bw.mount(app(), [{ t: "p", c: "before" }, makeSensorTaco({ log: log, name: "old" }), { t: "p", c: "after" }]);
    const old = app().querySelector(".sensor_card");
    const neo = bw.replace(old, { t: "div", a: { class: "fresh" }, o: { state: {} } });
    assert.ok(neo.classList.contains("fresh"));
    assert.strictEqual(app().children[1], neo, "same position among siblings");
    assert.ok(log.indexOf("unmount:old") !== -1, "old element's hooks fired");
    assert.strictEqual(old.isConnected, false);
  });

  it("replace(ref, null) behaves as remove and returns null", function () {
    const el = bw.mount(app(), makeSensorTaco());
    assert.strictEqual(bw.replace(el, null), null);
    assert.strictEqual(app().children.length, 0);
    assert.strictEqual(bw._debug().registered, 0);
  });
});

describe("02.4 remove (§1.2)", function () {
  it("unmounts then detaches; silent on unknown ref", function () {
    const log = [];
    const el = bw.mount(app(), makeSensorTaco({ log: log, name: "z" }));
    bw.remove(el);
    assert.ok(log.indexOf("unmount:z") !== -1);
    assert.strictEqual(el.isConnected, false);
    assert.doesNotThrow(function () { bw.remove("#no-such-thing"); });
  });
});

describe("02.5 refresh — the honest heavy path (§1.2, §3)", function () {
  function renderable(log) {
    return {
      t: "div",
      o: {
        state: { n: 1, log: log },
        render: function (el, state) {
          bw.mount(el, [{ t: "span", a: { class: "n" }, c: String(state.n) },
                        makeSensorTaco({ log: state.log, name: "kid" })]);
        }
      }
    };
  }

  it("unmounts old children first, rebuilds from o.render, fires bw:refresh", function () {
    const log = [];
    const el = bw.mount(app(), renderable(log));      // auto-render-as-mounted
    el._bw_state.n = 2;
    log.length = 0;
    const refreshed = [];
    document.body.addEventListener("bw:refresh", function (e) { refreshed.push(e.detail.uuid); });
    bw.refresh(el);
    assert.ok(log.indexOf("unmount:kid") !== -1, "old children's hooks fired");
    assert.ok(log.indexOf("mounted:kid") !== -1, "new children mounted");
    assert.strictEqual(el.querySelector(".n").textContent, "2");
    assert.strictEqual(refreshed.length, 1);
  });

  it("render throw PROPAGATES; component stays alive and recoverable (§3 error policy)", function () {
    const el = bw.mount(app(), {
      t: "div",
      o: { state: { boom: false },
        render: function (el2, s) {
          if (s.boom) throw new Error("render-fail");
          bw.mount(el2, { t: "p", c: "ok" });
        } }
    });
    el._bw_state.boom = true;
    assert.throws(function () { bw.refresh(el); }, /render-fail/);
    assert.strictEqual(el.children.length, 0, "children empty — honest failure state");
    assert.ok(bw.el(bw.getUUID(el)), "component still registered");
    el._bw_state.boom = false;
    bw.refresh(el);
    assert.strictEqual(el.querySelector("p").textContent, "ok", "recoverable");
  });
});

describe("02.6 update — dispatch or warn, NEVER refresh (§3, invariant 4)", function () {
  it("dispatches to el.bw.update and emits bw:statechange", function () {
    const el = bw.mount(app(), makeSensorTaco());
    const events = [];
    const stop = bw.sub("bw:lifecycle", function (d) { events.push(d.event); });
    bw.update(el, { value: 9 });
    stop();
    assert.strictEqual(el.querySelector(".sc_value").textContent, "9");
    assert.ok(events.indexOf("statechange") !== -1);
  });

  it("warns update_use_refresh on a render-only component — and does NOT rebuild", function () {
    const el = bw.mount(app(), {
      t: "div", o: { state: {}, render: function (e) { bw.mount(e, { t: "p", c: "v1" }); } }
    });
    const kid = el.firstElementChild;
    const { codes, stop } = collectDiag(bw);
    bw.update(el, { anything: 1 });
    stop();
    assert.deepStrictEqual(codes, ["update_use_refresh"]);
    assert.strictEqual(el.firstElementChild, kid, "children untouched — no silent refresh");
  });

  it("warns update_no_handle when there is neither", function () {
    const el = bw.mount(app(), { t: "div", o: { state: {} } });
    const { codes, stop } = collectDiag(bw);
    bw.update(el, { x: 1 });
    stop();
    assert.deepStrictEqual(codes, ["update_no_handle"]);
  });

  it("direct el.bw.update emits NO statechange (author methods own their events)", function () {
    const el = bw.mount(app(), makeSensorTaco());
    const events = [];
    const stop = bw.sub("bw:lifecycle", function (d) { events.push(d.event); });
    el.bw.update({ value: 3 });
    stop();
    assert.strictEqual(events.indexOf("statechange"), -1);
  });
});

describe("02.7 patch + slot setters — full pipeline for content (§3, GAP-3/4)", function () {
  it("string sets text; object sets attributes", function () {
    const el = bw.mount(app(), { t: "p", a: { id: "tgt" }, c: "old" });
    bw.patch("tgt", "new");
    assert.strictEqual(el.textContent, "new");
    bw.patch("tgt", { "aria-busy": "true" });
    assert.strictEqual(el.getAttribute("aria-busy"), "true");
  });

  it("TACO content: old children unmounted, new children mounted (GAP-3)", function () {
    const log = [];
    const host = bw.mount(app(), { t: "div", a: { id: "host" }, c: [makeSensorTaco({ log: log, name: "old" })] });
    bw.patch("host", makeSensorTaco({ log: log, name: "new" }));
    assert.ok(log.indexOf("unmount:old") !== -1, "GAP-3: old hooks fire");
    assert.ok(log.indexOf("mounted:new") !== -1, "new content mounted");
    assert.ok(host.querySelector(".sensor_card"));
  });

  it("array content replaces through mount pipeline, not innerHTML", function () {
    const log = [];
    const host = bw.mount(app(), { t: "div", a: { id: "host" },
      c: [makeSensorTaco({ log: log, name: "old" })] });
    bw.patch("host", [
      { t: "strong", c: "a" },
      makeSensorTaco({ log: log, name: "new" })
    ]);
    assert.ok(log.indexOf("unmount:old") !== -1, "old tree fully inverted");
    assert.ok(log.indexOf("mounted:new") !== -1, "new array child mounted");
    assert.strictEqual(host.children.length, 2);
  });

  it("slot setter with TACO content runs the same pipeline (GAP-4)", function () {
    const log = [];
    const card = bw.mount(app(), {
      t: "div", c: [{ t: "div", a: { class: "body" } }],
      o: { state: {}, slots: { body: ".body" } }
    });
    card.bw.setBody(makeSensorTaco({ log: log, name: "slotted" }));
    assert.ok(log.indexOf("mounted:slotted") !== -1);
    card.bw.setBody("plain text");
    assert.ok(log.indexOf("unmount:slotted") !== -1, "GAP-4: slot replacement unmounts");
  });

  it("slot targets re-resolve after refresh — never the corpse (rev 13 slot binding rule)", function () {
    const el = bw.mount(app(), {
      t: "div",
      o: {
        state: { n: 1 },
        render: function (e, s) { bw.mount(e, { t: "span", a: { class: "n" }, c: String(s.n) }); },
        slots: { n: ".n" },
        handle: { stash: function (e, n) { e._bw_state.n = n; } } // author-surface state set
      }
    });
    el.bw.setN("5");                       // lazy resolve: .n exists only post-render
    assert.strictEqual(el.querySelector(".n").textContent, "5");
    const oldNode = el.querySelector(".n");
    el.bw.stash(6);
    bw.refresh(el);                         // rebuild destroys the cached target
    el.bw.setN("7");
    const newNode = el.querySelector(".n");
    assert.notStrictEqual(newNode, oldNode, "refresh rebuilt the child");
    assert.strictEqual(newNode.textContent, "7", "setter re-resolved to the NEW node");
    assert.strictEqual(oldNode.textContent === "7", false, "corpse untouched");
  });

  it("updateSlot(ref, name, value) uses the same leak-safe slot pipeline", function () {
    const log = [];
    const card = bw.mount(app(), {
      t: "div", a: { id: "card" }, c: [{ t: "div", a: { class: "body" } }],
      o: { state: {}, slots: { body: ".body" } }
    });
    bw.updateSlot("#card", "body", makeSensorTaco({ log: log, name: "remote-slot" }));
    assert.ok(card.querySelector(".sensor_card"));
    assert.ok(log.indexOf("mounted:remote-slot") !== -1);
    bw.updateSlot("#card", "body", "done");
    assert.ok(log.indexOf("unmount:remote-slot") !== -1,
      "slot replacement must not leak prior child lifecycle");
  });
});

describe("02.8 message + error policy + state surface (§3)", function () {
  it("message dispatches by selector/uuid; false for unknown target or action", function () {
    const el = bw.mount(app(), makeSensorTaco());
    assert.strictEqual(bw.message(".sensor_card", "update", { value: 4 }), true);
    assert.strictEqual(el.querySelector(".sc_value").textContent, "4");
    assert.strictEqual(bw.message(".sensor_card", "nope", 1), false);
    assert.strictEqual(bw.message("#ghost", "update", 1), false);
  });

  it("mounted hook throw: warned (mounted_hook_error), walk continues to siblings", function () {
    const log = [];
    const { codes, stop } = collectDiag(bw);
    bw.mount(app(), [
      { t: "div", o: { state: {}, mounted: function () { throw new Error("bad hook"); } } },
      makeSensorTaco({ log: log })
    ]);
    stop();
    assert.ok(codes.indexOf("mounted_hook_error") !== -1);
    assert.deepStrictEqual(log, ["mounted:x"], "sibling still mounted");
  });

  it("handle method throw PROPAGATES to the caller", function () {
    const el = bw.mount(app(), {
      t: "div", o: { state: {}, handle: { boom: function () { throw new Error("from-handle"); } } }
    });
    assert.throws(function () { el.bw.boom(); }, /from-handle/);
  });

  it("bw.on returns off() — long-lived listeners are removable (rev 14 leak fix)", function () {
    const hits = [];
    const off = bw.on(document.body, "ping", function (d) { hits.push(d); });
    const el = bw.mount(app(), { t: "div", o: { state: {} } });
    bw.emit(el, "ping", 1);
    off();
    bw.emit(el, "ping", 2);
    assert.deepStrictEqual(hits, [1], "2.0.x bw.on had no removal path at all");
  });

  it("getState returns a shallow copy; mutating it does not affect the component", function () {
    const el = bw.mount(app(), makeSensorTaco());
    el.bw.update({ value: 7 });
    const snap = el.bw.getState();
    snap.value = 999;
    assert.strictEqual(el._bw_state.value, 7);
  });

  it("self-consistency invariant: after tier-1/2 ops, state matches displayed DOM", function () {
    const el = bw.mount(app(), makeSensorTaco());
    el.bw.update({ value: 42 });
    assert.strictEqual(String(el._bw_state.value), el.querySelector(".sc_value").textContent);
  });
});
