/**
 * 2.1 Spec Tests — Package 04b: LIFECYCLE HARDENING (Phase 1, gated with 01–04)
 *
 * The cases technical auditors poke first: reentrancy (hooks that mutate
 * the tree mid-walk), failure-path arming (components that die half-born),
 * orphaned keep-alives, and graceful no-ops. Per Manu: the lifecycle is
 * the product — everything else piggybacks. These tests exist so "clean"
 * is a measured property, not an adjective.
 *
 * Contract: lifecycle spec §1.1, §2 invariants, §2.1, §3 error policy.
 * RED BY DESIGN.
 */
import assert from "assert";
import bw from "../../src/bitwrench.js";
import { freshDOM, app, makeSensorTaco, collectDiag, flush, resetBWForTest } from "./_helpers.js";

beforeEach(freshDOM);
afterEach(function () { resetBWForTest(bw); });

describe("04b.1 reentrancy — hooks that mutate the tree mid-walk", function () {
  it("a mounted hook may bw.append into its own subtree: child mounts once, parent once, no loop", function () {
    const log = [];
    const el = bw.mount(app(), {
      t: "div",
      o: {
        state: { log: log },
        mounted: function (self, state) {
          state.log.push("mounted:parent");
          bw.append(self, makeSensorTaco({ log: state.log, name: "late-child" }));
        }
      }
    });
    assert.deepStrictEqual(log, ["mounted:parent", "mounted:late-child"],
      "nested mountTree during a mounted hook is safe and exactly-once");
    assert.ok(el.querySelector(".sensor_card"));
    // idempotence holds across the reentrant walk too:
    bw.mountTree(el);
    assert.strictEqual(log.filter(s => s.indexOf("mounted") === 0).length, 2);
  });

  it("an unmount hook may bw.remove a SIBLING: both tear down cleanly, every hook exactly once", function () {
    const log = [];
    const a = bw.mount(app(), {
      t: "div",
      o: { state: {}, mounted: function () {},
        unmount: function () {
          log.push("unmount:a");
          bw.remove("#sib-b");          // reentrant teardown of a sibling
        } }
    });
    bw.append(app(), {
      t: "div", a: { id: "sib-b" },
      o: { state: {}, mounted: function () {},
        unmount: function () { log.push("unmount:b"); } }
    });
    bw.remove(a);
    assert.deepStrictEqual(log.sort(), ["unmount:a", "unmount:b"]);
    assert.strictEqual(bw._debug().registered, 0, "no half-torn registrations");
  });

  it("a handle method may bw.refresh its OWN component (self-refresh, no recursion blowup)", function () {
    const el = bw.mount(app(), {
      t: "div",
      o: {
        state: { n: 1 },
        render: function (self, s) { bw.mount(self, { t: "b", a: { class: "n" }, c: String(s.n) }); },
        handle: {
          bump: function (self) { self._bw_state.n++; bw.refresh(self); }
        }
      }
    });
    el.bw.bump();
    el.bw.bump();
    assert.strictEqual(el.querySelector(".n").textContent, "3");
    assert.strictEqual(el.querySelectorAll(".n").length, 1, "no duplicated children");
  });

  it("an unmount hook may MOUNT elsewhere: teardown completes, the new component is alive", function () {
    const log = [];
    document.body.appendChild(document.createElement("aside")).id = "graveyard-note";
    const el = bw.mount(app(), {
      t: "div",
      o: { state: {}, mounted: function () {},
        unmount: function () {
          bw.mount("#graveyard-note", makeSensorTaco({ log: log, name: "epitaph" }));
        } }
    });
    bw.remove(el);
    assert.deepStrictEqual(log, ["mounted:epitaph"], "mount-during-unmount is legal");
    assert.ok(document.querySelector("#graveyard-note .sensor_card").isConnected);
  });
});

