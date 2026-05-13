# Vehicle Tracking System — Step-by-Step Build Guide

> **Project Summary:**
> Vehicle Tracking System is a production-grade, end-to-end type-safe fleet monitoring platform. The backend is a **NestJS 10 + TypeScript** API backed by **PostgreSQL + PostGIS** (with `Location` table designed to be promoted to a TimescaleDB hypertable when fleet scale demands it). Real-time ingestion uses **native WebSocket** (`@nestjs/platform-ws`) with a custom room manager, split into two paths — `/ws/vehicles` for GPS devices and the built-in simulator, `/ws/dashboard` for the web client. The frontend is a **TanStack Start** SPA with **TanStack Router**, **TanStack Query**, **Zustand** (live socket state), **TanStack Form**, **MapLibre GL JS** (vector tiles, WebGL smooth marker animation), and **TailwindCSS v4** styled with shadcn/ui patterns. Three roles — **Admin**, **Fleet Manager**, **Viewer** — are guarded server-side by NestJS Passport strategies (JWT access + httpOnly refresh token rotation) and client-side by route guards. Observability via **Sentry** (errors) and **Better Stack** (Pino logs); lint/format via **Biome**; testing via **Vitest + Supertest + Playwright**. Deployed on **Railway** (backend) + **Vercel** (frontend) + **Supabase** (Postgres + PostGIS).

> Each step below is a self-contained prompt. Execute them in order. Each step is sized to fit one focused prompt session — small enough to be reviewable, large enough to ship a coherent unit of work.

> Stack: NestJS 10, TypeScript 5, PostgreSQL 16 + PostGIS 3, TypeORM 0.3, native ws 8, `@nestjs/passport` + `@nestjs/jwt`, Cloudinary; TanStack Start (Vite 7 + React 19), TanStack Router/Query/Form, Zustand, MapLibre GL JS 4, Tailwind v4, Biome 1.9+, Vitest 2, Playwright 1.

---

## Table of Contents

**PHASE 1 — Backend Foundation** (Steps 1–6)
1. Root Project Scaffolding, .gitignore & Biome Shared Config
2. NestJS Initialization & Server Folder Structure
3. ConfigModule, Env Validation & .env.example
4. Global Pipeline (Helmet, CORS, ValidationPipe, Compression, Cookie Parser)
5. ThrottlerModule, AllExceptionsFilter & TransformInterceptor
6. NPM Scripts, Logging & Health Endpoint

**PHASE 2 — Database Setup** (Steps 7–10)
7. PostgreSQL Connection, TypeORM Config & data-source.ts
8. Migration CLI Wiring & First Migration (PostGIS + pgcrypto)
9. Custom Geometry Transformer (Point ↔ {lng, lat})
10. PostGIS Repository Helpers (nearby, ST_Contains, ST_DWithin)

**PHASE 3 — Authentication & Authorization** (Steps 11–16)
11. User Entity, Roles Enum & Preferences JSONB Schema
12. Passport Strategies (Local + JWT + JWT-Refresh)
13. JwtModule Configuration & Token Issuance Service
14. Refresh Token Rotation with Reuse Detection
15. Auth Controller (Register / Login / Refresh / Logout / Me / Change Password / Delete Account)
16. Guards, Decorators & Admin Seed Script

**PHASE 4 — Vehicles Module** (Steps 17–19)
17. Vehicle Entity, Migrations, Indexes & Search Configuration
18. Vehicle DTOs & Validation Rules
19. Vehicle Service & Controller (CRUD + Search + Nearby + Bulk Activate)

**PHASE 5 — Locations & Uploads** (Steps 20–23)
20. Location Entity (Hypertable-Ready PK) & Indexes
21. Location Service (History, Latest, Stats with PostGIS Aggregation)
22. Location Controller & HTTP Fallback Ingestion
23. Cloudinary Provider, Multer Config & Upload Controller

**PHASE 6 — Real-Time WebSocket Layer** (Steps 24–28)
24. WebSocket Adapter Bootstrap & RoomManager Service
25. Heartbeat & Dead-Socket Cleanup Helper
26. VehiclesGateway (Simulator Key Auth + Rate Limit)
27. DashboardGateway (JWT Auth + Subscribe / Unsubscribe + Role Rooms)
28. Location Ingestion Pipeline (Persist → Update lastLocation → Status → Broadcast)

**PHASE 7 — Geofences** (Steps 29–30)
29. Geofence Entity, Migrations, Geo Indexes & DTOs
30. Geofence Service, Controller, Test Endpoint & PostGIS Containing Query

**PHASE 8 — Alerts & Trips** (Steps 31–34)
31. Alert Entity, Controller, DTOs & Acknowledge Endpoints
32. AlertEngine Service (Speed / Idle / Geofence Detection + Debounce)
33. Status Sweeper Cron Job (Offline Transition + Idle Trigger)
34. Trip Entity, Controller & TripAggregator Service

**PHASE 9 — Exports, Heatmap & Simulator** (Steps 35–37)
35. ExportService (CSV / GeoJSON / Formula Injection Guard) & Export Endpoints
36. Heatmap Endpoint with Server-Side Downsampling
37. GPS Simulator Script (Multi-Vehicle, Bbox, Speed Spikes)

**PHASE 10 — Admin & Security Audit** (Steps 38–40)
38. Admin Module: Dashboard Stats Endpoint
39. Admin Module: User Management & Fleet Overview
40. Backend Security Audit & Final Hardening Checklist

**PHASE 11 — Frontend Foundation: Tooling** (Steps 41–45)
41. TanStack Start Initialization, Vite Config & Client Folder Structure
42. Biome Client Configuration & NPM Scripts
43. Tailwind v4 globals.css + Theme Tokens + Density / Font / Animation Classes
44. shadcn-Style UI Primitives Set A (Button, Card, Input, Label, Textarea, Select, Badge)
45. shadcn-Style UI Primitives Set B (Dialog, AlertDialog, Sheet, DropdownMenu, Tabs, Tooltip, Switch, Skeleton, Slider, Avatar)

**PHASE 12 — Frontend Foundation: API & State** (Steps 46–50)
46. Typed Env Reader & Fetch Wrapper with Single-Flight Refresh
47. Service Files (auth, vehicles, locations, geofences, alerts, trips, uploads, admin)
48. WebSocket Client with Auto-Reconnect & Sec-WebSocket-Protocol JWT
49. Zustand Live Vehicles Store & useLiveVehicle Selector Hook
50. Auth Context (Refresh on Mount) & Preferences Context (Theme / Font / Density / Animations)

**PHASE 13 — Layouts & Routing** (Steps 51–54)
51. Root Layout (`__root.tsx`) & TanStack Router Context Injection
52. MainLayout, Navbar, Footer & Live Connection Indicator
53. AdminLayout & SettingsLayout (Responsive Mobile Drawers)
54. Route Guards via beforeLoad (Authenticated / Guest / Manager / Admin)

**PHASE 14 — Auth Pages** (Steps 55–56)
55. Login Page (TanStack Form + Redirect Param + Generic Error)
56. Register Page (TanStack Form + Match Validator + Auto-Login)

**PHASE 15 — Live Dashboard** (Steps 57–59)
57. LiveMap Component (MapLibre Setup + Style URL + Initial Center)
58. VehicleMarker, useSmoothPosition Hook & Popup
59. Dashboard Stats Cards & Recent Alerts Widget

**PHASE 16 — Vehicle Pages** (Steps 60–64)
60. Vehicle List Page (Filters, Validated Search Params, Pagination, VehicleCard)
61. Vehicle Detail: Live Tab + Recent Vehicle Alerts
62. Vehicle Detail: History Tab + HistoryPlayer + Route Polyline
63. Vehicle Detail: Trips Tab + Alerts Tab
64. Vehicle Create / Edit Pages (Form + Photo Uploads + Confirm Delete)

**PHASE 17 — Geofences, Alerts & Reports** (Steps 65–68)
65. Geofence Management Page: List + Drawer Form
66. Geofence Management Page: MapLibre Draw Integration + Test Point Mode
67. Alerts Page (Filters + Bulk Ack + Real-Time Subscription)
68. Trip Reports Page (Filters + Daily Chart + Trip Table + Heatmap Panel)

**PHASE 18 — Admin & Settings Pages** (Steps 69–70)
69. Admin Pages (Dashboard + Users + Fleet)
70. Profile & Settings Pages (Profile / Account / Appearance / Notifications)

**PHASE 19 — Polish, a11y & 404** (Steps 71–73)
71. App-Specific Reusable Components (StatusBadge, RoleBadge, EmptyState, CharacterCounter)
72. Toast System (sonner), Loading Skeletons & Accessibility Sweep
73. 404 Page, Responsive Review & Final UI Polish

**PHASE 20 — Testing** (Steps 74–77)
74. Vitest Backend Unit Tests (Auth Service, AlertEngine, Geo Util)
75. Supertest Integration Tests (Auth Flow + RBAC Matrix + Vehicle CRUD Cascade)
76. Vitest + RTL Frontend Component Tests
77. Playwright E2E Scenarios

**PHASE 21 — Observability** (Steps 78–79)
78. Sentry Integration (Server + Client + Source Maps + PII Redaction)
79. Pino Logger + Better Stack Transport + Redaction Paths

**PHASE 22 — Documentation & Cleanup** (Steps 80–81)
80. README, Architecture Diagram, API Tables & WebSocket Protocol Docs
81. Code Cleanup, .env.example Sync & Pre-Deploy Audit

**PHASE 23 — Deployment** (Steps 82–86)
82. Supabase Project Setup, PostGIS Enabling & Connection Strings
83. Railway Backend Deployment (Build / Start / Env Variables)
84. Production Migrations & Initial Admin Seed
85. Vercel Frontend Deployment (SPA Fallback + Env Variables)
86. GitHub Actions CI Pipeline & Post-Deploy Verification

---

# PHASE 1 — Backend Foundation

## STEP 1 — Root Project Scaffolding, .gitignore & Biome Shared Config

Create the root project with two top-level folders: `server/` and `client/`. Do **not** initialize a Git repository (the user handles version control via GitHub Desktop). Create only a root `.gitignore` and a root `biome.json` shared between both projects.

### Top-level structure

```
vehicle-tracking-system/
├── .gitignore
├── biome.json
├── README.md
├── STEPS.md
├── server/      ← created in STEP 2
└── client/      ← created in STEP 41
```

### Root `.gitignore`

```
node_modules/
dist/
build/
.env
.env.*
!.env.example
*.log
.DS_Store
.vscode/
.idea/
coverage/
playwright-report/
test-results/
```

### Root `biome.json`

Critical settings:

| Setting | Value | Why |
|---|---|---|
| `$schema` | `https://biomejs.dev/schemas/1.9.0/schema.json` | IDE autocomplete |
| `vcs.enabled` | `true` | Respects `.gitignore` |
| `vcs.clientKind` | `git` | |
| `vcs.useIgnoreFile` | `true` | |
| `formatter.indentStyle` | `space` | |
| `formatter.indentWidth` | `2` | |
| `formatter.lineWidth` | `100` | |
| `linter.rules.recommended` | `true` | |
| `linter.rules.suspicious.noExplicitAny` | `error` | TS strictness |
| `linter.rules.style.useImportType` | `error` | Tree-shake friendly |
| `linter.rules.style.noNonNullAssertion` | `warn` | Discourage `!` operator |
| `javascript.parser.unsafeParameterDecoratorsEnabled` | `true` | **Required for NestJS** (`@Inject`, `@Body`, `@Param` etc.) |
| `organizeImports.enabled` | `true` | |

**SECURITY:**
- `.env` files ignored everywhere; only `.env.example` committed.
- `dist/`, `build/`, `coverage/` excluded.
- No real secrets anywhere in the repo.

---

## STEP 2 — NestJS Initialization & Server Folder Structure

### Initialize

Inside `server/`:

```
npx @nestjs/cli new . --strict --skip-git --package-manager npm
```

Strip the default toolchain that conflicts with our stack:

```
npm uninstall eslint prettier @typescript-eslint/parser @typescript-eslint/eslint-plugin eslint-config-prettier eslint-plugin-prettier jest @types/jest ts-jest @nestjs/testing
```

(Re-add `@nestjs/testing` later in STEP 75 since we still need it for Supertest e2e.)

### Folder structure (`server/`)

```
server/
├── src/
│   ├── common/
│   │   ├── decorators/
│   │   │   ├── current-user.decorator.ts
│   │   │   ├── public.decorator.ts
│   │   │   └── roles.decorator.ts
│   │   ├── dto/
│   │   │   └── pagination.dto.ts
│   │   ├── enums/
│   │   │   └── user-role.enum.ts
│   │   ├── filters/
│   │   │   └── all-exceptions.filter.ts
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts
│   │   │   ├── jwt-refresh.guard.ts
│   │   │   ├── roles.guard.ts
│   │   │   └── ws-jwt.guard.ts
│   │   ├── interceptors/
│   │   │   └── transform.interceptor.ts
│   │   ├── pipes/
│   │   │   └── parse-uuid-or-fail.pipe.ts
│   │   └── utils/
│   │       ├── escape-regex.ts
│   │       ├── postgis-point.ts
│   │       └── timing-safe-equal.ts
│   ├── config/
│   │   ├── app.config.ts
│   │   ├── database.config.ts
│   │   ├── jwt.config.ts
│   │   └── env.validation.ts
│   ├── modules/
│   │   ├── auth/
│   │   ├── users/
│   │   ├── vehicles/
│   │   ├── locations/
│   │   ├── geofences/
│   │   ├── alerts/
│   │   ├── trips/
│   │   ├── uploads/
│   │   ├── admin/
│   │   └── realtime/
│   ├── migrations/
│   ├── scripts/
│   │   ├── seed-admin.ts
│   │   └── gps-simulator.ts
│   ├── app.module.ts
│   ├── main.ts
│   └── data-source.ts
├── test/
│   └── e2e/
├── biome.json                ← extends root (or just references root)
├── tsconfig.json
├── tsconfig.build.json
├── nest-cli.json
├── vitest.config.ts          ← added in STEP 74
├── vitest.e2e.config.ts      ← added in STEP 75
├── package.json
└── .env.example
```

### Dependencies — production

`@nestjs/common@^10`, `@nestjs/core@^10`, `@nestjs/config@^3`, `@nestjs/platform-express@^10`, `@nestjs/platform-ws@^10`, `@nestjs/websockets@^10`, `@nestjs/typeorm@^10`, `@nestjs/passport@^10`, `@nestjs/jwt@^10`, `@nestjs/throttler@^6`, `@nestjs/schedule@^4`, `passport@^0.7`, `passport-jwt@^4`, `passport-local@^1`, `typeorm@^0.3`, `pg@^8`, `bcrypt@^5`, `class-validator@^0.14`, `class-transformer@^0.5`, `helmet@^7`, `cookie-parser@^1`, `ws@^8`, `cloudinary@^2`, `multer@^1`, `nestjs-pino@^4`, `pino-http@^10`, `reflect-metadata@^0.2`, `rxjs@^7`, `compression@^1`, `@sentry/nestjs@^8`.

### Dependencies — dev

`@nestjs/cli@^10`, `@nestjs/schematics@^10`, `@biomejs/biome@^1.9`, `vitest@^2`, `@vitest/coverage-v8@^2`, `supertest@^7`, `@types/supertest`, `@types/ws`, `@types/bcrypt`, `@types/passport-jwt`, `@types/passport-local`, `@types/multer`, `@types/cookie-parser`, `@types/node`, `@swc/core@^1`, `unplugin-swc@^1`, `typescript@^5`, `ts-node@^10`.

### `server/biome.json`

Extends root via `"extends": ["//"]` or duplicates the relevant rules. Either approach is fine; Biome `extends` requires path or "//".

**SECURITY:**
- Default Nest scaffolding's `app.controller.spec.ts` removed (no orphan tests).
- `@nestjs/testing` removed temporarily to prevent accidental use of Jest patterns; re-installed in test phase.

---

## STEP 3 — ConfigModule, Env Validation & .env.example

### `config/env.validation.ts`

Use **class-validator** + a custom `validate(config)` function passed to `ConfigModule.forRoot({ isGlobal: true, validate, cache: true })`. Throws on startup if any required variable is missing or invalid.

### Environment variables

| Variable | Required | Default | Notes |
|---|---|---|---|
| `NODE_ENV` | no | `development` | `production` triggers strict checks |
| `PORT` | no | `5000` | |
| `DATABASE_URL` | **yes** | — | `postgres://user:pass@host:5432/db?sslmode=require` |
| `JWT_ACCESS_SECRET` | **yes** | — | **min 32 chars in production** |
| `JWT_ACCESS_TTL` | no | `15m` | |
| `JWT_REFRESH_SECRET` | **yes** | — | min 32 chars, **different from access** |
| `JWT_REFRESH_TTL` | no | `7d` | |
| `CLIENT_URL` | **yes** | `http://localhost:3000` | strict CORS origin |
| `CLOUDINARY_CLOUD_NAME` | yes (prod) | — | |
| `CLOUDINARY_API_KEY` | yes (prod) | — | |
| `CLOUDINARY_API_SECRET` | yes (prod) | — | |
| `SIMULATOR_API_KEY` | **yes** | — | min 32 chars, shared with `/ws/vehicles` |
| `SPEED_LIMIT_KMH` | no | `90` | global default |
| `IDLE_THRESHOLD_MIN` | no | `10` | minutes |
| `TRIP_END_MIN` | no | `5` | idle minutes that close a trip |
| `ADMIN_EMAIL` | yes (seed) | — | |
| `ADMIN_PASSWORD` | yes (seed) | — | |
| `ADMIN_NAME` | yes (seed) | — | |
| `SENTRY_DSN` | no (recommended prod) | — | |
| `LOG_LEVEL` | no | `info` | pino level |

### Validator class

`EnvironmentVariables` class with `class-validator` decorators per field. The `validate(config)` function uses `plainToInstance` + `validateSync`; if errors, throws aggregated message. Additionally, post-validation hooks check:

- In `production`, `JWT_ACCESS_SECRET.length >= 32` AND `JWT_REFRESH_SECRET.length >= 32` AND `JWT_ACCESS_SECRET !== JWT_REFRESH_SECRET`.
- In `production`, both Cloudinary keys non-empty.

### `.env.example`

Mirror every variable above with placeholder values. No real secrets.

### Module wiring (`app.module.ts`)

```ts
ConfigModule.forRoot({
  isGlobal: true,
  validate,
  envFilePath: ['.env.local', '.env'],
  cache: true,
});
```

**SECURITY:**
- App refuses to start when required env missing.
- Two JWT secrets required, must be different, both ≥32 chars in production.
- `.env.example` never contains real values.

---

## STEP 4 — Global Pipeline (Helmet, CORS, ValidationPipe, Compression, Cookie Parser)

### `main.ts` bootstrap order (critical)

| Order | Step | Notes |
|---|---|---|
| 1 | `NestFactory.create(AppModule, { bufferLogs: true })` | bufferLogs for pino later |
| 2 | `app.set('trust proxy', 1)` | Required behind Railway/Vercel proxy |
| 3 | `app.use(helmet())` | secure HTTP headers |
| 4 | `app.use(cookieParser())` | refresh token in httpOnly cookie |
| 5 | `app.use(compression())` | gzip responses |
| 6 | `app.enableCors({ origin: env.CLIENT_URL, credentials: true })` | strict origin, allows refresh cookie |
| 7 | Global `ValidationPipe` (see below) | mass-assignment proof |
| 8 | Global filter & interceptor (STEP 5) | |
| 9 | WebSocket adapter (STEP 24) | |
| 10 | `app.disable('x-powered-by')` | hide framework signature |
| 11 | Sentry init (STEP 78) | |
| 12 | `await app.listen(env.PORT)` | |

### Global ValidationPipe configuration

```ts
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
  transformOptions: { enableImplicitConversion: true },
  stopAtFirstError: false,
}));
```

| Option | Effect |
|---|---|
| `whitelist` | Strips properties not in DTO |
| `forbidNonWhitelisted` | **Returns 400 if unknown property is sent** — mass-assignment protection at framework level |
| `transform` | Auto-converts payloads to DTO instance |
| `enableImplicitConversion` | Coerces query strings to types (e.g. `?page=2` → `2`) |

### Body limits

`main.ts` calls `app.useBodyParser('json', { limit: '10kb' })` and `app.useBodyParser('urlencoded', { limit: '10kb', extended: true })`. Larger payloads rejected before reaching controllers.

**SECURITY:**
- Helmet headers (CSP, X-Content-Type-Options, X-Frame-Options, HSTS, etc.).
- Strict CORS origin with credentials (refresh cookie can flow).
- Body size 10kb caps DoS payloads.
- `forbidNonWhitelisted` blocks **any** extra property — single most effective mass-assignment defense.
- `x-powered-by` disabled.

---

## STEP 5 — ThrottlerModule, AllExceptionsFilter & TransformInterceptor

### `ThrottlerModule` configuration

Mount in `app.module.ts` with **named throttlers**:

| Throttler name | TTL | Limit | Used by |
|---|---|---|---|
| `default` | 60s | 100 | Global `APP_GUARD` |
| `auth` | 15 min | 10 | `@Throttle({ auth: { limit: 10, ttl: 900_000 } })` on login/register/refresh/change-password |
| `upload` | 60 min | 30 | upload controllers |
| `export` | 15 min | 20 | export controllers |
| `admin` | 5 min | 60 | admin controllers |

```ts
ThrottlerModule.forRoot([
  { name: 'default', ttl: 60_000, limit: 100 },
  { name: 'auth',    ttl: 900_000, limit: 10  },
  { name: 'upload',  ttl: 3_600_000, limit: 30 },
  { name: 'export',  ttl: 900_000, limit: 20 },
  { name: 'admin',   ttl: 300_000, limit: 60 },
]);
```

Register `{ provide: APP_GUARD, useClass: ThrottlerGuard }` as default. Health endpoint bypasses via `@SkipThrottle()`.

### `AllExceptionsFilter`

Implements `ExceptionFilter`. Handles `HttpException`, `QueryFailedError` (Postgres), `JsonWebTokenError`, `TokenExpiredError`, and unknown. In **production**:

- Stack traces never returned.
- Postgres error details (`error.code`, `error.detail`) translated to friendly messages.
- Unique violation (`23505`) → `Resource already exists`.
- Foreign key violation (`23503`) → `Referenced resource does not exist`.
- Unknown errors → `Internal server error` with a UUID logged to pino for support.

### `TransformInterceptor`

