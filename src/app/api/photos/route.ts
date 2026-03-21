import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const authResult = await requireAuth();
  if (!authResult) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const q = req.nextUrl.searchParams.get("q");
  if (!q) return NextResponse.json({ error: "q is required" }, { status: 400 });

  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) return NextResponse.json({ url: null });

  const count = parseInt(req.nextUrl.searchParams.get("count") || "1", 10);
  const perPage = Math.max(count, 10);

  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(q)}&per_page=${perPage}&orientation=landscape`;
  const res = await fetch(url, { headers: { Authorization: apiKey } });
  if (!res.ok) return NextResponse.json({ url: null, urls: [] });

  const data = await res.json();
  const photos = (data.photos || []) as { src: { large: string }; width: number; height: number }[];

  if (count > 1) {
    // Return multiple URLs for photo picker
    const urls = photos.slice(0, count).map((p) => p.src.large);
    return NextResponse.json({ url: urls[0] ?? null, urls });
  }

  // Single photo: pick a random one
  const pick = photos.length > 0
    ? photos[Math.floor(Math.random() * Math.min(photos.length, 5))]
    : null;
  return NextResponse.json({ url: pick?.src?.large ?? null });
}
