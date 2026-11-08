/**
 * One vocabulary for callers (north star, consequence 14) and the factory
 * contract (north star, "BCCL").
 *
 * Three consumer apps (triops #92, jazzmac #108, quikleaf #112-#118) each
 * filed a batch of sibling-inconsistency bugs: verbs that resolved their
 * target differently, content sinks that accepted different forms, factories
 * that took `id` or not. No single function was wrong on its own; the unit
 * tests for each passed. These matrices test the *set*, so a new verb, sink
 * or factory cannot drift on its own.
 *
 *   A. Every target-taking verb  x  every target form (and the miss behaviour)
 *   B. Every content sink        x  every content form
 *   C. Every make*() factory     x  the contract (`class` merges, `className`
 *      warns once, `id` lands on the addressable element)
 *
 * The verb list is checked against the source (meta test) so a verb cannot
 * opt out by being left off the table.
 */

import assert from "assert";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import bw from "../src/bitwrench.js";
import jsdom from "jsdom";
const { JSDOM } = jsdom;

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = readFileSync(join(__dirname, "..", "src", "bitwrench.js"), "utf8");

var dom, flags, ctx;

function freshDOM() {
  dom = new JSDOM('<!DOCTYPE html><html><body><div id="app"></div></body></html>');
  global.window = dom.window;
  global.document = dom.window.document;
  global.Element = dom.window.Element;
  global.DocumentFragment = dom.window.DocumentFragment;
  global.HTMLElement = dom.window.HTMLElement;
  global.CustomEvent = dom.window.CustomEvent;
  global.requestAnimationFrame = function(fn) { fn(); };
  if (bw._nodeMap) Object.keys(bw._nodeMap).forEach(function(k) { delete bw._nodeMap[k]; });
}

function captureWarnings(fn) {
  var warned = [];
  var orig = console.warn;
  console.warn = function() { warned.push(Array.prototype.join.call(arguments, " ")); };
  try { fn(); } finally { console.warn = orig; }
  return warned;
}

// One component with everything a verb could want to act on: an id, a class,
// a UUID, a lifecycle-managed child with its own id, a slot, a handle with
// `ping` and `update`, a render function, an input for formData.
function setup(plain) {
  freshDOM();
  flags = {};
  if (plain) {
    var pt = { t: "div", a: { id: "status", class: "card" }, c: "plain" };
    bw.assignUUID(pt);
    var pel = bw.mount("#app", pt);
    ctx = { el: pel, uuid: bw.getUUID(pel), app: document.getElementById("app") };
    return ctx;
  }
  var taco = {
    t: "div", a: { id: "status", class: "card" },
    c: [
      { t: "span", a: { id: "child", class: "inner" }, c: "old",
        o: { unmount: function() { flags.childUnmounted = true; } } },
      { t: "input", a: { name: "f", value: "v" } }
    ],
    o: {
      state: { n: 0 },
      handle: {
        ping: function() { flags.pinged = true; },
        update: function(el, d) { flags.updated = d; }
      },
      slots: { body: ".inner" },
      unmount: function() { flags.unmounted = true; },
      render: function(el) { flags.rendered = true; el.appendChild(document.createTextNode("r")); }
    }
  };
  bw.assignUUID(taco);
  var el = bw.mount("#app", taco);
  flags.rendered = false;
  ctx = { el: el, uuid: bw.getUUID(el), app: document.getElementById("app") };
  return ctx;
}

// =========================================================================
// A. Verb x target
// =========================================================================

