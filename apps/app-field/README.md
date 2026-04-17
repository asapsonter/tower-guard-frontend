# @tower-guard/app-field

Field App. Role: **`nscdc_responder`**.

Mobile-first **PWA** with Service Worker, offline queue, install prompt, and app shortcut.

## Routes

| Path | Page |
|---|---|
| `/` | AssignmentList — pending + active dispatches |
| `/assignment/:id` | AssignmentDetail — full incident view, accept/reject, GPS, chat, evidence |
| `/profile` | Profile — officer info + offline queue status + sign out |

Bottom nav switches between Assignments and Profile.

## PWA features

- **Service Worker (autoUpdate)** — precaches the app shell so officers can launch with zero connectivity
- **Offline queue (IndexedDB)** — `src/offline/queue.ts` persists outgoing messages, status updates, and evidence uploads when offline; flushes on reconnect
- **Install prompt** — Add to Home Screen on iOS / Install App on Android
- **Standalone display** — runs without browser chrome
- **Dark theme** — matches the field environment, reduces battery drain
- **NSCDC orange accent** — `hsl(25 95% 53%)`

## Run locally

```bash
bun run dev          # → http://localhost:5176
```

Or from monorepo root:
```bash
bun run turbo:dev:field
```

The PWA service worker is **disabled in dev** (`VitePWA devOptions.enabled: false`) — production builds register it.

## Test offline mode

1. `bun run build && bun run preview`
2. Open http://localhost:5176 in Chrome
3. DevTools → Application → Service Workers → check "Offline"
4. Send a message — it queues in IndexedDB (Application → IndexedDB → tower-guard-field → outgoing_messages)
5. Uncheck "Offline" — the queue flushes within 30s

## Required env

See `.env.example`.

## Build

```bash
bun run build        # → dist/ + sw.js
```

Bundle budget: **150 KB initial gzipped** (mobile data).

## PWA icons

`public/icons/` should contain `icon-192.png`, `icon-512.png`, `icon-maskable-512.png`. Generate from the NSCDC orange Shield icon. (Placeholders for first build; replace with branded assets.)
