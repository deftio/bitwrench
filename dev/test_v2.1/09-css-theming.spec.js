/**
 * 2.1 Spec Tests — Package 09: CSS & Theming
 * Contract: dev/bitwrench-css-cleanup-2026-06-09.md (rev 3) — findings
 * CSS-1..CSS-8, layer model, CSP, contrast guarantee.
 * RED BY DESIGN (several of these document current 2.0.x BUGS).
 */
import assert from "assert";
import bw from "../../src/bitwrench.js";
import { freshDOM, app, collectDiag, resetBWForTest } from "./_helpers.js";

beforeEach(freshDOM);
afterEach(function () { resetBWForTest(bw); });

function styleEls() { return document.querySelectorAll("head style"); }

describe("09.1 grammar — make is pure, apply mounts, load compounds", function () {
  it("makeStyles is pure: identical seeds → deep-equal results, zero DOM writes", function () {
    const before = styleEls().length;
    const a = bw.makeStyles({ primary: "#4f46e5" });
    const b = bw.makeStyles({ primary: "#4f46e5" });
    assert.deepStrictEqual(a.palette, b.palette);
    assert.strictEqual(a.css, b.css);
    assert.strictEqual(styleEls().length, before);
  });

  it("applyStyles same-scope reapply replaces (idempotent element count)", function () {
    const s = bw.makeStyles({ primary: "#4f46e5" });
    bw.applyStyles(s);
    const count = styleEls().length;
    bw.applyStyles(s);
    assert.strictEqual(styleEls().length, count);
  });

  it("loadStyles() no-arg = structural + full default theme (CSS-5: code wins, docs fixed)", function () {
    const styles = bw.loadStyles();
    assert.ok(styles.palette.primary.base, "default theme generated");
    assert.ok(document.getElementById("bw_style_structural"), "structural layer present");
    assert.ok(document.getElementById("bw_style_global"), "theme layer present");
  });

  it("loadStructural() injects layer 2 only", function () {
    bw.loadStructural();
    assert.ok(document.getElementById("bw_style_structural"));
    assert.strictEqual(document.getElementById("bw_style_global"), null);
  });
});

describe("09.2 scope identity + clearing (CSS-1, CSS-2, CSS-6)", function () {
  it("CSS-1: '#dash' and '.dash' scopes coexist as distinct style elements", function () {
    app().innerHTML = '<div id="dash"></div><div class="dash"></div>';
    const s = bw.makeStyles({ primary: "#336699" });
    const elA = bw.applyStyles(s, "#dash");
    const elB = bw.applyStyles(s, ".dash");
    assert.notStrictEqual(elA.id, elB.id, "lossy _scopeToStyleId collision (2.0.x bug)");
  });

  it("CSS-1: a '.global' class scope does not clobber the global layer", function () {
    const s = bw.makeStyles({ primary: "#336699" });
    bw.applyStyles(s);
    const globalEl = document.getElementById("bw_style_global");
    bw.applyStyles(s, ".global");
    assert.strictEqual(document.getElementById("bw_style_global"), globalEl, "untouched");
  });

  it("CSS-2: clearStyles removes the theme class from ALL matched elements", function () {
    app().innerHTML = '<div class="panel bw_theme_alt"></div><div class="panel bw_theme_alt"></div><div class="panel bw_theme_alt"></div>';
    bw.applyStyles(bw.makeStyles({}), ".panel");
    bw.clearStyles(".panel");
    assert.strictEqual(document.querySelectorAll(".bw_theme_alt").length, 0, "2.0.x only cleared targets[0]");
  });

  it("CSS-6: clearStyles('structural') works", function () {
    bw.loadStructural();
    bw.clearStyles("structural");
    assert.strictEqual(document.getElementById("bw_style_structural"), null);
  });
});

