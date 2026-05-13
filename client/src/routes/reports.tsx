import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/reports")({
  component: ReportsPage,
});

function ReportsPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Raporlar</h1>
    </div>
  );
}
