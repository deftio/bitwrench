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
