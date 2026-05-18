import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { enUS } from "date-fns/locale";
import { Calendar, Edit, Shield } from "lucide-react";
import { getAdminUser } from "@/api/admin";
import type { UserRole } from "@/api/types";
import { requireAuth } from "@/components/guards";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui";
import { useAuth } from "@/context/auth.context";

export const Route = createFileRoute("/profile/$id")({
  beforeLoad: requireAuth,
  component: ProfilePage,
});

const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Admin",
  manager: "Manager",
  viewer: "Viewer",
};

const ROLE_COLORS: Record<UserRole, "destructive" | "default" | "secondary"> = {
  admin: "destructive",
  manager: "default",
  viewer: "secondary",
};

function ProfilePage() {
  const { id } = Route.useParams();
  const { user: currentUser } = useAuth();
  const isSelf = currentUser?.id === id;

  const { data: profileUser } = useQuery({
    queryKey: ["admin", "user", id],
    queryFn: () => getAdminUser(id),
    enabled: !isSelf,
  });

  const user = isSelf ? currentUser : profileUser;

  if (!user) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <div className="py-12 text-center text-gray-400">Loading user…</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <Card>
        <CardContent className="flex flex-col items-center gap-4 pt-6 sm:flex-row sm:items-start">
          <Avatar className="h-20 w-20">
            <AvatarImage src={user.avatarUrl ?? undefined} />
            <AvatarFallback className="text-2xl">
              {user.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-2xl font-bold">{user.name}</h1>
            <div className="mt-1 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <Badge variant={ROLE_COLORS[user.role]}>
                <Shield className="mr-1 h-3 w-3" />
                {ROLE_LABELS[user.role]}
              </Badge>
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <Calendar className="h-3 w-3" />
                Joined on{" "}
                {format(new Date(user.createdAt), "dd MMMM yyyy", {
                  locale: enUS,
                })}
              </span>
            </div>
            {user.email && <p className="mt-1 text-sm text-gray-500">{user.email}</p>}
          </div>

          {isSelf && (
            <Link to="/settings/profile">
              <Button variant="outline" size="sm">
                <Edit className="mr-1.5 h-3.5 w-3.5" />
                Edit Profile
              </Button>
            </Link>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="activity">
        <TabsList>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="about">About</TabsTrigger>
        </TabsList>

        <TabsContent value="activity" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm text-gray-500">
                {user.lastLoginAt ? (
                  <p>
                    Last login:{" "}
                    {format(new Date(user.lastLoginAt), "dd MMM yyyy HH:mm", { locale: enUS })}
                  </p>
                ) : (
                  <p>No login yet.</p>
                )}
                <p>
                  Account status:{" "}
                  <span className={user.isActive ? "text-success" : "text-danger"}>
                    {user.isActive ? "Active" : "Inactive"}
                  </span>
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="about" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Information</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-gray-500">Name</dt>
                  <dd className="font-medium">{user.name}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Role</dt>
                  <dd className="font-medium">{ROLE_LABELS[user.role]}</dd>
                </div>
                {user.phone && (
                  <div>
                    <dt className="text-gray-500">Phone</dt>
                    <dd className="font-medium">{user.phone}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-gray-500">Registration Date</dt>
                  <dd className="font-medium">
                    {format(new Date(user.createdAt), "dd MMMM yyyy", {
                      locale: enUS,
                    })}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
