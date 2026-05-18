import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Activity, AlertTriangle, Car, Route as RouteIcon, Shield, Users } from "lucide-react";
import { getAdminStats } from "@/api/admin";
import { Card, CardContent, CardHeader, CardTitle, Skeleton } from "@/components/ui";

export const Route = createFileRoute("/admin/")({
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
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
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
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          icon={Users}
          title="Users"
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
          title="Vehicles"
          value={vehicles?.total ?? 0}
          color="text-success"
          items={[
            { label: "Active", value: vehicles?.active ?? 0 },
            { label: "Moving", value: vehicles?.moving ?? 0 },
            { label: "Idle", value: vehicles?.idle ?? 0 },
            { label: "Offline", value: vehicles?.offline ?? 0 },
          ]}
        />

        <StatCard
          icon={AlertTriangle}
          title="Alerts"
          value={alerts?.today ?? 0}
          color="text-danger"
          items={[
            { label: "Today", value: alerts?.today ?? 0 },
            { label: "This Week", value: alerts?.week ?? 0 },
            { label: "Unacknowledged", value: alerts?.unacknowledged ?? 0 },
          ]}
        />

        <StatCard
          icon={RouteIcon}
          title="Trips"
          value={trips?.today ?? 0}
          color="text-warning"
          items={[
            { label: "Today", value: trips?.today ?? 0 },
            { label: "This Week", value: trips?.week ?? 0 },
            { label: "Total km", value: `${(trips?.totalDistanceKm ?? 0).toFixed(0)}` },
          ]}
        />

        <StatCard
          icon={Shield}
          title="Security"
          value={users?.admins ?? 0}
          color="text-purple-600"
          items={[
            { label: "Admin Count", value: users?.admins ?? 0 },
            { label: "Active Vehicles", value: vehicles?.active ?? 0 },
          ]}
        />

        <StatCard
          icon={Activity}
          title="System"
          value="Active"
          color="text-success"
          items={[
            { label: "Refresh", value: "60s" },
            { label: "Total Vehicles", value: vehicles?.total ?? 0 },
          ]}
        />
      </div>

      {data?.topViolators && (data.topViolators as unknown[]).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Violators</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {(data.topViolators as { plate?: string; count?: number }[]).map((v, i) => (
                <div
                  key={v.plate ?? i.toString()}
                  className="rounded-md border border-gray-200 px-3 py-1.5 text-sm dark:border-gray-700"
                >
                  <span className="font-medium">{v.plate ?? "—"}</span>
                  <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">{v.count ?? 0} violation(s)</span>
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
            <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
            <p className="mt-1 text-2xl font-bold">{value}</p>
          </div>
          <Icon className={`h-5 w-5 ${color}`} />
        </div>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
          {items.map((item) => (
            <span key={item.label} className="text-xs text-gray-500 dark:text-gray-400">
              {item.label}:{" "}
              <span className="font-medium text-gray-700 dark:text-gray-300">{item.value}</span>
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
