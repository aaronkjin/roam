import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";

/**
 * Strip activity prefixes from block titles to extract the actual place name.
 * "Breakfast at Cafe Onion Seongsu" → "Cafe Onion Seongsu"
 */
function stripActivityPrefix(title: string): string {
  const prefixes = [
    /^breakfast\s+at\s+/i, /^lunch\s+at\s+/i, /^dinner\s+at\s+/i,
    /^brunch\s+at\s+/i, /^snack\s+at\s+/i, /^drinks?\s+at\s+/i,
    /^coffee\s+at\s+/i, /^eat\s+at\s+/i, /^dine\s+at\s+/i,
    /^travel\s+to\s+/i, /^walk\s+to\s+/i, /^taxi\s+to\s+/i,
    /^bus\s+to\s+/i, /^train\s+to\s+/i, /^drive\s+to\s+/i,
    /^head\s+to\s+/i, /^go\s+to\s+/i, /^transfer\s+to\s+/i,
    /^check[\s-]*in\s+at\s+/i, /^check[\s-]*out\s+from\s+/i,
    /^stay\s+at\s+/i, /^visit\s+/i, /^explore\s+/i, /^tour\s+/i,
    /^see\s+/i, /^discover\s+/i, /^wander\s+/i,
    /^stroll\s+through\s+/i, /^stroll\s+/i,
    /^shop\s+at\s+/i, /^shopping\s+at\s+/i,
    /^hike\s+to\s+/i, /^hike\s+/i, /^relax\s+at\s+/i,
  ];
  let result = title;
  for (const prefix of prefixes) {
    const stripped = result.replace(prefix, "");
    if (stripped !== result) { result = stripped; break; }
  }
  return result.trim();
}

// POST /api/backfill-coords — Bulk geocode for blocks missing coordinates
// Add ?force=true to clear existing coords and re-geocode everything
export async function POST(req: NextRequest) {
  const authResult = await requireAuth();
  if (!authResult) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();
  const token = process.env.MAPBOX_SECRET_TOKEN || process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  const force = req.nextUrl.searchParams.get("force") === "true";

  if (!token) {
    return NextResponse.json({ error: "Mapbox token not configured" }, { status: 500 });
  }

  // If force mode, clear all existing coordinates first
  if (force) {
    await supabase
      .from("itinerary_blocks")
      .update({ location_lat: null, location_lng: null })
      .neq("type", "heading")
      .neq("type", "note");
  }

  // Fetch all blocks without coordinates (except heading/note types)
  const { data: blocks, error } = await supabase
    .from("itinerary_blocks")
    .select("id, location, title, type, day_id")
    .is("location_lat", null)
    .neq("type", "heading")
    .neq("type", "note");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!blocks || blocks.length === 0) {
    return NextResponse.json({ message: "No blocks need geocoding", updated: 0 });
  }

  // Fetch day→trip mapping to get trip destinations for context
  const dayIds = [...new Set(blocks.map((b) => b.day_id))];
  const { data: days } = await supabase
    .from("itinerary_days")
    .select("id, trip_id")
    .in("id", dayIds);

  const tripIds = [...new Set((days || []).map((d) => d.trip_id))];
  const { data: trips } = await supabase
    .from("trips")
    .select("id, destination")
    .in("id", tripIds);

  // Build lookup: day_id → destination
  const dayToTrip = new Map((days || []).map((d) => [d.id, d.trip_id]));
  const tripToDestination = new Map((trips || []).map((t) => [t.id, t.destination]));

  let updated = 0;
  const results: { title: string; query: string; lat: number; lng: number }[] = [];
  const errors: string[] = [];

  for (const block of blocks) {
    try {
      // Use location text, or fall back to cleaned title
      const base = block.location || stripActivityPrefix(block.title);
      if (!base) {
        errors.push(`No location or title for block ${block.id}`);
        continue;
      }

      // Append trip destination for context
      const tripId = dayToTrip.get(block.day_id);
      const destination = tripId ? tripToDestination.get(tripId) : null;
      let query = base;
      if (destination && !base.toLowerCase().includes(destination.toLowerCase())) {
        query = `${base}, ${destination}`;
      }

      const url = `https://api.mapbox.com/search/geocode/v6/forward?q=${encodeURIComponent(query)}&limit=1&access_token=${token}`;
      const res = await fetch(url);
      if (!res.ok) {
        errors.push(`Failed to geocode "${query}" (${block.id})`);
        continue;
      }

      const data = await res.json();
      const feature = data.features?.[0];
      if (!feature) {
        errors.push(`No results for "${query}" (${block.id})`);
        continue;
      }

      const lat = feature.geometry.coordinates[1];
      const lng = feature.geometry.coordinates[0];

      const { error: updateError } = await supabase
        .from("itinerary_blocks")
        .update({ location_lat: lat, location_lng: lng })
        .eq("id", block.id);

      if (updateError) {
        errors.push(`DB update failed for "${query}" (${block.id})`);
      } else {
        updated++;
        results.push({ title: block.title, query, lat, lng });
      }

      // 200ms delay between requests to avoid rate limits
      await new Promise((r) => setTimeout(r, 200));
    } catch {
      errors.push(`Error geocoding block ${block.id}`);
    }
  }

  return NextResponse.json({
    message: `Geocoded ${updated}/${blocks.length} blocks`,
    updated,
    total: blocks.length,
    results,
    errors: errors.length > 0 ? errors : undefined,
  });
}
