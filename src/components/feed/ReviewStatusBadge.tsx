"use client";

import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";

interface ReviewStatusBadgeProps {
  isReviewed: boolean;
  overallRating: number | null;
}

export function ReviewStatusBadge({ isReviewed, overallRating }: ReviewStatusBadgeProps) {
  if (isReviewed && overallRating) {
    return (
      <Badge className="text-[9px] bg-grass text-night gap-1">
        <Star className="w-3 h-3 fill-current" />
        Reviewed {overallRating}/5
      </Badge>
    );
  }

  if (isReviewed) {
    return (
      <Badge className="text-[9px] bg-grass text-night">
        Reviewed
      </Badge>
    );
  }

  return (
    <Badge className="text-[9px] bg-rock text-white">
      Unreviewed
    </Badge>
  );
}
