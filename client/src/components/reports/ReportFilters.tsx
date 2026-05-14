import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { listVehicles } from "@/api/vehicles";
import { Button, Input, Label, Select } from "@/components/ui";

export interface ReportSearch {
  vehicleId?: string;
  from?: string;
  to?: string;
  minDistance?: number;
  page?: number;
}

interface ReportFiltersProps {
  filters: ReportSearch;
}

export function ReportFilters({ filters }: ReportFiltersProps) {
  const navigate = useNavigate({ from: "/reports" });

  const { data: vehiclesData } = useQuery({
    queryKey: ["vehicles", "picker"],
    queryFn: () => listVehicles({ limit: 200, isActive: true }),
    staleTime: 5 * 60_000,
  });

  const setFilter = (key: string, value: string | number | undefined) => {
    void navigate({
      search: (prev) => ({
        ...prev,
        [key]: value || undefined,
        page: 1,
      }),
    });
  };

  const clearAll = () => {
    void navigate({ search: { page: 1 } });
  };

  const hasFilters = !!(
    filters.vehicleId ||
    filters.from ||
    filters.to ||
    filters.minDistance
  );

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="rp-vehicle">Araç</Label>
        <Select
          id="rp-vehicle"
          value={filters.vehicleId ?? ""}
          onChange={(e) => setFilter("vehicleId", e.target.value)}
          className="w-44"
        >
          <option value="">Tüm Araçlar</option>
          {vehiclesData?.items.map((v) => (
            <option key={v.id} value={v.id}>
              {v.plate}
            </option>
          ))}
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="rp-from">Başlangıç</Label>
        <Input
          id="rp-from"
          type="date"
          value={filters.from ?? ""}
          onChange={(e) => setFilter("from", e.target.value)}
          className="w-40"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="rp-to">Bitiş</Label>
        <Input
          id="rp-to"
          type="date"
          value={filters.to ?? ""}
          onChange={(e) => setFilter("to", e.target.value)}
          className="w-40"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="rp-min">Min Mesafe (km)</Label>
        <Input
          id="rp-min"
          type="number"
          min={0}
          step={1}
          value={filters.minDistance ?? ""}
          onChange={(e) => {
            const n = Number(e.target.value);
            setFilter("minDistance", n > 0 ? n : undefined);
          }}
          placeholder="0"
          className="w-28"
        />
      </div>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearAll}>
          Temizle
        </Button>
      )}
    </div>
  );
}
