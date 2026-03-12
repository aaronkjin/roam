"use client";

import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ReviewStatusBadge } from "./ReviewStatusBadge";
import { getProxiedImageUrl } from "@/lib/image-proxy";
import {
  MapPin,
  Calendar,
  Heart,
  MessageCircle,
  Bookmark,
  GitFork,
  MoreHorizontal,
  Trash2,
} from "lucide-react";
import type { PublishedItinerary } from "@/types/feed";
import { formatTripDateRange } from "@/lib/trip-dates";

interface FeedCardProps {
  item: PublishedItinerary;
  currentUserId: string | null;
  onToggleLike: (slug: string) => void;
  onToggleSave: (slug: string) => void;
  onClick: (slug: string, options?: { openComments?: boolean }) => void;
  onDelete?: (tripId: string, slug: string) => void;
}

export function FeedCard({ item, currentUserId, onToggleLike, onToggleSave, onClick, onDelete }: FeedCardProps) {
  const isOwner = currentUserId === item.user_id;
  const tripTiming = formatTripDateRange({
    startDate: item.start_date,
    endDate: item.end_date,
    dateRangeLabel: item.date_range_label,
  });

  return (
    <div className="border-[3px] border-night bg-white pixel-shadow">
      {/* Author header — Instagram style */}
      {item.author && (
        <div className="flex items-center gap-2.5 px-4 py-3 border-b-[2px] border-night/10">
          {item.author.avatar_url ? (
            <img
              src={item.author.avatar_url}
              alt={item.author.display_name || "User"}
              className="w-8 h-8 border-[2px] border-night"
            />
          ) : (
            <div className="w-8 h-8 bg-sky border-[2px] border-night flex items-center justify-center text-[9px] font-[family-name:var(--font-silkscreen)] text-night">
              {(item.author.display_name || item.author.email)?.[0]?.toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <span className="text-sm font-bold text-night truncate block">
              {item.author.display_name || item.author.email}
            </span>
            {item.destination && (
              <span className="flex items-center gap-1 text-[10px] text-rock">
                <MapPin className="w-3 h-3 shrink-0" />
                {item.destination}
              </span>
            )}
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <ReviewStatusBadge
              isReviewed={item.is_reviewed}
              overallRating={item.overall_rating}
            />
            {isOwner && onDelete && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-1 text-rock hover:text-night transition-colors cursor-pointer">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => onDelete(item.trip_id, item.slug)}
                    className="text-jam focus:text-jam"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Remove from Feed
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      )}

      {/* Cover image — large, clickable */}
      <button
        onClick={() => onClick(item.slug)}
        className="block w-full cursor-pointer"
      >
        {item.cover_image_url ? (
          <div className="w-full aspect-[16/9] overflow-hidden">
            <img
              src={getProxiedImageUrl(item.cover_image_url)}
              alt={item.title}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="w-full aspect-[16/9] bg-gradient-to-br from-mist to-sky flex items-center justify-center">
            <MapPin className="w-10 h-10 text-night/30" />
          </div>
        )}
      </button>

      {/* Action bar — like, comment, save, fork */}
      <div className="flex items-center gap-4 px-4 py-2.5">
        <button
          onClick={() => onToggleLike(item.slug)}
          className="flex items-center gap-1.5 text-rock hover:text-jam transition-colors cursor-pointer"
        >
          <Heart
            className={`w-5 h-5 ${item.is_liked ? "fill-jam text-jam" : ""}`}
          />
          <span className="text-xs font-[family-name:var(--font-silkscreen)]">
            {item.like_count}
          </span>
        </button>

        <button
          onClick={() => onClick(item.slug, { openComments: true })}
          className="flex items-center gap-1.5 text-rock hover:text-night transition-colors cursor-pointer"
        >
          <MessageCircle className="w-5 h-5" />
          <span className="text-xs font-[family-name:var(--font-silkscreen)]">
            {item.comment_count}
          </span>
        </button>

        <button
          onClick={() => onToggleSave(item.slug)}
          className="flex items-center gap-1.5 text-rock hover:text-moss transition-colors cursor-pointer"
        >
          <Bookmark
            className={`w-5 h-5 ${item.is_saved ? "fill-moss text-moss" : ""}`}
          />
          <span className="text-xs font-[family-name:var(--font-silkscreen)]">
            {item.save_count}
          </span>
        </button>

        <div className="flex items-center gap-1.5 text-rock ml-auto">
          <GitFork className="w-4 h-4" />
          <span className="text-xs font-[family-name:var(--font-silkscreen)]">
            {item.fork_count}
          </span>
        </div>
      </div>

      {/* Caption area */}
      <div className="px-4 pb-3 space-y-1.5">
        <button
          onClick={() => onClick(item.slug)}
          className="text-left cursor-pointer"
        >
          <h4 className="text-sm font-bold text-night hover:text-jam transition-colors">
            {item.title}
          </h4>
        </button>

        <div className="flex items-center gap-2 flex-wrap">
          <Badge className="text-[9px] bg-mist text-night">
            {item.day_count} {item.day_count === 1 ? "day" : "days"}
          </Badge>
          {tripTiming && (
            <span className="flex items-center gap-1 text-[10px] text-rock">
              <Calendar className="w-3 h-3" />
              {tripTiming}
            </span>
          )}
        </div>

        {(item.ai_summary || item.description) && (
          <p className="text-xs text-rock line-clamp-3 font-[family-name:var(--font-roboto-mono)] leading-relaxed italic">
            {item.ai_summary || item.description}
          </p>
        )}

        {item.comment_count > 0 && (
          <button
            onClick={() => onClick(item.slug, { openComments: true })}
            className="text-xs text-rock hover:text-night font-[family-name:var(--font-silkscreen)] cursor-pointer"
          >
            View all {item.comment_count} comments
          </button>
        )}
      </div>
    </div>
  );
}
