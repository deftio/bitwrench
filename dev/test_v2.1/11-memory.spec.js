/**
 * 2.1 Spec Tests — Package 11: Memory — retention accounting + real GC
 * Contract: lifecycle spec §2.1 layer 3, §10 test-infra (bw._debug),
 * §14 derive disposal, invariant 2 (unmount = exact inverse).
 * RED BY DESIGN.
 *
 * 11.2 needs real GC:  node --expose-gc ./node_modules/.bin/mocha dev/test_v2.1/11-memory.spec.js
 * Without --expose-gc those cases self-skip (accounting cases still run).
 */
import assert from "assert";
import bw from "../../src/bitwrench.js";
import { freshDOM, app, makeSensorTaco, flush, resetBWForTest } from "./_helpers.js";

beforeEach(freshDOM);
afterEach(function () { resetBWForTest(bw); });

const hasGC = typeof global.gc === "function";
const gcit = hasGC ? it : it.skip;

describe("11.1 deterministic retention accounting (no GC needed)", function () {
  it("50 components mounted then container unmounted → every counter at zero", function () {
    const tacos = [];
    for (let i = 0; i < 50; i++) tacos.push(makeSensorTaco());
    const wrap = bw.mount(app(), { t: "div", o: { state: {} }, c: tacos });
    tacos.forEach(function (_, i) {
      bw.sub("m:topic" + i, function () {}, wrap.children[i]);
    });
    assert.ok(bw._debug().registered >= 51);
    assert.ok(bw._debug().topics >= 50);

    bw.unmount(wrap);
    const d = bw._debug();
    assert.strictEqual(d.registered, 0, "registry");
    assert.strictEqual(d.detached, 0, "detach set");
    assert.strictEqual(d.topics, 0, "tied subscriptions all released");
  });

  it("rude wipe + flush reaches the same zero (graceful and rude converge)", function () {
    for (let i = 0; i < 20; i++) bw.append(app(), makeSensorTaco());
    app().innerHTML = "";
    flush(bw);
    const d = bw._debug();
    assert.strictEqual(d.registered, 0);
    assert.strictEqual(d.janitorPending, 0);
  });

  it("100 htmlPage renders leave zero engine state (Path S purity at volume)", function () {
    const before = JSON.stringify(bw._debug());
    for (let i = 0; i < 100; i++) {
      bw.htmlPage({ body: { t: "div", c: [
        { t: "button", a: { onclick: function () {} }, c: "b" + i },
        makeSensorTaco()
      ] } });
    }
    assert.strictEqual(JSON.stringify(bw._debug()), before,
      "string rendering must never grow runtime state (the 2.0.x funcRegistry disease)");
  });

  it("derive dispose returns the topic count to baseline (no dataflow residue)", function () {
    const before = bw._debug().topics;
    const stops = [];
    for (let i = 0; i < 10; i++) {
      stops.push(bw.derive(["mm:in" + i], function (v) { return v; }, "mm:out" + i));
    }
    assert.ok(bw._debug().topics > before);
    stops.forEach(function (s) { s(); });
    assert.strictEqual(bw._debug().topics, before, "disposed derives leave nothing");
  });

  it("detach-and-never-reinsert is caller-owned but VISIBLE (countable, not invisible)", function () {
    const el = bw.mount(app(), makeSensorTaco());
    bw.detach(el);
    assert.strictEqual(bw._debug().detached, 1,
      "intentional keep-alives must be auditable via _debug, not a hidden cost");
    bw.remove(el);
    assert.strictEqual(bw._debug().detached, 0);
  });
});

describe("11.2 GC SMOKE tests (§2.1 L3) @gc — `collected > 0` is a tripwire, not the guarantee", function () {
  // Honest framing (proof-pass catch): GC is nondeterministic, so these prove
  // "not totally pinned," which is weaker than invariant 2's "nothing
  // bitwrench retains pins a dead subtree." The STRONG guarantee lives in the
  // deterministic counter tests above (11.1) plus invariant-2's
  // exact-inverse property tests in package 01 — this section exists to catch
  // a gross regression (e.g., a reintroduced global Map) cheaply.
  gcit("rude-removed components are collectible after flush (engine holds no strong refs)", function (done) {
    this.timeout(5000);
    const reg = new FinalizationRegistry(function () { collected++; });
    let collected = 0;

    (function makeAndKill() {
      for (let i = 0; i < 20; i++) {
        const el = bw.append(app(), makeSensorTaco());
        bw.sub("gc:t" + i, function () {}, el);
        reg.register(el, i);
      }
      app().innerHTML = "";          // rude
      flush(bw);
    })();                             // closure scope ends — no test refs remain

    let tries = 0;
    (function waitForGC() {
      global.gc();
      setTimeout(function () {
        if (collected > 0) return done();
        if (++tries > 20) return done(new Error(
          "0 of 20 reaped components collected — something in bw retains them"));
        waitForGC();
      }, 50);
    })();
  });

  gcit("unmounted-then-dropped components are collectible (graceful path, same guarantee)", function (done) {
    this.timeout(5000);
    const reg = new FinalizationRegistry(function () { collected++; });
    let collected = 0;

    (function makeAndUnmount() {
      const el = bw.mount(app(), makeSensorTaco());
      bw.derive(["gcd:in"], function (v) { return v; }, "gcd:out", { el: el });
      reg.register(el, "el");
      bw.remove(el);
    })();

    let tries = 0;
    (function waitForGC() {
      global.gc();
      setTimeout(function () {
        if (collected > 0) return done();
        if (++tries > 20) return done(new Error("unmounted component still pinned"));
        waitForGC();
      }, 50);
    })();
  });
});
