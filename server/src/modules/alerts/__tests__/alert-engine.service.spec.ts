import { beforeEach, describe, expect, it, vi } from "vitest";
import { AlertSeverity, AlertType } from "../../../common/enums/alert.enum.js";
import { GeofenceDirection } from "../../../common/enums/geofence.enum.js";
import { AlertEngineService } from "../alert-engine.service.js";

/* ------------------------------------------------------------------ */
/*  Mocks                                                              */
/* ------------------------------------------------------------------ */

const createMockQueryBuilder = () => ({
  where: vi.fn().mockReturnThis(),
  andWhere: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  getOne: vi.fn().mockResolvedValue(null),
});

const mockAlertsRepo = {
  createQueryBuilder: vi.fn(),
  query: vi.fn(),
};

const mockGeofencesService = {
  findContaining: vi.fn(),
};

const mockRoomManager = {
  broadcastToMany: vi.fn(),
};

const fakeEnv: Record<string, unknown> = {
  "app.speedLimitKmh": 90,
};

const mockConfigService = {
  get: vi.fn((key: string) => fakeEnv[key]),
};

let engine: AlertEngineService;

beforeEach(() => {
  vi.clearAllMocks();

  mockAlertsRepo.createQueryBuilder.mockImplementation(() => createMockQueryBuilder());
  mockAlertsRepo.query.mockImplementation(async (_sql: string, params: unknown[]) => [
    {
      id: "alert-1",
      vehicleId: params[0],
      type: params[1],
      severity: params[2],
      message: params[3],
      speed: params[6],
      geofenceId: params[7],
    },
  ]);
  mockGeofencesService.findContaining.mockResolvedValue([]);

  engine = new AlertEngineService(
    mockAlertsRepo as any,
    mockGeofencesService as any,
    mockRoomManager as any,
    mockConfigService as any,
  );
});

/* ------------------------------------------------------------------ */
/*  Speed alerts                                                       */
/* ------------------------------------------------------------------ */

describe("AlertEngineService — Speed alerts", () => {
  const vehicle = { id: "v1", speedLimitKmh: 100 };

  it("should NOT create alert when speed is at or below limit", async () => {
    const alerts = await engine.run(vehicle, null, {
      lng: 29,
      lat: 41,
      speed: 100,
    });

    expect(alerts).toHaveLength(0);
    expect(mockAlertsRepo.query).not.toHaveBeenCalled();
  });

  it("should create WARNING alert when speed exceeds limit by < 30 km/h", async () => {
    const alerts = await engine.run(vehicle, null, {
      lng: 29,
      lat: 41,
      speed: 120,
    });

    expect(alerts).toHaveLength(1);
    expect(mockAlertsRepo.query).toHaveBeenCalled();

    const callArgs = mockAlertsRepo.query.mock.calls[0][1];
    expect(callArgs[1]).toBe(AlertType.SPEED);
    expect(callArgs[2]).toBe(AlertSeverity.WARNING);
  });

  it("should create CRITICAL alert when speed exceeds limit by >= 30 km/h", async () => {
    const alerts = await engine.run(vehicle, null, {
      lng: 29,
      lat: 41,
      speed: 131,
    });

    expect(alerts).toHaveLength(1);
    const callArgs = mockAlertsRepo.query.mock.calls[0][1];
    expect(callArgs[2]).toBe(AlertSeverity.CRITICAL);
  });

  it("should use default speed limit (90) when vehicle has none", async () => {
    const vehicleNoLimit = { id: "v2", speedLimitKmh: null as any };

    const alerts = await engine.run(vehicleNoLimit, null, {
      lng: 29,
      lat: 41,
      speed: 95,
    });

    expect(alerts).toHaveLength(1);
    const callArgs = mockAlertsRepo.query.mock.calls[0][1];
    expect(callArgs[3]).toContain("exceeds limit 90");
  });

  it("should debounce — skip alert if recent speed alert exists", async () => {
    const qb = createMockQueryBuilder();
    qb.getOne.mockResolvedValue({ id: "existing-alert" });
    mockAlertsRepo.createQueryBuilder.mockReturnValue(qb);

    const alerts = await engine.run(vehicle, null, {
      lng: 29,
      lat: 41,
      speed: 150,
    });

    expect(alerts).toHaveLength(0);
    expect(mockAlertsRepo.query).not.toHaveBeenCalled();
  });

  it("should include speed value in the persisted alert message", async () => {
    await engine.run(vehicle, null, { lng: 29, lat: 41, speed: 115 });

    const callArgs = mockAlertsRepo.query.mock.calls[0][1];
    expect(callArgs[3]).toContain("115");
    expect(callArgs[3]).toContain("100");
  });

  it("should broadcast the alert to vehicle and role rooms", async () => {
    await engine.run(vehicle, null, { lng: 29, lat: 41, speed: 120 });

    expect(mockRoomManager.broadcastToMany).toHaveBeenCalledWith(
      [`vehicle:${vehicle.id}`, "role:manager", "role:admin"],
      expect.objectContaining({ type: "alert:new" }),
    );
  });
});

