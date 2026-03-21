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
          "type": "activity" | "food" | "note" | "heading",
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
          "photo_query": "Grand Bazaar colorful spice stalls Istanbul Turkey"
        }
      ]
    }
  ]
}

Guidelines:
- Start each day with a "heading" block for the day theme
- Be specific with times, locations, and cost estimates
- The "location" field must be the specific place name with city (e.g., "Kinkaku-ji, Kyoto" not just "Kinkaku-ji")
- CRITICAL: location_lat and location_lng must be precise GPS coordinates for the EXACT venue or landmark. Use coordinates you are confident about — for example, Namsan Seoul Tower is at 37.5512, 126.9882 (not a generic city center). If you are unsure of exact coordinates for a specific restaurant or shop, use the coordinates of the nearest well-known landmark or intersection. Never default to generic city-center coordinates.
- Descriptions should be 1-3 sentences, vivid and helpful
- Cost estimates in USD unless specified
- photo_query must include the EXACT venue/place name, the city, and a visual descriptor. Examples: "Rokujuan tea house matcha interior Kyoto Japan", "Nishiki Market food stalls colorful Kyoto", "Fushimi Inari thousand red torii gates Kyoto". For restaurants, include "restaurant interior food" or "dish plating". NEVER use generic terms like "travel" or "vacation". OMIT photo_query entirely for type "note" and "heading".
- GEOGRAPHIC GROUPING: Each day must focus on one neighborhood/district. Activities on the same day should be walkable or within 1-2 transit stops of each other. Use heading blocks to mark district transitions within a day.
- Do NOT generate accommodation blocks for the stay hotel. Only generate accommodation blocks if the accommodation IS the activity (e.g., ryokan experience, resort check-in). The app shows the hotel separately on the map.
- Do NOT generate transport blocks. Transport between activities is computed automatically by the app.

TIME ALLOCATION:
- Each day must cover at least 09:00–21:00 (12 hours of planned time)
- Minimum 5 activity/food blocks per day (excluding headings)
- Maximum gap between consecutive activities: 90 minutes
- Include at least one "free time / explore on your own" slot per day

DURATION BY CATEGORY:
- Museum/gallery: 90–150 min | Temple/shrine: 30–60 min
- Park/garden: 45–90 min | Shopping district: 120–180 min (MUST break into 3-4 specific shops, 30-45 min each)
- Food market: 60–120 min | Restaurant: 60–90 min | Cafe: 30–45 min | Street food: 20–30 min
- Bar/nightlife: 90–120 min | Neighborhood walk: 60–90 min

ACTIVITY DENSITY:
- When a broad activity category spans 2+ hours (e.g., "afternoon shopping", "explore the market"), ALWAYS break it into multiple specific locations/stops
- Example: "3hr shopping in Harajuku" → Takeshita Street (45m), Laforet Harajuku (30m), Cat Street vintage shops (45m), Tokyu Plaza rooftop (30m)
- Each sub-activity needs a specific location name with precise GPS coordinates
- Group sub-activities within walking distance of each other

GEOGRAPHIC CLUSTERING (CRITICAL — follow strictly):
- All activities within a morning or afternoon slot must be within 2km of each other (walking or 1 transit stop)
- Estimate realistic transit time between locations: walking (~5 min/400m), subway (~15 min between stations), taxi (~10 min/3km). Add this to scheduling.
- When transitioning between neighborhoods, add a "heading" block naming the new district/area
- Cluster at least 3 activities in each area before moving on — never schedule a single activity in a district then immediately leave
- Organize each day around 1-2 neighborhoods maximum. Morning in one area, afternoon in the same or one adjacent area
- If the user's inspo items are spread across the city, group geographically similar items onto the same day even if it means reordering

- Always output ONLY the JSON, no markdown or extra text`;

interface TripContext {
  startDate?: string;
  endDate?: string;
  dateRangeLabel?: string;
  stayAddress?: string;
  notes?: string;
  budgetPreference?: "budget" | "balanced" | "luxury";
}

function buildTripContextBlock(ctx?: TripContext): string {
  const lines: string[] = [];
  if (ctx?.dateRangeLabel) {
    lines.push(`Traveler's trip timing: ${ctx.dateRangeLabel}`);
  }
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
  if (ctx?.budgetPreference) {
    const budgetLabel =
      ctx.budgetPreference === "budget"
        ? "budget-conscious"
        : ctx.budgetPreference === "luxury"
          ? "luxury"
          : "balanced";
    lines.push(`Budget preference: ${budgetLabel}`);
    lines.push(
      "Match the pricing, dining, and activity choices to this budget preference."
    );
  }
  if (ctx?.stayAddress) {
    lines.push(`Staying at: ${ctx.stayAddress}`);
    lines.push(
      "The user's hotel/stay is shown on the map separately. Do NOT generate accommodation blocks for this address."
    );
  }
  if (ctx?.notes) {
    lines.push(`Traveler notes: ${ctx.notes}`);
    lines.push(
      "Prioritize these notes wherever possible, especially for must-do experiences and constraints."
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

interface EditBlock {
  id: string;
  type: string;
  title: string;
  description: string | null;
  start_time: string | null;
  end_time: string | null;
  duration_minutes: number | null;
  location: string | null;
  location_lat: number | null;
  location_lng: number | null;
  cost_estimate: number | null;
  currency: string;
}

export function buildEditPrompt(
  selectedBlocks: EditBlock[],
  contextBlocks: EditBlock[],
  instruction: string
): string {
  const formatBlock = (b: EditBlock) =>
    `{ id: "${b.id}", type: "${b.type}", title: "${b.title}", description: "${b.description || ""}", start_time: "${b.start_time || ""}", end_time: "${b.end_time || ""}", duration_minutes: ${b.duration_minutes ?? "null"}, location: "${b.location || ""}", location_lat: ${b.location_lat ?? "null"}, location_lng: ${b.location_lng ?? "null"}, cost_estimate: ${b.cost_estimate ?? "null"}, currency: "${b.currency}" }`;

  const contextSection = contextBlocks.length > 0
    ? `\nSurrounding blocks for context (do NOT modify these):\n${contextBlocks.map(formatBlock).join("\n")}\n`
    : "";

  return `You are a travel itinerary editor. The user wants to modify the following blocks.
${contextSection}
Blocks to modify:
${selectedBlocks.map(formatBlock).join("\n")}

User's instruction: "${instruction}"

Return a JSON array of modified blocks with the same IDs. Only change fields implied by the user's instruction. Keep descriptions vivid (1-3 sentences). Maintain time consistency with surrounding blocks. Provide accurate GPS coordinates for any replaced locations. Format:
[{ "id": "...", "title": "...", "description": "...", "start_time": "...", "end_time": "...", "duration_minutes": ..., "location": "...", "location_lat": ..., "location_lng": ..., "cost_estimate": ..., "currency": "...", "photo_query": "..." }]

Output ONLY the JSON array, no markdown or extra text.`;
}

export { SYSTEM_PROMPT };
