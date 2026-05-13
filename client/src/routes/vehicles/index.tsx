import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { requireAuth } from "@/components/guards";
import { listVehicles } from "@/api/vehicles";
import { VehicleCard } from "@/components/vehicles/VehicleCard";
import { VehicleFilters } from "@/components/vehicles/VehicleFilters";
import { PageNavigator } from "@/components/common/PageNavigator";

const VEHICLE_TYPES = ["car", "truck", "van", "motorcycle", "bus", "other"] as const;

interface VehicleSearch {
  q?: string;
  vehicleType?: string;
  status?: string;
  sort?: string;
  page?: number;
}

export const Route = createFileRoute("/vehicles/")({
  validateSearch: (s: Record<string, unknown>): VehicleSearch => ({
    q: typeof s.q === "string" ? s.q : undefined,
    vehicleType: VEHICLE_TYPES.includes(s.vehicleType as (typeof VEHICLE_TYPES)[number])
      ? (s.vehicleType as string)
      : undefined,
    status: ["moving", "idle", "offline"].includes(s.status as string)
      ? (s.status as string)
      : undefined,
    sort: ["recent", "plate", "speed"].includes(s.sort as string)
      ? (s.sort as string)
      : "recent",
    page: Math.max(1, Number(s.page) || 1),
  }),
  beforeLoad: requireAuth,
  loaderDeps: ({ search }) => search,
  loader: ({ deps, context }) =>
    context.queryClient.ensureQueryData({
      queryKey: ["vehicles", deps],
      queryFn: () => listVehicles(deps),
    }),
  component: VehicleListPage,
});

function VehicleListPage() {
  const data = Route.useLoaderData();
  const search = Route.useSearch();
  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-7xl space-y-4 p-4">
      <h1 className="text-2xl font-bold">Araçlar</h1>

      <VehicleFilters search={search} />

      {data.items.length === 0 ? (
        <div className="py-12 text-center text-gray-400">
          <p className="text-lg">Araç bulunamadı</p>
          <p className="text-sm">Filtrelerinizi değiştirmeyi deneyin</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.items.map((vehicle) => (
            <VehicleCard key={vehicle.id} vehicle={vehicle} />
          ))}
        </div>
      )}

      <PageNavigator
        page={data.page}
        totalPages={data.totalPages}
        onPageChange={(p) =>
          void navigate({
            search: (prev: Record<string, unknown>) => ({ ...prev, page: p }),
          })
        }
      />
    </div>
  );
}
