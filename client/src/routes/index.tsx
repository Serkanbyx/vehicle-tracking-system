import { createFileRoute } from "@tanstack/react-router";
import { requireAuth } from "@/components/guards";
import { StatsRow } from "@/components/common/StatsRow";
import { RecentAlerts } from "@/components/common/RecentAlerts";
import { TopViolators } from "@/components/common/TopViolators";
import { LiveMap } from "@/components/map";

export const Route = createFileRoute("/")({
  beforeLoad: requireAuth,
  component: DashboardPage,
});

function DashboardPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-4 p-4">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <StatsRow />

      <div
        className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700"
        style={{ height: "clamp(320px, calc(100vh - 20rem), 600px)" }}
      >
        <LiveMap />
      </div>

      <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
        <RecentAlerts />
        <TopViolators />
      </div>
    </div>
  );
}
