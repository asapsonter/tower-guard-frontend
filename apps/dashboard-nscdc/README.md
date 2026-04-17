# @tower-guard/dashboard-nscdc

NSCDC Station Dashboard. Role: **`nscdc_command`**.

## Routes

| Path | Page | Purpose |
|---|---|---|
| `/` | Overview | Real-time dispatch board, status counters, SLA timers |
| `/officers` | Officers | Officer roster and availability |
| `/incidents` | Incidents | Incident tickets list and detail |
| `/accountability` | Accountability | Per-officer performance metrics |
| `/evidence` | Evidence | Photo evidence gallery |

All 5 pages share the same `NSCDCDashboardLayout`, which derives the active tab from the URL via `useLocation`. Internal data state (assignments, messages, performance) is fetched once via Supabase realtime hooks.

Any URL outside this list redirects to `/`.

## Run locally

```bash
bun run dev          # → http://localhost:5174
```

Or from monorepo root:
```bash
bun run turbo:dev:nscdc
```

## Theme

Operational green (`hsl(142 71% 45%)`). The accent is set via a CSS variable override in `src/index.css`.

## Required env

See `.env.example`.

## Build

```bash
bun run build        # → dist/
```

Bundle budget: 300 KB initial gzipped.
