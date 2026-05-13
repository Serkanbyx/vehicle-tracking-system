import { createFileRoute } from "@tanstack/react-router";
import { requireAuth } from "@/components/guards";

export const Route = createFileRoute("/geofences")({
  beforeLoad: requireAuth,
  component: GeofencesPage,
});

function GeofencesPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Bölge Sınırları</h1>
    </div>
  );
}
