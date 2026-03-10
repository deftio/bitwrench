/**
 * bitwrench serve — CLI subcommand for bwserve dev server.
 *
 * Serves a directory of bitwrench pages with live reload.
 * Uses bwserve library under the hood.
 *
 * Usage:
 *   bitwrench serve [dir] [--port N] [--theme name] [--open] [--verbose]
 */

import { parseArgs } from 'node:util';
import { VERSION } from '../version.js';

const SERVE_USAGE = `
bitwrench serve v${VERSION} — Development server for bitwrench sites

Usage:
  bitwrench serve [dir] [options]

Arguments:
  dir                    Directory to serve (default: current directory)

Options:
  -p, --port <number>    Port to listen on (default: 7902)
  -t, --theme <name>     Theme preset or hex colors ("#pri,#sec")
      --open             Open browser on start
  -v, --verbose          Verbose output
  -h, --help             Print this help

Examples:
  bitwrench serve                    Serve current directory on port 7902
  bitwrench serve ./site             Serve ./site directory
  bitwrench serve -p 8080            Use port 8080
  bitwrench serve --theme ocean      Apply ocean theme
`.trim();

/**
 * Run the serve subcommand.
 * @param {string[]} argv - arguments after "serve"
 */
export function runServe(argv) {
    let values, positionals;

    try {
        const result = parseArgs({
            args: argv,
            strict: true,
            allowPositionals: true,
            options: {
                port:    { type: 'string', short: 'p' },
                theme:   { type: 'string', short: 't' },
                open:    { type: 'boolean' },
                verbose: { type: 'boolean', short: 'v' },
                help:    { type: 'boolean', short: 'h' }
            }
        });
        values = result.values;
        positionals = result.positionals;
    } catch (err) {
        console.error(`Error: ${err.message}`);
        console.error('Run "bitwrench serve --help" for usage.');
        process.exit(1);
    }

    if (values.help) {
        console.log(SERVE_USAGE);
        return;
    }

    const dir = positionals[0] || '.';
    const port = values.port ? parseInt(values.port, 10) : 7902;
    const theme = values.theme || null;
    const open = !!values.open;
    const verbose = !!values.verbose;

    if (isNaN(port) || port < 1 || port > 65535) {
        console.error('Error: --port must be a number between 1 and 65535.');
        process.exit(1);
    }

    // TODO: implement full bwserve dev server
    // - Serve static files from dir
    // - Auto-inject bitwrench client JS
    // - SSE endpoint for live reload
    // - Watch for file changes
    // - Apply theme if specified
    console.log(`bwserve v${VERSION}`);
    console.log(`  directory: ${dir}`);
    console.log(`  port:      ${port}`);
    if (theme) console.log(`  theme:     ${theme}`);
    if (verbose) console.log(`  verbose:   on`);
    console.log('');
    console.log('bwserve is not yet implemented. This is a stub.');
    console.log('See dev/qa-todo.md P1 for the implementation plan.');
}
