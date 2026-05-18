import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Download } from "lucide-react";
import { useCallback } from "react";
import { toast } from "sonner";
import type { ListTripsQuery } from "@/api/trips";
import { exportTripsCsv, listTrips } from "@/api/trips";
import { PageNavigator, TableRowSkeleton } from "@/components/common";
import { requireAuth } from "@/components/guards";
import { DailySummaryChart, HeatmapPanel, ReportFilters, TripTable } from "@/components/reports";
import { Button } from "@/components/ui";

interface ReportsSearch {
  vehicleId?: string;
  from?: string;
  to?: string;
  minDistance?: number;
  page?: number;
}

export const Route = createFileRoute("/reports")({
  beforeLoad: requireAuth,
  validateSearch: (raw: Record<string, unknown>): ReportsSearch => ({
    vehicleId: typeof raw.vehicleId === "string" ? raw.vehicleId : undefined,
    from: typeof raw.from === "string" ? raw.from : undefined,
    to: typeof raw.to === "string" ? raw.to : undefined,
    minDistance:
      typeof raw.minDistance === "number" && raw.minDistance > 0 ? raw.minDistance : undefined,
    page: typeof raw.page === "number" && raw.page >= 1 ? Math.floor(raw.page) : 1,
  }),
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) => {
    const query = buildQuery(deps);
    return context.queryClient.ensureQueryData({
      queryKey: ["trips", query],
      queryFn: () => listTrips(query),
    });
  },
  component: ReportsPage,
});

function buildQuery(search: ReportsSearch): ListTripsQuery {
  return {
    page: search.page ?? 1,
    limit: 20,
    vehicleId: search.vehicleId || undefined,
    from: search.from || undefined,
    to: search.to || undefined,
  };
}

function ReportsPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  const query = buildQuery(search);
  const { data, isLoading } = useQuery({
    queryKey: ["trips", query],
    queryFn: () => listTrips(query),
  });

  const trips = data?.items ?? [];
  const filtered = search.minDistance
    ? trips.filter((t) => t.distanceKm != null && t.distanceKm >= search.minDistance!)
    : trips;

  const handlePageChange = useCallback(
    (page: number) => {
      void navigate({ search: (prev) => ({ ...prev, page }) });
    },
    [navigate],
  );

  const handleExport = useCallback(async () => {
    if (!search.from || !search.to) {
      toast.error("A date range is required for export.");
      return;
    }
    try {
      const blob = await exportTripsCsv({
        vehicleId: search.vehicleId,
        from: search.from,
        to: search.to,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `trips-${search.from}-${search.to}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Downloading CSV.");
    } catch {
      toast.error("Export failed.");
    }
  }, [search]);

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Reports</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          disabled={!search.from || !search.to}
        >
          <Download className="mr-1.5 h-4 w-4" />
          Download CSV
        </Button>
      </div>

      <ReportFilters filters={search} />

      <DailySummaryChart
        vehicleId={search.vehicleId}
        from={search.from ?? ""}
        to={search.to ?? ""}
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_24rem]">
        <div className="space-y-4">
          {isLoading ? <TableRowSkeleton columns={7} rows={5} /> : <TripTable trips={filtered} />}
          <PageNavigator
            page={search.page ?? 1}
            totalPages={data?.totalPages ?? 1}
            onPageChange={handlePageChange}
          />
        </div>
        <HeatmapPanel />
      </div>
    </div>
  );
}
