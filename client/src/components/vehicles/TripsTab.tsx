import { useQuery } from "@tanstack/react-query";
import { format, subDays } from "date-fns";
import { tr } from "date-fns/locale";
import { MapPin } from "lucide-react";
import { useState } from "react";
import { listTrips } from "@/api/trips";
import type { Trip } from "@/api/types";
import { Badge, Button, Input, Label } from "@/components/ui";
import { cn } from "@/lib/cn";

interface TripsTabProps {
  vehicleId: string;
}

export function TripsTab({ vehicleId }: TripsTabProps) {
  const [from, setFrom] = useState(format(subDays(new Date(), 7), "yyyy-MM-dd'T'HH:mm"));
  const [to, setTo] = useState(format(new Date(), "yyyy-MM-dd'T'HH:mm"));

  const { data, isLoading } = useQuery({
    queryKey: ["trips", vehicleId, from, to],
    queryFn: () =>
      listTrips({
        vehicleId,
        from: new Date(from).toISOString(),
        to: new Date(to).toISOString(),
        limit: 50,
      }),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="trip-from">Başlangıç</Label>
          <Input
            id="trip-from"
            type="datetime-local"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="w-48"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="trip-to">Bitiş</Label>
          <Input
            id="trip-to"
            type="datetime-local"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="w-48"
          />
        </div>
      </div>

      {isLoading ? (
        <p className="py-8 text-center text-sm text-gray-400">Yükleniyor…</p>
      ) : !data || data.items.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-400">Sefer bulunamadı</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 font-medium">Başlangıç</th>
                <th className="px-4 py-3 font-medium">Süre</th>
                <th className="px-4 py-3 font-medium">Mesafe</th>
                <th className="px-4 py-3 font-medium">Ort. Hız</th>
                <th className="px-4 py-3 font-medium">Maks. Hız</th>
                <th className="px-4 py-3 font-medium">İhlaller</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {data.items.map((trip) => (
                <TripRow key={trip.id} trip={trip} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function TripRow({ trip }: { trip: Trip }) {
  const duration = trip.endedAt
    ? Math.round((new Date(trip.endedAt).getTime() - new Date(trip.startedAt).getTime()) / 60_000)
    : null;

  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
      <td className="px-4 py-3">
        {format(new Date(trip.startedAt), "dd MMM HH:mm", { locale: tr })}
      </td>
      <td className="px-4 py-3">
        {duration !== null ? `${duration} dk` : <Badge variant="warning">Devam ediyor</Badge>}
      </td>
      <td className="px-4 py-3">{trip.distanceKm?.toFixed(1) ?? "—"} km</td>
      <td className="px-4 py-3">{trip.avgSpeedKmh?.toFixed(0) ?? "—"} km/h</td>
      <td className="px-4 py-3">{trip.maxSpeedKmh?.toFixed(0) ?? "—"} km/h</td>
      <td className="px-4 py-3">
        <div className="flex gap-1">
          {trip.speedViolations > 0 && (
            <span
              className={cn("inline-block h-2 w-2 rounded-full bg-red-500")}
              title={`${trip.speedViolations} hız ihlali`}
            />
          )}
          {trip.idleEvents > 0 && (
            <span
              className={cn("inline-block h-2 w-2 rounded-full bg-amber-500")}
              title={`${trip.idleEvents} boşta kalma`}
            />
          )}
          {trip.geofenceEvents > 0 && (
            <span
              className={cn("inline-block h-2 w-2 rounded-full bg-blue-500")}
              title={`${trip.geofenceEvents} bölge olayı`}
            />
          )}
        </div>
      </td>
      <td className="px-4 py-3">
        <Button variant="ghost" size="sm">
          <MapPin className="mr-1 h-3.5 w-3.5" />
          Haritada Gör
        </Button>
      </td>
    </tr>
  );
}
