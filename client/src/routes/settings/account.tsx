import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useForm } from "@tanstack/react-form";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { requireAuth } from "@/components/guards";
import { useAuth } from "@/context/auth.context";
import * as authService from "@/api/auth";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
} from "@/components/ui";

export const Route = createFileRoute("/settings/account")({
  beforeLoad: requireAuth,
  component: SettingsAccountPage,
});

function SettingsAccountPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  const passwordForm = useForm({
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
    onSubmit: async ({ value }) => {
      if (value.newPassword !== value.confirmPassword) {
        toast.error("Yeni şifreler eşleşmiyor.");
        return;
      }
      if (value.newPassword.length < 8) {
        toast.error("Yeni şifre en az 8 karakter olmalıdır.");
        return;
      }
      try {
        await authService.changePassword({
          currentPassword: value.currentPassword,
          newPassword: value.newPassword,
        });
        toast.success("Şifre başarıyla değiştirildi.");
        passwordForm.reset();
      } catch {
        toast.error("Şifre değiştirilemedi. Mevcut şifrenizi kontrol edin.");
      }
    },
  });

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      toast.error("Şifrenizi girin.");
      return;
    }
    setDeleteLoading(true);
    try {
      await authService.deleteAccount();
      toast.success("Hesabınız silindi.");
      await logout();
      void navigate({ to: "/login" });
    } catch {
      toast.error("Hesap silinemedi.");
    } finally {
      setDeleteLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Hesap Ayarları</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">E-posta</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-1.5">
            <Label>E-posta Adresi</Label>
            <Input value={user.email} disabled className="max-w-sm" />
            <p className="text-xs text-gray-500">
              E-posta adresi değiştirilemez.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Şifre Değiştir</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              void passwordForm.handleSubmit();
            }}
            className="flex max-w-sm flex-col gap-4"
          >
            <passwordForm.Field name="currentPassword">
              {(field) => (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="current-pw">Mevcut Şifre *</Label>
                  <Input
                    id="current-pw"
                    type="password"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    autoComplete="current-password"
                  />
                </div>
              )}
            </passwordForm.Field>

            <passwordForm.Field name="newPassword">
              {(field) => (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="new-pw">Yeni Şifre *</Label>
                  <Input
                    id="new-pw"
                    type="password"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    autoComplete="new-password"
                    minLength={8}
                  />
                </div>
              )}
            </passwordForm.Field>

            <passwordForm.Field name="confirmPassword">
              {(field) => (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="confirm-pw">Yeni Şifre (Tekrar) *</Label>
                  <Input
                    id="confirm-pw"
                    type="password"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    autoComplete="new-password"
                  />
                </div>
              )}
            </passwordForm.Field>

            <div>
              <Button
                type="submit"
                disabled={passwordForm.state.isSubmitting}
              >
                {passwordForm.state.isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Şifreyi Değiştir
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="border-danger/30">
        <CardHeader>
          <CardTitle className="text-base text-danger">
            Tehlikeli Bölge
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-gray-500">
            Hesabınızı sildiğinizde tüm verileriniz kalıcı olarak silinir. Bu
            işlem geri alınamaz.
          </p>
          <Button
            variant="destructive"
            onClick={() => setDeleteOpen(true)}
          >
            Hesabımı Sil
          </Button>
        </CardContent>
      </Card>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hesabı Sil</AlertDialogTitle>
            <AlertDialogDescription>
              Hesabınızı silmek istediğinize emin misiniz? Bu işlem geri
              alınamaz. Doğrulamak için şifrenizi girin.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <Label htmlFor="delete-pw">Şifre</Label>
            <Input
              id="delete-pw"
              type="password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              className="mt-1.5"
              autoComplete="current-password"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setDeletePassword("");
              }}
            >
              İptal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={deleteLoading || !deletePassword}
            >
              {deleteLoading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Hesabı Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
