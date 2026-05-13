import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/vehicles/")({
  component: VehicleListPage,
});

function VehicleListPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Araçlar</h1>
    </div>
  );
}
