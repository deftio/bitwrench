#!/usr/bin/env node
// =========================================================================
// Raspberry Pi System Monitor -- bwserve Server
//
// Hardware: Raspberry Pi 3/4/5 with Node.js 18+
// Dependencies: npm install bitwrench (no other deps needed)
//
// GPIO pin assignments:
//   Outputs: GPIO 17 (Status LED), GPIO 22 (Relay 1), GPIO 23 (Relay 2)
//   Inputs:  GPIO 24 (Motion Sensor), GPIO 25 (Door Sensor), GPIO 27 (Button)
//
// Run:   node server.js
// Open:  http://localhost:7902
//
// Reads system metrics directly from /proc and /sys (no psutil).
// Pushes incremental updates to the browser every 2 seconds via SSE.
// GPIO control via sysfs (/sys/class/gpio).
// =========================================================================

import bwserve from 'bitwrench/bwserve';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';

var PORT = 7902;

// -- GPIO pin configuration ------------------------------------------------
var GPIO_PINS = [
  { pin: 17, label: 'Status LED',    mode: 'out' },
  { pin: 22, label: 'Relay 1',       mode: 'out' },
  { pin: 23, label: 'Relay 2',       mode: 'out' },
  { pin: 24, label: 'Motion Sensor', mode: 'in'  },
  { pin: 25, label: 'Door Sensor',   mode: 'in'  },
  { pin: 27, label: 'Button',        mode: 'in'  }
];

// -- System info (static, read once at startup) ----------------------------
function getStaticInfo() {
  var info = {
    model: 'Unknown',
    os: 'Unknown',
    kernel: 'Unknown',
    hostname: 'Unknown',
    ip: '0.0.0.0'
  };
  try {
    info.model = readFileSync('/proc/device-tree/model', 'utf8').replace(/\0/g, '').trim();
  } catch (e) { /* not on a Pi */ }
  try {
    var osRelease = readFileSync('/etc/os-release', 'utf8');
    var match = osRelease.match(/PRETTY_NAME="([^"]+)"/);
    if (match) info.os = match[1];
  } catch (e) { /* */ }
  try {
    info.kernel = readFileSync('/proc/version', 'utf8').split(' ').slice(0, 3).join(' ');
  } catch (e) { /* */ }
  try {
    info.hostname = readFileSync('/etc/hostname', 'utf8').trim();
  } catch (e) { /* */ }
  try {
    // Get the first non-loopback IPv4 address
    var out = execSync("hostname -I 2>/dev/null || echo '0.0.0.0'", { encoding: 'utf8' });
    info.ip = out.trim().split(' ')[0] || '0.0.0.0';
  } catch (e) { /* */ }
  return info;
}

// -- CPU temperature -------------------------------------------------------
function getCpuTemp() {
  try {
    var raw = readFileSync('/sys/class/thermal/thermal_zone0/temp', 'utf8');
    return parseInt(raw, 10) / 1000;
  } catch (e) {
    return -1;
  }
}

// -- CPU usage from /proc/stat ---------------------------------------------
// Returns per-core usage percentages by comparing two snapshots.
var prevCpuTimes = null;

function parseProcStat() {
  try {
    var stat = readFileSync('/proc/stat', 'utf8');
    var lines = stat.split('\n');
    var cores = [];
    for (var i = 0; i < lines.length; i++) {
      // Match cpu0, cpu1, ... (skip the aggregate 'cpu' line)
      if (/^cpu\d+/.test(lines[i])) {
        var parts = lines[i].trim().split(/\s+/);
        // user, nice, system, idle, iowait, irq, softirq, steal
        var user    = parseInt(parts[1], 10);
        var nice    = parseInt(parts[2], 10);
        var system  = parseInt(parts[3], 10);
        var idle    = parseInt(parts[4], 10);
        var iowait  = parseInt(parts[5], 10) || 0;
        var irq     = parseInt(parts[6], 10) || 0;
        var softirq = parseInt(parts[7], 10) || 0;
        var steal   = parseInt(parts[8], 10) || 0;

        var total = user + nice + system + idle + iowait + irq + softirq + steal;
        var busy  = total - idle - iowait;
        cores.push({ busy: busy, total: total });
      }
    }
    return cores;
  } catch (e) {
    return [];
  }
}

