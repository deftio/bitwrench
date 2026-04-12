/**
 * bwclient.js — Browser-side protocol client for bwserve.
 *
 * Injected inline by bwshell. Requires window.bw (bitwrench loaded first).
 * NOT bundled into bitwrench dist — this is a bwserve runtime asset.
 *
 * Responsibilities:
 * - SSE connection lifecycle (connect, reconnect, status)
 * - Unified POST-back via /bw/return/<route>/<clientId>
 * - Register built-in client functions (scrollTo, focus, etc.)
 * - data-bw-action click/key delegation
 * - Attach mode for remote-controlling any bitwrench page
 *
 * @module bwserve/bwclient
 */

import { VERSION } from '../version.js';

/**
 * Return the bwclient source as a string for inline injection into the shell.
 * The version is embedded at serve-time from package.json via version.js.
 * @returns {string} JavaScript source code
 */
export function getBwClientSource() {
  return BWCLIENT_SOURCE.replace('__BW_VERSION__', VERSION);
}

var BWCLIENT_SOURCE = '(function(bw) {\n'
  + '  "use strict";\n'
  + '  if (!bw) return;\n'
  + '\n'
  + '  var _client = {\n'
  + '    id: null,\n'
  + '    version: "__BW_VERSION__",\n'
  + '    status: "idle",\n'
  + '    _es: null\n'
  + '  };\n'
  + '\n'
  + '  // ── Unified POST-back ──\n'
  + '  _client.respond = function(route, requestId, result, error) {\n'
  + '    fetch("/bw/return/" + route + "/" + _client.id, {\n'
  + '      method: "POST",\n'
  + '      headers: { "Content-Type": "application/json" },\n'
  + '      body: JSON.stringify({ requestId: requestId, route: route, result: result, error: error || null })\n'
  + '    }).catch(function() {});\n'
  + '  };\n'
  + '\n'
  + '  // ── SSE connect ──\n'
  + '  _client.connect = function(url, opts) {\n'
  + '    opts = opts || {};\n'
  + '    var onStatus = opts.onStatus || function() {};\n'
  + '    function setStatus(s) { _client.status = s; onStatus(s); }\n'
  + '    setStatus("connecting");\n'
  + '    if (typeof EventSource === "undefined") return;\n'
  + '    var es = new EventSource(url);\n'
  + '    _client._es = es;\n'
  + '    es.onopen = function() { setStatus("connected"); };\n'
  + '    es.onmessage = function(e) {\n'
  + '      try {\n'
  + '        var msg = typeof e.data === "string" ? bw.parseJSONFlex(e.data) : e.data;\n'
  + '        bw.apply(msg);\n'
  + '      } catch (err) {\n'
  + '        if (typeof console !== "undefined") console.error("[bwclient]", err);\n'
  + '      }\n'
  + '    };\n'
  + '    es.onerror = function() {\n'
  + '      if (_client.status === "connected") setStatus("disconnected");\n'
  + '    };\n'
  + '  };\n'
  + '\n'
  + '  // ── Attach mode ──\n'
  + '  _client.attach = function(url, opts) {\n'
  + '    opts = opts || {};\n'
  + '    _client.id = opts.clientId || "att_" + Math.random().toString(36).slice(2, 10);\n'
  + '    if (opts.allowExec) bw._allowExec = true;\n'
  + '    _client._registerBuiltins();\n'
  + '    _client._wireActions();\n'
  + '    _client.connect(url + "/bw/events/" + _client.id, opts);\n'
  + '  };\n'
  + '\n'
  + '  // ── Send action to server ──\n'
  + '  _client.sendAction = function(action, data) {\n'
  + '    _client.respond("action", null, { action: action, data: data || {} });\n'
  + '  };\n'
  + '\n'
  + '  // ── Register built-in functions ──\n'
  + '  _client._registerBuiltins = function() {\n'
  + '    var builtins = {\n'
  + '      scrollTo: "function(sel){var el=bw.el(sel);if(el)el.scrollTop=el.scrollHeight;}",\n'
  + '      focus: "function(sel){var el=bw.el(sel);if(el&&typeof el.focus===\\"function\\")el.focus();}",\n'
  + '      download: "function(fn,c,m){if(typeof document===\\"undefined\\")return;var b=new Blob([c],{type:m||\\"text/plain\\"});var a=document.createElement(\\"a\\");a.href=URL.createObjectURL(b);a.download=fn;a.click();URL.revokeObjectURL(a.href);}",\n'
  + '      clipboard: "function(t){if(typeof navigator!==\\"undefined\\"&&navigator.clipboard)navigator.clipboard.writeText(t);}",\n'
  + '      redirect: "function(u){if(typeof window!==\\"undefined\\")window.location.href=u;}",\n'
  + '      log: "function(){console.log.apply(console,arguments);}",\n'
  + '      _bw_query: "function(opts){if(!bw._bwClient)return;try{var r=new Function(opts.code)();if(r&&typeof r.then===\\"function\\"){r.then(function(v){bw._bwClient.respond(\\"query\\",opts.requestId,v);}).catch(function(e){bw._bwClient.respond(\\"query\\",opts.requestId,null,e.message);});}else{bw._bwClient.respond(\\"query\\",opts.requestId,r);}}catch(e){bw._bwClient.respond(\\"query\\",opts.requestId,null,e.message);}}",\n'
  + '      _bw_mount: "function(opts){if(!bw._bwClient)return;try{var taco;var f=opts.factory;var n=f.replace(/-([a-z])/g,function(_,c){return c.toUpperCase();});if(bw.BCCL&&bw.BCCL[n]){taco=bw.make(n,opts.props||{});}else if(bw._allowExec){taco=new Function(\\"props\\",f)(opts.props||{});}else{throw new Error(\\"Unknown component and allowExec disabled\\");}bw.DOM(opts.target,taco);bw._bwClient.respond(\\"mount\\",opts.requestId,{mounted:true});}catch(e){bw._bwClient.respond(\\"mount\\",opts.requestId,null,e.message);}}",\n'
  + '      _bw_screenshot: "function(opts){if(!bw._bwClient)return;var sel=opts.selector||\\"body\\";var el=document.querySelector(sel);if(!el){bw._bwClient.respond(\\"screenshot\\",opts.requestId,null,\\"Element not found: \\"+sel);return;}function _ls(url){return new Promise(function(res,rej){var s=document.createElement(\\"script\\");s.src=url;s.onload=function(){res(window.html2canvas);};s.onerror=function(){rej(new Error(\\"Failed to load html2canvas\\"));};document.head.appendChild(s);});}var p=window.html2canvas?Promise.resolve(window.html2canvas):_ls(opts.captureUrl||\\"/bw/lib/vendor/html2canvas.min.js\\");p.then(function(h2c){return h2c(el,{scale:opts.scale||1,useCORS:true});}).then(function(canvas){var out=canvas;var mw=opts.maxWidth;var mh=opts.maxHeight;if((mw&&canvas.width>mw)||(mh&&canvas.height>mh)){var sw=mw?mw/canvas.width:1;var sh=mh?mh/canvas.height:1;var sc=Math.min(sw,sh);out=document.createElement(\\"canvas\\");out.width=Math.round(canvas.width*sc);out.height=Math.round(canvas.height*sc);out.getContext(\\"2d\\").drawImage(canvas,0,0,out.width,out.height);}var fmt=opts.format===\\"jpeg\\"?\\"image/jpeg\\":\\"image/png\\";var q=opts.format===\\"jpeg\\"?(opts.quality||0.85):undefined;var dataUrl=out.toDataURL(fmt,q);bw._bwClient.respond(\\"screenshot\\",opts.requestId,{data:dataUrl,width:out.width,height:out.height,format:opts.format||\\"png\\"});}).catch(function(err){bw._bwClient.respond(\\"screenshot\\",opts.requestId,null,err.message||String(err));});}",\n'
  + '      _bw_tree: "function(opts){if(!bw._bwClient)return;var sel=opts.selector||\\"body\\";var depth=opts.depth||3;var root=document.querySelector(sel);if(typeof bw.inspect===\\"function\\"&&bw.inspect.length===2){bw._bwClient.respond(\\"query\\",opts.requestId,bw.inspect(root,depth));return;}function walk(el,d){if(!el||d>depth)return null;var info={tag:el.tagName?el.tagName.toLowerCase():\\"#text\\"};if(el.id)info.id=el.id;if(el.className&&typeof el.className===\\"string\\")info.cls=el.className.split(\\" \\").slice(0,5).join(\\" \\");if(el.children&&el.children.length>0&&d<depth){info.children=[];for(var i=0;i<Math.min(el.children.length,20);i++){var c=walk(el.children[i],d+1);if(c)info.children.push(c);}}return info;}bw._bwClient.respond(\\"query\\",opts.requestId,walk(root,0));}",\n'
  + '      _bw_listen: "function(opts){if(!bw._bwClient)return;if(!bw._bwClient._listeners)bw._bwClient._listeners={};var key=opts.selector+\\":::\\"+opts.event;if(bw._bwClient._listeners[key])return;var fn=function(e){var el=e.target.closest?e.target.closest(opts.selector):null;if(!el)return;bw._bwClient.respond(\\"event\\",null,{event:opts.event,selector:opts.selector,tagName:el.tagName,id:el.id||null,text:(el.textContent||\\"\\").slice(0,100)});};document.addEventListener(opts.event,fn,true);bw._bwClient._listeners[key]={fn:fn,event:opts.event};}",\n'
  + '      _bw_unlisten: "function(opts){if(!bw._bwClient||!bw._bwClient._listeners)return;var key=opts.selector+\\":::\\"+opts.event;var entry=bw._bwClient._listeners[key];if(!entry)return;document.removeEventListener(entry.event,entry.fn,true);delete bw._bwClient._listeners[key];}"\n'
  + '    };\n'
  + '    Object.keys(builtins).forEach(function(name) {\n'
  + '      bw.apply({ type: "register", name: name, body: builtins[name] });\n'
  + '    });\n'
  + '  };\n'
  + '\n'
  + '  // ── Wire up data-bw-action click delegation ──\n'
  + '  _client._wireActions = function() {\n'
  + '    document.addEventListener("click", function(e) {\n'
  + '      var el = e.target.closest ? e.target.closest("[data-bw-action]") : null;\n'
  + '      if (!el) return;\n'
  + '      e.preventDefault();\n'
  + '      var actionData = {};\n'
  + '      if (el.getAttribute("data-bw-id")) actionData.bwId = el.getAttribute("data-bw-id");\n'
  + '      var form = el.closest("div") || document;\n'
  + '      var inp = form.querySelector("input[type=text],input:not([type])");\n'
  + '      if (inp) { actionData.inputValue = inp.value; inp.value = ""; }\n'
  + '      _client.sendAction(el.getAttribute("data-bw-action"), actionData);\n'
  + '    });\n'
  + '    document.addEventListener("keydown", function(e) {\n'
  + '      if (e.key === "Enter" && e.target.tagName === "INPUT") {\n'
  + '        var form = e.target.closest("div") || document;\n'
  + '        var btn = form.querySelector("[data-bw-action]");\n'
  + '        if (btn) {\n'
  + '          _client.sendAction(btn.getAttribute("data-bw-action"), { inputValue: e.target.value });\n'
  + '          e.target.value = "";\n'
  + '        }\n'
  + '      }\n'
  + '    });\n'
  + '  };\n'
  + '\n'
  + '  // ── Event delegation helper ──\n'
  + '  _client.listen = function(selector, event, action) {\n'
  + '    document.addEventListener(event, function(e) {\n'
  + '      var el = e.target.closest ? e.target.closest(selector) : null;\n'
  + '      if (el) _client.sendAction(action, { selector: selector, event: event });\n'
  + '    });\n'
  + '  };\n'
  + '\n'
  + '  bw._bwClient = _client;\n'
  + '})(window.bw);\n';
