# @tower-guard/api-client

Typed REST + WebSocket client for the FastAPI backend, shared by all 4 apps.

## Usage

```ts
// Aggregated import (legacy compatible)
import { api } from "@tower-guard/api-client";
const alerts = await api.getAlerts();

// Tree-shakable per-module import
import { mastsEndpoints, connectWebSocket } from "@tower-guard/api-client";
const mast = await mastsEndpoints.getMastById("tm_001");
```

## Required env

Each app must set `VITE_API_BASE_URL` (defaults to `http://localhost:5050`).

## Endpoint modules

- `auth` — login, register, logout
- `alerts` — alerts, events
- `masts` — masts, telemetry, energy, sensors
- `incidents` — incident log
- `dispatch` — responder dispatch
- `reports` — listing and creation
- `alarm` — arm/disarm

The `request()` helper handles auth header injection, 401 redirects, and JSON error normalization.
