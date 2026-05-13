import { createFileRoute } from "@tanstack/react-router";
import { requireAdmin } from "@/components/guards";

export const Route = createFileRoute("/admin/")({
  beforeLoad: requireAdmin,
  component: AdminDashboardPage,
});

function AdminDashboardPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Yönetim Paneli</h1>
    </div>
  );
}
