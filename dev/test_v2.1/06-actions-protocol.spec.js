/**
 * 2.1 Spec Tests — Package 06: bw_act_* actions + wire protocol v1
 * Contract: lifecycle spec §5 (5.1 versioning, 5.2 verbs, 5.3 threat
 * model, 5.4 action mechanics 1–8)
 * RED BY DESIGN.
 */
import assert from "assert";
import bw from "../../src/bitwrench.js";
import { freshDOM, app, makeSensorTaco, collectDiag, resetBWForTest } from "./_helpers.js";

beforeEach(function () {
  freshDOM();
  if (bw.actions && bw.actions.enable) bw.actions.enable();
});
afterEach(function () { resetBWForTest(bw); });

function click(el) {
  el.dispatchEvent(new window.MouseEvent("click", { bubbles: true, cancelable: true }));
}
function collectActs() {
  const acts = [];
  const stop = bw.sub("act:*", function (d, topic) { acts.push({ topic: topic, d: d }); });
  return { acts, stop };
}

describe("06.1 action dispatch mechanics (§5.4 items 1–6)", function () {
  it("click on a bw_act_x element pubs act:x with {action, value, ref}", function () {
    const el = bw.mount(app(), { t: "button", a: { class: "bw_btn bw_act_save_doc" }, c: "Save" });
    const { acts, stop } = collectActs();
    click(el);
    stop();
    assert.strictEqual(acts.length, 1);
    assert.strictEqual(acts[0].d.action, "save_doc");
  });

  it("token scan, never substring: class 'not_bw_act_save' does NOT dispatch (mech 1)", function () {
    const el = bw.mount(app(), { t: "button", a: { class: "not_bw_act_save" }, c: "x" });
    const { acts, stop } = collectActs();
    click(el);
    stop();
    assert.strictEqual(acts.length, 0);
  });

  it("ancestor walk: click on a child of the actionable element dispatches (mech 2)", function () {
    bw.mount(app(), { t: "button", a: { class: "bw_act_go" }, c: { t: "span", a: { class: "inner" }, c: "Go" } });
    const { acts, stop } = collectActs();
    click(app().querySelector(".inner"));
    stop();
    assert.strictEqual(acts.length, 1);
    assert.strictEqual(acts[0].d.action, "go");
  });

  it("multiple action tokens: first in class order wins + act_multiple diag (mech 3)", function () {
    const el = bw.mount(app(), { t: "button", a: { class: "bw_act_first bw_act_second" }, c: "x" });
    const { acts, stop } = collectActs();
    const diag = collectDiag(bw);
    click(el);
    stop(); diag.stop();
    assert.strictEqual(acts.length, 1);
    assert.strictEqual(acts[0].d.action, "first");
    assert.ok(diag.codes.indexOf("act_multiple") !== -1);
  });

  it("preventDefault: link prevented, button not (mech 4)", function () {
    const a = bw.mount(app(), { t: "a", a: { href: "/nope", class: "bw_act_nav" }, c: "go" });
    const evA = new window.MouseEvent("click", { bubbles: true, cancelable: true });
    a.dispatchEvent(evA);
    assert.strictEqual(evA.defaultPrevented, true, "links prevented");

    const b = bw.append(app(), { t: "button", a: { class: "bw_act_press" }, c: "b" });
    const evB = new window.MouseEvent("click", { bubbles: true, cancelable: true });
    b.dispatchEvent(evB);
    assert.strictEqual(evB.defaultPrevented, false, "buttons not prevented");
  });

  it("inputs fire on change with value; payload carries name (heuristic + mech 5)", function () {
    const input = bw.mount(app(), { t: "input", a: { type: "text", name: "city", class: "bw_act_city_changed" } });
    input.value = "Berlin";
    const { acts, stop } = collectActs();
    input.dispatchEvent(new window.Event("change", { bubbles: true }));
    stop();
    assert.strictEqual(acts.length, 1);
    assert.strictEqual(acts[0].d.value, "Berlin");
    assert.strictEqual(acts[0].d.name, "city");
  });

  it("form submit: prevented, payload includes form: bw.formData(formEl) (mech 4+5)", function () {
    const form = bw.mount(app(), { t: "form", a: { class: "bw_act_signup" }, c: [
      { t: "input", a: { type: "text", name: "email" } },
      { t: "button", a: { type: "submit" }, c: "Go" }
    ]});
    form.querySelector("input").value = "a@b.c";
    const { acts, stop } = collectActs();
    const ev = new window.Event("submit", { bubbles: true, cancelable: true });
    form.dispatchEvent(ev);
    stop();
    assert.strictEqual(ev.defaultPrevented, true, "native submit stopped");
    assert.strictEqual(acts[0].d.form.email, "a@b.c");
  });

  it("ref priority: uuid → id → null; never auto-assigned (mech 6)", function () {
    const t1 = { t: "button", a: { class: "bw_act_a" }, c: "1" };
    bw.assignUUID(t1);
    const withUuid = bw.mount(app(), t1);
    const withId = bw.append(app(), { t: "button", a: { id: "btn2", class: "bw_act_a" }, c: "2" });
    const bare = bw.append(app(), { t: "button", a: { class: "bw_act_a" }, c: "3" });

    const { acts, stop } = collectActs();
    click(withUuid); click(withId); click(bare);
    stop();
    assert.ok(/^bw_uuid_/.test(acts[0].d.ref));
    assert.strictEqual(acts[1].d.ref, "btn2");
    assert.strictEqual(acts[2].d.ref, null);
    assert.strictEqual(bare.getAttribute("id"), null, "dispatcher must not mutate markup");
  });

  it("installer idempotent: enable() twice → exactly one dispatch per click (mech 8)", function () {
    bw.actions.enable(); bw.actions.enable();
    const el = bw.mount(app(), { t: "button", a: { class: "bw_act_once" }, c: "x" });
    const { acts, stop } = collectActs();
    click(el);
    stop();
    assert.strictEqual(acts.length, 1);
  });

  it("disable() stops dispatch", function () {
    const el = bw.mount(app(), { t: "button", a: { class: "bw_act_dead" }, c: "x" });
    bw.actions.disable();
    const { acts, stop } = collectActs();
    click(el);
    stop();
    assert.strictEqual(acts.length, 0);
  });

  it("the remote bridge receives the exact v1 event shape — through bw.remote ONLY (mech 7)", function () {
    // This avoids real HTTP in the unit suite while still pinning the bwserve
    // contract: actions are names + data, never code, and the dispatcher must
    // not allocate ids or leak per-element listeners to make remoting work.
    // SEAM DECISION (spec rev 17): bw.remote.send is the ONE transport seam.
    // bw.actions has NO transport API of its own — a second hook
    // (setTransport) was considered and rejected: two seams = two subtly
    // divergent paths.
    assert.strictEqual(bw.actions.setTransport, undefined,
      "bw.actions must not grow its own transport hook");
    const posts = [];
    bw.remote = { send: function (payload) { posts.push(payload); } };

    const input = bw.mount(app(), { t: "input", a: {
      class: "bw_act_threshold", name: "threshold", type: "range"
    }});
    input.value = "7";
    input.dispatchEvent(new window.Event("input", { bubbles: true }));
    bw.remote = null;

    assert.deepStrictEqual(posts, [{
      v: 1, type: "event", action: "threshold", value: "7",
      name: "threshold", ref: null, owner: null
    }]);
  });

  it("payload carries owner {uuid,type} from the nearest component; topics stay FLAT (rev 19, Aggy-3)", function () {
    const card = bw.mount(app(), makeSensorTaco());
    bw.append(card, { t: "button", a: { class: "bw_act_close" }, c: "x" });
    const topics = [];
    const stop = bw.sub("act:*", function (d, topic) { topics.push({ topic: topic, d: d }); });
    card.querySelector(".bw_act_close").dispatchEvent(
      new window.MouseEvent("click", { bubbles: true, cancelable: true }));
    stop();
    assert.strictEqual(topics.length, 1);
    assert.strictEqual(topics[0].topic, "act:close",
      "auto-prefixed topics REJECTED — position-dependent routing breaks the wire contract");
    assert.strictEqual(topics[0].d.owner.type, "sensor-card",
      "ownership is payload, not topic: handlers never DOM-walk");
    assert.strictEqual(topics[0].d.owner.uuid, bw.getUUID(card));
  });

  it("owner is null for an actionable element with no component ancestor", function () {
    const el = bw.mount(app(), { t: "button", a: { class: "bw_act_lonely" }, c: "x" });
    const acts = [];
    const stop = bw.sub("act:lonely", function (d) { acts.push(d); });
    el.dispatchEvent(new window.MouseEvent("click", { bubbles: true, cancelable: true }));
    stop();
    assert.strictEqual(acts[0].owner, null);
  });
});

