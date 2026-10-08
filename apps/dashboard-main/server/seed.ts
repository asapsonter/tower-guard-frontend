/**
 * Deterministic ITIPS operator estate.
 *
 * Same seed → same sites, teams, incidents, people and cases; timestamps are
 * anchored to `nowMs` so live incidents always look live. Demo data only —
 * no real persons, sites or cases.
 */
import {
  RESPONSE_STAGES,
  type AccessStatus, type AccessVisit, type AssetKind, type Campaign, type CaseFile, type CaseKpis, type CaseStage,
  type Cluster, type EvidenceItem, type FusionAssessment, type FusionSignal, type GeoPoint, type Incident,
  type IncidentStatus, type IncidentType, type InsiderFlag, type InsiderSubject, type Kpi, type MonthlyImpact,
  type OpsSnapshot, type OverviewKpis, type PatternFinding, type ProtectionState, type ResponseRecord, type ResponseStage,
  type ResponseTeam, type RiskFactor, type RiskForecast, type Scorecard, type Severity, type SiteClass, type SiteState,
  type SiteSummary, type TeamStatus, type Tenant, type TimelineEvent, type Zone,
} from "./types.js";
import { CORRIDORS, LOCALITIES, STATES, distanceKm, offsetKm, routeBetween } from "./geo.js";

export function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const FIRST = ["John", "Musa", "Ibrahim", "Chinedu", "Emeka", "Tunde", "Ngozi", "Halima", "Aisha", "Blessing", "Yakubu", "Grace", "Abdullahi", "Femi", "Kelechi", "Usman", "Bola", "Ifeanyi", "Zainab", "Samuel", "Sani", "Uche", "Segun", "Nnamdi", "Bashir", "Chioma", "Danladi", "Kemi", "Peter", "Hauwa"];
export const LAST = ["Adeyemi", "Okafor", "Eze", "Bakare", "Yusuf", "Danjuma", "Ade", "Bello", "Nwosu", "Garba", "Okon", "Ibrahim", "Obi", "Lawal", "Okoro", "Mohammed", "Afolabi", "Umar", "Nnaji", "Aliyu", "Ogunleye", "Suleiman", "Chukwu", "Balogun", "Shehu", "Effiong", "Adamu", "Onyeka", "Salisu", "Agbaje"];
export const CONTRACTORS = ["XYZ Power Ltd", "Apex Telecoms Services", "Bluewave Tower Maintenance", "Northfield Power Solutions", "Zenra Field Services", "Kadmos Engineering", "Delta Grid Services"];
export const RESPONSE_VENDORS = ["Sentinel Armed Response", "Halogen Response", "ITIPS Rapid Response"];
const TENANTS: Tenant[] = ["MTN", "Airtel", "Glo", "9mobile"];
const IMAGES = ["/evidence/intruder-snapshot.jpg", "/evidence/evidence1.jpeg", "/evidence/cctv-feed-nigerian-mast.jpg", "/evidence/thermal-detection-feed.jpg", "/evidence/camera-feed.jpg"];

/** Sites per state — the estate is concentrated where the towers are. */
const SITE_WEIGHT: Record<string, number> = { Lagos: 260, FCT: 170, Kano: 120, Rivers: 115, Kaduna: 120, Oyo: 95, Ogun: 80, Delta: 70, Enugu: 60, Anambra: 65, Edo: 55, Niger: 55, Plateau: 45, Kogi: 45, Kwara: 40, Imo: 50, Abia: 45, "Akwa Ibom": 40, Nasarawa: 35, Benue: 40, Katsina: 45, Bauchi: 35, Ondo: 40, Osun: 35 };
/** Relative incident pressure per state. */
const THREAT_WEIGHT: Record<string, number> = { Kaduna: 10, FCT: 8, Lagos: 7, Rivers: 7, Kano: 5, Niger: 5, Delta: 4, Oyo: 3, Ogun: 3, Kogi: 3, Enugu: 2, Plateau: 2, Edo: 2, Nasarawa: 2, Anambra: 2, Imo: 2, Abia: 2 };

const TYPE_TITLE: Record<IncidentType, string> = {
  vandalism: "VANDALISM", battery_theft: "BATTERY THEFT", generator_theft: "GENERATOR THEFT", diesel_theft: "DIESEL THEFT",
  cable_theft: "CABLE THEFT", solar_theft: "SOLAR THEFT", intrusion: "INTRUSION", sabotage: "SABOTAGE",
};
const TYPE_TARGET: Record<IncidentType, AssetKind> = {
  vandalism: "feeder", battery_theft: "battery", generator_theft: "generator", diesel_theft: "diesel",
  cable_theft: "feeder", solar_theft: "solar", intrusion: "shelter", sabotage: "tower",
};
const TYPE_MODUS: Record<IncidentType, string[]> = {
  vandalism: ["Fence cut", "Gate forced", "Climbed fence"],
  battery_theft: ["Battery cabinet forced", "Gate forced", "Insider-assisted access"],
  generator_theft: ["Gate forced", "Generator housing cut", "Truck-assisted removal"],
  diesel_theft: ["Fuel tank siphoned", "Tank lock cut"],
  cable_theft: ["Feeder cables cut", "Fence cut", "Ladder climb"],
  solar_theft: ["Panel brackets unbolted", "Fence cut"],
  intrusion: ["Climbed fence", "Gate forced"],
  sabotage: ["Cables cut at ladder base", "Equipment smashed", "Insider-assisted access"],
};
const LOSS_RANGE: Record<IncidentType, [number, number]> = {
  vandalism: [300_000, 1_800_000], battery_theft: [900_000, 6_400_000], generator_theft: [6_000_000, 14_000_000],
  diesel_theft: [180_000, 900_000], cable_theft: [250_000, 1_600_000], solar_theft: [400_000, 2_200_000],
  intrusion: [0, 0], sabotage: [1_200_000, 4_500_000],
};
const SLA_SEC = 1200; // 20:00 armed-response SLA (ATC SOW)

/** Per-snapshot risk factors for every site (not serialised; used by the site twin). */
export const siteRiskFactors = new WeakMap<OpsSnapshot, Map<string, RiskFactor[]>>();

