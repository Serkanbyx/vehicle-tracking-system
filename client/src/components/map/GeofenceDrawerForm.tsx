import { useForm } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { createGeofence, updateGeofence } from "@/api/geofences";
import type { Geofence, GeofenceAppliesTo, GeofenceDirection, GeofenceShape } from "@/api/types";
import type { GeofenceGeometry } from "@/components/map/GeofenceMap";
import {
  Button,
  Input,
  Label,
  Select,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  Slider,
  Switch,
  Textarea,
} from "@/components/ui";

const DIRECTION_OPTIONS: { value: GeofenceDirection; label: string }[] = [
  { value: "enter", label: "Giriş" },
  { value: "exit", label: "Çıkış" },
  { value: "both", label: "Her İkisi" },
];

const COLOR_SWATCHES = [
  "#3b82f6",
  "#ef4444",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#84cc16",
  "#f97316",
  "#6366f1",
];

interface GeofenceDrawerFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  geofence?: Geofence | null;
  shapeMode: GeofenceShape;
  onShapeModeChange: (shape: GeofenceShape) => void;
  geometry: GeofenceGeometry | null;
  onStartDraw: (shape: GeofenceShape) => void;
  onCancelDraw: () => void;
}

export function GeofenceDrawerForm({
  open,
  onOpenChange,
  geofence,
  shapeMode,
  onShapeModeChange,
  geometry,
  onStartDraw,
  onCancelDraw,
}: GeofenceDrawerFormProps) {
  const editing = !!geofence;
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const form = useForm({
    defaultValues: {
      name: geofence?.name ?? "",
      description: geofence?.description ?? "",
      direction: (geofence?.direction ?? "both") as GeofenceDirection,
      appliesTo: (geofence?.appliesTo ?? "all") as GeofenceAppliesTo,
      color: geofence?.color ?? "#3b82f6",
      radiusMeters: geofence?.radiusMeters ?? 500,
      isActive: geofence?.isActive ?? true,
    },
    onSubmit: async ({ value }) => {
      setError(null);
      try {
        const payload: Record<string, unknown> = {
          name: value.name,
          description: value.description || null,
          direction: value.direction,
          appliesTo: value.appliesTo,
          color: value.color,
          shape: shapeMode,
          isActive: value.isActive,
        };

        if (geometry?.type === "polygon" && geometry.polygon) {
          payload.geometry = geometry.polygon;
        } else if (geometry?.type === "circle" && geometry.circle) {
          payload.circleCenter = {
            type: "Point",
            coordinates: geometry.circle.center,
          };
          payload.radiusMeters = geometry.circle.radiusMeters;
        } else if (shapeMode === "circle") {
          payload.radiusMeters = value.radiusMeters;
        }

        if (editing && geofence) {
          await updateGeofence(geofence.id, payload);
        } else {
          await createGeofence(payload);
        }

        await queryClient.invalidateQueries({ queryKey: ["geofences"] });
        onOpenChange(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Bir hata oluştu");
      }
    },
  });

  const hasGeometry = !!geometry;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-80 overflow-y-auto sm:w-96">
        <SheetHeader>
          <SheetTitle>{editing ? "Bölge Düzenle" : "Yeni Bölge"}</SheetTitle>
        </SheetHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            void form.handleSubmit();
          }}
          className="mt-6 flex flex-col gap-4"
        >
          {error && (
            <div className="rounded-md bg-red-50 p-2 text-xs text-danger dark:bg-red-900/20">
              {error}
            </div>
          )}

          <form.Field name="name">
            {(field) => (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="gf-name">İsim *</Label>
                <Input
                  id="gf-name"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Depo Alanı"
                  maxLength={80}
                />
              </div>
            )}
          </form.Field>

          <form.Field name="description">
            {(field) => (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="gf-desc">Açıklama</Label>
                <Textarea
                  id="gf-desc"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Opsiyonel açıklama"
                  maxLength={300}
                  rows={2}
                />
              </div>
            )}
          </form.Field>

          <div className="flex flex-col gap-1.5">
            <Label>Şekil</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={shapeMode === "polygon" ? "default" : "outline"}
                size="sm"
                onClick={() => onShapeModeChange("polygon")}
              >
                Poligon
              </Button>
              <Button
                type="button"
                variant={shapeMode === "circle" ? "default" : "outline"}
                size="sm"
                onClick={() => onShapeModeChange("circle")}
              >
                Daire
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Geometri</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => onStartDraw(shapeMode)}
              >
                <Pencil className="mr-1.5 h-3.5 w-3.5" />
                {hasGeometry ? "Yeniden Çiz" : "Haritada Çiz"}
              </Button>
              {hasGeometry && (
                <Button type="button" variant="ghost" size="sm" onClick={onCancelDraw}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
            {hasGeometry && (
              <p className="text-xs text-success">
                {geometry.type === "polygon"
                  ? `Poligon çizildi (${(geometry.polygon?.coordinates[0]?.length ?? 1) - 1} köşe)`
                  : `Daire çizildi (${geometry.circle?.radiusMeters} m)`}
              </p>
            )}
          </div>

          {shapeMode === "circle" && !hasGeometry && (
            <form.Field name="radiusMeters">
              {(field) => (
                <div className="flex flex-col gap-1.5">
                  <Label>Yarıçap: {field.state.value} m</Label>
                  <Slider
                    value={[field.state.value]}
                    onValueChange={(v) => {
                      const val = v[0];
                      if (val !== undefined) field.handleChange(val);
                    }}
                    min={50}
                    max={10000}
                    step={50}
                  />
                </div>
              )}
            </form.Field>
          )}

          <form.Field name="direction">
            {(field) => (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="gf-direction">Yön</Label>
                <Select
                  id="gf-direction"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value as GeofenceDirection)}
                >
                  {DIRECTION_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </Select>
              </div>
            )}
          </form.Field>

          <form.Field name="appliesTo">
            {(field) => (
              <div className="flex flex-col gap-1.5">
                <Label>Uygulanacak Araçlar</Label>
                <div className="flex gap-3">
                  <label className="flex items-center gap-1.5 text-sm">
                    <input
                      type="radio"
                      name="appliesTo"
                      value="all"
                      checked={field.state.value === "all"}
                      onChange={() => field.handleChange("all")}
                      className="accent-brand-600"
                    />
                    Tümü
                  </label>
                  <label className="flex items-center gap-1.5 text-sm">
                    <input
                      type="radio"
                      name="appliesTo"
                      value="specific"
                      checked={field.state.value === "specific"}
                      onChange={() => field.handleChange("specific")}
                      className="accent-brand-600"
                    />
                    Belirli
                  </label>
                </div>
              </div>
            )}
          </form.Field>

          <form.Field name="color">
            {(field) => (
              <div className="flex flex-col gap-1.5">
                <Label>Renk</Label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_SWATCHES.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => field.handleChange(c)}
                      className={`h-6 w-6 rounded-full border-2 ${field.state.value === c ? "border-gray-900 dark:border-white" : "border-transparent"}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
                <Input
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="#3b82f6"
                  maxLength={9}
                  className="mt-1 w-28"
                />
              </div>
            )}
          </form.Field>

          <form.Field name="isActive">
            {(field) => (
              <label htmlFor="geofence-drawer-active" className="flex items-center gap-2">
                <Switch
                  id="geofence-drawer-active"
                  checked={field.state.value}
                  onCheckedChange={(v) => field.handleChange(v)}
                />
                <span className="text-sm">Aktif</span>
              </label>
            )}
          </form.Field>

          <div className="flex gap-2 border-t border-gray-200 pt-4 dark:border-gray-700">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              İptal
            </Button>
            <Button type="submit" className="flex-1" disabled={form.state.isSubmitting}>
              {form.state.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editing ? "Güncelle" : "Oluştur"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
