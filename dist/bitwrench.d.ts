/**
 * Bitwrench -- TypeScript declarations
 *
 * Auto-generated for bitwrench v2.0.21+.
 * TACO format: {t, a, c, o} -- Tag, Attributes, Content, Options.
 *
 * @license BSD-2-Clause
 */

// ---------------------------------------------------------------------------
// Core types
// ---------------------------------------------------------------------------

/** Content that can appear inside a TACO `c` field. */
export type TacoContent = string | number | boolean | null | undefined | Taco | RawString | TacoContent[];

/** A raw (pre-escaped) HTML string returned by bw.raw(). */
export interface RawString {
  __bwRaw: true;
  value: string;
}

/** TACO object -- Tag, Attributes, Content, Options. */
export interface Taco {
  /** HTML tag name (e.g. 'div', 'span', 'section'). */
  t?: string;
  /** HTML attributes (class, id, style, event handlers, etc.). */
  a?: Record<string, any>;
  /** Content: string, nested TACO, or array of content. */
  c?: TacoContent;
  /** Options: lifecycle hooks, state, handles, slots, render. */
  o?: TacoOptions;
}

/** Options object for TACO `o` field. */
export interface TacoOptions {
  /** Lifecycle hook: called after element is created and mounted. */
  mounted?: (el: HTMLElement) => void;
  /** Lifecycle hook: called before element is removed. */
  unmount?: (el: HTMLElement) => void;
  /** Component state object. */
  state?: Record<string, any>;
  /** Re-render function: called on statechange event. */
  render?: (el: HTMLElement, state: Record<string, any>) => Taco | TacoContent;
  /** Imperative methods attached to el.bw. Each fn receives (el, ...args). */
  handle?: Record<string, (el: HTMLElement, ...args: any[]) => any>;
  /** Slot selectors: {name: '.selector'} auto-generates el.bw.setName()/getName(). */
  slots?: Record<string, string>;
  /** Component type identifier (used internally by BCCL). */
  type?: string;
  [key: string]: any;
}

// ---------------------------------------------------------------------------
// Style/Theme types
// ---------------------------------------------------------------------------

/** Seed colors for theme generation. */
export interface StyleConfig {
  primary?: string;
  secondary?: string;
  tertiary?: string;
  success?: string;
  danger?: string;
  warning?: string;
  info?: string;
  light?: string;
  dark?: string;
  background?: string;
  surface?: string;
  surfaceAlt?: string;
  spacing?: string | Record<string, string>;
  radius?: string | Record<string, string>;
  typeRatio?: string | number;
  elevation?: string;
  motion?: string;
  [key: string]: any;
}

/** Eight shade variants derived from a single color. */
export interface ShadeSet {
  base: string;
  hover: string;
  active: string;
  light: string;
  darkText: string;
  border: string;
  focus: string;
  textOn: string;
}

/** Full palette derived from seed colors. */
export interface Palette {
  primary: ShadeSet;
  secondary: ShadeSet;
  tertiary: ShadeSet;
  success: ShadeSet;
  danger: ShadeSet;
  warning: ShadeSet;
  info: ShadeSet;
  light: ShadeSet;
  dark: ShadeSet;
  /** Plain string (not ShadeSet). */
  background: string;
  /** Plain string (not ShadeSet). */
  surface: string;
  /** Plain string (not ShadeSet). */
  surfaceAlt: string;
}

/** Result of bw.makeStyles(). */
export interface Styles {
  css: string;
  alternateCss: string;
  palette: Palette;
  alternatePalette: Palette;
  rules: Record<string, Record<string, string>>;
  alternateRules: Record<string, Record<string, string>>;
  isLightPrimary: boolean;
}

// ---------------------------------------------------------------------------
// Router types
// ---------------------------------------------------------------------------

/** Route handler: receives params, returns TACO or void. */
export type RouteHandler = (params: Record<string, any>) => Taco | TacoContent | void;

