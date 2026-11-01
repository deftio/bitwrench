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

/**
 * Errors carry `.retryable` and `.status` so the caller does not have to
 * pattern-match on message text to decide whether another attempt is sane.
 */
function providerError(msg, status, retryable) {
  var e = new Error(msg);
  e.status = status == null ? null : status;
  e.retryable = !!retryable;
  return e;
}

/**
 * 429 means "slow down", 5xx means "the server is having a moment": both are
 * worth another attempt. Every other 4xx is a bad request -- the same body
 * will fail the same way, so retrying only wastes the overnight budget.
 */
export function isRetryableStatus(status) {
  if (status === 429) return true;
  return status >= 500 && status <= 599;
}

/** Waits between attempts, in ms. Three retries after the first attempt. */
export var BACKOFF_MS = [2000, 8000, 30000];

function defaultSleep(ms) {
  return new Promise(function (r) {
    setTimeout(r, ms);
  });
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
    // Transport-level: a dropped wifi link, a sleeping laptop, a provider
    // restart, or our own timeout. All retryable -- these are exactly the
    // blips that cost a file in a multi-hour run.
    var msg = err && err.name === 'AbortError'
      ? 'Provider request timed out after ' + timeoutMs + 'ms (' + url + ')'
      : 'Provider request failed: ' + (err && err.message ? err.message : err) + ' (' + url + ')';
    throw providerError(msg, null, true);
  }
  if (timer) clearTimeout(timer);

  var rawText = await res.text();
  var data;
  try {
    data = JSON.parse(rawText);
  } catch (e) {
    // A proxy error page or a half-written response. Retryable if the status
    // says so; a 200 with garbage usually repeats, so it is not.
    throw providerError(
      'Provider returned non-JSON (' + res.status + '): ' + rawText.slice(0, 400),
      res.status,
      isRetryableStatus(res.status)
    );
  }
  if (!res.ok) {
    var errMsg = (data && data.error && (data.error.message || data.error)) || rawText.slice(0, 400);
    throw providerError(
      'Provider HTTP ' + res.status + ': ' + errMsg,
      res.status,
      isRetryableStatus(res.status)
    );
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

/**
 * chatCompletion plus backoff on retryable failures.
 *
 * Only transport errors, 429 and 5xx are retried; a 400 is a bad request and
 * the same body will fail identically. `sleep` and `onRetry` are injectable so
 * tests can exercise the ladder without waiting 40 seconds.
 *
 * @param {object} runOpts `maxRetries` (default 3), `sleep`, `onRetry`, plus
 *   everything chatCompletion takes.
 */
export async function chatCompletionRetrying(provider, messages, runOpts) {
  runOpts = runOpts || {};
  var maxRetries = runOpts.maxRetries != null ? runOpts.maxRetries : 3;
  var waitFn = runOpts.sleep || defaultSleep;
  var onRetry = runOpts.onRetry || function () {};
  // `chat` is the single-shot call. Injectable so tests drive the real ladder
  // with a fake transport instead of replacing the ladder itself.
  var once = runOpts.chat || chatCompletion;
  var attempt = 0;

  for (;;) {
    try {
      var out = await once(provider, messages, runOpts);
      if (attempt > 0) out.retriedAttempts = attempt;
      return out;
    } catch (e) {
      attempt++;
      if (!e.retryable || attempt > maxRetries) {
        e.attempts = attempt;
        throw e;
      }
      var base = BACKOFF_MS[Math.min(attempt - 1, BACKOFF_MS.length - 1)];
      // Jitter so parallel workers do not all come back at the same instant.
      var waitMs = Math.round(base * (0.75 + Math.random() * 0.5));
      onRetry({ attempt: attempt, maxRetries: maxRetries, waitMs: waitMs, message: e.message });
      await waitFn(waitMs);
    }
  }
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
