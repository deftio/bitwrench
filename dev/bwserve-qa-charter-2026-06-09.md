# bwserve QA Charter — consistency + living up to the billing

**Date**: 2026-06-09 (rev 2 — per Manu: **bwserve is a first-class
citizen of 2.1**, an add-on that builds seamlessly on the core — NOT a
follow-on phase. Package 12 is written and running red-by-design with
the rest of the suite; the gates below are 2.1.0 release requirements.)
**Status update from package 12's first run (against 2.0.32)**: dead-
connection pruning (B2), foreign-id rejection (B4), and 200-message
burst ordering (B3) **already pass** — kept as regression guards. The
act payload (A4) flows through the return route intact, so that fix is
client-dispatcher-side. Confirmed red: no handshake/`v`, old verb+field
names, code-bearing methods present (A1), patch undisciplined, reconnect
does not re-push truth (B1), and **default bind is `0.0.0.0`** — the
loopback-default item (C4) is a confirmed finding, not a suspicion.
**Perspective**: QA engineer + first-hour developer. Grounded in a code
survey of `src/bwserve/*` (index 572L, client 358L, bwclient 141L,
bwshell, attach) and `src/cli/*` (attach 589L, serve 549L) at 2.0.32.
**Companion**: lifecycle spec §5 (protocol), `docs/security.md` scope,
spec suite `dev/test_v2.1/` (packages 06 covers `bw.apply`; nothing yet
covers the server, the transport, or the round trip — that is package 12,
outlined here).

The billing being tested against: *streamlit/gradio replacement · ESP32
serves a live dashboard in milliseconds · any language drives the UI ·
an LLM can inspect/message/screenshot a running page · remote debug of
any page via attach.*

---

## A. Consistency findings (bwserve vs the 2.1 spec, from the code survey)

**A1. Code crosses the wire in FOUR places, not two.** The spec kills
protocol `exec` and wire `register`. The survey found two more of the
same disease wearing different route names:

- `client.query(code)` / `_bw_query` builtin — does
  `new Function(opts.code)()` on server-sent source, **ungated** (no
  allowExec check). This is `exec` with a return value.
- `client.mount(selector, factory, …)` / `_bw_mount` — has a clean data
  path (BCCL name → `bw.make`) AND a function-source fallback
  (`new Function("props", f)`) under allowExec.

2.1 resolution: `query` is **deleted** (its legitimate uses are `inspect`
+ `message` + `call`-to-registered-closures); `mount`'s factory argument
becomes **name-only** (data), the source fallback deleted. The builtins
(`scrollTo`, `focus`, `download`, `clipboard`, `redirect`, `log`) stop
being source-strings-evaluated-at-attach and become real closures in the
shipped client, registered via `bw.registerRemote`. QA gate: enumerate
every server→client route and assert each carries only data — this is
now a test, not a review note.

**A2. Server method names don't match the verb table.** The spec's rule
is 1:1:1 (protocol type ↔ client function ↔ CLI subcommand); the server
API must join it: 1:1:1:1. Today: `client.render()` sends what 2.1 calls
`mount`; `client.patch(id, content, attr)` predates the
`{text|attrs|content}` discriminator; nothing emits `v`. Required:
server methods renamed to the verb table (`mount`, `patch{text/attrs/
content}`, `append`, `replace`, `remove`, `refresh`, `message`, `call`,
`batch`), every message stamped `v:1`, plus `setThemeMode` passthrough
(it exists precisely so servers can set dark mode idempotently — wire it).

**A3. Handshake carries no version either direction.** Spec §5.1
requires it. Server's first SSE event should be
`{v:1, type:'hello', bwserve: VERSION}`; the client POST-back envelope
carries `v` too; mismatch → `wire_rejected` + visible status.

**A4. The act payload shapes disagree.** 2.1's dispatcher sends
`{v:1, type:'event', action, value, name?, form?, ref}` through
`bw.remote.send`; today's `sendAction` posts `{action, data}` and the
old `_wireActions` reads `data-bw-action`. Server `client.on(action,
handler)` must receive the 2.1 payload, and `_wireActions` is replaced
by the `bw_act_*` dispatcher + `bw.remote` seam. Round-trip test: click
a `bw_act_*` button in a real browser page → server handler receives the
exact §5.4 payload.

**A6. Public address contract.** `app.port` (and an `app.url()`
convenience) must reflect the *bound* address after `listen()` — with
port-0 support, the OS picks; consumers (tests, tools, the CLI) must
never spelunk `app._server.address()`. Proof-pass catch: the suite's
own port discovery depended on the private field; now pinned as a
public-contract test.

**A7. One remote seam, settled.** `bw.remote.send` only. A draft test
implied `bw.actions.setTransport` as a second hook — rejected (two
seams = two divergent paths); the suite now asserts
`bw.actions.setTransport === undefined`.