/** Router configuration. */
export interface RouterConfig {
  /** Route map: path pattern -> handler. Supports :params and * wildcards. */
  routes: Record<string, RouteHandler>;
  /** Routing mode: 'hash' (default) or 'history'. */
  mode?: 'hash' | 'history';
  /** Base path for history mode. */
  base?: string;
  /** CSS selector or element to mount route output into. */
  target?: string | HTMLElement;
  /** Before-navigation guard. Return false to cancel, string to redirect. */
  before?: (to: string, from: string) => boolean | string | void;
  /** After-navigation hook. */
  after?: (to: string, from: string) => void;
}

/** Active router instance returned by bw.router(). */
export interface RouterInstance {
  /** Navigate to a path. */
  navigate(path: string, opts?: { replace?: boolean }): void;
  /** Get current route info. */
  current(): { path: string; params: Record<string, any>; query: Record<string, string> };
  /** Destroy the router and remove event listeners. */
  destroy(): void;
}

// ---------------------------------------------------------------------------
// Version info
// ---------------------------------------------------------------------------

export interface VersionInfo {
  version: string;
  name: string;
  buildDate?: string;
  gitHash?: string;
  [key: string]: any;
}

// ---------------------------------------------------------------------------
// Preset types
// ---------------------------------------------------------------------------

export interface SpacingPreset {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  [key: string]: string;
}

export interface RadiusPreset {
  none: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  pill: string;
  [key: string]: string;
}

// ---------------------------------------------------------------------------
// Main Bw interface
// ---------------------------------------------------------------------------

export interface Bw {
  // ── Core properties ───────────────────────────────────────────────────
  /** Library version string. */
  version: string;
  /** Full version metadata. */
  versionInfo: VersionInfo;
  /** Debug logging toggle. */
  debug: boolean;

  // ── Environment detection ─────────────────────────────────────────────
  /** Returns true if running in Node.js. */
  isNodeJS(): boolean;
  /** True if DOM APIs (document, window) are available. Dynamic getter. */
  readonly _isBrowser: boolean;

  // ── Version ───────────────────────────────────────────────────────────
  /** Returns a copy of build-time version info. */
  getVersion(): VersionInfo;

  // ── Type detection ────────────────────────────────────────────────────
  /** Enhanced typeof: returns 'array', 'null', 'date', 'regexp', etc. */
  typeOf(x: any, baseTypeOnly?: boolean): string;
  /** Alias for typeOf. */
  to(x: any, baseTypeOnly?: boolean): string;

  // ── UUID / Identity ───────────────────────────────────────────────────
  /** Generate a unique identifier string. */
  uuid(prefix?: string): string;
  /** Assign (or retrieve) a UUID on a TACO object. */
  assignUUID(taco: Taco, forceNew?: boolean): Taco;
  /** Extract UUID from a TACO or DOM element. */
  getUUID(tacoOrElement: Taco | HTMLElement): string | null;

  // ── HTML escaping ─────────────────────────────────────────────────────
  /** Escape HTML special characters (including / as &#x2F;). */
  escapeHTML(str: string): string;
  /** Mark a string as pre-escaped HTML (bypasses content escaping). */
  raw(str: string): RawString;

  // ── TACO construction ─────────────────────────────────────────────────
  /** Construct a TACO from positional args. */
  h(tag?: string, attrs?: Record<string, any> | null, content?: TacoContent, options?: TacoOptions): Taco;

  // ── HTML generation ───────────────────────────────────────────────────
  /** Convert TACO to HTML string. */
  html(taco: Taco | TacoContent, options?: { indent?: number; escapeContent?: boolean }): string;
  /** Generate a full HTML page string. */
  htmlPage(opts?: {
    title?: string;
    head?: string | TacoContent;
    body?: string | TacoContent;
    lang?: string;
    charset?: string;
    scripts?: string[];
    styles?: string[];
    meta?: Record<string, string>[];
    [key: string]: any;
  }): string;

