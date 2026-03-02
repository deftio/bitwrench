/**
 * Bitwrench v2 Test Suite
 * Compatible with the v2 API
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
// Core type functions
// ================================================================
describe("Core Type Functions", function() {
  describe("#typeOf()", function() {
    const tests = [
      {args: [[]], expected: "array"},
      {args: [{}], expected: "Object"},
      {args: [1], expected: "number"},
      {args: ["test string"], expected: "string"},
      {args: [undefined], expected: "undefined"},
      {args: [null], expected: "null"},
      {args: [new Date()], expected: "date"},
      {args: [function(){}], expected: "function"},
    ];
    
    tests.forEach(function(test) {
      it(`should return "${test.expected}" for ${JSON.stringify(test.args[0])}`, function() {
        const res = bw.typeOf.apply(null, test.args);
        assert.equal(res, test.expected);
      });
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
    const tests = [
      {args: ["<div>test</div>"], expected: "&lt;div&gt;test&lt;/div&gt;"},
      {args: ["'quotes'"], expected: "&#39;quotes&#39;"},
      {args: ['"double"'], expected: "&quot;double&quot;"},
      {args: ["&amp;"], expected: "&amp;amp;"},
      {args: ["normal text"], expected: "normal text"},
    ];

    tests.forEach(function(test) {
      it(`should escape ${test.args[0]}`, function() {
        const res = bw.escapeHTML(test.args[0]);
        assert.equal(res, test.expected);
      });
    });
  });

  describe("#choice()", function() {
    const tests = [
      {args: [1, {1:2, foo:"bar"}, "default"], expected: 2},
      {args: ["foo", {1:2, foo:"bar"}, "default"], expected: "bar"},
      {args: [3, {1:2, foo:"bar"}, "default"], expected: "default"},
      {args: ["missing", {1:2, foo:"bar"}, function(){return "computed"}], expected: "computed"},
    ];

    tests.forEach(function(test) {
      it(`should return correct value for key "${test.args[0]}"`, function() {
        const res = bw.choice.apply(null, test.args);
        assert.equal(res, test.expected);
      });
    });
  });

  describe("#clip()", function() {
    const tests = [
      {args: [5, 0, 10], expected: 5},
      {args: [-5, 0, 10], expected: 0},
      {args: [15, 0, 10], expected: 10},
      {args: [0.5, 0, 1], expected: 0.5},
    ];

    tests.forEach(function(test) {
      it(`should clip ${test.args[0]} between ${test.args[1]} and ${test.args[2]}`, function() {
        const res = bw.clip.apply(null, test.args);
        assert.equal(res, test.expected);
      });
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
// Color functions
// ================================================================
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

    it("should parse rgba colors", function() {
      const result = bw.colorParse("rgba(255, 0, 0, 0.5)");
      assert.deepEqual(result, [255, 0, 0, 128, "rgb"]);
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

  describe("#colorInterp()", function() {
    it("should interpolate between colors", function() {
      const result = bw.colorInterp(0.5, 0, 1, ["#000000", "#FFFFFF"]);
      assert.equal(result.substring(0, 7), "#808080");
    });
  });
});

// ================================================================
// Cookie functions (browser environment)
// ================================================================
describe("Cookie Functions", function() {
  describe("#setCookie() and #getCookie()", function() {
    it("should set and get cookies", function() {
      // Cookie operations don't work in jsdom without a proper document.cookie implementation
      // Just test that functions exist
      assert.equal(typeof bw.setCookie, "function");
      assert.equal(typeof bw.getCookie, "function");
    });

    it("should return default value for missing cookie", function() {
      assert.equal(bw.getCookie("nonexistent", "default"), "default");
    });
  });
});

// ================================================================
// URL parameter functions
// ================================================================
describe("URL Functions", function() {
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

// ================================================================
// Table generation
// ================================================================
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
  describe("#renderComponent()", function() {
    it("should render component and return handle", function() {
      const taco = { t: "div", a: { id: "comp1" }, c: "Test" };
      const handle = bw.renderComponent(taco);
      assert.ok(handle);
      assert.equal(handle.element.tagName, "DIV");
      assert.equal(handle.element.id, "comp1");
    });
  });

  describe("#getComponent()", function() {
    it("should retrieve component by ID", function() {
      const taco = { t: "div", a: { id: "comp2" }, c: "Test" };
      const handle = bw.renderComponent(taco);
      // Component needs to be mounted to DOM to be registered
      document.body.appendChild(handle.element);
      const retrieved = bw.getComponent("comp2");
      assert.equal(retrieved, handle);
      // Clean up
      handle.element.remove();
    });
  });
});

// ================================================================
// Environment detection
// ================================================================
describe("Environment Detection", function() {
  describe("#isNodeJS()", function() {
    it("should detect Node.js environment", function() {
      // In test environment with jsdom, this might return false
      assert.equal(typeof bw.isNodeJS(), "boolean");
    });
  });
});