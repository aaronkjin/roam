"use client";

import { Button } from "@/components/ui/button";
import { Heart, Bookmark, GitFork, MessageCircle, Trash2 } from "lucide-react";
import type { PublishedItinerary } from "@/types/feed";

interface FeedActionBarProps {
  published: PublishedItinerary;
  currentUserId?: string | null;
  onToggleLike: () => void;
  onToggleSave: () => void;
  onFork: () => void;
  onOpenComments: () => void;
  onDelete?: () => void;
}

export function FeedActionBar({
  published,
  currentUserId,
  onToggleLike,
  onToggleSave,
  onFork,
  onOpenComments,
  onDelete,
}: FeedActionBarProps) {
  const isOwner = currentUserId === published.user_id;
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Button
        variant="outline"
        size="sm"
        className={`gap-1.5 ${published.is_liked ? "bg-jam/10 border-jam text-jam" : ""}`}
        onClick={onToggleLike}
      >
        <Heart className={`w-4 h-4 ${published.is_liked ? "fill-jam" : ""}`} />
        <span className="font-[family-name:var(--font-silkscreen)] text-xs">
          {published.like_count}
        </span>
      </Button>

      <Button
        variant="outline"
        size="sm"
        className="gap-1.5"
        onClick={onOpenComments}
      >
        <MessageCircle className="w-4 h-4" />
        <span className="font-[family-name:var(--font-silkscreen)] text-xs">
          {published.comment_count}
        </span>
      </Button>

      <Button
        variant="outline"
        size="sm"
        className={`gap-1.5 ${published.is_saved ? "bg-moss/10 border-moss text-moss" : ""}`}
        onClick={onToggleSave}
      >
        <Bookmark className={`w-4 h-4 ${published.is_saved ? "fill-moss" : ""}`} />
        <span className="font-[family-name:var(--font-silkscreen)] text-xs">
          {published.save_count}
        </span>
      </Button>

      <div className="flex items-center gap-2 ml-auto">
        {!isOwner && (
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={onFork}
          >
            <GitFork className="w-4 h-4" />
            <span className="font-[family-name:var(--font-silkscreen)] text-xs">
              Copy to My Trips
            </span>
          </Button>
        )}
        {isOwner && onDelete && (
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-jam border-jam hover:bg-jam/10"
            onClick={onDelete}
          >
            <Trash2 className="w-4 h-4" />
            <span className="font-[family-name:var(--font-silkscreen)] text-xs">
              Remove from Feed
            </span>
          </Button>
        )}
      </div>
    </div>
  );
}
