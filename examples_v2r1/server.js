#!/usr/bin/env node

/**
 * Simple static server for testing bitwrench v2 examples
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 8002;

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
  
  // Parse URL
  let filePath = path.join(__dirname, '..', req.url === '/' ? '/examples_v2/index.html' : req.url);
  
  // Security check
  if (!filePath.startsWith(path.join(__dirname, '..'))) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }
  
  // Check if file exists
  fs.stat(filePath, (err, stats) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
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
      
      res.writeHead(200, { 'Content-Type': mimeType });
      res.end(data);
    });
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
  console.log(`View examples at http://localhost:${PORT}/examples_v2/`);
  console.log('Press Ctrl+C to stop');
});