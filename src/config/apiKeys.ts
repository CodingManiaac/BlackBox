export const apiKeys = {
  get gemini(): string {
    return (typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : '') || 
      (globalThis as any).import?.meta?.env?.VITE_GEMINI_API_KEY || '';
  },

  get supermemory(): string {
    return (typeof process !== 'undefined' ? process.env.SUPERMEMORY_API_KEY : '') || 
      (globalThis as any).import?.meta?.env?.VITE_SUPERMEMORY_API_KEY || '';
  },

  get googleMaps(): string {
    return (typeof process !== 'undefined' ? process.env.GOOGLE_MAPS_API_KEY : '') || 
      (globalThis as any).import?.meta?.env?.VITE_GOOGLE_MAPS_API_KEY || '';
  },

  get openRouteService(): string {
    return (typeof process !== 'undefined' ? process.env.OPENROUTESERVICE_API_KEY : '') || 
      (globalThis as any).import?.meta?.env?.VITE_OPENROUTESERVICE_API_KEY || '';
  }
};

export default apiKeys;
