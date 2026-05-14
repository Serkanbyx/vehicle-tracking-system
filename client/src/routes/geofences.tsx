import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useRef, useState } from "react";
import { Crosshair, List } from "lucide-react";
import { requireAuth } from "@/components/guards";
import type { Geofence, GeofenceShape } from "@/api/types";
import {
  GeofenceMap,
  type GeofenceGeometry,
  type GeofenceMapHandle,
} from "@/components/map/GeofenceMap";
import { GeofenceList } from "@/components/map/GeofenceList";
import { GeofenceDrawerForm } from "@/components/map/GeofenceDrawerForm";
import {
  Button,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui";

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
  const [listDrawerOpen, setListDrawerOpen] = useState(false);

  const handleSelect = useCallback((gf: Geofence) => {
    setTestPointActive(false);
    mapHandleRef.current?.setTestPointMode(false);
    setSelectedGeofence(gf);
    setShapeMode(gf.shape);
    setGeometry(null);
    setDrawerOpen(true);
    setListDrawerOpen(false);
    mapHandleRef.current?.loadGeometry(gf);
  }, []);

  const handleNew = useCallback(() => {
    setTestPointActive(false);
    mapHandleRef.current?.setTestPointMode(false);
    setSelectedGeofence(null);
    setShapeMode("polygon");
    setGeometry(null);
    setDrawerOpen(true);
    setListDrawerOpen(false);
    mapHandleRef.current?.clearDrawing();
  }, []);

  const handleStartDraw = useCallback((shape: GeofenceShape) => {
    setGeometry(null);
    mapHandleRef.current?.startDrawing(shape);
  }, []);

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

  const handleDrawerClose = useCallback((open: boolean) => {
    setDrawerOpen(open);
    if (!open) {
      mapHandleRef.current?.clearDrawing();
      setGeometry(null);
    }
  }, []);

  const toggleTestPoint = useCallback(() => {
    const next = !testPointActive;
    setTestPointActive(next);
    mapHandleRef.current?.setTestPointMode(next);
  }, [testPointActive]);

  return (
    <div className="mx-auto max-w-7xl p-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Bölge Sınırları</h1>
        <Button
          variant="outline"
          size="sm"
          className="lg:hidden"
          onClick={() => setListDrawerOpen(true)}
          aria-label="Bölge listesini aç"
        >
          <List className="mr-1.5 h-4 w-4" />
          Bölgeler
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[20rem_1fr]">
        {/* Desktop sidebar list */}
        <div className="hidden lg:block">
          <GeofenceList
            onSelect={handleSelect}
            onNew={handleNew}
            selectedId={selectedGeofence?.id}
          />
        </div>

        {/* Map */}
        <div
          className="relative overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700"
          style={{ height: "clamp(400px, calc(100vh - 12rem), 600px)" }}
        >
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
                    aria-label="Test noktası modu"
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

      {/* Mobile list drawer */}
      <Sheet open={listDrawerOpen} onOpenChange={setListDrawerOpen}>
        <SheetContent side="left" className="w-80 overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Bölgeler</SheetTitle>
          </SheetHeader>
          <div className="mt-4">
            <GeofenceList
              onSelect={handleSelect}
              onNew={handleNew}
              selectedId={selectedGeofence?.id}
            />
          </div>
        </SheetContent>
      </Sheet>

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
