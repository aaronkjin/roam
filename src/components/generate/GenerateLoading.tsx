"use client";

import { PixelProgress } from "@/components/pixel/PixelProgress";
import { PixelWindow } from "@/components/pixel/PixelWindow";
import { SmiskiBuilder } from "@/components/pixel/SmiskiBuilder";

interface GenerateLoadingProps {
  streamedText: string;
}

const loadingMessages = [
  "Consulting the travel spirits...",
  "Drawing the map...",
  "Packing your bags...",
  "Finding hidden gems...",
  "Booking imaginary flights...",
];

export function GenerateLoading({ streamedText }: GenerateLoadingProps) {
  // Estimate progress based on text length (rough)
  const progress = Math.min((streamedText.length / 3000) * 100, 95);
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
