import { useQuery } from "@tanstack/react-query";
import maplibregl from "maplibre-gl";
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from "react";
import { toast } from "sonner";
import { listGeofences, testGeofence } from "@/api/geofences";
import type { Geofence, GeofenceShape } from "@/api/types";
import { usePreferences } from "@/context/preferences.context";
import { env } from "@/env";
import { cn } from "@/lib/cn";
import { generateCircleCoords, haversineDistance } from "@/utils/generate-circle";

const MAX_VERTICES = 256;
const MAX_RADIUS_M = 50_000;

type DrawingMode = "idle" | "draw_polygon" | "draw_circle" | "test_point";

interface CircleState {
  center: [number, number];
  radiusMeters: number;
}

export interface GeofenceGeometry {
  type: "polygon" | "circle";
  polygon?: GeoJSON.Polygon;
  circle?: CircleState;
}

export interface GeofenceMapHandle {
  startDrawing: (shape: GeofenceShape) => void;
  cancelDrawing: () => void;
  setTestPointMode: (enabled: boolean) => void;
  loadGeometry: (geofence: Geofence) => void;
  clearDrawing: () => void;
}

interface GeofenceMapProps {
  className?: string;
  onGeometryChange?: (geometry: GeofenceGeometry | null) => void;
  selectedGeofenceId?: string | null;
  testGeofenceId?: string | null;
}

