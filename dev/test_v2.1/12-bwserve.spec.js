/**
 * 2.1 Spec Tests — Package 12: bwserve — first-class citizen of 2.1
 * Contract: lifecycle spec §5 (protocol, threat model, remote seam) +
 * bwserve-qa-charter-2026-06-09.md (A consistency, B reliability, C4 bind).
 *
 * bwserve is an add-on that builds seamlessly on the 2.1 core — same
 * suite, same red bar, NOT a follow-on phase. These tests run a REAL
 * bwserve server (it exists in 2.0.x) over raw Node http; client-side
 * application of received messages is package 06's job (bw.apply).
 * RED BY DESIGN where 2.1 semantics differ from 2.0.x.
 */
import assert from "assert";
import http from "http";
import bwserve from "../../src/bwserve/index.js";

/** Open an SSE connection; resolve once headers arrive. */
function sse(p, path) {
  return new Promise(function (resolve, reject) {
    const events = [];
    const req = http.request({ host: "127.0.0.1", port: p, path: path,
      headers: { accept: "text/event-stream" } }, function (res) {
      if (res.statusCode !== 200) {
        res.resume();
        return reject(new Error("SSE " + path + " returned HTTP " + res.statusCode));
      }
      let buf = "";
      res.on("data", function (chunk) {
        buf += chunk.toString();
        let i;
        while ((i = buf.indexOf("\n\n")) !== -1) {
          const frame = buf.slice(0, i); buf = buf.slice(i + 2);
          frame.split("\n").forEach(function (line) {
            if (line.indexOf("data:") === 0) {
              try { events.push(JSON.parse(line.slice(5).trim())); } catch (e) { /* keepalive/comment */ }
            }
          });
        }
      });
      resolve({ events: events, res: res, destroy: function () { req.destroy(); } });
    });
    req.on("error", reject);
    req.end();
  });
}

function post(p, path, body) {
  return new Promise(function (resolve, reject) {
    const data = JSON.stringify(body);
    const req = http.request({ host: "127.0.0.1", port: p, path: path, method: "POST",
      headers: { "content-type": "application/json", "content-length": Buffer.byteLength(data) } },
      function (res) { res.resume(); res.on("end", function () { resolve(res.statusCode); }); });
    req.on("error", reject);
    req.write(data); req.end();
  });
}

function waitUntil(fn, label, timeoutMs) {
  // Integration tests should wait for the design condition, not a magic
  // duration. That keeps the red cycle informative: a timeout now says which
  // lifecycle/bwserve invariant did not happen, instead of merely "slept too
  // little on this machine."
  const timeout = timeoutMs || 1000;
  const start = Date.now();
  return new Promise(function (resolve, reject) {
    (function tick() {
      try {
        if (fn()) return resolve();
      } catch (e) {
        return reject(e);
      }
      if (Date.now() - start >= timeout) {
        return reject(new Error("Timed out waiting for " + label));
      }
      setTimeout(tick, 10);
    })();
  });
}

let app = null, P = 0;
afterEach(async function () {
  if (app) { try { await app.close(); } catch (e) { /* ignore */ } app = null; }
});

async function start(pageHandler, opts) {
  // 2.1 should support port 0 in tests and tools. The OS chooses a free port,
  // which removes random fixed-port collisions and makes bwserve safe to run
  // in parallel with the core suite.
  app = bwserve.create(Object.assign({ port: 0, host: "127.0.0.1", keepAliveInterval: 60 }, opts || {}));
  if (pageHandler) app.page("/", pageHandler);
  await app.listen();
  assert.ok(app._server && app._server.address(),
    "bwserve must expose the bound server address after listen()");
  P = app._server.address().port;
  assert.ok(P > 0, "port 0 resolves to an ephemeral bound port");
  return app;
}

