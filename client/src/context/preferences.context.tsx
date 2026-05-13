import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import * as authService from "@/api/auth";
import { useAuth } from "./auth.context";
import type { UserPreferences } from "@/api/types";

const DEFAULT_PREFERENCES: Required<
  Pick<UserPreferences, "theme" | "fontSize" | "contentDensity" | "animations">
> = {
  theme: "system",
  fontSize: "md",
  contentDensity: "comfortable",
  animations: true,
};

type ResolvedPreferences = typeof DEFAULT_PREFERENCES;

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

  const [preferences, setPreferences] = useState<ResolvedPreferences>(() => ({
    ...DEFAULT_PREFERENCES,
    ...user?.preferences,
  }));

  useEffect(() => {
    if (user?.preferences) {
      setPreferences((prev) => ({ ...prev, ...user.preferences }));
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

    body.classList.remove(
      "density-compact",
      "density-comfortable",
      "density-spacious",
    );
    body.classList.add(`density-${preferences.contentDensity}`);

    body.classList.toggle("no-anim", !preferences.animations);
  }, [preferences]);

  const updatePreference = useCallback(
    <K extends keyof ResolvedPreferences>(
      key: K,
      value: ResolvedPreferences[K],
    ) => {
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

  return (
    <PreferencesContext.Provider value={contextValue}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences(): PreferencesState {
  const ctx = useContext(PreferencesContext);
  if (!ctx) {
    throw new Error("usePreferences must be used within PreferencesProvider");
  }
  return ctx;
}