export function buildSnapshot(nowMs: number): OpsSnapshot {
  const r = mulberry32(20261008);
  const int = (lo: number, hi: number) => Math.floor(lo + r() * (hi - lo + 1));
  const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(r() * arr.length)];
  const chance = (p: number) => r() < p;
  const isoAt = (ms: number) => new Date(ms).toISOString();
  const isoAgo = (sec: number) => isoAt(nowMs - sec * 1000);
  const hex = (n: number) => Array.from({ length: n }, () => "0123456789abcdef"[Math.floor(r() * 16)]).join("");
  const person = () => `${pick(FIRST)} ${pick(LAST)}`;
  const plate = (code: string) => `${code}-${int(100, 999)}${String.fromCharCode(65 + int(0, 25))}${String.fromCharCode(65 + int(0, 25))}`;
  const DAY = 86400;
  const stateMeta = new Map(STATES.map((s) => [s.state, s]));

  // ── Clusters ──────────────────────────────────────────────────────────
  const clusters: Cluster[] = [];
  for (const s of STATES) {
    const n = Math.max(1, Math.round((SITE_WEIGHT[s.state] ?? 25) / 55));
    const locs = LOCALITIES[s.state] ?? [];
    for (let i = 0; i < n; i++) {
      const loc = locs[i];
      const center = loc ? { lat: loc.lat, lng: loc.lng } : offsetKm({ lat: s.lat, lng: s.lng }, (i - n / 2) * 22, (i % 2 ? 1 : -1) * 15);
      clusters.push({ id: `${s.code}-C${String(i + 1).padStart(2, "0")}`, name: `${loc?.name ?? s.capital} cluster`, state: s.state, zone: s.zone, center, responseTeamIds: [] });
    }
  }
  const clustersByState = new Map<string, Cluster[]>();
  clusters.forEach((c) => clustersByState.set(c.state, [...(clustersByState.get(c.state) ?? []), c]));

  // ── Response teams (managed response vendors) ─────────────────────────
  const teams: ResponseTeam[] = [];
  for (const c of clusters) {
    const n = (THREAT_WEIGHT[c.state] ?? 1) >= 5 ? 2 : 1;
    for (let i = 0; i < n; i++) {
      const id = `RT-${c.id.replace("-C", "")}-${i + 1}`;
      const meta = stateMeta.get(c.state)!;
      teams.push({
        id,
        callsign: `Team ${c.id.split("-")[0]} ${c.id.split("-C")[1]}.${i + 1}`,
        provider: pick(RESPONSE_VENDORS),
        clusterId: c.id,
        state: c.state,
        status: pick<TeamStatus>(["available", "available", "available", "available", "unavailable"]),
        location: offsetKm(c.center, (r() - 0.5) * 8, (r() - 0.5) * 8),
        vehicle: { plate: plate(meta.code), type: pick(["Toyota Hilux", "Toyota Land Cruiser", "Ford Ranger", "Mitsubishi L200"]) },
        crew: Array.from({ length: int(3, 4) }, (_, k) => ({ name: person(), role: k === 0 ? "Team lead" : k === 1 ? "Driver" : "Response officer", armed: k !== 1 && chance(0.7) })),
        currentIncidentId: null,
        lastGpsFix: isoAgo(int(5, 90)),
      });
      c.responseTeamIds.push(id);
    }
  }
  const teamById = new Map(teams.map((t) => [t.id, t]));

  // ── Sites ─────────────────────────────────────────────────────────────
  const sites: SiteSummary[] = [];
  const siteMeta = new Map<string, { lga: string; riskBase: number }>();
  for (const s of STATES) {
    const n = SITE_WEIGHT[s.state] ?? 25;
    const cl = clustersByState.get(s.state)!;
    const locs = LOCALITIES[s.state] ?? [];
    for (let i = 0; i < n; i++) {
      const c = cl[i % cl.length];
      // Most sites near cluster centres, some along corridors / rural
      const spread = chance(0.7) ? 12 : 40;
      const location = offsetKm(c.center, (r() - 0.5) * spread * 2, (r() - 0.5) * spread * 2);
      const id = `ATC-${s.code}-${String(i + 1).padStart(4, "0")}`;
      const near = locs.length ? locs.reduce((a, b) => (distanceKm(a, location) < distanceKm(b, location) ? a : b)) : null;
      const placeName = near && distanceKm(near, location) < 8 ? near.name : `${s.capital} ${pick(["North", "South", "East", "West", "Road", "Junction", "Estate", "Village"])}`;
      const siteClass: SiteClass = i % 40 === 0 ? "Hub" : chance(0.2) ? "P1" : chance(0.5) ? "P2" : "P3";
      const tenants = TENANTS.filter(() => chance(0.45));
      if (!tenants.length) tenants.push(pick(TENANTS));
      const nearestTeam = c.responseTeamIds.map((tid) => teamById.get(tid)!).sort((a, b) => distanceKm(a.location, location) - distanceKm(b.location, location))[0];
      const km = distanceKm(nearestTeam.location, location) * 1.3;
      sites.push({
        id,
        name: `${placeName} ${siteClass === "Hub" ? "Hub" : "Site"}`,
        location,
        zone: s.zone,
        state: s.state,
        clusterId: c.id,
        tenants,
        siteClass,
        status: "normal",
        riskScore: 0,
        protectionScore: 100,
        protectionState: "FULLY PROTECTED",
        cctvOnline: true,
        backhaul: "primary",
        nearestTeamId: nearestTeam.id,
        nearestTeamEtaMin: Math.round(3 + (km / 42) * 60),
        activeIncidentId: null,
      });
      siteMeta.set(id, { lga: near?.area ?? s.areas[0], riskBase: (THREAT_WEIGHT[s.state] ?? 1) * 3 + r() * 12 });
    }
  }
  const siteById = new Map(sites.map((s) => [s.id, s]));
  const sitesByState = new Map<string, SiteSummary[]>();
  sites.forEach((s) => sitesByState.set(s.state, [...(sitesByState.get(s.state) ?? []), s]));

  // Site health / degraded states
  for (const s of sites) {
    // Hub/P1 sites get priority maintenance, so faults are rarer there
    const roll = r() / (s.siteClass === "Hub" || s.siteClass === "P1" ? 0.25 : 1);
    if (roll < 0.005) { s.status = "offline"; s.cctvOnline = false; s.backhaul = "down"; }
    else if (roll < 0.015) { s.status = "maintenance"; }
    else if (roll < 0.04) {
      s.status = "warning";
      if (chance(0.6)) s.backhaul = "secondary";
      else s.cctvOnline = chance(0.7);
    } else if (roll < 0.055) { s.backhaul = "secondary"; }
  }

  // ── Incidents ─────────────────────────────────────────────────────────
  const incidents: Incident[] = [];
  const RESERVED = new Set(["INC-2026-10482", "INC-2026-10491", "INC-2026-10495"]);
  let incSeq = 10120;
  const nextIncId = () => { let id: string; do id = `INC-2026-${++incSeq}`; while (RESERVED.has(id)); return id; };

  const fusionFor = (type: IncidentType, at: number, opts: { insider?: boolean; workOrder?: boolean; nuisance?: boolean } = {}): FusionAssessment => {
    const t = (s: number) => isoAt(at + s * 1000);
    if (opts.nuisance) {
      const signals: FusionSignal[] = [
        { source: "PIR Zone 2", kind: "sensor", finding: "Motion detected", supports: true, weight: 14, at: t(0) },
        { source: "Camera 1", kind: "video", finding: "Animal (goat) classified, no human", supports: false, weight: -22, at: t(2) },
        { source: "mmWave radar", kind: "sensor", finding: "Small, low track — not human gait", supports: false, weight: -12, at: t(3) },
        { source: "Fence vibration", kind: "sensor", finding: "No vibration", supports: false, weight: -6, at: null },
      ];
      return { confidence: 18, verdict: "Likely nuisance alarm", signals };
    }
    const signals: FusionSignal[] = [
      { source: "Camera 1", kind: "video", finding: "Human detected", supports: true, weight: 38, at: t(2) },
      { source: "mmWave radar", kind: "sensor", finding: "Radar confirms movement", supports: true, weight: 24, at: t(0) },
      { source: "Fence vibration", kind: "sensor", finding: type === "diesel_theft" ? "No fence vibration" : "Fence vibration detected", supports: type !== "diesel_theft", weight: type === "diesel_theft" ? 0 : 18, at: type === "diesel_theft" ? null : t(4) },
      opts.workOrder
        ? { source: "Gate contact", kind: "sensor", finding: "Gate opened with access PIN", supports: false, weight: -10, at: t(-60) }
        : { source: "Gate contact", kind: "sensor", finding: "Gate remains closed", supports: true, weight: 6, at: null },
      opts.workOrder
        ? { source: "Access control", kind: "access", finding: "Work order on file — but outside approved window", supports: true, weight: 4, at: null }
        : { source: "Access control", kind: "access", finding: "No authorised work order", supports: true, weight: 8, at: null },
    ];
    if (type === "battery_theft") signals.push({ source: "Battery-bank movement", kind: "sensor", finding: "Battery modules moved", supports: true, weight: 6, at: t(70) });
    if (opts.insider) signals.push({ source: "Camera 2", kind: "video", finding: "Camera obscured 3 min after entry", supports: true, weight: 6, at: t(180) });
    const confidence = Math.max(5, Math.min(99, signals.reduce((s, x) => s + x.weight, 0)));
    return { confidence, verdict: confidence >= 85 ? "Probable intrusion" : confidence >= 60 ? "Possible intrusion" : opts.workOrder ? "Authorised activity" : "Likely nuisance alarm", signals };
  };

  interface Spec {
    id?: string; site: SiteSummary; type: IncidentType; severity: Severity; status: IncidentStatus; agoSec: number;
    insider?: boolean; nuisance?: boolean; plates?: string[]; campaignId?: string | null; claimedLate?: boolean;
    timeline?: TimelineEvent[]; title?: string; outcome?: Incident["outcome"];
  }

  const makeIncident = (sp: Spec): Incident => {
    const site = sp.site;
    const det = nowMs - sp.agoSec * 1000;
    const t = (s: number) => isoAt(det + s * 1000);
    const off: Record<ResponseStage, number> = {
      alert: 0, verified: int(5, 20), dispatched: int(20, 60), departed: int(80, 240),
      arrived: chance(0.03) ? int(1250, 2100) : int(400, 880), secured: 0, closed: 0,
    };
    off.arrived = Math.max(off.arrived, off.departed + 200);
    if (sp.claimedLate) off.arrived = Math.max(off.arrived, int(1500, 2000));
    off.secured = off.arrived + int(120, 900);
    off.closed = off.secured + int(1800, 7200);
    const reached: Record<IncidentStatus, ResponseStage> = { detected: "alert", verified: "verified", dispatched: "dispatched", en_route: "departed", on_site: "arrived", secured: "secured", closed: "closed" };
    const lastIdx = RESPONSE_STAGES.indexOf(reached[sp.status]);
    const stages: Partial<Record<ResponseStage, string>> = {};
    RESPONSE_STAGES.forEach((st, i) => { if (i <= lastIdx && off[st] <= sp.agoSec) stages[st] = t(off[st]); });
    if ((sp.status === "on_site" || sp.status === "secured") && !stages.arrived) { off.arrived = Math.max(60, sp.agoSec - int(60, 300)); stages.arrived = t(off.arrived); }
    const arrivedSec = stages.arrived ? off.arrived : null;
    const breached = arrivedSec !== null ? arrivedSec > SLA_SEC : sp.agoSec > SLA_SEC && !["detected", "verified"].includes(sp.status);
    const claimGap = int(11, 19) * 60;
    const response: ResponseRecord = {
      slaSeconds: SLA_SEC,
      stages,
      distanceKm: 0,
      predictedEtaSec: null,
      arrivalVerifiedBy: stages.arrived ? (["gps_geofence", "geo_checkin", "access_record", "cctv"] as const).filter((_, i) => i === 0 || chance(0.5)) : [],
      claimedArrival: sp.claimedLate && stages.arrived ? t(off.arrived - claimGap) : undefined,
      gpsTrack: [],
      breached,
      breachReason: breached ? (sp.claimedLate ? `Team-reported arrival not supported by GPS geofence (verified ${Math.round(claimGap / 60)} min later)` : pick(["Traffic on approach road", "Team diverted from prior incident", "Late acknowledgement", "Vehicle breakdown", "Flooded access road", "Waited for police escort"])) : undefined,
    };
    const fusion = fusionFor(sp.type, det, { insider: sp.insider, workOrder: sp.insider, nuisance: sp.nuisance });
    const timeline: TimelineEvent[] = sp.timeline ?? [
      { at: t(0), source: "radar", label: "Radar detection" },
      { at: t(2), source: "camera", label: sp.nuisance ? "Camera classifies animal" : "Camera detects person" },
      ...(stages.verified ? [{ at: stages.verified, source: "ai" as const, label: `AI ${sp.nuisance ? "rejects alarm" : "verifies intrusion"} · ${fusion.confidence}%` }] : []),
      ...(stages.dispatched ? [{ at: stages.dispatched, source: "response" as const, label: "Response dispatched" }] : []),
      ...(stages.arrived ? [{ at: stages.arrived, source: "gps" as const, label: "Validated arrival (GPS geofence)" }] : []),
      ...(stages.secured ? [{ at: stages.secured, source: "response" as const, label: "Site secured" }] : []),
      ...(stages.closed ? [{ at: stages.closed, source: "noc" as const, label: "Incident closed" }] : []),
    ];
    const [lo, hi] = LOSS_RANGE[sp.type];
    const outcome: Incident["outcome"] = sp.outcome ?? (sp.nuisance ? "false_alarm" : sp.status !== "closed" ? "ongoing" : chance(0.72) ? "disrupted" : chance(0.6) ? "theft_completed" : "damage_only");
    const loss = outcome === "theft_completed" ? int(lo / 1000, hi / 1000) * 1000 : outcome === "damage_only" ? int(lo / 4000, hi / 4000) * 1000 : 0;
    const severityTitle = sp.status !== "closed" ? "ACTIVE " : "";
    return {
      id: sp.id ?? nextIncId(),
      type: sp.type,
      title: sp.title ?? `${severityTitle}${TYPE_TITLE[sp.type]}`,
      severity: sp.severity,
      status: sp.status,
      siteId: site.id,
      siteName: site.name,
      location: site.location,
      state: site.state,
      zone: site.zone,
      clusterId: site.clusterId,
      tenant: site.tenants[0],
      detectedAt: t(0),
      closedAt: stages.closed ?? null,
      fusion,
      timeline,
      teamId: null,
      response,
      evidenceCount: int(4, 14),
      caseId: null,
      campaignId: sp.campaignId ?? null,
      insiderRisk: !!sp.insider,
      vehiclePlates: sp.plates ?? [],
      modus: [pick(TYPE_MODUS[sp.type])],
      targetAsset: TYPE_TARGET[sp.type],
      outcome,
      lossNaira: loss,
      recoveredNaira: outcome === "theft_completed" && chance(0.35) ? Math.round(loss * (0.3 + r() * 0.7) / 1000) * 1000 : 0,
      downtimeMin: outcome === "theft_completed" ? int(40, 600) : outcome === "damage_only" ? int(20, 240) : 0,
      escalation: [
        { level: 1, role: "NOC operator", name: person(), notifiedAt: t(off.verified), acknowledged: true },
        { level: 2, role: "Cluster security manager", name: person(), notifiedAt: sp.severity === "critical" || sp.severity === "high" ? t(off.verified + 20) : null, acknowledged: sp.status !== "verified" },
        { level: 3, role: "Regional head of security", name: person(), notifiedAt: sp.severity === "critical" ? t(off.verified + 60) : null, acknowledged: sp.severity === "critical" && sp.status !== "verified" },
        { level: 4, role: "Chief Security Officer", name: person(), notifiedAt: breached && sp.severity === "critical" ? t(SLA_SEC) : null, acknowledged: false },
      ],
      comms: [],
    };
  };

  // Pick a site in a state, avoiding ones already in an incident
  const siteIn = (state: string, near?: GeoPoint, exclude?: SiteSummary[]) => {
    const pool = (sitesByState.get(state) ?? sites).filter((s) => !s.activeIncidentId && s.status !== "offline" && !exclude?.includes(s));
    if (near) return pool.sort((a, b) => distanceKm(a.location, near) - distanceKm(b.location, near))[0];
    return pick(pool);
  };

  // ── Campaign V-17: Kaduna battery theft expanding southward toward Abuja ──
  const V17_PLATE = "KAD-482XA";
  const v17Sites: SiteSummary[] = [];
  const corridor = CORRIDORS.find((c) => c.id === "COR-ABJ-KAD")!.path.slice().reverse(); // Kaduna → Abuja
  corridor.forEach((p, i) => { const s = siteIn(i < 5 ? "Kaduna" : "FCT", p, v17Sites); if (s) v17Sites.push(s); });
  while (v17Sites.length < 8) v17Sites.push(siteIn("Kaduna", { lat: 10.1 - v17Sites.length * 0.08, lng: 7.4 }, v17Sites));
  const v17Incs: Incident[] = v17Sites.map((site, i) => makeIncident({
    site, type: "battery_theft", severity: i > 5 ? "critical" : "high", status: "closed", agoSec: (40 - i * 4.6) * DAY + int(0, 3) * 3600 + 2 * 3600,
    campaignId: "V-17", plates: i % 2 === 0 || i > 4 ? [V17_PLATE] : [], insider: i === 3,
  }));
  v17Incs.forEach((inc) => { inc.modus = ["Battery cabinet forced"]; inc.detectedAt = inc.detectedAt; });
  incidents.push(...v17Incs);

  // V-09: Lagos feeder-cable cutting, same modus at 12 sites
  const v09Incs = Array.from({ length: 12 }, (_, i) => makeIncident({ site: siteIn("Lagos"), type: "cable_theft", severity: "high", status: "closed", agoSec: int(3, 60) * DAY + int(1, 3) * 3600, campaignId: "V-09" }));
  v09Incs.forEach((inc) => { inc.modus = ["Feeder cables cut"]; });
  incidents.push(...v09Incs);

  // V-21: Rivers diesel siphoning linked to one contractor ecosystem
  const v21Incs = Array.from({ length: 3 }, () => makeIncident({ site: siteIn("Rivers"), type: "diesel_theft", severity: "medium", status: "closed", agoSec: int(5, 25) * DAY, campaignId: "V-21", insider: true }));
  incidents.push(...v21Incs);

  // Featured live incident from the brief — exact timeline offsets
  const kadSite = siteIn("Kaduna", { lat: 10.548, lng: 7.464 });
  const F0 = nowMs - (17 * 60 + 30) * 1000;
  const ft = (s: number) => isoAt(F0 + s * 1000);
  const featured = makeIncident({
    id: "INC-2026-10482", site: kadSite, type: "vandalism", severity: "critical", status: "secured", agoSec: 17 * 60 + 30, campaignId: "V-17", plates: [V17_PLATE],
    title: "ACTIVE VANDALISM",
    timeline: [
      { at: ft(0), source: "radar", label: "Radar detection", detail: "2 tracks, 36 m north of fence" },
      { at: ft(2), source: "camera", label: "Camera detects person", detail: "Camera 1 (optical)" },
      { at: ft(4), source: "sensor", label: "Fence vibration", detail: "North fence, 2.6g peak" },
      { at: ft(7), source: "ai", label: "AI verifies intrusion", detail: "Sensor fusion confidence 94% — probable intrusion" },
      { at: ft(9), source: "deterrent", label: "Audio warning activated", detail: "Pre-recorded warning in English and Hausa" },
      { at: ft(12), source: "system", label: "Incident created" },
      { at: ft(15), source: "noc", label: "Monitoring Centre acknowledgement" },
      { at: ft(24), source: "response", label: "Response dispatched" },
      { at: ft(279), source: "gps", label: "Team 4.3 km away" },
      { at: ft(600), source: "gps", label: "Validated arrival", detail: "GPS geofence + CCTV" },
      { at: ft(788), source: "camera", label: "Suspect flees", detail: "Northbound on foot toward Kawo" },
      { at: ft(1023), source: "response", label: "Site secured" },
    ],
  });
  featured.response.stages = { alert: ft(0), verified: ft(7), dispatched: ft(24), departed: ft(70), arrived: ft(600), secured: ft(1023) };
  featured.response.arrivalVerifiedBy = ["gps_geofence", "cctv"];
  featured.response.breached = false;
  featured.response.breachReason = undefined;
  featured.response.claimedArrival = undefined;
  featured.outcome = "disrupted";
  featured.lossNaira = 0;
  featured.fusion.confidence = 94;
  featured.comms = [
    { at: ft(15), from: "NOC Abuja", channel: "app", text: "Acknowledged. Dispatching nearest armed team." },
    { at: ft(30), from: "Team", channel: "radio", text: "Copy. Moving from Kawo junction, 3 armed." },
    { at: ft(279), from: "NOC Abuja", channel: "radio", text: "Two suspects still at north fence, cutting tool visible." },
    { at: ft(600), from: "Team", channel: "radio", text: "On site. Suspects fleeing north. Securing perimeter." },
    { at: ft(1023), from: "Team", channel: "app", text: "Site secured. Feeder intact, fence breached 1.2 m." },
  ];
  incidents.push(featured);

  // Live SLA countdown demo: 12:42 remaining on a 20:00 SLA
  incidents.push(makeIncident({ id: "INC-2026-10491", site: siteIn("FCT", { lat: 9.1561, lng: 7.3222 }), type: "battery_theft", severity: "critical", status: "en_route", agoSec: 7 * 60 + 18, plates: [] }));
  // Awaiting dispatch (smart dispatch demo)
  incidents.push(makeIncident({ id: "INC-2026-10495", site: siteIn("Rivers", { lat: 4.8124, lng: 7.0429 }), type: "generator_theft", severity: "critical", status: "verified", agoSec: 95 }));
  // Insider-risk event: technician entered 02:14, no work order, cabinet opened, CCTV obscured
  const insiderSite = siteIn("FCT", { lat: 8.9761, lng: 7.3711 });
  // Technician badge-in at 02:14 WAT two nights ago; the alarm follows a minute later
  const nowD = new Date(nowMs);
  const insiderAlarmMs = Date.UTC(nowD.getUTCFullYear(), nowD.getUTCMonth(), nowD.getUTCDate() - 2, 1, 15); // 02:15 WAT
  const insiderInc = makeIncident({ site: insiderSite, type: "battery_theft", severity: "high", status: "closed", agoSec: Math.round((nowMs - insiderAlarmMs) / 1000), insider: true, plates: ["ABJ-219KS"] });
  incidents.push(insiderInc);

  // Remaining active incidents
  const activeMix: [IncidentStatus, Severity][] = [
    ["detected", "high"], ["detected", "medium"], ["detected", "low"], ["verified", "high"], ["verified", "medium"],
    ["dispatched", "critical"], ["dispatched", "high"], ["dispatched", "medium"], ["en_route", "critical"], ["en_route", "high"],
    ["on_site", "critical"], ["on_site", "critical"], ["on_site", "high"], ["on_site", "medium"], ["secured", "high"], ["secured", "medium"], ["secured", "low"],
  ];
  const activeStates = ["Lagos", "Kaduna", "FCT", "Kano", "Rivers", "Niger", "Delta", "Oyo", "Kaduna", "Lagos", "Kogi", "Rivers", "Plateau", "Ogun", "Enugu", "Edo", "FCT"];
  activeMix.forEach(([status, severity], i) => {
    const type = pick<IncidentType>(["battery_theft", "battery_theft", "cable_theft", "generator_theft", "diesel_theft", "vandalism", "intrusion", "solar_theft", "sabotage"]);
    const ago = status === "detected" ? int(15, 90) : status === "verified" ? int(40, 200) : status === "dispatched" ? int(90, 360) : status === "en_route" ? int(240, 900) : status === "on_site" ? int(700, 2400) : int(1500, 4800);
    incidents.push(makeIncident({ site: siteIn(activeStates[i]), type, severity, status, agoSec: ago, nuisance: status === "detected" && severity === "low" }));
  });

  // Historical incidents — 180 days, night-heavy, weighted by threat
  const weighted = STATES.flatMap((s) => Array(THREAT_WEIGHT[s.state] ?? 1).fill(s.state) as string[]);
  const histPlates = Array.from({ length: 30 }, () => plate(pick(["KAD", "ABJ", "LAG", "PHC", "KAN"])));
  for (let i = 0; i < 420; i++) {
    // Incident density falls over time as ITIPS deterrence takes hold
    const daysAgo = Math.floor((1 - Math.pow(r(), 2)) * 180);
    const hourWat = chance(0.68) ? pick([1, 2, 3, 4, 0, 23]) : int(5, 22);
    const d = new Date(nowMs);
    const when = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - daysAgo, hourWat - 1, int(0, 59), int(0, 59));
    const ago = Math.max(5 * 3600, Math.floor((nowMs - when) / 1000));
    const state = pick(weighted);
    const type = pick<IncidentType>(["battery_theft", "battery_theft", "battery_theft", "cable_theft", "cable_theft", "generator_theft", "diesel_theft", "diesel_theft", "vandalism", "intrusion", "solar_theft", "sabotage"]);
    incidents.push(makeIncident({
      site: siteIn(state), type, severity: pick(["critical", "high", "high", "medium", "medium", "low"]), status: "closed", agoSec: ago,
      nuisance: chance(0.06), claimedLate: chance(0.05), plates: chance(0.08) ? [pick(histPlates)] : [],
    }));
  }
  // Kaduna surge this month (drives "why did vandalism increase in Kaduna?")
  for (let i = 0; i < 9; i++) {
    const inc = makeIncident({ site: siteIn("Kaduna", { lat: 10.55 - i * 0.04, lng: 7.44 }), type: pick(["vandalism", "battery_theft", "cable_theft"]), severity: "high", status: "closed", agoSec: int(1, 6) * DAY + pick([1, 2, 3]) * 3600 });
    inc.modus = [pick(["Fence cut", "Battery cabinet forced"])];
    incidents.push(inc);
  }

  // ── Attach teams, site states ──────────────────────────────────────────
  incidents.sort((a, b) => b.detectedAt.localeCompare(a.detectedAt));
  const active = incidents.filter((i) => i.status !== "closed");
  for (const inc of active) {
    const site = siteById.get(inc.siteId)!;
    site.activeIncidentId = inc.id;
    site.status = inc.severity === "critical" ? "critical" : "incident";
    if (["detected", "verified"].includes(inc.status)) continue;
    const team = teams
      .filter((t) => t.state === inc.state && !t.currentIncidentId && t.status !== "unavailable")
      .sort((a, b) => distanceKm(a.location, inc.location) - distanceKm(b.location, inc.location))[0];
    if (!team) {
      // No free team in the state: the incident is still waiting for a dispatch decision
      inc.status = "verified";
      const keep = { alert: inc.response.stages.alert, verified: inc.response.stages.verified };
      inc.response.stages = keep;
      inc.response.arrivalVerifiedBy = [];
      inc.timeline = inc.timeline.filter((t) => !["response", "gps"].includes(t.source));
      continue;
    }
    inc.teamId = team.id;
    team.currentIncidentId = inc.id;
    const origin = team.location;
    inc.response.distanceKm = Math.round(distanceKm(origin, inc.location) * 1.3 * 10) / 10;
    inc.response.gpsTrack = routeBetween(origin, inc.location, int(-3, 3));
    if (inc.status === "dispatched") { team.status = "assigned"; inc.response.predictedEtaSec = Math.round((inc.response.distanceKm / 42) * 3600) + 120; }
    if (inc.status === "en_route") {
      team.status = "en_route";
      team.location = { lat: origin.lat + (inc.location.lat - origin.lat) * 0.4, lng: origin.lng + (inc.location.lng - origin.lng) * 0.4 };
      inc.response.gpsTrack = [...inc.response.gpsTrack.slice(0, 2), team.location];
      inc.response.predictedEtaSec = Math.round((distanceKm(team.location, inc.location) * 1.3 / 45) * 3600);
    }
    if (inc.status === "on_site" || inc.status === "secured") { team.status = "on_site"; team.location = offsetKm(inc.location, 0.04, 0.04); }
  }
  // Featured incident: the assigned team is the one on the radio log, with 3 armed officers
  if (featured.teamId) {
    const ft = teamById.get(featured.teamId)!;
    ft.crew = ft.crew.map((c, i) => ({ ...c, armed: i !== 1 }));
    while (ft.crew.filter((c) => c.armed).length < 3) ft.crew.push({ name: person(), role: "Response officer", armed: true });
    featured.comms = featured.comms.map((c) => (c.from.startsWith("Team") ? { ...c, from: ft.callsign } : c));
  }
  // INC-10491 should show ~12:42 remaining with a believable ETA
  const live = incidents.find((i) => i.id === "INC-2026-10491")!;
  if (live.teamId) live.response.predictedEtaSec = 6 * 60 + 40;
  // One team in emergency status (officer injured on earlier call)
  const emergencyTeam = teams.find((t) => t.state === "Rivers" && !t.currentIncidentId);
  if (emergencyTeam) emergencyTeam.status = "emergency";
  for (const inc of incidents.filter((i) => i.status === "closed")) {
    const pool = teams.filter((t) => t.state === inc.state);
    inc.teamId = pool.length ? pick(pool).id : null;
    const team = inc.teamId ? teamById.get(inc.teamId)! : null;
    if (team) inc.response.distanceKm = Math.round(distanceKm(team.location, inc.location) * 1.3 * 10) / 10;
  }

  // ── Access visits & insider analytics ──────────────────────────────────
  const visits: AccessVisit[] = [];
  const techs = Array.from({ length: 70 }, () => ({ name: person(), employer: pick(CONTRACTORS), plate: plate(pick(["ABJ", "KAD", "LAG", "PHC", "KAN"])) }));
  const addVisit = (v: Omit<AccessVisit, "id">) => { const id = `VIS-${String(visits.length + 1).padStart(5, "0")}`; visits.push({ id, ...v }); return visits[visits.length - 1]; };
  const today = new Date(nowMs);
  const watToday = (h: number, m: number) => Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), h - 1, m);
  // Featured authorised visit from the brief
  const jSite = siteIn("Lagos");
  addVisit({
    person: "John Adeyemi", employer: "XYZ Power Ltd", role: "Power engineer", workOrder: "MTN-88433", siteId: jSite.id, siteName: jSite.name,
    windowStart: isoAt(watToday(14, 0) - DAY * 1000), windowEnd: isoAt(watToday(16, 0) - DAY * 1000), arrival: isoAt(watToday(14, 17) - DAY * 1000), exit: isoAt(watToday(15, 43) - DAY * 1000),
    vehiclePlate: "LAG-771KD", activities: ["Generator PM service", "Fuel level check"], companions: 0, status: "AUTHORIZED", flags: [], linkedIncidentId: null,
  });
  // Featured insider-risk visit: 02:14, no WO, cabinet opened, CCTV obscured 3 min later
  const insT = new Date(insiderInc.detectedAt).getTime();
  addVisit({
    person: "Emeka Onyeka", employer: "Apex Telecoms Services", role: "Field technician", workOrder: null, siteId: insiderSite.id, siteName: insiderSite.name,
    windowStart: null, windowEnd: null, arrival: isoAt(insT - 60_000), exit: isoAt(insT + 34 * 60_000), vehiclePlate: "ABJ-219KS",
    activities: ["Gate opened with technician PIN", "Battery cabinet opened", "Camera 2 obscured (3 min after entry)"], companions: 2,
    status: "INSIDER_RISK", flags: ["outside_hours", "no_work_order", "out_of_scope_asset", "unknown_companions", "camera_obstructed_after", "repeat_before_theft"], linkedIncidentId: insiderInc.id,
  });
  // V-17 pre-theft visits by the same contractor ecosystem
  v17Incs.slice(2, 6).forEach((inc, i) => {
    const s = siteById.get(inc.siteId)!;
    addVisit({
      person: i === 1 ? "Unregistered crew" : "Emeka Onyeka", employer: "Apex Telecoms Services", role: "Field technician", workOrder: i === 2 ? null : `MTN-${int(80000, 89999)}`,
      siteId: s.id, siteName: s.name, windowStart: isoAt(new Date(inc.detectedAt).getTime() - 30 * 3600_000), windowEnd: isoAt(new Date(inc.detectedAt).getTime() - 27 * 3600_000),
      arrival: isoAt(new Date(inc.detectedAt).getTime() - (28 + i) * 3600_000), exit: isoAt(new Date(inc.detectedAt).getTime() - (25 + i) * 3600_000), vehiclePlate: "ABJ-219KS",
      activities: ["Rectifier inspection", "Battery cabinet opened"], companions: i === 1 ? 3 : 0, status: i === 2 ? "NO_WORK_ORDER" : "SCOPE_EXCEEDED",
      flags: ["repeat_before_theft", "multi_site_affected", "out_of_scope_asset", ...(i === 2 ? ["no_work_order" as InsiderFlag] : [])], linkedIncidentId: inc.id,
    });
  });
  // V-21 contractor diesel pattern
  v21Incs.forEach((inc) => {
    const s = siteById.get(inc.siteId)!;
    addVisit({
      person: person(), employer: "Delta Grid Services", role: "Refuelling crew", workOrder: `GLO-${int(20000, 29999)}`, siteId: s.id, siteName: s.name,
      windowStart: isoAt(new Date(inc.detectedAt).getTime() - 8 * 3600_000), windowEnd: isoAt(new Date(inc.detectedAt).getTime() - 6 * 3600_000),
      arrival: isoAt(new Date(inc.detectedAt).getTime() - 7.5 * 3600_000), exit: isoAt(new Date(inc.detectedAt).getTime() - 4 * 3600_000), vehiclePlate: "PHC-904TR",
      activities: ["Diesel delivery", "Fuel sensor recalibration"], companions: 1, status: "SCOPE_EXCEEDED", flags: ["unusual_dwell", "alarm_suppression", "repeat_before_theft"], linkedIncidentId: inc.id,
    });
  });
  // Routine visits over 30 days (the vast majority authorised)
  for (let i = 0; i < 300; i++) {
    const tech = pick(techs);
    const s = pick(sites);
    const start = nowMs - int(1, 30) * DAY * 1000 + int(-4, 4) * 3600_000;
    const roll = r();
    const status: AccessStatus = roll < 0.9 ? "AUTHORIZED" : roll < 0.95 ? "OUTSIDE_WINDOW" : roll < 0.98 ? "NO_WORK_ORDER" : "SCOPE_EXCEEDED";
    const arrival = status === "OUTSIDE_WINDOW" ? start + int(3, 6) * 3600_000 : start + int(0, 40) * 60_000;
    addVisit({
      person: tech.name, employer: tech.employer, role: pick(["Field technician", "Power engineer", "RF engineer", "Generator mechanic", "Refuelling crew"]),
      workOrder: status === "NO_WORK_ORDER" ? null : `${pick(s.tenants)}-${int(80000, 99999)}`, siteId: s.id, siteName: s.name,
      windowStart: status === "NO_WORK_ORDER" ? null : isoAt(start), windowEnd: status === "NO_WORK_ORDER" ? null : isoAt(start + 2 * 3600_000),
      arrival: isoAt(arrival), exit: isoAt(arrival + int(30, 150) * 60_000), vehiclePlate: tech.plate,
      activities: [pick(["Generator PM service", "Battery health check", "Rectifier replacement", "Antenna alignment", "Diesel delivery", "Solar panel cleaning", "Fibre splice"])],
      companions: chance(0.05) ? int(1, 2) : 0, status,
      flags: status === "OUTSIDE_WINDOW" ? ["outside_hours"] : status === "NO_WORK_ORDER" ? ["no_work_order"] : status === "SCOPE_EXCEEDED" ? ["out_of_scope_asset"] : [],
      linkedIncidentId: null,
    });
  }
  // Two visits in progress now
  for (let i = 0; i < 2; i++) {
    const tech = techs[i]; const s = pick(sites);
    addVisit({ person: tech.name, employer: tech.employer, role: "Field technician", workOrder: `${s.tenants[0]}-${int(80000, 99999)}`, siteId: s.id, siteName: s.name, windowStart: isoAgo(3600), windowEnd: isoAgo(-3600), arrival: isoAgo(int(600, 2400)), exit: null, vehiclePlate: tech.plate, activities: ["Battery health check"], companions: 0, status: "IN_PROGRESS", flags: [], linkedIncidentId: null });
  }
  visits.sort((a, b) => b.arrival.localeCompare(a.arrival));

  const subjects = new Map<string, InsiderSubject>();
  for (const v of visits.filter((x) => x.flags.length)) {
    const key = v.person === "Unregistered crew" ? `crew-${v.employer}` : v.person;
    const sub = subjects.get(key) ?? { id: `SUB-${String(subjects.size + 1).padStart(3, "0")}`, name: v.person, employer: v.employer, kind: "technician" as const, riskScore: 0, flags: [] as InsiderFlag[], visitIds: [] as string[], incidentIds: [] as string[], summary: "" };
    sub.visitIds.push(v.id);
    v.flags.forEach((f) => { if (!sub.flags.includes(f)) sub.flags.push(f); });
    if (v.linkedIncidentId && !sub.incidentIds.includes(v.linkedIncidentId)) sub.incidentIds.push(v.linkedIncidentId);
    subjects.set(key, sub);
  }
  // Vehicle as a subject
  subjects.set("veh-ABJ-219KS", { id: `SUB-${String(subjects.size + 1).padStart(3, "0")}`, name: "Vehicle ABJ-219KS", employer: "Apex Telecoms Services (fleet)", kind: "vehicle", riskScore: 0, flags: ["vehicle_multi_incident", "multi_site_affected"], visitIds: visits.filter((v) => v.vehiclePlate === "ABJ-219KS").map((v) => v.id), incidentIds: [...new Set(visits.filter((v) => v.vehiclePlate === "ABJ-219KS" && v.linkedIncidentId).map((v) => v.linkedIncidentId!))], summary: "" });
  const contractorFlags = new Map<string, number>();
  const insiderSubjects = [...subjects.values()].map((s) => {
    s.riskScore = Math.min(97, s.flags.length * 11 + s.incidentIds.length * 9 + (s.flags.includes("camera_obstructed_after") ? 12 : 0));
    s.summary = s.incidentIds.length
      ? `${s.visitIds.length} flagged visit(s); ${s.incidentIds.length} linked incident(s) after access.`
      : `${s.visitIds.length} flagged visit(s); no incident linked.`;
    contractorFlags.set(s.employer, (contractorFlags.get(s.employer) ?? 0) + 1);
    return s;
  }).sort((a, b) => b.riskScore - a.riskScore);

  // ── Campaigns & patterns ─────────────────────────────────────────────
  const campaigns: Campaign[] = [
    {
      id: "V-17", name: "Campaign Cluster V-17 — Kaduna battery theft", siteIds: [...v17Sites.map((s) => s.id), kadSite.id], incidentIds: [...v17Incs.map((i) => i.id), featured.id],
      firstSeen: v17Incs[0].detectedAt, lastSeen: featured.detectedAt, modus: ["Battery cabinet forced", "Fence cut"], targetAssets: ["battery", "feeder"], timeBand: "01:00–04:00",
      vehicles: [V17_PLATE, "ABJ-219KS"], trend: "expanding", direction: "southward (Kaduna → Abuja corridor)", confidence: 0.81,
      summary: "Eight sites hit along the Abuja–Kaduna corridor; same vehicle, same cabinet-forcing method, contractor visits 25–31 h before four thefts.",
    },
    {
      id: "V-09", name: "Campaign Cluster V-09 — Lagos feeder-cable cutting", siteIds: v09Incs.map((i) => i.siteId), incidentIds: v09Incs.map((i) => i.id),
      firstSeen: v09Incs.map((i) => i.detectedAt).sort()[0], lastSeen: v09Incs.map((i) => i.detectedAt).sort().slice(-1)[0], modus: ["Feeder cables cut"], targetAssets: ["feeder"],
      timeBand: "00:00–03:00", vehicles: [], trend: "stable", confidence: 0.72, summary: "Same modus operandi at 12 Lagos sites: feeder cables cut at ladder base, copper stripped on site.",
    },
    {
      id: "V-21", name: "Campaign Cluster V-21 — Rivers diesel siphoning", siteIds: v21Incs.map((i) => i.siteId), incidentIds: v21Incs.map((i) => i.id),
      firstSeen: v21Incs.map((i) => i.detectedAt).sort()[0], lastSeen: v21Incs.map((i) => i.detectedAt).sort().slice(-1)[0], modus: ["Fuel tank siphoned"], targetAssets: ["diesel"],
      timeBand: "Within 8 h of refuelling", vehicles: ["PHC-904TR"], trend: "dormant", confidence: 0.64, summary: "Three diesel losses within hours of deliveries by the same refuelling contractor ecosystem.",
    },
  ];
  const night = incidents.filter((i) => { const h = (new Date(i.detectedAt).getUTCHours() + 1) % 24; return h >= 1 && h < 4; }).length;
  const patterns: PatternFinding[] = [
    { id: "PAT-01", headline: `Same vehicle detected at ${v17Incs.filter((i) => i.vehiclePlates.includes(V17_PLATE)).length + 1} sites in ${Math.round((new Date(featured.detectedAt).getTime() - new Date(v17Incs.filter((i) => i.vehiclePlates.includes(V17_PLATE))[1].detectedAt).getTime()) / 86400000)} days`, kind: "vehicle", confidence: 0.86, evidence: [`ANPR + site CCTV matched plate ${V17_PLATE}`, "Night-time presence 30–90 min before alarms"], siteIds: v17Incs.filter((i) => i.vehiclePlates.includes(V17_PLATE)).map((i) => i.siteId), incidentIds: [...v17Incs.filter((i) => i.vehiclePlates.includes(V17_PLATE)).map((i) => i.id), featured.id], campaignId: "V-17" },
    { id: "PAT-02", headline: "Same modus operandi at 12 sites", kind: "modus", confidence: 0.79, evidence: ["Feeder cables cut at ladder base", "Copper stripped on site, insulation left behind"], siteIds: v09Incs.map((i) => i.siteId), incidentIds: v09Incs.map((i) => i.id), campaignId: "V-09" },
    { id: "PAT-03", headline: "Battery theft cluster expanding southward", kind: "cluster", confidence: 0.74, evidence: ["Cluster centroid moved ~45 km south in 40 days", "Latest hits on the Kaduna–Abuja corridor"], siteIds: v17Sites.map((s) => s.id), incidentIds: v17Incs.map((i) => i.id), campaignId: "V-17" },
    { id: "PAT-04", headline: "Incidents concentrated 01:00–04:00", kind: "time", confidence: 0.92, evidence: [`${Math.round((night / incidents.length) * 100)}% of incidents start between 01:00 and 04:00 WAT`, "Peak 02:00–03:00"], siteIds: [], incidentIds: [], campaignId: null },
    { id: "PAT-05", headline: "Three incidents associated with same contractor ecosystem", kind: "contractor", confidence: 0.63, evidence: ["Delta Grid Services refuelling visits 4–8 h before each diesel loss", "Fuel-sensor recalibration during visit; alarm suppressed"], siteIds: v21Incs.map((i) => i.siteId), incidentIds: v21Incs.map((i) => i.id), campaignId: "V-21" },
  ];

  // ── Predictive risk (0–100, next 72 h) ────────────────────────────────
  const incBySite = new Map<string, Incident[]>();
  incidents.forEach((i) => incBySite.set(i.siteId, [...(incBySite.get(i.siteId) ?? []), i]));
  const recent = incidents.filter((i) => nowMs - new Date(i.detectedAt).getTime() < 30 * DAY * 1000);
  const v17Front = v17Sites[v17Sites.length - 1].location;
  const riskFactorsFor = (s: SiteSummary): RiskFactor[] => {
    const own = (incBySite.get(s.id) ?? []).length;
    const neighbours = recent.filter((i) => i.siteId !== s.id && distanceKm(i.location, s.location) < 15).length;
    const meta = siteMeta.get(s.id)!;
    const f: RiskFactor[] = [
      { key: "history", label: "Previous incidents", contribution: Math.min(22, own * 9), detail: `${own} incident(s) at this site in 180 days` },
      { key: "neighbours", label: "Neighbouring-site incidents", contribution: Math.min(20, neighbours * 4), detail: `${neighbours} incident(s) within 15 km in 30 days` },
      { key: "assets", label: "Asset attractiveness", contribution: s.siteClass === "Hub" ? 10 : s.siteClass === "P1" ? 8 : 5, detail: s.siteClass === "Hub" ? "Large lithium bank + 2 generators" : "Lithium battery bank, diesel generator" },
      { key: "response", label: "Response distance", contribution: Math.min(12, Math.max(0, s.nearestTeamEtaMin - 10)), detail: `Nearest team ETA ${s.nearestTeamEtaMin} min` },
      { key: "area", label: "Local threat level", contribution: Math.round(meta.riskBase * 0.5), detail: `${s.state} threat index` },
      { key: "time", label: "Time / day", contribution: 6, detail: "Next 72 h include two weekend nights (peak 01:00–04:00)" },
    ];
    if (distanceKm(s.location, v17Front) < 40) f.push({ key: "campaign", label: "Active campaign proximity", contribution: 16, detail: "Within 40 km of Campaign V-17's leading edge" });
    if (!s.cctvOnline || s.backhaul !== "primary") f.push({ key: "sensors", label: "Sensor / backhaul anomaly", contribution: 8, detail: !s.cctvOnline ? "Camera offline" : "Running on secondary backhaul" });
    if (visits.some((v) => v.siteId === s.id && v.flags.length)) f.push({ key: "access", label: "Unusual access pattern", contribution: 10, detail: "Flagged visit in last 30 days" });
    return f.filter((x) => x.contribution > 0).sort((a, b) => b.contribution - a.contribution);
  };
  for (const s of sites) s.riskScore = Math.min(99, riskFactorsFor(s).reduce((a, x) => a + x.contribution, 0));
  const band = (score: number): RiskForecast["band"] => (score >= 80 ? "Critical" : score >= 66 ? "High" : score >= 52 ? "Elevated" : score >= 38 ? "Moderate" : "Low");
  const recsFor = (f: RiskFactor[]): string[] => {
    const out = new Set<string>();
    for (const x of f.slice(0, 4)) {
      if (x.key === "campaign" || x.key === "neighbours") { out.add("Increase patrol frequency"); out.add("Pre-position response team"); }
      if (x.key === "history" || x.key === "time") out.add("Increase AI sensitivity");
      if (x.key === "sensors") out.add("Activate enhanced sensor profile");
      if (x.key === "assets") out.add("Inspect fence");
      if (x.key === "access") out.add("Audit contractor access");
      if (x.key === "response") out.add("Pre-position response team");
    }
    return [...out];
  };
  const forecasts: RiskForecast[] = [...sites].sort((a, b) => b.riskScore - a.riskScore).slice(0, 80).map((s) => {
    const factors = riskFactorsFor(s);
    return { siteId: s.id, siteName: s.name, state: s.state, location: s.location, score: s.riskScore, band: band(s.riskScore), factors, recommendations: recsFor(factors) };
  });

  // ── Protection health per site ───────────────────────────────────────
  for (const s of sites) {
    let score = 100;
    if (!s.cctvOnline) score -= 30;
    if (s.backhaul === "secondary") score -= 12;
    if (s.backhaul === "down") score -= 45;
    if (s.status === "maintenance") score -= 10;
    score -= int(0, 6);
    s.protectionScore = Math.max(0, score);
    s.protectionState = (score >= 92 ? "FULLY PROTECTED" : score >= 70 ? "DEGRADED BUT OPERATIONAL" : score >= 40 ? "PROTECTION AT RISK" : "UNPROTECTED") as ProtectionState;
  }

  // ── Case files ─────────────────────────────────────────────────────────
  const cases: CaseFile[] = [];
  const courts = ["Federal High Court, Kaduna", "Federal High Court, Abuja", "Federal High Court, Lagos", "Federal High Court, Port Harcourt", "Magistrate Court, Wuse", "Chief Magistrate Court, Ikeja"];
  const caseable = incidents.filter((i) => i.outcome !== "false_alarm" && (i.status === "closed" || i.id === featured.id));
  let caseSeq = 400;
  const stageOrder: CaseStage[] = ["incident", "investigation", "suspect", "arrest", "police_case", "charge", "court", "judgment", "sentence", "asset_recovery", "closed"];
  for (const inc of caseable) {
    if (!(inc.id === featured.id || inc.campaignId || inc.insiderRisk || inc.outcome === "theft_completed" || chance(0.25))) continue;
    const ageDays = (nowMs - new Date(inc.detectedAt).getTime()) / 86400000;
    const maxStage = Math.min(stageOrder.length - 1, Math.floor(ageDays / 14) + (chance(0.4) ? 1 : 0));
    const stageIdx = inc.id === featured.id ? 1 : Math.max(1, Math.min(maxStage, Math.floor(r() * (maxStage + 1))));
    const stage = stageOrder[stageIdx];
    const stageDates: Partial<Record<CaseStage, string>> = {};
    for (let k = 0; k <= stageIdx; k++) stageDates[stageOrder[k]] = isoAt(new Date(inc.detectedAt).getTime() + (k === 0 ? 0 : (ageDays * 86400000 * k) / (stageIdx + 1)));
    const id = `ECF-2026-${String(++caseSeq).padStart(5, "0")}`;
    const t0 = new Date(inc.detectedAt).getTime();
    const withEvidence = inc.id === featured.id || cases.length < 60;
    const evidence: EvidenceItem[] = withEvidence ? ([
      ["original_footage", "Original footage — Camera 1", "CAM-1"], ["event_clip", "Event clip (radar-triggered, 90 s)", "CAM-1"], ["still", "Still — subject at fence", "CAM-1"],
      ["sensor_log", "Fused sensor log", "ITIPS edge"], ["ai_classification", "AI classification record", "Jetson edge AI"], ["gps_record", "Response team GPS track", "Fleet GPS"],
      ["access_log", "Site access log", "Access control"], ...(stageIdx >= 2 ? [["statement", "Responder statement", "Case desk"]] : []), ...(inc.recoveredNaira ? [["recovered_asset", "Recovered asset record", "Case desk"]] : []),
    ] as [EvidenceItem["kind"], string, string][]).map(([kind, title, device], k) => ({
      id: `${id}-E${String(k + 1).padStart(2, "0")}`, kind, title, capturedAt: isoAt(t0 + k * 2000), device: `${device} · ${inc.siteId}`, sha256: hex(64), verified: chance(0.97),
      custody: [{ at: isoAt(t0 + k * 2000), actor: "ITIPS edge", action: "Captured & hashed" }, { at: isoAt(t0 + 60_000), actor: "ITIPS vault", action: "Ingested" }, ...(stageIdx >= 4 ? [{ at: isoAt(t0 + 6 * 86400000), actor: "Police IPO", action: "Copy exported to police case file" }] : [])],
      preview: kind === "still" || kind === "original_footage" || kind === "event_clip" ? pick(IMAGES) : undefined,
    })) : [];
    cases.push({
      id, incidentId: inc.id, siteId: inc.siteId, title: `${inc.title.replace("ACTIVE ", "")} — ${inc.siteName}`, stage, stageDates,
      policeRef: stageIdx >= 4 ? `NPF/${inc.state.slice(0, 3).toUpperCase()}/${int(1000, 9999)}/26` : null,
      court: stageIdx >= 6 ? pick(courts) : null,
      suspects: stageIdx >= 2 ? Array.from({ length: int(1, 3) }, () => ({ name: chance(0.7) ? person() : "Unidentified", status: stageIdx >= 3 ? pick(["arrested", "charged", "remanded", "on bail"]) : "identified" })) : [],
      evidence, recoveredNaira: inc.recoveredNaira, owner: `${pick(["Security analyst", "Investigations lead"])} ${person()}`,
      nextAction: ["Review footage", "Identify suspects", "Locate suspect", "File police report", "Await charge", "Prepare court bundle", "Next hearing", "Await judgment", "Recover assets", "Close file", "—"][stageIdx],
    });
    inc.caseId = id;
  }
  const reached = (s: CaseStage) => cases.filter((c) => c.stageDates[s]).length;
  const caseKpis: CaseKpis = {
    incidents: incidents.filter((i) => i.outcome !== "false_alarm").length,
    investigations: reached("investigation"),
    arrests: cases.filter((c) => c.stageDates.arrest).reduce((a, c) => a + Math.max(1, c.suspects.length), 0),
    charged: reached("charge"),
    activeCourtCases: cases.filter((c) => ["court", "judgment"].includes(c.stage)).length,
    convictions: reached("sentence"),
    assetsRecoveredNaira: incidents.reduce((a, i) => a + i.recoveredNaira, 0),
  };

  // ── Monthly business impact (6 months) ───────────────────────────────
  const impact: MonthlyImpact[] = [];
  for (let m = 5; m >= 0; m--) {
    const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - m, 1));
    const key = d.toISOString().slice(0, 7);
    const list = incidents.filter((i) => i.detectedAt.startsWith(key));
    const sum = (t: IncidentType[]) => list.filter((i) => t.includes(i.type)).reduce((a, i) => a + i.lossNaira, 0);
    const verified = list.filter((i) => i.outcome !== "false_alarm");
    const disrupted = list.filter((i) => i.outcome === "disrupted");
    impact.push({
      month: key,
      losses: { batteries: sum(["battery_theft"]), generators: sum(["generator_theft"]), diesel: sum(["diesel_theft"]), cables: sum(["cable_theft", "vandalism"]), solar: sum(["solar_theft"]), restoration: Math.round(list.reduce((a, i) => a + i.downtimeMin, 0) * 4_200) },
      downtimeHours: Math.round(list.reduce((a, i) => a + i.downtimeMin, 0) / 60),
      intrusionsDetected: list.length * 4 + int(20, 60),
      verifiedAttacks: verified.length,
      attacksDisrupted: disrupted.length,
      recoveredNaira: list.reduce((a, i) => a + i.recoveredNaira, 0),
      avoidedLossNaira: disrupted.reduce((a, i) => a + (LOSS_RANGE[i.type][0] + LOSS_RANGE[i.type][1]) / 2, 0),
      downtimeAvoidedHours: Math.round(disrupted.length * 3.4),
      incidents: list.length,
    });
  }

  // ── KPIs ────────────────────────────────────────────────────────────
  const dayAgo = nowMs - DAY * 1000;
  const last30 = incidents.filter((i) => nowMs - new Date(i.detectedAt).getTime() < 30 * DAY * 1000 && i.response.stages.arrived);
  const respSecs = last30.map((i) => (new Date(i.response.stages.arrived!).getTime() - new Date(i.detectedAt).getTime()) / 1000);
  const kpis: OverviewKpis = {
    protectedSites: sites.length,
    fullyOperational: sites.filter((s) => s.status === "normal").length,
    degraded: sites.filter((s) => s.status === "warning" || s.status === "maintenance" || (s.status === "normal" && s.protectionState !== "FULLY PROTECTED")).length,
    offline: sites.filter((s) => s.status === "offline").length,
    activeAlerts: active.length + sites.filter((s) => s.status === "warning").length,
    criticalIncidents: active.filter((i) => i.severity === "critical").length,
    teamsDispatched: active.filter((i) => ["dispatched", "en_route", "on_site"].includes(i.status)).length,
    respondersOnSite: teams.filter((t) => t.status === "on_site").reduce((a, t) => a + t.crew.length, 0),
    resolvedToday: incidents.filter((i) => i.closedAt && new Date(i.closedAt).getTime() > dayAgo).length + active.filter((i) => i.status === "secured").length,
    cctvAvailabilityPct: Math.round((sites.filter((s) => s.cctvOnline).length / sites.length) * 1000) / 10,
    connectivityPct: Math.round((sites.filter((s) => s.backhaul !== "down").length / sites.length) * 1000) / 10,
    avgResponseSec: respSecs.length ? Math.round(respSecs.reduce((a, b) => a + b, 0) / respSecs.length) : 0,
    slaCompliancePct: last30.length ? Math.round((last30.filter((i) => !i.response.breached).length / last30.length) * 1000) / 10 : 100,
  };

  const pct = (a: number, b: number) => (b ? Math.round(((a - b) / b) * 1000) / 10 : 0);
  // Month-to-date vs the same days of last month, so a partial month isn't compared with a full one
  const mtdStart = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1);
  const prevStart = Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 1, 1);
  const prevEnd = prevStart + (nowMs - mtdStart);
  // Period comparisons use closed incidents only; live ones are still unfolding
  const inMtd = (i: Incident) => { const t = new Date(i.detectedAt).getTime(); return t >= mtdStart && i.status === "closed"; };
  const inPrev = (i: Incident) => { const t = new Date(i.detectedAt).getTime(); return t >= prevStart && t < prevEnd && i.status === "closed"; };
  const sumBy = (f: (i: Incident) => boolean, v: (i: Incident) => number) => incidents.filter(f).reduce((a, i) => a + v(i), 0);
  const countBy = (f: (i: Incident) => boolean) => incidents.filter(f).length;
  const avoided = (i: Incident) => (i.outcome === "disrupted" ? (LOSS_RANGE[i.type][0] + LOSS_RANGE[i.type][1]) / 2 : 0);
  const curTheft = countBy((i) => inMtd(i) && i.outcome === "theft_completed");
  const prevTheft = countBy((i) => inPrev(i) && i.outcome === "theft_completed");
  const curIncidents = countBy(inMtd);
  const prevIncidents = countBy(inPrev);
  const curLoss = sumBy(inMtd, (i) => i.lossNaira) + sumBy(inMtd, (i) => i.downtimeMin * 4_200);
  const prevLoss = sumBy(inPrev, (i) => i.lossNaira) + sumBy(inPrev, (i) => i.downtimeMin * 4_200);
  const curAvoided = sumBy(inMtd, avoided);
  const prevAvoided = sumBy(inPrev, avoided);
  const k = (key: string, label: string, value: number, unit: Kpi["unit"], betterWhen: Kpi["betterWhen"], extra: Partial<Kpi> = {}): Kpi => ({ key, label, value, unit, betterWhen, ...extra });
  const hubs = sites.filter((s) => s.siteClass === "Hub" || s.siteClass === "P1");
  const scorecard: Scorecard = {
    security: [
      k("vandalism", "Vandalism incidents (closed, MTD)", curIncidents, "count", "lower", { delta: pct(curIncidents, prevIncidents) }),
      k("theft", "Successful theft", curTheft, "count", "lower", { delta: pct(curTheft, prevTheft) }),
      k("mean_response", "Mean response", kpis.avgResponseSec, "seconds", "lower", { target: 1200 }),
      k("critical_protection", "Critical-site protection", Math.round((hubs.filter((s) => s.protectionState === "FULLY PROTECTED").length / hubs.length) * 1000) / 10, "%", "higher", { target: 99 }),
    ],
    operations: [
      k("camera_uptime", "Camera uptime", kpis.cctvAvailabilityPct, "%", "higher", { target: 99 }),
      k("connectivity", "Connectivity", kpis.connectivityPct, "%", "higher", { target: 99.5 }),
      k("alert_delivery", "Alert delivery", 99.4, "%", "higher", { target: 99 }),
      k("pm_compliance", "PM compliance", 98.8, "%", "higher", { target: 98 }),
    ],
    financial: [
      k("losses_month", "Losses this month", curLoss, "naira", "lower", { delta: pct(curLoss, prevLoss) }),
      k("avoided_month", "Avoided loss this month", curAvoided, "naira", "higher", { delta: pct(curAvoided, prevAvoided) }),
      k("cost_per_site", "Security cost / site / month", 185_000, "naira", "lower"),
      // Security spend this month ÷ attacks disrupted this month
      k("cost_per_prevented", "Cost per prevented incident", Math.round((185_000 * sites.length * ((nowMs - mtdStart) / (30 * DAY * 1000))) / Math.max(1, countBy((i) => inMtd(i) && i.outcome === "disrupted"))), "naira", "lower"),
    ],
    enforcement: [
      k("open_investigations", "Open investigations", cases.filter((c) => ["investigation", "suspect"].includes(c.stage)).length, "count", "lower"),
      k("arrests", "Arrests", caseKpis.arrests, "count", "higher"),
      k("prosecutions", "Prosecutions", caseKpis.charged, "count", "higher"),
      k("convictions", "Convictions", caseKpis.convictions, "count", "higher"),
    ],
    contract: [
      k("sow_camera_uptime", "Camera uptime", kpis.cctvAvailabilityPct, "%", "higher", { target: 99 }),
      k("sow_platform", "Platform availability", 99.95, "%", "higher", { target: 99.9 }),
      k("sow_connectivity", "Connectivity", kpis.connectivityPct, "%", "higher", { target: 99.5 }),
      k("sow_alert_delivery", "Alert delivery (< 60 s)", 99.4, "%", "higher", { target: 99 }),
      k("sow_mttr", "Maintenance MTTR", 4.6, "hours", "lower", { target: 8 }),
      k("sow_response", "Armed response time", kpis.avgResponseSec, "seconds", "lower", { target: 1200 }),
    ],
  };

  // Keep the payload lean: historical incidents without a case file don't need
  // their escalation chain or per-signal fusion breakdown
  for (const inc of incidents) {
    if (inc.status !== "closed") continue;
    inc.escalation = [];
    if (!inc.caseId && !inc.campaignId && !inc.insiderRisk) inc.fusion = { ...inc.fusion, signals: [] };
  }
  const round = (p: GeoPoint) => ({ lat: Math.round(p.lat * 1e4) / 1e4, lng: Math.round(p.lng * 1e4) / 1e4 });
  for (const s of sites) s.location = round(s.location);
  for (const i of incidents) { i.location = round(i.location); i.response.gpsTrack = i.response.gpsTrack.map(round); }

  const snapshot: OpsSnapshot = {
    generatedAt: isoAt(nowMs),
    operatorName: "ATC Nigeria",
    kpis,
    sites,
    clusters,
    teams,
    incidents,
    visits,
    insiderSubjects,
    campaigns,
    patterns,
    forecasts,
    cases,
    caseKpis,
    impact,
    scorecard,
  };
  siteRiskFactors.set(snapshot, new Map(sites.map((s) => [s.id, riskFactorsFor(s)])));
  return snapshot;
}

export { SLA_SEC, TYPE_TITLE, LOSS_RANGE };
