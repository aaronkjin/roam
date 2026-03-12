import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth, requireTripAccess, resolveTripId } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ blockId: string }> }
) {
  const authResult = await requireAuth();
  if (!authResult) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { blockId } = await params;

  const tripId = await resolveTripId("block", blockId);
  if (!tripId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const access = await requireTripAccess(authResult.userId, tripId, "editor");
  if (!access) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = await createClient();
  const body = await req.json();
  const updateKeys = Object.keys(body);
  const reviewOnlyKeys = ["rating", "review_note"];
  const isReviewOnlyUpdate =
    updateKeys.length > 0 && updateKeys.every((key) => reviewOnlyKeys.includes(key));

  if (access.role !== "owner" && !isReviewOnlyUpdate) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("itinerary_blocks")
    .update(body)
    .eq("id", blockId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ blockId: string }> }
) {
  const authResult = await requireAuth();
  if (!authResult) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { blockId } = await params;

  const tripId = await resolveTripId("block", blockId);
  if (!tripId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const access = await requireTripAccess(authResult.userId, tripId, "editor");
  if (!access || access.role !== "owner") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("itinerary_blocks")
    .delete()
    .eq("id", blockId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
