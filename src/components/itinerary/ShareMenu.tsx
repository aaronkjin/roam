"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Share2, FileText, ImageIcon, Check, Loader2, Users, Link as LinkIcon } from "lucide-react";
import { PublishButton } from "@/components/feed/PublishButton";
import { InviteDialog } from "./InviteDialog";
import type { ItineraryDay, ItineraryBlock } from "@/types/itinerary";
import type { CollaboratorRole } from "@/types/trip";
import { formatTripDateRange } from "@/lib/trip-dates";

interface ShareMenuProps {
  tripId: string;
  tripTitle: string;
  tripDestination?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  dateRangeLabel?: string | null;
  days: (ItineraryDay & { blocks: ItineraryBlock[] })[];
  itineraryRef?: React.RefObject<HTMLDivElement | null>;
  userRole?: CollaboratorRole;
}

const typeEmoji: Record<string, string> = {
  activity: "📍",
  food: "🍽",
  transport: "✈️",
  accommodation: "🏨",
  note: "📝",
  heading: "📌",
};

function formatItineraryAsText(
  title: string,
  destination: string | null | undefined,
  startDate: string | null | undefined,
  endDate: string | null | undefined,
  dateRangeLabel: string | null | undefined,
  days: (ItineraryDay & { blocks: ItineraryBlock[] })[]
): string {
  const lines: string[] = [];
  const tripTiming = formatTripDateRange({ startDate, endDate, dateRangeLabel });

  lines.push(`🗺 ${title}`);
  if (destination) lines.push(`📍 ${destination}`);
  if (tripTiming) {
    lines.push(`📅 ${tripTiming}`);
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
  tripId,
  tripTitle,
  tripDestination,
  startDate,
  endDate,
  dateRangeLabel,
  days,
  itineraryRef,
  userRole = "owner",
}: ShareMenuProps) {
  const [textCopied, setTextCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);

  const isOwner = userRole === "owner";

  const handleCopyText = useCallback(async () => {
    setLoading("text");
    try {
      const text = formatItineraryAsText(
        tripTitle,
        tripDestination,
        startDate,
        endDate,
        dateRangeLabel,
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
  }, [tripTitle, tripDestination, startDate, endDate, dateRangeLabel, days]);

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

  const handleCopyPublicLink = useCallback(async () => {
    setLoading("link");
    try {
      const res = await fetch(`/api/trips/${tripId}/share`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to generate share link");
      const data = await res.json();
      await navigator.clipboard.writeText(data.share_url);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy public link:", err);
    } finally {
      setLoading(null);
    }
  }, [tripId]);

  return (
    <>
      {isOwner && (
        <PublishButton
          tripId={tripId}
          tripTitle={tripTitle}
          destination={tripDestination || null}
          days={days}
        />
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Share2 className="w-3.5 h-3.5" />
            Share
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          {isOwner && (
            <>
              <DropdownMenuItem onClick={() => setInviteOpen(true)}>
                <Users className="w-4 h-4 mr-2" />
                Invite Collaborator
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleCopyPublicLink} disabled={loading === "link"}>
                {loading === "link" ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : linkCopied ? (
                  <Check className="w-4 h-4 mr-2 text-moss" />
                ) : (
                  <LinkIcon className="w-4 h-4 mr-2" />
                )}
                {linkCopied ? "Link Copied!" : "Copy Public Link"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
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
                  <ImageIcon className="w-4 h-4 mr-2" />
                )}
                Download as Image
              </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {isOwner && (
        <InviteDialog
          tripId={tripId}
          open={inviteOpen}
          onOpenChange={setInviteOpen}
        />
      )}
    </>
  );
}
