"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Share2, FileText, Image, Check, Loader2 } from "lucide-react";
import type { ItineraryDay, ItineraryBlock } from "@/types/itinerary";

interface ShareMenuProps {
  tripTitle: string;
  tripDestination?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  days: (ItineraryDay & { blocks: ItineraryBlock[] })[];
  itineraryRef?: React.RefObject<HTMLDivElement | null>;
}

const typeEmoji: Record<string, string> = {
  activity: "📍",
  food: "🍽",
  transport: "✈️",
  accommodation: "🏨",
  note: "📝",
  heading: "📌",
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatItineraryAsText(
  title: string,
  destination: string | null | undefined,
  startDate: string | null | undefined,
  endDate: string | null | undefined,
  days: (ItineraryDay & { blocks: ItineraryBlock[] })[]
): string {
  const lines: string[] = [];

  lines.push(`🗺 ${title}`);
  if (destination) lines.push(`📍 ${destination}`);
  if (startDate && endDate) {
    lines.push(`📅 ${formatDate(startDate)} – ${formatDate(endDate)}`);
  } else if (startDate) {
    lines.push(`📅 ${formatDate(startDate)}`);
  }
  lines.push("");

  for (const day of days) {
    lines.push(
      `Day ${day.day_number}${day.title ? ` — ${day.title}` : ""}`
    );
    if (day.summary) lines.push(`  ${day.summary}`);

    for (const block of day.blocks) {
      if (block.type === "heading") {
        lines.push(`\n  --- ${block.title.toUpperCase()} ---`);
        continue;
      }

      const emoji = typeEmoji[block.type] || "•";
      const time = block.start_time || "     ";
      let line = `  ${time}  ${emoji}  ${block.title}`;
      if (block.location) line += ` — ${block.location}`;
      lines.push(line);
    }
    lines.push("");
  }

  return lines.join("\n").trim();
}

export function ShareMenu({
  tripTitle,
  tripDestination,
  startDate,
  endDate,
  days,
  itineraryRef,
}: ShareMenuProps) {
  const [textCopied, setTextCopied] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);

  const handleCopyText = useCallback(async () => {
    setLoading("text");
    try {
      const text = formatItineraryAsText(
        tripTitle,
        tripDestination,
        startDate,
        endDate,
        days
      );
      await navigator.clipboard.writeText(text);
      setTextCopied(true);
      setTimeout(() => setTextCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text:", err);
    } finally {
      setLoading(null);
    }
  }, [tripTitle, tripDestination, startDate, endDate, days]);

  const handleDownloadImage = useCallback(async () => {
    if (!itineraryRef?.current) return;
    setLoading("image");
    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(itineraryRef.current, {
        backgroundColor: "#ffffff",
        pixelRatio: 2,
      });
      const link = document.createElement("a");
      link.download = `${tripTitle.replace(/[^a-zA-Z0-9]/g, "_")}_itinerary.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Failed to download image:", err);
    } finally {
      setLoading(null);
    }
  }, [itineraryRef, tripTitle]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Share2 className="w-3.5 h-3.5" />
          Share
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={handleCopyText} disabled={loading === "text"}>
          {loading === "text" ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : textCopied ? (
            <Check className="w-4 h-4 mr-2 text-moss" />
          ) : (
            <FileText className="w-4 h-4 mr-2" />
          )}
          {textCopied ? "Text Copied!" : "Copy as Text"}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleDownloadImage} disabled={loading === "image"}>
          {loading === "image" ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Image className="w-4 h-4 mr-2" />
          )}
          Download as Image
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
