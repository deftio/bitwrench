# Response to Worklog Developer Feedback

Thanks for this -- it's the most detailed and honest feedback we've gotten, and
it's already driving changes. A few corrections, a few "you're right," and a
concrete offer at the end.

## Things that exist now (v2.0.19)

**o.handle and o.slots solve the re-render problem.** This is the big one. You
wrote: "focus state is lost on inputs after re-render" -- and you're right that
`bw.DOM()` replaces the subtree. But bitwrench's answer isn't diffing. It's
*don't re-render what doesn't change.* Since v2.0.19:

```javascript
var workEntry = {
  t: 'div', a: { class: 'entry' },
  c: [
    { t: 'input', a: { type: 'text', placeholder: 'Task name',
        oninput: function(e) { state.task = e.target.value; } } },
    { t: 'input', a: { type: 'number', placeholder: 'Hours',
        oninput: function(e) { state.hours = e.target.value; } } },
    { t: 'div', a: { class: 'status' }, c: '' }  // will update via slot
  ],
  o: {
    slots: { status: '.status' },   // auto-generates el.bw.setStatus() / getStatus()
    handle: {
      validate: function() {
        var msg = state.hours > 0 ? 'Saved' : 'Enter hours';
        this.setStatus(msg);        // updates ONLY the .status div
        // inputs are untouched -- focus, cursor, values all preserved
      }
    }
  }
};

var el = bw.mount('#entry-container', workEntry);
// later: el.bw.validate()  -- surgical update, no re-render
```

The inputs never get replaced. The status slot updates independently. This is
the pattern for form-heavy apps. We realize this is poorly documented -- it
should be one of the first things you learn, not something you have to dig for.
That's being fixed now.

**Event handlers in TACO are stable.** Inline handlers in `a: { onclick: fn }`
are closures attached during `createDOM()`. They survive as long as the element
lives. The LLM guide warning about `addEventListener` in `o.mounted` is about
raw DOM event binding (which IS fragile on re-render) -- the fix is to use
TACO's `a:` handlers, which work correctly. If you're using TACO handlers,
you're fine.

## Things you're right about

**bw.patch() is limited by design.** It updates text and attributes, not
structure. For structural changes, you scope your re-renders to the smallest
container that changes. The developer chooses render boundaries explicitly --
no hidden diffing cost, but real cognitive work. The todo/wizard examples
show the pattern, but we need a form-heavy example that makes it obvious.

**No built-in store pattern.** pub/sub is the mechanism, but there's no
documented convention for "6 views sharing one state object." This is tracked
and will ship as `docs/patterns-state.md` -- a canonical pattern, not a new
API. Something like:

```javascript
var store = { entries: [], filter: 'all' };
function updateStore(changes) {
  Object.assign(store, changes);
  bw.pub('store:changed', store);
}
// any component: bw.sub('store:changed', function(s) { el.bw.refresh(s); });
```

**TypeScript declarations would help.** Agreed. `package.json` already declares
the `"types"` entry pointing to `dist/bitwrench.d.ts` -- the file just hasn't
been written yet. It's on the roadmap. Good for humans, great for LLMs.

**Interactive component gallery.** Fair gap. The auto-generated API reference
lists functions but doesn't show them rendered. A Storybook-style playground
using `bw.makeTryIt()` is planned.

**Data-entry components.** Editable table, date picker, time range -- these are
real gaps for your use case. They're on the roadmap as BCCL additions.

## What's coming in the next release (v2.0.21)

**Router.** `bw.router()` is implemented and tested -- hash + history mode,
`:param` and wildcard matching, before/after guards, pub/sub integration via
`bw:route` events. Plus `bw.navigate()` and `bw.link()`.

```javascript
bw.router({
  target: '#app',
  routes: {
    '/':           function() { return homeView(); },
    '/log/:date':  function(p) { return dayView(p.date); },
    '/settings':   function() { return settingsView(); },
    '*':           function() { return notFoundView(); }
  }
});
```

This one's on us -- you asked for it and it wasn't there yet. It will be in
the next npm release.

## What we're changing because of your feedback

1. **o.handle/o.slots docs moved to front-and-center** -- being added to the
   LLM guide, state management docs, and tutorials as a primary concept, not
   an advanced topic.

2. **Worklog example planned** -- `examples/worklog/` will be a form-heavy app
   (editable entries, date pickers, shared state) that directly demonstrates
   the handle pattern. Your use case is the spec.

3. **Store pattern doc** -- `docs/patterns-state.md` shipping soon.

4. **TypeScript .d.ts** -- on the roadmap.

## Should you proceed with the worklog app?

Yes -- please do. You clearly understand the library well enough to build it
idiomatically. The key insight you're missing is handles, and now you have that.
Here's the recommended approach:

- **Inputs/textareas**: Never re-render. Use `o.handle` methods to read values
  and `o.slots` to update adjacent status/validation text.
- **Entry list**: Re-render the list container when entries change, but each
  entry row uses handles for its own editable fields.
- **Shared state**: Plain object + `bw.pub('worklog:changed', state)`. Each
  view subscribes and updates its own region.
- **Multiple views**: For now, use `hashchange` + a switch on
  `location.hash` to swap views (the pattern from the current docs).
  `bw.router()` ships in the next release and will simplify this to a
  single config object.
- **Theme**: `bw.loadStyles({ primary: '#yourColor' })` -- one line.

Document the render-boundary decisions as you go. That dogfooding feedback is
exactly what we need to improve the docs for the next developer.
