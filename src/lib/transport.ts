import type { TransportOption } from "@/types/itinerary";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

interface Coords {
  lat: number;
  lng: number;
}

interface DirectionsResult {
  distance_meters: number;
  duration_seconds: number;
}

async function fetchDirections(
  from: Coords,
  to: Coords,
  profile: string
): Promise<DirectionsResult | null> {
  if (!MAPBOX_TOKEN) return null;

  const profileMap: Record<string, string> = {
    walking: "mapbox/walking",
    driving: "mapbox/driving",
  };
  const mapboxProfile = profileMap[profile] || "mapbox/walking";

  try {
    const res = await fetch(
      `https://api.mapbox.com/directions/v5/${mapboxProfile}/${from.lng},${from.lat};${to.lng},${to.lat}?overview=false&access_token=${MAPBOX_TOKEN}`
    );
    if (!res.ok) return null;
    const data = await res.json();
    const route = data.routes?.[0];
    if (!route) return null;
    return {
      distance_meters: Math.round(route.distance),
      duration_seconds: Math.round(route.duration),
    };
  } catch {
    return null;
  }
}

/**
 * Build transport options between two blocks.
 * Fetches Mapbox Directions for walking + driving.
 * Estimates transit as ~1.5x walking time with $2-3 flat cost.
 */
export async function buildTransportOptions(
  from: Coords,
  to: Coords
): Promise<TransportOption[]> {
  const options: TransportOption[] = [];

  const [walking, driving] = await Promise.all([
    fetchDirections(from, to, "walking"),
    fetchDirections(from, to, "driving"),
  ]);

  if (walking) {
    options.push({
      mode: "walking",
      duration_minutes: Math.round(walking.duration_seconds / 60),
      distance_meters: walking.distance_meters,
      cost_estimate: 0,
      route_description: `Walk ${Math.round(walking.distance_meters / 1000 * 10) / 10} km`,
    });

    // Estimate transit as ~1.5x walking time with flat cost
    const transitMinutes = Math.round((walking.duration_seconds / 60) * 0.6);
    if (transitMinutes > 3) {
      options.push({
        mode: "transit",
        duration_minutes: transitMinutes,
        distance_meters: walking.distance_meters,
        cost_estimate: walking.distance_meters > 3000 ? 3 : 2,
        route_description: `Public transit ~${transitMinutes} min`,
      });
    }
  }

  if (driving) {
    // Estimate taxi/rideshare cost based on distance
    const distKm = driving.distance_meters / 1000;
    const baseFare = 3;
    const perKm = 1.5;
    const cost = Math.round(baseFare + distKm * perKm);

    options.push({
      mode: "driving",
      duration_minutes: Math.round(driving.duration_seconds / 60),
      distance_meters: driving.distance_meters,
      cost_estimate: cost,
      route_description: `Taxi/rideshare ~${Math.round(driving.duration_seconds / 60)} min`,
    });
  }

  return options;
}

/**
 * Determine default transport mode based on distance.
 * Walking if < 1.5km, transit if 1.5-5km, driving if > 5km.
 */
export function defaultTransportMode(distanceMeters: number): string {
  if (distanceMeters < 1500) return "walking";
  if (distanceMeters < 5000) return "transit";
  return "driving";
}
