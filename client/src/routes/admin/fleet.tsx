import { createFileRoute } from "@tanstack/react-router";
import { requireAdmin } from "@/components/guards";

export const Route = createFileRoute("/admin/fleet")({
  beforeLoad: requireAdmin,
  component: AdminFleetPage,
});

function AdminFleetPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Filo Genel Bakış</h1>
    </div>
  );
}
