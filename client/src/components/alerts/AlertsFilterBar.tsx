import { Search } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { Button, Input, Select } from "@/components/ui";
import { useDebounce } from "@/hooks/use-debounce";
import { useState, useEffect } from "react";

export interface AlertsFilters {
  q?: string;
  type?: string;
  severity?: string;
  vehicleId?: string;
  acknowledged?: string;
  from?: string;
  to?: string;
  page: number;
}

interface AlertsFilterBarProps {
  filters: AlertsFilters;
}

const TYPE_OPTIONS = [
  { value: "", label: "Tüm Tipler" },
  { value: "speed", label: "Hız" },
  { value: "idle", label: "Rölanti" },
  { value: "geofence_enter", label: "Bölge Giriş" },
  { value: "geofence_exit", label: "Bölge Çıkış" },
];

const SEVERITY_OPTIONS = [
  { value: "", label: "Tüm Düzeyler" },
  { value: "info", label: "Bilgi" },
  { value: "warning", label: "Uyarı" },
  { value: "critical", label: "Kritik" },
];

const ACK_OPTIONS = [
  { value: "", label: "Tümü" },
  { value: "false", label: "Onaylanmamış" },
  { value: "true", label: "Onaylanmış" },
];

export function AlertsFilterBar({ filters }: AlertsFilterBarProps) {
  const navigate = useNavigate({ from: "/alerts" });
  const [searchLocal, setSearchLocal] = useState(filters.q ?? "");
  const debouncedSearch = useDebounce(searchLocal, 400);

  useEffect(() => {
    if (debouncedSearch !== (filters.q ?? "")) {
      void navigate({
        search: (prev) => ({ ...prev, q: debouncedSearch || undefined, page: 1 }),
      });
    }
  }, [debouncedSearch, filters.q, navigate]);

  const setFilter = (key: string, value: string) => {
    void navigate({
      search: (prev) => ({
        ...prev,
        [key]: value || undefined,
        page: 1,
      }),
    });
  };

  const clearAll = () => {
    setSearchLocal("");
    void navigate({
      search: { page: 1 },
    });
  };

  const hasFilters = !!(
    filters.q ||
    filters.type ||
    filters.severity ||
    filters.vehicleId ||
    filters.acknowledged ||
    filters.from ||
    filters.to
  );

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="relative min-w-48 flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="Mesaj veya plaka ara…"
          value={searchLocal}
          onChange={(e) => setSearchLocal(e.target.value)}
          className="pl-9"
        />
      </div>

      <Select
        value={filters.type ?? ""}
        onChange={(e) => setFilter("type", e.target.value)}
        className="w-36"
      >
        {TYPE_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </Select>

      <Select
        value={filters.severity ?? ""}
        onChange={(e) => setFilter("severity", e.target.value)}
        className="w-36"
      >
        {SEVERITY_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </Select>

      <Select
        value={filters.acknowledged ?? ""}
        onChange={(e) => setFilter("acknowledged", e.target.value)}
        className="w-40"
      >
        {ACK_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </Select>

      <div className="flex items-center gap-2">
        <input
          type="date"
          value={filters.from ?? ""}
          onChange={(e) => setFilter("from", e.target.value)}
          className="h-9 rounded-md border border-gray-200 bg-transparent px-2 text-sm dark:border-gray-700"
        />
        <span className="text-xs text-gray-400">—</span>
        <input
          type="date"
          value={filters.to ?? ""}
          onChange={(e) => setFilter("to", e.target.value)}
          className="h-9 rounded-md border border-gray-200 bg-transparent px-2 text-sm dark:border-gray-700"
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
