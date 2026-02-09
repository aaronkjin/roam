"use client";

import { cn } from "@/lib/utils";
import type { GenerationMode } from "@/types/itinerary";
import { Lock, Sparkles } from "lucide-react";

interface ModeToggleProps {
  mode: GenerationMode;
  onModeChange: (mode: GenerationMode) => void;
  disabled?: boolean;
}

export function ModeToggle({ mode, onModeChange, disabled }: ModeToggleProps) {
  return (
    <div className="flex border-[3px] border-night">
      <button
        type="button"
        onClick={() => onModeChange("strict")}
        disabled={disabled}
        className={cn(
          "flex items-center gap-2 px-4 py-2 font-[family-name:var(--font-silkscreen)] text-xs uppercase transition-colors",
          mode === "strict"
            ? "bg-jam text-white"
            : "bg-white text-rock hover:bg-jam/10"
        )}
      >
        <Lock className="w-3.5 h-3.5" />
        Strict
      </button>
      <div className="w-[3px] bg-night" />
      <button
        type="button"
        onClick={() => onModeChange("creative")}
        disabled={disabled}
        className={cn(
          "flex items-center gap-2 px-4 py-2 font-[family-name:var(--font-silkscreen)] text-xs uppercase transition-colors",
          mode === "creative"
            ? "bg-grass text-night"
            : "bg-white text-rock hover:bg-grass/10"
        )}
      >
        <Sparkles className="w-3.5 h-3.5" />
        Creative
      </button>
    </div>
  );
}
