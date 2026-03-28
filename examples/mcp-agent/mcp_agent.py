#!/usr/bin/env python3
"""
bwmcp Python Agent Example
===========================

Connects to the bitwrench MCP server over stdio and builds a live
dashboard. Demonstrates the full agent workflow:

  1. Initialize MCP connection
  2. Call bitwrench_start_here for orientation
  3. Build components (stat cards, table)
  4. Compose into a grid layout
  5. Generate a standalone HTML page with theme
  6. (Optional) Render live in browser, screenshot, inspect

Usage:
  python3 mcp_agent.py                          # Build dashboard.html
  python3 mcp_agent.py --live                    # Also render live + screenshot
  python3 mcp_agent.py --theme forest            # Use a different theme
  python3 mcp_agent.py --live --screenshot out.png

Requires: Python 3.8+, Node.js 18+, bitwrench repo (runs from source)
No pip dependencies -- stdlib only.
"""

import subprocess
import json
import sys
import os
import time
import base64
import argparse

# Resolve path to bwmcp relative to this script
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, '..', '..'))
BWMCP_PATH = os.path.join(REPO_ROOT, 'bin', 'bwmcp.js')


class BwmcpClient:
    """Minimal MCP client that talks to bwmcp over stdio."""

    def __init__(self, port=7910, no_browser=True, theme=None):
        args = ['node', BWMCP_PATH]
        if no_browser:
            args.append('--no-browser')
        else:
            args.extend(['--port', str(port)])
        if theme:
            args.extend(['--theme', theme])

        self.proc = subprocess.Popen(
            args,
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            bufsize=1  # line-buffered
        )
        self._next_id = 1

        # Wait for server ready
        self._wait_ready()

    def _wait_ready(self, timeout=5.0):
        """Wait for bwmcp to print 'MCP server ready' on stderr."""
        import select
        deadline = time.time() + timeout
        buf = ''
        while time.time() < deadline:
            # Non-blocking read from stderr
            try:
                if hasattr(select, 'select'):
                    ready, _, _ = select.select([self.proc.stderr], [], [], 0.1)
                    if ready:
                        ch = self.proc.stderr.read(1)
                        if ch:
                            buf += ch
                            if 'MCP server ready' in buf:
                                return
                else:
                    time.sleep(0.2)
                    return  # No select on Windows, just wait
            except Exception:
                time.sleep(0.1)
        # Timeout is OK -- server might already be ready

    def send(self, method, params=None):
        """Send a JSON-RPC request and return the response."""
        msg_id = self._next_id
        self._next_id += 1
        msg = {
            'jsonrpc': '2.0',
            'id': msg_id,
            'method': method,
            'params': params or {}
        }
        line = json.dumps(msg) + '\n'
        self.proc.stdin.write(line)
        self.proc.stdin.flush()

        # Read response line
        resp_line = self.proc.stdout.readline()
        if not resp_line:
            raise RuntimeError('bwmcp process closed stdout')
        return json.loads(resp_line)

    def notify(self, method, params=None):
        """Send a JSON-RPC notification (no response expected)."""
        msg = {
            'jsonrpc': '2.0',
            'method': method,
            'params': params or {}
        }
        self.proc.stdin.write(json.dumps(msg) + '\n')
        self.proc.stdin.flush()

    def call_tool(self, name, arguments=None):
        """Call an MCP tool and return the result."""
        resp = self.send('tools/call', {
            'name': name,
            'arguments': arguments or {}
        })
        if 'error' in resp:
            raise RuntimeError(f"Tool error: {resp['error']['message']}")
        return resp['result']

    def initialize(self):
        """Perform MCP initialization handshake."""
        resp = self.send('initialize', {
            'protocolVersion': '2024-11-05',
            'capabilities': {},
            'clientInfo': {'name': 'python-mcp-agent', 'version': '1.0.0'}
        })
        self.notify('notifications/initialized')
        return resp['result']

    def list_tools(self):
        """Get list of available tools."""
        resp = self.send('tools/list')
        return resp['result']['tools']

    def close(self):
        """Shut down the bwmcp process."""
        try:
            self.proc.stdin.close()
            self.proc.terminate()
            self.proc.wait(timeout=3)
        except Exception:
            self.proc.kill()


