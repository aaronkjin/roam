"use client";

import { useParams } from "next/navigation";
import { InspoBoard } from "@/components/inspo/InspoBoard";

export default function InspoPage() {
  const params = useParams();
  const tripId = params.tripId as string;

  return <InspoBoard tripId={tripId} />;
}
