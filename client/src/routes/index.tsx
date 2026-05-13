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
      <div className="h-[500px] overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
        <LiveMap />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <RecentAlerts />
        <TopViolators />
      </div>
    </div>
  );
}
