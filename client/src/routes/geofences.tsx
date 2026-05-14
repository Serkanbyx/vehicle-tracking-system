import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { requireAuth } from "@/components/guards";
import type { Geofence, GeofenceShape } from "@/api/types";
import { LiveMap } from "@/components/map";
import { GeofenceList } from "@/components/map/GeofenceList";
import { GeofenceDrawerForm } from "@/components/map/GeofenceDrawerForm";

export const Route = createFileRoute("/geofences")({
  beforeLoad: requireAuth,
  component: GeofencesPage,
});

function GeofencesPage() {
  const [selectedGeofence, setSelectedGeofence] = useState<Geofence | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [shapeMode, setShapeMode] = useState<GeofenceShape>("polygon");

  const handleSelect = (gf: Geofence) => {
    setSelectedGeofence(gf);
    setShapeMode(gf.shape);
    setDrawerOpen(true);
  };

  const handleNew = () => {
    setSelectedGeofence(null);
    setShapeMode("polygon");
    setDrawerOpen(true);
  };

  return (
    <div className="mx-auto max-w-7xl p-4">
      <h1 className="mb-4 text-2xl font-bold">Bölge Sınırları</h1>
      <div className="grid gap-4 lg:grid-cols-[20rem_1fr]">
        <GeofenceList
          onSelect={handleSelect}
          onNew={handleNew}
          selectedId={selectedGeofence?.id}
        />
        <div className="h-[600px] overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
          <LiveMap className="h-full w-full" />
        </div>
      </div>

      <GeofenceDrawerForm
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        geofence={selectedGeofence}
        shapeMode={shapeMode}
        onShapeModeChange={setShapeMode}
      />
    </div>
  );
}