/* ------------------------------------------------------------------ */
/*  Geofence alerts                                                    */
/* ------------------------------------------------------------------ */

describe("AlertEngineService — Geofence alerts", () => {
  const vehicle = { id: "v1", speedLimitKmh: 200 };
  const prev = { lng: 29, lat: 41, speed: 50 };
  const next = { lng: 29.01, lat: 41.01, speed: 50 };

  const geofenceEnter = {
    id: "gf-1",
    name: "Zone A",
    direction: GeofenceDirection.ENTER,
  };

  const geofenceExit = {
    id: "gf-2",
    name: "Zone B",
    direction: GeofenceDirection.EXIT,
  };

  const geofenceBoth = {
    id: "gf-3",
    name: "Zone C",
    direction: GeofenceDirection.BOTH,
  };

  it("should create ENTER alert when vehicle enters a geofence", async () => {
    mockGeofencesService.findContaining
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([geofenceEnter]);

    const alerts = await engine.run(vehicle, prev, next);

    expect(alerts).toHaveLength(1);
    const callArgs = mockAlertsRepo.query.mock.calls[0][1];
    expect(callArgs[1]).toBe(AlertType.GEOFENCE_ENTER);
    expect(callArgs[3]).toContain("entered");
    expect(callArgs[3]).toContain("Zone A");
  });

  it("should create EXIT alert when vehicle exits a geofence", async () => {
    mockGeofencesService.findContaining
      .mockResolvedValueOnce([geofenceExit])
      .mockResolvedValueOnce([]);

    const alerts = await engine.run(vehicle, prev, next);

    expect(alerts).toHaveLength(1);
    const callArgs = mockAlertsRepo.query.mock.calls[0][1];
    expect(callArgs[1]).toBe(AlertType.GEOFENCE_EXIT);
    expect(callArgs[3]).toContain("exited");
    expect(callArgs[3]).toContain("Zone B");
  });

  it("should create BOTH enter+exit alerts for BOTH direction geofence", async () => {
    mockGeofencesService.findContaining
      .mockResolvedValueOnce([geofenceBoth])
      .mockResolvedValueOnce([]);

    const alerts = await engine.run(vehicle, prev, next);

    expect(alerts).toHaveLength(1);
    const callArgs = mockAlertsRepo.query.mock.calls[0][1];
    expect(callArgs[1]).toBe(AlertType.GEOFENCE_EXIT);
  });

  it("should NOT create alert for ENTER-only geofence on exit", async () => {
    mockGeofencesService.findContaining
      .mockResolvedValueOnce([geofenceEnter])
      .mockResolvedValueOnce([]);

    const alerts = await engine.run(vehicle, prev, next);

    expect(alerts).toHaveLength(0);
  });

  it("should NOT create alert for EXIT-only geofence on enter", async () => {
    mockGeofencesService.findContaining
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([geofenceExit]);

    const alerts = await engine.run(vehicle, prev, next);

    expect(alerts).toHaveLength(0);
  });

  it("should handle no previous location (first point)", async () => {
    mockGeofencesService.findContaining.mockResolvedValueOnce([geofenceEnter]);

    const alerts = await engine.run(vehicle, null, next);

    expect(alerts).toHaveLength(1);
    const callArgs = mockAlertsRepo.query.mock.calls[0][1];
    expect(callArgs[1]).toBe(AlertType.GEOFENCE_ENTER);
  });

  it("should handle vehicle staying inside the same geofence (no diff)", async () => {
    mockGeofencesService.findContaining
      .mockResolvedValueOnce([geofenceEnter])
      .mockResolvedValueOnce([geofenceEnter]);

    const alerts = await engine.run(vehicle, prev, next);

    expect(alerts).toHaveLength(0);
  });
});

/* ------------------------------------------------------------------ */
/*  Severity calculation                                               */
/* ------------------------------------------------------------------ */

describe("AlertEngineService — Severity thresholds", () => {
  const vehicle = { id: "v1", speedLimitKmh: 100 };

  it("exactly 30 over limit → CRITICAL", async () => {
    await engine.run(vehicle, null, { lng: 29, lat: 41, speed: 130 });

    const callArgs = mockAlertsRepo.query.mock.calls[0][1];
    expect(callArgs[2]).toBe(AlertSeverity.CRITICAL);
  });

  it("29 over limit → WARNING", async () => {
    await engine.run(vehicle, null, { lng: 29, lat: 41, speed: 129 });

    const callArgs = mockAlertsRepo.query.mock.calls[0][1];
    expect(callArgs[2]).toBe(AlertSeverity.WARNING);
  });

  it("1 over limit → WARNING", async () => {
    await engine.run(vehicle, null, { lng: 29, lat: 41, speed: 101 });

    const callArgs = mockAlertsRepo.query.mock.calls[0][1];
    expect(callArgs[2]).toBe(AlertSeverity.WARNING);
  });
});
