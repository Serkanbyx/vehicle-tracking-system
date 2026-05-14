import { Skeleton } from "@/components/ui";

interface TableRowSkeletonProps {
  columns?: number;
  rows?: number;
}

export function TableRowSkeleton({ columns = 8, rows = 5 }: TableRowSkeletonProps) {
  return (
    <div className="overflow-hidden rounded-md border border-gray-200 dark:border-gray-700">
      <div className="border-b border-gray-200 bg-gray-50 px-3 py-2.5 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex gap-4">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton
              key={`th-${i.toString()}`}
              className="h-4"
              style={{ width: `${Math.max(40, 80 + (i % 3) * 20)}px` }}
            />
          ))}
        </div>
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div
          key={`tr-${r.toString()}`}
          className="flex gap-4 border-b border-gray-100 px-3 py-3 last:border-0 dark:border-gray-800"
        >
          {Array.from({ length: columns }).map((_, c) => (
            <Skeleton
              key={`td-${r.toString()}-${c.toString()}`}
              className="h-4"
              style={{ width: `${Math.max(40, 60 + (c % 4) * 20)}px` }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
