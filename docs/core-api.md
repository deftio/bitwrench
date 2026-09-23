# Core API Card

The part of bitwrench you need when you bring your own design: TACO to DOM or
HTML, CSS from JS, updates, and messaging. One line each. No built-in components
(BCCL) and no theme generator are needed for any of this -- if that is how you
work, the [lean build](../README.md#build-formats) has everything on this page.

The full reference is [bitwrench_api.md](bitwrench_api.md); the object format is
[taco-format.md](taco-format.md).

## Build

| Call | Does |
|------|------|
| `{t, a, c, o}` | A TACO: tag, attributes (incl. `onclick` etc.), content, options |
| `bw.h(tag, attrs, content, opts)` | Same object from positional args: `bw.h('p', null, 'hi')` |
| `bw.raw(html)` | Mark a string as trusted HTML (content is escaped by default) |
| `{ t: 'svg', ... }` | SVG is ordinary TACO -- see [SVG](taco-format.md#svg) |

## Render

| Call | Does |
|------|------|
| `bw.mount(target, taco)` | Replace target's content; returns the new root element (`bw.DOM` is the same) |
| `bw.append(target, taco, {before})` | Add a child; returns it |
| `bw.replace(el, taco)` | Swap one element for a new one (old one is unmounted) |
| `bw.remove(ref)` | Unmount and remove |
| `bw.html(taco)` | HTML string -- works in Node, for SSR and static files |
| `bw.create(taco)` | Detached DOM element, not yet in the page |

## Update

Cheapest first -- see [Names carry cost](bitwrench-northstar-principles.md#10-names-carry-cost).

| Call | Does |
|------|------|
| `el.bw.method(...)` | Call a component's own method (`o.handle`, `o.slots`) |
| `bw.patch(ref, content)` | Replace one element's content: text, TACO, array or `bw.raw()` |
| `bw.syncChildren(parent, items, {key, create, update})` | Keyed list update; existing nodes move instead of being rebuilt ([example](state-management.md#keyed-lists-with-bwsyncchildren)) |
| `bw.refresh(ref)` | Re-run a component's `o.render` |

## Find

| Call | Does |
|------|------|
| `bw.el(ref)` | One element by id, selector, `bw_uuid_*` class, or element |
| `bw.$(selector)` | All matches, always an array |

## Style

| Call | Does |
|------|------|
| `bw.css(rules, {minify})` | CSS text from `{ selector: { prop: value } }`; camelCase becomes kebab-case |
| `bw.css([rulesA, rulesB])` | Array form: same selector twice, and you control the order |
| `bw.injectCSS(css, {id, append, minify})` | Put it in a `<style>`; same `id` + `append: false` replaces. Readable by default, `minify: true` for compact output |
| `bw.s(a, b, ...)` | Merge style objects for `a: { style: ... }` |

Custom properties are fine in your own CSS -- `bw.css({ ':root': { '--bg': '#111' } })`
passes them through. See [Bring your own design](theming.md#bring-your-own-design).

## Message

| Call | Does |
|------|------|
| `bw.pub(topic, data)` | Publish; returns how many subscribers ran |
| `bw.sub(topic, fn, el)` | Subscribe; returns an unsubscribe function. Pass `el` to drop it when `el` unmounts |
| `bw.derive([topics], fn, outTopic)` | Publish `fn(...latest)` on `outTopic` whenever an input publishes |
| `bw.emit(ref, name, data)` / `bw.on(ref, name, fn)` | Element-scoped events instead of global topics |

## Debug

| Call | Does |
|------|------|
| `bw.inspect(ref, depth)` | Component tree as text |
| `bwcli attach` | Drive a live page from a terminal: REPL, inspect, screenshot ([bw-attach.md](bw-attach.md)) |
