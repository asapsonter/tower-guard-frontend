import type { Corridor, GeoPoint, Incident, StolenAsset } from "@/lib/cnii";
import { fmtNaira } from "@/lib/cnii";

export type EquipmentType = StolenAsset["equipmentType"];
export const EQUIPMENT_TYPES: EquipmentType[] = ["battery", "generator", "cable", "solar_panel", "rectifier", "antenna"];
export const EQUIPMENT_LABEL: Record<EquipmentType, string> = {
  battery: "Battery", generator: "Generator", cable: "Cable", solar_panel: "Solar panel", rectifier: "Rectifier", antenna: "Antenna",
};
export const EQUIPMENT_COLOR: Record<EquipmentType, string> = {
  battery: "#06b6d4", generator: "#3b82f6", cable: "#a855f7", solar_panel: "#facc15", rectifier: "#f97316", antenna: "#ec4899",
};
export const RECOVERY_STATUS_COLOR: Record<StolenAsset["recoveryStatus"], string> = {
  missing: "#ef4444", tracked: "#eab308", recovered: "#22c55e", destroyed: "#64748b",
};

export interface MarketAgg {
  name: string;
  location: GeoPoint;
  recovered: number;
  value: number;
  byType: Record<EquipmentType, number>;
  dealers: Set<string>;
}

export function marketAggregates(assets: StolenAsset[]): MarketAgg[] {
  const m = new Map<string, MarketAgg & { pts: GeoPoint[] }>();
  for (const a of assets) {
    if (!a.recoveryLocation) continue;
    const key = a.recoveryLocation.name;
    const cur = m.get(key) ?? { name: key, location: a.recoveryLocation.location, pts: [], recovered: 0, value: 0, byType: Object.fromEntries(EQUIPMENT_TYPES.map((t) => [t, 0])) as Record<EquipmentType, number>, dealers: new Set<string>() };
    cur.recovered += 1;
    cur.value += a.valueNaira;
    cur.byType[a.equipmentType] += 1;
    cur.pts.push(a.recoveryLocation.location);
    if (a.receivingDealer) cur.dealers.add(a.receivingDealer);
    m.set(key, cur);
  }
  return [...m.values()].map(({ pts, ...rest }) => ({
    ...rest,
    location: { lat: pts.reduce((s, p) => s + p.lat, 0) / pts.length, lng: pts.reduce((s, p) => s + p.lng, 0) / pts.length },
  })).sort((a, b) => b.recovered - a.recovered);
}

export function dealerAggregates(assets: StolenAsset[]) {
  const m = new Map<string, { dealer: string; count: number; value: number; byType: Partial<Record<EquipmentType, number>>; markets: Set<string> }>();
  for (const a of assets) {
    if (!a.receivingDealer) continue;
    const cur = m.get(a.receivingDealer) ?? { dealer: a.receivingDealer, count: 0, value: 0, byType: {}, markets: new Set<string>() };
    cur.count += 1;
    cur.value += a.valueNaira;
    cur.byType[a.equipmentType] = (cur.byType[a.equipmentType] ?? 0) + 1;
    if (a.recoveryLocation) cur.markets.add(a.recoveryLocation.name);
    m.set(a.receivingDealer, cur);
  }
  return [...m.values()].sort((a, b) => b.count - a.count || b.value - a.value);
}

const KM_PER_DEG = 111.32;
function distToSegmentKm(p: GeoPoint, a: GeoPoint, b: GeoPoint): number {
  const k = Math.cos((p.lat * Math.PI) / 180);
  const ax = (a.lng - p.lng) * k, ay = a.lat - p.lat, bx = (b.lng - p.lng) * k, by = b.lat - p.lat;
  const dx = bx - ax, dy = by - ay;
  const t = Math.max(0, Math.min(1, -(ax * dx + ay * dy) / Math.max(1e-12, dx * dx + dy * dy)));
  return Math.hypot(ax + t * dx, ay + t * dy) * KM_PER_DEG;
}
export function distToCorridorKm(p: GeoPoint, c: Corridor): number {
  let best = Infinity;
  for (let i = 1; i < c.path.length; i++) best = Math.min(best, distToSegmentKm(p, c.path[i - 1], c.path[i]));
  return best;
}

export interface Insight {
  id: string;
  kind: "market" | "dealer" | "corridor";
  headline: string;
  detail: string;
  confidence: number;
  basis: string;
}

