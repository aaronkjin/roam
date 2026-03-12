"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, Pencil, Check, X } from "lucide-react";
import type { FeedComment } from "@/types/feed";

interface FeedCommentItemProps {
  comment: FeedComment;
  currentUserId: string | null;
  publishedAuthorId: string;
  onDelete: (commentId: string) => void;
  onEdit: (commentId: string, body: string) => void;
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);

  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function FeedCommentItem({
  comment,
  currentUserId,
  publishedAuthorId,
  onDelete,
  onEdit,
}: FeedCommentItemProps) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(comment.body);

  const canDelete =
    currentUserId === comment.user_id || currentUserId === publishedAuthorId;
  const canEdit = currentUserId === comment.user_id;

  const handleSave = () => {
    if (editValue.trim() && editValue.trim() !== comment.body) {
      onEdit(comment.id, editValue.trim());
    }
    setEditing(false);
  };

  return (
    <div className="flex gap-3 py-3">
      {/* Avatar */}
      {comment.author?.avatar_url ? (
        <img
          src={comment.author.avatar_url}
          alt={comment.author.display_name || "User"}
          className="w-8 h-8 border-[2px] border-night shrink-0"
        />
      ) : (
        <div className="w-8 h-8 bg-sky border-[2px] border-night flex items-center justify-center text-[10px] font-[family-name:var(--font-silkscreen)] text-night shrink-0">
          {(comment.author?.display_name || comment.author?.email)?.[0]?.toUpperCase() || "?"}
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-night truncate">
            {comment.author?.display_name || comment.author?.email || "Unknown"}
          </span>
          <span className="text-[10px] text-rock font-[family-name:var(--font-silkscreen)]">
            {timeAgo(comment.created_at)}
          </span>
        </div>

        {editing ? (
          <div className="mt-1 flex items-center gap-1">
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="flex-1 text-sm text-night bg-mist/30 border-[2px] border-night/20 px-2 py-1 font-[family-name:var(--font-roboto-mono)]"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
                if (e.key === "Escape") setEditing(false);
              }}
              autoFocus
            />
            <button onClick={handleSave} className="text-moss hover:text-night cursor-pointer">
              <Check className="w-4 h-4" />
            </button>
            <button onClick={() => setEditing(false)} className="text-rock hover:text-night cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <p className="text-sm text-night/80 mt-0.5 font-[family-name:var(--font-roboto-mono)]">
            {comment.body}
          </p>
        )}

        {/* Actions */}
        {!editing && (canEdit || canDelete) && (
          <div className="flex items-center gap-1 mt-1">
            {canEdit && (
              <button
                onClick={() => {
                  setEditValue(comment.body);
                  setEditing(true);
                }}
                className="text-rock hover:text-night transition-colors cursor-pointer"
              >
                <Pencil className="w-3 h-3" />
              </button>
            )}
            {canDelete && (
              <button
                onClick={() => onDelete(comment.id)}
                className="text-rock hover:text-jam transition-colors cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
