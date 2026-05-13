import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/users")({
  component: AdminUsersPage,
});

function AdminUsersPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Kullanıcı Yönetimi</h1>
    </div>
  );
}
