import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useCallback, useMemo } from "react";
import { Search } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { toast } from "sonner";
import { requireAdmin } from "@/components/guards";
import { getAdminFleet } from "@/api/admin";
import { bulkActivate } from "@/api/vehicles";
import type { FleetVehicle, VehicleType } from "@/api/types";
import { useDebounce } from "@/hooks/use-debounce";
import { Badge, Button, Input, Select, Switch } from "@/components/ui";
import { StatusBadge } from "@/components/common";

interface FleetSearch {
  type?: string;
  status?: string;
  tag?: string;
  q?: string;
}

export const Route = createFileRoute("/admin/fleet")({
  beforeLoad: requireAdmin,
  validateSearch: (raw: Record<string, unknown>): FleetSearch => ({
    type: typeof raw.type === "string" ? raw.type : undefined,
    status: typeof raw.status === "string" ? raw.status : undefined,
    tag: typeof raw.tag === "string" ? raw.tag : undefined,
    q: typeof raw.q === "string" ? raw.q : undefined,
  }),
  component: AdminFleetPage,
});

const TYPE_LABELS: Record<VehicleType, string> = {
  car: "Otomobil",
  truck: "Kamyon",
  van: "Van",
  motorcycle: "Motorsiklet",
  bus: "Otobüs",
  other: "Diğer",
};

function AdminFleetPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/admin/fleet" });
  const queryClient = useQueryClient();

  const [searchLocal, setSearchLocal] = useState(search.q ?? "");
  const debouncedSearch = useDebounce(searchLocal, 400);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  const { data: fleet } = useQuery({
    queryKey: ["admin", "fleet"],
    queryFn: getAdminFleet,
  });

  const filtered = useMemo(() => {
    if (!fleet) return [];
    return fleet.filter((v) => {
      if (search.type && v.vehicleType !== search.type) return false;
      if (
        search.status &&
        (v.lastLocation?.status ?? "offline") !== search.status
      )
        return false;
      if (search.tag && !v.tags.includes(search.tag)) return false;
      if (debouncedSearch) {
        const q = debouncedSearch.toLowerCase();
        if (
          !v.plate.toLowerCase().includes(q) &&
          !(v.model ?? "").toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [fleet, search.type, search.status, search.tag, debouncedSearch]);

  const allTags = useMemo(() => {
    if (!fleet) return [];
    const set = new Set<string>();
    for (const v of fleet) for (const t of v.tags) set.add(t);
    return [...set].sort();
  }, [fleet]);

  const setFilter = (key: string, value: string) => {
    void navigate({
      search: (prev) => ({ ...prev, [key]: value || undefined }),
    });
  };

  const handleToggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleToggleAll = useCallback(() => {
    setSelectedIds((prev) => {
      const allSelected = filtered.every((v) => prev.has(v.id));
      if (allSelected) return new Set();
      return new Set(filtered.map((v) => v.id));
    });
  }, [filtered]);

  const handleBulkActivate = useCallback(
    async (isActive: boolean) => {
      if (selectedIds.size === 0) return;
      setBulkLoading(true);
      try {
        await bulkActivate([...selectedIds], isActive);
        await queryClient.invalidateQueries({ queryKey: ["admin", "fleet"] });
        setSelectedIds(new Set());
        toast.success(
          `${selectedIds.size} araç ${isActive ? "aktif" : "pasif"} yapıldı.`,
        );
      } catch {
        toast.error("Toplu işlem başarısız.");
      } finally {
        setBulkLoading(false);
      }
    },
    [selectedIds, queryClient],
  );

  const handleRowClick = useCallback(
    (vehicleId: string) => {
      void navigate({ to: "/vehicles/$id", params: { id: vehicleId } });
    },
    [navigate],
  );

  const allChecked =
    filtered.length > 0 && filtered.every((v) => selectedIds.has(v.id));

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Filo Genel Bakış</h1>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-48 flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Plaka veya model ara…"
            value={searchLocal}
            onChange={(e) => setSearchLocal(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={search.type ?? ""}
          onChange={(e) => setFilter("type", e.target.value)}
          className="w-36"
        >
          <option value="">Tüm Tipler</option>
          {Object.entries(TYPE_LABELS).map(([val, lbl]) => (
            <option key={val} value={val}>
              {lbl}
            </option>
          ))}
        </Select>
        <Select
          value={search.status ?? ""}
          onChange={(e) => setFilter("status", e.target.value)}
          className="w-36"
        >
          <option value="">Tüm Durum</option>
          <option value="moving">Hareket</option>
          <option value="idle">Rölanti</option>
          <option value="offline">Çevrimdışı</option>
        </Select>
        {allTags.length > 0 && (
          <Select
            value={search.tag ?? ""}
            onChange={(e) => setFilter("tag", e.target.value)}
            className="w-36"
          >
            <option value="">Tüm Etiketler</option>
            {allTags.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
        )}
      </div>

      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 rounded-md border border-brand-200 bg-brand-50 px-4 py-2 dark:border-brand-700 dark:bg-brand-900/10">
          <span className="text-sm font-medium">
            {selectedIds.size} araç seçildi
          </span>
          <Button
            size="sm"
            onClick={() => handleBulkActivate(true)}
            disabled={bulkLoading}
          >
            Aktifleştir
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleBulkActivate(false)}
            disabled={bulkLoading}
          >
            Pasifleştir
          </Button>
        </div>
      )}

      <div className="overflow-x-auto rounded-md border border-gray-200 dark:border-gray-700">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
            <tr>
              <th className="w-10 px-3 py-2">
                <input
                  type="checkbox"
                  checked={allChecked}
                  onChange={handleToggleAll}
                  className="accent-brand-600"
                />
              </th>
              <th className="px-3 py-2">Plaka</th>
              <th className="px-3 py-2">Tip</th>
              <th className="px-3 py-2">Durum</th>
              <th className="px-3 py-2">Aktif</th>
              <th className="px-3 py-2">Etiketler</th>
              <th className="px-3 py-2">Uyarılar</th>
              <th className="px-3 py-2">Oluşturulma</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((v) => (
              <tr
                key={v.id}
                className="cursor-pointer border-b border-gray-100 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50"
                onClick={() => handleRowClick(v.id)}
              >
                <td
                  className="px-3 py-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.has(v.id)}
                    onChange={() => handleToggleSelect(v.id)}
                    className="accent-brand-600"
                  />
                </td>
                <td className="px-3 py-2 font-medium">{v.plate}</td>
                <td className="px-3 py-2 text-gray-500">
                  {TYPE_LABELS[v.vehicleType] ?? v.vehicleType}
                </td>
                <td className="px-3 py-2">
                  <StatusBadge
                    status={v.lastLocation?.status ?? "offline"}
                  />
                </td>
                <td
                  className="px-3 py-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Switch checked={v.isActive} disabled />
                </td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-1">
                    {v.tags.slice(0, 3).map((t) => (
                      <Badge key={t} variant="outline" className="text-[10px]">
                        {t}
                      </Badge>
                    ))}
                    {v.tags.length > 3 && (
                      <span className="text-xs text-gray-400">
                        +{v.tags.length - 3}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-3 py-2 text-xs text-gray-500">
                  {v.recentAlertCount ?? 0}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-xs text-gray-500">
                  {formatDistanceToNow(new Date(v.createdAt), {
                    addSuffix: true,
                    locale: tr,
                  })}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="px-3 py-8 text-center text-gray-400"
                >
                  Araç bulunamadı
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-500">
        Toplam: {filtered.length} araç
        {fleet && fleet.length !== filtered.length && ` / ${fleet.length}`}
      </p>
    </div>
  );
}
