import { Link } from "@tanstack/react-router";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { Edit, Eye, Truck } from "lucide-react";
import type { Vehicle } from "@/api/types";
import { useAuth } from "@/context/auth.context";
import { Badge, Button, Card, CardContent } from "@/components/ui";
import { StatusBadge } from "@/components/common/StatusBadge";

interface VehicleCardProps {
  vehicle: Vehicle;
}

export function VehicleCard({ vehicle }: VehicleCardProps) {
  const { hasRole } = useAuth();
  const status = vehicle.lastLocation?.status ?? "offline";
  const speed = vehicle.lastLocation?.speed ?? 0;
  const lastUpdate = vehicle.lastLocation?.timestamp;

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="flex gap-4 p-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md bg-gray-100 dark:bg-gray-800">
          {vehicle.photoUrl ? (
            <img
              src={vehicle.photoUrl}
              alt={vehicle.plate}
              className="h-full w-full object-cover"
            />
          ) : (
            <Truck className="h-8 w-8 text-gray-400" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold">{vehicle.plate}</span>
            <StatusBadge status={status} />
            <Badge variant="secondary" className="text-xs">
              {vehicle.vehicleType}
            </Badge>
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
            {vehicle.driver?.name && <span>{vehicle.driver.name}</span>}
            <span>{speed.toFixed(0)} km/h</span>
            {lastUpdate && (
              <span>
                {formatDistanceToNow(new Date(lastUpdate), {
                  addSuffix: true,
                  locale: tr,
                })}
              </span>
            )}
          </div>

          {vehicle.tags.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {vehicle.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className="flex shrink-0 flex-col gap-1">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/vehicles/$id" params={{ id: vehicle.id }}>
              <Eye className="h-4 w-4" />
            </Link>
          </Button>
          {hasRole("manager", "admin") && (
            <Button variant="ghost" size="icon" asChild>
              <Link to="/vehicles/$id/edit" params={{ id: vehicle.id }}>
                <Edit className="h-4 w-4" />
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
