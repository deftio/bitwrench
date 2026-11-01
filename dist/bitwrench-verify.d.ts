/**
 * Type declarations for bitwrench-verify — the TACO checker.
 *
 * A development-time tool, shipped as its own artifact and never bundled into
 * bitwrench core. Nothing in a production page needs it.
 *
 *   import verify from 'bitwrench/verify';
 *   const findings = verify(taco);
 *   if (findings.length) console.table(findings);
 */

/** One thing verify noticed. */
export interface Finding {
  /**
   * `error` means the renderer will not do what the author meant.
   * `warn` means it is legal and verify cannot tell what was intended.
   */
  severity: 'error' | 'warn';
  /** Stable kebab-case code, e.g. `unknown-key`, `attr-typo`, `raw-unsafe`. */
  code: string;
  /** Where in the tree, as a path like `c[2].a` — empty string for the root. */
  path: string;
  /** The offending key, when there is one to name. */
  key?: string;
  /** A suggested correction, when verify is confident enough to offer one. */
  hint?: string;
}

/**
 * Findings, plus a non-enumerable record of what `ignore` hid.
 *
 * `suppressed` and `suppressedCodes` are non-enumerable so that the natural
 * assertion — `assert.deepStrictEqual(verify(taco), [])` — still passes on a
 * clean tree.
 */
export interface Findings extends Array<Finding> {
  /** How many findings `opts.ignore` suppressed. */
  readonly suppressed: number;
  /** Which codes were suppressed, de-duplicated. */
  readonly suppressedCodes: string[];
}

export interface VerifyOptions {
  /**
   * `authored` (default) checks a TACO you wrote by hand.
   * `wire` additionally rejects functions and string `on*` handlers, because
   * neither survives JSON or `bw.apply()`.
   */
  mode?: 'authored' | 'wire';
  /**
   * Finding codes to suppress. Codes only — `'all'` is deliberately not
   * honoured, so a project silences a specific thing, never the tool.
   */
  ignore?: string[];
}

export interface AssertOptions extends VerifyOptions {
  /** Also fail on warnings, not just errors. */
  strict?: boolean;
}

/**
 * Check a TACO, an array of them, or anything you would pass to `bw.mount()`.
 * Never throws and never mutates the input.
 */
declare function verify(input: unknown, opts?: VerifyOptions): Findings;

declare namespace verify {
  /** Like `verify()`, but throws when there is anything fatal. For tests. */
  function assert(input: unknown, opts?: AssertOptions): true;
}

export { verify };
export default verify;

declare global {
  interface Window {
    /** Set when bitwrench-verify is loaded via a script tag. */
    bwv?: { verify: typeof verify };
  }
}
