#!/usr/bin/env python3
"""
OnTheFlyUI — Chat with an LLM, watch it build UI in real-time.

Sends natural-language UI descriptions to an LLM which responds with
bwserve protocol messages. Those messages are POSTed to `bwcli serve`,
which broadcasts them to connected browsers via SSE.

Zero external dependencies — Python 3.8+ stdlib only.

Usage:
    python3 otfui.py                  # defaults: ollama, llama3.2
    LLM_URL=https://api.openai.com/v1 LLM_KEY=sk-... python3 otfui.py
    python3 otfui.py --port 3000 --input-port 3001

Environment variables:
    LLM_URL          OpenAI-compatible API base (default: http://localhost:11434/v1)
    LLM_MODEL        Model name (default: llama3.2)
    LLM_KEY          API key for cloud providers (default: empty)
    OTFUI_PORT       Browser-facing port (default: 8080)
    OTFUI_INPUT_PORT Input port for protocol messages (default: 9000)
"""

import json
import os
import re
import shutil
import signal
import subprocess
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime

VERSION = "0.1.0"

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

def get_config():
    """Build config from env vars and CLI args."""
    cfg = {
        "llm_url": os.environ.get("LLM_URL", "http://localhost:11434/v1"),
        "llm_model": os.environ.get("LLM_MODEL", "llama3.2"),
        "llm_key": os.environ.get("LLM_KEY", ""),
        "port": int(os.environ.get("OTFUI_PORT", "8080")),
        "input_port": int(os.environ.get("OTFUI_INPUT_PORT", "9000")),
    }

    # Simple CLI arg parsing (no argparse — keep it minimal)
    args = sys.argv[1:]
    i = 0
    while i < len(args):
        a = args[i]
        if a in ("--help", "-h"):
            print(__doc__.strip())
            print("\nCommands (inside REPL):")
            print("  /help     Show commands")
            print("  /clear    Clear the browser UI")
            print("  /dump     Print last raw LLM response")
            print("  /quit     Save session and exit")
            sys.exit(0)
        elif a == "--version":
            print(f"OnTheFlyUI v{VERSION}")
            sys.exit(0)
        elif a in ("--port", "-p") and i + 1 < len(args):
            cfg["port"] = int(args[i + 1]); i += 2; continue
        elif a in ("--input-port", "-l") and i + 1 < len(args):
            cfg["input_port"] = int(args[i + 1]); i += 2; continue
        elif a in ("--model", "-m") and i + 1 < len(args):
            cfg["llm_model"] = args[i + 1]; i += 2; continue
        elif a in ("--url", "-u") and i + 1 < len(args):
            cfg["llm_url"] = args[i + 1]; i += 2; continue
        elif a in ("--key", "-k") and i + 1 < len(args):
            cfg["llm_key"] = args[i + 1]; i += 2; continue
        else:
            print(f"Unknown argument: {a}", file=sys.stderr)
            print('Run "python3 otfui.py --help" for usage.', file=sys.stderr)
            sys.exit(1)
        i += 1

    return cfg

# ---------------------------------------------------------------------------
# System prompt for the LLM
# ---------------------------------------------------------------------------

