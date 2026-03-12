"use client";

import { cn } from "@/lib/utils";

type SortOption = "recent" | "popular" | "top_rated";

interface FeedSortToggleProps {
  value: SortOption;
  onChange: (value: SortOption) => void;
}

const options: { value: SortOption; label: string }[] = [
  { value: "recent", label: "Recent" },
  { value: "popular", label: "Popular" },
  { value: "top_rated", label: "Top Rated" },
];

export function FeedSortToggle({ value, onChange }: FeedSortToggleProps) {
  return (
    <div className="flex border-[3px] border-night">
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "px-3 py-1.5 text-xs font-[family-name:var(--font-silkscreen)] uppercase transition-colors cursor-pointer",
            value === option.value
              ? "bg-night text-white"
              : "bg-white text-night hover:bg-sky/20",
            option.value !== "recent" && "border-l-[3px] border-night"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
