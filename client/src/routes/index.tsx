import { createFileRoute } from "@tanstack/react-router";
import { requireAuth } from "@/components/guards";

export const Route = createFileRoute("/")({
  beforeLoad: requireAuth,
  component: DashboardPage,
});

function DashboardPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
    </div>
  );
}
