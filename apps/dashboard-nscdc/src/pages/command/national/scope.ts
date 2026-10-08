/**
 * Drill-down scope for the National Command page:
 * National → Zone → State Command → Area Command → Incident.
 */
import type { AreaCommand, CniiSnapshot, GeoPoint, Incident, Severity, StateCommand, Zone } from "@/lib/cnii";

export const ZONES: Zone[] = ["North-Central", "North-East", "North-West", "South-East", "South-South", "South-West"];

/** Corners of Nigeria, used to fit the map at national level. */
export const NIGERIA_BOUNDS: GeoPoint[] = [
  { lat: 4.25, lng: 2.7 },
  { lat: 13.9, lng: 14.6 },
];

export const SEVERITY_RANK: Record<Severity, number> = { critical: 0, high: 1, medium: 2, low: 3 };

export const isActive = (i: Incident) => i.status !== "closed";

/** Severity first, then most recent detection. */
export const bySeverityThenRecency = (a: Incident, b: Incident) =>
  SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity] || b.detectedAt.localeCompare(a.detectedAt);

export interface Scope {
  zone: Zone | null;
  stateCommand: StateCommand | null;
  areaCommand: AreaCommand | null;
}

export type ScopeLevel = "national" | "zone" | "state" | "area";

export function scopeLevel(s: Scope): ScopeLevel {
  if (s.areaCommand) return "area";
  if (s.stateCommand) return "state";
  if (s.zone) return "zone";
  return "national";
}

/** Resolve URL params (zone, sc, ac) into scope objects, ignoring invalid ids. */
export function resolveScope(snap: CniiSnapshot, zone: string | null, sc: string | null, ac: string | null): Scope {
  const stateCommand = sc ? snap.stateCommands.find((s) => s.id === sc) ?? null : null;
  const areaCommand = stateCommand && ac ? stateCommand.areaCommands.find((a) => a.id === ac) ?? null : null;
  const z = stateCommand?.zone ?? (ZONES.includes(zone as Zone) ? (zone as Zone) : null);
  return { zone: z, stateCommand, areaCommand };
}

/** Does a record with this zone / state command / area command fall inside the scope? */
export function inScope(s: Scope, rec: { zone: Zone; stateCommandId?: string; areaCommandId?: string }): boolean {
  if (s.zone && rec.zone !== s.zone) return false;
  if (s.stateCommand && rec.stateCommandId !== s.stateCommand.id) return false;
  if (s.areaCommand && rec.areaCommandId !== s.areaCommand.id) return false;
  return true;
}

export interface RollUp {
  active: number;
  critical: number;
  slaPct: number | null;
  total: number;
}

/** Active / critical counts and SLA compliance (incidents with a recorded arrival) for a set of incidents. */
export function rollUp(list: Incident[]): RollUp {
  let active = 0;
  let critical = 0;
  let arrived = 0;
  let met = 0;
  for (const i of list) {
    if (isActive(i)) {
      active++;
      if (i.severity === "critical") critical++;
    }
    if (i.response.stages.arrival) {
      arrived++;
      if (!i.response.breached) met++;
    }
  }
  return { active, critical, slaPct: arrived ? Math.round((met / arrived) * 100) : null, total: list.length };
}

export const slaTone = (pct: number | null) =>
  pct == null ? "text-muted-foreground" : pct >= 85 ? "text-success" : pct >= 70 ? "text-warning" : "text-destructive";
