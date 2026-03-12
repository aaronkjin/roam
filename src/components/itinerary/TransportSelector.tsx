"use client";

import { cn } from "@/lib/utils";
import { Footprints, Train, Car } from "lucide-react";
import type { TransportOption } from "@/types/itinerary";

interface TransportSelectorProps {
  options: TransportOption[];
  selectedMode: string | null;
  onSelect: (mode: string) => void;
  canEdit?: boolean;
}

const modeConfig: Record<string, { icon: React.ElementType; label: string }> = {
  walking: { icon: Footprints, label: "Walk" },
  transit: { icon: Train, label: "Transit" },
  driving: { icon: Car, label: "Taxi" },
  cycling: { icon: Footprints, label: "Bike" },
};

export function TransportSelector({
  options,
  selectedMode,
  onSelect,
  canEdit = true,
}: TransportSelectorProps) {
  if (!options || options.length === 0) return null;

  return (
    <div className="flex items-center gap-1.5 px-3 py-2 bg-sky/10 border-y-[2px] border-sky/30">
      {options.map((option) => {
        const config = modeConfig[option.mode] || modeConfig.walking;
        const Icon = config.icon;
        const isSelected = selectedMode === option.mode;
        const costStr = option.cost_estimate > 0
          ? ` · $${option.cost_estimate}`
          : "";

        return (
          <button
            key={option.mode}
            onClick={() => canEdit && onSelect(option.mode)}
            disabled={!canEdit}
            className={cn(
              "flex items-center gap-1 text-[10px] font-[family-name:var(--font-silkscreen)] px-2 py-1 border-[2px] transition-colors",
              isSelected
                ? "border-jam bg-jam/10 text-night"
                : "border-night/20 bg-white text-rock hover:border-night/40",
              !canEdit && "cursor-default"
            )}
          >
            <Icon className="w-3 h-3 shrink-0" />
            <span>
              {config.label} {option.duration_minutes}m{costStr}
            </span>
          </button>
        );
      })}
    </div>
  );
}
