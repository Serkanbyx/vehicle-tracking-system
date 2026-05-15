import { create } from "zustand";

export type LiveVehicle = {
  id: string;
  plate: string;
  coordinates: [number, number];
  speed: number;
  heading: number;
  status: "moving" | "idle" | "offline";
  timestamp: string;
};

type State = {
  vehicles: Map<string, LiveVehicle>;
  hydrate: (vehicles: LiveVehicle[]) => void;
  upsert: (v: LiveVehicle) => void;
  setStatus: (id: string, status: LiveVehicle["status"]) => void;
  reset: () => void;
};

export const useLiveStore = create<State>((set) => ({
  vehicles: new Map(),

  hydrate: (list) => set({ vehicles: new Map(list.map((v) => [v.id, v])) }),

  upsert: (v) =>
    set((s) => {
      const next = new Map(s.vehicles);
      next.set(v.id, v);
      return { vehicles: next };
    }),

  setStatus: (id, status) =>
    set((s) => {
      const cur = s.vehicles.get(id);
      if (!cur) return s;
      const next = new Map(s.vehicles);
      next.set(id, { ...cur, status });
      return { vehicles: next };
    }),

  reset: () => set({ vehicles: new Map() }),
}));

export const useLiveVehicle = (id: string) => useLiveStore((s) => s.vehicles.get(id));

export const useVehicleStatusCounts = () =>
  useLiveStore((s) => {
    let moving = 0;
    let idle = 0;
    let offline = 0;
    for (const v of s.vehicles.values()) {
      if (v.status === "moving") moving++;
      else if (v.status === "idle") idle++;
      else offline++;
    }
    return { moving, idle, offline, total: s.vehicles.size };
  });
