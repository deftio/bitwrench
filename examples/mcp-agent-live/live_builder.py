#!/usr/bin/env python3
"""
live_builder.py -- Watch an LLM build UI in real-time
======================================================

Connects a local LLM (ollama, lmstudio, openrouter, openai) to bwmcp
and builds a UI live in the browser. You type a prompt, the LLM decides
what to build, and you watch components appear one by one.

Usage:
  python3 live_builder.py --provider ollama --model llama3.2
  python3 live_builder.py --provider lmstudio
  python3 live_builder.py --provider openrouter --model meta-llama/llama-3.2-3b-instruct:free
  python3 live_builder.py --provider openai --model gpt-4o-mini
  python3 live_builder.py --prompt "Build a project management dashboard"

Requires: Python 3.8+, Node.js 18+, a running LLM provider.
No pip dependencies -- stdlib only.
"""

import subprocess
import json
import sys
import os
import time
import re
import argparse
from urllib.request import Request, urlopen
from urllib.error import URLError, HTTPError

# ─── Paths ───────────────────────────────────────────────────────────────

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, '..', '..'))
BWMCP_PATH = os.path.join(REPO_ROOT, 'bin', 'bwmcp.js')

# ─── LLM Client ─────────────────────────────────────────────────────────

PROVIDERS = {
    'ollama':     {'url': 'http://localhost:11434/v1/chat/completions', 'key_env': None},
    'lmstudio':   {'url': 'http://localhost:1234/v1/chat/completions',  'key_env': None},
    'openrouter': {'url': 'https://openrouter.ai/api/v1/chat/completions', 'key_env': 'OPENROUTER_API_KEY'},
    'openai':     {'url': 'https://api.openai.com/v1/chat/completions', 'key_env': 'OPENAI_API_KEY'},
}

DEFAULT_MODELS = {
    'ollama':     'llama3.2',
    'lmstudio':   'default',
    'openrouter': 'meta-llama/llama-3.2-3b-instruct:free',
    'openai':     'gpt-4o-mini',
}


class LLMClient:
    """OpenAI-compatible chat completions client. Works with all providers above."""

    def __init__(self, provider='ollama', model=None, api_key=None, base_url=None):
        info = PROVIDERS.get(provider, {})
        self.url = base_url or info.get('url', '')
        self.model = model or DEFAULT_MODELS.get(provider, 'default')
        self.provider = provider

        # Resolve API key
        self.api_key = api_key
        if not self.api_key and info.get('key_env'):
            self.api_key = os.environ.get(info['key_env'])
            if not self.api_key:
                raise RuntimeError(
                    f'{provider} requires {info["key_env"]} environment variable. '
                    f'Set it or pass --api-key.'
                )

    def chat(self, messages, temperature=0.7):
        """Send a chat completion request. Returns the assistant message text."""
        body = json.dumps({
            'model': self.model,
            'messages': messages,
            'temperature': temperature,
        }).encode('utf-8')

        headers = {'Content-Type': 'application/json'}
        if self.api_key:
            headers['Authorization'] = f'Bearer {self.api_key}'

        req = Request(self.url, data=body, headers=headers, method='POST')
        try:
            with urlopen(req, timeout=120) as resp:
                data = json.loads(resp.read().decode('utf-8'))
                return data['choices'][0]['message']['content']
        except HTTPError as e:
            err_body = e.read().decode('utf-8', errors='replace')
            raise RuntimeError(f'LLM API error {e.code}: {err_body[:300]}')
        except URLError as e:
            raise RuntimeError(
                f'Cannot reach {self.provider} at {self.url} -- {e.reason}\n'
                f'Is {self.provider} running?'
            )


# ─── bwmcp Client ────────────────────────────────────────────────────────