Wraps all successful responses in `{ success: true, data: <return value> }`. Allows controllers to also return `{ data, meta }` patterns by detecting `meta` key and preserving it.

Error responses (via filter): `{ success: false, message: string, errors?: ValidationError[], requestId?: string }`.

**SECURITY:**
- Throttle abuse: each route family has its own bucket.
- Production errors hide implementation details.
- Each unknown error gets a request UUID for support without leaking internals.

---

## STEP 6 — NPM Scripts, Logging & Health Endpoint

### Pino logger setup

Install: already in dependencies (`nestjs-pino`, `pino-http`).

In `app.module.ts`:

```ts
LoggerModule.forRoot({
  pinoHttp: {
    level: env.LOG_LEVEL || 'info',
    transport: env.NODE_ENV === 'production'
      ? undefined
      : { target: 'pino-pretty', options: { singleLine: true } },
    redact: {
      paths: [
        'req.headers.authorization',
        'req.headers.cookie',
        'req.body.password',
        'req.body.currentPassword',
        'req.body.newPassword',
        'res.headers["set-cookie"]',
      ],
      remove: true,
    },
    autoLogging: { ignore: (req) => req.url === '/api/health' },
  },
});
```

In `main.ts`, after creating the app:

```ts
app.useLogger(app.get(Logger));
```

### Health endpoint

A `HealthController` (in `common/`) with one route:

| Method | Path | Auth | Body |
|---|---|---|---|
| `GET` | `/api/health` | `@Public()` + `@SkipThrottle()` | `{ status: 'ok', uptime, timestamp, env: 'production' \| 'development' }` |

Excluded from throttler so uptime monitors stay green.

### npm scripts (`server/package.json`)

| Script | Command |
|---|---|
| `dev` | `nest start --watch` |
| `start` | `node dist/main.js` |
| `build` | `nest build` |
| `mig:gen` | `typeorm-ts-node-commonjs migration:generate -d src/data-source.ts src/migrations/$NAME` |
| `mig:run` | `typeorm-ts-node-commonjs migration:run -d src/data-source.ts` |
| `mig:revert` | `typeorm-ts-node-commonjs migration:revert -d src/data-source.ts` |
| `seed` | `ts-node src/scripts/seed-admin.ts` |
| `simulate` | `ts-node src/scripts/gps-simulator.ts` |
| `test` | `vitest run` |
| `test:watch` | `vitest` |
| `test:e2e` | `vitest run --config vitest.e2e.config.ts` |
| `lint` | `biome check .` |
| `format` | `biome format --write .` |

**SECURITY:**
- Sensitive paths redacted from logs (no token, cookie, or password ever logged).
- Health endpoint exempt from throttle but `@Public()` (no auth needed).
- Production logging uses default JSON for log aggregation; dev uses pretty.

---

# PHASE 2 — Database Setup

## STEP 7 — PostgreSQL Connection, TypeORM Config & data-source.ts

### `data-source.ts`

A standalone `DataSource` export used by both NestJS runtime and the TypeORM CLI for migrations:

```ts
export const dataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: ['dist/**/*.entity.js'],
  migrations: ['dist/migrations/*.js'],
  migrationsRun: false,
  synchronize: false,
  logging: process.env.NODE_ENV !== 'production' ? ['error', 'warn'] : ['error'],
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});
```

**`synchronize: false` is non-negotiable, even in dev.** All schema changes go through reviewed migrations.

### `config/database.config.ts`

Returns the same options factory for `TypeOrmModule.forRootAsync`:

```ts
TypeOrmModule.forRootAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (cfg: ConfigService) => ({
    type: 'postgres',
    url: cfg.get('DATABASE_URL'),
    autoLoadEntities: true,
    synchronize: false,
    logging: cfg.get('NODE_ENV') !== 'production' ? ['error', 'warn'] : ['error'],
    ssl: cfg.get('NODE_ENV') === 'production' ? { rejectUnauthorized: false } : false,
  }),
});
```

`autoLoadEntities: true` lets feature modules register entities via `TypeOrmModule.forFeature([X])` without listing in root config.

### Connection pool tuning (documented)

For Supabase pooler connection (port 6543), default TypeORM pool is fine. For direct connection (port 5432), set `extra: { max: 20 }` if expecting concurrent workers. Document this in README.

**SECURITY:**
- `synchronize: false` — schema changes never silent.
- SSL required for managed Postgres (Supabase).
- Two connection modes documented (pooler vs direct).

---

## STEP 8 — Migration CLI Wiring & First Migration (PostGIS + pgcrypto)

### TypeORM CLI integration

Verify the npm scripts from STEP 6 work end-to-end:

```
npm run mig:gen -- src/migrations/0001-enable-extensions
```

(name parameter via env var or CLI arg; document the exact invocation in README.)

### First migration (`migrations/0001-enable-extensions.ts`)

```ts
import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnableExtensions1700000000001 implements MigrationInterface {
  public async up(q: QueryRunner): Promise<void> {
    await q.query(`CREATE EXTENSION IF NOT EXISTS postgis;`);
    await q.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto;`);
  }

  public async down(q: QueryRunner): Promise<void> {
    await q.query(`DROP EXTENSION IF EXISTS pgcrypto;`);
    await q.query(`DROP EXTENSION IF EXISTS postgis;`);
  }
}
```

### Why `pgcrypto`

For `gen_random_uuid()` — UUID v4 default value, no `uuid-ossp` quirks. All entity PKs use this default to avoid sequential ID enumeration.

### Migration convention

- Filename pattern: `NNNN-descriptive-name.ts` (zero-padded ordinal). TypeORM auto-generates timestamp; manually rename for ordering clarity.
- One concern per migration. Never combine "add column" with "create table" unrelated.
- Always implement both `up` and `down`. Refuse to ship one-way migrations.

**SECURITY:**
- Extensions enabled via reviewed migration only — production DBA can audit before applying.
- `pgcrypto` gives cryptographically random UUIDs (no info leakage from IDs).

---

## STEP 9 — Custom Geometry Transformer (Point ↔ {lng, lat})

### Problem

TypeORM 0.3 doesn't ship a first-class `geometry(Point, 4326)` type for PostGIS. We need:

- DB column type: `geometry(Point, 4326)`.
- TS shape: `{ lng: number; lat: number }`.
- Read transformer: `ST_AsGeoJSON(col)` → JSON parse → `{ lng, lat }`.
- Write transformer: `{ lng, lat }` → `ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)`.

### `common/utils/postgis-point.ts`

Export two things:

1. **A reusable column options builder** for `@Column({...pointColumn()})` that sets `type: 'geometry'`, `spatialFeatureType: 'Point'`, `srid: 4326`, and a `transformer` that converts incoming WKT/WKB-hex strings to `{ lng, lat }` and outgoing objects to a `() => ST_SetSRID(ST_MakePoint(...), 4326)` raw expression. Because writes need raw SQL, the cleanest pattern is to write the column as `text` and persist via repository helpers that use parametrized `ST_*` functions (see STEP 10).

2. **TypeScript types:** `export type LngLat = { lng: number; lat: number }`.

> **Practical decision:** Reads via `transformer` work cleanly (Postgres returns geometry as hex EWKB; parse via lightweight helper or via `ST_AsGeoJSON(col) AS col` in SELECT). Writes go through repository-level builders that emit `ST_SetSRID(ST_MakePoint($1, $2), 4326)` parametrized. Don't try to make `@Column` writes handle PostGIS raw — too fragile across TypeORM versions.

### Coordinate validation helper

`common/utils/coords.ts`:

```ts
export const isValidLngLat = (p: unknown): p is LngLat =>
  typeof (p as any)?.lng === 'number' &&
  typeof (p as any)?.lat === 'number' &&
  (p as any).lng >= -180 && (p as any).lng <= 180 &&
  (p as any).lat >= -90 && (p as any).lat <= 90;
```

Used by DTO validators and gateway payload validators.

**SECURITY:**
- Coordinates always range-validated server-side before reaching DB.
- PostGIS writes go through parametrized queries (no string concat).

---

## STEP 10 — PostGIS Repository Helpers (nearby, ST_Contains, ST_DWithin)

### `common/utils/geo-repo.helper.ts`

A set of reusable QueryBuilder helpers used by Vehicle, Location, Geofence services. None of these use string concat — all parametrized.

### Helper functions

| Helper | Generated SQL fragment | Used by |
|---|---|---|
| `selectPointAsJson(qb, column, alias)` | `ST_AsGeoJSON(${column}) AS ${alias}` | All entities that read geometry |
| `whereDWithin(qb, column, point, meters)` | `ST_DWithin(${column}::geography, ST_SetSRID(ST_MakePoint(:lng,:lat),4326)::geography, :meters)` | nearby vehicle search |
| `whereContains(qb, polygonCol, point)` | `ST_Contains(${polygonCol}, ST_SetSRID(ST_MakePoint(:lng,:lat),4326))` | geofence polygon match |
| `whereCircleContains(qb, centerCol, radiusCol, point)` | `ST_DWithin(${centerCol}::geography, ST_SetSRID(ST_MakePoint(:lng,:lat),4326)::geography, ${radiusCol})` | geofence circle match |
| `insertPointSql(lng, lat)` | `ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)` | insertion helper, returns raw expression + params |
| `lineLengthMeters(qb, locTable, where)` | `ST_Length(ST_MakeLine(${locTable}.geom ORDER BY ${locTable}.timestamp)::geography)` | trip distance aggregation |

### Test fixture

Create a tiny sanity test (run later in STEP 74) that hits each helper against a small dataset to confirm SRID handling.

**SECURITY:**
- All helpers use parameter binding; **never accept raw user strings inside SQL fragments**.
- Distance clamped to 100 km in callers (DoS guard).
- Polygon vertex count and circle radius clamped in DTOs (STEP 29).

---

# PHASE 3 — Authentication & Authorization

## STEP 11 — User Entity, Roles Enum & Preferences JSONB Schema

### Roles enum (`common/enums/user-role.enum.ts`)

```ts
export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  VIEWER = 'viewer',
}
```

| Role | Permissions |
|---|---|
| `admin` | Full access: user management, all resource CRUD, system stats |
| `manager` | CRUD on vehicles/geofences/alerts/trips; view all dashboards; **cannot** manage users |
| `viewer` | Read-only: live dashboard, vehicle list/detail, history, alerts, trip reports |

### `User` entity (`modules/users/user.entity.ts`)

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` | |
| `name` | `varchar(60)` | not null | 2–60 chars |
| `email` | `varchar(120)` | not null, unique | lowercase, indexed |
| `password` | `varchar(72)` | not null, `select: false` | bcrypt hash |
| `role` | `enum(UserRole)` | not null, default `'viewer'` | **never settable via public API** |
| `avatarUrl` | `text` | nullable | Cloudinary URL |
| `phone` | `varchar(30)` | nullable | |
| `isActive` | `boolean` | not null, default `true` | |
| `lastLoginAt` | `timestamptz` | nullable | |
| `refreshTokenHash` | `varchar(120)` | nullable, `select: false` | rotated each refresh |
| `preferences` | `jsonb` | not null, default `'{}'::jsonb` | nested schema below |
| `createdAt` | `timestamptz` | not null, default `now()` | |
| `updatedAt` | `timestamptz` | not null, `@UpdateDateColumn` | |

### Preferences JSONB schema

Stored as `jsonb` with defaults applied in service when reading (server-side fill-in):

| Field | Type | Default | Allowed |
|---|---|---|---|
| `theme` | string | `'system'` | `light`, `dark`, `system` |
| `fontSize` | string | `'md'` | `sm`, `md`, `lg` |
| `contentDensity` | string | `'comfortable'` | `compact`, `comfortable`, `spacious` |
| `animations` | boolean | `true` | |
| `language` | string | `'en'` | `en` |
| `notifications.email` | boolean | `true` | |
| `notifications.inApp` | boolean | `true` | |
| `notifications.severityThreshold` | string | `'warning'` | `info`, `warning`, `critical` |
| `mapDefaults.center` | `[lng, lat]` | `[28.9784, 41.0082]` | Istanbul default |
| `mapDefaults.zoom` | number | `11` | 3–18 |

Validation via nested DTO + `@ValidateNested()` in any update path.

### Migration

`migrations/0002-create-user.ts` — `CREATE TABLE user (...)`, unique index on `email`, role enum type creation.

**SECURITY:**
- Email unique index prevents duplicates without explicit check.
- `password` and `refreshTokenHash` have `select: false` — never leak in responses.
- `role` default `'viewer'` and only `admin` endpoints can change it (STEP 39).
- Preferences validated against allowed enums every write.

---

## STEP 12 — Passport Strategies (Local + JWT + JWT-Refresh)

Place in `modules/auth/strategies/`.

### `LocalStrategy` (`local.strategy.ts`)

- Extends `PassportStrategy(Strategy, 'local')`.
- Constructor: super(`{ usernameField: 'email' }`).
- `validate(email, password)` → calls `AuthService.validateCredentials(email, password)`. Returns user object (without password). Throws `UnauthorizedException('Invalid email or password')` for **any** failure (user not found, wrong password, inactive account) — **identical message** to prevent enumeration.

### `JwtStrategy` (`jwt.strategy.ts`)

- Extends `PassportStrategy(Strategy, 'jwt')`.
- Extract: `ExtractJwt.fromAuthHeaderAsBearerToken()`.
- `secretOrKey`: from `ConfigService.get('JWT_ACCESS_SECRET')`.
- `ignoreExpiration: false`.
- `validate(payload)` returns `{ id: payload.sub, role: payload.role, email: payload.email }`. **Doesn't reload from DB** — token is trusted; user reload happens only in endpoints that need fresh state.

### `JwtRefreshStrategy` (`jwt-refresh.strategy.ts`)

- Extends `PassportStrategy(Strategy, 'jwt-refresh')`.
- Extract from `req.cookies['refresh_token']` (custom extractor).
- `secretOrKey`: `JWT_REFRESH_SECRET`.
- `passReqToCallback: true` so `validate(req, payload)` can also access the raw refresh token (`req.cookies['refresh_token']`) for rotation comparison.
- Returns `{ id: payload.sub, refreshToken: req.cookies['refresh_token'] }`.

### Why separate `JwtModule.register` per strategy

Use `JwtModule.registerAsync` once for the access strategy. For signing/verifying refresh tokens, instantiate a separate `JwtService` directly inside `AuthService` (see STEP 13) configured with the refresh secret. This keeps verification straightforward and doesn't require multiple `JwtModule` registrations.

**SECURITY:**
- Two distinct secrets (compromise isolation).
- Refresh extracted from httpOnly cookie only — JavaScript cannot read it.
- Identical login error message defeats user enumeration.
- Access strategy doesn't hit DB → fast, but means revocation requires short TTL (15min) and refresh rotation.

---

## STEP 13 — JwtModule Configuration & Token Issuance Service

### Register `JwtModule` (access)

In `auth.module.ts`:

```ts
JwtModule.registerAsync({
  inject: [ConfigService],
  useFactory: (cfg: ConfigService) => ({
    secret: cfg.get('JWT_ACCESS_SECRET'),
    signOptions: { expiresIn: cfg.get('JWT_ACCESS_TTL') || '15m' },
  }),
});
```

### Token shapes

**Access token payload:**

```
{ sub: string (user id), role: UserRole, email: string, iat, exp }
```

**Refresh token payload:**

```
{ sub: string, jti: string (random UUID), iat, exp }
```

The `jti` (JWT ID) is critical — its hash is stored in `User.refreshTokenHash` for rotation comparison.

### `AuthService` — token utilities (subset, full service in STEP 14)

| Method | Behavior |
|---|---|
| `hashPassword(plain)` | bcrypt rounds 12 |
| `comparePassword(plain, hash)` | bcrypt compare |
| `signAccessToken(user)` | uses `JwtService.sign({ sub, role, email })` |
| `signRefreshToken(user)` | uses a **second `JwtService` instance** configured with refresh secret. Generates a fresh `jti` (crypto.randomUUID()), signs, returns `{ token, jti }` |
| `hashJti(jti)` | bcrypt hash with rounds 10 (faster; JTI is high-entropy, less iterations needed) |

### Setting the refresh cookie

A helper `setRefreshCookie(res, token)`:

```ts
res.cookie('refresh_token', token, {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/api/auth',
  maxAge: 7 * 24 * 60 * 60 * 1000,
});
```

Restricted `path: '/api/auth'` means the cookie isn't sent on every API call — only auth-related endpoints — reducing the attack surface and CSRF impact further.

### Clearing the cookie (logout / reuse detection)

`clearRefreshCookie(res)` — same options, `maxAge: 0`.

**SECURITY:**
- `httpOnly` (no JS access).
- `secure` in production (HTTPS only).
- `sameSite: 'lax'` (mostly CSRF-resistant for state-changing requests; `strict` if frontend on same site is feasible).
- `path: '/api/auth'` scopes cookie to auth endpoints only.
- bcrypt rounds 12 for passwords, 10 for JTI (high-entropy already, less iterations OK).

---

## STEP 14 — Refresh Token Rotation with Reuse Detection

### Threat model