describe("12.1 consistency — server speaks the 2.1 verb table (charter A1–A3)", function () {
  it("app.port is PUBLIC after listen() — the bound port, not the configured 0 (charter A6)", async function () {
    await start(function () {});
    // The suite discovers the port via app._server as a red-phase fallback;
    // the contract is that no consumer should ever need to. (Proof-pass catch:
    // a test contract must not depend on a private field.)
    assert.strictEqual(typeof app.port, "number");
    assert.strictEqual(app.port, P, "app.port reflects the OS-assigned bound port");
    assert.ok(app.port > 0);
  });

  it("first SSE event is the handshake: {v:1, type:'hello'}", async function () {
    await start(function () {});
    const conn = await sse(P, "/bw/events/t1");
    await waitUntil(function () { return conn.events.length >= 1; }, "initial hello event");
    conn.destroy();
    assert.ok(conn.events.length >= 1, "server sends something on connect");
    assert.strictEqual(conn.events[0].v, 1, "handshake carries the wire version");
    assert.strictEqual(conn.events[0].type, "hello");
  });

  it("server methods match the verb table; messages stamped v:1 with ref/taco names", async function () {
    let captured = null;
    await start(function (client) {
      assert.strictEqual(typeof client.mount, "function", "client.mount (not render) per 1:1:1:1");
      client.mount("#app", { t: "div", a: { id: "w" }, c: "hi" });
    });
    const conn = await sse(P, "/bw/events/t2");
    await waitUntil(function () {
      return conn.events.some(function (m) { return m.type === "mount"; });
    }, "mount message");
    conn.destroy();
    captured = conn.events.find(function (m) { return m.type === "mount"; });
    assert.ok(captured, "a 'mount' message arrived (2.0.x sends 'replace')");
    assert.strictEqual(captured.v, 1);
    assert.strictEqual(captured.ref, "#app", "2.1 field name (2.0.x: target)");
    assert.ok(captured.taco, "2.1 field name (2.0.x: node)");
  });

  it("code-bearing server methods are GONE: query, exec, register(body) (charter A1)", async function () {
    let probe = {};
    await start(function (client) {
      probe.query = client.query;
      probe.exec = client.exec;
      probe.register = client.register;
    });
    const conn = await sse(P, "/bw/events/t3");
    await waitUntil(function () { return probe.query !== undefined || conn.events.length >= 1; },
      "page handler probe");
    conn.destroy();
    assert.strictEqual(probe.query, undefined, "query is exec with a return value");
    assert.strictEqual(probe.exec, undefined);
    assert.strictEqual(probe.register, undefined, "registration is client-side only");
  });

  it("patch over the wire uses the discriminated fields", async function () {
    await start(function (client) {
      client.patch("#x", { text: "hello" });
    });
    const conn = await sse(P, "/bw/events/t4");
    await waitUntil(function () {
      return conn.events.some(function (e) { return e.type === "patch"; });
    }, "patch message");
    conn.destroy();
    const m = conn.events.find(function (e) { return e.type === "patch"; });
    assert.ok(m);
    assert.strictEqual(m.text, "hello", "wire patch is {text|attrs|content}, never bare content");
  });
});

describe("12.2 reliability — the server-side janitor (charter B1, B2, B4)", function () {
  it("default bind is loopback, not 0.0.0.0 (charter C4 — embedded billing means LAN exposure)", function () {
    const a = bwserve.create({ port: 0 });
    assert.strictEqual(a.host, "127.0.0.1",
      "2.0.x defaults to 0.0.0.0 — all interfaces, no auth; 2.1 default is loopback, 0.0.0.0 is loud opt-in");
  });

  it("rudely destroyed connections are pruned (server registry returns to zero)", async function () {
    await start(function () {});
    const conns = [];
    for (let i = 0; i < 5; i++) conns.push(await sse(P, "/bw/events/kill" + i));
    await waitUntil(function () { return app.clientCount >= 5; }, "five SSE clients registered");
    assert.ok(app.clientCount >= 5);
    conns.forEach(function (c) { c.destroy(); });
    // This proves the normal rude-disconnect path (`req.close`) is pruned.
    // Write-failure pruning is a separate reliability gate; do not let this
    // test's wording imply it covers every possible broken socket shape.
    await waitUntil(function () { return app.clientCount === 0; }, "SSE close pruning");
    assert.strictEqual(app.clientCount, 0, "dead SSE connections must not linger as client objects");
  });

  it("reconnect re-runs the page handler — server re-pushes current truth (charter B1)", async function () {
    let runs = 0;
    await start(function (client) { runs++; client.mount("#app", { t: "p", c: "truth " + runs }); });
    const c1 = await sse(P, "/bw/events/rc1");
    await waitUntil(function () { return runs === 1; }, "initial page handler run");
    c1.destroy();
    await waitUntil(function () { return app.clientCount === 0; }, "first connection cleanup");
    const c2 = await sse(P, "/bw/events/rc1");        // same client id = reconnect
    await waitUntil(function () { return runs === 2; }, "reconnect page handler replay");
    c2.destroy();
    assert.strictEqual(runs, 2, "the page handler IS the replay mechanism");
    assert.ok(c2.events.some(function (m) { return m.type === "mount"; }),
      "reconnected client received current truth");
  });

  it("foreign/unknown client ids on the return route are rejected", async function () {
    await start(function () {});
    const status = await post(P, "/bw/return/action/never_connected_id",
      { v: 1, type: "event", action: "x" });
    assert.ok(status >= 400, "got " + status + " — unknown ids must not be accepted");
  });

  it("message order survives a 200-message burst (the ESP32 delta shape)", async function () {
    await start(function (client) {
      for (let i = 0; i < 200; i++) client.patch("#n", { text: String(i) });
    });
    const conn = await sse(P, "/bw/events/flood");
    await waitUntil(function () {
      return conn.events.filter(function (m) { return m.type === "patch"; }).length === 200;
    }, "200 patch burst", 2000);
    conn.destroy();
    const seq = conn.events.filter(function (m) { return m.type === "patch"; })
                           .map(function (m) { return Number(m.text); });
    assert.strictEqual(seq.length, 200, "no drops");
    assert.deepStrictEqual(seq, seq.slice().sort(function (a, b) { return a - b; }), "in order");
  });
});

