import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

// In-memory cache (coord pair + profile → result, 10min TTL)
const cache = new Map<string, { data: unknown; expiry: number }>();
const CACHE_TTL = 10 * 60 * 1000;

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

export async function GET(req: NextRequest) {
  const authResult = await requireAuth();
  if (!authResult) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const originLat = searchParams.get("origin_lat");
  const originLng = searchParams.get("origin_lng");
  const destLat = searchParams.get("dest_lat");
  const destLng = searchParams.get("dest_lng");
  const profile = searchParams.get("profile") || "walking";

  if (!originLat || !originLng || !destLat || !destLng) {
    return NextResponse.json({ error: "Missing coordinates" }, { status: 400 });
  }

  const lats = [originLat, destLat].map(Number);
  const lngs = [originLng, destLng].map(Number);
  if (lats.some((c) => isNaN(c) || c < -90 || c > 90) || lngs.some((l) => isNaN(l) || l < -180 || l > 180)) {
    return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
  }

  if (!MAPBOX_TOKEN) {
    return NextResponse.json({ error: "Mapbox not configured" }, { status: 500 });
  }

  const cacheKey = `${originLng},${originLat}→${destLng},${destLat}:${profile}`;
  const cached = cache.get(cacheKey);
  if (cached && cached.expiry > Date.now()) {
    return NextResponse.json(cached.data);
  }

  const profileMap: Record<string, string> = {
    walking: "mapbox/walking",
    driving: "mapbox/driving",
    cycling: "mapbox/cycling",
  };
  const mapboxProfile = profileMap[profile] || "mapbox/walking";

  try {
    const res = await fetch(
      `https://api.mapbox.com/directions/v5/${mapboxProfile}/${originLng},${originLat};${destLng},${destLat}?geometries=geojson&overview=full&access_token=${MAPBOX_TOKEN}`
    );

    if (!res.ok) {
      return NextResponse.json({ error: "Directions API failed" }, { status: 502 });
    }

    const data = await res.json();
    const route = data.routes?.[0];

    if (!route) {
      return NextResponse.json({ error: "No route found" }, { status: 404 });
    }

    const result = {
      distance_meters: Math.round(route.distance),
      duration_seconds: Math.round(route.duration),
      geometry: route.geometry,
    };

    cache.set(cacheKey, { data: result, expiry: Date.now() + CACHE_TTL });

    return NextResponse.json(result);
  } catch (err) {
    console.error("[directions] error:", err);
    return NextResponse.json({ error: "Failed to fetch directions" }, { status: 500 });
  }
}
