import { apiKeys } from '../config/apiKeys';

export class OpenRouteServiceProvider {
  static async calculateRoute(origins: string, destinations: string): Promise<{ distanceKm: number; durationMins: number }> {
    const key = apiKeys.openRouteService;
    if (!key) {
      throw new Error('OpenRouteService API key is not configured.');
    }

    // Convert coordinates format "lat,lng" to ORS required "[lng,lat]"
    const [startLat, startLng] = origins.split(',').map(Number);
    const [endLat, endLng] = destinations.split(',').map(Number);

    const url = `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${key}&start=${startLng},${startLat}&end=${endLng},${endLat}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`OpenRouteService response status: ${response.status}`);
    }

    const data = await response.json();
    const route = data.features?.[0]?.properties?.summary;
    if (!route) {
      throw new Error('No route features found in OpenRouteService response.');
    }

    return {
      distanceKm: route.distance / 1000,
      durationMins: Math.round(route.duration / 60)
    };
  }
}
export default OpenRouteServiceProvider;
