import { useQuery } from "@tanstack/react-query";
import maplibregl from "maplibre-gl";
import { useEffect, useRef } from "react";
import { getHistory } from "@/api/locations";
import type { Trip } from "@/api/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, Skeleton } from "@/components/ui";
import { env } from "@/env";

interface TripMapModalProps {
  trip: Trip | null;
  onClose: () => void;
}

export function TripMapModal({ trip, onClose }: TripMapModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  const { data: locations, isLoading } = useQuery({
    queryKey: ["trip-route", trip?.id],
    queryFn: () =>
      getHistory({
        vehicleId: trip!.vehicleId,
        from: trip!.startedAt,
        to: trip!.endedAt ?? new Date().toISOString(),
      }),
    enabled: !!trip,
  });

  useEffect(() => {
    if (!containerRef.current || !locations || locations.length === 0) return;

    const coords = locations
      .filter((l) => l.lng != null && l.lat != null)
      .map((l) => [l.lng!, l.lat!] as [number, number]);

    if (coords.length === 0) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: env.MAP_STYLE_URL,
      center: coords[0]!,
      zoom: 12,
      attributionControl: false,
    });

    mapRef.current = map;

    map.on("load", () => {
      map.addSource("trip-route", {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates: coords,
          },
        },
      });

      map.addLayer({
        id: "trip-route-line",
        type: "line",
        source: "trip-route",
        paint: {
          "line-color": "#3b82f6",
          "line-width": 3,
        },
      });

      const startCoord = coords[0]!;
      const endCoord = coords[coords.length - 1]!;

      new maplibregl.Marker({ color: "#10b981" }).setLngLat(startCoord).addTo(map);

      new maplibregl.Marker({ color: "#ef4444" }).setLngLat(endCoord).addTo(map);

      const bounds = coords.reduce(
        (b, c) => b.extend(c),
        new maplibregl.LngLatBounds(startCoord, startCoord),
      );
      map.fitBounds(bounds, { padding: 40, maxZoom: 16 });
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [locations]);

  return (
    <Dialog open={!!trip} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            Trip Route
            {trip?.vehicle && ` — ${trip.vehicle.plate}`}
          </DialogTitle>
        </DialogHeader>
        <div className="h-[400px] overflow-hidden rounded-md border border-gray-200 dark:border-gray-700">
          {isLoading ? (
            <Skeleton className="h-full w-full" />
          ) : locations && locations.length > 0 ? (
            <div ref={containerRef} className="h-full w-full" />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-gray-400">
              No route data found
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
