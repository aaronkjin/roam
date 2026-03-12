"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { PixelWindow } from "@/components/pixel/PixelWindow";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  MapPin,
  MapPinned,
  Utensils,
  Bus,
  Hotel,
  StickyNote,
  Heading,
  Star,
} from "lucide-react";
import type { ItineraryDay, ItineraryBlock } from "@/types/itinerary";

interface ItineraryReadOnlyProps {
  days: (ItineraryDay & { blocks: ItineraryBlock[] })[];
  showBlockReviews?: boolean;
}

const typeConfig: Record<string, { icon: React.ElementType; color: string; label: string; fallbackBg: string }> = {
  activity: { icon: MapPinned, color: "bg-jam text-white", label: "Activity", fallbackBg: "bg-jam/10" },
  food: { icon: Utensils, color: "bg-grass text-night", label: "Food", fallbackBg: "bg-grass/10" },
  transport: { icon: Bus, color: "bg-sky text-night", label: "Transport", fallbackBg: "bg-sky/20" },
  accommodation: { icon: Hotel, color: "bg-moss text-white", label: "Stay", fallbackBg: "bg-moss/10" },
  note: { icon: StickyNote, color: "bg-mist text-night", label: "Note", fallbackBg: "bg-mist" },
  heading: { icon: Heading, color: "bg-night text-white", label: "Heading", fallbackBg: "bg-night/5" },
};

function buildMapsUrl(block: ItineraryBlock): string | null {
  if (!block.location) return null;
  if (block.location_lat && block.location_lng) {
    return `https://maps.google.com/?q=${block.location_lat},${block.location_lng}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(block.location)}`;
}

function ReadOnlyBlock({
  block,
  showBlockReviews = false,
}: {
  block: ItineraryBlock;
  showBlockReviews?: boolean;
}) {
  const config = typeConfig[block.type] || typeConfig.activity;
  const Icon = config.icon;
  const hasReview = showBlockReviews && (block.rating != null || !!block.review_note?.trim());

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

  const mapsUrl = buildMapsUrl(block);

  if (block.type === "transport") {
    return (
      <div className="border-[3px] border-night/20 bg-white overflow-hidden">
        {/* Transport header bar */}
        <div className="flex items-center gap-2 px-3 py-2 bg-sky/20 border-b-[2px] border-sky/40">
          <Bus className="w-4 h-4 text-night shrink-0" />
          <Badge className="text-[9px] bg-sky text-night shrink-0">Transport</Badge>
          {block.duration_minutes != null && (
            <span className="text-[10px] font-[family-name:var(--font-silkscreen)] text-rock">
              ~{block.duration_minutes} min
            </span>
          )}
          {block.cost_estimate != null && block.cost_estimate > 0 && (
            <span className="text-[10px] font-[family-name:var(--font-silkscreen)] text-rock border-[2px] border-rock/30 px-1.5 py-0.5">
              {block.currency !== "USD" ? block.currency : "$"}{block.cost_estimate}
            </span>
          )}
        </div>
        <div className="p-3 space-y-1.5">
          <p className="text-sm font-medium text-night">{block.title}</p>
          {block.description && (
            <p className="text-xs text-rock leading-relaxed">{block.description}</p>
          )}
          {mapsUrl && (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[10px] font-[family-name:var(--font-silkscreen)] text-sky border-[2px] border-sky px-1.5 py-0.5 hover:bg-sky hover:text-night transition-colors mt-1"
            >
              <MapPin className="w-3 h-3" /> Maps
            </a>
          )}
        </div>
      </div>
    );
  }

  // All other block types: photo banner card
  return (
    <div className="border-[3px] border-night/20 bg-white overflow-hidden">
      {/* Photo banner */}
      <div className="relative w-full" style={{ aspectRatio: "16/7" }}>
        {block.image_url ? (
          <Image
            src={block.image_url}
            alt={block.title}
            fill
            className="object-cover"
            sizes="(max-width:768px) 100vw, 600px"
            unoptimized
          />
        ) : (
          <div className={cn("w-full h-full", config.fallbackBg)} />
        )}
      </div>

      {/* Card body */}
      <div className="p-3 space-y-2">
        {/* Type badge + time */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className={cn("text-[9px] shrink-0", config.color)}>
            <Icon className="w-3 h-3 mr-1" />
            {config.label}
          </Badge>
          {block.start_time && (
            <span className="text-[10px] font-[family-name:var(--font-silkscreen)] text-rock">
              {block.start_time}{block.end_time ? `–${block.end_time}` : ""}
            </span>
          )}
        </div>

        {/* Title */}
        <p className="text-sm font-medium text-night">{block.title}</p>

        {/* Description preview */}
        {block.description && (
          <p className="text-xs text-rock line-clamp-3 leading-relaxed">{block.description}</p>
        )}

        {/* Maps + cost */}
        <div className="flex items-center gap-2 pt-0.5">
          {mapsUrl && (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[10px] font-[family-name:var(--font-silkscreen)] text-sky border-[2px] border-sky px-1.5 py-0.5 hover:bg-sky hover:text-night transition-colors"
            >
              <MapPin className="w-3 h-3" /> Maps
            </a>
          )}
          {block.cost_estimate != null && block.cost_estimate > 0 && (
            <span className="text-[10px] font-[family-name:var(--font-silkscreen)] text-rock border-[2px] border-rock/30 px-1.5 py-0.5">
              {block.currency !== "USD" ? block.currency : "$"}{block.cost_estimate}
            </span>
          )}
        </div>

        {hasReview && (
          <div className="space-y-1.5 border-t-[2px] border-night/10 pt-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-[family-name:var(--font-silkscreen)] text-night uppercase">
                Traveler Review
              </span>
              {block.rating != null && block.rating > 0 && (
                <span className="inline-flex items-center gap-1 text-[10px] font-[family-name:var(--font-silkscreen)] text-jam border-[2px] border-jam/40 px-1.5 py-0.5">
                  <Star className="w-3 h-3 fill-jam" />
                  {block.rating}/5
                </span>
              )}
            </div>
            {block.review_note?.trim() && (
              <p className="text-xs text-rock leading-relaxed italic">
                {block.review_note.trim()}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function stripDayPrefix(title: string, dayNumber: number): string {
  // Remove leading "Day X — ", "Day X - ", "Day X: " if present
  const pattern = new RegExp(`^Day\\s+${dayNumber}\\s*[—\\-:]\\s*`, "i");
  return title.replace(pattern, "");
}

export function ItineraryReadOnly({
  days,
  showBlockReviews = false,
}: ItineraryReadOnlyProps) {
  return (
    <div className="space-y-6">
      {days.map((day) => {
        const cleanTitle = day.title ? stripDayPrefix(day.title, day.day_number) : null;
        return (
        <PixelWindow
          key={day.id}
          title={`Day ${day.day_number}${cleanTitle ? ` — ${cleanTitle}` : ""}`}
          variant="mist"
        >
          <div className="space-y-3">
            {(cleanTitle || day.summary) && (
              <>
                <div className="space-y-1">
                  {cleanTitle && (
                    <p className="text-sm font-bold text-night">{cleanTitle}</p>
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
                <ReadOnlyBlock
                  key={block.id}
                  block={block}
                  showBlockReviews={showBlockReviews}
                />
              ))}
            </div>
          </div>
        </PixelWindow>
        );
      })}
    </div>
  );
}
