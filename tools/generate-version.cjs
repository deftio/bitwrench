#!/usr/bin/env node

/**
 * Generate version.js from package.json
 * This script reads the version from package.json and creates a version.js file
 * that can be imported by bitwrench.js
 */

const fs = require('fs');
const path = require('path');

// Read package.json
const packagePath = path.join(__dirname, '..', 'package.json');
const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

// buildDate is a calendar date, not a timestamp, so that two builds of the
// same source on the same day produce byte-identical output.
//
// This matters for more than tidiness. dist/ is committed, so `git diff dist/`
// is the cheapest available check that the build tools produced what the
// source says they should. A millisecond-resolution stamp propagated into
// every artifact that imports version.js and cascaded into sri.json and
// builds.json, dirtying ~44 files on every single build -- which meant a
// genuine unexplained change in the output was indistinguishable from noise.
// Reproducible builds make that diff readable, and a readable diff is what
// turns a compromised build dependency into something a human can notice.
//
// SOURCE_DATE_EPOCH is honoured if set, per the reproducible-builds convention.
const epoch = process.env.SOURCE_DATE_EPOCH;
const buildDate = (epoch ? new Date(Number(epoch) * 1000) : new Date())
  .toISOString()
  .split('T')[0];

// Generate version.js content
const versionContent = `/**
 * Auto-generated version file from package.json
 * DO NOT EDIT DIRECTLY - Use npm run generate-version
 */

export const VERSION = '${pkg.version}';
export const VERSION_INFO = {
  version: '${pkg.version}',
  name: '${pkg.name}',
  license: '${pkg.license}',
  buildDate: '${buildDate}'
};
`;

// Write to src/version.js
const versionPath = path.join(__dirname, '..', 'src', 'version.js');
fs.writeFileSync(versionPath, versionContent, 'utf8');

console.log(`Generated version.js with version ${pkg.version}`);