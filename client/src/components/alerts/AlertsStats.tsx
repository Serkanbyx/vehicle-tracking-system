import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Bell, Gauge, MapPin } from "lucide-react";
import { getAlertStats } from "@/api/alerts";
import type { AlertType } from "@/api/types";
import { Card } from "@/components/ui";

const TYPE_META: Record<AlertType, { label: string; icon: typeof Bell; color: string }> = {
  speed: { label: "Hız", icon: Gauge, color: "bg-red-500" },
  idle: { label: "Rölanti", icon: Bell, color: "bg-amber-500" },
  geofence_enter: { label: "Bölge Giriş", icon: MapPin, color: "bg-blue-500" },
  geofence_exit: { label: "Bölge Çıkış", icon: MapPin, color: "bg-purple-500" },
};

export function AlertsStats() {
  const { data } = useQuery({
    queryKey: ["alerts", "stats"],
    queryFn: getAlertStats,
    refetchInterval: 60_000,
  });

  if (!data) return null;

  const maxType = Math.max(...Object.values(data.byType), 1);

  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-danger" />
          <div>
            <p className="text-2xl font-bold">{data.total}</p>
            <p className="text-xs text-gray-500">Toplam</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-warning" />
          <div>
            <p className="text-2xl font-bold">{data.unacknowledged}</p>
            <p className="text-xs text-gray-500">Onaylanmamış</p>
          </div>
        </div>

        <div
          className="ml-auto flex flex-1 flex-wrap items-end gap-3"
          style={{ minWidth: "200px" }}
        >
          {(Object.entries(data.byType) as [AlertType, number][]).map(([type, count]) => {
            const meta = TYPE_META[type];
            if (!meta) return null;
            const pct = Math.max((count / maxType) * 100, 4);
            return (
              <div key={type} className="flex flex-col items-center gap-1">
                <span className="text-xs font-medium">{count}</span>
                <div
                  className={`w-7 rounded-t ${meta.color}`}
                  style={{ height: `${pct}%`, minHeight: "4px", maxHeight: "48px" }}
                />
                <span className="text-[10px] text-gray-500">{meta.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
