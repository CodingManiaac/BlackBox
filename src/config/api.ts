// Centralized API Base URL configuration & production fetch interceptor
export const getApiBaseUrl = (): string => {
  // 1. Runtime override stored in browser localStorage (if configured via UI/prompt)
  if (typeof window !== 'undefined') {
    const customUrl = localStorage.getItem('medx_api_url');
    if (customUrl) {
      return customUrl.replace(/\/$/, '');
    }
  }

  // 2. Environment variable override set during build (e.g. VITE_API_BASE_URL=https://your-backend.onrender.com)
  const envUrl = typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_BASE_URL;
  if (envUrl && envUrl !== 'http://localhost:3001') {
    return envUrl.replace(/\/$/, '');
  }

  // 3. If running on a static host (like Vercel or Netlify) without VITE_API_BASE_URL configured,
  // check if window.location is NOT localhost.
  if (typeof window !== 'undefined') {
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (!isLocalhost) {
      // If deployed as fullstack on Render, origin has the backend.
      // If deployed on Vercel without VITE_API_BASE_URL, return window.location.origin as fallback.
      return window.location.origin;
    }
  }

  // 4. Default for local development
  return 'http://localhost:3001';
};

export const API_BASE_URL = getApiBaseUrl();

// Global request interceptor: dynamically rewrites legacy 'http://localhost:3001' calls at runtime
if (typeof window !== 'undefined') {
  const originalFetch = window.fetch;
  window.fetch = function (input: RequestInfo | URL, init?: RequestInit) {
    const activeBaseUrl = getApiBaseUrl();
    if (typeof input === 'string' && input.includes('http://localhost:3001') && activeBaseUrl !== 'http://localhost:3001') {
      const updatedUrl = input.replace('http://localhost:3001', activeBaseUrl);
      return originalFetch(updatedUrl, init);
    }
    return originalFetch(input, init);
  };

  const OriginalEventSource = window.EventSource;
  window.EventSource = function (url: string | URL, eventSourceInitDict?: EventSourceInit) {
    let urlStr = typeof url === 'string' ? url : url.toString();
    const activeBaseUrl = getApiBaseUrl();
    if (urlStr.includes('http://localhost:3001') && activeBaseUrl !== 'http://localhost:3001') {
      urlStr = urlStr.replace('http://localhost:3001', activeBaseUrl);
    }
    return new OriginalEventSource(urlStr, eventSourceInitDict);
  } as any;
}

export default getApiBaseUrl;
