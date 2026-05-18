import { useForm } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import type { Vehicle, VehicleDriver, VehicleType } from "@/api/types";
import { uploadDriver, uploadVehicle } from "@/api/uploads";
import { createVehicle, updateVehicle } from "@/api/vehicles";
import { Button, Input, Label, Select, Slider } from "@/components/ui";
import { PhotoUpload } from "./PhotoUpload";

const VEHICLE_TYPES: VehicleType[] = ["car", "truck", "van", "motorcycle", "bus", "other"];

interface VehicleFormProps {
  vehicle?: Vehicle;
}

export function VehicleForm({ vehicle }: VehicleFormProps) {
  const editing = !!vehicle;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const form = useForm({
    defaultValues: {
      plate: vehicle?.plate ?? "",
      vehicleType: (vehicle?.vehicleType ?? "car") as VehicleType,
      model: vehicle?.model ?? "",
      year: vehicle?.year ?? new Date().getFullYear(),
      color: vehicle?.color ?? "",
      driverName: vehicle?.driver?.name ?? "",
      driverPhone: vehicle?.driver?.phone ?? "",
      driverLicense: vehicle?.driver?.licenseNumber ?? "",
      driverPhotoUrl: vehicle?.driver?.photoUrl ?? (null as string | null),
      photoUrl: vehicle?.photoUrl ?? (null as string | null),
      speedLimitKmh: vehicle?.speedLimitKmh ?? 90,
      tags: vehicle?.tags?.join(", ") ?? "",
    },
    onSubmit: async ({ value }) => {
      setError(null);
      try {
        const tags = value.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
          .slice(0, 10);

        const driver: VehicleDriver = {};
        const driverName = value.driverName?.trim();
        if (driverName) driver.name = driverName;
        const driverPhone = value.driverPhone?.trim();
        if (driverPhone) driver.phone = driverPhone;
        const driverLicense = value.driverLicense?.trim();
        if (driverLicense) driver.licenseNumber = driverLicense;
        const driverPhoto = value.driverPhotoUrl?.trim();
        if (driverPhoto) driver.photoUrl = driverPhoto;

        const payload = {
          plate: value.plate.toUpperCase(),
          vehicleType: value.vehicleType,
          model: value.model || null,
          year: value.year || null,
          color: value.color || null,
          driver,
          photoUrl: value.photoUrl,
          speedLimitKmh: value.speedLimitKmh,
          tags,
        };

        let resultId: string;
        if (editing && vehicle) {
          await updateVehicle(vehicle.id, payload);
          resultId = vehicle.id;
        } else {
          const created = await createVehicle(payload);
          resultId = created.id;
        }

        await queryClient.invalidateQueries({ queryKey: ["vehicles"] });
        await navigate({ to: "/vehicles/$id", params: { id: resultId } });
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      }
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void form.handleSubmit();
      }}
      className="space-y-6"
    >
      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-danger dark:bg-red-900/20">
          {error}
        </div>
      )}

      <fieldset className="space-y-4">
        <legend className="text-lg font-semibold">Vehicle Information</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <form.Field name="plate">
            {(field) => (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="plate">Plate *</Label>
                <Input
                  id="plate"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value.toUpperCase())}
                  onBlur={field.handleBlur}
                  placeholder="34 ABC 123"
                  maxLength={15}
                />
              </div>
            )}
          </form.Field>

          <form.Field name="vehicleType">
            {(field) => (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="vehicleType">Type</Label>
                <Select
                  id="vehicleType"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value as VehicleType)}
                >
                  {VEHICLE_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </option>
                  ))}
                </Select>
              </div>
            )}
          </form.Field>

          <form.Field name="model">
            {(field) => (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="model">Model</Label>
                <Input
                  id="model"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Ford Transit"
                  maxLength={80}
                />
              </div>
            )}
          </form.Field>

          <form.Field name="year">
            {(field) => (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="year">Year</Label>
                <Input
                  id="year"
                  type="number"
                  value={String(field.state.value)}
                  onChange={(e) => field.handleChange(Number(e.target.value))}
                  min={1990}
                  max={new Date().getFullYear() + 1}
                />
              </div>
            )}
          </form.Field>

          <form.Field name="color">
            {(field) => (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="color">Color</Label>
                <Input
                  id="color"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="White"
                  maxLength={30}
                />
              </div>
            )}
          </form.Field>
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-lg font-semibold">Driver Information</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <form.Field name="driverName">
            {(field) => (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="driverName">Name</Label>
                <Input
                  id="driverName"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="John Smith"
                />
              </div>
            )}
          </form.Field>

          <form.Field name="driverPhone">
            {(field) => (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="driverPhone">Phone</Label>
                <Input
                  id="driverPhone"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="+90 555 000 0000"
                />
              </div>
            )}
          </form.Field>

          <form.Field name="driverLicense">
            {(field) => (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="driverLicense">License No</Label>
                <Input
                  id="driverLicense"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
              </div>
            )}
          </form.Field>

          <form.Field name="driverPhotoUrl">
            {(field) => (
              <PhotoUpload
                label="Driver Photo"
                value={field.state.value}
                onUpload={async (file) => {
                  const res = await uploadDriver(file);
                  field.handleChange(res.url);
                  return res.url;
                }}
                onClear={() => field.handleChange(null)}
              />
            )}
          </form.Field>
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-lg font-semibold">Vehicle Photo</legend>
        <form.Field name="photoUrl">
          {(field) => (
            <PhotoUpload
              label="Vehicle Photo"
              value={field.state.value}
              onUpload={async (file) => {
                const res = await uploadVehicle(file);
                field.handleChange(res.url);
                return res.url;
              }}
              onClear={() => field.handleChange(null)}
            />
          )}
        </form.Field>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-lg font-semibold">Settings</legend>
        <form.Field name="speedLimitKmh">
          {(field) => (
            <div className="flex flex-col gap-1.5">
              <Label>Speed Limit: {field.state.value} km/h</Label>
              <Slider
                value={[field.state.value]}
                onValueChange={(v) => {
                  const val = v[0];
                  if (val !== undefined) field.handleChange(val);
                }}
                min={10}
                max={250}
                step={5}
              />
            </div>
          )}
        </form.Field>

        <form.Field name="tags">
          {(field) => (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="tags">Tags (comma-separated, max 10)</Label>
              <Input
                id="tags"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="cargo, istanbul, urgent"
              />
            </div>
          )}
        </form.Field>
      </fieldset>

      <div className="flex justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-700">
        <Button type="button" variant="outline" onClick={() => window.history.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={form.state.isSubmitting}>
          {form.state.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {editing ? "Update" : "Create"}
        </Button>
      </div>
    </form>
  );
}
