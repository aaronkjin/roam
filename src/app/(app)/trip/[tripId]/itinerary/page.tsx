"use client";

import { useParams } from "next/navigation";
import { ItineraryEditor } from "@/components/itinerary/ItineraryEditor";

export default function ItineraryPage() {
  const params = useParams();
  const tripId = params.tripId as string;

  return <ItineraryEditor tripId={tripId} />;
}