class BwmcpClient:
    """MCP client that talks to bwmcp over stdio."""

    def __init__(self, port=7910, open_browser=True, theme=None):
        args = ['node', BWMCP_PATH, '--port', str(port)]
        if not open_browser:
            args.append('--no-browser')
        if theme:
            args.extend(['--theme', theme])

        self.port = port
        self.proc = subprocess.Popen(
            args,
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            bufsize=1
        )
        self._next_id = 1
        self._wait_ready()

    def _wait_ready(self, timeout=5.0):
        import select
        deadline = time.time() + timeout
        buf = ''
        while time.time() < deadline:
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
                    return
            except Exception:
                time.sleep(0.1)

    def send(self, method, params=None):
        msg_id = self._next_id
        self._next_id += 1
        msg = {'jsonrpc': '2.0', 'id': msg_id, 'method': method, 'params': params or {}}
        self.proc.stdin.write(json.dumps(msg) + '\n')
        self.proc.stdin.flush()
        resp_line = self.proc.stdout.readline()
        if not resp_line:
            raise RuntimeError('bwmcp process closed stdout')
        return json.loads(resp_line)

    def notify(self, method, params=None):
        msg = {'jsonrpc': '2.0', 'method': method, 'params': params or {}}
        self.proc.stdin.write(json.dumps(msg) + '\n')
        self.proc.stdin.flush()

    def call_tool(self, name, arguments=None):
        resp = self.send('tools/call', {'name': name, 'arguments': arguments or {}})
        if 'error' in resp:
            raise RuntimeError(f"Tool error: {resp['error']['message']}")
        return resp['result']

    def initialize(self):
        resp = self.send('initialize', {
            'protocolVersion': '2024-11-05',
            'capabilities': {},
            'clientInfo': {'name': 'live-builder', 'version': '1.0.0'}
        })
        self.notify('notifications/initialized')
        return resp['result']

    def list_tools(self):
        resp = self.send('tools/list')
        return resp['result']['tools']

    def render(self, taco):
        """Shorthand: replace #app with this TACO."""
        self.call_tool('render_live', {'target': '#app', 'taco': taco, 'action': 'replace'})

    def close(self):
        try:
            self.proc.stdin.close()
            self.proc.terminate()
            self.proc.wait(timeout=3)
        except Exception:
            self.proc.kill()


# ─── Browser UI Helpers ──────────────────────────────────────────────────

def status_page(title, subtitle, steps=None, current_step=-1):
    """Build a TACO status page (pure dicts -- no bwmcp call needed)."""
    children = [
        {'t': 'div', 'a': {'style': 'text-align:center; padding:2rem 0 1rem;'}, 'c': [
            {'t': 'h1', 'a': {'style': 'margin:0;'}, 'c': title},
            {'t': 'p', 'a': {'style': 'color:#888; margin:0.5rem 0 0;'}, 'c': subtitle},
        ]},
    ]
    if steps:
        step_items = []
        for i, step in enumerate(steps):
            if i < current_step:
                icon, color = 'done', '#16a34a'
            elif i == current_step:
                icon, color = '>>>', '#2563eb'
            else:
                icon, color = '...', '#aaa'
            step_items.append(
                {'t': 'div', 'a': {'style': f'padding:0.5rem 0; color:{color}; font-size:0.95rem;'}, 'c': [
                    {'t': 'span', 'a': {'style': 'font-family:monospace; margin-right:0.75rem;'}, 'c': icon},
                    {'t': 'span', 'c': step},
                ]}
            )
        children.append(
            {'t': 'div', 'a': {'style': 'max-width:500px; margin:1.5rem auto; text-align:left;'}, 'c': step_items}
        )
    return {'t': 'div', 'a': {'class': 'bw_container'}, 'c': children}


