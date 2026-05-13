import { createFileRoute } from "@tanstack/react-router";
import { requireAdmin } from "@/components/guards";

export const Route = createFileRoute("/admin/users")({
  beforeLoad: requireAdmin,
  component: AdminUsersPage,
});

function AdminUsersPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Kullanıcı Yönetimi</h1>
    </div>
  );
}
