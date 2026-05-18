import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Bell } from "lucide-react";
import { useEffect, useState } from "react";
import { dashboardSocket } from "@/api";
import { listAlerts } from "@/api/alerts";
import type { Alert, AlertSeverity } from "@/api/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { cn } from "@/lib/cn";

const severityDot: Record<AlertSeverity, string> = {
  info: "bg-blue-500",
  warning: "bg-amber-500",
  critical: "bg-red-500",
};

interface RecentVehicleAlertsProps {
  vehicleId: string;
}

export function RecentVehicleAlerts({ vehicleId }: RecentVehicleAlertsProps) {
  const { data } = useQuery({
    queryKey: ["alerts", "vehicle", vehicleId],
    queryFn: () => listAlerts({ vehicleId, limit: 20 }),
  });

  const [wsAlerts, setWsAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    return dashboardSocket.on("alert:new", (payload) => {
      const alert = payload.alert as Alert;
      if (alert.vehicleId === vehicleId) {
        setWsAlerts((prev) => [alert, ...prev].slice(0, 20));
      }
    });
  }, [vehicleId]);

  const allAlerts = [
    ...wsAlerts,
    ...(data?.items.filter((a) => !wsAlerts.some((w) => w.id === a.id)) ?? []),
  ].slice(0, 20);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Bell className="h-4 w-4" />
          Recent Alerts
        </CardTitle>
      </CardHeader>
      <CardContent>
        {allAlerts.length === 0 ? (
          <p className="py-4 text-center text-sm text-gray-400">No alerts</p>
        ) : (
          <ul className="flex max-h-[300px] flex-col gap-2 overflow-y-auto">
            {allAlerts.map((alert) => (
              <li
                key={alert.id}
                className="flex items-start gap-2 rounded-md border border-gray-100 p-2 dark:border-gray-800"
              >
                <span
                  className={cn(
                    "mt-1 inline-block h-2 w-2 shrink-0 rounded-full",
                    severityDot[alert.severity],
                  )}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{alert.message}</p>
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