def build_progress_page(title, plan_desc, built_tacos, total, current_label, model_name):
    """Build a page showing components appearing as they are built."""
    children = [
        # Header
        {'t': 'div', 'a': {'style': 'padding:1rem 0 0.5rem; border-bottom:1px solid #e5e7eb; margin-bottom:1rem;'}, 'c': [
            {'t': 'h1', 'a': {'style': 'margin:0; font-size:1.5rem;'}, 'c': title},
            {'t': 'p', 'a': {'style': 'color:#888; margin:0.25rem 0 0; font-size:0.9rem;'}, 'c': plan_desc},
        ]},
        # Progress bar
        {'t': 'div', 'a': {'style': 'margin-bottom:1rem;'}, 'c': [
            {'t': 'div', 'a': {'style': 'display:flex; justify-content:space-between; font-size:0.85rem; color:#666; margin-bottom:0.25rem;'}, 'c': [
                {'t': 'span', 'c': current_label},
                {'t': 'span', 'c': f'{len(built_tacos)}/{total} components'},
            ]},
            {'t': 'div', 'a': {'style': 'background:#e5e7eb; border-radius:4px; height:8px; overflow:hidden;'}, 'c': [
                {'t': 'div', 'a': {'style': f'background:#2563eb; height:100%; width:{100*len(built_tacos)//max(total,1)}%; transition:width 0.3s;'}, 'c': ''},
            ]},
        ]},
    ]
    # Built components so far
    if built_tacos:
        children.extend(built_tacos)
    # Footer
    children.append(
        {'t': 'div', 'a': {'style': 'margin-top:2rem; padding:0.75rem 0; border-top:1px solid #e5e7eb; font-size:0.8rem; color:#aaa; text-align:center;'},
         'c': f'Built by {model_name} via bwmcp'}
    )
    return {'t': 'div', 'a': {'class': 'bw_container'}, 'c': children}


# ─── LLM Prompting ───────────────────────────────────────────────────────

SYSTEM_PROMPT = """You are a UI designer. You will receive a description of what to build and a list of available bitwrench components. Return a JSON build plan.

AVAILABLE COMPONENTS (use only these tool names):
- make_hero: {title, subtitle, variant, size} -- Full-width hero banner
- make_stat_card: {label, value, change, variant, icon} -- KPI metric card
- make_card: {title, content, variant, shadow} -- Content card
- make_table: {data: [{key:val}], columns: [{key, label}], striped, hover} -- Data table
- make_alert: {content, variant, dismissible} -- Alert/notification
- make_nav: {items: [{text, href, active}], pills} -- Navigation links
- make_tabs: {tabs: [{label, content}]} -- Tabbed content
- make_accordion: {items: [{title, content}]} -- Collapsible sections
- make_button: {text, variant, size} -- Button
- make_form_group: {label, input: {t:'input', a:{type,placeholder}}} -- Form field

VARIANTS: primary, secondary, success, danger, warning, info

Return ONLY a JSON object (no markdown, no explanation) with this exact structure:
{
  "title": "Page Title",
  "description": "One-line description of the page",
  "components": [
    {
      "tool": "make_hero",
      "args": {"title": "Welcome", "subtitle": "A great product", "variant": "primary"},
      "description": "Hero banner introducing the dashboard",
      "width": "full"
    },
    {
      "tool": "make_stat_card",
      "args": {"label": "Revenue", "value": "$50K", "variant": "primary"},
      "description": "Revenue metric",
      "width": "third"
    }
  ]
}

RULES:
- width must be "full" or "third". "third" items are grouped into rows of 3.
- Use 3-6 stat cards grouped as "third" for dashboards.
- Always start with a make_hero for the page header.
- For tables, provide realistic sample data (3-5 rows, 3-4 columns).
- Provide realistic, specific content -- not placeholder text.
- Use different variants for visual variety.
- Return 5-12 components total."""


def ask_for_plan(llm, prompt):
    """Ask the LLM for a build plan. Returns parsed dict."""
    messages = [
        {'role': 'system', 'content': SYSTEM_PROMPT},
        {'role': 'user', 'content': f'Build this: {prompt}'},
    ]
    raw = llm.chat(messages, temperature=0.7)
    return parse_plan(raw)


