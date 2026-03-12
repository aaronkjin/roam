import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth, ensureUserSynced, requireTripAccess } from "@/lib/auth";
import { isMissingDateRangeLabelColumn } from "@/lib/supabase/date-range-compat";

interface InspoImageRow {
  image_url: string | null;
}

interface TripRowWithInspo {
  cover_image_url: string | null;
  date_range_label?: string | null;
  inspo_items?: InspoImageRow[] | null;
  [key: string]: unknown;
}

interface CollaboratorTripRow {
  role: string;
  trip_id: string;
  trips: TripRowWithInspo | null;
}

export async function GET() {
  const authResult = await requireAuth();
  if (!authResult) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { userId } = authResult;
  await ensureUserSynced(userId);

  const supabase = await createClient();

  // Query own trips
  const { data: ownData, error: ownError } = await supabase
    .from("trips")
    .select("*, inspo_items(image_url)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (ownError) {
    console.error("[GET /api/trips] ownTrips", ownError.message, ownError.code);
    return NextResponse.json({ error: ownError.message }, { status: 500 });
  }

  const ownTrips = ownData.map(({ inspo_items, ...trip }) => ({
    ...trip,
    cover_image_url:
      trip.cover_image_url ??
      inspo_items?.find((i: { image_url: string | null }) => i.image_url)
        ?.image_url ??
      null,
    userRole: "owner",
  }));

  // Query shared trips via trip_collaborators
  const { data: collabData, error: collabError } = await supabase
    .from("trip_collaborators")
    .select("role, trip_id, trips(*, inspo_items(image_url))")
    .eq("user_id", userId)
    .not("accepted_at", "is", null);

  if (collabError) {
    console.error("[GET /api/trips] sharedTrips", collabError.message, collabError.code);
    return NextResponse.json({ error: collabError.message }, { status: 500 });
  }

  const sharedTrips = ((collabData || []) as unknown as CollaboratorTripRow[])
    .filter((c) => c.trips)
    .map((collab) => {
      const { inspo_items, ...trip } = collab.trips;
      return {
        ...trip,
        cover_image_url:
          trip.cover_image_url ??
          inspo_items?.find((i: { image_url: string | null }) => i.image_url)
            ?.image_url ??
          null,
        userRole: collab.role,
      };
    });

  return NextResponse.json({ ownTrips, sharedTrips });
}

export async function PATCH(req: NextRequest) {
  const authResult = await requireAuth();
  if (!authResult) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { userId } = authResult;

  const supabase = await createClient();
  const body = await req.json();
  const { id, ...updates } = body;

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const access = await requireTripAccess(userId, id, "editor");
  if (!access) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const normalizedUpdates = { ...updates };
  if (
    !normalizedUpdates.date_range_label &&
    (normalizedUpdates.start_date || normalizedUpdates.end_date)
  ) {
    normalizedUpdates.date_range_label =
      [normalizedUpdates.start_date, normalizedUpdates.end_date]
        .filter(Boolean)
        .join(" - ");
  }

  let { data, error } = await supabase
    .from("trips")
    .update(normalizedUpdates)
    .eq("id", id)
    .select("*, inspo_items(image_url)")
    .single();

  if (isMissingDateRangeLabelColumn(error)) {
    const legacyUpdates = { ...normalizedUpdates };
    delete legacyUpdates.date_range_label;
    const retry = await supabase
      .from("trips")
      .update(legacyUpdates)
      .eq("id", id)
      .select("*, inspo_items(image_url)")
      .single();
    data = retry.data;
    error = retry.error;
  }

  if (error) {
    console.error("[PATCH /api/trips]", error.message, error.code);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { inspo_items, ...trip } = data as unknown as TripRowWithInspo;

  return NextResponse.json({
    ...trip,
    cover_image_url:
      trip.cover_image_url ??
      inspo_items?.find((item: { image_url: string | null }) => item.image_url)?.image_url ??
      null,
  });
}

export async function POST(req: NextRequest) {
  const authResult = await requireAuth();
  if (!authResult) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { userId } = authResult;

  const supabase = await createClient();
  const body = await req.json();

  const dateRangeLabel =
    body.date_range_label?.trim() ||
    [body.start_date, body.end_date].filter(Boolean).join(" - ");

  if (!dateRangeLabel) {
    return NextResponse.json(
      { error: "date_range_label is required" },
      { status: 400 }
    );
  }

  const insertPayload = {
    title: body.title,
    description: body.description || null,
    destination: body.destination || null,
    start_date: body.start_date || null,
    end_date: body.end_date || null,
    date_range_label: dateRangeLabel,
    user_id: userId,
  };

  let { data, error } = await supabase
    .from("trips")
    .insert(insertPayload)
    .select()
    .single();

  if (isMissingDateRangeLabelColumn(error)) {
    const legacyPayload = { ...insertPayload };
    delete legacyPayload.date_range_label;
    const retry = await supabase
      .from("trips")
      .insert(legacyPayload)
      .select()
      .single();
    data = retry.data;
    error = retry.error;
  }

  if (error) {
    console.error("[POST /api/trips]", error.message, error.code);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(
    { ...data, date_range_label: data?.date_range_label ?? dateRangeLabel },
    { status: 201 }
  );
}

export async function DELETE(req: NextRequest) {
  const authResult = await requireAuth();
  if (!authResult) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { userId } = authResult;

  const body = await req.json();
  const { id } = body;

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  // Only owners can delete
  const access = await requireTripAccess(userId, id, "owner");
  if (!access) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = await createClient();
  const { error } = await supabase.from("trips").delete().eq("id", id);

  if (error) {
    console.error("[DELETE /api/trips]", error.message, error.code);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
