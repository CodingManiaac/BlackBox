import { apiKeys } from '../config/apiKeys';

export class GoogleMapsProvider {
  static async calculateRoute(origins: string, destinations: string): Promise<{ distanceKm: number; durationMins: number }> {
    const key = apiKeys.googleMaps;
    if (!key) {
      throw new Error('Google Maps API key is not configured.');
    }

    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origins}&destinations=${destinations}&key=${key}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Google Maps API error: ${response.statusText}`);
    }

    const data = await response.json();
    const element = data.rows?.[0]?.elements?.[0];
    if (element?.status !== 'OK') {
      throw new Error('Could not calculate routing using Google Maps.');
    }

    return {
      distanceKm: element.distance.value / 1000,
      durationMins: Math.round(element.duration.value / 60)
    };
  }
}
export default GoogleMapsProvider;
