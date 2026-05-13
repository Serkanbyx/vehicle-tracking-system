import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/fleet")({
  component: AdminFleetPage,
});

function AdminFleetPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Filo Genel Bakış</h1>
    </div>
  );
}
