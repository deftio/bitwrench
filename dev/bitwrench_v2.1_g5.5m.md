# Bitwrench 2.1 Design Review - GPT-5.5

Date: 2026-06-09

Scope: reviewed the 2.1 lifecycle spec rev 8, the CSS companion spec, the north star, the Fable audit record, and the relevant current implementation surfaces in `src/bitwrench.js`, `src/bitwrench-styles.js`, `src/bwserve/*`, and the lifecycle/theme/attach tests.

Review stance: I am grading the 2.1 design as a breaking design, not criticizing it for disagreeing with 2.0.x. The current code is useful evidence for why the fixes matter, but 2.1 is allowed to rename, delete, and reset semantics. The question is whether the new contract is coherent, honest, implementable, and true to bitwrench's paradigm: TACO as data, DOM as component/registry, explicit updates, no hidden render engine, and data over the wire.

## Bottom Line

The 2.1 direction is right. I agree with the core fixes: breaking the overloaded lifecycle verbs, making compounds compose atomics, moving registration to mount, replacing `update` rebuilds with explicit `refresh`, deleting `exec`/wire `register`, replacing `data-bw-action` with action classes, and cleaning CSS into the same make/apply/load grammar. This is the right kind of breaking release for bitwrench: not React-ifying it, but making the native bitwrench model sharper.

My grade: strong design, not yet agent-proof. The remaining issues are not philosophical objections; they are places where the spec still allows two plausible implementations. Those need tightening because the next step is likely parallel agent work, and ambiguity will become drift.

The critical issues I would fix before agents code:

- `detach` contradicts the quick-card invariant unless it is explicitly a registered-but-disconnected keep-alive state.
- `bw.DOM` returning "the root" needs a rule for arrays, fragments, null, text, and multi-root content.
- UUID collision reminting must also repair `_bw_refs` and any newly-built local addressing maps.
- `o.type` needs a crisp lifecycle meaning. Is it enough to make something a component, or only metadata?
- `bw_act_*` needs exact class parsing, event, payload, and form semantics.
- CSP nonce coverage must include every inline script emitted by `htmlPage`, not only the function-registry script.
- `bw.derive` needs disposal, seed, partial-input, cycle, and error semantics before it is safe to hand to agents.

## What The Design Fixes Correctly

### Lifecycle Grammar

I strongly agree with the design's main lifecycle repair. 2.0.x has too many paths doing partial lifecycle work. The 2.1 atomic/compound split is the right answer:

- `create` creates hydrated detached DOM but registers nothing.
- `mountTree` is the only registration/mounted hook pass.
- `unmount` is the exact inverse and strips every bw trace.
- `mount`, `append`, `replace`, `remove`, and `refresh` are just compositions.

That is the bitwrench version of a render engine contract, without adding a render engine. It keeps the DOM as the truth and makes lifecycle edges testable.

### Naming And Cost

I agree with the rename posture. `bw.update` as rebuild was the wrong name. `refresh` should sound heavy because it is heavy. `replace` killing identity and `refresh` killing children is a useful distinction and should be taught everywhere. The design is right to break this now instead of preserving a misleading API.

`bw.DOM` returning the new root is also conceptually right if `bw.DOM` is an alias of `bw.mount`. The only problem is not the break; it is the multi-root return edge called out below.

### Registry Semantics

I agree with "registration only at mount." This is a key correctness fix. Created-but-never-inserted nodes should not be retained by a global registry, and a DOM-watching janitor cannot see nodes that never entered the DOM. The design fixes the leak class structurally instead of sweeping around it.

I also agree that UUID collision should remint rather than throw or skip. Throwing makes benign factory/template reuse too brittle; skipping with a live class is dangerous. Reminting is the right policy, with one important `_bw_refs` caveat below.

### Janitor

I agree with the default-on MutationObserver janitor. "The DOM is the registry" means the registry has to watch the DOM. Rude removals are normal web reality, not programmer fantasy. The janitor is not React-like magic; it is the registry maintaining its own invariant when the DOM changes underneath it.

