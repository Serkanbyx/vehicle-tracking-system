import { useQuery } from "@tanstack/react-query";
import { Eye, EyeOff, Flame } from "lucide-react";
import maplibregl from "maplibre-gl";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { HeatmapResponse } from "@/api/types";
import { getHeatmap, listVehicles } from "@/api/vehicles";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Select,
  Skeleton,
} from "@/components/ui";
import { env } from "@/env";

const MAX_RANGE_DAYS = 30;

export function HeatmapPanel() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  const [vehicleId, setVehicleId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [visible, setVisible] = useState(true);
  const [generated, setGenerated] = useState(false);

  const { data: vehiclesData } = useQuery({
    queryKey: ["vehicles", "picker"],
    queryFn: () => listVehicles({ limit: 200, isActive: true }),
    staleTime: 5 * 60_000,
  });

  const {
    data: heatmapData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["heatmap", vehicleId, from, to],
    queryFn: () => getHeatmap(vehicleId, { from, to }),
    enabled: false,
  });

  const handleGenerate = () => {
    if (!vehicleId || !from || !to) {
      toast.error("Vehicle, start, and end date are required.");
      return;
    }
    const diffDays = (new Date(to).getTime() - new Date(from).getTime()) / 86_400_000;
    if (diffDays > MAX_RANGE_DAYS) {
      toast.error(`Maximum ${MAX_RANGE_DAYS}-day range allowed.`);
      return;
    }
    if (diffDays < 0) {
      toast.error("End date must be after start date.");
      return;
    }
    setGenerated(true);
    void refetch();
  };

  useEffect(() => {
    if (!containerRef.current || !heatmapData || !generated) return;

    const existingMap = mapRef.current;
    if (existingMap) {
      renderHeatmap(existingMap, heatmapData, visible);
      return;
    }

    const firstPt = heatmapData.points[0];
    const center: [number, number] = firstPt ? [firstPt.lng, firstPt.lat] : [35.2, 39.0];

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: env.MAP_STYLE_URL,
      center,
      zoom: 10,
      attributionControl: false,
    });

    mapRef.current = map;

    map.on("load", () => {
      renderHeatmap(map, heatmapData, visible);
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [heatmapData, generated]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map?.isStyleLoaded()) return;
    if (map.getLayer("heatmap-layer")) {
      map.setLayoutProperty("heatmap-layer", "visibility", visible ? "visible" : "none");
    }
  }, [visible]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Flame className="h-4 w-4 text-warning" />
          Heatmap
        </CardTitle>
        {generated && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setVisible((v) => !v)}
          >
            {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="hm-vehicle">Vehicle</Label>
          <Select id="hm-vehicle" value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
            <option value="">Select</option>
            {vehiclesData?.items.map((v) => (
              <option key={v.id} value={v.id}>
                {v.plate}
              </option>
            ))}
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-1">
            <Label htmlFor="hm-from">Start</Label>
            <Input
              id="hm-from"
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="hm-to">End</Label>
            <Input id="hm-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
        </div>

        <Button size="sm" onClick={handleGenerate} disabled={isLoading || !vehicleId}>
          {isLoading ? "Loading…" : "Generate"}
        </Button>

        <div
          className="overflow-hidden rounded-md border border-gray-200 dark:border-gray-700"
          style={{ height: generated ? "280px" : "0px", transition: "height 0.3s ease" }}
        >
          {isLoading ? (
            <Skeleton className="h-full w-full" />
          ) : (
            <div ref={containerRef} className="h-full w-full" />
          )}
        </div>

        {heatmapData && (
          <p className="text-xs text-gray-500">
            {heatmapData.total} points
            {heatmapData.downsampled ? " (downsampled)" : ""}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function renderHeatmap(map: maplibregl.Map, data: HeatmapResponse, visible: boolean) {
  if (map.getLayer("heatmap-layer")) map.removeLayer("heatmap-layer");
  if (map.getSource("heatmap-src")) map.removeSource("heatmap-src");

  if (data.points.length === 0) return;

  const features: GeoJSON.Feature[] = data.points.map((p) => ({
    type: "Feature",
    properties: { intensity: p.intensity },
    geometry: { type: "Point", coordinates: [p.lng, p.lat] },
  }));

  map.addSource("heatmap-src", {
    type: "geojson",
    data: { type: "FeatureCollection", features },
  });

  map.addLayer({
    id: "heatmap-layer",
    type: "heatmap",
    source: "heatmap-src",
    paint: {
      "heatmap-weight": ["get", "intensity"],
      "heatmap-intensity": 1,
      "heatmap-radius": 20,
      "heatmap-color": [
        "interpolate",
        ["linear"],
        ["heatmap-density"],
        0,
        "rgba(0,0,255,0)",
        0.2,
        "royalblue",
        0.4,
        "cyan",
        0.6,
        "lime",
        0.8,
        "yellow",
        1,
        "red",
      ],
      "heatmap-opacity": 0.8,
    },
    layout: {
      visibility: visible ? "visible" : "none",
    },
  });

  const bounds = data.points.reduce(
    (b, p) => b.extend([p.lng, p.lat]),
    new maplibregl.LngLatBounds(
      [data.points[0]!.lng, data.points[0]!.lat],
      [data.points[0]!.lng, data.points[0]!.lat],
    ),
  );
  map.fitBounds(bounds, { padding: 30, maxZoom: 14 });
}
