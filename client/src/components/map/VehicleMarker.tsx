import maplibregl from "maplibre-gl";
import { useEffect, useRef } from "react";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { useLiveVehicle } from "@/stores/live-vehicles.store";
import type { LiveVehicle } from "@/stores/live-vehicles.store";
import { useSmoothPosition } from "@/hooks/use-smooth-position";
import { escapeHtml } from "@/utils/escape-html";

function buildPopupHtml(vehicle: LiveVehicle | undefined): string {
  if (!vehicle) return "";

  const plate = escapeHtml(vehicle.plate);
  const speed = vehicle.speed.toFixed(0);
  const relTime = escapeHtml(
    formatDistanceToNow(new Date(vehicle.timestamp), {
      addSuffix: true,
      locale: tr,
    }),
  );

  const statusLabel =
    vehicle.status === "moving"
      ? "Hareket Halinde"
      : vehicle.status === "idle"
        ? "Boşta"
        : "Çevrimdışı";

  const statusColor =
    vehicle.status === "moving"
      ? "#10b981"
      : vehicle.status === "idle"
        ? "#f59e0b"
        : "#6b7280";

  return `
    <div style="min-width:180px;font-family:system-ui,sans-serif;font-size:13px;">
      <div style="font-size:16px;font-weight:700;margin-bottom:4px;">${plate}</div>
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
        <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${statusColor}"></span>
        <span>${escapeHtml(statusLabel)}</span>
      </div>
      <div style="color:#666;margin-bottom:2px;">Hız: <strong>${speed} km/h</strong></div>
      <div style="color:#666;margin-bottom:6px;">Yön: ${vehicle.heading}°</div>
      <div style="color:#999;font-size:11px;margin-bottom:8px;">${relTime}</div>
      <div style="display:flex;gap:8px;">
        <a href="/vehicles/${escapeHtml(vehicle.id)}" style="color:#2563eb;text-decoration:none;font-size:12px;">Detay</a>
        <a href="/vehicles/${escapeHtml(vehicle.id)}#history" style="color:#2563eb;text-decoration:none;font-size:12px;">Geçmiş</a>
      </div>
    </div>
  `;
}

interface VehicleMarkerProps {
  id: string;
  map: maplibregl.Map;
}

export function VehicleMarker({ id, map }: VehicleMarkerProps) {
  const vehicle = useLiveVehicle(id);
  const pos = useSmoothPosition(vehicle?.coordinates ?? [0, 0]);
  const elRef = useRef<HTMLDivElement>(document.createElement("div"));
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const popupRef = useRef<maplibregl.Popup | null>(null);

  useEffect(() => {
    if (!vehicle) return;
    const el = elRef.current;
    el.className = `vehicle-marker status-${vehicle.status}`;
    el.style.transform = `rotate(${vehicle.heading}deg)`;
    el.setAttribute("aria-label", `${vehicle.plate} — ${vehicle.status}`);
  }, [vehicle?.status, vehicle?.heading]);

  useEffect(() => {
    if (popupRef.current && vehicle) {
      popupRef.current.setHTML(buildPopupHtml(vehicle));
    }
  }, [vehicle]);

  useEffect(() => {
    popupRef.current = new maplibregl.Popup({ offset: 24, closeButton: true });
    if (vehicle) {
      popupRef.current.setHTML(buildPopupHtml(vehicle));
    }

    markerRef.current = new maplibregl.Marker({ element: elRef.current })
      .setLngLat(pos)
      .setPopup(popupRef.current)
      .addTo(map);

    return () => {
      markerRef.current?.remove();
      markerRef.current = null;
      popupRef.current = null;
    };
  }, [map]);

  useEffect(() => {
    markerRef.current?.setLngLat(pos);
  }, [pos]);

  return null;
}