The async-move rule is also directionally right: if you intentionally keep a component alive while disconnected, say so with `bw.detach`. The design should not try to infer intent from arbitrary delayed reinsertion.

### Wire Security

I strongly agree with removing protocol `exec` and server-sent `register`. That is not optional hardening; it is required for the "code never crosses the wire" claim to be credible. The replacement model is the right bitwrench model: page-shipped client code plus server-sent data, verbs, method names, and action names.

`bw_act_*` is the right replacement for `data-bw-action`. It serializes as plain HTML, works for string-rendered pages, is visible to DevTools and inspect tools, and fits the class-marker architecture already used by UUIDs and lifecycle markers.

### CSS

I agree with the CSS companion's design. Keep `makeStyles` / `applyStyles` / `loadStyles`; add `setThemeMode`; fix scope id collisions; make layer ordering deterministic; preserve the quikchat-style scoped alternate mode. This is the same grammar as components without churn for symmetry's sake.

### North Star

Principles 10-13 are the right additions. Names carry cost, the registry watches the DOM, dependencies are declared rather than tracked, and protocol code is forbidden. Those are the exact guardrails that keep bitwrench distinct from React/Svelte while still addressing real app complexity.

## 1. Lifecycle Spec

### Section 0 Quick Card

The card is strong, but two lines read wrong enough that I would fix them before anything below it.

First, the invariant "in-document <=> registered <=> mounted-fired" is false once `bw.detach(el)` exists. The spec later says `detach` keeps registration, state, handle, and tied subscriptions while the element is disconnected. That is the correct behavior, but the invariant needs one more state:

```
registered <=> live: connected OR explicitly detached
mounted-fired is once per live identity, not a synonym for connected
```

Otherwise implementers will either break `detach` to satisfy the invariant, or break the invariant and not notice.

Second, `MOUNT el = bw.mount(target, taco)` says "root element" and "el.bw.* immediately usable." That is only true for single-root element TACOs with a handle/slots. The current API accepts arrays, primitives, raw fragments, and null-ish content. If 2.1 keeps those inputs, the card needs the return contract. Options:

- Narrow `bw.mount`/`bw.DOM` to single-root content and push arrays to `bw.append` or an explicit fragment wrapper.
- Return first inserted element for arrays, `Text` for primitives, `DocumentFragment` never after insertion, and `null` for empty content. This is possible but not clean.
- Return an array for multi-root content. That breaks the "alias returns root" simplicity.

My recommendation: for `mount`, make the common path sharp. "Returns the new root element; multi-root content is allowed but returns the first inserted node and is not the component-handle path" is acceptable if documented, but a single-root-only mount would be cleaner for 2.1.

The "LIVE el.bw.method() > slots > bw.message..." line also reads like precedence or superiority rather than increasing cost. Use `->` or explicitly say "cheapest to heaviest."

### Section 1.3 Renames

`bw.createDOM` to `bw.create`, `cleanup` to `unmount`, and `update` to `refresh` are all correct. The breaking change that needs the most migration care is `bw.DOM` returning the new root instead of the container. Most call sites probably ignore the return, but the ones that do not will fail subtly because old code may chain container operations:

```
var app = bw.DOM('#app', view);
app.classList.add('ready'); // old: #app, new: mounted child
```

The migration lint should not just grep for `bw.DOM(`. It should flag assigned returns and chained returns from `bw.DOM(...)`, because ignored calls are fine and assigned calls need human review.

The BCCL marker row also hides a naming problem: current code uses `bw_is_component_bccl_${type}` for any `o.type`. If `o.type` is open to custom components, `bw_is_component_bccl_sensor_card` is the wrong namespace. Either reserve `o.type` values for BCCL, or split the marker:

- `bw_is_component`
- `bw_is_component_type_<type>` for all components
- `bw_is_component_bccl_<name>` only for BCCL factory output

