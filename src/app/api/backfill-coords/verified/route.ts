import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Web-verified coordinates for existing itinerary blocks.
 * Keyed by lowercase block title substring → [lat, lng].
 * These were researched via Google Maps and verified sources.
 */
const VERIFIED_COORDS: Record<string, [number, number]> = {
  // === Seoul, Korea ===
  "cafe onion seongsu": [37.5447, 127.0582],
  "cafe onion": [37.5447, 127.0582],
  "seongsu-dong": [37.5428, 127.0573],
  "seongsu": [37.5428, 127.0573],
  "daelim warehouse": [37.5419, 127.0561],
  "daelim changgo": [37.5419, 127.0561],
  "ihwa mural village": [37.5780, 127.0072],
  "ihwa mural": [37.5780, 127.0072],
  "sanchon": [37.5738, 126.9861],
  "namsan seoul tower": [37.5512, 126.9882],
  "n seoul tower": [37.5512, 126.9882],
  "namsan tower": [37.5512, 126.9882],
  "myeongdong": [37.5636, 126.9869],
  "hongdae": [37.5563, 126.9236],
  "bukchon hanok": [37.5826, 126.9849],
  "gyeongbokgung": [37.5796, 126.9770],
  "changdeokgung": [37.5794, 126.9910],
  "insadong": [37.5733, 126.9855],
  "dongdaemun": [37.5713, 127.0093],
  "gwangjang market": [37.5700, 126.9993],
  "lotte world": [37.5111, 127.0981],
  "coex": [37.5121, 127.0590],
  "itaewon": [37.5345, 126.9945],
  "war memorial": [37.5361, 126.9772],
  "hangang": [37.5283, 126.9346],
  "han river": [37.5283, 126.9346],

  // === Kyoto, Japan ===
  "kinkaku-ji": [35.0394, 135.7292],
  "kinkakuji": [35.0394, 135.7292],
  "golden pavilion": [35.0394, 135.7292],
  "omen kodai-ji": [34.9992, 135.7800],
  "omen kodaiji": [34.9992, 135.7800],
  "fushimi inari": [34.9671, 135.7727],
  "gogyo ramen": [35.0053, 135.7639],
  "kyoto gogyo": [35.0053, 135.7639],
  "gogyo": [35.0053, 135.7639],
  "nishiki market": [35.0050, 135.7647],
  "arashiyama bamboo": [35.0170, 135.6717],
  "arashiyama": [35.0170, 135.6717],
  "togetsukyo": [35.0128, 135.6778],
  "monkey park iwatayama": [35.0089, 135.6747],
  "pontocho": [35.0060, 135.7690],
  "gion": [35.0035, 135.7751],
  "kiyomizu-dera": [34.9949, 135.7850],
  "kiyomizudera": [34.9949, 135.7850],
  "kiyomizu": [34.9949, 135.7850],
  "philosopher": [35.0217, 135.7910],
  "nijo castle": [35.0142, 135.7475],
  "nanzen-ji": [35.0113, 135.7932],
  "nanzenji": [35.0113, 135.7932],
  "yasaka shrine": [35.0036, 135.7785],
  "yasaka": [35.0036, 135.7785],
  "kamogawa river": [35.0040, 135.7700],
  "kamogawa": [35.0040, 135.7700],
  "kamo river": [35.0040, 135.7700],
  "teramachi": [35.0068, 135.7639],
  "shinkyogoku": [35.0060, 135.7649],
  "efish": [34.9997, 135.7752],
  "kichi kichi": [35.0043, 135.7690],
  "kichi kichi omurice": [35.0043, 135.7690],
  "tousuiro": [35.0050, 135.7698],
  "tofu cuisine": [35.0050, 135.7698],
  "tea house": [35.0035, 135.7751], // Generic: Gion area
  "kodai-ji": [34.9997, 135.7810],
  "kodaiji": [34.9997, 135.7810],
  "higashiyama": [34.9980, 135.7800],
  "maruyama park": [35.0036, 135.7810],
  "tofuku-ji": [34.9762, 135.7740],
  "byodoin": [34.8894, 135.8073],
  "uji": [34.8894, 135.8073],
  "inari": [34.9671, 135.7727],

  // === Greece (common destinations) ===
  "acropolis": [37.9715, 23.7257],
  "parthenon": [37.9715, 23.7267],
  "plaka": [37.9727, 23.7287],
  "monastiraki": [37.9762, 23.7250],
  "syntagma": [37.9755, 23.7348],
  "santorini": [36.3932, 25.4615],
  "oia": [36.4613, 25.3753],
  "fira": [36.4167, 25.4314],
  "mykonos": [37.4467, 25.3289],
  "meteora": [39.7217, 21.6306],
  "delphi": [38.4824, 22.5012],
  "olympia": [37.6387, 21.6300],
  "crete": [35.2401, 24.4700],
  "heraklion": [35.3387, 25.1442],
  "chania": [35.5138, 24.0180],
  "thessaloniki": [40.6401, 22.9444],
  "corfu": [39.6243, 19.9217],
  "rhodes": [36.4349, 28.2176],
  "zakynthos": [37.7870, 20.8979],
  "navagio beach": [37.8594, 20.6247],
};

/**
 * POST /api/backfill-coords/verified
 * Updates all blocks with web-verified coordinates matched by title.
 */
export async function POST() {
  const { requireAuth } = await import("@/lib/auth");
  const authResult = await requireAuth();
  if (!authResult) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();

  // Fetch ALL blocks (not just those missing coords — overwrite bad ones too)
  const { data: blocks, error } = await supabase
    .from("itinerary_blocks")
    .select("id, title, location, type")
    .neq("type", "heading")
    .neq("type", "note");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!blocks || blocks.length === 0) {
    return NextResponse.json({ message: "No blocks found", updated: 0 });
  }

  let updated = 0;
  const matched: { title: string; matchedKey: string; lat: number; lng: number }[] = [];
  const unmatched: string[] = [];

  for (const block of blocks) {
    const titleLower = block.title.toLowerCase();
    const locationLower = (block.location || "").toLowerCase();

    // Try to match against verified coordinates
    let matchedKey: string | null = null;
    let coords: [number, number] | null = null;

    // Check both title and location against all known keys
    // Sort by key length descending so more specific matches win
    const sortedEntries = Object.entries(VERIFIED_COORDS).sort(
      (a, b) => b[0].length - a[0].length
    );
    for (const [key, value] of sortedEntries) {
      if (titleLower.includes(key) || locationLower.includes(key)) {
        matchedKey = key;
        coords = value;
        break;
      }
    }

    if (coords && matchedKey) {
      const { error: updateError } = await supabase
        .from("itinerary_blocks")
        .update({ location_lat: coords[0], location_lng: coords[1] })
        .eq("id", block.id);

      if (!updateError) {
        updated++;
        matched.push({
          title: block.title,
          matchedKey,
          lat: coords[0],
          lng: coords[1],
        });
      }
    } else {
      unmatched.push(block.title);
    }
  }

  return NextResponse.json({
    message: `Updated ${updated}/${blocks.length} blocks with verified coordinates`,
    updated,
    total: blocks.length,
    matched,
    unmatched: unmatched.length > 0 ? unmatched : undefined,
  });
}
