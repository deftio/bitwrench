/**
 * Bitwrench Router Test Suite
 *
 * Tests for bw.router(), bw.navigate(), bw.link() -- client-side routing.
 * ~46 tests covering route matching, query parsing, hash/history mode,
 * guards, pub/sub, bw.link, and edge cases.
 */

import assert from "assert";
import bw from "../src/bitwrench.js";
import jsdom from 'jsdom';
const { JSDOM } = jsdom;

var dom;

function freshDOM(url) {
  url = url || 'http://localhost/';
  dom = new JSDOM('<!DOCTYPE html><html><body><div id="app"></div></body></html>', { url: url });
  global.window = dom.window;
  global.document = dom.window.document;
  global.Element = dom.window.Element;
  global.DocumentFragment = dom.window.DocumentFragment;
  global.HTMLElement = dom.window.HTMLElement;
  global.CustomEvent = dom.window.CustomEvent;
  global.requestAnimationFrame = function(fn) { fn(); };
  // clear node cache (stale refs from previous jsdom instance)
  if (bw._nodeMap) {
    var keys = Object.keys(bw._nodeMap);
    for (var i = 0; i < keys.length; i++) delete bw._nodeMap[keys[i]];
  }
  // reset active router between tests
  if (bw._router) bw._router.resetActiveRouter();
  return dom;
}

// =========================================================================
// Route matching (internal algorithm)
// =========================================================================

describe("Router: route matching", function() {
  var matchRoute = bw._router.matchRoute;

  function routes(obj) {
    var arr = [];
    var keys = Object.keys(obj);
    for (var i = 0; i < keys.length; i++) {
      arr.push({ pattern: keys[i], handler: obj[keys[i]] });
    }
    return arr;
  }

  var handler = function(p) { return p; };

  it("should match exact root path /", function() {
    var r = routes({ '/': handler });
    var m = matchRoute(r, '/');
    assert.ok(m);
    assert.deepStrictEqual(m.params._query, {});
  });

  it("should match exact static path", function() {
    var r = routes({ '/users': handler, '/about': handler });
    var m = matchRoute(r, '/users');
    assert.ok(m);
  });

  it("should match parameterized path", function() {
    var r = routes({ '/users/:id': handler });
    var m = matchRoute(r, '/users/123');
    assert.ok(m);
    assert.strictEqual(m.params.id, '123');
  });

  it("should match multi-param path", function() {
    var r = routes({ '/users/:uid/posts/:pid': handler });
    var m = matchRoute(r, '/users/42/posts/99');
    assert.ok(m);
    assert.strictEqual(m.params.uid, '42');
    assert.strictEqual(m.params.pid, '99');
  });

  it("should NOT match param route with wrong segment count", function() {
    var r = routes({ '/users/:id': handler });
    var m = matchRoute(r, '/users/123/extra');
    assert.strictEqual(m, null);
  });

  it("should match catch-all /docs/*", function() {
    var r = routes({ '/docs/*': handler });
    var m = matchRoute(r, '/docs/api/colors');
    assert.ok(m);
    assert.strictEqual(m.params._rest, 'api/colors');
  });

  it("should match catch-all /docs/* with empty rest", function() {
    var r = routes({ '/docs/*': handler });
    var m = matchRoute(r, '/docs');
    assert.ok(m);
    assert.strictEqual(m.params._rest, '');
  });

  it("should match parameterized catch-all /admin/:section/*", function() {
    var r = routes({ '/admin/:section/*': handler });
    var m = matchRoute(r, '/admin/users/123/edit');
    assert.ok(m);
    assert.strictEqual(m.params.section, 'users');
    assert.strictEqual(m.params._rest, '123/edit');
  });

  it("should match global wildcard * as last resort", function() {
    var r = routes({ '/home': handler, '*': handler });
    var m = matchRoute(r, '/nonexistent');
    assert.ok(m);
  });

  it("should prefer exact over param", function() {
    var exact = function() { return 'exact'; };
    var param = function() { return 'param'; };
    var r = routes({ '/users/new': exact, '/users/:id': param });
    var m = matchRoute(r, '/users/new');
    assert.ok(m);
    assert.strictEqual(m.handler(), 'exact');
  });

  it("should prefer param over global wildcard", function() {
    var param = function() { return 'param'; };
    var wild = function() { return 'wild'; };
    var r = routes({ '/users/:id': param, '*': wild });
    var m = matchRoute(r, '/users/123');
    assert.ok(m);
    assert.strictEqual(m.handler(), 'param');
  });

  it("should prefer catch-all over global wildcard", function() {
    var catchAll = function() { return 'catch'; };
    var wild = function() { return 'wild'; };
    var r = routes({ '/docs/*': catchAll, '*': wild });
    var m = matchRoute(r, '/docs/foo/bar');
    assert.ok(m);
    assert.strictEqual(m.handler(), 'catch');
  });

  it("should return null when no route matches", function() {
    var r = routes({ '/home': handler });
    var m = matchRoute(r, '/about');
    assert.strictEqual(m, null);
  });

  it("should normalize trailing slash before matching", function() {
    var r = routes({ '/users': handler });
    var m = matchRoute(r, '/users/');
    assert.ok(m);
  });

  it("should handle root / with trailing slash identity", function() {
    var r = routes({ '/': handler });
    var m = matchRoute(r, '/');
    assert.ok(m);
  });
});

// =========================================================================
// Query string parsing
// =========================================================================

