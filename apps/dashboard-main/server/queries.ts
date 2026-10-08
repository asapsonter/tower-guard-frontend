/**
 * On-demand queries over the operator snapshot: the per-site Digital Twin,
 * global "Search Anything" and the smart-dispatch recommendation.
 */
import type {
  AssetKind, AssetStatus, Camera, DispatchRecommendation, FusionAssessment, HealthComponent, OpsSnapshot, SearchHit,
  Sensor, SensorKind, SiteAsset, SiteDetail, SiteEvent, SiteHealth, Tenant, TowerType,
} from "./types.js";
import { CONTRACTORS, mulberry32, siteRiskFactors } from "./seed.js";
import { distanceKm, STATES } from "./geo.js";

function hashSeed(id: string) {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619);
  return h >>> 0;
}

const ASSET_LABEL: Record<AssetKind, string> = {
  tower: "Tower", generator: "Generator", battery: "Battery bank", diesel: "Diesel tank", solar: "Solar system",
  shelter: "Shelter", feeder: "Feeder cables", gate: "Gate", cabinet: "Security cabinet", itips: "ITIPS equipment",
};

/** Builds the full Site Security Digital Twin for one site. Deterministic per site id. */
export function buildSiteDetail(snap: OpsSnapshot, siteId: string, nowMs: number): SiteDetail | null {
  const site = snap.sites.find((s) => s.id === siteId);
  if (!site) return null;
  const r = mulberry32(hashSeed(site.id));
  const int = (lo: number, hi: number) => Math.floor(lo + r() * (hi - lo + 1));
  const pick = <T,>(a: readonly T[]): T => a[Math.floor(r() * a.length)];
  const chance = (p: number) => r() < p;
  const ago = (sec: number) => new Date(nowMs - sec * 1000).toISOString();

  const incident = site.activeIncidentId ? snap.incidents.find((i) => i.id === site.activeIncidentId) ?? null : null;
  const target = incident?.targetAsset;
  const towerType: TowerType = pick(["Greenfield lattice", "Greenfield lattice", "Monopole", "Rooftop", "Guyed mast", "Camouflage"]);
  const soc = site.status === "offline" ? int(5, 25) : int(55, 99);
  const team = snap.teams.find((t) => t.id === site.nearestTeamId)!;
  const meta = STATES.find((s) => s.state === site.state)!;

  const statusFor = (kind: AssetKind): AssetStatus => {
    if (incident && target === kind) return incident.status === "secured" ? "tamper" : "intrusion";
    if (incident && kind === "gate" && incident.fusion.signals.some((s) => /gate opened/i.test(s.finding))) return "tamper";
    if (incident && kind === "cabinet" && /battery|cabinet/i.test(incident.modus.join(" "))) return "tamper";
    if (site.status === "maintenance" && (kind === "generator" || kind === "itips")) return "maintenance";
    if (site.status === "offline" && (kind === "itips" || kind === "battery")) return "offline";
    if (kind === "itips" && site.protectionState !== "FULLY PROTECTED") return "warning";
    return chance(0.05) ? "warning" : "healthy";
  };
  const assets: SiteAsset[] = ([
    ["tower", `${towerType} · ${site.siteClass === "Hub" ? int(55, 72) : int(30, 54)} m · ${site.tenants.length} tenant(s)`, 0],
    ["generator", `${pick(["Perkins", "Mikano", "FG Wilson", "Cummins"])} ${pick([15, 20, 27, 40])} kVA · ${int(800, 9800)} run-hours`, int(6, 14) * 1_000_000],
    ["battery", `48V · ${pick([8, 12, 16])} × ${pick([100, 150, 200])}Ah Li-ion · SOC ${soc}%`, int(4, 12) * 1_000_000],
    ["diesel", `${pick([1000, 1500, 2000])} L tank · ${int(18, 92)}% full`, int(3, 9) * 100_000],
    ["solar", `${pick([4, 6, 8, 10])} kWp array · ${site.status === "offline" ? 0 : int(200, 3800)} W now`, int(2, 6) * 1_000_000],
    ["shelter", `${pick(["Outdoor cabinet", "Prefab shelter", "Brick shelter"])} · door ${incident?.targetAsset === "shelter" ? "OPEN" : "closed"}`, int(2, 5) * 1_000_000],
    ["feeder", `${int(6, 18)} feeder runs · ${int(40, 80)} m`, int(6, 20) * 100_000],
    ["gate", `Steel gate · smart lock · ${incident ? "alarm" : "locked"}`, 450_000],
    ["cabinet", `Security cabinet · vibration + door contact`, 300_000],
    ["itips", `Edge AI + ${site.siteClass === "Hub" ? 4 : 3} cameras + radar + 9 sensors`, 3_800_000],
  ] as [AssetKind, string, number][]).map(([kind, detail, valueNaira]) => {
    const status = statusFor(kind);
    return { kind, label: ASSET_LABEL[kind], status, detail, valueNaira, lastEvent: status !== "healthy" && incident ? `${incident.id} · ${incident.title.toLowerCase()}` : undefined };
  });

  const camCount = site.siteClass === "Hub" ? 4 : 3;
  const cameras: Camera[] = Array.from({ length: camCount }, (_, i) => ({
    id: `CAM-${site.id.slice(4)}-${String(i + 1).padStart(2, "0")}`,
    label: ["Perimeter · north fence", "Thermal · compound", "Gate & shelter", "PTZ · tower base"][i],
    type: (["optical", "thermal", "optical", "ptz"] as const)[i],
    online: site.cctvOnline || i > 0 ? site.status !== "offline" : false,
    fps: i === 1 ? 12 : 24,
    bitrateKbps: int(1800, 4200),
    view: [{ mode: "night", panX: 300, zoom: 1 }, { mode: "thermal", panX: 380, zoom: 1.2 }, { mode: "mono", panX: 600, zoom: 1.15 }, { mode: "night", panX: 520, zoom: 1.4 }][i] as Camera["view"],
  }));

  const trig = (kinds: SensorKind[], k: SensorKind) => !!incident && incident.status !== "secured" && kinds.includes(k);
  const fired: SensorKind[] = incident ? ["mmwave_radar", "pir", ...(incident.fusion.signals.some((s) => /fence vibration detected/i.test(s.finding)) ? ["fence_vibration" as SensorKind] : []), ...(incident.targetAsset === "battery" ? ["battery_movement" as SensorKind, "cabinet_vibration" as SensorKind] : [])] : [];
  const sensorDefs: [SensorKind, string, string, string][] = [
    ["mmwave_radar", "mmWave radar", "Perimeter", incident ? "2 tracks · 34 m" : "No tracks"],
    ["pir", "PIR", "Zone 1–3", incident ? "Motion" : "Clear"],
    ["fence_vibration", "Fence vibration", "North fence", incident ? "2.6g peak" : "0.1g"],
    ["door_contact", "Shelter door contact", "Shelter", "Closed"],
    ["gate_contact", "Gate contact", "Main gate", "Closed"],
    ["cabinet_vibration", "Cabinet vibration", "Battery cabinet", incident?.targetAsset === "battery" ? "Forced-entry signature" : "Still"],
    ["battery_movement", "Battery-bank movement", "Battery cabinet", incident?.targetAsset === "battery" ? "Modules displaced" : "Static"],
    ["fuel_level", "Diesel / fuel level", "Tank", incident?.targetAsset === "diesel" ? "−142 L in 9 min" : `${int(20, 90)}%`],
    ["smoke", "Smoke / fire", "Shelter", "Clear"],
    ["temperature", "Temperature", "Shelter", `${int(27, 41)} °C`],
    ["power", "Power status", "Rectifier", site.status === "offline" ? "Mains off · battery low" : pick(["Grid", "Generator", "Battery", "Solar + battery"])],
  ];
  const sensors: Sensor[] = sensorDefs.map(([kind, label, zone, reading], i) => ({
    id: `SEN-${site.id.slice(4)}-${String(i + 1).padStart(2, "0")}`,
    kind, label, zone, reading,
    status: site.status === "offline" ? "offline" : trig(fired, kind) ? "triggered" : chance(0.03) ? "fault" : "normal",
    lastChange: incident && fired.includes(kind) ? incident.detectedAt : ago(int(600, 86400 * 3)),
  }));

  const camerasOnline = cameras.filter((c) => c.online).length;
  const sensorsHealthy = Math.round((sensors.filter((s) => s.status === "normal" || s.status === "triggered").length / sensors.length) * 100);
  const sim1Up = site.backhaul === "primary";
  const sim2Up = site.backhaul !== "down";
  const storageFree = int(48, 91);
  const firmwareLatest = "ITIPS 4.2.1";
  const firmware = chance(0.85) ? firmwareLatest : "ITIPS 4.1.7";
  const comp = (key: HealthComponent["key"], label: string, score: number, detail: string): HealthComponent => ({ key, label, score, status: score >= 90 ? "ok" : score >= 50 ? "degraded" : "down", detail });
  const components: HealthComponent[] = [
    comp("cctv", "CCTV", Math.round((camerasOnline / cameras.length) * 100), `${camerasOnline}/${cameras.length} cameras online`),
    comp("sensors", "Sensors", sensorsHealthy, `${sensors.filter((s) => s.status === "fault").length} fault(s)`),
    comp("backhaul", "Backhaul", sim1Up ? 100 : sim2Up ? 70 : 0, sim1Up ? "Primary active" : sim2Up ? "Primary unavailable / Secondary active" : "Both links down"),
    comp("edge_ai", "Edge AI", site.status === "offline" ? 0 : 100, site.status === "offline" ? "No heartbeat" : "Healthy · Jetson heartbeat OK"),
    comp("power", "Battery", soc, `SOC ${soc}%`),
    comp("storage", "Storage", storageFree, `${storageFree}% available`),
    comp("tamper", "Cabinet tamper", incident && incident.targetAsset === "battery" ? 40 : 100, incident && incident.targetAsset === "battery" ? "Tamper switch tripped" : "Sealed"),
    comp("vms", "VMS link", site.status === "offline" ? 0 : 100, site.status === "offline" ? "Disconnected" : "Connected"),
  ];
  const health: SiteHealth = {
    cameras: cameras.map((c) => ({ id: c.id, online: c.online })),
    jetsonHeartbeatSec: site.status === "offline" ? int(1800, 7200) : int(1, 20),
    router: sim1Up ? "ok" : sim2Up ? "degraded" : "down",
    sim1: { carrier: site.tenants[0] as Tenant, signalDbm: sim1Up ? -int(65, 95) : -120, up: sim1Up },
    sim2: { carrier: (site.tenants[1] ?? (site.tenants[0] === "MTN" ? "Airtel" : "MTN")) as Tenant, signalDbm: sim2Up ? -int(70, 100) : -120, up: sim2Up },
    latencyMs: sim1Up ? int(38, 120) : sim2Up ? int(140, 380) : 0,
    storageFreePct: storageFree,
    batterySocPct: soc,
    solarChargingW: site.status === "offline" ? 0 : int(150, 3600),
    sensorsHealthyPct: sensorsHealthy,
    cabinetTamper: !!incident && incident.targetAsset === "battery",
    firmware,
    firmwareLatest,
    vmsConnected: site.status !== "offline",
    components,
    protectionScore: site.protectionScore,
    protectionState: site.protectionState,
  };

  const recentEvents: SiteEvent[] = [
    ...(incident ? incident.timeline.slice(-6).map((t): SiteEvent => ({ at: t.at, source: t.source, label: t.label, severity: "critical" })) : []),
    { at: ago(int(3600, 20000)), source: "system" as const, label: "Daily self-test passed", severity: "info" as const },
    { at: ago(int(20000, 80000)), source: "access" as const, label: "Authorised visit closed", severity: "info" as const },
    ...(site.backhaul === "secondary" ? [{ at: ago(int(600, 9000)), source: "system" as const, label: "Failover to secondary backhaul", severity: "warning" as const }] : []),
    ...(!site.cctvOnline ? [{ at: ago(int(600, 9000)), source: "camera" as const, label: "Camera 1 offline", severity: "warning" as const }] : []),
  ].sort((a, b) => b.at.localeCompare(a.at));

  const fusion: FusionAssessment | null = incident?.fusion ?? null;
  const nearestKm = Math.round(distanceKm(team.location, site.location) * 1.3 * 10) / 10;

  return {
    ...site,
    address: `${site.name.replace(/ (Site|Hub)$/, "")}, ${site.state === "FCT" ? "Abuja" : site.state}`,
    lga: meta.areas[0],
    riskClass: site.riskScore >= 70 ? "Very high" : site.riskScore >= 50 ? "High" : site.riskScore >= 30 ? "Medium" : "Low",
    towerType,
    towerHeightM: site.siteClass === "Hub" ? int(55, 72) : int(30, 54),
    criticalAssets: ["Lithium battery bank", "Diesel generator", ...(site.siteClass === "Hub" ? ["Fibre aggregation", "Microwave hub"] : []), "Feeder cables"],
    maintenanceContractor: pick(CONTRACTORS),
    responseCluster: snap.clusters.find((c) => c.id === site.clusterId)?.name ?? site.clusterId,
    nearestTeam: { id: team.id, callsign: team.callsign, distanceKm: nearestKm, etaMin: site.nearestTeamEtaMin, status: team.status },
    assets,
    cameras,
    sensors,
    health,
    recentEvents,
    recentVisits: snap.visits.filter((v) => v.siteId === site.id).slice(0, 10),
    incidentHistory: snap.incidents.filter((i) => i.siteId === site.id).slice(0, 10).map((i) => ({ id: i.id, at: i.detectedAt, type: i.type, outcome: i.outcome })),
    riskFactors: siteRiskFactors.get(snap)?.get(site.id) ?? [],
    fusion,
  };
}

