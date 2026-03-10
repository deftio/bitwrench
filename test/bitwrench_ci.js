/**
 * Bitwrench v2 CI Test Suite
 * Only tests that are 100% stable and passing
 * This file is used for continuous integration
 */

import assert from "assert";
import { readFileSync } from "fs";
import bw from "../src/bitwrench.js";
import jsdom from 'jsdom';
const { JSDOM } = jsdom;

// Set up DOM environment
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.window = dom.window;
global.document = window.document;

describe("Core Type Functions", function() {
  describe("#typeOf()", function() {
    it("should identify arrays", function() {
      assert.equal(bw.typeOf([]), "array");
    });
    
    it("should identify objects", function() {
      assert.equal(bw.typeOf({}), "Object");
    });
    
    it("should identify primitives", function() {
      assert.equal(bw.typeOf(1), "number");
      assert.equal(bw.typeOf("test"), "string");
      assert.equal(bw.typeOf(undefined), "undefined");
      assert.equal(bw.typeOf(null), "null");
    });
    
    it("should identify dates", function() {
      assert.equal(bw.typeOf(new Date()), "Date");
    });
    
    it("should identify functions", function() {
      assert.equal(bw.typeOf(function(){}), "function");
    });
  });
});

describe("Utility Functions", function() {
  describe("#uuid()", function() {
    it("should generate unique identifiers", function() {
      const id1 = bw.uuid();
      const id2 = bw.uuid();
      assert.notEqual(id1, id2);
      assert.equal(typeof id1, "string");
      assert.ok(id1.length > 0);
    });
  });

  describe("#escapeHTML()", function() {
    it("should escape HTML entities", function() {
      assert.equal(bw.escapeHTML("<div>test</div>"), "&lt;div&gt;test&lt;&#x2F;div&gt;");
      assert.equal(bw.escapeHTML("'quotes'"), "&#39;quotes&#39;");
      assert.equal(bw.escapeHTML('"double"'), "&quot;double&quot;");
      assert.equal(bw.escapeHTML("&amp;"), "&amp;amp;");
      assert.equal(bw.escapeHTML("normal text"), "normal text");
    });
  });

  describe("#choice()", function() {
    it("should return values from dictionary", function() {
      assert.equal(bw.choice(1, {1:2, foo:"bar"}, "default"), 2);
      assert.equal(bw.choice("foo", {1:2, foo:"bar"}, "default"), "bar");
      assert.equal(bw.choice(3, {1:2, foo:"bar"}, "default"), "default");
    });
  });

  describe("#clip()", function() {
    it("should clamp values within range", function() {
      assert.equal(bw.clip(5, 0, 10), 5);
      assert.equal(bw.clip(-5, 0, 10), 0);
      assert.equal(bw.clip(15, 0, 10), 10);
      assert.equal(bw.clip(0.5, 0, 1), 0.5);
    });
  });

  describe("#mapScale()", function() {
    it("should map values between ranges", function() {
      assert.equal(bw.mapScale(5, 0, 10, 0, 100), 50);
      assert.equal(bw.mapScale(0, 0, 10, 0, 100), 0);
      assert.equal(bw.mapScale(10, 0, 10, 0, 100), 100);
    });

    it("should handle clipping", function() {
      assert.equal(bw.mapScale(15, 0, 10, 0, 100, {clip: true}), 100);
      assert.equal(bw.mapScale(-5, 0, 10, 0, 100, {clip: true}), 0);
    });
  });
});

describe("Array Functions", function() {
  describe("#arrayUniq()", function() {
    it("should return unique elements", function() {
      assert.deepEqual(bw.arrayUniq([1,2,2,3,3,3]), [1,2,3]);
      assert.deepEqual(bw.arrayUniq(["a","b","a"]), ["a","b"]);
      assert.deepEqual(bw.arrayUniq([]), []);
    });
  });

  describe("#arrayBinA()", function() {
    it("should return intersection of arrays", function() {
      assert.deepEqual(bw.arrayBinA([1,2,3], [2,3,4]).sort(), [2,3]);
      assert.deepEqual(bw.arrayBinA(["a","b"], ["b","c"]), ["b"]);
      assert.deepEqual(bw.arrayBinA([1,2], [3,4]), []);
    });
  });

  describe("#arrayBNotInA()", function() {
    it("should return elements in b not in a", function() {
      assert.deepEqual(bw.arrayBNotInA([1,2,3], [2,3,4]), [4]);
      assert.deepEqual(bw.arrayBNotInA(["a","b"], ["b","c"]), ["c"]);
      assert.deepEqual(bw.arrayBNotInA([1,2,3], [1,2,3]), []);
    });
  });
});