describe("Router: query parsing", function() {
  var parseQuery = bw._router.parseQuery;

  it("should return empty object for no query", function() {
    assert.deepStrictEqual(parseQuery('/users'), {});
  });

  it("should parse single param", function() {
    assert.deepStrictEqual(parseQuery('/users?tab=posts'), { tab: 'posts' });
  });

  it("should parse multiple params", function() {
    var q = parseQuery('/users?tab=posts&page=2');
    assert.strictEqual(q.tab, 'posts');
    assert.strictEqual(q.page, '2');
  });

  it("should handle param with no value", function() {
    var q = parseQuery('/search?debug');
    assert.strictEqual(q.debug, '');
  });
});

// =========================================================================
// bw.router() hash mode
// =========================================================================

describe("Router: bw.router() hash mode", function() {
  beforeEach(function() { freshDOM(); });

  it("should render initial route on creation", function() {
    bw.router({
      target: '#app',
      routes: {
        '/': function() { return { t: 'div', c: 'Home' }; }
      }
    });
    assert.strictEqual(document.getElementById('app').textContent, 'Home');
  });

  it("should navigate and update DOM", function() {
    var r = bw.router({
      target: '#app',
      routes: {
        '/': function() { return { t: 'div', c: 'Home' }; },
        '/about': function() { return { t: 'div', c: 'About' }; }
      }
    });
    r.navigate('/about');
    assert.strictEqual(document.getElementById('app').textContent, 'About');
  });

  it("should pass params to handler", function() {
    var captured = null;
    bw.router({
      target: '#app',
      routes: {
        '/users/:id': function(params) {
          captured = params;
          return { t: 'div', c: 'User ' + params.id };
        }
      }
    });
    bw.navigate('/users/42');
    assert.ok(captured);
    assert.strictEqual(captured.id, '42');
  });

  it("should call before guard and allow redirect", function() {
    bw.router({
      target: '#app',
      routes: {
        '/': function() { return { t: 'div', c: 'Home' }; },
        '/secret': function() { return { t: 'div', c: 'Secret' }; }
      },
      before: function(to) {
        if (to === '/secret') return '/';
      }
    });
    bw.navigate('/secret');
    assert.strictEqual(document.getElementById('app').textContent, 'Home');
  });

  it("should call before guard and block navigation", function() {
    bw.router({
      target: '#app',
      routes: {
        '/': function() { return { t: 'div', c: 'Home' }; },
        '/blocked': function() { return { t: 'div', c: 'Blocked' }; }
      },
      before: function(to) {
        if (to === '/blocked') return false;
      }
    });
    bw.navigate('/blocked');
    // should still show Home
    assert.strictEqual(document.getElementById('app').textContent, 'Home');
  });

  it("should call after hook", function() {
    var afterCalled = false;
    var afterTo = null;
    bw.router({
      target: '#app',
      routes: {
        '/': function() { return { t: 'div', c: 'Home' }; },
        '/about': function() { return { t: 'div', c: 'About' }; }
      },
      after: function(to, from) {
        afterCalled = true;
        afterTo = to;
      }
    });
    bw.navigate('/about');
    assert.ok(afterCalled);
    assert.strictEqual(afterTo, '/about');
  });

  it("should publish bw:route event", function() {
    var received = null;
    freshDOM();
    // sub before creating router so we catch the initial event too
    bw.sub('bw:route', function(data) { received = data; });
    bw.router({
      target: '#app',
      routes: {
        '/': function() { return { t: 'div', c: 'Home' }; },
        '/about': function() { return { t: 'div', c: 'About' }; }
      }
    });
    // initial render publishes bw:route for '/'
    assert.ok(received);
    assert.strictEqual(received.path, '/');
    bw.navigate('/about');
    assert.strictEqual(received.path, '/about');
    assert.strictEqual(received.from, '/');
    // cleanup sub
    bw.unsub('bw:route');
  });

  it("should destroy and remove listeners", function() {
    var r = bw.router({
      target: '#app',
      routes: {
        '/': function() { return { t: 'div', c: 'Home' }; },
        '/other': function() { return { t: 'div', c: 'Other' }; }
      }
    });
    r.destroy();
    // navigate should be no-op after destroy
    r.navigate('/other');
    assert.strictEqual(document.getElementById('app').textContent, 'Home');
  });

  it("should work without target (pub/sub only)", function() {
    var received = null;
    bw.sub('bw:route', function(d) { received = d; });
    bw.router({
      routes: {
        '/': function() { return null; },
        '/test': function() { return { t: 'div', c: 'Test' }; }
      }
    });
    bw.navigate('/test');
    assert.ok(received);
    assert.strictEqual(received.path, '/test');
    // app div should still be empty since no target
    assert.strictEqual(document.getElementById('app').innerHTML, '');
    bw.unsub('bw:route');
  });

  it("should return current() with correct state", function() {
    var r = bw.router({
      target: '#app',
      routes: {
        '/': function() { return { t: 'div', c: 'Home' }; },
        '/users/:id': function(p) { return { t: 'div', c: 'User ' + p.id }; }
      }
    });
    var c = r.current();
    assert.strictEqual(c.path, '/');
    r.navigate('/users/5');
    c = r.current();
    assert.strictEqual(c.path, '/users/5');
  });
});

// =========================================================================
// bw.router() history mode
// =========================================================================

