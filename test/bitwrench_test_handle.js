/**
 * Bitwrench o.handle / o.slots / bw.mount() Test Suite
 *
 * Tests for the handle pattern that replaces ComponentHandle:
 *   - o.handle: explicit methods on el.bw
 *   - o.slots: auto-generated setX/getX pairs on el.bw
 *   - bw.mount(): mount TACO and return root element
 *   - bw.message(): dispatch to el.bw[action]
 *   - bw.inspect(): DOM introspection with bitwrench metadata
 *   - Deprecation stubs for removed APIs
 *   - BCCL factory handles
 */

import assert from "assert";
import bw from "../src/bitwrench.js";
import jsdom from 'jsdom';
const { JSDOM } = jsdom;

var dom;

function freshDOM() {
  dom = new JSDOM('<!DOCTYPE html><html><body><div id="app"></div></body></html>');
  global.window = dom.window;
  global.document = dom.window.document;
  global.Element = dom.window.Element;
  global.DocumentFragment = dom.window.DocumentFragment;
  global.HTMLElement = dom.window.HTMLElement;
  global.CustomEvent = dom.window.CustomEvent;
  global.requestAnimationFrame = function(fn) { fn(); };
  if (bw._nodeMap) {
    var keys = Object.keys(bw._nodeMap);
    for (var i = 0; i < keys.length; i++) delete bw._nodeMap[keys[i]];
  }
  return dom;
}

// =========================================================================
// o.handle in createDOM
// =========================================================================

describe("o.handle — createDOM", function() {
  beforeEach(function() { freshDOM(); });

  it("should create el.bw with bound methods", function() {
    var el = bw.createDOM({
      t: 'div',
      o: {
        handle: {
          greet: function(el, name) { el.textContent = 'Hello ' + name; }
        }
      }
    });
    document.getElementById('app').appendChild(el);
    assert.ok(el.bw, 'el.bw should exist');
    assert.strictEqual(typeof el.bw.greet, 'function');
  });

  it("handle methods receive el as first arg (auto-bound)", function() {
    var receivedEl = null;
    var el = bw.createDOM({
      t: 'div',
      o: {
        handle: {
          test: function(el, data) { receivedEl = el; return data; }
        }
      }
    });
    document.getElementById('app').appendChild(el);
    el.bw.test('hello');
    assert.strictEqual(receivedEl, el);
  });

  it("handle methods can accept additional args", function() {
    var result = null;
    var el = bw.createDOM({
      t: 'div',
      o: {
        handle: {
          add: function(el, a, b) { result = a + b; }
        }
      }
    });
    document.getElementById('app').appendChild(el);
    el.bw.add(3, 4);
    assert.strictEqual(result, 7);
  });

  it("multiple handle methods on same element", function() {
    var el = bw.createDOM({
      t: 'div',
      o: {
        handle: {
          foo: function(el) { return 'foo'; },
          bar: function(el) { return 'bar'; }
        }
      }
    });
    assert.ok(el.bw.foo);
    assert.ok(el.bw.bar);
  });
});

// =========================================================================
// o.slots in createDOM
// =========================================================================

