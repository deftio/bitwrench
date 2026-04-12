/*! bitwrench-debug v2.0.29 | BSD-2-Clause | https://deftio.github.com/bitwrench/pages */
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.bwd = factory());
})(this, (function () { 'use strict';

	function getDefaultExportFromCjs (x) {
		return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
	}

	var bitwrenchDebug = {exports: {}};

	/**
	 * bitwrench-debug.js -- Standalone debug toolkit for bitwrench pages.
	 *
	 * Installs window.bwd with helper functions ported from bwcli attach:
	 *   bwd.tree(sel, depth)      -- print DOM tree to console
	 *   bwd.listen(sel, event)    -- delegated event logging
	 *   bwd.unlisten(sel, event)  -- remove event listener
	 *   bwd.state(sel?)           -- dump stateful elements via console.table
	 *   bwd.screenshot(sel?)      -- capture screenshot via html2canvas
	 *
	 * NOT bundled into bitwrench core. Load separately via script tag or
	 * console paste. Auto-loads bitwrench from CDN if not present.
	 *
	 * @module bitwrench-debug
	 */

	(function (module) {
		(function() {

		  var CDN_BW = 'https://cdn.jsdelivr.net/npm/bitwrench@2/dist/bitwrench.umd.min.js';
		  var CDN_H2C = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';
		  var _listeners = {};

		  function _loadScript(url) {
		    return new Promise(function(resolve, reject) {
		      var s = document.createElement('script');
		      s.src = url;
		      s.onload = function() { resolve(); };
		      s.onerror = function() { reject(new Error('Failed to load ' + url)); };
		      document.head.appendChild(s);
		    });
		  }

		  // -- tree -------------------------------------------------------------------

		  function _walk(el, depth, maxDepth) {
		    if (!el || depth > maxDepth) return null;
		    var info = { tag: el.tagName ? el.tagName.toLowerCase() : '#text' };
		    if (el.id) info.id = el.id;
		    if (el.className && typeof el.className === 'string') {
		      info.cls = el.className.split(' ').slice(0, 5).join(' ');
		    }
		    if (el.children && el.children.length > 0 && depth < maxDepth) {
		      info.children = [];
		      for (var i = 0; i < Math.min(el.children.length, 20); i++) {
		        var c = _walk(el.children[i], depth + 1, maxDepth);
		        if (c) info.children.push(c);
		      }
		    }
		    return info;
		  }

		  function _print(node, indent) {
		    if (!node) return;
		    var label = node.tag || '?';
		    if (node.id) label += '#' + node.id;
		    if (node.cls) label += '.' + node.cls.split(' ').join('.');
		    console.log('  '.repeat(indent) + label);
		    if (node.children) {
		      for (var i = 0; i < node.children.length; i++) {
		        _print(node.children[i], indent + 1);
		      }
		    }
		  }

		  /**
		   * Print an indented DOM tree to the console.
		   * @param {string} [sel='body'] - CSS selector for the root element
		   * @param {number} [depth=3] - Max depth to walk
		   * @returns {object|null} The tree data structure
		   */
		  function tree(sel, depth) {
		    sel = sel || 'body';
		    depth = depth || 3;
		    var root = document.querySelector(sel);
		    if (!root) {
		      console.log('(no element found for "' + sel + '")');
		      return null;
		    }
		    var data = _walk(root, 0, depth);
		    _print(data, 0);
		    return data;
		  }

		  // -- listen / unlisten ------------------------------------------------------

		  /**
		   * Add a delegated event listener that logs matching events to the console.
		   * @param {string} sel - CSS selector to match via closest()
		   * @param {string} event - DOM event name (e.g. 'click')
		   */
		  function listen(sel, event) {
		    var key = sel + ':::' + event;
		    if (_listeners[key]) {
		      console.log('[bwd] already listening for ' + event + ' on ' + sel);
		      return;
		    }
		    var fn = function(e) {
		      var el = e.target.closest ? e.target.closest(sel) : null;
		      if (!el) return;
		      console.log('[bwd] ' + event + ' on ' + sel + ' -> ' +
		        el.tagName + (el.id ? '#' + el.id : '') +
		        (el.textContent ? ' "' + el.textContent.slice(0, 50).trim() + '"' : ''));
		    };
		    document.addEventListener(event, fn, true);
		    _listeners[key] = { fn: fn, event: event };
		    console.log('[bwd] listening for ' + event + ' on ' + sel);
		  }

		  /**
		   * Remove a previously added delegated event listener.
		   * @param {string} sel - CSS selector used in listen()
		   * @param {string} event - DOM event name used in listen()
		   */
		  function unlisten(sel, event) {
		    var key = sel + ':::' + event;
		    var entry = _listeners[key];
		    if (!entry) {
		      console.log('[bwd] no listener for ' + event + ' on ' + sel);
		      return;
		    }
		    document.removeEventListener(entry.event, entry.fn, true);
		    delete _listeners[key];
		    console.log('[bwd] stopped listening for ' + event + ' on ' + sel);
		  }

		  // -- state ------------------------------------------------------------------

		  /**
		   * Dump all stateful (.bw_lc) elements and their _bw_state via console.table.
		   * @param {string} [sel='.bw_lc'] - CSS selector to query
		   * @returns {Array} Array of {id, uuid, state} objects
		   */
		  function state(sel) {
		    sel = sel || '.bw_lc';
		    var els = document.querySelectorAll(sel);
		    var rows = [];
		    for (var i = 0; i < els.length; i++) {
		      var el = els[i];
		      var uuid = '';
		      if (typeof window !== 'undefined' && window.bw && window.bw.getUUID) {
		        uuid = window.bw.getUUID(el) || '';
		      }
		      rows.push({
		        id: el.id || '',
		        uuid: uuid,
		        state: el._bw_state || null
		      });
		    }
		    if (rows.length === 0) {
		      console.log('[bwd] no stateful elements found for "' + sel + '"');
		    } else if (typeof console.table === 'function') {
		      console.table(rows);
		    } else {
		      console.log(rows);
		    }
		    return rows;
		  }

		  // -- screenshot -------------------------------------------------------------

		  /**
		   * Capture a screenshot via html2canvas and trigger a download.
		   * Loads html2canvas from CDN if not present.
		   * @param {string} [sel='body'] - CSS selector for the element to capture
		   * @returns {Promise} Resolves when screenshot is saved
		   */
		  function screenshot(sel) {
		    sel = sel || 'body';
		    var el = document.querySelector(sel);
		    if (!el) {
		      console.log('[bwd] no element found for "' + sel + '"');
		      return Promise.resolve(null);
		    }

		    var p = (typeof window !== 'undefined' && window.html2canvas)
		      ? Promise.resolve(window.html2canvas)
		      : _loadScript(CDN_H2C).then(function() { return window.html2canvas; });

		    return p.then(function(h2c) {
		      console.log('[bwd] capturing ' + sel + ' ...');
		      return h2c(el, { useCORS: true });
		    }).then(function(canvas) {
		      var filename = 'screenshot-' + Date.now() + '.png';
		      canvas.toBlob(function(blob) {
		        if (typeof window !== 'undefined' && window.bw && window.bw.saveClientFile) {
		          window.bw.saveClientFile(filename, blob);
		        } else {
		          // Fallback: create a download link
		          var a = document.createElement('a');
		          a.href = URL.createObjectURL(blob);
		          a.download = filename;
		          a.click();
		          URL.revokeObjectURL(a.href);
		        }
		        console.log('[bwd] saved: ' + filename);
		      });
		    }).catch(function(err) {
		      console.error('[bwd] screenshot failed: ' + err.message);
		    });
		  }

		  // -- init -------------------------------------------------------------------

		  var bwd = {
		    tree: tree,
		    listen: listen,
		    unlisten: unlisten,
		    state: state,
		    screenshot: screenshot,
		    _listeners: _listeners
		  };

		  // Expose for testing in Node (module.exports) or browser (window.bwd)
		  if (module.exports) {
		    module.exports = bwd;
		  }
		  if (typeof window !== 'undefined') {
		    window.bwd = bwd;
		  }

		  function _printReady() {
		    console.log('[bwd] bitwrench debug toolkit ready');
		    console.log('  bwd.tree(sel?, depth?)       -- print DOM tree');
		    console.log('  bwd.listen(sel, event)       -- log events');
		    console.log('  bwd.unlisten(sel, event)     -- stop logging');
		    console.log('  bwd.state(sel?)              -- dump stateful elements');
		    console.log('  bwd.screenshot(sel?)         -- capture screenshot');
		  }

		  // Auto-load bitwrench from CDN if not present
		  if (typeof window !== 'undefined') {
		    if (window.bw && window.bw.version) {
		      _printReady();
		    } else {
		      console.log('[bwd] bitwrench not detected, loading from CDN...');
		      _loadScript(CDN_BW).then(function() {
		        _printReady();
		      }).catch(function(err) {
		        console.warn('[bwd] could not load bitwrench: ' + err.message);
		        console.log('[bwd] toolkit ready (limited -- bw.* not available)');
		        console.log('  bwd.tree, bwd.listen, bwd.unlisten still work');
		      });
		    }
		  }
		})(); 
	} (bitwrenchDebug));

	var bitwrenchDebugExports = bitwrenchDebug.exports;
	var bitwrenchDebug_default = /*@__PURE__*/getDefaultExportFromCjs(bitwrenchDebugExports);

	return bitwrenchDebug_default;

}));
//# sourceMappingURL=bitwrench-debug.js.map
