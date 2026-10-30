import React, { useState } from 'react';
import {
  Code,
  Copy,
  Check,
  Globe,
  Clock,
  Layers,
  ShieldAlert,
  Server,
  FileCode,
} from 'lucide-react';
import { HttpResponseState } from '../../types/httpRepeater';

export interface ResponseViewerProps {
  response: HttpResponseState | null;
  loading: boolean;
}

export const ResponseViewer: React.FC<ResponseViewerProps> = ({ response, loading }) => {
  const [activeTab, setActiveTab] = useState<'pretty' | 'raw' | 'preview' | 'headers'>('pretty');
  const [copiedBody, setCopiedBody] = useState<boolean>(false);
  const [copiedRaw, setCopiedRaw] = useState<boolean>(false);

  // Status Badge Colors
  const getStatusBadge = (code: number) => {
    if (code >= 200 && code < 300) {
      return 'bg-emerald-950 text-emerald-400 border-emerald-600 shadow-[0_0_12px_rgba(16,185,129,0.3)]';
    }
    if (code >= 300 && code < 400) {
      return 'bg-cyan-950 text-cyan-400 border-cyan-600';
    }
    if (code >= 400 && code < 500) {
      return 'bg-amber-950 text-amber-400 border-amber-600 shadow-[0_0_12px_rgba(245,158,11,0.25)]';
    }
    return 'bg-red-950 text-red-400 border-red-600 shadow-[0_0_15px_rgba(239,68,68,0.35)]';
  };

  // Format Body as Pretty JSON if possible
  const getFormattedBody = (raw: string) => {
    try {
      const parsed = JSON.parse(raw);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return raw;
    }
  };

  // Raw Response (Status line + Headers + Body)
  const getRawResponse = () => {
    if (!response) return '';
    let raw = `HTTP/1.1 ${response.statusCode} ${response.statusText}\n`;
    Object.entries(response.headers).forEach(([k, v]) => {
      raw += `${k}: ${v}\n`;
    });
    raw += `\n${response.body}`;
    return raw;
  };

  // Copy Handlers
  const handleCopyBody = () => {
    if (!response) return;
    navigator.clipboard.writeText(response.body);
    setCopiedBody(true);
    setTimeout(() => setCopiedBody(false), 1500);
  };

  const handleCopyRaw = () => {
    if (!response) return;
    navigator.clipboard.writeText(getRawResponse());
    setCopiedRaw(true);
    setTimeout(() => setCopiedRaw(false), 1500);
  };

  return (
    <div className="flex flex-col h-full bg-[#070a0f] text-slate-200 font-mono text-xs overflow-hidden">
      {/* Top Response Status Bar */}
      <div className="p-3 bg-[#0a0f17] border-b border-slate-800 flex items-center justify-between flex-wrap gap-2 min-h-[49px]">
        {response ? (
          <div className="flex items-center gap-3 flex-wrap">
            {/* Status Code & Text */}
            <span
              className={`px-2.5 py-1 rounded-md border font-bold text-xs tracking-wider flex items-center gap-1.5 ${getStatusBadge(
                response.statusCode
              )}`}
            >
              <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
              <span>
                {response.statusCode} {response.statusText}
              </span>
            </span>

            {/* Duration */}
            <span className="text-[11px] text-slate-400 flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
              <Clock className="w-3 h-3 text-cyan-400" />
              <span>{response.durationMs} ms</span>
            </span>

            {/* Content Length */}
            <span className="text-[11px] text-slate-400 flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
              <Layers className="w-3 h-3 text-purple-400" />
              <span>
                {response.contentLength > 1024
                  ? `${(response.contentLength / 1024).toFixed(1)} KB`
                  : `${response.contentLength} B`}
              </span>
            </span>

            {/* Content Type */}
            <span className="text-[10px] text-slate-500 font-mono hidden md:inline truncate max-w-[200px]">
              {response.contentType}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-slate-500 text-xs">
            <Server className="w-4 h-4 text-slate-600" />
            <span>NO RESPONSE (SEND A REQUEST TO INSPECT OUTPUT)</span>
          </div>
        )}

        {/* Copy Tools */}
        {response && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleCopyBody}
              className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 flex items-center gap-1 text-[10px]"
              title="Copy response body"
            >
              {copiedBody ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedBody ? 'COPIED!' : 'BODY'}</span>
            </button>

            <button
              onClick={handleCopyRaw}
              className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 flex items-center gap-1 text-[10px]"
              title="Copy raw HTTP response text"
            >
              {copiedRaw ? <Check className="w-3 h-3 text-emerald-400" /> : <FileCode className="w-3 h-3" />}
              <span>RAW</span>
            </button>
          </div>
        )}
      </div>

      {/* Response Navigation Tabs */}
      {response && (
        <div className="px-3 py-1.5 bg-[#090d15] border-b border-slate-800/80 flex items-center gap-2 text-[11px]">
          <button
            onClick={() => setActiveTab('pretty')}
            className={`px-3 py-1 rounded transition ${
              activeTab === 'pretty'
                ? 'bg-slate-800 text-white font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            PRETTY
          </button>
          <button
            onClick={() => setActiveTab('raw')}
            className={`px-3 py-1 rounded transition ${
              activeTab === 'raw'
                ? 'bg-slate-800 text-white font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            RAW
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={`px-3 py-1 rounded transition flex items-center gap-1.5 ${
              activeTab === 'preview'
                ? 'bg-slate-800 text-cyan-300 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe className="w-3 h-3" />
            <span>RENDER HTML</span>
          </button>
          <button
            onClick={() => setActiveTab('headers')}
            className={`px-3 py-1 rounded transition flex items-center gap-1.5 ${
              activeTab === 'headers'
                ? 'bg-slate-800 text-white font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>HEADERS</span>
            <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-slate-700 text-slate-300">
              {Object.keys(response.headers).length}
            </span>
          </button>
        </div>
      )}

      {/* Main Response Body Area */}
      <div className="flex-1 overflow-y-auto p-3 relative">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-3">
            <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
            <span className="text-xs tracking-wider">AWAITING SIMULATED RESPONSE...</span>
          </div>
        ) : !response ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-600 text-center space-y-3 p-6">
            <div className="p-4 rounded-full bg-slate-900 border border-slate-800">
              <Code className="w-8 h-8 text-slate-500 opacity-60" />
            </div>
            <div className="max-w-sm space-y-1">
              <h4 className="text-sm font-bold text-slate-400">Virtual Web Security Repeater</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Send manual HTTP requests against simulated servers or choose a pre-configured offensive scenario.
              </p>
            </div>
          </div>
        ) : (
          <div className="h-full">
            {/* PRETTY TAB */}
            {activeTab === 'pretty' && (
              <pre className="text-emerald-400 font-mono text-xs whitespace-pre-wrap select-text leading-relaxed p-1">
                {getFormattedBody(response.body)}
              </pre>
            )}

            {/* RAW TAB */}
            {activeTab === 'raw' && (
              <pre className="text-slate-300 font-mono text-xs whitespace-pre-wrap select-text leading-relaxed p-1">
                {getRawResponse()}
              </pre>
            )}

            {/* PREVIEW HTML TAB */}
            {activeTab === 'preview' && (
              <div className="h-full rounded-lg border border-slate-800 bg-white overflow-hidden shadow-inner">
                {response.contentType.includes('text/html') ? (
                  <iframe
                    title="HTML Preview"
                    sandbox="allow-same-origin"
                    srcDoc={response.body}
                    className="w-full h-full border-0"
                  />
                ) : (
                  <div className="p-6 text-black font-sans text-sm">
                    <div className="p-3 bg-amber-100 border border-amber-300 rounded text-amber-900 text-xs mb-3 flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-amber-700" />
                      <span>Content-Type is not text/html ({response.contentType}). Displaying raw content:</span>
                    </div>
                    <pre className="text-slate-800 bg-slate-100 p-3 rounded overflow-x-auto text-xs font-mono">
                      {response.body}
                    </pre>
                  </div>
                )}
              </div>
            )}

            {/* HEADERS TAB */}
            {activeTab === 'headers' && (
              <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-950/60">
                <table className="w-full text-left text-xs border-collapse font-mono">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-400 text-[10px]">
                      <th className="p-2 w-1/3">HEADER</th>
                      <th className="p-2">VALUE</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {Object.entries(response.headers).map(([k, v]) => (
                      <tr key={k} className="hover:bg-slate-900/40">
                        <td className="p-2 font-bold text-slate-300">{k}</td>
                        <td className="p-2 text-cyan-400 break-all select-text">{v}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
