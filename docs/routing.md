# Client-Side Routing

## What Is Client-Side Routing?

In a traditional website, every page is a separate HTML file on the server. When you click a link, the browser sends a request, the server sends back a new page, and the entire screen refreshes. Every navigation is a full page load.

Client-side routing eliminates that round trip. A single HTML page loads once. When the user navigates, JavaScript intercepts the URL change, figures out which "view" to show, and swaps content in the DOM -- no server request, no page reload. The URL in the address bar still changes (so bookmarks and back/forward work), but the page never fully reloads.

This is what makes a Single-Page Application (SPA).

### How URLs Work in an SPA

The browser has two mechanisms that SPAs exploit:

**Hash fragment** -- The part of the URL after `#`. Changing the hash does not trigger a page reload. The browser fires a `hashchange` event that JavaScript can listen to. Example: `http://example.com/#/users/123`

**History API** -- `history.pushState()` changes the URL in the address bar without a page reload. The browser fires a `popstate` event when the user hits back/forward. Example: `http://example.com/users/123` (looks like a normal URL, but the page never reloaded)

Bitwrench supports both. Hash mode is the default because it works everywhere with zero server configuration.

### What Happens When You Navigate

Here is the full sequence when a user clicks a link or calls `bw.navigate()`:

```
User clicks link
      |
      v
1. URL changes (hash or pushState)
      |
      v
2. Router reads the new URL
      |
      v
3. before() guard runs (can redirect or block)
      |
      v
4. URL is split into segments and matched against route patterns
      |
      v
5. Matched handler is called with extracted params
      |
      v
6. Handler returns a TACO object (the "page")
      |
      v
7. bw.DOM(target, taco) replaces the content area
      |
      v
8. bw.pub('bw:route', data) notifies subscribers
      |
      v
9. after() hook runs (analytics, scroll reset, etc.)
```

The key insight: "switching pages" is just calling `bw.DOM()` with different TACO content. There is no page object, no component lifecycle to manage. A "page" is a function that returns TACO.

---

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

The router reads the current URL, matches a route, calls the handler, and renders the result into `#app`. It listens for URL changes (back/forward, hash changes) and re-renders automatically.

---

## How Route Matching Works

When the URL changes, the router must decide which handler to call. This happens in three steps:

### Step 1: Normalize the URL

The raw URL is cleaned up before matching:
- Query string is stripped and parsed separately (available as `params._query`)
- Double slashes are collapsed (`//users///` becomes `/users`)
- Trailing slashes are removed (`/users/` becomes `/users`)
- Empty paths become `/`

### Step 2: Split into segments

The normalized path is split on `/` into segments:

```
/users/123/posts  =>  ['', 'users', '123', 'posts']
/                 =>  ['']
```

### Step 3: Match against route patterns

Routes are checked in this priority order:

**1. Exact match** -- Every segment matches literally.
```
Pattern: /users/new     URL: /users/new     => MATCH
Pattern: /users/new     URL: /users/123     => no match
```

**2. Parameterized match** -- Segments starting with `:` capture any value. Segment count must match exactly.
```
Pattern: /users/:id          URL: /users/123          => MATCH, params.id = '123'
Pattern: /users/:id/posts    URL: /users/123          => no match (segment count differs)
Pattern: /users/:id/posts/:pid  URL: /users/42/posts/7  => MATCH, params = {id:'42', pid:'7'}
```

**3. Catch-all** -- Patterns ending with `/*` match any number of trailing segments. The captured portion goes into `params._rest`.
```
Pattern: /docs/*             URL: /docs/api/colors    => MATCH, params._rest = 'api/colors'
Pattern: /admin/:section/*   URL: /admin/users/123/edit => MATCH, params = {section:'users', _rest:'123/edit'}
```

**4. Global wildcard** -- The pattern `*` (by itself) matches anything not matched above. This is your 404 handler.
```
Pattern: *                   URL: /anything           => MATCH
```

Within the same priority level, routes are checked in the order you registered them. **Register specific routes before general ones:**

```javascript
routes: {
  '/users/new':  newUserPage,     // checked first (exact)
  '/users/:id':  userDetailPage,  // checked second (parameterized)
  '*':           notFoundPage     // checked last (wildcard)
}
```

### Query Strings

Query strings are parsed but do not affect which route matches:

