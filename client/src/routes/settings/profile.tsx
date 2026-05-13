import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/settings/profile")({
  component: SettingsProfilePage,
});

function SettingsProfilePage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Profil Ayarları</h1>
    </div>
  );
}
