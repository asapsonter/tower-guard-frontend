import { SITE_STATES, type Cluster, type GeoPoint, type Incident, type OpsSnapshot, type SiteState, type SiteSummary, type Zone } from "@/lib/ops";

/** Drill-down: Nigeria → Zone → State → Cluster → (Site opens the Digital Twin). */
export type ScopeLevel = "national" | "zone" | "state" | "cluster";

export interface Scope {
  zone: Zone | null;
  state: string | null;
  cluster: Cluster | null;
}

export type StateCounts = Record<SiteState, number>;

export interface DrillChild {
  key: string;
  label: string;
  sub?: string;
  total: number;
  counts: StateCounts;
  activeIncidents: number;
}

/** Severity rank of a site state — higher draws on top and sorts first. */
export const STATE_RANK: Record<SiteState, number> = { normal: 0, maintenance: 1, offline: 2, warning: 3, incident: 4, critical: 5 };
export const SEVERITY_RANK = { critical: 3, high: 2, medium: 1, low: 0 } as const;

export function resolveScope(snap: OpsSnapshot, zone: string | null, state: string | null, cluster: string | null): Scope {
  const c = cluster ? snap.clusters.find((x) => x.id === cluster) ?? null : null;
  const st = c?.state ?? (state && snap.sites.some((s) => s.state === state) ? state : null);
  const z = (c?.zone ?? (st ? snap.sites.find((s) => s.state === st)?.zone : null) ?? (zone && snap.sites.some((s) => s.zone === zone) ? zone : null)) as Zone | null;
  return { zone: z, state: st, cluster: c };
}

export function scopeLevel(s: Scope): ScopeLevel {
  return s.cluster ? "cluster" : s.state ? "state" : s.zone ? "zone" : "national";
}

export function inScope(s: Scope, x: { zone: Zone; state: string; clusterId: string }): boolean {
  if (s.cluster) return x.clusterId === s.cluster.id;
  if (s.state) return x.state === s.state;
  if (s.zone) return x.zone === s.zone;
  return true;
}

export const emptyCounts = (): StateCounts => Object.fromEntries(SITE_STATES.map((k) => [k, 0])) as StateCounts;

export function countStates(sites: SiteSummary[]): StateCounts {
  const c = emptyCounts();
  for (const s of sites) c[s.status]++;
  return c;
}

export const isActive = (i: Incident) => i.status !== "closed";

/** Children of the current drill level, each with per-state site counts. */
export function drillChildren(snap: OpsSnapshot, scope: Scope, sites: SiteSummary[], active: Incident[]): DrillChild[] {
  const level = scopeLevel(scope);
  if (level === "cluster") return [];
  const keyOf = (s: { zone: Zone; state: string; clusterId: string }) => (level === "national" ? s.zone : level === "zone" ? s.state : s.clusterId);
  const groups = new Map<string, SiteSummary[]>();
  for (const s of sites) {
    const k = keyOf(s);
    const g = groups.get(k);
    if (g) g.push(s);
    else groups.set(k, [s]);
  }
  const incByKey = new Map<string, number>();
  for (const i of active) incByKey.set(keyOf(i), (incByKey.get(keyOf(i)) ?? 0) + 1);
  const clusterById = new Map(snap.clusters.map((c) => [c.id, c]));
  return [...groups.entries()]
    .map(([key, list]) => {
      const c = level === "state" ? clusterById.get(key) : undefined;
      return {
        key,
        label: c ? c.name : key,
        sub: c ? c.id : undefined,
        total: list.length,
        counts: countStates(list),
        activeIncidents: incByKey.get(key) ?? 0,
      };
    })
    .sort((a, b) => b.counts.critical - a.counts.critical || b.counts.incident - a.counts.incident || b.total - a.total);
}

/** Two corner points that bound the given locations (cheap fitBounds input for ~2,000 sites). */
export function boundsOf(points: GeoPoint[], pad = 0.05): GeoPoint[] {
  if (!points.length) return [];
  let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;
  for (const p of points) {
    if (p.lat < minLat) minLat = p.lat;
    if (p.lat > maxLat) maxLat = p.lat;
    if (p.lng < minLng) minLng = p.lng;
    if (p.lng > maxLng) maxLng = p.lng;
  }
  return [{ lat: minLat - pad, lng: minLng - pad }, { lat: maxLat + pad, lng: maxLng + pad }];
}

/** Short human reason why a site is in warning (no incident attached). */
export function warningReason(s: SiteSummary): string {
  if (!s.cctvOnline) return "CCTV offline";
  if (s.backhaul === "down") return "Backhaul down";
  if (s.backhaul === "secondary") return "On secondary backhaul";
  if (s.protectionState !== "FULLY PROTECTED") return s.protectionState.toLowerCase().replace(/^\w/, (m) => m.toUpperCase());
  if (s.riskScore >= 70) return `Elevated risk · ${s.riskScore}`;
  return "Sensor / health anomaly";
}
