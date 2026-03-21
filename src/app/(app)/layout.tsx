import { AppShell } from "@/components/layout/AppShell";
import { TripsProvider } from "@/context/TripsContext";
import { DistanceUnitProvider } from "@/context/DistanceUnitContext";
import { GenerationProvider } from "@/context/GenerationContext";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <DistanceUnitProvider>
      <TripsProvider>
        <GenerationProvider>
          <AppShell>{children}</AppShell>
        </GenerationProvider>
      </TripsProvider>
    </DistanceUnitProvider>
  );
}
