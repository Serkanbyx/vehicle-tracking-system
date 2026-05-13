import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "./context/auth.context";
import { PreferencesProvider } from "./context/preferences.context";
import { router } from "./router";
import type { ApiError } from "./api/client";
import "./styles/globals.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (count, error) =>
        (error as ApiError)?.status !== 401 && count < 2,
      refetchOnWindowFocus: false,
    },
    mutations: { retry: 0 },
  },
});

function RouterProviderWithAuthContext() {
  const auth = useAuth();
  return <RouterProvider router={router} context={{ auth, queryClient }} />;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <PreferencesProvider>
          <Toaster richColors closeButton position="top-right" />
          <RouterProviderWithAuthContext />
        </PreferencesProvider>
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
);
