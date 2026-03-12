"use client";

import { Suspense } from "react";
import { FeedPage } from "@/components/feed/FeedPage";

export default function SavedFeedRoute() {
  return (
    <Suspense>
      <FeedPage initialTab="saved" />
    </Suspense>
  );
}
