/**
 * 2.1 Spec Tests — Package 05: bw.syncChildren — keyed children
 * Contract: lifecycle spec §4 (behavior, worked example)
 * RED BY DESIGN. Focus cases tagged @browser.
 */
import assert from "assert";
import bw from "../../src/bitwrench.js";
import { freshDOM, app, flush, resetBWForTest } from "./_helpers.js";

beforeEach(freshDOM);
afterEach(function () { resetBWForTest(bw); });

function items(ids) {
  return ids.map(function (id) { return { id: id, label: "task-" + id }; });
}

function syncInto(listEl, data) {
  bw.syncChildren(listEl, data, {
    key: function (t) { return String(t.id); },
    create: function (t) {
      return { t: "li", a: { class: "row" }, c: [
        { t: "input", a: { type: "checkbox" } },
        { t: "span", a: { class: "lbl" }, c: t.label }
      ], o: { state: { id: t.id }, type: "row",
              unmount: function (el, s) { (global.__rowlog || []).push("unmount:" + s.id); },
              mounted: function (el, s) { (global.__rowlog || []).push("mounted:" + s.id); } } };
    },
    update: function (el, t) { el.querySelector(".lbl").textContent = t.label; }
  });
}

function list() { return bw.mount(app(), { t: "ul", a: { class: "list" } }); }
function rowIds(ul) {
  return Array.prototype.map.call(ul.children, function (li) { return li._bw_state.id; });
}

describe("05.1 add / remove / keep / order (§4)", function () {
  it("new keys are created AND mounted; final order matches items", function () {
    global.__rowlog = [];
    const ul = list();
    syncInto(ul, items([1, 2, 3]));
    assert.deepStrictEqual(rowIds(ul), [1, 2, 3]);
    assert.deepStrictEqual(global.__rowlog, ["mounted:1", "mounted:2", "mounted:3"]);
  });

  it("absent keys are unmounted (hooks fire) and detached", function () {
    global.__rowlog = [];
    const ul = list();
    syncInto(ul, items([1, 2, 3]));
    global.__rowlog = [];
    syncInto(ul, items([1, 3]));
    assert.deepStrictEqual(rowIds(ul), [1, 3]);
    assert.deepStrictEqual(global.__rowlog, ["unmount:2"]);
  });

  it("kept keys get update(el, item) — labels refresh in place", function () {
    const ul = list();
    syncInto(ul, items([1]));
    syncInto(ul, [{ id: 1, label: "renamed" }]);
    assert.strictEqual(ul.children.length, 1);
    assert.strictEqual(ul.querySelector(".lbl").textContent, "renamed");
  });

  it("keys live on the element as _bw_key", function () {
    const ul = list();
    syncInto(ul, items([42]));
    assert.strictEqual(ul.firstElementChild._bw_key, "42");
  });
});

describe("05.2 moves preserve the node — the whole point (§4)", function () {
  it("moved keys are the SAME DOM nodes (reference equality), with state intact", function () {
    const ul = list();
    syncInto(ul, items([1, 2, 3]));
    const node2 = ul.children[1];
    node2.querySelector("input").checked = true;     // user interaction
    node2._bw_state.touched = "yes";

    global.__rowlog = [];
    syncInto(ul, items([3, 2, 1]));                  // full reorder
    assert.deepStrictEqual(rowIds(ul), [3, 2, 1]);
    assert.strictEqual(ul.children[1], node2, "node MOVED, not rebuilt");
    assert.strictEqual(node2.querySelector("input").checked, true, "checkbox survives");
    assert.strictEqual(node2._bw_state.touched, "yes", "component state survives");
    assert.deepStrictEqual(global.__rowlog, [], "no unmount/mount on pure reorder");
  });

  it("focus survives a reorder @browser", function () {
    const ul = list();
    syncInto(ul, items([1, 2, 3]));
    const input = ul.children[2].querySelector("input");
    input.focus();
    syncInto(ul, items([3, 1, 2]));
    assert.strictEqual(document.activeElement, input, "focus follows the moved node");
  });

  it("moves are not reaped by the janitor (same-stack insertBefore)", function () {
    const ul = list();
    syncInto(ul, items([1, 2]));
    syncInto(ul, items([2, 1]));
    flush(bw);
    assert.strictEqual(ul.children.length, 2);
    assert.strictEqual(bw._debug().registered > 0, true);
  });
});

describe("05.3 mixed batch — the server-push scenario (§4.1)", function () {
  it("delete + insert + reorder in one call → exact final order, exact hook log", function () {
    global.__rowlog = [];
    const ul = list();
    syncInto(ul, items([1, 3, 7, 4]));
    global.__rowlog = [];
    // task 3 deleted, task 9 added at top, rest reordered (spec §4.1 scenario)
    syncInto(ul, items([9, 7, 1, 4]));
    assert.deepStrictEqual(rowIds(ul), [9, 7, 1, 4]);
    assert.ok(global.__rowlog.indexOf("unmount:3") !== -1);
    assert.ok(global.__rowlog.indexOf("mounted:9") !== -1);
    assert.strictEqual(global.__rowlog.length, 2, "kept rows neither unmounted nor re-mounted");
  });
});
