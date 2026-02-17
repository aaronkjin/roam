import { AppShell } from "@/components/layout/AppShell";
import { TripsProvider } from "@/context/TripsContext";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <TripsProvider>
      <AppShell>{children}</AppShell>
    </TripsProvider>
  );
}
