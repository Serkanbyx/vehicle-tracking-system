import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { Clock, Compass, MapPin } from "lucide-react";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { useLiveVehicle } from "@/stores/live-vehicles.store";

interface StatusCardProps {
  vehicleId: string;
}

export function StatusCard({ vehicleId }: StatusCardProps) {
  const vehicle = useLiveVehicle(vehicleId);

  if (!vehicle) {
    return (
      <Card>
        <CardContent className="p-4 text-center text-sm text-gray-400">
          Araç verisi bekleniyor…
        </CardContent>
      </Card>
    );
  }

  const [lng, lat] = vehicle.coordinates;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-base">
          <span>{vehicle.plate}</span>
          <StatusBadge status={vehicle.status} />
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
          <MapPin className="h-4 w-4 shrink-0 text-gray-400" />
          <span>
            {lat.toFixed(5)}, {lng.toFixed(5)}
          </span>
        </div>
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
          <Compass className="h-4 w-4 shrink-0 text-gray-400" />
          <span>Yön: {vehicle.heading}°</span>
        </div>
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
          <Clock className="h-4 w-4 shrink-0 text-gray-400" />
          <span>
            {formatDistanceToNow(new Date(vehicle.timestamp), {
              addSuffix: true,
              locale: tr,
            })}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
