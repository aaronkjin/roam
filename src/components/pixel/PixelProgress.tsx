"use client";

import { cn } from "@/lib/utils";

interface PixelProgressProps {
  value: number; // 0-100
  className?: string;
  variant?: "jam" | "grass" | "moss" | "sky";
}

const variantColors = {
  jam: "bg-jam",
  grass: "bg-grass",
  moss: "bg-moss",
  sky: "bg-sky",
};

export function PixelProgress({
  value,
  className,
  variant = "jam",
}: PixelProgressProps) {
  const segments = 10;
  const filledSegments = Math.round((value / 100) * segments);

  return (
    <div
      className={cn(
        "flex gap-1 p-2 border-[3px] border-night bg-milk pixel-shadow-sm",
        className
      )}
    >
      {Array.from({ length: segments }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "h-4 flex-1 border border-night transition-colors duration-150",
            i < filledSegments ? variantColors[variant] : "bg-white"
          )}
        />
      ))}
    </div>
  );
}
