import { createFileRoute } from "@tanstack/react-router";
import { requireAuth } from "@/components/guards";
import { SettingsLayout } from "@/components/layout/SettingsLayout";

export const Route = createFileRoute("/settings")({
  beforeLoad: requireAuth,
  component: SettingsLayout,
});
