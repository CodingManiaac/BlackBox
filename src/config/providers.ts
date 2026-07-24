export const providersConfig = {
  routing: {
    defaultProvider: 'openrouteservice' as 'googlemaps' | 'openrouteservice' | 'mock',
    googleMapsEndpoint: 'https://maps.googleapis.com/maps/api',
    openRouteServiceEndpoint: 'https://api.openrouteservice.org',
    maxRangeKm: 50
  },
  memory: {
    cacheTTLSeconds: 300
  }
};

export default providersConfig;
