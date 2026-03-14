The site is live and running cleanly (the willMount hook fires every page load — working correctly). Here's my comprehensive assessment:

Ember & Oak v2.0.17 — Full Rebuild Assessment
What's new in this rebuild
The rebuilt site exercises these v2.0.17 APIs that weren't available or weren't properly used before:

API	Used for
bw.raw()	Hero h1 — renders Coffee That<br>Tells a <span>Story</span> without a mounted hook hack
bw.s() + bw.u	All inline styles composed from utility objects instead of raw strings
bw.responsive()	Hero font size, contact grid, nav links all use proper media breakpoints
bw.makeStepper()	"From Farm to Cup" process section
bw.makeAvatar()	Team member initials avatars
bw.makeCTA()	Bottom call-to-action banner
bw.makeMediaObject()	Testimonials author blocks
bw.makeStack()	Footer four-column layout
bw.patch()	Contact form → success message swap (no full re-render needed)
bw.patchAll()	Live data simulation in showcase
bw.emit() + bw.on()	Coffee filter emits DOM events, showcase log captures them
bw.funcRegister()	Named handler registry, callable by name
bw.each()	Tag list in showcase bw.component()
willMount / onUpdate	Counter component lifecycle hooks (logged to console)
onclick in a:	All event handlers — no mounted hook listeners anywhere
The Good
bw.raw() is a genuine improvement and eliminates a real footgun.

In v2.0.16 I had to use a mounted hook to do el.innerHTML = title for the hero. That was:

Two extra lines of boilerplate
A mounted hook used for the wrong purpose (event wire-up vs content injection)
Invisible to the TACO tree (the DOM diverged from what the TACO described)
bw.raw() is the right fix. It's explicit, one-liner, and stays inside the TACO:

{ t: 'h1', c: bw.raw('Coffee That<br>Tells a <span>Story</span>') }
Simple. Correct. Readable.

bw.s() + bw.u is the best new addition in the whole release.

Before (v2.0.16):

{ t: 'div', a: { style: 'display:flex;align-items:center;gap:1rem;margin-bottom:0.4rem' } }
After (v2.0.17):

{ t: 'div', a: { style: bw.s(bw.u.flex, bw.u.alignCenter, bw.u.gap4, { marginBottom: '0.4rem' }) } }
This is actually better than Tailwind class strings for a key reason: it's composable at runtime. You can store base styles in variables, merge them conditionally, and override individual properties with Object.assign. Tailwind class strings require string concatenation which is fragile. The bw.u catalog covers the most common cases cleanly.

The one gap: bw.u doesn't have flexShrink, objectFit, overflow, position, or zIndex utilities. Anything outside the catalog needs a raw object anyway. This is fine for the 80% case, but you need to know where the edge is.

bw.responsive() is excellent for what it does.

bw.responsive('.eo-hero-title', {
  base: { fontSize: '2.4rem' },
  md:   { fontSize: '3.8rem' },
  xl:   { fontSize: '5rem' }
})
This generates proper @media (min-width: ...) rules from a JS-native object. The output joins into the CSS block alongside bw.css() results. The breakpoints match bitwrench's grid system. Clean and predictable.

Minor usability note: bw.responsive() returns a raw CSS string, not a bw.css() result. You join them with [...].join('\n') and pass to bw.injectCSS(). This works fine but isn't immediately obvious — the docs should call out that you join before injecting.

bw.patch() for the contact form swap is the right architecture.

Instead of mounting a bw.component() just to toggle between form and success states (which would require Tier 2 expressions for the display ternary), bw.patch() replaces the element's content entirely:

bw.patch(contactFormId, successMessageTaco);
This is Level 1 thinking: one-way data flow, explicit action, no background reactivity. It's actually more appropriate here than a full component because the form-to-success transition is one-way — you never need to go back. The right tool for the job.

The new BCCL components are solid.

makeStepper(), makeAvatar(), makeCTA(), makeMediaObject(), makeStack() — all worked on first use, no surprises. The prop signatures are consistent (destructuring with defaults, className for extension). They all return plain TACOs so you can inspect, modify, or wrap them before passing to bw.DOM().

makeStack() is particularly useful for replacing repetitive grid/flex wrappers. It generates the right bw_vstack or bw_hstack classes which tie into the bitwrench CSS system.

The pub/sub + component pattern for the cart badge is elegant.

navbar.sub('cart:updated', function(d) { navbar.set('cartCount', d.count); });
// elsewhere:
bw.pub('cart:updated', { count: cartCount() });
The badge updates reactively, the cart panel is Level 1, and the state lives in one place. No shared mutable state between components. This is the pattern that makes bitwrench scale beyond toy demos.

The Bad
bw.each() and bw.when() are documented but risky in practice.

The LLM guide documents both as Level 2 APIs. bw.each() worked in the showcase's contained component demo. But for the coffee grid — the core of the app — I couldn't confidently rely on it for the initial render because I wasn't sure how deeply ComponentHandle scans the TACO tree for _bwEach markers.

