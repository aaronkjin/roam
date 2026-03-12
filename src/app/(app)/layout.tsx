import { AppShell } from "@/components/layout/AppShell";
import { TripsProvider } from "@/context/TripsContext";
import { DistanceUnitProvider } from "@/context/DistanceUnitContext";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <DistanceUnitProvider>
      <TripsProvider>
        <AppShell>{children}</AppShell>
      </TripsProvider>
    </DistanceUnitProvider>
  );
}
