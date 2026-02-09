import { Skeleton } from "@/components/ui/skeleton";

export default function GenerateLoading() {
  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <Skeleton className="h-7 w-48" />
      <Skeleton className="h-24" />
      <div className="flex gap-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-10 w-20" />
      </div>
    </div>
  );
}
