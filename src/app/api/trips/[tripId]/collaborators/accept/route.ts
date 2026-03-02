import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  const authResult = await requireAuth();
  if (!authResult) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { userId } = authResult;

  const { tripId } = await params;

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("trip_collaborators")
    .update({ accepted_at: new Date().toISOString() })
    .eq("trip_id", tripId)
    .eq("user_id", userId)
    .is("accepted_at", null)
    .select()
    .single();

  if (error || !data) {
    if (!data || error?.code === "PGRST116") {
      return NextResponse.json(
        { error: "No pending invite found" },
        { status: 404 }
      );
    }
    console.error("[POST /api/trips/[tripId]/collaborators/accept]", error?.message);
    return NextResponse.json({ error: error?.message || "Unknown error" }, { status: 500 });
  }

  return NextResponse.json(data);
}
