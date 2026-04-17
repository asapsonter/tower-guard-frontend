# @tower-guard/data

Single source of truth for all types, constants, geographic data, mock data,
and Supabase generated types used across every Tower Guard app.

## Exports

- **Types**: `AppRole`, `AlertSeverity`, `Alert`, `EventLog`, `Sensor`, `TelecomMast`, `AssetType`, `MastStatus`
- **Constants**: `STATUS_COLORS`, `STATE_COORDS`, `NIGERIAN_STATES`, `ZONE_STATES`, `GEOPOLITICAL_ZONES`, `TELECOM_PROVIDERS`, `ASSET_TYPES`, `EVENT_TYPES`, `MAST_PARAMETERS`, `FIRST_RESPONDERS`, `NAV_PAGES`, `APP_ROLES`, `HOME_URL_FOR_ROLE`
- **Helpers**: `isAppRole`, `getHomeUrlForRole`
- **Mock data**: `mockAlerts`, `mockEventLog`, `mockSensors`, `mockTelecomMasts` (380 real Nigerian locations)
- **Supabase**: `Database`, `Tables`, `TablesInsert`, `TablesUpdate`, `Json`, `Enums`, `CompositeTypes`, `SupabaseConstants`

## Regenerating Supabase types

From the monorepo root:
```bash
bun run types:generate
```
This calls `supabase gen types typescript --project-id $VITE_SUPABASE_PROJECT_ID > packages/data/src/supabase-types.ts`.