describe("o.slots — createDOM", function() {
  beforeEach(function() { freshDOM(); });

  it("should create setX/getX pairs for each slot", function() {
    var el = bw.createDOM({
      t: 'div',
      c: [
        { t: 'h3', a: { class: 'my_title' }, c: 'Original' },
        { t: 'p', a: { class: 'my_body' }, c: 'Body text' }
      ],
      o: {
        slots: {
          title: '.my_title',
          body: '.my_body'
        }
      }
    });
    document.getElementById('app').appendChild(el);
    assert.strictEqual(typeof el.bw.setTitle, 'function');
    assert.strictEqual(typeof el.bw.getTitle, 'function');
    assert.strictEqual(typeof el.bw.setBody, 'function');
    assert.strictEqual(typeof el.bw.getBody, 'function');
  });

  it("slot getters return text content", function() {
    var el = bw.createDOM({
      t: 'div',
      c: { t: 'span', a: { class: 'val' }, c: 'hello' },
      o: { slots: { val: '.val' } }
    });
    document.getElementById('app').appendChild(el);
    assert.strictEqual(el.bw.getVal(), 'hello');
  });

  it("slot setters update text content", function() {
    var el = bw.createDOM({
      t: 'div',
      c: { t: 'span', a: { class: 'val' }, c: 'old' },
      o: { slots: { val: '.val' } }
    });
    document.getElementById('app').appendChild(el);
    el.bw.setVal('new');
    assert.strictEqual(el.querySelector('.val').textContent, 'new');
  });

  it("slot setters accept TACO objects", function() {
    var el = bw.createDOM({
      t: 'div',
      c: { t: 'span', a: { class: 'slot' }, c: 'old' },
      o: { slots: { slot: '.slot' } }
    });
    document.getElementById('app').appendChild(el);
    el.bw.setSlot({ t: 'strong', c: 'bold text' });
    var strong = el.querySelector('.slot strong');
    assert.ok(strong, 'TACO should be rendered as DOM');
    assert.strictEqual(strong.textContent, 'bold text');
  });

  it("slot setter with null clears content", function() {
    var el = bw.createDOM({
      t: 'div',
      c: { t: 'span', a: { class: 'val' }, c: 'hello' },
      o: { slots: { val: '.val' } }
    });
    document.getElementById('app').appendChild(el);
    el.bw.setVal(null);
    assert.strictEqual(el.querySelector('.val').textContent, '');
  });
});

// =========================================================================
// Both o.handle and o.slots together
// =========================================================================

describe("o.handle + o.slots combined", function() {
  beforeEach(function() { freshDOM(); });

  it("should create both handle methods and slot accessors", function() {
    var el = bw.createDOM({
      t: 'div',
      c: { t: 'span', a: { class: 'label' }, c: 'text' },
      o: {
        handle: { reset: function(el) { el.textContent = ''; } },
        slots: { label: '.label' }
      }
    });
    assert.ok(el.bw.reset);
    assert.ok(el.bw.setLabel);
    assert.ok(el.bw.getLabel);
  });
});

// =========================================================================
// bw.mount()
// =========================================================================

describe("bw.mount()", function() {
  beforeEach(function() { freshDOM(); });

  it("should return the created element (not the container)", function() {
    var el = bw.mount('#app', { t: 'div', a: { class: 'test' }, c: 'hello' });
    assert.ok(el);
    assert.strictEqual(el.tagName, 'DIV');
    assert.ok(el.classList.contains('test'));
  });

  it("returned element has el.bw from o.handle", function() {
    var el = bw.mount('#app', {
      t: 'div',
      o: {
        handle: {
          ping: function(el) { return 'pong'; }
        }
      }
    });
    assert.ok(el.bw);
    assert.strictEqual(typeof el.bw.ping, 'function');
  });

  it("should clean up previous content", function() {
    bw.mount('#app', { t: 'p', c: 'first' });
    bw.mount('#app', { t: 'p', c: 'second' });
    var app = document.getElementById('app');
    assert.strictEqual(app.children.length, 1);
    assert.strictEqual(app.children[0].textContent, 'second');
  });

  it("should return null for missing target", function() {
    var el = bw.mount('#nonexistent', { t: 'div', c: 'test' });
    assert.strictEqual(el, null);
  });
});

// =========================================================================
// bw.message()
// =========================================================================

