import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  acknowledgeAlert,
  acknowledgeMany,
  type ListAlertsQuery,
  listAlerts,
  removeAlert,
} from "@/api/alerts";
import type { Alert, Pagination } from "@/api/types";
import { dashboardSocket } from "@/api/ws";
import type { AlertsFilters } from "@/components/alerts";
import { AlertsFilterBar, AlertsStats, AlertsTable, BulkActionBar } from "@/components/alerts";
import { PageNavigator, TableRowSkeleton } from "@/components/common";
import { requireAuth } from "@/components/guards";

interface AlertsSearch {
  q?: string;
  type?: string;
  severity?: string;
  vehicleId?: string;
  acknowledged?: string;
  from?: string;
  to?: string;
  page?: number;
}

export const Route = createFileRoute("/alerts")({
  beforeLoad: requireAuth,
  validateSearch: (raw: Record<string, unknown>): AlertsSearch => ({
    q: typeof raw.q === "string" ? raw.q : undefined,
    type: typeof raw.type === "string" ? raw.type : undefined,
    severity: typeof raw.severity === "string" ? raw.severity : undefined,
    vehicleId: typeof raw.vehicleId === "string" ? raw.vehicleId : undefined,
    acknowledged: typeof raw.acknowledged === "string" ? raw.acknowledged : undefined,
    from: typeof raw.from === "string" ? raw.from : undefined,
    to: typeof raw.to === "string" ? raw.to : undefined,
    page: typeof raw.page === "number" && raw.page >= 1 ? Math.floor(raw.page) : 1,
  }),
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) => {
    const query = buildQuery(deps);
    return context.queryClient.ensureQueryData({
      queryKey: ["alerts", query],
      queryFn: () => listAlerts(query),
    });
  },
  component: AlertsPage,
});

function buildQuery(search: AlertsSearch): ListAlertsQuery {
  return {
    page: search.page ?? 1,
    limit: 20,
    type: search.type || undefined,
    severity: search.severity || undefined,
    vehicleId: search.vehicleId || undefined,
    acknowledged:
      search.acknowledged === "true" ? true : search.acknowledged === "false" ? false : undefined,
    from: search.from || undefined,
    to: search.to || undefined,
  };
}

function matchesFilters(alert: Alert, search: AlertsSearch): boolean {
  if (search.type && alert.type !== search.type) return false;
  if (search.severity && alert.severity !== search.severity) return false;
  if (search.vehicleId && alert.vehicleId !== search.vehicleId) return false;
  if (search.acknowledged === "true" && !alert.acknowledged) return false;
  if (search.acknowledged === "false" && alert.acknowledged) return false;
  return true;
}

function AlertsPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/alerts" });
  const queryClient = useQueryClient();

  const query = buildQuery(search);
  const { data, isLoading } = useQuery({
    queryKey: ["alerts", query],
    queryFn: () => listAlerts(query),
  });

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  const filters: AlertsFilters = {
    q: search.q,
    type: search.type,
    severity: search.severity,
    vehicleId: search.vehicleId,
    acknowledged: search.acknowledged,
    from: search.from,
    to: search.to,
    page: search.page ?? 1,
  };

  useEffect(() => {
    return dashboardSocket.on("alert:new", (payload) => {
      const alert = payload.alert as Alert | undefined;
      if (!alert) return;

      if (matchesFilters(alert, search)) {
        queryClient.setQueryData<Pagination<Alert>>(["alerts", query], (old) =>
          old ? { ...old, items: [alert, ...old.items], total: old.total + 1 } : old,
        );
      }

      queryClient.invalidateQueries({ queryKey: ["alerts", "stats"] });
    });
  }, [search, query, queryClient]);

  const handleToggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleToggleAll = useCallback(() => {
    if (!data) return;
    setSelectedIds((prev) => {
      const allSelected = data.items.every((a) => prev.has(a.id));
      if (allSelected) return new Set();
      return new Set(data.items.map((a) => a.id));
    });
  }, [data]);

  const handleAcknowledge = useCallback(
    async (id: string) => {
      try {
        await acknowledgeAlert(id);
        await queryClient.invalidateQueries({ queryKey: ["alerts"] });
        toast.success("Uyarı onaylandı.");
      } catch {
        toast.error("Uyarı onaylanamadı.");
      }
    },
    [queryClient],
  );

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await removeAlert(id);
        await queryClient.invalidateQueries({ queryKey: ["alerts"] });
        toast.success("Uyarı silindi.");
      } catch {
        toast.error("Uyarı silinemedi.");
      }
    },
    [queryClient],
  );

  const handleBulkAck = useCallback(async () => {
    if (selectedIds.size === 0) return;
    setBulkLoading(true);
    try {
      await acknowledgeMany([...selectedIds]);
      await queryClient.invalidateQueries({ queryKey: ["alerts"] });
      setSelectedIds(new Set());
      toast.success(`${selectedIds.size} uyarı onaylandı.`);
    } catch {
      toast.error("Toplu onaylama başarısız.");
    } finally {
      setBulkLoading(false);
    }
  }, [selectedIds, queryClient]);

  const handlePageChange = useCallback(
    (page: number) => {
      void navigate({ search: (prev) => ({ ...prev, page }) });
      setSelectedIds(new Set());
    },
    [navigate],
  );

  return (
    <div className="mx-auto max-w-7xl space-y-4 p-4">
      <h1 className="text-2xl font-bold">Uyarılar</h1>

      <AlertsFilterBar filters={filters} />
      <AlertsStats />
      <BulkActionBar
        selectedIds={selectedIds}
        onAcknowledge={handleBulkAck}
        loading={bulkLoading}
      />

      {isLoading ? (
        <TableRowSkeleton columns={9} rows={5} />
      ) : (
        <AlertsTable
          alerts={data?.items ?? []}
          selectedIds={selectedIds}
          onToggleSelect={handleToggleSelect}
          onToggleAll={handleToggleAll}
          onAcknowledge={handleAcknowledge}
          onDelete={handleDelete}
        />
      )}

      <PageNavigator
        page={search.page ?? 1}
        totalPages={data?.totalPages ?? 1}
        onPageChange={handlePageChange}
      />
    </div>
  );
}
