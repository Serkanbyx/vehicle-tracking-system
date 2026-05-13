import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/vehicles/new")({
  component: NewVehiclePage,
});

function NewVehiclePage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Yeni Araç</h1>
    </div>
  );
}
