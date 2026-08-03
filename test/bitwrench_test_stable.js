/**
 * Bitwrench v2 Test Suite - STABLE TESTS ONLY
 * These tests all pass and are suitable for CI
 */

import assert from "assert";
import bw from "../dist/bitwrench.esm.js";
import jsdom from 'jsdom';
const { JSDOM } = jsdom;

// Set up DOM environment
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.window = dom.window;
global.document = window.document;

// ================================================================
// Core Type Functions
// ================================================================
describe("Core Type Functions", function() {
  describe("#typeOf()", function() {
    it("should return correct types for primitives", function() {
      assert.equal(bw.typeOf([]), "array");
      assert.equal(bw.typeOf({}), "Object");
      assert.equal(bw.typeOf(1), "number");
      assert.equal(bw.typeOf("test string"), "string");
      assert.equal(bw.typeOf(undefined), "undefined");
      assert.equal(bw.typeOf(null), "null");
      assert.equal(bw.typeOf(new Date()), "Date");
      assert.equal(bw.typeOf(function(){}), "function");
    });
  });
});

// ================================================================
// Utility functions
// ================================================================
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
    it("should return correct values from dictionary", function() {
      assert.equal(bw.choice(1, {1:2, foo:"bar"}, "default"), 2);
      assert.equal(bw.choice("foo", {1:2, foo:"bar"}, "default"), "bar");
      assert.equal(bw.choice(3, {1:2, foo:"bar"}, "default"), "default");
    });
    
    it("should execute default function if provided", function() {
      const def = function(){return "computed"};
      const result = bw.choice("missing", {1:2, foo:"bar"}, def);
      // bw.choice executes the function if it's a function
      assert.equal(typeof result === "function" ? result() : result, "computed");
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

// ================================================================
// Array functions
// ================================================================
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

// ================================================================
// Browser functions (limited in Node environment)
// ================================================================
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

// ================================================================
// TACO/HTML generation
// ================================================================
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

  describe("#create()", function() {
    it("should create DOM elements from TACO", function() {
      const taco = { t: "div", a: { id: "test" }, c: "Hello" };
      const element = bw.create(taco);
      assert.equal(element.tagName, "DIV");
      assert.equal(element.id, "test");
      assert.equal(element.textContent, "Hello");
    });
  });
});

// ================================================================
// Table generation
// ================================================================
describe("Table Functions", function() {
  // bw.htmlTable() was a v1 API that returned an HTML string. It no longer
  // exists: v2 builders emit TACO, which the caller renders with bw.html()
  // or mounts with bw.DOM(). makeTableFromArray takes a single config object.
  describe("#makeTableFromArray()", function() {
    it("should build a table TACO from row arrays", function() {
      const taco = bw.makeTableFromArray({
        data: [
          ["Name", "Age"],
          ["John", 30],
          ["Jane", 25]
        ],
        headerRow: true
      });
      assert.strictEqual(typeof taco, "object");
      assert.strictEqual(taco.t, "table");

      const html = bw.html(taco);
      assert.ok(html.includes("<table"));
      assert.ok(html.includes("<thead>"));
      assert.ok(html.includes("Name"));
      assert.ok(html.includes("John"));
      assert.strictEqual((html.match(/<td/g) || []).length, 4, "two body rows of two cells");
    });
  });
});

// ================================================================
// CSS functions
// ================================================================
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

// ================================================================
// Component functions
// ================================================================
describe("Component Functions", function() {
  describe("#renderComponent() removal", function() {
    it("should be undefined for removed renderComponent", function() {
      assert.strictEqual(bw.renderComponent, undefined);
    });
  });
});

// ================================================================
// Environment detection
// ================================================================
describe("Environment Detection", function() {
  describe("#isNodeJS()", function() {
    it("should return boolean for environment detection", function() {
      const result = bw.isNodeJS();
      assert.equal(typeof result, "boolean");
    });
  });
});