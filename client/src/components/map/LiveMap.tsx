import { useQuery } from "@tanstack/react-query";
import maplibregl from "maplibre-gl";
import { useEffect, useRef } from "react";
import type { Vehicle } from "@/api/types";
import { listVehicles } from "@/api/vehicles";
import { usePreferences } from "@/context/preferences.context";
import { env } from "@/env";
import { cn } from "@/lib/cn";
import type { LiveVehicle } from "@/stores/live-vehicles.store";
import { useLiveStore } from "@/stores/live-vehicles.store";

function toLiveVehicle(v: Vehicle): LiveVehicle {
  return {
    id: v.id,
    plate: v.plate,
    coordinates: v.lastLocation ? [v.lastLocation.lng, v.lastLocation.lat] : [0, 0],
    speed: v.lastLocation?.speed ?? 0,
    heading: v.lastLocation?.heading ?? 0,
    status: v.lastLocation?.status ?? "offline",
    timestamp: v.lastLocation?.timestamp ?? new Date().toISOString(),
  };
}

const STATUS_COLORS: Record<LiveVehicle["status"], string> = {
  moving: "#10b981",
  idle: "#f59e0b",
  offline: "#6b7280",
};

interface LiveMapProps {
  className?: string;
}

export function LiveMap({ className }: LiveMapProps) {
  const mapRef = useRef<maplibregl.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<Map<string, maplibregl.Marker>>(new Map());
  const { preferences } = usePreferences();

  const mapDefaults = preferences.mapDefaults ?? {
    center: [35.2, 39.0] as [number, number],
    zoom: 6,
  };

  const { data } = useQuery({
    queryKey: ["vehicles", "live"],
    queryFn: () => listVehicles({ limit: 50, isActive: true }),
  });

  useEffect(() => {
    if (data) {
      useLiveStore.getState().hydrate(data.items.map(toLiveVehicle));
    }
  }, [data]);

  useEffect(() => {
    if (!containerRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: env.MAP_STYLE_URL,
      center: mapDefaults.center as [number, number],
      zoom: mapDefaults.zoom ?? 6,
      attributionControl: false,
    });

    map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-left");
    map.addControl(new maplibregl.NavigationControl(), "top-right");

    mapRef.current = map;

    return () => {
      markersRef.current.forEach((m) => {
        m.remove();
      });
      markersRef.current.clear();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const unsub = useLiveStore.subscribe((state) => {
      const map = mapRef.current;
      if (!map) return;

      const activeIds = new Set<string>();

      for (const vehicle of state.vehicles.values()) {
        activeIds.add(vehicle.id);
        const [lng, lat] = vehicle.coordinates;
        if (lng === 0 && lat === 0) continue;

        let marker = markersRef.current.get(vehicle.id);

        if (!marker) {
          const el = document.createElement("div");
          el.className = "live-marker";
          el.style.width = "14px";
          el.style.height = "14px";
          el.style.borderRadius = "50%";
          el.style.border = "2px solid white";
          el.style.boxShadow = "0 1px 3px rgba(0,0,0,0.3)";
          el.style.cursor = "pointer";
          el.title = vehicle.plate;

          marker = new maplibregl.Marker({ element: el }).setLngLat([lng, lat]).addTo(map);

          markersRef.current.set(vehicle.id, marker);
        } else {
          marker.setLngLat([lng, lat]);
        }

        const el = marker.getElement();
        el.style.backgroundColor = STATUS_COLORS[vehicle.status];
        el.title = `${vehicle.plate} — ${vehicle.speed.toFixed(0)} km/h`;
      }

      for (const [id, marker] of markersRef.current) {
        if (!activeIds.has(id)) {
          marker.remove();
          markersRef.current.delete(id);
        }
      }
    });

    return () => unsub();
  }, []);

  return <div ref={containerRef} className={cn("h-full w-full", className)} />;
}
