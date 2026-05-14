import { Link } from "@tanstack/react-router";
import { Check, MapPin, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import type { Alert, AlertSeverity, AlertType } from "@/api/types";
import { useAuth } from "@/context/auth.context";
import { Badge, Button } from "@/components/ui";

const SEVERITY_COLORS: Record<AlertSeverity, string> = {
  info: "bg-blue-500",
  warning: "bg-amber-500",
  critical: "bg-red-500",
};

const TYPE_LABELS: Record<AlertType, string> = {
  speed: "Hız",
  idle: "Rölanti",
  geofence_enter: "Bölge Giriş",
  geofence_exit: "Bölge Çıkış",
};

const TYPE_VARIANTS: Record<AlertType, "default" | "secondary" | "destructive" | "outline" | "warning"> = {
  speed: "destructive",
  idle: "warning",
  geofence_enter: "default",
  geofence_exit: "secondary",
};

interface AlertsTableProps {
  alerts: Alert[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleAll: () => void;
  onAcknowledge: (id: string) => void;
  onDelete: (id: string) => void;
}

export function AlertsTable({
  alerts,
  selectedIds,
  onToggleSelect,
  onToggleAll,
  onAcknowledge,
  onDelete,
}: AlertsTableProps) {
  const { hasRole } = useAuth();
  const allChecked = alerts.length > 0 && alerts.every((a) => selectedIds.has(a.id));

  if (alerts.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-gray-400">
        Uyarı bulunamadı
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border border-gray-200 dark:border-gray-700">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
          <tr>
            <th className="w-10 px-3 py-2">
              <input
                type="checkbox"
                checked={allChecked}
                onChange={onToggleAll}
                className="accent-brand-600"
              />
            </th>
            <th className="w-10 px-2 py-2">Düzey</th>
            <th className="px-3 py-2">Araç</th>
            <th className="px-3 py-2">Tip</th>
            <th className="min-w-[180px] px-3 py-2">Mesaj</th>
            <th className="px-3 py-2">Konum</th>
            <th className="px-3 py-2">Zaman</th>
            <th className="px-3 py-2">Onaylayan</th>
            <th className="w-24 px-3 py-2">İşlem</th>
          </tr>
        </thead>
        <tbody>
          {alerts.map((alert) => (
            <tr
              key={alert.id}
              className="border-b border-gray-100 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50"
            >
              <td className="px-3 py-2">
                <input
                  type="checkbox"
                  checked={selectedIds.has(alert.id)}
                  onChange={() => onToggleSelect(alert.id)}
                  className="accent-brand-600"
                />
              </td>
              <td className="px-2 py-2">
                <span
                  className={`inline-block h-2.5 w-2.5 rounded-full ${SEVERITY_COLORS[alert.severity]}`}
                  title={alert.severity}
                />
              </td>
              <td className="px-3 py-2">
                {alert.vehicle ? (
                  <Link
                    to="/vehicles/$id"
                    params={{ id: alert.vehicleId }}
                    className="font-medium text-brand-600 hover:underline"
                  >
                    {alert.vehicle.plate}
                  </Link>
                ) : (
                  <span className="text-gray-400">{alert.vehicleId.slice(0, 8)}</span>
                )}
              </td>
              <td className="px-3 py-2">
                <Badge variant={TYPE_VARIANTS[alert.type]}>
                  {TYPE_LABELS[alert.type]}
                </Badge>
              </td>
              <td className="max-w-[220px] truncate px-3 py-2 text-gray-600 dark:text-gray-300">
                {alert.message}
              </td>
              <td className="px-3 py-2">
                {alert.vehicle?.lastLocation ? (
                  <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                    <MapPin className="h-3 w-3" />
                    {alert.vehicle.lastLocation.lat.toFixed(4)},{" "}
                    {alert.vehicle.lastLocation.lng.toFixed(4)}
                  </span>
                ) : (
                  <span className="text-xs text-gray-400">—</span>
                )}
              </td>
              <td className="whitespace-nowrap px-3 py-2 text-xs text-gray-500">
                {formatDistanceToNow(new Date(alert.createdAt), {
                  addSuffix: true,
                  locale: tr,
                })}
              </td>
              <td className="px-3 py-2 text-xs text-gray-500">
                {alert.acknowledged ? (
                  <span className="inline-flex items-center gap-1 text-success">
                    <Check className="h-3 w-3" />
                    Onaylandı
                  </span>
                ) : (
                  <span className="text-gray-400">—</span>
                )}
              </td>
              <td className="px-3 py-2">
                <div className="flex gap-1">
                  {!alert.acknowledged && hasRole("manager", "admin") && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() => onAcknowledge(alert.id)}
                      title="Onayla"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  {hasRole("admin") && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-danger"
                      onClick={() => onDelete(alert.id)}
                      title="Sil"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