  // ── DOM creation & mounting ───────────────────────────────────────────
  /** Create a DOM element from TACO. */
  createDOM(taco: Taco | TacoContent, options?: Record<string, any>): HTMLElement | Text;
  /** Mount TACO to a target selector/element. */
  DOM(target: string | HTMLElement, taco?: Taco | TacoContent, options?: Record<string, any>): HTMLElement;
  /** Mount TACO and return the root element (for el.bw access). */
  mount(target: string | HTMLElement, taco: Taco | TacoContent, options?: Record<string, any>): HTMLElement;
  /** Clean up lifecycle hooks on an element and its children. */
  cleanup(element: HTMLElement): void;

  // ── State & updates ───────────────────────────────────────────────────
  /** Trigger a statechange event on a target. */
  update(target: string | HTMLElement): HTMLElement;
  /** Update content/attributes of an element by ID or UUID. */
  patch(id: string, content?: TacoContent, attr?: Record<string, any>): void;
  /** Batch-update multiple elements. */
  patchAll(patches: Record<string, { c?: TacoContent; a?: Record<string, any> }>): void;

  // ── Events ────────────────────────────────────────────────────────────
  /** Dispatch a custom DOM event. */
  emit(target: string | HTMLElement, eventName: string, detail?: any): void;
  /** Add a DOM event listener. */
  on(target: string | HTMLElement, eventName: string, handler: EventListenerOrEventListenerObject): void;

  // ── Pub/Sub ───────────────────────────────────────────────────────────
  /** Publish to a topic. Returns number of subscribers notified. */
  pub(topic: string, detail?: any): number;
  /** Subscribe to a topic. Returns subscription ID. */
  sub(topic: string, handler: (detail: any) => void, el?: HTMLElement): string;
  /** Unsubscribe from a topic. */
  unsub(topic: string, handler: (detail: any) => void): void;

  // ── Component messaging ───────────────────────────────────────────────
  /** Call el.bw[action](data) on a target element. */
  message(target: string | HTMLElement, action: string, data?: any): void;

  // ── Render / Component registry ───────────────────────────────────────
  /** Render TACO at a position relative to an element. */
  render(element: HTMLElement, position: string, taco: Taco | TacoContent): { el: HTMLElement; destroy: () => void };
  /** Get a registered component handle by ID. */
  getComponent(id: string): Record<string, any> | null;
  /** Get all registered component handles. */
  getAllComponents(): Map<string, Record<string, any>>;

  // ── Function registry ─────────────────────────────────────────────────
  /** Register a function for dispatch by name. Returns name. */
  funcRegister(fn: Function, name?: string): string;
  /** Get a registered function by name. */
  funcGetById(name: string, errFn?: Function): Function | null;
  /** Get a dispatch string for onclick etc. */
  funcGetDispatchStr(name: string, argStr?: string): string;
  /** Unregister a function by name. */
  funcUnregister(name: string): void;
  /** Get the full function registry object. */
  funcGetRegistry(): Record<string, Function>;

  // ── JSON parsing ──────────────────────────────────────────────────────
  /** Flexible JSON parser (single quotes, unquoted keys, trailing commas). */
  parseJSONFlex(str: string): any;

  // ── CSS utilities ─────────────────────────────────────────────────────
  /** Generate CSS string from JS object rules. Supports @media/@keyframes. */
  css(rules: Record<string, Record<string, string> | string>, options?: { indent?: string }): string;
  /** Inject CSS string into document head. Returns the style element. */
  injectCSS(css: string, options?: { id?: string; replace?: boolean }): HTMLStyleElement | null;
  /** Merge style objects (shallow). */
  s(...objects: Record<string, string>[]): Record<string, string>;
  /** Generate responsive CSS with breakpoint media queries. */
  responsive(selector: string, breakpoints: Record<string, Record<string, string>>): string;

  // ── Styles API ────────────────────────────────────────────────────────
  /** Generate styles + palette from seed config. */
  makeStyles(config?: StyleConfig): Styles;
  /** Apply generated styles to the document. */
  applyStyles(styles: Styles, scope?: string): HTMLStyleElement | null;
  /** Generate + apply styles in one call. No args = structural CSS only. */
  loadStyles(config?: StyleConfig, scope?: string): HTMLStyleElement | null;
  /** Inject a CSS reset. */
  loadReset(): HTMLStyleElement | null;
  /** Toggle between primary and alternate palettes. */
  toggleStyles(scope?: string): 'primary' | 'alternate';
  /** Remove injected styles. */
  clearStyles(scope?: string): void;

