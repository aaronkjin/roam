import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET all media for a block
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ blockId: string }> }
) {
  const { blockId } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("block_media")
    .select("*")
    .eq("block_id", blockId)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// POST upload media for a block
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ blockId: string }> }
) {
  const { blockId } = await params;
  const supabase = await createClient();

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  // Determine media type
  const isVideo = file.type.startsWith("video/");
  const isImage = file.type.startsWith("image/");

  if (!isVideo && !isImage) {
    return NextResponse.json(
      { error: "File must be an image or video" },
      { status: 400 }
    );
  }

  const mediaType = isVideo ? "video" : "image";

  // Generate storage path
  const ext = file.name.split(".").pop() || "bin";
  const storagePath = `${blockId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from("block-media")
    .upload(storagePath, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json(
      { error: `Upload failed: ${uploadError.message}` },
      { status: 500 }
    );
  }

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from("block-media").getPublicUrl(storagePath);

  // Save record to database
  const { data, error: dbError } = await supabase
    .from("block_media")
    .insert({
      block_id: blockId,
      type: mediaType,
      url: publicUrl,
      storage_path: storagePath,
      filename: file.name,
    })
    .select()
    .single();

  if (dbError) {
    // Clean up uploaded file if DB insert fails
    await supabase.storage.from("block-media").remove([storagePath]);
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
