import type { ReactNode } from "react";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import * as authService from "@/api/auth";
import type { UserPreferences } from "@/api/types";
import { useAuth } from "./auth.context";

const DEFAULT_MAP_DEFAULTS = {
  center: [35.2, 39.0] as [number, number],
  zoom: 6,
};

type ResolvedPreferences = Required<
  Pick<UserPreferences, "theme" | "fontSize" | "contentDensity" | "animations">
> & {
  mapDefaults: {
    center: [number, number];
    zoom: number;
  };
};

const DEFAULT_PREFERENCES: ResolvedPreferences = {
  theme: "system",
  fontSize: "md",
  contentDensity: "comfortable",
  animations: true,
  mapDefaults: DEFAULT_MAP_DEFAULTS,
};

function mergeFromUserPrefs(userPrefs: UserPreferences | undefined): ResolvedPreferences {
  if (!userPrefs) return DEFAULT_PREFERENCES;
  return {
    theme: userPrefs.theme ?? DEFAULT_PREFERENCES.theme,
    fontSize: userPrefs.fontSize ?? DEFAULT_PREFERENCES.fontSize,
    contentDensity: userPrefs.contentDensity ?? DEFAULT_PREFERENCES.contentDensity,
    animations: userPrefs.animations ?? DEFAULT_PREFERENCES.animations,
    mapDefaults: {
      center: userPrefs.mapDefaults?.center ?? DEFAULT_MAP_DEFAULTS.center,
      zoom: userPrefs.mapDefaults?.zoom ?? DEFAULT_MAP_DEFAULTS.zoom,
    },
  };
}

interface PreferencesState {
  preferences: ResolvedPreferences;
  updatePreference: <K extends keyof ResolvedPreferences>(
    key: K,
    value: ResolvedPreferences[K],
  ) => void;
}

const PreferencesContext = createContext<PreferencesState | null>(null);

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const { user, updateUser } = useAuth();

  const [preferences, setPreferences] = useState<ResolvedPreferences>(() =>
    mergeFromUserPrefs(user?.preferences),
  );

  useEffect(() => {
    if (user?.preferences) {
      setPreferences(mergeFromUserPrefs(user.preferences));
    }
  }, [user?.preferences]);

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    if (preferences.theme === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      const apply = (e: MediaQueryList | MediaQueryListEvent) =>
        root.setAttribute("data-theme", e.matches ? "dark" : "light");
      apply(mq);
      mq.addEventListener("change", apply);
      return () => mq.removeEventListener("change", apply);
    }
    root.setAttribute("data-theme", preferences.theme);

    body.classList.remove("font-sm", "font-md", "font-lg");
    body.classList.add(`font-${preferences.fontSize}`);

    body.classList.remove("density-compact", "density-comfortable", "density-spacious");
    body.classList.add(`density-${preferences.contentDensity}`);

    body.classList.toggle("no-anim", !preferences.animations);
  }, [preferences]);

  const updatePreference = useCallback(
    <K extends keyof ResolvedPreferences>(key: K, value: ResolvedPreferences[K]) => {
      setPreferences((prev) => {
        const next = { ...prev, [key]: value };

        if (user) {
          const apiPrefs = { ...user.preferences, [key]: value };
          updateUser({ preferences: apiPrefs });
          authService.updateMe({ preferences: apiPrefs }).catch(() => {
            setPreferences(prev);
          });
        }

        return next;
      });
    },
    [user, updateUser],
  );

  const contextValue = useMemo<PreferencesState>(
    () => ({ preferences, updatePreference }),
    [preferences, updatePreference],
  );

  return <PreferencesContext.Provider value={contextValue}>{children}</PreferencesContext.Provider>;
}

export function usePreferences(): PreferencesState {
  const ctx = useContext(PreferencesContext);
  if (!ctx) {
    throw new Error("usePreferences must be used within PreferencesProvider");
  }
  return ctx;
}
