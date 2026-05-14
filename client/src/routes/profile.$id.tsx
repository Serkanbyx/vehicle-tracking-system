import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Calendar, Edit, Shield } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { requireAuth } from "@/components/guards";
import { getAdminUser } from "@/api/admin";
import { useAuth } from "@/context/auth.context";
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
import type { UserRole } from "@/api/types";

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
        <div className="py-12 text-center text-gray-400">
          Kullanıcı yükleniyor…
        </div>
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
                {format(new Date(user.createdAt), "dd MMMM yyyy", {
                  locale: tr,
                })}{" "}
                tarihinde katıldı
              </span>
            </div>
            {user.email && (
              <p className="mt-1 text-sm text-gray-500">{user.email}</p>
            )}
          </div>

          {isSelf && (
            <Link to="/settings/profile">
              <Button variant="outline" size="sm">
                <Edit className="mr-1.5 h-3.5 w-3.5" />
                Profili Düzenle
              </Button>
            </Link>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="activity">
        <TabsList>
          <TabsTrigger value="activity">Aktivite</TabsTrigger>
          <TabsTrigger value="about">Hakkında</TabsTrigger>
        </TabsList>

        <TabsContent value="activity" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Son Aktivite</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm text-gray-500">
                {user.lastLoginAt ? (
                  <p>
                    Son giriş:{" "}
                    {format(
                      new Date(user.lastLoginAt),
                      "dd MMM yyyy HH:mm",
                      { locale: tr },
                    )}
                  </p>
                ) : (
                  <p>Henüz giriş yapılmamış.</p>
                )}
                <p>
                  Hesap durumu:{" "}
                  <span
                    className={
                      user.isActive ? "text-success" : "text-danger"
                    }
                  >
                    {user.isActive ? "Aktif" : "Pasif"}
                  </span>
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="about" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Bilgiler</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-gray-500">İsim</dt>
                  <dd className="font-medium">{user.name}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Rol</dt>
                  <dd className="font-medium">{ROLE_LABELS[user.role]}</dd>
                </div>
                {user.phone && (
                  <div>
                    <dt className="text-gray-500">Telefon</dt>
                    <dd className="font-medium">{user.phone}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-gray-500">Kayıt Tarihi</dt>
                  <dd className="font-medium">
                    {format(new Date(user.createdAt), "dd MMMM yyyy", {
                      locale: tr,
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
