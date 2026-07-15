/**
 * Shared harness for the 2.1 spec suite. See README.md for conventions.
 * Tests import from here; nothing here asserts — pure plumbing.
 */
import jsdom from "jsdom";
import bw from "../../src/bitwrench.js";
const { JSDOM } = jsdom;

let dom;

export function freshDOM() {
  dom = new JSDOM('<!DOCTYPE html><html><body><div id="app"></div></body></html>');
  global.window = dom.window;
  global.document = dom.window.document;
  global.Element = dom.window.Element;
  global.DocumentFragment = dom.window.DocumentFragment;
  global.HTMLElement = dom.window.HTMLElement;
  global.CustomEvent = dom.window.CustomEvent;
  global.MutationObserver = dom.window.MutationObserver;
  global.FormData = dom.window.FormData;
  // 2.0.x-compat stub; inert once the rAF mounted path is deleted in 2.1.
  global.requestAnimationFrame = function (fn) { return setTimeout(fn, 0); };
  // Re-install action listeners on the new document (actions are ON by default)
  if (bw.actions && typeof bw.actions.enable === "function") bw.actions.enable();
  return dom;
}

/**
 * Reset bitwrench's singleton state between cases.
 *
 * These tests are validating an architecture, not just happy-path DOM output.
 * A real 2.1 implementation must not let one test's topics, detached
 * exemptions, janitor queues, action listeners, remote registrations, CSP
 * nonce, or function-render registry affect the next test. Package 01 asserts
 * that bw._resetForTest exists; this helper calls it when present so the suite
 * can run against today's red 2.0.x engine while still documenting the 2.1
 * isolation contract.
 */
export function resetBWForTest(bw) {
  if (bw && typeof bw._resetForTest === "function") bw._resetForTest();
  if (bw && bw.config) bw.config.cspNonce = null;
}

export function app() { return document.getElementById("app"); }

/** Full component TACO: state + handle + slots + hooks + type. */
export function makeSensorTaco(opts) {
  opts = opts || {};
  return {
    t: "div",
    a: { class: "sensor_card" },
    c: [
      { t: "div", a: { class: "sc_label" }, c: opts.label || "Sensor" },
      { t: "div", a: { class: "sc_value" }, c: "—" }
    ],
    o: {
      type: "sensor-card",
      state: { value: null, log: opts.log || null },
      slots: { label: ".sc_label", value: ".sc_value" },
      handle: {
        update: function (el, d) {
          el._bw_state.value = d.value;
          el.bw.setValue(String(d.value));
        }
      },
      mounted: function (el, state) {
        if (state.log) state.log.push("mounted:" + (opts.name || "x"));
      },
      unmount: function (el, state) {
        if (state.log) state.log.push("unmount:" + (opts.name || "x"));
      }
    }
  };
}

/** Subscribe to bw:diag; returns {codes, stop}. Assert on codes only. */
export function collectDiag(bw) {
  const codes = [];
  const stop = bw.sub("bw:diag", function (d) { codes.push(d.code); });
  return { codes, stop };
}

/** Subscribe to bw:lifecycle; returns {events, stop}. */
export function collectLifecycle(bw) {
  const events = [];
  const stop = bw.sub("bw:lifecycle", function (d) { events.push(d); });
  return { events, stop };
}

/** flush janitor if present (red phase: may not exist yet). */
export function flush(bw) {
  if (bw.janitor && typeof bw.janitor.flush === "function") bw.janitor.flush();
}