Do not carry the current "all types are bccl" marker into the cleaned namespace.

### `o.type` Needs a Decision

The spec says wire TACOs can carry `o.type` as data and that it "DOES get wired." It also says elements with `o.*` get UUID, `bw_lc`, and mount events. Current code only treats `state`, `render`, `mounted`, and `unmount` as lifecycle, with `handle`/`slots` separately attaching `el.bw`.

For 2.1, decide explicitly:

- If `o.type` alone means "component", then `{t:'div', o:{type:'sensor-card'}}` gets `bw_lc`, UUID, type metadata, registry entry on mount, inspect visibility, and lifecycle events, even with no functions.
- If `o.type` is only metadata, then server-sent structure in Pattern B is not really a component until hydrated with a factory TACO.

I think `o.type` alone should be enough to create an addressable, inspectable component shell. That makes Path S adoption and bwserve Pattern B much more coherent. It also needs a test.

### Atomic/Compound Rule

The rule "compound verbs contain no logic except calls to atomic verbs" is the most important sentence in the doc. Keep it. It should be enforced in code review: `mount`, `append`, `replace`, `remove`, `refresh`, `patch` TACO branches, slot setters, and protocol apply should all share atomics. If an implementation adds a mini-cleanup inside `patch`, that is the old disease coming back.

### Janitor Async-Move Rule

The default-on MutationObserver janitor is right. The async-move rule needs more precision than "longer than a task."

Browsers deliver MutationObserver work around microtask checkpoints. An `await Promise.resolve()` move, a `queueMicrotask` move, and a `setTimeout` move may not all land on the same side of the janitor depending on the exact flush model. The spec should define behavior in terms of the janitor, not an informal task:

- Remove and reinsert before the janitor processes the removal record: not reaped.
- Still disconnected when the janitor processes the removal record: reaped unless `bw.detach` exempt.

Then test at least:

- same synchronous call stack remove+append
- `queueMicrotask` or `Promise.resolve().then(...)` reinsert
- `setTimeout(..., 0)` reinsert
- explicit `bw.janitor.flush()` before reinsert

The intended line may be "any async boundary is unsafe without `bw.detach`." If so, say that and make the promise test reap. If the intended line is "same macrotask is safe," say that and make promise reinsert survive. Right now "after an await" and "same task" are too easy to interpret differently.

One more important detach edge: the janitor exemption must not become permanent. If `bw.detach(el)` marks an element exempt, then a plain `appendChild(el)` reinsert needs to clear the exemption, or a later rude `el.remove()` will leak forever because the janitor still thinks it is intentionally detached. The spec says reinsert with plain `appendChild`, so the clearing point cannot rely only on `mountTree`. It needs either a liveness check in the janitor or a reconnect observer pass that removes the detached flag when `isConnected` becomes true.

### `bw.update` Warns, Never Refreshes

This is the right resolution. It preserves the "names carry cost" principle.

Two details are missing:

1. Old-style `bw.update(el)` should warn specifically if the element has `_bw_render`: "Use `bw.refresh(el)`." Otherwise the most common migration mistake becomes a vague "no update handle" warning.
2. Define when `bw:statechange` fires. The spec says `bw.update(ref, data)` emits it after successful dispatch, but direct `el.bw.update(data)` will not unless component authors do it themselves. That is fine, but document it. `bw.update` is a dispatch wrapper with an event; direct methods are author-controlled.

Also define "successful dispatch": no throw and method exists is probably enough. Do not infer success from return values unless you want a convention.

### UUID Honor and Collision Semantics

The "first mount wins; later collisions remint" policy is the right runtime compromise. Throwing is too brittle and "skip but leave class intact" is dangerous.