function getCpuUsage() {
  var current = parseProcStat();
  if (!prevCpuTimes || prevCpuTimes.length !== current.length) {
    prevCpuTimes = current;
    return current.map(function() { return 0; });
  }
  var usage = [];
  for (var i = 0; i < current.length; i++) {
    var dTotal = current[i].total - prevCpuTimes[i].total;
    var dBusy  = current[i].busy  - prevCpuTimes[i].busy;
    usage.push(dTotal > 0 ? Math.round((dBusy / dTotal) * 100) : 0);
  }
  prevCpuTimes = current;
  return usage;
}

// -- Load average ----------------------------------------------------------
function getLoadAvg() {
  try {
    var raw = readFileSync('/proc/loadavg', 'utf8');
    var parts = raw.trim().split(/\s+/);
    return [parseFloat(parts[0]), parseFloat(parts[1]), parseFloat(parts[2])];
  } catch (e) {
    return [0, 0, 0];
  }
}

// -- Memory from /proc/meminfo ---------------------------------------------
function getMemory() {
  var mem = { totalMB: 0, usedMB: 0, swapTotalMB: 0, swapUsedMB: 0 };
  try {
    var raw = readFileSync('/proc/meminfo', 'utf8');
    var values = {};
    raw.split('\n').forEach(function(line) {
      var m = line.match(/^(\w+):\s+(\d+)/);
      if (m) values[m[1]] = parseInt(m[2], 10); // in kB
    });
    var totalKB     = values.MemTotal     || 0;
    var freeKB      = values.MemFree      || 0;
    var buffersKB   = values.Buffers      || 0;
    var cachedKB    = values.Cached       || 0;
    var sreclaimKB  = values.SReclaimable || 0;
    var usedKB = totalKB - freeKB - buffersKB - cachedKB - sreclaimKB;

    mem.totalMB     = Math.round(totalKB / 1024);
    mem.usedMB      = Math.round(usedKB / 1024);
    mem.swapTotalMB = Math.round((values.SwapTotal || 0) / 1024);
    mem.swapUsedMB  = Math.round(((values.SwapTotal || 0) - (values.SwapFree || 0)) / 1024);
  } catch (e) { /* */ }
  return mem;
}

// -- Disk usage from df ----------------------------------------------------
function getDisk() {
  var disk = { totalGB: 0, usedGB: 0 };
  try {
    // df -B1 / returns bytes; skip the header line
    var out = execSync('df -B1 / 2>/dev/null', { encoding: 'utf8' });
    var lines = out.trim().split('\n');
    if (lines.length >= 2) {
      var parts = lines[1].trim().split(/\s+/);
      // columns: Filesystem 1B-blocks Used Available Use% Mounted
      disk.totalGB = parseFloat(parts[1]) / (1024 * 1024 * 1024);
      disk.usedGB  = parseFloat(parts[2]) / (1024 * 1024 * 1024);
    }
  } catch (e) { /* */ }
  return disk;
}

// -- Network I/O from /proc/net/dev ----------------------------------------
var prevNetBytes = null;
var prevNetTime  = null;

