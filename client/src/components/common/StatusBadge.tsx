import { Car, Moon, Wifi } from "lucide-react";
import type { VehicleStatus } from "@/api/types";
import { Badge } from "@/components/ui";
import { STATUS_LABELS } from "@/utils/constants";

const config: Record<
  VehicleStatus,
  { icon: typeof Car; variant: "success" | "warning" | "secondary" }
> = {
  moving: { icon: Car, variant: "success" },
  idle: { icon: Moon, variant: "warning" },
  offline: { icon: Wifi, variant: "secondary" },
};

interface StatusBadgeProps {
  status: VehicleStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const { icon: Icon, variant } = config[status] ?? config.offline;
  return (
    <Badge variant={variant} className={className}>
      <Icon className="mr-1 h-3 w-3" />
      {STATUS_LABELS[status]}
    </Badge>
  );
}
