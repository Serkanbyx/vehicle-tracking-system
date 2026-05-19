<div align="center">
  <p>
    🚛
    <strong> Vehicle Tracking System</strong>
  </p>

  <h1>Vehicle Tracking System</h1>

  <p><em>A full-stack fleet management application with live GPS tracking on MapLibre maps, WebSocket-powered real-time updates, geofence alerting, trip analytics, role-based access control, and a modern NestJS + React architecture.</em></p>

  <p>
    <img src="https://img.shields.io/badge/license-PolyForm_NC_1.0-blue?style=flat-square" alt="License" />
    <img src="https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen?style=flat-square" alt="Node.js version" />
    <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=white" alt="React 19" />
    <img src="https://img.shields.io/badge/NestJS-11-E0234E?style=flat-square&logo=nestjs&logoColor=white" alt="NestJS 11" />
    <img src="https://img.shields.io/badge/PostgreSQL-PostGIS-4169E1?style=flat-square&logo=postgresql&logoColor=white" alt="PostgreSQL + PostGIS" />
    <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript 5" />
    <img src="https://img.shields.io/badge/Tailwind-v4-38BDF8?style=flat-square&logo=tailwindcss&logoColor=white" alt="Tailwind CSS v4" />
    <img src="https://img.shields.io/badge/Web-Vercel-000000?style=flat-square&logo=vercel&logoColor=white" alt="Web on Vercel" />
    <img src="https://img.shields.io/badge/PRs-welcome-brightgreen?style=flat-square" alt="PRs welcome" />
  </p>

  <p>
    <a href="https://vehicle-tracking-system-lemon.vercel.app">Live Demo</a> •
    <a href="#features">Features</a> •
    <a href="#installation">Quick Start</a> •
    <a href="#api-endpoints">API Docs</a> •
    <a href="#screenshots">Screenshots</a>
  </p>

  <a href="https://vehicle-tracking-system-lemon.vercel.app">
    <img src="./assets/screenshots/dashboard.png" alt="Vehicle Tracking System — Dashboard" />
  </a>
</div>

---

## Features

- **Live GPS Tracking** — Real-time vehicle positions on interactive MapLibre maps with smooth marker animation and moving / idle / offline status indicators
- **WebSocket Architecture** — Dual WebSocket channels: one for device/simulator GPS ingest, one for authenticated dashboard live feed with per-vehicle subscriptions
- **Geofence Management** — Create polygon and circle geofences with enter/exit detection, containment tests, and instant alerting when vehicles cross boundaries
- **Smart Alerting** — Speed violation and idle detection with configurable thresholds, severity levels, bulk acknowledgement workflows, and real-time alert push to dashboards
- **Trip Analytics** — Automatic trip aggregation from GPS telemetry with distance, average/max speed, violation counts, daily summaries, and CSV export
- **Role-Based Access Control** — Three-tier RBAC (viewer → manager → admin) with JWT access tokens, HTTP-only refresh cookies, and fine-grained route guards
- **Admin Console** — Full user lifecycle management, role assignment, fleet overview, platform statistics, and account activation/deactivation
- **Vehicle Fleet CRUD** — Complete vehicle management with driver profiles, photo uploads via Cloudinary, custom speed limits, tags, and bulk activation
- **Data Exports** — Export vehicle routes as CSV or GeoJSON and trip histories as CSV for offline analysis and reporting
- **Heatmap Visualization** — Location density heatmaps per vehicle within configurable time ranges
- **History Playback** — Replay vehicle movement history with an interactive timeline player
- **User Settings** — Profile management, appearance preferences (dark mode), notification configuration, and account settings
- **Observability** — Sentry error tracking, Better Stack / Logtail structured logging with PII redaction, and health endpoint monitoring
- **GPS Simulator** — Built-in configurable simulator for development and demo with adjustable fleet size, tick rate, speed spike probability, and bounding box

---

## Live Demo

