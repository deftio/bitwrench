# What bitwrench can learn from AG-UI and A2UI

Honest notes from building bitwrench-ag-ui. The goal is "just enough
to be modern" -- bitwrench's core philosophy (plain JS, zero deps,
runs everywhere) doesn't change. These are small, additive tweaks
that make it play better in the current agent/AI landscape without
bloating it into something it isn't.


## Small wins (low effort, high value)

### 1. `bw.once(topic, handler)` -- one-shot subscriptions

AG-UI's event model constantly needs "wait for the next X then stop
listening." Today users write:

```javascript
var unsub = bw.sub('my:event', function(e) {
  unsub();
  doSomething(e);
});
```

A built-in `bw.once()` saves three lines and prevents the common bug
of forgetting to unsub. This is a trivial addition to the pub/sub
internals -- maybe 5 lines of code.


### 2. Wildcard / namespace subscriptions

AG-UI publishes events like `agui:TEXT_MESSAGE_CONTENT`,
`agui:TOOL_CALL_START`, etc. Right now subscribing to "all agui
events" requires a separate `agui:event` topic. A wildcard pattern
would be more natural:

```javascript
bw.sub('agui:*', handler);      // any agui event
bw.sub('myapp:form:*', handler); // any form event in myapp
```

This doesn't need to be fancy -- just a trailing `*` glob. The
hierarchical `:` separator is already idiomatic in bitwrench topics.


### 3. ~~Ship the `.d.ts` file~~ (DONE -- bitwrench now has TS support)


### 4. `aria-live` on dynamic content regions

BCCL components already have good baseline ARIA (breadcrumb labels,
tab selection, progress values). But bwserve's `replace` and `patch`
operations mutate DOM without announcing changes to screen readers.

Adding `aria-live="polite"` to containers that receive server-driven
updates (or letting users opt in via an attribute) would make bwserve
accessible by default. AG-UI streaming has the same problem -- we
had to add `aria-live` manually to the message container.


## Medium effort improvements

### 5. JSON Patch as a utility

Building bitwrench-ag-ui required writing a JSON Patch (RFC 6902)
implementation from scratch: `add`, `replace`, `remove` with path
parsing and escape handling. This is useful far beyond AG-UI:

- bwserve could use it for state deltas instead of full snapshots
- Component state updates could be expressed as patches
- Any app syncing data with a server benefits

A `bw.jsonPatch(obj, patches)` utility would be small (~40 lines),
zero-dependency, and broadly useful. It complements `bw.patch()` (DOM
patching) with data patching.


### 6. Snapshot + delta pattern for bwserve state

AG-UI's state sync model is elegant: send a full `STATE_SNAPSHOT`
to establish baseline, then `STATE_DELTA` (JSON Patch) for
incremental updates. This is much more efficient than re-sending
full state on every change.

bwserve currently has `replace` (full DOM swap) but no lightweight
state delta message. Adding a `state_snapshot` + `state_delta`
message pair to the bwserve protocol would:

- Reduce bandwidth for IoT/embedded (ESP32 with limited throughput)
- Enable smarter UI updates (only re-render what changed)
- Align with how modern real-time systems work

The implementation is straightforward: store state on the client,
apply JSON Patch deltas, call `bw.update(el)` on affected components.


### 7. Component catalog as a first-class concept

A2UI's key insight: agents (or servers) should only be able to
request components from a pre-approved catalog. bitwrench already
has this via `bw.make(type, props)` with 48 BCCL types, but it's
not exposed as a discoverable catalog.

Adding `bw.catalog()` that returns the list of available component
types and their accepted props would:

- Let bwserve clients advertise what they can render
- Enable schema validation of server-sent component specs
- Make `bw.make()` self-documenting
- Align with A2UI's security model (whitelist, not blacklist)

The data is already there in BCCL internals -- it just needs a
public accessor.


### 8. Form data extraction utility

A2UI and AG-UI both deal heavily with "agent generates a form,
user fills it in, data goes back to agent." bitwrench has
`bw.makeForm()`, `bw.makeFormGroup()`, `bw.makeInput()` etc.,
but no built-in way to extract form data as a plain object.

