"use client";

import { useParams } from "next/navigation";
import { TripReviewPage } from "@/components/itinerary/TripReviewPage";

export default function ReviewPage() {
  const params = useParams();
  const tripId = params.tripId as string;

  return <TripReviewPage tripId={tripId} />;
}
