import { useQuery } from "@tanstack/react-query";
import { Circle, Hexagon, Plus, Search } from "lucide-react";
import { useState } from "react";
import { listGeofences } from "@/api/geofences";
import type { Geofence } from "@/api/types";
import { Badge, Button, Input, Select, Switch } from "@/components/ui";
import { useAuth } from "@/context/auth.context";
import { cn } from "@/lib/cn";

interface GeofenceListProps {
  onSelect: (geofence: Geofence) => void;
  onNew: () => void;
  selectedId?: string;
}

export function GeofenceList({ onSelect, onNew, selectedId }: GeofenceListProps) {
  const { hasRole } = useAuth();
  const [search, setSearch] = useState("");
  const [shapeFilter, setShapeFilter] = useState<string>("");
  const [activeFilter, setActiveFilter] = useState<boolean | undefined>(undefined);

  const { data } = useQuery({
    queryKey: ["geofences", search, shapeFilter, activeFilter],
    queryFn: () =>
      listGeofences({
        q: search || undefined,
        shape: shapeFilter || undefined,
        isActive: activeFilter,
      }),
  });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Geofences</h2>
        {hasRole("manager", "admin") && (
          <Button size="sm" onClick={onNew}>
            <Plus className="mr-1 h-4 w-4" />
            New
          </Button>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="Search by name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="flex items-center gap-2">
        <Select
          value={shapeFilter}
          onChange={(e) => setShapeFilter(e.target.value)}
          className="w-32"
        >
          <option value="">All</option>
          <option value="polygon">Polygon</option>
          <option value="circle">Circle</option>
        </Select>

        <label
          htmlFor="geofence-active-filter"
          className="flex items-center gap-2 text-sm text-gray-500"
        >
          <Switch
            id="geofence-active-filter"
            checked={activeFilter === true}
            onCheckedChange={(checked) => setActiveFilter(checked ? true : undefined)}
          />
          Active
        </label>
      </div>

      <div
        className="flex flex-col gap-1.5 overflow-y-auto"
        style={{ maxHeight: "calc(100vh - 320px)" }}
      >
        {!data || data.items.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-400">No geofences found</p>
        ) : (
          data.items.map((gf) => (
            <button
              key={gf.id}
              type="button"
              onClick={() => onSelect(gf)}
              className={cn(
                "flex items-center gap-3 rounded-md border p-3 text-left transition-colors",
                selectedId === gf.id
                  ? "border-brand-500 bg-brand-50 dark:bg-brand-900/10"
                  : "border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800",
              )}
            >
              <span
                className="inline-block h-4 w-4 shrink-0 rounded"
                style={{ backgroundColor: gf.color }}
              />
              {gf.shape === "polygon" ? (
                <Hexagon className="h-4 w-4 shrink-0 text-gray-400" />
              ) : (
                <Circle className="h-4 w-4 shrink-0 text-gray-400" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{gf.name}</p>
                {gf.description && (
                  <p className="truncate text-xs text-gray-400">{gf.description}</p>
                )}
              </div>
              {!gf.isActive && (
                <Badge variant="secondary" className="text-xs">
                  Inactive
                </Badge>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
