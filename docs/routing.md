# Client-Side Routing

Bitwrench includes a lightweight client-side router that maps URLs to views. It supports hash mode (`#/path`) and History API mode (`pushState`), integrates with pub/sub, and works with TACO rendering.

## Quick Start

```javascript
bw.router({
  target: '#app',
  routes: {
    '/':        function() { return { t: 'h1', c: 'Home' }; },
    '/about':   function() { return { t: 'h1', c: 'About' }; },
    '/users/:id': function(params) {
      return { t: 'div', c: 'User ' + params.id };
    },
    '*':        function() { return { t: 'h1', c: '404 Not Found' }; }
  }
});
```

That's it. The router reads the current URL, matches a route, calls the handler, and renders the result into `#app`. It listens for URL changes (back/forward, hash changes) and re-renders automatically.

---

## bw.router(config)

Creates and starts a router. Returns a router object with methods.

### Config options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `routes` | `Object` | (required) | Map of route patterns to handler functions |
| `target` | `string` | `null` | CSS selector where handler output is mounted via `bw.DOM()` |
| `mode` | `string` | `'hash'` | `'hash'` or `'history'` |
| `base` | `string` | `'/'` | Base path to strip in history mode |
| `before` | `function` | `null` | Guard called before each navigation |
| `after` | `function` | `null` | Hook called after each navigation |

### Route patterns

| Pattern | Example URL | Params |
|---------|-------------|--------|
| `/` | `/` | `{}` |
| `/users` | `/users` | `{}` |
| `/users/:id` | `/users/123` | `{ id: '123' }` |
| `/users/:id/posts/:pid` | `/users/42/posts/7` | `{ id: '42', pid: '7' }` |
| `/docs/*` | `/docs/api/colors` | `{ _rest: 'api/colors' }` |
| `/admin/:section/*` | `/admin/users/123/edit` | `{ section: 'users', _rest: '123/edit' }` |
| `*` | `/anything` | `{}` |

**Priority order** (highest to lowest):

1. Exact match -- `/users/new` before `/users/:id`
2. Parameterized -- segment count must be exact
3. Catch-all -- `/prefix/*` matches prefix + captures rest
4. Global wildcard -- `*` matches anything not matched above

Routes within the same priority level are checked in registration order. Register specific routes before general ones.

### Query strings

Query strings are parsed into `params._query`:

```javascript
// URL: /users/123?tab=posts&page=2
'/users/:id': function(params) {
  params.id;            // '123'
  params._query.tab;    // 'posts'
  params._query.page;   // '2'
}
```

The query string is stripped before route matching -- it does not affect which route matches.

### Route handlers

Handlers are plain functions. They receive a `params` object and return a TACO (or null).

```javascript
'/users/:id': function(params) {
  return bw.makeCard({
    title: 'User ' + params.id,
    content: 'Tab: ' + (params._query.tab || 'profile')
  });
}
```

If a handler returns `null` or `undefined`, the target element is not updated. This is useful for routes that only need side effects (analytics, logging).

If no `target` is configured, handlers still run and pub/sub events still fire -- useful for pub/sub-only routing.

### Return value

`bw.router()` returns an object with:

| Method | Description |
|--------|-------------|
| `r.navigate(path, opts)` | Navigate to a path (same as `bw.navigate()`) |
| `r.current()` | Returns `{ path, params, query }` for current route |
| `r.destroy()` | Remove listeners, stop routing |

---

## bw.navigate(path, opts)

Programmatic navigation. Delegates to the active router.

```javascript
bw.navigate('/users/123');
bw.navigate('/users/123', { replace: true });   // replace history entry
bw.navigate('/search?q=hello');                  // query strings preserved
```

The navigation flow:

1. Call `before` guard (if configured)
2. Update URL (hash or pushState)
3. Match route, call handler
4. Render result into target via `bw.DOM()`
5. Publish `bw:route` event
6. Call `after` hook

---

## bw.link(path, content, attrs)

Returns a TACO `<a>` element with navigation wired up. Useful for building nav menus.

```javascript
bw.link('/about', 'About Us', { class: 'nav-item' })
// Returns:
// { t: 'a', a: { href: '#/about', class: 'nav-item', onclick: ... }, c: 'About Us' }
```

The `onclick` handler calls `e.preventDefault()` and `bw.navigate(path)`. The `href` is set to `#` + path (hash mode) so right-click "copy link" works.

---

## Guards and Hooks

### before(toPath, fromPath)

Called before each navigation. Use it for authentication checks, redirects, or blocking.

```javascript
bw.router({
  target: '#app',
  routes: { ... },
  before: function(to, from) {
    // Redirect: return a path string
    if (to === '/admin' && !isLoggedIn) return '/login';

    // Block: return false
    if (to === '/locked') return false;

    // Allow: return anything else (undefined, null, true)
  }
});
```

| Return value | Effect |
|-------------|--------|
| `string` | Redirect to that path |
| `false` | Block navigation (URL and view unchanged) |
| anything else | Allow navigation |

### after(toPath, fromPath)

Called after each navigation completes. Use it for analytics, logging, scroll position.