function getNetworkRate() {
  var rate = { rxBytesPerSec: 0, txBytesPerSec: 0 };
  try {
    var raw = readFileSync('/proc/net/dev', 'utf8');
    var rxTotal = 0;
    var txTotal = 0;
    raw.split('\n').forEach(function(line) {
      // Skip header lines and loopback
      if (line.indexOf(':') === -1 || /^\s*lo:/.test(line)) return;
      var parts = line.split(':')[1].trim().split(/\s+/);
      rxTotal += parseInt(parts[0], 10) || 0;  // Receive bytes
      txTotal += parseInt(parts[8], 10) || 0;  // Transmit bytes
    });

    var now = Date.now();
    if (prevNetBytes !== null && prevNetTime !== null) {
      var dt = (now - prevNetTime) / 1000; // seconds
      if (dt > 0) {
        rate.rxBytesPerSec = Math.round((rxTotal - prevNetBytes.rx) / dt);
        rate.txBytesPerSec = Math.round((txTotal - prevNetBytes.tx) / dt);
      }
    }
    prevNetBytes = { rx: rxTotal, tx: txTotal };
    prevNetTime = now;
  } catch (e) { /* */ }
  return rate;
}

// -- Uptime from /proc/uptime ----------------------------------------------
function getUptime() {
  try {
    var raw = readFileSync('/proc/uptime', 'utf8');
    return Math.floor(parseFloat(raw.split(' ')[0]));
  } catch (e) {
    return 0;
  }
}

// -- Top processes ---------------------------------------------------------
function getProcesses(count) {
  count = count || 6;
  var procs = [];
  try {
    var out = execSync(
      'ps aux --sort=-pcpu 2>/dev/null | head -n ' + (count + 1),
      { encoding: 'utf8', timeout: 3000 }
    );
    var lines = out.trim().split('\n');
    // Skip header (first line)
    for (var i = 1; i < lines.length; i++) {
      var parts = lines[i].trim().split(/\s+/);
      if (parts.length < 11) continue;
      procs.push({
        pid:  parseInt(parts[1], 10),
        cpu:  parseFloat(parts[2]),
        mem:  parseFloat(parts[5]) / 1024, // RSS in KB -> MB
        name: parts.slice(10).join(' ')
      });
    }
  } catch (e) { /* */ }
  return procs;
}

// -- GPIO via sysfs --------------------------------------------------------

function gpioExport(pin) {
  var gpioPath = '/sys/class/gpio/gpio' + pin;
  if (!existsSync(gpioPath)) {
    try {
      writeFileSync('/sys/class/gpio/export', String(pin));
    } catch (e) {
      // May fail if already exported or no permission
    }
  }
}

function gpioSetDirection(pin, direction) {
  try {
    gpioExport(pin);
    writeFileSync('/sys/class/gpio/gpio' + pin + '/direction', direction);
  } catch (e) { /* */ }
}

function gpioRead(pin) {
  try {
    var val = readFileSync('/sys/class/gpio/gpio' + pin + '/value', 'utf8').trim();
    return parseInt(val, 10);
  } catch (e) {
    return 0;
  }
}

function gpioWrite(pin, value) {
  try {
    writeFileSync('/sys/class/gpio/gpio' + pin + '/value', String(value));
  } catch (e) { /* */ }
}

// Initialize GPIO pins
function initGpio() {
  GPIO_PINS.forEach(function(g) {
    gpioSetDirection(g.pin, g.mode === 'out' ? 'out' : 'in');
  });
}

function readAllGpio() {
  return GPIO_PINS.map(function(g) {
    return {
      pin:   g.pin,
      label: g.label,
      mode:  g.mode === 'out' ? 'OUT' : 'IN',
      value: gpioRead(g.pin)
    };
  });
}

// -- Helpers ---------------------------------------------------------------

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}

function formatUptime(seconds) {
  var d = Math.floor(seconds / 86400);
  var h = Math.floor((seconds % 86400) / 3600);
  var m = Math.floor((seconds % 3600) / 60);
  return d + 'd ' + h + 'h ' + m + 'm';
}

function tempVariant(temp) {
  if (temp > 70) return 'danger';
  if (temp > 55) return 'warning';
  return 'success';
}

function cpuVariant(pct) {
  if (pct > 80) return 'danger';
  if (pct > 50) return 'warning';
  return 'primary';
}

