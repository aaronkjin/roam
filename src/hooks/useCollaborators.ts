"use client";

import { useState, useEffect, useCallback } from "react";
import type { TripCollaborator, PendingInvite, UserProfile } from "@/types/collaborator";

interface CollaboratorsState {
  owner: UserProfile | null;
  collaborators: TripCollaborator[];
  pendingInvites: PendingInvite[];
  loading: boolean;
  error: string | null;
}

export function useCollaborators(tripId: string) {
  const [state, setState] = useState<CollaboratorsState>({
    owner: null,
    collaborators: [],
    pendingInvites: [],
    loading: true,
    error: null,
  });

  const fetchCollaborators = useCallback(async () => {
    if (!tripId) return;
    try {
      setState((prev) => ({ ...prev, loading: true }));
      const res = await fetch(`/api/trips/${tripId}/collaborators`);
      if (!res.ok) throw new Error("Failed to fetch collaborators");
      const data = await res.json();
      setState({
        owner: data.owner || null,
        collaborators: data.collaborators || [],
        pendingInvites: data.pendingInvites || [],
        loading: false,
        error: null,
      });
    } catch (err) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : "Unknown error",
      }));
    }
  }, [tripId]);

  useEffect(() => {
    fetchCollaborators();
  }, [fetchCollaborators]);

  const inviteCollaborator = useCallback(
    async (email: string, role: "editor" | "viewer") => {
      try {
        const res = await fetch(`/api/trips/${tripId}/collaborators`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, role }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to invite");
        }
        await fetchCollaborators();
        return true;
      } catch (err) {
        setState((prev) => ({
          ...prev,
          error: err instanceof Error ? err.message : "Unknown error",
        }));
        return false;
      }
    },
    [tripId, fetchCollaborators]
  );

  const updateRole = useCallback(
    async (userId: string, role: "editor" | "viewer") => {
      try {
        const res = await fetch(`/api/trips/${tripId}/collaborators/${userId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role }),
        });
        if (!res.ok) throw new Error("Failed to update role");
        await fetchCollaborators();
        return true;
      } catch (err) {
        setState((prev) => ({
          ...prev,
          error: err instanceof Error ? err.message : "Unknown error",
        }));
        return false;
      }
    },
    [tripId, fetchCollaborators]
  );

  const removeCollaborator = useCallback(
    async (userId: string) => {
      try {
        const res = await fetch(`/api/trips/${tripId}/collaborators/${userId}`, {
          method: "DELETE",
        });
        if (!res.ok) throw new Error("Failed to remove collaborator");
        await fetchCollaborators();
        return true;
      } catch (err) {
        setState((prev) => ({
          ...prev,
          error: err instanceof Error ? err.message : "Unknown error",
        }));
        return false;
      }
    },
    [tripId, fetchCollaborators]
  );

  const deletePendingInvite = useCallback(
    async (inviteId: string) => {
      try {
        const res = await fetch(`/api/trips/${tripId}/collaborators/pending/${inviteId}`, {
          method: "DELETE",
        });
        if (!res.ok) throw new Error("Failed to delete invite");
        await fetchCollaborators();
        return true;
      } catch (err) {
        setState((prev) => ({
          ...prev,
          error: err instanceof Error ? err.message : "Unknown error",
        }));
        return false;
      }
    },
    [tripId, fetchCollaborators]
  );

  return {
    ...state,
    fetchCollaborators,
    inviteCollaborator,
    updateRole,
    removeCollaborator,
    deletePendingInvite,
  };
}
