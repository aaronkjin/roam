import { auth, currentUser } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase/server";
import type { CollaboratorRole } from "@/types/collaborator";

const ROLE_HIERARCHY: Record<CollaboratorRole, number> = {
  viewer: 0,
  editor: 1,
  owner: 2,
};

/**
 * Get authenticated user ID from Clerk session.
 * Returns { userId } or null if unauthenticated.
 */
export async function requireAuth(): Promise<{ userId: string } | null> {
  const { userId } = await auth();
  if (!userId) return null;
  return { userId };
}

/**
 * Sync Clerk user data to local users table.
 * Also resolves any pending invites for this user's email.
 */
export async function ensureUserSynced(userId: string): Promise<void> {
  const user = await currentUser();
  if (!user) return;

  const supabase = await createClient();
  const allEmails = user.emailAddresses.map(e => e.emailAddress).filter(Boolean);
  const email = allEmails[0];
  if (!email) return;

  const displayName = [user.firstName, user.lastName].filter(Boolean).join(" ") || null;

  // Upsert user record
  await supabase.from("users").upsert(
    {
      id: userId,
      email,
      display_name: displayName,
      avatar_url: user.imageUrl || null,
    },
    { onConflict: "id" }
  );

  // Claim orphaned trips (user_id IS NULL) — for pre-auth MVP data
  await supabase
    .from("trips")
    .update({ user_id: userId })
    .is("user_id", null);

  // Resolve pending invites for any of this user's emails
  const { data: pendingInvites } = await supabase
    .from("pending_invites")
    .select("*")
    .in("email", allEmails);

  if (pendingInvites && pendingInvites.length > 0) {
    for (const invite of pendingInvites) {
      // Insert as collaborator (accepted since they now have an account)
      await supabase.from("trip_collaborators").upsert(
        {
          trip_id: invite.trip_id,
          user_id: userId,
          role: invite.role,
          invited_by: invite.invited_by,
          invited_email: invite.email,
          accepted_at: new Date().toISOString(),
        },
        { onConflict: "trip_id,user_id" }
      );
    }

    // Delete resolved pending invites
    await supabase
      .from("pending_invites")
      .delete()
      .in("email", allEmails);
  }

  // Auto-accept any unaccepted collaborator invites for this user
  await supabase
    .from("trip_collaborators")
    .update({ accepted_at: new Date().toISOString() })
    .eq("user_id", userId)
    .is("accepted_at", null);
}

/**
 * Check if a user has access to a trip with at least the given minimum role.
 * Returns { role } or null if forbidden.
 */
export async function requireTripAccess(
  userId: string,
  tripId: string,
  minimumRole: CollaboratorRole = "viewer"
): Promise<{ role: CollaboratorRole } | null> {
  const supabase = await createClient();

  // Check if user is the trip owner
  const { data: trip } = await supabase
    .from("trips")
    .select("user_id")
    .eq("id", tripId)
    .single();

  if (!trip) return null;

  if (trip.user_id === userId) {
    return { role: "owner" };
  }

  // Check collaborator table
  const { data: collab } = await supabase
    .from("trip_collaborators")
    .select("role, accepted_at")
    .eq("trip_id", tripId)
    .eq("user_id", userId)
    .single();

  if (!collab || !collab.accepted_at) return null;

  const userRole = collab.role as CollaboratorRole;
  if (ROLE_HIERARCHY[userRole] < ROLE_HIERARCHY[minimumRole]) {
    return null;
  }

  return { role: userRole };
}

/**
 * Resolve a child entity back to its trip_id.
 */
export async function resolveTripId(
  entityType: "inspo" | "day" | "block" | "media",
  entityId: string
): Promise<string | null> {
  const supabase = await createClient();

  if (entityType === "inspo") {
    const { data } = await supabase
      .from("inspo_items")
      .select("trip_id")
      .eq("id", entityId)
      .single();
    return data?.trip_id || null;
  }

  if (entityType === "day") {
    const { data } = await supabase
      .from("itinerary_days")
      .select("trip_id")
      .eq("id", entityId)
      .single();
    return data?.trip_id || null;
  }

  if (entityType === "block") {
    const { data } = await supabase
      .from("itinerary_blocks")
      .select("day_id")
      .eq("id", entityId)
      .single();
    if (!data?.day_id) return null;

    const { data: day } = await supabase
      .from("itinerary_days")
      .select("trip_id")
      .eq("id", data.day_id)
      .single();
    return day?.trip_id || null;
  }

  if (entityType === "media") {
    const { data } = await supabase
      .from("block_media")
      .select("block_id")
      .eq("id", entityId)
      .single();
    if (!data?.block_id) return null;

    return resolveTripId("block", data.block_id);
  }

  return null;
}
