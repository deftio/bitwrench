#!/usr/bin/env node
import { run } from '../src/cli/index.js';

// Propagate an exit code when a subcommand returns one. `bwcli verify` is the
// first that does, and a checker whose exit code never reaches the shell is
// useless in CI. Long-running subcommands (serve, attach) return a server or
// nothing, so they fall through and the process stays alive.
//
// process.exitCode rather than process.exit(): exit() can truncate stdout
// that has not flushed, and a checker that loses its last finding is worse
// than one that is slow.
Promise.resolve(run(process.argv.slice(2))).then(function (code) {
  if (typeof code === 'number') process.exitCode = code;
});