def parse_plan(text):
    """Extract JSON from LLM response. Handles markdown code blocks."""
    # Try direct parse
    text = text.strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    # Try extracting from ```json ... ``` or ``` ... ```
    m = re.search(r'```(?:json)?\s*\n?(.*?)\n?```', text, re.DOTALL)
    if m:
        try:
            return json.loads(m.group(1).strip())
        except json.JSONDecodeError:
            pass
    # Try finding first { ... last }
    start = text.find('{')
    end = text.rfind('}')
    if start >= 0 and end > start:
        try:
            return json.loads(text[start:end + 1])
        except json.JSONDecodeError:
            pass
    raise RuntimeError(f'Could not parse LLM response as JSON.\nResponse:\n{text[:500]}')


FALLBACK_PLAN = {
    'title': 'Sales Dashboard',
    'description': 'Quarterly sales metrics and product performance',
    'components': [
        {'tool': 'make_hero', 'args': {'title': 'Sales Dashboard', 'subtitle': 'Q1 2026 Performance Overview', 'variant': 'primary'}, 'description': 'Page header', 'width': 'full'},
        {'tool': 'make_stat_card', 'args': {'label': 'Revenue', 'value': '$128,430', 'change': '+12.5%', 'variant': 'primary'}, 'description': 'Total revenue', 'width': 'third'},
        {'tool': 'make_stat_card', 'args': {'label': 'Customers', 'value': '3,842', 'change': '+8.1%', 'variant': 'success'}, 'description': 'Active customers', 'width': 'third'},
        {'tool': 'make_stat_card', 'args': {'label': 'Avg Order', 'value': '$284', 'change': '-1.3%', 'variant': 'info'}, 'description': 'Average order value', 'width': 'third'},
        {'tool': 'make_alert', 'args': {'content': 'Q1 revenue target exceeded by 12%. Regional breakdown available in the full report.', 'variant': 'success'}, 'description': 'Success notice', 'width': 'full'},
        {'tool': 'make_table', 'args': {'data': [{'product': 'Widget Pro', 'units': 342, 'revenue': '$45,200'}, {'product': 'Gadget Plus', 'units': 256, 'revenue': '$38,100'}, {'product': 'Doohickey XL', 'units': 189, 'revenue': '$22,680'}, {'product': 'Thingamajig', 'units': 94, 'revenue': '$12,450'}], 'columns': [{'key': 'product', 'label': 'Product'}, {'key': 'units', 'label': 'Units Sold'}, {'key': 'revenue', 'label': 'Revenue'}], 'striped': True, 'hover': True}, 'description': 'Product breakdown table', 'width': 'full'},
    ]
}


# ─── Layout Composition ──────────────────────────────────────────────────

def compose_layout(plan, built_items):
    """Compose built TACOs into a grid layout. Groups 'third' items into rows."""
    children = []
    row_buffer = []

    def flush_row():
        if row_buffer:
            cols = [{'t': 'div', 'a': {'class': 'bw_col'}, 'c': [item]} for item in row_buffer]
            children.append({'t': 'div', 'a': {'class': 'bw_row', 'style': 'margin-bottom:1rem;'}, 'c': cols})
            row_buffer.clear()

    for item in built_items:
        taco = item['taco']
        width = item.get('spec', {}).get('width', 'full')
        if width == 'third':
            row_buffer.append(taco)
            if len(row_buffer) == 3:
                flush_row()
        else:
            flush_row()
            children.append({'t': 'div', 'a': {'style': 'margin-bottom:1rem;'}, 'c': [taco]})

    flush_row()  # any remaining thirds

    return {'t': 'div', 'a': {'class': 'bw_container'}, 'c': children}


# ─── Main Build Loop ─────────────────────────────────────────────────────