  // ── Design token presets ──────────────────────────────────────────────
  SPACING_PRESETS: Record<string, SpacingPreset>;
  RADIUS_PRESETS: Record<string, RadiusPreset>;
  TYPE_RATIO_PRESETS: Record<string, number>;
  ELEVATION_PRESETS: Record<string, Record<string, string>>;
  MOTION_PRESETS: Record<string, Record<string, string>>;
  DEFAULT_PALETTE_CONFIG: StyleConfig;
  THEME_PRESETS: Record<string, StyleConfig>;
  /** Generate a modular type scale. */
  generateTypeScale(base?: number, ratio?: number): Record<string, string>;

  // ── Color utilities ───────────────────────────────────────────────────
  /** Convert hex color to [h, s, l]. */
  hexToHsl(hex: string): [number, number, number];
  /** Convert [h, s, l] to hex string. */
  hslToHex(hsl: [number, number, number]): string;
  /** Shift HSL lightness by amount (-100 to 100). */
  adjustLightness(hex: string, amount: number): string;
  /** RGB linear interpolation between two hex colors. */
  mixColor(hex1: string, hex2: string, ratio: number): string;
  /** WCAG 2.0 relative luminance (0-1). */
  relativeLuminance(hex: string): number;
  /** Returns '#fff' or '#000' for best contrast on the given background. */
  textOnColor(hex: string): '#fff' | '#000';
  /** Derive 8 shade variants from a hex color. */
  deriveShades(hex: string): ShadeSet;
  /** Derive full palette from seed config. */
  derivePalette(config: StyleConfig): Palette;
  /** Harmonize a source color toward a target. */
  harmonize(sourceHex: string, targetHex: string, amount?: number): string;
  /** Derive an alternate (dark/light) seed from a hex color. */
  deriveAlternateSeed(hex: string): string;
  /** Derive alternate config from seed config. */
  deriveAlternateConfig(config: StyleConfig): StyleConfig;
  /** Check if a palette config produces a light theme. */
  isLightPalette(config: StyleConfig): boolean;

  // ── Legacy color functions ────────────────────────────────────────────
  /** Parse a CSS color string to [r, g, b, a, type]. */
  colorParse(str: string | number[], defAlpha?: number): [number, number, number, number, string];
  /** Convert RGB to HSL. */
  colorRgbToHsl(r: number | number[], g?: number, b?: number, a?: number, rnd?: number): [number, number, number, number, string];
  /** Convert HSL to RGB. */
  colorHslToRgb(h: number | number[], s?: number, l?: number, a?: number, rnd?: number): [number, number, number, number, string];
  /** Interpolate between colors based on a scalar value. */
  colorInterp(x: number, in0: number, in1: number, colors: string[], stretch?: number): string;

  // ── DOM selection (browser only) ──────────────────────────────────────
  /** Select elements by CSS selector. Always returns an array. */
  $(selector: string | HTMLElement | HTMLElement[]): HTMLElement[];

  // ── Table generation ──────────────────────────────────────────────────
  /** Create a sortable table TACO. */
  makeTable(config: Record<string, any>): Taco;
  /** Create a simple table from array data. */
  makeTableFromArray(config: Record<string, any>): Taco;
  /** Create an enhanced data table. */
  makeDataTable(config: Record<string, any>): Taco;
  /** Create a bar chart TACO. */
  makeBarChart(config: Record<string, any>): Taco;

  // ── Math & utility ────────────────────────────────────────────────────
  /** Map a value from one range to another. */
  mapScale(x: number, in0: number, in1: number, out0: number, out1: number, options?: { clamp?: boolean }): number;
  /** Clamp a value between min and max. */
  clip(value: number, min: number, max: number): number;

  // ── Array utilities ───────────────────────────────────────────────────
  /** Get unique elements of an array. */
  arrayUniq(arr: any[]): any[];
  /** Intersection of arrays a and b. */
  arrayBinA(a: any[], b: any[]): any[];
  /** Elements in b not in a. */
  arrayBNotInA(a: any[], b: any[]): any[];

