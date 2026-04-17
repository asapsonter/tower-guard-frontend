# @tower-guard/dashboard-main

The Tower Guard primary admin dashboard. Role: **`telecom_admin`**.

## Routes

| Path | Page | Purpose |
|---|---|---|
| `/` | Index | Operator overview, live feed, alerts, sensors, map |
| `/live-monitoring` | LiveMonitoring | All cameras + alerts |
| `/inventory` | Inventory | Mast and equipment inventory |
| `/smart-monitoring` | SmartMonitoring | AI-driven anomaly view |
| `/incidents` | Incidents | Incident log and dispatch |
| `/zonal-centers` | ZonalCenters | Operations by zone |
| `/history` | History | Historical event log |
| `/reports` | Reports | Generated reports |
| `/national-coverage` | NationalCoverage | Live Leaflet map of all 380 masts |
| `/mast/:id` | MastDashboard | Single-mast deep dive |

Any URL outside this list redirects to `/`.

## Run locally

```bash
bun run dev          # → http://localhost:5173
```

Or from monorepo root:
```bash
bun run turbo:dev
```

## Required env

See `.env.example`. The app validates env at boot via zod (`src/env.ts`) and refuses to start if anything is missing.

## Build

```bash
bun run build        # → dist/
```

Bundle budget: 400 KB initial gzipped (enforced via `chunkSizeWarningLimit`).
