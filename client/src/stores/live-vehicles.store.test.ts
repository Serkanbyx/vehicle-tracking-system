import { describe, it, expect, beforeEach } from "vitest";
import { useLiveStore, useLiveVehicle, useVehicleStatusCounts } from "@/stores/live-vehicles.store";
import type { LiveVehicle } from "@/stores/live-vehicles.store";

const makeVehicle = (overrides: Partial<LiveVehicle> = {}): LiveVehicle => ({
  id: "v1",
  plate: "34 ABC 01",
  coordinates: [29.0, 41.0],
  speed: 60,
  heading: 90,
  status: "moving",
  timestamp: new Date().toISOString(),
  ...overrides,
});

beforeEach(() => {
  useLiveStore.getState().reset();
});

describe("useLiveStore — hydrate", () => {
  it("should populate vehicles from a list", () => {
    const v1 = makeVehicle({ id: "v1" });
    const v2 = makeVehicle({ id: "v2", plate: "06 XYZ 99" });

    useLiveStore.getState().hydrate([v1, v2]);

    expect(useLiveStore.getState().vehicles.size).toBe(2);
    expect(useLiveStore.getState().vehicles.get("v1")).toEqual(v1);
    expect(useLiveStore.getState().vehicles.get("v2")).toEqual(v2);
  });

  it("should replace previous vehicles", () => {
    useLiveStore.getState().hydrate([makeVehicle({ id: "old" })]);
    useLiveStore.getState().hydrate([makeVehicle({ id: "new" })]);

    expect(useLiveStore.getState().vehicles.size).toBe(1);
    expect(useLiveStore.getState().vehicles.has("old")).toBe(false);
    expect(useLiveStore.getState().vehicles.has("new")).toBe(true);
  });
});

describe("useLiveStore — upsert", () => {
  it("should add a new vehicle", () => {
    const v = makeVehicle({ id: "v1" });
    useLiveStore.getState().upsert(v);

    expect(useLiveStore.getState().vehicles.get("v1")).toEqual(v);
  });

  it("should update an existing vehicle", () => {
    useLiveStore.getState().upsert(makeVehicle({ id: "v1", speed: 60 }));
    useLiveStore.getState().upsert(makeVehicle({ id: "v1", speed: 120 }));

    expect(useLiveStore.getState().vehicles.get("v1")?.speed).toBe(120);
    expect(useLiveStore.getState().vehicles.size).toBe(1);
  });
});

describe("useLiveStore — setStatus", () => {
  it("should update the status of an existing vehicle", () => {
    useLiveStore
      .getState()
      .upsert(makeVehicle({ id: "v1", status: "moving" }));
    useLiveStore.getState().setStatus("v1", "idle");

    expect(useLiveStore.getState().vehicles.get("v1")?.status).toBe("idle");
  });

  it("should be a no-op for unknown vehicle", () => {
    useLiveStore.getState().upsert(makeVehicle({ id: "v1" }));
    useLiveStore.getState().setStatus("unknown", "offline");

    expect(useLiveStore.getState().vehicles.size).toBe(1);
  });
});

describe("useLiveStore — reset", () => {
  it("should clear all vehicles", () => {
    useLiveStore.getState().hydrate([makeVehicle(), makeVehicle({ id: "v2" })]);
    useLiveStore.getState().reset();

    expect(useLiveStore.getState().vehicles.size).toBe(0);
  });
});

describe("useLiveStore — selectors", () => {
  it("useLiveVehicle should return the correct vehicle", () => {
    const v = makeVehicle({ id: "v1" });
    useLiveStore.getState().upsert(v);

    const result = useLiveStore.getState().vehicles.get("v1");
    expect(result).toEqual(v);
  });

  it("useLiveVehicle should return undefined for missing id", () => {
    const result = useLiveStore.getState().vehicles.get("nope");
    expect(result).toBeUndefined();
  });

  it("useVehicleStatusCounts should correctly tally statuses", () => {
    useLiveStore.getState().hydrate([
      makeVehicle({ id: "v1", status: "moving" }),
      makeVehicle({ id: "v2", status: "moving" }),
      makeVehicle({ id: "v3", status: "idle" }),
      makeVehicle({ id: "v4", status: "offline" }),
    ]);

    const state = useLiveStore.getState();
    let moving = 0;
    let idle = 0;
    let offline = 0;
    for (const v of state.vehicles.values()) {
      if (v.status === "moving") moving++;
      else if (v.status === "idle") idle++;
      else offline++;
    }

    expect(moving).toBe(2);
    expect(idle).toBe(1);
    expect(offline).toBe(1);
  });
});

describe("useLiveStore — no PII leaks to localStorage", () => {
  it("should not persist to localStorage", () => {
    useLiveStore.getState().upsert(makeVehicle({ id: "v1" }));

    const keys = Object.keys(localStorage);
    const leaked = keys.some(
      (k) => k.includes("live") || k.includes("vehicle"),
    );
    expect(leaked).toBe(false);
  });
});
