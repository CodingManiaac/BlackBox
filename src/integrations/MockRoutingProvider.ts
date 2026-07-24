export class MockRoutingProvider {
  static async calculateRoute(origins: string, destinations: string): Promise<{ distanceKm: number; durationMins: number }> {
    const [lat1, lng1] = origins.split(',').map(Number);
    const [lat2, lng2] = destinations.split(',').map(Number);

    // Standard Haversine distance formula calculation
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distanceKm = R * c;

    // Estimate speed at 45 km/h + traffic penalty factor
    const speedKmh = 45;
    const rawMins = (distanceKm / speedKmh) * 60;
    const durationMins = Math.max(3, Math.round(rawMins + 2)); // minimum 3 mins

    return {
      distanceKm: Math.round(distanceKm * 100) / 100,
      durationMins
    };
  }
}
export default MockRoutingProvider;
