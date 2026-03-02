import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth, requireTripAccess, resolveTripId } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth();
  if (!authResult) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const tripId = await resolveTripId("inspo", id);
  if (!tripId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const access = await requireTripAccess(authResult.userId, tripId, "viewer");
  if (!access) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("inspo_items")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  return NextResponse.json(data);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth();
  if (!authResult) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const tripId = await resolveTripId("inspo", id);
  if (!tripId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const access = await requireTripAccess(authResult.userId, tripId, "editor");
  if (!access) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = await createClient();
  const body = await req.json();

  const { data, error } = await supabase
    .from("inspo_items")
    .update(body)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth();
  if (!authResult) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const tripId = await resolveTripId("inspo", id);
  if (!tripId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const access = await requireTripAccess(authResult.userId, tripId, "editor");
  if (!access) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = await createClient();

  const { error } = await supabase.from("inspo_items").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