function memVariant(pct) {
  if (pct > 85) return 'danger';
  if (pct > 60) return 'warning';
  return 'info';
}

function diskVariant(pct) {
  if (pct > 90) return 'danger';
  if (pct > 70) return 'warning';
  return 'info';
}

// -- TACO builders ---------------------------------------------------------
// Each builder returns a TACO with stable ids for incremental patching.

function buildOverviewCards(cpuTemp, cpuAvg, memPct, memUsedMB, memTotalMB, diskPct, diskUsedGB, diskTotalGB) {
  return {
    t: 'div', a: { id: 'overview', class: 'bw_row' }, c: [
      {
        t: 'div', a: { class: 'bw_col bw_col_xs_6 bw_col_md_3' }, c: {
          t: 'div', a: { id: 'card-temp', class: 'bw_card bw_' + tempVariant(cpuTemp), style: 'text-align:center;padding:1rem;margin-bottom:0.5rem' }, c: [
            { t: 'div', a: { id: 'val-temp', style: 'font-size:1.75rem;font-weight:700' }, c: cpuTemp.toFixed(1) + '\u00B0C' },
            { t: 'div', a: { style: 'font-size:0.8rem;opacity:0.8' }, c: 'CPU Temp' }
          ]
        }
      },
      {
        t: 'div', a: { class: 'bw_col bw_col_xs_6 bw_col_md_3' }, c: {
          t: 'div', a: { id: 'card-cpu', class: 'bw_card bw_' + cpuVariant(cpuAvg), style: 'text-align:center;padding:1rem;margin-bottom:0.5rem' }, c: [
            { t: 'div', a: { id: 'val-cpu', style: 'font-size:1.75rem;font-weight:700' }, c: cpuAvg + '%' },
            { t: 'div', a: { style: 'font-size:0.8rem;opacity:0.8' }, c: 'CPU Usage' }
          ]
        }
      },
      {
        t: 'div', a: { class: 'bw_col bw_col_xs_6 bw_col_md_3' }, c: {
          t: 'div', a: { id: 'card-mem', class: 'bw_card bw_' + memVariant(memPct), style: 'text-align:center;padding:1rem;margin-bottom:0.5rem' }, c: [
            { t: 'div', a: { id: 'val-mem', style: 'font-size:1.75rem;font-weight:700' }, c: memPct + '%' },
            { t: 'div', a: { id: 'lbl-mem', style: 'font-size:0.8rem;opacity:0.8' }, c: 'Memory (' + memUsedMB + '/' + memTotalMB + ' MB)' }
          ]
        }
      },
      {
        t: 'div', a: { class: 'bw_col bw_col_xs_6 bw_col_md_3' }, c: {
          t: 'div', a: { id: 'card-disk', class: 'bw_card bw_' + diskVariant(diskPct), style: 'text-align:center;padding:1rem;margin-bottom:0.5rem' }, c: [
            { t: 'div', a: { id: 'val-disk', style: 'font-size:1.75rem;font-weight:700' }, c: diskPct + '%' },
            { t: 'div', a: { id: 'lbl-disk', style: 'font-size:0.8rem;opacity:0.8' }, c: 'Disk (' + diskUsedGB.toFixed(1) + '/' + diskTotalGB.toFixed(0) + ' GB)' }
          ]
        }
      }
    ]
  };
}

function buildCpuBars(cpuUsage) {
  return {
    t: 'div', a: { id: 'cpu-bars', class: 'bw_card', style: 'padding:1rem;margin-bottom:1rem' }, c: [
      { t: 'h3', a: { style: 'margin:0 0 0.5rem;font-size:1rem' }, c: 'CPU Cores' },
      {
        t: 'div', a: { id: 'cpu-bars-inner' }, c: cpuUsage.map(function(pct, i) {
          var variant = cpuVariant(pct);
          return {
            t: 'div', a: { style: 'margin-bottom:0.4rem' }, c: [
              { t: 'div', a: { style: 'display:flex;justify-content:space-between;font-size:0.75rem;margin-bottom:2px' }, c: [
                { t: 'span', c: 'Core ' + i },
                { t: 'span', c: pct + '%' }
              ]},
              { t: 'div', a: { style: 'background:#e2e8f0;border-radius:4px;height:8px;overflow:hidden' }, c:
                { t: 'div', a: { style: 'height:100%;border-radius:4px;width:' + pct + '%;background:var(--bw-' + variant + ',#2563eb);transition:width 0.5s' } }
              }
            ]
          };
        })
      }
    ]
  };
}