SYSTEM_PROMPT = r"""You are a UI builder. The user describes what they want to see in the browser and you respond with bwserve protocol JSON messages. Your response must be ONLY valid JSON — no explanation, no markdown, no prose.

The browser has bitwrench loaded (a JS UI library). You have two modes:

## Mode 1: TACO protocol messages
Use replace/append/patch/remove to manipulate DOM:
- replace: {"type":"replace","target":"#app","node":{"t":"div","a":{"class":"bw-card"},"c":"Hello"}}
- append:  {"type":"append","target":"#app","node":{"t":"p","c":"New paragraph"}}
- patch:   {"type":"patch","target":"#my-id","content":"Updated text"}
- remove:  {"type":"remove","target":"#old-element"}

TACO format: {"t":"tag","a":{"attr":"value"},"c":"content or array of children"}

## Mode 2: exec messages (preferred for complex UI)
Run JavaScript in the browser. bitwrench is loaded as `bw`.
{"type":"exec","code":"bw.DOM('#app', bw.makeCard({title:'Hello', content:'World'}))"}

Key bitwrench functions available:
- bw.DOM(selector, taco) — mount TACO to DOM
- bw.html(taco) — TACO to HTML string
- bw.css(rules) — JS object to CSS string
- bw.injectCSS(css) — inject CSS into page
- bw.loadDefaultStyles() — load Bootstrap-like defaults
- bw.generateTheme(name, {primary:'#hex', secondary:'#hex'}) — generate themed CSS
- bw.makeCard({title, content, variant}) — card component
- bw.makeButton({label, variant, size}) — button
- bw.makeTable({headers, rows, striped, hover}) — table
- bw.makeBarChart({data:[{label,value}], title, height, color}) — bar chart
- bw.makeAlert({content, variant, dismissible}) — alert banner
- bw.makeNavbar({brand, items}) — navigation bar
- bw.makeProgress({value, max, variant, label}) — progress bar
- bw.makeHero({title, subtitle, cta}) — hero section
- bw.makeBadge({content, variant}) — badge/tag
- bw.makeListGroup({items}) — list group
- bw.makeTabs({tabs:[{label,content}]}) — tabbed content
- bw.makeAccordion({items:[{title,content}]}) — accordion
- bw.makeForm({fields:[{label,name,type}]}) — form
- bw.makeStatCard({title, value, subtitle, icon, variant}) — stat card (custom TACO)

Stat card example (not a built-in — build from TACO):
{"type":"exec","code":"bw.DOM('#app', {t:'div',a:{style:'display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;padding:1rem'},c:[{t:'div',a:{class:'bw-card',style:'padding:1.5rem;text-align:center'},c:[{t:'div',a:{style:'font-size:0.85rem;color:#64748b'},c:'Users'},{t:'div',a:{style:'font-size:2rem;font-weight:700'},c:'1,234'},{t:'div',a:{style:'font-size:0.8rem;color:#22c55e'},c:'+12%'}]}]})"}

## Batching multiple operations
{"type":"batch","ops":[
  {"type":"exec","code":"bw.loadDefaultStyles()"},
  {"type":"exec","code":"bw.generateTheme('app',{primary:'#2563eb',secondary:'#64748b'})"},
  {"type":"exec","code":"bw.DOM('#app', bw.makeCard({title:'Dashboard', content:'Ready'}))"}
]}

## Rules
1. Respond with ONLY valid JSON. No markdown fences, no explanation.
2. Always target #app for the main content area.
3. For complex layouts, use exec mode with bw.DOM() and bitwrench components.
4. Use batch to combine multiple operations (e.g., load styles + render content).
5. On the FIRST request, always include bw.loadDefaultStyles() or bw.generateTheme() in a batch.
6. Use semantic HTML and bitwrench CSS classes (bw-card, bw-btn, bw-alert, etc.).
7. Keep JavaScript in exec messages concise — single expressions or IIFEs.
"""

# ---------------------------------------------------------------------------
# LLM API (OpenAI-compatible, non-streaming)
# ---------------------------------------------------------------------------

