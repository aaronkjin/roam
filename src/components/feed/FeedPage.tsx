"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";
import { useFeed } from "@/hooks/useFeed";
import { FeedCard } from "./FeedCard";
import { FeedSearch } from "./FeedSearch";
import { FeedSortToggle } from "./FeedSortToggle";
import { PublishedItineraryView } from "./PublishedItineraryView";
import { PixelSpinner } from "@/components/pixel/PixelSpinner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { VisuallyHidden } from "radix-ui";
import { Newspaper } from "lucide-react";

interface FeedPageProps {
  initialTab?: "discover" | "saved";
}

export function FeedPage({ initialTab = "discover" }: FeedPageProps) {
  const { user } = useUser();
  const activeTab = initialTab;
  const {
    items,
    loading,
    error,
    hasMore,
    filters,
    updateFilters,
    loadMore,
    toggleLike,
    toggleSave,
    removePost,
  } = useFeed(undefined, { savedOnly: activeTab === "saved" });

  const searchParams = useSearchParams();
  const [selectedSlug, setSelectedSlug] = useState<string | null>(
    () => searchParams.get("open")
  );
  const [openComments, setOpenComments] = useState(false);
  const isSavedView = activeTab === "saved";

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="font-[family-name:var(--font-press-start)] text-lg text-night flex items-center gap-3">
          <Newspaper className="w-6 h-6" />
          {isSavedView ? "Itineraries You Saved" : "Feed"}
        </h1>
        <p className="text-sm text-rock font-[family-name:var(--font-roboto-mono)]">
          {isSavedView
            ? "You were inspired by these adventurers."
            : "Discover itineraries from other travelers"}
        </p>
      </div>

      {/* Controls */}
      <div className="space-y-3">
        {!isSavedView && (
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <div className="flex-1 w-full">
              <FeedSearch
                value={filters.destination || ""}
                onChange={(destination) => updateFilters({ destination })}
              />
            </div>
            <FeedSortToggle
              value={filters.sort || "recent"}
              onChange={(sort) => updateFilters({ sort })}
            />
          </div>
        )}
      </div>

      {/* Feed — single column, stacked */}
      {loading && items.length === 0 ? (
        <div className="flex justify-center py-12">
          <PixelSpinner />
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-sm text-jam font-[family-name:var(--font-silkscreen)]">
            {error}
          </p>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 space-y-3">
          <Newspaper className="w-12 h-12 text-rock/30 mx-auto" />
          <p className="font-[family-name:var(--font-silkscreen)] text-sm text-rock">
            {isSavedView
              ? "No saved itineraries yet"
              : filters.destination
              ? `No itineraries found for "${filters.destination}"`
              : "No published itineraries yet"}
          </p>
          {!isSavedView && (
            <p className="text-xs text-rock">
              Be the first to publish your itinerary!
            </p>
          )}
        </div>
      ) : (
        <>
          <div className="space-y-6">
            {items.map((item) => (
              <FeedCard
                key={item.id}
                item={item}
                currentUserId={user?.id || null}
                onToggleLike={toggleLike}
                onToggleSave={toggleSave}
                onClick={(slug, options) => {
                  setSelectedSlug(slug);
                  setOpenComments(!!options?.openComments);
                }}
                onDelete={removePost}
              />
            ))}
          </div>

          {!isSavedView && hasMore && (
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                onClick={loadMore}
                disabled={loading}
                className="gap-2"
              >
                {loading ? "Loading..." : "Load More"}
              </Button>
            </div>
          )}
        </>
      )}

      {/* Detail modal */}
      <Dialog
        open={!!selectedSlug}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedSlug(null);
            setOpenComments(false);
          }
        }}
      >
        <DialogContent className="!max-w-6xl !w-[95vw] max-h-[90vh] overflow-y-auto p-8">
          <VisuallyHidden.Root>
            <DialogTitle>Itinerary Details</DialogTitle>
          </VisuallyHidden.Root>
          {selectedSlug && (
            <PublishedItineraryView
              key={`${selectedSlug}:${openComments ? "comments" : "details"}`}
              slug={selectedSlug}
              currentUserId={user?.id || null}
              initialCommentsOpen={openComments}
              onDelete={(tripId, slug) => {
                removePost(tripId, slug);
                setSelectedSlug(null);
                setOpenComments(false);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