```javascript
// URL: /users/123?tab=posts&page=2
'/users/:id': function(params) {
  params.id;            // '123'
  params._query.tab;    // 'posts'
  params._query.page;   // '2'
}
```

### Full Pattern Reference

| Pattern | Example URL | Params |
|---------|-------------|--------|
| `/` | `/` | `{}` |
| `/users` | `/users` | `{}` |
| `/users/:id` | `/users/123` | `{ id: '123' }` |
| `/users/:id/posts/:pid` | `/users/42/posts/7` | `{ id: '42', pid: '7' }` |
| `/docs/*` | `/docs/api/colors` | `{ _rest: 'api/colors' }` |
| `/admin/:section/*` | `/admin/users/123/edit` | `{ section: 'users', _rest: '123/edit' }` |
| `*` | `/anything` | `{}` |

---

## Hash Mode vs History Mode

### Hash mode (default)

URLs look like `http://example.com/#/users/123`.

```javascript
bw.router({
  mode: 'hash',   // default, can be omitted
  target: '#app',
  routes: { ... }
});
```

**How it works:** The router sets `window.location.hash` and listens for `hashchange` events. The hash is never sent to the server, so no server configuration is needed.

**Pros:** Works everywhere (including old browsers). No server config. Files can be opened from disk (`file://`).

**Cons:** URLs have a `#` in them. Some people find this ugly.

### History mode

URLs look like `http://example.com/users/123` -- clean, no `#`.

```javascript
bw.router({
  mode: 'history',
  base: '/app',        // optional: strip this prefix before matching
  target: '#app',
  routes: { ... }
});
```

**How it works:** The router calls `history.pushState()` to change the URL and listens for `popstate` events (back/forward buttons).

**Pros:** Clean URLs. Looks like a traditional website.

**Cons:** Requires server configuration. The server must return your `index.html` for all routes, because if a user bookmarks `/users/123` and visits it directly, the server needs to serve the SPA shell (not a 404). This is called "SPA fallback" or "history fallback."

With `base: '/app'`, a URL like `http://example.com/app/users/123` is matched as `/users/123`.

---

## Route Handlers

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

If no `target` is configured, handlers still run and pub/sub events still fire -- useful for pub/sub-only routing where you manage rendering yourself.

### Stateful route handlers

Route handlers can return stateful TACOs with `o.state` and `o.render`:

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
```

When the router mounts this TACO, `mounted` fires, fetches data, updates state, and triggers a re-render. The route handler is just a function that returns any valid TACO -- the full component model (Level 0 through Level 2) is available.

---

## Navigation

### bw.navigate(path, opts)

Programmatic navigation. Delegates to the active router.

```javascript
bw.navigate('/users/123');
bw.navigate('/users/123', { replace: true });   // replace history entry (no back)
bw.navigate('/search?q=hello');                  // query strings preserved
```

### bw.link(path, content, attrs)

Returns a TACO `<a>` element with navigation wired up:

```javascript
bw.link('/about', 'About Us', { class: 'nav-item' })
// Returns:
// { t: 'a', a: { href: '#/about', class: 'nav-item', onclick: ... }, c: 'About Us' }
```

The `onclick` handler calls `e.preventDefault()` and `bw.navigate(path)`. The `href` is set to `#` + path (hash mode) so right-click "copy link" and middle-click "open in new tab" still work.

Use `bw.link()` instead of raw `<a>` tags for navigation within the SPA. External links (to other sites) should use normal TACO anchors: `{ t: 'a', a: { href: 'https://...' }, c: 'External' }`.

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

Called after each navigation completes. Use it for analytics, logging, scroll reset.

```javascript
after: function(to, from) {
  window.scrollTo(0, 0);
}
```

---

## Pub/Sub Integration

Every route change publishes a `bw:route` event:

```javascript
bw.sub('bw:route', function(data) {
  // data.path   -- current path (e.g., '/users/123')
  // data.params -- matched params (e.g., { id: '123', _query: {} })
  // data.query  -- parsed query string object
  // data.from   -- previous path
});
```

This lets any component react to route changes without being coupled to the router. Common uses:

**Highlight active nav item:**
```javascript
bw.sub('bw:route', function(data) {
  navEl.bw.setActive(data.path);
}, navEl);   // auto-unsubscribes when navEl is removed
```

