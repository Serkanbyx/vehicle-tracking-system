import WebSocket from "ws";

/* ── CLI args ───────────────────────────────────────────────────── */

const args = process.argv.slice(2);

function getArg(name: string, fallback: string): string {
  const prefix = `--${name}=`;
  const match = args.find((a) => a.startsWith(prefix));
  return match ? match.slice(prefix.length) : fallback;
}

const VEHICLE_COUNT = parseInt(getArg("vehicles", "5"), 10);
const TICK_MS = parseInt(getArg("tick", "2000"), 10);
const SPEED_SPIKE_CHANCE = parseFloat(getArg("speedSpikeChance", "0.08"));
const BBOX = getArg("bbox", "28.8,40.9,29.2,41.15")
  .split(",")
  .map(Number) as [number, number, number, number];

const SOCKET_URL = process.env.SOCKET_URL || "ws://localhost:5000";
const SIMULATOR_API_KEY = process.env.SIMULATOR_API_KEY || "";
const API_URL = process.env.API_URL || "http://localhost:5000/api";

/* ── Vehicle state ──────────────────────────────────────────────── */

interface SimVehicle {
  id: string;
  plate: string;
  lng: number;
  lat: number;
  heading: number;
}

const vehicles: SimVehicle[] = [];

function randomInRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function generatePlate(index: number): string {
  return `SIM-${String(index + 1).padStart(3, "0")}`;
}

/* ── REST helpers ───────────────────────────────────────────────── */

async function fetchVehicles(): Promise<{ id: string; plate: string }[]> {
  const res = await fetch(`${API_URL}/vehicles?limit=50`, {
    headers: { "X-Simulator-Key": SIMULATOR_API_KEY },
  });

  if (!res.ok) {
    console.error(`Failed to fetch vehicles: ${res.status}`);
    return [];
  }

  const body = (await res.json()) as {
    data: { items: { id: string; plate: string }[] };
  };

  return body.data.items;
}

async function createVehicle(
  plate: string,
): Promise<{ id: string; plate: string } | null> {
  const res = await fetch(`${API_URL}/vehicles`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Simulator-Key": SIMULATOR_API_KEY,
    },
    body: JSON.stringify({
      plate,
      vehicleType: "car",
      speedLimitKmh: 90,
    }),
  });

  if (!res.ok) {
    console.error(`Failed to create vehicle ${plate}: ${res.status}`);
    return null;
  }

  const body = (await res.json()) as {
    data: { id: string; plate: string };
  };

  return body.data;
}

/* ── Ensure vehicles exist ──────────────────────────────────────── */

async function ensureVehicles(): Promise<void> {
  const existing = await fetchVehicles();
  const existingPlates = new Set(existing.map((v) => v.plate));

  for (let i = 0; i < VEHICLE_COUNT; i++) {
    const plate = generatePlate(i);
    const found = existing.find((v) => v.plate === plate);

    if (found) {
      vehicles.push({
        id: found.id,
        plate: found.plate,
        lng: randomInRange(BBOX[0], BBOX[2]),
        lat: randomInRange(BBOX[1], BBOX[3]),
        heading: Math.floor(Math.random() * 360),
      });
      console.log(`  ✓ Found ${plate} → ${found.id}`);
    } else {
      const created = await createVehicle(plate);
      if (created) {
        vehicles.push({
          id: created.id,
          plate: created.plate,
          lng: randomInRange(BBOX[0], BBOX[2]),
          lat: randomInRange(BBOX[1], BBOX[3]),
          heading: Math.floor(Math.random() * 360),
        });
        console.log(`  + Created ${plate} → ${created.id}`);
      }
    }
  }

  console.log(`\nReady: ${vehicles.length} vehicles.\n`);
}

/* ── Simulation loop ────────────────────────────────────────────── */

function tick(ws: WebSocket): void {
  for (const v of vehicles) {
    const dLng = (Math.random() - 0.5) * 0.0005;
    const dLat = (Math.random() - 0.5) * 0.0005;

    v.lng = Math.max(BBOX[0], Math.min(BBOX[2], v.lng + dLng));
    v.lat = Math.max(BBOX[1], Math.min(BBOX[3], v.lat + dLat));
    v.heading =
      (Math.round((Math.atan2(dLng, dLat) * 180) / Math.PI) + 360) % 360;

    const isSpike = Math.random() < SPEED_SPIKE_CHANCE;
    const speed = isSpike
      ? randomInRange(100, 130)
      : randomInRange(30, 60);

    const message = JSON.stringify({
      event: "location_update",
      data: {
        vehicleId: v.id,
        lng: parseFloat(v.lng.toFixed(6)),
        lat: parseFloat(v.lat.toFixed(6)),
        speed: parseFloat(speed.toFixed(1)),
        heading: v.heading,
        timestamp: new Date().toISOString(),
      },
    });

    ws.send(message);
  }
}

/* ── Main ───────────────────────────────────────────────────────── */

async function main(): Promise<void> {
  console.log("GPS Simulator");
  console.log(`  vehicles : ${VEHICLE_COUNT}`);
  console.log(`  tick     : ${TICK_MS}ms`);
  console.log(`  spike %  : ${(SPEED_SPIKE_CHANCE * 100).toFixed(0)}%`);
  console.log(`  bbox     : [${BBOX.join(", ")}]`);
  console.log(`  socket   : ${SOCKET_URL}/ws/vehicles`);
  console.log("");

  await ensureVehicles();

  if (vehicles.length === 0) {
    console.error("No vehicles available. Exiting.");
    process.exit(1);
  }

  const ws = new WebSocket(`${SOCKET_URL}/ws/vehicles`, {
    headers: {
      "X-Simulator-Key": SIMULATOR_API_KEY,
      "X-Device-Id": `simulator-${process.pid}`,
    },
  });

  let interval: ReturnType<typeof setInterval> | null = null;

  ws.on("open", () => {
    console.log("WebSocket connected.\n");

    interval = setInterval(() => tick(ws), TICK_MS);
  });

  ws.on("message", (raw: Buffer) => {
    try {
      const msg = JSON.parse(raw.toString());
      if (msg.event === "error") {
        console.warn("Server error:", msg.data?.message);
      }
    } catch {
      // non-JSON message, ignore
    }
  });

  ws.on("close", (code: number, reason: Buffer) => {
    console.log(`WebSocket closed: ${code} ${reason.toString()}`);
    if (interval) clearInterval(interval);
    process.exit(0);
  });

  ws.on("error", (err: Error) => {
    console.error("WebSocket error:", err.message);
  });

  const shutdown = () => {
    console.log("\nShutting down...");
    if (interval) clearInterval(interval);
    ws.close();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
