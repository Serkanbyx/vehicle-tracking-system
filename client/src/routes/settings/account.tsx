import { createFileRoute } from "@tanstack/react-router";
import { requireAuth } from "@/components/guards";

export const Route = createFileRoute("/settings/account")({
  beforeLoad: requireAuth,
  component: SettingsAccountPage,
});

function SettingsAccountPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Hesap Ayarları</h1>
    </div>
  );
}
