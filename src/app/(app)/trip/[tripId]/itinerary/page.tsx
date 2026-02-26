"use client";

import { useParams } from "next/navigation";
import { ItineraryMapLayout } from "@/components/itinerary/ItineraryMapLayout";

export default function ItineraryPage() {
  const params = useParams();
  const tripId = params.tripId as string;

  return <ItineraryMapLayout tripId={tripId} />;
}
