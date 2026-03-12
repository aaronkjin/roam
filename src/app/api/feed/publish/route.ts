import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth, requireTripAccess } from "@/lib/auth";
import { openai } from "@/lib/openai";
import { isMissingDateRangeLabelColumn } from "@/lib/supabase/date-range-compat";

interface SummaryBlock {
  type: string;
  title: string;
  location: string | null;
}

interface SummaryDay {
  day_number: number;
  title: string | null;
  blocks?: SummaryBlock[] | null;
}

// Check if a trip is published
export async function GET(req: NextRequest) {
  const authResult = await requireAuth();
  if (!authResult) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tripId = new URL(req.url).searchParams.get("trip_id");
  if (!tripId) {
    return NextResponse.json({ error: "trip_id is required" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("published_itineraries")
    .select("id, slug")
    .eq("trip_id", tripId)
    .single();

  return NextResponse.json({ published: !!data, slug: data?.slug || null });
}

function generateSlug(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 40)
    .replace(/-$/, "");
  const suffix = Math.random().toString(36).substring(2, 8);
  return `${base}-${suffix}`;
}

async function generateAiSummary(
  title: string,
  destination: string | null,
  days: SummaryDay[]
): Promise<string | null> {
  try {
    // Build a compact itinerary snapshot for the prompt
    const itineraryText = days
      .map((day) => {
        const blocks = (day.blocks || [])
          .filter((block) => block.type !== "heading")
          .map((block) => `- ${block.title}${block.location ? ` (${block.location})` : ""}`)
          .join("\n");
        return `Day ${day.day_number}${day.title ? `: ${day.title}` : ""}\n${blocks}`;
      })
      .join("\n\n");

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.8,
      max_tokens: 200,
      messages: [
        {
          role: "system",
          content:
            "You write short, vivid travel summaries for a Gen Z audience. Be casual, fun, and capture the vibes of the trip. 2-3 sentences max. No emojis. No hashtags.",
        },
        {
          role: "user",
          content: `Write a short vibe-check summary for this itinerary:\n\nTrip: ${title}${destination ? ` in ${destination}` : ""}\n\n${itineraryText}`,
        },
      ],
    });

    return response.choices[0]?.message?.content?.trim() || null;
  } catch (err) {
    console.error("[generateAiSummary] Failed:", err);
    return null;
  }
}

export async function POST(req: NextRequest) {
  const authResult = await requireAuth();
  if (!authResult) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { userId } = authResult;

  const body = await req.json();
  const { trip_id } = body;

  if (!trip_id) {
    return NextResponse.json({ error: "trip_id is required" }, { status: 400 });
  }

  const access = await requireTripAccess(userId, trip_id, "owner");
  if (!access) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = await createClient();

  // Check if already published
  const { data: existing } = await supabase
    .from("published_itineraries")
    .select("id, slug")
    .eq("trip_id", trip_id)
    .single();

  if (existing) {
    return NextResponse.json(
      { error: "Trip is already published", published: existing },
      { status: 409 }
    );
  }

  // Fetch trip data with inspo_items for cover image fallback
  const { data: trip, error: tripError } = await supabase
    .from("trips")
    .select("*, inspo_items(image_url)")
    .eq("id", trip_id)
    .single();

  if (tripError || !trip) {
    return NextResponse.json({ error: "Trip not found" }, { status: 404 });
  }

  // Resolve cover image: trip cover -> first inspo image -> null
  const { inspo_items, ...tripData } = trip;
  const coverImageUrl =
    tripData.cover_image_url ??
    inspo_items?.find((i: { image_url: string | null }) => i.image_url)?.image_url ??
    null;

  // Fetch full itinerary (days + blocks) for stats and AI summary
  const { data: days } = await supabase
    .from("itinerary_days")
    .select("*, blocks:itinerary_blocks(*)")
    .eq("trip_id", trip_id)
    .order("day_number", { ascending: true });

  if (!days || days.length === 0) {
    return NextResponse.json(
      { error: "Trip must have at least one itinerary day to publish" },
      { status: 400 }
    );
  }

  const blockCount = days.reduce(
    (sum: number, day: SummaryDay) => sum + (day.blocks?.length || 0),
    0
  );

  // Generate AI summary
  const aiSummary = await generateAiSummary(
    tripData.title,
    tripData.destination,
    days
  );

  // Determine review status
  const isReviewed = tripData.status === "completed" || tripData.overall_rating !== null;

  const slug = generateSlug(tripData.title);

  const publishPayload = {
    trip_id,
    user_id: userId,
    slug,
    title: tripData.title,
    description: tripData.description,
    destination: tripData.destination,
    cover_image_url: coverImageUrl,
    ai_summary: aiSummary,
    start_date: tripData.start_date,
    end_date: tripData.end_date,
    date_range_label: tripData.date_range_label,
    overall_rating: tripData.overall_rating,
    review_note: tripData.review_note,
    is_reviewed: isReviewed,
    day_count: days.length,
    block_count: blockCount,
  };

  let { data: published, error: publishError } = await supabase
    .from("published_itineraries")
    .insert(publishPayload)
    .select("*")
    .single();

  if (isMissingDateRangeLabelColumn(publishError)) {
    const legacyPayload = { ...publishPayload };
    delete legacyPayload.date_range_label;
    const retry = await supabase
      .from("published_itineraries")
      .insert(legacyPayload)
      .select("*")
      .single();
    published = retry.data
      ? { ...retry.data, date_range_label: tripData.date_range_label ?? null }
      : retry.data;
    publishError = retry.error;
  }

  if (publishError) {
    console.error("[POST /api/feed/publish]", publishError.message);
    return NextResponse.json({ error: publishError.message }, { status: 500 });
  }

  return NextResponse.json(published, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const authResult = await requireAuth();
  if (!authResult) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { userId } = authResult;

  const body = await req.json();
  const { trip_id } = body;

  if (!trip_id) {
    return NextResponse.json({ error: "trip_id is required" }, { status: 400 });
  }

  const supabase = await createClient();

  // Verify ownership
  const { data: published } = await supabase
    .from("published_itineraries")
    .select("id, user_id")
    .eq("trip_id", trip_id)
    .single();

  if (!published) {
    return NextResponse.json({ error: "Not published" }, { status: 404 });
  }

  if (published.user_id !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error } = await supabase
    .from("published_itineraries")
    .delete()
    .eq("id", published.id);

  if (error) {
    console.error("[DELETE /api/feed/publish]", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
