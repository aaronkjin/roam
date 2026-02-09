"use client";

import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import type { InspoItem } from "@/types/inspo";

interface InspoSummaryProps {
  items: InspoItem[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
}

export function InspoSummary({ items, selectedIds, onToggle }: InspoSummaryProps) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-[family-name:var(--font-silkscreen)] uppercase text-night">
        Inspo Items ({selectedIds.size} selected)
      </p>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => {
          const selected = selectedIds.has(item.id);
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onToggle(item.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 border-[2px] text-xs transition-colors ${
                selected
                  ? "border-night bg-mist text-night"
                  : "border-night/20 bg-white text-rock line-through"
              }`}
            >
              {item.title || item.url || "Untitled"}
              {selected && <X className="w-3 h-3" />}
            </button>
          );
        })}
      </div>
      {selectedIds.size === 0 && (
        <p className="text-xs text-destructive font-[family-name:var(--font-silkscreen)]">
          Select at least one inspo item
        </p>
      )}
    </div>
  );
}