/** Search Anything — sites, incidents, people, vehicles, contractors, cases, teams, campaigns. */
export function searchAll(snap: OpsSnapshot, q: string): SearchHit[] {
  const needle = q.trim().toLowerCase();
  if (needle.length < 2) return [];
  const hits: SearchHit[] = [];
  const has = (...xs: (string | null | undefined)[]) => xs.some((x) => x?.toLowerCase().includes(needle));
  for (const s of snap.sites) if (has(s.id, s.name, s.state, s.clusterId)) hits.push({ kind: "site", id: s.id, label: `${s.id} · ${s.name}`, detail: `${s.state} · ${s.siteClass} · ${s.status}`, link: `/sites/${s.id}` });
  for (const i of snap.incidents) if (has(i.id, i.siteId, i.siteName, i.title)) hits.push({ kind: "incident", id: i.id, label: `${i.id} · ${i.title}`, detail: `${i.siteName} · ${i.state} · ${i.status}`, link: `/incidents/${i.id}` });
  const people = new Map<string, { employer: string; visits: number }>();
  for (const v of snap.visits) if (has(v.person, v.employer)) { const p = people.get(v.person) ?? { employer: v.employer, visits: 0 }; p.visits++; people.set(v.person, p); }
  for (const [name, p] of people) if (name.toLowerCase().includes(needle)) hits.push({ kind: "person", id: name, label: name, detail: `${p.employer} · ${p.visits} site visit(s)`, link: `/access?q=${encodeURIComponent(name)}` });
  const contractors = new Set(snap.visits.map((v) => v.employer));
  for (const c of contractors) if (c.toLowerCase().includes(needle)) hits.push({ kind: "contractor", id: c, label: c, detail: `${snap.visits.filter((v) => v.employer === c).length} visits on record`, link: `/access?q=${encodeURIComponent(c)}` });
  const plates = new Set([...snap.incidents.flatMap((i) => i.vehiclePlates), ...snap.visits.map((v) => v.vehiclePlate)]);
  for (const p of plates) if (p.toLowerCase().includes(needle)) hits.push({ kind: "vehicle", id: p, label: p, detail: `${snap.incidents.filter((i) => i.vehiclePlates.includes(p)).length} incident(s) · ${snap.visits.filter((v) => v.vehiclePlate === p).length} visit(s)`, link: `/intelligence?vehicle=${encodeURIComponent(p)}` });
  for (const c of snap.cases) if (has(c.id, c.title, c.policeRef)) hits.push({ kind: "case", id: c.id, label: `${c.id} · ${c.title}`, detail: `Stage: ${c.stage.replace(/_/g, " ")}`, link: `/cases/${c.id}` });
  for (const t of snap.teams) if (has(t.id, t.callsign)) hits.push({ kind: "team", id: t.id, label: `${t.callsign} (${t.id})`, detail: `${t.provider} · ${t.status}`, link: `/response?team=${t.id}` });
  for (const c of snap.campaigns) if (has(c.id, c.name)) hits.push({ kind: "campaign", id: c.id, label: c.name, detail: `${c.siteIds.length} sites · ${c.trend}`, link: `/intelligence?campaign=${c.id}` });
  return hits.slice(0, 40);
}

