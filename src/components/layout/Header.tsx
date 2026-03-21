"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Menu, Ruler, Sparkles } from "lucide-react";
import { SignedIn, SignedOut, UserButton, SignInButton } from "@clerk/nextjs";
import { useDistanceUnit } from "@/context/DistanceUnitContext";
import { useGenerationContext } from "@/context/GenerationContext";

interface HeaderProps {
  onToggleSidebar: () => void;
}

export function Header({ onToggleSidebar }: HeaderProps) {
  const { unit, toggleUnit } = useDistanceUnit();
  const { generating, tripId: genTripId } = useGenerationContext();

  return (
    <header className="h-16 border-b-[3px] border-night bg-white flex items-center px-4 gap-4">
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={onToggleSidebar}
      >
        <Menu className="w-5 h-5" />
      </Button>
      <Link
        href="/dashboard"
        className="flex items-center gap-3 hover:opacity-90 transition-opacity"
        aria-label="Go to dashboard"
      >
        <div className="w-8 h-8 bg-grass border-[3px] border-night pixel-shadow-sm flex items-center justify-center">
          <span className="font-[family-name:var(--font-press-start)] text-white text-[8px]">R</span>
        </div>
        <h1 className="font-[family-name:var(--font-press-start)] text-night text-sm tracking-wider">
          ROAM
        </h1>
      </Link>
      <div className="flex-1" />
      {generating && genTripId && (
        <Link
          href={`/trip/${genTripId}/generate`}
          className="flex items-center gap-1.5 px-2 py-1 border-[2px] border-grass bg-grass/10 text-xs font-[family-name:var(--font-silkscreen)] text-night animate-pulse"
        >
          <Sparkles className="w-3.5 h-3.5 text-grass" />
          Generating...
        </Link>
      )}
      <SignedIn>
        <UserButton
          appearance={{
            elements: {
              avatarBox: "w-8 h-8 border-[2px] border-night",
              userButtonTrigger: "border-[2px] border-night",
            },
          }}
        >
          <UserButton.MenuItems>
            <UserButton.Action
              label={`Distance: ${unit === "mi" ? "Miles" : "Kilometers"}`}
              labelIcon={<Ruler className="w-4 h-4" />}
              onClick={toggleUnit}
            />
          </UserButton.MenuItems>
        </UserButton>
      </SignedIn>
      <SignedOut>
        <SignInButton>
          <Button size="sm" className="bg-jam text-white">
            Sign In
          </Button>
        </SignInButton>
      </SignedOut>
    </header>
  );
}
