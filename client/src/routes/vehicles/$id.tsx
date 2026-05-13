import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Crosshair } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { requireAuth } from "@/components/guards";
import { getVehicle } from "@/api/vehicles";
import { dashboardSocket } from "@/api";
import { useLiveVehicle } from "@/stores/live-vehicles.store";
import { LiveMap } from "@/components/map";
import { CurrentSpeedGauge } from "@/components/vehicles/CurrentSpeedGauge";
import { StatusCard } from "@/components/vehicles/StatusCard";
import { RecentVehicleAlerts } from "@/components/vehicles/RecentVehicleAlerts";
import { Button, Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui";
import type { Vehicle } from "@/api/types";

interface DetailSearch {
  tab?: string;
}

export const Route = createFileRoute("/vehicles/$id")({
  validateSearch: (s: Record<string, unknown>): DetailSearch => ({
    tab: ["live", "history", "trips", "alerts"].includes(s.tab as string)
      ? (s.tab as string)
      : "live",
  }),
  beforeLoad: requireAuth,
  loader: ({ params, context }) =>
    context.queryClient.ensureQueryData({
      queryKey: ["vehicles", params.id],
      queryFn: () => getVehicle(params.id),
    }),
  component: VehicleDetailPage,
});

function VehicleDetailPage() {
  const vehicle = Route.useLoaderData() as Vehicle;
  const { id } = Route.useParams();
  const { tab } = Route.useSearch();
  const navigate = useNavigate();
  const [autoFollow, setAutoFollow] = useState(true);
  const mapRef = useRef<{ flyTo?: (coords: [number, number]) => void }>(null);

  useEffect(() => {
    dashboardSocket.subscribeToVehicle(id);
    return () => dashboardSocket.unsubscribeFromVehicle(id);
  }, [id]);

  const liveVehicle = useLiveVehicle(id);

  useEffect(() => {
    if (autoFollow && liveVehicle && mapRef.current?.flyTo) {
      mapRef.current.flyTo(liveVehicle.coordinates);
    }
  }, [autoFollow, liveVehicle?.coordinates[0], liveVehicle?.coordinates[1]]);

  const handleTabChange = useCallback(
    (value: string) => {
      void navigate({
        search: (prev: Record<string, unknown>) => ({ ...prev, tab: value }),
      });
    },
    [navigate],
  );

  return (
    <div className="mx-auto max-w-7xl space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{vehicle.plate}</h1>
      </div>

      <Tabs value={tab ?? "live"} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="live">Canlı</TabsTrigger>
          <TabsTrigger value="history">Geçmiş</TabsTrigger>
          <TabsTrigger value="trips">Seferler</TabsTrigger>
          <TabsTrigger value="alerts">Uyarılar</TabsTrigger>
        </TabsList>

        <TabsContent value="live">
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <div className="relative h-[500px] overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                <LiveMap className="h-full w-full" />
                <Button
                  variant={autoFollow ? "default" : "outline"}
                  size="icon"
                  className="absolute bottom-3 right-3 z-10"
                  onClick={() => setAutoFollow((p) => !p)}
                  title={autoFollow ? "Otomatik takip açık" : "Otomatik takip kapalı"}
                >
                  <Crosshair className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-4">
              <CurrentSpeedGauge vehicleId={id} speedLimit={vehicle.speedLimitKmh} />
              <StatusCard vehicleId={id} />
              <RecentVehicleAlerts vehicleId={id} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="history">
          <div className="py-12 text-center text-gray-400">
            Geçmiş rotalar burada görüntülenecek
          </div>
        </TabsContent>

        <TabsContent value="trips">
          <div className="py-12 text-center text-gray-400">
            Sefer kayıtları burada listelenecek
          </div>
        </TabsContent>

        <TabsContent value="alerts">
          <div className="py-12 text-center text-gray-400">
            Araç uyarıları burada listelenecek
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
