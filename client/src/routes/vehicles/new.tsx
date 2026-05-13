import { createFileRoute } from "@tanstack/react-router";
import { requireManagerOrAdmin } from "@/components/guards";

export const Route = createFileRoute("/vehicles/new")({
  beforeLoad: requireManagerOrAdmin,
  component: NewVehiclePage,
});

function NewVehiclePage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Yeni Araç</h1>
    </div>
  );
}
