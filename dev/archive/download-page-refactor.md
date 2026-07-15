# Downloads Page Refactor + Self-Extracting Embedded Bundle

Status: DESIGN
Date: 2026-03-28
Author: Manu Chatterjee + Claude

## Problem

1. The current downloads page (09-downloads.html) doesn't explain what
   bitwrench ships (core vs add-ons vs server tools). New users don't
   know what they're looking at.

2. Embedded/IoT devs see 150KB for bitwrench.umd.min.js and think "too
   fat." The .gz is 40KB but serving it requires Content-Encoding: gzip
   header support in the server. Raw socket servers (C, POSIX) can't do
   that without extra code.

3. Embedded boilerplate (starter HTML, server shims) is scattered in
   examples/ and not part of the build. Users assemble it manually.

## Solution: Two Parts

### Part 1: Downloads Page Restructure

New page order:

```
Page Header: "Downloads"
  Bitwrench ships as a core library (TACO engine, router, 47 BCCL
  components, color utils, state management) plus server-side tools
  and optional add-ons.

Section 1: Bitwrench Full Library
  "Available via npm, CDN, GitHub, and direct download."

  Quickest Way to Start
    CDN <script> tag with Copy button
    "Or npm install bitwrench"
    "Or download files directly" (anchor to table)
    Link to LLM guide (.md download)
    TOC pills (labeled "Jump to:" so users know they're links)

  Downloads Table (all full-library builds)
    Groups like items together:
      UMD:  bitwrench.umd.js, .umd.min.js, .umd.min.js.gz
      ESM:  bitwrench.esm.js, .esm.min.js, .esm.min.js.gz
      CJS:  bitwrench.cjs.js, .cjs.min.js, .cjs.min.js.gz
      ES5:  bitwrench.es5.js, .es5.min.js, .es5.min.js.gz
      CSS:  bitwrench.css, bitwrench.min.css

    Columns: Filename (link) | Format | SRI | Size (KB) | Usage
    SRI column: Copy button that copies full <script integrity="..."> tag
    Each row is a double-height row:
      Top: filename, format, size, usage
      Bottom (muted): SRI hash with Copy button
    Usage column: brief text (e.g., "Browser <script> tag", "import bw
    from 'bitwrench'", "Pre-gzipped for embedded/SPIFFS")

  "Not sure which format to use?" (expandable/collapsible)
    UMD: Universal. Works in browsers (<script>), Node.js (require),
         and AMD loaders. Adds `bw` to global scope. Use this if unsure.
    ESM: ES Modules. Use with `import` in modern browsers or bundlers
         (Vite, Rollup, webpack). Supports tree-shaking.
    CJS: CommonJS. Use with `require()` in Node.js scripts and older
         bundlers.
    ES5: Transpiled to ES5 syntax. For legacy browsers (IE10+) and
         older webviews (Android 4.x, older Electron).
    .gz: Pre-gzipped. Same JS, smaller on disk. Server must send
         Content-Encoding: gzip header. See Embedded section.
    CSS: Static stylesheet. Most apps use bw.loadStyles() instead,
         which generates CSS at runtime. Use the file for SSR or
         static HTML pages without JS.

Section 2: Add-ons & Specialized Builds

  Lean Builds (bitwrench without BCCL components)
    Description: Core TACO engine, state management, color utils,
    router -- without the 47 UI components. ~30KB gzipped. Use when
    you only need HTML generation and don't want widget CSS.
    Table: lean UMD/ESM/CJS/ES5 variants (same double-row format)

  BCCL Standalone
    Description: Just the 47 BCCL component factories (makeButton,
    makeTable, makeModal, etc.) without the core engine. For apps
    that load bitwrench-lean separately and want to add components.
    Table: bccl UMD/ESM/CJS variants

  Client/Server Tools
    Description: Server-driven UI (bwserve), CLI tools, debugging,
    and development utilities.

    Table:
      bwserve (ESM, CJS) -- SSE server-driven UI, push TACO from
        Node.js/Python/C/Rust to browser. Link: Protocol docs
      bwcli -- CLI tool: dev server, markdown->HTML, theme presets.
        Installed via npm install bitwrench. Link: CLI docs
      bitwrench-debug -- Browser console toolkit (bwd.tree(),
        bwd.state(), bwd.screenshot()). Link: Debug docs
      bitwrench-code-edit -- Syntax-highlighted editor with line
        numbers, read-only mode, live preview. Link: Editor docs
      bitwrench-util-css -- Tailwind-style utility class parser.
        Link: Util CSS docs
      bitwrench-mcp -- MCP server for AI-assisted development.

    Columns: File (link) | Format | Size | Usage (with doc link)

Section 3: Bitwrench for IoT / Embedded

  Description: Bitwrench runs on any device that can serve HTTP.
  The full library is 40KB gzipped -- fits easily on ESP32 SPIFFS,
  Pico W flash, or any microcontroller with a few hundred KB storage.

  Four Ways to Load Bitwrench on Embedded (decision table)

    | Option | File(s) | Flash | Server Needs | Browser | Sync |
    |--------|---------|-------|-------------|---------|------|
    | Smallest | starter-compeko.html | ~40KB | Static serve | Chrome 80+ | async |
    | Universal | starter-selfextract.html | ~56KB | Static serve | Any (IE11+) | sync |
    | Two-file | starter-local.html + .gz | ~41KB | Content-Encoding | Any | sync |
    | CDN | starter-cdn.html | ~1KB | Internet | Any | sync |

    Explanation of each option (see Part 2 below for technical details):

    Smallest (compeko-style, ~40KB):
      Single HTML file. Raw DEFLATE bytes embedded in the page.
      Browser's native DecompressionStream decompresses at load time.
      Zero encoding overhead, zero decompressor code. Async -- app
      code must use a callback or await. Requires Chrome 80+,
      Firefox 113+, Safari 16.4+. All ESP32/Pico W webviews qualify.

    Universal (tiny-inflate + base64, ~56KB):
      Single HTML file. DEFLATE-compressed bitwrench encoded as
      base64, with a 3KB inline decompressor. Synchronous -- bw is
      available immediately after the script tag. Works in every
      browser including IE11. 16KB larger than compeko but zero
      async complexity.

    Two-file (.gz + Content-Encoding, ~41KB):
      HTML page loads /bitwrench.umd.min.js via normal <script> tag.
      Server stores the .gz file (40KB) and sends it with
      Content-Encoding: gzip header. Browser decompresses
      transparently. Smallest wire transfer. Requires server support:
      ESPAsyncWebServer (automatic), bwserve.py (automatic),
      nginx (gzip_static on;), raw C (manual header).

    CDN (~1KB on flash):
      HTML page loads bitwrench from unpkg or jsdelivr. No local JS
      files needed. Requires internet connectivity.

  How .gz Serving Works (callout box)
    Your HTML references the normal filename:
      <script src="/bitwrench.umd.min.js"></script>
    Your server stores the .gz file (40KB) and sends it with
    Content-Encoding: gzip header. The browser decompresses
    transparently. The 150KB uncompressed size is only in browser
    memory -- browsers handle megabytes of JS routinely.

    Troubleshooting: Getting a SyntaxError in console? Your server
    is sending .gz bytes without the Content-Encoding header. See
    platform guides below.

  Embedded Downloads Table
    starter-compeko.html          | ~40KB | Smallest single-file (async, Chrome 80+)
    starter-selfextract.html      | ~56KB | Universal single-file (sync, any browser)
    starter-cdn.html              | ~1KB  | Loads from CDN (needs internet)
    starter-local.html            | ~1KB  | Loads .gz from local server
    bitwrench.umd.min.js.gz      | 40KB  | Pre-gzipped library (needs Content-Encoding)
    bitwrench.umd.min.self.js    | 56KB  | Self-extracting JS (for <script src>)
    bwserve.py                    | ~5KB  | Python server (CPython/MicroPython/CircuitPython)
    bitwrench.h                   | ~3KB  | C/C++ TACO helpers (header-only)
    bwserve.h                     | ~4KB  | C/C++ bwserve protocol macros (header-only)

  Platform Quick Starts (one per platform)
    ESP32 (Arduino / ESPAsyncWebServer)
      .gz serving is automatic. 3 steps: copy .gz, reference .js
      name in HTML, upload to SPIFFS. Link: full ESP32 guide.

    MicroPython / CircuitPython
      bwserve.py handles .gz serving. Copy bwserve.py + .gz to
      board. Link: full Python guide.

    Raspberry Pi (Linux)
      nginx: gzip_static on; or use bwserve.py/Node.js.
      Link: full RPi guide.

    Raw C / POSIX Sockets
      Use starter-compeko.html or starter-selfextract.html (no
      Content-Encoding needed). Or add Content-Encoding: gzip
      header manually (snippet provided). Link: cmake-demo.

  Platform Compatibility Matrix (existing table, kept)

  Example Dashboards (existing links, kept)

Section 4: All Downloads (sortable reference table)
  Every dist file in one table. Click headers to sort.
  Replaces the old "All Builds" and "SRI Hashes" sections.
  Columns: Package (badge) | File (link) | Format | Size | Transfer | SRI
```