export const GeofenceMap = forwardRef<GeofenceMapHandle, GeofenceMapProps>(function GeofenceMap(
  { className, onGeometryChange, selectedGeofenceId, testGeofenceId },
  ref,
) {
  const mapRef = useRef<maplibregl.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { preferences } = usePreferences();

  const modeRef = useRef<DrawingMode>("idle");
  const polygonVerticesRef = useRef<[number, number][]>([]);
  const circleCenterRef = useRef<[number, number] | null>(null);
  const previewMarkerRef = useRef<maplibregl.Marker | null>(null);
  const vertexMarkersRef = useRef<maplibregl.Marker[]>([]);

  const mapDefaults = preferences.mapDefaults ?? {
    center: [35.2, 39.0] as [number, number],
    zoom: 6,
  };

  const { data: geofencesData } = useQuery({
    queryKey: ["geofences"],
    queryFn: () => listGeofences({ limit: 200 }),
  });

  const cleanupDrawing = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    for (const m of vertexMarkersRef.current) m.remove();
    vertexMarkersRef.current = [];
    previewMarkerRef.current?.remove();
    previewMarkerRef.current = null;
    polygonVerticesRef.current = [];
    circleCenterRef.current = null;

    if (map.getLayer("drawing-fill")) map.removeLayer("drawing-fill");
    if (map.getLayer("drawing-line")) map.removeLayer("drawing-line");
    if (map.getSource("drawing")) map.removeSource("drawing");
    if (map.getLayer("circle-preview-fill")) map.removeLayer("circle-preview-fill");
    if (map.getLayer("circle-preview-line")) map.removeLayer("circle-preview-line");
    if (map.getSource("circle-preview")) map.removeSource("circle-preview");
  }, []);

  const updateDrawingPreview = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    const verts = polygonVerticesRef.current;
    if (verts.length < 2) return;

    const coords = [...verts, verts[0]!];
    const geojson: GeoJSON.Feature = {
      type: "Feature",
      properties: {},
      geometry: {
        type: "Polygon",
        coordinates: [coords],
      },
    };

    const src = map.getSource("drawing") as maplibregl.GeoJSONSource | undefined;
    if (src) {
      src.setData(geojson);
    } else {
      map.addSource("drawing", { type: "geojson", data: geojson });
      map.addLayer({
        id: "drawing-fill",
        type: "fill",
        source: "drawing",
        paint: { "fill-color": "#3b82f6", "fill-opacity": 0.2 },
      });
      map.addLayer({
        id: "drawing-line",
        type: "line",
        source: "drawing",
        paint: {
          "line-color": "#3b82f6",
          "line-width": 2,
          "line-dasharray": [2, 2],
        },
      });
    }
  }, []);

  const updateCirclePreview = useCallback((center: [number, number], radiusM: number) => {
    const map = mapRef.current;
    if (!map) return;

    const clampedRadius = Math.min(radiusM, MAX_RADIUS_M);
    const ring = generateCircleCoords(center, clampedRadius);
    const geojson: GeoJSON.Feature = {
      type: "Feature",
      properties: {},
      geometry: { type: "Polygon", coordinates: [ring] },
    };

    const src = map.getSource("circle-preview") as maplibregl.GeoJSONSource | undefined;
    if (src) {
      src.setData(geojson);
    } else {
      map.addSource("circle-preview", { type: "geojson", data: geojson });
      map.addLayer({
        id: "circle-preview-fill",
        type: "fill",
        source: "circle-preview",
        paint: { "fill-color": "#3b82f6", "fill-opacity": 0.2 },
      });
      map.addLayer({
        id: "circle-preview-line",
        type: "line",
        source: "circle-preview",
        paint: { "line-color": "#3b82f6", "line-width": 2 },
      });
    }
  }, []);

  const addVertexMarker = useCallback((lngLat: [number, number]) => {
    const map = mapRef.current;
    if (!map) return;
    const el = document.createElement("div");
    el.className = "geofence-vertex";
    const marker = new maplibregl.Marker({ element: el }).setLngLat(lngLat).addTo(map);
    vertexMarkersRef.current.push(marker);
  }, []);

  const handleMapClick = useCallback(
    (e: maplibregl.MapMouseEvent) => {
      const lngLat: [number, number] = [e.lngLat.lng, e.lngLat.lat];
      const mode = modeRef.current;

      if (mode === "draw_polygon") {
        const verts = polygonVerticesRef.current;
        if (verts.length >= MAX_VERTICES) {
          toast.error(`Maximum ${MAX_VERTICES} vertices can be added.`);
          return;
        }
        verts.push(lngLat);
        addVertexMarker(lngLat);
        updateDrawingPreview();
      } else if (mode === "draw_circle") {
        if (!circleCenterRef.current) {
          circleCenterRef.current = lngLat;
          const el = document.createElement("div");
          el.className = "geofence-vertex geofence-vertex--center";
          previewMarkerRef.current = new maplibregl.Marker({ element: el })
            .setLngLat(lngLat)
            .addTo(mapRef.current!);
          toast.info("Click second point to define radius.");
        } else {
          const center = circleCenterRef.current;
          const radiusM = Math.min(haversineDistance(center, lngLat), MAX_RADIUS_M);
          const circleGeom: GeofenceGeometry = {
            type: "circle",
            circle: { center, radiusMeters: Math.round(radiusM) },
          };
          onGeometryChange?.(circleGeom);
          modeRef.current = "idle";
          updateCanvasCursor();
          toast.success(`Circle drawn (${Math.round(radiusM)} m)`);
        }
      } else if (mode === "test_point" && testGeofenceId) {
        testGeofence(testGeofenceId, {
          lng: lngLat[0],
          lat: lngLat[1],
        })
          .then((res) => {
            toast(res.inside ? "Inside: Yes ✓" : "Inside: No ✗", {
              duration: 3000,
            });
          })
          .catch(() => {
            toast.error("Could not query test point.");
          });
      }
    },
    [onGeometryChange, testGeofenceId, addVertexMarker, updateDrawingPreview],
  );

  const handleMouseMove = useCallback(
    (e: maplibregl.MapMouseEvent) => {
      if (modeRef.current !== "draw_circle") return;
      const center = circleCenterRef.current;
      if (!center) return;
      const lngLat: [number, number] = [e.lngLat.lng, e.lngLat.lat];
      const radiusM = haversineDistance(center, lngLat);
      updateCirclePreview(center, radiusM);
    },
    [updateCirclePreview],
  );

  const handleDblClick = useCallback(
    (e: maplibregl.MapMouseEvent) => {
      if (modeRef.current !== "draw_polygon") return;
      e.preventDefault();

      const verts = polygonVerticesRef.current;
      if (verts.length < 3) {
        toast.error("At least 3 vertices are required.");
        return;
      }

      if (verts.length > MAX_VERTICES) {
        toast.error(`Maximum ${MAX_VERTICES} vertices exceeded.`);
        return;
      }

      const ring = [...verts, verts[0]!];
      const polygon: GeoJSON.Polygon = {
        type: "Polygon",
        coordinates: [ring],
      };

      onGeometryChange?.({ type: "polygon", polygon });
      modeRef.current = "idle";
      updateCanvasCursor();
      toast.success(`Polygon drawn (${verts.length} vertices)`);
    },
    [onGeometryChange],
  );

  const updateCanvasCursor = useCallback(() => {
    const canvas = mapRef.current?.getCanvas();
    if (!canvas) return;
    const mode = modeRef.current;
    if (mode === "draw_polygon" || mode === "draw_circle") {
      canvas.style.cursor = "crosshair";
    } else if (mode === "test_point") {
      canvas.style.cursor = "help";
    } else {
      canvas.style.cursor = "";
    }
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      startDrawing(shape: GeofenceShape) {
        cleanupDrawing();
        modeRef.current = shape === "polygon" ? "draw_polygon" : "draw_circle";
        updateCanvasCursor();
        toast.info(
          shape === "polygon"
            ? "Click to place vertices, double-click to finish."
            : "Click to set center point.",
        );
      },
      cancelDrawing() {
        cleanupDrawing();
        modeRef.current = "idle";
        updateCanvasCursor();
        onGeometryChange?.(null);
      },
      setTestPointMode(enabled: boolean) {
        cleanupDrawing();
        modeRef.current = enabled ? "test_point" : "idle";
        updateCanvasCursor();
      },
      loadGeometry(geofence: Geofence) {
        cleanupDrawing();
        const map = mapRef.current;
        if (!map) return;

        if (
          geofence.shape === "polygon" &&
          geofence.geometry &&
          typeof geofence.geometry === "object"
        ) {
          const geom = geofence.geometry as GeoJSON.Polygon;
          if (geom.coordinates?.[0]) {
            const coords = geom.coordinates[0] as [number, number][];
            polygonVerticesRef.current = coords.slice(0, -1);
            for (const c of polygonVerticesRef.current) addVertexMarker(c);
            updateDrawingPreview();

            const bounds = coords.reduce(
              (b, c) => b.extend(c as [number, number]),
              new maplibregl.LngLatBounds(coords[0]!, coords[0]!),
            );
            map.fitBounds(bounds, { padding: 80, maxZoom: 16 });

            onGeometryChange?.({
              type: "polygon",
              polygon: geom,
            });
          }
        } else if (geofence.shape === "circle" && geofence.circleCenter && geofence.radiusMeters) {
          const raw = geofence.circleCenter as
            | { coordinates: [number, number] }
            | { lng: number; lat: number };
          const center: [number, number] =
            "coordinates" in raw ? raw.coordinates : [raw.lng, raw.lat];
          const radiusM = geofence.radiusMeters;

          circleCenterRef.current = center;
          updateCirclePreview(center, radiusM);

          const el = document.createElement("div");
          el.className = "geofence-vertex geofence-vertex--center";
          previewMarkerRef.current = new maplibregl.Marker({ element: el })
            .setLngLat(center)
            .addTo(map);

          const ring = generateCircleCoords(center, radiusM);
          const bounds = ring.reduce(
            (b, c) => b.extend([c[0]!, c[1]!] as [number, number]),
            new maplibregl.LngLatBounds([ring[0]![0]!, ring[0]![1]!], [ring[0]![0]!, ring[0]![1]!]),
          );
          map.fitBounds(bounds, { padding: 80, maxZoom: 16 });

          onGeometryChange?.({
            type: "circle",
            circle: { center, radiusMeters: radiusM },
          });
        }
      },
      clearDrawing() {
        cleanupDrawing();
        modeRef.current = "idle";
        updateCanvasCursor();
      },
    }),
    [
      cleanupDrawing,
      updateCanvasCursor,
      addVertexMarker,
      updateDrawingPreview,
      updateCirclePreview,
      onGeometryChange,
    ],
  );

  useEffect(() => {
    if (!containerRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: env.MAP_STYLE_URL,
      center: mapDefaults.center as [number, number],
      zoom: mapDefaults.zoom ?? 6,
      attributionControl: false,
      doubleClickZoom: false,
    });

    map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-left");
    map.addControl(new maplibregl.NavigationControl(), "top-right");

    mapRef.current = map;

    return () => {
      cleanupDrawing();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const onClick = (e: maplibregl.MapMouseEvent) => handleMapClick(e);
    const onDblClick = (e: maplibregl.MapMouseEvent) => handleDblClick(e);
    const onMove = (e: maplibregl.MapMouseEvent) => handleMouseMove(e);

    map.on("click", onClick);
    map.on("dblclick", onDblClick);
    map.on("mousemove", onMove);

    return () => {
      map.off("click", onClick);
      map.off("dblclick", onDblClick);
      map.off("mousemove", onMove);
    };
  }, [handleMapClick, handleDblClick, handleMouseMove]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !geofencesData) return;

    const onLoad = () => renderGeofences(map, geofencesData.items, selectedGeofenceId ?? null);

    if (map.isStyleLoaded()) {
      onLoad();
    } else {
      map.on("load", onLoad);
    }

    return () => {
      map.off("load", onLoad);
    };
  }, [geofencesData, selectedGeofenceId]);

  return <div ref={containerRef} className={cn("h-full w-full", className)} />;
});

