import { Shield } from "lucide-react";
import { Badge } from "@/components/ui";
import type { UserRole } from "@/api/types";
import { ROLE_LABELS } from "@/utils/constants";

const ROLE_VARIANTS: Record<UserRole, "danger" | "default" | "secondary"> = {
  admin: "danger",
  manager: "default",
  viewer: "secondary",
};

interface RoleBadgeProps {
  role: UserRole;
  className?: string;
}

export function RoleBadge({ role, className }: RoleBadgeProps) {
  return (
    <Badge variant={ROLE_VARIANTS[role]} className={className}>
      <Shield className="mr-1 h-3 w-3" />
      {ROLE_LABELS[role]}
    </Badge>
  );
}
