import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth, requireTripAccess, resolveTripId } from "@/lib/auth";

// DELETE a media item
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ blockId: string; mediaId: string }> }
) {
  const authResult = await requireAuth();
  if (!authResult) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { mediaId } = await params;

  const tripId = await resolveTripId("media", mediaId);
  if (!tripId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const access = await requireTripAccess(authResult.userId, tripId, "editor");
  if (!access) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = await createClient();

  // Get the media record to find storage path
  const { data: media, error: fetchError } = await supabase
    .from("block_media")
    .select("storage_path")
    .eq("id", mediaId)
    .single();

  if (fetchError || !media) {
    return NextResponse.json({ error: "Media not found" }, { status: 404 });
  }

  // Delete from storage
  await supabase.storage.from("block-media").remove([media.storage_path]);

  // Delete from database
  const { error: deleteError } = await supabase
    .from("block_media")
    .delete()
    .eq("id", mediaId);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
