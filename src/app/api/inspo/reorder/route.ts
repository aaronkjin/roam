import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PUT(req: NextRequest) {
  const supabase = await createClient();
  const body = await req.json();
  const { items } = body;

  if (!items || !Array.isArray(items)) {
    return NextResponse.json(
      { error: "items array is required" },
      { status: 400 }
    );
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