describe("bw.message()", function() {
  beforeEach(function() { freshDOM(); });

  it("should dispatch to el.bw[action]", function() {
    var called = false;
    var el = bw.mount('#app', {
      t: 'div',
      a: { id: 'target' },
      o: {
        handle: {
          doSomething: function(el, data) { called = data; }
        }
      }
    });
    var result = bw.message('target', 'doSomething', 42);
    assert.strictEqual(result, true);
    assert.strictEqual(called, 42);
  });

  it("should return false for missing handle method", function() {
    bw.mount('#app', {
      t: 'div',
      a: { id: 'target' },
      o: { handle: { foo: function(el) {} } }
    });
    var result = bw.message('target', 'nonexistent', null);
    assert.strictEqual(result, false);
  });

  it("should return false for missing element", function() {
    var result = bw.message('nonexistent_xyz', 'foo', null);
    assert.strictEqual(result, false);
  });
});

// =========================================================================
// bw.inspect()
// =========================================================================

describe("bw.inspect()", function() {
  beforeEach(function() { freshDOM(); });

  it("should return info object for mounted element", function() {
    bw.mount('#app', {
      t: 'div',
      a: { id: 'target' },
      o: { handle: { foo: function(el) {} } }
    });
    var info = bw.inspect('#target', 0);
    assert.ok(info);
    assert.equal(info.tag, 'div');
    assert.equal(info.id, 'target');
    assert.ok(info.handles.indexOf('foo') >= 0);
  });

  it("should return null for missing element", function() {
    var result = bw.inspect('#nonexistent');
    assert.strictEqual(result, null);
  });
});

// =========================================================================
// Deprecation stubs
// =========================================================================

describe("deprecation stubs", function() {
  it("bw.component() throws Error", function() {
    assert.throws(function() { bw.component(); }, /removed/i);
  });

  it("bw.renderComponent() throws Error", function() {
    assert.throws(function() { bw.renderComponent(); }, /removed/i);
  });

  it("bw.compile() throws Error", function() {
    assert.throws(function() { bw.compile(); }, /removed/i);
  });

  it("bw.when() throws Error", function() {
    assert.throws(function() { bw.when(); }, /removed/i);
  });

  it("bw.each() throws Error", function() {
    assert.throws(function() { bw.each(); }, /removed/i);
  });

  it("bw.compileProps() throws Error", function() {
    assert.throws(function() { bw.compileProps(); }, /removed/i);
  });

  it("bw.flush() does NOT throw (no-op)", function() {
    assert.doesNotThrow(function() { bw.flush(); });
  });
});

// =========================================================================
// BCCL factory handles
// =========================================================================

describe("BCCL — makeCard slots", function() {
  beforeEach(function() { freshDOM(); });

  it("should have setTitle/getTitle", function() {
    var el = bw.mount('#app', bw.makeCard({ title: 'Original', content: 'Body' }));
    assert.ok(el.bw, 'el.bw should exist');
    assert.strictEqual(typeof el.bw.setTitle, 'function');
    assert.strictEqual(typeof el.bw.getTitle, 'function');
  });

  it("setTitle updates the card title", function() {
    var el = bw.mount('#app', bw.makeCard({ title: 'Old Title', content: 'Body' }));
    el.bw.setTitle('New Title');
    assert.strictEqual(el.querySelector('.bw_card_title').textContent, 'New Title');
  });

  it("getTitle returns current title text", function() {
    var el = bw.mount('#app', bw.makeCard({ title: 'Test', content: 'Body' }));
    assert.strictEqual(el.bw.getTitle(), 'Test');
  });

  it("setContent updates the card body", function() {
    var el = bw.mount('#app', bw.makeCard({ title: 'T', content: 'Old' }));
    el.bw.setContent('New Content');
    assert.ok(el.querySelector('.bw_card_body').textContent.indexOf('New Content') >= 0);
  });
});

