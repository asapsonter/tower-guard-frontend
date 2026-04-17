# Naming Conventions — Tower Guard Sentinel

A handover guide for naming variables, functions, files, packages, routes, env vars, and database objects in this codebase. The rules below reflect patterns already in the project — follow them to stay consistent with existing code.

> **Rule of thumb** — if in doubt, mimic the nearest existing example in the same file. If the nearest example is inconsistent with this doc, this doc wins and the old code is technical debt.

---

## Table of Contents

1. [Global principles](#1-global-principles)
2. [Python — backend](#2-python--backend)
3. [TypeScript / React — frontend](#3-typescript--react--frontend)
4. [Files & directories](#4-files--directories)
5. [Packages & workspaces](#5-packages--workspaces)
6. [REST routes & WebSocket messages](#6-rest-routes--websocket-messages)
7. [Environment variables](#7-environment-variables)
8. [Database (Postgres / Supabase)](#8-database-postgres--supabase)
9. [Git, branches, commits](#9-git-branches-commits)
10. [Anti-patterns — what to avoid](#10-anti-patterns--what-to-avoid)

---

## 1. Global principles

1. **Names describe intent, not implementation.** `getCurrentUser` ✅ — `getUserFromJwt` ✅ — `getUser` ❌ (too vague).
2. **Plurals for collections, singulars for items.** `alerts: Alert[]`, `zone: Zone`.
3. **Units in names when non-obvious.** `timeout_seconds`, `MAX_RAW_IMAGE_SIZE` (bytes), `response_time_seconds`.
4. **Booleans read like yes/no questions.** `is_armed`, `has_snapshot`, `can_dispatch`, `should_retry`. Never `armed`, `snapshot`, `retry` for a boolean.
5. **Prefer explicit over cute.** `capture_all_snapshots` ✅ — `grabem` ❌.
6. **No abbreviations unless they're ambient** (domain terms like `NSCDC`, `NCC`, `SLA`, `PWA`, `RTSP`, `JWT`, `RLS` are fine).
7. **Match the ecosystem.** Python is snake_case. TypeScript is camelCase / PascalCase. URLs are kebab-case. Env vars are UPPER_SNAKE_CASE.
8. **Avoid `data`, `info`, `utils`, `misc`.** These words carry zero information. `sensorPayload`, `authHelpers`, `incidentRecord` instead.

---

## 2. Python — backend

Target: Python 3.10+, PEP 8 with project-specific additions.

### 2.1 Modules and files

`snake_case.py`. Short, domain-driven. One concept per file.

```
backend/axpro.py              ← AX Pro integration
backend/sms.py                ← SMS dispatcher
backend/rate_limit.py         ← Rate-limiter implementation
backend/redis_client.py       ← Async Redis clients
```

No `utils.py`, no `helpers.py`. If a module is starting to feel like a junk drawer, split it.

### 2.2 Functions

`snake_case`, verbs or verb phrases. Private helpers prefix with `_`.

```python
async def broadcast_alert(payload: dict) -> None: ...
async def capture_all_snapshots() -> list[str]: ...
async def axpro_polling_loop() -> None: ...
def _try_connect() -> HikAxPro | None: ...          # private helper
def get_current_user(token: str = Depends(...)) -> str: ...
```

Async functions are named the same way as sync — the `async def` tells the reader.

### 2.3 Classes

`PascalCase`. Noun or noun phrase.

```python
class RateLimiter: ...
class SensorData(BaseModel): ...           # Pydantic
class DispatchRequest(BaseModel): ...
```

### 2.4 Constants

`UPPER_SNAKE_CASE` at module level. Include the unit when ambiguous.

```python
RETRY_INTERVAL = 30                    # seconds
AXPRO_TIMEOUT = 10                     # seconds
MAX_RAW_IMAGE_SIZE = 5 * 1024 * 1024   # 5 MB
MAX_BASE64_IMAGE_SIZE = 10 * 1024 * 1024
SMS_COOLDOWN_SECS = 60
ZONE_NAMES = {1: "Vibration Sensor", 2: "PIR Sensor"}
```

### 2.5 Variables

Local variables are `snake_case`, descriptive, short-but-not-terse. Prefer full words over abbreviations.

```python
current_status = zone_info.get("status")    # ✅
curr_stat = zone_info.get("status")         # ❌

previous_zone_states: dict[int, dict] = {}  # ✅
prev_z = {}                                 # ❌
```

Loop variables may be short (`i`, `ws`, `z`) if scope is tiny and meaning is obvious from the iterable.

### 2.6 Booleans

Read as a question:

```python
is_armed: bool
has_snapshot: bool
should_retry: bool
redis_ok: bool = False                     # from main.py lifespan
```

### 2.7 Dependencies (FastAPI)

Dependency factories are verbs. The returned object is a noun.

```python
async def get_current_user(token: str = Depends(oauth2_scheme)) -> str:
    ...

# usage
@router.get("/api/alerts")
async def get_alerts(current_user: str = Depends(get_current_user)): ...
```

### 2.8 Pydantic models

Suffix with purpose when ambiguous:

```python
class SensorData(BaseModel): ...          # inbound payload
class DispatchRequest(BaseModel): ...     # request body
class ReportCreate(BaseModel): ...        # create variant (vs. Read/Update)
```

Keep the `Create` / `Update` / `Read` suffix consistent across resources.

### 2.9 Type hints

Always. Use `|` for unions (Python 3.10+), built-in generics (`list[str]`, not `List[str]`), and `Optional` only when meaning "may be missing" rather than "may be None":

```python
def _try_connect() -> HikAxPro | None: ...            # ✅
async def get_alerts(site_id: str | None = None): ...  # ✅
```

### 2.10 Async patterns

- `async def` for anything that awaits I/O
- Name task variables after what they do: `tasks`, `reconnect_task`, `poll_task`
- Use `asyncio.to_thread(sync_fn, ...)` for sync hardware libraries — don't block the event loop

---

## 3. TypeScript / React — frontend

Target: TypeScript 5.5, React 18 with function components.

### 3.1 Files

| Kind | Convention | Example |
|---|---|---|
| React component | `PascalCase.tsx` | `AlarmControls.tsx`, `SensorStatusPanel.tsx` |
| Hook | `useCamelCase.ts` | `useSimulation.ts`, `useDispatchSimulation.ts` |
| Page component | `PascalCase.tsx` (in `pages/`) | `LiveMonitoring.tsx`, `MastDashboard.tsx` |
| Plain module | `kebab-case.ts` | `flow-monitor.ts`, `mock-data.ts`, `nigeria-data.ts` |
| Type-only file | `kebab-case.ts` in a `types/` folder | `app-role.ts`, `status-colors.ts` |
| Barrel export | `index.ts` | one per package, re-exports the public surface |

### 3.2 Components

`PascalCase`. Named exports preferred; default exports only at page-level when the router expects it.

```tsx
export function AlarmControls({ isArmed, onArm }: AlarmControlsProps) { ... }
```

Prop types:

```tsx
type AlarmControlsProps = {
  isArmed: boolean;
  onArm: () => void;
  onDisarm: () => void;
};
```

Event handlers:

- `onX` — prop accepted by the component (what the parent passes in)
- `handleX` — internal function that implements the behavior

```tsx
function AlarmControls({ onArm }: { onArm: () => void }) {
  const handleClick = () => onArm();
  return <button onClick={handleClick}>Arm</button>;
}
```

### 3.3 Hooks

- `useXxx` always. The linter enforces this.
- Parameters: `enabled?: boolean` for gating (mirrors `useDispatchSimulation`).
- Return an object for multi-value hooks so additions don't break callers:

```ts
return { alerts, events, sensors, isArmed, unreadCount, clearUnread };
```

### 3.4 Variables

`camelCase` for values, `PascalCase` for types/classes, `UPPER_SNAKE_CASE` for module-level constants.

```ts
const reconnectDelay = 3000;
const MAX_ALERTS = 15;
type AlertSeverity = "critical" | "warning" | "info";
const STATIC_ROLE_LABELS: Partial<Record<AppRole, string>> = { ... };
```

### 3.5 Booleans

Same rule as Python — read like a question:

```ts
const isArmed = true;
const hasSnapshot = snapshots.length > 0;
const canDispatch = appRole === "nscdc_command";
```

### 3.6 Types and interfaces

- Use `type` aliases by default.
- Use `interface` only when declaration merging is needed (rare).
- Suffix props with `Props`, state with `State`, payloads with `Payload`:

```ts
type AlarmControlsProps = { ... };
type DispatchState = "pending" | "accepted" | "rejected";
type SystemStatusPayload = { ... };
```

Discriminated unions for WebSocket messages:

```ts
type WsMessage =
  | { type: "system_status"; data: SystemStatusPayload }
  | { type: "zone_alarm"; data: ZoneAlarmPayload }
  | { type: "tamper_alarm"; data: TamperAlarmPayload }
  | { type: "siren_alarm"; data: SirenAlarmPayload }
  | { type: "ai_detection"; data: AiDetectionPayload };
```

### 3.7 Enums vs unions

Prefer string-literal unions over TypeScript `enum`:

```ts
export type AppRole =
  | "telecom_admin"
  | "nscdc_command"
  | "nscdc_responder"
  | "ncc_regulator";
```

Reason: unions are erased at compile time, interoperate with JSON, and don't bloat bundles.

### 3.8 Async code

- `async/await`, not `.then()`. Only use `.then()` for fire-and-forget cleanup.
- Name promises after the resource they resolve to: `alertsPromise`, not `p`.
- Cleanup functions in `useEffect` return a subscription-cancel function named to mirror the setup.

### 3.9 API client shape

Files in `packages/api-client/src/endpoints/` follow this pattern:

```ts
// endpoints/alarm.ts
import { request } from "../http";

export const alarmEndpoints = {
  armSystem: () => request("/api/alarm/arm", { method: "POST" }),
  disarmSystem: () => request("/api/alarm/disarm", { method: "POST" }),
};
```

Conventions:

- One file per resource, filename = resource (`alarm.ts`, `alerts.ts`, `masts.ts`)
- Exported object = `<resource>Endpoints`
- Methods are verb-noun: `getAlerts`, `createReport`, `armSystem`, `disarmSystem`
- Re-export from `packages/api-client/src/index.ts` as `api.xxx`

---

## 4. Files & directories

| Layer | Convention |
|---|---|
| React components | `PascalCase.tsx` |
| React hooks | `useCamelCase.ts` |
| React pages | `PascalCase.tsx` in `pages/` |
| TS utility modules | `kebab-case.ts` |
| Types | `kebab-case.ts` in a `types/` subfolder |
| Python modules | `snake_case.py` |
| Shell scripts | `kebab-case.sh` or `snake_case.sh` (current code uses `start_backend.sh`, `start_frontend.sh`) |
| Markdown docs | `SCREAMING_SNAKE_CASE.md` at the root (`README.md`, `NAMING_CONVENTIONS.md`), `kebab-case.md` inside subdirectories |
| Dotfiles | lowercase (`.env`, `.env.example`, `.gitignore`) |
| SQL migrations | `YYYYMMDDHHMMSS_verb_object.sql` (e.g. `20260411130000_create_dispatch_schema.sql`) |

No spaces in filenames. Current repo has `evidence1 .jpeg` and a few others — delete those during the next cleanup pass.

---

## 5. Packages & workspaces

All packages live under `packages/` and apps under `apps/`. Both are namespaced:

```
@tower-guard/<name>
```

### Rules

- `<name>` is **lowercase-kebab-case**. `dashboard-nscdc`, not `dashboardNscdc`.
- Apps that represent a dashboard are `dashboard-<audience>` — `dashboard-main`, `dashboard-nscdc`, `dashboard-ncc`.
- Apps that represent a distinct product get a short codename — `app-field`.
- Shared packages are a single noun — `ui`, `data`, `hooks`, `api-client`, `supabase-client`, `config`.
- Internal workspace dependencies use `"workspace:*"` — never pin to a published version.

---

## 6. REST routes & WebSocket messages

### 6.1 REST

- URLs are `kebab-case` and lowercase. `/api/national-coverage`, not `/api/nationalCoverage`.
- Resources plural: `/api/alerts`, `/api/masts`, `/api/reports`.
- Nested resources follow: `/api/sites/{site_id}/energy`, `/api/sites/{site_id}/sensors`.
- Actions that aren't CRUD use verbs in a `/verb` segment:
  - `POST /api/alarm/arm`
  - `POST /api/alarm/disarm`
  - `POST /api/dispatch`
- Path variables: `{resource_id}` in FastAPI (snake_case matches Python). Frontend URLs use the same.

### 6.2 Status codes

Stick to a small set:

| Code | Meaning |
|---|---|
| 200 | Success, body returned |
| 201 | Created (upload endpoints) |
| 400 | Malformed body |
| 401 | Missing/expired JWT |
| 403 | Wrong role |
| 404 | Resource not found |
| 413 | Payload too large (upload endpoints) |
| 415 | Unsupported media type |
| 500 | Unexpected server error (log the traceback) |
| 503 | Downstream dependency unavailable (AX Pro offline, Supabase down) |
| 504 | Upstream timeout (AX Pro call hung) |

Never return 500 for a predictable failure. If `/api/alarm/arm` is called while the panel is offline, that's 503, not 500.

### 6.3 WebSocket message envelope

Every message is a JSON object with a `type` field:

```json
{
  "id": "uuid4",
  "timestamp": "ISO-8601",
  "type": "zone_alarm",
  "data": { ... }
}
```

Message `type` values are `snake_case` and name the event, not the resource:

- `system_status` — periodic heartbeat with full panel state
- `zone_alarm` — zone status changed
- `tamper_alarm` — tamper switch changed
- `siren_alarm` — siren state changed
- `ai_detection` — DeepStream classification
- (future) `dispatch_update`, `responder_location`, `incident_resolved`

All types listed here should appear in **both** `backend/axpro.py` (producer) and `packages/hooks/src/useSimulation.ts` (consumer). Drift between producer and consumer = bug.

---

## 7. Environment variables

`UPPER_SNAKE_CASE`. Grouped by concern in `.env` with a comment header:

```sh
# ── Frontend (Vite) ──
VITE_API_BASE_URL=http://localhost:5050
VITE_SUPABASE_URL=https://xxx.supabase.co

# ── Supabase (Backend) ──
SUPABASE_URL=...
SUPABASE_BUCKET=tower_demo_payload
SUPABASE_SERVICE_KEY=...
```

Rules:

- Anything the **browser** reads is prefixed `VITE_`. Vite enforces this at build time.
- Anything **only the backend** reads has no prefix.
- A variable exists in **both** `.env.example` (redacted) and `.env` (real values). `.env.example` is committed, `.env` is not.
- Group related variables; use the `── Section ──` header pattern already in `.env.example`.
- When adding a new variable:
  1. Add it to `.env.example` with a placeholder value
  2. Add it to `backend/config.py` with `os.environ.get(...)` and a sane default (or `os.environ[...]` if required-to-boot)
  3. Add it to the [README §5](./README.md#5-environment-variables) table
  4. Add it to `turbo.json` → `globalEnv` if it's a frontend var so Turbo invalidates caches when it changes

---

## 8. Database (Postgres / Supabase)

### 8.1 Tables

- `snake_case`, **plural**: `masts`, `alerts`, `incidents`, `dispatch_assignments`, `responder_messages`, `response_sla_logs`.
- No abbreviations unless they're domain terms (`sla`, `rls`).

### 8.2 Columns

- `snake_case`, singular.
- Primary key is always `id uuid` (default `gen_random_uuid()`).
- Foreign keys named `<referenced_table_singular>_id`: `mast_id`, `alert_id`, `assignment_id`, `member_id`.
- Timestamps: `created_at`, `updated_at`, `resolved_at`, `detected_at`, `dispatched_at`, `accepted_at`. Always `timestamptz`, default `now()`.
- Booleans prefixed: `is_active`, `has_snapshot`, `acknowledged` (past-tense participle also OK when it reads naturally).
- Units in the name for numeric columns where unit isn't obvious: `response_time_seconds`, `generator_fuel` (percent), `battery_charge` (percent).

### 8.3 Enums

Represent as `text` + a CHECK constraint, not Postgres `ENUM` types (migrations are painful with native enums). Values are lowercase snake_case:

```sql
status text NOT NULL CHECK (status IN ('pending','accepted','en_route','on_site','resolved','rejected'))
```

### 8.4 Indices and constraints

- Index: `idx_<table>_<columns>` — `idx_alerts_mast_id_timestamp`
- Unique: `uq_<table>_<columns>`
- Foreign key: `fk_<table>_<column>`
- Check: `chk_<table>_<description>`

### 8.5 RLS policies

Name them `<role>_<action>_<table>`:

```sql
create policy "nscdc_command_select_dispatch_assignments"
  on dispatch_assignments for select
  using (auth.jwt() ->> 'app_role' = 'nscdc_command');
```

---

## 9. Git, branches, commits

### Branches

```
main                        ← production
feat/<topic>                ← new feature
fix/<ticket-or-topic>       ← bug fix
chore/<topic>               ← tooling / refactor
docs/<topic>                ← docs only
hotfix/<topic>              ← emergency production patch
```

`<topic>` is `kebab-case`, short (2-4 words): `feat/axpro-reconnect`, `fix/disarm-already-disarmed`.

### Commits

Imperative present tense. Optional type prefix (commitlint-compatible):

```
feat: add siren_alarm handler to useSimulation
fix: reset axpro client on auth errors
refactor: inline STATIC_ROLE_LABELS
docs: document AX Pro polling in README
chore: drop deepstream import from main.py
test: add axpro stress test suite
```

- Subject ≤ 72 chars, no trailing period.
- Body (optional): why, not what. Wrap at 72.
- Reference issues: `Closes #123` in the body.

---

## 10. Anti-patterns — what to avoid

### General

- **`data`, `info`, `utils`, `helpers`, `misc`** as names — zero information. Replace with the actual concept.
- **Single-letter variables outside tight loops** (`x`, `d`, `v`) — readers lose context.
- **Abbreviating past the first occurrence** — `ax` for AX Pro is fine (domain), `alrt` for alert is not.
- **Hungarian notation** — `strName`, `iCount`. We have types for that.

### Python

- **`List[str]` / `Dict[str, Any]`** — use built-in `list[str]` / `dict[str, Any]`.
- **Mutable default arguments** — `def f(x=[])` leaks state across calls. Use `x: list | None = None` and initialize inside.
- **`except Exception: pass`** — swallows real bugs. Log at minimum, preferably narrow the exception type.
- **Module-level global mutation without a lock** — see BUG-3/BUG-9 in README §16. If you must, protect with `asyncio.Lock`.

### TypeScript

- **`any`** — use `unknown` and narrow, or define the real type. Every `any` is a TODO.
- **`as` assertions to silence the compiler** — if `as` is the only way, add a comment explaining the invariant.
- **`useEffect(() => { ... }, [])` with stale closures** — capture refs in a `useRef` or include deps.
- **Default exports for shared utilities** — named exports are refactor-friendly.
- **Inline styles** for anything Tailwind can handle — keep CSS in Tailwind classes.
- **Components with more than 5-6 props** — that's your signal to either break up the component or accept a props object.

### Naming smells

| Smell | Why | Fix |
|---|---|---|
| `getUserData()` | What data? | `getCurrentUser()`, `getUserProfile()`, `getUserRoles()` |
| `handleClick1`, `handleClick2` | Index suffixes mean you didn't name the behavior | `handleArm`, `handleDisarm` |
| `temp`, `tmp`, `foo`, `bar` | Placeholder that shipped | Rename before PR |
| `ManagerFactoryHelper` | Overengineered / zero domain meaning | Pick a concrete noun; delete the ceremony |
| `IAlert`, `TAlert` | Prefixes for "interface" or "type" | Use `Alert`; the kind is obvious from context |
| `allRespondersList` | `list` is implied by the plural | `responders` |

---

## Reference — existing good examples

When you need inspiration, look at these as well-named examples already in the codebase:

- `backend/axpro.py` — module-level constants, clear retry loop naming, `_try_connect` private helper
- `backend/routes.py` — consistent `Depends(get_current_user)`, resource-oriented URL structure
- `packages/hooks/src/useSimulation.ts` — prop + state naming, discriminated union on `payload.type`
- `packages/api-client/src/endpoints/alarm.ts` — minimal endpoint module shape

When you find an example that violates this doc, open a `chore/` branch and fix it.
