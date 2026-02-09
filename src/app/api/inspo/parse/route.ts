import { NextRequest, NextResponse } from "next/server";
import { parseUrl } from "@/lib/url-parser";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { url } = body;

  if (!url) {
    return NextResponse.json({ error: "url is required" }, { status: 400 });
  }

  try {
    const preview = await parseUrl(url);
    return NextResponse.json(preview);
  } catch {
    return NextResponse.json(
      { error: "Failed to parse URL" },
      { status: 422 }
    );
  }
}
