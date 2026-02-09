"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { PixelSpinner } from "@/components/pixel/PixelSpinner";
import { useUrlPreview } from "@/hooks/useUrlPreview";
import type { InspoType, CreateInspoInput } from "@/types/inspo";
import { Link, Image, Video, FileText, StickyNote, X } from "lucide-react";

interface InspoAddModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (input: Omit<CreateInspoInput, "trip_id">) => Promise<unknown>;
}

const types: { value: InspoType; label: string; icon: React.ElementType }[] = [
  { value: "link", label: "Link", icon: Link },
  { value: "image", label: "Image", icon: Image },
  { value: "video", label: "Video", icon: Video },
  { value: "article", label: "Article", icon: FileText },
  { value: "note", label: "Note", icon: StickyNote },
];

export function InspoAddModal({ open, onOpenChange, onAdd }: InspoAddModalProps) {
  const [type, setType] = useState<InspoType>("link");
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [userNote, setUserNote] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const { preview, loading: parseLoading } = useUrlPreview(
    type !== "note" ? url : ""
  );

  // Auto-fill from preview
  const displayTitle = title || preview?.title || "";
  const displayDesc = description || preview?.description || "";

  const handleAddTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    await onAdd({
      type: preview?.type || type,
      url: url || undefined,
      title: displayTitle || undefined,
      description: displayDesc || undefined,
      image_url: preview?.image_url || undefined,
      site_name: preview?.site_name || undefined,
      favicon_url: preview?.favicon_url || undefined,
      user_note: userNote || undefined,
      tags,
    });

    setSaving(false);
    resetForm();
    onOpenChange(false);
  };

  const resetForm = () => {
    setType("link");
    setUrl("");
    setTitle("");
    setDescription("");
    setUserNote("");
    setTags([]);
    setTagInput("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base">Add Inspo</DialogTitle>
          <DialogDescription className="font-[family-name:var(--font-silkscreen)] text-xs">
            Save something that inspires your trip
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type selector */}
          <div className="flex gap-2 flex-wrap">
            {types.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setType(t.value)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 border-[2px] text-xs font-[family-name:var(--font-silkscreen)] uppercase transition-colors ${
                    type === t.value
                      ? "border-night bg-jam text-white"
                      : "border-night/30 text-rock hover:border-night"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* URL input */}
          {type !== "note" && (
            <div>
              <label className="block text-xs font-[family-name:var(--font-silkscreen)] uppercase text-night mb-1.5">
                URL
              </label>
              <div className="relative">
                <Input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="Paste a URL..."
                  type="url"
                />
                {parseLoading && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <PixelSpinner size="sm" />
                  </div>
                )}
              </div>
              {preview && (
                <div className="mt-2 p-2 border-[2px] border-night/20 bg-mist/20 flex gap-3">
                  {preview.image_url && (
                    <img
                      src={preview.image_url}
                      alt=""
                      className="w-16 h-16 object-cover border border-night/20"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-night truncate">
                      {preview.title}
                    </p>
                    <p className="text-[10px] text-rock line-clamp-2">
                      {preview.description}
                    </p>
                    {preview.site_name && (
                      <p className="text-[10px] text-rock/60 mt-0.5">
                        {preview.site_name}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-[family-name:var(--font-silkscreen)] uppercase text-night mb-1.5">
              Title
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={preview?.title || "Give it a name..."}
            />
          </div>

          {/* Note / Description */}
          <div>
            <label className="block text-xs font-[family-name:var(--font-silkscreen)] uppercase text-night mb-1.5">
              {type === "note" ? "Note" : "Your Note"}
            </label>
            <Textarea
              value={userNote}
              onChange={(e) => setUserNote(e.target.value)}
              placeholder="Why does this inspire you?"
              rows={3}
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-[family-name:var(--font-silkscreen)] uppercase text-night mb-1.5">
              Tags
            </label>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="Add a tag..."
                className="flex-1"
              />
              <Button type="button" variant="outline" size="sm" onClick={handleAddTag}>
                Add
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-[10px] gap-1">
                    {tag}
                    <button type="button" onClick={() => handleRemoveTag(tag)}>
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <span className="flex items-center gap-2">
                  <PixelSpinner size="sm" />
                  Saving...
                </span>
              ) : (
                "Save Inspo"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
