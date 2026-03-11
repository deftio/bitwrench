#!/usr/bin/env node
/**
 * bwserve Client-Server Example
 *
 * A Streamlit-style counter + dashboard app using bwserve.
 * The server pushes UI via SSE, the client sends actions back via POST.
 *
 * Run:  node server.js
 * Open: http://localhost:7902
 */

import { create } from '../../src/bwserve/index.js';

var app = create({
  port: 7902,
  title: 'bwserve Dashboard',
  theme: 'ocean'
});

// =========================================================================
// Page: Counter (/)
// =========================================================================
app.page('/', function(client) {
  var count = 0;

  // Render initial UI
  client.render('#app', {
    t: 'div', a: { style: 'max-width: 500px; margin: 2rem auto; text-align: center;' },
    c: [
      { t: 'h1', c: 'bwserve Counter' },
      { t: 'p', a: { style: 'color: #64748b;' }, c: 'Server-driven UI over SSE. Every click round-trips to the server.' },
      { t: 'div', a: { style: 'margin: 2rem 0;' }, c: [
        {
          t: 'div',
          a: {
            id: 'counter-display',
            style: 'font-size: 4rem; font-weight: 700; color: #2563eb; margin: 1rem 0;'
          },
          c: '0'
        },
        {
          t: 'div', a: { style: 'display: flex; gap: 1rem; justify-content: center;' },
          c: [
            { t: 'button', a: {
              class: 'bw_btn bw_primary', 'data-bw-action': 'decrement',
              style: 'font-size: 1.25rem; padding: 0.5rem 1.5rem;'
            }, c: '\u2212' },
            { t: 'button', a: {
              class: 'bw_btn bw_secondary', 'data-bw-action': 'reset',
              style: 'font-size: 1.25rem; padding: 0.5rem 1.5rem;'
            }, c: 'Reset' },
            { t: 'button', a: {
              class: 'bw_btn bw_primary', 'data-bw-action': 'increment',
              style: 'font-size: 1.25rem; padding: 0.5rem 1.5rem;'
            }, c: '+' }
          ]
        }
      ]},
      { t: 'p', a: { style: 'margin-top: 2rem;' },
        c: { t: 'a', a: { href: '/dashboard' }, c: 'View Live Dashboard \u2192' }
      }
    ]
  });

  // Handle actions from the client
  client.on('increment', function() {
    count++;
    client.patch('counter-display', String(count));
  });

  client.on('decrement', function() {
    count--;
    client.patch('counter-display', String(count));
  });

  client.on('reset', function() {
    count = 0;
    client.patch('counter-display', '0');
  });
});

// =========================================================================
// Page: Dashboard (/dashboard)
// =========================================================================
app.page('/dashboard', function(client) {
  var stats = {
    users: Math.floor(Math.random() * 500) + 100,
    requests: Math.floor(Math.random() * 10000) + 1000,
    errors: Math.floor(Math.random() * 20),
    uptime: 99.9 + Math.random() * 0.09
  };

  function renderDashboard() {
    client.render('#app', {
      t: 'div', a: { style: 'max-width: 800px; margin: 2rem auto;' },
      c: [
        { t: 'h1', a: { style: 'text-align: center;' }, c: 'Live Dashboard' },
        { t: 'p', a: { style: 'text-align: center; color: #64748b;' },
          c: 'Stats update every 2 seconds via SSE push. No polling.' },
        {
          t: 'div',
          a: { style: 'display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; margin: 2rem 0;' },
          c: [
            statCard('users-card', 'Active Users', stats.users, '\uD83D\uDC64'),
            statCard('req-card', 'Requests/min', stats.requests, '\uD83D\uDCE1'),
            statCard('err-card', 'Errors', stats.errors, '\u26A0\uFE0F'),
            statCard('up-card', 'Uptime', stats.uptime.toFixed(2) + '%', '\u2705')
          ]
        },
        { t: 'div', a: { style: 'text-align: center;' }, c: [
          { t: 'button', a: { class: 'bw_btn bw_primary', 'data-bw-action': 'refresh' }, c: 'Force Refresh' },
          { t: 'span', a: { style: 'display:inline-block; width:1rem;' } },
          { t: 'a', a: { href: '/', class: 'bw_btn bw_secondary' }, c: '\u2190 Counter' }
        ]},
        { t: 'p', a: { id: 'last-update', style: 'text-align: center; color: #94a3b8; margin-top: 1rem; font-size: 0.85rem;' },
          c: 'Last update: ' + new Date().toLocaleTimeString() }
      ]
    });
  }

  function statCard(id, label, value, icon) {
    return {
      t: 'div', a: {
        id: id,
        style: 'background: #fff; border: 1px solid #e2e8f0; border-radius: 0.5rem; padding: 1.5rem; text-align: center;'
      },
      c: [
        { t: 'div', a: { style: 'font-size: 2rem; margin-bottom: 0.5rem;' }, c: icon },
        { t: 'div', a: { style: 'font-size: 1.75rem; font-weight: 700; color: #1e293b;' }, c: String(value) },
        { t: 'div', a: { style: 'color: #64748b; font-size: 0.9rem; margin-top: 0.25rem;' }, c: label }
      ]
    };
  }

  renderDashboard();

  // Live updates every 2 seconds
  var interval = setInterval(function() {
    stats.users += Math.floor(Math.random() * 11) - 5;
    stats.requests += Math.floor(Math.random() * 200) - 50;
    stats.errors += Math.floor(Math.random() * 3) - 1;
    if (stats.errors < 0) stats.errors = 0;
    stats.uptime = 99.9 + Math.random() * 0.09;

    client.batch([
      { type: 'replace', target: '#users-card', node: statCard('users-card', 'Active Users', stats.users, '\uD83D\uDC64') },
      { type: 'replace', target: '#req-card', node: statCard('req-card', 'Requests/min', stats.requests, '\uD83D\uDCE1') },
      { type: 'replace', target: '#err-card', node: statCard('err-card', 'Errors', stats.errors, '\u26A0\uFE0F') },
      { type: 'replace', target: '#up-card', node: statCard('up-card', 'Uptime', stats.uptime.toFixed(2) + '%', '\u2705') },
      { type: 'patch', target: 'last-update', content: 'Last update: ' + new Date().toLocaleTimeString() }
    ]);
  }, 2000);

  // Clean up on disconnect
  client.on('_disconnect', function() {
    clearInterval(interval);
  });

  client.on('refresh', function() {
    stats.users = Math.floor(Math.random() * 500) + 100;
    stats.requests = Math.floor(Math.random() * 10000) + 1000;
    stats.errors = Math.floor(Math.random() * 20);
    renderDashboard();
  });
});

// =========================================================================
// Start
// =========================================================================
app.listen(function() {
  console.log('bwserve running at http://localhost:' + app.port);
  console.log('  Counter:   http://localhost:' + app.port + '/');
  console.log('  Dashboard: http://localhost:' + app.port + '/dashboard');
});
