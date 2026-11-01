/**
 * Bitwrench Router -- client-side URL routing for SPAs
 *
 * Single export: initRouter(bw) attaches bw.router(), bw.navigate(), bw.link()
 *
 * @license BSD-2-Clause
 */

// -- internal helpers --

function normalizePath(p) {
  // strip query string (handled separately)
  var qi = p.indexOf('?');
  if (qi >= 0) p = p.substring(0, qi);
  // collapse double slashes, strip trailing slash
  p = p.replace(/\/\/+/g, '/');
  if (p.length > 1 && p.charAt(p.length - 1) === '/') p = p.substring(0, p.length - 1);
  return p || '/';
}

function parseQuery(fullPath) {
  var qi = fullPath.indexOf('?');
  if (qi < 0) return {};
  var qs = fullPath.substring(qi + 1);
  var result = {};
  var pairs = qs.split('&');
  for (var i = 0; i < pairs.length; i++) {
    var kv = pairs[i].split('=');
    if (kv[0]) result[decodeURIComponent(kv[0])] = kv.length > 1 ? decodeURIComponent(kv[1]) : '';
  }
  return result;
}

function matchRoute(routes, rawPath) {
  var query = parseQuery(rawPath);
  var path = normalizePath(rawPath);
  var segs = path === '/' ? [''] : path.split('/');

  var globalWild = null;

  for (var i = 0; i < routes.length; i++) {
    var r = routes[i];
    var pattern = r.pattern;

    // global wildcard -- save for last
    if (pattern === '*') { globalWild = r; continue; }

    // catch-all: ends with /*
    if (pattern.length > 1 && pattern.substring(pattern.length - 2) === '/*') {
      var prefix = pattern.substring(0, pattern.length - 2);
      var prefixSegs = prefix === '' ? [''] : prefix.split('/');
      if (segs.length < prefixSegs.length) continue;
      var params = {};
      var ok = true;
      for (var j = 0; j < prefixSegs.length; j++) {
        if (prefixSegs[j].charAt(0) === ':') {
          params[prefixSegs[j].substring(1)] = segs[j];
        } else if (prefixSegs[j] !== segs[j]) {
          ok = false; break;
        }
      }
      if (ok) {
        params._rest = segs.slice(prefixSegs.length).join('/');
        params._query = query;
        return { handler: r.handler, params: params };
      }
      continue;
    }

    // exact / parameterized match
    var rSegs = pattern === '/' ? [''] : pattern.split('/');
    if (rSegs.length !== segs.length) continue;
    var params2 = {};
    var match = true;
    for (var k = 0; k < rSegs.length; k++) {
      if (rSegs[k].charAt(0) === ':') {
        params2[rSegs[k].substring(1)] = segs[k];
      } else if (rSegs[k] !== segs[k]) {
        match = false; break;
      }
    }
    if (match) {
      params2._query = query;
      return { handler: r.handler, params: params2 };
    }
  }

  // global wildcard fallback
  if (globalWild) {
    return { handler: globalWild.handler, params: { _query: query } };
  }
  return null;
}


// -- public API factory --