describe("BCCL — makeCarousel handle", function() {
  beforeEach(function() { freshDOM(); });

  it("should have goToSlide/next/prev/getActiveIndex", function() {
    var el = bw.mount('#app', bw.makeCarousel({
      items: [
        { content: { t: 'div', c: 'Slide 1' } },
        { content: { t: 'div', c: 'Slide 2' } },
        { content: { t: 'div', c: 'Slide 3' } }
      ]
    }));
    assert.ok(el.bw);
    assert.strictEqual(typeof el.bw.goToSlide, 'function');
    assert.strictEqual(typeof el.bw.next, 'function');
    assert.strictEqual(typeof el.bw.prev, 'function');
    assert.strictEqual(typeof el.bw.getActiveIndex, 'function');
    assert.strictEqual(typeof el.bw.pause, 'function');
    assert.strictEqual(typeof el.bw.play, 'function');
  });

  it("goToSlide changes active index", function() {
    var el = bw.mount('#app', bw.makeCarousel({
      items: [
        { content: { t: 'div', c: 'S1' } },
        { content: { t: 'div', c: 'S2' } },
        { content: { t: 'div', c: 'S3' } }
      ]
    }));
    el.bw.goToSlide(2);
    assert.strictEqual(el.bw.getActiveIndex(), 2);
  });

  it("next/prev cycle through slides", function() {
    var el = bw.mount('#app', bw.makeCarousel({
      items: [
        { content: { t: 'div', c: 'S1' } },
        { content: { t: 'div', c: 'S2' } }
      ]
    }));
    el.bw.next();
    assert.strictEqual(el.bw.getActiveIndex(), 1);
    el.bw.next();
    assert.strictEqual(el.bw.getActiveIndex(), 0); // wraps
  });
});

describe("BCCL — makeTabs handle", function() {
  beforeEach(function() { freshDOM(); });

  it("should have setActiveTab/getActiveTab", function() {
    var el = bw.mount('#app', bw.makeTabs({
      tabs: [
        { label: 'Tab 1', content: 'Content 1' },
        { label: 'Tab 2', content: 'Content 2' }
      ]
    }));
    assert.ok(el.bw);
    assert.strictEqual(typeof el.bw.setActiveTab, 'function');
    assert.strictEqual(typeof el.bw.getActiveTab, 'function');
  });

  it("setActiveTab switches the active tab", function() {
    var el = bw.mount('#app', bw.makeTabs({
      tabs: [
        { label: 'A', content: 'CA' },
        { label: 'B', content: 'CB' }
      ]
    }));
    el.bw.setActiveTab(1);
    var panes = el.querySelectorAll('.bw_tab_pane');
    assert.ok(!panes[0].classList.contains('active'));
    assert.ok(panes[1].classList.contains('active'));
  });
});

describe("BCCL — makeAlert handle", function() {
  beforeEach(function() { freshDOM(); });

  it("should have dismiss method", function() {
    var el = bw.mount('#app', bw.makeAlert({ content: 'Test alert' }));
    assert.ok(el.bw);
    assert.strictEqual(typeof el.bw.dismiss, 'function');
  });
});

describe("BCCL — makeProgress handle", function() {
  beforeEach(function() { freshDOM(); });

  it("should have setValue/getValue", function() {
    var el = bw.mount('#app', bw.makeProgress({ value: 50 }));
    assert.ok(el.bw);
    assert.strictEqual(typeof el.bw.setValue, 'function');
    assert.strictEqual(typeof el.bw.getValue, 'function');
  });

  it("setValue updates the progress bar", function() {
    var el = bw.mount('#app', bw.makeProgress({ value: 50 }));
    el.bw.setValue(75);
    assert.strictEqual(el.bw.getValue(), 75);
  });
});

describe("BCCL — makeAccordion handle", function() {
  beforeEach(function() { freshDOM(); });

  it("should have toggle/openAll/closeAll", function() {
    var el = bw.mount('#app', bw.makeAccordion({
      items: [
        { title: 'A', content: 'CA' },
        { title: 'B', content: 'CB' }
      ]
    }));
    assert.ok(el.bw);
    assert.strictEqual(typeof el.bw.toggle, 'function');
    assert.strictEqual(typeof el.bw.openAll, 'function');
    assert.strictEqual(typeof el.bw.closeAll, 'function');
  });
});

