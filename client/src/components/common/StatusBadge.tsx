import { Badge } from "@/components/ui";
import type { VehicleStatus } from "@/api/types";

const config: Record<VehicleStatus, { label: string; variant: "success" | "warning" | "secondary" }> = {
  moving: { label: "Hareket", variant: "success" },
  idle: { label: "Boşta", variant: "warning" },
  offline: { label: "Çevrimdışı", variant: "secondary" },
};

interface StatusBadgeProps {
  status: VehicleStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const { label, variant } = config[status] ?? config.offline;
  return (
    <Badge variant={variant} className={className}>
      {label}
    </Badge>
  );
}
