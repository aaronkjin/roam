import type { InspoItem } from "@/types/inspo";

const SYSTEM_PROMPT = `You are a travel planning assistant. You generate detailed day-by-day travel itineraries in JSON format.

Your output must be valid JSON matching this schema:
{
  "days": [
    {
      "day_number": 1,
      "title": "Exploring the Old City",
      "summary": "A day spent wandering through historic neighborhoods...",
      "blocks": [
        {
          "type": "activity" | "transport" | "accommodation" | "food" | "note" | "heading",
          "title": "Visit the Grand Bazaar",
          "description": "Spend the morning exploring...",
          "start_time": "09:00",
          "end_time": "11:30",
          "duration_minutes": 150,
          "location": "Grand Bazaar, Istanbul",
          "location_lat": 41.0106,
          "location_lng": 28.9684,
          "cost_estimate": 0,
          "currency": "USD",
          "photo_query": "Kinkaku-ji golden pavilion reflection Kyoto Japan"
        }
      ]
    }
  ]
}

Guidelines:
- Each day should have 4-8 blocks
- Include a mix of activities, food, and transport
- Start each day with a "heading" block for the day theme
- Be specific with times, locations, and cost estimates
- The "location" field must be the specific place name with city (e.g., "Kinkaku-ji, Kyoto" not just "Kinkaku-ji")
- CRITICAL: location_lat and location_lng must be precise GPS coordinates for the EXACT venue or landmark. Use coordinates you are confident about — for example, Namsan Seoul Tower is at 37.5512, 126.9882 (not a generic city center). If you are unsure of exact coordinates for a specific restaurant or shop, use the coordinates of the nearest well-known landmark or intersection. Never default to generic city-center coordinates.
- Descriptions should be 1-3 sentences, vivid and helpful
- Cost estimates in USD unless specified
- photo_query: A vivid 4-8 word image search string. Include place name + visual descriptor + city/country. Examples: activity → "Kinkaku-ji golden pavilion temple Kyoto Japan", food → "kaiseki tasting menu Japanese restaurant interior Kyoto", accommodation → "traditional ryokan exterior garden Kyoto Japan". OMIT photo_query entirely for type "transport", "note", and "heading".
- GEOGRAPHIC GROUPING: Each day must focus on one neighborhood/district. Activities on the same day should be walkable or within 1-2 transit stops of each other. Use heading blocks to mark district transitions within a day.
- HOTEL BOOKENDS: If stayAddress is provided, each day MUST start with an "accommodation" block (title: "Leave [Hotel Name]", start_time: "09:00") and end with an "accommodation" block (title: "Return to [Hotel Name]"). Hotel accommodation blocks should NOT have a photo_query.
- Always output ONLY the JSON, no markdown or extra text`;

interface TripContext {
  startDate?: string;
  endDate?: string;
  stayAddress?: string;
}

function buildTripContextBlock(ctx?: TripContext): string {
  const lines: string[] = [];
  if (ctx?.startDate && ctx?.endDate) {
    const start = new Date(ctx.startDate);
    const end = new Date(ctx.endDate);
    const fmt = (d: Date) =>
      d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    lines.push(`Trip dates: ${fmt(start)} – ${fmt(end)}`);
    lines.push(
      "Use real dates for each day heading (e.g. \"Day 1 — March 15, 2026\"). The title field for each day should include the real date."
    );
  }
  if (ctx?.stayAddress) {
    lines.push(`Staying at: ${ctx.stayAddress}`);
    lines.push(
      "REQUIRED: Start every day with an accommodation block for departing from this address, and end every day with an accommodation block for returning here."
    );
  }
  return lines.length > 0 ? "\n" + lines.join("\n") + "\n" : "";
}

export function buildStrictPrompt(
  inspoItems: InspoItem[],
  destination: string | null,
  numDays: number,
  ctx?: TripContext
): string {
  const inspoSummary = inspoItems
    .map((item, i) => {
      const parts = [`${i + 1}.`];
      if (item.title) parts.push(item.title);
      if (item.description) parts.push(`- ${item.description}`);
      if (item.url) parts.push(`(${item.url})`);
      if (item.user_note) parts.push(`Note: "${item.user_note}"`);
      if (item.tags?.length) parts.push(`Tags: ${item.tags.join(", ")}`);
      return parts.join(" ");
    })
    .join("\n");

  const tripContext = buildTripContextBlock(ctx);

  return `Generate a ${numDays}-day travel itinerary for ${destination || "this destination"}.
${tripContext}
STRICT MODE: You MUST include ALL of the following specific places, activities, and restaurants from the user's inspiration. Build the itinerary around these exact locations. Do not substitute or replace them with alternatives.

User's Inspiration Items:
${inspoSummary}

Create a practical day-by-day plan that visits every single item listed above, arranged in a logical geographic and timing order.`;
}

export function buildCreativePrompt(
  inspoItems: InspoItem[],
  destination: string | null,
  numDays: number,
  ctx?: TripContext
): string {
  const inspoSummary = inspoItems
    .map((item, i) => {
      const parts = [`${i + 1}.`];
      if (item.title) parts.push(item.title);
      if (item.description) parts.push(`- ${item.description}`);
      if (item.user_note) parts.push(`Note: "${item.user_note}"`);
      if (item.tags?.length) parts.push(`Tags: ${item.tags.join(", ")}`);
      return parts.join(" ");
    })
    .join("\n");

  const tripContext = buildTripContextBlock(ctx);

  return `Generate a ${numDays}-day travel itinerary for ${destination || "this destination"}.
${tripContext}
CREATIVE MODE: Use the following inspiration items to understand the traveler's vibes, interests, and aesthetic preferences. Then create a unique itinerary that captures the SPIRIT of what they like — feel free to suggest hidden gems, local favorites, and unexpected experiences that match their taste.

User's Inspiration Vibes:
${inspoSummary}

Create a creative, surprising itinerary that a travel-savvy Gen Z adventurer would love. Mix popular spots with off-the-beaten-path discoveries.`;
}

export { SYSTEM_PROMPT };
