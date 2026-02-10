"use client";

import { useState, useCallback } from "react";
import { useInspoItems } from "@/hooks/useInspoItems";
import { InspoCard } from "./InspoCard";
import { InspoAddModal } from "./InspoAddModal";
import { InspoFilters } from "./InspoFilters";
import { InspoDropZone } from "./InspoDropZone";
import { InspoPreview } from "./InspoPreview";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Sparkles } from "lucide-react";
import { PixelWindow } from "@/components/pixel/PixelWindow";
import type { InspoItem, InspoType } from "@/types/inspo";
import Link from "next/link";

interface InspoBoardProps {
  tripId: string;
}

export function InspoBoard({ tripId }: InspoBoardProps) {
  const { items, loading, addItem, updateItem, deleteItem } = useInspoItems(tripId);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [previewItem, setPreviewItem] = useState<InspoItem | null>(null);
  const [filter, setFilter] = useState<InspoType | "all">("all");

  const filteredItems =
    filter === "all" ? items : items.filter((item) => item.type === filter);

  const handleUrlDrop = useCallback(
    (url: string) => {
      // Quick add with just URL, modal will parse it
      addItem({ type: "link", url });
    },
    [addItem]
  );

  const handleEdit = useCallback((item: InspoItem) => {
    setPreviewItem(item);
  }, []);

  const handleDelete = useCallback(
    async (id: string) => {
      await deleteItem(id);
    },
    [deleteItem]
  );

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="flex gap-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-8 w-20" />
          ))}
        </div>
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-48 mb-4" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <InspoFilters activeFilter={filter} onFilterChange={setFilter} />
        <div className="flex gap-2">
          <Button onClick={() => setAddModalOpen(true)} size="sm">
            <Plus className="w-4 h-4 mr-1" />
            Add Inspo
          </Button>
          {items.length > 0 && (
            <Button asChild variant="secondary" size="sm">
              <Link href={`/trip/${tripId}/generate`}>
                <Sparkles className="w-4 h-4 mr-1" />
                Generate Itinerary
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Board */}
      {filteredItems.length > 0 ? (
        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4">
          {filteredItems.map((item) => (
            <InspoCard
              key={item.id}
              item={item}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        <PixelWindow title="Getting Started" variant="mist">
          <div className="text-center py-8 space-y-4">
            <p className="font-[family-name:var(--font-press-start)] text-sm text-night">
              No inspo yet!
            </p>
            <p className="text-sm text-rock max-w-md mx-auto">
              Start collecting inspiration for your trip. Paste links from TikTok,
              Instagram, blogs, or just jot down notes about what excites you.
            </p>
            <Button onClick={() => setAddModalOpen(true)}>
              <Plus className="w-4 h-4 mr-1" />
              Add Your First Inspo
            </Button>
          </div>
        </PixelWindow>
      ) : (
        <div className="text-center py-12">
          <p className="text-sm text-rock font-[family-name:var(--font-silkscreen)]">
            No {filter} items found
          </p>
        </div>
      )}

      {/* Drop zone */}
      {items.length > 0 && <InspoDropZone onUrlDrop={handleUrlDrop} />}

      {/* Modals */}
      <InspoAddModal
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
        onAdd={addItem}
      />
      <InspoPreview
        item={previewItem}
        open={!!previewItem}
        onOpenChange={(open) => !open && setPreviewItem(null)}
        onUpdate={updateItem}
      />
    </div>
  );
}
