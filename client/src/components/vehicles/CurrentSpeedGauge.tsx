import { Gauge } from "lucide-react";
import { useLiveVehicle } from "@/stores/live-vehicles.store";
import { Card, CardContent } from "@/components/ui";
import { cn } from "@/lib/cn";

interface CurrentSpeedGaugeProps {
  vehicleId: string;
  speedLimit?: number;
}

export function CurrentSpeedGauge({ vehicleId, speedLimit = 90 }: CurrentSpeedGaugeProps) {
  const vehicle = useLiveVehicle(vehicleId);
  const speed = vehicle?.speed ?? 0;
  const isOverLimit = speed > speedLimit;
  const percentage = Math.min((speed / (speedLimit * 1.5)) * 100, 100);

  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-2 p-4">
        <Gauge className={cn("h-6 w-6", isOverLimit ? "text-danger" : "text-brand-600")} />
        <div className="text-center">
          <span className={cn("text-4xl font-bold", isOverLimit ? "text-danger" : "text-gray-900 dark:text-gray-100")}>
            {speed.toFixed(0)}
          </span>
          <span className="ml-1 text-sm text-gray-500">km/h</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
          <div
            className={cn("h-full rounded-full transition-all", isOverLimit ? "bg-danger" : "bg-brand-600")}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <p className="text-xs text-gray-400">
          Limit: {speedLimit} km/h
        </p>
      </CardContent>
    </Card>
  );
}