  // ── Text generation ───────────────────────────────────────────────────
  /** Generate lorem ipsum text of approximately numChars length. */
  loremIpsum(numChars: number): string;
  /** Create a multidimensional array filled with value. */
  multiArray(value: any, dims: number[]): any[];
  /** Dictionary-as-switch: return choices[value] or defaultValue. */
  choice(value: any, choices: Record<string, any>, defaultValue?: any): any;

  // ── Natural sort ──────────────────────────────────────────────────────
  /** Compare strings with natural number ordering. */
  naturalCompare(a: string, b: string): number;

  // ── Timing ────────────────────────────────────────────────────────────
  /** Run fn at interval, stopping after count executions. */
  setIntervalX(fn: Function, delay: number, count: number): number;
  /** Retry test() until true, then call success(); fail after max attempts. */
  repeatUntil(test: () => boolean, success: () => void, fail: () => void, delay?: number, max?: number): void;

  // ── Cookies & URL (browser) ───────────────────────────────────────────
  /** Set a browser cookie. */
  setCookie(cname: string, cvalue: string, exdays?: number, options?: { path?: string; secure?: boolean; sameSite?: string }): void;
  /** Get a browser cookie value. */
  getCookie(cname: string, defaultValue?: string): string;
  /** Get a URL query parameter. */
  getURLParam(key: string, defaultValue?: string): string;

  // ── Clipboard ─────────────────────────────────────────────────────────
  /** Copy text to clipboard. */
  copyToClipboard(text: string): Promise<boolean>;

  // ── File I/O ──────────────────────────────────────────────────────────
  /** Save data to a file (Node: fs.writeFile, browser: download link). */
  saveClientFile(fname: string, data: any): void;
  /** Save data as a formatted JSON file. */
  saveClientJSON(fname: string, data: any): void;
  /** Load a file by path (Node) or URL (browser). */
  loadClientFile(fname: string, callback: (data: any, error: Error | null) => void, options?: { parser?: 'raw' | 'JSON' }): string;
  /** Load a JSON file by path/URL. */
  loadClientJSON(fname: string, callback: (data: any, error: Error | null) => void): string;
  /** Prompt user to pick a local file (browser only). */
  loadLocalFile(callback: (data: any, filename: string, error: Error | null) => void, options?: { accept?: string; parser?: 'raw' | 'JSON' }): void;
  /** Prompt user to pick a local JSON file (browser only). */
  loadLocalJSON(callback: (data: any, filename: string, error: Error | null) => void): void;

  // ── Router ────────────────────────────────────────────────────────────
  /** Create a client-side router. */
  router(config: RouterConfig): RouterInstance;
  /** Navigate to a path (requires active router). */
  navigate(path: string, opts?: { replace?: boolean }): void;
  /** Create a TACO link element that uses router navigation. */
  link(path: string, content: TacoContent, attrs?: Record<string, any>): Taco;

  // ── Server protocol (internal) ────────────────────────────────────────
  /** Apply a bwserve protocol message. */
  apply(msg: Record<string, any>): void;
  /** Inspect a DOM element for bwserve. */
  inspect(target: string | HTMLElement): Record<string, any>;

  // ── Component factory ─────────────────────────────────────────────────
  /** Create a BCCL component by type name. */
  make(type: string, props?: Record<string, any>): Taco;
  /** Component type registry. */
  BCCL: Record<string, { make: (props: Record<string, any>) => Taco }>;
  /** Convert variant name to CSS class string. */
  variantClass(variant: string): string;

  // ── BCCL component builders ───────────────────────────────────────────
  // All accept a props/config object and return a TACO.

  // Layout
  makeContainer(props?: Record<string, any>): Taco;
  makeRow(props?: Record<string, any>): Taco;
  makeCol(props?: Record<string, any>): Taco;
  makeStack(props?: Record<string, any>): Taco;
  makeSection(props?: Record<string, any>): Taco;

