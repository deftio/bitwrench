#!/usr/bin/env node
/**
 * LLM Chat — bitwrench + bwserve example
 *
 * A Streamlit-style chat interface backed by any OpenAI-compatible API.
 * Works with ollama, lm-studio, openrouter, or any OpenAI-compatible endpoint.
 *
 * Usage:
 *   node server.js                          # defaults: ollama on localhost:11434
 *   LLM_URL=http://localhost:1234/v1 node server.js   # lm-studio
 *   LLM_URL=https://openrouter.ai/api/v1 LLM_KEY=sk-... node server.js
 *
 * Run:  node server.js
 * Open: http://localhost:7903
 */

import { create } from '../../src/bwserve/index.js';

// ---------------------------------------------------------------------------
// Configuration (from environment or defaults)
// ---------------------------------------------------------------------------
var LLM_URL   = process.env.LLM_URL   || 'http://localhost:11434/v1';
var LLM_MODEL = process.env.LLM_MODEL || 'llama3.2';
var LLM_KEY   = process.env.LLM_KEY   || '';
var PORT      = parseInt(process.env.PORT || '7903', 10);

var app = create({ port: PORT, title: 'LLM Chat' });

// ---------------------------------------------------------------------------
// Chat page
// ---------------------------------------------------------------------------
app.page('/', function(client) {
  var messages = [];  // { role: 'user'|'assistant', content: string }
  var streaming = false;
  var msgCounter = 0;

  // Render initial UI
  client.render('#app', {
    t: 'div', a: { style: 'max-width: 700px; margin: 0 auto; height: 100vh; display: flex; flex-direction: column;' },
    c: [
      // Header
      {
        t: 'div', a: { style: 'padding: 1rem; border-bottom: 1px solid #e2e8f0; flex-shrink: 0;' },
        c: [
          { t: 'h2', a: { style: 'margin: 0; color: #1e293b;' }, c: 'LLM Chat' },
          {
            t: 'div', a: { id: 'status', style: 'font-size: 0.8rem; color: #64748b; margin-top: 0.25rem;' },
            c: LLM_URL + ' / ' + LLM_MODEL
          }
        ]
      },
      // Messages area
      {
        t: 'div',
        a: {
          id: 'messages',
          style: 'flex: 1; overflow-y: auto; padding: 1rem; display: flex; flex-direction: column; gap: 0.75rem;'
        },
        c: [
          {
            t: 'div', a: { style: 'color: #94a3b8; text-align: center; margin-top: 2rem;' },
            c: 'Type a message to start chatting.'
          }
        ]
      },
      // Input area
      {
        t: 'div', a: { style: 'padding: 1rem; border-top: 1px solid #e2e8f0; flex-shrink: 0; display: flex; gap: 0.5rem;' },
        c: [
          {
            t: 'input',
            a: {
              type: 'text',
              id: 'chat-input',
              placeholder: 'Type your message...',
              autocomplete: 'off',
              style: 'flex: 1; padding: 0.6rem 1rem; border: 1px solid #d1d5db; border-radius: 0.5rem; font-size: 1rem; outline: none;'
            }
          },
          {
            t: 'button',
            a: {
              'data-bw-action': 'send',
              style: 'padding: 0.6rem 1.25rem; background: #2563eb; color: #fff; border: none; border-radius: 0.5rem; font-size: 1rem; cursor: pointer;'
            },
            c: 'Send'
          }
        ]
      }
    ]
  });

  // -------------------------------------------------------------------------
  // Handle user message
  // -------------------------------------------------------------------------
  client.on('send', function(data) {
    var text = (data.inputValue || '').trim();
    if (!text || streaming) return;

    // Clear the placeholder on first message
    if (messages.length === 0) {
      client.render('#messages', { t: 'span' });
    }

    // Add user message
    messages.push({ role: 'user', content: text });
    client.append('#messages', messageBubble('user', text));

    // Add assistant placeholder
    var assistantId = 'msg-' + (++msgCounter);
    client.append('#messages', messageBubble('assistant', 'Thinking...', assistantId));
    client.call('scrollTo', { target: '#messages', behavior: 'smooth' });

    // Stream from LLM
    streaming = true;
    streamLLM(messages, function(token, done, fullText) {
      if (done) {
        messages.push({ role: 'assistant', content: fullText });
        client.patch(assistantId, fullText);
        client.call('scrollTo', { target: '#messages', behavior: 'smooth' });
        streaming = false;
      } else {
        client.patch(assistantId, token);
        // Scroll every few tokens
        client.call('scrollTo', { target: '#messages', behavior: 'smooth' });
      }
    }, function(err) {
      client.patch(assistantId, 'Error: ' + err);
      streaming = false;
    });
  });

  // Clear chat
  client.on('clear', function() {
    messages = [];
    client.render('#messages', {
      t: 'div', a: { style: 'color: #94a3b8; text-align: center; margin-top: 2rem;' },
      c: 'Type a message to start chatting.'
    });
  });
});

