"use client";

import { useParams } from "next/navigation";
import { GeneratePanel } from "@/components/generate/GeneratePanel";

export default function GeneratePage() {
  const params = useParams();
  const tripId = params.tripId as string;

  return <GeneratePanel tripId={tripId} />;
}
