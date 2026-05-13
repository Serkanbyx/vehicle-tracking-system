import { createFileRoute } from "@tanstack/react-router";
import { requireManagerOrAdmin } from "@/components/guards";

export const Route = createFileRoute("/vehicles/$id/edit")({
  beforeLoad: requireManagerOrAdmin,
  component: EditVehiclePage,
});

function EditVehiclePage() {
  const { id } = Route.useParams();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Araç Düzenle — {id}</h1>
    </div>
  );
}