function buildMemCard(memUsedMB, memTotalMB, swapUsedMB, swapTotalMB) {
  var memPct  = memTotalMB > 0 ? Math.round(memUsedMB / memTotalMB * 100) : 0;
  var swapPct = swapTotalMB > 0 ? Math.round(swapUsedMB / swapTotalMB * 100) : 0;
  return {
    t: 'div', a: { id: 'mem-card', class: 'bw_card', style: 'padding:1rem;margin-bottom:1rem' }, c: [
      { t: 'h3', a: { style: 'margin:0 0 0.5rem;font-size:1rem' }, c: 'Memory' },
      { t: 'div', a: { style: 'margin-bottom:0.5rem' }, c: [
        { t: 'div', a: { style: 'font-size:0.75rem;margin-bottom:2px' }, c: 'RAM: ' + memUsedMB + ' / ' + memTotalMB + ' MB' },
        { t: 'div', a: { style: 'background:#e2e8f0;border-radius:4px;height:8px;overflow:hidden' }, c:
          { t: 'div', a: { style: 'height:100%;border-radius:4px;width:' + memPct + '%;background:var(--bw-primary,#2563eb);transition:width 0.5s' } }
        }
      ]},
      { t: 'div', c: [
        { t: 'div', a: { style: 'font-size:0.75rem;margin-bottom:2px' }, c: 'Swap: ' + swapUsedMB + ' / ' + swapTotalMB + ' MB' },
        { t: 'div', a: { style: 'background:#e2e8f0;border-radius:4px;height:8px;overflow:hidden' }, c:
          { t: 'div', a: { style: 'height:100%;border-radius:4px;width:' + swapPct + '%;background:var(--bw-info,#0ea5e9);transition:width 0.5s' } }
        }
      ]}
    ]
  };
}

function buildGpioControls(gpioState) {
  return {
    t: 'div', a: { id: 'gpio-section' }, c: [
      { t: 'h2', a: { style: 'font-size:1.1rem;margin:1rem 0 0.5rem' }, c: 'GPIO Controls' },
      {
        t: 'div', a: { class: 'bw_row' }, c: gpioState.map(function(g) {
          var isOut = g.mode === 'OUT';
          return {
            t: 'div', a: { class: 'bw_col bw_col_xs_6 bw_col_md_4' }, c: {
              t: 'div', a: { id: 'gpio-' + g.pin, class: 'bw_card', style: 'padding:0.75rem;margin-bottom:0.5rem' }, c: [
                { t: 'div', a: { style: 'font-size:0.85rem;font-weight:600;margin-bottom:0.3rem' },
                  c: 'GPIO ' + g.pin + ' -- ' + g.label },
                { t: 'div', a: { style: 'margin-bottom:0.3rem' }, c: [
                  { t: 'span', a: { class: 'bw_badge bw_' + (isOut ? 'primary' : 'warning'), style: 'font-size:0.7rem;padding:2px 6px;border-radius:9px' }, c: g.mode },
                  ' ',
                  { t: 'span', a: {
                    id: 'gpio-val-' + g.pin,
                    class: 'bw_badge bw_' + (g.value ? 'success' : 'secondary'),
                    style: 'font-size:0.7rem;padding:2px 6px;border-radius:9px'
                  }, c: g.value ? 'HIGH' : 'LOW' }
                ]},
                isOut
                  ? { t: 'button', a: {
                      class: 'bw_btn bw_' + (g.value ? 'danger' : 'success'),
                      style: 'font-size:0.75rem;padding:4px 10px',
                      'data-bw-action': 'gpio-toggle',
                      'data-bw-id': String(g.pin)
                    }, c: g.value ? 'Turn Off' : 'Turn On' }
                  : { t: 'span', a: { style: 'font-size:0.7rem;opacity:0.6' }, c: 'Read-only input' }
              ]
            }
          };
        })
      }
    ]
  };
}

