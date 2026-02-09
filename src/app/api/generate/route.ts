import { NextRequest } from "next/server";
import { openai } from "@/lib/openai";
import { SYSTEM_PROMPT, buildStrictPrompt, buildCreativePrompt } from "@/lib/prompts";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { trip_id, mode = "creative", num_days = 3, selected_inspo_ids } = body;

  if (!trip_id) {
    return new Response(JSON.stringify({ error: "trip_id is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabase = await createClient();

  // Fetch trip info
  const { data: trip } = await supabase
    .from("trips")
    .select("*")
    .eq("id", trip_id)
    .single();

  if (!trip) {
    return new Response(JSON.stringify({ error: "Trip not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Fetch inspo items
  let inspoQuery = supabase
    .from("inspo_items")
    .select("*")
    .eq("trip_id", trip_id);

  if (selected_inspo_ids && selected_inspo_ids.length > 0) {
    inspoQuery = inspoQuery.in("id", selected_inspo_ids);
  }

  const { data: inspoItems } = await inspoQuery;

  if (!inspoItems || inspoItems.length === 0) {
    return new Response(
      JSON.stringify({ error: "No inspo items found for this trip" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Build prompt
  const userPrompt =
    mode === "strict"
      ? buildStrictPrompt(inspoItems, trip.destination, num_days)
      : buildCreativePrompt(inspoItems, trip.destination, num_days);

  // Log the generation
  await supabase.from("generation_logs").insert({
    trip_id,
    mode,
    prompt_snapshot: userPrompt,
    inspo_snapshot: inspoItems,
  });

  // Stream response
  const stream = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    stream: true,
    temperature: mode === "creative" ? 0.9 : 0.3,
    max_tokens: 4000,
  });

  const encoder = new TextEncoder();

  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content || "";
        if (text) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
        }
      }
      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
