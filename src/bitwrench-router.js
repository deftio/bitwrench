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

    function handleRoute(toRaw, opts) {
      if (destroyed) return;
      var fromPath = currentPath;
      var toPath = normalizePath(toRaw);

      // before guard
      if (config.before) {
        var result = config.before(toPath, fromPath);
        if (result === false) return;
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

    function navigate(path, opts) {
      if (destroyed) return;
      opts = opts || {};
      if (mode === 'hash') {
        if (opts.replace) {
          var loc = window.location;
          loc.replace(loc.pathname + loc.search + '#' + path);
        } else {
          window.location.hash = path;
        }
        // hashchange listener will fire handleRoute; but if same hash, trigger manually
        var currentHash = window.location.hash.replace(/^#/, '') || '/';
        if (normalizePath(currentHash) === normalizePath(path)) {
          handleRoute(path, opts);
        }
      } else {
        var url = (base === '/' ? '' : base) + path;
        if (opts.replace) {
          window.history.replaceState(null, '', url);
        } else {
          window.history.pushState(null, '', url);
        }
        handleRoute(path, opts);
      }
    }

    function onHashChange() {
      if (destroyed) return;
      handleRoute(getPath());
    }

    function onPopState() {
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

  bw.navigate = function(path, opts) {
    if (_activeRouter) {
      _activeRouter.navigate(path, opts);
    } else {
      if (typeof console !== 'undefined' && console.warn) {
        console.warn('bw.navigate: no active router');
      }
    }
  };

  bw.link = function(path, content, attrs) {
    var a = {};
    if (attrs) {
      var keys = Object.keys(attrs);
      for (var i = 0; i < keys.length; i++) a[keys[i]] = attrs[keys[i]];
    }
    if (_activeRouter) {
      // determine href based on mode -- check hash by looking at current location
      var isHash = window.location.hash !== undefined; // always true, but we default hash
      a.href = '#' + path;
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
