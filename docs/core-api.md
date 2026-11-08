# Core API Card

The part of bitwrench you need when you bring your own design: TACO to DOM or
HTML, CSS from JS, updates, and messaging. One line each. No built-in components
(BCCL) and no theme generator are needed for any of this -- if that is how you
work, the [lean build](../README.md#build-formats) has everything on this page.

The full reference is [bitwrench_api.md](bitwrench_api.md); the object format is
[taco-format.md](taco-format.md); SVG has its own guide, [svg.md](svg.md). If
you arrived with a problem rather than a function name, start with
[When you want X](when-you-want.md), which is this card indexed by task.

## What is in which build

Everything on this page is in both builds. The difference is the component
library:

| Build | Has | Does not have | Size (gzip) |
|-------|-----|---------------|-------------|
| `bitwrench.umd.min.js` (full) | TACO → DOM/HTML, CSS generation + theming, state, pub/sub, `derive`, router, the class and DOM helpers, `makeTable`/`makeTableFromArray`/`makeDataTable`/`makeBarChart`, **and all 47 BCCL components** (`makeButton`, `makeCard`, `makeModal`, `makeTooltip`, …) with their stylesheet | -- | ~47 KB |
| `bitwrench-lean.umd.min.js` | everything in the first column **except** the BCCL components: the engine, the reset and typography, role colours and utilities, the grid, tables and bar chart | the 47 BCCL factories (`makeButton`, `makeCard`, `makeTooltip`, ...) and the widget CSS they use | ~29 KB |
| `bitwrench-bccl.umd.min.js` | the 47 factories and their stylesheet; loaded after lean it registers both, so lean + BCCL is the full build in two files | the engine | ~19 KB |

So the router, pub/sub, `syncChildren`, `patch` and the class verbs are all in
lean -- you do not need the full build to get them. A widget rule ships with its
factory (2.1.14): lean's `loadStyles()` emits no `.bw_bccl_btn` or `.bw_bccl_card`
rules, and adding the BCCL script adds them. Load lean, then BCCL, then call
`bw.loadStyles()`. `bwserve` and the code editor are separate files; see
[Build Formats](../README.md#build-formats).

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
| `bw.replace(ref, taco)` | Swap one element for a new one (old one is unmounted) |
| `bw.remove(ref)` | Unmount and remove |
| `bw.html(taco)` | HTML string -- works in Node, for SSR and static files |
| `bw.create(taco)` | Detached DOM element, not yet in the page |

**One vocabulary.** Every `target`/`ref` above, and in every verb on this page,
is the same thing: a live element, an element id (`'status'`), a CSS selector
(`'#status'`, `'.card'`), or a `bw_uuid_*` token. A verb that acts and cannot
find its target warns `bw.<verb>: target not found` and returns null; the
queries (`bw.el`, `bw.$`, `bw.hasClass`, `bw.inspect`) and the class verbs
stay silent on a miss. Every `content` is the same thing too: text, a TACO, an
array of either, or `bw.raw()` -- in `bw.patch`, slot setters,
`bw.el(ref, content)` and `bw.$(sel, content)` alike.

## Update

Cheapest first -- see [Names carry cost](bitwrench-northstar-principles.md#10-names-carry-cost).

| Call | Does |
|------|------|
| `el.bw.method(...)` | Call a component's own method (`o.handle`, `o.slots`) |
| `bw.patch(ref, content)` | Replace one element's content: text, TACO, array or `bw.raw()`; an unchanged string is a no-op |
| `bw.syncChildren(parent, items, {key, create, update})` | Keyed list update; existing nodes move instead of being rebuilt ([example](state-management.md#keyed-lists-with-bwsyncchildren)) |
| `bw.toggleClass(ref, names, force?)` | Flip classes, or force them on/off. Touches no node, so focus and transitions survive |
| `bw.addClass(ref, names)` / `bw.removeClass(ref, names)` / `bw.hasClass(ref, name)` | The rest of the class verbs; `names` is a string, space-separated list, or array |
| `bw.clear(ref)` | Empty a container: unmount hooks fire, then children go. Use instead of `innerHTML = ''` |
| `bw.refresh(ref)` | Re-run a component's `o.render` |

## Find

| Call | Does |
|------|------|
| `bw.el(ref)` | One element by id, selector, `bw_uuid_*` class, or element |
| `bw.$(selector)` | All matches, always an array |
| `bw.el(ref, apply)` / `bw.$(sel, apply)` | Find **and** apply in one call: a string sets text, a TACO or array replaces content, a function runs per element |

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
| `bw.inspect(ref, depth)` | Component tree as an object: `{ tag, id, class, uuid, type, handles, state, children }`. `bwcli attach` prints it with `/tree` |
| `bw.warnUnknownProps` | `true` by default: a `make*()` factory warns once when handed an option it does not read. Set `false` to silence |
| `bwcli attach` | Drive a live page from a terminal: REPL, inspect, screenshot ([bw-attach.md](bw-attach.md)) |
| `verify(taco)` / `verify.assert(taco)` | Check a TACO's shape: an array of findings, or a throw. A separate module under 3 KB gzipped (`bitwrench/verify`), not in either build, never in production ([verify.md](verify.md)) |
