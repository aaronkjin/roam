"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import Image from "next/image";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { StarRating } from "@/components/ui/star-rating";
import { PixelSpinner } from "@/components/pixel/PixelSpinner";
import { usePlaceDetails } from "@/hooks/usePlaceDetails";
import {
  Clock,
  DollarSign,
  MapPin,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ItineraryBlock } from "@/types/itinerary";

interface BlockDetailModalProps {
  block: ItineraryBlock;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const typeConfig: Record<string, { color: string; label: string }> = {
  activity: { color: "bg-jam text-white", label: "Activity" },
  food: { color: "bg-grass text-night", label: "Food" },
  accommodation: { color: "bg-moss text-white", label: "Stay" },
};

const loadingMessages = [
  "Searching for reviews...",
  "Finding the best tips...",
  "Curating local insights...",
  "Gathering opening hours...",
  "Looking up ratings...",
  "Fetching photos...",
  "Checking travel guides...",
  "Reading what visitors say...",
];

export function BlockDetailModal({ block, open, onOpenChange }: BlockDetailModalProps) {
  const { data, loading, fetchDetails, reset } = usePlaceDetails();
  const [photoIndex, setPhotoIndex] = useState(0);
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);

  // Rotate loading messages
  useEffect(() => {
    if (!loading) return;
    setLoadingMsgIndex(0);
    const interval = setInterval(() => {
      setLoadingMsgIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [loading]);

  useEffect(() => {
    if (open) {
      fetchDetails(block);
      setPhotoIndex(0);
    } else {
      reset();
    }
  }, [open, block, fetchDetails, reset]);

  const config = typeConfig[block.type] || typeConfig.activity;

  // Combine block image with additional photos
  const allPhotos = [
    ...(block.image_url ? [block.image_url] : []),
    ...(data?.photos || []),
  ].filter((url, i, arr) => arr.indexOf(url) === i); // dedupe

  const handlePrevPhoto = () => {
    setPhotoIndex((prev) => (prev > 0 ? prev - 1 : allPhotos.length - 1));
  };

  const handleNextPhoto = () => {
    setPhotoIndex((prev) => (prev < allPhotos.length - 1 ? prev + 1 : 0));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] !max-w-6xl p-0 border-[3px] border-night overflow-hidden max-h-[90vh] overflow-y-auto">
        <DialogTitle className="sr-only">{block.title}</DialogTitle>
        {/* Photo carousel */}
        {allPhotos.length > 0 && (
          <div className="relative w-full max-h-[40vh]" style={{ aspectRatio: "21/9" }}>
            <div ref={carouselRef} className="w-full h-full relative">
              <Image
                src={allPhotos[photoIndex]}
                alt={block.title}
                fill
                className="object-cover"
                sizes="(max-width:768px) 100vw, 500px"
                unoptimized
              />
            </div>
            {allPhotos.length > 1 && (
              <>
                <button
                  onClick={handlePrevPhoto}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 border-[2px] border-night p-1 hover:bg-white"
                >
                  <ChevronLeft className="w-4 h-4 text-night" />
                </button>
                <button
                  onClick={handleNextPhoto}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 border-[2px] border-night p-1 hover:bg-white"
                >
                  <ChevronRight className="w-4 h-4 text-night" />
                </button>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                  {allPhotos.map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        "w-2 h-2 border-[1px] border-night",
                        i === photoIndex ? "bg-jam" : "bg-white/60"
                      )}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        <div className="p-4 space-y-4">
          {/* Header */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge className={cn("text-[9px]", config.color)}>
                {config.label}
              </Badge>
              {block.start_time && (
                <span className="flex items-center gap-1 text-[10px] font-[family-name:var(--font-silkscreen)] text-rock">
                  <Clock className="w-3 h-3" />
                  {block.start_time}{block.end_time ? ` – ${block.end_time}` : ""}
                </span>
              )}
            </div>
            <h3 className="font-[family-name:var(--font-silkscreen)] text-sm text-night">
              {block.title}
            </h3>
            {block.description && (
              <p className="text-xs text-rock leading-relaxed">{block.description}</p>
            )}
          </div>

          {/* Loading state */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <PixelSpinner />
              <p className="text-[11px] font-[family-name:var(--font-silkscreen)] text-rock animate-pulse">
                {loadingMessages[loadingMsgIndex]}
              </p>
            </div>
          )}

          {/* AI-enriched details */}
          {data && !loading && (
            <>
              {/* Links — immediately accessible */}
              <div className="flex flex-wrap gap-2">
                {data.google_maps_search_url && (
                  <a
                    href={data.google_maps_search_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[10px] font-[family-name:var(--font-silkscreen)] text-sky border-[2px] border-sky px-1.5 py-0.5 hover:bg-sky hover:text-night transition-colors"
                  >
                    <MapPin className="w-3 h-3" /> Maps
                  </a>
                )}
                {data.yelp_url && (
                  <a
                    href={data.yelp_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[10px] font-[family-name:var(--font-silkscreen)] text-jam border-[2px] border-jam px-1.5 py-0.5 hover:bg-jam hover:text-white transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" /> Yelp
                  </a>
                )}
                {data.tripadvisor_url && (
                  <a
                    href={data.tripadvisor_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[10px] font-[family-name:var(--font-silkscreen)] text-moss border-[2px] border-moss px-1.5 py-0.5 hover:bg-moss hover:text-white transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" /> TripAdvisor
                  </a>
                )}
                {data.official_website && (
                  <a
                    href={data.official_website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[10px] font-[family-name:var(--font-silkscreen)] text-night border-[2px] border-night px-1.5 py-0.5 hover:bg-night hover:text-white transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" /> Website
                  </a>
                )}
              </div>

              {/* Quick info row */}
              <div className="flex items-center gap-3 flex-wrap">
                {data.rating && (
                  <div className="flex items-center gap-1">
                    <StarRating value={Math.round(data.rating)} size="sm" />
                    <span className="text-[10px] text-rock">{data.rating}/5</span>
                  </div>
                )}
                {data.price_range && (
                  <span className="flex items-center gap-1 text-[10px] font-[family-name:var(--font-silkscreen)] text-white bg-grass border-[2px] border-night px-1.5 py-0.5">
                    {data.price_range}
                  </span>
                )}
                {data.opening_hours && (
                  <span className="flex items-center gap-1 text-[10px] text-rock">
                    <Clock className="w-3 h-3" />
                    {data.opening_hours}
                  </span>
                )}
              </div>

              {/* Why people love this */}
              {data.why_people_love_it && data.why_people_love_it.length > 0 && (
                <div className="border-[2px] border-night/10 p-3 space-y-1.5">
                  <h4 className="font-[family-name:var(--font-silkscreen)] text-[10px] text-night uppercase">
                    Why People Love This
                  </h4>
                  <ul className="space-y-1">
                    {data.why_people_love_it.map((reason, i) => (
                      <li key={i} className="text-xs text-rock leading-relaxed">
                        • {reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Need to know */}
              {data.need_to_know && data.need_to_know.length > 0 && (
                <div className="border-[2px] border-mist p-3 bg-mist/20 space-y-1.5">
                  <h4 className="font-[family-name:var(--font-silkscreen)] text-[10px] text-night uppercase">
                    Need to Know
                  </h4>
                  <ul className="space-y-1">
                    {data.need_to_know.map((tip, i) => (
                      <li key={i} className="text-xs text-rock leading-relaxed">
                        • {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Reviews */}
              {data.reviews && data.reviews.length > 0 && (
                <div className="space-y-2">
                  <a
                    href={data.google_maps_search_url || data.yelp_url || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-[family-name:var(--font-silkscreen)] text-[10px] text-sky uppercase hover:text-night hover:underline transition-colors inline-flex items-center gap-1"
                  >
                    Reviews
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  {data.reviews.slice(0, 3).map((review, i) => (
                    <div key={i} className="border-[2px] border-night/10 p-2 space-y-1">
                      <div className="flex items-center gap-2">
                        <StarRating value={Math.round(review.rating)} size="sm" />
                        <span className="text-[9px] text-rock">{review.source}</span>
                      </div>
                      <p className="text-[11px] text-rock leading-relaxed line-clamp-3">
                        {review.text}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