I fell back to Level 1: module-level filter state + bw.DOM() re-render on filter change + manual class updates on filter buttons. This works reliably and is arguably cleaner for this use case. But it means bw.each() is a feature I documented but didn't trust for production use.

The issue is that bw.each() requires the filter state to live inside the component's o.state. Mixing that with external onclick handlers that need to reference the component (before it's fully defined) creates a circular dependency that's awkward to resolve cleanly with var coffeeSection; hoisting.

The fix: the docs should show a complete worked example of bw.each() with external-trigger filter buttons — this is the most common real use case.

Template binding Tier 1 vs Tier 2 is an invisible footgun.

I wrote ${count * 2} in a counter display before remembering it requires bw.compile(). It would have silently shown 0 or the literal string — no error, no warning. Only the LLM guide tells you this, and only briefly.

The failure mode needs to be surfaced better:

Bitwrench should log a console warning when it encounters a Tier 2 expression in a Tier 1 context
Or the docs should explicitly say "expressions that don't work in Tier 1: ${x * 2}, ${x > 5 ? "a" : "b"}, ${Math.max(x, 0)}"
Tier 1's constraint (dot-path only) also means you can't easily toggle display states inside a component without either (a) using Tier 2 + bw.compile(), or (b) storing pre-computed display strings in state. I used option (b): storing 'block'/'none' as state values. It works, but it's not obvious.

makeDataTable() is in the LLM guide but not in the source.

The LLM guide lists:

bw.makeDataTable({ title, data, columns, responsive, striped })
It doesn't exist. The source has makeTable() and makeTableFromArray(). I discovered this while writing the site and had to switch. The guide was written ahead of the implementation. This is exactly the kind of inconsistency that destroys trust in documentation — if one API doesn't exist, what else is wrong?

bw.funcRegister() has a confusing retrieval API.

You register with bw.funcRegister(fn, 'myName'). You retrieve with bw.funcGetById('myName'). The asymmetry (funcRegister vs funcGetById) is surprising. "Register" and "GetById" suggest different mental models (name-based vs id-based). The docs give no guidance on when you'd actually want this vs a plain closure.

The real use case — SSR with bw.htmlPage() where onclick functions must serialize — is never shown in the LLM guide. Without context, funcRegister looks like a solution without a visible problem.

The Ugly
The cart close button: closest() vs direct getElementById.

My original close handler:

onclick: function(e) { e.currentTarget.closest('#eo-cart').classList.remove('open'); }
Failed in the Playwright test. My fix:

onclick: function() { var p = document.getElementById('eo-cart'); if (p) p.classList.remove('open'); }
Worked. The underlying issue is that e.currentTarget with bitwrench's addEventListener registration may not behave identically to a native onclick attribute in edge cases. When Playwright's synthetic click fires, e.currentTarget or closest() may return null in some DOM configurations. The stable fix is always to reference elements by ID directly rather than traversing up from currentTarget.

This is a bitwrench-adjacent footgun: because onclick handlers are registered via addEventListener, they don't receive the HTML attribute this context. Documentation should note this explicitly.

The "onclick in a: not mounted" rule is critical but buried.

The most important behavioral rule for bitwrench is: put event handlers in onclick inside a:, never in o.mounted. When a binding update re-renders a component, mounted-hook listeners attached to the old element are lost.

This rule appears once in the LLM guide under "Events Pattern" with no emphasis. It should be:

A bold-faced warning at the top of the events section
Documented with the failure mode: "If you attach click listeners in o.mounted, they will be silently lost on the next component re-render"
Shown in contrast: BAD (o.mounted + addEventListener) vs GOOD (a: { onclick: fn })
We learned this rule the hard way in v2.0.16. It should be the first thing any bitwrench developer learns.

bw.responsive() and bw.css() have different signatures and return different things.

bw.css({ '.selector': { property: value } }) → CSS string
bw.responsive('.selector', { base: {}, md: {} }) → CSS string
But they feel like they should be the same API. If bw.css() accepted @media keys natively (like many CSS-in-JS libraries do), bw.responsive() wouldn't need to exist. Having two separate functions that do related things means you always need to remember which one handles which case — and that you need to .join('\n') them before bw.injectCSS().

Overall Verdict
v2.0.17 is a meaningful improvement. The CSS API (bw.s(), bw.u, bw.responsive(), bw.raw()) is now genuinely good — better than many lightweight CSS-in-JS solutions for a no-build context. The new BCCL components are solid. The events/pub-sub architecture is clean and scales well.

The gap is in documentation trust: makeDataTable() doesn't exist, Tier 1 vs Tier 2 failures are silent, and the most important rule (onclick in a:) isn't prominently warned. A developer picking up bitwrench from the LLM guide will hit at least two of these gaps in the first hour.

If those documentation gaps close in v2.0.18, bitwrench becomes a genuinely compelling choice for no-build, no-framework UI work.

