"use client";

import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

interface HeaderProps {
  onToggleSidebar: () => void;
}

export function Header({ onToggleSidebar }: HeaderProps) {
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
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-jam border-[3px] border-night pixel-shadow-sm flex items-center justify-center">
          <span className="font-[family-name:var(--font-press-start)] text-white text-[8px]">R</span>
        </div>
        <h1 className="font-[family-name:var(--font-press-start)] text-night text-sm tracking-wider">
          ROAM
        </h1>
      </div>
      <div className="flex-1" />
      <div className="hidden sm:flex items-center gap-2 text-xs text-rock font-[family-name:var(--font-silkscreen)]">
        Travel Planning for Adventurers
      </div>
    </header>
  );
}
