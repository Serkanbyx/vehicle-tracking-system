import { Link } from "@tanstack/react-router";
import { MapPin } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { useState, useCallback } from "react";
import type { Trip } from "@/api/types";
import { Badge, Button } from "@/components/ui";
import { TripMapModal } from "./TripMapModal";

interface TripTableProps {
  trips: Trip[];
}

function formatDuration(start: string, end: string | null): string {
  if (!end) return "—";
  const ms = new Date(end).getTime() - new Date(start).getTime();
  const minutes = Math.round(ms / 60_000);
  if (minutes < 60) return `${minutes} dk`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h} sa ${m} dk`;
}

export function TripTable({ trips }: TripTableProps) {
  const [mapTrip, setMapTrip] = useState<Trip | null>(null);

  const openMap = useCallback((trip: Trip) => {
    setMapTrip(trip);
  }, []);

  if (trips.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-gray-400">
        Sefer bulunamadı
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto rounded-md border border-gray-200 dark:border-gray-700">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
            <tr>
              <th className="px-3 py-2">Tarih</th>
              <th className="px-3 py-2">Araç</th>
              <th className="px-3 py-2">Mesafe</th>
              <th className="px-3 py-2">Ort / Maks Hız</th>
              <th className="px-3 py-2">Süre</th>
              <th className="px-3 py-2">İhlaller</th>
              <th className="w-24 px-3 py-2">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {trips.map((trip) => (
              <tr
                key={trip.id}
                className="border-b border-gray-100 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50"
              >
                <td className="whitespace-nowrap px-3 py-2 text-xs">
                  {format(new Date(trip.startedAt), "dd MMM yyyy HH:mm", {
                    locale: tr,
                  })}
                </td>
                <td className="px-3 py-2">
                  {trip.vehicle ? (
                    <Link
                      to="/vehicles/$id"
                      params={{ id: trip.vehicleId }}
                      className="font-medium text-brand-600 hover:underline"
                    >
                      {trip.vehicle.plate}
                    </Link>
                  ) : (
                    <span className="text-gray-400">
                      {trip.vehicleId.slice(0, 8)}
                    </span>
                  )}
                </td>
                <td className="px-3 py-2">
                  {trip.distanceKm != null
                    ? `${trip.distanceKm.toFixed(1)} km`
                    : "—"}
                </td>
                <td className="px-3 py-2 text-xs">
                  {trip.avgSpeedKmh?.toFixed(0) ?? "—"} /{" "}
                  {trip.maxSpeedKmh?.toFixed(0) ?? "—"} km/h
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-xs">
                  {formatDuration(trip.startedAt, trip.endedAt)}
                </td>
                <td className="px-3 py-2">
                  <div className="flex gap-1">
                    {trip.speedViolations > 0 && (
                      <Badge variant="destructive" className="text-[10px]">
                        Hız {trip.speedViolations}
                      </Badge>
                    )}
                    {trip.idleEvents > 0 && (
                      <Badge variant="warning" className="text-[10px]">
                        Rölanti {trip.idleEvents}
                      </Badge>
                    )}
                    {trip.geofenceEvents > 0 && (
                      <Badge variant="secondary" className="text-[10px]">
                        Bölge {trip.geofenceEvents}
                      </Badge>
                    )}
                    {trip.speedViolations === 0 &&
                      trip.idleEvents === 0 &&
                      trip.geofenceEvents === 0 && (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                  </div>
                </td>
                <td className="px-3 py-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 gap-1 text-xs"
                    onClick={() => openMap(trip)}
                  >
                    <MapPin className="h-3 w-3" />
                    Harita
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <TripMapModal trip={mapTrip} onClose={() => setMapTrip(null)} />
    </>
  );
}
