import { useForm } from "@tanstack/react-form";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
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
import { useAuth } from "@/context/auth.context";

export const Route = createFileRoute("/settings/account")({
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
        toast.error("New passwords do not match.");
        return;
      }
      if (value.newPassword.length < 8) {
        toast.error("New password must be at least 8 characters.");
        return;
      }
      try {
        await authService.changePassword({
          currentPassword: value.currentPassword,
          newPassword: value.newPassword,
        });
        toast.success("Password changed successfully.");
        passwordForm.reset();
      } catch {
        toast.error("Failed to change password. Please check your current password.");
      }
    },
  });

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      toast.error("Please enter your password.");
      return;
    }
    setDeleteLoading(true);
    try {
      await authService.deleteAccount();
      toast.success("Your account has been deleted.");
      await logout();
      void navigate({ to: "/login" });
    } catch {
      toast.error("Failed to delete account.");
    } finally {
      setDeleteLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Account Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Email</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-1.5">
            <Label>Email Address</Label>
            <Input value={user.email} disabled className="max-w-sm" />
            <p className="text-xs text-gray-500">Email address cannot be changed.</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Change Password</CardTitle>
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
                  <Label htmlFor="current-pw">Current Password *</Label>
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
                  <Label htmlFor="new-pw">New Password *</Label>
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
                  <Label htmlFor="confirm-pw">Confirm New Password *</Label>
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
              <Button type="submit" disabled={passwordForm.state.isSubmitting}>
                {passwordForm.state.isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Change Password
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="border-danger/30">
        <CardHeader>
          <CardTitle className="text-base text-danger">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-gray-500">
            When you delete your account, all your data will be permanently deleted. This action cannot be undone.
          </p>
          <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
            Delete My Account
          </Button>
        </CardContent>
      </Card>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Account</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete your account? This action cannot be undone. Enter your
              password to confirm.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <Label htmlFor="delete-pw">Password</Label>
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
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={deleteLoading || !deletePassword}
            >
              {deleteLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete Account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