def call_llm(cfg, messages):
    """Call the LLM and return the assistant's response text."""
    url = cfg["llm_url"].rstrip("/") + "/chat/completions"
    headers = {"Content-Type": "application/json"}
    if cfg["llm_key"]:
        headers["Authorization"] = "Bearer " + cfg["llm_key"]

    body = json.dumps({
        "model": cfg["llm_model"],
        "messages": messages,
        "temperature": 0.3,
    }).encode("utf-8")

    req = urllib.request.Request(url, data=body, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            return data["choices"][0]["message"]["content"]
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8", errors="replace")[:200]
        raise RuntimeError(f"LLM API error {e.code}: {err_body}")
    except urllib.error.URLError as e:
        raise RuntimeError(f"Cannot reach LLM at {url}: {e.reason}")

# ---------------------------------------------------------------------------
# JSON response parsing
# ---------------------------------------------------------------------------

def parse_llm_response(text):
    """Parse LLM response into a list of protocol messages.

    Handles:
    - Clean JSON objects
    - Markdown-fenced JSON (```json ... ```)
    - Multiple JSON objects (newline-separated)
    - Batch messages (expanded into individual ops for logging)
    """
    text = text.strip()

    # Strip markdown fences
    text = re.sub(r"^```(?:json)?\s*\n?", "", text, flags=re.MULTILINE)
    text = re.sub(r"\n?```\s*$", "", text, flags=re.MULTILINE)
    text = text.strip()

    messages = []

    # Try parsing as a single JSON object
    try:
        obj = json.loads(text)
        if isinstance(obj, dict):
            messages.append(obj)
            return messages
        if isinstance(obj, list):
            # Array of messages
            for item in obj:
                if isinstance(item, dict):
                    messages.append(item)
            return messages
    except json.JSONDecodeError:
        pass

    # Try line-by-line parsing
    for line in text.split("\n"):
        line = line.strip()
        if not line:
            continue
        try:
            obj = json.loads(line)
            if isinstance(obj, dict):
                messages.append(obj)
        except json.JSONDecodeError:
            continue

    return messages

# ---------------------------------------------------------------------------
# Send messages to bwcli serve
# ---------------------------------------------------------------------------

def send_message(msg, input_port):
    """POST a protocol message to bwcli serve's input port."""
    data = json.dumps(msg).encode("utf-8")
    req = urllib.request.Request(
        f"http://localhost:{input_port}",
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except Exception as e:
        return {"error": str(e)}

# ---------------------------------------------------------------------------
# Session logging
# ---------------------------------------------------------------------------

class SessionLog:
    """Incrementally writes session exchanges to a JSON file."""

    def __init__(self, cfg):
        ts = datetime.now().strftime("%Y-%m-%d-%H%M%S")
        self.session_id = f"otfui-{ts}"
        self.filename = f"session-{self.session_id}.json"
        self.data = {
            "session_id": self.session_id,
            "started_at": datetime.now().isoformat(timespec="seconds"),
            "config": {
                "llm_url": cfg["llm_url"],
                "model": cfg["llm_model"],
                "ports": [cfg["port"], cfg["input_port"]],
            },
            "exchanges": [],
        }
        self._write()

    def add_exchange(self, user_input, llm_raw, protocol_messages, result):
        self.data["exchanges"].append({
            "timestamp": datetime.now().isoformat(timespec="seconds"),
            "user": user_input,
            "llm_raw": llm_raw,
            "protocol_messages": protocol_messages,
            "result": result,
        })
        self._write()

    def _write(self):
        # Write to the script's directory
        path = os.path.join(os.path.dirname(os.path.abspath(__file__)), self.filename)
        with open(path, "w") as f:
            json.dump(self.data, f, indent=2)

# ---------------------------------------------------------------------------
# bwcli serve subprocess management
# ---------------------------------------------------------------------------

def find_bwcli():
    """Find the bwcli/npx command to use."""
    # If running from the bitwrench repo, use npx
    repo_pkg = os.path.join(
        os.path.dirname(os.path.abspath(__file__)), "..", "..", "package.json"
    )
    if os.path.exists(repo_pkg):
        npx = shutil.which("npx")
        if npx:
            return [npx, "bwcli"]

    # Check for global bwcli
    bwcli = shutil.which("bwcli")
    if bwcli:
        return [bwcli]

    # Check for bitwrench (npm bin name)
    bitwrench = shutil.which("bitwrench")
    if bitwrench:
        return [bitwrench]

    return None


def start_bwcli(cfg):
    """Spawn bwcli serve as a subprocess."""
    cmd_base = find_bwcli()
    if not cmd_base:
        print("Error: Cannot find bwcli or npx on PATH.", file=sys.stderr)
        print("Install bitwrench: npm install -g bitwrench", file=sys.stderr)
        print("Or run from the bitwrench repo with npx available.", file=sys.stderr)
        sys.exit(1)

    cmd = cmd_base + [
        "serve",
        "--port", str(cfg["port"]),
        "--listen", str(cfg["input_port"]),
        "--allow-exec",
    ]

    proc = subprocess.Popen(
        cmd,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.PIPE,
        text=True,
    )

    # Wait for bwcli to be ready (poll the web port)
    print(f"  Starting bwcli serve... ", end="", flush=True)
    for attempt in range(30):
        time.sleep(0.5)
        # Check if process died
        if proc.poll() is not None:
            stderr_out = proc.stderr.read()
            print("FAILED")
            print(f"  bwcli exited with code {proc.returncode}", file=sys.stderr)
            if stderr_out:
                print(f"  stderr: {stderr_out[:500]}", file=sys.stderr)
            sys.exit(1)
        try:
            req = urllib.request.Request(
                f"http://localhost:{cfg['port']}",
                method="HEAD",
            )
            urllib.request.urlopen(req, timeout=2)
            print("ready.")
            return proc
        except Exception:
            continue

    print("TIMEOUT")
    proc.terminate()
    print("Error: bwcli serve did not start within 15 seconds.", file=sys.stderr)
    sys.exit(1)


def send_welcome(cfg):
    """Send an initial welcome screen to the browser."""
    welcome = {
        "type": "batch",
        "ops": [
            {"type": "exec", "code": "bw.loadDefaultStyles()"},
            {
                "type": "replace",
                "target": "#app",
                "node": {
                    "t": "div",
                    "a": {"style": "max-width:700px;margin:2rem auto;text-align:center;padding:2rem"},
                    "c": [
                        {"t": "h1", "a": {"style": "color:#2563eb;margin-bottom:0.5rem"}, "c": "OnTheFlyUI"},
                        {"t": "p", "a": {"style": "color:#64748b;font-size:1.1rem"}, "c": "Waiting for instructions... Type in the console to build UI."},
                        {"t": "p", "a": {"style": "color:#94a3b8;font-size:0.85rem;margin-top:2rem"}, "c": f"Connected to {cfg['llm_model']} via {cfg['llm_url']}"},
                    ],
                },
            },
        ],
    }
    send_message(welcome, cfg["input_port"])

# ---------------------------------------------------------------------------
# REPL
# ---------------------------------------------------------------------------

def run_repl(cfg, proc, session):
    """Main REPL loop."""
    conversation = [{"role": "system", "content": SYSTEM_PROMPT}]
    last_raw = None

    while True:
        try:
            user_input = input("\nYou> ").strip()
        except (EOFError, KeyboardInterrupt):
            print()
            break

        if not user_input:
            continue

        # Special commands
        if user_input.lower() in ("/quit", "/exit"):
            break

        if user_input.lower() == "/help":
            print("  /help     Show this help")
            print("  /clear    Clear the browser UI")
            print("  /dump     Print last raw LLM response")
            print("  /reset    Reset conversation history")
            print("  /quit     Save session and exit")
            continue

        if user_input.lower() == "/clear":
            result = send_message(
                {"type": "replace", "target": "#app", "node": {"t": "div", "a": {"id": "app"}}},
                cfg["input_port"],
            )
            status = "ok" if result.get("ok") else "send_error"
            print(f"  [OK] Browser cleared" if status == "ok" else f"  [ERR] {result}")
            continue

        if user_input.lower() == "/dump":
            if last_raw:
                print("  --- Last LLM response ---")
                print(f"  {last_raw[:2000]}")
                print("  ---")
            else:
                print("  No LLM response yet.")
            continue

        if user_input.lower() == "/reset":
            conversation = [{"role": "system", "content": SYSTEM_PROMPT}]
            print("  Conversation history reset.")
            continue

        # Call LLM
        conversation.append({"role": "user", "content": user_input})

        try:
            print("  [LLM] thinking...", end="", flush=True)
            raw_response = call_llm(cfg, conversation)
            last_raw = raw_response
            print("\r  [LLM] ", end="")
        except RuntimeError as e:
            print(f"\r  [ERR] {e}")
            # Remove the failed user message so conversation stays clean
            conversation.pop()
            session.add_exchange(user_input, "", [], "llm_error")
            continue

        # Parse response
        messages = parse_llm_response(raw_response)

        if not messages:
            print(f"parse error — could not extract JSON from response")
            print(f"  Hint: use /dump to see the raw response")
            conversation.append({"role": "assistant", "content": raw_response})
            session.add_exchange(user_input, raw_response, [], "parse_error")
            continue

        # Send each message to bwcli
        sent_count = 0
        total_clients = 0
        result_status = "ok"

        for msg in messages:
            resp = send_message(msg, cfg["input_port"])
            if resp.get("ok"):
                sent_count += 1
                total_clients = resp.get("clients", 0)
            else:
                result_status = "send_error"

        # Summarize
        msg_types = [m.get("type", "?") for m in messages]
        type_summary = ", ".join(msg_types)
        print(f"{type_summary}")
        if result_status == "ok":
            print(f"  [OK] {sent_count} message(s) sent to {total_clients} client(s)")
        else:
            print(f"  [WARN] Some messages failed to send")

        # Keep conversation context
        conversation.append({"role": "assistant", "content": raw_response})

        # Log
        serializable_msgs = []
        for m in messages:
            try:
                json.dumps(m)
                serializable_msgs.append(m)
            except (TypeError, ValueError):
                serializable_msgs.append({"type": m.get("type", "unknown"), "_serialization_error": True})

        session.add_exchange(user_input, raw_response, serializable_msgs, result_status)

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    cfg = get_config()

    print(f"OnTheFlyUI v{VERSION} -- Talk to an LLM, watch it build UI")
    print(f"  LLM:     {cfg['llm_url']} / {cfg['llm_model']}")
    print(f"  Browser: http://localhost:{cfg['port']}")

    # Start bwcli serve
    proc = start_bwcli(cfg)

    # Session logging
    session = SessionLog(cfg)
    print(f"  Session: {session.filename}")
    print()

    # Send welcome screen
    send_welcome(cfg)

    # Handle clean shutdown
    def cleanup(signum=None, frame=None):
        count = len(session.data["exchanges"])
        print(f"\nSession saved: {session.filename} ({count} exchange(s))")
        proc.terminate()
        try:
            proc.wait(timeout=5)
        except subprocess.TimeoutExpired:
            proc.kill()
        sys.exit(0)

    signal.signal(signal.SIGINT, cleanup)
    signal.signal(signal.SIGTERM, cleanup)

    try:
        run_repl(cfg, proc, session)
    finally:
        count = len(session.data["exchanges"])
        print(f"Session saved: {session.filename} ({count} exchange(s))")
        proc.terminate()
        try:
            proc.wait(timeout=5)
        except subprocess.TimeoutExpired:
            proc.kill()


if __name__ == "__main__":
    main()
