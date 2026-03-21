import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth, requireTripAccess } from "@/lib/auth";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ tripId: string; inviteId: string }> }
) {
  const authResult = await requireAuth();
  if (!authResult) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { tripId, inviteId } = await params;

  const access = await requireTripAccess(authResult.userId, tripId, "owner");
  if (!access) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("pending_invites")
    .delete()
    .eq("id", inviteId)
    .eq("trip_id", tripId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