describe("06.2 wire protocol v1 (§5.1, §5.2)", function () {
  it("missing or unknown v → rejected + wire_rejected diag", function () {
    const { codes, stop } = collectDiag(bw);
    assert.strictEqual(bw.apply({ type: "remove", ref: "#app" }), false);
    assert.strictEqual(bw.apply({ v: 99, type: "remove", ref: "#app" }), false);
    stop();
    assert.strictEqual(codes.filter(c => c === "wire_rejected").length, 2);
  });

  it("v:1 verbs round-trip: mount, patch{text|attrs|content}, append, batch/remove", function () {
    assert.strictEqual(bw.apply({ v: 1, type: "mount", ref: "#app", taco: { t: "div", a: { id: "w" }, c: "hi" } }), true);
    assert.strictEqual(bw.apply({ v: 1, type: "patch", ref: "#w", text: "yo" }), true);
    assert.strictEqual(document.getElementById("w").textContent, "yo");
    assert.strictEqual(bw.apply({ v: 1, type: "patch", ref: "#w", attrs: { "aria-busy": "true" } }), true);
    assert.strictEqual(document.getElementById("w").getAttribute("aria-busy"), "true");
    assert.strictEqual(bw.apply({ v: 1, type: "patch", ref: "#w", content: { t: "em", c: "in" } }), true);
    assert.strictEqual(bw.apply({ v: 1, type: "append", ref: "#app", taco: { t: "p", a: { id: "p2" }, c: "2" } }), true);
    assert.strictEqual(bw.apply({ v: 1, type: "batch", ops: [
      { v: 1, type: "patch", ref: "#p2", text: "two" },
      { v: 1, type: "remove", ref: "#w" }
    ] }), true);
    assert.strictEqual(document.getElementById("w"), null);
  });

  it("v:1 replace, refresh, message, and update are explicit verb paths", function () {
    // Functions are local page code. The wire messages below exercise the
    // protocol verbs against a locally-defined component without smuggling a
    // render or handle closure through bw.apply().
    bw.mount(app(), { t: "div", a: { id: "box" }, o: {
      state: { n: 1 },
      render: function (el, s) { bw.mount(el, { t: "span", a: { class: "n" }, c: String(s.n) }); },
      handle: {
        update: function (el, d) { el._bw_state.n = d.n; el.bw.setN(String(d.n)); },
        stash:  function (el, n) { el._bw_state.n = n; }   // author-surface: state only, no DOM
      },
      slots: { n: ".n" }
    } });

    assert.strictEqual(bw.apply({ v: 1, type: "update", ref: "#box", data: { n: 2 } }), true);
    assert.strictEqual(document.querySelector("#box .n").textContent, "2");
    assert.strictEqual(bw.apply({ v: 1, type: "message", ref: "#box", action: "update", data: { n: 3 } }), true);
    assert.strictEqual(document.querySelector("#box .n").textContent, "3");
    // state-then-refresh via the component's own surface — consumers (and this
    // test) never poke _bw_state from outside (§3.1)
    assert.strictEqual(bw.apply({ v: 1, type: "message", ref: "#box", action: "stash", data: 4 }), true);
    assert.strictEqual(bw.apply({ v: 1, type: "refresh", ref: "#box" }), true);
    assert.strictEqual(document.querySelector("#box .n").textContent, "4");
    assert.strictEqual(bw.apply({ v: 1, type: "replace", ref: "#box",
      taco: { t: "section", a: { id: "newbox" }, c: "new" } }), true);
    assert.strictEqual(document.getElementById("newbox").textContent, "new");
  });

  it("wire append runs the full mount walk (2.0.x regression: it skipped it)", function () {
    global.__wirelog = [];
    // client-side factory registered on the page; server sends structure for it…
    // simplest probe: a TACO with o.type — shell must register + fire bw:mount
    const events = [];
    const stop = bw.sub("bw:lifecycle", function (d) { events.push(d.event); });
    bw.apply({ v: 1, type: "append", ref: "#app", taco: { t: "div", o: { type: "shell" } } });
    stop();
    assert.ok(events.indexOf("mount") !== -1, "wire-appended component is alive");
  });

  it("2.0.x field names are NOT aliased in v:1 (target/node rejected)", function () {
    const { codes, stop } = collectDiag(bw);
    assert.strictEqual(bw.apply({ v: 1, type: "mount", target: "#app", node: { t: "div" } }), false);
    stop();
    assert.ok(codes.indexOf("wire_rejected") !== -1);
  });

  it("update over the wire: warns (no handle) instead of silently refreshing", function () {
    bw.mount(app(), { t: "div", a: { id: "u1" }, o: { state: {} } });
    const { codes, stop } = collectDiag(bw);
    bw.apply({ v: 1, type: "update", ref: "#u1", data: { x: 1 } });
    stop();
    assert.ok(codes.indexOf("update_no_handle") !== -1);
  });
});