def build_live(bw, llm, prompt, theme, output_path):
    """The main live build loop. Each step renders to the browser."""

    model_name = llm.model if llm else 'fallback'

    # Phase 1: Initialize
    print('\n[1/6] Initializing MCP connection...')
    info = bw.initialize()
    print(f'  Server: {info["serverInfo"]["name"]} v{info["serverInfo"]["version"]}')

    bw.render(status_page(
        'bwmcp Live Builder',
        'Initializing...',
        ['Connect to bwmcp', 'Connect to LLM', 'Plan the UI', 'Build components', 'Compose layout', 'Save page'],
        0
    ))
    time.sleep(0.8)

    # Phase 2: Get plan from LLM (or fallback)
    print(f'\n[2/6] Asking LLM to plan UI for: "{prompt}"')
    bw.render(status_page(
        'bwmcp Live Builder',
        f'Asking {model_name}: "{prompt}"',
        ['Connect to bwmcp', 'Connect to LLM', 'Plan the UI', 'Build components', 'Compose layout', 'Save page'],
        2
    ))

    plan = None
    if llm:
        try:
            plan = ask_for_plan(llm, prompt)
            print(f'  LLM returned plan: {plan.get("title", "?")} with {len(plan.get("components", []))} components')
        except Exception as e:
            print(f'  LLM error: {e}')
            print('  Using fallback plan instead.')

    if not plan or 'components' not in plan:
        plan = FALLBACK_PLAN.copy()
        print(f'  Using fallback plan: {plan["title"]}')

    components = plan.get('components', [])
    step_names = [c.get('description', c.get('tool', '?')) for c in components]

    # Phase 3: Show the plan
    print(f'\n[3/6] Plan: {plan["title"]}')
    for i, c in enumerate(components):
        print(f'  {i+1}. {c.get("description", c["tool"])} [{c["tool"]}]')

    bw.render(status_page(
        plan.get('title', 'Building UI'),
        plan.get('description', prompt),
        step_names,
        0
    ))
    time.sleep(1.2)

    # Phase 4: Build components one by one
    print(f'\n[4/6] Building {len(components)} components...')
    built = []
    layout_tacos = []  # growing list for the live display

    for i, spec in enumerate(components):
        tool = spec.get('tool', 'make_card')
        args = spec.get('args', {})
        desc = spec.get('description', tool)

        print(f'  [{i+1}/{len(components)}] {desc} ({tool})')

        # Show progress in browser
        bw.render(build_progress_page(
            plan.get('title', 'Building'),
            plan.get('description', ''),
            layout_tacos,
            len(components),
            f'Building: {desc}...',
            model_name
        ))
        time.sleep(0.4)

        # Call the bwmcp tool
        try:
            result = bw.call_tool(tool, args)
            taco = result.get('structuredContent') or json.loads(result['content'][0]['text'])
            built.append({'taco': taco, 'spec': spec})

            # Add to growing layout display
            partial = compose_layout(plan, built)
            layout_tacos = partial['c']  # extract children for the progress page

        except Exception as e:
            print(f'    Error: {e} -- skipping')
            continue

        # Update browser with new component visible
        bw.render(build_progress_page(
            plan.get('title', 'Building'),
            plan.get('description', ''),
            layout_tacos,
            len(components),
            f'Built: {desc}',
            model_name
        ))
        time.sleep(0.6)

    # Phase 5: Final composed layout
    print(f'\n[5/6] Composing final layout...')
    final = compose_layout(plan, built)

    # Add footer with attribution
    final['c'].append(
        {'t': 'div', 'a': {'style': 'margin-top:2rem; padding:1rem 0; border-top:1px solid #e5e7eb; font-size:0.85rem; color:#999; text-align:center;'},
         'c': f'Built by {model_name} via bwmcp | Theme: {theme}'}
    )

    bw.render(final)
    print('  Rendered final layout to browser.')

    # Phase 6: Save standalone page
    print(f'\n[6/6] Saving standalone HTML page...')
    page_result = bw.call_tool('build_page', {
        'title': plan.get('title', 'Built with bwmcp'),
        'theme': theme,
        'content': final,
    })
    html = page_result['content'][0]['text']
    with open(output_path, 'w') as f:
        f.write(html)
    print(f'  Saved: {output_path} ({len(html):,} bytes)')

    print(f'\n  Open http://localhost:{bw.port} to see the live result.')
    print(f'  Open {output_path} for the standalone page.')
    print(f'\n  Press Ctrl+C to stop.\n')


