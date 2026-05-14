import { Card, CardContent, Skeleton } from "@/components/ui";

export function VehicleCardSkeleton() {
  return (
    <Card>
      <CardContent className="flex gap-4 p-4">
        <Skeleton className="h-16 w-16 shrink-0 rounded-md" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-5 w-14 rounded-full" />
          </div>
          <Skeleton className="h-4 w-40" />
          <div className="flex gap-1">
            <Skeleton className="h-4 w-12 rounded-full" />
            <Skeleton className="h-4 w-12 rounded-full" />
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <Skeleton className="h-8 w-8 rounded-md" />
          <Skeleton className="h-8 w-8 rounded-md" />
        </div>
      </CardContent>
    </Card>
  );
}

interface VehicleGridSkeletonProps {
  count?: number;
}

export function VehicleGridSkeleton({ count = 6 }: VehicleGridSkeletonProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <VehicleCardSkeleton key={`vs-${i.toString()}`} />
      ))}
    </div>
  );
}
