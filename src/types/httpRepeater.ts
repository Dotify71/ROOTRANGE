export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS' | 'HEAD';

export interface ParamItem {
  id: string;
  key: string;
  value: string;
  description?: string;
  enabled: boolean;
}

export interface HeaderItem {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
}

export interface CookieItem {
  id: string;
  name: string;
  value: string;
  path?: string;
  enabled: boolean;
}

export interface HttpResponseState {
  statusCode: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  durationMs: number;
  contentType: string;
  contentLength: number;
  timestamp: number;
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  method: HttpMethod;
  url: string;
  host: string;
  path: string;
  requestHeaders: Record<string, string>;
  requestBody: string;
  response: HttpResponseState;
}

export interface HttpPreset {
  id: string;
  name: string;
  category: 'EXPLOIT' | 'AUTH_BYPASS' | 'RECON' | 'SECURITY_TEST';
  targetMachineId: string;
  method: HttpMethod;
  url: string;
  headers: HeaderItem[];
  cookies: CookieItem[];
  body: string;
  bodyType: 'json' | 'form' | 'raw';
  description: string;
}
