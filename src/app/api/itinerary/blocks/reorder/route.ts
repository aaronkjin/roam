import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PUT(req: NextRequest) {
  const supabase = await createClient();
  const body = await req.json();
  const { blocks } = body;

  if (!blocks || !Array.isArray(blocks)) {
    return NextResponse.json(
      { error: "blocks array is required" },
      { status: 400 }
    );
  }

  // Update each block's position_index and optionally day_id
  for (const item of blocks) {
    const update: Record<string, unknown> = {
      position_index: item.position_index,
    };

    if (item.day_id) {
      update.day_id = item.day_id;
    }

    const { error } = await supabase
      .from("itinerary_blocks")
      .update(update)
      .eq("id", item.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true });
}