// Every public verb whose first parameter is a target. Each entry performs
// the verb against `t` and returns true only if the verb both resolved the
// target AND did its job (not just "returned something").
var VERBS = {
  el:             function(t) { return bw.el(t) === ctx.el; },
  mount:          function(t) { var r = bw.mount(t, { t: "b", c: "new" }); return !!r && r.parentNode === ctx.el; },
  append:         function(t) { var r = bw.append(t, { t: "b", c: "new" }); return !!r && r.parentNode === ctx.el; },
  replace:        function(t) { var r = bw.replace(t, { t: "b", a: { id: "neo" } }); return !!r && r.parentNode === ctx.app && !ctx.app.contains(ctx.el); },
  refresh:        function(t) { return bw.refresh(t) === ctx.el && flags.rendered === true; },
  update:         function(t) { return bw.update(t, { x: 1 }) === ctx.el && !!flags.updated; },
  updateSlot:     function(t) { return bw.updateSlot(t, "body", "x") === true && ctx.el.querySelector(".inner").textContent === "x"; },
  patch:          function(t) { return bw.patch(t, "txt") === ctx.el && ctx.el.textContent === "txt"; },
  clear:          function(t) { return bw.clear(t) === ctx.el && ctx.el.childNodes.length === 0 && flags.childUnmounted === true; },
  remove:         function(t) { bw.remove(t); return !ctx.app.contains(ctx.el) && flags.unmounted === true; },
  unmount:        function(t) { bw.unmount(t); return flags.unmounted === true; },
  unmountChildren:function(t) { bw.unmountChildren(t); return flags.childUnmounted === true && !flags.unmounted; },
  detach:         function(t) { bw.detach(t); return !ctx.app.contains(ctx.el) && bw.el("status") === ctx.el; },
  hydrate:        function(t) { bw.hydrate(t, { o: { handle: { zap: function() {} } } }); return !!(ctx.el.bw && typeof ctx.el.bw.zap === "function"); },
  mountTree:      function(t) {
    var c = bw.create({ t: "i", o: { mounted: function() { flags.mountedI = true; } } });
    ctx.el.appendChild(c); bw.mountTree(t); return flags.mountedI === true;
  },
  syncChildren:   function(t) {
    bw.syncChildren(t, [{ id: 7 }], { key: function(i) { return i.id; }, create: function(i) { return { t: "li", c: String(i.id) }; } });
    return !!ctx.el.querySelector("li");
  },
  addClass:       function(t) { return bw.addClass(t, "on").length > 0 && ctx.el.classList.contains("on"); },
  removeClass:    function(t) { return bw.removeClass(t, "card").length > 0 && !ctx.el.classList.contains("card"); },
  toggleClass:    function(t) { return bw.toggleClass(t, "on").length > 0 && ctx.el.classList.contains("on"); },
  hasClass:       function(t) { return bw.hasClass(t, "card") === true; },
  emit:           function(t) { var got = false; ctx.el.addEventListener("bw:ping", function() { got = true; }); bw.emit(t, "ping"); return got; },
  on:             function(t) { var got = false; bw.on(t, "ping", function() { got = true; }); ctx.el.dispatchEvent(new CustomEvent("bw:ping", { detail: {} })); return got; },
  message:        function(t) { return bw.message(t, "ping") === true && flags.pinged === true; },
  formData:       function(t) { return bw.formData(t).f === "v"; },
  inspect:        function(t) { var i = bw.inspect(t, 1); return !!i && i.id === "status"; },
  render:         function(t) { return bw.render(t, "append", { t: "b" }).ok === true; }
};

// Verbs whose first parameter is a target but which are deliberately outside
// the matrix. Every exemption needs a reason a reviewer can disagree with.
var EXEMPT = {
  DOM:             "exact alias of bw.mount (same function object), covered by mount",
  $:               "the live-query half of the resolver: CSS selectors only, by contract",
  getUUID:         "takes a TACO or an element, never a string",
  toggleThemeMode: "takes a theme scope (the selector passed to applyStyles), not an element reference",
  responsive:      "a CSS generator; the selector is emitted into a stylesheet, not resolved"
};

// Query verbs answer a question; a miss is a legitimate answer and must not
// warn. Set verbs act on *every* match, and an empty match is a valid
// outcome (a selector that matches nothing yet), so they stay silent too.
// Everything else in VERBS acts on one target and must warn on a miss.
var QUERY = ["el", "hasClass", "formData", "inspect", "render"];
var SET = ["addClass", "removeClass", "toggleClass"];

// hydrate is idempotent (an element that already has el.bw is left alone), so
// it is exercised on a plain element rather than the hydrated fixture.
var PLAIN = ["hydrate"];