function buildProcessTable(procs) {
  var rows = procs.map(function(p) {
    return { t: 'tr', c: [
      { t: 'td', c: String(p.pid) },
      { t: 'td', c: p.name },
      { t: 'td', c: p.cpu.toFixed(1) + '%' },
      { t: 'td', c: p.mem.toFixed(1) + ' MB' }
    ]};
  });
  return {
    t: 'div', a: { id: 'proc-section' }, c: [
      { t: 'h2', a: { style: 'font-size:1.1rem;margin:1rem 0 0.5rem' }, c: 'Processes' },
      { t: 'table', a: { class: 'bw_table', style: 'width:100%;font-size:0.8rem' }, c: [
        { t: 'thead', c: { t: 'tr', c: [
          { t: 'th', c: 'PID' },
          { t: 'th', c: 'Process' },
          { t: 'th', c: 'CPU %' },
          { t: 'th', c: 'Memory' }
        ]}},
        { t: 'tbody', a: { id: 'proc-body' }, c: rows }
      ]}
    ]
  };
}

function buildInfoTable(info, uptime, loadAvg, netRate) {
  var rows = [
    ['Model',      info.model],
    ['OS',         info.os],
    ['Kernel',     info.kernel],
    ['Hostname',   info.hostname],
    ['IP Address', info.ip],
    ['Uptime',     formatUptime(uptime)],
    ['Load Avg',   loadAvg.map(function(v) { return v.toFixed(2); }).join(', ')],
    ['Network RX', formatBytes(netRate.rxBytesPerSec) + '/s'],
    ['Network TX', formatBytes(netRate.txBytesPerSec) + '/s']
  ];
  return {
    t: 'div', a: { id: 'info-section' }, c: [
      { t: 'h2', a: { style: 'font-size:1.1rem;margin:1rem 0 0.5rem' }, c: 'System Info' },
      { t: 'table', a: { class: 'bw_table', style: 'width:100%;font-size:0.8rem' }, c: [
        { t: 'thead', c: { t: 'tr', c: [
          { t: 'th', c: 'Property' },
          { t: 'th', c: 'Value' }
        ]}},
        { t: 'tbody', a: { id: 'info-body' }, c: rows.map(function(r) {
          return { t: 'tr', c: [
            { t: 'td', a: { style: 'font-weight:600' }, c: r[0] },
            { t: 'td', c: r[1] }
          ]};
        })}
      ]}
    ]
  };
}

function buildLogSection(logEntries) {
  return {
    t: 'div', a: { id: 'log-section' }, c: [
      { t: 'h2', a: { style: 'font-size:1.1rem;margin:1rem 0 0.5rem' }, c: 'Event Log' },
      { t: 'div', a: { id: 'log-list', style: 'max-height:200px;overflow-y:auto;border:1px solid #334155;border-radius:4px;padding:0.5rem;font-size:0.75rem;font-family:monospace' },
        c: logEntries.length
          ? logEntries.map(function(entry) { return { t: 'div', a: { style: 'padding:2px 0;border-bottom:1px solid #1e293b' }, c: entry }; })
          : [{ t: 'div', a: { style: 'opacity:0.5' }, c: 'Waiting for events...' }]
      }
    ]
  };
}

// -- Create bwserve app ----------------------------------------------------

var app = bwserve.create({
  port: PORT,
  title: 'Raspberry Pi System Monitor',
  theme: { primary: '#c51a4a', secondary: '#2563eb' }
});

