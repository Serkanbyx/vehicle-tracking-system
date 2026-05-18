import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Check } from "lucide-react";
import { useEffect, useState } from "react";
import { dashboardSocket } from "@/api";
import { acknowledgeAlert, listAlerts } from "@/api/alerts";
import type { Alert, AlertSeverity } from "@/api/types";
import { Badge, Button, Select } from "@/components/ui";
import { cn } from "@/lib/cn";

const severityColors: Record<AlertSeverity, string> = {
  info: "bg-blue-500",
  warning: "bg-amber-500",
  critical: "bg-red-500",
};

interface AlertsTabProps {
  vehicleId: string;
}

export function AlertsTab({ vehicleId }: AlertsTabProps) {
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [severityFilter, setSeverityFilter] = useState<string>("");
  const [ackFilter, setAckFilter] = useState<string>("");

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["alerts", "vehicle-tab", vehicleId, typeFilter, severityFilter, ackFilter],
    queryFn: () =>
      listAlerts({
        vehicleId,
        type: typeFilter || undefined,
        severity: severityFilter || undefined,
        acknowledged: ackFilter === "" ? undefined : ackFilter === "true",
        limit: 50,
      }),
  });

  const [wsAlerts, setWsAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    return dashboardSocket.on("alert:new", (payload) => {
      const alert = payload.alert as Alert;
      if (alert.vehicleId === vehicleId) {
        setWsAlerts((prev) => [alert, ...prev].slice(0, 10));
      }
    });
  }, [vehicleId]);

  const allAlerts = [
    ...wsAlerts.filter((a) => !data?.items.some((d) => d.id === a.id)),
    ...(data?.items ?? []),
  ];

  const handleAck = async (id: string) => {
    await acknowledgeAlert(id);
    void refetch();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="w-40">
          <option value="">All Types</option>
          <option value="speed">Speed</option>
          <option value="idle">Idle</option>
          <option value="geofence_enter">Geofence Enter</option>
          <option value="geofence_exit">Geofence Exit</option>
        </Select>

        <Select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          className="w-36"
        >
          <option value="">All Severities</option>
          <option value="info">Info</option>
          <option value="warning">Warning</option>
          <option value="critical">Critical</option>
        </Select>

        <Select value={ackFilter} onChange={(e) => setAckFilter(e.target.value)} className="w-40">
          <option value="">All</option>
          <option value="false">Unacknowledged</option>
          <option value="true">Acknowledged</option>
        </Select>
      </div>

      {isLoading ? (
        <p className="py-8 text-center text-sm text-gray-400">Loading…</p>
      ) : allAlerts.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-400">No alerts found</p>
      ) : (
        <div className="flex flex-col gap-2">
          {allAlerts.map((alert) => (
            <div
              key={alert.id}
              className="flex items-start gap-3 rounded-lg border border-gray-200 p-3 dark:border-gray-700"
            >
              <span
                className={cn(
                  "mt-1 inline-block h-2.5 w-2.5 shrink-0 rounded-full",
                  severityColors[alert.severity],
                )}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs capitalize">
                    {alert.type.replace("_", " ")}
                  </Badge>
                  {alert.acknowledged && (
                    <Badge variant="success" className="text-xs">
                      Acknowledged
                    </Badge>
                  )}
                </div>
                <p className="mt-1 text-sm">{alert.message}</p>
                <p className="mt-0.5 text-xs text-gray-400">
                  {formatDistanceToNow(new Date(alert.createdAt), {
                    addSuffix: true,
                  })}
                </p>
              </div>
              {!alert.acknowledged && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => void handleAck(alert.id)}
                  title="Acknowledge"
                >
                  <Check className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
