import { useNavigate } from "@tanstack/react-router";
import { Plus, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { Button, Input, Select } from "@/components/ui";
import { useAuth } from "@/context/auth.context";
import { useDebounce } from "@/hooks/use-debounce";

const VEHICLE_TYPES = ["car", "truck", "van", "motorcycle", "bus", "other"] as const;
const STATUSES = ["moving", "idle", "offline"] as const;
const SORTS = [
  { value: "recent", label: "Son Güncelleme" },
  { value: "plate", label: "Plaka" },
  { value: "speed", label: "Hız" },
] as const;

interface VehicleFiltersProps {
  search: {
    q?: string;
    vehicleType?: string;
    status?: string;
    sort?: string;
    page?: number;
  };
}

export function VehicleFilters({ search }: VehicleFiltersProps) {
  const navigate = useNavigate({ from: "/vehicles/" });
  const { hasRole } = useAuth();
  const [query, setQuery] = useState(search.q ?? "");
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (debouncedQuery !== (search.q ?? "")) {
      void navigate({
        search: (prev) => ({
          ...prev,
          q: debouncedQuery || undefined,
          page: 1,
        }),
      });
    }
  }, [debouncedQuery]);

  const updateSearch = (key: string, value: string | undefined) => {
    void navigate({
      search: (prev) => ({ ...prev, [key]: value || undefined, page: 1 }),
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative min-w-[200px] flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="Plaka veya sürücü ara…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      <Select
        value={search.vehicleType ?? ""}
        onChange={(e) => updateSearch("vehicleType", e.target.value)}
        className="w-36"
      >
        <option value="">Tüm Türler</option>
        {VEHICLE_TYPES.map((t) => (
          <option key={t} value={t}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </option>
        ))}
      </Select>

      <Select
        value={search.status ?? ""}
        onChange={(e) => updateSearch("status", e.target.value)}
        className="w-32"
      >
        <option value="">Tüm Durumlar</option>
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {s === "moving" ? "Hareket" : s === "idle" ? "Boşta" : "Çevrimdışı"}
          </option>
        ))}
      </Select>

      <Select
        value={search.sort ?? "recent"}
        onChange={(e) => updateSearch("sort", e.target.value)}
        className="w-40"
      >
        {SORTS.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </Select>

      {hasRole("manager", "admin") && (
        <Button asChild>
          <a href="/vehicles/new">
            <Plus className="mr-1.5 h-4 w-4" />
            Yeni Araç
          </a>
        </Button>
      )}
    </div>
  );
}
