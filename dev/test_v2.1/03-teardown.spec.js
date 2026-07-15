/**
 * 2.1 Spec Tests — Package 03: Ungraceful Teardown — janitor + liveness
 * Contract: lifecycle spec §2.1 (three layers, matrix, trigger model)
 * RED BY DESIGN. Timing cases tagged @browser (authoritative in
 * karma/playwright; jsdom implements MutationObserver and runs them too).
 */
import assert from "assert";
import bw from "../../src/bitwrench.js";
import { freshDOM, app, makeSensorTaco, collectDiag, flush, resetBWForTest } from "./_helpers.js";

beforeEach(freshDOM);
afterEach(function () { resetBWForTest(bw); });

function mountSensor(log, name) {
  return bw.mount(app(), makeSensorTaco({ log: log, name: name || "x" }));
}

describe("03.1 janitor — the matrix (§2.1 layer 2)", function () {
  it("raw el.remove() → flush → full unmount: hooks, registry, subs, diag janitor_reap", function () {
    const log = [], calls = [];
    const el = mountSensor(log, "victim");
    bw.sub("t:tick", function (d) { calls.push(d); }, el);
    const { codes, stop } = collectDiag(bw);

    el.remove();                       // rude
    flush(bw);
    stop();

    assert.ok(log.indexOf("unmount:victim") !== -1, "hooks fire late, not never");
    assert.strictEqual(bw._debug().registered, 0);
    assert.ok(codes.indexOf("janitor_reap") !== -1);
    bw.pub("t:tick", 1);
    assert.deepStrictEqual(calls, [], "tied subs released");
  });

  it("user innerHTML='' wipe → all contained components reaped", function () {
    const log = [];
    bw.mount(app(), [makeSensorTaco({ log: log, name: "a" }), makeSensorTaco({ log: log, name: "b" })]);
    app().innerHTML = "";              // third-party style wipe
    flush(bw);
    assert.ok(log.indexOf("unmount:a") !== -1 && log.indexOf("unmount:b") !== -1);
    assert.strictEqual(bw._debug().registered, 0);
  });

  it("ancestor removed raw, component 3 levels deep → reaped", function () {
    const log = [];
    bw.mount(app(), { t: "div", c: { t: "div", c: { t: "div", c: makeSensorTaco({ log: log, name: "deep" }) } } });
    app().firstElementChild.remove();
    flush(bw);
    assert.ok(log.indexOf("unmount:deep") !== -1);
  });

  it("plain addressable node rude-removed → registry pruned (rev 11: no bw_lc needed)", function () {
    const plain = { t: "span", c: "p" };
    bw.assignUUID(plain);
    const el = bw.mount(app(), plain);
    const uuid = bw.getUUID(el);
    el.remove();
    flush(bw);
    assert.strictEqual(bw.el(uuid), null);
    assert.strictEqual(bw._debug().registered, 0);
  });
});

describe("03.2 liveness checks (§2.1 layer 1)", function () {
  it("pub to a rude-removed tied subscriber BEFORE flush: not called, pruned, ghost_prune", function () {
    const calls = [];
    const el = mountSensor();
    bw.sub("d:tick", function (d) { calls.push(d); }, el);
    el.remove();                       // no flush — janitor hasn't run yet
    const { codes, stop } = collectDiag(bw);
    bw.pub("d:tick", 1);
    stop();
    assert.deepStrictEqual(calls, [], "no ghost updates, ever");
    assert.ok(codes.indexOf("ghost_prune") !== -1);
    bw.pub("d:tick", 2);               // second pub: already pruned, no second warn
  });

  it("bw.el/message on a disconnected non-exempt element → null/false + pruned", function () {
    const el = mountSensor();
    const uuid = bw.getUUID(el);
    el.remove();
    assert.strictEqual(bw.el(uuid), null);
    assert.strictEqual(bw.message(uuid, "update", { value: 1 }), false);
  });
});

