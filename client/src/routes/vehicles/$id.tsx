import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { format, subDays } from "date-fns";
import { Crosshair, Loader2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { dashboardSocket } from "@/api";
import { getHistory } from "@/api/locations";
import type { Location, Vehicle } from "@/api/types";
import { getVehicle } from "@/api/vehicles";
import { requireAuth } from "@/components/guards";
import { LiveMap } from "@/components/map";
import { Button, Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui";
import { AlertsTab } from "@/components/vehicles/AlertsTab";
import { CurrentSpeedGauge } from "@/components/vehicles/CurrentSpeedGauge";
import { DateRangePicker } from "@/components/vehicles/DateRangePicker";
import { ExportButtons } from "@/components/vehicles/ExportButtons";
import { HistoryPlayer } from "@/components/vehicles/HistoryPlayer";
import { RecentVehicleAlerts } from "@/components/vehicles/RecentVehicleAlerts";
import { StatsPanel } from "@/components/vehicles/StatsPanel";
import { StatusCard } from "@/components/vehicles/StatusCard";
import { TripsTab } from "@/components/vehicles/TripsTab";
import { useLiveVehicle } from "@/stores/live-vehicles.store";

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
  const navigate = useNavigate({ from: "/vehicles/$id" });
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
        search: (prev) => ({ ...prev, tab: value }),
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
          <HistoryTab vehicleId={id} />
        </TabsContent>

        <TabsContent value="trips">
          <TripsTab vehicleId={id} />
        </TabsContent>

        <TabsContent value="alerts">
          <AlertsTab vehicleId={id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function HistoryTab({ vehicleId }: { vehicleId: string }) {
  const now = format(new Date(), "yyyy-MM-dd'T'HH:mm");
  const dayAgo = format(subDays(new Date(), 1), "yyyy-MM-dd'T'HH:mm");

  const [range, setRange] = useState({ from: dayAgo, to: now });
  const [history, setHistory] = useState<Location[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [, setPlayerPos] = useState<Location | null>(null);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const points = await getHistory({
        vehicleId,
        from: new Date(range.from).toISOString(),
        to: new Date(range.to).toISOString(),
      });
      setHistory(points);
      if (points.length > 0) setPlayerPos(points[0]!);
    } finally {
      setLoading(false);
    }
  };

  const stats = history ? computeStats(history) : null;

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <div className="h-[500px] overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
          <LiveMap className="h-full w-full" />
        </div>
      </div>
      <div className="space-y-4">
        <DateRangePicker from={range.from} to={range.to} onChange={setRange} />
        <Button onClick={() => void loadHistory()} disabled={loading} className="w-full">
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Rotayı Yükle
        </Button>
        {stats && (
          <StatsPanel
            totalPoints={stats.totalPoints}
            distanceKm={stats.distanceKm}
            avgSpeedKmh={stats.avgSpeedKmh}
            maxSpeedKmh={stats.maxSpeedKmh}
            durationMin={stats.durationMin}
          />
        )}
        {history && history.length > 0 && <HistoryPlayer points={history} onTick={setPlayerPos} />}
        {history && (
          <ExportButtons
            vehicleId={vehicleId}
            from={new Date(range.from).toISOString()}
            to={new Date(range.to).toISOString()}
          />
        )}
      </div>
    </div>
  );
}

function computeStats(points: Location[]) {
  if (points.length === 0)
    return { totalPoints: 0, distanceKm: 0, avgSpeedKmh: 0, maxSpeedKmh: 0, durationMin: 0 };

  let totalSpeed = 0;
  let maxSpeed = 0;

  for (const p of points) {
    totalSpeed += p.speed;
    if (p.speed > maxSpeed) maxSpeed = p.speed;
  }

  const firstTs = new Date(points[0]!.timestamp).getTime();
  const lastTs = new Date(points[points.length - 1]!.timestamp).getTime();
  const durationMin = (lastTs - firstTs) / 60_000;
  const avgSpeedKmh = totalSpeed / points.length;
  const distanceKm = (avgSpeedKmh * durationMin) / 60;

  return {
    totalPoints: points.length,
    distanceKm,
    avgSpeedKmh,
    maxSpeedKmh: maxSpeed,
    durationMin,
  };
}