The missing piece is `_bw_refs`. Create builds local refs before mount. If a child arrives with `bw_uuid_x`, parent `_bw_refs.bw_uuid_x = child`, and mount later detects that `bw_uuid_x` collides and remints to `bw_uuid_y`, then the parent ref map is stale. Worse, `bw_uuid_x` now resolves to the first component, while the stale parent-local ref points at the second. That violates the whole "UUID class = name" invariant.

The collision remint must update every local ref map created during that create/mount pipeline, or refs must be built at mount after collision resolution. I would move final ref-map construction to `mountTree`, after UUID collision handling, so the registry and local refs are born from the same final identity.

Also decide whether plain elements with `bw_uuid_*` but no `o.*` are addressable. `assignUUID(taco)` currently works for any TACO, and the string path says UUID classes are structural identity. If plain addressable nodes are allowed, `mountTree` registers UUID tokens on all descendants, not only `.bw_lc`, and unmount/deregister must strip or deregister them without treating them as lifecycle components. If only components can have bw UUIDs, lint should reject `assignUUID` on plain TACOs and the docs should stop implying arbitrary pre-addressing.

Finally, "hand-placed UUIDs are honored" and "only `bw.uuid()` mints these" need a wording tweak. Runtime honors any token because it cannot distinguish source; policy says authors must not hand-type them. That is good, but call it "accepted at runtime, forbidden by lint" to avoid sounding like hand placement is supported.

### Path S and `htmlPage`

The CSP rev 8 change is correct: marker classes plus bind-at-load is the strict-CSP-compatible shape. Inline event attributes are not covered by nonce.

Two issues remain:

1. CSP nonce coverage must include all inline scripts emitted by `htmlPage`: inline UMD runtime, shim runtime, function-registry binding script, and any auto `bw.loadStyles()` script. The companion spec only names the function-registry script. Under strict CSP, the inline shim fails too.
2. "Code never crosses the wire" needs one sentence of nuance. `htmlPage` serializes function source into an HTML response. That is code delivery. The principle is really "the control protocol never transports newly-invented code after the page is served." Page HTML is allowed to contain code because serving a page is how web code is delivered.

The function registry should also be per-render by construction, not a snapshot of a global counter. The spec says that; make sure the implementation follows it. A render-local `Map<Function, id>` is the clean model.

### `bw_act_*`

The class namespace is the right replacement for `data-bw-action`. It matches the "DOM is the registry" model and survives string rendering.

The spec needs exact dispatch mechanics:

- Use `classList`, not `[class*="bw_act_"]`, to avoid false positives like `not_bw_act_save`.
- Define multiple action classes on one element. First wins? Publish all? Warn? I would warn and use the first sorted by class order.
- Define delegated target lookup: `e.target.closest('.bw_act_*')` is not directly expressible in CSS, so the implementation needs a classList walk up ancestors.
- Define `preventDefault`. Buttons probably no; links and forms yes. For forms, also stop native submit.
- Define payload for forms. Current bwserve examples capture nearby input values. The new generic payload `{ action, value, ref }` is too thin for internal-tool forms. Add `form: bw.formData(formEl)` on submit and maybe `name` for individual inputs.
- Define ref priority: UUID, then id, then maybe selector path? If neither UUID nor id exists, is `ref` null or auto-assigned?
- Define remote route shape. "POSTed back so the server handles it" needs the concrete bwserve route and server callback payload, because agents will implement both sides.

The default-on dispatcher is good. It should have an idempotent installer and `bw.actions.enable()/disable()` should be tested for duplicate-listener safety.

### Protocol

The v1 protocol table is good, but it mixes new field names with current names. Current bwserve uses `target` and `node`; the spec uses `ref`, `taco`, and `content`. That is a worthwhile cleanup, but the migration table should call it out so the server agents do not half-upgrade one side.

`patch(ref, content|attrs)` is ambiguous unless the message has a discriminator. A plain object could be attributes or a TACO-ish object. I would make protocol patch one of:

```
{ type:'patch', ref, text:'...' }
{ type:'patch', ref, attrs:{ disabled:true } }
{ type:'patch', ref, content:tacoOrArrayOrString }
```

