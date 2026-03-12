"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Globe, Loader2, Check, ExternalLink } from "lucide-react";
import type { ItineraryDay, ItineraryBlock } from "@/types/itinerary";

interface PublishButtonProps {
  tripId: string;
  tripTitle: string;
  destination: string | null;
  days: (ItineraryDay & { blocks: ItineraryBlock[] })[];
  isPublished?: boolean;
  publishedSlug?: string | null;
}

export function PublishButton({
  tripId,
  tripTitle,
  destination,
  days,
  isPublished = false,
  publishedSlug = null,
}: PublishButtonProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [published, setPublished] = useState(isPublished);
  const [slug, setSlug] = useState(publishedSlug);
  const [error, setError] = useState<string | null>(null);

  const blockCount = days.reduce((sum, day) => sum + (day.blocks?.length || 0), 0);

  // Check publish status on mount
  useEffect(() => {
    async function checkStatus() {
      try {
        const res = await fetch(`/api/feed/publish?trip_id=${tripId}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.published) {
          setPublished(true);
          setSlug(data.slug);
        }
      } catch {
        // Ignore
      }
    }
    if (!isPublished) {
      checkStatus();
    }
  }, [tripId, isPublished]);

  const handlePublish = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/feed/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trip_id: tripId }),
      });

      if (res.status === 409) {
        const data = await res.json();
        setPublished(true);
        setSlug(data.published?.slug || null);
        return;
      }

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to publish");
      }

      const data = await res.json();
      setPublished(true);
      setSlug(data.slug);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to publish");
    } finally {
      setLoading(false);
    }
  };

  const handleUnpublish = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/feed/publish", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trip_id: tripId }),
      });
      if (!res.ok) throw new Error("Failed to unpublish");
      setPublished(false);
      setSlug(null);
      setDialogOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to unpublish");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className={`gap-1.5 ${published ? "bg-grass/10 border-moss text-moss" : ""}`}
        onClick={() => setDialogOpen(true)}
      >
        <Globe className="w-3.5 h-3.5" />
        {published ? "Published" : "Publish to Feed"}
      </Button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-[family-name:var(--font-press-start)] text-xs text-night flex items-center gap-2">
              <Globe className="w-4 h-4" />
              {published ? "Published to Feed" : "Publish to Feed"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Preview */}
            <div className="bg-mist/30 border-[2px] border-night/20 p-3 space-y-1">
              <p className="text-sm font-bold text-night">{tripTitle}</p>
              {destination && (
                <p className="text-xs text-rock">{destination}</p>
              )}
              <div className="flex gap-2">
                <Badge className="text-[9px] bg-mist text-night">
                  {days.length} {days.length === 1 ? "day" : "days"}
                </Badge>
                <Badge className="text-[9px] bg-sky text-night">
                  {blockCount} {blockCount === 1 ? "activity" : "activities"}
                </Badge>
              </div>
            </div>

            {published ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-moss">
                  <Check className="w-4 h-4" />
                  <span className="text-sm font-[family-name:var(--font-silkscreen)]">
                    Your itinerary is live!
                  </span>
                </div>

                {slug && (
                  <a
                    href={`/feed?open=${slug}`}
                    className="flex items-center gap-2 text-sm text-sky hover:text-night transition-colors font-[family-name:var(--font-roboto-mono)]"
                  >
                    <ExternalLink className="w-4 h-4" />
                    View on Feed
                  </a>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleUnpublish}
                  disabled={loading}
                  className="text-jam border-jam hover:bg-jam/10"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  Unpublish
                </Button>
              </div>
            ) : (
              <>
                <p className="text-xs text-rock">
                  Publishing will make your itinerary visible to all Roam users.
                  They can view, like, comment, and copy your itinerary.
                </p>

                {error && (
                  <p className="text-xs text-jam font-[family-name:var(--font-silkscreen)]">
                    {error}
                  </p>
                )}

                <Button
                  onClick={handlePublish}
                  disabled={loading || days.length === 0}
                  className="w-full bg-jam text-white gap-2"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Globe className="w-4 h-4" />
                  )}
                  {loading ? "Publishing..." : "Publish"}
                </Button>

                {days.length === 0 && (
                  <p className="text-[10px] text-rock font-[family-name:var(--font-silkscreen)] text-center">
                    Add at least one day to publish
                  </p>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
