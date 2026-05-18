import { createFileRoute } from "@tanstack/react-router";
import { useCallback } from "react";
import { toast } from "sonner";
import * as authService from "@/api/auth";
import type { UserPreferences } from "@/api/types";
import { Card, CardContent, CardHeader, CardTitle, Label, Select, Switch } from "@/components/ui";
import { useAuth } from "@/context/auth.context";

export const Route = createFileRoute("/settings/notifications")({
  component: SettingsNotificationsPage,
});

function SettingsNotificationsPage() {
  const { user, updateUser } = useAuth();

  const notifications = user?.preferences.notifications ?? {
    email: true,
    inApp: true,
    severityThreshold: "info" as const,
  };

  const saveNotifications = useCallback(
    (patch: Partial<NonNullable<UserPreferences["notifications"]>>) => {
      if (!user) return;
      const next = { ...notifications, ...patch };
      const prefs: UserPreferences = {
        ...user.preferences,
        notifications: next,
      };
      updateUser({ preferences: prefs });
      authService.updateMe({ preferences: prefs }).catch(() => {
        toast.error("Bildirim ayarları kaydedilemedi.");
      });
    },
    [user, updateUser, notifications],
  );

  if (!user) return null;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Bildirim Ayarları</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">E-posta Bildirimleri</CardTitle>
        </CardHeader>
        <CardContent>
          <label htmlFor="notify-email" className="flex items-center gap-3">
            <Switch
              id="notify-email"
              checked={notifications.email ?? true}
              onCheckedChange={(v) => saveNotifications({ email: v })}
            />
            <span className="text-sm">Uyarılar için e-posta bildirimi al</span>
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Uygulama İçi Bildirimler</CardTitle>
        </CardHeader>
        <CardContent>
          <label htmlFor="notify-inapp" className="flex items-center gap-3">
            <Switch
              id="notify-inapp"
              checked={notifications.inApp ?? true}
              onCheckedChange={(v) => saveNotifications({ inApp: v })}
            />
            <span className="text-sm">Uygulama içi anlık bildirim göster</span>
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Önem Eşiği</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <Label htmlFor="severity-threshold">Yalnızca bu düzey ve üzeri bildirimler gelsin</Label>
          <Select
            id="severity-threshold"
            value={notifications.severityThreshold ?? "info"}
            onChange={(e) =>
              saveNotifications({
                severityThreshold: e.target.value as "info" | "warning" | "critical",
              })
            }
            className="max-w-xs"
          >
            <option value="info">Bilgi (Tümü)</option>
            <option value="warning">Uyarı ve üzeri</option>
            <option value="critical">Yalnızca Kritik</option>
          </Select>
          <p className="text-xs text-gray-500">
            Seçtiğiniz düzeyin altındaki bildirimler gösterilmez.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
