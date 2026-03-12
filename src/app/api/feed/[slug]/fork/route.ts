import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import type { ItineraryBlock } from "@/types/itinerary";
import { isMissingDateRangeLabelColumn } from "@/lib/supabase/date-range-compat";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  const authResult = await requireAuth();
  if (!authResult) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { userId } = authResult;
  const { slug } = await params;

  const body = await req.json().catch(() => ({}));
  const customTitle = body.title;

  const supabase = await createClient();

  // Find published itinerary
  let { data: published, error: publishedError } = await supabase
    .from("published_itineraries")
    .select("id, trip_id, title, description, destination, cover_image_url, start_date, end_date, date_range_label, fork_count")
    .eq("slug", slug)
    .single();

  if (isMissingDateRangeLabelColumn(publishedError)) {
    const retry = await supabase
      .from("published_itineraries")
      .select("id, trip_id, title, description, destination, cover_image_url, start_date, end_date, fork_count")
      .eq("slug", slug)
      .single();
    published = retry.data ? { ...retry.data, date_range_label: null } : retry.data;
    publishedError = retry.error;
  }

  if (publishedError || !published) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Create new trip
  const tripPayload = {
    user_id: userId,
    title: customTitle || `Copy of ${published.title}`,
    description: published.description,
    destination: published.destination,
    cover_image_url: published.cover_image_url,
    start_date: published.start_date,
    end_date: published.end_date,
    date_range_label: published.date_range_label,
    status: "planning",
    forked_from: published.id,
  };

  let { data: newTrip, error: tripError } = await supabase
    .from("trips")
    .insert(tripPayload)
    .select()
    .single();

  if (isMissingDateRangeLabelColumn(tripError)) {
    const legacyPayload = { ...tripPayload };
    delete legacyPayload.date_range_label;
    const retry = await supabase
      .from("trips")
      .insert(legacyPayload)
      .select()
      .single();
    newTrip = retry.data
      ? { ...retry.data, date_range_label: published.date_range_label ?? null }
      : retry.data;
    tripError = retry.error;
  }

  if (tripError || !newTrip) {
    console.error("[POST /api/feed/[slug]/fork] create trip", tripError?.message);
    return NextResponse.json({ error: "Failed to create trip" }, { status: 500 });
  }

  // Copy itinerary days and blocks from source trip
  const { data: sourceDays } = await supabase
    .from("itinerary_days")
    .select("*, blocks:itinerary_blocks(*)")
    .eq("trip_id", published.trip_id)
    .order("day_number", { ascending: true });

  if (sourceDays && sourceDays.length > 0) {
    for (const sourceDay of sourceDays) {
      const { data: newDay } = await supabase
        .from("itinerary_days")
        .insert({
          trip_id: newTrip.id,
          day_number: sourceDay.day_number,
          date: sourceDay.date,
          title: sourceDay.title,
          summary: sourceDay.summary,
        })
        .select()
        .single();

      if (newDay && sourceDay.blocks && sourceDay.blocks.length > 0) {
        const sortedBlocks = sourceDay.blocks.sort(
          (a: ItineraryBlock, b: ItineraryBlock) => a.position_index - b.position_index
        );

        for (const block of sortedBlocks) {
          await supabase.from("itinerary_blocks").insert({
            day_id: newDay.id,
            type: block.type,
            title: block.title,
            description: block.description,
            start_time: block.start_time,
            end_time: block.end_time,
            duration_minutes: block.duration_minutes,
            location: block.location,
            location_lat: block.location_lat,
            location_lng: block.location_lng,
            cost_estimate: block.cost_estimate,
            currency: block.currency,
            url: block.url,
            image_url: block.image_url,
            position_index: block.position_index,
            ai_generated: false,
            source_inspo_id: null,
            rating: null,
            review_note: null,
          });
        }
      }
    }
  }

  // Increment fork count
  await supabase
    .from("published_itineraries")
    .update({ fork_count: published.fork_count + 1 })
    .eq("id", published.id);

  return NextResponse.json(newTrip, { status: 201 });
}
