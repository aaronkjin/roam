"use client";

import { useState, useEffect, useCallback } from "react";
import type { FeedComment } from "@/types/feed";

export function useFeedComments(slug: string) {
  const [comments, setComments] = useState<FeedComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchComments = useCallback(async () => {
    if (!slug) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/feed/${slug}/comments`);
      if (!res.ok) throw new Error("Failed to fetch comments");
      const data = await res.json();
      setComments(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const addComment = useCallback(
    async (body: string) => {
      try {
        const res = await fetch(`/api/feed/${slug}/comments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ body }),
        });
        if (!res.ok) throw new Error("Failed to add comment");
        const comment = await res.json();
        setComments((prev) => [...prev, comment]);
        return comment;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        return null;
      }
    },
    [slug]
  );

  const deleteComment = useCallback(
    async (commentId: string) => {
      // Optimistic removal
      setComments((prev) => prev.filter((c) => c.id !== commentId));

      try {
        const res = await fetch(`/api/feed/${slug}/comments/${commentId}`, {
          method: "DELETE",
        });
        if (!res.ok) throw new Error("Failed to delete comment");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        fetchComments(); // Revert
      }
    },
    [slug, fetchComments]
  );

  const editComment = useCallback(
    async (commentId: string, body: string) => {
      try {
        const res = await fetch(`/api/feed/${slug}/comments/${commentId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ body }),
        });
        if (!res.ok) throw new Error("Failed to edit comment");
        const updated = await res.json();
        setComments((prev) =>
          prev.map((c) => (c.id === commentId ? updated : c))
        );
        return updated;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        return null;
      }
    },
    [slug]
  );

  return {
    comments,
    loading,
    error,
    addComment,
    deleteComment,
    editComment,
    refetch: fetchComments,
  };
}
