import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/settings/account")({
  component: SettingsAccountPage,
});

function SettingsAccountPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Hesap Ayarları</h1>
    </div>
  );
}
