import { useForm } from "@tanstack/react-form";
import { createFileRoute } from "@tanstack/react-router";
import { Camera, Loader2 } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import * as authService from "@/api/auth";
import { uploadAvatar } from "@/api/uploads";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
} from "@/components/ui";
import { useAuth } from "@/context/auth.context";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024;

export const Route = createFileRoute("/settings/profile")({
  component: SettingsProfilePage,
});

function SettingsProfilePage() {
  const { user, updateUser } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const form = useForm({
    defaultValues: {
      name: user?.name ?? "",
      phone: user?.phone ?? "",
    },
    onSubmit: async ({ value }) => {
      try {
        const updated = await authService.updateMe({
          name: value.name,
          phone: value.phone || null,
        });
        updateUser(updated);
        toast.success("Profile updated.");
      } catch {
        toast.error("Failed to update profile.");
      }
    },
  });

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("You can only upload JPEG, PNG, or WebP files.");
      return;
    }
    if (file.size > MAX_SIZE) {
      toast.error("File size must be 5 MB or less.");
      return;
    }

    setUploading(true);
    try {
      const { url } = await uploadAvatar(file);
      const updated = await authService.updateMe({ name: user?.name ?? "" });
      updateUser({ ...updated, avatarUrl: url });
      toast.success("Avatar updated.");
    } catch {
      toast.error("Failed to upload avatar.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Profile Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Avatar</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          <div className="relative">
            <Avatar className="h-20 w-20">
              <AvatarImage src={user.avatarUrl ?? undefined} />
              <AvatarFallback className="text-2xl">
                {user.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50 dark:border-gray-900"
            >
              {uploading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Camera className="h-3.5 w-3.5" />
              )}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>
          <div className="text-sm text-gray-500">
            <p>JPEG, PNG, or WebP, max 5 MB.</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Personal Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              void form.handleSubmit();
            }}
            className="flex flex-col gap-4"
          >
            <form.Field name="name">
              {(field) => (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="profile-name">Name *</Label>
                  <Input
                    id="profile-name"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    maxLength={60}
                  />
                </div>
              )}
            </form.Field>

            <form.Field name="phone">
              {(field) => (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="profile-phone">Phone</Label>
                  <Input
                    id="profile-phone"
                    type="tel"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="+1 XXX XXX XXXX"
                    maxLength={20}
                  />
                </div>
              )}
            </form.Field>

            <div>
              <Button type="submit" disabled={form.state.isSubmitting}>
                {form.state.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
