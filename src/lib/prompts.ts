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
          "cost_estimate": 0,
          "currency": "USD"
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
- Descriptions should be 1-3 sentences, vivid and helpful
- Cost estimates in USD unless specified
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
      "Factor in proximity to the accommodation when ordering activities. Suggest nearby breakfast/dinner spots when appropriate."
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