A `bw.formData(el)` that returns `{ fieldName: value, ... }` from
a form element would save repeated boilerplate. In bitwrench-ag-ui
we wrote manual `querySelectorAll('input, select, textarea')` loops.


## Bigger ideas (worth considering)

### 9. Flat component references (A2UI pattern)

A2UI uses a flat adjacency list instead of nested JSON:

```javascript
// A2UI style (flat)
[
  { id: 'root', type: 'Column', children: ['card1', 'card2'] },
  { id: 'card1', type: 'Card', props: { title: 'First' } },
  { id: 'card2', type: 'Card', props: { title: 'Second' } }
]

// bitwrench style (nested)
{ t: 'div', c: [
  bw.makeCard({ title: 'First' }),
  bw.makeCard({ title: 'Second' })
]}
```

The flat model is better for:
- LLM generation (less bracket-matching errors)
- Streaming (each component is a complete line)
- Incremental updates (update one component by ID)
- Large UIs (no deep nesting performance issues)

bitwrench doesn't need to replace TACO nesting, but supporting
flat-with-references as an alternative input to `bw.DOM()` would
make it much more LLM-friendly and agent-compatible.


### 10. Reconnection built into bwserve

AG-UI leaves reconnection to the client. This is a gap in both
AG-UI and bwserve. For bwserve specifically:

- SSE connections drop (mobile networks, sleep/wake, proxies)
- The client has no way to resume from where it left off
- Current behavior: user sees a frozen UI

A simple reconnection strategy:
1. Client detects disconnect
2. Re-opens SSE connection with `Last-Event-Id` header
3. Server replays events since that ID (or sends a snapshot)

EventSource supports `Last-Event-Id` natively. bwserve just needs
to tag events with sequential IDs and support replay. This would
make bwserve production-ready for unreliable networks.


### 11. Intent-based interactions (from MCP-UI)

MCP-UI's model: UI components don't directly mutate state. They
"bubble up intents" that the controlling agent interprets:

```javascript
// Instead of: button click -> direct state mutation
// Do: button click -> publish intent -> agent decides what to do

bw.pub('intent:checkout', { itemId: 42 });
```

bitwrench's pub/sub already supports this pattern, but it's not
idiomatic. Making it a documented pattern (with examples) would
help bwserve users build agent-compatible UIs.


## Things bitwrench already does well

Worth noting what bitwrench gets right that these protocols
struggle with:

- **Zero dependencies**: AG-UI's reference client pulls in RxJS.
  A2UI's reference needs React. bitwrench has none. This is a
  genuine differentiator and should stay that way.

- **TACO serialization**: The `{t, a, c, o}` format is already
  JSON-serializable, which is exactly what agent protocols need.
  A2UI invented their own format; bitwrench already had one.

- **Server-driven UI**: bwserve predates AG-UI and solves the
  same problem (server pushes UI updates over SSE). The 9-message
  protocol is simpler than AG-UI's 27 event types.

- **Component library**: 48 BCCL components with theming is more
  than most agent UI frameworks ship. A2UI's basic catalog has
  ~15 types.

- **Dual rendering**: `bw.html()` for SSR + `bw.DOM()` for live
  UI is unusual and valuable. Most frameworks pick one.

- **Theme generation**: Deriving a full palette from 2-3 seed
  colors is genuinely clever. AG-UI and A2UI have no theming
  story at all.


## Priority ranking

Top 5 changes that would make bitwrench more appealing in the
current agent/AI landscape (TS support already done):

1. **`bw.catalog()`** -- makes bw.make() discoverable, single source
   of truth for bwmcp + AG-UI + A2UI mapping
2. **`bw.once()`** -- trivial to add, universally useful
3. **`bw.jsonPatch()`** -- broadly useful, enables state deltas in
   bwserve, tiny implementation
4. **`bw.formData()`** -- needed by both bwmcp and AG-UI, saves
   boilerplate in every form-handling scenario
5. **Wildcard subscriptions** -- natural extension of existing pub/sub

None of these change bitwrench's philosophy. They're all additive,
small, and in the spirit of the library.


