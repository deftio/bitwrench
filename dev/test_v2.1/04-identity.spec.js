/**
 * 2.1 Spec Tests — Package 04: Identity — UUIDs, collisions, refs
 * Contract: lifecycle spec §3.2 (namespace ownership, honor/remint,
 * refs re-key, plain-node addressability, id policy)
 * RED BY DESIGN.
 */
import assert from "assert";
import bw from "../../src/bitwrench.js";
import { freshDOM, app, makeSensorTaco, collectDiag, flush, resetBWForTest } from "./_helpers.js";

beforeEach(freshDOM);
afterEach(function () { resetBWForTest(bw); });

describe("04.1 assignUUID — reservation, not invention (§3.2)", function () {
  it("generates and appends a bw_uuid_* token; idempotent unless forceNew", function () {
    const taco = { t: "div" };
    const u1 = bw.assignUUID(taco);
    assert.ok(/^bw_uuid_/.test(u1));
    assert.strictEqual(bw.assignUUID(taco), u1, "idempotent");
    const u2 = bw.assignUUID(taco, true);
    assert.notStrictEqual(u2, u1, "forceNew remints");
    assert.ok(taco.a.class.indexOf(u1) === -1, "old token removed on forceNew");
  });

  it("never accepts a caller-chosen string (only bw mints)", function () {
    const taco = { t: "div" };
    const u = bw.assignUUID(taco, "bw_uuid_myvanity");
    assert.notStrictEqual(u, "bw_uuid_myvanity");
  });
});

describe("04.2 honor + collision remint (§3.2)", function () {
  it("first mount wins the pre-assigned token, silently", function () {
    const taco = makeSensorTaco();
    const uuid = bw.assignUUID(taco);
    const { codes, stop } = collectDiag(bw);
    const el = bw.mount(app(), taco);
    stop();
    assert.strictEqual(bw.getUUID(el), uuid);
    assert.strictEqual(bw.el(uuid), el);
    assert.deepStrictEqual(codes, [], "honoring is silent");
  });

  it("TACO-as-template: second mount of the same token → fresh UUID + uuid_collision; original untouched (F2)", function () {
    const template = makeSensorTaco();
    const uuid = bw.assignUUID(template);
    const first = bw.append(app(), template);
    const { codes, stop } = collectDiag(bw);
    const second = bw.append(app(), template);     // same baked-in token
    stop();

    assert.ok(codes.indexOf("uuid_collision") !== -1);
    assert.strictEqual(bw.el(uuid), first, "original keeps the token");
    const u2 = bw.getUUID(second);
    assert.ok(u2 && u2 !== uuid, "clone reminted");
    assert.ok(second.className.indexOf(uuid) === -1, "never skip-with-class-intact");

    // F2 regression core: tearing down the clone's tree must not touch the original
    bw.remove(second);
    assert.strictEqual(bw.el(uuid), first, "original still registered");
    first.bw.update({ value: 1 });                  // and still alive
  });

  it("collision remint RE-KEYS the parent's _bw_refs (G5.5 catch)", function () {
    function makeComposite() {
      const childTaco = makeSensorTaco();
      const childUuid = bw.assignUUID(childTaco);
      return {
        taco: {
          t: "div",
          c: [childTaco],
          o: {
            state: { childUuid: childUuid },
            handle: {
              poke: function (el, v) {
                // canonical composition pattern: parent reaches child via refs
                const kid = el._bw_refs[Object.keys(el._bw_refs)[0]];
                kid.bw.update({ value: v });
                return kid;
              }
            }
          }
        },
        childUuid: childUuid
      };
    }
    const a = makeComposite();
    const elA = bw.append(app(), a.taco);
    const elB = bw.append(app(), a.taco);           // whole composite reused → child collides

    const kidB = elB.bw.poke(7);
    assert.ok(elB.contains(kidB), "B's ref resolves inside B, not to A's child");
    assert.strictEqual(kidB.querySelector(".sc_value").textContent, "7");
    assert.notStrictEqual(bw.getUUID(kidB), a.childUuid, "ref keyed by the FINAL identity");
    const originalKid = bw.el(a.childUuid);
    assert.ok(originalKid, "original token still resolves");
    assert.ok(elA.contains(originalKid), "original untouched");
    assert.ok(!elB.contains(originalKid), "collision remint prevents B from pointing at A");
  });
});

