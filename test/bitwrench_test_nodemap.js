/**
 * Tests for bw._nodeMap — UUID/ID → DOM node reference cache
 *
 * Tests cover:
 * - Registration on createDOM (data-bw-id, id attribute)
 * - bw._el() lookup: cache hit, cache miss with fallback, stale cleanup
 * - bw._registerNode / bw._deregisterNode
 * - bw.cleanup() removes entries
 * - bw.DOM() re-render preserves mount point, clears old children
 * - bw.patch / bw.update / bw.emit / bw.on use bw._el()
 * - _bw_refs: local parent→child refs for fast access in o.render
 * - Bulk add/remove stress test
 * - Stale ref detection via parentNode check
 */

import bw from '../src/bitwrench.js';
import { strict as assert } from 'assert';

// Polyfill requestAnimationFrame for jsdom (used by createDOM with o.render)
if (typeof globalThis.requestAnimationFrame === 'undefined') {
  globalThis.requestAnimationFrame = function(cb) { return setTimeout(cb, 0); };
}

// Helper: clear nodeMap between tests
function clearNodeMap() {
  for (var k in bw._nodeMap) {
    if (Object.prototype.hasOwnProperty.call(bw._nodeMap, k)) {
      delete bw._nodeMap[k];
    }
  }
}

