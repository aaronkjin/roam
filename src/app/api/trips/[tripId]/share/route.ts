import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { randomBytes } from "crypto";
import { requireAuth, requireTripAccess } from "@/lib/auth";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  const { tripId } = await params;

  const authResult = await requireAuth();
  if (!authResult) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { userId } = authResult;

  const access = await requireTripAccess(userId, tripId, "owner");
  if (!access) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = await createClient();

  // Check if trip exists and if it already has a share token
  const { data: trip, error: fetchError } = await supabase
    .from("trips")
    .select("*")
    .eq("id", tripId)
    .single();

  if (fetchError || !trip) {
    console.error("[POST /api/trips/share]", fetchError?.message, fetchError?.code);
    return NextResponse.json({ error: "Trip not found" }, { status: 404 });
  }

  // Return existing token if already shared
  if (trip.share_token) {
    const share_url = `${process.env.NEXT_PUBLIC_APP_URL || ""}/shared/${trip.share_token}`;
    return NextResponse.json({ share_token: trip.share_token, share_url });
  }

  // Generate a new token
  const share_token = randomBytes(16).toString("hex");

  const { error: updateError } = await supabase
    .from("trips")
    .update({ share_token })
    .eq("id", tripId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  const share_url = `${process.env.NEXT_PUBLIC_APP_URL || ""}/shared/${share_token}`;
  return NextResponse.json({ share_token, share_url });
}
