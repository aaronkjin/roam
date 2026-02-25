import { ItineraryReadOnly } from "@/components/itinerary/ItineraryReadOnly";
import { PixelWindow } from "@/components/pixel/PixelWindow";
import { MapPin, Calendar } from "lucide-react";

interface SharedPageProps {
  params: Promise<{ token: string }>;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default async function SharedItineraryPage({ params }: SharedPageProps) {
  const { token } = await params;

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/shared/${token}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    return (
      <div className="min-h-screen bg-[#faf9f6] flex items-center justify-center p-6">
        <PixelWindow title="Not Found" variant="jam">
          <div className="text-center py-8 space-y-3">
            <p className="font-[family-name:var(--font-press-start)] text-sm text-night">
              Itinerary not found
            </p>
            <p className="text-sm text-rock">
              This shared link may be invalid or expired.
            </p>
          </div>
        </PixelWindow>
      </div>
    );
  }

  const { trip, days } = await res.json();

  return (
    <div className="min-h-screen bg-[#faf9f6]">
      <div className="max-w-3xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <p className="font-[family-name:var(--font-silkscreen)] text-xs text-rock uppercase tracking-wider">
            Shared Itinerary
          </p>
          <h1 className="font-[family-name:var(--font-press-start)] text-lg text-night leading-relaxed">
            {trip.title}
          </h1>
          <div className="flex flex-wrap gap-4 text-sm text-rock">
            {trip.destination && (
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {trip.destination}
              </span>
            )}
            {trip.start_date && (
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {formatDate(trip.start_date)}
                {trip.end_date && ` – ${formatDate(trip.end_date)}`}
              </span>
            )}
          </div>
          {trip.description && (
            <p className="text-sm text-rock">{trip.description}</p>
          )}
        </div>

        {/* Itinerary */}
        <ItineraryReadOnly days={days} />

        {/* Footer */}
        <p className="text-center text-[10px] text-rock font-[family-name:var(--font-silkscreen)] py-4">
          Made with Roam
        </p>
      </div>
    </div>
  );
}
