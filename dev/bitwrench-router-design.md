# Bitwrench Router Design

Status: DRAFT -- awaiting sign-off
Estimated size: ~100-120 lines in core, 0 new dependencies

## Problem

Bitwrench has all the pieces for single-page apps (TACO, bw.DOM, pub/sub,
state management) but no standard way to map URLs to views. Today this is
done manually with a state variable + render function (see
`pages/15-multi-page-site.html`, `examples/wizard/`). That works but:

- No deep linking (bookmark a specific view)
- No browser back/forward support
- No standard URL parameter parsing for view state
- Every project reinvents the pattern slightly differently
- bwserve has `app.page()` for server-side routes but client has nothing

A lightweight router would make bitwrench a complete app framework without
adding framework complexity.

## Design Principles

1. Router = pure function mapping URL to render call. No magic.
2. Explicit updates -- router calls your function, you call bw.DOM().
3. Works with both hash routing (#/path) and History API (pushState).
4. Integrates with pub/sub -- route changes publish events.
5. Works client-side and complements bwserve server-side.
6. No build step, no special syntax, no JSX route trees.
7. Must work in IE11 (hash mode) and modern browsers (history mode).

## API

### bw.router(config) -- create and start a router

```javascript
var r = bw.router({
  target: '#app',           // CSS selector -- where to mount views
  mode: 'hash',             // 'hash' (default) or 'history'
  base: '/',                // base path (history mode only)
  routes: {
    '/':              function()       { return homePage(); },
    '/users':         function()       { return userList(); },
    '/users/:id':     function(params) { return userDetail(params); },
    '/settings':      function()       { return settingsPage(); },
    '*':              function()       { return notFoundPage(); }
  },
  before: function(to, from) {        // optional -- guard/redirect
    if (to === '/settings' && !loggedIn) return '/';
    // return falsy to allow, return string to redirect
  },
  after: function(to, from) {         // optional -- analytics, logging
    console.log('navigated to ' + to);
  }
});
```

**Return value:** router object with methods (see below).

**What happens on creation:**
1. Registers routes
2. Listens for `hashchange` or `popstate`
3. Evaluates current URL and renders initial view
4. Publishes `bw:route` event via pub/sub

### Route handlers

Route handlers are plain functions. They receive a `params` object for
`:param` segments and return a TACO object (or array of TACOs, or null).

```javascript
'/users/:id': function(params) {
  // params = { id: '123' }
  // URL query string available via params._query
  // e.g. /users/123?tab=posts => params._query = { tab: 'posts' }
  return {
    t: 'div', c: [
      { t: 'h1', c: 'User ' + params.id },
      { t: 'p', c: 'Tab: ' + (params._query.tab || 'profile') }
    ]
  };
}
```

The router calls `bw.DOM(target, result)` with whatever the handler returns.
If handler returns null/undefined, target is not updated.

### bw.navigate(path, opts) -- programmatic navigation

```javascript
bw.navigate('/users/123');
bw.navigate('/users/123', { replace: true });  // replaces history entry
bw.navigate('/users/123?tab=posts');           // query string preserved
```

This is the only way to navigate programmatically. It:
1. Calls `before` guard (if configured)
2. Updates URL (hash or pushState)
3. Matches route, calls handler
4. Calls `bw.DOM(target, result)`
5. Publishes `bw:route` event
6. Calls `after` hook

### Router object methods

```javascript
r.navigate(path, opts)  // same as bw.navigate() -- bound to this router
r.current()             // returns { path: '/users/123', params: { id: '123' }, query: { tab: 'posts' } }
r.destroy()             // remove event listeners, stop routing
```

### Pub/sub integration

Every route change publishes:

```javascript
bw.pub('bw:route', {
  path: '/users/123',
  params: { id: '123' },
  query: { tab: 'posts' },
  from: '/'
});
```

Components can subscribe to react to route changes:

```javascript
bw.sub('bw:route', function(data) {
  navbar.bw.setActive(data.path);
}, navbarEl);
```

### Navigation links in TACO

No special component needed. Just use onclick + bw.navigate:

```javascript
{ t: 'a', a: { href: '#/users/123', onclick: function(e) {
  e.preventDefault();
  bw.navigate('/users/123');
} }, c: 'View User' }
```

Optional convenience helper for cleaner TACO:

```javascript
// bw.link(path, content, attrs) -- returns a TACO <a> with navigation wired
bw.link('/users/123', 'View User', { class: 'nav-item' })
```

This returns:
```javascript
{
  t: 'a',
  a: { href: '#/users/123', class: 'nav-item', onclick: function(e) {
    e.preventDefault();
    bw.navigate('/users/123');
  } },
  c: 'View User'
}
```

## Route Matching

Left-to-right segment matching. No regex, no optional segments.

### Match priority (highest to lowest)

1. **Exact match** -- `/users/new` matches only `/users/new`
2. **Parameterized match** -- `/users/:id` matches `/users/123` (segment count must be exact)
3. **Catch-all match** -- `/docs/*` matches `/docs/anything/nested/here`
4. **Global wildcard** -- `*` matches anything not matched above (always last)

Routes within the same priority level are checked in registration order.
First match wins. Register specific routes before general ones:
`/users/new` before `/users/:id`.

### Resolution table

```
Pattern                   URL                       Match?  Params
/                         /                         yes     {}
/users                    /users                    yes     {}
/users/new                /users/new                yes     {}
/users/:id                /users/123                yes     { id: '123' }
/users/:id                /users/123/extra          NO      (segment count mismatch)
/users/:id/posts/:pid     /users/123/posts/456      yes     { id: '123', pid: '456' }
/docs/*                   /docs                     yes     { _rest: '' }
/docs/*                   /docs/intro               yes     { _rest: 'intro' }
/docs/*                   /docs/api/colors          yes     { _rest: 'api/colors' }
/admin/:section/*         /admin/users/123/edit     yes     { section: 'users', _rest: '123/edit' }
*                         /anything/else            yes     {}
```

### Catch-all routes

A `*` at the end of a pattern (e.g., `/docs/*`) matches the prefix and
captures remaining segments in `params._rest`. This supports "everything
under this path" patterns:

```javascript
'/docs/*': function(params) {
  // /docs/api/colors => params._rest = 'api/colors'
  var subPath = params._rest.split('/');
  return renderDocPage(subPath);
}

'/admin/:section/*': function(params) {
  // /admin/users/123/edit => params.section = 'users', params._rest = '123/edit'
  return adminPanel(params.section, params._rest);
}
```

### Normalization rules

- Trailing slashes stripped: `/users/` and `/users` are the same
- Empty hash `#` or `#/` both resolve to `/`
- Double slashes collapsed: `/users//123` becomes `/users/123`

### Query strings

Query strings are parsed into `params._query`:
- `/users/123?tab=posts&page=2` => `params._query = { tab: 'posts', page: '2' }`
- Query string is stripped before route matching (does not affect pattern match)

### Hash mode URLs

```
Page URL: http://example.com/app.html#/users/123?tab=posts

Router sees:
  path:   /users/123
  params: { id: '123', _query: { tab: 'posts' } }
```

Only the portion after `#` is used for matching. The actual page URL is ignored.

### History mode URLs

```
Page URL: http://example.com/users/123?tab=posts
Base: '/'

Router sees:
  path:   /users/123
  params: { id: '123', _query: { tab: 'posts' } }

With base: '/app'
Page URL: http://example.com/app/users/123
Router sees:
  path:   /users/123   (base stripped)
```

## Server-Side (bwserve) Integration

bwserve already has `app.page(path, handler)` for server-side routing.
The client router complements this -- it does NOT replace it.

### Pattern 1: Pure client-side SPA

Server serves one HTML page. Client router handles all navigation.

```javascript
// server
app.page('/', function(client) {
  // serve shell, client JS handles routing
});

// client
bw.router({
  target: '#app',
  routes: { '/': homePage, '/about': aboutPage, '/contact': contactPage }
});
```

### Pattern 2: Server-driven with client navigation

Server renders initial page. Client router handles subsequent navigation
by calling bwserve for content.

```javascript
bw.router({
  target: '#app',
  routes: {
    '/dashboard': function() {
      // ask server to push new content
      bw.pub('bw:navigate', { path: '/dashboard' });
      return { t: 'div', c: 'Loading...' };
    }
  }
});

// server listens for navigation events
client.on('bw:navigate', function(data) {
  client.render('#app', dashboardContent());
});
```

### Pattern 3: Hybrid (server routes + client sub-routes)

Server handles top-level routes. Client handles tabs/sub-navigation within
a page.

```javascript
// server
app.page('/dashboard', function(client) {
  client.render('#app', dashboardShell());
});

// client (within dashboard page)
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

## Implementation Notes

### Hash mode (default)

- Listens for `window.onhashchange`
- URLs look like: `http://example.com/#/users/123`
- Works in all browsers including IE11
- No server configuration needed
- Default because it "just works" everywhere

### History mode

- Uses `history.pushState()` and `window.onpopstate`
- URLs look like: `http://example.com/users/123`
- Requires server to serve index.html for all routes (SPA fallback)
- `bwcli serve` should support this with a `--spa` flag

### Where it lives in source

- Add to `src/bitwrench.js` in the DOM/navigation section
- Not a separate file -- it's small enough (~100-120 lines) for core
- Under the 45KB gzip budget (adds ~1-2KB gzipped)

### What NOT to build

- No lazy loading / code splitting (that's a bundler concern)
- No nested routers (keep it flat -- use pub/sub for sub-navigation)
- No route-based data fetching (that's application logic)
- No transitions/animations (use CSS or o.mounted for that)
- No middleware chain (before/after hooks are sufficient)

## Testing Plan

- Route matching: static, parameterized, wildcard, query strings (~15 tests)
- Hash mode: navigation, back/forward, initial load (~8 tests)
- History mode: pushState, popstate, base path (~8 tests)
- Guards: before hook redirect, before hook block (~4 tests)
- Pub/sub: bw:route published on navigation (~3 tests)
- bw.link(): returns correct TACO with onclick (~3 tests)
- Edge cases: trailing slashes, empty hash, destroy() cleanup (~5 tests)
- ~46 tests total

## Open Questions

1. Should `bw.router()` be the only way, or should there also be a simpler
   `bw.route(routes)` shorthand that auto-detects target and mode?

2. Should `bw.link()` be in core or just documented as a pattern?
   Pro: cleaner TACO. Con: one more API surface.

3. Should the router integrate with `bw.makeNavbar()` / `bw.makeBreadcrumb()`
   to auto-highlight active routes? Or leave that to pub/sub subscription?

4. Multiple routers on one page -- needed? The hybrid pattern (Pattern 3)
   suggests yes for sub-navigation. But adds complexity.

5. Naming: `bw.router()` vs `bw.createRouter()` vs `bw.route()`?
   `bw.router()` matches the factory pattern used elsewhere.
