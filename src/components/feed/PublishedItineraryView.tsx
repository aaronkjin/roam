"use client";

import { useState } from "react";
import { usePublishedItinerary } from "@/hooks/usePublishedItinerary";
import { useFeedComments } from "@/hooks/useFeedComments";
import { ItineraryReadOnly } from "@/components/itinerary/ItineraryReadOnly";
import { PixelSpinner } from "@/components/pixel/PixelSpinner";
import { PixelWindow } from "@/components/pixel/PixelWindow";
import { ReviewStatusBadge } from "./ReviewStatusBadge";
import { FeedActionBar } from "./FeedActionBar";
import { FeedCommentSection } from "./FeedCommentSection";
import { ForkDialog } from "./ForkDialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { MapPin, Calendar } from "lucide-react";
import { formatTripDateRange } from "@/lib/trip-dates";

interface PublishedItineraryViewProps {
  slug: string;
  currentUserId: string | null;
  initialCommentsOpen?: boolean;
  onDelete?: (tripId: string, slug: string) => void;
}

export function PublishedItineraryView({
  slug,
  currentUserId,
  initialCommentsOpen = false,
  onDelete,
}: PublishedItineraryViewProps) {
  const {
    published,
    days,
    loading,
    error,
    toggleLike,
    toggleSave,
    forkItinerary,
  } = usePublishedItinerary(slug);

  const {
    comments,
    loading: commentsLoading,
    addComment,
    deleteComment,
    editComment,
  } = useFeedComments(slug);

  const [forkOpen, setForkOpen] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(initialCommentsOpen);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <PixelSpinner />
      </div>
    );
  }

  if (error || !published) {
    return (
      <div className="py-8">
        <PixelWindow title="Not Found" variant="jam">
          <div className="text-center py-8 space-y-3">
            <p className="font-[family-name:var(--font-press-start)] text-sm text-night">
              Itinerary not found
            </p>
            <p className="text-sm text-rock">
              This published itinerary may have been removed.
            </p>
          </div>
        </PixelWindow>
      </div>
    );
  }

  const tripTiming = formatTripDateRange({
    startDate: published.start_date,
    endDate: published.end_date,
    dateRangeLabel: published.date_range_label,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-3">
        {/* Author */}
        {published.author && (
          <div className="flex items-center gap-2.5">
            {published.author.avatar_url ? (
              <img
                src={published.author.avatar_url}
                alt={published.author.display_name || "User"}
                className="w-9 h-9 border-[2px] border-night"
              />
            ) : (
              <div className="w-9 h-9 bg-sky border-[2px] border-night flex items-center justify-center text-xs font-[family-name:var(--font-silkscreen)] text-night">
                {(published.author.display_name || published.author.email)?.[0]?.toUpperCase()}
              </div>
            )}
            <span className="text-sm font-bold text-night font-[family-name:var(--font-roboto-mono)]">
              {published.author.display_name || published.author.email}
            </span>
          </div>
        )}

        <h1 className="font-[family-name:var(--font-press-start)] text-base text-night leading-relaxed">
          {published.title}
        </h1>

        <div className="flex flex-wrap gap-2 items-center">
          <ReviewStatusBadge
            isReviewed={published.is_reviewed}
            overallRating={published.overall_rating}
          />
          {published.destination && (
            <span className="flex items-center gap-1 text-sm text-rock">
              <MapPin className="w-4 h-4" />
              {published.destination}
            </span>
          )}
          {tripTiming && (
            <span className="flex items-center gap-1 text-sm text-rock">
              <Calendar className="w-4 h-4" />
              {tripTiming}
            </span>
          )}
        </div>

        {published.description && (
          <p className="text-sm text-rock">{published.description}</p>
        )}
      </div>

      {/* Action bar */}
      <FeedActionBar
        published={published}
        currentUserId={currentUserId}
        onToggleLike={toggleLike}
        onToggleSave={toggleSave}
        onFork={() => setForkOpen(true)}
        onOpenComments={() => setCommentsOpen(true)}
        onDelete={onDelete ? () => onDelete(published.trip_id, published.slug) : undefined}
      />

      {/* Itinerary content */}
      <ItineraryReadOnly
        days={days}
        showBlockReviews={published.is_reviewed}
      />

      {/* Fork dialog */}
      <ForkDialog
        open={forkOpen}
        onOpenChange={setForkOpen}
        published={published}
        onFork={forkItinerary}
      />

      {/* Comments sheet */}
      <Sheet open={commentsOpen} onOpenChange={setCommentsOpen}>
        <SheetContent
          side="right"
          className="w-full max-w-2xl overflow-y-auto border-l-[4px] border-night p-0 sm:w-[36rem] sm:max-w-2xl"
        >
          <SheetHeader className="border-b-[3px] border-night/10 p-6 pr-14">
            <SheetTitle className="font-[family-name:var(--font-press-start)] text-sm text-night">
              Comments
            </SheetTitle>
            <SheetDescription className="font-[family-name:var(--font-roboto-mono)] text-sm text-rock">
              Join the conversation without leaving this itinerary.
            </SheetDescription>
          </SheetHeader>
          <div className="p-6">
            <FeedCommentSection
              comments={comments}
              loading={commentsLoading}
              currentUserId={currentUserId}
              publishedAuthorId={published.user_id}
              onAddComment={addComment}
              onDeleteComment={deleteComment}
              onEditComment={editComment}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
