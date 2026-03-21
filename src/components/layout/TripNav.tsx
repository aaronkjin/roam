"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { Sparkles, Lightbulb, PenTool, ClipboardCheck, Users, Lock } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { InviteDialog } from "@/components/itinerary/InviteDialog";
import { useTrips } from "@/context/TripsContext";
import type { TripWithRole } from "@/types/trip";

interface TripNavProps {
  tripId: string;
}

const tabs = [
  { label: "Inspo", href: "inspo", icon: Lightbulb },
  { label: "Generate", href: "generate", icon: Sparkles },
  { label: "Itinerary", href: "itinerary", icon: PenTool },
  { label: "Review", href: "review", icon: ClipboardCheck },
];

export function TripNav({ tripId }: TripNavProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { trips } = useTrips();
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteQueryDismissed, setInviteQueryDismissed] = useState(false);
  const trip = trips.find((item) => item.id === tripId);
  const userRole = trip && "userRole" in trip ? (trip as TripWithRole).userRole : "owner";
  const canManageCollaborators = userRole === "owner";
  const inviteRequested = canManageCollaborators && searchParams.get("invite") === "1";
  const inviteOpen = inviteRequested ? !inviteQueryDismissed : inviteDialogOpen;

  return (
    <>
      <nav className="flex items-stretch justify-between gap-3 border-b-[3px] border-night bg-milk overflow-x-auto">
        <div className="flex min-w-0 shrink-0">
          {tabs.map((tab, i) => {
            const href = `/trip/${tripId}/${tab.href}`;
            const isActive = pathname.startsWith(href);
            const Icon = tab.icon;

            return (
              <Link
                key={tab.href}
                href={href}
                className={cn(
                  "flex items-center gap-2 px-3 sm:px-6 py-3 font-[family-name:var(--font-silkscreen)] text-sm uppercase tracking-wider transition-colors border-b-[3px] -mb-[3px]",
                  i > 0 && "border-l-[3px] border-l-night",
                  i === tabs.length - 1 && "border-r-[3px] border-r-night",
                  isActive
                    ? "bg-sky text-white border-b-night"
                    : "text-rock hover:text-night hover:bg-sky/20 border-b-transparent"
                )}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
                {tab.href === "generate" && userRole !== "owner" && (
                  <Lock className="w-3 h-3 text-rock/60" />
                )}
                <span
                  className={cn(
                    "w-5 h-5 items-center justify-center text-[10px] border-[2px] ml-1 hidden sm:flex",
                    isActive
                      ? "border-white bg-white/20 text-white"
                      : "border-night/30 text-rock"
                  )}
                >
                  {i + 1}
                </span>
              </Link>
            );
          })}
        </div>

        {canManageCollaborators && (
          <div className="flex items-center pr-4">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => setInviteDialogOpen(true)}
            >
              <Users className="w-3.5 h-3.5" />
              Collaborators
            </Button>
          </div>
        )}
      </nav>

      {canManageCollaborators && (
        <InviteDialog
          tripId={tripId}
          open={inviteOpen}
          onOpenChange={(open) => {
            if (!open && inviteRequested) {
              setInviteQueryDismissed(true);
              return;
            }
            setInviteDialogOpen(open);
          }}
        />
      )}
    </>
  );
}
