#!/usr/bin/env node
/**
 * bwserve Screenshot Example
 *
 * Demonstrates the client.screenshot() API — the server captures
 * what the client is rendering and sends the image back as an <img>.
 *
 * Run:  node screenshot-server.js
 * Open: http://localhost:7903
 */

import { create } from '../../src/bwserve/index.js';

var app = create({
  port: 7903,
  title: 'bwserve Screenshot Demo',
  theme: 'ocean',
  allowScreenshot: true
});

// =========================================================================
// Page: Screenshot Demo (/)
// =========================================================================
app.page('/', function(client) {
  var captureCount = 0;

  function renderUI() {
    client.render('#app', {
      t: 'div', a: { style: 'max-width: 700px; margin: 2rem auto; padding: 0 1rem;' },
      c: [
        { t: 'h1', c: 'Screenshot Demo' },
        { t: 'p', a: { style: 'color: #64748b;' },
          c: 'The server can capture what the client is displaying and get the image back as a Buffer. Click the button below to trigger a capture.' },

        // Content that will be captured
        {
          t: 'div', a: { id: 'capture-area', style: 'margin: 1.5rem 0;' },
          c: [
            {
              t: 'div', a: { style: 'display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 1rem; margin-bottom: 1rem;' },
              c: [
                statCard('Active Users', String(Math.floor(Math.random() * 500) + 100), '#2563eb'),
                statCard('Revenue', '$' + (Math.floor(Math.random() * 9000) + 1000), '#059669'),
                statCard('Orders', String(Math.floor(Math.random() * 200) + 50), '#d97706'),
                statCard('Uptime', '99.9%', '#7c3aed')
              ]
            },
            {
              t: 'div', a: { style: 'background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 0.5rem; padding: 1rem; color: #0c4a6e;' },
              c: 'This entire section (stat cards + this box) will be captured as a screenshot by the server.'
            }
          ]
        },

        // Controls
        {
          t: 'div', a: { style: 'display: flex; gap: 1rem; margin-bottom: 1.5rem;' },
          c: [
            { t: 'button', a: {
              class: 'bw_btn bw_primary', 'data-bw-action': 'capture-full',
              style: 'font-size: 1rem; padding: 0.5rem 1.25rem;'
            }, c: 'Capture Full Page' },
            { t: 'button', a: {
              class: 'bw_btn bw_secondary', 'data-bw-action': 'capture-area',
              style: 'font-size: 1rem; padding: 0.5rem 1.25rem;'
            }, c: 'Capture Stats Only' }
          ]
        },

        // Result area
        { t: 'div', a: { id: 'screenshot-result' } },

        // Info
        {
          t: 'div', a: { style: 'margin-top: 2rem; padding: 1rem; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 0.5rem;' },
          c: [
            { t: 'h3', a: { style: 'margin: 0 0 0.5rem; font-size: 1rem;' }, c: 'How it works' },
            { t: 'ol', a: { style: 'margin: 0; padding-left: 1.25rem; color: #475569; font-size: 0.9rem; line-height: 1.7;' },
              c: [
                { t: 'li', c: 'Server calls client.screenshot(selector, options)' },
                { t: 'li', c: 'Client loads html2canvas (lazy, first call only)' },
                { t: 'li', c: 'html2canvas renders the DOM element to a <canvas>' },
                { t: 'li', c: 'Client POSTs the image data URL back to the server' },
                { t: 'li', c: 'Server resolves the Promise with { data: Buffer, width, height, format }' }
              ]
            }
          ]
        }
      ]
    });
  }

  function statCard(label, value, color) {
    return {
      t: 'div', a: {
        style: 'background: #fff; border: 1px solid #e2e8f0; border-radius: 0.5rem; padding: 1.25rem; text-align: center;'
      },
      c: [
        { t: 'div', a: { style: 'font-size: 1.75rem; font-weight: 700; color: ' + color + ';' }, c: value },
        { t: 'div', a: { style: 'color: #64748b; font-size: 0.85rem; margin-top: 0.25rem;' }, c: label }
      ]
    };
  }

  function doCapture(selector) {
    captureCount++;
    var n = captureCount;

    client.patch('screenshot-result', 'Capturing...');

    client.screenshot(selector, { format: 'png', scale: 1 })
      .then(function(result) {
        var base64 = result.data.toString('base64');
        var dataUrl = 'data:image/' + result.format + ';base64,' + base64;

        client.render('#screenshot-result', {
          t: 'div', c: [
            {
              t: 'div', a: { style: 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;' },
              c: [
                { t: 'span', a: { style: 'font-weight: 600; color: #1e293b;' },
                  c: 'Capture #' + n + ' (' + result.width + '\u00d7' + result.height + ' ' + result.format + ', ' + Math.round(result.data.length / 1024) + ' KB)' },
                { t: 'span', a: { style: 'color: #059669; font-size: 0.85rem;' }, c: 'Received by server' }
              ]
            },
            {
              t: 'img', a: {
                src: dataUrl,
                style: 'max-width: 100%; border: 1px solid #e2e8f0; border-radius: 0.5rem; box-shadow: 0 2px 8px rgba(0,0,0,0.08);'
              }
            }
          ]
        });
      })
      .catch(function(err) {
        client.patch('screenshot-result', 'Error: ' + err.message);
      });
  }

  renderUI();

  client.on('capture-full', function() {
    doCapture('body');
  });

  client.on('capture-area', function() {
    doCapture('#capture-area');
  });
});

// =========================================================================
// Start
// =========================================================================
app.listen(function() {
  console.log('bwserve screenshot demo at http://localhost:' + app.port);
});
