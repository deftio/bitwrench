/**
 * OpenAI-compatible chat completions client.
 * Works with Ollama, LM Studio, OpenRouter (baseUrl .../v1).
 */

function apiKeyFor(provider) {
  if (!provider.apiKeyEnv) return null;
  return process.env[provider.apiKeyEnv] || null;
}

/**
 * Build request body. Always honors provider.thinking and provider.numCtx.
 * Extra fields are ignored by servers that do not understand them.
 */
export function buildChatBody(provider, messages, runOpts) {
  runOpts = runOpts || {};
  var thinking = provider.thinking === true;
  var numCtx = typeof provider.numCtx === 'number' ? provider.numCtx : 100000;
  var body = {
    model: provider.model,
    messages: messages,
    temperature: runOpts.temperature != null ? runOpts.temperature : 0.2,
    stream: false,
    // Context window — Ollama reads options.num_ctx; others may ignore.
    options: {
      num_ctx: numCtx
    },
    // Thinking / reasoning off by default for this audit tool.
    // Ollama: think
    // Qwen OpenAI-compat: enable_thinking + chat_template_kwargs
    think: thinking,
    enable_thinking: thinking,
    chat_template_kwargs: {
      enable_thinking: thinking
    }
  };
  return body;
}

/**
 * Strip model "thinking" wrappers before JSON parse.
 */
export function stripThinking(text) {
  if (!text) return '';
  var s = String(text);
  s = s.replace(/<think>[\s\S]*?<\/think>/gi, '');
  s = s.replace(/<thinking>[\s\S]*?<\/thinking>/gi, '');
  s = s.replace(/^\s*thinking\s*:[\s\S]*?(?=\{|\[)/i, '');
  return s.trim();
}

export async function chatCompletion(provider, messages, runOpts) {
  runOpts = runOpts || {};
  var base = String(provider.baseUrl).replace(/\/+$/, '');
  var url = base + '/chat/completions';
  var body = buildChatBody(provider, messages, runOpts);
  var headers = {
    'Content-Type': 'application/json'
  };
  var key = apiKeyFor(provider);
  if (key) headers.Authorization = 'Bearer ' + key;

  var timeoutMs = runOpts.timeoutMs != null ? runOpts.timeoutMs : 600000;
  var ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
  var timer = null;
  if (ctrl) {
    timer = setTimeout(function () {
      ctrl.abort();
    }, timeoutMs);
  }

  var res;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(body),
      signal: ctrl ? ctrl.signal : undefined
    });
  } catch (err) {
    if (timer) clearTimeout(timer);
    var msg = err && err.name === 'AbortError'
      ? 'Provider request timed out after ' + timeoutMs + 'ms (' + url + ')'
      : 'Provider request failed: ' + (err && err.message ? err.message : err) + ' (' + url + ')';
    throw new Error(msg);
  }
  if (timer) clearTimeout(timer);

  var rawText = await res.text();
  var data;
  try {
    data = JSON.parse(rawText);
  } catch (e) {
    throw new Error('Provider returned non-JSON (' + res.status + '): ' + rawText.slice(0, 400));
  }
  if (!res.ok) {
    var errMsg = (data && data.error && (data.error.message || data.error)) || rawText.slice(0, 400);
    throw new Error('Provider HTTP ' + res.status + ': ' + errMsg);
  }

  var choice = data.choices && data.choices[0];
  var content =
    (choice && choice.message && choice.message.content) ||
    (choice && choice.text) ||
    '';
  // Some servers put reasoning in a separate field — drop it for parsing.
  if (choice && choice.message && choice.message.reasoning) {
    // keep content only
  }
  return {
    content: stripThinking(content),
    raw: data,
    usage: data.usage || null
  };
}

/** Quick connectivity check (list models if available). */
export async function pingProvider(provider) {
  var base = String(provider.baseUrl).replace(/\/+$/, '');
  var url = base + '/models';
  var headers = {};
  var key = apiKeyFor(provider);
  if (key) headers.Authorization = 'Bearer ' + key;
  var res = await fetch(url, { headers });
  if (!res.ok) {
    throw new Error('Provider /models HTTP ' + res.status + ' at ' + url);
  }
  return res.json();
}
