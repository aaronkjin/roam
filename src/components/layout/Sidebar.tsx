"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Map, Plus, Compass, Archive } from "lucide-react";
import type { Trip } from "@/types/trip";

interface SidebarProps {
  trips: Trip[];
  onCreateTrip: () => void;
}

export function Sidebar({ trips, onCreateTrip }: SidebarProps) {
  const pathname = usePathname();

  const activeTrips = trips.filter((t) => t.status !== "archived");
  const archivedTrips = trips.filter((t) => t.status === "archived");

  return (
    <aside className="w-64 h-full bg-milk border-r-[3px] border-night flex flex-col">
      <div className="p-4">
        <Button
          onClick={onCreateTrip}
          className="w-full bg-jam text-white"
          size="sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Trip
        </Button>
      </div>

      <Separator />

      <nav className="flex-1 overflow-y-auto p-2">
        <Link
          href="/dashboard"
          className={cn(
            "flex items-center gap-2 px-3 py-2 text-sm font-[family-name:var(--font-silkscreen)] uppercase tracking-wider transition-colors border-[2px] border-transparent mb-1",
            pathname === "/dashboard"
              ? "bg-mist border-night text-night"
              : "text-rock hover:text-night hover:bg-sky/20"
          )}
        >
          <Compass className="w-4 h-4" />
          Dashboard
        </Link>

        <div className="mt-4 mb-2 px-3">
          <span className="text-[10px] font-[family-name:var(--font-press-start)] text-rock uppercase">
            Trips
          </span>
        </div>

        {activeTrips.map((trip) => {
          const isActive = pathname.startsWith(`/trip/${trip.id}`);
          return (
            <Link
              key={trip.id}
              href={`/trip/${trip.id}`}
              className={cn(
                "flex items-center gap-2 px-3 py-2 text-sm font-[family-name:var(--font-roboto-mono)] transition-colors border-[2px] border-transparent mb-1",
                isActive
                  ? "bg-mist border-night text-night"
                  : "text-rock hover:text-night hover:bg-sky/20"
              )}
            >
              <Map className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{trip.title}</span>
            </Link>
          );
        })}

        {activeTrips.length === 0 && (
          <p className="px-3 py-2 text-xs text-rock font-[family-name:var(--font-silkscreen)]">
            No trips yet. Start exploring!
          </p>
        )}

        {archivedTrips.length > 0 && (
          <>
            <div className="mt-4 mb-2 px-3">
              <span className="text-[10px] font-[family-name:var(--font-press-start)] text-rock uppercase">
                Archived
              </span>
            </div>
            {archivedTrips.map((trip) => (
              <Link
                key={trip.id}
                href={`/trip/${trip.id}`}
                className="flex items-center gap-2 px-3 py-2 text-sm text-rock/60 font-[family-name:var(--font-roboto-mono)] hover:text-rock transition-colors mb-1"
              >
                <Archive className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{trip.title}</span>
              </Link>
            ))}
          </>
        )}
      </nav>
    </aside>
  );
}