function targets() {
  return {
    "bare id":        "status",
    "id selector":    "#status",
    "class selector": ".card",
    "uuid token":     ctx.uuid,
    "element":        ctx.el
  };
}

describe("one vocabulary: every verb accepts every target form", function() {

  it("meta: every target-taking verb in src/bitwrench.js is in the matrix or exempted with a reason", function() {
    var re = /\/\*\*((?:(?!\*\/)[\s\S])*?)\*\/\s*\nbw\.(\w+)\s*=\s*function\s*\(/g;
    var m, found = [];
    while ((m = re.exec(SRC))) {
      var doc = m[1], name = m[2];
      if (name.charAt(0) === "_") continue;
      var p = /@param\s*\{([^}]*)\}\s*\[?(\w+)/.exec(doc);
      if (!p) continue;
      var type = p[1], pname = p[2];
      var takesTarget = /Element/.test(type) || ["ref", "target", "id", "el", "selector"].indexOf(pname) !== -1;
      if (takesTarget) found.push(name);
    }
    assert.ok(found.length >= 25, "expected to find the verbs by JSDoc, found " + found.length);
    var missing = found.filter(function(n) { return !VERBS[n] && !EXEMPT[n]; });
    assert.deepStrictEqual(missing, [], "verbs that take a target but are in neither VERBS nor EXEMPT: " + missing.join(", "));
    Object.keys(VERBS).forEach(function(n) {
      assert.strictEqual(typeof bw[n], "function", "VERBS lists bw." + n + " which does not exist");
    });
  });

  Object.keys(VERBS).forEach(function(verb) {
    describe("bw." + verb, function() {
      ["bare id", "id selector", "class selector", "uuid token", "element"].forEach(function(form) {
        it("resolves a " + form, function() {
          setup(PLAIN.indexOf(verb) !== -1);
          var t = targets()[form];
          var ok;
          var warned = captureWarnings(function() { ok = VERBS[verb](t); });
          assert.strictEqual(ok, true, "bw." + verb + "(" + form + ") did not resolve and act");
          assert.deepStrictEqual(warned.filter(function(w) { return /not found/.test(w); }), [],
            "bw." + verb + "(" + form + ") warned about a target that exists");
        });
      });

      if (QUERY.indexOf(verb) === -1 && SET.indexOf(verb) === -1) {
        it("warns with its own name on a miss, and does nothing", function() {
          setup(PLAIN.indexOf(verb) !== -1);
          var warned = captureWarnings(function() { VERBS[verb]("no_such_thing"); });
          var mine = warned.filter(function(w) { return w.indexOf("bw." + verb + ":") === 0 && /not found/.test(w); });
          assert.strictEqual(mine.length, 1, "bw." + verb + "('no_such_thing') should warn exactly once with its own name; got: " + JSON.stringify(warned));
          assert.ok(ctx.app.contains(ctx.el) && !flags.unmounted && !flags.childUnmounted,
            "bw." + verb + " acted on something although its target did not resolve");
        });
      } else {
        it("stays silent on a miss (a query or set verb may legitimately find nothing)", function() {
          setup();
          var warned = captureWarnings(function() { VERBS[verb]("no_such_thing"); });
          assert.deepStrictEqual(warned, [], "bw." + verb + " is a query and must not warn on a miss");
        });
      }
    });
  });
});

// =========================================================================
// B. Sink x content
// =========================================================================

// Every place content can be handed to bitwrench after mount. Each sets the
// content of the `.inner` child (id "child") to `v`.
var SINKS = {
  "slot setter el.bw.setBody":  function(v) { ctx.el.bw.setBody(v); },
  "bw.updateSlot":              function(v) { bw.updateSlot(ctx.el, "body", v); },
  "bw.patch":                   function(v) { bw.patch("child", v); },
  "bw.el(ref, apply)":          function(v) { bw.el("child", v); },
  "bw.$(sel, apply)":           function(v) { bw.$("#child", v); }
};

var CONTENT = {
  "text":           "plain",
  "number":         42,
  "zero":           0,
  "empty string":   "",
  "TACO":           { t: "b", c: "x" },
  "array":          [{ t: "b", c: "a" }, " and ", { t: "i", c: "b" }],
  "nested array":   [[{ t: "b", c: "n" }], [[{ t: "i", c: "m" }]]],
  "bw.raw":         bw.raw("<p>hi</p>"),
  "null":           null,
  // #123: `cond && taco` yields false when the condition is off. Booleans
  // render nothing in every sink, as the docs have said since 2.0.
  "false":          false,
  "true":           true
};

function expectedHTML(v) {
  if (v == null || typeof v === "boolean") return "";
  if (typeof v === "object") return bw.html(v);
  return String(v);
}

describe("one vocabulary: every content sink accepts every content form", function() {
  Object.keys(SINKS).forEach(function(sink) {
    describe(sink, function() {
      Object.keys(CONTENT).forEach(function(form) {
        it("renders " + form + " the same way bw.html() does", function() {
          setup();
          var v = CONTENT[form];
          SINKS[sink](v);
          var target = ctx.el.querySelector(".inner");
          assert.ok(target, "sink detached or replaced the slot element itself");
          var got = target.innerHTML;
          assert.strictEqual(got, expectedHTML(v), sink + " with " + form);
          assert.ok(got.indexOf("[object Object]") === -1, sink + " stringified an object");
        });
      });

      it("runs unmount hooks on the children it replaces", function() {
        setup();
        var inner = ctx.el.querySelector(".inner");
        bw.mount(inner, { t: "em", o: { unmount: function() { flags.emGone = true; } } });
        SINKS[sink]("replaced");
        assert.strictEqual(flags.emGone, true, sink + " replaced a lifecycle-managed child without unmounting it");
      });
    });
  });
});

// =========================================================================
// C. Factory contract
// =========================================================================

// A props bag wide enough that every factory renders something. Keys a
// factory does not read produce unknown-option warnings, which the
// assertions below filter for the one key under test.
var BAG = {
  text: "t", label: "l", title: "t", content: "c", value: 1,
  items: [{ text: "a", label: "a", title: "a", content: "a" }],
  children: [], tabs: [{ label: "a", content: "b" }], steps: [{ label: "a" }],
  data: [[1]], headers: ["a"], rows: [[1]], columns: ["a"], features: [], chips: [],
  options: [{ value: "a", label: "a" }], src: "x.png", trigger: "t", code: "1", pages: 2,
  input: { t: "input" }
};

function factories() {
  return Object.keys(bw).filter(function(k) {
    return /^make[A-Z]/.test(k) && k !== "makeStyles" && typeof bw[k] === "function";
  }).sort();
}

function rootClasses(taco) {
  var c = taco && taco.a ? taco.a.class : "";
  if (Array.isArray(c)) c = c.filter(Boolean).join(" ");
  return String(c || "").split(/\s+/).filter(Boolean);
}

function withBag(extra) { return Object.assign({}, BAG, extra); }

describe("factory contract: every make*() takes `id` and `class`", function() {
  var names = factories();

  it("finds the factories", function() {
    assert.ok(names.length >= 45, "only " + names.length + " factories found");
  });

  names.forEach(function(name) {
    describe("bw." + name, function() {
      beforeEach(function() { freshDOM(); bw._propWarnReset(); });

      it("merges a caller `class` with its own classes", function() {
        var base, probe, warned;
        warned = captureWarnings(function() {
          base = rootClasses(bw[name](withBag({})));
          probe = rootClasses(bw[name](withBag({ class: "probe" })));
        });
        assert.ok(probe.indexOf("probe") !== -1, name + ": caller class did not reach the root (" + probe.join(" ") + ")");
        base.forEach(function(c) {
          assert.ok(probe.indexOf(c) !== -1, name + ": caller class removed the component's own class " + c);
        });
        assert.deepStrictEqual(warned.filter(function(w) { return /"class"/.test(w); }), [],
          name + ": warned about `class`");
      });

      it("accepts `className` as a deprecated alias and warns exactly once", function() {
        var a, b, warned;
        warned = captureWarnings(function() {
          a = rootClasses(bw[name](withBag({ className: "probe" })));
          b = rootClasses(bw[name](withBag({ className: "probe" })));
        });
        var viaClass = rootClasses(bw[name](withBag({ class: "probe" })));
        assert.deepStrictEqual(a.sort(), viaClass.sort(), name + ": className and class produced different roots");
        assert.deepStrictEqual(b.sort(), viaClass.sort());
        var dep = warned.filter(function(w) { return /"className" is deprecated/.test(w); });
        assert.strictEqual(dep.length, 1, name + ": expected exactly one className deprecation warning, got " + JSON.stringify(warned));
        assert.ok(/deprecated/.test(dep[0]) && dep[0].indexOf("bw." + name) === 0, name + ": deprecation warning should name the factory and say deprecated: " + dep[0]);
      });

      it("puts a caller `id` on its addressable element, once, without warning", function() {
        var html, warned;
        warned = captureWarnings(function() { html = bw.html(bw[name](withBag({ id: "pid_probe" }))); });
        var count = (html.match(/ id="pid_probe"/g) || []).length;
        assert.strictEqual(count, 1, name + ": id should appear exactly once, found " + count);
        assert.deepStrictEqual(warned.filter(function(w) { return /"id"/.test(w); }), [],
          name + ": warned about `id`");
        var el = bw.mount("#app", bw[name](withBag({ id: "pid_probe" })));
        assert.ok(el, name + ": did not mount");
        assert.ok(bw.el("pid_probe"), name + ": bw.el() cannot find the element by the id the caller gave");
      });
    });
  });
});

// #123 -- a boolean in a content array rendered as the text "false"/"true" on
// both paths while three docs said it was skipped. The rule now matches the
// docs: null, undefined and booleans render nothing; numbers (including 0)
// still render.
describe("booleans in content render nothing (#123)", function() {
  var taco = { t: "div", c: [false, "a", null, true, 0, undefined, [false, { t: "b", c: "x" }]] };
  it("bw.html skips false and true, keeps 0", function() {
    assert.strictEqual(bw.html(taco), "<div>a0<b>x</b></div>");
    assert.strictEqual(bw.html(false), "");
    assert.strictEqual(bw.html(true), "");
  });
  it("bw.create skips false and true, keeps 0", function() {
    setup();
    var el = bw.create(taco);
    assert.strictEqual(el.innerHTML, "a0<b>x</b>");
    assert.strictEqual(bw.create({ t: "div", c: false }).textContent, "");
  });
  it("the cond && taco idiom renders nothing when the condition is off", function() {
    var isAdmin = false;
    assert.strictEqual(bw.html({ t: "nav", c: [{ t: "a", c: "Home" }, isAdmin && { t: "a", c: "Admin" }] }),
      "<nav><a>Home</a></nav>");
  });
});

// ---------------------------------------------------------------------------
// D. Attribute booleans: one rule across every attribute sink (#124)
//
// Through 2.1.13 bw.html() and bw.create() treated every boolean as an HTML
// boolean attribute (true = present-and-empty, false = absent), which is wrong
// for ARIA states and the enumerated attributes whose values are the words
// "true"/"false"; and bw.patch() with an attribute object stringified every
// value, so `{ hidden: false }` wrote hidden="false". The serialiser is now
// one function (_attrValue) and this matrix checks the set, not an instance.
// ---------------------------------------------------------------------------

describe("D. Attribute booleans: bw.html, bw.create and bw.patch agree (#124)", function() {
  var ATTRS = {
    'aria-pressed': true, 'aria-expanded': false, 'aria-hidden': false, 'aria-label': 'Menu',
    draggable: true, contenteditable: false, spellcheck: true, translate: false,
    hidden: false, disabled: true, required: true, checked: false,
    title: null, 'data-x': undefined, tabindex: 0
  };
  var EXPECT = {
    'aria-pressed': 'true', 'aria-expanded': 'false', 'aria-hidden': 'false', 'aria-label': 'Menu',
    draggable: 'true', contenteditable: 'false', spellcheck: 'true', translate: 'no',
    disabled: '', required: '', tabindex: '0'
  };
  var ABSENT = ['hidden', 'checked', 'title', 'data-x'];

  function attrMap(el) {
    var m = {};
    for (var i = 0; i < el.attributes.length; i++) m[el.attributes[i].name] = el.attributes[i].value;
    delete m['class'];
    return m;
  }
  function check(sink, m) {
    Object.keys(EXPECT).forEach(function(k) { assert.strictEqual(m[k], EXPECT[k], sink + ': ' + k); });
    ABSENT.forEach(function(k) { assert.ok(!(k in m), sink + ': ' + k + ' should be absent, got ' + JSON.stringify(m[k])); });
  }
  function fromHtml(taco) {
    // Parse the string sink's output back into attributes so all three sinks
    // are compared on the same footing.
    var holder = document.createElement('div');
    holder.innerHTML = bw.html(taco);
    return holder.firstChild;
  }

  beforeEach(freshDOM);

  it("bw.html(): the word for ARIA and enumerated attributes, presence for HTML booleans", function() {
    var html = bw.html({ t: "button", a: ATTRS, c: "Menu" });
    assert.ok(html.indexOf('aria-pressed="true"') !== -1 && html.indexOf('aria-expanded="false"') !== -1, html);
    assert.ok(html.indexOf('draggable="true"') !== -1 && html.indexOf('translate="no"') !== -1, html);
    assert.ok(/<button[^>]* disabled[ >]/.test(html) && !/ hidden[ >]/.test(html), html);
    check('html', attrMap(fromHtml({ t: "button", a: ATTRS })));
  });

  it("bw.create(): the same", function() {
    check('create', attrMap(bw.create({ t: "button", a: ATTRS })));
  });

  it("bw.patch(ref, attrs): the same, and false / null remove what was there", function() {
    var el = bw.create({ t: "button", a: { hidden: true, checked: true, title: "old", 'data-x': "1" } });
    bw.patch(el, ATTRS);
    check('patch', attrMap(el));
  });

  it("bw.patch(ref, value, attr): the third-argument form uses the same rule", function() {
    var el = bw.create({ t: "button", a: { hidden: true } });
    bw.patch(el, false, 'hidden');
    bw.patch(el, true, 'aria-expanded');
    bw.patch(el, true, 'disabled');
    bw.patch(el, 3, 'tabindex');
    assert.deepStrictEqual(attrMap(el), { 'aria-expanded': 'true', disabled: '', tabindex: '3' });
  });

  it("the three sinks produce identical attribute maps for the whole matrix", function() {
    var viaHtml = attrMap(fromHtml({ t: "button", a: ATTRS }));
    var viaCreate = attrMap(bw.create({ t: "button", a: ATTRS }));
    var el = bw.create({ t: "button" });
    bw.patch(el, ATTRS);
    assert.deepStrictEqual(viaCreate, viaHtml, 'create vs html');
    assert.deepStrictEqual(attrMap(el), viaHtml, 'patch vs html');
  });

  it("meta: no sink special-cases booleans inline; the rule lives in _attrValue", function() {
    assert.ok(!/value === (true|false)\b/.test(SRC), 'a sink compares a value to true/false instead of calling _attrValue');
    assert.ok((SRC.match(/= _attrValue\(/g) || []).length >= 3, 'html, create and _setAttr (patch) all call _attrValue');
  });
});

// ---------------------------------------------------------------------------
// E. The `update` handle is one dispatch target (#128). bw.update(ref, data)
// delivers to el.bw.update(data); syncChildren, the list form of the same
// idea, did not, so a kept row with an update handle was moved and left
// showing its old data unless the caller wrote update: (el, it) =>
// el.bw.update(it) by hand.
// ---------------------------------------------------------------------------

describe("E. syncChildren dispatches kept rows to their update handle (#128)", function() {
  beforeEach(freshDOM);
  function row(it) {
    return { t: "li", c: String(it.n), o: { handle: { update: function(el, it2) { bw.patch(el, String(it2.n)); } } } };
  }
  var key = function(it) { return it.id; };

  it("without opts.update, a kept row receives the item through el.bw.update", function() {
    var list = bw.mount("#app", { t: "ul" });
    bw.syncChildren(list, [{ id: "a", n: 1 }, { id: "b", n: 2 }], { key: key, create: row });
    var a = list.children[0];
    bw.syncChildren(list, [{ id: "b", n: 20 }, { id: "a", n: 10 }], { key: key, create: row });
    assert.strictEqual(list.children[1], a, "the same node, moved");
    assert.strictEqual(a.textContent, "10");
    assert.strictEqual(list.children[0].textContent, "20");
  });

  it("an explicit opts.update still wins", function() {
    var list = bw.mount("#app", { t: "ul" });
    bw.syncChildren(list, [{ id: "a", n: 1 }], { key: key, create: row });
    var calls = 0;
    bw.syncChildren(list, [{ id: "a", n: 2 }], { key: key, create: row, update: function(el, it) { calls++; el.textContent = "custom " + it.n; } });
    assert.strictEqual(calls, 1);
    assert.strictEqual(list.children[0].textContent, "custom 2");
  });

  it("a row with neither is only moved, as before", function() {
    var list = bw.mount("#app", { t: "ul" });
    var plain = function(it) { return { t: "li", c: String(it.n) }; };
    bw.syncChildren(list, [{ id: "a", n: 1 }, { id: "b", n: 2 }], { key: key, create: plain });
    bw.syncChildren(list, [{ id: "b", n: 9 }, { id: "a", n: 9 }], { key: key, create: plain });
    assert.strictEqual(list.children[0].textContent, "2");
    assert.strictEqual(list.children[1].textContent, "1");
  });

  it("bw.update and syncChildren reach the same handle", function() {
    var list = bw.mount("#app", { t: "ul" });
    bw.syncChildren(list, [{ id: "a", n: 1 }], { key: key, create: row });
    bw.update(list.children[0], { n: 5 });
    assert.strictEqual(list.children[0].textContent, "5");
    bw.syncChildren(list, [{ id: "a", n: 6 }], { key: key, create: row });
    assert.strictEqual(list.children[0].textContent, "6");
  });
});

// ---------------------------------------------------------------------------
// F. The content sink skips an unchanged string (#129). Slot setters, bw.patch
// with a string and bw.el(ref, apply) share _applyTo, so one check covers all.
// ---------------------------------------------------------------------------

describe("F. the content sink skips the write when the string is unchanged (#129)", function() {
  beforeEach(freshDOM);

  it("a slot setter with the same string keeps the text node", function() {
    var card = bw.mount("#app", { t: "div", c: [{ t: "p", a: { class: "meta" }, c: "3 items" }], o: { slots: { meta: ".meta" } } });
    var node = card.querySelector(".meta").firstChild;
    card.bw.setMeta("3 items");
    assert.strictEqual(card.querySelector(".meta").firstChild, node, "same node");
    card.bw.setMeta("4 items");
    assert.notStrictEqual(card.querySelector(".meta").firstChild, node, "a different string replaces");
    assert.strictEqual(card.bw.getMeta(), "4 items");
  });

  it("bw.patch with a string and a number use the same rule", function() {
    var el = bw.mount("#app", { t: "span", c: "5" });
    var node = el.firstChild;
    bw.patch(el, 5);
    assert.strictEqual(el.firstChild, node);
    bw.patch(el, "6");
    assert.strictEqual(el.textContent, "6");
  });

  it("TACO and array content always replace; mixed children are not short-circuited", function() {
    var el = bw.mount("#app", { t: "div", c: "x" });
    var node = el.firstChild;
    bw.patch(el, { t: "b", c: "x" });
    assert.notStrictEqual(el.firstChild, node);
    assert.strictEqual(el.innerHTML, "<b>x</b>");
    bw.patch(el, "x");
    assert.strictEqual(el.innerHTML, "x", "a string after a TACO still writes");
    var two = bw.mount("#app", { t: "div", c: ["a", { t: "i", c: "b" }] });
    bw.patch(two, "ab");
    assert.strictEqual(two.innerHTML, "ab");
  });

  it("empty string, null and boolean clear once and are then no-ops", function() {
    var el = bw.mount("#app", { t: "span", c: "gone" });
    bw.patch(el, null);
    assert.strictEqual(el.childNodes.length, 0);
    bw.patch(el, false);
    bw.patch(el, "");
    assert.strictEqual(el.childNodes.length, 0);
  });
});
