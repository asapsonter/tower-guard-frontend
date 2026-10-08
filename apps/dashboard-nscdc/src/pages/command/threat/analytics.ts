/** Pure helpers that turn the incident history into threat-intelligence views. */
import type { CniiSnapshot, GeoPoint, Incident, IncidentType, ModusOperandi, Operator } from "@/lib/cnii";

export interface ThreatFilters {
  state: string;
  lga: string;
  corridor: string;
  operator: Operator | "";
  type: IncidentType | "";
  modus: ModusOperandi | "";
  days: number;
}

export const EMPTY_FILTERS: ThreatFilters = { state: "", lga: "", corridor: "", operator: "", type: "", modus: "", days: 90 };

/** Incidents within this distance of a corridor path count as "on" the corridor. */
export const CORRIDOR_BUFFER_KM = 20;

const DAY_MS = 86_400_000;

export function haversineKm(a: GeoPoint, b: GeoPoint): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Approximate distance (km) from a point to a polyline, using a local equirectangular projection. */
export function distanceToPathKm(p: GeoPoint, path: GeoPoint[]): number {
  if (path.length === 0) return Infinity;
  if (path.length === 1) return haversineKm(p, path[0]);
  const kx = 111.32 * Math.cos((p.lat * Math.PI) / 180);
  const ky = 110.57;
  let best = Infinity;
  for (let i = 0; i < path.length - 1; i++) {
    const ax = (path[i].lng - p.lng) * kx, ay = (path[i].lat - p.lat) * ky;
    const bx = (path[i + 1].lng - p.lng) * kx, by = (path[i + 1].lat - p.lat) * ky;
    const dx = bx - ax, dy = by - ay;
    const len2 = dx * dx + dy * dy;
    const t = len2 ? Math.max(0, Math.min(1, -(ax * dx + ay * dy) / len2)) : 0;
    const cx = ax + t * dx, cy = ay + t * dy;
    best = Math.min(best, Math.hypot(cx, cy));
  }
  return best;
}

/** Hour of day in West Africa Time (UTC+1). */
export const watHour = (iso: string) => (new Date(iso).getUTCHours() + 1) % 24;

export function filterIncidents(snap: CniiSnapshot, f: ThreatFilters, now: number): Incident[] {
  const cutoff = now - f.days * DAY_MS;
  const corridor = f.corridor ? snap.corridors.find((c) => c.id === f.corridor) : undefined;
  return snap.incidents.filter((i) =>
    new Date(i.detectedAt).getTime() >= cutoff &&
    (!f.state || i.state === f.state) &&
    (!f.lga || i.lga === f.lga) &&
    (!f.operator || i.operator === f.operator) &&
    (!f.type || i.type === f.type) &&
    (!f.modus || i.modusOperandi.includes(f.modus)) &&
    (!corridor || distanceToPathKm(i.location, corridor.path) <= CORRIDOR_BUFFER_KM),
  );
}

export function countBy<K extends string>(list: Incident[], key: (i: Incident) => K | K[]): { key: K; count: number }[] {
  const m = new Map<K, number>();
  for (const i of list) {
    const k = key(i);
    for (const v of Array.isArray(k) ? k : [k]) m.set(v, (m.get(v) ?? 0) + 1);
  }
  return [...m.entries()].map(([k, count]) => ({ key: k, count })).sort((a, b) => b.count - a.count);
}

export function hourProfile(list: Incident[]): number[] {
  const h = Array(24).fill(0) as number[];
  for (const i of list) h[watHour(i.detectedAt)]++;
  return h;
}

export interface TrendPoint {
  date: string;
  label: string;
  count: number;
  critical: number;
  ma7: number;
}

/** Daily incident counts for the last `days` days (WAT calendar days) with a 7-day moving average. */
export function dailyTrend(list: Incident[], now: number, days = 90): TrendPoint[] {
  const dayKey = (ms: number) => new Date(ms + 3_600_000).toISOString().slice(0, 10);
  const buckets = new Map<string, { count: number; critical: number }>();
  const keys: string[] = [];
  for (let d = days - 1; d >= 0; d--) {
    const k = dayKey(now - d * DAY_MS);
    keys.push(k);
    buckets.set(k, { count: 0, critical: 0 });
  }
  for (const i of list) {
    const b = buckets.get(dayKey(new Date(i.detectedAt).getTime()));
    if (!b) continue;
    b.count++;
    if (i.severity === "critical") b.critical++;
  }
  return keys.map((k, idx) => {
    const window = keys.slice(Math.max(0, idx - 6), idx + 1);
    const ma = window.reduce((s, w) => s + buckets.get(w)!.count, 0) / window.length;
    const [, m, d] = k.split("-");
    return { date: k, label: `${d}/${m}`, ...buckets.get(k)!, ma7: Math.round(ma * 10) / 10 };
  });
}

/** Points around a centre, so a map fit lands at roughly `km` across. */
export function boxAround(c: GeoPoint, km: number): GeoPoint[] {
  const dLat = km / 111;
  const dLng = km / (111 * Math.cos((c.lat * Math.PI) / 180));
  return [{ lat: c.lat - dLat, lng: c.lng - dLng }, { lat: c.lat + dLat, lng: c.lng + dLng }];
}