// Try to initialize GPIO (will silently fail on non-Pi hardware)
initGpio();

// Read static system info once
var sysInfo = getStaticInfo();

// Warm up CPU usage (needs two snapshots to compute delta)
getCpuUsage();

// =========================================================================
// Page handler: /
// =========================================================================
app.page('/', function(client) {
  var logEntries = [];

  function addLog(msg) {
    var ts = new Date().toLocaleTimeString();
    logEntries.unshift(ts + ' -- ' + msg);
    if (logEntries.length > 25) logEntries.pop();
  }

  addLog('Client connected from browser');
  addLog('Monitoring ' + sysInfo.hostname + ' (' + sysInfo.ip + ')');

  // -- Initial full render -----------------------------------------------
  var cpuTemp   = getCpuTemp();
  var cpuUsage  = getCpuUsage();
  var cpuAvg    = cpuUsage.length > 0
    ? Math.round(cpuUsage.reduce(function(a, b) { return a + b; }, 0) / cpuUsage.length)
    : 0;
  var mem       = getMemory();
  var memPct    = mem.totalMB > 0 ? Math.round(mem.usedMB / mem.totalMB * 100) : 0;
  var disk      = getDisk();
  var diskPct   = disk.totalGB > 0 ? Math.round(disk.usedGB / disk.totalGB * 100) : 0;
  var uptime    = getUptime();
  var loadAvg   = getLoadAvg();
  var netRate   = getNetworkRate();
  var procs     = getProcesses(6);
  var gpioState = readAllGpio();

  client.render('#app', {
    t: 'div', a: { style: 'max-width:960px;margin:0 auto;padding:1rem;background:#0f172a;color:#e2e8f0;min-height:100vh' }, c: [
      { t: 'h1', a: { style: 'font-size:1.3rem;margin:0 0 1rem' }, c: 'Raspberry Pi System Monitor' },
      buildOverviewCards(cpuTemp, cpuAvg, memPct, mem.usedMB, mem.totalMB, diskPct, disk.usedGB, disk.totalGB),
      { t: 'div', a: { class: 'bw_row' }, c: [
        { t: 'div', a: { class: 'bw_col bw_col_xs_12 bw_col_md_6' }, c: buildCpuBars(cpuUsage) },
        { t: 'div', a: { class: 'bw_col bw_col_xs_12 bw_col_md_6' }, c: buildMemCard(mem.usedMB, mem.totalMB, mem.swapUsedMB, mem.swapTotalMB) }
      ]},
      buildGpioControls(gpioState),
      { t: 'div', a: { class: 'bw_row' }, c: [
        { t: 'div', a: { class: 'bw_col bw_col_xs_12 bw_col_md_6' }, c: buildProcessTable(procs) },
        { t: 'div', a: { class: 'bw_col bw_col_xs_12 bw_col_md_6' }, c: buildInfoTable(sysInfo, uptime, loadAvg, netRate) }
      ]},
      buildLogSection(logEntries)
    ]
  });

  // -- Incremental updates every 2 seconds --------------------------------
  var interval = setInterval(function() {
    if (client._closed) {
      clearInterval(interval);
      return;
    }

    var t   = getCpuTemp();
    var cu  = getCpuUsage();
    var avg = cu.length > 0
      ? Math.round(cu.reduce(function(a, b) { return a + b; }, 0) / cu.length)
      : 0;
    var m   = getMemory();
    var mp  = m.totalMB > 0 ? Math.round(m.usedMB / m.totalMB * 100) : 0;
    var d   = getDisk();
    var dp  = d.totalGB > 0 ? Math.round(d.usedGB / d.totalGB * 100) : 0;
    var ut  = getUptime();
    var la  = getLoadAvg();
    var nr  = getNetworkRate();
    var pr  = getProcesses(6);
    var gs  = readAllGpio();

    // Check for GPIO input changes and log them
    gs.forEach(function(g) {
      if (g.mode === 'IN') {
        var prev = gpioState.find(function(p) { return p.pin === g.pin; });
        if (prev && prev.value !== g.value) {
          addLog('GPIO ' + g.pin + ' (' + g.label + ') changed to ' + (g.value ? 'HIGH' : 'LOW'));
        }
      }
    });
    gpioState = gs;

    // Use batch to push all updates in a single SSE frame
    client.batch([
      // Replace entire sections that have complex structure
      { type: 'replace', target: '#overview',     node: buildOverviewCards(t, avg, mp, m.usedMB, m.totalMB, dp, d.usedGB, d.totalGB) },
      { type: 'replace', target: '#cpu-bars',     node: buildCpuBars(cu) },
      { type: 'replace', target: '#mem-card',     node: buildMemCard(m.usedMB, m.totalMB, m.swapUsedMB, m.swapTotalMB) },
      { type: 'replace', target: '#gpio-section', node: buildGpioControls(gs) },
      { type: 'replace', target: '#proc-body',    node: {
        t: 'tbody', a: { id: 'proc-body' }, c: pr.map(function(p) {
          return { t: 'tr', c: [
            { t: 'td', c: String(p.pid) },
            { t: 'td', c: p.name },
            { t: 'td', c: p.cpu.toFixed(1) + '%' },
            { t: 'td', c: p.mem.toFixed(1) + ' MB' }
          ]};
        })
      }},
      { type: 'replace', target: '#info-body',    node: {
        t: 'tbody', a: { id: 'info-body' }, c: [
          ['Model',      sysInfo.model],
          ['OS',         sysInfo.os],
          ['Kernel',     sysInfo.kernel],
          ['Hostname',   sysInfo.hostname],
          ['IP Address', sysInfo.ip],
          ['Uptime',     formatUptime(ut)],
          ['Load Avg',   la.map(function(v) { return v.toFixed(2); }).join(', ')],
          ['Network RX', formatBytes(nr.rxBytesPerSec) + '/s'],
          ['Network TX', formatBytes(nr.txBytesPerSec) + '/s']
        ].map(function(r) {
          return { t: 'tr', c: [
            { t: 'td', a: { style: 'font-weight:600' }, c: r[0] },
            { t: 'td', c: r[1] }
          ]};
        })
      }},
      { type: 'replace', target: '#log-section',  node: buildLogSection(logEntries) }
    ]);
  }, 2000);

  // -- GPIO toggle action -------------------------------------------------
  client.on('gpio-toggle', function(data) {
    var pin = parseInt(data.bwId, 10);
    if (isNaN(pin)) return;

    // Find the pin config -- only allow output pins
    var pinConfig = GPIO_PINS.find(function(g) { return g.pin === pin && g.mode === 'out'; });
    if (!pinConfig) return;

    // Read current value, write the inverse
    var current = gpioRead(pin);
    var next = current ? 0 : 1;
    gpioWrite(pin, next);

    addLog('GPIO ' + pin + ' (' + pinConfig.label + ') set to ' + (next ? 'HIGH' : 'LOW'));

    // Immediately push the updated GPIO section and log
    gpioState = readAllGpio();
    client.batch([
      { type: 'replace', target: '#gpio-section', node: buildGpioControls(gpioState) },
      { type: 'replace', target: '#log-section',  node: buildLogSection(logEntries) }
    ]);
  });
});

// =========================================================================
// Start server
// =========================================================================
app.listen(function() {
  console.log('Raspberry Pi System Monitor running at http://localhost:' + PORT);
  console.log('');
  console.log('  Hardware: Reads from /proc, /sys (Linux only)');
  console.log('  GPIO:     Outputs 17, 22, 23 | Inputs 24, 25, 27');
  console.log('  Protocol: bwserve SSE push every 2 seconds');
  console.log('');
  console.log('On non-Linux systems, metrics will show 0 / -1 (safe to run anywhere).');
});
