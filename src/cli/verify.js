/**
 * bwcli verify — CLI subcommand for the TACO checker.
 *
 * The second of verify's two doors. A JavaScript sender imports
 * `bitwrench/verify` and calls it directly; anything else -- a C++ or Python
 * generator, a shell pipeline, a CI job -- pipes a payload at this.
 *
 * This is the library linked to a file and a stdin buffer. It does not grow
 * its own rules: a test that imports `verify` and a job that runs
 * `bwcli verify frame.json` report the same findings. See
 * dev/bw-verify-design.md section 9.
 *
 * Wire mode is the default here, because a file or a pipe is a payload that
 * has already crossed JSON. Authored mode is the library default, because
 * there the caller is holding JavaScript.
 *
 * Usage:
 *   bwcli verify <file.json>
 *   some-generator | bwcli verify
 */

import { parseArgs } from 'node:util';
import { readFileSync } from 'node:fs';
import { VERSION } from '../version.js';
import { verify } from '../bitwrench-verify.js';
import bw from '../bitwrench.js';

var VERIFY_USAGE = `
bwcli verify v${VERSION} — Check TACO payloads

Usage:
  bwcli verify [file] [options]
  <generator> | bwcli verify [options]

Arguments:
  file                   JSON file to check. Omit to read stdin.

Options:
      --authored         Check as hand-written TACO (functions allowed).
                         Default is wire mode, which rejects functions and
                         flags string on* handlers -- neither survives JSON.
      --strict           Fail on warnings too, not just errors
      --ignore <codes>   Comma-separated finding codes to suppress
      --json             Emit findings as JSON instead of text
  -q, --quiet            Print nothing; use the exit code
  -h, --help             Print this help

Exit codes:
  0   nothing fatal
  1   at least one error (or, with --strict, a warning)
  2   the input could not be read or parsed

Examples:
  bwcli verify frame.json
  bwcli verify frame.json --strict
  cat frames.ndjson | bwcli verify
  sensor-gen | bwcli verify --ignore handler-string
  bwcli verify page.json --authored --json
`.trim();

/**
 * Parse one payload — strict JSON, or the r-prefixed relaxed form the
 * embedded senders emit. Mirrors what bwserve accepts on the wire, so a frame
 * a device can send is a frame this can check.
 *
 * @param {string} str - one payload
 * @returns {Object} {ok:true, value} or {ok:false, error}
 */
function parsePayload(str) {
    str = str.trim();
    if (!str) return { ok: false, error: 'empty input' };
    // The r-prefixed relaxed form, as the embedded senders emit it.
    if (str.charAt(0) === 'r') {
        try {
            return { ok: true, value: bw.parseJSONFlex(str) };
        } catch (e) {
            // parseJSONFlex relaxes QUOTES and trailing commas, not keys:
            // `r{'t':'p'}` parses, `r{t:'p'}` does not. That trips people, and
            // the bare JSON error it surfaces does not explain why.
            var hint = /unquoted|property name/i.test(e.message)
                ? ' (relaxed JSON allows single quotes and trailing commas, but keys must still be quoted: r{\'t\':\'p\'})'
                : '';
            return { ok: false, error: 'relaxed JSON (r-prefixed): ' + e.message + hint };
        }
    }
    try {
        return { ok: true, value: JSON.parse(str) };
    } catch (e) {
        // A relaxed payload missing its prefix is a common mistake; say so
        // rather than reporting a bare JSON syntax error.
        try {
            if (bw.parseJSONFlex('r' + str)) {
                return {
                    ok: false,
                    error: e.message +
                        ' (this parses as relaxed JSON -- prefix the payload with `r` if that was intended)'
                };
            }
        } catch (e2) { /* fall through to the original error */ }
        return { ok: false, error: e.message };
    }
}

/**
 * Split a buffer into payloads. One JSON document is the normal case; a pipe
 * from a generator often emits newline-delimited frames, so that works too.
 *
 * @param {string} text - the whole buffer
 * @returns {Object} {payloads, errors}
 */
function readPayloads(text) {
    var whole = parsePayload(text);
    if (whole.ok) return { payloads: [whole.value], errors: [] };

    var lines = text.split('\n')
        .map(function (l) { return l.trim(); })
        .filter(function (l) { return l.length > 0; });
    if (lines.length < 2) return { payloads: [], errors: [whole.error] };

    var payloads = [];
    var errors = [];
    lines.forEach(function (line, i) {
        var one = parsePayload(line);
        if (one.ok) payloads.push(one.value);
        else errors.push('line ' + (i + 1) + ': ' + one.error);
    });
    // Nothing parsed either way: report the whole-buffer error, which is the
    // more useful message when the input was never NDJSON to begin with.
    if (!payloads.length) return { payloads: [], errors: [whole.error] };
    return { payloads: payloads, errors: errors };
}

