"use client";

import { Popup } from "react-map-gl/mapbox";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ItineraryBlock } from "@/types/itinerary";

const typeConfig: Record<string, { color: string; label: string }> = {
  activity: { color: "bg-jam text-white", label: "Activity" },
  food: { color: "bg-grass text-night", label: "Food" },
  transport: { color: "bg-sky text-night", label: "Transport" },
  accommodation: { color: "bg-moss text-white", label: "Stay" },
  note: { color: "bg-mist text-night", label: "Note" },
  heading: { color: "bg-night text-white", label: "Heading" },
};

interface MapPopupProps {
  block: ItineraryBlock;
  onClose: () => void;
}

export function MapPopup({ block, onClose }: MapPopupProps) {
  if (!block.location_lat || !block.location_lng) return null;

  const config = typeConfig[block.type] || typeConfig.activity;

  return (
    <Popup
      latitude={block.location_lat}
      longitude={block.location_lng}
      anchor="bottom"
      onClose={onClose}
      closeOnClick={false}
      offset={20}
      className="pixel-popup"
    >
      <div className="p-2 min-w-[160px] max-w-[220px] space-y-1.5">
        <div className="flex items-center gap-1.5">
          <Badge className={cn("text-[9px] shrink-0", config.color)}>
            {config.label}
          </Badge>
        </div>
        <p className="font-[family-name:var(--font-silkscreen)] text-xs text-night leading-tight">
          {block.title}
        </p>
        {block.start_time && (
          <div className="flex items-center gap-1 text-[10px] text-rock">
            <Clock className="w-3 h-3" />
            {block.start_time}
            {block.end_time && ` – ${block.end_time}`}
          </div>
        )}
        {block.location && (
          <div className="flex items-center gap-1 text-[10px] text-rock">
            <MapPin className="w-3 h-3 shrink-0" />
            <span className="truncate">{block.location}</span>
          </div>
        )}
        {block.cost_estimate != null && block.cost_estimate > 0 && (() => {
          const signs = block.cost_estimate! <= 15 ? "$" : block.cost_estimate! <= 40 ? "$$" : block.cost_estimate! <= 100 ? "$$$" : "$$$$";
          return (
            <span className="inline-flex items-center text-[10px] font-[family-name:var(--font-silkscreen)] text-white bg-grass border-[2px] border-night px-1.5 py-0.5">
              {signs}
            </span>
          );
        })()}
      </div>
    </Popup>
  );
}
