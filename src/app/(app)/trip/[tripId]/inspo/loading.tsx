import { Skeleton } from "@/components/ui/skeleton";

export default function InspoLoading() {
  return (
    <div className="p-6 space-y-4">
      <div className="flex gap-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-8 w-20" />
        ))}
      </div>
      <div className="columns-1 sm:columns-2 lg:columns-3 gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-48 mb-4" />
        ))}
      </div>
    </div>
  );
}
