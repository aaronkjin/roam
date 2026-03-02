import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth, requireTripAccess, resolveTripId } from "@/lib/auth";

export async function PUT(req: NextRequest) {
  const authResult = await requireAuth();
  if (!authResult) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();
  const body = await req.json();
  const { items } = body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json(
      { error: "items array is required" },
      { status: 400 }
    );
  }

  const tripId = await resolveTripId("inspo", items[0].id);
  if (!tripId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const access = await requireTripAccess(authResult.userId, tripId, "editor");
  if (!access) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  for (const item of items) {
    const { error } = await supabase
      .from("inspo_items")
      .update({ position_index: item.position_index })
      .eq("id", item.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true });
}
