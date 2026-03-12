import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  const authResult = await requireAuth();
  if (!authResult) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { userId } = authResult;
  const { slug } = await params;

  const supabase = await createClient();

  const { data: published } = await supabase
    .from("published_itineraries")
    .select("id, save_count")
    .eq("slug", slug)
    .single();

  if (!published) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: existing } = await supabase
    .from("feed_saves")
    .select("id")
    .eq("published_id", published.id)
    .eq("user_id", userId)
    .single();

  if (existing) {
    // Unsave
    await supabase.from("feed_saves").delete().eq("id", existing.id);
    await supabase
      .from("published_itineraries")
      .update({ save_count: Math.max(0, published.save_count - 1) })
      .eq("id", published.id);

    return NextResponse.json({
      saved: false,
      save_count: Math.max(0, published.save_count - 1),
    });
  } else {
    // Save
    await supabase.from("feed_saves").insert({
      published_id: published.id,
      user_id: userId,
    });
    await supabase
      .from("published_itineraries")
      .update({ save_count: published.save_count + 1 })
      .eq("id", published.id);

    return NextResponse.json({
      saved: true,
      save_count: published.save_count + 1,
    });
  }
}
