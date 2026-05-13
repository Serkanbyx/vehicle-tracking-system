import { Link, Outlet, useLocation } from "@tanstack/react-router";
import { Bell, Palette, Settings, User } from "lucide-react";
import { cn } from "@/lib/cn";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui";

const SETTINGS_LINKS = [
  { to: "/settings/profile", label: "Profil", icon: User },
  { to: "/settings/account", label: "Hesap", icon: Settings },
  { to: "/settings/appearance", label: "Görünüm", icon: Palette },
  { to: "/settings/notifications", label: "Bildirimler", icon: Bell },
] as const;

function SidebarNav() {
  return (
    <nav className="flex flex-col gap-1">
      {SETTINGS_LINKS.map(({ to, label, icon: Icon }) => (
        <Link
          key={to}
          to={to}
          activeProps={{ className: "text-brand-600 font-semibold bg-brand-50 dark:bg-brand-700/10" }}
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

export function SettingsLayout() {
  const location = useLocation();
  const currentLink = SETTINGS_LINKS.find((l) => location.pathname.startsWith(l.to));
  const CurrentIcon = currentLink?.icon ?? Settings;

  return (
    <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6">
      <aside className="hidden w-56 shrink-0 md:block">
        <h2 className="mb-4 px-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
          Ayarlar
        </h2>
        <SidebarNav />
      </aside>

      <div className="mb-4 md:hidden">
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600">
            <CurrentIcon className="h-4 w-4" />
            {currentLink?.label ?? "Ayarlar"}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            {SETTINGS_LINKS.map(({ to, label, icon: Icon }) => (
              <DropdownMenuItem key={to} asChild>
                <Link to={to} className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <main className="min-w-0 flex-1">
        <Outlet />
      </main>
    </div>
  );
}
