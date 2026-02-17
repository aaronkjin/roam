"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Sparkles, Lightbulb, PenTool } from "lucide-react";

interface TripNavProps {
  tripId: string;
}

const tabs = [
  { label: "Inspo", href: "inspo", icon: Lightbulb },
  { label: "Generate", href: "generate", icon: Sparkles },
  { label: "Itinerary", href: "itinerary", icon: PenTool },
];

export function TripNav({ tripId }: TripNavProps) {
  const pathname = usePathname();

  return (
    <nav className="flex border-b-[3px] border-night bg-milk">
      {tabs.map((tab, i) => {
        const href = `/trip/${tripId}/${tab.href}`;
        const isActive = pathname.startsWith(href);
        const Icon = tab.icon;

        return (
          <Link
            key={tab.href}
            href={href}
            className={cn(
              "flex items-center gap-2 px-6 py-3 font-[family-name:var(--font-silkscreen)] text-sm uppercase tracking-wider transition-colors border-b-[3px] -mb-[3px]",
              i > 0 && "border-l-[3px] border-l-night",
              i === tabs.length - 1 && "border-r-[3px] border-r-night",
              isActive
                ? "bg-sky text-white border-b-night"
                : "text-rock hover:text-night hover:bg-sky/20 border-b-transparent"
            )}
          >
            <Icon className="w-4 h-4" />
            {tab.label}
            {/* Step number */}
            <span
              className={cn(
                "w-5 h-5 flex items-center justify-center text-[10px] border-[2px] ml-1",
                isActive
                  ? "border-white bg-white/20 text-white"
                  : "border-night/30 text-rock"
              )}
            >
              {i + 1}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
