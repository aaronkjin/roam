"use client";

import { PixelProgress } from "@/components/pixel/PixelProgress";
import { PixelWindow } from "@/components/pixel/PixelWindow";
import { SmiskiBuilder } from "@/components/pixel/SmiskiBuilder";

interface GenerateLoadingProps {
  streamedText: string;
  totalDays?: number;
}

const loadingMessages = [
  "Consulting the travel spirits...",
  "Drawing the map...",
  "Packing your bags...",
  "Finding hidden gems...",
  "Booking imaginary flights...",
];

export function GenerateLoading({ streamedText, totalDays }: GenerateLoadingProps) {
  // Count completed days in streamed text as a progress proxy
  const daysStreamed = (streamedText.match(/"day_number"/g) || []).length;
  const dayBasedProgress = totalDays && daysStreamed > 0
    ? Math.min((daysStreamed / totalDays) * 100, 95)
    : 0;
  // Fall back to text-length heuristic if no days detected yet
  const textProgress = Math.min((streamedText.length / 3000) * 100, 95);
  const progress = dayBasedProgress > 0 ? dayBasedProgress : textProgress;
  const msgIndex = Math.floor(progress / 20) % loadingMessages.length;

  return (
    <PixelWindow title="Generating..." variant="moss">
      <div className="space-y-4 py-4">
        <SmiskiBuilder />

        <div className="text-center">
          <p className="font-[family-name:var(--font-silkscreen)] text-sm text-night">
            {loadingMessages[msgIndex]}
          </p>
          <p className="text-xs text-rock mt-1">
            AI is crafting your itinerary
          </p>
        </div>

        <PixelProgress value={progress} variant="grass" />
      </div>
    </PixelWindow>
  );
}
