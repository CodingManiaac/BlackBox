// Centralized API Base URL configuration for local dev and cloud deployment (Render, Vercel, Netlify)
export const getApiBaseUrl = (): string => {
  // 1. Environment variable override (e.g. VITE_API_BASE_URL=https://my-app.onrender.com)
  const envUrl = typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_BASE_URL;
  if (envUrl) {
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
export default getApiBaseUrl;
