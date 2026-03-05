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

// Generate version.js content
const versionContent = `/**
 * Auto-generated version file from package.json
 * DO NOT EDIT DIRECTLY - Use npm run generate-version
 */

export const VERSION = '${pkg.version}';
export const VERSION_INFO = {
  version: '${pkg.version}',
  name: '${pkg.name}',
  description: '${pkg.description}',
  license: '${pkg.license}',
  homepage: '${pkg.homepage || ''}',
  repository: '${pkg.repository ? pkg.repository.url || pkg.repository : ''}',
  author: '${pkg.author}',
  buildDate: '${new Date().toISOString()}'
};
`;

// Write to src/version.js
const versionPath = path.join(__dirname, '..', 'src', 'version.js');
fs.writeFileSync(versionPath, versionContent, 'utf8');

console.log(`Generated version.js with version ${pkg.version}`);