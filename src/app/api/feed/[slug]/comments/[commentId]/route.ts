import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";

interface RouteParams {
  params: Promise<{ slug: string; commentId: string }>;
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const authResult = await requireAuth();
  if (!authResult) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { userId } = authResult;
  const { commentId } = await params;

  const body = await req.json();
  const { body: commentBody } = body;

  if (!commentBody || !commentBody.trim()) {
    return NextResponse.json({ error: "Comment body is required" }, { status: 400 });
  }

  const supabase = await createClient();

  // Only comment author can edit
  const { data: comment } = await supabase
    .from("feed_comments")
    .select("user_id")
    .eq("id", commentId)
    .single();

  if (!comment) {
    return NextResponse.json({ error: "Comment not found" }, { status: 404 });
  }

  if (comment.user_id !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: updated, error } = await supabase
    .from("feed_comments")
    .update({ body: commentBody.trim() })
    .eq("id", commentId)
    .select("*, author:users!feed_comments_user_id_fkey(id, email, display_name, avatar_url)")
    .single();

  if (error) {
    console.error("[PATCH /api/feed/[slug]/comments/[commentId]]", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const authResult = await requireAuth();
  if (!authResult) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { userId } = authResult;
  const { slug, commentId } = await params;

  const supabase = await createClient();

  // Get comment and published itinerary
  const { data: comment } = await supabase
    .from("feed_comments")
    .select("user_id, published_id")
    .eq("id", commentId)
    .single();

  if (!comment) {
    return NextResponse.json({ error: "Comment not found" }, { status: 404 });
  }

  // Allow deletion by comment author or itinerary author
  const { data: published } = await supabase
    .from("published_itineraries")
    .select("user_id, comment_count")
    .eq("id", comment.published_id)
    .single();

  if (comment.user_id !== userId && published?.user_id !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error } = await supabase
    .from("feed_comments")
    .delete()
    .eq("id", commentId);

  if (error) {
    console.error("[DELETE /api/feed/[slug]/comments/[commentId]]", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Decrement comment count
  if (published) {
    await supabase
      .from("published_itineraries")
      .update({ comment_count: Math.max(0, published.comment_count - 1) })
      .eq("id", comment.published_id);
  }

  return NextResponse.json({ success: true });
}
