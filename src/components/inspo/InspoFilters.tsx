"use client";

import { Button } from "@/components/ui/button";
import type { InspoType } from "@/types/inspo";
import { Link, Image, Video, FileText, StickyNote, LayoutGrid } from "lucide-react";

interface InspoFiltersProps {
  activeFilter: InspoType | "all";
  onFilterChange: (filter: InspoType | "all") => void;
}

const filters: { value: InspoType | "all"; label: string; icon: React.ElementType }[] = [
  { value: "all", label: "All", icon: LayoutGrid },
  { value: "image", label: "Images", icon: Image },
  { value: "video", label: "Videos", icon: Video },
];

export function InspoFilters({ activeFilter, onFilterChange }: InspoFiltersProps) {
  return (
    <div className="flex gap-2 flex-wrap">
      {filters.map((f) => {
        const Icon = f.icon;
        return (
          <Button
            key={f.value}
            variant={activeFilter === f.value ? "default" : "outline"}
            size="sm"
            onClick={() => onFilterChange(f.value)}
            className={
              activeFilter === f.value
                ? "text-xs gap-1.5 bg-grass text-white hover:bg-grass/90"
                : "text-xs gap-1.5"
            }
          >
            <Icon className="w-3.5 h-3.5" />
            {f.label}
          </Button>
        );
      })}
    </div>
  );
}