describe("12.2a MCU payload discipline — tiny messages or the billing is fiction (charter C5)", function () {
  it("the canonical sensor patch stays under 80 bytes on the wire", async function () {
    let frame = null;
    await start(function (client) { client.patch("#cpu_v", { text: "71.2 °C" }); });
    const conn = await sse(P, "/bw/events/mcu");
    await waitUntil(function () {
      return conn.events.some(function (m) { return m.type === "patch"; });
    }, "patch frame");
    conn.destroy();
    frame = conn.events.find(function (m) { return m.type === "patch"; });
    const bytes = Buffer.byteLength(JSON.stringify(frame), "utf8");
    assert.ok(bytes <= 80,
      "sensor delta is " + bytes + " bytes — the ESP32 story is 'TACO once, tiny numbers forever'; " +
      "envelope bloat here breaks the embedded billing");
  });

  it("listen round-trip: server subscribes a topic, page events stream back through the return route", async function () {
    const received = [];
    await start(function (client) {
      client.listen("bw:lifecycle", function (data) { received.push(data); });
    });
    const conn = await sse(P, "/bw/events/lst");
    await waitUntil(function () {
      return conn.events.some(function (m) { return m.type === "listen"; });
    }, "listen verb sent to client");
    // simulate the client side forwarding a topic event (package 06 proves the
    // client half; this proves the server half receives and dispatches it)
    await post(P, "/bw/return/topic/lst",
      { v: 1, type: "topic", topic: "bw:lifecycle", data: { event: "mount", type: "sensor-card" } });
    await waitUntil(function () { return received.length >= 1; }, "server-side topic handler");
    conn.destroy();
    assert.strictEqual(received[0].event, "mount",
      "remote observability is core billing — listen is tested as hard as mount and patch");
  });
});

describe("12.3 act round-trip — the §5.4 payload reaches client.on (charter A4)", function () {
  it("server handler receives {action, value, name, form, ref}, not the 2.0.x {action, data}", async function () {
    let received = null;
    await start(function (client) {
      client.on("save_doc", function (payload) { received = payload; });
    });
    const conn = await sse(P, "/bw/events/act1");
    await waitUntil(function () { return app.clientCount === 1; }, "action client connected");
    await post(P, "/bw/return/action/act1",
      { v: 1, type: "event", action: "save_doc", value: "v", name: "title", form: { title: "v" }, ref: "doc1" });
    await waitUntil(function () { return received !== null; }, "action payload dispatch");
    conn.destroy();
    assert.ok(received, "handler fired");
    assert.strictEqual(received.value, "v");
    assert.strictEqual(received.ref, "doc1");
    assert.deepStrictEqual(received.form, { title: "v" }, "form payload intact end to end");
  });
});
