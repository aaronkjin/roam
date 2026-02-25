"use client";

import { useState, useCallback, useEffect } from "react";
import { useTrips } from "@/context/TripsContext";
import { useItinerary } from "@/hooks/useItinerary";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { PixelWindow } from "@/components/pixel/PixelWindow";
import { StarRating } from "@/components/ui/star-rating";
import { BlockMediaUpload } from "@/components/itinerary/BlockMediaUpload";
import type { BlockMedia } from "@/types/itinerary";
import {
  MapPinned,
  Utensils,
  Bus,
  Hotel,
  StickyNote,
  Heading,
  Loader2,
  CheckCircle,
  ClipboardCheck,
} from "lucide-react";

interface TripReviewPageProps {
  tripId: string;
}

const typeConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  activity: { icon: MapPinned, color: "bg-jam text-white", label: "Activity" },
  food: { icon: Utensils, color: "bg-grass text-night", label: "Food" },
  transport: { icon: Bus, color: "bg-sky text-night", label: "Transport" },
  accommodation: { icon: Hotel, color: "bg-moss text-white", label: "Stay" },
  note: { icon: StickyNote, color: "bg-mist text-night", label: "Note" },
  heading: { icon: Heading, color: "bg-night text-white", label: "Heading" },
};

export function TripReviewPage({ tripId }: TripReviewPageProps) {
  const { trips, updateTrip } = useTrips();
  const { days, loading, updateBlock } = useItinerary(tripId);
  const trip = trips.find((t) => t.id === tripId);

  const [overallRating, setOverallRating] = useState(0);
  const [reviewNote, setReviewNote] = useState("");
  const [blockReviews, setBlockReviews] = useState<
    Record<string, { rating: number; review_note: string }>
  >({});
  const [initialized, setInitialized] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [blockMedia, setBlockMedia] = useState<Record<string, BlockMedia[]>>({});

  // Fetch all media for this trip's blocks
  useEffect(() => {
    if (!tripId || loading || days.length === 0) return;
    async function fetchMedia() {
      try {
        const res = await fetch(`/api/itinerary/media?trip_id=${tripId}`);
        if (res.ok) {
          const grouped = await res.json();
          setBlockMedia(grouped);
        }
      } catch {
        // Silently fail — media is non-critical
      }
    }
    fetchMedia();
  }, [tripId, loading, days.length]);

  const handleMediaUpload = useCallback(async (blockId: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`/api/itinerary/blocks/${blockId}/media`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json();
      console.error("Upload failed:", err.error);
      return;
    }

    const newMedia: BlockMedia = await res.json();
    setBlockMedia((prev) => ({
      ...prev,
      [blockId]: [...(prev[blockId] || []), newMedia],
    }));
  }, []);

  const handleMediaDelete = useCallback(async (blockId: string, mediaId: string) => {
    const res = await fetch(`/api/itinerary/blocks/${blockId}/media/${mediaId}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      console.error("Delete failed");
      return;
    }

    setBlockMedia((prev) => ({
      ...prev,
      [blockId]: (prev[blockId] || []).filter((m) => m.id !== mediaId),
    }));
  }, []);

  // Initialize state from loaded data once
  if (!initialized && !loading && days.length > 0) {
    setOverallRating(trip?.overall_rating || 0);
    setReviewNote(trip?.review_note || "");
    const initial: Record<string, { rating: number; review_note: string }> = {};
    for (const day of days) {
      for (const block of day.blocks) {
        if (block.type === "heading") continue;
        initial[block.id] = {
          rating: block.rating || 0,
          review_note: block.review_note || "",
        };
      }
    }
    setBlockReviews(initial);
    setInitialized(true);
  }

  const updateBlockRating = useCallback((blockId: string, rating: number) => {
    setBlockReviews((prev) => ({
      ...prev,
      [blockId]: { ...prev[blockId], rating },
    }));
  }, []);

  const updateBlockReviewNote = useCallback((blockId: string, review_note: string) => {
    setBlockReviews((prev) => ({
      ...prev,
      [blockId]: { ...prev[blockId], review_note },
    }));
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setSaved(false);
    try {
      // Save overall trip review + mark as completed
      await updateTrip(tripId, {
        overall_rating: overallRating || undefined,
        review_note: reviewNote || undefined,
        status: "completed",
      });

      // Save per-block reviews
      const blockUpdates = Object.entries(blockReviews)
        .filter(([, review]) => review.rating > 0 || review.review_note)
        .map(([blockId, review]) =>
          updateBlock(blockId, {
            rating: review.rating || null,
            review_note: review.review_note || null,
          })
        );
      await Promise.all(blockUpdates);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error("Failed to save review:", err);
    } finally {
      setSaving(false);
    }
  }, [tripId, overallRating, reviewNote, blockReviews, updateTrip, updateBlock]);

  if (loading) {
    return (
      <div className="p-6 space-y-4 max-w-3xl mx-auto">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );
  }

  if (days.length === 0) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <PixelWindow title="No Itinerary to Review" variant="moss">
          <div className="text-center py-8 space-y-4">
            <ClipboardCheck className="w-12 h-12 text-moss mx-auto" />
            <p className="font-[family-name:var(--font-press-start)] text-sm text-night">
              Nothing to review yet!
            </p>
            <p className="text-sm text-rock max-w-md mx-auto">
              Generate an itinerary first, then come back here to review your trip.
            </p>
          </div>
        </PixelWindow>
      </div>
    );
  }

  const isCompleted = trip?.status === "completed";

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-base">
          {isCompleted ? "Trip Review" : "Review & Complete Trip"}
        </h2>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : saved ? (
            <CheckCircle className="w-4 h-4 mr-2 text-moss" />
          ) : (
            <CheckCircle className="w-4 h-4 mr-2" />
          )}
          {saved ? "Saved!" : isCompleted ? "Update Review" : "Mark as Completed"}
        </Button>
      </div>

      {/* Overall trip review */}
      <PixelWindow title="Overall Rating" variant="jam">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <StarRating value={overallRating} onChange={setOverallRating} />
            {overallRating > 0 && (
              <span className="text-xs text-rock">{overallRating}/5</span>
            )}
          </div>
          <Textarea
            value={reviewNote}
            onChange={(e) => setReviewNote(e.target.value)}
            placeholder="How was the trip overall? Any highlights or things you'd change?"
            rows={3}
            className="text-sm"
          />
        </div>
      </PixelWindow>

      {/* Per-block reviews */}
      {days.map((day) => {
        const reviewableBlocks = day.blocks.filter((b) => b.type !== "heading");
        if (reviewableBlocks.length === 0) return null;

        return (
          <PixelWindow
            key={day.id}
            title={`Day ${day.day_number}${day.title ? ` — ${day.title}` : ""}`}
            variant="mist"
          >
            <div className="space-y-3">
              {day.summary && (
                <>
                  <p className="text-xs text-rock">{day.summary}</p>
                  <Separator />
                </>
              )}

              {reviewableBlocks.map((block) => {
                const config = typeConfig[block.type] || typeConfig.activity;
                const Icon = config.icon;
                const review = blockReviews[block.id] || { rating: 0, review_note: "" };

                return (
                  <div
                    key={block.id}
                    className="border-[2px] border-night/15 p-3 space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      <Badge className={`text-[9px] shrink-0 ${config.color}`}>
                        <Icon className="w-3 h-3 mr-1" />
                        {config.label}
                      </Badge>
                      <span className="text-sm text-night flex-1 min-w-0 truncate">
                        {block.title}
                      </span>
                      {block.start_time && (
                        <span className="text-[10px] text-rock shrink-0">
                          {block.start_time}
                        </span>
                      )}
                    </div>
                    <StarRating
                      value={review.rating}
                      onChange={(val) => updateBlockRating(block.id, val)}
                      size="sm"
                    />
                    <Textarea
                      value={review.review_note}
                      onChange={(e) => updateBlockReviewNote(block.id, e.target.value)}
                      placeholder="Notes on this activity..."
                      rows={1}
                      className="text-xs"
                    />
                    <BlockMediaUpload
                      blockId={block.id}
                      media={blockMedia[block.id] || []}
                      onUpload={handleMediaUpload}
                      onDelete={handleMediaDelete}
                    />
                  </div>
                );
              })}
            </div>
          </PixelWindow>
        );
      })}

    </div>
  );
}