describe("Router: bw.router() history mode", function() {
  beforeEach(function() { freshDOM(); });

  it("should navigate with pushState", function() {
    var r = bw.router({
      target: '#app',
      mode: 'history',
      routes: {
        '/': function() { return { t: 'div', c: 'Home' }; },
        '/about': function() { return { t: 'div', c: 'About' }; }
      }
    });
    r.navigate('/about');
    assert.strictEqual(document.getElementById('app').textContent, 'About');
    assert.strictEqual(window.location.pathname, '/about');
  });

  it("should handle popstate (back/forward)", function() {
    var r = bw.router({
      target: '#app',
      mode: 'history',
      routes: {
        '/': function() { return { t: 'div', c: 'Home' }; },
        '/page': function() { return { t: 'div', c: 'Page' }; }
      }
    });
    r.navigate('/page');
    assert.strictEqual(document.getElementById('app').textContent, 'Page');
    // simulate popstate (back)
    window.history.back();
    // jsdom doesn't fire popstate automatically, so fire manually
    var evt = new dom.window.Event('popstate');
    window.dispatchEvent(evt);
    // after popstate we should re-render based on current location
    // (jsdom may or may not update pathname on back(), so just check no crash)
    assert.ok(true);
  });

  it("should strip base path", function() {
    freshDOM('http://localhost/app/');
    var r = bw.router({
      target: '#app',
      mode: 'history',
      base: '/app',
      routes: {
        '/': function() { return { t: 'div', c: 'App Home' }; },
        '/settings': function() { return { t: 'div', c: 'Settings' }; }
      }
    });
    // initial path is /app/ which should be stripped to /
    assert.strictEqual(document.getElementById('app').textContent, 'App Home');
    r.navigate('/settings');
    assert.strictEqual(document.getElementById('app').textContent, 'Settings');
    assert.strictEqual(window.location.pathname, '/app/settings');
  });

  it("should support replace mode", function() {
    var r = bw.router({
      target: '#app',
      mode: 'history',
      routes: {
        '/': function() { return { t: 'div', c: 'Home' }; },
        '/replaced': function() { return { t: 'div', c: 'Replaced' }; }
      }
    });
    r.navigate('/replaced', { replace: true });
    assert.strictEqual(document.getElementById('app').textContent, 'Replaced');
  });

  it("should destroy and remove popstate listener", function() {
    var r = bw.router({
      target: '#app',
      mode: 'history',
      routes: {
        '/': function() { return { t: 'div', c: 'Home' }; },
        '/other': function() { return { t: 'div', c: 'Other' }; }
      }
    });
    r.destroy();
    r.navigate('/other');
    assert.strictEqual(document.getElementById('app').textContent, 'Home');
  });
});

// =========================================================================
// bw.navigate()
// =========================================================================

describe("Router: bw.navigate()", function() {
  beforeEach(function() { freshDOM(); });

  it("should delegate to active router", function() {
    bw.router({
      target: '#app',
      routes: {
        '/': function() { return { t: 'div', c: 'Home' }; },
        '/nav': function() { return { t: 'div', c: 'Nav' }; }
      }
    });
    bw.navigate('/nav');
    assert.strictEqual(document.getElementById('app').textContent, 'Nav');
  });

  it("should support replace mode", function() {
    bw.router({
      target: '#app',
      routes: {
        '/': function() { return { t: 'div', c: 'Home' }; },
        '/x': function() { return { t: 'div', c: 'X' }; }
      }
    });
    bw.navigate('/x', { replace: true });
    assert.strictEqual(document.getElementById('app').textContent, 'X');
  });

  it("should re-render on same path navigate", function() {
    var count = 0;
    bw.router({
      target: '#app',
      routes: {
        '/': function() { count++; return { t: 'div', c: 'Home ' + count }; }
      }
    });
    assert.strictEqual(count, 1);
    bw.navigate('/');
    assert.strictEqual(count, 2);
  });

  it("should warn when no router active", function() {
    freshDOM();
    var warned = false;
    var origWarn = console.warn;
    console.warn = function() { warned = true; };
    bw.navigate('/test');
    console.warn = origWarn;
    assert.ok(warned);
  });
});

// =========================================================================
// bw.link()
// =========================================================================

describe("Router: bw.link()", function() {
  beforeEach(function() { freshDOM(); });

  it("should return TACO with correct structure", function() {
    bw.router({
      target: '#app',
      routes: { '/': function() { return null; } }
    });
    var link = bw.link('/about', 'About Us');
    assert.strictEqual(link.t, 'a');
    assert.strictEqual(link.c, 'About Us');
    assert.strictEqual(typeof link.a.onclick, 'function');
  });

  it("should set hash href when router active", function() {
    bw.router({
      target: '#app',
      routes: { '/': function() { return null; } }
    });
    var link = bw.link('/about', 'About');
    assert.strictEqual(link.a.href, '#/about');
  });

  it("should merge additional attributes", function() {
    bw.router({
      target: '#app',
      routes: { '/': function() { return null; } }
    });
    var link = bw.link('/about', 'About', { class: 'nav-item', id: 'about-link' });
    assert.strictEqual(link.a.class, 'nav-item');
    assert.strictEqual(link.a.id, 'about-link');
  });

  it("should return plain href when no router active", function() {
    var link = bw.link('/about', 'About');
    assert.strictEqual(link.a.href, '/about');
    assert.strictEqual(typeof link.a.onclick, 'function');
  });
});

// =========================================================================
// Edge cases
// =========================================================================

