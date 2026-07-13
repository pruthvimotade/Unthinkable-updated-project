/**
 * Geospatial utility functions for distance calculations.
 */

/**
 * Calculates the Haversine distance between two lat/lng points in kilometers.
 * Uses the Earth's mean radius of 6371 km.
 * 
 * @param lat1 - Latitude of the first point in degrees
 * @param lng1 - Longitude of the first point in degrees
 * @param lat2 - Latitude of the second point in degrees
 * @param lng2 - Longitude of the second point in degrees
 * @returns Distance between the two points in kilometers
 */
export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Converts degrees to radians.
 * 
 * @param deg - Angle in degrees
 * @returns Angle in radians
 */
function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}