describe("04.2a create never mutates its input TACO (rev 14 side-effect rule)", function () {
  it("template created twice: deep-equal before/after, distinct uuids, zero diags", function () {
    const template = makeSensorTaco();
    const snapshot = JSON.stringify(template);
    const { codes, stop } = collectDiag(bw);
    const a = bw.append(app(), template);
    const b = bw.append(app(), template);
    stop();
    assert.strictEqual(JSON.stringify(template), snapshot,
      "create wrote into the shared template — TACO-as-template would self-collide");
    assert.notStrictEqual(bw.getUUID(a), bw.getUUID(b), "structural uuids live on elements");
    assert.deepStrictEqual(codes, [], "no collision path triggered by clean reuse");
  });
});

describe("04.3 ids are user-owned; registration is mount-to-unmount (§3.2, inv 3)", function () {
  it("bitwrench never writes an id attribute", function () {
    const el = bw.mount(app(), makeSensorTaco());
    assert.strictEqual(el.getAttribute("id"), null);
  });

  it("id registers at mount, resolves via bw.el, deregisters at unmount", function () {
    const el = bw.mount(app(), { t: "div", a: { id: "user-id" }, c: "x" });
    assert.strictEqual(bw.el("user-id"), el);
    bw.unmount(app());
    bw.mount(app(), null);
    assert.strictEqual(bw._debug().registered, 0);
  });
});

describe("04.4 plain-node addressability (§3.2: UUID = addressability, o.* = component-ness)", function () {
  it("plain pre-addressed node: registered, patchable, never a component", function () {
    const taco = { t: "span", c: "v0" };
    const uuid = bw.assignUUID(taco);
    const el = bw.mount(app(), taco);
    assert.ok(!el.classList.contains("bw_lc"));
    assert.strictEqual(el.bw, undefined);
    bw.patch(uuid, "v1");
    assert.strictEqual(el.textContent, "v1");
  });

  it("unmount strips plain-node tokens too — subtree is bw-inert (rev 11)", function () {
    const plain = { t: "span", c: "p" };
    bw.assignUUID(plain);
    const wrap = bw.mount(app(), { t: "div", o: { state: {} }, c: [plain] });
    const uuid = bw.getUUID(wrap.firstElementChild);
    bw.unmount(wrap);
    assert.strictEqual(bw.el(uuid), null);
    assert.ok(!/bw_uuid_/.test(wrap.firstElementChild.className));
  });
});

describe("04.4a bw.el resolution order — pinned, it was load-bearing and undefined (§2.3)", function () {
  it("id beats selector for ambiguous bare words: an element with id='div' wins over <div>s", function () {
    bw.mount(app(), [
      { t: "div", c: "i am a tag match" },
      { t: "span", a: { id: "div" }, c: "i am the id match" }
    ]);
    assert.strictEqual(bw.el("div").tagName, "SPAN", "registry/getElementById before querySelector");
  });

  it("an unregistered bw_uuid_* token resolves to NULL — never a stale querySelector resurrection", function () {
    const el = bw.mount(app(), makeSensorTaco());
    const uuid = bw.getUUID(el);
    bw.unmount(el);                                   // strips token + deregisters
    el.className = "sensor_card " + uuid;             // adversarial: hand-restore the token
    assert.strictEqual(bw.el(uuid), null,
      "uuid strings are registry-only; the selector fallback must not resurrect the dead");
  });

  it("CSS selectors still work as the last step", function () {
    const el = bw.mount(app(), makeSensorTaco());
    assert.strictEqual(bw.el(".sensor_card"), el);
  });
});

describe("04.5 reparenting & identity persistence (§3.2)", function () {
  it("appendChild move keeps identity, registration; mounted does not re-fire", function () {
    const log = [];
    const el = bw.mount(app(), makeSensorTaco({ log: log }));
    const uuid = bw.getUUID(el);
    const aside = document.createElement("section");
    document.body.appendChild(aside);
    aside.appendChild(el);
    flush(bw);
    assert.strictEqual(bw.el(uuid), el);
    assert.strictEqual(log.filter(s => s === "mounted:x").length, 1);
  });
});
