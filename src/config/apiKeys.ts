export const apiKeys = {
  get gemini(): string {
    return ((globalThis as any).process?.env?.GEMINI_API_KEY || '') || 
      (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_API_KEY) ||
      (globalThis as any)['import']?.meta?.env?.VITE_GEMINI_API_KEY || '';
  },

  get supermemory(): string {
    return ((globalThis as any).process?.env?.SUPERMEMORY_API_KEY || '') || 
      (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPERMEMORY_API_KEY) ||
      (globalThis as any)['import']?.meta?.env?.VITE_SUPERMEMORY_API_KEY || '';
  },

  get googleMaps(): string {
    return ((globalThis as any).process?.env?.GOOGLE_MAPS_API_KEY || '') || 
      (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GOOGLE_MAPS_API_KEY) ||
      (globalThis as any)['import']?.meta?.env?.VITE_GOOGLE_MAPS_API_KEY || '';
  },

  get openRouteService(): string {
    return ((globalThis as any).process?.env?.OPENROUTESERVICE_API_KEY || '') || 
      (typeof import.meta !== 'undefined' && import.meta.env?.VITE_OPENROUTESERVICE_API_KEY) ||
      (globalThis as any)['import']?.meta?.env?.VITE_OPENROUTESERVICE_API_KEY || '';
  }
};

export default apiKeys;
