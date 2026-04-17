# @tower-guard/dashboard-ncc

NCC Monitoring Dashboard. Role: **`ncc_regulator`**. Read-only national analytics view.

## Routes

| Path | Page |
|---|---|
| `/` | Overview — provider benchmarking, compliance trends |
| `/providers` | Providers — per-provider mast count, uptime, incident rate |
| `/compliance` | Compliance — RLS audit, SLA adherence |
| `/reports` | Reports — generated regulatory reports |

All 4 routes render the same `NCCDashboardLayout` component (the existing single-page NCC dashboard). Splitting them into routes provides per-section deep linking without rewriting the dashboard internals.

## Run locally

```bash
bun run dev          # → http://localhost:5175
```

Or from monorepo root:
```bash
bun run turbo:dev:ncc
```

## Theme

Regulatory blue-grey (`hsl(215 16% 47%)`).

## Required env

See `.env.example`.

## Build

```bash
bun run build        # → dist/
```

Bundle budget: 250 KB initial gzipped.
