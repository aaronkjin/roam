"use client";

import { useRef, useState } from "react";
import type { BlockMedia } from "@/types/itinerary";
import { Camera, Film, X, Plus, Loader2 } from "lucide-react";

interface BlockMediaUploadProps {
  blockId: string;
  media: BlockMedia[];
  onUpload: (blockId: string, file: File) => Promise<void>;
  onDelete: (blockId: string, mediaId: string) => Promise<void>;
}

export function BlockMediaUpload({
  blockId,
  media,
  onUpload,
  onDelete,
}: BlockMediaUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      await onUpload(blockId, file);
    } finally {
      setUploading(false);
      // Reset input so the same file can be re-selected
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDelete = async (mediaId: string) => {
    setDeletingId(mediaId);
    try {
      await onDelete(blockId, mediaId);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-2">
      {/* Media grid */}
      {media.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {media.map((item) => (
            <div
              key={item.id}
              className="relative group border-[2px] border-night/30 bg-milk overflow-hidden aspect-square"
            >
              {item.type === "image" ? (
                <button
                  type="button"
                  className="w-full h-full cursor-pointer"
                  onClick={() => setPreviewUrl(item.url)}
                >
                  <img
                    src={item.url}
                    alt={item.filename || "Photo"}
                    className="w-full h-full object-cover"
                  />
                </button>
              ) : (
                <button
                  type="button"
                  className="w-full h-full cursor-pointer relative"
                  onClick={() => setPreviewUrl(item.url)}
                >
                  <video
                    src={item.url}
                    className="w-full h-full object-cover"
                    muted
                    preload="metadata"
                  />
                  {/* Video play overlay */}
                  <div className="absolute inset-0 flex items-center justify-center bg-night/30">
                    <div className="w-8 h-8 border-[2px] border-white bg-night/60 flex items-center justify-center">
                      <Film className="w-4 h-4 text-white" />
                    </div>
                  </div>
                </button>
              )}
              {/* Delete button */}
              <button
                type="button"
                onClick={() => handleDelete(item.id)}
                disabled={deletingId === item.id}
                className="absolute top-1 right-1 w-5 h-5 bg-jam border-[2px] border-night flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:bg-destructive"
              >
                {deletingId === item.id ? (
                  <Loader2 className="w-2.5 h-2.5 text-white animate-spin" />
                ) : (
                  <X className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                )}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload button */}
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="flex items-center gap-1.5 px-2 py-1 border-[2px] border-dashed border-night/30 text-rock hover:border-night hover:text-night hover:bg-mist/30 transition-colors cursor-pointer w-full justify-center"
      >
        {uploading ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : (
          <Plus className="w-3 h-3" />
        )}
        <Camera className="w-3 h-3" />
        <span className="font-[family-name:var(--font-silkscreen)] text-[9px] uppercase tracking-wider">
          {uploading ? "Uploading..." : "Add Photo / Video"}
        </span>
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Fullscreen preview overlay */}
      {previewUrl && (
        <div
          className="fixed inset-0 z-50 bg-night/80 flex items-center justify-center p-6"
          onClick={() => setPreviewUrl(null)}
        >
          <button
            type="button"
            onClick={() => setPreviewUrl(null)}
            className="absolute top-4 right-4 w-8 h-8 bg-jam border-[3px] border-night pixel-shadow flex items-center justify-center cursor-pointer hover:translate-[2px] hover:shadow-[2px_2px_0px_#3D5A80] active:translate-[4px] active:shadow-none transition-transform"
          >
            <X className="w-4 h-4 text-white" strokeWidth={3} />
          </button>
          <div
            className="max-w-4xl max-h-[85vh] border-[3px] border-night pixel-shadow bg-white overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {previewUrl.match(/\.(mp4|mov|webm|avi|mkv)(\?|$)/i) ? (
              <video
                src={previewUrl}
                controls
                autoPlay
                className="max-w-full max-h-[85vh]"
              />
            ) : (
              <img
                src={previewUrl}
                alt="Preview"
                className="max-w-full max-h-[85vh] object-contain"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
