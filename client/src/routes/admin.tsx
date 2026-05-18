import { createFileRoute } from "@tanstack/react-router";
import { requireAdmin } from "@/components/guards";
import { AdminLayout } from "@/components/layout/AdminLayout";

export const Route = createFileRoute("/admin")({
  beforeLoad: requireAdmin,
  component: AdminLayout,
});
