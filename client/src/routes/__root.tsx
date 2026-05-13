import { Outlet, createRootRoute } from "@tanstack/react-router";
import { AuthProvider } from "@/context/auth.context";
import { PreferencesProvider } from "@/context/preferences.context";

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  return (
    <AuthProvider>
      <PreferencesProvider>
        <div className="min-h-screen bg-background text-foreground">
          <Outlet />
        </div>
      </PreferencesProvider>
    </AuthProvider>
  );
}