describe("06.2a protocol edge semantics (rev 14)", function () {
  it("unknown type in a valid v:1 message → false + wire_rejected (typo'd verbs surface)", function () {
    const { codes, stop } = collectDiag(bw);
    assert.strictEqual(bw.apply({ v: 1, type: "frobnicate", ref: "#app" }), false);
    stop();
    assert.ok(codes.indexOf("wire_rejected") !== -1);
  });

  it("batch is sequential continue-on-error: failing op diags, rest applies, returns false", function () {
    bw.mount(app(), { t: "p", a: { id: "good" }, c: "old" });
    const ok = bw.apply({ v: 1, type: "batch", ops: [
      { v: 1, type: "patch", ref: "#ghost-404", text: "x" },   // fails
      { v: 1, type: "patch", ref: "#good", text: "applied" }   // must still run
    ] });
    assert.strictEqual(ok, false, "any failure → batch false");
    assert.strictEqual(document.getElementById("good").textContent, "applied",
      "divergence stays enumerable — later ops are not abandoned");
  });

  it("refresh on a render-less component (server shell) → false + refresh_no_render, zero DOM effect", function () {
    bw.apply({ v: 1, type: "mount", ref: "#app", taco: { t: "div", a: { id: "shell" }, o: { type: "shell" }, c: "as-sent" } });
    const { codes, stop } = collectDiag(bw);
    assert.strictEqual(bw.apply({ v: 1, type: "refresh", ref: "#shell" }), false);
    stop();
    assert.ok(codes.indexOf("refresh_no_render") !== -1);
    assert.strictEqual(document.getElementById("shell").textContent, "as-sent", "untouched");
  });

  it("bw.remote is the single transport seam: bw_act events send through it", function () {
    const sent = [];
    bw.remote = { send: function (msg) { sent.push(msg); } };
    const el = bw.mount(app(), { t: "button", a: { id: "rb", class: "bw_act_ping_server" }, c: "go" });
    el.dispatchEvent(new window.MouseEvent("click", { bubbles: true, cancelable: true }));
    bw.remote = null;
    assert.strictEqual(sent.length, 1);
    assert.strictEqual(sent[0].v, 1);
    assert.strictEqual(sent[0].type, "event");
    assert.strictEqual(sent[0].action, "ping_server");
    assert.strictEqual(sent[0].ref, "rb");
  });
});