describe("04b.2 failure-path arming — components that die half-born (§3 error policy)", function () {
  it("a component whose mounted hook THROWS still has its unmount hook armed", function () {
    const log = [];
    const { codes, stop } = collectDiag(bw);
    const el = bw.mount(app(), {
      t: "div",
      o: { state: {},
        mounted: function () { throw new Error("half-born"); },
        unmount: function () { log.push("unmount:half-born"); } }
    });
    stop();
    assert.ok(codes.indexOf("mounted_hook_error") !== -1);
    assert.ok(bw.el(bw.getUUID(el)), "failed-mount component is still registered (it IS in the DOM)");
    bw.unmount(el);
    assert.deepStrictEqual(log, ["unmount:half-born"],
      "a throwing mounted must not disarm teardown — that's how timers leak");
  });

  it("a throwing UNMOUNT hook doesn't abort the walk OR leave residue", function () {
    const log = [];
    const wrap = bw.mount(app(), { t: "div", o: { state: {} }, c: [
      { t: "div", o: { state: {}, mounted: function () {},
        unmount: function () { throw new Error("bad goodbye"); } } },
      makeSensorTaco({ log: log, name: "innocent" })
    ]});
    const { codes, stop } = collectDiag(bw);
    bw.unmount(wrap);
    stop();
    assert.ok(codes.indexOf("unmount_hook_error") !== -1);
    assert.ok(log.indexOf("unmount:innocent") !== -1, "siblings still torn down");
    assert.strictEqual(bw._debug().registered, 0, "thrower's registration cleaned anyway");
  });
});

describe("04b.3 orphaned keep-alives + graceful no-ops (inv 1, inv 2)", function () {
  it("a detached child survives its former parent's unmount — caller-owned, by design", function () {
    const wrap = bw.mount(app(), { t: "div", o: { state: {} }, c: [makeSensorTaco()] });
    const child = wrap.querySelector(".sensor_card");
    const childUuid = bw.getUUID(child);
    bw.detach(child);                       // child leaves the subtree, stays live
    bw.unmount(wrap);                       // parent's walk must NOT reach the detached child
    assert.strictEqual(bw.el(childUuid), child, "detached child still registered (live)");
    child.bw.update({ value: 1 });          // and still functional
    bw.remove(child);                       // explicit cleanup is the caller's duty
    assert.strictEqual(bw._debug().registered, 0);
    assert.strictEqual(bw._debug().detached, 0);
  });

  it("unmount is graceful on: a plain non-bw element, an empty component, and a DOUBLE unmount", function () {
    const plain = document.createElement("div");
    app().appendChild(plain);
    assert.doesNotThrow(function () { bw.unmount(plain); });

    const log = [];
    const el = bw.mount(app(), {
      t: "div", o: { state: {}, mounted: function () {},
        unmount: function () { log.push("once"); } }
    });
    bw.unmount(el);
    assert.doesNotThrow(function () { bw.unmount(el); }, "second unmount is a no-op");
    assert.deepStrictEqual(log, ["once"], "hooks NEVER double-fire (exact inverse, applied once)");
    assert.doesNotThrow(function () { bw.unmountChildren(el); });
  });

  it("4-level order pinned exactly: mounted parent→leaf, unmount self-first then document order", function () {
    const log = [];
    function level(name, child) {
      return { t: "div", o: { state: {},
        mounted: function () { log.push("m:" + name); },
        unmount: function () { log.push("u:" + name); } },
        c: child ? [child] : [] };
    }
    const el = bw.mount(app(), level("1", level("2", level("3", level("4")))));
    assert.deepStrictEqual(log, ["m:1", "m:2", "m:3", "m:4"], "mounted: parent before children, all levels");
    log.length = 0;
    bw.unmount(el);
    assert.deepStrictEqual(log, ["u:1", "u:2", "u:3", "u:4"],
      "unmount: self first, then descendants in document order — a composite reads its children during its own goodbye");
  });

  it("the full life story leaves the world exactly as it found it (invariant 2, end to end)", function () {
    const before = JSON.stringify(bw._debug());
    const el = bw.mount(app(), makeSensorTaco());
    bw.sub("story:t", function () {}, el);
    el.bw.update({ value: 42 });
    bw.detach(el);
    app().appendChild(el);
    flush(bw);
    el.bw.setLabel("CPU");
    bw.remove(el);
    flush(bw);
    assert.strictEqual(JSON.stringify(bw._debug()), before,
      "define→create→mount→live→detach→reinsert→remove: zero residue, the exact inverse, the whole point");
  });
});
