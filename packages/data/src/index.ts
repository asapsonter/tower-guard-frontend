/**
 * @tower-guard/data — single source of truth for types, constants,
 * mock data, geographic data, and Supabase generated types.
 *
 * All apps and packages import from here. No duplication, no drift.
 */

// ── Role types ──
export {
  type AppRole,
  APP_ROLES,
  isAppRole,
  HOME_URL_FOR_ROLE,
  getHomeUrlForRole,
  APP_NAME_FOR_ROLE,
} from "./types/app-role";

// ── Status colors ──
export { STATUS_COLORS, type MastStatus } from "./types/status-colors";

// ── Domain types and mock data ──
export type {
  AlertSeverity,
  SensorStatus,
  Alert,
  EventLog,
  Sensor,
} from "./mock-data";
export { mockAlerts, mockEventLog, mockSensors } from "./mock-data";

// ── Nigeria-specific types, constants, and 380 mast locations ──
export {
  ASSET_TYPES,
  type AssetType,
  NAV_PAGES,
  GEOPOLITICAL_ZONES,
  EVENT_TYPES,
  MAST_PARAMETERS,
  FIRST_RESPONDERS,
  TELECOM_PROVIDERS,
  type TelecomMast,
  mockTelecomMasts,
  STATE_COORDS,
  NIGERIAN_STATES,
  ZONE_STATES,
} from "./nigeria-data";

// ── Supabase generated types ──
export type {
  Database,
  Tables,
  TablesInsert,
  TablesUpdate,
  Json,
  Enums,
  CompositeTypes,
} from "./supabase-types";
export { Constants as SupabaseConstants } from "./supabase-types";
