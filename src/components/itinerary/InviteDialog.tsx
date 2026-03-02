"use client";

import { useState } from "react";
import { useCollaborators } from "@/hooks/useCollaborators";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserPlus, X, ChevronDown, Crown, Loader2, Clock } from "lucide-react";

interface InviteDialogProps {
  tripId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InviteDialog({ tripId, open, onOpenChange }: InviteDialogProps) {
  const {
    owner,
    collaborators,
    pendingInvites,
    loading,
    inviteCollaborator,
    updateRole,
    removeCollaborator,
  } = useCollaborators(tripId);

  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"editor" | "viewer">("editor");
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  const handleInvite = async () => {
    if (!email.trim()) return;
    setInviting(true);
    setInviteError(null);
    const success = await inviteCollaborator(email.trim(), role);
    if (success) {
      setEmail("");
    } else {
      setInviteError("Failed to send invite. User may already be invited.");
    }
    setInviting(false);
  };

  const roleColors: Record<string, string> = {
    editor: "bg-grass text-night",
    viewer: "bg-sky text-night",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm">Manage Collaborators</DialogTitle>
        </DialogHeader>

        {/* Invite form */}
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleInvite()}
              className="flex-1"
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="shrink-0 gap-1">
                  {role === "editor" ? "Editor" : "Viewer"}
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setRole("editor")}>
                  Editor — can edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setRole("viewer")}>
                  Viewer — view only
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              size="sm"
              onClick={handleInvite}
              disabled={!email.trim() || inviting}
              className="shrink-0"
            >
              {inviting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <UserPlus className="w-4 h-4" />
              )}
            </Button>
          </div>
          {inviteError && (
            <p className="text-xs text-destructive">{inviteError}</p>
          )}
        </div>

        {/* Collaborator list */}
        <div className="space-y-2 mt-2">
          {loading ? (
            <p className="text-xs text-rock text-center py-4">Loading...</p>
          ) : (
            <>
              {/* Owner */}
              {owner && (
                <div className="flex items-center gap-3 p-2 border-[2px] border-night/10 bg-milk">
                  {owner.avatar_url ? (
                    <img
                      src={owner.avatar_url}
                      alt=""
                      className="w-7 h-7 border-[2px] border-night object-cover"
                    />
                  ) : (
                    <div className="w-7 h-7 border-[2px] border-night bg-mist flex items-center justify-center text-[10px] font-bold text-night">
                      {(owner.display_name || owner.email)[0]?.toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-night truncate">
                      {owner.display_name || owner.email}
                    </p>
                    <p className="text-[10px] text-rock truncate">{owner.email}</p>
                  </div>
                  <Badge className="bg-jam text-white text-[9px] shrink-0">
                    <Crown className="w-2.5 h-2.5 mr-0.5" />
                    Owner
                  </Badge>
                </div>
              )}

              {/* Collaborators */}
              {collaborators.map((collab) => (
                <div key={collab.id} className="flex items-center gap-3 p-2 border-[2px] border-night/10">
                  {collab.user?.avatar_url ? (
                    <img
                      src={collab.user.avatar_url}
                      alt=""
                      className="w-7 h-7 border-[2px] border-night object-cover"
                    />
                  ) : (
                    <div className="w-7 h-7 border-[2px] border-night bg-mist flex items-center justify-center text-[10px] font-bold text-night">
                      {(collab.user?.display_name || collab.invited_email || "?")[0]?.toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-night truncate">
                      {collab.user?.display_name || collab.invited_email}
                    </p>
                    <p className="text-[10px] text-rock truncate">
                      {collab.user?.email || collab.invited_email}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {!collab.accepted_at && (
                      <Badge className="bg-rock/20 text-rock text-[9px]">
                        <Clock className="w-2.5 h-2.5 mr-0.5" />
                        Pending
                      </Badge>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px] gap-1">
                          <Badge className={`${roleColors[collab.role]} text-[9px]`}>
                            {collab.role}
                          </Badge>
                          <ChevronDown className="w-2.5 h-2.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => updateRole(collab.user_id, "editor")}>
                          Editor
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateRole(collab.user_id, "viewer")}>
                          Viewer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => removeCollaborator(collab.user_id)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}

              {/* Pending invites (for users without accounts) */}
              {pendingInvites.map((invite) => (
                <div key={invite.id} className="flex items-center gap-3 p-2 border-[2px] border-night/10 border-dashed">
                  <div className="w-7 h-7 border-[2px] border-night border-dashed bg-milk flex items-center justify-center text-[10px] text-rock">
                    ?
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-rock truncate">{invite.email}</p>
                    <p className="text-[10px] text-rock/60">Not yet signed up</p>
                  </div>
                  <Badge className={`${roleColors[invite.role]} text-[9px] shrink-0`}>
                    {invite.role}
                  </Badge>
                </div>
              ))}

              {collaborators.length === 0 && pendingInvites.length === 0 && (
                <p className="text-xs text-rock text-center py-4">
                  No collaborators yet. Invite someone by email!
                </p>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
