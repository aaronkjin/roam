/**
 * Geographic utility functions for distance/time calculations.
 */

/** Haversine distance between two lat/lng points in meters */
export function haversine(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000; // Earth radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Midpoint between two lat/lng points as [lng, lat] (GeoJSON order) */
export function midpoint(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): [number, number] {
  return [(lng1 + lng2) / 2, (lat1 + lat2) / 2];
}

/** Estimate walking time in minutes (~80m/min average walking speed) */
export function estimateWalkMinutes(meters: number): number {
  return Math.round(meters / 80);
}

/** Format distance for display */
export function formatDistance(meters: number, unit: "mi" | "km" = "mi"): string {
  if (unit === "mi") {
    const miles = meters / 1609.344;
    if (miles < 0.1) return `${Math.round(meters * 3.28084)} ft`;
    return `${miles.toFixed(1)} mi`;
  }
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

/** Format duration for display */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}