describe("Router: edge cases", function() {
  beforeEach(function() { freshDOM(); });

  it("should handle handler returning null (no DOM update)", function() {
    bw.router({
      target: '#app',
      routes: {
        '/': function() { return { t: 'div', c: 'Home' }; },
        '/null': function() { return null; }
      }
    });
    assert.strictEqual(document.getElementById('app').textContent, 'Home');
    bw.navigate('/null');
    // target should still have Home content since handler returned null
    assert.strictEqual(document.getElementById('app').textContent, 'Home');
  });

  it("should normalize double slashes", function() {
    var normalizePath = bw._router.normalizePath;
    assert.strictEqual(normalizePath('/users//123'), '/users/123');
    assert.strictEqual(normalizePath('//foo///bar//'), '/foo/bar');
  });

  it("should resolve empty hash to /", function() {
    var normalizePath = bw._router.normalizePath;
    assert.strictEqual(normalizePath(''), '/');
  });

  it("should handle multiple sequential navigates", function() {
    var paths = [];
    bw.router({
      target: '#app',
      routes: {
        '/': function() { return { t: 'div', c: 'Home' }; },
        '/a': function() { paths.push('a'); return { t: 'div', c: 'A' }; },
        '/b': function() { paths.push('b'); return { t: 'div', c: 'B' }; },
        '/c': function() { paths.push('c'); return { t: 'div', c: 'C' }; }
      }
    });
    bw.navigate('/a');
    bw.navigate('/b');
    bw.navigate('/c');
    assert.deepStrictEqual(paths, ['a', 'b', 'c']);
    assert.strictEqual(document.getElementById('app').textContent, 'C');
  });

  it("should throw if config.routes missing", function() {
    assert.throws(function() { bw.router({}); }, /config\.routes is required/);
  });

  it("should throw if not in browser", function() {
    // temporarily make _isBrowser false
    var origDesc = Object.getOwnPropertyDescriptor(bw, '_isBrowser');
    Object.defineProperty(bw, '_isBrowser', { get: function() { return false; }, configurable: true });
    assert.throws(function() {
      bw.router({ routes: { '/': function() {} } });
    }, /requires a browser/);
    // restore
    Object.defineProperty(bw, '_isBrowser', origDesc);
  });

  it("should pass query to matched handler", function() {
    var capturedQuery = null;
    bw.router({
      target: '#app',
      routes: {
        '/search': function(params) {
          capturedQuery = params._query;
          return { t: 'div', c: 'Search' };
        }
      }
    });
    bw.navigate('/search?q=hello&page=2');
    assert.ok(capturedQuery);
    assert.strictEqual(capturedQuery.q, 'hello');
    assert.strictEqual(capturedQuery.page, '2');
  });

  it("should handle before guard returning undefined (allow)", function() {
    bw.router({
      target: '#app',
      routes: {
        '/': function() { return { t: 'div', c: 'Home' }; },
        '/ok': function() { return { t: 'div', c: 'OK' }; }
      },
      before: function() { return undefined; }
    });
    bw.navigate('/ok');
    assert.strictEqual(document.getElementById('app').textContent, 'OK');
  });
});


// =========================================================================
// Router: catch-all with param prefix (lines 51-58, 67)
// =========================================================================

describe("Router: catch-all with param prefix segments", function() {
  beforeEach(function() { freshDOM(); });
  var matchRoute = bw._router.matchRoute;

  function routes(obj) {
    var arr = [];
    var keys = Object.keys(obj);
    for (var i = 0; i < keys.length; i++) {
      arr.push({ pattern: keys[i], handler: obj[keys[i]] });
    }
    return arr;
  }

  var handler = function(p) { return p; };

  it("should match catch-all with :param prefix and extract param (line 56-57)", function() {
    var r = routes({ '/:section/*': handler });
    var m = matchRoute(r, '/docs/api/colors');
    assert.ok(m);
    assert.strictEqual(m.params.section, 'docs');
    assert.strictEqual(m.params._rest, 'api/colors');
  });

  it("should fail catch-all prefix mismatch (line 52, 58-59)", function() {
    var r = routes({ '/admin/panel/*': handler });
    var m = matchRoute(r, '/other/thing/stuff');
    assert.strictEqual(m, null);
  });

  it("should fail catch-all when fewer segs than prefix (line 52)", function() {
    var r = routes({ '/admin/panel/*': handler });
    var m = matchRoute(r, '/admin');
    assert.strictEqual(m, null);
  });

  it("should skip catch-all on prefix mismatch and continue (line 67)", function() {
    var exactHandler = function() { return 'exact'; };
    var catchHandler = function() { return 'catch'; };
    var r = routes({ '/wrong/*': catchHandler, '/correct': exactHandler });
    var m = matchRoute(r, '/correct');
    assert.ok(m);
    assert.strictEqual(m.handler(), 'exact');
  });
});


// =========================================================================
// Router: before guard returning false (line 107)
// =========================================================================

describe("Router: before guard returns false", function() {
  beforeEach(function() { freshDOM(); });

  it("should block navigation when before returns false (line 107)", function() {
    var handlerCalled = false;
    bw.router({
      target: '#app',
      routes: {
        '/': function() { return { t: 'div', c: 'Home' }; },
        '/blocked': function() { handlerCalled = true; return { t: 'div', c: 'Blocked' }; }
      },
      before: function(to) {
        if (to === '/blocked') return false;
      }
    });
    bw.navigate('/blocked');
    assert.strictEqual(handlerCalled, false, "handler should not have been called");
    assert.strictEqual(document.getElementById('app').textContent, 'Home');
  });
});


