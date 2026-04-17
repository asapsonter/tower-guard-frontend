# Tower Guard Sentinel

**A telecom mast security platform for Nigeria** — built as a Bun + Turborepo monorepo of 4 independently deployable React apps that share one FastAPI backend, one Supabase database, and a HikVision AX Pro alarm panel integration.

> **New to this codebase?** Start with [§1 Quick Orientation](#1-quick-orientation), then [§4 Local Setup](#4-local-setup). For the visual architecture overview see `docs/Tower_Guard_Flowchart.pdf`. For naming conventions see [`NAMING_CONVENTIONS.md`](./NAMING_CONVENTIONS.md).

---

## Table of Contents

1. [Quick Orientation](#1-quick-orientation)
2. [Repository Layout](#2-repository-layout)
3. [System Architecture](#3-system-architecture)
4. [Local Setup](#4-local-setup)
5. [Environment Variables](#5-environment-variables)
6. [Running the Apps](#6-running-the-apps)
7. [Backend Reference](#7-backend-reference)
8. [Frontend Apps](#8-frontend-apps)
9. [Shared Packages](#9-shared-packages)
10. [Auth & Roles](#10-auth--roles)
11. [Database & Supabase](#11-database--supabase)
12. [External Integrations](#12-external-integrations)
13. [Development Workflow](#13-development-workflow)
14. [Testing](#14-testing)
15. [Deployment](#15-deployment)
16. [Known Issues & Caveats](#16-known-issues--caveats)
17. [Troubleshooting](#17-troubleshooting)
18. [Handover Checklist](#18-handover-checklist)

---

## 1. Quick Orientation

| Question | Answer |
|---|---|
| What does this do? | Monitors 380+ telecom masts across Nigeria for intrusion, tampering, power failures, and dispatches NSCDC responders Uber-style. |
| Who uses it? | Four user types: Telecom operators, NSCDC station commanders, NSCDC field officers (mobile), and NCC regulators. |
| How is it shaped? | Monorepo. Four React apps share code via `packages/*`. One FastAPI backend serves all four. |
| What's the hardware in the loop? | HikVision AX Pro alarm panel, RTSP IP cameras, NVIDIA DeepStream (optional AI inference), Twilio (SMS). |
| What's the persistence layer? | Supabase (Postgres + Storage + Realtime). Redis for WebSocket pub/sub and rate limiting. |
| How do alerts move? | AX Pro panel → backend polling loop → Redis pub/sub → WebSocket → React `useSimulation` hook → UI. |
| What's half-done? | The monorepo migration. Legacy `src/` lives alongside new `apps/*`. See [§16](#16-known-issues--caveats). |

```
                    HikVision AX Pro  •  IP Cameras  •  Twilio  •  DeepStream
                                           │
                                           ▼
                               ┌──────────────────────────┐
                               │   FastAPI  (port 5050)   │
                               │   • REST   /api/*        │
                               │   • WS     /ws/alerts    │
                               │   • JWT auth             │
                               │   • Redis pub/sub        │
                               │   • Supabase client      │
                               └────────────▲─────────────┘
                                            │
       ┌─────────────────┬──────────────────┼──────────────────┬────────────────┐
       │                 │                  │                  │                │
┌──────▼──────┐  ┌───────▼───────┐  ┌───────▼────────┐  ┌──────▼─────────┐
│ Tower Guard │  │ NSCDC Station │  │ NCC Monitoring │  │ Field App PWA  │
│ Site        │  │ Dashboard     │  │ Dashboard      │  │ (mobile)       │
│ port 5173   │  │ port 5174     │  │ port 5175      │  │ port 5176      │
│ telecom_    │  │ nscdc_command │  │ ncc_regulator  │  │ nscdc_responder│
│ admin       │  │               │  │ (read-only)    │  │                │
└─────────────┘  └───────────────┘  └────────────────┘  └────────────────┘
```

---

## 2. Repository Layout

```
telecom_mast/
├── apps/                           ← 4 independently deployable React apps
│   ├── dashboard-main/             ← @tower-guard/dashboard-main   (telecom_admin)
│   ├── dashboard-nscdc/            ← @tower-guard/dashboard-nscdc  (nscdc_command)
│   ├── dashboard-ncc/              ← @tower-guard/dashboard-ncc    (ncc_regulator)
│   └── app-field/                  ← @tower-guard/app-field        (nscdc_responder, PWA)
│
├── packages/                       ← Shared workspace packages
│   ├── ui/                         ← shadcn/ui primitives + flow-monitor
│   ├── data/                       ← Types, mock data, Nigeria geo, Supabase types
│   ├── hooks/                      ← useSimulation, useDispatchSimulation, useRoleGuard, …
│   ├── api-client/                 ← Typed REST + WebSocket client
│   ├── supabase-client/            ← Initialised Supabase client + env validation
│   └── config/                     ← Shared Tailwind preset, tsconfig presets
│
├── backend/                        ← FastAPI application (single shared backend)
│   ├── axpro.py                    ← HikVision AX Pro singleton + polling loop
│   ├── routes.py                   ← REST: /api/alarm/*, /api/masts, /api/dispatch, /health
│   ├── websocket.py                ← /ws/alerts, /ws/site/{id}, Redis pub/sub bridge
│   ├── auth.py                     ← JWT + DEMO_USERS (hardcoded accounts, 4 roles)
│   ├── redis_client.py             ← 3 async Redis clients (text, binary, deepstream)
│   ├── cameras.py                  ← RTSP frame poller, HTTP snapshot fallback
│   ├── incidents.py                ← In-memory incident log + snapshot capture
│   ├── sms.py                      ← Twilio SMS dispatcher
│   ├── deepstream.py               ← (removed from import graph; file retained)
│   ├── models.py                   ← Pydantic request/response models
│   ├── rate_limit.py               ← Redis-backed rate limiter
│   └── config.py                   ← Environment variable loading + DEMO_USERS
│
├── supabase/
│   └── migrations/                 ← SQL migrations (RLS policies live here)
│
├── src/                            ← ⚠️  LEGACY single-app frontend (still in .env CORS)
├── local_storage/                  ← Snapshots, videos, plates, images (gitignored content)
├── public/                         ← Static assets for the main app
├── docs/                           ← Generated documentation (PDF flowchart lives here)
│
├── main.py                         ← FastAPI entrypoint (telecom_mast/main.py, NOT backend/)
├── start_backend.sh                ← One-shot backend bring-up
├── start_frontend.sh               ← One-shot frontend bring-up (dashboard-main)
├── requirements.txt                ← Python dependencies
├── package.json                    ← Root workspace manifest (bun workspaces)
├── turbo.json                      ← Turborepo pipeline config
├── tsconfig.base.json              ← Shared TypeScript config
├── README.md                       ← ← you are here
├── NAMING_CONVENTIONS.md           ← Naming rules for Python + TypeScript
├── Tower_Guard_Architecture.md     ← Exhaustive architecture doc (Mermaid diagrams)
├── BACKEND_INTEGRATION.md          ← Integration notes (legacy)
├── MONOREPO_MIGRATION_PROMPT.md    ← LLM prompt for finishing the migration
└── docs/Tower_Guard_Flowchart.pdf  ← Downloadable visual flowchart (this commit)
```

---

## 3. System Architecture

### 3.1 Request / response flow (REST)

```
Browser ──HTTP──▶ FastAPI /api/*
                      │
                      ├── auth.get_current_user (JWT validation)
                      ├── route handler
                      │       │
                      │       ├── asyncio.to_thread(hikaxpro call)     (alarm endpoints)
                      │       ├── supabase.storage.upload()            (upload endpoints)
                      │       └── in-memory mock (most /api/* today)
                      │
                      └── Pydantic response model → JSON
```

### 3.2 Realtime flow (AX Pro sensors → UI)

```
HikVision AX Pro panel (LAN)
     │ hikaxpro Python lib (sync HTTP)
     │ asyncio.to_thread()
     ▼
backend/axpro.py
   • Module-level singleton `axpro_client`
   • axpro_polling_loop() — polls every 2s
   • Diffs zone_status, host_status, siren_status
   • Emits message types:
       zone_alarm, tamper_alarm, siren_alarm, system_status
     │
     ▼ broadcast_alert()
Redis pub/sub channel "alerts"
     │
     ▼ redis_subscriber() task
active_websockets: List[WebSocket]
     │
     ▼ /ws/alerts
packages/api-client/src/websocket.ts → connectWebSocket()
     │
     ▼
packages/hooks/src/useSimulation.ts
     │
     ▼
React UI (sensor wall, alert feed, AlarmControls)
```

### 3.3 Dispatch flow (Uber analogy)

| Tower Guard concept | Uber equivalent |
|---|---|
| Main Dashboard detects intruder | Rider requests a ride |
| `/api/dispatch` creates assignment | Dispatch matching algorithm |
| NSCDC Station Dashboard monitors | Uber HQ operations view |
| Field App accepts / rejects | Driver accepts trip |
| GPS + status updates | Real-time driver tracking |
| SLA timer (Optimal / Warning / Critical) | ETA |
| Evidence upload | Trip photos / receipts |
| NCC Dashboard | Transport regulator |

For full sequence diagrams see `Tower_Guard_Architecture.md` §6.

### 3.4 Three-layer authorization (defense in depth)

1. **Frontend `useRoleGuard`** — redirects wrong-role users to their home app
2. **Backend `Depends(get_current_user)` + role checks** — rejects with 403
3. **Supabase RLS policies** — row-level rejection at the database layer

All three layers must pass for a request to succeed. Don't remove any of them.

---

## 4. Local Setup

### Prerequisites

| Tool | Version | Install |
|---|---|---|
| Bun | 1.3+ | `curl -fsSL https://bun.sh/install \| bash` |
| Python | 3.10+ | pyenv / system |
| Redis | 6+ | `brew install redis && brew services start redis` |
| Supabase account | — | https://supabase.com (free tier works) |
| Git | 2.30+ | — |

Optional but recommended for full functionality:
- **HikVision AX Pro** alarm panel with LAN access (alarm features)
- **Twilio** account (SMS alerts)
- **RTSP-capable IP cameras** (live video feeds)
- **NVIDIA Jetson + DeepStream** (on-site AI inference — optional)

### One-shot bring-up

```bash
# Clone
git clone <repo-url> telecom_mast
cd telecom_mast

# Copy env template and fill in credentials
cp .env.example .env
# Edit .env (see §5 for required vars)

# Python venv + deps
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Bun deps for all workspaces
bun install

# Terminal 1 — backend
./start_backend.sh                 # → http://localhost:5050, docs at /docs

# Terminal 2 — frontend (main dashboard)
./start_frontend.sh                # → http://localhost:5173
```

That's it for a basic dev loop. For running multiple apps in parallel, see [§6](#6-running-the-apps).

---

## 5. Environment Variables

All secrets live in `.env` at the repo root. Copy `.env.example` as a starting point. The file is loaded by:

- `start_backend.sh` via `set -a; source .env; set +a`
- Vite (frontend) automatically for any var prefixed with `VITE_`

### Required (backend fails to boot without these)

| Variable | Purpose |
|---|---|
| `SECRET_KEY` | JWT signing key. Generate with `openssl rand -hex 32`. |
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Service-role key (bypasses RLS — never expose to frontend) |
| `SUPABASE_BUCKET` | Storage bucket for snapshots/videos (e.g. `tower_demo_payload`) |

### Required (frontend fails to boot without these)

| Variable | Purpose |
|---|---|
| `VITE_API_BASE_URL` | Backend URL, e.g. `http://localhost:5050` |
| `VITE_SUPABASE_URL` | Public Supabase URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Anon/publishable key (RLS-enforced — safe for browser) |
| `VITE_SUPABASE_PROJECT_ID` | For `bun run types:generate` |

### Optional — degrades gracefully

| Variable | Feature when set | Behavior when missing |
|---|---|---|
| `AXPRO_HOST` / `AXPRO_USERNAME` / `AXPRO_PASSWORD` | Live alarm panel integration | Arm/disarm endpoints return 503, no sensor polling |
| `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_FROM_NUMBER` | Outbound SMS alerts | SMS calls logged-only, no delivery |
| `SMS_ALERT_NUMBERS` | Comma-separated recipient list | No recipients, SMS skipped |
| `RTSP_URL_1` / `RTSP_URL_2` | Live camera feeds | No frame polling |
| `REDIS_URL` | WebSocket pub/sub, rate limiting | App still boots but with `logger.error` and no WS fan-out |
| `DEEPSTREAM_REDIS_URL` / `DEEPSTREAM_FEED_URL` | AI inference pipeline | DeepStream integration disabled (already removed from main) |
| `DEMO_*_PASSWORD` | Enables that demo login | That account returns 401 |

> **Security** — `.env` is in `.gitignore`. Never commit it. When rotating keys, update `.env`, `.env.example`, and any CI secret store in lockstep.

---

## 6. Running the Apps

From the repo root:

```bash
# Single app
bun run dev                  # dashboard-main    → :5173
bun run dev:nscdc            # dashboard-nscdc   → :5174
bun run dev:ncc              # dashboard-ncc     → :5175
bun run dev:field            # app-field (PWA)   → :5176

# All four in parallel (one terminal)
bun run dev:all

# Build
bun run build                # all apps
bun run build:affected       # only apps whose inputs changed since origin/main

# Static checks
bun run type-check
bun run lint
bun run test

# Regenerate Supabase types
bun run types:generate       # rewrites packages/data/src/supabase-types.ts

# Nuke and reinstall
bun run clean && bun install
```

**Backend always runs separately** — it's not orchestrated by Turbo:

```bash
./start_backend.sh           # → :5050 with hot reload (uvicorn --reload)
```

Docs are at `http://localhost:5050/docs` (Swagger) and `/redoc`.

---

## 7. Backend Reference

### 7.1 Entrypoint

`main.py` at the repo root is the FastAPI entrypoint. (Note: **not** `backend/main.py`.) It:

1. Retries Redis connection 3× with exponential backoff
2. Starts background tasks: `axpro_polling_loop`, `redis_subscriber`, per-camera frame pollers
3. Mounts static file routes: `/images`, `/snapshots`, `/videos`, `/plates`
4. Applies CORS (per-environment allowlist — no wildcards)
5. Includes routers from `backend/`

### 7.2 REST endpoints

All REST endpoints (except `/health` and uploads) require `Authorization: Bearer <jwt>`.

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/auth/login` | Issue JWT for a DEMO user |
| `GET` | `/api/alerts` | List alerts (mocked) |
| `GET` | `/api/masts` | List masts (mocked) |
| `GET` | `/api/masts/{id}` | Mast detail (mocked) |
| `GET` | `/api/masts/{id}/telemetry` | Latest telemetry (mocked) |
| `GET` | `/api/events` | List events (mocked) |
| `POST` | `/api/dispatch` | Create dispatch assignment |
| `GET` | `/api/reports` | List reports (mocked) |
| `POST` | `/api/reports` | Create report |
| `GET` | `/api/sites/{id}/energy` | Current energy snapshot (mocked) |
| `GET` | `/api/sites/{id}/energy/history` | Energy history (mocked) |
| `POST` | `/api/alarm/arm` | Arm AX Pro (away mode) |
| `POST` | `/api/alarm/disarm` | Disarm AX Pro |
| `GET` | `/api/sites/{id}/sensors` | Sensors at site (mocked) |
| `GET` | `/api/incidents` | In-memory incident log (real) |
| `POST` | `/upload/sensor` | Upload base64 image from DeepStream |
| `POST` | `/upload/raw_image` | Upload raw binary image |
| `GET` | `/api/test-sms` | Twilio round-trip smoke test |
| `GET` | `/health` | Health check — no auth required |

### 7.3 WebSocket endpoints

| Path | Purpose |
|---|---|
| `/ws/alerts` | Subscribe to all backend-emitted alerts (fan-out via Redis) |
| `/ws/site/{site_id}` | Per-site telemetry stream (currently returns mock data) |

Message types emitted on `/ws/alerts`:

| Type | Source | Payload shape |
|---|---|---|
| `system_status` | AX Pro polling loop (every 2s) | `{ host_status, siren_status }` |
| `zone_alarm` | AX Pro zone state change | `{ zone_id, zone_name, status, previous_status, full_sensor_data, snapshots[] }` |
| `tamper_alarm` | AX Pro tamper state change | `{ zone_id, zone_name, tamper_status, previous_tamper_status, snapshots[] }` |
| `siren_alarm` | AX Pro siren state change | `{ siren_status, previous_status }` |
| `ai_detection` | DeepStream consumer (currently disabled) | `{ threat_type, sensor_id, description, object_id }` |

### 7.4 File modules at a glance

| File | Key exports |
|---|---|
| `axpro.py` | `axpro_client` (module-level), `axpro_polling_loop()`, `_try_connect()` |
| `routes.py` | `router` (APIRouter) — all `/api/*` REST routes |
| `websocket.py` | `router`, `broadcast_alert(payload)`, `redis_subscriber()`, `active_websockets` |
| `auth.py` | `router` (auth endpoints), `get_current_user` dependency |
| `config.py` | All env var constants, `DEMO_USERS`, `supabase` client |
| `cameras.py` | `router`, `camera_frame_poller(camera_id)` |
| `incidents.py` | `incidents_log` (in-memory), `record_incident()`, `capture_all_snapshots()` |
| `sms.py` | `send_sms_alert(zone, alarm_type, status)` |
| `redis_client.py` | `redis_client`, `redis_binary`, `redis_deepstream`, `close_all()` |

---

## 8. Frontend Apps

Each app under `apps/*` follows the same structure:

```
apps/<app>/
├── index.html
├── package.json            ← only workspace deps + React
├── tsconfig.json           ← extends @tower-guard/config/tsconfig/vite
├── vite.config.ts          ← port, aliases, PWA plugin (field only)
├── tailwind.config.ts      ← extends @tower-guard/config/tailwind/preset
├── postcss.config.js
├── public/
└── src/
    ├── main.tsx            ← entrypoint, providers
    ├── App.tsx             ← router (no role gates inside)
    ├── env.ts              ← runtime env var accessor
    ├── index.css           ← Tailwind directives + theme vars
    ├── components/
    ├── pages/
    └── lib/
```

### 8.1 Tower Guard Site Dashboard — `apps/dashboard-main`

Role: `telecom_admin`. Port: 5173.

Pages: `Index`, `LiveMonitoring`, `Inventory`, `SmartMonitoring`, `Incidents`, `ZonalCenters`, `History`, `Reports`, `NationalCoverage`, `MastDashboard/:id`, `GeoLocation`, `Login`.

Key components: `AppSidebar`, `NavLink`, plus `dashboard/` and `inventory/` subtrees. Uses `useSimulation()` for live sensor data and falls back to `mockSensors` / `mockTelecomMasts` from `@tower-guard/data` when the WebSocket is offline.

### 8.2 NSCDC Station Dashboard — `apps/dashboard-nscdc`

Role: `nscdc_command`. Port: 5174. Login is a **station entity**, not an individual — one account per station.

Surfaces the dispatch command center: live responder roster, assignment board, SLA timers, comms monitor, evidence gallery, accountability reports. Uses `useDispatchSimulation()` (gated by role — disabled for non-NSCDC roles).

### 8.3 NCC Monitoring Dashboard — `apps/dashboard-ncc`

Role: `ncc_regulator`. Port: 5175. **Read-only** regulator view — no write endpoints, no dispatch controls.

Aggregate analytics, compliance reports (exportable PDF/CSV), zone-vs-zone benchmarking.

### 8.4 Field App — `apps/app-field`

Role: `nscdc_responder`. Port: 5176. **Mobile-first PWA** — the only app that ships a Service Worker.

Has an `offline/` module with IndexedDB queue (via `idb`) for evidence/messages captured while disconnected. Bundle budget 150 KB (currently ~260 KB — framer-motion is the largest contributor, lazy-load is a TODO).

---

## 9. Shared Packages

| Package | What lives here | Don't put in here |
|---|---|---|
| `@tower-guard/ui` | shadcn primitives, `cn()`, `useToast`, `useIsMobile`, `flow-monitor` | App-specific components, business logic |
| `@tower-guard/data` | Types (`Alert`, `Sensor`, `AppRole`, `TelecomMast`), mock data, Nigeria geo, Supabase types | React components, hooks |
| `@tower-guard/hooks` | `useAuth`, `useTheme`, `useSimulation`, `useDispatchSimulation`, `useRoleGuard`, `useAlertDispatchBridge`, `useFlowMonitorSubscriptions` | One-off app hooks, components |
| `@tower-guard/api-client` | `request()`, `getApiBaseUrl()`, `connectWebSocket()`, per-resource endpoint modules (`auth`, `alerts`, `masts`, `dispatch`, `reports`, `incidents`, `alarm`) | UI, state, mock data |
| `@tower-guard/supabase-client` | Initialised client + env validation | Queries (those live in hooks/endpoints) |
| `@tower-guard/config` | Shared Tailwind preset, tsconfig presets (`vite`, `node`, `react-library`, `base`) | Runtime code |

Import shape:

```ts
import { Button } from "@tower-guard/ui";
import { mockSensors, type AppRole } from "@tower-guard/data";
import { useSimulation } from "@tower-guard/hooks";
import { api } from "@tower-guard/api-client";
```

---

## 10. Auth & Roles

### 10.1 Roles

Defined in `packages/data/src/types/app-role.ts`:

```ts
export type AppRole =
  | "telecom_admin"      // Tower Guard Site Dashboard
  | "nscdc_command"      // NSCDC Station Dashboard
  | "nscdc_responder"    // Field App PWA
  | "ncc_regulator";     // NCC Monitoring Dashboard (read-only)
```

### 10.2 Demo logins

Hardcoded in `backend/config.py` → `DEMO_USERS`. Passwords come from the `DEMO_*_PASSWORD` env vars.

| Email | Password env var | `app_role` | Intended app |
|---|---|---|---|
| `admin@towerguard.ng` | `DEMO_ADMIN_PASSWORD` | `telecom_admin` | Main Dashboard |
| `operator@towerguard.ng` | `DEMO_OPERATOR_PASSWORD` | `telecom_admin` | Main Dashboard |
| `nscdc.station@towerguard.ng` | `DEMO_NSCDC_STATION_PASSWORD` | `nscdc_command` | NSCDC Station Dashboard |
| `nscdc.responder@towerguard.ng` | `DEMO_NSCDC_RESPONDER_PASSWORD` | `nscdc_responder` | Field App |
| `ncc.monitoring@towerguard.ng` | `DEMO_NCC_MONITORING_PASSWORD` | `ncc_regulator` | NCC Dashboard |

### 10.3 Token lifecycle

- `POST /api/auth/login` returns a JWT signed with `SECRET_KEY` (HS256).
- The token's payload carries `sub` (email) and `app_role`.
- Frontend stores the JWT in `localStorage` via `useAuth`.
- Each REST call adds `Authorization: Bearer <token>`.
- WebSocket endpoints currently **do not** authenticate — see [§16 bug BUG-2](#16-known-issues--caveats).

---

## 11. Database & Supabase

### 11.1 Supabase usage

| Supabase feature | Used for |
|---|---|
| Postgres | Dispatch assignments, responder messages, SLA logs, locations, user roles, incidents |
| Storage | Uploaded snapshots (`sensor_images/`), raw images (`raw_images/`), evidence (`evidence/`), videos (`videos/`) |
| Realtime channels | NSCDC / Field App live updates (separate from backend WebSocket) |
| RLS policies | Third line of defense for role-based access |

### 11.2 Migrations

All SQL migrations live in `supabase/migrations/`. Current migrations:

```
20260411130000_create_dispatch_schema.sql
```

Apply locally via Supabase CLI:

```bash
supabase db push
```

### 11.3 Entity relationships

See `Tower_Guard_Architecture.md` §7 for the full ER diagram. Core tables:

- `masts` — static site inventory
- `alerts` / `events` / `incidents` — per-site time-series detection records
- `dispatch_assignments` → `dispatch_team_members` → `responder_messages` / `responder_locations` — the dispatch lifecycle
- `response_sla_logs` — per-incident response time buckets (Optimal / Warning / Critical)
- `responder_performance` — aggregated KPIs per officer
- `user_roles` — role + zone + council_area assignments

### 11.4 Regenerating TypeScript types

```bash
bun run types:generate
```

Requires `VITE_SUPABASE_PROJECT_ID` and the Supabase CLI installed. Rewrites `packages/data/src/supabase-types.ts`; all apps pick up changes on next dev restart.

---

## 12. External Integrations

### 12.1 HikVision AX Pro alarm panel

- Library: [`hikaxpro`](https://pypi.org/project/hikaxpro/) (optional import — app degrades gracefully if not installed)
- Client: module-level singleton in `backend/axpro.py`
- Loop: 2-second polling of `zone_status()`, `host_status()`, `siren_status()`
- Emits: `zone_alarm`, `tamper_alarm`, `siren_alarm`, `system_status` on Redis channel `alerts`
- Zones are mapped to friendly names via `ZONE_NAMES` in `config.py`:
  ```py
  ZONE_NAMES = {1: "Vibration Sensor", 2: "PIR Sensor", 3: "Camera 1", 4: "Camera 2"}
  ```
- Retry: on connection-level errors the client is reset to `None` and reconnection is attempted every 30 seconds.

### 12.2 Twilio SMS

- Called from `backend/sms.py` when zone triggers or tamper events fire.
- Cooldown `SMS_COOLDOWN_SECS = 60` in `config.py` prevents flooding for a re-triggering sensor.
- Smoke test: `GET /api/test-sms` sends a one-off message to the first number in `SMS_ALERT_NUMBERS`.

### 12.3 IP cameras (RTSP)

- `IP_CAMERAS` dict in `config.py` maps `camera_id → RTSP URL`.
- `backend/cameras.py` polls each camera via OpenCV and caches frames in Redis binary.
- HTTP snapshot fallback (`CAMERA_HTTP_FALLBACK`) for cameras that don't have a stable RTSP endpoint — currently used for `camera_2`.

### 12.4 NVIDIA DeepStream (optional)

- `backend/deepstream.py` is present but **not imported by `main.py`** — the consumer task was removed.
- To re-enable: uncomment the `deepstream_alert_consumer` import and task in `main.py` lifespan.
- Consumer reads from Redis stream `DEEPSTREAM_STREAM_NAME` and produces `ai_detection` WebSocket messages.

---

## 13. Development Workflow

### 13.1 Branching

- `main` — production-ready
- `feat/<topic>` — features
- `fix/<ticket>` — bug fixes
- `chore/<topic>` — tooling, refactors

### 13.2 Commits

Conventional-ish. Prefix with a verb in imperative: `add`, `fix`, `refactor`, `docs`, `chore`, `test`.

### 13.3 Local PR loop

```bash
bun run type-check && bun run lint && bun run test
```

All three must pass before opening a PR. CI runs the same.

### 13.4 Adding a new app

```bash
mkdir -p apps/new-app/src/{pages,components}

# package.json
cat > apps/new-app/package.json <<'EOF'
{
  "name": "@tower-guard/new-app",
  "private": true,
  "type": "module",
  "scripts": { "dev": "vite", "build": "vite build" },
  "dependencies": {
    "@tower-guard/ui": "workspace:*",
    "@tower-guard/hooks": "workspace:*",
    "@tower-guard/data": "workspace:*",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  }
}
EOF

# tsconfig inherits shared preset
echo '{ "extends": "@tower-guard/config/tsconfig/vite" }' > apps/new-app/tsconfig.json

bun install
bun run dev --filter=@tower-guard/new-app
```

Register the app's dev port in `main.py`'s `ALLOWED_ORIGINS_DEV` so CORS works.

### 13.5 Adding a shared package

Same shape in `packages/<pkg>/`. Other workspaces consume it as `"@tower-guard/<pkg>": "workspace:*"`. Re-run `bun install`.

### 13.6 Pull request hygiene

- One concern per PR. Refactors don't share a PR with features.
- Update `README.md` or `NAMING_CONVENTIONS.md` when you change architectural patterns.
- Update `Tower_Guard_Architecture.md` if you add new message types, endpoints, or external integrations.

---

## 14. Testing

### 14.1 Frontend

```bash
bun run test                 # Vitest across all apps
```

Config: `vitest.config.ts` at repo root. Playwright fixture at `playwright-fixture.ts`, config at `playwright.config.ts`.

### 14.2 Backend

There is **no production Python test suite yet** (as of this handover). See [§16](#16-known-issues--caveats) for the recommended stress-test scaffolding. Run the backend manually and hit `/health` for smoke testing:

```bash
curl -s http://localhost:5050/health | jq
# → { "status": "healthy", "version": "1.0.0" }
```

### 14.3 Smoke test: AX Pro integration

```bash
# arm
curl -X POST http://localhost:5050/api/alarm/arm \
  -H "Authorization: Bearer $TOKEN"

# disarm
curl -X POST http://localhost:5050/api/alarm/disarm \
  -H "Authorization: Bearer $TOKEN"

# subscribe to alerts stream
websocat ws://localhost:5050/ws/alerts
```

### 14.4 Smoke test: Twilio

```bash
curl -s http://localhost:5050/api/test-sms -H "Authorization: Bearer $TOKEN" | jq
```

---

## 15. Deployment

### 15.1 Frontend

Each app has its own `dist/`. Deploy per-app to your edge host of choice:

| App | Typical host | Custom domain |
|---|---|---|
| `dashboard-main` | Vercel / Netlify | `app.towerguard.ng` |
| `dashboard-nscdc` | Vercel / Netlify | `nscdc.towerguard.ng` |
| `dashboard-ncc` | Vercel / Netlify | `ncc.towerguard.ng` |
| `app-field` | Vercel (PWA) | `field.towerguard.ng` |

Production CORS allowlist is in `main.py` → `ALLOWED_ORIGINS_PROD`. Update it when you change domains.

### 15.2 Backend

Deploy to any container or VPS host (Railway / Render / Fly / DigitalOcean). Required:

- Python 3.10+
- Redis (managed or sidecar)
- Access to AX Pro LAN (VPN or on-site)
- Env vars mirrored from local `.env`

Run with:

```bash
uvicorn main:app --host 0.0.0.0 --port 5050 --workers 2
```

> **Important** — The AX Pro singleton is per-process. If you run with `--workers > 1`, each worker polls independently and emits duplicate events. Until we redesign this (see [§16](#16-known-issues--caveats)), stay on `--workers 1` OR make the polling loop run in a dedicated sidecar that publishes to Redis.

### 15.3 Supabase

Apply migrations:

```bash
supabase link --project-ref $VITE_SUPABASE_PROJECT_ID
supabase db push
```

Re-run `bun run types:generate` and redeploy the frontend whenever the schema changes.

---

## 16. Known Issues & Caveats

This section is **required reading before you ship changes**. Real bugs found during handover review:

### Critical

- **BUG-1 — stale AX Pro client reference in `routes.py`.** `from backend.axpro import axpro_client` (line 15) captures the value at import time. If the panel is offline at startup, routes.py holds `None` forever — even after the polling loop successfully reconnects. Fix: `import backend.axpro as _axpro_module` and reference `_axpro_module.axpro_client` dynamically inside handlers.
- **BUG-2 — WebSocket endpoints have no auth.** `/ws/alerts` and `/ws/site/{id}` accept any anonymous connection. All security alerts are readable by anyone who knows the URL. Fix: add a `token` query parameter validated against `get_current_user`.

### High

- **BUG-3 — `disarm_system` missing "already disarmed" catch.** `arm_system` handles the `armedStatus` / `already` error string but `disarm_system` does not — returns 500 instead of 200 for idempotent calls.
- **BUG-4 — `redis_subscriber()` never restarts.** On any exception other than `CancelledError`, the task exits silently and WebSocket fan-out dies until the server restarts. Fix: wrap in `while True` with exponential backoff.
- **BUG-5 — polling loop has no per-call timeout.** ARM/DISARM wrap their AX Pro calls in `asyncio.wait_for(..., timeout=AXPRO_TIMEOUT)`, but the polling loop does not. A hung `zone_status()` blocks all future alerts.

### Medium

- **BUG-6 — `siren_alarm` emitted but not handled** in `packages/hooks/src/useSimulation.ts`. Siren activations silently drop.
- **BUG-7 — non-connection exceptions log-spam forever** in the polling loop. Auth/session errors don't match the connection keyword list, so the client is never reset — every 2 seconds, for hours.
- **BUG-8 — `/ws/site/{site_id}` returns hardcoded mock data.** Not wired to anything real.
- **BUG-9 — `active_websockets` is a plain list with no lock.** Race during concurrent connect/disconnect + broadcast iteration.

### Architectural

- **Monorepo migration is half-done.** Legacy `src/` still exists alongside `apps/*`. `main.py` CORS still allows `:8080`. Finish by deleting `src/` and dropping that CORS origin. See `MONOREPO_MIGRATION_PROMPT.md`.
- **Most `/api/*` endpoints return hardcoded mock data** (`/api/masts`, `/api/alerts`, `/api/events`, `/api/sites/*/energy`, `/api/reports`). Wire them to Supabase.
- **In-memory `incidents_log`** (in `backend/incidents.py`) resets on every restart. Move to a Supabase table.
- **Single-process assumption for AX Pro polling.** See [§15.2](#152-backend).
- **`field.towerguard.ng` bundle is over budget** (260 KB vs 150 KB target). framer-motion is the largest contributor; lazy-load is a TODO.

### Exposed artifacts

- `evidence1 .jpeg`, `test_snap.jpg`, `production.zip`, `deletelater.sql` — cruft at repo root. Clean up in a dedicated PR.
- `yolov8n-seg.pt` — 6 MB weights file committed. Move to a releases asset or Git LFS.
- Two prior `.env` leaks to watch: the Anthropic API key previously shared in chat was rotated; double-check no other secrets live in shell history or Claude logs.

---

## 17. Troubleshooting

### Backend won't start

| Symptom | Likely cause | Fix |
|---|---|---|
| `ERROR: .env file not found` | Missing `.env` | `cp .env.example .env` and fill in |
| `FATAL ERROR: Missing environment variable: SECRET_KEY` | Required var missing | Set in `.env` |
| `Redis connection attempt 3/3 failed` | Redis not running | `brew services start redis` |
| `AX-Pro connection failed` (warning) | Panel offline or credentials wrong | Check `AXPRO_HOST` reachability; this is a warning, backend still boots |
| Import error on `hikaxpro` | Library not installed | `pip install hikaxpro` (or omit for degraded mode) |

### Frontend won't start

| Symptom | Fix |
|---|---|
| `bun: command not found` | `curl -fsSL https://bun.sh/install \| bash` then open a new terminal |
| `Cannot find module '@tower-guard/ui'` | Run `bun install` at repo root |
| Port in use | `lsof -ti:5173 \| xargs kill -9` (or change the Vite port) |
| 401 on all API calls | Expired JWT — log out and back in |
| CORS error in browser console | Your dev port isn't in `ALLOWED_ORIGINS_DEV` in `main.py` — add it |

### Runtime issues

| Symptom | Where to look |
|---|---|
| Arm/Disarm buttons return 503 | AX Pro offline OR hitting BUG-1 (restart backend) |
| No WebSocket messages | Redis down, or `redis_subscriber` died (BUG-4). Check backend logs. |
| Duplicate alerts | Running backend with `--workers > 1` — see [§15.2](#152-backend) |
| Sensor wall shows "offline" for all zones | WebSocket connected but no `system_status` yet. AX Pro polling is 2s; wait or check panel. |

---

## 18. Handover Checklist

Before you hand this off or before a new developer is "onboarded", verify:

**Access**
- [ ] Supabase project access granted (Owner / Admin as needed)
- [ ] Twilio account SID + auth token in a secret manager (not just `.env`)
- [ ] AX Pro panel IP, credentials, and LAN access documented
- [ ] VPN access for production AX Pro + cameras (if applicable)
- [ ] Git remote access (GitHub/GitLab)
- [ ] Deployment host access (Vercel / Railway / etc.)

**Environment**
- [ ] `.env.example` is up to date with every variable referenced in `config.py`
- [ ] No secrets committed to Git (`git log -p -- .env` clean)
- [ ] Rotation plan for `SECRET_KEY`, Supabase service key, Twilio token

**Documentation**
- [ ] This README is current
- [ ] `NAMING_CONVENTIONS.md` reflects actual patterns in use
- [ ] `Tower_Guard_Architecture.md` matches current message types / endpoints
- [ ] `docs/Tower_Guard_Flowchart.pdf` regenerated after architectural changes

**Code health**
- [ ] `bun run type-check && bun run lint && bun run test` green on `main`
- [ ] Known bugs in [§16](#16-known-issues--caveats) either fixed or ticketed
- [ ] Dead code removed (legacy `src/`, `deletelater.sql`, stray images)
- [ ] Dependency inventory: `bun outdated`, `pip list --outdated`

**Operations**
- [ ] Runbook: how to restart backend, how to drain WebSocket clients during deploy
- [ ] Monitoring: logs shipped somewhere (currently stdout only)
- [ ] Backup: Supabase automated backups configured
- [ ] Alerting: who gets paged when `/health` returns non-200

---

## License

Internal — Seismic Consulting Group.

## Contact

For questions during handover, contact the original author via the repo's `CODEOWNERS` (or the Seismic Consulting Group engineering lead).
