import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { formatDistanceToNow } from "date-fns";
import { enUS } from "date-fns/locale";
import { Search, Trash2 } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import type { ListAdminUsersQuery } from "@/api/admin";
import { listAdminUsers, removeUser, setUserActive, setUserRole } from "@/api/admin";
import type { User, UserRole } from "@/api/types";
import { PageNavigator } from "@/components/common";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  Switch,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui";
import { useAuth } from "@/context/auth.context";
import { useDebounce } from "@/hooks/use-debounce";

interface UsersSearch {
  q?: string;
  role?: string;
  isActive?: string;
  page?: number;
}

export const Route = createFileRoute("/admin/users")({
  validateSearch: (raw: Record<string, unknown>): UsersSearch => ({
    q: typeof raw.q === "string" ? raw.q : undefined,
    role: typeof raw.role === "string" ? raw.role : undefined,
    isActive: typeof raw.isActive === "string" ? raw.isActive : undefined,
    page: typeof raw.page === "number" && raw.page >= 1 ? Math.floor(raw.page) : 1,
  }),
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) => {
    const query = buildQuery(deps);
    return context.queryClient.ensureQueryData({
      queryKey: ["admin", "users", query],
      queryFn: () => listAdminUsers(query),
    });
  },
  component: AdminUsersPage,
});

function buildQuery(search: UsersSearch): ListAdminUsersQuery {
  return {
    page: search.page ?? 1,
    limit: 20,
    q: search.q || undefined,
    role: search.role || undefined,
    isActive: search.isActive === "true" ? true : search.isActive === "false" ? false : undefined,
  };
}

const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Admin",
  manager: "Manager",
  viewer: "Viewer",
};

const ROLE_COLORS: Record<
  UserRole,
  "default" | "secondary" | "destructive" | "outline" | "warning"
> = {
  admin: "destructive",
  manager: "default",
  viewer: "secondary",
};

function AdminUsersPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/admin/users" });
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();

  const [searchLocal, setSearchLocal] = useState(search.q ?? "");
  const debouncedSearch = useDebounce(searchLocal, 400);

  const query = buildQuery({ ...search, q: debouncedSearch });
  const { data } = useQuery({
    queryKey: ["admin", "users", query],
    queryFn: () => listAdminUsers(query),
  });

  const [roleDialogUser, setRoleDialogUser] = useState<User | null>(null);
  const [newRole, setNewRole] = useState<UserRole>("viewer");
  const [deleteUser, setDeleteUser] = useState<User | null>(null);

  const isSelf = (u: User) => u.id === currentUser?.id;

  const handleSearchChange = useCallback((value: string) => {
    setSearchLocal(value);
  }, []);

  const setFilter = (key: string, value: string) => {
    void navigate({ search: (prev) => ({ ...prev, [key]: value || undefined, page: 1 }) });
  };

  const handleToggleActive = useCallback(
    async (user: User, active: boolean) => {
      try {
        await setUserActive(user.id, active);
        await queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
        toast.success(`${user.name} has been ${active ? "activated" : "deactivated"}.`);
      } catch {
        toast.error("Operation failed.");
      }
    },
    [queryClient],
  );

  const handleRoleChange = useCallback(async () => {
    if (!roleDialogUser) return;
    try {
      await setUserRole(roleDialogUser.id, newRole);
      await queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      toast.success(`${roleDialogUser.name}'s role has been updated to ${ROLE_LABELS[newRole]}.`);
      setRoleDialogUser(null);
    } catch {
      toast.error("Failed to update role.");
    }
  }, [roleDialogUser, newRole, queryClient]);

  const handleDelete = useCallback(async () => {
    if (!deleteUser) return;
    try {
      await removeUser(deleteUser.id);
      await queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      toast.success(`${deleteUser.name} has been deleted.`);
      setDeleteUser(null);
    } catch {
      toast.error("Failed to delete user.");
    }
  }, [deleteUser, queryClient]);

  const handlePageChange = useCallback(
    (page: number) => {
      void navigate({ search: (prev) => ({ ...prev, page }) });
    },
    [navigate],
  );

  // Sync debounced search to URL
  useState(() => {
    if (debouncedSearch !== (search.q ?? "")) {
      void navigate({ search: (prev) => ({ ...prev, q: debouncedSearch || undefined, page: 1 }) });
    }
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">User Management</h1>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-48 flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search name or email…"
            value={searchLocal}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={search.role ?? ""}
          onChange={(e) => setFilter("role", e.target.value)}
          className="w-32"
        >
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="manager">Manager</option>
          <option value="viewer">Viewer</option>
        </Select>
        <Select
          value={search.isActive ?? ""}
          onChange={(e) => setFilter("isActive", e.target.value)}
          className="w-32"
        >
          <option value="">All</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </Select>
      </div>

      <div className="overflow-x-auto rounded-md border border-gray-200 dark:border-gray-700">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
            <tr>
              <th className="px-3 py-2">User</th>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">Role</th>
              <th className="px-3 py-2">Active</th>
              <th className="px-3 py-2">Last Login</th>
              <th className="px-3 py-2">Registered</th>
              <th className="w-36 px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data?.items.map((user) => (
              <tr
                key={user.id}
                className="border-b border-gray-100 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50"
              >
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-7 w-7">
                      <AvatarImage src={user.avatarUrl ?? undefined} />
                      <AvatarFallback className="text-xs">
                        {user.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{user.name}</span>
                  </div>
                </td>
                <td className="px-3 py-2 text-gray-500">{user.email}</td>
                <td className="px-3 py-2">
                  <Badge variant={ROLE_COLORS[user.role]}>{ROLE_LABELS[user.role]}</Badge>
                </td>
                <td className="px-3 py-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span>
                        <Switch
                          checked={user.isActive}
                          onCheckedChange={(v) => handleToggleActive(user, v)}
                          disabled={isSelf(user)}
                        />
                      </span>
                    </TooltipTrigger>
                    {isSelf(user) && (
                      <TooltipContent>You cannot deactivate your own account</TooltipContent>
                    )}
                  </Tooltip>
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-xs text-gray-500">
                  {user.lastLoginAt
                    ? formatDistanceToNow(new Date(user.lastLoginAt), {
                        addSuffix: true,
                        locale: enUS,
                      })
                    : "—"}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-xs text-gray-500">
                  {formatDistanceToNow(new Date(user.createdAt), {
                    addSuffix: true,
                    locale: enUS,
                  })}
                </td>
                <td className="px-3 py-2">
                  <div className="flex gap-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs"
                          disabled={isSelf(user)}
                          onClick={() => {
                            setRoleDialogUser(user);
                            setNewRole(user.role);
                          }}
                        >
                          Role
                        </Button>
                      </TooltipTrigger>
                      {isSelf(user) && (
                        <TooltipContent>You cannot change your own role</TooltipContent>
                      )}
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-danger"
                          disabled={isSelf(user)}
                          onClick={() => setDeleteUser(user)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      {isSelf(user) && (
                        <TooltipContent>You cannot delete your own account</TooltipContent>
                      )}
                    </Tooltip>
                  </div>
                </td>
              </tr>
            ))}
            {(!data || data.items.length === 0) && (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-gray-400">
                  No users found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <PageNavigator
        page={search.page ?? 1}
        totalPages={data?.totalPages ?? 1}
        onPageChange={handlePageChange}
      />

      {/* Role Change Dialog */}
      <Dialog open={!!roleDialogUser} onOpenChange={(open) => !open && setRoleDialogUser(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Change Role</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-3">
            <p className="text-sm text-gray-500">
              Change the role of <span className="font-medium">{roleDialogUser?.name}</span>.
            </p>
            <Label htmlFor="role-select">New Role</Label>
            <Select
              id="role-select"
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as UserRole)}
            >
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="viewer">Viewer</option>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleDialogUser(null)}>
              Cancel
            </Button>
            <Button onClick={handleRoleChange}>Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteUser} onOpenChange={(open) => !open && setDeleteUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-medium">{deleteUser?.name}</span>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
