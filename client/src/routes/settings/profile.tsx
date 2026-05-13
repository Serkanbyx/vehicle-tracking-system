import { createFileRoute } from "@tanstack/react-router";
import { requireAuth } from "@/components/guards";

export const Route = createFileRoute("/settings/profile")({
  beforeLoad: requireAuth,
  component: SettingsProfilePage,
});

function SettingsProfilePage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Profil Ayarları</h1>
    </div>
  );
}
