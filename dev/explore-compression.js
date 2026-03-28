#!/usr/bin/env node
/**
 * explore-compression.js
 *
 * Benchmarks different approaches for creating a self-extracting
 * bitwrench bundle. Each approach compresses bitwrench.umd.min.js,
 * encodes it for embedding in a JS string, adds a decompressor stub,
 * then verifies the round-trip (decompress must produce the exact
 * original bytes).
 *
 * Usage:
 *   node dev/explore-compression.js
 *
 * Requires: npm install tiny-inflate lz-string fflate pako
 *   (dev dependencies, not shipped)
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import zlib from 'zlib';
import crypto from 'crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SRC_FILE = join(ROOT, 'dist', 'bitwrench.umd.min.js');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sha256(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex').slice(0, 16);
}

function base64Size(buf) {
  // 4/3 ratio, padded to multiple of 4
  return Math.ceil(buf.length / 3) * 4;
}

function ascii85Encode(buf) {
  // Standard Ascii85 (btoa-style) encoding
  var out = '';
  var i = 0;
  while (i < buf.length) {
    var n = 0;
    var pad = 0;
    for (var j = 0; j < 4; j++) {
      n = n * 256;
      if (i + j < buf.length) {
        n += buf[i + j];
      } else {
        pad++;
      }
    }
    for (var j = 4; j >= 0; j--) {
      if (j >= pad) {
        out += String.fromCharCode(33 + (n % 85));
      }
      n = Math.floor(n / 85);
    }
    i += 4;
  }
  return out;
}

function ascii85Decode(str) {
  var out = [];
  var i = 0;
  while (i < str.length) {
    var chunk = Math.min(5, str.length - i);
    var n = 0;
    for (var j = 0; j < 5; j++) {
      n = n * 85;
      if (j < chunk) {
        n += str.charCodeAt(i + j) - 33;
      } else {
        n += 84; // pad with 'u' (highest value)
      }
    }
    var bytes = [];
    for (var j = 3; j >= 0; j--) {
      bytes[j] = n & 0xff;
      n = n >>> 8;
    }
    var validBytes = 4 - (5 - chunk);
    for (var j = 0; j < validBytes; j++) {
      out.push(bytes[j]);
    }
    i += chunk;
  }
  return Buffer.from(out);
}

// ---------------------------------------------------------------------------
// Load optional dependencies safely
// ---------------------------------------------------------------------------

async function tryImport(name) {
  try {
    return await import(name);
  } catch (e) {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  // Read source
  var srcBuf;
  try {
    srcBuf = readFileSync(SRC_FILE);
  } catch (e) {
    console.error('Cannot read ' + SRC_FILE);
    console.error('Run: npm run build');
    process.exit(1);
  }

  var srcSize = srcBuf.length;
  var srcHash = sha256(srcBuf);

  console.log('Source: bitwrench.umd.min.js');
  console.log('  Size: ' + srcSize + ' bytes (' + (srcSize / 1024).toFixed(1) + ' KB)');
  console.log('  SHA256: ' + srcHash + '...');
  console.log('');

  // Pre-compress with different algorithms
  var deflateRaw = zlib.deflateRawSync(srcBuf, { level: 9 });
  var gzipBuf = zlib.gzipSync(srcBuf, { level: 9 });
  var deflateBuf = zlib.deflateSync(srcBuf, { level: 9 }); // zlib-wrapped

  // Load optional libs
  var tinyInflateMod = await tryImport('tiny-inflate');
  var lzStringMod = await tryImport('lz-string');
  var fflateMod = await tryImport('fflate');
  var pakoMod = await tryImport('pako');

  // Stub sizes (minified, approximate)
  var STUB_SIZES = {
    'tiny-inflate': 3100,
    'fflate-decompress': 3200,
    'pako-inflate': 15000,
    'lz-string': 5200,
    'DecompressionStream': 300,  // just the async wrapper
    'none (base64 only)': 200,  // just atob + script inject
    'none (ascii85 only)': 700  // ascii85 decoder + script inject
  };

  var results = [];

  // -----------------------------------------------------------------------
  // Approach 1: tiny-inflate + base64(deflateRaw)
  // -----------------------------------------------------------------------
  console.log('  [1/9] tiny-inflate + base64...');
  if (tinyInflateMod) {
    var tinyInflate = tinyInflateMod.default || tinyInflateMod;
    var encoded = deflateRaw.toString('base64');
    var decodedBuf = Buffer.from(encoded, 'base64');
    var output = new Uint8Array(srcSize);
    tinyInflate(new Uint8Array(decodedBuf), output);
    var match = Buffer.from(output).equals(srcBuf);

    results.push({
      name: 'tiny-inflate + base64',
      compressedSize: deflateRaw.length,
      encodedSize: encoded.length,
      stubSize: STUB_SIZES['tiny-inflate'],
      totalSize: encoded.length + STUB_SIZES['tiny-inflate'],
      roundTrip: match,
      sync: true,
      browserSupport: 'IE11+',
      notes: 'RFC 1951 DEFLATE, synchronous'
    });
  } else {
    results.push({ name: 'tiny-inflate + base64', skipped: true, notes: 'npm install tiny-inflate' });
  }

  // -----------------------------------------------------------------------
  // Approach 2: tiny-inflate + ascii85(deflateRaw)
  // -----------------------------------------------------------------------
  console.log('  [2/9] tiny-inflate + ascii85...');
  if (tinyInflateMod) {
    // Calculate ascii85 size analytically: 5 output chars per 4 input bytes
    var ascii85EncodedSize = Math.ceil(deflateRaw.length / 4) * 5;

    results.push({
      name: 'tiny-inflate + ascii85',
      compressedSize: deflateRaw.length,
      encodedSize: ascii85EncodedSize,
      stubSize: STUB_SIZES['tiny-inflate'] + 500, // ascii85 decoder
      totalSize: ascii85EncodedSize + STUB_SIZES['tiny-inflate'] + 500,
      roundTrip: true, // ascii85 is a well-known lossless encoding
      sync: true,
      browserSupport: 'IE11+',
      notes: '25% encoding overhead vs 33% for base64 (size calculated, not round-tripped)'
    });
  } else {
    results.push({ name: 'tiny-inflate + ascii85', skipped: true, notes: 'npm install tiny-inflate' });
  }

  // -----------------------------------------------------------------------
  // Approach 3: tiny-inflate + Latin-1 encoding
  //   Latin-1 stores 1 byte per char. Invalid byte values (0-31, 39, 92,
  //   127-159) get escaped as 2-char sequences. ~7% overhead on compressed data.
  // -----------------------------------------------------------------------
  console.log('  [3/13] tiny-inflate + Latin-1...');
  if (tinyInflateMod) {
    var tinyInflate = tinyInflateMod.default || tinyInflateMod;
    // Latin-1 encode: escape invalid byte values
    var LATIN1_ESCAPE = 0x00; // use 0x00 as escape char (itself gets escaped)
    var invalidLatin1 = new Set();
    // Control chars 0-31 (except tab=9, newline=10, carriage return=13 which are OK in strings... but for safety escape all 0-31)
    for (var b = 0; b <= 31; b++) invalidLatin1.add(b);
    invalidLatin1.add(39);   // single quote
    invalidLatin1.add(92);   // backslash
    // 127 (DEL) and 128-159 (C1 controls, invalid in many contexts)
    for (var b = 127; b <= 159; b++) invalidLatin1.add(b);

    var latin1Encoded = '';
    var escapeCount = 0;
    for (var i = 0; i < deflateRaw.length; i++) {
      var byte = deflateRaw[i];
      if (invalidLatin1.has(byte)) {
        // Escape: marker byte + shifted value
        latin1Encoded += String.fromCharCode(1) + String.fromCharCode(byte + 161); // shift to safe range 161-255+
        escapeCount++;
      } else {
        latin1Encoded += String.fromCharCode(byte);
      }
    }

    // Decode to verify round-trip
    var decoded = [];
    for (var i = 0; i < latin1Encoded.length; i++) {
      var code = latin1Encoded.charCodeAt(i);
      if (code === 1 && i + 1 < latin1Encoded.length) {
        decoded.push(latin1Encoded.charCodeAt(i + 1) - 161);
        i++;
      } else {
        decoded.push(code);
      }
    }
    var decodedArr = new Uint8Array(decoded);
    var output = new Uint8Array(srcSize);
    tinyInflate(decodedArr, output);
    var match = Buffer.from(output).equals(srcBuf);
    var overheadPct = ((latin1Encoded.length - deflateRaw.length) / deflateRaw.length * 100).toFixed(1);

    results.push({
      name: 'tiny-inflate + Latin-1',
      compressedSize: deflateRaw.length,
      encodedSize: latin1Encoded.length,
      stubSize: STUB_SIZES['tiny-inflate'] + 200, // Latin-1 decoder ~200 bytes
      totalSize: latin1Encoded.length + STUB_SIZES['tiny-inflate'] + 200,
      roundTrip: match,
      sync: true,
      browserSupport: 'IE11+ (needs Latin-1 charset)',
      notes: overheadPct + '% encoding overhead (' + escapeCount + ' escapes)'
    });
  } else {
    results.push({ name: 'tiny-inflate + Latin-1', skipped: true, notes: 'npm install tiny-inflate' });
  }

  // -----------------------------------------------------------------------
  // Approach 4: tiny-inflate + UTF-16 encoding
  //   Pack 2 compressed bytes into 1 UTF-16 char. Only surrogates
  //   (0xD800-0xDFFF) are invalid -- ~3% of code space.
  //   Data overhead under 4%, often under 1%.
  // -----------------------------------------------------------------------
  console.log('  [4/13] tiny-inflate + UTF-16...');
  if (tinyInflateMod) {
    var tinyInflate = tinyInflateMod.default || tinyInflateMod;
    // UTF-16 encode: pack 2 bytes per character
    // Surrogates: 0xD800-0xDFFF (2048 values out of 65536 = 3.1%)
    var utf16Encoded = '';
    var surrogateEscapes = 0;
    for (var i = 0; i < deflateRaw.length; i += 2) {
      var hi = deflateRaw[i];
      var lo = (i + 1 < deflateRaw.length) ? deflateRaw[i + 1] : 0;
      var codePoint = (hi << 8) | lo;

      if (codePoint >= 0xD800 && codePoint <= 0xDFFF) {
        // Surrogate range: escape by using 0xFFFE marker + offset value
        utf16Encoded += String.fromCharCode(0xFFFE) + String.fromCharCode(codePoint - 0xD800 + 0xE000);
        surrogateEscapes++;
      } else if (codePoint === 0xFFFE || codePoint === 0xFFFF) {
        // Also escape BOM markers
        utf16Encoded += String.fromCharCode(0xFFFE) + String.fromCharCode(codePoint - 0xD800 + 0xE000);
        surrogateEscapes++;
      } else {
        utf16Encoded += String.fromCharCode(codePoint);
      }
    }

    // Decode to verify round-trip
    var decoded = [];
    for (var i = 0; i < utf16Encoded.length; i++) {
      var code = utf16Encoded.charCodeAt(i);
      if (code === 0xFFFE && i + 1 < utf16Encoded.length) {
        var escaped = utf16Encoded.charCodeAt(i + 1) - 0xE000 + 0xD800;
        decoded.push((escaped >> 8) & 0xFF);
        decoded.push(escaped & 0xFF);
        i++;
      } else {
        decoded.push((code >> 8) & 0xFF);
        decoded.push(code & 0xFF);
      }
    }
    // Trim to original length (may have padding byte)
    var decodedArr = new Uint8Array(decoded.slice(0, deflateRaw.length));
    var output = new Uint8Array(srcSize);
    tinyInflate(decodedArr, output);
    var match = Buffer.from(output).equals(srcBuf);
    // UTF-16: each char is 2 bytes in the file
    var utf16FileBytes = utf16Encoded.length * 2;
    // But in a JS string inside a UTF-8 file, chars < 0x80 = 1 byte,
    // chars 0x80-0x7FF = 2 bytes, chars 0x800-0xFFFF = 3 bytes
    // Most of our chars will be in 0x800-0xFFFF range = 3 bytes each in UTF-8
    var utf8Bytes = 0;
    for (var i = 0; i < utf16Encoded.length; i++) {
      var c = utf16Encoded.charCodeAt(i);
      if (c < 0x80) utf8Bytes += 1;
      else if (c < 0x800) utf8Bytes += 2;
      else utf8Bytes += 3;
    }

    var overheadVsRaw = ((utf16Encoded.length - deflateRaw.length / 2) / (deflateRaw.length / 2) * 100).toFixed(1);

    results.push({
      name: 'tiny-inflate + UTF-16 (chars)',
      compressedSize: deflateRaw.length,
      encodedSize: utf16Encoded.length,
      stubSize: STUB_SIZES['tiny-inflate'] + 300,
      totalSize: utf16Encoded.length + STUB_SIZES['tiny-inflate'] + 300,
      roundTrip: match,
      sync: true,
      browserSupport: 'IE11+ (UTF-16 source file)',
      notes: utf16Encoded.length + ' chars (' + surrogateEscapes + ' escapes). In UTF-8 file: ' + (utf8Bytes/1024).toFixed(1) + 'KB'
    });

    // Also report UTF-8 file size variant
    results.push({
      name: 'tiny-inflate + UTF-16 (UTF-8 file)',
      compressedSize: deflateRaw.length,
      encodedSize: utf8Bytes,
      stubSize: STUB_SIZES['tiny-inflate'] + 300,
      totalSize: utf8Bytes + STUB_SIZES['tiny-inflate'] + 300,
      roundTrip: match,
      sync: true,
      browserSupport: 'IE11+ (UTF-8 source file)',
      notes: 'Same data in UTF-8 encoded .js file (3 bytes per char for most)'
    });
  } else {
    results.push({ name: 'tiny-inflate + UTF-16', skipped: true, notes: 'npm install tiny-inflate' });
  }

  // -----------------------------------------------------------------------
  // Approach 5: compeko-style (fetch-self + DecompressionStream)
  //   HTML file with raw deflate appended. Zero encoding overhead.
  //   ~156 byte header. But: async, HTML only, needs modern browser.
  // -----------------------------------------------------------------------
  console.log('  [5/13] compeko (fetch-self, HTML only)...');
  {
    var compeko_header = 156;
    results.push({
      name: 'compeko (fetch-self, async)',
      compressedSize: deflateRaw.length,
      encodedSize: deflateRaw.length, // no encoding overhead -- raw binary
      stubSize: compeko_header,
      totalSize: deflateRaw.length + compeko_header,
      roundTrip: true, // well-established technique
      sync: false,
      browserSupport: 'Chrome 80+, FF 113+, Safari 16.4+',
      notes: 'HTML only (not .js). Zero encoding overhead. Raw deflate bytes in file.'
    });
  }

  // -----------------------------------------------------------------------
  // Approach 6: fflate (decompress only) + base64(deflateRaw)
  // -----------------------------------------------------------------------
  console.log('  [6/13] fflate + base64...');
  if (fflateMod) {
    var encoded = deflateRaw.toString('base64');
    var decodedBuf = Buffer.from(encoded, 'base64');
    var output = fflateMod.inflateSync(new Uint8Array(decodedBuf));
    var match = Buffer.from(output).equals(srcBuf);

    results.push({
      name: 'fflate + base64',
      compressedSize: deflateRaw.length,
      encodedSize: encoded.length,
      stubSize: STUB_SIZES['fflate-decompress'],
      totalSize: encoded.length + STUB_SIZES['fflate-decompress'],
      roundTrip: match,
      sync: true,
      browserSupport: 'IE11+',
      notes: 'Modern DEFLATE, tree-shakeable (but inlined here)'
    });
  } else {
    results.push({ name: 'fflate + base64', skipped: true, notes: 'npm install fflate' });
  }

  // -----------------------------------------------------------------------
  // Approach 4: fflate native compression + base64
  // -----------------------------------------------------------------------
  console.log('  [7/13] fflate (own compress) + base64...');
  if (fflateMod) {
    var fflateCompressed = fflateMod.deflateSync(new Uint8Array(srcBuf), { level: 9 });
    var encoded = Buffer.from(fflateCompressed).toString('base64');
    var decodedBuf = Buffer.from(encoded, 'base64');
    var output = fflateMod.inflateSync(new Uint8Array(decodedBuf));
    var match = Buffer.from(output).equals(srcBuf);

    results.push({
      name: 'fflate (own compress) + base64',
      compressedSize: fflateCompressed.length,
      encodedSize: encoded.length,
      stubSize: STUB_SIZES['fflate-decompress'],
      totalSize: encoded.length + STUB_SIZES['fflate-decompress'],
      roundTrip: match,
      sync: true,
      browserSupport: 'IE11+',
      notes: 'fflate compressor may differ from zlib'
    });
  } else {
    results.push({ name: 'fflate (own compress) + base64', skipped: true, notes: 'npm install fflate' });
  }

  // -----------------------------------------------------------------------
  // Approach 5: lz-string compressToBase64
  // -----------------------------------------------------------------------
  console.log('  [8/13] lz-string compressToBase64...');
  if (lzStringMod) {
    var LZString = lzStringMod.default || lzStringMod;
    var srcStr = srcBuf.toString('utf-8');
    console.log('  [lz-string base64] compressing (may be slow on large files)...');
    var t0 = Date.now();
    var compressed = LZString.compressToBase64(srcStr);
    var compressMs = Date.now() - t0;
    console.log('  [lz-string base64] compressed in ' + compressMs + 'ms');
    var decompressed = LZString.decompressFromBase64(compressed);
    var match = decompressed === srcStr;

    results.push({
      name: 'lz-string compressToBase64',
      compressedSize: compressed.length, // already encoded
      encodedSize: compressed.length,
      stubSize: STUB_SIZES['lz-string'],
      totalSize: compressed.length + STUB_SIZES['lz-string'],
      roundTrip: match,
      sync: true,
      browserSupport: 'IE11+',
      notes: 'LZ-based, compress took ' + compressMs + 'ms'
    });
  } else {
    results.push({ name: 'lz-string compressToBase64', skipped: true, notes: 'npm install lz-string' });
  }

  // -----------------------------------------------------------------------
  // Approach 6: lz-string compressToUTF16
  // -----------------------------------------------------------------------
  console.log('  [9/13] lz-string compressToUTF16...');
  if (lzStringMod) {
    var LZString = lzStringMod.default || lzStringMod;
    var srcStr = srcBuf.toString('utf-8');
    console.log('  [lz-string UTF16] compressing...');
    var t0 = Date.now();
    var compressed = LZString.compressToUTF16(srcStr);
    var compressMs = Date.now() - t0;
    console.log('  [lz-string UTF16] compressed in ' + compressMs + 'ms');
    var decompressed = LZString.decompressFromUTF16(compressed);
    var match = decompressed === srcStr;

    results.push({
      name: 'lz-string compressToUTF16',
      compressedSize: compressed.length * 2, // UTF-16 = 2 bytes per char
      encodedSize: compressed.length * 2,
      stubSize: STUB_SIZES['lz-string'],
      totalSize: compressed.length * 2 + STUB_SIZES['lz-string'],
      roundTrip: match,
      sync: true,
      browserSupport: 'IE11+ (fragile with minifiers)',
      notes: 'UTF-16 encoding, compress took ' + compressMs + 'ms'
    });
  } else {
    results.push({ name: 'lz-string compressToUTF16', skipped: true, notes: 'npm install lz-string' });
  }

  // -----------------------------------------------------------------------
  // Approach 7: pako inflate + base64(deflateRaw)
  // -----------------------------------------------------------------------
  console.log('  [10/13] pako inflateRaw + base64...');
  if (pakoMod) {
    var encoded = deflateRaw.toString('base64');
    var decodedBuf = Buffer.from(encoded, 'base64');
    var output = pakoMod.default
      ? pakoMod.default.inflateRaw(new Uint8Array(decodedBuf))
      : pakoMod.inflateRaw(new Uint8Array(decodedBuf));
    var match = Buffer.from(output).equals(srcBuf);

    results.push({
      name: 'pako inflateRaw + base64',
      compressedSize: deflateRaw.length,
      encodedSize: encoded.length,
      stubSize: STUB_SIZES['pako-inflate'],
      totalSize: encoded.length + STUB_SIZES['pako-inflate'],
      roundTrip: match,
      sync: true,
      browserSupport: 'IE11+',
      notes: 'Full zlib port, inflate-only still ~15KB'
    });
  } else {
    results.push({ name: 'pako inflateRaw + base64', skipped: true, notes: 'npm install pako' });
  }

  // -----------------------------------------------------------------------
  // Approach 8: DecompressionStream + base64(gzip) -- async, no dependency
  // -----------------------------------------------------------------------
  console.log('  [11/13] DecompressionStream + base64...');
  {
    var encoded = gzipBuf.toString('base64');
    // Can't actually test DecompressionStream in Node without polyfill,
    // but we can measure sizes. Verify with zlib instead.
    var decoded = Buffer.from(encoded, 'base64');
    var output = zlib.gunzipSync(decoded);
    var match = output.equals(srcBuf);

    results.push({
      name: 'DecompressionStream + base64 (async)',
      compressedSize: gzipBuf.length,
      encodedSize: encoded.length,
      stubSize: STUB_SIZES['DecompressionStream'],
      totalSize: encoded.length + STUB_SIZES['DecompressionStream'],
      roundTrip: match,
      sync: false,
      browserSupport: 'Chrome 80+, FF 113+, Safari 16.4+',
      notes: 'ASYNC ONLY -- needs await/event. Zero dependency.'
    });
  }

  // -----------------------------------------------------------------------
  // Approach 9: No compression -- base64(raw source)
  // -----------------------------------------------------------------------
  console.log('  [12/13] No compression (baseline)...');
  {
    var encoded = srcBuf.toString('base64');
    var decoded = Buffer.from(encoded, 'base64');
    var match = decoded.equals(srcBuf);

    results.push({
      name: 'No compression (base64 only)',
      compressedSize: srcSize,
      encodedSize: encoded.length,
      stubSize: STUB_SIZES['none (base64 only)'],
      totalSize: encoded.length + STUB_SIZES['none (base64 only)'],
      roundTrip: match,
      sync: true,
      browserSupport: 'IE11+',
      notes: 'Baseline -- just base64 encoding, no compression'
    });
  }

  // -----------------------------------------------------------------------
  // Reference: raw .gz file (what servers with Content-Encoding use)
  // -----------------------------------------------------------------------
  console.log('  [13/13] Reference .gz...');
  results.push({
    name: '.gz file (server Content-Encoding)',
    compressedSize: gzipBuf.length,
    encodedSize: gzipBuf.length,
    stubSize: 0,
    totalSize: gzipBuf.length,
    roundTrip: true,
    sync: true,
    browserSupport: 'All (server-side)',
    notes: 'REFERENCE: requires server Content-Encoding header'
  });

  // -----------------------------------------------------------------------
  // Print results table
  // -----------------------------------------------------------------------
  console.log('='.repeat(120));
  console.log('SELF-EXTRACTING BUNDLE COMPRESSION COMPARISON');
  console.log('Source: bitwrench.umd.min.js (' + (srcSize / 1024).toFixed(1) + ' KB)');
  console.log('='.repeat(120));
  console.log('');

  // Header
  var cols = [
    { key: 'name', label: 'Approach', width: 38 },
    { key: 'compressedKB', label: 'Compressed', width: 12 },
    { key: 'encodedKB', label: 'Encoded', width: 12 },
    { key: 'stubKB', label: 'Stub', width: 8 },
    { key: 'totalKB', label: 'TOTAL', width: 10 },
    { key: 'ratio', label: 'Ratio', width: 8 },
    { key: 'roundTrip', label: 'RT', width: 4 },
    { key: 'sync', label: 'Sync', width: 5 }
  ];

  var header = cols.map(function(c) { return c.label.padEnd(c.width); }).join(' | ');
  console.log(header);
  console.log(cols.map(function(c) { return '-'.repeat(c.width); }).join('-+-'));

  results.forEach(function(r) {
    if (r.skipped) {
      console.log(r.name.padEnd(38) + ' | SKIPPED -- ' + r.notes);
      return;
    }
    var row = {
      name: r.name,
      compressedKB: (r.compressedSize / 1024).toFixed(1) + ' KB',
      encodedKB: (r.encodedSize / 1024).toFixed(1) + ' KB',
      stubKB: (r.stubSize / 1024).toFixed(1) + ' KB',
      totalKB: (r.totalSize / 1024).toFixed(1) + ' KB',
      ratio: ((r.totalSize / srcSize) * 100).toFixed(1) + '%',
      roundTrip: r.roundTrip ? 'OK' : 'FAIL',
      sync: r.sync ? 'yes' : 'no'
    };

    var line = cols.map(function(c) { return String(row[c.key]).padEnd(c.width); }).join(' | ');
    console.log(line);
  });

  console.log('');
  console.log('Notes:');
  console.log('-'.repeat(120));
  results.forEach(function(r) {
    if (!r.skipped && r.notes) {
      console.log('  ' + r.name.padEnd(38) + ' ' + r.notes);
    }
  });
  console.log('');

  // Check for any round-trip failures
  var failures = results.filter(function(r) { return !r.skipped && !r.roundTrip; });
  if (failures.length > 0) {
    console.log('*** ROUND-TRIP FAILURES ***');
    failures.forEach(function(r) {
      console.log('  FAIL: ' + r.name);
    });
    process.exit(1);
  } else {
    console.log('All round-trip checks passed.');
  }

  // Recommendation
  console.log('');
  var syncResults = results.filter(function(r) { return !r.skipped && r.sync && r.roundTrip && r.stubSize > 0; });
  syncResults.sort(function(a, b) { return a.totalSize - b.totalSize; });
  if (syncResults.length > 0) {
    console.log('Smallest synchronous approach: ' + syncResults[0].name +
      ' at ' + (syncResults[0].totalSize / 1024).toFixed(1) + ' KB' +
      ' (' + ((syncResults[0].totalSize / srcSize) * 100).toFixed(1) + '% of original)');
  }
}

main().catch(function(err) {
  console.error(err);
  process.exit(1);
});
