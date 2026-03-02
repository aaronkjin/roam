import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth, ensureUserSynced, requireTripAccess } from "@/lib/auth";

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

  const sharedTrips = (collabData || [])
    .filter((c: any) => c.trips)
    .map((collab: any) => {
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

  const { data, error } = await supabase
    .from("trips")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("[PATCH /api/trips]", error.message, error.code);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const authResult = await requireAuth();
  if (!authResult) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { userId } = authResult;

  const supabase = await createClient();
  const body = await req.json();

  const { data, error } = await supabase
    .from("trips")
    .insert({
      title: body.title,
      description: body.description || null,
      destination: body.destination || null,
      start_date: body.start_date || null,
      end_date: body.end_date || null,
      user_id: userId,
    })
    .select()
    .single();

  if (error) {
    console.error("[POST /api/trips]", error.message, error.code);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