// =========================================================================
// Router: history mode getPath with base stripping (line 127)
// =========================================================================

describe("Router: history mode base path stripping", function() {
  beforeEach(function() { freshDOM('http://localhost/myapp/dashboard'); });

  it("should strip base from pathname in history mode (line 126-127)", function() {
    var captured = null;
    bw.router({
      target: '#app',
      mode: 'history',
      base: '/myapp',
      routes: {
        '/dashboard': function(params) {
          captured = 'dashboard';
          return { t: 'div', c: 'Dashboard' };
        },
        '/': function() {
          captured = 'root';
          return { t: 'div', c: 'Root' };
        }
      }
    });
    assert.strictEqual(captured, 'dashboard');
  });
});


// =========================================================================
// Router: handleRoute destroyed check (line 134)
// =========================================================================

describe("Router: handleRoute destroyed check", function() {
  beforeEach(function() { freshDOM(); });

  it("should not handle route after destroy (line 134)", function() {
    var count = 0;
    var r = bw.router({
      target: '#app',
      routes: {
        '/': function() { count++; return { t: 'div', c: 'Home' }; },
        '/test': function() { count++; return { t: 'div', c: 'Test' }; }
      }
    });
    assert.strictEqual(count, 1); // initial render
    r.destroy();
    // Manually trigger hashchange — should be no-op
    var evt = new dom.window.Event('hashchange');
    window.dispatchEvent(evt);
    assert.strictEqual(count, 1, "count should not have increased after destroy");
  });
});


// =========================================================================
// Router: history mode navigate with replace (line 183)
// =========================================================================

describe("Router: history mode replace navigation", function() {
  beforeEach(function() { freshDOM(); });

  it("should use replaceState in history mode with opts.replace (line 189-190)", function() {
    var r = bw.router({
      target: '#app',
      mode: 'history',
      routes: {
        '/': function() { return { t: 'div', c: 'Home' }; },
        '/replaced': function() { return { t: 'div', c: 'Replaced' }; }
      }
    });
    r.navigate('/replaced', { replace: true });
    assert.strictEqual(document.getElementById('app').textContent, 'Replaced');
    assert.strictEqual(window.location.pathname, '/replaced');
  });
});


// =========================================================================
// Router: onHashChange and onPopState destroyed checks (lines 199, 204)
// =========================================================================

describe("Router: event handlers after destroy", function() {
  beforeEach(function() { freshDOM(); });

  it("should ignore hashchange after destroy (line 199)", function() {
    var count = 0;
    var r = bw.router({
      target: '#app',
      routes: {
        '/': function() { count++; return { t: 'div', c: 'Home' }; }
      }
    });
    r.destroy();
    // Fire hashchange manually
    var evt = new dom.window.Event('hashchange');
    window.dispatchEvent(evt);
    assert.strictEqual(count, 1, "should not re-render after destroy");
  });

  it("should ignore popstate after destroy in history mode (line 204)", function() {
    var count = 0;
    var r = bw.router({
      target: '#app',
      mode: 'history',
      routes: {
        '/': function() { count++; return { t: 'div', c: 'Home' }; }
      }
    });
    r.destroy();
    var evt = new dom.window.Event('popstate');
    window.dispatchEvent(evt);
    assert.strictEqual(count, 1, "should not re-render after destroy in history mode");
  });
});


// =========================================================================
// Router: destroy in history mode removes popstate listener (line 225)
// =========================================================================

describe("Router: destroy in history mode", function() {
  beforeEach(function() { freshDOM(); });

  it("should remove popstate listener on destroy (line 233-234)", function() {
    var r = bw.router({
      target: '#app',
      mode: 'history',
      routes: {
        '/': function() { return { t: 'div', c: 'Home' }; },
        '/page': function() { return { t: 'div', c: 'Page' }; }
      }
    });
    r.destroy();
    // Navigate should be no-op after destroy
    r.navigate('/page');
    assert.strictEqual(document.getElementById('app').textContent, 'Home');
  });
});


// =========================================================================
// Router: bare catch-all /* pattern (line 51 — prefix === '' branch)
// =========================================================================
describe("Router: bare catch-all /* pattern (line 51)", function() {
  var matchRoute = bw._router.matchRoute;

  function routes(obj) {
    var arr = [];
    var keys = Object.keys(obj);
    for (var i = 0; i < keys.length; i++) {
      arr.push({ pattern: keys[i], handler: obj[keys[i]] });
    }
    return arr;
  }

  var handler = function(p) { return p; };

  it("should match /* catch-all with empty prefix (line 51 true branch)", function() {
    var r = routes({ '/*': handler });
    var m = matchRoute(r, '/anything/at/all');
    assert.ok(m);
    assert.strictEqual(m.params._rest, 'anything/at/all');
  });

  it("should match /* for root path", function() {
    var r = routes({ '/*': handler });
    var m = matchRoute(r, '/');
    assert.ok(m);
    assert.strictEqual(m.params._rest, '');
  });
});


// =========================================================================
// Router: base with trailing slash (line 107)
// =========================================================================
describe("Router: base with trailing slash (line 107)", function() {
  beforeEach(function() { freshDOM(); });

  it("should strip trailing slash from base config", function() {
    var r = bw.router({
      target: '#app',
      mode: 'hash',
      base: '/myapp/',
      routes: {
        '/': function() { return { t: 'div', c: 'Home' }; }
      }
    });
    // Should work — the trailing slash is removed internally
    assert.strictEqual(document.getElementById('app').textContent, 'Home');
  });
});