/** Turns individual thefts into supply-chain intelligence. */
export function supplyChainInsights(assets: StolenAsset[], incById: Map<string, Incident>, corridors: Corridor[]): Insight[] {
  const out: Insight[] = [];

  // 1. Batteries repeatedly recovered in one market
  const batteries = assets.filter((a) => a.equipmentType === "battery" && a.recoveryLocation);
  const byMarket = new Map<string, StolenAsset[]>();
  for (const a of batteries) byMarket.set(a.recoveryLocation!.name, [...(byMarket.get(a.recoveryLocation!.name) ?? []), a]);
  const topMarkets = [...byMarket.entries()].sort((a, b) => b[1].length - a[1].length).filter(([, l]) => l.length >= 3).slice(0, 2);
  for (const [market, list] of topMarkets) {
    const sites = new Set(list.map((a) => a.siteId)).size;
    const ops = new Set(list.map((a) => a.operator));
    out.push({
      id: `mkt-${market}`, kind: "market",
      headline: `Stolen batteries repeatedly recovered at ${market}`,
      detail: `${list.length} batteries (${Math.round((list.length / Math.max(1, batteries.length)) * 100)}% of all battery recoveries, ${fmtNaira(list.reduce((s, a) => s + a.valueNaira, 0))}) stolen from ${sites} sites across ${ops.size} operator${ops.size > 1 ? "s" : ""} (${[...ops].join(", ")}).`,
      confidence: Math.min(0.95, 0.5 + list.length / 40),
      basis: "Recovery reports · serial-number match against registry",
    });
  }

  // 2. Cables flowing through particular scrap dealers (by dealer, or by the dealer cluster at a market)
  const cables = assets.filter((a) => a.equipmentType === "cable" && a.recoveryLocation);
  const cableDealers = dealerAggregates(cables).filter((d) => d.count >= 2).slice(0, 3);
  if (cableDealers.length) {
    out.push({
      id: "cable-dealers", kind: "dealer",
      headline: `Cable flowing through ${cableDealers.length} scrap dealer${cableDealers.length > 1 ? "s" : ""}`,
      detail: cableDealers.map((d) => `${d.dealer}: ${d.count} cable lots (${fmtNaira(d.value)})`).join(" · ") + ` — of ${cables.length} cable recoveries.`,
      confidence: Math.min(0.9, 0.45 + cableDealers[0].count / 15),
      basis: "Receiving-dealer field on recovery reports",
    });
  } else {
    const byMkt = new Map<string, StolenAsset[]>();
    for (const a of cables) byMkt.set(a.recoveryLocation!.name, [...(byMkt.get(a.recoveryLocation!.name) ?? []), a]);
    const top = [...byMkt.entries()].filter(([, l]) => l.length >= 2).sort((a, b) => b[1].length - a[1].length).slice(0, 3);
    if (top.length) {
      out.push({
        id: "cable-markets", kind: "dealer",
        headline: `Cable flowing through scrap dealers at ${top.map(([m]) => m.split(" ")[0]).join(", ")}`,
        detail: top.map(([m, l]) => `${m}: ${l.length} cable lots via ${new Set(l.map((a) => a.receivingDealer).filter(Boolean)).size || "unidentified"} dealer(s)`).join(" · ")
          + ` — ${Math.round((top.reduce((s, [, l]) => s + l.length, 0) / Math.max(1, cables.length)) * 100)}% of ${cables.length} cable recoveries.`,
        confidence: Math.min(0.85, 0.4 + top[0][1].length / 15),
        basis: "Recovery location + receiving-dealer field on recovery reports",
      });
    }
  }

  // 3. Generators moving along particular corridors
  const gens = assets.filter((a) => a.equipmentType === "generator" && (a.recoveryLocation || a.trackerLocation));
  const corridorHits = new Map<string, StolenAsset[]>();
  const flows = new Map<string, StolenAsset[]>();
  for (const g of gens) {
    const inc = incById.get(g.incidentId);
    const dest = g.recoveryLocation?.location ?? g.trackerLocation!;
    const destName = g.recoveryLocation?.name ?? "tracker fix";
    const from = inc?.location;
    const hit = from ? corridors.find((c) => distToCorridorKm(from, c) <= 35 && distToCorridorKm(dest, c) <= 35) : undefined;
    if (hit) corridorHits.set(hit.name, [...(corridorHits.get(hit.name) ?? []), g]);
    const key = `${inc?.state ?? "Unknown"} → ${destName}`;
    flows.set(key, [...(flows.get(key) ?? []), g]);
  }
  const topCorr = [...corridorHits.entries()].sort((a, b) => b[1].length - a[1].length)[0];
  if (topCorr) {
    out.push({
      id: "gen-corridor", kind: "corridor",
      headline: `Generators moving along the ${topCorr[0]}`,
      detail: `${topCorr[1].length} of ${gens.length} located generators were stolen from and recovered/tracked within 35 km of this corridor (${fmtNaira(topCorr[1].reduce((s, a) => s + a.valueNaira, 0))}).`,
      confidence: Math.min(0.85, 0.4 + topCorr[1].length / 10),
      basis: "Theft site + recovery / GPS tracker fixes vs corridor geometry",
    });
  }
  const topFlow = [...flows.entries()].sort((a, b) => b[1].length - a[1].length)[0];
  if (topFlow && topFlow[1].length >= 2) {
    out.push({
      id: "gen-flow", kind: "corridor",
      headline: `Generator flow: ${topFlow[0]}`,
      detail: `${topFlow[1].length} generators followed this route (${topFlow[1].map((a) => a.serialNumber).slice(0, 3).join(", ")}${topFlow[1].length > 3 ? "…" : ""}).`,
      confidence: Math.min(0.8, 0.4 + topFlow[1].length / 10),
      basis: "Theft-site state → recovery location",
    });
  }
  return out;
}
