import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/vehicles/$id")({
  component: VehicleDetailPage,
});

function VehicleDetailPage() {
  const { id } = Route.useParams();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Araç Detayı — {id}</h1>
    </div>
  );
}