describe("09.3 rule scoping (CSS-3, CSS-4)", function () {
  it("CSS-3: scopeRulesUnder leaves @keyframes steps untouched, prefixes @media inners", function () {
    const scoped = bw.scopeRulesUnder({
      "@keyframes fade": { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
      "@media (max-width: 600px)": { ".card": { padding: "0" } },
      ".card": { color: "red" }
    }, "#panel");
    assert.ok(scoped["@keyframes fade"]["0%"], "steps must NOT become '#panel 0%' (2.0.x bug)");
    assert.ok(scoped["@media (max-width: 600px)"]["#panel .card"], "media inners prefixed");
    assert.ok(scoped["#panel .card"]);
  });

  it("CSS-4: scoped alternate emits no descendant-body rule; scope root gets a self surface rule", function () {
    app().innerHTML = '<div id="panel"></div>';
    const styleEl = bw.applyStyles(bw.makeStyles({ primary: "#336699" }), "#panel");
    const css = styleEl.textContent;
    assert.ok(css.indexOf(".bw_theme_alt body") === -1 && !/#panel\.bw_theme_alt\s+body/.test(css),
      "dead descendant-body rule (2.0.x bug)");
    assert.ok(/#panel\.bw_theme_alt\s*\{/.test(css), "self-rule so a scoped dark panel looks dark");
  });
});

describe("09.4 mode control (CSS-7, CSS-8)", function () {
  it("setThemeMode is idempotent and returns {mode, count}", function () {
    app().innerHTML = '<div class="panel"></div><div class="panel bw_theme_alt"></div>';
    const r1 = bw.setThemeMode("alternate", ".panel");
    assert.deepStrictEqual(r1, { mode: "alternate", count: 2 });
    const r2 = bw.setThemeMode("alternate", ".panel");
    assert.deepStrictEqual(r2, { mode: "alternate", count: 2 }, "idempotent across mixed prior state");
    assert.strictEqual(document.querySelectorAll(".panel.bw_theme_alt").length, 2);
  });

  it("toggleThemeMode = set(inverse of first element)", function () {
    app().innerHTML = '<div class="panel bw_theme_alt"></div><div class="panel"></div>';
    bw.toggleThemeMode(".panel");
    assert.strictEqual(document.querySelectorAll(".panel.bw_theme_alt").length, 0,
      "first was alt → all set primary (no more mixing)");
  });

  it("complex/comma scopes rejected with scope_rejected diag", function () {
    const { codes, stop } = collectDiag(bw);
    bw.setThemeMode("alternate", "#a .b");
    bw.setThemeMode("alternate", "#a, #b");
    stop();
    assert.strictEqual(codes.filter(c => c === "scope_rejected").length, 2);
  });

  it("applyStyles rejects themed complex/comma scopes too, before DOM side effects", function () {
    const before = styleEls().length;
    const { codes, stop } = collectDiag(bw);
    const styles = bw.makeStyles({});
    assert.strictEqual(bw.applyStyles(styles, "#a .b"), null);
    assert.strictEqual(bw.applyStyles(styles, "#a, #b"), null);
    stop();
    assert.strictEqual(styleEls().length, before,
      "invalid scope must not leave style tags or theme classes behind");
    assert.strictEqual(codes.filter(c => c === "scope_rejected").length, 2);
  });

  it("CSS-8: bw:thememode publishes {mode, scope, count}", function () {
    app().innerHTML = '<div class="panel"></div>';
    const events = [];
    const stop = bw.sub("bw:thememode", function (d) { events.push(d); });
    bw.setThemeMode("alternate", ".panel");
    stop();
    assert.deepStrictEqual(events, [{ mode: "alternate", scope: ".panel", count: 1 }]);
  });
});

describe("09.5 layers, namespace, CSP, contrast", function () {
  it("layer ordering is deterministic regardless of call order: reset precedes theme", function () {
    bw.applyStyles(bw.makeStyles({}));        // theme first
    bw.loadReset();                            // reset second
    const ids = Array.prototype.map.call(styleEls(), s => s.id).filter(id => /^bw_style_/.test(id));
    assert.ok(ids.indexOf("bw_style_reset") < ids.indexOf("bw_style_global"),
      "reset must precede theme in <head> no matter the call order");
  });

  it("user injectCSS with a bw_style_* id warns css_reserved_id", function () {
    const { codes, stop } = collectDiag(bw);
    bw.injectCSS(".x{color:red}", { id: "bw_style_mine" });
    stop();
    assert.ok(codes.indexOf("css_reserved_id") !== -1);
  });

  it("cspNonce: injected style elements carry the nonce", function () {
    bw.config = bw.config || {};
    bw.config.cspNonce = "n-42";
    const el = bw.injectCSS(".y{color:blue}", { id: "user_css_test" });
    bw.config.cspNonce = null;
    assert.strictEqual(el.getAttribute("nonce"), "n-42");
  });

  it("contrast guarantee: seeds producing an AA-failing pair warn contrast_aa", function () {
    const { codes, stop } = collectDiag(bw);
    // near-identical luminance seed pair — engineered to fail AA
    bw.makeStyles({ primary: "#7f7f7f", secondary: "#808080" });
    stop();
    assert.ok(codes.indexOf("contrast_aa") !== -1);
  });
});