If an attacker steals a refresh token (via XSS that escapes httpOnly somehow, or malware on user's machine), they can mint new access tokens indefinitely. **Refresh rotation with reuse detection** mitigates this:

1. On every refresh, the old refresh token is invalidated and a new one issued.
2. If anyone — attacker OR victim — tries to use the old refresh token, the server detects the reuse and **revokes all sessions** (clears `refreshTokenHash`), forcing both to log in fresh.

### `AuthService.verifyAndRotateRefresh(rawToken)`

Implementation outline:

```ts
async verifyAndRotateRefresh(rawToken: string): Promise<TokenPair> {
  let payload: { sub: string; jti: string };
  try {
    payload = await this.jwtRefresh.verifyAsync(rawToken);
  } catch {
    throw new UnauthorizedException();
  }

  const user = await this.users.findOne({
    where: { id: payload.sub },
    select: ['id', 'role', 'email', 'isActive', 'refreshTokenHash'],
  });
  if (!user || !user.isActive || !user.refreshTokenHash) {
    throw new UnauthorizedException();
  }

  const match = await bcrypt.compare(payload.jti, user.refreshTokenHash);
  if (!match) {
    // Reuse detected → revoke all sessions
    await this.users.update(user.id, { refreshTokenHash: null });
    throw new UnauthorizedException('Session revoked');
  }

  // Issue new pair, store new JTI hash
  const { token: newRefresh, jti: newJti } = this.signRefreshToken(user);
  await this.users.update(user.id, { refreshTokenHash: await this.hashJti(newJti) });
  const accessToken = this.signAccessToken(user);
  return { accessToken, refreshToken: newRefresh };
}
```

### Persistence pattern

`User.refreshTokenHash` holds the bcrypt hash of the **currently valid** JTI. There is exactly one valid refresh token per user at any time. This is intentionally simple — no per-device sessions; trade-off is one-device-at-a-time refresh model, which is fine for a fleet dashboard.

> **Scaling note (documented):** If multi-device support is later needed, replace `refreshTokenHash` with a `refresh_sessions` table storing one row per active JTI hash with `userId`, `userAgent`, `createdAt`, `lastUsedAt`. Reuse detection logic identical at row level.

### Logout

`AuthService.logout(userId)` → `users.update(userId, { refreshTokenHash: null })` AND clears the cookie.

### Change password

In addition to verifying current password and updating, **invalidates all sessions** (`refreshTokenHash: null`).

**SECURITY:**
- Reuse detection catches stolen tokens.
- Single hash storage simple to reason about and audit.
- Password change invalidates all sessions (security best practice).
- Old refresh tokens fail closed (reject) on any inconsistency.

---

## STEP 15 — Auth Controller (Register / Login / Refresh / Logout / Me / Change Password / Delete Account)

### DTOs (`modules/auth/dto/`)

| DTO | Fields | Validators |
|---|---|---|
| `RegisterDto` | `name`, `email`, `password` | `IsString @Length(2,60)`, `IsEmail @Normalize`, `IsString @MinLength(8) @Matches(/[A-Za-z]/) @Matches(/\d/)` |
| `LoginDto` | `email`, `password` | `IsEmail`, `IsString @IsNotEmpty` |
| `UpdateMeDto` | `name?`, `phone?`, `avatarUrl?`, `preferences?` | optional with nested validation |
| `ChangePasswordDto` | `currentPassword`, `newPassword` | same as `password` rules for `newPassword` |
| `DeleteAccountDto` | `password` | `IsString @IsNotEmpty` |

**Crucially, `RegisterDto` does NOT include `role`** — and `forbidNonWhitelisted` will return 400 if anyone tries to send it.

### `AuthController`

| Method | Path | Auth Decorators | Notes |
|---|---|---|---|
| `register` | `POST /api/auth/register` | `@Public()` + `@Throttle({ auth })` | Service hard-codes role to `VIEWER`. Sets refresh cookie + returns access token. Generic duplicate-email error. |
| `login` | `POST /api/auth/login` | `@Public()` + `@UseGuards(LocalAuthGuard)` + `@Throttle({ auth })` | Returns access token + sets refresh cookie. Updates `lastLoginAt`. |
| `refresh` | `POST /api/auth/refresh` | `@Public()` + `@UseGuards(JwtRefreshGuard)` | Verifies, rotates, returns new access + sets new refresh cookie. |
| `me` | `GET /api/auth/me` | (default JwtAuthGuard) | Returns sanitized user. |
| `updateMe` | `PATCH /api/auth/me` | (default JwtAuthGuard) | Whitelisted DTO. |
| `changePassword` | `POST /api/auth/change-password` | `@Throttle({ auth })` | Requires `currentPassword`. Invalidates all sessions. |
| `logout` | `POST /api/auth/logout` | (default JwtAuthGuard) | Clears cookie + nullifies `refreshTokenHash`. |
| `deleteAccount` | `DELETE /api/auth/me` | (default JwtAuthGuard) | Requires password. Cascade via FK policies. |

### Controller method body pattern

Each method:
1. Calls service.
2. Sets/clears cookie via injected `@Res({ passthrough: true }) res: Response`.
3. Returns only the access token + sanitized user (refresh stays in cookie).

### Public response envelope

Login/register/refresh responses:

```
{ success: true, data: { accessToken, user: { id, name, email, role, avatarUrl, preferences } } }
```

`me` returns the same `user` object (without `accessToken`).

**SECURITY:**
- `register` and `login` rate-limited via `auth` throttler.
- `forbidNonWhitelisted` blocks any unknown DTO field (e.g. attempted `role` injection).
- Generic auth errors.
- Refresh cookie never returned in JSON body.
- Account delete requires password confirmation.

---

## STEP 16 — Guards, Decorators & Admin Seed Script

### Decorators (`common/decorators/`)

| Decorator | Purpose |
|---|---|
| `@Public()` | `SetMetadata('isPublic', true)` — `JwtAuthGuard` skips |
| `@Roles(...roles: UserRole[])` | `SetMetadata('roles', roles)` — `RolesGuard` reads |
| `@CurrentUser()` | param decorator returning `req.user` |

### Guards (`common/guards/`)

| Guard | Behavior |
|---|---|
| `JwtAuthGuard` | extends `AuthGuard('jwt')`. Overrides `canActivate` to skip when `@Public()` metadata is present. Registered as `APP_GUARD` (global). |
| `JwtRefreshGuard` | extends `AuthGuard('jwt-refresh')`. Applied only to `/auth/refresh`. |
| `LocalAuthGuard` | extends `AuthGuard('local')`. Applied to `/auth/login`. |
| `RolesGuard` | Reads `roles` metadata; rejects if `req.user.role` not in list. Registered as `APP_GUARD` (after JwtAuthGuard). |
| `WsJwtGuard` | Verifies JWT during WebSocket handshake (see STEP 27). |

### Global guard order

In `app.module.ts`:

```ts
{ provide: APP_GUARD, useClass: JwtAuthGuard },
{ provide: APP_GUARD, useClass: RolesGuard },
```

Order matters: auth before role check.

### Admin seed script (`scripts/seed-admin.ts`)

A standalone Node script (not a Nest CLI command) that:

1. Loads env from `.env`.
2. Creates a minimal `DataSource` and initializes it.
3. Reads `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME`.
4. Queries `users` for that email; if exists, exit.
5. Otherwise inserts a new admin user with hashed password.
6. Logs the seeded email **only** (never the password).

Idempotent — running twice is safe.

```
npm run seed
```

**SECURITY:**
- Global guards mean every endpoint is protected by default; opt-out via `@Public()`.
- `RolesGuard` only enforces when `@Roles()` metadata is present (manager/admin gates).
- Seed script never prints credentials.
- Admin seed is the ONLY path that creates an admin role from outside the running app.

---

# PHASE 4 — Vehicles Module

## STEP 17 — Vehicle Entity, Migrations, Indexes & Search Configuration

### `Vehicle` entity (`modules/vehicles/vehicle.entity.ts`)

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` | |
| `plate` | `varchar(15)` | not null, unique | uppercased, 4–15 chars |
| `vehicleType` | enum | not null | `car`, `truck`, `van`, `motorcycle`, `bus`, `other` |
| `model` | `varchar(80)` | nullable | |
| `year` | `smallint` | nullable | 1980–current year |
| `color` | `varchar(30)` | nullable | |
| `driver` | `jsonb` | not null, default `'{}'` | `{ name, phone, photoUrl, licenseNumber }` |
| `photoUrl` | `text` | nullable | |
| `speedLimitKmh` | `smallint` | not null, default `90` | per-vehicle override |
| `isActive` | `boolean` | not null, default `true` | |
| `lastLocation` | `jsonb` | nullable | denormalized for fast list/dashboard |
| `assignedManagers` | `uuid[]` | not null, default `'{}'` | user ids who can edit |
| `createdById` | `uuid` | not null, FK → `users.id` `ON DELETE SET NULL` | |
| `tags` | `varchar(30)[]` | not null, default `'{}'` | max 10 items |
| `createdAt`/`updatedAt` | `timestamptz` | | |

### `lastLocation` jsonb shape

```
{ lng, lat, speed, heading, timestamp (ISO), status: 'moving'|'idle'|'offline' }
```

### Indexes (migration `0003-create-vehicle.ts`)

```sql
CREATE UNIQUE INDEX vehicle_plate_unique_idx ON vehicle (plate);
CREATE INDEX vehicle_type_active_idx ON vehicle (is_active, vehicle_type);
CREATE INDEX vehicle_tags_idx ON vehicle USING GIN (tags);
CREATE INDEX vehicle_created_by_idx ON vehicle (created_by_id);
CREATE INDEX vehicle_search_idx ON vehicle USING GIN (
  to_tsvector('simple',
    coalesce(plate, '') || ' ' ||
    coalesce(model, '') || ' ' ||
    coalesce(driver->>'name', '')
  )
);
```

The `vehicle_search_idx` enables fast full-text search via `@@ plainto_tsquery('simple', :q)`. Alternative (used when bootstrapping): simple ILIKE with regex-escaped input.

### Plate normalization

A `@BeforeInsert()` and `@BeforeUpdate()` hook uppercases `plate` and trims whitespace.

**SECURITY:**
- Plate unique at DB level (no race condition).
- `createdById` FK with `ON DELETE SET NULL` — user deletion doesn't orphan or fail cascade.
- Search index uses `'simple'` config — no language-specific stemming surprises.
- `tags` and `assignedManagers` array columns capped client-side; backend re-validates.

---

## STEP 18 — Vehicle DTOs & Validation Rules

### DTOs (`modules/vehicles/dto/`)

**`DriverDto`** (nested):

| Field | Validators |
|---|---|
| `name` | `IsString @Length(2,80)` |
| `phone?` | `IsString @MaxLength(30)` |
| `photoUrl?` | `IsString @IsUrl @MaxLength(500)` or empty |
| `licenseNumber?` | `IsString @MaxLength(50)` |

**`CreateVehicleDto`:**

| Field | Validators |
|---|---|
| `plate` | `IsString @Matches(/^[A-Z0-9 -]{4,15}$/i)` |
| `vehicleType` | `IsEnum(VehicleType)` |
| `model?` | `IsString @MaxLength(80)` |
| `year?` | `IsInt @Min(1980) @Max(currentYear)` |
| `color?` | `IsString @MaxLength(30)` |
| `driver` | `ValidateNested @Type(() => DriverDto)` |
| `photoUrl?` | `IsString @IsUrl @MaxLength(500)` |
| `speedLimitKmh?` | `IsInt @Min(10) @Max(250)` |
| `assignedManagers?` | `IsArray @ArrayMaxSize(50) @IsUUID('4', { each: true })` |
| `tags?` | `IsArray @ArrayMaxSize(10) @IsString({ each: true }) @MaxLength(30, { each: true })` |

**`UpdateVehicleDto`:** `PartialType(CreateVehicleDto)`.

**`VehicleQueryDto`:**

| Field | Validators |
|---|---|
| `q?` | `IsString @MaxLength(80)` |
| `vehicleType?` | `IsEnum(VehicleType)` |
| `status?` | `IsEnum(['moving','idle','offline'])` |
| `tag?` | `IsString @MaxLength(30)` |
| `sort?` | `IsEnum(['recent','plate','speed'])` |
| `page?` | `IsInt @Min(1) @Default(1)` |
| `limit?` | `IsInt @Min(1) @Max(50) @Default(20)` |

**`NearbyQueryDto`:**

| Field | Validators |
|---|---|
| `lng` | `IsNumber @Min(-180) @Max(180)` |
| `lat` | `IsNumber @Min(-90) @Max(90)` |
| `km?` | `IsNumber @Min(0.1) @Max(100) @Default(5)` |

**`BulkActivateDto`:**

| Field | Validators |
|---|---|
| `ids` | `IsArray @ArrayMaxSize(200) @IsUUID('4', { each: true })` |
| `isActive` | `IsBoolean` |

**SECURITY:**
- `forbidNonWhitelisted` (global pipe) ensures no extra fields slip in.
- All bounds explicit: vehicle counts in bulk capped at 200; nearby radius capped at 100km.
- `IsUrl` on photo URLs prevents javascript: URI injection.

---

## STEP 19 — Vehicle Service & Controller (CRUD + Search + Nearby + Bulk Activate)

### `VehiclesService` methods

| Method | Signature | Notes |
|---|---|---|
| `create` | `(dto, currentUser)` | Sets `createdById = currentUser.id`. **Never reads from body.** Plate uppercased in entity hook. |
| `findAll` | `(query: VehicleQueryDto)` | Builds QueryBuilder with filters; pagination; returns `{ items, page, totalPages, total }`. |
| `findOne` | `(id)` | Throws 404 if missing. |
| `update` | `(id, dto, currentUser)` | Loads vehicle; ownership check: admin OR `createdById === user.id` OR `assignedManagers` includes user.id; applies whitelisted fields. |
| `remove` | `(id, currentUser)` | Same ownership; deletes (FK cascade handles Location/Trip/Alert). |
| `nearby` | `(query: NearbyQueryDto)` | Uses `whereDWithin` helper against `lastLocation` (built into a transient `geom` via service-side raw select). |
| `bulkActivate` | `(dto, currentUser)` | Admin only. Single SQL `UPDATE` with `WHERE id = ANY($1)`. |

### Search implementation

For `q` parameter, two strategies:

- **MVP:** ILIKE with regex-escaped input across `plate`, `model`, `driver->>'name'`. Cheap, no index.
- **Scaled:** `@@ plainto_tsquery('simple', :q)` against the `vehicle_search_idx`. Faster at >100k rows.

Use ILIKE for now; document the switch.

### `VehiclesController`

| Method | Path | Roles | DTO |
|---|---|---|---|
| `create` | `POST /api/vehicles` | `@Roles(MANAGER, ADMIN)` | `CreateVehicleDto` |
| `findAll` | `GET /api/vehicles` | (any authenticated) | `VehicleQueryDto` |
| `findOne` | `GET /api/vehicles/:id` | (any) | `ParseUUIDPipe` on `id` |
| `update` | `PATCH /api/vehicles/:id` | `@Roles(MANAGER, ADMIN)` | `UpdateVehicleDto` |
| `remove` | `DELETE /api/vehicles/:id` | `@Roles(MANAGER, ADMIN)` | |
| `nearby` | `GET /api/vehicles/nearby` | (any) | `NearbyQueryDto` |
| `bulkActivate` | `POST /api/vehicles/bulk-activate` | `@Roles(ADMIN)` | `BulkActivateDto` |

**SECURITY:**
- DTOs whitelisted; `createdById` server-set.
- Ownership enforced inside service (not just controller).
- Search input regex-escaped.
- Nearby radius clamped.
- Cascade via FK keeps Location/Trip/Alert clean.

---

# PHASE 5 — Locations & Uploads

## STEP 20 — Location Entity (Hypertable-Ready PK) & Indexes

### Design intent

`Location` is a **high-write, append-only, time-series workload** that also runs geospatial queries. Designed so it can be migrated to a TimescaleDB hypertable **without schema changes** when scale demands.

Two non-negotiable design choices:
1. **Primary key includes `timestamp`** — required by `create_hypertable` if/when we promote later.
2. **Indexes mirror real queries**: per-vehicle history (compound `(vehicle_id, timestamp DESC)`) and geo (`GIST` on `geom`).

### `Location` entity (`modules/locations/location.entity.ts`)

| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` | default `gen_random_uuid()` |
| `vehicleId` | `uuid` | not null, FK → `vehicles.id` `ON DELETE CASCADE` |
| `geom` | `geometry(Point, 4326)` | not null |
| `speed` | `numeric(5,2)` | not null, check `0 ≤ speed ≤ 400` |
| `heading` | `smallint` | nullable, check `0 ≤ heading ≤ 359` |
| `altitude` | `numeric(7,2)` | nullable |
| `accuracy` | `numeric(6,2)` | nullable |
| `source` | `varchar(16)` | not null, default `'device'`, check in (`device`, `simulator`, `manual`) |
| `timestamp` | `timestamptz` | not null, default `now()` |
| **PRIMARY KEY** | `(id, timestamp)` | composite — hypertable-ready |

### Migration `0004-create-location.ts`

Creates table with composite PK; then creates indexes:

```sql
CREATE INDEX location_vehicle_time_idx ON location (vehicle_id, timestamp DESC);
CREATE INDEX location_geom_gist_idx ON location USING GIST (geom);
CREATE INDEX location_timestamp_idx ON location (timestamp DESC);
```

> **Future migration to hypertable (documented in README, not executed in this project):**
> ```sql
> SELECT create_hypertable('location', 'timestamp', chunk_time_interval => INTERVAL '1 day', migrate_data => TRUE);
> ```

### Check constraints

Explicit `CHECK` constraints at the DB level enforce ranges even if app validation is somehow bypassed. Defense in depth.

**SECURITY:**
- Composite PK avoids future migration pain.
- CHECK constraints provide a final line of defense.
- `ON DELETE CASCADE` ensures no orphan locations when vehicle is deleted.
- GIST index ensures geo queries scale.

---

## STEP 21 — Location Service (History, Latest, Stats with PostGIS Aggregation)

### `LocationsService` methods

| Method | Signature | Notes |
|---|---|---|
| `persist` | `(vehicleId, payload)` | Used by ingestion pipeline (STEP 28). Inserts a row via parametrized `ST_SetSRID(ST_MakePoint(:lng,:lat),4326)`. |
| `getHistory` | `(vehicleId, { from, to, limit, minSpeed, maxSpeed })` | Defaults last 24h. Limit clamped (default 5000, hard max 20000). Sort ascending by timestamp. Returns rows with `geom` converted to `{ lng, lat }` via `ST_AsGeoJSON`. |
| `getLatest` | `(vehicleId, count)` | clamp ≤ 500. |
| `getStats` | `(vehicleId, { from, to })` | Aggregation in SQL: `COUNT`, `AVG(speed)`, `MAX(speed)`, `ST_Length(ST_MakeLine(geom ORDER BY timestamp)::geography)` for total distance. |
| `getHeatmapPoints` | `(vehicleId, { from, to })` | See STEP 36. |

### History query SQL pattern

```sql
SELECT
  id,
  vehicle_id        AS "vehicleId",
  ST_X(geom)::float AS lng,
  ST_Y(geom)::float AS lat,
  speed::float,
  heading,
  altitude::float,
  accuracy::float,
  source,
  timestamp
FROM location
WHERE vehicle_id = $1
  AND timestamp BETWEEN $2 AND $3
  AND speed BETWEEN $4 AND $5
ORDER BY timestamp ASC
LIMIT $6;
```

Faster than `ST_AsGeoJSON` parse for bulk reads.

### Stats query

```sql
SELECT
  COUNT(*)::int                                                                  AS point_count,
  ROUND(AVG(speed)::numeric, 2)::float                                           AS avg_speed_kmh,
  ROUND(MAX(speed)::numeric, 2)::float                                           AS max_speed_kmh,
  COALESCE(
    ST_Length(ST_MakeLine(geom ORDER BY timestamp)::geography) / 1000,
    0
  )::float                                                                       AS distance_km
FROM location
WHERE vehicle_id = $1 AND timestamp BETWEEN $2 AND $3;
```

**SECURITY:**
- All queries parametrized (no SQL injection).
- Limit and date range bounded.
- Direct `ST_X`/`ST_Y` extraction faster and safer than text WKT parsing.

---

## STEP 22 — Location Controller & HTTP Fallback Ingestion

### `LocationsController`

| Method | Path | Auth | DTO | Notes |
|---|---|---|---|---|
| `getHistory` | `GET /api/vehicles/:id/history` | Jwt | `HistoryQueryDto` | UUID param + date range validation |
| `getLatest` | `GET /api/vehicles/:id/locations/latest` | Jwt | `LatestQueryDto` | clamp `count ≤ 500` |
| `getStats` | `GET /api/vehicles/:id/stats` | Jwt | `StatsQueryDto` | max range 90 days |
| `ingestHttpFallback` | `POST /api/vehicles/:id/locations` | **Header `X-Simulator-Key`** (NOT `JwtAuthGuard`; uses `@Public()` + custom `SimulatorKeyGuard`) | `LocationIngestDto` | For non-socket ingestion. Hands off to `LocationIngestionService` (STEP 28). |

### DTOs

**`HistoryQueryDto`:**

| Field | Validators |
|---|---|
| `from?` | `IsISO8601` |
| `to?` | `IsISO8601` |
| `limit?` | `IsInt @Min(1) @Max(20000) @Default(5000)` |
| `minSpeed?` | `IsNumber @Min(0) @Max(400)` |
| `maxSpeed?` | `IsNumber @Min(0) @Max(400)` |
| (custom) | `from <= to`; range ≤ 90 days |

**`LocationIngestDto`:**

| Field | Validators |
|---|---|
| `lng` | `IsNumber @Min(-180) @Max(180)` |
| `lat` | `IsNumber @Min(-90) @Max(90)` |
| `speed` | `IsNumber @Min(0) @Max(400)` |
| `heading?` | `IsInt @Min(0) @Max(359)` |
| `altitude?` | `IsNumber` |
| `accuracy?` | `IsNumber @Min(0)` |
| `timestamp?` | `IsISO8601` (defaults to server time) |

### `SimulatorKeyGuard`

A simple guard:

```ts
canActivate(context) {
  const req = context.switchToHttp().getRequest();
  const provided = req.headers['x-simulator-key'];
  const expected = this.config.get('SIMULATOR_API_KEY');
  if (!provided || !timingSafeEqual(Buffer.from(provided), Buffer.from(expected))) {
    throw new UnauthorizedException();
  }
  return true;
}
```

**SECURITY:**
- `timingSafeEqual` for key comparison (defeats timing attacks).
- Ingestion endpoint bypasses JWT (designed for devices) but requires API key.
- Coordinate ranges enforced at DTO level AND CHECK constraint level.
- UUID param validated via `ParseUUIDPipe`.

---

## STEP 23 — Cloudinary Provider, Multer Config & Upload Controller

### `config/cloudinary.ts`

Configure `cloudinary.v2` at module bootstrap from env. Export a `CloudinaryProvider`:

```ts
export const CloudinaryProvider = {
  provide: 'CLOUDINARY',
  useFactory: (cfg: ConfigService) => {
    cloudinary.config({
      cloud_name: cfg.get('CLOUDINARY_CLOUD_NAME'),
      api_key: cfg.get('CLOUDINARY_API_KEY'),
      api_secret: cfg.get('CLOUDINARY_API_SECRET'),
      secure: true,
    });
    return cloudinary;
  },
  inject: [ConfigService],
};
```

### Upload service (`uploads.service.ts`)

Single method:

```ts
async upload(buffer: Buffer, options: {
  folder: string;
  transformation?: object[];
}): Promise<{ url: string; publicId: string }> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (err, result) => {
      if (err) return reject(err);
      resolve({ url: result.secure_url, publicId: result.public_id });
    });
    Readable.from(buffer).pipe(stream);
  });
}
```

### Multer module config

```ts
MulterModule.register({
  storage: memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    cb(allowed.includes(file.mimetype) ? null : new BadRequestException('Unsupported file type'), allowed.includes(file.mimetype));
  },
});
```

### `UploadsController`

| Method | Path | Roles | Folder | Transformation |
|---|---|---|---|---|
| `uploadDriver` | `POST /api/uploads/driver` | `MANAGER, ADMIN` + `upload` throttler | `vtracker/drivers` | `[{ width: 400, height: 400, crop: 'fill', gravity: 'face' }]` |
| `uploadVehicle` | `POST /api/uploads/vehicle` | `MANAGER, ADMIN` + `upload` throttler | `vtracker/vehicles` | `[{ width: 800, crop: 'limit' }]` |
| `uploadAvatar` | `POST /api/uploads/avatar` | (any) + `upload` throttler | `vtracker/avatars` | `[{ width: 300, height: 300, crop: 'fill', gravity: 'face' }]` |
| `deleteAsset` | `DELETE /api/uploads/:publicId` | `MANAGER, ADMIN` | — | calls `cloudinary.uploader.destroy(publicId)` |

All uploads use `@UseInterceptors(FileInterceptor('image'))`.

**SECURITY:**
- Server-side MIME whitelist (never trust client extension).
- 5MB hard cap; `multer` enforces before reaching Cloudinary.
- `memoryStorage` — no disk path, no path traversal.
- Server-generated `publicId` (Cloudinary auto-assigns); client never controls filename.
- Per-route throttler limits abuse.

---

# PHASE 6 — Real-Time WebSocket Layer

## STEP 24 — WebSocket Adapter Bootstrap & RoomManager Service

### Why native ws

We use `@nestjs/platform-ws` (which uses the `ws` library under the hood) for predictable wire format and full control. Socket.io's namespace/room model is replaced by:
- **Two gateways at distinct paths** — `/ws/vehicles` and `/ws/dashboard`.
- **A custom `RoomManager` service** that tracks subscribers per room.

This is ~80 lines of code total and gives full control + zero external surface.

### `main.ts` adapter wiring

```ts
import { WsAdapter } from '@nestjs/platform-ws';
app.useWebSocketAdapter(new WsAdapter(app));
```

### `RoomManager` service (`modules/realtime/room-manager.service.ts`)

Singleton injectable, exposed via `RealtimeModule`. Internal state:

```ts
private rooms = new Map<string, Set<WebSocket>>();
private socketRooms = new WeakMap<WebSocket, Set<string>>();
```

### API

| Method | Behavior |
|---|---|
| `join(socket, room)` | adds socket to room's Set; tracks reverse mapping in `socketRooms` |
| `leave(socket, room)` | removes from room; removes from reverse mapping; deletes room if empty |
| `leaveAll(socket)` | called on `close` — iterates reverse mapping and cleans every room |
| `broadcast(room, payload)` | iterates the Set; sends `JSON.stringify(payload)`; removes dead sockets (`readyState !== OPEN`) |
| `broadcastToMany(rooms[], payload)` | dedupe across rooms via a temporary `Set<WebSocket>`; single send per socket |
| `count(room)` | for stats/debug |

### Send helper

```ts
private safeSend(socket: WebSocket, data: string) {
  try {
    if (socket.readyState === WebSocket.OPEN) socket.send(data);
  } catch (err) {
    // drop, schedule cleanup
  }
}
```

**SECURITY:**
- No external dependency for room logic (auditable surface).
- Reverse mapping (`socketRooms`) ensures `leaveAll` is O(rooms-joined) not O(all-rooms).
- Dead sockets eagerly cleaned to prevent slow memory leak.

---

## STEP 25 — Heartbeat & Dead-Socket Cleanup Helper

### Why heartbeats matter

WebSocket connections can silently die (mobile network drop, proxy timeout). Without ping/pong, the server keeps the socket in memory indefinitely.

### `HeartbeatService` (`modules/realtime/heartbeat.service.ts`)

A small service injected into both gateways. Schedules an interval (via `@nestjs/schedule` `@Interval(30_000)`) that for each tracked socket:

1. If socket's `isAlive` flag is `false` → close (terminate) and `roomManager.leaveAll`.
2. Otherwise, set `isAlive = false` and `socket.ping()`.

Sockets register a `pong` handler that sets `isAlive = true`.

### Per-gateway registration

Each gateway's `handleConnection` calls `heartbeatService.register(socket)`. Each gateway's `handleDisconnect` calls `heartbeatService.unregister(socket)`.

### Cleanup pattern

```ts
register(socket: WebSocket) {
  (socket as any).isAlive = true;
  socket.on('pong', () => { (socket as any).isAlive = true; });
  this.sockets.add(socket);
}
```

The interval handler:

```ts
@Interval(30_000)
heartbeat() {
  for (const s of this.sockets) {
    if (!(s as any).isAlive) {
      this.roomManager.leaveAll(s);
      this.sockets.delete(s);
      s.terminate();
      continue;
    }
    (s as any).isAlive = false;
    s.ping();
  }
}
```

**SECURITY:**
- Prevents ghost sockets accumulating memory.
- 30s interval is a balance between detection latency and bandwidth.
- `terminate()` (not `close()`) for dead sockets — no graceful handshake on dead connection.

---

## STEP 26 — VehiclesGateway (Simulator Key Auth + Rate Limit)

### `VehiclesGateway` (`modules/realtime/vehicles.gateway.ts`)

```ts
@WebSocketGateway({ path: '/ws/vehicles' })
export class VehiclesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly rateCounters = new WeakMap<WebSocket, { count: number; resetAt: number }>();
  ...
}
```

### `handleConnection(socket, req)`

1. Extract `x-simulator-key` from `req.headers`.
2. Constant-time compare against `SIMULATOR_API_KEY`.
3. On mismatch: `socket.close(4001, 'Unauthorized')` and return.
4. Attach `socket.deviceId = req.headers['x-device-id'] || 'unknown'`.
5. `heartbeatService.register(socket)`.

### `handleDisconnect(socket)`

1. `heartbeatService.unregister(socket)`.
2. `roomManager.leaveAll(socket)`.
3. `rateCounters.delete(socket)`.

### `@SubscribeMessage('location_update')`

Validates incoming payload via class-validator (`LocationUpdatePayloadDto`); on failure, ignores or sends back error frame. Routes to `LocationIngestionService.handle(payload, { source: 'device-or-simulator' })` (see STEP 28).

### Per-socket rate limit (sliding 1-second window)

```ts
private allowEvent(socket: WebSocket): boolean {
  const now = Date.now();
  let entry = this.rateCounters.get(socket);
  if (!entry || entry.resetAt < now) {
    entry = { count: 0, resetAt: now + 1000 };
    this.rateCounters.set(socket, entry);
  }
  if (entry.count >= 5) return false; // 5 events/sec/socket
  entry.count++;
  return true;
}
```

Apply at top of `location_update` handler. Drop excess + warn log.

**SECURITY:**
- `timingSafeEqual` defeats timing attacks on the API key.
- 5/sec rate limit prevents abusive clients flooding ingestion.
- Path-based segregation: leaking the simulator key does NOT grant dashboard access.
- DeviceId attached for traceability (non-PII).

---

## STEP 27 — DashboardGateway (JWT Auth + Subscribe / Unsubscribe + Role Rooms)

### `DashboardGateway` (`modules/realtime/dashboard.gateway.ts`)

```ts
@WebSocketGateway({ path: '/ws/dashboard' })
export class DashboardGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  ...
}
```

### `handleConnection(socket, req)`

1. Extract JWT from `Sec-WebSocket-Protocol` header (subprotocol). Reasoning: query-string tokens end up in proxy access logs; subprotocol does not.
2. Verify via `JwtService.verifyAsync(token, { secret: env.JWT_ACCESS_SECRET })`.
3. Load `socket.user = { id, role, email }` from payload.
4. Validate `Origin` header against `env.CLIENT_URL`. Close `4003` on mismatch.
5. `roomManager.join(socket, 'role:' + socket.user.role)`.
6. `heartbeatService.register(socket)`.
7. On failure at any step: `socket.close(4001, 'Unauthorized')`.

### Client-side subprotocol

The client opens the WebSocket as:

```ts
new WebSocket(wsUrl, [accessToken]);
```

The protocol slot carries the access token. Server reads `req.headers['sec-websocket-protocol']`.

### Messages handled

| Event | Payload | Behavior |
|---|---|---|
| `subscribe` | `{ vehicleId: UUID }` | UUID validated; `roomManager.join(socket, 'vehicle:' + vehicleId)` |
| `unsubscribe` | `{ vehicleId: UUID }` | `roomManager.leave(socket, 'vehicle:' + vehicleId)` |

### `handleDisconnect`

Same cleanup as `VehiclesGateway`: heartbeat unregister + `roomManager.leaveAll`.

### Broadcast targets

Other services use `roomManager.broadcastToMany([...rooms], payload)`. Common patterns:

| Event type | Rooms |
|---|---|
| `vehicle:update` | `'vehicle:' + id`, `'role:viewer'`, `'role:manager'`, `'role:admin'` |
| `vehicle:status` | same |
| `alert:new` | `'vehicle:' + id`, `'role:manager'`, `'role:admin'` |
| `geofence:event` | same |

**SECURITY:**
- JWT verified at handshake; reject on any failure.
- Origin validated to prevent cross-site WebSocket hijacking.
- Subprotocol token transport (out of access logs).
- Subscriptions explicit (no firehose leak — viewers see role-room updates but not specific vehicle deep data unless subscribed).

---

## STEP 28 — Location Ingestion Pipeline (Persist → Update lastLocation → Status → Broadcast)

### `LocationIngestionService` (`modules/realtime/location-ingestion.service.ts`)

Single entry point used by:
- `VehiclesGateway.location_update` handler.
- `LocationsController.ingestHttpFallback`.

### Flow

```
1. Validate payload (already done by DTO at edges).
2. Resolve vehicleId:
   - If UUID: use as-is, verify exists via cache.
   - If plate: look up in plateCache (Map<plate,id>).
3. Build new Location row (via parametrized ST_SetSRID(ST_MakePoint(...)) insert).
4. Compute status from speed + prior lastLocation:
   - speed >= 5 → 'moving'
   - else if last update within IDLE_THRESHOLD_MIN → 'idle'
   - else → 'offline'
5. Update Vehicle.lastLocation = { lng, lat, speed, heading, timestamp, status }
   via single atomic UPDATE.
6. Fetch prevLocation (Vehicle.lastLocation before update).
7. Call alertEngine.run(vehicle, prevLocation, newLocation) — emits alerts.
8. Call tripAggregator.tick(vehicle, newLocation) — opens/extends/closes trips.
9. Build broadcast payload (minimal — clients hold static data).
10. roomManager.broadcastToMany(
      ['vehicle:' + vehicleId, 'role:viewer', 'role:manager', 'role:admin'],
      payload
    );
```

### Plate→UUID cache

In-memory `Map<plate, vehicleId>`. Hydrated lazily on first lookup. Invalidated via `@OnEvent('vehicle.created'|'vehicle.updated'|'vehicle.deleted')` (NestJS `EventEmitter` module).

### Broadcast payload

```
{
  type: 'vehicle:update',
  vehicleId,
  plate,
  coordinates: [lng, lat],
  speed,
  heading,
  timestamp,
  status,
}
```

Minimal by design — viewers receive lightweight updates without re-fetching vehicle metadata.

### Backpressure (optional optimization, documented)

Per-vehicle debounce broadcast to max 5/sec via `Map<vehicleId, lastEmittedAt>`. **DB write always happens**; only the dashboard broadcast is throttled. Not enabled by default; document for high-fleet scenarios.

**SECURITY:**
- Single ingestion path = single security checkpoint.
- Plate lookup prevents devices from inferring database UUIDs (they can use friendlier IDs).
- Atomic `UPDATE` (no read-modify-write race).
- Broadcasts only to explicitly joined or role-specific rooms.

---

# PHASE 7 — Geofences

## STEP 29 — Geofence Entity, Migrations, Geo Indexes & DTOs

### `Geofence` entity (`modules/geofences/geofence.entity.ts`)

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK |
| `name` | `varchar(80)` | not null, 2–80 chars |
| `description` | `varchar(300)` | nullable |
| `shape` | enum | `polygon`, `circle` |
| `geometry` | `geometry(Polygon, 4326)` | nullable (set when shape=polygon) |
| `circleCenter` | `geometry(Point, 4326)` | nullable (set when shape=circle) |
| `radiusMeters` | `integer` | nullable, check 10–100000 |
| `direction` | enum | `enter`, `exit`, `both` |
| `appliesTo` | enum | `all`, `specific` |
| `vehicleIds` | `uuid[]` | default `'{}'`; required (non-empty) when `appliesTo = specific` (enforced in service) |
| `isActive` | `boolean` | default `true` |
| `color` | `varchar(9)` | hex like `#3b82f6` |
| `createdById` | `uuid` | FK → users.id `ON DELETE SET NULL` |
| `createdAt`/`updatedAt` | `timestamptz` | |

### Indexes (migration `0005-create-geofence.ts`)

```sql
CREATE INDEX geofence_geometry_gist_idx ON geofence USING GIST (geometry);
CREATE INDEX geofence_center_gist_idx ON geofence USING GIST (circle_center);
CREATE INDEX geofence_active_applies_idx ON geofence (is_active, applies_to);
CREATE INDEX geofence_created_by_idx ON geofence (created_by_id);
```

### DTOs

**`PolygonGeometryDto`:**

| Field | Validators |
|---|---|
| `type` | `Equals('Polygon')` |
| `coordinates` | `IsArray @ArrayMinSize(1)` (one ring) — each ring is `[lng, lat][]` with first == last; vertex count ≤256 enforced in service |

**`CreateGeofenceDto`:**

| Field | Validators |
|---|---|
| `name` | `IsString @Length(2, 80)` |
| `description?` | `IsString @MaxLength(300)` |
| `shape` | `IsEnum(['polygon','circle'])` |
| `geometry?` | `ValidateNested` (when polygon) |
| `circleCenter?` | nested `{ lng, lat }` (when circle) |
| `radiusMeters?` | `IsInt @Min(10) @Max(100000)` (when circle) |
| `direction` | `IsEnum(['enter','exit','both'])` |
| `appliesTo` | `IsEnum(['all','specific'])` |
| `vehicleIds?` | `IsUUID @each` (required non-empty if specific) |
| `color?` | `Matches(/^#[0-9A-Fa-f]{6}$/)` |

**SECURITY:**
- Vertex count (≤256) and radius (≤100km) clamped — bounded geo compute.
- `createdById` server-set.
- `vehicleIds` UUID-validated array.
- Color regex prevents free-form CSS injection.

---

## STEP 30 — Geofence Service, Controller, Test Endpoint & PostGIS Containing Query

### `GeofencesService` methods

| Method | Notes |
|---|---|
| `create(dto, user)` | Validates polygon/circle conditional fields; server-set `createdById`; inserts via parametrized `ST_GeomFromGeoJSON` for polygon or `ST_SetSRID(ST_MakePoint, 4326)` for circle. |
| `findAll(query)` | Filters: `isActive`, `shape`, `q` (name ILIKE with escape). |
| `findOne(id)` | |
| `update(id, dto, user)` | Ownership check (admin OR `createdById`). |
| `remove(id, user)` | Same ownership. |
| `test(id, point)` | Returns `{ inside: bool }` via DB query. |
| `findContaining(vehicleId, point)` | Returns all active geofences that include the point AND apply to the vehicle. Used by `AlertEngine`. |

### `findContaining` SQL

```sql
SELECT g.*
FROM geofence g
WHERE g.is_active = true
  AND (g.applies_to = 'all' OR $1 = ANY(g.vehicle_ids))
  AND (
    (g.shape = 'polygon' AND ST_Contains(g.geometry, ST_SetSRID(ST_MakePoint($2, $3), 4326)))
    OR
    (g.shape = 'circle' AND ST_DWithin(g.circle_center::geography,
                                       ST_SetSRID(ST_MakePoint($2, $3), 4326)::geography,
                                       g.radius_meters))
  );
```

### `GeofencesController`

| Method | Path | Roles |
|---|---|---|
| `create` | `POST /api/geofences` | `MANAGER, ADMIN` |
| `findAll` | `GET /api/geofences` | any |
| `findOne` | `GET /api/geofences/:id` | any |
| `update` | `PATCH /api/geofences/:id` | `MANAGER, ADMIN` |
| `remove` | `DELETE /api/geofences/:id` | `MANAGER, ADMIN` |
| `test` | `POST /api/geofences/:id/test` | any (body `{ lng, lat }`) |

**SECURITY:**
- All geo operations DB-side via parametrized PostGIS functions.
- GIST indexes used by query planner.
- Vertex/radius clamps enforced.
- Ownership enforced.

---

# PHASE 8 — Alerts & Trips

## STEP 31 — Alert Entity, Controller, DTOs & Acknowledge Endpoints

### `Alert` entity (`modules/alerts/alert.entity.ts`)

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `vehicleId` | uuid | FK → vehicles.id `ON DELETE CASCADE` |
| `type` | enum | `speed`, `idle`, `geofence_enter`, `geofence_exit` |
| `severity` | enum | `info`, `warning`, `critical`, default `warning` |
| `message` | text | not null |
| `geom` | `geometry(Point, 4326)` | not null (where it happened) |
| `speed` | `numeric(5,2)` | nullable |
| `geofenceId` | uuid | nullable, FK → geofences.id `ON DELETE SET NULL` |
| `acknowledged` | boolean | default `false` |
| `acknowledgedById` | uuid | nullable, FK → users.id |
| `acknowledgedAt` | timestamptz | nullable |
| `createdAt` | timestamptz | default `now()` |

### Indexes

```sql
CREATE INDEX alert_vehicle_created_idx ON alert (vehicle_id, created_at DESC);
CREATE INDEX alert_ack_created_idx ON alert (acknowledged, created_at DESC);
CREATE INDEX alert_type_idx ON alert (type);
```

### DTOs

**`AlertQueryDto`:**

| Field | Validators |
|---|---|
| `vehicleId?` | `IsUUID` |
| `type?` | `IsEnum` |
| `severity?` | `IsEnum` |
| `acknowledged?` | `IsBoolean` |
| `from?`/`to?` | `IsISO8601` |
| `page?`/`limit?` | int with bounds |

**`AckManyDto`:** `ids: UUID[]` (max 100).

### `AlertsController`

| Method | Path | Roles |
|---|---|---|
| `findAll` | `GET /api/alerts` | any |
| `acknowledge` | `POST /api/alerts/:id/ack` | `MANAGER, ADMIN` |
| `acknowledgeMany` | `POST /api/alerts/ack-many` | `MANAGER, ADMIN` |
| `remove` | `DELETE /api/alerts/:id` | `ADMIN` |
| `stats` | `GET /api/alerts/stats` | any |

### Acknowledge logic

```sql
UPDATE alert
SET acknowledged = true,
    acknowledged_by_id = $1,
    acknowledged_at = now()
WHERE id = $2 AND acknowledged = false
RETURNING *;
```

(Idempotent — second ack call returns no row, no error.)

**SECURITY:**
- Audit fields populated on ack.
- Delete admin-only.
- Bulk ack max 100 IDs.
- Pagination clamped.

---

## STEP 32 — AlertEngine Service (Speed / Idle / Geofence Detection + Debounce)

### `AlertEngineService.run(vehicle, prev, next)`

Single entry point called inside `LocationIngestionService` (STEP 28). Returns an array of created alerts (or empty).

### Speed alert logic

1. Compute `limit = vehicle.speedLimitKmh ?? env.SPEED_LIMIT_KMH`.
2. If `next.speed <= limit` → return.
3. Query last `speed` alert for this vehicle within last 60 seconds. If exists → debounce, return.
4. Severity: `'warning'` by default; `'critical'` if `next.speed - limit >= 30`.
5. Persist alert; broadcast.

### Geofence alert logic

1. `prevContaining = await findContaining(vehicleId, prev.coords)` (empty array if no prev location).
2. `nextContaining = await findContaining(vehicleId, next.coords)`.
3. Set diffs:
   - `entered = nextContaining filter (g => !prevContaining.includes(g))`
   - `exited  = prevContaining filter (g => !nextContaining.includes(g))`
4. For each `entered` with direction in (`enter`, `both`) → create `geofence_enter` alert.
5. For each `exited` with direction in (`exit`, `both`) → create `geofence_exit` alert.

### Idle alert logic

Handled by `StatusSweeper` (STEP 33) — not in `run()`. When sweeper detects a vehicle has been idle for ≥ `IDLE_THRESHOLD_MIN` continuously since last `moving`, it creates a one-shot `idle` alert. Reset on next `moving` transition (in-memory `Set<vehicleId>` of "already alerted in current idle session").

### Broadcast helper

After persisting, for each alert call:

```ts
roomManager.broadcastToMany(
  [`vehicle:${vehicleId}`, 'role:manager', 'role:admin'],
  { type: 'alert:new', alert }
);
```

**SECURITY:**
- Speed debounce blocks spam DoS.
- Geofence scope respected per `appliesTo`.
- Engine is the only writer of Alert rows from real-time flow (single audit point).

---

## STEP 33 — Status Sweeper Cron Job (Offline Transition + Idle Trigger)

### `StatusSweeperService`

Uses `@nestjs/schedule`'s `@Cron('*/60 * * * * *')` — every 60 seconds.

### Logic

```
For each vehicle where lastLocation IS NOT NULL:
  age = now() - lastLocation.timestamp
  
  if age > 2 × IDLE_THRESHOLD_MIN AND lastLocation.status !== 'offline':
    UPDATE vehicle SET last_location = jsonb_set(last_location, '{status}', '"offline"')
    broadcastToMany([vehicle:id, role:viewer, role:manager, role:admin], 
                    { type: 'vehicle:status', vehicleId, status: 'offline' })
  
  if lastLocation.status === 'idle' AND age >= IDLE_THRESHOLD_MIN
     AND vehicleId NOT IN idleAlertedSet:
    alertEngineService.createIdleAlert(vehicle)
    idleAlertedSet.add(vehicleId)
  
  if lastLocation.status === 'moving':
    idleAlertedSet.delete(vehicleId)  // reset for next idle session
```

### In-memory state

`idleAlertedSet: Set<string>` — tracks which vehicles already have an open idle alert in the current idle session. Reset on `moving` transition.

> **Multi-instance note (documented):** When deployed to multiple Railway instances, the sweeper should run on **only one** instance to avoid duplicate broadcasts. Options: (a) leader election via Postgres advisory lock, (b) single-instance worker via Railway config. For demo scale, single instance is fine; document the constraint.

**SECURITY:**
- Idempotent (status check before update).
- One-shot idle alert prevents alert spam during long idle sessions.
- Cron is observable in logs; tunable interval via env if needed.

---

## STEP 34 — Trip Entity, Controller & TripAggregator Service

### `Trip` entity

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `vehicleId` | uuid | FK → vehicles `ON DELETE CASCADE` |
| `startedAt` | timestamptz | not null, indexed desc |
| `endedAt` | timestamptz | nullable |
| `startGeom` | `geometry(Point, 4326)` | |
| `endGeom` | `geometry(Point, 4326)` | nullable |
| `distanceKm` | `numeric(8,2)` | nullable, computed on close |
| `avgSpeedKmh` | `numeric(5,2)` | nullable |
| `maxSpeedKmh` | `numeric(5,2)` | nullable |
| `speedViolations` | int | default 0 |
| `idleEvents` | int | default 0 |
| `geofenceEvents` | int | default 0 |
| `pointCount` | int | default 0 |
| `status` | enum | `open`, `closed` |
| `createdAt` | timestamptz | |

Index: `(vehicle_id, started_at DESC)`.

### `TripAggregatorService` methods

| Method | Behavior |
|---|---|
| `tick(vehicle, newLocation)` | Called in ingestion pipeline. If vehicle is `moving` and no open trip → create one. If vehicle has open trip → increment pointCount, update maxSpeed. |
| `tryCloseIdleTrips()` | Cron `@Cron('*/60 * * * * *')`. Finds open trips whose vehicle has been idle ≥ `TRIP_END_MIN`. Closes them: computes distance/avg/violations via DB aggregation; sets `endedAt`, `endGeom`, `status = 'closed'`. |

### Close-trip aggregation SQL

```sql
WITH closing AS (
  SELECT t.id,
         (SELECT MAX(timestamp) FROM location WHERE vehicle_id = t.vehicle_id AND timestamp > t.started_at)        AS ended_at,
         (SELECT ST_Length(ST_MakeLine(geom ORDER BY timestamp)::geography) / 1000
          FROM location WHERE vehicle_id = t.vehicle_id AND timestamp BETWEEN t.started_at AND now())             AS distance_km,
         (SELECT ROUND(AVG(speed)::numeric, 2)
          FROM location WHERE vehicle_id = t.vehicle_id AND timestamp BETWEEN t.started_at AND now())             AS avg_speed,
         (SELECT COUNT(*) FROM alert WHERE vehicle_id = t.vehicle_id AND type='speed'    AND created_at BETWEEN t.started_at AND now())  AS sv,
         (SELECT COUNT(*) FROM alert WHERE vehicle_id = t.vehicle_id AND type='idle'     AND created_at BETWEEN t.started_at AND now())  AS ie,
         (SELECT COUNT(*) FROM alert WHERE vehicle_id = t.vehicle_id AND type LIKE 'geofence_%' AND created_at BETWEEN t.started_at AND now()) AS ge
  FROM trip t
  WHERE t.id = $1
)
UPDATE trip SET ... -- populate from CTE
```

### `TripsController`

| Method | Path | Roles |
|---|---|---|
| `findAll` | `GET /api/trips` | any |
| `findOne` | `GET /api/trips/:id` | any |
| `dailySummary` | `GET /api/trips/summary` | any |
| `exportCsv` | `GET /api/trips/export` | any + `export` throttler |

**SECURITY:**
- Trip close is idempotent (check status first).
- Aggregation in single SQL — no race-prone fetch-then-write.
- Export rate-limited.

---

# PHASE 9 — Exports, Heatmap & Simulator

## STEP 35 — ExportService (CSV / GeoJSON / Formula Injection Guard) & Export Endpoints

### `ExportService` (`common/utils/export.service.ts`)

| Method | Returns |
|---|---|
| `locationsToCsv(rows)` | string — header + rows, escaped |
| `locationsToGeoJson(rows, vehicle)` | object — FeatureCollection |
| `tripsToCsv(trips)` | string |

### CSV escaping rules

For each cell:
1. If contains `,`, `"`, `\n`, or `\r` → wrap in double quotes, escape inner `"` as `""`.
2. **Formula injection guard:** if first char is `=`, `+`, `-`, `@`, prefix with `'` (single quote). This neutralizes Excel/Sheets formula execution when users open downloaded CSVs.

### GeoJSON shape

```
{
  type: 'FeatureCollection',
  features: [
    { type: 'Feature', geometry: { type: 'LineString', coordinates: [[lng,lat],...] },
      properties: { vehicleId, plate, from, to } },
    ...point features per location with properties { speed, heading, timestamp }
  ]
}
```

### Endpoints on `VehiclesController`

| Method | Path | DTO |
|---|---|---|
| `exportRoute` | `GET /api/vehicles/:id/export?format=csv\|geojson&from=&to=` | `RouteExportQueryDto` |

`RouteExportQueryDto`:

| Field | Validators |
|---|---|
| `format` | `IsEnum(['csv','geojson'])` |
| `from`/`to` | `IsISO8601` |
| (custom) | range ≤ 90 days |

Controller sets `Content-Type: text/csv` or `application/geo+json`, and `Content-Disposition: attachment; filename="vehicle-{plate}-{from}-{to}.{ext}"`.

**SECURITY:**
- Formula injection neutralized.
- Date range max 90 days.
- `export` throttler limits abuse.
- Filename sanitized server-side (plate already constrained to A-Z 0-9 - ).

---

## STEP 36 — Heatmap Endpoint with Server-Side Downsampling

### `VehiclesController.heatmap`

| Method | Path | DTO |
|---|---|---|
| `heatmap` | `GET /api/vehicles/:id/heatmap?from=&to=` | `HeatmapQueryDto` |

`HeatmapQueryDto`: same as `RouteExportQueryDto` minus `format`; **max range 30 days** (heatmap on long ranges easily OOMs the client).

### Downsampling query

If raw count > 20 000, aggregate by rounding coordinates to 4 decimal places (~11m grid):

```sql
SELECT
  ROUND(ST_X(geom)::numeric, 4)::float AS lng,
  ROUND(ST_Y(geom)::numeric, 4)::float AS lat,
  COUNT(*)::int                         AS intensity
FROM location
WHERE vehicle_id = $1 AND timestamp BETWEEN $2 AND $3
GROUP BY 1, 2
ORDER BY intensity DESC
LIMIT 50000;
```

If raw count ≤ 20 000, return points directly without aggregation (more granular heatmap).

### Response shape

```json
{
  "success": true,
  "data": {
    "points": [[lng, lat, intensity], ...],
    "total": 12345,
    "downsampled": true
  }
}
```

Suitable for `MapLibre` heatmap layer source.

**SECURITY:**
- Server-side downsampling prevents OOM on long ranges.
- 30-day cap.
- Hard limit 50 000 points returned.

---

## STEP 37 — GPS Simulator Script (Multi-Vehicle, Bbox, Speed Spikes)

### `scripts/gps-simulator.ts`

Standalone Node + native `WebSocket` (using `ws` package) that connects to `ws://localhost:5000/ws/vehicles` and emulates a fleet.

### Behavior

1. Load env. Parse CLI args (`--vehicles=N --tick=MS --speedSpikeChance=P --bbox="lngMin,latMin,lngMax,latMax"`).
2. Ensure target vehicles exist via REST (`GET /api/vehicles?limit=50` with `X-Simulator-Key` header). Plates `SIM-001`, `SIM-002`, ... created if missing.
3. For each fake vehicle: pick a random starting point inside `bbox`.
4. Every `tick` ms:
   - Apply random delta: `lat += (random()-0.5) * 0.0005`, `lng += (random()-0.5) * 0.0005`.
   - Compute `heading` from delta vector via `Math.atan2`.
   - Compute `speed`: base 30–60 km/h + random noise; with probability `speedSpikeChance`, spike to 100–130 km/h (triggers speed alerts for demo).
   - Send via single ws: `{ type: 'location_update', payload: { vehicleId, lng, lat, speed, heading, timestamp: new Date().toISOString() } }`.
5. Graceful SIGINT: close socket, exit.

### Connection auth

Open with header:

```ts
const ws = new WebSocket(env.SOCKET_URL + '/ws/vehicles', {
  headers: { 'X-Simulator-Key': env.SIMULATOR_API_KEY, 'X-Device-Id': 'simulator-' + process.pid },
});
```

### README documentation

Document the exact command (`npm run simulate`) and CLI flag examples.

**SECURITY:**
- Same auth path as production devices.
- Speed spikes bounded.
- Auth via header, never via query string.

---

# PHASE 10 — Admin & Security Audit

## STEP 38 — Admin Module: Dashboard Stats Endpoint

### `AdminController.getStats`

| Method | Path | Roles | Throttler |
|---|---|---|---|
| `getStats` | `GET /api/admin/stats` | `ADMIN` | `admin` |

### Aggregations (single query if possible, otherwise parallel)

```
users: { total, byRole: { admin, manager, viewer }, activatedLast30Days, registeredLast30Days }
vehicles: { total, active, inactive, byType: { car, truck, ... }, byStatus: { moving, idle, offline } }
alerts: {
  today: count,
  thisWeek: count,
  byType: { speed, idle, geofence_enter, geofence_exit },
  unacknowledged: count
}
trips: { today, thisWeek, totalDistanceTodayKm, totalDistanceWeekKm }
topViolators: Vehicle[] sorted by alerts count today (top 5)
```

Each aggregation parametrized; results combined into single response.

### SQL examples

```sql
-- vehicles by status (from denormalized last_location.status)
SELECT
  COUNT(*) FILTER (WHERE last_location->>'status' = 'moving')  AS moving,
  COUNT(*) FILTER (WHERE last_location->>'status' = 'idle')    AS idle,
  COUNT(*) FILTER (WHERE last_location->>'status' = 'offline') AS offline,
  COUNT(*) FILTER (WHERE last_location IS NULL)                AS unknown
FROM vehicle
WHERE is_active = true;
```

**SECURITY:**
- Admin-only.
- Heavy queries throttled via `admin` limiter.
- Single endpoint avoids client-side aggregation (predictable load).

---

## STEP 39 — Admin Module: User Management & Fleet Overview

### `AdminController` methods (continued)

| Method | Path | Notes |
|---|---|---|
| `findUsers` | `GET /api/admin/users` | DTO: `q`, `role`, `isActive`, `page`, `limit`. Search escaped. |
| `findUserById` | `GET /api/admin/users/:id` | |
| `setUserRole` | `PATCH /api/admin/users/:id/role` | Body `{ role }`. **Self-protection + last-admin protection** (see below). |
| `setUserActive` | `PATCH /api/admin/users/:id/status` | Body `{ isActive }`. Cannot deactivate self. |
| `removeUser` | `DELETE /api/admin/users/:id` | Cannot delete self. Last-admin protection. FK `ON DELETE SET NULL` on Vehicle.createdBy. |
| `fleetOverview` | `GET /api/admin/fleet` | All vehicles + status + last update + alert count last 24h |

### Self-protection logic

Inside every mutating method:

```ts
if (targetId === currentUser.id) {
  throw new BadRequestException('Cannot perform this operation on your own account');
}
```

### Last-admin protection (transactional)

```ts
await this.dataSource.transaction(async (trx) => {
  const target = await trx.findOne(User, { where: { id: targetId } });
  if (target.role === UserRole.ADMIN && (newRole !== UserRole.ADMIN || delete)) {
    const adminCount = await trx.count(User, { where: { role: UserRole.ADMIN, isActive: true } });
    if (adminCount <= 1) {
      throw new BadRequestException('System must retain at least one admin');
    }
  }
  // proceed with change
});
```

### `fleetOverview` query

Single query joins `vehicle` + a lateral subquery counting alerts in the last 24h. Returns paginated list with status, last update, alert count.

**SECURITY:**
- Self-protection enforced everywhere (role / active / delete).
- Last-admin protection inside transaction.
- `admin` throttler.
- All inputs validated.

---

## STEP 40 — Backend Security Audit & Final Hardening Checklist

### Comprehensive checklist (run before any PR / deploy)

- [ ] Mass assignment: every DTO uses `whitelist + forbidNonWhitelisted` (global pipe).
- [ ] No controller accepts `any` or raw body.
- [ ] Role protection: `role` not in `RegisterDto` or `UpdateMeDto`; admin endpoints are sole path.
- [ ] User enumeration prevented: identical error for missing email / wrong password / inactive account.
- [ ] Password: bcrypt rounds 12, `select: false`, never returned in any response.
- [ ] Password change requires current password.
- [ ] Access JWT and refresh JWT have **different** secrets, both ≥32 chars in production.
- [ ] Refresh token httpOnly + secure + sameSite cookie, path scoped to `/api/auth`.
- [ ] Refresh rotation + reuse detection implemented.
- [ ] Rate limiters: separate throttlers for default, auth, admin, upload, export.
- [ ] Helmet enabled.
- [ ] CORS strict origin (`env.CLIENT_URL`) + `credentials: true`.
- [ ] Body size 10kb cap.
- [ ] All TypeORM queries parametrized (no string concat).
- [ ] React JSX (frontend) escapes everything; no `dangerouslySetInnerHTML`.
- [ ] Search inputs regex-escaped before ILIKE.
- [ ] Ownership checks: update/delete verify `createdById` OR `assignedManagers` OR admin.
- [ ] Pagination clamp: 50 (lists), 5000 (history default), 20000 (history hard max).
- [ ] File upload: MIME whitelist, 5MB cap, server-generated publicId, `memoryStorage`.
- [ ] Admin self-protection (role/active/delete).
- [ ] Last-admin protection inside transaction.
- [ ] Cascade: FK `ON DELETE CASCADE` on Location/Trip/Alert from Vehicle; `ON DELETE SET NULL` for Vehicle.createdBy.
- [ ] Error handler hides stack traces in production.
- [ ] `x-powered-by` disabled.
- [ ] `.env.example` synced.
- [ ] WebSocket `/ws/vehicles` requires `X-Simulator-Key` (timingSafeEqual).
- [ ] WebSocket `/ws/dashboard` requires valid JWT via Sec-WebSocket-Protocol.
- [ ] Per-socket event rate limit on `/ws/vehicles` (5/sec).
- [ ] WebSocket Origin validated on handshake.
- [ ] Heartbeat ping/pong active.
- [ ] Geofence vertex count ≤256 and circle radius ≤100km.
- [ ] Nearby query distance ≤100km.
- [ ] CSV export escapes formula injection.
- [ ] Date ranges validated and bounded (90d export, 30d heatmap).
- [ ] UUID path params validated via `ParseUUIDPipe`.
- [ ] Coordinate range checks server-side and via CHECK constraints.
- [ ] CHECK constraints on `speed`, `heading`, `source` enum, `radius_meters`.
- [ ] No `console.log` with secrets; Pino redaction enforced.
- [ ] Sentry `beforeSend` redacts Authorization, cookie, password.

---

# PHASE 11 — Frontend Foundation: Tooling

## STEP 41 — TanStack Start Initialization, Vite Config & Client Folder Structure

### Initialize

Inside `client/`:

```
npm create @tanstack/start@latest .
```

Pick: TypeScript, file-based routing, Tailwind plugin **off** (we'll add manually for v4 control).

### Folder structure (`client/`)

```
client/
├── src/
│   ├── routes/                    ← file-based routing
│   │   ├── __root.tsx
│   │   ├── index.tsx              ← /dashboard
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   ├── vehicles/
│   │   │   ├── index.tsx          ← list
│   │   │   ├── new.tsx
│   │   │   ├── $id.tsx            ← detail
│   │   │   └── $id.edit.tsx
│   │   ├── geofences.tsx
│   │   ├── alerts.tsx
│   │   ├── reports.tsx
│   │   ├── profile.$id.tsx
│   │   ├── settings/
│   │   │   ├── profile.tsx
│   │   │   ├── account.tsx
│   │   │   ├── appearance.tsx
│   │   │   └── notifications.tsx
│   │   └── admin/
│   │       ├── index.tsx
│   │       ├── users.tsx
│   │       └── fleet.tsx
│   ├── components/
│   │   ├── ui/                    ← shadcn-style primitives
│   │   ├── layout/                ← MainLayout, AdminLayout, SettingsLayout, Navbar, Footer
│   │   ├── map/                   ← LiveMap, VehicleMarker, RouteLine, GeofenceLayer, GeofenceEditor, HeatmapLayer
│   │   ├── vehicles/              ← VehicleCard, VehicleForm, VehicleFilters, HistoryPlayer
│   │   ├── alerts/                ← AlertItem, AlertsFilterBar
│   │   ├── common/                ← StatusBadge, RoleBadge, EmptyState, CharacterCounter, Spinner
│   │   └── guards/                ← (route beforeLoad hooks; barely any components here)
│   ├── api/
│   ├── stores/
│   ├── context/
│   ├── hooks/
│   ├── utils/
│   ├── lib/
│   ├── styles/
│   ├── env.ts
│   ├── router.tsx
│   ├── main.tsx
│   └── instrumentation.ts          ← Sentry init
├── public/
├── biome.json                      ← inherits root
├── vite.config.ts
├── tsconfig.json
├── playwright.config.ts            ← STEP 77
├── vitest.config.ts                ← STEP 76
├── package.json
└── .env.example
```

### `vite.config.ts`

Plugins (order matters): `tanstackRouter()` first, `react()`, `tailwindcss()`, optionally `sentryVitePlugin()`.

### Dependencies — production

`react@^19`, `react-dom@^19`, `@tanstack/react-router@^1`, `@tanstack/router-vite-plugin@^1`, `@tanstack/start@^1`, `@tanstack/react-query@^5`, `@tanstack/react-form@^0.40`, `zustand@^5`, `maplibre-gl@^4`, `@maplibre/maplibre-gl-draw@^1`, `sonner@^1`, `date-fns@^3`, `clsx@^2`, `tailwind-merge@^2`, `lucide-react@^0.400`, `@radix-ui/react-dialog@^1`, `@radix-ui/react-dropdown-menu@^2`, `@radix-ui/react-switch@^1`, `@radix-ui/react-tabs@^1`, `@radix-ui/react-tooltip@^1`, `@radix-ui/react-slider@^1`, `@radix-ui/react-avatar@^1`, `@sentry/react@^8`.

### Dependencies — dev

`vite@^7`, `@vitejs/plugin-react@^5`, `tailwindcss@^4`, `@tailwindcss/vite@^4`, `typescript@^5`, `@types/react`, `@types/react-dom`, `@biomejs/biome@^1.9`, `vitest@^2`, `@testing-library/react@^16`, `@testing-library/jest-dom@^6`, `@testing-library/user-event@^14`, `jsdom@^25`, `@playwright/test@^1`, `@sentry/vite-plugin@^2`.

### `.env.example`

```
VITE_API_URL=http://localhost:5000/api
VITE_WS_URL=ws://localhost:5000
VITE_MAP_STYLE_URL=https://tiles.openfreemap.org/styles/liberty
VITE_SENTRY_DSN=
```

**SECURITY:**
- All `VITE_*` envs are public by design (bundled into client). No secrets here.
- Sentry DSN is public-safe.

---

## STEP 42 — Biome Client Configuration & NPM Scripts

### `client/biome.json`

Inherits root. Adds React-specific rules:

| Setting | Value |
|---|---|
| `linter.rules.a11y.recommended` | `error` (group) |
| `linter.rules.style.useImportType` | `error` |
| `linter.rules.correctness.useExhaustiveDependencies` | `error` |
| `linter.rules.suspicious.noArrayIndexKey` | `error` |
| `javascript.parser.jsxEverywhere` | `true` |

### npm scripts (`client/package.json`)

| Script | Command |
|---|---|
| `dev` | `vite` |
| `build` | `tsc --noEmit && vite build` |
| `preview` | `vite preview` |
| `lint` | `biome check .` |
| `format` | `biome format --write .` |
| `test` | `vitest run` |
| `test:watch` | `vitest` |
| `e2e` | `playwright test` |
| `e2e:ui` | `playwright test --ui` |

### `tsconfig.json` strict mode

| Setting | Value |
|---|---|
| `strict` | `true` |
| `noUncheckedIndexedAccess` | `true` |
| `exactOptionalPropertyTypes` | `true` |
| `verbatimModuleSyntax` | `true` |
| `paths.@/*` | `src/*` |

**SECURITY:**
- a11y rules enforced (no contrast issues, alt text required).
- Strict TS catches null/undefined bugs early.

---

## STEP 43 — Tailwind v4 globals.css + Theme Tokens + Density / Font / Animation Classes

### `src/styles/globals.css`

```css
@import "tailwindcss";
@import "maplibre-gl/dist/maplibre-gl.css";

@theme {
  --color-brand-50:  #eff6ff;
  --color-brand-500: #3b82f6;
  --color-brand-600: #2563eb;
  --color-brand-700: #1d4ed8;
  --color-success:   #10b981;
  --color-warning:   #f59e0b;
  --color-danger:    #ef4444;

  --font-family-sans: 'Inter', ui-sans-serif, system-ui, sans-serif;
}

@layer base {
  :root[data-theme="dark"] { color-scheme: dark; }
  html, body, #root { height: 100%; }
  body { font-family: var(--font-family-sans); }
}

@layer utilities {
  .font-sm { font-size: 0.875rem; }
  .font-md { font-size: 1rem; }
  .font-lg { font-size: 1.125rem; }

  .density-compact     { --app-gap: 0.5rem; }
  .density-comfortable { --app-gap: 0.75rem; }
  .density-spacious    { --app-gap: 1rem; }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { transition: none !important; animation: none !important; }
}

.no-anim *,
.no-anim *::before,
.no-anim *::after { transition: none !important; animation: none !important; }
```

### `src/main.tsx`

Import `./styles/globals.css` once.

### Theme application

Handled by `PreferencesContext` (STEP 50): sets `data-theme` on `<html>`, applies `font-{sm|md|lg}` and `density-*` classes to `<body>`.

**SECURITY:**
- All styles authored locally; no external CSS imports beyond maplibre's bundled CSS.
- prefers-reduced-motion respected for a11y.

---

## STEP 44 — shadcn-Style UI Primitives Set A (Button, Card, Input, Label, Textarea, Select, Badge)

Create files in `src/components/ui/`. Each ≤80 lines. Pattern: Radix-headless primitive + Tailwind variants via `cn()`.

### `lib/cn.ts`

```ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));
```

### Primitives

| Primitive | Notes |
|---|---|
| `Button` | Variants: `default`, `secondary`, `outline`, `ghost`, `destructive`, `link`. Sizes: `sm`, `md`, `lg`, `icon`. Disabled state styled. |
| `Card` | `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter` subcomponents. |
| `Input` | Forward ref, accepts all HTML attrs, focus-ring styles. |
| `Label` | Forward ref, `htmlFor` required (a11y). |
| `Textarea` | Forward ref, resize-vertical default. |
| `Select` | Native HTML select with Tailwind styling (no Radix here; Radix Select is heavier — used only when popover is necessary). |
| `Badge` | Variants: `default`, `secondary`, `success`, `warning`, `danger`. |

### Naming convention

Forward refs typed via `React.forwardRef<HTMLElementType, React.ComponentPropsWithoutRef<'element'>>`.

**SECURITY:**
- No primitive uses `dangerouslySetInnerHTML`.
- All inputs are uncontrolled-by-default — encourages parent ownership of state and prevents XSS via uncontrolled re-render.

---

## STEP 45 — shadcn-Style UI Primitives Set B (Dialog, AlertDialog, Sheet, DropdownMenu, Tabs, Tooltip, Switch, Skeleton, Slider, Avatar)

Continue in `src/components/ui/`.

### Primitives

| Primitive | Radix package | Use cases |
|---|---|---|
| `Dialog` | `@radix-ui/react-dialog` | Forms, settings detail, generic modal |
| `AlertDialog` | `@radix-ui/react-alert-dialog` | Destructive confirmation (delete) |
| `Sheet` | reuses Dialog | Side drawer (mobile nav, geofence form, vehicle filters mobile) |
| `DropdownMenu` | `@radix-ui/react-dropdown-menu` | User dropdown, table row actions |
| `Tabs` | `@radix-ui/react-tabs` | Vehicle detail tabs, settings tabs |
| `Tooltip` | `@radix-ui/react-tooltip` | Disabled buttons, connection indicator |
| `Switch` | `@radix-ui/react-switch` | Settings toggles |
| `Slider` | `@radix-ui/react-slider` | Speed limit input, history playback |
| `Avatar` | `@radix-ui/react-avatar` | User & driver avatars, fallback initials |
| `Skeleton` | bare div with pulse animation | Loading placeholders |

### Animation convention

All Radix primitives use `data-[state=open]:animate-in data-[state=closed]:animate-out` Tailwind animations (or fade if user has `animations: false`).

**SECURITY:**
- All Radix primitives ship with focus trap + escape key + outside-click out of the box (a11y baked in).
- No `tabindex` overrides.

---

# PHASE 12 — Frontend Foundation: API & State

## STEP 46 — Typed Env Reader & Fetch Wrapper with Single-Flight Refresh

### `src/env.ts`

Typed runtime env:

```ts
const get = (k: string) => import.meta.env[k] as string | undefined;
export const env = Object.freeze({
  API_URL: get('VITE_API_URL') ?? 'http://localhost:5000/api',
  WS_URL: get('VITE_WS_URL') ?? 'ws://localhost:5000',
  MAP_STYLE_URL: get('VITE_MAP_STYLE_URL') ?? 'https://tiles.openfreemap.org/styles/liberty',
  SENTRY_DSN: get('VITE_SENTRY_DSN') ?? '',
});
```

### `src/api/client.ts` — fetch wrapper

A `fetcher<T>(input, init)` function. Behavior:

1. Attach `Authorization: Bearer <accessToken>` from `getAccessToken()` (module-level state).
2. `credentials: 'include'` (for refresh cookie when calling auth endpoints).
3. Parse response:
   - If 204 → return `null`.
   - JSON parse `{ success, data, message, errors }` envelope; on success return `data`; on error throw `ApiError`.
4. On 401:
   - If the failing request is `/auth/refresh` → propagate (forces logout).
   - Else: enqueue request behind a **single-flight refresh promise**.

### Single-flight refresh queue

```ts
let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = fetch(env.API_URL + '/auth/refresh', { method: 'POST', credentials: 'include' })
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(json => json.data.accessToken)
      .finally(() => { refreshPromise = null; });
  }
  return refreshPromise;
}
```

On burst 401s, **only one** refresh request fires; all callers await it.

### Logout cascade

If `/auth/refresh` itself fails: clear access token, emit `window` event `'auth:logout'`, AuthContext listens and redirects to `/login`.

### Token storage choice

Access token kept in **JavaScript memory** (a module-level variable + AuthContext). On page reload, AuthContext calls `/auth/refresh` to get a fresh access token. **No `localStorage`** = no XSS exfiltration of long-lived credentials. Refresh cookie is httpOnly so even XSS can't read it.

### `ApiError`

```ts
export class ApiError extends Error {
  constructor(public status: number, message: string, public errors?: unknown) {
    super(message);
  }
}
```

**SECURITY:**
- Access token never persisted to disk (memory only).
- Refresh queue prevents stampedes on the auth endpoint.
- 401 outside refresh forces clean logout.
- All API calls go through one fetcher (single audited path).

---

## STEP 47 — Service Files (auth, vehicles, locations, geofences, alerts, trips, uploads, admin)

Each service is a thin module exporting named functions that call `fetcher`. Located in `src/api/`.

### Conventions

- Function names use the **verb-resource** pattern: `listVehicles`, `getVehicle`, `createVehicle`, `updateVehicle`, `removeVehicle`.
- Query params passed as object; service serializes to URLSearchParams.
- Each function fully typed — accepts a DTO type, returns a Promise of typed result.

### Per-file surface

| File | Functions |
|---|---|
| `auth.ts` | `login`, `register`, `refresh`, `logout`, `getMe`, `updateMe`, `changePassword`, `deleteAccount` |
| `vehicles.ts` | `listVehicles`, `getVehicle`, `createVehicle`, `updateVehicle`, `removeVehicle`, `getNearby`, `bulkActivate`, `getVehicleStats`, `exportRoute`, `getHeatmap` |
| `locations.ts` | `getHistory`, `getLatest` |
| `geofences.ts` | `listGeofences`, `getGeofence`, `createGeofence`, `updateGeofence`, `removeGeofence`, `testGeofence` |
| `alerts.ts` | `listAlerts`, `acknowledgeAlert`, `acknowledgeMany`, `removeAlert`, `getAlertStats` |
| `trips.ts` | `listTrips`, `getTrip`, `getDailySummary`, `exportTripsCsv` |
| `uploads.ts` | `uploadDriver(file)`, `uploadVehicle(file)`, `uploadAvatar(file)`, `deleteAsset(publicId)` |
| `admin.ts` | `getAdminStats`, `listAdminUsers`, `getAdminUser`, `setUserRole`, `setUserActive`, `removeUser`, `getAdminFleet` |

### Shared types

A `src/api/types.ts` file exports:

```ts
export interface Pagination<T> { items: T[]; page: number; totalPages: number; total: number; }
export interface Vehicle { ... }
export interface Location { ... }
// etc.
```

Types match server entities (manually synced; document the sync in README).

**SECURITY:**
- All requests through `fetcher` (auth + refresh + error handling centralized).
- No direct `fetch` calls outside `client.ts`.

---

## STEP 48 — WebSocket Client with Auto-Reconnect & Sec-WebSocket-Protocol JWT

### `src/api/ws.ts`

A class `DashboardSocket` (singleton instance exported):

```ts
class DashboardSocket {
  private ws: WebSocket | null = null;
  private subscriptions = new Set<string>();
  private listeners = new Map<string, Set<(payload: any) => void>>();
  private reconnectAttempt = 0;
  private explicitClose = false;
  
  connect(accessToken: string): void { ... }
  disconnect(): void { ... }
  subscribeToVehicle(id: string): void { ... }
  unsubscribeFromVehicle(id: string): void { ... }
  on(event: string, cb: (payload: any) => void): () => void { ... }
}
```

### Connect flow

```ts
this.ws = new WebSocket(env.WS_URL + '/ws/dashboard', [accessToken]);
this.ws.onopen = () => {
  this.reconnectAttempt = 0;
  this.subscriptions.forEach(id => this.send({ type: 'subscribe', vehicleId: id }));
};
this.ws.onmessage = (e) => {
  const { type, ...payload } = JSON.parse(e.data);
  this.listeners.get(type)?.forEach(cb => cb(payload));
};
this.ws.onclose = () => {
  if (!this.explicitClose) this.scheduleReconnect();
};
```

### Reconnect with exponential backoff

```ts
private scheduleReconnect() {
  const delay = Math.min(1000 * 2 ** this.reconnectAttempt, 30_000);
  this.reconnectAttempt++;
  setTimeout(() => {
    const token = getAccessToken();
    if (token) this.connect(token);
  }, delay);
}
```

If 5 attempts fail, emit `ws:error` listener so UI can show a "reconnecting…" banner that turns red after threshold.

### Subscribe/unsubscribe

Tracks active subscriptions; replays on reconnect.

### Listener registration

`on(event, cb)` returns an unsubscribe function — used in `useEffect` cleanup.

**SECURITY:**
- JWT in subprotocol slot (out of access logs).
- Auto-reconnect halted on explicit close (logout).
- No token stored in WebSocket URL.

---

## STEP 49 — Zustand Live Vehicles Store & useLiveVehicle Selector Hook

### `src/stores/live-vehicles.store.ts`

```ts
import { create } from 'zustand';

type LiveVehicle = {
  id: string;
  plate: string;
  coordinates: [number, number];
  speed: number;
  heading: number;
  status: 'moving' | 'idle' | 'offline';
  timestamp: string;
};

type State = {
  vehicles: Map<string, LiveVehicle>;
  hydrate: (vehicles: LiveVehicle[]) => void;
  upsert: (v: LiveVehicle) => void;
  setStatus: (id: string, status: LiveVehicle['status']) => void;
  reset: () => void;
};

export const useLiveStore = create<State>((set) => ({
  vehicles: new Map(),
  hydrate: (list) => set({ vehicles: new Map(list.map(v => [v.id, v])) }),
  upsert: (v) => set(s => {
    const next = new Map(s.vehicles);
    next.set(v.id, v);
    return { vehicles: next };
  }),
  setStatus: (id, status) => set(s => {
    const cur = s.vehicles.get(id);
    if (!cur) return s;
    const next = new Map(s.vehicles);
    next.set(id, { ...cur, status });
    return { vehicles: next };
  }),
  reset: () => set({ vehicles: new Map() }),
}));
```

### Selector hooks

```ts
export const useLiveVehicle = (id: string) =>
  useLiveStore(s => s.vehicles.get(id));

export const useVehicleStatusCounts = () =>
  useLiveStore(s => {
    let moving = 0, idle = 0, offline = 0;
    for (const v of s.vehicles.values()) {
      if (v.status === 'moving')      moving++;
      else if (v.status === 'idle')   idle++;
      else                             offline++;
    }
    return { moving, idle, offline, total: s.vehicles.size };
  });
```

### Why Zustand

A `LiveMap` with 50 markers + 5 updates/sec/marker = 250 updates/sec. With Zustand selector `useLiveVehicle(id)`, only the specific marker's component re-renders per update — no global tree reconciliation. With Context, every update would re-render the whole tree.

### WebSocket integration

A `useWsConnection()` hook (STEP 50) wires `dashboardSocket.on('vehicle:update', payload => liveStore.upsert(payload))` once at app boot.

**SECURITY:**
- Store is in-memory only (no persistence).
- No PII stored (just operational data).

---

## STEP 50 — Auth Context (Refresh on Mount) & Preferences Context (Theme / Font / Density / Animations)

### `src/context/auth.context.tsx`

```ts
type AuthState = {
  user: User | null;
  loading: boolean;
  login: (email, password) => Promise<void>;
  register: (name, email, password) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (patch: Partial<User>) => void;
  hasRole: (...roles: UserRole[]) => boolean;
};
```

### Boot flow

```ts
useEffect(() => {
  (async () => {
    try {
      const { accessToken } = await authService.refresh();
      setAccessToken(accessToken);
      const u = await authService.getMe();
      setUser(u);
      dashboardSocket.connect(accessToken);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  })();
}, []);
```

### Auth events

Listen for `window.addEventListener('auth:logout', () => { setUser(null); dashboardSocket.disconnect(); router.navigate({ to: '/login' }); })`.

### `src/context/preferences.context.tsx`

Reads `user.preferences` (or defaults when not logged in). Applies:

```ts
useEffect(() => {
  const root = document.documentElement;
  const body = document.body;
  
  // Theme
  if (preferences.theme === 'system') {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = (m) => root.setAttribute('data-theme', m.matches ? 'dark' : 'light');
    apply(mq); mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }
  root.setAttribute('data-theme', preferences.theme);
  
  // Font size
  body.classList.remove('font-sm', 'font-md', 'font-lg');
  body.classList.add('font-' + preferences.fontSize);
  
  // Density
  body.classList.remove('density-compact', 'density-comfortable', 'density-spacious');
  body.classList.add('density-' + preferences.contentDensity);
  
  // Animations
  body.classList.toggle('no-anim', !preferences.animations);
}, [preferences]);
```

### `updatePreference(key, value)`

Optimistic local update + `authService.updateMe({ preferences: nextPrefs })` API call.

**SECURITY:**
- No PII in localStorage.
- Theme/font preferences are non-sensitive.

---

# PHASE 13 — Layouts & Routing

## STEP 51 — Root Layout (`__root.tsx`) & TanStack Router Context Injection

### `src/router.tsx`

```ts
import { QueryClient } from '@tanstack/react-query';
import { createRouter } from '@tanstack/react-router';
import { routeTree } from './routeTree.gen';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: (count, e) => (e as any)?.status !== 401 && count < 2 },
    mutations: { retry: 0 },
  },
});

export const router = createRouter({
  routeTree,
  context: { auth: undefined as any, queryClient },
  defaultPreload: 'intent',
  defaultPreloadStaleTime: 0,
});

declare module '@tanstack/react-router' {
  interface Register { router: typeof router; }
}
```

### `src/main.tsx`

Wraps the router in providers:

```tsx
<QueryClientProvider client={queryClient}>
  <AuthProvider>
    <PreferencesProvider>
      <Toaster richColors closeButton position="top-right" />
      <RouterProviderWithAuthContext />
    </PreferencesProvider>
  </AuthProvider>
</QueryClientProvider>
```

`RouterProviderWithAuthContext` reads `useAuth()` and passes it into `router.update({ context: { auth, queryClient } })` so route loaders/guards can access it.

### `src/routes/__root.tsx`

```tsx
export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
  notFoundComponent: NotFoundPage,
  errorComponent: ErrorBoundaryPage,
});

function RootComponent() {
  return <Outlet />;
}
```

**SECURITY:**
- Router context provides typed access to auth and queryClient for all routes/loaders.
- Default `notFoundComponent` defined at root prevents accidental fallthrough.

---

## STEP 52 — MainLayout, Navbar, Footer & Live Connection Indicator

### `MainLayout` (`components/layout/MainLayout.tsx`)

```tsx
<div className="min-h-full flex flex-col">
  <Navbar />
  <main className="flex-1"><Outlet /></main>
  <Footer />
</div>
```

### `Navbar`

| Section | Content |
|---|---|
| Brand | Logo (lucide icon `Truck`) + app name, links to `/` |
| Primary links | Dashboard, Vehicles, Geofences, Alerts, Reports |
| Connection indicator | Green/yellow/red dot + Tooltip "Live" / "Reconnecting…" / "Disconnected" — reads from `useWsConnection()` |
| User dropdown | Avatar + name, items: Profile, Settings, Admin (if admin), Logout |
| Mobile | Hamburger opens `Sheet` drawer with primary links |

### `useWsConnection()` hook

```ts
type Status = 'connecting' | 'open' | 'closed' | 'reconnecting';
export const useWsConnection = () => {
  const [status, setStatus] = useState<Status>('closed');
  useEffect(() => {
    const off1 = dashboardSocket.on('connect', () => setStatus('open'));
    const off2 = dashboardSocket.on('reconnect', () => setStatus('reconnecting'));
    const off3 = dashboardSocket.on('disconnect', () => setStatus('closed'));
    return () => { off1(); off2(); off3(); };
  }, []);
  return status;
};
```

### `Footer`

Minimal: app name, year, link to repo, link to docs. Always visible at bottom.

### Active link styling

Use TanStack Router's `<Link activeProps={{ className: 'text-brand-600 font-semibold' }} />`.

**SECURITY:**
- Logout cleanly terminates ws + clears user.

---

## STEP 53 — AdminLayout & SettingsLayout (Responsive Mobile Drawers)

### `AdminLayout`

```tsx
<MainLayout>
  <div className="flex gap-6">
    <aside className="hidden md:block w-56 shrink-0">
      <nav>
        <Link to="/admin">Dashboard</Link>
        <Link to="/admin/users">Users</Link>
        <Link to="/admin/fleet">Fleet</Link>
      </nav>
    </aside>
    <div className="md:hidden">
      <Sheet><SheetTrigger>Menu</SheetTrigger><SheetContent>...</SheetContent></Sheet>
    </div>
    <main className="flex-1"><Outlet /></main>
  </div>
</MainLayout>
```

### `SettingsLayout`

| Breakpoint | Nav style |
|---|---|
| `≥ md` | Left side nav with sections: Profile, Account, Appearance, Notifications |
| `< md` | Dropdown menu at top of content area |

### Responsive principles

Tailwind breakpoints: `sm:640`, `md:768`, `lg:1024`. Map: full-height area minus navbar/footer/breadcrumbs. Tables collapse to cards below `md`.

**SECURITY:**
- Admin sidebar items rendered conditionally on `hasRole('admin')` — but page itself still has `beforeLoad` guard (server is authoritative).

---

## STEP 54 — Route Guards via beforeLoad (Authenticated / Guest / Manager / Admin)

### Pattern

Instead of guard components, use TanStack Router's `beforeLoad` hook — type-safe, runs pre-mount (no flash of forbidden content).

### Examples

**Authenticated route:**

```ts
export const Route = createFileRoute('/vehicles/')({
  beforeLoad: ({ context, location }) => {
    if (!context.auth.user) throw redirect({ to: '/login', search: { redirect: location.href } });
  },
  component: VehiclesListPage,
});
```

**Admin-only route:**

```ts
export const Route = createFileRoute('/admin/users')({
  beforeLoad: ({ context }) => {
    if (!context.auth.user) throw redirect({ to: '/login' });
    if (context.auth.user.role !== 'admin') throw redirect({ to: '/' });
  },
  component: AdminUsersPage,
});
```

**Manager+ route:**

```ts
beforeLoad: ({ context }) => {
  if (!context.auth.user) throw redirect({ to: '/login' });
  if (context.auth.user.role === 'viewer') throw redirect({ to: '/' });
}
```

**Guest-only route (login/register):**

```ts
beforeLoad: ({ context, search }) => {
  if (context.auth.user) throw redirect({ to: (search as any).redirect ?? '/' });
}
```

### Reusable guard factories

```ts
export const requireAuth = (ctx, loc) => {
  if (!ctx.auth.user) throw redirect({ to: '/login', search: { redirect: loc.href } });
};
export const requireAdmin = (ctx, loc) => {
  requireAuth(ctx, loc);
  if (ctx.auth.user!.role !== 'admin') throw redirect({ to: '/' });
};
export const requireManagerOrAdmin = (ctx, loc) => {
  requireAuth(ctx, loc);
  if (ctx.auth.user!.role === 'viewer') throw redirect({ to: '/' });
};
```

Use in each `beforeLoad` to avoid repetition.

### Auth-loading guard

While `context.auth.loading === true`, `beforeLoad` should `throw` an awaitable that resolves when loading completes — or render a global spinner above the router. Simpler approach: render `<Spinner />` in `RouterProviderWithAuthContext` while `auth.loading`, only rendering the router after.

**SECURITY:**
- Guards mirror server role checks; server is authoritative.
- `beforeLoad` runs before any component mount (no flash).
- Redirect-after-login preserves intended destination.

---

# PHASE 14 — Auth Pages

## STEP 55 — Login Page (TanStack Form + Redirect Param + Generic Error)

### Layout

Centered card on neutral background:

```tsx
<div className="min-h-screen grid place-items-center px-4">
  <Card className="w-full max-w-md">
    <CardHeader><CardTitle>Sign in</CardTitle>...</CardHeader>
    <CardContent>{/* form */}</CardContent>
    <CardFooter>{/* link to register */}</CardFooter>
  </Card>
</div>
```

### TanStack Form

```ts
const form = useForm({
  defaultValues: { email: '', password: '' },
  onSubmit: async ({ value }) => { await login(value.email, value.password); }
});
```

Fields: `email` (Input type=email), `password` (Input type=password with show/hide eye icon button).

### Validation

Synchronous validators on each field via `validators: { onChange: ({ value }) => ... }`. Email format, password not empty.

### Submit handling

On success: `auth.login(...)` returns when access token + user are set. Read `?redirect=` search param, navigate there.

On 401: generic inline error "Invalid email or password" rendered above the form. No success-on-some-side leakage.

### Loading state

`<Button disabled={form.state.isSubmitting}>` shows spinner.

**SECURITY:**
- Generic auth error.
- Password never logged.
- Submit button disabled during request.

---

## STEP 56 — Register Page (TanStack Form + Match Validator + Auto-Login)

### Layout

Same card style as login.

### Fields

| Field | Validator |
|---|---|
| `name` | length 2–60 |
| `email` | format |
| `password` | min 8, must contain letter + digit |
| `confirmPassword` | must equal `password` (cross-field validator) |

### Cross-field validator

```ts
validators: {
  onChange: ({ value }) => value !== form.getFieldValue('password') ? 'Passwords do not match' : undefined
}
```

### Auto-login

After successful `authService.register(...)` (which returns access token + user), the auth context is already populated. Navigate to `/`.

### No role field

Crucially: **no role selector in the UI**. New users default to `viewer` server-side.

**SECURITY:**
- Confirm-password prevents typos.
- Server hard-codes role; even if frontend sent role, server's `forbidNonWhitelisted` would 400.

---

# PHASE 15 — Live Dashboard

## STEP 57 — LiveMap Component (MapLibre Setup + Style URL + Initial Center)

### `components/map/LiveMap.tsx`

A client-only component. Because TanStack Start can do SSR, set `ssr: false` on the route or wrap in `lazy(() => import('./LiveMap'))` to prevent `window is undefined`.

### Setup

```tsx
const mapRef = useRef<maplibregl.Map | null>(null);
const containerRef = useRef<HTMLDivElement>(null);
const { mapDefaults } = usePreferences();

useEffect(() => {
  if (!containerRef.current) return;
  mapRef.current = new maplibregl.Map({
    container: containerRef.current,
    style: env.MAP_STYLE_URL,
    center: mapDefaults.center,
    zoom: mapDefaults.zoom,
    attributionControl: { compact: true },
  });
  mapRef.current.addControl(new maplibregl.NavigationControl(), 'top-right');
  return () => mapRef.current?.remove();
}, []);
```

### Initial hydration

Fetch all active vehicles in a single REST call via TanStack Query:

```ts
const { data } = useQuery({
  queryKey: ['vehicles', 'live'],
  queryFn: () => vehiclesService.listVehicles({ limit: 50 }),
});
useEffect(() => {
  if (data) liveStore.hydrate(data.items.map(toLiveVehicle));
}, [data]);
```

### Markers via portals

For each vehicle in `liveStore`, render a `VehicleMarker` (STEP 58). Use a stable `useEffect` per id to create/destroy MapLibre `Marker` instances.

**SECURITY:**
- Style URL from OpenFreeMap (no API key needed); document Mapbox alternative.
- One initial REST call; updates flow via WebSocket.

---

## STEP 58 — VehicleMarker, useSmoothPosition Hook & Popup

### `useSmoothPosition` hook

```ts
export const useSmoothPosition = (target: [number, number], durationMs = 1500) => {
  const [pos, setPos] = useState(target);
  const startRef = useRef<{ from: [number, number]; to: [number, number]; t0: number } | null>(null);
  
  useEffect(() => {
    startRef.current = { from: pos, to: target, t0: performance.now() };
    let raf = 0;
    const step = (t: number) => {
      const s = startRef.current!;
      const p = Math.min((t - s.t0) / durationMs, 1);
      const eased = p < 0.5 ? 2*p*p : -1 + (4 - 2*p)*p; // easeInOutQuad
      setPos([
        s.from[0] + (s.to[0] - s.from[0]) * eased,
        s.from[1] + (s.to[1] - s.from[1]) * eased,
      ]);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target[0], target[1]]);
  
  return pos;
};
```

### `VehicleMarker.tsx`

```tsx
export const VehicleMarker = ({ id, map }: { id: string; map: maplibregl.Map }) => {
  const vehicle = useLiveVehicle(id);
  const pos = useSmoothPosition(vehicle?.coordinates ?? [0,0]);
  const elRef = useRef<HTMLDivElement>(document.createElement('div'));
  const markerRef = useRef<maplibregl.Marker | null>(null);
  
  // Style element with status color + rotation by heading
  useEffect(() => {
    if (!vehicle) return;
    elRef.current.className = `vehicle-marker status-${vehicle.status}`;
    elRef.current.style.transform = `rotate(${vehicle.heading}deg)`;
  }, [vehicle?.status, vehicle?.heading]);
  
  useEffect(() => {
    markerRef.current = new maplibregl.Marker({ element: elRef.current })
      .setLngLat(pos)
      .setPopup(new maplibregl.Popup({ offset: 24 }).setHTML(buildPopupHtml(vehicle)))
      .addTo(map);
    return () => markerRef.current?.remove();
  }, [map]);
  
  useEffect(() => { markerRef.current?.setLngLat(pos); }, [pos]);
  
  return null;
};
```

### Popup content

| Field | Display |
|---|---|
| Plate | Big, bold |
| Driver name | small, secondary |
| Vehicle type | StatusBadge style |
| Current speed | formatted (`{speed} km/h`) |
| Heading | rotated icon |
| Last update | relative time (`date-fns formatDistanceToNow`) |
| Actions | "Open detail" link, "View history" link |

> **Note:** Popup HTML built via `buildPopupHtml(vehicle)` that **manually escapes** all dynamic fields. Plate, driver name etc. pass through an `escapeHtml()` helper. Alternative: use MapLibre `setDOMContent` with a real React-rendered fragment (safer, but heavier).

**SECURITY:**
- All popup dynamic content escaped (or rendered via React).
- Smooth animation uses RAF, not CSS transitions on coords (more accurate).
- Marker rotation via CSS transform.

---

## STEP 59 — Dashboard Stats Cards & Recent Alerts Widget

### Layout (`src/routes/index.tsx`)

```tsx
<div className="space-y-4">
  <StatsRow />       {/* 4 cards */}
  <LiveMap />        {/* main map */}
  <BelowMapRow>      {/* grid: recent alerts | top violators */}
</div>
```

### `StatsRow`

```tsx
const { moving, idle, offline, total } = useVehicleStatusCounts();
return (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
    <StatCard label="Active fleet" value={total} icon={<Truck />} />
    <StatCard label="Moving"  value={moving}  color="success" />
    <StatCard label="Idle"    value={idle}    color="warning" />
    <StatCard label="Offline" value={offline} color="neutral" />
  </div>
);
```

`StatCard` is a small composition of `Card` + Lucide icon.

### Recent Alerts widget

```tsx
const [recent, setRecent] = useState<Alert[]>([]);
useEffect(() => {
  return dashboardSocket.on('alert:new', (payload) => {
    setRecent(prev => [payload.alert, ...prev].slice(0, 10));
  });
}, []);
```

Each `AlertItem`: severity dot, vehicle plate (link), message, relative time.

### Top violators

A TanStack Query fetching `/api/admin/stats` (if admin) or `/api/alerts/stats?from=todayStart` (if manager/viewer) every 60 seconds; renders top 5 vehicles by alert count.

**SECURITY:**
- All data flows through authenticated REST/WebSocket.
- Recent alerts bounded (10) — no memory leak.

---

# PHASE 16 — Vehicle Pages

## STEP 60 — Vehicle List Page (Filters, Validated Search Params, Pagination, VehicleCard)

### Search params schema

```ts
export const Route = createFileRoute('/vehicles/')({
  validateSearch: (s) => ({
    q: typeof s.q === 'string' ? s.q : '',
    vehicleType: VEHICLE_TYPES.includes(s.vehicleType as any) ? s.vehicleType : undefined,
    status: ['moving','idle','offline'].includes(s.status as any) ? s.status : undefined,
    tag: typeof s.tag === 'string' ? s.tag : undefined,
    sort: ['recent','plate','speed'].includes(s.sort as any) ? s.sort : 'recent',
    page: Math.max(1, Number(s.page) || 1),
  }),
  loaderDeps: ({ search }) => search,
  loader: ({ deps, context }) =>
    context.queryClient.ensureQueryData({
      queryKey: ['vehicles', deps],
      queryFn: () => vehiclesService.listVehicles(deps),
    }),
  component: VehiclesListPage,
});
```

### Filter bar

| Control | Behavior |
|---|---|
| Search box | `useDebounce(value, 300)` → `navigate({ search: prev => ({ ...prev, q: v, page: 1 }) })` |
| Type dropdown | sets `vehicleType` |
| Status dropdown | sets `status` |
| Sort dropdown | sets `sort` |
| Tag chips | toggle individual tags |
| "New Vehicle" button | visible if `hasRole('manager','admin')` |

### `VehicleCard`

| Section | Content |
|---|---|
| Top | Vehicle photo (or placeholder), plate (large bold), `StatusBadge` |
| Middle | Driver name, type badge, last speed |
| Bottom | Last update relative time, action buttons (View, Edit if allowed, Delete confirm) |

### Pagination

`PageNavigator` component reads `data.page`, `data.totalPages`. Buttons update `?page=` via navigate.

**SECURITY:**
- Search params validated at route level (invalid types fall back to defaults).
- Filters survive refresh (in URL).
- Mutation buttons gated client-side; server independently enforces.

---

## STEP 61 — Vehicle Detail: Live Tab + Recent Vehicle Alerts

### `/vehicles/$id` route

```ts
export const Route = createFileRoute('/vehicles/$id')({
  beforeLoad: requireAuth,
  loader: ({ params, context }) =>
    context.queryClient.ensureQueryData({
      queryKey: ['vehicles', params.id],
      queryFn: () => vehiclesService.getVehicle(params.id),
    }),
  component: VehicleDetailPage,
});
```

### Layout

Tabs at top: Live, History, Trips, Alerts. Tab state in `?tab=` search param so refreshes preserve.

### Live tab content

```tsx
<div className="grid lg:grid-cols-3 gap-4">
  <div className="lg:col-span-2">
    <Map focusedVehicleId={id} autoFollow={autoFollow} />
  </div>
  <div className="space-y-4">
    <CurrentSpeedGauge />
    <StatusCard />
    <RecentVehicleAlerts vehicleId={id} />
  </div>
</div>
```

### Auto-follow

Toggle button: when on, on every `vehicle:update` event for this vehicle, `map.flyTo({ center: coords, duration: 800 })`. When off, user can pan freely.

### Recent Vehicle Alerts widget

Fetches `/api/alerts?vehicleId=:id&limit=20` via TanStack Query + subscribes to `alert:new` filtered by `vehicleId`.

**SECURITY:**
- WebSocket subscribe to `vehicle:<id>` room on mount; unsubscribe on unmount.

---

## STEP 62 — Vehicle Detail: History Tab + HistoryPlayer + Route Polyline

### Layout

```tsx
<div className="grid lg:grid-cols-3 gap-4">
  <div className="lg:col-span-2">
    <Map>
      {polyline && <RouteLine geojson={polyline} />}
      {playerPos && <PlayerMarker pos={playerPos} />}
    </Map>
  </div>
  <div className="space-y-4">
    <DateRangePicker value={range} onChange={setRange} />
    <Button onClick={loadHistory}>Load route</Button>
    {history && <StatsPanel data={stats} />}
    {history && <HistoryPlayer points={history} onTick={setPlayerPos} />}
    {history && <ExportButtons vehicleId={id} range={range} />}
  </div>
</div>
```

### `RouteLine` (MapLibre source/layer)

On first paint, add a `geojson` source containing a `LineString` of the history coordinates; add a layer with line styling. On range change, replace source data.

Optional speed-bucket coloring via `interpolate` expression on a `speed` property — toggle UI.

### `HistoryPlayer`

```tsx
const [t, setT] = useState(0);
const [playing, setPlaying] = useState(false);
const [speed, setSpeed] = useState(1);

useAnimationFrame(() => {
  if (!playing) return;
  setT(prev => {
    const next = prev + speed * 0.005;
    if (next >= 1) { setPlaying(false); return 1; }
    return next;
  });
});

const idx = Math.floor(t * (points.length - 1));
onTick(points[idx]);
```

UI: play/pause `Button`, speed select (1× 2× 5× 10×), slider for scrubbing.

### Export buttons

Trigger downloads:

```ts
window.open(`${env.API_URL}/vehicles/${id}/export?format=csv&from=${from}&to=${to}`, '_blank');
```

(Auth via token cookie won't work here since the request is a navigation — but `?format=csv` route would need auth. Solution: use TanStack Query `fetch` that returns a blob, then create object URL and trigger download.)

**SECURITY:**
- Date range capped (90 days for export, enforced server-side).
- Blob download avoids leaking access token in URL.

---

## STEP 63 — Vehicle Detail: Trips Tab + Alerts Tab

### Trips tab

Table of trips in date range:

| Column | Content |
|---|---|
| Started | timestamp |
| Duration | endedAt - startedAt |
| Distance | `{km} km` |
| Avg / Max speed | numbers |
| Violations | dot for each type |
| Action | "View on map" → highlights route on map area |

Filter: date range, min distance.

### Alerts tab

Reuses the global `AlertsPage` table component (STEP 67) scoped to `vehicleId`. Filters: type, severity, acknowledged. Real-time updates via socket filter.

### URL state

Tab selection in `?tab=`; trips filters in `?tripFrom=`, `?tripTo=`, `?minKm=`; alerts filters in `?alertType=`, etc. All validated via `validateSearch`.

**SECURITY:**
- Same filter validation pattern as STEP 60.

---

## STEP 64 — Vehicle Create / Edit Pages (Form + Photo Uploads + Confirm Delete)

### `VehicleForm` shared component

TanStack Form with sections:

1. **Identification:** plate (auto-uppercase on input), type, model, year, color.
2. **Driver:** name, phone, license, driver photo upload.
3. **Vehicle photo:** upload.
4. **Settings:** speed limit slider (10–250), tags chip input (max 10, alphanumeric+dash).
5. **Assignment (admin only):** assigned managers multi-select fetched via `adminService.listAdminUsers({ role: 'manager' })`.

### Photo upload

Each upload field uses `<input type="file" accept="image/jpeg,image/png,image/webp">`. On change, validate MIME + size client-side, then call `uploadsService.uploadDriver(file)` → store returned URL in form state.

### Submit

```ts
onSubmit: async ({ value }) => {
  if (editing) await vehiclesService.updateVehicle(id, value);
  else await vehiclesService.createVehicle(value);
  queryClient.invalidateQueries({ queryKey: ['vehicles'] });
  navigate({ to: '/vehicles/$id', params: { id: result.id } });
}
```

### Edit page specifics

Loader prefetches vehicle; pre-fills form. "Last updated" shown. "Delete vehicle" button opens `AlertDialog`:

```tsx
<AlertDialog>
  <AlertDialogTitle>Delete vehicle {plate}?</AlertDialogTitle>
  <AlertDialogDescription>
    This will permanently delete all locations, trips, and alerts for this vehicle.
    This action cannot be undone.
  </AlertDialogDescription>
  <AlertDialogAction onClick={onDelete} variant="destructive">Delete</AlertDialogAction>
</AlertDialog>
```

**SECURITY:**
- Only allowed fields in form (matches server DTO).
- MIME validated client-side (UX); server re-validates (security).
- Destructive action requires explicit confirmation.

---

# PHASE 17 — Geofences, Alerts & Reports

## STEP 65 — Geofence Management Page: List + Drawer Form

### Layout

Two-column on desktop:

```tsx
<div className="grid lg:grid-cols-[20rem_1fr] gap-4">
  <GeofenceList />
  <GeofenceMap />
</div>
```

### `GeofenceList`

- Search box (filter by name).
- Active toggle filter.
- Shape filter (polygon/circle/all).
- List items:
  - Color swatch
  - Shape icon
  - Name + description (truncated)
  - Active toggle (manager+)
  - Click → opens drawer in edit mode

### Drawer form (Radix `Sheet`)

Triggered by "New Geofence" button OR clicking a list item. Fields:

| Field | Input |
|---|---|
| `name` | Input |
| `description` | Textarea |
| `direction` | Select (enter / exit / both) |
| `appliesTo` | RadioGroup (all / specific) |
| `vehicleIds` | conditional multi-select fetched from `vehiclesService.listVehicles` |
| `color` | color swatch grid + custom hex input |
| Shape mode | toggle Polygon / Circle |
| `radiusMeters` | Slider (only when shape=circle) |

### State sync

Drawer form mirrors `GeofenceMap` state (shape + geometry). User picks shape mode in drawer → map enters drawing mode (STEP 66).

**SECURITY:**
- Server validates vertex count / radius; client form clamps for UX.

---

## STEP 66 — Geofence Management Page: MapLibre Draw Integration + Test Point Mode

### `GeofenceMap` component

Loads `@maplibre/maplibre-gl-draw` plugin. Configures:

```ts
const draw = new MaplibreDraw({
  displayControlsDefault: false,
  controls: { polygon: true, point: false, line_string: false, trash: true },
});
map.addControl(draw);
```

### Existing geofences

For each geofence: add a `geojson` source + a `fill` layer (with color from geofence). On click → opens drawer in edit mode + `draw.set(geometry)`.

### Drawing new geofence

When the drawer's "draw" button is clicked, set draw mode programmatically:

```ts
if (shape === 'polygon') draw.changeMode('draw_polygon');
```

For circle: no native circle in MaplibreDraw. Implement custom mode: click sets center; second click sets radius. Store as `{ center, radius }` rendered as a circle polygon for visualization (e.g. turf.js `circle()` with 64 segments). Server stores `circle_center` + `radius_meters`.

### Vertex count limit

Listen to `draw.create` / `draw.update`; if polygon ring length > 256, snap back to previous and toast error.

### Test point mode

A "Test point" toggle in the toolbar. When active, clicking the map sends `geofencesService.testGeofence(id, lng, lat)` → toast `Inside: yes/no`.

### Save

On drawer submit:
- Polygon: serialize `draw.getAll()` first feature's geometry.
- Circle: serialize `{ center, radius }`.

Call `createGeofence` or `updateGeofence` and invalidate queries.

**SECURITY:**
- Vertex limit + radius limit enforced.
- Test endpoint doesn't mutate; safe to expose to all roles.

---

## STEP 67 — Alerts Page (Filters + Bulk Ack + Real-Time Subscription)

### Layout

```tsx
<div className="space-y-4">
  <AlertsFilterBar />
  <AlertsStats />
  <BulkActionBar selectedIds={selected} onAck={handleBulkAck} />
  <AlertsTable />
</div>
```

### Filter bar

Type, severity, vehicle (select from fleet), acknowledged toggle, date range, search.

URL state for all filters.

### Stats row

Today / this week counts + bar by type.

### Bulk action bar

Appears when ≥1 row checked. "Acknowledge selected" button calls `alertsService.acknowledgeMany(ids)`.

### Table columns

| Column | Content |
|---|---|
| ☐ | Row checkbox |
| Severity | colored dot |
| Vehicle | plate (link to detail) |
| Type | `Badge` |
| Message | truncated |
| Location | mini coords + "Open on map" link |
| Time | relative |
| Ack by | user name (if acknowledged) |
| Actions | Acknowledge button (manager+); Delete (admin) |

### Real-time

```ts
useEffect(() => {
  return dashboardSocket.on('alert:new', (payload) => {
    if (matchesCurrentFilters(payload.alert, filters)) {
      queryClient.setQueryData(['alerts', filters], (old: any) => 
        old ? { ...old, items: [payload.alert, ...old.items] } : old);
    }
  });
}, [filters]);
```

**SECURITY:**
- Acknowledge / Delete buttons gated by role.
- All filters validated.

---

## STEP 68 — Trip Reports Page (Filters + Daily Chart + Trip Table + Heatmap Panel)

### Layout

```tsx
<div className="space-y-6">
  <ReportFilters />              {/* vehicle picker, date range, min distance */}
  <DailySummaryChart />
  <div className="grid lg:grid-cols-[1fr_24rem] gap-4">
    <TripTable />
    <HeatmapPanel />              {/* toggle; map preview */}
  </div>
</div>
```

### Daily summary chart

For a date range, render inline SVG bar chart (no chart lib for <30 days). Y-axis: distance km. Bar tooltip: distance, hours moving, violations.

If range >30 days, lazy-load `recharts` for grouped bars.

### Trip table

| Column | Content |
|---|---|
| Date | trip date |
| Vehicle | plate (link) |
| Distance | km |
| Avg/Max speed | km/h |
| Duration | minutes |
| Violations | dot per type |
| Action | "View on map" |

Click "View on map" → opens a small map view (in panel or modal) with the trip's route polyline (from `locationsService.getHistory` between `startedAt` and `endedAt`).

### Heatmap panel

- Vehicle picker.
- Date range (max 30 days).
- "Generate" → calls `vehiclesService.getHeatmap(id, { from, to })` → renders heatmap layer on the map panel.
- Toggle button to hide/show.

### Export

"Export trips CSV" button → downloads CSV of current filtered trips.

**SECURITY:**
- Heatmap range max 30 days.
- Export rate-limited server-side.

---

# PHASE 18 — Admin & Settings Pages

## STEP 69 — Admin Pages (Dashboard + Users + Fleet)

### `/admin` — AdminDashboardPage

Stat cards (users by role, vehicles by status, alerts today/week, trips today/week, recent registrations) + 30-day trend mini-charts.

Polls `/api/admin/stats` every 60s via TanStack Query.

### `/admin/users` — AdminUsersPage

- Filters: search, role, active.
- Table columns: avatar, name, email, `RoleBadge`, active toggle, last login, created, actions.
- Actions per row:
  - Change role (Radix `Dialog` with role select). Disabled when target is self. Warning when target is last admin.
  - Toggle active (`Switch`). Disabled for self.
  - Delete (`AlertDialog`). Disabled for self; warning if last admin.

### `/admin/fleet` — AdminFleetPage

Full table of all vehicles regardless of assignment:

- Filters: type, status, tag, created-by user.
- Bulk activate/deactivate via row checkboxes + `BulkActivateDto`.
- Row click → vehicle detail.

**SECURITY:**
- Self-protection visible in UI (disabled controls + tooltip explaining why).
- Server independently enforces last-admin protection.

---

## STEP 70 — Profile & Settings Pages (Profile / Account / Appearance / Notifications)

### `/profile/$id` — ProfilePage

Public-ish profile for any authenticated user:

- Header: Avatar, name, `RoleBadge`, joined date.
- Tabs: Activity (alerts acknowledged, vehicles created — respects privacy), About.
- "Edit profile" button shown only when viewing self.

### `/settings/profile` — ProfileSettings

Fields: avatar upload (calls `uploadsService.uploadAvatar`), name, phone. Explicit Save button.

### `/settings/account` — AccountSettings

- Email displayed read-only.
- Change password form (current, new, confirm).
- Delete account button (`AlertDialog`, requires password).

### `/settings/appearance` — AppearanceSettings

| Section | Control |
|---|---|
| Theme | `RadioGroup` (light / dark / system) |
| Font size | `RadioGroup` (sm / md / lg) |
| Content density | `RadioGroup` (compact / comfortable / spacious) |
| Animations | `Switch` |
| Map default center | latitude/longitude inputs + "Use current map view" button |
| Map default zoom | `Slider` 3–18 |

Auto-save (debounced 500ms) on change.

### `/settings/notifications` — NotificationSettings

| Section | Control |
|---|---|
| Email notifications | `Switch` |
| In-app notifications | `Switch` |
| Severity threshold | `Select` (info / warning / critical) |

Auto-save on change.

**SECURITY:**
- Password change requires current password.
- Account delete requires password.
- Email change excluded (would require email verification flow — out of scope).

---

# PHASE 19 — Polish, a11y & 404

## STEP 71 — App-Specific Reusable Components (StatusBadge, RoleBadge, EmptyState, CharacterCounter)

Located in `components/common/`.

| Component | Props | Output |
|---|---|---|
| `StatusBadge` | `status: 'moving' \| 'idle' \| 'offline'` | Colored chip + icon |
| `RoleBadge` | `role: UserRole` | Colored chip (admin=red, manager=blue, viewer=gray) |
| `EmptyState` | `title`, `description?`, `icon?`, `action?` | Centered illustration + text + optional CTA |
| `CharacterCounter` | `value: string`, `max: number` | Subtle counter under inputs |
| `Spinner` | `size: 'sm'\|'md'\|'lg'`, `label?` | Accessible loader with `role="status"` |
| `RelativeTime` | `date: Date \| string`, `live?: boolean` | `date-fns formatDistanceToNow`; with `live`, updates every minute |

### Pattern

All ≤50 lines, fully typed, no internal state except where called out (`RelativeTime`).

**SECURITY:**
- No `dangerouslySetInnerHTML`.
- All translatable strings as constants in `utils/constants.ts` (future i18n-ready).

---

## STEP 72 — Toast System (sonner), Loading Skeletons & Accessibility Sweep

### Sonner setup

Mount `<Toaster richColors closeButton position="top-right" />` in `main.tsx` (already in STEP 51). Helpers in `utils/notify.ts`:

```ts
import { toast } from 'sonner';
export const notify = {
  success: (msg: string) => toast.success(msg),
  error: (msg: string) => toast.error(msg),
  info: (msg: string) => toast.info(msg),
  warning: (msg: string) => toast.warning(msg),
};
```

### Loading skeletons

Replace generic `Spinner` on list views with content-shaped skeletons:

- Vehicle list → card grid of `<Skeleton>` placeholders matching `VehicleCard` shape.
- Alerts table → row skeletons.
- Trip reports table → row skeletons.

### Accessibility checklist (sweep)

- [ ] All `<img>` have `alt`.
- [ ] All form `<input>` have associated `<Label>`.
- [ ] All icon-only buttons have `aria-label`.
- [ ] Form errors associated via `aria-describedby`.
- [ ] All Radix primitives used (focus trap + ESC out of the box).
- [ ] Color contrast verified for status colors against backgrounds.
- [ ] Color is never the sole conveyor of meaning (always paired with icon + text).
- [ ] Map markers have descriptive `aria-label` on the wrapping element.
- [ ] Keyboard navigation: Tab through all interactive elements; Escape closes modals.
- [ ] `prefers-reduced-motion` respected (CSS handles it).

### Reduced-motion check

If `user.preferences.animations === false` OR `prefers-reduced-motion: reduce`, disable smooth marker animations (`useSmoothPosition` becomes a passthrough).

**SECURITY:**
- a11y indirectly improves security (fewer focus traps; ESC always reachable means user can leave a confusing modal).

---

## STEP 73 — 404 Page, Responsive Review & Final UI Polish

### `NotFoundPage`

Mounted as `notFoundComponent` at `__root.tsx`. Friendly hero:

```tsx
<div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-4 text-center">
  <Compass className="size-16 text-muted-foreground" />
  <h1 className="text-2xl font-semibold">This route doesn't exist</h1>
  <p className="text-muted-foreground">The page you're looking for may have been moved or deleted.</p>
  <Link to="/"><Button>Back to dashboard</Button></Link>
</div>
```

### Responsive sweep

Test breakpoints: 360, 768, 1024, 1440.

| Page | Mobile adaptation |
|---|---|
| Dashboard | Stats grid 2×2 → stacked map full width |
| Vehicle list | Cards 1-col |
| Vehicle detail | Tabs become horizontally scrollable |
| Geofence map | List collapses to drawer trigger button |
| Settings | Side nav → top dropdown |

### Final polish

- Empty states everywhere (no records → friendly hint).
- Consistent spacing via `--app-gap` (set by density class).
- Brand color used purposefully (primary actions only).
- Map height: `calc(100vh - navbar - footer - padding)` so dashboard map fills viewport.

**SECURITY:**
- NotFound doesn't leak path information.

---

# PHASE 20 — Testing

## STEP 74 — Vitest Backend Unit Tests (Auth Service, AlertEngine, Geo Util)

### Setup

Add Vitest config + scripts (STEP 6 already has scripts):

```ts
// vitest.config.ts
export default defineConfig({
  test: {
    environment: 'node',
    globals: false,
    coverage: { provider: 'v8', reporter: ['text', 'lcov'] },
  },
  plugins: [swc.vite()],
});
```

### Test files

| File | Coverage |
|---|---|
| `modules/auth/auth.service.spec.ts` | `hashPassword`, `comparePassword`, token sign/verify round trip, `verifyAndRotateRefresh` (success path, reuse detection, missing user, inactive user, mismatched JTI) |
| `modules/alerts/alert-engine.service.spec.ts` | speed alert with/without debounce, severity calculation, geofence enter/exit diff logic — using mocked `findContaining` |
| `common/utils/geo.util.spec.ts` | `isValidLngLat`, `escapeRegex` |
| `modules/realtime/room-manager.service.spec.ts` | join/leave/broadcast/leaveAll with mock WebSocket objects |

### Mocking strategy

- For services that depend on TypeORM repositories, use `vi.fn()` mocks for repo methods.
- For services that need ConfigService, provide a fake `{ get: (k) => fakeEnv[k] }`.

### Coverage threshold

Set `coverage.thresholds: { lines: 70, functions: 70 }` in vitest config — fail CI under threshold.

**SECURITY:**
- Test inputs include malicious patterns (`$ne` in object, super-long strings) to verify rejection.

---

## STEP 75 — Supertest Integration Tests (Auth Flow + RBAC Matrix + Vehicle CRUD Cascade)

### Setup

Re-install `@nestjs/testing`. Create `vitest.e2e.config.ts` separate config; `npm run test:e2e`.

### Test database

Two options:
- **Docker:** spin up a Postgres+PostGIS container per test run via `testcontainers` (cleanest but slowest).
- **Shared test DB:** use a dedicated `vtracker_test` database, truncate all tables `beforeEach`.

Choose shared test DB for speed; CI uses Docker Compose Postgres service.

### `test/e2e/setup.ts`

```ts
export async function createTestApp(): Promise<INestApplication> {
  const module = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = module.createNestApplication();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  await app.init();
  return app;
}
```

### Test files

| File | Scenarios |
|---|---|
| `auth.e2e.spec.ts` | Register → login → me → refresh (rotation works) → reuse old refresh (revoked) → logout → me (401) |
| `rbac.e2e.spec.ts` | Viewer cannot POST/PATCH/DELETE vehicles. Manager can but only own. Admin can do all. `forbidNonWhitelisted` rejects `role` in register. |
| `vehicles.e2e.spec.ts` | Create vehicle → ingest 3 locations via HTTP fallback → history returns 3 → stats correct → delete vehicle → locations gone (FK cascade) |
| `geofences.e2e.spec.ts` | Create polygon → test point inside → returns true. Create circle → test point in radius → true. |
| `alerts.e2e.spec.ts` | Trigger speed alert via ingest → alert created → list includes it → ack updates audit fields → debounce blocks second within 60s |

### Test data helpers

`createTestUser(role)`, `createTestVehicle({ createdById })`, `loginAsTestUser(role)` returning access token.

**SECURITY:**
- Test secrets isolated in `.env.test`.
- Test DB cleaned between tests (no leakage).

---

## STEP 76 — Vitest + RTL Frontend Component Tests

### Setup

```ts
// vitest.config.ts (client)
export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    globals: false,
  },
});
```

`test/setup.ts`:

```ts
import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => cleanup());
```

### Test files

| File | Coverage |
|---|---|
| `routes/login.test.tsx` | Renders form; invalid email shows error; submit success → redirect; 401 → generic error inline |
| `routes/register.test.tsx` | Mismatched passwords → error; success → auto-login |
| `components/vehicles/VehicleForm.test.tsx` | Validators fire; submit calls service with whitelisted fields; photo upload mocked |
| `context/auth.context.test.tsx` | refresh-on-mount happy path; refresh failure → user null; 401 event triggers logout |
| `stores/live-vehicles.store.test.ts` | upsert; setStatus; selector hook returns correct slice |
| `hooks/use-smooth-position.test.ts` | Interpolates between two points; respects duration |

### Mocking strategy

- `vi.mock('@/api/client')` to stub service functions.
- `vi.mock('@/api/ws')` to stub the socket.
- TanStack Router: wrap tests in a `<RouterProvider>` with a memory history and stub routes.

**SECURITY:**
- Tests verify no PII leaks to localStorage.
- Tests verify 401 cleanly logs out.

---

## STEP 77 — Playwright E2E Scenarios

### `playwright.config.ts`

```ts
export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  use: { baseURL: process.env.E2E_BASE_URL || 'http://localhost:5173', trace: 'on-first-retry' },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox',  use: { ...devices['Desktop Firefox'] } },
  ],
  webServer: process.env.CI ? undefined : [
    { command: 'cd ../server && npm run dev', port: 5000, reuseExistingServer: true },
    { command: 'npm run dev',                   port: 5173, reuseExistingServer: true },
  ],
});
```

### Scenarios

| File | Scenario |
|---|---|
| `auth.spec.ts` | Register a new user → land on dashboard. Logout. Login. Logout. |
| `admin.spec.ts` | Login as admin → promote a user to manager → user can now create a vehicle. |
| `vehicle-crud.spec.ts` | Manager creates a vehicle with driver photo and vehicle photo. Edits it. Deletes it (confirm). |
| `simulator.spec.ts` | Start simulator script in background. Dashboard shows markers moving within 5s. Speed spike → alert appears in alerts page. |
| `geofence.spec.ts` | Manager draws a polygon. Test point inside returns true. Simulator vehicle entering triggers `geofence_enter` alert. |
| `export.spec.ts` | Open vehicle detail → history tab → load route → CSV download → assert file content (rows, headers). |
| `settings.spec.ts` | Toggle theme dark → page applies; reload → still dark. Toggle animations off → marker movement stops being smooth. |

### Test data

A `beforeAll` step in each spec calls `cd ../server && npm run seed:test` to seed a known admin/manager/viewer trio.

**SECURITY:**
- E2E credentials kept in `.env.test`; never logged.
- Test DB scoped (do not run against production).

---

# PHASE 21 — Observability

## STEP 78 — Sentry Integration (Server + Client + Source Maps + PII Redaction)

### Server (`server/src/instrumentation.ts`)

Imported at the very top of `main.ts` (before any other imports — Sentry's preferred init order):

```ts
import * as Sentry from '@sentry/nestjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  beforeSend(event) {
    if (event.request?.headers) {
      delete event.request.headers.authorization;
      delete event.request.headers.cookie;
    }
    if (event.request?.data && typeof event.request.data === 'object') {
      const data = event.request.data as Record<string, unknown>;
      for (const key of ['password', 'currentPassword', 'newPassword', 'refreshToken']) {
        if (key in data) data[key] = '[redacted]';
      }
    }
    return event;
  },
});
```

Then `import { SentryModule } from '@sentry/nestjs/setup';` in `app.module.ts` imports.

### Client (`client/src/instrumentation.ts`)

```ts
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: env.SENTRY_DSN,
  environment: import.meta.env.MODE,
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0.5,
  integrations: [
    Sentry.tanstackRouterBrowserTracingIntegration(router),
    Sentry.replayIntegration({ maskAllText: true, blockAllMedia: true }),
  ],
  beforeSend(event) {
    if (event.request?.headers) delete (event.request.headers as any).Authorization;
    return event;
  },
});
```

### Source maps

`@sentry/vite-plugin` configured to upload source maps during build when `SENTRY_AUTH_TOKEN` env is present (CI only). After upload, delete `*.map` files from `dist/` so they aren't served publicly.

### Error boundary

At `__root.tsx`, wrap with `Sentry.ErrorBoundary` to capture render errors.

**SECURITY:**
- `Authorization`, `cookie`, password fields redacted.
- Replay masks all text + blocks media (no PII leak).
- 10% trace sampling (cost + privacy).
- Source maps deleted post-upload.

---

## STEP 79 — Pino Logger + Better Stack Transport + Redaction Paths

### Pino transport configuration

Update STEP 6's `LoggerModule.forRoot` to add Better Stack transport in production:

```ts
LoggerModule.forRoot({
  pinoHttp: {
    level: env.LOG_LEVEL || 'info',
    transport: env.NODE_ENV === 'production'
      ? {
          targets: [
            { target: '@logtail/pino', options: { sourceToken: env.LOGTAIL_TOKEN } },
            { target: 'pino/file', options: { destination: 1 } }, // stdout for Railway logs
          ],
        }
      : { target: 'pino-pretty', options: { singleLine: true } },
    redact: {
      paths: [
        'req.headers.authorization',
        'req.headers.cookie',
        'req.body.password',
        'req.body.currentPassword',
        'req.body.newPassword',
        'req.body.refreshToken',
        'res.headers["set-cookie"]',
      ],
      remove: true,
    },
    autoLogging: { ignore: (req) => req.url === '/api/health' || req.url?.startsWith('/ws/') },
    customLogLevel: (req, res, err) => {
      if (res.statusCode >= 500 || err) return 'error';
      if (res.statusCode >= 400) return 'warn';
      return 'info';
    },
  },
});
```

### Env

Add `LOGTAIL_TOKEN` to env validation (optional in dev, required in production if Better Stack used).

### Log levels per environment

| Env | Default level |
|---|---|
| development | `debug` |
| test | `silent` |
| production | `info` |

### Request ID correlation

Pino-http auto-generates `req.id`. Use it in `AllExceptionsFilter` so error responses can include `requestId` for support.

**SECURITY:**
- All sensitive headers/body paths redacted **and removed** (not just masked — actually deleted from log JSON).
- Health and WebSocket endpoints excluded from auto-logging (noise reduction).
- 5xx logged at error, 4xx at warn, others info.

---

# PHASE 22 — Documentation & Cleanup

## STEP 80 — README, Architecture Diagram, API Tables & WebSocket Protocol Docs

### `README.md` outline

1. **Title + badges + demo GIF placeholder.**
2. **Architecture diagram (mermaid):**

```mermaid
flowchart LR
  D[GPS Device / Simulator] -- location_update --> WS1[ws://api/ws/vehicles]
  WS1 --> Ingest[LocationIngestionService]
  Ingest --> DB[(PostgreSQL + PostGIS)]
  Ingest --> Engine[AlertEngine]
  Ingest --> Aggregator[TripAggregator]
  Engine --> Room[RoomManager]
  Aggregator --> Room
  Room --> WS2[ws://api/ws/dashboard]
  WS2 --> Client[TanStack Start SPA]
  Client -- REST --> API[NestJS REST]
  API --> DB
```

3. **Features list.**
4. **Tech stack badges.**
5. **Roles & Permissions table.**
6. **API endpoints table** (grouped by resource).
7. **WebSocket protocol** documentation:
   - `/ws/vehicles` endpoint: auth via `X-Simulator-Key` header. Events: `location_update` (in).
   - `/ws/dashboard` endpoint: auth via `Sec-WebSocket-Protocol` JWT. Events: `subscribe`, `unsubscribe` (in); `vehicle:update`, `vehicle:status`, `alert:new`, `geofence:event` (out). Each event's payload shape.
8. **Folder structure** snippet.
9. **Getting started:**
   - Prereqs: Node 20+, Postgres 16 (or Supabase), Cloudinary account.
   - Clone, `cd server && npm i && cp .env.example .env`.
   - `npm run mig:run` (server).
   - `npm run seed` (server).
   - `cd ../client && npm i && cp .env.example .env`.
   - `npm run dev` (server), `npm run dev` (client), `npm run simulate` (server) — three terminals.
10. **Simulator section** — env vars and bbox config.
11. **Security section** — summary of audit checklist.
12. **Future migration to TimescaleDB** — `create_hypertable` snippet.
13. **Deployment** (links to STEP 86).
14. **License** (MIT).

**SECURITY:**
- No real secrets in README.
- Demo GIF should be recorded with test data only.

---

## STEP 81 — Code Cleanup, .env.example Sync & Pre-Deploy Audit

### Cleanup steps

| Item | Tool/Method |
|---|---|
| Remove `console.log` | `rg "console\.(log\|debug)"` in source; replace with pino calls or remove |
| Remove unused imports | `biome check . --apply` |
| Remove unused dependencies | `npx depcheck` (or manual `package.json` review) |
| `.env.example` sync | Diff `.env` keys vs `.env.example`; ensure no missing or extra |
| Hard-coded secrets audit | `rg "secret\|password\|token" --type ts` to spot-check |
| `npm audit --production` | Resolve high/critical |
| Test coverage threshold | Run `npm test -- --coverage`; ensure ≥70% lines |
| All routes have guards or `@Public()` | Manual review |
| All controllers have DTOs (no `any`) | grep for `@Body() body: any` |
| No `synchronize: true` anywhere | `rg "synchronize.*true"` |
| All entities have migrations | List `src/modules/**/*.entity.ts` and confirm migration files |
| Mongoose 9 hook pattern | N/A (TypeORM here, but verify no leftover Mongoose patterns from prototypes) |
| Express 5 safety | N/A (NestJS 10 abstracts Express 5 / 4 — but confirm `@nestjs/platform-express` version) |

### Build artifacts

| Path | State |
|---|---|
| `server/dist/` | Cleanly built; no `.test.js` or `.spec.js` |
| `client/dist/` | Source maps uploaded to Sentry then deleted (production) |
| `node_modules/` | Excluded from any zip / archive |

**SECURITY:**
- One final spot-check for any `*.env*` file accidentally committed.

---

# PHASE 23 — Deployment

## STEP 82 — Supabase Project Setup, PostGIS Enabling & Connection Strings

### Create project

1. Sign in to supabase.com → New Project.
2. Name: `vtracker-prod` (or similar). Region: closest to user base.
3. Set a **strong database password** (24+ random chars; manage via Doppler or 1Password — never in plain text).

### Enable extensions

Supabase Dashboard → Database → Extensions → toggle:
- `postgis` (required)
- `pgcrypto` (typically pre-enabled, but verify)

### Connection strings

Supabase exposes three strings:

| Mode | Port | Use case |
|---|---|---|
| Direct connection | 5432 | Migrations (long-running, prepared statements) |
| Session pooler | 6543 | Same as direct, via PgBouncer in session mode |
| Transaction pooler | 6543 | App runtime (highest concurrency; no prepared statements) |

For TypeORM:
- **Migrations:** use **direct** connection.
- **App runtime:** use **transaction pooler** (most efficient for many short queries).

Document both in README; configure Railway env via toggling `DATABASE_URL` for migrations vs runtime if needed (or keep direct for both — small fleet doesn't need pooling).

> **TimescaleDB note:** Supabase does NOT offer TimescaleDB. If/when needed, migrate to **Timescale Cloud** or self-host. The `Location` schema is already future-proof.

**SECURITY:**
- DB password not stored in version control.
- IP allowlist: Supabase by default allows all; for production tighten via Network restrictions (allow only Railway egress IPs once known).
- Force SSL on connection string (`?sslmode=require`).

---

## STEP 83 — Railway Backend Deployment (Build / Start / Env Variables)

### Create service

1. railway.app → New Project → Deploy from GitHub repo.
2. Configure root: `server/`.
3. **Build command:** `npm install && npm run build`.
4. **Start command:** `node dist/main.js`.
5. **Watch paths:** `server/**` only.

### Environment variables (Railway dashboard)

| Variable | Value source |
|---|---|
| `NODE_ENV` | `production` |
| `PORT` | (Railway injects automatically; do not set) |
| `DATABASE_URL` | from Supabase direct or pooler |
| `JWT_ACCESS_SECRET` | `openssl rand -hex 48` |
| `JWT_REFRESH_SECRET` | `openssl rand -hex 48` (different from access) |
| `JWT_ACCESS_TTL` | `15m` |
| `JWT_REFRESH_TTL` | `7d` |
| `CLIENT_URL` | `https://<your-vercel-domain>.vercel.app` (no trailing slash) |
| `CLOUDINARY_CLOUD_NAME` | from Cloudinary dashboard |
| `CLOUDINARY_API_KEY` | |
| `CLOUDINARY_API_SECRET` | |
| `SIMULATOR_API_KEY` | `openssl rand -hex 32` |
| `SPEED_LIMIT_KMH` | `90` |
| `IDLE_THRESHOLD_MIN` | `10` |
| `TRIP_END_MIN` | `5` |
| `SENTRY_DSN` | from Sentry project |
| `LOGTAIL_TOKEN` | from Better Stack source |
| `LOG_LEVEL` | `info` |
| `ADMIN_EMAIL` | (for seed only — remove after first seed) |
| `ADMIN_PASSWORD` | |
| `ADMIN_NAME` | |

### Health check

Configure Railway's health check: `GET /api/health` → expect 200. Used for deploy gating.

### Custom domain (optional)

Add a custom domain via Railway → Settings → Domains. Update `CLIENT_URL` on Vercel to match.

**SECURITY:**
- All secrets in Railway env (never in source).
- Strong randomized JWT secrets and simulator key.
- `CLIENT_URL` is the only allowed CORS origin.

---

## STEP 84 — Production Migrations & Initial Admin Seed

### Migrate

After first Railway deploy completes:

1. Open Railway shell for the backend service.
2. Run `npm run mig:run`.
3. Verify in Supabase Dashboard → Tables that all tables and extensions exist.

### Seed admin

Still in Railway shell:

1. Ensure `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME` are set as env vars (already set in STEP 83).
2. Run `npm run seed`.
3. Verify by `SELECT id, email, role FROM "user" WHERE role = 'admin';` in Supabase SQL editor.
4. **After seeding,** remove `ADMIN_PASSWORD` from Railway env (no longer needed, reduces leak surface).

### Migration safety in CI/CD

Set up an explicit "migration job" before each deploy:

- Option A: Add `npm run mig:run` to start command (`npm run mig:run && node dist/main.js`).
- Option B: Run migrations manually via shell after each schema change.

Document Option B (safer for early-stage); Option A is convenient but risky if migration is breaking.

**SECURITY:**
- Admin password removed from env after seed.
- Migrations idempotent (safe to run repeatedly).
- Each migration reviewable in source.

---

## STEP 85 — Vercel Frontend Deployment (SPA Fallback + Env Variables)

### Create project

1. vercel.com → New Project → import from GitHub.
2. Root directory: `client/`.
3. Framework preset: **Other** (TanStack Start outputs Vite bundle).
4. Build command: `npm run build`.
5. Output directory: `dist`.
6. Install command: `npm install`.

### Environment variables

| Variable | Value |
|---|---|
| `VITE_API_URL` | `https://<railway-domain>.up.railway.app/api` |
| `VITE_WS_URL` | `wss://<railway-domain>.up.railway.app` (note `wss://` not `ws://`) |
| `VITE_MAP_STYLE_URL` | `https://tiles.openfreemap.org/styles/liberty` |
| `VITE_SENTRY_DSN` | Sentry client DSN |
| `SENTRY_AUTH_TOKEN` | (build-time only) for source map upload |

### SPA fallback

`vercel.json` at project root:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/" }
  ]
}
```

This ensures client-side routes (e.g. `/vehicles/abc-123`) fall back to `index.html`.

### Custom domain (optional)

Add domain via Vercel → Settings → Domains. Update Railway's `CLIENT_URL` to match.

### Preview deploys

Vercel auto-creates preview URLs for every PR. **Important:** preview URLs differ from production → CORS will reject them. Two options:

- **Whitelist a wildcard:** `CLIENT_URL=https://*.vercel.app` (less secure; document trade-off).
- **Use preview-specific env:** Vercel can set env per environment (Production vs Preview); pair with Railway preview environments.

Recommend keeping production strict; use a separate preview Railway environment.

**SECURITY:**
- `wss://` enforced in production (no plain WebSocket).
- Sentry DSN is public-safe.
- SPA rewrite doesn't leak server paths.

---

## STEP 86 — GitHub Actions CI Pipeline & Post-Deploy Verification

### `.github/workflows/ci.yml`

| Job | Steps |
|---|---|
| `server-lint-test` | Checkout → Node 20 → `cd server && npm ci && npm run lint && npm test` |
| `client-lint-test` | Checkout → Node 20 → `cd client && npm ci && npm run lint && npm test` |
| `e2e` (main + PR) | Service: Postgres+PostGIS Docker image → run server migrations → start server & client → `npx playwright install && npx playwright test` |

### Example service config

```yaml
services:
  postgres:
    image: postgis/postgis:16-3.4
    env:
      POSTGRES_USER: test
      POSTGRES_PASSWORD: test
      POSTGRES_DB: vtracker_test
    ports: ['5432:5432']
    options: >-
      --health-cmd pg_isready
      --health-interval 10s
      --health-timeout 5s
      --health-retries 5
```

### Branch protection

- Require status checks to pass before merge.
- Require PR review.
- No force-push to `main`.

### Post-deploy verification

Run the full functional + security checklist (from STEP 40 + manual flows):

**Functional:**
- [ ] Register viewer → land on dashboard.
- [ ] Seeded admin login → admin pages accessible.
- [ ] Admin promotes user to manager.
- [ ] Manager creates vehicle with photo uploads.
- [ ] `npm run simulate` pointed at production with prod `SIMULATOR_API_KEY` → markers appear and move smoothly.
- [ ] Speed spike triggers speed alert in dashboard + alerts page.
- [ ] Polygon geofence created; simulator vehicle entering triggers `geofence_enter` alert.
- [ ] History tab loads polyline for past range.
- [ ] CSV + GeoJSON export download correctly.
- [ ] Trip reports show daily summaries.
- [ ] Heatmap renders.
- [ ] Settings → Appearance toggles apply instantly (theme, font, density, animations).
- [ ] Logout clears refresh cookie; refresh page → redirected to login.

**Security:**
- [ ] Rate limiting active (rapid login attempts blocked).
- [ ] CORS blocks unknown origin (test via curl with bogus `Origin` header).
- [ ] Production error responses hide stack traces.
- [ ] Helmet headers present (`curl -I https://api...` shows them).
- [ ] SQL injection attempt (`email[$ne]=`) → 400 (`forbidNonWhitelisted`).
- [ ] XSS attempt stored as plain text and rendered escaped.
- [ ] Role escalation blocked: viewer's `PATCH /auth/me` with `role:'admin'` → 400.
- [ ] Unauthenticated REST → 401.
- [ ] WebSocket `/ws/vehicles` rejects without `X-Simulator-Key` (close 4001).
- [ ] WebSocket `/ws/dashboard` rejects without valid JWT (close 4001).
- [ ] Last-admin protection: try to demote only admin → 400.
- [ ] Vehicle delete cascades Locations / Trips / Alerts.
- [ ] `x-powered-by` absent.
- [ ] File upload rejects `.exe` renamed to `.png`.
- [ ] Refresh token rotation: reusing old refresh after rotation → 401 + all sessions revoked.
- [ ] Sentry events captured but Authorization / cookie / password redacted.
- [ ] Source maps not served publicly (404 on `*.map` URL).

---

**End of guide.** This STEPS.md is the single source of truth for building the Vehicle Tracking System on a NestJS + PostgreSQL/PostGIS + TanStack Start stack. Execute steps in order; each is self-contained, has explicit specifications, and includes the security context required for its scope. **Total: 86 steps across 23 phases.**
