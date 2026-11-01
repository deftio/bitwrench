/**
 * Cross-layer test: what the MCP server broadcasts must be what bw.apply
 * accepts.
 *
 * Why this file exists. src/mcp/live.js emitted the v2.0 wire shape
 * ({type:'replace', target, node}) long after bw.apply moved to v:1
 * (ref/taco, and patch's discriminated text/attrs). bw.apply rejects any
 * message carrying target/node outright -- it publishes `wire_rejected` and
 * returns false -- so every render_live/patch/append/remove was silently
 * dropped on the client. The MCP suite had five test files and all of them
 * asserted only that the handler was called, never that the frame it emitted
 * could be applied.
 *
 * So this asserts the boundary itself, the same way the C/C++ suite feeds C
 * output through bw.parseJSONFlex rather than trusting both sides separately.
 */

import assert from "assert";
import bw from "../src/bitwrench.js";
import { startLive, stopLive, getApp, liveHandlers } from '../src/mcp/live.js';
import jsdom from 'jsdom';
const { JSDOM } = jsdom;

var dom, sent, diags, unsubDiag;

function freshDOM() {
  dom = new JSDOM('<!DOCTYPE html><html><body>' +
    '<div id="app">original</div>' +
    '<ul id="list"><li id="item-1">one</li></ul>' +
    '<span id="count">0</span>' +
  '</body></html>');
  global.window = dom.window;
  global.document = dom.window.document;
  global.Element = dom.window.Element;
  global.HTMLElement = dom.window.HTMLElement;
  global.CustomEvent = dom.window.CustomEvent;
  global.requestAnimationFrame = function(fn) { fn(); };
  // bw.el() consults a node cache that outlives a jsdom instance, so without
  // this a later test resolves a detached node from an earlier page and the
  // patch lands somewhere invisible.
  if (bw._nodeMap) {
    Object.keys(bw._nodeMap).forEach(function(k) { delete bw._nodeMap[k]; });
  }
}

// bwserve stamps v:1 inside client._send, which broadcast() routes through.
// Capturing at broadcast() means doing that stamp here.
function capture(app) {
  sent = [];
  app.broadcast = function(msg) {
    msg.v = 1;
    sent.push(msg);
    return 1;
  };
}

function lastFrame() {
  assert.ok(sent.length > 0, 'the handler broadcast nothing');
  return sent[sent.length - 1];
}

// Apply the captured frame the way a browser client would, and surface any
// diagnostic bw.apply publishes while doing it.
function applyLast() {
  var result = bw.apply(lastFrame());
  var rejected = diags.filter(function(d) { return d.code === 'wire_rejected'; });
  assert.deepStrictEqual(rejected, [],
    'bw.apply rejected the frame: ' + JSON.stringify(rejected) +
    ' frame=' + JSON.stringify(lastFrame()));
  assert.strictEqual(result, true,
    'bw.apply returned false for ' + JSON.stringify(lastFrame()));
  return result;
}

describe('MCP wire shape is what bw.apply accepts', function() {
  this.timeout(10000);

  before(function() {
    return startLive({ port: 0 });
  });

  after(function() {
    return stopLive();
  });

  beforeEach(function() {
    freshDOM();
    capture(getApp());
    diags = [];
    unsubDiag = bw.sub('bw:diag', function(d) { diags.push(d); });
  });

  afterEach(function() {
    if (unsubDiag) bw.unsub('bw:diag', unsubDiag);
  });

  it('render_live replace produces an applicable frame', function() {
    liveHandlers.render_live({ target: '#app', action: 'replace', taco: { t: 'p', c: 'replaced' } });
    var frame = lastFrame();
    assert.strictEqual(frame.type, 'replace');
    assert.strictEqual(frame.ref, '#app', 'v:1 names the target `ref`');
    assert.ok(frame.taco, 'v:1 names the payload `taco`');
    assert.strictEqual(frame.target, undefined, 'target is the rejected v2.0 field');
    assert.strictEqual(frame.node, undefined, 'node is the rejected v2.0 field');
    applyLast();
    assert.strictEqual(bw.$('#app').length, 0, '#app should have been replaced');
    assert.ok(/replaced/.test(document.body.textContent));
  });

  it('render_live append produces an applicable frame', function() {
    liveHandlers.render_live({ target: '#list', action: 'append', taco: { t: 'li', c: 'two' } });
    var frame = lastFrame();
    assert.strictEqual(frame.ref, '#list');
    assert.ok(frame.taco);
    applyLast();
    assert.strictEqual(document.querySelectorAll('#list li').length, 2,
      'the appended child should be in the DOM');
  });

  it('render_live patch with content produces an applicable frame', function() {
    liveHandlers.render_live({ target: '#count', action: 'patch', content: '42' });
    var frame = lastFrame();
    assert.strictEqual(frame.ref, '#count');
    assert.strictEqual(frame.text, '42', 'v:1 patch carries discriminated `text`');
    assert.strictEqual(frame.content, undefined);
    assert.strictEqual(frame.attr, undefined, '`attr` singular is not read by bw.apply');
    applyLast();
    assert.strictEqual(bw.$('#count')[0].textContent, '42');
  });

  it('render_live patch with attributes produces an applicable frame', function() {
    liveHandlers.render_live({ target: '#count', action: 'patch', attr: { class: 'hot' } });
    var frame = lastFrame();
    assert.deepStrictEqual(frame.attrs, { class: 'hot' }, 'v:1 patch carries `attrs`');
    applyLast();
    assert.ok(bw.$('#count')[0].classList.contains('hot'),
      'the attribute should have been applied');
  });

  it('render_live remove produces an applicable frame', function() {
    liveHandlers.render_live({ target: '#item-1', action: 'remove' });
    var frame = lastFrame();
    assert.strictEqual(frame.ref, '#item-1');
    applyLast();
    assert.strictEqual(bw.$('#item-1').length, 0, 'the node should be gone');
  });

  it('every frame the handler can emit names ref, never target/node', function() {
    var cases = [
      { target: '#app', action: 'replace', taco: { t: 'p', c: 'x' } },
      { target: '#list', action: 'append', taco: { t: 'li', c: 'x' } },
      { target: '#count', action: 'patch', content: 'x' },
      { target: '#count', action: 'patch', attr: { class: 'x' } },
      { target: '#item-1', action: 'remove' }
    ];
    sent = [];
    cases.forEach(function(c) { liveHandlers.render_live(c); });
    assert.strictEqual(sent.length, cases.length, 'each action should broadcast once');
    sent.forEach(function(frame) {
      assert.strictEqual(frame.v, 1, 'frames must be stamped v:1');
      assert.ok(frame.ref, frame.type + ' must carry ref');
      assert.strictEqual(frame.target, undefined, frame.type + ' must not carry target');
      assert.strictEqual(frame.node, undefined, frame.type + ' must not carry node');
    });
  });
});