  // Visual
  makeCard(props?: Record<string, any>): Taco;
  makeButton(props?: Record<string, any>): Taco;
  makeAlert(props?: Record<string, any>): Taco;
  makeBadge(props?: Record<string, any>): Taco;
  makeSpinner(props?: Record<string, any>): Taco;
  makeSkeleton(props?: Record<string, any>): Taco;
  makeAvatar(props?: Record<string, any>): Taco;

  // Navigation
  makeNav(props?: Record<string, any>): Taco;
  makeNavbar(props?: Record<string, any>): Taco;
  makeBreadcrumb(props?: Record<string, any>): Taco;
  makePagination(props?: Record<string, any>): Taco;

  // Forms
  makeForm(props?: Record<string, any>): Taco;
  makeFormGroup(props?: Record<string, any>): Taco;
  makeInput(props?: Record<string, any>): Taco;
  makeTextarea(props?: Record<string, any>): Taco;
  makeSelect(props?: Record<string, any>): Taco;
  makeCheckbox(props?: Record<string, any>): Taco;
  makeRadio(props?: Record<string, any>): Taco;
  makeFileUpload(props?: Record<string, any>): Taco;
  makeRange(props?: Record<string, any>): Taco;
  makeSearchInput(props?: Record<string, any>): Taco;
  makeChipInput(props?: Record<string, any>): Taco;

  // Interactive
  makeTabs(props?: Record<string, any>): Taco;
  makeAccordion(props?: Record<string, any>): Taco;
  makeCarousel(props?: Record<string, any>): Taco;
  makeModal(props?: Record<string, any>): Taco;
  makeDropdown(props?: Record<string, any>): Taco;
  makeToast(props?: Record<string, any>): Taco;
  makeTooltip(props?: Record<string, any>): Taco;
  makePopover(props?: Record<string, any>): Taco;
  makeSwitch(props?: Record<string, any>): Taco;

  // Data display
  makeListGroup(props?: Record<string, any>): Taco;
  makeProgress(props?: Record<string, any>): Taco;
  makeStatCard(props?: Record<string, any>): Taco;
  makeMediaObject(props?: Record<string, any>): Taco;
  makeTimeline(props?: Record<string, any>): Taco;
  makeStepper(props?: Record<string, any>): Taco;

  // Composite
  makeHero(props?: Record<string, any>): Taco;
  makeFeatureGrid(props?: Record<string, any>): Taco;
  makeCTA(props?: Record<string, any>): Taco;
  makeCodeDemo(props?: Record<string, any>): Taco;
  makeButtonGroup(props?: Record<string, any>): Taco;

  // ── Removed APIs (throw Error) ────────────────────────────────────────
  /** @deprecated Removed in v2.0.19. Throws Error. */
  component(...args: any[]): never;
  /** @deprecated Removed in v2.0.19. Throws Error. */
  compile(...args: any[]): never;
  /** @deprecated Removed in v2.0.19. Throws Error. */
  when(...args: any[]): never;
  /** @deprecated Removed in v2.0.19. Throws Error. */
  each(...args: any[]): never;
  /** @deprecated Removed in v2.0.19. Throws Error. */
  compileProps(...args: any[]): never;
  /** @deprecated Removed in v2.0.19. Throws Error. */
  renderComponent(...args: any[]): never;
  /** No-op (kept for backward compatibility). */
  flush(): void;

  // ── Internal (not for public use) ─────────────────────────────────────
  /** @internal */
  _isNode: boolean;
  /** @internal */
  _idCounter: number;
  /** @internal */
  _nodeMap: Record<string, HTMLElement>;
  /** @internal */
  _topics: Record<string, Array<{ handler: Function; id: string }>>;
  /** @internal */
  _el(id: string): HTMLElement | null;
  /** @internal */
  _registerNode(el: HTMLElement, uuid: string): void;
  /** @internal */
  _deregisterNode(el: HTMLElement, uuid: string): void;
  /** @internal */
  _getFs(): Promise<any>;
  /** @internal */
  _parseBindings(str: string): Array<{ path: string; start: number; end: number }>;
  /** @internal */
  _evaluatePath(state: Record<string, any>, path: string): any;
  /** @internal */
  _resolveTemplate(str: string, state: Record<string, any>, compile?: boolean): string;
  /** @internal */
  _router: {
    matchRoute: Function;
    normalizePath: Function;
    parseQuery: Function;
    getActiveRouter: () => RouterInstance | null;
    resetActiveRouter: () => void;
  };
}

