import { NextRequest, NextResponse } from "next/server";
import { openai } from "@/lib/openai";
import { requireAuth } from "@/lib/auth";
import { fetchPexelsImage } from "@/lib/pexels";

// Simple in-memory cache (keyed by location+title, 1hr TTL)
const cache = new Map<string, { data: unknown; expiry: number }>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

export async function POST(req: NextRequest) {
  const authResult = await requireAuth();
  if (!authResult) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { title, location, type, description } = body;

  if (!title) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }

  const cacheKey = `${title}:${location || ""}`;
  const cached = cache.get(cacheKey);
  if (cached && cached.expiry > Date.now()) {
    return NextResponse.json(cached.data);
  }

  // Fetch additional photos from Pexels
  const photoQueries = [
    `${title} ${location || ""} interior`,
    `${title} ${location || ""}`,
    `${location || ""} ${type || "travel"}`,
  ];

  const photoPromises = photoQueries.map((q) => fetchPexelsImage(q));

  // Use the Responses API with web_search_preview for real-time info
  const enrichPromise = openai.responses.create({
    model: "gpt-5.2",
    tools: [{ type: "web_search_preview" }],
    input: `Search the web for "${title}" in "${location || "unknown location"}". ${description ? `Context: ${description}` : ""}
${type === "food" ? "This is a restaurant/food spot." : "This is a tourist attraction/activity."}

Search for real reviews, ratings, and practical visitor information. Return ONLY valid JSON (no markdown code fences) with these fields:
{
  "rating": number from 1-5 (aggregate from real review sites like Google, Yelp, TripAdvisor),
  "price_range": "$" or "$$" or "$$$" or "$$$$",
  "opening_hours": "typical hours" or null if unknown,
  "reviews": [{"text": "actual review excerpt", "source": "Google/Yelp/TripAdvisor", "rating": 4}] (3 real or closely paraphrased reviews from actual review sites),
  "why_people_love_it": ["reason 1", "reason 2", "reason 3"] (based on real reviewer sentiment),
  "need_to_know": ["practical tip 1", "tip 2"] (real tips like reservations needed, best time to visit, how to get there),
  "booking_url": null,
  "official_website": "official site URL if found" or null,
  "google_maps_url": "Google Maps URL if found" or null
}`,
    max_output_tokens: 1200,
  });

  const [enrichResult, ...photoResults] = await Promise.allSettled([
    enrichPromise,
    ...photoPromises,
  ]);

  let enrichData: Record<string, unknown> = {};
  if (enrichResult.status === "fulfilled") {
    try {
      // Extract text content from the Responses API output
      let content = "";
      for (const item of enrichResult.value.output) {
        if (item.type === "message") {
          for (const c of item.content) {
            if (c.type === "output_text") {
              content = c.text;
            }
          }
        }
      }
      if (!content) content = "{}";
      // Strip markdown code fences if present
      const jsonStr = content.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
      enrichData = JSON.parse(jsonStr);
    } catch (e) {
      console.error("[places/enrich] JSON parse error:", e);
      enrichData = {};
    }
  } else {
    console.error("[places/enrich] GPT call failed:", enrichResult.reason);
  }

  const photos: string[] = [];
  for (const r of photoResults) {
    if (r.status === "fulfilled" && r.value) {
      photos.push(r.value as string);
    }
  }

  // Build search URLs — use location name (the actual place) rather than the block title
  // (which may be descriptive like "Lunch at Nishiki Market")
  const placeName = location || title;
  const encodedPlace = encodeURIComponent(placeName);
  const result = {
    ...enrichData,
    photos,
    yelp_url: `https://www.yelp.com/search?find_desc=${encodedPlace}`,
    tripadvisor_url: `https://www.tripadvisor.com/Search?q=${encodedPlace}`,
    google_maps_search_url: (enrichData.google_maps_url as string) || `https://www.google.com/maps/search/?api=1&query=${encodedPlace}`,
  };

  cache.set(cacheKey, { data: result, expiry: Date.now() + CACHE_TTL });

  return NextResponse.json(result);
}