### Part 2: Compression Benchmark Results

We benchmarked 13 approaches for creating a self-extracting bitwrench
bundle. The benchmark script is dev/explore-compression.js.

Source: bitwrench.umd.min.js (148.8 KB)

```
Approach                               | Total    | Ratio  | Sync | Browser
---------------------------------------+----------+--------+------+-----------
tiny-inflate + base64                  | 55.9 KB  | 37.5%  | yes  | IE11+
tiny-inflate + ascii85                 | 53.0 KB  | 35.6%  | yes  | IE11+
tiny-inflate + Latin-1                 | 53.1 KB  | 35.7%  | yes  | IE11+
tiny-inflate + UTF-16 (chars)          | 23.8 KB  | 16.0%  | yes  | IE11+ (*)
tiny-inflate + UTF-16 (UTF-8 file)     | 64.1 KB  | 43.0%  | yes  | IE11+
compeko (fetch-self, async)            | 39.8 KB  | 26.7%  | no   | Chrome 80+
fflate + base64                        | 56.0 KB  | 37.6%  | yes  | IE11+
fflate (own compress) + base64         | 57.7 KB  | 38.8%  | yes  | IE11+
lz-string compressToBase64             | 90.3 KB  | 60.7%  | yes  | IE11+
lz-string compressToUTF16              | 73.3 KB  | 49.2%  | yes  | IE11+
pako inflateRaw + base64               | 67.5 KB  | 45.3%  | yes  | IE11+
DecompressionStream + base64 (async)   | 53.1 KB  | 35.7%  | no   | Chrome 80+
No compression (base64 only)           | 198.6 KB | 133.5% | yes  | IE11+
.gz file (server Content-Encoding)     | 39.6 KB  | 26.6%  | yes  | All

(*) UTF-16 char count is misleading -- in a UTF-8 .js file, each
    high-code-point char takes 3 bytes, making it WORSE than base64.
```