def build_dashboard(client, theme='ocean', live=False, screenshot_path=None):
    """Build a sales metrics dashboard using bwmcp tools."""

    # ── Phase 1: Initialize ──
    print('\n=== Phase 1: Initialize MCP Connection ===')
    info = client.initialize()
    print(f"  Server: {info['serverInfo']['name']} v{info['serverInfo']['version']}")

    # ── Phase 2: Orient ──
    print('\n=== Phase 2: Read Orientation ===')
    result = client.call_tool('bitwrench_start_here')
    text = result['content'][0]['text']
    # Print first 3 lines of orientation
    for line in text.split('\n')[:3]:
        print(f'  {line}')
    print(f'  ... ({len(text)} chars total)')

    # ── Phase 3: Discover Tools ──
    print('\n=== Phase 3: Discover Available Tools ===')
    tools = client.list_tools()
    print(f'  {len(tools)} tools available:')
    for tool in tools[:8]:
        print(f'    - {tool["name"]}: {tool["description"][:60]}...')
    if len(tools) > 8:
        print(f'    ... and {len(tools) - 8} more')

    # ── Phase 4: Build Components ──
    print('\n=== Phase 4: Build Dashboard Components ===')

    # Stat cards
    stats = [
        {'label': 'Revenue',  'value': '$128,430', 'change': '+12.5%', 'variant': 'primary',  'icon': '$'},
        {'label': 'Users',    'value': '8,249',    'change': '+3.2%',  'variant': 'success',  'icon': 'U'},
        {'label': 'Orders',   'value': '1,543',    'change': '-2.1%',  'variant': 'info',     'icon': '#'},
    ]

    stat_tacos = []
    for s in stats:
        result = client.call_tool('make_stat_card', s)
        taco = result['structuredContent']
        stat_tacos.append(taco)
        print(f'  Built stat card: {s["label"]} = {s["value"]}')

    # Table
    table_result = client.call_tool('make_table', {
        'data': [
            {'product': 'Widget Pro',   'units': 342,  'revenue': '$45,200', 'status': 'Active'},
            {'product': 'Gadget Plus',  'units': 256,  'revenue': '$38,100', 'status': 'Active'},
            {'product': 'Doohickey XL', 'units': 189,  'revenue': '$22,680', 'status': 'Active'},
            {'product': 'Thingamajig',  'units': 94,   'revenue': '$12,450', 'status': 'Low Stock'},
            {'product': 'Whatsit Mini', 'units': 67,   'revenue': '$8,040',  'status': 'Discontinued'},
        ],
        'columns': [
            {'key': 'product', 'label': 'Product'},
            {'key': 'units',   'label': 'Units Sold'},
            {'key': 'revenue', 'label': 'Revenue'},
            {'key': 'status',  'label': 'Status'},
        ],
        'striped': True,
        'hover': True
    })
    table_taco = table_result['structuredContent']
    print('  Built data table: 5 products x 4 columns')

    # Alert
    alert_result = client.call_tool('make_alert', {
        'content': 'Q1 targets exceeded by 12%. Review full report for breakdown by region.',
        'variant': 'success',
        'dismissible': True
    })
    alert_taco = alert_result['structuredContent']
    print('  Built alert: Q1 targets success message')

    # ── Phase 5: Compose Layout ──
    print('\n=== Phase 5: Compose Grid Layout ===')

    layout = {
        't': 'div', 'a': {'class': 'bw_container'}, 'c': [
            # Page header
            {'t': 'div', 'a': {'style': 'padding: 1.5rem 0 1rem;'}, 'c': [
                {'t': 'h1', 'c': 'Sales Dashboard'},
                {'t': 'p', 'a': {'style': 'color: #666; margin-top: 0.25rem;'},
                 'c': 'Q1 2026 Metrics Overview'}
            ]},
            # Success alert
            alert_taco,
            # Stat cards row
            {'t': 'div', 'a': {'class': 'bw_row'}, 'c': [
                {'t': 'div', 'a': {'class': 'bw_col'}, 'c': [stat_tacos[0]]},
                {'t': 'div', 'a': {'class': 'bw_col'}, 'c': [stat_tacos[1]]},
                {'t': 'div', 'a': {'class': 'bw_col'}, 'c': [stat_tacos[2]]},
            ]},
            # Table section
            {'t': 'div', 'a': {'style': 'margin-top: 1.5rem;'}, 'c': [
                {'t': 'h2', 'c': 'Top Products'},
                table_taco
            ]}
        ]
    }
    print('  Layout: container > header + alert + 3-col stat row + table')

    # ── Phase 6: Build Standalone Page ──
    print(f'\n=== Phase 6: Build Standalone Page (theme: {theme}) ===')
    page_result = client.call_tool('build_page', {
        'title': 'Sales Dashboard -- Q1 2026',
        'theme': theme,
        'content': layout
    })
    html = page_result['content'][0]['text']
    html_path = os.path.join(os.getcwd(), 'dashboard.html')
    with open(html_path, 'w') as f:
        f.write(html)
    print(f'  Saved: {html_path} ({len(html):,} bytes)')

    # ── Phase 7-9: Live Rendering (optional) ──
    if live:
        print('\n=== Phase 7: Render Live in Browser ===')
        render_result = client.call_tool('render_live', {
            'target': '#app',
            'taco': layout,
            'action': 'replace'
        })
        status = json.loads(render_result['content'][0]['text'])
        print(f'  Status: {status["status"]}, clients: {status["clientCount"]}')

        if status['clientCount'] == 0:
            print('  No browser connected. Open http://localhost:7910 in a browser.')
            print('  Waiting 5 seconds for browser connection...')
            time.sleep(5)
            # Re-render after browser connects
            render_result = client.call_tool('render_live', {
                'target': '#app',
                'taco': layout,
                'action': 'replace'
            })
            status = json.loads(render_result['content'][0]['text'])
            print(f'  Re-rendered. Clients: {status["clientCount"]}')

        if status['clientCount'] > 0:
            # Give browser a moment to render
            time.sleep(1)

            print('\n=== Phase 8: Capture Screenshot ===')
            try:
                ss_result = client.call_tool('screenshot', {'selector': 'body'})
                content = ss_result['content'][0]
                if content['type'] == 'image':
                    img_data = base64.b64decode(content['data'])
                    img_path = screenshot_path or os.path.join(os.getcwd(), 'dashboard.png')
                    with open(img_path, 'wb') as f:
                        f.write(img_data)
                    print(f'  Saved: {img_path} ({len(img_data):,} bytes)')
                else:
                    print(f'  Screenshot returned text: {content["text"][:100]}')
            except Exception as e:
                print(f'  Screenshot failed: {e}')

            print('\n=== Phase 9: Inspect DOM ===')
            try:
                # Count stat cards
                count_result = client.call_tool('query_dom', {
                    'code': 'document.querySelectorAll(".bw-stat-card, .bw_stat_card").length'
                })
                print(f'  Stat cards in DOM: {count_result["content"][0]["text"]}')

                # Get page title
                title_result = client.call_tool('query_dom', {
                    'code': 'document.querySelector("h1") ? document.querySelector("h1").textContent : "none"'
                })
                print(f'  Page title: {title_result["content"][0]["text"]}')

                # Count table rows
                rows_result = client.call_tool('query_dom', {
                    'code': 'document.querySelectorAll("tbody tr").length'
                })
                print(f'  Table rows: {rows_result["content"][0]["text"]}')
            except Exception as e:
                print(f'  DOM query failed: {e}')

    print('\n=== Done ===')


def main():
    parser = argparse.ArgumentParser(
        description='bwmcp Python Agent -- builds a dashboard via MCP'
    )
    parser.add_argument('--live', action='store_true',
                        help='Enable live browser rendering + screenshot')
    parser.add_argument('--theme', default='ocean',
                        help='Theme preset (default: ocean)')
    parser.add_argument('--port', type=int, default=7910,
                        help='bwserve port for live mode (default: 7910)')
    parser.add_argument('--screenshot', default=None,
                        help='Screenshot output path (default: dashboard.png)')
    args = parser.parse_args()

    # Verify bwmcp exists
    if not os.path.exists(BWMCP_PATH):
        print(f'Error: bwmcp not found at {BWMCP_PATH}')
        print('Run this script from within the bitwrench repo.')
        sys.exit(1)

    print(f'Starting bwmcp (live={args.live}, theme={args.theme})...')

    client = BwmcpClient(
        port=args.port,
        no_browser=not args.live,
        theme=args.theme
    )

    try:
        build_dashboard(
            client,
            theme=args.theme,
            live=args.live,
            screenshot_path=args.screenshot
        )
    except Exception as e:
        print(f'\nError: {e}', file=sys.stderr)
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        client.close()


if __name__ == '__main__':
    main()