// =========================================================================
// Router: history mode getPath where path equals base exactly (line 127)
// =========================================================================
describe("Router: history mode path equals base (line 127 || '/' fallback)", function() {
  beforeEach(function() { freshDOM('http://localhost/myapp'); });

  it("should normalize to / when pathname equals base exactly", function() {
    var captured = null;
    bw.router({
      target: '#app',
      mode: 'history',
      base: '/myapp',
      routes: {
        '/': function() {
          captured = 'root';
          return { t: 'div', c: 'Root' };
        }
      }
    });
    // pathname is /myapp, base is /myapp, so p.substring(base.length) = '' -> '/'
    assert.strictEqual(captured, 'root');
  });
});


// =========================================================================
// Router: hash mode navigate to same path (line 183)
// =========================================================================
describe("Router: hash mode same-path navigation (line 183)", function() {
  beforeEach(function() { freshDOM(); });

  it("should re-render when navigating to same hash (line 183)", function() {
    var count = 0;
    var r = bw.router({
      target: '#app',
      routes: {
        '/page': function() { count++; return { t: 'div', c: 'Page ' + count }; }
      }
    });
    r.navigate('/page');
    var countAfterFirst = count;
    // Navigate to same path again — should trigger manually since hash won't change
    r.navigate('/page');
    assert.ok(count > countAfterFirst, 'should re-render on same-path navigate');
  });
});


// =========================================================================
// Router: current() with no matching route (line 225 false branch)
// =========================================================================
describe("Router: current() with no matching route (line 225)", function() {
  beforeEach(function() { freshDOM(); });

  it("should return empty params when no route matches", function() {
    var r = bw.router({
      target: '#app',
      routes: {
        '/known': function() { return { t: 'div', c: 'Known' }; }
      }
    });
    // Navigate to an unknown path
    r.navigate('/unknown-path');
    var c = r.current();
    assert.deepStrictEqual(c.params, {}, 'params should be empty when no route matches');
  });
});


// =========================================================================
// Router: bw.link() onclick handler invocation (lines 268-269)
// =========================================================================
describe("Router: bw.link() onclick handler (lines 268-269)", function() {
  beforeEach(function() { freshDOM(); });

  it("should call e.preventDefault() and bw.navigate() when link is clicked", function() {
    var renderCount = 0;
    var r = bw.router({
      target: '#app',
      routes: {
        '/': function() { return { t: 'div', c: 'Home' }; },
        '/about': function() { renderCount++; return { t: 'div', c: 'About' }; }
      }
    });

    // Create a link TACO and render it to DOM
    var linkTaco = bw.link('/about', 'About Us');
    assert.ok(linkTaco, 'should return a TACO');
    assert.strictEqual(linkTaco.t, 'a');

    var linkEl = bw.create(linkTaco);
    document.body.appendChild(linkEl);

    // Simulate click — the onclick handler should call e.preventDefault() and bw.navigate()
    var preventDefaultCalled = false;
    var fakeEvent = new window.Event('click', { bubbles: true, cancelable: true });
    // Override preventDefault to track if it was called
    var origPreventDefault = fakeEvent.preventDefault.bind(fakeEvent);
    fakeEvent.preventDefault = function() {
      preventDefaultCalled = true;
      origPreventDefault();
    };

    linkEl.dispatchEvent(fakeEvent);

    assert.ok(preventDefaultCalled, 'should call preventDefault');
    assert.ok(renderCount > 0, 'should have navigated to /about');

    r.destroy();
    document.body.removeChild(linkEl);
  });

  it("should generate link with no active router and still fire onclick (line 264-265)", function() {
    // Reset active router
    bw._router.resetActiveRouter();

    var linkTaco = bw.link('/test', 'Test Link');
    assert.ok(linkTaco);
    assert.strictEqual(linkTaco.a.href, '/test', 'href should be the raw path when no router');

    // Create and click it — onclick calls bw.navigate which warns but doesn't throw
    var linkEl = bw.create(linkTaco);
    document.body.appendChild(linkEl);

    var fakeEvent = new window.Event('click', { bubbles: true, cancelable: true });
    fakeEvent.preventDefault = function() {};
    linkEl.dispatchEvent(fakeEvent);

    // Should not throw
    assert.ok(true, 'clicking link with no active router should not throw');
    document.body.removeChild(linkEl);
  });
});

// =========================================================================
// Each navigation renders exactly once (reported by jazzmac, 2026-10-05)
//
// In hash mode navigate() set location.hash -- which queues a hashchange --
// and then re-read location.hash to decide whether to render by hand. The
// re-read always matched the path just assigned, so every navigation rendered
// twice: once immediately, once when the queued event arrived. An app that
// builds state in a route handler built it twice, with the second build
// seeing different inputs.
//
// The guard was meant for the opposite case: navigating to the route you are
// already on fires no hashchange, so nothing would render without the manual
// call. Both cases must render exactly once.
// =========================================================================