#### Key Findings

1. DEFLATE (zlib level 9) is the best compressor for JS source code.
   lz-string is 1.5-2x worse.

2. The encoding is where the real size difference lives:
   - base64: 33% overhead (53KB encoded from 40KB compressed)
   - ascii85: 25% overhead (50KB)
   - Latin-1: ~26% overhead (50KB) with 10,515 escape sequences
   - UTF-16: TRAP -- looks great in chars but 3 bytes per char in UTF-8
   - Raw binary (compeko): 0% overhead (40KB)

3. ascii85 and Latin-1 save ~3KB over base64 but need custom decoders
   and have edge cases with special characters in JS strings.

4. compeko is the clear winner for HTML files: zero encoding overhead,
   zero decompressor code. But it's async and needs modern browsers.

#### Chosen Approaches

We ship TWO self-extracting variants to cover all use cases:

**A. compeko-style (starter-compeko.html, ~40KB)**
For embedded devices with modern browsers (Chrome 80+). Smallest
possible single file. Async loading -- app code goes in a callback.

How it works:
- Raw DEFLATE bytes are appended directly after an HTML/SVG header
- SVG onload does fetch('#') to read the file's own raw bytes
- slice() past the header to get the compressed payload
- Pipe through browser's native DecompressionStream('deflate-raw')
- eval() the decompressed JavaScript
- Header is ~160 bytes. No encoding. No decompressor code.

