import { GoogleMapsProvider } from '../integrations/GoogleMapsProvider';
import { OpenRouteServiceProvider } from '../integrations/OpenRouteServiceProvider';
import { MockRoutingProvider } from '../integrations/MockRoutingProvider';
import { apiKeys } from '../config/apiKeys';

export interface RouteResponse {
  distanceKm: number;
  durationMins: number;
  provider: 'GoogleMaps' | 'OpenRouteService' | 'Mock';
}

export class RoutingService {
  static async calculateRoute(origins: string, destinations: string): Promise<RouteResponse> {
    // 1. Try OpenRouteService first (Default)
    if (apiKeys.openRouteService) {
      try {
        const route = await OpenRouteServiceProvider.calculateRoute(origins, destinations);
        return { ...route, provider: 'OpenRouteService' };
      } catch (err) {
        console.warn('[RoutingService] OpenRouteService failed, trying Google Maps...', err);
      }
    }

    // 2. Try Google Maps (Optional)
    if (apiKeys.googleMaps) {
      try {
        const route = await GoogleMapsProvider.calculateRoute(origins, destinations);
        return { ...route, provider: 'GoogleMaps' };
      } catch (err) {
        console.warn('[RoutingService] Google Maps failed, falling back to Mock...', err);
      }
    }

    // 3. Fallback to Local Mock calculation (Offline)
    const mockRoute = await MockRoutingProvider.calculateRoute(origins, destinations);
    return { ...mockRoute, provider: 'Mock' };
  }
}
export default RoutingService;
