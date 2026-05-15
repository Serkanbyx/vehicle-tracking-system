import { Activity, Pause, Truck, WifiOff } from "lucide-react";
import { useVehicleStatusCounts } from "@/stores/live-vehicles.store";
import { StatCard } from "./StatCard";

export function StatsRow() {
  const { moving, idle, offline, total } = useVehicleStatusCounts();

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <StatCard
        label="Toplam Filo"
        value={total}
        icon={<Truck className="h-5 w-5" />}
        color="brand"
      />
      <StatCard
        label="Hareket Halinde"
        value={moving}
        icon={<Activity className="h-5 w-5" />}
        color="success"
      />
      <StatCard label="Boşta" value={idle} icon={<Pause className="h-5 w-5" />} color="warning" />
      <StatCard
        label="Çevrimdışı"
        value={offline}
        icon={<WifiOff className="h-5 w-5" />}
        color="neutral"
      />
    </div>
  );
}