// ---------------------------------------------------------------------------
// Message bubble TACO helper
// ---------------------------------------------------------------------------
function messageBubble(role, text, id) {
  var isUser = role === 'user';
  var bubbleStyle = isUser
    ? 'background: #2563eb; color: #fff; align-self: flex-end; border-radius: 1rem 1rem 0.25rem 1rem;'
    : 'background: #f1f5f9; color: #1e293b; align-self: flex-start; border-radius: 1rem 1rem 1rem 0.25rem;';
  var attrs = { style: 'padding: 0.75rem 1rem; max-width: 80%; word-wrap: break-word; white-space: pre-wrap; ' + bubbleStyle };
  if (id) attrs.id = id;
  return { t: 'div', a: attrs, c: text };
}

// ---------------------------------------------------------------------------
// LLM streaming (OpenAI-compatible API)
// ---------------------------------------------------------------------------
function streamLLM(messages, onToken, onError) {
  var headers = { 'Content-Type': 'application/json' };
  if (LLM_KEY) headers['Authorization'] = 'Bearer ' + LLM_KEY;

  var body = JSON.stringify({
    model: LLM_MODEL,
    messages: messages.map(function(m) {
      return { role: m.role, content: m.content };
    }),
    stream: true
  });

  fetch(LLM_URL + '/chat/completions', {
    method: 'POST',
    headers: headers,
    body: body
  }).then(function(res) {
    if (!res.ok) {
      return res.text().then(function(t) { throw new Error(res.status + ': ' + t); });
    }
    return readStream(res.body, onToken);
  }).catch(function(err) {
    onError(err.message || String(err));
  });
}

/**
 * Read an SSE stream from the LLM and call onToken with accumulated text.
 */
function readStream(body, onToken) {
  var reader = body.getReader();
  var decoder = new TextDecoder();
  var fullText = '';
  var buffer = '';

  function pump() {
    return reader.read().then(function(result) {
      if (result.done) {
        onToken(fullText, true, fullText);
        return;
      }

      buffer += decoder.decode(result.value, { stream: true });
      var lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (var i = 0; i < lines.length; i++) {
        var line = lines[i].trim();
        if (!line.startsWith('data: ')) continue;
        var payload = line.slice(6);
        if (payload === '[DONE]') {
          onToken(fullText, true, fullText);
          return;
        }
        try {
          var parsed = JSON.parse(payload);
          var delta = parsed.choices && parsed.choices[0] && parsed.choices[0].delta;
          if (delta && delta.content) {
            fullText += delta.content;
            onToken(fullText, false, fullText);
          }
        } catch (e) {
          // Ignore malformed SSE lines
        }
      }

      return pump();
    });
  }

  return pump();
}

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------
app.listen(function() {
  console.log('LLM Chat running at http://localhost:' + PORT);
  console.log('LLM endpoint: ' + LLM_URL + '/chat/completions');
  console.log('Model: ' + LLM_MODEL);
  if (LLM_KEY) console.log('API key: set');
});