describe("06.2b listen/unlisten — remote topic streaming (§5.2, the LLM-observability verb)", function () {
  it("listen forwards matching publishes through bw.remote as {v:1, type:'topic', topic, data}", function () {
    const sent = [];
    bw.remote = { send: function (m) { sent.push(m); } };
    assert.strictEqual(bw.apply({ v: 1, type: "listen", topic: "bw:lifecycle" }), true);

    bw.mount(app(), makeSensorTaco());            // produces a bw:lifecycle mount event
    bw.remote = null;

    const fwd = sent.filter(function (m) { return m.type === "topic"; });
    assert.ok(fwd.length >= 1, "lifecycle events stream to the remote observer");
    assert.strictEqual(fwd[0].v, 1);
    assert.strictEqual(fwd[0].topic, "bw:lifecycle");
    assert.strictEqual(fwd[0].data.event, "mount");
  });

  it("unlisten stops the stream; act:* topics are listenable too", function () {
    const sent = [];
    bw.remote = { send: function (m) { sent.push(m); } };
    bw.apply({ v: 1, type: "listen", topic: "act:save" });
    bw.pub("act:save", { action: "save" });
    bw.apply({ v: 1, type: "unlisten", topic: "act:save" });
    bw.pub("act:save", { action: "save" });
    bw.remote = null;
    assert.strictEqual(sent.filter(function (m) { return m.type === "topic"; }).length, 1,
      "exactly one forwarded event: after unlisten, silence");
  });
});

