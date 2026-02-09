import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ blockId: string }> }
) {
  const { blockId } = await params;
  const supabase = await createClient();
  const body = await req.json();

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
  const { blockId } = await params;
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
