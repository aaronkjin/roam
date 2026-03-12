import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const { slug } = await params;
  const supabase = await createClient();

  // Find published itinerary
  const { data: published } = await supabase
    .from("published_itineraries")
    .select("id")
    .eq("slug", slug)
    .single();

  if (!published) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: comments, error } = await supabase
    .from("feed_comments")
    .select("*, author:users!feed_comments_user_id_fkey(id, email, display_name, avatar_url)")
    .eq("published_id", published.id)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[GET /api/feed/[slug]/comments]", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(comments || []);
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  const authResult = await requireAuth();
  if (!authResult) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { userId } = authResult;
  const { slug } = await params;

  const body = await req.json();
  const { body: commentBody } = body;

  if (!commentBody || !commentBody.trim()) {
    return NextResponse.json({ error: "Comment body is required" }, { status: 400 });
  }

  const supabase = await createClient();

  const { data: published } = await supabase
    .from("published_itineraries")
    .select("id, comment_count")
    .eq("slug", slug)
    .single();

  if (!published) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: comment, error } = await supabase
    .from("feed_comments")
    .insert({
      published_id: published.id,
      user_id: userId,
      body: commentBody.trim(),
    })
    .select("*, author:users!feed_comments_user_id_fkey(id, email, display_name, avatar_url)")
    .single();

  if (error) {
    console.error("[POST /api/feed/[slug]/comments]", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Increment comment count
  await supabase
    .from("published_itineraries")
    .update({ comment_count: published.comment_count + 1 })
    .eq("id", published.id);

  return NextResponse.json(comment, { status: 201 });
}
