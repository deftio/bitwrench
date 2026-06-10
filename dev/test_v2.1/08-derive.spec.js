/**
 * 2.1 Spec Tests — Package 08: bw.derive — declared dataflow
 * Contract: lifecycle spec §14 (full semantics list, rev 9)
 * RED BY DESIGN.
 */
import assert from "assert";
import bw from "../../src/bitwrench.js";
import { freshDOM, app, makeSensorTaco, collectDiag, flush, resetBWForTest } from "./_helpers.js";

beforeEach(freshDOM);
afterEach(function () { resetBWForTest(bw); });

function sum(a, b) { return a + b; }

describe("08.1 basics — recompute on input publish (§14)", function () {
  it("publishes computed output when any input fires (latest values cached)", function () {
    const out = [];
    const stopOut = bw.sub("calc:total", function (v) { out.push(v); });
    const stop = bw.derive(["calc:a", "calc:b"], sum, "calc:total");

    bw.pub("calc:a", 2);
    assert.deepStrictEqual(out, [], "wait-for-all: not ready with one input");
    bw.pub("calc:b", 3);
    assert.deepStrictEqual(out, [5]);
    bw.pub("calc:a", 10);                  // b cached from before
    assert.deepStrictEqual(out, [5, 13]);
    stop(); stopOut();
  });

  it("seed provides prior values: ready immediately; length validated", function () {
    const out = [];
    bw.sub("calc:t2", function (v) { out.push(v); });
    bw.derive(["calc:x", "calc:y"], sum, "calc:t2", { seed: [1, 1] });
    bw.pub("calc:x", 4);
    assert.deepStrictEqual(out, [5], "seeded y=1 used");
    assert.throws(function () {
      bw.derive(["a", "b"], sum, "t", { seed: [1] });
    }, TypeError, "seed length must match inputs");
  });

  it("immediate:true publishes once at creation when ready; default does not", function () {
    const out = [];
    bw.sub("calc:t3", function (v) { out.push(v); });
    bw.derive(["calc:p"], function (p) { return p * 2; }, "calc:t3", { seed: [21] });
    assert.deepStrictEqual(out, [], "creation is not an event by default");
    bw.derive(["calc:q"], function (q) { return q * 2; }, "calc:t4", { seed: [21], immediate: true });
    const got = [];
    bw.sub("calc:t4", function (v) { got.push(v); });
    // immediate publish happened at creation — late subscriber missed it by design
    // (pub/sub retains nothing); verify via a pre-registered subscriber instead:
    const pre = [];
    bw.sub("calc:t5", function (v) { pre.push(v); });
    bw.derive(["calc:r"], function (r) { return r + 1; }, "calc:t5", { seed: [9], immediate: true });
    assert.deepStrictEqual(pre, [10]);
  });

  it("derives chain", function () {
    const out = [];
    bw.sub("c:final", function (v) { out.push(v); });
    bw.derive(["c:a"], function (a) { return a * 2; }, "c:mid");
    bw.derive(["c:mid"], function (m) { return m + 1; }, "c:final");
    bw.pub("c:a", 5);
    assert.deepStrictEqual(out, [11]);
  });
});

describe("08.2 disposal — explicit AND lifecycle-tied (§14)", function () {
  it("the returned disposer stops recomputation", function () {
    const out = [];
    bw.sub("d:t", function (v) { out.push(v); });
    const stop = bw.derive(["d:a"], function (a) { return a; }, "d:t");
    bw.pub("d:a", 1);
    stop();
    bw.pub("d:a", 2);
    assert.deepStrictEqual(out, [1]);
  });

  it("opts.el ties the derive to a component: unmount disposes it", function () {
    const out = [];
    bw.sub("d:t2", function (v) { out.push(v); });
    const el = bw.mount(app(), makeSensorTaco());
    bw.derive(["d:in"], function (v) { return v; }, "d:t2", { el: el });
    bw.pub("d:in", 1);
    bw.unmount(el);
    bw.pub("d:in", 2);
    assert.deepStrictEqual(out, [1], "derive died with its component");
  });

  it("janitor-reaped tied element → derive stops (rude removal path)", function () {
    const out = [];
    bw.sub("d:t3", function (v) { out.push(v); });
    const el = bw.mount(app(), makeSensorTaco());
    bw.derive(["d:in3"], function (v) { return v; }, "d:t3", { el: el });
    el.remove();
    flush(bw);
    bw.pub("d:in3", 1);
    assert.deepStrictEqual(out, []);
  });
});

describe("08.3 errors + cycles (§14)", function () {
  it("fn throw → bw:diag derive_error; publisher unaffected; derive keeps working", function () {
    const out = [];
    bw.sub("e:t", function (v) { out.push(v); });
    bw.derive(["e:a"], function (a) {
      if (a < 0) throw new Error("negative");
      return a;
    }, "e:t");
    const { codes, stop } = collectDiag(bw);
    assert.doesNotThrow(function () { bw.pub("e:a", -1); }, "publisher never sees derive errors");
    stop();
    assert.ok(codes.indexOf("derive_error") !== -1);
    bw.pub("e:a", 7);
    assert.deepStrictEqual(out, [7], "recovers on next good input");
  });

  it("outTopic ∈ inputs warns derive_cycle at creation", function () {
    const { codes, stop } = collectDiag(bw);
    bw.derive(["loop:x"], function (x) { return x; }, "loop:x");
    stop();
    assert.ok(codes.indexOf("derive_cycle") !== -1);
  });
});
