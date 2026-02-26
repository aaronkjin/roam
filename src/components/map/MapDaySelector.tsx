"use client";

import { cn } from "@/lib/utils";

interface MapDaySelectorProps {
  dayCount: number;
  activeDayIndex: number;
  onDaySelect: (index: number) => void;
}

export function MapDaySelector({
  dayCount,
  activeDayIndex,
  onDaySelect,
}: MapDaySelectorProps) {
  if (dayCount <= 1) return null;

  return (
    <div className="absolute top-3 left-3 z-10 flex gap-1.5">
      {Array.from({ length: dayCount }, (_, i) => (
        <button
          key={i}
          onClick={() => onDaySelect(i)}
          className={cn(
            "w-9 h-9 border-[3px] border-night pixel-shadow-sm font-[family-name:var(--font-silkscreen)] text-[10px] font-bold transition-all duration-100",
            i === activeDayIndex
              ? "bg-jam text-white"
              : "bg-milk text-night hover:bg-sky/50"
          )}
        >
          D{i + 1}
        </button>
      ))}
    </div>
  );
}
