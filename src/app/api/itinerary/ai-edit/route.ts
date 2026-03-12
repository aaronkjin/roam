import { NextRequest, NextResponse } from "next/server";
import { openai } from "@/lib/openai";
import { createClient } from "@/lib/supabase/server";
import { requireAuth, requireTripAccess } from "@/lib/auth";
import { buildEditPrompt } from "@/lib/prompts";

export async function POST(req: NextRequest) {
  const authResult = await requireAuth();
  if (!authResult) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { trip_id, block_ids, instruction, context_blocks } = body;

  if (!trip_id || !block_ids?.length || !instruction) {
    return NextResponse.json(
      { error: "trip_id, block_ids, and instruction are required" },
      { status: 400 }
    );
  }

  const access = await requireTripAccess(authResult.userId, trip_id, "editor");
  if (!access) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = await createClient();

  // Fetch selected blocks
  const { data: selectedBlocks, error: fetchError } = await supabase
    .from("itinerary_blocks")
    .select("*")
    .in("id", block_ids);

  if (fetchError || !selectedBlocks?.length) {
    return NextResponse.json({ error: "Blocks not found" }, { status: 404 });
  }

  const prompt = buildEditPrompt(
    selectedBlocks,
    context_blocks || [],
    instruction
  );

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-5.2",
      messages: [
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_completion_tokens: 2000,
    });

    const content = completion.choices[0]?.message?.content || "[]";
    // Strip markdown code fences if present
    const jsonStr = content.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
    const suggestions = JSON.parse(jsonStr);

    return NextResponse.json({ suggestions });
  } catch (err) {
    console.error("[ai-edit] error:", err);
    return NextResponse.json(
      { error: "AI edit failed" },
      { status: 500 }
    );
  }
}
