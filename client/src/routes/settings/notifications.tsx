import { createFileRoute } from "@tanstack/react-router";
import { requireAuth } from "@/components/guards";

export const Route = createFileRoute("/settings/notifications")({
  beforeLoad: requireAuth,
  component: SettingsNotificationsPage,
});

function SettingsNotificationsPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Bildirim Ayarları</h1>
    </div>
  );
}