describe("BCCL — makeModal handle", function() {
  beforeEach(function() { freshDOM(); });

  it("should have open/close", function() {
    var el = bw.mount('#app', bw.makeModal({ title: 'Test' }));
    assert.ok(el.bw);
    assert.strictEqual(typeof el.bw.open, 'function');
    assert.strictEqual(typeof el.bw.close, 'function');
  });
});

describe("BCCL — makeToast handle", function() {
  beforeEach(function() { freshDOM(); });

  it("should have dismiss", function() {
    var el = bw.mount('#app', bw.makeToast({ content: 'Hello' }));
    assert.ok(el.bw);
    assert.strictEqual(typeof el.bw.dismiss, 'function');
  });
});

describe("BCCL — makeChipInput handle", function() {
  beforeEach(function() { freshDOM(); });

  it("should have addChip/removeChip/getChips/clear", function() {
    var el = bw.mount('#app', bw.makeChipInput({ chips: ['a', 'b'] }));
    assert.ok(el.bw);
    assert.strictEqual(typeof el.bw.addChip, 'function');
    assert.strictEqual(typeof el.bw.removeChip, 'function');
    assert.strictEqual(typeof el.bw.getChips, 'function');
    assert.strictEqual(typeof el.bw.clear, 'function');
  });

  it("getChips returns current chip values", function() {
    var el = bw.mount('#app', bw.makeChipInput({ chips: ['a', 'b'] }));
    var chips = el.bw.getChips();
    assert.ok(chips.includes('a'));
    assert.ok(chips.includes('b'));
  });

  it("addChip adds a new chip", function() {
    var el = bw.mount('#app', bw.makeChipInput({ chips: [] }));
    el.bw.addChip('new');
    var chips = el.bw.getChips();
    assert.ok(chips.includes('new'));
  });

  it("clear removes all chips", function() {
    var el = bw.mount('#app', bw.makeChipInput({ chips: ['a', 'b', 'c'] }));
    el.bw.clear();
    assert.strictEqual(el.bw.getChips().length, 0);
  });
});

describe("BCCL — makePagination handle", function() {
  beforeEach(function() { freshDOM(); });

  it("should have setPage/getPage", function() {
    var el = bw.mount('#app', bw.makePagination({ pages: 5, currentPage: 1 }));
    assert.ok(el.bw);
    assert.strictEqual(typeof el.bw.setPage, 'function');
    assert.strictEqual(typeof el.bw.getPage, 'function');
  });

  it("getPage returns current page", function() {
    var el = bw.mount('#app', bw.makePagination({ pages: 5, currentPage: 3 }));
    assert.strictEqual(el.bw.getPage(), 3);
  });
});

describe("BCCL — makeStatCard slots", function() {
  beforeEach(function() { freshDOM(); });

  it("should have setValue/getValue/setLabel/getLabel", function() {
    var el = bw.mount('#app', bw.makeStatCard({ value: '42', label: 'Users' }));
    assert.ok(el.bw);
    assert.strictEqual(typeof el.bw.setValue, 'function');
    assert.strictEqual(typeof el.bw.getValue, 'function');
    assert.strictEqual(typeof el.bw.setLabel, 'function');
    assert.strictEqual(typeof el.bw.getLabel, 'function');
  });

  it("getValue returns the stat value", function() {
    var el = bw.mount('#app', bw.makeStatCard({ value: '42', label: 'Users' }));
    assert.strictEqual(el.bw.getValue(), '42');
  });

  it("setValue updates the stat value", function() {
    var el = bw.mount('#app', bw.makeStatCard({ value: '42', label: 'Users' }));
    el.bw.setValue('99');
    assert.strictEqual(el.bw.getValue(), '99');
  });
});
