/**
 * Type declarations for bitwrench/bwserve — server-driven UI over SSE.
 */

import { IncomingMessage, ServerResponse } from 'http';

/** Options for creating a BwServeApp instance. */
export interface BwServeOptions {
  /** Port to listen on (default: 7902) */
  port?: number;
  /** Page title (default: 'bwserve') */
  title?: string;
  /** Directory path for static file serving */
  static?: string;
  /** Auto-inject bitwrench client JS (default: true) */
  injectBitwrench?: boolean;
  /** Theme preset name or config object */
  theme?: string | Record<string, string>;
  /** Enable client.screenshot() (default: false) */
  allowScreenshot?: boolean;
  /** Enable directory listings (default: true) */
  dirList?: boolean;
  /** Host/address to bind to (default: '127.0.0.1') */
  host?: string;
  /** SSE keep-alive interval in ms (default: 15000) */
  keepAliveInterval?: number;
}

/** Options for generateShell(). */
export interface ShellOptions {
  /** Unique client ID for this connection */
  clientId: string;
  /** Page title (default: 'bwserve') */
  title?: string;
  /** Theme preset name or config object */
  theme?: string | Record<string, string>;
  /** Whether to inject bitwrench scripts (default: true) */
  injectBitwrench?: boolean;
}

/** A TACO object — Tag, Attributes, Content, Options. */
export interface Taco {
  t?: string;
  a?: Record<string, any>;
  c?: string | Taco | (string | Taco)[];
  o?: Record<string, any>;
}

/** SSE protocol message. */
export interface BwServeMessage {
  v?: number;
  type?: string;
  ref?: string;
  taco?: Taco;
  [key: string]: any;
}

/** Batch operation entry. */
export interface BatchOp {
  type: string;
  ref?: string;
  taco?: Taco;
  [key: string]: any;
}

/** Server-side client connection — represents one browser tab via SSE. */
export declare class BwServeClient {
  /** bwserve version string */
  static version: string;

  /** Unique client identifier */
  id: string;

  constructor(id: string, res: ServerResponse);

  /** Mount TACO at selector, replacing contents */
  mount(selector: string, taco: Taco): void;

  /** @deprecated Use mount() instead */
  render(selector: string, taco: Taco): void;

  /** Patch element properties without full rebuild */
  patch(ref: string, fields: Record<string, any>): void;

  /** Append TACO as child of target element */
  append(selector: string, taco: Taco): void;

  /** Remove element from DOM with cleanup */
  remove(selector: string): void;

  /** Send array of operations as single batch message */
  batch(ops: BatchOp[]): void;

  /** Dispatch to component's el.bw[action](data) */
  message(ref: string, action: string, data?: any): void;

  /** Call registered or built-in client function */
  call(name: string, ...args: any[]): void;

  /** Subscribe to client topic. Returns this for chaining. */
  listen(topic: string, handler: (data: any) => void): BwServeClient;

  /** Register handler for client action. Returns this for chaining. */
  on(action: string, handler: (data: any, client: BwServeClient) => void): BwServeClient;

  /** Close SSE connection */
  close(): void;
}

/** Main bwserve application — HTTP + SSE server for server-driven UI. */
export declare class BwServeApp {
  port: number;
  title: string;
  staticDir: string | null;
  injectBitwrench: boolean;
  theme: string | Record<string, string> | null;
  allowScreenshot: boolean;
  dirList: boolean;
  host: string;
  keepAliveInterval: number;

  /** Number of active client connections */
  readonly clientCount: number;

  constructor(opts?: BwServeOptions);

  /** Register a page handler. Returns this for chaining. */
  page(path: string, handler: (client: BwServeClient) => void): BwServeApp;

  /** Start HTTP server. Returns Promise that resolves when listening. */
  listen(callback?: () => void): Promise<void>;

  /** Stop server and close all client connections. */
  close(): Promise<void>;

  /** Send protocol message to all clients (or specific client if msg.clientId is set). Returns count of recipients. */
  broadcast(msg: BwServeMessage): number;
}

/** Generate a complete HTML shell document for SSE connection. */
export declare function generateShell(opts?: ShellOptions): string;

/** Create a new BwServeApp instance. */
export declare function create(opts?: BwServeOptions): BwServeApp;

/** bwserve version string */
export declare const version: string;

/** Default export */
declare const bwserve: {
  create: typeof create;
  version: string;
  BwServeApp: typeof BwServeApp;
  BwServeClient: typeof BwServeClient;
  generateShell: typeof generateShell;
};
export default bwserve;
