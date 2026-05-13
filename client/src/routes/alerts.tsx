import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/alerts")({
  component: AlertsPage,
});

function AlertsPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Uyarılar</h1>
    </div>
  );
}
