import { createFileRoute } from "@tanstack/react-router";
import { requireAuth } from "@/components/guards";

export const Route = createFileRoute("/reports")({
  beforeLoad: requireAuth,
  component: ReportsPage,
});

function ReportsPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Raporlar</h1>
    </div>
  );
}
