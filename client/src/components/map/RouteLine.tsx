import type { GeoJSON } from "geojson";
import type maplibregl from "maplibre-gl";
import { useEffect, useRef } from "react";

interface RouteLineProps {
  map: maplibregl.Map | null;
  geojson: GeoJSON.FeatureCollection | GeoJSON.Feature | null;
  color?: string;
}

const SOURCE_ID = "route-line-source";
const LAYER_ID = "route-line-layer";

export function RouteLine({ map, geojson, color = "#2563eb" }: RouteLineProps) {
  const addedRef = useRef(false);

  useEffect(() => {
    if (!map || !geojson) return;

    if (map.getSource(SOURCE_ID)) {
      (map.getSource(SOURCE_ID) as maplibregl.GeoJSONSource).setData(geojson as GeoJSON.GeoJSON);
      return;
    }

    map.addSource(SOURCE_ID, {
      type: "geojson",
      data: geojson as GeoJSON.GeoJSON,
    });

    map.addLayer({
      id: LAYER_ID,
      type: "line",
      source: SOURCE_ID,
      layout: {
        "line-join": "round",
        "line-cap": "round",
      },
      paint: {
        "line-color": color,
        "line-width": 3,
        "line-opacity": 0.8,
      },
    });

    addedRef.current = true;

    return () => {
      if (addedRef.current && map.getLayer(LAYER_ID)) {
        map.removeLayer(LAYER_ID);
        map.removeSource(SOURCE_ID);
        addedRef.current = false;
      }
    };
  }, [map, geojson, color]);

  return null;
}
