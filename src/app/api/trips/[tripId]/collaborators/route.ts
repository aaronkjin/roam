import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth, requireTripAccess } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  const authResult = await requireAuth();
  if (!authResult) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { userId } = authResult;

  const { tripId } = await params;

  const access = await requireTripAccess(userId, tripId, "viewer");
  if (!access) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = await createClient();

  // Get trip owner info
  const { data: trip, error: tripError } = await supabase
    .from("trips")
    .select("user_id")
    .eq("id", tripId)
    .single();

  if (tripError || !trip) {
    return NextResponse.json({ error: "Trip not found" }, { status: 404 });
  }

  let owner = null;
  if (trip.user_id) {
    const { data: ownerData } = await supabase
      .from("users")
      .select("id, email, display_name, avatar_url")
      .eq("id", trip.user_id)
      .single();
    owner = ownerData || null;
  }

  // Get collaborators with user info
  const { data: collaborators, error: collabError } = await supabase
    .from("trip_collaborators")
    .select("*, user:users!trip_collaborators_user_id_fkey(id, email, display_name, avatar_url)")
    .eq("trip_id", tripId);

  if (collabError) {
    console.error("[GET /api/trips/[tripId]/collaborators]", collabError.message);
    return NextResponse.json({ error: collabError.message }, { status: 500 });
  }

  // Get pending invites
  const { data: pendingInvites, error: inviteError } = await supabase
    .from("pending_invites")
    .select("*")
    .eq("trip_id", tripId);

  if (inviteError) {
    console.error("[GET /api/trips/[tripId]/collaborators] pendingInvites", inviteError.message);
    return NextResponse.json({ error: inviteError.message }, { status: 500 });
  }

  return NextResponse.json({
    owner,
    collaborators: collaborators || [],
    pendingInvites: pendingInvites || [],
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  const authResult = await requireAuth();
  if (!authResult) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { userId } = authResult;

  const { tripId } = await params;

  const access = await requireTripAccess(userId, tripId, "owner");
  if (!access) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { email, role } = body;

  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "email is required" }, { status: 400 });
  }

  if (!role || !["editor", "viewer"].includes(role)) {
    return NextResponse.json(
      { error: "role must be 'editor' or 'viewer'" },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  // Check if the trip owner's email matches
  const { data: trip } = await supabase
    .from("trips")
    .select("user_id")
    .eq("id", tripId)
    .single();

  if (trip?.user_id) {
    const { data: ownerUser } = await supabase
      .from("users")
      .select("email")
      .eq("id", trip.user_id)
      .single();

    if (ownerUser?.email === email) {
      return NextResponse.json(
        { error: "This user is the trip owner" },
        { status: 409 }
      );
    }
  }

  // Check if email belongs to an existing user
  const { data: existingUser } = await supabase
    .from("users")
    .select("id, email, display_name, avatar_url")
    .eq("email", email)
    .single();

  if (existingUser) {
    // Check if already a collaborator
    const { data: existingCollab } = await supabase
      .from("trip_collaborators")
      .select("id")
      .eq("trip_id", tripId)
      .eq("user_id", existingUser.id)
      .single();

    if (existingCollab) {
      return NextResponse.json(
        { error: "User is already a collaborator" },
        { status: 409 }
      );
    }

    // Clean up any stale pending invites for this email+trip
    await supabase
      .from("pending_invites")
      .delete()
      .eq("trip_id", tripId)
      .eq("email", email);

    // Insert as collaborator (auto-accepted for existing users)
    const { data: newCollab, error: insertError } = await supabase
      .from("trip_collaborators")
      .insert({
        trip_id: tripId,
        user_id: existingUser.id,
        role,
        invited_by: userId,
        invited_email: email,
        accepted_at: new Date().toISOString(),
      })
      .select("*, user:users!trip_collaborators_user_id_fkey(id, email, display_name, avatar_url)")
      .single();

    if (insertError) {
      console.error("[POST /api/trips/[tripId]/collaborators]", insertError.message);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json(newCollab, { status: 201 });
  } else {
    // User doesn't exist - create pending invite
    // Check if already has pending invite
    const { data: existingInvite } = await supabase
      .from("pending_invites")
      .select("id")
      .eq("trip_id", tripId)
      .eq("email", email)
      .single();

    if (existingInvite) {
      return NextResponse.json(
        { error: "Invite already pending for this email" },
        { status: 409 }
      );
    }

    const { data: newInvite, error: inviteError } = await supabase
      .from("pending_invites")
      .insert({
        trip_id: tripId,
        email,
        role,
        invited_by: userId,
      })
      .select()
      .single();

    if (inviteError) {
      console.error("[POST /api/trips/[tripId]/collaborators] pendingInvite", inviteError.message);
      return NextResponse.json({ error: inviteError.message }, { status: 500 });
    }

    return NextResponse.json({ ...newInvite, pending: true }, { status: 201 });
  }
}