**A5. bwcli attach must survive the eval removal — as a PRODUCT test,
not a port (rev 3, per Manu).** cli/attach.js (589 lines) leans on
query/exec for its REPL. The deliverable is a **parity checklist**:
every current attach command mapped old→new *before* deletion, each row
marked kept-as-verb / improved / dies-with-eval (changelog'd). The bar
is not "safer" — it's that the verb-model REPL must *feel equally good*:
same or fewer keystrokes for the common loops (inspect → message →
screenshot; watch events via `listen`). If a debugging move got
clunkier, that's a missing verb or a missing CLI ergonomic, and it gets
fixed before ship. "The production API IS the debug API" is a claim
bwcli either proves or falsifies.

## B. Reliability findings (the billing implies these; nothing tests them)

**B1. Reconnection is the #1 real-world gap.** `es.onerror` sets a
status string and stops. EventSource auto-retries at the browser level,
but: the server treats a reconnect as a brand-new client (new id or
stale id?), the `page()` handler does not re-run, missed messages are
gone (no replay), and the UI silently drifts stale. The streamlit
billing dies the first time a laptop lid closes. Required semantics
(then tests): on reconnect, the server re-runs the page handler for that
client (server-driven UI's honest answer to replay — re-push current
truth, don't journal deltas); client shows status via a `bw:diag`
`remote_status` code; an optional `onReconnect(client)` hook for apps
that need finer control. Test: kill the SSE socket mid-session, assert
the page converges to current server truth.

**B2. Server-side client lifecycle = the server-side janitor.** The
keepalive write swallows errors; dead connections appear to linger as
client objects (verify + fix: prune on write failure / res close event,
with a max-clients guard). Mirror of the browser janitor argument: rude
disconnects are normal reality. Test: open 50 connections, kill them
rudely, assert server registry returns to zero (the server needs its own
`_debug()` equivalent — add `app.stats()`).

**B3. Ordering and flood behavior.** SSE guarantees order per
connection; the ESP32 delta-update story is exactly this shape (tiny
messages, high rate). Two tiers (proof-pass clarification): the fast
red suite (package 12) pins **200 messages, complete and in order** —
a correctness test that runs in milliseconds; the **1000+ burst with
timing numbers** is the release-gate benchmark companion, recorded in
the repo, not run per-commit.

**B4. Cross-client isolation.** `/bw/return/<route>/<id>` — verify the
server rejects unknown/foreign ids, and define multi-tab semantics
explicitly: is `client` per-connection (unicast) with an explicit
`app.broadcast()`, or shared? (Recommend: unicast per connection +
`app.broadcast(fn)` — dashboards need both, and implicit broadcast is a
privacy bug for form-bearing apps.) Tests for both paths + foreign-id
rejection.

## C. Billing-specific gates (what "lives up to it" means, testably)

**C1. The 10-line streamlit test.** The canonical demo must be a real,
CI-run e2e: ≤10 lines of server code → browser shows a themed dashboard;
type in an input → server `client.on` fires with formData; server
patches a value back → visible. If the demo needs more than 10 lines or
any frontend code, the billing is wrong — fix the ergonomics, not the
README. (Candidate sugar this will expose: a `client.state` session
object; input round-trip helpers.)

**C2. Protocol conformance fixtures — the "any language" proof.** A
directory of golden JSON files (valid + invalid messages per verb) +
a validator script. The Node server consumes them in CI; an ESP32 C
implementation, a Python script, or an LLM validates against the *same
fixtures*. This converts "any backend can drive it" from a claim into a
kit — and it's most of the work toward `taco-bwserve.schema.json`
already on the release gate. The C/embedded reference snippet in the
embedded tutorial should be generated-from or checked-against these
fixtures.

**C3. The LLM loop, measured.** The loop is inspect → decide → verb →
screenshot. Gates: `inspect` responses have depth/size caps with
explicit truncation markers (token economics — an unbounded tree dump
on a big page wrecks the "10x cheaper" claim); `screenshot` honors
maxWidth/format (exists — test it); and **wire-level observability**:
2.1 adds a `{v:1, type:'listen', topic}` verb so a remote client can
subscribe to `bw:lifecycle` / `bw:diag` / `act:*` and receive them as
events — replacing the current selector-based `_bw_listen` builtin with
the same pub/sub the page itself uses. That single verb is what makes
"the LLM listens to events and reacts" wire-true, and it gives
server-side developers the client's diag stream (streamlit-style devs
never open devtools — bring the errors to them).

**C4. Security posture matches the docs.** Default bind localhost
(verify; CLI gained bind-address config in 2.0.29 — define the default
loudly); `docs/security.md` covers the LAN-dashboard case (embedded
billing means people WILL expose it): client-id validation, no
code-bearing routes (A1), and what an attacker controlling the SSE
stream can/can't do post-2.1 (answer: anything the verb table allows,
nothing more — that's the point).

**C5. Embedded reality checks.** Relaxed-JSON acceptance from C code
(exists — keep tested); payload-size discipline documented (a sensor
patch should be ~60 bytes — assert the examples stay that small); the
shell page served by an MCU works with `{handlers:false}` + bw_act only
(no function registry on a 240KB-RAM device).

## D. Package 12 (integration suite) — WRITTEN

`dev/test_v2.1/12-bwserve.spec.js` — runs a **real** `bwserve.create()`
over raw Node http with an SSE frame parser; no browser needed for
server semantics (client-side application is package 06's job). Covers
A1/A2/A3 envelope + no-code routes, A4 act round-trip, B1 reconnect,
B2 server janitor, B3 flood, B4 isolation, C4 loopback default. Still
to add as implementation lands: C1 ten-line e2e (playwright), C2
conformance fixtures, C3 listen verb + inspect caps. Every test maps to
a row above; bwserve turns green in the same run as the core.

---

*Summary for the release narrative: bwserve's architecture already
matches the billing — SSE + data-only messages + verb dispatch is the
right shape, and nothing here is a redesign. What's missing is the
boring half of "server-driven": reconnect truth, server-side cleanup,
conformance fixtures, and the ten-line proof. That's exactly the half
reviewers poke first.*
