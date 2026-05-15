import type { ReactNode } from "react";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { dashboardSocket, setAccessToken } from "@/api";
import * as authService from "@/api/auth";
import type { User, UserRole } from "@/api/types";
import { router } from "@/router";

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (patch: Partial<User>) => void;
  hasRole: (...roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await authService.refresh();
        setAccessToken(data.accessToken);
        const me = await authService.getMe();
        setUser(me);
        dashboardSocket.connect(data.accessToken);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    const handleLogout = () => {
      setUser(null);
      dashboardSocket.disconnect();
      router.navigate({ to: "/login" });
    };

    window.addEventListener("auth:logout", handleLogout);
    return () => window.removeEventListener("auth:logout", handleLogout);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await authService.login({ email, password });
    setUser(data.user);
    dashboardSocket.connect(data.accessToken);
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const data = await authService.register({ name, email, password });
    setUser(data.user);
    dashboardSocket.connect(data.accessToken);
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
    dashboardSocket.disconnect();
    router.navigate({ to: "/login" });
  }, []);

  const updateUser = useCallback((patch: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...patch } : null));
  }, []);

  const hasRole = useCallback(
    (...roles: UserRole[]) => {
      if (!user) return false;
      return roles.includes(user.role);
    },
    [user],
  );

  const value = useMemo<AuthState>(
    () => ({ user, loading, login, register, logout, updateUser, hasRole }),
    [user, loading, login, register, logout, updateUser, hasRole],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
