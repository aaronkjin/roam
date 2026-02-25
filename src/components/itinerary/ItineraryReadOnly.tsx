"use client";

import { cn } from "@/lib/utils";
import { PixelWindow } from "@/components/pixel/PixelWindow";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Clock,
  MapPin,
  MapPinned,
  Utensils,
  Bus,
  Hotel,
  StickyNote,
  Heading,
} from "lucide-react";
import type { ItineraryDay, ItineraryBlock } from "@/types/itinerary";

interface ItineraryReadOnlyProps {
  days: (ItineraryDay & { blocks: ItineraryBlock[] })[];
}

const typeConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  activity: { icon: MapPinned, color: "bg-jam text-white", label: "Activity" },
  food: { icon: Utensils, color: "bg-grass text-night", label: "Food" },
  transport: { icon: Bus, color: "bg-sky text-night", label: "Transport" },
  accommodation: { icon: Hotel, color: "bg-moss text-white", label: "Stay" },
  note: { icon: StickyNote, color: "bg-mist text-night", label: "Note" },
  heading: { icon: Heading, color: "bg-night text-white", label: "Heading" },
};

function ReadOnlyBlock({ block }: { block: ItineraryBlock }) {
  const config = typeConfig[block.type] || typeConfig.activity;
  const Icon = config.icon;

  if (block.type === "heading") {
    return (
      <div className="flex items-center gap-2 p-3 bg-night/5 border-[3px] border-night/20">
        <Heading className="w-4 h-4 text-night" />
        <span className="font-[family-name:var(--font-silkscreen)] text-sm text-night uppercase">
          {block.title}
        </span>
      </div>
    );
  }

  return (
    <div className="border-[3px] border-night/20 bg-white">
      <div className="flex items-center gap-2 p-2">
        <Badge className={cn("text-[9px] shrink-0", config.color)}>
          <Icon className="w-3 h-3 mr-1" />
          {config.label}
        </Badge>
        <span className="flex-1 text-sm text-night min-w-0">{block.title}</span>
        {block.start_time && (
          <span className="flex items-center gap-1 text-[10px] text-rock shrink-0">
            <Clock className="w-3 h-3" />
            {block.start_time}
            {block.end_time && ` – ${block.end_time}`}
          </span>
        )}
      </div>
      {(block.description || block.location) && (
        <div className="px-3 pb-2 space-y-1">
          {block.description && (
            <p className="text-xs text-rock">{block.description}</p>
          )}
          {block.location && (
            <p className="flex items-center gap-1 text-xs text-rock">
              <MapPin className="w-3 h-3 shrink-0" />
              {block.location}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export function ItineraryReadOnly({ days }: ItineraryReadOnlyProps) {
  return (
    <div className="space-y-6">
      {days.map((day) => (
        <PixelWindow
          key={day.id}
          title={`Day ${day.day_number}${day.title ? ` — ${day.title}` : ""}`}
          variant="mist"
        >
          <div className="space-y-3">
            {(day.title || day.summary) && (
              <>
                <div className="space-y-1">
                  {day.title && (
                    <p className="text-sm font-bold text-night">{day.title}</p>
                  )}
                  {day.summary && (
                    <p className="text-xs text-rock">{day.summary}</p>
                  )}
                </div>
                <Separator />
              </>
            )}
            <div className="space-y-2">
              {day.blocks.map((block) => (
                <ReadOnlyBlock key={block.id} block={block} />
              ))}
            </div>
          </div>
        </PixelWindow>
      ))}
    </div>
  );
}
