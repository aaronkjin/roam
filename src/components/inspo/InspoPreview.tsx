"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PixelSpinner } from "@/components/pixel/PixelSpinner";
import { ExternalLink, X } from "lucide-react";
import type { InspoItem, UpdateInspoInput } from "@/types/inspo";

interface InspoPreviewProps {
  item: InspoItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate?: (id: string, input: UpdateInspoInput) => Promise<InspoItem | null>;
}

/**
 * Attempt to extract an embeddable URL from a video link.
 * Returns null if the URL isn't from a supported platform.
 */
function getEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);

    // YouTube
    if (u.hostname.includes("youtube.com") && u.searchParams.get("v")) {
      return `https://www.youtube.com/embed/${u.searchParams.get("v")}`;
    }
    if (u.hostname === "youtu.be") {
      return `https://www.youtube.com/embed${u.pathname}`;
    }

    // TikTok – /embed/v2/:id works for TikTok videos
    const tiktokMatch = url.match(/tiktok\.com\/@[^/]+\/video\/(\d+)/);
    if (tiktokMatch) {
      return `https://www.tiktok.com/embed/v2/${tiktokMatch[1]}`;
    }

    // Instagram Reels – append /embed
    if (u.hostname.includes("instagram.com") && u.pathname.includes("/reel")) {
      return `${u.origin}${u.pathname}embed/`;
    }

    // Vimeo
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    }
  } catch {
    // not a valid URL
  }
  return null;
}

function InspoEditForm({
  item,
  onUpdate,
  onClose,
}: {
  item: InspoItem;
  onUpdate: (id: string, input: UpdateInspoInput) => Promise<InspoItem | null>;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(item.title || "");
  const [description, setDescription] = useState(item.description || "");
  const [userNote, setUserNote] = useState(item.user_note || "");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>(item.tags || []);
  const [saving, setSaving] = useState(false);

  const embedUrl = item.url ? getEmbedUrl(item.url) : null;

  const handleAddTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
      setTagInput("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await onUpdate(item.id, {
      title: title.trim() || undefined,
      description: description.trim() || undefined,
      user_note: userNote.trim() || undefined,
      tags,
    });
    setSaving(false);
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Video embed */}
      {embedUrl && (
        <div className="border-[3px] border-night overflow-hidden aspect-video">
          <iframe
            src={embedUrl}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={item.title || "Video preview"}
          />
        </div>
      )}

      {/* Fallback image if no embed but has image_url */}
      {!embedUrl && item.image_url && (
        <div className="border-[3px] border-night overflow-hidden">
          <img
            src={item.image_url}
            alt={item.title || ""}
            className="w-full max-h-64 object-cover"
          />
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
          placeholder="Give it a name..."
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs font-[family-name:var(--font-silkscreen)] uppercase text-night mb-1.5">
          Description
        </label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What is this about?"
          rows={2}
        />
      </div>

      {/* User note */}
      <div>
        <label className="block text-xs font-[family-name:var(--font-silkscreen)] uppercase text-night mb-1.5">
          Your Note
        </label>
        <Textarea
          value={userNote}
          onChange={(e) => setUserNote(e.target.value)}
          placeholder="Why does this inspire you?"
          rows={2}
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
                <button type="button" onClick={() => setTags(tags.filter((t) => t !== tag))}>
                  <X className="w-2.5 h-2.5" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Source info & actions */}
      <div className="flex flex-wrap items-center gap-3 pt-1">
        {item.site_name && (
          <span className="text-[10px] text-rock font-[family-name:var(--font-silkscreen)] flex items-center gap-1.5">
            {item.favicon_url && (
              <img src={item.favicon_url} alt="" className="w-3.5 h-3.5" />
            )}
            {item.site_name}
          </span>
        )}
        {item.url && (
          <Button asChild variant="outline" size="sm" className="h-7 text-xs">
            <a href={item.url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-3 h-3 mr-1" />
              Open Original
            </a>
          </Button>
        )}
      </div>

      <div className="flex gap-3 justify-end pt-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? (
            <span className="flex items-center gap-2">
              <PixelSpinner size="sm" />
              Saving...
            </span>
          ) : (
            "Save Changes"
          )}
        </Button>
      </div>
    </form>
  );
}

export function InspoPreview({ item, open, onOpenChange, onUpdate }: InspoPreviewProps) {
  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm">
            {onUpdate ? "Edit Inspo" : (item.title || "Untitled")}
          </DialogTitle>
        </DialogHeader>

        {onUpdate ? (
          <InspoEditForm
            key={item.id}
            item={item}
            onUpdate={onUpdate}
            onClose={() => onOpenChange(false)}
          />
        ) : (
          /* Read-only fallback */
          <ReadOnlyPreview item={item} />
        )}
      </DialogContent>
    </Dialog>
  );
}

function ReadOnlyPreview({ item }: { item: InspoItem }) {
  const embedUrl = item.url ? getEmbedUrl(item.url) : null;

  return (
    <div className="space-y-4">
      {embedUrl && (
        <div className="border-[3px] border-night overflow-hidden aspect-video">
          <iframe
            src={embedUrl}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={item.title || "Video preview"}
          />
        </div>
      )}

      {!embedUrl && item.image_url && (
        <div className="border-[3px] border-night overflow-hidden">
          <img
            src={item.image_url}
            alt={item.title || ""}
            className="w-full max-h-64 object-cover"
          />
        </div>
      )}

      {item.description && (
        <p className="text-sm text-night">{item.description}</p>
      )}

      {item.user_note && (
        <div className="bg-mist/30 border-[2px] border-night/20 p-3">
          <p className="text-xs font-[family-name:var(--font-silkscreen)] uppercase text-rock mb-1">
            Your Note
          </p>
          <p className="text-sm text-night">{item.user_note}</p>
        </div>
      )}

      {item.tags && item.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {item.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {item.url && (
        <Button asChild variant="outline" size="sm" className="w-fit">
          <a href={item.url} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="w-3.5 h-3.5 mr-2" />
            Open Original
          </a>
        </Button>
      )}
    </div>
  );
}