[🚀 View Live Demo](https://vehicle-tracking-system-lemon.vercel.app)

> Register a new account or use the seeded admin credentials to explore the full dashboard, vehicle management, geofence editor, alerts, trips, reports, and admin panel.

---

## Screenshots

All screenshots are captured from the [live deployment](https://vehicle-tracking-system-lemon.vercel.app) running against the seeded demo dataset.

<table>
  <tr>
    <td align="center" width="33%">
      <a href="./assets/screenshots/dashboard.png"><img src="./assets/screenshots/dashboard.png" alt="Dashboard" /></a>
      <sub><b>Dashboard</b><br/>Live map, stats & recent alerts</sub>
    </td>
    <td align="center" width="33%">
      <a href="./assets/screenshots/vehicles.png"><img src="./assets/screenshots/vehicles.png" alt="Vehicles" /></a>
      <sub><b>Vehicles</b><br/>Fleet list with filters & status</sub>
    </td>
    <td align="center" width="33%">
      <a href="./assets/screenshots/geofences.png"><img src="./assets/screenshots/geofences.png" alt="Geofences" /></a>
      <sub><b>Geofences</b><br/>Polygon & circle zone editor on map</sub>
    </td>
  </tr>
  <tr>
    <td align="center" width="33%">
      <a href="./assets/screenshots/alerts.png"><img src="./assets/screenshots/alerts.png" alt="Alerts" /></a>
      <sub><b>Alerts</b><br/>Filterable list with bulk acknowledge</sub>
    </td>
    <td align="center" width="33%">
      <a href="./assets/screenshots/reports.png"><img src="./assets/screenshots/reports.png" alt="Reports" /></a>
      <sub><b>Reports</b><br/>Trip table, daily summary & heatmap</sub>
    </td>
    <td align="center" width="33%">
      <a href="./assets/screenshots/settings.png"><img src="./assets/screenshots/settings.png" alt="Settings" /></a>
      <sub><b>Settings</b><br/>Profile, appearance & notifications</sub>
    </td>
  </tr>
</table>

> Additional views — vehicle detail, admin dashboard, and admin user management — are accessible by logging in with a manager or admin account after seeding vehicles via the GPS simulator.

---

## Architecture

A high-level visual map of the system. Both diagrams render natively on GitHub thanks to Mermaid support.

### Domain Model

How the core entities relate to each other and how real-time delivery fans out.

```mermaid
graph LR
  User(("User"))
  Vehicle(["Vehicle"])
  Location(["Location"])
  Geofence(["Geofence"])
  Alert(["Alert"])
  Trip(["Trip"])

  User -- "creates" --> Vehicle
  Vehicle -- "records" --> Location
  Vehicle -- "generates" --> Trip
  Vehicle -- "triggers" --> Alert
  Alert -- "references" --> Geofence
  Geofence -- "monitors" --> Vehicle
  User -- "acknowledges" --> Alert
  User -- "manages" --> Geofence
```

### Request Lifecycle

How a single browser action or GPS update travels through the stack.

```mermaid
flowchart LR
  Browser["React 19 SPA<br/>(Vite + TanStack)"]
  API["NestJS 11 API<br/>(REST + JWT)"]
  WS_Dash["ws /ws/dashboard<br/>(JWT subprotocol)"]
  WS_Ingest["ws /ws/vehicles<br/>(Simulator Key)"]
  Ingest["LocationIngestionService"]
  Engine["AlertEngine"]
  Aggregator["TripAggregator"]
  DB[("PostgreSQL<br/>+ PostGIS")]
  CDN[("Cloudinary<br/>images")]
  GPS["GPS Device<br/>/ Simulator"]

  Browser -- "Axios + JWT (Bearer)" --> API
  Browser <-. "WebSocket (JWT)" .-> WS_Dash
  GPS -- "location_update" --> WS_Ingest
  WS_Ingest --> Ingest
  Ingest --> DB
  Ingest --> Engine
  Ingest --> Aggregator
  Engine -. "alert:new" .-> WS_Dash
  Aggregator --> DB
  API --> DB
  API -- "stream upload" --> CDN
  WS_Dash -. "vehicle:update" .-> Browser
```

---

## Technologies

### Frontend

- **React 19** — Modern UI library with hooks, context, and concurrent features
- **TanStack Router** — Type-safe file-based routing with code splitting
- **TanStack Query** — Server state management with caching and background refetch
- **TanStack Form** — Headless, type-safe form library with validation
- **Vite 7** — Lightning-fast build tool and HMR dev server
- **Tailwind CSS v4** — Utility-first CSS framework for rapid styling
- **MapLibre GL** — Open-source interactive map library for live GPS visualization
- **Zustand** — Lightweight state management for live vehicle store
- **Radix UI** — Accessible, unstyled UI primitives (dialog, dropdown, tabs, switch, slider, tooltip)
- **Lucide React** — Consistent icon library
- **Sonner** — Toast notification system
- **date-fns** — Modern date utility library

### Backend

- **NestJS 11** — Progressive Node.js framework with modular architecture
- **TypeORM** — ORM with decorators, migrations, and query builder
- **PostgreSQL 16 + PostGIS** — Relational database with spatial/geospatial query support
- **Passport JWT** — Stateless authentication with access + refresh token strategy
- **ws** — WebSocket server for real-time GPS ingest and dashboard live feed
- **Cloudinary** — Cloud-based image upload and transformation (driver/vehicle/avatar photos)
- **Helmet** — HTTP security headers middleware
- **nestjs-pino + Pino** — Structured JSON logging with PII redaction
- **@nestjs/throttler** — Rate limiting for API and WebSocket endpoints
- **class-validator + class-transformer** — DTO validation and transformation
- **@nestjs/schedule** — Cron-based tasks (status sweep for stale trackers)
- **@sentry/nestjs** — Error tracking and performance monitoring
- **Multer** — Multipart file upload handling
- **bcrypt** — Secure password hashing

### Quality & Tooling

- **TypeScript 5** — Static type checking across the full stack
- **Vitest** — Fast unit and integration testing
- **Biome** — Fast linter and formatter (replaces ESLint + Prettier)
- **GitHub Actions CI** — Automated lint and test pipeline

---

## Installation

### Prerequisites

- **Node.js** v20+ and **npm**
- **PostgreSQL** 16+ with **PostGIS** extension — [Supabase](https://supabase.com/) (free tier) or local Docker (`postgis/postgis:16-3.4`)
- **Cloudinary** account — required for production image uploads; optional for local development

### Local Development

**1. Clone the repository:**

```bash
git clone https://github.com/Serkanbyx/s5.2_Vehicle-Tracking-System.git
cd s5.2_Vehicle-Tracking-System
```

**2. Set up environment variables:**

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

**server/.env**

```env
NODE_ENV=development
PORT=5000
LOG_LEVEL=info

DATABASE_URL=postgres://user:pass@localhost:5432/vehicle_tracking?sslmode=require

JWT_ACCESS_SECRET=change-me-min-32-chars-in-production!!
JWT_ACCESS_TTL=15m
JWT_REFRESH_SECRET=change-me-different-from-access-secret!
JWT_REFRESH_TTL=7d

CLIENT_URL=http://localhost:3000

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

SIMULATOR_API_KEY=change-me-min-32-chars-simulator-key!!

SPEED_LIMIT_KMH=90
IDLE_THRESHOLD_MIN=10
TRIP_END_MIN=5

ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=change-me
ADMIN_NAME=Admin
```

**client/.env**

```env
VITE_API_URL=http://localhost:5000/api
VITE_WS_URL=ws://localhost:5000
VITE_MAP_STYLE_URL=https://tiles.openfreemap.org/styles/liberty
```

**3. Install dependencies:**

```bash
cd server && npm install
cd ../client && npm install
```

**4. Initialize the database:**

```bash
cd server
npm run mig:run        # run TypeORM migrations
npm run seed:admin     # seed initial admin from ADMIN_* env vars
```

**5. Run the application:**

```bash
# Terminal 1 — Backend
cd server && npm run dev

# Terminal 2 — Frontend
cd client && npm run dev

# Terminal 3 — GPS Simulator (optional)
cd server && npm run simulate
```

The SPA runs on `http://localhost:3000` with Vite proxy forwarding `/api` and `/ws` to the backend at `http://localhost:5000`.

---

## Usage

1. **Register** — Create a new account at `/register` (default role: viewer)
2. **Login** — Authenticate at `/login` to receive JWT tokens
3. **Dashboard** — View live vehicle positions on the map, fleet stats, recent alerts, and top violators
4. **Vehicles** — Browse, filter, create, edit, and delete vehicles (manager+ role required for writes)
5. **Vehicle Detail** — Inspect individual vehicle stats, trips, alerts, history playback, speed gauge, and heatmap
6. **Geofences** — Draw polygon/circle zones on the map, configure enter/exit monitoring per vehicle
7. **Alerts** — Monitor speed, idle, and geofence alerts in real-time; acknowledge individually or in bulk
8. **Reports** — View trip tables, daily summaries with charts, and heatmap visualizations; export as CSV
9. **Admin** — Manage users (roles, activation), view fleet overview and platform statistics
10. **Settings** — Update profile, change password, toggle dark mode, configure notification preferences

---

## How It Works

### Authentication Flow

The system uses a dual-token strategy for stateless authentication:

1. **Login** — The server validates credentials and returns a short-lived JWT access token in the response body, plus a long-lived refresh token as an HTTP-only secure cookie
2. **Authenticated requests** — The client sends the access token via `Authorization: Bearer <token>` header, intercepted by Axios request interceptor
3. **Token refresh** — When the access token expires (401), the Axios response interceptor automatically calls `POST /api/auth/refresh` using the cookie-based refresh token to obtain a new access pair
4. **WebSocket auth** — Dashboard WebSocket connections send the JWT as a `Sec-WebSocket-Protocol` subprotocol; the gateway validates it on upgrade

### Real-Time Data Flow

```
GPS Device / Simulator
  │
  ├─► ws /ws/vehicles (X-Simulator-Key auth)
  │     └─► LocationIngestionService
  │           ├─► INSERT into PostGIS locations table
  │           ├─► UPDATE vehicle.lastLocation (JSONB snapshot)
  │           ├─► AlertEngine.evaluate()
  │           │     ├─► Speed check → emit alert:new
  │           │     └─► Geofence containment → emit alert:new
  │           └─► TripAggregator.process()
  │                 ├─► Open / extend / close trips
  │                 └─► Accumulate distance, speed stats
  │
  └─► RoomManager broadcasts to:
        ├─► vehicle:<id> room → subscribed dashboards
        └─► role:<role> rooms → all authenticated users
```

### Status Sweep

A scheduled cron job (`StatusSweeperService`) runs periodically to detect stale vehicle trackers. If a vehicle's last update exceeds the configured threshold, it is marked `offline` and a `vehicle:status` event is broadcast to connected dashboards.

---

## API Endpoints

### Auth

| Method | Endpoint | Auth | Description |
| ------ | -------- | ---- | ----------- |
| POST | `/api/auth/register` | Public | Register a new user |
| POST | `/api/auth/login` | Public | Login (sets refresh cookie) |
| POST | `/api/auth/refresh` | Refresh cookie | Rotate token pair |
| GET | `/api/auth/me` | JWT | Get current user profile |
| PATCH | `/api/auth/me` | JWT | Update profile |
| POST | `/api/auth/change-password` | JWT | Change password (clears refresh cookie) |
| POST | `/api/auth/logout` | JWT | Logout |
| DELETE | `/api/auth/me` | JWT | Delete own account |

### Vehicles

| Method | Endpoint | Roles | Description |
| ------ | -------- | ----- | ----------- |
| POST | `/api/vehicles` | manager, admin | Create vehicle |
| GET | `/api/vehicles` | JWT | List / query vehicles |
| GET | `/api/vehicles/nearby` | JWT | Nearby vehicles by coordinates |
| GET | `/api/vehicles/:id` | JWT | Vehicle detail |
| PATCH | `/api/vehicles/:id` | manager, admin | Update vehicle |
| DELETE | `/api/vehicles/:id` | manager, admin | Delete vehicle |
| GET | `/api/vehicles/:id/heatmap` | JWT | Heatmap points (time range) |
| GET | `/api/vehicles/:id/export` | JWT | Export route — CSV or GeoJSON |
| POST | `/api/vehicles/bulk-activate` | admin | Bulk activate vehicles |

### Locations

| Method | Endpoint | Auth | Description |
| ------ | -------- | ---- | ----------- |
| GET | `/api/vehicles/:vehicleId/history` | JWT | Location history |
| GET | `/api/vehicles/:vehicleId/locations/latest` | JWT | Latest N points |
| GET | `/api/vehicles/:vehicleId/stats` | JWT | Aggregated stats |
| POST | `/api/vehicles/:vehicleId/locations` | Simulator Key | HTTP ingest fallback |

### Geofences

| Method | Endpoint | Roles | Description |
| ------ | -------- | ----- | ----------- |
| POST | `/api/geofences` | manager, admin | Create geofence |
| GET | `/api/geofences` | JWT | List geofences |
| GET | `/api/geofences/:id` | JWT | Geofence detail |
| PATCH | `/api/geofences/:id` | manager, admin | Update geofence |
| DELETE | `/api/geofences/:id` | manager, admin | Delete geofence |
| POST | `/api/geofences/:id/test` | JWT | Test point inside / outside |

### Alerts

| Method | Endpoint | Roles | Description |
| ------ | -------- | ----- | ----------- |
| GET | `/api/alerts` | JWT | List / filter alerts |
| GET | `/api/alerts/stats` | JWT | Alert statistics |
| POST | `/api/alerts/:id/ack` | manager, admin | Acknowledge alert |
| POST | `/api/alerts/ack-many` | manager, admin | Bulk acknowledge |
| DELETE | `/api/alerts/:id` | admin | Delete alert |

### Trips

| Method | Endpoint | Auth | Description |
| ------ | -------- | ---- | ----------- |
| GET | `/api/trips` | JWT | List / filter trips |
| GET | `/api/trips/summary` | JWT | Daily summary |
| GET | `/api/trips/export` | JWT | CSV export |
| GET | `/api/trips/:id` | JWT | Trip detail |

### Uploads

| Method | Endpoint | Roles | Description |
| ------ | -------- | ----- | ----------- |
| POST | `/api/uploads/driver` | manager, admin | Upload driver image |
| POST | `/api/uploads/vehicle` | manager, admin | Upload vehicle image |
| POST | `/api/uploads/avatar` | JWT | Upload user avatar |
| DELETE | `/api/uploads/:publicId` | manager, admin | Delete Cloudinary asset |

### Admin

| Method | Endpoint | Roles | Description |
| ------ | -------- | ----- | ----------- |
| GET | `/api/admin/stats` | admin | Dashboard statistics |
| GET | `/api/admin/users` | admin | User list |
| GET | `/api/admin/users/:id` | admin | User detail |
| PATCH | `/api/admin/users/:id/role` | admin | Set user role |
| PATCH | `/api/admin/users/:id/status` | admin | Activate / deactivate user |
| DELETE | `/api/admin/users/:id` | admin | Remove user |
| GET | `/api/admin/fleet` | admin | Fleet overview |

### Health

| Method | Endpoint | Auth | Description |
| ------ | -------- | ---- | ----------- |
| GET | `/api/health` | Public | Liveness / uptime check |

> All authenticated endpoints require `Authorization: Bearer <token>` header. Simulator endpoints require `X-Simulator-Key` header.

---

## WebSocket Protocol

Base URL is the same origin as the HTTP API host (e.g. `ws://localhost:5000`). Messages are JSON text frames.

### `/ws/vehicles` — Device / Simulator Ingest

**Authentication:** `X-Simulator-Key` header (timing-safe compare against server `SIMULATOR_API_KEY`).

| Direction | Event | Payload |
| --------- | ----- | ------- |
| Inbound | `location_update` | `vehicleId` (UUID), `lng`, `lat`, `speed`, optional `heading`, `altitude`, `accuracy`, `timestamp` (ISO 8601) |
| Outbound | `error` | `{ "message": string }` |

Rate limit: **5** updates per socket per second.

### `/ws/dashboard` — SPA Live Feed

**Authentication:** JWT access token via `Sec-WebSocket-Protocol` subprotocol.

| Direction | Type | Payload | Notes |
| --------- | ---- | ------- | ----- |
| Inbound | `subscribe` | `{ "vehicleId": "<uuid>" }` | Join vehicle room |
| Inbound | `unsubscribe` | `{ "vehicleId": "<uuid>" }` | Leave vehicle room |
| Outbound | `vehicle:update` | `vehicleId`, `plate`, `coordinates`, `speed`, `heading`, `timestamp`, `status` | After ingest to vehicle + role rooms |
| Outbound | `vehicle:status` | `vehicleId`, `status` | When sweep marks tracker offline |
| Outbound | `alert:new` | Full alert entity snapshot | Speed, idle, geofence enter/exit |

---

## Roles & Permissions

| Role | Capabilities |
| ---- | ------------ |
| **viewer** | Read vehicles, locations/history/stats/heatmap, geofences, trips, alerts; route export. Cannot create/update/delete vehicles or geofences, cannot acknowledge alerts. |
| **manager** | Viewer capabilities plus create/update/delete vehicles & geofences, acknowledge alerts, driver & vehicle image uploads, delete uploaded assets. |
| **admin** | Manager capabilities plus admin APIs (`/admin/*`), bulk vehicle activate, delete alerts, full user lifecycle management. |

---

## Project Structure

A clean monorepo layout with an explicit backend / frontend split. Each panel below is collapsible — expand the one you care about.

<details open>
<summary><b>Server</b> — NestJS 11 API</summary>

```
server/
├── src/
│   ├── common/
│   │   ├── controllers/     # health, welcome
│   │   ├── enums/           # user-role, vehicle-type, alert, geofence, trip
│   │   ├── filters/         # global exception filter
│   │   ├── guards/          # jwt-auth, roles, simulator-key
│   │   └── utils/           # coords, geo helpers + tests
│   ├── modules/
│   │   ├── admin/           # admin controller, service, DTOs
│   │   ├── alerts/          # alerts CRUD, alert-engine, entity, tests
│   │   ├── auth/            # auth controller, service, strategies (jwt, refresh, local), DTOs, tests
│   │   ├── geofences/       # geofences CRUD, entity, DTOs
│   │   ├── locations/       # locations controller, service, entity, DTOs
│   │   ├── realtime/        # WebSocket gateways (vehicles, dashboard), room manager, location ingestion, status sweeper, heartbeat
│   │   ├── trips/           # trips CRUD, trip aggregator, entity, DTOs
│   │   ├── uploads/         # Cloudinary upload controller, service
│   │   ├── users/           # user entity, module, DTOs
│   │   └── vehicles/        # vehicles CRUD, entity, DTOs
│   ├── migrations/          # 7 TypeORM migrations (extensions → user → vehicle → location → geofence → alert → trip)
│   ├── scripts/             # seed-admin, seed-test, gps-simulator
│   ├── app.module.ts        # root module composition
│   ├── data-source.ts       # TypeORM data source config
│   └── main.ts              # bootstrap + graceful shutdown
├── test/
│   └── e2e/                 # Vitest + Supertest API tests (auth, vehicles, geofences, alerts, rbac)
├── .env.example
└── package.json
```

</details>

<details>
<summary><b>Client</b> — React 19 + Vite SPA</summary>

```
client/
├── src/
│   ├── api/                 # Axios client, endpoint wrappers (auth, vehicles, locations, geofences, alerts, trips, uploads, admin, ws)
│   ├── components/
│   │   ├── alerts/          # AlertsTable, AlertsFilterBar, AlertsStats, BulkActionBar
│   │   ├── common/          # Spinner, StatsRow, TopViolators, RecentAlerts
│   │   ├── guards/          # route guards (requireAuth, requireRole)
│   │   ├── layout/          # Navbar, Footer, AdminLayout, SettingsLayout
│   │   ├── map/             # LiveMap, VehicleMarker, GeofenceMap, GeofenceList, GeofenceDrawerForm, RouteLine
│   │   ├── reports/         # TripTable, TripMapModal, ReportFilters, DailySummaryChart, HeatmapPanel
│   │   ├── ui/              # Radix-based primitives (button, card, dialog, input, select, badge, tabs, tooltip, sheet…)
│   │   └── vehicles/        # VehicleCard, VehicleForm, VehicleFilters, StatusCard, StatsPanel, HistoryPlayer, ExportButtons, PhotoUpload…
│   ├── context/             # AuthContext, PreferencesContext
│   ├── hooks/               # useDebounce, useSmoothPosition, useWsConnection
│   ├── lib/                 # cn utility (clsx + tailwind-merge)
│   ├── routes/              # TanStack file routes (index, login, register, vehicles/*, geofences, alerts, reports, settings/*, admin/*, profile)
│   ├── stores/              # Zustand live-vehicles store
│   ├── styles/              # globals.css (Tailwind)
│   ├── utils/               # constants, notify, escape-html, generate-circle
│   ├── env.ts               # typed env access
│   ├── instrumentation.ts   # Sentry init
│   ├── main.tsx             # entry point
│   └── router.tsx           # TanStack Router instance
├── vercel.json              # SPA rewrite rules
├── .env.example
└── package.json
```

</details>

<details>
<summary><b>Repository root</b> — docs, governance & CI</summary>

```
s5.2_Vehicle-Tracking-System/
├── client/                  # → see Client panel above
├── server/                  # → see Server panel above
├── docs/
│   └── build-guide.md       # build curriculum / checklist
├── assets/
│   └── screenshots/         # README screenshot assets
├── .github/
│   ├── workflows/ci.yml     # lint → test pipeline
│   ├── ISSUE_TEMPLATE/      # bug report, feature request, config
│   ├── PULL_REQUEST_TEMPLATE.md
│   ├── CONTRIBUTING.md
│   ├── SECURITY.md
│   └── CODE_OF_CONDUCT.md
├── LICENSE                  # PolyForm Noncommercial 1.0.0
└── README.md
```

</details>

---

## Security

- **Helmet** — Sets strict HTTP security headers (CSP, HSTS, X-Frame-Options, etc.)
- **CORS Whitelist** — Only the configured `CLIENT_URL` origin is allowed
- **Rate Limiting** — `@nestjs/throttler` protects API and WebSocket endpoints from abuse
- **JWT Dual Tokens** — Short-lived access tokens (15min default) + long-lived refresh tokens stored as HTTP-only secure cookies
- **Password Hashing** — bcrypt with automatic salt rounds for secure credential storage
- **Input Validation** — All incoming data validated via `class-validator` DTOs before reaching business logic
- **RBAC Guards** — Role-based access control enforced at the route level with NestJS guards
- **Simulator Key Auth** — GPS ingest endpoints require a dedicated `X-Simulator-Key` with timing-safe comparison
- **Log Redaction** — Pino redacts `Authorization` headers, cookies, passwords, and refresh tokens from structured logs
- **Origin Validation** — WebSocket connections validate `Origin` header against `CLIENT_URL`
- **Secure Cookies** — Refresh tokens use `HttpOnly`, `Secure`, and `SameSite` cookie flags in production

---

## Deployment

### Frontend (Vercel)

**1. Connect repository** to [Vercel](https://vercel.com/) and set the root directory to `client`.

**2. Configure build settings:**

| Setting | Value |
| ------- | ----- |
| Framework Preset | Vite |
| Build Command | `npm run build` |
| Output Directory | `dist` |

**3. Set environment variables:**

| Variable | Value |
| -------- | ----- |
| `VITE_API_URL` | `https://your-api-domain.com/api` |
| `VITE_WS_URL` | `wss://your-api-domain.com` |
| `VITE_MAP_STYLE_URL` | `https://tiles.openfreemap.org/styles/liberty` |
| `VITE_SENTRY_DSN` | Your Sentry DSN (optional) |

> The `vercel.json` file already handles SPA rewrites for client-side routing.

### Backend (Render / Railway)

**1. Create a new Web Service** pointing to the `server` directory.

**2. Configure build and start commands:**

| Setting | Value |
| ------- | ----- |
| Build Command | `npm ci && npm run build && npm run mig:run:prod` |
| Start Command | `npm start` |
| Node Version | 20 |

**3. Set environment variables:**

| Variable | Value |
| -------- | ----- |
| `NODE_ENV` | `production` |
| `PORT` | `5000` |
| `DATABASE_URL` | Your PostgreSQL + PostGIS connection string |
| `JWT_ACCESS_SECRET` | Strong random string (≥32 chars) |
| `JWT_REFRESH_SECRET` | Different strong random string (≥32 chars) |
| `CLIENT_URL` | `https://your-frontend-domain.vercel.app` |
| `CLOUDINARY_CLOUD_NAME` | Your Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Your Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Your Cloudinary API secret |
| `SIMULATOR_API_KEY` | Strong random string (≥32 chars) |
| `LOG_LEVEL` | `info` |

> **Database:** Use a PostgreSQL provider with PostGIS support (e.g., Supabase, Neon, or Railway's built-in Postgres). Run `npm run seed:admin:prod` once after first deployment to create the initial admin user.

---

## GPS Simulator

The built-in simulator at `server/src/scripts/gps-simulator.ts` generates synthetic GPS telemetry for development and demos:

```bash
cd server && npm run simulate
```

| Flag / Env | Purpose | Default |
| ---------- | ------- | ------- |
| `SIMULATOR_API_KEY` | Auth key (must match server) | — |
| `SOCKET_URL` | WebSocket base URL | `ws://localhost:5000` |
| `API_URL` | REST base for setup calls | `http://localhost:5000/api` |
| `--vehicles=N` | Fleet size | `5` |
| `--tick=ms` | Interval between GPS ticks | `2000` |
| `--speedSpikeChance=0.08` | Probability of overspeed sample | `0.08` |
| `--bbox=minLng,minLat,maxLng,maxLat` | Bounding box for routes | Istanbul demo bounds |

---

## Features in Detail

### Completed Features

- ✅ Live GPS tracking with MapLibre maps and smooth marker animation
- ✅ Dual WebSocket architecture (device ingest + dashboard feed)
- ✅ Polygon and circle geofence management with real-time enter/exit detection
- ✅ Speed violation, idle detection, and geofence alerting with severity levels
- ✅ Trip auto-aggregation with distance, speed stats, and violation counts
- ✅ JWT access + HTTP-only refresh cookie authentication
- ✅ Three-tier RBAC (viewer / manager / admin)
- ✅ Admin console with user management and fleet overview
- ✅ Vehicle CRUD with driver profiles and Cloudinary photo uploads
- ✅ Route and trip CSV/GeoJSON exports
- ✅ Heatmap visualization per vehicle
- ✅ History playback with timeline player
- ✅ Dark mode and user preference persistence
- ✅ Sentry error tracking and structured logging with PII redaction
- ✅ GitHub Actions CI pipeline (lint → test)
- ✅ Configurable GPS simulator for development

### Future Features

- [ ] 🔮 TimescaleDB hypertables for high-volume location history
- [ ] 🔮 Push notifications (Firebase Cloud Messaging)
- [ ] 🔮 Driver mobile app with real GPS reporting
- [ ] 🔮 Fleet analytics dashboard with historical trends
- [ ] 🔮 Multi-tenant organization support
- [ ] 🔮 Webhook integrations for third-party alerting

---

## Contributing

Contributions are welcome! Please read our [Contributing Guide](.github/CONTRIBUTING.md) for details.

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** your changes: `git commit -m "feat: add amazing feature"`
4. **Push** to the branch: `git push origin feature/amazing-feature`
5. **Open** a Pull Request

### Commit Message Format

| Prefix | Description |
| ----------- | ----------------------------------- |
| `feat:` | New feature |
| `fix:` | Bug fix |
| `refactor:` | Code refactoring |
| `docs:` | Documentation changes |
| `chore:` | Maintenance and dependency updates |
| `test:` | Adding or updating tests |

---

## License

[PolyForm Noncommercial 1.0.0](LICENSE) © 2026 Serkan Bayraktar

---

## Developer

**Serkan Bayraktar**

- 🌐 Website: [serkanbayraktar.com](https://serkanbayraktar.com/)
- 🐙 GitHub: [@Serkanbyx](https://github.com/Serkanbyx)
- 📧 Email: [serkanbyx1@gmail.com](mailto:serkanbyx1@gmail.com)

---

## Acknowledgments

- [NestJS](https://nestjs.com/) — Progressive Node.js framework
- [React](https://react.dev/) — UI library
- [TanStack](https://tanstack.com/) — Router, Query, and Form libraries
- [MapLibre GL JS](https://maplibre.org/) — Open-source map rendering
- [PostGIS](https://postgis.net/) — Spatial database extension for PostgreSQL
- [Tailwind CSS](https://tailwindcss.com/) — Utility-first CSS framework
- [Radix UI](https://www.radix-ui.com/) — Accessible UI primitives
- [OpenFreeMap](https://openfreemap.org/) — Free map tile service
- [Cloudinary](https://cloudinary.com/) — Media management platform
- [Biome](https://biomejs.dev/) — Fast linter and formatter

---

## Contact

- 🐛 [Open an Issue](https://github.com/Serkanbyx/s5.2_Vehicle-Tracking-System/issues)
- 📧 Email: [serkanbyx1@gmail.com](mailto:serkanbyx1@gmail.com)
- 🌐 Website: [serkanbayraktar.com](https://serkanbayraktar.com/)

---

⭐ If you like this project, don't forget to give it a star!
