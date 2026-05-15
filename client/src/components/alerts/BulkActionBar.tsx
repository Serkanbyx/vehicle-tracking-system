import { CheckCheck } from "lucide-react";
import { Button } from "@/components/ui";

interface BulkActionBarProps {
  selectedIds: Set<string>;
  onAcknowledge: () => void;
  loading?: boolean;
}

export function BulkActionBar({ selectedIds, onAcknowledge, loading }: BulkActionBarProps) {
  if (selectedIds.size === 0) return null;

  return (
    <div className="flex items-center gap-3 rounded-md border border-brand-200 bg-brand-50 px-4 py-2 dark:border-brand-700 dark:bg-brand-900/10">
      <span className="text-sm font-medium">{selectedIds.size} uyarı seçildi</span>
      <Button size="sm" onClick={onAcknowledge} disabled={loading}>
        <CheckCheck className="mr-1.5 h-4 w-4" />
        Seçilenleri Onayla
      </Button>
    </div>
  );
}
