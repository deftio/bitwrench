/**
 * Bitwrench CLI - Main entry point
 * Arg parsing with util.parseArgs(), help, version, dispatch
 *
 * Subcommands:
 *   bitwrench <file> [options]       Convert a file to styled HTML
 *   bitwrench serve [dir] [options]  Start bwserve dev server
 */

import { parseArgs } from 'node:util';
import { VERSION } from '../version.js';
import { convertFile } from './convert.js';
import { runServe } from './serve.js';

const USAGE = `
bitwrench v${VERSION} — Document converter, static site generator & dev server

Usage:
  bitwrench <file> [options]       Convert a file to styled HTML
  bitwrench serve [dir] [options]  Start bwserve development server
  bitwrench --version              Print version
  bitwrench --help                 Print this help

Convert options:
  -o, --output <file>    Output file path (default: input with .html extension)
  -c, --css <file>       Include external CSS file
  -t, --theme <name>     Theme preset (ocean, sunset, forest, slate) or hex colors ("#pri,#sec")
  -s, --standalone       Embed bitwrench inline (works offline)
      --cdn              Link bitwrench via CDN (jsdelivr)
      --no-bw            Don't inject bitwrench (plain HTML output)
      --title <text>     Page title (default: auto-detect from content)
  -f, --favicon <path>   Favicon path or URL
      --highlight        Include highlight.js for syntax highlighting
  -v, --verbose          Verbose output

Serve options:
  -p, --port <number>    Port to listen on (default: 7902)
  -t, --theme <name>     Theme preset or hex colors
      --open             Open browser on start
  -v, --verbose          Verbose output

General:
  -h, --help             Print this help
      --version          Print version

Examples:
  bitwrench README.md                          Convert README.md to README.html
  bitwrench README.md -o index.html            Specify output file
  bitwrench README.md -o out.html --theme ocean  Apply ocean theme
  bitwrench README.md -o out.html --standalone   Self-contained offline HTML
  bitwrench README.md -o out.html --highlight    With syntax highlighting
  bitwrench doc.md --theme "#336699,#cc6633"     Custom theme colors
  bitwrench serve                              Serve current directory on port 7902
  bitwrench serve ./site --port 8080           Serve ./site on port 8080
`.trim();

/**
 * Parse CLI arguments and dispatch
 * @param {string[]} argv - process.argv.slice(2)
 */
export function run(argv) {
    // Check for subcommand before parseArgs (subcommands have different options)
    if (argv.length > 0 && argv[0] === 'serve') {
        return runServe(argv.slice(1));
    }

    let values, positionals;

    try {
        const result = parseArgs({
            args: argv,
            strict: true,
            allowPositionals: true,
            options: {
                output:     { type: 'string', short: 'o' },
                css:        { type: 'string', short: 'c' },
                theme:      { type: 'string', short: 't' },
                standalone: { type: 'boolean', short: 's' },
                cdn:        { type: 'boolean' },
                'no-bw':    { type: 'boolean' },
                title:      { type: 'string' },
                favicon:    { type: 'string', short: 'f' },
                highlight:  { type: 'boolean' },
                verbose:    { type: 'boolean', short: 'v' },
                version:    { type: 'boolean' },
                help:       { type: 'boolean', short: 'h' }
            }
        });
        values = result.values;
        positionals = result.positionals;
    } catch (err) {
        console.error(`Error: ${err.message}`);
        console.error('Run "bitwrench --help" for usage.');
        process.exit(1);
    }

    // --version
    if (values.version) {
        console.log(`bitwrench v${VERSION}`);
        return;
    }

    // --help
    if (values.help) {
        console.log(USAGE);
        return;
    }

    // No positional args → error
    if (positionals.length === 0) {
        console.error('Error: No input file specified.');
        console.error('Run "bitwrench --help" for usage.');
        process.exit(1);
    }

    // Single-file conversion
    const inputFile = positionals[0];
    const flags = {
        output: values.output || null,
        css: values.css || null,
        theme: values.theme || null,
        standalone: !!values.standalone,
        cdn: !!values.cdn,
        noBw: !!values['no-bw'],
        title: values.title || null,
        favicon: values.favicon || null,
        highlight: !!values.highlight,
        verbose: !!values.verbose
    };

    try {
        const outputPath = convertFile(inputFile, flags);
        if (flags.verbose) {
            console.log(`Converted: ${inputFile} → ${outputPath}`);
        }
    } catch (err) {
        console.error(`Error: ${err.message}`);
        if (flags.verbose) {
            console.error(err.stack);
        }
        process.exit(1);
    }
}
