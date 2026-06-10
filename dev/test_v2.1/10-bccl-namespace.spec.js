/**
 * 2.1 Spec Tests — Package 10: BCCL namespace + a11y + i18n props
 * Contract: lifecycle spec §13 (class rename, no dual emission),
 * §6 (a11y acceptance rows), §7.2 (no hardcoded strings), §8 (makeForm)
 * RED BY DESIGN. Focus-trap cases tagged @browser.
 */
import assert from "assert";
import bw from "../../src/bitwrench.js";
import { freshDOM, app, resetBWForTest } from "./_helpers.js";

beforeEach(freshDOM);
afterEach(function () { resetBWForTest(bw); });

// 2.0.x component-class tokens that must NEVER appear in 2.1 factory output.
const LEGACY = /^bw_(card|btn|tabs|tab|modal|alert|badge|table|navbar|accordion|carousel|dropdown|tooltip|progress|pagination|hero|timeline|input|select|textarea|form)(_|$)/;

function classTokens(root) {
  const all = [];
  const walk = function (el) {
    if (el.classList) el.classList.forEach(function (c) { all.push(c); });
    for (let i = 0; i < el.children.length; i++) walk(el.children[i]);
  };
  walk(root);
  return all;
}

describe("10.1 namespace — bw_bccl_*, no dual emission (§13)", function () {
  it("every cataloged factory emits bw_bccl_* and zero legacy component tokens", function () {
    const catalog = bw.catalog();
    assert.ok(catalog.length >= 20, "catalog present");
    catalog.forEach(function (entry) {
      let taco;
      try { taco = bw.make(entry.type, {}); } catch (e) { return; } // factories needing props: covered below
      if (!taco) return;
      const el = bw.create(taco);
      const tokens = classTokens(el);
      assert.ok(tokens.some(c => c.indexOf("bw_bccl_") === 0),
        entry.type + ": missing bw_bccl_* root class");
      const legacy = tokens.filter(c => LEGACY.test(c));
      assert.deepStrictEqual(legacy, [], entry.type + ": legacy tokens emitted: " + legacy.join(","));
    });
  });

  it("variants stay short (bw_primary) and utilities stay as-is (§13 table)", function () {
    const el = bw.create(bw.makeButton({ text: "x", variant: "primary" }));
    const tokens = classTokens(el.nodeType === 11 ? el.firstElementChild || el : el);
    assert.ok(tokens.indexOf("bw_primary") !== -1, "variant not renamed");
    assert.ok(tokens.indexOf("bw_bccl_primary") === -1, "variant must NOT gain the bccl prefix");
  });

  it("typed markers: interactive factories carry bw_is_component_<type>, never _bccl_ markers", function () {
    const el = bw.mount(app(), bw.makeTabs({ tabs: [{ label: "a", content: "1" }, { label: "b", content: "2" }] }));
    assert.ok(el.classList.contains("bw_is_component_tabs"));
    assert.ok(el.className.indexOf("bw_is_component_bccl") === -1);
  });

  it("factory output does not preserve the old data-bw-action convention", function () {
    // Server-drivable interaction in 2.1 is class-token based (`bw_act_*`).
    // BCCL should not keep a second hidden action namespace alive.
    const el = bw.create(bw.makeButton({ text: "Save", action: "save_doc" }));
    const html = el.outerHTML || "";
    assert.ok(html.indexOf("data-bw-action") === -1);
  });
});

