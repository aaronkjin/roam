"use client";

import { useParams } from "next/navigation";
import { TripNav } from "@/components/layout/TripNav";

export default function TripLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const tripId = params.tripId as string;

  return (
    <div className="flex flex-col h-full">
      <TripNav tripId={tripId} />
      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}