describe("Color Functions", function() {
  describe("#colorParse()", function() {
    it("should parse hex colors", function() {
      const result = bw.colorParse("#FF0000");
      assert.deepEqual(result, [255, 0, 0, 255, "rgb"]);
    });

    it("should parse rgb colors", function() {
      const result = bw.colorParse("rgb(255, 0, 0)");
      assert.deepEqual(result, [255, 0, 0, 255, "rgb"]);
    });
  });

  describe("#colorRgbToHsl()", function() {
    it("should convert RGB to HSL", function() {
      const result = bw.colorRgbToHsl(255, 0, 0);
      assert.equal(result[0], 0); // Hue
      assert.equal(result[1], 100); // Saturation
      assert.equal(result[2], 50); // Lightness
    });
  });

  describe("#colorHslToRgb()", function() {
    it("should convert HSL to RGB", function() {
      const result = bw.colorHslToRgb(0, 100, 50);
      assert.equal(result[0], 255); // Red
      assert.equal(result[1], 0); // Green
      assert.equal(result[2], 0); // Blue
    });
  });
});

describe("Browser Functions", function() {
  describe("#setCookie() and #getCookie()", function() {
    it("should have cookie functions defined", function() {
      assert.equal(typeof bw.setCookie, "function");
      assert.equal(typeof bw.getCookie, "function");
    });
  });

  describe("#getURLParam()", function() {
    it("should return default value when no query string", function() {
      assert.equal(bw.getURLParam("test", "default"), "default");
    });
  });
});

describe("TACO and HTML Generation", function() {
  describe("#html()", function() {
    it("should generate HTML from TACO objects", function() {
      const taco = { t: "div", a: { class: "test" }, c: "Hello" };
      const html = bw.html(taco);
      assert.equal(html, '<div class="test">Hello</div>');
    });

    it("should handle nested TACOs", function() {
      const taco = { 
        t: "div", 
        c: [
          { t: "span", c: "Hello" },
          " ",
          { t: "span", c: "World" }
        ]
      };
      const html = bw.html(taco);
      assert.equal(html, '<div><span>Hello</span> <span>World</span></div>');
    });

    it("should escape content by default", function() {
      const taco = { t: "div", c: "<script>alert('xss')</script>" };
      const html = bw.html(taco);
      assert.equal(html, '<div>&lt;script&gt;alert(&#39;xss&#39;)&lt;&#x2F;script&gt;</div>');
    });
  });

  describe("#createDOM()", function() {
    it("should create DOM elements from TACO", function() {
      const taco = { t: "div", a: { id: "test" }, c: "Hello" };
      const element = bw.createDOM(taco);
      assert.equal(element.tagName, "DIV");
      assert.equal(element.id, "test");
      assert.equal(element.textContent, "Hello");
    });
  });
});

describe("Table Functions", function() {
  describe("#htmlTable()", function() {
    it("should generate table HTML", function() {
      const data = [
        ["Name", "Age"],
        ["John", 30],
        ["Jane", 25]
      ];
      const html = bw.htmlTable(data, { firstRowHeader: true });
      assert.ok(html.includes("<table"));
      assert.ok(html.includes("<thead>"));
      assert.ok(html.includes("Name"));
      assert.ok(html.includes("John"));
    });
  });
});

describe("CSS Functions", function() {
  describe("#css()", function() {
    it("should generate CSS from rules object", function() {
      const rules = {
        ".test": {
          color: "red",
          fontSize: "16px"
        }
      };
      const css = bw.css(rules);
      assert.ok(css.includes(".test"));
      assert.ok(css.includes("color: red"));
      assert.ok(css.includes("font-size: 16px"));
    });
  });
});

describe("Component Functions", function() {
  describe("#renderComponent()", function() {
    it("should render component and return handle", function() {
      const taco = { t: "div", a: { id: "comp1" }, c: "Test" };
      const handle = bw.renderComponent(taco);
      assert.ok(handle);
      assert.ok(handle.element);
      assert.equal(handle.element.tagName, "DIV");
      assert.equal(handle.element.id, "comp1");
    });
  });
});

