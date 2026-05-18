import { Link } from "@tanstack/react-router";
import { formatDistanceToNow } from "date-fns";
import { Bell } from "lucide-react";
import { useEffect, useState } from "react";
import { dashboardSocket } from "@/api";
import type { Alert, AlertSeverity } from "@/api/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { cn } from "@/lib/cn";

const severityDot: Record<AlertSeverity, string> = {
  info: "bg-blue-500",
  warning: "bg-amber-500",
  critical: "bg-red-500",
};

const MAX_RECENT = 10;

export function RecentAlerts() {
  const [recent, setRecent] = useState<Alert[]>([]);

  useEffect(() => {
    return dashboardSocket.on("alert:new", (payload) => {
      const alert = payload.alert as Alert;
      setRecent((prev) => [alert, ...prev].slice(0, MAX_RECENT));
    });
  }, []);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Bell className="h-4 w-4" />
          Recent Alerts
        </CardTitle>
      </CardHeader>
      <CardContent>
        {recent.length === 0 ? (
          <p className="py-4 text-center text-sm text-gray-400">No new alerts yet</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {recent.map((alert) => (
              <li
                key={alert.id}
                className="flex items-start gap-2 rounded-md border border-gray-100 p-2 dark:border-gray-800"
              >
                <span
                  className={cn(
                    "mt-1.5 inline-block h-2 w-2 shrink-0 rounded-full",
                    severityDot[alert.severity],
                  )}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 text-sm">
                    <Link
                      to="/vehicles/$id"
                      params={{ id: alert.vehicleId }}
                      className="font-medium text-brand-600 hover:underline"
                    >
                      {alert.vehicle?.plate ?? alert.vehicleId.slice(0, 8)}
                    </Link>
                  </div>
                  <p className="truncate text-xs text-gray-500">{alert.message}</p>
                  <p className="text-xs text-gray-400">
                    {formatDistanceToNow(new Date(alert.createdAt), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
