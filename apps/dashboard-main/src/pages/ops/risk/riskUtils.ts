import type { Incident, RiskFactor, RiskForecast, SiteDetail, SiteSummary } from "@/lib/ops";

export type Band = RiskForecast["band"];
export const BANDS: Band[] = ["Critical", "High", "Elevated", "Moderate", "Low"];
export const BAND_COLOR: Record<Band, string> = {
  Critical: "#ef4444", High: "#f97316", Elevated: "#eab308", Moderate: "#3b82f6", Low: "#22c55e",
};
export const BAND_RANGE: Record<Band, string> = { Critical: "80–100", High: "66–79", Elevated: "52–65", Moderate: "38–51", Low: "0–37" };

/** Same thresholds as the server-side forecast. */
export const bandOf = (score: number): Band => (score >= 80 ? "Critical" : score >= 66 ? "High" : score >= 52 ? "Elevated" : score >= 38 ? "Moderate" : "Low");

export const ALL_RECS = [
  { action: "Increase patrol frequency", consequential: false },
  { action: "Pre-position response team", consequential: true },
  { action: "Increase AI sensitivity", consequential: false },
  { action: "Activate enhanced sensor profile", consequential: true },
  { action: "Inspect fence", consequential: false },
  { action: "Audit contractor access", consequential: true },
] as const;

/** Mirrors the server's recommendation rules (used when a site is outside the top-80 forecast list). */
export function recsFor(factors: RiskFactor[]): string[] {
  const out = new Set<string>();
  for (const x of factors.slice(0, 4)) {
    if (x.key === "campaign" || x.key === "neighbours") { out.add("Increase patrol frequency"); out.add("Pre-position response team"); }
    if (x.key === "history" || x.key === "time") out.add("Increase AI sensitivity");
    if (x.key === "sensors") out.add("Activate enhanced sensor profile");
    if (x.key === "assets") out.add("Inspect fence");
    if (x.key === "access") out.add("Audit contractor access");
    if (x.key === "response") out.add("Pre-position response team");
  }
  return [...out];
}

export interface RiskInput {
  label: string;
  present: boolean;
  contribution: number | null; // scored points, if this input is a scored factor
  detail: string;
}

const km = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
  const R = 6371; const toR = Math.PI / 180;
  const dLat = (b.lat - a.lat) * toR; const dLng = (b.lng - a.lng) * toR;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * toR) * Math.cos(b.lat * toR) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

/** The 13 model inputs, showing which are present for this site. */
export function riskInputs(site: SiteSummary, factors: RiskFactor[], detail: SiteDetail | null, incidents: Incident[], nowMs: number): RiskInput[] {
  const f = (key: string) => factors.find((x) => x.key === key);
  const scored = (key: string, label: string, absent: string): RiskInput => {
    const x = f(key);
    return { label, present: !!x, contribution: x?.contribution ?? null, detail: x?.detail ?? absent };
  };
  const inventory = detail?.assets.filter((a) => a.kind === "battery" || a.kind === "diesel") ?? [];
  const recentVisit = detail?.recentVisits.find((v) => nowMs - new Date(v.arrival).getTime() < 7 * 86_400_000);
  const suspicious = incidents.filter((i) => i.vehiclePlates.length && nowMs - new Date(i.detectedAt).getTime() < 30 * 86_400_000 && km(i.location, site.location) < 40);
  const netAnomaly = site.backhaul !== "primary" || (detail ? detail.health.batterySocPct < 30 || detail.health.router !== "ok" : false);

  return [
    scored("history", "Previous incidents", "No incidents at this site in 180 days"),
    scored("neighbours", "Neighbouring-site incidents", "No incidents within 15 km in 30 days"),
    scored("assets", "Asset attractiveness", "Standard equipment profile"),
    {
      label: "Diesel / battery inventory", present: inventory.length > 0, contribution: null,
      detail: detail ? (inventory.length ? inventory.map((a) => a.label).join(" · ") : "No battery or diesel stock recorded") : "Loading site inventory…",
    },
    scored("time", "Time / day", "No elevated time window"),
    scored("access", "Access patterns", "No flagged visits in 30 days"),
    scored("response", "Response distance", `Nearest team ETA ${site.nearestTeamEtaMin} min (within target)`),
    scored("sensors", "Sensor anomalies", "All sensors and cameras reporting"),
    {
      label: "Maintenance activity", present: site.status === "maintenance" || !!recentVisit, contribution: null,
      detail: site.status === "maintenance" ? "Site in maintenance mode" : recentVisit ? `Visit ${recentVisit.id} by ${recentVisit.employer} in last 7 days` : detail ? "No maintenance in last 7 days" : "Loading…",
    },
    {
      label: "Suspicious vehicles / persons", present: suspicious.length > 0 || !!f("campaign"), contribution: f("campaign")?.contribution ?? null,
      detail: suspicious.length ? `${suspicious.length} incident(s) with a flagged vehicle within 40 km in 30 days${f("campaign") ? ` · ${f("campaign")!.detail}` : ""}` : f("campaign")?.detail ?? "None reported nearby",
    },
    {
      label: "Network / power anomalies", present: netAnomaly, contribution: null,
      detail: site.backhaul === "down" ? "Backhaul down" : site.backhaul === "secondary" ? "Running on secondary backhaul" : detail && detail.health.batterySocPct < 30 ? `Battery SOC ${detail.health.batterySocPct}%` : "Normal",
    },
    { label: "Environmental conditions", present: false, contribution: null, detail: "Seasonal baseline only — not scored in the current model" },
    scored("area", "Local threat intelligence", "No local intelligence uplift"),
  ];
}