function formatFinding(f, index, total) {
    var where = f.path ? "'" + f.path + "'" : 'the root';
    var line = '  ' + (f.severity === 'error' ? 'error' : 'warn ') + '  ' + f.code + ' at ' + where;
    if (f.key) line += ' (' + f.key + ')';
    if (f.hint) line += ' -- did you mean ' + f.hint + '?';
    if (total > 1) line = '  [' + index + ']' + line;
    return line;
}

/**
 * Check every payload in a buffer and print the result. Split out so the file
 * and stdin paths report identically.
 *
 * @param {string} text - the buffer
 * @param {string} label - what to call it in output
 * @param {Object} values - parsed CLI flags
 * @param {Object} opts - verify() options
 * @returns {number} exit code
 */
function checkAndReport(text, label, values, opts) {
    var read = readPayloads(text);
    if (!read.payloads.length) {
        if (!values.quiet) console.error('bwcli verify: ' + label + ': ' + read.errors[0]);
        return 2;
    }

    var all = [];
    read.payloads.forEach(function (payload, i) {
        verify(payload, opts).forEach(function (f) { all.push({ index: i, finding: f }); });
    });

    var fatal = all.filter(function (x) {
        return x.finding.severity === 'error' || (values.strict && x.finding.severity === 'warn');
    });
    var code = fatal.length ? 1 : (read.errors.length ? 2 : 0);

    if (values.quiet) return code;

    if (values.json) {
        console.log(JSON.stringify({
            source: label,
            mode: opts.mode,
            payloads: read.payloads.length,
            findings: all.map(function (x) {
                return read.payloads.length > 1
                    ? Object.assign({ payload: x.index }, x.finding)
                    : x.finding;
            }),
            parseErrors: read.errors,
            ok: code === 0
        }, null, 2));
        return code;
    }

    var n = read.payloads.length;
    var what = n === 1 ? '1 payload' : n + ' payloads';
    if (!all.length && !read.errors.length) {
        console.log('bwcli verify: ' + label + ' (' + opts.mode + ' mode): ' + what + ', nothing to report');
        return 0;
    }

    console.log('bwcli verify: ' + label + ' (' + opts.mode + ' mode), ' + what);
    all.forEach(function (x) { console.log(formatFinding(x.finding, x.index, n)); });
    read.errors.forEach(function (e) { console.log('  parse  ' + e); });

    var errs = all.filter(function (x) { return x.finding.severity === 'error'; }).length;
    var warns = all.length - errs;
    var parts = [];
    if (errs) parts.push(errs + ' error' + (errs === 1 ? '' : 's'));
    if (warns) parts.push(warns + ' warning' + (warns === 1 ? '' : 's'));
    if (read.errors.length) parts.push(read.errors.length + ' unparseable');
    var tail = fatal.length
        ? ''
        : ' -- nothing fatal' + (warns && !values.strict ? ' (--strict to fail on warnings)' : '');
    console.log(parts.join(', ') + tail);

    return code;
}

/**
 * Run the verify subcommand.
 *
 * @param {string[]} argv - arguments after `verify`
 * @returns {Promise<number>|number} process exit code
 */
export function runVerify(argv) {
    var values, positionals;
    try {
        var parsed = parseArgs({
            args: argv,
            strict: true,
            allowPositionals: true,
            options: {
                authored: { type: 'boolean' },
                strict:   { type: 'boolean' },
                ignore:   { type: 'string' },
                json:     { type: 'boolean' },
                quiet:    { type: 'boolean', short: 'q' },
                help:     { type: 'boolean', short: 'h' }
            }
        });
        values = parsed.values;
        positionals = parsed.positionals;
    } catch (e) {
        console.error('bwcli verify: ' + e.message);
        console.error('Run `bwcli verify --help` for usage.');
        return 2;
    }

    if (values.help) {
        console.log(VERIFY_USAGE);
        return 0;
    }

    var opts = {
        mode: values.authored ? 'authored' : 'wire',
        ignore: values.ignore
            ? values.ignore.split(',').map(function (s) { return s.trim(); }).filter(Boolean)
            : undefined
    };

    var source = positionals[0];
    if (source) {
        var text;
        try {
            text = readFileSync(source, 'utf8');
        } catch (e) {
            console.error('bwcli verify: cannot read ' + source + ': ' + e.message);
            return 2;
        }
        return checkAndReport(text, source, values, opts);
    }

    // No file: buffer stdin.
    if (process.stdin.isTTY) {
        console.error('bwcli verify: no input. Give a file, or pipe JSON at stdin.');
        console.error('Run `bwcli verify --help` for usage.');
        return 2;
    }
    return new Promise(function (resolve) {
        var chunks = [];
        process.stdin.setEncoding('utf8');
        process.stdin.on('data', function (c) { chunks.push(c); });
        process.stdin.on('end', function () {
            resolve(checkAndReport(chunks.join(''), '<stdin>', values, opts));
        });
        process.stdin.on('error', function (e) {
            console.error('bwcli verify: stdin: ' + e.message);
            resolve(2);
        });
    });
}

export { VERIFY_USAGE, parsePayload, readPayloads, checkAndReport };
