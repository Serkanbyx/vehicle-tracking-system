import { createFileRoute } from "@tanstack/react-router";
import { requireAuth } from "@/components/guards";

export const Route = createFileRoute("/settings/appearance")({
  beforeLoad: requireAuth,
  component: SettingsAppearancePage,
});

function SettingsAppearancePage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Görünüm Ayarları</h1>
    </div>
  );
}