export function initRouter(bw) {
  var _activeRouter = null;

  /**
   * Create a client-side router: URLs in, TACOs out.
   *
   * Route handlers return TACO; the router mounts the result into `target`.
   * Hash mode needs no server config; history mode needs the server to serve
   * the app for unknown paths. Returns a router object with `navigate`,
   * `current`, `destroy`, and the `mode` and `base` it was built with. (There
   * is no `stop` -- the teardown method is `destroy`.)
   *
   * @param {Object} config - Router configuration
   * @param {Object} config.routes - Map of path pattern to handler, e.g.
   *   `{ '/': fn, '/users/:id': fn, '*': fn }`. A handler receives ONE
   *   argument: the params object, which also carries `_query` (parsed query
   *   string) and, for a `*` route, `_rest`. It returns a TACO.
   * @param {string|Element} [config.target] - Where to mount each view
   * @param {string} [config.mode='hash'] - 'hash' or 'history'
   * @param {string} [config.base='/'] - Base path for history mode
   * @param {Function} [config.before] - Guard, called as (toPath, fromPath).
   *   Return `false` to block (the URL is left alone, or restored on a back
   *   button), or a path string to redirect.
   * @param {Function} [config.after] - Called after each successful navigation
   * @returns {Object} Router object
   * @category Routing
   * @see bw.navigate
   * @see bw.link
   * @example
   * bw.router({
   *   target: '#app',
   *   routes: {
   *     '/':          function() { return { t: 'h1', c: 'Home' }; },
   *     '/users/:id': function(params) { return { t: 'h1', c: 'User ' + params.id }; },
   *     '*':          function() { return { t: 'h1', c: 'Not found' }; }
   *   }
   * });
   */
  bw.router = function(config) {
    if (!config || !config.routes) throw new Error('bw.router: config.routes is required');
    if (!bw._isBrowser) throw new Error('bw.router: requires a browser environment');

    var mode = config.mode || 'hash';
    var base = config.base || '/';
    if (base.length > 1 && base.charAt(base.length - 1) === '/') base = base.substring(0, base.length - 1);
    var target = config.target || null;

    // compile routes (preserve registration order)
    var routes = [];
    var keys = Object.keys(config.routes);
    for (var i = 0; i < keys.length; i++) {
      routes.push({ pattern: keys[i], handler: config.routes[keys[i]] });
    }

    var currentPath = '/';
    var destroyed = false;
    // Path whose queued hashchange navigate() has already rendered. Cleared as
    // soon as it is consumed, so a genuine external hash change is never lost.
    var suppressHash = null;

    function getPath() {
      if (mode === 'hash') {
        var h = window.location.hash.replace(/^#/, '');
        return h || '/';
      }
      var p = window.location.pathname;
      if (base !== '/' && p.indexOf(base) === 0) {
        p = p.substring(base.length) || '/';
      }
      var s = window.location.search || '';
      return p + s;
    }

    function handleRoute(toRaw, _opts, guardRan) {
      /* c8 ignore next -- all callers (navigate, onHashChange, onPopState) check destroyed first */
      if (destroyed) return;
      var fromPath = currentPath;
      var toPath = normalizePath(toRaw);

      // before guard. navigate() runs it itself, before writing the URL, and
      // passes guardRan so it does not fire twice. The event-driven paths
      // (hashchange, popstate) cannot run it first -- the browser has already
      // changed the URL -- so they run it here and put the URL back if it
      // blocks. Previously a blocked guard just returned, leaving the address
      // bar on a route that never rendered.
      if (!guardRan && config.before) {
        var result = config.before(toPath, fromPath);
        if (result === false) {
          writeUrl(fromPath, true);
          return;
        }
        if (typeof result === 'string') {
          toPath = normalizePath(result);
          toRaw = result;
        }
      }

      currentPath = toPath;

      // match route
      var m = matchRoute(routes, toRaw);
      if (m) {
        var rendered = m.handler(m.params);
        if (rendered != null && target) {
          bw.DOM(target, rendered);
        }
      }

      // pub/sub
      var query = parseQuery(toRaw);
      bw.pub('bw:route', {
        path: toPath,
        params: m ? m.params : {},
        query: query,
        from: fromPath
      });

      // after hook
      if (config.after) config.after(toPath, fromPath);
    }

    // Write the address bar without rendering. `replace` avoids adding a
    // history entry, which is what a guard-blocked revert wants.
    function writeUrl(path, replace) {
      if (mode === 'hash') {
        var loc = window.location;
        if (replace) {
          loc.replace(loc.pathname + loc.search + '#' + path);
        } else {
          window.location.hash = path;
        }
      } else {
        var url = (base === '/' ? '' : base) + path;
        if (replace) {
          window.history.replaceState(null, '', url);
        } else {
          window.history.pushState(null, '', url);
        }
      }
    }

    function navigate(path, opts) {
      if (destroyed) return;
      opts = opts || {};

      // Run the guard before the URL changes, so a blocked navigation leaves
      // the address bar alone instead of stranding it on a route that never
      // rendered. A redirect is followed here too, so the URL that lands is
      // the one actually shown.
      if (config.before) {
        var guard = config.before(normalizePath(path), currentPath);
        if (guard === false) return;
        if (typeof guard === 'string') path = guard;
      }
      if (mode === 'hash') {
        // Setting location.hash updates it synchronously but fires hashchange
        // asynchronously. The old code re-read the hash afterwards to decide
        // whether to render by hand -- which always matched the path just
        // assigned, so every navigation rendered twice: once here and once
        // when the queued event arrived. Reported by jazzmac, 2026-10-05.
        //
        // Render here, synchronously, as navigate() always has: callers read
        // the DOM straight after. Then mark the path so the hashchange this
        // call is about to cause is recognised and ignored. Going async
        // instead would fix the duplicate and break every caller that reads
        // the DOM on the next line.
        var hashBefore = window.location.hash.replace(/^#/, '') || '/';
        var willFireEvent = normalizePath(hashBefore) !== normalizePath(path);
        writeUrl(path, opts.replace);
        // When the hash did not change no event is coming, so nothing to skip.
        if (willFireEvent) suppressHash = normalizePath(path);
      } else {
        writeUrl(path, opts.replace);
      }
      handleRoute(path, opts, true);
    }

    function onHashChange() {
      /* c8 ignore next -- destroy() removes the hashchange listener; belt-and-suspenders guard */
      if (destroyed) return;
      var path = getPath();
      // Our own navigate() already rendered this one synchronously.
      if (suppressHash !== null && normalizePath(path) === suppressHash) {
        suppressHash = null;
        return;
      }
      suppressHash = null;
      handleRoute(path);
    }

    function onPopState() {
      /* c8 ignore next -- destroy() removes the popstate listener; belt-and-suspenders guard */
      if (destroyed) return;
      handleRoute(getPath());
    }

    // listen
    if (mode === 'hash') {
      window.addEventListener('hashchange', onHashChange);
    } else {
      window.addEventListener('popstate', onPopState);
    }

    // initial render
    handleRoute(getPath());

    var routerObj = {
      navigate: navigate,
      // bw.link() needs these to build an href that matches the mode. It used
      // to prefix '#' whenever any router was active, so every link in a
      // history-mode app pointed at a fragment.
      mode: mode,
      base: base,
      current: function() {
        var raw = getPath();
        var m = matchRoute(routes, raw);
        return {
          path: currentPath,
          params: m ? m.params : {},
          query: parseQuery(raw)
        };
      },
      destroy: function() {
        destroyed = true;
        if (mode === 'hash') {
          window.removeEventListener('hashchange', onHashChange);
        } else {
          window.removeEventListener('popstate', onPopState);
        }
        if (_activeRouter === routerObj) _activeRouter = null;
      }
    };

    _activeRouter = routerObj;
    return routerObj;
  };

  /**
   * Navigate the active router to a path.
   *
   * Warns and does nothing when no router is running, so a stray call cannot
   * leave the page half-navigated.
   *
   * @param {string} path - Target path, e.g. '/users/123'
   * @param {Object} [opts] - { replace: true } to replace the history entry
   *   instead of pushing one
   * @category Routing
   * @see bw.router
   * @example
   * bw.navigate('/users/123');
   * bw.navigate('/login', { replace: true });
   */
  bw.navigate = function(path, opts) {
    if (_activeRouter) {
      _activeRouter.navigate(path, opts);
    } else {
      if (typeof console !== 'undefined' && console.warn) {
        console.warn('bw.navigate: no active router');
      }
    }
  };

  /**
   * A TACO anchor that navigates through the router instead of reloading.
   *
   * @param {string} path - Target path
   * @param {string|Object|Array} content - Link content (text or TACO)
   * @param {Object} [attrs] - Extra attributes, e.g. `{ class: 'nav_item' }`
   * @returns {Object} TACO for an `<a>` wired to the router
   * @category Routing
   * @see bw.navigate
   * @example
   * bw.link('/about', 'About', { class: 'bw_bccl_btn' })
   */
  bw.link = function(path, content, attrs) {
    var a = {};
    if (attrs) {
      var keys = Object.keys(attrs);
      for (var i = 0; i < keys.length; i++) a[keys[i]] = attrs[keys[i]];
    }
    if (_activeRouter && _activeRouter.mode === 'hash') {
      a.href = '#' + path;
    } else if (_activeRouter) {
      // history mode: a real URL, so the link still works without JS and
      // middle-click / open-in-new-tab land on the right page.
      // bw.router always sets base (default '/'), so no fallback is needed.
      var b = _activeRouter.base;
      a.href = (b === '/' ? '' : b) + path;
    } else {
      a.href = path;
    }
    a.onclick = function(e) {
      e.preventDefault();
      bw.navigate(path);
    };
    return { t: 'a', a: a, c: content };
  };

  // expose for testing: internal helpers
  bw._router = {
    matchRoute: matchRoute,
    normalizePath: normalizePath,
    parseQuery: parseQuery,
    getActiveRouter: function() { return _activeRouter; },
    resetActiveRouter: function() { _activeRouter = null; }
  };
}