describe("06.2c bw.connect — client-visible connection status (§5.3 rev 17)", function () {
  it("status transitions publish bw:diag remote_status (FakeEventSource)", function () {
    const seen = [];
    const stop = bw.sub("bw:diag", function (d) {
      if (d.code === "remote_status") seen.push(d.status);
    });
    // jsdom has no EventSource; the contract is testable through a fake.
    let fake;
    global.EventSource = function (url) {
      fake = this; this.url = url;
      this.close = function () {};
    };
    const remote = bw.connect("http://localhost:0/bw/events/x");
    fake.onopen();
    fake.onerror();
    stop();
    delete global.EventSource;
    assert.deepStrictEqual(seen, ["connecting", "connected", "disconnected"],
      "the page and its observers can SEE the connection state — B1's client half");
    assert.ok(remote && typeof remote.send === "function",
      "connect returns/install the ONE seam: bw.remote");
  });
});

describe("06.3 threat model — code never crosses the wire (§5.3)", function () {
  it("exec does not exist as a verb", function () {
    const { codes, stop } = collectDiag(bw);
    assert.strictEqual(bw.apply({ v: 1, type: "exec", code: "global.__pwned = 1" }), false);
    stop();
    assert.strictEqual(global.__pwned, undefined);
    assert.ok(codes.indexOf("wire_rejected") !== -1);
  });

  it("wire register is refused; registerRemote + call work with local closures", function () {
    assert.strictEqual(bw.apply({ v: 1, type: "register", name: "evil", body: "function(){ global.__pwned2 = 1 }" }), false);
    assert.strictEqual(global.__pwned2, undefined);

    let got = null;
    bw.registerRemote("greet", function (who) { got = who; });
    assert.strictEqual(bw.apply({ v: 1, type: "call", name: "greet", args: ["manu"] }), true);
    assert.strictEqual(got, "manu");
  });

  it("string on* attributes in wire TACOs are stripped before create", function () {
    bw.apply({ v: 1, type: "mount", ref: "#app",
      taco: { t: "button", a: { id: "b", onclick: "global.__pwned3 = 1" }, c: "x" } });
    const btn = document.getElementById("b");
    assert.strictEqual(btn.getAttribute("onclick"), null, "remote code through the back door");
  });
});
