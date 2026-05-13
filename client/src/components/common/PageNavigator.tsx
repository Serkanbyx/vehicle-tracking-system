import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui";

interface PageNavigatorProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function PageNavigator({ page, totalPages, onPageChange }: PageNavigatorProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2">
      <Button
        variant="outline"
        size="sm"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="text-sm text-gray-500">
        {page} / {totalPages}
      </span>
      <Button
        variant="outline"
        size="sm"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
