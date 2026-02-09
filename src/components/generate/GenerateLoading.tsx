"use client";

import { PixelProgress } from "@/components/pixel/PixelProgress";
import { PixelSpinner } from "@/components/pixel/PixelSpinner";
import { PixelWindow } from "@/components/pixel/PixelWindow";

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
    <PixelWindow title="Generating..." variant="jam">
      <div className="space-y-4 py-4">
        <div className="flex items-center gap-3">
          <PixelSpinner size="lg" />
          <div>
            <p className="font-[family-name:var(--font-silkscreen)] text-sm text-night">
              {loadingMessages[msgIndex]}
            </p>
            <p className="text-xs text-rock mt-1">
              AI is crafting your itinerary
            </p>
          </div>
        </div>

        <PixelProgress value={progress} variant="grass" />

        {streamedText && (
          <div className="max-h-48 overflow-y-auto p-3 bg-night/5 border-[2px] border-night/20">
            <pre className="text-[10px] text-rock font-mono whitespace-pre-wrap break-all">
              {streamedText.slice(-500)}
            </pre>
          </div>
        )}
      </div>
    </PixelWindow>
  );
}
