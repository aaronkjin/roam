import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createClient();

  // Execute the schema SQL using Supabase's rpc or raw query
  // Note: supabase-js doesn't support raw SQL directly with anon key.
  // We'll test if the trips table exists instead.
  const { error } = await supabase.from("trips").select("id").limit(1);

  if (error && error.code === "42P01") {
    // Table doesn't exist - user needs to run migrations
    return NextResponse.json({
      error: "Tables do not exist. Please run the SQL migrations in the Supabase dashboard.",
      instructions: [
        "1. Go to your Supabase project dashboard",
        "2. Click 'SQL Editor' in the left sidebar",
        "3. Paste the contents of supabase/migrations/001_initial_schema.sql and run it",
        "4. Paste the contents of supabase/migrations/002_itinerary_schema.sql and run it",
        "5. Refresh this page",
      ],
      sql_url: `${process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('.supabase.co', '')}/project/sql`,
    }, { status: 503 });
  }

  if (error) {
    return NextResponse.json({ error: error.message, code: error.code }, { status: 500 });
  }

  return NextResponse.json({ status: "ok", message: "Database tables exist and are accessible." });
}