# ─── Entry Point ─────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description='Watch an LLM build UI live in the browser via bwmcp',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python3 live_builder.py --provider ollama --model llama3.2
  python3 live_builder.py --provider lmstudio
  python3 live_builder.py --provider openrouter
  python3 live_builder.py --provider openai --model gpt-4o-mini
  python3 live_builder.py --prompt "Build a project tracker"
  python3 live_builder.py --no-llm   # use fallback plan (no LLM needed)

Providers:
  ollama      http://localhost:11434  (no key needed)
  lmstudio    http://localhost:1234   (no key needed)
  openrouter  openrouter.ai           (set OPENROUTER_API_KEY)
  openai      api.openai.com          (set OPENAI_API_KEY)
        """
    )
    parser.add_argument('--provider', default='ollama',
                        choices=list(PROVIDERS.keys()),
                        help='LLM provider (default: ollama)')
    parser.add_argument('--model', default=None,
                        help='Model name (default: auto per provider)')
    parser.add_argument('--api-key', default=None,
                        help='API key (or set env var)')
    parser.add_argument('--base-url', default=None,
                        help='Custom API base URL')
    parser.add_argument('--prompt', default='Build a sales metrics dashboard for a SaaS company',
                        help='What to build')
    parser.add_argument('--theme', default='ocean',
                        help='Bitwrench theme preset (default: ocean)')
    parser.add_argument('--port', type=int, default=7910,
                        help='bwserve port (default: 7910)')
    parser.add_argument('--output', default='output.html',
                        help='Output HTML file path (default: output.html)')
    parser.add_argument('--no-llm', action='store_true',
                        help='Skip LLM, use built-in fallback plan')
    args = parser.parse_args()

    # Verify bwmcp exists
    if not os.path.exists(BWMCP_PATH):
        print(f'Error: bwmcp not found at {BWMCP_PATH}')
        print('Run this script from within the bitwrench repo.')
        sys.exit(1)

    # Connect to LLM
    llm = None
    if not args.no_llm:
        print(f'Connecting to LLM: {args.provider} ({args.model or DEFAULT_MODELS.get(args.provider, "?")})')
        try:
            llm = LLMClient(
                provider=args.provider,
                model=args.model,
                api_key=args.api_key,
                base_url=args.base_url,
            )
            # Quick ping to verify connectivity
            test = llm.chat([{'role': 'user', 'content': 'Reply with just the word OK'}], temperature=0)
            print(f'  LLM connected: {test.strip()[:20]}')
        except Exception as e:
            print(f'  LLM connection failed: {e}')
            print('  Continuing with fallback plan. Use --no-llm to skip this check.')
            llm = None
    else:
        print('Skipping LLM (--no-llm). Using fallback plan.')

    # Start bwmcp with browser
    print(f'Starting bwmcp (port {args.port}, theme {args.theme})...')
    print(f'  Open http://localhost:{args.port} in your browser to watch.')
    bw = BwmcpClient(port=args.port, open_browser=True, theme=args.theme)

    # Give browser time to connect
    time.sleep(2)

    try:
        build_live(bw, llm, args.prompt, args.theme, args.output)
        # Keep alive so user can view the result
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            print('\nShutting down...')
    except Exception as e:
        print(f'\nError: {e}', file=sys.stderr)
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        bw.close()


if __name__ == '__main__':
    main()