```javascript
bw.router({
  target: '#app',
  routes: { ... },
  after: function(to, from) {
    console.log('Navigated from', from, 'to', to);
    window.scrollTo(0, 0);
  }
});
```

---

## Pub/Sub Integration

Every route change publishes a `bw:route` event:

```javascript
bw.sub('bw:route', function(data) {
  // data.path  -- current path (e.g., '/users/123')
  // data.params -- matched params (e.g., { id: '123', _query: {} })
  // data.query -- parsed query string
  // data.from  -- previous path
});
```

This lets any component react to route changes without coupling to the router:

```javascript
// Highlight active nav item on route change
bw.sub('bw:route', function(data) {
  navEl.bw.setActive(data.path);
}, navEl);
```

---

## Hash Mode vs History Mode

### Hash mode (default)

URLs look like `http://example.com/#/users/123`. Works everywhere (including IE11). No server configuration needed.

```javascript
bw.router({
  mode: 'hash',   // default, can be omitted
  target: '#app',
  routes: { ... }
});
```

### History mode

URLs look like `http://example.com/users/123`. Requires the server to serve your HTML file for all routes (SPA fallback).

```javascript
bw.router({
  mode: 'history',
  base: '/app',        // optional base path to strip
  target: '#app',
  routes: { ... }
});
```

With `base: '/app'`, a URL like `http://example.com/app/users/123` is matched as `/users/123`.

---

## Patterns

### SPA with navigation

```javascript
function homePage() {
  return { t: 'div', c: [
    { t: 'h1', c: 'Home' },
    bw.link('/about', 'Go to About')
  ]};
}

function aboutPage() {
  return { t: 'div', c: [
    { t: 'h1', c: 'About' },
    bw.link('/', 'Back to Home')
  ]};
}

bw.router({
  target: '#app',
  routes: {
    '/': homePage,
    '/about': aboutPage
  }
});
```

### Router with stateful components

Route handlers can return stateful TACOs:

```javascript
function dashboard() {
  return {
    t: 'div',
    o: {
      state: { data: null },
      mounted: function(el) {
        fetch('/api/stats').then(function(r) { return r.json(); })
          .then(function(d) { el._bw_state.data = d; bw.update(el); });
      },
      render: function(el) {
        var s = el._bw_state;
        bw.DOM(el, s.data
          ? bw.makeTable({ data: s.data, sortable: true })
          : { t: 'p', c: 'Loading...' }
        );
      }
    }
  };
}

bw.router({
  target: '#app',
  routes: {
    '/': function() { return { t: 'h1', c: 'Home' }; },
    '/dashboard': dashboard
  }
});
```

### Nav bar that highlights the active route

```javascript
function makeNav() {
  var links = [
    { path: '/', label: 'Home' },
    { path: '/about', label: 'About' },
    { path: '/contact', label: 'Contact' }
  ];
  return {
    t: 'nav',
    o: {
      state: { active: '/' },
      mounted: function(el) {
        bw.sub('bw:route', function(d) {
          el._bw_state.active = d.path;
          bw.update(el);
        }, el);
      },
      render: function(el) {
        var s = el._bw_state;
        bw.DOM(el, {
          t: 'ul', c: links.map(function(link) {
            return { t: 'li', a: {
              style: link.path === s.active ? 'font-weight:bold' : ''
            }, c: bw.link(link.path, link.label) };
          })
        });
      }
    }
  };
}

// Mount nav separately from routed content
bw.DOM('#nav', makeNav());
bw.router({ target: '#content', routes: { ... } });
```

### Auth guard

```javascript
var isLoggedIn = false;

bw.router({
  target: '#app',
  routes: {
    '/': homePage,
    '/login': loginPage,
    '/dashboard': dashboardPage,
    '*': notFoundPage
  },
  before: function(to) {
    if (to === '/dashboard' && !isLoggedIn) return '/login';
  }
});
```

### Complementing bwserve

The client router complements bwserve's server-side `app.page()`. Use the client router for in-page navigation and bwserve for server-driven content:

```javascript
// Server handles top-level pages
app.page('/dashboard', function(client) {
  client.render('#app', dashboardShell());
});

// Client handles sub-navigation within the dashboard
bw.router({
  target: '#dashboard-content',
  mode: 'hash',
  routes: {
    '/overview': overviewTab,
    '/analytics': analyticsTab,
    '/settings': settingsTab
  }
});
```

---

## Cleanup

Call `r.destroy()` to remove event listeners and stop the router:

```javascript
var r = bw.router({ ... });

// Later, when done:
r.destroy();
```

After `destroy()`, navigation calls are no-ops and no more `bw:route` events are published.

---

## API Summary

| Function | Description |
|----------|-------------|
| `bw.router(config)` | Create and start a router. Returns `{ navigate, current, destroy }` |
| `bw.navigate(path, opts)` | Programmatic navigation (delegates to active router) |
| `bw.link(path, content, attrs)` | Returns TACO `<a>` with navigation wired |
| `bw:route` (pub/sub topic) | Published on every route change with `{ path, params, query, from }` |
