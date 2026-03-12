import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isMissingDateRangeLabelColumn } from "@/lib/supabase/date-range-compat";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const supabase = await createClient();

  // Find trip by share token
  let { data: trip, error: tripError } = await supabase
    .from("trips")
    .select("id, title, description, destination, start_date, end_date, date_range_label")
    .eq("share_token", token)
    .single();

  if (isMissingDateRangeLabelColumn(tripError)) {
    const retry = await supabase
      .from("trips")
      .select("id, title, description, destination, start_date, end_date")
      .eq("share_token", token)
      .single();
    trip = retry.data ? { ...retry.data, date_range_label: null } : retry.data;
    tripError = retry.error;
  }

  if (tripError || !trip) {
    return NextResponse.json({ error: "Shared itinerary not found" }, { status: 404 });
  }

  // Fetch days and blocks
  const { data: days, error: daysError } = await supabase
    .from("itinerary_days")
    .select("*, itinerary_blocks(*)")
    .eq("trip_id", trip.id)
    .order("day_number", { ascending: true });

  if (daysError) {
    return NextResponse.json({ error: daysError.message }, { status: 500 });
  }

  // Sort blocks within each day by position_index
  const sortedDays = (days || []).map((day) => ({
    ...day,
    blocks: (day.itinerary_blocks || []).sort(
      (a: { position_index: number }, b: { position_index: number }) =>
        a.position_index - b.position_index
    ),
    itinerary_blocks: undefined,
  }));

  return NextResponse.json({ trip, days: sortedDays });
}
