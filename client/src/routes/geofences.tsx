import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useRef, useState } from "react";
import { Crosshair } from "lucide-react";
import { requireAuth } from "@/components/guards";
import type { Geofence, GeofenceShape } from "@/api/types";
import {
  GeofenceMap,
  type GeofenceGeometry,
  type GeofenceMapHandle,
} from "@/components/map/GeofenceMap";
import { GeofenceList } from "@/components/map/GeofenceList";
import { GeofenceDrawerForm } from "@/components/map/GeofenceDrawerForm";
import { Button, Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui";

export const Route = createFileRoute("/geofences")({
  beforeLoad: requireAuth,
  component: GeofencesPage,
});

function GeofencesPage() {
  const mapHandleRef = useRef<GeofenceMapHandle>(null);

  const [selectedGeofence, setSelectedGeofence] = useState<Geofence | null>(
    null,
  );
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [shapeMode, setShapeMode] = useState<GeofenceShape>("polygon");
  const [geometry, setGeometry] = useState<GeofenceGeometry | null>(null);
  const [testPointActive, setTestPointActive] = useState(false);

  const handleSelect = useCallback(
    (gf: Geofence) => {
      setTestPointActive(false);
      mapHandleRef.current?.setTestPointMode(false);
      setSelectedGeofence(gf);
      setShapeMode(gf.shape);
      setGeometry(null);
      setDrawerOpen(true);
      mapHandleRef.current?.loadGeometry(gf);
    },
    [],
  );

  const handleNew = useCallback(() => {
    setTestPointActive(false);
    mapHandleRef.current?.setTestPointMode(false);
    setSelectedGeofence(null);
    setShapeMode("polygon");
    setGeometry(null);
    setDrawerOpen(true);
    mapHandleRef.current?.clearDrawing();
  }, []);

  const handleStartDraw = useCallback(
    (shape: GeofenceShape) => {
      setGeometry(null);
      mapHandleRef.current?.startDrawing(shape);
    },
    [],
  );

  const handleCancelDraw = useCallback(() => {
    setGeometry(null);
    mapHandleRef.current?.cancelDrawing();
  }, []);

  const handleGeometryChange = useCallback(
    (geom: GeofenceGeometry | null) => {
      setGeometry(geom);
    },
    [],
  );

  const handleDrawerClose = useCallback(
    (open: boolean) => {
      setDrawerOpen(open);
      if (!open) {
        mapHandleRef.current?.clearDrawing();
        setGeometry(null);
      }
    },
    [],
  );

  const toggleTestPoint = useCallback(() => {
    const next = !testPointActive;
    setTestPointActive(next);
    mapHandleRef.current?.setTestPointMode(next);
  }, [testPointActive]);

  return (
    <div className="mx-auto max-w-7xl p-4">
      <h1 className="mb-4 text-2xl font-bold">Bölge Sınırları</h1>
      <div className="grid gap-4 lg:grid-cols-[20rem_1fr]">
        <GeofenceList
          onSelect={handleSelect}
          onNew={handleNew}
          selectedId={selectedGeofence?.id}
        />
        <div className="relative h-[600px] overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
          <GeofenceMap
            ref={mapHandleRef}
            className="h-full w-full"
            onGeometryChange={handleGeometryChange}
            selectedGeofenceId={selectedGeofence?.id}
            testGeofenceId={selectedGeofence?.id}
          />

          {selectedGeofence && (
            <div className="absolute right-14 top-2.5 z-10">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant={testPointActive ? "default" : "outline"}
                    className="h-8 w-8 shadow-md"
                    onClick={toggleTestPoint}
                  >
                    <Crosshair className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">
                  {testPointActive
                    ? "Test modu aktif — haritaya tıklayın"
                    : "Test noktası modu"}
                </TooltipContent>
              </Tooltip>
            </div>
          )}
        </div>
      </div>

      <GeofenceDrawerForm
        open={drawerOpen}
        onOpenChange={handleDrawerClose}
        geofence={selectedGeofence}
        shapeMode={shapeMode}
        onShapeModeChange={setShapeMode}
        geometry={geometry}
        onStartDraw={handleStartDraw}
        onCancelDraw={handleCancelDraw}
      />
    </div>
  );
}