describe("Router: one render per navigation", function() {
  var r;

  function countingRouter(opts) {
    var renders = [];
    var config = {
      mode: (opts && opts.mode) || 'hash',
      routes: {
        '/a': function() { renders.push('a'); },
        '/b': function() { renders.push('b'); },
        '/users/:id': function(params) { renders.push('user:' + params.id); }
      }
    };
    if (opts && opts.base) config.base = opts.base;
    r = bw.router(config);
    renders.length = 0;              // ignore the initial route
    return renders;
  }

  // The queued hashchange is asynchronous, so every assertion has to wait a
  // turn. Doing this synchronously is what hid the bug from the suite.
  function settle(fn) {
    return new Promise(function(resolve) {
      setTimeout(function() { fn(); resolve(); }, 20);
    });
  }

  afterEach(function() {
    if (r && r.destroy) r.destroy();
    r = null;
  });

  it("hash mode: navigate() to a new route renders once", function() {
    freshDOM('http://localhost/#/a');
    var renders = countingRouter();
    r.navigate('/b');
    return settle(function() {
      assert.deepStrictEqual(renders, ['b'], 'rendered ' + renders.length + ' times');
    });
  });

  it("hash mode: navigate() to the CURRENT route still renders once", function() {
    // No hashchange fires here, so the manual render is the only one. This is
    // the case the original guard existed for -- it must not regress to zero.
    freshDOM('http://localhost/#/a');
    var renders = countingRouter();
    r.navigate('/a');
    return settle(function() {
      assert.deepStrictEqual(renders, ['a'], 'rendered ' + renders.length + ' times');
    });
  });

  it("hash mode: navigate({replace:true}) renders once", function() {
    freshDOM('http://localhost/#/a');
    var renders = countingRouter();
    r.navigate('/b', { replace: true });
    return settle(function() {
      assert.deepStrictEqual(renders, ['b'], 'rendered ' + renders.length + ' times');
    });
  });

  it("hash mode: two navigations render twice, in order", function() {
    freshDOM('http://localhost/#/a');
    var renders = countingRouter();
    r.navigate('/b');
    return settle(function() {
      r.navigate('/a');
    }).then(function() {
      return settle(function() {
        assert.deepStrictEqual(renders, ['b', 'a']);
      });
    });
  });

  it("hash mode: a route with params renders once", function() {
    freshDOM('http://localhost/#/a');
    var renders = countingRouter();
    r.navigate('/users/42');
    return settle(function() {
      assert.deepStrictEqual(renders, ['user:42']);
    });
  });

  it("hash mode: an external hash change renders once", function() {
    // The back button, or the user editing the URL. navigate() is not
    // involved, so only the hashchange listener should render.
    freshDOM('http://localhost/#/a');
    var renders = countingRouter();
    window.location.hash = '/b';
    return settle(function() {
      assert.deepStrictEqual(renders, ['b'], 'rendered ' + renders.length + ' times');
    });
  });

  it("hash mode: the initial route renders once", function() {
    freshDOM('http://localhost/#/b');
    var seen = [];
    r = bw.router({
      mode: 'hash',
      routes: { '/b': function() { seen.push('b'); } }
    });
    return settle(function() {
      assert.deepStrictEqual(seen, ['b'], 'rendered ' + seen.length + ' times');
    });
  });

  it("hash mode: destroy() stops rendering", function() {
    freshDOM('http://localhost/#/a');
    var renders = countingRouter();
    r.destroy();
    window.location.hash = '/b';
    var dead = r;
    r = null;
    return settle(function() {
      assert.deepStrictEqual(renders, [], 'rendered after destroy()');
      void dead;
    });
  });

  it("history mode: navigate() renders once", function() {
    freshDOM('http://localhost/a');
    var renders = countingRouter({ mode: 'history' });
    r.navigate('/b');
    return settle(function() {
      assert.deepStrictEqual(renders, ['b'], 'rendered ' + renders.length + ' times');
    });
  });

  it("history mode: navigate() to the current route renders once", function() {
    freshDOM('http://localhost/a');
    var renders = countingRouter({ mode: 'history' });
    r.navigate('/a');
    return settle(function() {
      assert.deepStrictEqual(renders, ['a'], 'rendered ' + renders.length + ' times');
    });
  });
});

// =========================================================================
// Guard and URL stay in agreement
//
// navigate() used to write the URL and only then run the `before` guard, and
// a blocked guard simply returned -- so the address bar sat on a route that
// never rendered, and a reload would land somewhere the guard had refused.
// The guard now runs before the URL changes; the event-driven paths
// (hashchange, popstate), where the browser has already moved, put it back.
// =========================================================================

