#!/usr/bin/env node

/**
 * Simple static server for testing bitwrench examples
 * Serves from project root to ensure correct paths to dist/
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 8080;

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  console.log(`${req.method} ${req.url}`);
  
  // Default to examples_v2r2 index
  let requestPath = req.url === '/' ? '/examples_v2r2/index.html' : req.url;
  
  // Parse URL
  let filePath = path.join(__dirname, requestPath);
  
  // Security check
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }
  
  // Check if file exists
  fs.stat(filePath, (err, stats) => {
    if (err) {
      res.writeHead(404);
      res.end(`File not found: ${requestPath}`);
      console.error(`404: ${requestPath}`);
      return;
    }
    
    if (stats.isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }
    
    // Read and serve file
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(500);
        res.end('Error reading file');
        return;
      }
      
      const ext = path.extname(filePath);
      const mimeType = mimeTypes[ext] || 'application/octet-stream';
      
      res.writeHead(200, { 
        'Content-Type': mimeType,
        'Cache-Control': 'no-cache'
      });
      res.end(data);
    });
  });
});

server.listen(PORT, () => {
  console.log(`\nBitwrench Development Server`);
  console.log(`============================`);
  console.log(`Server running at http://localhost:${PORT}/`);
  console.log(`\nExample pages:`);
  console.log(`  http://localhost:${PORT}/examples_v2r2/`);
  console.log(`  http://localhost:${PORT}/examples_v2r2/01-basic-components.html`);
  console.log(`  http://localhost:${PORT}/examples_v2r2/02-interactive-tables-forms.html`);
  console.log(`  http://localhost:${PORT}/examples_v2r2/03-themes-styling.html`);
  console.log(`  http://localhost:${PORT}/examples_v2r2/04-dashboard-app.html`);
  console.log(`\nPress Ctrl+C to stop`);
});