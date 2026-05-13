import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboardPage,
});

function AdminDashboardPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Yönetim Paneli</h1>
    </div>
  );
}