That is more verbose but wire protocols benefit from boring clarity.

The `call` replacement for server-side `register` also needs the client-side API nailed down. `bw.registerRemote(name, fn)` is named in prose, but not in the quick card or test contract. Add tests that bwclient built-ins are registered as real local closures, not strings passed back through `bw.apply({type:'register'})`.

## 2. CSS Cleanup Spec

CSS-1 through CSS-8 all check out against the current code.

- CSS-1 is real: `_scopeToStyleId('#dash')` and `_scopeToStyleId('.dash')` collide, and complex selectors produce bad ids.
- CSS-2 is real: `clearStyles` only removes `bw_theme_alt` from `targets[0]`.
- CSS-3 is real: `scopeRulesUnder` recurses into all at-rules and corrupts `@keyframes`.
- CSS-4 is real: scoped alternate `body` is dead because body is an ancestor, not a descendant.
- CSS-5 is correctly resolved: `loadStyles()` should mean structural plus default theme. The docs that say structural-only are wrong.
- CSS-6 is real: structural uses `bw_structural`, is global, and is not clearable through the style-id grammar.
- CSS-7 is real: deterministic `setThemeMode(mode, scope)` is needed for bwserve and for mixed multi-element scopes.
- CSS-8 is worth doing: `bw:thememode` matches the lifecycle observability model and helps chart/canvas components.

The quikchat pattern also matches my mental model: generate scoped rules under the panel, put the alternate class on the scope root, and let each scope own its mode independently. That is the correct architecture.

The main missing CSS detail is scope grammar. `applyStyles(styles, '#panel')` is clean. `applyStyles(styles, '.panel')` intentionally means multiple independent roots. But complex scopes like `'#a .b'` or comma scopes make mode-setting and self background rules harder to reason about. I would either:

- bless only a single root selector for themed scopes (`#id`, `.class`, or an Element), or
- explicitly define how self-rules and `setThemeMode` behave for complex and comma selectors.

For 2.1, I would keep it simple: scoped themes are root scopes, not arbitrary selector transforms.

The CSP row is good but incomplete in the same way as the lifecycle spec: nonce all bitwrench inline scripts, not only the registry script. Also make `bw.config.cspNonce` a function or value? A nonce is per response; a function can avoid stale reuse in server render helpers, but a value is enough in the browser if page code sets it from the served nonce.

Layer ordering is a good addition. To make it robust, `injectCSS` should probably distinguish bitwrench-owned layer ids from user ids. If user code injects an id starting with `bw_style_`, either allow with no ordering guarantees or warn that the namespace is reserved.

`setThemeMode` should return more than a string if it acts on many elements. At minimum publish `{mode, scope, count}` on `bw:thememode`; returning just `'alternate'` hides the "no targets" and "three targets changed" cases.

## 3. North Star

The added principles 10 through 13 are the right principles. I would edit them for precision rather than direction.

Principle 11 should include the `detach` exception. Current text says the registry watches the DOM and rude removal is expected, but `detach` is intentionally disconnected and registered. Add "except explicit keep-alive detaches."

Principle 12 is good, but `bw.derive` needs one more sentence: "The graph is explicit and disposable." Without disposal, derives become the new global registry leak.

Principle 13 needs the same page-serving nuance as the lifecycle spec. Suggested wording:

> Control messages never carry code. Servers, CLIs, and LLMs send data: TACOs, verbs, method names, and action names. Executable code is delivered only as page code at page-serving time, never as later protocol payload.

The CSS paragraph in principle 3 currently says CSS vars are fine and points to quikchat, while the 2.1 CSS companion says "CSS custom properties: still none." That can read like drift. I would phrase it as: "CSS variables are a web platform feature and can coexist in user CSS; bitwrench's design system does not depend on them."

The drift checks need two trims:

