import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Globe,
  ShieldCheck,
} from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { SimulationEngine } from '../simulation/simulationEngine';
import { soundManager } from '../audio/soundManager';
import { RequestEditor } from './http-repeater/RequestEditor';
import { ResponseViewer } from './http-repeater/ResponseViewer';
import { RequestHistoryDrawer } from './http-repeater/RequestHistoryDrawer';
import { REPEATER_PRESETS } from './http-repeater/repeaterPresets';
import {
  HttpMethod,
  ParamItem,
  HeaderItem,
  CookieItem,
  HttpResponseState,
  HistoryItem,
  HttpPreset,
} from '../types/httpRepeater';

export const HttpRepeater: React.FC = () => {
  const { activeMachineId, setActiveMachine } = useGameStore();
  const engine = SimulationEngine.getInstance();

  const machines = useMemo(() => engine.getMachines(), [engine]);
  const activeMachine = useMemo(
    () => engine.getMachine(activeMachineId) || machines[0],
    [engine, activeMachineId, machines]
  );

  // Default initial configuration based on active machine
  const getInitialUrl = (machineId: string) => {
    switch (machineId) {
      case 'iron-vault':
        return 'http://10.10.11.82:3000/api/login';
      case 'corp-dc01':
        return 'http://10.10.11.99:80/certsrv';
      default:
        return 'http://10.10.11.45:80/login';
    }
  };

  const [method, setMethod] = useState<HttpMethod>('GET');
  const [url, setUrl] = useState<string>(() => getInitialUrl(activeMachineId));
  const [params, setParams] = useState<ParamItem[]>([]);
  const [headers, setHeaders] = useState<HeaderItem[]>([
    { id: 'h1', key: 'Host', value: '10.10.11.45', enabled: true },
    {
      id: 'h2',
      key: 'User-Agent',
      value: 'Mozilla/5.0 (X11; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/115.0',
      enabled: true,
    },
    { id: 'h3', key: 'Accept', value: '*/*', enabled: true },
  ]);
  const [cookies, setCookies] = useState<CookieItem[]>([]);
  const [body, setBody] = useState<string>('');
  const [bodyType, setBodyType] = useState<'json' | 'form' | 'raw'>('json');

  const [loading, setLoading] = useState<boolean>(false);
  const [response, setResponse] = useState<HttpResponseState | null>(null);

  // History state
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(true);

  // Sync target URL when active machine changes from outside
  useEffect(() => {
    if (activeMachine) {
      const defaultHost = activeMachine.ip;
      const port =
        activeMachine.ports.find((p) => p.port === 80 || p.port === 8080 || p.port === 3000)?.port || 80;
      const cleanPath = url.includes('/') ? url.substring(url.indexOf('/', 8)) : '/';
      const newUrl = `http://${defaultHost}:${port}${cleanPath}`;
      setUrl(newUrl);

      setHeaders((prev) =>
        prev.map((h) => (h.key.toLowerCase() === 'host' ? { ...h, value: `${defaultHost}:${port}` } : h))
      );
    }
  }, [activeMachineId]);

  // Synchronize Params with URL Query String
  const handleParamsChange = (newParams: ParamItem[]) => {
    setParams(newParams);
    try {
      const urlObj = new URL(url);
      urlObj.search = '';
      newParams
        .filter((p) => p.enabled && p.key)
        .forEach((p) => {
          urlObj.searchParams.append(p.key, p.value);
        });
      setUrl(urlObj.toString());
    } catch {
      // Ignored if URL is temporarily malformed
    }
  };

  // Synchronize URL change with Params
  const handleUrlChange = (newUrl: string) => {
    setUrl(newUrl);
    try {
      const urlObj = new URL(newUrl);
      const parsedParams: ParamItem[] = [];
      urlObj.searchParams.forEach((val, key) => {
        parsedParams.push({
          id: `param-${key}-${Math.random().toString(36).substr(2, 4)}`,
          key,
          value: val,
          enabled: true,
        });
      });
      if (parsedParams.length > 0) {
        setParams(parsedParams);
      }
    } catch {
      // Ignored while user is typing
    }
  };

  // Synchronize Cookies with the Cookie Header
  const handleCookiesChange = (newCookies: CookieItem[]) => {
    setCookies(newCookies);
    const cookieHeaderStr = newCookies
      .filter((c) => c.enabled && c.name)
      .map((c) => `${c.name}=${c.value}`)
      .join('; ');

    setHeaders((prev) => {
      const existing = prev.find((h) => h.key.toLowerCase() === 'cookie');
      if (cookieHeaderStr) {
        if (existing) {
          return prev.map((h) =>
            h.key.toLowerCase() === 'cookie' ? { ...h, value: cookieHeaderStr, enabled: true } : h
          );
        }
        return [
          ...prev,
          { id: `hdr-cookie-${Date.now()}`, key: 'Cookie', value: cookieHeaderStr, enabled: true },
        ];
      }
      return prev.filter((h) => h.key.toLowerCase() !== 'cookie');
    });
  };

  // Handle Preset Selection
  const handleSelectPreset = (preset: HttpPreset) => {
    soundManager.playKey();
    setActiveMachine(preset.targetMachineId);
    setMethod(preset.method);
    setUrl(preset.url);
    setHeaders(preset.headers);
    setCookies(preset.cookies);
    setBody(preset.body);
    setBodyType(preset.bodyType);

    // Sync params from URL
    try {
      const urlObj = new URL(preset.url);
      const parsedParams: ParamItem[] = [];
      urlObj.searchParams.forEach((val, key) => {
        parsedParams.push({
          id: `param-${key}`,
          key,
          value: val,
          enabled: true,
        });
      });
      setParams(parsedParams);
    } catch {
      setParams([]);
    }
  };

  // Send Request action
  const handleSendRequest = useCallback(() => {
    soundManager.playKey();
    setLoading(true);

    let targetHost = '10.10.11.45';
    let path = '/';

    try {
      if (url.startsWith('http://') || url.startsWith('https://')) {
        const parsed = new URL(url);
        targetHost = parsed.hostname;
        path = parsed.pathname + parsed.search;
      } else {
        const slashIdx = url.indexOf('/');
        if (slashIdx !== -1) {
          targetHost = url.substring(0, slashIdx);
          path = url.substring(slashIdx);
        } else {
          targetHost = url;
          path = '/';
        }
      }
    } catch {
      targetHost = url.split('/')[0] || '10.10.11.45';
      path = '/' + (url.split('/')[1] || '');
    }

    // Build headers dictionary
    const headersDict: Record<string, string> = {};
    headers
      .filter((h) => h.enabled && h.key)
      .forEach((h) => {
        headersDict[h.key] = h.value;
      });

    // Ensure Host header matches
    if (!headersDict['Host']) {
      headersDict['Host'] = targetHost;
    }

    // Include Content-Type if body is present
    if (body && !headersDict['Content-Type'] && !headersDict['content-type']) {
      headersDict['Content-Type'] =
        bodyType === 'json'
          ? 'application/json'
          : bodyType === 'form'
          ? 'application/x-www-form-urlencoded'
          : 'text/plain';
    }

    // Execute through SimulationEngine virtual HTTP router
    const result = engine.handleHttpRequest(targetHost, {
      method,
      path,
      headers: headersDict,
      body,
    });

    const getStatusText = (code: number) => {
      switch (code) {
        case 200:
          return 'OK';
        case 201:
          return 'Created';
        case 204:
          return 'No Content';
        case 301:
          return 'Moved Permanently';
        case 302:
          return 'Found';
        case 400:
          return 'Bad Request';
        case 401:
          return 'Unauthorized';
        case 403:
          return 'Forbidden';
        case 404:
          return 'Not Found';
        case 500:
          return 'Internal Server Error';
        case 502:
          return 'Bad Gateway';
        case 504:
          return 'Gateway Timeout';
        default:
          return 'Response';
      }
    };

    const responseState: HttpResponseState = {
      statusCode: result.statusCode,
      statusText: getStatusText(result.statusCode),
      headers: result.headers,
      body: result.body,
      durationMs: result.durationMs,
      contentType: result.contentType,
      contentLength: new TextEncoder().encode(result.body).length,
      timestamp: Date.now(),
    };

    // Play appropriate sound
    if (result.statusCode === 200 || result.statusCode === 201) {
      soundManager.playConnect();
    } else {
      soundManager.playKey();
    }

    setResponse(responseState);
    setLoading(false);

    // Record into History
    const historyItem: HistoryItem = {
      id: `hist-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: Date.now(),
      method,
      url,
      host: targetHost,
      path,
      requestHeaders: headersDict,
      requestBody: body,
      response: responseState,
    };

    setHistory((prev) => [historyItem, ...prev.slice(0, 49)]);
    setSelectedHistoryId(historyItem.id);
  }, [engine, method, url, headers, body, bodyType]);

  // Replay from history
  const handleSelectHistoryItem = (item: HistoryItem) => {
    soundManager.playKey();
    setSelectedHistoryId(item.id);
    setMethod(item.method);
    setUrl(item.url);
    setBody(item.requestBody);

    // Convert requestHeaders back into HeaderItem array
    const headerItems: HeaderItem[] = Object.entries(item.requestHeaders).map(([k, v], idx) => ({
      id: `h-hist-${idx}`,
      key: k,
      value: v,
      enabled: true,
    }));
    setHeaders(headerItems);

    // Load response
    setResponse(item.response);
  };

  // Reset to machine defaults
  const handleReset = () => {
    soundManager.playKey();
    const defaultUrl = getInitialUrl(activeMachineId);
    setUrl(defaultUrl);
    setMethod('GET');
    setBody('');
    setParams([]);
    setCookies([]);
    setHeaders([
      { id: 'h1', key: 'Host', value: activeMachine.ip, enabled: true },
      {
        id: 'h2',
        key: 'User-Agent',
        value: 'Mozilla/5.0 (X11; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/115.0',
        enabled: true,
      },
      { id: 'h3', key: 'Accept', value: '*/*', enabled: true },
    ]);
    setResponse(null);
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#070a0f] text-slate-200 overflow-hidden font-mono">
      {/* Top Banner: Range Isolation Status & Preset Quick Bar */}
      <div className="p-3 bg-[#090d16] border-b border-slate-800 flex items-center justify-between flex-wrap gap-2 text-xs">
        {/* Title & Security Isolation Badge */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 font-bold text-slate-100">
            <Globe className="w-4 h-4 text-emerald-400" />
            <span className="tracking-wider uppercase text-[11px]">
              // WEB SECURITY PROXY & HTTP REPEATER
            </span>
          </div>

          <span className="hidden sm:flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-700/60 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            <span>RANGE ISOLATION ACTIVE: 10.10.0.0/16 ONLY</span>
          </span>
        </div>

        {/* Machine Target Dropdown & Presets */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Target Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-slate-500 uppercase">TARGET:</span>
            <select
              value={activeMachineId}
              onChange={(e) => setActiveMachine(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-slate-200 text-xs outline-none focus:border-cyan-500 cursor-pointer"
            >
              {machines.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.ip})
                </option>
              ))}
            </select>
          </div>

          {/* Preset Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-slate-500 uppercase">PRESET:</span>
            <select
              onChange={(e) => {
                const found = REPEATER_PRESETS.find((p) => p.id === e.target.value);
                if (found) handleSelectPreset(found);
              }}
              defaultValue=""
              className="bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-emerald-400 text-xs outline-none focus:border-emerald-500 cursor-pointer max-w-[220px] truncate"
            >
              <option value="" disabled>
                -- Select Attack Preset --
              </option>
              {REPEATER_PRESETS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Split Panels: Request Editor vs Response Inspector */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-800 overflow-hidden">
        {/* Left: Request Editor */}
        <div className="flex flex-col h-full overflow-hidden">
          <RequestEditor
            method={method}
            onMethodChange={setMethod}
            url={url}
            onUrlChange={handleUrlChange}
            params={params}
            onParamsChange={handleParamsChange}
            headers={headers}
            onHeadersChange={setHeaders}
            cookies={cookies}
            onCookiesChange={handleCookiesChange}
            body={body}
            onBodyChange={setBody}
            bodyType={bodyType}
            onBodyTypeChange={setBodyType}
            loading={loading}
            onSend={handleSendRequest}
            onReset={handleReset}
          />
        </div>

        {/* Right: Response Inspector */}
        <div className="flex flex-col h-full overflow-hidden">
          <ResponseViewer response={response} loading={loading} />
        </div>
      </div>

      {/* Bottom Collapsible: Request History Drawer */}
      <RequestHistoryDrawer
        history={history}
        selectedHistoryId={selectedHistoryId}
        onSelectHistoryItem={handleSelectHistoryItem}
        onClearHistory={() => setHistory([])}
        isOpen={isHistoryOpen}
        onToggleOpen={() => setIsHistoryOpen((prev) => !prev)}
      />
    </div>
  );
};
