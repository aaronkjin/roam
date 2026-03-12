"use client";

import { Marker } from "react-map-gl/mapbox";
import { cn } from "@/lib/utils";
import type { ItineraryBlock } from "@/types/itinerary";

const typeColors: Record<string, string> = {
  activity: "bg-jam text-white",
  food: "bg-grass text-night",
  transport: "bg-sky text-night",
  accommodation: "bg-moss text-white",
  note: "bg-mist text-night",
  heading: "bg-night text-white",
};

interface PixelMapMarkerProps {
  block: ItineraryBlock;
  index: number;
  /** Additional indices to show when multiple blocks share this location */
  additionalIndices?: number[];
  isActive: boolean;
  onClick: (blockId: string) => void;
}

export function PixelMapMarker({
  block,
  index,
  additionalIndices,
  isActive,
  onClick,
}: PixelMapMarkerProps) {
  if (!block.location_lat || !block.location_lng) return null;

  const color = typeColors[block.type] || typeColors.activity;
  const allIndices = [index, ...(additionalIndices || [])];
  const label = allIndices.join(", ");

  return (
    <Marker
      latitude={block.location_lat}
      longitude={block.location_lng}
      anchor="center"
      onClick={(e) => {
        e.originalEvent.stopPropagation();
        onClick(block.id);
      }}
    >
      <div
        className={cn(
          "flex items-center justify-center min-w-8 h-8 px-1 border-[3px] border-night pixel-shadow-sm cursor-pointer transition-transform duration-100",
          color,
          isActive && "scale-125 border-jam ring-2 ring-jam/50"
        )}
        title={block.title}
      >
        <span className="font-[family-name:var(--font-silkscreen)] text-[10px] font-bold leading-none">
          {label}
        </span>
      </div>
    </Marker>
  );
}
