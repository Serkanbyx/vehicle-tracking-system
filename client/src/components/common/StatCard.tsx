import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui";
import { cn } from "@/lib/cn";

const colorMap = {
  brand: "text-brand-600",
  success: "text-emerald-600",
  warning: "text-amber-500",
  danger: "text-red-500",
  neutral: "text-gray-500",
} as const;

interface StatCardProps {
  label: string;
  value: number | string;
  icon?: ReactNode;
  color?: keyof typeof colorMap;
}

export function StatCard({ label, value, icon, color = "brand" }: StatCardProps) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        {icon && <div className={cn("shrink-0", colorMap[color])}>{icon}</div>}
        <div className="min-w-0">
          <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
          <p className={cn("text-2xl font-bold", colorMap[color])}>{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