**Update page title:**
```javascript
var titles = { '/': 'Home', '/about': 'About', '/contact': 'Contact' };
bw.sub('bw:route', function(data) {
  document.title = titles[data.path] || 'My App';
});
```

**Log analytics:**
```javascript
bw.sub('bw:route', function(data) {
  analytics.pageView(data.path);
});
```

---

## Patterns

### SPA with persistent nav and footer

The router only controls the content area. Nav and footer are mounted separately and persist across route changes:

```html
<div id="nav-root"></div>
<div id="app"></div>
<div id="footer-root"></div>
```

```javascript
// Mount persistent UI
bw.DOM('#nav-root', makeNavBar());
bw.DOM('#footer-root', makeFooter());

// Router only swaps #app content
bw.router({
  target: '#app',
  routes: {
    '/':        homePage,
    '/about':   aboutPage,
    '/contact': contactPage,
    '*':        notFoundPage
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
```

### Auth guard with login redirect

```javascript
var isLoggedIn = false;

bw.router({
  target: '#app',
  routes: {
    '/':          homePage,
    '/login':     loginPage,
    '/dashboard': dashboardPage,
    '*':          notFoundPage
  },
  before: function(to) {
    if (to === '/dashboard' && !isLoggedIn) return '/login';
  }
});
```

### Router with shared state store

Combine the router with a store pattern for multi-view apps. The store holds data; views subscribe to the slices they need:

```javascript
var store = { users: [], stats: {} };

function updateStore(key, value) {
  store[key] = value;
  bw.pub('store:' + key, value);
}

function usersPage() {
  return {
    t: 'div',
    o: {
      state: {},
      mounted: function(el) {
        bw.sub('store:users', function() { bw.update(el); }, el);
      },
      render: function(el) {
        bw.DOM(el, bw.makeTable({
          data: store.users,
          columns: ['name', 'role', 'status'],
          sortable: true
        }));
      }
    }
  };
}

bw.router({
  target: '#app',
  routes: {
    '/':      overviewPage,
    '/users': usersPage,
    '*':      notFoundPage
  }
});
```

See [State Management: Shared State Across Views](state-management.md#shared-state-across-views) for details on the store pattern.

### Complementing bwserve

The client router complements bwserve's server-side `app.page()`. Use bwserve for top-level page delivery and the client router for sub-navigation within a page:

```javascript
// Server handles top-level pages
app.page('/dashboard', function(client) {
  client.render('#app', dashboardShell());
});

// Client handles tab navigation within the dashboard
bw.router({
  target: '#dashboard-content',
  mode: 'hash',
  routes: {
    '/overview':  overviewTab,
    '/analytics': analyticsTab,
    '/settings':  settingsTab
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

After `destroy()`, `bw.navigate()` calls are no-ops and no more `bw:route` events are published.

---

## API Summary

| Function | Description |
|----------|-------------|
| `bw.router(config)` | Create and start a router. Returns `{ navigate, current, destroy }` |
| `bw.navigate(path, opts)` | Programmatic navigation (delegates to active router) |
| `bw.link(path, content, attrs)` | Returns TACO `<a>` with navigation wired |
| `bw:route` (pub/sub topic) | Published on every route change with `{ path, params, query, from }` |

### bw.router(config) options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `routes` | `Object` | (required) | Map of route patterns to handler functions |
| `target` | `string` | `null` | CSS selector where handler output is mounted via `bw.DOM()` |
| `mode` | `string` | `'hash'` | `'hash'` or `'history'` |
| `base` | `string` | `'/'` | Base path to strip in history mode |
| `before` | `function` | `null` | Guard called before each navigation |
| `after` | `function` | `null` | Hook called after each navigation |

### Router object methods

| Method | Description |
|--------|-------------|
| `r.navigate(path, opts)` | Navigate to a path (same as `bw.navigate()`) |
| `r.current()` | Returns `{ path, params, query }` for current route |
| `r.destroy()` | Remove listeners, stop routing |

---

## Related

- [App Patterns](app-patterns.md) -- Multi-Page SPA pattern with router + shared state
- [State Management](state-management.md) -- Three-level component model, store pattern
- [Component Cheat Sheet](component-cheatsheet.md) -- All 50+ components at a glance
- [examples/dashboard-spa/](../examples/dashboard-spa/) -- Working SPA with 4 routed views