function renderGeofences(map: maplibregl.Map, geofences: Geofence[], selectedId: string | null) {
  for (const gf of geofences) {
    const srcId = `gf-${gf.id}`;
    const fillId = `gf-fill-${gf.id}`;
    const lineId = `gf-line-${gf.id}`;

    if (map.getLayer(fillId)) map.removeLayer(fillId);
    if (map.getLayer(lineId)) map.removeLayer(lineId);
    if (map.getSource(srcId)) map.removeSource(srcId);

    let geojson: GeoJSON.Feature | null = null;

    if (gf.shape === "polygon" && gf.geometry) {
      geojson = {
        type: "Feature",
        properties: { id: gf.id },
        geometry: gf.geometry as GeoJSON.Polygon,
      };
    } else if (gf.shape === "circle" && gf.circleCenter && gf.radiusMeters) {
      const raw = gf.circleCenter as
        | { coordinates: [number, number] }
        | { lng: number; lat: number };
      const center: [number, number] = "coordinates" in raw ? raw.coordinates : [raw.lng, raw.lat];
      const ring = generateCircleCoords(center, gf.radiusMeters);
      geojson = {
        type: "Feature",
        properties: { id: gf.id },
        geometry: { type: "Polygon", coordinates: [ring] },
      };
    }

    if (!geojson) continue;

    const isSelected = gf.id === selectedId;

    map.addSource(srcId, { type: "geojson", data: geojson });

    map.addLayer({
      id: fillId,
      type: "fill",
      source: srcId,
      paint: {
        "fill-color": gf.color,
        "fill-opacity": isSelected ? 0.35 : 0.15,
      },
    });

    map.addLayer({
      id: lineId,
      type: "line",
      source: srcId,
      paint: {
        "line-color": gf.color,
        "line-width": isSelected ? 3 : 1.5,
      },
    });
  }
}