/** Nearest available armed team; advice only — the NOC approves. */
export function recommendTeam(snap: OpsSnapshot, incidentId: string): DispatchRecommendation | null {
  const inc = snap.incidents.find((i) => i.id === incidentId);
  if (!inc) return null;
  const scored = snap.teams
    .filter((t) => t.status === "available")
    .map((t) => {
      const km = Math.round(distanceKm(t.location, inc.location) * 1.3 * 10) / 10;
      const armed = t.crew.filter((c) => c.armed).length;
      const problems: string[] = [];
      if (armed < 2) problems.push(`only ${armed} armed officer(s)`);
      if (km > 60) problems.push("outside 60 km cluster radius");
      return { t, km, eta: Math.round(90 + (km / 45) * 3600), problems };
    })
    .sort((a, b) => a.eta - b.eta);
  const best = scored.find((s) => !s.problems.length);
  if (!best) return null;
  return {
    incidentId: inc.id,
    teamId: best.t.id,
    callsign: best.t.callsign,
    distanceKm: best.km,
    etaSeconds: best.eta,
    rationale: [
      `Shortest ETA among available teams with ≥ 2 armed officers`,
      `${best.t.provider} · ${best.t.vehicle.type} ${best.t.vehicle.plate}`,
      `Predicted arrival ${Math.round(best.eta / 60)} min vs 20 min SLA`,
    ],
    alternatives: scored.filter((s) => s !== best).slice(0, 4).map((s) => ({
      teamId: s.t.id, callsign: s.t.callsign, distanceKm: s.km, etaSeconds: s.eta,
      reasonNotTop: s.problems.length ? s.problems.join(", ") : `ETA ${Math.round((s.eta - best.eta) / 60)} min longer`,
    })),
  };
}
