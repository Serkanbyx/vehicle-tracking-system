import { createFileRoute } from "@tanstack/react-router";
import { Monitor, Moon, Sun } from "lucide-react";
import { useCallback } from "react";
import { toast } from "sonner";
import * as authService from "@/api/auth";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Slider,
  Switch,
} from "@/components/ui";
import { useAuth } from "@/context/auth.context";
import { usePreferences } from "@/context/preferences.context";

export const Route = createFileRoute("/settings/appearance")({
  component: SettingsAppearancePage,
});

function SettingsAppearancePage() {
  const { user, updateUser } = useAuth();
  const { preferences, updatePreference } = usePreferences();

  const saveMapDefaults = useCallback(
    (patch: { center?: [number, number]; zoom?: number }) => {
      if (!user) return;
      const current = user.preferences.mapDefaults ?? {
        center: [35.2, 39.0] as [number, number],
        zoom: 6,
      };
      const next = { ...current, ...patch };
      const prefs = { ...user.preferences, mapDefaults: next };
      updateUser({ preferences: prefs });
      authService.updateMe({ preferences: prefs }).catch(() => {
        toast.error("Failed to save map settings.");
      });
    },
    [user, updateUser],
  );

  const mapDefaults = user?.preferences.mapDefaults ?? {
    center: [35.2, 39.0] as [number, number],
    zoom: 6,
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Appearance Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Theme</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <ThemeOption
              icon={Sun}
              label="Light"
              value="light"
              active={preferences.theme === "light"}
              onClick={() => updatePreference("theme", "light")}
            />
            <ThemeOption
              icon={Moon}
              label="Dark"
              value="dark"
              active={preferences.theme === "dark"}
              onClick={() => updatePreference("theme", "dark")}
            />
            <ThemeOption
              icon={Monitor}
              label="System"
              value="system"
              active={preferences.theme === "system"}
              onClick={() => updatePreference("theme", "system")}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Font Size</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {(["sm", "md", "lg"] as const).map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => updatePreference("fontSize", size)}
                className={`rounded-md border px-4 py-2 text-sm transition-colors ${
                  preferences.fontSize === size
                    ? "border-brand-500 bg-brand-50 font-semibold text-brand-600 dark:bg-brand-900/10"
                    : "border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                }`}
              >
                {size === "sm" ? "Small" : size === "md" ? "Medium" : "Large"}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Content Density</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {(["compact", "comfortable", "spacious"] as const).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => updatePreference("contentDensity", d)}
                className={`rounded-md border px-4 py-2 text-sm transition-colors ${
                  preferences.contentDensity === d
                    ? "border-brand-500 bg-brand-50 font-semibold text-brand-600 dark:bg-brand-900/10"
                    : "border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                }`}
              >
                {d === "compact" ? "Compact" : d === "comfortable" ? "Comfortable" : "Spacious"}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Animations</CardTitle>
        </CardHeader>
        <CardContent>
          <label htmlFor="pref-animations" className="flex items-center gap-3">
            <Switch
              id="pref-animations"
              checked={preferences.animations}
              onCheckedChange={(v) => updatePreference("animations", v)}
            />
            <span className="text-sm">Enable animations</span>
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Default Map Center</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="map-lat">Latitude</Label>
              <Input
                id="map-lat"
                type="number"
                step="0.0001"
                value={mapDefaults.center?.[1] ?? 39.0}
                onChange={(e) => {
                  const lat = Number(e.target.value);
                  const lng = mapDefaults.center?.[0] ?? 35.2;
                  saveMapDefaults({ center: [lng, lat] });
                }}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="map-lng">Longitude</Label>
              <Input
                id="map-lng"
                type="number"
                step="0.0001"
                value={mapDefaults.center?.[0] ?? 35.2}
                onChange={(e) => {
                  const lng = Number(e.target.value);
                  const lat = mapDefaults.center?.[1] ?? 39.0;
                  saveMapDefaults({ center: [lng, lat] });
                }}
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Zoom: {mapDefaults.zoom ?? 6}</Label>
            <Slider
              value={[mapDefaults.zoom ?? 6]}
              onValueChange={(v) => {
                const zoom = v[0];
                if (zoom !== undefined) saveMapDefaults({ zoom });
              }}
              min={3}
              max={18}
              step={1}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface ThemeOptionProps {
  icon: typeof Sun;
  label: string;
  value: string;
  active: boolean;
  onClick: () => void;
}

function ThemeOption({ icon: Icon, label, active, onClick }: ThemeOptionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 rounded-md border px-4 py-2.5 text-sm transition-colors ${
        active
          ? "border-brand-500 bg-brand-50 font-semibold text-brand-600 dark:bg-brand-900/10"
          : "border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}
