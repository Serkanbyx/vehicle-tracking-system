import { createFileRoute } from "@tanstack/react-router";
import { requireAuth } from "@/components/guards";

export const Route = createFileRoute("/vehicles/")({
  beforeLoad: requireAuth,
  component: VehicleListPage,
});

function VehicleListPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Araçlar</h1>
    </div>
  );
}
