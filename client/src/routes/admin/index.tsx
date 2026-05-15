import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Activity, AlertTriangle, Car, Route as RouteIcon, Shield, Users } from "lucide-react";
import { getAdminStats } from "@/api/admin";
import { requireAdmin } from "@/components/guards";
import { Card, CardContent, CardHeader, CardTitle, Skeleton } from "@/components/ui";

export const Route = createFileRoute("/admin/")({
  beforeLoad: requireAdmin,
  component: AdminDashboardPage,
});

function AdminDashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: getAdminStats,
    refetchInterval: 60_000,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Yönetim Paneli</h1>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={`skel-${i.toString()}`} className="h-28" />
          ))}
        </div>
      </div>
    );
  }

  const users = data?.users as
    | { total: number; admins: number; managers: number; viewers: number }
    | undefined;
  const vehicles = data?.vehicles as
    | { total: number; active: number; moving: number; idle: number; offline: number }
    | undefined;
  const alerts = data?.alerts as
    | { today: number; week: number; unacknowledged: number }
    | undefined;
  const trips = data?.trips as { today: number; week: number; totalDistanceKm: number } | undefined;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Yönetim Paneli</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          icon={Users}
          title="Kullanıcılar"
          value={users?.total ?? 0}
          color="text-brand-600"
          items={[
            { label: "Admin", value: users?.admins ?? 0 },
            { label: "Manager", value: users?.managers ?? 0 },
            { label: "Viewer", value: users?.viewers ?? 0 },
          ]}
        />

        <StatCard
          icon={Car}
          title="Araçlar"
          value={vehicles?.total ?? 0}
          color="text-success"
          items={[
            { label: "Aktif", value: vehicles?.active ?? 0 },
            { label: "Hareket", value: vehicles?.moving ?? 0 },
            { label: "Rölanti", value: vehicles?.idle ?? 0 },
            { label: "Çevrimdışı", value: vehicles?.offline ?? 0 },
          ]}
        />

        <StatCard
          icon={AlertTriangle}
          title="Uyarılar"
          value={alerts?.today ?? 0}
          color="text-danger"
          items={[
            { label: "Bugün", value: alerts?.today ?? 0 },
            { label: "Bu Hafta", value: alerts?.week ?? 0 },
            { label: "Onaysız", value: alerts?.unacknowledged ?? 0 },
          ]}
        />

        <StatCard
          icon={RouteIcon}
          title="Seferler"
          value={trips?.today ?? 0}
          color="text-warning"
          items={[
            { label: "Bugün", value: trips?.today ?? 0 },
            { label: "Bu Hafta", value: trips?.week ?? 0 },
            { label: "Toplam km", value: `${(trips?.totalDistanceKm ?? 0).toFixed(0)}` },
          ]}
        />

        <StatCard
          icon={Shield}
          title="Güvenlik"
          value={users?.admins ?? 0}
          color="text-purple-600"
          items={[
            { label: "Admin Sayısı", value: users?.admins ?? 0 },
            { label: "Aktif Araç", value: vehicles?.active ?? 0 },
          ]}
        />

        <StatCard
          icon={Activity}
          title="Sistem"
          value="Aktif"
          color="text-success"
          items={[
            { label: "Yenileme", value: "60s" },
            { label: "Toplam Araç", value: vehicles?.total ?? 0 },
          ]}
        />
      </div>

      {data?.topViolators && (data.topViolators as unknown[]).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">En Çok İhlal Edenler</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {(data.topViolators as { plate?: string; count?: number }[]).map((v, i) => (
                <div
                  key={v.plate ?? i.toString()}
                  className="rounded-md border border-gray-200 px-3 py-1.5 text-sm dark:border-gray-700"
                >
                  <span className="font-medium">{v.plate ?? "—"}</span>
                  <span className="ml-2 text-xs text-gray-500">{v.count ?? 0} ihlal</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface StatCardProps {
  icon: typeof Users;
  title: string;
  value: number | string;
  color: string;
  items: { label: string; value: number | string }[];
}

function StatCard({ icon: Icon, title, value, color, items }: StatCardProps) {
  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-500">{title}</p>
            <p className="mt-1 text-2xl font-bold">{value}</p>
          </div>
          <Icon className={`h-5 w-5 ${color}`} />
        </div>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
          {items.map((item) => (
            <span key={item.label} className="text-xs text-gray-500">
              {item.label}:{" "}
              <span className="font-medium text-gray-700 dark:text-gray-300">{item.value}</span>
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
