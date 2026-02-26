import { NextRequest, NextResponse } from "next/server";

// GET /api/geocode?q=Kinkaku-ji, Kyoto
export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q");

  if (!query) {
    return NextResponse.json({ error: "q parameter is required" }, { status: 400 });
  }

  const token = process.env.MAPBOX_SECRET_TOKEN || process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "Mapbox token not configured" }, { status: 500 });
  }

  const url = `https://api.mapbox.com/search/geocode/v6/forward?q=${encodeURIComponent(query)}&limit=1&access_token=${token}`;

  const res = await fetch(url);
  if (!res.ok) {
    return NextResponse.json({ error: "Geocoding failed" }, { status: 502 });
  }

  const data = await res.json();
  const feature = data.features?.[0];

  if (!feature) {
    return NextResponse.json({ lat: null, lng: null, place_name: null });
  }

  return NextResponse.json({
    lat: feature.geometry.coordinates[1],
    lng: feature.geometry.coordinates[0],
    place_name: feature.properties.full_address || feature.properties.name || query,
  });
}