## How bwmcp and AG-UI compose

bitwrench already has an MCP server (bwmcp) with 21 tools. It sits
at a different layer than AG-UI, and they compose naturally:

```
MCP (bwmcp)          -- agent discovers components, generates TACO
AG-UI (this project) -- agent streams TACO to browser in real time
bitwrench            -- renders TACO to live DOM
```

### The current bwmcp workflow

1. Agent calls `bitwrench_start_here` (MCP) -- learns TACO format
2. Agent calls `make_card`, `make_table` etc. (MCP) -- gets TACO back
3. Agent calls `build_page` (MCP) -- static HTML output
   OR `render_live` (MCP) -- pushes to browser via bwserve SSE

### What AG-UI adds

A third delivery path: the agent sends the TACO through AG-UI's
`generateUserInterface` tool call, and the browser client renders
it live with streaming, reasoning display, state sync, etc.

```
Agent calls make_card (MCP)
  -> gets TACO: { t: 'div', a: { class: 'bw_card' }, ... }
Agent calls generateUserInterface({ taco: <that TACO> }) (AG-UI)
  -> client renders it in the chat surface
```

### What this means for bitwrench

bwmcp's knowledge tools (`bitwrench_components`, `bitwrench_guide`)
already teach agents how to produce valid TACOs. The agent doesn't
need to learn two systems -- MCP teaches it bitwrench, AG-UI is
just the pipe. The TACO format is the glue.

### Convergence opportunities

1. **`bw.catalog()`** -- bwmcp's `bitwrench_components` tool and
   AG-UI's `_mapA2UIComponent()` both need to know what components
   exist. A public `bw.catalog()` would be the single source of
   truth for both.

2. **`bw.jsonPatch()`** -- bwmcp's `render_live` sends full DOM
   replacements. AG-UI uses JSON Patch for state deltas. If
   bitwrench had `bw.jsonPatch()` in core, bwserve could adopt
   state deltas too, reducing bandwidth on constrained devices.

3. **`bw.formData()`** -- bwmcp's `make_form_group` creates forms,
   AG-UI's `generateUserInterface` creates forms from JSON Schema.
   Both need to extract form data. A core utility avoids both
   reimplementing the same `querySelectorAll` loop.

4. **Event bridging** -- bwserve messages (replace, patch, append)
   and AG-UI events (TEXT_MESSAGE_CONTENT, TOOL_CALL_START) are
   different protocols over the same transport (SSE). A bitwrench
   app could receive both simultaneously if bwserve could route
   AG-UI events to `bw.apply()` -- which is exactly what the RAW
   event type does in this adapter.

### What NOT to do

Don't merge bwmcp and AG-UI into one thing. MCP is tool discovery
(server-to-agent). AG-UI is UI streaming (agent-to-human). They
solve different problems and should stay separate. bitwrench is the
renderer that both talk to.

Don't add AG-UI or MCP as dependencies of bitwrench core. They're
protocol adapters that sit on top. bitwrench's value is that it
has no opinions about how data arrives -- TACO from MCP, AG-UI,
bwserve, a REST API, or a hardcoded object literal all render the
same way.


## The "just enough" principle

bitwrench doesn't need to become an agent framework. It needs to
be a UI library that agent frameworks can use. The difference:

**Agent framework** (what NOT to build):
- Owns the connection to the LLM
- Manages conversation state
- Defines tool schemas
- Handles authentication

**Agent-ready UI library** (what bitwrench already is, nearly):
- Renders whatever TACO it's given, from any source
- Exposes its component catalog for discovery
- Provides pub/sub for event routing
- Extracts form data for round-trip
- Works without a build step, in any environment

The gap between "already is" and "nearly" is:
- `bw.once()` -- 5 lines
- `bw.catalog()` -- expose existing BCCL registry
- `bw.jsonPatch()` -- ~40 lines
- `bw.formData()` -- ~15 lines
- Wildcard subs -- ~10 lines in pub/sub internals

That's maybe 100 lines of code total. No new dependencies. No
philosophy change. Just making the existing design more accessible
to the protocols that are now looking for exactly what bitwrench
already does.