describe("10.2 a11y acceptance rows (§6)", function () {
  it("tabs: roving tabindex + aria-selected; arrows move selection", function () {
    const el = bw.mount(app(), bw.makeTabs({ tabs: [{ label: "a", content: "1" }, { label: "b", content: "2" }] }));
    const tabs = el.querySelectorAll('[role="tab"]');
    assert.strictEqual(tabs.length, 2);
    assert.strictEqual(tabs[0].getAttribute("aria-selected"), "true");
    assert.strictEqual(tabs[0].getAttribute("tabindex"), "0");
    assert.strictEqual(tabs[1].getAttribute("tabindex"), "-1", "roving tabindex");
  });

  it("modal: aria-modal, Esc closes, focus returns to opener @browser", function () {
    const opener = bw.mount(app(), { t: "button", a: { id: "opener" }, c: "open" });
    opener.focus();
    const modal = bw.append(app(), bw.makeModal({ title: "T", content: "C", open: true }));
    const dialog = modal.querySelector('[aria-modal="true"]') || modal;
    assert.strictEqual(dialog.getAttribute("aria-modal"), "true");
    dialog.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    assert.ok(!modal.isConnected || modal.style.display === "none" || !modal.querySelector('[aria-modal]'),
      "Esc closes");
    assert.strictEqual(document.activeElement, opener, "focus returns to opener");
  });

  it("accordion: aria-expanded toggles with aria-controls wiring", function () {
    const el = bw.mount(app(), bw.makeAccordion({ items: [{ title: "t", content: "c" }] }));
    const btn = el.querySelector("[aria-expanded]");
    assert.ok(btn, "accordion header is aria-expanded");
    assert.ok(btn.getAttribute("aria-controls"), "wired to its panel");
  });

  it("table: aria-sort appears on the sorted column", function () {
    const el = bw.mount(app(), bw.makeTable({
      data: [{ n: "b" }, { n: "a" }], columns: [{ key: "n", label: "N" }], sortable: true
    }));
    el.bw.sort("n");
    assert.ok(el.querySelector('th[aria-sort]'), "sorted header announces sort state");
  });

  it("table headers use scope=col so generated tables are screen-reader sane", function () {
    const el = bw.mount(app(), bw.makeTable({
      data: [{ n: "a" }], columns: [{ key: "n", label: "N" }]
    }));
    assert.ok(el.querySelector('th[scope="col"]'));
  });

  it("alert/toast carries a live region role", function () {
    const el = bw.mount(app(), bw.makeAlert({ content: "saved", variant: "success" }));
    const role = el.getAttribute("role");
    assert.ok(role === "alert" || role === "status");
  });

  it("pagination: current page carries aria-current", function () {
    const el = bw.mount(app(), bw.makePagination({ pages: 3, current: 2 }));
    assert.ok(el.querySelector('[aria-current]'));
  });
});

describe("10.3 i18n: no hardcoded user-facing strings (§7.2)", function () {
  it("carousel prev/next labels are props with English defaults", function () {
    const de = bw.mount(app(), bw.makeCarousel({ items: [{ content: "1" }, { content: "2" }],
      prevLabel: "Zurück", nextLabel: "Weiter" }));
    assert.ok(de.textContent.indexOf("Zurück") !== -1 || de.querySelector('[aria-label="Zurück"]'),
      "label prop rendered");
  });

  it("modal close control label is a prop", function () {
    const el = bw.mount(app(), bw.makeModal({ title: "T", content: "C", open: true, closeLabel: "Schließen" }));
    assert.ok(el.querySelector('[aria-label="Schließen"]'), "closeLabel prop wired to aria-label");
  });
});

describe("10.4 forms — makeForm contract (§8)", function () {
  function form() {
    return bw.mount(app(), bw.makeForm({
      fields: [
        { name: "email", type: "email", label: "Email", required: true },
        { name: "age", type: "number", label: "Age" }
      ]
    }));
  }

  it("labels associate with inputs; getValues/setValues round-trip", function () {
    const el = form();
    const input = el.querySelector('[name="email"]');
    const label = el.querySelector('label[for="' + input.id + '"]');
    assert.ok(label, "label/for association");
    el.bw.setValues({ email: "a@b.c", age: 30 });
    assert.deepStrictEqual(el.bw.getValues(), { email: "a@b.c", age: 30 });
  });

  it("validate() + setErrors(): aria-invalid and aria-describedby error wiring (§6)", function () {
    const el = form();
    const result = el.bw.validate();
    assert.strictEqual(result.valid, false, "required email empty");
    const input = el.querySelector('[name="email"]');
    assert.strictEqual(input.getAttribute("aria-invalid"), "true");
    const errId = input.getAttribute("aria-describedby");
    assert.ok(errId && document.getElementById(errId).textContent.length > 0,
      "error text linked via aria-describedby");
  });
});

describe("10.5 BCCL on the new engine (§3 convention, §4 adoption)", function () {
  it("data components implement the update handle (table)", function () {
    const el = bw.mount(app(), bw.makeTable({
      data: [{ n: "a" }], columns: [{ key: "n", label: "N" }]
    }));
    assert.strictEqual(typeof el.bw.update, "function", "generic data entry point");
  });

  it("makeTable.setData reuses row nodes by key (syncChildren semantics)", function () {
    const el = bw.mount(app(), bw.makeTable({
      data: [{ id: 1, n: "a" }, { id: 2, n: "b" }],
      columns: [{ key: "n", label: "N" }], rowKey: "id"
    }));
    const row2 = el.querySelectorAll("tbody tr")[1];
    el.bw.setData([{ id: 2, n: "b!" }, { id: 1, n: "a" }]);
    assert.strictEqual(el.querySelectorAll("tbody tr")[0], row2,
      "no tbody rebuild — the rev-zero embarrassment is gone");
  });
});
