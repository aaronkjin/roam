"use client";

import { use } from "react";
import { PublishedItineraryView } from "@/components/feed/PublishedItineraryView";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface PublishedItineraryPageProps {
  params: Promise<{ slug: string }>;
}

export default function PublishedItineraryPage({ params }: PublishedItineraryPageProps) {
  const { slug } = use(params);
  const { user } = useUser();

  return (
    <div className="min-h-screen bg-[#faf9f6]">
      <div className="max-w-3xl mx-auto p-6 space-y-4">
        <Link
          href="/feed"
          className="inline-flex items-center gap-1 text-xs text-rock hover:text-night transition-colors font-[family-name:var(--font-silkscreen)]"
        >
          <ArrowLeft className="w-3 h-3" />
          Back to Feed
        </Link>
        <PublishedItineraryView
          slug={slug}
          currentUserId={user?.id || null}
        />
        <p className="text-center text-[10px] text-rock font-[family-name:var(--font-silkscreen)] py-4">
          Made with Roam
        </p>
      </div>
    </div>
  );
}
