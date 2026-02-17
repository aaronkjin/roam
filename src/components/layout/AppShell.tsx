"use client";

import { useState, useCallback } from "react";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useTrips } from "@/context/TripsContext";
import { CreateTripModal } from "@/components/dashboard/CreateTripModal";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const { trips } = useTrips();

  const handleCreateTrip = useCallback(() => {
    setCreateModalOpen(true);
  }, []);

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex-1 flex overflow-hidden">
        {/* Desktop sidebar */}
        <div className="hidden md:block">
          <Sidebar trips={trips} onCreateTrip={handleCreateTrip} />
        </div>

        {/* Mobile sidebar sheet */}
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent side="left" className="p-0 w-64">
            <Sidebar trips={trips} onCreateTrip={handleCreateTrip} />
          </SheetContent>
        </Sheet>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto bg-milk">
          {children}
        </main>
      </div>

      <CreateTripModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
      />
    </div>
  );
}