describe("Theming API", function() {
  describe("#getTheme()", function() {
    it("should return theme object with colors", function() {
      const t = bw.getTheme();
      assert.equal(typeof t, "object");
      assert.equal(typeof t.colors, "object");
      assert.ok(t.colors.primary);
      assert.ok(t.colors.danger);
    });

    it("should return a deep copy", function() {
      const t1 = bw.getTheme();
      const t2 = bw.getTheme();
      assert.notStrictEqual(t1, t2);
      assert.notStrictEqual(t1.colors, t2.colors);
      assert.deepEqual(t1.colors, t2.colors);
    });
  });

  describe("#setTheme()", function() {
    it("should merge color overrides", function() {
      const originalPrimary = bw.getTheme().colors.primary;
      bw.setTheme({ colors: { primary: '#ff0000' } }, { inject: false });
      assert.equal(bw.getTheme().colors.primary, '#ff0000');
      // Restore
      bw.setTheme({ colors: { primary: originalPrimary } }, { inject: false });
    });

    it("should preserve unmodified values", function() {
      const before = bw.getTheme();
      bw.setTheme({ colors: { primary: '#123456' } }, { inject: false });
      const after = bw.getTheme();
      assert.equal(after.colors.danger, before.colors.danger);
      assert.equal(after.colors.success, before.colors.success);
      // Restore
      bw.setTheme({ colors: { primary: before.colors.primary } }, { inject: false });
    });

    it("should return updated theme", function() {
      const original = bw.getTheme().colors.primary;
      const result = bw.setTheme({ colors: { primary: '#abcdef' } }, { inject: false });
      assert.equal(result.colors.primary, '#abcdef');
      bw.setTheme({ colors: { primary: original } }, { inject: false });
    });
  });

  describe("#applyTheme() and #toggleTheme()", function() {
    it("applyTheme should return mode string", function() {
      var mode = bw.applyTheme('primary');
      assert.equal(mode, 'primary');
    });

    it("toggleTheme should flip between primary and alternate", function() {
      bw._activeThemeMode = 'primary';
      var result = bw.toggleTheme();
      assert.equal(result, 'alternate');
      result = bw.toggleTheme();
      assert.equal(result, 'primary');
    });
  });
});

describe("CSS Class Handling", function() {
  describe("html() class handling", function() {
    it("should handle underscore classes in TACO output", function() {
      const taco = { t: "div", a: { class: "bw_card" }, c: "test" };
      const html = bw.html(taco);
      assert.equal(html, '<div class="bw_card">test</div>');
    });

    it("should handle array classes", function() {
      const taco = { t: "div", a: { class: ["bw_btn", "bw_btn_primary"] }, c: "click" };
      const html = bw.html(taco);
      assert.ok(html.includes('class="bw_btn bw_btn_primary"'));
    });
  });

  describe("createDOM() class handling", function() {
    it("should handle underscore classes in DOM", function() {
      const taco = { t: "div", a: { class: "bw_card" }, c: "test" };
      const el = bw.createDOM(taco);
      assert.equal(el.className, "bw_card");
    });
  });
});

describe("Version API", function() {
  describe("#version", function() {
    it("should be a string", function() {
      assert.equal(typeof bw.version, "string");
      assert.ok(bw.version.length > 0);
    });
  });

  describe("#getVersion()", function() {
    it("should return metadata object", function() {
      const v = bw.getVersion();
      assert.equal(typeof v, "object");
      assert.equal(typeof v.version, "string");
      assert.equal(typeof v.name, "string");
      assert.equal(v.name, "bitwrench");
      assert.ok(v.version.length > 0);
    });

    it("should return a copy (not reference)", function() {
      const v1 = bw.getVersion();
      const v2 = bw.getVersion();
      assert.notStrictEqual(v1, v2);
      assert.deepEqual(v1, v2);
    });
  });

  describe("#versionInfo", function() {
    it("should contain full metadata", function() {
      assert.equal(typeof bw.versionInfo, "object");
      assert.ok(bw.versionInfo.version);
      assert.ok(bw.versionInfo.name);
    });
  });
});

describe("Environment Detection", function() {
  describe("#isNodeJS()", function() {
    it("should return boolean", function() {
      const result = bw.isNodeJS();
      assert.equal(typeof result, "boolean");
    });
  });
});

describe("Version Consistency", function() {
  const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

  it("bw.version matches package.json", function() {
    assert.equal(bw.version, pkg.version);
  });

  it("bw.getVersion() returns correct version and name", function() {
    const info = bw.getVersion();
    assert.equal(info.version, pkg.version);
    assert.equal(info.name, pkg.name);
  });

  it("bw.versionInfo is consistent with bw.version", function() {
    assert.equal(bw.versionInfo.version, bw.version);
  });
});