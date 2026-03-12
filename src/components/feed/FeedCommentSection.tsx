"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PixelWindow } from "@/components/pixel/PixelWindow";
import { FeedCommentItem } from "./FeedCommentItem";
import { Send } from "lucide-react";
import type { FeedComment } from "@/types/feed";

interface FeedCommentSectionProps {
  comments: FeedComment[];
  loading: boolean;
  currentUserId: string | null;
  publishedAuthorId: string;
  onAddComment: (body: string) => Promise<FeedComment | null>;
  onDeleteComment: (commentId: string) => void;
  onEditComment: (commentId: string, body: string) => void;
}

export function FeedCommentSection({
  comments,
  loading,
  currentUserId,
  publishedAuthorId,
  onAddComment,
  onDeleteComment,
  onEditComment,
}: FeedCommentSectionProps) {
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!newComment.trim() || submitting) return;
    setSubmitting(true);
    const result = await onAddComment(newComment.trim());
    if (result) setNewComment("");
    setSubmitting(false);
  };

  return (
    <PixelWindow title={`Comments (${comments.length})`} variant="mist">
      {/* Add comment */}
      {currentUserId && (
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            className="flex-1 text-sm bg-white border-[3px] border-night px-3 py-2 font-[family-name:var(--font-roboto-mono)] placeholder:text-rock/50"
          />
          <Button
            size="sm"
            className="bg-jam text-white"
            onClick={handleSubmit}
            disabled={!newComment.trim() || submitting}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Comments list */}
      {loading ? (
        <p className="text-xs text-rock font-[family-name:var(--font-silkscreen)] text-center py-4">
          Loading comments...
        </p>
      ) : comments.length === 0 ? (
        <p className="text-xs text-rock font-[family-name:var(--font-silkscreen)] text-center py-4">
          No comments yet. Be the first!
        </p>
      ) : (
        <div className="divide-y divide-night/10">
          {comments.map((comment) => (
            <FeedCommentItem
              key={comment.id}
              comment={comment}
              currentUserId={currentUserId}
              publishedAuthorId={publishedAuthorId}
              onDelete={onDeleteComment}
              onEdit={onEditComment}
            />
          ))}
        </div>
      )}
    </PixelWindow>
  );
}