describe('Node Map Cache (bw._nodeMap)', function() {

  beforeEach(function() {
    clearNodeMap();
    document.body.innerHTML = '';
  });

  // ─── Initialization ───────────────────────────────────────────────────

  describe('Initialization', function() {
    it('should exist as a plain object', function() {
      assert.equal(typeof bw._nodeMap, 'object');
      assert.ok(!Array.isArray(bw._nodeMap));
    });

    it('should start empty after clear', function() {
      assert.equal(Object.keys(bw._nodeMap).length, 0);
    });
  });

  // ─── bw._el() lookup ─────────────────────────────────────────────────

  describe('bw._el() lookup', function() {
    it('should pass through DOM elements', function() {
      var div = document.createElement('div');
      assert.strictEqual(bw._el(div), div);
    });

    it('should return null for null/undefined', function() {
      assert.strictEqual(bw._el(null), null);
      assert.strictEqual(bw._el(undefined), null);
      assert.strictEqual(bw._el(''), null);
    });

    it('should find element by id attribute from cache', function() {
      var el = bw.createDOM({ t: 'div', a: { id: 'test-id' }, c: 'hello' });
      document.body.appendChild(el);
      assert.strictEqual(bw._el('test-id'), el);
    });

    it('should find element by data-bw-id from cache', function() {
      var el = bw.createDOM({
        t: 'div', a: { 'data-bw-id': 'my-widget' }, c: 'test',
        o: { state: {} }
      });
      document.body.appendChild(el);
      assert.strictEqual(bw._el('my-widget'), el);
    });

    it('should fall back to getElementById on cache miss', function() {
      // Create element outside bitwrench (not in cache)
      var el = document.createElement('div');
      el.id = 'manual-el';
      document.body.appendChild(el);
      // Not in cache, but getElementById should find it
      assert.strictEqual(bw._el('manual-el'), el);
      // And now it should be cached
      assert.strictEqual(bw._nodeMap['manual-el'], el);
    });

    it('should fall back to querySelector for # selectors', function() {
      var el = document.createElement('div');
      el.id = 'hash-test';
      document.body.appendChild(el);
      assert.strictEqual(bw._el('#hash-test'), el);
    });

    it('should fall back to querySelector for . selectors', function() {
      var el = document.createElement('div');
      el.className = 'dot-test';
      document.body.appendChild(el);
      assert.strictEqual(bw._el('.dot-test'), el);
    });

    it('should fall back to data-bw-id attribute selector', function() {
      var el = document.createElement('div');
      el.setAttribute('data-bw-id', 'fallback-bwid');
      document.body.appendChild(el);
      // Not in cache, should fall back
      assert.strictEqual(bw._el('fallback-bwid'), el);
      // Should now be cached
      assert.strictEqual(bw._nodeMap['fallback-bwid'], el);
    });

    it('should return null when element not found anywhere', function() {
      assert.strictEqual(bw._el('nonexistent'), null);
    });

    it('should detect and remove stale cache entries', function() {
      var el = bw.createDOM({ t: 'div', a: { id: 'stale-test' }, c: 'x' });
      document.body.appendChild(el);
      // Verify it's cached
      assert.strictEqual(bw._el('stale-test'), el);
      // Remove element outside bitwrench (behind our backs)
      el.remove();
      // Now lookup should detect stale (parentNode === null) and remove
      assert.strictEqual(bw._el('stale-test'), null);
      assert.strictEqual(bw._nodeMap['stale-test'], undefined);
    });

    it('should update cache when stale entry is replaced by new element', function() {
      var el1 = bw.createDOM({ t: 'div', a: { id: 'replace-test' }, c: 'v1' });
      document.body.appendChild(el1);
      assert.strictEqual(bw._el('replace-test'), el1);
      // Remove old, add new with same id
      el1.remove();
      var el2 = document.createElement('div');
      el2.id = 'replace-test';
      el2.textContent = 'v2';
      document.body.appendChild(el2);
      // Should find new element via fallback and update cache
      assert.strictEqual(bw._el('replace-test'), el2);
      assert.strictEqual(bw._nodeMap['replace-test'], el2);
    });
  });

  // ─── bw._registerNode / bw._deregisterNode ───────────────────────────

  describe('bw._registerNode / bw._deregisterNode', function() {
    it('should register under bwId', function() {
      var el = document.createElement('div');
      bw._registerNode(el, 'reg-test');
      assert.strictEqual(bw._nodeMap['reg-test'], el);
    });

    it('should register under id attribute', function() {
      var el = document.createElement('div');
      el.id = 'html-id-reg';
      bw._registerNode(el);
      assert.strictEqual(bw._nodeMap['html-id-reg'], el);
    });

    it('should register under both bwId and id', function() {
      var el = document.createElement('div');
      el.id = 'both-id';
      bw._registerNode(el, 'both-bwid');
      assert.strictEqual(bw._nodeMap['both-id'], el);
      assert.strictEqual(bw._nodeMap['both-bwid'], el);
    });

    it('should deregister bwId entry', function() {
      var el = document.createElement('div');
      bw._registerNode(el, 'dereg-test');
      assert.strictEqual(bw._nodeMap['dereg-test'], el);
      bw._deregisterNode(el, 'dereg-test');
      assert.strictEqual(bw._nodeMap['dereg-test'], undefined);
    });

    it('should deregister id attribute entry', function() {
      var el = document.createElement('div');
      el.id = 'dereg-id';
      bw._registerNode(el, null);
      assert.strictEqual(bw._nodeMap['dereg-id'], el);
      bw._deregisterNode(el, null);
      assert.strictEqual(bw._nodeMap['dereg-id'], undefined);
    });

    it('should handle null element gracefully', function() {
      bw._registerNode(null, 'null-test');
      assert.strictEqual(bw._nodeMap['null-test'], undefined);
    });

    it('should handle null bwId gracefully', function() {
      var el = document.createElement('div');
      bw._deregisterNode(el, null);
      // Should not throw
    });
  });

  // ─── createDOM registration ───────────────────────────────────────────

  describe('createDOM registration', function() {
    it('should register element with lifecycle hooks under auto-generated uuid', function() {
      var el = bw.createDOM({
        t: 'div', c: 'lifecycle',
        o: { state: { count: 0 } }
      });
      document.body.appendChild(el);
      var bwId = el.getAttribute('data-bw-id');
      assert.ok(bwId, 'should have data-bw-id');
      assert.strictEqual(bw._nodeMap[bwId], el);
    });

    it('should register element with explicit data-bw-id', function() {
      var el = bw.createDOM({
        t: 'div', a: { 'data-bw-id': 'explicit-id' }, c: 'test',
        o: { state: {} }
      });
      document.body.appendChild(el);
      assert.strictEqual(bw._nodeMap['explicit-id'], el);
    });

    it('should register element with id attribute', function() {
      var el = bw.createDOM({ t: 'div', a: { id: 'html-id-create' }, c: 'test' });
      document.body.appendChild(el);
      assert.strictEqual(bw._nodeMap['html-id-create'], el);
    });

    it('should register element with both id and data-bw-id', function() {
      var el = bw.createDOM({
        t: 'div',
        a: { id: 'dual-id', 'data-bw-id': 'dual-bwid' },
        c: 'test',
        o: { state: {} }
      });
      document.body.appendChild(el);
      assert.strictEqual(bw._nodeMap['dual-id'], el);
      assert.strictEqual(bw._nodeMap['dual-bwid'], el);
    });

    it('should register data-bw-id even without lifecycle hooks', function() {
      var el = bw.createDOM({
        t: 'div', a: { 'data-bw-id': 'no-lifecycle' }, c: 'test'
      });
      document.body.appendChild(el);
      assert.strictEqual(bw._nodeMap['no-lifecycle'], el);
    });

    it('should not register plain elements without id or data-bw-id', function() {
      var mapSizeBefore = Object.keys(bw._nodeMap).length;
      bw.createDOM({ t: 'span', c: 'anonymous' });
      assert.equal(Object.keys(bw._nodeMap).length, mapSizeBefore);
    });
  });

  // ─── _bw_refs: local parent→child refs ────────────────────────────────

  describe('_bw_refs (local parent→child refs)', function() {
    it('should build refs for children with data-bw-id', function() {
      var el = bw.createDOM({
        t: 'div', c: [
          { t: 'h2', a: { 'data-bw-id': 'title' }, c: 'Hello' },
          { t: 'span', a: { 'data-bw-id': 'count' }, c: '0' }
        ]
      });
      assert.ok(el._bw_refs, 'parent should have _bw_refs');
      assert.strictEqual(el._bw_refs['title'].tagName, 'H2');
      assert.strictEqual(el._bw_refs['count'].tagName, 'SPAN');
      assert.strictEqual(el._bw_refs['count'].textContent, '0');
    });

    it('should build refs for children with id attribute', function() {
      var el = bw.createDOM({
        t: 'div', c: [
          { t: 'p', a: { id: 'para-1' }, c: 'First' },
          { t: 'p', a: { id: 'para-2' }, c: 'Second' }
        ]
      });
      assert.ok(el._bw_refs);
      assert.strictEqual(el._bw_refs['para-1'].textContent, 'First');
      assert.strictEqual(el._bw_refs['para-2'].textContent, 'Second');
    });

    it('should not create _bw_refs when no children have ids', function() {
      var el = bw.createDOM({
        t: 'div', c: [
          { t: 'span', c: 'anon1' },
          { t: 'span', c: 'anon2' }
        ]
      });
      assert.strictEqual(el._bw_refs, undefined);
    });

    it('should bubble up grandchild refs to parent', function() {
      var el = bw.createDOM({
        t: 'div', c: [
          {
            t: 'div', a: { 'data-bw-id': 'wrapper' }, c: [
              { t: 'span', a: { 'data-bw-id': 'deep-child' }, c: 'deep' }
            ]
          }
        ]
      });
      assert.ok(el._bw_refs);
      assert.strictEqual(el._bw_refs['wrapper'].tagName, 'DIV');
      assert.strictEqual(el._bw_refs['deep-child'].tagName, 'SPAN');
      assert.strictEqual(el._bw_refs['deep-child'].textContent, 'deep');
    });

    it('should allow direct child updates via refs in o.render', function() {
      var rendered = false;
      var el = bw.createDOM({
        t: 'div',
        a: { 'data-bw-id': 'card' },
        c: [
          { t: 'span', a: { 'data-bw-id': 'val' }, c: '0' }
        ],
        o: {
          state: { count: 0 },
          render: function(el, state) {
            if (el._bw_refs && el._bw_refs['val']) {
              el._bw_refs['val'].textContent = String(state.count);
              rendered = true;
            }
          }
        }
      });
      document.body.appendChild(el);
      // Manually trigger render
      el._bw_state.count = 42;
      el._bw_render(el, el._bw_state);
      assert.ok(rendered, 'render should have been called');
      assert.strictEqual(el._bw_refs['val'].textContent, '42');
    });

    it('should handle single child TACO (not array) with id', function() {
      var el = bw.createDOM({
        t: 'div',
        c: { t: 'span', a: { 'data-bw-id': 'only-child' }, c: 'alone' }
      });
      assert.ok(el._bw_refs);
      assert.strictEqual(el._bw_refs['only-child'].textContent, 'alone');
    });
  });

  // ─── cleanup() deregistration ─────────────────────────────────────────

  describe('cleanup() deregistration', function() {
    it('should remove data-bw-id entries from nodeMap', function() {
      var el = bw.createDOM({
        t: 'div', a: { 'data-bw-id': 'cleanup-test' }, c: 'bye',
        o: { state: {} }
      });
      document.body.appendChild(el);
      assert.strictEqual(bw._nodeMap['cleanup-test'], el);
      bw.cleanup(el);
      assert.strictEqual(bw._nodeMap['cleanup-test'], undefined);
    });

    it('should remove id attribute entries from nodeMap', function() {
      var el = bw.createDOM({
        t: 'div', a: { id: 'cleanup-id', 'data-bw-id': 'cleanup-bwid' },
        c: 'bye', o: { state: {} }
      });
      document.body.appendChild(el);
      assert.strictEqual(bw._nodeMap['cleanup-id'], el);
      assert.strictEqual(bw._nodeMap['cleanup-bwid'], el);
      bw.cleanup(el);
      assert.strictEqual(bw._nodeMap['cleanup-id'], undefined);
      assert.strictEqual(bw._nodeMap['cleanup-bwid'], undefined);
    });

    it('should remove child entries from nodeMap', function() {
      var el = bw.createDOM({
        t: 'div', a: { 'data-bw-id': 'parent-clean' }, c: [
          { t: 'span', a: { 'data-bw-id': 'child-clean' }, c: 'x', o: { state: {} } }
        ], o: { state: {} }
      });
      document.body.appendChild(el);
      assert.strictEqual(bw._nodeMap['child-clean'] !== undefined, true);
      bw.cleanup(el);
      assert.strictEqual(bw._nodeMap['child-clean'], undefined);
      assert.strictEqual(bw._nodeMap['parent-clean'], undefined);
    });

    it('should clear _bw_refs on cleanup', function() {
      var el = bw.createDOM({
        t: 'div', a: { 'data-bw-id': 'refs-clean' }, c: [
          { t: 'span', a: { 'data-bw-id': 'rc1' }, c: 'x' }
        ], o: { state: {} }
      });
      document.body.appendChild(el);
      assert.ok(el._bw_refs);
      bw.cleanup(el);
      assert.strictEqual(el._bw_refs, undefined);
    });
  });

  // ─── bw.DOM() re-render ───────────────────────────────────────────────

  describe('bw.DOM() re-render', function() {
    it('should preserve mount point in cache across re-renders', function() {
      var mount = document.createElement('div');
      mount.id = 'mount';
      mount.setAttribute('data-bw-id', 'mount-bwid');
      document.body.appendChild(mount);
      bw._registerNode(mount, 'mount-bwid');

      bw.DOM('#mount', { t: 'p', c: 'v1' });
      assert.strictEqual(bw._nodeMap['mount-bwid'], mount);

      bw.DOM('#mount', { t: 'p', c: 'v2' });
      assert.strictEqual(bw._nodeMap['mount-bwid'], mount);
    });

    it('should clear old child cache entries on re-render', function() {
      var mount = document.createElement('div');
      mount.id = 'rerender-mount';
      document.body.appendChild(mount);

      bw.DOM('#rerender-mount', {
        t: 'div', c: [
          { t: 'span', a: { 'data-bw-id': 'old-child' }, c: 'old', o: { state: {} } }
        ]
      });
      assert.ok(bw._nodeMap['old-child']);

      bw.DOM('#rerender-mount', {
        t: 'div', c: [
          { t: 'span', a: { 'data-bw-id': 'new-child' }, c: 'new', o: { state: {} } }
        ]
      });
      assert.strictEqual(bw._nodeMap['old-child'], undefined);
      assert.ok(bw._nodeMap['new-child']);
    });

    it('should register new children after re-render', function() {
      var mount = document.createElement('div');
      mount.id = 'fresh-mount';
      document.body.appendChild(mount);

      bw.DOM('#fresh-mount', {
        t: 'div', a: { id: 'inner' }, c: 'content'
      });
      assert.ok(bw._nodeMap['inner']);
    });
  });

  // ─── patch/update/emit/on use bw._el() ────────────────────────────────

  describe('patch/update/emit/on use bw._el()', function() {
    it('bw.patch should resolve via cache', function() {
      var el = bw.createDOM({ t: 'div', a: { id: 'patch-cache' }, c: '0' });
      document.body.appendChild(el);
      bw.patch('patch-cache', '99');
      assert.strictEqual(el.textContent, '99');
    });

    it('bw.patch should resolve data-bw-id', function() {
      var el = bw.createDOM({
        t: 'div', a: { 'data-bw-id': 'patch-bwid' }, c: 'old',
        o: { state: {} }
      });
      document.body.appendChild(el);
      bw.patch('patch-bwid', 'new');
      assert.strictEqual(el.textContent, 'new');
    });

    it('bw.update should resolve via cache', function() {
      var renderCount = 0;
      var el = bw.createDOM({
        t: 'div', a: { 'data-bw-id': 'update-cache' }, c: '',
        o: {
          state: { v: 1 },
          render: function() { renderCount++; }
        }
      });
      document.body.appendChild(el);
      bw.update('update-cache');
      assert.ok(renderCount > 0, 'render should have been called');
    });

    it('bw.emit should resolve via cache', function() {
      var received = false;
      var el = bw.createDOM({
        t: 'div', a: { id: 'emit-cache' }, c: 'test'
      });
      document.body.appendChild(el);
      el.addEventListener('bw:ping', function() { received = true; });
      bw.emit('emit-cache', 'ping', {});
      assert.ok(received, 'event should have been received');
    });

    it('bw.on should resolve via cache', function() {
      var received = false;
      var el = bw.createDOM({
        t: 'div', a: { id: 'on-cache' }, c: 'test'
      });
      document.body.appendChild(el);
      bw.on('on-cache', 'test-event', function() { received = true; });
      bw.emit('on-cache', 'test-event', {});
      assert.ok(received, 'handler should have been called');
    });

    it('bw.patch should return null for nonexistent element', function() {
      assert.strictEqual(bw.patch('ghost-element', 'val'), null);
    });

    it('bw.update should return null for nonexistent element', function() {
      assert.strictEqual(bw.update('ghost-element'), null);
    });
  });

  // ─── Bulk add/remove stress test ──────────────────────────────────────

  describe('Bulk operations', function() {
    it('should handle 100 element registration and cleanup', function() {
      var mount = document.createElement('div');
      mount.id = 'bulk-mount';
      document.body.appendChild(mount);

      var children = [];
      for (var i = 0; i < 100; i++) {
        children.push({
          t: 'div',
          a: { 'data-bw-id': 'bulk-' + i },
          c: 'item ' + i,
          o: { state: { idx: i } }
        });
      }

      bw.DOM('#bulk-mount', { t: 'div', c: children });

      // All should be cached
      for (var j = 0; j < 100; j++) {
        assert.ok(bw._nodeMap['bulk-' + j], 'bulk-' + j + ' should be cached');
      }

      // Re-render with fewer items
      var fewerChildren = [];
      for (var k = 0; k < 10; k++) {
        fewerChildren.push({
          t: 'div',
          a: { 'data-bw-id': 'new-bulk-' + k },
          c: 'new ' + k,
          o: { state: { idx: k } }
        });
      }

      bw.DOM('#bulk-mount', { t: 'div', c: fewerChildren });

      // Old entries should be cleaned up
      for (var m = 0; m < 100; m++) {
        assert.strictEqual(bw._nodeMap['bulk-' + m], undefined,
          'bulk-' + m + ' should be removed after re-render');
      }

      // New entries should be cached
      for (var n = 0; n < 10; n++) {
        assert.ok(bw._nodeMap['new-bulk-' + n],
          'new-bulk-' + n + ' should be cached');
      }
    });

    it('should handle rapid sequential re-renders', function() {
      var mount = document.createElement('div');
      mount.id = 'rapid-mount';
      document.body.appendChild(mount);

      for (var round = 0; round < 20; round++) {
        bw.DOM('#rapid-mount', {
          t: 'div', a: { 'data-bw-id': 'rapid-' + round }, c: 'r' + round,
          o: { state: {} }
        });
      }
      // Only the last round's element should be in cache
      assert.ok(bw._nodeMap['rapid-19']);
      // Previous rounds should have been cleaned up
      for (var r = 0; r < 19; r++) {
        assert.strictEqual(bw._nodeMap['rapid-' + r], undefined,
          'rapid-' + r + ' should be cleaned up');
      }
    });

    it('bw.patchAll should use cached lookups for all elements', function() {
      var mount = document.createElement('div');
      mount.id = 'patchall-mount';
      document.body.appendChild(mount);

      bw.DOM('#patchall-mount', {
        t: 'div', c: [
          { t: 'span', a: { id: 'pa-a' }, c: '0' },
          { t: 'span', a: { id: 'pa-b' }, c: '0' },
          { t: 'span', a: { id: 'pa-c' }, c: '0' }
        ]
      });

      bw.patchAll({ 'pa-a': 'X', 'pa-b': 'Y', 'pa-c': 'Z' });
      assert.strictEqual(document.getElementById('pa-a').textContent, 'X');
      assert.strictEqual(document.getElementById('pa-b').textContent, 'Y');
      assert.strictEqual(document.getElementById('pa-c').textContent, 'Z');
    });
  });

  // ─── Mixed TACO hierarchies ───────────────────────────────────────────

  describe('Complex TACO hierarchies', function() {
    it('should register all addressable elements in a deep tree', function() {
      var el = bw.createDOM({
        t: 'div', a: { id: 'root' }, c: [
          { t: 'header', a: { id: 'hdr' }, c: [
            { t: 'h1', a: { 'data-bw-id': 'title' }, c: 'App', o: { state: {} } }
          ]},
          { t: 'main', a: { id: 'main' }, c: [
            { t: 'section', c: [
              { t: 'div', a: { 'data-bw-id': 'card-1' }, c: 'Card 1', o: { state: {} } },
              { t: 'div', a: { 'data-bw-id': 'card-2' }, c: 'Card 2', o: { state: {} } }
            ]}
          ]},
          { t: 'footer', a: { id: 'ftr' }, c: 'Footer' }
        ]
      });
      document.body.appendChild(el);

      // All id and data-bw-id elements should be cached
      assert.ok(bw._nodeMap['root']);
      assert.ok(bw._nodeMap['hdr']);
      assert.ok(bw._nodeMap['title']);
      assert.ok(bw._nodeMap['main']);
      assert.ok(bw._nodeMap['card-1']);
      assert.ok(bw._nodeMap['card-2']);
      assert.ok(bw._nodeMap['ftr']);
    });

    it('should build _bw_refs across nested structure', function() {
      var el = bw.createDOM({
        t: 'div', c: [
          { t: 'div', a: { 'data-bw-id': 'panel' }, c: [
            { t: 'span', a: { 'data-bw-id': 'label' }, c: 'Name:' },
            { t: 'span', a: { 'data-bw-id': 'value' }, c: 'Alice' }
          ]}
        ]
      });
      // Root should have refs to panel, label, and value (bubbled up)
      assert.ok(el._bw_refs);
      assert.ok(el._bw_refs['panel']);
      assert.ok(el._bw_refs['label']);
      assert.ok(el._bw_refs['value']);
      // Panel should have refs to label and value
      assert.ok(el._bw_refs['panel']._bw_refs);
      assert.ok(el._bw_refs['panel']._bw_refs['label']);
      assert.ok(el._bw_refs['panel']._bw_refs['value']);
    });

    it('should clean up entire hierarchy on cleanup', function() {
      var el = bw.createDOM({
        t: 'div', a: { 'data-bw-id': 'hierarchy-root' }, c: [
          { t: 'div', a: { 'data-bw-id': 'h-child-1' }, c: [
            { t: 'span', a: { 'data-bw-id': 'h-grandchild' }, c: 'x', o: { state: {} } }
          ], o: { state: {} } }
        ], o: { state: {} }
      });
      document.body.appendChild(el);

      assert.ok(bw._nodeMap['hierarchy-root']);
      assert.ok(bw._nodeMap['h-child-1']);
      assert.ok(bw._nodeMap['h-grandchild']);

      bw.cleanup(el);

      assert.strictEqual(bw._nodeMap['hierarchy-root'], undefined);
      assert.strictEqual(bw._nodeMap['h-child-1'], undefined);
      assert.strictEqual(bw._nodeMap['h-grandchild'], undefined);
    });
  });

  // ─── Edge cases ───────────────────────────────────────────────────────

  describe('Edge cases', function() {
    it('should handle element with id but no data-bw-id and no lifecycle', function() {
      var el = bw.createDOM({ t: 'input', a: { id: 'my-input', type: 'text' } });
      document.body.appendChild(el);
      assert.strictEqual(bw._nodeMap['my-input'], el);
    });

    it('should handle createDOM with null content', function() {
      var el = bw.createDOM({ t: 'div', a: { id: 'null-content' } });
      document.body.appendChild(el);
      assert.strictEqual(bw._nodeMap['null-content'], el);
    });

    it('should handle text node children (no crash)', function() {
      var el = bw.createDOM({ t: 'p', c: 'just text' });
      assert.ok(el);
      assert.strictEqual(el.textContent, 'just text');
    });

    it('should handle bw.DOM with mount point found via _el cache', function() {
      var mount = bw.createDOM({
        t: 'div', a: { 'data-bw-id': 'cached-mount' }, c: 'initial',
        o: { state: {} }
      });
      document.body.appendChild(mount);

      // bw.DOM should find it via _el cache (data-bw-id lookup)
      var result = bw.DOM('cached-mount', { t: 'span', c: 'replaced' });
      assert.ok(result);
      assert.strictEqual(result.querySelector('span').textContent, 'replaced');
    });

    it('should survive cleanup on element with no data-bw-id', function() {
      var el = document.createElement('div');
      el.innerHTML = '<span>hello</span>';
      document.body.appendChild(el);
      // Should not throw
      bw.cleanup(el);
    });

    it('should handle repeated registration of same key', function() {
      var el1 = document.createElement('div');
      var el2 = document.createElement('div');
      bw._registerNode(el1, 'dup-key');
      assert.strictEqual(bw._nodeMap['dup-key'], el1);
      bw._registerNode(el2, 'dup-key');
      assert.strictEqual(bw._nodeMap['dup-key'], el2);
    });
  });

  // ─── Integration with existing features ───────────────────────────────

  describe('Integration with pub/sub and unmount', function() {
    it('should deregister on cleanup even when unmount callbacks exist', function() {
      var unmounted = false;
      var el = bw.createDOM({
        t: 'div', a: { 'data-bw-id': 'unmount-dereg' }, c: 'x',
        o: {
          state: {},
          unmount: function() { unmounted = true; }
        }
      });
      document.body.appendChild(el);
      assert.ok(bw._nodeMap['unmount-dereg']);

      bw.cleanup(el);
      assert.ok(unmounted, 'unmount should have been called');
      assert.strictEqual(bw._nodeMap['unmount-dereg'], undefined);
    });

    it('should deregister on cleanup with pub/sub subscriptions', function() {
      var el = bw.createDOM({
        t: 'div', a: { 'data-bw-id': 'pubsub-dereg' }, c: 'x',
        o: { state: {} }
      });
      document.body.appendChild(el);
      // Attach a subscription
      bw.sub('test-topic', function() {}, el);
      assert.ok(el._bw_subs);

      bw.cleanup(el);
      assert.strictEqual(bw._nodeMap['pubsub-dereg'], undefined);
    });
  });
});
