"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PixelWindow } from "@/components/pixel/PixelWindow";
import { Check, RotateCcw, Clock, MapPin, DollarSign } from "lucide-react";
import type { GeneratedItinerary } from "@/types/itinerary";

interface GeneratePreviewProps {
  itinerary: GeneratedItinerary;
  onAccept: () => void;
  onRegenerate: () => void;
  accepting?: boolean;
}

const blockTypeColors: Record<string, string> = {
  activity: "bg-jam text-white",
  food: "bg-grass text-night",
  transport: "bg-sky text-night",
  accommodation: "bg-moss text-white",
  note: "bg-mist text-night",
  heading: "bg-night text-white",
};

export function GeneratePreview({
  itinerary,
  onAccept,
  onRegenerate,
  accepting,
}: GeneratePreviewProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm">Preview Your Itinerary</h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onRegenerate}>
            <RotateCcw className="w-3.5 h-3.5 mr-1" />
            Regenerate
          </Button>
          <Button size="sm" onClick={onAccept} disabled={accepting}>
            <Check className="w-3.5 h-3.5 mr-1" />
            {accepting ? "Saving..." : "Accept & Edit"}
          </Button>
        </div>
      </div>

      {itinerary.days.map((day) => (
        <PixelWindow key={day.day_number} title={`Day ${day.day_number}`} variant="mist">
          <div className="space-y-3">
            <div>
              <h4 className="text-sm font-bold text-night">{day.title}</h4>
              <p className="text-xs text-rock">{day.summary}</p>
            </div>

            <div className="space-y-2">
              {day.blocks.map((block, i) => (
                <div
                  key={i}
                  className="flex gap-3 p-2 border-[2px] border-night/10 bg-white"
                >
                  <Badge
                    className={`text-[9px] h-fit ${blockTypeColors[block.type] || "bg-rock text-white"}`}
                  >
                    {block.type}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-night">{block.title}</p>
                    {block.description && (
                      <p className="text-[10px] text-rock mt-0.5 line-clamp-2">
                        {block.description}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-3 mt-1">
                      {block.start_time && (
                        <span className="flex items-center gap-1 text-[10px] text-rock">
                          <Clock className="w-3 h-3" />
                          {block.start_time}
                          {block.end_time && ` - ${block.end_time}`}
                        </span>
                      )}
                      {block.location && (
                        <span className="flex items-center gap-1 text-[10px] text-rock">
                          <MapPin className="w-3 h-3" />
                          {block.location}
                        </span>
                      )}
                      {block.cost_estimate !== undefined && block.cost_estimate > 0 && (
                        <span className="flex items-center gap-1 text-[10px] text-rock">
                          <DollarSign className="w-3 h-3" />
                          {block.cost_estimate} {block.currency || "USD"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </PixelWindow>
      ))}
    </div>
  );
}
