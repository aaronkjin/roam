"use client";

import { Suspense } from "react";
import { FeedPage } from "@/components/feed/FeedPage";

export default function FeedRoute() {
  return (
    <Suspense>
      <FeedPage initialTab="discover" />
    </Suspense>
  );
}
