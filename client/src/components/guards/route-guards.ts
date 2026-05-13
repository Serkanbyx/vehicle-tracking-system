import { redirect } from "@tanstack/react-router";
import type { RouterContext } from "@/router";

interface BeforeLoadArgs {
  context: RouterContext;
  location: { href: string };
}

export function requireAuth({ context, location }: BeforeLoadArgs): void {
  if (!context.auth.user) {
    throw redirect({ to: "/login", search: { redirect: location.href } });
  }
}

export function requireAdmin({ context, location }: BeforeLoadArgs): void {
  requireAuth({ context, location });
  if (context.auth.user!.role !== "admin") {
    throw redirect({ to: "/" });
  }
}

export function requireManagerOrAdmin({ context, location }: BeforeLoadArgs): void {
  requireAuth({ context, location });
  if (context.auth.user!.role === "viewer") {
    throw redirect({ to: "/" });
  }
}

export function requireGuest({ context }: Pick<BeforeLoadArgs, "context"> & { search: Record<string, unknown> }): void {
  if (context.auth.user) {
    throw redirect({ to: "/" });
  }
}
