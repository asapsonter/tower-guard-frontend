import type { GeoPoint, ResponseUnit, UnitStatus } from "@/lib/cnii";

/** Mirrors server/dispatch.ts so table distances/ETAs match the recommendation. */
const ROAD_FACTOR = 1.25;
const SPEED_KMH = 45;
const TURNOUT_SEC: Partial<Record<UnitStatus, number>> = { available: 60, standby: 180 };

export const UNIT_STATUS_ORDER: UnitStatus[] = ["available", "standby", "assigned", "en_route", "on_site", "returning", "unavailable"];

export const COMMS_COLOR = { online: "#22c55e", degraded: "#f59e0b", offline: "#ef4444" } as const;

function haversineKm(a: GeoPoint, b: GeoPoint): number {
  const R = 6371;
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLng = (b.lng - a.lng) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Estimated road distance (km, 1 dp). */
export function roadKm(a: GeoPoint, b: GeoPoint): number {
  return Math.round(haversineKm(a, b) * ROAD_FACTOR * 10) / 10;
}

/** ETA (s) for a unit to cover `km`, including turnout for its current status. */
export function etaFor(unit: ResponseUnit, km: number): number {
  return Math.round((TURNOUT_SEC[unit.status] ?? 300) + (km / SPEED_KMH) * 3600);
}
