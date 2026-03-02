import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth, requireTripAccess } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ tripId: string; userId: string }> }
) {
  const authResult = await requireAuth();
  if (!authResult) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { userId: authUserId } = authResult;

  const { tripId, userId: targetUserId } = await params;

  const access = await requireTripAccess(authUserId, tripId, "owner");
  if (!access) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { role } = body;

  if (!role || !["editor", "viewer"].includes(role)) {
    return NextResponse.json(
      { error: "role must be 'editor' or 'viewer'" },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("trip_collaborators")
    .update({ role })
    .eq("trip_id", tripId)
    .eq("user_id", targetUserId)
    .select()
    .single();

  if (error) {
    console.error("[PATCH /api/trips/[tripId]/collaborators/[userId]]", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Collaborator not found" }, { status: 404 });
  }

  return NextResponse.json(data);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ tripId: string; userId: string }> }
) {
  const authResult = await requireAuth();
  if (!authResult) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { userId: authUserId } = authResult;

  const { tripId, userId: targetUserId } = await params;

  // Owner can remove anyone, users can remove themselves
  const isRemovingSelf = authUserId === targetUserId;

  if (!isRemovingSelf) {
    const access = await requireTripAccess(authUserId, tripId, "owner");
    if (!access) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("trip_collaborators")
    .delete()
    .eq("trip_id", tripId)
    .eq("user_id", targetUserId);

  if (error) {
    console.error("[DELETE /api/trips/[tripId]/collaborators/[userId]]", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
