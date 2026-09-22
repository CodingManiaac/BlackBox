// Centralized API Base URL configuration & production fetch interceptor
export const getApiBaseUrl = (): string => {
  // 1. Environment variable override (e.g. VITE_API_BASE_URL=https://my-app.onrender.com)
  const envUrl = typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_BASE_URL;
  if (envUrl && envUrl !== 'http://localhost:3001') {
    return envUrl.replace(/\/$/, '');
  }

  // 2. In browser production deployments, use current origin (same-domain fullstack)
  if (typeof window !== 'undefined') {
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (!isLocalhost) {
      return window.location.origin;
    }
  }

  // 3. Fallback for local development
  return 'http://localhost:3001';
};

export const API_BASE_URL = getApiBaseUrl();

// Global production request interceptor: automatically redirects any legacy 'http://localhost:3001' calls
if (typeof window !== 'undefined') {
  const targetBaseUrl = getApiBaseUrl();
  if (targetBaseUrl !== 'http://localhost:3001') {
    const originalFetch = window.fetch;
    window.fetch = function (input: RequestInfo | URL, init?: RequestInit) {
      if (typeof input === 'string' && input.includes('http://localhost:3001')) {
        const updatedUrl = input.replace('http://localhost:3001', targetBaseUrl);
        return originalFetch(updatedUrl, init);
      }
      return originalFetch(input, init);
    };

    const OriginalEventSource = window.EventSource;
    window.EventSource = function (url: string | URL, eventSourceInitDict?: EventSourceInit) {
      let urlStr = typeof url === 'string' ? url : url.toString();
      if (urlStr.includes('http://localhost:3001')) {
        urlStr = urlStr.replace('http://localhost:3001', targetBaseUrl);
      }
      return new OriginalEventSource(urlStr, eventSourceInitDict);
    } as any;
  }
}

export default getApiBaseUrl;