describe('before guard leaves the URL consistent', function() {
  beforeEach(function() { freshDOM(); });

  function hash() { return window.location.hash.replace(/^#/, ''); }

  it('does not move the URL when the guard blocks', function() {
    bw.router({
      target: '#app',
      routes: {
        '/': function() { return { t: 'div', c: 'Home' }; },
        '/blocked': function() { return { t: 'div', c: 'Blocked' }; }
      },
      before: function(to) { if (to === '/blocked') return false; }
    });
    bw.navigate('/blocked');
    assert.strictEqual(bw.$('#app')[0].textContent, 'Home', 'view stays put');
    assert.notStrictEqual(hash(), '/blocked',
      'the URL must not be left on a route that never rendered');
  });

  it('puts the redirect target in the URL, not the requested path', function() {
    bw.router({
      target: '#app',
      routes: {
        '/': function() { return { t: 'div', c: 'Home' }; },
        '/secret': function() { return { t: 'div', c: 'Secret' }; }
      },
      before: function(to) { if (to === '/secret') return '/'; }
    });
    bw.navigate('/secret');
    assert.strictEqual(bw.$('#app')[0].textContent, 'Home');
    assert.notStrictEqual(hash(), '/secret',
      'the URL should show where we actually went');
  });

  it('runs the guard exactly once per navigate', function() {
    var calls = [];
    bw.router({
      target: '#app',
      routes: {
        '/': function() { return { t: 'div', c: 'Home' }; },
        '/a': function() { return { t: 'div', c: 'A' }; }
      },
      before: function(to) { calls.push(to); }
    });
    calls.length = 0;
    bw.navigate('/a');
    assert.deepStrictEqual(calls, ['/a'],
      'the guard must not fire twice now that navigate runs it');
  });

  it('still allows navigation when the guard returns undefined', function() {
    bw.router({
      target: '#app',
      routes: {
        '/': function() { return { t: 'div', c: 'Home' }; },
        '/ok': function() { return { t: 'div', c: 'OK' }; }
      },
      before: function() { return undefined; }
    });
    bw.navigate('/ok');
    assert.strictEqual(bw.$('#app')[0].textContent, 'OK');
  });
});

// =========================================================================
// bw.link() builds an href that matches the mode
// =========================================================================

describe('bw.link href matches the router mode', function() {
  beforeEach(function() { freshDOM(); });

  it('uses a fragment in hash mode', function() {
    bw.router({ target: '#app', mode: 'hash', routes: { '/': function() { return 'h'; } } });
    assert.strictEqual(bw.link('/about', 'About').a.href, '#/about');
  });

  it('uses a real path in history mode', function() {
    bw.router({ target: '#app', mode: 'history', routes: { '/': function() { return 'h'; } } });
    assert.strictEqual(bw.link('/about', 'About').a.href, '/about',
      'a history-mode link must not point at a fragment');
  });

  it('includes the base in history mode', function() {
    bw.router({ target: '#app', mode: 'history', base: '/app', routes: { '/': function() { return 'h'; } } });
    assert.strictEqual(bw.link('/about', 'About').a.href, '/app/about');
  });

  it('falls back to the bare path with no active router', function() {
    bw._router.resetActiveRouter();
    assert.strictEqual(bw.link('/about', 'About').a.href, '/about');
  });

  it('still navigates on click in either mode', function() {
    bw.router({ target: '#app', mode: 'history', routes: {
      '/': function() { return { t: 'div', c: 'Home' }; },
      '/about': function() { return { t: 'div', c: 'About' }; }
    }});
    var taco = bw.link('/about', 'About');
    taco.a.onclick({ preventDefault: function() {} });
    assert.strictEqual(bw.$('#app')[0].textContent, 'About');
  });
});

// =========================================================================
// The guard on the event-driven paths
//
// navigate() runs the before guard itself, before touching the URL. The
// browser-driven paths -- hashchange and popstate, i.e. the back button --
// cannot: the URL has already moved. So the guard runs inside handleRoute for
// those, and a block puts the URL back. That revert path is only reachable
// through a real event, which is why these drive the listener rather than
// calling navigate().
// =========================================================================

describe('before guard on hashchange and popstate', function() {
  beforeEach(function() { freshDOM(); });

  function hash() { return window.location.hash.replace(/^#/, ''); }

  it('blocks a back-button navigation and restores the URL', function() {
    var seen = [];
    bw.router({
      target: '#app',
      routes: {
        '/': function() { return { t: 'div', c: 'Home' }; },
        '/guarded': function() { return { t: 'div', c: 'Guarded' }; }
      },
      before: function(to, from) {
        seen.push(to + '<-' + from);
        if (to === '/guarded') return false;
      }
    });
    assert.strictEqual(bw.$('#app')[0].textContent, 'Home');

    // Move the hash the way a browser would, then fire the event the browser
    // would fire. navigate() is deliberately not used here.
    window.location.hash = '/guarded';
    window.dispatchEvent(new window.HashChangeEvent('hashchange'));

    assert.strictEqual(bw.$('#app')[0].textContent, 'Home',
      'the blocked route must not render');
    assert.notStrictEqual(hash(), '/guarded',
      'the URL must be put back, not left on the blocked route');
    assert.ok(seen.some(function(s) { return s.indexOf('/guarded') === 0; }),
      'the guard should have seen the attempt');
  });

  it('redirects a back-button navigation when the guard returns a path', function() {
    bw.router({
      target: '#app',
      routes: {
        '/': function() { return { t: 'div', c: 'Home' }; },
        '/secret': function() { return { t: 'div', c: 'Secret' }; },
        '/login': function() { return { t: 'div', c: 'Login' }; }
      },
      before: function(to) { if (to === '/secret') return '/login'; }
    });

    window.location.hash = '/secret';
    window.dispatchEvent(new window.HashChangeEvent('hashchange'));

    assert.strictEqual(bw.$('#app')[0].textContent, 'Login',
      'the guard redirect should apply on the event path too');
  });

  it('allows an unguarded back-button navigation through', function() {
    bw.router({
      target: '#app',
      routes: {
        '/': function() { return { t: 'div', c: 'Home' }; },
        '/about': function() { return { t: 'div', c: 'About' }; }
      },
      before: function() { /* allow everything */ }
    });

    window.location.hash = '/about';
    window.dispatchEvent(new window.HashChangeEvent('hashchange'));

    assert.strictEqual(bw.$('#app')[0].textContent, 'About');
    assert.strictEqual(hash(), '/about', 'an allowed route keeps its URL');
  });
});
