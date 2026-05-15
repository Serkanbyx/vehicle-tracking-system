import { Link, Outlet } from "@tanstack/react-router";
import { Gauge, Menu, Ship, Users } from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui";
import { cn } from "@/lib/cn";

const ADMIN_LINKS = [
  { to: "/admin", label: "Dashboard", icon: Gauge },
  { to: "/admin/users", label: "Kullanıcılar", icon: Users },
  { to: "/admin/fleet", label: "Filo", icon: Ship },
] as const;

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-1">
      {ADMIN_LINKS.map(({ to, label, icon: Icon }) => (
        <Link
          key={to}
          to={to}
          onClick={() => onNavigate?.()}
          activeOptions={{ exact: to === "/admin" }}
          activeProps={{
            className: "text-brand-600 font-semibold bg-brand-50 dark:bg-brand-700/10",
          }}
          className={cn(
            "flex items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-600",
            "hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800",
          )}
        >
          <Icon className="h-4 w-4" />
          {label}
        </Link>
      ))}
    </nav>
  );
}

export function AdminLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6">
      <aside className="hidden w-56 shrink-0 md:block">
        <h2 className="mb-4 px-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
          Yönetim
        </h2>
        <SidebarNav />
      </aside>

      <div className="mb-4 md:hidden">
        <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
          <SheetTrigger className="flex items-center gap-2 rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600">
            <Menu className="h-4 w-4" />
            Menü
          </SheetTrigger>
          <SheetContent side="left" className="w-64">
            <SheetHeader>
              <SheetTitle>Yönetim</SheetTitle>
            </SheetHeader>
            <div className="mt-4">
              <SidebarNav onNavigate={() => setDrawerOpen(false)} />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <main className="min-w-0 flex-1">
        <Outlet />
      </main>
    </div>
  );
}
