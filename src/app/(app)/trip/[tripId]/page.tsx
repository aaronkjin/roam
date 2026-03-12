import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAuth, requireTripAccess } from "@/lib/auth";

export default async function TripPage({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = await params;
  const authResult = await requireAuth();
  if (!authResult) {
    redirect("/sign-in");
  }

  const access = await requireTripAccess(authResult.userId, tripId, "viewer");
  if (!access) {
    redirect("/dashboard");
  }

  const supabase = await createClient();
  const { data: trip } = await supabase
    .from("trips")
    .select("status")
    .eq("id", tripId)
    .single();

  const destination =
    trip?.status === "completed"
      ? "review"
      : trip?.status === "generated" || trip?.status === "finalized"
        ? "itinerary"
        : "inspo";

  redirect(`/trip/${tripId}/${destination}`);
}