- "Would this code break in Node (no DOM)?" is too broad. Lifecycle code, mounting code, and style injection are browser-only by definition. Better: "Am I putting DOM work in a TACO factory or data-generation path that should stay universal?"
- "Am I using `data-*` attributes" is too broad unless the project truly wants to ban all HTML data attributes. The spec only needs to ban `data-bw-*` as a bitwrench machine namespace. App-owned `data-testid` or third-party integration data may be legitimate.

I would also add drift checks for the new 2.1 failure modes:

- "Am I retaining a TACO or DOM clone to rerender later?" Drift. Consume TACO once; call the factory again.
- "Am I registering anything before mount?" Drift. Registration is mount-to-unmount only.
- "Am I moving a live node across an async boundary without `bw.detach`?" Drift. Use `detach`.
- "Am I hand-typing a `bw_uuid_*`, `bw_lc`, `bw_bccl_*`, or `bw_act_*` token?" Usually drift. Use the factory/helper or an app-owned class.

## 4. `bw.derive`

The idea is right: a pub/sub combinator fits bitwrench better than signals. But the current section is underspecified for implementation.

Define the return value. It should return a disposer:

```
var stop = bw.derive(inputs, fn, outTopic, opts);
stop();
```

If `opts.el` is provided, unmount calls the same disposer. If no `opts.el` is provided, the derive is intentionally app-lifetime and caller-owned.

Define seed and readiness:

- If `seed` is provided, it must match input length.
- If no seed is provided, does derive wait until every input has published at least once, or call `fn` with `undefined` for missing inputs? I recommend wait-for-all by default.
- Add `opts.partial: true` only if you want the undefined behavior.
- Decide whether seed publishes immediately. I recommend `opts.immediate: true` for initial publish, default false, so creation is not surprising.

Define errors. Since derives run inside pub/sub handlers, thrown errors could be swallowed by `bw.pub`'s subscriber try/catch. Route derive errors through `bw:diag` with a code like `derive_error`.

Define cycles. You do not need cycle detection in 2.1, but say cycles are caller error and can recurse until the stack or event queue fails. If you want a cheap guard, warn when `outTopic` is in `inputs`.

Define topic identity. Input topics are strings and latest values are cached from publishes after derive creation only; `seed` is how you provide prior state. That keeps pub/sub simple.

## 5. Optional Audit Record

F1 through F13 are real. The rev 8 lifecycle spec resolves the important ones in the right direction:

- self-first unmount fixes F1
- remint-on-collision fixes F2, pending `_bw_refs` repair
- public `mountTree` fixes F3
- update-warns fixes F4
- hook-catch/render-propagate fixes F5
- `_bw_state` as author surface fixes F6
- doc workstream addresses F7
- `unmountChildren` fixes F8/F9/F11
- element-local unmount callback plus janitor fixes F10
- stripping `el.bw` and `_bw_type` fixes F12
- scale benchmark covers F13

The one audit resolution I would strengthen is F2: reminting the class is not enough unless every address map derived from the old token is also repaired.

## 6. Suggested Pre-Implementation Edits

1. Rewrite the quick-card invariant to include explicit detached keep-alive state.
2. Add the `bw.DOM`/`bw.mount` multi-root return rule to Section 0 and Section 1.2.
3. Decide whether `o.type` alone creates an addressable component shell.
4. Add `_bw_refs` repair/rebuild to the UUID collision rule.
5. Define janitor timing by "processed removal record" and add promise/timer tests.
6. Specify that `bw.detach` exemption clears on reconnection or on the next connected liveness check.
7. Expand `bw_act_*` with exact class parsing, multiple-action behavior, preventDefault policy, form payload, and bwserve route shape.
8. Add nonce coverage for all `htmlPage` inline scripts.
9. Add `bw.registerRemote` and `bw.derive` return/disposal semantics to the test contract.
10. Edit the north star drift checks so they do not over-ban legitimate browser-only lifecycle code or app-owned `data-*` attributes.