describe("03.3 moves vs reaps — timing pinned (§2.1) @browser", function () {
  it("same synchronous call stack remove+append → NOT reaped, mounted not re-fired", function () {
    const log = [];
    const el = mountSensor(log);
    const aside = document.createElement("div");
    document.body.appendChild(aside);
    aside.appendChild(el);             // appendChild moves = remove+insert same stack
    flush(bw);
    assert.ok(log.indexOf("unmount:x") === -1, "a move is not a removal");
    assert.strictEqual(log.filter(s => s === "mounted:x").length, 1, "once per identity");
  });

  it("Promise.then reinsert without detach → reaped (async boundary loses the race) @browser", function (done) {
    const log = [];
    const el = mountSensor(log);
    el.remove();
    Promise.resolve().then(function () {
      app().appendChild(el);
      flush(bw);
      assert.ok(log.indexOf("unmount:x") !== -1, "any async boundary = use bw.detach");
      done();
    });
  });

  it("setTimeout reinsert without detach → reaped @browser", function (done) {
    const log = [];
    const el = mountSensor(log);
    el.remove();
    setTimeout(function () {
      flush(bw);
      assert.ok(log.indexOf("unmount:x") !== -1);
      done();
    }, 0);
  });
});

describe("03.3a the reaped-reinserted tripwire (§2.1 rev 19, Aggy-2 harmonized)", function () {
  it("reinserting a reaped husk diags reaped_reinserted naming bw.detach — deterministic, no grace window", function () {
    const el = mountSensor();
    el.remove();                        // rude
    flush(bw);                          // reaped: husk now inert (by design — strict timing KEPT)
    const { codes, stop } = collectDiag(bw);
    app().appendChild(el);              // the developer's async move lands too late
    flush(bw);
    stop();
    assert.ok(codes.indexOf("reaped_reinserted") !== -1,
      "the silent husk becomes a diagnosed husk with the fix named");
    // and the tripwire changed nothing about reap semantics:
    assert.strictEqual(el.bw, undefined, "still a husk — the tripwire warns, it does not resurrect");
  });
});

describe("03.4 detach — the sanctioned exception (§2.1)", function () {
  it("detached element survives flush; reinsert clears exemption; NEXT rude remove reaps", function () {
    const log = [];
    const el = mountSensor(log);
    bw.detach(el);
    flush(bw);
    assert.ok(log.indexOf("unmount:x") === -1, "exempt while detached");
    assert.strictEqual(bw._debug().detached, 1);

    app().appendChild(el);             // plain reinsert
    flush(bw);
    assert.strictEqual(bw._debug().detached, 0, "exemption cleared on reconnect");

    el.remove();                       // now rude again
    flush(bw);
    assert.ok(log.indexOf("unmount:x") !== -1, "no permanent immunity (G5.5 catch)");
  });

  it("detached element keeps receiving tied pub/sub (offscreen updates apply)", function () {
    const el = mountSensor();
    bw.sub("s:v", function (d) { el.bw.update(d); }, el);
    bw.detach(el);
    bw.pub("s:v", { value: 11 });
    assert.strictEqual(el.querySelector(".sc_value").textContent, "11");
  });
});

describe("03.5 janitor controls + observability (§2.1)", function () {
  it("flush() is synchronous and idempotent; _debug().janitorPending drains", function () {
    const el = mountSensor();
    el.remove();
    assert.ok(bw._debug().janitorPending >= 1);
    flush(bw);
    assert.strictEqual(bw._debug().janitorPending, 0);
    assert.doesNotThrow(function () { flush(bw); });
  });

  it("disable()/enable() are idempotent; matrix passes with heartbeat OFF (default)", function () {
    bw.janitor.disable(); bw.janitor.disable();
    bw.janitor.enable();  bw.janitor.enable();
    const log = [];
    const el = mountSensor(log);
    el.remove();
    flush(bw);
    assert.ok(log.indexOf("unmount:x") !== -1, "default config needs no heartbeat");
  });

  it("janitor reap is observable via bw:lifecycle mirror (DOM events can't bubble from a detached tree)", function () {
    const events = [];
    const stop = bw.sub("bw:lifecycle", function (d) { events.push(d.event + ":" + d.type); });
    const el = mountSensor();
    el.remove();
    flush(bw);
    stop();
    assert.ok(events.indexOf("unmount:sensor-card") !== -1);
  });
});