// ---------------------------------------------------------------------------
// Default export (UMD/CJS global)
// ---------------------------------------------------------------------------

declare const bw: Bw;
export default bw;

// ---------------------------------------------------------------------------
// Named ESM exports (BCCL components for tree-shaking)
// ---------------------------------------------------------------------------

// Layout
export declare function makeContainer(props?: Record<string, any>): Taco;
export declare function makeRow(props?: Record<string, any>): Taco;
export declare function makeCol(props?: Record<string, any>): Taco;
export declare function makeStack(props?: Record<string, any>): Taco;
export declare function makeSection(props?: Record<string, any>): Taco;

// Visual
export declare function makeCard(props?: Record<string, any>): Taco;
export declare function makeButton(props?: Record<string, any>): Taco;
export declare function makeAlert(props?: Record<string, any>): Taco;
export declare function makeBadge(props?: Record<string, any>): Taco;
export declare function makeSpinner(props?: Record<string, any>): Taco;
export declare function makeSkeleton(props?: Record<string, any>): Taco;
export declare function makeAvatar(props?: Record<string, any>): Taco;

// Navigation
export declare function makeNav(props?: Record<string, any>): Taco;
export declare function makeNavbar(props?: Record<string, any>): Taco;
export declare function makeBreadcrumb(props?: Record<string, any>): Taco;
export declare function makePagination(props?: Record<string, any>): Taco;

// Forms
export declare function makeForm(props?: Record<string, any>): Taco;
export declare function makeFormGroup(props?: Record<string, any>): Taco;
export declare function makeInput(props?: Record<string, any>): Taco;
export declare function makeTextarea(props?: Record<string, any>): Taco;
export declare function makeSelect(props?: Record<string, any>): Taco;
export declare function makeCheckbox(props?: Record<string, any>): Taco;
export declare function makeRadio(props?: Record<string, any>): Taco;
export declare function makeFileUpload(props?: Record<string, any>): Taco;
export declare function makeRange(props?: Record<string, any>): Taco;
export declare function makeSearchInput(props?: Record<string, any>): Taco;
export declare function makeChipInput(props?: Record<string, any>): Taco;

// Interactive
export declare function makeTabs(props?: Record<string, any>): Taco;
export declare function makeAccordion(props?: Record<string, any>): Taco;
export declare function makeCarousel(props?: Record<string, any>): Taco;
export declare function makeModal(props?: Record<string, any>): Taco;
export declare function makeDropdown(props?: Record<string, any>): Taco;
export declare function makeToast(props?: Record<string, any>): Taco;
export declare function makeTooltip(props?: Record<string, any>): Taco;
export declare function makePopover(props?: Record<string, any>): Taco;
export declare function makeSwitch(props?: Record<string, any>): Taco;

// Data display
export declare function makeListGroup(props?: Record<string, any>): Taco;
export declare function makeProgress(props?: Record<string, any>): Taco;
export declare function makeStatCard(props?: Record<string, any>): Taco;
export declare function makeMediaObject(props?: Record<string, any>): Taco;
export declare function makeTimeline(props?: Record<string, any>): Taco;
export declare function makeStepper(props?: Record<string, any>): Taco;

// Composite
export declare function makeHero(props?: Record<string, any>): Taco;
export declare function makeFeatureGrid(props?: Record<string, any>): Taco;
export declare function makeCTA(props?: Record<string, any>): Taco;
export declare function makeCodeDemo(props?: Record<string, any>): Taco;
export declare function makeButtonGroup(props?: Record<string, any>): Taco;

// Factory & registry
export declare function make(type: string, props?: Record<string, any>): Taco;
export declare const BCCL: Record<string, { make: (props: Record<string, any>) => Taco }>;
export declare function variantClass(variant: string): string;
