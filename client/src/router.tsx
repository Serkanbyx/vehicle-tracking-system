import type { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import type { useAuth } from "./context/auth.context";
import { routeTree } from "./routeTree.gen";

export interface RouterContext {
  auth: ReturnType<typeof useAuth>;
  queryClient: QueryClient;
}

export const router = createRouter({
  routeTree,
  context: { auth: undefined!, queryClient: undefined! },
  defaultPreload: "intent",
  defaultPreloadStaleTime: 0,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