Why it works as HTML:
- Browser's HTML parser sees <svg onload="..."> and executes the JS
- Binary bytes after the closing > are ignored by HTML parser
- fetch('#') reads the raw file bytes including the binary data
- Requires HTTP (not file://) due to fetch CORS

Ref: https://gist.github.com/0b5vr/09ee96ca2efbe5bf9d64dad7220e923b

**B. tiny-inflate + base64 (bitwrench.umd.min.self.js, ~56KB)**
For any browser, synchronous loading. Can be used as:
- <script src="bitwrench.umd.min.self.js"></script>
- Inlined in starter-selfextract.html

How it works:
- tiny-inflate (~3KB minified) is inlined in the IIFE
- bitwrench source is DEFLATE-compressed and base64-encoded
- At load time: atob() -> Uint8Array -> inflate() -> script inject
- All synchronous. bw.* available on next line.

Why base64 over ascii85/Latin-1:
- atob() is built into every browser -- zero decoder code
- 3KB larger than ascii85 but zero edge cases
- Latin-1 requires charset declaration and has 10K+ escape sequences
- Simplicity wins for a build artifact that must work everywhere

### Part 3: Build Script (tools/build-embedded-dist.js)

#### Self-Extracting JS Bundle

```
Input:  dist/bitwrench.umd.min.js (150KB)
Output: dist/bitwrench.umd.min.self.js (~56KB)

Steps:
1. Read dist/bitwrench.umd.min.js as Buffer
2. Compress with zlib.deflateRawSync() (RFC 1951, NOT gzip)
3. Base64-encode the compressed bytes
4. Generate self-extracting wrapper:

   (function() {
     // tiny-inflate v1.0.3 (MIT, github.com/foliojs/tiny-inflate)
     // SHA256: <hash> | Copied: <date>
     <TINY_INFLATE_SOURCE>

     // Compressed bitwrench v{{VERSION}} (base64-encoded raw DEFLATE)
     var B64 = '<BASE64_DATA>';

     // Decode base64 to Uint8Array
     var bin = atob(B64);
     var compressed = new Uint8Array(bin.length);
     for (var i = 0; i < bin.length; i++)
       compressed[i] = bin.charCodeAt(i);

     // Inflate (synchronous)
     var decompressed = new Uint8Array({{ORIGINAL_SIZE}});
     inflate(compressed, decompressed);

     // Inject as script
     var src = new TextDecoder().decode(decompressed);
     var s = document.createElement('script');
     s.textContent = src;
     document.head.appendChild(s);
   })();

5. Write to dist/bitwrench.umd.min.self.js
6. Log: original size, compressed size, self-extracting size, ratio
```

#### Compeko-Style HTML Bundle

```
Input:  dist/bitwrench.umd.min.js (150KB)
Output: dist/embedded/starter-compeko.html (~40KB)

Steps:
1. Read dist/bitwrench.umd.min.js as Buffer
2. Compress with zlib.deflateRawSync() (RFC 1951, level 9)
3. Generate HTML header (adapt compeko's SVG approach):

   <!DOCTYPE html>
   <html><head><meta charset="UTF-8">
   <title>bitwrench v{{VERSION}}</title></head>
   <body><div id="app"></div>
   <svg onload="fetch(location.href).then(t=>t.arrayBuffer()).then(t=>{
     var b=new Uint8Array(t).slice({{HEADER_SIZE}});
     new Response(new Blob([b]).stream().pipeThrough(
       new DecompressionStream('deflate-raw'))).text().then(function(src){
         var s=document.createElement('script');
         s.textContent=src;
         document.head.appendChild(s);
         // User app code runs here:
         if(typeof bwReady==='function')bwReady();
       });
   })"></svg>

4. Concatenate: header bytes + raw DEFLATE bytes
5. Write to dist/embedded/starter-compeko.html
6. Log sizes
```

Note: We use fetch(location.href) instead of fetch`#` for clarity.
The user's app code can define a global bwReady() function or use
a DOMContentLoaded-style pattern.

#### Starter Templates

**starter-selfextract.html** (~56KB)
- Contains bitwrench.umd.min.self.js inline in a <script> tag
- bw available synchronously after the script
- Comments explain what it is

**starter-local.html** (~1KB)
- <script src="/bitwrench.umd.min.js"></script>
- Comments explain .gz serving and Content-Encoding requirement

**starter-cdn.html** (~1KB)
- <script src="https://unpkg.com/bitwrench@{{VERSION}}/dist/bitwrench.umd.min.js"></script>
- Version-pinned to current release

#### Platform Server Shims

Copied (not generated) by build-embedded-dist.js to dist/embedded/:

- bwserve.py -- from embedded_python/bwserve.py
- bitwrench.h -- from embedded_c/bitwrench.h
- bwserve.h -- from embedded_c/bwserve.h

These are copies, not transforms. The build script just copies them
so they ship with npm install and are downloadable from the page.

#### tiny-inflate Maintenance

The tiny-inflate source is inlined as a string constant in
tools/build-embedded-dist.js. It is NOT installed via npm.

Why inline:
- 3KB, stable, hasn't changed meaningfully in years
- Zero dependency management
- Build script is self-contained
- No node_modules resolution at build time

Source of truth:
- GitHub: https://github.com/foliojs/tiny-inflate
- npm: tiny-inflate (MIT license)
- Version inlined: document in build script comment with version,
  date copied, and SHA256 of the original source file

To update (if ever needed):
1. Download new version from GitHub
2. Minify if not already minified
3. Replace the TINY_INFLATE_SOURCE constant in build-embedded-dist.js
4. Update the version/date/SHA256 comment
5. Run tests (see below) to verify decompression still works
6. Rebuild: npm run build

### Part 4: Build Integration

#### New npm Scripts

```json
"build:embedded": "node tools/build-embedded-dist.js"
```

Added to the build chain in the `build` script, after build:metrics:

```json
"build": "rollup --config && npm run build:css && npm run build:metrics && npm run build:embedded && npm run build:builds"
```

Order matters: build:embedded needs dist/bitwrench.umd.min.js to exist.
build:builds runs last because it catalogs dist/ contents.

#### package.json files Array

Add to ship with npm install:

```json
"files": [
  "dist/*.js",
  "dist/*.js.gz",
  "dist/*.css",
  "dist/*.json",
  "dist/*.d.ts",
  "dist/embedded/",
  "bin/",
  "src/",
  "docs/",
  "README.md",
  "LICENSE.txt"
]
```

#### Output Files

```
dist/
  bitwrench.umd.min.self.js       ~56KB  (self-extracting JS bundle)
  embedded/
    starter-compeko.html           ~40KB  (smallest, async, Chrome 80+)
    starter-selfextract.html       ~56KB  (universal, sync, any browser)
    starter-cdn.html               ~1KB   (loads from CDN)
    starter-local.html             ~1KB   (loads .gz locally)
    bwserve.py                     ~5KB   (copy of embedded_python/bwserve.py)
    bitwrench.h                    ~3KB   (copy of embedded_c/bitwrench.h)
    bwserve.h                      ~4KB   (copy of embedded_c/bwserve.h)
```

### Part 5: Testing

#### Self-Extracting Bundle Tests (test/bitwrench_test_self_extract.js)

These tests run as part of `npm test` and verify the self-extracting
bundles work correctly for every release.

```
Test 1: Self-extracting JS bundle exists and is reasonable size
  - dist/bitwrench.umd.min.self.js exists
  - Size is between 40KB and 70KB (sanity bounds)
  - Size is less than dist/bitwrench.umd.min.js (compression worked)

Test 2: Self-extracting JS decompresses to exact original
  - Extract the base64 data from the self-extracting bundle
  - Inflate using the same tiny-inflate code
  - Compare byte-for-byte with dist/bitwrench.umd.min.js
  - SHA256 of decompressed must match SHA256 of original

Test 3: Self-extracting JS executes and produces working bw object
  - Load bundle in jsdom
  - Verify typeof bw === 'object'
  - Verify bw.version matches package.json version
  - Verify bw.html({t:'div',c:'test'}) produces '<div>test</div>'
  - Verify bw.makeButton exists (BCCL loaded)

Test 4: Self-extracting JS is synchronous
  - In jsdom, load the self-extracting bundle via <script>
  - Immediately after (same tick), access bw.version
  - Must not be undefined (proves synchronous execution)

Test 5: Compeko HTML exists and has correct structure
  - dist/embedded/starter-compeko.html exists
  - Size is between 35KB and 55KB
  - Starts with valid HTML (<!DOCTYPE or <svg or <html)
  - Contains DecompressionStream reference
  - Binary payload follows header

Test 6: Compeko HTML decompresses to exact original
  - Extract binary payload (everything after header)
  - Inflate with zlib.inflateRawSync()
  - Compare byte-for-byte with dist/bitwrench.umd.min.js
  - SHA256 must match

Test 7: Starter templates are valid HTML
  - Each starter-*.html exists in dist/embedded/
  - Each parses as valid HTML (no unclosed tags)
  - starter-cdn.html contains current version number
  - starter-selfextract.html contains the self-extracting code
  - starter-local.html references bitwrench.umd.min.js (not .gz)

Test 8: Server shim copies match sources
  - dist/embedded/bwserve.py is byte-identical to
    embedded_python/bwserve.py
  - dist/embedded/bitwrench.h is byte-identical to
    embedded_c/bitwrench.h
  - dist/embedded/bwserve.h is byte-identical to
    embedded_c/bwserve.h

Test 9: Compression ratios are stable
  - self.js size / original size ratio is between 0.30 and 0.45
  - compeko size / original size ratio is between 0.20 and 0.35
  - If ratios change significantly, something is wrong
  - Log ratios for tracking across releases
```

#### What These Tests Catch

- Broken tiny-inflate (test 2, 3)
- Broken compeko decompression (test 6)
- Build script regression (test 1, 2, 5, 6)
- Version mismatch after bump (test 3, 7)
- Async regression if someone changes the self.js wrapper (test 4)
- Stale shim copies (test 8)
- Unexpected size bloat (test 9)

### Part 6: Downloads Page Implementation Notes

#### Double-Row Table Format

Each file in the downloads tables renders as two rows:

```
Row 1 (normal):
  bitwrench.umd.min.js  |  UMD  |  148.8 KB  |  40.7 KB  |  Browser <script> tag

Row 2 (muted, smaller font, no top border):
  sha384-abc123...  [Copy Tag]
```

The Copy Tag button copies the full tag with integrity attribute:
```html
<script src="dist/bitwrench.umd.min.js"
  integrity="sha384-abc123..."
  crossorigin="anonymous"></script>
```

Files without SRI (non-minified, .gz) show a single row only.

#### Grouping

Within each table, files are grouped by base name:
  bitwrench.umd.js        (development, unminified)
  bitwrench.umd.min.js    (production)
  bitwrench.umd.min.js.gz (pre-gzipped for embedded)

Visual separator (thin line or extra spacing) between groups
(UMD group, ESM group, CJS group, ES5 group, CSS group).

#### Format Explainer Dropdown

"Not sure which format to use?" expands to show:
- UMD, ESM, CJS, ES5, .gz, CSS explanations
- Format only -- not build variants (lean/bccl covered in Add-ons)
- Collapsed by default to keep the page clean
- Implemented with makeAccordion or a simple toggle

## Execution Order

1. Build script: tools/build-embedded-dist.js
   - Inline tiny-inflate, generate self-extracting JS bundle
   - Generate compeko-style HTML bundle
   - Generate starter HTML templates
   - Copy server shims
2. Tests: test/bitwrench_test_self_extract.js
   - All 9 test groups
3. Build integration: package.json changes
   - New script, build chain update, files array
4. Downloads page: pages/09-downloads.html
   - Full rewrite per Section structure above
5. shared-nav.js: Update link from 09-builds.html to 09-downloads.html

## References

- Compression of JavaScript programs (Bits'n'Bites):
  https://www.bitsnbites.eu/compression-of-javascript-programs/
- compeko (self-extracting html+deflate):
  https://gist.github.com/0b5vr/09ee96ca2efbe5bf9d64dad7220e923b
- Space-efficient embedding of WebAssembly (PNG trick):
  https://mpetroff.net/2021/02/space-efficient-embedding-of-webassembly-in-javascript/
- CrunchMe (Latin-1/UTF-16 JS compression):
  https://crunchme.bitsnbites.eu/
- tiny-inflate (MIT, DEFLATE decompressor):
  https://github.com/foliojs/tiny-inflate
- Benchmark script: dev/explore-compression.js

## Open Questions

None -- ready to implement.
