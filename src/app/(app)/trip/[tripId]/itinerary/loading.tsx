import { Skeleton } from "@/components/ui/skeleton";

export default function ItineraryLoading() {
  return (
    <div className="p-6 space-y-4 max-w-3xl mx-auto">
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-64" />
      ))}
    </div>
  );
}
